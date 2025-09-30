import { PrismaClient, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type {
  CreateAdvisorProfileInput,
  UpdateAdvisorProfileInput,
  ListAdvisorsInput,
  UploadProfileVideoInput,
  SubmitForVerificationInput,
  GetAdvisorStatsInput,
} from '../../lib/validations/advisor';

const prisma = new PrismaClient();

export class AdvisorProfileService {
  /**
   * Create a new advisor profile
   * SECURITY: Must verify user belongs to organization before creating
   */
  static async createProfile(
    userId: string,
    organizationId: string,
    data: CreateAdvisorProfileInput
  ) {
    // Verify user exists and belongs to organization
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found or does not belong to this organization',
      });
    }

    // Check if profile already exists
    const existingProfile = await prisma.advisorProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Advisor profile already exists for this user',
      });
    }

    // Create profile with marketplace pending status
    const profile = await prisma.advisorProfile.create({
      data: {
        userId,
        ...data,
        marketplaceStatus: 'pending',
        isVerified: false,
        isAvailable: false, // Unavailable until verified
        currentClients: 0,
        completedEngagements: 0,
        overallRating: 0,
        totalReviews: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            organizationId: true,
          },
        },
      },
    });

    // Update user flags
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdvisor: true,
        advisorType: data.industries[0] || 'general',
      },
    });

    return profile;
  }

  /**
   * Get advisor profile by ID
   * PUBLIC endpoint - returns public-facing data only
   */
  static async getProfile(profileId: string, includePrivate = false) {
    const profile = await prisma.advisorProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: includePrivate,
            role: true,
            organizationId: includePrivate,
          },
        },
        serviceOfferings: includePrivate,
        satisfactionRatings: includePrivate ? {
          take: 50,
          orderBy: { createdAt: 'desc' },
        } : false,
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Advisor profile not found',
      });
    }

    // Filter sensitive data for public view
    if (!includePrivate) {
      return {
        ...profile,
        stripeAccountId: undefined,
        backgroundCheckStatus: undefined,
        backgroundCheckDate: undefined,
        notes: undefined,
      };
    }

    return profile;
  }

  /**
   * Get profile by user ID
   */
  static async getProfileByUserId(userId: string, organizationId: string) {
    const profile = await prisma.advisorProfile.findFirst({
      where: {
        userId,
        user: { organizationId }, // Multi-tenant security
      },
      include: {
        user: true,
        serviceOfferings: true,
      },
    });

    return profile;
  }

  /**
   * Update advisor profile
   * SECURITY: Must verify ownership before updating
   */
  static async updateProfile(
    userId: string,
    organizationId: string,
    data: UpdateAdvisorProfileInput
  ) {
    const { id, ...updateData } = data;

    // Verify ownership
    const profile = await prisma.advisorProfile.findFirst({
      where: {
        id,
        userId,
        user: { organizationId }, // Multi-tenant security
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Advisor profile not found or access denied',
      });
    }

    // Update profile
    const updated = await prisma.advisorProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    return updated;
  }

  /**
   * Set advisor availability
   */
  static async setAvailability(
    userId: string,
    organizationId: string,
    isAvailable: boolean,
    note?: string
  ) {
    const profile = await prisma.advisorProfile.findFirst({
      where: {
        userId,
        user: { organizationId },
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Advisor profile not found',
      });
    }

    // Can't set available if not verified
    if (isAvailable && !profile.isVerified) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Profile must be verified before setting availability',
      });
    }

    // Can't accept new clients if at capacity
    if (isAvailable && profile.currentClients >= profile.maxClients) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot accept new clients - at maximum capacity',
      });
    }

    const updated = await prisma.advisorProfile.update({
      where: { id: profile.id },
      data: {
        isAvailable,
        availabilityNote: note,
        lastAvailabilityChange: new Date(),
      },
    });

    return updated;
  }

  /**
   * List available advisors (marketplace browse)
   * PUBLIC endpoint with filtering and sorting
   */
  static async listAvailableAdvisors(filters: ListAdvisorsInput) {
    const {
      industries,
      services,
      businessSizes,
      certifications,
      minRating,
      maxHourlyRate,
      maxMonthlyRetainer,
      yearsExperienceMin,
      isAvailable,
      languages,
      remoteOnly,
      searchQuery,
      sortBy,
      limit,
      cursor,
    } = filters;

    // Build where clause
    const where: Prisma.AdvisorProfileWhereInput = {
      marketplaceStatus: 'active',
      isVerified: true,
      deletedAt: null,
    };

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (industries && industries.length > 0) {
      where.industries = { hasSome: industries };
    }

    if (services && services.length > 0) {
      where.services = { hasSome: services };
    }

    if (businessSizes && businessSizes.length > 0) {
      where.businessSizes = { hasSome: businessSizes };
    }

    if (certifications && certifications.length > 0) {
      where.certifications = { hasSome: certifications };
    }

    if (minRating) {
      where.overallRating = { gte: minRating };
    }

    if (maxHourlyRate) {
      where.hourlyRate = { lte: maxHourlyRate };
    }

    if (maxMonthlyRetainer) {
      where.monthlyRetainerMax = { lte: maxMonthlyRetainer };
    }

    if (yearsExperienceMin) {
      where.yearsExperience = { gte: yearsExperienceMin };
    }

    if (languages && languages.length > 0) {
      where.languages = { hasSome: languages };
    }

    if (remoteOnly !== undefined) {
      where.remoteOnly = remoteOnly;
    }

    // Text search across multiple fields
    if (searchQuery) {
      where.OR = [
        { professionalTitle: { contains: searchQuery, mode: 'insensitive' } },
        { shortBio: { contains: searchQuery, mode: 'insensitive' } },
        { longBio: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Sorting
    const orderBy: Prisma.AdvisorProfileOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'rating':
        orderBy.overallRating = 'desc';
        break;
      case 'experience':
        orderBy.yearsExperience = 'desc';
        break;
      case 'price_low':
        orderBy.hourlyRate = 'asc';
        break;
      case 'price_high':
        orderBy.hourlyRate = 'desc';
        break;
      case 'reviews':
        orderBy.totalReviews = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      default:
        orderBy.overallRating = 'desc';
    }

    // Cursor-based pagination
    const cursorOptions = cursor ? { cursor: { id: cursor }, skip: 1 } : {};

    const advisors = await prisma.advisorProfile.findMany({
      where,
      orderBy,
      take: limit + 1, // Fetch one extra to determine if there are more
      ...cursorOptions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Determine if there are more results
    const hasMore = advisors.length > limit;
    const results = hasMore ? advisors.slice(0, limit) : advisors;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    // Filter sensitive data
    const publicResults = results.map(advisor => ({
      ...advisor,
      user: {
        id: advisor.user.id,
        name: advisor.user.name,
      },
      stripeAccountId: undefined,
      backgroundCheckStatus: undefined,
      notes: undefined,
    }));

    return {
      advisors: publicResults,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Upload profile video
   */
  static async uploadVideo(
    userId: string,
    organizationId: string,
    data: UploadProfileVideoInput
  ) {
    const profile = await prisma.advisorProfile.findFirst({
      where: {
        userId,
        user: { organizationId },
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Advisor profile not found',
      });
    }

    const updated = await prisma.advisorProfile.update({
      where: { id: profile.id },
      data: {
        videoIntroUrl: data.videoUrl,
        videoThumbnailUrl: data.thumbnailUrl,
        videoDurationSeconds: data.videoDurationSeconds,
      },
    });

    return updated;
  }

  /**
   * Submit profile for verification
   */
  static async submitForVerification(
    userId: string,
    organizationId: string,
    data: SubmitForVerificationInput
  ) {
    const profile = await prisma.advisorProfile.findFirst({
      where: {
        userId,
        user: { organizationId },
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Advisor profile not found',
      });
    }

    if (profile.marketplaceStatus === 'active' && profile.isVerified) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Profile is already verified',
      });
    }

    // TODO: Store verification documents (Azure Blob Storage)
    // TODO: Initiate background check process
    // TODO: Send notification to admin for manual review

    const updated = await prisma.advisorProfile.update({
      where: { id: profile.id },
      data: {
        marketplaceStatus: 'under_review',
        verificationSubmittedAt: new Date(),
        verificationDocuments: JSON.stringify(data),
      },
    });

    return updated;
  }

  /**
   * Get advisor statistics
   */
  static async getStats(userId: string, organizationId: string, filters: GetAdvisorStatsInput) {
    const advisorId = filters.advisorId || userId;

    const profile = await prisma.advisorProfile.findFirst({
      where: {
        userId: advisorId,
        user: { organizationId },
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Advisor profile not found',
      });
    }

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (filters.startDate) dateFilter.gte = filters.startDate;
    if (filters.endDate) dateFilter.lte = filters.endDate;

    // Get engagement stats
    const engagements = await prisma.engagement.count({
      where: {
        advisorUserId: profile.userId,
        ...(filters.startDate || filters.endDate ? { startDate: dateFilter } : {}),
      },
    });

    // Get revenue stats
    const revenueShares = await prisma.revenueShare.aggregate({
      where: {
        advisorId: profile.userId,
        ...(filters.startDate || filters.endDate ? { periodStartDate: dateFilter } : {}),
      },
      _sum: {
        grossRevenue: true,
        advisorPayout: true,
        platformFee: true,
      },
      _count: true,
    });

    // Get satisfaction ratings
    const ratings = await prisma.clientSatisfactionMetric.aggregate({
      where: {
        advisorUserId: profile.userId,
        ...(filters.startDate || filters.endDate ? { createdAt: dateFilter } : {}),
      },
      _avg: {
        overallSatisfaction: true,
        communicationRating: true,
        responsivenessRating: true,
        recommendationLikelihood: true,
      },
      _count: true,
    });

    return {
      profile: {
        id: profile.id,
        overallRating: profile.overallRating,
        totalReviews: profile.totalReviews,
        completedEngagements: profile.completedEngagements,
        currentClients: profile.currentClients,
        maxClients: profile.maxClients,
      },
      periodStats: {
        totalEngagements: engagements,
        totalRevenue: revenueShares._sum.grossRevenue || 0,
        advisorEarnings: revenueShares._sum.advisorPayout || 0,
        platformFees: revenueShares._sum.platformFee || 0,
        averageRating: ratings._avg.overallSatisfaction || 0,
        totalRatings: ratings._count,
      },
    };
  }

  /**
   * Admin: Approve advisor verification
   */
  static async approveVerification(profileId: string, adminUserId: string, organizationId: string) {
    // Verify admin has permission
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
        message: 'Only admins can approve verifications',
      });
    }

    const profile = await prisma.advisorProfile.update({
      where: { id: profileId },
      data: {
        isVerified: true,
        marketplaceStatus: 'active',
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
      },
    });

    // TODO: Send notification email to advisor
    // TODO: Create onboarding checklist/tasks

    return profile;
  }

  /**
   * Admin: Reject advisor verification
   */
  static async rejectVerification(
    profileId: string,
    adminUserId: string,
    organizationId: string,
    reason: string
  ) {
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
        message: 'Only admins can reject verifications',
      });
    }

    const profile = await prisma.advisorProfile.update({
      where: { id: profileId },
      data: {
        marketplaceStatus: 'rejected',
        notes: reason,
      },
    });

    // TODO: Send notification email with rejection reason

    return profile;
  }
}