# Multi-Tenant Security Checklist

**Version**: 2.0
**Last Updated**: 2025-09-30
**Criticality**: HIGH - Security violations can lead to data breaches

## Purpose

This checklist ensures every feature implementation in AdvisorOS maintains strict multi-tenant data isolation and security. Use this checklist during development, code review, and security audits.

## Core Security Principle

> **Every database query MUST include organizationId filtering. No exceptions.**

## Pre-Development Checklist

### Requirements Analysis
- [ ] Feature requires multi-tenant data access
- [ ] Identified all entities that need organizationId
- [ ] Documented cross-organization scenarios (if any)
- [ ] Reviewed RBAC requirements
- [ ] Planned audit trail requirements

### Security Design
- [ ] Designed with organization isolation first
- [ ] Identified all data access paths
- [ ] Planned permission checks
- [ ] Designed error handling (no data leaks)
- [ ] Documented security assumptions

## Database Layer Checklist

### Prisma Schema
```prisma
// ✅ REQUIRED: Every model needs organizationId
model Client {
  id             String   @id @default(cuid())
  organizationId String   // ✅ CRITICAL FIELD

  // ... other fields

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId]) // ✅ REQUIRED for query performance
  @@index([organizationId, createdAt]) // Compound indexes for common queries
}
```

**Checklist**:
- [ ] Model includes `organizationId` field
- [ ] Relation to `Organization` model defined
- [ ] `onDelete: Cascade` set (automatic cleanup)
- [ ] Index on `organizationId` added
- [ ] Compound indexes for common query patterns
- [ ] Migration tested with multiple organizations

### Query Patterns

#### ✅ CORRECT Patterns
```typescript
// Single record with organizationId
const client = await prisma.client.findFirst({
  where: {
    id: clientId,
    organizationId: ctx.organizationId, // ✅ REQUIRED
  },
});

// List with organizationId
const clients = await prisma.client.findMany({
  where: {
    organizationId: ctx.organizationId, // ✅ REQUIRED
    status: 'active',
  },
});

// Include relations with organizationId
const client = await prisma.client.findFirst({
  where: {
    id: clientId,
    organizationId: ctx.organizationId, // ✅ REQUIRED
  },
  include: {
    engagements: {
      where: {
        organizationId: ctx.organizationId, // ✅ REQUIRED on relations
      },
    },
  },
});

// Count with organizationId
const count = await prisma.client.count({
  where: {
    organizationId: ctx.organizationId, // ✅ REQUIRED
  },
});
```

#### ❌ INCORRECT Patterns (NEVER DO THIS)
```typescript
// ❌ CRITICAL VULNERABILITY: No organizationId
const client = await prisma.client.findUnique({
  where: { id: clientId }, // WRONG - Cross-tenant access possible
});

// ❌ CRITICAL VULNERABILITY: Missing organizationId in list
const allClients = await prisma.client.findMany(); // WRONG - Returns all orgs

// ❌ VULNERABILITY: Missing organizationId in relation
const client = await prisma.client.findFirst({
  where: { id: clientId, organizationId: ctx.organizationId },
  include: {
    engagements: true, // WRONG - Should filter by organizationId
  },
});
```

**Database Checklist**:
- [ ] All `findUnique` queries verify organizationId
- [ ] All `findFirst` queries include organizationId
- [ ] All `findMany` queries filter by organizationId
- [ ] All relation includes filter by organizationId
- [ ] All counts filter by organizationId
- [ ] All updates verify organizationId before executing
- [ ] All deletes verify organizationId before executing

## API Layer Checklist

### tRPC Procedures
```typescript
import { organizationProcedure } from '~/server/api/trpc';

// ✅ CORRECT: Use organizationProcedure
export const clientRouter = createTRPCRouter({
  getById: organizationProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ctx.organizationId is automatically available and validated
      const client = await prisma.client.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId, // ✅ From context
        },
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found', // Generic message (no data leak)
        });
      }

      return client;
    }),
});

// ❌ WRONG: Using publicProcedure for org data
export const clientRouter = createTRPCRouter({
  getById: publicProcedure // ❌ WRONG - No org context
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.client.findUnique({ where: { id: input.id } });
    }),
});
```

