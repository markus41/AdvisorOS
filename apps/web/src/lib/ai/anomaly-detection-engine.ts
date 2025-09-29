/**
 * Advanced Anomaly Detection and Risk Assessment Engine
 * ML-based anomaly detection with AI-powered risk assessment for financial data
 */

import { openaiClient } from './openai-client';
import { financialInsightsPrompts, formatPrompt } from './prompts';
import { db } from '../../server/db';

export interface AnomalyDetectionConfig {
  thresholds: {
    statistical: number; // Z-score threshold (e.g., 2.5)
    confidence: number; // Minimum confidence for reporting (e.g., 0.7)
    severity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  algorithms: {
    enableStatistical: boolean;
    enableMLModels: boolean;
    enableAIAnalysis: boolean;
    enableBenfordLaw: boolean;
    enableTimeSeriesAnalysis: boolean;
  };
  categories: string[];
  excludePatterns?: string[];
}

export interface Anomaly {
  id: string;
  type: 'amount' | 'frequency' | 'pattern' | 'timing' | 'variance' | 'sequence' | 'relationship';
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  details: {
    expectedValue?: number;
    actualValue?: number;
    deviation?: number;
    pattern?: string;
    context?: Record<string, any>;
  };
  location: {
    table?: string;
    field?: string;
    recordId?: string;
    dateRange?: { start: Date; end: Date };
  };
  analysis: {
    statisticalSignificance: number;
    historicalComparison: string;
    businessImpact: string;
    falseProbability: number;
  };
  recommendations: Array<{
    action: string;
    priority: 'immediate' | 'urgent' | 'normal' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
  metadata: {
    algorithm: string;
    modelVersion: string;
    processingTime: number;
    dataSource: string;
    relatedAnomalies: string[];
  };
  status: 'new' | 'investigating' | 'resolved' | 'false_positive' | 'acknowledged';
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface RiskAssessment {
  id: string;
  riskType: 'financial' | 'operational' | 'compliance' | 'fraud' | 'strategic' | 'reputational';
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  impact: number; // 0-1
  riskScore: number; // probability * impact
  description: string;
  triggers: Array<{
    type: string;
    description: string;
    threshold: number;
    currentValue: number;
  }>;
  indicators: Array<{
    metric: string;
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    significance: 'low' | 'medium' | 'high';
  }>;
  mitigationStrategies: Array<{
    strategy: string;
    effectiveness: number;
    cost: 'low' | 'medium' | 'high';
    timeline: string;
    responsibility: string;
  }>;
  monitoringPlan: {
    frequency: 'real-time' | 'daily' | 'weekly' | 'monthly';
    metrics: string[];
    alertThresholds: Record<string, number>;
    reportingSchedule: string;
  };
  historicalContext: {
    previousOccurrences: number;
    averageImpact: number;
    lastOccurrence?: Date;
    trends: Array<{
      period: string;
      riskLevel: string;
      notes: string;
    }>;
  };
  metadata: {
    model: string;
    confidence: number;
    dataQuality: number;
    lastAssessment: Date;
    nextReview: Date;
  };
  status: 'active' | 'monitoring' | 'mitigated' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudDetectionResult {
  id: string;
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  fraudProbability: number;
  fraudTypes: Array<{
    type: string;
    probability: number;
    evidence: string[];
  }>;
  patterns: Array<{
    pattern: string;
    description: string;
    frequency: number;
    riskLevel: string;
  }>;
  recommendations: Array<{
    action: string;
    urgency: 'immediate' | 'urgent' | 'normal';
    reasoning: string;
  }>;
  evidenceTrail: Array<{
    timestamp: Date;
    action: string;
    user?: string;
    details: Record<string, any>;
  }>;
  investigationNotes?: string;
  status: 'flagged' | 'investigating' | 'cleared' | 'confirmed_fraud';
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceViolation {
  id: string;
  violationType: 'regulatory' | 'internal_policy' | 'industry_standard' | 'legal';
  regulation: string;
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  description: string;
  evidence: Array<{
    type: 'transaction' | 'document' | 'pattern' | 'omission';
    description: string;
    reference: string;
    timestamp: Date;
  }>;
  potentialPenalties: Array<{
    type: 'financial' | 'operational' | 'reputational';
    description: string;
    estimatedImpact: number;
  }>;
  correctiveActions: Array<{
    action: string;
    deadline: Date;
    responsible: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  reportingRequirements: Array<{
    authority: string;
    deadline: Date;
    status: 'not_required' | 'pending' | 'submitted';
  }>;
  status: 'identified' | 'investigating' | 'remediation' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

class AnomalyDetectionEngine {
  private config: AnomalyDetectionConfig;
  private isInitialized = false;
  private modelCache: Map<string, any> = new Map();
  private anomalyHistory: Map<string, Anomaly[]> = new Map();

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    this.config = {
      thresholds: {
        statistical: 2.5,
        confidence: 0.7,
        severity: {
          low: 0.3,
          medium: 0.5,
          high: 0.7,
          critical: 0.9,
        },
      },
      algorithms: {
        enableStatistical: true,
        enableMLModels: true,
        enableAIAnalysis: true,
        enableBenfordLaw: true,
        enableTimeSeriesAnalysis: true,
      },
      categories: ['financial', 'operational', 'compliance', 'behavioral'],
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    this.isInitialized = openaiClient.isReady();
  }

  public isReady(): boolean {
    return this.isInitialized && openaiClient.isReady();
  }

  /**
   * Comprehensive anomaly detection across financial data
   */
  public async detectAnomalies(
    data: {
      transactions: Array<{
        id: string;
        date: Date;
        amount: number;
        description: string;
        category: string;
        account: string;
        userId?: string;
        metadata?: Record<string, any>;
      }>;
      accounts: Array<{
        id: string;
        name: string;
        type: string;
        balance: number;
        lastActivity: Date;
      }>;
      users: Array<{
        id: string;
        name: string;
        role: string;
        lastLogin: Date;
        permissions: string[];
      }>;
      historicalData?: Record<string, number[]>;
    },
    organizationId: string,
    options: {
      timeRange?: { start: Date; end: Date };
      categories?: string[];
      enableRealTime?: boolean;
      customThresholds?: Partial<AnomalyDetectionConfig['thresholds']>;
    } = {}
  ): Promise<{
    anomalies: Anomaly[];
    riskAssessments: RiskAssessment[];
    fraudAlerts: FraudDetectionResult[];
    complianceViolations: ComplianceViolation[];
    summary: {
      totalAnomalies: number;
      criticalAnomalies: number;
      fraudProbability: number;
      overallRiskScore: number;
      recommendedActions: string[];
    };
  }> {
    if (!this.isReady()) {
      throw new Error('Anomaly Detection Engine is not ready');
    }

    try {
      const startTime = Date.now();

      // Merge custom thresholds
      const effectiveConfig = {
        ...this.config,
        thresholds: { ...this.config.thresholds, ...options.customThresholds },
      };

      const anomalies: Anomaly[] = [];
      const riskAssessments: RiskAssessment[] = [];
      const fraudAlerts: FraudDetectionResult[] = [];
      const complianceViolations: ComplianceViolation[] = [];

      // Run different detection algorithms in parallel
      const [
        statisticalAnomalies,
        patternAnomalies,
        behavioralAnomalies,
        timeSeriesAnomalies,
        benfordAnomalies,
        aiAnomalies,
      ] = await Promise.all([
        this.config.algorithms.enableStatistical
          ? this.detectStatisticalAnomalies(data, effectiveConfig)
          : Promise.resolve([]),
        this.config.algorithms.enableMLModels
          ? this.detectPatternAnomalies(data, effectiveConfig)
          : Promise.resolve([]),
        this.detectBehavioralAnomalies(data, effectiveConfig),
        this.config.algorithms.enableTimeSeriesAnalysis
          ? this.detectTimeSeriesAnomalies(data, effectiveConfig)
          : Promise.resolve([]),
        this.config.algorithms.enableBenfordLaw
          ? this.detectBenfordLawViolations(data, effectiveConfig)
          : Promise.resolve([]),
        this.config.algorithms.enableAIAnalysis
          ? this.detectAIAnomalies(data, organizationId, effectiveConfig)
          : Promise.resolve([]),
      ]);

      // Combine all anomalies
      anomalies.push(
        ...statisticalAnomalies,
        ...patternAnomalies,
        ...behavioralAnomalies,
        ...timeSeriesAnomalies,
        ...benfordAnomalies,
        ...aiAnomalies
      );

      // Deduplicate and rank anomalies
      const deduplicatedAnomalies = this.deduplicateAnomalies(anomalies);
      const rankedAnomalies = this.rankAnomaliesBySeverity(deduplicatedAnomalies);

      // Generate risk assessments based on anomalies
      const risks = await this.generateRiskAssessments(rankedAnomalies, data, organizationId);
      riskAssessments.push(...risks);

      // Detect potential fraud
      const fraudAnalysis = await this.analyzeForFraud(rankedAnomalies, data, organizationId);
      fraudAlerts.push(...fraudAnalysis);

      // Check for compliance violations
      const complianceAnalysis = await this.analyzeComplianceViolations(rankedAnomalies, data, organizationId);
      complianceViolations.push(...complianceAnalysis);

      // Generate summary
      const summary = this.generateSummary(rankedAnomalies, riskAssessments, fraudAlerts);

      // Store results
      await this.storeDetectionResults(
        {
          anomalies: rankedAnomalies,
          riskAssessments,
          fraudAlerts,
          complianceViolations,
        },
        organizationId
      );

      // Update anomaly history
      this.updateAnomalyHistory(organizationId, rankedAnomalies);

      const processingTime = Date.now() - startTime;
      console.log(`Anomaly detection completed in ${processingTime}ms`);

      return {
        anomalies: rankedAnomalies,
        riskAssessments,
        fraudAlerts,
        complianceViolations,
        summary,
      };
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      throw new Error(`Anomaly detection failed: ${error}`);
    }
  }

  /**
   * Statistical anomaly detection using Z-score and other statistical measures
   */
  private async detectStatisticalAnomalies(
    data: any,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      // Analyze transaction amounts
      const amounts = data.transactions.map((t: any) => t.amount);
      const amountStats = this.calculateStatistics(amounts);

      data.transactions.forEach((transaction: any) => {
        const zScore = Math.abs((transaction.amount - amountStats.mean) / amountStats.stdDev);

        if (zScore > config.thresholds.statistical) {
          const severity = this.calculateSeverityFromZScore(zScore, config);
          const confidence = Math.min(0.95, zScore / config.thresholds.statistical * 0.8);

          anomalies.push({
            id: `stat_amount_${transaction.id}_${Date.now()}`,
            type: 'amount',
            category: 'financial',
            severity,
            confidence,
            description: `Transaction amount ${transaction.amount} deviates significantly from normal patterns`,
            details: {
              expectedValue: amountStats.mean,
              actualValue: transaction.amount,
              deviation: zScore,
            },
            location: {
              table: 'transactions',
              field: 'amount',
              recordId: transaction.id,
            },
            analysis: {
              statisticalSignificance: zScore,
              historicalComparison: `${zScore.toFixed(2)} standard deviations from mean`,
              businessImpact: this.assessBusinessImpact(transaction, 'amount'),
              falseProbability: Math.max(0.05, 1 - confidence),
            },
            recommendations: this.generateRecommendations('amount', severity, transaction),
            metadata: {
              algorithm: 'z_score_analysis',
              modelVersion: '1.0',
              processingTime: Date.now(),
              dataSource: 'transactions',
              relatedAnomalies: [],
            },
            status: 'new',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });

      // Analyze account balance anomalies
      const balances = data.accounts.map((a: any) => a.balance);
      const balanceStats = this.calculateStatistics(balances);

      data.accounts.forEach((account: any) => {
        const zScore = Math.abs((account.balance - balanceStats.mean) / balanceStats.stdDev);

        if (zScore > config.thresholds.statistical) {
          const severity = this.calculateSeverityFromZScore(zScore, config);
          const confidence = Math.min(0.95, zScore / config.thresholds.statistical * 0.8);

          anomalies.push({
            id: `stat_balance_${account.id}_${Date.now()}`,
            type: 'amount',
            category: 'financial',
            severity,
            confidence,
            description: `Account balance ${account.balance} is unusual compared to other accounts`,
            details: {
              expectedValue: balanceStats.mean,
              actualValue: account.balance,
              deviation: zScore,
            },
            location: {
              table: 'accounts',
              field: 'balance',
              recordId: account.id,
            },
            analysis: {
              statisticalSignificance: zScore,
              historicalComparison: `${zScore.toFixed(2)} standard deviations from mean`,
              businessImpact: this.assessBusinessImpact(account, 'balance'),
              falseProbability: Math.max(0.05, 1 - confidence),
            },
            recommendations: this.generateRecommendations('balance', severity, account),
            metadata: {
              algorithm: 'z_score_analysis',
              modelVersion: '1.0',
              processingTime: Date.now(),
              dataSource: 'accounts',
              relatedAnomalies: [],
            },
            status: 'new',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Statistical anomaly detection failed:', error);
    }

    return anomalies;
  }

  /**
   * Pattern-based anomaly detection using machine learning approaches
   */
  private async detectPatternAnomalies(
    data: any,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      // Analyze transaction frequency patterns
      const frequencyAnomalies = this.detectFrequencyAnomalies(data.transactions);
      anomalies.push(...frequencyAnomalies);

      // Analyze sequence patterns
      const sequenceAnomalies = this.detectSequenceAnomalies(data.transactions);
      anomalies.push(...sequenceAnomalies);

      // Analyze relationship patterns
      const relationshipAnomalies = this.detectRelationshipAnomalies(data);
      anomalies.push(...relationshipAnomalies);
    } catch (error) {
      console.error('Pattern anomaly detection failed:', error);
    }

    return anomalies;
  }

  /**
   * Behavioral anomaly detection for user activity patterns
   */
  private async detectBehavioralAnomalies(
    data: any,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      // Analyze user behavior patterns
      for (const user of data.users) {
        const userTransactions = data.transactions.filter((t: any) => t.userId === user.id);

        if (userTransactions.length > 0) {
          // Check for unusual activity times
          const timeAnomalies = this.detectUnusualActivityTimes(userTransactions, user);
          anomalies.push(...timeAnomalies);

          // Check for unusual transaction patterns
          const patternAnomalies = this.detectUnusualUserPatterns(userTransactions, user);
          anomalies.push(...patternAnomalies);
        }
      }
    } catch (error) {
      console.error('Behavioral anomaly detection failed:', error);
    }

    return anomalies;
  }

  /**
   * Time series anomaly detection for temporal patterns
   */
  private async detectTimeSeriesAnomalies(
    data: any,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      // Group transactions by time periods
      const timeSeries = this.createTimeSeries(data.transactions);

      // Detect seasonal anomalies
      const seasonalAnomalies = this.detectSeasonalAnomalies(timeSeries);
      anomalies.push(...seasonalAnomalies);

      // Detect trend anomalies
      const trendAnomalies = this.detectTrendAnomalies(timeSeries);
      anomalies.push(...trendAnomalies);
    } catch (error) {
      console.error('Time series anomaly detection failed:', error);
    }

    return anomalies;
  }

  /**
   * Benford's Law violation detection
   */
  private async detectBenfordLawViolations(
    data: any,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      const amounts = data.transactions
        .map((t: any) => Math.abs(t.amount))
        .filter((amount: number) => amount > 0);

      if (amounts.length < 100) {
        // Need sufficient data for Benford's Law analysis
        return anomalies;
      }

      const benfordAnalysis = this.analyzeBenfordLaw(amounts);

      if (benfordAnalysis.chiSquare > 15.507) {
        // Critical value for 8 degrees of freedom at p=0.05
        anomalies.push({
          id: `benford_violation_${Date.now()}`,
          type: 'pattern',
          category: 'financial',
          severity: 'high',
          confidence: 0.95,
          description: 'Transaction amounts show significant deviation from Benford\'s Law',
          details: {
            pattern: 'benford_law_violation',
            context: benfordAnalysis,
          },
          location: {
            table: 'transactions',
            field: 'amount',
          },
          analysis: {
            statisticalSignificance: benfordAnalysis.chiSquare,
            historicalComparison: 'Significant deviation from expected digit distribution',
            businessImpact: 'Potential indication of data manipulation or fraud',
            falseProbability: 0.05,
          },
          recommendations: [
            {
              action: 'Investigate transactions for potential manipulation',
              priority: 'urgent',
              effort: 'high',
              impact: 'high',
            },
            {
              action: 'Review data entry processes and controls',
              priority: 'normal',
              effort: 'medium',
              impact: 'medium',
            },
          ],
          metadata: {
            algorithm: 'benford_law_analysis',
            modelVersion: '1.0',
            processingTime: Date.now(),
            dataSource: 'transactions',
            relatedAnomalies: [],
          },
          status: 'new',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Benford Law analysis failed:', error);
    }

    return anomalies;
  }

  /**
   * AI-powered anomaly detection using language models
   */
  private async detectAIAnomalies(
    data: any,
    organizationId: string,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (!openaiClient.isReady()) {
      return anomalies;
    }

    try {
      // Prepare data summary for AI analysis
      const dataSummary = this.prepareDataSummaryForAI(data);

      const prompt = `Analyze this financial data for anomalies and unusual patterns:

${JSON.stringify(dataSummary, null, 2)}

Look for:
1. Unusual transaction patterns
2. Suspicious amount distributions
3. Irregular timing patterns
4. Unexpected account relationships
5. Compliance red flags
6. Potential fraud indicators

Return detailed analysis with confidence scores and specific recommendations.`;

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          anomalies: 'array of detected anomalies with type, severity, description, confidence, and recommendations',
        },
        {
          organizationId,
          temperature: 0.2,
          maxTokens: 2000,
        }
      );

      const aiAnomalies = response.data.anomalies || [];

      aiAnomalies.forEach((anomaly: any, index: number) => {
        anomalies.push({
          id: `ai_anomaly_${Date.now()}_${index}`,
          type: this.mapAIAnomalyType(anomaly.type),
          category: 'ai_detected',
          severity: anomaly.severity || 'medium',
          confidence: anomaly.confidence || 0.7,
          description: anomaly.description,
          details: {
            pattern: anomaly.pattern,
            context: anomaly.context,
          },
          location: {
            table: anomaly.table,
            field: anomaly.field,
          },
          analysis: {
            statisticalSignificance: 0,
            historicalComparison: anomaly.historicalComparison || '',
            businessImpact: anomaly.businessImpact || '',
            falseProbability: 1 - (anomaly.confidence || 0.7),
          },
          recommendations: (anomaly.recommendations || []).map((rec: any) => ({
            action: rec.action || rec,
            priority: rec.priority || 'normal',
            effort: rec.effort || 'medium',
            impact: rec.impact || 'medium',
          })),
          metadata: {
            algorithm: 'ai_analysis',
            modelVersion: 'gpt-4',
            processingTime: Date.now(),
            dataSource: 'comprehensive',
            relatedAnomalies: [],
          },
          status: 'new',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    } catch (error) {
      console.error('AI anomaly detection failed:', error);
    }

    return anomalies;
  }

  /**
   * Generate risk assessments based on detected anomalies
   */
  private async generateRiskAssessments(
    anomalies: Anomaly[],
    data: any,
    organizationId: string
  ): Promise<RiskAssessment[]> {
    const riskAssessments: RiskAssessment[] = [];

    if (!openaiClient.isReady()) {
      return riskAssessments;
    }

    try {
      // Group anomalies by risk type
      const riskGroups = this.groupAnomaliesByRiskType(anomalies);

      for (const [riskType, groupedAnomalies] of Object.entries(riskGroups)) {
        const riskData = this.prepareRiskAnalysisData(groupedAnomalies, data);

        const prompt = `Assess the risk level for ${riskType} based on these anomalies and financial data:

Anomalies: ${JSON.stringify(groupedAnomalies.map(a => ({ type: a.type, severity: a.severity, description: a.description })))}

Financial Context: ${JSON.stringify(riskData)}

Provide a comprehensive risk assessment including:
1. Overall risk level and probability
2. Potential impact analysis
3. Key risk indicators
4. Mitigation strategies
5. Monitoring recommendations`;

        const response = await openaiClient.createStructuredCompletion(
          prompt,
          {
            riskLevel: 'string (low/medium/high/critical)',
            probability: 'number (0-1)',
            impact: 'number (0-1)',
            description: 'string',
            triggers: 'array of risk triggers',
            indicators: 'array of risk indicators',
            mitigationStrategies: 'array of mitigation strategies',
            monitoringPlan: 'object with monitoring details',
          },
          {
            organizationId,
            temperature: 0.3,
          }
        );

        const assessment = response.data;

        riskAssessments.push({
          id: `risk_${riskType}_${Date.now()}`,
          riskType: riskType as RiskAssessment['riskType'],
          category: this.determineRiskCategory(riskType),
          riskLevel: assessment.riskLevel,
          probability: assessment.probability,
          impact: assessment.impact,
          riskScore: assessment.probability * assessment.impact,
          description: assessment.description,
          triggers: assessment.triggers || [],
          indicators: assessment.indicators || [],
          mitigationStrategies: assessment.mitigationStrategies || [],
          monitoringPlan: assessment.monitoringPlan || {
            frequency: 'weekly',
            metrics: [],
            alertThresholds: {},
            reportingSchedule: 'monthly',
          },
          historicalContext: {
            previousOccurrences: 0,
            averageImpact: 0,
            trends: [],
          },
          metadata: {
            model: 'ai_risk_assessment',
            confidence: 0.8,
            dataQuality: 0.9,
            lastAssessment: new Date(),
            nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Risk assessment generation failed:', error);
    }

    return riskAssessments;
  }

  /**
   * Analyze for potential fraud indicators
   */
  private async analyzeForFraud(
    anomalies: Anomaly[],
    data: any,
    organizationId: string
  ): Promise<FraudDetectionResult[]> {
    const fraudAlerts: FraudDetectionResult[] = [];

    if (!openaiClient.isReady()) {
      return fraudAlerts;
    }

    try {
      // Look for fraud patterns in anomalies
      const suspiciousAnomalies = anomalies.filter(
        a => a.severity === 'high' || a.severity === 'critical' || a.type === 'pattern'
      );

      if (suspiciousAnomalies.length === 0) {
        return fraudAlerts;
      }

      const fraudAnalysisData = this.prepareFraudAnalysisData(suspiciousAnomalies, data);

      const prompt = `Analyze these anomalies and financial data for potential fraud indicators:

Suspicious Anomalies: ${JSON.stringify(suspiciousAnomalies.map(a => ({
        type: a.type,
        severity: a.severity,
        description: a.description,
        details: a.details,
      })))}

Context: ${JSON.stringify(fraudAnalysisData)}

Assess:
1. Overall fraud probability
2. Specific fraud types that might be occurring
3. Evidence supporting fraud concerns
4. Recommended investigative actions
5. Urgency level for response`;

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          fraudProbability: 'number (0-1)',
          suspicionLevel: 'string (low/medium/high/critical)',
          fraudTypes: 'array of potential fraud types with probabilities',
          patterns: 'array of suspicious patterns identified',
          recommendations: 'array of recommended actions',
          evidenceTrail: 'array of evidence items',
        },
        {
          organizationId,
          temperature: 0.2,
        }
      );

      const analysis = response.data;

      if (analysis.fraudProbability > 0.3) {
        fraudAlerts.push({
          id: `fraud_alert_${Date.now()}`,
          suspicionLevel: analysis.suspicionLevel,
          fraudProbability: analysis.fraudProbability,
          fraudTypes: analysis.fraudTypes || [],
          patterns: analysis.patterns || [],
          recommendations: analysis.recommendations || [],
          evidenceTrail: analysis.evidenceTrail || [],
          status: 'flagged',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Fraud analysis failed:', error);
    }

    return fraudAlerts;
  }

  /**
   * Analyze for compliance violations
   */
  private async analyzeComplianceViolations(
    anomalies: Anomaly[],
    data: any,
    organizationId: string
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    try {
      // Check for compliance-related anomalies
      const complianceAnomalies = anomalies.filter(
        a => a.category === 'compliance' || a.description.toLowerCase().includes('compliance')
      );

      // Add specific compliance checks here
      // This would be expanded based on specific regulatory requirements

    } catch (error) {
      console.error('Compliance analysis failed:', error);
    }

    return violations;
  }

  // Helper methods for calculations and analysis
  private calculateStatistics(values: number[]): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  private calculateSeverityFromZScore(zScore: number, config: AnomalyDetectionConfig): Anomaly['severity'] {
    if (zScore > 4) return 'critical';
    if (zScore > 3) return 'high';
    if (zScore > 2.5) return 'medium';
    return 'low';
  }

  private assessBusinessImpact(item: any, field: string): string {
    // Assess the business impact of an anomaly
    return `Potential impact on ${field} requires investigation`;
  }

  private generateRecommendations(type: string, severity: string, item: any): Anomaly['recommendations'] {
    const recommendations: Anomaly['recommendations'] = [];

    if (severity === 'critical' || severity === 'high') {
      recommendations.push({
        action: 'Immediate investigation required',
        priority: 'immediate',
        effort: 'medium',
        impact: 'high',
      });
    }

    recommendations.push({
      action: `Review ${type} patterns and historical data`,
      priority: 'normal',
      effort: 'low',
      impact: 'medium',
    });

    return recommendations;
  }

  private detectFrequencyAnomalies(transactions: any[]): Anomaly[] {
    // Implement frequency anomaly detection
    return [];
  }

  private detectSequenceAnomalies(transactions: any[]): Anomaly[] {
    // Implement sequence anomaly detection
    return [];
  }

  private detectRelationshipAnomalies(data: any): Anomaly[] {
    // Implement relationship anomaly detection
    return [];
  }

  private detectUnusualActivityTimes(transactions: any[], user: any): Anomaly[] {
    // Implement unusual activity time detection
    return [];
  }

  private detectUnusualUserPatterns(transactions: any[], user: any): Anomaly[] {
    // Implement unusual user pattern detection
    return [];
  }

  private createTimeSeries(transactions: any[]): Record<string, number> {
    // Create time series from transactions
    return {};
  }

  private detectSeasonalAnomalies(timeSeries: Record<string, number>): Anomaly[] {
    // Implement seasonal anomaly detection
    return [];
  }

  private detectTrendAnomalies(timeSeries: Record<string, number>): Anomaly[] {
    // Implement trend anomaly detection
    return [];
  }

  private analyzeBenfordLaw(amounts: number[]): { chiSquare: number; distribution: number[] } {
    // Benford's Law expected frequencies for first digit
    const expectedFreq = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
    const observed = new Array(10).fill(0);

    // Count first digits
    amounts.forEach(amount => {
      const firstDigit = parseInt(amount.toString().charAt(0));
      if (firstDigit >= 1 && firstDigit <= 9) {
        observed[firstDigit]++;
      }
    });

    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 1; i <= 9; i++) {
      const expected = expectedFreq[i] * amounts.length;
      const diff = observed[i] - expected;
      chiSquare += (diff * diff) / expected;
    }

    return {
      chiSquare,
      distribution: observed.slice(1), // Remove index 0
    };
  }

  private prepareDataSummaryForAI(data: any): Record<string, any> {
    return {
      transactionSummary: {
        total: data.transactions.length,
        totalAmount: data.transactions.reduce((sum: number, t: any) => sum + t.amount, 0),
        avgAmount: data.transactions.reduce((sum: number, t: any) => sum + t.amount, 0) / data.transactions.length,
        categories: [...new Set(data.transactions.map((t: any) => t.category))],
      },
      accountSummary: {
        total: data.accounts.length,
        totalBalance: data.accounts.reduce((sum: number, a: any) => sum + a.balance, 0),
        accountTypes: [...new Set(data.accounts.map((a: any) => a.type))],
      },
      userSummary: {
        total: data.users.length,
        roles: [...new Set(data.users.map((u: any) => u.role))],
      },
    };
  }

  private mapAIAnomalyType(type: string): Anomaly['type'] {
    const typeMap: Record<string, Anomaly['type']> = {
      amount: 'amount',
      frequency: 'frequency',
      pattern: 'pattern',
      timing: 'timing',
      variance: 'variance',
      sequence: 'sequence',
      relationship: 'relationship',
    };

    return typeMap[type] || 'pattern';
  }

  private groupAnomaliesByRiskType(anomalies: Anomaly[]): Record<string, Anomaly[]> {
    const groups: Record<string, Anomaly[]> = {};

    anomalies.forEach(anomaly => {
      const riskType = this.determineRiskTypeFromAnomaly(anomaly);
      if (!groups[riskType]) {
        groups[riskType] = [];
      }
      groups[riskType].push(anomaly);
    });

    return groups;
  }

  private determineRiskTypeFromAnomaly(anomaly: Anomaly): string {
    if (anomaly.category === 'financial') return 'financial';
    if (anomaly.category === 'compliance') return 'compliance';
    if (anomaly.type === 'pattern' && anomaly.severity === 'high') return 'fraud';
    return 'operational';
  }

  private determineRiskCategory(riskType: string): string {
    return riskType;
  }

  private prepareRiskAnalysisData(anomalies: Anomaly[], data: any): Record<string, any> {
    return {
      anomalyCount: anomalies.length,
      severityDistribution: this.calculateSeverityDistribution(anomalies),
      affectedAreas: [...new Set(anomalies.map(a => a.location.table))],
      confidenceAverage: anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length,
    };
  }

  private prepareFraudAnalysisData(anomalies: Anomaly[], data: any): Record<string, any> {
    return {
      highSeverityCount: anomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length,
      patternAnomalies: anomalies.filter(a => a.type === 'pattern').length,
      amountAnomalies: anomalies.filter(a => a.type === 'amount').length,
      behavioralAnomalies: anomalies.filter(a => a.category === 'behavioral').length,
    };
  }

  private calculateSeverityDistribution(anomalies: Anomaly[]): Record<string, number> {
    const distribution: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    anomalies.forEach(a => distribution[a.severity]++);
    return distribution;
  }

  private deduplicateAnomalies(anomalies: Anomaly[]): Anomaly[] {
    // Implement deduplication logic
    const seen = new Set<string>();
    return anomalies.filter(anomaly => {
      const key = `${anomaly.type}_${anomaly.location.table}_${anomaly.location.field}_${anomaly.location.recordId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private rankAnomaliesBySeverity(anomalies: Anomaly[]): Anomaly[] {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return anomalies.sort((a, b) => {
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      return b.confidence - a.confidence;
    });
  }

  private generateSummary(
    anomalies: Anomaly[],
    riskAssessments: RiskAssessment[],
    fraudAlerts: FraudDetectionResult[]
  ): {
    totalAnomalies: number;
    criticalAnomalies: number;
    fraudProbability: number;
    overallRiskScore: number;
    recommendedActions: string[];
  } {
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
    const maxFraudProbability = fraudAlerts.length > 0
      ? Math.max(...fraudAlerts.map(f => f.fraudProbability))
      : 0;
    const avgRiskScore = riskAssessments.length > 0
      ? riskAssessments.reduce((sum, r) => sum + r.riskScore, 0) / riskAssessments.length
      : 0;

    const recommendedActions: string[] = [];
    if (criticalAnomalies > 0) {
      recommendedActions.push('Immediate investigation of critical anomalies required');
    }
    if (maxFraudProbability > 0.5) {
      recommendedActions.push('High fraud risk detected - initiate fraud investigation procedures');
    }
    if (avgRiskScore > 0.7) {
      recommendedActions.push('Implement additional risk mitigation measures');
    }

    return {
      totalAnomalies: anomalies.length,
      criticalAnomalies,
      fraudProbability: maxFraudProbability,
      overallRiskScore: avgRiskScore,
      recommendedActions,
    };
  }

  private async storeDetectionResults(
    results: {
      anomalies: Anomaly[];
      riskAssessments: RiskAssessment[];
      fraudAlerts: FraudDetectionResult[];
      complianceViolations: ComplianceViolation[];
    },
    organizationId: string
  ): Promise<void> {
    try {
      // Store anomalies
      await Promise.all(
        results.anomalies.map(anomaly =>
          db.anomaly.create({
            data: {
              id: anomaly.id,
              organizationId,
              type: anomaly.type,
              category: anomaly.category,
              severity: anomaly.severity,
              confidence: anomaly.confidence,
              description: anomaly.description,
              details: anomaly.details,
              location: anomaly.location,
              analysis: anomaly.analysis,
              recommendations: anomaly.recommendations,
              metadata: anomaly.metadata,
              status: anomaly.status,
              createdAt: anomaly.createdAt,
              updatedAt: anomaly.updatedAt,
            },
          })
        )
      );

      // Store risk assessments
      await Promise.all(
        results.riskAssessments.map(risk =>
          db.riskAssessment.create({
            data: {
              id: risk.id,
              organizationId,
              riskType: risk.riskType,
              category: risk.category,
              riskLevel: risk.riskLevel,
              probability: risk.probability,
              impact: risk.impact,
              riskScore: risk.riskScore,
              description: risk.description,
              triggers: risk.triggers,
              indicators: risk.indicators,
              mitigationStrategies: risk.mitigationStrategies,
              monitoringPlan: risk.monitoringPlan,
              historicalContext: risk.historicalContext,
              metadata: risk.metadata,
              status: risk.status,
              createdAt: risk.createdAt,
              updatedAt: risk.updatedAt,
            },
          })
        )
      );
    } catch (error) {
      console.error('Failed to store detection results:', error);
    }
  }

  private updateAnomalyHistory(organizationId: string, anomalies: Anomaly[]): void {
    const existingHistory = this.anomalyHistory.get(organizationId) || [];
    const updatedHistory = [...existingHistory, ...anomalies].slice(-1000); // Keep last 1000 anomalies
    this.anomalyHistory.set(organizationId, updatedHistory);
  }
}

// Export singleton instance
export const anomalyDetectionEngine = new AnomalyDetectionEngine();
export default anomalyDetectionEngine;