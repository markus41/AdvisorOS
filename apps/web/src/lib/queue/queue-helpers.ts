/**
 * Queue Helper Functions
 *
 * Convenience functions for common queue operations.
 * These wrappers provide a simpler API for adding jobs to queues.
 */

import { Job, JobOptions } from 'bull';
import { getQueueManager, QUEUE_NAMES } from './queue-manager';
import type {
  DocumentProcessingJobData,
  AIProcessingJobData,
  EmailJobData,
  ReportJobData,
  WebhookJobData,
  IntegrationJobData,
  MaintenanceJobData,
  ScheduledJobData,
} from './job-types';

/**
 * Document Processing Queue Helpers
 */
export async function queueDocumentOCR(
  documentId: string,
  organizationId: string,
  options?: { language?: string; extractTables?: boolean }
): Promise<Job> {
  const queueManager = getQueueManager();

  const jobData: DocumentProcessingJobData = {
    documentId,
    organizationId,
    operation: 'ocr',
    options,
  };

  return queueManager.addJob(QUEUE_NAMES.DOCUMENT_PROCESSING, 'document:ocr', jobData);
}

export async function queueDocumentClassification(
  documentId: string,
  organizationId: string
): Promise<Job> {
  const queueManager = getQueueManager();

  const jobData: DocumentProcessingJobData = {
    documentId,
    organizationId,
    operation: 'classify',
  };

  return queueManager.addJob(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    'document:classify',
    jobData
  );
}

export async function queueDocumentDataExtraction(
  documentId: string,
  documentType: string,
  organizationId: string,
  options?: { extractKeyValue?: boolean }
): Promise<Job> {
  const queueManager = getQueueManager();

  const jobData: DocumentProcessingJobData = {
    documentId,
    organizationId,
    operation: 'extract_data',
    documentType,
    options,
  };

  return queueManager.addJob(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    'document:extract_data',
    jobData
  );
}

export async function queueDocumentVirusScan(
  documentId: string,
  organizationId: string
): Promise<Job> {
  const queueManager = getQueueManager();

  const jobData: DocumentProcessingJobData = {
    documentId,
    organizationId,
    operation: 'virus_scan',
  };

  return queueManager.addJob(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    'document:virus_scan',
    jobData,
    { priority: 1 } // High priority for security
  );
}

/**
 * AI Processing Queue Helpers
 */
export async function queueAIInsightsGeneration(
  clientId: string,
  organizationId: string,
  dataType: string
): Promise<Job> {
  const queueManager = getQueueManager();

  const jobData: AIProcessingJobData = {
    organizationId,
    operation: 'generate_insights',
    clientId,
    dataType,
  };

  return queueManager.addJob(QUEUE_NAMES.AI_PROCESSING, 'ai:generate_insights', jobData);
}

export async function queueFinancialAnalysis(
  clientId: string,
  year: number,
  organizationId: string
): Promise<Job> {
  const queueManager = getQueueManager();

  const jobData: AIProcessingJobData = {
    organizationId,
    operation: 'analyze_financials',
    clientId,
    year,
  };

  return queueManager.addJob(QUEUE_NAMES.AI_PROCESSING, 'ai:analyze_financials', jobData);
}

export async function queueTransactionClassification(
  transactionIds: string[],
  organizationId: string
): Promise<Job> {
  const queueManager = getQueueManager();

  const jobData: AIProcessingJobData = {
    organizationId,
    operation: 'classify_transactions',
    transactionIds,
  };

  return queueManager.addJob(
    QUEUE_NAMES.AI_PROCESSING,
    'ai:classify_transactions',
    jobData
  );
}

/**
 * Email Queue Helpers
 */
export async function queueEmail(emailData: EmailJobData): Promise<Job> {
  const queueManager = getQueueManager();

  const jobOptions: JobOptions = {
    priority: emailData.priority === 'high' ? 1 : emailData.priority === 'low' ? 3 : 2,
  };

  return queueManager.addJob(QUEUE_NAMES.EMAILS, `email:${emailData.type}`, emailData, jobOptions);
}

export async function queueWelcomeEmail(
  to: string,
  organizationId: string,
  templateData: Record<string, any>
): Promise<Job> {
  return queueEmail({
    organizationId,
    type: 'welcome',
    to,
    templateData,
    priority: 'high',
  });
}

export async function queueTaskAssignmentEmail(
  to: string,
  organizationId: string,
  taskData: { taskId: string; taskTitle: string; dueDate?: Date }
): Promise<Job> {
  return queueEmail({
    organizationId,
    type: 'task_assignment',
    to,
    templateData: taskData,
    priority: 'normal',
  });
}

export async function queueInvoiceReminderEmail(
  to: string,
  organizationId: string,
  invoiceData: { invoiceId: string; amount: number; dueDate: Date }
): Promise<Job> {
  return queueEmail({
    organizationId,
    type: 'invoice_reminder',
    to,
    templateData: invoiceData,
    priority: 'high',
  });
}

/**
 * Report Generation Queue Helpers
 */
