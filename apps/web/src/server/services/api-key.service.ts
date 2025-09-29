import { prisma } from '../db'
import { Redis } from 'ioredis'
import crypto from 'crypto'
import { z } from 'zod'

// API Key management schemas
const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.record(z.boolean()),
  scopes: z.array(z.string()),
  expiresAt: z.date().optional(),
  rateLimit: z.number().min(1).max(10000).optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  metadata: z.record(z.any()).optional()
})

const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.record(z.boolean()).optional(),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.date().optional(),
  rateLimit: z.number().min(1).max(10000).optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
})

interface ApiKeyUsageStats {
  apiKeyId: string
  totalRequests: number
  requestsLast24h: number
  requestsLast7d: number
  requestsLast30d: number
  averageResponseTime: number
  errorRate: number
  topEndpoints: Array<{
    endpoint: string
    requests: number
    averageResponseTime: number
  }>
  timeSeriesData: Array<{
    timestamp: Date
    requests: number
    errors: number
    averageResponseTime: number
  }>
}

interface OrganizationUsageOverview {
  organizationId: string
  totalApiKeys: number
  activeApiKeys: number
  totalRequests: number
  requestsLast24h: number
  requestQuota: number
  quotaUsagePercentage: number
  topApiKeys: Array<{
    apiKeyId: string
    name: string
    requests: number
    lastUsed: Date
  }>
  endpointBreakdown: Array<{
    endpoint: string
    requests: number
    uniqueApiKeys: number
  }>
}

export class ApiKeyService {
  constructor(private redis: Redis) {}

  // API KEY MANAGEMENT

  async createApiKey(
    input: z.infer<typeof CreateApiKeySchema>,
    organizationId: string,
    createdBy: string
  ): Promise<{ apiKey: any; plainKey: string }> {
    // Generate a secure API key
    const plainKey = this.generateApiKey()
    const keyHash = this.hashApiKey(plainKey)
    const keyPrefix = plainKey.substring(0, 8)

    // Validate input
    const validatedInput = CreateApiKeySchema.parse(input)

    // Create API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        name: validatedInput.name,
        keyHash,
        keyPrefix,
        organizationId,
        createdBy,
        permissions: validatedInput.permissions,
        scopes: validatedInput.scopes,
        expiresAt: validatedInput.expiresAt,
        rateLimit: validatedInput.rateLimit,
        ipWhitelist: validatedInput.ipWhitelist || [],
        metadata: validatedInput.metadata || {}
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Cache API key for fast lookup
    await this.cacheApiKey(apiKey)

    // Log API key creation
    await this.logApiKeyEvent('created', apiKey.id, organizationId, createdBy)

    return { apiKey, plainKey }
  }

