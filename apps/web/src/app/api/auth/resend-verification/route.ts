import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "../../../../server/db"
import { authService } from '@/lib/auth-service'
import { z } from 'zod'

const resendVerificationSchema = z.object({
  subdomain: z.string().min(1, 'Organization subdomain is required'),
  email: z.string().email('Invalid email address').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = resendVerificationSchema.parse(body)

    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.ip || 'unknown'

    // Rate limiting check for resend verification
    const rateLimitKey = `resend-verification:${clientIP}`
    const rateLimited = await authService.checkRateLimit(rateLimitKey, 3, 3600) // 3 attempts per hour

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many verification emails sent. Please try again later.' },
        { status: 429 }
      )
    }

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { subdomain: validatedData.subdomain }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Find user who needs verification
    let user
    if (validatedData.email) {
      // Find specific user by email
      user = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          organizationId: organization.id,
          emailVerified: null, // Not verified yet
          deletedAt: null
        }
      })
    } else {
      // Find any unverified user in the organization (less secure, but for general resend)
      user = await prisma.user.findFirst({
        where: {
          organizationId: organization.id,
          emailVerified: null,
          deletedAt: null
        },
        orderBy: {
          createdAt: 'desc' // Get the most recently created unverified user
        }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No unverified user found' },
        { status: 404 }
      )
    }

    // Check if user already has a recent verification token
    if (user.emailVerificationExpires && user.emailVerificationExpires > new Date()) {
      return NextResponse.json(
        { error: 'A verification email was already sent recently. Please check your email.' },
        { status: 400 }
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
        organization.subdomain
      )

      // Log the resend event
      await prisma.authEvent.create({
        data: {
          userId: user.id,
          type: 'VERIFICATION_EMAIL_RESENT',
          metadata: {
            ip: clientIP,
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
        email: user.email
      })

    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Resend verification error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}