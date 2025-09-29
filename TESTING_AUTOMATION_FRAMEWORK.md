# AdvisorOS Testing Automation Framework
## Comprehensive Testing Strategy for Wave 0-3 Integration

### Executive Summary

This document outlines the comprehensive testing automation framework for AdvisorOS Wave 0-3 integration. The framework ensures system reliability, security, and performance throughout the integration process with automated testing at unit, integration, end-to-end, and performance levels.

**Testing Coverage Targets:**
- Unit Tests: 90% code coverage
- Integration Tests: 100% API endpoint coverage
- E2E Tests: 100% critical user journey coverage
- Performance Tests: 100% SLA validation
- Security Tests: 100% OWASP Top 10 coverage

---

## Testing Framework Architecture

### Technology Stack

```typescript
// Testing Stack Configuration
export const testingStack = {
  unitTesting: {
    framework: 'Jest',
    utilities: ['@testing-library/react', '@testing-library/jest-dom'],
    mocking: ['jest.mock', 'msw'],
    coverage: ['jest-coverage', 'c8']
  },
  integrationTesting: {
    framework: 'Jest + Supertest',
    database: 'PostgreSQL Test Database',
    mocking: ['MSW (Mock Service Worker)', 'Nock'],
    fixtures: ['Prisma Seeds', 'Factory Functions']
  },
  e2eTesting: {
    framework: 'Playwright',
    browsers: ['Chromium', 'Firefox', 'WebKit'],
    mobile: ['Chrome Mobile', 'Safari Mobile'],
    recording: ['Video', 'Screenshots', 'Traces']
  },
  performanceTesting: {
    loadTesting: ['Artillery', 'K6'],
    monitoring: ['Clinic.js', 'Node.js built-in profiler'],
    metrics: ['Response Time', 'Throughput', 'Error Rate']
  },
  securityTesting: {
    static: ['ESLint Security', 'Semgrep'],
    dynamic: ['OWASP ZAP', 'Custom Security Tests'],
    dependencies: ['npm audit', 'Snyk']
  }
}
```

### Test Environment Configuration

```typescript
// test/config/test-environment.ts
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

export class TestEnvironment {
  private static instance: TestEnvironment
  private prisma: PrismaClient
  private redis: Redis
  private initialized = false

  static getInstance(): TestEnvironment {
    if (!TestEnvironment.instance) {
      TestEnvironment.instance = new TestEnvironment()
    }
    return TestEnvironment.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Initialize test database
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL }
      }
    })

    // Initialize test Redis
    this.redis = new Redis({
      host: process.env.TEST_REDIS_HOST || 'localhost',
      port: parseInt(process.env.TEST_REDIS_PORT || '6380'),
      db: 1 // Use different DB for tests
    })

    // Run migrations
    await this.runMigrations()

    // Seed test data
    await this.seedTestData()

    this.initialized = true
  }

  async cleanup(): Promise<void> {
    // Clear test data
    await this.clearTestData()

    // Close connections
    await this.prisma.$disconnect()
    await this.redis.quit()

    this.initialized = false
  }

  private async runMigrations(): Promise<void> {
    // Execute test database migrations
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    await execAsync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    })
  }

  private async seedTestData(): Promise<void> {
    // Create test organizations
    await this.createTestOrganizations()

    // Create test users
    await this.createTestUsers()

    // Create test clients
    await this.createTestClients()
  }

  async createTestOrganizations(): Promise<void> {
    const organizations = [
      {
        id: 'test-org-1',
        name: 'Test Organization 1',
        settings: { features: { workflows: true, ai: true } }
      },
      {
        id: 'test-org-2',
        name: 'Test Organization 2',
        settings: { features: { workflows: false, ai: true } }
      }
    ]

    for (const org of organizations) {
      await this.prisma.organization.upsert({
        where: { id: org.id },
        update: org,
        create: org
      })
    }
  }

  async createTestUsers(): Promise<void> {
    const users = [
      {
        id: 'test-user-admin',
        email: 'admin@test.com',
        name: 'Test Admin',
        organizationId: 'test-org-1',
        role: 'owner'
      },
      {
        id: 'test-user-cpa',
        email: 'cpa@test.com',
        name: 'Test CPA',
        organizationId: 'test-org-1',
        role: 'cpa'
      }
    ]

    for (const user of users) {
      await this.prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
  }

  getPrisma(): PrismaClient {
    return this.prisma
  }

  getRedis(): Redis {
    return this.redis
  }
}
```

---

## Unit Testing Framework

### Service Layer Testing

```typescript
// test/unit/services/permission.service.test.ts
import { PermissionService } from '@/server/services/permission.service'
import { TestEnvironment } from '@/test/config/test-environment'

describe('PermissionService', () => {
  let testEnv: TestEnvironment
  let prisma: PrismaClient

  beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()
    prisma = testEnv.getPrisma()
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    // Clear permission-related data before each test
    await prisma.userPermission.deleteMany()
    await prisma.rolePermission.deleteMany()
  })

  describe('checkUserPermission', () => {
    test('should return true for user with direct permission', async () => {
      // Arrange
      const userId = 'test-user-cpa'
      const organizationId = 'test-org-1'
      const permission = 'clients:read'

      await prisma.userPermission.create({
        data: {
          userId,
          organizationId,
          permission,
          grantedBy: 'test-user-admin'
        }
      })

      // Act
      const result = await PermissionService.checkUserPermission(
        userId, organizationId, permission
      )

      // Assert
      expect(result).toBe(true)
    })

    test('should return false for user without permission', async () => {
      // Arrange
      const userId = 'test-user-cpa'
      const organizationId = 'test-org-1'
      const permission = 'admin:users'

      // Act
      const result = await PermissionService.checkUserPermission(
        userId, organizationId, permission
      )

      // Assert
      expect(result).toBe(false)
    })

    test('should check role-based permissions correctly', async () => {
      // Arrange
      const userId = 'test-user-admin'
      const organizationId = 'test-org-1'
      const permission = 'clients:create'

      // Admin role should have this permission by default
      await PermissionService.initializePermissions()

      // Act
      const result = await PermissionService.checkUserPermission(
        userId, organizationId, permission
      )

      // Assert
      expect(result).toBe(true)
    })

    test('should respect permission expiration', async () => {
      // Arrange
      const userId = 'test-user-cpa'
      const organizationId = 'test-org-1'
      const permission = 'clients:export'
      const pastDate = new Date(Date.now() - 86400000) // 1 day ago

      await prisma.userPermission.create({
        data: {
          userId,
          organizationId,
          permission,
          grantedBy: 'test-user-admin',
          expiresAt: pastDate
        }
      })

      // Act
      const result = await PermissionService.checkUserPermission(
        userId, organizationId, permission
      )

      // Assert
      expect(result).toBe(false)
    })

    test('should handle conditional permissions', async () => {
      // Arrange
      const userId = 'test-user-cpa'
      const organizationId = 'test-org-1'
      const permission = 'reports:generate'

      await prisma.userPermission.create({
        data: {
          userId,
          organizationId,
          permission,
          grantedBy: 'test-user-admin',
          conditions: {
            timeRestriction: {
              startHour: 9,
              endHour: 17
            }
          }
        }
      })

      // Act - during business hours
      const mockBusinessHours = jest.spyOn(Date.prototype, 'getHours')
        .mockReturnValue(14) // 2 PM

      const resultDuringHours = await PermissionService.checkUserPermission(
        userId, organizationId, permission
      )

      // Act - outside business hours
      mockBusinessHours.mockReturnValue(20) // 8 PM

      const resultOutsideHours = await PermissionService.checkUserPermission(
        userId, organizationId, permission
      )

      // Assert
      expect(resultDuringHours).toBe(true)
      expect(resultOutsideHours).toBe(false)

      mockBusinessHours.mockRestore()
    })
  })

  describe('grantUserPermission', () => {
    test('should successfully grant permission to user', async () => {
      // Arrange
      const userId = 'test-user-cpa'
      const permission = 'documents:export'
      const grantedBy = 'test-user-admin'

      // Act
      await PermissionService.grantUserPermission(userId, permission, grantedBy)

      // Assert
      const userPermission = await prisma.userPermission.findFirst({
        where: { userId, permission }
      })

      expect(userPermission).toBeDefined()
      expect(userPermission?.grantedBy).toBe(grantedBy)
      expect(userPermission?.revokedAt).toBeNull()
    })

    test('should create audit log when granting permission', async () => {
      // Arrange
      const userId = 'test-user-cpa'
      const permission = 'workflows:create'
      const grantedBy = 'test-user-admin'

      // Act
      await PermissionService.grantUserPermission(userId, permission, grantedBy)

      // Assert
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'user_permission',
          action: 'create',
          userId: grantedBy
        }
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.newValues).toMatchObject({
        userId,
        permission,
        grantedBy
      })
    })
  })

  describe('initializePermissions', () => {
    test('should create default role permissions', async () => {
      // Act
      await PermissionService.initializePermissions()

      // Assert
      const rolePermissions = await prisma.rolePermission.findMany()

      expect(rolePermissions.length).toBeGreaterThan(0)

      // Check that owner role has admin permissions
      const ownerPermissions = rolePermissions.filter(rp => rp.roleId === 'owner')
      expect(ownerPermissions.some(p => p.permission === 'admin:users')).toBe(true)
      expect(ownerPermissions.some(p => p.permission === 'admin:settings')).toBe(true)
    })

    test('should not duplicate permissions on multiple calls', async () => {
      // Act
      await PermissionService.initializePermissions()
      const firstCount = await prisma.rolePermission.count()

      await PermissionService.initializePermissions()
      const secondCount = await prisma.rolePermission.count()

      // Assert
      expect(firstCount).toBe(secondCount)
    })
  })
})
```

