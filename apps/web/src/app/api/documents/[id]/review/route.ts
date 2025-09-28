import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ocrService } from '@/lib/services/ocr-service';
import { z } from 'zod';

const reviewSchema = z.object({
  extractedData: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean(),
  comments: z.string().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

// Submit manual OCR review
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

    // Validate review data
    const validatedData = reviewSchema.parse(body);

    // Submit manual review
    await ocrService.submitManualReview({
      documentId: id,
      reviewedBy: session.user.id,
      ...validatedData
    });

    return NextResponse.json({
      success: true,
      message: 'Manual review submitted successfully'
    });

  } catch (error) {
    console.error('Manual review submission failed:', error);

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
      error: error instanceof Error ? error.message : 'Manual review submission failed'
    }, { status: 500 });
  }
}