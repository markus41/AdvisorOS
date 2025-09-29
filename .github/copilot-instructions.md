# AdvisorOS - AI-Powered CPA Platform - Comprehensive AI Agent Instructions

AdvisorOS is a **production-ready multi-tenant SaaS platform** for CPAs featuring intelligent automation, client management, and advanced financial analytics. This document provides comprehensive guidance for AI coding agents working on this professional CPA platform.

## 🏗️ Architecture Overview

### **Core Technology Stack**
- **Monorepo**: Turborepo with `apps/web` and shared `packages/` workspaces
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Radix UI + Tremor charts
- **Backend**: tRPC v10 + Prisma v5 + PostgreSQL with strict multi-tenant isolation
- **AI Services**: Azure OpenAI v2.0.0, Form Recognizer v5.0.0, Text Analytics v5.1.0, Cognitive Search v12.1.0
- **Authentication**: NextAuth.js with organization-based multi-tenancy and RBAC
- **Infrastructure**: Azure deployment with Terraform/Bicep IaC
- **Payments**: Stripe integration with multi-tenant billing
- **Cache/Queue**: Redis for session management and background jobs

### **Multi-Tenant Architecture Principles**
- **Organization Isolation**: Every operation scoped to `organizationId`
- **Data Sovereignty**: Complete tenant data separation at database level
- **Subdomain Routing**: `{organization}.advisoros.com` pattern
- **Role-Based Access Control**: Hierarchical permissions system
- **Audit Compliance**: SOX/GAAP compliant audit trails throughout

## 🔒 Critical Multi-Tenant Patterns (MANDATORY)

### **Data Isolation (ABSOLUTE REQUIREMENT)**
Every database query MUST include `organizationId` filtering. **NO EXCEPTIONS.**

```typescript
// ✅ CORRECT: All models include organizationId foreign key
const clients = await ctx.prisma.client.findMany({
  where: { 
    organizationId: ctx.organizationId, // REQUIRED - Never omit this
    status: 'active'
  }
})

// ✅ CORRECT: Use organization-scoped procedures in tRPC
export const organizationProcedure = authenticatedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.organizationId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Organization context required'
    })
  }
  return next({ 
    ctx: { 
      ...ctx, 
      organizationId: ctx.session.user.organizationId 
    }
  })
})

// ❌ NEVER DO THIS: Cross-tenant queries
const allClients = await ctx.prisma.client.findMany() // SECURITY VIOLATION

// ✅ CORRECT: Proper tenant-scoped aggregations
const stats = await ctx.prisma.client.aggregate({
  where: { organizationId: ctx.organizationId },
  _count: { id: true },
  _avg: { monthlyRevenue: true }
})
```

### **Tenant Resolution & Security**
- **Subdomain Routing**: `acme.advisoros.com` → Organization lookup via middleware
- **Session Context**: All sessions include `organizationId` for request validation
- **Route Protection**: Middleware validates organization membership on all protected routes
- **API Security**: All tRPC procedures validate organization access before execution

### **Role-Based Access Control (RBAC)**
**Hierarchy**: `owner` > `admin` > `cpa` > `staff` > `client`

```typescript
// Permission validation in all sensitive operations
const hasPermission = await PermissionService.checkUserPermission(
  userId, 
  organizationId, 
  'clients:read' // Format: resource:action
)

if (!hasPermission) {
  throw new TRPCError({ code: 'FORBIDDEN' })
}

// Common permission patterns for CPA workflows
const PERMISSIONS = {
  'clients:read': ['owner', 'admin', 'cpa', 'staff'],
  'clients:write': ['owner', 'admin', 'cpa'],
  'clients:delete': ['owner', 'admin'],
  'financials:read': ['owner', 'admin', 'cpa'],
  'financials:write': ['owner', 'admin', 'cpa'],
  'reports:generate': ['owner', 'admin', 'cpa'],
  'settings:manage': ['owner', 'admin'],
  'billing:access': ['owner', 'admin']
}
```

## ⚡ Development Workflows & Commands

### **Essential Development Commands**
```bash
# 🚀 Development Setup & Startup
npm run dev              # Start all apps with Turbo (Next.js + tRPC + Prisma)
npm run dev:setup-db     # Complete database setup with sample data
npm run dev:clean        # Clean all build artifacts and node_modules
npm run dev:reset        # Reset entire development environment

# 🗄️ Database Operations
npm run db:push          # Apply schema changes to development DB
npm run db:migrate       # Create and apply migrations  
npm run db:studio        # Open Prisma Studio for data inspection
npm run db:seed          # Seed database with CPA-specific test data
npm run db:reset         # Reset database to clean state

# 🧪 Testing & Quality
npm run test:unit        # Jest unit tests for services and utilities
npm run test:integration # API integration tests with tenant isolation
npm run test:e2e         # Playwright E2E tests for full user workflows
npm run test:all         # Complete test suite including performance
npm run test:security    # Cross-tenant access prevention validation
npm run lint            # ESLint + TypeScript checking
npm run type-check      # TypeScript compilation check

# 📦 Build & Deployment
npm run build           # Production build for all apps and packages
npm run build:analyze   # Bundle analysis for performance optimization
npm run preview         # Preview production build locally
```

