/**
 * Insight Engine - Automated Financial Analysis and Narrative Generation
 * Generates intelligent insights, identifies anomalies, and provides actionable recommendations
 */

import { Decimal } from 'decimal.js';
import * as stats from '../utils/statistics';
import { format, subDays, subMonths, isWithinInterval } from 'date-fns';
import {
  InsightRequest,
  GeneratedInsight,
  InsightMetric,
  DetectedAnomaly,
  AnomalyDetectionConfig,
  FinancialData,
  RiskScore,
  RiskScoringInput,
  BenchmarkComparison,
  VisualizationSpec
} from '../types';

export class InsightEngine {
  private anomalyDetectors: Map<string, AnomalyDetector> = new Map();
  private narrativeTemplates: Map<string, NarrativeTemplate> = new Map();
  private benchmarkData: Map<string, any> = new Map();

  constructor(private config: any) {}

  async initialize(): Promise<void> {
    // Initialize anomaly detection algorithms
    this.anomalyDetectors.set('statistical', new StatisticalAnomalyDetector());
    this.anomalyDetectors.set('ml', new MLAnomalyDetector());
    this.anomalyDetectors.set('rule_based', new RuleBasedAnomalyDetector());

    // Load narrative templates
    await this.loadNarrativeTemplates();

    // Load benchmark data
    await this.loadBenchmarkData();

    console.log('Insight Engine initialized');
  }

