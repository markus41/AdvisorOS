import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import crypto from 'crypto'
import { ApiSecurityService } from '../services/api-security.service'
import { SecurityMonitoringService } from '../services/security-monitoring.service'
import { Redis } from 'ioredis'

// Security configuration
const SECURITY_HEADERS = {
  // Content Security Policy - Prevent XSS attacks
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.stripe.com https://api.openai.com https://*.azure.com https://quickbooks-api.intuit.com;
    frame-src 'self' https://js.stripe.com https://appcenter.intuit.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',

  // Disable features that could be exploited
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()',

  // Prevent caching of sensitive content
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/auth': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 auth attempts per 15 minutes
  '/api/documents/upload': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 uploads per minute
  '/api/reports': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 report requests per minute
  '/api/clients': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 client API calls per minute
  'default': { windowMs: 60 * 1000, maxRequests: 200 } // 200 requests per minute default
}

// Input validation schemas
const SecurityValidationSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  url: z.string().max(2000),
  userAgent: z.string().max(1000).optional(),
  origin: z.string().max(500).optional(),
  referer: z.string().max(2000).optional(),
  contentLength: z.number().max(50 * 1024 * 1024).optional() // 50MB max
})

export class SecurityMiddleware {
  private redis: Redis
  private apiSecurity: ApiSecurityService
  private securityMonitoring: SecurityMonitoringService
  private requestCache = new Map<string, any>()

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    this.securityMonitoring = new SecurityMonitoringService(this.redis)
    this.apiSecurity = new ApiSecurityService(this.redis, this.securityMonitoring)
  }

  /**
   * Main security middleware function
   */
  async handle(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Extract request context
      const context = await this.extractSecurityContext(request)

      // Validate basic request structure
      const validation = await this.validateRequest(request)
      if (!validation.valid) {
        return this.createSecurityResponse('Invalid request format', 400, validation.reason)
      }

      // Check rate limiting
      const rateLimitResult = await this.checkRateLimit(request, context)
      if (rateLimitResult.blocked) {
        await this.logSecurityEvent('rate_limit_exceeded', 'high', context, {
          limit: rateLimitResult.limit,
          current: rateLimitResult.current
        })
        return this.createSecurityResponse('Rate limit exceeded', 429)
      }

      // Perform comprehensive security validation
      const securityResult = await this.apiSecurity.validateRequest(
        context,
        request.nextUrl.pathname,
        request.method,
        await this.extractRequestPayload(request)
      )

      // Handle security result
      switch (securityResult.action) {
        case 'block':
          await this.logSecurityEvent('request_blocked', 'high', context, securityResult.metadata)
          return this.createSecurityResponse('Request blocked by security policy', 403)

        case 'challenge':
          await this.logSecurityEvent('security_challenge', 'medium', context, securityResult.metadata)
          // In a real implementation, this would trigger additional verification
          // For now, we'll allow but log the challenge
          break

        case 'monitor':
          await this.logSecurityEvent('security_monitor', 'low', context, securityResult.metadata)
          break

        case 'allow':
        default:
          // Request is allowed, continue
          break
      }

      // Add security headers to the response (will be applied when response is created)
      const response = NextResponse.next()
      this.addSecurityHeaders(response)

      return response

    } catch (error) {
      console.error('Security middleware error:', error)

      // Log security error
      await this.logSecurityEvent('middleware_error', 'medium', {
        ipAddress: this.getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        riskScore: 50
      }, { error: error instanceof Error ? error.message : 'Unknown error' })

      // Allow request to continue but with security headers
      const response = NextResponse.next()
      this.addSecurityHeaders(response)
      return response
    }
  }

  /**
   * Extract security context from request
   */
  private async extractSecurityContext(request: NextRequest): Promise<any> {
    const ipAddress = this.getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    return {
      ipAddress,
      userAgent,
      country: await this.getCountryFromIp(ipAddress),
      deviceFingerprint: this.generateDeviceFingerprint(request),
      riskScore: 0 // Will be calculated by security service
    }
  }

  /**
   * Validate basic request structure
   */
  private async validateRequest(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
    try {
      const contentLength = request.headers.get('content-length')

      SecurityValidationSchema.parse({
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        contentLength: contentLength ? parseInt(contentLength) : undefined
      })

      // Check for suspicious patterns in URL
      if (this.containsSuspiciousPatterns(request.url)) {
        return { valid: false, reason: 'Suspicious URL patterns detected' }
      }

      // Check for oversized requests
      if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
        return { valid: false, reason: 'Request size exceeds maximum allowed' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, reason: 'Request validation failed' }
    }
  }

  /**
   * Check rate limiting for the request
   */
  private async checkRateLimit(request: NextRequest, context: any): Promise<any> {
    const pathname = request.nextUrl.pathname
    const key = `rate_limit:${context.ipAddress}:${pathname}`

    // Find applicable rate limit
    let config = RATE_LIMITS.default
    for (const [path, rateLimit] of Object.entries(RATE_LIMITS)) {
      if (pathname.startsWith(path)) {
        config = rateLimit
        break
      }
    }

    // Get current count
    const current = await this.redis.incr(key)

    if (current === 1) {
      // Set expiration on first request
      await this.redis.expire(key, Math.ceil(config.windowMs / 1000))
    }

    return {
      blocked: current > config.maxRequests,
      current,
      limit: config.maxRequests,
      windowMs: config.windowMs
    }
  }

  /**
   * Extract request payload safely
   */
  private async extractRequestPayload(request: NextRequest): Promise<any> {
    if (!request.body || request.method === 'GET') {
      return null
    }

    try {
      const contentType = request.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const text = await request.text()
        return JSON.parse(text)
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        const data: Record<string, any> = {}
        for (const [key, value] of formData.entries()) {
          data[key] = value
        }
        return data
      }

      return null
    } catch (error) {
      // Invalid JSON or other parsing error
      return null
    }
  }

  /**
   * Add security headers to response
   */
  private addSecurityHeaders(response: NextResponse): void {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(header, value)
    }

    // Add unique request ID for tracking
    response.headers.set('X-Request-ID', crypto.randomUUID())
  }

  /**
   * Create security response for blocked requests
   */
  private createSecurityResponse(message: string, status: number, details?: string): NextResponse {
    const response = NextResponse.json(
      {
        error: message,
        details: details || 'Request blocked by security policy',
        timestamp: new Date().toISOString()
      },
      { status }
    )

    this.addSecurityHeaders(response)
    return response
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      request.ip ||
      'unknown'
    )
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''

    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
    return crypto.createHash('sha256').update(fingerprint).digest('hex')
  }

  /**
   * Get country from IP address (mock implementation)
   */
  private async getCountryFromIp(ipAddress: string): Promise<string | undefined> {
    // In production, this would use a GeoIP service
    // For now, return undefined
    return undefined
  }

  /**
   * Check for suspicious patterns in URL
   */
  private containsSuspiciousPatterns(url: string): boolean {
    const suspiciousPatterns = [
      // Path traversal
      /\.\.\/|\.\.\\|\.\./,
      // SQL injection
      /union\s+select|drop\s+table|delete\s+from/i,
      // XSS
      /<script|javascript:|on\w+\s*=/i,
      // Command injection
      /;\s*(cat|ls|pwd|whoami|id|uname)|`|\$\(/,
      // File inclusion
      /file:\/\/|ftp:\/\/|data:/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(url))
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(
    eventType: string,
    severity: string,
    context: any,
    metadata?: any
  ): Promise<void> {
    try {
      await this.securityMonitoring.logSecurityEvent({
        eventType,
        severity,
        description: `Security event: ${eventType}`,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        riskScore: context.riskScore || 0,
        metadata: metadata || {}
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
}

/**
 * Create middleware instance
 */
const securityMiddleware = new SecurityMiddleware()

/**
 * Middleware configuration for Next.js
 */
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to authentication pages
    '/auth/:path*',
    // Apply to dashboard and protected routes
    '/dashboard/:path*',
    '/portal/:path*'
  ]
}

/**
 * Main middleware function for Next.js
 */
export async function middleware(request: NextRequest) {
  return await securityMiddleware.handle(request)
}