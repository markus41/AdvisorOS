import Stripe from 'stripe';
import { stripe, withRetry, stripeLimiter, formatAmountForStripe, formatAmountFromStripe } from '../stripe/stripe-client';

// Payment interfaces
export interface PaymentMethodData {
  id: string;
  customerId: string;
  type: Stripe.PaymentMethod.Type;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: string;
  };
  bankAccount?: {
    routingNumber: string;
    last4: string;
    bankName?: string;
    accountType: string;
  };
  isDefault: boolean;
  metadata: Record<string, string>;
}

export interface CreatePaymentMethodParams {
  customerId: string;
  type: 'card' | 'us_bank_account';
  paymentMethodId?: string; // If created on client-side
  cardToken?: string; // Legacy token support
  bankAccount?: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
    accountHolderType: 'individual' | 'company';
  };
  setAsDefault?: boolean;
}

export interface PaymentData {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: Stripe.PaymentIntent.Status;
  paymentMethodId?: string;
  invoiceId?: string;
  description?: string;
  receiptUrl?: string;
  failureReason?: string;
  createdAt: Date;
  metadata: Record<string, string>;
}

export interface CreatePaymentParams {
  customerId: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  invoiceId?: string;
  description?: string;
  captureMethod?: 'automatic' | 'manual';
  confirmationMethod?: 'automatic' | 'manual';
  returnUrl?: string;
  metadata?: Record<string, string>;
}

export interface PaymentPlan {
  id: string;
  customerId: string;
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'bi_weekly' | 'monthly';
  startDate: Date;
  nextPaymentDate: Date;
  completedPayments: number;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  paymentMethodId: string;
  metadata: Record<string, string>;
}

export interface CreatePaymentPlanParams {
  customerId: string;
  totalAmount: number;
  installments: number;
  frequency: 'weekly' | 'bi_weekly' | 'monthly';
  startDate?: Date;
  paymentMethodId: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface SetupAutoPayParams {
  customerId: string;
  paymentMethodId: string;
  subscriptionId?: string;
  invoiceId?: string;
}

export interface ReceiptData {
  id: string;
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  last4?: string;
  receiptNumber: string;
  description?: string;
  invoiceId?: string;
  downloadUrl?: string;
}

export class PaymentService {
  /**
   * Add a payment method to a customer
   */
  async addPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethodData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      let paymentMethod: Stripe.PaymentMethod;

      if (params.paymentMethodId) {
        // Attach existing payment method created on client-side
        paymentMethod = await stripe.paymentMethods.attach(params.paymentMethodId, {
          customer: params.customerId,
        });
      } else if (params.type === 'us_bank_account' && params.bankAccount) {
        // Create bank account payment method
        paymentMethod = await stripe.paymentMethods.create({
          type: 'us_bank_account',
          us_bank_account: {
            routing_number: params.bankAccount.routingNumber,
            account_number: params.bankAccount.accountNumber,
            account_type: params.bankAccount.accountType,
            account_holder_type: params.bankAccount.accountHolderType,
          },
          customer: params.customerId,
        });
      } else {
        throw new Error('Invalid payment method parameters');
      }

