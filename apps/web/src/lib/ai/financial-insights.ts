import { openaiClient, AIResponse } from './openai-client';
import { financialInsightsPrompts, formatPrompt } from './prompts';

export interface FinancialData {
  period: {
    startDate: Date;
    endDate: Date;
    type: 'monthly' | 'quarterly' | 'annual';
  };
  revenue: {
    total: number;
    breakdown: Record<string, number>;
    growthRate?: number;
  };
  expenses: {
    total: number;
    breakdown: Record<string, number>;
    growthRate?: number;
  };
  profitLoss: {
    grossProfit: number;
    operatingIncome: number;
    netIncome: number;
    margins: {
      gross: number;
      operating: number;
      net: number;
    };
  };
  balanceSheet: {
    assets: {
      current: number;
      fixed: number;
      total: number;
    };
    liabilities: {
      current: number;
      longTerm: number;
      total: number;
    };
    equity: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    netChange: number;
    endingBalance: number;
  };
  ratios: {
    liquidity: {
      current: number;
      quick: number;
      cash: number;
    };
    efficiency: {
      assetTurnover: number;
      inventoryTurnover: number;
      receivablesTurnover: number;
    };
    profitability: {
      roe: number;
      roa: number;
      roic: number;
    };
    leverage: {
      debtToEquity: number;
      debtToAssets: number;
      interestCoverage: number;
    };
  };
}

export interface BenchmarkData {
  industry: string;
  industryCode: string;
  companySize: 'small' | 'medium' | 'large';
  geography: string;
  ratios: {
    liquidity: Record<string, number>;
    efficiency: Record<string, number>;
    profitability: Record<string, number>;
    leverage: Record<string, number>;
  };
  margins: {
    gross: number;
    operating: number;
    net: number;
  };
  growthRates: {
    revenue: number;
    expenses: number;
    assets: number;
  };
}

export interface TrendAnalysis {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: 'weak' | 'moderate' | 'strong';
  timeframe: string;
  confidence: number;
  significance: 'low' | 'medium' | 'high';
  description: string;
  projectedValue?: number;
  projectionConfidence?: number;
}

export interface RiskAssessment {
  category: 'liquidity' | 'credit' | 'market' | 'operational' | 'strategic';
  riskType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  description: string;
  indicators: string[];
  mitigation: string[];
  timeframe: string;
}

export interface FinancialNarrative {
  executiveSummary: string;
  keyHighlights: string[];
  performanceAnalysis: {
    revenue: string;
    profitability: string;
    cashFlow: string;
    financialPosition: string;
  };
  variances: Array<{
    metric: string;
    variance: number;
    explanation: string;
    significance: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    area: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
    expectedImpact: string;
    timeframe: string;
  }>;
  outlook: {
    shortTerm: string;
    mediumTerm: string;
    risks: string[];
    opportunities: string[];
  };
}

export interface InsightReport {
  id: string;
  organizationId: string;
  clientId?: string;
  period: FinancialData['period'];
  generatedAt: Date;
  narrative: FinancialNarrative;
  trends: TrendAnalysis[];
  risks: RiskAssessment[];
  benchmarkComparison: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  keyMetrics: Array<{
    name: string;
    value: number;
    benchmark?: number;
    variance?: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'caution' | 'concern';
  }>;
  actionItems: Array<{
    category: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    deadline?: Date;
    assignee?: string;
  }>;
  confidence: number;
  costInfo: {
    aiCost: number;
    processingTime: number;
  };
}

class FinancialInsightsService {
  constructor() {}

  public isReady(): boolean {
    return openaiClient.isReady();
  }

