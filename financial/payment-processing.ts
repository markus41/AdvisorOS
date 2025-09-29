/**
 * Financial Operations Infrastructure for AdvisorOS
 *
 * Comprehensive payment processing system with:
 * - Stripe integration for subscription management
 * - Banking operations framework
 * - Usage tracking and billing automation
 * - Financial compliance and audit trails
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { auditLogger } from '../compliance/audit-logging';

interface PaymentProvider {
  processPayment(payment: PaymentRequest): Promise<PaymentResult>;
  createSubscription(subscription: SubscriptionRequest): Promise<SubscriptionResult>;
  updateSubscription(subscriptionId: string, updates: SubscriptionUpdate): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string, reason?: string): Promise<void>;
  processRefund(refund: RefundRequest): Promise<RefundResult>;
  createInvoice(invoice: InvoiceRequest): Promise<InvoiceResult>;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  clientId: string;
  paymentMethodId: string;
  description: string;
  metadata?: Record<string, string>;
}

interface PaymentResult {
  id: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  currency: string;
  feeAmount: number;
  netAmount: number;
  processingFee: number;
  createdAt: Date;
  paymentMethodType: string;
  failureReason?: string;
}

interface SubscriptionRequest {
  clientId: string;
  planId: string;
  paymentMethodId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  addons?: SubscriptionAddon[];
}

interface SubscriptionAddon {
  id: string;
  quantity: number;
  unitPrice: number;
}

interface SubscriptionResult {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  clientId: string;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  monthlyAmount: number;
  nextBillingDate: Date;
  addons: SubscriptionAddon[];
}

interface SubscriptionUpdate {
  planId?: string;
  addons?: SubscriptionAddon[];
  trialEnd?: Date;
  metadata?: Record<string, string>;
}

interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason: string;
  metadata?: Record<string, string>;
}

interface RefundResult {
  id: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  currency: string;
  reason: string;
  createdAt: Date;
}

interface InvoiceRequest {
  clientId: string;
  lineItems: InvoiceLineItem[];
  dueDate?: Date;
  description?: string;
  metadata?: Record<string, string>;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
}

interface InvoiceResult {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  subtotal: number;
  taxAmount: number;
  total: number;
  dueDate: Date;
  createdAt: Date;
  pdfUrl?: string;
}

interface UsageMetrics {
  clientId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    documentsProcessed: number;
    apiCalls: number;
    storageUsed: number; // in MB
    computeTime: number; // in seconds
    userSeats: number;
    customFeatures: Record<string, number>;
  };
  costs: {
    basePlan: number;
    overageCharges: number;
    addons: number;
    total: number;
  };
}

interface BillingCycle {
  id: string;
  clientId: string;
  period: {
    start: Date;
    end: Date;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  usage: UsageMetrics;
  invoice?: InvoiceResult;
  payment?: PaymentResult;
  createdAt: Date;
  processedAt?: Date;
}

class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;
  private prisma: PrismaClient;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
      typescript: true
    });
    this.prisma = new PrismaClient();
  }

  async processPayment(payment: PaymentRequest): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency.toLowerCase(),
        payment_method: payment.paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: payment.description,
        metadata: {
          clientId: payment.clientId,
          ...payment.metadata
        }
      });

      await this.logPaymentEvent('PAYMENT_PROCESSED', payment.clientId, {
        paymentIntentId: paymentIntent.id,
        amount: payment.amount,
        status: paymentIntent.status
      });

      const result: PaymentResult = {
        id: paymentIntent.id,
        status: paymentIntent.status as PaymentResult['status'],
        amount: payment.amount,
        currency: payment.currency,
        feeAmount: 0, // Will be updated via webhook
        netAmount: payment.amount,
        processingFee: this.calculateProcessingFee(payment.amount),
        createdAt: new Date(paymentIntent.created * 1000),
        paymentMethodType: paymentIntent.payment_method?.type || 'unknown',
        failureReason: paymentIntent.last_payment_error?.message
      };

      // Store payment record
      await this.prisma.payment.create({
        data: {
          id: result.id,
          clientId: payment.clientId,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          processingFee: result.processingFee,
          description: payment.description,
          metadata: payment.metadata || {},
          createdAt: result.createdAt
        }
      });

      return result;

    } catch (error) {
      await this.logPaymentEvent('PAYMENT_FAILED', payment.clientId, {
        error: error.message,
        amount: payment.amount
      });

      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async createSubscription(subscription: SubscriptionRequest): Promise<SubscriptionResult> {
    try {
      // Create customer if not exists
      const customer = await this.ensureStripeCustomer(subscription.clientId);

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(subscription.paymentMethodId, {
        customer: customer.id
      });

      // Set as default payment method
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: subscription.paymentMethodId
        }
      });

      // Create subscription
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [
          { price: subscription.planId }
        ],
        trial_period_days: subscription.trialPeriodDays,
        metadata: {
          clientId: subscription.clientId,
          ...subscription.metadata
        },
        expand: ['latest_invoice.payment_intent']
      });

      await this.logPaymentEvent('SUBSCRIPTION_CREATED', subscription.clientId, {
        subscriptionId: stripeSubscription.id,
        planId: subscription.planId,
        status: stripeSubscription.status
      });

      const result: SubscriptionResult = {
        id: stripeSubscription.id,
        status: stripeSubscription.status as SubscriptionResult['status'],
        clientId: subscription.clientId,
        planId: subscription.planId,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
        monthlyAmount: this.calculateMonthlyAmount(stripeSubscription),
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
        addons: subscription.addons || []
      };

      // Store subscription record
      await this.prisma.subscription.create({
        data: {
          id: result.id,
          clientId: subscription.clientId,
          planId: subscription.planId,
          status: result.status,
          currentPeriodStart: result.currentPeriodStart,
          currentPeriodEnd: result.currentPeriodEnd,
          trialEnd: result.trialEnd,
          monthlyAmount: result.monthlyAmount,
          metadata: subscription.metadata || {}
        }
      });

      return result;

    } catch (error) {
      await this.logPaymentEvent('SUBSCRIPTION_CREATION_FAILED', subscription.clientId, {
        error: error.message,
        planId: subscription.planId
      });

      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  async updateSubscription(subscriptionId: string, updates: SubscriptionUpdate): Promise<SubscriptionResult> {
    try {
      const updateData: any = {};

      if (updates.planId) {
        updateData.items = [{ price: updates.planId }];
      }

      if (updates.trialEnd) {
        updateData.trial_end = Math.floor(updates.trialEnd.getTime() / 1000);
      }

      if (updates.metadata) {
        updateData.metadata = updates.metadata;
      }

      const stripeSubscription = await this.stripe.subscriptions.update(subscriptionId, updateData);

      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (subscription) {
        await this.logPaymentEvent('SUBSCRIPTION_UPDATED', subscription.clientId, {
          subscriptionId,
          updates
        });
      }

      return this.mapStripeSubscriptionToResult(stripeSubscription);

    } catch (error) {
      throw new Error(`Subscription update failed: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId, {
        cancellation_details: {
          comment: reason
        }
      });

      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (subscription) {
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'canceled', canceledAt: new Date() }
        });

        await this.logPaymentEvent('SUBSCRIPTION_CANCELED', subscription.clientId, {
          subscriptionId,
          reason
        });
      }

    } catch (error) {
      throw new Error(`Subscription cancellation failed: ${error.message}`);
    }
  }

  async processRefund(refund: RefundRequest): Promise<RefundResult> {
    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: refund.paymentId,
        amount: refund.amount ? Math.round(refund.amount * 100) : undefined,
        reason: refund.reason as any,
        metadata: refund.metadata
      });

      const payment = await this.prisma.payment.findUnique({
        where: { id: refund.paymentId }
      });

      if (payment) {
        await this.logPaymentEvent('REFUND_PROCESSED', payment.clientId, {
          refundId: stripeRefund.id,
          amount: stripeRefund.amount / 100,
          reason: refund.reason
        });
      }

      return {
        id: stripeRefund.id,
        status: stripeRefund.status as RefundResult['status'],
        amount: stripeRefund.amount / 100,
        currency: stripeRefund.currency,
        reason: refund.reason,
        createdAt: new Date(stripeRefund.created * 1000)
      };

    } catch (error) {
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  async createInvoice(invoice: InvoiceRequest): Promise<InvoiceResult> {
    try {
      const customer = await this.ensureStripeCustomer(invoice.clientId);

      // Create invoice items
      for (const item of invoice.lineItems) {
        await this.stripe.invoiceItems.create({
          customer: customer.id,
          amount: Math.round(item.amount * 100),
          currency: 'usd',
          description: item.description,
          metadata: {
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString()
          }
        });
      }

      // Create invoice
      const stripeInvoice = await this.stripe.invoices.create({
        customer: customer.id,
        description: invoice.description,
        due_date: invoice.dueDate ? Math.floor(invoice.dueDate.getTime() / 1000) : undefined,
        metadata: invoice.metadata
      });

      // Finalize invoice
      await this.stripe.invoices.finalizeInvoice(stripeInvoice.id);

      await this.logPaymentEvent('INVOICE_CREATED', invoice.clientId, {
        invoiceId: stripeInvoice.id,
        amount: stripeInvoice.total / 100
      });

      return {
        id: stripeInvoice.id,
        number: stripeInvoice.number || '',
        status: stripeInvoice.status as InvoiceResult['status'],
        subtotal: stripeInvoice.subtotal / 100,
        taxAmount: stripeInvoice.tax || 0 / 100,
        total: stripeInvoice.total / 100,
        dueDate: invoice.dueDate || new Date(),
        createdAt: new Date(stripeInvoice.created * 1000),
        pdfUrl: stripeInvoice.invoice_pdf
      };

    } catch (error) {
      throw new Error(`Invoice creation failed: ${error.message}`);
    }
  }

  private async ensureStripeCustomer(clientId: string) {
    // Check if customer exists in our database
    let customer = await this.prisma.stripeCustomer.findUnique({
      where: { clientId }
    });

    if (!customer) {
      // Get client details
      const client = await this.prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Create Stripe customer
      const stripeCustomer = await this.stripe.customers.create({
        email: client.email,
        name: client.name,
        metadata: {
          clientId: clientId
        }
      });

      // Store customer reference
      customer = await this.prisma.stripeCustomer.create({
        data: {
          clientId: clientId,
          stripeCustomerId: stripeCustomer.id
        }
      });

      return stripeCustomer;
    }

    return await this.stripe.customers.retrieve(customer.stripeCustomerId);
  }

  private calculateProcessingFee(amount: number): number {
    // Stripe fees: 2.9% + $0.30 for online payments
    return (amount * 0.029) + 0.30;
  }

  private calculateMonthlyAmount(subscription: Stripe.Subscription): number {
    return subscription.items.data.reduce((total, item) => {
      const price = item.price;
      const amount = price.unit_amount || 0;
      return total + (amount / 100) * item.quantity;
    }, 0);
  }

  private mapStripeSubscriptionToResult(stripeSubscription: Stripe.Subscription): SubscriptionResult {
    return {
      id: stripeSubscription.id,
      status: stripeSubscription.status as SubscriptionResult['status'],
      clientId: stripeSubscription.metadata.clientId,
      planId: stripeSubscription.items.data[0]?.price.id || '',
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
      monthlyAmount: this.calculateMonthlyAmount(stripeSubscription),
      nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
      addons: []
    };
  }

  private async logPaymentEvent(event: string, clientId: string, details: any) {
    await auditLogger.logDataAccess({
      userId: 'system',
      userEmail: 'system@advisoros.com',
      userRole: 'SYSTEM',
      clientId,
      action: 'write',
      resource: 'PAYMENT_SYSTEM',
      outcome: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'StripePaymentProvider',
      dataClassification: 'CONFIDENTIAL',
      details: { event, ...details }
    });
  }
}

class UsageTracker {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async trackUsage(clientId: string, metric: string, value: number, metadata?: Record<string, any>) {
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    await this.prisma.usageRecord.upsert({
      where: {
        clientId_metric_timestamp: {
          clientId,
          metric,
          timestamp: currentHour
        }
      },
      update: {
        value: {
          increment: value
        },
        metadata: metadata || {}
      },
      create: {
        clientId,
        metric,
        value,
        timestamp: currentHour,
        metadata: metadata || {}
      }
    });

    // Check for usage-based billing triggers
    await this.checkUsageThresholds(clientId, metric, value);
  }

  async getUsageMetrics(clientId: string, startDate: Date, endDate: Date): Promise<UsageMetrics> {
    const usageRecords = await this.prisma.usageRecord.findMany({
      where: {
        clientId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const metrics = {
      documentsProcessed: 0,
      apiCalls: 0,
      storageUsed: 0,
      computeTime: 0,
      userSeats: 0,
      customFeatures: {} as Record<string, number>
    };

    usageRecords.forEach(record => {
      switch (record.metric) {
        case 'documents_processed':
          metrics.documentsProcessed += record.value;
          break;
        case 'api_calls':
          metrics.apiCalls += record.value;
          break;
        case 'storage_used':
          metrics.storageUsed = Math.max(metrics.storageUsed, record.value);
          break;
        case 'compute_time':
          metrics.computeTime += record.value;
          break;
        case 'user_seats':
          metrics.userSeats = Math.max(metrics.userSeats, record.value);
          break;
        default:
          metrics.customFeatures[record.metric] = (metrics.customFeatures[record.metric] || 0) + record.value;
      }
    });

    const costs = await this.calculateUsageCosts(clientId, metrics);

    return {
      clientId,
      period: { start: startDate, end: endDate },
      metrics,
      costs
    };
  }

  private async calculateUsageCosts(clientId: string, metrics: UsageMetrics['metrics']) {
    // Get client's pricing plan
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        clientId,
        status: 'active'
      },
      include: {
        plan: true
      }
    });

    const plan = subscription?.plan;
    if (!plan) {
      return { basePlan: 0, overageCharges: 0, addons: 0, total: 0 };
    }

    let overageCharges = 0;

    // Calculate overage charges
    const overages = {
      documents: Math.max(0, metrics.documentsProcessed - plan.includedDocuments),
      apiCalls: Math.max(0, metrics.apiCalls - plan.includedApiCalls),
      storage: Math.max(0, metrics.storageUsed - plan.includedStorage),
      users: Math.max(0, metrics.userSeats - plan.includedUsers)
    };

    overageCharges += overages.documents * plan.perDocumentPrice;
    overageCharges += overages.apiCalls * plan.perApiCallPrice;
    overageCharges += overages.storage * plan.perGbStoragePrice;
    overageCharges += overages.users * plan.perUserPrice;

    const basePlan = plan.monthlyPrice;
    const addons = 0; // Calculate addon costs
    const total = basePlan + overageCharges + addons;

    return { basePlan, overageCharges, addons, total };
  }

  private async checkUsageThresholds(clientId: string, metric: string, value: number) {
    // Implement usage threshold checking and alerts
    const thresholds = await this.prisma.usageThreshold.findMany({
      where: { clientId, metric, enabled: true }
    });

    for (const threshold of thresholds) {
      const currentUsage = await this.getCurrentUsage(clientId, metric);
      if (currentUsage >= threshold.value) {
        await this.triggerUsageAlert(clientId, metric, currentUsage, threshold);
      }
    }
  }

  private async getCurrentUsage(clientId: string, metric: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await this.prisma.usageRecord.aggregate({
      where: {
        clientId,
        metric,
        timestamp: {
          gte: startOfMonth
        }
      },
      _sum: {
        value: true
      }
    });

    return result._sum.value || 0;
  }

  private async triggerUsageAlert(clientId: string, metric: string, currentUsage: number, threshold: any) {
    // Send usage alert notification
    console.log(`Usage alert for client ${clientId}: ${metric} reached ${currentUsage} (threshold: ${threshold.value})`);

    // Log the alert
    await auditLogger.logDataAccess({
      userId: 'system',
      userEmail: 'system@advisoros.com',
      userRole: 'SYSTEM',
      clientId,
      action: 'read',
      resource: 'USAGE_TRACKING',
      outcome: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'UsageTracker',
      dataClassification: 'INTERNAL',
      details: { event: 'USAGE_THRESHOLD_EXCEEDED', metric, currentUsage, threshold: threshold.value }
    });
  }
}

class BillingAutomation {
  private prisma: PrismaClient;
  private paymentProvider: PaymentProvider;
  private usageTracker: UsageTracker;

  constructor(paymentProvider: PaymentProvider) {
    this.prisma = new PrismaClient();
    this.paymentProvider = paymentProvider;
    this.usageTracker = new UsageTracker();
  }

  async processBillingCycle(clientId: string): Promise<BillingCycle> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const billingCycle = await this.prisma.billingCycle.create({
      data: {
        clientId,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        status: 'processing'
      }
    });

    try {
      // Get usage metrics
      const usage = await this.usageTracker.getUsageMetrics(clientId, startOfMonth, endOfMonth);

      // Create invoice if there are charges
      if (usage.costs.total > 0) {
        const invoice = await this.paymentProvider.createInvoice({
          clientId,
          lineItems: [
            {
              description: 'Monthly subscription',
              quantity: 1,
              unitPrice: usage.costs.basePlan,
              amount: usage.costs.basePlan,
              taxable: true
            },
            ...(usage.costs.overageCharges > 0 ? [{
              description: 'Overage charges',
              quantity: 1,
              unitPrice: usage.costs.overageCharges,
              amount: usage.costs.overageCharges,
              taxable: true
            }] : []),
            ...(usage.costs.addons > 0 ? [{
              description: 'Add-on services',
              quantity: 1,
              unitPrice: usage.costs.addons,
              amount: usage.costs.addons,
              taxable: true
            }] : [])
          ],
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });

        await this.prisma.billingCycle.update({
          where: { id: billingCycle.id },
          data: {
            status: 'completed',
            processedAt: new Date(),
            usage: usage as any,
            invoiceId: invoice.id
          }
        });
      } else {
        await this.prisma.billingCycle.update({
          where: { id: billingCycle.id },
          data: {
            status: 'completed',
            processedAt: new Date(),
            usage: usage as any
          }
        });
      }

      return this.getBillingCycle(billingCycle.id);

    } catch (error) {
      await this.prisma.billingCycle.update({
        where: { id: billingCycle.id },
        data: { status: 'failed' }
      });

      throw error;
    }
  }

  async getBillingCycle(billingCycleId: string): Promise<BillingCycle> {
    const cycle = await this.prisma.billingCycle.findUnique({
      where: { id: billingCycleId },
      include: {
        invoice: true,
        payment: true
      }
    });

    if (!cycle) {
      throw new Error('Billing cycle not found');
    }

    return {
      id: cycle.id,
      clientId: cycle.clientId,
      period: {
        start: cycle.periodStart,
        end: cycle.periodEnd
      },
      status: cycle.status as BillingCycle['status'],
      usage: cycle.usage as UsageMetrics,
      invoice: cycle.invoice as InvoiceResult,
      payment: cycle.payment as PaymentResult,
      createdAt: cycle.createdAt,
      processedAt: cycle.processedAt
    };
  }

  async scheduleRecurringBilling() {
    // This would typically be called by a cron job
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        nextBillingDate: {
          lte: new Date()
        }
      }
    });

    for (const subscription of activeSubscriptions) {
      try {
        await this.processBillingCycle(subscription.clientId);
      } catch (error) {
        console.error(`Failed to process billing for client ${subscription.clientId}:`, error);
      }
    }
  }
}

export {
  StripePaymentProvider,
  UsageTracker,
  BillingAutomation
};

export type {
  PaymentProvider,
  PaymentRequest,
  PaymentResult,
  SubscriptionRequest,
  SubscriptionResult,
  UsageMetrics,
  BillingCycle
};