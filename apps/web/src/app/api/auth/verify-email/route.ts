import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "../../../../server/db"
import { z } from 'zod'
import { authService } from '@/lib/auth-service'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.ip || 'unknown'

    // Validate input
    const { token } = verifyEmailSchema.parse(body)

    // Rate limiting check
    const rateLimitKey = `verify-email:${clientIP}:${token}`
    const rateLimited = await authService.checkRateLimit(rateLimitKey, 10, 3600) // 10 attempts per hour

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
        emailVerified: null,
        deletedAt: null
      },
      include: {
        organization: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update user as verified and clear verification tokens
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      })

      // Log email verification event
      await tx.authEvent.create({
        data: {
          userId: user.id,
          type: 'EMAIL_VERIFIED',
          metadata: {
            ip: clientIP,
            email: user.email
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now sign in to your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)

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

// Resend verification email
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.ip || 'unknown'

    const { email, subdomain } = z.object({
      email: z.string().email('Invalid email address'),
      subdomain: z.string().min(1, 'Organization subdomain is required'),
    }).parse(body)

    // Rate limiting check for resend
    const rateLimitKey = `resend-verification:${clientIP}:${email}`
    const rateLimited = await authService.checkRateLimit(rateLimitKey, 3, 3600) // 3 resends per hour

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many resend attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { subdomain }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Find unverified user
    const user = await prisma.user.findFirst({
      where: {
        email,
        organizationId: organization.id,
        emailVerified: null,
        deletedAt: null
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or email already verified' },
        { status: 404 }
      )
    }

    // Generate new verification token
    const emailVerificationToken = authService.generateToken()
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires
      }
    })

    // Send verification email
    try {
      await authService.sendVerificationEmail(
        user.email,
        user.name,
        emailVerificationToken,
        subdomain
      )
    } catch (error) {
      console.error('Failed to send verification email:', error)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

    // Log resend event
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION_RESENT',
        metadata: {
          ip: clientIP,
          email: user.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your email.'
    })

  } catch (error) {
    console.error('Resend verification error:', error)

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