### **CPA-Specific Development Patterns**

#### **Creating New Features (Multi-Tenant Safe)**
```typescript
// 1. Database Schema (packages/database/schema.prisma)
model TaxCalculation {
  id             String   @id @default(cuid())
  organizationId String   // REQUIRED for all models
  clientId       String
  taxYear        Int
  
  // Relationships with proper tenant isolation
  organization   Organization @relation(fields: [organizationId], references: [id])
  client         Client       @relation(fields: [clientId], references: [id])
  
  @@index([organizationId, taxYear]) // Performance optimization
  @@map("tax_calculations")
}

// 2. tRPC Router (apps/web/src/server/api/routers/tax.ts)
export const taxRouter = createTRPCRouter({
  calculate: organizationProcedure
    .input(z.object({
      clientId: z.string(),
      taxYear: z.number(),
      income: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify client belongs to organization
      const client = await ctx.prisma.client.findFirst({
        where: {
          id: input.clientId,
          organizationId: ctx.organizationId // Critical security check
        }
      })
      
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' })
      }
      
      // Perform tax calculation with audit trail
      return await TaxCalculationService.calculate({
        ...input,
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id
      })
    })
})

// 3. Service Layer (apps/web/src/server/services/tax-calculation.service.ts)
export class TaxCalculationService {
  static async calculate(params: {
    clientId: string
    organizationId: string
    userId: string
    taxYear: number
    income: number
  }) {
    // All business logic includes organization isolation
    // Comprehensive audit logging for compliance
    // Error handling with proper user feedback
  }
}
```

#### **Frontend Component Patterns**
```typescript
// Multi-tenant aware React components
export function ClientTaxCalculator({ clientId }: { clientId: string }) {
  // Organization context automatically available through auth
  const { data: calculation, mutate: calculate } = api.tax.calculate.useMutation()
  
  // Error handling specific to multi-tenant scenarios
  // Proper loading states for CPA workflows
  // Accessibility compliance for professional users
}
```

### **Critical File Structure & Patterns**
```
AdvisorOS/
├── apps/
│   └── web/                          # Main Next.js application
│       ├── src/
│       │   ├── app/                  # Next.js 15 App Router
│       │   │   ├── api/             # REST API endpoints (minimal, prefer tRPC)
│       │   │   ├── (auth)/          # Authentication layouts
│       │   │   ├── [org]/           # Organization-scoped routes
│       │   │   └── globals.css      # Global styles with Tailwind
│       │   ├── components/          # React components
│       │   │   ├── ui/              # Radix UI + custom components
│       │   │   ├── forms/           # Form components with validation
│       │   │   ├── charts/          # Tremor financial charts
│       │   │   └── layouts/         # Layout components
│       │   ├── server/              # Server-side code
│       │   │   ├── api/             # tRPC routers and procedures
│       │   │   │   ├── root.ts      # Main router aggregation
│       │   │   │   ├── trpc.ts      # tRPC configuration with organization middleware
│       │   │   │   └── routers/     # Feature-specific routers
│       │   │   │       ├── client.ts    # Client management
│       │   │   │       ├── tax.ts       # Tax calculations
│       │   │   │       ├── document.ts  # Document processing
│       │   │   │       └── analytics.ts # Financial analytics
│       │   │   ├── services/        # Business logic services
│       │   │   │   ├── client.service.ts
│       │   │   │   ├── tax-calculation.service.ts
│       │   │   │   ├── document-processing.service.ts
│       │   │   │   ├── permission.service.ts
│       │   │   │   └── audit-trail.service.ts
│       │   │   └── middleware/      # Custom middleware
│       │   │       ├── auth.middleware.ts
│       │   │       ├── organization.middleware.ts
│       │   │       └── rate-limiting.middleware.ts
│       │   ├── types/               # App-specific TypeScript types
│       │   └── utils/               # Utility functions
├── packages/
│   ├── database/                    # Prisma schema and migrations
│   │   ├── schema.prisma           # Complete multi-tenant schema
│   │   ├── migrations/             # Database migration history
│   │   └── seed.ts                 # Development data seeding
│   ├── ui/                         # Shared UI component library
│   ├── types/                      # Shared TypeScript definitions
│   │   ├── auth.ts                # Authentication types
│   │   ├── organization.ts        # Multi-tenant types
│   │   └── cpa-workflows.ts       # CPA-specific types
│   ├── integrations/               # External service integrations
│   │   ├── quickbooks/            # QuickBooks Online integration
│   │   ├── stripe/                # Payment processing
│   │   └── azure-ai/              # Azure AI services
│   └── shared/                     # Common utilities and configurations
└── infrastructure/                 # Terraform/Bicep IaC
    ├── azure/                     # Azure-specific resources
    └── environments/              # Environment configurations
```

