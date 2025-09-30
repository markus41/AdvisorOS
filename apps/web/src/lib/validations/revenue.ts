import { z } from 'zod';

// Revenue Share Creation
export const createRevenueShareSchema = z.object({
  engagementId: z.string().cuid(),
  advisorId: z.string().cuid(),
  clientId: z.string().cuid(),

  // Revenue Details
  grossRevenue: z.number().positive(),
  platformFeePercentage: z.number().min(0).max(100),
  platformFee: z.number().nonnegative(),
  advisorPayout: z.number().nonnegative(),

  // Payment Period
  periodStartDate: z.date(),
  periodEndDate: z.date(),
  paymentDueDate: z.date().optional(),

  // Payment Method
  paymentMethod: z.enum(['ach', 'wire', 'check', 'paypal', 'stripe']).default('ach'),

  // Metadata
  invoiceId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateRevenueShareSchema = z.object({
  id: z.string().cuid(),

  clientPaidAt: z.date().optional(),
  clientPaymentMethod: z.string().optional(),
  clientPaymentReference: z.string().optional(),

  advisorPaidAt: z.date().optional(),
  advisorPaymentMethod: z.string().optional(),
  advisorPaymentReference: z.string().optional(),

  status: z.enum(['pending', 'client_paid', 'advisor_paid', 'completed', 'disputed']).optional(),
  notes: z.string().max(1000).optional(),
});

// Commission Calculation
export const calculateCommissionSchema = z.object({
  engagementId: z.string().cuid(),
  grossRevenue: z.number().positive(),
  advisorId: z.string().cuid().optional(), // Optional if engagement already has advisor
  organizationId: z.string().cuid().optional(), // For org-level commission rates
});

export const bulkCalculateCommissionsSchema = z.object({
  periodStartDate: z.date(),
  periodEndDate: z.date(),
  organizationId: z.string().cuid().optional(),
  advisorIds: z.array(z.string().cuid()).optional(),
});

// Payment Processing
export const processAdvisorPaymentSchema = z.object({
  revenueShareIds: z.array(z.string().cuid()).min(1),
  paymentMethod: z.enum(['ach', 'wire', 'paypal', 'stripe']),
  paymentDate: z.date().default(() => new Date()),
  paymentReference: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const recordClientPaymentSchema = z.object({
  revenueShareId: z.string().cuid(),
  amountReceived: z.number().positive(),
  paymentMethod: z.string(),
  paymentReference: z.string().optional(),
  paymentDate: z.date().default(() => new Date()),
  notes: z.string().max(1000).optional(),
});

// Reporting
export const getRevenueReportSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter']).default('month'),

  // Filters
  organizationId: z.string().cuid().optional(),
  advisorIds: z.array(z.string().cuid()).optional(),
  clientIds: z.array(z.string().cuid()).optional(),
  status: z.enum(['pending', 'client_paid', 'advisor_paid', 'completed', 'disputed']).optional(),

  // Metrics to include
  includeBreakdown: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
  includeComparisons: z.boolean().default(false),
});

export const getAdvisorEarningsSchema = z.object({
  advisorId: z.string().cuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(['pending', 'paid', 'all']).default('all'),
  includeProjections: z.boolean().default(false),
});

export const getOrganizationRevenueSchema = z.object({
  organizationId: z.string().cuid(),
  startDate: z.date(),
  endDate: z.date(),
  includeForecasting: z.boolean().default(true),
  includeAdvisorBreakdown: z.boolean().default(true),
  includeClientBreakdown: z.boolean().default(false),
});

// Tax Reporting
export const generate1099Schema = z.object({
  advisorId: z.string().cuid(),
  taxYear: z.number().int().min(2020).max(2050),
  includeNonReportable: z.boolean().default(false),
});

export const getBulk1099DataSchema = z.object({
  taxYear: z.number().int().min(2020).max(2050),
  organizationId: z.string().cuid().optional(),
  minimumAmount: z.number().positive().default(600), // IRS threshold
});

// Dispute Management
export const createRevenueDisputeSchema = z.object({
  revenueShareId: z.string().cuid(),
  disputeType: z.enum(['incorrect_amount', 'payment_not_received', 'calculation_error', 'other']),
  description: z.string().min(10).max(2000),
  expectedAmount: z.number().positive().optional(),
  supportingDocuments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
  })).optional(),
});

export const resolveRevenueDisputeSchema = z.object({
  disputeId: z.string().cuid(),
  resolution: z.enum(['approved', 'denied', 'adjusted']),
  resolutionNotes: z.string().min(10).max(2000),
  adjustedAmount: z.number().positive().optional(),
  refundRequired: z.boolean().default(false),
});

// Analytics
export const getCommissionAnalyticsSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  compareWithPrevious: z.boolean().default(true),
  organizationId: z.string().cuid().optional(),
});

export const getAdvisorPerformanceMetricsSchema = z.object({
  advisorId: z.string().cuid(),
  startDate: z.date(),
  endDate: z.date(),
  includeClientSatisfaction: z.boolean().default(true),
  includeEngagementMetrics: z.boolean().default(true),
  includeRevenueMetrics: z.boolean().default(true),
});

// Payout Schedules
export const createPayoutScheduleSchema = z.object({
  organizationId: z.string().cuid(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'on_demand']),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0 = Sunday
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  minimumPayoutAmount: z.number().positive().default(100),
  processingDays: z.number().int().min(1).max(14).default(3),
  isActive: z.boolean().default(true),
});

export const updatePayoutScheduleSchema = createPayoutScheduleSchema.partial().extend({
  id: z.string().cuid(),
});

// Type exports
export type CreateRevenueShareInput = z.infer<typeof createRevenueShareSchema>;
export type UpdateRevenueShareInput = z.infer<typeof updateRevenueShareSchema>;
export type CalculateCommissionInput = z.infer<typeof calculateCommissionSchema>;
export type BulkCalculateCommissionsInput = z.infer<typeof bulkCalculateCommissionsSchema>;
export type ProcessAdvisorPaymentInput = z.infer<typeof processAdvisorPaymentSchema>;
export type RecordClientPaymentInput = z.infer<typeof recordClientPaymentSchema>;
export type GetRevenueReportInput = z.infer<typeof getRevenueReportSchema>;
export type GetAdvisorEarningsInput = z.infer<typeof getAdvisorEarningsSchema>;
export type GetOrganizationRevenueInput = z.infer<typeof getOrganizationRevenueSchema>;
export type Generate1099Input = z.infer<typeof generate1099Schema>;
export type GetBulk1099DataInput = z.infer<typeof getBulk1099DataSchema>;
export type CreateRevenueDisputeInput = z.infer<typeof createRevenueDisputeSchema>;
export type ResolveRevenueDisputeInput = z.infer<typeof resolveRevenueDisputeSchema>;
export type GetCommissionAnalyticsInput = z.infer<typeof getCommissionAnalyticsSchema>;
export type GetAdvisorPerformanceMetricsInput = z.infer<typeof getAdvisorPerformanceMetricsSchema>;
export type CreatePayoutScheduleInput = z.infer<typeof createPayoutScheduleSchema>;
export type UpdatePayoutScheduleInput = z.infer<typeof updatePayoutScheduleSchema>;