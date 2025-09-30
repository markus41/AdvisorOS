# Database Replica Router - Implementation Guide

## Overview

The Database Replica Router provides intelligent query routing across primary and replica databases to optimize performance, distribute load, and improve application scalability.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Application Layer                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│           DatabaseRouter (replica-router.ts)         │
│  - Health Monitoring                                 │
│  - Load Balancing                                    │
│  - Automatic Failover                                │
└──────┬────────┬────────┬─────────────────────────┬──┘
       │        │        │                         │
       ▼        ▼        ▼                         ▼
   ┌────────┐ ┌─────────┐ ┌──────────┐  ┌──────────────┐
   │Primary │ │Analytics│ │Background│  │ DR Replica   │
   │Database│ │ Replica │ │ Replica  │  │(Cross-region)│
   └────────┘ └─────────┘ └──────────┘  └──────────────┘
     (writes)  (analytics)  (jobs)        (failover)
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Primary database (required)
DATABASE_URL="postgresql://user:pass@primary-host:5432/advisoros"

# Analytics replica (optional - for reporting/dashboards)
DATABASE_READ_REPLICA_1_URL="postgresql://user:pass@replica-1:5432/advisoros"

# Background jobs replica (optional - for queue processing)
DATABASE_READ_REPLICA_2_URL="postgresql://user:pass@replica-2:5432/advisoros"

# Disaster recovery replica (optional - cross-region)
DATABASE_READ_REPLICA_DR_URL="postgresql://user:pass@dr-replica:5432/advisoros"
```

## Usage Examples

### Basic Operations

```typescript
import { dbRouter } from '@/lib/database/replica-router'

// Write operations (always routed to primary)
export async function createClient(data: CreateClientInput, orgId: string) {
  return await dbRouter.getClient('write').client.create({
    data: {
      ...data,
      organizationId: orgId
    }
  })
}

// Read operations (load balanced across replicas)
export async function getClient(clientId: string) {
  return await dbRouter.getClient('read').client.findUnique({
    where: { id: clientId }
  })
}

