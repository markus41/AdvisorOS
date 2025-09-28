/**
 * Optimized Query Patterns for AdvisorOS CPA Platform
 *
 * This file contains pre-optimized Prisma queries that prevent N+1 problems
 * and ensure consistent performance across the application.
 */

import { PrismaClient, Prisma } from '@prisma/client';

// ============================================================================
// CLIENT QUERIES WITH OPTIMIZED INCLUDES
// ============================================================================

/**
 * Optimized client list query with strategic eager loading
 * Prevents N+1 queries while maintaining performance
 */
export const getClientsOptimized = async (
  prisma: PrismaClient,
  organizationId: string,
  filters: {
    search?: string;
    status?: string[];
    businessType?: string[];
    riskLevel?: string[];
    hasQuickBooks?: boolean;
    annualRevenueMin?: number;
    annualRevenueMax?: number;
  } = {},
  sort: { field: string; direction: 'asc' | 'desc' } = { field: 'businessName', direction: 'asc' },
  pagination: { page: number; limit: number } = { page: 1, limit: 50 }
) => {
  const where: Prisma.ClientWhereInput = {
    organizationId,
    deletedAt: null,
    ...(filters.search && {
      OR: [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { legalName: { contains: filters.search, mode: 'insensitive' } },
        { primaryContactName: { contains: filters.search, mode: 'insensitive' } },
        { primaryContactEmail: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters.status && { status: { in: filters.status } }),
    ...(filters.businessType && { businessType: { in: filters.businessType } }),
    ...(filters.riskLevel && { riskLevel: { in: filters.riskLevel } }),
    ...(filters.hasQuickBooks !== undefined && {
      quickbooksId: filters.hasQuickBooks ? { not: null } : null,
    }),
    ...(filters.annualRevenueMin && {
      annualRevenue: { gte: filters.annualRevenueMin },
    }),
    ...(filters.annualRevenueMax && {
      annualRevenue: { lte: filters.annualRevenueMax },
    }),
  };

  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        // Strategic includes to prevent N+1 queries
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
            engagements: { where: { deletedAt: null } },
            invoices: { where: { deletedAt: null } },
            notes: { where: { deletedAt: null } },
          },
        },
        // Only include active engagements for dashboard display
        engagements: {
          where: {
            status: { in: ['planning', 'in_progress', 'review'] },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            dueDate: true,
            priority: true,
          },
          orderBy: { dueDate: 'asc' },
          take: 3, // Limit to recent engagements
        },
        // Recent document count for quick reference
        documents: {
          where: {
            deletedAt: null,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
          },
          select: {
            id: true,
            category: true,
            ocrStatus: true,
            needsReview: true,
          },
          take: 5,
        },
      },
      orderBy: { [sort.field]: sort.direction },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      pages: Math.ceil(totalCount / pagination.limit),
    },
  };
};

/**
 * Single client query with comprehensive related data
 */
export const getClientByIdOptimized = async (
  prisma: PrismaClient,
  clientId: string,
  organizationId: string
) => {
  return prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId,
      deletedAt: null,
    },
    include: {
      // Financial summaries
      _count: {
        select: {
          documents: { where: { deletedAt: null } },
          engagements: { where: { deletedAt: null } },
          invoices: { where: { deletedAt: null } },
          notes: { where: { deletedAt: null } },
          workflowExecutions: { where: { deletedAt: null } },
        },
      },
      // Active engagements with tasks
      engagements: {
        where: { deletedAt: null },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: {
            where: {
              status: { in: ['pending', 'in_progress'] },
              deletedAt: null,
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { dueDate: 'asc' },
          },
          _count: {
            select: {
              tasks: { where: { deletedAt: null } },
              invoices: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      // Recent documents with OCR status
      documents: {
        where: { deletedAt: null },
        select: {
          id: true,
          fileName: true,
          category: true,
          subcategory: true,
          year: true,
          quarter: true,
          ocrStatus: true,
          ocrConfidence: true,
          needsReview: true,
          isConfidential: true,
          fileSize: true,
          createdAt: true,
          uploader: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              annotations: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      // Recent notes
      notes: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          noteType: true,
          priority: true,
          isPrivate: true,
          reminderDate: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      // Outstanding invoices
      invoices: {
        where: {
          status: { in: ['draft', 'sent', 'viewed', 'partial', 'overdue'] },
          deletedAt: null,
        },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          dueDate: true,
          createdAt: true,
        },
        orderBy: { dueDate: 'asc' },
      },
    },
  });
};

// ============================================================================
// DOCUMENT QUERIES WITH COLLABORATION DATA
// ============================================================================

/**
 * Optimized document list with collaboration metadata
 */
export const getDocumentsOptimized = async (
  prisma: PrismaClient,
  organizationId: string,
  filters: {
    clientId?: string;
    category?: string[];
    year?: number;
    quarter?: number;
    ocrStatus?: string[];
    needsReview?: boolean;
    isLatestVersion?: boolean;
    search?: string;
  } = {},
  sort: { field: string; direction: 'asc' | 'desc' } = { field: 'createdAt', direction: 'desc' },
  pagination: { page: number; limit: number } = { page: 1, limit: 25 }
) => {
  const where: Prisma.DocumentWhereInput = {
    organizationId,
    deletedAt: null,
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.category && { category: { in: filters.category } }),
    ...(filters.year && { year: filters.year }),
    ...(filters.quarter && { quarter: filters.quarter }),
    ...(filters.ocrStatus && { ocrStatus: { in: filters.ocrStatus } }),
    ...(filters.needsReview !== undefined && { needsReview: filters.needsReview }),
    ...(filters.isLatestVersion !== undefined && { isLatestVersion: filters.isLatestVersion }),
    ...(filters.search && {
      OR: [
        { fileName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ],
    }),
  };

  const [documents, totalCount] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            annotations: { where: { deletedAt: null } },
            comments: { where: { deletedAt: null } },
            shares: { where: { isActive: true } },
          },
        },
        // Recent collaboration activity
        annotations: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        comments: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { [sort.field]: sort.direction },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      pages: Math.ceil(totalCount / pagination.limit),
    },
  };
};

