import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@database/client";
import { ReportService } from "@/server/services/report.service";

const prisma = new PrismaClient();
const reportService = new ReportService(prisma);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const reportId = searchParams.get("reportId");
    const status = searchParams.get("status");
    const reportType = searchParams.get("reportType");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required"
        },
        { status: 400 }
      );
    }

    if (reportId) {
      // Get specific report status
      const report = await reportService.getReportStatus(reportId, organizationId);
      return NextResponse.json({
        success: true,
        data: report
      });
    }

    // Get list of reports with filters
    const where: any = {
      organizationId,
      deletedAt: null
    };

    if (status) {
      where.status = status;
    }

    if (reportType) {
      where.reportType = reportType;
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          engagement: {
            select: {
              id: true,
              name: true,
              client: {
                select: {
                  id: true,
                  businessName: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: limit,
        skip: offset
      }),
      prisma.report.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });
  } catch (error) {
    console.error("Error getting reports:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get reports"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Soft delete the report
    await prisma.report.update({
      where: {
        id: reportId,
        organizationId
      },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting report:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete report"
      },
      { status: 500 }
    );
  }
}