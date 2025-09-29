import { Redis } from 'ioredis'
import { prisma } from '../db'
import { z } from 'zod'
import crypto from 'crypto'
import { SecurityMonitoringService } from './security-monitoring.service'

// Security configuration schemas
const SecurityPolicySchema = z.object({
  organizationId: z.string(),
  passwordPolicy: z.object({
    minLength: z.number().min(8).default(12),
    requireUppercase: z.boolean().default(true),
    requireLowercase: z.boolean().default(true),
    requireNumbers: z.boolean().default(true),
    requireSpecialChars: z.boolean().default(true),
    preventReuse: z.number().min(0).default(5),
    maxAge: z.number().min(0).default(90) // days
  }),
  sessionPolicy: z.object({
    maxSessions: z.number().min(1).default(5),
    sessionTimeout: z.number().min(300).default(3600), // seconds
    requireReauthForSensitive: z.boolean().default(true),
    ipLocking: z.boolean().default(false),
    deviceFingerprinting: z.boolean().default(true)
  }),
  accessPolicy: z.object({
    ipWhitelist: z.array(z.string().ip()).optional(),
    ipBlacklist: z.array(z.string().ip()).optional(),
    allowedCountries: z.array(z.string()).optional(),
    blockedCountries: z.array(z.string()).optional(),
    businessHoursOnly: z.boolean().default(false),
    businessHours: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
      timezone: z.string()
    }).optional()
  }),
  dataPolicy: z.object({
    encryptionRequired: z.boolean().default(true),
    dataRetentionDays: z.number().min(1).default(2555), // 7 years
    anonymizationRequired: z.boolean().default(true),
    exportRestrictions: z.boolean().default(true),
    piiDetection: z.boolean().default(true)
  }),
  apiPolicy: z.object({
    maxRequestSize: z.number().min(1024).default(10485760), // 10MB
    allowedMethods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    corsOrigins: z.array(z.string()).optional(),
    webhookVerification: z.boolean().default(true),
    apiKeyRequired: z.boolean().default(false)
  })
})

interface SecurityViolation {
  id: string
  type: 'policy_violation' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
  details: Record<string, any>
  timestamp: Date
  resolved: boolean
}

interface ThreatResponse {
  action: 'allow' | 'block' | 'challenge' | 'monitor'
  reason: string
  confidence: number
  metadata: Record<string, any>
}

interface SecurityContext {
  ipAddress: string
  userAgent: string
  country?: string
  organization?: any
  user?: any
  session?: any
  deviceFingerprint?: string
  riskScore: number
}

export class ApiSecurityService {
  private securityPolicies = new Map<string, any>()
  private threatIntelligence = new Map<string, any>()
  private deviceFingerprints = new Map<string, any>()

  constructor(
    private redis: Redis,
    private securityMonitoring: SecurityMonitoringService
  ) {
    this.initializeSecurityPolicies()
  }

  // SECURITY POLICY MANAGEMENT

  async setSecurityPolicy(
    policy: z.infer<typeof SecurityPolicySchema>
  ): Promise<void> {
    const validatedPolicy = SecurityPolicySchema.parse(policy)

    // Store in database
    await prisma.organization.update({
      where: { id: policy.organizationId },
      data: {
        passwordPolicy: validatedPolicy.passwordPolicy,
        sessionTimeout: validatedPolicy.sessionPolicy.sessionTimeout,
        mfaRequired: false, // This would be set based on policy
        settings: {
          securityPolicy: validatedPolicy
        }
      }
    })

    // Cache for fast access
    this.securityPolicies.set(policy.organizationId, validatedPolicy)
    await this.redis.setex(
      `security_policy:${policy.organizationId}`,
      3600,
      JSON.stringify(validatedPolicy)
    )
  }

  async getSecurityPolicy(organizationId: string): Promise<any> {
    // Check cache first
    let policy = this.securityPolicies.get(organizationId)

    if (!policy) {
      // Check Redis
      const cached = await this.redis.get(`security_policy:${organizationId}`)
      if (cached) {
        policy = JSON.parse(cached)
        this.securityPolicies.set(organizationId, policy)
      } else {
        // Load from database
        const org = await prisma.organization.findUnique({
          where: { id: organizationId }
        })

        if (org?.settings?.securityPolicy) {
          policy = org.settings.securityPolicy
          this.securityPolicies.set(organizationId, policy)
          await this.redis.setex(
            `security_policy:${organizationId}`,
            3600,
            JSON.stringify(policy)
          )
        }
      }
    }

    return policy || this.getDefaultSecurityPolicy()
  }