  async updateApiKey(
    apiKeyId: string,
    input: z.infer<typeof UpdateApiKeySchema>,
    organizationId: string,
    updatedBy: string
  ): Promise<any> {
    // Validate input
    const validatedInput = UpdateApiKeySchema.parse(input)

    // Update API key
    const apiKey = await prisma.apiKey.update({
      where: {
        id: apiKeyId,
        organizationId // Ensure user can only update their org's keys
      },
      data: validatedInput,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Update cache
    await this.cacheApiKey(apiKey)

    // Log API key update
    await this.logApiKeyEvent('updated', apiKey.id, organizationId, updatedBy, {
      changes: validatedInput
    })

    return apiKey
  }

  async deleteApiKey(
    apiKeyId: string,
    organizationId: string,
    deletedBy: string
  ): Promise<void> {
    // Soft delete the API key
    await prisma.apiKey.update({
      where: {
        id: apiKeyId,
        organizationId
      },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    })

    // Remove from cache
    await this.removeCachedApiKey(apiKeyId)

    // Log API key deletion
    await this.logApiKeyEvent('deleted', apiKeyId, organizationId, deletedBy)
  }

  async revokeApiKey(
    apiKeyId: string,
    organizationId: string,
    revokedBy: string
  ): Promise<void> {
    // Deactivate the API key
    await prisma.apiKey.update({
      where: {
        id: apiKeyId,
        organizationId
      },
      data: {
        isActive: false
      }
    })

    // Remove from cache
    await this.removeCachedApiKey(apiKeyId)

    // Log API key revocation
    await this.logApiKeyEvent('revoked', apiKeyId, organizationId, revokedBy)
  }

  async getApiKeys(organizationId: string): Promise<any[]> {
    return prisma.apiKey.findMany({
      where: {
        organizationId,
        deletedAt: null
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { usageLogs: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async getApiKeyById(apiKeyId: string, organizationId: string): Promise<any> {
    return prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        organizationId,
        deletedAt: null
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        usageLogs: {
          take: 100,
          orderBy: { timestamp: 'desc' }
        }
      }
    })
  }

  // USAGE TRACKING

  async trackApiUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    requestSize?: number,
    responseSize?: number,
    ipAddress?: string,
    userAgent?: string,
    error?: string
  ): Promise<void> {
    try {
      // Store detailed usage log
      await prisma.apiKeyUsage.create({
        data: {
          apiKeyId,
          endpoint,
          method,
          ipAddress,
          userAgent,
          statusCode,
          responseTime,
          requestSize,
          responseSize,
          error,
          timestamp: new Date()
        }
      })

      // Update real-time metrics in Redis
      await this.updateRealTimeMetrics(apiKeyId, endpoint, statusCode, responseTime)

      // Update API key usage count
      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to track API usage:', error)
    }
  }

  private async updateRealTimeMetrics(
    apiKeyId: string,
    endpoint: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    const now = new Date()
    const hour = now.toISOString().slice(0, 13) // YYYY-MM-DDTHH
    const day = now.toISOString().slice(0, 10) // YYYY-MM-DD

    const pipeline = this.redis.pipeline()

    // Hourly metrics
    const hourlyKey = `api_metrics:hourly:${apiKeyId}:${hour}`
    pipeline.hincrby(hourlyKey, 'requests', 1)
    pipeline.hincrby(hourlyKey, 'total_response_time', responseTime)
    pipeline.hincrby(hourlyKey, statusCode >= 400 ? 'errors' : 'success', 1)
    pipeline.expire(hourlyKey, 72 * 3600) // 3 days

    // Daily metrics
    const dailyKey = `api_metrics:daily:${apiKeyId}:${day}`
    pipeline.hincrby(dailyKey, 'requests', 1)
    pipeline.hincrby(dailyKey, 'total_response_time', responseTime)
    pipeline.hincrby(dailyKey, statusCode >= 400 ? 'errors' : 'success', 1)
    pipeline.expire(dailyKey, 30 * 24 * 3600) // 30 days

    // Endpoint metrics
    const endpointKey = `api_metrics:endpoint:${apiKeyId}:${endpoint}:${hour}`
    pipeline.hincrby(endpointKey, 'requests', 1)
    pipeline.hincrby(endpointKey, 'total_response_time', responseTime)
    pipeline.expire(endpointKey, 72 * 3600) // 3 days

    await pipeline.exec()
  }

  async getApiKeyUsageStats(
    apiKeyId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiKeyUsageStats> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate || new Date()

    // Get basic stats from database
    const [totalRequests, last24h, last7d, last30d] = await Promise.all([
      this.getRequestCount(apiKeyId, new Date(0), end),
      this.getRequestCount(apiKeyId, new Date(Date.now() - 24 * 60 * 60 * 1000), end),
      this.getRequestCount(apiKeyId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end),
      this.getRequestCount(apiKeyId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end)
    ])

    // Get response time and error rate
    const [avgResponseTime, errorRate] = await Promise.all([
      this.getAverageResponseTime(apiKeyId, start, end),
      this.getErrorRate(apiKeyId, start, end)
    ])

    // Get top endpoints
    const topEndpoints = await this.getTopEndpoints(apiKeyId, start, end)

    // Get time series data
    const timeSeriesData = await this.getTimeSeriesData(apiKeyId, start, end)

    return {
      apiKeyId,
      totalRequests,
      requestsLast24h: last24h,
      requestsLast7d: last7d,
      requestsLast30d: last30d,
      averageResponseTime: avgResponseTime,
      errorRate,
      topEndpoints,
      timeSeriesData
    }
  }

  async getOrganizationUsageOverview(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OrganizationUsageOverview> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()

    // Get organization's API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        organizationId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        usageCount: true
      }
    })

    const totalApiKeys = apiKeys.length
    const activeApiKeys = apiKeys.filter(key => key.isActive).length

    // Get usage stats
    const totalRequests = await this.getOrganizationRequestCount(organizationId, new Date(0), end)
    const requestsLast24h = await this.getOrganizationRequestCount(
      organizationId,
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      end
    )

    // Get organization's subscription limits (this would come from subscription service)
    const requestQuota = await this.getOrganizationQuota(organizationId)
    const quotaUsagePercentage = requestQuota > 0 ? (requestsLast24h / requestQuota) * 100 : 0

    // Get top API keys by usage
    const topApiKeys = await this.getTopApiKeysByUsage(organizationId, start, end)

    // Get endpoint breakdown
    const endpointBreakdown = await this.getEndpointBreakdown(organizationId, start, end)

    return {
      organizationId,
      totalApiKeys,
      activeApiKeys,
      totalRequests,
      requestsLast24h,
      requestQuota,
      quotaUsagePercentage,
      topApiKeys,
      endpointBreakdown
    }
  }

  // UTILITY METHODS

  private generateApiKey(): string {
    const prefix = 'ak_'
    const randomBytes = crypto.randomBytes(32).toString('hex')
    return `${prefix}${randomBytes}`
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex')
  }

  private async cacheApiKey(apiKey: any): Promise<void> {
    const cacheKey = `api_key:${apiKey.keyHash}`
    await this.redis.setex(cacheKey, 3600, JSON.stringify(apiKey)) // 1 hour cache
  }

