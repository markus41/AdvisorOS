import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncManager } from '@/lib/integrations/quickbooks/sync-manager';

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const entityType = searchParams.get('entityType');
    const status = searchParams.get('status');

    const organizationId = session.user.organizationId;

    // Get sync history with optional filters
    let syncHistory = await syncManager.getSyncHistory(organizationId, Math.min(limit, 100));

    // Apply client-side filters (for simplicity)
    if (entityType && entityType !== 'all') {
      syncHistory = syncHistory.filter(sync => sync.entityType === entityType);
    }

    if (status && status !== 'all') {
      syncHistory = syncHistory.filter(sync => sync.status === status);
    }

    // Calculate summary statistics
    const summary = {
      total: syncHistory.length,
      completed: syncHistory.filter(s => s.status === 'completed').length,
      failed: syncHistory.filter(s => s.status === 'failed').length,
      inProgress: syncHistory.filter(s => s.status === 'in_progress').length,
      totalRecordsProcessed: syncHistory.reduce((sum, s) => sum + (s.recordsProcessed || 0), 0),
      totalRecordsSuccess: syncHistory.reduce((sum, s) => sum + (s.recordsSuccess || 0), 0),
      totalRecordsFailed: syncHistory.reduce((sum, s) => sum + (s.recordsFailed || 0), 0)
    };

    return NextResponse.json({
      history: syncHistory,
      summary,
      pagination: {
        limit,
        hasMore: syncHistory.length === limit
      }
    });

  } catch (error) {
    console.error('Sync history error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync history' },
      { status: 500 }
    );
  }
}