### API Layer Testing

```typescript
// test/unit/api/enhanced-api.test.ts
import { createMockTRPCContext } from '@/test/utils/trpc-mock'
import { enhancedApiRouter } from '@/server/api/routers/enhanced-api.router'
import { TestEnvironment } from '@/test/config/test-environment'

describe('Enhanced API Router', () => {
  let testEnv: TestEnvironment
  let mockContext: any

  beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(() => {
    mockContext = createMockTRPCContext({
      user: {
        id: 'test-user-admin',
        organizationId: 'test-org-1',
        role: 'owner'
      }
    })
  })

  describe('getDashboard', () => {
    test('should return dashboard data with performance metrics', async () => {
      // Arrange
      const input = {
        timeRange: 'day',
        organizationId: 'test-org-1'
      }

      // Act
      const result = await enhancedApiRouter
        .createCaller(mockContext)
        .getDashboard(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.performanceMetrics).toBeDefined()
      expect(result.securityMetrics).toBeDefined()
      expect(result.analytics).toBeDefined()
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    test('should cache dashboard data for subsequent requests', async () => {
      // Arrange
      const input = {
        timeRange: 'day',
        organizationId: 'test-org-1'
      }

      // Mock Redis to track cache operations
      const redis = testEnv.getRedis()
      const getSpy = jest.spyOn(redis, 'get')
      const setSpy = jest.spyOn(redis, 'setex')

      // Act - First request (should set cache)
      const startTime1 = Date.now()
      const result1 = await enhancedApiRouter
        .createCaller(mockContext)
        .getDashboard(input)
      const duration1 = Date.now() - startTime1

      // Act - Second request (should use cache)
      const startTime2 = Date.now()
      const result2 = await enhancedApiRouter
        .createCaller(mockContext)
        .getDashboard(input)
      const duration2 = Date.now() - startTime2

      // Assert
      expect(setSpy).toHaveBeenCalled() // Cache was set
      expect(result1).toEqual(result2) // Same data returned
      expect(duration2).toBeLessThan(duration1 * 0.5) // Second request much faster

      getSpy.mockRestore()
      setSpy.mockRestore()
    })

    test('should require proper permissions', async () => {
      // Arrange
      const unauthorizedContext = createMockTRPCContext({
        user: {
          id: 'test-user-unauthorized',
          organizationId: 'test-org-2',
          role: 'intern'
        }
      })

      const input = {
        timeRange: 'day',
        organizationId: 'test-org-1' // Different org
      }

      // Act & Assert
      await expect(
        enhancedApiRouter
          .createCaller(unauthorizedContext)
          .getDashboard(input)
      ).rejects.toThrow('Unauthorized')
    })
  })

  describe('getPerformanceMetrics', () => {
    test('should return performance metrics within SLA', async () => {
      // Arrange
      const input = {
        timeRange: 'hour',
        organizationId: 'test-org-1'
      }

      // Act
      const result = await enhancedApiRouter
        .createCaller(mockContext)
        .getPerformanceMetrics(input)

      // Assert
      expect(result.responseTime).toBeDefined()
      expect(result.responseTime.p95).toBeLessThan(1000) // 1 second SLA
      expect(result.errorRate).toBeLessThan(0.01) // 1% error rate SLA
      expect(result.throughput).toBeGreaterThan(0)
      expect(result.cacheHitRate).toBeGreaterThan(0.8) // 80% cache hit rate SLA
    })

    test('should trigger alerts for performance degradation', async () => {
      // Arrange - Mock degraded performance
      jest.spyOn(require('@/server/services/performance-monitoring.service'), 'getMetrics')
        .mockResolvedValue({
          responseTime: { p50: 800, p95: 2500, p99: 5000 }, // Exceeds SLA
          errorRate: 0.05, // Exceeds SLA
          throughput: 100,
          cacheHitRate: 0.6 // Below SLA
        })

      const input = {
        timeRange: 'hour',
        organizationId: 'test-org-1'
      }

      // Mock alert service
      const alertSpy = jest.spyOn(require('@/server/services/alert.service'), 'sendAlert')

      // Act
      await enhancedApiRouter
        .createCaller(mockContext)
        .getPerformanceMetrics(input)

      // Assert
      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance_degradation',
          severity: 'high'
        })
      )

      alertSpy.mockRestore()
    })
  })
})
```

### Utility and Helper Testing

```typescript
// test/unit/utils/audit.service.test.ts
import { AuditService } from '@/server/services/audit.service'
import { TestEnvironment } from '@/test/config/test-environment'

describe('AuditService', () => {
  let testEnv: TestEnvironment
  let prisma: PrismaClient

  beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()
    prisma = testEnv.getPrisma()
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await prisma.auditLog.deleteMany()
  })

  describe('logAuditEvent', () => {
    test('should create comprehensive audit log entry', async () => {
      // Arrange
      const auditData = {
        entityType: 'client',
        entityId: 'client-123',
        action: 'update',
        oldValues: { name: 'Old Name', status: 'active' },
        newValues: { name: 'New Name', status: 'active' }
      }

      const auditContext = {
        userId: 'test-user-cpa',
        organizationId: 'test-org-1',
        sessionId: 'session-123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      }

      // Act
      await AuditService.logAuditEvent(auditData, auditContext)

      // Assert
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'client',
          entityId: 'client-123',
          action: 'update'
        }
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.userId).toBe('test-user-cpa')
      expect(auditLog?.organizationId).toBe('test-org-1')
      expect(auditLog?.oldValues).toEqual(auditData.oldValues)
      expect(auditLog?.newValues).toEqual(auditData.newValues)
      expect(auditLog?.ipAddress?.toString()).toBe('192.168.1.100')
    })

    test('should handle bulk audit logging efficiently', async () => {
      // Arrange
      const auditEvents = Array.from({ length: 100 }, (_, i) => ({
        entityType: 'document',
        entityId: `doc-${i}`,
        action: 'create',
        newValues: { name: `Document ${i}` }
      }))

      const auditContext = {
        userId: 'test-user-admin',
        organizationId: 'test-org-1'
      }

      // Act
      const startTime = Date.now()
      await AuditService.logBulkAuditEvents(auditEvents, auditContext)
      const duration = Date.now() - startTime

      // Assert
      const auditCount = await prisma.auditLog.count({
        where: { entityType: 'document', action: 'create' }
      })

      expect(auditCount).toBe(100)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should detect and log suspicious activity patterns', async () => {
      // Arrange - Simulate rapid successive operations
      const suspiciousEvents = Array.from({ length: 50 }, (_, i) => ({
        entityType: 'client',
        entityId: `client-${i}`,
        action: 'read',
        newValues: {}
      }))

      const auditContext = {
        userId: 'test-user-cpa',
        organizationId: 'test-org-1',
        ipAddress: '192.168.1.100'
      }

      // Act
      for (const event of suspiciousEvents) {
        await AuditService.logAuditEvent(event, auditContext)
      }

      // Assert - Should create security event for suspicious activity
      const securityEvent = await prisma.securityEvent.findFirst({
        where: {
          eventType: 'suspicious_activity',
          userId: 'test-user-cpa'
        }
      })

      expect(securityEvent).toBeDefined()
      expect(securityEvent?.severity).toBe('medium')
      expect(securityEvent?.description).toContain('rapid data access')
    })
  })

  describe('logDataAccess', () => {
    test('should log GDPR-compliant data access', async () => {
      // Arrange
      const entityType = 'client'
      const entityId = 'client-sensitive'
      const accessType = 'export'
      const auditContext = {
        userId: 'test-user-admin',
        organizationId: 'test-org-1'
      }

      // Act
      await AuditService.logDataAccess(entityType, entityId, accessType, auditContext)

      // Assert
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType,
          entityId,
          action: 'data_access'
        }
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.metadata).toMatchObject({
        accessType,
        gdprCompliant: true,
        dataClassification: 'sensitive'
      })
    })
  })

  describe('validateAuditTrailCompleteness', () => {
    test('should detect gaps in audit trail', async () => {
      // Arrange - Create some audit logs with gaps
      await prisma.auditLog.createMany({
        data: [
          {
            id: 'audit-1',
            organizationId: 'test-org-1',
            entityType: 'client',
            entityId: 'client-1',
            action: 'create',
            createdAt: new Date('2025-01-01T10:00:00Z')
          },
          {
            id: 'audit-2',
            organizationId: 'test-org-1',
            entityType: 'client',
            entityId: 'client-1',
            action: 'update',
            createdAt: new Date('2025-01-01T12:00:00Z') // 2 hour gap
          }
        ]
      })

      // Act
      const gaps = await AuditService.validateAuditTrailCompleteness('test-org-1')

      // Assert
      expect(gaps).toHaveLength(0) // This gap is acceptable
    })

    test('should identify critical audit trail violations', async () => {
      // Arrange - Create audit logs with critical violations
      await prisma.auditLog.create({
        data: {
          id: 'audit-delete-no-trail',
          organizationId: 'test-org-1',
          entityType: 'client',
          entityId: 'client-deleted',
          action: 'delete',
          oldValues: { name: 'Deleted Client' },
          newValues: null,
          createdAt: new Date('2025-01-01T15:00:00Z')
        }
      })

      // But no corresponding create audit log exists

      // Act
      const violations = await AuditService.validateAuditTrailCompleteness('test-org-1')

      // Assert
      expect(violations.some(v => v.type === 'orphaned_delete')).toBe(true)
    })
  })
})
```

