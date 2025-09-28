import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { DocumentMetadata, ValidationError } from '../ocr.service';

export interface BankStatementData {
  // Account Information
  account_holder_name: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'other';
  bank_name: string;
  bank_address?: string;
  routing_number?: string;

  // Statement Period
  statement_date: Date;
  statement_period_start: Date;
  statement_period_end: Date;

  // Balances
  beginning_balance: number;
  ending_balance: number;
  available_balance?: number;
  credit_limit?: number; // For credit cards

  // Summary Information
  total_deposits: number;
  total_withdrawals: number;
  total_fees: number;
  total_interest_earned: number;
  number_of_deposits: number;
  number_of_withdrawals: number;

  // Transactions
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    type: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer' | 'check' | 'other';
    balance?: number;
    reference_number?: string;
    category?: string;
    memo?: string;
    check_number?: string;
  }>;

  // Fee Information
  fees: Array<{
    description: string;
    amount: number;
    date: Date;
    type: 'maintenance' | 'overdraft' | 'atm' | 'wire' | 'stop_payment' | 'other';
  }>;

  // Interest Information
  interest_summary?: {
    interest_rate: number;
    interest_earned: number;
    days_in_period: number;
    average_daily_balance: number;
  };

  // Overdraft Information (if applicable)
  overdraft_info?: {
    overdraft_limit: number;
    overdraft_fees: number;
    overdraft_protection: boolean;
  };

  // Check Information
  checks_paid: Array<{
    check_number: string;
    date: Date;
    amount: number;
    payee?: string;
  }>;

  // Electronic Transactions
  electronic_transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    type: 'ach_debit' | 'ach_credit' | 'wire' | 'online_transfer' | 'card_transaction' | 'other';
    reference_number?: string;
  }>;

  // Additional Information
  statement_number?: string;
  currency: string;
  contact_information?: {
    customer_service_phone?: string;
    website?: string;
    branch_address?: string;
  };
}

export class BankStatementExtractor {
  /**
   * Extract bank statement data
   */
  public async extract(
    fileBuffer: Buffer,
    metadata: DocumentMetadata,
    formRecognizerClient: DocumentAnalysisClient
  ): Promise<BankStatementData> {
    if (!formRecognizerClient) {
      throw new Error('Form Recognizer client not provided');
    }

    try {
      // Use general document analysis (no prebuilt bank statement model)
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return this.parseBankStatementResult(result);

    } catch (error) {
      throw new Error(`Bank statement extraction failed: ${error}`);
    }
  }

  /**
   * Parse bank statement from general document results
   */
  private parseBankStatementResult(result: any): BankStatementData {
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

    // Extract transactions from tables
    const { transactions, fees, checks, electronic } = this.extractTransactionsFromTables(tables);

    // Calculate summary information
    const totalDeposits = transactions
      .filter(t => t.type === 'credit' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter(t => t.type === 'debit' && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);

    const totalInterest = transactions
      .filter(t => t.type === 'interest')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      // Account Information
      account_holder_name: extractedData.account_holder || extractedData.customer_name || '',
      account_number: extractedData.account_number || '',
      account_type: this.determineAccountType(extractedData, result.content || ''),
      bank_name: extractedData.bank_name || extractedData.institution || '',
      bank_address: extractedData.bank_address,
      routing_number: extractedData.routing_number,

      // Statement Period
      statement_date: this.parseDate(extractedData.statement_date),
      statement_period_start: this.parseDate(extractedData.period_start || extractedData.from_date),
      statement_period_end: this.parseDate(extractedData.period_end || extractedData.to_date),

      // Balances
      beginning_balance: this.parseAmount(extractedData.beginning_balance || extractedData.previous_balance),
      ending_balance: this.parseAmount(extractedData.ending_balance || extractedData.current_balance),
      available_balance: this.parseAmount(extractedData.available_balance),
      credit_limit: this.parseAmount(extractedData.credit_limit),

      // Summary Information
      total_deposits: this.parseAmount(extractedData.total_deposits) || totalDeposits,
      total_withdrawals: this.parseAmount(extractedData.total_withdrawals) || totalWithdrawals,
      total_fees: this.parseAmount(extractedData.total_fees) || totalFees,
      total_interest_earned: this.parseAmount(extractedData.interest_earned) || totalInterest,
      number_of_deposits: transactions.filter(t => t.type === 'credit').length,
      number_of_withdrawals: transactions.filter(t => t.type === 'debit').length,

      transactions,
      fees,
      checks_paid: checks,
      electronic_transactions: electronic,

      statement_number: extractedData.statement_number,
      currency: extractedData.currency || 'USD',

      contact_information: {
        customer_service_phone: extractedData.customer_service || extractedData.phone,
        website: extractedData.website,
        branch_address: extractedData.branch_address,
      },
    };
  }

