# Feature Development Mode

Comprehensive development mode for implementing new features in the AdvisorOS multi-tenant CPA platform with built-in security, performance, and compliance considerations.

## Mode Overview

This mode guides you through the complete feature development lifecycle, ensuring every new feature maintains the platform's security, performance, and compliance standards while following CPA-specific requirements.

## Development Workflow

### Phase 1: Planning & Architecture
```yaml
Planning Stage:
  - Feature Requirements Analysis
  - Multi-Tenant Security Assessment  
  - Performance Impact Evaluation
  - Compliance Requirements Review
  - Database Schema Planning
  - API Design Specification
  - UI/UX Professional Standards Review
```

### Phase 2: Implementation
```yaml
Implementation Stage:
  - Database Schema Implementation
  - Backend Service Development
  - API Endpoint Creation
  - Frontend Component Development
  - Integration Points Setup
  - Error Handling Implementation
  - Audit Trail Integration
```

### Phase 3: Testing & Validation
```yaml
Testing Stage:
  - Unit Test Creation
  - Integration Testing
  - Multi-Tenant Security Testing
  - Performance Testing
  - Compliance Validation
  - End-to-End Testing
  - User Acceptance Testing
```

### Phase 4: Deployment & Monitoring
```yaml
Deployment Stage:
  - Pre-deployment Security Audit
  - Performance Baseline Establishment
  - Feature Flag Implementation
  - Gradual Rollout Strategy
  - Monitoring Setup
  - Documentation Creation
```

## Feature Development Checklist

### 🔐 Security Requirements
- [ ] All database operations include `organizationId` filtering
- [ ] Proper RBAC permission validation implemented
- [ ] Input validation and sanitization in place
- [ ] Secure error handling (no data leaks)
- [ ] Audit trails for all sensitive operations
- [ ] File uploads are organization-scoped
- [ ] Cross-tenant access prevention validated

### 📊 Performance Requirements
- [ ] Database queries optimized with proper indexes
- [ ] API responses under 2-second target
- [ ] Caching strategy implemented where appropriate
- [ ] Pagination for large datasets
- [ ] Memory usage patterns reviewed
- [ ] Background job processing for heavy operations

### 📋 Compliance Requirements
- [ ] SOX compliance for financial operations
- [ ] GAAP standards followed for financial calculations
- [ ] Comprehensive audit logging implemented
- [ ] Data retention policies considered
- [ ] Professional CPA standards maintained

### 🧪 Testing Requirements
- [ ] Unit tests with >80% coverage
- [ ] Integration tests for external services
- [ ] Multi-tenant isolation tests
- [ ] Performance benchmark tests
- [ ] Security penetration tests
- [ ] End-to-end workflow tests

## Development Templates

### 1. Database Schema Template
```typescript
// packages/database/schema.prisma
model NewFeature {
  id             String   @id @default(cuid())
  organizationId String   // REQUIRED for multi-tenant isolation
  
  // Feature-specific fields
  name           String
  description    String?
  status         FeatureStatus @default(ACTIVE)
  
  // Audit fields
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  
  // Relationships with proper tenant isolation
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  creator        User         @relation(fields: [createdBy], references: [id])
  
  // Multi-tenant optimized indexes
  @@index([organizationId, status])
  @@index([organizationId, createdAt])
  @@map("new_features")
}
```