  /**
   * Generate comprehensive financial insights
   */
  async generateInsights(request: InsightRequest): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    try {
      // Fetch relevant financial data
      const financialData = await this.fetchFinancialData(request);

      // Generate different types of insights
      switch (request.analysisType) {
        case 'financial_health':
          insights.push(...await this.analyzeFinancialHealth(financialData, request));
          break;

        case 'variance_analysis':
          insights.push(...await this.analyzeVariances(financialData, request));
          break;

        case 'trend_analysis':
          insights.push(...await this.analyzeTrends(financialData, request));
          break;

        case 'anomaly_detection':
          insights.push(...await this.detectAnomalies(financialData, request));
          break;

        default:
          // Generate all types of insights
          insights.push(...await this.generateComprehensiveInsights(financialData, request));
      }

      // Apply benchmark comparisons if requested
      if (request.includeBenchmarks) {
        await this.addBenchmarkComparisons(insights, request);
      }

      // Generate narrative descriptions
      for (const insight of insights) {
        insight.narrative = await this.generateNarrative(insight);
      }

      return insights;

    } catch (error) {
      throw new Error(`Insight generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Financial Health Assessment
   */
  private async analyzeFinancialHealth(
    data: FinancialData[],
    request: InsightRequest
  ): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    // Calculate key financial health metrics
    const metrics = this.calculateFinancialHealthMetrics(data);

    // Cash flow analysis
    const cashFlowInsight = await this.analyzeCashFlow(data, metrics);
    if (cashFlowInsight) insights.push(cashFlowInsight);

    // Profitability analysis
    const profitabilityInsight = await this.analyzeProfitability(data, metrics);
    if (profitabilityInsight) insights.push(profitabilityInsight);

    // Liquidity analysis
    const liquidityInsight = await this.analyzeLiquidity(data, metrics);
    if (liquidityInsight) insights.push(liquidityInsight);

    // Debt analysis
    const debtInsight = await this.analyzeDebt(data, metrics);
    if (debtInsight) insights.push(debtInsight);

    return insights;
  }

  /**
   * Budget Variance Analysis
   */
  private async analyzeVariances(
    data: FinancialData[],
    request: InsightRequest
  ): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    // Fetch budget data
    const budgetData = await this.fetchBudgetData(request.organizationId, request.clientId);

    // Calculate variances by category
    const variances = this.calculateVariances(data, budgetData, request.period);

    // Identify significant variances
    const significantVariances = variances.filter(v => Math.abs(v.percentageVariance) > 10);

    for (const variance of significantVariances) {
      const insight = await this.createVarianceInsight(variance, data);
      insights.push(insight);
    }

    // Overall budget performance insight
    const overallInsight = await this.createOverallBudgetInsight(variances);
    insights.push(overallInsight);

    return insights;
  }

  /**
   * Trend Analysis
   */
  private async analyzeTrends(
    data: FinancialData[],
    request: InsightRequest
  ): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    // Revenue trends
    const revenueTrend = this.calculateTrend(
      data.filter(d => d.type === 'income'),
      'revenue'
    );
    if (revenueTrend.significance > 0.7) {
      insights.push(await this.createTrendInsight(revenueTrend, 'revenue'));
    }

    // Expense trends
    const expenseTrend = this.calculateTrend(
      data.filter(d => d.type === 'expense'),
      'expenses'
    );
    if (expenseTrend.significance > 0.7) {
      insights.push(await this.createTrendInsight(expenseTrend, 'expenses'));
    }

    // Category-specific trends
    const categories = [...new Set(data.map(d => d.category))];
    for (const category of categories) {
      const categoryData = data.filter(d => d.category === category);
      if (categoryData.length > 5) {
        const trend = this.calculateTrend(categoryData, category);
        if (trend.significance > 0.8) {
          insights.push(await this.createTrendInsight(trend, category));
        }
      }
    }

    return insights;
  }

  /**
   * Anomaly Detection
   */
  private async detectAnomalies(
    data: FinancialData[],
    request: InsightRequest
  ): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    const config: AnomalyDetectionConfig = {
      sensitivity: 0.8,
      methods: ['statistical', 'ml', 'rule_based'],
      thresholds: {
        transaction: 3.0, // Standard deviations
        pattern: 0.9,     // Probability threshold
        benchmark: 0.2    // 20% deviation threshold
      },
      exclusions: []
    };

    // Detect transaction anomalies
    const transactionAnomalies = await this.detectTransactionAnomalies(data, config);
    for (const anomaly of transactionAnomalies) {
      insights.push(await this.createAnomalyInsight(anomaly));
    }

    // Detect pattern anomalies
    const patternAnomalies = await this.detectPatternAnomalies(data, config);
    for (const anomaly of patternAnomalies) {
      insights.push(await this.createAnomalyInsight(anomaly));
    }

    // Detect benchmark deviations
    if (request.includeBenchmarks) {
      const benchmarkAnomalies = await this.detectBenchmarkAnomalies(data, config, request);
      for (const anomaly of benchmarkAnomalies) {
        insights.push(await this.createAnomalyInsight(anomaly));
      }
    }

    return insights;
  }

  /**
   * Client Risk Scoring
   */
  async generateRiskScore(input: RiskScoringInput): Promise<RiskScore> {
    const { clientId, includeFinancial, includeBehavioral, includeMarket, timeWindow } = input;

    // Fetch relevant data
    const financialData = await this.fetchClientFinancialData(clientId, timeWindow);
    const behavioralData = includeBehavioral ? await this.fetchBehavioralData(clientId, timeWindow) : null;
    const marketData = includeMarket ? await this.fetchMarketData(timeWindow) : null;

    // Calculate component scores
    const financialScore = includeFinancial ? this.calculateFinancialRisk(financialData) : 50;
    const behavioralScore = includeBehavioral ? this.calculateBehavioralRisk(behavioralData!) : 50;
    const marketScore = includeMarket ? this.calculateMarketRisk(marketData!) : 50;

    // Weight and combine scores
    const weights = this.getRiskWeights(includeFinancial, includeBehavioral, includeMarket);
    const overallScore = Math.round(
      financialScore * weights.financial +
      behavioralScore * weights.behavioral +
      marketScore * weights.market
    );

    // Determine trend
    const historicalScores = await this.getHistoricalRiskScores(clientId);
    const trend = this.calculateRiskTrend(historicalScores, overallScore);

    // Generate risk factors and recommendations
    const factors = this.identifyRiskFactors(financialData, behavioralData, marketData);
    const recommendations = this.generateRiskRecommendations(overallScore, factors);

    return {
      clientId,
      overallScore,
      components: {
        financial: financialScore,
        behavioral: behavioralScore,
        market: marketScore
      },
      factors,
      trend,
      recommendations,
      lastUpdated: new Date()
    };
  }

  /**
   * Automated KPI Analysis
   */
  async analyzeKPIs(
    organizationId: string,
    clientId: string | undefined,
    period: { start: Date; end: Date }
  ): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    // Define key KPIs
    const kpis = [
      'revenue_growth',
      'gross_margin',
      'operating_margin',
      'current_ratio',
      'quick_ratio',
      'debt_to_equity',
      'return_on_assets',
      'days_sales_outstanding',
      'inventory_turnover',
      'cash_conversion_cycle'
    ];

    // Calculate current KPI values
    const currentKPIs = await this.calculateKPIs(organizationId, clientId, period);

    // Compare with previous period
    const previousPeriod = {
      start: subDays(period.start, 365),
      end: subDays(period.end, 365)
    };
    const previousKPIs = await this.calculateKPIs(organizationId, clientId, previousPeriod);

    // Analyze each KPI
    for (const kpi of kpis) {
      const current = currentKPIs[kpi];
      const previous = previousKPIs[kpi];

      if (current !== undefined && previous !== undefined) {
        const change = ((current - previous) / previous) * 100;
        const insight = await this.createKPIInsight(kpi, current, previous, change);

        if (insight) insights.push(insight);
      }
    }

    return insights;
  }

  // Helper methods for financial health analysis
  private calculateFinancialHealthMetrics(data: FinancialData[]): Record<string, any> {
    const revenue = this.sumByType(data, 'income');
    const expenses = this.sumByType(data, 'expense');
    const assets = this.sumByType(data, 'asset');
    const liabilities = this.sumByType(data, 'liability');

    return {
      totalRevenue: revenue,
      totalExpenses: expenses,
      netIncome: revenue.minus(expenses),
      totalAssets: assets,
      totalLiabilities: liabilities,
      equity: assets.minus(liabilities),
      grossMargin: revenue.gt(0) ? revenue.minus(expenses).div(revenue) : new Decimal(0),
      debtToEquity: assets.minus(liabilities).gt(0) ? liabilities.div(assets.minus(liabilities)) : new Decimal(0),
      currentRatio: this.calculateCurrentRatio(data),
      quickRatio: this.calculateQuickRatio(data)
    };
  }

  private async analyzeCashFlow(data: FinancialData[], metrics: any): Promise<GeneratedInsight | null> {
    const cashFlowData = this.calculateCashFlow(data);

    if (cashFlowData.length === 0) return null;

    const avgCashFlow = stats.mean(cashFlowData.map(cf => parseFloat(cf.netFlow.toString())));
    const cashFlowVolatility = stats.standardDeviation(cashFlowData.map(cf => parseFloat(cf.netFlow.toString())));

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let title = 'Cash Flow Analysis';
    let description = '';
    let recommendations: string[] = [];

    if (avgCashFlow < 0) {
      severity = avgCashFlow < -10000 ? 'critical' : 'high';
      title = 'Negative Cash Flow Detected';
      description = `Average cash flow is negative at ${format(avgCashFlow, '$0,0')} per period.`;
      recommendations.push('Review expense categories for cost reduction opportunities');
      recommendations.push('Accelerate accounts receivable collection');
      recommendations.push('Consider invoice factoring or line of credit');
    } else if (cashFlowVolatility > avgCashFlow * 0.5) {
      severity = 'medium';
      title = 'High Cash Flow Volatility';
      description = `Cash flow shows high volatility with standard deviation of ${format(cashFlowVolatility, '$0,0')}.`;
      recommendations.push('Implement better cash flow forecasting');
      recommendations.push('Diversify revenue streams');
      recommendations.push('Build larger cash reserves');
    }

    return {
      id: this.generateInsightId(),
      type: 'cash_flow_analysis',
      severity,
      title,
      description,
      narrative: '', // Will be generated later
      recommendations,
      metrics: [
        {
          name: 'Average Cash Flow',
          value: new Decimal(avgCashFlow),
          trend: avgCashFlow > 0 ? 'up' : 'down',
          unit: 'currency'
        },
        {
          name: 'Cash Flow Volatility',
          value: new Decimal(cashFlowVolatility),
          trend: 'stable',
          unit: 'currency'
        }
      ],
      visualizations: [
        {
          type: 'line',
          data: cashFlowData.map(cf => ({
            date: cf.date,
            value: parseFloat(cf.netFlow.toString())
          })),
          config: {
            responsive: true,
            interactive: true,
            theme: 'light'
          },
          title: 'Cash Flow Trend',
          description: 'Net cash flow over time'
        }
      ],
      confidence: 0.9,
      createdAt: new Date()
    };
  }

  private async analyzeProfitability(data: FinancialData[], metrics: any): Promise<GeneratedInsight | null> {
    const { grossMargin, netIncome, totalRevenue } = metrics;

    if (totalRevenue.lte(0)) return null;

    const netMargin = netIncome.div(totalRevenue);
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendations: string[] = [];

    if (netMargin.lt(0)) {
      severity = 'critical';
      recommendations.push('Immediate cost reduction required');
      recommendations.push('Review pricing strategy');
      recommendations.push('Eliminate unprofitable products/services');
    } else if (netMargin.lt(0.05)) {
      severity = 'high';
      recommendations.push('Improve operational efficiency');
      recommendations.push('Optimize pricing and product mix');
    }

    return {
      id: this.generateInsightId(),
      type: 'profitability_analysis',
      severity,
      title: `Profitability Analysis - ${netMargin.mul(100).toFixed(1)}% Net Margin`,
      description: `Net margin is ${netMargin.mul(100).toFixed(1)}% with gross margin of ${grossMargin.mul(100).toFixed(1)}%.`,
      narrative: '',
      recommendations,
      metrics: [
        {
          name: 'Net Margin',
          value: netMargin.mul(100),
          trend: netMargin.gt(0.1) ? 'up' : 'down',
          unit: 'percentage'
        },
        {
          name: 'Gross Margin',
          value: grossMargin.mul(100),
          trend: 'stable',
          unit: 'percentage'
        }
      ],
      visualizations: [],
      confidence: 0.85,
      createdAt: new Date()
    };
  }

  private async analyzeLiquidity(data: FinancialData[], metrics: any): Promise<GeneratedInsight | null> {
    const { currentRatio, quickRatio } = metrics;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendations: string[] = [];

    if (currentRatio.lt(1.0)) {
      severity = 'critical';
      recommendations.push('Immediate liquidity concerns - current liabilities exceed current assets');
      recommendations.push('Consider emergency funding options');
    } else if (currentRatio.lt(1.5)) {
      severity = 'medium';
      recommendations.push('Monitor liquidity closely');
      recommendations.push('Improve working capital management');
    }

    return {
      id: this.generateInsightId(),
      type: 'liquidity_analysis',
      severity,
      title: `Liquidity Analysis - Current Ratio: ${currentRatio.toFixed(2)}`,
      description: `Current ratio is ${currentRatio.toFixed(2)} and quick ratio is ${quickRatio.toFixed(2)}.`,
      narrative: '',
      recommendations,
      metrics: [
        {
          name: 'Current Ratio',
          value: currentRatio,
          trend: currentRatio.gt(1.5) ? 'up' : 'down',
          unit: 'ratio'
        },
        {
          name: 'Quick Ratio',
          value: quickRatio,
          trend: 'stable',
          unit: 'ratio'
        }
      ],
      visualizations: [],
      confidence: 0.8,
      createdAt: new Date()
    };
  }

  private async analyzeDebt(data: FinancialData[], metrics: any): Promise<GeneratedInsight | null> {
    const { debtToEquity, totalLiabilities, equity } = metrics;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendations: string[] = [];

    if (debtToEquity.gt(3.0)) {
      severity = 'critical';
      recommendations.push('Debt levels are concerning - consider debt restructuring');
      recommendations.push('Focus on debt reduction strategy');
    } else if (debtToEquity.gt(2.0)) {
      severity = 'high';
      recommendations.push('Monitor debt levels closely');
      recommendations.push('Avoid taking on additional debt');
    }

    return {
      id: this.generateInsightId(),
      type: 'debt_analysis',
      severity,
      title: `Debt Analysis - D/E Ratio: ${debtToEquity.toFixed(2)}`,
      description: `Debt-to-equity ratio is ${debtToEquity.toFixed(2)} with total liabilities of ${totalLiabilities.toFixed(0)}.`,
      narrative: '',
      recommendations,
      metrics: [
        {
          name: 'Debt-to-Equity Ratio',
          value: debtToEquity,
          trend: debtToEquity.lt(1.5) ? 'down' : 'up',
          unit: 'ratio'
        },
        {
          name: 'Total Liabilities',
          value: totalLiabilities,
          trend: 'stable',
          unit: 'currency'
        }
      ],
      visualizations: [],
      confidence: 0.8,
      createdAt: new Date()
    };
  }

  // Utility methods
  private sumByType(data: FinancialData[], type: string): Decimal {
    return data
      .filter(d => d.type === type)
      .reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
  }

  private calculateCurrentRatio(data: FinancialData[]): Decimal {
    const currentAssets = this.sumByCategory(data, 'asset', ['cash', 'accounts_receivable', 'inventory']);
    const currentLiabilities = this.sumByCategory(data, 'liability', ['accounts_payable', 'short_term_debt']);

    return currentLiabilities.gt(0) ? currentAssets.div(currentLiabilities) : new Decimal(0);
  }

  private calculateQuickRatio(data: FinancialData[]): Decimal {
    const quickAssets = this.sumByCategory(data, 'asset', ['cash', 'accounts_receivable']);
    const currentLiabilities = this.sumByCategory(data, 'liability', ['accounts_payable', 'short_term_debt']);

    return currentLiabilities.gt(0) ? quickAssets.div(currentLiabilities) : new Decimal(0);
  }

  private sumByCategory(data: FinancialData[], type: string, categories: string[]): Decimal {
    return data
      .filter(d => d.type === type && categories.includes(d.category))
      .reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
  }

  private calculateCashFlow(data: FinancialData[]): any[] {
    // Implementation would calculate actual cash flow from financial data
    return [];
  }

  private calculateTrend(data: FinancialData[], metric: string): any {
    const values = data.map(d => parseFloat(d.amount.toString()));
    const dates = data.map(d => d.timestamp.getTime());

    // Linear regression for trend
    const regression = stats.linearRegression(dates.map((d, i) => [i, values[i]]));

    return {
      slope: regression.m,
      intercept: regression.b,
      correlation: stats.sampleCorrelation(dates.map((_, i) => i), values),
      significance: Math.abs(stats.sampleCorrelation(dates.map((_, i) => i), values)),
      direction: regression.m > 0 ? 'increasing' : 'decreasing'
    };
  }

  private async createTrendInsight(trend: any, metric: string): Promise<GeneratedInsight> {
    const severity = trend.significance > 0.9 ? 'high' : 'medium';
    const direction = trend.direction === 'increasing' ? 'rising' : 'falling';

    return {
      id: this.generateInsightId(),
      type: 'trend_analysis',
      severity,
      title: `${metric.toUpperCase()} Trend: ${direction}`,
      description: `${metric} shows a ${direction} trend with ${(trend.significance * 100).toFixed(0)}% confidence.`,
      narrative: '',
      recommendations: this.getTrendRecommendations(metric, trend.direction),
      metrics: [],
      visualizations: [],
      confidence: trend.significance,
      createdAt: new Date()
    };
  }

  private getTrendRecommendations(metric: string, direction: string): string[] {
    const recommendations: Record<string, Record<string, string[]>> = {
      revenue: {
        increasing: ['Continue successful strategies', 'Scale operations', 'Monitor market saturation'],
        decreasing: ['Review marketing strategy', 'Analyze customer churn', 'Diversify revenue streams']
      },
      expenses: {
        increasing: ['Review cost control measures', 'Identify efficiency opportunities', 'Renegotiate vendor contracts'],
        decreasing: ['Maintain cost discipline', 'Ensure quality is not compromised', 'Consider strategic investments']
      }
    };

    return recommendations[metric]?.[direction] || ['Monitor trend closely', 'Investigate underlying causes'];
  }

  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async fetchFinancialData(request: InsightRequest): Promise<FinancialData[]> {
    // Implementation would fetch from database
    return [];
  }

  private async fetchBudgetData(organizationId: string, clientId?: string): Promise<any[]> {
    // Implementation would fetch budget data
    return [];
  }

  private async fetchClientFinancialData(clientId: string, timeWindow: number): Promise<FinancialData[]> {
    // Implementation would fetch client financial data
    return [];
  }

  private async fetchBehavioralData(clientId: string, timeWindow: number): Promise<any> {
    // Implementation would fetch behavioral data
    return {};
  }

  private async fetchMarketData(timeWindow: number): Promise<any> {
    // Implementation would fetch market data
    return {};
  }

  // Missing method implementations

  /**
   * Load narrative templates for insight generation
   */
  private async loadNarrativeTemplates(): Promise<void> {
    // Placeholder implementation - load narrative templates
    this.narrativeTemplates.set('financial_health', {
      pattern: 'financial_health',
      template: 'Financial health analysis shows {metrics} with {trend} trend.',
      variables: ['metrics', 'trend']
    });

    this.narrativeTemplates.set('variance_analysis', {
      pattern: 'variance_analysis',
      template: 'Budget variance analysis reveals {variance}% difference from planned values.',
      variables: ['variance']
    });

    this.narrativeTemplates.set('trend_analysis', {
      pattern: 'trend_analysis',
      template: '{metric} shows a {direction} trend with {confidence}% confidence.',
      variables: ['metric', 'direction', 'confidence']
    });

    console.log('Narrative templates loaded');
  }

  /**
   * Load benchmark data for comparisons
   */
  private async loadBenchmarkData(): Promise<void> {
    // Placeholder implementation - load industry benchmark data
    this.benchmarkData.set('technology', {
      industry: 'technology',
      metrics: {
        gross_margin: 0.65,
        operating_margin: 0.20,
        current_ratio: 2.1,
        debt_to_equity: 0.4
      }
    });

    this.benchmarkData.set('healthcare', {
      industry: 'healthcare',
      metrics: {
        gross_margin: 0.45,
        operating_margin: 0.15,
        current_ratio: 1.8,
        debt_to_equity: 0.6
      }
    });

    console.log('Benchmark data loaded');
  }

  /**
   * Generate comprehensive insights for all analysis types
   */
  private async generateComprehensiveInsights(
    data: FinancialData[],
    request: InsightRequest
  ): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    // Generate all types of insights
    insights.push(...await this.analyzeFinancialHealth(data, request));
    insights.push(...await this.analyzeVariances(data, request));
    insights.push(...await this.analyzeTrends(data, request));
    insights.push(...await this.detectAnomalies(data, request));

    return insights;
  }

  /**
   * Add benchmark comparisons to insights
   */
  private async addBenchmarkComparisons(
    insights: GeneratedInsight[],
    request: InsightRequest
  ): Promise<void> {
    // Placeholder implementation - add benchmark comparisons
    for (const insight of insights) {
      // Add benchmark data to insight metrics
      insight.metrics.forEach(metric => {
        if (metric.name === 'Gross Margin' && this.benchmarkData.has('technology')) {
          const benchmark = this.benchmarkData.get('technology');
          metric.benchmark = new Decimal(benchmark.metrics.gross_margin * 100);
        }
      });
    }
  }

  /**
   * Generate narrative description for insights
   */
  private async generateNarrative(insight: GeneratedInsight): Promise<string> {
    const template = this.narrativeTemplates.get(insight.type);

    if (!template) {
      return `Analysis of ${insight.type} reveals ${insight.description}`;
    }

    // Simple template replacement - in production this would be more sophisticated
    let narrative = template.template;

    // Replace common variables
    narrative = narrative.replace('{metrics}', insight.metrics.map(m => m.name).join(', '));
    narrative = narrative.replace('{trend}', insight.metrics[0]?.trend || 'stable');
    narrative = narrative.replace('{confidence}', Math.round(insight.confidence * 100).toString());

    return narrative;
  }

  /**
   * Calculate variances between actual and budget data
   */
  private calculateVariances(
    actualData: FinancialData[],
    budgetData: any[],
    period: { start: Date; end: Date }
  ): any[] {
    // Placeholder implementation - calculate budget variances
    const variances: any[] = [];

    // Group actual data by category
    const actualByCategory = this.groupByCategory(actualData);

    // Compare with budget (simplified implementation)
    Object.keys(actualByCategory).forEach(category => {
      const actualAmount = actualByCategory[category];
      const budgetAmount = 10000; // Placeholder budget amount
      const variance = actualAmount - budgetAmount;
      const percentageVariance = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

      variances.push({
        category,
        actual: actualAmount,
        budget: budgetAmount,
        variance,
        percentageVariance
      });
    });

    return variances;
  }

  /**
   * Create variance insight from variance data
   */
  private async createVarianceInsight(variance: any, data: FinancialData[]): Promise<GeneratedInsight> {
    const severity = Math.abs(variance.percentageVariance) > 25 ? 'high' : 'medium';

    return {
      id: this.generateInsightId(),
      type: 'variance_analysis',
      severity,
      title: `${variance.category} Budget Variance: ${variance.percentageVariance.toFixed(1)}%`,
      description: `${variance.category} shows ${variance.percentageVariance > 0 ? 'over' : 'under'} budget by ${Math.abs(variance.percentageVariance).toFixed(1)}%`,
      narrative: '',
      recommendations: this.getVarianceRecommendations(variance),
      metrics: [
        {
          name: 'Actual Amount',
          value: new Decimal(variance.actual),
          trend: 'stable',
          unit: 'currency'
        },
        {
          name: 'Budget Amount',
          value: new Decimal(variance.budget),
          trend: 'stable',
          unit: 'currency'
        },
        {
          name: 'Variance %',
          value: new Decimal(variance.percentageVariance),
          trend: variance.percentageVariance > 0 ? 'up' : 'down',
          unit: 'percentage'
        }
      ],
      visualizations: [],
      confidence: 0.85,
      createdAt: new Date()
    };
  }

  /**
   * Create overall budget insight
   */
  private async createOverallBudgetInsight(variances: any[]): Promise<GeneratedInsight> {
    const totalVariance = variances.reduce((sum, v) => sum + v.variance, 0);
    const avgVariancePercent = stats.mean(variances.map(v => Math.abs(v.percentageVariance)));

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (avgVariancePercent > 25) severity = 'high';
    else if (avgVariancePercent > 15) severity = 'medium';

    return {
      id: this.generateInsightId(),
      type: 'budget_performance',
      severity,
      title: `Overall Budget Performance`,
      description: `Budget performance shows average variance of ${avgVariancePercent.toFixed(1)}%`,
      narrative: '',
      recommendations: [
        'Review budget planning process',
        'Implement more frequent budget reviews',
        'Improve forecasting accuracy'
      ],
      metrics: [
        {
          name: 'Total Variance',
          value: new Decimal(totalVariance),
          trend: totalVariance > 0 ? 'up' : 'down',
          unit: 'currency'
        },
        {
          name: 'Average Variance %',
          value: new Decimal(avgVariancePercent),
          trend: 'stable',
          unit: 'percentage'
        }
      ],
      visualizations: [],
      confidence: 0.8,
      createdAt: new Date()
    };
  }

  // Helper methods

  private groupByCategory(data: FinancialData[]): Record<string, number> {
    return data.reduce((acc, item) => {
      const category = item.category;
      acc[category] = (acc[category] || 0) + parseFloat(item.amount.toString());
      return acc;
    }, {} as Record<string, number>);
  }

  private getVarianceRecommendations(variance: any): string[] {
    if (variance.percentageVariance > 15) {
      return [
        `Investigate causes of ${variance.category} overspend`,
        'Implement tighter cost controls',
        'Review approval processes'
      ];
    } else if (variance.percentageVariance < -15) {
      return [
        `Analyze ${variance.category} underspend`,
        'Consider budget reallocation',
        'Review if targets are realistic'
      ];
    }
    return ['Monitor variance trends', 'Maintain current controls'];
  }

  private async detectTransactionAnomalies(data: FinancialData[], config: AnomalyDetectionConfig): Promise<DetectedAnomaly[]> {
    // Placeholder implementation
    return [];
  }

  private async detectPatternAnomalies(data: FinancialData[], config: AnomalyDetectionConfig): Promise<DetectedAnomaly[]> {
    // Placeholder implementation
    return [];
  }

  private async detectBenchmarkAnomalies(data: FinancialData[], config: AnomalyDetectionConfig, request: InsightRequest): Promise<DetectedAnomaly[]> {
    // Placeholder implementation
    return [];
  }

  private async createAnomalyInsight(anomaly: DetectedAnomaly): Promise<GeneratedInsight> {
    // Placeholder implementation
    return {
      id: this.generateInsightId(),
      type: 'anomaly_detection',
      severity: anomaly.severity,
      title: `Anomaly Detected: ${anomaly.type}`,
      description: anomaly.description,
      narrative: '',
      recommendations: anomaly.suggestedActions,
      metrics: [],
      visualizations: [],
      confidence: anomaly.confidence,
      createdAt: new Date()
    };
  }

  private async calculateKPIs(organizationId: string, clientId: string | undefined, period: { start: Date; end: Date }): Promise<Record<string, number>> {
    // Placeholder implementation
    return {
      revenue_growth: 10.5,
      gross_margin: 65.2,
      operating_margin: 20.1,
      current_ratio: 2.1,
      quick_ratio: 1.8,
      debt_to_equity: 0.4,
      return_on_assets: 15.3,
      days_sales_outstanding: 45,
      inventory_turnover: 6.2,
      cash_conversion_cycle: 35
    };
  }

  private async createKPIInsight(kpi: string, current: number, previous: number, change: number): Promise<GeneratedInsight | null> {
    if (Math.abs(change) < 5) return null; // Only create insights for significant changes

    const severity = Math.abs(change) > 20 ? 'high' : 'medium';

    return {
      id: this.generateInsightId(),
      type: 'kpi_analysis',
      severity,
      title: `${kpi.replace('_', ' ').toUpperCase()} Change: ${change.toFixed(1)}%`,
      description: `${kpi} has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}%`,
      narrative: '',
      recommendations: this.getKPIRecommendations(kpi, change),
      metrics: [
        {
          name: 'Current Value',
          value: new Decimal(current),
          trend: change > 0 ? 'up' : 'down',
          unit: this.getKPIUnit(kpi)
        },
        {
          name: 'Previous Value',
          value: new Decimal(previous),
          trend: 'stable',
          unit: this.getKPIUnit(kpi)
        },
        {
          name: 'Change %',
          value: new Decimal(change),
          trend: change > 0 ? 'up' : 'down',
          unit: 'percentage'
        }
      ],
      visualizations: [],
      confidence: 0.85,
      createdAt: new Date()
    };
  }

  private getKPIRecommendations(kpi: string, change: number): string[] {
    const recommendations: Record<string, Record<string, string[]>> = {
      revenue_growth: {
        positive: ['Scale successful strategies', 'Invest in growth opportunities'],
        negative: ['Review marketing effectiveness', 'Analyze customer retention']
      },
      gross_margin: {
        positive: ['Maintain cost discipline', 'Consider price optimization'],
        negative: ['Review supplier costs', 'Improve operational efficiency']
      }
    };

    const direction = change > 0 ? 'positive' : 'negative';
    return recommendations[kpi]?.[direction] || ['Monitor trend closely'];
  }

  private getKPIUnit(kpi: string): string {
    const units: Record<string, string> = {
      revenue_growth: 'percentage',
      gross_margin: 'percentage',
      operating_margin: 'percentage',
      current_ratio: 'ratio',
      quick_ratio: 'ratio',
      debt_to_equity: 'ratio',
      return_on_assets: 'percentage',
      days_sales_outstanding: 'days',
      inventory_turnover: 'ratio',
      cash_conversion_cycle: 'days'
    };

    return units[kpi] || 'number';
  }

  private calculateFinancialRisk(data: FinancialData[]): number {
    // Placeholder implementation
    return 35; // Low to medium risk
  }

  private calculateBehavioralRisk(data: any): number {
    // Placeholder implementation
    return 25; // Low risk
  }

  private calculateMarketRisk(data: any): number {
    // Placeholder implementation
    return 45; // Medium risk
  }

  private getRiskWeights(includeFinancial: boolean, includeBehavioral: boolean, includeMarket: boolean): { financial: number; behavioral: number; market: number } {
    const weights = { financial: 0, behavioral: 0, market: 0 };
    let total = 0;

    if (includeFinancial) { weights.financial = 0.5; total += 0.5; }
    if (includeBehavioral) { weights.behavioral = 0.3; total += 0.3; }
    if (includeMarket) { weights.market = 0.2; total += 0.2; }

    // Normalize weights
    if (total > 0) {
      weights.financial /= total;
      weights.behavioral /= total;
      weights.market /= total;
    }

    return weights;
  }

  private calculateRiskTrend(historicalScores: number[], currentScore: number): 'improving' | 'stable' | 'deteriorating' {
    if (historicalScores.length === 0) return 'stable';

    const recentScore = historicalScores[historicalScores.length - 1];
    const change = currentScore - recentScore;

    if (change > 5) return 'deteriorating';
    if (change < -5) return 'improving';
    return 'stable';
  }

  private identifyRiskFactors(financialData: FinancialData[], behavioralData: any, marketData: any): any[] {
    // Placeholder implementation
    return [
      {
        category: 'financial',
        factor: 'cash_flow_volatility',
        impact: -15,
        confidence: 0.8,
        description: 'High volatility in cash flow patterns'
      }
    ];
  }

  private generateRiskRecommendations(score: number, factors: any[]): string[] {
    const recommendations = ['Monitor risk factors regularly'];

    if (score > 70) {
      recommendations.push('Implement immediate risk mitigation strategies');
      recommendations.push('Consider professional risk assessment');
    } else if (score > 50) {
      recommendations.push('Develop risk monitoring procedures');
      recommendations.push('Review financial controls');
    }

    return recommendations;
  }

  private async getHistoricalRiskScores(clientId: string): Promise<number[]> {
    // Placeholder implementation
    return [45, 42, 38, 35]; // Improving trend
  }

  async shutdown(): Promise<void> {
    console.log('Insight Engine shut down');
  }
}

// Supporting classes for anomaly detection
class StatisticalAnomalyDetector {
  detect(data: FinancialData[], config: AnomalyDetectionConfig): DetectedAnomaly[] {
    // Implementation for statistical anomaly detection
    return [];
  }
}

class MLAnomalyDetector {
  detect(data: FinancialData[], config: AnomalyDetectionConfig): DetectedAnomaly[] {
    // Implementation for ML-based anomaly detection
    return [];
  }
}

class RuleBasedAnomalyDetector {
  detect(data: FinancialData[], config: AnomalyDetectionConfig): DetectedAnomaly[] {
    // Implementation for rule-based anomaly detection
    return [];
  }
}

interface AnomalyDetector {
  detect(data: FinancialData[], config: AnomalyDetectionConfig): DetectedAnomaly[];
}

interface NarrativeTemplate {
  pattern: string;
  template: string;
  variables: string[];
}

export * from './narratives';
export * from './kpi-analyzer';
export * from './anomaly-detector';