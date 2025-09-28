import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ReportService } from "@/server/services/report.service";
import { z } from "zod";

const prisma = new PrismaClient();
const reportService = new ReportService(prisma);

const generateReportSchema = z.object({
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
    const validatedData = generateReportSchema.parse(body);

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

    const reportId = await reportService.generateReport(
      validatedData.reportType,
      parameters,
      validatedData.createdBy
    );

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        status: "generating",
        message: "Report generation started"
      }
    });
  } catch (error) {
    console.error("Error generating report:", error);

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
        error: error instanceof Error ? error.message : "Failed to generate report"
      },
      { status: 500 }
    );
  }
}