### **Organization-Scoped Routing Pattern**
```typescript
// apps/web/src/app/[org]/layout.tsx - Organization context provider
export default async function OrganizationLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { org: string }
}) {
  // Validate organization access and set context
  const organization = await getOrganizationBySlug(params.org)
  
  return (
    <OrganizationProvider organization={organization}>
      {children}
    </OrganizationProvider>
  )
}

// apps/web/src/app/[org]/clients/page.tsx - Tenant-aware page
export default function ClientsPage({ params }: { params: { org: string } }) {
  // All data automatically scoped to organization
  const { data: clients } = api.client.list.useQuery()
  // clients are already filtered by organizationId in tRPC procedure
}
```

## 🔐 Security & Performance Essentials

### **Rate Limiting (Production-Critical)**
```typescript
// middleware/rate-limiting.middleware.ts
export class RateLimitService {
  constructor(private redis: Redis) {}
  
  async checkEndpointRateLimit(
    endpoint: string, 
    organizationId: string, 
    userId: string
  ): Promise<boolean> {
    // Tier-based limits per organization subscription
    const orgTier = await this.getOrganizationTier(organizationId)
    const limit = RATE_LIMITS[orgTier][endpoint]
    
    // Implement sliding window with Redis
    const key = `rate_limit:${organizationId}:${userId}:${endpoint}`
    return await this.slidingWindowCheck(key, limit)
  }
}

// Usage in tRPC procedures
export const rateLimitedProcedure = organizationProcedure.use(async ({ ctx, next }) => {
  const allowed = await rateLimitService.checkEndpointRateLimit(
    ctx.path, 
    ctx.organizationId, 
    ctx.session.user.id
  )
  
  if (!allowed) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' })
  }
  
  return next()
})
```

### **Advanced RBAC Implementation**
```typescript
// server/services/permission.service.ts
export class PermissionService {
  static async checkUserPermission(
    userId: string,
    organizationId: string,
    permission: string
  ): Promise<boolean> {
    // Get user's role within the organization
    const userRole = await prisma.organizationMember.findFirst({
      where: { userId, organizationId },
      select: { role: true }
    })
    
    if (!userRole) return false
    
    // Check if role has permission
    return PERMISSIONS[permission]?.includes(userRole.role) ?? false
  }
  
  // Resource-specific permission checking
  static async checkResourceAccess(
    userId: string,
    organizationId: string,
    resourceType: 'client' | 'document' | 'report',
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    // Verify resource belongs to organization
    const resource = await this.getResource(resourceType, resourceId)
    if (resource?.organizationId !== organizationId) return false
    
    // Check user permission for action
    return this.checkUserPermission(userId, organizationId, `${resourceType}:${action}`)
  }
}
```

### **Database Performance Optimization**
```typescript
// All tenant queries use optimized composite indexes
// packages/database/schema.prisma

model Client {
  id             String @id @default(cuid())
  organizationId String
  name           String
  email          String
  
  // Multi-tenant optimized indexes
  @@index([organizationId, email]) // Fast client lookup
  @@index([organizationId, createdAt]) // Paginated queries
  @@index([organizationId, status, updatedAt]) // Status filtering
}

// Prisma middleware for automatic organization filtering
prisma.$use(async (params, next) => {
  // Only apply to models with organizationId
  if (hasOrganizationId(params.model)) {
    // Automatically add organizationId to all where clauses
    if (params.action === 'findMany' || params.action === 'findFirst') {
      if (params.args.where) {
        if (!params.args.where.organizationId) {
          throw new Error('Organization context required for database queries')
        }
      }
    }
  }
  
  return next(params)
})

// Connection pooling configuration for multi-tenant workloads
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  },
  log: ['query', 'error'],
  // Optimized for multi-tenant usage patterns
  connectionLimitTimeout: 30000,
  maxConnections: 20,
  poolTimeout: 10000
})
```

## 🤖 AI Integration & Azure Services

