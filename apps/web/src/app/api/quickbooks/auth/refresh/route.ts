import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { quickbooksService } from '@/server/services/quickbooks.service';
import { db } from "../../../../../server/db";

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

    // Check if organization has existing connection
    const existingToken = await db.quickBooksToken.findUnique({
      where: { organizationId: session.user.organizationId, isActive: true }
    });

    if (!existingToken) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Refresh tokens
    const tokens = await quickbooksService.refreshTokens(session.user.organizationId);

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'update',
        entityType: 'quickbooks_token',
        entityId: existingToken.id,
        newValues: { tokenRefreshed: true },
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'manual_refresh' }
      }
    });

    return NextResponse.json({
      success: true,
      expiresAt: tokens.expiresAt.toISOString(),
      message: 'QuickBooks tokens refreshed successfully'
    });

  } catch (error) {
    console.error('QuickBooks token refresh error:', error);

    // Check if the error is due to invalid refresh token
    if (error instanceof Error && error.message.includes('refresh')) {
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

    // Get token info without refreshing
    const tokenInfo = await db.quickBooksToken.findUnique({
      where: {
        organizationId: session.user.organizationId,
        isActive: true
      },
      select: {
        realmId: true,
        expiresAt: true,
        isActive: true,
        lastSyncAt: true
      }
    });

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
