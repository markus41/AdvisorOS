/**
 * Visualization Engine - Advanced Data Visualization and Interactive Charts
 * Creates sophisticated financial visualizations, dashboards, and interactive charts
 */

import { Decimal } from 'decimal.js';
import * as d3 from 'd3';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  VisualizationSpec,
  VisualizationConfig,
  VisualizationResult,
  AxisConfig,
  Annotation,
  FinancialData,
  InsightMetric
} from '../types';

export class VisualizationEngine {
  private chartRenderers: Map<string, ChartRenderer> = new Map();
  private themeManager: ThemeManager;
  private interactionManager: InteractionManager;
  private animationEngine: AnimationEngine;

  constructor(private config: VisualizationConfig) {
    this.themeManager = new ThemeManager();
    this.interactionManager = new InteractionManager();
    this.animationEngine = new AnimationEngine();
  }

  async initialize(): Promise<void> {
    // Initialize chart renderers
    this.chartRenderers.set('line', new LineChartRenderer());
    this.chartRenderers.set('bar', new BarChartRenderer());
    this.chartRenderers.set('pie', new PieChartRenderer());
    this.chartRenderers.set('scatter', new ScatterPlotRenderer());
    this.chartRenderers.set('heatmap', new HeatmapRenderer());
    this.chartRenderers.set('gauge', new GaugeChartRenderer());
    this.chartRenderers.set('table', new TableRenderer());
    this.chartRenderers.set('waterfall', new WaterfallChartRenderer());
    this.chartRenderers.set('treemap', new TreemapRenderer());
    this.chartRenderers.set('funnel', new FunnelChartRenderer());

    // Load themes
    await this.themeManager.initialize();

    console.log('Visualization Engine initialized');
  }

  /**
   * Create comprehensive financial dashboard
   */
  async createFinancialDashboard(
    organizationId: string,
    clientId?: string,
    config: DashboardConfig = {}
  ): Promise<Dashboard> {
    const dashboard = new Dashboard(organizationId, clientId, config);

    // Financial Overview Section
    const overviewSection = await this.createFinancialOverview(organizationId, clientId);
    dashboard.addSection('overview', overviewSection);

    // Revenue Analysis Section
    const revenueSection = await this.createRevenueAnalysis(organizationId, clientId);
    dashboard.addSection('revenue', revenueSection);

    // Cash Flow Section
    const cashFlowSection = await this.createCashFlowAnalysis(organizationId, clientId);
    dashboard.addSection('cashflow', cashFlowSection);

    // Expense Breakdown Section
    const expenseSection = await this.createExpenseAnalysis(organizationId, clientId);
    dashboard.addSection('expenses', expenseSection);

    // KPI Section
    const kpiSection = await this.createKPISection(organizationId, clientId);
    dashboard.addSection('kpis', kpiSection);

    // Risk Indicators Section
    const riskSection = await this.createRiskIndicators(organizationId, clientId);
    dashboard.addSection('risk', riskSection);

    return dashboard;
  }

  /**
   * Generate visualization from specification
   */
  async generateVisualization(spec: VisualizationSpec): Promise<VisualizationResult> {
    const renderer = this.chartRenderers.get(spec.type);
    if (!renderer) {
      throw new Error(`Unsupported visualization type: ${spec.type}`);
    }

    const startTime = Date.now();

    try {
      // Apply theme
      const themedConfig = this.themeManager.applyTheme(spec.config);

      // Prepare data
      const processedData = await this.prepareData(spec.data, spec.type);

      // Render visualization
      const renderedData = await renderer.render(processedData, themedConfig);

      // Add interactions if enabled
      if (themedConfig.interactive) {
        this.interactionManager.addInteractions(renderedData, themedConfig);
      }

      // Add animations if enabled
      if (themedConfig.animations !== false) {
        this.animationEngine.addAnimations(renderedData, spec.type);
      }

      const renderTime = Date.now() - startTime;

      return {
        id: this.generateVisualizationId(),
        spec,
        renderedData,
        metadata: {
          generatedAt: new Date(),
          dataPoints: processedData.length,
          renderTime
        }
      };

    } catch (error) {
      throw new Error(`Visualization generation failed: ${error.message}`);
    }
  }

