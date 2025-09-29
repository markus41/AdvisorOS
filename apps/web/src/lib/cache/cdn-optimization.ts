import { Redis } from 'ioredis'

interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'azure' | 'fastly'
  zones: string[]
  apiKey: string
  purgeEndpoint: string
  enableEdgeCaching: boolean
  defaultTTL: number
  staticAssetTTL: number
  dynamicContentTTL: number
}

interface CacheControl {
  maxAge: number
  sMaxAge: number
  staleWhileRevalidate: number
  staleIfError: number
  mustRevalidate: boolean
  noCache: boolean
  noStore: boolean
  public: boolean
  private: boolean
}

interface EdgeCacheConfig {
  path: string
  pattern: string
  ttl: number
  varyHeaders: string[]
  skipCache: string[]
  customHeaders: Record<string, string>
}

class CDNOptimizationManager {
  private redis: Redis
  private config: CDNConfig
  private edgeConfigs: Map<string, EdgeCacheConfig> = new Map()

  constructor(redis: Redis, config: Partial<CDNConfig>) {
    this.redis = redis
    this.config = {
      provider: 'cloudflare',
      zones: [],
      apiKey: process.env.CDN_API_KEY || '',
      purgeEndpoint: process.env.CDN_PURGE_ENDPOINT || '',
      enableEdgeCaching: true,
      defaultTTL: 3600, // 1 hour
      staticAssetTTL: 86400, // 24 hours
      dynamicContentTTL: 300, // 5 minutes
      ...config
    }

    this.setupEdgeConfigurations()
  }

  private setupEdgeConfigurations(): void {
    // Define edge caching strategies for different content types
    const edgeConfigs: Array<[string, EdgeCacheConfig]> = [
      // Static assets - long cache
      ['static-assets', {
        path: '/static/*',
        pattern: '\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$',
        ttl: this.config.staticAssetTTL,
        varyHeaders: ['Accept-Encoding'],
        skipCache: [],
        customHeaders: {
          'Cache-Control': `public, max-age=${this.config.staticAssetTTL}, immutable`,
          'Access-Control-Allow-Origin': '*'
        }
      }],

      // API responses - short cache with validation
      ['api-responses', {
        path: '/api/*',
        pattern: '^/api/(?!auth|stripe).*',
        ttl: this.config.dynamicContentTTL,
        varyHeaders: ['Authorization', 'Accept', 'Content-Type'],
        skipCache: ['POST', 'PUT', 'DELETE', 'PATCH'],
        customHeaders: {
          'Cache-Control': `public, max-age=${this.config.dynamicContentTTL}, stale-while-revalidate=600`,
          'Vary': 'Authorization, Accept'
        }
      }],

      // Document previews - medium cache
      ['document-previews', {
        path: '/documents/preview/*',
        pattern: '^/documents/preview/.*\\.(pdf|jpg|png)$',
        ttl: 1800, // 30 minutes
        varyHeaders: ['Authorization'],
        skipCache: [],
        customHeaders: {
          'Cache-Control': 'private, max-age=1800, stale-while-revalidate=3600'
        }
      }],

      // Dashboard data - very short cache
      ['dashboard-data', {
        path: '/api/dashboard/*',
        pattern: '^/api/dashboard/.*',
        ttl: 180, // 3 minutes
        varyHeaders: ['Authorization', 'Organization-Id'],
        skipCache: ['POST', 'PUT', 'DELETE'],
        customHeaders: {
          'Cache-Control': 'private, max-age=180, stale-while-revalidate=300'
        }
      }],

      // Reports - longer cache for generated reports
      ['reports', {
        path: '/api/reports/*',
        pattern: '^/api/reports/.*\\.pdf$',
        ttl: 3600, // 1 hour
        varyHeaders: ['Authorization'],
        skipCache: [],
        customHeaders: {
          'Cache-Control': 'private, max-age=3600, stale-while-revalidate=7200'
        }
      }],

      // Public pages - long cache
      ['public-pages', {
        path: '/(about|pricing|features)/*',
        pattern: '^/(about|pricing|features).*',
        ttl: 7200, // 2 hours
        varyHeaders: ['Accept-Encoding'],
        skipCache: [],
        customHeaders: {
          'Cache-Control': `public, max-age=7200, stale-while-revalidate=14400`
        }
      }]
    ]

    edgeConfigs.forEach(([key, config]) => {
      this.edgeConfigs.set(key, config)
    })
  }

