/**
 * Enhanced Financial Insights Engine
 * Advanced AI-powered financial analysis and insights generation for QuickBooks data
 */

import { openaiClient } from './openai-client';
import { financialInsightsPrompts, quickbooksInsightsPrompts, formatPrompt } from './prompts';
import { db } from '../../server/db';

export interface QuickBooksData {
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    lastUpdated: Date;
  }>;
  transactions: Array<{
    id: string;
    date: Date;
    amount: number;
    description: string;
    account: string;
    category: string;
    type: 'income' | 'expense' | 'transfer';
  }>;
  items: Array<{
    id: string;
    name: string;
    type: string;
    unitPrice: number;
    qtyOnHand?: number;
  }>;
  customers: Array<{
    id: string;
    name: string;
    balance: number;
    creditLimit?: number;
    paymentTerms?: string;
  }>;
  vendors: Array<{
    id: string;
    name: string;
    balance: number;
    creditLimit?: number;
    paymentTerms?: string;
  }>;
  reports: {
    profitLoss: Array<{
      period: string;
      revenue: number;
      expenses: number;
      netIncome: number;
    }>;
    balanceSheet: Array<{
      period: string;
      assets: number;
      liabilities: number;
      equity: number;
    }>;
    cashFlow: Array<{
      period: string;
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      netCashFlow: number;
    }>;
  };
}

export interface FinancialInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'compliance' | 'optimization' | 'forecast';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  priority: number;
  actionItems: string[];
  data: Record<string, any>;
  visualizations?: Array<{
    type: 'chart' | 'table' | 'kpi';
    config: Record<string, any>;
  }>;
  metadata: {
    source: string;
    timeframe: string;
    category: string;
    tags: string[];
    dataHash: string;
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialNarrative {
  executiveSummary: string;
  keyHighlights: string[];
  detailedAnalysis: {
    revenueAnalysis: string;
    expenseAnalysis: string;
    profitabilityAnalysis: string;
    liquidityAnalysis: string;
    operationalEfficiency: string;
  };
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    timeline: string;
  }>;
  outlook: {
    nextQuarter: string;
    nextYear: string;
    keyRisks: string[];
    opportunities: string[];
  };
  benchmarks: Array<{
    metric: string;
    value: number;
    industryAverage: number;
    performance: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
  }>;
}

export interface PredictiveAnalytics {
  cashFlowForecast: Array<{
    period: string;
    predictedInflow: number;
    predictedOutflow: number;
    netCashFlow: number;
    confidence: number;
    factors: string[];
    scenarios: {
      optimistic: number;
      realistic: number;
      pessimistic: number;
    };
  }>;
  revenueForecast: Array<{
    period: string;
    predictedRevenue: number;
    confidence: number;
    growthRate: number;
    seasonalAdjustment: number;
  }>;
  riskAssessment: Array<{
    riskType: string;
    probability: number;
    impact: number;
    riskScore: number;
    description: string;
    mitigationStrategies: string[];
  }>;
  recommendations: Array<{
    type: 'cost_reduction' | 'revenue_optimization' | 'cash_management' | 'investment';
    description: string;
    potentialBenefit: number;
    implementationCost: number;
    roi: number;
    timeline: string;
  }>;
}

export interface TaxOptimizationPlan {
  strategies: Array<{
    strategy: string;
    description: string;
    potentialSavings: number;
    confidence: number;
    requirements: string[];
    deadline?: Date;
    riskLevel: 'low' | 'medium' | 'high';
    applicability: number;
    implementation: {
      steps: string[];
      resources: string[];
      timeline: string;
    };
  }>;
  yearEndPlanning: {
    incomeAcceleration: string[];
    expenseAcceleration: string[];
    deductionOptimization: string[];
    creditOpportunities: string[];
  };
  complianceAlerts: Array<{
    type: string;
    description: string;
    deadline: Date;
    severity: 'info' | 'warning' | 'critical';
    actionRequired: string;
  }>;
  estimatedTotalSavings: number;
  implementationPriority: Array<{
    strategy: string;
    priority: number;
    reasoning: string;
  }>;
}

