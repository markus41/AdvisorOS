# Queue System Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
# Already installed in package.json
# bull, ioredis, @types/bull, @types/ioredis
```

### 2. Set Environment Variables

```env
REDIS_URL="redis://localhost:6379"
DATABASE_URL="postgresql://user:password@localhost:5432/db"
```

### 3. Run Database Migration

```bash
cd apps/web
npm run db:migrate
```

### 4. Start Redis

```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or use existing Redis instance
```

### 5. Initialize Queue System

```typescript
// In your app startup (e.g., apps/web/src/pages/api/trpc/[trpc].ts)
import { initializeQueues } from '@/lib/queue';

// Initialize once on app startup
await initializeQueues();
```

## Common Use Cases

### Queue Document OCR

```typescript
import { queueDocumentOCR } from '@/lib/queue';

// After document upload
const job = await queueDocumentOCR(documentId, organizationId, {
  language: 'en',
  extractTables: true,
});

console.log('OCR queued:', job.id);
```

### Send Email

```typescript
import { queueEmail } from '@/lib/queue';

await queueEmail({
  organizationId: 'org123',
  type: 'task_assignment',
  to: 'user@example.com',
  subject: 'New Task Assigned',
  templateData: {
    taskTitle: 'Review Q1 Financials',
    dueDate: new Date('2024-04-15'),
  },
  priority: 'high',
});
```

### Generate Report

```typescript
import { queueFinancialReport } from '@/lib/queue';

await queueFinancialReport(
  clientId,
  organizationId,
  {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  },
  'pdf'
);
```

### Process Webhook

```typescript
import { queueStripeWebhook } from '@/lib/queue';

// In webhook handler
export default async function handler(req, res) {
  const event = req.body;

  // Queue webhook processing
  await queueStripeWebhook(
    event.id,
    event.type,
    event,
    organizationId
  );

  res.json({ received: true });
}
```

## Start Workers

### Local Development

```bash
# Terminal 1: Start all workers
cd apps/web
npm run workers:start:all

# Terminal 2: Your Next.js app
npm run dev
```

### Docker

```bash
# Start workers and infrastructure
docker-compose -f docker-compose.worker.yml up -d

# View logs
docker-compose -f docker-compose.worker.yml logs -f worker-primary
```

## Monitor Jobs

### Check Queue Stats

```typescript
import { getQueueManager } from '@/lib/queue';

const queueManager = getQueueManager();
const stats = await queueManager.getQueueStats('document-processing');

console.log('Queue stats:', stats);
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0 }
```

### View Recent Failures

```typescript
import { getJobTracker } from '@/lib/queue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jobTracker = getJobTracker(prisma);

const failures = await jobTracker.getRecentFailures('org123', 10);
failures.forEach(failure => {
  console.log(failure.jobName, failure.errorMessage);
});
```

## Available Helper Functions

### Document Processing
- `queueDocumentOCR()`
- `queueDocumentClassification()`
- `queueDocumentDataExtraction()`
- `queueDocumentVirusScan()`

### AI Processing
- `queueAIInsightsGeneration()`
- `queueFinancialAnalysis()`
- `queueTransactionClassification()`

### Email
- `queueEmail()`
- `queueWelcomeEmail()`
- `queueTaskAssignmentEmail()`
- `queueInvoiceReminderEmail()`

### Reports
- `queueReportGeneration()`
- `queueFinancialReport()`

### Webhooks
- `queueWebhook()`
- `queueStripeWebhook()`
- `queueQuickBooksWebhook()`

### Integrations
- `queueIntegration()`
- `queueQuickBooksSync()`

### Maintenance
- `queueMaintenance()`
- `queueLogCleanup()`
- `queueExpiredLocksCheck()`

### Scheduled
- `queueScheduledJob()`
- `queueDailyReports()`
- `queueInvoiceReminders()`

## Troubleshooting

### Jobs Not Processing

```bash
# Check Redis
redis-cli ping

# Check worker logs
docker-compose -f docker-compose.worker.yml logs worker-primary

# Check queue stats
```

```typescript
const stats = await queueManager.getAllQueueStats();
console.log(stats);
```

### High Failure Rate

```typescript
const errorAnalysis = await jobTracker.getErrorAnalysis('org123');
console.log('Most common errors:', errorAnalysis);
```

### Worker Not Starting

```bash
# Check environment variables
echo $REDIS_URL
echo $DATABASE_URL

# Check Redis connection
redis-cli ping

# Check database connection
npm run db:studio
```

## Best Practices

### ✅ DO

```typescript
// Keep jobs small and focused
await queueDocumentOCR(documentId, organizationId);

// Always include organizationId for multi-tenancy
await queueEmail({ organizationId, type, to, ... });

// Use helper functions for common operations
await queueTaskAssignmentEmail(to, organizationId, taskData);
```

### ❌ DON'T

```typescript
// Don't process 100 documents in one job
// ❌ await queueBulkProcess(100Documents);

// Don't forget organizationId
// ❌ await queueJob({ documentId });

// Don't use queue manager directly for common operations
// ❌ await queueManager.addJob(...)
```

## Next Steps

1. Review [complete documentation](./QUEUE_SYSTEM.md)
2. Implement job processors with Azure AI integration
3. Add error monitoring and alerting
4. Set up production Redis with TLS
5. Configure automatic scaling

## Support

- Documentation: `docs/QUEUE_SYSTEM.md`
- Example Code: `apps/web/src/lib/queue/queue-helpers.ts`
- Worker Code: `apps/web/src/workers/`
- Issue Tracker: GitHub Issues