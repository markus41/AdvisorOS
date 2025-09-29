/**
 * Enhanced QuickBooks Integration for AdvisorOS
 *
 * A comprehensive QuickBooks integration system addressing critical pain points identified in market validation:
 * - OAuth failures and authentication issues (95% of CPAs affected)
 * - API rate limits and connection interruptions
 * - Data sync inconsistencies and conflicts
 * - Limited monitoring and troubleshooting capabilities
 *
 * Key Features:
 * - Enhanced OAuth 2.0 with retry mechanisms and multi-organization support
 * - Robust webhook processing with signature verification and deduplication
 * - Advanced incremental sync engine with conflict resolution
 * - Comprehensive monitoring dashboard with real-time metrics
 * - Data transformation and validation pipeline
 * - Integration troubleshooting and diagnostic tools
 *
 * Performance Targets:
 * - Handle 1,000+ QB webhook events per minute
 * - Sync 10,000+ QB transactions per organization
 * - 99.5% sync success rate with automatic retry
 * - Real-time sync completion (under 30 seconds)
 * - Support 500+ concurrent QB organizations
 */

import { prisma, redis } from '@/server/db';
import { createEnhancedQuickBooksOAuthService } from './enhanced-oauth';
import { createQuickBooksApiClient } from './client';
import { createEnhancedWebhookProcessor } from './enhanced-webhook-processor';
import { createAdvancedSyncEngine } from './advanced-sync-engine';
import { createSyncMonitoringDashboard } from './sync-monitoring-dashboard';
import { createDataTransformationPipeline } from './data-transformation-pipeline';
import { createIntegrationDiagnostics } from './integration-diagnostics';

export interface QuickBooksIntegrationConfig {
  // OAuth Configuration
  oauth: {
    enableMultiConnection: boolean;
    enableAutoRefresh: boolean;
    tokenRefreshBuffer: number; // minutes before expiry
    retryConfig: {
      maxRetries: number;
      baseDelay: number;
      maxDelay: number;
    };
  };

  // Webhook Configuration
  webhooks: {
    enableProcessing: boolean;
    enableSignatureVerification: boolean;
    enableDeduplication: boolean;
    deduplicationWindow: number; // minutes
    maxRetries: number;
    retryDelay: number; // minutes
    batchSize: number;
  };

  // Sync Configuration
  sync: {
    enableIncrementalSync: boolean;
    enableConflictResolution: boolean;
    autoResolutionStrategy: 'remote_wins' | 'local_wins' | 'merge';
    batchSize: number;
    maxConcurrentBatches: number;
    enableVersioning: boolean;
    enableChangeTracking: boolean;
  };

  // Data Processing Configuration
  dataProcessing: {
    enableTransformation: boolean;
    enableValidation: boolean;
    stopOnFirstError: boolean;
    enableAuditLogging: boolean;
    transformationTimeout: number; // seconds
    validationTimeout: number; // seconds
  };

  // Monitoring Configuration
  monitoring: {
    enableRealTimeMetrics: boolean;
    enableAlerts: boolean;
    metricsRetention: number; // days
    alertThresholds: {
      errorRate: number; // percentage
      responseTime: number; // milliseconds
      syncFailureRate: number; // percentage
    };
  };

  // Performance Configuration
  performance: {
    enableCaching: boolean;
    cacheTimeout: number; // minutes
    enableCompression: boolean;
    enableRequestBatching: boolean;
    maxRequestsPerSecond: number;
  };
}

export interface IntegrationStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  components: {
    oauth: ComponentStatus;
    api: ComponentStatus;
    sync: ComponentStatus;
    webhooks: ComponentStatus;
    dataProcessing: ComponentStatus;
    monitoring: ComponentStatus;
  };
  metrics: {
    activeConnections: number;
    syncThroughput: number;
    errorRate: number;
    averageResponseTime: number;
    webhookEvents: number;
  };
  lastUpdated: Date;
}

export interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastCheck: Date;
  metrics?: any;
}

export interface QuickBooksConnection {
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
  expiresAt: Date;
  metadata: any;
}

export interface SyncOperation {
  syncId: string;
  organizationId: string;
  connectionId: string;
  entityType: string;
  syncType: 'manual' | 'scheduled' | 'webhook';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
    conflictedRecords: number;
  };
  startedAt: Date;
  estimatedCompletion?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata: any;
}