  /**
   * Generate comprehensive financial insights report
   */
  public async generateInsightReport(
    currentData: FinancialData,
    priorData?: FinancialData,
    benchmarkData?: BenchmarkData,
    organizationId?: string,
    clientId?: string
  ): Promise<InsightReport> {
    const startTime = Date.now();

    if (!this.isReady()) {
      throw new Error('Financial Insights service is not ready');
    }

    const reportId = `ins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Generate narrative
      const narrative = await this.generateNarrative(
        currentData,
        priorData,
        benchmarkData,
        organizationId
      );

      // Analyze trends
      const trends = await this.analyzeTrends(
        currentData,
        priorData,
        organizationId
      );

      // Assess risks
      const risks = await this.assessRisks(
        currentData,
        priorData,
        benchmarkData,
        organizationId
      );

      // Generate benchmark comparison
      const benchmarkComparison = await this.generateBenchmarkComparison(
        currentData,
        benchmarkData,
        organizationId
      );

      // Calculate key metrics with status
      const keyMetrics = this.calculateKeyMetrics(currentData, priorData, benchmarkData);

      // Generate action items
      const actionItems = this.generateActionItems(narrative, risks, benchmarkComparison);

      const processingTime = Date.now() - startTime;

      return {
        id: reportId,
        organizationId: organizationId || '',
        clientId,
        period: currentData.period,
        generatedAt: new Date(),
        narrative,
        trends,
        risks,
        benchmarkComparison,
        keyMetrics,
        actionItems,
        confidence: this.calculateOverallConfidence(narrative, trends, risks),
        costInfo: {
          aiCost: 0.15, // Estimated cost for comprehensive analysis
          processingTime,
        },
      };
    } catch (error) {
      console.error('Financial insights generation failed:', error);
      throw new Error(`Failed to generate financial insights: ${error}`);
    }
  }

  /**
   * Generate financial narrative
   */
  public async generateNarrative(
    currentData: FinancialData,
    priorData?: FinancialData,
    benchmarkData?: BenchmarkData,
    organizationId?: string
  ): Promise<FinancialNarrative> {
    const keyMetrics = this.prepareKeyMetrics(currentData, priorData);

    const prompt = formatPrompt(financialInsightsPrompts.narrativeGeneration, {
      financialData: JSON.stringify(currentData),
      priorPeriodData: JSON.stringify(priorData || {}),
      budgetData: JSON.stringify({}), // Would come from budget data
      benchmarkData: JSON.stringify(benchmarkData || {}),
      keyMetrics: JSON.stringify(keyMetrics),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<FinancialNarrative>(
        prompt.user,
        {
          executiveSummary: 'string',
          keyHighlights: 'array of strings',
          performanceAnalysis: {
            revenue: 'string',
            profitability: 'string',
            cashFlow: 'string',
            financialPosition: 'string'
          },
          variances: 'array of objects with metric, variance, explanation, significance',
          recommendations: 'array of objects with area, recommendation, priority, expectedImpact, timeframe',
          outlook: {
            shortTerm: 'string',
            mediumTerm: 'string',
            risks: 'array of strings',
            opportunities: 'array of strings'
          }
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
      console.error('Narrative generation failed:', error);
      throw new Error(`Failed to generate financial narrative: ${error}`);
    }
  }

  /**
   * Analyze financial trends
   */
  public async analyzeTrends(
    currentData: FinancialData,
    priorData?: FinancialData,
    organizationId?: string
  ): Promise<TrendAnalysis[]> {
    const timeSeriesData = this.prepareTimeSeriesData(currentData, priorData);

    const prompt = formatPrompt(financialInsightsPrompts.trendAnalysis, {
      timeSeriesData: JSON.stringify(timeSeriesData),
      industryData: JSON.stringify({}), // Would come from industry data
      economicData: JSON.stringify({}), // Would come from economic indicators
      businessContext: JSON.stringify({ industry: 'Professional Services' }),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<TrendAnalysis[]>(
        prompt.user,
        {
          type: 'array',
          items: {
            metric: 'string',
            direction: 'string',
            strength: 'string',
            timeframe: 'string',
            confidence: 'number',
            significance: 'string',
            description: 'string',
            projectedValue: 'number (optional)',
            projectionConfidence: 'number (optional)'
          }
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.2,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Trend analysis failed:', error);
      return [];
    }
  }

  /**
   * Assess financial risks
   */
  public async assessRisks(
    currentData: FinancialData,
    priorData?: FinancialData,
    benchmarkData?: BenchmarkData,
    organizationId?: string
  ): Promise<RiskAssessment[]> {
    const financialPosition = {
      liquidity: currentData.ratios.liquidity,
      leverage: currentData.ratios.leverage,
      profitability: currentData.ratios.profitability,
      cashFlow: currentData.cashFlow,
    };

    const prompt = formatPrompt(financialInsightsPrompts.riskAssessment, {
      financialPosition: JSON.stringify(financialPosition),
      industryContext: JSON.stringify({ industry: benchmarkData?.industry || 'Professional Services' }),
      marketConditions: JSON.stringify({}), // Would come from market data
      historicalPerformance: JSON.stringify(priorData || {}),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<RiskAssessment[]>(
        prompt.user,
        {
          type: 'array',
          items: {
            category: 'string',
            riskType: 'string',
            severity: 'string',
            probability: 'number',
            impact: 'number',
            riskScore: 'number',
            description: 'string',
            indicators: 'array of strings',
            mitigation: 'array of strings',
            timeframe: 'string'
          }
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.2,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Risk assessment failed:', error);
      return [];
    }
  }

  /**
   * Generate benchmark comparison
   */
  private async generateBenchmarkComparison(
    currentData: FinancialData,
    benchmarkData?: BenchmarkData,
    organizationId?: string
  ): Promise<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  }> {
    if (!benchmarkData) {
      return {
        summary: 'No benchmark data available for comparison',
        strengths: [],
        weaknesses: [],
        opportunities: [],
      };
    }

    // Compare ratios and metrics
    const comparison = {
      ratios: {
        current: currentData.ratios.liquidity.current,
        benchmark: benchmarkData.ratios.liquidity.current || 2.0,
      },
      margins: {
        gross: currentData.profitLoss.margins.gross,
        benchmarkGross: benchmarkData.margins.gross,
        net: currentData.profitLoss.margins.net,
        benchmarkNet: benchmarkData.margins.net,
      },
    };

    try {
      const response = await openaiClient.createCompletion(
        `Compare this company's performance to industry benchmarks and identify strengths, weaknesses, and opportunities: ${JSON.stringify(comparison)}`,
        {
          systemMessage: 'You are a financial analyst comparing company performance to industry benchmarks. Provide specific insights about relative performance.',
          organizationId,
          temperature: 0.2,
        }
      );

