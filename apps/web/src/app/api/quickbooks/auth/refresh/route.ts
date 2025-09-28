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

    // Create OAuth service
    const oauthService = createQuickBooksOAuthService();

    // Check if organization has existing connection
    const hasConnection = await oauthService.hasValidConnection(
      session.user.organizationId
    );

    if (!hasConnection) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Refresh tokens
    const tokens = await oauthService.refreshTokens(session.user.organizationId);

    return NextResponse.json({
      success: true,
      expiresAt: tokens.expiresAt.toISOString(),
      message: 'QuickBooks tokens refreshed successfully'
    });

  } catch (error) {
    console.error('QuickBooks token refresh error:', error);

    // Check if the error is due to invalid refresh token
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return NextResponse.json(
        {
          error: 'Invalid refresh token',
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Please reconnect your QuickBooks account'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to refresh QuickBooks tokens' },
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

    // Create OAuth service
    const oauthService = createQuickBooksOAuthService();

    // Get token info without refreshing
    const tokenInfo = await oauthService.getTokenInfo(session.user.organizationId);

    if (!tokenInfo) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      realmId: tokenInfo.realmId,
      expiresAt: tokenInfo.expiresAt.toISOString(),
      isActive: tokenInfo.isActive,
      lastSyncAt: tokenInfo.lastSyncAt?.toISOString() || null,
      needsRefresh: tokenInfo.expiresAt.getTime() - Date.now() < 5 * 60 * 1000 // expires in 5 minutes
    });

  } catch (error) {
    console.error('QuickBooks token info error:', error);
    return NextResponse.json(
      { error: 'Failed to get QuickBooks token information' },
      { status: 500 }
    );
  }
}