---

## Integration Testing Framework

### API Integration Tests

```typescript
// test/integration/api/client.integration.test.ts
import request from 'supertest'
import { createTestServer } from '@/test/utils/test-server'
import { TestEnvironment } from '@/test/config/test-environment'
import { generateTestJWT } from '@/test/utils/auth-helpers'

describe('Client API Integration', () => {
  let app: any
  let testEnv: TestEnvironment
  let adminToken: string
  let userToken: string

  beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()

    app = await createTestServer()

    adminToken = generateTestJWT({
      userId: 'test-user-admin',
      organizationId: 'test-org-1',
      role: 'owner'
    })

    userToken = generateTestJWT({
      userId: 'test-user-cpa',
      organizationId: 'test-org-1',
      role: 'cpa'
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  describe('POST /api/trpc/client.create', () => {
    test('should create client with valid data', async () => {
      // Arrange
      const clientData = {
        name: 'Test Client',
        email: 'test@client.com',
        type: 'individual',
        status: 'active'
      }

      // Act
      const response = await request(app)
        .post('/api/trpc/client.create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(200)

      // Assert
      expect(response.body.result.data).toMatchObject({
        name: clientData.name,
        email: clientData.email,
        organizationId: 'test-org-1'
      })

      // Verify audit log was created
      const prisma = testEnv.getPrisma()
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'client',
          action: 'create',
          userId: 'test-user-admin'
        }
      })

      expect(auditLog).toBeDefined()
    })

    test('should reject invalid client data', async () => {
      // Arrange
      const invalidClientData = {
        name: '', // Empty name should be rejected
        email: 'invalid-email', // Invalid email format
        type: 'invalid-type' // Invalid client type
      }

      // Act
      const response = await request(app)
        .post('/api/trpc/client.create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidClientData)
        .expect(400)

      // Assert
      expect(response.body.error).toBeDefined()
      expect(response.body.error.message).toContain('validation')
    })

    test('should enforce permission requirements', async () => {
      // Arrange
      const clientData = {
        name: 'Unauthorized Client',
        email: 'unauthorized@client.com',
        type: 'individual'
      }

      // Act - User without create permission
      const response = await request(app)
        .post('/api/trpc/client.create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(clientData)
        .expect(403)

      // Assert
      expect(response.body.error.message).toContain('permission')
    })

    test('should enforce rate limiting', async () => {
      // Arrange
      const clientData = {
        name: 'Rate Limit Test Client',
        email: 'ratelimit@client.com',
        type: 'individual'
      }

      // Act - Send multiple requests rapidly
      const requests = Array.from({ length: 101 }, () =>
        request(app)
          .post('/api/trpc/client.create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...clientData,
            email: `ratelimit${Math.random()}@client.com`
          })
      )

      const responses = await Promise.allSettled(requests)

      // Assert - Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' &&
          response.value.status === 429
      )

      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/trpc/client.getAll', () => {
    beforeEach(async () => {
      // Create test clients
      const prisma = testEnv.getPrisma()
      await prisma.client.createMany({
        data: [
          {
            id: 'client-1',
            name: 'Client 1',
            email: 'client1@test.com',
            organizationId: 'test-org-1',
            type: 'individual',
            status: 'active'
          },
          {
            id: 'client-2',
            name: 'Client 2',
            email: 'client2@test.com',
            organizationId: 'test-org-1',
            type: 'business',
            status: 'inactive'
          }
        ]
      })
    })

    test('should return paginated client list', async () => {
      // Act
      const response = await request(app)
        .get('/api/trpc/client.getAll')
        .query({ limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // Assert
      expect(response.body.result.data.clients).toHaveLength(2)
      expect(response.body.result.data.total).toBe(2)
      expect(response.body.result.data.clients[0]).toMatchObject({
        name: 'Client 1',
        organizationId: 'test-org-1'
      })
    })

    test('should filter clients by status', async () => {
      // Act
      const response = await request(app)
        .get('/api/trpc/client.getAll')
        .query({ filter: JSON.stringify({ status: 'active' }) })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // Assert
      expect(response.body.result.data.clients).toHaveLength(1)
      expect(response.body.result.data.clients[0].status).toBe('active')
    })

    test('should use caching for improved performance', async () => {
      // Arrange
      const redis = testEnv.getRedis()
      const getSpy = jest.spyOn(redis, 'get')

      // Act - First request
      const startTime1 = Date.now()
      await request(app)
        .get('/api/trpc/client.getAll')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
      const duration1 = Date.now() - startTime1

      // Act - Second request (should use cache)
      const startTime2 = Date.now()
      await request(app)
        .get('/api/trpc/client.getAll')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
      const duration2 = Date.now() - startTime2

      // Assert
      expect(getSpy).toHaveBeenCalled()
      expect(duration2).toBeLessThan(duration1 * 0.5)

      getSpy.mockRestore()
    })
  })

  describe('PUT /api/trpc/client.update', () => {
    let clientId: string

    beforeEach(async () => {
      // Create a test client
      const prisma = testEnv.getPrisma()
      const client = await prisma.client.create({
        data: {
          id: 'client-update-test',
          name: 'Original Name',
          email: 'original@test.com',
          organizationId: 'test-org-1',
          type: 'individual',
          status: 'active'
        }
      })
      clientId = client.id
    })

    test('should update client and create audit trail', async () => {
      // Arrange
      const updateData = {
        id: clientId,
        name: 'Updated Name',
        email: 'updated@test.com'
      }

      // Act
      const response = await request(app)
        .put('/api/trpc/client.update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      // Assert
      expect(response.body.result.data).toMatchObject({
        name: 'Updated Name',
        email: 'updated@test.com'
      })

      // Verify audit trail
      const prisma = testEnv.getPrisma()
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'client',
          entityId: clientId,
          action: 'update'
        }
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.oldValues).toMatchObject({
        name: 'Original Name',
        email: 'original@test.com'
      })
      expect(auditLog?.newValues).toMatchObject({
        name: 'Updated Name',
        email: 'updated@test.com'
      })
    })

    test('should invalidate related caches on update', async () => {
      // Arrange
      const redis = testEnv.getRedis()
      const delSpy = jest.spyOn(redis, 'del')

      const updateData = {
        id: clientId,
        name: 'Cache Invalidation Test'
      }

      // Act
      await request(app)
        .put('/api/trpc/client.update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      // Assert - Cache invalidation should occur
      expect(delSpy).toHaveBeenCalledWith(
        expect.stringMatching(/client.*list.*test-org-1/)
      )

      delSpy.mockRestore()
    })
  })
})
```

