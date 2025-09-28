import { PrismaClient } from "@database/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export interface ReportParameters {
  organizationId: string;
  clientIds?: string[];
  engagementId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: Record<string, any>;
  customFields?: Record<string, any>;
  format: "pdf" | "excel" | "csv" | "html";
  template?: {
    id: string;
    customizations?: Record<string, any>;
  };
}

export interface ReportData {
  reportId: string;
  organizationId: string;
  name: string;
  description?: string;
  reportType: string;
  data: any;
  metadata: Record<string, any>;
  generatedAt: Date;
  expiresAt?: Date;
}

export interface ScheduleConfig {
  cronExpression: string;
  recipients: {
    emails: string[];
    userIds?: string[];
    clientIds?: string[];
  };
  deliveryMethod: "email" | "portal" | "both";
  isActive: boolean;
}

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async generateReport(
    reportType: string,
    parameters: ReportParameters,
    createdBy: string
  ): Promise<string> {
    try {
      // Validate organization access
      await this.validateOrganizationAccess(parameters.organizationId, createdBy);

      // Create report record
      const report = await this.prisma.report.create({
        data: {
          name: this.generateReportName(reportType, parameters),
          reportType,
          format: parameters.format,
          status: "generating",
          parameters: parameters as any,
          organizationId: parameters.organizationId,
          engagementId: parameters.engagementId,
          clientIds: parameters.clientIds || [],
          templateId: parameters.template?.id,
          createdById: createdBy,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      // Generate report data based on type
      const reportData = await this.generateReportData(reportType, parameters);

      // Save report data and update status
      await this.prisma.report.update({
        where: { id: report.id },
        data: {
          data: reportData,
          status: "completed",
          generatedAt: new Date(),
          metadata: {
            generationTime: Date.now() - report.createdAt.getTime(),
            recordCount: this.getRecordCount(reportData),
            filters: parameters.filters
          }
        }
      });

      return report.id;
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  }

  async scheduleReport(
    reportType: string,
    parameters: ReportParameters,
    scheduleConfig: ScheduleConfig,
    name: string,
    createdBy: string
  ) {
    try {
      await this.validateOrganizationAccess(parameters.organizationId, createdBy);

      // Validate cron expression
      this.validateCronExpression(scheduleConfig.cronExpression);

      const schedule = await this.prisma.reportSchedule.create({
        data: {
          name,
          cronExpression: scheduleConfig.cronExpression,
          reportType,
          format: parameters.format,
          parameters: parameters as any,
          recipients: scheduleConfig.recipients as any,
          clientIds: parameters.clientIds || [],
          templateId: parameters.template?.id,
          organizationId: parameters.organizationId,
          createdById: createdBy,
          isActive: scheduleConfig.isActive,
          nextRunAt: this.calculateNextRunTime(scheduleConfig.cronExpression)
        }
      });

      return schedule;
    } catch (error) {
      console.error("Error scheduling report:", error);
      throw error;
    }
  }

  async getReportStatus(reportId: string, organizationId: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        id: reportId,
        organizationId
      },
      include: {
        template: true,
        engagement: true,
        createdBy: true
      }
    });

    if (!report) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Report not found"
      });
    }

    return report;
  }

  async exportReport(reportId: string, format: "pdf" | "excel" | "csv", organizationId: string) {
    try {
      const report = await this.prisma.report.findFirst({
        where: {
          id: reportId,
          organizationId,
          status: "completed"
        }
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found or not ready"
        });
      }

      // Generate file based on format
      let fileUrl: string;
      let fileSize: number;

      switch (format) {
        case "pdf":
          ({ fileUrl, fileSize } = await this.generatePDF(report));
          break;
        case "excel":
          ({ fileUrl, fileSize } = await this.generateExcel(report));
          break;
        case "csv":
          ({ fileUrl, fileSize } = await this.generateCSV(report));
          break;
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported export format"
          });
      }

      // Update report with file information
      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          fileUrl,
          fileSize: BigInt(fileSize),
          downloadCount: { increment: 1 }
        }
      });

      return { fileUrl, fileSize };
    } catch (error) {
      console.error("Error exporting report:", error);
      throw error;
    }
  }

  async emailReport(
    reportId: string,
    recipients: string[],
    subject?: string,
    message?: string,
    organizationId?: string
  ) {
    try {
      const report = await this.prisma.report.findFirst({
        where: {
          id: reportId,
          ...(organizationId && { organizationId })
        },
        include: {
          createdBy: true
        }
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found"
        });
      }

      // Generate PDF for email attachment
      const { fileUrl } = await this.exportReport(reportId, "pdf", report.organizationId);

      // Send email (placeholder - implement with your email service)
      const emailSent = await this.sendReportEmail({
        recipients,
        subject: subject || `Report: ${report.name}`,
        message: message || `Please find the attached report generated on ${report.generatedAt?.toLocaleDateString()}.`,
        attachmentUrl: fileUrl,
        reportName: report.name
      });

      return { success: emailSent };
    } catch (error) {
      console.error("Error emailing report:", error);
      throw error;
    }
  }

  async saveReportTemplate(
    template: {
      name: string;
      description?: string;
      category: string;
      type: string;
      layout: any;
      sections: any;
      dataRequirements: any;
      chartConfigs?: any;
      brandingOptions?: any;
    },
    organizationId: string,
    createdBy: string
  ) {
    try {
      await this.validateOrganizationAccess(organizationId, createdBy);

      const reportTemplate = await this.prisma.reportTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          category: template.category,
          type: template.type,
          layout: template.layout,
          sections: template.sections,
          dataRequirements: template.dataRequirements,
          chartConfigs: template.chartConfigs,
          brandingOptions: template.brandingOptions,
          organizationId,
          createdById: createdBy,
          isActive: true,
          isSystem: false
        }
      });

      return reportTemplate;
    } catch (error) {
      console.error("Error saving report template:", error);
      throw error;
    }
  }

  private async generateReportData(reportType: string, parameters: ReportParameters): Promise<any> {
    switch (reportType) {
      case "financial_statement":
        return await this.generateFinancialStatementData(parameters);
      case "tax_summary":
        return await this.generateTaxSummaryData(parameters);
      case "client_portfolio":
        return await this.generateClientPortfolioData(parameters);
      case "business_health":
        return await this.generateBusinessHealthData(parameters);
      case "compliance":
        return await this.generateComplianceData(parameters);
      case "engagement_summary":
        return await this.generateEngagementSummaryData(parameters);
      case "time_tracking":
        return await this.generateTimeTrackingData(parameters);
      case "custom":
        return await this.generateCustomReportData(parameters);
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown report type: ${reportType}`
        });
    }
  }

  private async generateFinancialStatementData(parameters: ReportParameters) {
    const { organizationId, clientIds, dateRange } = parameters;

    // Get financial data from QuickBooks or manual entries
    const clients = await this.prisma.client.findMany({
      where: {
        organizationId,
        ...(clientIds?.length && { id: { in: clientIds } })
      },
      include: {
        engagements: {
          where: {
            type: { in: ["bookkeeping", "cfo_services"] },
            ...(dateRange && {
              createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate
              }
            })
          }
        }
      }
    });

    return {
      clients: clients.map(client => ({
        id: client.id,
        name: client.businessName,
        financialData: client.financialData,
        engagements: client.engagements,
        // Add computed financial metrics
        totalRevenue: this.calculateTotalRevenue(client.financialData),
        totalExpenses: this.calculateTotalExpenses(client.financialData),
        netIncome: this.calculateNetIncome(client.financialData),
        assets: this.getAssets(client.financialData),
        liabilities: this.getLiabilities(client.financialData),
        equity: this.getEquity(client.financialData)
      })),
      summary: {
        totalClients: clients.length,
        totalRevenue: clients.reduce((sum, client) => sum + this.calculateTotalRevenue(client.financialData), 0),
        averageRevenue: clients.length > 0 ? clients.reduce((sum, client) => sum + this.calculateTotalRevenue(client.financialData), 0) / clients.length : 0
      },
      dateRange,
      generatedAt: new Date()
    };
  }

  private async generateTaxSummaryData(parameters: ReportParameters) {
    const { organizationId, clientIds, dateRange } = parameters;

    const taxEngagements = await this.prisma.engagement.findMany({
      where: {
        organizationId,
        type: { startsWith: "tax" },
        ...(clientIds?.length && { clientId: { in: clientIds } }),
        ...(dateRange && {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate
          }
        })
      },
      include: {
        client: true,
        tasks: true,
        reports: true
      }
    });

    return {
      engagements: taxEngagements,
      summary: {
        totalEngagements: taxEngagements.length,
        completedReturns: taxEngagements.filter(e => e.status === "completed").length,
        pendingReturns: taxEngagements.filter(e => e.status !== "completed").length,
        totalRevenue: taxEngagements.reduce((sum, e) => sum + (Number(e.fixedFee) || 0), 0),
        averageCompletionTime: this.calculateAverageCompletionTime(taxEngagements)
      },
      byType: this.groupEngagementsByType(taxEngagements),
      byStatus: this.groupEngagementsByStatus(taxEngagements)
    };
  }

  private async generateClientPortfolioData(parameters: ReportParameters) {
    const { organizationId, clientIds } = parameters;

    const clients = await this.prisma.client.findMany({
      where: {
        organizationId,
        ...(clientIds?.length && { id: { in: clientIds } })
      },
      include: {
        engagements: {
          include: {
            tasks: true
          }
        },
        invoices: true,
        documents: true
      }
    });

    return {
      clients: clients.map(client => ({
        ...client,
        totalEngagements: client.engagements.length,
        activeEngagements: client.engagements.filter(e => e.status === "in_progress").length,
        totalRevenue: client.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
        outstandingAmount: client.invoices
          .filter(inv => inv.status !== "paid")
          .reduce((sum, inv) => sum + Number(inv.balanceAmount), 0),
        documentCount: client.documents.length,
        lastActivity: this.getLastActivityDate(client.engagements)
      })),
      summary: {
        totalClients: clients.length,
        totalRevenue: clients.reduce((sum, client) =>
          sum + client.invoices.reduce((invSum, inv) => invSum + Number(inv.totalAmount), 0), 0),
        averageClientValue: clients.length > 0 ?
          clients.reduce((sum, client) =>
            sum + client.invoices.reduce((invSum, inv) => invSum + Number(inv.totalAmount), 0), 0) / clients.length : 0
      }
    };
  }

  private async generateBusinessHealthData(parameters: ReportParameters) {
    // Implementation for business health metrics
    return {
      metrics: {
        clientRetentionRate: 95,
        averageProjectMargin: 25,
        utilizationRate: 80,
        cashFlow: "positive",
        growthRate: 15
      },
      trends: {
        revenue: [/* monthly revenue data */],
        clientAcquisition: [/* monthly new clients */],
        profitability: [/* monthly profit margins */]
      }
    };
  }

  private async generateComplianceData(parameters: ReportParameters) {
    // Implementation for compliance reporting
    return {
      deadlines: [/* upcoming tax deadlines */],
      filings: [/* completed filings */],
      requirements: [/* compliance requirements */]
    };
  }

  private async generateEngagementSummaryData(parameters: ReportParameters) {
    const { organizationId, engagementId, dateRange } = parameters;

    const engagement = await this.prisma.engagement.findFirst({
      where: {
        id: engagementId,
        organizationId
      },
      include: {
        client: true,
        tasks: {
          include: {
            assignedTo: true
          }
        },
        workflow: true,
        assignedTo: true,
        invoices: true,
        reports: true
      }
    });

    if (!engagement) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Engagement not found"
      });
    }

    return {
      engagement,
      summary: {
        totalTasks: engagement.tasks.length,
        completedTasks: engagement.tasks.filter(t => t.status === "completed").length,
        totalHours: engagement.tasks.reduce((sum, task) => sum + (Number(task.actualHours) || 0), 0),
        estimatedHours: engagement.tasks.reduce((sum, task) => sum + (Number(task.estimatedHours) || 0), 0),
        totalRevenue: engagement.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
      },
      timeline: this.generateEngagementTimeline(engagement.tasks),
      teamMembers: this.getUniqueTeamMembers(engagement.tasks)
    };
  }

  private async generateTimeTrackingData(parameters: ReportParameters) {
    const { organizationId, dateRange } = parameters;

    const tasks = await this.prisma.task.findMany({
      where: {
        organizationId,
        ...(dateRange && {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate
          }
        })
      },
      include: {
        assignedTo: true,
        engagement: {
          include: {
            client: true
          }
        }
      }
    });

    return {
      tasks,
      summary: {
        totalHours: tasks.reduce((sum, task) => sum + (Number(task.actualHours) || 0), 0),
        billableHours: tasks.filter(t => t.engagement).reduce((sum, task) => sum + (Number(task.actualHours) || 0), 0),
        utilizationRate: this.calculateUtilizationRate(tasks),
        byTeamMember: this.groupTasksByTeamMember(tasks),
        byClient: this.groupTasksByClient(tasks)
      }
    };
  }

  private async generateCustomReportData(parameters: ReportParameters) {
    // Custom report implementation based on template
    const template = await this.prisma.reportTemplate.findFirst({
      where: {
        id: parameters.template?.id,
        organizationId: parameters.organizationId
      }
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Report template not found"
      });
    }

    // Execute custom queries based on template configuration
    return {
      templateData: template,
      customData: await this.executeCustomQueries(template.dataRequirements, parameters)
    };
  }

  private async generatePDF(report: any): Promise<{ fileUrl: string; fileSize: number }> {
    // Placeholder for PDF generation - implement with React PDF
    return {
      fileUrl: `/api/reports/download/${report.id}/pdf`,
      fileSize: 1024000 // 1MB placeholder
    };
  }

  private async generateExcel(report: any): Promise<{ fileUrl: string; fileSize: number }> {
    // Placeholder for Excel generation - implement with ExcelJS
    return {
      fileUrl: `/api/reports/download/${report.id}/excel`,
      fileSize: 512000 // 512KB placeholder
    };
  }

  private async generateCSV(report: any): Promise<{ fileUrl: string; fileSize: number }> {
    // Placeholder for CSV generation
    return {
      fileUrl: `/api/reports/download/${report.id}/csv`,
      fileSize: 256000 // 256KB placeholder
    };
  }

  private async sendReportEmail(params: {
    recipients: string[];
    subject: string;
    message: string;
    attachmentUrl: string;
    reportName: string;
  }): Promise<boolean> {
    // Placeholder for email service integration
    console.log("Sending report email:", params);
    return true;
  }

  // Utility methods
  private generateReportName(reportType: string, parameters: ReportParameters): string {
    const now = new Date();
    const dateSuffix = now.toISOString().split('T')[0];
    return `${reportType.replace(/_/g, ' ').toUpperCase()} - ${dateSuffix}`;
  }

  private getRecordCount(data: any): number {
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object') {
      return Object.keys(data).length;
    }
    return 0;
  }

  private validateCronExpression(cronExpression: string): void {
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    if (!cronRegex.test(cronExpression)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid cron expression"
      });
    }
  }

  private calculateNextRunTime(cronExpression: string): Date {
    // Simple implementation - use a proper cron library in production
    const now = new Date();
    const nextRun = new Date(now);

    if (cronExpression.includes("0 0 * * *")) {
      // Daily at midnight
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
    } else if (cronExpression.includes("0 0 * * 0")) {
      // Weekly on Sunday
      const daysUntilSunday = (7 - nextRun.getDay()) % 7 || 7;
      nextRun.setDate(nextRun.getDate() + daysUntilSunday);
      nextRun.setHours(0, 0, 0, 0);
    } else if (cronExpression.includes("0 0 1 * *")) {
      // Monthly on 1st
      nextRun.setMonth(nextRun.getMonth() + 1, 1);
      nextRun.setHours(0, 0, 0, 0);
    } else {
      // Default to next hour
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
    }

    return nextRun;
  }

  private async validateOrganizationAccess(organizationId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        isActive: true
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to organization"
      });
    }
  }

  // Financial calculation helpers
  private calculateTotalRevenue(financialData: any): number {
    // Implement based on your financial data structure
    return 0;
  }

  private calculateTotalExpenses(financialData: any): number {
    // Implement based on your financial data structure
    return 0;
  }

  private calculateNetIncome(financialData: any): number {
    return this.calculateTotalRevenue(financialData) - this.calculateTotalExpenses(financialData);
  }

  private getAssets(financialData: any): any {
    // Implement based on your financial data structure
    return {};
  }

  private getLiabilities(financialData: any): any {
    // Implement based on your financial data structure
    return {};
  }

  private getEquity(financialData: any): any {
    // Implement based on your financial data structure
    return {};
  }

  private calculateAverageCompletionTime(engagements: any[]): number {
    const completed = engagements.filter(e => e.completedDate && e.startDate);
    if (completed.length === 0) return 0;

    const totalDays = completed.reduce((sum, e) => {
      const days = Math.ceil((e.completedDate.getTime() - e.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return totalDays / completed.length;
  }

  private groupEngagementsByType(engagements: any[]): Record<string, number> {
    return engagements.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});
  }

  private groupEngagementsByStatus(engagements: any[]): Record<string, number> {
    return engagements.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});
  }

  private getLastActivityDate(engagements: any[]): Date | null {
    const dates = engagements.map(e => new Date(e.updatedAt)).sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0] : null;
  }

  private generateEngagementTimeline(tasks: any[]): any[] {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      startDate: task.startDate,
      dueDate: task.dueDate,
      completedDate: task.completedDate,
      status: task.status
    })).sort((a, b) => (a.startDate || a.createdAt) - (b.startDate || b.createdAt));
  }

  private getUniqueTeamMembers(tasks: any[]): any[] {
    const members = new Map();
    tasks.forEach(task => {
      if (task.assignedTo) {
        members.set(task.assignedTo.id, task.assignedTo);
      }
    });
    return Array.from(members.values());
  }

  private calculateUtilizationRate(tasks: any[]): number {
    // Simple utilization calculation - implement based on your business rules
    const totalHours = tasks.reduce((sum, task) => sum + (Number(task.actualHours) || 0), 0);
    const billableHours = tasks.filter(t => t.engagement).reduce((sum, task) => sum + (Number(task.actualHours) || 0), 0);
    return totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
  }

  private groupTasksByTeamMember(tasks: any[]): Record<string, any> {
    return tasks.reduce((acc, task) => {
      if (task.assignedTo) {
        const memberId = task.assignedTo.id;
        if (!acc[memberId]) {
          acc[memberId] = {
            name: task.assignedTo.name,
            totalHours: 0,
            tasks: []
          };
        }
        acc[memberId].totalHours += Number(task.actualHours) || 0;
        acc[memberId].tasks.push(task);
      }
      return acc;
    }, {});
  }

  private groupTasksByClient(tasks: any[]): Record<string, any> {
    return tasks.reduce((acc, task) => {
      if (task.engagement?.client) {
        const clientId = task.engagement.client.id;
        if (!acc[clientId]) {
          acc[clientId] = {
            name: task.engagement.client.businessName,
            totalHours: 0,
            tasks: []
          };
        }
        acc[clientId].totalHours += Number(task.actualHours) || 0;
        acc[clientId].tasks.push(task);
      }
      return acc;
    }, {});
  }

  private async executeCustomQueries(dataRequirements: any, parameters: ReportParameters): Promise<any> {
    // Implement custom query execution based on template requirements
    return {};
  }
}