import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'
import crypto from 'crypto'

interface CacheConfig {
  defaultTTL: number
  maxAge: number
  staleWhileRevalidate: number
  staleIfError: number
  varyHeaders: string[]
  skipMethods: string[]
  skipPaths: string[]
  enableETags: boolean
  enableConditionalRequests: boolean
}

interface CacheEntry {
  body: string
  headers: Record<string, string>
  status: number
  timestamp: number
  etag: string
  lastModified: string
  ttl: number
}

interface CacheRule {
  pattern: RegExp
  ttl: number
  varyHeaders: string[]
  tags: string[]
  condition?: (req: NextRequest) => boolean
}

class ResponseCacheMiddleware {
  private redis: Redis
  private config: CacheConfig
  private rules: Map<string, CacheRule> = new Map()
  private hitCount = 0
  private missCount = 0

  constructor(redis: Redis, config: Partial<CacheConfig> = {}) {
    this.redis = redis
    this.config = {
      defaultTTL: 300, // 5 minutes
      maxAge: 300,
      staleWhileRevalidate: 600, // 10 minutes
      staleIfError: 3600, // 1 hour
      varyHeaders: ['Authorization', 'Accept', 'Accept-Language'],
      skipMethods: ['POST', 'PUT', 'DELETE', 'PATCH'],
      skipPaths: ['/api/auth', '/api/stripe'],
      enableETags: true,
      enableConditionalRequests: true,
      ...config
    }

    this.setupDefaultRules()
  }

  private setupDefaultRules(): void {
    // Dashboard data - short cache with revalidation
    this.addRule('dashboard', {
      pattern: /^\/api\/dashboard/,
      ttl: 180, // 3 minutes
      varyHeaders: ['Authorization', 'Organization-Id'],
      tags: ['dashboard', 'analytics'],
      condition: (req) => req.method === 'GET'
    })

    // Client data - medium cache
    this.addRule('clients', {
      pattern: /^\/api\/clients/,
      ttl: 600, // 10 minutes
      varyHeaders: ['Authorization'],
      tags: ['clients'],
      condition: (req) => req.method === 'GET'
    })

    // Document metadata - short cache
    this.addRule('documents', {
      pattern: /^\/api\/documents$/,
      ttl: 300, // 5 minutes
      varyHeaders: ['Authorization'],
      tags: ['documents'],
      condition: (req) => req.method === 'GET'
    })

    // Task lists - very short cache
    this.addRule('tasks', {
      pattern: /^\/api\/tasks$/,
      ttl: 120, // 2 minutes
      varyHeaders: ['Authorization'],
      tags: ['tasks'],
      condition: (req) => req.method === 'GET'
    })

    // Reports - longer cache
    this.addRule('reports', {
      pattern: /^\/api\/reports/,
      ttl: 1800, // 30 minutes
      varyHeaders: ['Authorization'],
      tags: ['reports'],
      condition: (req) => req.method === 'GET'
    })

    // Organization settings - long cache
    this.addRule('organization', {
      pattern: /^\/api\/organization/,
      ttl: 3600, // 1 hour
      varyHeaders: ['Authorization'],
      tags: ['organization'],
      condition: (req) => req.method === 'GET'
    })

    // QuickBooks sync status - short cache
    this.addRule('quickbooks', {
      pattern: /^\/api\/quickbooks/,
      ttl: 180, // 3 minutes
      varyHeaders: ['Authorization'],
      tags: ['quickbooks', 'sync'],
      condition: (req) => req.method === 'GET'
    })

    // Analytics data - medium cache
    this.addRule('analytics', {
      pattern: /^\/api\/analytics/,
      ttl: 900, // 15 minutes
      varyHeaders: ['Authorization', 'Date-Range'],
      tags: ['analytics'],
      condition: (req) => req.method === 'GET'
    })
  }

  addRule(name: string, rule: CacheRule): void {
    this.rules.set(name, rule)
  }

  removeRule(name: string): void {
    this.rules.delete(name)
  }

