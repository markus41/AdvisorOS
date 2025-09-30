import { z } from 'zod';

// Client Needs Assessment for AI Matching
export const clientNeedsAssessmentSchema = z.object({
  clientId: z.string().cuid(),

  // Business Information
  industry: z.string(),
  businessSize: z.enum(['startup', 'smb', 'mid_market', 'enterprise']),
  annualRevenue: z.number().positive().optional(),
  numberOfEmployees: z.number().int().positive().optional(),
  yearsInBusiness: z.number().int().min(0).optional(),

  // Service Needs
  servicesNeeded: z.array(z.string()).min(1),
  urgency: z.enum(['immediate', 'within_month', 'within_quarter', 'exploratory']),
  budget: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
    type: z.enum(['hourly', 'monthly_retainer', 'project_based', 'flexible']),
  }),

  // Engagement Preferences
  engagementLength: z.enum(['short_term', 'long_term', 'project_based', 'ongoing']),
  expectedStartDate: z.date().optional(),
  preferredCommunication: z.array(z.enum(['email', 'phone', 'video', 'in_person'])),

  // Advisor Preferences
  certificationRequirements: z.array(z.string()).default([]),
  yearsExperienceMin: z.number().int().min(0).optional(),
  industryExperienceRequired: z.boolean().default(false),
  languagePreferences: z.array(z.string()).default(['English']),
  remoteOk: z.boolean().default(true),

  // Additional Context
  specificChallenges: z.string().max(2000).optional(),
  successCriteria: z.string().max(1000).optional(),
  previousAdvisorExperience: z.string().max(1000).optional(),
});

// AI Matching Request
export const requestMatchingSchema = z.object({
  clientId: z.string().cuid(),
  needsAssessmentId: z.string().cuid().optional(),
  autoMatch: z.boolean().default(true),
  numberOfMatches: z.number().int().min(1).max(10).default(5),
  matchAlgorithmVersion: z.string().default('v1.0'),
});

// Manual Match Override
export const createManualMatchSchema = z.object({
  clientId: z.string().cuid(),
  advisorProfileId: z.string().cuid(),
  matchReason: z.string().max(500),
  matchScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

// Match Response/Acceptance
export const respondToMatchSchema = z.object({
  matchId: z.string().cuid(),
  response: z.enum(['accepted', 'declined', 'interested']),
  message: z.string().max(1000).optional(),
});

export const updateMatchStatusSchema = z.object({
  matchId: z.string().cuid(),
  status: z.enum([
    'suggested',
    'client_viewed',
    'client_contacted',
    'advisor_responded',
    'call_scheduled',
    'proposal_sent',
    'accepted',
    'declined',
    'expired'
  ]),
  notes: z.string().max(1000).optional(),
});

// Advisor Search & Discovery
export const searchAdvisorsSchema = z.object({
  query: z.string().min(2).max(200),
  filters: z.object({
    industries: z.array(z.string()).optional(),
    services: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxHourlyRate: z.number().positive().optional(),
    yearsExperienceMin: z.number().int().min(0).optional(),
  }).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

// Featured Advisors
export const getFeaturedAdvisorsSchema = z.object({
  category: z.enum(['top_rated', 'recently_joined', 'industry_expert', 'trending']).optional(),
  industry: z.string().optional(),
  limit: z.number().int().min(1).max(20).default(10),
});

// Marketplace Analytics
export const getMarketplaceStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const getMatchingAnalyticsSchema = z.object({
  clientId: z.string().cuid().optional(),
  advisorProfileId: z.string().cuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('week'),
});

// Advisor Recommendations
export const getRecommendedAdvisorsSchema = z.object({
  clientId: z.string().cuid(),
  limit: z.number().int().min(1).max(20).default(5),
  excludeContactedAdvisors: z.boolean().default(false),
  requireAvailability: z.boolean().default(true),
});

// Comparison
export const compareAdvisorsSchema = z.object({
  advisorProfileIds: z.array(z.string().cuid()).min(2).max(5),
});

// Type exports
export type ClientNeedsAssessmentInput = z.infer<typeof clientNeedsAssessmentSchema>;
export type RequestMatchingInput = z.infer<typeof requestMatchingSchema>;
export type CreateManualMatchInput = z.infer<typeof createManualMatchSchema>;
export type RespondToMatchInput = z.infer<typeof respondToMatchSchema>;
export type UpdateMatchStatusInput = z.infer<typeof updateMatchStatusSchema>;
export type SearchAdvisorsInput = z.infer<typeof searchAdvisorsSchema>;
export type GetFeaturedAdvisorsInput = z.infer<typeof getFeaturedAdvisorsSchema>;
export type GetMarketplaceStatsInput = z.infer<typeof getMarketplaceStatsSchema>;
export type GetMatchingAnalyticsInput = z.infer<typeof getMatchingAnalyticsSchema>;
export type GetRecommendedAdvisorsInput = z.infer<typeof getRecommendedAdvisorsSchema>;
export type CompareAdvisorsInput = z.infer<typeof compareAdvisorsSchema>;