class FinancialInsightsEngine {
  private isInitialized = false;
  private cachedInsights: Map<string, FinancialInsight[]> = new Map();
  private cacheExpiry: Map<string, Date> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.isInitialized = openaiClient.isReady();
  }

  public isReady(): boolean {
    return this.isInitialized && openaiClient.isReady();
  }

  /**
   * Generate comprehensive financial insights from QuickBooks data
   */
  public async generateComprehensiveInsights(
    quickbooksData: QuickBooksData,
    organizationId: string,
    clientId?: string,
    options: {
      includeForecasting?: boolean;
      includeTaxOptimization?: boolean;
      industryContext?: string;
      timeframe?: 'monthly' | 'quarterly' | 'annual';
    } = {}
  ): Promise<{
    insights: FinancialInsight[];
    narrative: FinancialNarrative;
    predictiveAnalytics?: PredictiveAnalytics;
    taxOptimization?: TaxOptimizationPlan;
    summary: {
      totalInsights: number;
      criticalIssues: number;
      opportunities: number;
      overallHealthScore: number;
    };
  }> {
    if (!this.isReady()) {
      throw new Error('Financial Insights Engine is not ready');
    }

    try {
      const cacheKey = this.generateCacheKey(quickbooksData, organizationId, options);

      // Check cache
      if (this.isCacheValid(cacheKey)) {
        const cached = this.cachedInsights.get(cacheKey);
        if (cached) {
          return this.buildCachedResponse(cached, quickbooksData, options);
        }
      }

      const insights: FinancialInsight[] = [];

      // Generate different types of insights in parallel
      const [
        trendInsights,
        anomalyInsights,
        opportunityInsights,
        riskInsights,
        complianceInsights,
        narrative
      ] = await Promise.all([
        this.generateTrendInsights(quickbooksData, organizationId),
        this.generateAnomalyInsights(quickbooksData, organizationId),
        this.generateOpportunityInsights(quickbooksData, organizationId),
        this.generateRiskInsights(quickbooksData, organizationId),
        this.generateComplianceInsights(quickbooksData, organizationId),
        this.generateFinancialNarrative(quickbooksData, organizationId, options.timeframe || 'monthly')
      ]);

      insights.push(...trendInsights, ...anomalyInsights, ...opportunityInsights, ...riskInsights, ...complianceInsights);

      // Generate optional advanced analytics
      let predictiveAnalytics: PredictiveAnalytics | undefined;
      let taxOptimization: TaxOptimizationPlan | undefined;

      if (options.includeForecasting) {
        predictiveAnalytics = await this.generatePredictiveAnalytics(quickbooksData, organizationId);
      }

      if (options.includeTaxOptimization) {
        taxOptimization = await this.generateTaxOptimizationPlan(quickbooksData, organizationId);
      }

      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(insights, quickbooksData);

      // Store insights in database
      await this.storeInsights(insights, organizationId, clientId);

      // Cache results
      this.cacheResults(cacheKey, insights);

      return {
        insights,
        narrative,
        predictiveAnalytics,
        taxOptimization,
        summary
      };

    } catch (error) {
      console.error('Financial insights generation failed:', error);
      throw new Error(`Financial insights generation failed: ${error}`);
    }
  }

  /**
   * Generate financial narrative using AI
   */
  public async generateFinancialNarrative(
    quickbooksData: QuickBooksData,
    organizationId: string,
    reportType: 'monthly' | 'quarterly' | 'annual' = 'monthly'
  ): Promise<FinancialNarrative> {
    if (!this.isReady()) {
      throw new Error('Financial Insights Engine is not ready');
    }

    try {
      // Prepare financial data summary
      const financialSummary = this.prepareFinancialSummary(quickbooksData);

      const prompt = `Generate a comprehensive ${reportType} financial narrative based on this QuickBooks data:

${JSON.stringify(financialSummary, null, 2)}

The narrative should include:
1. Executive Summary (2-3 paragraphs)
2. Key Highlights (5-7 bullet points)
3. Detailed Analysis (revenue, expenses, profitability, liquidity, efficiency)
4. Strategic Recommendations with priorities and timelines
5. Forward-looking outlook with risks and opportunities
6. Industry benchmark comparisons

Focus on actionable insights and business implications. Use professional but accessible language.`;

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          executiveSummary: 'string - comprehensive overview',
          keyHighlights: 'array of strings - key findings',
          detailedAnalysis: 'object with revenueAnalysis, expenseAnalysis, profitabilityAnalysis, liquidityAnalysis, operationalEfficiency',
          recommendations: 'array of objects with category, priority, action, expectedImpact, timeline',
          outlook: 'object with nextQuarter, nextYear, keyRisks, opportunities',
          benchmarks: 'array of objects with metric, value, industryAverage, performance'
        },
        {
          organizationId,
          temperature: 0.7,
          maxTokens: 3000,
        }
      );

      return response.data;

    } catch (error) {
      console.error('Financial narrative generation failed:', error);
      throw new Error(`Financial narrative generation failed: ${error}`);
    }
  }

  /**
   * Generate predictive analytics
   */
  public async generatePredictiveAnalytics(
    quickbooksData: QuickBooksData,
    organizationId: string
  ): Promise<PredictiveAnalytics> {
    if (!this.isReady()) {
      throw new Error('Financial Insights Engine is not ready');
    }

    try {
      // Prepare historical data for forecasting
      const historicalData = this.prepareHistoricalData(quickbooksData);

      const prompt = formatPrompt(quickbooksInsightsPrompts.cashFlowAnalysis, {
        cashFlowData: JSON.stringify(quickbooksData.reports.cashFlow),
        receivablesData: JSON.stringify(quickbooksData.customers),
        payablesData: JSON.stringify(quickbooksData.vendors),
        seasonalData: JSON.stringify(this.calculateSeasonalFactors(quickbooksData)),
        growthProjections: JSON.stringify(this.calculateGrowthProjections(quickbooksData)),
      });

      const response = await openaiClient.createStructuredCompletion(
        prompt.user,
        {
          cashFlowForecast: 'array of forecast periods with predictions and scenarios',
          revenueForecast: 'array of revenue predictions with confidence levels',
          riskAssessment: 'array of identified risks with probability and impact',
          recommendations: 'array of optimization recommendations with ROI analysis'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.4,
          maxTokens: 2500,
        }
      );

      return response.data;

    } catch (error) {
      console.error('Predictive analytics generation failed:', error);
      throw new Error(`Predictive analytics generation failed: ${error}`);
    }
  }

  /**
   * Generate tax optimization plan
   */
  public async generateTaxOptimizationPlan(
    quickbooksData: QuickBooksData,
    organizationId: string
  ): Promise<TaxOptimizationPlan> {
    if (!this.isReady()) {
      throw new Error('Financial Insights Engine is not ready');
    }

    try {
      const financialData = this.prepareFinancialSummary(quickbooksData);
      const currentYear = new Date().getFullYear();

      const prompt = formatPrompt(financialInsightsPrompts.taxOptimization, {
        financialData: JSON.stringify(financialData),
        taxYear: currentYear.toString(),
        clientType: 'business', // Could be determined from QuickBooks data
      });

      const response = await openaiClient.createStructuredCompletion(
        prompt.user,
        {
          strategies: 'array of tax optimization strategies with implementation details',
          yearEndPlanning: 'object with acceleration and optimization opportunities',
          complianceAlerts: 'array of compliance requirements and deadlines',
          estimatedTotalSavings: 'number - total potential tax savings',
          implementationPriority: 'array of prioritized strategies'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.3,
          maxTokens: 2000,
        }
      );

      return response.data;

    } catch (error) {
      console.error('Tax optimization plan generation failed:', error);
      throw new Error(`Tax optimization plan generation failed: ${error}`);
    }
  }

  /**
   * Generate trend insights
   */
  private async generateTrendInsights(
    quickbooksData: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      // Analyze revenue trends
      const revenueData = this.extractRevenueData(quickbooksData);
      const revenueInsight = await this.analyzeTrend('revenue', revenueData, organizationId);
      if (revenueInsight) insights.push(revenueInsight);

      // Analyze expense trends
      const expenseData = this.extractExpenseData(quickbooksData);
      const expenseInsight = await this.analyzeTrend('expenses', expenseData, organizationId);
      if (expenseInsight) insights.push(expenseInsight);

      // Analyze cash flow trends
      const cashFlowData = quickbooksData.reports.cashFlow.map(cf => cf.netCashFlow);
      const cashFlowInsight = await this.analyzeTrend('cash_flow', cashFlowData, organizationId);
      if (cashFlowInsight) insights.push(cashFlowInsight);

    } catch (error) {
      console.error('Trend insights generation failed:', error);
    }

    return insights;
  }

  /**
   * Generate anomaly insights
   */
  private async generateAnomalyInsights(
    quickbooksData: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      const currentData = this.prepareCurrentPeriodData(quickbooksData);
      const historicalData = this.prepareHistoricalData(quickbooksData);

      const prompt = formatPrompt(financialInsightsPrompts.financialAnomalies, {
        currentData: JSON.stringify(currentData),
        historicalData: JSON.stringify(historicalData),
        benchmarkData: JSON.stringify({}), // Would be populated with industry data
        businessContext: JSON.stringify(this.extractBusinessContext(quickbooksData)),
      });

      const response = await openaiClient.createStructuredCompletion(
        prompt.user,
        {
          anomalies: 'array of detected anomalies with severity and recommendations'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.2,
        }
      );

      const anomalies = response.data.anomalies || [];
      anomalies.forEach((anomaly: any, index: number) => {
        insights.push({
          id: `anomaly_${Date.now()}_${index}`,
          type: 'anomaly',
          title: `${anomaly.type} Anomaly Detected`,
          description: anomaly.description,
          impact: this.mapSeverityToImpact(anomaly.severity),
          confidence: anomaly.confidence || 0.8,
          priority: this.calculatePriority(anomaly),
          actionItems: anomaly.recommendations || [],
          data: anomaly,
          metadata: {
            source: 'ai_anomaly_detection',
            timeframe: 'current',
            category: 'anomaly_detection',
            tags: ['anomaly', anomaly.type],
            dataHash: this.generateDataHash(currentData),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

    } catch (error) {
      console.error('Anomaly insights generation failed:', error);
    }

    return insights;
  }

  /**
   * Generate opportunity insights
   */
  private async generateOpportunityInsights(
    quickbooksData: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      // Analyze cost reduction opportunities
      const costOpportunities = await this.identifyCostReductionOpportunities(quickbooksData, organizationId);
      insights.push(...costOpportunities);

      // Analyze revenue optimization opportunities
      const revenueOpportunities = await this.identifyRevenueOptimizationOpportunities(quickbooksData, organizationId);
      insights.push(...revenueOpportunities);

      // Analyze working capital optimization
      const workingCapitalOpportunities = await this.identifyWorkingCapitalOpportunities(quickbooksData, organizationId);
      insights.push(...workingCapitalOpportunities);

    } catch (error) {
      console.error('Opportunity insights generation failed:', error);
    }

    return insights;
  }

  /**
   * Generate risk insights
   */
  private async generateRiskInsights(
    quickbooksData: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      const riskData = this.prepareRiskAnalysisData(quickbooksData);

      const prompt = `Analyze this financial data for potential risks:

${JSON.stringify(riskData, null, 2)}

Identify and assess:
1. Liquidity risks
2. Credit risks
3. Operational risks
4. Market risks
5. Compliance risks

For each risk, provide:
- Risk type and description
- Probability (0-1)
- Impact assessment
- Risk score calculation
- Mitigation strategies
- Monitoring recommendations`;

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          risks: 'array of risk assessments with probability, impact, and mitigation strategies'
        },
        {
          organizationId,
          temperature: 0.3,
        }
      );

      const risks = response.data.risks || [];
      risks.forEach((risk: any, index: number) => {
        insights.push({
          id: `risk_${Date.now()}_${index}`,
          type: 'risk',
          title: `${risk.riskType} Risk Assessment`,
          description: risk.description,
          impact: this.calculateRiskImpact(risk.probability, risk.impact),
          confidence: 0.8,
          priority: risk.riskScore || 0.5,
          actionItems: risk.mitigationStrategies || [],
          data: risk,
          metadata: {
            source: 'ai_risk_assessment',
            timeframe: 'ongoing',
            category: 'risk_management',
            tags: ['risk', risk.riskType],
            dataHash: this.generateDataHash(riskData),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

    } catch (error) {
      console.error('Risk insights generation failed:', error);
    }

    return insights;
  }

  /**
   * Generate compliance insights
   */
  private async generateComplianceInsights(
    quickbooksData: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      // Check for compliance issues and requirements
      const complianceData = this.prepareComplianceData(quickbooksData);

      // Tax compliance checks
      const taxCompliance = await this.checkTaxCompliance(complianceData, organizationId);
      insights.push(...taxCompliance);

      // Financial reporting compliance
      const reportingCompliance = await this.checkReportingCompliance(complianceData, organizationId);
      insights.push(...reportingCompliance);

    } catch (error) {
      console.error('Compliance insights generation failed:', error);
    }

    return insights;
  }

  // Helper methods for data preparation and analysis
  private prepareFinancialSummary(data: QuickBooksData): Record<string, any> {
    const latestPL = data.reports.profitLoss[data.reports.profitLoss.length - 1];
    const latestBS = data.reports.balanceSheet[data.reports.balanceSheet.length - 1];
    const latestCF = data.reports.cashFlow[data.reports.cashFlow.length - 1];

    return {
      revenue: latestPL?.revenue || 0,
      expenses: latestPL?.expenses || 0,
      netIncome: latestPL?.netIncome || 0,
      assets: latestBS?.assets || 0,
      liabilities: latestBS?.liabilities || 0,
      equity: latestBS?.equity || 0,
      operatingCashFlow: latestCF?.operatingCashFlow || 0,
      totalCustomers: data.customers.length,
      totalVendors: data.vendors.length,
      accountsReceivable: data.customers.reduce((sum, c) => sum + c.balance, 0),
      accountsPayable: data.vendors.reduce((sum, v) => sum + v.balance, 0),
    };
  }

  private prepareHistoricalData(data: QuickBooksData): Record<string, number[]> {
    return {
      revenue: data.reports.profitLoss.map(pl => pl.revenue),
      expenses: data.reports.profitLoss.map(pl => pl.expenses),
      netIncome: data.reports.profitLoss.map(pl => pl.netIncome),
      cashFlow: data.reports.cashFlow.map(cf => cf.netCashFlow),
    };
  }

  private prepareCurrentPeriodData(data: QuickBooksData): Record<string, number> {
    const latest = data.reports.profitLoss[data.reports.profitLoss.length - 1];
    return {
      revenue: latest?.revenue || 0,
      expenses: latest?.expenses || 0,
      netIncome: latest?.netIncome || 0,
    };
  }

  private extractBusinessContext(data: QuickBooksData): Record<string, any> {
    return {
      businessSize: this.categorizeBusinessSize(data),
      industryType: 'general', // Would be determined from account structure
      seasonality: this.detectSeasonality(data),
      growthStage: this.determineGrowthStage(data),
    };
  }

  private extractRevenueData(data: QuickBooksData): number[] {
    return data.reports.profitLoss.map(pl => pl.revenue);
  }

  private extractExpenseData(data: QuickBooksData): number[] {
    return data.reports.profitLoss.map(pl => pl.expenses);
  }

  private calculateSeasonalFactors(data: QuickBooksData): Record<string, number> {
    // Seasonal analysis would be implemented here
    return {};
  }

  private calculateGrowthProjections(data: QuickBooksData): Record<string, number> {
    const revenue = this.extractRevenueData(data);
    if (revenue.length < 2) return { growthRate: 0 };

    const recentGrowth = (revenue[revenue.length - 1] - revenue[revenue.length - 2]) / revenue[revenue.length - 2];
    return { growthRate: recentGrowth };
  }

  private async analyzeTrend(
    metric: string,
    data: number[],
    organizationId: string
  ): Promise<FinancialInsight | null> {
    if (data.length < 3) return null;

    const slope = this.calculateSlope(data);
    const direction = slope > 0.05 ? 'increasing' : slope < -0.05 ? 'decreasing' : 'stable';
    const magnitude = Math.abs(slope);
    const significance = magnitude > 0.1 ? 'high' : magnitude > 0.05 ? 'medium' : 'low';

    return {
      id: `trend_${metric}_${Date.now()}`,
      type: 'trend',
      title: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Trend Analysis`,
      description: `${metric} is ${direction} with ${significance} significance`,
      impact: significance === 'high' ? 'high' : significance === 'medium' ? 'medium' : 'low',
      confidence: Math.max(0.5, 1 - this.calculateVolatility(data)),
      priority: significance === 'high' ? 0.9 : significance === 'medium' ? 0.7 : 0.5,
      actionItems: [`Monitor ${metric} closely`, `Analyze factors driving ${direction} trend`],
      data: { metric, direction, magnitude, significance, data },
      metadata: {
        source: 'trend_analysis',
        timeframe: 'historical',
        category: 'financial_trends',
        tags: ['trend', metric, direction],
        dataHash: this.generateDataHash(data),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return values[0] > 0 ? slope / values[0] : slope; // Normalize by initial value
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  // Additional helper methods for opportunity and risk analysis
  private async identifyCostReductionOpportunities(
    data: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    // Implementation for cost reduction analysis
    return [];
  }

  private async identifyRevenueOptimizationOpportunities(
    data: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    // Implementation for revenue optimization analysis
    return [];
  }

  private async identifyWorkingCapitalOpportunities(
    data: QuickBooksData,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    // Implementation for working capital analysis
    return [];
  }

  private prepareRiskAnalysisData(data: QuickBooksData): Record<string, any> {
    const summary = this.prepareFinancialSummary(data);
    const currentRatio = summary.assets / Math.max(summary.liabilities, 1);
    const debtToEquity = summary.liabilities / Math.max(summary.equity, 1);

    return {
      ...summary,
      ratios: {
        currentRatio,
        debtToEquity,
        cashRatio: summary.operatingCashFlow / Math.max(summary.expenses, 1),
      },
      concentrationRisks: {
        topCustomerConcentration: this.calculateCustomerConcentration(data.customers),
        topVendorConcentration: this.calculateVendorConcentration(data.vendors),
      },
    };
  }

  private prepareComplianceData(data: QuickBooksData): Record<string, any> {
    return {
      taxableEvents: this.identifyTaxableEvents(data),
      reportingRequirements: this.identifyReportingRequirements(data),
      auditTrail: this.assessAuditTrail(data),
    };
  }

  private async checkTaxCompliance(
    data: Record<string, any>,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    // Implementation for tax compliance checking
    return [];
  }

  private async checkReportingCompliance(
    data: Record<string, any>,
    organizationId: string
  ): Promise<FinancialInsight[]> {
    // Implementation for reporting compliance checking
    return [];
  }

  // Utility methods
  private categorizeBusinessSize(data: QuickBooksData): string {
    const revenue = data.reports.profitLoss[data.reports.profitLoss.length - 1]?.revenue || 0;
    if (revenue > 10000000) return 'large';
    if (revenue > 1000000) return 'medium';
    return 'small';
  }

  private detectSeasonality(data: QuickBooksData): boolean {
    // Simple seasonality detection
    const revenues = this.extractRevenueData(data);
    if (revenues.length < 12) return false;

    const variance = this.calculateVolatility(revenues);
    return variance > 0.2; // High variance suggests seasonality
  }

  private determineGrowthStage(data: QuickBooksData): string {
    const revenues = this.extractRevenueData(data);
    if (revenues.length < 3) return 'unknown';

    const recentGrowth = this.calculateSlope(revenues.slice(-6)); // Last 6 periods
    if (recentGrowth > 0.1) return 'growth';
    if (recentGrowth < -0.05) return 'decline';
    return 'mature';
  }

  private calculateCustomerConcentration(customers: QuickBooksData['customers']): number {
    const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);
    const topCustomer = Math.max(...customers.map(c => c.balance));
    return totalBalance > 0 ? topCustomer / totalBalance : 0;
  }

  private calculateVendorConcentration(vendors: QuickBooksData['vendors']): number {
    const totalBalance = vendors.reduce((sum, v) => sum + v.balance, 0);
    const topVendor = Math.max(...vendors.map(v => v.balance));
    return totalBalance > 0 ? topVendor / totalBalance : 0;
  }

  private identifyTaxableEvents(data: QuickBooksData): string[] {
    // Identify potential taxable events from transaction data
    return [];
  }

  private identifyReportingRequirements(data: QuickBooksData): string[] {
    // Identify reporting requirements based on business structure and size
    return [];
  }

  private assessAuditTrail(data: QuickBooksData): Record<string, any> {
    // Assess quality of audit trail and documentation
    return {};
  }

  private mapSeverityToImpact(severity: string): FinancialInsight['impact'] {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private calculatePriority(item: any): number {
    // Calculate priority score based on various factors
    return 0.5; // Default priority
  }

  private calculateRiskImpact(probability: number, impact: number): FinancialInsight['impact'] {
    const riskScore = probability * impact;
    if (riskScore > 0.8) return 'critical';
    if (riskScore > 0.6) return 'high';
    if (riskScore > 0.4) return 'medium';
    return 'low';
  }

  private generateDataHash(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }

  private generateCacheKey(
    data: QuickBooksData,
    organizationId: string,
    options: any
  ): string {
    const dataHash = this.generateDataHash(data);
    const optionsHash = this.generateDataHash(options);
    return `insights_${organizationId}_${dataHash}_${optionsHash}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? expiry > new Date() : false;
  }

  private buildCachedResponse(cached: FinancialInsight[], data: QuickBooksData, options: any): any {
    // Build response from cached insights
    return {
      insights: cached,
      narrative: {} as FinancialNarrative,
      summary: this.calculateSummaryMetrics(cached, data),
    };
  }

  private cacheResults(cacheKey: string, insights: FinancialInsight[]): void {
    this.cachedInsights.set(cacheKey, insights);
    this.cacheExpiry.set(cacheKey, new Date(Date.now() + 30 * 60 * 1000)); // 30 minutes
  }

  private calculateSummaryMetrics(
    insights: FinancialInsight[],
    data: QuickBooksData
  ): {
    totalInsights: number;
    criticalIssues: number;
    opportunities: number;
    overallHealthScore: number;
  } {
    const criticalIssues = insights.filter(i => i.impact === 'critical').length;
    const opportunities = insights.filter(i => i.type === 'opportunity').length;

    // Calculate overall health score based on various factors
    const financialSummary = this.prepareFinancialSummary(data);
    const profitMargin = financialSummary.revenue > 0 ? financialSummary.netIncome / financialSummary.revenue : 0;
    const currentRatio = financialSummary.liabilities > 0 ? financialSummary.assets / financialSummary.liabilities : 1;

    let healthScore = 0.5; // Base score

    // Adjust based on profitability
    if (profitMargin > 0.1) healthScore += 0.2;
    else if (profitMargin < 0) healthScore -= 0.3;

    // Adjust based on liquidity
    if (currentRatio > 2) healthScore += 0.1;
    else if (currentRatio < 1) healthScore -= 0.2;

    // Adjust based on critical issues
    healthScore -= criticalIssues * 0.1;

    // Ensure score is between 0 and 1
    healthScore = Math.max(0, Math.min(1, healthScore));

    return {
      totalInsights: insights.length,
      criticalIssues,
      opportunities,
      overallHealthScore: healthScore,
    };
  }

  private async storeInsights(
    insights: FinancialInsight[],
    organizationId: string,
    clientId?: string
  ): Promise<void> {
    try {
      await Promise.all(
        insights.map(insight =>
          db.aiInsight.create({
            data: {
              id: insight.id,
              organizationId,
              clientId,
              type: insight.type,
              title: insight.title,
              description: insight.description,
              impact: insight.impact,
              confidence: insight.confidence,
              priority: insight.priority,
              actionItems: insight.actionItems,
              data: insight.data,
              metadata: insight.metadata,
              expiresAt: insight.expiresAt,
              createdAt: insight.createdAt,
              updatedAt: insight.updatedAt,
            },
          })
        )
      );
    } catch (error) {
      console.error('Failed to store insights:', error);
    }
  }
}

// Export singleton instance
export const financialInsightsEngine = new FinancialInsightsEngine();
export default financialInsightsEngine;