import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createQuickBooksOAuthService } from '@/lib/integrations/quickbooks/oauth';
import { prisma } from '@/packages/database';

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

    // Revoke access and cleanup tokens
    await oauthService.revokeAccess(session.user.organizationId);

    // Additional cleanup: remove any sync-related data
    await Promise.allSettled([
      // Clear sync history
      prisma.quickBooksSync.updateMany({
        where: { organizationId: session.user.organizationId },
        data: { deletedAt: new Date() }
      }),

      // Clear webhook events
      prisma.quickBooksWebhookEvent.updateMany({
        where: { organizationId: session.user.organizationId },
        data: { deletedAt: new Date() }
      }),

      // Clear QuickBooks IDs from clients (optional - you might want to keep these)
      // prisma.client.updateMany({
      //   where: { organizationId: session.user.organizationId },
      //   data: { quickbooksId: null }
      // }),

      // Log the disconnection
      prisma.auditLog.create({
        data: {
          action: 'disconnect',
          entityType: 'quickbooks_integration',
          entityId: session.user.organizationId,
          metadata: {
            action: 'quickbooks_disconnect',
            timestamp: new Date().toISOString()
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
      await prisma.quickBooksToken.updateMany({
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

    // Get connection status for disconnect confirmation
    const oauthService = createQuickBooksOAuthService();
    const hasConnection = await oauthService.hasValidConnection(
      session.user.organizationId
    );

    if (!hasConnection) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Get additional info about what will be affected
    const [syncCount, webhookCount] = await Promise.all([
      prisma.quickBooksSync.count({
        where: {
          organizationId: session.user.organizationId,
          deletedAt: null
        }
      }),
      prisma.quickBooksWebhookEvent.count({
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