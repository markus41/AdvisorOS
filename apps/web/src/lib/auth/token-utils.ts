import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  email: string
  organizationId: string
  type: 'email_verification' | 'password_reset' | 'magic_link' | 'invitation' | 'api_access'
  expiresAt: Date
  metadata?: Record<string, any>
}

export interface TokenValidationResult {
  valid: boolean
  expired: boolean
  payload?: TokenPayload
  error?: string
}

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generates a URL-safe random token
 */
export function generateUrlSafeToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url')
}

/**
 * Generates a numeric token (for SMS, etc.)
 */
export function generateNumericToken(length: number = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

/**
 * Creates a JWT token with payload
 */
export function createJWTToken(
  payload: Omit<TokenPayload, 'expiresAt'>,
  expiresIn: string = '1h'
): string {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'

  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    {
      expiresIn,
      issuer: 'cpa-platform',
      audience: 'cpa-platform-users',
    }
  )
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyJWTToken(token: string): TokenValidationResult {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'

    const decoded = jwt.verify(token, secret, {
      issuer: 'cpa-platform',
      audience: 'cpa-platform-users',
    }) as any

    return {
      valid: true,
      expired: false,
      payload: {
        userId: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        type: decoded.type,
        expiresAt: new Date(decoded.exp * 1000),
        metadata: decoded.metadata,
      }
    }
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        expired: true,
        error: 'Token has expired'
      }
    } else if (error.name === 'JsonWebTokenError') {
      return {
        valid: false,
        expired: false,
        error: 'Invalid token'
      }
    } else {
      return {
        valid: false,
        expired: false,
        error: 'Token verification failed'
      }
    }
  }
}

/**
 * Creates a magic link token
 */
export function createMagicLinkToken(
  userId: string,
  email: string,
  organizationId: string
): string {
  return createJWTToken(
    {
      userId,
      email,
      organizationId,
      type: 'magic_link',
      metadata: {
        createdAt: new Date().toISOString(),
      }
    },
    '15m' // Magic links expire in 15 minutes
  )
}

/**
 * Creates an email verification token
 */
export function createEmailVerificationToken(
  userId: string,
  email: string,
  organizationId: string
): string {
  return createJWTToken(
    {
      userId,
      email,
      organizationId,
      type: 'email_verification',
      metadata: {
        createdAt: new Date().toISOString(),
      }
    },
    '24h' // Email verification tokens expire in 24 hours
  )
}

/**
 * Creates a password reset token
 */
export function createPasswordResetToken(
  userId: string,
  email: string,
  organizationId: string
): string {
  return createJWTToken(
    {
      userId,
      email,
      organizationId,
      type: 'password_reset',
      metadata: {
        createdAt: new Date().toISOString(),
      }
    },
    '1h' // Password reset tokens expire in 1 hour
  )
}

/**
 * Creates an invitation token
 */
export function createInvitationToken(
  inviterUserId: string,
  inviteeEmail: string,
  organizationId: string,
  role: string
): string {
  return createJWTToken(
    {
      userId: inviterUserId,
      email: inviteeEmail,
      organizationId,
      type: 'invitation',
      metadata: {
        role,
        createdAt: new Date().toISOString(),
      }
    },
    '7d' // Invitation tokens expire in 7 days
  )
}

/**
 * Creates an API access token
 */
export function createAPIToken(
  userId: string,
  email: string,
  organizationId: string,
  scopes: string[],
  expiresIn: string = '30d'
): string {
  return createJWTToken(
    {
      userId,
      email,
      organizationId,
      type: 'api_access',
      metadata: {
        scopes,
        createdAt: new Date().toISOString(),
      }
    },
    expiresIn
  )
}

/**
 * Hashes a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Compares a token with its hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashToken(token)
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash, 'hex'),
    Buffer.from(hash, 'hex')
  )
}

/**
 * Creates a token with expiry for database storage
 */
export function createTimedToken(expiryHours: number = 24): {
  token: string
  hashedToken: string
  expiresAt: Date
} {
  const token = generateSecureToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

  return {
    token,
    hashedToken,
    expiresAt
  }
}

/**
 * Validates token timing to prevent timing attacks
 */
export async function validateTokenTiming<T>(
  validationFn: () => Promise<T>,
  minTimeMs: number = 100
): Promise<T> {
  const startTime = Date.now()
  const result = await validationFn()
  const elapsed = Date.now() - startTime

  if (elapsed < minTimeMs) {
    await new Promise(resolve => setTimeout(resolve, minTimeMs - elapsed))
  }

  return result
}

/**
 * Generates backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }

  return codes
}

/**
 * Validates backup code format
 */
export function isValidBackupCode(code: string): boolean {
  // Backup codes should be 8 character hex strings
  return /^[A-F0-9]{8}$/i.test(code.replace(/\s/g, ''))
}

/**
 * Formats backup code for display
 */
export function formatBackupCode(code: string): string {
  // Format as XXXX-XXXX for better readability
  const cleaned = code.replace(/\s/g, '').toUpperCase()
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`
}

/**
 * Generates a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Validates CSRF token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false

  return crypto.timingSafeEqual(
    Buffer.from(token, 'base64url'),
    Buffer.from(expectedToken, 'base64url')
  )
}

/**
 * Creates a session token
 */
export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Token expiry utilities
 */
export const TOKEN_EXPIRY = {
  // Short-lived tokens
  MAGIC_LINK: 15 * 60, // 15 minutes
  TWO_FACTOR: 5 * 60, // 5 minutes
  CSRF: 60 * 60, // 1 hour

  // Medium-lived tokens
  PASSWORD_RESET: 60 * 60, // 1 hour
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours

  // Long-lived tokens
  INVITATION: 7 * 24 * 60 * 60, // 7 days
  API_ACCESS: 30 * 24 * 60 * 60, // 30 days
  REFRESH_TOKEN: 90 * 24 * 60 * 60, // 90 days
} as const

/**
 * Checks if a token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Gets time remaining until token expires
 */
export function getTokenTimeRemaining(expiresAt: Date): {
  seconds: number
  minutes: number
  hours: number
  expired: boolean
} {
  const now = new Date()
  const remaining = expiresAt.getTime() - now.getTime()

  if (remaining <= 0) {
    return { seconds: 0, minutes: 0, hours: 0, expired: true }
  }

  const seconds = Math.floor(remaining / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  return {
    seconds: seconds % 60,
    minutes: minutes % 60,
    hours,
    expired: false
  }
}