### **Azure AI Services Implementation**
```typescript
// packages/integrations/azure-ai/form-recognizer.service.ts
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer'

export class FormRecognizerService {
  private client: DocumentAnalysisClient
  
  constructor() {
    this.client = new DocumentAnalysisClient(
      AZURE_FORM_RECOGNIZER_ENDPOINT,
      new AzureKeyCredential(AZURE_FORM_RECOGNIZER_KEY)
    )
  }
  
  async processFinancialDocument(
    documentBuffer: Buffer,
    organizationId: string,
    userId: string
  ): Promise<ProcessedDocument> {
    // Process with financial document model
    const poller = await this.client.beginAnalyzeDocument(
      'prebuilt-invoice', // or custom CPA model
      documentBuffer
    )
    
    const result = await poller.pollUntilDone()
    
    // Extract financial data with audit trail
    const extractedData = this.extractFinancialData(result)
    
    // Store with organization isolation
    return await this.storeProcessedDocument({
      ...extractedData,
      organizationId,
      processedBy: userId,
      auditTrail: this.generateAuditTrail(result)
    })
  }
}

// packages/integrations/azure-ai/openai.service.ts
import { OpenAIClient } from '@azure/openai'

export class CpaAiService {
  private client: OpenAIClient
  
  async generateTaxSummary(
    clientData: ClientFinancialData,
    organizationId: string
  ): Promise<TaxSummary> {
    // Ensure data belongs to organization
    if (clientData.organizationId !== organizationId) {
      throw new Error('Cross-tenant access denied')
    }
    
    const response = await this.client.getChatCompletions(
      'gpt-4', // CPA-optimized deployment
      [
        {
          role: 'system',
          content: `You are a professional CPA assistant. Generate accurate tax summaries following current IRS guidelines. Always include proper disclaimers.`
        },
        {
          role: 'user', 
          content: `Generate tax summary for client: ${JSON.stringify(clientData)}`
        }
      ],
      {
        temperature: 0.1, // Low temperature for accuracy
        maxTokens: 2000
      }
    )
    
    // Audit AI usage for compliance
    await this.logAiUsage({
      organizationId,
      operation: 'tax_summary_generation',
      inputTokens: response.usage?.promptTokens,
      outputTokens: response.usage?.completionTokens,
      cost: this.calculateCost(response.usage)
    })
    
    return this.parseTaxSummary(response.choices[0].message.content)
  }
}
```

### **Text Analytics for CPA Workflows**
```typescript
// packages/integrations/azure-ai/text-analytics.service.ts
export class TextAnalyticsService {
  async analyzeCommunication(
    messages: ClientMessage[],
    organizationId: string
  ): Promise<CommunicationInsights> {
    // Batch analysis for efficiency
    const documents = messages.map(msg => ({
      id: msg.id,
      text: msg.content,
      language: 'en'
    }))
    
    const [sentiment, keyPhrases, entities] = await Promise.all([
      this.client.analyzeSentiment(documents),
      this.client.extractKeyPhrases(documents), 
      this.client.recognizeEntities(documents)
    ])
    
    // Generate CPA-specific insights
    return {
      clientSatisfaction: this.calculateSatisfactionScore(sentiment),
      urgentTopics: this.identifyUrgentMatters(keyPhrases, entities),
      complianceRisks: this.detectComplianceLanguage(entities),
      followUpActions: this.suggestFollowUps(sentiment, keyPhrases)
    }
  }
}
```

### **Cognitive Search for CPA Knowledge Base**
```typescript
// packages/integrations/azure-ai/search.service.ts
export class CpaSearchService {
  async searchTaxCodes(
    query: string,
    taxYear: number,
    organizationId: string
  ): Promise<TaxCodeSearchResults> {
    const searchResults = await this.searchClient.search(query, {
      filter: `taxYear eq ${taxYear} and organizationId eq '${organizationId}'`,
      facets: ['category', 'jurisdiction', 'effectiveDate'],
      highlight: ['content', 'summary'],
      top: 20
    })
    
    return {
      results: searchResults.results.map(this.formatTaxCodeResult),
      facets: this.processFacets(searchResults.facets),
      totalCount: searchResults.count
    }
  }
}
```

## 🧪 Comprehensive Testing Strategy

