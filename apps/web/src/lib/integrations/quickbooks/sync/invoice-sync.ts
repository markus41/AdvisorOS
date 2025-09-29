import { prisma } from '@/server/db';
import { BaseSyncService, SyncResult, SyncOptions } from './base-sync';

interface LocalInvoice {
  quickbooksId: string;
  invoiceNumber: string;
  clientQuickbooksId: string;
  status: string;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  lineItems: any[];
  paymentTerms?: string;
  description?: string;
  customFields?: any;
  lastModified: Date;
}

export class InvoiceSyncService extends BaseSyncService {
  getEntityType(): string {
    return 'invoices';
  }

  async syncData(options: SyncOptions = {}): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      errors: []
    };

    try {
      console.log(`Starting invoices sync for organization ${this.organizationId}`);

      const lastSyncDate = options.fullSync ? null : await this.getLastSyncDate();

      // Get invoices from QuickBooks with pagination
      const invoices = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getInvoices(
          this.realmId,
          maxResults,
          startPosition,
          lastSyncDate || undefined
        ),
        options.maxRecords || 1000
      );

      result.recordsProcessed = invoices.length;

      for (const invoice of invoices) {
        try {
          // Skip if not modified since last sync (unless full sync)
          if (!options.fullSync && !this.shouldSyncEntity(invoice, lastSyncDate)) {
            continue;
          }

          await this.syncInvoice(invoice);
          result.recordsSuccess++;
        } catch (error) {
          result.recordsFailed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync invoice ${invoice.Id}: ${errorMessage}`);
          console.error('Invoice sync error:', error);
        }
      }

      result.success = result.recordsFailed === 0;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Invoices sync failed: ${errorMessage}`);
      console.error('Invoices sync error:', error);
      return result;
    }
  }

  private async syncInvoice(qbInvoice: any): Promise<void> {
    const validation = this.validateEntity(qbInvoice);
    if (!validation.isValid) {
      throw new Error(`Invalid invoice data: ${validation.errors.join(', ')}`);
    }

    // Map QuickBooks invoice to local format
    const invoiceData = this.mapToLocalEntity(qbInvoice);

    // Find the corresponding client
    const client = await prisma.client.findFirst({
      where: {
        quickbooksId: invoiceData.clientQuickbooksId,
        organizationId: this.organizationId
      }
    });

    if (!client) {
      throw new Error(`Client with QuickBooks ID ${invoiceData.clientQuickbooksId} not found. Please sync customers first.`);
    }

    // Check if invoice already exists
    let existingInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: invoiceData.invoiceNumber,
        organizationId: this.organizationId
      }
    });

    if (existingInvoice) {
      // Update existing invoice
      await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          status: this.mapQuickBooksStatusToLocal(invoiceData.status),
          invoiceDate: invoiceData.invoiceDate,
          dueDate: invoiceData.dueDate,
          subtotal: invoiceData.subtotal,
          taxAmount: invoiceData.taxAmount,
          totalAmount: invoiceData.totalAmount,
          paidAmount: invoiceData.paidAmount,
          balanceAmount: invoiceData.balanceAmount,
          lineItems: invoiceData.lineItems,
          paymentTerms: invoiceData.paymentTerms,
          description: invoiceData.description,
          customFields: invoiceData.customFields,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new invoice
      await prisma.invoice.create({
        data: {
          invoiceNumber: invoiceData.invoiceNumber,
          status: this.mapQuickBooksStatusToLocal(invoiceData.status),
          invoiceDate: invoiceData.invoiceDate,
          dueDate: invoiceData.dueDate,
          subtotal: invoiceData.subtotal,
          taxAmount: invoiceData.taxAmount,
          totalAmount: invoiceData.totalAmount,
          paidAmount: invoiceData.paidAmount,
          balanceAmount: invoiceData.balanceAmount,
          lineItems: invoiceData.lineItems,
          paymentTerms: invoiceData.paymentTerms,
          description: invoiceData.description,
          customFields: invoiceData.customFields,
          clientId: client.id,
          organizationId: this.organizationId,
          createdById: 'system' // This should be set to the user who triggered the sync
        }
      });
    }

    console.log(`Successfully synced invoice: ${invoiceData.invoiceNumber} (QB ID: ${qbInvoice.Id})`);
  }

  private mapQuickBooksStatusToLocal(qbStatus: string): string {
    // Map QuickBooks invoice status to local status
    const statusMap: Record<string, string> = {
      'Draft': 'draft',
      'Sent': 'sent',
      'Paid': 'paid',
      'PartiallyPaid': 'partial',
      'Overdue': 'overdue',
      'Cancelled': 'cancelled',
      'Pending': 'draft'
    };

    return statusMap[qbStatus] || 'draft';
  }

  protected mapToLocalEntity(qbInvoice: any): LocalInvoice {
    // Process line items
    const lineItems = (qbInvoice.Line || []).map((line: any) => ({
      description: line.Description,
      quantity: line.SalesItemLineDetail?.Qty ? parseFloat(line.SalesItemLineDetail.Qty) : 1,
      unitPrice: line.SalesItemLineDetail?.UnitPrice ? parseFloat(line.SalesItemLineDetail.UnitPrice) : 0,
      amount: line.Amount ? parseFloat(line.Amount) : 0,
      itemRef: line.SalesItemLineDetail?.ItemRef,
      taxCodeRef: line.SalesItemLineDetail?.TaxCodeRef,
      serviceDate: line.SalesItemLineDetail?.ServiceDate,
      customFields: {
        quickbooksLineId: line.Id,
        lineNum: line.LineNum,
        detailType: line.DetailType
      }
    }));

    // Calculate amounts
    const subtotal = parseFloat(qbInvoice.TotalAmt || '0');
    const taxAmount = parseFloat(qbInvoice.TxnTaxDetail?.TotalTax || '0');
    const totalAmount = subtotal;
    const paidAmount = parseFloat(qbInvoice.Balance || '0') < totalAmount
      ? totalAmount - parseFloat(qbInvoice.Balance || '0')
      : 0;
    const balanceAmount = parseFloat(qbInvoice.Balance || '0');

    return {
      quickbooksId: qbInvoice.Id,
      invoiceNumber: qbInvoice.DocNumber || qbInvoice.Id,
      clientQuickbooksId: qbInvoice.CustomerRef.value,
      status: this.getInvoiceStatus(qbInvoice),
      invoiceDate: new Date(qbInvoice.TxnDate),
      dueDate: new Date(qbInvoice.DueDate || qbInvoice.TxnDate),
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount,
      balanceAmount,
      lineItems,
      paymentTerms: qbInvoice.SalesTermRef?.name,
      description: qbInvoice.PrivateNote || qbInvoice.CustomerMemo?.value,
      customFields: {
        quickbooksData: {
          currencyRef: qbInvoice.CurrencyRef,
          exchangeRate: qbInvoice.ExchangeRate,
          globalTaxCalculation: qbInvoice.GlobalTaxCalculation,
          homeTotalAmt: qbInvoice.HomeTotalAmt,
          printStatus: qbInvoice.PrintStatus,
          emailStatus: qbInvoice.EmailStatus,
          billEmail: qbInvoice.BillEmail,
          billAddr: qbInvoice.BillAddr,
          shipAddr: qbInvoice.ShipAddr,
          classRef: qbInvoice.ClassRef,
          departmentRef: qbInvoice.DepartmentRef,
          trackingNum: qbInvoice.TrackingNum,
          linkedTxn: qbInvoice.LinkedTxn
        }
      },
      lastModified: new Date(qbInvoice.MetaData.LastUpdatedTime)
    };
  }

  private getInvoiceStatus(qbInvoice: any): string {
    const balance = parseFloat(qbInvoice.Balance || '0');
    const total = parseFloat(qbInvoice.TotalAmt || '0');

    if (balance === 0) {
      return 'Paid';
    } else if (balance < total) {
      return 'PartiallyPaid';
    } else if (qbInvoice.EmailStatus === 'NotSet' && qbInvoice.PrintStatus === 'NotSet') {
      return 'Draft';
    } else {
      // Check if overdue
      const dueDate = new Date(qbInvoice.DueDate || qbInvoice.TxnDate);
      if (dueDate < new Date()) {
        return 'Overdue';
      }
      return 'Sent';
    }
  }

  protected customValidateEntity(entity: any): string[] {
    const errors: string[] = [];

    if (!entity.CustomerRef?.value) {
      errors.push('Invoice must have a customer reference');
    }

    if (!entity.TxnDate) {
      errors.push('Invoice must have a transaction date');
    }

    if (!entity.TotalAmt || parseFloat(entity.TotalAmt) < 0) {
      errors.push('Invoice must have a valid total amount');
    }

    if (!entity.Line || !Array.isArray(entity.Line) || entity.Line.length === 0) {
      errors.push('Invoice must have at least one line item');
    }

    return errors;
  }

  /**
   * Get invoice summary
   */
  async getInvoiceSummary(): Promise<any> {
    try {
      const invoices = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getInvoices(this.realmId, maxResults, startPosition),
        1000
      );

      const summary = {
        totalInvoices: invoices.length,
        totalAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        statusBreakdown: {} as Record<string, number>,
        averageInvoiceAmount: 0,
        overdueCount: 0,
        overdueAmount: 0
      };

      const now = new Date();

      invoices.forEach(invoice => {
        const total = parseFloat(invoice.TotalAmt || '0');
        const balance = parseFloat(invoice.Balance || '0');
        const paid = total - balance;
        const status = this.getInvoiceStatus(invoice);
        const dueDate = new Date(invoice.DueDate || invoice.TxnDate);

        summary.totalAmount += total;
        summary.paidAmount += paid;
        summary.balanceAmount += balance;

        summary.statusBreakdown[status] = (summary.statusBreakdown[status] || 0) + 1;

        if (balance > 0 && dueDate < now) {
          summary.overdueCount++;
          summary.overdueAmount += balance;
        }
      });

      summary.averageInvoiceAmount = summary.totalInvoices > 0 ? summary.totalAmount / summary.totalInvoices : 0;

      return summary;
    } catch (error) {
      console.error('Error getting invoice summary:', error);
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<any[]> {
    try {
      const invoices = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getInvoices(this.realmId, maxResults, startPosition),
        1000
      );

      const now = new Date();

      return invoices
        .filter(invoice => {
          const balance = parseFloat(invoice.Balance || '0');
          const dueDate = new Date(invoice.DueDate || invoice.TxnDate);
          return balance > 0 && dueDate < now;
        })
        .map(invoice => this.mapToLocalEntity(invoice))
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      throw error;
    }
  }

  /**
   * Create invoice in QuickBooks
   */
  async createInvoiceInQuickBooks(invoiceData: any): Promise<any> {
    try {
      const qbInvoiceData = this.mapLocalToQuickBooksEntity(invoiceData);
      const result = await this.apiClient.create(this.realmId, 'invoice', qbInvoiceData);

      if (result?.QueryResponse?.Invoice?.[0]) {
        return this.mapToLocalEntity(result.QueryResponse.Invoice[0]);
      }

      throw new Error('Failed to create invoice in QuickBooks');
    } catch (error) {
      console.error('Error creating invoice in QuickBooks:', error);
      throw error;
    }
  }

  /**
   * Update invoice in QuickBooks
   */
  async updateInvoiceInQuickBooks(invoiceData: any): Promise<any> {
    try {
      const qbInvoiceData = this.mapLocalToQuickBooksEntity(invoiceData);
      const result = await this.apiClient.update(this.realmId, 'invoice', qbInvoiceData);

      if (result?.QueryResponse?.Invoice?.[0]) {
        return this.mapToLocalEntity(result.QueryResponse.Invoice[0]);
      }

      throw new Error('Failed to update invoice in QuickBooks');
    } catch (error) {
      console.error('Error updating invoice in QuickBooks:', error);
      throw error;
    }
  }

  private mapLocalToQuickBooksEntity(localInvoice: any): any {
    // Map local invoice format back to QuickBooks format
    // This would be used for two-way sync (creating/updating invoices in QB)
    return {
      // Implementation depends on the local invoice structure
      // and QuickBooks API requirements
    };
  }
}