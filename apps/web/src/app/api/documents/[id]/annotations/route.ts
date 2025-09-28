import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/authOptions';
import { prisma } from "../../../../../server/db";
import { z } from 'zod';

const annotationSchema = z.object({
  type: z.enum(['highlight', 'note', 'rectangle', 'arrow', 'text']),
  page: z.number().int().min(1),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  content: z.string().optional(),
  color: z.string(),
  style: z.record(z.any()).optional(),
  isPrivate: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// Get document annotations
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify document access
    const document = await prisma.document.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const annotations = await prisma.documentAnnotation.findMany({
      where: {
        documentId: id,
        deletedAt: null
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        replies: {
          where: { deletedAt: null },
          include: {
            creator: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      annotations
    });

  } catch (error) {
    console.error('Failed to get annotations:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to retrieve annotations'
    }, { status: 500 });
  }
}

// Create annotation
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verify document access
    const document = await prisma.document.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        deletedAt: null
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Validate annotation data
    const validatedData = annotationSchema.parse(body);

    const annotation = await prisma.documentAnnotation.create({
      data: {
        documentId: id,
        type: validatedData.type,
        page: validatedData.page,
        coordinates: validatedData.coordinates,
        content: validatedData.content,
        color: validatedData.color,
        style: validatedData.style,
        isPrivate: validatedData.isPrivate || false,
        createdBy: session.user.id
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
      annotation
    });

  } catch (error) {
    console.error('Failed to create annotation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create annotation'
    }, { status: 500 });
  }
}