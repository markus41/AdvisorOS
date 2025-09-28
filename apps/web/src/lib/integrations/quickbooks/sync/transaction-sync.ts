import { prisma } from '@/packages/database';
import { BaseSyncService, SyncResult, SyncOptions } from './base-sync';

interface LocalTransaction {
  quickbooksId: string;
  transactionType: string;
  transactionDate: Date;
  amount: number;
  description?: string;
  accountRef?: any;
  customerRef?: any;
  vendorRef?: any;
  lineItems: any[];
  status: string;
  memo?: string;
  customFields?: any;
  lastModified: Date;
}

export class TransactionSyncService extends BaseSyncService {
  getEntityType(): string {
    return 'transactions';
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
      console.log(`Starting transactions sync for organization ${this.organizationId}`);

      const lastSyncDate = options.fullSync ? null : await this.getLastSyncDate();

      // Sync different types of transactions
      const transactionTypes = [
        { type: 'Purchase', method: 'getPurchases' },
        { type: 'JournalEntry', method: 'getJournalEntries' }
      ];

      for (const { type, method } of transactionTypes) {
        try {
          console.log(`Syncing ${type} transactions...`);

          // Get transactions from QuickBooks with pagination
          const transactions = await this.paginateResults<any>(
            (maxResults, startPosition) => (this.apiClient as any)[method](
              this.realmId,
              maxResults,
              startPosition,
              lastSyncDate || undefined
            ),
            options.maxRecords ? Math.floor(options.maxRecords / transactionTypes.length) : 500
          );

          result.recordsProcessed += transactions.length;

          for (const transaction of transactions) {
            try {
              // Skip if not modified since last sync (unless full sync)
              if (!options.fullSync && !this.shouldSyncEntity(transaction, lastSyncDate)) {
                continue;
              }

              await this.syncTransaction(transaction, type);
              result.recordsSuccess++;
            } catch (error) {
              result.recordsFailed++;
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              result.errors.push(`Failed to sync ${type} ${transaction.Id}: ${errorMessage}`);
              console.error(`${type} sync error:`, error);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync ${type} transactions: ${errorMessage}`);
          console.error(`${type} transactions sync error:`, error);
        }
      }

      result.success = result.recordsFailed === 0;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Transactions sync failed: ${errorMessage}`);
      console.error('Transactions sync error:', error);
      return result;
    }
  }

  private async syncTransaction(qbTransaction: any, transactionType: string): Promise<void> {
    const validation = this.validateEntity(qbTransaction);
    if (!validation.isValid) {
      throw new Error(`Invalid ${transactionType} data: ${validation.errors.join(', ')}`);
    }

    // Map QuickBooks transaction to local format
    const transactionData = this.mapToLocalEntity(qbTransaction);
    transactionData.transactionType = transactionType;

    // Store transaction information in audit logs for tracking
    await this.storeTransactionData(transactionData);

    console.log(`Successfully synced ${transactionType}: ${transactionData.quickbooksId}`);
  }

  private async storeTransactionData(transactionData: LocalTransaction): Promise<void> {
    // Store transaction data in audit logs for tracking
    // In a production system, you might want a dedicated transactions table
    await prisma.auditLog.create({
      data: {
        action: 'sync',
        entityType: 'quickbooks_transaction',
        entityId: transactionData.quickbooksId,
        newValues: transactionData,
        metadata: {
          syncType: 'transactions',
          source: 'quickbooks',
          transactionType: transactionData.transactionType,
          amount: transactionData.amount,
          transactionDate: transactionData.transactionDate.toISOString()
        },
        organizationId: this.organizationId
      }
    });
  }

  protected mapToLocalEntity(qbTransaction: any): LocalTransaction {
    // Base mapping for common fields
    const baseMapping = {
      quickbooksId: qbTransaction.Id,
      transactionDate: new Date(qbTransaction.TxnDate || qbTransaction.TranDate),
      description: qbTransaction.PrivateNote || qbTransaction.Description,
      memo: qbTransaction.Memo,
      status: qbTransaction.TxnStatus || 'Active',
      lastModified: new Date(qbTransaction.MetaData.LastUpdatedTime)
    };

    // Transaction type specific mapping
    if (qbTransaction.EntityRef || qbTransaction.VendorRef) {
      // Purchase transaction
      return {
        ...baseMapping,
        transactionType: 'Purchase',
        amount: parseFloat(qbTransaction.TotalAmt || '0'),
        accountRef: qbTransaction.AccountRef,
        vendorRef: qbTransaction.VendorRef,
        customerRef: qbTransaction.CustomerRef,
        lineItems: this.mapPurchaseLineItems(qbTransaction.Line || []),
        customFields: {
          quickbooksData: {
            paymentType: qbTransaction.PaymentType,
            credit: qbTransaction.Credit,
            department: qbTransaction.DepartmentRef,
            class: qbTransaction.ClassRef,
            currencyRef: qbTransaction.CurrencyRef,
            exchangeRate: qbTransaction.ExchangeRate
          }
        }
      };
    } else {
      // Journal Entry
      return {
        ...baseMapping,
        transactionType: 'JournalEntry',
        amount: parseFloat(qbTransaction.TotalAmt || '0'),
        lineItems: this.mapJournalEntryLineItems(qbTransaction.Line || []),
        customFields: {
          quickbooksData: {
            adjustment: qbTransaction.Adjustment,
            homeTotalAmt: qbTransaction.HomeTotalAmt,
            currencyRef: qbTransaction.CurrencyRef,
            exchangeRate: qbTransaction.ExchangeRate
          }
        }
      };
    }
  }

  private mapPurchaseLineItems(lines: any[]): any[] {
    return lines.map(line => ({
      id: line.Id,
      lineNum: line.LineNum,
      description: line.Description,
      amount: parseFloat(line.Amount || '0'),
      accountRef: line.AccountBasedExpenseLineDetail?.AccountRef,
      customerRef: line.AccountBasedExpenseLineDetail?.CustomerRef,
      classRef: line.AccountBasedExpenseLineDetail?.ClassRef,
      billableStatus: line.AccountBasedExpenseLineDetail?.BillableStatus,
      itemRef: line.ItemBasedExpenseLineDetail?.ItemRef,
      quantity: line.ItemBasedExpenseLineDetail?.Qty ? parseFloat(line.ItemBasedExpenseLineDetail.Qty) : undefined,
      unitPrice: line.ItemBasedExpenseLineDetail?.UnitPrice ? parseFloat(line.ItemBasedExpenseLineDetail.UnitPrice) : undefined,
      detailType: line.DetailType
    }));
  }

  private mapJournalEntryLineItems(lines: any[]): any[] {
    return lines.map(line => ({
      id: line.Id,
      lineNum: line.LineNum,
      description: line.Description,
      amount: parseFloat(line.Amount || '0'),
      postingType: line.JournalEntryLineDetail?.PostingType,
      accountRef: line.JournalEntryLineDetail?.AccountRef,
      departmentRef: line.JournalEntryLineDetail?.DepartmentRef,
      classRef: line.JournalEntryLineDetail?.ClassRef,
      customerRef: line.JournalEntryLineDetail?.CustomerRef,
      vendorRef: line.JournalEntryLineDetail?.VendorRef,
      employeeRef: line.JournalEntryLineDetail?.EmployeeRef,
      detailType: line.DetailType
    }));
  }

  protected customValidateEntity(entity: any): string[] {
    const errors: string[] = [];

    if (!entity.TxnDate && !entity.TranDate) {
      errors.push('Transaction must have a transaction date');
    }

    if (!entity.Line || !Array.isArray(entity.Line) || entity.Line.length === 0) {
      errors.push('Transaction must have at least one line item');
    }

    if (entity.TotalAmt && parseFloat(entity.TotalAmt) < 0) {
      errors.push('Transaction total amount cannot be negative');
    }

    return errors;
  }

  /**
   * Get transaction summary
   */
  async getTransactionSummary(): Promise<any> {
    try {
      const [purchases, journalEntries] = await Promise.all([
        this.paginateResults<any>(
          (maxResults, startPosition) => this.apiClient.getPurchases(this.realmId, maxResults, startPosition),
          1000
        ),
        this.paginateResults<any>(
          (maxResults, startPosition) => this.apiClient.getJournalEntries(this.realmId, maxResults, startPosition),
          1000
        )
      ]);

      const summary = {
        totalTransactions: purchases.length + journalEntries.length,
        purchases: {
          count: purchases.length,
          totalAmount: purchases.reduce((sum, p) => sum + parseFloat(p.TotalAmt || '0'), 0)
        },
        journalEntries: {
          count: journalEntries.length,
          totalAmount: journalEntries.reduce((sum, j) => sum + parseFloat(j.TotalAmt || '0'), 0)
        },
        dateRange: {
          earliest: null as Date | null,
          latest: null as Date | null
        }
      };

      // Calculate date range
      const allTransactions = [...purchases, ...journalEntries];
      if (allTransactions.length > 0) {
        const dates = allTransactions.map(t => new Date(t.TxnDate || t.TranDate)).sort();
        summary.dateRange.earliest = dates[0];
        summary.dateRange.latest = dates[dates.length - 1];
      }

      return summary;
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(days = 30): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const [purchases, journalEntries] = await Promise.all([
        this.paginateResults<any>(
          (maxResults, startPosition) => this.apiClient.getPurchases(this.realmId, maxResults, startPosition, cutoffDate),
          500
        ),
        this.paginateResults<any>(
          (maxResults, startPosition) => this.apiClient.getJournalEntries(this.realmId, maxResults, startPosition, cutoffDate),
          500
        )
      ]);

      const allTransactions = [
        ...purchases.map(p => ({ ...this.mapToLocalEntity(p), transactionType: 'Purchase' })),
        ...journalEntries.map(j => ({ ...this.mapToLocalEntity(j), transactionType: 'JournalEntry' }))
      ];

      return allTransactions
        .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
        .slice(0, 100); // Limit to 100 most recent
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get transactions by vendor
   */
  async getTransactionsByVendor(vendorId: string): Promise<any[]> {
    try {
      const purchases = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getPurchases(this.realmId, maxResults, startPosition),
        1000
      );

      return purchases
        .filter(p => p.VendorRef?.value === vendorId)
        .map(p => this.mapToLocalEntity(p));
    } catch (error) {
      console.error('Error getting transactions by vendor:', error);
      throw error;
    }
  }

  /**
   * Get expense summary by category
   */
  async getExpenseSummaryByCategory(): Promise<any> {
    try {
      const purchases = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getPurchases(this.realmId, maxResults, startPosition),
        1000
      );

      const categorySummary: Record<string, { count: number; amount: number }> = {};

      purchases.forEach(purchase => {
        (purchase.Line || []).forEach((line: any) => {
          const accountRef = line.AccountBasedExpenseLineDetail?.AccountRef;
          if (accountRef) {
            const category = accountRef.name || 'Uncategorized';
            const amount = parseFloat(line.Amount || '0');

            if (!categorySummary[category]) {
              categorySummary[category] = { count: 0, amount: 0 };
            }

            categorySummary[category].count++;
            categorySummary[category].amount += amount;
          }
        });
      });

      return Object.entries(categorySummary)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error('Error getting expense summary by category:', error);
      throw error;
    }
  }
}