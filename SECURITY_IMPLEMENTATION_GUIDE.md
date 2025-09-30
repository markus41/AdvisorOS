# SECURITY IMPLEMENTATION GUIDE
## Critical Security Fixes for Production Readiness

**Target:** AdvisorOS Authentication & Authorization Hardening
**Priority:** CRITICAL - Production Blocker
**Estimated Time:** 3 weeks (15 working days)
**Status:** READY FOR IMPLEMENTATION

---

## OVERVIEW

This guide provides step-by-step implementation instructions for the critical security fixes identified in the Security Audit Report. Each fix includes:
- Detailed code implementation
- Testing procedures
- Validation criteria
- Rollback procedures

---

## PHASE 1: CRITICAL FIXES (Week 1 - Days 1-5)

### FIX 1: Implement Prisma Global Middleware (Days 1-2)

#### PRIORITY: CRITICAL (Production Blocker)
#### RISK: HIGH - Cross-tenant data leakage
#### TIME: 8 hours implementation + 8 hours testing

#### Step 1.1: Create Async Context Storage

**File:** `apps/web/src/server/lib/async-context.ts`

```typescript
import { AsyncLocalStorage } from 'async_hooks'

interface SecurityContext {
  userId: string
  organizationId: string
  userRole: string
  sessionId: string
  ipAddress?: string
}

class AsyncContextManager {
  private storage: AsyncLocalStorage<SecurityContext>

  constructor() {
    this.storage = new AsyncLocalStorage<SecurityContext>()
  }

  run<T>(context: SecurityContext, callback: () => T): T {
    return this.storage.run(context, callback)
  }

  getContext(): SecurityContext | undefined {
    return this.storage.getStore()
  }

  getOrganizationId(): string {
    const context = this.getContext()
    if (!context?.organizationId) {
      throw new Error('Organization context not available')
    }
    return context.organizationId
  }

  getUserId(): string {
    const context = this.getContext()
    if (!context?.userId) {
      throw new Error('User context not available')
    }
    return context.userId
  }

  requireContext(): SecurityContext {
    const context = this.getContext()
    if (!context) {
      throw new Error('Security context not available')
    }
    return context
  }
}

export const asyncContext = new AsyncContextManager()
```

#### Step 1.2: Implement Global Prisma Middleware

**File:** `apps/web/src/server/lib/prisma-tenant-middleware.ts`

