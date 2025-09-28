/**
 * Advanced Database Performance Monitoring System
 * Provides comprehensive monitoring, alerting, and performance analytics
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

export interface DatabaseMetrics {
  connectionPool: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingConnections: number;
    maxConnections: number;
    utilization: number;
  };
  queryPerformance: {
    averageQueryTime: number;
    slowQueryCount: number;
    queriesPerSecond: number;
    cacheHitRatio: number;
  };
  storage: {
    databaseSizeBytes: number;
    databaseSizeFormatted: string;
    indexSizeBytes: number;
    indexSizeFormatted: string;
    tableSizes: Array<{
      tableName: string;
      sizeBytes: number;
      sizeFormatted: string;
      rowCount: number;
    }>;
  };
  partitionMetrics: {
    partitionCount: number;
    partitionDistribution: Array<{
      partitionName: string;
      rowCount: number;
      sizeFormatted: string;
      utilization: number;
    }>;
  };
  performance: {
    indexUsage: Array<{
      tableName: string;
      indexName: string;
      scans: number;
      tupleReads: number;
      tupleFetches: number;
      efficiency: number;
    }>;
    tableScans: Array<{
      tableName: string;
      sequentialScans: number;
      sequentialTupleReads: number;
      indexScans: number;
      indexTupleFetches: number;
      scanRatio: number;
    }>;
  };
  trends: {
    queryTimesTrend: Array<{
      timestamp: Date;
      averageTime: number;
      peakTime: number;
    }>;
    connectionsTrend: Array<{
      timestamp: Date;
      activeConnections: number;
      totalConnections: number;
    }>;
  };
}

export interface AlertConfig {
  slowQueryThreshold: number; // milliseconds
  connectionUtilizationThreshold: number; // percentage
  diskUsageThreshold: number; // percentage
  cacheHitRatioThreshold: number; // percentage
  notificationChannels: {
    email?: string[];
    slack?: {
      webhookUrl: string;
      channel: string;
    };
    webhook?: string;
  };
}

export class DatabasePerformanceMonitor {
  private prisma: PrismaClient;
  private redis?: Redis;
  private alertConfig: AlertConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsHistory: Map<string, any[]> = new Map();

  constructor(
    prisma: PrismaClient,
    redis?: Redis,
    alertConfig?: Partial<AlertConfig>
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.alertConfig = {
      slowQueryThreshold: 1000, // 1 second
      connectionUtilizationThreshold: 80, // 80%
      diskUsageThreshold: 85, // 85%
      cacheHitRatioThreshold: 95, // 95%
      notificationChannels: {},
      ...alertConfig,
    };
  }

  /**
   * Start continuous monitoring with specified interval
   */
  startMonitoring(intervalMs: number = 60000): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        await this.storeMetrics(metrics);
        await this.checkAlerts(metrics);
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, intervalMs);

    console.log(`Database monitoring started with ${intervalMs}ms interval`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('Database monitoring stopped');
    }
  }

  /**
   * Collect comprehensive database metrics
   */
  async collectMetrics(): Promise<DatabaseMetrics> {
    const [
      connectionMetrics,
      queryMetrics,
      storageMetrics,
      partitionMetrics,
      performanceMetrics,
    ] = await Promise.all([
      this.getConnectionMetrics(),
      this.getQueryPerformanceMetrics(),
      this.getStorageMetrics(),
      this.getPartitionMetrics(),
      this.getPerformanceMetrics(),
    ]);

    // Get trending data
    const trends = await this.getTrendingData();

    return {
      connectionPool: connectionMetrics,
      queryPerformance: queryMetrics,
      storage: storageMetrics,
      partitionMetrics,
      performance: performanceMetrics,
      trends,
    };
  }

  /**
   * Get connection pool metrics
   */
  private async getConnectionMetrics() {
    const result = await this.prisma.$queryRaw<Array<{
      total_connections: number;
      active_connections: number;
      idle_connections: number;
      idle_in_transaction: number;
      max_connections: number;
    }>>`
      SELECT
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        current_setting('max_connections')::int as max_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    const metrics = result[0];
    return {
      totalConnections: metrics.total_connections,
      activeConnections: metrics.active_connections,
      idleConnections: metrics.idle_connections,
      waitingConnections: metrics.idle_in_transaction,
      maxConnections: metrics.max_connections,
      utilization: (metrics.total_connections / metrics.max_connections) * 100,
    };
  }

  /**
   * Get query performance metrics
   */
  private async getQueryPerformanceMetrics() {
    const [queryStats, cacheStats] = await Promise.all([
      // Query performance from pg_stat_statements
      this.prisma.$queryRaw<Array<{
        avg_time: number;
        slow_queries: number;
        total_calls: number;
        calls_per_sec: number;
      }>>`
        SELECT
          COALESCE(AVG(mean_time), 0) as avg_time,
          COUNT(*) FILTER (WHERE mean_time > ${this.alertConfig.slowQueryThreshold}) as slow_queries,
          SUM(calls) as total_calls,
          SUM(calls) / EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) as calls_per_sec
        FROM pg_stat_statements
        WHERE calls > 0
      `.catch(() => [{ avg_time: 0, slow_queries: 0, total_calls: 0, calls_per_sec: 0 }]),

      // Cache hit ratio
      this.prisma.$queryRaw<Array<{
        cache_hit_ratio: number;
      }>>`
        SELECT
          CASE
            WHEN (heap_blks_hit + heap_blks_read) = 0 THEN 100
            ELSE (heap_blks_hit::float / (heap_blks_hit + heap_blks_read) * 100)
          END as cache_hit_ratio
        FROM (
          SELECT
            SUM(heap_blks_hit) as heap_blks_hit,
            SUM(heap_blks_read) as heap_blks_read
          FROM pg_statio_user_tables
        ) as cache_stats
      `,
    ]);

    const query = queryStats[0] || { avg_time: 0, slow_queries: 0, total_calls: 0, calls_per_sec: 0 };
    const cache = cacheStats[0] || { cache_hit_ratio: 100 };

    return {
      averageQueryTime: query.avg_time,
      slowQueryCount: query.slow_queries,
      queriesPerSecond: query.calls_per_sec,
      cacheHitRatio: cache.cache_hit_ratio,
    };
  }

  /**
   * Get storage metrics
   */
  private async getStorageMetrics() {
    const [dbSize, tableSizes] = await Promise.all([
      // Database size
      this.prisma.$queryRaw<Array<{
        db_size_bytes: number;
        db_size_formatted: string;
        index_size_bytes: number;
        index_size_formatted: string;
      }>>`
        SELECT
          pg_database_size(current_database()) as db_size_bytes,
          pg_size_pretty(pg_database_size(current_database())) as db_size_formatted,
          SUM(pg_indexes_size(oid)) as index_size_bytes,
          pg_size_pretty(SUM(pg_indexes_size(oid))) as index_size_formatted
        FROM pg_class
        WHERE relkind = 'r'
      `,

      // Individual table sizes
      this.prisma.$queryRaw<Array<{
        table_name: string;
        size_bytes: number;
        size_formatted: string;
        row_count: number;
      }>>`
        SELECT
          schemaname || '.' || tablename as table_name,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_formatted,
          n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `,
    ]);

    const db = dbSize[0];
    return {
      databaseSizeBytes: db.db_size_bytes,
      databaseSizeFormatted: db.db_size_formatted,
      indexSizeBytes: db.index_size_bytes,
      indexSizeFormatted: db.index_size_formatted,
      tableSizes: tableSizes.map(t => ({
        tableName: t.table_name,
        sizeBytes: t.size_bytes,
        sizeFormatted: t.size_formatted,
        rowCount: t.row_count,
      })),
    };
  }

  /**
   * Get partition-specific metrics
   */
  private async getPartitionMetrics() {
    const partitions = await this.prisma.$queryRaw<Array<{
      partition_name: string;
      row_count: number;
      size_formatted: string;
      parent_table: string;
    }>>`
      SELECT
        schemaname || '.' || tablename as partition_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_formatted,
        (SELECT schemaname || '.' || tablename
         FROM pg_inherits i
         JOIN pg_class c ON i.inhparent = c.oid
         JOIN pg_namespace n ON c.relnamespace = n.oid
         WHERE i.inhrelid = (schemaname||'.'||tablename)::regclass
         LIMIT 1) as parent_table
      FROM pg_stat_user_tables
      WHERE tablename LIKE '%_part_%'
      ORDER BY n_live_tup DESC
    `;

    const totalRows = partitions.reduce((sum, p) => sum + p.row_count, 0);

    return {
      partitionCount: partitions.length,
      partitionDistribution: partitions.map(p => ({
        partitionName: p.partition_name,
        rowCount: p.row_count,
        sizeFormatted: p.size_formatted,
        utilization: totalRows > 0 ? (p.row_count / totalRows) * 100 : 0,
      })),
    };
  }

  /**
   * Get detailed performance metrics
   */
  private async getPerformanceMetrics() {
    const [indexUsage, tableScans] = await Promise.all([
      // Index usage efficiency
      this.prisma.$queryRaw<Array<{
        table_name: string;
        index_name: string;
        scans: number;
        tuple_reads: number;
        tuple_fetches: number;
      }>>`
        SELECT
          schemaname || '.' || tablename as table_name,
          indexname as index_name,
          idx_scan as scans,
          idx_tup_read as tuple_reads,
          idx_tup_fetch as tuple_fetches
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 30
      `,

      // Table scan analysis
      this.prisma.$queryRaw<Array<{
        table_name: string;
        seq_scans: number;
        seq_tuple_reads: number;
        idx_scans: number;
        idx_tuple_fetches: number;
      }>>`
        SELECT
          schemaname || '.' || tablename as table_name,
          seq_scan as seq_scans,
          seq_tup_read as seq_tuple_reads,
          idx_scan as idx_scans,
          idx_tup_fetch as idx_tuple_fetches
        FROM pg_stat_user_tables
        WHERE seq_scan > 0 OR idx_scan > 0
        ORDER BY (seq_scan + idx_scan) DESC
        LIMIT 20
      `,
    ]);

    return {
      indexUsage: indexUsage.map(i => ({
        tableName: i.table_name,
        indexName: i.index_name,
        scans: i.scans,
        tupleReads: i.tuple_reads,
        tupleFetches: i.tuple_fetches,
        efficiency: i.tuple_reads > 0 ? (i.tuple_fetches / i.tuple_reads) * 100 : 100,
      })),
      tableScans: tableScans.map(t => ({
        tableName: t.table_name,
        sequentialScans: t.seq_scans,
        sequentialTupleReads: t.seq_tuple_reads,
        indexScans: t.idx_scans,
        indexTupleFetches: t.idx_tuple_fetches,
        scanRatio: (t.seq_scans + t.idx_scans) > 0
          ? (t.idx_scans / (t.seq_scans + t.idx_scans)) * 100
          : 0,
      })),
    };
  }

  /**
   * Get trending data from stored metrics
   */
  private async getTrendingData() {
    // This would typically come from stored historical data
    // For now, return current data as trend
    const now = new Date();
    const connectionMetrics = await this.getConnectionMetrics();
    const queryMetrics = await this.getQueryPerformanceMetrics();

    return {
      queryTimesTrend: [{
        timestamp: now,
        averageTime: queryMetrics.averageQueryTime,
        peakTime: queryMetrics.averageQueryTime * 2, // Estimated
      }],
      connectionsTrend: [{
        timestamp: now,
        activeConnections: connectionMetrics.activeConnections,
        totalConnections: connectionMetrics.totalConnections,
      }],
    };
  }

  /**
   * Store metrics in Redis for historical analysis
   */
  private async storeMetrics(metrics: DatabaseMetrics): Promise<void> {
    if (!this.redis) return;

    const timestamp = Date.now();
    const key = `db_metrics:${timestamp}`;

    try {
      // Store current metrics
      await this.redis.setex(key, 3600, JSON.stringify(metrics)); // 1 hour TTL

      // Store specific metrics for trending
      await Promise.all([
        this.redis.zadd('db_metrics:query_times', timestamp, metrics.queryPerformance.averageQueryTime),
        this.redis.zadd('db_metrics:connections', timestamp, metrics.connectionPool.activeConnections),
        this.redis.zadd('db_metrics:cache_hit_ratio', timestamp, metrics.queryPerformance.cacheHitRatio),
        this.redis.zadd('db_metrics:slow_queries', timestamp, metrics.queryPerformance.slowQueryCount),
      ]);

      // Clean up old metrics (keep last 24 hours)
      const oneDayAgo = timestamp - (24 * 60 * 60 * 1000);
      await Promise.all([
        this.redis.zremrangebyscore('db_metrics:query_times', 0, oneDayAgo),
        this.redis.zremrangebyscore('db_metrics:connections', 0, oneDayAgo),
        this.redis.zremrangebyscore('db_metrics:cache_hit_ratio', 0, oneDayAgo),
        this.redis.zremrangebyscore('db_metrics:slow_queries', 0, oneDayAgo),
      ]);
    } catch (error) {
      console.error('Failed to store metrics in Redis:', error);
    }
  }

  /**
   * Check metrics against alert thresholds
   */
  private async checkAlerts(metrics: DatabaseMetrics): Promise<void> {
    const alerts: Array<{
      type: string;
      severity: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }> = [];

    // Check connection utilization
    if (metrics.connectionPool.utilization > this.alertConfig.connectionUtilizationThreshold) {
      alerts.push({
        type: 'connection_utilization',
        severity: metrics.connectionPool.utilization > 90 ? 'critical' : 'warning',
        message: `High connection pool utilization: ${metrics.connectionPool.utilization.toFixed(1)}%`,
        value: metrics.connectionPool.utilization,
        threshold: this.alertConfig.connectionUtilizationThreshold,
      });
    }

    // Check slow queries
    if (metrics.queryPerformance.slowQueryCount > 10) {
      alerts.push({
        type: 'slow_queries',
        severity: metrics.queryPerformance.slowQueryCount > 50 ? 'critical' : 'warning',
        message: `High number of slow queries: ${metrics.queryPerformance.slowQueryCount}`,
        value: metrics.queryPerformance.slowQueryCount,
        threshold: 10,
      });
    }

    // Check cache hit ratio
    if (metrics.queryPerformance.cacheHitRatio < this.alertConfig.cacheHitRatioThreshold) {
      alerts.push({
        type: 'cache_hit_ratio',
        severity: metrics.queryPerformance.cacheHitRatio < 90 ? 'critical' : 'warning',
        message: `Low cache hit ratio: ${metrics.queryPerformance.cacheHitRatio.toFixed(1)}%`,
        value: metrics.queryPerformance.cacheHitRatio,
        threshold: this.alertConfig.cacheHitRatioThreshold,
      });
    }

    // Check average query time
    if (metrics.queryPerformance.averageQueryTime > this.alertConfig.slowQueryThreshold) {
      alerts.push({
        type: 'average_query_time',
        severity: metrics.queryPerformance.averageQueryTime > 5000 ? 'critical' : 'warning',
        message: `High average query time: ${metrics.queryPerformance.averageQueryTime.toFixed(0)}ms`,
        value: metrics.queryPerformance.averageQueryTime,
        threshold: this.alertConfig.slowQueryThreshold,
      });
    }

    // Send alerts if any exist
    if (alerts.length > 0) {
      await this.sendAlerts(alerts, metrics);
    }
  }

  /**
   * Send alerts to configured channels
   */
  private async sendAlerts(
    alerts: Array<{
      type: string;
      severity: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }>,
    metrics: DatabaseMetrics
  ): Promise<void> {
    const alertSummary = {
      timestamp: new Date().toISOString(),
      alertCount: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      warningCount: alerts.filter(a => a.severity === 'warning').length,
      alerts,
      currentMetrics: {
        connections: metrics.connectionPool.utilization,
        averageQueryTime: metrics.queryPerformance.averageQueryTime,
        cacheHitRatio: metrics.queryPerformance.cacheHitRatio,
        slowQueries: metrics.queryPerformance.slowQueryCount,
      },
    };

    // Log to database audit log
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'database_alert',
          entityType: 'database',
          organizationId: 'system',
          metadata: alertSummary,
        },
      });
    } catch (error) {
      console.error('Failed to log alert to database:', error);
    }

    // Send to Slack if configured
    if (this.alertConfig.notificationChannels.slack) {
      await this.sendSlackAlert(alertSummary);
    }

    // Send to webhook if configured
    if (this.alertConfig.notificationChannels.webhook) {
      await this.sendWebhookAlert(alertSummary);
    }

    console.log('Database alerts triggered:', alertSummary);
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(alertSummary: any): Promise<void> {
    if (!this.alertConfig.notificationChannels.slack) return;

    const { webhookUrl } = this.alertConfig.notificationChannels.slack;
    const color = alertSummary.criticalCount > 0 ? 'danger' : 'warning';

    const payload = {
      channel: this.alertConfig.notificationChannels.slack.channel,
      username: 'Database Monitor',
      icon_emoji: ':warning:',
      attachments: [{
        color,
        title: `Database Performance Alert - ${alertSummary.criticalCount} Critical, ${alertSummary.warningCount} Warning`,
        fields: alertSummary.alerts.map((alert: any) => ({
          title: alert.type.replace(/_/g, ' ').toUpperCase(),
          value: `${alert.message}\nThreshold: ${alert.threshold}`,
          short: true,
        })),
        footer: 'AdvisorOS Database Monitor',
        ts: Math.floor(Date.now() / 1000),
      }],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send alert to webhook
   */
  private async sendWebhookAlert(alertSummary: any): Promise<void> {
    if (!this.alertConfig.notificationChannels.webhook) return;

    try {
      const response = await fetch(this.alertConfig.notificationChannels.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertSummary),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(timeRange: { from: Date; to: Date }) {
    const metrics = await this.collectMetrics();

    // Get historical data if available
    let historicalData = null;
    if (this.redis) {
      const fromTs = timeRange.from.getTime();
      const toTs = timeRange.to.getTime();

      historicalData = await Promise.all([
        this.redis.zrangebyscore('db_metrics:query_times', fromTs, toTs, 'WITHSCORES'),
        this.redis.zrangebyscore('db_metrics:connections', fromTs, toTs, 'WITHSCORES'),
        this.redis.zrangebyscore('db_metrics:cache_hit_ratio', fromTs, toTs, 'WITHSCORES'),
        this.redis.zrangebyscore('db_metrics:slow_queries', fromTs, toTs, 'WITHSCORES'),
      ]);
    }

    return {
      reportGenerated: new Date(),
      timeRange,
      currentMetrics: metrics,
      historicalData,
      recommendations: this.generateRecommendations(metrics),
      summary: {
        overallHealth: this.calculateOverallHealth(metrics),
        keyInsights: this.generateKeyInsights(metrics),
        actionItems: this.generateActionItems(metrics),
      },
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: DatabaseMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.queryPerformance.cacheHitRatio < 95) {
      recommendations.push('Consider increasing shared_buffers to improve cache hit ratio');
    }

    if (metrics.queryPerformance.slowQueryCount > 10) {
      recommendations.push('Review and optimize slow queries - consider adding indexes');
    }

    if (metrics.connectionPool.utilization > 80) {
      recommendations.push('Consider implementing connection pooling or increasing connection limits');
    }

    const largeSeqScans = metrics.performance.tableScans.filter(t => t.scanRatio < 50);
    if (largeSeqScans.length > 0) {
      recommendations.push(`Consider adding indexes to tables with high sequential scans: ${largeSeqScans.map(t => t.tableName).join(', ')}`);
    }

    const inefficientIndexes = metrics.performance.indexUsage.filter(i => i.efficiency < 50 && i.scans > 100);
    if (inefficientIndexes.length > 0) {
      recommendations.push(`Review potentially inefficient indexes: ${inefficientIndexes.map(i => i.indexName).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Calculate overall database health score
   */
  private calculateOverallHealth(metrics: DatabaseMetrics): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{ name: string; score: number; weight: number }>;
  } {
    const factors = [
      {
        name: 'Query Performance',
        score: Math.max(0, 100 - (metrics.queryPerformance.averageQueryTime / 10)),
        weight: 0.3,
      },
      {
        name: 'Cache Efficiency',
        score: metrics.queryPerformance.cacheHitRatio,
        weight: 0.25,
      },
      {
        name: 'Connection Utilization',
        score: Math.max(0, 100 - metrics.connectionPool.utilization),
        weight: 0.2,
      },
      {
        name: 'Index Efficiency',
        score: metrics.performance.indexUsage.length > 0
          ? metrics.performance.indexUsage.reduce((sum, i) => sum + i.efficiency, 0) / metrics.performance.indexUsage.length
          : 100,
        weight: 0.25,
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (weightedScore >= 90) status = 'excellent';
    else if (weightedScore >= 75) status = 'good';
    else if (weightedScore >= 60) status = 'fair';
    else status = 'poor';

    return {
      score: Math.round(weightedScore),
      status,
      factors,
    };
  }

  /**
   * Generate key insights from metrics
   */
  private generateKeyInsights(metrics: DatabaseMetrics): string[] {
    const insights: string[] = [];

    const largestTable = metrics.storage.tableSizes[0];
    if (largestTable) {
      insights.push(`Largest table: ${largestTable.tableName} (${largestTable.sizeFormatted}, ${largestTable.rowCount.toLocaleString()} rows)`);
    }

    if (metrics.partitionMetrics.partitionCount > 0) {
      insights.push(`Database uses ${metrics.partitionMetrics.partitionCount} partitions for improved performance`);
    }

    const mostUsedIndex = metrics.performance.indexUsage[0];
    if (mostUsedIndex) {
      insights.push(`Most used index: ${mostUsedIndex.indexName} with ${mostUsedIndex.scans.toLocaleString()} scans`);
    }

    insights.push(`Current query load: ${metrics.queryPerformance.queriesPerSecond.toFixed(1)} queries/second`);

    return insights;
  }

  /**
   * Generate action items based on metrics
   */
  private generateActionItems(metrics: DatabaseMetrics): Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }> {
    const actions: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      impact: string;
    }> = [];

    if (metrics.queryPerformance.slowQueryCount > 20) {
      actions.push({
        priority: 'high',
        action: 'Optimize slow queries and add missing indexes',
        impact: 'Significant performance improvement',
      });
    }

    if (metrics.connectionPool.utilization > 85) {
      actions.push({
        priority: 'high',
        action: 'Scale connection pool or optimize connection usage',
        impact: 'Prevent connection exhaustion',
      });
    }

    if (metrics.queryPerformance.cacheHitRatio < 90) {
      actions.push({
        priority: 'medium',
        action: 'Tune PostgreSQL memory settings',
        impact: 'Improved query performance',
      });
    }

    return actions;
  }
}

// Export types and classes for use in the application
export { DatabasePerformanceMonitor };
export type { DatabaseMetrics, AlertConfig };