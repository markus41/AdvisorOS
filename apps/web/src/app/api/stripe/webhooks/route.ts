import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma as db } from "@/server/db";
// import { stripeService } from '@/server/services/stripe.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) {
      console.error('No organizationId in subscription metadata');
      return;
    }

    await db.subscription.upsert({
      where: { organizationId },
      update: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      },
      create: {
        organizationId,
        planName: subscription.metadata.planName || 'starter',
        planType: 'monthly',
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        quantity: 1,
        currency: 'USD'
      }
    });

    // Update organization subscription tier
    await db.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionTier: subscription.metadata.planName || 'starter',
        stripeCustomerId: subscription.customer as string
      }
    });

    console.log(`Subscription created for organization: ${organizationId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) {
      console.error('No organizationId in subscription metadata');
      return;
    }

    await db.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updatedAt: new Date()
      }
    });

    // Update organization subscription tier if plan changed
    if (subscription.metadata.planName) {
      await db.organization.update({
        where: { id: organizationId },
        data: { subscriptionTier: subscription.metadata.planName }
      });
    }

    console.log(`Subscription updated for organization: ${organizationId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) {
      console.error('No organizationId in subscription metadata');
      return;
    }

    await db.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Revert organization to trial/free tier
    await db.organization.update({
      where: { id: organizationId },
      data: { subscriptionTier: 'trial' }
    });

    console.log(`Subscription deleted for organization: ${organizationId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    // Update subscription status to active
    await db.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    });

    // Send payment confirmation email (implement as needed)
    console.log(`Payment succeeded for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    // Update subscription status
    await db.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'past_due',
        updatedAt: new Date()
      }
    });

    // Handle failed payment (send emails, update access, etc.)
    // await stripeService.handleFailedPayment(subscriptionId);

    console.log(`Payment failed for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    const organizationId = customer.metadata.organizationId;
    if (!organizationId) return;

    await db.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customer.id }
    });

    console.log(`Customer created for organization: ${organizationId}`);
  } catch (error) {
    console.error('Error handling customer created:', error);
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  try {
    // Handle customer updates if needed
    console.log(`Customer updated: ${customer.id}`);
  } catch (error) {
    console.error('Error handling customer updated:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    // Handle payment method attachment if needed
    console.log(`Payment method attached: ${paymentMethod.id}`);
  } catch (error) {
    console.error('Error handling payment method attached:', error);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) return;

    // The subscription should already be created by the subscription.created event
    // This is mainly for logging and additional processing
    await db.auditLog.create({
      data: {
        action: 'complete',
        entityType: 'checkout_session',
        entityId: session.id,
        newValues: {
          mode: session.mode,
          paymentStatus: session.payment_status,
          amount: session.amount_total
        },
        organizationId,
        metadata: { source: 'stripe_webhook' }
      }
    });

    console.log(`Checkout session completed for organization: ${organizationId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// GET endpoint for webhook verification during setup
export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}