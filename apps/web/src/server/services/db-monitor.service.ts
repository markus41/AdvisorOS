import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

interface QueryMetrics {
  queryName: string;
  duration: number;
  timestamp: Date;
  organizationId?: string;
  userId?: string;
  parameters?: Record<string, any>;
  rowCount?: number;
}

interface SlowQueryAlert {
  id: string;
  query: string;
  duration: number;
  calls: number;
  avgDuration: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  firstSeen: Date;
  lastSeen: Date;
  organizationId?: string;
}

interface DatabaseMetrics {
  timestamp: Date;
  connections: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  performance: {
    cacheHitRatio: number;
    transactionsPerSecond: number;
    queriesPerSecond: number;
    avgQueryTime: number;
  };
  storage: {
    databaseSize: number;
    indexSize: number;
    totalSize: number;
    tableStats: Array<{
      tableName: string;
      rowCount: number;
      sizeBytes: number;
      indexSizeBytes: number;
    }>;
  };
  slowQueries: SlowQueryAlert[];
  indexUsage: Array<{
    tableName: string;
    indexName: string;
    scans: number;
    tupleReads: number;
    usage: 'unused' | 'low' | 'medium' | 'high';
  }>;
}

interface PerformanceThresholds {
  slowQueryMs: number;
  criticalQueryMs: number;
  maxConnections: number;
  cacheHitRatioMin: number;
  dbSizeWarningGB: number;
  indexUsageMin: number;
}

export class DatabaseMonitorService extends EventEmitter {
  private queryMetrics: QueryMetrics[] = [];
  private slowQueries: Map<string, SlowQueryAlert> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private metricsRetention = 24 * 60 * 60 * 1000; // 24 hours
  private isMonitoring = false;

  private readonly thresholds: PerformanceThresholds = {
    slowQueryMs: 1000, // 1 second
    criticalQueryMs: 5000, // 5 seconds
    maxConnections: 80, // 80% of max connections
    cacheHitRatioMin: 0.95, // 95% cache hit ratio
    dbSizeWarningGB: 10, // 10GB database size warning
    indexUsageMin: 0.1, // 10% index usage threshold
  };

  constructor(
    private prisma: PrismaClient,
    private redis?: Redis
  ) {
    super();
    this.setupQueryLogging();
  }