```typescript
import { Prisma } from '@prisma/client'
import { asyncContext } from './async-context'
import { AuditService } from '../services/audit.service'

// Models that MUST be tenant-scoped
const TENANT_SCOPED_MODELS = [
  'Client',
  'Document',
  'Engagement',
  'Task',
  'Invoice',
  'Report',
  'WorkflowExecution',
  'TaskExecution',
  'AuditLog',
  'Note',
  'QuickBooksSync',
  'QuickBooksWebhookEvent',
  'DocumentAnnotation',
  'DocumentComment',
  'DocumentShare',
  'TeamMember',
  'ReportTemplate',
  'ReportSchedule',
  'Workflow',
  'WorkflowTemplate',
  'TaskQueueItem',
  'ClientPortalAccess',
  'ClientSatisfactionMetric',
  'AdvisorProfile',
  'AdvisorMarketplaceMatch',
  'RevenueShare',
]

// Models that should NOT be tenant-scoped (system-level)
const SYSTEM_MODELS = ['Organization', 'User', 'Subscription', 'AuthAttempt', 'AuthEvent']

export function createTenantMiddleware() {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    const { model, action, args } = params

    // Skip if not a model operation
    if (!model) {
      return next(params)
    }

    // Skip system models
    if (SYSTEM_MODELS.includes(model)) {
      return next(params)
    }

    // Get organization context
    let organizationId: string | undefined

    try {
      organizationId = asyncContext.getOrganizationId()
    } catch (error) {
      // Context not available - this is OK for some operations (like system jobs)
      // But we log it for security monitoring
      if (TENANT_SCOPED_models.includes(model)) {
        console.warn(`Tenant-scoped operation on ${model} without organization context`, {
          action,
          model,
          stack: new Error().stack,
        })
      }
      return next(params)
    }

    // Apply tenant isolation for scoped models
    if (TENANT_SCOPED_MODELS.includes(model) && organizationId) {
      switch (action) {
        case 'findUnique':
        case 'findFirst':
        case 'findMany':
        case 'count':
        case 'aggregate':
        case 'groupBy':
          // Inject organizationId filter for read operations
          params.args = {
            ...params.args,
            where: {
              ...params.args.where,
              organizationId,
            },
          }
          break

        case 'create':
        case 'createMany':
          // Inject organizationId for create operations
          if (action === 'create') {
            params.args = {
              ...params.args,
              data: {
                ...params.args.data,
                organizationId,
              },
            }
          } else if (action === 'createMany') {
            // Handle createMany separately
            const data = Array.isArray(params.args.data) ? params.args.data : [params.args.data]
            params.args = {
              ...params.args,
              data: data.map(item => ({ ...item, organizationId })),
            }
          }
          break

        case 'update':
        case 'updateMany':
        case 'upsert':
          // Enforce organizationId filter for update operations
          params.args = {
            ...params.args,
            where: {
              ...params.args.where,
              organizationId,
            },
          }

          // For upsert, also inject organizationId in create data
          if (action === 'upsert' && params.args.create) {
            params.args.create = {
              ...params.args.create,
              organizationId,
            }
          }
          break

        case 'delete':
        case 'deleteMany':
          // Enforce organizationId filter for delete operations
          params.args = {
            ...params.args,
            where: {
              ...params.args.where,
              organizationId,
            },
          }
          break
      }

      // Log sensitive operations for audit trail
      if (['delete', 'deleteMany', 'update', 'updateMany'].includes(action)) {
        const context = asyncContext.requireContext()
        await AuditService.logSecurityEvent(
          {
            eventType: 'tenant_operation',
            severity: 'low',
            description: `${action} operation on ${model}`,
            resourceType: model,
            riskScore: 20,
            metadata: {
              action,
              model,
              organizationId,
              userId: context.userId,
            },
          },
          context
        )
      }
    }

    // Execute query
    const result = await next(params)

    // Post-execution validation (development only)
    if (process.env.NODE_ENV !== 'production' && TENANT_SCOPED_MODELS.includes(model)) {
      validateTenantIsolation(result, organizationId, model, action)
    }

    return result
  }
}

/**
 * Development-only validation to catch tenant isolation bugs
 */
function validateTenantIsolation(result: any, expectedOrgId: string | undefined, model: string, action: string) {
  if (!expectedOrgId || !result) return

  // Check single results
  if (result && typeof result === 'object' && 'organizationId' in result) {
    if (result.organizationId !== expectedOrgId) {
      throw new Error(
        `SECURITY VIOLATION: ${model}.${action} returned data from different organization! ` +
          `Expected: ${expectedOrgId}, Got: ${result.organizationId}`
      )
    }
  }

  // Check array results
  if (Array.isArray(result)) {
    const violations = result.filter(item => item?.organizationId && item.organizationId !== expectedOrgId)

    if (violations.length > 0) {
      throw new Error(
        `SECURITY VIOLATION: ${model}.${action} returned ${violations.length} records from different organizations! ` +
          `Expected: ${expectedOrgId}`
      )
    }
  }
}

/**
 * Create a tenant-aware Prisma client
 */
export function applyTenantMiddleware(prisma: any) {
  prisma.$use(createTenantMiddleware())
  return prisma
}
```

#### Step 1.3: Update Database Configuration

**File:** `apps/web/src/server/db.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { applyTenantMiddleware } from './lib/prisma-tenant-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  applyTenantMiddleware(
    new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    })
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Step 1.4: Update tRPC Context to Set Async Context

**File:** `apps/web/src/server/api/trpc.ts` (Update existing enforceUserHasOrganization)

```typescript
import { asyncContext } from '../lib/async-context'

