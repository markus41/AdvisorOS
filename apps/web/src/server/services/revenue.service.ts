import { PrismaClient, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type {
  CreateRevenueShareInput,
  UpdateRevenueShareInput,
  CalculateCommissionInput,
  BulkCalculateCommissionsInput,
  ProcessAdvisorPaymentInput,
  RecordClientPaymentInput,
  GetRevenueReportInput,
  GetAdvisorEarningsInput,
  GetOrganizationRevenueInput,
} from '../../lib/validations/revenue';

const prisma = new PrismaClient();

export class RevenueService {
  /**
   * Create revenue share record
   */
  static async createRevenueShare(
    organizationId: string,
    data: CreateRevenueShareInput
  ) {
    // Verify engagement exists
    const engagement = await prisma.engagement.findFirst({
      where: {
        id: data.engagementId,
        organizationId,
      },
    });

    if (!engagement) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Engagement not found',
      });
    }

    // Create revenue share record
    const revenueShare = await prisma.revenueShare.create({
      data: {
        ...data,
        status: 'pending',
        taxYear: data.periodStartDate.getFullYear(),
        tax1099Reportable: data.grossRevenue >= 600, // IRS threshold
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
          },
        },
      },
    });

    return revenueShare;
  }

  /**
   * Update revenue share record
   */
  static async updateRevenueShare(
    organizationId: string,
    data: UpdateRevenueShareInput
  ) {
    const { id, ...updateData } = data;

    // Verify revenue share belongs to organization
    const revenueShare = await prisma.revenueShare.findFirst({
      where: {
        id,
        engagement: { organizationId },
      },
    });

    if (!revenueShare) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Revenue share record not found',
      });
    }

    // Update status based on payment states
    let status = revenueShare.status;
    if (updateData.clientPaidAt && !updateData.advisorPaidAt) {
      status = 'client_paid';
    } else if (updateData.advisorPaidAt) {
      status = 'completed';
    }

    const updated = await prisma.revenueShare.update({
      where: { id },
      data: {
        ...updateData,
        status,
      },
    });

    return updated;
  }

  /**
   * Calculate commission for an engagement
   */
  static async calculateCommission(
    organizationId: string,
    data: CalculateCommissionInput
  ) {
    // Get engagement details
    const engagement = await prisma.engagement.findFirst({
      where: {
        id: data.engagementId,
        organizationId,
      },
      include: {
        client: true,
        advisorUser: {
          include: {
            advisorProfile: true,
          },
        },
      },
    });

    if (!engagement) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Engagement not found',
      });
    }

    // Get organization commission rate
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    const platformFeePercentage = organization?.commissionRate || 20; // Default 20%

    // Calculate fees
    const grossRevenue = data.grossRevenue;
    const platformFee = grossRevenue * (platformFeePercentage / 100);
    const advisorPayout = grossRevenue - platformFee;

    return {
      grossRevenue,
      platformFeePercentage,
      platformFee,
      advisorPayout,
      engagementId: data.engagementId,
      advisorId: engagement.advisorUserId,
      clientId: engagement.clientId,
    };
  }

  /**
   * Bulk calculate commissions for a period
   */
  static async bulkCalculateCommissions(
    organizationId: string,
    data: BulkCalculateCommissionsInput
  ) {
    // Build where clause
    const where: any = {
      organizationId,
      startDate: {
        gte: data.periodStartDate,
        lte: data.periodEndDate,
      },
      status: 'active',
    };

    if (data.advisorIds && data.advisorIds.length > 0) {
      where.advisorUserId = { in: data.advisorIds };
    }

    // Get engagements in period
    const engagements = await prisma.engagement.findMany({
      where,
      include: {
        invoices: {
          where: {
            status: 'paid',
            paidAt: {
              gte: data.periodStartDate,
              lte: data.periodEndDate,
            },
          },
        },
      },
    });

    // Calculate commissions
    const calculations = [];
    for (const engagement of engagements) {
      const totalRevenue = engagement.invoices.reduce(
        (sum, invoice) => sum + (invoice.total || 0),
        0
      );

      if (totalRevenue > 0) {
        const calculation = await this.calculateCommission(organizationId, {
          engagementId: engagement.id,
          grossRevenue: totalRevenue,
        });
        calculations.push(calculation);
      }
    }

    return calculations;
  }

  /**
   * Process advisor payment
   */
  static async processAdvisorPayment(
    organizationId: string,
    adminUserId: string,
    data: ProcessAdvisorPaymentInput
  ) {
    // Verify admin permission
    const admin = await prisma.user.findFirst({
      where: {
        id: adminUserId,
        organizationId,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!admin) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can process payments',
      });
    }

    // Update revenue share records
    const updated = await prisma.revenueShare.updateMany({
      where: {
        id: { in: data.revenueShareIds },
        engagement: { organizationId },
        status: { in: ['pending', 'client_paid'] },
      },
      data: {
        advisorPaidAt: data.paymentDate,
        advisorPaymentMethod: data.paymentMethod,
        advisorPaymentReference: data.paymentReference,
        status: 'completed',
        notes: data.notes,
      },
    });

    // TODO: Integrate with payment processor (Stripe, ACH)
    // TODO: Generate payment receipt
    // TODO: Send notification email

    return {
      processed: updated.count,
      paymentReference: data.paymentReference,
    };
  }

  /**
   * Record client payment
   */
  static async recordClientPayment(
    organizationId: string,
    data: RecordClientPaymentInput
  ) {
    // Verify revenue share belongs to organization
    const revenueShare = await prisma.revenueShare.findFirst({
      where: {
        id: data.revenueShareId,
        engagement: { organizationId },
      },
    });

    if (!revenueShare) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Revenue share record not found',
      });
    }

    const updated = await prisma.revenueShare.update({
      where: { id: data.revenueShareId },
      data: {
        clientPaidAt: data.paymentDate,
        clientPaymentMethod: data.paymentMethod,
        clientPaymentReference: data.paymentReference,
        status: 'client_paid',
        notes: data.notes,
      },
    });

    return updated;
  }

  /**
   * Get revenue report
   */
  static async getRevenueReport(
    organizationId: string,
    filters: GetRevenueReportInput
  ) {
    const where: any = {
      engagement: { organizationId },
      periodStartDate: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    };

    if (filters.advisorIds && filters.advisorIds.length > 0) {
      where.advisorId = { in: filters.advisorIds };
    }

    if (filters.clientIds && filters.clientIds.length > 0) {
      where.clientId = { in: filters.clientIds };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Get revenue shares
    const revenueShares = await prisma.revenueShare.findMany({
      where,
      include: {
        advisor: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: { periodStartDate: 'asc' },
    });

    // Aggregate totals
    const totals = await prisma.revenueShare.aggregate({
      where,
      _sum: {
        grossRevenue: true,
        platformFee: true,
        advisorPayout: true,
      },
      _count: true,
    });

    // Group by time period
    let groupedData: any = {};
    if (filters.includeBreakdown) {
      groupedData = this.groupByPeriod(revenueShares, filters.groupBy);
    }

    return {
      totals: {
        grossRevenue: totals._sum.grossRevenue || 0,
        platformFee: totals._sum.platformFee || 0,
        advisorPayout: totals._sum.advisorPayout || 0,
        count: totals._count,
      },
      breakdown: filters.includeBreakdown ? groupedData : undefined,
      details: revenueShares,
    };
  }

  /**
   * Get advisor earnings
   */
  static async getAdvisorEarnings(
    organizationId: string,
    filters: GetAdvisorEarningsInput
  ) {
    const where: any = {
      advisorId: filters.advisorId,
      engagement: { organizationId },
    };

    if (filters.startDate || filters.endDate) {
      where.periodStartDate = {};
      if (filters.startDate) where.periodStartDate.gte = filters.startDate;
      if (filters.endDate) where.periodStartDate.lte = filters.endDate;
    }

    if (filters.status !== 'all') {
      where.status = filters.status === 'paid' ? 'completed' : 'pending';
    }

    const earnings = await prisma.revenueShare.findMany({
      where,
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
            status: true,
          },
        },
      },
      orderBy: { periodEndDate: 'desc' },
    });

    // Aggregate totals
    const totals = await prisma.revenueShare.aggregate({
      where,
      _sum: {
        grossRevenue: true,
        advisorPayout: true,
      },
      _count: true,
    });

    return {
      earnings,
      totalEarnings: totals._sum.advisorPayout || 0,
      totalRevenue: totals._sum.grossRevenue || 0,
      count: totals._count,
    };
  }

  /**
   * Get organization revenue
   */
  static async getOrganizationRevenue(
    organizationId: string,
    filters: GetOrganizationRevenueInput
  ) {
    const where: any = {
      engagement: { organizationId },
      periodStartDate: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    };

    // Get revenue data
    const revenueShares = await prisma.revenueShare.findMany({
      where,
      include: {
        advisor: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    // Calculate totals
    const totals = {
      grossRevenue: 0,
      platformFees: 0,
      advisorPayouts: 0,
      count: revenueShares.length,
    };

    revenueShares.forEach(rs => {
      totals.grossRevenue += Number(rs.grossRevenue);
      totals.platformFees += Number(rs.platformFee);
      totals.advisorPayouts += Number(rs.advisorPayout);
    });

    // Group by advisor if requested
    let advisorBreakdown: any[] = [];
    if (filters.includeAdvisorBreakdown) {
      const grouped = revenueShares.reduce((acc: any, rs) => {
        const advisorId = rs.advisorId;
        if (!acc[advisorId]) {
          acc[advisorId] = {
            advisorId,
            advisorName: rs.advisor?.name,
            grossRevenue: 0,
            platformFees: 0,
            advisorPayouts: 0,
            count: 0,
          };
        }
        acc[advisorId].grossRevenue += Number(rs.grossRevenue);
        acc[advisorId].platformFees += Number(rs.platformFee);
        acc[advisorId].advisorPayouts += Number(rs.advisorPayout);
        acc[advisorId].count++;
        return acc;
      }, {});
      advisorBreakdown = Object.values(grouped);
    }

    // Group by client if requested
    let clientBreakdown: any[] = [];
    if (filters.includeClientBreakdown) {
      const grouped = revenueShares.reduce((acc: any, rs) => {
        const clientId = rs.clientId;
        if (!acc[clientId]) {
          acc[clientId] = {
            clientId,
            clientName: rs.client?.businessName,
            grossRevenue: 0,
            platformFees: 0,
            count: 0,
          };
        }
        acc[clientId].grossRevenue += Number(rs.grossRevenue);
        acc[clientId].platformFees += Number(rs.platformFee);
        acc[clientId].count++;
        return acc;
      }, {});
      clientBreakdown = Object.values(grouped);
    }

    return {
      totals,
      advisorBreakdown: filters.includeAdvisorBreakdown ? advisorBreakdown : undefined,
      clientBreakdown: filters.includeClientBreakdown ? clientBreakdown : undefined,
    };
  }

  /**
   * Generate 1099 data for advisor
   */
  static async generate1099Data(
    organizationId: string,
    advisorId: string,
    taxYear: number
  ) {
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31);

    const revenueShares = await prisma.revenueShare.findMany({
      where: {
        advisorId,
        engagement: { organizationId },
        taxYear,
        tax1099Reportable: true,
        periodStartDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        advisor: true,
      },
    });

    // Aggregate total payments
    const totalPayments = revenueShares.reduce(
      (sum, rs) => sum + Number(rs.advisorPayout),
      0
    );

    // Only generate if above IRS threshold ($600)
    if (totalPayments < 600) {
      return {
        reportable: false,
        totalPayments,
        threshold: 600,
      };
    }

    return {
      reportable: true,
      taxYear,
      advisorId,
      advisorName: revenueShares[0]?.advisor?.name,
      advisorEmail: revenueShares[0]?.advisor?.email,
      totalPayments,
      numberOfPayments: revenueShares.length,
      payments: revenueShares,
    };
  }

  // Helper methods

  private static groupByPeriod(data: any[], groupBy: string) {
    const grouped: any = {};

    data.forEach(item => {
      let key: string;
      const date = new Date(item.periodStartDate);

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          // Get week number
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          grossRevenue: 0,
          platformFee: 0,
          advisorPayout: 0,
          count: 0,
        };
      }

      grouped[key].grossRevenue += Number(item.grossRevenue);
      grouped[key].platformFee += Number(item.platformFee);
      grouped[key].advisorPayout += Number(item.advisorPayout);
      grouped[key].count++;
    });

    return Object.values(grouped);
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}