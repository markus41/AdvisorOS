import { prisma } from '@/server/db';
import { createQuickBooksApiClient } from '@/lib/integrations/quickbooks/client';

// Predictive analytics interfaces
interface ClientLifetimeValue {
  clientId: string;
  currentValue: number;
  predictedLifetimeValue: number;
  remainingValue: number;
  churnRisk: number;
  valueSegment: 'high' | 'medium' | 'low';
  recommendedActions: string[];
  factors: {
    tenure: number;
    serviceUtilization: number;
    paymentHistory: number;
    engagement: number;
    growth: number;
  };
  projections: {
    sixMonths: number;
    oneYear: number;
    threeYears: number;
    fiveYears: number;
  };
}

interface TaxLiabilityPrediction {
  clientId: string;
  taxYear: number;
  estimatedLiability: {
    federal: number;
    state: number;
    local: number;
    total: number;
  };
  quarterlyEstimates: Array<{
    quarter: number;
    dueDate: Date;
    estimatedPayment: number;
    confidence: number;
  }>;
  taxPlanningOpportunities: Array<{
    strategy: string;
    potentialSavings: number;
    implementationComplexity: 'low' | 'medium' | 'high';
    deadline?: Date;
  }>;
  riskFactors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
}

interface ExpenseForecast {
  clientId: string;
  category: string;
  forecastPeriods: number;
  predictions: Array<{
    period: Date;
    predicted: number;
    confidence: number;
    seasonalityFactor: number;
  }>;
  trends: {
    shortTerm: 'increasing' | 'decreasing' | 'stable';
    longTerm: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
  };
  optimizationRecommendations: Array<{
    recommendation: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface WorkingCapitalAnalysis {
  clientId: string;
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;
  daysSalesOutstanding: number;
  daysInventoryOutstanding: number;
  daysPayableOutstanding: number;
  cashConversionCycle: number;
  recommendations: Array<{
    area: 'receivables' | 'inventory' | 'payables' | 'cash';
    action: string;
    impact: number;
    timeframe: string;
  }>;
  benchmarks: {
    industry: number;
    peers: number;
    target: number;
  };
}

export class PredictiveAnalyticsService {
  private organizationId: string;
  private quickBooksClient: ReturnType<typeof createQuickBooksApiClient>;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.quickBooksClient = createQuickBooksApiClient(organizationId);
  }

  /**
   * Calculate Client Lifetime Value using predictive models
   */
  async calculateClientLifetimeValue(
    clientId?: string,
    options: {
      includeChurnRisk?: boolean;
      projectionPeriods?: number; // months
      includeSegmentation?: boolean;
      includeRecommendations?: boolean;
    } = {}
  ): Promise<ClientLifetimeValue[]> {
    const {
      includeChurnRisk = true,
      projectionPeriods = 60, // 5 years
      includeSegmentation = true,
      includeRecommendations = true
    } = options;

    try {
      // Fetch client data for analysis
      const clients = await this.fetchClientDataForCLV(clientId);
      const clvResults: ClientLifetimeValue[] = [];

      for (const client of clients) {
        // Calculate historical value and patterns
        const historicalAnalysis = await this.analyzeClientHistory(client);

        // Apply CLV prediction model
        const clvPrediction = await this.applyCLVModel(client, historicalAnalysis);

        // Calculate churn risk if requested
        let churnRisk = 0;
        if (includeChurnRisk) {
          churnRisk = await this.calculateChurnRisk(client);
        }

        // Generate value projections
        const projections = await this.generateValueProjections(
          client,
          clvPrediction,
          churnRisk,
          projectionPeriods
        );

        // Determine value segment
        const valueSegment = this.determineValueSegment(clvPrediction.predictedLifetimeValue);

        // Generate recommendations if requested
        let recommendedActions: string[] = [];
        if (includeRecommendations) {
          recommendedActions = await this.generateCLVRecommendations(
            client,
            clvPrediction,
            churnRisk,
            valueSegment
          );
        }

        clvResults.push({
          clientId: client.id,
          currentValue: historicalAnalysis.currentValue,
          predictedLifetimeValue: clvPrediction.predictedLifetimeValue,
          remainingValue: clvPrediction.remainingValue,
          churnRisk,
          valueSegment,
          recommendedActions,
          factors: clvPrediction.factors,
          projections: {
            sixMonths: projections.sixMonths,
            oneYear: projections.oneYear,
            threeYears: projections.threeYears,
            fiveYears: projections.fiveYears
          }
        });
      }

      // Store CLV calculations for historical tracking
      await this.storeCLVResults(clvResults);

      return clvResults;

    } catch (error) {
      console.error('Error calculating client lifetime value:', error);
      throw new Error(`CLV calculation failed: ${error.message}`);
    }
  }

  /**
   * Predict Tax Liability using income patterns and tax law changes
   */
  async predictTaxLiability(
    clientId: string,
    taxYear?: number,
    options: {
      includePlanningOpportunities?: boolean;
      includeQuarterlyEstimates?: boolean;
      includeRiskAnalysis?: boolean;
    } = {}
  ): Promise<TaxLiabilityPrediction> {
    const {
      includePlanningOpportunities = true,
      includeQuarterlyEstimates = true,
      includeRiskAnalysis = true
    } = options;

    const currentYear = new Date().getFullYear();
    const targetTaxYear = taxYear || currentYear;

    try {
      // Fetch client financial data
      const clientData = await this.fetchClientTaxData(clientId, targetTaxYear);

      // Apply tax calculation models
      const taxEstimation = await this.calculateTaxEstimation(clientData, targetTaxYear);

      // Generate quarterly estimates if requested
      let quarterlyEstimates: any[] = [];
      if (includeQuarterlyEstimates) {
        quarterlyEstimates = await this.generateQuarterlyEstimates(
          taxEstimation,
          targetTaxYear
        );
      }

      // Identify tax planning opportunities if requested
      let taxPlanningOpportunities: any[] = [];
      if (includePlanningOpportunities) {
        taxPlanningOpportunities = await this.identifyTaxPlanningOpportunities(
          clientData,
          taxEstimation,
          targetTaxYear
        );
      }

      // Analyze risk factors if requested
      let riskFactors: any[] = [];
      if (includeRiskAnalysis) {
        riskFactors = await this.analyzeTaxRiskFactors(clientData, taxEstimation);
      }

      return {
        clientId,
        taxYear: targetTaxYear,
        estimatedLiability: taxEstimation,
        quarterlyEstimates,
        taxPlanningOpportunities,
        riskFactors
      };

    } catch (error) {
      console.error('Error predicting tax liability:', error);
      throw new Error(`Tax liability prediction failed: ${error.message}`);
    }
  }

  /**
   * Forecast Expenses for Client Businesses
   */
  async forecastExpenses(
    clientId: string,
    categories?: string[],
    options: {
      forecastPeriods?: number;
      includeSeasonality?: boolean;
      includeOptimization?: boolean;
      confidenceLevel?: number;
    } = {}
  ): Promise<ExpenseForecast[]> {
    const {
      forecastPeriods = 12,
      includeSeasonality = true,
      includeOptimization = true,
      confidenceLevel = 0.95
    } = options;

    try {
      // Fetch historical expense data
      const expenseData = await this.fetchHistoricalExpenseData(clientId, categories);

      const forecasts: ExpenseForecast[] = [];

      // Group expenses by category
      const categorizedExpenses = this.groupExpensesByCategory(expenseData);

      for (const [category, expenses] of Object.entries(categorizedExpenses)) {
        // Apply forecasting models
        const forecast = await this.applyExpenseForecastingModel(
          expenses,
          forecastPeriods,
          includeSeasonality,
          confidenceLevel
        );

        // Analyze trends
        const trends = await this.analyzeExpenseTrends(expenses);

        // Generate optimization recommendations if requested
        let optimizationRecommendations: any[] = [];
        if (includeOptimization) {
          optimizationRecommendations = await this.generateExpenseOptimizationRecommendations(
            category,
            expenses,
            forecast
          );
        }

        forecasts.push({
          clientId,
          category,
          forecastPeriods,
          predictions: forecast.predictions,
          trends,
          optimizationRecommendations
        });
      }

      return forecasts;

    } catch (error) {
      console.error('Error forecasting expenses:', error);
      throw new Error(`Expense forecasting failed: ${error.message}`);
    }
  }

  /**
   * Working Capital Analysis and Recommendations
   */
  async analyzeWorkingCapital(
    clientId: string,
    options: {
      includeBenchmarks?: boolean;
      includeRecommendations?: boolean;
      analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
    } = {}
  ): Promise<WorkingCapitalAnalysis> {
    const {
      includeBenchmarks = true,
      includeRecommendations = true,
      analysisDepth = 'detailed'
    } = options;

    try {
      // Fetch balance sheet and cash flow data
      const financialData = await this.fetchWorkingCapitalData(clientId);

      // Calculate working capital metrics
      const metrics = await this.calculateWorkingCapitalMetrics(financialData);

      // Get industry benchmarks if requested
      let benchmarks = { industry: 0, peers: 0, target: 0 };
      if (includeBenchmarks) {
        benchmarks = await this.getWorkingCapitalBenchmarks(clientId, metrics);
      }

      // Generate recommendations if requested
      let recommendations: any[] = [];
      if (includeRecommendations) {
        recommendations = await this.generateWorkingCapitalRecommendations(
          metrics,
          benchmarks,
          analysisDepth
        );
      }

      return {
        clientId,
        currentRatio: metrics.currentRatio,
        quickRatio: metrics.quickRatio,
        cashRatio: metrics.cashRatio,
        workingCapital: metrics.workingCapital,
        daysSalesOutstanding: metrics.daysSalesOutstanding,
        daysInventoryOutstanding: metrics.daysInventoryOutstanding,
        daysPayableOutstanding: metrics.daysPayableOutstanding,
        cashConversionCycle: metrics.cashConversionCycle,
        recommendations,
        benchmarks
      };

    } catch (error) {
      console.error('Error analyzing working capital:', error);
      throw new Error(`Working capital analysis failed: ${error.message}`);
    }
  }

  // Private helper methods

  private async fetchClientDataForCLV(clientId?: string): Promise<any[]> {
    const whereClause: any = {
      organizationId: this.organizationId
    };

    if (clientId) {
      whereClause.id = clientId;
    }

    return await prisma.client.findMany({
      where: whereClause,
      include: {
        invoices: {
          orderBy: { date: 'desc' }
        },
        payments: {
          orderBy: { date: 'desc' }
        },
        engagements: true,
        interactions: true
      }
    });
  }

  private async analyzeClientHistory(client: any): Promise<{
    currentValue: number;
    averageMonthlyRevenue: number;
    tenure: number;
    serviceUtilization: number;
    paymentHistory: number;
  }> {
    // Calculate total revenue from client
    const totalRevenue = client.invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0);

    // Calculate tenure in months
    const firstInvoice = client.invoices[client.invoices.length - 1];
    const tenure = firstInvoice
      ? Math.max(1, (new Date().getTime() - new Date(firstInvoice.date).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 1;

    // Calculate average monthly revenue
    const averageMonthlyRevenue = totalRevenue / tenure;

    // Calculate service utilization score (0-1)
    const serviceUtilization = Math.min(1, client.engagements.length / 10); // Normalize to 10 services

    // Calculate payment history score (0-1)
    const onTimePayments = client.payments.filter((p: any) => p.onTime).length;
    const paymentHistory = client.payments.length > 0 ? onTimePayments / client.payments.length : 1;

    return {
      currentValue: totalRevenue,
      averageMonthlyRevenue,
      tenure,
      serviceUtilization,
      paymentHistory
    };
  }

  private async applyCLVModel(client: any, historicalAnalysis: any): Promise<{
    predictedLifetimeValue: number;
    remainingValue: number;
    factors: any;
  }> {
    // Apply CLV calculation using cohort analysis and predictive modeling
    const { averageMonthlyRevenue, tenure, serviceUtilization, paymentHistory } = historicalAnalysis;

    // Calculate growth rate
    const recentRevenue = client.invoices.slice(0, 6).reduce((sum: number, inv: any) => sum + inv.amount, 0);
    const olderRevenue = client.invoices.slice(6, 12).reduce((sum: number, inv: any) => sum + inv.amount, 0);
    const growthRate = olderRevenue > 0 ? (recentRevenue - olderRevenue) / olderRevenue : 0;

    // Calculate engagement score
    const engagementScore = Math.min(1, client.interactions.length / 50); // Normalize to 50 interactions

    // Factors affecting CLV
    const factors = {
      tenure: Math.min(1, tenure / 36), // Normalize to 3 years
      serviceUtilization,
      paymentHistory,
      engagement: engagementScore,
      growth: Math.max(-0.5, Math.min(0.5, growthRate)) + 0.5 // Normalize to 0-1
    };

    // Weighted CLV calculation
    const factorWeights = {
      tenure: 0.2,
      serviceUtilization: 0.25,
      paymentHistory: 0.2,
      engagement: 0.15,
      growth: 0.2
    };

    const clvMultiplier = Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + (value * factorWeights[key as keyof typeof factorWeights]);
    }, 0);

    // Base lifetime estimate (in months)
    const baseLifetime = 36; // 3 years
    const adjustedLifetime = baseLifetime * (0.5 + clvMultiplier);

    // Calculate CLV
    const monthlyRetentionRate = 0.95; // 95% monthly retention
    const discountRate = 0.01; // 1% monthly discount rate

    let predictedLifetimeValue = 0;
    let monthlyRevenue = averageMonthlyRevenue;

    for (let month = 1; month <= adjustedLifetime; month++) {
      const retentionProbability = Math.pow(monthlyRetentionRate, month);
      const discountedRevenue = monthlyRevenue / Math.pow(1 + discountRate, month);
      predictedLifetimeValue += discountedRevenue * retentionProbability;

      // Apply growth to monthly revenue
      monthlyRevenue *= (1 + growthRate / 12);
    }

    const remainingValue = predictedLifetimeValue - historicalAnalysis.currentValue;

    return {
      predictedLifetimeValue,
      remainingValue: Math.max(0, remainingValue),
      factors
    };
  }