const enforceUserHasOrganization = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user?.organizationId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User must belong to an organization'
    })
  }

  // CRITICAL: Verify organization is active
  const organization = await ctx.prisma.organization.findUnique({
    where: { id: ctx.session.user.organizationId },
    select: {
      id: true,
      name: true,
      deletedAt: true,
      subscriptionTier: true,
    }
  })

  if (!organization || organization.deletedAt) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Organization account is not active'
    })
  }

  // Check subscription status
  if (organization.subscriptionTier === 'expired' || organization.subscriptionTier === 'suspended') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Organization subscription has expired. Please update billing information.'
    })
  }

  // Set async context for Prisma middleware
  const securityContext = {
    userId: ctx.session.user.id,
    organizationId: ctx.session.user.organizationId,
    userRole: ctx.session.user.role,
    sessionId: ctx.session.sessionId || 'unknown',
    ipAddress: ctx.req?.headers?.['x-forwarded-for'] as string | undefined,
  }

  // Run the rest of the procedure in async context
  return asyncContext.run(securityContext, () =>
    next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
        prisma: ctx.prisma,
        auditService: ctx.auditService,
        permissionService: ctx.permissionService,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
        organization,
      },
    })
  )
})
```

#### Step 1.5: Testing

**File:** `apps/web/tests/security/tenant-isolation.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/server/db'
import { asyncContext } from '@/server/lib/async-context'
import { appRouter } from '@/server/api/root'

