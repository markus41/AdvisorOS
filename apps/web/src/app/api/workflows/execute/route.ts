import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
// import { WorkflowService } from "@/server/services/workflow.service";
import { z } from "zod";

// const workflowService = new WorkflowService(prisma);

const executeWorkflowSchema = z.object({
  executionId: z.string(),
  organizationId: z.string(),
  action: z.enum(["start", "pause", "resume", "cancel"])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executionId, organizationId, action } = executeWorkflowSchema.parse(body);

    let result;

    // Simplified workflow actions
    switch (action) {
      case "start":
        result = await prisma.workflowExecution.update({
          where: { id: executionId, organizationId },
          data: { status: 'running', startedAt: new Date() }
        });
        break;
      case "pause":
        result = await prisma.workflowExecution.update({
          where: { id: executionId, organizationId },
          data: { status: 'paused' }
        });
        break;
      case "resume":
        result = await prisma.workflowExecution.update({
          where: { id: executionId, organizationId },
          data: { status: 'running' }
        });
        break;
      case "cancel":
        result = await prisma.workflowExecution.update({
          where: { id: executionId, organizationId },
          data: { status: 'cancelled', completedAt: new Date() }
        });
        break;
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error executing workflow action:`, error);

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
        error: error instanceof Error ? error.message : "Failed to execute workflow action"
      },
      { status: 500 }
    );
  }
}