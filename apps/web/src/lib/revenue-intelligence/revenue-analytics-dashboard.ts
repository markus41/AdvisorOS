/**
 * Comprehensive Revenue Analytics Dashboard for AdvisorOS
 *
 * Advanced analytics system providing real-time insights, forecasting,
 * and actionable intelligence for revenue optimization and growth.
 */

import { PrismaClient } from '@prisma/client';
import { CPAFirmSize } from './pricing-optimization-engine';
import { ChurnRiskLevel } from './churn-prevention-engine';
import { OpportunityType } from './expansion-opportunity-engine';

export enum DashboardTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export enum MetricCategory {
  REVENUE = 'revenue',
  GROWTH = 'growth',
  RETENTION = 'retention',
  EXPANSION = 'expansion',
  EFFICIENCY = 'efficiency',
  COMPETITIVE = 'competitive'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success'
}

export interface RevenueDashboard {
  organizationId: string;
  timeframe: DashboardTimeframe;
  period: {
    start: Date;
    end: Date;
    comparison?: {
      start: Date;
      end: Date;
    };
  };

  // Core Metrics
  coreMetrics: CoreRevenueMetrics;

  // Growth Analysis
  growthAnalysis: GrowthAnalysis;

  // Customer Analytics
  customerAnalytics: CustomerAnalytics;

  // Financial Health
  financialHealth: FinancialHealth;

  // Predictive Insights
  predictiveInsights: PredictiveInsights;

  // Performance Benchmarks
  benchmarks: PerformanceBenchmarks;

  // Alerts and Recommendations
  alerts: RevenueAlert[];
  recommendations: RevenueRecommendation[];

  // Data Quality
  dataQuality: DataQualityMetrics;

  // Last Updated
  lastUpdated: Date;
  refreshRate: number; // minutes
}

export interface CoreRevenueMetrics {
  // Revenue Metrics
  totalRevenue: MetricValue;
  monthlyRecurringRevenue: MetricValue;
  annualRecurringRevenue: MetricValue;
  averageRevenuePerCustomer: MetricValue;

  // Growth Metrics
  revenueGrowthRate: MetricValue;
  customerGrowthRate: MetricValue;
  expansionRevenue: MetricValue;

  // Retention Metrics
  churnRate: MetricValue;
  revenueChurnRate: MetricValue;
  retentionRate: MetricValue;

  // Efficiency Metrics
  customerAcquisitionCost: MetricValue;
  customerLifetimeValue: MetricValue;
  ltvcacRatio: MetricValue;
  paybackPeriod: MetricValue;

  // Cash Flow Metrics
  cashFlow: MetricValue;
  burnRate: MetricValue;
  runway: MetricValue;
}

export interface MetricValue {
  current: number;
  previous?: number;
  change?: number;
  changePercentage?: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  targetProgress?: number;
  confidence: number; // 0-1
  lastUpdated: Date;
}

export interface GrowthAnalysis {
  // Revenue Growth
  revenueGrowth: {
    monthly: GrowthMetric[];
    quarterly: GrowthMetric[];
    yearOverYear: GrowthMetric[];
  };

  // Customer Growth
  customerGrowth: {
    newCustomers: GrowthMetric[];
    customerExpansion: GrowthMetric[];
    customerChurn: GrowthMetric[];
    netGrowth: GrowthMetric[];
  };

  // Segment Analysis
  segmentGrowth: SegmentGrowthAnalysis[];

  // Cohort Analysis
  cohortAnalysis: CohortAnalysis[];

  // Growth Drivers
  growthDrivers: GrowthDriver[];

  // Growth Forecast
  forecast: GrowthForecast;
}

export interface GrowthMetric {
  period: Date;
  value: number;
  change: number;
  changePercentage: number;
  target?: number;
  confidence: number;
}

export interface SegmentGrowthAnalysis {
  segment: string;
  segmentType: 'firm_size' | 'geography' | 'industry' | 'tier';
  metrics: {
    revenue: GrowthMetric[];
    customers: GrowthMetric[];
    arpc: GrowthMetric[];
  };
  performance: 'outperforming' | 'meeting' | 'underperforming';
}

export interface CohortAnalysis {
  cohort: string;
  cohortDate: Date;
  size: number;
  revenueRetention: CohortMetric[];
  customerRetention: CohortMetric[];
  expansion: CohortMetric[];
}

export interface CohortMetric {
  period: number; // months since cohort start
  value: number;
  percentage: number;
}

