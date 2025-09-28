import { openaiClient } from '@/lib/ai/openai-client';
import { db } from '@cpa-platform/database';

export interface FinancialInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'compliance' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actionItems: string[];
  data: Record<string, any>;
  metadata: {
    source: string;
    timeframe: string;
    category: string;
    tags: string[];
  };
  createdAt: Date;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: number;
  significance: 'low' | 'medium' | 'high';
  confidence: number;
  timeframe: string;
  forecast?: {
    nextPeriod: number;
    confidence: number;
    factors: string[];
  };
}

export interface AnomalyDetection {
  type: 'amount' | 'frequency' | 'pattern' | 'timing' | 'variance';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  possibleCauses: string[];
  recommendations: string[];
}

export interface TaxOptimization {
  strategy: string;
  description: string;
  potentialSavings: number;
  confidence: number;
  requirements: string[];
  deadline?: Date;
  riskLevel: 'low' | 'medium' | 'high';
  applicability: number; // 0-1 score
}

export interface BenchmarkAnalysis {
  metric: string;
  clientValue: number;
  industryAverage: number;
  industryMedian: number;
  percentile: number;
  performance: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
  insights: string[];
  recommendations: string[];
}

export interface CashFlowPrediction {
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
  recommendations: string[];
}

export interface RiskAssessment {
  riskType: 'liquidity' | 'credit' | 'operational' | 'market' | 'compliance' | 'strategic';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  description: string;
  indicators: string[];
  mitigationStrategies: string[];
  monitoringMetrics: string[];
}

class AIInsightsService {
  private isInitialized = false;

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
   * Generate comprehensive financial narrative for reports
   */
  public async generateFinancialNarrative(
    financialData: Record<string, any>,
    organizationId: string,
    reportType: 'monthly' | 'quarterly' | 'annual' = 'monthly'
  ): Promise<{
    executiveSummary: string;
    keyHighlights: string[];
    detailedAnalysis: string;
    recommendations: string[];
    outlook: string;
  }> {
    if (!this.isReady()) {
      throw new Error('AI Insights service is not ready');
    }

    try {
      const prompt = this.buildFinancialNarrativePrompt(financialData, reportType);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          executiveSummary: 'string - 2-3 paragraph overview',
          keyHighlights: 'array of strings - 5-7 key points',
          detailedAnalysis: 'string - comprehensive analysis',
          recommendations: 'array of strings - specific actionable recommendations',
          outlook: 'string - forward-looking perspective'
        },
        {
          organizationId,
          temperature: 0.7,
          maxTokens: 2000,
        }
      );

      // Store narrative for future reference
      await this.storeInsight({
        type: 'narrative',
        organizationId,
        data: response.data,
        confidence: 0.9,
        metadata: {
          reportType,
          generatedAt: new Date(),
          dataHash: this.hashData(financialData),
        },
      });

