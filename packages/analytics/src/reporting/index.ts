/**
 * Reporting Engine - Advanced Report Generation and Template System
 * Creates dynamic, customizable reports with real-time data integration
 */

import { Decimal } from 'decimal.js';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays } from 'date-fns';
import {
  ReportTemplate,
  ReportSection,
  GeneratedReport,
  ReportContent,
  RenderedSection,
  ReportParameter,
  ScheduleConfig,
  LayoutConfig,
  StylingConfig,
  FinancialData,
  VisualizationSpec,
  VisualizationResult
} from '../types';

export class ReportingEngine {
  private templates: Map<string, ReportTemplate> = new Map();
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private renderEngine: ReportRenderEngine;
  private dataEngine: ReportDataEngine;

  constructor(private config: any) {
    this.renderEngine = new ReportRenderEngine();
    this.dataEngine = new ReportDataEngine();
  }

  async initialize(): Promise<void> {
    // Load predefined report templates
    await this.loadDefaultTemplates();

    // Initialize scheduled reports
    await this.initializeScheduledReports();

    console.log('Reporting Engine initialized');
  }

  /**
   * Create a new report template
   */
  async createTemplate(template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      id: this.generateTemplateId(),
      ...template
    };

    this.templates.set(newTemplate.id, newTemplate);

    // Save to database
    await this.saveTemplate(newTemplate);

