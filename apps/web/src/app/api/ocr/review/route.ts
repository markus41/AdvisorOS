import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@cpa-platform/database';
import { openaiClient } from '@/lib/ai/openai-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      jobId,
      extractedData,
      corrections,
      validationOverrides,
      approved,
      notes,
      reviewedFields
    } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get the original job and result
    const job = await db.ocrJob.findFirst({
      where: {
        id: jobId,
        organizationId: session.user.organizationId,
      },
      include: {
        result: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (!job.result) {
      return NextResponse.json(
        { error: 'No processing result found for this job' },
        { status: 400 }
      );
    }

    // Create review record
    const review = await db.ocrReview.create({
      data: {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ocrJobId: jobId,
        organizationId: session.user.organizationId,
        reviewedBy: session.user.id,
        originalData: job.result.extractedData,
        reviewedData: extractedData,
        corrections: corrections || {},
        validationOverrides: validationOverrides || [],
        approved,
        notes: notes || '',
        reviewedFields: reviewedFields || [],
        reviewedAt: new Date(),
        accuracyScore: calculateAccuracyScore(job.result.extractedData, extractedData, corrections),
      },
    });

    // If approved and there are corrections, update the original result
    if (approved && corrections && Object.keys(corrections).length > 0) {
      const updatedData = { ...job.result.extractedData, ...corrections };

      await db.documentProcessing.update({
        where: { id: job.result.id },
        data: {
          extractedData: updatedData,
          validationErrors: filterValidationErrors(
            job.result.validationErrors,
            validationOverrides || []
          ),
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      });

      // Generate improvement insights based on corrections
      const improvementInsights = await generateImprovementInsights(
        job.result.extractedData,
        corrections,
        job.result.documentType
      );

      // Store insights for model improvement
      await db.ocrInsights.create({
        data: {
          documentType: job.result.documentType,
          originalData: job.result.extractedData,
          correctedData: corrections,
          insights: improvementInsights,
          organizationId: session.user.organizationId,
          createdAt: new Date(),
        },
      });
    }

    // Update job status
    await db.ocrJob.update({
      where: { id: jobId },
      data: {
        status: approved ? 'reviewed_approved' : 'reviewed_rejected',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reviewId: review.id,
        accuracyScore: review.accuracyScore,
        message: approved ? 'Document approved successfully' : 'Document marked for revision',
      },
    });

  } catch (error: any) {
    console.error('Error processing review:', error);
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (jobId) {
      // Get specific review for a job
      const review = await db.ocrReview.findFirst({
        where: {
          ocrJobId: jobId,
          organizationId: session.user.organizationId,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ocrJob: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
      });

      if (!review) {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: review,
      });
    } else {
      // Get all reviews for the organization
      const reviews = await db.ocrReview.findMany({
        where: {
          organizationId: session.user.organizationId,
        },
        orderBy: { reviewedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ocrJob: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
      });

      const total = await db.ocrReview.count({
        where: {
          organizationId: session.user.organizationId,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          reviews,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
      });
    }

  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * Calculate accuracy score based on corrections
 */
function calculateAccuracyScore(
  originalData: Record<string, any>,
  reviewedData: Record<string, any>,
  corrections: Record<string, any>
): number {
  const totalFields = Object.keys(originalData).length;
  if (totalFields === 0) return 100;

  const correctFields = totalFields - Object.keys(corrections || {}).length;
  return Math.round((correctFields / totalFields) * 100);
}

/**
 * Filter validation errors based on overrides
 */
function filterValidationErrors(
  originalErrors: any[],
  overrides: string[]
): any[] {
  return originalErrors.filter(error => !overrides.includes(error.field));
}

/**
 * Generate improvement insights using AI
 */
async function generateImprovementInsights(
  originalData: Record<string, any>,
  corrections: Record<string, any>,
  documentType: string
): Promise<string[]> {
  try {
    const prompt = `
Analyze the OCR extraction corrections for a ${documentType} document and provide insights for improvement.

Original extracted data:
${JSON.stringify(originalData, null, 2)}

Corrections made:
${JSON.stringify(corrections, null, 2)}

Provide 3-5 specific insights about:
1. Common extraction errors that occurred
2. Patterns in the mistakes
3. Suggestions for improving extraction accuracy
4. Document quality factors that may have affected results

Return as a JSON array of insight strings.
`;

    const response = await openaiClient.createChatCompletion(
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.3,
        maxTokens: 400,
      }
    );

    try {
      return JSON.parse(response.content);
    } catch (parseError) {
      // If JSON parsing fails, return the response as a single insight
      return [response.content];
    }
  } catch (error) {
    console.error('Failed to generate improvement insights:', error);
    return [
      'Manual review completed - data accuracy improved through corrections',
      'Consider reviewing document image quality for better OCR results',
    ];
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reviewId, corrections, notes, approved } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    // Get existing review
    const existingReview = await db.ocrReview.findFirst({
      where: {
        id: reviewId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Update review
    const updatedReview = await db.ocrReview.update({
      where: { id: reviewId },
      data: {
        corrections: corrections || existingReview.corrections,
        notes: notes !== undefined ? notes : existingReview.notes,
        approved: approved !== undefined ? approved : existingReview.approved,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}