import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "../../../../server/db"
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authService } from '@/lib/auth-service'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.ip || 'unknown'

    // Validate input
    const { token, password } = resetPasswordSchema.parse(body)

    // Rate limiting check
    const rateLimitKey = `reset-password:${clientIP}:${token}`
    const rateLimited = await authService.checkRateLimit(rateLimitKey, 5, 3600) // 5 attempts per hour

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null
      },
      include: {
        organization: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(password, user.hashedPassword || '')
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset tokens
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          passwordChangedAt: new Date(),
          // Clear failed auth attempts on successful password reset
        }
      })

      // Clear any failed auth attempts
      await tx.authAttempt.deleteMany({
        where: {
          userId: user.id,
          success: false
        }
      })

      // Log password reset completion
      await tx.authEvent.create({
        data: {
          userId: user.id,
          type: 'PASSWORD_RESET_COMPLETE',
          metadata: {
            ip: clientIP,
            resetToken: token.substring(0, 8) + '...' // Log partial token for tracking
          }
        }
      })
    })

    // Send confirmation email
    try {
      await authService.sendPasswordChangeConfirmationEmail(
        user.email,
        user.name,
        user.organization.subdomain
      )
    } catch (error) {
      console.error('Failed to send password change confirmation email:', error)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}