  /**
   * Create real-time chart with live data updates
   */
  async createRealtimeChart(
    spec: VisualizationSpec,
    updateInterval: number = 5000
  ): Promise<RealtimeChart> {
    const chart = new RealtimeChart(spec, updateInterval);

    // Initial render
    const initialVisualization = await this.generateVisualization(spec);
    chart.setVisualization(initialVisualization);

    // Set up data update mechanism
    chart.onDataUpdate(async (newData) => {
      const updatedSpec = { ...spec, data: newData };
      const updatedVisualization = await this.generateVisualization(updatedSpec);
      chart.updateVisualization(updatedVisualization);
    });

    return chart;
  }

  /**
   * Create interactive data explorer
   */
  async createDataExplorer(
    data: any[],
    config: ExplorerConfig
  ): Promise<DataExplorer> {
    const explorer = new DataExplorer(data, config);

    // Create initial visualizations
    const summaryChart = await this.createSummaryVisualization(data);
    explorer.setSummaryChart(summaryChart);

    // Set up drill-down capabilities
    if (config.enableDrillDown) {
      explorer.enableDrillDown(async (filters) => {
        const filteredData = this.applyFilters(data, filters);
        return await this.createDetailVisualization(filteredData, config);
      });
    }

    // Add comparison capabilities
    if (config.enableComparison) {
      explorer.enableComparison(async (compareData) => {
        return await this.createComparisonVisualization(data, compareData);
      });
    }

    return explorer;
  }

  /**
   * Financial Overview Visualizations
   */
  private async createFinancialOverview(
    organizationId: string,
    clientId?: string
  ): Promise<DashboardSection> {
    const data = await this.fetchFinancialOverviewData(organizationId, clientId);

    const visualizations: VisualizationResult[] = [];

    // Key Metrics Cards
    const metricsSpec: VisualizationSpec = {
      type: 'metric_cards',
      data: data.keyMetrics,
      config: {
        layout: 'grid',
        columns: 4,
        showTrends: true,
        showBenchmarks: true,
        responsive: true,
        interactive: false
      },
      title: 'Key Financial Metrics'
    };
    visualizations.push(await this.generateVisualization(metricsSpec));

    // Financial Health Gauge
    const healthSpec: VisualizationSpec = {
      type: 'gauge',
      data: [{ value: data.healthScore, max: 100, label: 'Financial Health' }],
      config: {
        colors: ['#dc2626', '#f59e0b', '#10b981'],
        thresholds: [30, 70],
        responsive: true,
        interactive: true
      },
      title: 'Financial Health Score'
    };
    visualizations.push(await this.generateVisualization(healthSpec));

    return {
      id: 'financial_overview',
      title: 'Financial Overview',
      visualizations,
      layout: { columns: 2, gap: 16 }
    };
  }

  /**
   * Revenue Analysis Visualizations
   */
  private async createRevenueAnalysis(
    organizationId: string,
    clientId?: string
  ): Promise<DashboardSection> {
    const data = await this.fetchRevenueData(organizationId, clientId);

    const visualizations: VisualizationResult[] = [];

    // Revenue Trend Line Chart
    const trendSpec: VisualizationSpec = {
      type: 'line',
      data: data.monthlyRevenue,
      config: {
        xAxis: { label: 'Month', type: 'time' },
        yAxis: { label: 'Revenue', type: 'linear', format: 'currency' },
        colors: ['#3b82f6'],
        showPoints: true,
        showTrendline: true,
        responsive: true,
        interactive: true,
        annotations: data.seasonalMarkers
      },
      title: 'Revenue Trend'
    };
    visualizations.push(await this.generateVisualization(trendSpec));

    // Revenue by Category Pie Chart
    const categorySpec: VisualizationSpec = {
      type: 'pie',
      data: data.revenueByCategory,
      config: {
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        showLabels: true,
        showPercentages: true,
        responsive: true,
        interactive: true
      },
      title: 'Revenue by Category'
    };
    visualizations.push(await this.generateVisualization(categorySpec));

    // Revenue Growth Waterfall
    const growthSpec: VisualizationSpec = {
      type: 'waterfall',
      data: data.revenueGrowthFactors,
      config: {
        positiveColor: '#10b981',
        negativeColor: '#ef4444',
        totalColor: '#3b82f6',
        responsive: true,
        interactive: true
      },
      title: 'Revenue Growth Analysis'
    };
    visualizations.push(await this.generateVisualization(growthSpec));

    return {
      id: 'revenue_analysis',
      title: 'Revenue Analysis',
      visualizations,
      layout: { columns: 2, gap: 16 }
    };
  }

