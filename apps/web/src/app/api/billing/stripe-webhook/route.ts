import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, verifyWebhookSignature } from '@/lib/stripe/stripe-client';
import { stripeConfig } from '@/lib/stripe/stripe-client';

// Disable body parsing for webhook
export const runtime = 'nodejs';

/**
 * POST /api/billing/stripe-webhook - Handle Stripe webhooks
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(
      body,
      signature,
      stripeConfig.webhookSecret
    );

    console.log(`Received webhook: ${event.type}`, {
      id: event.id,
      type: event.type,
      created: event.created,
    });

    // Handle the event
    switch (event.type) {
      // Subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      // Invoice events
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
        break;

      // Payment events
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      // Customer events
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;

      // Dispute events
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 400 }
    );
  }
}

// Webhook handlers
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  try {
    // Update database with subscription information
    // This would typically update your local database

    // Send welcome email
    await sendNotificationEmail({
      type: 'subscription_created',
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      metadata: subscription.metadata,
    });
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  try {
    // Update database with new subscription details

    // Send notification if subscription was downgraded/upgraded
    await sendNotificationEmail({
      type: 'subscription_updated',
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      metadata: subscription.metadata,
    });
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  try {
    // Update database to reflect cancellation

    // Send cancellation confirmation email
    await sendNotificationEmail({
      type: 'subscription_cancelled',
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      metadata: subscription.metadata,
    });
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('Trial will end:', subscription.id);

  try {
    // Send trial ending notification
    await sendNotificationEmail({
      type: 'trial_ending',
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: subscription.metadata,
    });
  } catch (error) {
    console.error('Error handling trial will end:', error);
    throw error;
  }
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log('Invoice created:', invoice.id);

  try {
    // Store invoice in database if needed

    // Don't send notification for draft invoices
    if (invoice.status === 'draft') {
      return;
    }

    // Send invoice notification
    await sendNotificationEmail({
      type: 'invoice_created',
      customerId: invoice.customer as string,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      metadata: invoice.metadata,
    });
  } catch (error) {
    console.error('Error handling invoice created:', error);
    throw error;
  }
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  console.log('Invoice finalized:', invoice.id);

  try {
    // Send invoice to customer
    await sendNotificationEmail({
      type: 'invoice_finalized',
      customerId: invoice.customer as string,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      metadata: invoice.metadata,
    });
  } catch (error) {
    console.error('Error handling invoice finalized:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  try {
    // Update database with payment information

    // Send payment confirmation
    await sendNotificationEmail({
      type: 'payment_succeeded',
      customerId: invoice.customer as string,
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      paidAt: new Date(),
      receiptUrl: invoice.charge ? (invoice.charge as Stripe.Charge).receipt_url : undefined,
      metadata: invoice.metadata,
    });
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  try {
    // Update database with failed payment

    // Send payment failure notification
    await sendNotificationEmail({
      type: 'payment_failed',
      customerId: invoice.customer as string,
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : undefined,
      metadata: invoice.metadata,
    });
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

async function handleInvoiceUpcoming(invoice: Stripe.Invoice) {
  console.log('Upcoming invoice:', invoice.id);

  try {
    // Send upcoming invoice notification
    await sendNotificationEmail({
      type: 'upcoming_invoice',
      customerId: invoice.customer as string,
      amount: invoice.total,
      currency: invoice.currency,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      metadata: invoice.metadata,
    });
  } catch (error) {
    console.error('Error handling upcoming invoice:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Update database with successful payment

    // Generate receipt if not already done
    if (!paymentIntent.metadata.receiptGenerated) {
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          ...paymentIntent.metadata,
          receiptGenerated: 'true',
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    // Update database with failed payment

    // Send payment failure notification
    await sendNotificationEmail({
      type: 'payment_intent_failed',
      customerId: paymentIntent.customer as string,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failureReason: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method attached:', paymentMethod.id);

  try {
    // Update database with new payment method

    // Send confirmation if this is the first payment method
    const customer = await stripe.customers.retrieve(paymentMethod.customer as string);
    // Implementation would check if this is first payment method
  } catch (error) {
    console.error('Error handling payment method attached:', error);
    throw error;
  }
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method detached:', paymentMethod.id);

  try {
    // Update database to remove payment method
  } catch (error) {
    console.error('Error handling payment method detached:', error);
    throw error;
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);

  try {
    // Store customer in database if needed
  } catch (error) {
    console.error('Error handling customer created:', error);
    throw error;
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);

  try {
    // Update customer in database
  } catch (error) {
    console.error('Error handling customer updated:', error);
    throw error;
  }
}

async function handleCustomerDeleted(customer: Stripe.Customer) {
  console.log('Customer deleted:', customer.id);

  try {
    // Handle customer deletion in database
  } catch (error) {
    console.error('Error handling customer deleted:', error);
    throw error;
  }
}

async function handleDisputeCreated(charge: Stripe.Charge) {
  console.log('Dispute created for charge:', charge.id);

  try {
    // Send urgent notification about dispute
    await sendNotificationEmail({
      type: 'dispute_created',
      customerId: charge.customer as string,
      chargeId: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      metadata: charge.metadata,
    });
  } catch (error) {
    console.error('Error handling dispute created:', error);
    throw error;
  }
}

// Helper function to send notification emails
async function sendNotificationEmail(params: {
  type: string;
  customerId: string;
  [key: string]: any;
}) {
  // This would integrate with your email service
  // For now, just log the notification
  console.log('Sending notification email:', params.type, params);

  // In a real implementation, you would:
  // 1. Get customer email from database
  // 2. Select appropriate email template
  // 3. Send email via your email service (SendGrid, AWS SES, etc.)
  // 4. Log the email send event
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'stripe-billing',
    timestamp: new Date().toISOString()
  });
}