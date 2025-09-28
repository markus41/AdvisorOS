import { PrismaClient } from '@cpa-platform/database';
import { ReportTemplate, templateRegistry } from './templates';
import * as ExcelJS from 'exceljs';
import pptxgen from 'pptxgenjs';
import { renderToBuffer } from '@react-pdf/renderer';

export interface ReportGenerationRequest {
  templateId: string;
  name: string;
  description?: string;
  format: 'pdf' | 'excel' | 'pptx' | 'html';
  clientIds: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  parameters?: Record<string, any>;
  branding?: {
    logo?: string;
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  };
  organizationId: string;
  createdById: string;
}

export interface ReportGenerationResult {
  reportId: string;
  fileUrl: string;
  fileSize: number;
  status: 'completed' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

export interface DataSource {
  source: 'quickbooks' | 'database' | 'manual' | 'calculated';
  entity: string;
  data: Record<string, any>[];
}

export class ReportGenerationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResult> {
    try {
      // 1. Get template
      const template = templateRegistry.getTemplate(request.templateId);
      if (!template) {
        throw new Error(`Template not found: ${request.templateId}`);
      }

      // 2. Create report record
      const report = await this.prisma.report.create({
        data: {
          name: request.name,
          description: request.description,
          reportType: template.type,
          format: request.format,
          status: 'generating',
          templateId: request.templateId,
          clientIds: request.clientIds,
          parameters: request.parameters || {},
          organizationId: request.organizationId,
          createdById: request.createdById,
        },
      });

      try {
        // 3. Gather data
        const dataSources = await this.gatherData(template, request);

        // 4. Generate report based on format
        let fileBuffer: Buffer;
        let fileSize: number;

        switch (request.format) {
          case 'pdf':
            fileBuffer = await this.generatePDF(template, dataSources, request);
            break;
          case 'excel':
            fileBuffer = await this.generateExcel(template, dataSources, request);
            break;
          case 'pptx':
            fileBuffer = await this.generatePowerPoint(template, dataSources, request);
            break;
          case 'html':
            fileBuffer = Buffer.from(await this.generateHTML(template, dataSources, request));
            break;
          default:
            throw new Error(`Unsupported format: ${request.format}`);
        }

        fileSize = fileBuffer.length;

        // 5. Upload file to storage (implementation depends on your storage solution)
        const fileUrl = await this.uploadFile(fileBuffer, report.id, request.format);

        // 6. Update report record
        await this.prisma.report.update({
          where: { id: report.id },
          data: {
            status: 'completed',
            fileUrl,
            fileSize: BigInt(fileSize),
            generatedAt: new Date(),
            data: dataSources,
          },
        });

        return {
          reportId: report.id,
          fileUrl,
          fileSize,
          status: 'completed',
        };
      } catch (error) {
        // Update report with error status
        await this.prisma.report.update({
          where: { id: report.id },
          data: {
            status: 'failed',
            data: { error: error instanceof Error ? error.message : 'Unknown error' },
          },
        });

        throw error;
      }
    } catch (error) {
      return {
        reportId: '',
        fileUrl: '',
        fileSize: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async gatherData(
    template: ReportTemplate,
    request: ReportGenerationRequest
  ): Promise<Record<string, DataSource>> {
    const dataSources: Record<string, DataSource> = {};

    for (const requirement of template.dataRequirements) {
      try {
        let data: Record<string, any>[] = [];

        switch (requirement.source) {
          case 'quickbooks':
            data = await this.getQuickBooksData(requirement, request);
            break;
          case 'database':
            data = await this.getDatabaseData(requirement, request);
            break;
          case 'calculated':
            data = await this.getCalculatedData(requirement, request, dataSources);
            break;
          case 'manual':
            data = await this.getManualData(requirement, request);
            break;
        }

        dataSources[requirement.entity] = {
          source: requirement.source,
          entity: requirement.entity,
          data,
        };
      } catch (error) {
        if (requirement.required) {
          throw new Error(`Failed to gather required data for ${requirement.entity}: ${error}`);
        }
        // Optional data source failed, continue with empty data
        dataSources[requirement.entity] = {
          source: requirement.source,
          entity: requirement.entity,
          data: [],
        };
      }
    }

    return dataSources;
  }

  private async getQuickBooksData(
    requirement: any,
    request: ReportGenerationRequest
  ): Promise<Record<string, any>[]> {
    // Implementation would connect to QuickBooks API
    // For now, return mock data
    return [
      { account: 'Revenue', amount: 100000, period: 'current_month' },
      { account: 'Expenses', amount: 75000, period: 'current_month' },
    ];
  }

  private async getDatabaseData(
    requirement: any,
    request: ReportGenerationRequest
  ): Promise<Record<string, any>[]> {
    // Query database based on requirement
    switch (requirement.entity) {
      case 'client_kpis':
        // Example: Get client KPIs
        return [
          { metric_name: 'Revenue Growth', value: 15.5, target: 20, previous_value: 12.3 },
          { metric_name: 'Profit Margin', value: 25.2, target: 30, previous_value: 22.1 },
        ];
      case 'financial_ratios':
        return [
          { ratio_name: 'Current Ratio', value: 2.1, benchmark: 2.0, trend: 'up' },
          { ratio_name: 'Debt-to-Equity', value: 0.35, benchmark: 0.40, trend: 'down' },
        ];
      default:
        return [];
    }
  }

  private async getCalculatedData(
    requirement: any,
    request: ReportGenerationRequest,
    existingData: Record<string, DataSource>
  ): Promise<Record<string, any>[]> {
    // Perform calculations based on existing data
    switch (requirement.entity) {
      case 'financial_ratios':
        // Calculate ratios from financial statement data
        return this.calculateFinancialRatios(existingData);
      case 'growth_metrics':
        return this.calculateGrowthMetrics(existingData);
      default:
        return [];
    }
  }

  private async getManualData(
    requirement: any,
    request: ReportGenerationRequest
  ): Promise<Record<string, any>[]> {
    // Get manually entered data from request parameters
    return request.parameters?.[requirement.entity] || [];
  }

  private calculateFinancialRatios(dataSources: Record<string, DataSource>): Record<string, any>[] {
    // Implementation of financial ratio calculations
    return [
      { ratio_name: 'Current Ratio', value: 2.1, benchmark: 2.0, trend: 'stable' },
      { ratio_name: 'Quick Ratio', value: 1.8, benchmark: 1.5, trend: 'up' },
      { ratio_name: 'Debt-to-Equity', value: 0.35, benchmark: 0.40, trend: 'improving' },
    ];
  }

  private calculateGrowthMetrics(dataSources: Record<string, DataSource>): Record<string, any>[] {
    // Implementation of growth metric calculations
    return [
      { metric: 'Revenue Growth', period: 'YoY', value: 15.5, trend: 'positive' },
      { metric: 'Customer Growth', period: 'QoQ', value: 8.2, trend: 'positive' },
    ];
  }

  private async generatePDF(
    template: ReportTemplate,
    dataSources: Record<string, DataSource>,
    request: ReportGenerationRequest
  ): Promise<Buffer> {
    // Import PDF templates dynamically
    const { createPDFReport } = await import('./pdf-templates');
    const pdfDocument = createPDFReport(template, dataSources, request);
    return await renderToBuffer(pdfDocument);
  }

  private async generateExcel(
    template: ReportTemplate,
    dataSources: Record<string, DataSource>,
    request: ReportGenerationRequest
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Create worksheets for each section
    for (const section of template.sections) {
      const worksheet = workbook.addWorksheet(section.name);

      // Add section data based on type
      switch (section.type) {
        case 'table':
        case 'financial_statement':
          await this.addTableToExcel(worksheet, section, dataSources);
          break;
        case 'chart':
          await this.addChartDataToExcel(worksheet, section, dataSources);
          break;
        case 'narrative':
          await this.addNarrativeToExcel(worksheet, section, dataSources);
          break;
      }
    }

    // Apply branding and styling
    this.applyExcelBranding(workbook, request.branding);

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private async generatePowerPoint(
    template: ReportTemplate,
    dataSources: Record<string, DataSource>,
    request: ReportGenerationRequest
  ): Promise<Buffer> {
    const pptx = new pptxgen();

    // Set presentation properties
    pptx.author = 'CPA Platform';
    pptx.company = 'Professional Services';
    pptx.title = request.name;

    // Create cover slide
    const coverSlide = pptx.addSlide();
    coverSlide.addText(request.name, {
      x: 1,
      y: 2,
      w: 8,
      h: 1.5,
      fontSize: 32,
      bold: true,
      align: 'center',
    });

    // Create slides for each section
    for (const section of template.sections) {
      const slide = pptx.addSlide();
      slide.addText(section.name, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
      });

      // Add section content based on type
      await this.addSectionToPowerPoint(slide, section, dataSources);
    }

    // Apply branding
    this.applyPowerPointBranding(pptx, request.branding);

    return await pptx.writeFile({ outputType: 'nodebuffer' }) as Buffer;
  }

  private async generateHTML(
    template: ReportTemplate,
    dataSources: Record<string, DataSource>,
    request: ReportGenerationRequest
  ): Promise<string> {
    // Generate HTML report
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${request.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; }
          h2 { color: #374151; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
          .chart-placeholder {
            background-color: #f9fafb;
            border: 1px solid #d1d5db;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h1>${request.name}</h1>
    `;

    for (const section of template.sections) {
      html += `<h2>${section.name}</h2>`;
      html += await this.generateHTMLSection(section, dataSources);
    }

    html += `
      </body>
      </html>
    `;

    return html;
  }

  private async generateHTMLSection(
    section: any,
    dataSources: Record<string, DataSource>
  ): Promise<string> {
    const data = dataSources[section.dataSource]?.data || [];

    switch (section.type) {
      case 'table':
      case 'financial_statement':
        return this.generateHTMLTable(data);
      case 'chart':
        return `<div class="chart-placeholder">Chart: ${section.name}</div>`;
      case 'narrative':
        return `<p>Narrative content for ${section.name}</p>`;
      default:
        return `<p>Section: ${section.name}</p>`;
    }
  }

  private generateHTMLTable(data: Record<string, any>[]): string {
    if (data.length === 0) return '<p>No data available</p>';

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';

    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });

    html += '</tr></thead><tbody>';

    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        html += `<td>${row[header] || ''}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  private async addTableToExcel(
    worksheet: ExcelJS.Worksheet,
    section: any,
    dataSources: Record<string, DataSource>
  ): Promise<void> {
    const data = dataSources[section.dataSource]?.data || [];
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);

    // Add headers
    worksheet.addRow(headers);

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => row[header]);
      worksheet.addRow(values);
    });

    // Style the table
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' },
    };
  }

