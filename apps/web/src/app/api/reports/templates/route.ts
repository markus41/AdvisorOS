import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
// import { ReportService } from "@/server/services/report.service";
// import { SystemReportTemplates, getTemplateById, getTemplatesByCategory, validateTemplateConfiguration } from "@/server/templates/reports";
import { z } from "zod";

// const reportService = new ReportService(prisma);

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  type: z.string(),
  layout: z.record(z.any()),
  sections: z.array(z.record(z.any())),
  dataRequirements: z.record(z.any()),
  chartConfigs: z.record(z.any()).optional(),
  brandingOptions: z.record(z.any()).optional(),
  organizationId: z.string(),
  createdBy: z.string()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const templateId = searchParams.get("templateId");
    const category = searchParams.get("category");
    const includeSystem = searchParams.get("includeSystem") === "true";

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
      // Get specific template
      let template;

      // Check custom templates (system templates disabled for now)
      template = await prisma.reportTemplate.findFirst({
        where: {
          id: templateId,
          OR: [
            { organizationId },
            { isSystem: true }
          ],
          isActive: true
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
    }

    // Get list of templates
    let templates = [];

    // Add system templates if requested (disabled for now)
    // if (includeSystem) {
    //   if (category) {
    //     templates = getTemplatesByCategory(category);
    //   } else {
    //     templates = [...SystemReportTemplates];
    //   }
    // }

    // Add custom templates
    const customTemplates = await prisma.reportTemplate.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(category && { category })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ]
    });

    templates = [...templates, ...customTemplates];

    return NextResponse.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error("Error getting report templates:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get report templates"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Validate template configuration (simplified for now)
    // const validation = validateTemplateConfiguration(validatedData);
    // if (!validation.isValid) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Invalid template configuration",
    //       details: validation.errors
    //     },
    //     { status: 400 }
    //   );
    // }

    const template = await prisma.reportTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        type: validatedData.type,
        layout: validatedData.layout,
        sections: validatedData.sections,
        dataRequirements: validatedData.dataRequirements,
        chartConfigs: validatedData.chartConfigs,
        brandingOptions: validatedData.brandingOptions,
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
    console.error("Error creating report template:", error);

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
        error: error instanceof Error ? error.message : "Failed to create report template"
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, organizationId, updates } = body;

    if (!templateId || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "templateId and organizationId are required"
        },
        { status: 400 }
      );
    }

    // Validate template configuration if sections are being updated (simplified for now)
    // if (updates.sections) {
    //   const validation = validateTemplateConfiguration({ ...updates, id: templateId });
    //   if (!validation.isValid) {
    //     return NextResponse.json(
    //       {
    //         success: false,
    //         error: "Invalid template configuration",
    //         details: validation.errors
    //       },
    //       { status: 400 }
    //     );
    //   }
    // }

    const template = await prisma.reportTemplate.update({
      where: {
        id: templateId,
        organizationId,
        isSystem: false // Only allow updating custom templates
      },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error("Error updating report template:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update report template"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");
    const organizationId = searchParams.get("organizationId");

    if (!templateId || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "templateId and organizationId are required"
        },
        { status: 400 }
      );
    }

    // Soft delete the template
    await prisma.reportTemplate.update({
      where: {
        id: templateId,
        organizationId,
        isSystem: false // Only allow deleting custom templates
      },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting report template:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete report template"
      },
      { status: 500 }
    );
  }
}