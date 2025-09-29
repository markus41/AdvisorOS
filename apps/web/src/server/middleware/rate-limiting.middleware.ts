import { TRPCError } from '@trpc/server'
import { Redis } from 'ioredis'
import { z } from 'zod'

// Rate limiting configuration schema
const RateLimitConfigSchema = z.object({
  windowMs: z.number().min(1000).default(60000), // 1 minute default
  maxRequests: z.number().min(1).default(100),
  keyGenerator: z.function().optional(),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
  enableHeaders: z.boolean().default(true),
})

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>

interface RateLimitInfo {
  limit: number
  current: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

interface RateLimitResult {
  allowed: boolean
  info: RateLimitInfo
  headers: Record<string, string>
}

interface OrganizationLimits {
  organizationId: string
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
  limits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
    concurrentConnections: number
    dataTransferMB: number
  }
  customLimits?: Partial<RateLimitConfig>
  bypassRateLimit?: boolean
}

// Default rate limits by tier
const DEFAULT_TIER_LIMITS: Record<string, OrganizationLimits['limits']> = {
  free: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    concurrentConnections: 5,
    dataTransferMB: 100,
  },
  basic: {
    requestsPerMinute: 200,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    concurrentConnections: 20,
    dataTransferMB: 1000,
  },
  premium: {
    requestsPerMinute: 500,
    requestsPerHour: 15000,
    requestsPerDay: 150000,
    concurrentConnections: 50,
    dataTransferMB: 5000,
  },
  enterprise: {
    requestsPerMinute: 2000,
    requestsPerHour: 100000,
    requestsPerDay: 1000000,
    concurrentConnections: 200,
    dataTransferMB: 50000,
  },
}

export class RateLimitService {
  private redis: Redis
  private organizationLimits = new Map<string, OrganizationLimits>()
  private alerts = new Map<string, { count: number; lastAlert: Date }>()

  constructor(redis: Redis) {
    this.redis = redis
  }

  // CORE RATE LIMITING
  async checkRateLimit(
    key: string,
    config: RateLimitConfig,
    organizationId?: string,
    userId?: string
  ): Promise<RateLimitResult> {
    const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs
    const windowKey = `rate_limit:${key}:${windowStart}`

    // Get organization-specific limits
    const orgLimits = organizationId ? await this.getOrganizationLimits(organizationId) : null
    const effectiveLimit = this.calculateEffectiveLimit(config, orgLimits)

    // Check if organization has bypass
    if (orgLimits?.bypassRateLimit) {
      return {
        allowed: true,
        info: {
          limit: effectiveLimit.maxRequests,
          current: 0,
          remaining: effectiveLimit.maxRequests,
          resetTime: new Date(windowStart + effectiveLimit.windowMs),
        },
        headers: {},
      }
    }

    const pipeline = this.redis.pipeline()
    pipeline.incr(windowKey)
    pipeline.expire(windowKey, Math.ceil(effectiveLimit.windowMs / 1000))

    const results = await pipeline.exec()
    const current = (results?.[0]?.[1] as number) || 0

    const remaining = Math.max(0, effectiveLimit.maxRequests - current)
    const resetTime = new Date(windowStart + effectiveLimit.windowMs)
    const allowed = current <= effectiveLimit.maxRequests

    const info: RateLimitInfo = {
      limit: effectiveLimit.maxRequests,
      current,
      remaining,
      resetTime,
    }

    if (!allowed) {
      info.retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000)

      // Log rate limit violation
      await this.logRateLimitViolation(key, organizationId, userId, info)
    }

    const headers: Record<string, string> = {}
    if (effectiveLimit.enableHeaders) {
      headers['X-RateLimit-Limit'] = effectiveLimit.maxRequests.toString()
      headers['X-RateLimit-Remaining'] = remaining.toString()
      headers['X-RateLimit-Reset'] = resetTime.getTime().toString()
      if (!allowed && info.retryAfter) {
        headers['Retry-After'] = info.retryAfter.toString()
      }
    }

