import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { stripeService } from '../../../server/services/stripe.service';
import { db } from '@cpa-platform/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { returnUrl } = await request.json();

    // Set default return URL if not provided
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const defaultReturnUrl = returnUrl || `${baseUrl}/dashboard/billing`;

    // Check if organization has a Stripe customer
    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId }
    });

    if (!organization?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please set up a subscription first.' },
        { status: 400 }
      );
    }

    // Create portal session
    const portalSession = await stripeService.createPortalSession(
      session.user.organizationId,
      defaultReturnUrl
    );

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'access',
        entityType: 'billing_portal',
        entityId: portalSession.id,
        newValues: { returnUrl: defaultReturnUrl },
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'portal_api' }
      }
    });

    return NextResponse.json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
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

    // Check if organization has billing setup
    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        subscription: true
      }
    });

    const hasStripeCustomer = !!organization?.stripeCustomerId;
    const hasActiveSubscription = organization?.subscription?.status === 'active';

    return NextResponse.json({
      canAccessPortal: hasStripeCustomer,
      hasActiveSubscription,
      subscriptionStatus: organization?.subscription?.status || null
    });

  } catch (error) {
    console.error('Error checking portal access:', error);
    return NextResponse.json(
      { error: 'Failed to check portal access' },
      { status: 500 }
    );
  }
}