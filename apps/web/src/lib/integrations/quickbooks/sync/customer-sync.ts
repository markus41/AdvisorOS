import { prisma } from '@/packages/database';
import { BaseSyncService, SyncResult, SyncOptions } from './base-sync';

interface LocalCustomer {
  quickbooksId: string;
  businessName: string;
  legalName?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  businessAddress?: any;
  mailingAddress?: any;
  customFields?: any;
  isActive: boolean;
  balance?: number;
  lastModified: Date;
}

export class CustomerSyncService extends BaseSyncService {
  getEntityType(): string {
    return 'customers';
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
      console.log(`Starting customers sync for organization ${this.organizationId}`);

      // Get customers from QuickBooks with pagination
      const customers = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getCustomers(this.realmId, maxResults, startPosition),
        options.maxRecords || 1000
      );

      result.recordsProcessed = customers.length;
      const lastSyncDate = options.fullSync ? null : await this.getLastSyncDate();

      for (const customer of customers) {
        try {
          // Skip if not modified since last sync (unless full sync)
          if (!options.fullSync && !this.shouldSyncEntity(customer, lastSyncDate)) {
            continue;
          }

          await this.syncCustomer(customer);
          result.recordsSuccess++;
        } catch (error) {
          result.recordsFailed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync customer ${customer.Id}: ${errorMessage}`);
          console.error('Customer sync error:', error);
        }
      }

      result.success = result.recordsFailed === 0;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Customers sync failed: ${errorMessage}`);
      console.error('Customers sync error:', error);
      return result;
    }
  }

  private async syncCustomer(qbCustomer: any): Promise<void> {
    const validation = this.validateEntity(qbCustomer);
    if (!validation.isValid) {
      throw new Error(`Invalid customer data: ${validation.errors.join(', ')}`);
    }

    // Map QuickBooks customer to local format
    const customerData = this.mapToLocalEntity(qbCustomer);

    // Try to find existing client by QuickBooks ID
    let existingClient = await prisma.client.findFirst({
      where: {
        quickbooksId: customerData.quickbooksId,
        organizationId: this.organizationId
      }
    });

    if (existingClient) {
      // Update existing client
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          businessName: customerData.businessName,
          legalName: customerData.legalName,
          primaryContactName: customerData.primaryContactName,
          primaryContactEmail: customerData.primaryContactEmail,
          primaryContactPhone: customerData.primaryContactPhone,
          businessAddress: customerData.businessAddress ? JSON.stringify(customerData.businessAddress) : null,
          mailingAddress: customerData.mailingAddress ? JSON.stringify(customerData.mailingAddress) : null,
          status: customerData.isActive ? 'active' : 'inactive',
          customFields: customerData.customFields,
          updatedAt: new Date()
        }
      });
    } else {
      // Try to match by email and create/update
      existingClient = await prisma.client.findFirst({
        where: {
          primaryContactEmail: customerData.primaryContactEmail,
          organizationId: this.organizationId
        }
      });

      if (existingClient) {
        // Update existing client with QuickBooks ID
        await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            quickbooksId: customerData.quickbooksId,
            businessName: customerData.businessName,
            legalName: customerData.legalName,
            primaryContactName: customerData.primaryContactName,
            primaryContactPhone: customerData.primaryContactPhone,
            businessAddress: customerData.businessAddress ? JSON.stringify(customerData.businessAddress) : null,
            mailingAddress: customerData.mailingAddress ? JSON.stringify(customerData.mailingAddress) : null,
            status: customerData.isActive ? 'active' : 'inactive',
            customFields: customerData.customFields,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new client
        await prisma.client.create({
          data: {
            businessName: customerData.businessName,
            legalName: customerData.legalName,
            quickbooksId: customerData.quickbooksId,
            primaryContactName: customerData.primaryContactName,
            primaryContactEmail: customerData.primaryContactEmail,
            primaryContactPhone: customerData.primaryContactPhone,
            businessAddress: customerData.businessAddress ? JSON.stringify(customerData.businessAddress) : null,
            mailingAddress: customerData.mailingAddress ? JSON.stringify(customerData.mailingAddress) : null,
            status: customerData.isActive ? 'active' : 'inactive',
            customFields: customerData.customFields,
            organizationId: this.organizationId
          }
        });
      }
    }

    console.log(`Successfully synced customer: ${customerData.businessName} (QB ID: ${qbCustomer.Id})`);
  }

  protected mapToLocalEntity(qbCustomer: any): LocalCustomer {
    // Extract addresses
    const businessAddress = qbCustomer.BillAddr ? {
      line1: qbCustomer.BillAddr.Line1,
      line2: qbCustomer.BillAddr.Line2,
      city: qbCustomer.BillAddr.City,
      state: qbCustomer.BillAddr.CountrySubDivisionCode,
      postalCode: qbCustomer.BillAddr.PostalCode,
      country: qbCustomer.BillAddr.Country
    } : null;

    const mailingAddress = qbCustomer.ShipAddr ? {
      line1: qbCustomer.ShipAddr.Line1,
      line2: qbCustomer.ShipAddr.Line2,
      city: qbCustomer.ShipAddr.City,
      state: qbCustomer.ShipAddr.CountrySubDivisionCode,
      postalCode: qbCustomer.ShipAddr.PostalCode,
      country: qbCustomer.ShipAddr.Country
    } : null;

    // Extract contact information
    const primaryEmail = qbCustomer.PrimaryEmailAddr?.Address || '';
    const primaryPhone = qbCustomer.PrimaryPhone?.FreeFormNumber || qbCustomer.Mobile?.FreeFormNumber || '';

    return {
      quickbooksId: qbCustomer.Id,
      businessName: qbCustomer.Name || qbCustomer.CompanyName || 'Unknown Company',
      legalName: qbCustomer.CompanyName,
      primaryContactName: qbCustomer.GivenName && qbCustomer.FamilyName
        ? `${qbCustomer.GivenName} ${qbCustomer.FamilyName}`.trim()
        : qbCustomer.DisplayName || qbCustomer.Name || 'Unknown Contact',
      primaryContactEmail: primaryEmail,
      primaryContactPhone: primaryPhone,
      businessAddress,
      mailingAddress,
      customFields: {
        quickbooksData: {
          displayName: qbCustomer.DisplayName,
          givenName: qbCustomer.GivenName,
          familyName: qbCustomer.FamilyName,
          suffix: qbCustomer.Suffix,
          title: qbCustomer.Title,
          middleName: qbCustomer.MiddleName,
          notes: qbCustomer.Notes,
          website: qbCustomer.WebAddr?.URI,
          fax: qbCustomer.Fax?.FreeFormNumber,
          alternatePhone: qbCustomer.AlternatePhone?.FreeFormNumber,
          taxExempt: qbCustomer.Taxable === false,
          currencyRef: qbCustomer.CurrencyRef,
          preferredDeliveryMethod: qbCustomer.PreferredDeliveryMethod,
          resaleNum: qbCustomer.ResaleNum
        }
      },
      isActive: qbCustomer.Active !== false,
      balance: qbCustomer.Balance ? parseFloat(qbCustomer.Balance) : undefined,
      lastModified: new Date(qbCustomer.MetaData.LastUpdatedTime)
    };
  }

  protected customValidateEntity(entity: any): string[] {
    const errors: string[] = [];

    if (!entity.Name && !entity.CompanyName) {
      errors.push('Customer must have either Name or CompanyName');
    }

    // Validate email format if provided
    if (entity.PrimaryEmailAddr?.Address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(entity.PrimaryEmailAddr.Address)) {
        errors.push('Invalid email format');
      }
    }

    return errors;
  }

  /**
   * Get customer summary
   */
  async getCustomerSummary(): Promise<any> {
    try {
      const customers = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getCustomers(this.realmId, maxResults, startPosition),
        1000
      );

      const summary = {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.Active !== false).length,
        totalBalance: customers.reduce((sum, c) => sum + (parseFloat(c.Balance) || 0), 0),
        averageBalance: 0,
        customersWithEmail: customers.filter(c => c.PrimaryEmailAddr?.Address).length,
        customersWithPhone: customers.filter(c => c.PrimaryPhone?.FreeFormNumber || c.Mobile?.FreeFormNumber).length
      };

      summary.averageBalance = summary.totalCustomers > 0 ? summary.totalBalance / summary.totalCustomers : 0;

      return summary;
    } catch (error) {
      console.error('Error getting customer summary:', error);
      throw error;
    }
  }

  /**
   * Find customer by QuickBooks ID
   */
  async findCustomerById(quickbooksId: string): Promise<any | null> {
    try {
      const customer = await this.apiClient.getById(this.realmId, 'customer', quickbooksId);
      if (customer?.QueryResponse?.Customer?.[0]) {
        return this.mapToLocalEntity(customer.QueryResponse.Customer[0]);
      }
      return null;
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      return null;
    }
  }

  /**
   * Search customers by name or email
   */
  async searchCustomers(searchTerm: string): Promise<any[]> {
    try {
      // QuickBooks doesn't have a direct search API, so we'll get all customers and filter
      const customers = await this.paginateResults<any>(
        (maxResults, startPosition) => this.apiClient.getCustomers(this.realmId, maxResults, startPosition),
        1000
      );

      const searchLower = searchTerm.toLowerCase();
      return customers
        .filter(customer => {
          const name = (customer.Name || '').toLowerCase();
          const companyName = (customer.CompanyName || '').toLowerCase();
          const email = (customer.PrimaryEmailAddr?.Address || '').toLowerCase();

          return name.includes(searchLower) ||
                 companyName.includes(searchLower) ||
                 email.includes(searchLower);
        })
        .map(customer => this.mapToLocalEntity(customer));
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Sync specific customer by QuickBooks ID
   */
  async syncSpecificCustomer(quickbooksId: string): Promise<void> {
    try {
      const customer = await this.apiClient.getById(this.realmId, 'customer', quickbooksId);
      if (customer?.QueryResponse?.Customer?.[0]) {
        await this.syncCustomer(customer.QueryResponse.Customer[0]);
      } else {
        throw new Error(`Customer with ID ${quickbooksId} not found`);
      }
    } catch (error) {
      console.error('Error syncing specific customer:', error);
      throw error;
    }
  }
}