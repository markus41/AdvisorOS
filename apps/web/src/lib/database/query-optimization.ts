import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

interface QueryOptimizationConfig {
  enableQueryPlan: boolean
  slowQueryThreshold: number
  enableQueryProfiling: boolean
  batchSize: number
  concurrentQueries: number
}

interface QueryPlan {
  query: string
  executionTime: number
  rowsExamined: number
  rowsReturned: number
  usesIndex: boolean
  recommendations: string[]
}

interface OptimizedQuery {
  originalQuery: string
  optimizedQuery: string
  performance: {
    originalTime: number
    optimizedTime: number
    improvement: number
  }
}

class QueryOptimizer {
  private prisma: PrismaClient
  private redis: Redis
  private config: QueryOptimizationConfig
  private queryCache = new Map<string, any>()
  private queryPlans = new Map<string, QueryPlan>()

  constructor(
    prisma: PrismaClient,
    redis: Redis,
    config: Partial<QueryOptimizationConfig> = {}
  ) {
    this.prisma = prisma
    this.redis = redis

    this.config = {
      enableQueryPlan: true,
      slowQueryThreshold: 1000, // 1 second
      enableQueryProfiling: true,
      batchSize: 100,
      concurrentQueries: 10,
      ...config
    }

    this.setupQueryProfiling()
  }

  private setupQueryProfiling(): void {
    if (!this.config.enableQueryProfiling) return

    this.prisma.$use(async (params, next) => {
      const start = Date.now()
      const queryKey = this.generateQueryKey(params)

      try {
        const result = await next(params)
        const duration = Date.now() - start

        if (duration > this.config.slowQueryThreshold) {
          await this.analyzeSlowQuery(params, duration)
        }

        // Record query performance
        await this.recordQueryPerformance(queryKey, duration, params)

        return result
      } catch (error) {
        await this.recordQueryError(queryKey, error as Error, params)
        throw error
      }
    })
  }

  private generateQueryKey(params: any): string {
    return `${params.model}.${params.action}.${JSON.stringify(params.args)}`
  }

  private async analyzeSlowQuery(params: any, duration: number): Promise<void> {
    console.warn(`Slow query detected: ${params.model}.${params.action} (${duration}ms)`)

    // Store slow query for analysis
    const slowQueryKey = `slow_query:${Date.now()}`
    await this.redis.setex(slowQueryKey, 86400, JSON.stringify({
      model: params.model,
      action: params.action,
      args: params.args,
      duration,
      timestamp: new Date().toISOString()
    }))

    // Generate optimization recommendations
    const recommendations = await this.generateOptimizationRecommendations(params)
    console.log('Optimization recommendations:', recommendations)
  }

  private async generateOptimizationRecommendations(params: any): Promise<string[]> {
    const recommendations: string[] = []
    const { model, action, args } = params

    // Common optimization patterns
    if (action === 'findMany') {
      if (!args?.take && !args?.first) {
        recommendations.push('Consider adding pagination (take/skip or cursor-based)')
      }

      if (args?.include && Object.keys(args.include).length > 3) {
        recommendations.push('Consider reducing the number of included relations')
      }

      if (args?.where && !this.hasOptimalIndexes(model, args.where)) {
        recommendations.push(`Consider adding indexes for ${model} where clause fields`)
      }

      if (!args?.orderBy) {
        recommendations.push('Consider adding explicit ordering for consistent results')
      }
    }

    if (action === 'findFirst' && !args?.orderBy) {
      recommendations.push('Consider using findUnique with unique fields instead of findFirst')
    }

    if (args?.include) {
      recommendations.push('Consider using select to fetch only required fields')
    }

    return recommendations
  }

  private hasOptimalIndexes(model: string, whereClause: any): boolean {
    // This would check against actual database indexes
    // For now, check common patterns
    const indexedFields = this.getCommonIndexedFields(model)
    const whereFields = Object.keys(whereClause || {})

    return whereFields.some(field => indexedFields.includes(field))
  }

  private getCommonIndexedFields(model: string): string[] {
    // Common indexed fields per model
    const indexMap: Record<string, string[]> = {
      Organization: ['id', 'subdomain'],
      User: ['id', 'email', 'organizationId'],
      Client: ['id', 'organizationId', 'taxId'],
      Document: ['id', 'organizationId', 'clientId', 'type', 'status'],
      Task: ['id', 'organizationId', 'assigneeId', 'status'],
      Invoice: ['id', 'organizationId', 'clientId', 'status'],
      Report: ['id', 'organizationId', 'clientId', 'type'],
      AuditLog: ['id', 'organizationId', 'userId', 'action'],
      QuickBooksSync: ['id', 'organizationId', 'status'],
      Workflow: ['id', 'organizationId', 'type'],
      Engagement: ['id', 'organizationId', 'clientId', 'status']
    }

    return indexMap[model] || ['id', 'organizationId']
  }

