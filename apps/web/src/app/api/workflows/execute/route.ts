import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@database/client";
import { WorkflowService } from "@/server/services/workflow.service";
import { z } from "zod";

const prisma = new PrismaClient();
const workflowService = new WorkflowService(prisma);

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

    switch (action) {
      case "start":
        result = await workflowService.executeWorkflow(executionId, organizationId);
        break;
      case "pause":
        result = await workflowService.pauseWorkflow(executionId, organizationId);
        break;
      case "resume":
        result = await workflowService.resumeWorkflow(executionId, organizationId);
        break;
      case "cancel":
        result = await workflowService.cancelWorkflow(executionId, organizationId);
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