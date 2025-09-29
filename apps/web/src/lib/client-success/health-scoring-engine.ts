/**
 * Advanced Client Health Scoring Engine
 * Provides comprehensive health analysis and predictive analytics for client retention
 */

import { z } from 'zod';

// Enhanced Health Factor Schema
export const HealthFactorSchema = z.object({
  factor: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(100),
  trend: z.enum(['up', 'down', 'stable']),
  description: z.string(),
  recommendations: z.array(z.string()),
  dataSource: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  lastUpdated: z.date(),
});

export const ClientHealthDataSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  overallScore: z.number().min(0).max(100),
  healthGrade: z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']),
  riskLevel: z.enum(['very_low', 'low', 'medium', 'high', 'critical']),
  churnProbability: z.number().min(0).max(1),
  predictedLifetimeValue: z.number().optional(),
  factors: z.array(HealthFactorSchema),
  historicalScores: z.array(z.object({
    month: z.string(),
    score: z.number(),
    date: z.date(),
  })),
  engagementMetrics: z.object({
    portalLogins: z.number(),
    documentUploads: z.number(),
    communicationFrequency: z.number(),
    responseTime: z.number().optional(),
    serviceUtilization: z.number(),
  }),
  financialMetrics: z.object({
    paymentTimeliness: z.number(),
    revenueGrowth: z.number(),
    profitability: z.number().optional(),
    invoiceAccuracy: z.number(),
  }),
  complianceMetrics: z.object({
    deadlineAdherence: z.number(),
    documentCompleteness: z.number(),
    regulatoryCompliance: z.number(),
  }),
  lastUpdated: z.date(),
  nextReview: z.date(),
  alertsGenerated: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    createdAt: z.date(),
  })),
});

export type HealthFactor = z.infer<typeof HealthFactorSchema>;
export type ClientHealthData = z.infer<typeof ClientHealthDataSchema>;

export interface HealthScoringConfig {
  factorWeights: Record<string, number>;
  thresholds: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
    critical: number;
  };
  churnPredictionModel: {
    enabled: boolean;
    lookbackDays: number;
    minimumDataPoints: number;
  };
  alertSettings: {
    scoreDropThreshold: number;
    consecutiveDeclines: number;
    criticalScoreThreshold: number;
  };
}

export class ClientHealthScoringEngine {
  private config: HealthScoringConfig;

  constructor(config?: Partial<HealthScoringConfig>) {
    this.config = {
      factorWeights: {
        paymentHistory: 25,
        revenueGrowth: 20,
        engagementLevel: 15,
        financialStability: 20,
        complianceStatus: 15,
        communicationQuality: 5,
        ...config?.factorWeights,
      },
      thresholds: {
        excellent: 90,
        good: 80,
        average: 70,
        poor: 60,
        critical: 50,
        ...config?.thresholds,
      },
      churnPredictionModel: {
        enabled: true,
        lookbackDays: 180,
        minimumDataPoints: 12,
        ...config?.churnPredictionModel,
      },
      alertSettings: {
        scoreDropThreshold: 10,
        consecutiveDeclines: 3,
        criticalScoreThreshold: 60,
        ...config?.alertSettings,
      },
    };
  }

  /**
   * Calculate comprehensive client health score
   */
  async calculateHealthScore(clientData: any): Promise<ClientHealthData> {
    const factors = await this.analyzeHealthFactors(clientData);
    const overallScore = this.calculateWeightedScore(factors);
    const healthGrade = this.determineHealthGrade(overallScore);
    const riskLevel = this.assessRiskLevel(overallScore, factors);
    const churnProbability = this.predictChurnProbability(clientData, factors);
    const alerts = this.generateAlerts(overallScore, factors, clientData);

    return {
      clientId: clientData.id,
      clientName: clientData.businessName,
      overallScore,
      healthGrade,
      riskLevel,
      churnProbability,
      predictedLifetimeValue: this.calculatePredictedLTV(clientData),
      factors,
      historicalScores: clientData.historicalScores || [],
      engagementMetrics: this.calculateEngagementMetrics(clientData),
      financialMetrics: this.calculateFinancialMetrics(clientData),
      complianceMetrics: this.calculateComplianceMetrics(clientData),
      lastUpdated: new Date(),
      nextReview: this.calculateNextReviewDate(overallScore),
      alertsGenerated: alerts,
    };
  }

