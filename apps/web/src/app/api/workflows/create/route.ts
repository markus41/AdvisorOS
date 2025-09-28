import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@database/client";
import { WorkflowService } from "@/server/services/workflow.service";
import { z } from "zod";

const prisma = new PrismaClient();
const workflowService = new WorkflowService(prisma);

const createWorkflowSchema = z.object({
  templateId: z.string(),
  name: z.string().min(1),
  organizationId: z.string(),
  engagementId: z.string().optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  variables: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createWorkflowSchema.parse(body);

    const context = {
      organizationId: validatedData.organizationId,
      engagementId: validatedData.engagementId,
      clientId: validatedData.clientId,
      assignedToId: validatedData.assignedToId,
      variables: validatedData.variables
    };

    const execution = await workflowService.createWorkflowFromTemplate(
      validatedData.templateId,
      validatedData.name,
      context,
      validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      validatedData.dueDate ? new Date(validatedData.dueDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error("Error creating workflow:", error);

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
        error: error instanceof Error ? error.message : "Failed to create workflow"
      },
      { status: 500 }
    );
  }
}