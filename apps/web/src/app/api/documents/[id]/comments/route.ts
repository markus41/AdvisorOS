import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from "../../../../../server/db";
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  isPrivate: z.boolean().optional(),
  mentions: z.array(z.string()).optional(),
  attachments: z.record(z.any()).optional(),
  taskAssigned: z.string().optional(),
  parentId: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// Get document comments
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

    const comments = await prisma.documentComment.findMany({
      where: {
        documentId: id,
        deletedAt: null,
        parentId: null // Only get top-level comments
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
      comments
    });

  } catch (error) {
    console.error('Failed to get comments:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to retrieve comments'
    }, { status: 500 });
  }
}

// Create comment
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

    // Validate comment data
    const validatedData = commentSchema.parse(body);

    // If this is a reply, verify parent comment exists
    if (validatedData.parentId) {
      const parentComment = await prisma.documentComment.findFirst({
        where: {
          id: validatedData.parentId,
          documentId: id,
          deletedAt: null
        }
      });

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    const comment = await prisma.documentComment.create({
      data: {
        documentId: id,
        content: validatedData.content,
        isPrivate: validatedData.isPrivate || false,
        mentions: validatedData.mentions || [],
        attachments: validatedData.attachments,
        taskAssigned: validatedData.taskAssigned,
        parentId: validatedData.parentId,
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

    // If there are mentions, we could send notifications here
    if (validatedData.mentions && validatedData.mentions.length > 0) {
      // TODO: Implement notification system for mentions
      console.log('Mentions to notify:', validatedData.mentions);
    }

    return NextResponse.json({
      success: true,
      comment
    });

  } catch (error) {
    console.error('Failed to create comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create comment'
    }, { status: 500 });
  }
}