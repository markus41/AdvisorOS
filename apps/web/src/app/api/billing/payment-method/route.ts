import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { PaymentService } from '@/lib/billing/payment-service';
import { handleStripeError } from '@/lib/stripe/stripe-client';

// Request schemas
const AddPaymentMethodSchema = z.object({
  type: z.enum(['card', 'us_bank_account']),
  paymentMethodId: z.string().optional(),
  bankAccount: z.object({
    routingNumber: z.string(),
    accountNumber: z.string(),
    accountType: z.enum(['checking', 'savings']),
    accountHolderType: z.enum(['individual', 'company']),
  }).optional(),
  setAsDefault: z.boolean().optional(),
});

const SetDefaultSchema = z.object({
  paymentMethodId: z.string(),
});

const paymentService = new PaymentService();

/**
 * POST /api/billing/payment-method - Add new payment method
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = AddPaymentMethodSchema.parse(body);

    const customerId = session.user.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      );
    }

    const paymentMethod = await paymentService.addPaymentMethod({
      customerId,
      type: validatedData.type,
      paymentMethodId: validatedData.paymentMethodId,
      bankAccount: validatedData.bankAccount,
      setAsDefault: validatedData.setAsDefault,
    });

    return NextResponse.json({ paymentMethod });
  } catch (error: any) {
    console.error('Add payment method error:', error);

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
 * GET /api/billing/payment-method - Get customer payment methods
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = session.user.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const paymentMethods = await paymentService.getCustomerPaymentMethods(customerId);

    return NextResponse.json({ paymentMethods });
  } catch (error: any) {
    console.error('Get payment methods error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/billing/payment-method - Set default payment method
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = SetDefaultSchema.parse(body);

    const customerId = session.user.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      );
    }

    await paymentService.setDefaultPaymentMethod(
      customerId,
      validatedData.paymentMethodId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Set default payment method error:', error);

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
 * DELETE /api/billing/payment-method - Remove payment method
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    await paymentService.removePaymentMethod(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove payment method error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}