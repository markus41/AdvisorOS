import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { openaiClient } from '@/lib/ai/openai-client';
import { db } from "../../../../server/db";

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
    const period = searchParams.get('period') as 'day' | 'month' | 'year' || 'month';
    const service = searchParams.get('service'); // document, insights, communication, tax, advisory
    const clientId = searchParams.get('clientId');

    // Get usage statistics
    const usageStats = await openaiClient.getUsageStats(
      session.user.organizationId,
      period
    );

    // Get detailed usage from database
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Get usage by service
    const documentUsage = await db.documentAnalysis.aggregate({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: startDate },
        ...(clientId ? { clientId } : {}),
      },
      _sum: {
        totalCost: true,
        processingTime: true,
      },
      _count: true,
    });

    const insightsUsage = await db.financialInsightReport.aggregate({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: startDate },
        ...(clientId ? { clientId } : {}),
      },
      _sum: {
        aiCost: true,
        processingTime: true,
      },
      _count: true,
    });

    const taxUsage = await db.taxReport.aggregate({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: startDate },
        ...(clientId ? { clientId } : {}),
      },
      _count: true,
    });

    const advisoryUsage = await db.advisoryReport.aggregate({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: startDate },
        ...(clientId ? { clientId } : {}),
      },
      _count: true,
    });

    const emailDraftsUsage = await db.emailDraft.aggregate({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: startDate },
        ...(clientId ? { clientId } : {}),
      },
      _count: true,
    });

    // Calculate total costs and usage
    const totalCost =
      (documentUsage._sum.totalCost || 0) +
      (insightsUsage._sum.aiCost || 0) +
      (usageStats.totalCost || 0);

    const totalRequests =
      (documentUsage._count || 0) +
      (insightsUsage._count || 0) +
      (taxUsage._count || 0) +
      (advisoryUsage._count || 0) +
      (emailDraftsUsage._count || 0);

    const serviceBreakdown = {
      document_analysis: {
        requests: documentUsage._count || 0,
        cost: documentUsage._sum.totalCost || 0,
        avgProcessingTime: documentUsage._count
          ? (documentUsage._sum.processingTime || 0) / documentUsage._count
          : 0,
      },
      financial_insights: {
        requests: insightsUsage._count || 0,
        cost: insightsUsage._sum.aiCost || 0,
        avgProcessingTime: insightsUsage._count
          ? (insightsUsage._sum.processingTime || 0) / insightsUsage._count
          : 0,
      },
      tax_assistant: {
        requests: taxUsage._count || 0,
        cost: 0.05 * (taxUsage._count || 0), // Estimated cost per request
        avgProcessingTime: 3000, // Estimated processing time
      },
      advisory_copilot: {
        requests: advisoryUsage._count || 0,
        cost: 0.25 * (advisoryUsage._count || 0), // Estimated cost per request
        avgProcessingTime: 15000, // Estimated processing time
      },
      communication_assistant: {
        requests: emailDraftsUsage._count || 0,
        cost: 0.02 * (emailDraftsUsage._count || 0), // Estimated cost per request
        avgProcessingTime: 2000, // Estimated processing time
      },
    };

    // Get organization's AI limits
    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        aiCostLimitMonthly: true,
        aiUsageEnabled: true,
      },
    });

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const monthlyUsage = await getUsageForPeriod(
      session.user.organizationId,
      currentMonthStart,
      new Date()
    );

    // Get daily usage for the last 30 days
    const dailyUsage = await getDailyUsage(
      session.user.organizationId,
      30
    );

    // Filter by service if requested
    let filteredUsage = serviceBreakdown;
    if (service && serviceBreakdown[service as keyof typeof serviceBreakdown]) {
      filteredUsage = {
        [service]: serviceBreakdown[service as keyof typeof serviceBreakdown]
      } as any;
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        summary: {
          totalRequests,
          totalCost,
          totalTokens: usageStats.totalTokens,
          averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
        },
        serviceBreakdown: filteredUsage,
        limits: {
          monthlyLimit: organization?.aiCostLimitMonthly || 1000,
          currentMonthUsage: monthlyUsage.totalCost,
          remainingBudget: (organization?.aiCostLimitMonthly || 1000) - monthlyUsage.totalCost,
          usagePercent: ((monthlyUsage.totalCost / (organization?.aiCostLimitMonthly || 1000)) * 100),
          enabled: organization?.aiUsageEnabled || false,
        },
        trends: {
          dailyUsage: dailyUsage.slice(-30), // Last 30 days
          topModels: usageStats.topModels,
        },
        recommendations: generateUsageRecommendations(serviceBreakdown, monthlyUsage),
      },
    });

  } catch (error) {
    console.error('Error fetching AI usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI usage statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update-limits':
        // Update AI usage limits (admin only)
        if (!session.user.role.includes('admin')) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        const { monthlyLimit, enabled } = body;

        await db.organization.update({
          where: { id: session.user.organizationId },
          data: {
            aiCostLimitMonthly: monthlyLimit,
            aiUsageEnabled: enabled,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'AI usage limits updated successfully',
        });

      case 'export-usage':
        // Export usage data
        const { startDate, endDate, format = 'json' } = body;

        const usageData = await getDetailedUsage(
          session.user.organizationId,
          new Date(startDate),
          new Date(endDate)
        );

        if (format === 'csv') {
          const csv = convertToCSV(usageData);
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename=ai-usage-export.csv',
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: usageData,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing AI usage request:', error);
    return NextResponse.json(
      { error: 'Failed to process AI usage request' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getUsageForPeriod(organizationId: string, startDate: Date, endDate: Date) {
  const [documentCosts, insightsCosts] = await Promise.all([
    db.documentAnalysis.aggregate({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalCost: true },
      _count: true,
    }),
    db.financialInsightReport.aggregate({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { aiCost: true },
      _count: true,
    }),
  ]);

  return {
    totalCost: (documentCosts._sum.totalCost || 0) + (insightsCosts._sum.aiCost || 0),
    totalRequests: (documentCosts._count || 0) + (insightsCosts._count || 0),
  };
}

async function getDailyUsage(organizationId: string, days: number) {
  const dailyUsage = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const usage = await getUsageForPeriod(organizationId, date, nextDate);

    dailyUsage.push({
      date: date.toISOString().split('T')[0],
      cost: usage.totalCost,
      requests: usage.totalRequests,
    });
  }

  return dailyUsage;
}

async function getDetailedUsage(organizationId: string, startDate: Date, endDate: Date) {
  const [documents, insights, emails] = await Promise.all([
    db.documentAnalysis.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        fileName: true,
        category: true,
        totalCost: true,
        processingTime: true,
        createdAt: true,
        client: { select: { name: true } },
        uploader: { select: { name: true } },
      },
    }),
    db.financialInsightReport.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        aiCost: true,
        processingTime: true,
        createdAt: true,
        client: { select: { name: true } },
        generator: { select: { name: true } },
      },
    }),
    db.emailDraft.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        subject: true,
        purpose: true,
        createdAt: true,
        client: { select: { name: true } },
        creator: { select: { name: true } },
      },
    }),
  ]);

  return {
    documents: documents.map(doc => ({
      ...doc,
      service: 'document_analysis',
      cost: doc.totalCost,
    })),
    insights: insights.map(insight => ({
      ...insight,
      service: 'financial_insights',
      cost: insight.aiCost,
    })),
    emails: emails.map(email => ({
      ...email,
      service: 'communication_assistant',
      cost: 0.02, // Estimated cost
    })),
  };
}

