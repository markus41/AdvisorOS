import { Redis } from 'ioredis'
import { prisma } from '../db'
import { z } from 'zod'
import crypto from 'crypto'

// Performance monitoring schemas
const PerformanceMetricSchema = z.object({
  requestId: z.string(),
  endpoint: z.string(),
  method: z.string(),
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  duration: z.number(),
  cacheHit: z.boolean().optional(),
  statusCode: z.number(),
  requestSize: z.number().optional(),
  responseSize: z.number().optional(),
  memoryUsage: z.object({
    rss: z.number(),
    heapTotal: z.number(),
    heapUsed: z.number(),
    external: z.number(),
    arrayBuffers: z.number()
  }).optional(),
  cpuUsage: z.object({
    user: z.number(),
    system: z.number()
  }).optional(),
  dbQueries: z.number().optional(),
  dbQueryTime: z.number().optional(),
  timestamp: z.date().default(() => new Date())
})

interface PerformanceAlert {
  id: string
  type: 'slow_endpoint' | 'high_error_rate' | 'memory_leak' | 'cpu_spike' | 'db_performance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metric: string
  threshold: number
  actualValue: number
  organizationId?: string
  endpoint?: string
  firstDetected: Date
  lastDetected: Date
  status: 'active' | 'resolved' | 'acknowledged'
  metadata: Record<string, any>
}

interface SystemHealthMetrics {
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    total: number
    used: number
    free: number
    percentage: number
  }
  database: {
    activeConnections: number
    maxConnections: number
    avgQueryTime: number
    slowQueries: number
  }
  redis: {
    connectedClients: number
    usedMemory: number
    hitRate: number
    ops: number
  }
  api: {
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
    activeRequests: number
  }
}

interface EndpointMetrics {
  endpoint: string
  method: string
  totalRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  cacheHitRate: number
  requestsPerMinute: number
  slowestRequests: Array<{
    requestId: string
    duration: number
    timestamp: Date
    organizationId?: string
  }>
}

interface OrganizationPerformanceOverview {
  organizationId: string
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  cacheHitRate: number
  topSlowEndpoints: Array<{
    endpoint: string
    averageResponseTime: number
    requestCount: number
  }>
  performanceTrend: Array<{
    timestamp: Date
    averageResponseTime: number
    requestCount: number
    errorCount: number
  }>
  resourceUsage: {
    cpuUsage: number
    memoryUsage: number
    dbConnections: number
  }
}

export class PerformanceMonitoringService {
  private alertThresholds = {
    slowEndpoint: 5000, // 5 seconds
    highErrorRate: 0.05, // 5%
    memoryUsage: 0.85, // 85%
    cpuUsage: 0.80, // 80%
    dbQueryTime: 1000 // 1 second
  }

  private activeAlerts = new Map<string, PerformanceAlert>()

  constructor(private redis: Redis) {
    // Start background monitoring tasks
    this.startSystemMonitoring()
  }

  // PERFORMANCE METRIC COLLECTION

  async recordPerformanceMetric(metric: z.infer<typeof PerformanceMetricSchema>): Promise<void> {
    try {
      const validatedMetric = PerformanceMetricSchema.parse(metric)

      // Store in Redis for real-time analysis
      await this.storeRealTimeMetric(validatedMetric)

      // Store aggregated metrics
      await this.updateAggregatedMetrics(validatedMetric)

      // Check for performance issues
      await this.checkPerformanceThresholds(validatedMetric)

      // Store detailed metric for analysis (sample based on volume)
      if (this.shouldStoreDetailedMetric(validatedMetric)) {
        await this.storeDetailedMetric(validatedMetric)
      }
    } catch (error) {
      console.error('Failed to record performance metric:', error)
    }
  }