    return { allowed, info, headers }
  }

  private calculateEffectiveLimit(
    baseConfig: RateLimitConfig,
    orgLimits: OrganizationLimits | null
  ): RateLimitConfig {
    if (!orgLimits?.customLimits) {
      return baseConfig
    }

    return {
      ...baseConfig,
      ...orgLimits.customLimits,
    }
  }

  // ORGANIZATION LIMITS MANAGEMENT
  async setOrganizationLimits(limits: OrganizationLimits): Promise<void> {
    this.organizationLimits.set(limits.organizationId, limits)

    // Cache in Redis for distributed access
    await this.redis.setex(
      `org_limits:${limits.organizationId}`,
      3600, // 1 hour TTL
      JSON.stringify(limits)
    )
  }

  async getOrganizationLimits(organizationId: string): Promise<OrganizationLimits | null> {
    // Check memory cache first
    let limits = this.organizationLimits.get(organizationId)

    if (!limits) {
      // Check Redis cache
      const cached = await this.redis.get(`org_limits:${organizationId}`)
      if (cached) {
        limits = JSON.parse(cached)
        this.organizationLimits.set(organizationId, limits!)
      }
    }

    return limits || null
  }

  async updateOrganizationTier(
    organizationId: string,
    tier: OrganizationLimits['tier']
  ): Promise<void> {
    const existingLimits = await this.getOrganizationLimits(organizationId)
    const newLimits: OrganizationLimits = {
      organizationId,
      tier,
      limits: DEFAULT_TIER_LIMITS[tier],
      customLimits: existingLimits?.customLimits,
      bypassRateLimit: existingLimits?.bypassRateLimit,
    }

    await this.setOrganizationLimits(newLimits)
  }

  // ENDPOINT-SPECIFIC RATE LIMITING
  async checkEndpointRateLimit(
    endpoint: string,
    organizationId: string,
    userId: string,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const orgLimits = await this.getOrganizationLimits(organizationId)

    // Determine rate limit based on endpoint and organization tier
    let config: RateLimitConfig

    if (customConfig) {
      config = RateLimitConfigSchema.parse(customConfig)
    } else {
      config = this.getEndpointConfig(endpoint, orgLimits?.tier || 'free')
    }

    const key = `endpoint:${endpoint}:org:${organizationId}:user:${userId}`
    return this.checkRateLimit(key, config, organizationId, userId)
  }

  private getEndpointConfig(endpoint: string, tier: string): RateLimitConfig {
    const tierLimits = DEFAULT_TIER_LIMITS[tier]

    // Different endpoints have different rate limits
    const endpointConfigs: Record<string, Partial<RateLimitConfig>> = {
      'client.list': {
        windowMs: 60000,
        maxRequests: Math.floor(tierLimits.requestsPerMinute * 0.3),
      },
      'client.create': {
        windowMs: 60000,
        maxRequests: Math.floor(tierLimits.requestsPerMinute * 0.1),
      },
      'client.update': {
        windowMs: 60000,
        maxRequests: Math.floor(tierLimits.requestsPerMinute * 0.2),
      },
      'client.search': {
        windowMs: 60000,
        maxRequests: Math.floor(tierLimits.requestsPerMinute * 0.4),
      },
      'client.aggregations': {
        windowMs: 300000, // 5 minutes
        maxRequests: Math.floor(tierLimits.requestsPerMinute * 0.1),
      },
      'documents.upload': {
        windowMs: 60000,
        maxRequests: Math.floor(tierLimits.requestsPerMinute * 0.05),
      },
      'ai.generate': {
        windowMs: 60000,
        maxRequests: Math.floor(tierLimits.requestsPerMinute * 0.02),
      },
    }

    const endpointConfig = endpointConfigs[endpoint] || {}

    return RateLimitConfigSchema.parse({
      windowMs: 60000,
      maxRequests: tierLimits.requestsPerMinute,
      ...endpointConfig,
    })
  }

  // PROGRESSIVE RATE LIMITING
  async checkProgressiveRateLimit(
    key: string,
    organizationId: string,
    userId: string
  ): Promise<{ allowed: boolean; warningLevel: number; info: RateLimitInfo }> {
    const orgLimits = await this.getOrganizationLimits(organizationId)
    const tierLimits = orgLimits?.limits || DEFAULT_TIER_LIMITS.free

    // Check multiple time windows
    const checks = await Promise.all([
      this.checkRateLimit(key + ':1m', {
        windowMs: 60000,
        maxRequests: tierLimits.requestsPerMinute,
      }, organizationId, userId),
      this.checkRateLimit(key + ':1h', {
        windowMs: 3600000,
        maxRequests: tierLimits.requestsPerHour,
      }, organizationId, userId),
      this.checkRateLimit(key + ':1d', {
        windowMs: 86400000,
        maxRequests: tierLimits.requestsPerDay,
      }, organizationId, userId),
    ])

    const minuteCheck = checks[0]
    const hourCheck = checks[1]
    const dayCheck = checks[2]

    // Calculate warning level (0 = green, 1 = yellow, 2 = orange, 3 = red)
    let warningLevel = 0

    const minuteUsage = (minuteCheck.info.current / minuteCheck.info.limit) * 100
    const hourUsage = (hourCheck.info.current / hourCheck.info.limit) * 100
    const dayUsage = (dayCheck.info.current / dayCheck.info.limit) * 100

    if (minuteUsage > 80 || hourUsage > 90 || dayUsage > 95) warningLevel = 3
    else if (minuteUsage > 60 || hourUsage > 75 || dayUsage > 85) warningLevel = 2
    else if (minuteUsage > 40 || hourUsage > 60 || dayUsage > 70) warningLevel = 1

    // Send warnings before hitting limits
    if (warningLevel >= 2) {
      await this.sendRateLimitWarning(organizationId, userId, warningLevel, {
        minute: minuteUsage,
        hour: hourUsage,
        day: dayUsage,
      })
    }

    const allowed = minuteCheck.allowed && hourCheck.allowed && dayCheck.allowed

    return {
      allowed,
      warningLevel,
      info: minuteCheck.info, // Return the most restrictive (minute) info
    }
  }

  // CONCURRENT CONNECTION LIMITING
  async checkConcurrentConnections(
    organizationId: string,
    userId: string,
    connectionId: string
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const orgLimits = await this.getOrganizationLimits(organizationId)
    const limit = orgLimits?.limits.concurrentConnections || DEFAULT_TIER_LIMITS.free.concurrentConnections

    const connectionKey = `connections:org:${organizationId}`
    const userConnectionKey = `connections:user:${userId}`

    // Add this connection
    await this.redis.sadd(connectionKey, connectionId)
    await this.redis.sadd(userConnectionKey, connectionId)

    // Set expiration for cleanup
    await this.redis.expire(connectionKey, 300) // 5 minutes
    await this.redis.expire(userConnectionKey, 300)

    const current = await this.redis.scard(connectionKey)
    const allowed = current <= limit

    if (!allowed) {
      // Remove the connection if not allowed
      await this.redis.srem(connectionKey, connectionId)
      await this.redis.srem(userConnectionKey, connectionId)
    }

    return { allowed, current, limit }
  }

  async removeConnection(
    organizationId: string,
    userId: string,
    connectionId: string
  ): Promise<void> {
    const connectionKey = `connections:org:${organizationId}`
    const userConnectionKey = `connections:user:${userId}`

    await Promise.all([
      this.redis.srem(connectionKey, connectionId),
      this.redis.srem(userConnectionKey, connectionId),
    ])
  }

  // RATE LIMIT VIOLATION HANDLING
  private async logRateLimitViolation(
    key: string,
    organizationId?: string,
    userId?: string,
    info?: RateLimitInfo
  ): Promise<void> {
    const violation = {
      timestamp: new Date(),
      key,
      organizationId,
      userId,
      current: info?.current,
      limit: info?.limit,
      ip: null, // Could be added from request context
    }

    // Log to Redis for analysis
    const violationKey = `rate_limit_violations:${Date.now()}`
    await this.redis.setex(violationKey, 86400, JSON.stringify(violation)) // 24 hour retention

    // Alert if too many violations
    if (organizationId) {
      await this.checkForRepeatedViolations(organizationId, userId)
    }
  }

  private async checkForRepeatedViolations(
    organizationId: string,
    userId?: string
  ): Promise<void> {
    const alertKey = userId ? `${organizationId}:${userId}` : organizationId
    const alert = this.alerts.get(alertKey) || { count: 0, lastAlert: new Date(0) }

    alert.count++

    // Send alert if 10+ violations in 5 minutes
    if (alert.count >= 10 && Date.now() - alert.lastAlert.getTime() > 300000) {
      await this.sendRateLimitAlert(organizationId, userId, alert.count)
      alert.lastAlert = new Date()
      alert.count = 0
    }

    this.alerts.set(alertKey, alert)
  }

  private async sendRateLimitWarning(
    organizationId: string,
    userId: string,
    warningLevel: number,
    usage: { minute: number; hour: number; day: number }
  ): Promise<void> {
    // This would integrate with your notification service
    console.log(`Rate limit warning for org ${organizationId}, user ${userId}:`, {
      warningLevel,
      usage,
    })
  }

  private async sendRateLimitAlert(
    organizationId: string,
    userId: string | undefined,
    violationCount: number
  ): Promise<void> {
    // This would integrate with your alerting service
    console.log(`Rate limit alert for org ${organizationId}:`, {
      userId,
      violationCount,
      message: 'Repeated rate limit violations detected',
    })
  }

  // ANALYTICS AND REPORTING
  async getRateLimitMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // This would typically query stored metrics
    const violations = await this.redis.keys(`rate_limit_violations:*`)
    const violationData = await Promise.all(
      violations.map(key => this.redis.get(key))
    )

    const parsedViolations = violationData
      .filter(Boolean)
      .map(data => JSON.parse(data!))
      .filter(v => v.organizationId === organizationId)
      .filter(v => {
        const timestamp = new Date(v.timestamp)
        return timestamp >= startDate && timestamp <= endDate
      })

    return {
      organizationId,
      period: { startDate, endDate },
      totalViolations: parsedViolations.length,
      violationsByEndpoint: this.groupBy(parsedViolations, 'key'),
      violationsByUser: this.groupBy(parsedViolations, 'userId'),
      violationsByHour: this.groupViolationsByHour(parsedViolations),
    }
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown'
      groups[group] = (groups[group] || 0) + 1
      return groups
    }, {})
  }

  private groupViolationsByHour(violations: any[]): Record<string, number> {
    return violations.reduce((groups, violation) => {
      const hour = new Date(violation.timestamp).getHours().toString()
      groups[hour] = (groups[hour] || 0) + 1
      return groups
    }, {})
  }

  // CLEANUP
  async cleanup(): Promise<void> {
    // Clean up old violation logs
    const cutoff = Date.now() - 86400000 // 24 hours ago
    const keys = await this.redis.keys('rate_limit_violations:*')

    for (const key of keys) {
      const timestamp = parseInt(key.split(':')[1])
      if (timestamp < cutoff) {
        await this.redis.del(key)
      }
    }
  }

  // WHITELIST/BYPASS MANAGEMENT
  async setBypassRateLimit(organizationId: string, bypass: boolean): Promise<void> {
    const limits = await this.getOrganizationLimits(organizationId) || {
      organizationId,
      tier: 'free',
      limits: DEFAULT_TIER_LIMITS.free,
    }

    limits.bypassRateLimit = bypass
    await this.setOrganizationLimits(limits)
  }

  async isRateLimitBypassed(organizationId: string): Promise<boolean> {
    const limits = await this.getOrganizationLimits(organizationId)
    return limits?.bypassRateLimit || false
  }
}