  // Generate cache control headers based on request
  generateCacheControl(request: {
    path: string
    method: string
    headers: Record<string, string>
    organizationId?: string
    isAuthenticated?: boolean
  }): CacheControl {
    const config = this.findMatchingEdgeConfig(request.path)

    if (!config) {
      return this.getDefaultCacheControl(request)
    }

    // Skip cache for certain methods
    if (config.skipCache.includes(request.method)) {
      return {
        maxAge: 0,
        sMaxAge: 0,
        staleWhileRevalidate: 0,
        staleIfError: 0,
        mustRevalidate: true,
        noCache: true,
        noStore: false,
        public: false,
        private: true
      }
    }

    const isPrivate = request.isAuthenticated || request.path.includes('/api/')
    const maxAge = config.ttl
    const sMaxAge = isPrivate ? 0 : maxAge // CDN cache only for public content

    return {
      maxAge,
      sMaxAge,
      staleWhileRevalidate: Math.min(maxAge * 2, 3600),
      staleIfError: Math.min(maxAge * 4, 86400),
      mustRevalidate: false,
      noCache: false,
      noStore: false,
      public: !isPrivate,
      private: isPrivate
    }
  }

  private findMatchingEdgeConfig(path: string): EdgeCacheConfig | null {
    for (const config of this.edgeConfigs.values()) {
      if (new RegExp(config.pattern).test(path)) {
        return config
      }
    }
    return null
  }

  private getDefaultCacheControl(request: any): CacheControl {
    const isAPI = request.path.startsWith('/api/')
    const isStatic = /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/.test(request.path)

    if (isStatic) {
      return {
        maxAge: this.config.staticAssetTTL,
        sMaxAge: this.config.staticAssetTTL,
        staleWhileRevalidate: 86400,
        staleIfError: 604800,
        mustRevalidate: false,
        noCache: false,
        noStore: false,
        public: true,
        private: false
      }
    }

    if (isAPI) {
      return {
        maxAge: this.config.dynamicContentTTL,
        sMaxAge: 0, // No CDN cache for API
        staleWhileRevalidate: 600,
        staleIfError: 3600,
        mustRevalidate: false,
        noCache: false,
        noStore: false,
        public: false,
        private: true
      }
    }

    return {
      maxAge: this.config.defaultTTL,
      sMaxAge: this.config.defaultTTL,
      staleWhileRevalidate: 3600,
      staleIfError: 86400,
      mustRevalidate: false,
      noCache: false,
      noStore: false,
      public: true,
      private: false
    }
  }

  // Convert cache control object to header string
  formatCacheControlHeader(cacheControl: CacheControl): string {
    const directives: string[] = []

    if (cacheControl.public) directives.push('public')
    if (cacheControl.private) directives.push('private')
    if (cacheControl.noCache) directives.push('no-cache')
    if (cacheControl.noStore) directives.push('no-store')
    if (cacheControl.mustRevalidate) directives.push('must-revalidate')

    if (cacheControl.maxAge > 0) {
      directives.push(`max-age=${cacheControl.maxAge}`)
    }

    if (cacheControl.sMaxAge > 0) {
      directives.push(`s-maxage=${cacheControl.sMaxAge}`)
    }

    if (cacheControl.staleWhileRevalidate > 0) {
      directives.push(`stale-while-revalidate=${cacheControl.staleWhileRevalidate}`)
    }

    if (cacheControl.staleIfError > 0) {
      directives.push(`stale-if-error=${cacheControl.staleIfError}`)
    }

    return directives.join(', ')
  }

  // Purge CDN cache
  async purgeCache(targets: {
    paths?: string[]
    tags?: string[]
    everything?: boolean
    organizationId?: string
  }): Promise<void> {
    try {
      if (targets.everything) {
        await this.purgeEverything()
        return
      }

      if (targets.paths && targets.paths.length > 0) {
        await this.purgePaths(targets.paths)
      }

      if (targets.tags && targets.tags.length > 0) {
        await this.purgeTags(targets.tags)
      }

      if (targets.organizationId) {
        await this.purgeOrganization(targets.organizationId)
      }

      // Log purge activity
      await this.logPurgeActivity(targets)

    } catch (error) {
      console.error('CDN purge failed:', error)
      throw error
    }
  }

