import { prisma } from '../db'
import { Redis } from 'ioredis'
import { z } from 'zod'
import crypto from 'crypto'

// Security event schemas
const SecurityEventSchema = z.object({
  eventType: z.enum([
    'suspicious_login',
    'rate_limit_exceeded',
    'unauthorized_access',
    'data_breach_attempt',
    'injection_attack',
    'brute_force_attack',
    'account_takeover',
    'privilege_escalation',
    'data_exfiltration',
    'malicious_file_upload',
    'suspicious_api_usage',
    'anomalous_behavior'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  riskScore: z.number().min(0).max(100).optional()
})

const ThreatIntelligenceSchema = z.object({
  ipAddress: z.string().ip(),
  threatLevel: z.enum(['low', 'medium', 'high', 'critical']),
  threatTypes: z.array(z.string()),
  source: z.string(),
  lastSeen: z.date(),
  confidence: z.number().min(0).max(100),
  metadata: z.record(z.any()).optional()
})

interface SecurityMetrics {
  organizationId: string
  timeframe: 'hour' | 'day' | 'week' | 'month'
  totalEvents: number
  eventsBySeverity: Record<string, number>
  eventsByType: Record<string, number>
  topThreats: Array<{
    type: string
    count: number
    riskScore: number
  }>
  riskScore: number
  blockedRequests: number
  suspiciousIPs: string[]
  recommendations: string[]
}

interface AnomalyDetectionResult {
  isAnomaly: boolean
  anomalyScore: number
  anomalyType: string
  description: string
  recommendations: string[]
  metadata: Record<string, any>
}

interface SecurityAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  eventType: string
  organizationId?: string
  userId?: string
  count: number
  firstSeen: Date
  lastSeen: Date
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  metadata: Record<string, any>
}

export class SecurityMonitoringService {
  private threatIntelligence = new Map<string, any>()
  private baselineMetrics = new Map<string, any>()
  private alertingThresholds = {
    criticalEvents: 5,
    highEvents: 10,
    mediumEvents: 25,
    bruteForceAttempts: 10,
    rateLimitViolations: 50
  }

  constructor(private redis: Redis) {}

  // SECURITY EVENT MANAGEMENT

  async logSecurityEvent(event: z.infer<typeof SecurityEventSchema>): Promise<string> {
    // Validate event
    const validatedEvent = SecurityEventSchema.parse(event)

    // Calculate risk score if not provided
    if (!validatedEvent.riskScore) {
      validatedEvent.riskScore = this.calculateRiskScore(validatedEvent)
    }

    // Store in database
    const securityEvent = await prisma.securityEvent.create({
      data: {
        eventType: validatedEvent.eventType,
        severity: validatedEvent.severity,
        description: validatedEvent.description,
        ipAddress: validatedEvent.ipAddress,
        userAgent: validatedEvent.userAgent,
        userId: validatedEvent.userId,
        organizationId: validatedEvent.organizationId,
        resourceType: validatedEvent.resourceType,
        resourceId: validatedEvent.resourceId,
        riskScore: validatedEvent.riskScore,
        metadata: validatedEvent.metadata || {}
      }
    })

    // Store in Redis for real-time analysis
    const eventKey = `security_event:${securityEvent.id}`
    await this.redis.setex(eventKey, 3600, JSON.stringify(validatedEvent))

    // Update metrics
    await this.updateSecurityMetrics(validatedEvent)

    // Check for threat patterns
    await this.analyzeForThreats(validatedEvent)

    // Check if alert should be triggered
    await this.checkAlertingRules(validatedEvent)

    return securityEvent.id
  }

  async getSecurityEvents(
    organizationId: string,
    filters: {
      eventType?: string
      severity?: string
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ events: any[]; total: number }> {
    const where: any = {
      organizationId,
      ...(filters.eventType && { eventType: filters.eventType }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.startDate || filters.endDate) && {
        createdAt: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate })
        }
      }
    }

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0
      }),
      prisma.securityEvent.count({ where })
    ])

    return { events, total }
  }

  async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<void> {
    await prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolver: {
          connect: { id: resolvedBy }
        },
        metadata: {
          resolution
        }
      }
    })
  }

  // THREAT INTELLIGENCE

  async updateThreatIntelligence(
    threats: z.infer<typeof ThreatIntelligenceSchema>[]
  ): Promise<void> {
    for (const threat of threats) {
      const validatedThreat = ThreatIntelligenceSchema.parse(threat)

      // Store in memory for fast lookup
      this.threatIntelligence.set(validatedThreat.ipAddress, validatedThreat)

      // Store in Redis with TTL
      const threatKey = `threat_intel:${validatedThreat.ipAddress}`
      await this.redis.setex(threatKey, 86400, JSON.stringify(validatedThreat))
    }
  }

  async checkThreatIntelligence(ipAddress: string): Promise<any | null> {
    // Check memory cache first
    let threat = this.threatIntelligence.get(ipAddress)

    if (!threat) {
      // Check Redis
      const threatKey = `threat_intel:${ipAddress}`
      const cached = await this.redis.get(threatKey)
      if (cached) {
        threat = JSON.parse(cached)
        this.threatIntelligence.set(ipAddress, threat)
      }
    }

    return threat || null
  }

  async isKnownThreat(ipAddress: string): Promise<boolean> {
    const threat = await this.checkThreatIntelligence(ipAddress)
    return threat && (threat.threatLevel === 'high' || threat.threatLevel === 'critical')
  }

  // ANOMALY DETECTION

  async detectAnomalies(
    organizationId: string,
    userId?: string,
    timeWindow: number = 3600000 // 1 hour
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = []
    const now = new Date()
    const startTime = new Date(now.getTime() - timeWindow)

    // Check for login anomalies
    const loginAnomalies = await this.detectLoginAnomalies(organizationId, userId, startTime, now)
    anomalies.push(...loginAnomalies)

    // Check for API usage anomalies
    const apiAnomalies = await this.detectApiAnomalies(organizationId, userId, startTime, now)
    anomalies.push(...apiAnomalies)

    // Check for data access anomalies
    const dataAnomalies = await this.detectDataAccessAnomalies(organizationId, userId, startTime, now)
    anomalies.push(...dataAnomalies)

    return anomalies
  }

  private async detectLoginAnomalies(
    organizationId: string,
    userId: string | undefined,
    startTime: Date,
    endTime: Date
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = []

    // Get recent authentication attempts
    const authAttempts = await prisma.authAttempt.findMany({
      where: {
        organizationId,
        ...(userId && { userId }),
        createdAt: {
          gte: startTime,
          lte: endTime
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Check for unusual login times
    const currentHour = endTime.getHours()
    const isOffHours = currentHour < 6 || currentHour > 22

    if (isOffHours && authAttempts.length > 0) {
      anomalies.push({
        isAnomaly: true,
        anomalyScore: 60,
        anomalyType: 'unusual_login_time',
        description: 'Login attempts detected during off-hours',
        recommendations: ['Verify if this is legitimate user activity', 'Consider enabling MFA'],
        metadata: {
          hour: currentHour,
          attemptCount: authAttempts.length
        }
      })
    }

    // Check for multiple failed attempts
    const failedAttempts = authAttempts.filter(attempt => !attempt.success)
    if (failedAttempts.length >= 5) {
      anomalies.push({
        isAnomaly: true,
        anomalyScore: 80,
        anomalyType: 'brute_force_attack',
        description: 'Multiple failed login attempts detected',
        recommendations: ['Lock account temporarily', 'Notify user of suspicious activity'],
        metadata: {
          failedAttempts: failedAttempts.length,
          timeRange: { startTime, endTime }
        }
      })
    }

    // Check for logins from multiple IPs
    const uniqueIPs = new Set(authAttempts.map(attempt => attempt.ipAddress).filter(Boolean))
    if (uniqueIPs.size > 3) {
      anomalies.push({
        isAnomaly: true,
        anomalyScore: 70,
        anomalyType: 'multiple_ip_login',
        description: 'Login attempts from multiple IP addresses',
        recommendations: ['Verify user location', 'Check for account compromise'],
        metadata: {
          ipCount: uniqueIPs.size,
          ips: Array.from(uniqueIPs)
        }
      })
    }

    return anomalies
  }

  private async detectApiAnomalies(
    organizationId: string,
    userId: string | undefined,
    startTime: Date,
    endTime: Date
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = []

    // Get API usage data
    const apiUsage = await prisma.apiKeyUsage.findMany({
      where: {
        apiKey: {
          organizationId
        },
        timestamp: {
          gte: startTime,
          lte: endTime
        }
      },
      include: {
        apiKey: true
      }
    })

    if (apiUsage.length === 0) return anomalies

    // Calculate baseline metrics
    const baseline = await this.getBaselineMetrics(organizationId, 'api_usage')

    const currentRequestRate = apiUsage.length / (timeWindow / 60000) // requests per minute
    const baselineRate = baseline?.requestsPerMinute || 10

    // Check for unusual request volume
    if (currentRequestRate > baselineRate * 3) {
      anomalies.push({
        isAnomaly: true,
        anomalyScore: 75,
        anomalyType: 'unusual_api_volume',
        description: 'API request volume significantly higher than baseline',
        recommendations: ['Check for automated attacks', 'Review API key usage'],
        metadata: {
          currentRate: currentRequestRate,
          baselineRate,
          ratio: currentRequestRate / baselineRate
        }
      })
    }

    // Check for unusual error rates
    const errorRate = apiUsage.filter(usage => usage.statusCode >= 400).length / apiUsage.length
    if (errorRate > 0.3) { // 30% error rate
      anomalies.push({
        isAnomaly: true,
        anomalyScore: 65,
        anomalyType: 'high_error_rate',
        description: 'Unusually high API error rate detected',
        recommendations: ['Check for malicious requests', 'Review API authentication'],
        metadata: {
          errorRate,
          totalRequests: apiUsage.length,
          errorCount: apiUsage.filter(usage => usage.statusCode >= 400).length
        }
      })
    }

    return anomalies
  }

  private async detectDataAccessAnomalies(
    organizationId: string,
    userId: string | undefined,
    startTime: Date,
    endTime: Date
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = []

    // Get audit logs for data access
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(userId && { userId }),
        action: {
          in: ['read', 'export', 'download']
        },
        createdAt: {
          gte: startTime,
          lte: endTime
        }
      }
    })

    // Check for bulk data access
    if (auditLogs.length > 100) { // More than 100 read operations
      anomalies.push({
        isAnomaly: true,
        anomalyScore: 85,
        anomalyType: 'bulk_data_access',
        description: 'Unusual amount of data access detected',
        recommendations: ['Verify if bulk export is legitimate', 'Check for data exfiltration'],
        metadata: {
          accessCount: auditLogs.length,
          timeRange: { startTime, endTime }
        }
      })
    }

    // Check for access to sensitive data types
    const sensitiveAccess = auditLogs.filter(log =>
      log.entityType === 'client' ||
      log.entityType === 'document' ||
      log.entityType === 'invoice'
    )

    if (sensitiveAccess.length > 50) {
      anomalies.push({
        isAnomaly: true,
        anomalyScore: 80,
        anomalyType: 'sensitive_data_access',
        description: 'High volume of sensitive data access detected',
        recommendations: ['Review data access patterns', 'Verify user authorization'],
        metadata: {
          sensitiveAccessCount: sensitiveAccess.length,
          entityTypes: [...new Set(sensitiveAccess.map(log => log.entityType))]
        }
      })
    }

    return anomalies
  }

  // ALERTING SYSTEM

  async checkAlertingRules(event: any): Promise<void> {
    const orgId = event.organizationId || 'global'

    // Check for immediate critical alerts
    if (event.severity === 'critical') {
      await this.triggerAlert({
        severity: 'critical',
        title: 'Critical Security Event',
        description: event.description,
        eventType: event.eventType,
        organizationId: event.organizationId,
        userId: event.userId,
        metadata: event.metadata || {}
      })
    }

    // Check for pattern-based alerts
    await this.checkPatternAlerts(event)

    // Check for threshold-based alerts
    await this.checkThresholdAlerts(orgId)
  }

  private async checkPatternAlerts(event: any): Promise<void> {
    const timeWindow = 300000 // 5 minutes
    const now = Date.now()

    // Check for repeated events from same IP
    if (event.ipAddress) {
      const ipEventKey = `security_pattern:ip:${event.ipAddress}:${event.eventType}`
      const count = await this.redis.incr(ipEventKey)
      await this.redis.expire(ipEventKey, 300) // 5 minutes

      if (count >= 5) {
        await this.triggerAlert({
          severity: 'high',
          title: 'Repeated Security Events from IP',
          description: `Multiple ${event.eventType} events from IP ${event.ipAddress}`,
          eventType: 'repeated_events',
          organizationId: event.organizationId,
          metadata: {
            ipAddress: event.ipAddress,
            eventType: event.eventType,
            count
          }
        })
      }
    }

    // Check for escalating severity
    if (event.userId) {
      const userEventKey = `security_pattern:user:${event.userId}:severity`
      const pipeline = this.redis.pipeline()
      pipeline.zadd(userEventKey, now, event.severity)
      pipeline.expire(userEventKey, 300)
      await pipeline.exec()

      const recentEvents = await this.redis.zrangebyscore(userEventKey, now - timeWindow, now)
      if (recentEvents.includes('medium') && recentEvents.includes('high')) {
        await this.triggerAlert({
          severity: 'high',
          title: 'Escalating Security Risk',
          description: `User ${event.userId} has escalating security events`,
          eventType: 'escalating_risk',
          organizationId: event.organizationId,
          userId: event.userId,
          metadata: { recentEvents }
        })
      }
    }
  }

  private async checkThresholdAlerts(organizationId: string): Promise<void> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600000)

    // Count events by severity in the last hour
    const eventCounts = await prisma.securityEvent.groupBy({
      by: ['severity'],
      where: {
        organizationId,
        createdAt: {
          gte: oneHourAgo,
          lte: now
        }
      },
      _count: {
        severity: true
      }
    })

    const counts = eventCounts.reduce((acc, item) => {
      acc[item.severity] = item._count.severity
      return acc
    }, {} as Record<string, number>)

    // Check thresholds
    if ((counts.critical || 0) >= this.alertingThresholds.criticalEvents) {
      await this.triggerAlert({
        severity: 'critical',
        title: 'Critical Security Event Threshold Exceeded',
        description: `${counts.critical} critical security events in the last hour`,
        eventType: 'threshold_exceeded',
        organizationId,
        metadata: { threshold: this.alertingThresholds.criticalEvents, actual: counts.critical }
      })
    }

    if ((counts.high || 0) >= this.alertingThresholds.highEvents) {
      await this.triggerAlert({
        severity: 'high',
        title: 'High Security Event Threshold Exceeded',
        description: `${counts.high} high-severity security events in the last hour`,
        eventType: 'threshold_exceeded',
        organizationId,
        metadata: { threshold: this.alertingThresholds.highEvents, actual: counts.high }
      })
    }
  }

  private async triggerAlert(alertData: Omit<SecurityAlert, 'id' | 'count' | 'firstSeen' | 'lastSeen' | 'status'>): Promise<void> {
    const alertId = crypto.randomUUID()
    const alert: SecurityAlert = {
      id: alertId,
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      status: 'open',
      ...alertData
    }

    // Store alert
    const alertKey = `security_alert:${alertId}`
    await this.redis.setex(alertKey, 86400, JSON.stringify(alert)) // 24 hour retention

    // Add to alerts list for organization
    if (alert.organizationId) {
      const orgAlertsKey = `security_alerts:org:${alert.organizationId}`
      await this.redis.lpush(orgAlertsKey, alertId)
      await this.redis.expire(orgAlertsKey, 86400)
    }

    // Trigger notification (integrate with your notification service)
    await this.sendAlertNotification(alert)
  }

  private async sendAlertNotification(alert: SecurityAlert): Promise<void> {
    // This would integrate with your notification service (email, Slack, etc.)
    console.log('Security Alert:', {
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      organizationId: alert.organizationId
    })
  }

  // UTILITY METHODS

  private calculateRiskScore(event: any): number {
    let score = 0

    // Base score by severity
    const severityScores = { low: 10, medium: 30, high: 60, critical: 90 }
    score += severityScores[event.severity] || 0

    // Additional factors
    if (event.eventType === 'brute_force_attack') score += 20
    if (event.eventType === 'injection_attack') score += 30
    if (event.eventType === 'data_exfiltration') score += 40
    if (event.eventType === 'privilege_escalation') score += 35

    // Time-based factors
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) score += 10 // Off-hours

    return Math.min(100, score)
  }

  private async updateSecurityMetrics(event: any): Promise<void> {
    const now = new Date()
    const hour = now.toISOString().slice(0, 13)
    const day = now.toISOString().slice(0, 10)

    const pipeline = this.redis.pipeline()

    // Organization metrics
    if (event.organizationId) {
      const orgKey = `security_metrics:org:${event.organizationId}:${hour}`
      pipeline.hincrby(orgKey, 'total_events', 1)
      pipeline.hincrby(orgKey, `events_${event.severity}`, 1)
      pipeline.hincrby(orgKey, `events_${event.eventType}`, 1)
      pipeline.expire(orgKey, 72 * 3600) // 3 days
    }

    // Global metrics
    const globalKey = `security_metrics:global:${hour}`
    pipeline.hincrby(globalKey, 'total_events', 1)
    pipeline.hincrby(globalKey, `events_${event.severity}`, 1)
    pipeline.hincrby(globalKey, `events_${event.eventType}`, 1)
    pipeline.expire(globalKey, 72 * 3600)

    await pipeline.exec()
  }

  private async getBaselineMetrics(organizationId: string, metricType: string): Promise<any> {
    // This would calculate baseline metrics from historical data
    // For now, return default values
    const baselines = {
      api_usage: {
        requestsPerMinute: 10,
        errorRate: 0.05,
        averageResponseTime: 200
      },
      login_activity: {
        loginsPerHour: 5,
        failureRate: 0.02
      }
    }

    return baselines[metricType as keyof typeof baselines] || {}
  }

  private async analyzeForThreats(event: any): Promise<void> {
    // Check against threat intelligence
    if (event.ipAddress) {
      const isKnownThreat = await this.isKnownThreat(event.ipAddress)
      if (isKnownThreat) {
        await this.logSecurityEvent({
          eventType: 'suspicious_request',
          severity: 'high',
          description: 'Request from known threat IP',
          ipAddress: event.ipAddress,
          organizationId: event.organizationId,
          metadata: { originalEvent: event }
        })
      }
    }

    // Additional threat analysis logic would go here
  }

  // PUBLIC METHODS FOR INTEGRATION

  async getSecurityMetrics(
    organizationId: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<SecurityMetrics> {
    // Implementation for getting aggregated security metrics
    // This would query both Redis and database for comprehensive metrics

    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case 'hour':
        startDate = new Date(now.getTime() - 3600000)
        break
      case 'day':
        startDate = new Date(now.getTime() - 86400000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 604800000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 2592000000)
        break
    }

    // Get events from database
    const events = await prisma.securityEvent.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      }
    })

    // Calculate metrics
    const totalEvents = events.length
    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgRiskScore = events.length > 0
      ? events.reduce((sum, event) => sum + (event.riskScore || 0), 0) / events.length
      : 0

    return {
      organizationId,
      timeframe,
      totalEvents,
      eventsBySeverity,
      eventsByType,
      topThreats: Object.entries(eventsByType)
        .map(([type, count]) => ({ type, count, riskScore: avgRiskScore }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      riskScore: Math.round(avgRiskScore),
      blockedRequests: 0, // This would come from firewall/blocking logic
      suspiciousIPs: [...new Set(events.map(e => e.ipAddress).filter(Boolean))],
      recommendations: this.generateSecurityRecommendations(events)
    }
  }

  private generateSecurityRecommendations(events: any[]): string[] {
    const recommendations: string[] = []

    const criticalEvents = events.filter(e => e.severity === 'critical').length
    const bruteForceEvents = events.filter(e => e.eventType === 'brute_force_attack').length
    const injectionEvents = events.filter(e => e.eventType === 'injection_attack').length

    if (criticalEvents > 0) {
      recommendations.push('Immediate review of critical security events required')
    }

    if (bruteForceEvents > 3) {
      recommendations.push('Consider implementing account lockout policies')
      recommendations.push('Enable multi-factor authentication for all users')
    }

    if (injectionEvents > 0) {
      recommendations.push('Review and strengthen input validation')
      recommendations.push('Implement Web Application Firewall (WAF)')
    }

    if (events.length > 100) {
      recommendations.push('High security event volume - consider security audit')
    }

    return recommendations
  }
}

export type { SecurityMetrics, AnomalyDetectionResult, SecurityAlert }