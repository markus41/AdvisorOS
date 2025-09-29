/**
 * Real-time Analytics Engine - Live Data Processing and Streaming Analytics
 * Provides real-time financial metrics, alerts, and dashboard updates
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import Redis from 'ioredis';
import Queue from 'bull';
import { Decimal } from 'decimal.js';
import {
  RealtimeMetric,
  RealtimeAlert,
  ThresholdConfig,
  FinancialData,
  AnalyticsEvent
} from '../types';

export class RealtimeEngine extends EventEmitter {
  private wsServer: WebSocket.Server | null = null;
  private redis: Redis | null = null;
  private processingQueue: Queue.Queue | null = null;
  private metricStreams: Map<string, MetricStream> = new Map();
  private activeConnections: Map<string, WebSocket> = new Map();
  private alertEngine: AlertEngine;
  private streamProcessor: StreamProcessor;

  constructor(private config: RealtimeConfig) {
    super();
    this.alertEngine = new AlertEngine();
    this.streamProcessor = new StreamProcessor();
  }

  async initialize(): Promise<void> {
    // Initialize Redis for real-time data storage
    this.redis = new Redis(this.config.redis);

    // Initialize processing queue
    this.processingQueue = new Queue('realtime analytics', this.config.redis);

    // Initialize WebSocket server for real-time updates
    this.wsServer = new WebSocket.Server({ port: this.config.wsPort });

    // Set up WebSocket connection handling
    this.setupWebSocketHandlers();

    // Set up metric stream processors
    await this.initializeMetricStreams();

    // Set up alert processing
    await this.alertEngine.initialize(this.redis);

    // Start processing queues
    this.setupQueueProcessors();

    console.log('Real-time Analytics Engine initialized');
  }

  /**
   * Start real-time metric streaming for an organization
   */
  async startMetricStream(
    organizationId: string,
    clientId?: string,
    metrics: string[] = ['all']
  ): Promise<void> {
    const streamId = `${organizationId}:${clientId || 'all'}`;

    if (this.metricStreams.has(streamId)) {
      return; // Stream already active
    }

    const stream = new MetricStream(streamId, organizationId, clientId, metrics);
    await stream.initialize(this.redis!);

    this.metricStreams.set(streamId, stream);

    // Start processing real-time data
    stream.on('metric', (metric: RealtimeMetric) => {
      this.processRealtimeMetric(metric);
    });

    stream.on('alert', (alert: RealtimeAlert) => {
      this.processAlert(alert);
    });

    stream.start();
  }

  /**
   * Stop metric streaming
   */
  async stopMetricStream(organizationId: string, clientId?: string): Promise<void> {
    const streamId = `${organizationId}:${clientId || 'all'}`;
    const stream = this.metricStreams.get(streamId);

    if (stream) {
      await stream.stop();
      this.metricStreams.delete(streamId);
    }
  }

  /**
   * Process incoming financial data in real-time
   */
  async processFinancialData(data: FinancialData): Promise<void> {
    const event: AnalyticsEvent = {
      type: 'financial_data_update',
      organizationId: data.organizationId,
      clientId: data.clientId,
      data: {
        amount: data.amount.toString(),
        category: data.category,
        type: data.type,
        source: data.source
      },
      timestamp: new Date(),
      source: 'realtime_engine'
    };

    // Add to processing queue
    await this.processingQueue?.add('process_financial_data', event);

    // Update real-time metrics immediately
    await this.updateRealtimeMetrics(data);

    // Check for anomalies
    await this.checkAnomalies(data);

    // Broadcast updates to connected clients
    this.broadcastUpdate(data.organizationId, data.clientId, {
      type: 'financial_update',
      data: event
    });
  }

  /**
   * Create real-time dashboard
   */
  async createRealtimeDashboard(
    organizationId: string,
    clientId?: string,
    metrics: string[] = []
  ): Promise<RealtimeDashboard> {
    const dashboardId = `dashboard_${organizationId}_${clientId || 'all'}_${Date.now()}`;

    const dashboard = new RealtimeDashboard(dashboardId, organizationId, clientId, metrics);
    await dashboard.initialize(this.redis!);

    // Subscribe to relevant metric streams
    await this.startMetricStream(organizationId, clientId, metrics);

    // Set up dashboard update handlers
    const streamId = `${organizationId}:${clientId || 'all'}`;
    const stream = this.metricStreams.get(streamId);

    if (stream) {
      stream.on('metric', (metric: RealtimeMetric) => {
        dashboard.updateMetric(metric);
      });
    }

    return dashboard;
  }

  /**
   * Set up threshold-based alerts
   */
  async createAlert(
    organizationId: string,
    clientId: string | undefined,
    metricName: string,
    threshold: ThresholdConfig,
    notification: NotificationConfig
  ): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alertConfig = {
      id: alertId,
      organizationId,
      clientId,
      metricName,
      threshold,
      notification,
      enabled: true,
      createdAt: new Date()
    };

    await this.alertEngine.createAlert(alertConfig);

    return alertId;
  }

  /**
   * Process real-time KPI calculations
   */
  async calculateRealtimeKPIs(
    organizationId: string,
    clientId?: string
  ): Promise<Record<string, RealtimeMetric>> {
    const kpis: Record<string, RealtimeMetric> = {};

    // Fetch current period data
    const currentData = await this.fetchCurrentPeriodData(organizationId, clientId);

    // Calculate key metrics
    const revenue = this.calculateRevenue(currentData);
    const expenses = this.calculateExpenses(currentData);
    const cashFlow = this.calculateCashFlow(currentData);
    const burnRate = await this.calculateBurnRate(organizationId, clientId);

    kpis.revenue = {
      id: `revenue_${Date.now()}`,
      name: 'revenue',
      value: revenue,
      timestamp: new Date(),
      tags: { organizationId, clientId: clientId || 'all' }
    };

    kpis.expenses = {
      id: `expenses_${Date.now()}`,
      name: 'expenses',
      value: expenses,
      timestamp: new Date(),
      tags: { organizationId, clientId: clientId || 'all' }
    };

    kpis.cashFlow = {
      id: `cash_flow_${Date.now()}`,
      name: 'cash_flow',
      value: cashFlow,
      timestamp: new Date(),
      tags: { organizationId, clientId: clientId || 'all' }
    };

    kpis.burnRate = {
      id: `burn_rate_${Date.now()}`,
      name: 'burn_rate',
      value: burnRate,
      timestamp: new Date(),
      tags: { organizationId, clientId: clientId || 'all' },
      threshold: {
        warning: 80,
        critical: 90,
        operator: 'gt'
      }
    };

    // Store metrics in Redis
    for (const [key, metric] of Object.entries(kpis)) {
      await this.storeMetric(metric);
    }

    return kpis;
  }

  /**
   * Monitor transaction patterns in real-time
   */
  async monitorTransactionPatterns(
    organizationId: string,
    clientId?: string
  ): Promise<void> {
    const patternMonitor = new TransactionPatternMonitor(organizationId, clientId);

    patternMonitor.on('anomaly', (anomaly) => {
      const alert: RealtimeAlert = {
        id: `anomaly_${Date.now()}`,
        type: 'anomaly',
        severity: 'warning',
        message: `Unusual transaction pattern detected: ${anomaly.description}`,
        affectedMetrics: [anomaly.metric],
        triggeredAt: new Date(),
        acknowledged: false
      };

      this.processAlert(alert);
    });

    patternMonitor.on('fraud_risk', (risk) => {
      const alert: RealtimeAlert = {
        id: `fraud_${Date.now()}`,
        type: 'anomaly',
        severity: 'critical',
        message: `Potential fraud detected: ${risk.description}`,
        affectedMetrics: [risk.metric],
        triggeredAt: new Date(),
        acknowledged: false
      };

      this.processAlert(alert);
    });

    await patternMonitor.start();
  }

  // Private methods

  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;

    this.wsServer.on('connection', (ws: WebSocket, request) => {
      const connectionId = this.generateConnectionId();
      this.activeConnections.set(connectionId, ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(connectionId, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.activeConnections.delete(connectionId);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        connectionId,
        timestamp: new Date()
      }));
    });
  }

  private async handleWebSocketMessage(connectionId: string, data: any): Promise<void> {
    const ws = this.activeConnections.get(connectionId);
    if (!ws) return;

    switch (data.type) {
      case 'subscribe_metrics':
        await this.subscribeToMetrics(connectionId, data.organizationId, data.clientId, data.metrics);
        break;

      case 'unsubscribe_metrics':
        await this.unsubscribeFromMetrics(connectionId);
        break;

      case 'get_current_metrics':
        const metrics = await this.getCurrentMetrics(data.organizationId, data.clientId);
        ws.send(JSON.stringify({
          type: 'current_metrics',
          data: metrics
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  private async subscribeToMetrics(
    connectionId: string,
    organizationId: string,
    clientId?: string,
    metrics: string[] = []
  ): Promise<void> {
    // Start metric stream if not already active
    await this.startMetricStream(organizationId, clientId, metrics);

    // Associate connection with stream
    const streamId = `${organizationId}:${clientId || 'all'}`;
    const stream = this.metricStreams.get(streamId);

    if (stream) {
      stream.addConnection(connectionId);
    }
  }

  private async unsubscribeFromMetrics(connectionId: string): Promise<void> {
    // Remove connection from all streams
    for (const stream of this.metricStreams.values()) {
      stream.removeConnection(connectionId);
    }
  }

  private async getCurrentMetrics(
    organizationId: string,
    clientId?: string
  ): Promise<Record<string, RealtimeMetric>> {
    const metricsKey = `metrics:${organizationId}:${clientId || 'all'}`;
    const metrics = await this.redis?.hgetall(metricsKey) || {};

    const result: Record<string, RealtimeMetric> = {};
    for (const [key, value] of Object.entries(metrics)) {
      try {
        result[key] = JSON.parse(value);
      } catch (error) {
        console.error(`Failed to parse metric ${key}:`, error);
      }
    }

    return result;
  }

  private async initializeMetricStreams(): Promise<void> {
    // Initialize common metric calculations
    this.setupMetricCalculators();
  }

  private setupMetricCalculators(): void {
    // Set up periodic metric calculations
    setInterval(async () => {
      for (const stream of this.metricStreams.values()) {
        await stream.calculateMetrics();
      }
    }, 5000); // Calculate every 5 seconds
  }

  private setupQueueProcessors(): void {
    if (!this.processingQueue) return;

    this.processingQueue.process('process_financial_data', async (job) => {
      const event: AnalyticsEvent = job.data;
      await this.streamProcessor.processFinancialEvent(event);
    });

    this.processingQueue.process('calculate_metrics', async (job) => {
      const { organizationId, clientId } = job.data;
      await this.calculateRealtimeKPIs(organizationId, clientId);
    });

    this.processingQueue.process('check_alerts', async (job) => {
      const { organizationId, clientId, metrics } = job.data;
      await this.alertEngine.checkThresholds(organizationId, clientId, metrics);
    });
  }

  private async processRealtimeMetric(metric: RealtimeMetric): Promise<void> {
    // Store metric
    await this.storeMetric(metric);

    // Check thresholds
    if (metric.threshold) {
      const violated = this.checkThreshold(metric);
      if (violated) {
        const alert: RealtimeAlert = {
          id: `threshold_${Date.now()}`,
          type: 'threshold',
          severity: violated.severity,
          message: `${metric.name} threshold ${violated.type}: ${metric.value}`,
          affectedMetrics: [metric.name],
          triggeredAt: new Date(),
          acknowledged: false
        };

        await this.processAlert(alert);
      }
    }

    // Broadcast to subscribers
    this.broadcastMetricUpdate(metric);
  }

  private async processAlert(alert: RealtimeAlert): Promise<void> {
    // Store alert
    await this.storeAlert(alert);

    // Send notifications
    await this.alertEngine.sendNotifications(alert);

    // Broadcast to connected clients
    this.broadcastAlert(alert);
  }

  private checkThreshold(metric: RealtimeMetric): { type: string; severity: 'warning' | 'critical' } | null {
    if (!metric.threshold) return null;

    const value = parseFloat(metric.value.toString());
    const { warning, critical, operator } = metric.threshold;

    switch (operator) {
      case 'gt':
        if (value > critical) return { type: 'critical', severity: 'critical' };
        if (value > warning) return { type: 'warning', severity: 'warning' };
        break;
      case 'lt':
        if (value < critical) return { type: 'critical', severity: 'critical' };
        if (value < warning) return { type: 'warning', severity: 'warning' };
        break;
      case 'eq':
        if (value === critical) return { type: 'critical', severity: 'critical' };
        if (value === warning) return { type: 'warning', severity: 'warning' };
        break;
    }

    return null;
  }

  private async storeMetric(metric: RealtimeMetric): Promise<void> {
    if (!this.redis) return;

    const key = `metrics:${metric.tags.organizationId}:${metric.tags.clientId}`;
    await this.redis.hset(key, metric.name, JSON.stringify(metric));
    await this.redis.expire(key, 3600); // Expire after 1 hour
  }

  private async storeAlert(alert: RealtimeAlert): Promise<void> {
    if (!this.redis) return;

    const key = `alerts:${Date.now()}`;
    await this.redis.set(key, JSON.stringify(alert));
    await this.redis.expire(key, 86400); // Expire after 24 hours
  }

  private broadcastMetricUpdate(metric: RealtimeMetric): void {
    const message = {
      type: 'metric_update',
      data: metric
    };

    this.broadcast(metric.tags.organizationId, metric.tags.clientId, message);
  }

  private broadcastAlert(alert: RealtimeAlert): void {
    const message = {
      type: 'alert',
      data: alert
    };

    // Broadcast to all connections (alerts are important)
    for (const ws of this.activeConnections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  private broadcastUpdate(
    organizationId: string,
    clientId: string | undefined,
    message: any
  ): void {
    this.broadcast(organizationId, clientId, message);
  }

  private broadcast(
    organizationId: string,
    clientId: string | undefined,
    message: any
  ): void {
    const targetClients = this.getTargetConnections(organizationId, clientId);

    for (const ws of targetClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  private getTargetConnections(
    organizationId: string,
    clientId: string | undefined
  ): WebSocket[] {
    // This would be implemented based on connection management
    return Array.from(this.activeConnections.values());
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility calculation methods
  private async updateRealtimeMetrics(data: FinancialData): Promise<void> {
    // Update relevant real-time metrics based on new financial data
  }

  private async checkAnomalies(data: FinancialData): Promise<void> {
    // Check for anomalies in the new data
  }

  private async fetchCurrentPeriodData(
    organizationId: string,
    clientId?: string
  ): Promise<FinancialData[]> {
    // Fetch current period financial data
    return [];
  }

  private calculateRevenue(data: FinancialData[]): Decimal {
    return data
      .filter(d => d.type === 'income')
      .reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
  }

  private calculateExpenses(data: FinancialData[]): Decimal {
    return data
      .filter(d => d.type === 'expense')
      .reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
  }

  private calculateCashFlow(data: FinancialData[]): Decimal {
    const revenue = this.calculateRevenue(data);
    const expenses = this.calculateExpenses(data);
    return revenue.minus(expenses);
  }

  private async calculateBurnRate(
    organizationId: string,
    clientId?: string
  ): Promise<Decimal> {
    // Calculate current burn rate
    return new Decimal(0);
  }

  async shutdown(): Promise<void> {
    // Stop all metric streams
    for (const stream of this.metricStreams.values()) {
      await stream.stop();
    }

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }

    // Close Redis connection
    if (this.redis) {
      this.redis.disconnect();
    }

    // Close processing queue
    if (this.processingQueue) {
      await this.processingQueue.close();
    }

    console.log('Real-time Analytics Engine shut down');
  }
}

// Supporting classes
class MetricStream extends EventEmitter {
  private connections: Set<string> = new Set();
  private isRunning = false;
  private redis: Redis | null = null;

  constructor(
    private streamId: string,
    private organizationId: string,
    private clientId: string | undefined,
    private metrics: string[]
  ) {
    super();
  }

  async initialize(redis: Redis): Promise<void> {
    this.redis = redis;
  }

  start(): void {
    this.isRunning = true;
    this.processStream();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  addConnection(connectionId: string): void {
    this.connections.add(connectionId);
  }

  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  async calculateMetrics(): Promise<void> {
    if (!this.isRunning) return;

    // Calculate and emit metrics
    // Implementation would calculate actual metrics
  }

  private async processStream(): Promise<void> {
    while (this.isRunning) {
      await this.calculateMetrics();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second interval
    }
  }
}

class AlertEngine {
  private redis: Redis | null = null;
  private alerts: Map<string, any> = new Map();

  async initialize(redis: Redis): Promise<void> {
    this.redis = redis;
  }

  async createAlert(config: any): Promise<void> {
    this.alerts.set(config.id, config);
  }

  async checkThresholds(
    organizationId: string,
    clientId: string | undefined,
    metrics: Record<string, RealtimeMetric>
  ): Promise<void> {
    // Check configured thresholds against current metrics
  }

  async sendNotifications(alert: RealtimeAlert): Promise<void> {
    // Send notifications (email, SMS, etc.)
  }
}

class StreamProcessor {
  async processFinancialEvent(event: AnalyticsEvent): Promise<void> {
    // Process financial events in real-time
  }
}

class RealtimeDashboard {
  private metrics: Map<string, RealtimeMetric> = new Map();

  constructor(
    private dashboardId: string,
    private organizationId: string,
    private clientId: string | undefined,
    private metricNames: string[]
  ) {}

  async initialize(redis: Redis): Promise<void> {
    // Initialize dashboard
  }

  updateMetric(metric: RealtimeMetric): void {
    this.metrics.set(metric.name, metric);
  }

  getMetrics(): RealtimeMetric[] {
    return Array.from(this.metrics.values());
  }
}

class TransactionPatternMonitor extends EventEmitter {
  constructor(
    private organizationId: string,
    private clientId: string | undefined
  ) {
    super();
  }

  async start(): Promise<void> {
    // Start monitoring transaction patterns
  }
}

// Configuration interfaces
interface RealtimeConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  wsPort: number;
  enableAlerts: boolean;
  alertThresholds: Record<string, ThresholdConfig>;
}

interface NotificationConfig {
  email?: string[];
  webhook?: string;
  sms?: string[];
}

export {
  MetricStream,
  AlertEngine,
  StreamProcessor,
  RealtimeDashboard,
  TransactionPatternMonitor
};

export type {
  RealtimeConfig,
  NotificationConfig
};