  private async storeRealTimeMetric(metric: any): Promise<void> {
    const pipeline = this.redis.pipeline()
    const now = Date.now()
    const minute = Math.floor(now / 60000) * 60000

    // Store in time-series for real-time monitoring
    const timeSeriesKey = `perf:timeseries:${metric.endpoint}:${minute}`
    pipeline.lpush(timeSeriesKey, JSON.stringify({
      timestamp: now,
      duration: metric.duration,
      statusCode: metric.statusCode,
      cacheHit: metric.cacheHit,
      organizationId: metric.organizationId
    }))
    pipeline.expire(timeSeriesKey, 3600) // 1 hour retention

    // Update real-time counters
    const counterKey = `perf:counters:${metric.endpoint}`
    pipeline.hincrby(counterKey, 'requests', 1)
    pipeline.hincrby(counterKey, 'total_duration', metric.duration)
    pipeline.hincrby(counterKey, metric.statusCode >= 400 ? 'errors' : 'success', 1)
    if (metric.cacheHit) {
      pipeline.hincrby(counterKey, 'cache_hits', 1)
    }
    pipeline.expire(counterKey, 3600)

    // Organization-specific metrics
    if (metric.organizationId) {
      const orgKey = `perf:org:${metric.organizationId}:${minute}`
      pipeline.hincrby(orgKey, 'requests', 1)
      pipeline.hincrby(orgKey, 'total_duration', metric.duration)
      pipeline.hincrby(orgKey, metric.statusCode >= 400 ? 'errors' : 'success', 1)
      pipeline.expire(orgKey, 86400) // 24 hour retention
    }

    await pipeline.exec()
  }

  private async updateAggregatedMetrics(metric: any): Promise<void> {
    const now = new Date()
    const hour = now.toISOString().slice(0, 13)
    const day = now.toISOString().slice(0, 10)

    // Hourly aggregation
    const hourlyKey = `perf:hourly:${metric.endpoint}:${hour}`
    await this.updateAggregation(hourlyKey, metric, 72 * 3600) // 3 days

    // Daily aggregation
    const dailyKey = `perf:daily:${metric.endpoint}:${day}`
    await this.updateAggregation(dailyKey, metric, 30 * 24 * 3600) // 30 days
  }

  private async updateAggregation(key: string, metric: any, ttl: number): Promise<void> {
    const pipeline = this.redis.pipeline()

    pipeline.hincrby(key, 'requests', 1)
    pipeline.hincrby(key, 'total_duration', metric.duration)
    pipeline.hincrby(key, metric.statusCode >= 400 ? 'errors' : 'success', 1)

    if (metric.requestSize) {
      pipeline.hincrby(key, 'total_request_size', metric.requestSize)
    }
    if (metric.responseSize) {
      pipeline.hincrby(key, 'total_response_size', metric.responseSize)
    }
    if (metric.cacheHit) {
      pipeline.hincrby(key, 'cache_hits', 1)
    }

    // Store percentile data
    const durationKey = `${key}:durations`
    pipeline.zadd(durationKey, metric.duration, `${Date.now()}:${crypto.randomUUID()}`)
    pipeline.expire(durationKey, ttl)

    pipeline.expire(key, ttl)
    await pipeline.exec()
  }

  private shouldStoreDetailedMetric(metric: any): boolean {
    // Store 1% of requests for detailed analysis, but always store slow/error requests
    return metric.duration > 1000 || metric.statusCode >= 400 || Math.random() < 0.01
  }

  private async storeDetailedMetric(metric: any): Promise<void> {
    const metricKey = `perf:detailed:${metric.requestId}`
    await this.redis.setex(metricKey, 86400, JSON.stringify(metric)) // 24 hour retention
  }

  // PERFORMANCE ANALYSIS

  async getEndpointMetrics(
    endpoint: string,
    timeframe: 'hour' | 'day' | 'week' = 'hour'
  ): Promise<EndpointMetrics> {
    const now = new Date()
    let startTime: Date
    let aggregationKey: string

    switch (timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 3600000)
        aggregationKey = 'hourly'
        break
      case 'day':
        startTime = new Date(now.getTime() - 86400000)
        aggregationKey = 'hourly'
        break
      case 'week':
        startTime = new Date(now.getTime() - 604800000)
        aggregationKey = 'daily'
        break
    }

    // Get aggregated data from Redis
    const keys = await this.getAggregationKeys(endpoint, aggregationKey, startTime, now)
    const aggregatedData = await this.getAggregatedData(keys)

