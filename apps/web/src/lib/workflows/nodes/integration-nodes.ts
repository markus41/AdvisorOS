import { z } from 'zod';
import {
  NodeType,
  NodeData,
  NodeConfig,
  ExecutionContext,
  IntegrationConfig
} from '../types';
import { BaseWorkflowNode } from './base-node';

// QuickBooks Integration Node
export class QuickBooksIntegrationNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.QUICKBOOKS_INTEGRATION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const integrationConfig = config as IntegrationConfig;

    if (!integrationConfig.action) {
      errors.push('QuickBooks action is required');
    }

    const validActions = [
      'sync_customers',
      'sync_invoices',
      'sync_payments',
      'create_invoice',
      'update_customer',
      'get_reports',
      'sync_chart_of_accounts',
      'reconcile_transactions'
    ];

    if (!validActions.includes(integrationConfig.action)) {
      errors.push(`Invalid QuickBooks action. Valid actions: ${validActions.join(', ')}`);
    }

    if (!integrationConfig.credentials && !process.env.QUICKBOOKS_ACCESS_TOKEN) {
      errors.push('QuickBooks credentials or access token required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as IntegrationConfig;

    let result;
    switch (config.action) {
      case 'sync_customers':
        result = await this.syncCustomers(config, context, input);
        break;
      case 'sync_invoices':
        result = await this.syncInvoices(config, context, input);
        break;
      case 'sync_payments':
        result = await this.syncPayments(config, context, input);
        break;
      case 'create_invoice':
        result = await this.createInvoice(config, context, input);
        break;
      case 'update_customer':
        result = await this.updateCustomer(config, context, input);
        break;
      case 'get_reports':
        result = await this.getReports(config, context, input);
        break;
      case 'sync_chart_of_accounts':
        result = await this.syncChartOfAccounts(config, context, input);
        break;
      case 'reconcile_transactions':
        result = await this.reconcileTransactions(config, context, input);
        break;
      default:
        throw new Error(`Unknown QuickBooks action: ${config.action}`);
    }

    this.log('info', `QuickBooks ${config.action} completed`, {
      action: config.action,
      recordsProcessed: result.recordsProcessed || 0
    });

    return result;
  }

  private async syncCustomers(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock QuickBooks customer sync
    const customers = [
      { id: 'cust_1', name: 'ABC Company', email: 'contact@abc.com', lastModified: new Date() },
      { id: 'cust_2', name: 'XYZ Corp', email: 'info@xyz.com', lastModified: new Date() }
    ];

    return {
      action: 'sync_customers',
      recordsProcessed: customers.length,
      customers,
      syncedAt: new Date(),
      lastSyncToken: 'token_123'
    };
  }

  private async syncInvoices(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock QuickBooks invoice sync
    const invoices = [
      { id: 'inv_1', customerId: 'cust_1', amount: 1500.00, status: 'Paid', dueDate: new Date() },
      { id: 'inv_2', customerId: 'cust_2', amount: 2300.00, status: 'Pending', dueDate: new Date() }
    ];

    return {
      action: 'sync_invoices',
      recordsProcessed: invoices.length,
      invoices,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      syncedAt: new Date()
    };
  }

  private async syncPayments(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock QuickBooks payment sync
    const payments = [
      { id: 'pay_1', invoiceId: 'inv_1', amount: 1500.00, method: 'Bank Transfer', receivedDate: new Date() }
    ];

    return {
      action: 'sync_payments',
      recordsProcessed: payments.length,
      payments,
      totalAmount: payments.reduce((sum, pay) => sum + pay.amount, 0),
      syncedAt: new Date()
    };
  }

  private async createInvoice(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    const invoiceData = config.parameters || input;

    // Mock invoice creation
    const invoice = {
      id: `inv_${Date.now()}`,
      customerId: invoiceData.customerId,
      amount: invoiceData.amount,
      description: invoiceData.description,
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Pending',
      createdAt: new Date()
    };

    return {
      action: 'create_invoice',
      invoice,
      createdAt: new Date(),
      quickbooksId: invoice.id
    };
  }

  private async updateCustomer(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    const customerData = config.parameters || input;

    // Mock customer update
    const updatedCustomer = {
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      address: customerData.address,
      phone: customerData.phone,
      updatedAt: new Date()
    };

    return {
      action: 'update_customer',
      customer: updatedCustomer,
      updatedAt: new Date()
    };
  }

  private async getReports(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    const reportType = config.parameters?.reportType || 'profit_loss';

    // Mock report generation
    const reports = {
      profit_loss: {
        totalIncome: 50000,
        totalExpenses: 30000,
        netIncome: 20000,
        period: '2023-01-01 to 2023-12-31'
      },
      balance_sheet: {
        totalAssets: 100000,
        totalLiabilities: 40000,
        equity: 60000,
        asOfDate: new Date()
      }
    };

    return {
      action: 'get_reports',
      reportType,
      report: reports[reportType as keyof typeof reports] || reports.profit_loss,
      generatedAt: new Date()
    };
  }

  private async syncChartOfAccounts(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock chart of accounts sync
    const accounts = [
      { id: 'acc_1', name: 'Cash', type: 'Asset', balance: 10000 },
      { id: 'acc_2', name: 'Accounts Receivable', type: 'Asset', balance: 5000 },
      { id: 'acc_3', name: 'Office Expenses', type: 'Expense', balance: 2000 }
    ];

    return {
      action: 'sync_chart_of_accounts',
      recordsProcessed: accounts.length,
      accounts,
      syncedAt: new Date()
    };
  }

  private async reconcileTransactions(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock transaction reconciliation
    const reconciliation = {
      bankStatementTransactions: 15,
      quickbooksTransactions: 14,
      matchedTransactions: 13,
      unmatchedTransactions: 2,
      discrepancies: [
        { id: 'disc_1', amount: 100.00, description: 'Missing bank fee' }
      ]
    };

    return {
      action: 'reconcile_transactions',
      reconciliation,
      reconciledAt: new Date(),
      status: reconciliation.unmatchedTransactions === 0 ? 'complete' : 'requires_attention'
    };
  }

  public getConfigSchema() {
    return z.object({
      action: z.enum([
        'sync_customers',
        'sync_invoices',
        'sync_payments',
        'create_invoice',
        'update_customer',
        'get_reports',
        'sync_chart_of_accounts',
        'reconcile_transactions'
      ]),
      parameters: z.record(z.any()).optional(),
      credentials: z.string().optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      action: z.string(),
      recordsProcessed: z.number().optional(),
      customers: z.array(z.any()).optional(),
      invoices: z.array(z.any()).optional(),
      payments: z.array(z.any()).optional(),
      invoice: z.any().optional(),
      customer: z.any().optional(),
      report: z.any().optional(),
      accounts: z.array(z.any()).optional(),
      reconciliation: z.any().optional(),
      syncedAt: z.date().optional(),
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
      generatedAt: z.date().optional(),
      reconciledAt: z.date().optional()
    });
  }

  public getMetadata() {
    return {
      icon: 'DollarSign',
      category: 'Integrations',
      description: 'Integrates with QuickBooks for accounting operations',
      inputs: 1,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new QuickBooksIntegrationNode(id, data);
  }

  public getEstimatedDuration(): number {
    const config = this.data.config as IntegrationConfig;
    // Different actions have different durations
    switch (config.action) {
      case 'sync_customers':
      case 'sync_invoices':
      case 'sync_payments':
      case 'sync_chart_of_accounts':
        return 10000; // 10 seconds for sync operations
      case 'reconcile_transactions':
        return 30000; // 30 seconds for reconciliation
      case 'get_reports':
        return 15000; // 15 seconds for report generation
      case 'create_invoice':
      case 'update_customer':
        return 5000; // 5 seconds for single record operations
      default:
        return 10000;
    }
  }
}

// Document Processing Integration Node
export class DocumentProcessingIntegrationNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.DOCUMENT_PROCESSING_INTEGRATION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const integrationConfig = config as IntegrationConfig;

    if (!integrationConfig.action) {
      errors.push('Document processing action is required');
    }

    const validActions = [
      'extract_text',
      'extract_tables',
      'classify_document',
      'extract_entities',
      'validate_data',
      'process_receipts',
      'process_invoices',
      'extract_signatures'
    ];

    if (!validActions.includes(integrationConfig.action)) {
      errors.push(`Invalid document processing action. Valid actions: ${validActions.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as IntegrationConfig;

    let result;
    switch (config.action) {
      case 'extract_text':
        result = await this.extractText(config, context, input);
        break;
      case 'extract_tables':
        result = await this.extractTables(config, context, input);
        break;
      case 'classify_document':
        result = await this.classifyDocument(config, context, input);
        break;
      case 'extract_entities':
        result = await this.extractEntities(config, context, input);
        break;
      case 'validate_data':
        result = await this.validateData(config, context, input);
        break;
      case 'process_receipts':
        result = await this.processReceipts(config, context, input);
        break;
      case 'process_invoices':
        result = await this.processInvoices(config, context, input);
        break;
      case 'extract_signatures':
        result = await this.extractSignatures(config, context, input);
        break;
      default:
        throw new Error(`Unknown document processing action: ${config.action}`);
    }

    this.log('info', `Document processing ${config.action} completed`, {
      action: config.action,
      confidence: result.confidence || 0
    });

    return result;
  }

  private async extractText(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock text extraction using AI services
    return {
      action: 'extract_text',
      text: 'This is extracted text from the document. It contains information about invoices, amounts, and dates.',
      confidence: 0.95,
      pageCount: 2,
      processedAt: new Date(),
      language: 'en'
    };
  }

  private async extractTables(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock table extraction
    const tables = [
      {
        headers: ['Item', 'Quantity', 'Price', 'Total'],
        rows: [
          ['Consulting Services', '10', '$150.00', '$1,500.00'],
          ['Software License', '1', '$500.00', '$500.00']
        ]
      }
    ];

    return {
      action: 'extract_tables',
      tables,
      tableCount: tables.length,
      confidence: 0.92,
      processedAt: new Date()
    };
  }

  private async classifyDocument(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock document classification
    const classifications = [
      { type: 'invoice', confidence: 0.88 },
      { type: 'receipt', confidence: 0.12 }
    ];

    return {
      action: 'classify_document',
      primaryClassification: classifications[0],
      allClassifications: classifications,
      processedAt: new Date()
    };
  }

  private async extractEntities(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock entity extraction
    const entities = [
      { type: 'date', value: '2023-12-01', confidence: 0.99 },
      { type: 'amount', value: '$2,000.00', confidence: 0.97 },
      { type: 'company', value: 'ABC Corporation', confidence: 0.94 },
      { type: 'email', value: 'billing@abc.com', confidence: 0.96 }
    ];

    return {
      action: 'extract_entities',
      entities,
      entityCount: entities.length,
      processedAt: new Date()
    };
  }

  private async validateData(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock data validation
    const validationResults = {
      isValid: true,
      issues: [],
      checkedFields: ['amount', 'date', 'email', 'phone'],
      confidence: 0.96
    };

    return {
      action: 'validate_data',
      validation: validationResults,
      processedAt: new Date()
    };
  }

  private async processReceipts(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock receipt processing
    const receiptData = {
      vendor: 'Office Supply Store',
      date: '2023-12-01',
      total: 45.67,
      taxAmount: 3.67,
      items: [
        { description: 'Pens', quantity: 2, unitPrice: 5.99, total: 11.98 },
        { description: 'Paper', quantity: 1, unitPrice: 29.99, total: 29.99 }
      ],
      category: 'Office Supplies'
    };

    return {
      action: 'process_receipts',
      receiptData,
      confidence: 0.93,
      processedAt: new Date()
    };
  }

  private async processInvoices(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock invoice processing
    const invoiceData = {
      invoiceNumber: 'INV-2023-001',
      vendor: 'Service Provider LLC',
      date: '2023-12-01',
      dueDate: '2023-12-31',
      subtotal: 2000.00,
      taxAmount: 160.00,
      total: 2160.00,
      lineItems: [
        { description: 'Consulting Services', quantity: 20, rate: 100.00, amount: 2000.00 }
      ],
      paymentTerms: 'Net 30'
    };

    return {
      action: 'process_invoices',
      invoiceData,
      confidence: 0.97,
      processedAt: new Date()
    };
  }

  private async extractSignatures(config: IntegrationConfig, context: ExecutionContext, input?: any) {
    // Mock signature extraction
    const signatures = [
      {
        page: 1,
        coordinates: { x: 100, y: 200, width: 150, height: 50 },
        confidence: 0.89,
        signatureType: 'handwritten'
      }
    ];

    return {
      action: 'extract_signatures',
      signatures,
      signatureCount: signatures.length,
      processedAt: new Date()
    };
  }

  public getConfigSchema() {
    return z.object({
      action: z.enum([
        'extract_text',
        'extract_tables',
        'classify_document',
        'extract_entities',
        'validate_data',
        'process_receipts',
        'process_invoices',
        'extract_signatures'
      ]),
      parameters: z.record(z.any()).optional(),
      aiModel: z.string().optional()
    });
  }

  public getInputSchema() {
    return z.object({
      documentUrl: z.string().optional(),
      documentData: z.any().optional()
    });
  }

  public getOutputSchema() {
    return z.object({
      action: z.string(),
      text: z.string().optional(),
      tables: z.array(z.any()).optional(),
      primaryClassification: z.any().optional(),
      allClassifications: z.array(z.any()).optional(),
      entities: z.array(z.any()).optional(),
      validation: z.any().optional(),
      receiptData: z.any().optional(),
      invoiceData: z.any().optional(),
      signatures: z.array(z.any()).optional(),
      confidence: z.number(),
      processedAt: z.date()
    });
  }

  public getMetadata() {
    return {
      icon: 'Brain',
      category: 'Integrations',
      description: 'AI-powered document processing and analysis',
      inputs: 1,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new DocumentProcessingIntegrationNode(id, data);
  }

  public getEstimatedDuration(): number {
    const config = this.data.config as IntegrationConfig;
    // Different actions have different durations
    switch (config.action) {
      case 'extract_text':
        return 5000; // 5 seconds
      case 'extract_tables':
        return 8000; // 8 seconds
      case 'classify_document':
        return 3000; // 3 seconds
      case 'extract_entities':
        return 6000; // 6 seconds
      case 'validate_data':
        return 4000; // 4 seconds
      case 'process_receipts':
      case 'process_invoices':
        return 10000; // 10 seconds
      case 'extract_signatures':
        return 7000; // 7 seconds
      default:
        return 8000;
    }
  }
}