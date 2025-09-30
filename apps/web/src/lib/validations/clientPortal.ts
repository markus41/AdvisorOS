import { z } from 'zod';

// Client Portal Access Management
export const createPortalAccessSchema = z.object({
  userId: z.string().cuid(),
  clientId: z.string().cuid(),
  accessLevel: z.enum(['view', 'edit', 'admin']).default('view'),

  // Feature Permissions
  canViewFinancials: z.boolean().default(true),
  canUploadDocuments: z.boolean().default(true),
  canMessageAdvisor: z.boolean().default(true),
  canApproveInvoices: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canViewReports: z.boolean().default(true),
  canExportData: z.boolean().default(false),

  // Custom Permissions (JSON)
  permissions: z.record(z.boolean()).optional(),

  // Access Control
  expiresAt: z.date().optional(),
  allowedIpRanges: z.array(z.string()).optional(),
  sessionTimeout: z.number().int().min(5).max(1440).default(30), // minutes

  // Notification Preferences
  emailNotifications: z.boolean().default(true),
  notificationFrequency: z.enum(['real_time', 'daily_digest', 'weekly_digest']).default('real_time'),
});

export const updatePortalAccessSchema = createPortalAccessSchema.partial().extend({
  id: z.string().cuid(),
});

export const revokePortalAccessSchema = z.object({
  id: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

// Invitation Management
export const inviteClientUserSchema = z.object({
  clientId: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['client_owner', 'client_admin', 'client_user']),
  accessLevel: z.enum(['view', 'edit', 'admin']).default('view'),

  // Initial Permissions
  canViewFinancials: z.boolean().default(true),
  canUploadDocuments: z.boolean().default(true),
  canMessageAdvisor: z.boolean().default(true),
  canApproveInvoices: z.boolean().default(false),

  // Invitation Settings
  expiresInDays: z.number().int().min(1).max(30).default(7),
  sendEmail: z.boolean().default(true),
  customMessage: z.string().max(1000).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'Must accept terms and conditions',
  }),
});

// Portal Activity Tracking
export const logPortalActivitySchema = z.object({
  userId: z.string().cuid(),
  clientId: z.string().cuid(),
  activityType: z.enum([
    'login',
    'logout',
    'view_document',
    'upload_document',
    'download_document',
    'view_report',
    'export_data',
    'send_message',
    'approve_invoice',
    'update_profile',
  ]),
  metadata: z.record(z.any()).optional(),
});

export const getPortalActivityLogSchema = z.object({
  clientId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  activityTypes: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().min(1).max(500).default(100),
  cursor: z.string().optional(),
});

// Document Access
export const requestDocumentAccessSchema = z.object({
  documentId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

export const grantDocumentAccessSchema = z.object({
  documentId: z.string().cuid(),
  userId: z.string().cuid(),
  accessLevel: z.enum(['view', 'download', 'edit']),
  expiresAt: z.date().optional(),
});

// Messaging
export const sendPortalMessageSchema = z.object({
  clientId: z.string().cuid(),
  recipientId: z.string().cuid(),
  subject: z.string().max(200),
  body: z.string().max(10000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    size: z.number().int().positive(),
  })).optional(),
});

export const getPortalMessagesSchema = z.object({
  clientId: z.string().cuid(),
  unreadOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const markMessageReadSchema = z.object({
  messageId: z.string().cuid(),
});

// Portal Dashboard
export const getPortalDashboardSchema = z.object({
  clientId: z.string().cuid(),
  includeRecentActivity: z.boolean().default(true),
  includeUpcomingTasks: z.boolean().default(true),
  includeFinancialSummary: z.boolean().default(true),
  includeDocuments: z.boolean().default(true),
});

// Notification Preferences
export const updateNotificationPreferencesSchema = z.object({
  userId: z.string().cuid(),
  clientId: z.string().cuid(),

  // Email Notifications
  emailNotifications: z.boolean(),
  emailFrequency: z.enum(['real_time', 'daily_digest', 'weekly_digest']),

  // Notification Types
  notifyOnDocumentUpload: z.boolean().default(true),
  notifyOnInvoice: z.boolean().default(true),
  notifyOnMessage: z.boolean().default(true),
  notifyOnTaskAssignment: z.boolean().default(true),
  notifyOnEngagementUpdate: z.boolean().default(true),

  // In-App Notifications
  inAppNotifications: z.boolean().default(true),

  // SMS Notifications (optional)
  smsNotifications: z.boolean().default(false),
  phoneNumber: z.string().optional(),
});

// Security Settings
export const updateSecuritySettingsSchema = z.object({
  userId: z.string().cuid(),
  clientId: z.string().cuid(),

  mfaEnabled: z.boolean(),
  mfaMethod: z.enum(['authenticator', 'sms', 'email']).optional(),
  sessionTimeout: z.number().int().min(5).max(1440),
  allowedIpRanges: z.array(z.string()).optional(),
  passwordChangeRequired: z.boolean().default(false),
});

// Type exports
export type CreatePortalAccessInput = z.infer<typeof createPortalAccessSchema>;
export type UpdatePortalAccessInput = z.infer<typeof updatePortalAccessSchema>;
export type RevokePortalAccessInput = z.infer<typeof revokePortalAccessSchema>;
export type InviteClientUserInput = z.infer<typeof inviteClientUserSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type LogPortalActivityInput = z.infer<typeof logPortalActivitySchema>;
export type GetPortalActivityLogInput = z.infer<typeof getPortalActivityLogSchema>;
export type RequestDocumentAccessInput = z.infer<typeof requestDocumentAccessSchema>;
export type GrantDocumentAccessInput = z.infer<typeof grantDocumentAccessSchema>;
export type SendPortalMessageInput = z.infer<typeof sendPortalMessageSchema>;
export type GetPortalMessagesInput = z.infer<typeof getPortalMessagesSchema>;
export type MarkMessageReadInput = z.infer<typeof markMessageReadSchema>;
export type GetPortalDashboardInput = z.infer<typeof getPortalDashboardSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type UpdateSecuritySettingsInput = z.infer<typeof updateSecuritySettingsSchema>;