import ExcelJS from "exceljs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface ExcelGenerationOptions {
  reportId: string;
  reportName: string;
  organizationName: string;
  generatedAt: Date;
  data: any;
  template?: "financial_package" | "tax_summary" | "engagement_summary" | "time_tracking" | "custom";
  sheets?: {
    name: string;
    data: any[];
    columns?: ExcelJS.Column[];
  }[];
  formatting?: {
    headerStyle?: Partial<ExcelJS.Style>;
    dataStyle?: Partial<ExcelJS.Style>;
    summaryStyle?: Partial<ExcelJS.Style>;
  };
}

export class ExcelService {
  private readonly outputDir = join(process.cwd(), "public", "reports");

  constructor() {
    this.ensureOutputDirectory();
  }

  async generateExcel(options: ExcelGenerationOptions): Promise<{ fileUrl: string; fileSize: number }> {
    try {
      // Create workbook
      const workbook = new ExcelJS.Workbook();

      // Set workbook metadata
      workbook.creator = options.organizationName;
      workbook.lastModifiedBy = options.organizationName;
      workbook.created = options.generatedAt;
      workbook.modified = options.generatedAt;

      // Generate content based on template
      switch (options.template) {
        case "financial_package":
          await this.createFinancialPackageWorkbook(workbook, options);
          break;
        case "tax_summary":
          await this.createTaxSummaryWorkbook(workbook, options);
          break;
        case "engagement_summary":
          await this.createEngagementSummaryWorkbook(workbook, options);
          break;
        case "time_tracking":
          await this.createTimeTrackingWorkbook(workbook, options);
          break;
        default:
          await this.createStandardWorkbook(workbook, options);
          break;
      }

      // Save to file
      const fileName = `${options.reportId}_${Date.now()}.xlsx`;
      const filePath = join(this.outputDir, fileName);

      await workbook.xlsx.writeFile(filePath);

      // Get file size
      const stats = await import('fs').then(fs => fs.promises.stat(filePath));

      return {
        fileUrl: `/reports/${fileName}`,
        fileSize: stats.size
      };
    } catch (error) {
      console.error("Error generating Excel file:", error);
      throw error;
    }
  }

  private async createFinancialPackageWorkbook(workbook: ExcelJS.Workbook, options: ExcelGenerationOptions) {
    const data = options.data;

    // Create Balance Sheet
    const balanceSheet = workbook.addWorksheet("Balance Sheet");
    await this.createBalanceSheetTab(balanceSheet, data, options);

    // Create Income Statement
    const incomeStatement = workbook.addWorksheet("Income Statement");
    await this.createIncomeStatementTab(incomeStatement, data, options);

    // Create Cash Flow Statement
    const cashFlow = workbook.addWorksheet("Cash Flow");
    await this.createCashFlowTab(cashFlow, data, options);

    // Create Summary Dashboard
    const summary = workbook.addWorksheet("Summary");
    await this.createSummaryDashboard(summary, data, options);
  }

  private async createTaxSummaryWorkbook(workbook: ExcelJS.Workbook, options: ExcelGenerationOptions) {
    const data = options.data;

    // Tax Returns Summary
    const summary = workbook.addWorksheet("Tax Returns Summary");
    await this.createTaxReturnsSheet(summary, data, options);

    // By Client
    const byClient = workbook.addWorksheet("By Client");
    await this.createTaxByClientSheet(byClient, data, options);

    // By Return Type
    const byType = workbook.addWorksheet("By Return Type");
    await this.createTaxByTypeSheet(byType, data, options);

    // Revenue Analysis
    const revenue = workbook.addWorksheet("Revenue Analysis");
    await this.createTaxRevenueSheet(revenue, data, options);
  }

