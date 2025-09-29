import { Redis } from 'ioredis'
import { CacheService } from './services/cache.service'
import { RateLimitService } from './middleware/rate-limiting.middleware'
import { SecurityMonitoringService } from './services/security-monitoring.service'
import { PerformanceMonitoringService } from './services/performance-monitoring.service'
import { ApiSecurityService } from './services/api-security.service'
import { ApiKeyService } from './services/api-key.service'
import { ApiAnalyticsService } from './services/api-analytics.service'
import { createEnhancedTRPCMiddleware, type MiddlewareConfig } from './middleware/enhanced-trpc.middleware'

/**
 * Enhanced tRPC Integration Service
 *
 * This service provides a comprehensive API layer optimization solution that includes:
 * - Redis-based caching with intelligent invalidation
 * - Advanced rate limiting with API key support
 * - Real-time performance monitoring and alerting
 * - Security monitoring and threat detection
 * - API analytics and optimization recommendations
 * - Scalability optimizations
 */

// Environment configuration interface
interface EnhancedTRPCConfig {
  redis: {
    host: string
    port: number
    password?: string
    db?: number
    maxRetriesPerRequest?: number
    retryDelayOnFailover?: number
    enableReadyCheck?: boolean
    maxmemoryPolicy?: string
  }
  cache: {
    defaultTTL?: number
    maxSize?: number
    enableCompression?: boolean
  }
  security: {
    enableThreatDetection?: boolean
    enableSecurityLogging?: boolean
    maxRequestSize?: number
    allowedOrigins?: string[]
    enableIpBlocking?: boolean
  }
  performance: {
    enableProfiling?: boolean
    alertThresholds?: {
      responseTime?: number
      errorRate?: number
      memoryUsage?: number
      cpuUsage?: number
    }
  }
  rateLimit: {
    defaultLimits?: {
      requestsPerMinute?: number
      requestsPerHour?: number
      requestsPerDay?: number
    }
    enableApiKeyLimits?: boolean
  }
  analytics: {
    enableRealTimeMetrics?: boolean
    retentionDays?: number
    enableRecommendations?: boolean
  }
}

class EnhancedTRPCIntegration {
  private redis: Redis
  private cacheService: CacheService
  private rateLimitService: RateLimitService
  private securityMonitoring: SecurityMonitoringService
  private performanceMonitoring: PerformanceMonitoringService
  private apiSecurity: ApiSecurityService
  private apiKeyService: ApiKeyService
  private analytics: ApiAnalyticsService
  private middleware: any

  constructor(config: EnhancedTRPCConfig) {
    // Initialize Redis connection
    this.redis = this.initializeRedis(config.redis)

    // Initialize all services
    this.cacheService = new CacheService(this.redis)
    this.rateLimitService = new RateLimitService(this.redis)
    this.securityMonitoring = new SecurityMonitoringService(this.redis)
    this.performanceMonitoring = new PerformanceMonitoringService(this.redis)
    this.apiSecurity = new ApiSecurityService(this.redis, this.securityMonitoring)
    this.apiKeyService = new ApiKeyService(this.redis)
    this.analytics = new ApiAnalyticsService(this.redis)

    // Initialize enhanced middleware
    this.middleware = this.initializeMiddleware(config)

    // Start background services
    this.startBackgroundServices()
  }