    return newTemplate;
  }

  /**
   * Generate a report from a template
   */
  async generateReport(
    templateId: string,
    organizationId: string,
    clientId?: string,
    parameters: Record<string, any> = {}
  ): Promise<GeneratedReport> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      // Fetch data for the report
      const reportData = await this.dataEngine.fetchReportData(
        organizationId,
        clientId,
        template,
        parameters
      );

      // Render report sections
      const renderedSections = await this.renderSections(
        template.sections,
        reportData,
        parameters
      );

      // Generate summary and recommendations
      const summary = await this.generateSummary(renderedSections, reportData);
      const recommendations = await this.generateRecommendations(renderedSections, reportData);

      const report: GeneratedReport = {
        id: this.generateReportId(),
        templateId,
        organizationId,
        clientId,
        title: this.interpolateTitle(template.name, parameters),
        content: {
          sections: renderedSections,
          summary,
          recommendations
        },
        metadata: {
          dataRange: reportData.dateRange,
          generationTime: Date.now(),
          dataPoints: reportData.totalDataPoints,
          version: '1.0.0',
          parameters
        },
        generatedAt: new Date(),
        status: 'completed'
      };

      // Save report
      await this.saveReport(report);

      return report;

    } catch (error) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Create standard financial report templates
   */
  private async loadDefaultTemplates(): Promise<void> {
    // Financial Health Dashboard
    const financialHealthTemplate = await this.createFinancialHealthTemplate();
    this.templates.set(financialHealthTemplate.id, financialHealthTemplate);

    // Cash Flow Report
    const cashFlowTemplate = await this.createCashFlowTemplate();
    this.templates.set(cashFlowTemplate.id, cashFlowTemplate);

    // Profit & Loss Statement
    const plTemplate = await this.createProfitLossTemplate();
    this.templates.set(plTemplate.id, plTemplate);

    // Balance Sheet
    const balanceSheetTemplate = await this.createBalanceSheetTemplate();
    this.templates.set(balanceSheetTemplate.id, balanceSheetTemplate);

    // Budget Variance Report
    const budgetVarianceTemplate = await this.createBudgetVarianceTemplate();
    this.templates.set(budgetVarianceTemplate.id, budgetVarianceTemplate);

    // Tax Preparation Summary
    const taxPrepTemplate = await this.createTaxPreparationTemplate();
    this.templates.set(taxPrepTemplate.id, taxPrepTemplate);

    // KPI Dashboard
    const kpiTemplate = await this.createKPIDashboardTemplate();
    this.templates.set(kpiTemplate.id, kpiTemplate);

    // Compliance Report
    const complianceTemplate = await this.createComplianceTemplate();
    this.templates.set(complianceTemplate.id, complianceTemplate);
  }

  /**
   * Financial Health Dashboard Template
   */
  private async createFinancialHealthTemplate(): Promise<ReportTemplate> {
    return {
      id: 'financial_health_dashboard',
      name: 'Financial Health Dashboard',
      description: 'Comprehensive financial health analysis with key metrics and insights',
      category: 'dashboard',
      sections: [
        {
          id: 'executive_summary',
          type: 'text',
          title: 'Executive Summary',
          content: {
            template: 'executive_summary',
            includeInsights: true,
            includeRecommendations: true
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 3 }
        },
        {
          id: 'key_metrics',
          type: 'metric',
          title: 'Key Financial Metrics',
          content: {
            metrics: [
              'total_revenue',
              'net_income',
              'gross_margin',
              'current_ratio',
              'debt_to_equity'
            ],
            showTrends: true,
            showBenchmarks: true
          },
          position: { x: 0, y: 3 },
          size: { width: 12, height: 4 }
        },
        {
          id: 'revenue_chart',
          type: 'chart',
          title: 'Revenue Trend',
          content: {
            chartType: 'line',
            dataSource: 'revenue_by_month',
            xAxis: 'month',
            yAxis: 'amount',
            includePrediction: true,
            predictionMonths: 6
          },
          position: { x: 0, y: 7 },
          size: { width: 6, height: 5 }
        },
        {
          id: 'expense_breakdown',
          type: 'chart',
          title: 'Expense Breakdown',
          content: {
            chartType: 'pie',
            dataSource: 'expenses_by_category',
            labelField: 'category',
            valueField: 'amount'
          },
          position: { x: 6, y: 7 },
          size: { width: 6, height: 5 }
        },
        {
          id: 'cash_flow_analysis',
          type: 'chart',
          title: 'Cash Flow Analysis',
          content: {
            chartType: 'bar',
            dataSource: 'cash_flow_by_month',
            xAxis: 'month',
            yAxis: 'net_flow',
            showMovingAverage: true
          },
          position: { x: 0, y: 12 },
          size: { width: 8, height: 5 }
        },
        {
          id: 'risk_indicators',
          type: 'metric',
          title: 'Risk Indicators',
          content: {
            metrics: [
              'cash_runway',
              'customer_concentration',
              'collection_period',
              'burn_rate'
            ],
            alertThresholds: true
          },
          position: { x: 8, y: 12 },
          size: { width: 4, height: 5 }
        }
      ],
      layout: {
        columns: 12,
        rows: 20,
        gap: 16,
        responsive: true
      },
      styling: {
        theme: 'professional',
        colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
        fonts: {
          heading: 'Arial Black',
          body: 'Arial',
          caption: 'Arial'
        },
        spacing: {
          section: 24,
          element: 16
        }
      },
      parameters: [
        {
          name: 'period',
          type: 'select',
          required: true,
          defaultValue: 'last_12_months',
          options: ['last_6_months', 'last_12_months', 'ytd', 'custom']
        },
        {
          name: 'include_predictions',
          type: 'boolean',
          required: false,
          defaultValue: true
        },
        {
          name: 'benchmark_industry',
          type: 'string',
          required: false,
          defaultValue: 'accounting'
        }
      ]
    };
  }

  /**
   * Cash Flow Report Template
   */
  private async createCashFlowTemplate(): Promise<ReportTemplate> {
    return {
      id: 'cash_flow_report',
      name: 'Cash Flow Report',
      description: 'Detailed cash flow analysis with forecasting',
      category: 'financial_statement',
      sections: [
        {
          id: 'cash_flow_statement',
          type: 'table',
          title: 'Cash Flow Statement',
          content: {
            dataSource: 'cash_flow_statement',
            groupBy: 'category',
            columns: [
              { field: 'description', title: 'Description' },
              { field: 'current_period', title: 'Current Period', format: 'currency' },
              { field: 'previous_period', title: 'Previous Period', format: 'currency' },
              { field: 'variance', title: 'Variance', format: 'currency' },
              { field: 'variance_percent', title: 'Variance %', format: 'percentage' }
            ],
            showTotals: true,
            showSubtotals: true
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 8 }
        },
        {
          id: 'cash_flow_forecast',
          type: 'chart',
          title: 'Cash Flow Forecast',
          content: {
            chartType: 'line',
            dataSource: 'cash_flow_forecast',
            xAxis: 'date',
            yAxis: 'cumulative_balance',
            showConfidenceInterval: true,
            forecastPeriod: 12
          },
          position: { x: 0, y: 8 },
          size: { width: 8, height: 6 }
        },
        {
          id: 'cash_position_summary',
          type: 'metric',
          title: 'Cash Position Summary',
          content: {
            metrics: [
              'beginning_cash',
              'ending_cash',
              'net_change',
              'cash_runway'
            ]
          },
          position: { x: 8, y: 8 },
          size: { width: 4, height: 6 }
        }
      ],
      layout: {
        columns: 12,
        rows: 16,
        gap: 16,
        responsive: true
      },
      styling: {
        theme: 'professional',
        colors: ['#2563eb', '#059669', '#dc2626'],
        fonts: {
          heading: 'Inter Bold',
          body: 'Inter',
          caption: 'Inter'
        },
        spacing: {
          section: 24,
          element: 16
        }
      },
      parameters: [
        {
          name: 'period',
          type: 'select',
          required: true,
          defaultValue: 'quarterly',
          options: ['monthly', 'quarterly', 'yearly']
        },
        {
          name: 'forecast_months',
          type: 'number',
          required: false,
          defaultValue: 12
        }
      ]
    };
  }

  /**
   * Profit & Loss Template
   */
  private async createProfitLossTemplate(): Promise<ReportTemplate> {
    return {
      id: 'profit_loss_statement',
      name: 'Profit & Loss Statement',
      description: 'Standard P&L statement with variance analysis',
      category: 'financial_statement',
      sections: [
        {
          id: 'income_statement',
          type: 'table',
          title: 'Income Statement',
          content: {
            dataSource: 'income_statement',
            columns: [
              { field: 'account', title: 'Account' },
              { field: 'current_period', title: 'Current Period', format: 'currency' },
              { field: 'previous_period', title: 'Previous Period', format: 'currency' },
              { field: 'budget', title: 'Budget', format: 'currency' },
              { field: 'variance_budget', title: 'Budget Variance', format: 'currency' },
              { field: 'variance_percent', title: 'Variance %', format: 'percentage' }
            ],
            groupBy: 'category',
            showTotals: true,
            showSubtotals: true,
            formatting: {
              negativeInRed: true,
              thousandsSeparator: true
            }
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 12 }
        },
        {
          id: 'margin_analysis',
          type: 'chart',
          title: 'Margin Analysis',
          content: {
            chartType: 'bar',
            dataSource: 'margin_by_period',
            xAxis: 'period',
            yAxis: ['gross_margin', 'operating_margin', 'net_margin'],
            showTrend: true
          },
          position: { x: 0, y: 12 },
          size: { width: 8, height: 5 }
        },
        {
          id: 'key_ratios',
          type: 'metric',
          title: 'Key Ratios',
          content: {
            metrics: [
              'gross_margin_percent',
              'operating_margin_percent',
              'net_margin_percent',
              'revenue_growth'
            ]
          },
          position: { x: 8, y: 12 },
          size: { width: 4, height: 5 }
        }
      ],
      layout: {
        columns: 12,
        rows: 18,
        gap: 16,
        responsive: true
      },
      styling: {
        theme: 'professional',
        colors: ['#1e40af', '#059669', '#dc2626'],
        fonts: {
          heading: 'Times New Roman Bold',
          body: 'Times New Roman',
          caption: 'Times New Roman'
        },
        spacing: {
          section: 24,
          element: 16
        }
      },
      parameters: [
        {
          name: 'period',
          type: 'select',
          required: true,
          defaultValue: 'monthly',
          options: ['monthly', 'quarterly', 'yearly']
        },
        {
          name: 'comparison_period',
          type: 'select',
          required: true,
          defaultValue: 'previous_year',
          options: ['previous_period', 'previous_year', 'budget']
        },
        {
          name: 'include_budget_variance',
          type: 'boolean',
          required: false,
          defaultValue: true
        }
      ]
    };
  }

  /**
   * Budget Variance Report Template
   */
  private async createBudgetVarianceTemplate(): Promise<ReportTemplate> {
    return {
      id: 'budget_variance_report',
      name: 'Budget Variance Report',
      description: 'Detailed budget vs actual analysis with explanations',
      category: 'variance_analysis',
      sections: [
        {
          id: 'variance_summary',
          type: 'table',
          title: 'Budget Variance Summary',
          content: {
            dataSource: 'budget_variance',
            columns: [
              { field: 'category', title: 'Category' },
              { field: 'budget', title: 'Budget', format: 'currency' },
              { field: 'actual', title: 'Actual', format: 'currency' },
              { field: 'variance', title: 'Variance', format: 'currency' },
              { field: 'variance_percent', title: 'Variance %', format: 'percentage' },
              { field: 'explanation', title: 'Explanation' }
            ],
            conditionalFormatting: {
              variance_percent: {
                red: { operator: 'gt', value: 10 },
                yellow: { operator: 'between', value: [5, 10] },
                green: { operator: 'lt', value: 5 }
              }
            }
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 8 }
        },
        {
          id: 'variance_trend',
          type: 'chart',
          title: 'Variance Trend Over Time',
          content: {
            chartType: 'line',
            dataSource: 'variance_by_month',
            xAxis: 'month',
            yAxis: 'variance_percent',
            groupBy: 'category',
            showZeroLine: true
          },
          position: { x: 0, y: 8 },
          size: { width: 8, height: 5 }
        },
        {
          id: 'top_variances',
          type: 'table',
          title: 'Top Variances',
          content: {
            dataSource: 'top_variances',
            limit: 10,
            orderBy: 'abs_variance_percent',
            orderDirection: 'desc'
          },
          position: { x: 8, y: 8 },
          size: { width: 4, height: 5 }
        }
      ],
      layout: {
        columns: 12,
        rows: 14,
        gap: 16,
        responsive: true
      },
      styling: {
        theme: 'professional',
        colors: ['#dc2626', '#f59e0b', '#059669'],
        fonts: {
          heading: 'Arial Bold',
          body: 'Arial',
          caption: 'Arial'
        },
        spacing: {
          section: 24,
          element: 16
        }
      },
      parameters: [
        {
          name: 'period',
          type: 'select',
          required: true,
          defaultValue: 'current_month',
          options: ['current_month', 'current_quarter', 'ytd']
        },
        {
          name: 'variance_threshold',
          type: 'number',
          required: false,
          defaultValue: 5
        }
      ]
    };
  }

  /**
   * KPI Dashboard Template
   */
  private async createKPIDashboardTemplate(): Promise<ReportTemplate> {
    return {
      id: 'kpi_dashboard',
      name: 'KPI Dashboard',
      description: 'Key performance indicators with trends and benchmarks',
      category: 'dashboard',
      sections: [
        {
          id: 'financial_kpis',
          type: 'metric',
          title: 'Financial KPIs',
          content: {
            metrics: [
              'revenue_growth',
              'gross_margin',
              'operating_margin',
              'net_margin',
              'ebitda_margin'
            ],
            layout: 'grid',
            showTrends: true,
            showBenchmarks: true,
            trendPeriods: 12
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 4 }
        },
        {
          id: 'operational_kpis',
          type: 'metric',
          title: 'Operational KPIs',
          content: {
            metrics: [
              'days_sales_outstanding',
              'inventory_turnover',
              'asset_turnover',
              'employee_productivity',
              'customer_retention'
            ],
            layout: 'grid',
            showTrends: true
          },
          position: { x: 0, y: 4 },
          size: { width: 12, height: 4 }
        },
        {
          id: 'liquidity_kpis',
          type: 'metric',
          title: 'Liquidity & Leverage KPIs',
          content: {
            metrics: [
              'current_ratio',
              'quick_ratio',
              'debt_to_equity',
              'interest_coverage',
              'working_capital'
            ],
            layout: 'grid',
            showTrends: true,
            alertThresholds: true
          },
          position: { x: 0, y: 8 },
          size: { width: 12, height: 4 }
        },
        {
          id: 'kpi_trends',
          type: 'chart',
          title: 'KPI Trends',
          content: {
            chartType: 'line',
            dataSource: 'kpi_trends',
            xAxis: 'period',
            yAxis: 'normalized_value',
            groupBy: 'kpi_name',
            normalize: true
          },
          position: { x: 0, y: 12 },
          size: { width: 8, height: 6 }
        },
        {
          id: 'benchmark_comparison',
          type: 'chart',
          title: 'Industry Benchmark Comparison',
          content: {
            chartType: 'radar',
            dataSource: 'benchmark_comparison',
            categories: 'kpi_name',
            series: ['client_value', 'industry_average', 'top_quartile']
          },
          position: { x: 8, y: 12 },
          size: { width: 4, height: 6 }
        }
      ],
      layout: {
        columns: 12,
        rows: 20,
        gap: 16,
        responsive: true
      },
      styling: {
        theme: 'modern',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        fonts: {
          heading: 'Inter Bold',
          body: 'Inter',
          caption: 'Inter'
        },
        spacing: {
          section: 24,
          element: 16
        }
      },
      parameters: [
        {
          name: 'period',
          type: 'select',
          required: true,
          defaultValue: 'last_12_months',
          options: ['last_6_months', 'last_12_months', 'ytd', 'custom']
        },
        {
          name: 'include_benchmarks',
          type: 'boolean',
          required: false,
          defaultValue: true
        },
        {
          name: 'industry',
          type: 'select',
          required: false,
          defaultValue: 'accounting',
          options: ['accounting', 'consulting', 'retail', 'manufacturing', 'technology']
        }
      ]
    };
  }

  // Additional template creation methods...
  private async createBalanceSheetTemplate(): Promise<ReportTemplate> {
    // Implementation for balance sheet template
    return {} as ReportTemplate;
  }

  private async createTaxPreparationTemplate(): Promise<ReportTemplate> {
    // Implementation for tax preparation template
    return {} as ReportTemplate;
  }

  private async createComplianceTemplate(): Promise<ReportTemplate> {
    // Implementation for compliance template
    return {} as ReportTemplate;
  }

  // Report rendering methods
  private async renderSections(
    sections: ReportSection[],
    reportData: any,
    parameters: Record<string, any>
  ): Promise<RenderedSection[]> {
    const renderedSections: RenderedSection[] = [];

    for (const section of sections) {
      const rendered = await this.renderEngine.renderSection(section, reportData, parameters);
      renderedSections.push(rendered);
    }

    return renderedSections;
  }

  private async generateSummary(sections: RenderedSection[], data: any): Promise<string> {
    // Generate executive summary based on rendered sections
    const keyInsights = sections
      .filter(s => s.content.insights)
      .flatMap(s => s.content.insights);

    return `This report covers the period from ${format(data.dateRange.start, 'MMM dd, yyyy')} to ${format(data.dateRange.end, 'MMM dd, yyyy')}. Key findings include: ${keyInsights.slice(0, 3).join(', ')}.`;
  }

  private async generateRecommendations(sections: RenderedSection[], data: any): Promise<string[]> {
    // Generate recommendations based on analysis
    const recommendations: string[] = [];

    // Analyze key metrics and generate recommendations
    if (data.netMargin && data.netMargin < 0.05) {
      recommendations.push('Focus on improving profitability through cost reduction or pricing optimization');
    }

    if (data.currentRatio && data.currentRatio < 1.5) {
      recommendations.push('Monitor liquidity position and consider improving working capital management');
    }

    return recommendations;
  }

  // Utility methods
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private interpolateTitle(template: string, parameters: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => parameters[key] || match);
  }

  private async saveTemplate(template: ReportTemplate): Promise<void> {
    // Save to database
  }

  private async saveReport(report: GeneratedReport): Promise<void> {
    // Save to database
  }

  private async initializeScheduledReports(): Promise<void> {
    // Initialize scheduled report processing
  }

  async shutdown(): Promise<void> {
    console.log('Reporting Engine shut down');
  }
}

