import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { JWT } from "next-auth/jwt"
import { getSessionTimeout } from "@/lib/auth/session-utils"

// Define role hierarchy for authorization
const ROLE_HIERARCHY = {
  owner: 5,
  admin: 4,
  cpa: 3,
  staff: 2,
  client: 1,
} as const

// Define protected routes and their required permissions
const ROUTE_PERMISSIONS = {
  // Admin routes - require admin or owner
  '/admin': ['admin', 'owner'],
  '/admin/users': ['admin', 'owner'],
  '/admin/organizations': ['owner'],
  '/admin/billing': ['admin', 'owner'],
  '/admin/settings': ['admin', 'owner'],

  // CPA routes - require CPA level or above
  '/cpa': ['cpa', 'admin', 'owner'],
  '/cpa/clients': ['cpa', 'admin', 'owner'],
  '/cpa/reports': ['cpa', 'admin', 'owner'],
  '/cpa/tax-returns': ['cpa', 'admin', 'owner'],

  // Staff routes - require staff level or above
  '/staff': ['staff', 'cpa', 'admin', 'owner'],
  '/staff/tasks': ['staff', 'cpa', 'admin', 'owner'],
  '/staff/documents': ['staff', 'cpa', 'admin', 'owner'],

  // Client portal routes - all authenticated users
  '/client': ['client', 'staff', 'cpa', 'admin', 'owner'],
  '/client/documents': ['client', 'staff', 'cpa', 'admin', 'owner'],
  '/client/tax-returns': ['client', 'staff', 'cpa', 'admin', 'owner'],

  // Dashboard routes - all authenticated users
  '/dashboard': ['client', 'staff', 'cpa', 'admin', 'owner'],
  '/profile': ['client', 'staff', 'cpa', 'admin', 'owner'],
  '/settings': ['client', 'staff', 'cpa', 'admin', 'owner'],
} as const

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/verify-request',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/invite',
  '/auth/select-organization',
  '/api/auth',
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/invite',
  '/api/auth/check-subdomain',
  '/api/auth/validate-invitation',
  '/api/auth/validate-reset-token',
  '/api/auth/resend-verification',
  '/api/webhooks',
]

// API routes that require authentication but no specific role
const PROTECTED_API_ROUTES = [
  '/api/user',
  '/api/profile',
  '/api/upload',
  '/api/documents',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

function getRequiredRoles(pathname: string): string[] | null {
  // Check exact matches first
  if (ROUTE_PERMISSIONS[pathname as keyof typeof ROUTE_PERMISSIONS]) {
    return ROUTE_PERMISSIONS[pathname as keyof typeof ROUTE_PERMISSIONS]
  }

  // Check for parent routes
  const segments = pathname.split('/').filter(Boolean)
  for (let i = segments.length; i > 0; i--) {
    const parentPath = '/' + segments.slice(0, i).join('/')
    if (ROUTE_PERMISSIONS[parentPath as keyof typeof ROUTE_PERMISSIONS]) {
      return ROUTE_PERMISSIONS[parentPath as keyof typeof ROUTE_PERMISSIONS]
    }
  }

  return null
}

function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0
  return requiredRoles.some(role => {
    const requiredLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0
    return userLevel >= requiredLevel
  })
}

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

async function rateLimitCheck(request: NextRequest, identifier: string): Promise<boolean> {
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth/')
  if (!isAuthRoute) return true

  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = getRouteRateLimit(request.nextUrl.pathname)

  const key = `${identifier}:${request.nextUrl.pathname}`
  const stored = rateLimitStore.get(key)

  if (!stored || now > stored.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (stored.count >= maxRequests) {
    return false // Rate limited
  }

  // Increment count
  stored.count += 1
  rateLimitStore.set(key, stored)
  return true
}

function getRouteRateLimit(pathname: string): number {
  // Different rate limits for different endpoints
  if (pathname.includes('/signin') || pathname.includes('/register')) {
    return 5 // 5 attempts per minute for login/register
  }
  if (pathname.includes('/forgot-password') || pathname.includes('/resend-verification')) {
    return 3 // 3 attempts per minute for password reset
  }
  if (pathname.includes('/2fa/')) {
    return 10 // 10 attempts per minute for 2FA
  }
  return 20 // Default: 20 requests per minute
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Cleanup every 5 minutes

// Temporarily disable middleware for frontend testing
export default function middleware(request: NextRequest) {
  // For frontend testing, just allow all requests
  return NextResponse.next()
}

// Original middleware commented out for frontend testing
/*
export default withAuth(
  async function middleware(request: NextRequest) {
    const token = request.nextauth.token as JWT & {
      role?: string
      organizationId?: string
      exp?: number
    }

    const pathname = request.nextUrl.pathname

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.ip || 'unknown'

    const rateLimitPassed = await rateLimitCheck(request, clientIP)
    if (!rateLimitPassed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    // Check if user is authenticated
    if (!token) {
      // Redirect to sign-in page with return URL
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Check token expiration with role-based timeout
    const roleTimeout = getSessionTimeout(token.role || 'client')
    const tokenAge = Date.now() / 1000 - (token.iat || 0)

    if (token.exp && Date.now() >= token.exp * 1000) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      signInUrl.searchParams.set('error', 'SessionExpired')
      return NextResponse.redirect(signInUrl)
    }

    // Check role-based session timeout
    if (tokenAge > roleTimeout) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      signInUrl.searchParams.set('error', 'SessionExpired')
      return NextResponse.redirect(signInUrl)
    }

    // Get required roles for the route
    const requiredRoles = getRequiredRoles(pathname)

    // If no specific roles required, allow access for authenticated users
    if (!requiredRoles) {
      return NextResponse.next()
    }

    // Check if user has required role
    if (!token.role || !hasRequiredRole(token.role, requiredRoles)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Access denied',
          message: 'Insufficient permissions to access this resource',
          requiredRoles,
          userRole: token.role
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Add comprehensive headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', token.sub || '')
    requestHeaders.set('x-user-role', token.role || '')
    requestHeaders.set('x-organization-id', token.organizationId || '')
    requestHeaders.set('x-client-ip', clientIP)
    requestHeaders.set('x-user-agent', request.headers.get('user-agent') || '')
    requestHeaders.set('x-session-id', token.jti || '')
    requestHeaders.set('x-session-issued-at', token.iat?.toString() || '')

    // Add security headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // CSP for enhanced security
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')

    response.headers.set('Content-Security-Policy', cspHeader)

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Allow public routes
        if (isPublicRoute(pathname)) {
          return true
        }

        // For protected routes, check if user is authenticated
        return !!token
      },
    },
  }
)

*/

export const config = {
  // Match all paths except static files and images
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}