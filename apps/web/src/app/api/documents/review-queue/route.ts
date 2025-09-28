import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ocrService } from '@/lib/services/ocr-service';
import { z } from 'zod';

const reviewQueueSchema = z.object({
  clientId: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams: any = {};

    if (searchParams.get('clientId')) queryParams.clientId = searchParams.get('clientId');
    if (searchParams.get('category')) queryParams.category = searchParams.get('category');
    if (searchParams.get('limit')) queryParams.limit = parseInt(searchParams.get('limit')!);
    if (searchParams.get('offset')) queryParams.offset = parseInt(searchParams.get('offset')!);

    // Validate parameters
    const validatedParams = reviewQueueSchema.parse(queryParams);

    // Get documents needing review
    const result = await ocrService.getDocumentsNeedingReview(
      session.user.organizationId,
      validatedParams
    );

    return NextResponse.json({
      success: true,
      documents: result.documents,
      pagination: {
        total: result.total,
        limit: validatedParams.limit || 50,
        offset: validatedParams.offset || 0,
        hasMore: (validatedParams.offset || 0) + result.documents.length < result.total
      }
    });

  } catch (error) {
    console.error('Failed to get review queue:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to get review queue'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validatedParams = reviewQueueSchema.parse(body);

    // Get documents needing review
    const result = await ocrService.getDocumentsNeedingReview(
      session.user.organizationId,
      validatedParams
    );

    return NextResponse.json({
      success: true,
      documents: result.documents,
      pagination: {
        total: result.total,
        limit: validatedParams.limit || 50,
        offset: validatedParams.offset || 0,
        hasMore: (validatedParams.offset || 0) + result.documents.length < result.total
      }
    });

  } catch (error) {
    console.error('Failed to get review queue:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to get review queue'
    }, { status: 500 });
  }
}