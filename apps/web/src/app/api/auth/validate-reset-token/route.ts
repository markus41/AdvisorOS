import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@cpa-platform/database'
import { z } from 'zod'

const validateResetTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  subdomain: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateResetTokenSchema.parse(body)

    // Find user with the reset token
    let user = await prisma.user.findFirst({
      where: {
        passwordResetToken: validatedData.token,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        },
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

    // If subdomain is provided, verify it matches
    if (validatedData.subdomain && user.organization.subdomain !== validatedData.subdomain) {
      return NextResponse.json(
        { error: 'Token does not match the specified organization' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      organization: {
        name: user.organization.name,
        subdomain: user.organization.subdomain
      }
    })

  } catch (error) {
    console.error('Reset token validation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to validate reset token' },
      { status: 500 }
    )
  }
}