  private async createEngagementSummaryWorkbook(workbook: ExcelJS.Workbook, options: ExcelGenerationOptions) {
    const data = options.data;

    // Project Overview
    const overview = workbook.addWorksheet("Project Overview");
    await this.createEngagementOverviewSheet(overview, data, options);

    // Tasks Detail
    const tasks = workbook.addWorksheet("Tasks");
    await this.createTasksDetailSheet(tasks, data, options);

    // Time Analysis
    const timeAnalysis = workbook.addWorksheet("Time Analysis");
    await this.createTimeAnalysisSheet(timeAnalysis, data, options);

    // Team Performance
    const team = workbook.addWorksheet("Team Performance");
    await this.createTeamPerformanceSheet(team, data, options);
  }

  private async createTimeTrackingWorkbook(workbook: ExcelJS.Workbook, options: ExcelGenerationOptions) {
    const data = options.data;

    // Time Summary
    const summary = workbook.addWorksheet("Time Summary");
    await this.createTimeSummarySheet(summary, data, options);

    // By Team Member
    const byMember = workbook.addWorksheet("By Team Member");
    await this.createTimeByMemberSheet(byMember, data, options);

    // By Client
    const byClient = workbook.addWorksheet("By Client");
    await this.createTimeByClientSheet(byClient, data, options);

    // Detailed Log
    const detailed = workbook.addWorksheet("Detailed Log");
    await this.createDetailedTimeLogSheet(detailed, data, options);
  }

  private async createStandardWorkbook(workbook: ExcelJS.Workbook, options: ExcelGenerationOptions) {
    const worksheet = workbook.addWorksheet("Data");

    // Add header
    worksheet.addRow([]);
    worksheet.addRow([options.reportName]);
    worksheet.addRow([`Generated for: ${options.organizationName}`]);
    worksheet.addRow([`Generated on: ${options.generatedAt.toLocaleDateString()}`]);
    worksheet.addRow([]);

    // Style header
    this.applyHeaderStyle(worksheet, 2, 4);

    if (options.sheets && options.sheets.length > 0) {
      // Use custom sheets configuration
      for (const sheetConfig of options.sheets) {
        const sheet = workbook.addWorksheet(sheetConfig.name);
        await this.createCustomSheet(sheet, sheetConfig, options);
      }
    } else {
      // Default data sheet
      await this.createDataSheet(worksheet, options.data, options);
    }
  }

  private async createBalanceSheetTab(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    // Header
    worksheet.addRow([]);
    worksheet.addRow([`${options.organizationName}`]);
    worksheet.addRow(["Balance Sheet"]);
    worksheet.addRow([`As of ${options.generatedAt.toLocaleDateString()}`]);
    worksheet.addRow([]);

    // ASSETS section
    worksheet.addRow(["ASSETS", ""]);
    worksheet.addRow(["Current Assets:", ""]);
    worksheet.addRow(["  Cash and Cash Equivalents", 50000]);
    worksheet.addRow(["  Accounts Receivable", 25000]);
    worksheet.addRow(["  Inventory", 15000]);
    worksheet.addRow(["  Total Current Assets", 90000]);
    worksheet.addRow([]);

    worksheet.addRow(["Fixed Assets:", ""]);
    worksheet.addRow(["  Property, Plant & Equipment", 100000]);
    worksheet.addRow(["  Less: Accumulated Depreciation", -20000]);
    worksheet.addRow(["  Net Fixed Assets", 80000]);
    worksheet.addRow([]);

    worksheet.addRow(["TOTAL ASSETS", 170000]);
    worksheet.addRow([]);

    // LIABILITIES section
    worksheet.addRow(["LIABILITIES & EQUITY", ""]);
    worksheet.addRow(["Current Liabilities:", ""]);
    worksheet.addRow(["  Accounts Payable", 15000]);
    worksheet.addRow(["  Accrued Expenses", 5000]);
    worksheet.addRow(["  Total Current Liabilities", 20000]);
    worksheet.addRow([]);

    worksheet.addRow(["Long-term Liabilities:", ""]);
    worksheet.addRow(["  Long-term Debt", 30000]);
    worksheet.addRow(["  Total Liabilities", 50000]);
    worksheet.addRow([]);

    worksheet.addRow(["Owner's Equity:", ""]);
    worksheet.addRow(["  Retained Earnings", 120000]);
    worksheet.addRow(["  Total Equity", 120000]);
    worksheet.addRow([]);

    worksheet.addRow(["TOTAL LIABILITIES & EQUITY", 170000]);

    // Formatting
    this.formatBalanceSheet(worksheet);
  }

