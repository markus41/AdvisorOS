import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ocrService } from '@/lib/services/ocr-service';
import { z } from 'zod';

const statisticsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
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

    if (searchParams.get('dateFrom')) queryParams.dateFrom = searchParams.get('dateFrom');
    if (searchParams.get('dateTo')) queryParams.dateTo = searchParams.get('dateTo');

    // Validate parameters
    const validatedParams = statisticsSchema.parse(queryParams);

    let dateRange: { from: Date; to: Date } | undefined;
    if (validatedParams.dateFrom || validatedParams.dateTo) {
      dateRange = {
        from: validatedParams.dateFrom ? new Date(validatedParams.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: validatedParams.dateTo ? new Date(validatedParams.dateTo) : new Date()
      };
    }

    // Get OCR statistics
    const statistics = await ocrService.getOCRStatistics(
      session.user.organizationId,
      dateRange
    );

    return NextResponse.json({
      success: true,
      statistics,
      dateRange
    });

  } catch (error) {
    console.error('Failed to get OCR statistics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    }, { status: 500 });
  }
}