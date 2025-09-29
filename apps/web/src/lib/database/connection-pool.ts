import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

interface DatabasePoolConfig {
  maxConnections: number
  minConnections: number
  acquireTimeoutMillis: number
  idleTimeoutMillis: number
  reapIntervalMillis: number
  createRetryIntervalMillis: number
  createTimeoutMillis: number
}

interface QueryCacheConfig {
  defaultTTL: number
  maxCacheSize: number
  enableQueryProfiling: boolean
}

class DatabaseConnectionPool {
  private prisma: PrismaClient
  private redis: Redis
  private poolConfig: DatabasePoolConfig
  private cacheConfig: QueryCacheConfig
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>()

  constructor(
    prisma: PrismaClient,
    redis: Redis,
    poolConfig: Partial<DatabasePoolConfig> = {},
    cacheConfig: Partial<QueryCacheConfig> = {}
  ) {
    this.prisma = prisma
    this.redis = redis

    this.poolConfig = {
      maxConnections: 50, // Peak tax season capacity
      minConnections: 5,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 300000, // 5 minutes
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      createTimeoutMillis: 30000,
      ...poolConfig
    }

    this.cacheConfig = {
      defaultTTL: 300, // 5 minutes
      maxCacheSize: 10000,
      enableQueryProfiling: true,
      ...cacheConfig
    }

    this.setupDatabaseExtensions()
    this.startQueryProfiling()
  }

