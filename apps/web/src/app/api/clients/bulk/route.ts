import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/client-service'
import { bulkClientActionSchema } from '@/types/client'
import { z } from 'zod'

// POST /api/clients/bulk - Bulk operations (update, delete)
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
    const validatedData = bulkClientActionSchema.parse(body)

    const result = await ClientService.bulkOperation(
      validatedData,
      session.user.organizationId,
      session.user.id
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error performing bulk operation:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
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