// ============================================================================
// ENGAGEMENT AND WORKFLOW QUERIES
// ============================================================================

/**
 * Optimized engagement queries with task breakdowns
 */
export const getEngagementsOptimized = async (
  prisma: PrismaClient,
  organizationId: string,
  filters: {
    clientId?: string;
    assignedToId?: string;
    status?: string[];
    type?: string[];
    dueDateFrom?: Date;
    dueDateTo?: Date;
  } = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 20 }
) => {
  const where: Prisma.EngagementWhereInput = {
    organizationId,
    deletedAt: null,
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
    ...(filters.status && { status: { in: filters.status } }),
    ...(filters.type && { type: { in: filters.type } }),
    ...(filters.dueDateFrom && { dueDate: { gte: filters.dueDateFrom } }),
    ...(filters.dueDateTo && { dueDate: { lte: filters.dueDateTo } }),
  };

  const [engagements, totalCount] = await Promise.all([
    prisma.engagement.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            businessName: true,
            primaryContactName: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        workflow: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            tasks: { where: { deletedAt: null } },
            notes: { where: { deletedAt: null } },
            invoices: { where: { deletedAt: null } },
            reports: { where: { deletedAt: null } },
            workflowExecutions: { where: { deletedAt: null } },
          },
        },
        // Active tasks with status breakdown
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            estimatedHours: true,
            actualHours: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [
            { status: 'asc' }, // Pending tasks first
            { priority: 'desc' },
            { dueDate: 'asc' },
          ],
        },
        // Recent workflow executions
        workflowExecutions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
            startedAt: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.engagement.count({ where }),
  ]);

  return {
    engagements,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      pages: Math.ceil(totalCount / pagination.limit),
    },
  };
};

// ============================================================================
// DASHBOARD AGGREGATION QUERIES
// ============================================================================

/**
 * Optimized dashboard statistics with single query execution
 */
export const getDashboardStatsOptimized = async (
  prisma: PrismaClient,
  organizationId: string,
  dateRange: { from: Date; to: Date }
) => {
  // Use raw queries for better performance on aggregations
  const [
    clientStats,
    engagementStats,
    documentStats,
    taskStats,
    revenueStats,
  ] = await Promise.all([
    // Client statistics
    prisma.$queryRaw<Array<{ status: string; count: number }>>`
      SELECT status, COUNT(*)::int as count
      FROM clients
      WHERE organization_id = ${organizationId}
        AND deleted_at IS NULL
      GROUP BY status
    `,

    // Engagement statistics by status
    prisma.$queryRaw<Array<{ status: string; count: number; total_estimated_hours: number }>>`
      SELECT
        status,
        COUNT(*)::int as count,
        COALESCE(SUM(estimated_hours), 0)::int as total_estimated_hours
      FROM engagements
      WHERE organization_id = ${organizationId}
        AND deleted_at IS NULL
        AND created_at >= ${dateRange.from}
        AND created_at <= ${dateRange.to}
      GROUP BY status
    `,

    // Document processing statistics
    prisma.$queryRaw<Array<{ ocr_status: string; count: number }>>`
      SELECT
        ocr_status,
        COUNT(*)::int as count
      FROM documents
      WHERE organization_id = ${organizationId}
        AND deleted_at IS NULL
        AND created_at >= ${dateRange.from}
        AND created_at <= ${dateRange.to}
      GROUP BY ocr_status
    `,

    // Task completion statistics
    prisma.$queryRaw<Array<{ status: string; count: number; avg_completion_time: number }>>`
      SELECT
        status,
        COUNT(*)::int as count,
        COALESCE(AVG(EXTRACT(EPOCH FROM (completed_date - start_date))/3600), 0)::int as avg_completion_time
      FROM tasks
      WHERE organization_id = ${organizationId}
        AND deleted_at IS NULL
        AND created_at >= ${dateRange.from}
        AND created_at <= ${dateRange.to}
      GROUP BY status
    `,

    // Revenue and billing statistics
    prisma.$queryRaw<Array<{ status: string; count: number; total_amount: number; avg_amount: number }>>`
      SELECT
        status,
        COUNT(*)::int as count,
        COALESCE(SUM(total_amount), 0)::numeric as total_amount,
        COALESCE(AVG(total_amount), 0)::numeric as avg_amount
      FROM invoices
      WHERE organization_id = ${organizationId}
        AND deleted_at IS NULL
        AND invoice_date >= ${dateRange.from}
        AND invoice_date <= ${dateRange.to}
      GROUP BY status
    `,
  ]);

  return {
    clients: clientStats,
    engagements: engagementStats,
    documents: documentStats,
    tasks: taskStats,
    revenue: revenueStats,
    generatedAt: new Date(),
  };
};

