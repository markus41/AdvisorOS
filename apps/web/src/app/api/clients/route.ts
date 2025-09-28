import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/client-service'
import {
  clientFilterSchema,
  clientSortSchema,
  clientPaginationSchema,
  createClientSchema,
  ClientStatus
} from '@/types/client'
import { z } from 'zod'

// GET /api/clients - List clients with pagination, sorting, filtering
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
    const filters = clientFilterSchema.parse({
      search: searchParams.get('search') || undefined,
      status: searchParams.getAll('status').length > 0
        ? searchParams.getAll('status')
        : undefined,
      businessType: searchParams.getAll('businessType').length > 0
        ? searchParams.getAll('businessType')
        : undefined,
      riskLevel: searchParams.getAll('riskLevel').length > 0
        ? searchParams.getAll('riskLevel')
        : undefined,
      services: searchParams.getAll('services').length > 0
        ? searchParams.getAll('services')
        : undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      hasQuickBooks: searchParams.get('hasQuickBooks')
        ? searchParams.get('hasQuickBooks') === 'true'
        : undefined,
      annualRevenueMin: searchParams.get('annualRevenueMin')
        ? Number(searchParams.get('annualRevenueMin'))
        : undefined,
      annualRevenueMax: searchParams.get('annualRevenueMax')
        ? Number(searchParams.get('annualRevenueMax'))
        : undefined,
      createdAfter: searchParams.get('createdAfter')
        ? new Date(searchParams.get('createdAfter')!)
        : undefined,
      createdBefore: searchParams.get('createdBefore')
        ? new Date(searchParams.get('createdBefore')!)
        : undefined,
    })

    const sort = clientSortSchema.parse({
      field: searchParams.get('sortField') || 'businessName',
      direction: searchParams.get('sortDirection') || 'asc',
    })

    const pagination = clientPaginationSchema.parse({
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
    })

    const result = await ClientService.getClients(
      session.user.organizationId,
      filters,
      sort,
      pagination
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching clients:', error)

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

// POST /api/clients - Create new client
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

    // Validate request body
    const validatedData = createClientSchema.parse(body)

    const client = await ClientService.createClient(
      validatedData,
      session.user.organizationId,
      session.user.id
    )

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}