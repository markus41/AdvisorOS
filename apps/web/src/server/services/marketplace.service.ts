import { PrismaClient, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type {
  ClientNeedsAssessmentInput,
  RequestMatchingInput,
  CreateManualMatchInput,
  RespondToMatchInput,
  UpdateMatchStatusInput,
  SearchAdvisorsInput,
  GetFeaturedAdvisorsInput,
} from '../../lib/validations/marketplace';

const prisma = new PrismaClient();

export class MarketplaceService {
  /**
   * Create client needs assessment for AI matching
   */
  static async createNeedsAssessment(
    organizationId: string,
    data: ClientNeedsAssessmentInput
  ) {
    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        organizationId,
      },
    });

    if (!client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client not found',
      });
    }

    // Create needs assessment
    const assessment = await prisma.$queryRaw`
      INSERT INTO client_needs_assessments (
        id, client_id, industry, business_size, services_needed,
        urgency, budget, engagement_length, certification_requirements,
        years_experience_min, remote_ok, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${data.clientId}, ${data.industry}, ${data.businessSize},
        ${data.servicesNeeded}, ${data.urgency}, ${JSON.stringify(data.budget)},
        ${data.engagementLength}, ${data.certificationRequirements},
        ${data.yearsExperienceMin || 0}, ${data.remoteOk}, NOW(), NOW()
      ) RETURNING *
    `;

    return assessment;
  }

  /**
   * Request AI-powered advisor matching
   * This is a simplified version - production would use ML models
   */
  static async requestMatching(
    organizationId: string,
    data: RequestMatchingInput
  ) {
    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        organizationId,
      },
    });

    if (!client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client not found',
      });
    }

    // Get client's needs assessment if provided
    let needsData: any = {};
    if (data.needsAssessmentId) {
      // TODO: Fetch needs assessment data
      // needsData = await getNeedsAssessment(data.needsAssessmentId);
    }

    // Calculate matches using scoring algorithm
    const matches = await this.calculateAdvisorMatches(
      client,
      needsData,
      data.numberOfMatches
    );

    // Create match records
    const createdMatches = await Promise.all(
      matches.map(match =>
        prisma.advisorMarketplaceMatch.create({
          data: {
            clientId: client.id,
            advisorProfileId: match.advisorId,
            matchScore: match.score,
            matchReason: match.reasons,
            matchAlgorithmVersion: data.matchAlgorithmVersion,
            status: 'suggested',
            suggestedAt: new Date(),
          },
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
        })
      )
    );

    return createdMatches;
  }

  /**
   * Calculate advisor match scores
   * Simplified scoring - production would use ML embeddings and pgvector
   */
  private static async calculateAdvisorMatches(
    client: any,
    needsData: any,
    limit: number
  ) {
    // Get all available, verified advisors
    const advisors = await prisma.advisorProfile.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        marketplaceStatus: 'active',
        currentClients: { lt: prisma.advisorProfile.fields.maxClients },
      },
      include: {
        user: true,
      },
    });

    // Calculate match scores
    const scored = advisors.map(advisor => {
      let score = 0;
      const reasons: any = {};

      // Industry match (30 points)
      if (needsData.industry && advisor.industries?.includes(needsData.industry)) {
        score += 30;
        reasons.industryMatch = true;
      }

      // Service match (25 points)
      if (needsData.servicesNeeded) {
        const serviceMatches = needsData.servicesNeeded.filter((s: string) =>
          advisor.services?.includes(s)
        );
        const serviceScore = (serviceMatches.length / needsData.servicesNeeded.length) * 25;
        score += serviceScore;
        reasons.serviceMatches = serviceMatches;
      }

      // Experience (15 points)
      if (advisor.yearsExperience) {
        const expScore = Math.min(advisor.yearsExperience / 20, 1) * 15;
        score += expScore;
        reasons.experienceYears = advisor.yearsExperience;
      }

      // Rating (15 points)
      if (advisor.overallRating) {
        const ratingScore = (advisor.overallRating / 5) * 15;
        score += ratingScore;
        reasons.rating = advisor.overallRating;
      }

      // Certifications (10 points)
      if (needsData.certificationRequirements) {
        const certMatches = needsData.certificationRequirements.filter((c: string) =>
          advisor.certifications?.includes(c)
        );
        if (certMatches.length > 0) {
          score += 10;
          reasons.certifications = certMatches;
        }
      }

      // Availability (5 points)
      const availabilityRatio = advisor.currentClients / advisor.maxClients;
      const availabilityScore = (1 - availabilityRatio) * 5;
      score += availabilityScore;
      reasons.availabilityRatio = availabilityRatio;

      return {
        advisorId: advisor.id,
        score: Math.round(score),
        reasons,
      };
    });

    // Sort by score and return top matches
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Create manual match (admin override)
   */
  static async createManualMatch(
    organizationId: string,
    adminUserId: string,
    data: CreateManualMatchInput
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
        message: 'Only admins can create manual matches',
      });
    }

    // Verify client and advisor
    const [client, advisor] = await Promise.all([
      prisma.client.findFirst({
        where: { id: data.clientId, organizationId },
      }),
      prisma.advisorProfile.findUnique({
        where: { id: data.advisorProfileId },
      }),
    ]);

    if (!client || !advisor) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client or advisor not found',
      });
    }

    // Create match
    const match = await prisma.advisorMarketplaceMatch.create({
      data: {
        clientId: data.clientId,
        advisorProfileId: data.advisorProfileId,
        matchScore: data.matchScore || 100,
        matchReason: { manual: true, reason: data.matchReason, notes: data.notes },
        matchAlgorithmVersion: 'manual',
        status: 'suggested',
        suggestedAt: new Date(),
        createdBy: adminUserId,
      },
      include: {
        client: true,
        advisorProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    return match;
  }

  /**
   * Respond to match suggestion (client or advisor)
   */
  static async respondToMatch(
    userId: string,
    organizationId: string,
    data: RespondToMatchInput
  ) {
    const match = await prisma.advisorMarketplaceMatch.findUnique({
      where: { id: data.matchId },
      include: {
        client: true,
        advisorProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!match) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Match not found',
      });
    }

    // Verify user is part of this match
    const isClientUser = match.client.organizationId === organizationId;
    const isAdvisor = match.advisorProfile.userId === userId;

    if (!isClientUser && !isAdvisor) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not authorized to respond to this match',
      });
    }

    // Update match status based on response
    let newStatus = match.status;
    if (data.response === 'accepted') {
      newStatus = isClientUser ? 'client_contacted' : 'advisor_responded';
    } else if (data.response === 'declined') {
      newStatus = 'declined';
    } else if (data.response === 'interested') {
      newStatus = isClientUser ? 'client_viewed' : 'advisor_responded';
    }

    const updated = await prisma.advisorMarketplaceMatch.update({
      where: { id: data.matchId },
      data: {
        status: newStatus,
        ...(isClientUser ? { clientViewedAt: new Date() } : {}),
        ...(isAdvisor ? { advisorRespondedAt: new Date() } : {}),
        responseMessage: data.message,
      },
      include: {
        client: true,
        advisorProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    // TODO: Send notification to other party
    // TODO: If both accepted, create engagement proposal

    return updated;
  }

  /**
   * Update match status (admin or system)
   */
  static async updateMatchStatus(
    organizationId: string,
    data: UpdateMatchStatusInput
  ) {
    const match = await prisma.advisorMarketplaceMatch.findUnique({
      where: { id: data.matchId },
      include: {
        client: true,
      },
    });

    if (!match) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Match not found',
      });
    }

    // Verify organization access
    if (match.client.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });
    }

    const updated = await prisma.advisorMarketplaceMatch.update({
      where: { id: data.matchId },
      data: {
        status: data.status,
        notes: data.notes,
        ...(data.status === 'accepted' ? { acceptedAt: new Date() } : {}),
        ...(data.status === 'declined' ? { declinedAt: new Date() } : {}),
        ...(data.status === 'expired' ? { expiredAt: new Date() } : {}),
      },
    });

    return updated;
  }

  /**
   * Search advisors with full-text search
   */
  static async searchAdvisors(data: SearchAdvisorsInput) {
    const { query, filters, limit, offset } = data;

    // Build where clause
    const where: Prisma.AdvisorProfileWhereInput = {
      isVerified: true,
      marketplaceStatus: 'active',
      deletedAt: null,
    };

    // Apply filters
    if (filters) {
      if (filters.industries) {
        where.industries = { hasSome: filters.industries };
      }
      if (filters.services) {
        where.services = { hasSome: filters.services };
      }
      if (filters.certifications) {
        where.certifications = { hasSome: filters.certifications };
      }
      if (filters.minRating) {
        where.overallRating = { gte: filters.minRating };
      }
      if (filters.maxHourlyRate) {
        where.hourlyRate = { lte: filters.maxHourlyRate };
      }
      if (filters.yearsExperienceMin) {
        where.yearsExperience = { gte: filters.yearsExperienceMin };
      }
    }

    // Text search
    if (query) {
      where.OR = [
        { professionalTitle: { contains: query, mode: 'insensitive' } },
        { shortBio: { contains: query, mode: 'insensitive' } },
        { longBio: { contains: query, mode: 'insensitive' } },
        { tagline: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [advisors, total] = await Promise.all([
      prisma.advisorProfile.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { overallRating: 'desc' },
          { totalReviews: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.advisorProfile.count({ where }),
    ]);

    return {
      advisors,
      total,
      hasMore: offset + advisors.length < total,
    };
  }

  /**
   * Get featured advisors
   */
  static async getFeaturedAdvisors(data: GetFeaturedAdvisorsInput) {
    const { category, industry, limit } = data;

    const where: Prisma.AdvisorProfileWhereInput = {
      isVerified: true,
      isAvailable: true,
      marketplaceStatus: 'active',
      deletedAt: null,
    };

    if (industry) {
      where.industries = { has: industry };
    }

    let orderBy: Prisma.AdvisorProfileOrderByWithRelationInput = {};

    switch (category) {
      case 'top_rated':
        orderBy = { overallRating: 'desc' };
        where.overallRating = { gte: 4.5 };
        where.totalReviews = { gte: 5 };
        break;
      case 'recently_joined':
        orderBy = { createdAt: 'desc' };
        break;
      case 'industry_expert':
        orderBy = { yearsExperience: 'desc' };
        where.yearsExperience = { gte: 10 };
        break;
      case 'trending':
        orderBy = { profileViews: 'desc' };
        break;
      default:
        orderBy = { overallRating: 'desc' };
    }

    const advisors = await prisma.advisorProfile.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return advisors;
  }

  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStats(organizationId: string) {
    const [
      totalAdvisors,
      availableAdvisors,
      totalClients,
      activeMatches,
      completedMatches,
    ] = await Promise.all([
      prisma.advisorProfile.count({
        where: {
          isVerified: true,
          marketplaceStatus: 'active',
        },
      }),
      prisma.advisorProfile.count({
        where: {
          isVerified: true,
          isAvailable: true,
          marketplaceStatus: 'active',
        },
      }),
      prisma.client.count({
        where: { organizationId },
      }),
      prisma.advisorMarketplaceMatch.count({
        where: {
          status: { in: ['suggested', 'client_viewed', 'client_contacted'] },
          client: { organizationId },
        },
      }),
      prisma.advisorMarketplaceMatch.count({
        where: {
          status: 'accepted',
          client: { organizationId },
        },
      }),
    ]);

    return {
      totalAdvisors,
      availableAdvisors,
      totalClients,
      activeMatches,
      completedMatches,
      matchSuccessRate:
        activeMatches > 0
          ? ((completedMatches / (activeMatches + completedMatches)) * 100).toFixed(1)
          : 0,
    };
  }

  /**
   * Compare multiple advisors side-by-side
   */
  static async compareAdvisors(advisorProfileIds: string[]) {
    const advisors = await prisma.advisorProfile.findMany({
      where: {
        id: { in: advisorProfileIds },
        isVerified: true,
        marketplaceStatus: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        serviceOfferings: true,
      },
    });

    if (advisors.length !== advisorProfileIds.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'One or more advisors not found',
      });
    }

    return advisors;
  }
}