  /**
   * Cash Flow Analysis Visualizations
   */
  private async createCashFlowAnalysis(
    organizationId: string,
    clientId?: string
  ): Promise<DashboardSection> {
    const data = await this.fetchCashFlowData(organizationId, clientId);

    const visualizations: VisualizationResult[] = [];

    // Cash Flow Statement Bar Chart
    const statementSpec: VisualizationSpec = {
      type: 'bar',
      data: data.cashFlowStatement,
      config: {
        xAxis: { label: 'Period', type: 'category' },
        yAxis: { label: 'Cash Flow', type: 'linear', format: 'currency' },
        groupBy: 'category',
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
        stacked: false,
        showZeroLine: true,
        responsive: true,
        interactive: true
      },
      title: 'Cash Flow Statement'
    };
    visualizations.push(await this.generateVisualization(statementSpec));

    // Cash Balance Trend
    const balanceSpec: VisualizationSpec = {
      type: 'line',
      data: data.dailyCashBalance,
      config: {
        xAxis: { label: 'Date', type: 'time' },
        yAxis: { label: 'Cash Balance', type: 'linear', format: 'currency' },
        colors: ['#3b82f6'],
        area: true,
        showPoints: false,
        responsive: true,
        interactive: true,
        annotations: data.criticalLevels
      },
      title: 'Daily Cash Balance'
    };
    visualizations.push(await this.generateVisualization(balanceSpec));

    return {
      id: 'cashflow_analysis',
      title: 'Cash Flow Analysis',
      visualizations,
      layout: { columns: 2, gap: 16 }
    };
  }

  /**
   * Expense Analysis Visualizations
   */
  private async createExpenseAnalysis(
    organizationId: string,
    clientId?: string
  ): Promise<DashboardSection> {
    const data = await this.fetchExpenseData(organizationId, clientId);

    const visualizations: VisualizationResult[] = [];

    // Expense Breakdown Treemap
    const treemapSpec: VisualizationSpec = {
      type: 'treemap',
      data: data.expenseHierarchy,
      config: {
        valueField: 'amount',
        labelField: 'category',
        colorField: 'change',
        colors: ['#ef4444', '#f59e0b', '#10b981'],
        responsive: true,
        interactive: true
      },
      title: 'Expense Breakdown'
    };
    visualizations.push(await this.generateVisualization(treemapSpec));

    // Expense Trend Comparison
    const trendSpec: VisualizationSpec = {
      type: 'line',
      data: data.expenseTrends,
      config: {
        xAxis: { label: 'Month', type: 'time' },
        yAxis: { label: 'Amount', type: 'linear', format: 'currency' },
        groupBy: 'category',
        colors: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
        responsive: true,
        interactive: true
      },
      title: 'Expense Trends by Category'
    };
    visualizations.push(await this.generateVisualization(trendSpec));

    return {
      id: 'expense_analysis',
      title: 'Expense Analysis',
      visualizations,
      layout: { columns: 2, gap: 16 }
    };
  }

