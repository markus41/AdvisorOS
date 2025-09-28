import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { advisoryCopilotService } from '@/lib/ai/advisory-copilot';
import { db } from "../../../../server/db";
import { z } from 'zod';

const businessProfileSchema = z.object({
  companyName: z.string(),
  industry: z.string(),
  industryCode: z.string(),
  businessModel: z.string(),
  foundedDate: z.string().transform((str) => new Date(str)),
  employeeCount: z.number(),
  annualRevenue: z.number(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
  }),
  keyProducts: z.array(z.string()),
  targetMarkets: z.array(z.string()),
  competitivePosition: z.enum(['market_leader', 'challenger', 'follower', 'niche']),
  growthStage: z.enum(['startup', 'growth', 'mature', 'decline']),
});

const financialDataSchema = z.object({
  period: z.object({
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    type: z.enum(['monthly', 'quarterly', 'annual']),
  }),
  revenue: z.object({
    total: z.number(),
    breakdown: z.record(z.number()),
    growthRate: z.number().optional(),
  }),
  expenses: z.object({
    total: z.number(),
    breakdown: z.record(z.number()),
    growthRate: z.number().optional(),
  }),
  profitLoss: z.object({
    grossProfit: z.number(),
    operatingIncome: z.number(),
    netIncome: z.number(),
    margins: z.object({
      gross: z.number(),
      operating: z.number(),
      net: z.number(),
    }),
  }),
  balanceSheet: z.object({
    assets: z.object({
      current: z.number(),
      fixed: z.number(),
      total: z.number(),
    }),
    liabilities: z.object({
      current: z.number(),
      longTerm: z.number(),
      total: z.number(),
    }),
    equity: z.number(),
  }),
  cashFlow: z.object({
    operating: z.number(),
    investing: z.number(),
    financing: z.number(),
    netChange: z.number(),
    endingBalance: z.number(),
  }),
  ratios: z.object({
    liquidity: z.object({
      current: z.number(),
      quick: z.number(),
      cash: z.number(),
    }),
    efficiency: z.object({
      assetTurnover: z.number(),
      inventoryTurnover: z.number(),
      receivablesTurnover: z.number(),
    }),
    profitability: z.object({
      roe: z.number(),
      roa: z.number(),
      roic: z.number(),
    }),
    leverage: z.object({
      debtToEquity: z.number(),
      debtToAssets: z.number(),
      interestCoverage: z.number(),
    }),
  }),
});

const benchmarkDataSchema = z.object({
  industry: z.string(),
  industryCode: z.string(),
  companySize: z.enum(['small', 'medium', 'large']),
  geography: z.string(),
  ratios: z.object({
    liquidity: z.record(z.number()),
    efficiency: z.record(z.number()),
    profitability: z.record(z.number()),
    leverage: z.record(z.number()),
  }),
  margins: z.object({
    gross: z.number(),
    operating: z.number(),
    net: z.number(),
  }),
  growthRates: z.object({
    revenue: z.number(),
    expenses: z.number(),
    assets: z.number(),
  }),
}).optional();

