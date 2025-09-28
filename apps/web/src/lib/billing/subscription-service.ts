import Stripe from 'stripe';
import { stripe, withRetry, stripeLimiter, createSecureCustomer } from '../stripe/stripe-client';
import {
  PricingTier,
  AddonModule,
  UsageMetric,
  PRICING_TIERS,
  ADDON_MODULES,
  USAGE_PRICING,
  TRIAL_CONFIG,
  calculateTotalPrice,
  calculateUsageOverage,
} from './pricing-config';

// Subscription interfaces
export interface SubscriptionData {
  id: string;
  customerId: string;
  organizationId: string;
  tier: PricingTier;
  status: Stripe.Subscription.Status;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  users: number;
  addons: AddonModule[];
  metadata: Record<string, string>;
}

export interface UsageData {
  organizationId: string;
  period: string; // YYYY-MM format
  metrics: Record<UsageMetric, number>;
  lastUpdated: Date;
}

export interface CreateSubscriptionParams {
  organizationId: string;
  customerId?: string;
  email: string;
  tier: PricingTier;
  users: number;
  addons?: AddonModule[];
  paymentMethodId?: string;
  trialDays?: number;
  yearly?: boolean;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  tier?: PricingTier;
  users?: number;
  addons?: AddonModule[];
  yearly?: boolean;
  prorationBehavior?: 'none' | 'create_prorations' | 'always_invoice';
}

