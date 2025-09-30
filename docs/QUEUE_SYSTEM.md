# Background Job Queue System

## Overview

AdvisorOS uses a sophisticated background job processing system powered by Bull and Redis to handle asynchronous operations efficiently. The system provides reliable, scalable, and monitored job processing for all async workflows.

## Architecture

### Queue Infrastructure

- **Queue Manager**: Central manager for all Bull queues
- **9 Specialized Queues**: Each optimized for specific workload patterns
- **Job Tracker**: Database-backed execution tracking for monitoring
- **Worker Processes**: Isolated workers for parallel processing

### Queue Types

#### 1. Critical Queue (`critical`)
**Purpose**: High-priority system operations requiring immediate attention

**Concurrency**: 10
**Priority**: 1 (Highest)
**Retry**: 5 attempts with exponential backoff
**Timeout**: 5 minutes

**Use Cases**:
- Emergency notifications
- Security alerts
- System health checks

#### 2. Document Processing Queue (`document-processing`)
**Purpose**: OCR, classification, and data extraction from documents

**Concurrency**: 8
**Priority**: 2
**Rate Limit**: 20 jobs per second (Azure AI limits)
**Retry**: 3 attempts
**Timeout**: 5 minutes

**Use Cases**:
- OCR processing
- Document classification
- Form data extraction
- Virus scanning
- Thumbnail generation

#### 3. AI Processing Queue (`ai-processing`)
**Purpose**: Machine learning and AI-powered operations

**Concurrency**: 5
**Priority**: 2
**Rate Limit**: 10 jobs per minute (Azure OpenAI limits)
**Retry**: 3 attempts
**Timeout**: 10 minutes

**Use Cases**:
- Financial insights generation
- Transaction classification
- Cash flow prediction
- Anomaly detection

#### 4. Reports Queue (`reports`)
**Purpose**: Report generation and data exports

**Concurrency**: 5
**Priority**: 3
**Retry**: 3 attempts
**Timeout**: 10 minutes

**Use Cases**:
- Financial reports
- Tax summaries
- Client overviews
- Custom reports (PDF, Excel, CSV)

#### 5. Emails Queue (`emails`)
**Purpose**: Email notifications and communications

**Concurrency**: 10
**Priority**: 3
**Rate Limit**: 100 emails per minute
**Retry**: 5 attempts with exponential backoff
**Timeout**: 30 seconds

**Use Cases**:
- Welcome emails
- Task assignments
- Invoice reminders
- Document sharing notifications
- Report delivery

#### 6. Webhooks Queue (`webhooks`)
**Purpose**: External webhook processing

**Concurrency**: 15
**Priority**: 3
**Retry**: 5 attempts
**Timeout**: 30 seconds

**Use Cases**:
- Stripe webhook events
- QuickBooks webhook events
- Custom webhook integrations

#### 7. Integrations Queue (`integrations`)
**Purpose**: Third-party service integrations

**Concurrency**: 5
**Priority**: 3
**Rate Limit**: 30 jobs per minute
**Retry**: 3 attempts
**Timeout**: 2 minutes

**Use Cases**:
- QuickBooks data sync
- Stripe operations
- Azure AI service calls

#### 8. Maintenance Queue (`maintenance`)
**Purpose**: System maintenance and cleanup tasks

**Concurrency**: 2
**Priority**: 4
**Retry**: 2 attempts
**Timeout**: 30 minutes

**Use Cases**:
- Log cleanup
- Database optimization
- Cache clearing
- Expired lock cleanup

#### 9. Scheduled Queue (`scheduled`)
**Purpose**: Cron-like scheduled tasks

**Concurrency**: 1
**Priority**: 5
**Retry**: 2 attempts
**Timeout**: 10 minutes

**Use Cases**:
- Daily reports
- Invoice reminders
- Task reminders
- Data synchronization

## Usage

### Adding Jobs to Queues

#### Using Helper Functions (Recommended)

```typescript
import { queueDocumentOCR, queueEmail, queueFinancialReport } from '@/lib/queue';

// Queue document OCR processing
await queueDocumentOCR(documentId, organizationId, {
  language: 'en',
  extractTables: true,
});

// Queue email
await queueEmail({
  organizationId,
  type: 'task_assignment',
  to: 'user@example.com',
  templateData: { taskTitle: 'Review Q1 Financials' },
});

// Queue report generation
await queueFinancialReport(clientId, organizationId, {
  start: new Date('2024-01-01'),
  end: new Date('2024-03-31'),
}, 'pdf');
```

#### Using Queue Manager Directly

```typescript
import { getQueueManager, QUEUE_NAMES } from '@/lib/queue';

const queueManager = getQueueManager();

await queueManager.addJob(
  QUEUE_NAMES.DOCUMENT_PROCESSING,
  'document:ocr',
  {
    documentId: 'doc123',
    organizationId: 'org456',
    operation: 'ocr',
  }
);
```

### Scheduled Jobs

