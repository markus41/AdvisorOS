import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import { UserRole } from "@/types/auth"
import { redirect } from "next/navigation"

/**
 * Get the current session on the server side
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

/**
 * Get the current user or redirect to sign in
 */
export async function requireAuth(redirectTo?: string) {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect(redirectTo || '/auth/signin')
  }

  return session
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: UserRole[]): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    client: 1,
    staff: 2,
    cpa: 3,
    admin: 4,
    owner: 5,
  }

  const userLevel = roleHierarchy[userRole as UserRole] || 0

  return requiredRoles.some(role => {
    const requiredLevel = roleHierarchy[role] || 0
    return userLevel >= requiredLevel
  })
}

/**
 * Require specific role or redirect
 */
export async function requireRole(requiredRoles: UserRole[], redirectTo?: string) {
  const session = await requireAuth()

  if (!hasRole(session.user.role, requiredRoles)) {
    redirect(redirectTo || '/unauthorized')
  }

  return session
}

/**
 * Check if user can access organization resources
 */
export function canAccessOrganization(
  userOrgId: string,
  targetOrgId: string,
  userRole: string
): boolean {
  // Owners and admins can access their organization
  if (userOrgId === targetOrgId) {
    return true
  }

  // Future: Add cross-organization access rules here
  return false
}

/**
 * Format role name for display
 */
export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    cpa: 'CPA',
    staff: 'Staff Member',
    client: 'Client',
  }

  return roleMap[role] || role
}

/**
 * Get role permissions
 */
export function getRolePermissions(role: UserRole): string[] {
  const permissions: Record<UserRole, string[]> = {
    owner: [
      'manage_organization',
      'manage_users',
      'manage_billing',
      'manage_settings',
      'view_all_data',
      'manage_integrations',
    ],
    admin: [
      'manage_users',
      'manage_settings',
      'view_all_data',
      'manage_clients',
      'manage_staff',
    ],
    cpa: [
      'manage_clients',
      'view_client_data',
      'create_reports',
      'manage_tax_returns',
      'view_financial_data',
    ],
    staff: [
      'view_assigned_clients',
      'update_client_data',
      'create_documents',
      'view_tasks',
    ],
    client: [
      'view_own_data',
      'upload_documents',
      'view_reports',
      'update_profile',
    ],
  }

  return permissions[role] || []
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = getRolePermissions(userRole)
  return permissions.includes(permission)
}

/**
 * Get user's effective permissions (including inherited ones)
 */
export function getEffectivePermissions(userRole: UserRole): string[] {
  // Lower roles inherit some permissions from higher roles
  const basePermissions = getRolePermissions(userRole)

  // Add inherited permissions based on role hierarchy
  if (['admin', 'owner'].includes(userRole)) {
    basePermissions.push(...getRolePermissions('cpa'))
  }

  if (['cpa', 'admin', 'owner'].includes(userRole)) {
    basePermissions.push(...getRolePermissions('staff'))
  }

  if (['staff', 'cpa', 'admin', 'owner'].includes(userRole)) {
    basePermissions.push(...getRolePermissions('client'))
  }

  // Remove duplicates
  return [...new Set(basePermissions)]
}

/**
 * Check if session is still valid
 */
export function isSessionValid(session: any): boolean {
  if (!session?.expires) return false

  const expiryTime = new Date(session.expires).getTime()
  const now = Date.now()

  return expiryTime > now
}

/**
 * Get time until session expires
 */
export function getSessionTimeRemaining(session: any): number {
  if (!session?.expires) return 0

  const expiryTime = new Date(session.expires).getTime()
  const now = Date.now()

  return Math.max(0, expiryTime - now)
}

/**
 * Check if session is close to expiry (within 5 minutes)
 */
export function isSessionNearExpiry(session: any): boolean {
  const timeRemaining = getSessionTimeRemaining(session)
  return timeRemaining > 0 && timeRemaining < 5 * 60 * 1000 // 5 minutes
}

/**
 * Generate secure subdomain suggestion
 */
export function generateSubdomainSuggestion(organizationName: string): string {
  return organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20)
}

/**
 * Validate subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

  return (
    subdomain.length >= 3 &&
    subdomain.length <= 20 &&
    pattern.test(subdomain) &&
    !subdomain.includes('--') &&
    !isReservedSubdomain(subdomain)
  )
}

/**
 * Check if subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  const reserved = [
    'www', 'api', 'app', 'admin', 'support', 'help', 'blog',
    'mail', 'email', 'ftp', 'cdn', 'assets', 'static', 'files',
    'login', 'signin', 'signup', 'auth', 'security', 'privacy',
    'terms', 'about', 'contact', 'pricing', 'billing', 'account',
    'dashboard', 'settings', 'profile', 'users', 'team', 'teams',
  ]

  return reserved.includes(subdomain.toLowerCase())
}

/**
 * Sanitize user input for logging
 */
export function sanitizeForLog(input: string): string {
  // Remove potential sensitive information from logs
  return input
    .replace(/password/gi, '[REDACTED]')
    .replace(/token/gi, '[REDACTED]')
    .replace(/secret/gi, '[REDACTED]')
    .replace(/key/gi, '[REDACTED]')
}

/**
 * Get client IP address from request
 */
export function getClientIP(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  const realIP = headers.get('x-real-ip')
  const forwarded = headers.get('forwarded')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (forwarded) {
    const match = forwarded.match(/for=([^;,]+)/)
    if (match) {
      return match[1].replace(/"/g, '')
    }
  }

  return 'unknown'
}