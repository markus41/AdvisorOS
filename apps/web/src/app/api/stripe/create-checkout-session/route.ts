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
      additionalUsers = 0,
      additionalStorageBlocks = 0,
      successUrl,
      cancelUrl
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

    // Set default URLs if not provided
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const defaultSuccessUrl = successUrl || `${baseUrl}/dashboard/billing?success=true`;
    const defaultCancelUrl = cancelUrl || `${baseUrl}/dashboard/billing?canceled=true`;

    // Create checkout session
    const checkoutSession = await stripeService.createCheckoutSession(
      session.user.organizationId,
      planName,
      defaultSuccessUrl,
      defaultCancelUrl,
      additionalUsers,
      additionalStorageBlocks
    );

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'create',
        entityType: 'checkout_session',
        entityId: checkoutSession.id,
        newValues: {
          planName,
          additionalUsers,
          additionalStorageBlocks,
          amount: checkoutSession.amount_total
        },
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'checkout_api' }
      }
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
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

    // Return available plans and pricing
    const plans = Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
      id: key,
      name: tier.name,
      price: tier.price,
      currency: tier.currency,
      interval: tier.interval,
      features: tier.features
    }));

    return NextResponse.json({ plans });

  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}