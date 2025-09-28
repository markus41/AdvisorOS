import { prisma } from '@/packages/database';
import { BaseSyncService, SyncResult, SyncOptions } from './base-sync';

interface ReportOptions {
  startDate?: string;
  endDate?: string;
  asOfDate?: string;
  periodBasis?: 'Accrual' | 'Cash';
}

export class ReportsSyncService extends BaseSyncService {
  getEntityType(): string {
    return 'reports';
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
      console.log(`Starting reports sync for organization ${this.organizationId}`);

      // Define which reports to sync
      const reportsToSync = [
        'ProfitAndLoss',
        'BalanceSheet',
        'CashFlow'
      ];

      result.recordsProcessed = reportsToSync.length;

      // Set default date ranges (current fiscal year)
      const currentYear = new Date().getFullYear();
      const defaultOptions: ReportOptions = {
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        asOfDate: new Date().toISOString().split('T')[0],
        periodBasis: 'Accrual'
      };

      for (const reportType of reportsToSync) {
        try {
          await this.syncReport(reportType, defaultOptions);
          result.recordsSuccess++;
        } catch (error) {
          result.recordsFailed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync ${reportType} report: ${errorMessage}`);
          console.error(`${reportType} report sync error:`, error);
        }
      }

      result.success = result.recordsFailed === 0;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Reports sync failed: ${errorMessage}`);
      console.error('Reports sync error:', error);
      return result;
    }
  }

