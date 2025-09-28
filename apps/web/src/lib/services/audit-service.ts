import { prisma } from '@cpa-platform/database'

export interface AuditLogData {
  action: string
  entityType: string
  entityId?: string
  userId?: string
  organizationId: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

/**
 * Audit Service for tracking all system changes
 */
export class AuditService {
  /**
   * Create an audit log entry
   */
  static async logAction(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          organizationId: data.organizationId,
          oldValues: data.oldValues || null,
          newValues: data.newValues || null,
          metadata: data.metadata || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
        }
      })
    } catch (error) {
      // Log audit failures to console but don't throw to avoid breaking main operations
      console.error('Failed to create audit log:', error)
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditTrail(
    entityType: string,
    entityId: string,
    organizationId: string,
    options: {
      limit?: number
      offset?: number
      actions?: string[]
    } = {}
  ) {
    const { limit = 50, offset = 0, actions } = options

    const where: any = {
      entityType,
      entityId,
      organizationId
    }

    if (actions && actions.length > 0) {
      where.action = { in: actions }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])

    return {
      logs,
      total,
      hasMore: total > offset + limit
    }
  }

  /**
   * Get audit logs for an organization with filtering
   */
  static async getOrganizationAuditTrail(
    organizationId: string,
    options: {
      limit?: number
      offset?: number
      entityTypes?: string[]
      actions?: string[]
      userId?: string
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      entityTypes,
      actions,
      userId,
      startDate,
      endDate
    } = options

    const where: any = {
      organizationId
    }

    if (entityTypes && entityTypes.length > 0) {
      where.entityType = { in: entityTypes }
    }

    if (actions && actions.length > 0) {
      where.action = { in: actions }
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])

    return {
      logs,
      total,
      hasMore: total > offset + limit
    }
  }

  /**
   * Get audit statistics for an organization
   */
  static async getAuditStatistics(
    organizationId: string,
    options: {
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    const { startDate, endDate } = options

    const where: any = {
      organizationId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const [
      totalLogs,
      actionCounts,
      entityTypeCounts,
      userActivityCounts
    ] = await Promise.all([
      // Total audit logs
      prisma.auditLog.count({ where }),

      // Action counts
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } }
      }),

      // Entity type counts
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
        orderBy: { _count: { entityType: 'desc' } }
      }),

      // User activity counts
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ])

    return {
      totalLogs,
      actionBreakdown: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count
        return acc
      }, {} as Record<string, number>),
      entityTypeBreakdown: entityTypeCounts.reduce((acc, item) => {
        acc[item.entityType] = item._count
        return acc
      }, {} as Record<string, number>),
      topUsers: userActivityCounts.map(item => ({
        userId: item.userId,
        count: item._count
      }))
    }
  }

  /**
   * Clean up old audit logs (for compliance/storage management)
   */
  static async cleanupOldLogs(
    organizationId: string,
    retentionDays: number = 2555 // 7 years default
  ) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const deletedCount = await prisma.auditLog.deleteMany({
      where: {
        organizationId,
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    // Log the cleanup action
    await this.logAction({
      action: 'cleanup_audit_logs',
      entityType: 'audit_log',
      organizationId,
      metadata: {
        cutoffDate: cutoffDate.toISOString(),
        deletedCount: deletedCount.count,
        retentionDays
      }
    })

    return deletedCount.count
  }
}

// Helper function for backward compatibility
export async function auditLog(data: AuditLogData): Promise<void> {
  return AuditService.logAction(data)
}