```typescript
import { getQueueManager, QUEUE_NAMES } from '@/lib/queue';

const queueManager = getQueueManager();

// Schedule a job for future execution
await queueManager.addScheduledJob(
  QUEUE_NAMES.REPORTS,
  'report:monthly',
  { clientId: 'client123', organizationId: 'org456' },
  new Date('2024-04-01 09:00:00')
);

// Create repeatable job (cron-like)
await queueManager.addRepeatableJob(
  QUEUE_NAMES.SCHEDULED,
  'scheduled:daily_reports',
  { organizationId: 'system' },
  '0 9 * * *' // Every day at 9 AM
);
```

## Worker Deployment

### Local Development

```bash
# Start all infrastructure (Redis, PostgreSQL)
npm run dev:start

# Start workers (all types)
WORKER_TYPE=all npm run workers:start

# Or start specific worker type
WORKER_TYPE=primary npm run workers:start
WORKER_TYPE=document npm run workers:start
WORKER_TYPE=ai npm run workers:start
```

### Docker Deployment

```bash
# Start all workers with Docker Compose
docker-compose -f docker-compose.worker.yml up -d

# Start specific worker
docker-compose -f docker-compose.worker.yml up -d worker-document

# View worker logs
docker-compose -f docker-compose.worker.yml logs -f worker-primary

# Stop all workers
docker-compose -f docker-compose.worker.yml down
```

### Production Deployment

#### Environment Variables

Required environment variables for workers:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_URL=redis://host:6379

# Worker Configuration
WORKER_TYPE=primary  # or document, ai, scheduled
WORKER_ID=worker-1
WORKER_CONCURRENCY=10

# Azure AI Services (for document/AI workers)
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_FORM_RECOGNIZER_KEY=your-key
AZURE_FORM_RECOGNIZER_ENDPOINT=https://your-resource.cognitiveservices.azure.com/

# Email (for primary/scheduled workers)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Azure Storage (for document workers)
AZURE_STORAGE_ACCOUNT_NAME=your-account
AZURE_STORAGE_ACCOUNT_KEY=your-key
AZURE_STORAGE_CONTAINER_NAME=documents
```

#### Azure Container Instances

```bash
# Build and push worker image
docker build -f docker/Dockerfile.worker -t advisoros-worker:latest .
docker tag advisoros-worker:latest yourregistry.azurecr.io/advisoros-worker:latest
docker push yourregistry.azurecr.io/advisoros-worker:latest

# Deploy to Azure Container Instances
az container create \
  --resource-group advisoros-rg \
  --name advisoros-worker-primary \
  --image yourregistry.azurecr.io/advisoros-worker:latest \
  --cpu 2 \
  --memory 2 \
  --environment-variables \
    WORKER_TYPE=primary \
    WORKER_ID=primary-1 \
    DATABASE_URL=$DATABASE_URL \
    REDIS_URL=$REDIS_URL
```

## Monitoring

### Queue Statistics

```typescript
import { getQueueManager } from '@/lib/queue';

const queueManager = getQueueManager();

// Get stats for a specific queue
const stats = await queueManager.getQueueStats('document-processing');
console.log(stats);
// {
//   waiting: 15,
//   active: 5,
//   completed: 1234,
//   failed: 12,
//   delayed: 3
// }

// Get stats for all queues
const allStats = await queueManager.getAllQueueStats();
```

### Job Execution Tracking

```typescript
import { getJobTracker } from '@/lib/queue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jobTracker = getJobTracker(prisma);

// Get job statistics for an organization
const stats = await jobTracker.getJobStatistics(
  organizationId,
  {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  }
);

// Get recent failures
const failures = await jobTracker.getRecentFailures(organizationId, 50);

// Get error analysis
const errorAnalysis = await jobTracker.getErrorAnalysis(organizationId);

// Get slow jobs (> 1 minute)
const slowJobs = await jobTracker.getSlowJobs(60000, organizationId);

// Get worker performance statistics
const workerStats = await jobTracker.getWorkerStatistics();
```

### Health Checks

```typescript
import { getWorkerManager } from '@/workers';

const workerManager = getWorkerManager();

const health = await workerManager.getHealthStatus();
console.log(health);
// {
//   isRunning: true,
//   workers: [
//     { queueName: 'critical', isActive: true },
//     { queueName: 'emails', isActive: true },
//     ...
//   ]
// }
```

## Error Handling

### Automatic Retries

Jobs automatically retry based on their queue configuration:

- **Critical**: 5 attempts with exponential backoff (2s, 4s, 8s, 16s, 32s)
- **Document/AI/Integrations**: 3 attempts with exponential backoff
- **Emails/Webhooks**: 5 attempts with exponential backoff
- **Reports**: 3 attempts with fixed 30s delay
- **Maintenance/Scheduled**: 2 attempts with fixed delay

### Manual Retry

```typescript
import { getQueueManager } from '@/lib/queue';

const queueManager = getQueueManager();

// Retry a specific failed job
await queueManager.retryJob('document-processing', 'job-id-123');

