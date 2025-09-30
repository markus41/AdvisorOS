# Database Quick Start Guide

## For Immediate Use

### 1. Setup Database (First Time)

```bash
# Navigate to web app
cd apps/web

# Copy environment template
cp ../../.env.example .env

# Update DATABASE_URL in .env with your PostgreSQL connection
# Example: DATABASE_URL="postgresql://user:password@localhost:5432/advisoros"

# Run all migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) Open Prisma Studio to inspect database
npm run db:studio
```

### 2. Using DatabaseRouter in Your Code

```typescript
import { dbRouter } from '@/lib/database/replica-router'

// WRITE operations (CREATE, UPDATE, DELETE)
const client = await dbRouter.getClient('write').client.create({
  data: {
    businessName: "Acme Corp",
    organizationId: orgId
  }
})

// READ operations (SELECT)
const clients = await dbRouter.getClient('read').client.findMany({
  where: { organizationId: orgId }
})

// ANALYTICS queries (heavy aggregations)
const revenue = await dbRouter.getClient('analytics').invoice.groupBy({
  by: ['status'],
  _sum: { totalAmount: true }
})

// BACKGROUND jobs
const failedJobs = await dbRouter.getClient('background').jobExecution.findMany({
  where: { status: 'failed' }
})
```

### 3. Migration Workflow

```bash
# Make changes to schema.prisma
# Then create migration:
npm run db:migrate

# Push changes without creating migration (development only):
npm run db:push

# Reset database (WARNING: deletes all data):
npx prisma migrate reset
```

## Key Tables Quick Reference

### Core Tables
- `organizations` - Multi-tenant root
- `users` - Team members & client portal users
- `clients` - CPA clients
- `documents` - File storage with OCR
- `engagements` - Client service projects
- `tasks` - Work items
- `invoices` - Billing
- `audit_logs` - Compliance trail

### New Critical Tables
- `document_processing` - OCR pipeline status
- `document_embeddings` - AI semantic search (pgvector)
- `job_executions` - Background job tracking
- `document_sessions` - Real-time collaboration
- `api_usage_metrics` - Rate limiting data
- `webhook_deliveries` - Integration reliability

## Common Patterns

### Multi-Tenant Queries
```typescript
// ALWAYS include organizationId for tenant isolation
const documents = await db.document.findMany({
  where: {
    organizationId: ctx.organizationId, // Required!
    category: 'tax_return'
  }
})
```

### Transactions
```typescript
import { withTransaction } from '@/lib/database/replica-router'

const result = await withTransaction(async (tx) => {
  const invoice = await tx.invoice.update({...})
  await tx.auditLog.create({...})
  return invoice
})
```

### Error Handling
```typescript
try {
  const client = await dbRouter.getClient('write').client.create({...})
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
  } else if (error.code === 'P2003') {
    // Foreign key constraint violation
  }
  throw error
}
```

## Performance Tips

1. **Use the right replica type**:
   - `write` - All modifications
   - `read` - Simple lookups
   - `analytics` - Reports, dashboards
   - `background` - Job processing

2. **Add indexes for new query patterns**:
   ```sql
   CREATE INDEX idx_your_table_columns
     ON your_table(column1, column2);
   ```

3. **Use partitioned tables for time-series**:
   - `audit_logs_partitioned` (monthly partitions)
   - `documents_partitioned` (yearly partitions)

4. **Leverage existing indexes**:
   - Check `DATABASE_FOUNDATION_REPORT.md` for full index list
   - Use EXPLAIN ANALYZE to verify index usage

## Troubleshooting

### Migration fails
```bash
# Check what went wrong
npm run db:migrate

# If needed, manually rollback using rollback.sql
psql $DATABASE_URL -f apps/web/prisma/migrations/[migration]/rollback.sql

# Then fix schema and try again
npm run db:migrate
```

### Replica connection issues
```typescript
// Check health status
const health = dbRouter.getHealthStatus()
console.log(health)

// Force failover if needed
await dbRouter.forceFailoverToPrimary()
```

### Query is slow
```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM documents
WHERE organization_id = 'org_123'
  AND ocr_status = 'pending';

-- Should show "Index Scan" not "Seq Scan"
```

## Files You'll Need

### Development
- `apps/web/prisma/schema.prisma` - Schema definitions
- `apps/web/src/lib/database/replica-router.ts` - Database routing
- `.env` - Connection strings

### Documentation
- `DATABASE_FOUNDATION_REPORT.md` - Complete technical documentation
- `apps/web/src/lib/database/README.md` - DatabaseRouter guide
- Migration files in `apps/web/prisma/migrations/`

## Health Check Endpoint

```typescript
// apps/web/src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { dbRouter } from '@/lib/database/replica-router'

export async function GET() {
  const health = dbRouter.getHealthStatus()
  const metrics = dbRouter.getMetrics()

  return NextResponse.json({
    databases: Object.fromEntries(health),
    metrics: {
      totalQueries: Object.values(metrics.queriesRouted).reduce((a,b) => a+b, 0),
      failovers: metrics.failovers
    }
  })
}
```

## Testing

```typescript
// Always use primary database in tests
process.env.NODE_ENV = 'test'

// Clean up after tests
afterAll(async () => {
  await dbRouter.disconnect()
})
```

## Production Checklist

- [ ] All migrations tested on staging
- [ ] Replica connection strings configured
- [ ] Health check endpoint working
- [ ] Monitoring alerts set up
- [ ] Backup strategy in place
- [ ] Rollback procedures documented
- [ ] Team trained on DatabaseRouter usage

## Quick Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open database GUI
npm run db:studio

# Push schema changes (dev only)
npm run db:push

# Check migration status
npx prisma migrate status

# Create new migration
npx prisma migrate dev --name your_migration_name
```

## Support

- **Schema questions**: Check `schema.prisma`
- **Query optimization**: Review `DATABASE_FOUNDATION_REPORT.md`
- **Replica routing**: See `apps/web/src/lib/database/README.md`
- **Emergency**: Check `/api/health` endpoint and logs

---

**Remember**:
1. Always include `organizationId` for multi-tenant security
2. Use appropriate replica type for optimal performance
3. Test migrations on staging first
4. Monitor health checks in production

**Need help?** Review the full `DATABASE_FOUNDATION_REPORT.md` for comprehensive documentation.