/**
 * Report Render Engine - Handles section rendering
 */
class ReportRenderEngine {
  async renderSection(
    section: ReportSection,
    data: any,
    parameters: Record<string, any>
  ): Promise<RenderedSection> {
    switch (section.type) {
      case 'text':
        return this.renderTextSection(section, data, parameters);
      case 'table':
        return this.renderTableSection(section, data, parameters);
      case 'chart':
        return this.renderChartSection(section, data, parameters);
      case 'metric':
        return this.renderMetricSection(section, data, parameters);
      default:
        throw new Error(`Unsupported section type: ${section.type}`);
    }
  }

  private async renderTextSection(
    section: ReportSection,
    data: any,
    parameters: Record<string, any>
  ): Promise<RenderedSection> {
    return {
      id: section.id,
      title: section.title,
      content: {
        type: 'text',
        html: '<p>Rendered text content</p>'
      },
      visualizations: []
    };
  }

  private async renderTableSection(
    section: ReportSection,
    data: any,
    parameters: Record<string, any>
  ): Promise<RenderedSection> {
    return {
      id: section.id,
      title: section.title,
      content: {
        type: 'table',
        data: [],
        columns: section.content.columns
      },
      visualizations: []
    };
  }

  private async renderChartSection(
    section: ReportSection,
    data: any,
    parameters: Record<string, any>
  ): Promise<RenderedSection> {
    const visualization: VisualizationResult = {
      id: `viz_${section.id}`,
      spec: {
        type: section.content.chartType,
        data: data[section.content.dataSource] || [],
        config: {
          responsive: true,
          interactive: true,
          theme: 'light'
        },
        title: section.title
      },
      renderedData: {},
      metadata: {
        generatedAt: new Date(),
        dataPoints: 0,
        renderTime: 0
      }
    };

    return {
      id: section.id,
      title: section.title,
      content: {
        type: 'chart',
        chartConfig: section.content
      },
      visualizations: [visualization]
    };
  }

