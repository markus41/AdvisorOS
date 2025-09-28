import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { DocumentMetadata, ValidationError } from '../ocr.service';

export interface InvoiceData {
  // Document Information
  invoice_number: string;
  invoice_date: Date;
  due_date?: Date;
  purchase_order?: string;

  // Vendor Information
  vendor_name: string;
  vendor_address: string;
  vendor_phone?: string;
  vendor_email?: string;
  vendor_tax_id?: string;
  vendor_registration_number?: string;

  // Customer Information
  customer_name: string;
  customer_address: string;
  customer_phone?: string;
  customer_email?: string;
  customer_tax_id?: string;

  // Financial Information
  subtotal: number;
  tax_amount: number;
  tax_rate?: number;
  discount_amount?: number;
  shipping_amount?: number;
  total_amount: number;
  amount_due?: number;
  currency: string;

  // Line Items
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    tax_rate?: number;
    tax_amount?: number;
    unit?: string;
    sku?: string;
  }>;

  // Tax Details
  tax_details: Array<{
    tax_type: string;
    tax_rate: number;
    taxable_amount: number;
    tax_amount: number;
  }>;

  // Payment Information
  payment_terms?: string;
  payment_method?: string;
  bank_details?: {
    bank_name?: string;
    account_number?: string;
    routing_number?: string;
    iban?: string;
    swift?: string;
  };

  // Additional Information
  notes?: string;
  terms_conditions?: string;
  reference_number?: string;
  project_code?: string;
}

export class InvoiceExtractor {
  /**
   * Extract invoice data
   */
  public async extract(
    fileBuffer: Buffer,
    metadata: DocumentMetadata,
    formRecognizerClient: DocumentAnalysisClient
  ): Promise<InvoiceData> {
    if (!formRecognizerClient) {
      throw new Error('Form Recognizer client not provided');
    }

    try {
      // Try prebuilt invoice model first
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-invoice',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return this.parseInvoiceResult(result);

    } catch (error) {
      console.warn('Prebuilt invoice model failed, using general extraction:', error);

      // Fallback to general document analysis
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return this.parseGeneralInvoiceResult(result);
    }
  }

  /**
   * Parse results from prebuilt invoice model
   */
  private parseInvoiceResult(result: any): InvoiceData {
    const document = result.documents?.[0];
    if (!document) {
      throw new Error('No invoice document detected');
    }

    const fields = document.fields || {};

    // Extract line items
    const lineItems = this.extractLineItems(fields.Items);

    // Extract tax details
    const taxDetails = this.extractTaxDetails(fields.TaxDetails);

    // Calculate totals if missing
    const calculatedSubtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const subtotal = this.parseAmount(fields.SubTotal?.content) || calculatedSubtotal;
    const taxAmount = this.parseAmount(fields.TotalTax?.content) || 0;
    const totalAmount = this.parseAmount(fields.InvoiceTotal?.content) || (subtotal + taxAmount);

    return {
      // Document Information
      invoice_number: fields.InvoiceId?.content || '',
      invoice_date: this.parseDate(fields.InvoiceDate?.content),
      due_date: this.parseDate(fields.DueDate?.content),
      purchase_order: fields.PurchaseOrder?.content,

      // Vendor Information
      vendor_name: fields.VendorName?.content || '',
      vendor_address: this.buildAddress(fields.VendorAddress),
      vendor_phone: fields.VendorPhone?.content,
      vendor_email: fields.VendorEmail?.content,
      vendor_tax_id: fields.VendorTaxId?.content,

      // Customer Information
      customer_name: fields.CustomerName?.content || '',
      customer_address: this.buildAddress(fields.CustomerAddress),
      customer_phone: fields.CustomerPhone?.content,
      customer_email: fields.CustomerEmail?.content,

      // Financial Information
      subtotal,
      tax_amount: taxAmount,
      discount_amount: this.parseAmount(fields.TotalDiscount?.content),
      shipping_amount: this.parseAmount(fields.ShippingCost?.content),
      total_amount: totalAmount,
      amount_due: this.parseAmount(fields.AmountDue?.content) || totalAmount,
      currency: fields.CurrencyCode?.content || 'USD',

      line_items: lineItems,
      tax_details: taxDetails,

      // Payment Information
      payment_terms: fields.PaymentTerms?.content,
      payment_method: fields.PaymentMethod?.content,
      bank_details: this.extractBankDetails(fields.BankDetails),

      // Additional Information
      notes: fields.Notes?.content,
      reference_number: fields.ReferenceNumber?.content,
    };
  }