function convertToCSV(data: any): string {
  const allItems = [
    ...data.documents,
    ...data.insights,
    ...data.emails,
  ];

  const headers = ['Service', 'ID', 'Client', 'User', 'Cost', 'Date'];
  const rows = allItems.map(item => [
    item.service,
    item.id,
    item.client?.name || 'N/A',
    item.uploader?.name || item.generator?.name || item.creator?.name || 'N/A',
    item.cost.toFixed(4),
    item.createdAt.toISOString(),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateUsageRecommendations(serviceBreakdown: any, monthlyUsage: any) {
  const recommendations = [];

  // High cost services
  const highCostServices = Object.entries(serviceBreakdown)
    .filter(([_, data]: [string, any]) => data.cost > 10)
    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.cost - a.cost);

  if (highCostServices.length > 0) {
    recommendations.push({
      type: 'cost_optimization',
      title: 'High Cost Services Detected',
      description: `${highCostServices[0][0]} is your highest cost service. Consider optimizing usage patterns.`,
      priority: 'medium',
    });
  }

  // Usage approaching limit
  if (monthlyUsage.totalCost > 800) { // 80% of default $1000 limit
    recommendations.push({
      type: 'budget_alert',
      title: 'Approaching Monthly Limit',
      description: 'You are approaching your monthly AI usage limit. Consider increasing the limit or optimizing usage.',
      priority: 'high',
    });
  }

  // Low usage services
  const lowUsageServices = Object.entries(serviceBreakdown)
    .filter(([_, data]: [string, any]) => data.requests < 5);

  if (lowUsageServices.length > 0) {
    recommendations.push({
      type: 'underutilization',
      title: 'Underutilized AI Services',
      description: `Consider exploring ${lowUsageServices[0][0]} features to maximize your AI investment.`,
      priority: 'low',
    });
  }

  return recommendations;
}