import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@database/client";
import { WorkflowService } from "@/server/services/workflow.service";
import { z } from "zod";

const prisma = new PrismaClient();
const workflowService = new WorkflowService(prisma);

const scheduleWorkflowSchema = z.object({
  templateId: z.string(),
  name: z.string().min(1),
  cronExpression: z.string(),
  organizationId: z.string(),
  engagementId: z.string().optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  variables: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scheduleWorkflowSchema.parse(body);

    const context = {
      organizationId: validatedData.organizationId,
      engagementId: validatedData.engagementId,
      clientId: validatedData.clientId,
      assignedToId: validatedData.assignedToId,
      variables: validatedData.variables
    };

    const execution = await workflowService.scheduleRecurringWorkflow(
      validatedData.templateId,
      validatedData.cronExpression,
      context,
      validatedData.name
    );

    return NextResponse.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error("Error scheduling workflow:", error);

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
        error: error instanceof Error ? error.message : "Failed to schedule workflow"
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

    // Get all scheduled (recurring) workflows
    const scheduledWorkflows = await prisma.workflowExecution.findMany({
      where: {
        organizationId,
        isRecurring: true,
        status: { not: "cancelled" }
      },
      include: {
        template: true,
        engagement: true,
        client: true,
        assignedTo: true
      },
      orderBy: {
        nextRunAt: "asc"
      }
    });

    return NextResponse.json({
      success: true,
      data: scheduledWorkflows
    });
  } catch (error) {
    console.error("Error getting scheduled workflows:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get scheduled workflows"
      },
      { status: 500 }
    );
  }
}