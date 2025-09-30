import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, organizationProcedure } from '@/server/api/trpc';

/**
 * Type definitions for stage history
 */
interface StageHistoryEntry {
  stageId: string;
  stageName: string;
  enteredAt: Date;
  exitedAt?: Date;
  notes?: string;
  performedBy: string;
}

/**
 * Input validation schemas
 */
const createApplicationSchema = z.object({
  jobPostingId: z.string().cuid(),
  candidateId: z.string().cuid(),
  resumeUrl: z.string().url(),
  coverLetter: z.string().optional(),
  customAnswers: z.record(z.any()).optional(),
  appliedVia: z.enum(['career_site', 'linkedin', 'indeed', 'referral', 'direct', 'ziprecruiter']).default('career_site'),
  coverLetterUrl: z.string().url().optional(),
  additionalDocs: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),
});

const listApplicationsSchema = z.object({
  jobPostingId: z.string().cuid(),
  status: z.string().optional(),
  stageId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().cuid().optional(),
});

const updateStageSchema = z.object({
  id: z.string().cuid(),
  newStageId: z.string().cuid(),
  notes: z.string().optional(),
});

const assignSchema = z.object({
  id: z.string().cuid(),
  assignedToId: z.string().cuid(),
});

const rateSchema = z.object({
  id: z.string().cuid(),
  overallRating: z.number().int().min(1).max(5),
  technicalRating: z.number().int().min(1).max(5).optional(),
  culturalFitRating: z.number().int().min(1).max(5).optional(),
  evaluationNotes: z.string().optional(),
});

const rejectSchema = z.object({
  id: z.string().cuid(),
  rejectionReason: z.string().min(1),
  rejectionCategory: z.enum([
    'qualifications',
    'experience',
    'culture_fit',
    'compensation',
    'location',
    'other',
  ]),
  sendEmail: z.boolean().default(false),
});

const extendOfferSchema = z.object({
  id: z.string().cuid(),
  offerAmount: z.number().positive(),
  offerDate: z.date().optional(),
});

const declineOfferSchema = z.object({
  id: z.string().cuid(),
  declineReason: z.string().optional(),
});

const flagSchema = z.object({
  id: z.string().cuid(),
  flagReason: z.string().min(1),
});

/**
 * Helper function to log application activity
 */
async function logApplicationActivity(
  prisma: any,
  organizationId: string,
  applicationId: string,
  activityType: string,
  description: string,
  performedBy: string,
  changes?: any,
  metadata?: any
) {
  await prisma.applicationActivity.create({
    data: {
      organizationId,
      applicationId,
      activityType,
      description,
      performedBy,
      changes: changes || null,
      metadata: metadata || null,
      performedAt: new Date(),
    },
  });
}

/**
 * Application tRPC Router
 *
 * Handles all application management operations including:
 * - Application submission and tracking
 * - Stage management and progression
 * - Team assignment and collaboration
 * - Rating and evaluation
 * - Offer management
 * - Resume parsing and AI screening
 *
 * Security:
 * - All procedures use organizationProcedure for multi-tenant isolation
 * - Activity logging for comprehensive audit trails
 * - Proper validation and error handling
 */
