import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';

// Server-side Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
  telemetry: false,
  appInfo: {
    name: 'CPA Platform',
    version: '1.0.0',
    url: 'https://cpa-platform.com',
  },
});

// Client-side Stripe Promise
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      {
        apiVersion: '2023-10-16',
      }
    );
  }
  return stripePromise;
};

// Webhook signature verification
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

// Error handling utilities
export class StripeError extends Error {
  public code?: string;
  public type?: string;
  public statusCode?: number;

  constructor(error: Stripe.StripeError) {
    super(error.message);
    this.name = 'StripeError';
    this.code = error.code;
    this.type = error.type;
    this.statusCode = error.statusCode;
  }
}

export const handleStripeError = (error: any): StripeError => {
  if (error.type && error.type.startsWith('Stripe')) {
    return new StripeError(error);
  }

  // Generic error handling
  return new StripeError({
    type: 'api_error',
    message: error.message || 'An unknown error occurred',
    statusCode: 500,
  } as Stripe.StripeError);
};

// Retry configuration for resilient operations
export const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  config = retryConfig
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxRetries) {
        throw handleStripeError(error);
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      console.warn(`Stripe operation failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw handleStripeError(lastError!);
};

// Helper function to format amounts for Stripe (cents)
export const formatAmountForStripe = (amount: number, currency: string = 'usd'): number => {
  // Zero-decimal currencies (e.g., JPY, KRW)
  const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

// Helper function to format amounts from Stripe (dollars)
export const formatAmountFromStripe = (amount: number, currency: string = 'usd'): number => {
  const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }

  return amount / 100;
};

// Rate limiting helper
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 100, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async checkRateLimit(): Promise<boolean> {
    const now = Date.now();

    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  async waitForRateLimit(): Promise<void> {
    while (!(await this.checkRateLimit())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export const stripeLimiter = new RateLimiter();

// Environment-specific configuration
export const stripeConfig = {
  webhookSecret: isProduction
    ? process.env.STRIPE_WEBHOOK_SECRET_PROD!
    : process.env.STRIPE_WEBHOOK_SECRET_DEV!,
  returnUrl: isProduction
    ? process.env.NEXT_PUBLIC_APP_URL!
    : 'http://localhost:3000',
  currency: 'usd',
  country: 'US',
  paymentMethods: ['card', 'us_bank_account'] as Stripe.PaymentMethodCreateParams.Type[],
};

// PCI compliance helpers
export const createSecureCustomer = async (
  email: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> => {
  await stripeLimiter.waitForRateLimit();

  return withRetry(async () => {
    return stripe.customers.create({
      email,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
        platform: 'cpa-platform',
      },
    });
  });
};

export const getSecureCustomer = async (customerId: string): Promise<Stripe.Customer> => {
  await stripeLimiter.waitForRateLimit();

  return withRetry(async () => {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }
    return customer as Stripe.Customer;
  });
};