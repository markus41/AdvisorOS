import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/authOptions';
import { ocrService } from '@/lib/services/ocr-service';
import { z } from 'zod';

const ocrRequestSchema = z.object({
  forceReprocess: z.boolean().optional(),
  documentType: z.string().optional(),
  options: z.object({
    pages: z.string().optional(),
    locale: z.string().optional()
  }).optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

// Trigger OCR processing
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

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    // Validate request body
    const validatedData = ocrRequestSchema.parse(body);

    // Process OCR
    const result = await ocrService.processDocument({
      documentId: id,
      ...validatedData
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        ocrResult: result.ocrResult,
        structuredData: result.structuredData,
        needsReview: result.needsReview,
        message: result.needsReview
          ? 'OCR completed but requires manual review'
          : 'OCR completed successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        needsReview: true,
        errors: result.errors,
        message: 'OCR processing failed'
      }, { status: 422 });
    }

  } catch (error) {
    console.error('OCR processing failed:', error);

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
      error: error instanceof Error ? error.message : 'OCR processing failed'
    }, { status: 500 });
  }
}

// Get OCR status and results
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

    // Get document with OCR data
    const document = await ocrService.processDocument({
      documentId: id,
      forceReprocess: false
    });

    return NextResponse.json({
      success: true,
      ocrStatus: document.success ? 'completed' : 'failed',
      ocrResult: document.ocrResult,
      structuredData: document.structuredData,
      needsReview: document.needsReview,
      errors: document.errors
    });

  } catch (error) {
    console.error('Failed to get OCR data:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to retrieve OCR data'
    }, { status: 500 });
  }
}