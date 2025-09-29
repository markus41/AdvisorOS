import { TRPCError } from '@trpc/server'
import { Redis } from 'ioredis'
import { z } from 'zod'
import crypto from 'crypto'
import { CacheService } from '../services/cache.service'
import { RateLimitService, createRateLimitMiddleware } from './rate-limiting.middleware'
import { prisma } from '../db'

// Enhanced tRPC middleware configuration
interface MiddlewareConfig {
  redis: Redis
  cacheService: CacheService
  rateLimitService: RateLimitService
  enableProfiling?: boolean
  enableSecurityLogging?: boolean
  maxRequestSize?: number
  allowedOrigins?: string[]
}

interface RequestMetrics {
  requestId: string
  method: string
  path: string
  organizationId?: string
  userId?: string
  startTime: number
  endTime?: number
  duration?: number
  cacheHit?: boolean
  cacheKey?: string
  rateLimitInfo?: any
  errorCode?: string
  errorMessage?: string
  requestSize?: number
  responseSize?: number
  memoryUsage?: NodeJS.MemoryUsage
  cpuUsage?: NodeJS.CpuUsage
}

interface SecurityEvent {
  eventType: 'suspicious_request' | 'rate_limit_exceeded' | 'invalid_input' | 'authorization_failure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata: Record<string, any>
  ipAddress?: string
  userAgent?: string
  userId?: string
  organizationId?: string
}

// Performance monitoring middleware
export function createPerformanceMiddleware(config: MiddlewareConfig) {
  return async ({ ctx, next, path, type }: any) => {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()
    const startCpuUsage = process.cpuUsage()
    const startMemory = process.memoryUsage()

    const metrics: RequestMetrics = {
      requestId,
      method: type,
      path,
      organizationId: ctx.session?.user?.organizationId,
      userId: ctx.session?.user?.id,
      startTime,
    }

    // Add request ID to context for logging
    ctx.requestId = requestId

    try {
      const result = await next()

      // Calculate performance metrics
      const endTime = Date.now()
      const endCpuUsage = process.cpuUsage(startCpuUsage)
      const endMemory = process.memoryUsage()

      metrics.endTime = endTime
      metrics.duration = endTime - startTime
      metrics.memoryUsage = {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      }
      metrics.cpuUsage = endCpuUsage

      // Log metrics for analysis
      await logRequestMetrics(config, metrics)

      // Check for performance issues
      if (metrics.duration! > 5000) { // > 5 seconds
        await logSecurityEvent(config, {
          eventType: 'suspicious_request',
          severity: 'medium',
          description: 'Slow request detected',
          metadata: { duration: metrics.duration, path },
          userId: metrics.userId,
          organizationId: metrics.organizationId,
        })
      }

      return result
    } catch (error) {
      const endTime = Date.now()
      metrics.endTime = endTime
      metrics.duration = endTime - startTime

      if (error instanceof TRPCError) {
        metrics.errorCode = error.code
        metrics.errorMessage = error.message
      } else {
        metrics.errorCode = 'INTERNAL_SERVER_ERROR'
        metrics.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      }

      await logRequestMetrics(config, metrics)
      throw error
    }
  }
}

// Enhanced caching middleware with intelligent invalidation
export function createEnhancedCachingMiddleware(config: MiddlewareConfig) {
  return (ttl: number = 300, tags: string[] = []) => {
    return async ({ ctx, next, path, type, input }: any) => {
      // Only cache queries, not mutations
      if (type !== 'query') {
        const result = await next()

        // Invalidate cache after mutations
        if (type === 'mutation') {
          await invalidateCacheForMutation(config, path, ctx, input)
        }

        return result
      }

      // Generate cache key based on path, input, and user context
      const cacheKey = generateCacheKey(path, input, ctx)

      // Try to get from cache first
      const cached = await config.cacheService.get(cacheKey)
      if (cached !== null) {
        ctx.cacheHit = true
        ctx.cacheKey = cacheKey
        return cached
      }

      // Execute the procedure
      const result = await next()

      // Cache the result with tags for intelligent invalidation
      if (tags.length > 0) {
        await config.cacheService.setWithTags(cacheKey, result, ttl, tags)
      } else {
        await config.cacheService.set(cacheKey, result, ttl)
      }

      ctx.cacheHit = false
      ctx.cacheKey = cacheKey

      return result
    }
  }
}