    // Calculate metrics
    const totalRequests = aggregatedData.reduce((sum, data) => sum + (data.requests || 0), 0)
    const totalDuration = aggregatedData.reduce((sum, data) => sum + (data.total_duration || 0), 0)
    const totalErrors = aggregatedData.reduce((sum, data) => sum + (data.errors || 0), 0)
    const totalCacheHits = aggregatedData.reduce((sum, data) => sum + (data.cache_hits || 0), 0)

    const averageResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0
    const cacheHitRate = totalRequests > 0 ? totalCacheHits / totalRequests : 0

    // Get percentile data
    const percentiles = await this.calculatePercentiles(endpoint, startTime, now)

    // Get slowest requests
    const slowestRequests = await this.getSlowestRequests(endpoint, startTime, now)

    const timeframeDuration = timeframe === 'hour' ? 3600000 : timeframe === 'day' ? 86400000 : 604800000
    const requestsPerMinute = totalRequests / (timeframeDuration / 60000)

    return {
      endpoint,
      method: 'ALL', // This could be broken down by method
      totalRequests,
      averageResponseTime,
      p95ResponseTime: percentiles.p95,
      p99ResponseTime: percentiles.p99,
      errorRate,
      cacheHitRate,
      requestsPerMinute,
      slowestRequests
    }
  }

  async getOrganizationPerformanceOverview(
    organizationId: string,
    timeframe: 'hour' | 'day' | 'week' = 'day'
  ): Promise<OrganizationPerformanceOverview> {
    const now = new Date()
    let startTime: Date

    switch (timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 3600000)
        break
      case 'day':
        startTime = new Date(now.getTime() - 86400000)
        break
      case 'week':
        startTime = new Date(now.getTime() - 604800000)
        break
    }

    // Get organization metrics
    const orgMetrics = await this.getOrganizationMetrics(organizationId, startTime, now)

    // Get top slow endpoints
    const topSlowEndpoints = await this.getTopSlowEndpoints(organizationId, startTime, now)

    // Get performance trend
    const performanceTrend = await this.getPerformanceTrend(organizationId, startTime, now)

    // Get resource usage
    const resourceUsage = await this.getResourceUsage(organizationId)

    return {
      organizationId,
      totalRequests: orgMetrics.totalRequests,
      averageResponseTime: orgMetrics.averageResponseTime,
      errorRate: orgMetrics.errorRate,
      cacheHitRate: orgMetrics.cacheHitRate,
      topSlowEndpoints,
      performanceTrend,
      resourceUsage
    }
  }

  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    const [cpuMetrics, memoryMetrics, dbMetrics, redisMetrics, apiMetrics] = await Promise.all([
      this.getCpuMetrics(),
      this.getMemoryMetrics(),
      this.getDatabaseMetrics(),
      this.getRedisMetrics(),
      this.getApiMetrics()
    ])

    return {
      cpu: cpuMetrics,
      memory: memoryMetrics,
      database: dbMetrics,
      redis: redisMetrics,
      api: apiMetrics
    }
  }

  // ALERTING SYSTEM

  private async checkPerformanceThresholds(metric: any): Promise<void> {
    // Check slow endpoint threshold
    if (metric.duration > this.alertThresholds.slowEndpoint) {
      await this.triggerPerformanceAlert({
        type: 'slow_endpoint',
        severity: 'high',
        title: 'Slow Endpoint Detected',
        description: `Endpoint ${metric.endpoint} responded in ${metric.duration}ms`,
        metric: 'response_time',
        threshold: this.alertThresholds.slowEndpoint,
        actualValue: metric.duration,
        endpoint: metric.endpoint,
        organizationId: metric.organizationId,
        metadata: {
          requestId: metric.requestId,
          statusCode: metric.statusCode
        }
      })
    }

    // Check error rate (aggregated check)
    await this.checkErrorRateThreshold(metric.endpoint, metric.organizationId)

    // Check memory usage if available
    if (metric.memoryUsage) {
      const memoryUsagePercentage = metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal
      if (memoryUsagePercentage > this.alertThresholds.memoryUsage) {
        await this.triggerPerformanceAlert({
          type: 'memory_leak',
          severity: 'critical',
          title: 'High Memory Usage Detected',
          description: `Memory usage at ${(memoryUsagePercentage * 100).toFixed(1)}%`,
          metric: 'memory_usage',
          threshold: this.alertThresholds.memoryUsage,
          actualValue: memoryUsagePercentage,
          organizationId: metric.organizationId,
          metadata: {
            memoryUsage: metric.memoryUsage
          }
        })
      }
    }
  }

  private async checkErrorRateThreshold(endpoint: string, organizationId?: string): Promise<void> {
    const timeWindow = 300000 // 5 minutes
    const now = Date.now()
    const startTime = now - timeWindow

    // Get recent requests for this endpoint
    const keys = await this.redis.keys(`perf:timeseries:${endpoint}:*`)
    let totalRequests = 0
    let errorRequests = 0

    for (const key of keys) {
      const requests = await this.redis.lrange(key, 0, -1)
      for (const requestStr of requests) {
        try {
          const request = JSON.parse(requestStr)
          if (request.timestamp >= startTime) {
            totalRequests++
            if (request.statusCode >= 400) {
              errorRequests++
            }
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    }

    if (totalRequests >= 10) { // Only check if we have enough data
      const errorRate = errorRequests / totalRequests
      if (errorRate > this.alertThresholds.highErrorRate) {
        await this.triggerPerformanceAlert({
          type: 'high_error_rate',
          severity: 'high',
          title: 'High Error Rate Detected',
          description: `Endpoint ${endpoint} has ${(errorRate * 100).toFixed(1)}% error rate`,
          metric: 'error_rate',
          threshold: this.alertThresholds.highErrorRate,
          actualValue: errorRate,
          endpoint,
          organizationId,
          metadata: {
            totalRequests,
            errorRequests,
            timeWindow: timeWindow / 1000
          }
        })
      }
    }
  }

  private async triggerPerformanceAlert(
    alertData: Omit<PerformanceAlert, 'id' | 'firstDetected' | 'lastDetected' | 'status'>
  ): Promise<void> {
    const alertId = crypto.randomUUID()
    const now = new Date()

    // Check if similar alert already exists
    const existingAlertId = await this.findExistingAlert(alertData)
    if (existingAlertId) {
      // Update existing alert
      const existingAlert = this.activeAlerts.get(existingAlertId)
      if (existingAlert) {
        existingAlert.lastDetected = now
        existingAlert.actualValue = alertData.actualValue
        await this.updateAlert(existingAlert)
      }
      return
    }

    const alert: PerformanceAlert = {
      id: alertId,
      firstDetected: now,
      lastDetected: now,
      status: 'active',
      ...alertData
    }

    // Store alert
    this.activeAlerts.set(alertId, alert)
    const alertKey = `perf_alert:${alertId}`
    await this.redis.setex(alertKey, 86400, JSON.stringify(alert))

    // Send notification
    await this.sendPerformanceAlertNotification(alert)
  }

  private async findExistingAlert(alertData: any): Promise<string | null> {
    for (const [id, alert] of this.activeAlerts) {
      if (
        alert.type === alertData.type &&
        alert.endpoint === alertData.endpoint &&
        alert.organizationId === alertData.organizationId &&
        alert.status === 'active' &&
        Date.now() - alert.lastDetected.getTime() < 300000 // 5 minutes
      ) {
        return id
      }
    }
    return null
  }

  private async updateAlert(alert: PerformanceAlert): Promise<void> {
    const alertKey = `perf_alert:${alert.id}`
    await this.redis.setex(alertKey, 86400, JSON.stringify(alert))
  }

  private async sendPerformanceAlertNotification(alert: PerformanceAlert): Promise<void> {
    // This would integrate with your notification service
    console.log('Performance Alert:', {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      endpoint: alert.endpoint,
      organizationId: alert.organizationId
    })
  }

  // BACKGROUND MONITORING

  private startSystemMonitoring(): void {
    // Monitor system health every 30 seconds
    setInterval(async () => {
      try {
        await this.collectSystemMetrics()
      } catch (error) {
        console.error('System monitoring error:', error)
      }
    }, 30000)

    // Clean up old data every hour
    setInterval(async () => {
      try {
        await this.cleanupOldData()
      } catch (error) {
        console.error('Data cleanup error:', error)
      }
    }, 3600000)
  }

  private async collectSystemMetrics(): Promise<void> {
    const metrics = await this.getSystemHealthMetrics()

    // Store system metrics
    const timestamp = Date.now()
    const systemKey = `system_metrics:${timestamp}`
    await this.redis.setex(systemKey, 3600, JSON.stringify(metrics))

    // Check system-level thresholds
    if (metrics.cpu.usage > this.alertThresholds.cpuUsage) {
      await this.triggerPerformanceAlert({
        type: 'cpu_spike',
        severity: 'high',
        title: 'High CPU Usage',
        description: `System CPU usage at ${(metrics.cpu.usage * 100).toFixed(1)}%`,
        metric: 'cpu_usage',
        threshold: this.alertThresholds.cpuUsage,
        actualValue: metrics.cpu.usage,
        metadata: { systemMetrics: metrics.cpu }
      })
    }

    if (metrics.memory.percentage > this.alertThresholds.memoryUsage) {
      await this.triggerPerformanceAlert({
        type: 'memory_leak',
        severity: 'critical',
        title: 'High System Memory Usage',
        description: `System memory usage at ${metrics.memory.percentage.toFixed(1)}%`,
        metric: 'memory_usage',
        threshold: this.alertThresholds.memoryUsage,
        actualValue: metrics.memory.percentage / 100,
        metadata: { systemMetrics: metrics.memory }
      })
    }
  }

  private async cleanupOldData(): Promise<void> {
    const cutoffTime = Date.now() - 86400000 // 24 hours ago

    // Clean up old time series data
    const timeSeriesKeys = await this.redis.keys('perf:timeseries:*')
    for (const key of timeSeriesKeys) {
      const keyTime = parseInt(key.split(':').pop() || '0')
      if (keyTime < cutoffTime) {
        await this.redis.del(key)
      }
    }

    // Clean up old detailed metrics
    const detailedKeys = await this.redis.keys('perf:detailed:*')
    for (const key of detailedKeys) {
      const ttl = await this.redis.ttl(key)
      if (ttl === -1) { // No expiration set
        await this.redis.expire(key, 86400) // Set 24 hour expiration
      }
    }

    // Clean up resolved alerts older than 7 days
    const oldAlerts = Array.from(this.activeAlerts.entries()).filter(
      ([_, alert]) =>
        alert.status === 'resolved' &&
        Date.now() - alert.lastDetected.getTime() > 604800000 // 7 days
    )

    for (const [id, _] of oldAlerts) {
      this.activeAlerts.delete(id)
      await this.redis.del(`perf_alert:${id}`)
    }
  }

  // UTILITY METHODS

  private async getAggregationKeys(endpoint: string, type: string, startTime: Date, endTime: Date): Promise<string[]> {
    const keys: string[] = []
    const current = new Date(startTime)

    while (current <= endTime) {
      const timeKey = type === 'hourly'
        ? current.toISOString().slice(0, 13)
        : current.toISOString().slice(0, 10)

      keys.push(`perf:${type}:${endpoint}:${timeKey}`)

      if (type === 'hourly') {
        current.setHours(current.getHours() + 1)
      } else {
        current.setDate(current.getDate() + 1)
      }
    }

    return keys
  }

  private async getAggregatedData(keys: string[]): Promise<any[]> {
    const data = await Promise.all(
      keys.map(key => this.redis.hgetall(key))
    )

    return data.map(item => ({
      requests: parseInt(item.requests || '0'),
      total_duration: parseInt(item.total_duration || '0'),
      errors: parseInt(item.errors || '0'),
      success: parseInt(item.success || '0'),
      cache_hits: parseInt(item.cache_hits || '0')
    }))
  }

  private async calculatePercentiles(endpoint: string, startTime: Date, endTime: Date): Promise<{ p95: number; p99: number }> {
    // This is a simplified implementation
    // In production, you'd want to use a more sophisticated percentile calculation

    const durationKeys = await this.redis.keys(`perf:*:${endpoint}:*:durations`)
    const allDurations: number[] = []

    for (const key of durationKeys) {
      const durations = await this.redis.zrange(key, 0, -1, 'WITHSCORES')
      for (let i = 1; i < durations.length; i += 2) {
        allDurations.push(parseFloat(durations[i]))
      }
    }

    if (allDurations.length === 0) {
      return { p95: 0, p99: 0 }
    }

    allDurations.sort((a, b) => a - b)
    const p95Index = Math.floor(allDurations.length * 0.95)
    const p99Index = Math.floor(allDurations.length * 0.99)

    return {
      p95: allDurations[p95Index] || 0,
      p99: allDurations[p99Index] || 0
    }
  }

  private async getSlowestRequests(endpoint: string, startTime: Date, endTime: Date): Promise<any[]> {
    const detailedKeys = await this.redis.keys('perf:detailed:*')
    const slowRequests = []

    for (const key of detailedKeys) {
      const metricStr = await this.redis.get(key)
      if (metricStr) {
        try {
          const metric = JSON.parse(metricStr)
          if (
            metric.endpoint === endpoint &&
            new Date(metric.timestamp) >= startTime &&
            new Date(metric.timestamp) <= endTime
          ) {
            slowRequests.push({
              requestId: metric.requestId,
              duration: metric.duration,
              timestamp: new Date(metric.timestamp),
              organizationId: metric.organizationId
            })
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    }

    return slowRequests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
  }

  private async getOrganizationMetrics(organizationId: string, startTime: Date, endTime: Date): Promise<any> {
    // Implementation for getting organization-specific metrics
    // This would aggregate data from the org-specific keys
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0
    }
  }

  private async getTopSlowEndpoints(organizationId: string, startTime: Date, endTime: Date): Promise<any[]> {
    // Implementation for getting top slow endpoints for organization
    return []
  }

  private async getPerformanceTrend(organizationId: string, startTime: Date, endTime: Date): Promise<any[]> {
    // Implementation for getting performance trend data
    return []
  }

  private async getResourceUsage(organizationId: string): Promise<any> {
    // Implementation for getting resource usage specific to organization
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      dbConnections: 0
    }
  }

  private async getCpuMetrics(): Promise<any> {
    const cpuUsage = process.cpuUsage()
    const loadAverage = process.loadavg ? process.loadavg() : [0, 0, 0]

    return {
      usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to percentage
      loadAverage
    }
  }

  private async getMemoryMetrics(): Promise<any> {
    const memoryUsage = process.memoryUsage()
    const total = memoryUsage.heapTotal
    const used = memoryUsage.heapUsed
    const free = total - used

    return {
      total,
      used,
      free,
      percentage: (used / total) * 100
    }
  }

  private async getDatabaseMetrics(): Promise<any> {
    // This would query database metrics
    // For now, return mock data
    return {
      activeConnections: 10,
      maxConnections: 100,
      avgQueryTime: 50,
      slowQueries: 2
    }
  }

  private async getRedisMetrics(): Promise<any> {
    try {
      const info = await this.redis.info()
      const parsedInfo = this.parseRedisInfo(info)

      return {
        connectedClients: parsedInfo.connected_clients || 0,
        usedMemory: parsedInfo.used_memory || 0,
        hitRate: parsedInfo.keyspace_hits / (parsedInfo.keyspace_hits + parsedInfo.keyspace_misses) || 0,
        ops: parsedInfo.instantaneous_ops_per_sec || 0
      }
    } catch (error) {
      return {
        connectedClients: 0,
        usedMemory: 0,
        hitRate: 0,
        ops: 0
      }
    }
  }

  private async getApiMetrics(): Promise<any> {
    // Get current API metrics from Redis
    const now = Math.floor(Date.now() / 60000) * 60000 // Current minute
    const keys = await this.redis.keys(`perf:counters:*`)

    let totalRequests = 0
    let totalDuration = 0
    let totalErrors = 0

    for (const key of keys) {
      const data = await this.redis.hgetall(key)
      totalRequests += parseInt(data.requests || '0')
      totalDuration += parseInt(data.total_duration || '0')
      totalErrors += parseInt(data.errors || '0')
    }

    return {
      requestsPerSecond: totalRequests / 60, // Approximate
      averageResponseTime: totalRequests > 0 ? totalDuration / totalRequests : 0,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      activeRequests: 0 // This would need to be tracked separately
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {}
    const lines = info.split('\r\n')

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':')
        result[key] = isNaN(Number(value)) ? value : Number(value)
      }
    }

    return result
  }
}

export type { PerformanceAlert, SystemHealthMetrics, EndpointMetrics, OrganizationPerformanceOverview }