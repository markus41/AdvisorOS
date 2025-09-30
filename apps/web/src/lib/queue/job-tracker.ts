/**
 * Job Tracker Service
 *
 * Tracks all job executions in the database for monitoring, debugging, and analytics.
 * Provides comprehensive audit trail of all background job processing.
 */

import { PrismaClient } from '@prisma/client';
import { Job } from 'bull';
import os from 'os';

/**
 * Job execution status
 */
export type JobExecutionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Date range for queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Job statistics grouped by type
 */
export interface JobTypeStatistics {
  jobType: string;
  status: JobExecutionStatus;
  count: number;
  avgDurationMs: number | null;
}

/**
 * Worker performance statistics
 */
export interface WorkerStatistics {
  workerId: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  avgDurationMs: number | null;
  lastActivity: Date | null;
}

/**
 * Error analysis data
 */
export interface ErrorAnalysis {
  errorMessage: string;
  count: number;
  jobType: string;
  lastOccurrence: Date;
}

/**
 * JobTracker - Tracks job executions in the database
 */
export class JobTracker {
  private workerId: string;
  private workerHost: string;

  constructor(private prisma: PrismaClient) {
    this.workerId = process.env.WORKER_ID || `worker-${process.pid}`;
    this.workerHost = os.hostname();
  }

  /**
   * Track the start of a job execution
   */
  async trackJobStart(job: Job): Promise<string> {
    try {
      const execution = await this.prisma.jobExecution.create({
        data: {
          jobId: String(job.id),
          jobName: job.name,
          jobType: this.getJobType(job.name),
          queueName: job.queue.name,
          organizationId: job.data.organizationId || 'system',
          status: 'processing',
          priority: job.opts.priority || 0,
          startedAt: new Date(),
          attempts: job.attemptsMade + 1,
          maxRetries: job.opts.attempts || 3,
          inputParams: job.data,
          workerId: this.workerId,
          workerHost: this.workerHost,
        },
      });

      return execution.id;
    } catch (error) {
      console.error('Failed to track job start:', error);
      throw error;
    }
  }

  /**
   * Track successful job completion
   */
  async trackJobComplete(job: Job, result: any, executionId: string): Promise<void> {
    try {
      const startTime = job.processedOn || job.timestamp;
      const endTime = Date.now();
      const duration = endTime - startTime;

      await this.prisma.jobExecution.update({
        where: { id: executionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationMs: duration,
          outputResult: result,
          attempts: job.attemptsMade + 1,
        },
      });
    } catch (error) {
      console.error('Failed to track job completion:', error);
      // Don't throw - we don't want to fail the job because of tracking issues
    }
  }

  /**
   * Track job failure
   */
  async trackJobFailed(job: Job, error: Error, executionId: string): Promise<void> {
    try {
      const startTime = job.processedOn || job.timestamp;
      const endTime = Date.now();
      const duration = endTime - startTime;

      await this.prisma.jobExecution.update({
        where: { id: executionId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          durationMs: duration > 0 ? duration : null,
          attempts: job.attemptsMade + 1,
          errorMessage: error.message,
          stackTrace: error.stack,
          errorCode: this.categorizeError(error),
        },
      });
    } catch (trackError) {
      console.error('Failed to track job failure:', trackError);
      // Don't throw - we don't want to fail the job because of tracking issues
    }
  }

