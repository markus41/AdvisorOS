/**
 * Comprehensive Audit Logging Service
 * Provides automatic audit trail for all user actions and system events
 */

import { prisma } from '@/server/db'
import { type User, type AuditLog, type SecurityEvent } from '@prisma/client'
import { type Session } from 'next-auth'

export interface AuditContext {
  userId?: string
  organizationId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export interface AuditableChange {
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'read' | 'export' | 'import' | 'login' | 'logout' | 'access'
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
}

export interface SecurityEventData {
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  resourceType?: string
  resourceId?: string
  riskScore?: number
  metadata?: Record<string, any>
}

export class AuditService {
  /**
   * Log a general audit event
   */
  static async logAuditEvent(
    change: AuditableChange,
    context: AuditContext
  ): Promise<AuditLog> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          action: change.action,
          entityType: change.entityType,
          entityId: change.entityId,
          oldValues: change.oldValues || null,
          newValues: change.newValues || null,
          metadata: {
            ...change.metadata,
            ...context.metadata,
            timestamp: new Date().toISOString(),
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          sessionId: context.sessionId,
          organizationId: context.organizationId!,
          userId: context.userId,
        },
      })

      // Trigger security monitoring for sensitive actions
      if (this.isSensitiveAction(change.action, change.entityType)) {
        await this.checkForSuspiciousActivity(change, context)
      }

      return auditLog
    } catch (error) {
      console.error('Failed to log audit event:', error)
      throw error
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuthEvent(
    action: 'login' | 'logout' | 'failed_login' | 'password_change' | 'mfa_enabled' | 'mfa_disabled',
    userId: string | null,
    context: AuditContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditData: AuditableChange = {
        entityType: 'user',
        entityId: userId || 'unknown',
        action: action as any,
        metadata: {
          authAction: action,
          ...metadata,
        },
      }

      await this.logAuditEvent(auditData, context)

      // Log failed login attempts as security events
      if (action === 'failed_login') {
        await this.logSecurityEvent({
          eventType: 'failed_login',
          severity: 'medium',
          description: `Failed login attempt for user ${userId || 'unknown'}`,
          resourceType: 'user',
          resourceId: userId || undefined,
          riskScore: 30,
          metadata,
        }, context)
      }
    } catch (error) {
      console.error('Failed to log auth event:', error)
    }
  }

  /**
   * Log data access events for compliance
   */
  static async logDataAccess(
    entityType: string,
    entityId: string,
    accessType: 'view' | 'download' | 'export' | 'print',
    context: AuditContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditData: AuditableChange = {
        entityType,
        entityId,
        action: 'read',
        metadata: {
          accessType,
          dataClassification: metadata?.dataClassification || 'standard',
          ...metadata,
        },
      }

      await this.logAuditEvent(auditData, context)
    } catch (error) {
      console.error('Failed to log data access:', error)
    }
  }

  /**
   * Log GDPR and compliance related events
   */
  static async logComplianceEvent(
    eventType: 'gdpr_request' | 'data_export' | 'data_deletion' | 'consent_given' | 'consent_withdrawn',
    description: string,
    context: AuditContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Create compliance event record
      await prisma.complianceEvent.create({
        data: {
          eventType,
          description,
          organizationId: context.organizationId!,
          userId: context.userId,
          severity: 'medium',
          status: 'open',
          metadata: {
            ...metadata,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            sessionId: context.sessionId,
          },
        },
      })

      // Also log as regular audit event
      await this.logAuditEvent({
        entityType: 'compliance',
        entityId: eventType,
        action: 'create',
        metadata: {
          complianceEvent: eventType,
          ...metadata,
        },
      }, context)
    } catch (error) {
      console.error('Failed to log compliance event:', error)
    }
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    eventData: SecurityEventData,
    context: AuditContext
  ): Promise<SecurityEvent> {
    try {
      const securityEvent = await prisma.securityEvent.create({
        data: {
          eventType: eventData.eventType,
          severity: eventData.severity,
          description: eventData.description,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          userId: context.userId,
          organizationId: context.organizationId,
          resourceType: eventData.resourceType,
          resourceId: eventData.resourceId,
          riskScore: eventData.riskScore,
          metadata: {
            ...eventData.metadata,
            sessionId: context.sessionId,
            timestamp: new Date().toISOString(),
          },
        },
      })

      // Auto-resolve low severity events after logging
      if (eventData.severity === 'low') {
        await this.resolveSecurityEvent(securityEvent.id, 'auto_resolved')
      }

      return securityEvent
    } catch (error) {
      console.error('Failed to log security event:', error)
      throw error
    }
  }

  /**
   * Bulk audit logging for batch operations
   */
  static async logBulkAuditEvents(
    changes: AuditableChange[],
    context: AuditContext
  ): Promise<void> {
    try {
      const auditLogs = changes.map(change => ({
        action: change.action,
        entityType: change.entityType,
        entityId: change.entityId,
        oldValues: change.oldValues || null,
        newValues: change.newValues || null,
        metadata: {
          ...change.metadata,
          ...context.metadata,
          timestamp: new Date().toISOString(),
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        organizationId: context.organizationId!,
        userId: context.userId,
      }))

      await prisma.auditLog.createMany({
        data: auditLogs,
      })
    } catch (error) {
      console.error('Failed to log bulk audit events:', error)
    }
  }

  /**
   * Get audit trail for specific entity
   */
  static async getAuditTrail(
    entityType: string,
    entityId: string,
    organizationId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    try {
      return await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
          organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    } catch (error) {
      console.error('Failed to get audit trail:', error)
      throw error
    }
  }

  /**
   * Get security events for organization
   */
  static async getSecurityEvents(
    organizationId: string,
    options: {
      severity?: string[]
      resolved?: boolean
      limit?: number
      offset?: number
    } = {}
  ): Promise<SecurityEvent[]> {
    try {
      const where: any = {
        organizationId,
      }

      if (options.severity) {
        where.severity = { in: options.severity }
      }

      if (options.resolved !== undefined) {
        where.resolved = options.resolved
      }

      return await prisma.securityEvent.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    } catch (error) {
      console.error('Failed to get security events:', error)
      throw error
    }
  }

  /**
   * Resolve security event
   */
  static async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    resolution?: string
  ): Promise<SecurityEvent> {
    try {
      return await prisma.securityEvent.update({
        where: { id: eventId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy,
          metadata: {
            resolution,
            resolvedAt: new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      console.error('Failed to resolve security event:', error)
      throw error
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private static async checkForSuspiciousActivity(
    change: AuditableChange,
    context: AuditContext
  ): Promise<void> {
    try {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      // Check for rapid successive actions
      const recentActions = await prisma.auditLog.count({
        where: {
          userId: context.userId,
          organizationId: context.organizationId,
          action: change.action,
          entityType: change.entityType,
          createdAt: {
            gte: fiveMinutesAgo,
          },
        },
      })

      if (recentActions > 10) {
        await this.logSecurityEvent({
          eventType: 'suspicious_activity',
          severity: 'high',
          description: `User ${context.userId} performed ${recentActions} ${change.action} actions on ${change.entityType} in 5 minutes`,
          resourceType: change.entityType,
          resourceId: change.entityId,
          riskScore: 70,
          metadata: {
            actionCount: recentActions,
            timeWindow: '5_minutes',
            actionType: change.action,
          },
        }, context)
      }

      // Check for access from new IP address
      if (context.ipAddress) {
        const recentIPs = await prisma.auditLog.findMany({
          where: {
            userId: context.userId,
            organizationId: context.organizationId,
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours
            },
          },
          select: {
            ipAddress: true,
          },
          distinct: ['ipAddress'],
        })

        const knownIPs = recentIPs.map(log => log.ipAddress).filter(Boolean)

        if (!knownIPs.includes(context.ipAddress)) {
          await this.logSecurityEvent({
            eventType: 'new_ip_access',
            severity: 'medium',
            description: `User ${context.userId} accessed from new IP address: ${context.ipAddress}`,
            resourceType: 'user',
            resourceId: context.userId,
            riskScore: 40,
            metadata: {
              newIP: context.ipAddress,
              knownIPs: knownIPs.slice(0, 5), // Limit for privacy
            },
          }, context)
        }
      }
    } catch (error) {
      console.error('Failed to check for suspicious activity:', error)
    }
  }

  /**
   * Check if action is sensitive and requires extra monitoring
   */
  private static isSensitiveAction(action: string, entityType: string): boolean {
    const sensitiveActions = ['delete', 'export', 'login', 'logout']
    const sensitiveEntities = ['user', 'client', 'document', 'financial_data']

    return sensitiveActions.includes(action) || sensitiveEntities.includes(entityType)
  }

  /**
   * Create audit context from session and request
   */
  static createAuditContext(
    session: Session | null,
    req?: {
      ip?: string
      headers?: Record<string, string | string[] | undefined>
    }
  ): AuditContext {
    return {
      userId: session?.user?.id,
      organizationId: session?.user?.organizationId,
      sessionId: session?.sessionId,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] as string || req?.headers?.['x-real-ip'] as string,
      userAgent: req?.headers?.['user-agent'] as string,
    }
  }

  /**
   * Generate audit report for compliance
   */
  static async generateAuditReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    entityTypes?: string[]
  ): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsByUser: Record<string, number>
    securityEvents: number
    complianceEvents: number
  }> {
    try {
      const where = {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(entityTypes && { entityType: { in: entityTypes } }),
      }

      const [
        totalEvents,
        auditLogs,
        securityEvents,
        complianceEvents,
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          select: {
            action: true,
            entityType: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.securityEvent.count({
          where: {
            organizationId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.complianceEvent.count({
          where: {
            organizationId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ])

      // Aggregate events by type
      const eventsByType: Record<string, number> = {}
      const eventsByUser: Record<string, number> = {}

      auditLogs.forEach(log => {
        const key = `${log.entityType}:${log.action}`
        eventsByType[key] = (eventsByType[key] || 0) + 1

        if (log.user) {
          const userKey = `${log.user.name} (${log.user.email})`
          eventsByUser[userKey] = (eventsByUser[userKey] || 0) + 1
        }
      })

      return {
        totalEvents,
        eventsByType,
        eventsByUser,
        securityEvents,
        complianceEvents,
      }
    } catch (error) {
      console.error('Failed to generate audit report:', error)
      throw error
    }
  }
}

export { AuditService as auditService }