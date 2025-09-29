import { prisma } from '@/server/db';
import { BaseSyncService, SyncResult, SyncOptions } from './base-sync';

interface LocalAccount {
  quickbooksId: string;
  name: string;
  accountType: string;
  accountSubType: string;
  classification: string;
  currentBalance?: number;
  description?: string;
  isActive: boolean;
  parentAccountId?: string;
  accountNumber?: string;
  bankAccountType?: string;
  lastModified: Date;
}

export class AccountsSyncService extends BaseSyncService {
  getEntityType(): string {
    return 'accounts';
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
      console.log(`Starting accounts sync for organization ${this.organizationId}`);

      // Get accounts from QuickBooks with pagination
      const accounts = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getAccounts(this.realmId, maxResults, startPosition),
        options.maxRecords || 1000
      );

      result.recordsProcessed = accounts.length;
      const lastSyncDate = options.fullSync ? null : await this.getLastSyncDate();

      for (const account of accounts) {
        try {
          // Skip if not modified since last sync (unless full sync)
          if (!options.fullSync && !this.shouldSyncEntity(account, lastSyncDate)) {
            continue;
          }

          await this.syncAccount(account);
          result.recordsSuccess++;
        } catch (error) {
          result.recordsFailed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync account ${account.Id}: ${errorMessage}`);
          console.error('Account sync error:', error);
        }
      }

      result.success = result.recordsFailed === 0;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Accounts sync failed: ${errorMessage}`);
      console.error('Accounts sync error:', error);
      return result;
    }
  }

  private async syncAccount(qbAccount: any): Promise<void> {
    const validation = this.validateEntity(qbAccount);
    if (!validation.isValid) {
      throw new Error(`Invalid account data: ${validation.errors.join(', ')}`);
    }

    // Map QuickBooks account to local format
    const accountData = this.mapToLocalEntity(qbAccount);

    // Store account information in organization's financial data
    await this.upsertAccountData(accountData);

    console.log(`Successfully synced account: ${accountData.name} (QB ID: ${qbAccount.Id})`);
  }

  private async upsertAccountData(accountData: LocalAccount): Promise<void> {
    // Get current organization
    const organization = await prisma.organization.findUnique({
      where: { id: this.organizationId },
      select: { id: true }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // We'll store account data in a separate table if needed, or in JSON fields
    // For now, let's use audit logs to track the sync
    await prisma.auditLog.create({
      data: {
        action: 'sync',
        entityType: 'quickbooks_account',
        entityId: accountData.quickbooksId,
        newValues: accountData,
        metadata: {
          syncType: 'accounts',
          source: 'quickbooks',
          accountType: accountData.accountType
        },
        organizationId: this.organizationId
      }
    });
  }

  protected mapToLocalEntity(qbAccount: any): LocalAccount {
    return {
      quickbooksId: qbAccount.Id,
      name: qbAccount.Name,
      accountType: qbAccount.AccountType,
      accountSubType: qbAccount.AccountSubType,
      classification: qbAccount.Classification,
      currentBalance: qbAccount.CurrentBalance ? parseFloat(qbAccount.CurrentBalance) : undefined,
      description: qbAccount.Description,
      isActive: qbAccount.Active !== false,
      parentAccountId: qbAccount.ParentRef ? qbAccount.ParentRef.value : undefined,
      accountNumber: qbAccount.AcctNum,
      bankAccountType: qbAccount.BankAccountType,
      lastModified: new Date(qbAccount.MetaData.LastUpdatedTime)
    };
  }

  protected customValidateEntity(entity: any): string[] {
    const errors: string[] = [];

    if (!entity.Name) {
      errors.push('Account name is required');
    }

    if (!entity.AccountType) {
      errors.push('Account type is required');
    }

    if (!entity.AccountSubType) {
      errors.push('Account sub-type is required');
    }

    // Validate account type values
    const validAccountTypes = [
      'Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses',
      'Other Income', 'Other Expense', 'Cost of Goods Sold'
    ];

    if (!validAccountTypes.includes(entity.AccountType)) {
      errors.push(`Invalid account type: ${entity.AccountType}`);
    }

    return errors;
  }

  /**
   * Get chart of accounts summary
   */
  async getChartOfAccounts(): Promise<any[]> {
    try {
      const accounts = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getAccounts(this.realmId, maxResults, startPosition),
        1000
      );

      return accounts.map(account => this.mapToLocalEntity(account));
    } catch (error) {
      console.error('Error getting chart of accounts:', error);
      throw error;
    }
  }

  /**
   * Get accounts by type
   */
  async getAccountsByType(accountType: string): Promise<any[]> {
    try {
      const allAccounts = await this.getChartOfAccounts();
      return allAccounts.filter(account => account.accountType === accountType);
    } catch (error) {
      console.error('Error getting accounts by type:', error);
      throw error;
    }
  }

  /**
   * Get account balance summary
   */
  async getAccountBalances(): Promise<any> {
    try {
      const accounts = await this.getChartOfAccounts();

      const summary = {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        accountCount: accounts.length,
        byType: {} as Record<string, { count: number; balance: number }>
      };

      accounts.forEach(account => {
        const balance = account.currentBalance || 0;
        const type = account.accountType;

        // Add to totals
        switch (type) {
          case 'Assets':
            summary.totalAssets += balance;
            break;
          case 'Liabilities':
            summary.totalLiabilities += balance;
            break;
          case 'Equity':
            summary.totalEquity += balance;
            break;
          case 'Revenue':
          case 'Other Income':
            summary.totalRevenue += balance;
            break;
          case 'Expenses':
          case 'Other Expense':
          case 'Cost of Goods Sold':
            summary.totalExpenses += balance;
            break;
        }

        // Add to type summary
        if (!summary.byType[type]) {
          summary.byType[type] = { count: 0, balance: 0 };
        }
        summary.byType[type].count++;
        summary.byType[type].balance += balance;
      });

      return summary;
    } catch (error) {
      console.error('Error getting account balances:', error);
      throw error;
    }
  }

  /**
   * Find account by QuickBooks ID
   */
  async findAccountById(quickbooksId: string): Promise<any | null> {
    try {
      const accounts = await this.getChartOfAccounts();
      return accounts.find(account => account.quickbooksId === quickbooksId) || null;
    } catch (error) {
      console.error('Error finding account by ID:', error);
      return null;
    }
  }
}