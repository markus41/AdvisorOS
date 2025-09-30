# 🚀 FRACTIONAL CFO MARKETPLACE - IMPLEMENTATION ROADMAP

**Status:** Phase 1.2 In Progress (Database Schema Complete ✅)
**Next Milestone:** Core Marketplace APIs (Phase 2.1)
**Timeline:** 16 weeks to MVP Beta Launch
**Last Updated:** 2025-09-30

---

## ✅ COMPLETED: Phase 1.1 - Database Schema Design

### Deliverables Complete:
1. **Enhanced User Model** - 16 role types for marketplace participants
2. **AdvisorProfile Model** - Comprehensive advisor profiles with 50+ fields
3. **ClientPortalAccess Model** - Granular permission system
4. **EngagementRateCard Model** - Flexible pricing configurations
5. **ServiceOffering Model** - Marketplace service catalog with automation tracking
6. **AdvisorMarketplaceMatch Model** - AI-powered matching system
7. **ClientSatisfactionMetric Model** - NPS and ratings tracking
8. **RevenueShare Model** - Commission and payout management
9. **Enhanced Organization Model** - Marketplace configuration
10. **Updated Relations** - All foreign keys and indexes optimized

### Database Schema Statistics:
- **Total Models:** 38 (8 new marketplace models)
- **Total Fields:** 850+
- **Total Indexes:** 180+
- **Multi-Tenant Fields:** organizationId on all models
- **Soft Delete:** deletedAt on all models
- **Audit Fields:** createdAt, updatedAt, createdBy, updatedBy

### Schema Location:
- File: `apps/web/prisma/schema.prisma`
- Status: Validated and formatted ✅
- Lines of Code: 1,624 lines

---

## 🔄 IN PROGRESS: Phase 1.2 - Database Migration & Setup

### Current Tasks:

#### 1. Database Configuration (BLOCKED - Needs DATABASE_URL)
**Action Required:** Configure DATABASE_URL in `.env` file

**Development Environment:**
```bash
# Copy .env.example to .env
cp .env.example .env

# Configure local PostgreSQL (example)
DATABASE_URL="postgresql://postgres:password@localhost:5432/advisoros_dev"

# Or use Azure SQL (production-like)
DATABASE_URL="postgresql://advisoros:PASSWORD@advisoros-dev.postgres.database.azure.com:5432/advisoros?ssl=true"
```

**Production Environment:**
```bash
# Use Azure Key Vault reference
DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://advisoros-vault.vault.azure.net/secrets/database-url/)"
```

#### 2. Run Database Migration
**Once DATABASE_URL is configured:**
```bash
cd apps/web
npx prisma migrate dev --name add_fractional_cfo_marketplace_models
```

**Expected Output:**
- Migration file created: `prisma/migrations/[timestamp]_add_fractional_cfo_marketplace_models/`
- 8 new tables created
- Indexes and foreign keys established
- Migration successful message

#### 3. Generate Prisma Client
```bash
cd apps/web
npx prisma generate
```

**Expected Output:**
- Prisma Client regenerated with new types
- TypeScript types available for:
  - AdvisorProfile
  - ClientPortalAccess
  - EngagementRateCard
  - ServiceOffering
  - AdvisorMarketplaceMatch
  - ClientSatisfactionMetric
  - RevenueShare

---

## 📋 NEXT: Phase 2.1 - Core Marketplace APIs (Week 3)

### Sprint Goal: Build Advisor Profile Management APIs

### API Endpoints to Implement:

#### Advisor Profile Router (`apps/web/src/server/api/routers/advisor.ts`)

```typescript
export const advisorRouter = createTRPCRouter({
  // Profile Management
  createProfile: organizationProcedure
    .input(createAdvisorProfileSchema)
    .mutation(async ({ ctx, input }) => { /* implementation */ }),

  getProfile: organizationProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => { /* implementation */ }),

  updateProfile: organizationProcedure
    .input(updateAdvisorProfileSchema)
    .mutation(async ({ ctx, input }) => { /* implementation */ }),

  uploadCertification: organizationProcedure
    .input(uploadCertificationSchema)
    .mutation(async ({ ctx, input }) => { /* implementation */ }),

  submitForVerification: organizationProcedure
    .mutation(async ({ ctx }) => { /* implementation */ }),

  // Marketplace Listings
  listAvailableAdvisors: publicProcedure
    .input(listAdvisorsSchema)
    .query(async ({ ctx, input }) => { /* implementation */ }),

  searchAdvisors: publicProcedure
    .input(searchAdvisorsSchema)
    .query(async ({ ctx, input }) => { /* implementation */ }),

  getAdvisorPublicProfile: publicProcedure
    .input(z.object({ advisorId: z.string() }))
    .query(async ({ ctx, input }) => { /* implementation */ }),

  // Admin Operations
  approveAdvisor: adminProcedure
    .input(z.object({ advisorId: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => { /* implementation */ }),

  rejectAdvisor: adminProcedure
    .input(z.object({ advisorId: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => { /* implementation */ }),
});
```

