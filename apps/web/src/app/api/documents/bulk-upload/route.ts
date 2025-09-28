import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import { documentService } from '@/lib/services/document-service';
import { z } from 'zod';

const bulkUploadSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  defaultCategory: z.string().optional(),
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
    const files: File[] = [];

    // Extract files from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('files[') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Limit bulk upload to 20 files
    if (files.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 files allowed in bulk upload' }, { status: 413 });
    }

    // Parse metadata
    const metadata = {
      clientId: formData.get('clientId') as string,
      defaultCategory: formData.get('defaultCategory') as string || undefined,
      autoCategorizationEnabled: formData.get('autoCategorizationEnabled') !== 'false',
      autoOCREnabled: formData.get('autoOCREnabled') !== 'false'
    };

    // Validate metadata
    const validatedMetadata = bulkUploadSchema.parse(metadata);

    // Validate each file
    const maxSize = 25 * 1024 * 1024; // 25MB per file
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

    const invalidFiles: Array<{ name: string; reason: string }> = [];

    for (const file of files) {
      if (file.size > maxSize) {
        invalidFiles.push({ name: file.name, reason: 'File size exceeds 25MB limit' });
      } else if (!allowedTypes.includes(file.type)) {
        invalidFiles.push({ name: file.name, reason: `File type ${file.type} is not supported` });
      }
    }

    if (invalidFiles.length > 0) {
      return NextResponse.json({
        error: 'Some files are invalid',
        invalidFiles
      }, { status: 400 });
    }

    // Convert files to buffer format
    const fileData = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        fileBuffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type
      }))
    );

    // Process bulk upload with progress tracking
    const result = await documentService.bulkUploadDocuments({
      files: fileData,
      organizationId: session.user.organizationId,
      uploadedBy: session.user.id,
      ...validatedMetadata
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: files.length,
        successful: result.successful.length,
        failed: result.failed.length
      },
      documents: result.successful,
      errors: result.failed,
      progress: result.progress
    });

  } catch (error) {
    console.error('Bulk upload failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Bulk upload failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      maxFiles: 20,
      maxFileSize: 25 * 1024 * 1024, // 25MB per file
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'image/bmp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
    });

  } catch (error) {
    console.error('Failed to get bulk upload requirements:', error);
    return NextResponse.json({
      error: 'Failed to get bulk upload requirements'
    }, { status: 500 });
  }
}