  /**
   * KPI Section Visualizations
   */
  private async createKPISection(
    organizationId: string,
    clientId?: string
  ): Promise<DashboardSection> {
    const data = await this.fetchKPIData(organizationId, clientId);

    const visualizations: VisualizationResult[] = [];

    // KPI Scorecard
    const scorecardSpec: VisualizationSpec = {
      type: 'scorecard',
      data: data.kpis,
      config: {
        layout: 'grid',
        columns: 3,
        showTrends: true,
        showTargets: true,
        showBenchmarks: true,
        responsive: true,
        interactive: true
      },
      title: 'Key Performance Indicators'
    };
    visualizations.push(await this.generateVisualization(scorecardSpec));

    // KPI Trends Radar Chart
    const radarSpec: VisualizationSpec = {
      type: 'radar',
      data: data.kpiComparison,
      config: {
        axes: data.kpiNames,
        series: ['current', 'previous', 'target'],
        colors: ['#3b82f6', '#94a3b8', '#10b981'],
        responsive: true,
        interactive: true
      },
      title: 'KPI Performance Comparison'
    };
    visualizations.push(await this.generateVisualization(radarSpec));

    return {
      id: 'kpi_section',
      title: 'Key Performance Indicators',
      visualizations,
      layout: { columns: 2, gap: 16 }
    };
  }

  /**
   * Risk Indicators Visualizations
   */
  private async createRiskIndicators(
    organizationId: string,
    clientId?: string
  ): Promise<DashboardSection> {
    const data = await this.fetchRiskData(organizationId, clientId);

    const visualizations: VisualizationResult[] = [];

    // Risk Matrix Heatmap
    const heatmapSpec: VisualizationSpec = {
      type: 'heatmap',
      data: data.riskMatrix,
      config: {
        xAxis: { label: 'Probability', type: 'category' },
        yAxis: { label: 'Impact', type: 'category' },
        colorScale: ['#10b981', '#f59e0b', '#ef4444'],
        responsive: true,
        interactive: true
      },
      title: 'Risk Assessment Matrix'
    };
    visualizations.push(await this.generateVisualization(heatmapSpec));

    // Risk Trends
    const trendSpec: VisualizationSpec = {
      type: 'line',
      data: data.riskTrends,
      config: {
        xAxis: { label: 'Date', type: 'time' },
        yAxis: { label: 'Risk Score', type: 'linear' },
        groupBy: 'riskType',
        colors: ['#ef4444', '#f59e0b', '#3b82f6'],
        responsive: true,
        interactive: true
      },
      title: 'Risk Score Trends'
    };
    visualizations.push(await this.generateVisualization(trendSpec));

    return {
      id: 'risk_indicators',
      title: 'Risk Indicators',
      visualizations,
      layout: { columns: 2, gap: 16 }
    };
  }

  // Data preparation methods
  private async prepareData(data: any[], chartType: string): Promise<any[]> {
    // Apply data transformations based on chart type
    switch (chartType) {
      case 'line':
      case 'bar':
        return this.prepareTimeSeriesData(data);
      case 'pie':
        return this.prepareCategoricalData(data);
      case 'scatter':
        return this.prepareScatterData(data);
      case 'heatmap':
        return this.prepareMatrixData(data);
      default:
        return data;
    }
  }

