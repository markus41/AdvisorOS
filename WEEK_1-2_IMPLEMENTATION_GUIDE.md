# Week 1-2 Implementation Guide: Security & Foundation

**Status:** Ready for execution (pending DATABASE_URL configuration)

**Timeline:** 2 weeks (80 hours total effort)

**Critical Path:** All subsequent work blocked until Week 2 complete

---

## Prerequisites

### Environment Setup

1. **Configure Database Connection**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and update DATABASE_URL
# Example for local PostgreSQL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/advisoros_dev"

# Example for production Azure PostgreSQL:
DATABASE_URL="postgresql://adminuser:password@advisoros-prod.postgres.database.azure.com:5432/advisoros_prod?sslmode=require"
```

2. **Verify Database Connectivity**

```bash
# Test database connection
npm run dev:test

# Expected output: "✅ Database connection successful"
```

3. **Install Dependencies (if needed)**

```bash
npm install
```

---

## Phase 1.1: Database Migration (Week 1, Days 1-2)

### Task 1: Execute Prisma Migration

**Effort:** 4 hours
**Agent:** database-optimizer
**Priority:** P0 (BLOCKER)

```bash
# Generate Prisma client from updated schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_fractional_cfo_marketplace_models

# Expected output:
# ✅ Migration `20250930_add_fractional_cfo_marketplace_models` applied successfully
# ✅ 8 new tables created
# ✅ User table updated with new fields
# ✅ Organization table updated with marketplace config
```

**Verification:**

```bash
# Open Prisma Studio to verify tables
npx prisma studio

# Check that these tables exist:
# - advisor_profiles
# - client_portal_access
# - engagement_rate_cards
# - service_offerings
# - advisor_marketplace_matches
# - client_satisfaction_metrics
# - revenue_shares
```

**Rollback Plan (if needed):**

```bash
# If migration fails, rollback
npx prisma migrate resolve --rolled-back 20250930_add_fractional_cfo_marketplace_models

# Review errors in console
# Fix schema issues
# Retry migration
```

---

## Phase 1.2: Critical Security Fixes (Week 1, Days 3-5)

### P0 Issue 1: Multi-Tenant Isolation Failures

**Effort:** 12 hours
**Agent:** security-auditor
**Affected Models:** AdvisorProfile, AdvisorMarketplaceMatch, ClientSatisfactionMetric, ServiceOffering, EngagementRateCard

**Problem:**
These 5 models lack direct organizationId fields, creating potential for cross-tenant data leakage.

**Solution:**

#### Step 1: Add organizationId to Models

**File:** `apps/web/prisma/schema.prisma`

```prisma
model AdvisorProfile {
  id             String       @id @default(cuid())
  userId         String       @unique
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ADD THIS FIELD
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // ... rest of fields

  @@index([organizationId])
  @@index([userId, organizationId])
}

model AdvisorMarketplaceMatch {
  id             String       @id @default(cuid())
  clientId       String
  client         Client       @relation(fields: [clientId], references: [id])
  advisorProfileId String
  advisorProfile AdvisorProfile @relation(fields: [advisorProfileId], references: [id])

  // ADD THIS FIELD
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // ... rest of fields

  @@index([organizationId])
  @@index([clientId, organizationId])
  @@index([advisorProfileId, organizationId])
}

model ClientSatisfactionMetric {
  id             String       @id @default(cuid())
  clientId       String
  advisorUserId  String
  advisorUser    User         @relation("RatingAdvisor", fields: [advisorUserId], references: [id])
  advisorProfileId String
  advisorProfile AdvisorProfile @relation(fields: [advisorProfileId], references: [id])

  // ADD THIS FIELD
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // ... rest of fields

  @@index([organizationId])
  @@index([clientId, organizationId])
  @@index([advisorUserId, organizationId])
}

model ServiceOffering {
  id             String       @id @default(cuid())
  name           String
  category       String

  // ADD THIS FIELD
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // ... rest of fields

  @@index([organizationId])
  @@index([category, organizationId])
}