  private async recordQueryPerformance(
    queryKey: string,
    duration: number,
    params: any
  ): Promise<void> {
    const performanceKey = `query_perf:${params.model}.${params.action}`

    await this.redis.lpush(performanceKey, JSON.stringify({
      duration,
      timestamp: Date.now(),
      queryKey
    }))

    // Keep only last 100 records per query type
    await this.redis.ltrim(performanceKey, 0, 99)
    await this.redis.expire(performanceKey, 86400) // 24 hours
  }

  private async recordQueryError(
    queryKey: string,
    error: Error,
    params: any
  ): Promise<void> {
    const errorKey = `query_error:${Date.now()}`
    await this.redis.setex(errorKey, 86400, JSON.stringify({
      queryKey,
      error: error.message,
      model: params.model,
      action: params.action,
      timestamp: new Date().toISOString()
    }))
  }

  // Optimized query methods for common patterns

  async findManyOptimized<T>(
    model: string,
    args: any,
    options: {
      useCache?: boolean
      cacheTTL?: number
      preferReadReplica?: boolean
    } = {}
  ): Promise<T[]> {
    const {
      useCache = true,
      cacheTTL = 300,
      preferReadReplica = true
    } = options

    // Generate optimized query
    const optimizedArgs = this.optimizeFindManyArgs(args)

    // Check cache if enabled
    if (useCache) {
      const cacheKey = `optimized_query:${model}:${JSON.stringify(optimizedArgs)}`
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const result = await (this.prisma as any)[model].findMany(optimizedArgs)

      // Cache result
      await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(result))
      return result
    }

