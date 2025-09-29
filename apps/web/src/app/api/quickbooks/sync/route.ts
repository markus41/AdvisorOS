import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { quickbooksService } from '@/server/services/quickbooks.service';
import { prisma as db } from "@/server/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { syncType, entityType } = await request.json();

    // Validate sync type
    const validSyncTypes = ['full', 'incremental', 'manual'];
    if (!validSyncTypes.includes(syncType)) {
      return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 });
    }

    // Check if QuickBooks is connected
    const token = await db.quickBooksToken.findUnique({
      where: { organizationId: session.user.organizationId, isActive: true }
    });

    if (!token) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    // Prevent concurrent syncs
    const activeSyncs = await db.quickBooksSync.count({
      where: {
        organizationId: session.user.organizationId,
        status: { in: ['pending', 'in_progress'] }
      }
    });

    if (activeSyncs > 0) {
      return NextResponse.json(
        { error: 'Sync already in progress' },
        { status: 409 }
      );
    }

    let result;

    // Execute sync based on entity type
    switch (entityType) {
      case 'all':
        result = await quickbooksService.performFullSync(session.user.organizationId);
        break;
      case 'company':
        result = await quickbooksService.syncCompanyInfo(session.user.organizationId);
        break;
      case 'customers':
        result = await quickbooksService.syncCustomers(session.user.organizationId);
        break;
      case 'vendors':
        result = await quickbooksService.syncVendors(session.user.organizationId);
        break;
      case 'accounts':
        result = await quickbooksService.syncChartOfAccounts(session.user.organizationId);
        break;
      case 'invoices':
        result = await quickbooksService.syncInvoices(session.user.organizationId);
        break;
      case 'bills':
        result = await quickbooksService.syncBills(session.user.organizationId);
        break;
      case 'transactions':
        result = await quickbooksService.syncBankTransactions(session.user.organizationId);
        break;
      case 'reports':
        // Sync both P&L and Balance Sheet
        const plResult = await quickbooksService.syncProfitAndLoss(session.user.organizationId);
        const bsResult = await quickbooksService.syncBalanceSheet(session.user.organizationId);
        result = { profitAndLoss: plResult, balanceSheet: bsResult };
        break;
      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Log the sync action
    await db.auditLog.create({
      data: {
        action: 'sync',
        entityType: 'quickbooks_data',
        entityId: session.user.organizationId,
        newValues: { syncType, entityType, triggeredBy: 'manual' },
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'manual_sync_api' }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${entityType} sync completed successfully`,
      data: result
    });

  } catch (error) {
    console.error('QuickBooks sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get sync history
    const syncs = await db.quickBooksSync.findMany({
      where: {
        organizationId: session.user.organizationId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        syncType: true,
        entityType: true,
        status: true,
        startedAt: true,
        completedAt: true,
        recordsTotal: true,
        recordsProcessed: true,
        recordsSuccess: true,
        recordsFailed: true,
        errorMessage: true
      }
    });

    // Get current sync status
    const currentSync = await db.quickBooksSync.findFirst({
      where: {
        organizationId: session.user.organizationId,
        status: { in: ['pending', 'in_progress'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get last successful sync
    const lastSync = await db.quickBooksToken.findUnique({
      where: { organizationId: session.user.organizationId },
      select: { lastSyncAt: true }
    });

    return NextResponse.json({
      syncs,
      currentSync,
      lastSyncAt: lastSync?.lastSyncAt?.toISOString() || null,
      pagination: {
        limit,
        offset,
        hasMore: syncs.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching sync history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}