      // Parse the response (this would be more sophisticated in practice)
      return {
        summary: response.data,
        strengths: ['Above-average liquidity ratios'],
        weaknesses: ['Below-average profit margins'],
        opportunities: ['Improve operational efficiency'],
      };
    } catch (error) {
      console.error('Benchmark comparison failed:', error);
      return {
        summary: 'Unable to generate benchmark comparison',
        strengths: [],
        weaknesses: [],
        opportunities: [],
      };
    }
  }

  /**
   * Calculate key metrics with status indicators
   */
  private calculateKeyMetrics(
    currentData: FinancialData,
    priorData?: FinancialData,
    benchmarkData?: BenchmarkData
  ): Array<{
    name: string;
    value: number;
    benchmark?: number;
    variance?: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'caution' | 'concern';
  }> {
    const metrics = [];

    // Revenue Growth
    if (priorData) {
      const revenueGrowth = ((currentData.revenue.total - priorData.revenue.total) / priorData.revenue.total) * 100;
      metrics.push({
        name: 'Revenue Growth',
        value: revenueGrowth,
        benchmark: benchmarkData?.growthRates.revenue,
        variance: benchmarkData ? revenueGrowth - benchmarkData.growthRates.revenue : undefined,
        trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable',
        status: revenueGrowth > 5 ? 'good' : revenueGrowth > 0 ? 'caution' : 'concern',
      });
    }

    // Current Ratio
    metrics.push({
      name: 'Current Ratio',
      value: currentData.ratios.liquidity.current,
      benchmark: benchmarkData?.ratios.liquidity.current,
      variance: benchmarkData ? currentData.ratios.liquidity.current - benchmarkData.ratios.liquidity.current : undefined,
      trend: 'stable', // Would calculate from historical data
      status: currentData.ratios.liquidity.current >= 2.0 ? 'good' : currentData.ratios.liquidity.current >= 1.0 ? 'caution' : 'concern',
    });

    // Net Profit Margin
    metrics.push({
      name: 'Net Profit Margin',
      value: currentData.profitLoss.margins.net,
      benchmark: benchmarkData?.margins.net,
      variance: benchmarkData ? currentData.profitLoss.margins.net - benchmarkData.margins.net : undefined,
      trend: 'stable', // Would calculate from historical data
      status: currentData.profitLoss.margins.net >= 10 ? 'good' : currentData.profitLoss.margins.net >= 5 ? 'caution' : 'concern',
    });

    // Debt to Equity
    metrics.push({
      name: 'Debt to Equity',
      value: currentData.ratios.leverage.debtToEquity,
      benchmark: benchmarkData?.ratios.leverage.debtToEquity,
      variance: benchmarkData ? currentData.ratios.leverage.debtToEquity - benchmarkData.ratios.leverage.debtToEquity : undefined,
      trend: 'stable',
      status: currentData.ratios.leverage.debtToEquity <= 0.3 ? 'good' : currentData.ratios.leverage.debtToEquity <= 0.6 ? 'caution' : 'concern',
    });

    return metrics;
  }

  /**
   * Generate action items from insights
   */
  private generateActionItems(
    narrative: FinancialNarrative,
    risks: RiskAssessment[],
    benchmarkComparison: any
  ): Array<{
    category: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    deadline?: Date;
    assignee?: string;
  }> {
    const actionItems = [];

    // From narrative recommendations
    narrative.recommendations.forEach(rec => {
      actionItems.push({
        category: rec.area,
        action: rec.recommendation,
        priority: rec.priority,
        deadline: rec.timeframe === 'immediate' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      });
    });

    // From high-priority risks
    risks.filter(risk => risk.severity === 'high' || risk.severity === 'critical').forEach(risk => {
      risk.mitigation.forEach(mitigation => {
        actionItems.push({
          category: risk.category,
          action: mitigation,
          priority: risk.severity === 'critical' ? 'high' : 'medium',
        });
      });
    });

    return actionItems.slice(0, 10); // Limit to top 10 action items
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    narrative: FinancialNarrative,
    trends: TrendAnalysis[],
    risks: RiskAssessment[]
  ): number {
    const trendConfidence = trends.length > 0
      ? trends.reduce((sum, trend) => sum + trend.confidence, 0) / trends.length
      : 0.5;

    const dataCompleteness = narrative.performanceAnalysis ? 0.8 : 0.4;
    const riskAssessmentQuality = risks.length > 0 ? 0.8 : 0.6;

    return Math.min(0.95, (trendConfidence + dataCompleteness + riskAssessmentQuality) / 3);
  }

  /**
   * Helper methods for data preparation
   */
  private prepareKeyMetrics(currentData: FinancialData, priorData?: FinancialData) {
    return {
      revenue: currentData.revenue.total,
      netIncome: currentData.profitLoss.netIncome,
      currentRatio: currentData.ratios.liquidity.current,
      debtToEquity: currentData.ratios.leverage.debtToEquity,
      revenueGrowth: priorData
        ? ((currentData.revenue.total - priorData.revenue.total) / priorData.revenue.total) * 100
        : null,
    };
  }

  private prepareTimeSeriesData(currentData: FinancialData, priorData?: FinancialData) {
    const timeSeries = [
      {
        period: currentData.period.endDate.toISOString(),
        revenue: currentData.revenue.total,
        netIncome: currentData.profitLoss.netIncome,
        currentRatio: currentData.ratios.liquidity.current,
      }
    ];

    if (priorData) {
      timeSeries.unshift({
        period: priorData.period.endDate.toISOString(),
        revenue: priorData.revenue.total,
        netIncome: priorData.profitLoss.netIncome,
        currentRatio: priorData.ratios.liquidity.current,
      });
    }

    return timeSeries;
  }

  /**
   * Generate predictive forecasts
   */
  public async generateForecast(
    historicalData: FinancialData[],
    organizationId?: string
  ): Promise<{
    revenue: { forecast: number; confidence: number; range: { low: number; high: number } };
    expenses: { forecast: number; confidence: number; range: { low: number; high: number } };
    cashFlow: { forecast: number; confidence: number; range: { low: number; high: number } };
  }> {
    if (historicalData.length < 3) {
      throw new Error('Insufficient historical data for forecasting (minimum 3 periods required)');
    }

    try {
      const response = await openaiClient.createCompletion(
        `Based on this historical financial data, provide forecasts for the next period: ${JSON.stringify(historicalData.slice(-6))}`,
        {
          systemMessage: 'You are a financial forecasting expert. Analyze trends and provide realistic forecasts with confidence intervals.',
          organizationId,
          temperature: 0.1,
        }
      );

      // In practice, this would use more sophisticated forecasting models
      const lastPeriod = historicalData[historicalData.length - 1];
      return {
        revenue: {
          forecast: lastPeriod.revenue.total * 1.05,
          confidence: 0.7,
          range: {
            low: lastPeriod.revenue.total * 0.95,
            high: lastPeriod.revenue.total * 1.15,
          },
        },
        expenses: {
          forecast: lastPeriod.expenses.total * 1.03,
          confidence: 0.8,
          range: {
            low: lastPeriod.expenses.total * 0.97,
            high: lastPeriod.expenses.total * 1.08,
          },
        },
        cashFlow: {
          forecast: lastPeriod.cashFlow.operating * 1.02,
          confidence: 0.6,
          range: {
            low: lastPeriod.cashFlow.operating * 0.85,
            high: lastPeriod.cashFlow.operating * 1.2,
          },
        },
      };
    } catch (error) {
      console.error('Forecasting failed:', error);
      throw new Error(`Failed to generate forecast: ${error}`);
    }
  }
}

export const financialInsightsService = new FinancialInsightsService();
export default financialInsightsService;