  private async addChartDataToExcel(
    worksheet: ExcelJS.Worksheet,
    section: any,
    dataSources: Record<string, DataSource>
  ): Promise<void> {
    // Add chart data (Excel will need chart creation separately)
    const data = dataSources[section.dataSource]?.data || [];
    if (data.length > 0) {
      await this.addTableToExcel(worksheet, section, dataSources);
    }
  }

  private async addNarrativeToExcel(
    worksheet: ExcelJS.Worksheet,
    section: any,
    dataSources: Record<string, DataSource>
  ): Promise<void> {
    worksheet.addRow([section.name]);
    worksheet.addRow(['Narrative content would go here']);
  }

  private async addSectionToPowerPoint(
    slide: any,
    section: any,
    dataSources: Record<string, DataSource>
  ): Promise<void> {
    const data = dataSources[section.dataSource]?.data || [];

    switch (section.type) {
      case 'table':
      case 'financial_statement':
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map(row => headers.map(header => row[header]));

          slide.addTable([headers, ...rows], {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 4,
          });
        }
        break;
      case 'chart':
        slide.addText('Chart placeholder', {
          x: 2,
          y: 3,
          w: 6,
          h: 1,
          align: 'center',
        });
        break;
      case 'narrative':
        slide.addText('Narrative content would go here', {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4,
        });
        break;
    }
  }