// Heavy analytics queries (routed to analytics replica)
export async function getMonthlyRevenueReport(orgId: string, year: number) {
  return await dbRouter.getClient('analytics').invoice.groupBy({
    by: ['status'],
    where: {
      organizationId: orgId,
      invoiceDate: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`)
      }
    },
    _sum: {
      totalAmount: true
    }
  })
}

// Background job queries (routed to background replica)
export async function getFailedJobs() {
  return await dbRouter.getClient('background').jobExecution.findMany({
    where: {
      status: 'failed',
      attempts: {
        lt: 3
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
}
```

### tRPC Procedure Integration

```typescript
import { dbRouter } from '@/lib/database/replica-router'
import { createTRPCRouter, organizationProcedure } from '../trpc'
import { z } from 'zod'

export const clientRouter = createTRPCRouter({
  // Write operation - always primary
  create: organizationProcedure
    .input(z.object({
      businessName: z.string(),
      primaryContactEmail: z.string().email()
    }))
    .mutation(async ({ ctx, input }) => {
      return await dbRouter.getClient('write').client.create({
        data: {
          ...input,
          organizationId: ctx.organizationId
        }
      })
    }),

  // Read operation - replica
  getById: organizationProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await dbRouter.getClient('read').client.findUnique({
        where: {
          id: input.id,
          organizationId: ctx.organizationId
        }
      })
    }),

  // Analytics query - analytics replica
  getRevenueByIndustry: organizationProcedure
    .query(async ({ ctx }) => {
      return await dbRouter.getClient('analytics').client.groupBy({
        by: ['industry'],
        where: {
          organizationId: ctx.organizationId,
          status: 'active'
        },
        _sum: {
          annualRevenue: true
        },
        _count: true
      })
    })
})
```

### Service Layer Integration

```typescript
// apps/web/src/server/services/document.service.ts
import { dbRouter } from '@/lib/database/replica-router'

export class DocumentService {
  // Write operation
  static async createDocument(data: CreateDocumentInput) {
    const db = dbRouter.getClient('write')

    return await db.document.create({
      data: {
        ...data,
        ocrStatus: 'pending'
      }
    })
  }

  // Read operation with caching
  static async getDocument(documentId: string) {
    const db = dbRouter.getClient('read')

    return await db.document.findUnique({
      where: { id: documentId },
      include: {
        client: true,
        processing: true
      }
    })
  }

  // Analytics query
  static async getDocumentStatsByCategory(orgId: string) {
    const db = dbRouter.getClient('analytics')

    return await db.document.groupBy({
      by: ['category', 'ocrStatus'],
      where: {
        organizationId: orgId,
        deletedAt: null
      },
      _count: true
    })
  }
}
```

### Transaction Handling

For operations requiring transactions, always use the primary database:

```typescript
import { withTransaction } from '@/lib/database/replica-router'

export async function processInvoicePayment(
  invoiceId: string,
  paymentAmount: number
) {
  return await withTransaction(async (tx) => {
    // Update invoice
    const invoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: {
          increment: paymentAmount
        },
        balanceAmount: {
          decrement: paymentAmount
        },
        status: 'paid'
      }
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'payment_processed',
        entityType: 'invoice',
        entityId: invoiceId,
        newValues: {
          paymentAmount,
          newBalance: invoice.balanceAmount
        },
        organizationId: invoice.organizationId
      }
    })

    return invoice
  })
}
```

### Background Job Processing

```typescript
// apps/web/src/workers/document-processor.ts
import { dbRouter } from '@/lib/database/replica-router'

export async function processOCRQueue() {
  // Use background replica for job queries
  const db = dbRouter.getClient('background')

  const pendingDocuments = await db.document.findMany({
    where: {
      ocrStatus: 'pending'
    },
    take: 10,
    orderBy: {
      createdAt: 'asc'
    }
  })

  for (const doc of pendingDocuments) {
    // Process document...

    // Write result to primary
    await dbRouter.getClient('write').document.update({
      where: { id: doc.id },
      data: {
        ocrStatus: 'completed',
        ocrProcessedAt: new Date()
      }
    })
  }
}
```

## Monitoring & Health Checks

### Get Router Metrics

```typescript
import { dbRouter } from '@/lib/database/replica-router'

// Get routing statistics
const metrics = dbRouter.getMetrics()
console.log('Queries routed:', metrics.queriesRouted)
console.log('Failovers:', metrics.failovers)
console.log('Average latency:', metrics.averageLatency)
console.log('Last health check:', metrics.lastHealthCheck)
```

### Get Health Status

```typescript
import { dbRouter } from '@/lib/database/replica-router'

// Get health status of all connections
const healthStatus = dbRouter.getHealthStatus()

for (const [name, health] of healthStatus.entries()) {
  console.log(`${name}:`, {
    healthy: health.isHealthy,
    latency: `${health.latencyMs.toFixed(2)}ms`,
    replicationLag: health.replicationLag
      ? `${health.replicationLag.toFixed(0)}ms`
      : 'N/A'
  })
}
```

### Create Health Check Endpoint

```typescript
// apps/web/src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { dbRouter } from '@/lib/database/replica-router'

export async function GET() {
  const healthStatus = dbRouter.getHealthStatus()
  const metrics = dbRouter.getMetrics()

  const status = {
    timestamp: new Date().toISOString(),
    databases: Object.fromEntries(healthStatus),
    metrics: {
      totalQueries: Object.values(metrics.queriesRouted).reduce((a, b) => a + b, 0),
      failovers: metrics.failovers,
      lastHealthCheck: metrics.lastHealthCheck
    }
  }

  const allHealthy = Array.from(healthStatus.values()).every(h => h.isHealthy)

  return NextResponse.json(status, {
    status: allHealthy ? 200 : 503
  })
}
```

## Best Practices

### 1. Operation Type Selection

| Operation Type | Use Case | Routed To |
|---------------|----------|-----------|
| `write` | All CREATE, UPDATE, DELETE | Primary only |
| `transactional` | Multi-step operations requiring ACID | Primary only |
| `read` | Simple SELECT queries | Load balanced replicas |
| `analytics` | Heavy aggregations, reports, dashboards | Analytics replica |
| `background` | Job queue processing, scheduled tasks | Background replica |

### 2. When to Use Primary

Always use primary for:
- Write operations (CREATE, UPDATE, DELETE)
- Transactions
- Real-time data requirements (e.g., just-created records)
- Strong consistency requirements
- Row-level locking

### 3. When to Use Replicas

Use replicas for:
- Read-heavy operations
- Analytics and reporting
- Background job processing
- List/search operations
- Dashboard data (with acceptable eventual consistency)

### 4. Handling Replication Lag

```typescript
// For critical reads that need latest data, use primary
export async function getRecentInvoice(invoiceId: string) {
  // This invoice might have just been created
  // Use primary to ensure we get the latest data
  return await dbRouter.getClient('write').invoice.findUnique({
    where: { id: invoiceId }
  })
}

// For non-critical reads, replica is fine
export async function listInvoices(orgId: string) {
  // List view can tolerate slight delay
  return await dbRouter.getClient('read').invoice.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' }
  })
}
```

## Troubleshooting

### High Failover Rate

If you see high failover rates in metrics:

1. Check replication lag: `SELECT * FROM pg_stat_replication;`
2. Verify network connectivity to replicas
3. Check replica server resources (CPU, memory, disk I/O)
4. Review health check logs for errors

### Inconsistent Data

If replicas show stale data:

1. Check replication lag is within acceptable range (<5 seconds)
2. Use primary for critical real-time data
3. Implement retry logic with exponential backoff
4. Consider using primary for user-initiated actions

### Performance Issues

If replica routing doesn't improve performance:

1. Verify replicas are properly configured
2. Check if replicas have same indexes as primary
3. Monitor query execution plans with EXPLAIN ANALYZE
4. Consider adjusting connection pool sizes

## Maintenance

### Adding a New Replica

1. Update `.env` with new replica connection string
2. Restart application
3. DatabaseRouter will automatically detect and use new replica
4. Monitor health checks to verify connectivity

### Removing a Replica

1. Remove replica connection string from `.env`
2. Restart application
3. Router will automatically fail over to remaining replicas/primary

### Failover Testing

```typescript
// Force failover to primary (for testing)
await dbRouter.forceFailoverToPrimary()

// Wait for health checks to restore replica connections
await new Promise(resolve => setTimeout(resolve, 10000))

// Verify replicas are restored
console.log(dbRouter.getHealthStatus())
```

## Production Deployment Checklist

- [ ] Configure all replica connection strings in production environment
- [ ] Set up monitoring for replication lag
- [ ] Set up alerts for high failover rates
- [ ] Configure health check endpoints
- [ ] Test failover scenarios
- [ ] Document rollback procedures
- [ ] Train team on replica usage patterns
- [ ] Review query patterns and optimize routing
- [ ] Set up connection pooling (PgBouncer recommended)
- [ ] Monitor database connection counts

## Support

For issues or questions:
1. Check application logs for DatabaseRouter warnings
2. Review health check endpoint: `/api/health`
3. Monitor metrics dashboard
4. Contact database team for replication issues