  private async purgeEverything(): Promise<void> {
    console.log('Purging entire CDN cache...')

    const purgeRequest = {
      purge_everything: true
    }

    await this.makePurgeRequest(purgeRequest)
  }

  private async purgePaths(paths: string[]): Promise<void> {
    console.log(`Purging ${paths.length} paths from CDN...`)

    // Batch purge requests to avoid rate limits
    const batchSize = 30 // Most CDNs limit to 30 URLs per request
    const batches = []

    for (let i = 0; i < paths.length; i += batchSize) {
      batches.push(paths.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const purgeRequest = {
        files: batch
      }
      await this.makePurgeRequest(purgeRequest)
    }
  }

  private async purgeTags(tags: string[]): Promise<void> {
    console.log(`Purging CDN cache by tags: ${tags.join(', ')}`)

    const purgeRequest = {
      tags: tags
    }

    await this.makePurgeRequest(purgeRequest)
  }

  private async purgeOrganization(organizationId: string): Promise<void> {
    console.log(`Purging CDN cache for organization: ${organizationId}`)

    // Purge organization-specific paths
    const orgPaths = [
      `/api/dashboard/${organizationId}*`,
      `/api/clients/${organizationId}*`,
      `/api/documents/${organizationId}*`,
      `/api/tasks/${organizationId}*`,
      `/api/reports/${organizationId}*`
    ]

    await this.purgePaths(orgPaths)
  }

  private async makePurgeRequest(purgeData: any): Promise<void> {
    if (!this.config.purgeEndpoint || !this.config.apiKey) {
      console.warn('CDN purge not configured')
      return
    }

    const response = await fetch(this.config.purgeEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purgeData)
    })