export async function queueReportGeneration(reportData: ReportJobData): Promise<Job> {
  const queueManager = getQueueManager();

  return queueManager.addJob(
    QUEUE_NAMES.REPORTS,
    `report:${reportData.reportType}`,
    reportData
  );
}

export async function queueFinancialReport(
  clientId: string,
  organizationId: string,
  dateRange: { start: Date; end: Date },
  format: 'pdf' | 'excel' = 'pdf'
): Promise<Job> {
  return queueReportGeneration({
    organizationId,
    reportType: 'financial',
    clientId,
    dateRange,
    format,
  });
}

/**
 * Webhook Queue Helpers
 */
export async function queueWebhook(webhookData: WebhookJobData): Promise<Job> {
  const queueManager = getQueueManager();

  return queueManager.addJob(
    QUEUE_NAMES.WEBHOOKS,
    `webhook:${webhookData.webhookType}:${webhookData.eventType}`,
    webhookData
  );
}

export async function queueStripeWebhook(
  eventId: string,
  eventType: string,
  payload: any,
  organizationId: string
): Promise<Job> {
  return queueWebhook({
    organizationId,
    webhookType: 'stripe',
    eventType,
    eventId,
    payload,
  });
}

export async function queueQuickBooksWebhook(
  eventId: string,
  eventType: string,
  payload: any,
  organizationId: string
): Promise<Job> {
  return queueWebhook({
    organizationId,
    webhookType: 'quickbooks',
    eventType,
    eventId,
    payload,
  });
}

/**
 * Integration Queue Helpers
 */
export async function queueIntegration(integrationData: IntegrationJobData): Promise<Job> {
  const queueManager = getQueueManager();

  return queueManager.addJob(
    QUEUE_NAMES.INTEGRATIONS,
    `integration:${integrationData.integration}:${integrationData.operation}`,
    integrationData
  );
}

export async function queueQuickBooksSync(
  organizationId: string,
  syncType: 'full' | 'incremental',
  entityType?: string
): Promise<Job> {
  return queueIntegration({
    organizationId,
    integration: 'quickbooks',
    operation: 'sync',
    syncType,
    entityType,
  });
}

/**
 * Maintenance Queue Helpers
 */
export async function queueMaintenance(maintenanceData: MaintenanceJobData): Promise<Job> {
  const queueManager = getQueueManager();

  return queueManager.addJob(
    QUEUE_NAMES.MAINTENANCE,
    `maintenance:${maintenanceData.task}`,
    maintenanceData
  );
}

export async function queueLogCleanup(
  organizationId: string,
  daysToKeep: number = 90
): Promise<Job> {
  return queueMaintenance({
    organizationId,
    task: 'cleanup_old_logs',
    options: { daysToKeep },
  });
}

export async function queueExpiredLocksCheck(organizationId: string): Promise<Job> {
  return queueMaintenance({
    organizationId,
    task: 'check_expired_locks',
  });
}

/**
 * Scheduled Job Queue Helpers
 */
export async function queueScheduledJob(scheduledData: ScheduledJobData): Promise<Job> {
  const queueManager = getQueueManager();

  return queueManager.addJob(
    QUEUE_NAMES.SCHEDULED,
    `scheduled:${scheduledData.schedule}`,
    scheduledData
  );
}

export async function queueDailyReports(organizationIds?: string[]): Promise<Job> {
  return queueScheduledJob({
    organizationId: 'system', // System-level job
    schedule: 'daily_reports',
    options: {
      targetOrganizations: organizationIds,
    },
  });
}

export async function queueInvoiceReminders(): Promise<Job> {
  return queueScheduledJob({
    organizationId: 'system', // System-level job
    schedule: 'invoice_reminders',
  });
}

/**
 * Bulk Operations
 */
export async function queueBulkEmails(
  emails: Array<Omit<EmailJobData, 'organizationId'>>,
  organizationId: string
): Promise<Job[]> {
  const jobs = await Promise.all(
    emails.map((email) =>
      queueEmail({
        ...email,
        organizationId,
      })
    )
  );

  return jobs;
}

export async function queueBulkDocumentProcessing(
  documentIds: string[],
  operation: 'ocr' | 'classify',
  organizationId: string
): Promise<Job[]> {
  const queueManager = getQueueManager();

  const jobs = await Promise.all(
    documentIds.map((documentId) => {
      const jobData: DocumentProcessingJobData = {
        documentId,
        organizationId,
        operation,
      };

      return queueManager.addJob(
        QUEUE_NAMES.DOCUMENT_PROCESSING,
        `document:${operation}`,
        jobData
      );
    })
  );

  return jobs;
}

/**
 * Priority Job Helpers
 */
export async function queueCriticalJob(
  operation: 'emergency_notification' | 'security_alert' | 'system_health_check',
  organizationId: string,
  severity: 'critical' | 'high' | 'medium',
  details: any
): Promise<Job> {
  const queueManager = getQueueManager();

  return queueManager.addJob(
    QUEUE_NAMES.CRITICAL,
    `critical:${operation}`,
    {
      organizationId,
      operation,
      severity,
      details,
    },
    { priority: severity === 'critical' ? 1 : severity === 'high' ? 2 : 3 }
  );
}