/**
 * Revenue Intelligence System Index
 *
 * Main entry point for the comprehensive revenue optimization system
 * integrating pricing optimization, expansion opportunities, churn prevention,
 * analytics dashboard, and market expansion strategies.
 */

// Core Engines
export { RevenueIntelligenceEngine } from './analytics-engine';
export { PricingOptimizationEngine } from './pricing-optimization-engine';
export { ExpansionOpportunityEngine } from './expansion-opportunity-engine';
export { ChurnPreventionEngine } from './churn-prevention-engine';
export { RevenueAnalyticsDashboard } from './revenue-analytics-dashboard';
export { MarketExpansionEngine } from './market-expansion-engine';

// Types - Pricing Optimization
export type {
  ValueBasedPricingModel,
  PricingRecommendation,
  SeasonalPricingStrategy,
  FirmProfile,
  CPAFirmSize
} from './pricing-optimization-engine';

// Types - Expansion Opportunities
export type {
  ExpansionOpportunity,
  ExpansionAnalytics,
  OpportunityType,
  OpportunityPriority,
  OpportunityStage
} from './expansion-opportunity-engine';

// Types - Churn Prevention
export type {
  ChurnPrediction,
  RetentionPlan,
  ChurnAnalytics,
  ChurnRiskLevel,
  RetentionStrategy
} from './churn-prevention-engine';

// Types - Analytics Dashboard
export type {
  RevenueDashboard,
  DashboardTimeframe,
  MetricCategory,
  AlertSeverity
} from './revenue-analytics-dashboard';

// Types - Market Expansion
export type {
  MarketExpansionStrategy,
  ExpansionOpportunity as MarketExpansionOpportunity,
  ExpansionType,
  MarketAnalysis
} from './market-expansion-engine';

// Types - Core Analytics
export type {
  RevenueMetrics,
  ExpansionOpportunity as CoreExpansionOpportunity,
  ChurnPrediction as CoreChurnPrediction,
  PricingAnalysis,
  MarketIntelligence,
  StrategicInsights,
  RevenueForecasts
} from './analytics-engine';

import { PrismaClient } from '@prisma/client';
import { RevenueIntelligenceEngine } from './analytics-engine';
import { PricingOptimizationEngine } from './pricing-optimization-engine';
import { ExpansionOpportunityEngine } from './expansion-opportunity-engine';
import { ChurnPreventionEngine } from './churn-prevention-engine';
import { RevenueAnalyticsDashboard } from './revenue-analytics-dashboard';
import { MarketExpansionEngine } from './market-expansion-engine';

/**
 * Main Revenue Intelligence Controller
 *
 * Orchestrates all revenue optimization components and provides
 * a unified interface for revenue intelligence operations.
 */
export class RevenueIntelligenceController {
  private prisma: PrismaClient;
  private analyticsEngine: RevenueIntelligenceEngine;
  private pricingEngine: PricingOptimizationEngine;
  private expansionEngine: ExpansionOpportunityEngine;
  private churnEngine: ChurnPreventionEngine;
  private dashboardEngine: RevenueAnalyticsDashboard;
  private marketEngine: MarketExpansionEngine;

  constructor() {
    this.prisma = new PrismaClient();
    this.analyticsEngine = new RevenueIntelligenceEngine();
    this.pricingEngine = new PricingOptimizationEngine();
    this.expansionEngine = new ExpansionOpportunityEngine();
    this.churnEngine = new ChurnPreventionEngine();
    this.dashboardEngine = new RevenueAnalyticsDashboard();
    this.marketEngine = new MarketExpansionEngine();
  }

  /**
   * Generate comprehensive revenue intelligence report
   */
  async generateRevenueIntelligenceReport(organizationId: string) {
    const [
      strategicInsights,
      dashboard,
      expansionOpportunities,
      churnAnalysis,
      pricingOptimization,
      marketStrategy
    ] = await Promise.all([
      this.analyticsEngine.generateStrategicInsights(organizationId),
      this.dashboardEngine.generateDashboard(organizationId),
      this.expansionEngine.identifyExpansionOpportunities(organizationId),
      this.churnEngine.generateChurnAnalytics(organizationId, {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      }),
      this.pricingEngine.implementSeasonalPricing(organizationId),
      this.marketEngine.generateExpansionStrategy(organizationId)
    ]);

    return {
      organizationId,
      generatedAt: new Date(),
      strategicInsights,
      dashboard,
      expansionOpportunities,
      churnAnalysis,
      pricingOptimization,
      marketStrategy,
      executiveSummary: this.generateExecutiveSummary({
        strategicInsights,
        dashboard,
        expansionOpportunities,
        churnAnalysis,
        pricingOptimization,
        marketStrategy
      })
    };
  }

