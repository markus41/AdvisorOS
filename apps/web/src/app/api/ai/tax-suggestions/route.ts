import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { taxAssistantService } from '@/lib/ai/tax-assistant';
import { prisma as db } from "@/server/db"
import { z } from 'zod';

const taxOptimizationSchema = z.object({
  taxData: z.object({
    taxYear: z.number(),
    entity: z.object({
      entityType: z.enum(['individual', 'sole_proprietorship', 'partnership', 'llc', 's_corp', 'c_corp', 'non_profit']),
      filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow']).optional(),
      state: z.string(),
      employeeCount: z.number().optional(),
      annualRevenue: z.number().optional(),
      industryCode: z.string().optional(),
      businessStartDate: z.string().transform((str) => new Date(str)).optional(),
      fiscalYearEnd: z.string().transform((str) => new Date(str)).optional(),
    }),
    income: z.object({
      w2Income: z.number().optional(),
      businessIncome: z.number().optional(),
      investmentIncome: z.number().optional(),
      rentalIncome: z.number().optional(),
      otherIncome: z.number().optional(),
      totalIncome: z.number(),
    }),
    deductions: z.object({
      standardDeduction: z.number().optional(),
      itemizedDeductions: z.record(z.number()).optional(),
      businessDeductions: z.record(z.number()).optional(),
      totalDeductions: z.number(),
    }),
    credits: z.object({
      availableCredits: z.record(z.number()),
      totalCredits: z.number(),
    }),
    payments: z.object({
      withheld: z.number().optional(),
      estimated: z.number().optional(),
      totalPayments: z.number(),
    }),
    transactions: z.array(z.object({
      date: z.string().transform((str) => new Date(str)),
      description: z.string(),
      amount: z.number(),
      category: z.string(),
      deductible: z.boolean().optional(),
    })),
  }),
  clientId: z.string().optional(),
});

const estimatedTaxSchema = z.object({
  annualTaxLiability: z.number(),
  priorYearTax: z.number(),
  quartersPaid: z.number().default(0),
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
    if (!taxAssistantService.isReady()) {
      return NextResponse.json(
        { error: 'AI tax assistant is not available' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'optimize';

    const body = await request.json();

    let result;

    switch (action) {
      case 'optimize':
        // Validate request for tax optimization
        const optimizationData = taxOptimizationSchema.parse(body);

        // Generate optimization strategies
        const optimizations = await taxAssistantService.optimizeTaxStrategy(
          optimizationData.taxData,
          session.user.organizationId
        );

        result = { optimizations };
        break;

      case 'find-deductions':
        // Validate request for deduction finding
        const deductionData = taxOptimizationSchema.parse(body);

        // Find deduction opportunities
        const deductions = await taxAssistantService.findDeductions(
          deductionData.taxData,
          session.user.organizationId
        );

        result = { deductions };
        break;

      case 'check-compliance':
        // Validate request for compliance check
        const complianceData = taxOptimizationSchema.parse(body);

        // Check compliance
        const complianceChecks = await taxAssistantService.checkCompliance(
          complianceData.taxData,
          session.user.organizationId
        );

        result = { complianceChecks };
        break;

      case 'calculate-tax':
        // Validate request for tax calculation
        const taxCalcData = taxOptimizationSchema.parse(body);

        // Calculate estimated tax
        const estimatedTax = await taxAssistantService.calculateEstimatedTax(
          taxCalcData.taxData,
          session.user.organizationId
        );

        result = { estimatedTax };
        break;

      case 'quarterly-payments':
        // Validate request for quarterly payment calculation
        const quarterlyData = estimatedTaxSchema.parse(body);

        // Calculate quarterly payments
        const quarterlyPayments = taxAssistantService.calculateQuarterlyPayments(
          quarterlyData.annualTaxLiability,
          quarterlyData.priorYearTax,
          quarterlyData.quartersPaid
        );

        result = { quarterlyPayments };
        break;

      case 'generate-report':
        // Validate request for comprehensive tax report
        const reportData = taxOptimizationSchema.parse(body);

        // Generate comprehensive tax report
        const taxReport = await taxAssistantService.generateTaxReport(
          reportData.taxData,
          session.user.organizationId
        );

        // Store report in database
        try {
          await db.taxReport.create({
            data: {
              id: taxReport.id,
              organizationId: session.user.organizationId,
              clientId: reportData.clientId || null,
              taxYear: taxReport.taxYear,
              entityType: taxReport.entityInfo.entityType,
              optimizations: taxReport.optimizations,
              deductionOpportunities: taxReport.deductionOpportunities,
              complianceChecks: taxReport.complianceChecks,
              estimatedTaxLiability: taxReport.estimatedTaxLiability,
              potentialSavings: taxReport.potentialSavings,
              recommendations: taxReport.recommendations,
              alerts: taxReport.alerts,
              confidence: taxReport.confidence,
              generatedBy: session.user.id,
              createdAt: new Date(),
            },
          });
        } catch (dbError) {
          console.error('Failed to store tax report:', dbError);
        }

        result = taxReport;
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
    console.error('Tax assistant error:', error);

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
      { error: 'Tax assistant request failed. Please try again.' },
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
    const action = searchParams.get('action');
    const clientId = searchParams.get('clientId');
    const taxYear = searchParams.get('taxYear');
    const entityType = searchParams.get('entityType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (action) {
      case 'reports':
        // Get tax reports
        const reports = await db.taxReport.findMany({
          where: {
            organizationId: session.user.organizationId,
            ...(clientId ? { clientId } : {}),
            ...(taxYear ? { taxYear: parseInt(taxYear) } : {}),
            ...(entityType ? { entityType } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            taxYear: true,
            entityType: true,
            potentialSavings: true,
            confidence: true,
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

        const totalReports = await db.taxReport.count({
          where: {
            organizationId: session.user.organizationId,
            ...(clientId ? { clientId } : {}),
            ...(taxYear ? { taxYear: parseInt(taxYear) } : {}),
            ...(entityType ? { entityType } : {}),
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            reports,
            pagination: {
              total: totalReports,
              limit,
              offset,
              hasMore: offset + limit < totalReports,
            },
          },
        });

      case 'deadlines':
        // Get upcoming tax deadlines
        const deadlines = taxAssistantService.getUpcomingDeadlines(
          entityType || 'individual'
        );

        return NextResponse.json({
          success: true,
          data: { deadlines },
        });

      case 'alerts':
        // Get tax alerts for entity type
        if (!entityType) {
          return NextResponse.json(
            { error: 'Entity type is required for alerts' },
            { status: 400 }
          );
        }

        const alerts = await taxAssistantService.getTaxAlerts({
          entityType: entityType as any,
          state: 'CA', // Would come from client/organization data
        } as any);

        return NextResponse.json({
          success: true,
          data: { alerts },
        });

      case 'law-changes':
        // Monitor tax law changes
        const entityTypes = entityType ? [entityType] : ['individual', 'c_corp', 's_corp'];
        const lawChanges = await taxAssistantService.monitorTaxLawChanges(
          entityTypes,
          session.user.organizationId
        );

        return NextResponse.json({
          success: true,
          data: { lawChanges },
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error fetching tax data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax data' },
      { status: 500 }
    );
  }
}