    return await (this.prisma as any)[model].findMany(optimizedArgs)
  }

  private optimizeFindManyArgs(args: any): any {
    const optimized = { ...args }

    // Add default pagination if missing
    if (!optimized.take && !optimized.first) {
      optimized.take = 50 // Default page size
    }

    // Optimize includes
    if (optimized.include) {
      optimized.include = this.optimizeIncludes(optimized.include)
    }

    // Add organization scoping if missing
    if (optimized.where && !optimized.where.organizationId) {
      // This would be filled by the tRPC context
    }

    return optimized
  }

  private optimizeIncludes(include: any): any {
    const optimized = { ...include }

    // Limit deep includes
    Object.keys(optimized).forEach(key => {
      if (typeof optimized[key] === 'object' && optimized[key].include) {
        // Limit to 2 levels of includes
        delete optimized[key].include
      }
    })

    return optimized
  }

  // Batch operations for better performance
  async batchCreate<T>(
    model: string,
    data: any[],
    options: { batchSize?: number } = {}
  ): Promise<T[]> {
    const { batchSize = this.config.batchSize } = options
    const results: T[] = []

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const batchResult = await (this.prisma as any)[model].createMany({
        data: batch,
        skipDuplicates: true
      })
      results.push(...batchResult)
    }

    return results
  }

  async batchUpdate<T>(
    model: string,
    updates: Array<{ where: any; data: any }>,
    options: { batchSize?: number } = {}
  ): Promise<T[]> {
    const { batchSize = this.config.batchSize } = options
    const results: T[] = []

    const batches = []
    for (let i = 0; i < updates.length; i += batchSize) {
      batches.push(updates.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const batchPromises = batch.map(update =>
        (this.prisma as any)[model].update(update)
      )
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  // Transaction optimization
  async optimizedTransaction<T>(
    operations: Array<(prisma: PrismaClient) => Promise<any>>,
    options: { timeout?: number; isolationLevel?: string } = {}
  ): Promise<T[]> {
    const { timeout = 30000 } = options

    return await this.prisma.$transaction(
      operations.map(op => op(this.prisma)),
      {
        timeout,
        isolationLevel: 'ReadCommitted' // Optimal for most cases
      }
    )
  }

  // Query performance analytics
  async getQueryPerformanceReport(timeframe: number = 3600000): Promise<{
    slowQueries: Array<{
      query: string
      avgDuration: number
      count: number
      recommendations: string[]
    }>
    queryDistribution: Record<string, number>
    errorRate: number
  }> {
    const cutoff = Date.now() - timeframe

    // Get slow queries
    const slowQueryKeys = await this.redis.keys('slow_query:*')
    const slowQueries = await Promise.all(
      slowQueryKeys.map(async key => {
        const data = await this.redis.get(key)
        return data ? JSON.parse(data) : null
      })
    )

    const validSlowQueries = slowQueries
      .filter(q => q && new Date(q.timestamp).getTime() > cutoff)

    // Aggregate by query pattern
    const queryStats = new Map<string, { count: number; totalDuration: number; recommendations: Set<string> }>()

    validSlowQueries.forEach(query => {
      const pattern = `${query.model}.${query.action}`
      const existing = queryStats.get(pattern) || { count: 0, totalDuration: 0, recommendations: new Set() }

      existing.count++
      existing.totalDuration += query.duration

      queryStats.set(pattern, existing)
    })

    // Get query distribution
    const performanceKeys = await this.redis.keys('query_perf:*')
    const queryDistribution: Record<string, number> = {}

    for (const key of performanceKeys) {
      const queryType = key.replace('query_perf:', '')
      const count = await this.redis.llen(key)
      queryDistribution[queryType] = count
    }

    // Calculate error rate
    const errorKeys = await this.redis.keys('query_error:*')
    const totalQueries = Object.values(queryDistribution).reduce((sum, count) => sum + count, 0)
    const errorRate = totalQueries > 0 ? errorKeys.length / totalQueries : 0

    return {
      slowQueries: Array.from(queryStats.entries()).map(([query, stats]) => ({
        query,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count,
        recommendations: Array.from(stats.recommendations)
      })),
      queryDistribution,
      errorRate
    }
  }

  // Index analysis and recommendations
  async analyzeIndexOpportunities(organizationId: string): Promise<{
    missingIndexes: Array<{
      table: string
      columns: string[]
      impact: 'high' | 'medium' | 'low'
      reason: string
    }>
    unusedIndexes: Array<{
      table: string
      index: string
      lastUsed: Date | null
    }>
    recommendations: string[]
  }> {
    // This would analyze actual query patterns and database statistics
    // For now, provide common recommendations based on schema

    const missingIndexes = [
      {
        table: 'documents',
        columns: ['organization_id', 'created_at'],
        impact: 'high' as const,
        reason: 'Frequently queried for recent documents by organization'
      },
      {
        table: 'tasks',
        columns: ['organization_id', 'status', 'assignee_id'],
        impact: 'high' as const,
        reason: 'Common filtering pattern for task dashboards'
      },
      {
        table: 'audit_logs',
        columns: ['organization_id', 'action', 'created_at'],
        impact: 'medium' as const,
        reason: 'Needed for audit trail queries'
      },
      {
        table: 'quickbooks_syncs',
        columns: ['organization_id', 'status', 'last_sync_at'],
        impact: 'medium' as const,
        reason: 'Critical for sync status monitoring'
      }
    ]

    const recommendations = [
      'Consider partitioning large tables by organization_id for better performance',
      'Implement partial indexes for commonly filtered status fields',
      'Use BRIN indexes for timestamp columns in append-only tables',
      'Consider materialized views for complex reporting queries'
    ]

    return {
      missingIndexes,
      unusedIndexes: [], // Would be populated from pg_stat_user_indexes
      recommendations
    }
  }

  async optimizeForTaxSeason(): Promise<void> {
    console.log('Applying tax season optimizations...')

    // Pre-warm commonly accessed data
    await this.prewarmTaxSeasonData()

    // Create temporary indexes for heavy queries
    await this.createTemporaryIndexes()

    // Adjust query cache settings
    await this.adjustCacheSettings({
      defaultTTL: 1800, // 30 minutes during tax season
      maxCacheSize: 50000
    })

    console.log('Tax season optimizations applied')
  }

  private async prewarmTaxSeasonData(): Promise<void> {
    // Pre-load frequently accessed data during tax season
    const commonQueries = [
      'SELECT COUNT(*) FROM documents WHERE type = \'tax_document\'',
      'SELECT COUNT(*) FROM tasks WHERE status = \'in_progress\'',
      'SELECT COUNT(*) FROM clients WHERE is_active = true'
    ]

    for (const query of commonQueries) {
      try {
        await this.prisma.$queryRawUnsafe(query)
      } catch (error) {
        console.warn(`Failed to prewarm query: ${query}`, error)
      }
    }
  }

  private async createTemporaryIndexes(): Promise<void> {
    // Create indexes that are specifically useful during tax season
    const temporaryIndexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tax_season ON documents (organization_id, type, created_at) WHERE type = \'tax_document\'',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tax_season ON tasks (organization_id, status, due_date) WHERE status IN (\'pending\', \'in_progress\')'
    ]

    for (const indexQuery of temporaryIndexes) {
      try {
        await this.prisma.$executeRawUnsafe(indexQuery)
        console.log(`Created temporary index: ${indexQuery}`)
      } catch (error) {
        console.warn(`Failed to create temporary index: ${indexQuery}`, error)
      }
    }
  }

  private async adjustCacheSettings(settings: { defaultTTL: number; maxCacheSize: number }): Promise<void> {
    await this.redis.setex('cache_settings', 86400, JSON.stringify(settings))
  }

  async cleanupTemporaryOptimizations(): Promise<void> {
    console.log('Cleaning up temporary tax season optimizations...')

    const temporaryIndexes = [
      'DROP INDEX IF EXISTS idx_documents_tax_season',
      'DROP INDEX IF EXISTS idx_tasks_tax_season'
    ]

    for (const dropQuery of temporaryIndexes) {
      try {
        await this.prisma.$executeRawUnsafe(dropQuery)
        console.log(`Dropped temporary index: ${dropQuery}`)
      } catch (error) {
        console.warn(`Failed to drop temporary index: ${dropQuery}`, error)
      }
    }
  }
}

export { QueryOptimizer }
export type { QueryOptimizationConfig, QueryPlan, OptimizedQuery }