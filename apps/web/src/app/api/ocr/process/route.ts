import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ocrService } from '@/server/services/ocr.service';
import { prisma as db } from "@/server/db"

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if OCR service is ready
    if (!ocrService.isReady()) {
      return NextResponse.json(
        { error: 'OCR service is not available' },
        { status: 503 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const priority = formData.get('priority') as string || 'normal';
    const notifyOnComplete = formData.get('notifyOnComplete') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported formats: PDF, JPEG, PNG, TIFF, BMP, WebP' },
        { status: 400 }
      );
    }

    // 25MB limit for documents
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      );
    }

    // Check organization's processing limits
    const usage = await checkProcessingLimits(session.user.organizationId);
    if (!usage.canProcess) {
      return NextResponse.json(
        { error: usage.message },
        { status: 429 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Prepare metadata
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      organizationId: session.user.organizationId,
      uploadedBy: session.user.id,
      clientId: clientId || undefined,
    };

    // Start processing
    const job = await ocrService.processDocument(buffer, metadata);

    // Store job in database for tracking
    await db.ocrJob.create({
      data: {
        id: job.id,
        organizationId: session.user.organizationId,
        clientId: clientId || null,
        userId: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: job.status,
        priority,
        notifyOnComplete,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        estimatedCompletionTime: estimateCompletionTime(file.size, file.type),
        message: 'Document processing started successfully',
      },
    });

  } catch (error: any) {
    console.error('OCR processing error:', error);

    // Handle specific error types
    if (error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: 'AI service is currently busy. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    if (error.message.includes('Cost limit exceeded')) {
      return NextResponse.json(
        { error: 'Monthly OCR processing limit reached for your organization.' },
        { status: 402 }
      );
    }

    if (error.message.includes('File too large')) {
      return NextResponse.json(
        { error: 'File is too large to process. Please reduce file size and try again.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: 'Document processing failed. Please try again.' },
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
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    // Get processing jobs
    const jobs = await db.ocrJob.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        result: {
          select: {
            id: true,
            documentType: true,
            confidence: true,
            processingTime: true,
            cost: true,
            validationErrors: true,
            insights: true,
            createdAt: true,
          },
        },
      },
    });

    // Get job statuses from OCR service for in-progress jobs
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        if (job.status === 'processing' || job.status === 'pending') {
          const liveStatus = ocrService.getJobStatus(job.id);
          if (liveStatus) {
            return {
              ...job,
              status: liveStatus.status,
              progress: liveStatus.progress,
              error: liveStatus.error,
            };
          }
        }
        return job;
      })
    );

    const total = await db.ocrJob.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        jobs: enrichedJobs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching OCR jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processing jobs' },
      { status: 500 }
    );
  }
}

/**
 * Check organization's processing limits
 */
async function checkProcessingLimits(organizationId: string): Promise<{
  canProcess: boolean;
  message?: string;
  currentUsage: number;
  limit: number;
}> {
  // Get current month's usage
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const usage = await db.ocrJob.aggregate({
    where: {
      organizationId,
      createdAt: {
        gte: startOfMonth,
      },
      status: {
        in: ['completed', 'processing'],
      },
    },
    _count: { id: true },
    _sum: { fileSize: true },
  });

  // Get organization's plan limits
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  const planLimits = organization?.subscription?.plan || {
    monthlyOcrLimit: 100, // Default limit
    maxFileSize: 25 * 1024 * 1024, // 25MB
  };

  const currentUsage = usage._count.id || 0;
  const limit = planLimits.monthlyOcrLimit || 100;

  if (currentUsage >= limit) {
    return {
      canProcess: false,
      message: `Monthly OCR processing limit reached (${currentUsage}/${limit}). Please upgrade your plan or wait until next month.`,
      currentUsage,
      limit,
    };
  }

  // Check for concurrent processing limit
  const concurrentJobs = await db.ocrJob.count({
    where: {
      organizationId,
      status: 'processing',
    },
  });

  const maxConcurrent = planLimits.maxConcurrentOcr || 3;
  if (concurrentJobs >= maxConcurrent) {
    return {
      canProcess: false,
      message: `Maximum concurrent processing limit reached (${concurrentJobs}/${maxConcurrent}). Please wait for current jobs to complete.`,
      currentUsage,
      limit,
    };
  }

  return {
    canProcess: true,
    currentUsage,
    limit,
  };
}

/**
 * Estimate completion time based on file characteristics
 */
function estimateCompletionTime(fileSize: number, mimeType: string): number {
  // Base processing time in milliseconds
  let baseTime = 5000; // 5 seconds

  // Adjust for file type
  if (mimeType === 'application/pdf') {
    baseTime *= 1.5; // PDFs take longer
  }

  // Adjust for file size (add 1 second per MB)
  const sizeInMB = fileSize / (1024 * 1024);
  const sizeAdjustment = sizeInMB * 1000;

  return baseTime + sizeAdjustment;
}