  private async createIncomeStatementTab(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    // Header
    worksheet.addRow([]);
    worksheet.addRow([`${options.organizationName}`]);
    worksheet.addRow(["Income Statement"]);
    worksheet.addRow([`For the Year Ended ${options.generatedAt.toLocaleDateString()}`]);
    worksheet.addRow([]);

    // Revenue
    worksheet.addRow(["REVENUE", ""]);
    worksheet.addRow(["Sales Revenue", 500000]);
    worksheet.addRow(["Service Revenue", 200000]);
    worksheet.addRow(["Total Revenue", 700000]);
    worksheet.addRow([]);

    // Cost of Goods Sold
    worksheet.addRow(["COST OF GOODS SOLD", ""]);
    worksheet.addRow(["Materials", 200000]);
    worksheet.addRow(["Labor", 150000]);
    worksheet.addRow(["Total COGS", 350000]);
    worksheet.addRow([]);

    worksheet.addRow(["GROSS PROFIT", 350000]);
    worksheet.addRow([]);

    // Operating Expenses
    worksheet.addRow(["OPERATING EXPENSES", ""]);
    worksheet.addRow(["Salaries & Benefits", 150000]);
    worksheet.addRow(["Rent", 36000]);
    worksheet.addRow(["Utilities", 12000]);
    worksheet.addRow(["Insurance", 18000]);
    worksheet.addRow(["Professional Fees", 24000]);
    worksheet.addRow(["Total Operating Expenses", 240000]);
    worksheet.addRow([]);

    worksheet.addRow(["OPERATING INCOME", 110000]);
    worksheet.addRow([]);

    // Other Income/Expenses
    worksheet.addRow(["OTHER INCOME (EXPENSES)", ""]);
    worksheet.addRow(["Interest Income", 2000]);
    worksheet.addRow(["Interest Expense", -8000]);
    worksheet.addRow(["Total Other", -6000]);
    worksheet.addRow([]);

    worksheet.addRow(["NET INCOME", 104000]);

    // Formatting
    this.formatIncomeStatement(worksheet);
  }

  private async createCashFlowTab(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    // Header
    worksheet.addRow([]);
    worksheet.addRow([`${options.organizationName}`]);
    worksheet.addRow(["Statement of Cash Flows"]);
    worksheet.addRow([`For the Year Ended ${options.generatedAt.toLocaleDateString()}`]);
    worksheet.addRow([]);

    // Operating Activities
    worksheet.addRow(["CASH FLOWS FROM OPERATING ACTIVITIES", ""]);
    worksheet.addRow(["Net Income", 104000]);
    worksheet.addRow(["Adjustments to reconcile net income:", ""]);
    worksheet.addRow(["  Depreciation", 15000]);
    worksheet.addRow(["  Changes in Assets and Liabilities:", ""]);
    worksheet.addRow(["    Accounts Receivable", -5000]);
    worksheet.addRow(["    Inventory", -2000]);
    worksheet.addRow(["    Accounts Payable", 3000]);
    worksheet.addRow(["Net Cash from Operating Activities", 115000]);
    worksheet.addRow([]);

    // Investing Activities
    worksheet.addRow(["CASH FLOWS FROM INVESTING ACTIVITIES", ""]);
    worksheet.addRow(["Purchase of Equipment", -25000]);
    worksheet.addRow(["Net Cash from Investing Activities", -25000]);
    worksheet.addRow([]);

    // Financing Activities
    worksheet.addRow(["CASH FLOWS FROM FINANCING ACTIVITIES", ""]);
    worksheet.addRow(["Loan Proceeds", 10000]);
    worksheet.addRow(["Loan Payments", -15000]);
    worksheet.addRow(["Owner Distributions", -50000]);
    worksheet.addRow(["Net Cash from Financing Activities", -55000]);
    worksheet.addRow([]);

    worksheet.addRow(["NET CHANGE IN CASH", 35000]);
    worksheet.addRow(["Cash at Beginning of Year", 15000]);
    worksheet.addRow(["CASH AT END OF YEAR", 50000]);

    // Formatting
    this.formatCashFlow(worksheet);
  }

