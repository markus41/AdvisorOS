import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'
import { SecurityMonitoringService } from './security-monitoring.service'

// Base validation schemas for common data types
export const BaseSchemas = {
  id: z.string().cuid().or(z.string().uuid()),
  email: z.string().email().max(255),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/),
  url: z.string().url().max(2000),
  text: z.string().max(1000),
  longText: z.string().max(10000),
  richText: z.string().max(50000),
  fileName: z.string().regex(/^[a-zA-Z0-9\-_\. ]+$/).max(255),
  ipAddress: z.string().ip(),
  dateString: z.string().datetime(),
  currency: z.number().positive().max(999999999.99),
  percentage: z.number().min(0).max(100),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/).optional(),
  ein: z.string().regex(/^\d{2}-\d{7}$/).optional()
}

// Organization-specific schemas
export const OrganizationSchemas = {
  create: z.object({
    name: BaseSchemas.text.min(2).max(100),
    subdomain: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),
    subscriptionTier: z.enum(['trial', 'basic', 'professional', 'enterprise']),
    industry: BaseSchemas.text.optional(),
    size: z.enum(['solo', 'small', 'medium', 'large']).optional(),
    settings: z.record(z.any()).optional()
  }),
  update: z.object({
    name: BaseSchemas.text.min(2).max(100).optional(),
    industry: BaseSchemas.text.optional(),
    size: z.enum(['solo', 'small', 'medium', 'large']).optional(),
    settings: z.record(z.any()).optional()
  })
}

// User-specific schemas
export const UserSchemas = {
  create: z.object({
    email: BaseSchemas.email,
    name: BaseSchemas.text.min(2).max(100),
    password: z.string().min(12).max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number, and special character'),
    role: z.enum(['owner', 'admin', 'manager', 'senior_cpa', 'cpa', 'staff', 'client']),
    organizationId: BaseSchemas.id
  }),
  update: z.object({
    name: BaseSchemas.text.min(2).max(100).optional(),
    role: z.enum(['owner', 'admin', 'manager', 'senior_cpa', 'cpa', 'staff', 'client']).optional(),
    isActive: z.boolean().optional()
  }),
  login: z.object({
    email: BaseSchemas.email,
    password: z.string().min(1).max(128),
    subdomain: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),
    rememberMe: z.boolean().optional(),
    twoFactorCode: z.string().regex(/^\d{6}$/).optional()
  })
}

// Client-specific schemas
export const ClientSchemas = {
  create: z.object({
    businessName: BaseSchemas.text.min(2).max(200),
    legalName: BaseSchemas.text.max(200).optional(),
    taxId: BaseSchemas.ein.optional(),
    industry: BaseSchemas.text.max(100).optional(),
    contactEmail: BaseSchemas.email,
    contactPhone: BaseSchemas.phone.optional(),
    address: z.object({
      street: BaseSchemas.text.max(200),
      city: BaseSchemas.text.max(100),
      state: z.string().regex(/^[A-Z]{2}$/),
      zipCode: BaseSchemas.zipCode,
      country: z.string().regex(/^[A-Z]{2}$/).default('US')
    }).optional(),
    organizationId: BaseSchemas.id
  }),
  update: z.object({
    businessName: BaseSchemas.text.min(2).max(200).optional(),
    legalName: BaseSchemas.text.max(200).optional(),
    industry: BaseSchemas.text.max(100).optional(),
    contactEmail: BaseSchemas.email.optional(),
    contactPhone: BaseSchemas.phone.optional(),
    address: z.object({
      street: BaseSchemas.text.max(200),
      city: BaseSchemas.text.max(100),
      state: z.string().regex(/^[A-Z]{2}$/),
      zipCode: BaseSchemas.zipCode,
      country: z.string().regex(/^[A-Z]{2}$/)
    }).optional()
  })
}

// Document-specific schemas
export const DocumentSchemas = {
  upload: z.object({
    fileName: BaseSchemas.fileName,
    fileType: z.enum(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'jpg', 'jpeg', 'png']),
    fileSize: z.number().positive().max(50 * 1024 * 1024), // 50MB max
    clientId: BaseSchemas.id.optional(),
    category: z.enum(['tax_return', 'financial_statement', 'invoice', 'receipt', 'contract', 'other']),
    description: BaseSchemas.text.optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    organizationId: BaseSchemas.id
  }),
  update: z.object({
    fileName: BaseSchemas.fileName.optional(),
    category: z.enum(['tax_return', 'financial_statement', 'invoice', 'receipt', 'contract', 'other']).optional(),
    description: BaseSchemas.text.optional(),
    tags: z.array(z.string().max(50)).max(10).optional()
  })
}