  private async syncReport(reportType: string, options: ReportOptions): Promise<void> {
    console.log(`Syncing ${reportType} report...`);

    let reportData: any;

    switch (reportType) {
      case 'ProfitAndLoss':
        reportData = await this.apiClient.getProfitLossReport(
          this.realmId,
          options.startDate,
          options.endDate
        );
        break;
      case 'BalanceSheet':
        reportData = await this.apiClient.getBalanceSheetReport(
          this.realmId,
          options.asOfDate
        );
        break;
      case 'CashFlow':
        reportData = await this.apiClient.getCashFlowReport(
          this.realmId,
          options.startDate,
          options.endDate
        );
        break;
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    if (!reportData) {
      throw new Error(`No data received for ${reportType} report`);
    }

    // Store the report data
    await this.storeReportData(reportType, reportData, options);

    console.log(`Successfully synced ${reportType} report`);
  }

  private async storeReportData(reportType: string, reportData: any, options: ReportOptions): Promise<void> {
    // Create a report record in the database
    await prisma.report.create({
      data: {
        name: `QuickBooks ${reportType} Report`,
        description: `Automatically synced ${reportType} report from QuickBooks`,
        reportType: reportType.toLowerCase(),
        format: 'json',
        status: 'completed',
        data: reportData,
        parameters: options,
        metadata: {
          source: 'quickbooks',
          syncDate: new Date().toISOString(),
          realmId: this.realmId
        },
        organizationId: this.organizationId,
        createdById: 'system', // This should be set to the user who triggered the sync
        generatedAt: new Date()
      }
    });
  }

  protected mapToLocalEntity(qbReport: any): any {
    // Reports don't need mapping like other entities
    // They are stored as-is from QuickBooks
    return qbReport;
  }

  protected customValidateEntity(entity: any): string[] {
    const errors: string[] = [];

    if (!entity) {
      errors.push('Report data is empty');
    }

    return errors;
  }

  /**
   * Get Profit & Loss report with custom date range
   */
  async getProfitLossReport(startDate?: string, endDate?: string): Promise<any> {
    try {
      const reportData = await this.apiClient.getProfitLossReport(this.realmId, startDate, endDate);
      return this.parseReportData(reportData, 'ProfitAndLoss');
    } catch (error) {
      console.error('Error getting Profit & Loss report:', error);
      throw error;
    }
  }

  /**
   * Get Balance Sheet report
   */
  async getBalanceSheetReport(asOfDate?: string): Promise<any> {
    try {
      const reportData = await this.apiClient.getBalanceSheetReport(this.realmId, asOfDate);
      return this.parseReportData(reportData, 'BalanceSheet');
    } catch (error) {
      console.error('Error getting Balance Sheet report:', error);
      throw error;
    }
  }

  /**
   * Get Cash Flow report
   */
  async getCashFlowReport(startDate?: string, endDate?: string): Promise<any> {
    try {
      const reportData = await this.apiClient.getCashFlowReport(this.realmId, startDate, endDate);
      return this.parseReportData(reportData, 'CashFlow');
    } catch (error) {
      console.error('Error getting Cash Flow report:', error);
      throw error;
    }
  }

  /**
   * Parse and normalize report data
   */
  private parseReportData(reportData: any, reportType: string): any {
    if (!reportData?.QueryResponse) {
      throw new Error('Invalid report data format');
    }

    const report = reportData.QueryResponse;

    return {
      reportType,
      header: report.Header,
      columns: report.Columns,
      rows: report.Rows,
      summary: this.extractReportSummary(report, reportType),
      metadata: {
        generatedTime: new Date().toISOString(),
        currency: report.Header?.Currency,
        startPeriod: report.Header?.StartPeriod,
        endPeriod: report.Header?.EndPeriod,
        reportBasis: report.Header?.ReportBasis
      }
    };
  }

  /**
   * Extract key metrics from report data
   */
  private extractReportSummary(report: any, reportType: string): any {
    const summary: any = {};

    try {
      switch (reportType) {
        case 'ProfitAndLoss':
          summary.totalRevenue = this.findRowValue(report.Rows, 'Total Income') || 0;
          summary.totalExpenses = this.findRowValue(report.Rows, 'Total Expenses') || 0;
          summary.netIncome = this.findRowValue(report.Rows, 'Net Income') || 0;
          break;

        case 'BalanceSheet':
          summary.totalAssets = this.findRowValue(report.Rows, 'Total Assets') || 0;
          summary.totalLiabilities = this.findRowValue(report.Rows, 'Total Liabilities') || 0;
          summary.totalEquity = this.findRowValue(report.Rows, 'Total Equity') || 0;
          break;

        case 'CashFlow':
          summary.netCashFlow = this.findRowValue(report.Rows, 'Net Cash Increase for Period') || 0;
          summary.operatingActivities = this.findRowValue(report.Rows, 'Net Cash Provided by Operating Activities') || 0;
          summary.investingActivities = this.findRowValue(report.Rows, 'Net Cash Provided by Investing Activities') || 0;
          summary.financingActivities = this.findRowValue(report.Rows, 'Net Cash Provided by Financing Activities') || 0;
          break;
      }
    } catch (error) {
      console.warn('Error extracting report summary:', error);
    }

    return summary;
  }

  /**
   * Find a specific row value in report data
   */
  private findRowValue(rows: any[], searchText: string): number | null {
    for (const row of rows || []) {
      if (row.group) {
        const result = this.findRowValue(row.group, searchText);
        if (result !== null) return result;
      }

      if (row.Rows) {
        const result = this.findRowValue(row.Rows, searchText);
        if (result !== null) return result;
      }

      if (row.ColData && row.ColData[0]?.value) {
        if (row.ColData[0].value.includes(searchText)) {
          // Look for the amount in the last column
          const lastCol = row.ColData[row.ColData.length - 1];
          if (lastCol?.value) {
            const value = parseFloat(lastCol.value.replace(/[^0-9.-]+/g, ''));
            if (!isNaN(value)) return value;
          }
        }
      }
    }

    return null;
  }

  /**
   * Get financial summary across all reports
   */
  async getFinancialSummary(): Promise<any> {
    try {
      const [profitLoss, balanceSheet, cashFlow] = await Promise.all([
        this.getProfitLossReport(),
        this.getBalanceSheetReport(),
        this.getCashFlowReport()
      ]);

      return {
        profitLoss: profitLoss.summary,
        balanceSheet: balanceSheet.summary,
        cashFlow: cashFlow.summary,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }

  /**
   * Get month-over-month comparison
   */
  async getMonthlyComparison(months = 6): Promise<any> {
    try {
      const comparisons = [];
      const today = new Date();

      for (let i = 0; i < months; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const startDate = date.toISOString().split('T')[0];
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

        const report = await this.getProfitLossReport(startDate, endDate);

        comparisons.push({
          month: date.toISOString().slice(0, 7), // YYYY-MM format
          ...report.summary
        });
      }

      return comparisons.reverse(); // Return chronological order
    } catch (error) {
      console.error('Error getting monthly comparison:', error);
      throw error;
    }
  }

  /**
   * Get year-over-year comparison
   */
  async getYearlyComparison(years = 3): Promise<any> {
    try {
      const comparisons = [];
      const currentYear = new Date().getFullYear();

      for (let i = 0; i < years; i++) {
        const year = currentYear - i;
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const report = await this.getProfitLossReport(startDate, endDate);

        comparisons.push({
          year,
          ...report.summary
        });
      }

      return comparisons.reverse(); // Return chronological order
    } catch (error) {
      console.error('Error getting yearly comparison:', error);
      throw error;
    }
  }
}