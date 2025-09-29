import { prisma } from '@/server/db';
import { createQuickBooksApiClient } from '@/lib/integrations/quickbooks/client';

// Anomaly detection types and interfaces
interface AnomalyScore {
  score: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface TransactionAnomaly {
  id: string;
  transactionId: string;
  clientId: string;
  anomalyType: 'amount' | 'frequency' | 'pattern' | 'timing' | 'category' | 'fraud';
  score: AnomalyScore;
  description: string;
  detectionMethod: string;
  suggestedActions: string[];
  metadata: Record<string, any>;
  detectedAt: Date;
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive';
}

interface ExpensePattern {
  category: string;
  averageAmount: number;
  frequency: number;
  variability: number;
  seasonality: number[];
  trends: {
    short_term: number;
    long_term: number;
  };
}

interface RevenueVariance {
  period: Date;
  actual: number;
  expected: number;
  variance: number;
  variancePercentage: number;
  significance: 'low' | 'medium' | 'high';
  potentialCauses: string[];
}

interface ClientBehaviorAnomaly {
  clientId: string;
  behaviorType: 'payment' | 'engagement' | 'usage' | 'communication';
  baseline: number;
  current: number;
  deviation: number;
  anomalyType: 'spike' | 'drop' | 'pattern_change' | 'irregular';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export class AnomalyDetectionService {
  private organizationId: string;
  private quickBooksClient: ReturnType<typeof createQuickBooksApiClient>;

  // Machine learning models for anomaly detection
  private isolationForestModels: Map<string, any> = new Map();
  private oneClassSVMModels: Map<string, any> = new Map();
  private autoencoderModels: Map<string, any> = new Map();

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.quickBooksClient = createQuickBooksApiClient(organizationId);
  }

