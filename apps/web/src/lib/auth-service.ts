import { prisma } from '@cpa-platform/database'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

interface PasswordValidation {
  isValid: boolean
  errors: string[]
  score: number // 0-4, where 4 is strongest
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
}

class AuthService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeEmailTransporter()
  }

  private initializeEmailTransporter() {
    if (process.env.EMAIL_SERVER_HOST) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: process.env.EMAIL_SERVER_PORT === '465',
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })
    }
  }

  /**
   * Generate a cryptographically secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Validate password strength according to security policies
   */
  validatePasswordStrength(password: string): PasswordValidation {
    const errors: string[] = []
    let score = 0

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    } else if (password.length >= 12) {
      score += 1
    }

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter')
    } else {
      score += 1
    }

    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter')
    } else {
      score += 1
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number')
    } else {
      score += 1
    }

    if (!hasSymbols) {
      errors.push('Password must contain at least one special character')
    } else {
      score += 1
    }

    // Common password patterns
    const commonPatterns = [
      /^(.)\1+$/, // All same character
      /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
      /^(password|admin|user|test|guest|demo|sample)/i
    ]

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns and is not secure')
        score = Math.max(0, score - 2)
        break
      }
    }

    // Check against common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common')
      score = 0
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(4, score)
    }
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Simple in-memory rate limiting (replace with Redis in production)
   */
  private rateLimitStore = new Map<string, { count: number; resetTime: Date }>()

  async checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    const now = new Date()
    const stored = this.rateLimitStore.get(key)

    if (!stored || now > stored.resetTime) {
      // First attempt or window expired
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + windowSeconds * 1000)
      })
      return false // Not rate limited
    }

    if (stored.count >= maxAttempts) {
      return true // Rate limited
    }

    // Increment count
    stored.count += 1
    this.rateLimitStore.set(key, stored)
    return false // Not rate limited yet
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimit() {
    const now = new Date()
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (now > value.resetTime) {
        this.rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
    subdomain: string
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured')
    }

    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&subdomain=${subdomain}`

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your email address - CPA Platform',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Welcome to CPA Platform!</h2>
          <p>Hello ${name},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #0066cc; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by CPA Platform. If you have questions, please contact support.
          </p>
        </div>
      `,
    }

    await this.transporter.sendMail(mailOptions)
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
    subdomain: string
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured')
    }

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&subdomain=${subdomain}`

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset your password - CPA Platform',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #dc3545; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This reset link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by CPA Platform. If you have questions, please contact support.
          </p>
        </div>
      `,
    }

    await this.transporter.sendMail(mailOptions)
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmationEmail(
    email: string,
    name: string,
    subdomain: string
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured')
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password changed successfully - CPA Platform',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Password Changed Successfully</h2>
          <p>Hello ${name},</p>
          <p>Your password has been successfully changed for your CPA Platform account.</p>
          <p><strong>When:</strong> ${new Date().toLocaleString()}</p>
          <p>If you didn't make this change, please contact support immediately:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:support@cpaplatform.com"
               style="background-color: #dc3545; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Contact Support
            </a>
          </div>
          <p>For your security, we recommend:</p>
          <ul>
            <li>Using a unique, strong password</li>
            <li>Enabling two-factor authentication</li>
            <li>Regularly reviewing your account activity</li>
          </ul>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by CPA Platform. If you have questions, please contact support.
          </p>
        </div>
      `,
    }

    await this.transporter.sendMail(mailOptions)
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(
    email: string,
    name: string,
    token: string,
    subdomain: string,
    role: string,
    inviterName: string,
    message?: string
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured')
    }

    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/register?token=${token}&subdomain=${subdomain}`

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `You've been invited to join CPA Platform`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>You're Invited to Join CPA Platform!</h2>
          <p>Hello ${name},</p>
          <p>${inviterName} has invited you to join their organization on CPA Platform as a <strong>${role}</strong>.</p>
          ${message ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <p style="margin: 0;"><strong>Personal message:</strong></p>
              <p style="margin: 10px 0 0 0;">${message}</p>
            </div>
          ` : ''}
          <p>Click the button below to accept the invitation and create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}"
               style="background-color: #28a745; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact ${inviterName} or our support team.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by CPA Platform. If you have questions, please contact support.
          </p>
        </div>
      `,
    }

    await this.transporter.sendMail(mailOptions)
  }

  /**
   * Log authentication events for audit purposes
   */
  async logAuthEvent(
    userId: string,
    type: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await prisma.authEvent.create({
        data: {
          userId,
          type,
          metadata
        }
      })
    } catch (error) {
      console.error('Failed to log auth event:', error)
      // Don't throw error as this shouldn't break the main flow
    }
  }

  /**
   * Get user's authentication events for audit
   */
  async getUserAuthEvents(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    return prisma.authEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Clean up expired tokens and sessions
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date()

    await Promise.all([
      // Clean up expired verification tokens
      prisma.user.updateMany({
        where: {
          emailVerificationExpires: { lt: now }
        },
        data: {
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      }),

      // Clean up expired reset tokens
      prisma.user.updateMany({
        where: {
          passwordResetExpires: { lt: now }
        },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null
        }
      }),

      // Clean up expired invitations
      prisma.invitation.deleteMany({
        where: {
          expiresAt: { lt: now },
          usedAt: null
        }
      }),

      // Clean up old auth attempts (keep only last 30 days)
      prisma.authAttempt.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),

      // Clean up old auth events (keep only last 90 days)
      prisma.authEvent.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    // Clean up rate limit cache
    this.cleanupRateLimit()
  }

  /**
   * Initialize cleanup job (call this on app startup)
   */
  startCleanupJob(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredTokens().catch(console.error)
    }, 60 * 60 * 1000)

    // Initial cleanup
    this.cleanupExpiredTokens().catch(console.error)
  }
}

// Export singleton instance
export const authService = new AuthService()