  private prepareTimeSeriesData(data: any[]): any[] {
    // Sort by date and ensure proper formatting
    return data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => ({
        ...d,
        date: new Date(d.date),
        value: typeof d.value === 'string' ? parseFloat(d.value) : d.value
      }));
  }

  private prepareCategoricalData(data: any[]): any[] {
    // Aggregate by category if needed
    const aggregated = data.reduce((acc, item) => {
      const key = item.category || item.label;
      if (!acc[key]) {
        acc[key] = { category: key, value: 0 };
      }
      acc[key].value += typeof item.value === 'string' ? parseFloat(item.value) : item.value;
      return acc;
    }, {});

    return Object.values(aggregated);
  }

  private prepareScatterData(data: any[]): any[] {
    // Ensure x and y values are numeric
    return data
      .filter(d => d.x !== undefined && d.y !== undefined)
      .map(d => ({
        ...d,
        x: typeof d.x === 'string' ? parseFloat(d.x) : d.x,
        y: typeof d.y === 'string' ? parseFloat(d.y) : d.y
      }));
  }

  private prepareMatrixData(data: any[]): any[] {
    // Prepare data for heatmap matrix
    return data.map(d => ({
      ...d,
      value: typeof d.value === 'string' ? parseFloat(d.value) : d.value
    }));
  }

  // Data fetching methods (would be implemented with actual database calls)
  private async fetchFinancialOverviewData(organizationId: string, clientId?: string): Promise<any> {
    return {
      keyMetrics: [],
      healthScore: 75
    };
  }

  private async fetchRevenueData(organizationId: string, clientId?: string): Promise<any> {
    return {
      monthlyRevenue: [],
      revenueByCategory: [],
      revenueGrowthFactors: [],
      seasonalMarkers: []
    };
  }

  private async fetchCashFlowData(organizationId: string, clientId?: string): Promise<any> {
    return {
      cashFlowStatement: [],
      dailyCashBalance: [],
      criticalLevels: []
    };
  }

  private async fetchExpenseData(organizationId: string, clientId?: string): Promise<any> {
    return {
      expenseHierarchy: [],
      expenseTrends: []
    };
  }

  private async fetchKPIData(organizationId: string, clientId?: string): Promise<any> {
    return {
      kpis: [],
      kpiComparison: [],
      kpiNames: []
    };
  }

  private async fetchRiskData(organizationId: string, clientId?: string): Promise<any> {
    return {
      riskMatrix: [],
      riskTrends: []
    };
  }

  // Utility methods
  private generateVisualizationId(): string {
    return `viz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private applyFilters(data: any[], filters: any): any[] {
    // Apply filters to data
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  private async createSummaryVisualization(data: any[]): Promise<VisualizationResult> {
    // Create summary visualization
    const spec: VisualizationSpec = {
      type: 'bar',
      data: data.slice(0, 10), // Top 10 items
      config: {
        responsive: true,
        interactive: true
      },
      title: 'Data Summary'
    };

    return await this.generateVisualization(spec);
  }

  private async createDetailVisualization(data: any[], config: ExplorerConfig): Promise<VisualizationResult> {
    // Create detail visualization
    const spec: VisualizationSpec = {
      type: config.detailChartType || 'line',
      data: data,
      config: {
        responsive: true,
        interactive: true
      },
      title: 'Detailed View'
    };

    return await this.generateVisualization(spec);
  }

  private async createComparisonVisualization(data1: any[], data2: any[]): Promise<VisualizationResult> {
    // Create comparison visualization
    const combinedData = [
      ...data1.map(d => ({ ...d, series: 'Current' })),
      ...data2.map(d => ({ ...d, series: 'Comparison' }))
    ];

    const spec: VisualizationSpec = {
      type: 'line',
      data: combinedData,
      config: {
        groupBy: 'series',
        responsive: true,
        interactive: true
      },
      title: 'Comparison View'
    };

    return await this.generateVisualization(spec);
  }

  async shutdown(): Promise<void> {
    console.log('Visualization Engine shut down');
  }
}

// Supporting classes (simplified implementations)
class ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Base render method
    return { svg: '', data };
  }
}

class LineChartRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Line chart implementation using D3
    return { type: 'line', data, config };
  }
}

class BarChartRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Bar chart implementation
    return { type: 'bar', data, config };
  }
}

class PieChartRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Pie chart implementation
    return { type: 'pie', data, config };
  }
}

class ScatterPlotRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Scatter plot implementation
    return { type: 'scatter', data, config };
  }
}

class HeatmapRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Heatmap implementation
    return { type: 'heatmap', data, config };
  }
}

class GaugeChartRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Gauge chart implementation
    return { type: 'gauge', data, config };
  }
}

class TableRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Table implementation
    return { type: 'table', data, config };
  }
}

class WaterfallChartRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Waterfall chart implementation
    return { type: 'waterfall', data, config };
  }
}

class TreemapRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Treemap implementation
    return { type: 'treemap', data, config };
  }
}

class FunnelChartRenderer extends ChartRenderer {
  async render(data: any[], config: any): Promise<any> {
    // Funnel chart implementation
    return { type: 'funnel', data, config };
  }
}

class ThemeManager {
  private themes: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    // Load default themes
    this.themes.set('light', {
      background: '#ffffff',
      text: '#374151',
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#10b981',
      grid: '#f3f4f6'
    });

    this.themes.set('dark', {
      background: '#1f2937',
      text: '#f9fafb',
      primary: '#60a5fa',
      secondary: '#9ca3af',
      accent: '#34d399',
      grid: '#374151'
    });
  }

  applyTheme(config: any): any {
    const theme = this.themes.get(config.theme || 'light');
    return {
      ...config,
      colors: config.colors || theme?.colors || ['#3b82f6', '#10b981', '#f59e0b'],
      backgroundColor: theme?.background,
      textColor: theme?.text
    };
  }
}

class InteractionManager {
  addInteractions(renderedData: any, config: any): void {
    // Add interactive capabilities
    if (config.enableZoom) {
      this.addZoomInteraction(renderedData);
    }

    if (config.enablePan) {
      this.addPanInteraction(renderedData);
    }

    if (config.enableTooltips) {
      this.addTooltips(renderedData);
    }
  }

  private addZoomInteraction(renderedData: any): void {
    // Add zoom functionality
  }

  private addPanInteraction(renderedData: any): void {
    // Add pan functionality
  }

  private addTooltips(renderedData: any): void {
    // Add tooltip functionality
  }
}

class AnimationEngine {
  addAnimations(renderedData: any, chartType: string): void {
    switch (chartType) {
      case 'line':
        this.addLineAnimations(renderedData);
        break;
      case 'bar':
        this.addBarAnimations(renderedData);
        break;
      case 'pie':
        this.addPieAnimations(renderedData);
        break;
    }
  }

  private addLineAnimations(renderedData: any): void {
    // Add line drawing animations
  }

  private addBarAnimations(renderedData: any): void {
    // Add bar growth animations
  }

  private addPieAnimations(renderedData: any): void {
    // Add pie slice animations
  }
}

class Dashboard {
  private sections: Map<string, DashboardSection> = new Map();

  constructor(
    private organizationId: string,
    private clientId: string | undefined,
    private config: DashboardConfig
  ) {}

  addSection(id: string, section: DashboardSection): void {
    this.sections.set(id, section);
  }

  getSections(): DashboardSection[] {
    return Array.from(this.sections.values());
  }

  getSection(id: string): DashboardSection | undefined {
    return this.sections.get(id);
  }
}

class RealtimeChart {
  private visualization: VisualizationResult | null = null;
  private updateCallbacks: Array<(data: any[]) => void> = [];

  constructor(
    private spec: VisualizationSpec,
    private updateInterval: number
  ) {}

  setVisualization(visualization: VisualizationResult): void {
    this.visualization = visualization;
  }

  updateVisualization(visualization: VisualizationResult): void {
    this.visualization = visualization;
    // Trigger UI update
  }

  onDataUpdate(callback: (data: any[]) => void): void {
    this.updateCallbacks.push(callback);
  }
}

class DataExplorer {
  private summaryChart: VisualizationResult | null = null;
  private drillDownCallback: ((filters: any) => Promise<VisualizationResult>) | null = null;
  private comparisonCallback: ((data: any[]) => Promise<VisualizationResult>) | null = null;

  constructor(
    private data: any[],
    private config: ExplorerConfig
  ) {}

  setSummaryChart(chart: VisualizationResult): void {
    this.summaryChart = chart;
  }

  enableDrillDown(callback: (filters: any) => Promise<VisualizationResult>): void {
    this.drillDownCallback = callback;
  }

  enableComparison(callback: (data: any[]) => Promise<VisualizationResult>): void {
    this.comparisonCallback = callback;
  }
}

// Configuration interfaces
interface DashboardConfig {
  theme?: string;
  layout?: 'grid' | 'free';
  responsive?: boolean;
  refreshInterval?: number;
}

interface DashboardSection {
  id: string;
  title: string;
  visualizations: VisualizationResult[];
  layout: {
    columns: number;
    gap: number;
  };
}

interface ExplorerConfig {
  enableDrillDown?: boolean;
  enableComparison?: boolean;
  detailChartType?: string;
  maxDataPoints?: number;
}

export {
  ChartRenderer,
  ThemeManager,
  InteractionManager,
  AnimationEngine,
  Dashboard,
  RealtimeChart,
  DataExplorer
};

export type {
  DashboardConfig,
  DashboardSection,
  ExplorerConfig
};