  private async calculateChurnRisk(client: any): Promise<number> {
    // Implement churn risk calculation using multiple factors
    let riskFactors = 0;
    let totalFactors = 0;

    // Payment delays
    const recentPayments = client.payments.slice(0, 6);
    const latePayments = recentPayments.filter((p: any) => !p.onTime).length;
    if (recentPayments.length > 0) {
      riskFactors += (latePayments / recentPayments.length) * 0.3;
      totalFactors += 0.3;
    }

    // Engagement decline
    const recentInteractions = client.interactions.filter((i: any) => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return new Date(i.date) >= sixMonthsAgo;
    }).length;

    const previousInteractions = client.interactions.filter((i: any) => {
      const twelveMonthsAgo = new Date();
      const sixMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const interactionDate = new Date(i.date);
      return interactionDate >= twelveMonthsAgo && interactionDate < sixMonthsAgo;
    }).length;

    if (previousInteractions > 0) {
      const engagementDecline = Math.max(0, (previousInteractions - recentInteractions) / previousInteractions);
      riskFactors += engagementDecline * 0.25;
      totalFactors += 0.25;
    }

    // Revenue decline
    const recentRevenue = client.invoices.slice(0, 6).reduce((sum: number, inv: any) => sum + inv.amount, 0);
    const previousRevenue = client.invoices.slice(6, 12).reduce((sum: number, inv: any) => sum + inv.amount, 0);

