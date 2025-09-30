import { Job } from 'bull';
import type { EmailJobData } from '../../lib/queue/job-types';

export async function processEmailJob(job: Job<EmailJobData>): Promise<any> {
  const { organizationId, type, to, subject, templateId, templateData, attachments } = job.data;
  console.log(`Sending email: ${type} to ${to}`);

  // TODO: Implement email sending with nodemailer or SendGrid
  return { sent: true, messageId: `msg-${Date.now()}` };
}