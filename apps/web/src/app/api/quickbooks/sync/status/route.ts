import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncManager } from '@/lib/integrations/quickbooks/sync-manager';
import { createQuickBooksOAuthService } from '@/lib/integrations/quickbooks/oauth';

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

    const organizationId = session.user.organizationId;

    // Check QuickBooks connection status
    const oauthService = createQuickBooksOAuthService();
    const hasConnection = await oauthService.hasValidConnection(organizationId);

    if (!hasConnection) {
      return NextResponse.json({
        connected: false,
        error: 'No valid QuickBooks connection found'
      });
    }

    // Get token information
    const tokenInfo = await oauthService.getTokenInfo(organizationId);

    // Get current sync status
    const syncStatus = syncManager.getSyncStatus(organizationId);

    // Get recent sync history
    const syncHistory = await syncManager.getSyncHistory(organizationId, 5);

    return NextResponse.json({
      connected: true,
      connection: {
        realmId: tokenInfo?.realmId,
        expiresAt: tokenInfo?.expiresAt?.toISOString(),
        lastSyncAt: tokenInfo?.lastSyncAt?.toISOString(),
        needsRefresh: tokenInfo?.expiresAt && tokenInfo.expiresAt.getTime() - Date.now() < 5 * 60 * 1000
      },
      currentSync: syncStatus,
      recentSyncs: syncHistory
    });

  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}