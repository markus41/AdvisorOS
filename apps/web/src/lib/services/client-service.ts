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
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'
import { QuickBooksService } from './quickbooks-service'
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
    await AuditService.logAction({
      action: 'create',
      entityType: 'client',
      entityId: client.id,
      userId,
      organizationId,
      newValues: client,
      metadata: { clientName: client.businessName }
    })

    // Send notification for new client
    await NotificationService.notifyClientCreated(
      client.id,
      client.businessName,
      organizationId,
      userId
    )

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
    await AuditService.logAction({
      action: 'update',
      entityType: 'client',
      entityId: id,
      userId,
      organizationId,
      oldValues: currentClient,
      newValues: updatedClient,
      metadata: { clientName: updatedClient.businessName }
    })

    // Send notification for client update
    const changes = Object.keys(data).filter(key => data[key] !== currentClient[key])
    if (changes.length > 0) {
      await NotificationService.notifyClientUpdated(
        updatedClient.id,
        updatedClient.businessName,
        organizationId,
        userId,
        changes
      )
    }

    // Sync with QuickBooks if connected
    if (updatedClient.quickbooksId) {
      try {
        await QuickBooksService.syncClient(
          updatedClient.id,
          organizationId,
          userId,
          { syncType: 'incremental', forceSync: false }
        )
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
    await AuditService.logAction({
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
    await AuditService.logAction({
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

  /**
   * Import clients from CSV data string
   */
  static async importFromCSVData(
    csvData: string,
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

      Papa.parse(csvData, {
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
          await AuditService.logAction({
            action: 'import',
            entityType: 'client',
            userId,
            organizationId,
            metadata: {
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
   * Get client financial metrics
   */
  static async getClientMetrics(
    organizationId: string,
    clientId?: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const whereClause: any = {
      organizationId,
      deletedAt: null,
      ...(clientId && { id: clientId })
    }

    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    } : {}

    const [
      clientCount,
      totalRevenue,
      avgRevenue,
      invoiceStats,
      engagementStats,
      documentStats
    ] = await Promise.all([
      // Client count
      prisma.client.count({
        where: { ...whereClause, ...dateFilter }
      }),

      // Total revenue
      prisma.client.aggregate({
        where: { ...whereClause, annualRevenue: { not: null } },
        _sum: { annualRevenue: true }
      }),

      // Average revenue
      prisma.client.aggregate({
        where: { ...whereClause, annualRevenue: { not: null } },
        _avg: { annualRevenue: true }
      }),

      // Invoice statistics
      prisma.invoice.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          ...(clientId && { clientId }),
          ...(dateRange && { createdAt: { gte: dateRange.start, lte: dateRange.end } })
        },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true
      }),

      // Engagement statistics
      prisma.engagement.groupBy({
        by: ['status'],
        where: {
          organizationId,
          deletedAt: null,
          ...(clientId && { clientId }),
          ...(dateRange && { createdAt: { gte: dateRange.start, lte: dateRange.end } })
        },
        _count: true
      }),

      // Document statistics
      prisma.document.groupBy({
        by: ['category'],
        where: {
          organizationId,
          deletedAt: null,
          ...(clientId && { clientId }),
          ...(dateRange && { createdAt: { gte: dateRange.start, lte: dateRange.end } })
        },
        _count: true
      })
    ])

    return {
      clients: {
        total: clientCount,
        totalRevenue: Number(totalRevenue._sum.annualRevenue || 0),
        averageRevenue: Number(avgRevenue._avg.annualRevenue || 0)
      },
      invoices: {
        total: invoiceStats._count,
        totalAmount: Number(invoiceStats._sum.totalAmount || 0),
        paidAmount: Number(invoiceStats._sum.paidAmount || 0),
        outstandingAmount: Number(invoiceStats._sum.totalAmount || 0) - Number(invoiceStats._sum.paidAmount || 0)
      },
      engagements: engagementStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count
        return acc
      }, {} as Record<string, number>),
      documents: documentStats.reduce((acc, stat) => {
        acc[stat.category] = stat._count
        return acc
      }, {} as Record<string, number>)
    }
  }

  /**
   * Get client documents with pagination
   */
  static async getClientDocuments(
    clientId: string,
    organizationId: string,
    category?: string,
    pagination: ClientPaginationInput = { page: 1, limit: 10 }
  ) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where = {
      clientId,
      organizationId,
      deletedAt: null,
      ...(category && { category })
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          uploader: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.document.count({ where })
    ])

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get client tasks with filtering
   */
  static async getClientTasks(
    clientId: string,
    organizationId: string,
    filters: {
      status?: string[]
      assignedTo?: string
    } = {},
    pagination: ClientPaginationInput = { page: 1, limit: 10 }
  ) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where: any = {
      organizationId,
      deletedAt: null,
      engagement: {
        clientId,
        deletedAt: null
      }
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters.assignedTo) {
      where.assignedToId = filters.assignedTo
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          engagement: {
            select: { id: true, name: true, type: true }
          }
        }
      }),
      prisma.task.count({ where })
    ])

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Add note to client
   */
  static async addClientNote(
    noteData: {
      clientId: string
      title?: string
      content: string
      noteType: string
      priority: string
      isPrivate: boolean
      tags?: string[]
      reminderDate?: Date
    },
    organizationId: string,
    userId: string
  ) {
    const note = await prisma.note.create({
      data: {
        ...noteData,
        authorId: userId,
        tags: noteData.tags || [],
        createdBy: userId
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Audit log
    await AuditService.logAction({
      action: 'create',
      entityType: 'note',
      entityId: note.id,
      userId,
      organizationId,
      newValues: note,
      metadata: { clientId: noteData.clientId }
    })

    return note
  }

  /**
   * Update client risk assessment
   */
  static async updateRiskAssessment(
    clientId: string,
    riskLevel: string,
    assessment: {
      assessmentNotes?: string
      factors?: string[]
      assessedBy: string
      assessedAt: Date
    },
    organizationId: string,
    userId: string
  ) {
    // Get current client for audit trail
    const currentClient = await this.getClientById(clientId, organizationId, false)
    if (!currentClient) {
      throw new Error('Client not found')
    }

    // Update client with new risk level and assessment data
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        riskLevel,
        customFields: {
          ...currentClient.customFields,
          riskAssessment: {
            level: riskLevel,
            notes: assessment.assessmentNotes,
            factors: assessment.factors || [],
            assessedBy: assessment.assessedBy,
            assessedAt: assessment.assessedAt.toISOString(),
            history: [
              ...(currentClient.customFields?.riskAssessment?.history || []),
              {
                previousLevel: currentClient.riskLevel,
                newLevel: riskLevel,
                assessedBy: assessment.assessedBy,
                assessedAt: assessment.assessedAt.toISOString(),
                notes: assessment.assessmentNotes
              }
            ]
          }
        },
        updatedBy: userId
      }
    })

    // Audit log
    await AuditService.logAction({
      action: 'risk_assessment',
      entityType: 'client',
      entityId: clientId,
      userId,
      organizationId,
      oldValues: { riskLevel: currentClient.riskLevel },
      newValues: { riskLevel },
      metadata: {
        clientName: currentClient.businessName,
        assessment
      }
    })

    return updatedClient
  }

  /**
   * Get client engagement summary
   */
  static async getEngagementSummary(
    clientId: string,
    organizationId: string,
    year?: number
  ) {
    const currentYear = year || new Date().getFullYear()
    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59)

    const [
      totalEngagements,
      engagementsByStatus,
      engagementsByType,
      totalHours,
      totalBilled
    ] = await Promise.all([
      // Total engagements
      prisma.engagement.count({
        where: {
          clientId,
          organizationId,
          deletedAt: null,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Engagements by status
      prisma.engagement.groupBy({
        by: ['status'],
        where: {
          clientId,
          organizationId,
          deletedAt: null,
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      }),

      // Engagements by type
      prisma.engagement.groupBy({
        by: ['type'],
        where: {
          clientId,
          organizationId,
          deletedAt: null,
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      }),

      // Total hours
      prisma.engagement.aggregate({
        where: {
          clientId,
          organizationId,
          deletedAt: null,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { actualHours: true, estimatedHours: true }
      }),

      // Total billed amount
      prisma.invoice.aggregate({
        where: {
          clientId,
          organizationId,
          deletedAt: null,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true, paidAmount: true }
      })
    ])

    return {
      year: currentYear,
      total: totalEngagements,
      byStatus: engagementsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      byType: engagementsByType.reduce((acc, item) => {
        acc[item.type] = item._count
        return acc
      }, {} as Record<string, number>),
      hours: {
        estimated: Number(totalHours._sum.estimatedHours || 0),
        actual: Number(totalHours._sum.actualHours || 0)
      },
      billing: {
        totalBilled: Number(totalBilled._sum.totalAmount || 0),
        totalPaid: Number(totalBilled._sum.paidAmount || 0),
        outstanding: Number(totalBilled._sum.totalAmount || 0) - Number(totalBilled._sum.paidAmount || 0)
      }
    }
  }

  /**
   * Get QuickBooks sync status for client
   */
  static async getQuickBooksStatus(
    clientId: string,
    organizationId: string
  ) {
    return await QuickBooksService.getClientSyncStatus(clientId, organizationId)
  }

  /**
   * Get client audit trail
   */
  static async getAuditTrail(
    clientId: string,
    organizationId: string,
    pagination: ClientPaginationInput = { page: 1, limit: 20 }
  ) {
    const { page, limit } = pagination
    const offset = (page - 1) * limit

    const auditTrail = await AuditService.getEntityAuditTrail(
      'client',
      clientId,
      organizationId,
      { limit, offset }
    )

    return {
      logs: auditTrail.logs,
      pagination: {
        page,
        limit,
        total: auditTrail.total,
        pages: Math.ceil(auditTrail.total / limit)
      }
    }
  }

  /**
   * Archive multiple clients
   */
  static async archiveClients(
    clientIds: string[],
    organizationId: string,
    userId: string,
    reason?: string
  ): Promise<BulkOperationResponse> {
    const errors: Array<{ clientId: string; error: string }> = []
    let processed = 0

    for (const clientId of clientIds) {
      try {
        // Check for dependencies before archiving
        const [activeEngagements, unpaidInvoices] = await Promise.all([
          prisma.engagement.count({
            where: {
              clientId,
              status: { in: ['planning', 'in_progress', 'review'] },
              deletedAt: null
            }
          }),
          prisma.invoice.count({
            where: {
              clientId,
              status: { in: ['draft', 'sent', 'viewed', 'partial', 'overdue'] },
              deletedAt: null
            }
          })
        ])

        if (activeEngagements > 0 || unpaidInvoices > 0) {
          errors.push({
            clientId,
            error: `Cannot archive: ${activeEngagements} active engagements, ${unpaidInvoices} unpaid invoices`
          })
          continue
        }

        // Archive the client
        await this.updateClient(
          clientId,
          {
            status: 'inactive',
            customFields: {
              archivedAt: new Date().toISOString(),
              archivedBy: userId,
              archiveReason: reason
            }
          },
          organizationId,
          userId
        )

        processed++
      } catch (error) {
        errors.push({
          clientId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Audit log for bulk archive
    await AuditService.logAction({
      action: 'bulk_archive',
      entityType: 'client',
      userId,
      organizationId,
      metadata: {
        clientIds,
        processed,
        errors: errors.length,
        reason
      }
    })

    // Send notification for bulk archive
    if (processed > 0) {
      await NotificationService.sendNotification({
        type: 'clients_archived',
        organizationId,
        userId,
        title: 'Clients Archived',
        message: `Successfully archived ${processed} client(s)${reason ? `. Reason: ${reason}` : ''}`,
        data: { processed, errors: errors.length, reason },
        priority: 'normal',
        channel: 'in_app'
      })
    }

    return {
      success: errors.length === 0,
      processed,
      errors,
      summary: `Archived ${processed}/${clientIds.length} clients. ${errors.length} errors.`
    }
  }
}