  /**
   * Optimize pricing for a specific client
   */
  async optimizeClientPricing(clientId: string) {
    const [
      churnPrediction,
      expansionOpportunities,
      pricingRecommendation
    ] = await Promise.all([
      this.churnEngine.predictClientChurn(clientId),
      this.expansionEngine.identifyExpansionOpportunities(clientId),
      this.pricingEngine.optimizePricingForFirm(clientId)
    ]);

    return {
      clientId,
      churnPrediction,
      expansionOpportunities: expansionOpportunities.filter(opp => opp.clientId === clientId),
      pricingRecommendation,
      integratedStrategy: this.createIntegratedPricingStrategy({
        churnPrediction,
        expansionOpportunities,
        pricingRecommendation
      })
    };
  }

  /**
   * Execute retention campaign for at-risk clients
   */
  async executeRetentionCampaign(organizationId: string) {
    const churnPredictions = await this.churnEngine.batchPredictChurn(organizationId);
    const highRiskClients = churnPredictions.filter(p =>
      p.riskLevel === 'critical' || p.riskLevel === 'high'
    );

    const retentionPlans = await Promise.all(
      highRiskClients.map(prediction =>
        this.churnEngine.createRetentionPlan(prediction)
      )
    );

    const executionResults = await Promise.all(
      retentionPlans.map(plan =>
        this.churnEngine.executeRetentionPlan(plan.clientId)
      )
    );

    return {
      organizationId,
      campaignId: `retention_${Date.now()}`,
      targetedClients: highRiskClients.length,
      revenueAtRisk: highRiskClients.reduce((sum, p) => sum + p.revenueAtRisk.annual, 0),
      retentionPlans,
      executionResults,
      expectedOutcome: this.calculateRetentionCampaignROI(retentionPlans, executionResults)
    };
  }

  /**
   * Launch expansion opportunity campaign
   */
  async launchExpansionCampaign(organizationId: string) {
    const opportunities = await this.expansionEngine.identifyExpansionOpportunities(organizationId);
    const highPriorityOpportunities = opportunities.filter(opp =>
      opp.priority === 'critical' || opp.priority === 'high'
    );

    const executionResults = await Promise.all(
      highPriorityOpportunities.map(opportunity =>
        this.expansionEngine.executeOpportunityPlaybook(opportunity.id)
      )
    );

    return {
      organizationId,
      campaignId: `expansion_${Date.now()}`,
      opportunities: highPriorityOpportunities.length,
      totalValue: highPriorityOpportunities.reduce((sum, opp) => sum + opp.value.annualRecurringRevenue, 0),
      executionResults,
      expectedOutcome: this.calculateExpansionCampaignROI(highPriorityOpportunities, executionResults)
    };
  }