### 2. tRPC Router Template
```typescript
// apps/web/src/server/api/routers/new-feature.ts
import { z } from 'zod'
import { createTRPCRouter, organizationProcedure } from '~/server/api/trpc'
import { TRPCError } from '@trpc/server'

const createFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
})

export const newFeatureRouter = createTRPCRouter({
  list: organizationProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      await PermissionService.validateAccess(
        ctx.session.user.id,
        ctx.organizationId,
        'features:read'
      )
      
      const where = {
        organizationId: ctx.organizationId,
        ...(input.status && { status: input.status })
      }
      
      const features = await ctx.prisma.newFeature.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1
        }),
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      })
      
      const hasMore = features.length > input.limit
      const items = hasMore ? features.slice(0, -1) : features
      const nextCursor = hasMore ? items[items.length - 1].id : null
      
      return {
        items,
        nextCursor,
        hasMore
      }
    }),

  create: organizationProcedure
    .input(createFeatureSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      await PermissionService.validateAccess(
        ctx.session.user.id,
        ctx.organizationId,
        'features:write'
      )
      
      try {
        const feature = await ctx.prisma.newFeature.create({
          data: {
            ...input,
            organizationId: ctx.organizationId,
            createdBy: ctx.session.user.id
          },
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            }
          }
        })
        
        // Create audit trail
        await auditLogger.log({
          action: 'FEATURE_CREATED',
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
          resourceId: feature.id,
          metadata: {
            featureName: feature.name,
            featureDescription: feature.description
          }
        })
        
        return feature
        
      } catch (error) {
        await securityLogger.error('Feature creation failed', {
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
          error: error.message
        })
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create feature'
        })
      }
    }),

  update: organizationProcedure
    .input(z.object({
      id: z.string(),
      data: createFeatureSchema.partial()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      await PermissionService.validateAccess(
        ctx.session.user.id,
        ctx.organizationId,
        'features:write'
      )
      
      // Verify feature belongs to organization
      const existingFeature = await ctx.prisma.newFeature.findFirst({
        where: { 
          id: input.id, 
          organizationId: ctx.organizationId 
        }
      })
      
      if (!existingFeature) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feature not found'
        })
      }
      
      const updatedFeature = await ctx.prisma.newFeature.update({
        where: { id: input.id },
        data: input.data,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      })
      
      // Create audit trail
      await auditLogger.log({
        action: 'FEATURE_UPDATED',
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id,
        resourceId: updatedFeature.id,
        metadata: {
          changes: input.data,
          previousVersion: existingFeature
        }
      })
      
      return updatedFeature
    }),

  delete: organizationProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      await PermissionService.validateAccess(
        ctx.session.user.id,
        ctx.organizationId,
        'features:delete'
      )
      
      // Verify feature belongs to organization
      const feature = await ctx.prisma.newFeature.findFirst({
        where: { 
          id: input.id, 
          organizationId: ctx.organizationId 
        }
      })
      
      if (!feature) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feature not found'
        })
      }
      
      await ctx.prisma.newFeature.delete({
        where: { id: input.id }
      })
      
      // Create audit trail
      await auditLogger.log({
        action: 'FEATURE_DELETED',
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id,
        resourceId: feature.id,
        metadata: {
          deletedFeature: {
            name: feature.name,
            description: feature.description
          }
        }
      })
      
      return { success: true }
    })
})
```

### 3. Service Layer Template
```typescript
// apps/web/src/server/services/new-feature.service.ts
export class NewFeatureService {
  static async getFeature(
    featureId: string,
    organizationId: string,
    userId: string
  ): Promise<NewFeature> {
    // Validate permissions
    await PermissionService.validateAccess(userId, organizationId, 'features:read')
    
    // Fetch with organization isolation
    const feature = await prisma.newFeature.findFirst({
      where: { id: featureId, organizationId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    if (!feature) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Feature not found'
      })
    }
    
    return feature
  }
  
  static async processFeatureData(
    featureId: string,
    organizationId: string,
    userId: string
  ): Promise<ProcessedFeatureData> {
    const feature = await this.getFeature(featureId, organizationId, userId)
    
    // Perform feature-specific processing
    const processedData = await this.performProcessing(feature)
    
    // Create audit trail for processing
    await auditLogger.log({
      action: 'FEATURE_PROCESSED',
      organizationId,
      userId,
      resourceId: featureId,
      metadata: {
        processingType: 'data_analysis',
        recordsProcessed: processedData.recordCount
      }
    })
    
    return processedData
  }
  
  private static async performProcessing(
    feature: NewFeature
  ): Promise<ProcessedFeatureData> {
    // Implement feature-specific business logic
    // Ensure all operations maintain organization isolation
    return {
      featureId: feature.id,
      processedAt: new Date(),
      recordCount: 0,
      results: []
    }
  }
}
```

### 4. React Component Template
```typescript
// apps/web/src/components/features/NewFeatureList.tsx
'use client'

import { useState } from 'react'
import { api } from '~/utils/api'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Loader2, Plus } from 'lucide-react'

interface NewFeatureListProps {
  organizationId: string
}

export function NewFeatureList({ organizationId }: NewFeatureListProps) {
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | undefined>()
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = api.newFeature.list.useInfiniteQuery(
    { 
      limit: 20,
      status: statusFilter 
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  )
  
  const features = data?.pages.flatMap(page => page.items) ?? []
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading features...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Error loading features: {error.message}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Features</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={statusFilter === undefined ? 'default' : 'outline'}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('ACTIVE')}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('INACTIVE')}
        >
          Inactive
        </Button>
      </div>
      
      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{feature.name}</CardTitle>
                <Badge variant={feature.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {feature.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {feature.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {feature.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Created by {feature.creator.name} on{' '}
                {new Date(feature.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
```

