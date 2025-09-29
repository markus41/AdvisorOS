import { Redis } from 'ioredis'
import { LRUCache } from 'lru-cache'

interface CacheConfig {
  defaultTTL: number
  maxMemoryCache: number
  enableL1Cache: boolean
  enableL2Cache: boolean
  compressionThreshold: number
  invalidationStrategy: 'time' | 'tag' | 'dependency'
}

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  tags: string[]
  dependencies: string[]
  accessCount: number
  lastAccessed: number
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  hitRate: number
  memoryUsage: number
  keyCount: number
}

interface CachePattern {
  pattern: string
  ttl: number
  tags: string[]
  invalidateOn: string[]
}

class IntelligentCacheManager {
  private redis: Redis
  private l1Cache: LRUCache<string, CacheEntry>
  private config: CacheConfig
  private stats: CacheStats
  private patterns: Map<string, CachePattern> = new Map()
  private dependencies: Map<string, Set<string>> = new Map()

  constructor(redis: Redis, config: Partial<CacheConfig> = {}) {
    this.redis = redis
    this.config = {
      defaultTTL: 300, // 5 minutes
      maxMemoryCache: 1000, // Max L1 cache entries
      enableL1Cache: true,
      enableL2Cache: true,
      compressionThreshold: 1024, // Compress data > 1KB
      invalidationStrategy: 'tag',
      ...config
    }

    this.l1Cache = new LRUCache<string, CacheEntry>({
      max: this.config.maxMemoryCache,
      ttl: this.config.defaultTTL * 1000,
      updateAgeOnGet: true,
      allowStale: false
    })

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      memoryUsage: 0,
      keyCount: 0
    }

