import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      organizationId: string
      organization: Organization
      emailVerified: Date | null
      twoFactorEnabled: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    organizationId: string
    organization: Organization
    emailVerified: Date | null
    twoFactorEnabled: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string
    organizationId: string
    organization: Organization
    emailVerified: Date | null
    twoFactorEnabled: boolean
  }
}

export interface Organization {
  id: string
  name: string
  subdomain: string
  settings: OrganizationSettings
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationSettings {
  requireEmailVerification: boolean
  passwordPolicy: PasswordPolicy
  sessionTimeout: number
  allowSocialLogin: boolean
  twoFactorRequired: boolean
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
  preventReuse: number
  maxAge: number
}

export interface AuthAttempt {
  id: string
  userId?: string
  email: string
  organizationId: string
  success: boolean
  ipAddress: string
  userAgent: string
  reason?: string
  createdAt: Date
}

export interface AuthEvent {
  id: string
  userId: string
  type: AuthEventType
  provider?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export type AuthEventType =
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'REGISTRATION'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'EMAIL_VERIFIED'
  | 'EMAIL_VERIFICATION_RESENT'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'USER_INVITED'
  | 'INVITATION_CANCELLED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'

export interface Invitation {
  id: string
  email: string
  name: string
  role: UserRole
  token: string
  expiresAt: Date
  usedAt?: Date
  message?: string
  organizationId: string
  invitedById: string
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'owner' | 'admin' | 'cpa' | 'staff' | 'client'

export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  score: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
}

export interface AuthServiceConfig {
  emailProvider: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  rateLimit: {
    maxAttempts: number
    windowMs: number
  }
  tokenExpiry: {
    verification: number
    resetPassword: number
    invitation: number
  }
}