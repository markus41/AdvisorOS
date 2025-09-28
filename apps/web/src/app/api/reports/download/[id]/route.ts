import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ReportService } from "@/server/services/report.service";
import { readFile } from "fs/promises";
import { join } from "path";

const prisma = new PrismaClient();
const reportService = new ReportService(prisma);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const format = searchParams.get("format") as "pdf" | "excel" | "csv" || "pdf";

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required"
        },
        { status: 400 }
      );
    }

    // Get report status to verify it exists and is completed
    const report = await reportService.getReportStatus(params.id, organizationId);

    if (report.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Report is not ready for download"
        },
        { status: 400 }
      );
    }

    // Export report in requested format
    const { fileUrl, fileSize } = await reportService.exportReport(
      params.id,
      format,
      organizationId
    );

    // Read the file from the file system
    const filePath = join(process.cwd(), "public", fileUrl.replace("/", ""));
    const fileBuffer = await readFile(filePath);

    // Set appropriate headers based on format
    const headers = new Headers();
    let contentType: string;
    let filename: string;

    switch (format) {
      case "pdf":
        contentType = "application/pdf";
        filename = `${report.name}.pdf`;
        break;
      case "excel":
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `${report.name}.xlsx`;
        break;
      case "csv":
        contentType = "text/csv";
        filename = `${report.name}.csv`;
        break;
      default:
        contentType = "application/octet-stream";
        filename = `${report.name}.${format}`;
    }

    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Length", fileSize.toString());
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    // Update download count
    await prisma.report.update({
      where: { id: params.id },
      data: {
        downloadCount: { increment: 1 }
      }
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error downloading report:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to download report"
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { organizationId, format, regenerate } = body;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required"
        },
        { status: 400 }
      );
    }

    // Get report to check if it exists
    const report = await reportService.getReportStatus(params.id, organizationId);

    // If regenerate is requested or report doesn't have a file yet
    if (regenerate || !report.fileUrl) {
      const { fileUrl, fileSize } = await reportService.exportReport(
        params.id,
        format || "pdf",
        organizationId
      );

      return NextResponse.json({
        success: true,
        data: {
          fileUrl,
          fileSize,
          reportId: params.id,
          format: format || "pdf"
        }
      });
    }

    // Return existing file info
    return NextResponse.json({
      success: true,
      data: {
        fileUrl: report.fileUrl,
        fileSize: Number(report.fileSize),
        reportId: params.id,
        format: report.format
      }
    });
  } catch (error) {
    console.error("Error preparing report download:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to prepare report download"
      },
      { status: 500 }
    );
  }
}