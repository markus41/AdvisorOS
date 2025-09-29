import { prisma, redis } from '@/server/db';
import { createEnhancedQuickBooksOAuthService } from './enhanced-oauth';
import { createEnhancedWebhookProcessor } from './enhanced-webhook-processor';

export interface SyncDashboardMetrics {
  overview: SyncOverviewMetrics;
  connections: ConnectionMetrics[];
  syncHistory: SyncHistoryMetrics[];
  webhooks: WebhookMetrics;
  performance: PerformanceMetrics;
  alerts: SyncAlert[];
  healthStatus: HealthStatus;
}

export interface SyncOverviewMetrics {
  totalConnections: number;
  activeConnections: number;
  syncStatus: {
    running: number;
    completed: number;
    failed: number;
    pending: number;
  };
  totalRecordsSynced: number;
  syncSuccessRate: number;
  averageSyncDuration: number;
  lastSyncTime: Date | null;
  nextScheduledSync: Date | null;
}

export interface ConnectionMetrics {
  connectionId: string;
  organizationId: string;
  organizationName: string;
  realmId: string;
  connectionName?: string;
  status: 'active' | 'expired' | 'error' | 'revoked';
  isDefault: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  lastSyncAt: Date | null;
  syncFrequency: string;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  errorMessage?: string;
  entities: EntitySyncStatus[];
}

export interface EntitySyncStatus {
  entityType: string;
  lastSyncAt: Date | null;
  status: 'success' | 'failed' | 'pending' | 'disabled';
  recordCount: number;
  conflictCount: number;
  errorMessage?: string;
  nextSyncAt?: Date;
}

export interface SyncHistoryMetrics {
  syncId: string;
  organizationId: string;
  entityType: string;
  syncType: 'manual' | 'scheduled' | 'webhook';
  status: 'completed' | 'failed' | 'in_progress' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  recordsConflicted: number;
  triggeredBy?: string;
  errorMessage?: string;
  metadata?: any;
}

export interface WebhookMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  duplicateEvents: number;
  averageProcessingTime: number;
  webhookStatus: 'healthy' | 'degraded' | 'unhealthy';
  hourlyStats: HourlyWebhookStats[];
  entityBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
  latestEvents: WebhookEventSummary[];
}

export interface HourlyWebhookStats {
  hour: string;
  events: number;
  processed: number;
  failed: number;
}

export interface WebhookEventSummary {
  eventId: string;
  organizationId: string;
  entityType: string;
  operation: string;
  status: string;
  receivedAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

export interface PerformanceMetrics {
  syncThroughput: {
    recordsPerMinute: number;
    recordsPerHour: number;
    peakThroughput: number;
    averageThroughput: number;
  };
  systemLoad: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    queueLength: number;
  };
  apiMetrics: {
    requestCount: number;
    successRate: number;
    averageResponseTime: number;
    rateLimitStatus: {
      remaining: number;
      limit: number;
      resetTime: Date;
    };
  };
  databaseMetrics: {
    connectionCount: number;
    slowQueries: number;
    cacheHitRatio: number;
  };
}

export interface SyncAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  organizationId?: string;
  connectionId?: string;
  entityType?: string;
  createdAt: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  metadata?: any;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    oauth: ComponentHealth;
    sync: ComponentHealth;
    webhooks: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
    api: ComponentHealth;
  };
  lastChecked: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  lastError?: string;
  details?: any;
}

export interface DashboardFilters {
  organizationId?: string;
  connectionId?: string;
  timeRange: 'hour' | 'day' | 'week' | 'month';
  entityTypes?: string[];
  syncTypes?: string[];
  statuses?: string[];
}

