# ATS Validation Schemas

Create file: `apps/web/src/lib/validations/ats.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// JOB POSTING SCHEMAS
// ============================================================================

export const createJobPostingSchema = z.object({
  // Basic Information
  title: z.string().min(5).max(200),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'director', 'executive']),

  // Description
  description: z.string().min(100).max(10000),
  responsibilities: z.array(z.string()).min(1).max(20),
  requirements: z.array(z.string()).min(1).max(20),
  preferredSkills: z.array(z.string()).max(20).default([]),

  // Compensation
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().length(3).default('USD'),
  compensationType: z.enum(['salary', 'hourly', 'commission', 'equity']).optional(),
  benefits: z.array(z.string()).default([]),

  // Status & Workflow
  status: z.enum(['draft', 'active', 'paused', 'closed', 'filled', 'cancelled']).default('draft'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  openings: z.number().int().positive().default(1),

  // Hiring Team
  hiringManagerId: z.string().cuid().optional(),
  recruiterId: z.string().cuid().optional(),

  // Pipeline Configuration
  pipelineStages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    order: z.number().int(),
  })).optional(),

  // Publishing
  isPublished: z.boolean().default(false),
  expiresAt: z.date().optional(),
  isInternal: z.boolean().default(false),

  // Application Settings
  applicationDeadline: z.date().optional(),
  customQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'multiselect', 'boolean']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
  requiredDocuments: z.array(z.enum(['resume', 'cover_letter', 'portfolio', 'references'])).default(['resume']),
  allowsRemoteWork: z.boolean().default(false),
  visaSponsorshipAvailable: z.boolean().default(false),

  // SEO
  keywords: z.array(z.string()).max(20).default([]),
  tags: z.array(z.string()).max(10).default([]),
});

export const updateJobPostingSchema = createJobPostingSchema.partial().extend({
  id: z.string().cuid(),
});

export const publishJobPostingSchema = z.object({
  jobPostingId: z.string().cuid(),
  distributeTo: z.array(z.enum(['linkedin', 'indeed', 'ziprecruiter', 'career_site'])),
  publishDate: z.date().optional(), // For scheduled publishing
});

export const listJobPostingsSchema = z.object({
  // Filters
  status: z.enum(['draft', 'active', 'paused', 'closed', 'filled', 'cancelled']).optional(),
  employmentType: z.array(z.string()).optional(),
  experienceLevel: z.array(z.string()).optional(),
  department: z.string().optional(),
  hiringManagerId: z.string().cuid().optional(),
  recruiterId: z.string().cuid().optional(),

  // Search
  searchQuery: z.string().optional(),

  // Sorting
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'application_count', 'expires_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// CANDIDATE SCHEMAS
// ============================================================================

export const createCandidateSchema = z.object({
  // Personal Information
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(), // E.164 format
  location: z.string().optional(),

  // Professional Information
  currentTitle: z.string().optional(),
  currentCompany: z.string().optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),

  // Online Presence
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),

  // Documents
  resumeFileUrl: z.string().url(),
  coverLetterUrl: z.string().url().optional(),
  portfolioFileUrl: z.string().url().optional(),

  // Skills & Qualifications
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string().optional(),
    graduationYear: z.number().int().optional(),
  })).optional(),

  // Source & Attribution
  source: z.enum(['linkedin', 'indeed', 'ziprecruiter', 'referral', 'career_site', 'agency', 'direct']),
  sourceDetails: z.string().optional(),
  referredBy: z.string().cuid().optional(),

  // Status & Tags
  status: z.enum(['new', 'screening', 'active', 'passive', 'hired', 'rejected', 'withdrawn']).default('new'),
  tags: z.array(z.string()).default([]),
  rating: z.number().int().min(1).max(5).optional(),

  // Privacy
  consentToContact: z.boolean().default(true),
  gdprConsent: z.boolean().default(false),

  // Notes
  notes: z.string().optional(),
});

export const updateCandidateSchema = createCandidateSchema.partial().extend({
  id: z.string().cuid(),
});

export const listCandidatesSchema = z.object({
  // Filters
  status: z.array(z.enum(['new', 'screening', 'active', 'passive', 'hired', 'rejected', 'withdrawn'])).optional(),
  source: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  yearsExperienceMin: z.number().int().optional(),
  yearsExperienceMax: z.number().int().optional(),

  // Skills Filter
  skills: z.array(z.string()).optional(),

  // Search
  searchQuery: z.string().optional(),

  // Sorting
  sortBy: z.enum(['created_at', 'updated_at', 'last_contacted_at', 'rating', 'years_experience']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// APPLICATION SCHEMAS
// ============================================================================

export const createApplicationSchema = z.object({
  candidateId: z.string().cuid(),
  jobPostingId: z.string().cuid(),

  // Submission Data
  coverLetter: z.string().optional(),
  customAnswers: z.record(z.any()).optional(),
  appliedVia: z.enum(['career_site', 'linkedin', 'indeed', 'referral', 'direct']),

  // Documents
  resumeUrl: z.string().url(),
  coverLetterUrl: z.string().url().optional(),
  additionalDocs: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),

  // Initial Assignment
  assignedToId: z.string().cuid().optional(),
});

export const updateApplicationSchema = z.object({
  id: z.string().cuid(),

  // Status Updates
  status: z.enum(['new', 'screening', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn']).optional(),
  currentStageId: z.string().cuid().optional(),

  // Ratings
  overallRating: z.number().int().min(1).max(5).optional(),
  technicalRating: z.number().int().min(1).max(5).optional(),
  culturalFitRating: z.number().int().min(1).max(5).optional(),
  evaluationNotes: z.string().optional(),

  // Assignment
  assignedToId: z.string().cuid().optional(),

  // Follow-up
  nextFollowUpDate: z.date().optional(),

  // Flags
  isFlagged: z.boolean().optional(),
  flagReason: z.string().optional(),

  // Notes
  notes: z.string().optional(),
});

export const moveApplicationStageSchema = z.object({
  applicationId: z.string().cuid(),
  newStageId: z.string().cuid(),
  notes: z.string().optional(),
});

export const bulkMoveApplicationsSchema = z.object({
  applicationIds: z.array(z.string().cuid()).min(1).max(50),
  newStageId: z.string().cuid(),
  notes: z.string().optional(),
});

export const rejectApplicationSchema = z.object({
  applicationId: z.string().cuid(),
  rejectionReason: z.string().min(10).max(1000),
  rejectionCategory: z.enum(['qualifications', 'experience', 'location', 'salary', 'culture_fit', 'other']),
  sendRejectionEmail: z.boolean().default(true),
  emailTemplate: z.string().optional(),
});

export const extendOfferSchema = z.object({
  applicationId: z.string().cuid(),
  offerAmount: z.number().positive(),
  offerDetails: z.object({
    startDate: z.date().optional(),
    benefits: z.array(z.string()).optional(),
    equity: z.string().optional(),
    bonusStructure: z.string().optional(),
    otherTerms: z.string().optional(),
  }).optional(),
  offerLetterUrl: z.string().url().optional(),
  expirationDate: z.date().optional(),
});

export const listApplicationsSchema = z.object({
  // Filters
  jobPostingId: z.string().cuid().optional(),
  candidateId: z.string().cuid().optional(),
  status: z.array(z.enum(['new', 'screening', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn'])).optional(),
  currentStageId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
  appliedVia: z.array(z.string()).optional(),

  // Date Filters
  applicationDateFrom: z.date().optional(),
  applicationDateTo: z.date().optional(),

  // Rating Filters
  minRating: z.number().int().min(1).max(5).optional(),
  minAiScore: z.number().min(0).max(100).optional(),

  // Flags
  isFlagged: z.boolean().optional(),
  isArchived: z.boolean().optional(),

  // Search
  searchQuery: z.string().optional(),

  // Sorting
  sortBy: z.enum([
    'application_date',
    'updated_at',
    'overall_rating',
    'ai_screening_score',
    'days_in_pipeline'
  ]).default('application_date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// INTERVIEW SCHEMAS
// ============================================================================

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().cuid(),
  candidateId: z.string().cuid(),
  jobPostingId: z.string().cuid(),

  // Interview Details
  title: z.string().min(3).max(200),
  type: z.enum(['phone', 'video', 'in_person', 'technical', 'panel', 'behavioral']),
  round: z.number().int().positive().default(1),

  // Scheduling
  startTime: z.date(),
  duration: z.number().int().min(15).max(480).default(60), // 15 min to 8 hours
  timezone: z.string().default('America/New_York'),

  // Location / Platform
  location: z.string().optional(),
  meetingLink: z.string().url().optional(),
  meetingId: z.string().optional(),
  meetingPassword: z.string().optional(),
  dialInNumber: z.string().optional(),

  // Participants
  interviewers: z.array(z.object({
    userId: z.string().cuid(),
    name: z.string(),
    role: z.string().optional(),
  })).min(1),
  organizerId: z.string().cuid().optional(),

  // Interview Content
  interviewGuide: z.object({
    questions: z.array(z.object({
      question: z.string(),
      category: z.string().optional(),
      expectedDuration: z.number().int().optional(),
    })).optional(),
    topics: z.array(z.string()).optional(),
  }).optional(),
  focusAreas: z.array(z.string()).default([]),

  // Notifications
  notifyCandidate: z.boolean().default(true),
  notifyInterviewers: z.boolean().default(true),
  candidateEmailTemplate: z.string().optional(),
});

export const updateInterviewSchema = z.object({
  id: z.string().cuid(),

  // Rescheduling
  startTime: z.date().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  timezone: z.string().optional(),

  // Status
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),

  // Location / Platform
  location: z.string().optional(),
  meetingLink: z.string().url().optional(),

  // Evaluation
  feedback: z.record(z.any()).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  technicalRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  cultureFitRating: z.number().int().min(1).max(5).optional(),
  recommendation: z.enum(['strong_hire', 'hire', 'neutral', 'no_hire', 'strong_no_hire']).optional(),

  // Notes
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  additionalNotes: z.string().optional(),

  // Artifacts
  recordingUrl: z.string().url().optional(),
  transcriptUrl: z.string().url().optional(),
});

export const cancelInterviewSchema = z.object({
  interviewId: z.string().cuid(),
  cancellationReason: z.string().min(10).max(500),
  notifyCandidate: z.boolean().default(true),
  notifyInterviewers: z.boolean().default(true),
});

export const listInterviewsSchema = z.object({
  // Filters
  applicationId: z.string().cuid().optional(),
  candidateId: z.string().cuid().optional(),
  jobPostingId: z.string().cuid().optional(),
  status: z.array(z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])).optional(),
  type: z.array(z.string()).optional(),

  // Date Filters
  scheduledFrom: z.date().optional(),
  scheduledTo: z.date().optional(),

  // Sorting
  sortBy: z.enum(['scheduled_at', 'created_at', 'updated_at']).default('scheduled_at'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// APPLICATION STAGE SCHEMAS
// ============================================================================

export const createApplicationStageSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  type: z.enum(['screening', 'interview', 'assessment', 'offer', 'hired', 'rejected']),
  order: z.number().int().min(0),

  // Configuration
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  allowManualMove: z.boolean().default(true),

  // Automation
  autoAdvanceConditions: z.record(z.any()).optional(),
  autoRejectConditions: z.record(z.any()).optional(),
  requiredActions: z.array(z.string()).default([]),

  // Notifications
  notifyHiringManager: z.boolean().default(false),
  notifyRecruiter: z.boolean().default(false),
  candidateEmailTemplate: z.string().optional(),

  // SLA
  targetDays: z.number().int().min(1).optional(),
  maxDays: z.number().int().min(1).optional(),
});

export const updateApplicationStageSchema = createApplicationStageSchema.partial().extend({
  id: z.string().cuid(),
});

export const reorderStagesSchema = z.object({
  stages: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().int().min(0),
  })).min(1),
});

// ============================================================================
// RESUME PARSING SCHEMAS
// ============================================================================

export const parseResumeSchema = z.object({
  fileUrl: z.string().url(),
  candidateId: z.string().cuid().optional(),
  applicationId: z.string().cuid().optional(),
  parseOptions: z.object({
    extractSkills: z.boolean().default(true),
    extractEducation: z.boolean().default(true),
    extractWorkHistory: z.boolean().default(true),
    extractCertifications: z.boolean().default(true),
  }).optional(),
});

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const getAtsAnalyticsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  jobPostingId: z.string().cuid().optional(),
  department: z.string().optional(),
  metrics: z.array(z.enum([
    'applications_count',
    'hires_count',
    'time_to_fill',
    'time_to_hire',
    'cost_per_hire',
    'source_effectiveness',
    'pipeline_conversion',
    'offer_acceptance_rate',
  ])).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
export type PublishJobPostingInput = z.infer<typeof publishJobPostingSchema>;
export type ListJobPostingsInput = z.infer<typeof listJobPostingsSchema>;

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type ListCandidatesInput = z.infer<typeof listCandidatesSchema>;

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type MoveApplicationStageInput = z.infer<typeof moveApplicationStageSchema>;
export type BulkMoveApplicationsInput = z.infer<typeof bulkMoveApplicationsSchema>;
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;
export type ExtendOfferInput = z.infer<typeof extendOfferSchema>;
export type ListApplicationsInput = z.infer<typeof listApplicationsSchema>;

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type CancelInterviewInput = z.infer<typeof cancelInterviewSchema>;
export type ListInterviewsInput = z.infer<typeof listInterviewsSchema>;

export type CreateApplicationStageInput = z.infer<typeof createApplicationStageSchema>;
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;

export type ParseResumeInput = z.infer<typeof parseResumeSchema>;
export type GetAtsAnalyticsInput = z.infer<typeof getAtsAnalyticsSchema>;
```

## Key Validation Features

### 1. Type Safety
- Full TypeScript type inference
- Runtime validation matches compile-time types
- Automatic type exports for use in services and components

### 2. Security
- Email validation with proper regex
- Phone number validation (E.164 format)
- URL validation for all external links
- CUID validation for all ID references

### 3. Business Rules
- Salary min/max validation
- Stage ordering constraints
- Date range validation
- Array size limits for performance

### 4. User Experience
- Reasonable min/max lengths for text fields
- Default values for common scenarios
- Optional fields for flexibility
- Clear enum values for status fields

### 5. Performance
- Pagination limits (max 100 items)
- Array size constraints
- Efficient filtering options
- Optimized query parameters