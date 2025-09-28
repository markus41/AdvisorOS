import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { documentService } from '@/lib/services/document-service';
import { z } from 'zod';

const updateSchema = z.object({
  fileName: z.string().min(1).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  year: z.number().int().min(1900).max(2050).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  isConfidential: z.boolean().optional(),
  needsReview: z.boolean().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

// Get document by ID
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

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const document = await documentService.getDocument(
      id,
      session.user.organizationId,
      session.user.id
    );

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Failed to get document:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to retrieve document'
    }, { status: 500 });
  }
}

// Update document metadata
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Validate update data
    const validatedData = updateSchema.parse(body);

    const updatedDocument = await documentService.updateDocument(
      id,
      session.user.organizationId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      document: updatedDocument
    });

  } catch (error) {
    console.error('Failed to update document:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update document'
    }, { status: 500 });
  }
}

// Delete document (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await documentService.deleteDocument(
      id,
      session.user.organizationId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete document:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete document'
    }, { status: 500 });
  }
}