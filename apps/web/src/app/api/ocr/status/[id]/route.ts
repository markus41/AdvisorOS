import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ocrService } from '@/server/services/ocr.service';
import { db } from "../../../../../server/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job from database
    const dbJob = await db.ocrJob.findFirst({
      where: {
        id: jobId,
        organizationId: session.user.organizationId,
      },
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
        result: true,
      },
    });

    if (!dbJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get live status from OCR service if job is still processing
    let liveStatus = null;
    if (dbJob.status === 'processing' || dbJob.status === 'pending') {
      liveStatus = ocrService.getJobStatus(jobId);
    }

    // Build response
    const response = {
      id: dbJob.id,
      status: liveStatus?.status || dbJob.status,
      progress: liveStatus?.progress || 100,
      fileName: dbJob.fileName,
      fileSize: dbJob.fileSize,
      mimeType: dbJob.mimeType,
      priority: dbJob.priority || 'normal',
      createdAt: dbJob.createdAt,
      updatedAt: dbJob.updatedAt,
      completedAt: liveStatus?.completedAt || dbJob.completedAt,
      error: liveStatus?.error || dbJob.error,
      client: dbJob.client,
      uploadedBy: dbJob.user,
      result: null as any,
    };

    // Include result if job is completed
    if (dbJob.status === 'completed' && dbJob.result) {
      response.result = {
        documentType: dbJob.result.documentType,
        confidence: dbJob.result.confidence,
        extractedData: dbJob.result.extractedData,
        validationErrors: dbJob.result.validationErrors,
        tables: dbJob.result.tables,
        fullText: dbJob.result.fullText,
        insights: dbJob.result.insights,
        suggestedActions: dbJob.result.suggestedActions,
        processingTime: dbJob.result.processingTime,
        cost: dbJob.result.cost,
      };
    }

    // If job is completed but we don't have results in DB, try to get from service
    if (dbJob.status === 'completed' && !dbJob.result && liveStatus?.result) {
      response.result = liveStatus.result;
    }

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error: any) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if job exists and belongs to organization
    const dbJob = await db.ocrJob.findFirst({
      where: {
        id: jobId,
        organizationId: session.user.organizationId,
      },
    });

    if (!dbJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Cannot cancel completed jobs
    if (dbJob.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed job' },
        { status: 400 }
      );
    }

    // Try to cancel the job in the OCR service if it's still processing
    if (dbJob.status === 'processing') {
      try {
        // Note: OCR service doesn't have a cancel method in our current implementation
        // This would need to be added if cancellation is required
        console.log(`Attempting to cancel processing job ${jobId}`);
      } catch (error) {
        console.warn('Failed to cancel job in OCR service:', error);
      }
    }

    // Update job status in database
    await db.ocrJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        error: 'Job cancelled by user',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
    });

  } catch (error: any) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { priority, notifyOnComplete } = body;

    // Check if job exists and belongs to organization
    const dbJob = await db.ocrJob.findFirst({
      where: {
        id: jobId,
        organizationId: session.user.organizationId,
      },
    });

    if (!dbJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Cannot modify completed jobs
    if (dbJob.status === 'completed' || dbJob.status === 'failed') {
      return NextResponse.json(
        { error: 'Cannot modify completed or failed job' },
        { status: 400 }
      );
    }

    // Update job settings
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (priority !== undefined) {
      if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }

    if (notifyOnComplete !== undefined) {
      updateData.notifyOnComplete = notifyOnComplete;
    }

    await db.ocrJob.update({
      where: { id: jobId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}