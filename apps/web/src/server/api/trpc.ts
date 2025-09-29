import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from "../db"
import { z } from 'zod'
import { createTRPCAuditMiddleware } from '@/server/middleware/audit.middleware'
import { AuditService } from '@/server/services/audit.service'
import { PermissionService } from '@/server/services/permission.service'

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

interface CreateContextOptions {
  session: Session | null
  req?: Request
  res?: Response
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    req: opts.req,
    res: opts.res,
    auditService: AuditService,
    permissionService: PermissionService,
  }
}

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts

  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerSession(req, res, authOptions)

  return createInnerTRPCContext({
    session,
    req,
    res,
  })
}

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: null, // You can add superjson here if needed
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Create audit middleware instance
const auditMiddleware = createTRPCAuditMiddleware()

/**
 * 3. ROUTER & PROCEDURE HELPERS
 *
 * These are helper functions that will be used to create your tRPC router and procedures.
 * We intentionally create these helpers as reusable functions that can be used in multiple routers,
 * instead of having everything in one big router.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure

/**
 * Reusable middleware that enforces users are logged in before running the procedure.
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
      prisma: ctx.prisma,
      auditService: ctx.auditService,
      permissionService: ctx.permissionService,
    },
  })
})

/**
 * Protected procedure with audit logging
 */
export const protectedProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(auditMiddleware)

/**
 * Organization scoped procedure - ensures user belongs to an organization
 */
const enforceUserHasOrganization = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user?.organizationId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User must belong to an organization'
    })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      prisma: ctx.prisma,
      auditService: ctx.auditService,
      permissionService: ctx.permissionService,
      organizationId: ctx.session.user.organizationId,
      userId: ctx.session.user.id,
    },
  })
})

export const organizationProcedure = protectedProcedure.use(enforceUserHasOrganization)

/**
 * Permission-based procedure - checks specific permissions
 */
const enforcePermission = (permission: string, resource?: string) =>
  t.middleware(async ({ ctx, next, path, type, input }) => {
    if (!ctx.session?.user?.id || !ctx.organizationId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const hasPermission = await PermissionService.checkUserPermission(
      ctx.session.user.id,
      ctx.organizationId,
      permission,
      resource,
      { path, type, input }
    )

    if (!hasPermission) {
      // Log permission denial as security event
      await AuditService.logSecurityEvent({
        eventType: 'permission_denied',
        severity: 'medium',
        description: `User ${ctx.session.user.id} denied access to ${permission} on ${resource || 'resource'}`,
        resourceType: resource || 'unknown',
        riskScore: 40,
        metadata: {
          permission,
          resource,
          tRPCPath: path,
          deniedAction: type,
        },
      }, {
        userId: ctx.session.user.id,
        organizationId: ctx.organizationId,
        sessionId: ctx.session.sessionId,
      })

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Insufficient permissions: ${permission}`,
      })
    }

    return next({
      ctx: {
        ...ctx,
        permission,
        resource,
      },
    })
  })

/**
 * Creates a procedure with specific permission requirement
 */
export const createPermissionProcedure = (permission: string, resource?: string) =>
  organizationProcedure.use(enforcePermission(permission, resource))

/**
 * Role-based procedure - checks if user has specific role
 */
const enforceRole = (requiredRoles: string | string[]) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user?.role) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const userRole = ctx.session.user.role

    if (!roles.includes(userRole)) {
      await AuditService.logSecurityEvent({
        eventType: 'role_access_denied',
        severity: 'medium',
        description: `User with role ${userRole} denied access requiring roles: ${roles.join(', ')}`,
        riskScore: 35,
        metadata: {
          userRole,
          requiredRoles: roles,
        },
      }, {
        userId: ctx.session.user.id,
        organizationId: ctx.organizationId,
        sessionId: ctx.session.sessionId,
      })

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Insufficient role: requires ${roles.join(' or ')}`,
      })
    }

    return next({
      ctx: {
        ...ctx,
        userRole,
      },
    })
  })

/**
 * Creates a procedure with specific role requirement
 */
export const createRoleProcedure = (requiredRoles: string | string[]) =>
  organizationProcedure.use(enforceRole(requiredRoles))

/**
 * Admin-only procedure
 */
export const adminProcedure = createRoleProcedure(['owner', 'admin'])

/**
 * Manager+ procedure
 */
export const managerProcedure = createRoleProcedure(['owner', 'admin', 'manager'])

/**
 * CPA+ procedure
 */
export const cpaProcedure = createRoleProcedure(['owner', 'admin', 'manager', 'senior_cpa', 'cpa'])

/**
 * Multi-tenant isolation middleware - ensures data access is scoped to user's organization
 */
const enforceTenantIsolation = t.middleware(async ({ ctx, next, input }) => {
  if (!ctx.organizationId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Organization context required',
    })
  }

  // Wrap prisma client with tenant-scoped operations
  const tenantPrisma = createTenantPrismaClient(ctx.prisma, ctx.organizationId)

  return next({
    ctx: {
      ...ctx,
      prisma: tenantPrisma,
      tenantId: ctx.organizationId,
    },
  })
})

/**
 * Tenant-isolated procedure
 */
export const tenantProcedure = organizationProcedure.use(enforceTenantIsolation)

/**
 * Rate limiting middleware
 */
const enforceRateLimit = (limit: number, windowMs: number = 60000) =>
  t.middleware(async ({ ctx, next, path }) => {
    if (!ctx.session?.user?.id) {
      return next() // Skip rate limiting for unauthenticated requests
    }

    const key = `ratelimit:${ctx.session.user.id}:${path}`
    const requests = await incrementRateLimit(key, windowMs)

    if (requests > limit) {
      await AuditService.logSecurityEvent({
        eventType: 'rate_limit_exceeded',
        severity: 'high',
        description: `User ${ctx.session.user.id} exceeded rate limit for ${path}: ${requests}/${limit}`,
        riskScore: 60,
        metadata: {
          path,
          requests,
          limit,
          windowMs,
        },
      }, {
        userId: ctx.session.user.id,
        organizationId: ctx.organizationId,
        sessionId: ctx.session.sessionId,
      })

      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      })
    }

    return next()
  })

/**
 * Creates a rate-limited procedure
 */
export const createRateLimitedProcedure = (limit: number, windowMs?: number) =>
  protectedProcedure.use(enforceRateLimit(limit, windowMs))

// Helper functions for middleware

/**
 * Creates a tenant-scoped Prisma client
 */
function createTenantPrismaClient(prisma: any, organizationId: string) {
  return new Proxy(prisma, {
    get(target, prop) {
      const original = target[prop]

      if (typeof original === 'object' && original !== null) {
        return new Proxy(original, {
          get(modelTarget, modelProp) {
            const modelMethod = modelTarget[modelProp]

            if (typeof modelMethod === 'function') {
              return function(...args: any[]) {
                // Inject organizationId filter for tenant isolation
                if (args[0] && typeof args[0] === 'object') {
                  if (args[0].where) {
                    args[0].where.organizationId = organizationId
                  } else {
                    args[0].where = { organizationId }
                  }

                  if (args[0].data && modelProp === 'create') {
                    args[0].data.organizationId = organizationId
                  }
                }

                return modelMethod.apply(modelTarget, args)
              }
            }

            return modelMethod
          }
        })
      }

      return original
    }
  })
}

/**
 * Simple in-memory rate limiting (use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

async function incrementRateLimit(key: string, windowMs: number): Promise<number> {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return 1
  }

  record.count++
  return record.count
}