  private applyExcelBranding(workbook: ExcelJS.Workbook, branding?: any): void {
    // Apply consistent styling across all worksheets
    workbook.eachSheet(worksheet => {
      worksheet.properties.defaultColWidth = 15;
      worksheet.properties.defaultRowHeight = 20;
    });
  }

  private applyPowerPointBranding(pptx: any, branding?: any): void {
    // Apply branding colors and fonts
    if (branding?.colors?.primary) {
      pptx.slideNumber = {
        x: 9.5,
        y: 6.9,
        color: branding.colors.primary,
      };
    }
  }

  private async uploadFile(buffer: Buffer, reportId: string, format: string): Promise<string> {
    // Implementation depends on your storage solution (AWS S3, Azure Blob, etc.)
    // For now, return a mock URL
    return `/api/reports/download/${reportId}.${format}`;
  }

  async getReportHistory(organizationId: string, limit = 50): Promise<any[]> {
    return await this.prisma.report.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdBy: { select: { name: true, email: true } },
        template: { select: { name: true, category: true } },
      },
    });
  }

  async getReportById(id: string): Promise<any> {
    return await this.prisma.report.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        template: true,
      },
    });
  }

  async deleteReport(id: string): Promise<boolean> {
    try {
      await this.prisma.report.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }
}