  /**
   * Generate monthly revenue optimization report
   */
  async generateMonthlyReport(organizationId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    const [
      monthlyMetrics,
      expansionAnalytics,
      churnAnalytics,
      pricingAnalysis
    ] = await Promise.all([
      this.analyticsEngine.batchAnalyzeCustomerValue(organizationId),
      this.expansionEngine.generateExpansionAnalytics(organizationId, {
        start: monthStart,
        end: monthEnd
      }),
      this.churnEngine.generateChurnAnalytics(organizationId, {
        start: monthStart,
        end: monthEnd
      }),
      this.pricingEngine.analyzePricingOpportunities(organizationId)
    ]);

    return {
      organizationId,
      period: { start: monthStart, end: monthEnd },
      monthlyMetrics,
      expansionAnalytics,
      churnAnalytics,
      pricingAnalysis,
      recommendations: this.generateMonthlyRecommendations({
        monthlyMetrics,
        expansionAnalytics,
        churnAnalytics,
        pricingAnalysis
      })
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateExecutiveSummary(data: any) {
    return {
      totalRevenue: data.dashboard.coreMetrics.totalRevenue.current,
      revenueGrowth: data.dashboard.coreMetrics.revenueGrowthRate.current,
      churnRate: data.dashboard.coreMetrics.churnRate.current,
      expansionOpportunities: data.expansionOpportunities.length,
      revenueAtRisk: data.churnAnalysis.revenueAtRisk || 0,
      keyInsights: [
        `${data.expansionOpportunities.length} expansion opportunities identified worth $${Math.round(data.expansionOpportunities.reduce((sum: number, opp: any) => sum + opp.value.annualRecurringRevenue, 0) / 1000)}K`,
        `${Math.round(data.dashboard.coreMetrics.churnRate.current * 100)}% churn rate with $${Math.round((data.churnAnalysis.revenueAtRisk || 0) / 1000)}K at risk`,
        `${data.pricingOptimization.strategies?.length || 0} pricing optimization opportunities identified`,
        `${data.marketStrategy.opportunities?.length || 0} market expansion opportunities evaluated`
      ],
      recommendations: [
        'Prioritize high-value expansion opportunities',
        'Implement immediate retention strategies for at-risk clients',
        'Execute seasonal pricing adjustments',
        'Accelerate market expansion planning'
      ]
    };
  }

  private createIntegratedPricingStrategy(data: any) {
    return {
      approach: 'integrated_optimization',
      churnRiskAdjustment: data.churnPrediction.riskLevel === 'high' ? -0.1 : 0,
      expansionPotentialAdjustment: data.expansionOpportunities.length > 2 ? 0.15 : 0,
      recommendedAction: this.determineRecommendedPricingAction(data),
      timeline: this.calculatePricingTimeline(data),
      expectedOutcome: this.projectPricingOutcome(data)
    };
  }

  private determineRecommendedPricingAction(data: any): string {
    if (data.churnPrediction.riskLevel === 'critical') {
      return 'Hold pricing, focus on retention';
    } else if (data.expansionOpportunities.length > 3) {
      return 'Implement value-based increase with expansion offers';
    } else {
      return 'Moderate increase with enhanced value communication';
    }
  }

  private calculatePricingTimeline(data: any): string {
    if (data.churnPrediction.riskLevel === 'critical') {
      return 'Immediate retention focus, pricing review in 3 months';
    } else {
      return 'Implement over 60-90 days with value reinforcement';
    }
  }

  private projectPricingOutcome(data: any) {
    const baseIncrease = data.pricingRecommendation.recommendedMRR - data.pricingRecommendation.currentMRR;
    const churnAdjustment = data.churnPrediction.riskLevel === 'high' ? 0.7 : 1.0;
    const expansionBoost = Math.min(data.expansionOpportunities.length * 0.05, 0.2);

    return {
      projectedMRRIncrease: baseIncrease * churnAdjustment * (1 + expansionBoost),
      projectedAnnualImpact: baseIncrease * 12 * churnAdjustment * (1 + expansionBoost),
      confidence: data.pricingRecommendation.confidenceScore * 0.9, // Slight reduction for integrated approach
      timeline: '3-6 months for full realization'
    };
  }

  private calculateRetentionCampaignROI(plans: any[], results: any[]) {
    const totalInvestment = plans.reduce((sum, plan) => sum + (plan.resources?.budget || 0), 0);
    const totalRevenueAtRisk = plans.reduce((sum, plan) => sum + plan.churnPrediction.revenueAtRisk.annual, 0);
    const estimatedRetentionRate = 0.65; // 65% success rate
    const revenuePreserved = totalRevenueAtRisk * estimatedRetentionRate;

    return {
      totalInvestment,
      revenueAtRisk: totalRevenueAtRisk,
      revenuePreserved,
      roi: totalInvestment > 0 ? (revenuePreserved - totalInvestment) / totalInvestment : 0,
      paybackPeriod: totalInvestment > 0 ? totalInvestment / (revenuePreserved / 12) : 0 // months
    };
  }

  private calculateExpansionCampaignROI(opportunities: any[], results: any[]) {
    const totalInvestment = opportunities.reduce((sum, opp) => sum + (opp.investmentRequired || 0), 0);
    const totalRevenuePotential = opportunities.reduce((sum, opp) => sum + opp.value.annualRecurringRevenue, 0);
    const estimatedConversionRate = 0.35; // 35% success rate
    const revenueGenerated = totalRevenuePotential * estimatedConversionRate;

    return {
      totalInvestment,
      revenuePotential: totalRevenuePotential,
      revenueGenerated,
      roi: totalInvestment > 0 ? (revenueGenerated - totalInvestment) / totalInvestment : 0,
      paybackPeriod: totalInvestment > 0 ? totalInvestment / (revenueGenerated / 12) : 0 // months
    };
  }

  private generateMonthlyRecommendations(data: any) {
    const recommendations = [];

    // Revenue growth recommendations
    if (data.monthlyMetrics.some((m: any) => m.growthRate < 0.05)) {
      recommendations.push({
        category: 'growth',
        priority: 'high',
        title: 'Accelerate Revenue Growth',
        description: 'Focus on high-value client segments and expansion opportunities',
        actions: ['Identify top expansion opportunities', 'Implement tier upgrade campaigns', 'Enhance value delivery']
      });
    }

    // Churn prevention recommendations
    if (data.churnAnalytics.churnRate > 0.05) {
      recommendations.push({
        category: 'retention',
        priority: 'critical',
        title: 'Reduce Customer Churn',
        description: 'Implement immediate retention strategies for at-risk customers',
        actions: ['Deploy churn prediction model', 'Launch retention campaigns', 'Improve customer success programs']
      });
    }

    // Pricing optimization recommendations
    if (data.pricingAnalysis.some((p: any) => p.priceIncreaseOpportunity > 0.1)) {
      recommendations.push({
        category: 'pricing',
        priority: 'medium',
        title: 'Optimize Pricing Strategy',
        description: 'Implement value-based pricing adjustments',
        actions: ['Conduct pricing analysis', 'Communicate value propositions', 'Phase pricing increases']
      });
    }

    return recommendations;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Export the main controller as default
export default RevenueIntelligenceController;