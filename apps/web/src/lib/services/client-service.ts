import { prisma } from '@cpa-platform/database'
import { Prisma } from '@prisma/client'
import {
  CreateClientInput,
  UpdateClientInput,
  ClientFilterInput,
  ClientSortInput,
  ClientPaginationInput,
  BulkClientActionInput,
  ClientListResponse,
  ClientStatsResponse,
  ClientWithRelations,
  BulkOperationResponse,
  ImportResult
} from '@/types/client'
import { auditLog } from './audit-service'
import { sendNotification } from './notification-service'
import { syncWithQuickBooks } from './quickbooks-service'
import Papa from 'papaparse'

export class ClientService {
  /**
   * Get paginated list of clients with filtering and sorting
   */
  static async getClients(
    organizationId: string,
    filters: ClientFilterInput = {},
    sort: ClientSortInput = { field: 'businessName', direction: 'asc' },
    pagination: ClientPaginationInput = { page: 1, limit: 10 }
  ): Promise<ClientListResponse> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ClientWhereInput = {
      organizationId,
      deletedAt: null,
    }

    // Apply filters
    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { legalName: { contains: filters.search, mode: 'insensitive' } },
        { primaryContactEmail: { contains: filters.search, mode: 'insensitive' } },
        { primaryContactName: { contains: filters.search, mode: 'insensitive' } },
        { taxId: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters.businessType && filters.businessType.length > 0) {
      where.businessType = { in: filters.businessType }
    }

    if (filters.riskLevel && filters.riskLevel.length > 0) {
      where.riskLevel = { in: filters.riskLevel }
    }

    if (filters.hasQuickBooks !== undefined) {
      if (filters.hasQuickBooks) {
        where.quickbooksId = { not: null }
      } else {
        where.quickbooksId = null
      }
    }