// API Key authentication and tracking middleware
export function createApiKeyMiddleware(config: MiddlewareConfig) {
  return async ({ ctx, next, path }: any) => {
    const apiKey = ctx.req?.headers['x-api-key']

    if (!apiKey) {
      return next() // Continue with session auth
    }

    try {
      // Hash the API key for lookup
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

      // Find the API key in database
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { organization: true, creator: true }
      })

      if (!apiKeyRecord || !apiKeyRecord.isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or inactive API key'
        })
      }

      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'API key has expired'
        })
      }

      // Check IP whitelist if configured
      if (apiKeyRecord.ipWhitelist.length > 0) {
        const clientIP = getClientIP(ctx.req)
        if (!apiKeyRecord.ipWhitelist.includes(clientIP)) {
          await logSecurityEvent(config, {
            eventType: 'authorization_failure',
            severity: 'high',
            description: 'API key used from unauthorized IP',
            metadata: { apiKeyId: apiKeyRecord.id, clientIP, allowedIPs: apiKeyRecord.ipWhitelist },
            organizationId: apiKeyRecord.organizationId
          })

          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'API key not authorized for this IP address'
          })
        }
      }

      // Check API key specific rate limits
      if (apiKeyRecord.rateLimit) {
        const rateLimitResult = await config.rateLimitService.checkRateLimit(
          `apikey:${apiKeyRecord.id}`,
          {
            windowMs: 60000,
            maxRequests: apiKeyRecord.rateLimit,
            enableHeaders: true
          },
          apiKeyRecord.organizationId,
          apiKeyRecord.createdBy
        )

        if (!rateLimitResult.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'API key rate limit exceeded',
            cause: rateLimitResult.info
          })
        }
      }

      // Check scopes and permissions
      const requiredScope = getRequiredScope(path)
      if (requiredScope && !apiKeyRecord.scopes.includes(requiredScope)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `API key does not have required scope: ${requiredScope}`
        })
      }

      // Update last used timestamp and usage count
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 }
        }
      })

      // Track API usage for analytics
      await trackApiUsage(config, apiKeyRecord.id, path, ctx)

      // Set API key context
      ctx.apiKey = apiKeyRecord
      ctx.session = {
        user: {
          id: apiKeyRecord.createdBy,
          organizationId: apiKeyRecord.organizationId,
          role: 'api'
        }
      }

      return next()
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      console.error('API key middleware error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'API key validation failed'
      })
    }
  }
}

// Input validation and sanitization middleware
export function createInputValidationMiddleware(config: MiddlewareConfig) {
  return async ({ ctx, next, input, path }: any) => {
    try {
      // Check request size
      if (config.maxRequestSize) {
        const requestSize = JSON.stringify(input).length
        if (requestSize > config.maxRequestSize) {
          await logSecurityEvent(config, {
            eventType: 'suspicious_request',
            severity: 'medium',
            description: 'Request size exceeds limit',
            metadata: { requestSize, limit: config.maxRequestSize, path },
            userId: ctx.session?.user?.id,
            organizationId: ctx.session?.user?.organizationId
          })

          throw new TRPCError({
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Request payload too large'
          })
        }
      }

      // Detect potential SQL injection patterns
      if (input && typeof input === 'object') {
        const inputString = JSON.stringify(input).toLowerCase()
        const sqlPatterns = [
          /union\s+select/,
          /drop\s+table/,
          /delete\s+from/,
          /insert\s+into/,
          /update\s+set/,
          /exec\s*\(/,
          /script\s*>/,
          /javascript:/,
          /vbscript:/
        ]

        for (const pattern of sqlPatterns) {
          if (pattern.test(inputString)) {
            await logSecurityEvent(config, {
              eventType: 'suspicious_request',
              severity: 'high',
              description: 'Potential injection attack detected',
              metadata: { pattern: pattern.source, path, input: inputString.substring(0, 200) },
              userId: ctx.session?.user?.id,
              organizationId: ctx.session?.user?.organizationId
            })

            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid input detected'
            })
          }
        }
      }

      return next()
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      await logSecurityEvent(config, {
        eventType: 'invalid_input',
        severity: 'medium',
        description: 'Input validation error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error', path },
        userId: ctx.session?.user?.id,
        organizationId: ctx.session?.user?.organizationId
      })

      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Input validation failed'
      })
    }
  }
}

// Response compression middleware
export function createCompressionMiddleware() {
  return async ({ ctx, next }: any) => {
    const result = await next()

    // Add compression headers for large responses
    if (result && typeof result === 'object') {
      const responseSize = JSON.stringify(result).length
      if (responseSize > 1024) { // 1KB threshold
        ctx.res?.setHeader('Content-Encoding', 'gzip')
      }
    }

    return result
  }
}

// Helper functions
function generateCacheKey(path: string, input: any, ctx: any): string {
  const keyParts = [
    'trpc',
    path,
    ctx.session?.user?.organizationId || 'public',
    ctx.session?.user?.id || 'anonymous'
  ]

  if (input) {
    const inputHash = crypto.createHash('md5').update(JSON.stringify(input)).digest('hex')
    keyParts.push(inputHash)
  }

  return keyParts.join(':')
}

