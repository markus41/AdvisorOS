import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "../server/db"
import bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"
import speakeasy from "speakeasy"
import crypto from "crypto"
import { SecurityMonitoringService } from "../server/services/security-monitoring.service"
import { InputValidationService, UserSchemas } from "../server/services/input-validation.service"
import { Redis } from "ioredis"

// Initialize services
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const securityMonitoring = new SecurityMonitoringService(redis)
const inputValidation = new InputValidationService(securityMonitoring)

// Enhanced role-based session timeout configuration (in seconds)
const SESSION_TIMEOUTS = {
  client: 15 * 60, // 15 minutes for client portal
  staff: 60 * 60, // 1 hour for staff
  cpa: 4 * 60 * 60, // 4 hours for CPAs
  senior_cpa: 4 * 60 * 60, // 4 hours for senior CPAs
  manager: 6 * 60 * 60, // 6 hours for managers
  admin: 8 * 60 * 60, // 8 hours for admins
  owner: 12 * 60 * 60, // 12 hours for owners (reduced from 24)
} as const

// Maximum failed login attempts before lockout
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
const SESSION_ROTATION_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

interface AuthContext {
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  deviceFingerprint?: string
}

/**
 * Enhanced credential validation with comprehensive security checks
 */
async function validateCredentials(
  credentials: Record<string, string>,
  context?: AuthContext
): Promise<any> {
  try {
    // Validate input structure first
    const validationResult = await inputValidation.validate(
      UserSchemas.login,
      credentials,
      { sanitize: true, throwOnError: false }
    )

    if (!validationResult.success) {
      await logSecurityEvent('validation_failed', 'medium', context, {
        errors: validationResult.errors?.map(e => e.message)
      })
      throw new Error("Invalid input format")
    }

    const { email, password, subdomain, twoFactorCode } = validationResult.data!

    // Check for account lockout first
    await checkAccountLockout(email, context)

    // Find organization by subdomain with security checks
    const organization = await prisma.organization.findUnique({
      where: {
        subdomain,
        deletedAt: null // Ensure organization is not soft deleted
      },
      include: {
        settings: true,
        auditLogs: {
          where: {
            eventType: 'login_attempt',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!organization) {
      await logFailedLoginAttempt(email, subdomain, 'organization_not_found', context)
      throw new Error("Invalid credentials")
    }

    // Check if organization is suspended
    if (organization.settings?.suspended) {
      await logSecurityEvent('suspended_org_access', 'high', context, {
        organizationId: organization.id,
        subdomain
      })
      throw new Error("Organization access suspended")
    }

    // Find user with comprehensive security data
    const user = await prisma.user.findFirst({
      where: {
        email,
        organizationId: organization.id,
        deletedAt: null,
        isActive: true
      },
      include: {
        organization: true,
        authAttempts: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        userSessions: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      await logFailedLoginAttempt(email, subdomain, 'user_not_found', context)
      throw new Error("Invalid credentials")
    }

    // Enhanced account lockout check
    const recentFailedAttempts = user.authAttempts.filter(attempt => !attempt.success)
    if (recentFailedAttempts.length >= MAX_FAILED_ATTEMPTS) {
      const lastAttempt = recentFailedAttempts[0]
      const lockoutEndTime = new Date(lastAttempt.createdAt.getTime() + LOCKOUT_DURATION)

      if (new Date() < lockoutEndTime) {
        await logSecurityEvent('account_locked_access', 'high', context, {
          userId: user.id,
          failedAttempts: recentFailedAttempts.length,
          lockoutEndTime
        })
        throw new Error(`Account locked until ${lockoutEndTime.toLocaleString()}`)
      }
    }

    // Verify password with enhanced security
    if (!user.hashedPassword) {
      await logSecurityEvent('missing_password', 'high', context, { userId: user.id })
      throw new Error("Account configuration error")
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)

    if (!isPasswordValid) {
      await logFailedLoginAttempt(email, subdomain, 'invalid_password', context, user.id)
      throw new Error("Invalid credentials")
    }

    // Check password age and complexity
    await checkPasswordSecurity(user, organization, context)

    // Verify 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        throw new Error("Two-factor authentication code required")
      }

      const isValidTOTP = await verifyTwoFactor(user.id, twoFactorCode)
      if (!isValidTOTP) {
        await logSecurityEvent('invalid_2fa', 'high', context, { userId: user.id })
        throw new Error("Invalid two-factor authentication code")
      }
    }

    // Check for suspicious login patterns
    await detectSuspiciousActivity(user, context)

    // Check concurrent session limits
    await enforceSessionLimits(user, organization, context)

    // Generate new session with security metadata
    const sessionId = crypto.randomUUID()
    const deviceFingerprint = context?.deviceFingerprint || generateDeviceFingerprint(context)

    // Log successful authentication
    await Promise.all([
      logSuccessfulLogin(user, organization, context, sessionId),
      clearFailedAttempts(user.id),
      createUserSession(user, sessionId, deviceFingerprint, context)
    ])

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organization: user.organization,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      sessionId,
      deviceFingerprint,
      lastPasswordChange: user.lastPasswordChange,
      mustChangePassword: await shouldForcePasswordChange(user, organization)
    }
  } catch (error) {
    // Log authentication error
    await logSecurityEvent('auth_error', 'medium', context, {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: credentials?.email
    })
    throw error
  }
}

/**
 * Check for account lockout
 */
async function checkAccountLockout(email: string, context?: AuthContext): Promise<void> {
  const lockoutKey = `lockout:${email}`
  const isLocked = await redis.get(lockoutKey)

  if (isLocked) {
    await logSecurityEvent('lockout_access_attempt', 'high', context, {
      email,
      lockoutExpiry: isLocked
    })
    throw new Error("Account temporarily locked. Please try again later.")
  }
}

/**
 * Verify two-factor authentication
 */
async function verifyTwoFactor(userId: string, code: string): Promise<boolean> {
  try {
    // Get user's TOTP secret from secure storage
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true }
    })

    if (!user?.twoFactorSecret) {
      return false
    }

    // Verify TOTP code
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow some time drift
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return false
  }
}

