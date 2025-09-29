import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
// import { WorkflowTemplatesService } from "@/server/services/workflow-templates.service";
import { z } from "zod";

// const templatesService = new WorkflowTemplatesService(prisma);

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  type: z.string(),
  estimatedDuration: z.number().optional(),
  complexity: z.enum(["low", "medium", "high"]).optional(),
  steps: z.array(z.any()),
  taskTemplates: z.record(z.any()),
  requirements: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  organizationId: z.string(),
  createdBy: z.string()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const templateId = searchParams.get("templateId");

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required"
        },
        { status: 400 }
      );
    }

    if (templateId) {
      // Get specific template (simplified)
      const template = await prisma.workflowTemplate.findFirst({
        where: {
          id: templateId,
          OR: [
            { organizationId },
            { isSystem: true }
          ],
          isActive: true
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      if (!template) {
        return NextResponse.json(
          {
            success: false,
            error: "Template not found"
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: template
      });
    } else {
      // Get all available templates (simplified)
      const templates = await prisma.workflowTemplate.findMany({
        where: {
          OR: [
            { organizationId },
            { isSystem: true }
          ],
          isActive: true
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return NextResponse.json({
        success: true,
        data: templates
      });
    }
  } catch (error) {
    console.error("Error getting workflow templates:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get workflow templates"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create custom template (simplified)
    const template = await prisma.workflowTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        type: validatedData.type,
        estimatedDuration: validatedData.estimatedDuration,
        complexity: validatedData.complexity || "medium",
        steps: validatedData.steps,
        taskTemplates: validatedData.taskTemplates,
        requirements: validatedData.requirements,
        settings: validatedData.settings,
        organizationId: validatedData.organizationId,
        createdBy: validatedData.createdBy,
        isActive: true,
        isSystem: false
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error("Error creating workflow template:", error);

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
        error: error instanceof Error ? error.message : "Failed to create workflow template"
      },
      { status: 500 }
    );
  }
}