### Database Integration Tests

```typescript
// test/integration/database/multi-tenant.integration.test.ts
import { TestEnvironment } from '@/test/config/test-environment'
import { createTenantClient } from '@/lib/database/tenant-client'

describe('Multi-Tenant Database Integration', () => {
  let testEnv: TestEnvironment
  let tenantAClient: any
  let tenantBClient: any

  beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()

    tenantAClient = createTenantClient('test-org-1')
    tenantBClient = createTenantClient('test-org-2')
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  describe('Data Isolation', () => {
    test('should prevent cross-tenant data access', async () => {
      // Arrange - Create client in tenant A
      const clientA = await tenantAClient.client.create({
        data: {
          name: 'Tenant A Client',
          email: 'clienta@test.com',
          type: 'individual',
          organizationId: 'test-org-1'
        }
      })

      // Act - Try to access from tenant B
      const clientFromTenantB = await tenantBClient.client.findUnique({
        where: { id: clientA.id }
      })

      // Assert
      expect(clientFromTenantB).toBeNull()
    })

    test('should isolate user sessions by organization', async () => {
      // Arrange - Create sessions for different tenants
      const prisma = testEnv.getPrisma()

      await prisma.userSession.createMany({
        data: [
          {
            id: 'session-org-1',
            userId: 'test-user-admin',
            organizationId: 'test-org-1',
            expiresAt: new Date(Date.now() + 86400000)
          },
          {
            id: 'session-org-2',
            userId: 'test-user-2',
            organizationId: 'test-org-2',
            expiresAt: new Date(Date.now() + 86400000)
          }
        ]
      })

      // Act - Query sessions through tenant clients
      const org1Sessions = await tenantAClient.userSession.findMany()
      const org2Sessions = await tenantBClient.userSession.findMany()

      // Assert
      expect(org1Sessions).toHaveLength(1)
      expect(org2Sessions).toHaveLength(1)
      expect(org1Sessions[0].organizationId).toBe('test-org-1')
      expect(org2Sessions[0].organizationId).toBe('test-org-2')
    })

    test('should enforce organization scoping in complex queries', async () => {
      // Arrange - Create data across multiple organizations
      const prisma = testEnv.getPrisma()

      // Create clients for both orgs
      await prisma.client.createMany({
        data: [
          {
            id: 'client-org-1-1',
            name: 'Org 1 Client 1',
            organizationId: 'test-org-1',
            email: 'org1client1@test.com',
            type: 'individual'
          },
          {
            id: 'client-org-1-2',
            name: 'Org 1 Client 2',
            organizationId: 'test-org-1',
            email: 'org1client2@test.com',
            type: 'business'
          },
          {
            id: 'client-org-2-1',
            name: 'Org 2 Client 1',
            organizationId: 'test-org-2',
            email: 'org2client1@test.com',
            type: 'individual'
          }
        ]
      })

      // Act - Complex query with joins and filters
      const org1Results = await tenantAClient.client.findMany({
        where: {
          type: 'individual'
        },
        include: {
          _count: {
            select: { documents: true }
          }
        }
      })

      const org2Results = await tenantBClient.client.findMany({
        where: {
          type: 'individual'
        }
      })

      // Assert
      expect(org1Results).toHaveLength(1)
      expect(org2Results).toHaveLength(1)
      expect(org1Results[0].organizationId).toBe('test-org-1')
      expect(org2Results[0].organizationId).toBe('test-org-2')
    })
  })

  describe('Performance Under Load', () => {
    test('should maintain performance with tenant isolation', async () => {
      // Arrange - Create many clients across tenants
      const prisma = testEnv.getPrisma()

      const org1Clients = Array.from({ length: 100 }, (_, i) => ({
        id: `load-test-org-1-${i}`,
        name: `Load Test Client ${i}`,
        email: `loadtest${i}@org1.com`,
        organizationId: 'test-org-1',
        type: 'individual' as const
      }))

      const org2Clients = Array.from({ length: 100 }, (_, i) => ({
        id: `load-test-org-2-${i}`,
        name: `Load Test Client ${i}`,
        email: `loadtest${i}@org2.com`,
        organizationId: 'test-org-2',
        type: 'individual' as const
      }))

      await prisma.client.createMany({ data: org1Clients })
      await prisma.client.createMany({ data: org2Clients })

      // Act - Concurrent queries from both tenants
      const startTime = Date.now()

      const [org1QueryResult, org2QueryResult] = await Promise.all([
        tenantAClient.client.findMany({
          where: { type: 'individual' },
          take: 50
        }),
        tenantBClient.client.findMany({
          where: { type: 'individual' },
          take: 50
        })
      ])

      const duration = Date.now() - startTime

      // Assert
      expect(org1QueryResult).toHaveLength(50)
      expect(org2QueryResult).toHaveLength(50)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second

      // Verify no cross-tenant contamination
      expect(org1QueryResult.every(c => c.organizationId === 'test-org-1')).toBe(true)
      expect(org2QueryResult.every(c => c.organizationId === 'test-org-2')).toBe(true)
    })
  })

  describe('Transaction Isolation', () => {
    test('should isolate transactions between tenants', async () => {
      // Arrange
      const prisma = testEnv.getPrisma()

      // Act - Concurrent transactions
      const [result1, result2] = await Promise.allSettled([
        tenantAClient.$transaction(async (tx: any) => {
          const client = await tx.client.create({
            data: {
              name: 'Transaction Test A',
              email: 'transactiona@test.com',
              organizationId: 'test-org-1',
              type: 'individual'
            }
          })

          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 100))

          return client
        }),
        tenantBClient.$transaction(async (tx: any) => {
          const client = await tx.client.create({
            data: {
              name: 'Transaction Test B',
              email: 'transactionb@test.com',
              organizationId: 'test-org-2',
              type: 'individual'
            }
          })

          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 100))

          return client
        })
      ])

      // Assert
      expect(result1.status).toBe('fulfilled')
      expect(result2.status).toBe('fulfilled')

      if (result1.status === 'fulfilled' && result2.status === 'fulfilled') {
        expect(result1.value.organizationId).toBe('test-org-1')
        expect(result2.value.organizationId).toBe('test-org-2')
      }
    })
  })
})
```

---

## End-to-End Testing Framework

### User Journey Tests