// Get and retry all failed jobs
const failedJobs = await queueManager.getFailedJobs('document-processing');
for (const job of failedJobs) {
  await queueManager.retryJob('document-processing', job.id);
}
```

### Error Tracking

All errors are tracked in the `job_executions` table with:
- Error message
- Stack trace
- Error code (categorized)
- Attempt count
- Job input parameters

## Scaling

### Horizontal Scaling

Deploy multiple worker instances for increased throughput:

```bash
# Deploy 3 document processing workers
docker-compose -f docker-compose.worker.yml up -d --scale worker-document=3

# Deploy 2 AI processing workers
docker-compose -f docker-compose.worker.yml up -d --scale worker-ai=2
```

### Vertical Scaling

Adjust worker concurrency:

```env
# Increase document worker concurrency
WORKER_CONCURRENCY=16
```

### Tax Season Scaling

During peak periods (January-April):

1. Scale document workers: 3-5 instances
2. Scale AI workers: 2-3 instances
3. Increase primary worker concurrency to 20
4. Monitor Redis memory and scale if needed

## Best Practices

### 1. Job Size

Keep jobs small and focused:
- ✅ Process one document per job
- ❌ Process 100 documents in one job

### 2. Idempotency

Make job processors idempotent - they should be safe to retry:

```typescript
export async function processDocumentJob(job: Job): Promise<any> {
  const { documentId } = job.data;

  // Check if already processed
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (document.ocrProcessedAt) {
    console.log('Document already processed, skipping');
    return { skipped: true };
  }

  // Process document...
}
```

### 3. Error Handling

Always wrap job logic in try-catch:

```typescript
export async function processJob(job: Job): Promise<any> {
  try {
    // Job logic
    return result;
  } catch (error) {
    console.error('Job processing error:', error);
    throw error; // Let Bull handle retry logic
  }
}
```

### 4. Logging

Use structured logging with context:

```typescript
console.log(`Processing document job`, {
  jobId: job.id,
  documentId: job.data.documentId,
  organizationId: job.data.organizationId,
  attempt: job.attemptsMade + 1,
});
```

### 5. Multi-Tenancy

Always validate organization access:

```typescript
const document = await prisma.document.findFirst({
  where: {
    id: documentId,
    organizationId: job.data.organizationId, // IMPORTANT
  },
});

if (!document) {
  throw new Error('Document not found or access denied');
}
```

## Troubleshooting

### Jobs Not Processing

1. Check Redis connection:
   ```bash
   redis-cli ping
   ```

2. Check worker logs:
   ```bash
   docker-compose logs -f worker-primary
   ```

3. Check queue statistics:
   ```typescript
   const stats = await queueManager.getQueueStats('document-processing');
   ```

### High Failure Rate

1. Check error analysis:
   ```typescript
   const errors = await jobTracker.getErrorAnalysis(organizationId);
   ```

2. Review recent failures:
   ```typescript
   const failures = await jobTracker.getRecentFailures(organizationId, 50);
   ```

3. Check external service status (Azure AI, email provider, etc.)

### Memory Issues

1. Monitor Redis memory:
   ```bash
   redis-cli info memory
   ```

2. Clean old completed jobs:
   ```typescript
   await queueManager.cleanQueue('document-processing', 5000, 'completed');
   ```

3. Reduce worker concurrency temporarily

### Slow Processing

1. Identify slow jobs:
   ```typescript
   const slowJobs = await jobTracker.getSlowJobs(60000); // > 1 minute
   ```

2. Check performance metrics:
   ```typescript
   const metrics = await jobTracker.getPerformanceMetrics(organizationId);
   ```

3. Consider horizontal scaling for specific queue

## Security Considerations

1. **Multi-Tenancy**: All jobs include `organizationId` and validate access
2. **Sensitive Data**: Job data is encrypted in Redis (configure Redis with TLS)
3. **Audit Trail**: All job executions tracked in database
4. **Rate Limiting**: Prevents abuse and respects external API limits
5. **Worker Isolation**: Workers run as non-root users in containers

## Maintenance

### Database Cleanup

```typescript
import { getJobTracker } from '@/lib/queue';

const jobTracker = getJobTracker(prisma);

// Clean up job executions older than 90 days
await jobTracker.cleanupOldExecutions(90);
```

### Queue Cleanup

```typescript
import { getQueueManager } from '@/lib/queue';

const queueManager = getQueueManager();

// Clean completed jobs older than 5 seconds
await queueManager.cleanQueue('document-processing', 5000, 'completed');

// Clean failed jobs older than 1 hour
await queueManager.cleanQueue('document-processing', 3600000, 'failed');
```

## Future Enhancements

- [ ] Queue priority inheritance for related jobs
- [ ] Job result caching for expensive operations
- [ ] Real-time dashboard for queue monitoring
- [ ] Automatic scaling based on queue depth
- [ ] Job scheduling with timezone support
- [ ] Batch job processing for bulk operations
- [ ] Job dependency chains and workflows