  private getDefaultSecurityPolicy(): any {
    return SecurityPolicySchema.parse({ organizationId: 'default' })
  }

  // REQUEST SECURITY VALIDATION

  async validateRequest(
    context: SecurityContext,
    endpoint: string,
    method: string,
    payload?: any
  ): Promise<ThreatResponse> {
    let riskScore = 0
    const reasons: string[] = []
    const metadata: Record<string, any> = {}

    // Get security policy
    const policy = context.organization
      ? await this.getSecurityPolicy(context.organization.id)
      : this.getDefaultSecurityPolicy()

    // Check IP restrictions
    const ipCheck = await this.checkIpRestrictions(context, policy)
    riskScore += ipCheck.riskScore
    if (ipCheck.blocked) {
      return {
        action: 'block',
        reason: 'IP address blocked by security policy',
        confidence: 95,
        metadata: { ipAddress: context.ipAddress, reason: ipCheck.reason }
      }
    }

    // Check geolocation restrictions
    const geoCheck = await this.checkGeolocationRestrictions(context, policy)
    riskScore += geoCheck.riskScore
    if (geoCheck.blocked) {
      return {
        action: 'block',
        reason: 'Geographic location blocked',
        confidence: 90,
        metadata: { country: context.country, reason: geoCheck.reason }
      }
    }

    // Check business hours restrictions
    const timeCheck = await this.checkBusinessHours(context, policy)
    riskScore += timeCheck.riskScore
    if (timeCheck.blocked) {
      return {
        action: 'block',
        reason: 'Access outside business hours',
        confidence: 80,
        metadata: { currentTime: new Date(), businessHours: policy.accessPolicy.businessHours }
      }
    }

    // Check request size limits
    if (payload) {
      const sizeCheck = await this.checkRequestSize(payload, policy)
      riskScore += sizeCheck.riskScore
      if (sizeCheck.blocked) {
        return {
          action: 'block',
          reason: 'Request size exceeds limit',
          confidence: 100,
          metadata: { size: sizeCheck.size, limit: policy.apiPolicy.maxRequestSize }
        }
      }
    }

    // Check for injection attacks
    const injectionCheck = await this.checkInjectionAttacks(payload, endpoint)
    riskScore += injectionCheck.riskScore
    if (injectionCheck.blocked) {
      await this.securityMonitoring.logSecurityEvent({
        eventType: 'injection_attack',
        severity: 'high',
        description: 'Injection attack detected',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId: context.user?.id,
        organizationId: context.organization?.id,
        metadata: {
          endpoint,
          method,
          attackType: injectionCheck.attackType
        }
      })

      return {
        action: 'block',
        reason: 'Malicious input detected',
        confidence: 95,
        metadata: { attackType: injectionCheck.attackType }
      }
    }

    // Check user behavior anomalies
    if (context.user) {
      const behaviorCheck = await this.checkUserBehaviorAnomalies(context, endpoint)
      riskScore += behaviorCheck.riskScore
      reasons.push(...behaviorCheck.reasons)
    }

    // Check device fingerprint
    if (context.deviceFingerprint) {
      const deviceCheck = await this.checkDeviceFingerprint(context)
      riskScore += deviceCheck.riskScore
      reasons.push(...deviceCheck.reasons)
    }

    // Check threat intelligence
    const threatCheck = await this.checkThreatIntelligence(context.ipAddress)
    riskScore += threatCheck.riskScore
    if (threatCheck.blocked) {
      return {
        action: 'block',
        reason: 'Known threat source',
        confidence: 98,
        metadata: threatCheck.metadata
      }
    }

    // Determine final action based on risk score
    if (riskScore >= 80) {
      return {
        action: 'block',
        reason: 'High risk score',
        confidence: Math.min(95, riskScore),
        metadata: { riskScore, reasons }
      }
    } else if (riskScore >= 60) {
      return {
        action: 'challenge',
        reason: 'Medium risk score',
        confidence: Math.min(80, riskScore),
        metadata: { riskScore, reasons }
      }
    } else if (riskScore >= 30) {
      return {
        action: 'monitor',
        reason: 'Elevated risk score',
        confidence: Math.min(70, riskScore),
        metadata: { riskScore, reasons }
      }
    }

    return {
      action: 'allow',
      reason: 'Low risk score',
      confidence: 100 - riskScore,
      metadata: { riskScore, reasons }
    }
  }

  // INPUT VALIDATION AND SANITIZATION

