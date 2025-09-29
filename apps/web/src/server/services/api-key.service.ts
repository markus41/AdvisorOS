/**
 * API Key Management Service
 * Provides secure API key generation, validation, and usage tracking
 */

import { prisma } from '@/server/db'
import { createHash, randomBytes } from 'crypto'
import { AuditService } from './audit.service'
import { type ApiKey, type ApiKeyUsage, type User } from '@prisma/client'

export interface ApiKeyCreateOptions {
  name: string
  organizationId: string
  createdBy: string
  permissions: Record<string, any>
  scopes?: string[]
  expiresAt?: Date
  rateLimit?: number
  ipWhitelist?: string[]
  metadata?: Record<string, any>
}

export interface ApiKeyValidationResult {
  isValid: boolean
  apiKey?: ApiKey & { creator: Pick<User, 'id' | 'name' | 'email'> }
  error?: string
  rateLimitExceeded?: boolean
}

export interface ApiKeyUsageStats {
  totalRequests: number
  requestsByEndpoint: Record<string, number>
  requestsByStatus: Record<string, number>
  averageResponseTime: number
  errorRate: number
  lastUsed: Date | null
  peakUsage: Array<{ date: string; requests: number }>
}

export class ApiKeyService {
  /**
   * Generate a new API key
   */
  static async createApiKey(options: ApiKeyCreateOptions): Promise<{
    apiKey: ApiKey
    plainTextKey: string
  }> {
    try {
      // Generate cryptographically secure API key
      const plainTextKey = this.generateSecureApiKey()
      const keyHash = this.hashApiKey(plainTextKey)
      const keyPrefix = plainTextKey.substring(0, 8)

      // Create API key record
      const apiKey = await prisma.apiKey.create({
        data: {
          name: options.name,
          keyHash,
          keyPrefix,
          organizationId: options.organizationId,
          createdBy: options.createdBy,
          permissions: options.permissions,
          scopes: options.scopes || [],
          expiresAt: options.expiresAt,
          rateLimit: options.rateLimit,
          ipWhitelist: options.ipWhitelist || [],
          metadata: options.metadata || {},
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Log API key creation
      await AuditService.logAuditEvent({
        entityType: 'api_key',
        entityId: apiKey.id,
        action: 'create',
        metadata: {
          keyName: options.name,
          permissions: Object.keys(options.permissions),
          scopes: options.scopes,
          expiresAt: options.expiresAt?.toISOString(),
        },
      }, {
        userId: options.createdBy,
        organizationId: options.organizationId,
      })

      return {
        apiKey,
        plainTextKey,
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      throw error
    }
  }

  /**
   * Validate API key and check permissions
   */
  static async validateApiKey(
    plainTextKey: string,
    requiredPermissions?: string[],
    endpoint?: string,
    ipAddress?: string
  ): Promise<ApiKeyValidationResult> {
    try {
      if (!plainTextKey || plainTextKey.length < 32) {
        return {
          isValid: false,
          error: 'Invalid API key format',
        }
      }

      const keyHash = this.hashApiKey(plainTextKey)

      // Find API key by hash
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!apiKey) {
        return {
          isValid: false,
          error: 'API key not found',
        }
      }

      // Check if API key is active
      if (!apiKey.isActive || apiKey.deletedAt) {
        return {
          isValid: false,
          error: 'API key is disabled',
        }
      }

      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return {
          isValid: false,
          error: 'API key has expired',
        }
      }

      // Check IP whitelist
      if (ipAddress && apiKey.ipWhitelist.length > 0) {
        if (!apiKey.ipWhitelist.includes(ipAddress)) {
          await AuditService.logSecurityEvent({
            eventType: 'api_key_ip_violation',
            severity: 'medium',
            description: `API key used from unauthorized IP: ${ipAddress}`,
            resourceType: 'api_key',
            resourceId: apiKey.id,
            riskScore: 50,
            metadata: {
              keyName: apiKey.name,
              unauthorizedIP: ipAddress,
              allowedIPs: apiKey.ipWhitelist,
            },
          }, {
            organizationId: apiKey.organizationId,
          })

          return {
            isValid: false,
            error: 'IP address not whitelisted',
          }
        }
      }

      // Check rate limiting
      if (apiKey.rateLimit) {
        const rateLimitExceeded = await this.checkRateLimit(apiKey.id, apiKey.rateLimit)
        if (rateLimitExceeded) {
          return {
            isValid: false,
            error: 'Rate limit exceeded',
            rateLimitExceeded: true,
          }
        }
      }

      // Check required permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasPermissions = this.validateApiKeyPermissions(
          apiKey.permissions as Record<string, any>,
          requiredPermissions,
          endpoint
        )

        if (!hasPermissions) {
          return {
            isValid: false,
            error: 'Insufficient permissions',
          }
        }
      }

      // Update last used timestamp
      await this.updateLastUsed(apiKey.id)

      return {
        isValid: true,
        apiKey,
      }
    } catch (error) {
      console.error('Error validating API key:', error)
      return {
        isValid: false,
        error: 'Validation error',
      }
    }
  }

  /**
   * Log API key usage
   */
  static async logApiKeyUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string,
    requestSize?: number,
    responseSize?: number,
    error?: string
  ): Promise<void> {
    try {
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
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      })

      // Update usage count
      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      })
    } catch (error) {
      console.error('Error logging API key usage:', error)
    }
  }

  /**
   * Generate cryptographically secure API key
   */
  private static generateSecureApiKey(): string {
    const prefix = 'ak_'
    const randomPart = randomBytes(32).toString('hex')
    return `${prefix}${randomPart}`
  }

  /**
   * Hash API key for secure storage
   */
  private static hashApiKey(plainTextKey: string): string {
    return createHash('sha256').update(plainTextKey).digest('hex')
  }

  /**
   * Check API key permissions
   */
  private static validateApiKeyPermissions(
    keyPermissions: Record<string, any>,
    requiredPermissions: string[],
    endpoint?: string
  ): boolean {
    // Check if key has wildcard permissions
    if (keyPermissions['*'] === true) {
      return true
    }

    // Check specific permissions
    for (const permission of requiredPermissions) {
      if (!keyPermissions[permission]) {
        return false
      }
    }

    return true
  }

  /**
   * Check rate limit for API key
   */
  private static async checkRateLimit(
    apiKeyId: string,
    rateLimit: number,
    windowMs: number = 60000 // 1 minute
  ): Promise<boolean> {
    try {
      const now = new Date()
      const windowStart = new Date(now.getTime() - windowMs)

      const requestCount = await prisma.apiKeyUsage.count({
        where: {
          apiKeyId,
          timestamp: {
            gte: windowStart,
          },
        },
      })

      return requestCount >= rateLimit
    } catch (error) {
      console.error('Error checking rate limit:', error)
      return false // Fail open for rate limiting
    }
  }

  /**
   * Update last used timestamp
   */
  private static async updateLastUsed(apiKeyId: string): Promise<void> {
    try {
      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          lastUsedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error updating last used:', error)
    }
  }
}

export { ApiKeyService as apiKeyService }