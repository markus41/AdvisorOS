import { prisma } from '@/server/db';
import { createQuickBooksApiClient } from '@/lib/integrations/quickbooks/client';

// Enhanced Anomaly Detection Interfaces
interface AnomalyDetectionResult {
  anomalyId: string;
  clientId: string;
  detectionTimestamp: Date;
  anomalyType: 'statistical' | 'machine_learning' | 'rule_based' | 'behavioral';
  category: 'transaction' | 'revenue' | 'expense' | 'cash_flow' | 'compliance' | 'fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1 scale
  description: string;
  affectedData: {
    dataType: string;
    recordIds: string[];
    timeRange: {
      start: Date;
      end: Date;
    };
    values: {
      expected: number;
      actual: number;
      deviation: number;
    };
  };
  indicators: Array<{
    indicator: string;
    value: number;
    threshold: number;
    significance: number;
  }>;
  contextualFactors: {
    seasonality: boolean;
    businessEvents: string[];
    externalFactors: string[];
    historicalPattern: boolean;
  };
  fraudRiskScore: number;
  complianceImpact: string[];
  recommendedActions: Array<{
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    timeframe: string;
    assignedTo?: string;
  }>;
  investigationStatus: 'new' | 'investigating' | 'false_positive' | 'confirmed' | 'resolved';
  metadata: {
    detectionModel: string;
    modelVersion: string;
    dataSource: string;
    processingTime: number;
  };
}

interface FraudIndicator {
  type: 'duplicate_transactions' | 'round_dollar_amounts' | 'after_hours' | 'vendor_changes' | 'payment_anomalies';
  description: string;
  riskScore: number;
  evidence: string[];
  relatedTransactions: string[];
}

interface ComplianceAnomaly {
  regulation: string;
  violationType: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  potentialPenalty: number;
  remediationSteps: string[];
}

interface StatisticalAnomaly {
  method: 'z_score' | 'iqr' | 'isolation_forest' | 'lstm_autoencoder';
  statisticValue: number;
  threshold: number;
  pValue?: number;
  confidenceInterval?: [number, number];
}

interface BehavioralAnomaly {
  behaviorType: 'user_activity' | 'transaction_pattern' | 'approval_flow' | 'timing_pattern';
  baselinePattern: any;
  deviationMagnitude: number;
  userContext: {
    userId?: string;
    role?: string;
    accessLevel?: string;
    typicalBehavior?: any;
  };
}

export class EnhancedAnomalyDetectionService {
  private organizationId: string;
  private quickBooksClient: ReturnType<typeof createQuickBooksApiClient>;