model EngagementRateCard {
  id             String       @id @default(cuid())
  name           String

  // ADD THIS FIELD
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // ... rest of fields

  @@index([organizationId])
}
```

#### Step 2: Create Migration

```bash
npx prisma migrate dev --name add_organization_id_to_marketplace_models
```

#### Step 3: Update Service Layer

**File:** `apps/web/src/server/services/advisorProfile.service.ts`

Update all queries to include organizationId:

```typescript
// BEFORE (VULNERABLE)
const profile = await prisma.advisorProfile.findUnique({
  where: { id: profileId },
});

// AFTER (SECURE)
const profile = await prisma.advisorProfile.findFirst({
  where: {
    id: profileId,
    user: { organizationId }, // Enforce tenant isolation
  },
});
```

Repeat for all service methods in:
- `advisorProfile.service.ts`
- `marketplace.service.ts`
- `clientPortal.service.ts`
- `revenue.service.ts`

#### Step 4: Add Automated Tests

**File:** `apps/web/__tests__/security/multi-tenant-isolation.test.ts`

```typescript
import { prisma } from '@/server/db';
import { AdvisorProfileService } from '@/server/services/advisorProfile.service';

describe('Multi-Tenant Isolation', () => {
  it('should prevent cross-tenant advisor profile access', async () => {
    const org1Id = 'org1';
    const org2Id = 'org2';

    const profile1 = await AdvisorProfileService.createProfile(
      'user1',
      org1Id,
      { /* profile data */ }
    );

    // Attempt to access profile from different organization
    await expect(
      AdvisorProfileService.getProfile(profile1.id, org2Id)
    ).rejects.toThrow('not found');
  });

  it('should prevent cross-tenant marketplace matches', async () => {
    // Similar tests for each model
  });
});
```

Run tests:

```bash
npm run test -- apps/web/__tests__/security/multi-tenant-isolation.test.ts
```

**Acceptance Criteria:**
- ✅ All 5 models have organizationId field
- ✅ All service methods filter by organizationId
- ✅ All tests pass (100% isolation)
- ✅ Zero cross-tenant queries possible

---

### P0 Issue 2: Permission Checking Bottleneck

**Effort:** 8 hours
**Agent:** performance-optimization-specialist
**Problem:** Permission checks add 80ms to every request

**Solution: Implement Redis Caching**

#### Step 1: Install Redis Dependencies (already installed)

Verify in package.json:
```json
{
  "dependencies": {
    "ioredis": "^5.3.2"
  }
}
```

#### Step 2: Create Redis Client

**File:** `apps/web/src/lib/redis.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

export default redis;
```

#### Step 3: Create Permission Cache Service

**File:** `apps/web/src/server/services/permissionCache.service.ts`

```typescript
import redis from '@/lib/redis';
import { PermissionService } from './permission.service';

export class PermissionCacheService {
  private static readonly CACHE_PREFIX = 'permissions:';
  private static readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Get cached permissions or fetch from database
   */
  static async getUserPermissions(
    userId: string,
    organizationId: string,
    resource: string
  ): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}:${organizationId}:${resource}`;

    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Cache miss - fetch from database
      const permissions = await PermissionService.getUserPermissions(
        userId,
        organizationId,
        resource
      );

      // Store in cache
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(permissions));

      return permissions;
    } catch (error) {
      console.error('Permission cache error:', error);
      // Fallback to direct database query
      return await PermissionService.getUserPermissions(
        userId,
        organizationId,
        resource
      );
    }
  }

  /**
   * Invalidate user permissions cache
   */
  static async invalidateUserPermissions(userId: string): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  /**
   * Invalidate organization permissions cache
   */
  static async invalidateOrganizationPermissions(organizationId: string): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}*:${organizationId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

#### Step 4: Update tRPC Middleware

**File:** `apps/web/src/server/api/trpc.ts`

Update permission checking middleware:

```typescript
import { PermissionCacheService } from '@/server/services/permissionCache.service';

