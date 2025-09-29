import { prisma } from '@/server/db';
import { BaseSyncService, SyncResult, SyncOptions } from './base-sync';

export class CompanySyncService extends BaseSyncService {
  getEntityType(): string {
    return 'company';
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
      console.log(`Starting company sync for organization ${this.organizationId}`);

      // Get company information from QuickBooks
      const companyInfo = await this.apiClient.getCompanyInfo(this.realmId);

      if (!companyInfo?.QueryResponse?.CompanyInfo) {
        throw new Error('No company information found in QuickBooks response');
      }

      const companies = companyInfo.QueryResponse.CompanyInfo;
      result.recordsProcessed = companies.length;

      for (const company of companies) {
        try {
          await this.syncCompany(company);
          result.recordsSuccess++;
        } catch (error) {
          result.recordsFailed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync company ${company.Id}: ${errorMessage}`);
          console.error('Company sync error:', error);
        }
      }

      result.success = result.recordsFailed === 0;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Company sync failed: ${errorMessage}`);
      console.error('Company sync error:', error);
      return result;
    }
  }

  private async syncCompany(qbCompany: any): Promise<void> {
    const validation = this.validateEntity(qbCompany);
    if (!validation.isValid) {
      throw new Error(`Invalid company data: ${validation.errors.join(', ')}`);
    }

    // Map QuickBooks company to local organization data
    const companyData = this.mapToLocalEntity(qbCompany);

    // Update the organization with QuickBooks company information
    await prisma.organization.update({
      where: { id: this.organizationId },
      data: {
        // Update relevant fields from QuickBooks
        name: companyData.companyName || undefined,
        updatedAt: new Date()
      }
    });

    // Log successful sync
    console.log(`Successfully synced company: ${companyData.companyName} (QB ID: ${qbCompany.Id})`);
  }

  protected mapToLocalEntity(qbCompany: any): any {
    return {
      quickbooksId: qbCompany.Id,
      companyName: qbCompany.Name,
      legalName: qbCompany.LegalName,
      companyAddr: qbCompany.CompanyAddr,
      legalAddr: qbCompany.LegalAddr,
      customerCommunicationAddr: qbCompany.CustomerCommunicationAddr,
      primaryPhone: qbCompany.PrimaryPhone?.FreeFormNumber,
      email: qbCompany.Email?.Address,
      webAddr: qbCompany.WebAddr?.URI,
      fiscalYearStartMonth: qbCompany.FiscalYearStartMonth,
      taxForm: qbCompany.TaxForm,
      taxIdentifier: qbCompany.TaxIdentifier,
      country: qbCompany.Country,
      supportedLanguages: qbCompany.SupportedLanguages,
      nameValue: qbCompany.NameValue,
      domain: qbCompany.domain,
      metaData: qbCompany.MetaData
    };
  }

  protected customValidateEntity(entity: any): string[] {
    const errors: string[] = [];

    if (!entity.Name) {
      errors.push('Company name is required');
    }

    if (!entity.CompanyAddr && !entity.LegalAddr) {
      errors.push('Company must have at least one address');
    }

    return errors;
  }

  /**
   * Get company information summary
   */
  async getCompanySummary(): Promise<any> {
    try {
      const companyInfo = await this.apiClient.getCompanyInfo(this.realmId);

      if (companyInfo?.QueryResponse?.CompanyInfo?.[0]) {
        const company = companyInfo.QueryResponse.CompanyInfo[0];
        return this.mapToLocalEntity(company);
      }

      return null;
    } catch (error) {
      console.error('Error getting company summary:', error);
      throw error;
    }
  }

  /**
   * Check if company info has changed since last sync
   */
  async hasCompanyInfoChanged(): Promise<boolean> {
    try {
      const lastSyncDate = await this.getLastSyncDate();
      if (!lastSyncDate) return true;

      const companyInfo = await this.apiClient.getCompanyInfo(this.realmId);

      if (companyInfo?.QueryResponse?.CompanyInfo?.[0]) {
        const company = companyInfo.QueryResponse.CompanyInfo[0];
        return this.shouldSyncEntity(company, lastSyncDate);
      }

      return false;
    } catch (error) {
      console.error('Error checking company info changes:', error);
      return true; // Assume changed if we can't determine
    }
  }
}