# ADR-002: Prisma Schema Design and Relationships

## Status
Accepted

## Context
AdvisorOS requires a comprehensive database schema to handle complex CPA workflows including client management, document processing, workflow automation, financial reporting, and QuickBooks integration. The schema must support multi-tenancy, audit trails, and scalable performance.

## Decision
We have implemented a normalized PostgreSQL schema using Prisma ORM with the following design principles:

### Core Entity Relationships:
```
Organization (Root Tenant)
├── Users (Role-based access)
├── Clients (Business entities)
│   ├── Documents (Versioned files)
│   ├── Engagements (Service contracts)
│   └── Notes (Communications)
├── Workflows & Tasks (Process automation)
├── Reports & Templates (Financial reporting)
├── Invoices (Billing)
├── Audit Logs (Compliance)
└── Integrations (QuickBooks, Stripe)
```

### Key Design Decisions:

1. **Multi-Tenant Foundation**
   - Every major entity includes `organizationId` for tenant isolation
   - Cascade deletion from Organization ensures data cleanup
   - Comprehensive indexing on `organizationId` for query performance

2. **Document Management Architecture**
   - Versioning system with `parentDocumentId` self-reference
   - OCR processing workflow with confidence scoring
   - Security classification with access levels
   - File lifecycle management (retention, archiving)

3. **Workflow Engine Schema**
   - Template-based workflows with execution instances
   - Task dependency management with step ordering
   - Queue system for background processing
   - Retry mechanisms with error handling

4. **Financial Data Integration**
   - Native QuickBooks sync with webhook event handling
   - Stripe billing integration with subscription management
   - Invoice generation with payment tracking
   - Financial reporting with template system

### Performance Optimizations:
```sql
-- Critical indexes for multi-tenant queries
@@index([organizationId])
@@index([organizationId, status])
@@index([organizationId, createdAt])

-- Workflow performance indexes
@@index([workflowExecutionId, stepIndex])
@@index([status, scheduledFor])
@@index([priority, status])
```

## Alternatives Considered

1. **NoSQL Document Store**: Would require complex querying for financial relationships
2. **Microservices with Service Databases**: Adds complexity for transactional workflows
3. **Event Sourcing**: Too complex for current requirements, considered for v2
4. **Denormalized Schema**: Would improve read performance but complicate data integrity

## Consequences

### Positive:
- **Data Integrity**: Strong foreign key relationships prevent orphaned records
- **Query Performance**: Optimized indexes for multi-tenant access patterns
- **Audit Compliance**: Comprehensive audit logging for SOC2 requirements
- **Scalability**: Normalized structure supports efficient JOIN operations
- **Type Safety**: Prisma generates type-safe client code
- **Migration Safety**: Schema migrations with rollback capabilities

### Negative:
- **Query Complexity**: JOIN operations required for related data
- **Migration Coordination**: Schema changes require careful coordination
- **Index Maintenance**: Large number of indexes requires monitoring
- **Memory Usage**: Complex queries can consume significant memory

### Schema Evolution Strategy:
1. **Versioned Migrations**: All schema changes via versioned Prisma migrations
2. **Backward Compatibility**: Maintain API compatibility during schema evolution
3. **Zero-Downtime Deployments**: Schema changes designed for rolling deployments
4. **Data Validation**: Comprehensive validation at application and database levels

## Performance Considerations

### Current Optimization:
```typescript
// Efficient multi-tenant queries
const clients = await prisma.client.findMany({
  where: { organizationId },
  include: {
    documents: { where: { isLatestVersion: true } },
    engagements: { where: { status: 'active' } }
  }
})

// Batch operations for performance
await prisma.$transaction([
  prisma.document.updateMany({ where: { clientId }, data: { status: 'archived' } }),
  prisma.auditLog.create({ data: auditData })
])
```

### Scaling Strategies:
- **Connection Pooling**: Prisma connection pool optimization
- **Read Replicas**: Separate read queries to replica databases
- **Caching Layer**: Redis cache for frequently accessed reference data
- **Query Optimization**: Regular analysis of slow query logs

## Future Enhancements

1. **Sharding Strategy**: Partition large tables by organization hash
2. **CQRS Pattern**: Separate read/write models for complex reporting
3. **Event Sourcing**: Consider for audit-critical entities like financial transactions
4. **Graph Database**: Evaluate for complex relationship queries (workflow dependencies)
5. **Time-Series Data**: Optimize for metrics and performance monitoring

## Monitoring and Metrics
- Database query performance and slow query detection
- Connection pool utilization and timeout monitoring
- Migration execution time and rollback procedures
- Data growth patterns and archiving effectiveness
- Index usage statistics and optimization opportunities