describe('Prisma Tenant Isolation Middleware', () => {
  let org1: any, org2: any, user1: any, user2: any, client1: any, client2: any

  beforeAll(async () => {
    // Create test data
    org1 = await prisma.organization.create({
      data: { name: 'Org 1', subdomain: 'org1-test' },
    })
    org2 = await prisma.organization.create({
      data: { name: 'Org 2', subdomain: 'org2-test' },
    })

    user1 = await prisma.user.create({
      data: {
        email: 'user1@test.com',
        name: 'User 1',
        password: 'hashed',
        role: 'admin',
        organizationId: org1.id,
      },
    })

    user2 = await prisma.user.create({
      data: {
        email: 'user2@test.com',
        name: 'User 2',
        password: 'hashed',
        role: 'admin',
        organizationId: org2.id,
      },
    })

    client1 = await prisma.client.create({
      data: {
        businessName: 'Client 1',
        primaryContactEmail: 'client1@test.com',
        primaryContactName: 'Contact 1',
        organizationId: org1.id,
      },
    })

    client2 = await prisma.client.create({
      data: {
        businessName: 'Client 2',
        primaryContactEmail: 'client2@test.com',
        primaryContactName: 'Contact 2',
        organizationId: org2.id,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.client.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.organization.deleteMany({})
  })

  it('should automatically filter clients by organizationId', async () => {
    // Set context for org1
    await asyncContext.run(
      {
        userId: user1.id,
        organizationId: org1.id,
        userRole: 'admin',
        sessionId: 'test-session',
      },
      async () => {
        const clients = await prisma.client.findMany({})

        expect(clients).toHaveLength(1)
        expect(clients[0].id).toBe(client1.id)
        expect(clients[0].organizationId).toBe(org1.id)
      }
    )

    // Set context for org2
    await asyncContext.run(
      {
        userId: user2.id,
        organizationId: org2.id,
        userRole: 'admin',
        sessionId: 'test-session',
      },
      async () => {
        const clients = await prisma.client.findMany({})

        expect(clients).toHaveLength(1)
        expect(clients[0].id).toBe(client2.id)
        expect(clients[0].organizationId).toBe(org2.id)
      }
    )
  })

  it('should prevent cross-tenant findUnique', async () => {
    await asyncContext.run(
      {
        userId: user1.id,
        organizationId: org1.id,
        userRole: 'admin',
        sessionId: 'test-session',
      },
      async () => {
        // Try to access client from org2
        const result = await prisma.client.findUnique({
          where: { id: client2.id },
        })

        // Should return null because middleware filters by organizationId
        expect(result).toBeNull()
      }
    )
  })

  it('should automatically inject organizationId on create', async () => {
    await asyncContext.run(
      {
        userId: user1.id,
        organizationId: org1.id,
        userRole: 'admin',
        sessionId: 'test-session',
      },
      async () => {
        const newClient = await prisma.client.create({
          data: {
            businessName: 'Auto Injected Client',
            primaryContactEmail: 'auto@test.com',
            primaryContactName: 'Auto Contact',
            // Note: organizationId NOT provided - should be injected
          },
        })

        expect(newClient.organizationId).toBe(org1.id)

        // Cleanup
        await prisma.client.delete({ where: { id: newClient.id } })
      }
    )
  })

  it('should prevent cross-tenant update', async () => {
    await asyncContext.run(
      {
        userId: user1.id,
        organizationId: org1.id,
        userRole: 'admin',
        sessionId: 'test-session',
      },
      async () => {
        // Try to update client from org2
        await expect(
          prisma.client.update({
            where: { id: client2.id },
            data: { businessName: 'Hacked Name' },
          })
        ).rejects.toThrow()
      }
    )

    // Verify client2 was not updated
    const client = await prisma.client.findUnique({ where: { id: client2.id } })
    expect(client?.businessName).toBe('Client 2')
  })

  it('should prevent cross-tenant delete', async () => {
    await asyncContext.run(
      {
        userId: user1.id,
        organizationId: org1.id,
        userRole: 'admin',
        sessionId: 'test-session',
      },
      async () => {
        // Try to delete client from org2
        await expect(
          prisma.client.delete({
            where: { id: client2.id },
          })
        ).rejects.toThrow()
      }
    )

    // Verify client2 still exists
    const client = await prisma.client.findUnique({ where: { id: client2.id } })
    expect(client).not.toBeNull()
  })

  it('should catch tenant isolation violations in development', async () => {
    // This test only runs in development mode
    if (process.env.NODE_ENV === 'production') return

    // Temporarily bypass middleware to insert cross-tenant data
    const rawPrisma = new PrismaClient()

    await expect(
      asyncContext.run(
        {
          userId: user1.id,
          organizationId: org1.id,
          userRole: 'admin',
          sessionId: 'test-session',
        },
        async () => {
          // This should trigger validation error
          return rawPrisma.client.findMany({})
        }
      )
    ).rejects.toThrow(/SECURITY VIOLATION/)

    await rawPrisma.$disconnect()
  })

  it('should work with tRPC integration', async () => {
    const ctx1 = {
      session: {
        user: {
          id: user1.id,
          organizationId: org1.id,
          role: 'admin',
          email: user1.email,
          name: user1.name,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      prisma,
      userId: user1.id,
      organizationId: org1.id,
    }

    const caller = appRouter.createCaller(ctx1)

    // Should only return org1 clients
    const result = await caller.client.list({})
    expect(result.clients.every(c => c.organizationId === org1.id)).toBe(true)

    // Should not be able to access org2 client
    await expect(caller.client.byId({ id: client2.id })).rejects.toThrow('NOT_FOUND')
  })
})
```

#### Step 1.6: Validation Checklist

- [ ] Async context storage implemented
- [ ] Global Prisma middleware created
- [ ] All tenant-scoped models identified
- [ ] Middleware applied to Prisma client
- [ ] tRPC context updated to set async context
- [ ] Organization status validation added
- [ ] Development-mode validation active
- [ ] All tests passing (10/10)
- [ ] No cross-tenant data leakage
- [ ] Performance impact <5ms per query

---

### FIX 2: Implement Field-Level Encryption (Day 3)

#### PRIORITY: CRITICAL (SOC 2 / GDPR Compliance)
#### RISK: HIGH - PII exposure
#### TIME: 8 hours implementation + 2 hours testing

#### Step 2.1: Create Encryption Service

**File:** `apps/web/src/server/services/encryption.service.ts`

```typescript
import crypto from 'crypto'
import { KeyVaultSecret } from '@azure/keyvault-secrets'
import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'

interface EncryptionConfig {
  algorithm: string
  keyLength: number
  ivLength: number
  authTagLength: number
}

const CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  authTagLength: 16, // 128 bits
}

export class EncryptionService {
  private static keyVaultUrl: string = process.env.AZURE_KEY_VAULT_URL || ''
  private static secretClient: SecretClient | null = null
  private static encryptionKey: Buffer | null = null

  /**
   * Initialize encryption service with Azure Key Vault
   */
  static async initialize(): Promise<void> {
    if (this.encryptionKey) return // Already initialized

    if (process.env.NODE_ENV === 'production') {
      // Production: Use Azure Key Vault
      if (!this.keyVaultUrl) {
        throw new Error('AZURE_KEY_VAULT_URL not configured')
      }

      try {
        const credential = new DefaultAzureCredential()
        this.secretClient = new SecretClient(this.keyVaultUrl, credential)

        const secret = await this.secretClient.getSecret('database-encryption-key')
        if (!secret.value) {
          throw new Error('Encryption key not found in Key Vault')
        }

        this.encryptionKey = Buffer.from(secret.value, 'base64')
      } catch (error) {
        console.error('Failed to initialize encryption from Key Vault:', error)
        throw error
      }
    } else {
      // Development/Test: Use environment variable
      const keyHex = process.env.ENCRYPTION_KEY || this.generateKey()
      this.encryptionKey = Buffer.from(keyHex, 'hex')

      if (!process.env.ENCRYPTION_KEY) {
        console.warn('⚠️  Using generated encryption key. Set ENCRYPTION_KEY in .env for persistence')
        console.warn(`ENCRYPTION_KEY=${keyHex}`)
      }
    }
  }

  /**
   * Generate a new encryption key (for development only)
   */
  private static generateKey(): string {
    return crypto.randomBytes(CONFIG.keyLength).toString('hex')
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(plaintext: string | null): string | null {
    if (!plaintext) return null

    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized')
    }

    try {
      // Generate random IV
      const iv = crypto.randomBytes(CONFIG.ivLength)

      // Create cipher
      const cipher = crypto.createCipheriv(CONFIG.algorithm, this.encryptionKey, iv)

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64')
      encrypted += cipher.final('base64')

      // Get auth tag
      const authTag = cipher.getAuthTag()

      // Combine: version|iv|authTag|ciphertext
      const version = '1' // For future algorithm upgrades
      const combined = `${version}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`

      return combined
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(ciphertext: string | null): string | null {
    if (!ciphertext) return null

    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized')
    }

    try {
      // Split combined format
      const parts = ciphertext.split(':')
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format')
      }

      const [version, ivBase64, authTagBase64, encrypted] = parts

      // Check version
      if (version !== '1') {
        throw new Error(`Unsupported encryption version: ${version}`)
      }

      // Decode components
      const iv = Buffer.from(ivBase64, 'base64')
      const authTag = Buffer.from(authTagBase64, 'base64')

      // Create decipher
      const decipher = crypto.createDecipheriv(CONFIG.algorithm, this.encryptionKey, iv)
      decipher.setAuthTag(authTag)

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'base64', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Hash data (one-way, for searching)
   */
  static hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
  }

  /**
   * Mask sensitive data for display
   */
  static mask(data: string | null, visibleChars: number = 4): string {
    if (!data) return '***'
    if (data.length <= visibleChars) return '***'

    const visible = data.slice(-visibleChars)
    const masked = '*'.repeat(data.length - visibleChars)
    return masked + visible
  }

  /**
   * Rotate encryption key (for key rotation)
   */
  static async rotateKey(newKeyBase64: string): Promise<void> {
    // This would involve:
    // 1. Decrypt all data with old key
    // 2. Re-encrypt with new key
    // 3. Update key in Key Vault
    // Implementation depends on deployment strategy
    throw new Error('Key rotation not implemented - requires maintenance window')
  }
}

// Initialize on module load
EncryptionService.initialize().catch(error => {
  console.error('Failed to initialize encryption service:', error)
  process.exit(1)
})
```

#### Step 2.2: Create Encrypted Field Decorator

**File:** `apps/web/src/server/lib/encrypted-field.ts`

```typescript
import { EncryptionService } from '../services/encryption.service'

/**
 * Encrypt field before saving to database
 */
export function encryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  return EncryptionService.encrypt(value)
}

/**
 * Decrypt field after reading from database
 */
export function decryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  return EncryptionService.decrypt(value)
}

/**
 * Transform object fields
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj }
  for (const field of fields) {
    if (result[field]) {
      result[field] = encryptField(result[field] as string) as any
    }
  }
  return result
}

export function decryptFields<T extends Record<string, any>>(
  obj: T | null,
  fields: (keyof T)[]
): T | null {
  if (!obj) return null
  const result = { ...obj }
  for (const field of fields) {
    if (result[field]) {
      result[field] = decryptField(result[field] as string) as any
    }
  }
  return result
}
```

#### Step 2.3: Update Client Service with Encryption

**File:** `apps/web/src/lib/services/client-service.ts` (Update existing)

```typescript
import { EncryptionService, encryptField, decryptField, decryptFields } from '@/server/services/encryption.service'

// Define sensitive fields that need encryption
const ENCRYPTED_FIELDS = ['taxId', 'bankAccountNumber', 'ssn'] as const

export class ClientService {
  /**
   * Create client with encrypted sensitive fields
   */
  static async createClient(
    data: CreateClientInput,
    organizationId: string,
    userId: string
  ): Promise<Client> {
    // Encrypt sensitive fields before saving
    const encryptedData = {
      ...data,
      taxId: encryptField(data.taxId),
      bankAccountNumber: encryptField(data.bankAccountNumber),
      // Add other sensitive fields as needed
    }

    const client = await prisma.client.create({
      data: {
        ...encryptedData,
        organizationId,
        createdBy: userId,
      },
    })

    // Decrypt for return
    return this.decryptClient(client)
  }

  /**
   * Get client with decrypted fields
   */
  static async getClientById(
    id: string,
    organizationId: string,
    includeRelations: boolean = true
  ): Promise<Client | null> {
    const client = await prisma.client.findFirst({
      where: { id, organizationId },
      include: includeRelations ? {
        documents: true,
        engagements: true,
        invoices: true,
      } : undefined,
    })

    if (!client) return null

    return this.decryptClient(client)
  }

  /**
   * Update client with encryption
   */
  static async updateClient(
    id: string,
    data: UpdateClientInput,
    organizationId: string,
    userId: string
  ): Promise<Client> {
    // Encrypt any sensitive fields being updated
    const encryptedData: any = { ...data }
    if (data.taxId !== undefined) {
      encryptedData.taxId = encryptField(data.taxId)
    }
    if (data.bankAccountNumber !== undefined) {
      encryptedData.bankAccountNumber = encryptField(data.bankAccountNumber)
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...encryptedData,
        updatedBy: userId,
      },
    })

    return this.decryptClient(client)
  }

  /**
   * Decrypt sensitive client fields
   */
  private static decryptClient<T extends Client | Client[]>(client: T): T {
    if (Array.isArray(client)) {
      return client.map(c => this.decryptClientSingle(c)) as T
    }
    return this.decryptClientSingle(client) as T
  }

  private static decryptClientSingle(client: Client): Client {
    return {
      ...client,
      taxId: decryptField(client.taxId),
      bankAccountNumber: decryptField(client.bankAccountNumber),
      // Decrypt other sensitive fields
    }
  }

  /**
   * Get masked client data (for non-authorized users)
   */
  static getMaskedClient(client: Client, userRole: string): Client {
    // Only admins and CPAs can see full sensitive data
    if (['owner', 'admin', 'cpa'].includes(userRole)) {
      return client
    }

    return {
      ...client,
      taxId: client.taxId ? EncryptionService.mask(client.taxId, 4) : null,
      bankAccountNumber: client.bankAccountNumber
        ? EncryptionService.mask(client.bankAccountNumber, 4)
        : null,
    }
  }
}
```

#### Step 2.4: Update Environment Variables

**File:** `.env.example` (Add)

```bash
# Encryption (Development only - use Azure Key Vault in production)
ENCRYPTION_KEY="your-hex-encryption-key-64-characters"

