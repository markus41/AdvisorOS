import Stripe from 'stripe';
import { db } from '@cpa-platform/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    price: 99,
    currency: 'USD',
    interval: 'month',
    features: {
      maxClients: 10,
      maxUsers: 3,
      storageGB: 1,
      supportLevel: 'email',
      integrations: ['quickbooks'],
      advancedReporting: false,
      customBranding: false
    },
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID
  },
  professional: {
    name: 'Professional',
    price: 299,
    currency: 'USD',
    interval: 'month',
    features: {
      maxClients: 50,
      maxUsers: 10,
      storageGB: 10,
      supportLevel: 'priority',
      integrations: ['quickbooks', 'stripe', 'microsoft365'],
      advancedReporting: true,
      customBranding: true
    },
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID
  },
  enterprise: {
    name: 'Enterprise',
    price: 599,
    currency: 'USD',
    interval: 'month',
    features: {
      maxClients: -1, // unlimited
      maxUsers: -1, // unlimited
      storageGB: 100,
      supportLevel: 'phone',
      integrations: ['quickbooks', 'stripe', 'microsoft365', 'tax_software'],
      advancedReporting: true,
      customBranding: true,
      whiteLabel: true
    },
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
  }
} as const;

// Add-on pricing
export const ADDON_PRICING = {
  additionalUser: {
    name: 'Additional User',
    price: 29,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.STRIPE_ADDITIONAL_USER_PRICE_ID
  },
  additionalStorage: {
    name: 'Additional Storage (10GB)',
    price: 10,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.STRIPE_ADDITIONAL_STORAGE_PRICE_ID
  }
} as const;

