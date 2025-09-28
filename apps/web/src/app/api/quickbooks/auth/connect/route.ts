import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createQuickBooksOAuthService } from '@/lib/integrations/quickbooks/oauth';

export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { redirectUrl } = body;

    // Create OAuth service
    const oauthService = createQuickBooksOAuthService();

    // Generate authorization URL
    const { url, state } = oauthService.generateAuthUrl(
      session.user.organizationId,
      redirectUrl
    );

    return NextResponse.json({
      authUrl: url,
      state,
      message: 'Authorization URL generated successfully'
    });

  } catch (error) {
    console.error('QuickBooks connect error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QuickBooks authorization URL' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check current connection status
    const oauthService = createQuickBooksOAuthService();
    const hasConnection = await oauthService.hasValidConnection(
      session.user.organizationId
    );

    return NextResponse.json({
      connected: hasConnection,
      organizationId: session.user.organizationId
    });

  } catch (error) {
    console.error('QuickBooks connection status error:', error);
    return NextResponse.json(
      { error: 'Failed to check QuickBooks connection status' },
      { status: 500 }
    );
  }
}