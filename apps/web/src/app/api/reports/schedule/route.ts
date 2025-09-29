import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
// import { ReportService } from "@/server/services/report.service";
import { z } from "zod";

// const reportService = new ReportService(prisma);

const scheduleReportSchema = z.object({
  name: z.string().min(1),
  reportType: z.enum([
    "financial_statement",
    "tax_summary",
    "client_portfolio",
    "business_health",
    "compliance",
    "engagement_summary",
    "time_tracking",
    "custom"
  ]),
  organizationId: z.string(),
  format: z.enum(["pdf", "excel", "csv", "html"]),
  cronExpression: z.string(),
  recipients: z.object({
    emails: z.array(z.string().email()),
    userIds: z.array(z.string()).optional(),
    clientIds: z.array(z.string()).optional()
  }),
  deliveryMethod: z.enum(["email", "portal", "both"]),
  isActive: z.boolean().default(true),
  clientIds: z.array(z.string()).optional(),
  engagementId: z.string().optional(),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).optional(),
  filters: z.record(z.any()).optional(),
  template: z.object({
    id: z.string(),
    customizations: z.record(z.any()).optional()
  }).optional(),
  customFields: z.record(z.any()).optional(),
  createdBy: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scheduleReportSchema.parse(body);

    const parameters = {
      organizationId: validatedData.organizationId,
      clientIds: validatedData.clientIds,
      engagementId: validatedData.engagementId,
      dateRange: validatedData.dateRange ? {
        startDate: new Date(validatedData.dateRange.startDate),
        endDate: new Date(validatedData.dateRange.endDate)
      } : undefined,
      filters: validatedData.filters,
      customFields: validatedData.customFields,
      format: validatedData.format,
      template: validatedData.template
    };

    const scheduleConfig = {
      cronExpression: validatedData.cronExpression,
      recipients: validatedData.recipients,
      deliveryMethod: validatedData.deliveryMethod,
      isActive: validatedData.isActive
    };

    // Create a scheduled report (simplified implementation)
    const schedule = await prisma.reportSchedule.create({
      data: {
        name: validatedData.name,
        reportType: validatedData.reportType,
        organizationId: validatedData.organizationId,
        cronExpression: validatedData.cronExpression,
        recipients: validatedData.recipients,
        deliveryMethod: validatedData.deliveryMethod,
        isActive: validatedData.isActive,
        parameters: parameters,
        createdBy: validatedData.createdBy,
        nextRunAt: new Date(), // This should be calculated based on cron expression
      }
    });

    return NextResponse.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error("Error scheduling report:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to schedule report"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required"
        },
        { status: 400 }
      );
    }

    const schedules = await prisma.reportSchedule.findMany({
      where: {
        organizationId,
        deletedAt: null
      },
      include: {
        template: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        nextRunAt: "asc"
      }
    });

    return NextResponse.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error("Error getting scheduled reports:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get scheduled reports"
      },
      { status: 500 }
    );
  }
}