```typescript
// test/e2e/user-journeys/client-management.e2e.test.ts
import { test, expect, Page } from '@playwright/test'
import { TestEnvironment } from '@/test/config/test-environment'
import { loginAsAdmin, loginAsUser } from '@/test/utils/e2e-helpers'

test.describe('Client Management User Journey', () => {
  let testEnv: TestEnvironment

  test.beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()
  })

  test.afterAll(async () => {
    await testEnv.cleanup()
  })

  test('admin can create, view, and manage clients', async ({ page }) => {
    // Step 1: Login as admin
    await loginAsAdmin(page)
    await expect(page.locator('[data-testid=dashboard-title]')).toContainText('Dashboard')

    // Step 2: Navigate to clients page
    await page.click('[data-testid=nav-clients]')
    await expect(page.locator('[data-testid=clients-page-title]')).toContainText('Clients')

    // Step 3: Create new client
    await page.click('[data-testid=create-client-button]')
    await expect(page.locator('[data-testid=client-form-title]')).toContainText('Create Client')

    await page.fill('[data-testid=client-name]', 'E2E Test Client')
    await page.fill('[data-testid=client-email]', 'e2e@testclient.com')
    await page.selectOption('[data-testid=client-type]', 'individual')
    await page.fill('[data-testid=client-phone]', '+1-555-123-4567')

    await page.click('[data-testid=save-client-button]')

    // Step 4: Verify client was created
    await expect(page.locator('[data-testid=success-message]')).toContainText('Client created successfully')
    await expect(page.locator('[data-testid=client-list]')).toContainText('E2E Test Client')

    // Step 5: View client details
    await page.click('[data-testid=client-row]:has-text("E2E Test Client")')
    await expect(page.locator('[data-testid=client-detail-name]')).toContainText('E2E Test Client')
    await expect(page.locator('[data-testid=client-detail-email]')).toContainText('e2e@testclient.com')

    // Step 6: Edit client
    await page.click('[data-testid=edit-client-button]')
    await page.fill('[data-testid=client-name]', 'E2E Test Client Updated')
    await page.click('[data-testid=save-client-button]')

    await expect(page.locator('[data-testid=success-message]')).toContainText('Client updated successfully')
    await expect(page.locator('[data-testid=client-detail-name]')).toContainText('E2E Test Client Updated')

    // Step 7: Verify audit trail
    await page.click('[data-testid=client-audit-tab]')
    await expect(page.locator('[data-testid=audit-log]')).toContainText('Client created')
    await expect(page.locator('[data-testid=audit-log]')).toContainText('Client updated')
  })

  test('user with limited permissions cannot access admin features', async ({ page }) => {
    // Step 1: Login as regular user
    await loginAsUser(page, 'cpa')
    await expect(page.locator('[data-testid=dashboard-title]')).toContainText('Dashboard')

    // Step 2: Navigate to clients page
    await page.click('[data-testid=nav-clients]')
    await expect(page.locator('[data-testid=clients-page-title]')).toContainText('Clients')

    // Step 3: Verify create button is not visible
    await expect(page.locator('[data-testid=create-client-button]')).not.toBeVisible()

    // Step 4: Try to access admin-only client settings
    await page.goto('/clients/settings')
    await expect(page.locator('[data-testid=access-denied]')).toContainText('Access Denied')
  })

  test('client data is properly secured and validated', async ({ page }) => {
    await loginAsAdmin(page)

    // Test form validation
    await page.goto('/clients/new')
    await page.click('[data-testid=save-client-button]') // Try to save empty form

    await expect(page.locator('[data-testid=validation-error]')).toContainText('Name is required')
    await expect(page.locator('[data-testid=validation-error]')).toContainText('Email is required')

    // Test email format validation
    await page.fill('[data-testid=client-name]', 'Test Client')
    await page.fill('[data-testid=client-email]', 'invalid-email')
    await page.click('[data-testid=save-client-button]')

    await expect(page.locator('[data-testid=validation-error]')).toContainText('Invalid email format')

    // Test XSS protection
    await page.fill('[data-testid=client-name]', '<script>alert("xss")</script>')
    await page.fill('[data-testid=client-email]', 'xss@test.com')
    await page.click('[data-testid=save-client-button]')

    // Verify script is sanitized
    await expect(page.locator('[data-testid=client-list]')).not.toContainText('<script>')
    await expect(page.locator('[data-testid=client-list]')).toContainText('&lt;script&gt;')
  })

  test('responsive design works across device sizes', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/clients')

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid=mobile-menu-toggle]')).toBeVisible()
    await expect(page.locator('[data-testid=desktop-sidebar]')).not.toBeVisible()

    // Open mobile menu
    await page.click('[data-testid=mobile-menu-toggle]')
    await expect(page.locator('[data-testid=mobile-nav-clients]')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('[data-testid=tablet-layout]')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid=desktop-sidebar]')).toBeVisible()
    await expect(page.locator('[data-testid=mobile-menu-toggle]')).not.toBeVisible()
  })
})
```

### Workflow Automation E2E Tests

```typescript
// test/e2e/workflows/document-processing.e2e.test.ts
import { test, expect } from '@playwright/test'
import { TestEnvironment } from '@/test/config/test-environment'
import { loginAsAdmin } from '@/test/utils/e2e-helpers'
import path from 'path'

test.describe('Document Processing Workflow', () => {
  let testEnv: TestEnvironment

  test.beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()
  })

  test.afterAll(async () => {
    await testEnv.cleanup()
  })

  test('complete document processing workflow', async ({ page }) => {
    await loginAsAdmin(page)

    // Step 1: Upload document
    await page.goto('/documents/upload')

    const fileInput = page.locator('[data-testid=file-input]')
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-invoice.pdf'))

    await page.selectOption('[data-testid=document-type]', 'invoice')
    await page.selectOption('[data-testid=client-select]', 'test-client-1')

    await page.click('[data-testid=upload-button]')
    await expect(page.locator('[data-testid=upload-success]')).toContainText('Document uploaded successfully')

    // Step 2: Verify OCR processing started
    await page.goto('/documents')
    await expect(page.locator('[data-testid=document-status]:first-child')).toContainText('Processing')

    // Step 3: Wait for OCR completion (with timeout)
    await page.waitForSelector('[data-testid=document-status]:first-child:has-text("Completed")', {
      timeout: 30000
    })

    // Step 4: Review OCR results
    await page.click('[data-testid=document-row]:first-child')
    await expect(page.locator('[data-testid=ocr-results]')).toBeVisible()

    // Verify extracted data
    await expect(page.locator('[data-testid=extracted-amount]')).toContainText('$')
    await expect(page.locator('[data-testid=extracted-date]')).toContainText('/')
    await expect(page.locator('[data-testid=extracted-vendor]')).not.toBeEmpty()

    // Step 5: Validate and approve OCR results
    await page.click('[data-testid=review-ocr-button]')
    await page.click('[data-testid=approve-ocr-button]')

    await expect(page.locator('[data-testid=success-message]')).toContainText('OCR results approved')

    // Step 6: Verify workflow triggered QuickBooks sync
    await page.goto('/integrations/quickbooks')
    await expect(page.locator('[data-testid=sync-status]')).toContainText('Syncing')

    // Step 7: Check audit trail
    await page.goto('/audit/logs')
    await expect(page.locator('[data-testid=audit-log]')).toContainText('Document uploaded')
    await expect(page.locator('[data-testid=audit-log]')).toContainText('OCR processing completed')
    await expect(page.locator('[data-testid=audit-log]')).toContainText('QuickBooks sync initiated')
  })

  test('handles document processing errors gracefully', async ({ page }) => {
    await loginAsAdmin(page)

    // Upload corrupted file
    await page.goto('/documents/upload')

    const fileInput = page.locator('[data-testid=file-input]')
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/corrupted-file.pdf'))

    await page.click('[data-testid=upload-button]')

    // Verify error handling
    await page.waitForSelector('[data-testid=document-status]:first-child:has-text("Error")', {
      timeout: 30000
    })

    await page.click('[data-testid=document-row]:first-child')
    await expect(page.locator('[data-testid=error-message]')).toContainText('Unable to process document')

    // Verify retry option is available
    await expect(page.locator('[data-testid=retry-button]')).toBeVisible()

    // Test retry functionality
    await page.click('[data-testid=retry-button]')
    await expect(page.locator('[data-testid=document-status]')).toContainText('Processing')
  })

  test('workflow permissions are enforced', async ({ page }) => {
    await loginAsUser(page, 'intern')

    // Try to access document upload (should be restricted)
    await page.goto('/documents/upload')
    await expect(page.locator('[data-testid=access-denied]')).toBeVisible()

    // Try to approve OCR results (should be restricted)
    await page.goto('/documents')
    await page.click('[data-testid=document-row]:first-child')
    await expect(page.locator('[data-testid=approve-ocr-button]')).not.toBeVisible()
  })
})
```

### Performance E2E Tests