      // Set as default if requested
      if (params.setAsDefault) {
        await stripe.customers.update(params.customerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.id,
          },
        });
      }

      return this.mapPaymentMethod(paymentMethod, params.setAsDefault || false);
    });
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      await stripe.paymentMethods.detach(paymentMethodId);
    });
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethodData[]> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method as string;

      const [cardMethods, bankMethods] = await Promise.all([
        stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        }),
        stripe.paymentMethods.list({
          customer: customerId,
          type: 'us_bank_account',
        }),
      ]);

      const allMethods = [...cardMethods.data, ...bankMethods.data];

      return allMethods.map(method =>
        this.mapPaymentMethod(method, method.id === defaultPaymentMethodId)
      );
    });
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    });
  }

  /**
   * Create a payment intent
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        customer: params.customerId,
        amount: formatAmountForStripe(params.amount, params.currency),
        currency: params.currency || 'usd',
        capture_method: params.captureMethod || 'automatic',
        confirmation_method: params.confirmationMethod || 'automatic',
        description: params.description,
        metadata: {
          customerId: params.customerId,
          ...(params.invoiceId && { invoiceId: params.invoiceId }),
          ...params.metadata,
        },
      };

      if (params.paymentMethodId) {
        paymentIntentParams.payment_method = params.paymentMethodId;
        if (params.confirmationMethod === 'automatic') {
          paymentIntentParams.confirm = true;
        }
      }

      if (params.returnUrl) {
        paymentIntentParams.return_url = params.returnUrl;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      return this.mapPaymentIntent(paymentIntent);
    });
  }

  /**
   * Confirm a payment intent
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string,
    returnUrl?: string
  ): Promise<PaymentData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const confirmParams: Stripe.PaymentIntentConfirmParams = {};

      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      if (returnUrl) {
        confirmParams.return_url = returnUrl;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmParams
      );

      return this.mapPaymentIntent(paymentIntent);
    });
  }

  /**
   * Capture a payment (for manual capture)
   */
  async capturePayment(
    paymentIntentId: string,
    amountToCapture?: number
  ): Promise<PaymentData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const captureParams: Stripe.PaymentIntentCaptureParams = {};

      if (amountToCapture) {
        captureParams.amount_to_capture = formatAmountForStripe(amountToCapture);
      }

      const paymentIntent = await stripe.paymentIntents.capture(
        paymentIntentId,
        captureParams
      );

      return this.mapPaymentIntent(paymentIntent);
    });
  }

  /**
   * Cancel a payment intent
   */
  async cancelPayment(
    paymentIntentId: string,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned'
  ): Promise<PaymentData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: reason,
      });

      return this.mapPaymentIntent(paymentIntent);
    });
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentIntentId: string): Promise<PaymentData | null> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return this.mapPaymentIntent(paymentIntent);
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Get customer payment history
   */
  async getCustomerPaymentHistory(
    customerId: string,
    options: {
      limit?: number;
      startingAfter?: string;
    } = {}
  ): Promise<{
    payments: PaymentData[];
    hasMore: boolean;
  }> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const params: Stripe.PaymentIntentListParams = {
        customer: customerId,
        limit: options.limit || 50,
      };

      if (options.startingAfter) {
        params.starting_after = options.startingAfter;
      }

      const result = await stripe.paymentIntents.list(params);

      const payments = result.data.map(pi => this.mapPaymentIntent(pi));

      return {
        payments,
        hasMore: result.has_more,
      };
    });
  }

  /**
   * Process invoice payment
   */
  async payInvoice(
    invoiceId: string,
    paymentMethodId?: string
  ): Promise<PaymentData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const invoice = await stripe.invoices.retrieve(invoiceId);

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid');
      }

      if (paymentMethodId) {
        // Update invoice with payment method
        await stripe.invoices.update(invoiceId, {
          default_payment_method: paymentMethodId,
        });
      }

      const paidInvoice = await stripe.invoices.pay(invoiceId);

      if (paidInvoice.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paidInvoice.payment_intent as string
        );
        return this.mapPaymentIntent(paymentIntent);
      }

      // If no payment intent, create a mock payment data
      return {
        id: `invoice_payment_${invoiceId}`,
        customerId: paidInvoice.customer as string,
        amount: formatAmountFromStripe(paidInvoice.amount_paid),
        currency: paidInvoice.currency,
        status: 'succeeded',
        invoiceId,
        description: `Payment for invoice ${paidInvoice.number}`,
        createdAt: new Date(),
        metadata: paidInvoice.metadata,
      };
    });
  }

  /**
   * Create payment plan (installments)
   */
  async createPaymentPlan(params: CreatePaymentPlanParams): Promise<PaymentPlan> {
    // This would typically be stored in your database
    // For Stripe, we'd create a subscription with custom intervals

    const installmentAmount = params.totalAmount / params.installments;
    const startDate = params.startDate || new Date();

    // Calculate next payment date based on frequency
    const nextPaymentDate = new Date(startDate);
    switch (params.frequency) {
      case 'weekly':
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
        break;
      case 'bi_weekly':
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
        break;
      case 'monthly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
    }

    const paymentPlan: PaymentPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: params.customerId,
      totalAmount: params.totalAmount,
      installments: params.installments,
      installmentAmount,
      frequency: params.frequency,
      startDate,
      nextPaymentDate,
      completedPayments: 0,
      status: 'active',
      paymentMethodId: params.paymentMethodId,
      metadata: params.metadata || {},
    };

    // In a real implementation, you would store this in your database
    // and create scheduled payments

    return paymentPlan;
  }

  /**
   * Setup automatic payments
   */
  async setupAutoPay(params: SetupAutoPayParams): Promise<void> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      if (params.subscriptionId) {
        // Update subscription with default payment method
        await stripe.subscriptions.update(params.subscriptionId, {
          default_payment_method: params.paymentMethodId,
        });
      }

      if (params.invoiceId) {
        // Update invoice with default payment method
        await stripe.invoices.update(params.invoiceId, {
          default_payment_method: params.paymentMethodId,
        });
      }

      // Set as customer's default payment method
      await stripe.customers.update(params.customerId, {
        invoice_settings: {
          default_payment_method: params.paymentMethodId,
        },
      });
    });
  }

  /**
   * Handle failed payment retry
   */
  async retryFailedPayment(
    paymentIntentId: string,
    newPaymentMethodId?: string
  ): Promise<PaymentData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'requires_payment_method') {
        throw new Error('Payment is not in a retryable state');
      }

      const updateParams: Stripe.PaymentIntentUpdateParams = {};

      if (newPaymentMethodId) {
        updateParams.payment_method = newPaymentMethodId;
      }

      const updatedIntent = await stripe.paymentIntents.update(
        paymentIntentId,
        updateParams
      );

      const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId);

      return this.mapPaymentIntent(confirmedIntent);
    });
  }

  /**
   * Generate payment receipt
   */
  async generateReceipt(paymentIntentId: string): Promise<ReceiptData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['payment_method'],
      });

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Can only generate receipts for successful payments');
      }

      const receiptNumber = `RCP-${Date.now()}-${paymentIntentId.substr(-8).toUpperCase()}`;

      const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
      let paymentMethodDescription = 'Unknown';
      let last4: string | undefined;

      if (paymentMethod) {
        if (paymentMethod.type === 'card' && paymentMethod.card) {
          paymentMethodDescription = `${paymentMethod.card.brand.toUpperCase()} ending in ${paymentMethod.card.last4}`;
          last4 = paymentMethod.card.last4;
        } else if (paymentMethod.type === 'us_bank_account' && paymentMethod.us_bank_account) {
          paymentMethodDescription = `Bank account ending in ${paymentMethod.us_bank_account.last4}`;
          last4 = paymentMethod.us_bank_account.last4;
        }
      }

      return {
        id: `receipt_${paymentIntentId}`,
        paymentId: paymentIntentId,
        customerId: paymentIntent.customer as string,
        amount: formatAmountFromStripe(paymentIntent.amount),
        currency: paymentIntent.currency,
        paymentDate: new Date(paymentIntent.created * 1000),
        paymentMethod: paymentMethodDescription,
        last4,
        receiptNumber,
        description: paymentIntent.description || undefined,
        invoiceId: paymentIntent.metadata.invoiceId || undefined,
        downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/receipt/${paymentIntentId}`,
      };
    });
  }

  /**
   * Helper: Map Stripe payment method to our format
   */
  private mapPaymentMethod(
    paymentMethod: Stripe.PaymentMethod,
    isDefault: boolean
  ): PaymentMethodData {
    const data: PaymentMethodData = {
      id: paymentMethod.id,
      customerId: paymentMethod.customer as string,
      type: paymentMethod.type,
      isDefault,
      metadata: paymentMethod.metadata,
    };

    if (paymentMethod.type === 'card' && paymentMethod.card) {
      data.card = {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
        funding: paymentMethod.card.funding,
      };
    } else if (paymentMethod.type === 'us_bank_account' && paymentMethod.us_bank_account) {
      data.bankAccount = {
        routingNumber: paymentMethod.us_bank_account.routing_number || '',
        last4: paymentMethod.us_bank_account.last4,
        bankName: paymentMethod.us_bank_account.bank_name || undefined,
        accountType: paymentMethod.us_bank_account.account_type || 'checking',
      };
    }

    return data;
  }

  /**
   * Helper: Map Stripe payment intent to our format
   */
  private mapPaymentIntent(paymentIntent: Stripe.PaymentIntent): PaymentData {
    return {
      id: paymentIntent.id,
      customerId: paymentIntent.customer as string,
      amount: formatAmountFromStripe(paymentIntent.amount),
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethodId: paymentIntent.payment_method as string,
      invoiceId: paymentIntent.metadata.invoiceId || undefined,
      description: paymentIntent.description || undefined,
      receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || undefined,
      failureReason: paymentIntent.last_payment_error?.message || undefined,
      createdAt: new Date(paymentIntent.created * 1000),
      metadata: paymentIntent.metadata,
    };
  }
}