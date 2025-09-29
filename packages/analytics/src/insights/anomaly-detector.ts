/**
 * Anomaly Detector - Advanced anomaly detection for financial data
 * Implements multiple detection algorithms including statistical, ML-based, and rule-based approaches
 */

import { Decimal } from 'decimal.js';
import * as stats from 'simple-statistics';
import { addDays, differenceInDays, format, subDays } from 'date-fns';

export interface AnomalyDetectionConfig {
  algorithm: 'statistical' | 'isolation_forest' | 'rule_based' | 'ensemble';
  sensitivity: 'low' | 'medium' | 'high';
  lookbackDays: number;
  minDataPoints: number;
  thresholdMultiplier: number;
}

export interface DetectedAnomaly {
  id: string;
  type: 'revenue' | 'expense' | 'transaction' | 'pattern' | 'seasonal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  expectedValue: number;
  deviation: number;
  deviationPercent: number;
  confidence: number;
  timestamp: Date;
  description: string;
  context: AnomalyContext;
  recommendations: string[];
}

export interface AnomalyContext {
  dataSource: string;
  period: string;
  affectedMetrics: string[];
  relatedEvents: string[];
  historicalComparison: boolean;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseAnomalyDetector {
  protected config: AnomalyDetectionConfig;

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    this.config = {
      algorithm: 'statistical',
      sensitivity: 'medium',
      lookbackDays: 90,
      minDataPoints: 30,
      thresholdMultiplier: 2.5,
      ...config
    };
  }

  abstract detectAnomalies(data: TimeSeriesData[]): Promise<DetectedAnomaly[]>;

  protected calculateBaseline(data: TimeSeriesData[]): { mean: number; stdDev: number } {
    const values = data.map(d => d.value);
    return {
      mean: stats.mean(values),
      stdDev: stats.standardDeviation(values)
    };
  }

  protected calculateZScore(value: number, mean: number, stdDev: number): number {
    return stdDev > 0 ? (value - mean) / stdDev : 0;
  }

  protected determineAnomalySeverity(deviationPercent: number): 'low' | 'medium' | 'high' | 'critical' {
    const absDeviation = Math.abs(deviationPercent);

    if (absDeviation >= 100) return 'critical';
    if (absDeviation >= 50) return 'high';
    if (absDeviation >= 25) return 'medium';
    return 'low';
  }
}

export class StatisticalAnomalyDetector extends BaseAnomalyDetector {
  async detectAnomalies(data: TimeSeriesData[]): Promise<DetectedAnomaly[]> {
    if (data.length < this.config.minDataPoints) {
      return [];
    }

    const anomalies: DetectedAnomaly[] = [];
    const baseline = this.calculateBaseline(data);
    const threshold = baseline.stdDev * this.config.thresholdMultiplier;

    data.forEach((point, index) => {
      const zScore = this.calculateZScore(point.value, baseline.mean, baseline.stdDev);
      const deviation = point.value - baseline.mean;
      const deviationPercent = baseline.mean !== 0 ? (deviation / baseline.mean) * 100 : 0;

      if (Math.abs(zScore) > this.config.thresholdMultiplier) {
        const anomaly: DetectedAnomaly = {
          id: `stat_${Date.now()}_${index}`,
          type: this.categorizeAnomaly(point),
          severity: this.determineAnomalySeverity(deviationPercent),
          value: point.value,
          expectedValue: baseline.mean,
          deviation,
          deviationPercent,
          confidence: Math.min(Math.abs(zScore) / 5, 1),
          timestamp: point.timestamp,
          description: this.generateDescription(point, baseline, deviation),
          context: this.buildContext(point, data),
          recommendations: this.generateRecommendations(point, deviation)
        };

        anomalies.push(anomaly);
      }
    });

    return anomalies;
  }

  private categorizeAnomaly(point: TimeSeriesData): DetectedAnomaly['type'] {
    // Simple categorization based on metadata or default to 'pattern'
    if (point.metadata?.type) {
      return point.metadata.type;
    }
    return 'pattern';
  }

  private generateDescription(point: TimeSeriesData, baseline: any, deviation: number): string {
    const direction = deviation > 0 ? 'spike' : 'drop';
    const magnitude = Math.abs(deviation / baseline.mean * 100).toFixed(1);
    return `Unusual ${direction} detected: value ${point.value.toFixed(2)} deviates ${magnitude}% from expected ${baseline.mean.toFixed(2)}`;
  }

