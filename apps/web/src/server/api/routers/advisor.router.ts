import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, publicProcedure, adminProcedure } from '@/server/api/trpc';
import { AdvisorProfileService } from '@/server/services/advisorProfile.service';
import {
  createAdvisorProfileSchema,
  updateAdvisorProfileSchema,
  listAdvisorsSchema,
  uploadProfileVideoSchema,
  submitForVerificationSchema,
  getAdvisorStatsSchema,
  advisorAvailabilitySchema,
} from '@/lib/validations/advisor';

export const advisorRouter = createTRPCRouter({
  /**
   * Create advisor profile
   * Requires: User authentication + organization membership
   */
  createProfile: organizationProcedure
    .input(createAdvisorProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return await AdvisorProfileService.createProfile(
        ctx.userId,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Get advisor profile by ID
   * Public endpoint - returns public data only
   */
  getProfile: publicProcedure
    .input(z.object({
      profileId: z.string().cuid(),
    }))
    .query(async ({ input }) => {
      return await AdvisorProfileService.getProfile(input.profileId, false);
    }),

  /**
   * Get own advisor profile (includes private data)
   */
  getMyProfile: organizationProcedure
    .query(async ({ ctx }) => {
      return await AdvisorProfileService.getProfileByUserId(
        ctx.userId,
        ctx.organizationId
      );
    }),

  /**
   * Get advisor profile by user ID (with private data)
   * Requires: Organization membership
   */
  getProfileByUserId: organizationProcedure
    .input(z.object({
      userId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.userId;
      return await AdvisorProfileService.getProfileByUserId(
        userId,
        ctx.organizationId
      );
    }),

  /**
   * Update advisor profile
   * Requires: Profile ownership
   */
  updateProfile: organizationProcedure
    .input(updateAdvisorProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return await AdvisorProfileService.updateProfile(
        ctx.userId,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Set availability status
   */
  setAvailability: organizationProcedure
    .input(advisorAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      return await AdvisorProfileService.setAvailability(
        ctx.userId,
        ctx.organizationId,
        input.isAvailable,
        input.availabilityNote
      );
    }),

  /**
   * List available advisors (marketplace browse)
   * Public endpoint with filtering and pagination
   */
  listAvailable: publicProcedure
    .input(listAdvisorsSchema)
    .query(async ({ input }) => {
      return await AdvisorProfileService.listAvailableAdvisors(input);
    }),

  /**
   * Upload profile video
   */
  uploadVideo: organizationProcedure
    .input(uploadProfileVideoSchema)
    .mutation(async ({ ctx, input }) => {
      return await AdvisorProfileService.uploadVideo(
        ctx.userId,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Submit profile for verification
   */
  submitForVerification: organizationProcedure
    .input(submitForVerificationSchema)
    .mutation(async ({ ctx, input }) => {
      return await AdvisorProfileService.submitForVerification(
        ctx.userId,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Get advisor statistics
   */
  getStats: organizationProcedure
    .input(getAdvisorStatsSchema)
    .query(async ({ ctx, input }) => {
      return await AdvisorProfileService.getStats(
        ctx.userId,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Admin: Approve advisor verification
   * Requires: Admin role
   */
  approveVerification: adminProcedure
    .input(z.object({
      profileId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await AdvisorProfileService.approveVerification(
        input.profileId,
        ctx.userId,
        ctx.organizationId
      );
    }),

  /**
   * Admin: Reject advisor verification
   * Requires: Admin role
   */
  rejectVerification: adminProcedure
    .input(z.object({
      profileId: z.string().cuid(),
      reason: z.string().min(10).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      return await AdvisorProfileService.rejectVerification(
        input.profileId,
        ctx.userId,
        ctx.organizationId,
        input.reason
      );
    }),
});