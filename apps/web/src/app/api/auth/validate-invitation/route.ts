import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "../../../../server/db"
import { z } from 'zod'

const validateInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateInvitationSchema.parse(body)

    // Find invitation with the token
    const invitation = await prisma.invitation.findUnique({
      where: {
        token: validatedData.token
      },
      include: {
        organization: true,
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation has already been used
    if (invitation.usedAt) {
      return NextResponse.json(
        { error: 'Invitation has already been used' },
        { status: 400 }
      )
    }

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: invitation.email,
        organizationId: invitation.organizationId,
        deletedAt: null
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        message: invitation.message,
        expiresAt: invitation.expiresAt.toISOString(),
        organization: {
          name: invitation.organization.name,
          subdomain: invitation.organization.subdomain
        },
        inviter: {
          name: invitation.invitedBy.name,
          email: invitation.invitedBy.email
        }
      }
    })

  } catch (error) {
    console.error('Invitation validation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}