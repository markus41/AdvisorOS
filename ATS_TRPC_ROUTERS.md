# ATS tRPC Router Structure

## Router Files Overview

```
apps/web/src/server/api/routers/
├── ats.router.ts              # Main ATS router (aggregates all sub-routers)
├── job-posting.router.ts      # Job posting management
├── candidate.router.ts        # Candidate management
├── application.router.ts      # Application tracking
├── interview.router.ts        # Interview scheduling & management
├── application-stage.router.ts # Pipeline stage management
├── ats-analytics.router.ts    # ATS analytics & reporting
└── resume-parsing.router.ts   # Resume parsing with Azure Form Recognizer
```

---

## 1. Main ATS Router

**File**: `apps/web/src/server/api/routers/ats.router.ts`

```typescript
import { createTRPCRouter } from '@/server/api/trpc';
import { jobPostingRouter } from './job-posting.router';
import { candidateRouter } from './candidate.router';
import { applicationRouter } from './application.router';
import { interviewRouter } from './interview.router';
import { applicationStageRouter } from './application-stage.router';
import { atsAnalyticsRouter } from './ats-analytics.router';
import { resumeParsingRouter } from './resume-parsing.router';

/**
 * Applicant Tracking System (ATS) Router
 *
 * Aggregates all ATS-related sub-routers for job postings,
 * candidates, applications, interviews, and analytics.
 */
export const atsRouter = createTRPCRouter({
  jobPosting: jobPostingRouter,
  candidate: candidateRouter,
  application: applicationRouter,
  interview: interviewRouter,
  stage: applicationStageRouter,
  analytics: atsAnalyticsRouter,
  resumeParsing: resumeParsingRouter,
});
```

**Update** `apps/web/src/server/api/root.ts`:

```typescript
import { atsRouter } from '@/server/api/routers/ats.router';

export const appRouter = createTRPCRouter({
  // ... existing routers ...
  ats: atsRouter,
});
```

---

## 2. Job Posting Router

**File**: `apps/web/src/server/api/routers/job-posting.router.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, publicProcedure, adminProcedure } from '@/server/api/trpc';
import { JobPostingService } from '@/server/services/jobPosting.service';
import {
  createJobPostingSchema,
  updateJobPostingSchema,
  publishJobPostingSchema,
  listJobPostingsSchema,
} from '@/lib/validations/ats';
import { TRPCError } from '@trpc/server';

export const jobPostingRouter = createTRPCRouter({
  /**
   * Create new job posting
   * Requires: Organization membership
   */
  create: organizationProcedure
    .input(createJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.create(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Get job posting by ID
   * Public endpoint - returns published job postings only
   */
  getById: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ input }) => {
      return await JobPostingService.getById(input.id, false); // false = public view
    }),

  /**
   * Get job posting by slug
   * Public endpoint for SEO-friendly URLs
   */
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      return await JobPostingService.getBySlug(input.slug);
    }),

  /**
   * Get job posting by ID (internal view with full details)
   * Requires: Organization membership
   */
  getByIdInternal: organizationProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      return await JobPostingService.getByIdInternal(
        input.id,
        ctx.organizationId
      );
    }),

  /**
   * Update job posting
   * Requires: Hiring manager or admin
   */
  update: organizationProcedure
    .input(updateJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.update(
        input.id,
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Delete job posting
   * Requires: Admin
   */
  delete: adminProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.delete(
        input.id,
        ctx.organizationId,
        ctx.userId
      );
    }),

  /**
   * List job postings with filtering
   * Requires: Organization membership
   */
  list: organizationProcedure
    .input(listJobPostingsSchema)
    .query(async ({ ctx, input }) => {
      return await JobPostingService.list(ctx.organizationId, input);
    }),

  /**
   * List public job postings (career site)
   * Public endpoint
   */
  listPublic: publicProcedure
    .input(z.object({
      organizationSlug: z.string().optional(),
      searchQuery: z.string().optional(),
      employmentType: z.array(z.string()).optional(),
      location: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return await JobPostingService.listPublic(input);
    }),

  /**
   * Publish job posting to job boards
   * Requires: Admin or Recruiter
   */
  publish: organizationProcedure
    .input(publishJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.publish(
        input.jobPostingId,
        ctx.organizationId,
        ctx.userId,
        input.distributeTo,
        input.publishDate
      );
    }),

  /**
   * Unpublish job posting
   * Requires: Admin or Recruiter
   */
  unpublish: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().cuid(),
      removeFrom: z.array(z.enum(['linkedin', 'indeed', 'ziprecruiter', 'career_site'])),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.unpublish(
        input.jobPostingId,
        ctx.organizationId,
        ctx.userId,
        input.removeFrom
      );
    }),

  /**
   * Close job posting (mark as filled)
   * Requires: Hiring manager or admin
   */
  close: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().cuid(),
      reason: z.enum(['filled', 'cancelled', 'on_hold']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.close(
        input.jobPostingId,
        ctx.organizationId,
        ctx.userId,
        input.reason,
        input.notes
      );
    }),

  /**
   * Duplicate job posting
   * Requires: Organization membership
   */
  duplicate: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.duplicate(
        input.jobPostingId,
        ctx.organizationId,
        ctx.userId
      );
    }),

  /**
   * Get job posting analytics
   * Requires: Organization membership
   */
  getAnalytics: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      return await JobPostingService.getAnalytics(
        input.jobPostingId,
        ctx.organizationId
      );
    }),

  /**
   * Increment view count (public career site views)
   * Public endpoint
   */
  incrementViewCount: publicProcedure
    .input(z.object({
      jobPostingId: z.string().cuid(),
    }))
    .mutation(async ({ input }) => {
      return await JobPostingService.incrementViewCount(input.jobPostingId);
    }),
});
```