  /**
   * Parse general document results (fallback)
   */
  private parseGeneralInvoiceResult(result: any): InvoiceData {
    const keyValuePairs = result.keyValuePairs || [];
    const tables = result.tables || [];
    const extractedData: Record<string, string> = {};

    // Build key-value map
    keyValuePairs.forEach((pair: any) => {
      if (pair.key && pair.value) {
        const key = this.normalizeKey(pair.key.content);
        extractedData[key] = pair.value.content;
      }
    });

    // Extract line items from tables
    const lineItems = this.extractLineItemsFromTables(tables);

    // Calculate financial totals
    const calculatedSubtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const subtotal = this.parseAmount(extractedData.subtotal) || calculatedSubtotal;
    const taxAmount = this.parseAmount(extractedData.tax_amount || extractedData.tax) || 0;
    const totalAmount = this.parseAmount(extractedData.total_amount || extractedData.total) || (subtotal + taxAmount);

    return {
      invoice_number: extractedData.invoice_number || extractedData.invoice_id || '',
      invoice_date: this.parseDate(extractedData.invoice_date || extractedData.date),
      due_date: this.parseDate(extractedData.due_date),
      purchase_order: extractedData.purchase_order || extractedData.po_number,

      vendor_name: extractedData.vendor_name || extractedData.from || '',
      vendor_address: extractedData.vendor_address || '',
      vendor_phone: extractedData.vendor_phone,
      vendor_email: extractedData.vendor_email,

      customer_name: extractedData.customer_name || extractedData.to || extractedData.bill_to || '',
      customer_address: extractedData.customer_address || extractedData.billing_address || '',

      subtotal,
      tax_amount: taxAmount,
      discount_amount: this.parseAmount(extractedData.discount),
      shipping_amount: this.parseAmount(extractedData.shipping),
      total_amount: totalAmount,
      amount_due: this.parseAmount(extractedData.amount_due) || totalAmount,
      currency: extractedData.currency || 'USD',

      line_items: lineItems,
      tax_details: [],

      payment_terms: extractedData.payment_terms,
      notes: extractedData.notes,
    };
  }

  /**
   * Extract line items from structured fields
   */
  private extractLineItems(itemsField: any): InvoiceData['line_items'] {
    if (!itemsField || !Array.isArray(itemsField)) {
      return [];
    }

    return itemsField.map((item: any) => {
      const quantity = this.parseAmount(item.Quantity?.content) || 1;
      const unitPrice = this.parseAmount(item.UnitPrice?.content) || 0;
      const lineTotal = this.parseAmount(item.Amount?.content) || (quantity * unitPrice);

      return {
        description: item.Description?.content || '',
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        unit: item.Unit?.content,
        sku: item.ProductCode?.content,
        tax_rate: this.parseAmount(item.TaxRate?.content),
        tax_amount: this.parseAmount(item.Tax?.content),
      };
    });
  }

  /**
   * Extract line items from tables (fallback)
   */
  private extractLineItemsFromTables(tables: any[]): InvoiceData['line_items'] {
    const lineItems: InvoiceData['line_items'] = [];

    tables.forEach((table: any) => {
      if (!table.cells || table.cells.length === 0) return;

      // Group cells by row
      const rowMap = new Map<number, Map<number, string>>();
      table.cells.forEach((cell: any) => {
        if (!rowMap.has(cell.rowIndex)) {
          rowMap.set(cell.rowIndex, new Map());
        }
        rowMap.get(cell.rowIndex)!.set(cell.columnIndex, cell.content || '');
      });

      const rows = Array.from(rowMap.keys()).sort((a, b) => a - b);
      if (rows.length < 2) return; // Need at least header + 1 data row

      // Assume first row is header
      const headerRow = rowMap.get(rows[0])!;
      const headers = Array.from(headerRow.values()).map(h => h.toLowerCase());

      // Find column indices
      const descIndex = this.findColumnIndex(headers, ['description', 'item', 'product']);
      const qtyIndex = this.findColumnIndex(headers, ['qty', 'quantity', 'amount']);
      const priceIndex = this.findColumnIndex(headers, ['price', 'unit price', 'rate']);
      const totalIndex = this.findColumnIndex(headers, ['total', 'amount', 'line total']);

      // Extract data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rowMap.get(rows[i])!;
        const maxCol = Math.max(...Array.from(row.keys()));

        if (maxCol >= 2) { // Minimum columns for a valid line item
          const description = row.get(descIndex) || '';
          const quantity = this.parseAmount(row.get(qtyIndex)) || 1;
          const unitPrice = this.parseAmount(row.get(priceIndex)) || 0;
          const lineTotal = this.parseAmount(row.get(totalIndex)) || (quantity * unitPrice);

          if (description && (quantity > 0 || unitPrice > 0 || lineTotal > 0)) {
            lineItems.push({
              description,
              quantity,
              unit_price: unitPrice,
              line_total: lineTotal,
            });
          }
        }
      }
    });

