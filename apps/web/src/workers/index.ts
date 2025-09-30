/**
 * Worker Process Manager
 *
 * Manages all Bull queue workers for background job processing.
 * Supports multiple worker types with graceful shutdown and health monitoring.
 */

import Bull, { Job, Worker } from 'bull';
import { PrismaClient } from '@prisma/client';
import { getQueueManager, QUEUE_NAMES } from '../lib/queue/queue-manager';
import { getJobTracker } from '../lib/queue/job-tracker';

// Job processors
import { processDocumentJob } from './processors/document-processor';
import { processAIJob } from './processors/ai-processor';
import { processEmailJob } from './processors/email-processor';
import { processReportJob } from './processors/report-processor';
import { processWebhookJob } from './processors/webhook-processor';
import { processIntegrationJob } from './processors/integration-processor';
import { processMaintenanceJob } from './processors/maintenance-processor';
import { processScheduledJob } from './processors/scheduled-processor';
import { processCriticalJob } from './processors/critical-processor';

/**
 * Worker configuration
 */
interface WorkerConfig {
  queueName: string;
  concurrency: number;
  processor: (job: Job) => Promise<any>;
}

/**
 * WorkerManager - Manages all worker processes
 */
export class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private prisma: PrismaClient;
  private isRunning = false;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Start all workers based on worker type from environment
   */
  async startWorkers(): Promise<void> {
    if (this.isRunning) {
      console.warn('Workers already running');
      return;
    }

    const workerType = process.env.WORKER_TYPE || 'primary';
    console.log(`Starting workers for type: ${workerType}`);

    try {
      // Initialize queue manager
      const queueManager = getQueueManager();
      await queueManager.initialize();

      // Start workers based on type
      switch (workerType) {
        case 'primary':
          await this.startPrimaryWorkers();
          break;
        case 'document':
          await this.startDocumentWorker();
          break;
        case 'ai':
          await this.startAIWorker();
          break;
        case 'scheduled':
          await this.startScheduledWorker();
          break;
        case 'all':
          await this.startAllWorkers();
          break;
        default:
          throw new Error(`Unknown worker type: ${workerType}`);
      }

      this.isRunning = true;
      console.log(`Workers started successfully (type: ${workerType})`);
    } catch (error) {
      console.error('Failed to start workers:', error);
      throw error;
    }
  }

  /**
   * Start primary workers (handles general tasks)
   */
  private async startPrimaryWorkers(): Promise<void> {
    const configs: WorkerConfig[] = [
      {
        queueName: QUEUE_NAMES.CRITICAL,
        concurrency: 10,
        processor: processCriticalJob,
      },
      {
        queueName: QUEUE_NAMES.EMAILS,
        concurrency: 10,
        processor: processEmailJob,
      },
      {
        queueName: QUEUE_NAMES.WEBHOOKS,
        concurrency: 15,
        processor: processWebhookJob,
      },
      {
        queueName: QUEUE_NAMES.REPORTS,
        concurrency: 5,
        processor: processReportJob,
      },
    ];

    await this.startWorkerGroup(configs);
  }

  /**
   * Start document processing worker
   */
  private async startDocumentWorker(): Promise<void> {
    const configs: WorkerConfig[] = [
      {
        queueName: QUEUE_NAMES.DOCUMENT_PROCESSING,
        concurrency: 8,
        processor: processDocumentJob,
      },
    ];

    await this.startWorkerGroup(configs);
  }

  /**
   * Start AI processing worker
   */
  private async startAIWorker(): Promise<void> {
    const configs: WorkerConfig[] = [
      {
        queueName: QUEUE_NAMES.AI_PROCESSING,
        concurrency: 5,
        processor: processAIJob,
      },
    ];

    await this.startWorkerGroup(configs);
  }

  /**
   * Start scheduled job worker
   */
  private async startScheduledWorker(): Promise<void> {
    const configs: WorkerConfig[] = [
      {
        queueName: QUEUE_NAMES.SCHEDULED,
        concurrency: 1,
        processor: processScheduledJob,
      },
      {
        queueName: QUEUE_NAMES.MAINTENANCE,
        concurrency: 2,
        processor: processMaintenanceJob,
      },
    ];

    await this.startWorkerGroup(configs);
  }

  /**
   * Start all workers (for development/testing)
   */
  private async startAllWorkers(): Promise<void> {
    const configs: WorkerConfig[] = [
      {
        queueName: QUEUE_NAMES.CRITICAL,
        concurrency: 10,
        processor: processCriticalJob,
      },
      {
        queueName: QUEUE_NAMES.DOCUMENT_PROCESSING,
        concurrency: 8,
        processor: processDocumentJob,
      },
      {
        queueName: QUEUE_NAMES.AI_PROCESSING,
        concurrency: 5,
        processor: processAIJob,
      },
      {
        queueName: QUEUE_NAMES.EMAILS,
        concurrency: 10,
        processor: processEmailJob,
      },
      {
        queueName: QUEUE_NAMES.WEBHOOKS,
        concurrency: 15,
        processor: processWebhookJob,
      },
      {
        queueName: QUEUE_NAMES.INTEGRATIONS,
        concurrency: 5,
        processor: processIntegrationJob,
      },
      {
        queueName: QUEUE_NAMES.REPORTS,
        concurrency: 5,
        processor: processReportJob,
      },
      {
        queueName: QUEUE_NAMES.MAINTENANCE,
        concurrency: 2,
        processor: processMaintenanceJob,
      },
      {
        queueName: QUEUE_NAMES.SCHEDULED,
        concurrency: 1,
        processor: processScheduledJob,
      },
    ];

    await this.startWorkerGroup(configs);
  }

  /**
   * Start a group of workers
   */
  private async startWorkerGroup(configs: WorkerConfig[]): Promise<void> {
    const queueManager = getQueueManager();

    for (const config of configs) {
      await this.startWorker(config.queueName, config.processor, config.concurrency);
    }
  }

  /**
   * Start a single worker for a queue
   */
  private async startWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    concurrency: number
  ): Promise<void> {
    const queueManager = getQueueManager();
    const queue = queueManager.getQueue(queueName as any);

    if (!queue) {
      console.error(`Queue '${queueName}' not found`);
      return;
    }

    // Create wrapped processor with tracking
    const wrappedProcessor = this.createTrackedProcessor(processor);

    // Create worker
    const worker = new Worker(
      queueName,
      wrappedProcessor,
      {
        connection: queue.client,
        concurrency,
      }
    );

    // Set up event handlers
    this.setupWorkerEventHandlers(worker, queueName);

    this.workers.set(queueName, worker);
    console.log(`Worker started for queue '${queueName}' with concurrency ${concurrency}`);
  }

  /**
   * Create a processor wrapper that tracks job execution
   */
  private createTrackedProcessor(
    processor: (job: Job) => Promise<any>
  ): (job: Job) => Promise<any> {
    return async (job: Job) => {
      const jobTracker = getJobTracker(this.prisma);
      let executionId: string | null = null;

      try {
        // Track job start
        executionId = await jobTracker.trackJobStart(job);

        // Process job
        const result = await processor(job);

        // Track job completion
        if (executionId) {
          await jobTracker.trackJobComplete(job, result, executionId);
        }

        return result;
      } catch (error) {
        // Track job failure
        if (executionId) {
          await jobTracker.trackJobFailed(
            job,
            error instanceof Error ? error : new Error(String(error)),
            executionId
          );
        }

        // Re-throw to let Bull handle retry logic
        throw error;
      }
    };
  }

  /**
   * Set up event handlers for worker monitoring
   */
  private setupWorkerEventHandlers(worker: Worker, queueName: string): void {
    worker.on('completed', (job: Job, result: any) => {
      console.log(`[${queueName}] Job ${job.id} completed`, {
        jobId: job.id,
        jobName: job.name,
        duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0,
      });
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
      if (!job) {
        console.error(`[${queueName}] Job failed without job object:`, err);
        return;
      }

      console.error(`[${queueName}] Job ${job.id} failed`, {
        jobId: job.id,
        jobName: job.name,
        attempts: job.attemptsMade,
        error: err.message,
      });
    });

    worker.on('stalled', (job: Job) => {
      console.warn(`[${queueName}] Job ${job.id} stalled`, {
        jobId: job.id,
        jobName: job.name,
      });
    });

    worker.on('error', (error: Error) => {
      console.error(`[${queueName}] Worker error:`, error);
    });

    worker.on('active', (job: Job) => {
      console.log(`[${queueName}] Job ${job.id} started processing`, {
        jobId: job.id,
        jobName: job.name,
      });
    });
  }

  /**
   * Get worker health status
   */
  async getHealthStatus(): Promise<{
    isRunning: boolean;
    workers: Array<{ queueName: string; isActive: boolean }>;
  }> {
    const workerStatuses = Array.from(this.workers.entries()).map(([queueName, worker]) => ({
      queueName,
      isActive: worker.isRunning(),
    }));

    return {
      isRunning: this.isRunning,
      workers: workerStatuses,
    };
  }

  /**
   * Pause a specific worker
   */
  async pauseWorker(queueName: string): Promise<void> {
    const worker = this.workers.get(queueName);
    if (!worker) {
      throw new Error(`Worker for queue '${queueName}' not found`);
    }

    await worker.pause();
    console.log(`Worker for queue '${queueName}' paused`);
  }

  /**
   * Resume a paused worker
   */
  async resumeWorker(queueName: string): Promise<void> {
    const worker = this.workers.get(queueName);
    if (!worker) {
      throw new Error(`Worker for queue '${queueName}' not found`);
    }

    await worker.resume();
    console.log(`Worker for queue '${queueName}' resumed`);
  }

  /**
   * Stop all workers gracefully
   */
  async stopAllWorkers(): Promise<void> {
    console.log('Stopping all workers...');

    const closePromises = Array.from(this.workers.entries()).map(
      async ([queueName, worker]) => {
        try {
          await worker.close();
          console.log(`Worker for queue '${queueName}' stopped`);
        } catch (error) {
          console.error(`Error stopping worker for queue '${queueName}':`, error);
        }
      }
    );

    await Promise.all(closePromises);

    // Close Prisma connection
    await this.prisma.$disconnect();

    this.workers.clear();
    this.isRunning = false;
    console.log('All workers stopped successfully');
  }
}

// Create singleton instance
const workerManager = new WorkerManager();

/**
 * Start workers (called from worker entry point)
 */
export async function startWorkers(): Promise<void> {
  await workerManager.startWorkers();
}

/**
 * Stop workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  await workerManager.stopAllWorkers();
}

/**
 * Get worker manager instance
 */
export function getWorkerManager(): WorkerManager {
  return workerManager;
}

// Handle graceful shutdown
if (require.main === module) {
  // Start workers
  startWorkers().catch((error) => {
    console.error('Fatal error starting workers:', error);
    process.exit(1);
  });

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);

    try {
      await stopWorkers();
      console.log('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION').then(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION').then(() => process.exit(1));
  });
}