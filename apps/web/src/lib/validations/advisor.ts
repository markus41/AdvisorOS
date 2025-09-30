import { z } from 'zod';

// Advisor Profile Creation
export const createAdvisorProfileSchema = z.object({
  // Professional Information
  professionalTitle: z.string().optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  certifications: z.array(z.string()).default([]),
  licenseNumber: z.string().optional(),
  licenseState: z.string().length(2).optional(),
  licenseExpiration: z.date().optional(),

  // Bio & Branding
  shortBio: z.string().max(500).optional(),
  longBio: z.string().max(5000).optional(),
  tagline: z.string().max(200).optional(),
  profilePhotoUrl: z.string().url().optional(),
  videoIntroUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  linkedInUrl: z.string().url().optional(),

  // Expertise & Specializations
  industries: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  businessSizes: z.array(z.enum(['startup', 'smb', 'mid_market', 'enterprise'])).default([]),
  technicalSkills: z.array(z.string()).default([]),
  softwareExpertise: z.array(z.string()).default([]),

  // Languages
  languages: z.array(z.string()).default(['English']),

  // Pricing
  hourlyRate: z.number().positive().optional(),
  monthlyRetainerMin: z.number().positive().optional(),
  monthlyRetainerMax: z.number().positive().optional(),
  acceptsEquity: z.boolean().default(false),

  // Capacity
  maxClients: z.number().int().positive().max(50).default(15),
  preferredEngagementLength: z.enum(['short_term', 'long_term', 'both']).default('both'),
  minimumEngagementMonths: z.number().int().min(1).max(24).default(3),

  // Preferences
  remoteOnly: z.boolean().default(true),
  willingToTravel: z.boolean().default(false),
  travelRadius: z.number().int().optional(),
  preferredClientSizes: z.array(z.string()).default([]),

  // Service Offerings
  offersFreeCons ultation: z.boolean().default(true),
  freeConsultationMinutes: z.number().int().min(15).max(120).default(30),
  responseTimeHours: z.number().int().min(1).max(168).default(24),
});

export const updateAdvisorProfileSchema = createAdvisorProfileSchema.partial().extend({
  id: z.string().cuid(),
});

export const advisorAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  availabilityNote: z.string().max(500).optional(),
});

export const listAdvisorsSchema = z.object({
  // Filters
  industries: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  businessSizes: z.array(z.enum(['startup', 'smb', 'mid_market', 'enterprise'])).optional(),
  certifications: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxHourlyRate: z.number().positive().optional(),
  maxMonthlyRetainer: z.number().positive().optional(),
  yearsExperienceMin: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
  remoteOnly: z.boolean().optional(),

  // Search
  searchQuery: z.string().optional(),

  // Sorting
  sortBy: z.enum([
    'rating',
    'experience',
    'price_low',
    'price_high',
    'reviews',
    'newest',
    'relevance'
  ]).default('rating'),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const uploadProfileVideoSchema = z.object({
  videoUrl: z.string().url(),
  videoDurationSeconds: z.number().int().min(30).max(300),
  thumbnailUrl: z.string().url().optional(),
});

export const submitForVerificationSchema = z.object({
  certificationDocuments: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    expirationDate: z.date().optional(),
  })),
  licenseDocuments: z.array(z.object({
    state: z.string().length(2),
    licenseNumber: z.string(),
    url: z.string().url(),
    expirationDate: z.date(),
  })),
  backgroundCheckConsent: z.boolean(),
  termsAccepted: z.boolean(),
});

export const getAdvisorStatsSchema = z.object({
  advisorId: z.string().cuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const advisorOnboardingSchema = z.object({
  step: z.enum(['profile', 'verification', 'services', 'pricing', 'preferences', 'review']),
  data: z.record(z.any()),
});

// Type exports
export type CreateAdvisorProfileInput = z.infer<typeof createAdvisorProfileSchema>;
export type UpdateAdvisorProfileInput = z.infer<typeof updateAdvisorProfileSchema>;
export type ListAdvisorsInput = z.infer<typeof listAdvisorsSchema>;
export type UploadProfileVideoInput = z.infer<typeof uploadProfileVideoSchema>;
export type SubmitForVerificationInput = z.infer<typeof submitForVerificationSchema>;
export type GetAdvisorStatsInput = z.infer<typeof getAdvisorStatsSchema>;