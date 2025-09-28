import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/authOptions';
import { documentService } from '@/lib/services/document-service';

interface RouteParams {
  params: {
    id: string;
  };
}

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

    // Generate secure download URL
    const secureDownloadUrl = await documentService.getSecureDownloadUrl(
      id,
      session.user.organizationId,
      session.user.id
    );

    // Check if this is a direct download request or URL generation
    const { searchParams } = new URL(request.url);
    const direct = searchParams.get('direct') === 'true';

    if (direct) {
      // Redirect to the secure URL for direct download
      return NextResponse.redirect(secureDownloadUrl);
    } else {
      // Return the secure URL for client-side handling
      return NextResponse.json({
        success: true,
        downloadUrl: secureDownloadUrl,
        expiresIn: 30 * 60 // 30 minutes in seconds
      });
    }

  } catch (error) {
    console.error('Failed to generate download URL:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate download URL'
    }, { status: 500 });
  }
}