  private setupDatabaseExtensions(): void {
    // Extend Prisma client with caching and profiling middleware
    this.prisma.$use(async (params, next) => {
      const start = Date.now()

      // Generate cache key for read operations
      const cacheKey = this.generateCacheKey(params)

      // Check cache for read operations
      if (this.isReadOperation(params) && cacheKey) {
        const cached = await this.getFromCache(cacheKey)
        if (cached) {
          this.recordQueryStats(`${params.model}.${params.action}`, Date.now() - start, true)
          return cached
        }
      }

      // Execute query
      const result = await next(params)
      const duration = Date.now() - start

      // Cache result for read operations
      if (this.isReadOperation(params) && cacheKey && result) {
        await this.setCache(cacheKey, result, this.getCacheTTL(params))
      }

      // Record query statistics
      this.recordQueryStats(`${params.model}.${params.action}`, duration, false)

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`, {
          params: this.sanitizeParams(params),
          duration
        })
      }

      return result
    })
  }

  private isReadOperation(params: any): boolean {
    const readOperations = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy']
    return readOperations.includes(params.action)
  }

  private generateCacheKey(params: any): string | null {
    if (!this.isReadOperation(params)) return null

    try {
      const keyData = {
        model: params.model,
        action: params.action,
        args: params.args
      }
      return `db_cache:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`
    } catch (error) {
      return null
    }
  }

  private async getFromCache(key: string): Promise<any> {
    try {
      const cached = await this.redis.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }
    return null
  }

  private async setCache(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }

  private getCacheTTL(params: any): number {
    // Different TTLs based on data type
    const cacheTTLMap: Record<string, number> = {
      Organization: 3600, // Organizations change rarely
      User: 1800, // User data changes moderately
      Client: 1800, // Client data changes moderately
      Document: 300, // Documents change frequently during processing
      QuickBooksSync: 60, // Financial data changes frequently
      Invoice: 600, // Invoices change less frequently once created
      Report: 1800, // Reports are relatively static
      ReportTemplate: 7200, // Templates change rarely
      Workflow: 3600, // Workflows change rarely
      Task: 180, // Tasks change frequently
      AuditLog: 7200 // Audit logs are immutable
    }

    return cacheTTLMap[params.model] || this.cacheConfig.defaultTTL
  }

  private sanitizeParams(params: any): any {
    // Remove sensitive data from params for logging
    const sanitized = { ...params }
    if (sanitized.args?.data?.password) {
      sanitized.args.data.password = '[REDACTED]'
    }
    return sanitized
  }

  private recordQueryStats(operation: string, duration: number, fromCache: boolean): void {
    if (!this.cacheConfig.enableQueryProfiling) return

    const existing = this.queryStats.get(operation)
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.avgTime = existing.totalTime / existing.count
    } else {
      this.queryStats.set(operation, {
        count: 1,
        totalTime: duration,
        avgTime: duration
      })
    }

    // Log cache hit/miss
    if (fromCache) {
      console.debug(`Cache HIT: ${operation} (${duration}ms)`)
    }
  }

  private startQueryProfiling(): void {
    if (!this.cacheConfig.enableQueryProfiling) return

    // Log query statistics every 5 minutes
    setInterval(() => {
      const stats = Array.from(this.queryStats.entries())
        .sort(([,a], [,b]) => b.avgTime - a.avgTime)
        .slice(0, 10)

      if (stats.length > 0) {
        console.log('Top 10 slowest database operations:')
        stats.forEach(([operation, stat]) => {
          console.log(`  ${operation}: ${stat.count} queries, avg ${stat.avgTime.toFixed(2)}ms`)
        })
      }

      // Reset stats for next interval
      this.queryStats.clear()
    }, 300000) // 5 minutes
  }

  // Advanced query optimization methods
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) break

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  async batchQuery<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = []

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(op => op()))
      results.push(...batchResults)
    }

    return results
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`db_cache:*${pattern}*`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        console.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  async warmupCache(organizationId: string): Promise<void> {
    console.log(`Warming up cache for organization: ${organizationId}`)

    try {
      // Warm up frequently accessed data
      const warmupQueries = [
        () => this.prisma.organization.findUnique({
          where: { id: organizationId },
          include: { users: true }
        }),
        () => this.prisma.client.findMany({
          where: { organizationId },
          take: 50,
          orderBy: { updatedAt: 'desc' }
        }),
        () => this.prisma.document.findMany({
          where: { organizationId },
          take: 100,
          orderBy: { createdAt: 'desc' }
        }),
        () => this.prisma.task.findMany({
          where: { organizationId, status: { not: 'completed' } },
          take: 50
        }),
        () => this.prisma.reportTemplate.findMany({
          where: { organizationId }
        })
      ]

      await this.batchQuery(warmupQueries, 3)
      console.log(`Cache warmup completed for organization: ${organizationId}`)
    } catch (error) {
      console.error('Cache warmup failed:', error)
    }
  }

  getPoolStats(): DatabasePoolConfig & {
    queryStats: Array<{ operation: string; stats: any }>
    cacheHitRate: number
  } {
    return {
      ...this.poolConfig,
      queryStats: Array.from(this.queryStats.entries()).map(([operation, stats]) => ({
        operation,
        stats
      })),
      cacheHitRate: 0 // This would be calculated from Redis stats
    }
  }

  async getSlowQueries(limit: number = 10): Promise<Array<{
    query: string
    avgDuration: number
    count: number
  }>> {
    // This would integrate with PostgreSQL's pg_stat_statements extension
    // For now, return from our internal stats
    return Array.from(this.queryStats.entries())
      .sort(([,a], [,b]) => b.avgTime - a.avgTime)
      .slice(0, limit)
      .map(([operation, stats]) => ({
        query: operation,
        avgDuration: stats.avgTime,
        count: stats.count
      }))
  }

  async optimizeIndexes(organizationId: string): Promise<void> {
    // This would analyze query patterns and suggest index optimizations
    console.log(`Analyzing index optimization opportunities for organization: ${organizationId}`)

    try {
      // Example: Check for missing indexes on frequently queried columns
      const indexRecommendations = await this.analyzeQueryPatterns(organizationId)

      if (indexRecommendations.length > 0) {
        console.log('Index optimization recommendations:', indexRecommendations)
      }
    } catch (error) {
      console.error('Index analysis failed:', error)
    }
  }

  private async analyzeQueryPatterns(organizationId: string): Promise<string[]> {
    // Analyze recent query patterns and suggest optimizations
    const recommendations: string[] = []

    // This would analyze actual query logs
    // For now, return common optimization suggestions
    recommendations.push(
      'Consider adding composite index on (organizationId, createdAt) for Document table',
      'Consider adding index on (organizationId, status) for Task table',
      'Consider adding index on (organizationId, type) for AuditLog table'
    )

    return recommendations
  }
}

// Enhanced Prisma client with connection pooling and caching
export function createOptimizedPrismaClient(redis: Redis): PrismaClient {
  const prisma = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Add query logging for performance monitoring
  prisma.$on('query', (e) => {
    if (parseInt(e.duration) > 1000) {
      console.warn(`Slow Query: ${e.query} - Duration: ${e.duration}ms`)
    }
  })

  return prisma
}

export { DatabaseConnectionPool }
export type { DatabasePoolConfig, QueryCacheConfig }