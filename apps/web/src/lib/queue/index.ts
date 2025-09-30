/**
 * Queue Management Module
 *
 * Provides a unified interface for background job processing using Bull and Redis.
 * All async operations (document processing, emails, reports, etc.) should use this queue system.
 */

export {
  QueueManager,
  getQueueManager,
  initializeQueues,
  closeQueues,
  QUEUE_NAMES,
  type QueueName,
  type QueueStats,
} from './queue-manager';

export {
  JobTracker,
  getJobTracker,
  type JobExecutionStatus,
  type DateRange,
  type JobTypeStatistics,
  type WorkerStatistics,
  type ErrorAnalysis,
} from './job-tracker';

export type {
  DocumentProcessingJobData,
  AIProcessingJobData,
  EmailJobData,
  ReportJobData,
  WebhookJobData,
  IntegrationJobData,
  MaintenanceJobData,
  ScheduledJobData,
} from './job-types';

// Export helper functions
export * from './queue-helpers';