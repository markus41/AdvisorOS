import { prisma } from '../db'
import { z } from 'zod'
import { Redis } from 'ioredis'
import { encryptionService } from './encryption.service'
import crypto from 'crypto'

// Audit event types for SOC 2 and GDPR compliance
export enum AuditEventType {
  // Authentication Events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_LOGIN_FAILED = 'user_login_failed',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',

  // Authorization Events
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHANGED = 'role_changed',
  ACCESS_CONTROL_VIOLATION = 'access_control_violation',

  // Data Events (GDPR Critical)
  DATA_CREATED = 'data_created',
  DATA_READ = 'data_read',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  DATA_ANONYMIZED = 'data_anonymized',
  DATA_PURGED = 'data_purged',

  // Financial Data Events
  FINANCIAL_DATA_ACCESSED = 'financial_data_accessed',
  FINANCIAL_REPORT_GENERATED = 'financial_report_generated',
  TAX_DOCUMENT_ACCESSED = 'tax_document_accessed',
  CLIENT_DATA_ACCESSED = 'client_data_accessed',

  // System Events
  SYSTEM_CONFIGURATION_CHANGED = 'system_configuration_changed',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  ENCRYPTION_KEY_ROTATED = 'encryption_key_rotated',

  // Security Events
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INJECTION_ATTEMPT = 'injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',

  // Integration Events
  API_KEY_CREATED = 'api_key_created',
  API_KEY_USED = 'api_key_used',
  API_KEY_REVOKED = 'api_key_revoked',
  WEBHOOK_RECEIVED = 'webhook_received',
  EXTERNAL_API_CALLED = 'external_api_called',

  // Compliance Events
  GDPR_REQUEST_SUBMITTED = 'gdpr_request_submitted',
  GDPR_REQUEST_FULFILLED = 'gdpr_request_fulfilled',
  DATA_RETENTION_POLICY_APPLIED = 'data_retention_policy_applied',
  COMPLIANCE_REPORT_GENERATED = 'compliance_report_generated'
}

// Severity levels for audit events
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Audit event schema
const AuditEventSchema = z.object({
  eventType: z.nativeEnum(AuditEventType),
  severity: z.nativeEnum(AuditSeverity),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(1000).optional(),
  resource: z.string().max(255).optional(),
  resourceId: z.string().optional(),
  action: z.string().max(100).optional(),
  outcome: z.enum(['success', 'failure', 'denied']).default('success'),
  description: z.string().max(1000),
  metadata: z.record(z.any()).optional(),
  sensitiveData: z.record(z.any()).optional(), // Will be encrypted
  riskScore: z.number().min(0).max(100).optional(),
  complianceContext: z.object({
    gdprRelevant: z.boolean().default(false),
    soc2Relevant: z.boolean().default(false),
    hipaaRelevant: z.boolean().default(false),
    pciRelevant: z.boolean().default(false),
    retentionPeriod: z.number().optional() // days
  }).optional()
})

interface AuditEvent extends z.infer<typeof AuditEventSchema> {
  id?: string
  timestamp?: Date
  correlationId?: string
  integrity?: string
}

interface AuditQuery {
  startDate?: Date
  endDate?: Date
  eventTypes?: AuditEventType[]
  severity?: AuditSeverity[]
  userId?: string
  organizationId?: string
  resource?: string
  outcome?: string
  page?: number
  limit?: number
  includeMetadata?: boolean
  includeSensitiveData?: boolean
}

interface AuditStatistics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  securityEvents: number
  complianceEvents: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