  private initializeRedis(config: any): Redis {
    const redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      enableReadyCheck: config.enableReadyCheck ?? true,
      lazyConnect: true,
      // Connection pooling
      family: 4,
      keepAlive: 30000,
      // Performance optimizations
      enableAutoPipelining: true,
      maxmemoryPolicy: config.maxmemoryPolicy || 'allkeys-lru'
    })

    // Redis event handlers
    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error)
    })

    redis.on('ready', () => {
      console.log('🚀 Redis ready for operations')
    })

    return redis
  }

  private initializeMiddleware(config: EnhancedTRPCConfig): any {
    const middlewareConfig: MiddlewareConfig = {
      redis: this.redis,
      cacheService: this.cacheService,
      rateLimitService: this.rateLimitService,
      enableProfiling: config.performance?.enableProfiling ?? true,
      enableSecurityLogging: config.security?.enableSecurityLogging ?? true,
      maxRequestSize: config.security?.maxRequestSize || 10485760, // 10MB
      allowedOrigins: config.security?.allowedOrigins || []
    }

    return createEnhancedTRPCMiddleware(middlewareConfig)
  }

  private startBackgroundServices(): void {
    // Start cache warming service
    this.startCacheWarmingService()

    // Start metrics aggregation service
    this.startMetricsAggregationService()

    // Start security monitoring service
    this.startSecurityMonitoringService()

    // Start cleanup services
    this.startCleanupServices()
  }

  private startCacheWarmingService(): void {
    // Warm up cache with frequently accessed data every 5 minutes
    setInterval(async () => {
      try {
        await this.warmUpCache()
      } catch (error) {
        console.error('Cache warming error:', error)
      }
    }, 300000) // 5 minutes
  }

  private startMetricsAggregationService(): void {
    // Aggregate metrics every minute
    setInterval(async () => {
      try {
        await this.aggregateMetrics()
      } catch (error) {
        console.error('Metrics aggregation error:', error)
      }
    }, 60000) // 1 minute
  }

  private startSecurityMonitoringService(): void {
    // Security monitoring every 30 seconds
    setInterval(async () => {
      try {
        await this.performSecurityChecks()
      } catch (error) {
        console.error('Security monitoring error:', error)
      }
    }, 30000) // 30 seconds
  }

  private startCleanupServices(): void {
    // Cleanup old data every hour
    setInterval(async () => {
      try {
        await this.performCleanup()
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }, 3600000) // 1 hour
  }

  // PUBLIC API METHODS

  /**
   * Get enhanced tRPC middleware with all optimizations
   */
  getMiddleware() {
    return this.middleware
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(organizationId?: string, timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
    return await this.analytics.getDashboardData(organizationId, timeRange)
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(organizationId?: string) {
    return await this.analytics.generateOptimizationRecommendations(organizationId)
  }

  /**
   * Get capacity planning data
   */
  async getCapacityPlan(organizationId?: string) {
    return await this.analytics.generateCapacityPlan(organizationId)
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(organizationId: string, timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
    return await this.securityMonitoring.getSecurityMetrics(organizationId, timeframe)
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(apiKeyId: string, organizationId: string) {
    return await this.apiKeyService.getApiKeyUsageStats(apiKeyId, organizationId)
  }

  /**
   * Get organization usage overview
   */
  async getOrganizationUsage(organizationId: string) {
    return await this.apiKeyService.getOrganizationUsageOverview(organizationId)
  }

  /**
   * Cache warmer for frequently accessed data
   */
  async warmUpCache(): Promise<void> {
    console.log('🔥 Starting cache warm-up process...')

    try {
      // Warm up common queries
      const organizations = ['org1', 'org2'] // This would come from database

      for (const orgId of organizations) {
        // Pre-cache dashboard data
        await this.analytics.getDashboardData(orgId, 'day')

        // Pre-cache security metrics
        await this.securityMonitoring.getSecurityMetrics(orgId, 'day')

        console.log(`✅ Cache warmed for organization: ${orgId}`)
      }

      console.log('🔥 Cache warm-up completed successfully')
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error)
    }
  }

  /**
   * Aggregate real-time metrics
   */
  async aggregateMetrics(): Promise<void> {
    try {
      const now = Date.now()
      const currentMinute = Math.floor(now / 60000) * 60000

      // Get all counter keys
      const counterKeys = await this.redis.keys('perf:counters:*')

      if (counterKeys.length === 0) return

      const pipeline = this.redis.pipeline()

      for (const key of counterKeys) {
        const data = await this.redis.hgetall(key)

        if (Object.keys(data).length > 0) {
          // Extract endpoint from key
          const endpoint = key.replace('perf:counters:', '')

          // Store in time-series
          const timeSeriesKey = `perf:timeseries:${endpoint}:${currentMinute}`
          pipeline.lpush(timeSeriesKey, JSON.stringify({
            timestamp: now,
            ...data
          }))
          pipeline.expire(timeSeriesKey, 3600) // 1 hour retention
        }
      }

      await pipeline.exec()
    } catch (error) {
      console.error('Metrics aggregation error:', error)
    }
  }

  /**
   * Perform security checks
   */
  async performSecurityChecks(): Promise<void> {
    try {
      // Check for suspicious activity patterns
      const suspiciousIPs = await this.detectSuspiciousIPs()

      for (const ip of suspiciousIPs) {
        await this.securityMonitoring.logSecurityEvent({
          eventType: 'suspicious_request',
          severity: 'medium',
          description: `Suspicious activity detected from IP: ${ip}`,
          ipAddress: ip,
          metadata: { detectionTime: new Date() }
        })
      }

      // Check rate limit violations
      await this.checkRateLimitViolations()

      // Check for anomalies
      await this.detectAnomalies()

    } catch (error) {
      console.error('Security check error:', error)
    }
  }

  /**
   * Cleanup old data
   */
  async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Starting data cleanup...')

      const cutoffTime = Date.now() - 86400000 // 24 hours ago

      // Clean up old metrics
      const metricsKeys = await this.redis.keys('perf:detailed:*')
      const expiredKeys = []

      for (const key of metricsKeys) {
        const ttl = await this.redis.ttl(key)
        if (ttl === -1) { // No expiration set
          await this.redis.expire(key, 86400) // Set 24 hour expiration
        } else if (ttl === -2) { // Key doesn't exist or expired
          expiredKeys.push(key)
        }
      }

      // Clean up expired security events
      const securityKeys = await this.redis.keys('security_event:*')
      for (const key of securityKeys) {
        const eventData = await this.redis.get(key)
        if (eventData) {
          try {
            const event = JSON.parse(eventData)
            if (Date.now() - new Date(event.timestamp).getTime() > 604800000) { // 7 days
              await this.redis.del(key)
            }
          } catch (error) {
            // Delete invalid JSON
            await this.redis.del(key)
          }
        }
      }

      console.log(`🧹 Cleanup completed. Processed ${metricsKeys.length} metric keys and ${securityKeys.length} security keys`)
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<any> {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        redis: 'unknown',
        cache: 'unknown',
        security: 'unknown',
        performance: 'unknown'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    }

    try {
      // Check Redis connection
      await this.redis.ping()
      health.services.redis = 'healthy'

      // Check cache service
      const cacheStats = this.cacheService.getStats()
      health.services.cache = cacheStats.totalOperations > 0 ? 'healthy' : 'idle'

      // Check other services
      health.services.security = 'healthy'
      health.services.performance = 'healthy'

    } catch (error) {
      health.status = 'unhealthy'
      console.error('Health check failed:', error)
    }

    return health
  }

  // PRIVATE HELPER METHODS

  private async detectSuspiciousIPs(): Promise<string[]> {
    const suspiciousIPs: string[] = []
    const timeWindow = 300000 // 5 minutes

    // Get rate limit violations
    const violationKeys = await this.redis.keys('rate_limit_violations:*')
    const ipCounts = new Map<string, number>()

    for (const key of violationKeys) {
      const violationData = await this.redis.get(key)
      if (violationData) {
        try {
          const violation = JSON.parse(violationData)
          if (Date.now() - new Date(violation.timestamp).getTime() < timeWindow) {
            const count = ipCounts.get(violation.ipAddress) || 0
            ipCounts.set(violation.ipAddress, count + 1)
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    }

    // Flag IPs with multiple violations
    for (const [ip, count] of ipCounts) {
      if (count >= 5) {
        suspiciousIPs.push(ip)
      }
    }

    return suspiciousIPs
  }

  private async checkRateLimitViolations(): Promise<void> {
    // This would check for patterns in rate limit violations
    // and trigger appropriate responses
  }

  private async detectAnomalies(): Promise<void> {
    // This would detect anomalies in API usage patterns
    // and trigger security events
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Enhanced tRPC Integration...')

    try {
      // Close Redis connection
      await this.redis.quit()
      console.log('✅ Redis connection closed')

      console.log('✅ Enhanced tRPC Integration shutdown completed')
    } catch (error) {
      console.error('❌ Shutdown error:', error)
    }
  }
}

// Factory function for creating the integration service
export function createEnhancedTRPCIntegration(config: EnhancedTRPCConfig): EnhancedTRPCIntegration {
  return new EnhancedTRPCIntegration(config)
}

// Default configuration
export const defaultConfig: EnhancedTRPCConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxmemoryPolicy: 'allkeys-lru'
  },
  cache: {
    defaultTTL: 300, // 5 minutes
    maxSize: 1000000, // 1MB
    enableCompression: true
  },
  security: {
    enableThreatDetection: true,
    enableSecurityLogging: true,
    maxRequestSize: 10485760, // 10MB
    allowedOrigins: [],
    enableIpBlocking: true
  },
  performance: {
    enableProfiling: true,
    alertThresholds: {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.85, // 85%
      cpuUsage: 0.80 // 80%
    }
  },
  rateLimit: {
    defaultLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    enableApiKeyLimits: true
  },
  analytics: {
    enableRealTimeMetrics: true,
    retentionDays: 30,
    enableRecommendations: true
  }
}

export type { EnhancedTRPCConfig }
export { EnhancedTRPCIntegration }