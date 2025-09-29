import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma as db } from "@/server/db"

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

    const existingToken = await db.quickBooksToken.findUnique({
      where: { organizationId: session.user.organizationId, isActive: true }
    });

    if (!existingToken) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Revoke access tokens with QuickBooks
    try {
      const revokeResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          token: existingToken.refreshToken
        })
      });

      if (!revokeResponse.ok) {
        console.warn('Failed to revoke QuickBooks tokens remotely, proceeding with local cleanup');
      }
    } catch (error) {
      console.warn('Error revoking QuickBooks tokens:', error);
    }

    // Clean up local data
    await Promise.allSettled([
      // Deactivate tokens
      db.quickBooksToken.update({
        where: { id: existingToken.id },
        data: {
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      }),

      // Mark sync history as deleted
      db.quickBooksSync.updateMany({
        where: { organizationId: session.user.organizationId },
        data: { deletedAt: new Date() }
      }),

      // Mark webhook events as deleted
      db.quickBooksWebhookEvent.updateMany({
        where: { organizationId: session.user.organizationId },
        data: { deletedAt: new Date() }
      }),

      // Log the disconnection
      db.auditLog.create({
        data: {
          action: 'disconnect',
          entityType: 'quickbooks_integration',
          entityId: session.user.organizationId,
          metadata: {
            action: 'quickbooks_disconnect',
            timestamp: new Date().toISOString(),
            tokenRevoked: true
          },
          organizationId: session.user.organizationId,
          userId: session.user.id
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'QuickBooks connection removed successfully'
    });

  } catch (error) {
    console.error('QuickBooks disconnect error:', error);

    // Even if revocation fails, we should still cleanup local data
    try {
      await db.quickBooksToken.updateMany({
        where: { organizationId: session?.user?.organizationId },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });
    } catch (cleanupError) {
      console.error('Failed to cleanup local tokens:', cleanupError);
    }

    return NextResponse.json(
      { error: 'Failed to disconnect QuickBooks integration' },
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

    // Check if connection exists
    const existingToken = await db.quickBooksToken.findUnique({
      where: { organizationId: session.user.organizationId, isActive: true }
    });

    if (!existingToken) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Get additional info about what will be affected
    const [syncCount, webhookCount] = await Promise.all([
      db.quickBooksSync.count({
        where: {
          organizationId: session.user.organizationId,
          deletedAt: null
        }
      }),
      db.quickBooksWebhookEvent.count({
        where: {
          organizationId: session.user.organizationId,
          deletedAt: null
        }
      })
    ]);

    return NextResponse.json({
      canDisconnect: true,
      syncHistoryCount: syncCount,
      webhookEventCount: webhookCount,
      realmId: existingToken.realmId,
      lastSyncAt: existingToken.lastSyncAt?.toISOString() || null,
      warning: 'Disconnecting will stop all QuickBooks synchronization and remove stored tokens.'
    });

  } catch (error) {
    console.error('QuickBooks disconnect info error:', error);
    return NextResponse.json(
      { error: 'Failed to get disconnect information' },
      { status: 500 }
    );
  }
}