    if (filters.annualRevenueMin !== undefined || filters.annualRevenueMax !== undefined) {
      where.annualRevenue = {}
      if (filters.annualRevenueMin !== undefined) {
        where.annualRevenue.gte = filters.annualRevenueMin
      }
      if (filters.annualRevenueMax !== undefined) {
        where.annualRevenue.lte = filters.annualRevenueMax
      }
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {}
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore
      }
    }

    // Build orderBy
    const orderBy: Prisma.ClientOrderByWithRelationInput = {
      [sort.field]: sort.direction
    }

    // Execute queries
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              documents: true,
              engagements: true,
              invoices: true,
              notes: true,
            }
          }
        }
      }),
      prisma.client.count({ where })
    ])

    return {
      clients: clients as ClientWithRelations[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters,
      sort
    }
  }

  /**
   * Get client by ID with all relations
   */
  static async getClientById(
    id: string,
    organizationId: string,
    includeRelations = true
  ): Promise<ClientWithRelations | null> {
    const include = includeRelations ? {
      documents: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' as const },
        take: 10
      },
      notes: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      engagements: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' as const },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      invoices: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' as const },
        take: 10
      },
      _count: {
        select: {
          documents: true,
          engagements: true,
          invoices: true,
          notes: true,
        }
      }
    } : undefined

    return await prisma.client.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null
      },
      include
    }) as ClientWithRelations | null
  }

  /**
   * Create new client
   */
  static async createClient(
    data: CreateClientInput,
    organizationId: string,
    userId: string
  ): Promise<ClientWithRelations> {
    // Validate business name uniqueness within organization
    const existingClient = await prisma.client.findFirst({
      where: {
        organizationId,
        businessName: data.businessName,
        deletedAt: null
      }
    })

    if (existingClient) {
      throw new Error('A client with this business name already exists')
    }

    // Validate tax ID uniqueness if provided
    if (data.taxId) {
      const existingTaxId = await prisma.client.findFirst({
        where: {
          organizationId,
          taxId: data.taxId,
          deletedAt: null
        }
      })

      if (existingTaxId) {
        throw new Error('A client with this Tax ID already exists')
      }
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        ...data,
        organizationId,
        createdBy: userId,
        customFields: data.customFields || {},
      },
      include: {
        _count: {
          select: {
            documents: true,
            engagements: true,
            invoices: true,
            notes: true,
          }
        }
      }
    })

    // Audit log
    await auditLog({
      action: 'create',
      entityType: 'client',
      entityId: client.id,
      userId,
      organizationId,
      newValues: client,
      metadata: { clientName: client.businessName }
    })

    // Send notification for new client
    await sendNotification({
      type: 'client_created',
      organizationId,
      data: {
        clientId: client.id,
        clientName: client.businessName,
        createdBy: userId
      }
    })

    return client as ClientWithRelations
  }

  /**
   * Update client
   */
  static async updateClient(
    id: string,
    data: UpdateClientInput,
    organizationId: string,
    userId: string
  ): Promise<ClientWithRelations> {
    // Get current client for audit trail
    const currentClient = await this.getClientById(id, organizationId, false)
    if (!currentClient) {
      throw new Error('Client not found')
    }

    // Validate business name uniqueness if changed
    if (data.businessName && data.businessName !== currentClient.businessName) {
      const existingClient = await prisma.client.findFirst({
        where: {
          organizationId,
          businessName: data.businessName,
          deletedAt: null,
          id: { not: id }
        }
      })

      if (existingClient) {
        throw new Error('A client with this business name already exists')
      }
    }

    // Validate tax ID uniqueness if changed
    if (data.taxId && data.taxId !== currentClient.taxId) {
      const existingTaxId = await prisma.client.findFirst({
        where: {
          organizationId,
          taxId: data.taxId,
          deletedAt: null,
          id: { not: id }
        }
      })

      if (existingTaxId) {
        throw new Error('A client with this Tax ID already exists')
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        customFields: data.customFields ?
          { ...currentClient.customFields, ...data.customFields } :
          currentClient.customFields,
      },
      include: {
        _count: {
          select: {
            documents: true,
            engagements: true,
            invoices: true,
            notes: true,
          }
        }
      }
    })

    // Audit log
    await auditLog({
      action: 'update',
      entityType: 'client',
      entityId: id,
      userId,
      organizationId,
      oldValues: currentClient,
      newValues: updatedClient,
      metadata: { clientName: updatedClient.businessName }
    })

    // Sync with QuickBooks if connected
    if (updatedClient.quickbooksId) {
      try {
        await syncWithQuickBooks(organizationId, 'client', updatedClient.id)
      } catch (error) {
        console.error('QuickBooks sync failed:', error)
        // Don't fail the update if QB sync fails
      }
    }

    return updatedClient as ClientWithRelations
  }

  /**
   * Soft delete client
   */
  static async deleteClient(
    id: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    const client = await this.getClientById(id, organizationId, false)
    if (!client) {
      throw new Error('Client not found')
    }

    // Check for dependencies
    const [activeEngagements, unpaidInvoices] = await Promise.all([
      prisma.engagement.count({
        where: {
          clientId: id,
          status: { in: ['planning', 'in_progress', 'review'] },
          deletedAt: null
        }
      }),
      prisma.invoice.count({
        where: {
          clientId: id,
          status: { in: ['draft', 'sent', 'viewed', 'partial', 'overdue'] },
          deletedAt: null
        }
      })
    ])

    if (activeEngagements > 0) {
      throw new Error(`Cannot delete client with ${activeEngagements} active engagement(s)`)
    }

    if (unpaidInvoices > 0) {
      throw new Error(`Cannot delete client with ${unpaidInvoices} unpaid invoice(s)`)
    }

    // Soft delete
    await prisma.client.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId
      }
    })

    // Audit log
    await auditLog({
      action: 'delete',
      entityType: 'client',
      entityId: id,
      userId,
      organizationId,
      oldValues: client,
      metadata: { clientName: client.businessName }
    })
  }

  /**
   * Get client statistics
   */
  static async getClientStats(organizationId: string): Promise<ClientStatsResponse> {
    const [
      totalClients,
      statusCounts,
      businessTypeCounts,
      riskLevelCounts,
      revenueStats,
      quickBooksConnected,
      recentlyAdded
    ] = await Promise.all([
      prisma.client.count({
        where: { organizationId, deletedAt: null }
      }),
      prisma.client.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: true
      }),
      prisma.client.groupBy({
        by: ['businessType'],
        where: { organizationId, deletedAt: null, businessType: { not: null } },
        _count: true
      }),
      prisma.client.groupBy({
        by: ['riskLevel'],
        where: { organizationId, deletedAt: null },
        _count: true
      }),
      prisma.client.aggregate({
        where: { organizationId, deletedAt: null, annualRevenue: { not: null } },
        _sum: { annualRevenue: true },
        _avg: { annualRevenue: true },
        _count: { annualRevenue: true }
      }),
      prisma.client.count({
        where: { organizationId, deletedAt: null, quickbooksId: { not: null } }
      }),
      prisma.client.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    // Convert group by results to objects
    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const byBusinessType = businessTypeCounts.reduce((acc, item) => {
      acc[item.businessType!] = item._count
      return acc
    }, {} as Record<string, number>)

    const byRiskLevel = riskLevelCounts.reduce((acc, item) => {
      acc[item.riskLevel] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      totalClients,
      activeClients: byStatus.active || 0,
      prospectClients: byStatus.prospect || 0,
      inactiveClients: byStatus.inactive || 0,
      totalRevenue: Number(revenueStats._sum.annualRevenue || 0),
      averageRevenue: Number(revenueStats._avg.annualRevenue || 0),
      quickBooksConnected,
      recentlyAdded,
      byBusinessType,
      byRiskLevel,
      byStatus
    }
  }

  /**
   * Bulk operations on clients
   */
  static async bulkOperation(
    input: BulkClientActionInput,
    organizationId: string,
    userId: string
  ): Promise<BulkOperationResponse> {
    const { action, clientIds, data } = input
    const errors: Array<{ clientId: string; error: string }> = []
    let processed = 0

    for (const clientId of clientIds) {
      try {
        switch (action) {
          case 'delete':
            await this.deleteClient(clientId, organizationId, userId)
            break
          case 'archive':
            await this.updateClient(
              clientId,
              { status: 'inactive' },
              organizationId,
              userId
            )
            break
          case 'activate':
            await this.updateClient(
              clientId,
              { status: 'active' },
              organizationId,
              userId
            )
            break
          case 'updateStatus':
            if (data?.status) {
              await this.updateClient(
                clientId,
                { status: data.status },
                organizationId,
                userId
              )
            }
            break
          case 'assignTo':
            // This would require an assignedTo field in the schema
            // For now, we'll store in customFields
            if (data?.assignedTo) {
              const client = await this.getClientById(clientId, organizationId, false)
              if (client) {
                await this.updateClient(
                  clientId,
                  {
                    customFields: {
                      ...client.customFields,
                      assignedTo: data.assignedTo
                    }
                  },
                  organizationId,
                  userId
                )
              }
            }
            break
        }
        processed++
      } catch (error) {
        errors.push({
          clientId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Audit log for bulk operation
    await auditLog({
      action: 'bulk_operation',
      entityType: 'client',
      userId,
      organizationId,
      metadata: {
        action,
        clientIds,
        processed,
        errors: errors.length,
        data
      }
    })

    return {
      success: errors.length === 0,
      processed,
      errors,
      summary: `Processed ${processed}/${clientIds.length} clients. ${errors.length} errors.`
    }
  }

  /**
   * Import clients from CSV
   */
  static async importFromCSV(
    file: File,
    organizationId: string,
    userId: string,
    options: {
      skipDuplicates?: boolean
      updateExisting?: boolean
      mapping?: Record<string, string>
    } = {}
  ): Promise<ImportResult> {
    const { skipDuplicates = true, updateExisting = false, mapping = {} } = options

    return new Promise((resolve) => {
      const results: ImportResult = {
        success: true,
        totalRows: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: []
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          results.totalRows = result.data.length

          for (let i = 0; i < result.data.length; i++) {
            const row = result.data[i] as any
            const rowNumber = i + 2 // +2 for header and 0-based index

            try {
              // Apply field mapping
              const mappedData: any = {}
              for (const [csvField, dbField] of Object.entries(mapping)) {
                if (row[csvField] !== undefined) {
                  mappedData[dbField] = row[csvField]
                }
              }

              // Use original field names if no mapping provided
              const clientData = Object.keys(mapping).length > 0 ? mappedData : row

              // Validate required fields
              if (!clientData.businessName) {
                results.errors.push({
                  row: rowNumber,
                  field: 'businessName',
                  error: 'Business name is required'
                })
                continue
              }

              if (!clientData.primaryContactEmail) {
                results.errors.push({
                  row: rowNumber,
                  field: 'primaryContactEmail',
                  error: 'Primary contact email is required'
                })
                continue
              }

              if (!clientData.primaryContactName) {
                results.errors.push({
                  row: rowNumber,
                  field: 'primaryContactName',
                  error: 'Primary contact name is required'
                })
                continue
              }

              // Check for existing client
              const existingClient = await prisma.client.findFirst({
                where: {
                  organizationId,
                  OR: [
                    { businessName: clientData.businessName },
                    { primaryContactEmail: clientData.primaryContactEmail },
                    ...(clientData.taxId ? [{ taxId: clientData.taxId }] : [])
                  ],
                  deletedAt: null
                }
              })

              if (existingClient) {
                if (updateExisting) {
                  await this.updateClient(
                    existingClient.id,
                    clientData,
                    organizationId,
                    userId
                  )
                  results.updated++
                } else if (skipDuplicates) {
                  results.skipped++
                } else {
                  results.errors.push({
                    row: rowNumber,
                    field: 'businessName',
                    error: 'Client already exists'
                  })
                }
              } else {
                // Create new client
                await this.createClient(
                  {
                    ...clientData,
                    status: clientData.status || 'prospect',
                    riskLevel: clientData.riskLevel || 'medium'
                  },
                  organizationId,
                  userId
                )
                results.imported++
              }
            } catch (error) {
              results.errors.push({
                row: rowNumber,
                field: 'general',
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          results.success = results.errors.length === 0

          // Audit log for import
          await auditLog({
            action: 'import',
            entityType: 'client',
            userId,
            organizationId,
            metadata: {
              fileName: file.name,
              results,
              options
            }
          })

          resolve(results)
        },
        error: (error) => {
          resolve({
            success: false,
            totalRows: 0,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: [{
              row: 0,
              field: 'file',
              error: `Failed to parse CSV: ${error.message}`
            }]
          })
        }
      })
    })
  }

  /**
   * Export clients to CSV
   */
  static async exportToCSV(
    organizationId: string,
    filters: ClientFilterInput = {},
    fields?: string[]
  ): Promise<string> {
    const { clients } = await this.getClients(
      organizationId,
      filters,
      { field: 'businessName', direction: 'asc' },
      { page: 1, limit: 10000 } // Large limit for export
    )

    // Default fields if none specified
    const exportFields = fields || [
      'businessName',
      'legalName',
      'taxId',
      'primaryContactName',
      'primaryContactEmail',
      'primaryContactPhone',
      'businessAddress',
      'businessType',
      'industry',
      'status',
      'riskLevel',
      'annualRevenue',
      'createdAt'
    ]

    // Prepare data for CSV
    const csvData = clients.map(client => {
      const row: any = {}
      exportFields.forEach(field => {
        if (field === 'createdAt' || field === 'updatedAt') {
          row[field] = client[field as keyof typeof client]?.toISOString().split('T')[0]
        } else {
          row[field] = client[field as keyof typeof client] || ''
        }
      })
      return row
    })

    return Papa.unparse(csvData)
  }

  /**
   * Search clients with full-text search
   */
  static async searchClients(
    organizationId: string,
    query: string,
    limit = 10
  ): Promise<ClientWithRelations[]> {
    const clients = await prisma.client.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { businessName: { contains: query, mode: 'insensitive' } },
          { legalName: { contains: query, mode: 'insensitive' } },
          { primaryContactEmail: { contains: query, mode: 'insensitive' } },
          { primaryContactName: { contains: query, mode: 'insensitive' } },
          { taxId: { contains: query, mode: 'insensitive' } },
          { industry: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: {
        _count: {
          select: {
            documents: true,
            engagements: true,
            invoices: true,
            notes: true,
          }
        }
      },
      orderBy: {
        businessName: 'asc'
      },
      take: limit
    })

    return clients as ClientWithRelations[]
  }
}

// Helper functions
async function auditLog(data: any) {
  // Implementation depends on your audit service
  console.log('Audit log:', data)
}

async function sendNotification(data: any) {
  // Implementation depends on your notification service
  console.log('Notification:', data)
}

async function syncWithQuickBooks(organizationId: string, entityType: string, entityId: string) {
  // Implementation depends on your QuickBooks integration
  console.log('QuickBooks sync:', { organizationId, entityType, entityId })
}