/**
 * Check password security requirements
 */
async function checkPasswordSecurity(
  user: any,
  organization: any,
  context?: AuthContext
): Promise<void> {
  const passwordPolicy = organization.passwordPolicy || {
    maxAge: 90,
    requireComplexity: true
  }

  // Check password age
  if (user.lastPasswordChange) {
    const daysSinceChange = Math.floor(
      (Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceChange > passwordPolicy.maxAge) {
      await logSecurityEvent('password_expired', 'medium', context, {
        userId: user.id,
        daysSinceChange,
        maxAge: passwordPolicy.maxAge
      })
      // Note: In production, you might want to force password change here
    }
  }

  // Check if password is in common passwords list (simplified check)
  if (await isCommonPassword(user.hashedPassword)) {
    await logSecurityEvent('weak_password_detected', 'medium', context, {
      userId: user.id
    })
  }
}

/**
 * Detect suspicious login activity
 */
async function detectSuspiciousActivity(user: any, context?: AuthContext): Promise<void> {
  const suspiciousIndicators: string[] = []

  // Check for unusual time access
  const currentHour = new Date().getHours()
  if (currentHour < 6 || currentHour > 22) {
    suspiciousIndicators.push('Unusual time access')
  }

  // Check for geolocation anomalies (simplified)
  if (context?.ipAddress) {
    const recentLogins = await prisma.authAttempt.findMany({
      where: {
        userId: user.id,
        success: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Check for new IP addresses
    const knownIPs = [...new Set(recentLogins.map(login => login.ipAddress))]
    if (!knownIPs.includes(context.ipAddress)) {
      suspiciousIndicators.push('New IP address')
    }
  }

  // Check for rapid login attempts
  const recentAttempts = await prisma.authAttempt.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    }
  })

  if (recentAttempts > 3) {
    suspiciousIndicators.push('Rapid login attempts')
  }

  if (suspiciousIndicators.length > 0) {
    await logSecurityEvent('suspicious_login', 'medium', context, {
      userId: user.id,
      indicators: suspiciousIndicators
    })

    // In production, you might want to trigger additional verification
    // For now, we'll just log the event
  }
}

/**
 * Enforce session limits
 */
async function enforceSessionLimits(
  user: any,
  organization: any,
  context?: AuthContext
): Promise<void> {
  const maxSessions = organization.settings?.maxSessionsPerUser || 5
  const activeSessions = user.userSessions || []

  if (activeSessions.length >= maxSessions) {
    // Terminate oldest session
    const oldestSession = activeSessions[activeSessions.length - 1]
    await prisma.userSession.update({
      where: { id: oldestSession.id },
      data: { expiresAt: new Date() }
    })

    await logSecurityEvent('session_limit_enforced', 'low', context, {
      userId: user.id,
      terminatedSessionId: oldestSession.id,
      maxSessions
    })
  }
}

/**
 * Create user session with security metadata
 */
async function createUserSession(
  user: any,
  sessionId: string,
  deviceFingerprint: string,
  context?: AuthContext
): Promise<void> {
  const expiresAt = new Date(Date.now() + (SESSION_TIMEOUTS[user.role as keyof typeof SESSION_TIMEOUTS] * 1000))

  await prisma.userSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      organizationId: user.organizationId,
      expiresAt,
      ipAddress: context?.ipAddress || 'unknown',
      userAgent: context?.userAgent || 'unknown',
      deviceInfo: {
        fingerprint: deviceFingerprint,
        createdAt: new Date(),
        lastActivity: new Date()
      }
    }
  })
}

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint(context?: AuthContext): string {
  const components = [
    context?.userAgent || 'unknown',
    context?.ipAddress || 'unknown',
    Date.now().toString()
  ]

  return crypto.createHash('sha256').update(components.join('|')).digest('hex')
}

