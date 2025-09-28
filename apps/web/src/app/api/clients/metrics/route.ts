import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/client-service'
import { z } from 'zod'

const metricsQuerySchema = z.object({
  clientId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// GET /api/clients/metrics - Get client financial metrics
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

    // Parse and validate query parameters
    const queryData = metricsQuerySchema.parse({
      clientId: searchParams.get('clientId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    })

    const dateRange = queryData.startDate && queryData.endDate ? {
      start: new Date(queryData.startDate),
      end: new Date(queryData.endDate)
    } : undefined

    const metrics = await ClientService.getClientMetrics(
      session.user.organizationId,
      queryData.clientId,
      dateRange
    )

    return NextResponse.json(metrics, { status: 200 })
  } catch (error) {
    console.error('Error fetching client metrics:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
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