export class SubscriptionService {
  /**
   * Create a new subscription for an organization
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      let customer: Stripe.Customer;

      // Get or create customer
      if (params.customerId) {
        customer = await stripe.customers.retrieve(params.customerId) as Stripe.Customer;
      } else {
        customer = await createSecureCustomer(params.email, {
          organizationId: params.organizationId,
          ...params.metadata,
        });
      }

      const tierConfig = PRICING_TIERS[params.tier];
      const addons = params.addons || [];

      // Prepare subscription items
      const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] = [];

      // Add base tier price
      const basePriceId = params.yearly
        ? tierConfig.stripePriceYearlyId
        : tierConfig.stripePriceMonthlyId;

      subscriptionItems.push({
        price: basePriceId,
        quantity: 1,
      });

      // Add per-user pricing if applicable
      const includedUsers = tierConfig.limits[UsageMetric.USERS];
      const extraUsers = Math.max(0, params.users - includedUsers);

      if (extraUsers > 0 && tierConfig.perUserPrice > 0) {
        // Create dynamic price for extra users
        const userPrice = await this.createOrGetUserPrice(
          params.tier,
          tierConfig.perUserPrice,
          params.yearly
        );

        subscriptionItems.push({
          price: userPrice.id,
          quantity: extraUsers,
        });
      }

      // Add addons
      for (const addonKey of addons) {
        const addon = ADDON_MODULES[addonKey];
        if (addon && addon.availableForTiers.includes(params.tier)) {
          const addonPriceId = params.yearly
            ? addon.stripePriceYearlyId
            : addon.stripePriceMonthlyId;

          subscriptionItems.push({
            price: addonPriceId,
            quantity: 1,
          });
        }
      }

      // Create subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: subscriptionItems,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          organizationId: params.organizationId,
          tier: params.tier,
          users: params.users.toString(),
          addons: addons.join(','),
          yearly: params.yearly ? 'true' : 'false',
          ...params.metadata,
        },
      };

      // Add trial if specified
      if (params.trialDays && params.trialDays > 0) {
        subscriptionParams.trial_period_days = params.trialDays;
      }

      // Add payment method if provided
      if (params.paymentMethodId) {
        subscriptionParams.default_payment_method = params.paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      return this.mapStripeSubscription(subscription);
    });
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(params: UpdateSubscriptionParams): Promise<SubscriptionData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const currentSubscription = await stripe.subscriptions.retrieve(params.subscriptionId);

      if (!currentSubscription) {
        throw new Error('Subscription not found');
      }

      const organizationId = currentSubscription.metadata.organizationId;
      const currentTier = currentSubscription.metadata.tier as PricingTier;
      const currentUsers = parseInt(currentSubscription.metadata.users) || 1;
      const currentAddons = currentSubscription.metadata.addons?.split(',').filter(Boolean) as AddonModule[] || [];
      const currentYearly = currentSubscription.metadata.yearly === 'true';

      // Determine new values
      const newTier = params.tier || currentTier;
      const newUsers = params.users || currentUsers;
      const newAddons = params.addons || currentAddons;
      const newYearly = params.yearly !== undefined ? params.yearly : currentYearly;

      // If no changes, return current subscription
      if (
        newTier === currentTier &&
        newUsers === currentUsers &&
        newAddons.length === currentAddons.length &&
        newAddons.every(addon => currentAddons.includes(addon)) &&
        newYearly === currentYearly
      ) {
        return this.mapStripeSubscription(currentSubscription);
      }

      const tierConfig = PRICING_TIERS[newTier];

      // Prepare new subscription items
      const subscriptionItems: Stripe.SubscriptionUpdateParams.Item[] = [];

      // Clear existing items
      for (const item of currentSubscription.items.data) {
        subscriptionItems.push({
          id: item.id,
          deleted: true,
        });
      }

      // Add new base tier price
      const basePriceId = newYearly
        ? tierConfig.stripePriceYearlyId
        : tierConfig.stripePriceMonthlyId;

      subscriptionItems.push({
        price: basePriceId,
        quantity: 1,
      });

      // Add per-user pricing if applicable
      const includedUsers = tierConfig.limits[UsageMetric.USERS];
      const extraUsers = Math.max(0, newUsers - includedUsers);

      if (extraUsers > 0 && tierConfig.perUserPrice > 0) {
        const userPrice = await this.createOrGetUserPrice(
          newTier,
          tierConfig.perUserPrice,
          newYearly
        );

        subscriptionItems.push({
          price: userPrice.id,
          quantity: extraUsers,
        });
      }

      // Add addons
      for (const addonKey of newAddons) {
        const addon = ADDON_MODULES[addonKey];
        if (addon && addon.availableForTiers.includes(newTier)) {
          const addonPriceId = newYearly
            ? addon.stripePriceYearlyId
            : addon.stripePriceMonthlyId;

          subscriptionItems.push({
            price: addonPriceId,
            quantity: 1,
          });
        }
      }

      // Update subscription
      const updatedSubscription = await stripe.subscriptions.update(params.subscriptionId, {
        items: subscriptionItems,
        proration_behavior: params.prorationBehavior || 'create_prorations',
        metadata: {
          ...currentSubscription.metadata,
          tier: newTier,
          users: newUsers.toString(),
          addons: newAddons.join(','),
          yearly: newYearly ? 'true' : 'false',
        },
      });

      return this.mapStripeSubscription(updatedSubscription);
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelImmediately: boolean = false
  ): Promise<SubscriptionData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      let subscription: Stripe.Subscription;

      if (cancelImmediately) {
        subscription = await stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return this.mapStripeSubscription(subscription);
    });
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<SubscriptionData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      return this.mapStripeSubscription(subscription);
    });
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionData | null> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return this.mapStripeSubscription(subscription);
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Get subscriptions for a customer
   */
  async getCustomerSubscriptions(customerId: string): Promise<SubscriptionData[]> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.latest_invoice'],
      });

      return subscriptions.data.map(sub => this.mapStripeSubscription(sub));
    });
  }

  /**
   * Start a trial subscription
   */
  async startTrial(
    organizationId: string,
    email: string,
    tier: PricingTier,
    users: number = 1
  ): Promise<SubscriptionData> {
    if (!TRIAL_CONFIG.allowedTiers.includes(tier)) {
      throw new Error(`Trial not available for ${tier} tier`);
    }

    return this.createSubscription({
      organizationId,
      email,
      tier,
      users: Math.min(users, TRIAL_CONFIG.limits[tier][UsageMetric.USERS]),
      trialDays: TRIAL_CONFIG.durationDays,
      metadata: {
        trial: 'true',
        trialTier: tier,
      },
    });
  }

  /**
   * Calculate usage overage charges
   */
  async calculateUsageCharges(
    organizationId: string,
    usage: Record<UsageMetric, number>,
    tier: PricingTier
  ): Promise<{ metric: UsageMetric; overage: number; charge: number }[]> {
    const charges: { metric: UsageMetric; overage: number; charge: number }[] = [];

    for (const [metricKey, value] of Object.entries(usage)) {
      const metric = metricKey as UsageMetric;
      if (USAGE_PRICING[metric]) {
        const charge = calculateUsageOverage(tier, metric, value);
        if (charge > 0) {
          const usageConfig = USAGE_PRICING[metric];
          const freeLimit = usageConfig.freeLimit[tier];
          charges.push({
            metric,
            overage: value - freeLimit,
            charge,
          });
        }
      }
    }

    return charges;
  }

  /**
   * Create usage-based invoice items
   */
  async createUsageCharges(
    customerId: string,
    subscriptionId: string,
    usage: Record<UsageMetric, number>,
    tier: PricingTier,
    description?: string
  ): Promise<Stripe.InvoiceItem[]> {
    const charges = await this.calculateUsageCharges('', usage, tier);
    const invoiceItems: Stripe.InvoiceItem[] = [];

    for (const charge of charges) {
      if (charge.charge > 0) {
        const usageConfig = USAGE_PRICING[charge.metric];

        const invoiceItem = await stripe.invoiceItems.create({
          customer: customerId,
          subscription: subscriptionId,
          amount: Math.round(charge.charge * 100), // Convert to cents
          currency: 'usd',
          description: description || `${usageConfig.name} overage: ${charge.overage} ${usageConfig.unit}(s)`,
          metadata: {
            metric: charge.metric,
            overage: charge.overage.toString(),
            usage: usage[charge.metric].toString(),
          },
        });

        invoiceItems.push(invoiceItem);
      }
    }

    return invoiceItems;
  }

  /**
   * Preview subscription changes
   */
  async previewSubscriptionUpdate(params: UpdateSubscriptionParams): Promise<{
    immediateCharge: number;
    nextInvoiceTotal: number;
    prorationDetails: Stripe.InvoiceLineItem[];
  }> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      // Get current subscription to build update params
      const currentSubscription = await stripe.subscriptions.retrieve(params.subscriptionId);
      const currentTier = currentSubscription.metadata.tier as PricingTier;
      const currentUsers = parseInt(currentSubscription.metadata.users) || 1;
      const currentAddons = currentSubscription.metadata.addons?.split(',').filter(Boolean) as AddonModule[] || [];
      const currentYearly = currentSubscription.metadata.yearly === 'true';

      const newTier = params.tier || currentTier;
      const newUsers = params.users || currentUsers;
      const newAddons = params.addons || currentAddons;
      const newYearly = params.yearly !== undefined ? params.yearly : currentYearly;

      const tierConfig = PRICING_TIERS[newTier];

      // Build subscription items for preview
      const subscriptionItems: Stripe.SubscriptionUpdateParams.Item[] = [];

      // Clear existing items
      for (const item of currentSubscription.items.data) {
        subscriptionItems.push({
          id: item.id,
          deleted: true,
        });
      }

      // Add new items
      const basePriceId = newYearly
        ? tierConfig.stripePriceYearlyId
        : tierConfig.stripePriceMonthlyId;

      subscriptionItems.push({
        price: basePriceId,
        quantity: 1,
      });

      // Add user pricing
      const includedUsers = tierConfig.limits[UsageMetric.USERS];
      const extraUsers = Math.max(0, newUsers - includedUsers);

      if (extraUsers > 0) {
        const userPrice = await this.createOrGetUserPrice(newTier, tierConfig.perUserPrice, newYearly);
        subscriptionItems.push({
          price: userPrice.id,
          quantity: extraUsers,
        });
      }

      // Add addons
      for (const addonKey of newAddons) {
        const addon = ADDON_MODULES[addonKey];
        if (addon && addon.availableForTiers.includes(newTier)) {
          const addonPriceId = newYearly
            ? addon.stripePriceYearlyId
            : addon.stripePriceMonthlyId;

          subscriptionItems.push({
            price: addonPriceId,
            quantity: 1,
          });
        }
      }

      // Preview the invoice
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: currentSubscription.customer as string,
        subscription: params.subscriptionId,
        subscription_items: subscriptionItems,
        subscription_proration_behavior: params.prorationBehavior || 'create_prorations',
      });

      const immediateCharge = upcomingInvoice.amount_due / 100;
      const nextInvoiceTotal = upcomingInvoice.total / 100;
      const prorationDetails = upcomingInvoice.lines.data;

      return {
        immediateCharge,
        nextInvoiceTotal,
        prorationDetails,
      };
    });
  }

  /**
   * Helper: Create or get user price for a tier
   */
  private async createOrGetUserPrice(
    tier: PricingTier,
    userPrice: number,
    yearly: boolean
  ): Promise<Stripe.Price> {
    const tierConfig = PRICING_TIERS[tier];
    const priceKey = `user_price_${tier}_${yearly ? 'yearly' : 'monthly'}`;

    try {
      // Try to find existing price
      const prices = await stripe.prices.list({
        product: tierConfig.stripeProductId,
        lookup_key: priceKey,
        active: true,
      });

      if (prices.data.length > 0) {
        return prices.data[0];
      }
    } catch (error) {
      // Continue to create new price
    }

    // Create new price
    const amount = yearly ? userPrice * 12 * 100 : userPrice * 100;
    const interval = yearly ? 'year' : 'month';

    return await stripe.prices.create({
      product: tierConfig.stripeProductId,
      currency: 'usd',
      unit_amount: amount,
      recurring: {
        interval,
      },
      lookup_key: priceKey,
      nickname: `${tier} - Additional User (${yearly ? 'Yearly' : 'Monthly'})`,
      metadata: {
        tier,
        type: 'user',
        yearly: yearly.toString(),
      },
    });
  }

  /**
   * Helper: Map Stripe subscription to our format
   */
  private mapStripeSubscription(subscription: Stripe.Subscription): SubscriptionData {
    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      organizationId: subscription.metadata.organizationId,
      tier: subscription.metadata.tier as PricingTier,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      users: parseInt(subscription.metadata.users) || 1,
      addons: (subscription.metadata.addons?.split(',').filter(Boolean) as AddonModule[]) || [],
      metadata: subscription.metadata,
    };
  }
}