### 5. Test Suite Template
```typescript
// apps/web/src/__tests__/new-feature.test.ts
describe('NewFeature API', () => {
  let org1: Organization
  let org2: Organization
  let cpaUser1: User
  let cpaUser2: User
  
  beforeEach(async () => {
    org1 = await createTestOrganization()
    org2 = await createTestOrganization()
    cpaUser1 = await createTestUser(org1.id, 'cpa')
    cpaUser2 = await createTestUser(org2.id, 'cpa')
  })
  
  describe('Multi-Tenant Security', () => {
    test('prevents cross-organization feature access', async () => {
      const feature1 = await createTestFeature(org1.id, cpaUser1.id)
      
      const trpcCaller = appRouter.createCaller({
        session: { user: cpaUser2 },
        organizationId: org2.id,
        prisma
      })
      
      await expect(
        trpcCaller.newFeature.update({
          id: feature1.id,
          data: { name: 'Hacked' }
        })
      ).rejects.toThrow('Feature not found')
    })
    
    test('list endpoint only returns organization features', async () => {
      await createTestFeature(org1.id, cpaUser1.id, { name: 'Org1 Feature' })
      await createTestFeature(org2.id, cpaUser2.id, { name: 'Org2 Feature' })
      
      const trpcCaller1 = appRouter.createCaller({
        session: { user: cpaUser1 },
        organizationId: org1.id,
        prisma
      })
      
      const result = await trpcCaller1.newFeature.list({})
      
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Org1 Feature')
    })
  })
  
  describe('Permission Validation', () => {
    test('requires appropriate permissions for CRUD operations', async () => {
      const staffUser = await createTestUser(org1.id, 'staff')
      
      const trpcCaller = appRouter.createCaller({
        session: { user: staffUser },
        organizationId: org1.id,
        prisma
      })
      
      // Staff should not be able to delete features
      const feature = await createTestFeature(org1.id, cpaUser1.id)
      
      await expect(
        trpcCaller.newFeature.delete({ id: feature.id })
      ).rejects.toThrow('Insufficient permissions')
    })
  })
  
  describe('Audit Trail', () => {
    test('creates audit logs for all operations', async () => {
      const trpcCaller = appRouter.createCaller({
        session: { user: cpaUser1 },
        organizationId: org1.id,
        prisma
      })
      
      const feature = await trpcCaller.newFeature.create({
        name: 'Test Feature',
        description: 'Test Description'
      })
      
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          organizationId: org1.id,
          action: 'FEATURE_CREATED',
          resourceId: feature.id
        }
      })
      
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0].userId).toBe(cpaUser1.id)
      expect(auditLogs[0].metadata).toMatchObject({
        featureName: 'Test Feature'
      })
    })
  })
  
  describe('Performance', () => {
    test('pagination works efficiently with large datasets', async () => {
      // Create 100 features
      const features = await Promise.all(
        Array(100).fill(null).map((_, i) =>
          createTestFeature(org1.id, cpaUser1.id, {
            name: `Feature ${i}`
          })
        )
      )
      
      const trpcCaller = appRouter.createCaller({
        session: { user: cpaUser1 },
        organizationId: org1.id,
        prisma
      })
      
      const startTime = Date.now()
      const result = await trpcCaller.newFeature.list({ limit: 20 })
      const queryTime = Date.now() - startTime
      
      expect(queryTime).toBeLessThan(500) // 500ms max
      expect(result.items).toHaveLength(20)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBeTruthy()
    })
  })
})
```

## Development Guidelines

### 🚀 Getting Started
1. Review feature requirements and CPA compliance needs
2. Plan database schema with multi-tenant considerations
3. Design API endpoints with proper security patterns
4. Create frontend components following professional standards
5. Implement comprehensive test coverage
6. Conduct security and performance reviews

### 🔄 Iterative Development
1. Start with minimal viable implementation
2. Add security and compliance features
3. Optimize for performance
4. Expand functionality based on feedback
5. Maintain high code quality standards

### 📊 Success Metrics
- Security: 100% organization isolation, no cross-tenant access
- Performance: API responses <2s, database queries <500ms
- Compliance: Complete audit trails for all operations
- Quality: >80% test coverage, zero critical vulnerabilities
- User Experience: Professional CPA-grade interface and workflows

### 🆘 Escalation Points
- Security vulnerabilities discovered
- Performance requirements not met
- Compliance requirements unclear
- Complex business logic implementation needed
- Integration challenges with external services

This feature development mode ensures every new feature maintains the platform's high standards while delivering professional-grade CPA functionality.