import { openaiClient, AIResponse } from './openai-client';
import { advisoryPrompts, formatPrompt } from './prompts';
import { FinancialData, BenchmarkData } from './financial-insights';

export interface BusinessProfile {
  companyName: string;
  industry: string;
  industryCode: string;
  businessModel: string;
  foundedDate: Date;
  employeeCount: number;
  annualRevenue: number;
  location: {
    city: string;
    state: string;
    country: string;
  };
  keyProducts: string[];
  targetMarkets: string[];
  competitivePosition: 'market_leader' | 'challenger' | 'follower' | 'niche';
  growthStage: 'startup' | 'growth' | 'mature' | 'decline';
}

export interface BusinessHealth {
  overallScore: number; // 0-100
  financialHealth: {
    score: number;
    indicators: Array<{
      metric: string;
      value: number;
      benchmark?: number;
      status: 'excellent' | 'good' | 'fair' | 'poor';
      trend: 'improving' | 'stable' | 'declining';
    }>;
  };
  operationalHealth: {
    score: number;
    indicators: Array<{
      area: string;
      score: number;
      issues: string[];
      recommendations: string[];
    }>;
  };
  marketHealth: {
    score: number;
    marketTrends: Array<{
      trend: string;
      impact: 'positive' | 'neutral' | 'negative';
      timeframe: string;
    }>;
    competitivePosition: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
  };
  riskFactors: Array<{
    category: string;
    risk: string;
    probability: number;
    impact: number;
    mitigation: string[];
  }>;
}