    this.setupCachePatterns()
    this.startStatsCollection()
  }

  private setupCachePatterns(): void {
    // Define common cache patterns for AdvisorOS
    const patterns: Array<[string, CachePattern]> = [
      ['org:*', {
        pattern: 'org:*',
        ttl: 3600, // Organizations change rarely
        tags: ['organization'],
        invalidateOn: ['organization.update', 'organization.delete']
      }],
      ['user:*', {
        pattern: 'user:*',
        ttl: 1800, // User data changes moderately
        tags: ['user'],
        invalidateOn: ['user.update', 'user.delete', 'user.role_change']
      }],
      ['client:*', {
        pattern: 'client:*',
        ttl: 900, // Client data changes frequently
        tags: ['client'],
        invalidateOn: ['client.update', 'client.delete', 'document.upload']
      }],
      ['document:*', {
        pattern: 'document:*',
        ttl: 300, // Documents change frequently during processing
        tags: ['document'],
        invalidateOn: ['document.update', 'document.process', 'document.delete']
      }],
      ['task:*', {
        pattern: 'task:*',
        ttl: 180, // Tasks change very frequently
        tags: ['task'],
        invalidateOn: ['task.update', 'task.complete', 'task.assign']
      }],
      ['quickbooks:*', {
        pattern: 'quickbooks:*',
        ttl: 600, // QB data sync status
        tags: ['quickbooks', 'sync'],
        invalidateOn: ['quickbooks.sync', 'quickbooks.disconnect']
      }],
      ['report:*', {
        pattern: 'report:*',
        ttl: 1800, // Reports are relatively static
        tags: ['report'],
        invalidateOn: ['report.regenerate', 'client.update']
      }],
      ['dashboard:*', {
        pattern: 'dashboard:*',
        ttl: 300, // Dashboard data needs frequent updates
        tags: ['dashboard', 'analytics'],
        invalidateOn: ['task.update', 'document.upload', 'client.update']
      }],
      ['workflow:*', {
        pattern: 'workflow:*',
        ttl: 3600, // Workflows change rarely
        tags: ['workflow'],
        invalidateOn: ['workflow.update', 'workflow.delete']
      }],
      ['analytics:*', {
        pattern: 'analytics:*',
        ttl: 900, // Analytics can tolerate some staleness
        tags: ['analytics'],
        invalidateOn: ['data.significant_change']
      }]
    ]

    patterns.forEach(([key, pattern]) => {
      this.patterns.set(key, pattern)
    })
  }

  private startStatsCollection(): void {
    // Update stats every minute
    setInterval(() => {
      this.updateStats()
    }, 60000)
  }

  private async updateStats(): Promise<void> {
    try {
      const total = this.stats.hits + this.stats.misses
      this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
      this.stats.keyCount = this.l1Cache.size

      // Store stats in Redis for monitoring
      await this.redis.setex('cache:stats', 60, JSON.stringify({
        ...this.stats,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to update cache stats:', error)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try L1 cache first
      if (this.config.enableL1Cache) {
        const l1Entry = this.l1Cache.get(key)
        if (l1Entry && !this.isExpired(l1Entry)) {
          l1Entry.accessCount++
          l1Entry.lastAccessed = Date.now()
          this.stats.hits++
          return l1Entry.data as T
        }
      }

      // Try L2 cache (Redis)
      if (this.config.enableL2Cache) {
        const l2Data = await this.redis.get(key)
        if (l2Data) {
          const entry = this.deserialize<CacheEntry>(l2Data)
          if (entry && !this.isExpired(entry)) {
            // Promote to L1 cache
            if (this.config.enableL1Cache) {
              this.l1Cache.set(key, entry)
            }
            this.stats.hits++
            return entry.data as T
          }
        }
      }

      this.stats.misses++
      return null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      this.stats.misses++
      return null
    }
  }

  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number
      tags?: string[]
      dependencies?: string[]
      skipL1?: boolean
      skipL2?: boolean
    } = {}
  ): Promise<void> {
    try {
      const pattern = this.findMatchingPattern(key)
      const ttl = options.ttl || pattern?.ttl || this.config.defaultTTL
      const tags = options.tags || pattern?.tags || []
      const dependencies = options.dependencies || []

      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        tags,
        dependencies,
        accessCount: 0,
        lastAccessed: Date.now()
      }

      // Store in L1 cache
      if (this.config.enableL1Cache && !options.skipL1) {
        this.l1Cache.set(key, entry, { ttl: entry.ttl })
      }

      // Store in L2 cache (Redis)
      if (this.config.enableL2Cache && !options.skipL2) {
        const serialized = this.serialize(entry)
        await this.redis.setex(key, ttl, serialized)
      }

      // Track dependencies
      dependencies.forEach(dep => {
        if (!this.dependencies.has(dep)) {
          this.dependencies.set(dep, new Set())
        }
        this.dependencies.get(dep)!.add(key)
      })

      // Track tags in Redis for invalidation
      for (const tag of tags) {
        await this.redis.sadd(`tag:${tag}`, key)
        await this.redis.expire(`tag:${tag}`, ttl + 300) // Keep tags slightly longer
      }

      this.stats.sets++
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Remove from L1 cache
      this.l1Cache.delete(key)

      // Remove from L2 cache
      await this.redis.del(key)

      // Clean up tag associations
      const tags = await this.getKeyTags(key)
      for (const tag of tags) {
        await this.redis.srem(`tag:${tag}`, key)
      }

      this.stats.deletes++
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`)

      if (keys.length > 0) {
        // Remove from L1 cache
        keys.forEach(key => this.l1Cache.delete(key))

        // Remove from L2 cache
        await this.redis.del(...keys)

        // Clean up the tag set
        await this.redis.del(`tag:${tag}`)

        console.log(`Invalidated ${keys.length} cache entries for tag: ${tag}`)
      }
    } catch (error) {
      console.error(`Cache invalidation error for tag ${tag}:`, error)
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)

      if (keys.length > 0) {
        // Remove from L1 cache
        keys.forEach(key => this.l1Cache.delete(key))

        // Remove from L2 cache in batches
        const batchSize = 100
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize)
          await this.redis.del(...batch)
        }

        console.log(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`)
      }
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error)
    }
  }

  async invalidateByDependency(dependency: string): Promise<void> {
    const dependentKeys = this.dependencies.get(dependency)
    if (dependentKeys) {
      const deletePromises = Array.from(dependentKeys).map(key => this.delete(key))
      await Promise.all(deletePromises)
      this.dependencies.delete(dependency)
      console.log(`Invalidated ${dependentKeys.size} cache entries for dependency: ${dependency}`)
    }
  }

  // Smart invalidation based on data changes
  async handleDataChange(event: string, entityType: string, entityId: string): Promise<void> {
    const invalidationTasks: Promise<void>[] = []

    // Invalidate direct entity cache
    invalidationTasks.push(this.delete(`${entityType}:${entityId}`))

    // Invalidate by tags
    const relatedTags = this.getRelatedTags(entityType, event)
    relatedTags.forEach(tag => {
      invalidationTasks.push(this.invalidateByTag(tag))
    })

    // Invalidate dependent caches
    invalidationTasks.push(this.invalidateByDependency(`${entityType}:${entityId}`))

    // Special handling for organization-scoped invalidation
    if (entityType === 'organization') {
      invalidationTasks.push(this.invalidateByPattern(`*:org:${entityId}:*`))
    }

    await Promise.all(invalidationTasks)
  }

  private getRelatedTags(entityType: string, event: string): string[] {
    const tagMap: Record<string, string[]> = {
      'user': ['user', 'organization'],
      'client': ['client', 'dashboard', 'analytics'],
      'document': ['document', 'client', 'dashboard', 'analytics'],
      'task': ['task', 'dashboard', 'analytics'],
      'quickbooks': ['quickbooks', 'sync', 'client', 'analytics'],
      'report': ['report', 'analytics'],
      'workflow': ['workflow'],
      'organization': ['organization', 'user', 'client', 'dashboard', 'analytics']
    }

    return tagMap[entityType] || []
  }

  // Preload frequently accessed data
  async warmup(organizationId: string): Promise<void> {
    console.log(`Starting cache warmup for organization: ${organizationId}`)

    const warmupTasks = [
      // Organization data
      this.warmupOrganizationData(organizationId),
      // Active users
      this.warmupUserData(organizationId),
      // Recent clients
      this.warmupClientData(organizationId),
      // Active tasks
      this.warmupTaskData(organizationId),
      // Dashboard data
      this.warmupDashboardData(organizationId)
    ]

    try {
      await Promise.all(warmupTasks)
      console.log(`Cache warmup completed for organization: ${organizationId}`)
    } catch (error) {
      console.error(`Cache warmup failed for organization: ${organizationId}`, error)
    }
  }

  private async warmupOrganizationData(organizationId: string): Promise<void> {
    // This would be called with actual data from the database
    const mockOrgData = { id: organizationId, name: 'Sample Org' }
    await this.set(`org:${organizationId}`, mockOrgData, {
      tags: ['organization'],
      ttl: 3600
    })
  }

  private async warmupUserData(organizationId: string): Promise<void> {
    // Warmup active users for the organization
    const mockUsers = Array.from({ length: 10 }, (_, i) => ({
      id: `user${i}`,
      organizationId,
      name: `User ${i}`
    }))

    const warmupPromises = mockUsers.map(user =>
      this.set(`user:${user.id}`, user, {
        tags: ['user'],
        ttl: 1800
      })
    )

    await Promise.all(warmupPromises)
  }

  private async warmupClientData(organizationId: string): Promise<void> {
    // Warmup recent clients
    const mockClients = Array.from({ length: 20 }, (_, i) => ({
      id: `client${i}`,
      organizationId,
      businessName: `Client ${i}`
    }))

    const warmupPromises = mockClients.map(client =>
      this.set(`client:${client.id}`, client, {
        tags: ['client'],
        ttl: 900
      })
    )

    await Promise.all(warmupPromises)
  }

  private async warmupTaskData(organizationId: string): Promise<void> {
    // Warmup active tasks
    const mockTasks = Array.from({ length: 50 }, (_, i) => ({
      id: `task${i}`,
      organizationId,
      title: `Task ${i}`,
      status: i % 3 === 0 ? 'completed' : 'in_progress'
    }))

    const activeTasks = mockTasks.filter(task => task.status !== 'completed')
    const warmupPromises = activeTasks.map(task =>
      this.set(`task:${task.id}`, task, {
        tags: ['task'],
        ttl: 180
      })
    )

    await Promise.all(warmupPromises)
  }

  private async warmupDashboardData(organizationId: string): Promise<void> {
    // Warmup dashboard analytics
    const mockDashboardData = {
      organizationId,
      totalClients: 100,
      activeTasks: 25,
      completedTasks: 150,
      pendingDocuments: 15
    }

    await this.set(`dashboard:${organizationId}`, mockDashboardData, {
      tags: ['dashboard', 'analytics'],
      ttl: 300
    })
  }

  // Cache optimization for tax season
  async optimizeForTaxSeason(): Promise<void> {
    console.log('Optimizing cache for tax season...')

    // Adjust TTLs for tax season patterns
    const taxSeasonPatterns = new Map([
      ['document:*', { ttl: 120, priority: 'high' }], // Documents change rapidly
      ['task:*', { ttl: 60, priority: 'high' }], // Tasks update frequently
      ['client:*', { ttl: 600, priority: 'medium' }], // Client data fairly stable
      ['dashboard:*', { ttl: 120, priority: 'high' }], // Dashboards need frequent updates
      ['analytics:*', { ttl: 300, priority: 'medium' }] // Analytics can tolerate some lag
    ])

    // Increase cache capacity
    this.l1Cache.max = this.config.maxMemoryCache * 2

    // Pre-warm tax-specific data
    await this.prewarmTaxSeasonData()

    console.log('Tax season cache optimization completed')
  }

  private async prewarmTaxSeasonData(): Promise<void> {
    // Pre-warm commonly accessed tax season data
    const taxDocumentTypes = ['1040', '1120', '1065', '990', 'W2', '1099']
    const mockTaxData = taxDocumentTypes.map(type => ({
      type,
      processingRules: `Rules for ${type}`,
      deadline: '2024-04-15'
    }))

    const warmupPromises = mockTaxData.map(data =>
      this.set(`tax_rules:${data.type}`, data, {
        tags: ['tax', 'rules'],
        ttl: 7200 // Tax rules are stable
      })
    )

    await Promise.all(warmupPromises)
  }

  // Utility methods
  private findMatchingPattern(key: string): CachePattern | undefined {
    for (const [pattern, config] of this.patterns) {
      if (this.matchesPattern(key, pattern)) {
        return config
      }
    }
    return undefined
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace('*', '.*'))
    return regex.test(key)
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private serialize(data: any): string {
    const serialized = JSON.stringify(data)

    // Compress large payloads
    if (serialized.length > this.config.compressionThreshold) {
      // In a real implementation, you'd use gzip or similar
      return serialized
    }

    return serialized
  }

  private deserialize<T>(data: string): T | null {
    try {
      return JSON.parse(data) as T
    } catch (error) {
      console.error('Failed to deserialize cache data:', error)
      return null
    }
  }

  private async getKeyTags(key: string): Promise<string[]> {
    // In a real implementation, you'd store tag associations
    // For now, derive from patterns
    const pattern = this.findMatchingPattern(key)
    return pattern?.tags || []
  }

  // Monitoring and analytics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  async getCacheReport(): Promise<{
    stats: CacheStats
    topKeys: Array<{ key: string; accessCount: number; lastAccessed: number }>
    memoryUsage: number
    recommendations: string[]
  }> {
    const topKeys: Array<{ key: string; accessCount: number; lastAccessed: number }> = []

    this.l1Cache.forEach((entry, key) => {
      topKeys.push({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      })
    })

    topKeys.sort((a, b) => b.accessCount - a.accessCount)

    const recommendations = this.generateCacheRecommendations()

    return {
      stats: this.getStats(),
      topKeys: topKeys.slice(0, 10),
      memoryUsage: this.l1Cache.calculatedSize || 0,
      recommendations
    }
  }

  private generateCacheRecommendations(): string[] {
    const recommendations: string[] = []
    const { hitRate, keyCount } = this.stats

    if (hitRate < 0.8) {
      recommendations.push('Cache hit rate is below 80%. Consider adjusting TTL values or cache patterns.')
    }

    if (keyCount > this.config.maxMemoryCache * 0.9) {
      recommendations.push('L1 cache is near capacity. Consider increasing maxMemoryCache or implementing better eviction.')
    }

    if (this.stats.evictions > this.stats.sets * 0.1) {
      recommendations.push('High eviction rate detected. Consider increasing cache size or reducing TTL for less important data.')
    }

    return recommendations
  }

  async cleanup(): Promise<void> {
    this.l1Cache.clear()
    // Don't clear Redis as it may be shared
    console.log('Cache cleanup completed')
  }
}

export { IntelligentCacheManager }
export type { CacheConfig, CacheEntry, CacheStats, CachePattern }