import { PrismaClient, Prisma } from '@prisma/client';
import { Redis } from 'ioredis';
import { z } from 'zod';

// Pagination schemas
const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
});

// Filter schemas for common queries
const ClientFiltersSchema = z.object({
  organizationId: z.string(),
  status: z.enum(['active', 'inactive', 'prospect']).optional(),
  businessType: z.string().optional(),
  industry: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  search: z.string().optional(),
});

const DocumentFiltersSchema = z.object({
  organizationId: z.string(),
  clientId: z.string().optional(),
  category: z.string().optional(),
  year: z.number().optional(),
  quarter: z.number().optional(),
  needsReview: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
});

const TaskFiltersSchema = z.object({
  organizationId: z.string(),
  assignedToId: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  engagementId: z.string().optional(),
  dueDateFrom: z.date().optional(),
  dueDateTo: z.date().optional(),
});

const InvoiceFiltersSchema = z.object({
  organizationId: z.string(),
  clientId: z.string().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
  dueDateFrom: z.date().optional(),
  dueDateTo: z.date().optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
});

type PaginationInput = z.infer<typeof PaginationSchema>;
type CursorPaginationInput = z.infer<typeof CursorPaginationSchema>;
type ClientFilters = z.infer<typeof ClientFiltersSchema>;
type DocumentFilters = z.infer<typeof DocumentFiltersSchema>;
type TaskFilters = z.infer<typeof TaskFiltersSchema>;
type InvoiceFilters = z.infer<typeof InvoiceFiltersSchema>;

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CursorPaginatedResult<T> {
  data: T[];
  meta: {
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
    totalCount?: number;
  };
}

export class QueryOptimizerService {
  constructor(
    private prisma: PrismaClient,
    private redis?: Redis
  ) {}

  // Cache configuration
  private readonly CACHE_TTL = {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 15 * 60, // 15 minutes
    LONG: 60 * 60, // 1 hour
    DASHBOARD: 2 * 60, // 2 minutes for dashboard data
  };

