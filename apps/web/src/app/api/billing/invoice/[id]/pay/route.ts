import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { PaymentService } from '@/lib/billing/payment-service';
import { handleStripeError } from '@/lib/stripe/stripe-client';

const PayInvoiceSchema = z.object({
  paymentMethodId: z.string().optional(),
});

const paymentService = new PaymentService();

/**
 * POST /api/billing/invoice/[id]/pay - Pay invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = PayInvoiceSchema.parse(body);

    const payment = await paymentService.payInvoice(
      params.id,
      validatedData.paymentMethodId
    );

    return NextResponse.json({ payment });
  } catch (error: any) {
    console.error('Pay invoice error:', error);

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