```typescript
// test/e2e/performance/dashboard-load.e2e.test.ts
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '@/test/utils/e2e-helpers'

test.describe('Dashboard Performance', () => {
  test('dashboard loads within performance budget', async ({ page }) => {
    await loginAsAdmin(page)

    // Start performance monitoring
    await page.goto('/dashboard')

    // Measure page load performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
      }
    })

    // Performance assertions
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000) // 2 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500) // 1.5 seconds
    expect(performanceMetrics.largestContentfulPaint).toBeLessThan(2500) // 2.5 seconds

    // Verify critical elements are visible
    await expect(page.locator('[data-testid=dashboard-title]')).toBeVisible()
    await expect(page.locator('[data-testid=kpi-cards]')).toBeVisible()
    await expect(page.locator('[data-testid=charts-section]')).toBeVisible()
  })

  test('dashboard handles large datasets efficiently', async ({ page }) => {
    // Login and navigate to dashboard with many clients
    await loginAsAdmin(page)

    // Simulate large dataset
    await page.route('/api/trpc/client.getAll*', route => {
      const largeDataset = {
        result: {
          data: {
            clients: Array.from({ length: 1000 }, (_, i) => ({
              id: `client-${i}`,
              name: `Client ${i}`,
              email: `client${i}@test.com`,
              type: 'individual',
              status: 'active'
            })),
            total: 1000
          }
        }
      }
      route.fulfill({ json: largeDataset })
    })

    const startTime = Date.now()
    await page.goto('/clients')

    // Wait for table to load
    await expect(page.locator('[data-testid=client-table]')).toBeVisible()

    const loadTime = Date.now() - startTime

    // Should load within 3 seconds even with large dataset
    expect(loadTime).toBeLessThan(3000)

    // Verify pagination is working
    await expect(page.locator('[data-testid=pagination]')).toBeVisible()
    await expect(page.locator('[data-testid=client-row]')).toHaveCount(50) // Default page size
  })

  test('search and filtering performance', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/clients')

    // Test search performance
    const searchStartTime = Date.now()
    await page.fill('[data-testid=search-input]', 'test search query')
    await page.waitForResponse('/api/trpc/client.search*')
    const searchTime = Date.now() - searchStartTime

    expect(searchTime).toBeLessThan(1000) // Search should complete within 1 second

    // Test filter performance
    const filterStartTime = Date.now()
    await page.selectOption('[data-testid=status-filter]', 'active')
    await page.waitForResponse('/api/trpc/client.getAll*')
    const filterTime = Date.now() - filterStartTime

    expect(filterTime).toBeLessThan(500) // Filter should complete within 500ms
  })
})
```

---

## Security Testing Framework

### Authentication and Authorization Tests

