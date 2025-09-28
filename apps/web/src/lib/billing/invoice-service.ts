import Stripe from 'stripe';
import { stripe, withRetry, stripeLimiter, formatAmountForStripe, formatAmountFromStripe } from '../stripe/stripe-client';

// Invoice interfaces
export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
  taxRate?: number;
  metadata?: Record<string, string>;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  lineItems: Omit<InvoiceLineItem, 'id' | 'amount'>[];
  paymentTerms: number; // Days
  notes?: string;
  organizationId: string;
}

export interface CreateInvoiceParams {
  customerId: string;
  organizationId: string;
  description?: string;
  lineItems: Omit<InvoiceLineItem, 'id' | 'amount'>[];
  dueDate?: Date;
  paymentTerms?: number; // Days from creation
  currency?: string;
  taxRate?: number;
  discountPercent?: number;
  discountAmount?: number;
  notes?: string;
  footer?: string;
  metadata?: Record<string, string>;
  autoAdvance?: boolean; // Auto-finalize and send
  collectionMethod?: 'charge_automatically' | 'send_invoice';
}

export interface InvoiceData {
  id: string;
  customerId: string;
  organizationId: string;
  number: string;
  status: Stripe.Invoice.Status;
  description?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  createdAt: Date;
  dueDate?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  paymentTerms?: number;
  notes?: string;
  footer?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  metadata: Record<string, string>;
}

export interface RecurringInvoiceConfig {
  templateId: string;
  customerId: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number; // For monthly (1-31)
  monthOfYear?: number; // For yearly (1-12)
  nextInvoiceDate: Date;
  endDate?: Date;
  maxInvoices?: number;
  active: boolean;
}

export interface PaymentTermsConfig {
  net15: 15,
  net30: 30,
  net45: 45,
  net60: 60,
  dueOnReceipt: 0,
  custom: number,
}

export const PAYMENT_TERMS: PaymentTermsConfig = {
  net15: 15,
  net30: 30,
  net45: 45,
  net60: 60,
  dueOnReceipt: 0,
  custom: 0, // Will be set dynamically
};

export class InvoiceService {
  /**
   * Create a new manual invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      // Validate customer exists
      const customer = await stripe.customers.retrieve(params.customerId);
      if (!customer || customer.deleted) {
        throw new Error('Customer not found');
      }

      // Calculate line item amounts and totals
      let subtotal = 0;
      const processedLineItems: InvoiceLineItem[] = [];

      for (const item of params.lineItems) {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;

        processedLineItems.push({
          ...item,
          amount,
        });
      }

      // Apply discounts
      let discountAmount = 0;
      if (params.discountPercent && params.discountPercent > 0) {
        discountAmount = subtotal * (params.discountPercent / 100);
      } else if (params.discountAmount && params.discountAmount > 0) {
        discountAmount = params.discountAmount;
      }

      const discountedSubtotal = subtotal - discountAmount;

      // Calculate tax
      const taxRate = params.taxRate || 0;
      const taxAmount = discountedSubtotal * (taxRate / 100);

      const total = discountedSubtotal + taxAmount;

      // Create invoice in Stripe
      const invoiceParams: Stripe.InvoiceCreateParams = {
        customer: params.customerId,
        currency: params.currency || 'usd',
        collection_method: params.collectionMethod || 'send_invoice',
        auto_advance: params.autoAdvance || false,
        description: params.description,
        footer: params.footer,
        metadata: {
          organizationId: params.organizationId,
          type: 'manual',
          lineItemsCount: processedLineItems.length.toString(),
          ...params.metadata,
        },
      };

      // Set due date
      if (params.dueDate) {
        invoiceParams.due_date = Math.floor(params.dueDate.getTime() / 1000);
      } else if (params.paymentTerms !== undefined) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + params.paymentTerms);
        invoiceParams.due_date = Math.floor(dueDate.getTime() / 1000);
      }

      const invoice = await stripe.invoices.create(invoiceParams);

      // Add line items
      for (const item of processedLineItems) {
        await stripe.invoiceItems.create({
          customer: params.customerId,
          invoice: invoice.id,
          amount: formatAmountForStripe(item.amount, params.currency),
          currency: params.currency || 'usd',
          description: item.description,
          quantity: item.quantity,
          unit_amount: formatAmountForStripe(item.unitPrice, params.currency),
          metadata: {
            ...item.metadata,
            taxable: item.taxable.toString(),
          },
        });
      }

      // Apply discount if any
      if (discountAmount > 0) {
        await stripe.invoiceItems.create({
          customer: params.customerId,
          invoice: invoice.id,
          amount: -formatAmountForStripe(discountAmount, params.currency),
          currency: params.currency || 'usd',
          description: params.discountPercent
            ? `Discount (${params.discountPercent}%)`
            : 'Discount',
        });
      }

      // Apply tax if any
      if (taxAmount > 0) {
        await stripe.invoiceItems.create({
          customer: params.customerId,
          invoice: invoice.id,
          amount: formatAmountForStripe(taxAmount, params.currency),
          currency: params.currency || 'usd',
          description: `Tax (${taxRate}%)`,
          metadata: {
            type: 'tax',
            rate: taxRate.toString(),
          },
        });
      }

      // Refresh invoice to get final totals
      const finalInvoice = await stripe.invoices.retrieve(invoice.id, {
        expand: ['payment_intent'],
      });

      return this.mapStripeInvoice(finalInvoice, processedLineItems);
    });
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<InvoiceData | null> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      try {
        const invoice = await stripe.invoices.retrieve(invoiceId, {
          expand: ['payment_intent'],
        });

        // Get line items
        const lineItems = await this.getInvoiceLineItems(invoiceId);

        return this.mapStripeInvoice(invoice, lineItems);
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * List invoices for a customer
   */
  async getCustomerInvoices(
    customerId: string,
    options: {
      limit?: number;
      status?: Stripe.Invoice.Status;
      startingAfter?: string;
    } = {}
  ): Promise<{
    invoices: InvoiceData[];
    hasMore: boolean;
  }> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const params: Stripe.InvoiceListParams = {
        customer: customerId,
        limit: options.limit || 50,
        expand: ['data.payment_intent'],
      };