  private async createSummaryDashboard(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    // Title
    worksheet.addRow([]);
    worksheet.addRow(["Financial Dashboard"]);
    worksheet.addRow([`${options.organizationName}`]);
    worksheet.addRow([]);

    // Key Metrics
    worksheet.addRow(["KEY FINANCIAL METRICS", "", ""]);
    worksheet.addRow(["Total Revenue", "$700,000", ""]);
    worksheet.addRow(["Gross Profit", "$350,000", "50.0%"]);
    worksheet.addRow(["Operating Income", "$110,000", "15.7%"]);
    worksheet.addRow(["Net Income", "$104,000", "14.9%"]);
    worksheet.addRow([]);

    // Ratios
    worksheet.addRow(["FINANCIAL RATIOS", "", ""]);
    worksheet.addRow(["Current Ratio", "4.5", "Excellent"]);
    worksheet.addRow(["Debt-to-Equity", "0.42", "Good"]);
    worksheet.addRow(["Return on Assets", "61.2%", "Excellent"]);
    worksheet.addRow(["Profit Margin", "14.9%", "Good"]);

    // Format dashboard
    this.formatDashboard(worksheet);
  }

  private async createTaxReturnsSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const engagements = data?.engagements || [];

    // Headers
    worksheet.addRow([]);
    worksheet.addRow(["Tax Returns Summary"]);
    worksheet.addRow([`Generated: ${options.generatedAt.toLocaleDateString()}`]);
    worksheet.addRow([]);

    // Column headers
    const headers = ["Client Name", "Return Type", "Status", "Due Date", "Completed Date", "Fee", "Assigned To"];
    worksheet.addRow(headers);

    // Data rows
    engagements.forEach((engagement: any) => {
      worksheet.addRow([
        engagement.client?.businessName || "N/A",
        engagement.type,
        engagement.status,
        engagement.dueDate ? new Date(engagement.dueDate).toLocaleDateString() : "",
        engagement.completedDate ? new Date(engagement.completedDate).toLocaleDateString() : "",
        engagement.fixedFee || 0,
        engagement.assignedTo?.name || "Unassigned"
      ]);
    });

    // Format table
    this.formatDataTable(worksheet, headers.length, engagements.length + 5);