  // START/STOP MONITORING
  startMonitoring(intervalMs: number = 60000): void { // Default 1 minute
    if (this.isMonitoring) {
      console.log('Database monitoring is already running');
      return;
    }

    console.log('Starting database performance monitoring...');

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.analyzePerformance();
        await this.cleanupOldMetrics();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
        this.emit('monitoring-error', error);
      }
    }, intervalMs);

    this.emit('monitoring-started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    console.log('Database monitoring stopped');
    this.emit('monitoring-stopped');
  }

  // QUERY LOGGING SETUP
  private setupQueryLogging(): void {
    // Note: This would typically be done at the Prisma client level
    // For now, we'll provide methods for manual logging
    console.log('Query logging setup completed');
  }

  // Log a query execution
  logQuery(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);

    // Check for slow query
    if (metrics.duration > this.thresholds.slowQueryMs) {
      this.handleSlowQuery(metrics);
    }

    // Emit real-time event for slow queries
    if (metrics.duration > this.thresholds.criticalQueryMs) {
      this.emit('critical-slow-query', metrics);
    }
  }

  private handleSlowQuery(metrics: QueryMetrics): void {
    const queryKey = this.generateQueryKey(metrics.queryName, metrics.organizationId);

    let alert = this.slowQueries.get(queryKey);

    if (!alert) {
      alert = {
        id: queryKey,
        query: metrics.queryName,
        duration: metrics.duration,
        calls: 1,
        avgDuration: metrics.duration,
        impact: this.calculateImpact(metrics.duration),
        firstSeen: metrics.timestamp,
        lastSeen: metrics.timestamp,
        organizationId: metrics.organizationId,
      };
    } else {
      alert.calls++;
      alert.avgDuration = (alert.avgDuration * (alert.calls - 1) + metrics.duration) / alert.calls;
      alert.lastSeen = metrics.timestamp;
      alert.impact = this.calculateImpact(alert.avgDuration);

      if (metrics.duration > alert.duration) {
        alert.duration = metrics.duration; // Track worst case
      }
    }

    this.slowQueries.set(queryKey, alert);
    this.emit('slow-query', alert);
  }

  private calculateImpact(duration: number): 'low' | 'medium' | 'high' | 'critical' {
    if (duration < 2000) return 'low';
    if (duration < 5000) return 'medium';
    if (duration < 10000) return 'high';
    return 'critical';
  }

  private generateQueryKey(queryName: string, organizationId?: string): string {
    return `${queryName}_${organizationId || 'global'}`;
  }

  // METRICS COLLECTION
  async collectMetrics(): Promise<DatabaseMetrics> {
    try {
      const [
        connections,
        performance,
        storage,
        indexUsage,
      ] = await Promise.all([
        this.getConnectionMetrics(),
        this.getPerformanceMetrics(),
        this.getStorageMetrics(),
        this.getIndexUsageMetrics(),
      ]);

      const metrics: DatabaseMetrics = {
        timestamp: new Date(),
        connections,
        performance,
        storage,
        slowQueries: Array.from(this.slowQueries.values()),
        indexUsage,
      };

      // Cache metrics for API access
      if (this.redis) {
        await this.redis.setex(
          'db_metrics_latest',
          300, // 5 minutes TTL
          JSON.stringify(metrics)
        );
      }

      this.emit('metrics-collected', metrics);
      return metrics;

    } catch (error) {
      console.error('Failed to collect database metrics:', error);
      throw error;
    }
  }

  private async getConnectionMetrics(): Promise<DatabaseMetrics['connections']> {
    try {
      const result = await this.prisma.$queryRaw<Array<any>>`
        SELECT
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as waiting
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const row = result[0] || {};
      return {
        total: parseInt(row.total) || 0,
        active: parseInt(row.active) || 0,
        idle: parseInt(row.idle) || 0,
        waiting: parseInt(row.waiting) || 0,
      };
    } catch (error) {
      console.error('Failed to get connection metrics:', error);
      return { total: 0, active: 0, idle: 0, waiting: 0 };
    }
  }

  private async getPerformanceMetrics(): Promise<DatabaseMetrics['performance']> {
    try {
      const [cacheStats, transactionStats] = await Promise.all([
        this.prisma.$queryRaw<Array<any>>`
          SELECT
            sum(heap_blks_read) as heap_read,
            sum(heap_blks_hit) as heap_hit,
            CASE
              WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 0
              ELSE sum(heap_blks_hit)::numeric / (sum(heap_blks_hit) + sum(heap_blks_read))
            END as cache_hit_ratio
          FROM pg_statio_user_tables
        `,
        this.prisma.$queryRaw<Array<any>>`
          SELECT
            xact_commit + xact_rollback as total_transactions,
            tup_returned + tup_fetched as total_queries,
            extract(epoch from (now() - stats_reset)) as uptime_seconds
          FROM pg_stat_database
          WHERE datname = current_database()
        `,
      ]);

      const cacheRow = cacheStats[0] || {};
      const transRow = transactionStats[0] || {};

      const uptime = parseFloat(transRow.uptime_seconds) || 1;
      const totalTransactions = parseInt(transRow.total_transactions) || 0;
      const totalQueries = parseInt(transRow.total_queries) || 0;

      // Calculate recent query metrics from our logged queries
      const recentQueries = this.queryMetrics.filter(
        q => Date.now() - q.timestamp.getTime() < 60000 // Last minute
      );

      const avgQueryTime = recentQueries.length > 0
        ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
        : 0;

      return {
        cacheHitRatio: parseFloat(cacheRow.cache_hit_ratio) || 0,
        transactionsPerSecond: totalTransactions / uptime,
        queriesPerSecond: totalQueries / uptime,
        avgQueryTime,
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return { cacheHitRatio: 0, transactionsPerSecond: 0, queriesPerSecond: 0, avgQueryTime: 0 };
    }
  }

  private async getStorageMetrics(): Promise<DatabaseMetrics['storage']> {
    try {
      const [dbSize, tableStats] = await Promise.all([
        this.prisma.$queryRaw<Array<any>>`
          SELECT
            pg_database_size(current_database()) as db_size,
            (SELECT sum(pg_total_relation_size(indexrelid)) FROM pg_index) as index_size
        `,
        this.prisma.$queryRaw<Array<any>>`
          SELECT
            schemaname,
            tablename,
            n_live_tup as row_count,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
            pg_indexes_size(schemaname||'.'||tablename) as index_size_bytes
          FROM pg_stat_user_tables
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
          LIMIT 20
        `,
      ]);

      const sizeRow = dbSize[0] || {};
      const databaseSize = parseInt(sizeRow.db_size) || 0;
      const indexSize = parseInt(sizeRow.index_size) || 0;

      const formattedTableStats = tableStats.map((row: any) => ({
        tableName: row.tablename,
        rowCount: parseInt(row.row_count) || 0,
        sizeBytes: parseInt(row.size_bytes) || 0,
        indexSizeBytes: parseInt(row.index_size_bytes) || 0,
      }));

      return {
        databaseSize,
        indexSize,
        totalSize: databaseSize,
        tableStats: formattedTableStats,
      };
    } catch (error) {
      console.error('Failed to get storage metrics:', error);
      return { databaseSize: 0, indexSize: 0, totalSize: 0, tableStats: [] };
    }
  }

  private async getIndexUsageMetrics(): Promise<DatabaseMetrics['indexUsage']> {
    try {
      const indexStats = await this.prisma.$queryRaw<Array<any>>`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuple_reads,
          CASE
            WHEN idx_scan = 0 THEN 'unused'
            WHEN idx_scan < 100 THEN 'low'
            WHEN idx_scan < 1000 THEN 'medium'
            ELSE 'high'
          END as usage
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `;

      return indexStats.map((row: any) => ({
        tableName: row.tablename,
        indexName: row.indexname,
        scans: parseInt(row.scans) || 0,
        tupleReads: parseInt(row.tuple_reads) || 0,
        usage: row.usage as 'unused' | 'low' | 'medium' | 'high',
      }));
    } catch (error) {
      console.error('Failed to get index usage metrics:', error);
      return [];
    }
  }

  // PERFORMANCE ANALYSIS
  private async analyzePerformance(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();

      // Check connection pool utilization
      const connectionUtilization = metrics.connections.active / (metrics.connections.total || 1);
      if (connectionUtilization > 0.8) {
        this.emit('alert', {
          type: 'high-connection-usage',
          severity: 'warning',
          message: `High connection pool utilization: ${(connectionUtilization * 100).toFixed(1)}%`,
          metrics: metrics.connections,
        });
      }

      // Check cache hit ratio
      if (metrics.performance.cacheHitRatio < this.thresholds.cacheHitRatioMin) {
        this.emit('alert', {
          type: 'low-cache-hit-ratio',
          severity: 'warning',
          message: `Low cache hit ratio: ${(metrics.performance.cacheHitRatio * 100).toFixed(1)}%`,
          metrics: metrics.performance,
        });
      }

      // Check database size
      const dbSizeGB = metrics.storage.databaseSize / (1024 * 1024 * 1024);
      if (dbSizeGB > this.thresholds.dbSizeWarningGB) {
        this.emit('alert', {
          type: 'database-size-warning',
          severity: 'info',
          message: `Database size is ${dbSizeGB.toFixed(2)}GB`,
          metrics: metrics.storage,
        });
      }

      // Identify unused indexes
      const unusedIndexes = metrics.indexUsage.filter(idx => idx.usage === 'unused');
      if (unusedIndexes.length > 0) {
        this.emit('alert', {
          type: 'unused-indexes',
          severity: 'info',
          message: `Found ${unusedIndexes.length} unused indexes`,
          metrics: unusedIndexes,
        });
      }

      // Check for tables that might need indexing
      await this.analyzeTableScans();

    } catch (error) {
      console.error('Performance analysis failed:', error);
    }
  }

  private async analyzeTableScans(): Promise<void> {
    try {
      const tableScanStats = await this.prisma.$queryRaw<Array<any>>`
        SELECT
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          n_live_tup,
          CASE
            WHEN seq_scan > idx_scan AND n_live_tup > 1000 THEN 'needs_index'
            WHEN seq_scan > 1000 AND seq_tup_read / seq_scan > 10000 THEN 'frequent_scans'
            ELSE 'ok'
          END as status
        FROM pg_stat_user_tables
        WHERE seq_scan > 0
        ORDER BY seq_scan DESC
        LIMIT 10
      `;

      const problematicTables = tableScanStats.filter(
        (table: any) => table.status !== 'ok'
      );

      if (problematicTables.length > 0) {
        this.emit('alert', {
          type: 'table-scan-issues',
          severity: 'warning',
          message: `Found ${problematicTables.length} tables with potential indexing issues`,
          metrics: problematicTables,
        });
      }
    } catch (error) {
      console.error('Table scan analysis failed:', error);
    }
  }

  // API METHODS
  async getLatestMetrics(): Promise<DatabaseMetrics | null> {
    if (this.redis) {
      try {
        const cached = await this.redis.get('db_metrics_latest');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Failed to get cached metrics:', error);
      }
    }

    // Fallback to collecting fresh metrics
    return this.collectMetrics();
  }

  getSlowQueries(limit: number = 20): SlowQueryAlert[] {
    return Array.from(this.slowQueries.values())
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  getQueryMetrics(since?: Date): QueryMetrics[] {
    const cutoff = since || new Date(Date.now() - 60 * 60 * 1000); // Last hour
    return this.queryMetrics.filter(m => m.timestamp >= cutoff);
  }

  // Generate performance report
  async generatePerformanceReport(organizationId?: string): Promise<any> {
    const metrics = await this.getLatestMetrics();
    const slowQueries = this.getSlowQueries();
    const recentMetrics = this.getQueryMetrics();

    const report = {
      generatedAt: new Date(),
      organizationId,
      summary: {
        status: this.getOverallStatus(metrics),
        totalQueries: recentMetrics.length,
        slowQueryCount: slowQueries.length,
        avgQueryTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length || 0,
      },
      metrics,
      slowQueries: slowQueries.slice(0, 10),
      recommendations: await this.generateRecommendations(metrics, slowQueries),
    };

    return report;
  }

  private getOverallStatus(metrics: DatabaseMetrics | null): 'healthy' | 'warning' | 'critical' {
    if (!metrics) return 'critical';

    let issues = 0;

    // Check various health indicators
    if (metrics.performance.cacheHitRatio < 0.95) issues++;
    if (metrics.connections.active / metrics.connections.total > 0.8) issues++;
    if (metrics.slowQueries.filter(q => q.impact === 'critical').length > 0) issues += 2;
    if (metrics.slowQueries.filter(q => q.impact === 'high').length > 5) issues++;

    if (issues >= 3) return 'critical';
    if (issues >= 1) return 'warning';
    return 'healthy';
  }

  private async generateRecommendations(
    metrics: DatabaseMetrics | null,
    slowQueries: SlowQueryAlert[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (!metrics) return recommendations;

    // Cache hit ratio recommendations
    if (metrics.performance.cacheHitRatio < 0.95) {
      recommendations.push(
        'Consider increasing shared_buffers to improve cache hit ratio'
      );
    }

    // Index recommendations
    const unusedIndexes = metrics.indexUsage.filter(idx => idx.usage === 'unused');
    if (unusedIndexes.length > 0) {
      recommendations.push(
        `Remove ${unusedIndexes.length} unused indexes to reduce storage and improve write performance`
      );
    }

    // Slow query recommendations
    const criticalSlowQueries = slowQueries.filter(q => q.impact === 'critical');
    if (criticalSlowQueries.length > 0) {
      recommendations.push(
        `Optimize ${criticalSlowQueries.length} critical slow queries with appropriate indexes`
      );
    }

    // Connection pool recommendations
    const connectionUtilization = metrics.connections.active / metrics.connections.total;
    if (connectionUtilization > 0.8) {
      recommendations.push(
        'Consider increasing connection pool size or implementing connection pooling'
      );
    }

    // Storage recommendations
    const largestTables = metrics.storage.tableStats
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, 3);

    largestTables.forEach(table => {
      if (table.sizeBytes > 1024 * 1024 * 1024) { // > 1GB
        recommendations.push(
          `Consider partitioning or archiving large table: ${table.tableName} (${(table.sizeBytes / 1024 / 1024 / 1024).toFixed(1)}GB)`
        );
      }
    });

    return recommendations;
  }

  // CLEANUP
  private async cleanupOldMetrics(): Promise<void> {
    const cutoff = new Date(Date.now() - this.metricsRetention);

    // Clean up query metrics
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp >= cutoff);

    // Clean up slow query alerts that haven't been seen recently
    for (const [key, alert] of this.slowQueries.entries()) {
      if (alert.lastSeen < cutoff) {
        this.slowQueries.delete(key);
      }
    }
  }

  // EXPORT DATA
  async exportMetrics(startDate: Date, endDate: Date): Promise<any> {
    // This would typically export to a file or external system
    const filteredMetrics = this.queryMetrics.filter(
      m => m.timestamp >= startDate && m.timestamp <= endDate
    );

    return {
      exportDate: new Date(),
      period: { startDate, endDate },
      queryCount: filteredMetrics.length,
      queries: filteredMetrics,
      slowQueries: Array.from(this.slowQueries.values()),
    };
  }
}

export type {
  QueryMetrics,
  SlowQueryAlert,
  DatabaseMetrics,
  PerformanceThresholds,
};