import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import type { MaintenanceJobData } from '../../lib/queue/job-types';

const prisma = new PrismaClient();

export async function processMaintenanceJob(job: Job<MaintenanceJobData>): Promise<any> {
  const { organizationId, task, options } = job.data;
  console.log(`Maintenance task: ${task}`);

  switch (task) {
    case 'cleanup_old_logs':
      return await cleanupLogs(options?.daysToKeep || 90);
    case 'check_expired_locks':
      return await checkExpiredLocks();
    default:
      return { completed: true };
  }
}

async function cleanupLogs(daysToKeep: number): Promise<any> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deleted = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });

  return { deleted: deleted.count };
}

async function checkExpiredLocks(): Promise<any> {
  const expired = await prisma.taskQueueItem.updateMany({
    where: {
      status: 'processing',
      lockExpiresAt: { lt: new Date() },
    },
    data: {
      status: 'pending',
      processingLockId: null,
      lockAcquiredAt: null,
      lockExpiresAt: null,
    },
  });

  return { clearedLocks: expired.count };
}