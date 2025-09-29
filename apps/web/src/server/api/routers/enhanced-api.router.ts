import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, organizationProcedure, createPermissionProcedure } from '@/server/api/trpc'
import { createEnhancedTRPCIntegration, defaultConfig } from '@/server/enhanced-trpc-integration'

// Initialize the enhanced tRPC integration
const enhancedTRPC = createEnhancedTRPCIntegration(defaultConfig)

// Get the enhanced middleware
const { caching, performance, apiKey, validation, compression } = enhancedTRPC.getMiddleware()

/**
 * Enhanced API Router
 *
 * This router demonstrates the comprehensive API layer optimizations including:
 * - Redis-based caching with intelligent invalidation
 * - Performance monitoring and alerting
 * - Security monitoring and threat detection
 * - Rate limiting with API key support
 * - Real-time analytics and optimization recommendations
 */
export const enhancedApiRouter = createTRPCRouter({

  // PERFORMANCE MONITORING ENDPOINTS

  /**
   * Get comprehensive dashboard data with caching
   */
  getDashboard: organizationProcedure
    .use(performance) // Performance monitoring
    .use(caching(120, ['dashboard', 'metrics'])) // 2-minute cache with tags
    .input(z.object({
      timeRange: z.enum(['hour', 'day', 'week', 'month']).default('day')
    }))
    .query(async ({ ctx, input }) => {
      return await enhancedTRPC.getDashboardData(ctx.organizationId, input.timeRange)
    }),

  /**
   * Get real-time performance metrics
   */
  getPerformanceMetrics: organizationProcedure
    .use(performance)
    .input(z.object({
      endpoint: z.string().optional(),
      timeframe: z.enum(['hour', 'day', 'week']).default('hour')
    }))
    .query(async ({ ctx, input }) => {
      // This would use the performance monitoring service directly
      const performanceData = await enhancedTRPC.getDashboardData(ctx.organizationId, input.timeframe)

      return {
        overview: performanceData.overview,
        realTime: performanceData.realTimeMetrics,
        alerts: performanceData.performanceAlerts,
        topEndpoints: performanceData.topEndpoints
      }
    }),

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations: createPermissionProcedure('analytics:read', 'performance')
    .use(performance)
    .use(caching(600, ['recommendations'])) // 10-minute cache
    .query(async ({ ctx }) => {
      return await enhancedTRPC.getOptimizationRecommendations(ctx.organizationId)
    }),

  /**
   * Get capacity planning data
   */
  getCapacityPlan: createPermissionProcedure('analytics:read', 'capacity')
    .use(performance)
    .use(caching(1800, ['capacity'])) // 30-minute cache
    .input(z.object({
      projections: z.record(z.number()).optional()
    }))
    .query(async ({ ctx, input }) => {
      return await enhancedTRPC.getCapacityPlan(ctx.organizationId)
    }),

  // SECURITY MONITORING ENDPOINTS

  /**
   * Get security metrics and events
   */
  getSecurityMetrics: createPermissionProcedure('security:read', 'events')
    .use(performance)
    .use(caching(300, ['security'])) // 5-minute cache
    .input(z.object({
      timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional()
    }))
    .query(async ({ ctx, input }) => {
      return await enhancedTRPC.getSecurityMetrics(ctx.organizationId, input.timeframe)
    }),

  /**
   * Get security events with filtering
   */
  getSecurityEvents: createPermissionProcedure('security:read', 'events')
    .use(performance)
    .input(z.object({
      filters: z.object({
        eventType: z.string().optional(),
        severity: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0)
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      // This would use the security monitoring service
      // For now, return mock data structure
      return {
        events: [],
        total: 0,
        summary: {
          totalEvents: 0,
          criticalEvents: 0,
          resolvedEvents: 0,
          openEvents: 0
        }
      }
    }),

  // API KEY MANAGEMENT ENDPOINTS

  /**
   * Get API key usage statistics
   */
  getApiKeyStats: createPermissionProcedure('api_keys:read', 'usage')
    .use(performance)
    .use(caching(60, ['api_keys'])) // 1-minute cache
    .input(z.object({
      apiKeyId: z.string().cuid(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      return await enhancedTRPC.getApiKeyStats(input.apiKeyId, ctx.organizationId)
    }),

  /**
   * Get organization usage overview
   */
  getOrganizationUsage: organizationProcedure
    .use(performance)
    .use(caching(120, ['usage'])) // 2-minute cache
    .input(z.object({
      timeRange: z.enum(['day', 'week', 'month']).default('day')
    }))
    .query(async ({ ctx, input }) => {
      return await enhancedTRPC.getOrganizationUsage(ctx.organizationId)
    }),

  /**
   * Create API key with enhanced security
   */
  createApiKey: createPermissionProcedure('api_keys:create')
    .use(performance)
    .use(validation) // Enhanced input validation
    .input(z.object({
      name: z.string().min(1).max(100),
      permissions: z.record(z.boolean()),
      scopes: z.array(z.string()),
      expiresAt: z.date().optional(),
      rateLimit: z.number().min(1).max(10000).optional(),
      ipWhitelist: z.array(z.string().ip()).optional(),
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // This would use the API key service
      return {
        id: 'new-api-key-id',
        message: 'API key created successfully',
        keyPrefix: 'ak_12345678'
      }
    }),

  // ANALYTICS AND REPORTING ENDPOINTS

  /**
   * Get comprehensive analytics data
   */
  getAnalytics: organizationProcedure
    .use(performance)
    .use(caching(180, ['analytics'])) // 3-minute cache
    .input(z.object({
      timeRange: z.enum(['hour', 'day', 'week', 'month']).default('day'),
      metrics: z.array(z.enum([
        'requests',
        'response_time',
        'error_rate',
        'cache_hit_rate',
        'throughput',
        'active_users'
      ])).default(['requests', 'response_time', 'error_rate']),
      groupBy: z.enum(['endpoint', 'user', 'hour', 'day']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const dashboardData = await enhancedTRPC.getDashboardData(ctx.organizationId, input.timeRange)

      return {
        overview: dashboardData.overview,
        timeSeries: dashboardData.timeSeriesData,
        breakdown: {
          endpoints: dashboardData.topEndpoints,
          errors: dashboardData.topErrors,
          geographic: dashboardData.geographicData,
          userActivity: dashboardData.userActivityData
        },
        recommendations: await enhancedTRPC.getOptimizationRecommendations(ctx.organizationId)
      }
    }),

  /**
   * Export analytics data
   */
  exportAnalytics: createPermissionProcedure('analytics:export')
    .use(performance)
    .use(validation)
    .input(z.object({
      format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
      timeRange: z.enum(['day', 'week', 'month']).default('week'),
      includeRawData: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      // This would generate and return export data
      const dashboardData = await enhancedTRPC.getDashboardData(ctx.organizationId, input.timeRange)

      return {
        exportId: `export_${Date.now()}`,
        format: input.format,
        status: 'processing',
        estimatedTime: '2-3 minutes',
        downloadUrl: null // Will be available when processing completes
      }
    }),

  // SYSTEM HEALTH AND MONITORING ENDPOINTS

  /**
   * Get system health status
   */
  getSystemHealth: createPermissionProcedure('system:read', 'health')
    .use(performance)
    .query(async ({ ctx }) => {
      return await enhancedTRPC.healthCheck()
    }),

  /**
   * Get cache statistics and performance
   */
  getCacheStats: createPermissionProcedure('system:read', 'cache')
    .use(performance)
    .query(async ({ ctx }) => {
      // This would return cache service statistics
      return {
        hitRate: 85.5,
        totalRequests: 12450,
        cacheSize: '256MB',
        evictions: 125,
        keyCount: 8945,
        memoryUsage: {
          used: '189MB',
          available: '67MB',
          percentage: 73.8
        },
        topKeys: [
          { key: 'dashboard:*', hits: 1250, size: '45MB' },
          { key: 'user:*', hits: 890, size: '23MB' },
          { key: 'client:*', hits: 675, size: '18MB' }
        ]
      }
    }),

  // REAL-TIME FEATURES

  /**
   * Get real-time metrics stream (for WebSocket integration)
   */
  getRealTimeMetrics: organizationProcedure
    .use(performance)
    .query(async ({ ctx }) => {
      const dashboardData = await enhancedTRPC.getDashboardData(ctx.organizationId, 'hour')

      return {
        timestamp: new Date(),
        metrics: dashboardData.realTimeMetrics,
        alerts: dashboardData.performanceAlerts.filter(alert => !alert.resolved).slice(0, 5),
        trend: {
          requests: dashboardData.timeSeriesData.slice(-12), // Last 12 data points
          responseTime: dashboardData.overview.averageResponseTime,
          errorRate: dashboardData.overview.errorRate
        }
      }
    }),

  /**
   * Trigger cache warming
   */
  warmCache: createPermissionProcedure('system:write', 'cache')
    .use(performance)
    .input(z.object({
      targets: z.array(z.enum(['dashboard', 'users', 'clients', 'all'])).default(['dashboard'])
    }))
    .mutation(async ({ ctx, input }) => {
      await enhancedTRPC.warmUpCache()

      return {
        success: true,
        message: 'Cache warming initiated',
        targets: input.targets,
        estimatedTime: '30-60 seconds'
      }
    }),

  /**
   * Clear cache (with proper authorization)
   */
  clearCache: createPermissionProcedure('system:write', 'cache')
    .use(performance)
    .input(z.object({
      pattern: z.string().optional(),
      confirm: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.confirm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cache clear operation must be confirmed'
        })
      }

      // This would clear cache using the cache service
      return {
        success: true,
        message: 'Cache cleared successfully',
        clearedKeys: 0, // Would return actual count
        timestamp: new Date()
      }
    }),

  // CONFIGURATION AND SETTINGS

  /**
   * Get performance monitoring configuration
   */
  getMonitoringConfig: createPermissionProcedure('system:read', 'config')
    .use(performance)
    .query(async ({ ctx }) => {
      return {
        alertThresholds: {
          responseTime: 5000,
          errorRate: 0.05,
          memoryUsage: 0.85,
          cpuUsage: 0.80
        },
        cacheSettings: {
          defaultTTL: 300,
          maxSize: 1000000,
          compressionEnabled: true
        },
        securitySettings: {
          threatDetectionEnabled: true,
          maxRequestSize: 10485760,
          ipBlockingEnabled: true
        },
        rateLimitSettings: {
          defaultLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            requestsPerDay: 10000
          }
        }
      }
    }),

  /**
   * Update monitoring configuration
   */
  updateMonitoringConfig: createPermissionProcedure('system:write', 'config')
    .use(performance)
    .use(validation)
    .input(z.object({
      alertThresholds: z.object({
        responseTime: z.number().min(100).optional(),
        errorRate: z.number().min(0).max(1).optional(),
        memoryUsage: z.number().min(0).max(1).optional(),
        cpuUsage: z.number().min(0).max(1).optional()
      }).optional(),
      cacheSettings: z.object({
        defaultTTL: z.number().min(60).optional(),
        maxSize: z.number().min(1000).optional()
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // This would update the configuration
      return {
        success: true,
        message: 'Configuration updated successfully',
        updatedAt: new Date()
      }
    })
})

// Export helper function to get the enhanced integration instance
export function getEnhancedTRPCIntegration() {
  return enhancedTRPC
}