      if (options.status) {
        params.status = options.status;
      }

      if (options.startingAfter) {
        params.starting_after = options.startingAfter;
      }

      const result = await stripe.invoices.list(params);

      const invoices = await Promise.all(
        result.data.map(async (invoice) => {
          const lineItems = await this.getInvoiceLineItems(invoice.id);
          return this.mapStripeInvoice(invoice, lineItems);
        })
      );

      return {
        invoices,
        hasMore: result.has_more,
      };
    });
  }

  /**
   * List invoices for an organization
   */
  async getOrganizationInvoices(
    organizationId: string,
    options: {
      limit?: number;
      status?: Stripe.Invoice.Status;
      startingAfter?: string;
    } = {}
  ): Promise<{
    invoices: InvoiceData[];
    hasMore: boolean;
  }> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const params: Stripe.InvoiceListParams = {
        limit: options.limit || 50,
        expand: ['data.payment_intent'],
      };

      if (options.status) {
        params.status = options.status;
      }

      if (options.startingAfter) {
        params.starting_after = options.startingAfter;
      }

      const result = await stripe.invoices.list(params);

      // Filter by organization ID
      const organizationInvoices = result.data.filter(
        invoice => invoice.metadata.organizationId === organizationId
      );

      const invoices = await Promise.all(
        organizationInvoices.map(async (invoice) => {
          const lineItems = await this.getInvoiceLineItems(invoice.id);
          return this.mapStripeInvoice(invoice, lineItems);
        })
      );

      return {
        invoices,
        hasMore: result.has_more && organizationInvoices.length > 0,
      };
    });
  }

  /**
   * Finalize an invoice (make it ready to send)
   */
  async finalizeInvoice(invoiceId: string): Promise<InvoiceData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const invoice = await stripe.invoices.finalizeInvoice(invoiceId, {
        auto_advance: false,
      });

      const lineItems = await this.getInvoiceLineItems(invoiceId);
      return this.mapStripeInvoice(invoice, lineItems);
    });
  }

  /**
   * Send an invoice to the customer
   */
  async sendInvoice(invoiceId: string): Promise<InvoiceData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const invoice = await stripe.invoices.sendInvoice(invoiceId);

      const lineItems = await this.getInvoiceLineItems(invoiceId);
      return this.mapStripeInvoice(invoice, lineItems);
    });
  }

  /**
   * Void an invoice
   */
  async voidInvoice(invoiceId: string): Promise<InvoiceData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const invoice = await stripe.invoices.voidInvoice(invoiceId);

      const lineItems = await this.getInvoiceLineItems(invoiceId);
      return this.mapStripeInvoice(invoice, lineItems);
    });
  }

  /**
   * Mark invoice as paid (for manual payment tracking)
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    paymentDate?: Date
  ): Promise<InvoiceData> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const invoice = await stripe.invoices.retrieve(invoiceId);

      if (invoice.status === 'paid') {
        const lineItems = await this.getInvoiceLineItems(invoiceId);
        return this.mapStripeInvoice(invoice, lineItems);
      }

      // Mark as paid by creating a payment intent if needed
      if (invoice.payment_intent) {
        // Update payment intent to simulate successful payment
        await stripe.paymentIntents.update(invoice.payment_intent as string, {
          metadata: {
            ...invoice.metadata,
            manual_payment: 'true',
            payment_date: (paymentDate || new Date()).toISOString(),
          },
        });
      }

      const updatedInvoice = await stripe.invoices.pay(invoiceId, {
        paid_out_of_band: true,
      });

      const lineItems = await this.getInvoiceLineItems(invoiceId);
      return this.mapStripeInvoice(updatedInvoice, lineItems);
    });
  }

  /**
   * Create credit note for an invoice
   */
  async createCreditNote(
    invoiceId: string,
    amount?: number,
    lineItems?: { invoice_line_item: string; quantity?: number }[],
    reason?: string
  ): Promise<Stripe.CreditNote> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const params: Stripe.CreditNoteCreateParams = {
        invoice: invoiceId,
        reason: 'other',
        metadata: {
          custom_reason: reason || 'Credit note',
        },
      };

      if (amount) {
        params.amount = formatAmountForStripe(amount);
      }

      if (lineItems && lineItems.length > 0) {
        params.lines = lineItems;
      }

      return await stripe.creditNotes.create(params);
    });
  }

  /**
   * Generate payment link for invoice
   */
  async createPaymentLink(
    invoiceId: string,
    options: {
      returnUrl?: string;
      allowPromotionCodes?: boolean;
    } = {}
  ): Promise<string> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      const invoice = await stripe.invoices.retrieve(invoiceId);

      if (!invoice.payment_intent) {
        throw new Error('Invoice must have a payment intent to create payment link');
      }

      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: invoice.currency,
              product_data: {
                name: `Invoice ${invoice.number}`,
                description: invoice.description || undefined,
              },
              unit_amount: invoice.amount_due,
            },
            quantity: 1,
          },
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: options.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoiceId}/success`,
          },
        },
        allow_promotion_codes: options.allowPromotionCodes || false,
        metadata: {
          invoiceId,
          type: 'invoice_payment',
        },
      });

      return paymentLink.url;
    });
  }

  /**
   * Schedule recurring invoice
   */
  async scheduleRecurringInvoice(config: RecurringInvoiceConfig): Promise<string> {
    // This would integrate with a job scheduling system
    // For now, we'll store the configuration and rely on a cron job to process

    const scheduleId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would store this in your database
    // and have a background job process recurring invoices

    console.log('Scheduled recurring invoice:', {
      scheduleId,
      ...config,
    });

    return scheduleId;
  }

  /**
   * Generate upcoming invoice preview
   */
  async previewUpcomingInvoice(customerId: string): Promise<InvoiceData | null> {
    await stripeLimiter.waitForRateLimit();

    return withRetry(async () => {
      try {
        const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
          customer: customerId,
        });

        // Convert line items
        const lineItems: InvoiceLineItem[] = upcomingInvoice.lines.data.map((item, index) => ({
          id: item.id,
          description: item.description || 'Subscription',
          quantity: item.quantity || 1,
          unitPrice: formatAmountFromStripe(item.unit_amount || 0),
          amount: formatAmountFromStripe(item.amount),
          taxable: false,
          metadata: item.metadata,
        }));

        return this.mapStripeInvoice(upcomingInvoice, lineItems);
      } catch (error: any) {
        if (error.code === 'invoice_upcoming_none') {
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Get invoice line items
   */
  private async getInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
    const lineItems = await stripe.invoiceItems.list({
      invoice: invoiceId,
      limit: 100,
    });

    return lineItems.data.map((item, index) => ({
      id: item.id,
      description: item.description || `Item ${index + 1}`,
      quantity: item.quantity || 1,
      unitPrice: formatAmountFromStripe(item.unit_amount || 0),
      amount: formatAmountFromStripe(item.amount),
      taxable: item.metadata.taxable === 'true',
      taxRate: item.metadata.taxRate ? parseFloat(item.metadata.taxRate) : undefined,
      metadata: item.metadata,
    }));
  }

  /**
   * Helper: Map Stripe invoice to our format
   */
  private mapStripeInvoice(
    invoice: Stripe.Invoice,
    lineItems: InvoiceLineItem[]
  ): InvoiceData {
    return {
      id: invoice.id,
      customerId: invoice.customer as string,
      organizationId: invoice.metadata.organizationId || '',
      number: invoice.number || '',
      status: invoice.status || 'draft',
      description: invoice.description || undefined,
      lineItems,
      subtotal: formatAmountFromStripe(invoice.subtotal),
      taxAmount: formatAmountFromStripe(invoice.tax || 0),
      discountAmount: formatAmountFromStripe(
        invoice.total_discount_amounts?.reduce((sum, discount) => sum + discount.amount, 0) || 0
      ),
      total: formatAmountFromStripe(invoice.total),
      amountPaid: formatAmountFromStripe(invoice.amount_paid),
      amountDue: formatAmountFromStripe(invoice.amount_due),
      currency: invoice.currency,
      createdAt: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : undefined,
      voidedAt: invoice.status_transitions.voided_at ? new Date(invoice.status_transitions.voided_at * 1000) : undefined,
      paymentTerms: invoice.due_date ? Math.floor((invoice.due_date - invoice.created) / (24 * 60 * 60)) : undefined,
      notes: invoice.footer || undefined,
      footer: invoice.footer || undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
      metadata: invoice.metadata,
    };
  }
}