export class AuditLoggingService {
  private redis: Redis
  private batchSize = 100
  private batchTimeout = 5000 // 5 seconds
  private eventBatch: AuditEvent[] = []
  private batchTimer?: NodeJS.Timeout

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    this.initializeBatchProcessor()
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'correlationId' | 'integrity'>): Promise<string> {
    try {
      // Validate the event
      const validatedEvent = AuditEventSchema.parse(event)

      // Enrich the event with additional metadata
      const enrichedEvent: AuditEvent = {
        ...validatedEvent,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        correlationId: this.generateCorrelationId(),
      }

      // Calculate integrity hash
      enrichedEvent.integrity = await this.calculateIntegrityHash(enrichedEvent)

      // Add to batch for processing
      await this.addToBatch(enrichedEvent)

      // For critical events, process immediately
      if (enrichedEvent.severity === AuditSeverity.CRITICAL) {
        await this.processBatch()
      }

      return enrichedEvent.id!
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't throw error to avoid breaking application flow
      return 'error'
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    eventType: AuditEventType,
    userId: string,
    organizationId: string,
    metadata: any = {},
    context: {
      ipAddress?: string
      userAgent?: string
      sessionId?: string
      outcome?: 'success' | 'failure' | 'denied'
    } = {}
  ): Promise<string> {
    return this.logEvent({
      eventType,
      severity: this.getSeverityForAuthEvent(eventType),
      userId,
      organizationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      outcome: context.outcome || 'success',
      description: this.getDescriptionForEvent(eventType),
      metadata,
      complianceContext: {
        soc2Relevant: true,
        gdprRelevant: this.isGdprRelevant(eventType)
      }
    })
  }

  /**
   * Log data access events (GDPR critical)
   */
  async logDataAccess(
    eventType: AuditEventType,
    userId: string,
    organizationId: string,
    resource: string,
    resourceId: string,
    sensitiveFields: string[] = [],
    metadata: any = {},
    context: {
      ipAddress?: string
      userAgent?: string
      sessionId?: string
    } = {}
  ): Promise<string> {
    return this.logEvent({
      eventType,
      severity: AuditSeverity.MEDIUM,
      userId,
      organizationId,
      resource,
      resourceId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      description: `${eventType} - ${resource}:${resourceId}`,
      metadata: {
        ...metadata,
        sensitiveFieldsAccessed: sensitiveFields,
        resourceType: resource
      },
      complianceContext: {
        gdprRelevant: true,
        soc2Relevant: true,
        retentionPeriod: this.getRetentionPeriod(eventType)
      }
    })
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    description: string,
    riskScore: number,
    metadata: any = {},
    context: {
      userId?: string
      organizationId?: string
      ipAddress?: string
      userAgent?: string
      sessionId?: string
    } = {}
  ): Promise<string> {
    return this.logEvent({
      eventType,
      severity: this.getSeverityFromRiskScore(riskScore),
      userId: context.userId,
      organizationId: context.organizationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      description,
      riskScore,
      metadata,
      complianceContext: {
        soc2Relevant: true,
        gdprRelevant: false
      }
    })
  }

  /**
   * Log compliance events
   */
  async logComplianceEvent(
    eventType: AuditEventType,
    description: string,
    metadata: any = {},
    context: {
      userId?: string
      organizationId?: string
      gdprRelevant?: boolean
      soc2Relevant?: boolean
      hipaaRelevant?: boolean
      pciRelevant?: boolean
    } = {}
  ): Promise<string> {
    return this.logEvent({
      eventType,
      severity: AuditSeverity.HIGH,
      userId: context.userId,
      organizationId: context.organizationId,
      description,
      metadata,
      complianceContext: {
        gdprRelevant: context.gdprRelevant || false,
        soc2Relevant: context.soc2Relevant || false,
        hipaaRelevant: context.hipaaRelevant || false,
        pciRelevant: context.pciRelevant || false,
        retentionPeriod: 2555 // 7 years for compliance events
      }
    })
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditQuery): Promise<{
    events: AuditEvent[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const {
        startDate,
        endDate,
        eventTypes,
        severity,
        userId,
        organizationId,
        resource,
        outcome,
        page = 1,
        limit = 50,
        includeMetadata = true,
        includeSensitiveData = false
      } = query

      // Build where clause
      const where: any = {}

      if (startDate || endDate) {
        where.timestamp = {}
        if (startDate) where.timestamp.gte = startDate
        if (endDate) where.timestamp.lte = endDate
      }

      if (eventTypes?.length) {
        where.eventType = { in: eventTypes }
      }

      if (severity?.length) {
        where.severity = { in: severity }
      }

      if (userId) where.userId = userId
      if (organizationId) where.organizationId = organizationId
      if (resource) where.resource = resource
      if (outcome) where.outcome = outcome

      // Execute query
      const [events, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            eventType: true,
            severity: true,
            userId: true,
            organizationId: true,
            sessionId: true,
            ipAddress: true,
            userAgent: true,
            resource: true,
            resourceId: true,
            action: true,
            outcome: true,
            description: true,
            timestamp: true,
            correlationId: true,
            riskScore: true,
            complianceContext: true,
            metadata: includeMetadata,
            sensitiveData: includeSensitiveData,
            integrity: true
          }
        }),
        prisma.auditLog.count({ where })
      ])

      // Decrypt sensitive data if requested and authorized
      const processedEvents = await Promise.all(
        events.map(async (event) => {
          if (includeSensitiveData && event.sensitiveData) {
            try {
              const decrypted = await encryptionService.decryptFromStorage(
                event.sensitiveData as string,
                (event as any).sensitiveDataMetadata,
                'auditLog',
                'sensitiveData'
              )
              return { ...event, sensitiveData: decrypted }
            } catch (error) {
              console.error('Failed to decrypt sensitive audit data:', error)
              return { ...event, sensitiveData: '[ENCRYPTED]' }
            }
          }
          return event
        })
      )

      return {
        events: processedEvents,
        total,
        page,
        limit
      }
    } catch (error) {
      console.error('Failed to query audit logs:', error)
      throw new Error('Failed to retrieve audit logs')
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(
    organizationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditStatistics> {
    try {
      const where: any = {}

      if (organizationId) where.organizationId = organizationId
      if (startDate || endDate) {
        where.timestamp = {}
        if (startDate) where.timestamp.gte = startDate
        if (endDate) where.timestamp.lte = endDate
      }

      // Get basic statistics
      const [
        totalEvents,
        eventsByType,
        eventsBySeverity,
        securityEvents,
        complianceEvents
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['eventType'],
          where,
          _count: { eventType: true }
        }),
        prisma.auditLog.groupBy({
          by: ['severity'],
          where,
          _count: { severity: true }
        }),
        prisma.auditLog.count({
          where: {
            ...where,
            eventType: {
              in: [
                AuditEventType.SECURITY_VIOLATION,
                AuditEventType.SUSPICIOUS_ACTIVITY,
                AuditEventType.RATE_LIMIT_EXCEEDED,
                AuditEventType.INJECTION_ATTEMPT,
                AuditEventType.XSS_ATTEMPT
              ]
            }
          }
        }),
        prisma.auditLog.count({
          where: {
            ...where,
            OR: [
              { complianceContext: { path: ['gdprRelevant'], equals: true } },
              { complianceContext: { path: ['soc2Relevant'], equals: true } },
              { complianceContext: { path: ['hipaaRelevant'], equals: true } },
              { complianceContext: { path: ['pciRelevant'], equals: true } }
            ]
          }
        })
      ])

      // Process grouped results
      const eventsByTypeMap = eventsByType.reduce((acc, item) => {
        acc[item.eventType] = item._count.eventType
        return acc
      }, {} as Record<string, number>)

      const eventsBySeverityMap = eventsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count.severity
        return acc
      }, {} as Record<string, number>)

      return {
        totalEvents,
        eventsByType: eventsByTypeMap,
        eventsBySeverity: eventsBySeverityMap,
        securityEvents,
        complianceEvents,
        riskDistribution: {
          low: eventsBySeverityMap[AuditSeverity.LOW] || 0,
          medium: eventsBySeverityMap[AuditSeverity.MEDIUM] || 0,
          high: eventsBySeverityMap[AuditSeverity.HIGH] || 0,
          critical: eventsBySeverityMap[AuditSeverity.CRITICAL] || 0
        }
      }
    } catch (error) {
      console.error('Failed to get audit statistics:', error)
      throw new Error('Failed to retrieve audit statistics')
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogsForCompliance(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<{ data: string; filename: string }> {
    try {
      const query: AuditQuery = {
        organizationId,
        startDate,
        endDate,
        includeMetadata: true,
        includeSensitiveData: false, // Never export sensitive data
        limit: 10000 // Large limit for export
      }

      const result = await this.queryLogs(query)

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `audit-logs-${organizationId}-${timestamp}.${format}`

      let data: string

      if (format === 'csv') {
        data = this.convertToCSV(result.events)
      } else {
        data = JSON.stringify({
          exportInfo: {
            organizationId,
            startDate,
            endDate,
            exportedAt: new Date().toISOString(),
            totalEvents: result.total
          },
          events: result.events
        }, null, 2)
      }

      // Log the export
      await this.logComplianceEvent(
        AuditEventType.COMPLIANCE_REPORT_GENERATED,
        `Audit logs exported for organization ${organizationId}`,
        {
          startDate,
          endDate,
          format,
          eventCount: result.events.length
        },
        { organizationId, soc2Relevant: true, gdprRelevant: true }
      )

      return { data, filename }
    } catch (error) {
      console.error('Failed to export audit logs:', error)
      throw new Error('Failed to export audit logs')
    }
  }

  /**
   * Verify audit log integrity
   */
  async verifyIntegrity(eventId: string): Promise<{ valid: boolean; details: string }> {
    try {
      const event = await prisma.auditLog.findUnique({
        where: { id: eventId }
      })

      if (!event) {
        return { valid: false, details: 'Event not found' }
      }

      const calculatedHash = await this.calculateIntegrityHash(event as AuditEvent)

      if (calculatedHash === event.integrity) {
        return { valid: true, details: 'Integrity verified' }
      } else {
        return { valid: false, details: 'Integrity hash mismatch - possible tampering' }
      }
    } catch (error) {
      console.error('Failed to verify integrity:', error)
      return { valid: false, details: 'Verification failed' }
    }
  }

  // Private methods

  private async addToBatch(event: AuditEvent): Promise<void> {
    this.eventBatch.push(event)

    if (this.eventBatch.length >= this.batchSize) {
      await this.processBatch()
    }
  }

  private async processBatch(): Promise<void> {
    if (this.eventBatch.length === 0) return

    const batch = [...this.eventBatch]
    this.eventBatch = []

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }

    try {
      // Prepare events for database insertion
      const dbEvents = await Promise.all(
        batch.map(async (event) => {
          const dbEvent: any = {
            id: event.id,
            eventType: event.eventType,
            severity: event.severity,
            userId: event.userId,
            organizationId: event.organizationId,
            sessionId: event.sessionId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            resource: event.resource,
            resourceId: event.resourceId,
            action: event.action,
            outcome: event.outcome,
            description: event.description,
            timestamp: event.timestamp,
            correlationId: event.correlationId,
            riskScore: event.riskScore,
            complianceContext: event.complianceContext,
            metadata: event.metadata,
            integrity: event.integrity
          }

          // Encrypt sensitive data if present
          if (event.sensitiveData) {
            const encrypted = await encryptionService.encryptForStorage(
              event.sensitiveData,
              'auditLog',
              'sensitiveData'
            )
            dbEvent.sensitiveData = encrypted.data
            dbEvent.sensitiveDataMetadata = encrypted.metadata
          }

          return dbEvent
        })
      )

      // Insert in batches
      await prisma.auditLog.createMany({
        data: dbEvents
      })

      // Cache recent events in Redis for fast access
      await this.cacheRecentEvents(batch)

    } catch (error) {
      console.error('Failed to process audit batch:', error)
      // Add events back to batch for retry
      this.eventBatch.unshift(...batch)
    }
  }

  private initializeBatchProcessor(): void {
    // Process batch every 5 seconds
    setInterval(() => {
      if (this.eventBatch.length > 0) {
        this.processBatch()
      }
    }, this.batchTimeout)
  }

  private async cacheRecentEvents(events: AuditEvent[]): Promise<void> {
    try {
      for (const event of events) {
        const key = `audit:recent:${event.organizationId || 'global'}`
        await this.redis.lpush(key, JSON.stringify(event))
        await this.redis.ltrim(key, 0, 999) // Keep last 1000 events
        await this.redis.expire(key, 86400) // 24 hours
      }
    } catch (error) {
      console.error('Failed to cache audit events:', error)
    }
  }

  private async calculateIntegrityHash(event: AuditEvent): Promise<string> {
    const data = {
      id: event.id,
      eventType: event.eventType,
      timestamp: event.timestamp?.toISOString(),
      userId: event.userId,
      organizationId: event.organizationId,
      description: event.description,
      metadata: event.metadata
    }

    const dataString = JSON.stringify(data, Object.keys(data).sort())
    return crypto.createHash('sha256').update(dataString).digest('hex')
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
  }

  private getSeverityForAuthEvent(eventType: AuditEventType): AuditSeverity {
    switch (eventType) {
      case AuditEventType.USER_LOGIN_FAILED:
      case AuditEventType.ACCOUNT_LOCKED:
        return AuditSeverity.HIGH
      case AuditEventType.PASSWORD_CHANGE:
      case AuditEventType.MFA_ENABLED:
      case AuditEventType.MFA_DISABLED:
        return AuditSeverity.MEDIUM
      default:
        return AuditSeverity.LOW
    }
  }

  private getSeverityFromRiskScore(riskScore: number): AuditSeverity {
    if (riskScore >= 80) return AuditSeverity.CRITICAL
    if (riskScore >= 60) return AuditSeverity.HIGH
    if (riskScore >= 30) return AuditSeverity.MEDIUM
    return AuditSeverity.LOW
  }

  private getDescriptionForEvent(eventType: AuditEventType): string {
    const descriptions: Record<AuditEventType, string> = {
      [AuditEventType.USER_LOGIN]: 'User successfully logged in',
      [AuditEventType.USER_LOGOUT]: 'User logged out',
      [AuditEventType.USER_LOGIN_FAILED]: 'User login attempt failed',
      [AuditEventType.PASSWORD_CHANGE]: 'User password changed',
      [AuditEventType.MFA_ENABLED]: 'Multi-factor authentication enabled',
      [AuditEventType.MFA_DISABLED]: 'Multi-factor authentication disabled',
      [AuditEventType.ACCOUNT_LOCKED]: 'User account locked',
      [AuditEventType.ACCOUNT_UNLOCKED]: 'User account unlocked',
      [AuditEventType.PERMISSION_GRANTED]: 'Permission granted to user',
      [AuditEventType.PERMISSION_DENIED]: 'Permission denied to user',
      [AuditEventType.ROLE_CHANGED]: 'User role changed',
      [AuditEventType.ACCESS_CONTROL_VIOLATION]: 'Access control violation detected',
      [AuditEventType.DATA_CREATED]: 'Data created',
      [AuditEventType.DATA_READ]: 'Data accessed',
      [AuditEventType.DATA_UPDATED]: 'Data updated',
      [AuditEventType.DATA_DELETED]: 'Data deleted',
      [AuditEventType.DATA_EXPORTED]: 'Data exported',
      [AuditEventType.DATA_IMPORTED]: 'Data imported',
      [AuditEventType.DATA_ANONYMIZED]: 'Data anonymized',
      [AuditEventType.DATA_PURGED]: 'Data purged',
      [AuditEventType.FINANCIAL_DATA_ACCESSED]: 'Financial data accessed',
      [AuditEventType.FINANCIAL_REPORT_GENERATED]: 'Financial report generated',
      [AuditEventType.TAX_DOCUMENT_ACCESSED]: 'Tax document accessed',
      [AuditEventType.CLIENT_DATA_ACCESSED]: 'Client data accessed',
      [AuditEventType.SYSTEM_CONFIGURATION_CHANGED]: 'System configuration changed',
      [AuditEventType.BACKUP_CREATED]: 'Backup created',
      [AuditEventType.BACKUP_RESTORED]: 'Backup restored',
      [AuditEventType.ENCRYPTION_KEY_ROTATED]: 'Encryption key rotated',
      [AuditEventType.SECURITY_VIOLATION]: 'Security violation detected',
      [AuditEventType.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',
      [AuditEventType.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
      [AuditEventType.INJECTION_ATTEMPT]: 'Injection attempt detected',
      [AuditEventType.XSS_ATTEMPT]: 'XSS attempt detected',
      [AuditEventType.API_KEY_CREATED]: 'API key created',
      [AuditEventType.API_KEY_USED]: 'API key used',
      [AuditEventType.API_KEY_REVOKED]: 'API key revoked',
      [AuditEventType.WEBHOOK_RECEIVED]: 'Webhook received',
      [AuditEventType.EXTERNAL_API_CALLED]: 'External API called',
      [AuditEventType.GDPR_REQUEST_SUBMITTED]: 'GDPR request submitted',
      [AuditEventType.GDPR_REQUEST_FULFILLED]: 'GDPR request fulfilled',
      [AuditEventType.DATA_RETENTION_POLICY_APPLIED]: 'Data retention policy applied',
      [AuditEventType.COMPLIANCE_REPORT_GENERATED]: 'Compliance report generated'
    }

    return descriptions[eventType] || 'Unknown event'
  }

  private isGdprRelevant(eventType: AuditEventType): boolean {
    const gdprEvents = [
      AuditEventType.DATA_CREATED,
      AuditEventType.DATA_READ,
      AuditEventType.DATA_UPDATED,
      AuditEventType.DATA_DELETED,
      AuditEventType.DATA_EXPORTED,
      AuditEventType.DATA_ANONYMIZED,
      AuditEventType.DATA_PURGED,
      AuditEventType.CLIENT_DATA_ACCESSED,
      AuditEventType.GDPR_REQUEST_SUBMITTED,
      AuditEventType.GDPR_REQUEST_FULFILLED
    ]

    return gdprEvents.includes(eventType)
  }

  private getRetentionPeriod(eventType: AuditEventType): number {
    // Return retention period in days
    switch (eventType) {
      case AuditEventType.FINANCIAL_DATA_ACCESSED:
      case AuditEventType.TAX_DOCUMENT_ACCESSED:
        return 2555 // 7 years for financial/tax data
      case AuditEventType.GDPR_REQUEST_SUBMITTED:
      case AuditEventType.GDPR_REQUEST_FULFILLED:
        return 1095 // 3 years for GDPR events
      case AuditEventType.SECURITY_VIOLATION:
      case AuditEventType.SUSPICIOUS_ACTIVITY:
        return 365 // 1 year for security events
      default:
        return 2555 // 7 years default for compliance
    }
  }

  private convertToCSV(events: any[]): string {
    if (events.length === 0) return ''

    const headers = [
      'id', 'timestamp', 'eventType', 'severity', 'userId', 'organizationId',
      'resource', 'resourceId', 'action', 'outcome', 'description', 'ipAddress'
    ]

    const csvRows = [
      headers.join(','),
      ...events.map(event => {
        return headers.map(header => {
          const value = event[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      })
    ]

    return csvRows.join('\n')
  }
}

// Export singleton instance
export const auditLoggingService = new AuditLoggingService()

// Export types and enums
export type { AuditEvent, AuditQuery, AuditStatistics }