  private async renderMetricSection(
    section: ReportSection,
    data: any,
    parameters: Record<string, any>
  ): Promise<RenderedSection> {
    const metrics = section.content.metrics.map((metricName: string) => ({
      name: metricName,
      value: data[metricName] || 0,
      trend: 'stable',
      change: 0
    }));

    return {
      id: section.id,
      title: section.title,
      content: {
        type: 'metrics',
        metrics
      },
      visualizations: []
    };
  }
}

/**
 * Report Data Engine - Handles data fetching and preparation
 */
class ReportDataEngine {
  async fetchReportData(
    organizationId: string,
    clientId: string | undefined,
    template: ReportTemplate,
    parameters: Record<string, any>
  ): Promise<any> {
    // Fetch data based on template requirements
    const dateRange = this.parseDateRange(parameters.period);

    return {
      dateRange,
      totalDataPoints: 0,
      // Data would be fetched based on template sections
    };
  }

  private parseDateRange(period: string): { start: Date; end: Date } {
    const now = new Date();

    switch (period) {
      case 'last_6_months':
        return {
          start: subDays(now, 180),
          end: now
        };
      case 'last_12_months':
        return {
          start: subDays(now, 365),
          end: now
        };
      case 'ytd':
        return {
          start: startOfYear(now),
          end: now
        };
      case 'current_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'current_quarter':
        return {
          start: startOfQuarter(now),
          end: endOfQuarter(now)
        };
      default:
        return {
          start: subDays(now, 365),
          end: now
        };
    }
  }
}

interface ScheduledReport {
  id: string;
  templateId: string;
  organizationId: string;
  clientId?: string;
  schedule: ScheduleConfig;
  parameters: Record<string, any>;
  lastRun?: Date;
  nextRun: Date;
  enabled: boolean;
}

export {
  ReportRenderEngine,
  ReportDataEngine
};

export type {
  ScheduledReport
};