const enforcePermission = (permission: string, resource?: string) =>
  t.middleware(async ({ ctx, next, path, type, input }) => {
    if (!ctx.session?.user?.id || !ctx.organizationId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // USE CACHED PERMISSIONS (was 80ms, now <1ms)
    const hasPermission = await PermissionCacheService.getUserPermissions(
      ctx.session.user.id,
      ctx.organizationId,
      resource || path
    );

    if (!hasPermission) {
      // Log and throw as before
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Insufficient permissions: ${permission}`,
      });
    }

    return next({ ctx });
  });
```

#### Step 5: Performance Testing

**File:** `apps/web/__tests__/performance/permission-cache.test.ts`

```typescript
import { PermissionCacheService } from '@/server/services/permissionCache.service';

describe('Permission Cache Performance', () => {
  it('should cache permissions and serve from cache', async () => {
    const userId = 'test-user';
    const orgId = 'test-org';
    const resource = 'client';

    // First call - should hit database
    const start1 = Date.now();
    const perms1 = await PermissionCacheService.getUserPermissions(userId, orgId, resource);
    const duration1 = Date.now() - start1;

    // Second call - should hit cache
    const start2 = Date.now();
    const perms2 = await PermissionCacheService.getUserPermissions(userId, orgId, resource);
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(5); // <5ms from cache
    expect(duration2).toBeLessThan(duration1 / 10); // At least 10x faster
  });
});
```

**Acceptance Criteria:**
- ✅ Redis caching implemented
- ✅ Permission checks <5ms (was 80ms)
- ✅ Cache invalidation working
- ✅ Fallback to database if Redis fails
- ✅ 95%+ cache hit rate

---

### P0 Issue 3: Missing API Authorization Layer

**Effort:** 12 hours
**Agent:** security-auditor
**Problem:** Zero authorization checks on API endpoints

**Solution:**

Already partially implemented! The tRPC middleware in `apps/web/src/server/api/trpc.ts` provides:

- ✅ `publicProcedure` - No auth required
- ✅ `protectedProcedure` - Requires authentication
- ✅ `organizationProcedure` - Requires org membership
- ✅ `adminProcedure` - Requires admin role
- ✅ `createPermissionProcedure` - Requires specific permission

**Action Required:** Audit all 50 marketplace endpoints

#### Step 1: Review Router Authorization

**File:** Check each router for proper procedure usage

```typescript
// ✅ CORRECT - Public marketplace browse
listAvailable: publicProcedure
  .input(listAdvisorsSchema)
  .query(async ({ input }) => { /* ... */ }),

// ✅ CORRECT - Authenticated user access
getMyProfile: organizationProcedure
  .query(async ({ ctx }) => { /* ... */ }),

// ✅ CORRECT - Admin-only operations
approveVerification: adminProcedure
  .input(z.object({ profileId: z.string().cuid() }))
  .mutation(async ({ ctx, input }) => { /* ... */ }),

// ❌ INCORRECT - Should be adminProcedure
processPayment: organizationProcedure // WRONG!
  .input(processPaymentSchema)
  .mutation(async ({ ctx, input }) => { /* ... */ }),
```

#### Step 2: Create Authorization Audit Script

**File:** `apps/web/scripts/audit-authorization.ts`

```typescript
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const routersDir = join(__dirname, '../src/server/api/routers');

// Define expected authorization levels
const authorizationRules = {
  // Public endpoints
  public: [
    'listAvailable',
    'searchAdvisors',
    'getFeaturedAdvisors',
    'compareAdvisors',
    'getProfile', // Public profile view
  ],

  // Requires authentication + organization
  organization: [
    'getMyProfile',
    'updateProfile',
    'setAvailability',
    'uploadVideo',
    'submitForVerification',
    'getStats',
    'respondToMatch',
    // ... all user-level operations
  ],

  // Requires admin role
  admin: [
    'approveVerification',
    'rejectVerification',
    'createManualMatch',
    'createRevenueShare',
    'processAdvisorPayment',
    'bulkCalculateCommissions',
    'getRevenueReport',
    'getOrganizationRevenue',
    'generate1099',
    'getBulk1099Data',
    // ... all admin-only operations
  ],
};

// Read and parse router files
const routers = readdirSync(routersDir)
  .filter(file => file.endsWith('.router.ts'))
  .map(file => {
    const content = readFileSync(join(routersDir, file), 'utf-8');
    return { file, content };
  });

// Check each endpoint
let violations = 0;

routers.forEach(({ file, content }) => {
  console.log(`\n📋 Auditing ${file}...`);

  // Extract procedure definitions
  const procedureRegex = /(\w+):\s+(publicProcedure|protectedProcedure|organizationProcedure|adminProcedure)/g;
  const matches = [...content.matchAll(procedureRegex)];

  matches.forEach(([, endpointName, procedure]) => {
    let expectedProcedure = 'organizationProcedure'; // Default

    if (authorizationRules.public.includes(endpointName)) {
      expectedProcedure = 'publicProcedure';
    } else if (authorizationRules.admin.includes(endpointName)) {
      expectedProcedure = 'adminProcedure';
    }

    if (procedure !== expectedProcedure) {
      console.error(`❌ ${endpointName}: Expected ${expectedProcedure}, got ${procedure}`);
      violations++;
    } else {
      console.log(`✅ ${endpointName}: ${procedure}`);
    }
  });
});

console.log(`\n\n${violations === 0 ? '✅' : '❌'} Authorization audit complete: ${violations} violations`);
process.exit(violations === 0 ? 0 : 1);
```

Run audit:

```bash
npx ts-node apps/web/scripts/audit-authorization.ts
```

#### Step 3: Fix Any Violations

Based on audit results, update router procedures to match expected authorization levels.

**Acceptance Criteria:**
- ✅ All 50 endpoints audited
- ✅ Zero authorization violations
- ✅ Automated audit script in CI/CD
- ✅ Public endpoints clearly documented

---

### P0 Issue 4: Audit Trail for Financial Transactions

**Effort:** 8 hours
**Agent:** audit-trail-perfectionist
**Problem:** Revenue share transactions lack comprehensive audit trails

**Solution:**

Already partially implemented via `createTRPCAuditMiddleware()` in trpc.ts!

#### Step 1: Verify Audit Middleware Coverage

**File:** `apps/web/src/server/api/routers/revenue.router.ts`

Ensure all financial operations use `protectedProcedure` or derivatives (which include audit middleware):

```typescript
// ✅ Audit logging automatic via protectedProcedure chain
createRevenueShare: adminProcedure // extends protectedProcedure
  .input(createRevenueShareSchema)
  .mutation(async ({ ctx, input }) => {
    // Audit log automatically created by middleware
    return await RevenueService.createRevenueShare(ctx.organizationId, input);
  }),
```

#### Step 2: Add Financial Transaction Audit Service

**File:** `apps/web/src/server/services/financialAudit.service.ts`

```typescript
import { prisma } from '@/server/db';

export class FinancialAuditService {
  /**
   * Log financial transaction for compliance
   */
  static async logTransaction(data: {
    transactionType: 'revenue_share_created' | 'payment_processed' | 'payout_sent' | 'commission_calculated';
    amount: number;
    currency: string;
    entityId: string; // revenueShareId, invoiceId, etc.
    userId: string;
    organizationId: string;
    metadata: any;
  }) {
    await prisma.$executeRaw`
      INSERT INTO financial_audit_logs (
        id, transaction_type, amount, currency, entity_id,
        user_id, organization_id, metadata, created_at
      ) VALUES (
        gen_random_uuid(), ${data.transactionType}, ${data.amount},
        ${data.currency}, ${data.entityId}, ${data.userId},
        ${data.organizationId}, ${JSON.stringify(data.metadata)}, NOW()
      )
    `;
  }

  /**
   * Get audit trail for entity
   */
  static async getAuditTrail(entityId: string, organizationId: string) {
    return await prisma.$queryRaw`
      SELECT * FROM financial_audit_logs
      WHERE entity_id = ${entityId}
        AND organization_id = ${organizationId}
      ORDER BY created_at DESC
    `;
  }
}
```

#### Step 3: Add Audit Logging to Revenue Service

**File:** `apps/web/src/server/services/revenue.service.ts`

```typescript
import { FinancialAuditService } from './financialAudit.service';

export class RevenueService {
  static async createRevenueShare(organizationId: string, data: CreateRevenueShareInput) {
    const revenueShare = await prisma.revenueShare.create({ /* ... */ });

    // LOG FINANCIAL TRANSACTION
    await FinancialAuditService.logTransaction({
      transactionType: 'revenue_share_created',
      amount: Number(data.grossRevenue),
      currency: 'USD',
      entityId: revenueShare.id,
      userId: data.advisorId,
      organizationId,
      metadata: {
        engagementId: data.engagementId,
        platformFeePercentage: data.platformFeePercentage,
        periodStart: data.periodStartDate,
        periodEnd: data.periodEndDate,
      },
    });

    return revenueShare;
  }

  static async processAdvisorPayment(/* ... */) {
    // Process payment...

    // LOG PAYOUT
    await FinancialAuditService.logTransaction({
      transactionType: 'payout_sent',
      amount: totalPayout,
      currency: 'USD',
      entityId: paymentReference,
      userId: adminUserId,
      organizationId,
      metadata: {
        revenueShareIds: data.revenueShareIds,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
      },
    });

    return result;
  }
}
```

**Acceptance Criteria:**
- ✅ All financial operations logged
- ✅ Audit trail immutable (append-only)
- ✅ SOX compliance ready
- ✅ Audit reports available for regulators

---

### P0 Issue 5: Field-Level Response Filtering

**Effort:** 6 hours
**Agent:** security-auditor
**Problem:** Sensitive fields exposed in API responses

**Solution:**

Already implemented in services! Example:

```typescript
// AdvisorProfileService.getProfile() already filters sensitive data:
if (!includePrivate) {
  return {
    ...profile,
    stripeAccountId: undefined,
    backgroundCheckStatus: undefined,
    backgroundCheckDate: undefined,
    notes: undefined,
  };
}
```

#### Action Required: Audit All Services

**File:** Create comprehensive test

**File:** `apps/web/__tests__/security/response-filtering.test.ts`

```typescript
describe('Response Filtering', () => {
  it('should not expose sensitive advisor fields in public view', async () => {
    const profile = await AdvisorProfileService.getProfile(profileId, false);

    expect(profile.stripeAccountId).toBeUndefined();
    expect(profile.backgroundCheckStatus).toBeUndefined();
    expect(profile.notes).toBeUndefined();
  });

  it('should expose sensitive fields to authorized users', async () => {
    const profile = await AdvisorProfileService.getProfile(profileId, true);

    expect(profile.stripeAccountId).toBeDefined();
  });
});
```

**Acceptance Criteria:**
- ✅ All sensitive fields filtered in public endpoints
- ✅ Automated tests verify filtering
- ✅ Documentation lists sensitive fields
- ✅ GDPR compliant data access

---

## Phase 1.3: Critical Performance Indexes (Week 1, Day 5)

**Effort:** 8 hours
**Agent:** database-optimizer

### Create Performance Indexes

**File:** `apps/web/prisma/migrations/YYYYMMDD_add_performance_indexes/migration.sql`

```sql
-- Marketplace Browse (Primary Use Case)
CREATE INDEX idx_advisor_profile_marketplace_browse
ON advisor_profiles (
  "marketplaceStatus",
  "isAvailable",
  "overallRating" DESC
) WHERE "deletedAt" IS NULL;

-- Permission Checking (Before Caching)
CREATE INDEX idx_client_portal_access_covering
ON client_portal_access ("userId", "clientId")
INCLUDE ("permissions", "canViewFinancials", "canUploadDocuments")
WHERE "deletedAt" IS NULL AND "isActive" = true;

-- Advisor Search by Industry
CREATE INDEX idx_advisor_profile_industries
ON advisor_profiles USING GIN (industries);

-- Advisor Search by Services
CREATE INDEX idx_advisor_profile_services
ON advisor_profiles USING GIN (services);

-- Advisor Search by Certifications
CREATE INDEX idx_advisor_profile_certifications
ON advisor_profiles USING GIN (certifications);

-- Client Matches Lookup
CREATE INDEX idx_marketplace_match_client_status
ON advisor_marketplace_matches ("clientId", "status", "suggestedAt" DESC)
WHERE "deletedAt" IS NULL;

-- Advisor Matches Lookup
CREATE INDEX idx_marketplace_match_advisor_status
ON advisor_marketplace_matches ("advisorProfileId", "status", "suggestedAt" DESC)
WHERE "deletedAt" IS NULL;

-- Revenue Share by Engagement
CREATE INDEX idx_revenue_share_engagement
ON revenue_shares ("engagementId", "periodStartDate" DESC);

-- Revenue Share by Advisor (for earnings)
CREATE INDEX idx_revenue_share_advisor_status
ON revenue_shares ("advisorId", "status", "periodEndDate" DESC);

-- Revenue Share by Tax Year (for 1099s)
CREATE INDEX idx_revenue_share_tax_year
ON revenue_shares ("taxYear", "tax1099Reportable")
WHERE "tax1099Reportable" = true;

-- Portal Activity by Client
CREATE INDEX idx_portal_access_client_active
ON client_portal_access ("clientId", "isActive")
WHERE "isActive" = true;

-- Advisor Verification Queue
CREATE INDEX idx_advisor_verification_queue
ON advisor_profiles ("marketplaceStatus", "verificationSubmittedAt")
WHERE "marketplaceStatus" = 'under_review';
```

Apply indexes:

```bash
npx prisma migrate dev --name add_performance_indexes
```

### Verify Index Usage

```sql
-- Test marketplace browse query plan
EXPLAIN ANALYZE
SELECT * FROM advisor_profiles
WHERE "marketplaceStatus" = 'active'
  AND "isAvailable" = true
  AND "deletedAt" IS NULL
ORDER BY "overallRating" DESC
LIMIT 20;

-- Should show: Index Scan using idx_advisor_profile_marketplace_browse
```

**Acceptance Criteria:**
- ✅ 15+ indexes created
- ✅ Query performance improved 60-90%
- ✅ Index usage verified with EXPLAIN ANALYZE
- ✅ No negative impact on write performance

---

## Phase 1.4: Integration Testing (Week 2, Days 1-3)

**Effort:** 24 hours
**Agents:** test-suite-developer, security-auditor

### Create Comprehensive Test Suites

#### Unit Tests

**File:** `apps/web/__tests__/services/advisorProfile.service.test.ts`

```typescript
import { AdvisorProfileService } from '@/server/services/advisorProfile.service';

describe('AdvisorProfileService', () => {
  describe('createProfile', () => {
    it('should create advisor profile with organization isolation', async () => {
      const profile = await AdvisorProfileService.createProfile(
        'user1',
        'org1',
        { /* profile data */ }
      );

      expect(profile.user.organizationId).toBe('org1');
    });

    it('should prevent duplicate profiles', async () => {
      await AdvisorProfileService.createProfile('user1', 'org1', {});

      await expect(
        AdvisorProfileService.createProfile('user1', 'org1', {})
      ).rejects.toThrow('already exists');
    });
  });

  describe('listAvailableAdvisors', () => {
    it('should filter by industries', async () => {
      const result = await AdvisorProfileService.listAvailableAdvisors({
        industries: ['SaaS', 'Healthcare'],
        limit: 20,
      });

      result.advisors.forEach(advisor => {
        expect(
          advisor.industries.some(i => ['SaaS', 'Healthcare'].includes(i))
        ).toBe(true);
      });
    });
  });
});
```

#### Integration Tests

**File:** `apps/web/tests/integration/marketplace.test.ts`

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/api/root';

describe('Marketplace Integration', () => {
  let trpc: ReturnType<typeof createTRPCProxyClient<AppRouter>>;

  beforeAll(() => {
    trpc = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/api/trpc',
        }),
      ],
    });
  });

  it('should complete full advisor onboarding flow', async () => {
    // Step 1: Create profile
    const profile = await trpc.advisor.createProfile.mutate({
      professionalTitle: 'Fractional CFO',
      yearsExperience: 15,
      // ... other fields
    });

    expect(profile.marketplaceStatus).toBe('pending');

    // Step 2: Upload video
    await trpc.advisor.uploadVideo.mutate({
      videoUrl: 'https://example.com/video.mp4',
      videoDurationSeconds: 120,
    });

    // Step 3: Submit for verification
    await trpc.advisor.submitForVerification.mutate({
      certificationDocuments: [/* ... */],
      licenseDocuments: [/* ... */],
      backgroundCheckConsent: true,
      termsAccepted: true,
    });

    // Step 4: Admin approval (separate session)
    // ... admin approves ...

    // Step 5: Set availability
    const updated = await trpc.advisor.setAvailability.mutate({
      isAvailable: true,
    });

    expect(updated.isAvailable).toBe(true);
    expect(updated.marketplaceStatus).toBe('active');
  });
});
```

#### E2E Tests

**File:** `apps/web/tests/e2e/marketplace-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Marketplace End-to-End', () => {
  test('client can browse, match, and engage advisor', async ({ page }) => {
    // Step 1: Browse advisors
    await page.goto('/marketplace');
    await page.fill('[data-testid="search-input"]', 'SaaS CFO');
    await page.click('[data-testid="search-button"]');

    await expect(page.locator('[data-testid="advisor-card"]')).toHaveCount(5);

    // Step 2: View advisor profile
    await page.click('[data-testid="advisor-card"]:first-child');
    await expect(page.locator('h1')).toContainText('Fractional CFO');

    // Step 3: Request matching
    await page.click('[data-testid="request-match-button"]');
    await page.fill('[data-testid="needs-form"]', /* fill form */);
    await page.click('[data-testid="submit-needs-button"]');

    await expect(page.locator('[data-testid="match-success"]')).toBeVisible();

    // Step 4: View matches
    await page.goto('/dashboard/matches');
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(3);

    // Step 5: Accept match
    await page.click('[data-testid="match-card"]:first-child [data-testid="accept-button"]');
    await expect(page.locator('[data-testid="engagement-proposal"]')).toBeVisible();
  });
});
```

Run all tests:

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

**Acceptance Criteria:**
- ✅ 80%+ code coverage
- ✅ All critical flows tested
- ✅ Zero failing tests
- ✅ Tests run in CI/CD pipeline

---

## Phase 1.5: Documentation (Week 2, Days 4-5)

**Effort:** 12 hours
**Agent:** docs-writer

### API Documentation

**File:** `apps/web/docs/api/marketplace-api.md`

Document all 50 endpoints with:
- Endpoint path
- HTTP method
- Authorization requirements
- Request schema
- Response schema
- Example usage
- Error codes

### Developer Guide

**File:** `apps/web/docs/marketplace-developer-guide.md`

Include:
- Architecture overview
- Multi-tenant security patterns
- Service layer usage
- Testing guidelines
- Common pitfalls

### Deployment Checklist

**File:** `apps/web/docs/deployment-checklist.md`

Include:
- Environment variables required
- Database migration steps
- Redis setup
- Security configurations
- Monitoring setup

---

## Week 1-2 Completion Checklist

### Security (P0)
- [ ] Multi-tenant isolation added to 5 models
- [ ] Permission caching implemented (<5ms checks)
- [ ] API authorization audited (zero violations)
- [ ] Audit trail logging for financial transactions
- [ ] Response filtering tested and verified

### Performance
- [ ] 15+ database indexes created
- [ ] Query performance improved 60-90%
- [ ] Permission checks <5ms (was 80ms)
- [ ] Redis caching operational

### Testing
- [ ] 80%+ unit test coverage
- [ ] Integration tests passing
- [ ] E2E critical flows tested
- [ ] Security tests passing

### Documentation
- [ ] API documentation complete
- [ ] Developer guide published
- [ ] Deployment checklist ready

### Infrastructure
- [ ] Database migration executed
- [ ] Redis configured and tested
- [ ] Monitoring configured
- [ ] Error tracking setup

---

## Success Metrics

**Week 1-2 Targets:**

- ✅ Zero P0 security vulnerabilities
- ✅ 100% multi-tenant isolation
- ✅ <500ms API p95 latency
- ✅ <80ms database p95 latency
- ✅ 80%+ test coverage
- ✅ Zero production blockers

---

## Next Steps (Week 3-4)

After Week 1-2 completion, proceed to:

1. **Payment Integration** (Stripe Connect)
2. **Email Notifications** (12 templates)
3. **Background Jobs** (Bull queue)
4. **API Rate Limiting**
5. **Frontend Development** begins

---

## Rollback Plan

If critical issues discovered:

```bash
# Rollback database migration
npx prisma migrate resolve --rolled-back <migration_name>

# Revert code changes
git revert <commit_hash>

# Disable Redis caching (fallback to direct DB)
# Set REDIS_ENABLED=false in .env

# Review and fix issues
# Re-test thoroughly
# Re-deploy when ready
```

---

## Support & Escalation

**Technical Issues:**
- Database: database-optimizer agent
- Security: security-auditor agent
- Performance: performance-optimization-specialist agent
- Testing: test-suite-developer agent

**Project Management:**
- Review FRACTIONAL_CFO_MARKETPLACE_PROJECT_PLAN.md
- Check sprint progress in todo list
- Update stakeholders on blockers

---

**Status:** Ready for execution pending DATABASE_URL configuration

**Last Updated:** 2025-09-30