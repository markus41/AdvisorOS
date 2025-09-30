import { Job } from 'bull';
import type { ScheduledJobData } from '../../lib/queue/job-types';

export async function processScheduledJob(job: Job<ScheduledJobData>): Promise<any> {
  const { organizationId, schedule, options } = job.data;
  console.log(`Scheduled job: ${schedule}`);

  // TODO: Implement scheduled jobs (daily reports, reminders, etc.)
  return { executed: true, schedule };
}