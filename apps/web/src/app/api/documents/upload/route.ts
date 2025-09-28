import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { documentService } from '@/lib/services/document-service';
import { z } from 'zod';

const uploadSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  isConfidential: z.boolean().optional(),
  autoCategorizationEnabled: z.boolean().optional(),
  autoOCREnabled: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 413 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: `File type ${file.type} is not supported. Allowed types: PDF, JPEG, PNG, TIFF, BMP, DOCX, XLSX, CSV`
      }, { status: 415 });
    }

    // Parse metadata from form data
    const metadata = {
      clientId: formData.get('clientId') as string,
      category: formData.get('category') as string || undefined,
      subcategory: formData.get('subcategory') as string || undefined,
      year: formData.get('year') ? parseInt(formData.get('year') as string) : undefined,
      quarter: formData.get('quarter') ? parseInt(formData.get('quarter') as string) : undefined,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
      description: formData.get('description') as string || undefined,
      isConfidential: formData.get('isConfidential') === 'true',
      autoCategorizationEnabled: formData.get('autoCategorizationEnabled') !== 'false',
      autoOCREnabled: formData.get('autoOCREnabled') !== 'false'
    };

    // Validate metadata
    const validatedMetadata = uploadSchema.parse(metadata);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload document
    const result = await documentService.uploadDocument({
      fileName: file.name,
      fileBuffer,
      mimeType: file.type,
      organizationId: session.user.organizationId,
      uploadedBy: session.user.id,
      ...validatedMetadata
    });

    return NextResponse.json({
      success: true,
      document: result.document,
      secureDownloadUrl: result.secureDownloadUrl
    });

  } catch (error) {
    console.error('Document upload failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}

// Get upload requirements and limits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      maxFileSize: 25 * 1024 * 1024, // 25MB
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'image/bmp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ],
      supportedCategories: [
        'tax_return',
        'financial_statement',
        'invoice',
        'receipt',
        'bank_statement',
        'w2',
        '1099',
        'general'
      ],
      autoCategorizationEnabled: true,
      autoOCREnabled: true
    });

  } catch (error) {
    console.error('Failed to get upload requirements:', error);
    return NextResponse.json({
      error: 'Failed to get upload requirements'
    }, { status: 500 });
  }
}