### **Multi-Tenant Testing Patterns**
```typescript
// tests/integration/multi-tenant.test.ts
describe('Multi-Tenant Security', () => {
  test('prevents cross-organization data access', async () => {
    const org1 = await createTestOrganization()
    const org2 = await createTestOrganization()
    
    const client1 = await createTestClient(org1.id)
    const user2 = await createTestUser(org2.id)
    
    // Attempt cross-tenant access
    const response = await request(app)
      .get(`/api/clients/${client1.id}`)
      .set('Authorization', `Bearer ${user2.token}`)
    
    expect(response.status).toBe(403)
    expect(response.body.error).toContain('Organization access denied')
  })
  
  test('database queries include organization filtering', async () => {
    const mockPrisma = jest.mocked(prisma)
    const org = await createTestOrganization()
    
    await clientService.getClients(org.id, userId)
    
    expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
      where: { organizationId: org.id },
      // ... other params
    })
  })
})

// tests/e2e/cpa-workflows.spec.ts
test.describe('CPA Workflow E2E', () => {
  test('complete tax calculation workflow', async ({ page }) => {
    // Login as CPA user
    await page.goto('/login')
    await loginAsCpa(page, 'test-org')
    
    // Navigate to tax calculations
    await page.click('[data-testid="tax-calculations"]')
    
    // Create new calculation
    await page.click('[data-testid="new-calculation"]')
    await page.fill('[data-testid="client-select"]', 'Test Client')
    await page.fill('[data-testid="tax-year"]', '2024')
    await page.fill('[data-testid="income"]', '75000')
    
    // Submit and verify
    await page.click('[data-testid="calculate"]')
    await expect(page.locator('[data-testid="tax-result"]')).toBeVisible()
    
    // Verify audit trail creation
    const auditLogs = await page.locator('[data-testid="audit-log"]')
    await expect(auditLogs).toContainText('Tax calculation performed')
  })
})
```

### **Performance Testing for Multi-Tenant Workloads**
```typescript
// tests/performance/multi-tenant-load.test.ts
describe('Multi-Tenant Performance', () => {
  test('handles concurrent organization requests', async () => {
    const organizations = await createTestOrganizations(10)
    const requests = organizations.map(org => 
      measureResponseTime(() => 
        api.client.list.query({}, { 
          context: { organizationId: org.id } 
        })
      )
    )
    
    const results = await Promise.all(requests)
    
    // Assert performance requirements
    results.forEach(time => {
      expect(time).toBeLessThan(500) // 500ms SLA
    })
  })
  
  test('database connection pooling efficiency', async () => {
    const concurrentQueries = Array(50).fill(null).map(() => 
      prisma.client.findMany({ 
        where: { organizationId: testOrgId } 
      })
    )
    
    const startTime = Date.now()
    await Promise.all(concurrentQueries)
    const duration = Date.now() - startTime
    
    expect(duration).toBeLessThan(2000) // 2s for 50 queries
  })
})
```

### **Security Testing & Compliance Validation**
```typescript
// tests/security/compliance.test.ts
describe('SOX Compliance', () => {
  test('all financial operations create audit trails', async () => {
    const client = await createTestClient(testOrgId)
    const user = await createTestUser(testOrgId, 'cpa')
    
    // Perform financial operation
    await taxCalculationService.calculate({
      clientId: client.id,
      organizationId: testOrgId,
      userId: user.id,
      taxYear: 2024,
      income: 50000
    })
    
    // Verify audit trail
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        organizationId: testOrgId,
        action: 'TAX_CALCULATION',
        resourceId: client.id
      }
    })
    
    expect(auditRecord).toBeTruthy()
    expect(auditRecord.userId).toBe(user.id)
    expect(auditRecord.metadata).toContain('income')
  })
  
  test('role-based access control enforcement', async () => {
    const staffUser = await createTestUser(testOrgId, 'staff')
    const billingOperation = () => 
      billingService.updateSubscription(testOrgId, staffUser.id)
    
    await expect(billingOperation).rejects.toThrow('Insufficient permissions')
  })
})

// tests/security/penetration.test.ts
describe('Security Penetration Tests', () => {
  test('SQL injection prevention', async () => {
    const maliciousInput = "'; DROP TABLE clients; --"
    
    const response = await request(app)
      .get(`/api/clients?search=${encodeURIComponent(maliciousInput)}`)
      .set('Authorization', `Bearer ${validToken}`)
    
    expect(response.status).not.toBe(500)
    // Verify database integrity
    const clientCount = await prisma.client.count()
    expect(clientCount).toBeGreaterThan(0)
  })
  
  test('cross-site scripting (XSS) prevention', async () => {
    const xssPayload = '<script>alert("xss")</script>'
    
    const response = await request(app)
      .post('/api/clients')
      .send({ 
        name: xssPayload,
        organizationId: testOrgId 
      })
      .set('Authorization', `Bearer ${validToken}`)
    
    expect(response.body.name).not.toContain('<script>')
    expect(response.body.name).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
  })
})
```