export interface GrowthRecommendation {
  category: 'revenue' | 'efficiency' | 'market_expansion' | 'product_development' | 'strategic';
  recommendation: string;
  description: string;
  expectedImpact: {
    revenueIncrease?: number;
    costReduction?: number;
    timeframe: string;
    confidence: number;
  };
  implementation: {
    steps: string[];
    resources: string[];
    timeline: string;
    cost?: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  metrics: Array<{
    metric: string;
    target: number;
    timeframe: string;
  }>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CashFlowOptimization {
  currentCashCycle: number; // in days
  optimizedCashCycle: number;
  improvements: Array<{
    area: 'receivables' | 'inventory' | 'payables' | 'operations';
    currentDays: number;
    targetDays: number;
    strategy: string;
    implementation: string[];
    impact: number; // cash flow improvement
  }>;
  financingRecommendations: Array<{
    type: 'line_of_credit' | 'term_loan' | 'factoring' | 'equity';
    amount: number;
    cost: number;
    purpose: string;
    timing: string;
  }>;
  seasonalConsiderations: Array<{
    period: string;
    challenge: string;
    strategy: string;
  }>;
}

export interface CompetitiveAnalysis {
  marketOverview: {
    marketSize: number;
    growthRate: number;
    keyTrends: string[];
    barriers: string[];
  };
  directCompetitors: Array<{
    name: string;
    marketShare?: number;
    strengths: string[];
    weaknesses: string[];
    strategy: string;
  }>;
  competitiveAdvantages: string[];
  gaps: string[];
  opportunityAreas: string[];
  strategicRecommendations: string[];
}

export interface StrategicPlan {
  vision: string;
  mission: string;
  objectives: Array<{
    category: string;
    objective: string;
    timeframe: string;
    success_metrics: string[];
    initiatives: Array<{
      name: string;
      description: string;
      owner: string;
      timeline: string;
      budget?: number;
      dependencies: string[];
    }>;
  }>;
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  keyPerformanceIndicators: Array<{
    metric: string;
    current: number;
    target: number;
    timeframe: string;
    frequency: string;
  }>;
  riskMitigation: Array<{
    risk: string;
    probability: number;
    impact: number;
    mitigation: string[];
    contingency: string[];
  }>;
}

export interface AdvisoryReport {
  id: string;
  clientId: string;
  organizationId: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  businessHealth: BusinessHealth;
  growthRecommendations: GrowthRecommendation[];
  cashFlowOptimization: CashFlowOptimization;
  competitiveAnalysis: CompetitiveAnalysis;
  strategicPlan?: StrategicPlan;
  executiveSummary: string;
  keyInsights: string[];
  actionPlan: Array<{
    action: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: string;
    owner?: string;
    expectedOutcome: string;
  }>;
  confidence: number;
  nextReviewDate: Date;
}

class AdvisoryCopilotService {
  constructor() {}

  public isReady(): boolean {
    return openaiClient.isReady();
  }

  /**
   * Analyze overall business health
   */
  public async analyzeBusinessHealth(
    businessProfile: BusinessProfile,
    financialData: FinancialData,
    benchmarkData?: BenchmarkData,
    organizationId?: string
  ): Promise<BusinessHealth> {
    if (!this.isReady()) {
      throw new Error('Advisory Copilot service is not ready');
    }

    const prompt = formatPrompt(advisoryPrompts.businessAnalysis, {
      financialData: JSON.stringify(financialData),
      industryBenchmarks: JSON.stringify(benchmarkData || {}),
      businessModel: businessProfile.businessModel,
      marketPosition: businessProfile.competitivePosition,
      historicalTrends: JSON.stringify({}), // Would include historical data
      businessGoals: 'growth and profitability', // Would come from client goals
    });

    try {
      const response = await openaiClient.createStructuredCompletion<{
        overallScore: number;
        financialMetrics: Array<{
          metric: string;
          value: number;
          benchmark?: number;
          status: string;
          trend: string;
        }>;
        operationalAssessment: Array<{
          area: string;
          score: number;
          issues: string[];
          recommendations: string[];
        }>;
        riskFactors: Array<{
          category: string;
          risk: string;
          probability: number;
          impact: number;
          mitigation: string[];
        }>;
      }>(
        prompt.user,
        {
          overallScore: 'number',
          financialMetrics: 'array of objects with metric, value, benchmark, status, trend',
          operationalAssessment: 'array of objects with area, score, issues, recommendations',
          riskFactors: 'array of objects with category, risk, probability, impact, mitigation'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.2,
        }
      );

      // Calculate component scores
      const financialScore = this.calculateFinancialScore(financialData, benchmarkData);
      const operationalScore = response.data.operationalAssessment.length > 0
        ? response.data.operationalAssessment.reduce((sum, area) => sum + area.score, 0) / response.data.operationalAssessment.length
        : 75;

      return {
        overallScore: response.data.overallScore,
        financialHealth: {
          score: financialScore,
          indicators: response.data.financialMetrics.map(metric => ({
            metric: metric.metric,
            value: metric.value,
            benchmark: metric.benchmark,
            status: metric.status as 'excellent' | 'good' | 'fair' | 'poor',
            trend: metric.trend as 'improving' | 'stable' | 'declining',
          })),
        },
        operationalHealth: {
          score: operationalScore,
          indicators: response.data.operationalAssessment,
        },
        marketHealth: {
          score: 80, // Would calculate from market analysis
          marketTrends: [
            { trend: 'Digital transformation accelerating', impact: 'positive', timeframe: '2024-2025' },
            { trend: 'Increased competition', impact: 'negative', timeframe: 'ongoing' },
          ],
          competitivePosition: {
            strengths: ['Strong financial position', 'Experienced team'],
            weaknesses: ['Limited market presence', 'Technology gap'],
            opportunities: ['Digital services expansion', 'New market segments'],
            threats: ['Economic uncertainty', 'Regulatory changes'],
          },
        },
        riskFactors: response.data.riskFactors,
      };
    } catch (error) {
      console.error('Business health analysis failed:', error);
      throw new Error(`Failed to analyze business health: ${error}`);
    }
  }

  /**
   * Generate growth recommendations
   */
  public async generateGrowthRecommendations(
    businessProfile: BusinessProfile,
    financialData: FinancialData,
    businessHealth: BusinessHealth,
    organizationId?: string
  ): Promise<GrowthRecommendation[]> {
    if (!this.isReady()) {
      throw new Error('Advisory Copilot service is not ready');
    }

    const currentState = {
      revenue: financialData.revenue.total,
      profitMargin: financialData.profitLoss.margins.net,
      employeeCount: businessProfile.employeeCount,
      marketPosition: businessProfile.competitivePosition,
    };

    const prompt = formatPrompt(advisoryPrompts.strategicPlanning, {
      currentState: JSON.stringify(currentState),
      visionGoals: 'Achieve sustainable growth and market leadership',
      marketAnalysis: JSON.stringify({}), // Would include market data
      competitivePosition: businessProfile.competitivePosition,
      availableResources: JSON.stringify({
        financial: financialData.balanceSheet.assets.total,
        human: businessProfile.employeeCount,
        market: businessProfile.targetMarkets,
      }),
      constraints: JSON.stringify({
        budget: financialData.cashFlow.endingBalance * 0.2, // 20% of cash
        timeline: '12 months',
        risk_tolerance: 'moderate',
      }),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<GrowthRecommendation[]>(
        prompt.user,
        {
          type: 'array',
          items: {
            category: 'string',
            recommendation: 'string',
            description: 'string',
            expectedImpact: {
              revenueIncrease: 'number (optional)',
              costReduction: 'number (optional)',
              timeframe: 'string',
              confidence: 'number'
            },
            implementation: {
              steps: 'array of strings',
              resources: 'array of strings',
              timeline: 'string',
              cost: 'number (optional)',
              riskLevel: 'string'
            },
            metrics: 'array of objects with metric, target, timeframe',
            priority: 'string'
          }
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.3,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Growth recommendations generation failed:', error);
      return [];
    }
  }

  /**
   * Optimize cash flow management
   */
  public async optimizeCashFlow(
    financialData: FinancialData,
    businessProfile: BusinessProfile,
    organizationId?: string
  ): Promise<CashFlowOptimization> {
    if (!this.isReady()) {
      throw new Error('Advisory Copilot service is not ready');
    }

    const prompt = formatPrompt(advisoryPrompts.cashFlowOptimization, {
      cashFlowData: JSON.stringify(financialData.cashFlow),
      receivablesData: JSON.stringify({}), // Would include A/R aging
      payablesData: JSON.stringify({}), // Would include A/P data
      inventoryData: JSON.stringify({}), // Would include inventory data
      seasonalData: JSON.stringify({}), // Would include seasonal patterns
      growthPlans: JSON.stringify({ targetGrowth: '15% annually' }),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<{
        currentCashCycle: number;
        optimizedCashCycle: number;
        improvements: Array<{
          area: string;
          currentDays: number;
          targetDays: number;
          strategy: string;
          implementation: string[];
          impact: number;
        }>;
        financingOptions: Array<{
          type: string;
          amount: number;
          cost: number;
          purpose: string;
          timing: string;
        }>;
        seasonalStrategies: Array<{
          period: string;
          challenge: string;
          strategy: string;
        }>;
      }>(
        prompt.user,
        {
          currentCashCycle: 'number',
          optimizedCashCycle: 'number',
          improvements: 'array of objects with area, currentDays, targetDays, strategy, implementation, impact',
          financingOptions: 'array of objects with type, amount, cost, purpose, timing',
          seasonalStrategies: 'array of objects with period, challenge, strategy'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.2,
        }
      );

      return {
        currentCashCycle: response.data.currentCashCycle,
        optimizedCashCycle: response.data.optimizedCashCycle,
        improvements: response.data.improvements.map(imp => ({
          area: imp.area as 'receivables' | 'inventory' | 'payables' | 'operations',
          currentDays: imp.currentDays,
          targetDays: imp.targetDays,
          strategy: imp.strategy,
          implementation: imp.implementation,
          impact: imp.impact,
        })),
        financingRecommendations: response.data.financingOptions.map(opt => ({
          type: opt.type as 'line_of_credit' | 'term_loan' | 'factoring' | 'equity',
          amount: opt.amount,
          cost: opt.cost,
          purpose: opt.purpose,
          timing: opt.timing,
        })),
        seasonalConsiderations: response.data.seasonalStrategies,
      };
    } catch (error) {
      console.error('Cash flow optimization failed:', error);
      throw new Error(`Failed to optimize cash flow: ${error}`);
    }
  }

  /**
   * Perform competitive analysis
   */
  public async analyzeCompetition(
    businessProfile: BusinessProfile,
    organizationId?: string
  ): Promise<CompetitiveAnalysis> {
    if (!this.isReady()) {
      throw new Error('Advisory Copilot service is not ready');
    }

    try {
      const response = await openaiClient.createCompletion(
        `Perform a competitive analysis for a ${businessProfile.industry} company (${businessProfile.businessModel}).
        Company details: ${businessProfile.employeeCount} employees, $${businessProfile.annualRevenue} annual revenue,
        located in ${businessProfile.location.city}, ${businessProfile.location.state}.

        Analyze market size, key competitors, competitive advantages, and strategic opportunities.`,
        {
          systemMessage: 'You are a strategic business consultant performing competitive analysis. Provide insights on market dynamics, competitor positioning, and strategic opportunities.',
          organizationId,
          temperature: 0.3,
        }
      );

      // Parse the response into structured format
      // In practice, this would use more sophisticated parsing
      return {
        marketOverview: {
          marketSize: 1000000000, // Would calculate from market data
          growthRate: 0.05,
          keyTrends: ['Digital transformation', 'Consolidation', 'Remote work adoption'],
          barriers: ['High capital requirements', 'Regulatory compliance', 'Brand loyalty'],
        },
        directCompetitors: [
          {
            name: 'Competitor A',
            marketShare: 25,
            strengths: ['Brand recognition', 'Large client base'],
            weaknesses: ['Legacy technology', 'High costs'],
            strategy: 'Market expansion',
          },
        ],
        competitiveAdvantages: ['Specialized expertise', 'Cost efficiency', 'Client relationships'],
        gaps: ['Technology capabilities', 'Market presence', 'Service breadth'],
        opportunityAreas: ['Digital services', 'New market segments', 'Strategic partnerships'],
        strategicRecommendations: ['Invest in technology', 'Expand service offerings', 'Build partnerships'],
      };
    } catch (error) {
      console.error('Competitive analysis failed:', error);
      throw new Error(`Failed to analyze competition: ${error}`);
    }
  }

  /**
   * Create strategic plan
   */
  public async createStrategicPlan(
    businessProfile: BusinessProfile,
    businessHealth: BusinessHealth,
    growthRecommendations: GrowthRecommendation[],
    organizationId?: string
  ): Promise<StrategicPlan> {
    if (!this.isReady()) {
      throw new Error('Advisory Copilot service is not ready');
    }

    const prompt = formatPrompt(advisoryPrompts.strategicPlanning, {
      currentState: JSON.stringify({
        healthScore: businessHealth.overallScore,
        position: businessProfile.competitivePosition,
        stage: businessProfile.growthStage,
      }),
      visionGoals: 'Become the leading provider in our market segment with sustainable growth',
      marketAnalysis: JSON.stringify({}), // Would include market analysis
      competitivePosition: businessProfile.competitivePosition,
      availableResources: JSON.stringify({
        team: businessProfile.employeeCount,
        revenue: businessProfile.annualRevenue,
      }),
      constraints: JSON.stringify({
        budget: businessProfile.annualRevenue * 0.1, // 10% of revenue for strategic initiatives
        timeline: '3 years',
      }),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<StrategicPlan>(
        prompt.user,
        {
          vision: 'string',
          mission: 'string',
          objectives: 'array of objects with category, objective, timeframe, success_metrics, initiatives',
          swotAnalysis: {
            strengths: 'array of strings',
            weaknesses: 'array of strings',
            opportunities: 'array of strings',
            threats: 'array of strings'
          },
          keyPerformanceIndicators: 'array of objects with metric, current, target, timeframe, frequency',
          riskMitigation: 'array of objects with risk, probability, impact, mitigation, contingency'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.2,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Strategic plan creation failed:', error);
      throw new Error(`Failed to create strategic plan: ${error}`);
    }
  }

  /**
   * Generate comprehensive advisory report
   */
  public async generateAdvisoryReport(
    businessProfile: BusinessProfile,
    financialData: FinancialData,
    benchmarkData?: BenchmarkData,
    organizationId?: string,
    clientId?: string
  ): Promise<AdvisoryReport> {
    const reportId = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Analyze business health
      const businessHealth = await this.analyzeBusinessHealth(
        businessProfile,
        financialData,
        benchmarkData,
        organizationId
      );

      // Generate growth recommendations
      const growthRecommendations = await this.generateGrowthRecommendations(
        businessProfile,
        financialData,
        businessHealth,
        organizationId
      );

      // Optimize cash flow
      const cashFlowOptimization = await this.optimizeCashFlow(
        financialData,
        businessProfile,
        organizationId
      );

      // Analyze competition
      const competitiveAnalysis = await this.analyzeCompetition(
        businessProfile,
        organizationId
      );

      // Create strategic plan (optional)
      const strategicPlan = await this.createStrategicPlan(
        businessProfile,
        businessHealth,
        growthRecommendations,
        organizationId
      );

      // Generate executive summary
      const executiveSummary = await this.generateExecutiveSummary(
        businessHealth,
        growthRecommendations,
        cashFlowOptimization,
        organizationId
      );

      // Create action plan
      const actionPlan = this.createActionPlan(growthRecommendations, cashFlowOptimization);

      return {
        id: reportId,
        clientId: clientId || '',
        organizationId: organizationId || '',
        generatedAt: new Date(),
        period: financialData.period,
        businessHealth,
        growthRecommendations,
        cashFlowOptimization,
        competitiveAnalysis,
        strategicPlan,
        executiveSummary,
        keyInsights: this.extractKeyInsights(businessHealth, growthRecommendations, competitiveAnalysis),
        actionPlan,
        confidence: this.calculateReportConfidence(businessHealth, growthRecommendations, cashFlowOptimization),
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      };
    } catch (error) {
      console.error('Advisory report generation failed:', error);
      throw new Error(`Failed to generate advisory report: ${error}`);
    }
  }

  /**
   * Helper methods
   */
  private calculateFinancialScore(financialData: FinancialData, benchmarkData?: BenchmarkData): number {
    let score = 70; // Base score

    // Profitability
    if (financialData.profitLoss.margins.net > 0.1) score += 10;
    else if (financialData.profitLoss.margins.net > 0.05) score += 5;

    // Liquidity
    if (financialData.ratios.liquidity.current > 2.0) score += 10;
    else if (financialData.ratios.liquidity.current > 1.5) score += 5;

    // Efficiency
    if (financialData.ratios.efficiency.assetTurnover > 1.0) score += 5;

    // Leverage
    if (financialData.ratios.leverage.debtToEquity < 0.3) score += 5;

    return Math.min(100, score);
  }

  private async generateExecutiveSummary(
    businessHealth: BusinessHealth,
    growthRecommendations: GrowthRecommendation[],
    cashFlowOptimization: CashFlowOptimization,
    organizationId?: string
  ): Promise<string> {
    try {
      const response = await openaiClient.createCompletion(
        `Generate an executive summary for a business advisory report with:
        - Overall health score: ${businessHealth.overallScore}/100
        - ${growthRecommendations.length} growth recommendations
        - Cash cycle optimization from ${cashFlowOptimization.currentCashCycle} to ${cashFlowOptimization.optimizedCashCycle} days

        Highlight key findings and strategic priorities.`,
        {
          systemMessage: 'You are a senior business advisor writing an executive summary. Be concise, actionable, and focus on strategic priorities.',
          organizationId,
          temperature: 0.3,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Executive summary generation failed:', error);
      return 'Executive summary could not be generated. Please review the detailed analysis below.';
    }
  }

  private extractKeyInsights(
    businessHealth: BusinessHealth,
    growthRecommendations: GrowthRecommendation[],
    competitiveAnalysis: CompetitiveAnalysis
  ): string[] {
    const insights = [];

    // Health insights
    if (businessHealth.overallScore > 80) {
      insights.push('Strong overall business health provides foundation for growth');
    } else if (businessHealth.overallScore < 60) {
      insights.push('Business health requires immediate attention and improvement');
    }

    // Growth insights
    const highPriorityRecommendations = growthRecommendations.filter(rec => rec.priority === 'high');
    if (highPriorityRecommendations.length > 0) {
      insights.push(`${highPriorityRecommendations.length} high-priority growth opportunities identified`);
    }

    // Competitive insights
    if (competitiveAnalysis.opportunityAreas.length > 0) {
      insights.push(`Market opportunities exist in: ${competitiveAnalysis.opportunityAreas.slice(0, 2).join(', ')}`);
    }

    return insights;
  }

  private createActionPlan(
    growthRecommendations: GrowthRecommendation[],
    cashFlowOptimization: CashFlowOptimization
  ): Array<{
    action: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: string;
    owner?: string;
    expectedOutcome: string;
  }> {
    const actionPlan = [];

    // High-priority growth actions
    growthRecommendations
      .filter(rec => rec.priority === 'high' || rec.priority === 'critical')
      .slice(0, 5)
      .forEach(rec => {
        actionPlan.push({
          action: rec.recommendation,
          category: rec.category,
          priority: rec.priority,
          timeline: rec.implementation.timeline,
          expectedOutcome: `${rec.expectedImpact.revenueIncrease ? '$' + rec.expectedImpact.revenueIncrease.toLocaleString() + ' revenue increase' : rec.expectedImpact.costReduction ? '$' + rec.expectedImpact.costReduction.toLocaleString() + ' cost reduction' : 'Operational improvement'}`,
        });
      });

    // Cash flow improvements
    cashFlowOptimization.improvements
      .filter(imp => imp.impact > 10000)
      .forEach(imp => {
        actionPlan.push({
          action: imp.strategy,
          category: 'cash_flow',
          priority: 'medium' as 'medium',
          timeline: '30-60 days',
          expectedOutcome: `$${imp.impact.toLocaleString()} cash flow improvement`,
        });
      });

    return actionPlan.slice(0, 10); // Top 10 actions
  }

  private calculateReportConfidence(
    businessHealth: BusinessHealth,
    growthRecommendations: GrowthRecommendation[],
    cashFlowOptimization: CashFlowOptimization
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on data quality and completeness
    if (businessHealth.overallScore > 0) confidence += 0.1;
    if (growthRecommendations.length > 0) confidence += 0.05;
    if (cashFlowOptimization.improvements.length > 0) confidence += 0.05;

    return Math.min(0.95, confidence);
  }
}

export const advisoryCopilotService = new AdvisoryCopilotService();
export default advisoryCopilotService;