    if (!response.ok) {
      throw new Error(`CDN purge failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('CDN purge completed:', result)
  }

  private async logPurgeActivity(targets: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      targets,
      provider: this.config.provider
    }

    await this.redis.lpush('cdn:purge_log', JSON.stringify(logEntry))
    await this.redis.ltrim('cdn:purge_log', 0, 999) // Keep last 1000 entries
  }

  // Smart purging based on data changes
  async handleDataChange(entityType: string, entityId: string, organizationId: string): Promise<void> {
    const purgePaths = this.generatePurgePathsForEntity(entityType, entityId, organizationId)
    const purgeTags = this.generatePurgeTagsForEntity(entityType)

    await this.purgeCache({
      paths: purgePaths,
      tags: purgeTags
    })
  }

  private generatePurgePathsForEntity(entityType: string, entityId: string, organizationId: string): string[] {
    const paths: string[] = []

    // Always purge dashboard
    paths.push(`/api/dashboard/${organizationId}*`)

    switch (entityType) {
      case 'client':
        paths.push(
          `/api/clients/${organizationId}*`,
          `/api/clients/${entityId}*`,
          `/api/documents/${organizationId}*`,
          `/api/tasks/${organizationId}*`
        )
        break

      case 'document':
        paths.push(
          `/api/documents/${organizationId}*`,
          `/api/documents/${entityId}*`,
          `/documents/preview/${entityId}*`,
          `/api/clients/${organizationId}*`
        )
        break

      case 'task':
        paths.push(
          `/api/tasks/${organizationId}*`,
          `/api/tasks/${entityId}*`,
          `/api/clients/${organizationId}*`
        )
        break

      case 'report':
        paths.push(
          `/api/reports/${organizationId}*`,
          `/api/reports/${entityId}*`
        )
        break

      case 'user':
        paths.push(
          `/api/users/${organizationId}*`,
          `/api/dashboard/${organizationId}*`
        )
        break

      case 'organization':
        // Purge everything for the organization
        paths.push(`/api/${organizationId}*`)
        break
    }

    return paths
  }

  private generatePurgeTagsForEntity(entityType: string): string[] {
    const tagMap: Record<string, string[]> = {
      'client': ['clients', 'dashboard', 'analytics'],
      'document': ['documents', 'clients', 'dashboard'],
      'task': ['tasks', 'dashboard', 'analytics'],
      'report': ['reports', 'analytics'],
      'user': ['users', 'dashboard'],
      'organization': ['organization', 'dashboard', 'analytics'],
      'quickbooks': ['quickbooks', 'sync', 'clients']
    }

    return tagMap[entityType] || []
  }

  // Edge cache optimization for tax season
  async optimizeForTaxSeason(): Promise<void> {
    console.log('Optimizing CDN for tax season...')

    // Reduce TTLs for frequently changing data
    const taxSeasonConfigs: Array<[string, Partial<EdgeCacheConfig>]> = [
      ['dashboard-data', { ttl: 120 }], // 2 minutes
      ['api-responses', { ttl: 180 }], // 3 minutes
      ['document-previews', { ttl: 900 }], // 15 minutes
    ]

    taxSeasonConfigs.forEach(([key, updates]) => {
      const existing = this.edgeConfigs.get(key)
      if (existing) {
        this.edgeConfigs.set(key, { ...existing, ...updates })
      }
    })

    // Preload tax season assets
    await this.preloadTaxSeasonAssets()

    console.log('CDN optimization for tax season completed')
  }

  private async preloadTaxSeasonAssets(): Promise<void> {
    // Preload commonly accessed tax forms and templates
    const taxAssets = [
      '/static/forms/1040-template.pdf',
      '/static/forms/1120-template.pdf',
      '/static/images/tax-dashboard-bg.jpg',
      '/static/js/tax-calculator.js',
      '/static/css/tax-forms.css'
    ]

    // This would trigger CDN to cache these assets
    const preloadPromises = taxAssets.map(async (asset) => {
      try {
        await fetch(asset, { method: 'HEAD' })
      } catch (error) {
        console.warn(`Failed to preload asset: ${asset}`, error)
      }
    })

    await Promise.all(preloadPromises)
  }

  // CDN analytics and monitoring
  async getCDNAnalytics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    hitRate: number
    bandwidth: number
    requests: number
    topPaths: Array<{ path: string; requests: number; bandwidth: number }>
    topCountries: Array<{ country: string; requests: number }>
    edgeResponseTimes: Array<{ edge: string; avgResponseTime: number }>
  }> {
    // This would integrate with your CDN provider's analytics API
    // For now, return mock data structure

    return {
      hitRate: 0.85, // 85% cache hit rate
      bandwidth: 1024 * 1024 * 500, // 500MB
      requests: 10000,
      topPaths: [
        { path: '/api/dashboard/*', requests: 2000, bandwidth: 1024 * 100 },
        { path: '/static/js/*', requests: 1500, bandwidth: 1024 * 200 },
        { path: '/api/documents/*', requests: 1200, bandwidth: 1024 * 150 }
      ],
      topCountries: [
        { country: 'US', requests: 6000 },
        { country: 'CA', requests: 2000 },
        { country: 'UK', requests: 1500 }
      ],
      edgeResponseTimes: [
        { edge: 'us-east-1', avgResponseTime: 45 },
        { edge: 'us-west-1', avgResponseTime: 52 },
        { edge: 'eu-west-1', avgResponseTime: 38 }
      ]
    }
  }

  // Generate CDN configuration for deployment
  generateCDNConfig(): {
    rules: Array<{
      pattern: string
      cacheLevel: string
      ttl: number
      headers: Record<string, string>
    }>
    purgeRules: Array<{
      trigger: string
      action: string
      targets: string[]
    }>
  } {
    const rules = Array.from(this.edgeConfigs.values()).map(config => ({
      pattern: config.pattern,
      cacheLevel: config.ttl > 3600 ? 'aggressive' : 'standard',
      ttl: config.ttl,
      headers: config.customHeaders
    }))

    const purgeRules = [
      {
        trigger: 'client.update',
        action: 'purge_paths',
        targets: ['/api/clients/*', '/api/dashboard/*']
      },
      {
        trigger: 'document.upload',
        action: 'purge_paths',
        targets: ['/api/documents/*', '/api/dashboard/*']
      },
      {
        trigger: 'task.update',
        action: 'purge_paths',
        targets: ['/api/tasks/*', '/api/dashboard/*']
      }
    ]

    return { rules, purgeRules }
  }
}

export { CDNOptimizationManager }
export type { CDNConfig, CacheControl, EdgeCacheConfig }