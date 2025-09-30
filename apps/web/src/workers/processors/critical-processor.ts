import { Job } from 'bull';

export async function processCriticalJob(job: Job): Promise<any> {
  const { organizationId, operation, severity, details } = job.data;
  console.log(`CRITICAL: ${operation} (${severity})`, details);

  // TODO: Implement critical notifications and alerts
  return { notified: true, severity };
}