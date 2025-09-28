import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncManager } from '@/lib/integrations/quickbooks/sync-manager';

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
    const {
      syncType = 'incremental',
      selectedEntities = [],
      force = false
    } = body;

    const organizationId = session.user.organizationId;

    // Validate sync type
    if (!['full', 'incremental'].includes(syncType)) {
      return NextResponse.json(
        { error: 'Invalid sync type. Must be "full" or "incremental"' },
        { status: 400 }
      );
    }

    // Check if sync is already in progress (unless forced)
    if (!force) {
      const currentSync = syncManager.getSyncStatus(organizationId);
      if (currentSync && currentSync.status === 'running') {
        return NextResponse.json(
          { error: 'Sync already in progress' },
          { status: 409 }
        );
      }
    }

    // Trigger the sync
    const syncId = await syncManager.triggerManualSync(
      organizationId,
      syncType,
      selectedEntities.length > 0 ? selectedEntities : undefined,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      syncId,
      syncType,
      selectedEntities: selectedEntities.length > 0 ? selectedEntities : 'all',
      message: 'Sync triggered successfully'
    });

  } catch (error) {
    console.error('Sync trigger error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already in progress')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }

      if (error.message.includes('No valid QuickBooks connection')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}