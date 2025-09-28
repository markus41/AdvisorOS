import { db } from "../db";

interface QuickBooksApiResponse {
  QueryResponse?: {
    [key: string]: any[];
    maxResults?: number;
    startPosition?: number;
  };
  QueryError?: {
    Error: Array<{
      code: string;
      Detail: string;
    }>;
  };
}

interface QuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: Date;
}

class QuickBooksService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.QUICKBOOKS_SANDBOX === 'true'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';
  }

  async getTokens(organizationId: string): Promise<QuickBooksTokens | null> {
    const token = await db.quickBooksToken.findUnique({
      where: { organizationId, isActive: true }
    });

    if (!token) return null;

    // Check if token needs refresh
    if (token.expiresAt < new Date()) {
      return await this.refreshTokens(organizationId);
    }

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      realmId: token.realmId,
      expiresAt: token.expiresAt
    };
  }

  async refreshTokens(organizationId: string): Promise<QuickBooksTokens> {
    const token = await db.quickBooksToken.findUnique({
      where: { organizationId, isActive: true }
    });

    if (!token) {
      throw new Error('No QuickBooks token found');
    }

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh QuickBooks tokens');
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await db.quickBooksToken.update({
      where: { id: token.id },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || token.refreshToken,
        expiresAt,
        updatedAt: new Date()
      }
    });

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || token.refreshToken,
      realmId: token.realmId,
      expiresAt
    };
  }

  async makeApiRequest(organizationId: string, endpoint: string, options: RequestInit = {}) {
    const tokens = await this.getTokens(organizationId);
    if (!tokens) {
      throw new Error('No valid QuickBooks tokens found');
    }

    const url = `${this.baseUrl}/v3/company/${tokens.realmId}/${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('QuickBooks API error:', error);
      throw new Error(`QuickBooks API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as QuickBooksApiResponse;
  }

  // Company Information
  async syncCompanyInfo(organizationId: string) {
    try {
      const companyInfo = await this.makeApiRequest(organizationId, 'companyinfo/1');

      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'company',
          status: 'in_progress',
          recordsTotal: 1
        }
      });

      // Store company info in organization metadata or separate table
      await db.organization.update({
        where: { id: organizationId },
        data: {
          updatedAt: new Date()
          // Store company info in a metadata field if available
        }
      });

      await db.quickBooksSync.update({
        where: { id: syncRecord.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsProcessed: 1,
          recordsSuccess: 1
        }
      });

      return companyInfo;
    } catch (error) {
      console.error('Company info sync error:', error);
      throw error;
    }
  }

  // Chart of Accounts
  async syncChartOfAccounts(organizationId: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'accounts',
          status: 'in_progress'
        }
      });

      const accounts = await this.makeApiRequest(organizationId, "query?query=SELECT * FROM Account MAXRESULTS 1000");

      if (accounts.QueryResponse?.Account) {
        await db.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            recordsTotal: accounts.QueryResponse.Account.length,
            recordsProcessed: accounts.QueryResponse.Account.length,
            recordsSuccess: accounts.QueryResponse.Account.length
          }
        });
      }

      return accounts;
    } catch (error) {
      console.error('Chart of accounts sync error:', error);
      throw error;
    }
  }

  // Customers
  async syncCustomers(organizationId: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'customers',
          status: 'in_progress'
        }
      });

      const customers = await this.makeApiRequest(organizationId, "query?query=SELECT * FROM Customer MAXRESULTS 1000");

      if (customers.QueryResponse?.Customer) {
        // Update existing clients with QuickBooks IDs
        for (const customer of customers.QueryResponse.Customer) {
          const existingClient = await db.client.findFirst({
            where: {
              organizationId,
              OR: [
                { primaryContactEmail: customer.PrimaryEmailAddr?.Address },
                { businessName: customer.Name }
              ]
            }
          });

          if (existingClient) {
            await db.client.update({
              where: { id: existingClient.id },
              data: {
                quickbooksId: customer.Id,
                updatedAt: new Date()
              }
            });
          }
        }

        await db.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            recordsTotal: customers.QueryResponse.Customer.length,
            recordsProcessed: customers.QueryResponse.Customer.length,
            recordsSuccess: customers.QueryResponse.Customer.length
          }
        });
      }

      return customers;
    } catch (error) {
      console.error('Customers sync error:', error);
      throw error;
    }
  }

  // Vendors
  async syncVendors(organizationId: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'vendors',
          status: 'in_progress'
        }
      });

      const vendors = await this.makeApiRequest(organizationId, "query?query=SELECT * FROM Vendor MAXRESULTS 1000");

      if (vendors.QueryResponse?.Vendor) {
        await db.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            recordsTotal: vendors.QueryResponse.Vendor.length,
            recordsProcessed: vendors.QueryResponse.Vendor.length,
            recordsSuccess: vendors.QueryResponse.Vendor.length
          }
        });
      }

      return vendors;
    } catch (error) {
      console.error('Vendors sync error:', error);
      throw error;
    }
  }

  // Invoices
  async syncInvoices(organizationId: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'invoices',
          status: 'in_progress'
        }
      });

      const invoices = await this.makeApiRequest(organizationId, "query?query=SELECT * FROM Invoice MAXRESULTS 1000");

      if (invoices.QueryResponse?.Invoice) {
        await db.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            recordsTotal: invoices.QueryResponse.Invoice.length,
            recordsProcessed: invoices.QueryResponse.Invoice.length,
            recordsSuccess: invoices.QueryResponse.Invoice.length
          }
        });
      }

      return invoices;
    } catch (error) {
      console.error('Invoices sync error:', error);
      throw error;
    }
  }

  // Bills
  async syncBills(organizationId: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'bills',
          status: 'in_progress'
        }
      });

      const bills = await this.makeApiRequest(organizationId, "query?query=SELECT * FROM Bill MAXRESULTS 1000");

      if (bills.QueryResponse?.Bill) {
        await db.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            recordsTotal: bills.QueryResponse.Bill.length,
            recordsProcessed: bills.QueryResponse.Bill.length,
            recordsSuccess: bills.QueryResponse.Bill.length
          }
        });
      }

      return bills;
    } catch (error) {
      console.error('Bills sync error:', error);
      throw error;
    }
  }

  // Bank Transactions
  async syncBankTransactions(organizationId: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'transactions',
          status: 'in_progress'
        }
      });

      const transactions = await this.makeApiRequest(organizationId, "query?query=SELECT * FROM JournalEntry MAXRESULTS 1000");

      if (transactions.QueryResponse?.JournalEntry) {
        await db.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            recordsTotal: transactions.QueryResponse.JournalEntry.length,
            recordsProcessed: transactions.QueryResponse.JournalEntry.length,
            recordsSuccess: transactions.QueryResponse.JournalEntry.length
          }
        });
      }

      return transactions;
    } catch (error) {
      console.error('Bank transactions sync error:', error);
      throw error;
    }
  }

  // Profit & Loss Report
  async syncProfitAndLoss(organizationId: string, startDate?: string, endDate?: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'reports',
          status: 'in_progress'
        }
      });

      const dateFilter = startDate && endDate ? `&start_date=${startDate}&end_date=${endDate}` : '';
      const report = await this.makeApiRequest(organizationId, `reports/ProfitAndLoss?${dateFilter}`);

      await db.quickBooksSync.update({
        where: { id: syncRecord.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsTotal: 1,
          recordsProcessed: 1,
          recordsSuccess: 1
        }
      });

      return report;
    } catch (error) {
      console.error('Profit & Loss sync error:', error);
      throw error;
    }
  }

  // Balance Sheet Report
  async syncBalanceSheet(organizationId: string, asOfDate?: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'manual',
          entityType: 'reports',
          status: 'in_progress'
        }
      });

      const dateFilter = asOfDate ? `&as_of_date=${asOfDate}` : '';
      const report = await this.makeApiRequest(organizationId, `reports/BalanceSheet?${dateFilter}`);

      await db.quickBooksSync.update({
        where: { id: syncRecord.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsTotal: 1,
          recordsProcessed: 1,
          recordsSuccess: 1
        }
      });

      return report;
    } catch (error) {
      console.error('Balance Sheet sync error:', error);
      throw error;
    }
  }

  // Rate limiting helper
  async waitForRateLimit() {
    // QuickBooks allows 500 requests per minute
    const delay = 120; // 120ms between requests = ~500 requests/minute
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Full sync method
  async performFullSync(organizationId: string) {
    try {
      const syncRecord = await db.quickBooksSync.create({
        data: {
          organizationId,
          syncType: 'full',
          entityType: 'all',
          status: 'in_progress'
        }
      });

      const results = [];

      // Sync in order of dependencies
      results.push(await this.syncCompanyInfo(organizationId));
      await this.waitForRateLimit();

      results.push(await this.syncChartOfAccounts(organizationId));
      await this.waitForRateLimit();

      results.push(await this.syncCustomers(organizationId));
      await this.waitForRateLimit();

      results.push(await this.syncVendors(organizationId));
      await this.waitForRateLimit();

      results.push(await this.syncInvoices(organizationId));
      await this.waitForRateLimit();

      results.push(await this.syncBills(organizationId));
      await this.waitForRateLimit();

      results.push(await this.syncBankTransactions(organizationId));

      await db.quickBooksSync.update({
        where: { id: syncRecord.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsTotal: results.length,
          recordsProcessed: results.length,
          recordsSuccess: results.length
        }
      });

      // Update last sync timestamp
      await db.quickBooksToken.updateMany({
        where: { organizationId },
        data: { lastSyncAt: new Date() }
      });

      return { success: true, results };
    } catch (error) {
      console.error('Full sync error:', error);
      throw error;
    }
  }
}

export const quickbooksService = new QuickBooksService();