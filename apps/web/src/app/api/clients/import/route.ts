import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/client-service'

// POST /api/clients/import - Import from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const skipDuplicates = formData.get('skipDuplicates') === 'true'
    const updateExisting = formData.get('updateExisting') === 'true'
    const mappingString = formData.get('mapping') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    let mapping: Record<string, string> = {}
    if (mappingString) {
      try {
        mapping = JSON.parse(mappingString)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid mapping format' },
          { status: 400 }
        )
      }
    }

    const result = await ClientService.importFromCSV(
      file,
      session.user.organizationId,
      session.user.id,
      {
        skipDuplicates,
        updateExisting,
        mapping
      }
    )

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Error importing clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}