import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import { documentService } from '@/lib/services/document-service';
import { z } from 'zod';

const searchSchema = z.object({
  clientId: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  year: z.number().int().min(1900).max(2050).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  tags: z.array(z.string()).optional(),
  searchText: z.string().optional(),
  fileType: z.string().optional(),
  isConfidential: z.boolean().optional(),
  ocrStatus: z.enum(['pending', 'processing', 'completed', 'failed', 'manual_review', 'skipped']).optional(),
  needsReview: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  sortBy: z.enum(['createdAt', 'fileName', 'fileSize', 'ocrConfidence']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams: any = {
      organizationId: session.user.organizationId
    };

    // Extract and validate search parameters
    if (searchParams.get('clientId')) queryParams.clientId = searchParams.get('clientId');
    if (searchParams.get('category')) queryParams.category = searchParams.get('category');
    if (searchParams.get('subcategory')) queryParams.subcategory = searchParams.get('subcategory');
    if (searchParams.get('year')) queryParams.year = parseInt(searchParams.get('year')!);
    if (searchParams.get('quarter')) queryParams.quarter = parseInt(searchParams.get('quarter')!);
    if (searchParams.get('tags')) queryParams.tags = searchParams.get('tags')!.split(',');
    if (searchParams.get('searchText')) queryParams.searchText = searchParams.get('searchText');
    if (searchParams.get('fileType')) queryParams.fileType = searchParams.get('fileType');
    if (searchParams.get('isConfidential')) queryParams.isConfidential = searchParams.get('isConfidential') === 'true';
    if (searchParams.get('ocrStatus')) queryParams.ocrStatus = searchParams.get('ocrStatus');
    if (searchParams.get('needsReview')) queryParams.needsReview = searchParams.get('needsReview') === 'true';
    if (searchParams.get('dateFrom')) queryParams.dateFrom = new Date(searchParams.get('dateFrom')!);
    if (searchParams.get('dateTo')) queryParams.dateTo = new Date(searchParams.get('dateTo')!);
    if (searchParams.get('limit')) queryParams.limit = parseInt(searchParams.get('limit')!);
    if (searchParams.get('offset')) queryParams.offset = parseInt(searchParams.get('offset')!);
    if (searchParams.get('sortBy')) queryParams.sortBy = searchParams.get('sortBy');
    if (searchParams.get('sortOrder')) queryParams.sortOrder = searchParams.get('sortOrder');

    // Validate parameters
    const validatedParams = searchSchema.parse(queryParams);

    // Perform search
    const result = await documentService.searchDocuments({
      organizationId: session.user.organizationId,
      ...validatedParams
    });

    return NextResponse.json({
      success: true,
      documents: result.documents,
      pagination: {
        total: result.total,
        limit: validatedParams.limit || 50,
        offset: validatedParams.offset || 0,
        hasMore: result.hasMore
      }
    });

  } catch (error) {
    console.error('Document search failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid search parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Search failed'
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
    const validatedParams = searchSchema.parse(body);

    // Perform search
    const result = await documentService.searchDocuments({
      organizationId: session.user.organizationId,
      ...validatedParams
    });

    return NextResponse.json({
      success: true,
      documents: result.documents,
      pagination: {
        total: result.total,
        limit: validatedParams.limit || 50,
        offset: validatedParams.offset || 0,
        hasMore: result.hasMore
      }
    });

  } catch (error) {
    console.error('Document search failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid search parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 });
  }
}