// API validation schemas
export const ApiSchemas = {
  pagination: z.object({
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  search: z.object({
    query: BaseSchemas.text.min(1).max(200),
    filters: z.record(z.any()).optional(),
    includeDeleted: z.boolean().default(false)
  }),
  bulkAction: z.object({
    action: z.enum(['delete', 'archive', 'restore', 'export']),
    ids: z.array(BaseSchemas.id).min(1).max(100),
    reason: BaseSchemas.text.optional()
  })
}

interface ValidationOptions {
  sanitize?: boolean
  stripUnknown?: boolean
  throwOnError?: boolean
  logValidationErrors?: boolean
}

interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: z.ZodError[]
  sanitizedData?: T
  securityIssues?: string[]
}

export class InputValidationService {
  private securityMonitoring: SecurityMonitoringService

  constructor(securityMonitoring: SecurityMonitoringService) {
    this.securityMonitoring = securityMonitoring
  }

  /**
   * Validate and sanitize input data
   */
  async validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options: ValidationOptions = {}
  ): Promise<ValidationResult<T>> {
    const {
      sanitize = true,
      stripUnknown = true,
      throwOnError = false,
      logValidationErrors = true
    } = options

    try {
      // Pre-sanitize data if requested
      let processedData = data
      if (sanitize) {
        const sanitizationResult = await this.sanitizeInput(data)
        processedData = sanitizationResult.data

        if (sanitizationResult.securityIssues.length > 0) {
          await this.logSecurityIssue('input_sanitization', sanitizationResult.securityIssues)
        }
      }

      // Configure schema based on options
      let workingSchema = schema
      if (stripUnknown) {
        workingSchema = schema.strict ? schema : (schema as any).strict()
      }

      // Validate the data
      const result = workingSchema.safeParse(processedData)

      if (result.success) {
        return {
          success: true,
          data: result.data,
          sanitizedData: sanitize ? result.data : undefined
        }
      } else {
        if (logValidationErrors) {
          await this.logValidationError(schema, data, result.error)
        }

        if (throwOnError) {
          throw result.error
        }

        return {
          success: false,
          errors: [result.error]
        }
      }
    } catch (error) {
      if (logValidationErrors) {
        await this.logValidationError(schema, data, error as z.ZodError)
      }

      if (throwOnError) {
        throw error
      }

      return {
        success: false,
        errors: error instanceof z.ZodError ? [error] : []
      }
    }
  }

  /**
   * Sanitize input data to prevent XSS and injection attacks
   */
  async sanitizeInput(data: unknown): Promise<{ data: any; securityIssues: string[] }> {
    const securityIssues: string[] = []

    if (data === null || data === undefined) {
      return { data, securityIssues }
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data)
    }

    if (Array.isArray(data)) {
      const sanitizedArray = []
      for (const item of data) {
        const result = await this.sanitizeInput(item)
        sanitizedArray.push(result.data)
        securityIssues.push(...result.securityIssues)
      }
      return { data: sanitizedArray, securityIssues }
    }

    if (typeof data === 'object' && data !== null) {
      const sanitizedObject: Record<string, any> = {}

      for (const [key, value] of Object.entries(data)) {
        // Check for dangerous keys
        if (this.isDangerousKey(key)) {
          securityIssues.push(`Dangerous object key detected: ${key}`)
          continue // Skip dangerous keys
        }

        const result = await this.sanitizeInput(value)
        sanitizedObject[key] = result.data
        securityIssues.push(...result.securityIssues)
      }

      return { data: sanitizedObject, securityIssues }
    }

    return { data, securityIssues }
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(input: string): { data: string; securityIssues: string[] } {
    const securityIssues: string[] = []
    let sanitized = input

    // Check for potential XSS
    if (this.containsXSS(input)) {
      securityIssues.push('Potential XSS detected in string input')
      sanitized = DOMPurify.sanitize(input)
    }

    // Check for SQL injection patterns
    if (this.containsSQLInjection(input)) {
      securityIssues.push('Potential SQL injection detected in string input')
      sanitized = this.sanitizeSQLInjection(sanitized)
    }

    // Check for command injection
    if (this.containsCommandInjection(input)) {
      securityIssues.push('Potential command injection detected in string input')
      sanitized = this.sanitizeCommandInjection(sanitized)
    }

    // Normalize whitespace and trim
    sanitized = sanitized.trim().replace(/\s+/g, ' ')

    return { data: sanitized, securityIssues }
  }

  /**
   * Check for dangerous object keys
   */
  private isDangerousKey(key: string): boolean {
    const dangerousKeys = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'function',
      'script',
      'innerHTML',
      'outerHTML'
    ]

    return dangerousKeys.includes(key.toLowerCase())
  }

  /**
   * Check for XSS patterns
   */
  private containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ]

    return xssPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Check for SQL injection patterns
   */
  private containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
      /insert\s+into/gi,
      /update\s+set/gi,
      /exec\s*\(/gi,
      /xp_cmdshell/gi,
      /sp_executesql/gi,
      /'\s*or\s*'1'\s*=\s*'1/gi,
      /'\s*or\s*1\s*=\s*1/gi,
      /--/g,
      /\/\*/g
    ]

    return sqlPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Check for command injection patterns
   */
  private containsCommandInjection(input: string): boolean {
    const cmdPatterns = [
      /;\s*(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp)/gi,
      /\|\s*(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp)/gi,
      /`.*`/g,
      /\$\(.*\)/g,
      /\|\|/g,
      /&&/g
    ]

    return cmdPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Sanitize SQL injection attempts
   */
  private sanitizeSQLInjection(input: string): string {
    return input
      .replace(/union\s+select/gi, '')
      .replace(/drop\s+table/gi, '')
      .replace(/delete\s+from/gi, '')
      .replace(/insert\s+into/gi, '')
      .replace(/update\s+set/gi, '')
      .replace(/exec\s*\(/gi, '')
      .replace(/xp_cmdshell/gi, '')
      .replace(/sp_executesql/gi, '')
      .replace(/'\s*or\s*'1'\s*=\s*'1/gi, '')
      .replace(/'\s*or\s*1\s*=\s*1/gi, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
  }

  /**
   * Sanitize command injection attempts
   */
  private sanitizeCommandInjection(input: string): string {
    return input
      .replace(/;\s*(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp)/gi, '')
      .replace(/\|\s*(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp)/gi, '')
      .replace(/`.*`/g, '')
      .replace(/\$\(.*\)/g, '')
      .replace(/\|\|/g, '')
      .replace(/&&/g, '')
  }

  /**
   * Validate file upload
   */
  async validateFileUpload(file: {
    name: string
    size: number
    type: string
    buffer?: Buffer
  }): Promise<ValidationResult> {
    const securityIssues: string[] = []

    // Check file extension
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'jpg', 'jpeg', 'png']
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!extension || !allowedExtensions.includes(extension)) {
      securityIssues.push(`Invalid file extension: ${extension}`)
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      securityIssues.push('File size exceeds maximum allowed (50MB)')
    }

    // Check MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png'
    ]

    if (!allowedMimeTypes.includes(file.type)) {
      securityIssues.push(`Invalid MIME type: ${file.type}`)
    }

    // Check filename for dangerous patterns
    if (this.containsDangerousFilename(file.name)) {
      securityIssues.push('Dangerous characters in filename')
    }

    // If file buffer is available, perform content scanning
    if (file.buffer) {
      const contentIssues = await this.scanFileContent(file.buffer, extension!)
      securityIssues.push(...contentIssues)
    }

    if (securityIssues.length > 0) {
      await this.logSecurityIssue('file_upload_validation', securityIssues)

      return {
        success: false,
        securityIssues
      }
    }

    return { success: true }
  }

  /**
   * Check for dangerous filename patterns
   */
  private containsDangerousFilename(filename: string): boolean {
    const dangerousPatterns = [
      /\.\./,  // Path traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,  // Windows reserved names
      /\.(exe|bat|cmd|scr|pif|vbs|js)$/i  // Executable extensions
    ]

    return dangerousPatterns.some(pattern => pattern.test(filename))
  }

  /**
   * Scan file content for malicious patterns
   */
  private async scanFileContent(buffer: Buffer, extension: string): Promise<string[]> {
    const issues: string[] = []
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000)) // First 10KB only

    // Check for embedded scripts in documents
    if (['doc', 'docx', 'xls', 'xlsx', 'pdf'].includes(extension)) {
      if (content.includes('javascript:') || content.includes('<script')) {
        issues.push('Embedded script detected in document')
      }
    }

    // Check for suspicious binary patterns
    if (buffer.length > 0) {
      // Check for executable signatures
      const signatures = [
        [0x4D, 0x5A], // PE executable
        [0x7F, 0x45, 0x4C, 0x46], // ELF executable
        [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O executable
      ]

      for (const sig of signatures) {
        if (buffer.length >= sig.length) {
          const match = sig.every((byte, index) => buffer[index] === byte)
          if (match) {
            issues.push('Executable file signature detected')
            break
          }
        }
      }
    }

    return issues
  }

  /**
   * Log validation errors
   */
  private async logValidationError(
    schema: z.ZodSchema,
    data: unknown,
    error: z.ZodError
  ): Promise<void> {
    try {
      await this.securityMonitoring.logSecurityEvent({
        eventType: 'validation_error',
        severity: 'low',
        description: 'Input validation failed',
        metadata: {
          schemaName: schema.description || 'unknown',
          errorCount: error.errors.length,
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        }
      })
    } catch (logError) {
      console.error('Failed to log validation error:', logError)
    }
  }

  /**
   * Log security issues
   */
  private async logSecurityIssue(type: string, issues: string[]): Promise<void> {
    try {
      await this.securityMonitoring.logSecurityEvent({
        eventType: type,
        severity: 'medium',
        description: `Security issues detected during ${type}`,
        riskScore: Math.min(issues.length * 20, 100),
        metadata: {
          issueCount: issues.length,
          issues
        }
      })
    } catch (logError) {
      console.error('Failed to log security issue:', logError)
    }
  }
}

// Export validation schemas for use in other modules
export {
  BaseSchemas,
  OrganizationSchemas,
  UserSchemas,
  ClientSchemas,
  DocumentSchemas,
  ApiSchemas
}