// Factory function for creating rate limit middleware
export function createRateLimitMiddleware(redis: Redis) {
  const rateLimitService = new RateLimitService(redis)

  return {
    rateLimitService,

    // Middleware for specific endpoints
    endpoint: (endpointName: string, customConfig?: Partial<RateLimitConfig>) =>
      async ({ ctx, next }: any) => {
        if (!ctx.session?.user?.organizationId) {
          // Allow unauthenticated requests with basic rate limiting
          const result = await rateLimitService.checkRateLimit(
            `public:${endpointName}`,
            RateLimitConfigSchema.parse(customConfig || { maxRequests: 10 })
          )

          if (!result.allowed) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Rate limit exceeded. Please try again later.',
              cause: result.info,
            })
          }

          return next()
        }

        const result = await rateLimitService.checkEndpointRateLimit(
          endpointName,
          ctx.session.user.organizationId,
          ctx.session.user.id,
          customConfig
        )

        if (!result.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Try again in ${result.info.retryAfter} seconds.`,
            cause: result.info,
          })
        }

        // Add rate limit info to response context
        ctx.rateLimitInfo = result.info

        return next()
      },

    // Progressive rate limiting middleware
    progressive: () => async ({ ctx, next }: any) => {
      if (!ctx.session?.user?.organizationId) {
        return next()
      }

      const result = await rateLimitService.checkProgressiveRateLimit(
        `user:${ctx.session.user.id}`,
        ctx.session.user.organizationId,
        ctx.session.user.id
      )

      if (!result.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded across multiple time windows.',
          cause: result.info,
        })
      }

      // Add warning level to context for frontend handling
      ctx.rateLimitWarning = result.warningLevel

      return next()
    },
  }
}

export type { RateLimitInfo, RateLimitResult, OrganizationLimits }