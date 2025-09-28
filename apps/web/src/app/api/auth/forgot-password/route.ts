import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@cpa-platform/database'
import { z } from 'zod'
import { authService } from '@/lib/auth-service'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  subdomain: z.string().min(1, 'Organization subdomain is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.ip || 'unknown'

    // Validate input
    const { email, subdomain } = forgotPasswordSchema.parse(body)

    // Rate limiting check
    const rateLimitKey = `forgot-password:${clientIP}:${email}`
    const rateLimited = await authService.checkRateLimit(rateLimitKey, 3, 3600) // 3 attempts per hour

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { subdomain }
    })

    if (!organization) {
      // Don't reveal if organization exists
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email,
        organizationId: organization.id,
        deletedAt: null
      }
    })

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = authService.generateToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    })

    // Log password reset request
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET_REQUEST',
        metadata: {
          ip: clientIP,
          email
        }
      }
    })

    // Send reset email
    try {
      await authService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken,
        subdomain
      )
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)

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