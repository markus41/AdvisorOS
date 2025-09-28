import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/client-service'
import { updateClientSchema } from '@/types/client'
import { z } from 'zod'

// GET /api/clients/[id] - Get single client with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('includeRelations') !== 'false'

    const client = await ClientService.getClientById(
      params.id,
      session.user.organizationId,
      includeRelations
    )

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateClientSchema.parse({
      ...body,
      id: params.id
    })

    const client = await ClientService.updateClient(
      params.id,
      validatedData,
      session.user.organizationId,
      session.user.id
    )

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'Client not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }

      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Soft delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await ClientService.deleteClient(
      params.id,
      session.user.organizationId,
      session.user.id
    )

    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting client:', error)

    if (error instanceof Error) {
      if (error.message === 'Client not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }

      if (error.message.includes('Cannot delete client')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}