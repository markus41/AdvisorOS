import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { stripeService, SUBSCRIPTION_TIERS } from '../../../server/services/stripe.service';
import { db } from "../../../../server/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      planName,
      paymentMethodId,
      additionalUsers = 0,
      additionalStorageBlocks = 0
    } = await request.json();

    // Validate plan name
    if (!SUBSCRIPTION_TIERS[planName as keyof typeof SUBSCRIPTION_TIERS]) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 });
    }

    // Check if organization already has an active subscription
    const existingSubscription = await db.subscription.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'Organization already has an active subscription' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await stripeService.createSubscription(
      session.user.organizationId,
      planName,
      paymentMethodId,
      additionalUsers,
      additionalStorageBlocks
    );

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'create',
        entityType: 'subscription',
        entityId: subscription.id,
        newValues: {
          planName,
          status: subscription.status,
          additionalUsers,
          additionalStorageBlocks
        },
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'subscription_api' }
      }
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        latest_invoice: subscription.latest_invoice
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Validate plan name if provided
    if (updates.planName && !SUBSCRIPTION_TIERS[updates.planName as keyof typeof SUBSCRIPTION_TIERS]) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 });
    }

    // Update subscription
    const subscription = await stripeService.updateSubscription(
      session.user.organizationId,
      updates
    );

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'update',
        entityType: 'subscription',
        entityId: subscription.id,
        newValues: updates,
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'subscription_api' }
      }
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end
      }
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const immediately = searchParams.get('immediately') === 'true';

    // Cancel subscription
    const subscription = await stripeService.cancelSubscription(
      session.user.organizationId,
      immediately
    );

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'cancel',
        entityType: 'subscription',
        entityId: subscription.id,
        newValues: {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          immediately
        },
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'subscription_api' }
      }
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
      }
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current subscription
    const subscription = await db.subscription.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    // Get usage information
    const usage = await stripeService.getSubscriptionUsage(session.user.organizationId);

    return NextResponse.json({
      subscription: {
        id: subscription.stripeSubscriptionId,
        planName: subscription.planName,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        features: subscription.features,
        limits: subscription.limits,
        usage
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}