  /**
   * Analyze individual health factors
   */
  private async analyzeHealthFactors(clientData: any): Promise<HealthFactor[]> {
    const factors: HealthFactor[] = [];

    // Payment History Analysis
    factors.push({
      factor: 'Payment History',
      score: this.analyzePaymentHistory(clientData),
      weight: this.config.factorWeights.paymentHistory,
      trend: this.calculateTrend(clientData.paymentHistory),
      description: this.generatePaymentDescription(clientData),
      recommendations: this.generatePaymentRecommendations(clientData),
      dataSource: 'billing_system',
      confidence: 0.95,
      lastUpdated: new Date(),
    });

    // Revenue Growth Analysis
    factors.push({
      factor: 'Revenue Growth',
      score: this.analyzeRevenueGrowth(clientData),
      weight: this.config.factorWeights.revenueGrowth,
      trend: this.calculateRevenueTrend(clientData),
      description: this.generateRevenueDescription(clientData),
      recommendations: this.generateRevenueRecommendations(clientData),
      dataSource: 'quickbooks_integration',
      confidence: 0.88,
      lastUpdated: new Date(),
    });

    // Engagement Level Analysis
    factors.push({
      factor: 'Engagement Level',
      score: this.analyzeEngagementLevel(clientData),
      weight: this.config.factorWeights.engagementLevel,
      trend: this.calculateEngagementTrend(clientData),
      description: this.generateEngagementDescription(clientData),
      recommendations: this.generateEngagementRecommendations(clientData),
      dataSource: 'portal_analytics',
      confidence: 0.92,
      lastUpdated: new Date(),
    });

    // Financial Stability Analysis
    factors.push({
      factor: 'Financial Stability',
      score: this.analyzeFinancialStability(clientData),
      weight: this.config.factorWeights.financialStability,
      trend: this.calculateFinancialTrend(clientData),
      description: this.generateFinancialDescription(clientData),
      recommendations: this.generateFinancialRecommendations(clientData),
      dataSource: 'financial_analysis',
      confidence: 0.85,
      lastUpdated: new Date(),
    });

    // Compliance Status Analysis
    factors.push({
      factor: 'Compliance Status',
      score: this.analyzeComplianceStatus(clientData),
      weight: this.config.factorWeights.complianceStatus,
      trend: this.calculateComplianceTrend(clientData),
      description: this.generateComplianceDescription(clientData),
      recommendations: this.generateComplianceRecommendations(clientData),
      dataSource: 'compliance_tracking',
      confidence: 0.98,
      lastUpdated: new Date(),
    });

    // Communication Quality Analysis
    factors.push({
      factor: 'Communication Quality',
      score: this.analyzeCommunicationQuality(clientData),
      weight: this.config.factorWeights.communicationQuality,
      trend: this.calculateCommunicationTrend(clientData),
      description: this.generateCommunicationDescription(clientData),
      recommendations: this.generateCommunicationRecommendations(clientData),
      dataSource: 'communication_logs',
      confidence: 0.80,
      lastUpdated: new Date(),
    });

    return factors;
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(factors: HealthFactor[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    factors.forEach(factor => {
      totalScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Determine health grade based on score
   */
  private determineHealthGrade(score: number): ClientHealthData['healthGrade'] {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Assess risk level based on score and factors
   */
  private assessRiskLevel(score: number, factors: HealthFactor[]): ClientHealthData['riskLevel'] {
    // Check for critical factors
    const criticalFactors = factors.filter(f => f.score < 40);
    const decliningFactors = factors.filter(f => f.trend === 'down');

    if (score < 50 || criticalFactors.length >= 2) return 'critical';
    if (score < 60 || criticalFactors.length >= 1) return 'high';
    if (score < 75 || decliningFactors.length >= 3) return 'medium';
    if (score < 85 || decliningFactors.length >= 1) return 'low';
    return 'very_low';
  }

  /**
   * Predict churn probability using machine learning approach
   */
  private predictChurnProbability(clientData: any, factors: HealthFactor[]): number {
    if (!this.config.churnPredictionModel.enabled) return 0;

    // Simplified churn prediction model
    // In production, this would use actual ML algorithms
    const scoreWeight = 0.4;
    const trendWeight = 0.3;
    const engagementWeight = 0.2;
    const timeWeight = 0.1;

    const scoreRisk = Math.max(0, (100 - factors.reduce((sum, f) => sum + f.score, 0) / factors.length) / 100);
    const trendRisk = factors.filter(f => f.trend === 'down').length / factors.length;
    const engagementRisk = this.calculateEngagementRisk(clientData);
    const timeRisk = this.calculateTimeBasedRisk(clientData);

    const churnProbability = (
      scoreRisk * scoreWeight +
      trendRisk * trendWeight +
      engagementRisk * engagementWeight +
      timeRisk * timeWeight
    );

    return Math.min(1, Math.max(0, churnProbability));
  }

  /**
   * Generate alerts based on health score and factors
   */
  private generateAlerts(score: number, factors: HealthFactor[], clientData: any): Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    createdAt: Date;
  }> {
    const alerts = [];

    // Critical score alert
    if (score < this.config.alertSettings.criticalScoreThreshold) {
      alerts.push({
        type: 'critical_health_score',
        severity: 'critical' as const,
        message: `Client health score has dropped to ${score}, immediate attention required`,
        createdAt: new Date(),
      });
    }

    // Declining trend alerts
    const decliningFactors = factors.filter(f => f.trend === 'down');
    if (decliningFactors.length >= 2) {
      alerts.push({
        type: 'multiple_declining_factors',
        severity: 'high' as const,
        message: `${decliningFactors.length} health factors are declining: ${decliningFactors.map(f => f.factor).join(', ')}`,
        createdAt: new Date(),
      });
    }

    // Payment-specific alerts
    const paymentFactor = factors.find(f => f.factor === 'Payment History');
    if (paymentFactor && paymentFactor.score < 70) {
      alerts.push({
        type: 'payment_issues',
        severity: paymentFactor.score < 50 ? 'critical' : 'high',
        message: 'Payment history indicates potential collection issues',
        createdAt: new Date(),
      });
    }

    // Engagement alerts
    const engagementFactor = factors.find(f => f.factor === 'Engagement Level');
    if (engagementFactor && engagementFactor.score < 60) {
      alerts.push({
        type: 'low_engagement',
        severity: 'medium' as const,
        message: 'Client engagement has decreased significantly',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  // Individual analysis methods
  private analyzePaymentHistory(clientData: any): number {
    // Analyze payment patterns, late payments, etc.
    const onTimePayments = clientData.invoices?.filter((inv: any) => inv.paidOnTime)?.length || 0;
    const totalInvoices = clientData.invoices?.length || 1;
    return Math.round((onTimePayments / totalInvoices) * 100);
  }

  private analyzeRevenueGrowth(clientData: any): number {
    // Calculate revenue growth trend
    if (!clientData.annualRevenue || !clientData.previousYearRevenue) return 75;
    const growth = ((clientData.annualRevenue - clientData.previousYearRevenue) / clientData.previousYearRevenue) * 100;
    return Math.min(100, Math.max(0, 50 + growth * 2));
  }

  private analyzeEngagementLevel(clientData: any): number {
    // Analyze portal usage, communication frequency, etc.
    const baseScore = 50;
    const loginBonus = Math.min(30, (clientData.monthlyLogins || 0) * 3);
    const uploadBonus = Math.min(20, (clientData.documentsUploaded || 0) * 2);
    return Math.min(100, baseScore + loginBonus + uploadBonus);
  }

  private analyzeFinancialStability(clientData: any): number {
    // Analyze cash flow, profitability, debt ratios
    const cashFlowScore = this.assessCashFlow(clientData);
    const profitabilityScore = this.assessProfitability(clientData);
    return Math.round((cashFlowScore + profitabilityScore) / 2);
  }

  private analyzeComplianceStatus(clientData: any): number {
    // Analyze compliance with deadlines, document submissions
    const deadlineScore = this.assessDeadlineCompliance(clientData);
    const documentScore = this.assessDocumentCompliance(clientData);
    return Math.round((deadlineScore + documentScore) / 2);
  }

  private analyzeCommunicationQuality(clientData: any): number {
    // Analyze response times, communication frequency
    const responseScore = this.assessResponseTimes(clientData);
    const frequencyScore = this.assessCommunicationFrequency(clientData);
    return Math.round((responseScore + frequencyScore) / 2);
  }

  // Trend calculation methods
  private calculateTrend(data: any[]): 'up' | 'down' | 'stable' {
    if (!data || data.length < 2) return 'stable';
    const recent = data.slice(-3);
    const older = data.slice(-6, -3);

    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;

    const threshold = 0.05; // 5% threshold
    if (recentAvg > olderAvg * (1 + threshold)) return 'up';
    if (recentAvg < olderAvg * (1 - threshold)) return 'down';
    return 'stable';
  }

  private calculateRevenueTrend(clientData: any): 'up' | 'down' | 'stable' {
    return this.calculateTrend(clientData.revenueHistory || []);
  }

  private calculateEngagementTrend(clientData: any): 'up' | 'down' | 'stable' {
    return this.calculateTrend(clientData.engagementHistory || []);
  }

  private calculateFinancialTrend(clientData: any): 'up' | 'down' | 'stable' {
    return this.calculateTrend(clientData.financialHistory || []);
  }

  private calculateComplianceTrend(clientData: any): 'up' | 'down' | 'stable' {
    return this.calculateTrend(clientData.complianceHistory || []);
  }

  private calculateCommunicationTrend(clientData: any): 'up' | 'down' | 'stable' {
    return this.calculateTrend(clientData.communicationHistory || []);
  }

  // Helper methods for metrics calculation
  private calculateEngagementMetrics(clientData: any) {
    return {
      portalLogins: clientData.monthlyLogins || 0,
      documentUploads: clientData.documentsUploaded || 0,
      communicationFrequency: clientData.communicationFrequency || 0,
      responseTime: clientData.avgResponseTime,
      serviceUtilization: clientData.serviceUtilization || 0,
    };
  }

  private calculateFinancialMetrics(clientData: any) {
    return {
      paymentTimeliness: this.analyzePaymentHistory(clientData),
      revenueGrowth: this.calculateRevenueGrowthRate(clientData),
      profitability: clientData.profitMargin,
      invoiceAccuracy: clientData.invoiceAccuracy || 95,
    };
  }

  private calculateComplianceMetrics(clientData: any) {
    return {
      deadlineAdherence: this.assessDeadlineCompliance(clientData),
      documentCompleteness: this.assessDocumentCompliance(clientData),
      regulatoryCompliance: clientData.regulatoryScore || 85,
    };
  }

  private calculatePredictedLTV(clientData: any): number | undefined {
    if (!clientData.annualRevenue) return undefined;
    const avgRetentionYears = 5; // Default assumption
    const churnRate = 0.15; // Default 15% annual churn
    return clientData.annualRevenue * avgRetentionYears * (1 - churnRate);
  }

  private calculateNextReviewDate(score: number): Date {
    const daysUntilReview = score < 60 ? 7 : score < 80 ? 30 : 90;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysUntilReview);
    return nextReview;
  }

  private calculateEngagementRisk(clientData: any): number {
    const monthlyLogins = clientData.monthlyLogins || 0;
    const expectedLogins = 10; // Expected monthly logins
    return Math.max(0, (expectedLogins - monthlyLogins) / expectedLogins);
  }

  private calculateTimeBasedRisk(clientData: any): number {
    const monthsSinceLastContact = this.getMonthsSinceLastContact(clientData);
    return Math.min(1, monthsSinceLastContact / 6); // Risk increases after 6 months
  }

  // Additional helper methods for assessments
  private assessCashFlow(clientData: any): number {
    return clientData.cashFlowScore || 75;
  }

  private assessProfitability(clientData: any): number {
    return clientData.profitabilityScore || 80;
  }

  private assessDeadlineCompliance(clientData: any): number {
    return clientData.deadlineComplianceScore || 85;
  }

  private assessDocumentCompliance(clientData: any): number {
    return clientData.documentComplianceScore || 90;
  }

  private assessResponseTimes(clientData: any): number {
    const avgResponseHours = clientData.avgResponseTime || 24;
    const targetResponseHours = 8;
    return Math.max(0, 100 - ((avgResponseHours - targetResponseHours) * 5));
  }

  private assessCommunicationFrequency(clientData: any): number {
    return clientData.communicationFrequencyScore || 80;
  }

  private calculateRevenueGrowthRate(clientData: any): number {
    if (!clientData.annualRevenue || !clientData.previousYearRevenue) return 0;
    return ((clientData.annualRevenue - clientData.previousYearRevenue) / clientData.previousYearRevenue) * 100;
  }

  private getMonthsSinceLastContact(clientData: any): number {
    if (!clientData.lastContactDate) return 0;
    const lastContact = new Date(clientData.lastContactDate);
    const now = new Date();
    return (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }

  // Description and recommendation generators
  private generatePaymentDescription(clientData: any): string {
    const score = this.analyzePaymentHistory(clientData);
    if (score >= 90) return 'Excellent payment history with consistent on-time payments';
    if (score >= 80) return 'Good payment history with occasional delays';
    if (score >= 70) return 'Adequate payment history with some concerns';
    return 'Poor payment history requiring immediate attention';
  }

  private generatePaymentRecommendations(clientData: any): string[] {
    const score = this.analyzePaymentHistory(clientData);
    if (score < 70) {
      return [
        'Schedule payment plan discussion',
        'Consider adjusting payment terms',
        'Implement automated payment reminders',
        'Review credit terms and collection procedures'
      ];
    }
    return ['Maintain current payment monitoring'];
  }

  private generateRevenueDescription(clientData: any): string {
    const growth = this.calculateRevenueGrowthRate(clientData);
    if (growth > 15) return `Strong revenue growth of ${growth.toFixed(1)}%`;
    if (growth > 5) return `Moderate revenue growth of ${growth.toFixed(1)}%`;
    if (growth > -5) return `Stable revenue with ${growth.toFixed(1)}% change`;
    return `Revenue decline of ${Math.abs(growth).toFixed(1)}% requires attention`;
  }

  private generateRevenueRecommendations(clientData: any): string[] {
    const growth = this.calculateRevenueGrowthRate(clientData);
    if (growth < 0) {
      return [
        'Conduct business performance review',
        'Identify cost reduction opportunities',
        'Explore new revenue streams',
        'Consider strategic planning consultation'
      ];
    }
    if (growth > 15) {
      return [
        'Discuss expansion opportunities',
        'Consider additional service offerings',
        'Review operational scalability'
      ];
    }
    return ['Continue monitoring revenue trends'];
  }

  private generateEngagementDescription(clientData: any): string {
    const score = this.analyzeEngagementLevel(clientData);
    if (score >= 80) return 'High engagement with regular portal usage and communication';
    if (score >= 60) return 'Moderate engagement with room for improvement';
    return 'Low engagement indicating potential disengagement';
  }

  private generateEngagementRecommendations(clientData: any): string[] {
    const score = this.analyzeEngagementLevel(clientData);
    if (score < 60) {
      return [
        'Schedule check-in call to address concerns',
        'Provide portal training and support',
        'Increase proactive communication',
        'Review service delivery and satisfaction'
      ];
    }
    return ['Continue current engagement strategy'];
  }

  private generateFinancialDescription(clientData: any): string {
    const score = this.analyzeFinancialStability(clientData);
    if (score >= 80) return 'Strong financial position with stable cash flow';
    if (score >= 60) return 'Adequate financial stability with minor concerns';
    return 'Financial stability concerns requiring monitoring';
  }

  private generateFinancialRecommendations(clientData: any): string[] {
    const score = this.analyzeFinancialStability(clientData);
    if (score < 60) {
      return [
        'Conduct financial health assessment',
        'Review cash flow management strategies',
        'Consider financial planning consultation',
        'Monitor payment capacity'
      ];
    }
    return ['Continue financial monitoring'];
  }

  private generateComplianceDescription(clientData: any): string {
    const score = this.analyzeComplianceStatus(clientData);
    if (score >= 90) return 'Excellent compliance with all requirements';
    if (score >= 75) return 'Good compliance with minor areas for improvement';
    return 'Compliance issues requiring immediate attention';
  }

  private generateComplianceRecommendations(clientData: any): string[] {
    const score = this.analyzeComplianceStatus(clientData);
    if (score < 75) {
      return [
        'Review compliance requirements and deadlines',
        'Implement compliance tracking system',
        'Provide compliance training and support',
        'Schedule regular compliance check-ins'
      ];
    }
    return ['Maintain current compliance procedures'];
  }

  private generateCommunicationDescription(clientData: any): string {
    const score = this.analyzeCommunicationQuality(clientData);
    if (score >= 80) return 'Excellent communication with prompt responses';
    if (score >= 60) return 'Adequate communication with room for improvement';
    return 'Communication issues requiring attention';
  }

  private generateCommunicationRecommendations(clientData: any): string[] {
    const score = this.analyzeCommunicationQuality(clientData);
    if (score < 60) {
      return [
        'Establish regular communication schedule',
        'Improve response time procedures',
        'Implement communication tracking',
        'Review communication preferences'
      ];
    }
    return ['Continue current communication practices'];
  }
}

// Export singleton instance
export const healthScoringEngine = new ClientHealthScoringEngine();