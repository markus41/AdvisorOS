import React from "react";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface PDFGenerationOptions {
  reportId: string;
  reportName: string;
  organizationName: string;
  generatedAt: Date;
  data: any;
  template?: "financial_package" | "tax_summary" | "engagement_summary" | "custom";
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
  };
  customizations?: Record<string, any>;
}

export class PDFService {
  private readonly outputDir = join(process.cwd(), "public", "reports");

  constructor() {
    this.ensureOutputDirectory();
  }

  async generatePDF(options: PDFGenerationOptions): Promise<{ fileUrl: string; fileSize: number }> {
    try {
      // Create PDF document based on template
      const PDFDocument = this.createPDFDocument(options);

      // Generate PDF buffer
      const pdfBuffer = await pdf(PDFDocument).toBuffer();

      // Save to file system
      const fileName = `${options.reportId}_${Date.now()}.pdf`;
      const filePath = join(this.outputDir, fileName);

      await writeFile(filePath, pdfBuffer);

      return {
        fileUrl: `/reports/${fileName}`,
        fileSize: pdfBuffer.length
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }

  private createPDFDocument(options: PDFGenerationOptions): React.ReactElement {
    switch (options.template) {
      case "financial_package":
        return React.createElement(FinancialPackagePDF, { options });
      case "tax_summary":
        return React.createElement(TaxSummaryPDF, { options });
      case "engagement_summary":
        return React.createElement(EngagementSummaryPDF, { options });
      default:
        return React.createElement(StandardReportPDF, { options });
    }
  }

  private async ensureOutputDirectory(): Promise<void> {
    if (!existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
    }
  }
}

// PDF Component Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica"
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: "1 solid #cccccc"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 10
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#34495e"
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    fontWeight: "bold"
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 5
  },
  summaryItem: {
    alignItems: "center"
  },
  summaryLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 3
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50"
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: 10,
    borderTop: "1 solid #ecf0f1",
    paddingTop: 10
  },
  pageNumber: {
    position: "absolute",
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#7f8c8d"
  }
});

