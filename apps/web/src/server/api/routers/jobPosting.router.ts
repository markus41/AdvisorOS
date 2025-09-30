import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, organizationProcedure, publicProcedure } from '@/server/api/trpc';

/**
 * Slug generation utility
 * Converts job title to URL-friendly slug with random suffix for uniqueness
 */
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Math.random().toString(36).substr(2, 6)
  );
}

/**
 * Default pipeline stages for new job postings
 */
const defaultPipelineStages = [
  { id: 'applied', name: 'Applied', order: 0, type: 'screening' },
  { id: 'screening', name: 'Screening', order: 1, type: 'screening' },
  { id: 'interview', name: 'Interview', order: 2, type: 'interview' },
  { id: 'offer', name: 'Offer', order: 3, type: 'offer' },
  { id: 'hired', name: 'Hired', order: 4, type: 'hired' },
];

/**
 * Input validation schemas
 */
const createJobPostingSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.string().optional(),
  location: z.string().min(1),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
  description: z.string().min(1),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  compensationType: z.enum(['hourly', 'salary', 'commission']).default('salary'),
  benefits: z.array(z.string()).default([]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  openings: z.number().int().positive().default(1),
  hiringManagerId: z.string().cuid().optional(),
  recruiterId: z.string().cuid().optional(),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  expiresAt: z.date().optional(),
});

const updateJobPostingSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  department: z.string().optional(),
  location: z.string().min(1).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  description: z.string().min(1).optional(),
  responsibilities: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  compensationType: z.enum(['hourly', 'salary', 'commission']).optional(),
  benefits: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  openings: z.number().int().positive().optional(),
  filledCount: z.number().int().nonnegative().optional(),
  hiringManagerId: z.string().cuid().optional(),
  recruiterId: z.string().cuid().optional(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.date().optional(),
});

const listJobPostingsSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'closed', 'cancelled']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().cuid().optional(),
});

const publishJobPostingSchema = z.object({
  id: z.string().cuid(),
  distributeTo: z.array(z.enum(['linkedin', 'indeed', 'ziprecruiter'])).default([]),
});

/**
 * Job Posting tRPC Router
 *
 * Handles all job posting management operations with multi-tenant security,
 * proper validation, and comprehensive error handling.
 */
