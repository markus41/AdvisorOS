import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QuickBooksService } from '@/lib/services/quickbooks-service'
import { z } from 'zod'

const syncRequestSchema = z.object({
  clientId: z.string().cuid(),
  syncType: z.enum(['full', 'incremental']).default('incremental'),
  forceSync: z.boolean().default(false),
})

// POST /api/clients/sync-quickbooks - Trigger QuickBooks sync for client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientId, syncType, forceSync } = syncRequestSchema.parse(body)

    // Check if QuickBooks is connected
    const qbStatus = await QuickBooksService.getConnectionStatus(
      session.user.organizationId
    )

    if (!qbStatus.isConnected) {
      return NextResponse.json(
        {
          error: 'QuickBooks not connected',
          message: 'Please connect QuickBooks before syncing client data'
        },
        { status: 400 }
      )
    }

    if (qbStatus.tokenExpired) {
      return NextResponse.json(
        {
          error: 'QuickBooks token expired',
          message: 'Please reconnect QuickBooks to sync client data'
        },
        { status: 401 }
      )
    }

    // Start the sync process
    const syncResult = await QuickBooksService.syncClient(
      clientId,
      session.user.organizationId,
      session.user.id,
      {
        syncType,
        forceSync
      }
    )

    return NextResponse.json(syncResult, { status: 200 })
  } catch (error) {
    console.error('Error syncing client with QuickBooks:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/clients/sync-quickbooks - Get sync status for all clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (clientId) {
      // Get status for specific client
      const status = await QuickBooksService.getClientSyncStatus(
        clientId,
        session.user.organizationId
      )
      return NextResponse.json(status, { status: 200 })
    } else {
      // Get status for all clients
      const statuses = await QuickBooksService.getAllClientSyncStatuses(
        session.user.organizationId
      )
      return NextResponse.json(statuses, { status: 200 })
    }
  } catch (error) {
    console.error('Error getting QuickBooks sync status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}