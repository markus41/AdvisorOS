import { ReportTemplate, ReportSection, DataRequirement, ChartConfig } from './index';

export const monthlyFinancialTemplate: ReportTemplate = {
  id: 'monthly-financial-package',
  name: 'Monthly Financial Package',
  description: 'Comprehensive monthly financial reporting package including P&L, Balance Sheet, Cash Flow, and KPI Dashboard',
  category: 'monthly_financial',
  type: 'financial_package',
  version: '1.0.0',
  layout: {
    pageSize: 'Letter',
    orientation: 'portrait',
    margins: {
      top: 72,
      right: 54,
      bottom: 72,
      left: 54,
    },
    header: {
      enabled: true,
      height: 50,
      content: 'Monthly Financial Report - {{client.businessName}} - {{reportDate}}',
    },
    footer: {
      enabled: true,
      height: 30,
      content: 'Page {{pageNumber}} of {{totalPages}} | Confidential',
    },
    coverPage: {
      enabled: true,
      template: 'financial-cover',
    },
    tableOfContents: {
      enabled: true,
      depth: 2,
    },
  },
  sections: [
    // Executive Summary
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      type: 'narrative',
      required: true,
      order: 1,
      config: {
        template: 'executive-summary',
        aiGenerated: true,
        includeKeyMetrics: true,
        includeHighlights: true,
        includeConcerns: true,
      },
      dataSource: 'financial_summary',
    },
    // Key Performance Indicators
    {
      id: 'kpi-dashboard',
      name: 'Key Performance Indicators',
      type: 'chart',
      required: true,
      order: 2,
      config: {
        layout: 'dashboard',
        metricsPerRow: 4,
        includeComparisons: true,
        showTrends: true,
      },
      dataSource: 'kpi_metrics',
    },
    // Profit & Loss Statement
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      type: 'financial_statement',
      required: true,
      order: 3,
      config: {
        statementType: 'profit_loss',
        includeComparisons: true,
        comparisonPeriods: ['previous_month', 'year_to_date', 'prior_year'],
        showVariance: true,
        includePercentages: true,
        groupByCategory: true,
      },
      dataSource: 'profit_loss_data',
    },
    // Balance Sheet
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      type: 'financial_statement',
      required: true,
      order: 4,
      config: {
        statementType: 'balance_sheet',
        includeComparisons: true,
        comparisonPeriods: ['previous_month', 'prior_year'],
        showRatios: true,
        includePercentages: true,
      },
      dataSource: 'balance_sheet_data',
    },
    // Cash Flow Statement
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      type: 'financial_statement',
      required: true,
      order: 5,
      config: {
        statementType: 'cash_flow',
        method: 'indirect',
        includeComparisons: true,
        comparisonPeriods: ['previous_month', 'year_to_date'],
        showCategories: ['operating', 'investing', 'financing'],
      },
      dataSource: 'cash_flow_data',
    },
    // Financial Ratios Analysis
    {
      id: 'financial-ratios',
      name: 'Financial Ratios Analysis',
      type: 'table',
      required: true,
      order: 6,
      config: {
        ratioCategories: ['liquidity', 'profitability', 'efficiency', 'leverage'],
        includeIndustryBenchmarks: true,
        showTrends: true,
        highlightConcerns: true,
      },
      dataSource: 'financial_ratios',
    },
    // Revenue Analysis
    {
      id: 'revenue-analysis',
      name: 'Revenue Analysis',
      type: 'chart',
      required: true,
      order: 7,
      config: {
        chartType: 'combination',
        includeCharts: ['monthly_trend', 'by_product', 'by_customer'],
        showGrowthRates: true,
        includeForecasting: true,
      },
      dataSource: 'revenue_data',
    },
    // Expense Analysis
    {
      id: 'expense-analysis',
      name: 'Expense Analysis',
      type: 'chart',
      required: true,
      order: 8,
      config: {
        chartType: 'combination',
        includeCharts: ['monthly_trend', 'by_category', 'variance_analysis'],
        showBudgetComparison: true,
        highlightAnomalies: true,
      },
      dataSource: 'expense_data',
    },
    // Cash Flow Projections
    {
      id: 'cash-flow-projections',
      name: 'Cash Flow Projections',
      type: 'chart',
      required: false,
      order: 9,
      config: {
        chartType: 'line',
        projectionPeriod: 12,
        includeScenarios: ['optimistic', 'realistic', 'pessimistic'],
        showConfidenceIntervals: true,
      },
      dataSource: 'cash_flow_projections',
    },
    // Management Commentary
    {
      id: 'management-commentary',
      name: 'Management Commentary',
      type: 'narrative',
      required: false,
      order: 10,
      config: {
        sections: ['performance_highlights', 'challenges', 'opportunities', 'action_items'],
        aiSuggestions: true,
        includeRecommendations: true,
      },
      dataSource: 'management_input',
    },
  ],
  dataRequirements: [
    {
      source: 'quickbooks',
      entity: 'profit_loss',
      fields: ['account', 'amount', 'date', 'period'],
      filters: { period: 'current_month' },
      required: true,
    },
    {
      source: 'quickbooks',
      entity: 'balance_sheet',
      fields: ['account', 'balance', 'date'],
      filters: { date: 'end_of_month' },
      required: true,
    },
    {
      source: 'quickbooks',
      entity: 'cash_flow',
      fields: ['category', 'amount', 'date', 'type'],
      filters: { period: 'current_month' },
      required: true,
    },
    {
      source: 'database',
      entity: 'client_kpis',
      fields: ['metric_name', 'value', 'target', 'previous_value'],
      required: true,
    },
    {
      source: 'calculated',
      entity: 'financial_ratios',
      fields: ['ratio_name', 'value', 'benchmark', 'trend'],
      required: true,
    },
  ],
  chartConfigs: [
    {
      id: 'kpi-metrics',
      type: 'gauge',
      title: 'Key Performance Metrics',
      dataSource: 'kpi_metrics',
      options: {
        layout: 'grid',
        metricsPerRow: 4,
        showTargets: true,
        colorCoding: true,
      },
    },
    {
      id: 'revenue-trend',
      type: 'line',
      title: 'Revenue Trend (12 Months)',
      dataSource: 'revenue_data',
      xAxis: 'month',
      yAxis: 'revenue',
      series: ['current_year', 'previous_year'],
      colors: ['#2563eb', '#94a3b8'],
    },
    {
      id: 'expense-breakdown',
      type: 'pie',
      title: 'Expense Breakdown',
      dataSource: 'expense_data',
      series: ['category'],
      colors: ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2'],
    },
    {
      id: 'cash-flow-forecast',
      type: 'area',
      title: 'Cash Flow Forecast',
      dataSource: 'cash_flow_projections',
      xAxis: 'month',
      yAxis: 'cash_balance',
      series: ['optimistic', 'realistic', 'pessimistic'],
      colors: ['#22c55e', '#3b82f6', '#ef4444'],
    },
  ],
  brandingOptions: {
    logo: {
      enabled: true,
      position: 'header',
      size: 'medium',
    },
    colors: {
      primary: '#1e40af',
      secondary: '#64748b',
      accent: '#3b82f6',
      text: '#1f2937',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      size: 'medium',
    },
    layout: {
      margins: 54,
      spacing: 16,
      columnCount: 1,
    },
  },
};