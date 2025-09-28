import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/client-service'
import {
  clientFilterSchema,
  exportClientSchema
} from '@/types/client'
import { z } from 'zod'

// GET /api/clients/export - Export to CSV
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

    // Parse filters
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

    // Parse export options
    const exportOptions = exportClientSchema.parse({
      format: searchParams.get('format') || 'csv',
      fields: searchParams.getAll('fields').length > 0
        ? searchParams.getAll('fields')
        : undefined,
      filters,
      includeArchived: searchParams.get('includeArchived') === 'true'
    })

    const csvData = await ClientService.exportToCSV(
      session.user.organizationId,
      exportOptions.filters || {},
      exportOptions.fields
    )

    const fileName = `clients-export-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      }
    })
  } catch (error) {
    console.error('Error exporting clients:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid export parameters',
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