  private async removeCachedApiKey(apiKeyId: string): Promise<void> {
    // We need to find all cached keys for this API key
    const keys = await this.redis.keys('api_key:*')
    for (const key of keys) {
      const cached = await this.redis.get(key)
      if (cached) {
        const apiKey = JSON.parse(cached)
        if (apiKey.id === apiKeyId) {
          await this.redis.del(key)
        }
      }
    }
  }

  private async logApiKeyEvent(
    action: string,
    apiKeyId: string,
    organizationId: string,
    userId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType: 'api_key',
          entityId: apiKeyId,
          newValues: metadata,
          organizationId,
          userId
        }
      })
    } catch (error) {
      console.error('Failed to log API key event:', error)
    }
  }

  private async getRequestCount(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.apiKeyUsage.count({
      where: {
        apiKeyId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    return result
  }

  private async getOrganizationRequestCount(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.apiKeyUsage.count({
      where: {
        apiKey: {
          organizationId
        },
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    return result
  }

  private async getAverageResponseTime(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.apiKeyUsage.aggregate({
      where: {
        apiKeyId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _avg: {
        responseTime: true
      }
    })
    return result._avg.responseTime || 0
  }

  private async getErrorRate(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const [total, errors] = await Promise.all([
      prisma.apiKeyUsage.count({
        where: {
          apiKeyId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKeyId,
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          statusCode: {
            gte: 400
          }
        }
      })
    ])

    return total > 0 ? (errors / total) * 100 : 0
  }

  private async getTopEndpoints(
    apiKeyId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{ endpoint: string; requests: number; averageResponseTime: number }>> {
    const result = await prisma.apiKeyUsage.groupBy({
      by: ['endpoint'],
      where: {
        apiKeyId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        endpoint: true
      },
      _avg: {
        responseTime: true
      },
      orderBy: {
        _count: {
          endpoint: 'desc'
        }
      },
      take: limit
    })

    return result.map(r => ({
      endpoint: r.endpoint,
      requests: r._count.endpoint,
      averageResponseTime: r._avg.responseTime || 0
    }))
  }

  private async getTimeSeriesData(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    timestamp: Date
    requests: number
    errors: number
    averageResponseTime: number
  }>> {
    // This would typically be implemented using time-bucket aggregation
    // For now, we'll use hourly buckets
    const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000))
    const data = []

    for (let i = 0; i < hours; i++) {
      const bucketStart = new Date(startDate.getTime() + i * 60 * 60 * 1000)
      const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000)

      const [requests, errors, avgResponseTime] = await Promise.all([
        this.getRequestCount(apiKeyId, bucketStart, bucketEnd),
        prisma.apiKeyUsage.count({
          where: {
            apiKeyId,
            timestamp: { gte: bucketStart, lte: bucketEnd },
            statusCode: { gte: 400 }
          }
        }),
        this.getAverageResponseTime(apiKeyId, bucketStart, bucketEnd)
      ])

      data.push({
        timestamp: bucketStart,
        requests,
        errors,
        averageResponseTime: avgResponseTime
      })
    }

    return data
  }

  private async getTopApiKeysByUsage(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{
    apiKeyId: string
    name: string
    requests: number
    lastUsed: Date
  }>> {
    const result = await prisma.apiKeyUsage.groupBy({
      by: ['apiKeyId'],
      where: {
        apiKey: {
          organizationId
        },
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        apiKeyId: true
      },
      orderBy: {
        _count: {
          apiKeyId: 'desc'
        }
      },
      take: limit
    })

    // Get API key details
    const apiKeyIds = result.map(r => r.apiKeyId)
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        id: { in: apiKeyIds }
      },
      select: {
        id: true,
        name: true,
        lastUsedAt: true
      }
    })

    return result.map(r => {
      const apiKey = apiKeys.find(ak => ak.id === r.apiKeyId)
      return {
        apiKeyId: r.apiKeyId,
        name: apiKey?.name || 'Unknown',
        requests: r._count.apiKeyId,
        lastUsed: apiKey?.lastUsedAt || new Date()
      }
    })
  }

  private async getEndpointBreakdown(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{
    endpoint: string
    requests: number
    uniqueApiKeys: number
  }>> {
    const result = await prisma.apiKeyUsage.groupBy({
      by: ['endpoint'],
      where: {
        apiKey: {
          organizationId
        },
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        endpoint: true,
        apiKeyId: true
      },
      orderBy: {
        _count: {
          endpoint: 'desc'
        }
      },
      take: limit
    })

    return result.map(r => ({
      endpoint: r.endpoint,
      requests: r._count.endpoint,
      uniqueApiKeys: r._count.apiKeyId
    }))
  }

  private async getOrganizationQuota(organizationId: string): Promise<number> {
    // This would integrate with your subscription service
    // For now, return a default quota based on tier
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true }
    })

    const quotaMap: Record<string, number> = {
      'free': 1000,
      'basic': 10000,
      'premium': 50000,
      'enterprise': 500000
    }

    const tier = organization?.subscription?.planName || 'free'
    return quotaMap[tier] || 1000
  }
}

export type { ApiKeyUsageStats, OrganizationUsageOverview }