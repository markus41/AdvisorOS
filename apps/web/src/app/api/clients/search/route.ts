import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/client-service'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(50).optional().default(10)
})

// GET /api/clients/search - Search clients with full-text search
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

    const { q, limit } = searchSchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10
    })

    const clients = await ClientService.searchClients(
      session.user.organizationId,
      q,
      limit
    )

    return NextResponse.json({
      query: q,
      results: clients,
      count: clients.length
    })
  } catch (error) {
    console.error('Error searching clients:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
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