const generateAdvisoryReportSchema = z.object({
  businessProfile: businessProfileSchema,
  financialData: financialDataSchema,
  benchmarkData: benchmarkDataSchema,
  clientId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if AI features are enabled
    if (!advisoryCopilotService.isReady()) {
      return NextResponse.json(
        { error: 'AI advisory copilot is not available' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'generate-report';

    const body = await request.json();

    let result;

    switch (action) {
      case 'generate-report':
        // Validate request for comprehensive advisory report
        const reportData = generateAdvisoryReportSchema.parse(body);

        // Generate comprehensive advisory report
        const advisoryReport = await advisoryCopilotService.generateAdvisoryReport(
          reportData.businessProfile,
          reportData.financialData,
          reportData.benchmarkData,
          session.user.organizationId,
          reportData.clientId
        );

        // Store report in database
        try {
          await db.advisoryReport.create({
            data: {
              id: advisoryReport.id,
              organizationId: session.user.organizationId,
              clientId: reportData.clientId || null,
              periodStart: reportData.financialData.period.startDate,
              periodEnd: reportData.financialData.period.endDate,
              businessHealthScore: advisoryReport.businessHealth.overallScore,
              executiveSummary: advisoryReport.executiveSummary,
              keyInsights: advisoryReport.keyInsights,
              businessHealth: advisoryReport.businessHealth,
              growthRecommendations: advisoryReport.growthRecommendations,
              cashFlowOptimization: advisoryReport.cashFlowOptimization,
              competitiveAnalysis: advisoryReport.competitiveAnalysis,
              strategicPlan: advisoryReport.strategicPlan,
              actionPlan: advisoryReport.actionPlan,
              confidence: advisoryReport.confidence,
              nextReviewDate: advisoryReport.nextReviewDate,
              generatedBy: session.user.id,
              createdAt: new Date(),
            },
          });
        } catch (dbError) {
          console.error('Failed to store advisory report:', dbError);
        }

        result = advisoryReport;
        break;

      case 'analyze-health':
        // Validate request for business health analysis
        const healthData = generateAdvisoryReportSchema.parse(body);

        // Analyze business health
        const businessHealth = await advisoryCopilotService.analyzeBusinessHealth(
          healthData.businessProfile,
          healthData.financialData,
          healthData.benchmarkData,
          session.user.organizationId
        );

        result = { businessHealth };
        break;

      case 'growth-recommendations':
        // Validate request for growth recommendations
        const growthData = generateAdvisoryReportSchema.parse(body);

        // First analyze business health (required for growth recommendations)
        const health = await advisoryCopilotService.analyzeBusinessHealth(
          growthData.businessProfile,
          growthData.financialData,
          growthData.benchmarkData,
          session.user.organizationId
        );

        // Generate growth recommendations
        const growthRecommendations = await advisoryCopilotService.generateGrowthRecommendations(
          growthData.businessProfile,
          growthData.financialData,
          health,
          session.user.organizationId
        );

        result = { growthRecommendations };
        break;

      case 'cash-flow-optimization':
        // Validate request for cash flow optimization
        const cashFlowData = generateAdvisoryReportSchema.parse(body);

        // Optimize cash flow
        const cashFlowOptimization = await advisoryCopilotService.optimizeCashFlow(
          cashFlowData.financialData,
          cashFlowData.businessProfile,
          session.user.organizationId
        );

        result = { cashFlowOptimization };
        break;

      case 'competitive-analysis':
        // Validate request for competitive analysis
        const competitiveData = generateAdvisoryReportSchema.parse(body);

        // Analyze competition
        const competitiveAnalysis = await advisoryCopilotService.analyzeCompetition(
          competitiveData.businessProfile,
          session.user.organizationId
        );

        result = { competitiveAnalysis };
        break;

      case 'strategic-plan':
        // Validate request for strategic planning
        const strategicData = generateAdvisoryReportSchema.parse(body);

        // First get business health and growth recommendations
        const strategicHealth = await advisoryCopilotService.analyzeBusinessHealth(
          strategicData.businessProfile,
          strategicData.financialData,
          strategicData.benchmarkData,
          session.user.organizationId
        );

        const strategicGrowthRecs = await advisoryCopilotService.generateGrowthRecommendations(
          strategicData.businessProfile,
          strategicData.financialData,
          strategicHealth,
          session.user.organizationId
        );

        // Create strategic plan
        const strategicPlan = await advisoryCopilotService.createStrategicPlan(
          strategicData.businessProfile,
          strategicHealth,
          strategicGrowthRecs,
          session.user.organizationId
        );

        result = { strategicPlan };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Advisory copilot error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: 'AI service is currently busy. Please try again later.' },
        { status: 429 }
      );
    }

    if (error.message.includes('Cost limit exceeded')) {
      return NextResponse.json(
        { error: 'Monthly AI usage limit reached for your organization.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'Advisory copilot request failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (reportId) {
      // Get specific advisory report
      const report = await db.advisoryReport.findFirst({
        where: {
          id: reportId,
          organizationId: session.user.organizationId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              industry: true,
            },
          },
          generator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!report) {
        return NextResponse.json(
          { error: 'Advisory report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: report,
      });
    }

    // Get advisory reports list
    const reports = await db.advisoryReport.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        businessHealthScore: true,
        confidence: true,
        nextReviewDate: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        generator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const total = await db.advisoryReport.count({
      where: {
        organizationId: session.user.organizationId,
        ...(clientId ? { clientId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching advisory reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advisory reports' },
      { status: 500 }
    );
  }
}