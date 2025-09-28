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

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    switch (action) {
      case 'pause':
        syncManager.pauseSync(organizationId);
        return NextResponse.json({
          success: true,
          message: 'Sync paused successfully'
        });

      case 'resume':
        syncManager.resumeSync(organizationId);
        return NextResponse.json({
          success: true,
          message: 'Sync resumed successfully'
        });

      case 'cancel':
        await syncManager.cancelSync(organizationId);
        return NextResponse.json({
          success: true,
          message: 'Sync cancelled successfully'
        });

      case 'schedule':
        const { configuration } = body;
        await syncManager.scheduleSyncForOrganization(organizationId, configuration);
        return NextResponse.json({
          success: true,
          message: 'Sync scheduled successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be one of: pause, resume, cancel, schedule' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sync control error:', error);
    return NextResponse.json(
      { error: 'Failed to control sync' },
      { status: 500 }
    );
  }
}