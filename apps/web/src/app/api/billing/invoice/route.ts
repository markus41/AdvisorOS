import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { InvoiceService } from '@/lib/billing/invoice-service';
import { handleStripeError } from '@/lib/stripe/stripe-client';

// Request schemas
const InvoiceLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  taxable: z.boolean().optional().default(false),
  taxRate: z.number().min(0).max(100).optional(),
  metadata: z.record(z.string()).optional(),
});

const CreateInvoiceSchema = z.object({
  customerId: z.string(),
  description: z.string().optional(),
  lineItems: z.array(InvoiceLineItemSchema),
  dueDate: z.string().datetime().optional(),
  paymentTerms: z.number().min(0).max(365).optional(),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  footer: z.string().optional(),
  autoAdvance: z.boolean().optional(),
  collectionMethod: z.enum(['charge_automatically', 'send_invoice']).optional(),
  metadata: z.record(z.string()).optional(),
});

const PayInvoiceSchema = z.object({
  paymentMethodId: z.string().optional(),
});

const invoiceService = new InvoiceService();

/**
 * POST /api/billing/invoice - Create new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateInvoiceSchema.parse(body);

    const organizationId = session.user.organizationId || 'org_default';

    const invoice = await invoiceService.createInvoice({
      ...validatedData,
      organizationId,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      metadata: {
        ...validatedData.metadata,
        createdBy: session.user.id!,
      },
    });

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Create invoice error:', error);

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
 * GET /api/billing/invoice - List invoices
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50');
    const startingAfter = searchParams.get('startingAfter') || undefined;

    let result;

    if (customerId) {
      result = await invoiceService.getCustomerInvoices(customerId, {
        status,
        limit,
        startingAfter,
      });
    } else if (organizationId) {
      result = await invoiceService.getOrganizationInvoices(organizationId, {
        status,
        limit,
        startingAfter,
      });
    } else {
      return NextResponse.json(
        { error: 'Either customerId or organizationId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get invoices error:', error);

    const stripeError = handleStripeError(error);
    return NextResponse.json(
      { error: stripeError.message },
      { status: stripeError.statusCode || 500 }
    );
  }
}