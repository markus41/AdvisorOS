/**
 * KPI Analyzer - Key Performance Indicators Analysis and Monitoring
 * Provides comprehensive KPI tracking, comparison, and alerting capabilities
 */

import { Decimal } from 'decimal.js';
import * as stats from 'simple-statistics';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface KPIDefinition {
  id: string;
  name: string;
  category: 'financial' | 'operational' | 'client' | 'growth';
  description: string;
  formula: string;
  target?: number;
  thresholds: {
    critical: number;
    warning: number;
    good: number;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dataSource: string;
  unit: string;
}

export interface KPIValue {
  kpiId: string;
  value: number;
  date: Date;
  period: string;
  variance?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  status: 'critical' | 'warning' | 'good' | 'unknown';
}

export interface KPIComparison {
  kpiId: string;
  current: number;
  previous: number;
  variance: number;
  variancePercent: number;
  trend: 'up' | 'down' | 'flat';
  significance: 'high' | 'medium' | 'low';
}

export interface KPIAlert {
  kpiId: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export class KPIAnalyzer {
  private kpiDefinitions: Map<string, KPIDefinition> = new Map();
  private kpiHistory: Map<string, KPIValue[]> = new Map();

  constructor() {
    this.initializeStandardKPIs();
  }

  /**
   * Initialize standard financial KPIs
   */
  private initializeStandardKPIs(): void {
    const standardKPIs: KPIDefinition[] = [
      {
        id: 'revenue_growth',
        name: 'Revenue Growth Rate',
        category: 'financial',
        description: 'Month-over-month revenue growth percentage',
        formula: '((Current Revenue - Previous Revenue) / Previous Revenue) * 100',
        target: 10,
        thresholds: { critical: -5, warning: 0, good: 10 },
        frequency: 'monthly',
        dataSource: 'financial_statements',
        unit: '%'
      },
      {
        id: 'client_retention',
        name: 'Client Retention Rate',
        category: 'client',
        description: 'Percentage of clients retained over the period',
        formula: '(Retained Clients / Total Clients at Start) * 100',
        target: 95,
        thresholds: { critical: 80, warning: 90, good: 95 },
        frequency: 'monthly',
        dataSource: 'client_database',
        unit: '%'
      },
      {
        id: 'avg_invoice_value',
        name: 'Average Invoice Value',
        category: 'financial',
        description: 'Average value of invoices generated',
        formula: 'Total Invoice Value / Number of Invoices',
        target: 5000,
        thresholds: { critical: 3000, warning: 4000, good: 5000 },
        frequency: 'monthly',
        dataSource: 'billing_system',
        unit: '$'
      },
      {
        id: 'task_completion_rate',
        name: 'Task Completion Rate',
        category: 'operational',
        description: 'Percentage of tasks completed on time',
        formula: '(Completed Tasks / Total Tasks) * 100',
        target: 90,
        thresholds: { critical: 70, warning: 80, good: 90 },
        frequency: 'weekly',
        dataSource: 'task_management',
        unit: '%'
      }
    ];

    standardKPIs.forEach(kpi => {
      this.kpiDefinitions.set(kpi.id, kpi);
    });
  }

  /**
   * Calculate KPI value based on raw data
   */
  calculateKPI(kpiId: string, data: any, period: Date = new Date()): KPIValue {
    const definition = this.kpiDefinitions.get(kpiId);
    if (!definition) {
      throw new Error(`KPI definition not found: ${kpiId}`);
    }

    let value: number;

    // Calculate based on KPI type
    switch (kpiId) {
      case 'revenue_growth':
        value = this.calculateRevenueGrowth(data);
        break;
      case 'client_retention':
        value = this.calculateClientRetention(data);
        break;
      case 'avg_invoice_value':
        value = this.calculateAverageInvoiceValue(data);
        break;
      case 'task_completion_rate':
        value = this.calculateTaskCompletionRate(data);
        break;
      default:
        throw new Error(`Unknown KPI calculation: ${kpiId}`);
    }

    // Determine status
    const status = this.determineKPIStatus(value, definition.thresholds);

    // Calculate trend if historical data exists
    const trend = this.calculateTrend(kpiId, value);

    const kpiValue: KPIValue = {
      kpiId,
      value,
      date: period,
      period: format(period, 'yyyy-MM'),
      status,
      trend
    };

    // Store in history
    this.addToHistory(kpiId, kpiValue);

    return kpiValue;
  }

  /**
   * Compare current KPI with previous period
   */
  compareKPI(kpiId: string, currentPeriod: Date, previousPeriod: Date): KPIComparison | null {
    const history = this.kpiHistory.get(kpiId) || [];

    const current = history.find(h =>
      format(h.date, 'yyyy-MM') === format(currentPeriod, 'yyyy-MM')
    );

    const previous = history.find(h =>
      format(h.date, 'yyyy-MM') === format(previousPeriod, 'yyyy-MM')
    );

    if (!current || !previous) {
      return null;
    }

    const variance = current.value - previous.value;
    const variancePercent = previous.value !== 0 ? (variance / previous.value) * 100 : 0;

    let trend: 'up' | 'down' | 'flat';
    if (Math.abs(variancePercent) < 2) {
      trend = 'flat';
    } else {
      trend = variance > 0 ? 'up' : 'down';
    }

    const significance = Math.abs(variancePercent) > 10 ? 'high' :
                       Math.abs(variancePercent) > 5 ? 'medium' : 'low';

    return {
      kpiId,
      current: current.value,
      previous: previous.value,
      variance,
      variancePercent,
      trend,
      significance
    };
  }

  /**
   * Generate KPI alerts based on thresholds
   */
  generateAlerts(kpiValues: KPIValue[]): KPIAlert[] {
    const alerts: KPIAlert[] = [];

    kpiValues.forEach(kpiValue => {
      const definition = this.kpiDefinitions.get(kpiValue.kpiId);
      if (!definition) return;

      if (kpiValue.status === 'critical' || kpiValue.status === 'warning') {
        const alert: KPIAlert = {
          kpiId: kpiValue.kpiId,
          severity: kpiValue.status,
          message: this.generateAlertMessage(kpiValue, definition),
          value: kpiValue.value,
          threshold: this.getRelevantThreshold(kpiValue.value, definition.thresholds),
          timestamp: new Date(),
          acknowledged: false
        };

        alerts.push(alert);
      }
    });

    return alerts;
  }

  /**
   * Get KPI definition
   */
  getKPIDefinition(kpiId: string): KPIDefinition | undefined {
    return this.kpiDefinitions.get(kpiId);
  }

  /**
   * Get KPI history
   */
  getKPIHistory(kpiId: string, limit?: number): KPIValue[] {
    const history = this.kpiHistory.get(kpiId) || [];
    return limit ? history.slice(-limit) : history;
  }

  // Private helper methods
  private calculateRevenueGrowth(data: any): number {
    const currentRevenue = data.currentRevenue || 0;
    const previousRevenue = data.previousRevenue || 0;

    if (previousRevenue === 0) return 0;

    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }

  private calculateClientRetention(data: any): number {
    const startClients = data.startClients || 0;
    const retainedClients = data.retainedClients || 0;

    if (startClients === 0) return 0;

    return (retainedClients / startClients) * 100;
  }

  private calculateAverageInvoiceValue(data: any): number {
    const totalValue = data.totalInvoiceValue || 0;
    const invoiceCount = data.invoiceCount || 0;

    if (invoiceCount === 0) return 0;

    return totalValue / invoiceCount;
  }

  private calculateTaskCompletionRate(data: any): number {
    const completedTasks = data.completedTasks || 0;
    const totalTasks = data.totalTasks || 0;

    if (totalTasks === 0) return 0;

    return (completedTasks / totalTasks) * 100;
  }

  private determineKPIStatus(value: number, thresholds: any): 'critical' | 'warning' | 'good' | 'unknown' {
    if (value <= thresholds.critical) return 'critical';
    if (value <= thresholds.warning) return 'warning';
    if (value >= thresholds.good) return 'good';
    return 'unknown';
  }

  private calculateTrend(kpiId: string, currentValue: number): 'increasing' | 'decreasing' | 'stable' {
    const history = this.kpiHistory.get(kpiId) || [];

    if (history.length < 2) return 'stable';

    const recentValues = history.slice(-3).map(h => h.value);
    const trend = stats.linearRegression(recentValues.map((v, i) => [i, v]));

    if (Math.abs(trend.m) < 0.1) return 'stable';
    return trend.m > 0 ? 'increasing' : 'decreasing';
  }

  private addToHistory(kpiId: string, kpiValue: KPIValue): void {
    if (!this.kpiHistory.has(kpiId)) {
      this.kpiHistory.set(kpiId, []);
    }

    const history = this.kpiHistory.get(kpiId)!;
    history.push(kpiValue);

    // Keep only last 24 months of history
    if (history.length > 24) {
      history.splice(0, history.length - 24);
    }
  }

  private generateAlertMessage(kpiValue: KPIValue, definition: KPIDefinition): string {
    const status = kpiValue.status === 'critical' ? 'critically low' : 'below target';
    return `${definition.name} is ${status} at ${kpiValue.value}${definition.unit}`;
  }

  private getRelevantThreshold(value: number, thresholds: any): number {
    if (value <= thresholds.critical) return thresholds.critical;
    if (value <= thresholds.warning) return thresholds.warning;
    return thresholds.good;
  }
}

export default KPIAnalyzer;