export const jobPostingRouter = createTRPCRouter({
  /**
   * Create new job posting
   *
   * Security:
   * - Requires authentication and organization membership
   * - Auto-sets organizationId from context
   * - Auto-sets createdBy from authenticated user
   *
   * Features:
   * - Auto-generates unique slug from title
   * - Initializes default pipeline stages
   * - Validates salary range if both min and max provided
   */
  create: organizationProcedure
    .input(createJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate salary range
      if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Minimum salary cannot be greater than maximum salary',
        });
      }

      // Verify hiring manager and recruiter belong to organization if specified
      if (input.hiringManagerId) {
        const hiringManager = await ctx.prisma.user.findFirst({
          where: {
            id: input.hiringManagerId,
            organizationId: ctx.organizationId,
          },
        });
        if (!hiringManager) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Hiring manager not found in organization',
          });
        }
      }

      if (input.recruiterId) {
        const recruiter = await ctx.prisma.user.findFirst({
          where: {
            id: input.recruiterId,
            organizationId: ctx.organizationId,
          },
        });
        if (!recruiter) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Recruiter not found in organization',
          });
        }
      }

      // Generate unique slug
      const slug = generateSlug(input.title);

      // Create job posting with default values
      const jobPosting = await ctx.prisma.jobPosting.create({
        data: {
          ...input,
          organizationId: ctx.organizationId,
          createdBy: ctx.userId,
          slug,
          status: 'draft',
          pipelineStages: defaultPipelineStages,
          viewCount: 0,
          applicationCount: 0,
          filledCount: 0,
          isPublished: false,
          distributedTo: [],
        },
        include: {
          hiringManager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return jobPosting;
    }),

  /**
   * List job postings with pagination
   *
   * Security:
   * - Filters by organizationId automatically
   * - Only shows jobs from user's organization
   *
   * Features:
   * - Cursor-based pagination for efficient large dataset handling
   * - Optional status filtering
   * - Includes hiring manager and recruiter details
   * - Sorted by creation date (newest first)
   */
  list: organizationProcedure
    .input(listJobPostingsSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {
        organizationId: ctx.organizationId,
        deletedAt: null, // Exclude soft-deleted jobs
      };

      if (input.status) {
        where.status = input.status;
      }

      const cursorOptions = input.cursor
        ? { cursor: { id: input.cursor }, skip: 1 }
        : {};

      const jobs = await ctx.prisma.jobPosting.findMany({
        where,
        take: input.limit + 1, // Fetch one extra to determine if there are more
        ...cursorOptions,
        orderBy: { createdAt: 'desc' },
        include: {
          hiringManager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      // Check if there are more results
      const hasMore = jobs.length > input.limit;
      const results = hasMore ? jobs.slice(0, input.limit) : jobs;
      const nextCursor = hasMore ? results[results.length - 1]?.id : null;

      return {
        jobs: results,
        nextCursor,
        hasMore,
      };
    }),

  /**
   * Get single job posting by ID
   *
   * Security:
   * - Validates organizationId matches
   * - Throws FORBIDDEN if organization mismatch
   * - Throws NOT_FOUND if job doesn't exist
   *
   * Features:
   * - Full job details with relations
   * - Application count
   * - Hiring manager and recruiter info
   */
  getById: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobPosting.findUnique({
        where: { id: input.id },
        include: {
          hiringManager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job posting not found',
        });
      }

      if (job.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this job posting',
        });
      }

      return job;
    }),

  /**
   * Update job posting
   *
   * Security:
   * - Validates organizationId matches
   * - Only allows updates within same organization
   *
   * Features:
   * - Partial updates supported
   * - Validates salary range if both provided
   * - Verifies hiring manager/recruiter belong to organization
   * - Returns updated job with relations
   */
  update: organizationProcedure
    .input(updateJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify job exists and belongs to organization
      const existingJob = await ctx.prisma.jobPosting.findUnique({
        where: { id },
      });

      if (!existingJob) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job posting not found',
        });
      }

      if (existingJob.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this job posting',
        });
      }

      // Validate salary range if both are being updated
      const salaryMin = updateData.salaryMin ?? existingJob.salaryMin;
      const salaryMax = updateData.salaryMax ?? existingJob.salaryMax;
      if (salaryMin && salaryMax && salaryMin > salaryMax) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Minimum salary cannot be greater than maximum salary',
        });
      }

      // Verify hiring manager belongs to organization if being updated
      if (updateData.hiringManagerId) {
        const hiringManager = await ctx.prisma.user.findFirst({
          where: {
            id: updateData.hiringManagerId,
            organizationId: ctx.organizationId,
          },
        });
        if (!hiringManager) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Hiring manager not found in organization',
          });
        }
      }

      // Verify recruiter belongs to organization if being updated
      if (updateData.recruiterId) {
        const recruiter = await ctx.prisma.user.findFirst({
          where: {
            id: updateData.recruiterId,
            organizationId: ctx.organizationId,
          },
        });
        if (!recruiter) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Recruiter not found in organization',
          });
        }
      }

      // Update job posting
      const updatedJob = await ctx.prisma.jobPosting.update({
        where: { id },
        data: updateData,
        include: {
          hiringManager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      return updatedJob;
    }),

  /**
   * Soft delete job posting
   *
   * Security:
   * - Validates organizationId matches
   * - Prevents deletion of jobs from other organizations
   *
   * Features:
   * - Soft delete (sets deletedAt timestamp)
   * - Preserves data for audit trail
   * - Job can be restored by clearing deletedAt
   */
  delete: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify job exists and belongs to organization
      const existingJob = await ctx.prisma.jobPosting.findUnique({
        where: { id: input.id },
      });

      if (!existingJob) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job posting not found',
        });
      }

      if (existingJob.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this job posting',
        });
      }

      // Soft delete by setting deletedAt timestamp
      await ctx.prisma.jobPosting.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
          status: 'cancelled', // Also mark as cancelled
        },
      });

      return { success: true, message: 'Job posting deleted successfully' };
    }),

  /**
   * Publish job posting
   *
   * Security:
   * - Validates organizationId matches
   * - Only allows publishing own organization's jobs
   *
   * Features:
   * - Sets isPublished flag
   * - Records publishedAt timestamp
   * - Updates distributedTo array with target platforms
   * - Changes status to 'active' automatically
   * - Validates job is in publishable state
   */
  publish: organizationProcedure
    .input(publishJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify job exists and belongs to organization
      const existingJob = await ctx.prisma.jobPosting.findUnique({
        where: { id: input.id },
      });

      if (!existingJob) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job posting not found',
        });
      }

      if (existingJob.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to publish this job posting',
        });
      }

      // Validate job is in publishable state
      if (existingJob.deletedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot publish deleted job posting',
        });
      }

      if (!existingJob.title || !existingJob.description) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job posting must have title and description to be published',
        });
      }

      // Publish job posting
      const publishedJob = await ctx.prisma.jobPosting.update({
        where: { id: input.id },
        data: {
          isPublished: true,
          publishedAt: new Date(),
          status: 'active',
          distributedTo: input.distributeTo,
        },
        include: {
          hiringManager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Job posting published successfully',
        job: publishedJob,
      };
    }),

  /**
   * Increment view count
   *
   * Security:
   * - Public procedure (no authentication required)
   * - Allows tracking views from external sources
   *
   * Features:
   * - Accepts ID or slug for flexible access
   * - Only increments if job is published
   * - Returns updated view count
   */
  incrementViews: publicProcedure
    .input(
      z.object({
        id: z.string().cuid().optional(),
        slug: z.string().optional(),
      }).refine(data => data.id || data.slug, {
        message: 'Either id or slug must be provided',
      })
    )
    .mutation(async ({ ctx, input }) => {
      const where = input.id ? { id: input.id } : { slug: input.slug };

      const job = await ctx.prisma.jobPosting.findUnique({
        where,
        select: {
          id: true,
          isPublished: true,
          viewCount: true,
        },
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job posting not found',
        });
      }

      // Only increment views for published jobs
      if (!job.isPublished) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot track views for unpublished job posting',
        });
      }

      // Increment view count
      const updatedJob = await ctx.prisma.jobPosting.update({
        where: { id: job.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        select: {
          id: true,
          viewCount: true,
        },
      });

      return {
        success: true,
        viewCount: updatedJob.viewCount,
      };
    }),

  /**
   * Get job posting by slug (for public career pages)
   *
   * Security:
   * - Public procedure (no authentication required)
   * - Only returns published jobs
   * - Ideal for career page integration
   *
   * Features:
   * - SEO-friendly slug-based access
   * - Full job details with relations
   * - Application count
   * - Automatically filters unpublished jobs
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobPosting.findUnique({
        where: { slug: input.slug },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
              website: true,
            },
          },
          hiringManager: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job posting not found',
        });
      }

      // Only return published jobs for public access
      if (!job.isPublished) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job posting not available',
        });
      }

      // Check if job has expired
      if (job.expiresAt && job.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job posting has expired',
        });
      }

      return job;
    }),
});