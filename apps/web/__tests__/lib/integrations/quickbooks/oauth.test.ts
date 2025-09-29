import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { QuickBooksOAuthService, type QuickBooksOAuthConfig, type QuickBooksTokens } from '@/lib/integrations/quickbooks/oauth'

// Mock the database and Redis
jest.mock('@/server/db', () => ({
  prisma: {
    quickBooksConnection: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}))

// Mock encryption utilities
jest.mock('@/lib/encryption', () => ({
  encrypt: jest.fn().mockImplementation((data) => `encrypted_${data}`),
  decrypt: jest.fn().mockImplementation((encryptedData) => encryptedData.replace('encrypted_', '')),
}))

// Mock security events
jest.mock('@/server/security/security-events', () => ({
  SecurityEvent: {
    log: jest.fn(),
  },
}))

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('test-random-bytes')),
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('test-hmac-hash'),
  }),
}))

// Mock fetch for token requests
global.fetch = jest.fn()

const { prisma, redis } = require('@/server/db')
const { encrypt, decrypt } = require('@/lib/encryption')
const { SecurityEvent } = require('@/server/security/security-events')

describe('QuickBooksOAuthService', () => {
  let oauthService: QuickBooksOAuthService
  let mockConfig: QuickBooksOAuthConfig

  beforeEach(() => {
    mockConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'https://example.com/callback',
      baseUrl: 'https://sandbox-quickbooks.api.intuit.com',
      discoveryDocumentUrl: 'https://developer.intuit.com/.well-known/connect_to_quickbooks',
    }

    oauthService = new QuickBooksOAuthService(mockConfig)

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(oauthService).toBeInstanceOf(QuickBooksOAuthService)
    })

    it('should merge default retry config with provided config', () => {
      const customConfig = {
        ...mockConfig,
        retryConfig: {
          maxRetries: 5,
          baseDelay: 2000,
        },
      }

      const service = new QuickBooksOAuthService(customConfig)
      expect(service).toBeInstanceOf(QuickBooksOAuthService)
    })
  })

  describe('generateAuthUrl', () => {
    it('should generate valid authorization URL', async () => {
      redis.setex.mockResolvedValue('OK')
      SecurityEvent.log.mockResolvedValue(undefined)

      const result = await oauthService.generateAuthUrl('org_123')

      expect(result.url).toContain('https://appcenter.intuit.com/connect/oauth2')
      expect(result.url).toContain('client_id=test-client-id')
      expect(result.url).toContain('scope=com.intuit.quickbooks.accounting')
      expect(result.url).toContain('redirect_uri=https://example.com/callback')
      expect(result.url).toContain('response_type=code')
      expect(result.url).toContain('access_type=offline')
      expect(result.url).toContain(`state=${result.state}`)

      expect(result.state).toBeDefined()
      expect(result.connectionId).toBeDefined()
    })

    it('should store auth state in Redis', async () => {
      redis.setex.mockResolvedValue('OK')
      SecurityEvent.log.mockResolvedValue(undefined)

      const result = await oauthService.generateAuthUrl('org_123', {
        redirectUrl: 'https://custom-redirect.com',
        connectionName: 'Test Connection',
      })

      expect(redis.setex).toHaveBeenCalledWith(
        `qb_auth_state:${result.state}`,
        1800, // 30 minutes
        expect.stringContaining('org_123')
      )
    })

    it('should log security event for OAuth attempt', async () => {
      redis.setex.mockResolvedValue('OK')
      SecurityEvent.log.mockResolvedValue(undefined)

      await oauthService.generateAuthUrl('org_123', {
        connectionName: 'Test Connection',
        isAdditionalConnection: true,
      })

      expect(SecurityEvent.log).toHaveBeenCalledWith(
        'oauth_attempt',
        expect.objectContaining({
          organizationId: 'org_123',
          connectionName: 'Test Connection',
          isAdditionalConnection: true,
        })
      )
    })

    it('should handle Redis errors gracefully', async () => {
      redis.setex.mockRejectedValue(new Error('Redis connection failed'))

      await expect(
        oauthService.generateAuthUrl('org_123')
      ).rejects.toThrow('Redis connection failed')
    })

    it('should generate unique states and connection IDs', async () => {
      redis.setex.mockResolvedValue('OK')
      SecurityEvent.log.mockResolvedValue(undefined)

      const result1 = await oauthService.generateAuthUrl('org_123')
      const result2 = await oauthService.generateAuthUrl('org_123')

      expect(result1.state).not.toBe(result2.state)
      expect(result1.connectionId).not.toBe(result2.connectionId)
    })
  })

  describe('exchangeCodeForTokens', () => {
    beforeEach(() => {
      // Mock successful token response
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })
    })

    it('should exchange code for tokens successfully', async () => {
      // Mock auth state verification
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      prisma.quickBooksConnection.create.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
      })

      redis.del.mockResolvedValue(1)

      const result = await oauthService.exchangeCodeForTokens(
        'test-code',
        'test-state',
        'realm_123'
      )

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        realmId: 'realm_123',
        expiresAt: expect.any(Date),
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': expect.stringContaining('Basic'),
            'Accept': 'application/json',
          }),
        })
      )
    })

    it('should throw error for invalid state', async () => {
      redis.get.mockResolvedValue(null)

      await expect(
        oauthService.exchangeCodeForTokens('test-code', 'invalid-state', 'realm_123')
      ).rejects.toThrow('Invalid or expired state parameter')
    })

    it('should throw error for expired state', async () => {
      const expiredState = {
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        connectionId: 'conn_123',
      }

      redis.get.mockResolvedValue(JSON.stringify(expiredState))

      await expect(
        oauthService.exchangeCodeForTokens('test-code', 'test-state', 'realm_123')
      ).rejects.toThrow('Auth state has expired')
    })

    it('should handle token request errors', async () => {
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'Authorization code is invalid',
        }),
      })

      await expect(
        oauthService.exchangeCodeForTokens('invalid-code', 'test-state', 'realm_123')
      ).rejects.toThrow('QuickBooks OAuth error: invalid_grant - Authorization code is invalid')
    })

    it('should clean up auth state after successful exchange', async () => {
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      prisma.quickBooksConnection.create.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
      })

      redis.del.mockResolvedValue(1)

      await oauthService.exchangeCodeForTokens('test-code', 'test-state', 'realm_123')

      expect(redis.del).toHaveBeenCalledWith('qb_auth_state:test-state')
    })

    it('should store tokens securely in database', async () => {
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      prisma.quickBooksConnection.create.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
      })

      await oauthService.exchangeCodeForTokens('test-code', 'test-state', 'realm_123')

      expect(prisma.quickBooksConnection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org_123',
          realmId: 'realm_123',
          accessToken: 'encrypted_test-access-token',
          refreshToken: 'encrypted_test-refresh-token',
          expiresAt: expect.any(Date),
          status: 'active',
        }),
      })
    })
  })

  describe('refreshTokens', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })
    })

    it('should refresh tokens successfully', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
        refreshToken: 'encrypted_old-refresh-token',
        status: 'active',
      })

      prisma.quickBooksConnection.update.mockResolvedValue({
        id: 'connection_123',
        accessToken: 'encrypted_new-access-token',
        refreshToken: 'encrypted_new-refresh-token',
      })

      const result = await oauthService.refreshTokens('org_123')

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        realmId: 'realm_123',
        expiresAt: expect.any(Date),
      })
    })

    it('should throw error when no connection found', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue(null)

      await expect(
        oauthService.refreshTokens('org_123')
      ).rejects.toThrow('No active QuickBooks connection found')
    })

    it('should handle refresh token errors', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
        refreshToken: 'encrypted_invalid-refresh-token',
        status: 'active',
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'Refresh token is invalid',
        }),
      })

      await expect(
        oauthService.refreshTokens('org_123')
      ).rejects.toThrow('QuickBooks OAuth error: invalid_grant - Refresh token is invalid')
    })

    it('should mark connection as expired on invalid refresh token', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
        refreshToken: 'encrypted_invalid-refresh-token',
        status: 'active',
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
        }),
      })

      prisma.quickBooksConnection.update.mockResolvedValue({})

      await expect(
        oauthService.refreshTokens('org_123')
      ).rejects.toThrow()

      expect(prisma.quickBooksConnection.update).toHaveBeenCalledWith({
        where: { id: 'connection_123' },
        data: { status: 'expired' },
      })
    })
  })

  describe('revokeTokens', () => {
    it('should revoke tokens successfully', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        refreshToken: 'encrypted_refresh-token',
        status: 'active',
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{"response":"Success"}'),
      })

      prisma.quickBooksConnection.update.mockResolvedValue({})

      await oauthService.revokeTokens('org_123')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': expect.stringContaining('Basic'),
          }),
        })
      )

      expect(prisma.quickBooksConnection.update).toHaveBeenCalledWith({
        where: { id: 'connection_123' },
        data: { status: 'revoked' },
      })
    })

    it('should throw error when no connection found for revocation', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue(null)

      await expect(
        oauthService.revokeTokens('org_123')
      ).rejects.toThrow('No active QuickBooks connection found')
    })

    it('should handle revocation errors gracefully', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        refreshToken: 'encrypted_refresh-token',
        status: 'active',
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      prisma.quickBooksConnection.update.mockResolvedValue({})

      await expect(
        oauthService.revokeTokens('org_123')
      ).rejects.toThrow('Failed to revoke QuickBooks tokens')

      // Should still mark as revoked in database
      expect(prisma.quickBooksConnection.update).toHaveBeenCalledWith({
        where: { id: 'connection_123' },
        data: { status: 'revoked' },
      })
    })
  })

  describe('getActiveConnection', () => {
    it('should return active connection with decrypted tokens', async () => {
      const mockConnection = {
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
        accessToken: 'encrypted_access-token',
        refreshToken: 'encrypted_refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'active',
        connectionName: 'Primary QB',
        isDefault: true,
      }

      prisma.quickBooksConnection.findFirst.mockResolvedValue(mockConnection)

      const result = await oauthService.getActiveConnection('org_123')

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        realmId: 'realm_123',
        expiresAt: mockConnection.expiresAt,
      })

      expect(decrypt).toHaveBeenCalledWith('encrypted_access-token')
      expect(decrypt).toHaveBeenCalledWith('encrypted_refresh-token')
    })

    it('should return null when no active connection found', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue(null)

      const result = await oauthService.getActiveConnection('org_123')

      expect(result).toBeNull()
    })

    it('should find specific connection by ID', async () => {
      const mockConnection = {
        id: 'connection_123',
        organizationId: 'org_123',
        realmId: 'realm_123',
        accessToken: 'encrypted_access-token',
        refreshToken: 'encrypted_refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'active',
      }

      prisma.quickBooksConnection.findFirst.mockResolvedValue(mockConnection)

      await oauthService.getActiveConnection('org_123', 'connection_123')

      expect(prisma.quickBooksConnection.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: 'org_123',
          id: 'connection_123',
          status: 'active',
        },
      })
    })
  })

  describe('getAllConnections', () => {
    it('should return all connections for organization', async () => {
      const mockConnections = [
        {
          id: 'connection_1',
          organizationId: 'org_123',
          realmId: 'realm_1',
          status: 'active',
          connectionName: 'Primary QB',
          isDefault: true,
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
        {
          id: 'connection_2',
          organizationId: 'org_123',
          realmId: 'realm_2',
          status: 'expired',
          connectionName: 'Secondary QB',
          isDefault: false,
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
      ]

      prisma.quickBooksConnection.findMany.mockResolvedValue(mockConnections)

      const result = await oauthService.getAllConnections('org_123')

      expect(result).toEqual(mockConnections.map(conn => ({
        connectionId: conn.id,
        organizationId: conn.organizationId,
        connectionName: conn.connectionName,
        isDefault: conn.isDefault,
        createdAt: conn.createdAt,
        lastUsedAt: conn.lastUsedAt,
        status: conn.status,
      })))
    })

    it('should return empty array when no connections found', async () => {
      prisma.quickBooksConnection.findMany.mockResolvedValue([])

      const result = await oauthService.getAllConnections('org_123')

      expect(result).toEqual([])
    })
  })

  describe('validateTokens', () => {
    it('should return true for valid tokens', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        status: 'active',
      })

      const result = await oauthService.validateTokens('org_123')

      expect(result).toBe(true)
    })

    it('should return false for expired tokens', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'active',
      })

      const result = await oauthService.validateTokens('org_123')

      expect(result).toBe(false)
    })

    it('should return false when no connection found', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue(null)

      const result = await oauthService.validateTokens('org_123')

      expect(result).toBe(false)
    })

    it('should return false for inactive connections', async () => {
      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'revoked',
      })

      const result = await oauthService.validateTokens('org_123')

      expect(result).toBe(false)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle network errors during token requests', async () => {
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(
        oauthService.exchangeCodeForTokens('test-code', 'test-state', 'realm_123')
      ).rejects.toThrow('Network error')
    })

    it('should handle malformed JSON responses', async () => {
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      })

      await expect(
        oauthService.exchangeCodeForTokens('test-code', 'test-state', 'realm_123')
      ).rejects.toThrow('Invalid JSON')
    })

    it('should handle database errors gracefully', async () => {
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
        }),
      })

      prisma.quickBooksConnection.create.mockRejectedValue(new Error('Database error'))

      await expect(
        oauthService.exchangeCodeForTokens('test-code', 'test-state', 'realm_123')
      ).rejects.toThrow('Database error')
    })

    it('should handle encryption/decryption errors', async () => {
      decrypt.mockImplementation(() => {
        throw new Error('Decryption failed')
      })

      prisma.quickBooksConnection.findFirst.mockResolvedValue({
        id: 'connection_123',
        organizationId: 'org_123',
        accessToken: 'encrypted_access-token',
        refreshToken: 'encrypted_refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'active',
      })

      await expect(
        oauthService.getActiveConnection('org_123')
      ).rejects.toThrow('Decryption failed')
    })
  })

  describe('security and validation', () => {
    it('should validate state parameter format', async () => {
      redis.get.mockResolvedValue(null)

      await expect(
        oauthService.exchangeCodeForTokens('test-code', 'invalid-state-format', 'realm_123')
      ).rejects.toThrow('Invalid or expired state parameter')
    })

    it('should validate realm ID format', async () => {
      redis.get.mockResolvedValue(JSON.stringify({
        organizationId: 'org_123',
        state: 'test-state',
        createdAt: new Date().toISOString(),
        connectionId: 'conn_123',
      }))

      // Test should handle various realm ID formats gracefully
      const validRealmIds = ['123456789012345', 'realm_123', '9130359982525675997']

      for (const realmId of validRealmIds) {
        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
          }),
        })

        prisma.quickBooksConnection.create.mockResolvedValue({
          id: 'connection_123',
          organizationId: 'org_123',
          realmId,
        })

        const result = await oauthService.exchangeCodeForTokens('test-code', 'test-state', realmId)
        expect(result.realmId).toBe(realmId)
      }
    })

    it('should log security events appropriately', async () => {
      redis.setex.mockResolvedValue('OK')

      await oauthService.generateAuthUrl('org_123', {
        connectionName: 'Test Connection',
        isAdditionalConnection: false,
      })

      expect(SecurityEvent.log).toHaveBeenCalledWith(
        'oauth_attempt',
        expect.objectContaining({
          organizationId: 'org_123',
          connectionName: 'Test Connection',
          isAdditionalConnection: false,
        })
      )
    })
  })
})