### Zod Validation Schemas (`apps/web/src/lib/validations/advisor.ts`)

```typescript
export const createAdvisorProfileSchema = z.object({
  // Professional Information
  professionalTitle: z.string().min(1).max(100),
  yearsExperience: z.number().int().min(0).max(50),
  certifications: z.array(z.enum(['CPA', 'CFA', 'MBA', 'CFE', 'CMA', 'CIA'])),
  licenseNumber: z.string().optional(),
  licenseState: z.string().length(2).optional(),

  // Expertise & Specializations
  industries: z.array(z.string()).min(1).max(10),
  services: z.array(z.string()).min(1).max(15),
  businessSizes: z.array(z.enum(['startup', 'smb', 'mid_market', 'enterprise'])),

  // Capacity & Availability
  maxClients: z.number().int().min(1).max(30).default(15),
  hoursPerWeek: z.number().int().min(5).max(60).optional(),
  timezone: z.string().optional(),

  // Pricing
  hourlyRate: z.number().positive().optional(),
  monthlyRetainerMin: z.number().positive().optional(),
  monthlyRetainerMax: z.number().positive().optional(),
  acceptsHourly: z.boolean().default(true),
  acceptsRetainer: z.boolean().default(true),
  acceptsProject: z.boolean().default(true),

  // Profile Content
  headline: z.string().min(20).max(200),
  bio: z.string().min(100).max(5000),
  linkedinUrl: z.string().url().optional(),
});

export const listAdvisorsSchema = z.object({
  industries: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxHourlyRate: z.number().positive().optional(),
  availability: z.enum(['available', 'limited', 'full']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['rating', 'experience', 'price', 'reviews']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### Service Layer (`apps/web/src/server/services/advisor-profile.service.ts`)

```typescript
export class AdvisorProfileService {
  /**
   * Create a new advisor profile
   */
  static async createProfile(
    userId: string,
    organizationId: string,
    data: CreateAdvisorProfileInput
  ): Promise<AdvisorProfile> {
    // 1. Check if profile already exists
    const existing = await prisma.advisorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Advisor profile already exists',
      });
    }

    // 2. Create profile with pending status
    const profile = await prisma.advisorProfile.create({
      data: {
        userId,
        ...data,
        marketplaceStatus: 'pending',
        isAvailable: false, // Not available until approved
        overallRating: 0,
        totalReviews: 0,
        completedEngagements: 0,
      },
    });

    // 3. Update user isAdvisor flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdvisor: true,
        advisorType: this.inferAdvisorType(data.services),
      },
    });

    // 4. Send notification to admin for review
    await NotificationService.notifyAdminNewAdvisor(profile.id);

    // 5. Log audit trail
    await AuditLogService.log({
      action: 'create',
      entityType: 'advisor_profile',
      entityId: profile.id,
      userId,
      organizationId,
    });

    return profile;
  }

  /**
   * List available advisors with filtering
   */
  static async listAvailable(
    filters: ListAdvisorsInput
  ): Promise<{ advisors: AdvisorProfile[]; total: number; pages: number }> {
    const {
      industries,
      services,
      minRating,
      maxHourlyRate,
      availability,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AdvisorProfileWhereInput = {
      marketplaceStatus: 'active',
      isVerified: true,
      ...(industries && { industries: { hasSome: industries } }),
      ...(services && { services: { hasSome: services } }),
      ...(minRating && { overallRating: { gte: minRating } }),
      ...(maxHourlyRate && { hourlyRate: { lte: maxHourlyRate } }),
      ...(availability === 'available' && {
        currentClients: { lt: prisma.advisorProfile.fields.maxClients },
      }),
    };

    // Execute query
    const [advisors, total] = await Promise.all([
      prisma.advisorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          satisfactionMetrics: {
            where: { isPublished: true },
            take: 3,
            orderBy: { reviewDate: 'desc' },
          },
        },
      }),
      prisma.advisorProfile.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return { advisors, total, pages };
  }

  /**
   * Approve advisor for marketplace
   */
  static async approveAdvisor(
    advisorId: string,
    approvedBy: string,
    notes?: string
  ): Promise<AdvisorProfile> {
    const profile = await prisma.advisorProfile.update({
      where: { id: advisorId },
      data: {
        marketplaceStatus: 'active',
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: approvedBy,
        isAvailable: true,
      },
    });

    // Send approval email
    await EmailService.sendAdvisorApprovalEmail(profile);

    // Log audit
    await AuditLogService.log({
      action: 'approve_advisor',
      entityType: 'advisor_profile',
      entityId: advisorId,
      userId: approvedBy,
      metadata: { notes },
    });

    return profile;
  }

  private static inferAdvisorType(services: string[]): string {
    if (services.includes('cfo_services')) return 'fractional_cfo';
    if (services.includes('controller_services')) return 'controller';
    if (services.includes('bookkeeping')) return 'bookkeeper';
    return 'financial_analyst';
  }

  private static buildOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Prisma.AdvisorProfileOrderByWithRelationInput {
    switch (sortBy) {
      case 'rating':
        return { overallRating: sortOrder };
      case 'experience':
        return { yearsExperience: sortOrder };
      case 'price':
        return { hourlyRate: sortOrder };
      case 'reviews':
        return { totalReviews: sortOrder };
      default:
        return { overallRating: sortOrder };
    }
  }
}
```

### Unit Tests (`apps/web/__tests__/services/advisor-profile.service.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AdvisorProfileService } from '@/server/services/advisor-profile.service';
import { prisma } from '@/server/db';