```typescript
// test/security/auth.security.test.ts
import { test, expect } from '@playwright/test'
import request from 'supertest'
import { createTestServer } from '@/test/utils/test-server'
import { TestEnvironment } from '@/test/config/test-environment'

test.describe('Security Testing', () => {
  let app: any
  let testEnv: TestEnvironment

  test.beforeAll(async () => {
    testEnv = TestEnvironment.getInstance()
    await testEnv.initialize()
    app = await createTestServer()
  })

  test.afterAll(async () => {
    await testEnv.cleanup()
  })

  describe('Authentication Security', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousPayloads = [
        "admin'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "admin' UNION SELECT * FROM users --",
        "'; WAITFOR DELAY '00:00:05' --"
      ]

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'password123'
          })

        // Should reject with validation error, not execute SQL
        expect(response.status).toBeOneOf([400, 401])
        expect(response.body.error).toBeDefined()
      }

      // Verify database is still intact
      const prisma = testEnv.getPrisma()
      const userCount = await prisma.user.count()
      expect(userCount).toBeGreaterThan(0) // Table should still exist
    })

    test('should prevent brute force attacks', async () => {
      const attempts = Array.from({ length: 11 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'wrongpassword'
          })
      )

      const responses = await Promise.all(attempts)

      // First few attempts should return 401
      expect(responses.slice(0, 5).every(r => r.status === 401)).toBe(true)

      // Later attempts should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)

      // Should create security event
      const prisma = testEnv.getPrisma()
      const securityEvent = await prisma.securityEvent.findFirst({
        where: {
          eventType: 'brute_force_attempt',
          severity: 'high'
        }
      })

      expect(securityEvent).toBeDefined()
    })

    test('should validate JWT tokens properly', async () => {
      // Test with invalid JWT
      const response1 = await request(app)
        .get('/api/trpc/client.getAll')
        .set('Authorization', 'Bearer invalid.jwt.token')

      expect(response1.status).toBe(401)

      // Test with expired JWT
      const expiredToken = generateExpiredTestJWT()
      const response2 = await request(app)
        .get('/api/trpc/client.getAll')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(response2.status).toBe(401)

      // Test with tampered JWT
      const validToken = generateTestJWT({ userId: 'test-user' })
      const tamperedToken = validToken.slice(0, -5) + 'XXXXX'
      const response3 = await request(app)
        .get('/api/trpc/client.getAll')
        .set('Authorization', `Bearer ${tamperedToken}`)

      expect(response3.status).toBe(401)
    })
  })

  describe('Input Validation Security', () => {
    test('should prevent XSS attacks', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '<svg onload="alert(\'xss\')">',
        '"><script>alert("xss")</script>'
      ]

      const validToken = generateTestJWT({
        userId: 'test-user-admin',
        organizationId: 'test-org-1'
      })

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/trpc/client.create')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            name: payload,
            email: 'test@test.com',
            type: 'individual'
          })

        if (response.status === 200) {
          // If creation succeeded, verify XSS was sanitized
          expect(response.body.result.data.name).not.toContain('<script>')
          expect(response.body.result.data.name).not.toContain('javascript:')
        } else {
          // Should be rejected with validation error
          expect(response.status).toBe(400)
        }
      }
    })

    test('should validate file uploads securely', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/documents/upload')

      // Test malicious file types
      const maliciousFiles = [
        '../fixtures/malicious.exe',
        '../fixtures/script.php',
        '../fixtures/virus.bat'
      ]

      for (const filePath of maliciousFiles) {
        await page.setInputFiles('[data-testid=file-input]', path.join(__dirname, filePath))
        await page.click('[data-testid=upload-button]')

        await expect(page.locator('[data-testid=error-message]'))
          .toContainText('File type not allowed')
      }

      // Test oversized files
      await page.setInputFiles('[data-testid=file-input]',
        path.join(__dirname, '../fixtures/oversized-file.pdf')
      )
      await page.click('[data-testid=upload-button]')

      await expect(page.locator('[data-testid=error-message]'))
        .toContainText('File size exceeds limit')
    })

    test('should prevent NoSQL injection', async () => {
      const noSQLPayloads = [
        '{"$where": "function(){return true;}"}',
        '{"$regex": ".*"}',
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$exists": true}'
      ]

      const validToken = generateTestJWT({
        userId: 'test-user-admin',
        organizationId: 'test-org-1'
      })

      for (const payload of noSQLPayloads) {
        const response = await request(app)
          .get('/api/trpc/client.search')
          .query({ q: payload })
          .set('Authorization', `Bearer ${validToken}`)

        // Should either reject or sanitize the input
        if (response.status === 200) {
          // Verify it doesn't return all records (which would indicate successful injection)
          expect(response.body.result.data.length).toBeLessThan(1000)
        } else {
          expect(response.status).toBe(400)
        }
      }
    })
  })

  describe('API Security', () => {
    test('should enforce CORS policies', async () => {
      const maliciousOrigins = [
        'http://malicious-site.com',
        'https://evil.example.com',
        'http://localhost:3001' // Different port
      ]

      for (const origin of maliciousOrigins) {
        const response = await request(app)
          .options('/api/trpc/client.getAll')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET')

        // Should not allow unauthorized origins
        expect(response.headers['access-control-allow-origin']).not.toBe(origin)
      }

      // Test allowed origin
      const response = await request(app)
        .options('/api/trpc/client.getAll')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    })

    test('should implement proper rate limiting', async () => {
      const validToken = generateTestJWT({
        userId: 'test-user-admin',
        organizationId: 'test-org-1'
      })

      // Send requests rapidly to trigger rate limiting
      const requests = Array.from({ length: 105 }, () =>
        request(app)
          .get('/api/trpc/client.getAll')
          .set('Authorization', `Bearer ${validToken}`)
      )

      const responses = await Promise.allSettled(requests)
      const rateLimitedCount = responses.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      ).length

      expect(rateLimitedCount).toBeGreaterThan(0)

      // Verify rate limit headers are present
      const lastResponse = responses[responses.length - 1]
      if (lastResponse.status === 'fulfilled') {
        expect(lastResponse.value.headers['x-ratelimit-limit']).toBeDefined()
        expect(lastResponse.value.headers['x-ratelimit-remaining']).toBeDefined()
      }
    })

    test('should prevent CSRF attacks', async ({ page }) => {
      await loginAsAdmin(page)

      // Get CSRF token from page
      const csrfToken = await page.evaluate(() => {
        const metaTag = document.querySelector('meta[name="csrf-token"]')
        return metaTag?.getAttribute('content')
      })

      expect(csrfToken).toBeDefined()

      // Test request without CSRF token should fail
      const responseWithoutToken = await page.evaluate(async () => {
        const response = await fetch('/api/trpc/client.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'CSRF Test Client',
            email: 'csrf@test.com',
            type: 'individual'
          })
        })
        return response.status
      })

      expect(responseWithoutToken).toBe(403)

      // Test request with valid CSRF token should succeed
      const responseWithToken = await page.evaluate(async (token) => {
        const response = await fetch('/api/trpc/client.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
          },
          body: JSON.stringify({
            name: 'CSRF Test Client',
            email: 'csrf@test.com',
            type: 'individual'
          })
        })
        return response.status
      }, csrfToken)

      expect(responseWithToken).toBe(200)
    })
  })

  describe('Data Security', () => {
    test('should encrypt sensitive data at rest', async () => {
      const prisma = testEnv.getPrisma()

      // Create API key (should be hashed)
      const apiKey = await prisma.apiKey.create({
        data: {
          name: 'Test API Key',
          keyHash: 'hashed_key_value',
          keyPrefix: 'ak_test',
          organizationId: 'test-org-1',
          createdBy: 'test-user-admin',
          permissions: { 'clients:read': true }
        }
      })

      // Verify the key is hashed, not stored in plain text
      expect(apiKey.keyHash).not.toContain('ak_test')
      expect(apiKey.keyHash).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hash format
    })

    test('should mask sensitive data in logs', async () => {
      const prisma = testEnv.getPrisma()

      // Create audit log with sensitive data
      await prisma.auditLog.create({
        data: {
          organizationId: 'test-org-1',
          userId: 'test-user-admin',
          entityType: 'client',
          entityId: 'client-1',
          action: 'update',
          oldValues: {
            ssn: '123-45-6789',
            creditCard: '4111-1111-1111-1111'
          },
          newValues: {
            ssn: '987-65-4321',
            creditCard: '4222-2222-2222-2222'
          }
        }
      })

      // Verify sensitive data is masked in logs
      const auditLog = await prisma.auditLog.findFirst({
        where: { entityId: 'client-1' }
      })

      expect(auditLog?.oldValues?.ssn).toBe('***-**-6789')
      expect(auditLog?.oldValues?.creditCard).toBe('****-****-****-1111')
    })

    test('should implement proper session management', async ({ page }) => {
      await loginAsAdmin(page)

      // Get session cookie
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'session')

      expect(sessionCookie).toBeDefined()
      expect(sessionCookie?.secure).toBe(true) // HTTPS only
      expect(sessionCookie?.httpOnly).toBe(true) // Not accessible via JavaScript
      expect(sessionCookie?.sameSite).toBe('Strict') // CSRF protection

      // Test session expiration
      await page.evaluate(() => {
        document.cookie = 'session=expired; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      })

      await page.reload()
      await expect(page.locator('[data-testid=login-form]')).toBeVisible()
    })
  })
})
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/integration-testing.yml
name: AdvisorOS Integration Testing Pipeline

on:
  push:
    branches: [main, develop, 'feature/**', 'wave/**']
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  DATABASE_URL: postgresql://postgres:test@localhost:5432/advisoros_test
  TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/advisoros_test
  REDIS_URL: redis://localhost:6379
  TEST_REDIS_HOST: localhost
  TEST_REDIS_PORT: 6379

jobs:
  # Parallel job for unit tests
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: advisoros_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npx prisma migrate deploy

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run unit tests
        run: npm run test:unit -- --coverage --maxWorkers=2

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
          flags: unittests

  # Parallel job for integration tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: advisoros_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npx prisma migrate deploy

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Seed test data
        run: npx prisma db seed

      - name: Run integration tests
        run: npm run test:integration -- --maxWorkers=2

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: integration-test-results
          path: test-results/

  # End-to-end tests
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: advisoros_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run database migrations
        run: npx prisma migrate deploy

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Build application
        run: npm run build

      - name: Start application in background
        run: |
          npm start &
          echo $! > app.pid
          sleep 10 # Wait for app to start

      - name: Wait for application to be ready
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Stop application
        if: always()
        run: |
          if [ -f app.pid ]; then
            kill $(cat app.pid) || true
          fi

      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-test-results
          path: |
            test-results/
            playwright-report/

  # Performance tests
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    if: github.ref == 'refs/heads/main' || contains(github.event.pull_request.labels.*.name, 'performance')

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: advisoros_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npx prisma migrate deploy

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Seed performance test data
        run: npm run test:seed:performance

      - name: Build application
        run: npm run build

      - name: Start application in background
        run: |
          npm start &
          echo $! > app.pid
          sleep 10

      - name: Run performance tests
        run: npm run test:performance

      - name: Stop application
        if: always()
        run: |
          if [ -f app.pid ]; then
            kill $(cat app.pid) || true
          fi

      - name: Upload performance test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: performance-test-results
          path: performance-results/

  # Security tests
  security-tests:
    name: Security Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level moderate

      - name: Run security linting
        run: npm run lint:security

      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'AdvisorOS'
          path: '.'
          format: 'JSON'

      - name: Upload security scan results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-scan-results
          path: reports/

  # Build and deployment validation
  build-validation:
    name: Build Validation
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [unit-tests, integration-tests]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npm run type-check

      - name: Run linting
        run: npm run lint

      - name: Build application
        run: npm run build

      - name: Validate build artifacts
        run: |
          # Check that essential files exist
          test -f .next/standalone/server.js
          test -d .next/static
          test -f package.json

      - name: Test production build
        run: |
          timeout 30 bash -c '
            npm start &
            APP_PID=$!
            sleep 10
            curl -f http://localhost:3000/health
            kill $APP_PID
          '

  # Integration validation summary
  integration-summary:
    name: Integration Summary
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, security-tests, build-validation]
    if: always()

    steps:
      - name: Check test results
        run: |
          echo "Unit Tests: ${{ needs.unit-tests.result }}"
          echo "Integration Tests: ${{ needs.integration-tests.result }}"
          echo "E2E Tests: ${{ needs.e2e-tests.result }}"
          echo "Security Tests: ${{ needs.security-tests.result }}"
          echo "Build Validation: ${{ needs.build-validation.result }}"

      - name: Fail if any critical tests failed
        if: needs.unit-tests.result == 'failure' || needs.integration-tests.result == 'failure' || needs.security-tests.result == 'failure' || needs.build-validation.result == 'failure'
        run: exit 1

      - name: Create integration report
        run: |
          cat > integration-report.md << EOF
          # AdvisorOS Integration Test Report

          ## Test Results Summary
          - **Unit Tests**: ${{ needs.unit-tests.result }}
          - **Integration Tests**: ${{ needs.integration-tests.result }}
          - **E2E Tests**: ${{ needs.e2e-tests.result }}
          - **Security Tests**: ${{ needs.security-tests.result }}
          - **Build Validation**: ${{ needs.build-validation.result }}

          ## Branch: ${{ github.ref_name }}
          ## Commit: ${{ github.sha }}
          ## Run ID: ${{ github.run_id }}

          Generated at: $(date)
          EOF

      - name: Upload integration report
        uses: actions/upload-artifact@v3
        with:
          name: integration-report
          path: integration-report.md
```

---

## Test Data Management

### Test Data Factory