  async sanitizeInput(input: any, context: { endpoint: string; organizationId?: string }): Promise<any> {
    if (!input || typeof input !== 'object') {
      return input
    }

    const sanitized = JSON.parse(JSON.stringify(input))

    // Remove potentially dangerous fields
    this.removeDangerousFields(sanitized)

    // Sanitize string values
    this.sanitizeStringValues(sanitized)

    // Validate against schema if available
    await this.validateAgainstSchema(sanitized, context)

    return sanitized
  }

  private removeDangerousFields(obj: any): void {
    const dangerousFields = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'function',
      'script'
    ]

    for (const key in obj) {
      if (dangerousFields.includes(key.toLowerCase())) {
        delete obj[key]
        continue
      }

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.removeDangerousFields(obj[key])
      }
    }
  }

  private sanitizeStringValues(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/[<>]/g, '')
          .trim()
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeStringValues(obj[key])
      }
    }
  }

  private async validateAgainstSchema(input: any, context: any): Promise<void> {
    // This would validate against endpoint-specific schemas
    // For now, just check for common validation rules

    const validationRules = await this.getValidationRules(context.endpoint)

    for (const rule of validationRules) {
      if (!this.validateRule(input, rule)) {
        throw new Error(`Validation failed: ${rule.message}`)
      }
    }
  }

  private async getValidationRules(endpoint: string): Promise<any[]> {
    // Return endpoint-specific validation rules
    // This would be configurable per organization
    return [
      {
        field: 'email',
        type: 'email',
        message: 'Invalid email format'
      },
      {
        field: 'phone',
        type: 'phone',
        message: 'Invalid phone format'
      }
    ]
  }

  private validateRule(input: any, rule: any): boolean {
    // Simple validation rule implementation
    if (rule.field in input) {
      const value = input[rule.field]

      switch (rule.type) {
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        case 'phone':
          return /^\+?[\d\s\-\(\)]+$/.test(value)
        default:
          return true
      }
    }

    return true
  }

  // SECURITY CHECK METHODS

  private async checkIpRestrictions(context: SecurityContext, policy: any): Promise<any> {
    const { ipAddress } = context
    const { ipWhitelist, ipBlacklist } = policy.accessPolicy

    // Check blacklist first
    if (ipBlacklist && ipBlacklist.includes(ipAddress)) {
      return {
        blocked: true,
        riskScore: 100,
        reason: 'IP address is blacklisted'
      }
    }

    // Check whitelist if configured
    if (ipWhitelist && ipWhitelist.length > 0 && !ipWhitelist.includes(ipAddress)) {
      return {
        blocked: true,
        riskScore: 90,
        reason: 'IP address not in whitelist'
      }
    }

    return { blocked: false, riskScore: 0 }
  }

  private async checkGeolocationRestrictions(context: SecurityContext, policy: any): Promise<any> {
    const { country } = context
    const { allowedCountries, blockedCountries } = policy.accessPolicy

    if (!country) {
      return { blocked: false, riskScore: 10 } // Slight risk for unknown location
    }

    if (blockedCountries && blockedCountries.includes(country)) {
      return {
        blocked: true,
        riskScore: 85,
        reason: 'Country is blocked'
      }
    }

    if (allowedCountries && allowedCountries.length > 0 && !allowedCountries.includes(country)) {
      return {
        blocked: true,
        riskScore: 80,
        reason: 'Country not in allowed list'
      }
    }

    return { blocked: false, riskScore: 0 }
  }

  private async checkBusinessHours(context: SecurityContext, policy: any): Promise<any> {
    const { businessHoursOnly, businessHours } = policy.accessPolicy

    if (!businessHoursOnly || !businessHours) {
      return { blocked: false, riskScore: 0 }
    }

    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const currentTime = hour * 60 + minute

    const [startHour, startMinute] = businessHours.start.split(':').map(Number)
    const [endHour, endMinute] = businessHours.end.split(':').map(Number)
    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute

    if (currentTime < startTime || currentTime > endTime) {
      return {
        blocked: true,
        riskScore: 70,
        reason: 'Access outside business hours'
      }
    }

    return { blocked: false, riskScore: 0 }
  }

  private async checkRequestSize(payload: any, policy: any): Promise<any> {
    const size = JSON.stringify(payload).length
    const limit = policy.apiPolicy.maxRequestSize

    if (size > limit) {
      return {
        blocked: true,
        riskScore: 60,
        size,
        reason: 'Request size exceeds limit'
      }
    }

    return { blocked: false, riskScore: 0 }
  }

  private async checkInjectionAttacks(payload: any, endpoint: string): Promise<any> {
    if (!payload) {
      return { blocked: false, riskScore: 0 }
    }

    const payloadString = JSON.stringify(payload).toLowerCase()

    // SQL Injection patterns
    const sqlPatterns = [
      /union\s+select/,
      /drop\s+table/,
      /delete\s+from/,
      /insert\s+into/,
      /update\s+set/,
      /exec\s*\(/,
      /xp_cmdshell/,
      /sp_executesql/
    ]

    for (const pattern of sqlPatterns) {
      if (pattern.test(payloadString)) {
        return {
          blocked: true,
          riskScore: 95,
          attackType: 'sql_injection'
        }
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/,
      /javascript:/,
      /on\w+\s*=/,
      /<iframe/,
      /<object/,
      /<embed/
    ]

    for (const pattern of xssPatterns) {
      if (pattern.test(payloadString)) {
        return {
          blocked: true,
          riskScore: 90,
          attackType: 'xss'
        }
      }
    }

    // Command injection patterns
    const cmdPatterns = [
      /;\s*(cat|ls|pwd|whoami|id|uname)/,
      /\|\s*(cat|ls|pwd|whoami|id|uname)/,
      /`.*`/,
      /\$\(.*\)/
    ]

    for (const pattern of cmdPatterns) {
      if (pattern.test(payloadString)) {
        return {
          blocked: true,
          riskScore: 95,
          attackType: 'command_injection'
        }
      }
    }

    return { blocked: false, riskScore: 0 }
  }

  private async checkUserBehaviorAnomalies(context: SecurityContext, endpoint: string): Promise<any> {
    const { user, organization } = context
    let riskScore = 0
    const reasons: string[] = []

    if (!user) return { riskScore, reasons }

    // Check for unusual access patterns
    const accessPattern = await this.getUserAccessPattern(user.id, organization?.id)

    // Check for unusual time access
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      riskScore += 15
      reasons.push('Access during unusual hours')
    }

    // Check for unusual endpoint access
    if (!accessPattern.commonEndpoints.includes(endpoint)) {
      riskScore += 10
      reasons.push('Accessing unusual endpoint')
    }

    // Check for rapid requests
    const recentRequests = await this.getRecentRequestCount(user.id)
    if (recentRequests > 100) { // 100 requests in last minute
      riskScore += 25
      reasons.push('High request frequency')
    }

    return { riskScore, reasons }
  }

  private async checkDeviceFingerprint(context: SecurityContext): Promise<any> {
    const { deviceFingerprint, user } = context
    let riskScore = 0
    const reasons: string[] = []

    if (!deviceFingerprint || !user) return { riskScore, reasons }

    // Check if this is a known device for the user
    const knownDevice = await this.isKnownDevice(user.id, deviceFingerprint)

    if (!knownDevice) {
      riskScore += 20
      reasons.push('Unknown device')

      // Store new device fingerprint
      await this.storeDeviceFingerprint(user.id, deviceFingerprint, context)
    }

    return { riskScore, reasons }
  }

  private async checkThreatIntelligence(ipAddress: string): Promise<any> {
    const threat = await this.securityMonitoring.checkThreatIntelligence(ipAddress)

    if (!threat) {
      return { blocked: false, riskScore: 0 }
    }

    if (threat.threatLevel === 'critical' || threat.threatLevel === 'high') {
      return {
        blocked: true,
        riskScore: 95,
        metadata: {
          threatLevel: threat.threatLevel,
          threatTypes: threat.threatTypes,
          source: threat.source
        }
      }
    }

    return {
      blocked: false,
      riskScore: threat.threatLevel === 'medium' ? 30 : 10
    }
  }

  // HELPER METHODS

  private async getUserAccessPattern(userId: string, organizationId?: string): Promise<any> {
    // Get user's typical access patterns from audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      take: 1000
    })

    const commonEndpoints = [...new Set(auditLogs.map(log => log.entityType))]
    const commonHours = this.getCommonAccessHours(auditLogs)

    return {
      commonEndpoints,
      commonHours,
      totalRequests: auditLogs.length
    }
  }

  private getCommonAccessHours(auditLogs: any[]): number[] {
    const hourCounts = new Array(24).fill(0)

    auditLogs.forEach(log => {
      const hour = log.createdAt.getHours()
      hourCounts[hour]++
    })

    // Return hours with above-average activity
    const avgActivity = hourCounts.reduce((a, b) => a + b, 0) / 24
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > avgActivity)
      .map(item => item.hour)
  }

  private async getRecentRequestCount(userId: string): Promise<number> {
    const oneMinuteAgo = new Date(Date.now() - 60000)

    return await prisma.auditLog.count({
      where: {
        userId,
        createdAt: {
          gte: oneMinuteAgo
        }
      }
    })
  }

  private async isKnownDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    const cacheKey = `device:${userId}:${deviceFingerprint}`
    const cached = await this.redis.get(cacheKey)

    if (cached) {
      return true
    }

    // Check database
    const knownDevice = await prisma.userSession.findFirst({
      where: {
        userId,
        deviceInfo: {
          path: ['fingerprint'],
          equals: deviceFingerprint
        }
      }
    })

    if (knownDevice) {
      await this.redis.setex(cacheKey, 86400, 'true') // Cache for 24 hours
      return true
    }

    return false
  }

  private async storeDeviceFingerprint(
    userId: string,
    deviceFingerprint: string,
    context: SecurityContext
  ): Promise<void> {
    const deviceInfo = {
      fingerprint: deviceFingerprint,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      country: context.country,
      firstSeen: new Date()
    }

    this.deviceFingerprints.set(`${userId}:${deviceFingerprint}`, deviceInfo)

    // Store in Redis for distributed access
    const cacheKey = `device:${userId}:${deviceFingerprint}`
    await this.redis.setex(cacheKey, 86400, JSON.stringify(deviceInfo))
  }

  private async initializeSecurityPolicies(): Promise<void> {
    // Load security policies for all organizations from database
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        settings: true,
        passwordPolicy: true,
        sessionTimeout: true,
        mfaRequired: true
      }
    })

    for (const org of organizations) {
      if (org.settings?.securityPolicy) {
        this.securityPolicies.set(org.id, org.settings.securityPolicy)
      }
    }
  }

  // DATA PROTECTION METHODS

  async detectPII(data: any): Promise<{ found: boolean; types: string[]; locations: string[] }> {
    const piiTypes: string[] = []
    const locations: string[] = []

    if (typeof data === 'object' && data !== null) {
      this.scanForPII(data, '', piiTypes, locations)
    } else if (typeof data === 'string') {
      this.scanStringForPII(data, '', piiTypes, locations)
    }

    return {
      found: piiTypes.length > 0,
      types: [...new Set(piiTypes)],
      locations: [...new Set(locations)]
    }
  }

  private scanForPII(obj: any, path: string, types: string[], locations: string[]): void {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key
      const value = obj[key]

      if (typeof value === 'string') {
        this.scanStringForPII(value, currentPath, types, locations)
      } else if (typeof value === 'object' && value !== null) {
        this.scanForPII(value, currentPath, types, locations)
      }
    }
  }

  private scanStringForPII(text: string, location: string, types: string[], locations: string[]): void {
    // Email detection
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
      types.push('email')
      locations.push(location)
    }

    // Phone number detection
    if (/\b(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/.test(text)) {
      types.push('phone')
      locations.push(location)
    }

    // SSN detection
    if (/\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/.test(text)) {
      types.push('ssn')
      locations.push(location)
    }

    // Credit card detection
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) {
      types.push('credit_card')
      locations.push(location)
    }
  }

  async anonymizeData(data: any, organizationId: string): Promise<any> {
    const policy = await this.getSecurityPolicy(organizationId)

    if (!policy.dataPolicy.anonymizationRequired) {
      return data
    }

    return this.performAnonymization(JSON.parse(JSON.stringify(data)))
  }

  private performAnonymization(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    for (const key in obj) {
      const value = obj[key]

      if (typeof value === 'string') {
        // Anonymize based on field name or content
        if (this.isPIIField(key)) {
          obj[key] = this.anonymizeString(value, key)
        }
      } else if (typeof value === 'object' && value !== null) {
        obj[key] = this.performAnonymization(value)
      }
    }

    return obj
  }

  private isPIIField(fieldName: string): boolean {
    const piiFields = [
      'email', 'phone', 'ssn', 'social', 'creditcard', 'password',
      'name', 'firstname', 'lastname', 'address', 'zip', 'postal'
    ]

    return piiFields.some(pii => fieldName.toLowerCase().includes(pii))
  }

  private anonymizeString(value: string, fieldType: string): string {
    if (fieldType.toLowerCase().includes('email')) {
      return value.replace(/(.{2}).*(@.*)/, '$1***$2')
    }

    if (fieldType.toLowerCase().includes('phone')) {
      return value.replace(/(\d{3}).*(\d{4})/, '$1-***-$2')
    }

    if (fieldType.toLowerCase().includes('name')) {
      return value.replace(/./g, '*')
    }

    // Default anonymization
    return '*'.repeat(Math.min(value.length, 10))
  }
}

export type { SecurityViolation, ThreatResponse, SecurityContext }