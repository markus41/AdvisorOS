import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { PaymentService } from '@/lib/billing/payment-service';
import { handleStripeError } from '@/lib/stripe/stripe-client';

// Request schemas
const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  paymentMethodId: z.string().optional(),
  invoiceId: z.string().optional(),
  description: z.string().optional(),
  captureMethod: z.enum(['automatic', 'manual']).optional(),
  confirmationMethod: z.enum(['automatic', 'manual']).optional(),
  returnUrl: z.string().url().optional(),
  metadata: z.record(z.string()).optional(),
});

const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

const paymentService = new PaymentService();

/**
 * POST /api/billing/payment - Create payment intent
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreatePaymentSchema.parse(body);

    const customerId = session.user.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      );
    }

    const payment = await paymentService.createPayment({
      customerId,
      ...validatedData,
      metadata: {
        ...validatedData.metadata,
        userId: session.user.id!,
      },
    });

    return NextResponse.json({ payment });
  } catch (error: any) {
    console.error('Create payment error:', error);

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
 * GET /api/billing/payment - Get payment history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startingAfter = searchParams.get('startingAfter') || undefined;

    const customerId = session.user.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ payments: [], hasMore: false });
    }

    if (paymentId) {
      // Get specific payment
      const payment = await paymentService.getPayment(paymentId);
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      return NextResponse.json({ payment });
    }

    // Get payment history
    const result = await paymentService.getCustomerPaymentHistory(customerId, {
      limit,
      startingAfter,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get payment error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/billing/payment - Confirm payment intent
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, paymentIntentId, ...actionData } = body;

    let payment;

    switch (action) {
      case 'confirm':
        const confirmData = ConfirmPaymentSchema.parse({ paymentIntentId, ...actionData });
        payment = await paymentService.confirmPayment(
          confirmData.paymentIntentId,
          confirmData.paymentMethodId,
          confirmData.returnUrl
        );
        break;

      case 'capture':
        payment = await paymentService.capturePayment(
          paymentIntentId,
          actionData.amountToCapture
        );
        break;

      case 'cancel':
        payment = await paymentService.cancelPayment(
          paymentIntentId,
          actionData.reason
        );
        break;

      case 'retry':
        payment = await paymentService.retryFailedPayment(
          paymentIntentId,
          actionData.newPaymentMethodId
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: confirm, capture, cancel, retry' },
          { status: 400 }
        );
    }

    return NextResponse.json({ payment });
  } catch (error: any) {
    console.error('Update payment error:', error);

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