async function invalidateCacheForMutation(
  config: MiddlewareConfig,
  path: string,
  ctx: any,
  input: any
): Promise<void> {
  const organizationId = ctx.session?.user?.organizationId

  // Define cache invalidation rules based on mutation type
  const invalidationRules: Record<string, string[]> = {
    'client.create': ['client.*', 'dashboard.*'],
    'client.update': ['client.*', 'dashboard.*'],
    'client.delete': ['client.*', 'dashboard.*'],
    'document.create': ['document.*', 'client.*'],
    'document.update': ['document.*'],
    'document.delete': ['document.*', 'client.*'],
    'task.create': ['task.*', 'dashboard.*'],
    'task.update': ['task.*', 'dashboard.*'],
    'task.complete': ['task.*', 'dashboard.*', 'report.*'],
    'user.update': ['user.*'],
    'organization.update': ['*'] // Invalidate everything for org updates
  }

  const patterns = invalidationRules[path] || []

  for (const pattern of patterns) {
    if (pattern === '*') {
      await config.cacheService.invalidateOrganization(organizationId)
    } else {
      const cachePattern = `trpc:${pattern}:${organizationId}:*`
      await config.cacheService.deletePattern(cachePattern)
    }
  }
}

function getRequiredScope(path: string): string | null {
  const scopeMap: Record<string, string> = {
    'client.list': 'clients:read',
    'client.byId': 'clients:read',
    'client.create': 'clients:write',
    'client.update': 'clients:write',
    'client.delete': 'clients:delete',
    'document.list': 'documents:read',
    'document.upload': 'documents:write',
    'task.list': 'tasks:read',
    'task.create': 'tasks:write',
    'invoice.list': 'billing:read',
    'invoice.create': 'billing:write',
    'report.generate': 'reports:read'
  }

  return scopeMap[path] || null
}

function getClientIP(req: any): string {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown'
}

async function trackApiUsage(
  config: MiddlewareConfig,
  apiKeyId: string,
  endpoint: string,
  ctx: any
): Promise<void> {
  try {
    const startTime = Date.now()

    // This would be called after the request completes
    setTimeout(async () => {
      const responseTime = Date.now() - startTime

      await prisma.apiKeyUsage.create({
        data: {
          apiKeyId,
          endpoint,
          method: ctx.type || 'UNKNOWN',
          ipAddress: getClientIP(ctx.req),
          userAgent: ctx.req?.headers['user-agent'],
          statusCode: 200, // This would need to be determined from the response
          responseTime,
          timestamp: new Date()
        }
      })
    }, 0)
  } catch (error) {
    console.error('Failed to track API usage:', error)
  }
}

async function logRequestMetrics(
  config: MiddlewareConfig,
  metrics: RequestMetrics
): Promise<void> {
  try {
    // Store metrics in Redis for real-time monitoring
    const metricsKey = `metrics:${metrics.requestId}`
    await config.redis.setex(metricsKey, 3600, JSON.stringify(metrics)) // 1 hour retention

    // Store aggregated metrics for analytics
    const hourKey = `metrics:hourly:${new Date(metrics.startTime).toISOString().slice(0, 13)}`
    await config.redis.hincrby(hourKey, 'requests', 1)
    await config.redis.hincrby(hourKey, 'total_duration', metrics.duration || 0)
    await config.redis.expire(hourKey, 86400) // 24 hour retention

    if (metrics.organizationId) {
      const orgHourKey = `metrics:org:${metrics.organizationId}:${new Date(metrics.startTime).toISOString().slice(0, 13)}`
      await config.redis.hincrby(orgHourKey, 'requests', 1)
      await config.redis.hincrby(orgHourKey, 'total_duration', metrics.duration || 0)
      await config.redis.expire(orgHourKey, 86400)
    }
  } catch (error) {
    console.error('Failed to log request metrics:', error)
  }
}

async function logSecurityEvent(
  config: MiddlewareConfig,
  event: SecurityEvent
): Promise<void> {
  try {
    if (!config.enableSecurityLogging) return

    // Store in database for long-term analysis
    await prisma.securityEvent.create({
      data: {
        eventType: event.eventType,
        severity: event.severity,
        description: event.description,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        userId: event.userId,
        organizationId: event.organizationId,
        metadata: event.metadata
      }
    })

    // Store in Redis for real-time alerting
    const eventKey = `security:${Date.now()}:${crypto.randomUUID()}`
    await config.redis.setex(eventKey, 3600, JSON.stringify(event))

    // Trigger alerts for high/critical severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      // This would integrate with your alerting system
      console.warn('Security event detected:', event)
    }
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Export middleware factory
export function createEnhancedTRPCMiddleware(config: MiddlewareConfig) {
  return {
    performance: createPerformanceMiddleware(config),
    caching: createEnhancedCachingMiddleware(config),
    apiKey: createApiKeyMiddleware(config),
    validation: createInputValidationMiddleware(config),
    compression: createCompressionMiddleware(),
    rateLimit: createRateLimitMiddleware(config.redis)
  }
}

export type { MiddlewareConfig, RequestMetrics, SecurityEvent }