  private buildContext(point: TimeSeriesData, data: TimeSeriesData[]): AnomalyContext {
    return {
      dataSource: 'statistical_analysis',
      period: format(point.timestamp, 'yyyy-MM-dd'),
      affectedMetrics: ['value'],
      relatedEvents: [],
      historicalComparison: true
    };
  }

  private generateRecommendations(point: TimeSeriesData, deviation: number): string[] {
    const recommendations: string[] = [];

    if (deviation > 0) {
      recommendations.push('Investigate potential revenue opportunity or data error');
      recommendations.push('Verify transaction accuracy and completeness');
    } else {
      recommendations.push('Review for potential issues affecting performance');
      recommendations.push('Check for system outages or process disruptions');
    }

    recommendations.push('Monitor trend over next few days');

    return recommendations;
  }
}

export class MLAnomalyDetector extends BaseAnomalyDetector {
  async detectAnomalies(data: TimeSeriesData[]): Promise<DetectedAnomaly[]> {
    // Simplified ML-based detection using isolation principles
    if (data.length < this.config.minDataPoints) {
      return [];
    }

    const anomalies: DetectedAnomaly[] = [];
    const features = this.extractFeatures(data);
    const isolationScores = this.calculateIsolationScores(features);

    // Threshold based on sensitivity
    const thresholds = {
      low: 0.7,
      medium: 0.6,
      high: 0.5
    };

    const threshold = thresholds[this.config.sensitivity];

    isolationScores.forEach((score, index) => {
      if (score > threshold) {
        const point = data[index];
        const baseline = this.calculateBaseline(data);
        const deviation = point.value - baseline.mean;
        const deviationPercent = baseline.mean !== 0 ? (deviation / baseline.mean) * 100 : 0;

        const anomaly: DetectedAnomaly = {
          id: `ml_${Date.now()}_${index}`,
          type: 'pattern',
          severity: this.determineAnomalySeverity(deviationPercent),
          value: point.value,
          expectedValue: baseline.mean,
          deviation,
          deviationPercent,
          confidence: score,
          timestamp: point.timestamp,
          description: `ML algorithm detected anomalous pattern (isolation score: ${score.toFixed(2)})`,
          context: {
            dataSource: 'ml_isolation_forest',
            period: format(point.timestamp, 'yyyy-MM-dd'),
            affectedMetrics: ['isolation_score', 'value'],
            relatedEvents: [],
            historicalComparison: true
          },
          recommendations: [
            'Review data quality and collection process',
            'Investigate external factors affecting normal patterns',
            'Consider model retraining if pattern persists'
          ]
        };

        anomalies.push(anomaly);
      }
    });

    return anomalies;
  }

  private extractFeatures(data: TimeSeriesData[]): number[][] {
    return data.map((point, index) => {
      // Simple feature extraction
      const features: number[] = [
        point.value,
        index > 0 ? point.value - data[index - 1].value : 0, // Change from previous
        index >= 7 ? point.value - data[index - 7].value : 0, // Weekly change
        differenceInDays(point.timestamp, data[0].timestamp) // Days from start
      ];

      return features;
    });
  }

  private calculateIsolationScores(features: number[][]): number[] {
    // Simplified isolation forest implementation
    const scores: number[] = [];

    features.forEach((feature, index) => {
      let isolationScore = 0;
      let comparisons = 0;

      // Compare with other points
      features.forEach((otherFeature, otherIndex) => {
        if (index !== otherIndex) {
          const distance = this.euclideanDistance(feature, otherFeature);
          isolationScore += distance;
          comparisons++;
        }
      });

      // Normalize score
      scores.push(comparisons > 0 ? isolationScore / comparisons : 0);
    });

    // Normalize to 0-1 range
    const maxScore = Math.max(...scores);
    return scores.map(score => maxScore > 0 ? score / maxScore : 0);
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }
}