**API Checklist**:
- [ ] Used `organizationProcedure` (NOT `publicProcedure`)
- [ ] Context includes `organizationId`
- [ ] Input validated with Zod schema
- [ ] All database queries include organizationId
- [ ] Errors don't leak data from other organizations
- [ ] Permission checks performed (RBAC)
- [ ] Audit logs created for sensitive operations

### Permission Validation
```typescript
// ✅ CORRECT: RBAC permission check
export const deleteClient = organizationProcedure
  .input(z.object({ id: z.string() }))
  .use(requireRole(['admin', 'owner'])) // Permission middleware
  .mutation(async ({ ctx, input }) => {
    const client = await prisma.client.findFirst({
      where: {
        id: input.id,
        organizationId: ctx.organizationId,
      },
    });

    if (!client) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    await prisma.client.delete({ where: { id: client.id } });

    // Audit trail
    await createAuditLog({
      action: 'CLIENT_DELETED',
      entityId: client.id,
      organizationId: ctx.organizationId,
      userId: ctx.session.user.id,
    });

    return { success: true };
  });
```

**Permission Checklist**:
- [ ] Appropriate role requirements defined
- [ ] Permission middleware applied
- [ ] User role verified before sensitive operations
- [ ] Permission denials logged for security monitoring

## Frontend Layer Checklist

### Data Fetching
```typescript
// ✅ CORRECT: tRPC provides automatic type safety and org isolation
function ClientDashboard() {
  const { data: clients } = api.client.list.useQuery();
  // Automatically filtered by organization

  return (
    <div>
      {clients?.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}

// ❌ WRONG: Direct API calls without org context
async function fetchClients() {
  const response = await fetch('/api/clients'); // WRONG - No org isolation
  return response.json();
}
```

**Frontend Checklist**:
- [ ] Using tRPC for all API calls
- [ ] No direct database access from frontend
- [ ] No organizationId manipulation in frontend code
- [ ] Error handling doesn't expose sensitive data
- [ ] UI respects RBAC permissions

## File Upload Security

### Secure File Storage
```typescript
// ✅ CORRECT: Organization-scoped file storage
async function uploadDocument(
  file: File,
  clientId: string,
  ctx: Context
) {
  // Verify client belongs to organization
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId: ctx.organizationId,
    },
  });

  if (!client) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  // Generate organization-scoped path
  const filePath = `organizations/${ctx.organizationId}/clients/${clientId}/${file.name}`;

  // Upload to Azure Blob Storage
  await azureBlobClient.upload(filePath, file);

  // Record in database
  await prisma.document.create({
    data: {
      filename: file.name,
      path: filePath,
      clientId,
      organizationId: ctx.organizationId,
      uploadedById: ctx.session.user.id,
    },
  });
}
```

**File Upload Checklist**:
- [ ] File paths include organizationId
- [ ] Verify entity ownership before upload
- [ ] Validate file type and size
- [ ] Scan for malware (if applicable)
- [ ] Record upload in database with organizationId
- [ ] Create audit log for sensitive documents

## Testing Checklist

