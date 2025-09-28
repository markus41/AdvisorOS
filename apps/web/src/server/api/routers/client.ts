import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, organizationProcedure } from '@/server/api/trpc'
import { ClientService } from '@/lib/services/client-service'
import {
  createClientSchema,
  updateClientSchema,
  clientFilterSchema,
  clientSortSchema,
  clientPaginationSchema,
  bulkClientActionSchema,
  exportClientSchema,
} from '@/types/client'

export const clientRouter = createTRPCRouter({
  /**
   * Get paginated list of clients with filtering and sorting
   */
  list: organizationProcedure
    .input(
      z.object({
        filters: clientFilterSchema.optional(),
        sort: clientSortSchema.optional(),
        pagination: clientPaginationSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { filters = {}, sort, pagination } = input

      return await ClientService.getClients(
        ctx.organizationId,
        filters,
        sort,
        pagination
      )
    }),

  /**
   * Get client by ID with all relations
   */
  byId: organizationProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        includeRelations: z.boolean().optional().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const client = await ClientService.getClientById(
        input.id,
        ctx.organizationId,
        input.includeRelations
      )

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        })
      }

      return client
    }),

  /**
   * Create new client
   */
  create: organizationProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ClientService.createClient(
          input,
          ctx.organizationId,
          ctx.userId
        )
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create client',
        })
      }
    }),

  /**
   * Update client
   */
  update: organizationProcedure
    .input(updateClientSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ClientService.updateClient(
          input.id,
          input,
          ctx.organizationId,
          ctx.userId
        )
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Client not found') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
            })
          }
          if (error.message.includes('already exists')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: error.message,
            })
          }
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update client',
        })
      }
    }),

  /**
   * Soft delete client
   */
  delete: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ClientService.deleteClient(
          input.id,
          ctx.organizationId,
          ctx.userId
        )
        return { success: true }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Client not found') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
            })
          }
          if (error.message.includes('Cannot delete client')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: error.message,
            })
          }
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete client',
        })
      }
    }),

  /**
   * Get client statistics
   */
  stats: organizationProcedure.query(async ({ ctx }) => {
    return await ClientService.getClientStats(ctx.organizationId)
  }),

  /**
   * Search clients with full-text search
   */
  search: organizationProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const clients = await ClientService.searchClients(
        ctx.organizationId,
        input.query,
        input.limit
      )

      return {
        query: input.query,
        results: clients,
        count: clients.length,
      }
    }),

  /**
   * Bulk operations on clients
   */
  bulkOperation: organizationProcedure
    .input(bulkClientActionSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientService.bulkOperation(
        input,
        ctx.organizationId,
        ctx.userId
      )
    }),

  /**
   * Export clients to CSV
   */
  export: organizationProcedure
    .input(exportClientSchema)
    .mutation(async ({ ctx, input }) => {
      const csvData = await ClientService.exportToCSV(
        ctx.organizationId,
        input.filters || {},
        input.fields
      )

      // Return the CSV data as a string - the frontend will handle file download
      return {
        data: csvData,
        fileName: `clients-export-${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv',
      }
    }),

  /**
   * Get client aggregations for dashboard/reports
   */
  aggregations: organizationProcedure
    .input(
      z.object({
        groupBy: z.enum(['status', 'businessType', 'riskLevel', 'industry']),
        filters: clientFilterSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { groupBy, filters = {} } = input

      // Build where clause similar to ClientService.getClients
      const where: any = {
        organizationId: ctx.organizationId,
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

      // Group by the specified field
      const results = await ctx.prisma.client.groupBy({
        by: [groupBy],
        where,
        _count: true,
        _sum: {
          annualRevenue: true,
        },
        _avg: {
          annualRevenue: true,
        },
      })

      return results.map((result: any) => ({
        [groupBy]: result[groupBy],
        count: result._count,
        totalRevenue: Number(result._sum.annualRevenue || 0),
        averageRevenue: Number(result._avg.annualRevenue || 0),
      }))
    }),

  /**
   * Get recent activity for dashboard
   */
  recentActivity: organizationProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        days: z.number().min(1).max(90).optional().default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, days } = input
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const [recentClients, recentUpdates] = await Promise.all([
        // Recently created clients
        ctx.prisma.client.findMany({
          where: {
            organizationId: ctx.organizationId,
            deletedAt: null,
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            id: true,
            businessName: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
        }),

        // Recently updated clients
        ctx.prisma.client.findMany({
          where: {
            organizationId: ctx.organizationId,
            deletedAt: null,
            updatedAt: {
              gte: startDate,
            },
            updatedAt: {
              not: {
                equals: ctx.prisma.client.fields.createdAt, // Exclude newly created ones
              },
            },
          },
          select: {
            id: true,
            businessName: true,
            status: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: limit,
        }),
      ])

      return {
        recentClients: recentClients.map(client => ({
          ...client,
          type: 'created' as const,
          timestamp: client.createdAt,
        })),
        recentUpdates: recentUpdates.map(client => ({
          ...client,
          type: 'updated' as const,
          timestamp: client.updatedAt,
        })),
      }
    }),

  /**
   * Validate business name uniqueness
   */
  validateBusinessName: organizationProcedure
    .input(
      z.object({
        businessName: z.string().min(1),
        excludeId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const existingClient = await ctx.prisma.client.findFirst({
        where: {
          organizationId: ctx.organizationId,
          businessName: input.businessName,
          deletedAt: null,
          ...(input.excludeId && { id: { not: input.excludeId } }),
        },
        select: { id: true },
      })

      return {
        isAvailable: !existingClient,
        exists: !!existingClient,
      }
    }),

  /**
   * Validate tax ID uniqueness
   */
  validateTaxId: organizationProcedure
    .input(
      z.object({
        taxId: z.string().min(1),
        excludeId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const existingClient = await ctx.prisma.client.findFirst({
        where: {
          organizationId: ctx.organizationId,
          taxId: input.taxId,
          deletedAt: null,
          ...(input.excludeId && { id: { not: input.excludeId } }),
        },
        select: { id: true },
      })

      return {
        isAvailable: !existingClient,
        exists: !!existingClient,
      }
    }),
})