import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { SubscriptionService } from '@/lib/billing/subscription-service';
import { PricingTier, AddonModule } from '@/lib/billing/pricing-config';
import { handleStripeError } from '@/lib/stripe/stripe-client';

// Request schemas
const CreateSubscriptionSchema = z.object({
  tier: z.nativeEnum(PricingTier),
  users: z.number().min(1),
  addons: z.array(z.nativeEnum(AddonModule)).optional(),
  paymentMethodId: z.string().optional(),
  yearly: z.boolean().optional(),
  trialDays: z.number().min(0).max(30).optional(),
});

const UpdateSubscriptionSchema = z.object({
  tier: z.nativeEnum(PricingTier).optional(),
  users: z.number().min(1).optional(),
  addons: z.array(z.nativeEnum(AddonModule)).optional(),
  yearly: z.boolean().optional(),
  prorationBehavior: z.enum(['none', 'create_prorations', 'always_invoice']).optional(),
});

const subscriptionService = new SubscriptionService();

/**
 * POST /api/billing/subscription - Create new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateSubscriptionSchema.parse(body);

    // Get organization and customer info from session/database
    // This would typically come from your authentication system
    const organizationId = session.user.organizationId || 'org_default';
    const email = session.user.email!;
    const customerId = session.user.stripeCustomerId;

    const subscription = await subscriptionService.createSubscription({
      organizationId,
      customerId,
      email,
      tier: validatedData.tier,
      users: validatedData.users,
      addons: validatedData.addons,
      paymentMethodId: validatedData.paymentMethodId,
      yearly: validatedData.yearly,
      trialDays: validatedData.trialDays,
      metadata: {
        userId: session.user.id!,
        email,
      },
    });

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Create subscription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}

/**
 * GET /api/billing/subscription - Get current subscription
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      // Get customer subscriptions
      const customerId = session.user.stripeCustomerId;
      if (!customerId) {
        return NextResponse.json({ subscriptions: [] });
      }

      const subscriptions = await subscriptionService.getCustomerSubscriptions(customerId);
      return NextResponse.json({ subscriptions });
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Get subscription error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/billing/subscription - Update subscription
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, ...updateData } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const validatedData = UpdateSubscriptionSchema.parse(updateData);

    const subscription = await subscriptionService.updateSubscription({
      subscriptionId,
      ...validatedData,
    });

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Update subscription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/billing/subscription - Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    const immediate = searchParams.get('immediate') === 'true';

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const subscription = await subscriptionService.cancelSubscription(
      subscriptionId,
      immediate
    );

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}