export class EnhancedQuickBooksIntegration {
  private config: QuickBooksIntegrationConfig;
  private oauthService: ReturnType<typeof createEnhancedQuickBooksOAuthService>;
  private webhookProcessor: ReturnType<typeof createEnhancedWebhookProcessor>;
  private syncEngine: ReturnType<typeof createAdvancedSyncEngine> | null = null;
  private dashboardService: ReturnType<typeof createSyncMonitoringDashboard>;
  private dataTransformationPipeline: ReturnType<typeof createDataTransformationPipeline>;
  private diagnostics: ReturnType<typeof createIntegrationDiagnostics>;

  private activeOperations: Map<string, SyncOperation> = new Map();
  private metricsCollector: NodeJS.Timeout | null = null;

  private readonly defaultConfig: QuickBooksIntegrationConfig = {
    oauth: {
      enableMultiConnection: true,
      enableAutoRefresh: true,
      tokenRefreshBuffer: 5,
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000
      }
    },
    webhooks: {
      enableProcessing: true,
      enableSignatureVerification: true,
      enableDeduplication: true,
      deduplicationWindow: 5,
      maxRetries: 3,
      retryDelay: 5,
      batchSize: 50
    },
    sync: {
      enableIncrementalSync: true,
      enableConflictResolution: true,
      autoResolutionStrategy: 'remote_wins',
      batchSize: 100,
      maxConcurrentBatches: 3,
      enableVersioning: true,
      enableChangeTracking: true
    },
    dataProcessing: {
      enableTransformation: true,
      enableValidation: true,
      stopOnFirstError: false,
      enableAuditLogging: true,
      transformationTimeout: 10,
      validationTimeout: 5
    },
    monitoring: {
      enableRealTimeMetrics: true,
      enableAlerts: true,
      metricsRetention: 30,
      alertThresholds: {
        errorRate: 5.0,
        responseTime: 5000,
        syncFailureRate: 10.0
      }
    },
    performance: {
      enableCaching: true,
      cacheTimeout: 30,
      enableCompression: true,
      enableRequestBatching: true,
      maxRequestsPerSecond: 10
    }
  };

  constructor(customConfig?: Partial<QuickBooksIntegrationConfig>) {
    this.config = this.mergeConfig(this.defaultConfig, customConfig || {});

    // Initialize services
    this.oauthService = createEnhancedQuickBooksOAuthService(this.config.oauth.retryConfig);
    this.webhookProcessor = createEnhancedWebhookProcessor({
      enableSignatureVerification: this.config.webhooks.enableSignatureVerification,
      enableDeduplication: this.config.webhooks.enableDeduplication,
      deduplicationWindowMs: this.config.webhooks.deduplicationWindow * 60 * 1000,
      maxRetries: this.config.webhooks.maxRetries,
      retryDelayMs: this.config.webhooks.retryDelay * 60 * 1000,
      batchSize: this.config.webhooks.batchSize
    });
    this.dashboardService = createSyncMonitoringDashboard();
    this.dataTransformationPipeline = createDataTransformationPipeline();
    this.diagnostics = createIntegrationDiagnostics();

    // Start metrics collection if enabled
    if (this.config.monitoring.enableRealTimeMetrics) {
      this.startMetricsCollection();
    }
  }

  /**
   * Initialize QuickBooks connection for an organization
   */
  async initializeConnection(
    organizationId: string,
    options: {
      connectionName?: string;
      isAdditionalConnection?: boolean;
      redirectUrl?: string;
    } = {}
  ): Promise<{ authUrl: string; state: string; connectionId: string }> {
    try {
      console.log(`Initializing QuickBooks connection for organization ${organizationId}`);

      // Generate OAuth URL
      const authResult = await this.oauthService.generateAuthUrl(organizationId, {
        connectionName: options.connectionName,
        isAdditionalConnection: options.isAdditionalConnection,
        redirectUrl: options.redirectUrl
      });

      // Log connection attempt
      await this.logIntegrationEvent(organizationId, 'connection_initiated', {
        connectionId: authResult.connectionId,
        connectionName: options.connectionName,
        isAdditionalConnection: options.isAdditionalConnection
      });

      return authResult;

    } catch (error) {
      console.error('Error initializing QuickBooks connection:', error);
      await this.logIntegrationEvent(organizationId, 'connection_init_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Complete OAuth flow and establish connection
   */
  async completeConnection(
    code: string,
    state: string,
    realmId: string
  ): Promise<{ success: boolean; connectionId: string; organizationId: string }> {
    try {
      // Exchange code for tokens
      const tokenResult = await this.oauthService.exchangeCodeForTokens(code, state, realmId);

      console.log(`QuickBooks connection completed for organization ${tokenResult.connectionId}`);

      // Run initial diagnostics
      const diagnosticReport = await this.diagnostics.runDiagnostics(
        tokenResult.organizationId,
        tokenResult.connectionId,
        { categories: ['connection', 'authentication', 'permissions'] }
      );

      // Log connection completion
      await this.logIntegrationEvent(tokenResult.organizationId, 'connection_completed', {
        connectionId: tokenResult.connectionId,
        realmId: tokenResult.realmId,
        diagnosticScore: diagnosticReport.overallScore,
        diagnosticStatus: diagnosticReport.overallStatus
      });

      // Schedule initial sync if connection is healthy
      if (diagnosticReport.overallScore >= 75) {
        await this.scheduleInitialSync(tokenResult.organizationId, tokenResult.connectionId);
      }

      return {
        success: true,
        connectionId: tokenResult.connectionId,
        organizationId: tokenResult.organizationId
      };

    } catch (error) {
      console.error('Error completing QuickBooks connection:', error);
      throw error;
    }
  }

  /**
   * Get all connections for an organization
   */
  async getConnections(organizationId: string): Promise<QuickBooksConnection[]> {
    try {
      const connections = await this.oauthService.getOrganizationConnections(organizationId);

      return connections.map(conn => ({
        connectionId: conn.connectionId,
        organizationId: conn.organizationId,
        organizationName: 'Organization', // Would be fetched from organization table
        realmId: conn.realmId,
        connectionName: conn.connectionName,
        status: conn.status,
        isDefault: conn.isDefault,
        createdAt: conn.createdAt,
        lastUsedAt: conn.lastUsedAt,
        lastSyncAt: null, // Would be fetched from sync records
        expiresAt: new Date(), // Would be fetched from token record
        metadata: {
          errorDetails: conn.errorDetails
        }
      }));

    } catch (error) {
      console.error('Error getting connections:', error);
      throw error;
    }
  }

  /**
   * Trigger manual sync for specific entities
   */
  async triggerSync(
    organizationId: string,
    options: {
      connectionId?: string;
      entityTypes?: string[];
      syncType?: 'full' | 'incremental';
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<SyncOperation> {
    try {
      console.log(`Triggering sync for organization ${organizationId}`, options);

      // Validate connection
      const connectionId = options.connectionId || 'default';
      const hasConnection = await this.oauthService.hasValidConnection(organizationId, connectionId);

      if (!hasConnection) {
        throw new Error('No valid QuickBooks connection found');
      }

      // Initialize sync engine for organization
      const tokenInfo = await this.oauthService.getTokenInfo(organizationId, connectionId);
      if (!tokenInfo) {
        throw new Error('Unable to get token information');
      }

      this.syncEngine = createAdvancedSyncEngine(organizationId, tokenInfo.realmId);

      // Create sync operation record
      const syncOperation: SyncOperation = {
        syncId: this.generateSyncId(),
        organizationId,
        connectionId,
        entityType: options.entityTypes?.join(',') || 'all',
        syncType: 'manual',
        status: 'pending',
        progress: {
          totalRecords: 0,
          processedRecords: 0,
          successfulRecords: 0,
          failedRecords: 0,
          conflictedRecords: 0
        },
        startedAt: new Date(),
        metadata: {
          triggeredBy: 'user',
          priority: options.priority || 'normal',
          syncType: options.syncType || 'incremental',
          entityTypes: options.entityTypes || ['all']
        }
      };

      this.activeOperations.set(syncOperation.syncId, syncOperation);

      // Start sync process
      this.performSync(syncOperation, options).catch(error => {
        console.error('Sync operation failed:', error);
        syncOperation.status = 'failed';
        syncOperation.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        syncOperation.completedAt = new Date();
      });

      return syncOperation;

    } catch (error) {
      console.error('Error triggering sync:', error);
      throw error;
    }
  }

  /**
   * Process webhook payload
   */
  async processWebhook(
    payload: any,
    signature?: string,
    timestamp?: string
  ): Promise<{
    success: boolean;
    processed: number;
    skipped: number;
    failed: number;
    processingId: string;
  }> {
    try {
      if (!this.config.webhooks.enableProcessing) {
        throw new Error('Webhook processing is disabled');
      }

      console.log('Processing QuickBooks webhook payload', {
        eventCount: payload.eventNotifications?.length || 0,
        hasSignature: !!signature
      });

      const result = await this.webhookProcessor.processWebhookPayload(payload, signature, timestamp);

      // Log webhook processing
      await this.logIntegrationEvent('system', 'webhook_processed', {
        processingId: result.processingId,
        processed: result.processed,
        skipped: result.skipped,
        failed: result.failed,
        success: result.success
      });

      return result;

    } catch (error) {
      console.error('Error processing webhook:', error);
      await this.logIntegrationEvent('system', 'webhook_processing_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get integration status and health
   */
  async getIntegrationStatus(organizationId?: string): Promise<IntegrationStatus> {
    try {
      const [healthStatus, realtimeMetrics] = await Promise.all([
        this.dashboardService.getHealthStatus(),
        this.dashboardService.getRealtimeMetrics(organizationId)
      ]);

      return {
        overall: healthStatus.overall,
        components: {
          oauth: {
            status: healthStatus.components.oauth.status,
            message: 'OAuth system operational',
            lastCheck: healthStatus.lastChecked,
            metrics: healthStatus.components.oauth.details
          },
          api: {
            status: healthStatus.components.api.status,
            message: 'API connectivity normal',
            lastCheck: healthStatus.lastChecked,
            metrics: healthStatus.components.api.details
          },
          sync: {
            status: healthStatus.components.sync.status,
            message: 'Sync operations running',
            lastCheck: healthStatus.lastChecked,
            metrics: healthStatus.components.sync.details
          },
          webhooks: {
            status: healthStatus.components.webhooks.status,
            message: 'Webhook processing active',
            lastCheck: healthStatus.lastChecked,
            metrics: healthStatus.components.webhooks.details
          },
          dataProcessing: {
            status: 'healthy',
            message: 'Data processing pipeline operational',
            lastCheck: new Date()
          },
          monitoring: {
            status: 'healthy',
            message: 'Monitoring systems active',
            lastCheck: new Date()
          }
        },
        metrics: realtimeMetrics,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting integration status:', error);
      return {
        overall: 'unhealthy',
        components: {} as any,
        metrics: {
          activeConnections: 0,
          syncThroughput: 0,
          errorRate: 100,
          averageResponseTime: 0,
          webhookEvents: 0
        },
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics(
    organizationId: string,
    options: {
      connectionId?: string;
      categories?: string[];
      autoFix?: boolean;
    } = {}
  ): Promise<any> {
    try {
      console.log(`Running diagnostics for organization ${organizationId}`, options);

      const report = await this.diagnostics.runDiagnostics(organizationId, options.connectionId, {
        categories: options.categories as any,
        autoFix: options.autoFix,
        includePerformanceTests: true
      });

      // Log diagnostics completion
      await this.logIntegrationEvent(organizationId, 'diagnostics_completed', {
        reportId: report.reportId,
        overallScore: report.overallScore,
        overallStatus: report.overallStatus,
        totalTests: report.summary.totalTests,
        passedTests: report.summary.passedTests,
        failedTests: report.summary.failedTests
      });

      return report;

    } catch (error) {
      console.error('Error running diagnostics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(
    organizationId?: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<any> {
    try {
      return await this.dashboardService.getDashboardMetrics({
        organizationId,
        timeRange
      });

    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Transform and validate data
   */
  async processData(
    data: any,
    entityType: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<any> {
    try {
      if (!this.config.dataProcessing.enableTransformation && !this.config.dataProcessing.enableValidation) {
        return { finalData: data, transformationResult: null, validationResult: null };
      }

      const result = await this.dataTransformationPipeline.processData(data, entityType, operation, {
        enableTransformation: this.config.dataProcessing.enableTransformation,
        enableValidation: this.config.dataProcessing.enableValidation,
        stopOnFirstError: this.config.dataProcessing.stopOnFirstError,
        enableAuditLogging: this.config.dataProcessing.enableAuditLogging,
        transformationTimeout: this.config.dataProcessing.transformationTimeout * 1000,
        validationTimeout: this.config.dataProcessing.validationTimeout * 1000
      });

      return result;

    } catch (error) {
      console.error('Error processing data:', error);
      throw error;
    }
  }

  /**
   * Revoke connection
   */
  async revokeConnection(
    organizationId: string,
    connectionId?: string,
    revokeAll = false
  ): Promise<void> {
    try {
      console.log(`Revoking QuickBooks connection for organization ${organizationId}`, {
        connectionId,
        revokeAll
      });

      await this.oauthService.revokeAccess(organizationId, connectionId, revokeAll);

      // Log revocation
      await this.logIntegrationEvent(organizationId, 'connection_revoked', {
        connectionId,
        revokeAll
      });

    } catch (error) {
      console.error('Error revoking connection:', error);
      throw error;
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down QuickBooks integration...');

      // Stop metrics collection
      if (this.metricsCollector) {
        clearInterval(this.metricsCollector);
        this.metricsCollector = null;
      }

      // Cancel active operations
      for (const [syncId, operation] of this.activeOperations.entries()) {
        if (operation.status === 'running' || operation.status === 'pending') {
          operation.status = 'cancelled';
          operation.completedAt = new Date();
          operation.errorMessage = 'System shutdown';
        }
      }

      this.activeOperations.clear();

      console.log('QuickBooks integration shutdown complete');

    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  // Private helper methods

  private async performSync(operation: SyncOperation, options: any): Promise<void> {
    try {
      operation.status = 'running';

      if (!this.syncEngine) {
        throw new Error('Sync engine not initialized');
      }

      const entityTypes = options.entityTypes || ['customer', 'invoice', 'account', 'item'];

      for (const entityType of entityTypes) {
        console.log(`Syncing ${entityType} for organization ${operation.organizationId}`);

        const syncResult = await this.syncEngine.performIncrementalSync(entityType, {
          conflictResolution: 'auto',
          forceFullSync: options.syncType === 'full',
          customConfig: {
            enableAutoResolution: this.config.sync.enableConflictResolution,
            autoResolutionStrategy: this.config.sync.autoResolutionStrategy,
            batchSize: this.config.sync.batchSize,
            maxConcurrentBatches: this.config.sync.maxConcurrentBatches
          }
        });

        // Update operation progress
        operation.progress.totalRecords += syncResult.metadata.totalChanges;
        operation.progress.processedRecords += syncResult.creates.length + syncResult.updates.length;
        operation.progress.conflictedRecords += syncResult.conflicts.length;
      }

      operation.status = 'completed';
      operation.completedAt = new Date();

      // Log sync completion
      await this.logIntegrationEvent(operation.organizationId, 'sync_completed', {
        syncId: operation.syncId,
        progress: operation.progress,
        duration: operation.completedAt.getTime() - operation.startedAt.getTime()
      });

    } catch (error) {
      operation.status = 'failed';
      operation.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operation.completedAt = new Date();

      await this.logIntegrationEvent(operation.organizationId, 'sync_failed', {
        syncId: operation.syncId,
        error: operation.errorMessage
      });

      throw error;
    } finally {
      this.activeOperations.delete(operation.syncId);
    }
  }

  private async scheduleInitialSync(organizationId: string, connectionId: string): Promise<void> {
    try {
      // Schedule initial sync after a short delay to allow connection to stabilize
      setTimeout(async () => {
        try {
          await this.triggerSync(organizationId, {
            connectionId,
            syncType: 'full',
            priority: 'normal'
          });
        } catch (error) {
          console.error('Initial sync failed:', error);
        }
      }, 30000); // 30 seconds delay

    } catch (error) {
      console.error('Error scheduling initial sync:', error);
    }
  }

  private startMetricsCollection(): void {
    this.metricsCollector = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 60000); // Collect metrics every minute
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect and store metrics
      const metrics = await this.dashboardService.getRealtimeMetrics();

      // Store in Redis for real-time access
      if (redis) {
        await redis.setex('qb_integration_metrics', 300, JSON.stringify({
          ...metrics,
          timestamp: new Date()
        }));
      }

      // Check alert thresholds
      await this.checkAlertThresholds(metrics);

    } catch (error) {
      console.error('Error in metrics collection:', error);
    }
  }

  private async checkAlertThresholds(metrics: any): Promise<void> {
    const thresholds = this.config.monitoring.alertThresholds;

    // Check error rate
    if (metrics.errorRate > thresholds.errorRate) {
      await this.dashboardService.createSyncAlert({
        type: 'error',
        severity: 'high',
        title: 'High Error Rate Detected',
        message: `Error rate (${metrics.errorRate.toFixed(1)}%) exceeds threshold (${thresholds.errorRate}%)`,
        metadata: { errorRate: metrics.errorRate, threshold: thresholds.errorRate }
      });
    }

    // Check sync failure rate
    if (metrics.syncFailureRate && metrics.syncFailureRate > thresholds.syncFailureRate) {
      await this.dashboardService.createSyncAlert({
        type: 'warning',
        severity: 'medium',
        title: 'High Sync Failure Rate',
        message: `Sync failure rate (${metrics.syncFailureRate.toFixed(1)}%) exceeds threshold (${thresholds.syncFailureRate}%)`,
        metadata: { syncFailureRate: metrics.syncFailureRate, threshold: thresholds.syncFailureRate }
      });
    }
  }

  private async logIntegrationEvent(organizationId: string, eventType: string, metadata: any): Promise<void> {
    try {
      await prisma.integrationEvent.create({
        data: {
          organizationId,
          integration: 'quickbooks',
          eventType,
          metadata: {
            timestamp: new Date(),
            ...metadata
          }
        }
      });
    } catch (error) {
      console.warn('Failed to log integration event:', error);
    }
  }

  private mergeConfig(
    defaultConfig: QuickBooksIntegrationConfig,
    customConfig: Partial<QuickBooksIntegrationConfig>
  ): QuickBooksIntegrationConfig {
    return {
      oauth: { ...defaultConfig.oauth, ...customConfig.oauth },
      webhooks: { ...defaultConfig.webhooks, ...customConfig.webhooks },
      sync: { ...defaultConfig.sync, ...customConfig.sync },
      dataProcessing: { ...defaultConfig.dataProcessing, ...customConfig.dataProcessing },
      monitoring: { ...defaultConfig.monitoring, ...customConfig.monitoring },
      performance: { ...defaultConfig.performance, ...customConfig.performance }
    };
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Factory function
export function createEnhancedQuickBooksIntegration(
  config?: Partial<QuickBooksIntegrationConfig>
): EnhancedQuickBooksIntegration {
  return new EnhancedQuickBooksIntegration(config);
}

// Export types and interfaces
export type {
  QuickBooksIntegrationConfig,
  IntegrationStatus,
  ComponentStatus,
  QuickBooksConnection,
  SyncOperation
};

// Export service creators for direct use
export {
  createEnhancedQuickBooksOAuthService,
  createQuickBooksApiClient,
  createEnhancedWebhookProcessor,
  createAdvancedSyncEngine,
  createSyncMonitoringDashboard,
  createDataTransformationPipeline,
  createIntegrationDiagnostics
};

/**
 * Usage Example:
 *
 * import { createEnhancedQuickBooksIntegration } from './enhanced-quickbooks-integration';
 *
 * const qbIntegration = createEnhancedQuickBooksIntegration({
 *   sync: {
 *     enableConflictResolution: true,
 *     autoResolutionStrategy: 'remote_wins'
 *   },
 *   monitoring: {
 *     enableRealTimeMetrics: true,
 *     alertThresholds: {
 *       errorRate: 3.0,
 *       responseTime: 3000,
 *       syncFailureRate: 5.0
 *     }
 *   }
 * });
 *
 * // Initialize connection
 * const authResult = await qbIntegration.initializeConnection('org-123', {
 *   connectionName: 'Primary QB Connection'
 * });
 *
 * // Process webhook
 * const webhookResult = await qbIntegration.processWebhook(payload, signature);
 *
 * // Trigger sync
 * const syncOperation = await qbIntegration.triggerSync('org-123', {
 *   entityTypes: ['customer', 'invoice'],
 *   syncType: 'incremental'
 * });
 *
 * // Get status
 * const status = await qbIntegration.getIntegrationStatus('org-123');
 *
 * // Run diagnostics
 * const diagnostics = await qbIntegration.runDiagnostics('org-123', {
 *   autoFix: true
 * });
 */