# Azure Key Vault (Production)
AZURE_KEY_VAULT_URL="https://your-keyvault.vault.azure.net/"
```

#### Step 2.5: Testing

**File:** `apps/web/tests/security/encryption.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals'
import { EncryptionService } from '@/server/services/encryption.service'
import { ClientService } from '@/lib/services/client-service'
import { prisma } from '@/server/db'

describe('Field-Level Encryption', () => {
  beforeAll(async () => {
    await EncryptionService.initialize()
  })

  it('should encrypt and decrypt data correctly', () => {
    const plaintext = '123-45-6789'
    const encrypted = EncryptionService.encrypt(plaintext)

    expect(encrypted).not.toBe(plaintext)
    expect(encrypted).toContain(':') // Version:IV:AuthTag:Ciphertext format

    const decrypted = EncryptionService.decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('should store encrypted data in database', async () => {
    const org = await prisma.organization.create({
      data: { name: 'Test Org', subdomain: 'encryption-test' },
    })

    const user = await prisma.user.create({
      data: {
        email: 'encryption@test.com',
        name: 'Test User',
        password: 'hashed',
        role: 'admin',
        organizationId: org.id,
      },
    })

    const client = await ClientService.createClient(
      {
        businessName: 'Encrypted Client',
        primaryContactEmail: 'client@test.com',
        primaryContactName: 'Contact',
        taxId: '12-3456789',
        bankAccountNumber: '1234567890',
        businessType: 'LLC',
        status: 'active',
      },
      org.id,
      user.id
    )

    // Get raw data from database (bypassing service layer)
    const rawClient = await prisma.client.findUnique({
      where: { id: client.id },
    })

    // Verify data is encrypted in database
    expect(rawClient?.taxId).not.toBe('12-3456789')
    expect(rawClient?.taxId).toContain(':') // Encrypted format
    expect(rawClient?.bankAccountNumber).not.toBe('1234567890')

    // Verify service layer returns decrypted data
    expect(client.taxId).toBe('12-3456789')
    expect(client.bankAccountNumber).toBe('1234567890')

    // Cleanup
    await prisma.client.delete({ where: { id: client.id } })
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.organization.delete({ where: { id: org.id } })
  })

  it('should handle null encrypted fields', () => {
    const encrypted = EncryptionService.encrypt(null)
    expect(encrypted).toBeNull()

    const decrypted = EncryptionService.decrypt(null)
    expect(decrypted).toBeNull()
  })

  it('should mask sensitive data correctly', () => {
    const ssn = '123-45-6789'
    const masked = EncryptionService.mask(ssn, 4)

    expect(masked).toBe('*******6789')
    expect(masked).not.toContain('123')
  })

  it('should reject tampered encrypted data', () => {
    const plaintext = 'sensitive data'
    const encrypted = EncryptionService.encrypt(plaintext)!

    // Tamper with encrypted data
    const tampered = encrypted.replace(/.$/, 'X')

    expect(() => EncryptionService.decrypt(tampered)).toThrow()
  })

  it('should encrypt different data to different ciphertexts', () => {
    const data = 'same data'

    const encrypted1 = EncryptionService.encrypt(data)
    const encrypted2 = EncryptionService.encrypt(data)

    // Different IVs should produce different ciphertexts
    expect(encrypted1).not.toBe(encrypted2)

    // But both should decrypt to same plaintext
    expect(EncryptionService.decrypt(encrypted1)).toBe(data)
    expect(EncryptionService.decrypt(encrypted2)).toBe(data)
  })
})
```

#### Step 2.6: Data Migration Script

**File:** `apps/web/scripts/migrate-encrypt-sensitive-data.ts`

```typescript
import { prisma } from '../src/server/db'
import { EncryptionService } from '../src/server/services/encryption.service'

/**
 * Migrate existing plaintext sensitive data to encrypted format
 *
 * ⚠️ CRITICAL: This script modifies production data
 * - Take a full database backup before running
 * - Run during maintenance window
 * - Test on staging environment first
 */

async function migrateEncryptSensitiveData() {
  console.log('🔐 Starting sensitive data encryption migration...')

  await EncryptionService.initialize()

  // Migrate clients
  console.log('📊 Migrating client sensitive data...')
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { taxId: { not: { contains: ':' } } }, // Not encrypted
        { bankAccountNumber: { not: { contains: ':' } } },
      ],
    },
  })

  console.log(`Found ${clients.length} clients with unencrypted data`)

  for (const client of clients) {
    const updates: any = {}

    if (client.taxId && !client.taxId.includes(':')) {
      updates.taxId = EncryptionService.encrypt(client.taxId)
      console.log(`  Encrypted taxId for client ${client.id}`)
    }

    if (client.bankAccountNumber && !client.bankAccountNumber.includes(':')) {
      updates.bankAccountNumber = EncryptionService.encrypt(client.bankAccountNumber)
      console.log(`  Encrypted bankAccountNumber for client ${client.id}`)
    }

    if (Object.keys(updates).length > 0) {
      await prisma.client.update({
        where: { id: client.id },
        data: updates,
      })
    }
  }

  console.log('✅ Migration complete')
  console.log('📝 Verification: Check that sensitive data is no longer readable in database')
}

// Run migration
migrateEncryptSensitiveData()
  .catch(error => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
```

#### Step 2.7: Validation Checklist

- [ ] Encryption service implemented
- [ ] Azure Key Vault integration configured
- [ ] Client service updated with encryption
- [ ] Sensitive fields encrypted (taxId, bankAccountNumber)
- [ ] Decryption transparent to API consumers
- [ ] Data masking implemented for non-authorized users
- [ ] All tests passing (6/6)
- [ ] Migration script tested on staging
- [ ] Production backup taken before migration
- [ ] Encryption keys stored securely

---

### FIX 3: Session Expiration & Token Refresh (Days 4-5)

[Continuing with remaining fixes...]