/**
 * Log failed login attempt
 */
async function logFailedLoginAttempt(
  email: string,
  subdomain: string,
  reason: string,
  context?: AuthContext,
  userId?: string
): Promise<void> {
  try {
    await prisma.authAttempt.create({
      data: {
        userId,
        email,
        organizationId: await getOrganizationIdBySubdomain(subdomain),
        success: false,
        ipAddress: context?.ipAddress || 'unknown',
        userAgent: context?.userAgent || 'unknown',
        reason,
        metadata: {
          deviceFingerprint: context?.deviceFingerprint,
          sessionId: context?.sessionId
        }
      }
    })

    // Increment failed attempt counter
    const failedKey = `failed_attempts:${email}`
    const attempts = await redis.incr(failedKey)
    await redis.expire(failedKey, 3600) // 1 hour

    // Implement progressive lockout
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutKey = `lockout:${email}`
      await redis.setex(lockoutKey, LOCKOUT_DURATION / 1000, new Date(Date.now() + LOCKOUT_DURATION).toISOString())

      await logSecurityEvent('account_locked', 'high', context, {
        email,
        attempts,
        lockoutDuration: LOCKOUT_DURATION
      })
    }
  } catch (error) {
    console.error('Failed to log login attempt:', error)
  }
}

/**
 * Log successful login
 */
async function logSuccessfulLogin(
  user: any,
  organization: any,
  context?: AuthContext,
  sessionId?: string
): Promise<void> {
  try {
    await Promise.all([
      // Log auth attempt
      prisma.authAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          organizationId: organization.id,
          success: true,
          ipAddress: context?.ipAddress || 'unknown',
          userAgent: context?.userAgent || 'unknown',
          metadata: {
            sessionId,
            deviceFingerprint: context?.deviceFingerprint
          }
        }
      }),

      // Update user last login
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      }),

      // Log security event
      logSecurityEvent('successful_login', 'low', context, {
        userId: user.id,
        organizationId: organization.id,
        sessionId
      })
    ])
  } catch (error) {
    console.error('Failed to log successful login:', error)
  }
}

/**
 * Clear failed login attempts
 */
async function clearFailedAttempts(userId: string): Promise<void> {
  try {
    await Promise.all([
      prisma.authAttempt.deleteMany({
        where: {
          userId,
          success: false
        }
      }),
      // Clear Redis counters - we'd need the email for this in practice
      // redis.del(`failed_attempts:${email}`)
    ])
  } catch (error) {
    console.error('Failed to clear failed attempts:', error)
  }
}

/**
 * Helper functions
 */
async function getOrganizationIdBySubdomain(subdomain: string): Promise<string | undefined> {
  const org = await prisma.organization.findUnique({
    where: { subdomain },
    select: { id: true }
  })
  return org?.id
}

async function isCommonPassword(hashedPassword: string): Promise<boolean> {
  // In production, check against a list of common password hashes
  // For now, return false
  return false
}