### **AI Service Testing**
```typescript
// tests/integration/ai-services.test.ts
describe('Azure AI Integration', () => {
  test('document processing with proper organization isolation', async () => {
    const testDocument = await createTestInvoice()
    const org1 = await createTestOrganization()
    const org2 = await createTestOrganization()
    
    // Process document for org1
    const result1 = await formRecognizerService.processDocument(
      testDocument, 
      org1.id, 
      'user1'
    )
    
    // Verify org2 cannot access processed document
    const unauthorizedAccess = () => 
      documentService.getProcessedDocument(result1.id, org2.id)
    
    await expect(unauthorizedAccess).rejects.toThrow('Document not found')
  })
  
  test('AI cost tracking per organization', async () => {
    const initialCost = await aiUsageService.getCurrentCost(testOrgId)
    
    await cpaAiService.generateTaxSummary(testClientData, testOrgId)
    
    const finalCost = await aiUsageService.getCurrentCost(testOrgId)
    expect(finalCost).toBeGreaterThan(initialCost)
    
    const usage = await aiUsageService.getUsageDetails(testOrgId)
    expect(usage.operations).toContainEqual(
      expect.objectContaining({
        operation: 'tax_summary_generation',
        cost: expect.any(Number)
      })
    )
  })
})
```

## 🤖 AI Agent Development Guidelines

### **Best Practices for AdvisorOS Development**

#### **Multi-Tenant Awareness (CRITICAL)**
- **Always verify organization context** before any database operation
- **Never assume single-tenant patterns** - every query must be organization-scoped
- **Validate cross-references** - ensure related entities belong to the same organization
- **Implement defense in depth** - multiple layers of tenant validation

#### **CPA-Specific Considerations**
- **Regulatory Compliance**: All features must consider SOX, GAAP, and tax regulations
- **Audit Trails**: Every financial operation requires comprehensive logging
- **Data Precision**: Use proper decimal handling for financial calculations
- **Professional Standards**: UI/UX must meet professional CPA expectations

#### **Code Quality Standards**
```typescript
// ✅ GOOD: Comprehensive error handling with audit logging
try {
  const result = await taxCalculationService.calculate(params)
  await auditLogger.log({
    action: 'TAX_CALCULATION_SUCCESS',
    organizationId: params.organizationId,
    userId: params.userId,
    details: { taxYear: params.taxYear, amount: result.totalTax }
  })
  return result
} catch (error) {
  await auditLogger.log({
    action: 'TAX_CALCULATION_ERROR',
    organizationId: params.organizationId,
    userId: params.userId,
    error: error.message
  })
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Tax calculation failed',
    cause: error
  })
}

// ❌ BAD: No audit trail, poor error handling
const result = await taxCalculationService.calculate(params)
return result
```

#### **Performance Optimization Guidelines**
- **Database Queries**: Always use composite indexes starting with `organizationId`
- **Caching Strategy**: Cache data per organization to prevent cross-tenant pollution
- **API Optimization**: Implement proper pagination for large datasets
- **Memory Management**: Clean up resources in long-running processes

#### **Security Implementation Checklist**
- [ ] All database models include `organizationId` foreign key
- [ ] All API endpoints validate organization membership
- [ ] All file uploads are scoped to organization storage
- [ ] All email communications include organization context
- [ ] All scheduled jobs respect organization boundaries
- [ ] All error messages don't leak cross-tenant information

### **Development Workflow Integration**

#### **MCP Ecosystem Usage**
The AdvisorOS project includes a comprehensive MCP (Model Context Protocol) ecosystem for AI-powered development:

```bash
# Start AI-enhanced development session
claude --mcp-config .claude/working-config.json

# Example AI-assisted development queries:
# "Implement a new client tax filing workflow with organization isolation"
# "Review the database schema for multi-tenant security vulnerabilities"  
# "Optimize the tRPC API performance for CPA-specific operations"
# "Generate comprehensive tests for the financial calculation service"
```

#### **AI-Powered Code Reviews**
- Use AI assistance for multi-tenant security reviews
- Automated compliance checking for financial operations
- Performance optimization suggestions for CPA workflows
- Test generation for complex business logic

### **Emergency Response Protocols**

#### **Security Incident Response**
1. **Immediate Isolation**: Disable affected organization access
2. **Audit Review**: Check all related audit logs for scope
3. **Data Verification**: Ensure no cross-tenant data exposure
4. **Compliance Notification**: Follow SOX reporting requirements
5. **Recovery Planning**: Restore service with enhanced monitoring

#### **Performance Degradation Response**
1. **Organization Impact Assessment**: Identify affected tenants
2. **Database Query Analysis**: Review slow query logs
3. **Connection Pool Monitoring**: Check for resource exhaustion
4. **Scaling Decision**: Horizontal vs vertical scaling based on tenant load
5. **Communication Protocol**: Notify affected organizations with SLA updates