      return response.data;

    } catch (error) {
      console.error('Financial narrative generation failed:', error);
      throw new Error(`Financial narrative generation failed: ${error}`);
    }
  }

  /**
   * Analyze financial trends
   */
  public async analyzeTrends(
    historicalData: Record<string, number[]>,
    organizationId: string,
    timeframe: string = '12 months'
  ): Promise<TrendAnalysis[]> {
    if (!this.isReady()) {
      throw new Error('AI Insights service is not ready');
    }

    const trends: TrendAnalysis[] = [];

    try {
      for (const [metric, values] of Object.entries(historicalData)) {
        const trend = await this.analyzeSingleTrend(metric, values, timeframe, organizationId);
        trends.push(trend);
      }

      return trends;

    } catch (error) {
      console.error('Trend analysis failed:', error);
      throw new Error(`Trend analysis failed: ${error}`);
    }
  }

  /**
   * Detect financial anomalies
   */
  public async detectAnomalies(
    currentData: Record<string, number>,
    historicalData: Record<string, number[]>,
    organizationId: string
  ): Promise<AnomalyDetection[]> {
    if (!this.isReady()) {
      throw new Error('AI Insights service is not ready');
    }

    const anomalies: AnomalyDetection[] = [];

    try {
      const prompt = this.buildAnomalyDetectionPrompt(currentData, historicalData);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          anomalies: 'array of objects with type, description, severity, confidence, expectedValue, actualValue, deviation, possibleCauses, recommendations'
        },
        {
          organizationId,
          temperature: 0.3,
          maxTokens: 1500,
        }
      );

      const detectedAnomalies = response.data.anomalies || [];

      // Enhance with statistical analysis
      for (const anomaly of detectedAnomalies) {
        const enhancedAnomaly = await this.enhanceAnomalyWithStats(
          anomaly,
          currentData,
          historicalData
        );
        anomalies.push(enhancedAnomaly);
      }

      return anomalies;

    } catch (error) {
      console.error('Anomaly detection failed:', error);
      throw new Error(`Anomaly detection failed: ${error}`);
    }
  }

  /**
   * Suggest tax optimizations
   */
  public async suggestTaxOptimizations(
    financialData: Record<string, any>,
    taxYear: number,
    organizationId: string,
    clientType: 'individual' | 'business' = 'individual'
  ): Promise<TaxOptimization[]> {
    if (!this.isReady()) {
      throw new Error('AI Insights service is not ready');
    }

    try {
      const prompt = this.buildTaxOptimizationPrompt(financialData, taxYear, clientType);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          optimizations: 'array of objects with strategy, description, potentialSavings, confidence, requirements, deadline, riskLevel, applicability'
        },
        {
          organizationId,
          temperature: 0.4,
          maxTokens: 1800,
        }
      );

      const optimizations = response.data.optimizations || [];

      // Validate and enhance optimizations
      return optimizations.map((opt: any) => ({
        ...opt,
        potentialSavings: Math.max(0, parseFloat(opt.potentialSavings) || 0),
        confidence: Math.min(Math.max(parseFloat(opt.confidence) || 0.5, 0), 1),
        applicability: Math.min(Math.max(parseFloat(opt.applicability) || 0.5, 0), 1),
        deadline: opt.deadline ? new Date(opt.deadline) : undefined,
      }));

    } catch (error) {
      console.error('Tax optimization analysis failed:', error);
      throw new Error(`Tax optimization analysis failed: ${error}`);
    }
  }

  /**
   * Perform benchmark analysis
   */
  public async benchmarkAnalysis(
    clientData: Record<string, number>,
    industry: string,
    organizationId: string,
    businessSize: 'small' | 'medium' | 'large' = 'small'
  ): Promise<BenchmarkAnalysis[]> {
    if (!this.isReady()) {
      throw new Error('AI Insights service is not ready');
    }

    try {
      // Get industry benchmarks (would typically come from external data sources)
      const industryBenchmarks = await this.getIndustryBenchmarks(industry, businessSize);

      const benchmarks: BenchmarkAnalysis[] = [];

      for (const [metric, value] of Object.entries(clientData)) {
        if (industryBenchmarks[metric]) {
          const benchmark = this.calculateBenchmarkAnalysis(
            metric,
            value,
            industryBenchmarks[metric]
          );
          benchmarks.push(benchmark);
        }
      }

      // Generate AI insights for benchmark results
      const enhancedBenchmarks = await this.enhanceBenchmarkWithInsights(
        benchmarks,
        organizationId
      );

      return enhancedBenchmarks;

    } catch (error) {
      console.error('Benchmark analysis failed:', error);
      throw new Error(`Benchmark analysis failed: ${error}`);
    }
  }

  /**
   * Predict cash flow
   */
  public async cashFlowPrediction(
    historicalCashFlow: Record<string, number[]>,
    organizationId: string,
    predictionPeriods: number = 6
  ): Promise<CashFlowPrediction[]> {
    if (!this.isReady()) {
      throw new Error('AI Insights service is not ready');
    }

    try {
      const prompt = this.buildCashFlowPredictionPrompt(historicalCashFlow, predictionPeriods);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          predictions: 'array of objects with period, predictedInflow, predictedOutflow, netCashFlow, confidence, factors, scenarios, recommendations'
        },
        {
          organizationId,
          temperature: 0.5,
          maxTokens: 2000,
        }
      );

      const predictions = response.data.predictions || [];

      // Enhance with statistical models
      return predictions.map((pred: any, index: number) => ({
        ...pred,
        predictedInflow: Math.max(0, parseFloat(pred.predictedInflow) || 0),
        predictedOutflow: Math.max(0, parseFloat(pred.predictedOutflow) || 0),
        netCashFlow: parseFloat(pred.predictedInflow || 0) - parseFloat(pred.predictedOutflow || 0),
        confidence: Math.min(Math.max(parseFloat(pred.confidence) || 0.7, 0), 1),
        scenarios: {
          optimistic: parseFloat(pred.scenarios?.optimistic) || 0,
          realistic: parseFloat(pred.scenarios?.realistic) || 0,
          pessimistic: parseFloat(pred.scenarios?.pessimistic) || 0,
        },
      }));

    } catch (error) {
      console.error('Cash flow prediction failed:', error);
      throw new Error(`Cash flow prediction failed: ${error}`);
    }
  }

  /**
   * Assess financial risks
   */
  public async riskAssessment(
    financialData: Record<string, any>,
    organizationId: string,
    riskTypes: string[] = ['liquidity', 'credit', 'operational', 'market', 'compliance']
  ): Promise<RiskAssessment[]> {
    if (!this.isReady()) {
      throw new Error('AI Insights service is not ready');
    }

    try {
      const prompt = this.buildRiskAssessmentPrompt(financialData, riskTypes);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          risks: 'array of objects with riskType, riskLevel, probability, impact, riskScore, description, indicators, mitigationStrategies, monitoringMetrics'
        },
        {
          organizationId,
          temperature: 0.4,
          maxTokens: 2000,
        }
      );

      const risks = response.data.risks || [];

      // Calculate risk scores and validate
      return risks.map((risk: any) => ({
        ...risk,
        probability: Math.min(Math.max(parseFloat(risk.probability) || 0.5, 0), 1),
        impact: Math.min(Math.max(parseFloat(risk.impact) || 0.5, 0), 1),
        riskScore: (parseFloat(risk.probability) || 0.5) * (parseFloat(risk.impact) || 0.5),
      }));

    } catch (error) {
      console.error('Risk assessment failed:', error);
      throw new Error(`Risk assessment failed: ${error}`);
    }
  }

  /**
   * Generate comprehensive insights for a client
   */
  public async generateComprehensiveInsights(
    clientId: string,
    organizationId: string,
    dataRange: { startDate: Date; endDate: Date }
  ): Promise<FinancialInsight[]> {
    try {
      // Gather client financial data
      const financialData = await this.gatherClientFinancialData(clientId, dataRange);

      const insights: FinancialInsight[] = [];

      // Generate different types of insights
      const [
        trends,
        anomalies,
        taxOptimizations,
        benchmarks,
        cashFlowPredictions,
        risks
      ] = await Promise.all([
        this.analyzeTrends(financialData.historical, organizationId),
        this.detectAnomalies(financialData.current, financialData.historical, organizationId),
        this.suggestTaxOptimizations(financialData.current, new Date().getFullYear(), organizationId),
        this.benchmarkAnalysis(financialData.current, financialData.industry || 'general', organizationId),
        this.cashFlowPrediction(financialData.cashFlow, organizationId),
        this.riskAssessment(financialData.current, organizationId),
      ]);

      // Convert to standard insight format
      insights.push(...this.convertTrendsToInsights(trends));
      insights.push(...this.convertAnomaliesToInsights(anomalies));
      insights.push(...this.convertTaxOptimizationsToInsights(taxOptimizations));
      insights.push(...this.convertBenchmarksToInsights(benchmarks));
      insights.push(...this.convertCashFlowToInsights(cashFlowPredictions));
      insights.push(...this.convertRisksToInsights(risks));

      // Store insights in database
      await this.storeInsights(insights, clientId, organizationId);

      return insights;

    } catch (error) {
      console.error('Comprehensive insights generation failed:', error);
      throw new Error(`Comprehensive insights generation failed: ${error}`);
    }
  }

  /**
   * Private helper methods
   */
  private buildFinancialNarrativePrompt(
    financialData: Record<string, any>,
    reportType: string
  ): string {
    return `
As a senior financial analyst, create a comprehensive ${reportType} financial narrative based on the following data:

Financial Data:
${JSON.stringify(financialData, null, 2)}

Generate a professional financial narrative that includes:

1. Executive Summary: High-level overview of financial performance
2. Key Highlights: 5-7 most important points
3. Detailed Analysis: In-depth analysis of trends, performance, and notable items
4. Recommendations: Specific, actionable recommendations
5. Outlook: Forward-looking perspective and considerations

Use professional financial language suitable for stakeholders. Focus on insights, not just data regurgitation.
`;
  }

  private buildAnomalyDetectionPrompt(
    currentData: Record<string, number>,
    historicalData: Record<string, number[]>
  ): string {
    return `
Analyze the following financial data for anomalies and unusual patterns:

Current Period Data:
${JSON.stringify(currentData, null, 2)}

Historical Data (last 12 periods):
${JSON.stringify(historicalData, null, 2)}

Identify anomalies considering:
- Statistical deviation from historical averages
- Unusual patterns or trends
- Seasonal variations
- Business cycle considerations

For each anomaly, provide:
- Type of anomaly (amount, frequency, pattern, timing, variance)
- Severity level
- Expected vs actual values
- Possible causes
- Recommendations for investigation or action
`;
  }

  private buildTaxOptimizationPrompt(
    financialData: Record<string, any>,
    taxYear: number,
    clientType: string
  ): string {
    return `
Analyze the following ${clientType} financial data for tax optimization opportunities for ${taxYear}:

Financial Data:
${JSON.stringify(financialData, null, 2)}

Identify tax optimization strategies considering:
- Current tax law for ${taxYear}
- Income timing strategies
- Deduction maximization
- Credit opportunities
- Business structure optimization
- Retirement planning considerations
- Estate planning implications

For each strategy, provide:
- Clear description
- Estimated potential savings
- Implementation requirements
- Deadlines (if applicable)
- Risk level and considerations
- Applicability to this specific situation
`;
  }

  private buildCashFlowPredictionPrompt(
    historicalCashFlow: Record<string, number[]>,
    periods: number
  ): string {
    return `
Based on the following historical cash flow data, predict cash flows for the next ${periods} periods:

Historical Cash Flow Data:
${JSON.stringify(historicalCashFlow, null, 2)}

Consider:
- Seasonal patterns
- Growth trends
- Cyclical variations
- Economic factors

For each prediction period, provide:
- Predicted inflows and outflows
- Net cash flow
- Confidence level
- Key factors influencing the prediction
- Optimistic, realistic, and pessimistic scenarios
- Recommendations for cash flow management
`;
  }

  private buildRiskAssessmentPrompt(
    financialData: Record<string, any>,
    riskTypes: string[]
  ): string {
    return `
Assess the following risk types based on the financial data provided:

Financial Data:
${JSON.stringify(financialData, null, 2)}

Risk Types to Assess: ${riskTypes.join(', ')}

For each applicable risk type, provide:
- Risk level (low/medium/high/critical)
- Probability of occurrence (0-1)
- Potential impact (0-1)
- Description of the risk
- Key indicators to monitor
- Mitigation strategies
- Ongoing monitoring metrics

Consider industry standards, regulatory requirements, and best practices.
`;
  }

  private async analyzeSingleTrend(
    metric: string,
    values: number[],
    timeframe: string,
    organizationId: string
  ): Promise<TrendAnalysis> {
    // Statistical trend analysis
    const slope = this.calculateSlope(values);
    const volatility = this.calculateVolatility(values);
    const direction = slope > 0.05 ? 'increasing' : slope < -0.05 ? 'decreasing' : 'stable';
    const magnitude = Math.abs(slope);

    // AI enhancement
    const prompt = `
Analyze the trend for ${metric} with the following values over ${timeframe}:
${values.join(', ')}

Statistical analysis shows:
- Direction: ${direction}
- Magnitude: ${magnitude}
- Volatility: ${volatility}

Provide insights on:
- Significance of this trend
- Potential forecast for next period
- Key factors that might influence this metric
`;

    try {
      const response = await openaiClient.createChatCompletion(
        [{ role: 'user', content: prompt }],
        {
          organizationId,
          temperature: 0.3,
          maxTokens: 300,
        }
      );

      return {
        metric,
        direction,
        magnitude,
        significance: magnitude > 0.1 ? 'high' : magnitude > 0.05 ? 'medium' : 'low',
        confidence: Math.max(0.5, 1 - volatility),
        timeframe,
        forecast: {
          nextPeriod: values[values.length - 1] * (1 + slope),
          confidence: Math.max(0.3, 1 - volatility),
          factors: this.extractFactorsFromResponse(response.content),
        },
      };
    } catch (error) {
      console.warn(`Failed to enhance trend analysis for ${metric}:`, error);
      return {
        metric,
        direction,
        magnitude,
        significance: magnitude > 0.1 ? 'high' : magnitude > 0.05 ? 'medium' : 'low',
        confidence: Math.max(0.5, 1 - volatility),
        timeframe,
      };
    }
  }

  private calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope / values[0]; // Normalize by initial value
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private extractFactorsFromResponse(response: string): string[] {
    // Simple extraction - could be enhanced with NLP
    const factors = [];
    if (response.includes('seasonal')) factors.push('Seasonal factors');
    if (response.includes('market')) factors.push('Market conditions');
    if (response.includes('economic')) factors.push('Economic factors');
    if (response.includes('growth')) factors.push('Business growth');
    return factors;
  }

  private async enhanceAnomalyWithStats(
    anomaly: any,
    currentData: Record<string, number>,
    historicalData: Record<string, number[]>
  ): Promise<AnomalyDetection> {
    // Enhance anomaly with statistical analysis
    const metricData = historicalData[anomaly.metric] || [];
    const currentValue = currentData[anomaly.metric] || 0;

    if (metricData.length > 0) {
      const mean = metricData.reduce((sum, val) => sum + val, 0) / metricData.length;
      const stdDev = Math.sqrt(
        metricData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / metricData.length
      );

      anomaly.expectedValue = mean;
      anomaly.actualValue = currentValue;
      anomaly.deviation = Math.abs(currentValue - mean) / stdDev;
    }

    return anomaly;
  }

  private async getIndustryBenchmarks(
    industry: string,
    businessSize: string
  ): Promise<Record<string, any>> {
    // In a real implementation, this would fetch from industry databases
    // For now, return simulated benchmarks
    const baseBenchmarks: Record<string, any> = {
      'revenue_growth': { average: 0.08, median: 0.06, percentiles: [0.02, 0.06, 0.08, 0.12, 0.18] },
      'profit_margin': { average: 0.15, median: 0.12, percentiles: [0.05, 0.12, 0.15, 0.20, 0.28] },
      'current_ratio': { average: 2.1, median: 1.8, percentiles: [1.2, 1.8, 2.1, 2.6, 3.4] },
      'debt_to_equity': { average: 0.4, median: 0.35, percentiles: [0.1, 0.35, 0.4, 0.6, 0.8] },
    };

    return baseBenchmarks;
  }

  private calculateBenchmarkAnalysis(
    metric: string,
    value: number,
    benchmark: any
  ): BenchmarkAnalysis {
    const percentile = this.calculatePercentile(value, benchmark.percentiles);
    const performance = this.determinePerformance(percentile);

    return {
      metric,
      clientValue: value,
      industryAverage: benchmark.average,
      industryMedian: benchmark.median,
      percentile,
      performance,
      insights: this.generateBenchmarkInsights(metric, value, benchmark, performance),
      recommendations: this.generateBenchmarkRecommendations(metric, performance, percentile),
    };
  }

  private calculatePercentile(value: number, percentiles: number[]): number {
    for (let i = 0; i < percentiles.length; i++) {
      if (value <= percentiles[i]) {
        return (i + 1) * 20; // 20th, 40th, 60th, 80th, 100th percentiles
      }
    }
    return 100;
  }

  private determinePerformance(percentile: number): BenchmarkAnalysis['performance'] {
    if (percentile >= 80) return 'excellent';
    if (percentile >= 60) return 'above_average';
    if (percentile >= 40) return 'average';
    if (percentile >= 20) return 'below_average';
    return 'poor';
  }

  private generateBenchmarkInsights(
    metric: string,
    value: number,
    benchmark: any,
    performance: string
  ): string[] {
    const insights = [];

    if (performance === 'excellent') {
      insights.push(`${metric} performance is in the top 20% of the industry`);
    } else if (performance === 'poor') {
      insights.push(`${metric} performance is in the bottom 20% of the industry`);
    }

    const deviation = Math.abs(value - benchmark.average) / benchmark.average;
    if (deviation > 0.2) {
      insights.push(`${metric} deviates significantly from industry average by ${(deviation * 100).toFixed(1)}%`);
    }

    return insights;
  }

  private generateBenchmarkRecommendations(
    metric: string,
    performance: string,
    percentile: number
  ): string[] {
    const recommendations = [];

    if (performance === 'poor' || performance === 'below_average') {
      recommendations.push(`Focus on improving ${metric} to reach industry standards`);
      recommendations.push(`Analyze best practices from top performers in your industry`);
    } else if (performance === 'excellent') {
      recommendations.push(`Maintain current ${metric} performance and consider sharing best practices`);
    }

    return recommendations;
  }

  private async enhanceBenchmarkWithInsights(
    benchmarks: BenchmarkAnalysis[],
    organizationId: string
  ): Promise<BenchmarkAnalysis[]> {
    // Could enhance with AI-generated insights
    return benchmarks;
  }

  private async gatherClientFinancialData(
    clientId: string,
    dataRange: { startDate: Date; endDate: Date }
  ): Promise<any> {
    // Gather comprehensive financial data for the client
    // This would typically involve querying various database tables

    const [
      transactions,
      statements,
      taxReturns,
      budgets
    ] = await Promise.all([
      db.transaction.findMany({
        where: {
          clientId,
          date: {
            gte: dataRange.startDate,
            lte: dataRange.endDate,
          },
        },
      }),
      db.financialStatement.findMany({
        where: {
          clientId,
          statementDate: {
            gte: dataRange.startDate,
            lte: dataRange.endDate,
          },
        },
      }),
      db.taxReturn.findMany({
        where: {
          clientId,
          taxYear: {
            gte: dataRange.startDate.getFullYear(),
            lte: dataRange.endDate.getFullYear(),
          },
        },
      }),
      db.budget.findMany({
        where: {
          clientId,
          budgetPeriodStart: {
            gte: dataRange.startDate,
          },
          budgetPeriodEnd: {
            lte: dataRange.endDate,
          },
        },
      }),
    ]);

    // Process and structure the data
    return {
      current: this.aggregateCurrentData(transactions, statements),
      historical: this.aggregateHistoricalData(transactions, statements),
      cashFlow: this.aggregateCashFlowData(transactions),
      industry: 'general', // Would be determined from client data
    };
  }

  private aggregateCurrentData(transactions: any[], statements: any[]): Record<string, number> {
    // Aggregate current period financial data
    return {
      revenue: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      assets: statements.reduce((sum, s) => sum + (s.totalAssets || 0), 0),
      liabilities: statements.reduce((sum, s) => sum + (s.totalLiabilities || 0), 0),
    };
  }

  private aggregateHistoricalData(transactions: any[], statements: any[]): Record<string, number[]> {
    // Aggregate historical data by month
    const monthlyData: Record<string, number[]> = {
      revenue: [],
      expenses: [],
      netIncome: [],
    };

    // Group transactions by month and calculate totals
    // Implementation would depend on specific data structure

    return monthlyData;
  }

  private aggregateCashFlowData(transactions: any[]): Record<string, number[]> {
    // Aggregate cash flow data
    return {
      inflows: [],
      outflows: [],
      netCashFlow: [],
    };
  }

  // Conversion methods to standard insight format
  private convertTrendsToInsights(trends: TrendAnalysis[]): FinancialInsight[] {
    return trends.map(trend => ({
      id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'trend' as const,
      title: `${trend.metric} Trend Analysis`,
      description: `${trend.metric} is ${trend.direction} with ${trend.significance} significance`,
      impact: trend.significance === 'high' ? 'high' : trend.significance === 'medium' ? 'medium' : 'low',
      confidence: trend.confidence,
      actionItems: trend.forecast ? [`Monitor ${trend.metric} closely`, `Consider factors: ${trend.forecast.factors.join(', ')}`] : [],
      data: trend,
      metadata: {
        source: 'trend_analysis',
        timeframe: trend.timeframe,
        category: 'financial_trends',
        tags: ['trending', trend.direction, trend.significance],
      },
      createdAt: new Date(),
    }));
  }

  private convertAnomaliesToInsights(anomalies: AnomalyDetection[]): FinancialInsight[] {
    return anomalies.map(anomaly => ({
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'anomaly' as const,
      title: `${anomaly.type} Anomaly Detected`,
      description: anomaly.description,
      impact: anomaly.severity === 'critical' ? 'critical' : anomaly.severity === 'high' ? 'high' : anomaly.severity === 'medium' ? 'medium' : 'low',
      confidence: anomaly.confidence,
      actionItems: anomaly.recommendations,
      data: anomaly,
      metadata: {
        source: 'anomaly_detection',
        timeframe: 'current',
        category: 'risk_management',
        tags: ['anomaly', anomaly.type, anomaly.severity],
      },
      createdAt: new Date(),
    }));
  }

  private convertTaxOptimizationsToInsights(optimizations: TaxOptimization[]): FinancialInsight[] {
    return optimizations.map(opt => ({
      id: `tax_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'optimization' as const,
      title: `Tax Optimization: ${opt.strategy}`,
      description: opt.description,
      impact: opt.potentialSavings > 10000 ? 'high' : opt.potentialSavings > 5000 ? 'medium' : 'low',
      confidence: opt.confidence,
      actionItems: opt.requirements,
      data: opt,
      metadata: {
        source: 'tax_optimization',
        timeframe: 'annual',
        category: 'tax_planning',
        tags: ['tax', 'optimization', opt.riskLevel],
      },
      createdAt: new Date(),
    }));
  }

  private convertBenchmarksToInsights(benchmarks: BenchmarkAnalysis[]): FinancialInsight[] {
    return benchmarks.map(benchmark => ({
      id: `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'opportunity' as const,
      title: `${benchmark.metric} Benchmark Analysis`,
      description: `Performance is ${benchmark.performance} (${benchmark.percentile}th percentile)`,
      impact: benchmark.performance === 'poor' ? 'high' : benchmark.performance === 'below_average' ? 'medium' : 'low',
      confidence: 0.8,
      actionItems: benchmark.recommendations,
      data: benchmark,
      metadata: {
        source: 'benchmark_analysis',
        timeframe: 'current',
        category: 'performance',
        tags: ['benchmark', benchmark.performance, benchmark.metric],
      },
      createdAt: new Date(),
    }));
  }

  private convertCashFlowToInsights(predictions: CashFlowPrediction[]): FinancialInsight[] {
    return predictions.map(pred => ({
      id: `cashflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: pred.netCashFlow < 0 ? 'risk' : 'opportunity',
      title: `Cash Flow Prediction: ${pred.period}`,
      description: `Predicted net cash flow: $${pred.netCashFlow.toLocaleString()}`,
      impact: Math.abs(pred.netCashFlow) > 50000 ? 'high' : Math.abs(pred.netCashFlow) > 20000 ? 'medium' : 'low',
      confidence: pred.confidence,
      actionItems: pred.recommendations,
      data: pred,
      metadata: {
        source: 'cash_flow_prediction',
        timeframe: pred.period,
        category: 'cash_management',
        tags: ['cash_flow', 'prediction', pred.netCashFlow < 0 ? 'deficit' : 'surplus'],
      },
      createdAt: new Date(),
    }));
  }

  private convertRisksToInsights(risks: RiskAssessment[]): FinancialInsight[] {
    return risks.map(risk => ({
      id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'risk' as const,
      title: `${risk.riskType} Risk Assessment`,
      description: risk.description,
      impact: risk.riskLevel === 'critical' ? 'critical' : risk.riskLevel === 'high' ? 'high' : risk.riskLevel === 'medium' ? 'medium' : 'low',
      confidence: risk.riskScore,
      actionItems: risk.mitigationStrategies,
      data: risk,
      metadata: {
        source: 'risk_assessment',
        timeframe: 'ongoing',
        category: 'risk_management',
        tags: ['risk', risk.riskType, risk.riskLevel],
      },
      createdAt: new Date(),
    }));
  }

  private async storeInsight(insight: any): Promise<void> {
    try {
      await db.aiInsight.create({
        data: {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId: insight.organizationId,
          type: insight.type,
          data: insight.data,
          confidence: insight.confidence,
          metadata: insight.metadata,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store insight:', error);
    }
  }

  private async storeInsights(insights: FinancialInsight[], clientId: string, organizationId: string): Promise<void> {
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
              actionItems: insight.actionItems,
              data: insight.data,
              metadata: insight.metadata,
              createdAt: insight.createdAt,
            },
          })
        )
      );
    } catch (error) {
      console.error('Failed to store insights:', error);
    }
  }

  private hashData(data: any): string {
    // Simple hash function for data versioning
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }
}

export const aiInsightsService = new AIInsightsService();
export default aiInsightsService;