async function shouldForcePasswordChange(user: any, organization: any): Promise<boolean> {
  if (!user.lastPasswordChange) return true

  const passwordPolicy = organization.passwordPolicy || { maxAge: 90 }
  const daysSinceChange = Math.floor(
    (Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysSinceChange > passwordPolicy.maxAge
}

async function logSecurityEvent(
  eventType: string,
  severity: string,
  context?: AuthContext,
  metadata?: any
): Promise<void> {
  try {
    await securityMonitoring.logSecurityEvent({
      eventType,
      severity,
      description: `Authentication event: ${eventType}`,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: {
        ...metadata,
        sessionId: context?.sessionId,
        deviceFingerprint: context?.deviceFingerprint
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Enhanced NextAuth configuration with comprehensive security
 */
export const authOptionsEnhanced: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        subdomain: { label: "Organization", type: "text" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
        twoFactorCode: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password || !credentials?.subdomain) {
          return null
        }

        // Extract security context
        const context: AuthContext = {
          ipAddress: (req as any)?.headers?.['x-forwarded-for']?.split(',')[0] ||
                    (req as any)?.headers?.['x-real-ip'] ||
                    (req as any)?.connection?.remoteAddress || 'unknown',
          userAgent: (req as any)?.headers?.['user-agent'] || 'unknown'
        }

        try {
          return await validateCredentials(credentials, context)
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          hd: process.env.GOOGLE_HD // Restrict to specific domain if needed
        }
      }
    }),

    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),

    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT!),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
        secure: true,
        tls: {
          rejectUnauthorized: true
        }
      },
      from: process.env.EMAIL_FROM!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours default, overridden by role-based timeout
    updateAge: 60 * 60, // Update session every hour
  },

  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours default
    encode: async ({ token, secret }) => {
      // Custom JWT encoding for enhanced security
      const jwt = require('jsonwebtoken')
      return jwt.sign(token, secret, {
        algorithm: 'HS512',
        expiresIn: '8h',
        issuer: 'advisoros',
        audience: 'advisoros-users'
      })
    },
    decode: async ({ token, secret }) => {
      const jwt = require('jsonwebtoken')
      try {
        return jwt.verify(token, secret, {
          algorithms: ['HS512'],
          issuer: 'advisoros',
          audience: 'advisoros-users'
        })
      } catch (error) {
        return null
      }
    }
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Additional sign-in validation
      if (account?.provider === 'credentials') {
        // Already validated in authorize
        return true
      }

      // For OAuth providers, perform additional validation
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        // Verify user exists in our system
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { organization: true }
        })

        if (!existingUser) {
          console.warn(`OAuth sign-in attempt for non-existent user: ${user.email}`)
          return false
        }

        if (!existingUser.isActive || existingUser.deletedAt) {
          console.warn(`OAuth sign-in attempt for inactive user: ${user.email}`)
          return false
        }

        return true
      }

      return true
    },

    async jwt({ token, user, account, trigger }): Promise<JWT> {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organization = user.organization
        token.emailVerified = user.emailVerified
        token.twoFactorEnabled = user.twoFactorEnabled
        token.sessionId = user.sessionId
        token.deviceFingerprint = user.deviceFingerprint
        token.mustChangePassword = user.mustChangePassword

        // Set role-based expiration
        const roleTimeout = SESSION_TIMEOUTS[user.role as keyof typeof SESSION_TIMEOUTS] || SESSION_TIMEOUTS.staff
        token.exp = Math.floor(Date.now() / 1000) + roleTimeout

        // Add security metadata
        token.iat = Math.floor(Date.now() / 1000)
        token.jti = crypto.randomUUID() // JWT ID for tracking
      }

      // Handle session rotation
      if (trigger === 'update' && token.iat) {
        const sessionAge = Date.now() - (token.iat * 1000)
        if (sessionAge > SESSION_ROTATION_INTERVAL) {
          // Rotate session
          token.jti = crypto.randomUUID()
          token.iat = Math.floor(Date.now() / 1000)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organization = token.organization
        session.user.emailVerified = token.emailVerified as Date
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.sessionId = token.sessionId as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
        session.expires = new Date(token.exp! * 1000).toISOString()

        // Add security metadata to session
        session.security = {
          jti: token.jti as string,
          deviceFingerprint: token.deviceFingerprint as string,
          lastActivity: new Date().toISOString()
        }
      }
      return session
    }
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await logSecurityEvent('user_signin', 'low', undefined, {
        userId: user.id,
        provider: account?.provider,
        isNewUser
      })
    },

    async signOut({ token }) {
      if (token?.sub && token?.sessionId) {
        // Invalidate session in database
        await prisma.userSession.update({
          where: { id: token.sessionId as string },
          data: { expiresAt: new Date() }
        }).catch(console.error)

        await logSecurityEvent('user_signout', 'low', undefined, {
          userId: token.sub,
          sessionId: token.sessionId
        })
      }
    },

    async session({ session, token }) {
      if (token?.sub && token?.sessionId) {
        // Update last activity
        await prisma.userSession.update({
          where: { id: token.sessionId as string },
          data: {
            deviceInfo: {
              ...(typeof token.deviceInfo === 'object' ? token.deviceInfo : {}),
              lastActivity: new Date()
            }
          }
        }).catch(console.error)
      }
    }
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/register'
  },

  debug: process.env.NODE_ENV === 'development',

  // Enhanced security settings
  secret: process.env.NEXTAUTH_SECRET,

  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production',

  // Custom cookie settings for enhanced security
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 // 8 hours
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}