// Standard Report PDF Template
const StandardReportPDF: React.FC<{ options: PDFGenerationOptions }> = ({ options }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{options.reportName}</Text>
          <Text style={styles.subtitle}>Generated for {options.organizationName}</Text>
          <Text style={{ fontSize: 10, color: "#95a5a6" }}>
            Generated on {options.generatedAt.toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Summary</Text>
        <Text style={{ marginBottom: 10 }}>
          This report contains comprehensive data analysis for the specified period.
        </Text>

        {/* Data Table */}
        {options.data && renderDataTable(options.data)}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        This report was generated automatically by {options.organizationName} CPA Platform
      </Text>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
);

// Financial Package PDF Template
const FinancialPackagePDF: React.FC<{ options: PDFGenerationOptions }> = ({ options }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cover Page */}
      <View style={styles.header}>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { fontSize: 28, marginBottom: 20 }]}>
            Financial Statement Package
          </Text>
          <Text style={[styles.subtitle, { fontSize: 18 }]}>
            {options.organizationName}
          </Text>
          <Text style={{ fontSize: 14, marginTop: 20 }}>
            For the Period Ending {options.generatedAt.toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Table of Contents */}
      <View style={[styles.section, { marginTop: 40 }]}>
        <Text style={styles.sectionTitle}>Table of Contents</Text>
        <View style={{ marginLeft: 20 }}>
          <Text style={{ fontSize: 12, marginBottom: 5 }}>1. Balance Sheet ............................ 2</Text>
          <Text style={{ fontSize: 12, marginBottom: 5 }}>2. Income Statement ...................... 3</Text>
          <Text style={{ fontSize: 12, marginBottom: 5 }}>3. Cash Flow Statement .................. 4</Text>
          <Text style={{ fontSize: 12, marginBottom: 5 }}>4. Notes to Financial Statements .... 5</Text>
        </View>
      </View>
    </Page>

    {/* Balance Sheet */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Balance Sheet</Text>
        <Text style={styles.subtitle}>As of {options.generatedAt.toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        {renderBalanceSheet(options.data)}
      </View>

      <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
    </Page>

    {/* Income Statement */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Income Statement</Text>
        <Text style={styles.subtitle}>For the Year Ended {options.generatedAt.toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        {renderIncomeStatement(options.data)}
      </View>

      <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
    </Page>

    {/* Cash Flow Statement */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Statement of Cash Flows</Text>
        <Text style={styles.subtitle}>For the Year Ended {options.generatedAt.toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        {renderCashFlowStatement(options.data)}
      </View>

      <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
    </Page>
  </Document>
);

// Tax Summary PDF Template
const TaxSummaryPDF: React.FC<{ options: PDFGenerationOptions }> = ({ options }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Tax Return Summary</Text>
        <Text style={styles.subtitle}>{options.organizationName}</Text>
        <Text style={{ fontSize: 12 }}>Tax Year: {new Date().getFullYear() - 1}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary of Tax Returns</Text>
        {renderTaxSummaryTable(options.data)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Tax Information</Text>
        {renderTaxDetails(options.data)}
      </View>

      <Text style={styles.footer}>
        Prepared by {options.organizationName} | All amounts in USD
      </Text>

      <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
    </Page>
  </Document>
);

// Engagement Summary PDF Template
const EngagementSummaryPDF: React.FC<{ options: PDFGenerationOptions }> = ({ options }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Engagement Summary</Text>
        <Text style={styles.subtitle}>{options.data?.engagement?.name || "Project Summary"}</Text>
        <Text style={{ fontSize: 12 }}>Client: {options.data?.engagement?.client?.businessName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Overview</Text>
        {renderEngagementOverview(options.data)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Summary</Text>
        {renderTaskSummary(options.data)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members</Text>
        {renderTeamMembers(options.data)}
      </View>

      <Text style={styles.footer}>
        Generated by {options.organizationName} CPA Platform
      </Text>

      <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
    </Page>
  </Document>
);

// Helper functions for rendering different sections
function renderDataTable(data: any): React.ReactElement {
  if (!data || typeof data !== 'object') {
    return <Text>No data available</Text>;
  }

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Metric</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Value</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Previous Period</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Change</Text>
        </View>
      </View>

      {Object.entries(data).slice(0, 10).map(([key, value], index) => (
        <View style={styles.tableRow} key={index}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{key}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{String(value)}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>-</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>-</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function renderBalanceSheet(data: any): React.ReactElement {
  const balanceSheetData = data?.clients?.[0] || {};

  return (
    <View>
      <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 15 }]}>ASSETS</Text>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCol, { width: "70%" }]}>
            <Text style={styles.tableCell}>Account</Text>
          </View>
          <View style={[styles.tableCol, { width: "30%" }]}>
            <Text style={styles.tableCell}>Amount</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: "70%" }]}>
            <Text style={styles.tableCell}>Current Assets</Text>
          </View>
          <View style={[styles.tableCol, { width: "30%" }]}>
            <Text style={styles.tableCell}>$50,000</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: "70%" }]}>
            <Text style={styles.tableCell}>Fixed Assets</Text>
          </View>
          <View style={[styles.tableCol, { width: "30%" }]}>
            <Text style={styles.tableCell}>$25,000</Text>
          </View>
        </View>

        <View style={[styles.tableRow, { backgroundColor: "#f8f9fa" }]}>
          <View style={[styles.tableCol, { width: "70%" }]}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Total Assets</Text>
          </View>
          <View style={[styles.tableCol, { width: "30%" }]}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>$75,000</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 20, marginBottom: 15 }]}>LIABILITIES & EQUITY</Text>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: "70%" }]}>
            <Text style={styles.tableCell}>Current Liabilities</Text>
          </View>
          <View style={[styles.tableCol, { width: "30%" }]}>
            <Text style={styles.tableCell}>$15,000</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: "70%" }]}>
            <Text style={styles.tableCell}>Owner's Equity</Text>
          </View>
          <View style={[styles.tableCol, { width: "30%" }]}>
            <Text style={styles.tableCell}>$60,000</Text>
          </View>
        </View>

        <View style={[styles.tableRow, { backgroundColor: "#f8f9fa" }]}>
          <View style={[styles.tableCol, { width: "70%" }]}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Total Liabilities & Equity</Text>
          </View>
          <View style={[styles.tableCol, { width: "30%" }]}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>$75,000</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function renderIncomeStatement(data: any): React.ReactElement {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={[styles.tableCol, { width: "70%" }]}>
          <Text style={styles.tableCell}>Account</Text>
        </View>
        <View style={[styles.tableCol, { width: "30%" }]}>
          <Text style={styles.tableCell}>Amount</Text>
        </View>
      </View>

      <View style={styles.tableRow}>
        <View style={[styles.tableCol, { width: "70%" }]}>
          <Text style={styles.tableCell}>Revenue</Text>
        </View>
        <View style={[styles.tableCol, { width: "30%" }]}>
          <Text style={styles.tableCell}>$100,000</Text>
        </View>
      </View>

      <View style={styles.tableRow}>
        <View style={[styles.tableCol, { width: "70%" }]}>
          <Text style={styles.tableCell}>Cost of Goods Sold</Text>
        </View>
        <View style={[styles.tableCol, { width: "30%" }]}>
          <Text style={styles.tableCell}>$40,000</Text>
        </View>
      </View>

      <View style={styles.tableRow}>
        <View style={[styles.tableCol, { width: "70%" }]}>
          <Text style={styles.tableCell}>Operating Expenses</Text>
        </View>
        <View style={[styles.tableCol, { width: "30%" }]}>
          <Text style={styles.tableCell}>$35,000</Text>
        </View>
      </View>

      <View style={[styles.tableRow, { backgroundColor: "#f8f9fa" }]}>
        <View style={[styles.tableCol, { width: "70%" }]}>
          <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Net Income</Text>
        </View>
        <View style={[styles.tableCol, { width: "30%" }]}>
          <Text style={[styles.tableCell, { fontWeight: "bold" }]}>$25,000</Text>
        </View>
      </View>
    </View>
  );
}