class StripeService {
  async createCustomer(organizationId: string, email: string, name: string, metadata?: Record<string, string>) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          organizationId,
          ...metadata
        }
      });

      // Update organization with Stripe customer ID
      await db.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customer.id }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    try {
      return await stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      throw error;
    }
  }

  async createSubscription(
    organizationId: string,
    planName: keyof typeof SUBSCRIPTION_TIERS,
    paymentMethodId?: string,
    additionalUsers = 0,
    additionalStorageBlocks = 0
  ) {
    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      let customerId = organization.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await this.createCustomer(
          organizationId,
          `admin@${organization.subdomain}.com`, // Default email
          organization.name
        );
        customerId = customer.id;
      }

      const tier = SUBSCRIPTION_TIERS[planName];
      const lineItems: Stripe.SubscriptionCreateParams.Item[] = [
        {
          price: tier.stripePriceId,
          quantity: 1
        }
      ];

      // Add additional users
      if (additionalUsers > 0) {
        lineItems.push({
          price: ADDON_PRICING.additionalUser.stripePriceId,
          quantity: additionalUsers
        });
      }

      // Add additional storage
      if (additionalStorageBlocks > 0) {
        lineItems.push({
          price: ADDON_PRICING.additionalStorage.stripePriceId,
          quantity: additionalStorageBlocks
        });
      }

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: lineItems,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          organizationId,
          planName,
          additionalUsers: additionalUsers.toString(),
          additionalStorageBlocks: additionalStorageBlocks.toString()
        }
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Create subscription record in database
      await db.subscription.upsert({
        where: { organizationId },
        update: {
          planName,
          planType: 'monthly',
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
          stripePriceId: tier.stripePriceId,
          stripeCustomerId: customerId,
          quantity: 1,
          unitAmount: tier.price,
          features: tier.features,
          limits: {
            maxClients: tier.features.maxClients,
            maxUsers: tier.features.maxUsers + additionalUsers,
            storageGB: tier.features.storageGB + (additionalStorageBlocks * 10)
          },
          usage: {
            clients: 0,
            users: 1,
            storageGB: 0
          }
        },
        create: {
          organizationId,
          planName,
          planType: 'monthly',
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
          stripePriceId: tier.stripePriceId,
          stripeCustomerId: customerId,
          quantity: 1,
          unitAmount: tier.price,
          features: tier.features,
          limits: {
            maxClients: tier.features.maxClients,
            maxUsers: tier.features.maxUsers + additionalUsers,
            storageGB: tier.features.storageGB + (additionalStorageBlocks * 10)
          },
          usage: {
            clients: 0,
            users: 1,
            storageGB: 0
          }
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async updateSubscription(organizationId: string, updates: {
    planName?: keyof typeof SUBSCRIPTION_TIERS;
    additionalUsers?: number;
    additionalStorageBlocks?: number;
  }) {
    try {
      const subscription = await db.subscription.findUnique({
        where: { organizationId }
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      // If changing plan, update the subscription items
      if (updates.planName) {
        const newTier = SUBSCRIPTION_TIERS[updates.planName];

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newTier.stripePriceId
            }
          ],
          proration_behavior: 'create_prorations'
        });

        // Update database
        await db.subscription.update({
          where: { organizationId },
          data: {
            planName: updates.planName,
            stripePriceId: newTier.stripePriceId,
            unitAmount: newTier.price,
            features: newTier.features
          }
        });
      }

      return await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(organizationId: string, immediately = false) {
    try {
      const subscription = await db.subscription.findUnique({
        where: { organizationId }
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      let canceledSubscription;

      if (immediately) {
        canceledSubscription = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        canceledSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }

      // Update database
      await db.subscription.update({
        where: { organizationId },
        data: {
          status: canceledSubscription.status,
          cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
          canceledAt: immediately ? new Date() : null
        }
      });

      return canceledSubscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async createInvoice(organizationId: string, items: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>) {
    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization?.stripeCustomerId) {
        throw new Error('Customer not found');
      }

      // Create invoice items
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: organization.stripeCustomerId,
          description: item.description,
          amount: Math.round(item.amount * 100), // Convert to cents
          quantity: item.quantity || 1
        });
      }

      // Create and finalize invoice
      const invoice = await stripe.invoices.create({
        customer: organization.stripeCustomerId,
        auto_advance: true
      });

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

      return finalizedInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async processPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  async handleFailedPayment(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update subscription status in database
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: subscription.status }
      });

      // Implement dunning logic here (send emails, etc.)
      console.log('Handling failed payment for subscription:', subscriptionId);

      return subscription;
    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw error;
    }
  }

  async generateUsageRecord(organizationId: string, feature: string, quantity: number) {
    try {
      // This would be used for usage-based billing features
      // For now, we'll just track usage in our database
      const subscription = await db.subscription.findUnique({
        where: { organizationId }
      });

      if (subscription) {
        const currentUsage = subscription.usage as any || {};
        currentUsage[feature] = (currentUsage[feature] || 0) + quantity;

        await db.subscription.update({
          where: { organizationId },
          data: { usage: currentUsage }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error generating usage record:', error);
      throw error;
    }
  }

  async createCheckoutSession(
    organizationId: string,
    planName: keyof typeof SUBSCRIPTION_TIERS,
    successUrl: string,
    cancelUrl: string,
    additionalUsers = 0,
    additionalStorageBlocks = 0
  ) {
    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      const tier = SUBSCRIPTION_TIERS[planName];
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price: tier.stripePriceId,
          quantity: 1
        }
      ];

      // Add additional items
      if (additionalUsers > 0) {
        lineItems.push({
          price: ADDON_PRICING.additionalUser.stripePriceId,
          quantity: additionalUsers
        });
      }

      if (additionalStorageBlocks > 0) {
        lineItems.push({
          price: ADDON_PRICING.additionalStorage.stripePriceId,
          quantity: additionalStorageBlocks
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: organization.stripeCustomerId,
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organizationId,
          planName,
          additionalUsers: additionalUsers.toString(),
          additionalStorageBlocks: additionalStorageBlocks.toString()
        },
        subscription_data: {
          metadata: {
            organizationId,
            planName
          }
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async createPortalSession(organizationId: string, returnUrl: string) {
    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization?.stripeCustomerId) {
        throw new Error('Customer not found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: returnUrl
      });

      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  async getSubscriptionUsage(organizationId: string) {
    try {
      const subscription = await db.subscription.findUnique({
        where: { organizationId },
        include: {
          organization: {
            include: {
              clients: { where: { deletedAt: null } },
              users: { where: { deletedAt: null } }
            }
          }
        }
      });

      if (!subscription) {
        return null;
      }

      const clientCount = subscription.organization.clients.length;
      const userCount = subscription.organization.users.length;

      // Calculate storage usage (this would be based on actual file storage)
      const storageUsageGB = 0.5; // Placeholder

      return {
        clients: {
          used: clientCount,
          limit: subscription.limits?.maxClients || 0,
          percentage: subscription.limits?.maxClients > 0 ? (clientCount / subscription.limits.maxClients) * 100 : 0
        },
        users: {
          used: userCount,
          limit: subscription.limits?.maxUsers || 0,
          percentage: subscription.limits?.maxUsers > 0 ? (userCount / subscription.limits.maxUsers) * 100 : 0
        },
        storage: {
          used: storageUsageGB,
          limit: subscription.limits?.storageGB || 0,
          percentage: subscription.limits?.storageGB > 0 ? (storageUsageGB / subscription.limits.storageGB) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Error getting subscription usage:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();