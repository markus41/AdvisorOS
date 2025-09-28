import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { InvoiceService } from '@/lib/billing/invoice-service';
import { handleStripeError } from '@/lib/stripe/stripe-client';

const PayInvoiceSchema = z.object({
  paymentMethodId: z.string().optional(),
});

const invoiceService = new InvoiceService();

/**
 * GET /api/billing/invoice/[id] - Get invoice details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await invoiceService.getInvoice(params.id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Get invoice error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/billing/invoice/[id] - Update invoice (finalize/void)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    let invoice;

    switch (action) {
      case 'finalize':
        invoice = await invoiceService.finalizeInvoice(params.id);
        break;
      case 'send':
        invoice = await invoiceService.sendInvoice(params.id);
        break;
      case 'void':
        invoice = await invoiceService.voidInvoice(params.id);
        break;
      case 'mark_paid':
        const paymentDate = body.paymentDate ? new Date(body.paymentDate) : undefined;
        invoice = await invoiceService.markInvoiceAsPaid(params.id, paymentDate);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: finalize, send, void, mark_paid' },
          { status: 400 }
        );
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Update invoice error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}