    if (previousRevenue > 0) {
      const revenueDecline = Math.max(0, (previousRevenue - recentRevenue) / previousRevenue);
      riskFactors += revenueDecline * 0.25;
      totalFactors += 0.25;
    }

    // Service utilization
    const activeServices = client.engagements.filter((e: any) => e.status === 'active').length;
    const maxServices = 10; // Assume max 10 services
    const utilizationRisk = Math.max(0, 1 - (activeServices / maxServices));
    riskFactors += utilizationRisk * 0.2;
    totalFactors += 0.2;

    return totalFactors > 0 ? Math.min(1, riskFactors / totalFactors) : 0;
  }

  private determineValueSegment(clv: number): 'high' | 'medium' | 'low' {
    if (clv >= 100000) return 'high';
    if (clv >= 50000) return 'medium';
    return 'low';
  }

  private async generateValueProjections(
    client: any,
    clvPrediction: any,
    churnRisk: number,
    periods: number
  ): Promise<{
    sixMonths: number;
    oneYear: number;
    threeYears: number;
    fiveYears: number;
  }> {
    const monthlyRevenue = clvPrediction.predictedLifetimeValue / periods;
    const retentionRate = 1 - (churnRisk / 12); // Convert annual churn to monthly retention

    const projections = {
      sixMonths: 0,
      oneYear: 0,
      threeYears: 0,
      fiveYears: 0
    };

    // Calculate projected values for different periods
    for (let month = 1; month <= 60; month++) {
      const value = monthlyRevenue * Math.pow(retentionRate, month);

      if (month <= 6) projections.sixMonths += value;
      if (month <= 12) projections.oneYear += value;
      if (month <= 36) projections.threeYears += value;
      if (month <= 60) projections.fiveYears += value;
    }

    return projections;
  }

  private async generateCLVRecommendations(
    client: any,
    clvPrediction: any,
    churnRisk: number,
    valueSegment: string
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // High churn risk recommendations
    if (churnRisk > 0.3) {
      recommendations.push('Schedule immediate client check-in call');
      recommendations.push('Review service delivery and satisfaction');
      recommendations.push('Consider offering retention incentives');
    }

    // Value segment specific recommendations
    switch (valueSegment) {
      case 'high':
        recommendations.push('Assign dedicated account manager');
        recommendations.push('Offer premium service packages');
        recommendations.push('Schedule quarterly business reviews');
        break;
      case 'medium':
        recommendations.push('Explore additional service opportunities');
        recommendations.push('Implement regular check-ins');
        break;
      case 'low':
        recommendations.push('Focus on automation to improve margins');
        recommendations.push('Consider service bundling');
        break;
    }

    // Factor-specific recommendations
    if (clvPrediction.factors.serviceUtilization < 0.5) {
      recommendations.push('Present additional service offerings');
    }

    if (clvPrediction.factors.engagement < 0.5) {
      recommendations.push('Increase touchpoints and communication');
    }

    return recommendations;
  }

  private async storeCLVResults(results: ClientLifetimeValue[]): Promise<void> {
    for (const result of results) {
      await prisma.clientLifetimeValue.upsert({
        where: {
          clientId_calculatedAt: {
            clientId: result.clientId,
            calculatedAt: new Date()
          }
        },
        update: {
          currentValue: result.currentValue,
          predictedLifetimeValue: result.predictedLifetimeValue,
          remainingValue: result.remainingValue,
          churnRisk: result.churnRisk,
          valueSegment: result.valueSegment,
          factors: result.factors,
          projections: result.projections
        },
        create: {
          clientId: result.clientId,
          organizationId: this.organizationId,
          currentValue: result.currentValue,
          predictedLifetimeValue: result.predictedLifetimeValue,
          remainingValue: result.remainingValue,
          churnRisk: result.churnRisk,
          valueSegment: result.valueSegment,
          factors: result.factors,
          projections: result.projections,
          calculatedAt: new Date()
        }
      });
    }
  }

  // Placeholder implementations for complex operations
  private async fetchClientTaxData(clientId: string, taxYear: number): Promise<any> {
    return {};
  }

  private async calculateTaxEstimation(clientData: any, taxYear: number): Promise<any> {
    return {
      federal: 25000,
      state: 5000,
      local: 1000,
      total: 31000
    };
  }

  private async generateQuarterlyEstimates(taxEstimation: any, taxYear: number): Promise<any[]> {
    const quarterlyAmount = taxEstimation.total / 4;
    return [
      { quarter: 1, dueDate: new Date(`${taxYear}-04-15`), estimatedPayment: quarterlyAmount, confidence: 0.85 },
      { quarter: 2, dueDate: new Date(`${taxYear}-06-15`), estimatedPayment: quarterlyAmount, confidence: 0.85 },
      { quarter: 3, dueDate: new Date(`${taxYear}-09-15`), estimatedPayment: quarterlyAmount, confidence: 0.85 },
      { quarter: 4, dueDate: new Date(`${taxYear + 1}-01-15`), estimatedPayment: quarterlyAmount, confidence: 0.85 }
    ];
  }

  private async identifyTaxPlanningOpportunities(clientData: any, taxEstimation: any, taxYear: number): Promise<any[]> {
    return [
      {
        strategy: 'Maximize retirement contributions',
        potentialSavings: 5000,
        implementationComplexity: 'low' as const,
        deadline: new Date(`${taxYear}-12-31`)
      },
      {
        strategy: 'Accelerate business expenses',
        potentialSavings: 3000,
        implementationComplexity: 'medium' as const,
        deadline: new Date(`${taxYear}-12-31`)
      }
    ];
  }

  private async analyzeTaxRiskFactors(clientData: any, taxEstimation: any): Promise<any[]> {
    return [
      {
        factor: 'High deduction ratios',
        impact: 'medium' as const,
        mitigation: 'Ensure proper documentation for all deductions'
      },
      {
        factor: 'Cash transactions',
        impact: 'high' as const,
        mitigation: 'Implement better record-keeping for cash receipts'
      }
    ];
  }

  // Additional placeholder implementations for remaining methods
  private async fetchHistoricalExpenseData(clientId: string, categories?: string[]): Promise<any[]> {
    return [];
  }

  private groupExpensesByCategory(expenses: any[]): Record<string, any[]> {
    return {};
  }

  private async applyExpenseForecastingModel(expenses: any[], periods: number, seasonality: boolean, confidence: number): Promise<any> {
    return { predictions: [] };
  }

  private async analyzeExpenseTrends(expenses: any[]): Promise<any> {
    return {
      shortTerm: 'stable' as const,
      longTerm: 'increasing' as const,
      volatility: 0.1
    };
  }

  private async generateExpenseOptimizationRecommendations(category: string, expenses: any[], forecast: any): Promise<any[]> {
    return [];
  }

  private async fetchWorkingCapitalData(clientId: string): Promise<any> {
    return {};
  }

  private async calculateWorkingCapitalMetrics(financialData: any): Promise<any> {
    return {
      currentRatio: 2.0,
      quickRatio: 1.5,
      cashRatio: 0.5,
      workingCapital: 100000,
      daysSalesOutstanding: 45,
      daysInventoryOutstanding: 30,
      daysPayableOutstanding: 25,
      cashConversionCycle: 50
    };
  }

  private async getWorkingCapitalBenchmarks(clientId: string, metrics: any): Promise<any> {
    return {
      industry: 1.8,
      peers: 1.9,
      target: 2.0
    };
  }

  private async generateWorkingCapitalRecommendations(metrics: any, benchmarks: any, depth: string): Promise<any[]> {
    return [
      {
        area: 'receivables' as const,
        action: 'Implement faster collection procedures',
        impact: 5,
        timeframe: '30 days'
      }
    ];
  }
}

export function createPredictiveAnalyticsService(organizationId: string): PredictiveAnalyticsService {
  return new PredictiveAnalyticsService(organizationId);
}