// ============================================================================
// BATCH OPERATIONS FOR PERFORMANCE
// ============================================================================

/**
 * Batch update operations to reduce database round trips
 */
export const batchUpdateDocumentOCRStatus = async (
  prisma: PrismaClient,
  updates: Array<{
    documentId: string;
    ocrStatus: string;
    ocrConfidence?: number;
    extractedData?: any;
    needsReview?: boolean;
  }>
) => {
  // Use transactions for consistency
  return prisma.$transaction(
    updates.map(update =>
      prisma.document.update({
        where: { id: update.documentId },
        data: {
          ocrStatus: update.ocrStatus,
          ocrConfidence: update.ocrConfidence,
          extractedData: update.extractedData,
          needsReview: update.needsReview,
          ocrProcessedAt: new Date(),
        },
      })
    )
  );
};

/**
 * Bulk task assignment for workflow optimization
 */
export const bulkAssignTasks = async (
  prisma: PrismaClient,
  assignments: Array<{
    taskId: string;
    assignedToId: string;
    priority?: string;
  }>
) => {
  return prisma.$transaction(
    assignments.map(assignment =>
      prisma.task.update({
        where: { id: assignment.taskId },
        data: {
          assignedToId: assignment.assignedToId,
          priority: assignment.priority,
          updatedAt: new Date(),
        },
      })
    )
  );
};

// ============================================================================
// SEARCH OPTIMIZATION
// ============================================================================

/**
 * Full-text search across multiple entities
 */
export const performGlobalSearch = async (
  prisma: PrismaClient,
  organizationId: string,
  searchTerm: string,
  entityTypes: string[] = ['clients', 'documents', 'engagements']
) => {
  const results: any = {};

  if (entityTypes.includes('clients')) {
    results.clients = await prisma.$queryRaw`
      SELECT
        id,
        business_name,
        primary_contact_name,
        primary_contact_email,
        ts_rank(search_vector, plainto_tsquery('english', ${searchTerm})) as rank
      FROM (
        SELECT *,
          to_tsvector('english',
            coalesce(business_name, '') || ' ' ||
            coalesce(legal_name, '') || ' ' ||
            coalesce(primary_contact_name, '') || ' ' ||
            coalesce(primary_contact_email, '')
          ) as search_vector
        FROM clients
        WHERE organization_id = ${organizationId}
          AND deleted_at IS NULL
      ) as clients_search
      WHERE search_vector @@ plainto_tsquery('english', ${searchTerm})
      ORDER BY rank DESC
      LIMIT 10
    `;
  }

  if (entityTypes.includes('documents')) {
    results.documents = await prisma.$queryRaw`
      SELECT
        id,
        file_name,
        category,
        description,
        client_id,
        ts_rank(search_vector, plainto_tsquery('english', ${searchTerm})) as rank
      FROM (
        SELECT *,
          to_tsvector('english',
            coalesce(file_name, '') || ' ' ||
            coalesce(description, '') || ' ' ||
            array_to_string(tags, ' ')
          ) as search_vector
        FROM documents
        WHERE organization_id = ${organizationId}
          AND deleted_at IS NULL
      ) as documents_search
      WHERE search_vector @@ plainto_tsquery('english', ${searchTerm})
      ORDER BY rank DESC
      LIMIT 10
    `;
  }

  return results;
};

// ============================================================================
// EXPORT TYPES FOR APPLICATION USE
// ============================================================================

export type OptimizedClientResult = Awaited<ReturnType<typeof getClientsOptimized>>;
export type OptimizedDocumentResult = Awaited<ReturnType<typeof getDocumentsOptimized>>;
export type OptimizedEngagementResult = Awaited<ReturnType<typeof getEngagementsOptimized>>;
export type DashboardStats = Awaited<ReturnType<typeof getDashboardStatsOptimized>>;