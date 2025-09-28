import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from "../../server/db"
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

export interface SessionInfo {
  id: string
  userId: string
  organizationId: string
  role: string
  email: string
  name: string
  emailVerified: Date | null
  twoFactorEnabled: boolean
  lastActiveAt: Date
  ipAddress: string
  userAgent: string
}

export interface DeviceInfo {
  id: string
  name: string
  browser: string
  os: string
  device: string
  lastActiveAt: Date
  ipAddress: string
  isCurrent: boolean
}

/**
 * Gets the current session from NextAuth
 */
export async function getCurrentSession(): Promise<SessionInfo | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true }
  })

  if (!user) {
    return null
  }

  return {
    id: session.user.id,
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    lastActiveAt: user.lastActiveAt || user.updatedAt,
    ipAddress: 'unknown', // This would be set by middleware
    userAgent: 'unknown'
  }
}

/**
 * Validates a session and checks if it should be refreshed
 */
export async function validateSession(sessionToken: string): Promise<{
  valid: boolean
  expired: boolean
  user?: SessionInfo
  shouldRefresh?: boolean
}> {
  try {
    // This would typically involve checking the session token against your database
    // For NextAuth, the session validation is handled internally
    const session = await getCurrentSession()

    if (!session) {
      return { valid: false, expired: false }
    }

    // Check if session is close to expiry (within 10 minutes)
    const now = new Date()
    const sessionExpiry = new Date(session.lastActiveAt.getTime() + (24 * 60 * 60 * 1000)) // 24 hours
    const shouldRefresh = sessionExpiry.getTime() - now.getTime() < (10 * 60 * 1000) // 10 minutes

    return {
      valid: true,
      expired: false,
      user: session,
      shouldRefresh
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return { valid: false, expired: true }
  }
}

/**
 * Updates user's last activity timestamp
 */
export async function updateLastActivity(userId: string, ipAddress?: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
        lastActiveIpAddress: ipAddress
      }
    })
  } catch (error) {
    console.error('Failed to update last activity:', error)
  }
}

/**
 * Logs a security event
 */
export async function logSecurityEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await prisma.authEvent.create({
      data: {
        userId,
        type: eventType,
        metadata
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Gets user's device sessions
 */
export async function getUserDevices(userId: string): Promise<DeviceInfo[]> {
  // This would require a device/session tracking table
  // For now, we'll return mock data based on auth events
  const recentEvents = await prisma.authEvent.findMany({
    where: {
      userId,
      type: 'SIGN_IN',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const devices: DeviceInfo[] = []
  const seenDevices = new Set<string>()

  for (const event of recentEvents) {
    const metadata = event.metadata as any
    const userAgent = metadata?.userAgent || 'Unknown'
    const ipAddress = metadata?.ip || 'Unknown'

    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress)

    if (!seenDevices.has(deviceFingerprint)) {
      seenDevices.add(deviceFingerprint)

      const parsedUA = parseUserAgent(userAgent)

      devices.push({
        id: deviceFingerprint,
        name: `${parsedUA.browser} on ${parsedUA.os}`,
        browser: parsedUA.browser,
        os: parsedUA.os,
        device: parsedUA.device,
        lastActiveAt: event.createdAt,
        ipAddress,
        isCurrent: false // Would need to check against current session
      })
    }
  }

  return devices
}

/**
 * Revokes all sessions for a user except the current one
 */
export async function revokeOtherSessions(userId: string, currentSessionId?: string): Promise<void> {
  // This would require session tracking in the database
  // For NextAuth, you'd need to implement custom session handling

  // Log the security event
  await logSecurityEvent(userId, 'SESSIONS_REVOKED', {
    revokedAt: new Date(),
    reason: 'user_initiated'
  })
}

/**
 * Checks if an IP address is suspicious
 */
export async function checkSuspiciousActivity(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  isSuspicious: boolean
  reasons: string[]
  riskLevel: 'low' | 'medium' | 'high'
}> {
  const reasons: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' = 'low'

  // Get user's recent activity
  const recentEvents = await prisma.authEvent.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Check for new IP address
  const knownIPs = new Set(
    recentEvents
      .map(event => (event.metadata as any)?.ip)
      .filter(Boolean)
  )

  if (!knownIPs.has(ipAddress)) {
    reasons.push('New IP address')
    riskLevel = 'medium'
  }

  // Check for new user agent
  const knownUserAgents = new Set(
    recentEvents
      .map(event => (event.metadata as any)?.userAgent)
      .filter(Boolean)
  )

  if (!knownUserAgents.has(userAgent)) {
    reasons.push('New device/browser')
    if (riskLevel === 'low') riskLevel = 'medium'
  }

  // Check for rapid successive login attempts
  const recentLogins = recentEvents.filter(
    event => event.type === 'SIGN_IN' &&
    event.createdAt > new Date(Date.now() - 60 * 60 * 1000) // Last hour
  )

  if (recentLogins.length > 5) {
    reasons.push('Multiple recent login attempts')
    riskLevel = 'high'
  }

  // Check for failed attempts from this IP
  const failedAttempts = await prisma.authAttempt.findMany({
    where: {
      ipAddress,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  })

  if (failedAttempts.length > 3) {
    reasons.push('Recent failed login attempts from this IP')
    riskLevel = 'high'
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    riskLevel
  }
}

/**
 * Generates a device fingerprint
 */
function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const data = `${userAgent}:${ipAddress}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

/**
 * Parses user agent string to extract device info
 */
function parseUserAgent(userAgent: string): {
  browser: string
  os: string
  device: string
} {
  // Simple user agent parsing - in production, use a proper library
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  // Browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  else if (userAgent.includes('Opera')) browser = 'Opera'

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac OS')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  // Device detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'Mobile'
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'Tablet'

  return { browser, os, device }
}

/**
 * Gets session timeout based on user role
 */
export function getSessionTimeout(role: string): number {
  const timeouts = {
    client: 15 * 60, // 15 minutes
    staff: 60 * 60, // 1 hour
    cpa: 4 * 60 * 60, // 4 hours
    admin: 8 * 60 * 60, // 8 hours
    owner: 24 * 60 * 60, // 24 hours
  }

  return timeouts[role as keyof typeof timeouts] || timeouts.client
}

/**
 * Checks if session should be extended based on activity
 */
export function shouldExtendSession(
  lastActivity: Date,
  sessionTimeout: number
): boolean {
  const now = new Date()
  const timeSinceActivity = now.getTime() - lastActivity.getTime()
  const extensionThreshold = sessionTimeout * 0.75 // Extend when 75% of timeout has passed

  return timeSinceActivity > extensionThreshold * 1000
}