  /**
   * Extract transactions from tables
   */
  private extractTransactionsFromTables(tables: any[]): {
    transactions: BankStatementData['transactions'];
    fees: BankStatementData['fees'];
    checks: BankStatementData['checks_paid'];
    electronic: BankStatementData['electronic_transactions'];
  } {
    const transactions: BankStatementData['transactions'] = [];
    const fees: BankStatementData['fees'] = [];
    const checks: BankStatementData['checks_paid'] = [];
    const electronic: BankStatementData['electronic_transactions'] = [];

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
      if (rows.length < 2) return;

      // Analyze header to determine table type
      const headerRow = rowMap.get(rows[0])!;
      const headers = Array.from(headerRow.values()).map(h => h.toLowerCase());

      if (this.isTransactionTable(headers)) {
        const tableTransactions = this.parseTransactionTable(rowMap, rows);
        transactions.push(...tableTransactions);

        // Categorize transactions
        tableTransactions.forEach(transaction => {
          if (this.isFeeTransaction(transaction)) {
            fees.push({
              description: transaction.description,
              amount: Math.abs(transaction.amount),
              date: transaction.date,
              type: this.determineFeeType(transaction.description),
            });
          } else if (this.isCheckTransaction(transaction)) {
            checks.push({
              check_number: this.extractCheckNumber(transaction.description) || '',
              date: transaction.date,
              amount: Math.abs(transaction.amount),
              payee: this.extractPayee(transaction.description),
            });
          } else if (this.isElectronicTransaction(transaction)) {
            electronic.push({
              date: transaction.date,
              description: transaction.description,
              amount: transaction.amount,
              type: this.determineElectronicType(transaction.description),
              reference_number: this.extractReferenceNumber(transaction.description),
            });
          }
        });
      }
    });

    return { transactions, fees, checks, electronic };
  }

  /**
   * Determine if table contains transaction data
   */
  private isTransactionTable(headers: string[]): boolean {
    const transactionKeywords = ['date', 'description', 'amount', 'balance', 'debit', 'credit'];
    const matchCount = headers.filter(header =>
      transactionKeywords.some(keyword => header.includes(keyword))
    ).length;

    return matchCount >= 2; // At least 2 transaction-related columns
  }

  /**
   * Parse transaction table
   */
  private parseTransactionTable(
    rowMap: Map<number, Map<number, string>>,
    rows: number[]
  ): BankStatementData['transactions'] {
    const transactions: BankStatementData['transactions'] = [];
    const headerRow = rowMap.get(rows[0])!;
    const headers = Array.from(headerRow.values()).map(h => h.toLowerCase());

    // Find column indices
    const dateIndex = this.findColumnIndex(headers, ['date', 'transaction date', 'posted date']);
    const descIndex = this.findColumnIndex(headers, ['description', 'details', 'memo']);
    const amountIndex = this.findColumnIndex(headers, ['amount', 'transaction amount']);
    const debitIndex = this.findColumnIndex(headers, ['debit', 'withdrawals', 'payments']);
    const creditIndex = this.findColumnIndex(headers, ['credit', 'deposits', 'credits']);
    const balanceIndex = this.findColumnIndex(headers, ['balance', 'running balance']);

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rowMap.get(rows[i])!;
      const maxCol = Math.max(...Array.from(row.keys()));

      if (maxCol >= 1) {
        const dateStr = row.get(dateIndex) || '';
        const description = row.get(descIndex) || '';

        let amount = 0;
        let type: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer' | 'check' | 'other' = 'other';

        // Determine amount and type
        if (debitIndex !== -1 && creditIndex !== -1) {
          const debitAmount = this.parseAmount(row.get(debitIndex));
          const creditAmount = this.parseAmount(row.get(creditIndex));

          if (debitAmount > 0) {
            amount = -debitAmount;
            type = 'debit';
          } else if (creditAmount > 0) {
            amount = creditAmount;
            type = 'credit';
          }
        } else if (amountIndex !== -1) {
          amount = this.parseAmount(row.get(amountIndex));
          type = amount >= 0 ? 'credit' : 'debit';
        }

        // Refine type based on description
        type = this.determineTransactionType(description, type);

        const date = this.parseDate(dateStr);
        if (dateStr && description && amount !== 0 && !isNaN(date.getTime())) {
          transactions.push({
            date,
            description: description.trim(),
            amount,
            type,
            balance: this.parseAmount(row.get(balanceIndex)),
            reference_number: this.extractReferenceNumber(description),
            check_number: this.extractCheckNumber(description),
          });
        }
      }
    }

    return transactions;
  }

  /**
   * Determine transaction type from description
   */
  private determineTransactionType(
    description: string,
    fallbackType: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer' | 'check' | 'other'
  ): 'debit' | 'credit' | 'fee' | 'interest' | 'transfer' | 'check' | 'other' {
    const desc = description.toLowerCase();

    if (desc.includes('fee') || desc.includes('charge') || desc.includes('penalty')) {
      return 'fee';
    }
    if (desc.includes('interest') || desc.includes('dividend')) {
      return 'interest';
    }
    if (desc.includes('transfer') || desc.includes('xfer')) {
      return 'transfer';
    }
    if (desc.includes('check') || desc.includes('chk') || /check\s*#?\d+/.test(desc)) {
      return 'check';
    }

    return fallbackType;
  }

  /**
   * Determine account type
   */
  private determineAccountType(
    extractedData: Record<string, string>,
    content: string
  ): BankStatementData['account_type'] {
    const combined = (Object.values(extractedData).join(' ') + ' ' + content).toLowerCase();

    if (combined.includes('checking') || combined.includes('chk')) return 'checking';
    if (combined.includes('savings') || combined.includes('sav')) return 'savings';
    if (combined.includes('credit card') || combined.includes('credit')) return 'credit';
    if (combined.includes('loan') || combined.includes('mortgage')) return 'loan';
    if (combined.includes('investment') || combined.includes('brokerage')) return 'investment';

    return 'other';
  }

  /**
   * Transaction categorization helpers
   */
  private isFeeTransaction(transaction: BankStatementData['transactions'][0]): boolean {
    return transaction.type === 'fee' ||
           transaction.description.toLowerCase().includes('fee') ||
           transaction.description.toLowerCase().includes('charge');
  }

  private isCheckTransaction(transaction: BankStatementData['transactions'][0]): boolean {
    return transaction.type === 'check' ||
           transaction.description.toLowerCase().includes('check') ||
           /check\s*#?\d+/.test(transaction.description.toLowerCase());
  }

  private isElectronicTransaction(transaction: BankStatementData['transactions'][0]): boolean {
    const desc = transaction.description.toLowerCase();
    return desc.includes('ach') || desc.includes('wire') ||
           desc.includes('online') || desc.includes('electronic') ||
           desc.includes('card');
  }

  private determineFeeType(description: string): BankStatementData['fees'][0]['type'] {
    const desc = description.toLowerCase();

    if (desc.includes('maintenance') || desc.includes('monthly')) return 'maintenance';
    if (desc.includes('overdraft') || desc.includes('nsf')) return 'overdraft';
    if (desc.includes('atm')) return 'atm';
    if (desc.includes('wire')) return 'wire';
    if (desc.includes('stop payment')) return 'stop_payment';

    return 'other';
  }

  private determineElectronicType(description: string): BankStatementData['electronic_transactions'][0]['type'] {
    const desc = description.toLowerCase();

    if (desc.includes('ach debit')) return 'ach_debit';
    if (desc.includes('ach credit') || desc.includes('ach deposit')) return 'ach_credit';
    if (desc.includes('wire')) return 'wire';
    if (desc.includes('online') || desc.includes('transfer')) return 'online_transfer';
    if (desc.includes('card') || desc.includes('debit card') || desc.includes('pos')) return 'card_transaction';

    return 'other';
  }

  /**
   * Extract specific information from descriptions
   */
  private extractCheckNumber(description: string): string | undefined {
    const match = description.match(/(?:check|chk)\s*#?(\d+)/i);
    return match ? match[1] : undefined;
  }

  private extractReferenceNumber(description: string): string | undefined {
    const match = description.match(/(?:ref|reference|conf|confirmation)\s*#?([a-zA-Z0-9]+)/i);
    return match ? match[1] : undefined;
  }

  private extractPayee(description: string): string | undefined {
    // Simple payee extraction - this could be enhanced
    const parts = description.split(/\s+/);
    if (parts.length > 2) {
      return parts.slice(1).join(' ').trim();
    }
    return undefined;
  }

  /**
   * Validate extracted bank statement data
   */
  public async validate(data: BankStatementData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required field validations
    if (!data.account_holder_name) {
      errors.push({
        field: 'account_holder_name',
        message: 'Account holder name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.account_number) {
      errors.push({
        field: 'account_number',
        message: 'Account number is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.bank_name) {
      errors.push({
        field: 'bank_name',
        message: 'Bank name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Date validations
    if (isNaN(data.statement_period_start.getTime())) {
      errors.push({
        field: 'statement_period_start',
        message: 'Valid statement period start date is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (isNaN(data.statement_period_end.getTime())) {
      errors.push({
        field: 'statement_period_end',
        message: 'Valid statement period end date is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (data.statement_period_end < data.statement_period_start) {
      errors.push({
        field: 'statement_period_end',
        message: 'Statement period end date cannot be before start date',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Balance validation
    const calculatedEndingBalance = data.beginning_balance +
      data.total_deposits - data.total_withdrawals - data.total_fees + data.total_interest_earned;

    if (Math.abs(calculatedEndingBalance - data.ending_balance) > 0.01) {
      errors.push({
        field: 'ending_balance',
        message: 'Ending balance does not reconcile with beginning balance and transactions',
        severity: 'warning',
        confidence: 0.7,
      });
    }

    // Transaction validations
    if (data.transactions.length === 0) {
      errors.push({
        field: 'transactions',
        message: 'No transactions found - this may indicate parsing issues',
        severity: 'warning',
        confidence: 0.8,
      });
    }

    // Validate transaction totals
    const transactionCreditTotal = data.transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionDebitTotal = data.transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (Math.abs(transactionCreditTotal - data.total_deposits) > 1.00) {
      errors.push({
        field: 'total_deposits',
        message: 'Total deposits does not match sum of credit transactions',
        severity: 'warning',
        confidence: 0.6,
      });
    }

    if (Math.abs(transactionDebitTotal - data.total_withdrawals) > 1.00) {
      errors.push({
        field: 'total_withdrawals',
        message: 'Total withdrawals does not match sum of debit transactions',
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

    // Handle parentheses for negative amounts
    let isNegative = value.includes('(') && value.includes(')');

    const numStr = value.replace(/[,$\s()]/g, '');
    const num = parseFloat(numStr);

    if (isNaN(num)) return 0;

    return isNegative ? -Math.abs(num) : num;
  }

  private parseDate(value: string | undefined): Date {
    if (!value) return new Date();

    // Try various date formats
    const dateFormats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
      /(\d{1,2})\/(\d{1,2})\/(\d{2})/,  // MM/DD/YY
    ];

    for (const format of dateFormats) {
      const match = value.match(format);
      if (match) {
        if (format === dateFormats[2]) { // YYYY-MM-DD
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else if (format === dateFormats[3]) { // MM/DD/YY
          let year = parseInt(match[3]);
          year += year < 50 ? 2000 : 1900; // Assume 00-49 = 2000-2049, 50-99 = 1950-1999
          return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
        } else {
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        }
      }
    }

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

  private findColumnIndex(headers: string[], searchTerms: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      for (const term of searchTerms) {
        if (headers[i].includes(term)) {
          return i;
        }
      }
    }
    return 0;
  }
}

export default BankStatementExtractor;