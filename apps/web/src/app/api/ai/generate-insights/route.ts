import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { financialInsightsService } from '@/lib/ai/financial-insights';
import { db } from '@cpa-platform/database';
import { z } from 'zod';

const generateInsightsSchema = z.object({
  clientId: z.string().optional(),
  period: z.object({
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    type: z.enum(['monthly', 'quarterly', 'annual']),
  }),
  financialData: z.object({
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
  }),
  priorPeriodData: z.object({
    period: z.object({
      startDate: z.string().transform((str) => new Date(str)),
      endDate: z.string().transform((str) => new Date(str)),
      type: z.enum(['monthly', 'quarterly', 'annual']),
    }),
    revenue: z.object({
      total: z.number(),
      breakdown: z.record(z.number()),
    }),
    expenses: z.object({
      total: z.number(),
      breakdown: z.record(z.number()),
    }),
    profitLoss: z.object({
      netIncome: z.number(),
      margins: z.object({
        gross: z.number(),
        operating: z.number(),
        net: z.number(),
      }),
    }),
    ratios: z.object({
      liquidity: z.object({
        current: z.number(),
      }),
      profitability: z.object({
        roe: z.number(),
        roa: z.number(),
      }),
      leverage: z.object({
        debtToEquity: z.number(),
      }),
    }),
  }).optional(),
  benchmarkData: z.object({
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
  }).optional(),
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
    if (!financialInsightsService.isReady()) {
      return NextResponse.json(
        { error: 'AI financial insights are not available' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = generateInsightsSchema.parse(body);

    // Generate financial insights report
    const report = await financialInsightsService.generateInsightReport(
      validatedData.financialData,
      validatedData.priorPeriodData,
      validatedData.benchmarkData,
      session.user.organizationId,
      validatedData.clientId
    );

    // Store report in database
    try {
      await db.financialInsightReport.create({
        data: {
          id: report.id,
          organizationId: session.user.organizationId,
          clientId: validatedData.clientId || null,
          periodStart: validatedData.period.startDate,
          periodEnd: validatedData.period.endDate,
          periodType: validatedData.period.type,
          narrative: report.narrative,
          trends: report.trends,
          risks: report.risks,
          benchmarkComparison: report.benchmarkComparison,
          keyMetrics: report.keyMetrics,
          actionItems: report.actionItems,
          confidence: report.confidence,
          aiCost: report.costInfo.aiCost,
          processingTime: report.costInfo.processingTime,
          generatedBy: session.user.id,
          createdAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error('Failed to store insight report:', dbError);
      // Continue without failing the request
    }

    return NextResponse.json({
      success: true,
      data: report,
    });

  } catch (error: any) {
    console.error('Financial insights generation error:', error);

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
      { error: 'Financial insights generation failed. Please try again.' },
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
    const clientId = searchParams.get('clientId');
    const reportId = searchParams.get('reportId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (reportId) {
      // Get specific report
      const report = await db.financialInsightReport.findFirst({
        where: {
          id: reportId,
          organizationId: session.user.organizationId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
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
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: report,
      });
    }

    // Get reports list
    const reports = await db.financialInsightReport.findMany({
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
        periodType: true,
        confidence: true,
        aiCost: true,
        processingTime: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
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

    const total = await db.financialInsightReport.count({
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
    console.error('Error fetching financial insight reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial insight reports' },
      { status: 500 }
    );
  }
}