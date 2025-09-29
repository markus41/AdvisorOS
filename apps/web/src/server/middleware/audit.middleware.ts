/**
 * Audit Trail Middleware
 * Automatically logs user actions and API requests for compliance and security monitoring
 */

import { type Session } from 'next-auth'
import { type NextRequest, type NextResponse } from 'next/server'
import { AuditService, type AuditContext, type AuditableChange } from '@/server/services/audit.service'

export interface AuditableRequest extends NextRequest {
  auditContext?: AuditContext
  skipAudit?: boolean
}

export interface AuditMiddlewareOptions {
  entityType: string
  action?: 'create' | 'update' | 'delete' | 'read' | 'export' | 'import' | 'access'
  skipAudit?: boolean
  extractEntityId?: (req: NextRequest, response?: any) => string | Promise<string>
  extractChanges?: (req: NextRequest, response?: any) => Promise<{
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    metadata?: Record<string, any>
  }>
  sensitiveData?: boolean
}

/**
 * Higher-order function to create audit middleware for API routes
 */
export function withAudit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: AuditMiddlewareOptions
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    let response: NextResponse
    let error: Error | null = null

    try {
      // Skip audit if explicitly disabled
      if (options.skipAudit || (req as AuditableRequest).skipAudit) {
        return await handler(req, context)
      }

      // Create audit context from request
      const auditContext = await createAuditContextFromRequest(req)

      // Add audit context to request
      ;(req as AuditableRequest).auditContext = auditContext

      // Execute the handler
      response = await handler(req, context)

      // Extract entity information
      const entityId = options.extractEntityId
        ? await options.extractEntityId(req, response)
        : extractEntityIdFromUrl(req.url)

      // Determine action from HTTP method if not specified
      const action = options.action || httpMethodToAction(req.method)

      // Extract changes if function provided
      let changes: any = {}
      if (options.extractChanges) {
        changes = await options.extractChanges(req, response)
      } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        try {
          const body = await req.clone().json()
          changes.newValues = sanitizeRequestBody(body, options.sensitiveData)
        } catch {
          // Ignore if body is not JSON
        }
      }

      // Log successful audit event
      await AuditService.logAuditEvent({
        entityType: options.entityType,
        entityId: entityId || 'unknown',
        action,
        ...changes,
        metadata: {
          method: req.method,
          url: req.url,
          statusCode: response.status,
          responseTime: Date.now() - startTime,
          userAgent: req.headers.get('user-agent'),
          ...changes.metadata,
        },
      }, auditContext)

      // Log data access for sensitive data
      if (options.sensitiveData && action === 'read') {
        await AuditService.logDataAccess(
          options.entityType,
          entityId || 'unknown',
          'view',
          auditContext,
          {
            method: req.method,
            url: req.url,
            dataClassification: 'sensitive',
          }
        )
      }

      return response

    } catch (err) {
      error = err as Error

      // Log failed request as security event
      const auditContext = await createAuditContextFromRequest(req)

      await AuditService.logSecurityEvent({
        eventType: 'api_error',
        severity: 'medium',
        description: `API request failed: ${req.method} ${req.url}`,
        resourceType: options.entityType,
        resourceId: options.extractEntityId ? await options.extractEntityId(req) : extractEntityIdFromUrl(req.url),
        riskScore: 25,
        metadata: {
          method: req.method,
          url: req.url,
          error: error.message,
          responseTime: Date.now() - startTime,
        },
      }, auditContext)

      throw error
    }
  }
}

/**
 * tRPC-specific audit middleware
 */
export function createTRPCAuditMiddleware() {
  return async function auditMiddleware<T extends { ctx: { session?: Session | null } }>(
    opts: T & {
      path: string
      type: 'query' | 'mutation' | 'subscription'
      input?: any
      next: () => Promise<any>
    }
  ) {
    const startTime = Date.now()

    try {
      // Create audit context from tRPC context
      const auditContext: AuditContext = {
        userId: opts.ctx.session?.user?.id,
        organizationId: opts.ctx.session?.user?.organizationId,
        sessionId: opts.ctx.session?.sessionId,
        metadata: {
          tRPCPath: opts.path,
          tRPCType: opts.type,
          procedure: opts.path,
        },
      }

      // Execute the procedure
      const result = await opts.next()

      // Determine entity type and action from path
      const { entityType, action, entityId } = parseTRPCPath(opts.path, opts.type, opts.input)

      // Log audit event for mutations and sensitive queries
      if (opts.type === 'mutation' || isSensitiveTRPCPath(opts.path)) {
        await AuditService.logAuditEvent({
          entityType,
          entityId: entityId || 'unknown',
          action,
          newValues: opts.type === 'mutation' ? sanitizeRequestBody(opts.input) : undefined,
          metadata: {
            tRPCPath: opts.path,
            tRPCType: opts.type,
            responseTime: Date.now() - startTime,
            inputKeys: opts.input ? Object.keys(opts.input) : [],
          },
        }, auditContext)
      }

      return result

    } catch (error) {
      // Log tRPC errors as security events
      const auditContext: AuditContext = {
        userId: opts.ctx.session?.user?.id,
        organizationId: opts.ctx.session?.user?.organizationId,
        sessionId: opts.ctx.session?.sessionId,
      }

      await AuditService.logSecurityEvent({
        eventType: 'trpc_error',
        severity: 'low',
        description: `tRPC procedure failed: ${opts.path}`,
        metadata: {
          tRPCPath: opts.path,
          tRPCType: opts.type,
          error: (error as Error).message,
          responseTime: Date.now() - startTime,
        },
      }, auditContext)

      throw error
    }
  }
}