```typescript
// test/utils/test-data-factory.ts
import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

export class TestDataFactory {
  constructor(private prisma: PrismaClient) {}

  async createOrganization(overrides: Partial<any> = {}) {
    return await this.prisma.organization.create({
      data: {
        id: faker.string.uuid(),
        name: faker.company.name(),
        settings: {
          features: {
            workflows: true,
            ai: true,
            analytics: true
          },
          preferences: {
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY'
          }
        },
        ...overrides
      }
    })
  }

  async createUser(organizationId: string, overrides: Partial<any> = {}) {
    return await this.prisma.user.create({
      data: {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        organizationId,
        role: 'cpa',
        createdAt: new Date(),
        ...overrides
      }
    })
  }

  async createClient(organizationId: string, overrides: Partial<any> = {}) {
    return await this.prisma.client.create({
      data: {
        id: faker.string.uuid(),
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        organizationId,
        type: faker.helpers.arrayElement(['individual', 'business']),
        status: 'active',
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: 'US'
        },
        ...overrides
      }
    })
  }

  async createDocument(organizationId: string, clientId: string, overrides: Partial<any> = {}) {
    return await this.prisma.document.create({
      data: {
        id: faker.string.uuid(),
        name: faker.system.fileName(),
        type: faker.helpers.arrayElement(['invoice', 'receipt', 'tax_document', 'contract']),
        organizationId,
        clientId,
        fileSize: faker.number.int({ min: 1000, max: 5000000 }),
        mimeType: 'application/pdf',
        uploadedAt: new Date(),
        status: 'processed',
        metadata: {
          ocrConfidence: faker.number.float({ min: 0.8, max: 1.0 }),
          extractedData: {
            amount: faker.number.float({ min: 100, max: 10000 }),
            date: faker.date.recent().toISOString(),
            vendor: faker.company.name()
          }
        },
        ...overrides
      }
    })
  }

  async createWorkflow(organizationId: string, overrides: Partial<any> = {}) {
    return await this.prisma.workflow.create({
      data: {
        id: faker.string.uuid(),
        name: faker.helpers.arrayElement([
          'Client Onboarding',
          'Tax Document Processing',
          'Monthly Financial Review',
          'Expense Report Processing'
        ]),
        description: faker.lorem.sentence(),
        organizationId,
        category: faker.helpers.arrayElement(['onboarding', 'tax_prep', 'document_processing']),
        definition: {
          nodes: [
            {
              id: 'start',
              type: 'trigger',
              data: { triggerType: 'manual' }
            },
            {
              id: 'process',
              type: 'action',
              data: { actionType: 'document_ocr' }
            },
            {
              id: 'end',
              type: 'action',
              data: { actionType: 'notify_completion' }
            }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'process' },
            { id: 'e2', source: 'process', target: 'end' }
          ]
        },
        status: 'published',
        version: 1,
        createdBy: faker.string.uuid(),
        ...overrides
      }
    })
  }

  async createApiKey(organizationId: string, createdBy: string, overrides: Partial<any> = {}) {
    return await this.prisma.apiKey.create({
      data: {
        id: faker.string.uuid(),
        name: faker.helpers.arrayElement(['Production API Key', 'Development Key', 'Integration Key']),
        keyHash: faker.string.hexadecimal({ length: 64 }),
        keyPrefix: 'ak_test',
        organizationId,
        createdBy,
        permissions: {
          'clients:read': true,
          'clients:create': faker.datatype.boolean(),
          'documents:read': true,
          'workflows:execute': faker.datatype.boolean()
        },
        rateLimit: faker.number.int({ min: 100, max: 10000 }),
        expiresAt: faker.date.future(),
        ...overrides
      }
    })
  }

  async createAuditLog(organizationId: string, userId: string, overrides: Partial<any> = {}) {
    const entityTypes = ['client', 'document', 'workflow', 'user']
    const actions = ['create', 'read', 'update', 'delete', 'export']

    return await this.prisma.auditLog.create({
      data: {
        id: faker.string.uuid(),
        organizationId,
        userId,
        entityType: faker.helpers.arrayElement(entityTypes),
        entityId: faker.string.uuid(),
        action: faker.helpers.arrayElement(actions),
        oldValues: faker.datatype.boolean() ? {
          name: faker.company.name(),
          status: 'inactive'
        } : null,
        newValues: {
          name: faker.company.name(),
          status: 'active'
        },
        metadata: {
          userAgent: faker.internet.userAgent(),
          sessionId: faker.string.uuid()
        },
        ipAddress: faker.internet.ip(),
        createdAt: faker.date.recent(),
        ...overrides
      }
    })
  }

  async createClientHealthScore(clientId: string, organizationId: string, overrides: Partial<any> = {}) {
    const score = faker.number.float({ min: 0, max: 100 })
    const riskLevel = score < 30 ? 'high' : score < 60 ? 'medium' : 'low'

    return await this.prisma.clientHealthScore.create({
      data: {
        id: faker.string.uuid(),
        clientId,
        organizationId,
        score,
        riskLevel,
        scoreBreakdown: {
          communication: faker.number.float({ min: 0, max: 100 }),
          paymentHistory: faker.number.float({ min: 0, max: 100 }),
          engagement: faker.number.float({ min: 0, max: 100 }),
          compliance: faker.number.float({ min: 0, max: 100 })
        },
        trends: {
          lastMonth: faker.number.float({ min: -10, max: 10 }),
          lastQuarter: faker.number.float({ min: -20, max: 20 })
        },
        recommendations: [
          faker.lorem.sentence(),
          faker.lorem.sentence()
        ],
        calculatedAt: new Date(),
        ...overrides
      }
    })
  }

  async createPerformanceMetrics(organizationId: string | null, overrides: Partial<any> = {}) {
    const metricTypes = [
      'api_response_time',
      'database_query_time',
      'cache_hit_rate',
      'error_rate',
      'throughput'
    ]

    return await this.prisma.performanceMetric.create({
      data: {
        id: faker.string.uuid(),
        organizationId,
        metricType: faker.helpers.arrayElement(metricTypes),
        metricName: faker.helpers.arrayElement(['dashboard_load', 'client_search', 'document_upload']),
        metricValue: faker.number.float({ min: 0, max: 1000 }),
        metricUnit: faker.helpers.arrayElement(['milliseconds', 'percentage', 'count']),
        tags: {
          endpoint: '/api/clients',
          method: 'GET',
          status: '200'
        },
        timestamp: faker.date.recent(),
        ...overrides
      }
    })
  }

  // Bulk data creation methods
  async createBulkTestData(organizationCount = 2, usersPerOrg = 5, clientsPerOrg = 50) {
    const organizations = []

    for (let i = 0; i < organizationCount; i++) {
      const org = await this.createOrganization({
        name: `Test Organization ${i + 1}`
      })
      organizations.push(org)

      // Create users for this org
      const users = []
      for (let j = 0; j < usersPerOrg; j++) {
        const user = await this.createUser(org.id, {
          name: `Test User ${j + 1}`,
          email: `user${j + 1}@org${i + 1}.com`,
          role: j === 0 ? 'owner' : j === 1 ? 'admin' : 'cpa'
        })
        users.push(user)
      }

      // Create clients for this org
      const clients = []
      for (let k = 0; k < clientsPerOrg; k++) {
        const client = await this.createClient(org.id, {
          name: `Test Client ${k + 1}`,
          email: `client${k + 1}@org${i + 1}.com`
        })
        clients.push(client)

        // Create some documents for each client
        for (let d = 0; d < faker.number.int({ min: 1, max: 5 }); d++) {
          await this.createDocument(org.id, client.id)
        }

        // Create health score for each client
        await this.createClientHealthScore(client.id, org.id)
      }

      // Create workflows for this org
      for (let w = 0; w < 3; w++) {
        await this.createWorkflow(org.id)
      }

      // Create API keys
      for (let a = 0; a < 2; a++) {
        await this.createApiKey(org.id, users[0].id)
      }

      // Create audit logs
      for (let l = 0; l < 100; l++) {
        await this.createAuditLog(org.id, faker.helpers.arrayElement(users).id)
      }
    }

    // Create global performance metrics
    for (let m = 0; m < 1000; m++) {
      await this.createPerformanceMetrics(
        faker.datatype.boolean() ? faker.helpers.arrayElement(organizations).id : null
      )
    }

    return organizations
  }

  async cleanup() {
    // Clean up in reverse dependency order
    await this.prisma.performanceMetric.deleteMany()
    await this.prisma.clientHealthScore.deleteMany()
    await this.prisma.auditLog.deleteMany()
    await this.prisma.apiKey.deleteMany()
    await this.prisma.workflow.deleteMany()
    await this.prisma.document.deleteMany()
    await this.prisma.client.deleteMany()
    await this.prisma.user.deleteMany()
    await this.prisma.organization.deleteMany()
  }
}
```

---

## Summary

This comprehensive testing automation framework provides AdvisorOS with enterprise-grade testing capabilities covering:

1. **Unit Testing**: 90% code coverage with service, API, and utility testing
2. **Integration Testing**: Complete API integration, database isolation, and third-party service testing
3. **End-to-End Testing**: Full user journey validation with security and performance validation
4. **Security Testing**: OWASP compliance, input validation, and authentication testing
5. **Performance Testing**: Load testing, response time validation, and scalability testing
6. **CI/CD Integration**: Automated testing pipeline with parallel execution and comprehensive reporting

The framework ensures that all Wave 0-3 integrations are thoroughly tested before deployment, maintaining system reliability and security throughout the integration process.