export class RuleBasedAnomalyDetector extends BaseAnomalyDetector {
  private rules: AnomalyRule[] = [];

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    super(config);
    this.initializeRules();
  }

  async detectAnomalies(data: TimeSeriesData[]): Promise<DetectedAnomaly[]> {
    const anomalies: DetectedAnomaly[] = [];

    data.forEach((point, index) => {
      this.rules.forEach(rule => {
        if (rule.condition(point, data, index)) {
          const anomaly = rule.createAnomaly(point, index);
          anomalies.push(anomaly);
        }
      });
    });

    return anomalies;
  }

  private initializeRules(): void {
    this.rules = [
      {
        id: 'sudden_spike',
        name: 'Sudden Value Spike',
        condition: (point, data, index) => {
          if (index === 0) return false;
          const previous = data[index - 1];
          const increase = point.value / previous.value;
          return increase > 3; // 300% increase
        },
        createAnomaly: (point, index) => ({
          id: `rule_spike_${Date.now()}_${index}`,
          type: 'revenue' as const,
          severity: 'high' as const,
          value: point.value,
          expectedValue: 0, // Will be calculated based on context
          deviation: 0,
          deviationPercent: 0,
          confidence: 0.9,
          timestamp: point.timestamp,
          description: 'Sudden spike detected: value increased dramatically from previous period',
          context: {
            dataSource: 'rule_based_detector',
            period: format(point.timestamp, 'yyyy-MM-dd'),
            affectedMetrics: ['value'],
            relatedEvents: ['sudden_increase'],
            historicalComparison: false
          },
          recommendations: [
            'Verify data accuracy and transaction legitimacy',
            'Check for one-time events or bulk transactions',
            'Review business activities for this period'
          ]
        })
      },
      {
        id: 'consecutive_zeros',
        name: 'Consecutive Zero Values',
        condition: (point, data, index) => {
          if (point.value !== 0) return false;

          // Check if previous 2 values are also zero
          const consecutiveZeros = data
            .slice(Math.max(0, index - 2), index + 1)
            .every(p => p.value === 0);

          return consecutiveZeros && index >= 2;
        },
        createAnomaly: (point, index) => ({
          id: `rule_zeros_${Date.now()}_${index}`,
          type: 'transaction' as const,
          severity: 'medium' as const,
          value: point.value,
          expectedValue: 0,
          deviation: 0,
          deviationPercent: 0,
          confidence: 0.85,
          timestamp: point.timestamp,
          description: 'Multiple consecutive zero values detected - possible system issue',
          context: {
            dataSource: 'rule_based_detector',
            period: format(point.timestamp, 'yyyy-MM-dd'),
            affectedMetrics: ['value'],
            relatedEvents: ['data_gap'],
            historicalComparison: false
          },
          recommendations: [
            'Check data collection systems for outages',
            'Verify business operations during this period',
            'Review data pipeline for processing issues'
          ]
        })
      }
    ];
  }
}

interface AnomalyRule {
  id: string;
  name: string;
  condition: (point: TimeSeriesData, data: TimeSeriesData[], index: number) => boolean;
  createAnomaly: (point: TimeSeriesData, index: number) => DetectedAnomaly;
}

export class AnomalyDetector {
  private detectors: Map<string, BaseAnomalyDetector> = new Map();

  constructor() {
    this.initializeDetectors();
  }

  private initializeDetectors(): void {
    this.detectors.set('statistical', new StatisticalAnomalyDetector());
    this.detectors.set('ml', new MLAnomalyDetector());
    this.detectors.set('rule_based', new RuleBasedAnomalyDetector());
  }

  async detectAnomalies(
    data: TimeSeriesData[],
    algorithms: string[] = ['statistical', 'rule_based']
  ): Promise<DetectedAnomaly[]> {
    const allAnomalies: DetectedAnomaly[] = [];

    for (const algorithm of algorithms) {
      const detector = this.detectors.get(algorithm);
      if (detector) {
        const anomalies = await detector.detectAnomalies(data);
        allAnomalies.push(...anomalies);
      }
    }

    // Remove duplicates and sort by severity
    return this.deduplicate(allAnomalies);
  }

  private deduplicate(anomalies: DetectedAnomaly[]): DetectedAnomaly[] {
    const uniqueAnomalies = new Map<string, DetectedAnomaly>();
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    anomalies.forEach(anomaly => {
      const key = `${format(anomaly.timestamp, 'yyyy-MM-dd')}_${anomaly.type}`;
      const existing = uniqueAnomalies.get(key);

      if (!existing || severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
        uniqueAnomalies.set(key, anomaly);
      }
    });

    return Array.from(uniqueAnomalies.values()).sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
    );
  }
}

export default AnomalyDetector;