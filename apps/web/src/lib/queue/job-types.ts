/**
 * Job Type Definitions
 *
 * Defines the data structures for all job types across the queue system.
 * Each job type has strict typing to ensure data integrity and type safety.
 */

/**
 * Base job data that all jobs inherit
 */
export interface BaseJobData {
  organizationId: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

/**
 * Document Processing Jobs
 */
export interface DocumentProcessingJobData extends BaseJobData {
  documentId: string;
  operation: 'ocr' | 'classify' | 'extract_data' | 'virus_scan' | 'thumbnail';
  documentType?: string;
  options?: {
    language?: string;
    extractTables?: boolean;
    extractKeyValue?: boolean;
  };
}

/**
 * AI Processing Jobs
 */
export interface AIProcessingJobData extends BaseJobData {
  operation:
    | 'generate_insights'
    | 'analyze_financials'
    | 'classify_transactions'
    | 'predict_cash_flow'
    | 'detect_anomalies';
  clientId?: string;
  dataType?: string;
  year?: number;
  transactionIds?: string[];
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

/**
 * Email Jobs
 */
export interface EmailJobData extends BaseJobData {
  type:
    | 'welcome'
    | 'task_assignment'
    | 'invoice_reminder'
    | 'document_shared'
    | 'report_ready'
    | 'deadline_reminder'
    | 'custom';
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Report Generation Jobs
 */
export interface ReportJobData extends BaseJobData {
  reportType:
    | 'financial'
    | 'tax_summary'
    | 'client_overview'
    | 'engagement_status'
    | 'custom';
  templateId?: string;
  clientId?: string;
  engagementId?: string;
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
  format?: 'pdf' | 'excel' | 'csv' | 'json';
  options?: {
    includeCharts?: boolean;
    includeDetails?: boolean;
    compareWithPrevious?: boolean;
  };
  outputPath?: string;
}

/**
 * Webhook Jobs
 */
export interface WebhookJobData extends BaseJobData {
  webhookType: 'stripe' | 'quickbooks' | 'custom';
  eventType: string;
  eventId: string;
  payload: any;
  headers?: Record<string, string>;
  signature?: string;
  retryCount?: number;
}

/**
 * Integration Jobs
 */
export interface IntegrationJobData extends BaseJobData {
  integration: 'quickbooks' | 'stripe' | 'azure_ai' | 'custom';
  operation:
    | 'sync'
    | 'fetch'
    | 'push'
    | 'validate'
    | 'disconnect'
    | 'refresh_token';
  syncType?: 'full' | 'incremental' | 'partial';
  entityType?: string;
  entityIds?: string[];
  options?: {
    batchSize?: number;
    skipValidation?: boolean;
    forceFetch?: boolean;
  };
}

/**
 * Maintenance Jobs
 */
export interface MaintenanceJobData extends BaseJobData {
  task:
    | 'cleanup_old_logs'
    | 'archive_documents'
    | 'vacuum_database'
    | 'clear_cache'
    | 'backup_data'
    | 'check_expired_locks'
    | 'optimize_indexes';
  target?: string;
  options?: {
    daysToKeep?: number;
    batchSize?: number;
    dryRun?: boolean;
  };
}

/**
 * Scheduled Jobs
 */
export interface ScheduledJobData extends BaseJobData {
  schedule:
    | 'daily_reports'
    | 'weekly_summary'
    | 'monthly_billing'
    | 'invoice_reminders'
    | 'task_reminders'
    | 'deadline_notifications'
    | 'data_sync';
  targetDate?: Date | string;
  options?: {
    includeWeekends?: boolean;
    targetOrganizations?: string[];
    notifyOnCompletion?: boolean;
  };
}

/**
 * Critical Jobs (high priority tasks)
 */
export interface CriticalJobData extends BaseJobData {
  operation: 'emergency_notification' | 'security_alert' | 'system_health_check';
  severity: 'critical' | 'high' | 'medium';
  details: any;
}

/**
 * Union type of all job data types
 */
export type AnyJobData =
  | DocumentProcessingJobData
  | AIProcessingJobData
  | EmailJobData
  | ReportJobData
  | WebhookJobData
  | IntegrationJobData
  | MaintenanceJobData
  | ScheduledJobData
  | CriticalJobData;