    return lineItems;
  }

  /**
   * Extract tax details
   */
  private extractTaxDetails(taxDetailsField: any): InvoiceData['tax_details'] {
    if (!taxDetailsField || !Array.isArray(taxDetailsField)) {
      return [];
    }

    return taxDetailsField.map((tax: any) => ({
      tax_type: tax.TaxType?.content || 'Tax',
      tax_rate: this.parseAmount(tax.Rate?.content) || 0,
      taxable_amount: this.parseAmount(tax.TaxableAmount?.content) || 0,
      tax_amount: this.parseAmount(tax.Tax?.content) || 0,
    }));
  }

  /**
   * Extract bank details
   */
  private extractBankDetails(bankDetailsField: any): InvoiceData['bank_details'] | undefined {
    if (!bankDetailsField) return undefined;

    return {
      bank_name: bankDetailsField.BankName?.content,
      account_number: bankDetailsField.AccountNumber?.content,
      routing_number: bankDetailsField.RoutingNumber?.content,
      iban: bankDetailsField.IBAN?.content,
      swift: bankDetailsField.SWIFT?.content,
    };
  }

  /**
   * Validate extracted invoice data
   */
  public async validate(data: InvoiceData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required field validations
    if (!data.invoice_number) {
      errors.push({
        field: 'invoice_number',
        message: 'Invoice number is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.vendor_name) {
      errors.push({
        field: 'vendor_name',
        message: 'Vendor name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.customer_name) {
      errors.push({
        field: 'customer_name',
        message: 'Customer name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.invoice_date || isNaN(data.invoice_date.getTime())) {
      errors.push({
        field: 'invoice_date',
        message: 'Valid invoice date is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Financial validation
    if (data.total_amount <= 0) {
      errors.push({
        field: 'total_amount',
        message: 'Total amount must be greater than zero',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (data.subtotal < 0) {
      errors.push({
        field: 'subtotal',
        message: 'Subtotal cannot be negative',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (data.tax_amount < 0) {
      errors.push({
        field: 'tax_amount',
        message: 'Tax amount cannot be negative',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Line items validation
    if (data.line_items.length === 0) {
      errors.push({
        field: 'line_items',
        message: 'Invoice should have at least one line item',
        severity: 'warning',
        confidence: 0.8,
      });
    }

    // Validate line item totals
    const calculatedSubtotal = data.line_items.reduce((sum, item) => sum + item.line_total, 0);
    if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
      errors.push({
        field: 'subtotal',
        message: 'Subtotal does not match sum of line items',
        severity: 'warning',
        confidence: 0.7,
      });
    }

    // Validate total calculation
    const expectedTotal = data.subtotal + data.tax_amount + (data.shipping_amount || 0) - (data.discount_amount || 0);
    if (Math.abs(expectedTotal - data.total_amount) > 0.01) {
      errors.push({
        field: 'total_amount',
        message: 'Total amount calculation appears incorrect',
        severity: 'warning',
        confidence: 0.7,
      });
    }

    // Date validations
    if (data.due_date && data.invoice_date && data.due_date < data.invoice_date) {
      errors.push({
        field: 'due_date',
        message: 'Due date cannot be before invoice date',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Tax rate validation
    if (data.tax_rate && (data.tax_rate < 0 || data.tax_rate > 50)) {
      errors.push({
        field: 'tax_rate',
        message: 'Tax rate appears unusual (should be between 0% and 50%)',
        severity: 'warning',
        confidence: 0.6,
      });
    }

    return errors;
  }

  /**
   * Helper methods
   */
  private parseAmount(value: string | undefined): number {
    if (!value) return 0;
    const numStr = value.replace(/[,$\s]/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  }

  private parseDate(value: string | undefined): Date {
    if (!value) return new Date();

    // Try various date formats
    const dateFormats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,  // MM.DD.YYYY
    ];

    for (const format of dateFormats) {
      const match = value.match(format);
      if (match) {
        if (format === dateFormats[2]) { // YYYY-MM-DD
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else {
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        }
      }
    }

    // Fallback to Date constructor
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  private buildAddress(addressField: any): string {
    if (!addressField) return '';

    if (typeof addressField === 'string') {
      return addressField;
    }

    const parts: string[] = [];
    if (addressField.StreetAddress) parts.push(addressField.StreetAddress.content);
    if (addressField.City) parts.push(addressField.City.content);
    if (addressField.State) parts.push(addressField.State.content);
    if (addressField.PostalCode) parts.push(addressField.PostalCode.content);
    if (addressField.Country) parts.push(addressField.Country.content);

    return parts.filter(Boolean).join(', ');
  }

  private findColumnIndex(headers: string[], searchTerms: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      for (const term of searchTerms) {
        if (headers[i].includes(term)) {
          return i;
        }
      }
    }
    return 0; // Default to first column
  }
}

export default InvoiceExtractor;