---

## 3. Candidate Router

**File**: `apps/web/src/server/api/routers/candidate.router.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, adminProcedure } from '@/server/api/trpc';
import { CandidateService } from '@/server/services/candidate.service';
import {
  createCandidateSchema,
  updateCandidateSchema,
  listCandidatesSchema,
} from '@/lib/validations/ats';

export const candidateRouter = createTRPCRouter({
  /**
   * Create candidate
   * Requires: Organization membership
   */
  create: organizationProcedure
    .input(createCandidateSchema)
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.create(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Get candidate by ID
   * Requires: Organization membership
   */
  getById: organizationProcedure
    .input(z.object({
      id: z.string().cuid(),
      includeApplications: z.boolean().default(true),
      includeInterviews: z.boolean().default(true),
      includeCommunications: z.boolean().default(false),
      includeActivities: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return await CandidateService.getById(
        input.id,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Update candidate
   * Requires: Organization membership
   */
  update: organizationProcedure
    .input(updateCandidateSchema)
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.update(
        input.id,
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Delete candidate
   * Requires: Admin
   */
  delete: adminProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.delete(
        input.id,
        ctx.organizationId,
        ctx.userId
      );
    }),

  /**
   * List candidates with filtering
   * Requires: Organization membership
   */
  list: organizationProcedure
    .input(listCandidatesSchema)
    .query(async ({ ctx, input }) => {
      return await CandidateService.list(ctx.organizationId, input);
    }),

  /**
   * Search candidates by skills, experience, location
   * Requires: Organization membership
   */
  search: organizationProcedure
    .input(z.object({
      query: z.string().min(2).max(200),
      filters: z.object({
        skills: z.array(z.string()).optional(),
        yearsExperienceMin: z.number().int().optional(),
        location: z.string().optional(),
        status: z.array(z.string()).optional(),
      }).optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return await CandidateService.search(
        ctx.organizationId,
        input.query,
        input.filters,
        input.limit
      );
    }),

  /**
   * Add tags to candidate
   * Requires: Organization membership
   */
  addTags: organizationProcedure
    .input(z.object({
      candidateId: z.string().cuid(),
      tags: z.array(z.string()).min(1).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.addTags(
        input.candidateId,
        ctx.organizationId,
        input.tags
      );
    }),

  /**
   * Remove tags from candidate
   * Requires: Organization membership
   */
  removeTags: organizationProcedure
    .input(z.object({
      candidateId: z.string().cuid(),
      tags: z.array(z.string()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.removeTags(
        input.candidateId,
        ctx.organizationId,
        input.tags
      );
    }),

  /**
   * Update candidate rating
   * Requires: Organization membership
   */
  updateRating: organizationProcedure
    .input(z.object({
      candidateId: z.string().cuid(),
      rating: z.number().int().min(1).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.updateRating(
        input.candidateId,
        ctx.organizationId,
        ctx.userId,
        input.rating
      );
    }),

  /**
   * Add note to candidate
   * Requires: Organization membership
   */
  addNote: organizationProcedure
    .input(z.object({
      candidateId: z.string().cuid(),
      note: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.addNote(
        input.candidateId,
        ctx.organizationId,
        ctx.userId,
        input.note
      );
    }),

  /**
   * Get candidate activity timeline
   * Requires: Organization membership
   */
  getActivityTimeline: organizationProcedure
    .input(z.object({
      candidateId: z.string().cuid(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      return await CandidateService.getActivityTimeline(
        input.candidateId,
        ctx.organizationId,
        input.limit
      );
    }),

  /**
   * Merge duplicate candidates
   * Requires: Admin
   */
  merge: adminProcedure
    .input(z.object({
      primaryCandidateId: z.string().cuid(),
      duplicateCandidateId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await CandidateService.merge(
        input.primaryCandidateId,
        input.duplicateCandidateId,
        ctx.organizationId,
        ctx.userId
      );
    }),

  /**
   * Find duplicate candidates
   * Requires: Organization membership
   */
  findDuplicates: organizationProcedure
    .query(async ({ ctx }) => {
      return await CandidateService.findDuplicates(ctx.organizationId);
    }),
});
```

