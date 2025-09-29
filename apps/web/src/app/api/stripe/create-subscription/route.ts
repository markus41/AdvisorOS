import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// import { stripeService, SUBSCRIPTION_TIERS } from '@/server/services/stripe.service';
import { prisma as db } from "@/server/db";

// Mock subscription tiers for testing
const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: ['Basic features']
  },
  professional: {
    name: 'Professional',
    price: 99,
    currency: 'usd',
    interval: 'month',
    features: ['Advanced features']
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    currency: 'usd',
    interval: 'month',
    features: ['All features']
  }
};

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

    // Create subscription (mock implementation)
    const subscription = {
      id: 'sub_test_' + Math.random().toString(36).substr(2, 9),
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      latest_invoice: 'in_test_' + Math.random().toString(36).substr(2, 9)
    };

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

    // Update subscription (mock implementation)
    const subscription = {
      id: 'sub_test_' + Math.random().toString(36).substr(2, 9),
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
    };

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

    // Cancel subscription (mock implementation)
    const subscription = {
      id: 'sub_test_' + Math.random().toString(36).substr(2, 9),
      status: immediately ? 'canceled' : 'active',
      cancel_at_period_end: !immediately,
      canceled_at: immediately ? Math.floor(Date.now() / 1000) : null
    };

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

    // Get usage information (mock implementation)
    const usage = {
      users: { current: 5, limit: 10 },
      storage: { current: 1024, limit: 5120 },
      apiCalls: { current: 1000, limit: 10000 }
    };

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