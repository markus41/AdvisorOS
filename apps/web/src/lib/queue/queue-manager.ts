import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'ioredis';

/**
 * Queue configuration definition
 */
interface QueueDefinition {
  name: string;
  priority: number;
  concurrency: number;
  rateLimit?: { max: number; duration: number };
  defaultJobOptions: JobOptions;
}

/**
 * Job statistics interface
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

/**
 * All available queue names
 */
export const QUEUE_NAMES = {
  CRITICAL: 'critical',
  DOCUMENT_PROCESSING: 'document-processing',
  AI_PROCESSING: 'ai-processing',
  REPORTS: 'reports',
  EMAILS: 'emails',
  WEBHOOKS: 'webhooks',
  INTEGRATIONS: 'integrations',
  MAINTENANCE: 'maintenance',
  SCHEDULED: 'scheduled',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

/**
 * Queue configurations for all 9 specialized queues
 * Each queue is optimized for specific workload patterns
 */
const QUEUE_DEFINITIONS: Record<string, QueueDefinition> = {
  [QUEUE_NAMES.CRITICAL]: {
    name: QUEUE_NAMES.CRITICAL,
    priority: 1,
    concurrency: 10,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: false,
      timeout: 300000, // 5 minutes
    },
  },
  [QUEUE_NAMES.DOCUMENT_PROCESSING]: {
    name: QUEUE_NAMES.DOCUMENT_PROCESSING,
    priority: 2,
    concurrency: 8,
    rateLimit: { max: 20, duration: 1000 }, // Azure AI rate limits
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: false,
      timeout: 300000, // 5 minutes for OCR processing
    },
  },
  [QUEUE_NAMES.AI_PROCESSING]: {
    name: QUEUE_NAMES.AI_PROCESSING,
    priority: 2,
    concurrency: 5,
    rateLimit: { max: 10, duration: 60000 }, // Azure OpenAI rate limits
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 100,
      removeOnFail: false,
      timeout: 600000, // 10 minutes for AI processing
    },
  },
  [QUEUE_NAMES.REPORTS]: {
    name: QUEUE_NAMES.REPORTS,
    priority: 3,
    concurrency: 5,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'fixed', delay: 30000 },
      removeOnComplete: 50,
      removeOnFail: false,
      timeout: 600000, // 10 minutes for report generation
    },
  },
  [QUEUE_NAMES.EMAILS]: {
    name: QUEUE_NAMES.EMAILS,
    priority: 3,
    concurrency: 10,
    rateLimit: { max: 100, duration: 60000 }, // Email service rate limits
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 60000 },
      removeOnComplete: 200,
      removeOnFail: false,
      timeout: 30000, // 30 seconds
    },
  },
  [QUEUE_NAMES.WEBHOOKS]: {
    name: QUEUE_NAMES.WEBHOOKS,
    priority: 3,
    concurrency: 15,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: false,
      timeout: 30000, // 30 seconds
    },
  },
  [QUEUE_NAMES.INTEGRATIONS]: {
    name: QUEUE_NAMES.INTEGRATIONS,
    priority: 3,
    concurrency: 5,
    rateLimit: { max: 30, duration: 60000 }, // Third-party API rate limits
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 50,
      removeOnFail: false,
      timeout: 120000, // 2 minutes
    },
  },
  [QUEUE_NAMES.MAINTENANCE]: {
    name: QUEUE_NAMES.MAINTENANCE,
    priority: 4,
    concurrency: 2,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3600000 }, // 1 hour
      removeOnComplete: 10,
      removeOnFail: false,
      timeout: 1800000, // 30 minutes
    },
  },
  [QUEUE_NAMES.SCHEDULED]: {
    name: QUEUE_NAMES.SCHEDULED,
    priority: 5,
    concurrency: 3,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 1800000 }, // 30 minutes
      removeOnComplete: 20,
      removeOnFail: false,
      timeout: 600000, // 10 minutes
    },
  },
};

/**
 * QueueManager - Manages all Bull queues with Redis backend
 *
 * Responsibilities:
 * - Initialize and configure all queues
 * - Provide unified interface for job management
 * - Monitor queue health and statistics
 * - Handle graceful shutdown
 */