---

## 4. Application Router

**File**: `apps/web/src/server/api/routers/application.router.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, publicProcedure } from '@/server/api/trpc';
import { ApplicationService } from '@/server/services/application.service';
import {
  createApplicationSchema,
  updateApplicationSchema,
  moveApplicationStageSchema,
  bulkMoveApplicationsSchema,
  rejectApplicationSchema,
  extendOfferSchema,
  listApplicationsSchema,
} from '@/lib/validations/ats';

export const applicationRouter = createTRPCRouter({
  /**
   * Submit application (public endpoint for career site)
   * Public endpoint
   */
  submit: publicProcedure
    .input(createApplicationSchema)
    .mutation(async ({ input }) => {
      return await ApplicationService.submit(input);
    }),

  /**
   * Create application (internal)
   * Requires: Organization membership
   */
  create: organizationProcedure
    .input(createApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.create(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Get application by ID
   * Requires: Organization membership
   */
  getById: organizationProcedure
    .input(z.object({
      id: z.string().cuid(),
      includeCandidate: z.boolean().default(true),
      includeJobPosting: z.boolean().default(true),
      includeInterviews: z.boolean().default(true),
      includeActivities: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getById(
        input.id,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Update application
   * Requires: Organization membership
   */
  update: organizationProcedure
    .input(updateApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.update(
        input.id,
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * List applications with filtering
   * Requires: Organization membership
   */
  list: organizationProcedure
    .input(listApplicationsSchema)
    .query(async ({ ctx, input }) => {
      return await ApplicationService.list(ctx.organizationId, input);
    }),

  /**
   * Move application to different stage
   * Requires: Organization membership
   */
  moveStage: organizationProcedure
    .input(moveApplicationStageSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.moveStage(
        input.applicationId,
        ctx.organizationId,
        ctx.userId,
        input.newStageId,
        input.notes
      );
    }),

  /**
   * Bulk move applications to stage (drag-and-drop)
   * Requires: Organization membership
   */
  bulkMoveStage: organizationProcedure
    .input(bulkMoveApplicationsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.bulkMoveStage(
        input.applicationIds,
        ctx.organizationId,
        ctx.userId,
        input.newStageId,
        input.notes
      );
    }),

  /**
   * Assign application to user
   * Requires: Organization membership
   */
  assign: organizationProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      assigneeId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.assign(
        input.applicationId,
        ctx.organizationId,
        ctx.userId,
        input.assigneeId
      );
    }),

  /**
   * Reject application
   * Requires: Organization membership
   */
  reject: organizationProcedure
    .input(rejectApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.reject(
        input.applicationId,
        ctx.organizationId,
        ctx.userId,
        input.rejectionReason,
        input.rejectionCategory,
        input.sendRejectionEmail,
        input.emailTemplate
      );
    }),

  /**
   * Extend offer to candidate
   * Requires: Admin or Hiring Manager
   */
  extendOffer: organizationProcedure
    .input(extendOfferSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.extendOffer(
        input.applicationId,
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Mark offer as accepted
   * Requires: Organization membership
   */
  acceptOffer: organizationProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      acceptanceDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.acceptOffer(
        input.applicationId,
        ctx.organizationId,
        ctx.userId,
        input.acceptanceDate
      );
    }),

  /**
   * Mark offer as declined
   * Requires: Organization membership
   */
  declineOffer: organizationProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      declineReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.declineOffer(
        input.applicationId,
        ctx.organizationId,
        ctx.userId,
        input.declineReason
      );
    }),

  /**
   * Get application pipeline view (Kanban board data)
   * Requires: Organization membership
   */
  getPipelineView: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getPipelineView(
        ctx.organizationId,
        input.jobPostingId
      );
    }),

  /**
   * Get application activity timeline
   * Requires: Organization membership
   */
  getActivityTimeline: organizationProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getActivityTimeline(
        input.applicationId,
        ctx.organizationId,
        input.limit
      );
    }),
});
```

---

## Continue with remaining routers...

(Interview, Application Stage, Analytics, Resume Parsing routers follow similar patterns - would you like me to continue with the complete specifications for these?)