/**
 * Database operation audit wrapper
 */
export function auditDatabaseOperation<T extends Record<string, any>>(
  operation: string,
  model: string,
  data: T,
  context: AuditContext,
  oldData?: T
): Promise<void> {
  const change: AuditableChange = {
    entityType: model.toLowerCase(),
    entityId: data.id || 'unknown',
    action: mapDatabaseOperationToAction(operation),
    oldValues: oldData ? sanitizeRequestBody(oldData) : undefined,
    newValues: sanitizeRequestBody(data),
    metadata: {
      databaseOperation: operation,
      model,
    },
  }

  return AuditService.logAuditEvent(change, context)
}

/**
 * Batch audit logging for bulk operations
 */
export async function auditBulkOperation<T extends Record<string, any>>(
  operation: string,
  model: string,
  items: T[],
  context: AuditContext
): Promise<void> {
  const changes: AuditableChange[] = items.map(item => ({
    entityType: model.toLowerCase(),
    entityId: item.id || 'unknown',
    action: mapDatabaseOperationToAction(operation),
    newValues: sanitizeRequestBody(item),
    metadata: {
      databaseOperation: operation,
      model,
      bulkOperation: true,
      batchSize: items.length,
    },
  }))

  await AuditService.logBulkAuditEvents(changes, context)
}

// Helper functions

async function createAuditContextFromRequest(req: NextRequest): Promise<AuditContext> {
  return {
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    metadata: {
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    },
  }
}

function getClientIP(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const connectedIP = req.headers.get('x-connected-ip')

  if (forwarded) {
    return forwarded.split(',')[0]?.trim()
  }

  return realIP || connectedIP || undefined
}

function extractEntityIdFromUrl(url: string): string | undefined {
  // Extract ID from common URL patterns like /api/clients/123 or /api/documents/abc-def
  const matches = url.match(/\/api\/\w+\/([a-zA-Z0-9\-_]+)/)
  return matches?.[1]
}

function httpMethodToAction(method: string): AuditableChange['action'] {
  const methodMap: Record<string, AuditableChange['action']> = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  }
  return methodMap[method] || 'access'
}

function mapDatabaseOperationToAction(operation: string): AuditableChange['action'] {
  const operationMap: Record<string, AuditableChange['action']> = {
    create: 'create',
    createMany: 'create',
    update: 'update',
    updateMany: 'update',
    upsert: 'update',
    delete: 'delete',
    deleteMany: 'delete',
    findUnique: 'read',
    findMany: 'read',
    findFirst: 'read',
  }
  return operationMap[operation] || 'access'
}

function parseTRPCPath(path: string, type: string, input?: any): {
  entityType: string
  action: AuditableChange['action']
  entityId?: string
} {
  // Parse tRPC paths like "client.getById" or "document.create"
  const [entityType, procedureName] = path.split('.')

  let action: AuditableChange['action'] = 'access'

  if (type === 'mutation') {
    if (procedureName?.includes('create')) action = 'create'
    else if (procedureName?.includes('update')) action = 'update'
    else if (procedureName?.includes('delete')) action = 'delete'
    else action = 'update'
  } else {
    action = 'read'
  }

  // Extract entity ID from input if available
  const entityId = input?.id || input?.entityId || undefined

  return {
    entityType: entityType || 'unknown',
    action,
    entityId,
  }
}

function isSensitiveTRPCPath(path: string): boolean {
  const sensitivePaths = [
    'user.getProfile',
    'client.getFinancialData',
    'document.getContent',
    'report.generate',
    'billing.getPaymentMethods',
  ]

  return sensitivePaths.some(sensitive => path.startsWith(sensitive))
}

function sanitizeRequestBody(body: any, includeSensitive = false): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'creditCard',
    'ssn',
    'taxId',
    'bankAccount',
    'routingNumber',
  ]

  const sanitized = { ...body }

  for (const [key, value] of Object.entries(sanitized)) {
    const lowercaseKey = key.toLowerCase()

    // Remove or mask sensitive fields
    if (!includeSensitive && sensitiveFields.some(field => lowercaseKey.includes(field))) {
      sanitized[key] = '[REDACTED]'
    }
    // Recursively sanitize nested objects
    else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeRequestBody(value, includeSensitive)
    }
  }

  return sanitized
}

export {
  auditDatabaseOperation,
  auditBulkOperation,
  createAuditContextFromRequest,
  getClientIP,
}