function renderCashFlowStatement(data: any): React.ReactElement {
  return (
    <View>
      <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Operating Activities</Text>
      <Text style={{ marginBottom: 10 }}>Net Income: $25,000</Text>
      <Text style={{ marginBottom: 10 }}>Depreciation: $5,000</Text>
      <Text style={{ marginBottom: 20, fontWeight: "bold" }}>Net Cash from Operating: $30,000</Text>

      <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Investing Activities</Text>
      <Text style={{ marginBottom: 20 }}>Net Cash from Investing: $0</Text>

      <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Financing Activities</Text>
      <Text style={{ marginBottom: 20 }}>Net Cash from Financing: $0</Text>

      <Text style={{ fontWeight: "bold", fontSize: 16 }}>Net Change in Cash: $30,000</Text>
    </View>
  );
}

function renderTaxSummaryTable(data: any): React.ReactElement {
  const engagements = data?.engagements || [];

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Client</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Return Type</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Status</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Fee</Text>
        </View>
      </View>

      {engagements.slice(0, 10).map((engagement: any, index: number) => (
        <View style={styles.tableRow} key={index}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{engagement.client?.businessName || "N/A"}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{engagement.type}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{engagement.status}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>${engagement.fixedFee || "0"}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function renderTaxDetails(data: any): React.ReactElement {
  const summary = data?.summary || {};

  return (
    <View style={styles.summary}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Returns</Text>
        <Text style={styles.summaryValue}>{summary.totalEngagements || 0}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Completed</Text>
        <Text style={styles.summaryValue}>{summary.completedReturns || 0}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Revenue</Text>
        <Text style={styles.summaryValue}>${summary.totalRevenue || 0}</Text>
      </View>
    </View>
  );
}

function renderEngagementOverview(data: any): React.ReactElement {
  const engagement = data?.engagement || {};
  const summary = data?.summary || {};

  return (
    <View>
      <Text style={{ marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Type: </Text>{engagement.type}
      </Text>
      <Text style={{ marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Status: </Text>{engagement.status}
      </Text>
      <Text style={{ marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Start Date: </Text>{engagement.startDate ? new Date(engagement.startDate).toLocaleDateString() : "N/A"}
      </Text>
      <Text style={{ marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Due Date: </Text>{engagement.dueDate ? new Date(engagement.dueDate).toLocaleDateString() : "N/A"}
      </Text>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Tasks</Text>
          <Text style={styles.summaryValue}>{summary.totalTasks || 0}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={styles.summaryValue}>{summary.completedTasks || 0}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summaryValue}>{summary.totalHours || 0}</Text>
        </View>
      </View>
    </View>
  );
}

function renderTaskSummary(data: any): React.ReactElement {
  const tasks = data?.engagement?.tasks || [];

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={[styles.tableCol, { width: "40%" }]}>
          <Text style={styles.tableCell}>Task</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Assignee</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Status</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>Hours</Text>
        </View>
      </View>

      {tasks.slice(0, 10).map((task: any, index: number) => (
        <View style={styles.tableRow} key={index}>
          <View style={[styles.tableCol, { width: "40%" }]}>
            <Text style={styles.tableCell}>{task.title}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{task.assignedTo?.name || "Unassigned"}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{task.status}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{task.actualHours || 0}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function renderTeamMembers(data: any): React.ReactElement {
  const teamMembers = data?.teamMembers || [];

  return (
    <View>
      {teamMembers.map((member: any, index: number) => (
        <Text key={index} style={{ marginBottom: 5 }}>
          • {member.name} ({member.role || "Staff"})
        </Text>
      ))}
    </View>
  );
}