---

## 🚀 Supercharged AI Architecture

AdvisorOS features a comprehensive, supercharged AI copilot system that transforms static assistants into intelligent, context-aware agents with advanced reasoning capabilities.

```
/apps/web/src/lib/ai/
├── /modes               # Context-aware AI operating modes
├── /agents              # Specialized AI agent orchestration  
├── /prompts             # Chain-of-thought reasoning prompts
├── /mcp                 # Model Context Protocol integration
├── /workflows           # Automated multi-step AI workflows
└── /supercharged.ts     # Unified AI orchestration system
```

## AI Capabilities

### 🧠 AI Modes (Context-Aware Operation)

**CPA Professional Modes:**
- **CPA Professional Mode**: General advisory and client management
- **Tax Season Mode**: Tax prep, compliance, deadline management (auto-activates Jan-Apr)
- **Audit Mode**: Audit preparation and risk assessment
- **Client Portal Mode**: Client-facing self-service
- **Year-End Mode**: Year-end closing and planning (auto-activates Nov-Jan)

**Developer-Focused Modes:**
- **Developer Mode**: Advanced development assistance with code generation and debugging
- **Code Review Mode**: Comprehensive code review with security and performance analysis
- **DevOps Mode**: Infrastructure management, CI/CD, and deployment optimization

### 🤖 AI Agents (Specialized Expertise)

**CPA Domain Agents:**
- **Senior CPA Advisor**: Primary business advisory agent with 20+ years expertise
- **Tax Specialist**: Expert in tax matters and optimization
- **Client Relationship Manager**: Communication and relationship building
- **Document Analyzer**: Document processing and data extraction
- **Financial Analyst**: Financial data analysis and modeling

**Development Domain Agents:**
- **Senior Developer**: Full-stack development and architecture expertise
- **Code Reviewer**: Code quality, security, and performance specialist
- **Testing Specialist**: Test automation and quality assurance
- **DevOps Engineer**: Infrastructure and deployment specialist
- **UI/UX Designer**: User interface and experience optimization

### 🧩 Chain-of-Thought Prompts (Advanced Reasoning)

**CPA Analysis Prompts:**
- **Financial Health Analysis**: 7-step comprehensive assessment process
- **Tax Optimization Strategy**: 9-step strategic tax planning with compliance
- **Business Advisory Consultation**: 8-step strategic business consulting
- **Client Communication**: 7-step professional communication with emotional intelligence

**Developer Analysis Prompts:**
- **Code Generation**: Systematic code generation with architecture planning
- **Code Review Analysis**: Comprehensive code review with security and performance
- **Debugging Analysis**: Systematic debugging with root cause analysis
- **Performance Optimization**: Strategic performance analysis and improvement

### 🔧 MCP Tools (External Integrations)

**CPA Professional Tools:**
- **QuickBooks Integration**: Access financial data and reports
- **Financial Calculator**: Advanced financial calculations and ratios
- **Tax Research**: Current tax laws and compliance requirements
- **Industry Benchmarks**: Comparative industry data
- **Document OCR**: Automated document processing
- **Email Communication**: Professional email automation

**Developer Tools:**
- **Code Analyzer**: Code quality, complexity, and security analysis
- **Git Integration**: Repository analysis and development insights
- **Test Runner**: Automated testing and coverage analysis
- **Bundle Analyzer**: JavaScript bundle optimization
- **TypeScript Checker**: Type validation and improvements
- **Performance Profiler**: Application performance analysis
- **Docker Tools**: Container optimization and security scanning

### 🔄 AI Workflows (Automated Processes)

**CPA Workflows:**
- **Client Financial Health Review**: Complete financial assessment (7 steps, 5 min, $2.50)
- **Tax Optimization Analysis**: Comprehensive tax planning (6 steps, 8 min, $4.25)
- **Document Processing Pipeline**: Automated document analysis
- **Client Onboarding**: Streamlined client setup

**Developer Workflows:**
- **Code Review Workflow**: Multi-agent code review with security and performance (3 min, $1.75)
- **Feature Development**: End-to-end feature development assistance (7 min, $3.50)
- **Performance Optimization**: Comprehensive performance analysis and improvement (4 min, $2.25)

## AI Development Guidelines

### General Development
- Use TypeScript strict mode throughout the project
- Follow Next.js 15 App Router conventions
- Implement proper error handling and loading states
- Use tRPC for all API operations with multi-tenant validation
- Follow multi-tenant patterns for data isolation
- Implement proper authentication checks on all routes