  /**
   * Track job cancellation
   */
  async trackJobCancelled(jobId: string, executionId: string, reason?: string): Promise<void> {
    try {
      await this.prisma.jobExecution.update({
        where: { id: executionId },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
          errorMessage: reason || 'Job was cancelled',
        },
      });
    } catch (error) {
      console.error('Failed to track job cancellation:', error);
    }
  }

  /**
   * Get job statistics for an organization
   */
  async getJobStatistics(
    organizationId: string,
    dateRange?: DateRange
  ): Promise<JobTypeStatistics[]> {
    try {
      const whereClause: any = { organizationId };

      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const stats = await this.prisma.jobExecution.groupBy({
        by: ['jobType', 'status'],
        where: whereClause,
        _count: true,
        _avg: {
          durationMs: true,
        },
      });

      return stats.map((stat) => ({
        jobType: stat.jobType,
        status: stat.status as JobExecutionStatus,
        count: stat._count,
        avgDurationMs: stat._avg.durationMs,
      }));
    } catch (error) {
      console.error('Failed to get job statistics:', error);
      throw error;
    }
  }

  /**
   * Get overall statistics across all organizations
   */
  async getOverallStatistics(dateRange?: DateRange): Promise<JobTypeStatistics[]> {
    try {
      const whereClause: any = {};

      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const stats = await this.prisma.jobExecution.groupBy({
        by: ['jobType', 'status'],
        where: whereClause,
        _count: true,
        _avg: {
          durationMs: true,
        },
      });

      return stats.map((stat) => ({
        jobType: stat.jobType,
        status: stat.status as JobExecutionStatus,
        count: stat._count,
        avgDurationMs: stat._avg.durationMs,
      }));
    } catch (error) {
      console.error('Failed to get overall statistics:', error);
      throw error;
    }
  }

  /**
   * Get worker performance statistics
   */
  async getWorkerStatistics(dateRange?: DateRange): Promise<WorkerStatistics[]> {
    try {
      const whereClause: any = { workerId: { not: null } };

      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const workerGroups = await this.prisma.jobExecution.groupBy({
        by: ['workerId'],
        where: whereClause,
        _count: true,
        _avg: {
          durationMs: true,
        },
      });

      const workerStats: WorkerStatistics[] = [];

      for (const group of workerGroups) {
        if (!group.workerId) continue;

        const [successful, failed, lastActivity] = await Promise.all([
          this.prisma.jobExecution.count({
            where: {
              workerId: group.workerId,
              status: 'completed',
              ...(dateRange && {
                createdAt: { gte: dateRange.start, lte: dateRange.end },
              }),
            },
          }),
          this.prisma.jobExecution.count({
            where: {
              workerId: group.workerId,
              status: 'failed',
              ...(dateRange && {
                createdAt: { gte: dateRange.start, lte: dateRange.end },
              }),
            },
          }),
          this.prisma.jobExecution.findFirst({
            where: { workerId: group.workerId },
            orderBy: { completedAt: 'desc' },
            select: { completedAt: true },
          }),
        ]);

        workerStats.push({
          workerId: group.workerId,
          totalJobs: group._count,
          successfulJobs: successful,
          failedJobs: failed,
          avgDurationMs: group._avg.durationMs,
          lastActivity: lastActivity?.completedAt || null,
        });
      }

      return workerStats;
    } catch (error) {
      console.error('Failed to get worker statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent failed jobs for debugging
   */
  async getRecentFailures(
    organizationId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const whereClause: any = { status: 'failed' };

      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      const failures = await this.prisma.jobExecution.findMany({
        where: whereClause,
        orderBy: { completedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          jobId: true,
          jobName: true,
          jobType: true,
          queueName: true,
          organizationId: true,
          attempts: true,
          errorMessage: true,
          errorCode: true,
          completedAt: true,
          inputParams: true,
        },
      });

      return failures;
    } catch (error) {
      console.error('Failed to get recent failures:', error);
      throw error;
    }
  }

  /**
   * Get error analysis - most common errors
   */
  async getErrorAnalysis(
    organizationId?: string,
    limit: number = 20
  ): Promise<ErrorAnalysis[]> {
    try {
      const whereClause: any = {
        status: 'failed',
        errorMessage: { not: null },
      };

      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      const errors = await this.prisma.jobExecution.groupBy({
        by: ['errorMessage', 'jobType'],
        where: whereClause,
        _count: true,
        _max: {
          completedAt: true,
        },
        orderBy: {
          _count: {
            errorMessage: 'desc',
          },
        },
        take: limit,
      });

      return errors
        .filter((e) => e.errorMessage !== null)
        .map((error) => ({
          errorMessage: error.errorMessage!,
          jobType: error.jobType,
          count: error._count,
          lastOccurrence: error._max.completedAt || new Date(),
        }));
    } catch (error) {
      console.error('Failed to get error analysis:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics by job type
   */
  async getPerformanceMetrics(
    organizationId?: string,
    dateRange?: DateRange
  ): Promise<any[]> {
    try {
      const whereClause: any = { status: 'completed' };

      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      if (dateRange) {
        whereClause.completedAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const metrics = await this.prisma.jobExecution.groupBy({
        by: ['jobType'],
        where: whereClause,
        _count: true,
        _avg: {
          durationMs: true,
        },
        _min: {
          durationMs: true,
        },
        _max: {
          durationMs: true,
        },
      });

      return metrics.map((metric) => ({
        jobType: metric.jobType,
        totalJobs: metric._count,
        avgDuration: metric._avg.durationMs,
        minDuration: metric._min.durationMs,
        maxDuration: metric._max.durationMs,
      }));
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get slow jobs (jobs that took longer than threshold)
   */
  async getSlowJobs(
    thresholdMs: number = 60000, // 1 minute default
    organizationId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const whereClause: any = {
        durationMs: { gte: thresholdMs },
        status: 'completed',
      };

      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      const slowJobs = await this.prisma.jobExecution.findMany({
        where: whereClause,
        orderBy: { durationMs: 'desc' },
        take: limit,
        select: {
          id: true,
          jobId: true,
          jobName: true,
          jobType: true,
          queueName: true,
          organizationId: true,
          durationMs: true,
          completedAt: true,
          workerId: true,
        },
      });

      return slowJobs;
    } catch (error) {
      console.error('Failed to get slow jobs:', error);
      throw error;
    }
  }

  /**
   * Clean up old job executions (retention policy)
   */
  async cleanupOldExecutions(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.jobExecution.deleteMany({
        where: {
          completedAt: {
            lt: cutoffDate,
          },
          status: { in: ['completed', 'cancelled'] },
        },
      });

      console.log(`Cleaned up ${result.count} old job executions`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old executions:', error);
      throw error;
    }
  }

  /**
   * Get job execution by ID
   */
  async getJobExecution(executionId: string): Promise<any> {
    try {
      return await this.prisma.jobExecution.findUnique({
        where: { id: executionId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to get job execution:', error);
      throw error;
    }
  }

  /**
   * Categorize error for better analysis
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('network') || message.includes('econnrefused')) return 'NETWORK_ERROR';
    if (message.includes('rate limit')) return 'RATE_LIMIT';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('permission') || message.includes('forbidden')) return 'PERMISSION_DENIED';
    if (message.includes('validation')) return 'VALIDATION_ERROR';
    if (message.includes('database') || message.includes('prisma')) return 'DATABASE_ERROR';
    if (message.includes('memory')) return 'MEMORY_ERROR';

    return 'UNKNOWN_ERROR';
  }

  /**
   * Get job type from job name
   */
  private getJobType(jobName: string): string {
    if (jobName.startsWith('document:')) return 'document_processing';
    if (jobName.startsWith('ai:')) return 'ai_processing';
    if (jobName.startsWith('email:')) return 'email';
    if (jobName.startsWith('report:')) return 'report';
    if (jobName.startsWith('webhook:')) return 'webhook';
    if (jobName.startsWith('integration:')) return 'integration';
    if (jobName.startsWith('quickbooks:')) return 'integration';
    if (jobName.startsWith('stripe:')) return 'integration';
    if (jobName.startsWith('scheduled:')) return 'scheduled';
    if (jobName.startsWith('maintenance:')) return 'maintenance';
    if (jobName.startsWith('critical:')) return 'critical';
    return 'general';
  }
}

// Singleton instance
let jobTrackerInstance: JobTracker | null = null;

/**
 * Get or create JobTracker singleton instance
 */
export function getJobTracker(prisma: PrismaClient): JobTracker {
  if (!jobTrackerInstance) {
    jobTrackerInstance = new JobTracker(prisma);
  }
  return jobTrackerInstance;
}