  // Detection thresholds and parameters
  private readonly detectionConfig = {
    statistical: {
      zScoreThreshold: 3.0,
      iqrMultiplier: 1.5,
      isolationForestContamination: 0.1,
      minSampleSize: 30
    },
    fraud: {
      duplicateTransactionWindow: 86400000, // 24 hours in ms
      roundDollarThreshold: 0.8, // 80% round dollars to trigger
      afterHoursStart: 18, // 6 PM
      afterHoursEnd: 6, // 6 AM
      vendorChangeWindow: 604800000 // 7 days in ms
    },
    behavioral: {
      baselinePeriod: 90, // days
      deviationThreshold: 2.5, // standard deviations
      minActivityCount: 10
    }
  };

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.quickBooksClient = createQuickBooksApiClient(organizationId);
  }

  /**
   * Comprehensive multi-layer anomaly detection
   */
  async detectAnomalies(
    clientId?: string,
    options: {
      analysisWindow?: number; // days
      enableStatisticalDetection?: boolean;
      enableMLDetection?: boolean;
      enableRuleBasedDetection?: boolean;
      enableBehavioralDetection?: boolean;
      includeFraudAnalysis?: boolean;
      includeComplianceCheck?: boolean;
      realTimeMode?: boolean;
    } = {}
  ): Promise<AnomalyDetectionResult[]> {
    const {
      analysisWindow = 30,
      enableStatisticalDetection = true,
      enableMLDetection = true,
      enableRuleBasedDetection = true,
      enableBehavioralDetection = true,
      includeFraudAnalysis = true,
      includeComplianceCheck = true,
      realTimeMode = false
    } = options;

    try {
      const startTime = Date.now();
      const anomalies: AnomalyDetectionResult[] = [];

      // Fetch data for analysis
      const analysisData = await this.fetchAnalysisData(clientId, analysisWindow);

      // Layer 1: Statistical Anomaly Detection
      if (enableStatisticalDetection) {
        const statisticalAnomalies = await this.detectStatisticalAnomalies(analysisData);
        anomalies.push(...statisticalAnomalies);
      }

      // Layer 2: Machine Learning Anomaly Detection
      if (enableMLDetection) {
        const mlAnomalies = await this.detectMLAnomalies(analysisData);
        anomalies.push(...mlAnomalies);
      }

      // Layer 3: Rule-Based Detection
      if (enableRuleBasedDetection) {
        const ruleBasedAnomalies = await this.detectRuleBasedAnomalies(analysisData);
        anomalies.push(...ruleBasedAnomalies);
      }

      // Layer 4: Behavioral Analysis
      if (enableBehavioralDetection) {
        const behavioralAnomalies = await this.detectBehavioralAnomalies(analysisData);
        anomalies.push(...behavioralAnomalies);
      }

      // Enhanced Analysis Layers
      if (includeFraudAnalysis) {
        const fraudAnomalies = await this.detectFraudIndicators(analysisData);
        anomalies.push(...fraudAnomalies);
      }

      if (includeComplianceCheck) {
        const complianceAnomalies = await this.detectComplianceAnomalies(analysisData);
        anomalies.push(...complianceAnomalies);
      }

      // Apply contextual filtering and ranking
      const filteredAnomalies = await this.applyContextualFiltering(anomalies, analysisData);
      const rankedAnomalies = await this.rankAnomaliesByPriority(filteredAnomalies);

      // Store anomalies for historical tracking
      await this.storeAnomalies(rankedAnomalies);

      // Update metadata
      rankedAnomalies.forEach(anomaly => {
        anomaly.metadata.processingTime = Date.now() - startTime;
      });

      return rankedAnomalies;

    } catch (error) {
      console.error('Error in anomaly detection:', error);
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Statistical Anomaly Detection using multiple methods
   */
  private async detectStatisticalAnomalies(analysisData: any): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    try {
      // Z-Score Analysis for transaction amounts
      const transactionAnomalies = await this.detectZScoreAnomalies(analysisData.transactions);
      anomalies.push(...transactionAnomalies);

      // Interquartile Range Detection for revenue patterns
      const revenueAnomalies = await this.detectIQRAnomalies(analysisData.revenue);
      anomalies.push(...revenueAnomalies);

      // Seasonal Decomposition Anomalies
      const seasonalAnomalies = await this.detectSeasonalAnomalies(analysisData.timeSeries);
      anomalies.push(...seasonalAnomalies);

      // Time Series Outlier Detection
      const timeSeriesAnomalies = await this.detectTimeSeriesOutliers(analysisData.cashFlow);
      anomalies.push(...timeSeriesAnomalies);

    } catch (error) {
      console.error('Error in statistical anomaly detection:', error);
    }

    return anomalies;
  }

  private async detectZScoreAnomalies(transactions: any[]): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    if (transactions.length < this.detectionConfig.statistical.minSampleSize) {
      return anomalies;
    }

    // Calculate statistics for transaction amounts
    const amounts = transactions.map(t => t.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Identify outliers
    transactions.forEach(transaction => {
      if (stdDev > 0) {
        const zScore = Math.abs((transaction.amount - mean) / stdDev);

        if (zScore > this.detectionConfig.statistical.zScoreThreshold) {
          anomalies.push({
            anomalyId: `z_score_${transaction.id}_${Date.now()}`,
            clientId: transaction.clientId,
            detectionTimestamp: new Date(),
            anomalyType: 'statistical',
            category: 'transaction',
            severity: zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium',
            confidence: Math.min(0.99, zScore / 5),
            description: `Transaction amount significantly deviates from normal pattern (Z-score: ${zScore.toFixed(2)})`,
            affectedData: {
              dataType: 'transaction',
              recordIds: [transaction.id],
              timeRange: {
                start: new Date(transaction.date),
                end: new Date(transaction.date)
              },
              values: {
                expected: mean,
                actual: transaction.amount,
                deviation: zScore
              }
            },
            indicators: [{
              indicator: 'z_score',
              value: zScore,
              threshold: this.detectionConfig.statistical.zScoreThreshold,
              significance: zScore / this.detectionConfig.statistical.zScoreThreshold
            }],
            contextualFactors: {
              seasonality: false,
              businessEvents: [],
              externalFactors: [],
              historicalPattern: false
            },
            fraudRiskScore: this.calculateFraudRiskScore(transaction, zScore),
            complianceImpact: [],
            recommendedActions: [{
              action: 'Review transaction for accuracy and legitimacy',
              priority: zScore > 5 ? 'immediate' : 'high',
              timeframe: '24 hours'
            }],
            investigationStatus: 'new',
            metadata: {
              detectionModel: 'z_score_analysis',
              modelVersion: '1.0',
              dataSource: 'quickbooks',
              processingTime: 0
            }
          });
        }
      }
    });

    return anomalies;
  }

  private async detectIQRAnomalies(revenueData: any[]): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    if (revenueData.length < this.detectionConfig.statistical.minSampleSize) {
      return anomalies;
    }

    const values = revenueData.map(r => r.amount).sort((a, b) => a - b);
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - (this.detectionConfig.statistical.iqrMultiplier * iqr);
    const upperBound = q3 + (this.detectionConfig.statistical.iqrMultiplier * iqr);

    revenueData.forEach(revenue => {
      if (revenue.amount < lowerBound || revenue.amount > upperBound) {
        const deviation = revenue.amount > upperBound
          ? revenue.amount - upperBound
          : lowerBound - revenue.amount;

        anomalies.push({
          anomalyId: `iqr_${revenue.id}_${Date.now()}`,
          clientId: revenue.clientId,
          detectionTimestamp: new Date(),
          anomalyType: 'statistical',
          category: 'revenue',
          severity: deviation > iqr * 2 ? 'high' : 'medium',
          confidence: Math.min(0.95, deviation / (iqr * 2)),
          description: `Revenue amount outside normal IQR range`,
          affectedData: {
            dataType: 'revenue',
            recordIds: [revenue.id],
            timeRange: {
              start: new Date(revenue.period_start),
              end: new Date(revenue.period_end)
            },
            values: {
              expected: (q1 + q3) / 2,
              actual: revenue.amount,
              deviation: deviation / iqr
            }
          },
          indicators: [{
            indicator: 'iqr_deviation',
            value: deviation,
            threshold: iqr * this.detectionConfig.statistical.iqrMultiplier,
            significance: deviation / iqr
          }],
          contextualFactors: {
            seasonality: await this.checkSeasonality(revenue),
            businessEvents: [],
            externalFactors: [],
            historicalPattern: false
          },
          fraudRiskScore: 0.2, // Lower fraud risk for revenue anomalies
          complianceImpact: [],
          recommendedActions: [{
            action: 'Investigate revenue recognition timing and accuracy',
            priority: 'medium',
            timeframe: '72 hours'
          }],
          investigationStatus: 'new',
          metadata: {
            detectionModel: 'iqr_analysis',
            modelVersion: '1.0',
            dataSource: 'quickbooks',
            processingTime: 0
          }
        });
      }
    });

    return anomalies;
  }

  /**
   * Machine Learning Anomaly Detection
   */
  private async detectMLAnomalies(analysisData: any): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    try {
      // Isolation Forest for multivariate anomaly detection
      const isolationAnomalies = await this.applyIsolationForest(analysisData.transactions);
      anomalies.push(...isolationAnomalies);

      // LSTM Autoencoder for sequence anomalies
      const sequenceAnomalies = await this.applyLSTMAutoencoder(analysisData.timeSeries);
      anomalies.push(...sequenceAnomalies);

      // One-Class SVM for expense pattern anomalies
      const svmAnomalies = await this.applyOneClassSVM(analysisData.expenses);
      anomalies.push(...svmAnomalies);

    } catch (error) {
      console.error('Error in ML anomaly detection:', error);
    }

    return anomalies;
  }

  private async applyIsolationForest(transactions: any[]): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // Simplified isolation forest implementation
    // In production, this would use a proper ML library
    const features = transactions.map(t => [
      t.amount,
      new Date(t.date).getHours(),
      new Date(t.date).getDay(),
      t.vendor_id ? 1 : 0,
      t.description.length
    ]);

    // Calculate isolation scores (simplified)
    const isolationScores = features.map((feature, index) => {
      let score = 0;
      features.forEach((otherFeature, otherIndex) => {
        if (index !== otherIndex) {
          const distance = this.calculateEuclideanDistance(feature, otherFeature);
          score += distance;
        }
      });
      return score / (features.length - 1);
    });

    const threshold = this.calculatePercentile(isolationScores, 95);

    transactions.forEach((transaction, index) => {
      if (isolationScores[index] > threshold) {
        anomalies.push({
          anomalyId: `isolation_${transaction.id}_${Date.now()}`,
          clientId: transaction.clientId,
          detectionTimestamp: new Date(),
          anomalyType: 'machine_learning',
          category: 'transaction',
          severity: isolationScores[index] > threshold * 1.5 ? 'high' : 'medium',
          confidence: Math.min(0.95, isolationScores[index] / threshold),
          description: 'Transaction shows unusual patterns compared to normal behavior',
          affectedData: {
            dataType: 'transaction',
            recordIds: [transaction.id],
            timeRange: {
              start: new Date(transaction.date),
              end: new Date(transaction.date)
            },
            values: {
              expected: threshold,
              actual: isolationScores[index],
              deviation: isolationScores[index] / threshold
            }
          },
          indicators: [{
            indicator: 'isolation_score',
            value: isolationScores[index],
            threshold: threshold,
            significance: isolationScores[index] / threshold
          }],
          contextualFactors: {
            seasonality: false,
            businessEvents: [],
            externalFactors: [],
            historicalPattern: false
          },
          fraudRiskScore: this.calculateFraudRiskScore(transaction, isolationScores[index] / threshold),
          complianceImpact: [],
          recommendedActions: [{
            action: 'Investigate transaction for unusual patterns',
            priority: 'medium',
            timeframe: '48 hours'
          }],
          investigationStatus: 'new',
          metadata: {
            detectionModel: 'isolation_forest',
            modelVersion: '1.0',
            dataSource: 'quickbooks',
            processingTime: 0
          }
        });
      }
    });

    return anomalies;
  }

  /**
   * Fraud Detection Specific Methods
   */
  private async detectFraudIndicators(analysisData: any): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    try {
      // Duplicate transaction detection
      const duplicateAnomalies = await this.detectDuplicateTransactions(analysisData.transactions);
      anomalies.push(...duplicateAnomalies);

      // Round dollar amount detection
      const roundDollarAnomalies = await this.detectRoundDollarAmounts(analysisData.transactions);
      anomalies.push(...roundDollarAnomalies);

      // After-hours transaction detection
      const afterHoursAnomalies = await this.detectAfterHoursTransactions(analysisData.transactions);
      anomalies.push(...afterHoursAnomalies);

      // Vendor master file changes
      const vendorChangeAnomalies = await this.detectVendorChanges(analysisData.vendors);
      anomalies.push(...vendorChangeAnomalies);

    } catch (error) {
      console.error('Error in fraud detection:', error);
    }

    return anomalies;
  }

  private async detectDuplicateTransactions(transactions: any[]): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];
    const duplicateGroups = new Map<string, any[]>();

    // Group potential duplicates by amount, vendor, and date proximity
    transactions.forEach(transaction => {
      const key = `${transaction.amount}_${transaction.vendor_id}_${Math.floor(new Date(transaction.date).getTime() / this.detectionConfig.fraud.duplicateTransactionWindow)}`;

      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(transaction);
    });

    // Identify groups with duplicates
    duplicateGroups.forEach((group, key) => {
      if (group.length > 1) {
        // Further verification of duplicates
        const confirmedDuplicates = this.verifyDuplicates(group);

        if (confirmedDuplicates.length > 1) {
          anomalies.push({
            anomalyId: `duplicate_${key}_${Date.now()}`,
            clientId: confirmedDuplicates[0].clientId,
            detectionTimestamp: new Date(),
            anomalyType: 'rule_based',
            category: 'fraud',
            severity: 'high',
            confidence: 0.9,
            description: `${confirmedDuplicates.length} potential duplicate transactions detected`,
            affectedData: {
              dataType: 'transaction',
              recordIds: confirmedDuplicates.map(t => t.id),
              timeRange: {
                start: new Date(Math.min(...confirmedDuplicates.map(t => new Date(t.date).getTime()))),
                end: new Date(Math.max(...confirmedDuplicates.map(t => new Date(t.date).getTime())))
              },
              values: {
                expected: 1,
                actual: confirmedDuplicates.length,
                deviation: confirmedDuplicates.length - 1
              }
            },
            indicators: [{
              indicator: 'duplicate_count',
              value: confirmedDuplicates.length,
              threshold: 1,
              significance: confirmedDuplicates.length
            }],
            contextualFactors: {
              seasonality: false,
              businessEvents: [],
              externalFactors: [],
              historicalPattern: false
            },
            fraudRiskScore: 0.8,
            complianceImpact: ['Potential duplicate payment violation'],
            recommendedActions: [{
              action: 'Investigate and verify if transactions are legitimate duplicates',
              priority: 'immediate',
              timeframe: '24 hours'
            }],
            investigationStatus: 'new',
            metadata: {
              detectionModel: 'duplicate_detection',
              modelVersion: '1.0',
              dataSource: 'quickbooks',
              processingTime: 0
            }
          });
        }
      }
    });

    return anomalies;
  }

  private async detectRoundDollarAmounts(transactions: any[]): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    const roundDollarTransactions = transactions.filter(t => t.amount % 1 === 0 && t.amount > 100);
    const roundDollarPercentage = roundDollarTransactions.length / transactions.length;

    if (roundDollarPercentage > this.detectionConfig.fraud.roundDollarThreshold) {
      anomalies.push({
        anomalyId: `round_dollar_${Date.now()}`,
        clientId: transactions[0]?.clientId || '',
        detectionTimestamp: new Date(),
        anomalyType: 'rule_based',
        category: 'fraud',
        severity: 'medium',
        confidence: roundDollarPercentage,
        description: `Unusually high percentage of round dollar transactions (${(roundDollarPercentage * 100).toFixed(1)}%)`,
        affectedData: {
          dataType: 'transaction',
          recordIds: roundDollarTransactions.map(t => t.id),
          timeRange: {
            start: new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))),
            end: new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
          },
          values: {
            expected: 0.3, // 30% expected
            actual: roundDollarPercentage,
            deviation: roundDollarPercentage - 0.3
          }
        },
        indicators: [{
          indicator: 'round_dollar_percentage',
          value: roundDollarPercentage,
          threshold: this.detectionConfig.fraud.roundDollarThreshold,
          significance: roundDollarPercentage / this.detectionConfig.fraud.roundDollarThreshold
        }],
        contextualFactors: {
          seasonality: false,
          businessEvents: [],
          externalFactors: [],
          historicalPattern: false
        },
        fraudRiskScore: 0.6,
        complianceImpact: [],
        recommendedActions: [{
          action: 'Review round dollar transactions for legitimacy',
          priority: 'medium',
          timeframe: '72 hours'
        }],
        investigationStatus: 'new',
        metadata: {
          detectionModel: 'round_dollar_detection',
          modelVersion: '1.0',
          dataSource: 'quickbooks',
          processingTime: 0
        }
      });
    }

    return anomalies;
  }

  // Helper methods
  private calculateFraudRiskScore(transaction: any, anomalyScore: number): number {
    let riskScore = 0;

    // Base risk from anomaly score
    riskScore += Math.min(0.5, anomalyScore / 5);

    // Amount-based risk
    if (transaction.amount > 10000) riskScore += 0.2;
    if (transaction.amount > 50000) riskScore += 0.2;

    // Timing-based risk
    const hour = new Date(transaction.date).getHours();
    if (hour < 6 || hour > 18) riskScore += 0.1;

    // Description-based risk
    if (!transaction.description || transaction.description.length < 5) riskScore += 0.1;

    return Math.min(1, riskScore);
  }

  private verifyDuplicates(transactions: any[]): any[] {
    // Simple duplicate verification based on exact matches
    const verified = [];
    const seen = new Set();

    for (const transaction of transactions) {
      const signature = `${transaction.amount}_${transaction.vendor_id}_${transaction.description}`;
      if (seen.has(signature)) {
        verified.push(transaction);
      } else {
        seen.add(signature);
        verified.push(transaction);
      }
    }

    return verified.length > 1 ? verified : [];
  }

  private calculateEuclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.min(index, sorted.length - 1)];
  }

  // Placeholder implementations for complex methods
  private async fetchAnalysisData(clientId?: string, window?: number): Promise<any> {
    // Fetch comprehensive data from multiple sources
    return {
      transactions: [],
      revenue: [],
      expenses: [],
      cashFlow: [],
      timeSeries: [],
      vendors: []
    };
  }

  private async detectSeasonalAnomalies(timeSeries: any[]): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async detectTimeSeriesOutliers(cashFlow: any[]): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async applyLSTMAutoencoder(timeSeries: any[]): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async applyOneClassSVM(expenses: any[]): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async detectRuleBasedAnomalies(analysisData: any): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async detectBehavioralAnomalies(analysisData: any): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async detectComplianceAnomalies(analysisData: any): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async detectAfterHoursTransactions(transactions: any[]): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async detectVendorChanges(vendors: any[]): Promise<AnomalyDetectionResult[]> {
    return []; // Placeholder
  }

  private async checkSeasonality(revenue: any): Promise<boolean> {
    return false; // Placeholder
  }

  private async applyContextualFiltering(anomalies: AnomalyDetectionResult[], analysisData: any): Promise<AnomalyDetectionResult[]> {
    // Apply business rules and context to filter false positives
    return anomalies.filter(anomaly => anomaly.confidence > 0.3);
  }

  private async rankAnomaliesByPriority(anomalies: AnomalyDetectionResult[]): Promise<AnomalyDetectionResult[]> {
    return anomalies.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverityScore = severityWeight[a.severity] || 0;
      const bSeverityScore = severityWeight[b.severity] || 0;

      if (aSeverityScore !== bSeverityScore) {
        return bSeverityScore - aSeverityScore;
      }

      return b.confidence - a.confidence;
    });
  }

  private async storeAnomalies(anomalies: AnomalyDetectionResult[]): Promise<void> {
    try {
      await Promise.all(anomalies.map(anomaly =>
        prisma.anomalyDetection.create({
          data: {
            anomalyId: anomaly.anomalyId,
            clientId: anomaly.clientId,
            organizationId: this.organizationId,
            detectionTimestamp: anomaly.detectionTimestamp,
            anomalyType: anomaly.anomalyType,
            category: anomaly.category,
            severity: anomaly.severity,
            confidence: anomaly.confidence,
            description: anomaly.description,
            affectedData: anomaly.affectedData,
            indicators: anomaly.indicators,
            contextualFactors: anomaly.contextualFactors,
            fraudRiskScore: anomaly.fraudRiskScore,
            complianceImpact: anomaly.complianceImpact,
            recommendedActions: anomaly.recommendedActions,
            investigationStatus: anomaly.investigationStatus,
            metadata: anomaly.metadata
          }
        })
      ));
    } catch (error) {
      console.error('Failed to store anomalies:', error);
    }
  }
}

export function createEnhancedAnomalyDetectionService(organizationId: string): EnhancedAnomalyDetectionService {
  return new EnhancedAnomalyDetectionService(organizationId);
}