  private generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  private async setCache(key: string, data: any, ttl: number): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  private async deleteCache(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // OPTIMIZED CLIENT QUERIES
  async getClientsOptimized(
    filters: ClientFilters,
    pagination: PaginationInput
  ): Promise<PaginatedResult<any>> {
    const cacheKey = this.generateCacheKey(
      'clients',
      filters.organizationId,
      filters.status || 'all',
      filters.businessType || 'all',
      filters.industry || 'all',
      filters.riskLevel || 'all',
      filters.search || 'all',
      pagination.page,
      pagination.limit
    );

    // Try cache first
    const cached = await this.getFromCache<PaginatedResult<any>>(cacheKey);
    if (cached) return cached;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build optimized where clause
    const where: Prisma.ClientWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.businessType && { businessType: filters.businessType }),
      ...(filters.industry && { industry: filters.industry }),
      ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
      ...(filters.search && {
        OR: [
          { businessName: { contains: filters.search, mode: 'insensitive' } },
          { primaryContactName: { contains: filters.search, mode: 'insensitive' } },
          { primaryContactEmail: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Use covering index for efficient queries
    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        select: {
          id: true,
          businessName: true,
          primaryContactName: true,
          primaryContactEmail: true,
          status: true,
          riskLevel: true,
          businessType: true,
          industry: true,
          createdAt: true,
          _count: {
            select: {
              documents: { where: { deletedAt: null } },
              engagements: { where: { deletedAt: null } },
              invoices: { where: { deletedAt: null } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' }, // Active clients first
          { businessName: 'asc' },
        ],
      }),
      this.prisma.client.count({ where }),
    ]);

    const result: PaginatedResult<any> = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    await this.setCache(cacheKey, result, this.CACHE_TTL.MEDIUM);
    return result;
  }

  // OPTIMIZED DOCUMENT QUERIES
  async getDocumentsOptimized(
    filters: DocumentFilters,
    pagination: CursorPaginationInput
  ): Promise<CursorPaginatedResult<any>> {
    const cacheKey = this.generateCacheKey(
      'documents',
      filters.organizationId,
      filters.clientId || 'all',
      filters.category || 'all',
      filters.year || 'all',
      filters.quarter || 'all',
      String(filters.needsReview),
      String(filters.isArchived),
      filters.search || 'all',
      pagination.cursor || 'none',
      pagination.limit,
      pagination.direction
    );

    const cached = await this.getFromCache<CursorPaginatedResult<any>>(cacheKey);
    if (cached) return cached;

    const { cursor, limit, direction } = pagination;

    const where: Prisma.DocumentWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      isLatestVersion: true, // Only latest versions for performance
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.category && { category: filters.category }),
      ...(filters.year && { year: filters.year }),
      ...(filters.quarter && { quarter: filters.quarter }),
      ...(filters.needsReview !== undefined && { needsReview: filters.needsReview }),
      ...(filters.isArchived !== undefined && { isArchived: filters.isArchived }),
      ...(filters.search && {
        OR: [
          { fileName: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { tags: { has: filters.search } },
        ],
      }),
    };

    // Cursor-based pagination for large datasets
    const cursorCondition = cursor
      ? direction === 'forward'
        ? { id: { gt: cursor } }
        : { id: { lt: cursor } }
      : {};

    const documents = await this.prisma.document.findMany({
      where: { ...where, ...cursorCondition },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        category: true,
        year: true,
        quarter: true,
        ocrStatus: true,
        needsReview: true,
        createdAt: true,
        client: {
          select: { businessName: true },
        },
        uploader: {
          select: { name: true, email: true },
        },
      },
      take: limit + 1, // Take one extra to check for next page
      orderBy: { createdAt: direction === 'forward' ? 'desc' : 'asc' },
    });

    const hasNext = documents.length > limit;
    const data = hasNext ? documents.slice(0, -1) : documents;
    const nextCursor = hasNext ? data[data.length - 1]?.id : undefined;
    const prevCursor = data.length > 0 ? data[0]?.id : undefined;

    const result: CursorPaginatedResult<any> = {
      data,
      meta: {
        hasNext,
        hasPrev: !!cursor,
        nextCursor,
        prevCursor,
      },
    };

    await this.setCache(cacheKey, result, this.CACHE_TTL.SHORT);
    return result;
  }

  // OPTIMIZED TASK QUERIES
  async getTasksOptimized(
    filters: TaskFilters,
    pagination: PaginationInput
  ): Promise<PaginatedResult<any>> {
    const cacheKey = this.generateCacheKey(
      'tasks',
      filters.organizationId,
      filters.assignedToId || 'all',
      filters.status || 'all',
      filters.priority || 'all',
      filters.engagementId || 'all',
      filters.dueDateFrom?.toISOString() || 'all',
      filters.dueDateTo?.toISOString() || 'all',
      pagination.page,
      pagination.limit
    );

    const cached = await this.getFromCache<PaginatedResult<any>>(cacheKey);
    if (cached) return cached;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.engagementId && { engagementId: filters.engagementId }),
      ...(filters.dueDateFrom || filters.dueDateTo
        ? {
            dueDate: {
              ...(filters.dueDateFrom && { gte: filters.dueDateFrom }),
              ...(filters.dueDateTo && { lte: filters.dueDateTo }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
          actualHours: true,
          createdAt: true,
          assignedTo: {
            select: { name: true, email: true },
          },
          engagement: {
            select: {
              name: true,
              client: { select: { businessName: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.task.count({ where }),
    ]);

    const result: PaginatedResult<any> = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    await this.setCache(cacheKey, result, this.CACHE_TTL.SHORT);
    return result;
  }

  // OPTIMIZED INVOICE QUERIES
  async getInvoicesOptimized(
    filters: InvoiceFilters,
    pagination: PaginationInput
  ): Promise<PaginatedResult<any>> {
    const cacheKey = this.generateCacheKey(
      'invoices',
      filters.organizationId,
      filters.clientId || 'all',
      filters.status || 'all',
      filters.paymentStatus || 'all',
      filters.dueDateFrom?.toISOString() || 'all',
      filters.dueDateTo?.toISOString() || 'all',
      pagination.page,
      pagination.limit
    );

    const cached = await this.getFromCache<PaginatedResult<any>>(cacheKey);
    if (cached) return cached;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Calculate payment status conditions
    const paymentStatusCondition = filters.paymentStatus
      ? filters.paymentStatus === 'paid'
        ? { paidAmount: { gte: { $prim: 'totalAmount' } } }
        : filters.paymentStatus === 'partial'
        ? {
            paidAmount: { gt: 0 },
            paidAmount: { lt: { $prim: 'totalAmount' } },
          }
        : { paidAmount: 0 }
      : {};

    const where: Prisma.InvoiceWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.dueDateFrom || filters.dueDateTo
        ? {
            dueDate: {
              ...(filters.dueDateFrom && { gte: filters.dueDateFrom }),
              ...(filters.dueDateTo && { lte: filters.dueDateTo }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          client: {
            select: { businessName: true, primaryContactEmail: true },
          },
          engagement: {
            select: { name: true, type: true },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { invoiceDate: 'desc' },
        ],
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const result: PaginatedResult<any> = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    await this.setCache(cacheKey, result, this.CACHE_TTL.MEDIUM);
    return result;
  }

  // DASHBOARD AGGREGATIONS
  async getDashboardMetrics(organizationId: string): Promise<any> {
    const cacheKey = this.generateCacheKey('dashboard', organizationId);

    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    // Use parallel queries with optimized indexes
    const [
      clientMetrics,
      documentMetrics,
      taskMetrics,
      invoiceMetrics,
      engagementMetrics,
    ] = await Promise.all([
      // Client metrics
      this.prisma.client.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: true,
      }),

      // Document metrics
      this.prisma.document.aggregate({
        where: { organizationId, deletedAt: null },
        _count: {
          id: true,
        },
        _sum: {
          fileSize: true,
        },
      }),

      // Task metrics
      this.prisma.task.groupBy({
        by: ['status', 'priority'],
        where: { organizationId, deletedAt: null },
        _count: true,
      }),

      // Invoice metrics
      this.prisma.invoice.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
        _count: {
          id: true,
        },
      }),

      // Engagement metrics
      this.prisma.engagement.groupBy({
        by: ['status', 'type'],
        where: { organizationId, deletedAt: null },
        _count: true,
      }),
    ]);

    const metrics = {
      clients: clientMetrics,
      documents: documentMetrics,
      tasks: taskMetrics,
      invoices: invoiceMetrics,
      engagements: engagementMetrics,
      generatedAt: new Date(),
    };

    await this.setCache(cacheKey, metrics, this.CACHE_TTL.DASHBOARD);
    return metrics;
  }

  // CACHE INVALIDATION HELPERS
  async invalidateClientCache(organizationId: string, clientId?: string): Promise<void> {
    await Promise.all([
      this.deleteCache(`clients:${organizationId}:*`),
      this.deleteCache(`dashboard:${organizationId}`),
      ...(clientId ? [this.deleteCache(`documents:${organizationId}:${clientId}:*`)] : []),
    ]);
  }

  async invalidateDocumentCache(organizationId: string, clientId?: string): Promise<void> {
    await Promise.all([
      this.deleteCache(`documents:${organizationId}:*`),
      this.deleteCache(`dashboard:${organizationId}`),
      ...(clientId ? [this.deleteCache(`clients:${organizationId}:*`)] : []),
    ]);
  }

  async invalidateTaskCache(organizationId: string, assignedToId?: string): Promise<void> {
    await Promise.all([
      this.deleteCache(`tasks:${organizationId}:*`),
      this.deleteCache(`dashboard:${organizationId}`),
      ...(assignedToId ? [this.deleteCache(`tasks:${organizationId}:${assignedToId}:*`)] : []),
    ]);
  }

  async invalidateInvoiceCache(organizationId: string, clientId?: string): Promise<void> {
    await Promise.all([
      this.deleteCache(`invoices:${organizationId}:*`),
      this.deleteCache(`dashboard:${organizationId}`),
      ...(clientId ? [this.deleteCache(`clients:${organizationId}:*`)] : []),
    ]);
  }

  // QUERY PERFORMANCE MONITORING
  async logSlowQuery(
    queryName: string,
    duration: number,
    organizationId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (duration > 1000) { // Log queries taking more than 1 second
      console.warn('Slow query detected:', {
        queryName,
        duration,
        organizationId,
        metadata,
        timestamp: new Date(),
      });

      // Optionally store in database for analysis
      await this.prisma.auditLog.create({
        data: {
          action: 'slow_query',
          entityType: 'performance',
          organizationId,
          metadata: {
            queryName,
            duration,
            ...metadata,
          },
        },
      });
    }
  }
}

// Export the type definitions for use in other modules
export type {
  PaginationInput,
  CursorPaginationInput,
  ClientFilters,
  DocumentFilters,
  TaskFilters,
  InvoiceFilters,
  PaginatedResult,
  CursorPaginatedResult,
};