### Multi-Tenant Security Tests
```typescript
describe('Multi-Tenant Security', () => {
  it('prevents cross-tenant data access', async () => {
    // Setup two organizations
    const org1 = await createTestOrganization();
    const org2 = await createTestOrganization();

    // Create client in org1
    const client = await createTestClient({ organizationId: org1.id });

    // Attempt to access from org2 context
    const org2Context = await createContext({ organizationId: org2.id });

    // Should throw NOT_FOUND (not reveal existence)
    await expect(
      clientService.getById(client.id, org2Context)
    ).rejects.toThrow('Client not found');
  });

  it('filters list queries by organization', async () => {
    const org1 = await createTestOrganization();
    const org2 = await createTestOrganization();

    await createTestClient({ organizationId: org1.id });
    await createTestClient({ organizationId: org2.id });

    const org1Context = await createContext({ organizationId: org1.id });
    const clients = await clientService.list(org1Context);

    // Should only return org1 clients
    expect(clients).toHaveLength(1);
    expect(clients[0].organizationId).toBe(org1.id);
  });
});
```

**Testing Checklist**:
- [ ] Cross-tenant access prevention tests
- [ ] List queries filter correctly
- [ ] Update/delete verify ownership
- [ ] Include/join relations filter by organizationId
- [ ] RBAC permission tests
- [ ] Audit log generation tests

## Common Vulnerabilities to Avoid

### 1. Missing organizationId in Query
```typescript
// ❌ VULNERABILITY
const client = await prisma.client.findUnique({ where: { id } });

// ✅ FIX
const client = await prisma.client.findFirst({
  where: { id, organizationId: ctx.organizationId }
});
```

### 2. Unfiltered Relations
```typescript
// ❌ VULNERABILITY
include: { engagements: true }

// ✅ FIX
include: {
  engagements: {
    where: { organizationId: ctx.organizationId }
  }
}
```

### 3. Information Disclosure in Errors
```typescript
// ❌ VULNERABILITY
throw new Error(`Client ${client.businessName} not found in your organization`);

// ✅ FIX
throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
```

### 4. Missing Permission Checks
```typescript
// ❌ VULNERABILITY - Anyone can delete
.mutation(async ({ input }) => {
  await prisma.client.delete({ where: { id: input.id } });
});

// ✅ FIX - Only admins/owners can delete
.use(requireRole(['admin', 'owner']))
.mutation(async ({ ctx, input }) => {
  // Verify ownership first
  const client = await prisma.client.findFirst({
    where: { id: input.id, organizationId: ctx.organizationId }
  });
  if (!client) throw new TRPCError({ code: 'NOT_FOUND' });

  await prisma.client.delete({ where: { id: input.id } });
});
```

## Code Review Checklist

Use this during PR reviews:

### Database Layer
- [ ] Every model has organizationId
- [ ] Every query filters by organizationId
- [ ] Indexes include organizationId
- [ ] Relations filter by organizationId

### API Layer
- [ ] Uses organizationProcedure
- [ ] Input validation with Zod
- [ ] Permission checks present
- [ ] Audit logs for sensitive ops
- [ ] Errors don't leak data

### Testing
- [ ] Cross-tenant tests added
- [ ] Permission tests included
- [ ] Edge cases covered

## Compliance & Audit

### SOX Compliance
- [ ] All financial operations have audit trails
- [ ] organizationId in all audit logs
- [ ] Immutable audit records
- [ ] Comprehensive logging

### Security Monitoring
- [ ] Failed access attempts logged
- [ ] Permission denials tracked
- [ ] Unusual access patterns detected
- [ ] Regular security audits scheduled

## Emergency Response

If cross-tenant data leak is suspected:

1. **Immediate**: Disable affected endpoint
2. **Investigate**: Check audit logs for unauthorized access
3. **Notify**: Alert security team and affected organizations
4. **Fix**: Implement proper organizationId filtering
5. **Test**: Comprehensive security testing
6. **Deploy**: Emergency hotfix
7. **Monitor**: Enhanced logging temporarily
8. **Report**: Incident report and lessons learned

## Resources

- [OWASP Multi-Tenancy Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [AdvisorOS Security Documentation](../security/)
- [Prisma Multi-Tenant Best Practices](https://www.prisma.io/docs/guides/deployment/multi-tenant)

---

**Remember**: When in doubt, always include organizationId. It's better to over-filter than to leak data across organizations.