export class QuickBooksSyncMonitoringDashboard {
  private oauthService: ReturnType<typeof createEnhancedQuickBooksOAuthService>;
  private webhookProcessor: ReturnType<typeof createEnhancedWebhookProcessor>;
  private metricsCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor() {
    this.oauthService = createEnhancedQuickBooksOAuthService();
    this.webhookProcessor = createEnhancedWebhookProcessor();
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(filters: DashboardFilters): Promise<SyncDashboardMetrics> {
    const cacheKey = `dashboard_metrics_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey, 60000); // 1 minute cache

    if (cached) {
      return cached;
    }

    try {
      const [
        overview,
        connections,
        syncHistory,
        webhooks,
        performance,
        alerts,
        healthStatus
      ] = await Promise.all([
        this.getSyncOverviewMetrics(filters),
        this.getConnectionMetrics(filters),
        this.getSyncHistoryMetrics(filters),
        this.getWebhookMetrics(filters),
        this.getPerformanceMetrics(filters),
        this.getSyncAlerts(filters),
        this.getHealthStatus()
      ]);

      const metrics: SyncDashboardMetrics = {
        overview,
        connections,
        syncHistory,
        webhooks,
        performance,
        alerts,
        healthStatus
      };

      this.setCachedData(cacheKey, metrics, 60000);
      return metrics;

    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get sync overview metrics
   */
  private async getSyncOverviewMetrics(filters: DashboardFilters): Promise<SyncOverviewMetrics> {
    const timeRange = this.getTimeRangeFilter(filters.timeRange);
    const orgFilter = filters.organizationId ? { organizationId: filters.organizationId } : {};

    const [
      totalConnections,
      activeConnections,
      syncStats,
      totalRecords,
      avgDuration,
      lastSync,
      nextSync
    ] = await Promise.all([
      // Total connections
      prisma.quickBooksToken.count({
        where: { ...orgFilter, deletedAt: null }
      }),

      // Active connections
      prisma.quickBooksToken.count({
        where: {
          ...orgFilter,
          isActive: true,
          deletedAt: null,
          expiresAt: { gt: new Date() }
        }
      }),

      // Sync status breakdown
      prisma.quickBooksSync.groupBy({
        by: ['status'],
        where: {
          ...orgFilter,
          createdAt: { gte: timeRange }
        },
        _count: true
      }),

      // Total records synced
      prisma.quickBooksSync.aggregate({
        where: {
          ...orgFilter,
          createdAt: { gte: timeRange },
          status: 'completed'
        },
        _sum: { recordsSuccess: true }
      }),

      // Average sync duration
      prisma.quickBooksSync.aggregate({
        where: {
          ...orgFilter,
          createdAt: { gte: timeRange },
          status: 'completed',
          completedAt: { not: null }
        },
        _avg: {
          duration: true
        }
      }),

      // Last sync time
      prisma.quickBooksSync.findFirst({
        where: {
          ...orgFilter,
          status: 'completed'
        },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true }
      }),

      // Next scheduled sync
      prisma.quickBooksSync.findFirst({
        where: {
          ...orgFilter,
          status: 'pending'
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      })
    ]);

    const syncStatus = {
      running: 0,
      completed: 0,
      failed: 0,
      pending: 0
    };

    syncStats.forEach(stat => {
      if (stat.status === 'in_progress') syncStatus.running = stat._count;
      else if (stat.status === 'completed') syncStatus.completed = stat._count;
      else if (stat.status === 'failed') syncStatus.failed = stat._count;
      else if (stat.status === 'pending') syncStatus.pending = stat._count;
    });

    const totalSyncs = syncStatus.completed + syncStatus.failed;
    const syncSuccessRate = totalSyncs > 0 ? (syncStatus.completed / totalSyncs) * 100 : 0;

    return {
      totalConnections,
      activeConnections,
      syncStatus,
      totalRecordsSynced: totalRecords._sum.recordsSuccess || 0,
      syncSuccessRate,
      averageSyncDuration: avgDuration._avg.duration || 0,
      lastSyncTime: lastSync?.completedAt || null,
      nextScheduledSync: nextSync?.createdAt || null
    };
  }

  /**
   * Get connection metrics with entity sync status
   */
  private async getConnectionMetrics(filters: DashboardFilters): Promise<ConnectionMetrics[]> {
    const orgFilter = filters.organizationId ? { organizationId: filters.organizationId } : {};

    const connections = await prisma.quickBooksToken.findMany({
      where: {
        ...orgFilter,
        deletedAt: null
      },
      include: {
        organization: {
          select: { name: true }
        },
        _count: {
          select: {
            syncs: {
              where: {
                createdAt: { gte: this.getTimeRangeFilter(filters.timeRange) }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const connectionMetrics: ConnectionMetrics[] = [];

    for (const connection of connections) {
      // Get sync statistics
      const syncStats = await prisma.quickBooksSync.groupBy({
        by: ['status'],
        where: {
          organizationId: connection.organizationId,
          createdAt: { gte: this.getTimeRangeFilter(filters.timeRange) }
        },
        _count: true
      });

      const totalSyncs = syncStats.reduce((sum, stat) => sum + stat._count, 0);
      const successfulSyncs = syncStats.find(s => s.status === 'completed')?._count || 0;
      const failedSyncs = syncStats.find(s => s.status === 'failed')?._count || 0;

      // Get entity sync status
      const entities = await this.getEntitySyncStatus(connection.organizationId, filters);

      // Determine connection status
      const status = this.determineConnectionStatus(connection);

      connectionMetrics.push({
        connectionId: connection.connectionId || 'default',
        organizationId: connection.organizationId,
        organizationName: connection.organization.name,
        realmId: connection.realmId,
        connectionName: connection.connectionName || undefined,
        status,
        isDefault: connection.isDefault || false,
        createdAt: connection.createdAt,
        lastUsedAt: connection.lastUsedAt || connection.createdAt,
        lastSyncAt: connection.lastSyncAt,
        syncFrequency: 'Every 4 hours', // This should come from configuration
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        errorMessage: connection.errorDetails || undefined,
        entities
      });
    }

    return connectionMetrics;
  }

  /**
   * Get entity sync status for a connection
   */
  private async getEntitySyncStatus(organizationId: string, filters: DashboardFilters): Promise<EntitySyncStatus[]> {
    const entityTypes = ['customer', 'invoice', 'account', 'item', 'vendor'];
    const entityStatuses: EntitySyncStatus[] = [];

    for (const entityType of entityTypes) {
      const lastSync = await prisma.quickBooksSync.findFirst({
        where: {
          organizationId,
          entityType,
          status: 'completed'
        },
        orderBy: { completedAt: 'desc' }
      });

      const conflictCount = await prisma.syncConflict.count({
        where: {
          organizationId,
          entityType,
          status: 'pending'
        }
      });

      const recordCount = lastSync?.recordsSuccess || 0;
      const status = this.determineEntitySyncStatus(lastSync);

      entityStatuses.push({
        entityType,
        lastSyncAt: lastSync?.completedAt || null,
        status,
        recordCount,
        conflictCount,
        errorMessage: lastSync?.errorMessage || undefined
      });
    }

    return entityStatuses;
  }

  /**
   * Get sync history metrics
   */
  private async getSyncHistoryMetrics(filters: DashboardFilters): Promise<SyncHistoryMetrics[]> {
    const whereClause: any = {
      createdAt: { gte: this.getTimeRangeFilter(filters.timeRange) }
    };

    if (filters.organizationId) {
      whereClause.organizationId = filters.organizationId;
    }

    if (filters.entityTypes?.length) {
      whereClause.entityType = { in: filters.entityTypes };
    }

    if (filters.syncTypes?.length) {
      whereClause.syncType = { in: filters.syncTypes };
    }

    if (filters.statuses?.length) {
      whereClause.status = { in: filters.statuses };
    }

    const syncs = await prisma.quickBooksSync.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to most recent 100 syncs
      select: {
        id: true,
        organizationId: true,
        entityType: true,
        syncType: true,
        status: true,
        startedAt: true,
        completedAt: true,
        recordsProcessed: true,
        recordsSuccess: true,
        recordsFailed: true,
        triggeredBy: true,
        errorMessage: true,
        metadata: true
      }
    });

    return syncs.map(sync => ({
      syncId: sync.id,
      organizationId: sync.organizationId,
      entityType: sync.entityType,
      syncType: sync.syncType as any,
      status: sync.status as any,
      startedAt: sync.startedAt || sync.createdAt,
      completedAt: sync.completedAt || undefined,
      duration: sync.completedAt && sync.startedAt
        ? sync.completedAt.getTime() - sync.startedAt.getTime()
        : undefined,
      recordsProcessed: sync.recordsProcessed || 0,
      recordsSuccess: sync.recordsSuccess || 0,
      recordsFailed: sync.recordsFailed || 0,
      recordsConflicted: 0, // This would need to be calculated
      triggeredBy: sync.triggeredBy || undefined,
      errorMessage: sync.errorMessage || undefined,
      metadata: sync.metadata
    }));
  }

  /**
   * Get webhook metrics
   */
  private async getWebhookMetrics(filters: DashboardFilters): Promise<WebhookMetrics> {
    const webhookMetrics = await this.webhookProcessor.getProcessingMetrics(
      filters.organizationId,
      filters.timeRange
    );

    // Get latest webhook events
    const latestEvents = await prisma.quickBooksWebhookEvent.findMany({
      where: {
        ...(filters.organizationId && { organizationId: filters.organizationId }),
        createdAt: { gte: this.getTimeRangeFilter(filters.timeRange) }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        eventId: true,
        organizationId: true,
        entityName: true,
        eventType: true,
        status: true,
        createdAt: true,
        processedAt: true,
        errorMessage: true
      }
    });

    const webhookStatus = this.determineWebhookStatus(webhookMetrics);

    return {
      ...webhookMetrics,
      webhookStatus,
      latestEvents: latestEvents.map(event => ({
        eventId: event.eventId,
        organizationId: event.organizationId,
        entityType: event.entityName,
        operation: event.eventType,
        status: event.status,
        receivedAt: event.createdAt,
        processedAt: event.processedAt || undefined,
        errorMessage: event.errorMessage || undefined
      }))
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(filters: DashboardFilters): Promise<PerformanceMetrics> {
    const timeRange = this.getTimeRangeFilter(filters.timeRange);

    // Calculate sync throughput
    const syncThroughput = await this.calculateSyncThroughput(timeRange);

    // Get system load metrics
    const systemLoad = await this.getSystemLoadMetrics();

    // Get API metrics
    const apiMetrics = await this.getApiMetrics(timeRange);

    // Get database metrics
    const databaseMetrics = await this.getDatabaseMetrics();

    return {
      syncThroughput,
      systemLoad,
      apiMetrics,
      databaseMetrics
    };
  }

  /**
   * Get sync alerts
   */
  private async getSyncAlerts(filters: DashboardFilters): Promise<SyncAlert[]> {
    const alerts = await prisma.syncAlert.findMany({
      where: {
        ...(filters.organizationId && { organizationId: filters.organizationId }),
        createdAt: { gte: this.getTimeRangeFilter(filters.timeRange) },
        isResolved: false
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type as any,
      severity: alert.severity as any,
      title: alert.title,
      message: alert.message,
      organizationId: alert.organizationId || undefined,
      connectionId: alert.connectionId || undefined,
      entityType: alert.entityType || undefined,
      createdAt: alert.createdAt,
      isResolved: alert.isResolved,
      resolvedAt: alert.resolvedAt || undefined,
      metadata: alert.metadata
    }));
  }

  /**
   * Get overall health status
   */
  private async getHealthStatus(): Promise<HealthStatus> {
    const [
      oauthHealth,
      syncHealth,
      webhookHealth,
      databaseHealth,
      cacheHealth,
      apiHealth
    ] = await Promise.all([
      this.checkOAuthHealth(),
      this.checkSyncHealth(),
      this.checkWebhookHealth(),
      this.checkDatabaseHealth(),
      this.checkCacheHealth(),
      this.checkApiHealth()
    ]);

    const components = {
      oauth: oauthHealth,
      sync: syncHealth,
      webhooks: webhookHealth,
      database: databaseHealth,
      cache: cacheHealth,
      api: apiHealth
    };

    // Determine overall health
    const componentStatuses = Object.values(components).map(c => c.status);
    const healthyCount = componentStatuses.filter(s => s === 'healthy').length;
    const degradedCount = componentStatuses.filter(s => s === 'degraded').length;
    const unhealthyCount = componentStatuses.filter(s => s === 'unhealthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      components,
      lastChecked: new Date()
    };
  }

  /**
   * Generate real-time sync metrics for monitoring
   */
  async getRealtimeMetrics(organizationId?: string): Promise<{
    activeSyncs: number;
    syncThroughput: number;
    webhookEvents: number;
    errorRate: number;
    connectionStatus: Record<string, string>;
  }> {
    const cacheKey = `realtime_metrics_${organizationId || 'all'}`;
    const cached = this.getCachedData(cacheKey, 30000); // 30 seconds cache

    if (cached) {
      return cached;
    }

    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    const orgFilter = organizationId ? { organizationId } : {};

    const [
      activeSyncs,
      recentSyncs,
      webhookEvents,
      connections
    ] = await Promise.all([
      prisma.quickBooksSync.count({
        where: {
          ...orgFilter,
          status: 'in_progress'
        }
      }),

      prisma.quickBooksSync.findMany({
        where: {
          ...orgFilter,
          createdAt: { gte: last5Minutes }
        },
        select: { recordsSuccess: true, status: true }
      }),

      prisma.quickBooksWebhookEvent.count({
        where: {
          ...orgFilter,
          createdAt: { gte: last5Minutes }
        }
      }),

      prisma.quickBooksToken.findMany({
        where: {
          ...orgFilter,
          isActive: true,
          deletedAt: null
        },
        select: { connectionId: true, status: true }
      })
    ]);

    const totalRecords = recentSyncs.reduce((sum, sync) => sum + (sync.recordsSuccess || 0), 0);
    const syncThroughput = totalRecords / 5; // Records per minute

    const failedSyncs = recentSyncs.filter(s => s.status === 'failed').length;
    const errorRate = recentSyncs.length > 0 ? (failedSyncs / recentSyncs.length) * 100 : 0;

    const connectionStatus = connections.reduce((acc, conn) => {
      acc[conn.connectionId || 'default'] = conn.status || 'unknown';
      return acc;
    }, {} as Record<string, string>);

    const metrics = {
      activeSyncs,
      syncThroughput,
      webhookEvents,
      errorRate,
      connectionStatus
    };

    this.setCachedData(cacheKey, metrics, 30000);
    return metrics;
  }

  /**
   * Create sync alert
   */
  async createSyncAlert(alert: Omit<SyncAlert, 'id' | 'createdAt' | 'isResolved'>): Promise<string> {
    const alertRecord = await prisma.syncAlert.create({
      data: {
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        organizationId: alert.organizationId,
        connectionId: alert.connectionId,
        entityType: alert.entityType,
        metadata: alert.metadata,
        isResolved: false
      }
    });

    // Send real-time notification if severe
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await this.sendRealtimeAlert(alertRecord);
    }

    return alertRecord.id;
  }

  /**
   * Resolve sync alert
   */
  async resolveSyncAlert(alertId: string, resolvedBy?: string): Promise<void> {
    await prisma.syncAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        metadata: {
          resolvedBy
        }
      }
    });
  }

  // Helper methods

  private getTimeRangeFilter(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private determineConnectionStatus(connection: any): 'active' | 'expired' | 'error' | 'revoked' {
    if (!connection.isActive || connection.deletedAt) {
      return 'revoked';
    }
    if (connection.expiresAt <= new Date()) {
      return 'expired';
    }
    if (connection.errorDetails) {
      return 'error';
    }
    return 'active';
  }

  private determineEntitySyncStatus(lastSync: any): 'success' | 'failed' | 'pending' | 'disabled' {
    if (!lastSync) return 'pending';
    return lastSync.status === 'completed' ? 'success' : 'failed';
  }

  private determineWebhookStatus(metrics: any): 'healthy' | 'degraded' | 'unhealthy' {
    const errorRate = metrics.totalEvents > 0 ? (metrics.failedEvents / metrics.totalEvents) * 100 : 0;

    if (errorRate > 10) return 'unhealthy';
    if (errorRate > 5) return 'degraded';
    return 'healthy';
  }

  private getCachedData(key: string, maxAge: number): any {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Health check methods
  private async checkOAuthHealth(): Promise<ComponentHealth> {
    try {
      const health = await this.oauthService.performHealthCheck();
      return {
        status: health.status === 'healthy' ? 'healthy' : health.status === 'degraded' ? 'degraded' : 'unhealthy',
        details: health
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkSyncHealth(): Promise<ComponentHealth> {
    try {
      const recentSyncs = await prisma.quickBooksSync.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
        },
        select: { status: true }
      });

      const failedSyncs = recentSyncs.filter(s => s.status === 'failed').length;
      const errorRate = recentSyncs.length > 0 ? (failedSyncs / recentSyncs.length) * 100 : 0;

      let status: ComponentHealth['status'];
      if (errorRate > 20) status = 'unhealthy';
      else if (errorRate > 10) status = 'degraded';
      else status = 'healthy';

      return {
        status,
        errorRate,
        details: { recentSyncs: recentSyncs.length, failedSyncs }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkWebhookHealth(): Promise<ComponentHealth> {
    // Implementation for webhook health check
    return { status: 'healthy' };
  }

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkCacheHealth(): Promise<ComponentHealth> {
    if (!redis) {
      return { status: 'healthy' }; // Redis is optional
    }

    try {
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;

      return {
        status: responseTime < 50 ? 'healthy' : responseTime < 200 ? 'degraded' : 'unhealthy',
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkApiHealth(): Promise<ComponentHealth> {
    // Implementation for QuickBooks API health check
    return { status: 'healthy' };
  }

  // Performance metrics calculation methods
  private async calculateSyncThroughput(since: Date): Promise<any> {
    // Implementation for sync throughput calculation
    return {
      recordsPerMinute: 0,
      recordsPerHour: 0,
      peakThroughput: 0,
      averageThroughput: 0
    };
  }

  private async getSystemLoadMetrics(): Promise<any> {
    // Implementation for system load metrics
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      activeConnections: 0,
      queueLength: 0
    };
  }

  private async getApiMetrics(since: Date): Promise<any> {
    // Implementation for API metrics
    return {
      requestCount: 0,
      successRate: 0,
      averageResponseTime: 0,
      rateLimitStatus: {
        remaining: 0,
        limit: 0,
        resetTime: new Date()
      }
    };
  }

  private async getDatabaseMetrics(): Promise<any> {
    // Implementation for database metrics
    return {
      connectionCount: 0,
      slowQueries: 0,
      cacheHitRatio: 0
    };
  }

  private async sendRealtimeAlert(alert: any): Promise<void> {
    // Implementation for real-time alert notifications
  }
}

// Factory function
export function createSyncMonitoringDashboard(): QuickBooksSyncMonitoringDashboard {
  return new QuickBooksSyncMonitoringDashboard();
}

// Export types
export type {
  SyncDashboardMetrics,
  SyncOverviewMetrics,
  ConnectionMetrics,
  EntitySyncStatus,
  SyncHistoryMetrics,
  WebhookMetrics,
  PerformanceMetrics,
  SyncAlert,
  HealthStatus,
  ComponentHealth,
  DashboardFilters
};