  /**
   * Comprehensive Transaction Anomaly Detection
   */
  async detectTransactionAnomalies(
    clientId?: string,
    options: {
      includeHistoricalData?: boolean;
      timeWindow?: number; // days
      enableRealTimeDetection?: boolean;
      anomalyTypes?: string[];
      modelTypes?: ('isolation_forest' | 'one_class_svm' | 'autoencoder' | 'statistical')[];
    } = {}
  ): Promise<TransactionAnomaly[]> {
    const {
      includeHistoricalData = true,
      timeWindow = 90,
      enableRealTimeDetection = true,
      anomalyTypes = ['amount', 'frequency', 'pattern', 'timing', 'category', 'fraud'],
      modelTypes = ['isolation_forest', 'statistical']
    } = options;

    try {
      // Fetch transaction data
      const transactions = await this.fetchTransactionData(clientId, timeWindow);

      const anomalies: TransactionAnomaly[] = [];

      // Apply different detection methods
      for (const modelType of modelTypes) {
        const modelAnomalies = await this.applyAnomalyDetectionModel(
          transactions,
          modelType,
          anomalyTypes
        );
        anomalies.push(...modelAnomalies);
      }

      // Remove duplicates and rank by severity
      const uniqueAnomalies = this.deduplicateAndRankAnomalies(anomalies);

      // Apply business rules and filters
      const filteredAnomalies = await this.applyBusinessRulesFilter(uniqueAnomalies);

      // Store anomalies for further investigation
      await this.storeAnomalies(filteredAnomalies);

      // Send real-time alerts for critical anomalies
      if (enableRealTimeDetection) {
        await this.sendRealTimeAlerts(
          filteredAnomalies.filter(a => a.score.severity === 'critical')
        );
      }

      return filteredAnomalies;

    } catch (error) {
      console.error('Error in transaction anomaly detection:', error);
      throw new Error(`Transaction anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Expense Pattern Analysis for Cost Optimization
   */
  async analyzeExpensePatterns(
    clientId: string,
    options: {
      analysisDepth?: 'basic' | 'advanced' | 'comprehensive';
      includeSeasonality?: boolean;
      benchmarkComparison?: boolean;
      optimizationRecommendations?: boolean;
    } = {}
  ): Promise<{
    patterns: ExpensePattern[];
    anomalies: TransactionAnomaly[];
    optimizationOpportunities: Array<{
      category: string;
      potentialSavings: number;
      confidence: number;
      recommendations: string[];
    }>;
    benchmarkComparison?: {
      category: string;
      clientSpending: number;
      industryAverage: number;
      variance: number;
    }[];
  }> {
    try {
      // Fetch expense data
      const expenseData = await this.fetchExpenseData(clientId);

      // Analyze spending patterns
      const patterns = await this.identifyExpensePatterns(expenseData, options);

      // Detect expense anomalies
      const anomalies = await this.detectExpenseAnomalies(expenseData, patterns);

      // Identify optimization opportunities
      const optimizationOpportunities = await this.identifyOptimizationOpportunities(
        patterns,
        anomalies
      );

      // Benchmark against industry standards if requested
      let benchmarkComparison;
      if (options.benchmarkComparison) {
        benchmarkComparison = await this.performBenchmarkComparison(patterns, clientId);
      }

      return {
        patterns,
        anomalies,
        optimizationOpportunities,
        benchmarkComparison
      };

    } catch (error) {
      console.error('Error in expense pattern analysis:', error);
      throw new Error(`Expense pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * Revenue Variance Detection and Alerting
   */
  async detectRevenueVariances(
    options: {
      alertThreshold?: number; // percentage
      timeframe?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
      includeForecasting?: boolean;
      enableAlerts?: boolean;
    } = {}
  ): Promise<{
    variances: RevenueVariance[];
    alerts: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      actionRequired: boolean;
      recommendations: string[];
    }>;
    forecastAdjustments?: Array<{
      period: Date;
      originalForecast: number;
      adjustedForecast: number;
      adjustmentReason: string;
    }>;
  }> {
    const {
      alertThreshold = 15, // 15% variance threshold
      timeframe = 'monthly',
      includeForecasting = true,
      enableAlerts = true
    } = options;

    try {
      // Fetch revenue data and forecasts
      const [actualRevenue, forecastedRevenue] = await Promise.all([
        this.fetchActualRevenue(timeframe),
        this.fetchRevenueForecasts(timeframe)
      ]);

      // Calculate variances
      const variances = await this.calculateRevenueVariances(
        actualRevenue,
        forecastedRevenue,
        alertThreshold
      );

      // Generate alerts based on variances
      const alerts = await this.generateVarianceAlerts(variances, alertThreshold);

      // Adjust forecasts based on variances if requested
      let forecastAdjustments;
      if (includeForecasting) {
        forecastAdjustments = await this.adjustForecastsBasedOnVariances(variances);
      }

      // Send alerts if enabled
      if (enableAlerts && alerts.length > 0) {
        await this.sendVarianceAlerts(alerts);
      }

      return {
        variances,
        alerts,
        forecastAdjustments
      };

    } catch (error) {
      console.error('Error in revenue variance detection:', error);
      throw new Error(`Revenue variance detection failed: ${error.message}`);
    }
  }

  /**
   * Client Behavior Anomaly Detection
   */
  async detectClientBehaviorAnomalies(
    clientId?: string,
    options: {
      behaviorTypes?: string[];
      lookbackPeriod?: number; // days
      enablePredictiveAnalysis?: boolean;
    } = {}
  ): Promise<{
    anomalies: ClientBehaviorAnomaly[];
    predictiveInsights?: Array<{
      clientId: string;
      prediction: string;
      probability: number;
      timeframe: string;
      recommendedActions: string[];
    }>;
  }> {
    const {
      behaviorTypes = ['payment', 'engagement', 'usage', 'communication'],
      lookbackPeriod = 180,
      enablePredictiveAnalysis = true
    } = options;

    try {
      // Fetch client behavior data
      const behaviorData = await this.fetchClientBehaviorData(clientId, lookbackPeriod);

      const anomalies: ClientBehaviorAnomaly[] = [];

      // Analyze each behavior type
      for (const behaviorType of behaviorTypes) {
        const typeAnomalies = await this.analyzeBehaviorType(
          behaviorData,
          behaviorType as any
        );
        anomalies.push(...typeAnomalies);
      }

      // Generate predictive insights if requested
      let predictiveInsights;
      if (enablePredictiveAnalysis) {
        predictiveInsights = await this.generatePredictiveInsights(behaviorData, anomalies);
      }

      return {
        anomalies,
        predictiveInsights
      };

    } catch (error) {
      console.error('Error in client behavior anomaly detection:', error);
      throw new Error(`Client behavior anomaly detection failed: ${error.message}`);
    }
  }

  // Private helper methods

  private async fetchTransactionData(clientId?: string, timeWindow?: number): Promise<any[]> {
    const whereClause: any = {
      organizationId: this.organizationId
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (timeWindow) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
      whereClause.date = {
        gte: cutoffDate
      };
    }

    // Fetch from both local database and QuickBooks
    const [localTransactions, qbTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          client: true,
          category: true
        }
      }),
      clientId ? this.quickBooksClient.getTransactions(clientId, timeWindow) : []
    ]);