export interface GrowthDriver {
  driver: string;
  category: 'product' | 'sales' | 'marketing' | 'expansion' | 'external';
  impact: number;
  contribution: number; // percentage of growth
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
}

export interface GrowthForecast {
  scenarios: {
    conservative: ForecastScenario;
    realistic: ForecastScenario;
    optimistic: ForecastScenario;
  };
  assumptions: ForecastAssumption[];
  confidence: number;
  keyRisks: string[];
  keyOpportunities: string[];
}

export interface ForecastScenario {
  name: string;
  probability: number;
  revenue: ForecastMetric[];
  customers: ForecastMetric[];
  arpc: ForecastMetric[];
}

export interface ForecastMetric {
  period: Date;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface ForecastAssumption {
  assumption: string;
  value: number;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface CustomerAnalytics {
  // Customer Segmentation
  segmentation: CustomerSegmentation;

  // Customer Health
  customerHealth: CustomerHealthMetrics;

  // Expansion Opportunities
  expansionOpportunities: ExpansionAnalytics;

  // Churn Analysis
  churnAnalysis: ChurnAnalytics;

  // Customer Journey
  journeyAnalytics: CustomerJourneyAnalytics;
}

export interface CustomerSegmentation {
  segments: CustomerSegment[];
  distribution: SegmentDistribution[];
  performance: SegmentPerformance[];
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  size: number;
  revenue: number;
  arpc: number;
  ltv: number;
  churnRate: number;
  growthRate: number;
}

export interface SegmentCriteria {
  firmSize?: CPAFirmSize[];
  revenueRange?: { min: number; max: number };
  geography?: string[];
  industry?: string[];
  tenure?: { min: number; max: number };
  tier?: string[];
}

export interface SegmentDistribution {
  segment: string;
  customers: number;
  revenue: number;
  percentage: number;
}

export interface SegmentPerformance {
  segment: string;
  metrics: {
    acquisition: number;
    retention: number;
    expansion: number;
    satisfaction: number;
  };
  ranking: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CustomerHealthMetrics {
  healthDistribution: HealthDistribution[];
  healthTrends: HealthTrend[];
  riskFactors: RiskFactor[];
  interventions: InterventionMetrics;
}

export interface HealthDistribution {
  healthScore: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface HealthTrend {
  period: Date;
  healthy: number;
  atRisk: number;
  critical: number;
}

export interface RiskFactor {
  factor: string;
  prevalence: number;
  impact: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface InterventionMetrics {
  attempted: number;
  successful: number;
  successRate: number;
  revenuePreserved: number;
  cost: number;
  roi: number;
}

export interface ExpansionAnalytics {
  opportunities: ExpansionOpportunityMetrics[];
  pipeline: ExpansionPipeline;
  performance: ExpansionPerformance;
}

export interface ExpansionOpportunityMetrics {
  type: OpportunityType;
  count: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  averageCycleTime: number;
}

export interface ExpansionPipeline {
  stages: PipelineStage[];
  velocity: PipelineVelocity[];
  conversion: ConversionMetrics[];
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  averageAge: number;
  conversionRate: number;
}

export interface PipelineVelocity {
  stage: string;
  averageTime: number;
  trend: 'faster' | 'stable' | 'slower';
}

export interface ConversionMetrics {
  fromStage: string;
  toStage: string;
  rate: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ExpansionPerformance {
  totalRevenue: number;
  revenueGrowth: number;
  successRate: number;
  averageDealSize: number;
  cycleTime: number;
  roi: number;
}

export interface ChurnAnalytics {
  churnRates: ChurnRateAnalysis;
  churnDrivers: ChurnDriverAnalysis[];
  retentionEfforts: RetentionEffortsAnalysis;
  revenueImpact: ChurnRevenueImpact;
}

export interface ChurnRateAnalysis {
  overall: MetricValue;
  bySegment: SegmentChurnRate[];
  byCohort: CohortChurnRate[];
  trend: ChurnTrend[];
}

export interface SegmentChurnRate {
  segment: string;
  churnRate: number;
  trend: 'improving' | 'stable' | 'worsening';
  ranking: number;
}

export interface CohortChurnRate {
  cohort: string;
  period: number;
  churnRate: number;
  cumulativeChurn: number;
}

export interface ChurnTrend {
  period: Date;
  churnRate: number;
  customers: number;
  revenue: number;
}

export interface ChurnDriverAnalysis {
  driver: string;
  impact: number;
  frequency: number;
  preventable: boolean;
  mitigation: string;
}

export interface RetentionEffortsAnalysis {
  campaigns: RetentionCampaign[];
  effectiveness: RetentionEffectiveness;
  investment: RetentionInvestment;
}

export interface RetentionCampaign {
  name: string;
  type: string;
  reach: number;
  engagement: number;
  success: number;
  cost: number;
  roi: number;
}

export interface RetentionEffectiveness {
  overallSuccessRate: number;
  bestPerformingTactics: string[];
  worstPerformingTactics: string[];
  improvementAreas: string[];
}

export interface RetentionInvestment {
  totalSpend: number;
  costPerRetention: number;
  revenuePreserved: number;
  roi: number;
}

export interface ChurnRevenueImpact {
  totalLost: number;
  averageLossPerCustomer: number;
  preventableRevenue: number;
  opportunityCost: number;
}

export interface CustomerJourneyAnalytics {
  stages: JourneyStage[];
  funnelAnalysis: FunnelAnalysis;
  touchpoints: TouchpointAnalysis[];
  satisfaction: SatisfactionAnalysis;
}

export interface JourneyStage {
  stage: string;
  customers: number;
  averageTime: number;
  dropoffRate: number;
  conversionRate: number;
  revenueImpact: number;
}

export interface FunnelAnalysis {
  steps: FunnelStep[];
  conversionRates: ConversionMetrics[];
  dropoffPoints: DropoffAnalysis[];
}

export interface FunnelStep {
  step: string;
  count: number;
  conversionToNext: number;
  averageTime: number;
}

export interface DropoffAnalysis {
  stage: string;
  dropoffRate: number;
  reasons: DropoffReason[];
  impact: number;
}

export interface DropoffReason {
  reason: string;
  percentage: number;
  mitigation: string;
}

export interface TouchpointAnalysis {
  touchpoint: string;
  interactions: number;
  satisfaction: number;
  conversionImpact: number;
  revenueImpact: number;
  optimizationOpportunity: number;
}

export interface SatisfactionAnalysis {
  overallScore: number;
  bySegment: SegmentSatisfaction[];
  byTouchpoint: TouchpointSatisfaction[];
  drivers: SatisfactionDriver[];
  trends: SatisfactionTrend[];
}

export interface SegmentSatisfaction {
  segment: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  benchmark: number;
}

export interface TouchpointSatisfaction {
  touchpoint: string;
  score: number;
  importance: number;
  gap: number;
}

export interface SatisfactionDriver {
  driver: string;
  impact: number;
  performance: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SatisfactionTrend {
  period: Date;
  score: number;
  change: number;
}

export interface FinancialHealth {
  revenueQuality: RevenueQuality;
  profitability: ProfitabilityAnalysis;
  cashFlow: CashFlowAnalysis;
  unitEconomics: UnitEconomics;
  efficiency: EfficiencyMetrics;
}

export interface RevenueQuality {
  recurring: number;
  oneTime: number;
  contractedFuture: number;
  predictability: number;
  concentration: ConcentrationRisk;
  diversification: DiversificationMetrics;
}

export interface ConcentrationRisk {
  top5Customers: number;
  top10Customers: number;
  riskLevel: 'low' | 'medium' | 'high';
  mitigation: string[];
}

export interface DiversificationMetrics {
  bySegment: DiversificationBreakdown[];
  byGeography: DiversificationBreakdown[];
  byTier: DiversificationBreakdown[];
  score: number;
}

export interface DiversificationBreakdown {
  category: string;
  percentage: number;
  growth: number;
}

export interface ProfitabilityAnalysis {
  grossMargin: MetricValue;
  operatingMargin: MetricValue;
  netMargin: MetricValue;
  bySegment: SegmentProfitability[];
  byProduct: ProductProfitability[];
  trends: ProfitabilityTrend[];
}

export interface SegmentProfitability {
  segment: string;
  revenue: number;
  costs: number;
  margin: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ProductProfitability {
  product: string;
  revenue: number;
  costs: number;
  margin: number;
  volume: number;
  unitEconomics: number;
}

export interface ProfitabilityTrend {
  period: Date;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
}

export interface CashFlowAnalysis {
  operating: MetricValue;
  free: MetricValue;
  runway: MetricValue;
  burnRate: MetricValue;
  cashConversion: MetricValue;
  forecast: CashFlowForecast[];
}

export interface CashFlowForecast {
  period: Date;
  operating: number;
  free: number;
  cumulative: number;
  confidence: number;
}

export interface UnitEconomics {
  cac: MetricValue;
  ltv: MetricValue;
  ltvCacRatio: MetricValue;
  paybackPeriod: MetricValue;
  bySegment: SegmentUnitEconomics[];
  trends: UnitEconomicsTrend[];
}

export interface SegmentUnitEconomics {
  segment: string;
  cac: number;
  ltv: number;
  ratio: number;
  payback: number;
  health: 'healthy' | 'concerning' | 'poor';
}

export interface UnitEconomicsTrend {
  period: Date;
  cac: number;
  ltv: number;
  ratio: number;
  payback: number;
}

export interface EfficiencyMetrics {
  salesEfficiency: SalesEfficiency;
  marketingEfficiency: MarketingEfficiency;
  operationalEfficiency: OperationalEfficiency;
  capitalEfficiency: CapitalEfficiency;
}

export interface SalesEfficiency {
  salesVelocity: number;
  winRate: number;
  averageDealSize: number;
  salesCycleTime: number;
  quotaAttainment: number;
  productivity: number;
}

export interface MarketingEfficiency {
  costPerLead: number;
  leadConversion: number;
  customerAcquisitionCost: number;
  marketingRoi: number;
  brandEffectiveness: number;
}

export interface OperationalEfficiency {
  supportEfficiency: number;
  productivityIndex: number;
  automationRate: number;
  errorRate: number;
  qualityScore: number;
}

export interface CapitalEfficiency {
  revenuePerEmployee: number;
  assetTurnover: number;
  workingCapitalEfficiency: number;
  returnOnAssets: number;
  returnOnEquity: number;
}

export interface PredictiveInsights {
  revenueForecasting: RevenueForecasting;
  churnPredictions: ChurnPredictionInsights;
  expansionForecasting: ExpansionForecasting;
  marketOpportunities: MarketOpportunityInsights;
  riskAssessment: RiskAssessmentInsights;
}

export interface RevenueForecasting {
  nextQuarter: ForecastPeriod;
  nextYear: ForecastPeriod;
  longTerm: ForecastPeriod;
  scenarios: ForcastScenario[];
  confidence: number;
  keyAssumptions: string[];
}

export interface ForecastPeriod {
  period: string;
  revenue: number;
  growth: number;
  confidence: number;
  range: { min: number; max: number };
}

export interface ForcastScenario {
  name: string;
  probability: number;
  revenue: number;
  keyFactors: string[];
}

export interface ChurnPredictionInsights {
  customersAtRisk: number;
  revenueAtRisk: number;
  timeToAction: number;
  preventionOpportunities: PreventionOpportunity[];
  interventionRecommendations: InterventionRecommendation[];
}

export interface PreventionOpportunity {
  customerId: string;
  riskLevel: ChurnRiskLevel;
  revenueAtRisk: number;
  timeToChurn: number;
  preventionProbability: number;
  recommendedActions: string[];
}

export interface InterventionRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  effort: number;
  roi: number;
  description: string;
}

export interface ExpansionForecasting {
  pipelineValue: number;
  expectedRevenue: number;
  conversionProbability: number;
  timeToClose: number;
  topOpportunities: ExpansionForecastOpportunity[];
}

export interface ExpansionForecastOpportunity {
  type: OpportunityType;
  count: number;
  value: number;
  probability: number;
  timeframe: string;
}

export interface MarketOpportunityInsights {
  totalAddressableMarket: number;
  marketPenetration: number;
  growthOpportunities: GrowthOpportunity[];
  competitivePosition: CompetitivePositionInsight;
}

export interface GrowthOpportunity {
  opportunity: string;
  market: string;
  size: number;
  penetration: number;
  timeToMarket: number;
  investment: number;
  expectedReturn: number;
}

export interface CompetitivePositionInsight {
  marketShare: number;
  position: 'leader' | 'challenger' | 'follower' | 'niche';
  strengths: string[];
  weaknesses: string[];
  threats: string[];
  opportunities: string[];
}

export interface RiskAssessmentInsights {
  overallRiskScore: number;
  riskCategories: RiskCategory[];
  mitigationStrategies: MitigationStrategy[];
  contingencyPlans: ContingencyPlan[];
}

export interface RiskCategory {
  category: string;
  probability: number;
  impact: number;
  riskScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  mitigation: string[];
}

export interface MitigationStrategy {
  risk: string;
  strategy: string;
  cost: number;
  effectiveness: number;
  timeline: string;
  owner: string;
}

export interface ContingencyPlan {
  scenario: string;
  probability: number;
  impact: number;
  response: string[];
  resources: string[];
  timeline: string;
}

export interface PerformanceBenchmarks {
  industryBenchmarks: IndustryBenchmark[];
  competitorBenchmarks: CompetitorBenchmark[];
  internalBenchmarks: InternalBenchmark[];
  performanceGaps: PerformanceGap[];
}

export interface IndustryBenchmark {
  metric: string;
  industry: string;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  yourPerformance: number;
  ranking: string;
}

export interface CompetitorBenchmark {
  competitor: string;
  metrics: CompetitorMetric[];
  overallPosition: 'ahead' | 'competitive' | 'behind';
}

export interface CompetitorMetric {
  metric: string;
  theirValue: number;
  yourValue: number;
  gap: number;
  importance: 'high' | 'medium' | 'low';
}

export interface InternalBenchmark {
  metric: string;
  historical: HistoricalBenchmark[];
  targets: TargetBenchmark[];
  performance: 'exceeding' | 'meeting' | 'below';
}

export interface HistoricalBenchmark {
  period: Date;
  value: number;
}

export interface TargetBenchmark {
  period: Date;
  target: number;
  actual?: number;
  variance?: number;
}

export interface PerformanceGap {
  metric: string;
  current: number;
  benchmark: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  actionPlan: string[];
}

export interface RevenueAlert {
  id: string;
  severity: AlertSeverity;
  type: 'threshold' | 'trend' | 'anomaly' | 'prediction';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold?: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'urgent' | 'normal';
  recommendations: string[];
  createdAt: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface RevenueRecommendation {
  id: string;
  category: 'growth' | 'retention' | 'efficiency' | 'pricing' | 'expansion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  expectedImpact: {
    revenue: number;
    percentage: number;
    timeframe: string;
  };
  effort: 'low' | 'medium' | 'high';
  confidence: number;
  prerequisites: string[];
  steps: RecommendationStep[];
  risks: string[];
  success_metrics: string[];
  createdAt: Date;
  status: 'new' | 'reviewing' | 'approved' | 'implementing' | 'completed' | 'rejected';
}

export interface RecommendationStep {
  step: number;
  description: string;
  owner: string;
  timeline: string;
  dependencies: string[];
  deliverables: string[];
}

export interface DataQualityMetrics {
  overall: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  issues: DataQualityIssue[];
  improvements: DataQualityImprovement[];
}

export interface DataQualityIssue {
  type: 'missing' | 'inconsistent' | 'outdated' | 'invalid';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedMetrics: string[];
  impact: string;
  resolution: string;
}

export interface DataQualityImprovement {
  improvement: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export class RevenueAnalyticsDashboard {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ============================================================================
  // MAIN DASHBOARD GENERATION
  // ============================================================================

  async generateDashboard(
    organizationId: string,
    timeframe: DashboardTimeframe = DashboardTimeframe.MONTHLY,
    customPeriod?: { start: Date; end: Date }
  ): Promise<RevenueDashboard> {
    const period = this.calculatePeriod(timeframe, customPeriod);

    const [
      coreMetrics,
      growthAnalysis,
      customerAnalytics,
      financialHealth,
      predictiveInsights,
      benchmarks,
      alerts,
      recommendations,
      dataQuality
    ] = await Promise.all([
      this.generateCoreMetrics(organizationId, period),
      this.generateGrowthAnalysis(organizationId, period),
      this.generateCustomerAnalytics(organizationId, period),
      this.generateFinancialHealth(organizationId, period),
      this.generatePredictiveInsights(organizationId, period),
      this.generateBenchmarks(organizationId, period),
      this.generateAlerts(organizationId, period),
      this.generateRecommendations(organizationId, period),
      this.assessDataQuality(organizationId, period)
    ]);

    return {
      organizationId,
      timeframe,
      period,
      coreMetrics,
      growthAnalysis,
      customerAnalytics,
      financialHealth,
      predictiveInsights,
      benchmarks,
      alerts,
      recommendations,
      dataQuality,
      lastUpdated: new Date(),
      refreshRate: this.getRefreshRate(timeframe)
    };
  }

  // ============================================================================
  // CORE METRICS GENERATION
  // ============================================================================

  private async generateCoreMetrics(
    organizationId: string,
    period: any
  ): Promise<CoreRevenueMetrics> {
    // This would integrate with actual data sources
    // For now, returning mock structure
    return {
      totalRevenue: this.createMetricValue(150000, 140000),
      monthlyRecurringRevenue: this.createMetricValue(45000, 42000),
      annualRecurringRevenue: this.createMetricValue(540000, 504000),
      averageRevenuePerCustomer: this.createMetricValue(1500, 1400),

      revenueGrowthRate: this.createMetricValue(0.07, 0.05),
      customerGrowthRate: this.createMetricValue(0.12, 0.08),
      expansionRevenue: this.createMetricValue(15000, 12000),

      churnRate: this.createMetricValue(0.03, 0.05),
      revenueChurnRate: this.createMetricValue(0.025, 0.045),
      retentionRate: this.createMetricValue(0.97, 0.95),

      customerAcquisitionCost: this.createMetricValue(750, 850),
      customerLifetimeValue: this.createMetricValue(15000, 14000),
      ltvcacRatio: this.createMetricValue(20, 16.5),
      paybackPeriod: this.createMetricValue(6, 7),

      cashFlow: this.createMetricValue(25000, 20000),
      burnRate: this.createMetricValue(35000, 38000),
      runway: this.createMetricValue(18, 15)
    };
  }

  private createMetricValue(current: number, previous?: number): MetricValue {
    const change = previous ? current - previous : 0;
    const changePercentage = previous ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      changePercentage,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      confidence: 0.85,
      lastUpdated: new Date()
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private calculatePeriod(timeframe: DashboardTimeframe, custom?: { start: Date; end: Date }) {
    if (custom) return { start: custom.start, end: custom.end };

    const now = new Date();
    const start = new Date(now);

    switch (timeframe) {
      case DashboardTimeframe.DAILY:
        start.setDate(start.getDate() - 1);
        break;
      case DashboardTimeframe.WEEKLY:
        start.setDate(start.getDate() - 7);
        break;
      case DashboardTimeframe.MONTHLY:
        start.setMonth(start.getMonth() - 1);
        break;
      case DashboardTimeframe.QUARTERLY:
        start.setMonth(start.getMonth() - 3);
        break;
      case DashboardTimeframe.YEARLY:
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end: now };
  }

  private getRefreshRate(timeframe: DashboardTimeframe): number {
    const rates = {
      [DashboardTimeframe.DAILY]: 5,      // 5 minutes
      [DashboardTimeframe.WEEKLY]: 15,    // 15 minutes
      [DashboardTimeframe.MONTHLY]: 60,   // 1 hour
      [DashboardTimeframe.QUARTERLY]: 240, // 4 hours
      [DashboardTimeframe.YEARLY]: 1440,  // 24 hours
      [DashboardTimeframe.CUSTOM]: 60     // 1 hour
    };
    return rates[timeframe];
  }

  // Placeholder methods for other analytics components
  private async generateGrowthAnalysis(organizationId: string, period: any): Promise<GrowthAnalysis> {
    return {} as GrowthAnalysis;
  }

  private async generateCustomerAnalytics(organizationId: string, period: any): Promise<CustomerAnalytics> {
    return {} as CustomerAnalytics;
  }

  private async generateFinancialHealth(organizationId: string, period: any): Promise<FinancialHealth> {
    return {} as FinancialHealth;
  }

  private async generatePredictiveInsights(organizationId: string, period: any): Promise<PredictiveInsights> {
    return {} as PredictiveInsights;
  }

  private async generateBenchmarks(organizationId: string, period: any): Promise<PerformanceBenchmarks> {
    return {} as PerformanceBenchmarks;
  }

  private async generateAlerts(organizationId: string, period: any): Promise<RevenueAlert[]> {
    return [];
  }

  private async generateRecommendations(organizationId: string, period: any): Promise<RevenueRecommendation[]> {
    return [];
  }

  private async assessDataQuality(organizationId: string, period: any): Promise<DataQualityMetrics> {
    return {
      overall: 0.92,
      completeness: 0.95,
      accuracy: 0.88,
      consistency: 0.93,
      timeliness: 0.91,
      issues: [],
      improvements: []
    };
  }
}

export {
  RevenueAnalyticsDashboard,
  type RevenueDashboard,
  type DashboardTimeframe,
  type MetricCategory,
  type AlertSeverity
};