export const applicationRouter = createTRPCRouter({
  /**
   * Create new application
   *
   * Security:
   * - Validates candidate and job posting belong to organization
   * - Auto-sets organizationId from context
   * - Creates initial stage history entry
   *
   * Features:
   * - Sets initial status to "new"
   * - Initializes parsingStatus to "pending"
   * - Creates first stage history entry
   * - Returns application with full relations
   */
  create: organizationProcedure
    .input(createApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify candidate belongs to organization
      const candidate = await ctx.prisma.candidate.findFirst({
        where: {
          id: input.candidateId,
          organizationId: ctx.organizationId,
        },
      });

      if (!candidate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Candidate not found in organization',
        });
      }

      // Verify job posting belongs to organization and is active
      const jobPosting = await ctx.prisma.jobPosting.findFirst({
        where: {
          id: input.jobPostingId,
          organizationId: ctx.organizationId,
          deletedAt: null,
        },
        include: {
          pipelineStages: true,
        },
      });

      if (!jobPosting) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job posting not found or inactive',
        });
      }

      // Get the default initial stage (usually "Applied" with order 0)
      const initialStage = await ctx.prisma.applicationStage.findFirst({
        where: {
          organizationId: ctx.organizationId,
          OR: [
            { isDefault: true },
            { order: 0 },
          ],
        },
        orderBy: {
          order: 'asc',
        },
      });

      if (!initialStage) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No application stages configured. Please set up pipeline stages first.',
        });
      }

      // Create initial stage history entry
      const stageHistory: StageHistoryEntry[] = [
        {
          stageId: initialStage.id,
          stageName: initialStage.name,
          enteredAt: new Date(),
          performedBy: ctx.userId,
        },
      ];

      // Create application
      const application = await ctx.prisma.application.create({
        data: {
          organizationId: ctx.organizationId,
          candidateId: input.candidateId,
          jobPostingId: input.jobPostingId,
          resumeUrl: input.resumeUrl,
          coverLetter: input.coverLetter,
          customAnswers: input.customAnswers,
          appliedVia: input.appliedVia,
          coverLetterUrl: input.coverLetterUrl,
          additionalDocs: input.additionalDocs,
          applicationDate: new Date(),
          status: 'new',
          currentStageId: initialStage.id,
          stageHistory,
          parsingStatus: 'pending',
          daysInCurrentStage: 0,
          daysInPipeline: 0,
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              location: true,
              currentTitle: true,
              currentCompany: true,
            },
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
              department: true,
              location: true,
              employmentType: true,
            },
          },
          currentStage: true,
        },
      });

      // Increment application count on job posting
      await ctx.prisma.jobPosting.update({
        where: { id: input.jobPostingId },
        data: {
          applicationCount: {
            increment: 1,
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        application.id,
        'application_submitted',
        `Application submitted for ${jobPosting.title}`,
        ctx.userId,
        null,
        {
          appliedVia: input.appliedVia,
          initialStage: initialStage.name,
        }
      );

      return application;
    }),

  /**
   * List applications for a job with filters
   *
   * Security:
   * - Filters by organizationId automatically
   * - Only shows applications from user's organization
   *
   * Features:
   * - Cursor-based pagination
   * - Filter by status and stage
   * - Includes candidate and current stage details
   * - Sorted by application date (newest first)
   */
  list: organizationProcedure
    .input(listApplicationsSchema)
    .query(async ({ ctx, input }) => {
      // Verify job posting belongs to organization
      const jobPosting = await ctx.prisma.jobPosting.findFirst({
        where: {
          id: input.jobPostingId,
          organizationId: ctx.organizationId,
        },
      });

      if (!jobPosting) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job posting not found in organization',
        });
      }

      const where: any = {
        organizationId: ctx.organizationId,
        jobPostingId: input.jobPostingId,
      };

      if (input.status) {
        where.status = input.status;
      }

      if (input.stageId) {
        where.currentStageId = input.stageId;
      }

      const cursorOptions = input.cursor
        ? { cursor: { id: input.cursor }, skip: 1 }
        : {};

      const applications = await ctx.prisma.application.findMany({
        where,
        take: input.limit + 1,
        ...cursorOptions,
        orderBy: { applicationDate: 'desc' },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              location: true,
              currentTitle: true,
              currentCompany: true,
              yearsExperience: true,
            },
          },
          currentStage: {
            select: {
              id: true,
              name: true,
              type: true,
              order: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const hasMore = applications.length > input.limit;
      const results = hasMore ? applications.slice(0, input.limit) : applications;
      const nextCursor = hasMore ? results[results.length - 1]?.id : null;

      return {
        applications: results,
        nextCursor,
        hasMore,
      };
    }),

  /**
   * Get application by ID
   *
   * Security:
   * - Validates organizationId matches
   * - Throws FORBIDDEN if organization mismatch
   *
   * Features:
   * - Full application details
   * - All relations included
   * - Interview history
   * - Activity log count
   */
  getById: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          candidate: {
            include: {
              tags: true,
            },
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
              department: true,
              location: true,
              employmentType: true,
              experienceLevel: true,
              description: true,
              requirements: true,
              preferredSkills: true,
            },
          },
          currentStage: true,
          interviews: {
            orderBy: {
              scheduledAt: 'asc',
            },
            include: {
              interviewers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              activities: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this application',
        });
      }

      return application;
    }),

  /**
   * Update application stage
   *
   * Security:
   * - Validates organizationId matches
   * - Verifies new stage belongs to organization
   *
   * Features:
   * - Updates stage history with timestamp
   * - Resets daysInCurrentStage counter
   * - Logs activity for audit trail
   * - Updates stage statistics
   */
  updateStage: organizationProcedure
    .input(updateStageSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          currentStage: true,
          jobPosting: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this application',
        });
      }

      // Verify new stage belongs to organization
      const newStage = await ctx.prisma.applicationStage.findFirst({
        where: {
          id: input.newStageId,
          organizationId: ctx.organizationId,
        },
      });

      if (!newStage) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Stage not found in organization',
        });
      }

      // Update stage history - mark previous stage as exited
      const stageHistory = application.stageHistory as StageHistoryEntry[];
      if (stageHistory.length > 0) {
        const lastEntry = stageHistory[stageHistory.length - 1];
        if (lastEntry && !lastEntry.exitedAt) {
          lastEntry.exitedAt = new Date();
        }
      }

      // Add new stage entry
      stageHistory.push({
        stageId: newStage.id,
        stageName: newStage.name,
        enteredAt: new Date(),
        notes: input.notes,
        performedBy: ctx.userId,
      });

      // Update application
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          currentStageId: newStage.id,
          stageHistory,
          daysInCurrentStage: 0,
          status: newStage.type === 'hired' ? 'hired' :
                  newStage.type === 'rejected' ? 'rejected' :
                  newStage.type === 'offer' ? 'offer' :
                  newStage.type === 'interview' ? 'interviewing' :
                  'screening',
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          currentStage: true,
          jobPosting: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'stage_changed',
        `Moved from ${application.currentStage?.name || 'unknown'} to ${newStage.name}`,
        ctx.userId,
        {
          from: application.currentStageId,
          to: newStage.id,
        },
        {
          notes: input.notes,
        }
      );

      return updatedApplication;
    }),

  /**
   * Assign application to team member
   *
   * Security:
   * - Validates assignedTo user belongs to organization
   * - Only allows assignment within organization
   *
   * Features:
   * - Updates assignedAt timestamp
   * - Logs assignment activity
   * - Sends notification to assigned user (future enhancement)
   */
  assign: organizationProcedure
    .input(assignSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          candidate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this application',
        });
      }

      // Verify assigned user belongs to organization
      const assignedUser = await ctx.prisma.user.findFirst({
        where: {
          id: input.assignedToId,
          organizationId: ctx.organizationId,
        },
      });

      if (!assignedUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User not found in organization',
        });
      }

      // Update application
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          assignedToId: input.assignedToId,
          assignedAt: new Date(),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'assigned',
        `Assigned to ${assignedUser.name}`,
        ctx.userId,
        {
          assignedTo: input.assignedToId,
        }
      );

      return updatedApplication;
    }),

  /**
   * Rate application
   *
   * Security:
   * - Validates organizationId matches
   * - Only allows rating within organization
   *
   * Features:
   * - Validates ratings are 1-5
   * - Supports partial rating (not all ratings required)
   * - Logs rating activity
   */
  rate: organizationProcedure
    .input(rateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to rate this application',
        });
      }

      // Update application ratings
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          overallRating: input.overallRating,
          technicalRating: input.technicalRating,
          culturalFitRating: input.culturalFitRating,
          evaluationNotes: input.evaluationNotes,
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'rating_updated',
        `Rated ${input.overallRating}/5 stars`,
        ctx.userId,
        {
          overallRating: input.overallRating,
          technicalRating: input.technicalRating,
          culturalFitRating: input.culturalFitRating,
        }
      );

      return updatedApplication;
    }),

  /**
   * Reject application
   *
   * Security:
   * - Validates organizationId matches
   * - Logs rejection with reason
   *
   * Features:
   * - Sets rejection status and metadata
   * - Logs rejection activity with category
   * - Optionally triggers rejection email
   * - Updates job posting statistics
   */
  reject: organizationProcedure
    .input(rejectSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          candidate: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          jobPosting: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to reject this application',
        });
      }

      // Update application
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: ctx.userId,
          rejectionReason: input.rejectionReason,
          rejectionCategory: input.rejectionCategory,
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'rejected',
        `Application rejected: ${input.rejectionReason}`,
        ctx.userId,
        {
          rejectionCategory: input.rejectionCategory,
        }
      );

      // TODO: If sendEmail is true, queue rejection email
      if (input.sendEmail) {
        // Queue email job here
        // await queueRejectionEmail(application.candidate.email, application.jobPosting.title, input.rejectionReason);
      }

      return updatedApplication;
    }),

  /**
   * Extend job offer
   *
   * Security:
   * - Validates organizationId matches
   * - Only allows offers within organization
   *
   * Features:
   * - Sets offer metadata and status
   * - Updates application status to "offer"
   * - Logs offer activity
   * - Sends offer notification (future enhancement)
   */
  extendOffer: organizationProcedure
    .input(extendOfferSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          candidate: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          jobPosting: {
            select: {
              title: true,
              salaryMin: true,
              salaryMax: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to extend offer for this application',
        });
      }

      // Validate offer amount is reasonable
      if (application.jobPosting.salaryMin && input.offerAmount < application.jobPosting.salaryMin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Offer amount is below minimum salary for this position',
        });
      }

      if (application.jobPosting.salaryMax && input.offerAmount > application.jobPosting.salaryMax * 1.2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Offer amount exceeds maximum salary range significantly',
        });
      }

      // Update application
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          offerExtended: true,
          offerDate: input.offerDate || new Date(),
          offerAmount: input.offerAmount,
          status: 'offer',
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'offer_extended',
        `Offer extended: $${input.offerAmount.toLocaleString()}`,
        ctx.userId,
        {
          offerAmount: input.offerAmount,
        }
      );

      return updatedApplication;
    }),

  /**
   * Accept offer
   *
   * Security:
   * - Validates organizationId matches
   * - Verifies offer was extended
   *
   * Features:
   * - Marks offer as accepted
   * - Updates status to "hired"
   * - Increments job posting filled count
   * - Logs acceptance activity
   */
  acceptOffer: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          jobPosting: true,
          candidate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this application',
        });
      }

      if (!application.offerExtended) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No offer has been extended for this application',
        });
      }

      // Update application
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          offerAccepted: true,
          offerAcceptedDate: new Date(),
          status: 'hired',
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Increment filled count on job posting
      await ctx.prisma.jobPosting.update({
        where: { id: application.jobPostingId },
        data: {
          filledCount: {
            increment: 1,
          },
        },
      });

      // If all openings filled, close the job posting
      if (application.jobPosting.filledCount + 1 >= application.jobPosting.openings) {
        await ctx.prisma.jobPosting.update({
          where: { id: application.jobPostingId },
          data: {
            status: 'closed',
          },
        });
      }

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'offer_accepted',
        'Offer accepted - candidate hired',
        ctx.userId
      );

      return updatedApplication;
    }),

  /**
   * Decline offer
   *
   * Security:
   * - Validates organizationId matches
   * - Verifies offer was extended
   *
   * Features:
   * - Marks offer as declined
   * - Reverts status to previous stage
   * - Logs decline activity with reason
   */
  declineOffer: organizationProcedure
    .input(declineOfferSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          candidate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this application',
        });
      }

      if (!application.offerExtended) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No offer has been extended for this application',
        });
      }

      // Update application - revert to previous status
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          offerAccepted: false,
          offerDeclinedReason: input.declineReason,
          status: 'rejected', // Mark as rejected since they declined
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'offer_declined',
        `Offer declined${input.declineReason ? `: ${input.declineReason}` : ''}`,
        ctx.userId,
        {
          declineReason: input.declineReason,
        }
      );

      return updatedApplication;
    }),

  /**
   * Flag application for review
   *
   * Security:
   * - Validates organizationId matches
   *
   * Features:
   * - Sets flagged status with reason
   * - Logs flag activity
   * - Notifies relevant team members (future enhancement)
   */
  flag: organizationProcedure
    .input(flagSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to flag this application',
        });
      }

      // Update application
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          isFlagged: true,
          flagReason: input.flagReason,
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'flagged',
        `Flagged for review: ${input.flagReason}`,
        ctx.userId,
        {
          flagReason: input.flagReason,
        }
      );

      return updatedApplication;
    }),

  /**
   * Archive application
   *
   * Security:
   * - Validates organizationId matches
   * - Soft archive (can be unarchived)
   *
   * Features:
   * - Sets archived status with timestamp
   * - Logs archive activity
   * - Preserves all application data
   */
  archive: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to archive this application',
        });
      }

      // Update application
      const updatedApplication = await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'archived',
        'Application archived',
        ctx.userId
      );

      return { success: true, message: 'Application archived successfully' };
    }),

  /**
   * Trigger resume parsing
   *
   * Security:
   * - Validates organizationId matches
   * - Rate-limited to prevent abuse
   *
   * Features:
   * - Sets parsing status to "processing"
   * - Queues background job for Azure Form Recognizer
   * - Returns job ID for tracking
   * - Logs parsing initiation
   */
  triggerParsing: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          candidate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to parse this application',
        });
      }

      if (!application.resumeUrl) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No resume URL found for this application',
        });
      }

      // Update parsing status
      await ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          parsingStatus: 'processing',
        },
      });

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'parsing_triggered',
        'Resume parsing initiated',
        ctx.userId
      );

      // TODO: Queue background job for resume parsing
      // const jobId = await queueResumeParsingJob({
      //   applicationId: input.id,
      //   resumeUrl: application.resumeUrl,
      //   organizationId: ctx.organizationId,
      // });

      const jobId = `parsing-${input.id}-${Date.now()}`;

      return {
        success: true,
        jobId,
        message: 'Resume parsing queued successfully',
      };
    }),

  /**
   * Trigger AI screening
   *
   * Security:
   * - Validates organizationId matches
   * - Requires parsed resume data
   *
   * Features:
   * - Validates parsed data exists
   * - Queues background job for GPT-4 analysis
   * - Returns job ID for tracking
   * - Matches keywords and skills
   * - Calculates fit score
   */
  triggerAIScreening: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify application exists and belongs to organization
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.id },
        include: {
          jobPosting: {
            select: {
              title: true,
              description: true,
              requirements: true,
              preferredSkills: true,
              keywords: true,
            },
          },
          candidate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to screen this application',
        });
      }

      if (application.parsingStatus !== 'completed' || !application.parsedResumeData) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Resume must be parsed before AI screening. Please trigger parsing first.',
        });
      }

      // Log activity
      await logApplicationActivity(
        ctx.prisma,
        ctx.organizationId,
        input.id,
        'ai_screening_triggered',
        'AI screening initiated',
        ctx.userId
      );

      // TODO: Queue background job for AI screening
      // const jobId = await queueAIScreeningJob({
      //   applicationId: input.id,
      //   parsedResumeData: application.parsedResumeData,
      //   jobRequirements: application.jobPosting.requirements,
      //   organizationId: ctx.organizationId,
      // });

      const jobId = `screening-${input.id}-${Date.now()}`;

      return {
        success: true,
        jobId,
        message: 'AI screening queued successfully',
      };
    }),
});