/**
 * Financial Planning & Analysis (FP&A) Engine for AdvisorOS
 *
 * Comprehensive financial planning and analysis toolkit providing:
 * - Budget creation and management with scenario modeling
 * - Cash flow forecasting and working capital optimization
 * - Variance analysis with automated insights and recommendations
 * - Rolling forecasts with real-time data integration
 * - Financial model templates for different industries
 * - Strategic financial planning and goal tracking
 * - Performance metrics and KPI monitoring
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { auditLogger } from '../compliance/audit-logging';

interface FinancialPlan {
  id: string;
  clientId: string;
  name: string;
  type: 'annual_budget' | 'strategic_plan' | 'cash_flow_forecast' | 'scenario_analysis';
  period: PlanningPeriod;
  status: 'draft' | 'active' | 'completed' | 'archived';
  assumptions: PlanningAssumptions;
  financialStatements: FinancialStatements;
  scenarios: Scenario[];
  kpis: KPI[];
  variance: VarianceAnalysis;
  recommendations: Recommendation[];
  approvals: Approval[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlanningPeriod {
  startDate: Date;
  endDate: Date;
  granularity: 'monthly' | 'quarterly' | 'annual';
  fiscalYearEnd: Date;
}

interface PlanningAssumptions {
  revenueGrowth: number;
  inflationRate: number;
  marketGrowth: number;
  competitiveFactors: string[];
  operationalChanges: string[];
  macroeconomicFactors: MacroeconomicFactors;
  industryMetrics: IndustryMetrics;
}

interface MacroeconomicFactors {
  gdpGrowth: number;
  unemploymentRate: number;
  interestRates: number;
  exchangeRates: Record<string, number>;
  commodityPrices: Record<string, number>;
}

interface IndustryMetrics {
  industryGrowthRate: number;
  marketShare: number;
  averageMargins: number;
  typicalMultiples: Record<string, number>;
  seasonalityFactors: number[];
}

interface FinancialStatements {
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
  keyMetrics: FinancialMetrics;
}

interface IncomeStatement {
  revenue: LineItem[];
  costOfGoodsSold: LineItem[];
  grossProfit: LineItem[];
  operatingExpenses: LineItem[];
  ebitda: LineItem[];
  ebit: LineItem[];
  netIncome: LineItem[];
  margins: MarginAnalysis;
}

interface BalanceSheet {
  assets: AssetCategories;
  liabilities: LiabilityCategories;
  equity: EquityCategories;
  workingCapital: WorkingCapital;
  ratios: BalanceSheetRatios;
}

interface CashFlowStatement {
  operatingCashFlow: LineItem[];
  investingCashFlow: LineItem[];
  financingCashFlow: LineItem[];
  netCashFlow: LineItem[];
  cashPosition: LineItem[];
  burnRate: number[];
  runwayMonths: number[];
}

interface LineItem {
  account: string;
  category: string;
  periods: PeriodValue[];
  assumptions: string;
  formula: string;
  isCalculated: boolean;
}

interface PeriodValue {
  period: Date;
  actual: number;
  budget: number;
  forecast: number;
  variance: number;
  variancePercentage: number;
}

interface Scenario {
  id: string;
  name: string;
  type: 'base_case' | 'optimistic' | 'pessimistic' | 'stress_test' | 'custom';
  probability: number;
  assumptions: ScenarioAssumptions;
  financialImpact: FinancialImpact;
  keyRisks: string[];
  mitigationStrategies: string[];
}

interface ScenarioAssumptions {
  revenueMultiplier: number;
  costInflation: number;
  marketChanges: string[];
  operationalAdjustments: string[];
  investmentRequirements: number;
}

interface FinancialImpact {
  revenueImpact: number;
  marginImpact: number;
  cashImpact: number;
  capitalRequirements: number;
  breakEvenAnalysis: BreakEvenAnalysis;
}

interface KPI {
  name: string;
  category: 'financial' | 'operational' | 'customer' | 'market';
  description: string;
  formula: string;
  target: number;
  actual: number;
  variance: number;
  trend: 'improving' | 'stable' | 'declining';
  benchmark: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  alerts: KPIAlert[];
}

interface KPIAlert {
  type: 'threshold' | 'trend' | 'variance';
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
}

interface VarianceAnalysis {
  summary: VarianceSummary;
  keyVariances: KeyVariance[];
  rootCauseAnalysis: RootCauseAnalysis[];
  corrective Actions: CorrectiveAction[];
  forecastAdjustments: ForecastAdjustment[];
}

interface VarianceSummary {
  totalVariance: number;
  favorableVariances: number;
  unfavorableVariances: number;
  significantVariances: number;
  varianceTrend: 'improving' | 'stable' | 'worsening';
}

interface KeyVariance {
  account: string;
  amount: number;
  percentage: number;
  category: 'revenue' | 'cost' | 'timing' | 'volume' | 'price';
  significance: 'high' | 'medium' | 'low';
  explanation: string;
  impact: string;
}

interface RootCauseAnalysis {
  variance: string;
  causes: string[];
  dataPoints: string[];
  confidence: number;
  methodology: string;
}

interface CorrectiveAction {
  variance: string;
  action: string;
  owner: string;
  timeline: string;
  expectedImpact: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

interface ForecastAdjustment {
  period: Date;
  account: string;
  originalForecast: number;
  adjustedForecast: number;
  reason: string;
  confidence: number;
}

interface Recommendation {
  id: string;
  type: 'strategic' | 'operational' | 'financial' | 'tactical';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  expectedBenefit: number;
  implementationCost: number;
  timeline: string;
  risks: string[];
  dependencies: string[];
  kpiImpact: KPIImpact[];
  status: 'new' | 'under_review' | 'approved' | 'implemented' | 'rejected';
}

interface KPIImpact {
  kpiName: string;
  currentValue: number;
  projectedValue: number;
  improvement: number;
  timeframe: string;
}

interface CashFlowForecast {
  clientId: string;
  forecastPeriod: PlanningPeriod;
  cashFlowProjections: CashFlowProjection[];
  liquidityAnalysis: LiquidityAnalysis;
  workingCapitalOptimization: WorkingCapitalOptimization;
  financingRequirements: FinancingRequirement[];
  stressTestResults: StressTestResult[];
  recommendations: CashFlowRecommendation[];
}

interface CashFlowProjection {
  period: Date;
  openingBalance: number;
  receipts: CashReceipts;
  disbursements: CashDisbursements;
  netCashFlow: number;
  closingBalance: number;
  cumulative: number;
  minimumRequired: number;
  surplus: number;
}

interface CashReceipts {
  customerPayments: number;
  interestIncome: number;
  assetSales: number;
  loanProceeds: number;
  other: number;
  total: number;
}

interface CashDisbursements {
  operatingExpenses: number;
  payroll: number;
  supplierPayments: number;
  debtService: number;
  capitalExpenditure: number;
  taxes: number;
  other: number;
  total: number;
}

interface LiquidityAnalysis {
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;
  cashConversionCycle: number;
  burnRate: number;
  runwayMonths: number;
  liquidityRisk: 'low' | 'medium' | 'high' | 'critical';
}

interface WorkingCapitalOptimization {
  currentWorkingCapital: number;
  optimizedWorkingCapital: number;
  improvementOpportunity: number;
  recommendations: WorkingCapitalRecommendation[];
  implementationPlan: ImplementationStep[];
}

interface WorkingCapitalRecommendation {
  component: 'receivables' | 'inventory' | 'payables';
  currentDays: number;
  targetDays: number;
  cashImpact: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  actions: string[];
}

class FinancialPlanningEngine {
  private prisma: PrismaClient;
  private industryBenchmarks: Map<string, IndustryMetrics>;

  constructor() {
    this.prisma = new PrismaClient();
    this.industryBenchmarks = new Map();
  }

  // ==============================================================================
  // BUDGET CREATION AND MANAGEMENT
  // ==============================================================================

  async createFinancialPlan(
    clientId: string,
    planType: string,
    period: PlanningPeriod,
    assumptions: PlanningAssumptions
  ): Promise<FinancialPlan> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { financialData: true }
    });

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    // Generate base financial statements from historical data
    const historicalData = await this.getHistoricalFinancialData(clientId);
    const baselineStatements = this.generateBaselineStatements(historicalData, period);

    // Apply assumptions to create projected statements
    const projectedStatements = this.applyPlanningAssumptions(baselineStatements, assumptions);

    // Generate scenarios
    const scenarios = this.generateScenarios(projectedStatements, assumptions);

    // Create KPIs and targets
    const kpis = this.generateKPIs(client, projectedStatements);

    const financialPlan: FinancialPlan = {
      id: this.generatePlanId(),
      clientId,
      name: `${planType} - ${period.startDate.getFullYear()}`,
      type: planType as any,
      period,
      status: 'draft',
      assumptions,
      financialStatements: projectedStatements,
      scenarios,
      kpis,
      variance: this.initializeVarianceAnalysis(),
      recommendations: [],
      approvals: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.savePlan(financialPlan);
    await this.logPlanCreation(financialPlan);

    return financialPlan;
  }

  async updateFinancialPlan(
    planId: string,
    updates: Partial<FinancialPlan>
  ): Promise<FinancialPlan> {
    const existingPlan = await this.getPlan(planId);
    if (!existingPlan) {
      throw new Error(`Financial plan ${planId} not found`);
    }

    const updatedPlan = { ...existingPlan, ...updates, updatedAt: new Date() };

    // Recalculate dependent values if assumptions changed
    if (updates.assumptions) {
      updatedPlan.financialStatements = this.applyPlanningAssumptions(
        updatedPlan.financialStatements,
        updates.assumptions
      );
      updatedPlan.scenarios = this.generateScenarios(
        updatedPlan.financialStatements,
        updates.assumptions
      );
    }

    await this.savePlan(updatedPlan);
    await this.logPlanUpdate(updatedPlan);

    return updatedPlan;
  }

  // ==============================================================================
  // CASH FLOW FORECASTING
  // ==============================================================================

  async generateCashFlowForecast(
    clientId: string,
    forecastPeriod: PlanningPeriod
  ): Promise<CashFlowForecast> {
    const [historicalCashFlow, receivables, payables, inventory] = await Promise.all([
      this.getHistoricalCashFlowData(clientId),
      this.getReceivablesData(clientId),
      this.getPayablesData(clientId),
      this.getInventoryData(clientId)
    ]);

    // Generate monthly cash flow projections
    const cashFlowProjections = this.projectCashFlow(
      historicalCashFlow,
      receivables,
      payables,
      inventory,
      forecastPeriod
    );

    // Analyze liquidity position
    const liquidityAnalysis = this.analyzeLiquidity(cashFlowProjections);

    // Identify working capital optimization opportunities
    const workingCapitalOptimization = this.optimizeWorkingCapital(
      receivables,
      payables,
      inventory
    );

    // Determine financing requirements
    const financingRequirements = this.assessFinancingNeeds(cashFlowProjections);

    // Perform stress testing
    const stressTestResults = this.performCashFlowStressTests(cashFlowProjections);

    // Generate recommendations
    const recommendations = this.generateCashFlowRecommendations(
      liquidityAnalysis,
      workingCapitalOptimization,
      financingRequirements
    );

    const forecast: CashFlowForecast = {
      clientId,
      forecastPeriod,
      cashFlowProjections,
      liquidityAnalysis,
      workingCapitalOptimization,
      financingRequirements,
      stressTestResults,
      recommendations
    };

    await this.saveCashFlowForecast(forecast);
    return forecast;
  }

  // ==============================================================================
  // VARIANCE ANALYSIS
  // ==============================================================================

  async performVarianceAnalysis(planId: string): Promise<VarianceAnalysis> {
    const plan = await this.getPlan(planId);
    if (!plan) {
      throw new Error(`Financial plan ${planId} not found`);
    }

    const actualData = await this.getActualFinancialData(plan.clientId, plan.period);
    const variance = this.calculateVariances(plan.financialStatements, actualData);

    // Identify significant variances
    const keyVariances = this.identifyKeyVariances(variance);

    // Perform root cause analysis
    const rootCauseAnalysis = await this.performRootCauseAnalysis(keyVariances, plan.clientId);

    // Generate corrective actions
    const correctiveActions = this.generateCorrectiveActions(rootCauseAnalysis);

    // Suggest forecast adjustments
    const forecastAdjustments = this.suggestForecastAdjustments(variance, plan);

    const analysis: VarianceAnalysis = {
      summary: this.createVarianceSummary(variance),
      keyVariances,
      rootCauseAnalysis,
      correctiveActions,
      forecastAdjustments
    };

    // Update the plan with variance analysis
    await this.updateFinancialPlan(planId, { variance: analysis });

    return analysis;
  }

  // ==============================================================================
  // ROLLING FORECASTS
  // ==============================================================================

  async generateRollingForecast(clientId: string): Promise<FinancialPlan> {
    // Get the most recent actual data
    const latestActuals = await this.getLatestActualData(clientId);
    const currentDate = new Date();

    // Create rolling 12-month forecast period
    const rollingPeriod: PlanningPeriod = {
      startDate: currentDate,
      endDate: new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 0),
      granularity: 'monthly',
      fiscalYearEnd: new Date(currentDate.getFullYear(), 11, 31)
    };

    // Update assumptions based on recent performance
    const updatedAssumptions = await this.updateAssumptionsFromActuals(clientId, latestActuals);

    // Create the rolling forecast
    const rollingForecast = await this.createFinancialPlan(
      clientId,
      'rolling_forecast',
      rollingPeriod,
      updatedAssumptions
    );

    rollingForecast.name = `Rolling Forecast - ${currentDate.toISOString().slice(0, 7)}`;

    return rollingForecast;
  }

  // ==============================================================================
  // SCENARIO MODELING
  // ==============================================================================

  private generateScenarios(
    baselineStatements: FinancialStatements,
    assumptions: PlanningAssumptions
  ): Scenario[] {
    const scenarios: Scenario[] = [];

    // Base case scenario
    scenarios.push({
      id: this.generateScenarioId(),
      name: 'Base Case',
      type: 'base_case',
      probability: 0.6,
      assumptions: {
        revenueMultiplier: 1.0,
        costInflation: assumptions.inflationRate,
        marketChanges: [],
        operationalAdjustments: [],
        investmentRequirements: 0
      },
      financialImpact: this.calculateFinancialImpact(baselineStatements, 1.0),
      keyRisks: ['Market volatility', 'Competitive pressure'],
      mitigationStrategies: ['Diversify revenue streams', 'Monitor market trends']
    });

    // Optimistic scenario
    scenarios.push({
      id: this.generateScenarioId(),
      name: 'Optimistic',
      type: 'optimistic',
      probability: 0.2,
      assumptions: {
        revenueMultiplier: 1.2,
        costInflation: assumptions.inflationRate * 0.8,
        marketChanges: ['Market expansion', 'New product success'],
        operationalAdjustments: ['Efficiency improvements'],
        investmentRequirements: baselineStatements.incomeStatement.revenue[0].periods[0].budget * 0.05
      },
      financialImpact: this.calculateFinancialImpact(baselineStatements, 1.2),
      keyRisks: ['Over-investment', 'Resource constraints'],
      mitigationStrategies: ['Phased growth approach', 'Resource planning']
    });

    // Pessimistic scenario
    scenarios.push({
      id: this.generateScenarioId(),
      name: 'Pessimistic',
      type: 'pessimistic',
      probability: 0.2,
      assumptions: {
        revenueMultiplier: 0.85,
        costInflation: assumptions.inflationRate * 1.2,
        marketChanges: ['Market contraction', 'Increased competition'],
        operationalAdjustments: ['Cost reduction measures'],
        investmentRequirements: 0
      },
      financialImpact: this.calculateFinancialImpact(baselineStatements, 0.85),
      keyRisks: ['Revenue decline', 'Margin compression'],
      mitigationStrategies: ['Cost management', 'Market diversification']
    });

    return scenarios;
  }

  // ==============================================================================
  // KPI MONITORING AND ALERTS
  // ==============================================================================

  private generateKPIs(client: any, statements: FinancialStatements): KPI[] {
    const kpis: KPI[] = [];

    // Revenue KPIs
    kpis.push({
      name: 'Revenue Growth Rate',
      category: 'financial',
      description: 'Year-over-year revenue growth percentage',
      formula: '(Current Revenue - Prior Revenue) / Prior Revenue * 100',
      target: 15,
      actual: 0,
      variance: 0,
      trend: 'stable',
      benchmark: this.getIndustryBenchmark(client.industry, 'revenue_growth'),
      frequency: 'monthly',
      alerts: [{
        type: 'threshold',
        condition: 'actual < target * 0.8',
        severity: 'medium',
        message: 'Revenue growth below 80% of target',
        action: 'Review sales pipeline and market conditions'
      }]
    });

    // Profitability KPIs
    kpis.push({
      name: 'Gross Margin',
      category: 'financial',
      description: 'Gross profit as percentage of revenue',
      formula: 'Gross Profit / Revenue * 100',
      target: 40,
      actual: 0,
      variance: 0,
      trend: 'stable',
      benchmark: this.getIndustryBenchmark(client.industry, 'gross_margin'),
      frequency: 'monthly',
      alerts: [{
        type: 'threshold',
        condition: 'actual < target - 5',
        severity: 'high',
        message: 'Gross margin declining below acceptable range',
        action: 'Analyze cost structure and pricing strategy'
      }]
    });

    // Cash Flow KPIs
    kpis.push({
      name: 'Operating Cash Flow Margin',
      category: 'financial',
      description: 'Operating cash flow as percentage of revenue',
      formula: 'Operating Cash Flow / Revenue * 100',
      target: 15,
      actual: 0,
      variance: 0,
      trend: 'stable',
      benchmark: this.getIndustryBenchmark(client.industry, 'ocf_margin'),
      frequency: 'monthly',
      alerts: [{
        type: 'threshold',
        condition: 'actual < 5',
        severity: 'critical',
        message: 'Operating cash flow margin critically low',
        action: 'Immediate cash flow analysis and working capital review'
      }]
    });

    return kpis;
  }

  // ==============================================================================
  // FINANCIAL MODEL TEMPLATES
  // ==============================================================================

  async getIndustryTemplate(industry: string): Promise<FinancialPlan> {
    const templates = await this.loadIndustryTemplates();
    const template = templates.get(industry);

    if (!template) {
      // Return generic template if industry-specific not available
      return this.getGenericTemplate();
    }

    return template;
  }

  private async loadIndustryTemplates(): Promise<Map<string, FinancialPlan>> {
    // Load pre-built templates for different industries
    const templates = new Map<string, FinancialPlan>();

    // Software/SaaS template
    templates.set('software', this.createSoftwareTemplate());

    // Manufacturing template
    templates.set('manufacturing', this.createManufacturingTemplate());

    // Professional services template
    templates.set('professional_services', this.createProfessionalServicesTemplate());

    // Retail template
    templates.set('retail', this.createRetailTemplate());

    return templates;
  }

  // ==============================================================================
  // UTILITY METHODS
  // ==============================================================================

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScenarioId(): string {
    return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getIndustryBenchmark(industry: string, metric: string): number {
    const benchmarks = this.industryBenchmarks.get(industry);
    return benchmarks?.[metric] || 0;
  }

  private async logPlanCreation(plan: FinancialPlan): Promise<void> {
    await auditLogger.logDataAccess({
      userId: 'system',
      userEmail: 'fpa-engine@advisoros.com',
      userRole: 'SYSTEM',
      clientId: plan.clientId,
      action: 'create',
      resource: 'FINANCIAL_PLAN',
      outcome: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'FinancialPlanningEngine',
      dataClassification: 'CONFIDENTIAL',
      details: {
        planId: plan.id,
        planType: plan.type,
        period: plan.period
      }
    });
  }

  // Placeholder implementations for comprehensive functionality
  private async getHistoricalFinancialData(clientId: string): Promise<any> { return {}; }
  private generateBaselineStatements(historical: any, period: PlanningPeriod): FinancialStatements { return {} as FinancialStatements; }
  private applyPlanningAssumptions(statements: FinancialStatements, assumptions: PlanningAssumptions): FinancialStatements { return statements; }
  private initializeVarianceAnalysis(): VarianceAnalysis { return {} as VarianceAnalysis; }
  private async savePlan(plan: FinancialPlan): Promise<void> { }
  private async getPlan(planId: string): Promise<FinancialPlan | null> { return null; }
  private async logPlanUpdate(plan: FinancialPlan): Promise<void> { }
  private async getHistoricalCashFlowData(clientId: string): Promise<any> { return {}; }
  private async getReceivablesData(clientId: string): Promise<any> { return {}; }
  private async getPayablesData(clientId: string): Promise<any> { return {}; }
  private async getInventoryData(clientId: string): Promise<any> { return {}; }
  private projectCashFlow(historical: any, receivables: any, payables: any, inventory: any, period: PlanningPeriod): CashFlowProjection[] { return []; }
  private analyzeLiquidity(projections: CashFlowProjection[]): LiquidityAnalysis { return {} as LiquidityAnalysis; }
  private optimizeWorkingCapital(receivables: any, payables: any, inventory: any): WorkingCapitalOptimization { return {} as WorkingCapitalOptimization; }
  private assessFinancingNeeds(projections: CashFlowProjection[]): FinancingRequirement[] { return []; }
  private performCashFlowStressTests(projections: CashFlowProjection[]): StressTestResult[] { return []; }
  private generateCashFlowRecommendations(liquidity: LiquidityAnalysis, wc: WorkingCapitalOptimization, financing: FinancingRequirement[]): CashFlowRecommendation[] { return []; }
  private async saveCashFlowForecast(forecast: CashFlowForecast): Promise<void> { }
  private async getActualFinancialData(clientId: string, period: PlanningPeriod): Promise<any> { return {}; }
  private calculateVariances(planned: FinancialStatements, actual: any): any { return {}; }
  private identifyKeyVariances(variance: any): KeyVariance[] { return []; }
  private async performRootCauseAnalysis(variances: KeyVariance[], clientId: string): Promise<RootCauseAnalysis[]> { return []; }
  private generateCorrectiveActions(analysis: RootCauseAnalysis[]): CorrectiveAction[] { return []; }
  private suggestForecastAdjustments(variance: any, plan: FinancialPlan): ForecastAdjustment[] { return []; }
  private createVarianceSummary(variance: any): VarianceSummary { return {} as VarianceSummary; }
  private async getLatestActualData(clientId: string): Promise<any> { return {}; }
  private async updateAssumptionsFromActuals(clientId: string, actuals: any): Promise<PlanningAssumptions> { return {} as PlanningAssumptions; }
  private calculateFinancialImpact(statements: FinancialStatements, multiplier: number): FinancialImpact { return {} as FinancialImpact; }
  private getGenericTemplate(): FinancialPlan { return {} as FinancialPlan; }
  private createSoftwareTemplate(): FinancialPlan { return {} as FinancialPlan; }
  private createManufacturingTemplate(): FinancialPlan { return {} as FinancialPlan; }
  private createProfessionalServicesTemplate(): FinancialPlan { return {} as FinancialPlan; }
  private createRetailTemplate(): FinancialPlan { return {} as FinancialPlan; }
}

// Additional type definitions for comprehensive coverage
interface MarginAnalysis { gross: number; operating: number; net: number; ebitda: number; }
interface AssetCategories { current: LineItem[]; fixed: LineItem[]; intangible: LineItem[]; total: LineItem[]; }
interface LiabilityCategories { current: LineItem[]; longTerm: LineItem[]; total: LineItem[]; }
interface EquityCategories { paidIn: LineItem[]; retained: LineItem[]; total: LineItem[]; }
interface WorkingCapital { current: number; required: number; excess: number; turnover: number; }
interface BalanceSheetRatios { current: number; quick: number; debt: number; equity: number; }
interface BreakEvenAnalysis { revenue: number; units: number; margin: number; fixedCosts: number; }
interface FinancialMetrics { roe: number; roa: number; roic: number; debt: number; liquidity: number; }
interface Approval { approver: string; status: string; date: Date; comments: string; }
interface FinancingRequirement { amount: number; type: string; timing: Date; purpose: string; }
interface StressTestResult { scenario: string; impact: number; severity: string; }
interface CashFlowRecommendation { type: string; priority: string; description: string; impact: number; }
interface ImplementationStep { step: string; timeline: string; owner: string; dependencies: string[]; }

export {
  FinancialPlanningEngine,
  type FinancialPlan,
  type CashFlowForecast,
  type VarianceAnalysis,
  type KPI,
  type Scenario,
  type Recommendation
};