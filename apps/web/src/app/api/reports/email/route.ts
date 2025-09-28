import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ReportService } from "@/server/services/report.service";
import { z } from "zod";

const prisma = new PrismaClient();
const reportService = new ReportService(prisma);

const emailReportSchema = z.object({
  reportId: z.string(),
  organizationId: z.string(),
  recipients: z.array(z.string().email()),
  subject: z.string().optional(),
  message: z.string().optional(),
  includeAttachment: z.boolean().default(true),
  format: z.enum(["pdf", "excel", "csv"]).default("pdf")
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = emailReportSchema.parse(body);

    // Verify report exists and is completed
    const report = await reportService.getReportStatus(
      validatedData.reportId,
      validatedData.organizationId
    );

    if (report.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Report is not ready to be emailed"
        },
        { status: 400 }
      );
    }

    // Send the email
    const result = await reportService.emailReport(
      validatedData.reportId,
      validatedData.recipients,
      validatedData.subject,
      validatedData.message,
      validatedData.organizationId
    );

    if (result.success) {
      // Log the email activity
      await prisma.auditLog.create({
        data: {
          action: "email_report",
          entityType: "report",
          entityId: validatedData.reportId,
          metadata: {
            recipients: validatedData.recipients,
            subject: validatedData.subject,
            reportName: report.name
          },
          organizationId: validatedData.organizationId,
          userId: report.createdById
        }
      });

      return NextResponse.json({
        success: true,
        message: "Report emailed successfully"
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error emailing report:", error);

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
        error: error instanceof Error ? error.message : "Failed to email report"
      },
      { status: 500 }
    );
  }
}

// Get email history for a report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");
    const organizationId = searchParams.get("organizationId");

    if (!reportId || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "reportId and organizationId are required"
        },
        { status: 400 }
      );
    }

    // Get email history from audit logs
    const emailHistory = await prisma.auditLog.findMany({
      where: {
        action: "email_report",
        entityType: "report",
        entityId: reportId,
        organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      data: emailHistory.map(log => ({
        id: log.id,
        sentAt: log.createdAt,
        sentBy: log.user,
        recipients: log.metadata?.recipients || [],
        subject: log.metadata?.subject,
        reportName: log.metadata?.reportName
      }))
    });
  } catch (error) {
    console.error("Error getting email history:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get email history"
      },
      { status: 500 }
    );
  }
}