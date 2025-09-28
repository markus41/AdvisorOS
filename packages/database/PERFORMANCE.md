# Database Performance Optimization Guide

## Overview

This document outlines the comprehensive database performance optimizations implemented for the CPA platform. The optimizations focus on query performance, caching strategies, indexing, and scalability to handle the specific workloads of a CPA practice management system.

## Table of Contents

1. [Performance Optimizations Implemented](#performance-optimizations-implemented)
2. [Index Strategy](#index-strategy)
3. [Query Optimization](#query-optimization)
4. [Caching Strategy](#caching-strategy)
5. [Connection Pooling](#connection-pooling)
6. [Data Archiving](#data-archiving)
7. [Performance Monitoring](#performance-monitoring)
8. [Best Practices](#best-practices)
9. [Maintenance Procedures](#maintenance-procedures)
10. [Scaling Considerations](#scaling-considerations)
11. [Troubleshooting](#troubleshooting)

## Performance Optimizations Implemented

### 1. Comprehensive Indexing Strategy

**Files:** `packages/database/migrations/optimize_indexes.sql`

#### Composite Indexes
- **Organization + CreatedAt**: Optimizes time-based queries across all models
- **Client + Status**: Efficient client filtering by status and organization
- **Document + Category + Year**: Optimizes document searches by type and year
- **Task + Assignee + Status**: Efficient task management queries
- **Invoice + DueDate + Status**: Optimizes payment tracking

#### Partial Indexes
- **Active Records Only**: Indexes exclude soft-deleted records for better performance
- **Latest Document Versions**: Separate indexes for current vs archived documents
- **Pending OCR Documents**: Efficient processing queue management
- **Open Invoices**: Optimized accounts receivable queries

#### Covering Indexes
- **Client Lists**: Include essential fields to eliminate table lookups
- **Document Metadata**: Cover common document query patterns
- **Task Dashboards**: Optimize task assignment views

#### JSON Field Indexes
- **QuickBooks Integration**: GIN indexes on financial data
- **Document Metadata**: Search capabilities on extracted data
- **Task Checklists**: Efficient progress tracking

### 2. Query Optimization Service

**Files:** `apps/web/src/server/services/query-optimizer.service.ts`

#### Features
- **Pagination**: Both offset-based and cursor-based pagination
- **Result Caching**: Intelligent caching with TTL management
- **Filter Optimization**: Optimized WHERE clauses for common patterns
- **Aggregation Queries**: Efficient dashboard metrics calculation
- **Performance Monitoring**: Automatic slow query detection

#### Usage Example
```typescript
import { QueryOptimizerService } from '../services/query-optimizer.service';

const optimizer = new QueryOptimizerService(prisma, redis);

// Optimized client listing with caching
const clients = await optimizer.getClientsOptimized(
  { organizationId: 'org_123', status: 'active' },
  { page: 1, limit: 20 }
);

// Dashboard metrics with caching
const metrics = await optimizer.getDashboardMetrics('org_123');
```

### 3. Redis Caching Strategy

**Files:** `apps/web/src/server/services/cache.service.ts`

#### Cache Layers
- **Session Data**: 30-minute TTL
- **User Profiles**: 10-minute TTL
- **Client Data**: 30-minute TTL
- **Dashboard Metrics**: 2-minute TTL
- **Reports**: 2-hour TTL
- **QuickBooks Data**: 5-minute TTL

#### Cache Invalidation
- **Event-Based**: Automatic invalidation on data changes
- **Pattern-Based**: Bulk invalidation using Redis patterns
- **Organization-Scoped**: Tenant-specific cache management

#### Usage Example
```typescript
import { CacheService } from '../services/cache.service';

const cache = new CacheService(redis);

// Cache client list
await cache.setClientList(organizationId, filters, clients);

// Get cached dashboard metrics
const metrics = await cache.getDashboardMetrics(organizationId);

// Invalidate after client update
await cache.invalidateClient(clientId, organizationId);
```

### 4. Connection Pooling & Database Configuration

**Files:** `apps/web/src/server/db.ts`

#### Optimized Settings
- **Connection Limit**: 20 connections (configurable)
- **Connection Timeout**: 10 seconds
- **Query Timeout**: 30 seconds
- **Transaction Isolation**: ReadCommitted for better concurrency

#### Health Monitoring
- **Automatic Health Checks**: Every 30 seconds
- **Connection Pool Monitoring**: Track utilization
- **Performance Metrics**: Database size, cache hit ratio, slow queries

### 5. DataLoader Pattern Implementation

**Files:** `apps/web/src/server/services/dataloader.service.ts`

#### Features
- **N+1 Query Prevention**: Batch loading for related data
- **Request-Scoped Caching**: Efficient within-request caching
- **Organization Context**: Tenant-aware data loading
- **Preloading Support**: Warm cache for common access patterns

#### Usage Example
```typescript
import { createDataLoaderService } from '../services/dataloader.service';

const loaders = createDataLoaderService(prisma, redis, { organizationId });

// Efficiently load multiple clients
const clients = await loaders.getClientLoader().loadMany(clientIds);

// Load documents for multiple clients (batched)
const documents = await loaders.getDocumentsByClientLoader().loadMany(clientIds);
```

### 6. Data Archiving Strategy

**Files:** `apps/web/src/server/services/archive.service.ts`

#### Archival Policies
- **Documents**: Archive after 1 year, delete after 7 years
- **Tasks**: Archive completed tasks after 90 days
- **Invoices**: Archive paid invoices after 1 year
- **Audit Logs**: Archive after 90 days, retain for 7 years

#### Storage Options
- **AWS S3 Glacier**: Long-term document storage
- **Local Compression**: Development and small deployments
- **Automatic Cleanup**: Expired document removal

### 7. Performance Monitoring

**Files:** `apps/web/src/server/services/db-monitor.service.ts`

#### Monitoring Capabilities
- **Real-Time Metrics**: Connection usage, cache hit ratio, query performance
- **Slow Query Detection**: Automatic identification and alerting
- **Index Usage Analysis**: Track index effectiveness
- **Performance Reports**: Automated optimization recommendations

## Index Strategy

### Primary Indexes

#### Organizations
```sql
-- Basic indexes for organization queries
CREATE INDEX CONCURRENTLY idx_organizations_subdomain ON organizations (subdomain);
CREATE INDEX CONCURRENTLY idx_organizations_subscription ON organizations (subscription_tier, created_at);
```

#### Users
```sql
-- User authentication and organization queries
CREATE INDEX CONCURRENTLY idx_users_org_email ON users (organization_id, email);
CREATE INDEX CONCURRENTLY idx_users_org_role_active ON users (organization_id, role, is_active) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_last_login ON users (organization_id, last_login_at DESC) WHERE is_active = true;
```

#### Clients
```sql
-- Client management indexes
CREATE INDEX CONCURRENTLY idx_clients_org_status_name ON clients (organization_id, status, business_name) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_clients_contact_search ON clients USING gin (to_tsvector('english', business_name || ' ' || primary_contact_name || ' ' || primary_contact_email));
CREATE INDEX CONCURRENTLY idx_clients_business_type_industry ON clients (organization_id, business_type, industry) WHERE deleted_at IS NULL;
```

#### Documents
```sql
-- Document management and search indexes
CREATE INDEX CONCURRENTLY idx_documents_client_category_year ON documents (client_id, category, year DESC, created_at DESC) WHERE deleted_at IS NULL AND is_latest_version = true;
CREATE INDEX CONCURRENTLY idx_documents_ocr_processing ON documents (organization_id, ocr_status, created_at ASC) WHERE ocr_status IN ('pending', 'processing');
CREATE INDEX CONCURRENTLY idx_documents_review_queue ON documents (organization_id, needs_review, created_at ASC) WHERE needs_review = true AND deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_documents_tags_search ON documents USING gin (tags) WHERE deleted_at IS NULL;
```

#### Tasks
```sql
-- Task management and assignment indexes
CREATE INDEX CONCURRENTLY idx_tasks_assignee_status_priority ON tasks (assigned_to_id, status, priority, due_date ASC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_tasks_engagement_workflow ON tasks (engagement_id, workflow_id, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_tasks_overdue ON tasks (organization_id, due_date ASC) WHERE deleted_at IS NULL AND due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled');
```

#### Invoices
```sql
-- Invoice and payment tracking indexes
CREATE INDEX CONCURRENTLY idx_invoices_client_status_due ON invoices (client_id, status, due_date ASC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_invoices_payment_tracking ON invoices (organization_id, status, paid_amount, total_amount) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_invoices_revenue_reporting ON invoices (organization_id, date_trunc('month', invoice_date), status) WHERE deleted_at IS NULL AND status IN ('paid', 'partial');
```

### Specialized Indexes

#### Time-Based Reporting
```sql
-- Optimized for monthly/quarterly reporting
CREATE INDEX CONCURRENTLY idx_documents_reporting_period ON documents (organization_id, year, quarter, category) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_engagements_reporting_period ON engagements (organization_id, year, quarter, type, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_revenue_monthly ON invoices (organization_id, extract(year from invoice_date), extract(month from invoice_date), status) WHERE deleted_at IS NULL;
```

#### QuickBooks Integration
```sql
-- QuickBooks sync optimization
CREATE INDEX CONCURRENTLY idx_quickbooks_sync_status ON quickbooks_syncs (organization_id, entity_type, status, started_at DESC);
CREATE INDEX CONCURRENTLY idx_quickbooks_webhooks_processing ON quickbooks_webhook_events (organization_id, status, next_retry_at ASC) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY idx_clients_quickbooks_mapping ON clients USING gin ((financial_data->'quickbooks_id')) WHERE financial_data IS NOT NULL;
```

#### Audit and Compliance
```sql
-- Audit trail and compliance indexes
CREATE INDEX CONCURRENTLY idx_audit_logs_entity_timeline ON audit_logs (organization_id, entity_type, entity_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_user_activity ON audit_logs (user_id, action, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_auth_attempts_security ON auth_attempts (email, ip_address, success, created_at DESC);
```

## Query Optimization

### Common Query Patterns

#### Client Dashboard Query
```sql
-- Optimized client dashboard with covering index
SELECT
  c.id, c.business_name, c.status, c.risk_level,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT e.id) as engagement_count,
  COUNT(DISTINCT i.id) as open_invoice_count,
  SUM(CASE WHEN i.status = 'overdue' THEN i.balance_amount ELSE 0 END) as overdue_amount
FROM clients c
LEFT JOIN documents d ON d.client_id = c.id AND d.deleted_at IS NULL AND d.is_latest_version = true
LEFT JOIN engagements e ON e.client_id = c.id AND e.deleted_at IS NULL AND e.status != 'completed'
LEFT JOIN invoices i ON i.client_id = c.id AND i.deleted_at IS NULL AND i.status NOT IN ('paid', 'cancelled')
WHERE c.organization_id = $1 AND c.deleted_at IS NULL
GROUP BY c.id, c.business_name, c.status, c.risk_level
ORDER BY c.business_name;
```

#### Document Search Query
```sql
-- Optimized document search with filters
SELECT d.*, c.business_name, u.name as uploader_name
FROM documents d
JOIN clients c ON c.id = d.client_id
JOIN users u ON u.id = d.uploaded_by
WHERE d.organization_id = $1
  AND d.deleted_at IS NULL
  AND d.is_latest_version = true
  AND ($2::text IS NULL OR d.category = $2)
  AND ($3::int IS NULL OR d.year = $3)
  AND ($4::text IS NULL OR d.file_name ILIKE '%' || $4 || '%')
ORDER BY d.created_at DESC
LIMIT 20 OFFSET $5;
```

#### Task Assignment Query
```sql
-- Optimized task assignment with priorities
SELECT t.*, e.name as engagement_name, c.business_name
FROM tasks t
LEFT JOIN engagements e ON e.id = t.engagement_id
LEFT JOIN clients c ON c.id = e.client_id
WHERE t.assigned_to_id = $1
  AND t.deleted_at IS NULL
  AND t.status NOT IN ('completed', 'cancelled')
ORDER BY
  CASE t.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  t.due_date ASC NULLS LAST,
  t.created_at ASC
LIMIT 50;
```

### Query Performance Guidelines

#### 1. Use Appropriate Indexes
- Always include `organization_id` in multi-tenant queries
- Use composite indexes for common filter combinations
- Consider covering indexes for frequently accessed columns

#### 2. Optimize WHERE Clauses
- Put most selective conditions first
- Use `EXISTS` instead of `IN` for subqueries
- Avoid functions in WHERE clauses unless indexed

#### 3. Efficient JOINs
- Use appropriate JOIN types (INNER vs LEFT)
- Join on indexed columns
- Consider denormalization for read-heavy queries

#### 4. Pagination Best Practices
- Use cursor-based pagination for large datasets
- Include sort columns in indexes
- Avoid OFFSET for large page numbers

## Caching Strategy

### Cache Layers

#### 1. Application-Level Caching (Redis)
```typescript
// Cache TTL configurations
const CACHE_TTL = {
  SHORT: 300,     // 5 minutes - real-time data
  MEDIUM: 900,    // 15 minutes - semi-static data
  LONG: 3600,     // 1 hour - static data
  DASHBOARD: 120, // 2 minutes - dashboard metrics
  SESSION: 1800,  // 30 minutes - user sessions
  REPORTS: 7200,  // 2 hours - generated reports
};

// Cache key patterns
const CACHE_KEYS = {
  USER_PROFILE: 'user:{userId}:profile:{orgId}',
  CLIENT_LIST: 'client:{orgId}:list:{filters}',
  DASHBOARD_METRICS: 'dashboard:{orgId}:metrics',
  DOCUMENT_LIST: 'document:{orgId}:{clientId}:list:{filters}',
  TASK_LIST: 'task:{orgId}:{assigneeId}:list:{filters}',
  INVOICE_LIST: 'invoice:{orgId}:list:{filters}',
  QB_DATA: 'qb:{orgId}:{dataType}',
  REPORT_DATA: 'report:{reportId}:data',
};
```

#### 2. Query Result Caching
```typescript
// Cached query example
async function getCachedClientList(organizationId: string, filters: any) {
  const cacheKey = `client:${organizationId}:list:${JSON.stringify(filters)}`;

  let result = await cache.get(cacheKey);
  if (!result) {
    result = await queryOptimizer.getClientsOptimized(
      { organizationId, ...filters },
      { page: 1, limit: 20 }
    );
    await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
  }

  return result;
}
```

#### 3. DataLoader Caching
```typescript
// Request-scoped caching with DataLoader
const clientLoader = new DataLoader(async (clientIds) => {
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } }
  });

  return clientIds.map(id =>
    clients.find(client => client.id === id) || null
  );
});

// Usage prevents N+1 queries
const clients = await clientLoader.loadMany(clientIds);
```

### Cache Invalidation Strategy

#### 1. Event-Based Invalidation
```typescript
// Automatic cache invalidation on data changes
async function updateClient(clientId: string, data: any) {
  const client = await prisma.client.update({
    where: { id: clientId },
    data
  });

  // Invalidate related caches
  await cache.invalidateClient(clientId, client.organizationId);
  await cache.invalidate('client.update', client.organizationId);

  return client;
}
```

#### 2. Time-Based Invalidation
- Short TTL for real-time data (2-5 minutes)
- Medium TTL for semi-static data (15-30 minutes)
- Long TTL for static data (1+ hours)

#### 3. Manual Invalidation
```typescript
// Force cache refresh for organization
await cache.invalidateOrganization(organizationId);

// Clear all caches
await cache.clearCache();
```

## Connection Pooling

### Configuration

#### PostgreSQL Connection Settings
```typescript
const DATABASE_CONFIG = {
  connectionLimit: 20,        // Max connections
  acquireTimeout: 5000,       // 5 seconds
  connectTimeout: 10000,      // 10 seconds
  idleTimeout: 300000,        // 5 minutes
  reapIntervalMillis: 1000,   // Connection reaper
  createTimeoutMillis: 3000,  // Connection creation timeout
  createRetryIntervalMillis: 200,
  acquireTimeoutMillis: 60000,

  // PostgreSQL specific
  statement_timeout: 30000,   // 30 seconds
  idle_in_transaction_session_timeout: 300000, // 5 minutes
  application_name: 'cpa_platform',
};
```

#### Connection Pool Monitoring
```typescript
// Monitor connection pool health
setInterval(async () => {
  const metrics = await dbHealthMonitor.getConnectionInfo();

  if (metrics.active_connections / metrics.total_connections > 0.8) {
    console.warn('High connection pool utilization:', metrics);
  }
}, 30000);
```

### Best Practices

1. **Use Connection Pooling**: Always use a connection pool in production
2. **Monitor Pool Size**: Track connection utilization and adjust pool size
3. **Handle Connection Errors**: Implement retry logic and graceful degradation
4. **Close Connections**: Ensure connections are properly released
5. **Health Checks**: Regular connection health monitoring

## Data Archiving

### Archival Policies

#### Documents
- **Archive Trigger**: Documents older than 1 year and not in active engagements
- **Storage**: AWS S3 Glacier for cost-effective long-term storage
- **Compression**: Gzip compression for files > 10MB
- **Retention**: 7 years for tax compliance
- **Retrieval**: On-demand with 1-12 hour retrieval time

#### Tasks
- **Archive Trigger**: Completed tasks older than 90 days
- **Storage**: JSON export to S3 with metadata preservation
- **Retention**: 3 years for project history
- **Cleanup**: Soft delete from main tables

#### Invoices
- **Archive Trigger**: Paid invoices older than 1 year
- **Storage**: Maintain in main database but mark as archived
- **Retention**: 7 years for accounting compliance
- **Access**: Read-only access with performance considerations

#### Audit Logs
- **Archive Trigger**: Logs older than 90 days
- **Storage**: Compressed JSON exports to Glacier
- **Retention**: 7 years for compliance audits
- **Cleanup**: Batch deletion from main database

### Implementation

```typescript
// Automated archival process
import { ArchiveService } from './services/archive.service';

const archiver = new ArchiveService(prisma, {
  documents: {
    retentionYears: 7,
    archiveAfterDays: 365,
    compressThresholdMB: 10,
  },
  tasks: {
    archiveCompletedAfterDays: 90,
    deleteArchivedAfterYears: 3,
  },
  invoices: {
    archivePaidAfterDays: 365,
    retentionYears: 7,
  },
});

// Schedule daily archival
cron.schedule('0 2 * * *', async () => {
  const organizations = await prisma.organization.findMany({
    select: { id: true }
  });

  for (const org of organizations) {
    try {
      await archiver.performFullArchival(org.id);
    } catch (error) {
      console.error(`Archival failed for org ${org.id}:`, error);
    }
  }
});
```

## Performance Monitoring

### Key Metrics

#### Database Performance
- **Query Response Time**: < 100ms for 95th percentile
- **Connection Pool Utilization**: < 80%
- **Cache Hit Ratio**: > 95%
- **Index Usage**: Monitor unused indexes
- **Database Size Growth**: Track storage usage

#### Application Performance
- **API Response Time**: < 200ms for 95th percentile
- **Cache Hit Rate**: > 90% for cached queries
- **Memory Usage**: Monitor for memory leaks
- **CPU Utilization**: < 70% average
- **Error Rates**: < 0.1% for database operations

#### Business Metrics
- **Document Processing Time**: < 30 seconds for OCR
- **Report Generation Time**: < 60 seconds for standard reports
- **QuickBooks Sync Time**: < 5 minutes for full sync
- **User Session Duration**: Track engagement
- **Feature Usage**: Monitor performance-critical features

### Monitoring Tools

#### 1. Real-Time Monitoring
```typescript
import { DatabaseMonitorService } from './services/db-monitor.service';

const monitor = new DatabaseMonitorService(prisma, redis);

// Start monitoring
monitor.startMonitoring(60000); // 1-minute intervals

// Listen for alerts
monitor.on('alert', (alert) => {
  console.warn('Database Alert:', alert);

  if (alert.severity === 'critical') {
    // Send notification to ops team
    notificationService.sendAlert(alert);
  }
});

// Listen for slow queries
monitor.on('slow-query', (query) => {
  console.warn('Slow Query Detected:', {
    query: query.query,
    duration: query.avgDuration,
    impact: query.impact,
  });
});
```

#### 2. Performance Dashboard
```typescript
// Get current performance metrics
const metrics = await monitor.getLatestMetrics();

const dashboard = {
  database: {
    size: metrics.storage.databaseSize,
    connections: metrics.connections,
    cacheHitRatio: metrics.performance.cacheHitRatio,
  },
  queries: {
    slowQueries: metrics.slowQueries.length,
    avgQueryTime: metrics.performance.avgQueryTime,
    queriesPerSecond: metrics.performance.queriesPerSecond,
  },
  indexes: {
    unused: metrics.indexUsage.filter(idx => idx.usage === 'unused').length,
    lowUsage: metrics.indexUsage.filter(idx => idx.usage === 'low').length,
  },
};
```

#### 3. Automated Reports
```typescript
// Weekly performance report
cron.schedule('0 9 * * 1', async () => {
  const report = await monitor.generatePerformanceReport();

  const summary = {
    status: report.summary.status,
    totalQueries: report.summary.totalQueries,
    slowQueries: report.summary.slowQueryCount,
    recommendations: report.recommendations,
  };

  await emailService.sendPerformanceReport(summary);
});
```

## Best Practices

### Development Guidelines

#### 1. Query Writing
```typescript
// ✅ Good: Use specific fields and appropriate indexes
const clients = await prisma.client.findMany({
  where: {
    organizationId,
    status: 'active',
    deletedAt: null,
  },
  select: {
    id: true,
    businessName: true,
    status: true,
    primaryContactEmail: true,
  },
  orderBy: { businessName: 'asc' },
  take: 20,
});

// ❌ Bad: Select all fields and no limits
const clients = await prisma.client.findMany({
  where: { organizationId },
  include: { documents: true, engagements: true, invoices: true },
});
```

#### 2. Pagination
```typescript
// ✅ Good: Cursor-based pagination for large datasets
const documents = await prisma.document.findMany({
  where: {
    organizationId,
    ...(cursor && { id: { gt: cursor } }),
  },
  take: limit + 1,
  orderBy: { createdAt: 'desc' },
});

const hasNext = documents.length > limit;
const data = hasNext ? documents.slice(0, -1) : documents;

// ❌ Bad: Offset pagination for large datasets
const documents = await prisma.document.findMany({
  where: { organizationId },
  skip: page * limit,
  take: limit,
});
```

#### 3. Caching
```typescript
// ✅ Good: Cache frequently accessed data
async function getClientMetrics(clientId: string) {
  const cacheKey = `client:${clientId}:metrics`;

  let metrics = await cache.get(cacheKey);
  if (!metrics) {
    metrics = await calculateClientMetrics(clientId);
    await cache.set(cacheKey, metrics, 900); // 15 minutes
  }

  return metrics;
}

// ❌ Bad: Recalculate expensive operations every time
async function getClientMetrics(clientId: string) {
  return await calculateClientMetrics(clientId);
}
```

#### 4. DataLoader Usage
```typescript
// ✅ Good: Use DataLoader to prevent N+1 queries
async function getClientsWithDocuments(clientIds: string[]) {
  const clients = await clientLoader.loadMany(clientIds);
  const documents = await documentsByClientLoader.loadMany(clientIds);

  return clients.map((client, index) => ({
    ...client,
    documents: documents[index],
  }));
}

// ❌ Bad: Individual queries in loop
async function getClientsWithDocuments(clientIds: string[]) {
  const results = [];

  for (const clientId of clientIds) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    const documents = await prisma.document.findMany({ where: { clientId } });
    results.push({ ...client, documents });
  }

  return results;
}
```

### Monitoring Guidelines

#### 1. Set Up Alerts
- **Slow Queries**: > 1 second execution time
- **High Connection Usage**: > 80% of pool
- **Low Cache Hit Ratio**: < 95%
- **Database Size**: Growth rate monitoring
- **Error Rates**: Database connection failures

#### 2. Regular Reviews
- **Weekly**: Performance metrics review
- **Monthly**: Index usage analysis
- **Quarterly**: Capacity planning review
- **Annually**: Full performance audit

#### 3. Optimization Cycles
1. **Identify**: Use monitoring to find bottlenecks
2. **Analyze**: Examine query plans and index usage
3. **Optimize**: Implement improvements
4. **Measure**: Verify performance gains
5. **Document**: Update guidelines and procedures

## Maintenance Procedures

### Daily Tasks

#### 1. Health Checks
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Monitor connection pool
SELECT count(*), state FROM pg_stat_activity WHERE datname = current_database() GROUP BY state;

# Check cache hit ratio
SELECT sum(heap_blks_read) as heap_read, sum(heap_blks_hit) as heap_hit,
       sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;
```

#### 2. Monitor Slow Queries
```sql
-- View slow queries (requires pg_stat_statements)
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY total_time DESC
LIMIT 10;
```

### Weekly Tasks

#### 1. Index Analysis
```sql
-- Check unused indexes
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_total_relation_size(indexrelid) DESC;

-- Check tables with many sequential scans
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan AND n_live_tup > 1000
ORDER BY seq_scan DESC;
```

#### 2. Performance Review
```typescript
// Generate weekly performance report
const report = await monitor.generatePerformanceReport();
console.log('Weekly Performance Summary:', {
  status: report.summary.status,
  slowQueries: report.summary.slowQueryCount,
  recommendations: report.recommendations.length,
});
```

### Monthly Tasks

#### 1. Statistics Update
```sql
-- Update table statistics for query planner
ANALYZE;

-- Vacuum and analyze critical tables
VACUUM ANALYZE clients;
VACUUM ANALYZE documents;
VACUUM ANALYZE tasks;
VACUUM ANALYZE invoices;
VACUUM ANALYZE engagements;
```

#### 2. Index Maintenance
```sql
-- Reindex critical indexes if needed
REINDEX INDEX CONCURRENTLY idx_clients_org_status;
REINDEX INDEX CONCURRENTLY idx_documents_client_category_year;
REINDEX INDEX CONCURRENTLY idx_tasks_assignee_status_priority;
```

#### 3. Archive Old Data
```typescript
// Run monthly archival process
const archiver = new ArchiveService(prisma);

for (const organization of organizations) {
  await archiver.performFullArchival(organization.id);
}
```

### Quarterly Tasks

#### 1. Capacity Planning
- Review database size growth trends
- Analyze query performance trends
- Plan for storage and compute scaling
- Review backup and recovery procedures

#### 2. Index Review
- Identify and remove unused indexes
- Add new indexes based on query patterns
- Optimize existing index structures
- Review and update index usage guidelines

#### 3. Performance Audit
- Comprehensive performance testing
- Review and update performance thresholds
- Update monitoring and alerting rules
- Document lessons learned and improvements

## Scaling Considerations

### Horizontal Scaling

#### 1. Read Replicas
```typescript
// Configure read replica for reporting queries
const readReplica = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_URL }
  }
});

// Use read replica for heavy queries
async function generateReport(organizationId: string) {
  return await readReplica.invoice.findMany({
    where: { organizationId },
    include: { client: true, engagement: true },
  });
}
```

#### 2. Database Sharding
- **By Organization**: Separate databases per large organization
- **By Geography**: Regional database distribution
- **By Feature**: Separate databases for specific features

#### 3. Microservices Architecture
- **Document Service**: Dedicated database for document storage
- **QuickBooks Service**: Separate database for sync data
- **Reporting Service**: Dedicated read-only database
- **Audit Service**: Separate database for compliance data

### Vertical Scaling

#### 1. Hardware Optimization
- **CPU**: Optimize for PostgreSQL workloads
- **Memory**: Size for working set + cache
- **Storage**: Use SSDs for database files
- **Network**: High-bandwidth for distributed setups

#### 2. PostgreSQL Configuration
```sql
-- Optimized PostgreSQL settings for CPA platform
shared_buffers = '256MB'           -- 25% of RAM
effective_cache_size = '1GB'       -- 75% of RAM
work_mem = '4MB'                   -- Per query working memory
maintenance_work_mem = '64MB'      -- Maintenance operations
checkpoint_completion_target = 0.9  -- Checkpoint spreading
wal_buffers = '16MB'               -- WAL write buffer
default_statistics_target = 100    -- Query planner statistics
random_page_cost = 1.1             -- SSD optimization
```

### Cloud Scaling

#### 1. AWS RDS Optimization
- **Multi-AZ**: High availability setup
- **Read Replicas**: Cross-region if needed
- **Performance Insights**: Built-in monitoring
- **Parameter Groups**: Optimized configurations

#### 2. Auto-Scaling Policies
- **Connection Pool**: Scale based on utilization
- **Read Replicas**: Add replicas during peak hours
- **Storage**: Auto-scaling storage allocation
- **Compute**: Scale RDS instance size based on metrics

## Troubleshooting

### Common Performance Issues

#### 1. Slow Queries

**Symptoms:**
- High query execution times
- Increased response times
- Database connection timeouts

**Diagnosis:**
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY total_time DESC;

-- Analyze specific query
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM clients
WHERE organization_id = 'org_123' AND status = 'active';
```

**Solutions:**
- Add appropriate indexes
- Optimize WHERE clauses
- Use covering indexes
- Implement query result caching

#### 2. High Connection Usage

**Symptoms:**
- Connection pool exhaustion
- "Too many connections" errors
- Application timeouts

**Diagnosis:**
```sql
-- Check current connections
SELECT count(*), state
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Find long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

**Solutions:**
- Increase connection pool size
- Optimize query performance
- Implement connection pooling
- Add query timeouts

#### 3. Low Cache Hit Ratio

**Symptoms:**
- High disk I/O
- Slow query performance
- Increased database load

**Diagnosis:**
```sql
-- Check cache hit ratio
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;
```

**Solutions:**
- Increase shared_buffers
- Optimize queries to use indexes
- Implement application-level caching
- Review query patterns

#### 4. Database Size Growth

**Symptoms:**
- Rapid storage consumption
- Slow backup/restore operations
- Performance degradation

**Diagnosis:**
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check largest tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solutions:**
- Implement data archiving
- Add data retention policies
- Optimize data types
- Remove unnecessary indexes

### Performance Testing

#### 1. Load Testing
```typescript
// Load test example using Artillery
const config = {
  target: 'http://localhost:3000',
  phases: [
    { duration: 60, arrivalRate: 10 },   // Warm up
    { duration: 300, arrivalRate: 50 },  // Sustained load
    { duration: 120, arrivalRate: 100 }, // Peak load
  ],
  scenarios: [
    {
      name: 'Client List API',
      weight: 30,
      requests: [
        { get: { url: '/api/clients?page=1&limit=20' } }
      ]
    },
    {
      name: 'Document Search API',
      weight: 25,
      requests: [
        { get: { url: '/api/documents?search=tax&year=2023' } }
      ]
    },
    {
      name: 'Dashboard API',
      weight: 20,
      requests: [
        { get: { url: '/api/dashboard/metrics' } }
      ]
    },
    {
      name: 'Task List API',
      weight: 25,
      requests: [
        { get: { url: '/api/tasks?status=pending&assigned=true' } }
      ]
    }
  ]
};
```

#### 2. Database Benchmarking
```bash
# pgbench for database performance testing
pgbench -c 10 -j 2 -t 1000 your_database

# Custom benchmark script
cat > benchmark.sql << EOF
\set client_id random(1, 1000)
SELECT * FROM clients WHERE id = :client_id;
SELECT * FROM documents WHERE client_id = :client_id LIMIT 10;
SELECT * FROM tasks WHERE client_id = :client_id AND status != 'completed';
EOF

pgbench -c 10 -j 2 -t 100 -f benchmark.sql your_database
```

## Conclusion

This performance optimization guide provides a comprehensive approach to maximizing database performance for the CPA platform. The implemented optimizations include:

1. **Comprehensive Indexing**: Optimized for common query patterns
2. **Query Optimization**: Efficient queries with proper caching
3. **Connection Management**: Optimized connection pooling and monitoring
4. **Data Archiving**: Automated archival for performance and compliance
5. **Performance Monitoring**: Real-time monitoring and alerting
6. **Caching Strategy**: Multi-level caching for optimal performance
7. **DataLoader Pattern**: N+1 query prevention

Regular monitoring, maintenance, and optimization cycles ensure continued performance as the platform scales. The guidelines and procedures documented here should be followed to maintain optimal database performance.

For questions or issues related to database performance, refer to the troubleshooting section or consult the development team.