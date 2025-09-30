import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, publicProcedure, adminProcedure } from '@/server/api/trpc';
import { MarketplaceService } from '@/server/services/marketplace.service';
import {
  clientNeedsAssessmentSchema,
  requestMatchingSchema,
  createManualMatchSchema,
  respondToMatchSchema,
  updateMatchStatusSchema,
  searchAdvisorsSchema,
  getFeaturedAdvisorsSchema,
  compareAdvisorsSchema,
} from '@/lib/validations/marketplace';

export const marketplaceRouter = createTRPCRouter({
  /**
   * Create client needs assessment for AI matching
   */
  createNeedsAssessment: organizationProcedure
    .input(clientNeedsAssessmentSchema)
    .mutation(async ({ ctx, input }) => {
      return await MarketplaceService.createNeedsAssessment(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Request AI-powered advisor matching
   */
  requestMatching: organizationProcedure
    .input(requestMatchingSchema)
    .mutation(async ({ ctx, input }) => {
      return await MarketplaceService.requestMatching(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Create manual match (admin override)
   */
  createManualMatch: adminProcedure
    .input(createManualMatchSchema)
    .mutation(async ({ ctx, input }) => {
      return await MarketplaceService.createManualMatch(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Respond to match suggestion (client or advisor)
   */
  respondToMatch: organizationProcedure
    .input(respondToMatchSchema)
    .mutation(async ({ ctx, input }) => {
      return await MarketplaceService.respondToMatch(
        ctx.userId,
        ctx.organizationId,
        input
      );
    }),

  /**
   * Update match status
   */
  updateMatchStatus: organizationProcedure
    .input(updateMatchStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return await MarketplaceService.updateMatchStatus(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Search advisors with full-text search
   * Public endpoint
   */
  searchAdvisors: publicProcedure
    .input(searchAdvisorsSchema)
    .query(async ({ input }) => {
      return await MarketplaceService.searchAdvisors(input);
    }),

  /**
   * Get featured advisors
   * Public endpoint
   */
  getFeaturedAdvisors: publicProcedure
    .input(getFeaturedAdvisorsSchema)
    .query(async ({ input }) => {
      return await MarketplaceService.getFeaturedAdvisors(input);
    }),

  /**
   * Get marketplace statistics
   */
  getStats: organizationProcedure
    .query(async ({ ctx }) => {
      return await MarketplaceService.getMarketplaceStats(ctx.organizationId);
    }),

  /**
   * Compare multiple advisors side-by-side
   * Public endpoint
   */
  compareAdvisors: publicProcedure
    .input(compareAdvisorsSchema)
    .query(async ({ input }) => {
      return await MarketplaceService.compareAdvisors(input.advisorProfileIds);
    }),

  /**
   * Get matches for a client
   */
  getClientMatches: organizationProcedure
    .input(z.object({
      clientId: z.string().cuid(),
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
      ]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        clientId: input.clientId,
        client: { organizationId: ctx.organizationId },
      };

      if (input.status) {
        where.status = input.status;
      }

      const cursorOptions = input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {};

      const matches = await ctx.prisma.advisorMarketplaceMatch.findMany({
        where,
        take: input.limit + 1,
        ...cursorOptions,
        orderBy: { suggestedAt: 'desc' },
        include: {
          advisorProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      const hasMore = matches.length > input.limit;
      const results = hasMore ? matches.slice(0, input.limit) : matches;
      const nextCursor = hasMore ? results[results.length - 1]?.id : null;

      return {
        matches: results,
        nextCursor,
        hasMore,
      };
    }),

  /**
   * Get matches for an advisor
   */
  getAdvisorMatches: organizationProcedure
    .input(z.object({
      advisorProfileId: z.string().cuid().optional(),
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
      ]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Get advisor profile for current user if not specified
      let advisorProfileId = input.advisorProfileId;
      if (!advisorProfileId) {
        const profile = await ctx.prisma.advisorProfile.findFirst({
          where: {
            userId: ctx.userId,
            user: { organizationId: ctx.organizationId },
          },
        });
        if (!profile) {
          throw new Error('Advisor profile not found');
        }
        advisorProfileId = profile.id;
      }

      const where: any = {
        advisorProfileId,
      };

      if (input.status) {
        where.status = input.status;
      }

      const cursorOptions = input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {};

      const matches = await ctx.prisma.advisorMarketplaceMatch.findMany({
        where,
        take: input.limit + 1,
        ...cursorOptions,
        orderBy: { suggestedAt: 'desc' },
        include: {
          client: true,
        },
      });

      const hasMore = matches.length > input.limit;
      const results = hasMore ? matches.slice(0, input.limit) : matches;
      const nextCursor = hasMore ? results[results.length - 1]?.id : null;

      return {
        matches: results,
        nextCursor,
        hasMore,
      };
    }),
});