    return this.mergeTransactionData(localTransactions, qbTransactions);
  }

  private async applyAnomalyDetectionModel(
    transactions: any[],
    modelType: string,
    anomalyTypes: string[]
  ): Promise<TransactionAnomaly[]> {
    const anomalies: TransactionAnomaly[] = [];

    switch (modelType) {
      case 'isolation_forest':
        anomalies.push(...await this.applyIsolationForest(transactions, anomalyTypes));
        break;
      case 'one_class_svm':
        anomalies.push(...await this.applyOneClassSVM(transactions, anomalyTypes));
        break;
      case 'autoencoder':
        anomalies.push(...await this.applyAutoencoder(transactions, anomalyTypes));
        break;
      case 'statistical':
        anomalies.push(...await this.applyStatisticalMethods(transactions, anomalyTypes));
        break;
    }

    return anomalies;
  }

  private async applyIsolationForest(
    transactions: any[],
    anomalyTypes: string[]
  ): Promise<TransactionAnomaly[]> {
    const anomalies: TransactionAnomaly[] = [];

    // Prepare features for anomaly detection
    const features = this.extractTransactionFeatures(transactions);

    for (const anomalyType of anomalyTypes) {
      // Get or train model for this anomaly type
      const model = await this.getOrTrainIsolationForestModel(anomalyType, features);

      // Detect anomalies
      const scores = await this.scoreTransactions(model, features);

      // Convert scores to anomalies
      anomalies.push(...this.convertScoresToAnomalies(
        transactions,
        scores,
        anomalyType,
        'isolation_forest'
      ));
    }

    return anomalies;
  }

  private async applyStatisticalMethods(
    transactions: any[],
    anomalyTypes: string[]
  ): Promise<TransactionAnomaly[]> {
    const anomalies: TransactionAnomaly[] = [];

    for (const transaction of transactions) {
      for (const anomalyType of anomalyTypes) {
        const anomaly = await this.detectStatisticalAnomaly(transaction, anomalyType);
        if (anomaly) {
          anomalies.push(anomaly);
        }
      }
    }

    return anomalies;
  }

  private async detectStatisticalAnomaly(
    transaction: any,
    anomalyType: string
  ): Promise<TransactionAnomaly | null> {
    switch (anomalyType) {
      case 'amount':
        return this.detectAmountAnomaly(transaction);
      case 'frequency':
        return this.detectFrequencyAnomaly(transaction);
      case 'pattern':
        return this.detectPatternAnomaly(transaction);
      case 'timing':
        return this.detectTimingAnomaly(transaction);
      case 'category':
        return this.detectCategoryAnomaly(transaction);
      case 'fraud':
        return this.detectFraudAnomaly(transaction);
      default:
        return null;
    }
  }

  private async detectAmountAnomaly(transaction: any): Promise<TransactionAnomaly | null> {
    // Get historical statistics for similar transactions
    const stats = await this.getTransactionStatistics(
      transaction.clientId,
      transaction.category?.id,
      90 // 90 days lookback
    );

    if (!stats) return null;

    // Calculate Z-score
    const zScore = Math.abs((transaction.amount - stats.mean) / stats.standardDeviation);

    // Threshold for anomaly (typically 2.5 or 3 standard deviations)
    const threshold = 2.5;

    if (zScore > threshold) {
      return {
        id: `amount_anomaly_${transaction.id}_${Date.now()}`,
        transactionId: transaction.id,
        clientId: transaction.clientId,
        anomalyType: 'amount',
        score: {
          score: zScore,
          threshold,
          severity: this.calculateSeverity(zScore, threshold),
          confidence: Math.min(0.95, zScore / threshold * 0.8)
        },
        description: `Transaction amount $${transaction.amount} deviates significantly from typical range (mean: $${stats.mean.toFixed(2)}, std: $${stats.standardDeviation.toFixed(2)})`,
        detectionMethod: 'z_score_statistical',
        suggestedActions: [
          'Verify transaction accuracy',
          'Check for data entry errors',
          'Investigate unusual business activity'
        ],
        metadata: {
          zScore,
          historicalMean: stats.mean,
          historicalStd: stats.standardDeviation,
          transactionAmount: transaction.amount
        },
        detectedAt: new Date(),
        status: 'pending'
      };
    }

    return null;
  }

  private async detectFraudAnomaly(transaction: any): Promise<TransactionAnomaly | null> {
    // Implement fraud detection rules
    const fraudIndicators = [];

    // Check for round numbers (often indicates fraud)
    if (transaction.amount % 100 === 0 && transaction.amount >= 1000) {
      fraudIndicators.push('round_amount');
    }

    // Check for unusual timing (outside business hours)
    const hour = new Date(transaction.date).getHours();
    if (hour < 6 || hour > 22) {
      fraudIndicators.push('unusual_timing');
    }

    // Check for duplicate transactions
    const duplicates = await this.findDuplicateTransactions(transaction);
    if (duplicates.length > 0) {
      fraudIndicators.push('potential_duplicate');
    }

    // Check for velocity (many transactions in short time)
    const recentTransactions = await this.getRecentTransactions(transaction.clientId, 1); // 1 hour
    if (recentTransactions.length > 5) {
      fraudIndicators.push('high_velocity');
    }

    if (fraudIndicators.length >= 2) {
      return {
        id: `fraud_anomaly_${transaction.id}_${Date.now()}`,
        transactionId: transaction.id,
        clientId: transaction.clientId,
        anomalyType: 'fraud',
        score: {
          score: fraudIndicators.length / 4, // Normalized score
          threshold: 0.5,
          severity: fraudIndicators.length >= 3 ? 'critical' : 'high',
          confidence: 0.7 + (fraudIndicators.length * 0.1)
        },
        description: `Multiple fraud indicators detected: ${fraudIndicators.join(', ')}`,
        detectionMethod: 'rule_based_fraud',
        suggestedActions: [
          'Immediately flag for manual review',
          'Contact client to verify transaction',
          'Check for unauthorized access',
          'Review security logs'
        ],
        metadata: {
          fraudIndicators,
          riskFactors: fraudIndicators.length
        },
        detectedAt: new Date(),
        status: 'pending'
      };
    }

    return null;
  }

  private calculateSeverity(score: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = score / threshold;
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private deduplicateAndRankAnomalies(anomalies: TransactionAnomaly[]): TransactionAnomaly[] {
    // Remove duplicates and rank by severity and confidence
    const uniqueAnomalies = new Map<string, TransactionAnomaly>();

    for (const anomaly of anomalies) {
      const key = `${anomaly.transactionId}_${anomaly.anomalyType}`;
      const existing = uniqueAnomalies.get(key);

      if (!existing || anomaly.score.score > existing.score.score) {
        uniqueAnomalies.set(key, anomaly);
      }
    }

    return Array.from(uniqueAnomalies.values()).sort((a, b) => {
      // Sort by severity first, then by score
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const severityDiff = severityOrder[b.score.severity] - severityOrder[a.score.severity];

      if (severityDiff !== 0) return severityDiff;
      return b.score.score - a.score.score;
    });
  }

  private async applyBusinessRulesFilter(anomalies: TransactionAnomaly[]): Promise<TransactionAnomaly[]> {
    // Apply business-specific filters to reduce false positives
    const filteredAnomalies = [];

    for (const anomaly of anomalies) {
      // Skip anomalies for known recurring transactions
      if (await this.isKnownRecurringTransaction(anomaly.transactionId)) {
        continue;
      }

      // Skip anomalies below minimum threshold for client
      const clientThreshold = await this.getClientAnomalyThreshold(anomaly.clientId);
      if (anomaly.score.score < clientThreshold) {
        continue;
      }

      // Apply other business rules
      if (await this.passesBusinessRules(anomaly)) {
        filteredAnomalies.push(anomaly);
      }
    }

    return filteredAnomalies;
  }

  private async storeAnomalies(anomalies: TransactionAnomaly[]): Promise<void> {
    for (const anomaly of anomalies) {
      await prisma.transactionAnomaly.create({
        data: {
          id: anomaly.id,
          organizationId: this.organizationId,
          transactionId: anomaly.transactionId,
          clientId: anomaly.clientId,
          anomalyType: anomaly.anomalyType,
          score: anomaly.score.score,
          threshold: anomaly.score.threshold,
          severity: anomaly.score.severity,
          confidence: anomaly.score.confidence,
          description: anomaly.description,
          detectionMethod: anomaly.detectionMethod,
          suggestedActions: anomaly.suggestedActions,
          metadata: anomaly.metadata,
          status: anomaly.status
        }
      });
    }
  }

  private async sendRealTimeAlerts(criticalAnomalies: TransactionAnomaly[]): Promise<void> {
    for (const anomaly of criticalAnomalies) {
      // Send alerts via multiple channels
      await Promise.all([
        this.sendEmailAlert(anomaly),
        this.sendSlackAlert(anomaly),
        this.createInAppNotification(anomaly)
      ]);
    }
  }

  // Placeholder implementations for complex operations
  private extractTransactionFeatures(transactions: any[]): number[][] {
    return transactions.map(t => [
      t.amount,
      new Date(t.date).getHours(),
      new Date(t.date).getDay(),
      t.categoryId || 0
    ]);
  }

  private async getOrTrainIsolationForestModel(anomalyType: string, features: number[][]): Promise<any> {
    // In a real implementation, this would load or train an Isolation Forest model
    return { type: 'isolation_forest', anomalyType };
  }

  private async scoreTransactions(model: any, features: number[][]): Promise<number[]> {
    // In a real implementation, this would score transactions using the model
    return features.map(() => Math.random());
  }

  private convertScoresToAnomalies(
    transactions: any[],
    scores: number[],
    anomalyType: string,
    method: string
  ): TransactionAnomaly[] {
    const threshold = 0.7; // Example threshold
    return transactions
      .map((transaction, i) => ({
        score: scores[i],
        transaction
      }))
      .filter(({ score }) => score > threshold)
      .map(({ score, transaction }) => ({
        id: `${method}_${anomalyType}_${transaction.id}_${Date.now()}`,
        transactionId: transaction.id,
        clientId: transaction.clientId,
        anomalyType: anomalyType as any,
        score: {
          score,
          threshold,
          severity: this.calculateSeverity(score, threshold),
          confidence: 0.8
        },
        description: `${anomalyType} anomaly detected using ${method}`,
        detectionMethod: method,
        suggestedActions: ['Review transaction details', 'Verify with client'],
        metadata: { originalScore: score },
        detectedAt: new Date(),
        status: 'pending'
      }));
  }

  // Additional placeholder implementations
  private mergeTransactionData(local: any[], qb: any[]): any[] {
    return [...local, ...qb];
  }

  private async applyOneClassSVM(transactions: any[], anomalyTypes: string[]): Promise<TransactionAnomaly[]> {
    return [];
  }

  private async applyAutoencoder(transactions: any[], anomalyTypes: string[]): Promise<TransactionAnomaly[]> {
    return [];
  }

  private async detectFrequencyAnomaly(transaction: any): Promise<TransactionAnomaly | null> {
    return null;
  }

  private async detectPatternAnomaly(transaction: any): Promise<TransactionAnomaly | null> {
    return null;
  }

  private async detectTimingAnomaly(transaction: any): Promise<TransactionAnomaly | null> {
    return null;
  }

  private async detectCategoryAnomaly(transaction: any): Promise<TransactionAnomaly | null> {
    return null;
  }

  private async getTransactionStatistics(clientId: string, categoryId?: string, days?: number): Promise<{
    mean: number;
    standardDeviation: number;
    count: number;
  } | null> {
    // Calculate historical statistics
    return {
      mean: 1000,
      standardDeviation: 200,
      count: 50
    };
  }

  private async findDuplicateTransactions(transaction: any): Promise<any[]> {
    return [];
  }

  private async getRecentTransactions(clientId: string, hours: number): Promise<any[]> {
    return [];
  }

  private async isKnownRecurringTransaction(transactionId: string): Promise<boolean> {
    return false;
  }

  private async getClientAnomalyThreshold(clientId: string): Promise<number> {
    return 0.5;
  }

  private async passesBusinessRules(anomaly: TransactionAnomaly): Promise<boolean> {
    return true;
  }

  private async sendEmailAlert(anomaly: TransactionAnomaly): Promise<void> {
    // Send email alert
  }

  private async sendSlackAlert(anomaly: TransactionAnomaly): Promise<void> {
    // Send Slack alert
  }

  private async createInAppNotification(anomaly: TransactionAnomaly): Promise<void> {
    // Create in-app notification
  }

  private async fetchExpenseData(clientId: string): Promise<any[]> {
    return [];
  }

  private async identifyExpensePatterns(data: any[], options: any): Promise<ExpensePattern[]> {
    return [];
  }

  private async detectExpenseAnomalies(data: any[], patterns: ExpensePattern[]): Promise<TransactionAnomaly[]> {
    return [];
  }

  private async identifyOptimizationOpportunities(patterns: ExpensePattern[], anomalies: TransactionAnomaly[]): Promise<any[]> {
    return [];
  }

  private async performBenchmarkComparison(patterns: ExpensePattern[], clientId: string): Promise<any[]> {
    return [];
  }

  private async fetchActualRevenue(timeframe: string): Promise<any[]> {
    return [];
  }

  private async fetchRevenueForecasts(timeframe: string): Promise<any[]> {
    return [];
  }

  private async calculateRevenueVariances(actual: any[], forecasted: any[], threshold: number): Promise<RevenueVariance[]> {
    return [];
  }

  private async generateVarianceAlerts(variances: RevenueVariance[], threshold: number): Promise<any[]> {
    return [];
  }

  private async adjustForecastsBasedOnVariances(variances: RevenueVariance[]): Promise<any[]> {
    return [];
  }

  private async sendVarianceAlerts(alerts: any[]): Promise<void> {
    // Send variance alerts
  }

  private async fetchClientBehaviorData(clientId?: string, lookbackPeriod?: number): Promise<any[]> {
    return [];
  }

  private async analyzeBehaviorType(data: any[], behaviorType: string): Promise<ClientBehaviorAnomaly[]> {
    return [];
  }

  private async generatePredictiveInsights(data: any[], anomalies: ClientBehaviorAnomaly[]): Promise<any[]> {
    return [];
  }
}

export function createAnomalyDetectionService(organizationId: string): AnomalyDetectionService {
  return new AnomalyDetectionService(organizationId);
}