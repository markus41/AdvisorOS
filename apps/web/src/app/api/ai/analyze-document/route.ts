import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { documentIntelligenceService } from '@/lib/ai/document-intelligence';
import { db } from "../../../../server/db";

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

    // Check if AI features are enabled
    if (!documentIntelligenceService.isReady()) {
      return NextResponse.json(
        { error: 'AI document analysis is not available' },
        { status: 503 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;

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
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
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
    };

    // Analyze document
    const analysis = await documentIntelligenceService.analyzeDocument(
      buffer,
      metadata
    );

    // Store analysis results in database (optional)
    try {
      await db.documentAnalysis.create({
        data: {
          id: analysis.id,
          organizationId: session.user.organizationId,
          clientId: clientId || null,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          category: analysis.category.category,
          subcategory: analysis.category.subcategory,
          confidence: analysis.category.confidence,
          ocrText: analysis.ocrResult.text,
          extractedData: analysis.extractedData,
          anomalies: analysis.anomalies,
          processingTime: analysis.processingTime,
          ocrCost: analysis.costInfo.ocrCost,
          aiCost: analysis.costInfo.aiCost,
          totalCost: analysis.costInfo.totalCost,
          uploadedBy: session.user.id,
          createdAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error('Failed to store analysis results:', dbError);
      // Continue without failing the request
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });

  } catch (error: any) {
    console.error('Document analysis error:', error);

    // Handle specific error types
    if (error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: 'AI service is currently busy. Please try again later.' },
        { status: 429 }
      );
    }

    if (error.message.includes('Cost limit exceeded')) {
      return NextResponse.json(
        { error: 'Monthly AI usage limit reached for your organization.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'Document analysis failed. Please try again.' },
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get analysis history
    const analyses = await db.documentAnalysis.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        fileName: true,
        category: true,
        subcategory: true,
        confidence: true,
        processingTime: true,
        totalCost: true,
        createdAt: true,
        uploadedBy: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const total = await db.documentAnalysis.count({
      where: {
        organizationId: session.user.organizationId,
        ...(clientId ? { clientId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        analyses,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching document analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document analyses' },
      { status: 500 }
    );
  }
}