export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private redis: Redis.Redis | null = null;
  private isInitialized = false;

  constructor(private redisUrl: string) {}

  /**
   * Initialize all queues with their configurations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('QueueManager already initialized');
      return;
    }

    try {
      // Create Redis connection
      this.redis = new Redis(this.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Test Redis connection
      await this.redis.ping();
      console.log('Redis connection established successfully');

      // Initialize all queues
      Object.values(QUEUE_DEFINITIONS).forEach((config) => {
        const queue = new Bull(config.name, {
          redis: this.redisUrl,
          defaultJobOptions: config.defaultJobOptions,
          limiter: config.rateLimit,
        });

        // Set up event handlers for monitoring
        this.setupQueueEventHandlers(queue, config);

        this.queues.set(config.name, queue);
        console.log(`Queue '${config.name}' initialized with concurrency ${config.concurrency}`);
      });

      this.isInitialized = true;
      console.log('QueueManager initialized successfully with', this.queues.size, 'queues');
    } catch (error) {
      console.error('Failed to initialize QueueManager:', error);
      throw new Error(`QueueManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up event handlers for queue monitoring
   */
  private setupQueueEventHandlers(queue: Queue, config: QueueDefinition): void {
    queue.on('completed', (job: Job) => {
      console.log(`[${config.name}] Job ${job.id} completed successfully`);
    });

    queue.on('failed', (job: Job, err: Error) => {
      console.error(`[${config.name}] Job ${job.id} failed:`, {
        jobId: job.id,
        jobName: job.name,
        attempts: job.attemptsMade,
        error: err.message,
        stack: err.stack,
      });
    });

    queue.on('stalled', (job: Job) => {
      console.warn(`[${config.name}] Job ${job.id} stalled - may be stuck or worker crashed`);
    });

    queue.on('error', (error: Error) => {
      console.error(`[${config.name}] Queue error:`, error);
    });

    queue.on('waiting', (jobId: string | number) => {
      console.log(`[${config.name}] Job ${jobId} is waiting to be processed`);
    });

    queue.on('active', (job: Job) => {
      console.log(`[${config.name}] Job ${job.id} started processing`);
    });
  }

  /**
   * Add a job to a specific queue
   */
  async addJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    try {
      const job = await queue.add(jobType, data, options);
      console.log(`Job added to ${queueName}: ${job.id} (type: ${jobType})`);
      return job;
    } catch (error) {
      console.error(`Failed to add job to ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Add a scheduled job to be processed at a specific time
   */
  async addScheduledJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    scheduledFor: Date,
    options?: JobOptions
  ): Promise<Job<T>> {
    const delay = scheduledFor.getTime() - Date.now();

    if (delay < 0) {
      throw new Error('Cannot schedule job in the past');
    }

    return this.addJob(queueName, jobType, data, {
      ...options,
      delay,
    });
  }

  /**
   * Add a repeatable job (cron-like scheduling)
   */
  async addRepeatableJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    cronExpression: string,
    options?: JobOptions
  ): Promise<Job<T>> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    try {
      const job = await queue.add(jobType, data, {
        ...options,
        repeat: { cron: cronExpression },
      });
      console.log(`Repeatable job added to ${queueName}: ${job.id} (cron: ${cronExpression})`);
      return job;
    } catch (error) {
      console.error(`Failed to add repeatable job to ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get a queue by name
   */
  getQueue(queueName: QueueName): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Get statistics for a specific queue
   */
  async getQueueStats(queueName: QueueName): Promise<QueueStats | null> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      console.warn(`Queue '${queueName}' not found`);
      return null;
    }

    try {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.getPausedCount(),
      ]);

      return { waiting, active, completed, failed, delayed, paused };
    } catch (error) {
      console.error(`Failed to get stats for ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get statistics for all queues
   */
  async getAllQueueStats(): Promise<Record<string, QueueStats>> {
    this.ensureInitialized();

    const stats: Record<string, QueueStats> = {};

    for (const [name, queue] of this.queues) {
      try {
        const queueStats = await this.getQueueStats(name as QueueName);
        if (queueStats) {
          stats[name] = queueStats;
        }
      } catch (error) {
        console.error(`Failed to get stats for ${name}:`, error);
        stats[name] = {
          waiting: -1,
          active: -1,
          completed: -1,
          failed: -1,
          delayed: -1,
          paused: -1,
        };
      }
    }

    return stats;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.pause();
    console.log(`Queue '${queueName}' paused`);
  }

  /**
   * Resume a paused queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.resume();
    console.log(`Queue '${queueName}' resumed`);
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    queueName: QueueName,
    grace: number = 5000,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<Job[]> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const jobs = await queue.clean(grace, status);
    console.log(`Cleaned ${jobs.length} ${status} jobs from ${queueName}`);
    return jobs;
  }

  /**
   * Get a job by ID from any queue
   */
  async getJob(queueName: QueueName, jobId: string): Promise<Job | null> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return queue.getJob(jobId);
  }

  /**
   * Remove a job from a queue
   */
  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    this.ensureInitialized();

    const job = await this.getJob(queueName, jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.remove();
    console.log(`Job ${jobId} removed from ${queueName}`);
  }

  /**
   * Get failed jobs from a queue
   */
  async getFailedJobs(queueName: QueueName, start = 0, end = 10): Promise<Job[]> {
    this.ensureInitialized();

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return queue.getFailed(start, end);
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: QueueName, jobId: string): Promise<void> {
    this.ensureInitialized();

    const job = await this.getJob(queueName, jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.retry();
    console.log(`Job ${jobId} in ${queueName} scheduled for retry`);
  }

  /**
   * Check if QueueManager is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Gracefully close all queues and Redis connection
   */
  async close(): Promise<void> {
    console.log('Closing QueueManager...');

    // Close all queues
    const closePromises = Array.from(this.queues.values()).map(async (queue) => {
      try {
        await queue.close();
        console.log(`Queue '${queue.name}' closed`);
      } catch (error) {
        console.error(`Error closing queue '${queue.name}':`, error);
      }
    });

    await Promise.all(closePromises);

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      console.log('Redis connection closed');
    }

    this.queues.clear();
    this.isInitialized = false;
    console.log('QueueManager closed successfully');
  }

  /**
   * Ensure QueueManager is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('QueueManager not initialized. Call initialize() first.');
    }
  }

  /**
   * Get queue configurations
   */
  getQueueConfigurations(): Record<string, QueueDefinition> {
    return QUEUE_DEFINITIONS;
  }
}

// Singleton instance
let queueManagerInstance: QueueManager | null = null;

/**
 * Get or create QueueManager singleton instance
 */
export function getQueueManager(): QueueManager {
  if (!queueManagerInstance) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    queueManagerInstance = new QueueManager(redisUrl);
  }

  return queueManagerInstance;
}

/**
 * Initialize the queue manager (call this once during app startup)
 */
export async function initializeQueues(): Promise<QueueManager> {
  const manager = getQueueManager();
  await manager.initialize();
  return manager;
}

/**
 * Close the queue manager (call this during app shutdown)
 */
export async function closeQueues(): Promise<void> {
  if (queueManagerInstance) {
    await queueManagerInstance.close();
    queueManagerInstance = null;
  }
}