### AI Development Guidelines
- **Mode-First Design**: Always consider which AI mode is appropriate
- **Agent Specialization**: Use specific agents for specialized tasks
- **Chain-of-Thought**: Implement structured reasoning for complex analysis
- **Tool Integration**: Leverage MCP tools for external data and computations
- **Workflow Orchestration**: Break complex processes into automated workflows
- **Error Handling**: Implement retry logic and graceful fallbacks
- **Cost Optimization**: Monitor token usage and optimize prompt efficiency
- **Performance**: Use caching and streaming for better user experience

### Developer-Focused AI Guidelines
- **Code Quality First**: Use code review agents for all generated code
- **Security by Default**: Always run security scans on generated code
- **Performance Conscious**: Profile and optimize code from the start
- **Test-Driven**: Generate comprehensive tests alongside code
- **Documentation**: Include clear documentation and usage examples
- **Type Safety**: Ensure strong TypeScript typing throughout
- **Accessibility**: Follow WCAG guidelines for UI components
- **Best Practices**: Adhere to established patterns and conventions

### AI Code Examples

#### Using the Supercharged AI System
```typescript
import { createSuperchargedAI } from '@/lib/ai/supercharged';

const ai = createSuperchargedAI({
  userId: 'user123',
  organizationId: 'org456',
  temporalContext: { season: 'tax', urgency: 'high' }
});

// Process natural language requests
const result = await ai.processRequest(
  "Analyze client financial health and provide recommendations"
);

// Execute specific workflows
const workflowResult = await ai.executeWorkflow(
  'client-financial-health-review',
  { clientId: 'client789', industry: 'manufacturing' }
);
```

#### Using AI Modes
```typescript
import { createAIModeManager, AI_MODES } from '@/lib/ai/modes';

const modeManager = createAIModeManager(context);
modeManager.autoDetectMode(); // Intelligent mode detection
modeManager.switchToMode('tax-season'); // Explicit mode switch
```

#### Using Developer Mode and Agents
```typescript
// Switch to developer mode for code-related tasks
import { createAIModeManager } from '@/lib/ai/modes';

const modeManager = createAIModeManager(context);
modeManager.switchToMode('developer-mode');

// Use specialized developer agents
import { createAgentOrchestrator } from '@/lib/ai/agents/orchestrator';

const orchestrator = createAgentOrchestrator();

// Code generation with senior developer
const codeTask = {
  id: 'generate-component',
  agentId: 'senior-developer',
  type: 'generation',
  input: { requirements: 'Create a data table component' },
  context: { framework: 'React', language: 'TypeScript' },
  requiredCapabilities: ['code-generation', 'architecture-design']
};

const result = await orchestrator.executeTask(codeTask, currentMode);

// Code review with specialized reviewer
const reviewTask = {
  id: 'review-code',
  agentId: 'code-reviewer',
  type: 'review',
  input: { codeContent: generatedCode },
  context: { securityFocus: true, performanceAudit: true },
  requiredCapabilities: ['code-quality-analysis', 'security-vulnerability-detection']
};

const reviewResult = await orchestrator.executeTask(reviewTask, currentMode);
```

#### Using Developer Tools and Workflows
```typescript
// Execute code review workflow
const workflowResult = await ai.executeWorkflow(
  'code-review-workflow',
  {
    codeContent: sourceCode,
    language: 'typescript',
    framework: 'nextjs'
  }
);

// Performance optimization analysis
const perfResult = await ai.executeWorkflow(
  'performance-optimization',
  {
    bundlePath: './dist',
    targetUrl: 'https://app.example.com',
    codeContent: componentCode,
    language: 'typescript',
    framework: 'react'
  }
);

// Use individual developer tools
const bundleAnalysis = await ai.executeTool('bundle-analyzer', {
  bundlePath: './dist',
  analysisType: 'size_analysis'
});

const securityScan = await ai.executeTool('code-analyzer', {
  analysisType: 'security_scan',
  codeContent: sourceCode,
  language: 'typescript'
});
```

## Usage Patterns

When working on AI features:
1. **Identify the appropriate AI mode** for the context
2. **Select specialized agents** based on task requirements
3. **Use chain-of-thought prompts** for complex reasoning
4. **Integrate MCP tools** for external data and computations
5. **Create workflows** for multi-step automated processes
6. **Monitor performance** and optimize for cost and speed

The AI system is designed to be intelligent, context-aware, and highly capable while maintaining professional standards and cost efficiency. All AI operations must follow the same multi-tenant patterns as the rest of the platform.

**🎯 Remember: AdvisorOS is a production CPA platform where security, compliance, and performance are paramount. Every code change must consider multi-tenant implications and professional CPA requirements.**