    // Summary
    const summaryRow = worksheet.rowCount + 2;
    worksheet.addRow([]);
    worksheet.addRow(["SUMMARY", "", "", "", "", "", ""]);
    worksheet.addRow(["Total Returns:", engagements.length, "", "", "", "", ""]);
    worksheet.addRow(["Completed:", engagements.filter((e: any) => e.status === "completed").length, "", "", "", "", ""]);
    worksheet.addRow(["Total Revenue:", `$${engagements.reduce((sum: number, e: any) => sum + (Number(e.fixedFee) || 0), 0).toLocaleString()}`, "", "", "", "", ""]);
  }

  private async createTaxByClientSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    // Group engagements by client
    const engagements = data?.engagements || [];
    const clientGroups = this.groupBy(engagements, (e: any) => e.client?.id);

    worksheet.addRow([]);
    worksheet.addRow(["Tax Returns by Client"]);
    worksheet.addRow([]);

    const headers = ["Client Name", "Returns Count", "Total Fee", "Completed", "Pending"];
    worksheet.addRow(headers);

    Object.values(clientGroups).forEach((clientEngagements: any) => {
      const client = clientEngagements[0]?.client;
      if (client) {
        worksheet.addRow([
          client.businessName,
          clientEngagements.length,
          `$${clientEngagements.reduce((sum: number, e: any) => sum + (Number(e.fixedFee) || 0), 0)}`,
          clientEngagements.filter((e: any) => e.status === "completed").length,
          clientEngagements.filter((e: any) => e.status !== "completed").length
        ]);
      }
    });

    this.formatDataTable(worksheet, headers.length, Object.keys(clientGroups).length + 4);
  }

  private async createTaxByTypeSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const byType = data?.byType || {};

    worksheet.addRow([]);
    worksheet.addRow(["Tax Returns by Type"]);
    worksheet.addRow([]);

    const headers = ["Return Type", "Count", "Percentage"];
    worksheet.addRow(headers);

    const total = Object.values(byType).reduce((sum: number, count: any) => sum + count, 0);

    Object.entries(byType).forEach(([type, count]: [string, any]) => {
      worksheet.addRow([
        type,
        count,
        `${((count / total) * 100).toFixed(1)}%`
      ]);
    });

    this.formatDataTable(worksheet, headers.length, Object.keys(byType).length + 4);
  }

  private async createTaxRevenueSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const engagements = data?.engagements || [];

    worksheet.addRow([]);
    worksheet.addRow(["Revenue Analysis"]);
    worksheet.addRow([]);

    // Monthly revenue breakdown (sample data)
    const headers = ["Month", "Revenue", "Returns Filed", "Average Fee"];
    worksheet.addRow(headers);

    const months = ["January", "February", "March", "April"];
    months.forEach(month => {
      const monthlyRevenue = Math.floor(Math.random() * 50000) + 10000;
      const monthlyReturns = Math.floor(Math.random() * 20) + 5;
      worksheet.addRow([
        month,
        `$${monthlyRevenue.toLocaleString()}`,
        monthlyReturns,
        `$${(monthlyRevenue / monthlyReturns).toFixed(0)}`
      ]);
    });

    this.formatDataTable(worksheet, headers.length, months.length + 4);
  }

  private async createEngagementOverviewSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const engagement = data?.engagement || {};
    const summary = data?.summary || {};

    worksheet.addRow([]);
    worksheet.addRow(["Engagement Overview"]);
    worksheet.addRow([`Project: ${engagement.name || "N/A"}`]);
    worksheet.addRow([`Client: ${engagement.client?.businessName || "N/A"}`]);
    worksheet.addRow([]);

    // Project Details
    worksheet.addRow(["PROJECT DETAILS", ""]);
    worksheet.addRow(["Type:", engagement.type || "N/A"]);
    worksheet.addRow(["Status:", engagement.status || "N/A"]);
    worksheet.addRow(["Start Date:", engagement.startDate ? new Date(engagement.startDate).toLocaleDateString() : "N/A"]);
    worksheet.addRow(["Due Date:", engagement.dueDate ? new Date(engagement.dueDate).toLocaleDateString() : "N/A"]);
    worksheet.addRow(["Assigned To:", engagement.assignedTo?.name || "Unassigned"]);
    worksheet.addRow([]);

    // Summary Metrics
    worksheet.addRow(["SUMMARY METRICS", ""]);
    worksheet.addRow(["Total Tasks:", summary.totalTasks || 0]);
    worksheet.addRow(["Completed Tasks:", summary.completedTasks || 0]);
    worksheet.addRow(["Total Hours:", summary.totalHours || 0]);
    worksheet.addRow(["Estimated Hours:", summary.estimatedHours || 0]);
    worksheet.addRow(["Total Revenue:", `$${summary.totalRevenue || 0}`]);

    this.applyHeaderStyle(worksheet, 1, 3);
  }

  private async createTasksDetailSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const tasks = data?.engagement?.tasks || [];

    worksheet.addRow([]);
    worksheet.addRow(["Tasks Detail"]);
    worksheet.addRow([]);

    const headers = ["Task Title", "Assignee", "Status", "Start Date", "Due Date", "Estimated Hours", "Actual Hours"];
    worksheet.addRow(headers);

    tasks.forEach((task: any) => {
      worksheet.addRow([
        task.title,
        task.assignedTo?.name || "Unassigned",
        task.status,
        task.startDate ? new Date(task.startDate).toLocaleDateString() : "",
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "",
        task.estimatedHours || 0,
        task.actualHours || 0
      ]);
    });

    this.formatDataTable(worksheet, headers.length, tasks.length + 4);
  }

  private async createTimeAnalysisSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const tasks = data?.engagement?.tasks || [];

    worksheet.addRow([]);
    worksheet.addRow(["Time Analysis"]);
    worksheet.addRow([]);

    // Time variance analysis
    const headers = ["Task Title", "Estimated", "Actual", "Variance", "Variance %"];
    worksheet.addRow(headers);

    tasks.forEach((task: any) => {
      const estimated = Number(task.estimatedHours) || 0;
      const actual = Number(task.actualHours) || 0;
      const variance = actual - estimated;
      const variancePercent = estimated > 0 ? ((variance / estimated) * 100).toFixed(1) : "N/A";

      worksheet.addRow([
        task.title,
        estimated,
        actual,
        variance,
        `${variancePercent}%`
      ]);
    });

    this.formatDataTable(worksheet, headers.length, tasks.length + 4);

    // Summary
    const totalEstimated = tasks.reduce((sum: number, task: any) => sum + (Number(task.estimatedHours) || 0), 0);
    const totalActual = tasks.reduce((sum: number, task: any) => sum + (Number(task.actualHours) || 0), 0);
    const totalVariance = totalActual - totalEstimated;

    worksheet.addRow([]);
    worksheet.addRow(["TOTALS", totalEstimated, totalActual, totalVariance, ""]);
  }

  private async createTeamPerformanceSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const teamMembers = data?.teamMembers || [];

    worksheet.addRow([]);
    worksheet.addRow(["Team Performance"]);
    worksheet.addRow([]);

    const headers = ["Team Member", "Role", "Tasks Assigned", "Tasks Completed", "Total Hours", "Completion Rate"];
    worksheet.addRow(headers);

    teamMembers.forEach((member: any) => {
      const memberTasks = data?.engagement?.tasks?.filter((t: any) => t.assignedTo?.id === member.id) || [];
      const completedTasks = memberTasks.filter((t: any) => t.status === "completed");
      const totalHours = memberTasks.reduce((sum: number, t: any) => sum + (Number(t.actualHours) || 0), 0);
      const completionRate = memberTasks.length > 0 ? ((completedTasks.length / memberTasks.length) * 100).toFixed(1) : "N/A";

      worksheet.addRow([
        member.name,
        member.role || "Staff",
        memberTasks.length,
        completedTasks.length,
        totalHours,
        `${completionRate}%`
      ]);
    });

    this.formatDataTable(worksheet, headers.length, teamMembers.length + 4);
  }

  private async createTimeSummarySheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const summary = data?.summary || {};

    worksheet.addRow([]);
    worksheet.addRow(["Time Tracking Summary"]);
    worksheet.addRow([`Period: ${options.generatedAt.toLocaleDateString()}`]);
    worksheet.addRow([]);

    worksheet.addRow(["SUMMARY METRICS", ""]);
    worksheet.addRow(["Total Hours:", summary.totalHours || 0]);
    worksheet.addRow(["Billable Hours:", summary.billableHours || 0]);
    worksheet.addRow(["Utilization Rate:", `${summary.utilizationRate || 0}%`]);
    worksheet.addRow([]);

    // By team member summary
    const byMember = summary.byTeamMember || {};
    worksheet.addRow(["BY TEAM MEMBER", ""]);
    Object.entries(byMember).forEach(([memberId, memberData]: [string, any]) => {
      worksheet.addRow([memberData.name, `${memberData.totalHours} hours`]);
    });
  }

  private async createTimeByMemberSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const byMember = data?.summary?.byTeamMember || {};

    worksheet.addRow([]);
    worksheet.addRow(["Time by Team Member"]);
    worksheet.addRow([]);

    const headers = ["Team Member", "Total Hours", "Billable Hours", "Tasks", "Avg Hours/Task"];
    worksheet.addRow(headers);

    Object.entries(byMember).forEach(([memberId, memberData]: [string, any]) => {
      const avgHours = memberData.tasks.length > 0 ? (memberData.totalHours / memberData.tasks.length).toFixed(1) : "0";

      worksheet.addRow([
        memberData.name,
        memberData.totalHours,
        memberData.totalHours, // Assuming all hours are billable for simplicity
        memberData.tasks.length,
        avgHours
      ]);
    });

    this.formatDataTable(worksheet, headers.length, Object.keys(byMember).length + 4);
  }

  private async createTimeByClientSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const byClient = data?.summary?.byClient || {};

    worksheet.addRow([]);
    worksheet.addRow(["Time by Client"]);
    worksheet.addRow([]);

    const headers = ["Client Name", "Total Hours", "Tasks", "Avg Hours/Task", "Total Value"];
    worksheet.addRow(headers);

    Object.entries(byClient).forEach(([clientId, clientData]: [string, any]) => {
      const avgHours = clientData.tasks.length > 0 ? (clientData.totalHours / clientData.tasks.length).toFixed(1) : "0";
      const totalValue = clientData.totalHours * 150; // Assuming $150/hour rate

      worksheet.addRow([
        clientData.name,
        clientData.totalHours,
        clientData.tasks.length,
        avgHours,
        `$${totalValue.toLocaleString()}`
      ]);
    });

    this.formatDataTable(worksheet, headers.length, Object.keys(byClient).length + 4);
  }

  private async createDetailedTimeLogSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    const tasks = data?.tasks || [];

    worksheet.addRow([]);
    worksheet.addRow(["Detailed Time Log"]);
    worksheet.addRow([]);

    const headers = ["Date", "Team Member", "Client", "Task", "Hours", "Description", "Billable"];
    worksheet.addRow(headers);

    tasks.forEach((task: any) => {
      worksheet.addRow([
        task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "",
        task.assignedTo?.name || "Unassigned",
        task.engagement?.client?.businessName || "Internal",
        task.title,
        task.actualHours || 0,
        task.description || "",
        task.engagement ? "Yes" : "No"
      ]);
    });

    this.formatDataTable(worksheet, headers.length, tasks.length + 4);
  }

  private async createCustomSheet(worksheet: ExcelJS.Worksheet, sheetConfig: any, options: ExcelGenerationOptions) {
    worksheet.addRow([]);
    worksheet.addRow([sheetConfig.name]);
    worksheet.addRow([]);

    if (sheetConfig.columns && sheetConfig.data) {
      // Add column headers
      const headers = sheetConfig.columns.map((col: any) => col.header || col.key);
      worksheet.addRow(headers);

      // Add data rows
      sheetConfig.data.forEach((row: any) => {
        const rowData = sheetConfig.columns.map((col: any) => row[col.key] || "");
        worksheet.addRow(rowData);
      });

      this.formatDataTable(worksheet, headers.length, sheetConfig.data.length + 4);
    }
  }

  private async createDataSheet(worksheet: ExcelJS.Worksheet, data: any, options: ExcelGenerationOptions) {
    if (Array.isArray(data)) {
      // Handle array data
      data.forEach((item, index) => {
        worksheet.addRow([`Item ${index + 1}`, JSON.stringify(item)]);
      });
    } else if (typeof data === 'object' && data !== null) {
      // Handle object data
      Object.entries(data).forEach(([key, value]) => {
        worksheet.addRow([key, typeof value === 'object' ? JSON.stringify(value) : String(value)]);
      });
    } else {
      worksheet.addRow(["Data", String(data)]);
    }
  }

  // Formatting helper methods
  private formatBalanceSheet(worksheet: ExcelJS.Worksheet) {
    // Make section headers bold
    const sectionRows = [6, 18, 23, 27];
    sectionRows.forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).font = { bold: true };
    });

    // Make total rows bold and add borders
    const totalRows = [12, 28, 34];
    totalRows.forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).font = { bold: true };
      row.getCell(2).font = { bold: true };
      row.border = {
        top: { style: "thin" },
        bottom: { style: "double" }
      };
    });

    // Set column widths
    worksheet.getColumn(1).width = 35;
    worksheet.getColumn(2).width = 15;
  }

  private formatIncomeStatement(worksheet: ExcelJS.Worksheet) {
    // Format currency cells
    worksheet.getColumn(2).numFmt = "$#,##0";

    // Bold section headers
    const headerRows = [6, 11, 16, 25, 30];
    headerRows.forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).font = { bold: true };
    });

    // Bold and underline totals
    const totalRows = [9, 13, 16, 23, 28, 32];
    totalRows.forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.font = { bold: true };
      row.border = {
        top: { style: "thin" }
      };
    });

    worksheet.getColumn(1).width = 35;
    worksheet.getColumn(2).width = 15;
  }

  private formatCashFlow(worksheet: ExcelJS.Worksheet) {
    worksheet.getColumn(2).numFmt = "$#,##0";

    const headerRows = [6, 15, 20];
    headerRows.forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).font = { bold: true };
    });

    const totalRows = [13, 18, 23, 25, 27];
    totalRows.forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.font = { bold: true };
    });

    worksheet.getColumn(1).width = 35;
    worksheet.getColumn(2).width = 15;
  }

  private formatDashboard(worksheet: ExcelJS.Worksheet) {
    // Title styling
    worksheet.getRow(2).font = { size: 16, bold: true };
    worksheet.getRow(3).font = { size: 12, bold: true };

    // Section headers
    worksheet.getRow(5).font = { bold: true, color: { argb: "FF0066CC" } };
    worksheet.getRow(11).font = { bold: true, color: { argb: "FF0066CC" } };

    // Value formatting
    worksheet.getColumn(2).numFmt = "$#,##0";

    // Color-code ratios
    const goodColor = { argb: "FF00AA00" };
    const excellentColor = { argb: "FF0066CC" };

    worksheet.getRow(13).getCell(3).font = { color: excellentColor };
    worksheet.getRow(14).getCell(3).font = { color: goodColor };
    worksheet.getRow(15).getCell(3).font = { color: excellentColor };
    worksheet.getRow(16).getCell(3).font = { color: goodColor };

    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
  }

  private formatDataTable(worksheet: ExcelJS.Worksheet, numColumns: number, numRows: number) {
    // Header row styling
    const headerRow = worksheet.getRow(numRows - Math.floor(numRows / 2));
    for (let i = 1; i <= numColumns; i++) {
      const cell = headerRow.getCell(i);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF366092" }
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    }

    // Auto-fit columns
    for (let i = 1; i <= numColumns; i++) {
      worksheet.getColumn(i).width = 20;
    }

    // Add borders to data rows
    for (let rowNum = numRows - Math.floor(numRows / 2) + 1; rowNum <= numRows; rowNum++) {
      const row = worksheet.getRow(rowNum);
      for (let i = 1; i <= numColumns; i++) {
        row.getCell(i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      }
    }
  }

  private applyHeaderStyle(worksheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
    for (let i = startRow; i <= endRow; i++) {
      const row = worksheet.getRow(i);
      row.font = { bold: true, size: 14 };
    }
  }

  private async ensureOutputDirectory(): Promise<void> {
    if (!existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
    }
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}