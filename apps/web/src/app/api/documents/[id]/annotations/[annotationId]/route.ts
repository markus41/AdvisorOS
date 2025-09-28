import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from "../../../../../../server/db";
import { z } from 'zod';

const updateAnnotationSchema = z.object({
  type: z.enum(['highlight', 'note', 'rectangle', 'arrow', 'text']).optional(),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  style: z.record(z.any()).optional(),
  isPrivate: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
    annotationId: string;
  };
}

// Update annotation
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, annotationId } = params;
    const body = await request.json();

    // Verify annotation exists and user has permission
    const annotation = await prisma.documentAnnotation.findFirst({
      where: {
        id: annotationId,
        documentId: id,
        deletedAt: null
      },
      include: {
        document: {
          select: {
            organizationId: true
          }
        }
      }
    });

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    if (annotation.document.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow the creator or admin to edit
    if (annotation.createdBy !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Validate update data
    const validatedData = updateAnnotationSchema.parse(body);

    const updatedAnnotation = await prisma.documentAnnotation.update({
      where: { id: annotationId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      annotation: updatedAnnotation
    });

  } catch (error) {
    console.error('Failed to update annotation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update annotation'
    }, { status: 500 });
  }
}

// Delete annotation
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, annotationId } = params;

    // Verify annotation exists and user has permission
    const annotation = await prisma.documentAnnotation.findFirst({
      where: {
        id: annotationId,
        documentId: id,
        deletedAt: null
      },
      include: {
        document: {
          select: {
            organizationId: true
          }
        }
      }
    });

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    if (annotation.document.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow the creator or admin to delete
    if (annotation.createdBy !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Soft delete
    await prisma.documentAnnotation.update({
      where: { id: annotationId },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Annotation deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete annotation:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete annotation'
    }, { status: 500 });
  }
}