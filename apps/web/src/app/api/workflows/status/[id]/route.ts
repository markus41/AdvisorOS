import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@database/client";
import { WorkflowService } from "@/server/services/workflow.service";

const prisma = new PrismaClient();
const workflowService = new WorkflowService(prisma);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const status = await workflowService.getWorkflowStatus(params.id, organizationId);

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Error getting workflow status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get workflow status"
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { organizationId, updates } = body;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required"
        },
        { status: 400 }
      );
    }

    // Update workflow execution
    const execution = await prisma.workflowExecution.update({
      where: {
        id: params.id,
        organizationId
      },
      data: updates
    });

    return NextResponse.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error("Error updating workflow:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update workflow"
      },
      { status: 500 }
    );
  }
}