  async middleware(request: NextRequest): Promise<NextResponse | null> {
    // Skip caching for certain methods and paths
    if (this.shouldSkipCache(request)) {
      return null
    }

    const rule = this.findMatchingRule(request)
    if (!rule) {
      return null
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(request, rule.varyHeaders)

    // Check for conditional requests
    if (this.config.enableConditionalRequests) {
      const conditionalResponse = await this.handleConditionalRequest(request, cacheKey)
      if (conditionalResponse) {
        this.hitCount++
        return conditionalResponse
      }
    }

    // Check cache
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      if (this.isFresh(cached)) {
        this.hitCount++
        return this.createCachedResponse(cached, 'HIT')
      } else if (this.isStaleButRevalidatable(cached)) {
        // Return stale content while revalidating in background
        this.hitCount++
        this.revalidateInBackground(request, cacheKey, rule)
        return this.createCachedResponse(cached, 'STALE')
      }
    }

    this.missCount++
    return null // Cache miss - proceed to generate response
  }

  async cacheResponse(
    request: NextRequest,
    response: NextResponse
  ): Promise<NextResponse> {
    const rule = this.findMatchingRule(request)
    if (!rule || this.shouldSkipCache(request)) {
      return response
    }

    try {
      const body = await response.clone().text()
      const cacheKey = this.generateCacheKey(request, rule.varyHeaders)

      // Generate ETag
      const etag = this.generateETag(body)
      const lastModified = new Date().toISOString()

      const cacheEntry: CacheEntry = {
        body,
        headers: Object.fromEntries(response.headers.entries()),
        status: response.status,
        timestamp: Date.now(),
        etag,
        lastModified,
        ttl: rule.ttl
      }

      // Add cache headers
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', this.generateCacheControlHeader(rule.ttl))
      headers.set('ETag', etag)
      headers.set('Last-Modified', lastModified)
      headers.set('Vary', rule.varyHeaders.join(', '))
      headers.set('X-Cache', 'MISS')

      // Store in cache
      await this.setCache(cacheKey, cacheEntry, rule.ttl)

      // Store tags for invalidation
      await this.storeCacheTags(cacheKey, rule.tags, rule.ttl)

      return new NextResponse(body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })

    } catch (error) {
      console.error('Failed to cache response:', error)
      return response
    }
  }

  private shouldSkipCache(request: NextRequest): boolean {
    // Skip non-GET requests
    if (this.config.skipMethods.includes(request.method)) {
      return true
    }

    // Skip certain paths
    const pathname = new URL(request.url).pathname
    if (this.config.skipPaths.some(path => pathname.startsWith(path))) {
      return true
    }

    // Skip if Cache-Control: no-cache header is present
    const cacheControl = request.headers.get('cache-control')
    if (cacheControl?.includes('no-cache')) {
      return true
    }

    // Skip if explicit cache bypass header
    if (request.headers.get('x-no-cache') === 'true') {
      return true
    }

    return false
  }

  private findMatchingRule(request: NextRequest): CacheRule | null {
    const pathname = new URL(request.url).pathname

    for (const rule of this.rules.values()) {
      if (rule.pattern.test(pathname)) {
        if (!rule.condition || rule.condition(request)) {
          return rule
        }
      }
    }

    return null
  }

  private generateCacheKey(request: NextRequest, varyHeaders: string[]): string {
    const url = new URL(request.url)
    const pathname = url.pathname
    const searchParams = Array.from(url.searchParams.entries()).sort()

    // Include vary headers in cache key
    const varyValues = varyHeaders.map(header => {
      const value = request.headers.get(header.toLowerCase()) || ''
      return `${header}:${value}`
    }).sort()

    const keyData = {
      pathname,
      searchParams,
      varyValues
    }

    const keyString = JSON.stringify(keyData)
    const hash = crypto.createHash('sha256').update(keyString).digest('hex')

    return `response_cache:${hash}`
  }

  private generateETag(content: string): string {
    return `"${crypto.createHash('md5').update(content).digest('hex')}"`
  }

  private generateCacheControlHeader(ttl: number): string {
    const directives = [
      `max-age=${ttl}`,
      `s-maxage=${ttl}`,
      `stale-while-revalidate=${this.config.staleWhileRevalidate}`,
      `stale-if-error=${this.config.staleIfError}`
    ]

    return directives.join(', ')
  }

  private async handleConditionalRequest(
    request: NextRequest,
    cacheKey: string
  ): Promise<NextResponse | null> {
    const ifNoneMatch = request.headers.get('if-none-match')
    const ifModifiedSince = request.headers.get('if-modified-since')

    if (!ifNoneMatch && !ifModifiedSince) {
      return null
    }

    const cached = await this.getFromCache(cacheKey)
    if (!cached) {
      return null
    }

    // Check ETag
    if (ifNoneMatch && ifNoneMatch === cached.etag) {
      return new NextResponse(null, { status: 304 })
    }

    // Check Last-Modified
    if (ifModifiedSince) {
      const modifiedSince = new Date(ifModifiedSince)
      const lastModified = new Date(cached.lastModified)

      if (lastModified <= modifiedSince) {
        return new NextResponse(null, { status: 304 })
      }
    }

    return null
  }

  private async getFromCache(key: string): Promise<CacheEntry | null> {
    try {
      const cached = await this.redis.get(key)
      if (cached) {
        return JSON.parse(cached) as CacheEntry
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }
    return null
  }

  private async setCache(key: string, entry: CacheEntry, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(entry))
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }

  private async storeCacheTags(key: string, tags: string[], ttl: number): Promise<void> {
    if (tags.length === 0) return

    try {
      const pipeline = this.redis.pipeline()

      tags.forEach(tag => {
        const tagKey = `cache_tag:${tag}`
        pipeline.sadd(tagKey, key)
        pipeline.expire(tagKey, ttl + 300) // Keep tags slightly longer
      })

      await pipeline.exec()
    } catch (error) {
      console.error('Cache tag storage error:', error)
    }
  }

  private isFresh(cached: CacheEntry): boolean {
    const age = (Date.now() - cached.timestamp) / 1000
    return age < cached.ttl
  }

  private isStaleButRevalidatable(cached: CacheEntry): boolean {
    const age = (Date.now() - cached.timestamp) / 1000
    return age < (cached.ttl + this.config.staleWhileRevalidate)
  }

  private createCachedResponse(cached: CacheEntry, cacheStatus: string): NextResponse {
    const headers = new Headers(cached.headers)
    headers.set('X-Cache', cacheStatus)
    headers.set('Age', Math.floor((Date.now() - cached.timestamp) / 1000).toString())

    return new NextResponse(cached.body, {
      status: cached.status,
      headers
    })
  }

  private async revalidateInBackground(
    request: NextRequest,
    cacheKey: string,
    rule: CacheRule
  ): Promise<void> {
    // This would trigger a background revalidation
    // In practice, you'd queue this for processing
    setTimeout(async () => {
      try {
        // Make a fresh request to regenerate cache
        const freshResponse = await fetch(request.url, {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries())
        })

        if (freshResponse.ok) {
          const body = await freshResponse.text()
          const etag = this.generateETag(body)
          const lastModified = new Date().toISOString()

          const cacheEntry: CacheEntry = {
            body,
            headers: Object.fromEntries(freshResponse.headers.entries()),
            status: freshResponse.status,
            timestamp: Date.now(),
            etag,
            lastModified,
            ttl: rule.ttl
          }

          await this.setCache(cacheKey, cacheEntry, rule.ttl)
        }
      } catch (error) {
        console.error('Background revalidation failed:', error)
      }
    }, 0)
  }

  // Cache invalidation methods
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `cache_tag:${tag}`
      const cacheKeys = await this.redis.smembers(tagKey)

      if (cacheKeys.length > 0) {
        // Remove cache entries
        await this.redis.del(...cacheKeys)

        // Remove tag
        await this.redis.del(tagKey)

        console.log(`Invalidated ${cacheKeys.length} cache entries for tag: ${tag}`)
      }
    } catch (error) {
      console.error(`Cache invalidation failed for tag ${tag}:`, error)
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)

      if (keys.length > 0) {
        await this.redis.del(...keys)
        console.log(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`)
      }
    } catch (error) {
      console.error(`Cache invalidation failed for pattern ${pattern}:`, error)
    }
  }

  async invalidateByKey(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error(`Cache invalidation failed for key ${key}:`, error)
    }
  }

  // Handle data changes with smart invalidation
  async handleDataChange(entityType: string, entityId: string, action: string): Promise<void> {
    const invalidationMap: Record<string, string[]> = {
      'client': ['clients', 'dashboard', 'analytics'],
      'document': ['documents', 'clients', 'dashboard'],
      'task': ['tasks', 'dashboard', 'analytics'],
      'user': ['organization', 'dashboard'],
      'organization': ['organization', 'clients', 'dashboard', 'analytics'],
      'quickbooks': ['quickbooks', 'sync', 'clients', 'analytics'],
      'report': ['reports', 'analytics']
    }

    const tagsToInvalidate = invalidationMap[entityType] || []

    // Invalidate related cache tags
    const invalidationPromises = tagsToInvalidate.map(tag =>
      this.invalidateByTag(tag)
    )

    // Specific key invalidation for the entity
    invalidationPromises.push(
      this.invalidateByPattern(`response_cache:*${entityType}*${entityId}*`)
    )

    await Promise.all(invalidationPromises)
  }

  // Cache statistics and monitoring
  getCacheStats(): {
    hitRate: number
    hits: number
    misses: number
    totalRequests: number
  } {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0

    return {
      hitRate,
      hits: this.hitCount,
      misses: this.missCount,
      totalRequests
    }
  }

  resetStats(): void {
    this.hitCount = 0
    this.missCount = 0
  }

  async getCacheSize(): Promise<{
    keyCount: number
    memoryUsage: number
    oldestEntry: Date | null
    newestEntry: Date | null
  }> {
    try {
      const keys = await this.redis.keys('response_cache:*')
      let oldestTimestamp = Date.now()
      let newestTimestamp = 0

      // Sample a few entries to get timestamp range
      const sampleSize = Math.min(keys.length, 10)
      for (let i = 0; i < sampleSize; i++) {
        const cached = await this.getFromCache(keys[i])
        if (cached) {
          oldestTimestamp = Math.min(oldestTimestamp, cached.timestamp)
          newestTimestamp = Math.max(newestTimestamp, cached.timestamp)
        }
      }

      return {
        keyCount: keys.length,
        memoryUsage: 0, // Would need Redis MEMORY USAGE command
        oldestEntry: oldestTimestamp < Date.now() ? new Date(oldestTimestamp) : null,
        newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp) : null
      }
    } catch (error) {
      console.error('Failed to get cache size:', error)
      return {
        keyCount: 0,
        memoryUsage: 0,
        oldestEntry: null,
        newestEntry: null
      }
    }
  }

  // Tax season optimizations
  async optimizeForTaxSeason(): Promise<void> {
    console.log('Optimizing response cache for tax season...')

    // Reduce cache TTLs for frequently changing data
    this.rules.set('dashboard', {
      ...this.rules.get('dashboard')!,
      ttl: 60 // 1 minute during tax season
    })

    this.rules.set('tasks', {
      ...this.rules.get('tasks')!,
      ttl: 30 // 30 seconds during tax season
    })

    this.rules.set('documents', {
      ...this.rules.get('documents')!,
      ttl: 120 // 2 minutes during tax season
    })

    // Add tax-specific cache rules
    this.addRule('tax-forms', {
      pattern: /^\/api\/tax/,
      ttl: 300, // 5 minutes
      varyHeaders: ['Authorization'],
      tags: ['tax', 'forms'],
      condition: (req) => req.method === 'GET'
    })

    console.log('Tax season cache optimization completed')
  }
}

// Factory function for creating middleware
export function createResponseCacheMiddleware(redis: Redis, config?: Partial<CacheConfig>) {
  return new ResponseCacheMiddleware(redis, config)
}

export { ResponseCacheMiddleware }
export type { CacheConfig, CacheEntry, CacheRule }