import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, adminProcedure } from '@/server/api/trpc';
import { RevenueService } from '@/server/services/revenue.service';
import {
  createRevenueShareSchema,
  updateRevenueShareSchema,
  calculateCommissionSchema,
  bulkCalculateCommissionsSchema,
  processAdvisorPaymentSchema,
  recordClientPaymentSchema,
  getRevenueReportSchema,
  getAdvisorEarningsSchema,
  getOrganizationRevenueSchema,
  generate1099Schema,
  getBulk1099DataSchema,
} from '@/lib/validations/revenue';

export const revenueRouter = createTRPCRouter({
  /**
   * Create revenue share record
   * Requires: Admin role
   */
  createRevenueShare: adminProcedure
    .input(createRevenueShareSchema)
    .mutation(async ({ ctx, input }) => {
      return await RevenueService.createRevenueShare(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Update revenue share record
   * Requires: Admin role
   */
  updateRevenueShare: adminProcedure
    .input(updateRevenueShareSchema)
    .mutation(async ({ ctx, input }) => {
      return await RevenueService.updateRevenueShare(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Calculate commission for an engagement
   */
  calculateCommission: organizationProcedure
    .input(calculateCommissionSchema)
    .query(async ({ ctx, input }) => {
      return await RevenueService.calculateCommission(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Bulk calculate commissions for a period
   * Requires: Admin role
   */
  bulkCalculateCommissions: adminProcedure
    .input(bulkCalculateCommissionsSchema)
    .mutation(async ({ ctx, input }) => {
      return await RevenueService.bulkCalculateCommissions(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Process advisor payment
   * Requires: Admin role
   */
  processAdvisorPayment: adminProcedure
    .input(processAdvisorPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      return await RevenueService.processAdvisorPayment(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Record client payment
   */
  recordClientPayment: organizationProcedure
    .input(recordClientPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      return await RevenueService.recordClientPayment(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Get revenue report
   * Requires: Admin role
   */
  getRevenueReport: adminProcedure
    .input(getRevenueReportSchema)
    .query(async ({ ctx, input }) => {
      return await RevenueService.getRevenueReport(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Get advisor earnings
   */
  getAdvisorEarnings: organizationProcedure
    .input(getAdvisorEarningsSchema)
    .query(async ({ ctx, input }) => {
      return await RevenueService.getAdvisorEarnings(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Get organization revenue
   * Requires: Admin role
   */
  getOrganizationRevenue: adminProcedure
    .input(getOrganizationRevenueSchema)
    .query(async ({ ctx, input }) => {
      return await RevenueService.getOrganizationRevenue(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Generate 1099 data for advisor
   * Requires: Admin role
   */
  generate1099: adminProcedure
    .input(generate1099Schema)
    .query(async ({ ctx, input }) => {
      return await RevenueService.generate1099Data(
        ctx.organizationId,
        input.advisorId,
        input.taxYear
      );
    }),

  /**
   * Get bulk 1099 data for tax year
   * Requires: Admin role
   */
  getBulk1099Data: adminProcedure
    .input(getBulk1099DataSchema)
    .query(async ({ ctx, input }) => {
      // Get all advisors with earnings above threshold
      const revenueShares = await ctx.prisma.revenueShare.findMany({
        where: {
          engagement: { organizationId: ctx.organizationId },
          taxYear: input.taxYear,
          tax1099Reportable: true,
        },
        include: {
          advisor: true,
        },
      });

      // Group by advisor
      const advisorEarnings = revenueShares.reduce((acc: any, rs) => {
        const advisorId = rs.advisorId;
        if (!acc[advisorId]) {
          acc[advisorId] = {
            advisorId,
            advisorName: rs.advisor?.name,
            advisorEmail: rs.advisor?.email,
            totalPayments: 0,
            numberOfPayments: 0,
            payments: [],
          };
        }
        acc[advisorId].totalPayments += Number(rs.advisorPayout);
        acc[advisorId].numberOfPayments++;
        acc[advisorId].payments.push(rs);
        return acc;
      }, {});

      // Filter by minimum amount
      const reportableAdvisors = Object.values(advisorEarnings).filter(
        (a: any) => a.totalPayments >= input.minimumAmount
      );

      return {
        taxYear: input.taxYear,
        totalAdvisors: reportableAdvisors.length,
        advisors: reportableAdvisors,
      };
    }),

  /**
   * Get revenue share by ID
   */
  getRevenueShareById: organizationProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const revenueShare = await ctx.prisma.revenueShare.findFirst({
        where: {
          id: input.id,
          engagement: { organizationId: ctx.organizationId },
        },
        include: {
          engagement: true,
          advisor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          client: {
            select: {
              id: true,
              businessName: true,
              primaryContactEmail: true,
            },
          },
        },
      });

      if (!revenueShare) {
        throw new Error('Revenue share record not found');
      }

      return revenueShare;
    }),

  /**
   * List revenue shares for engagement
   */
  listByEngagement: organizationProcedure
    .input(z.object({
      engagementId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const revenueShares = await ctx.prisma.revenueShare.findMany({
        where: {
          engagementId: input.engagementId,
          engagement: { organizationId: ctx.organizationId },
        },
        include: {
          advisor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { periodStartDate: 'desc' },
      });

      return revenueShares;
    }),

  /**
   * Get pending payouts for advisor
   */
  getPendingPayouts: organizationProcedure
    .input(z.object({
      advisorId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const advisorId = input.advisorId || ctx.userId;

      const pendingPayouts = await ctx.prisma.revenueShare.findMany({
        where: {
          advisorId,
          status: { in: ['pending', 'client_paid'] },
          engagement: { organizationId: ctx.organizationId },
        },
        include: {
          client: {
            select: {
              id: true,
              businessName: true,
            },
          },
          engagement: {
            select: {
              id: true,
              type: true,
            },
          },
        },
        orderBy: { periodEndDate: 'asc' },
      });

      // Calculate total pending
      const totalPending = pendingPayouts.reduce(
        (sum, rs) => sum + Number(rs.advisorPayout),
        0
      );

      return {
        payouts: pendingPayouts,
        totalPending,
        count: pendingPayouts.length,
      };
    }),
});