describe('AdvisorProfileService', () => {
  let testUserId: string;
  let testOrganizationId: string;

  beforeEach(async () => {
    // Create test organization and user
    const org = await prisma.organization.create({
      data: { name: 'Test Org', subdomain: 'test-org-' + Date.now() },
    });
    testOrganizationId = org.id;

    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashed',
        role: 'cpa',
        organizationId: testOrganizationId,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.advisorProfile.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.organization.delete({ where: { id: testOrganizationId } });
  });

  describe('createProfile', () => {
    it('should create a new advisor profile', async () => {
      const profileData = {
        professionalTitle: 'Fractional CFO',
        yearsExperience: 15,
        certifications: ['CPA', 'MBA'],
        industries: ['SaaS', 'Healthcare'],
        services: ['cfo_services', 'financial_planning'],
        businessSizes: ['startup', 'smb'],
        maxClients: 15,
        hourlyRate: 250,
        acceptsHourly: true,
        acceptsRetainer: true,
        headline: 'Experienced CFO specializing in SaaS startups',
        bio: 'With 15 years of experience in financial leadership...',
      };

      const profile = await AdvisorProfileService.createProfile(
        testUserId,
        testOrganizationId,
        profileData
      );

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(testUserId);
      expect(profile.marketplaceStatus).toBe('pending');
      expect(profile.isVerified).toBe(false);
      expect(profile.yearsExperience).toBe(15);
    });

    it('should throw error if profile already exists', async () => {
      // Create first profile
      await AdvisorProfileService.createProfile(testUserId, testOrganizationId, {
        /* minimal data */
      });

      // Attempt to create duplicate
      await expect(
        AdvisorProfileService.createProfile(testUserId, testOrganizationId, {
          /* minimal data */
        })
      ).rejects.toThrow('Advisor profile already exists');
    });
  });

  describe('listAvailable', () => {
    it('should return only active and verified advisors', async () => {
      // Create and approve an advisor
      const profile = await AdvisorProfileService.createProfile(
        testUserId,
        testOrganizationId,
        { /* data */ }
      );

      await AdvisorProfileService.approveAdvisor(profile.id, 'admin-user-id');

      const result = await AdvisorProfileService.listAvailable({
        page: 1,
        limit: 20,
        sortBy: 'rating',
        sortOrder: 'desc',
      });

      expect(result.advisors).toHaveLength(1);
      expect(result.advisors[0].marketplaceStatus).toBe('active');
      expect(result.advisors[0].isVerified).toBe(true);
    });

    it('should filter by industries', async () => {
      // Test industry filtering
    });

    it('should filter by services', async () => {
      // Test service filtering
    });

    it('should filter by rating', async () => {
      // Test rating filtering
    });

    it('should paginate results correctly', async () => {
      // Test pagination
    });
  });
});
```

---

## 📊 PROGRESS TRACKING

### Week 1-2: Database Foundation ✅
- [x] Enhanced user role system
- [x] 8 new marketplace models created
- [x] Schema validated and formatted
- [ ] Migration executed (BLOCKED - needs DATABASE_URL)
- [ ] Prisma Client generated

### Week 3: Backend APIs - Advisor Profile 🔄
- [ ] Zod validation schemas
- [ ] tRPC router implementation
- [ ] Service layer logic
- [ ] Azure Blob Storage integration
- [ ] Background check API integration
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests

### Week 4: Backend APIs - Client Portal
- [ ] Client portal access APIs
- [ ] Permission checking middleware
- [ ] Dashboard aggregation queries
- [ ] Invitation workflow
- [ ] Security audit
- [ ] Security tests

### Week 5: Backend APIs - Marketplace Matching
- [ ] AI matching algorithm
- [ ] Matching API endpoints
- [ ] Proposal workflow
- [ ] Engagement creation
- [ ] Integration tests
- [ ] Performance optimization

### Week 6: Backend APIs - Revenue Tracking
- [ ] Commission calculation engine
- [ ] Stripe integration
- [ ] Payout processing
- [ ] 1099 reporting
- [ ] Financial tests
- [ ] Fraud detection rules

---

## 🚨 BLOCKERS & DEPENDENCIES

### Current Blockers:
1. **DATABASE_URL not configured** - Blocking migration execution
2. **Azure resources not provisioned** - Blocking blob storage integration
3. **Stripe keys not configured** - Blocking payment testing

### Critical Dependencies:
1. Database migration must complete before API development
2. Prisma Client generation needed for TypeScript types
3. Azure Blob Storage needed for document/media uploads
4. Background check service integration (recommend: Checkr)
5. Email service configuration (SendGrid or similar)

---

## 📈 METRICS & TARGETS

### Code Quality Metrics:
- **Test Coverage:** Target 80%+ (currently 0% for new code)
- **Type Safety:** 100% TypeScript strict mode
- **Linting:** 0 ESLint errors/warnings
- **Security:** 0 critical vulnerabilities

### Performance Targets:
- **API Response Time:** p95 <500ms
- **Database Queries:** p95 <100ms
- **Page Load Time:** <3 seconds
- **Time to Interactive:** <5 seconds

### Business Metrics (Post-Launch):
- **Advisor Signups:** 500 in first 90 days
- **Client Registrations:** 2,000 in first 90 days
- **Match Conversion:** 20%+ (matches → engagements)
- **Platform Revenue:** $50K GMV, $10K commission in first 90 days

---

## 📞 NEXT ACTIONS

### For Development Team:
1. **Configure DATABASE_URL** in local `.env` file
2. **Run database migration** once URL is set
3. **Begin implementing Advisor Profile APIs** (Week 3 sprint)
4. **Set up Azure Blob Storage** for media uploads
5. **Configure email service** for notifications

### For DevOps:
1. **Provision Azure resources** (SQL, Blob Storage, OpenAI)
2. **Set up development environment** credentials
3. **Configure CI/CD pipeline** for automated testing
4. **Prepare staging environment** for integration testing

### For Product:
1. **Recruit beta advisors** (target: 50 for initial launch)
2. **Finalize pricing strategy** and commission rates
3. **Prepare onboarding materials** for advisors
4. **Create marketing materials** for advisor recruitment

### For Leadership:
1. **Approve Phase 2 budget** ($400K for 16-week MVP)
2. **Initiate Series A discussions** ($40M target)
3. **Legal review** of advisor agreements and marketplace terms
4. **Insurance requirements** for professional liability

---

## 📚 DOCUMENTATION

### Key Documents:
- [Database Schema](./apps/web/prisma/schema.prisma)
- [Project Plan](./IMPLEMENTATION_ROADMAP.md) ← You are here
- [API Specifications](./docs/api-specs.md) ← To be created
- [Architecture Decisions](./docs/architecture/) ← To be created
- [Testing Strategy](./docs/testing-strategy.md) ← To be created

### Next Documents to Create:
1. API Specifications (OpenAPI/Swagger)
2. Deployment Runbook
3. Security Policies
4. Compliance Documentation
5. User Documentation

---

**Last Updated:** 2025-09-30
**Next Review:** Weekly sprint planning meetings
**Project Manager:** [To be assigned]
**Technical Lead:** [To be assigned]

---

## 🎯 SUCCESS CRITERIA

This implementation will be considered successful when:
- ✅ All 8 marketplace models deployed to production database
- ✅ Core Advisor Profile APIs functional and tested (80%+ coverage)
- ✅ Client Portal APIs secure and performant
- ✅ AI Matching algorithm achieving 80%+ accuracy
- ✅ Revenue tracking and commission calculations validated
- ✅ 50 beta advisors onboarded and approved
- ✅ 100 client registrations with 20+ active engagements
- ✅ Platform generating $10K+ in commission revenue
- ✅ All security audits passed
- ✅ Performance targets met (p95 <500ms API response)

**Target Launch Date:** Week 16 (Beta Launch)
**Full Production Launch:** Week 20 (After beta feedback integration)

---

🚀 **LET'S DISRUPT THE $4.2B FRACTIONAL CFO MARKET!** 🚀