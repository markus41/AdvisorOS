import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@cpa-platform/database'
import { z } from 'zod'
import { authService } from '@/lib/auth-service'

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'cpa', 'staff', 'client'], {
    errorMap: () => ({ message: 'Invalid role. Must be admin, cpa, staff, or client' })
  }),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  message: z.string().optional(),
})

const ROLE_PERMISSIONS = {
  owner: ['admin', 'cpa', 'staff', 'client'],
  admin: ['cpa', 'staff', 'client'],
  cpa: ['staff', 'client'],
  staff: ['client'],
  client: []
} as const

// Send invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, role, name, message } = inviteUserSchema.parse(body)

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if current user can invite users with this role
    const allowedRoles = ROLE_PERMISSIONS[currentUser.role as keyof typeof ROLE_PERMISSIONS] || []
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `You cannot invite users with the role: ${role}` },
        { status: 403 }
      )
    }

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: currentUser.organizationId
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists in your organization' },
        { status: 409 }
      )
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: currentUser.organizationId,
        expiresAt: { gt: new Date() },
        usedAt: null
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 409 }
      )
    }

    // Generate invitation token
    const token = authService.generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        name,
        role,
        token,
        expiresAt,
        message,
        organizationId: currentUser.organizationId,
        invitedById: currentUser.id
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

    // Send invitation email
    try {
      await authService.sendInvitationEmail(
        email,
        name,
        token,
        currentUser.organization.subdomain,
        role,
        currentUser.name,
        message
      )
    } catch (error) {
      console.error('Failed to send invitation email:', error)
      // Delete the invitation if email fails
      await prisma.invitation.delete({
        where: { id: invitation.id }
      })
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again later.' },
        { status: 500 }
      )
    }

    // Log invitation event
    await prisma.authEvent.create({
      data: {
        userId: currentUser.id,
        type: 'USER_INVITED',
        metadata: {
          invitedEmail: email,
          invitedRole: role,
          invitationId: invitation.id
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      }
    })

  } catch (error) {
    console.error('Invitation error:', error)

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

// Get pending invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only admins and owners can view invitations
    if (!['admin', 'owner'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: currentUser.organizationId,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        role: inv.role,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        invitedBy: inv.invitedBy,
        message: inv.message
      }))
    })

  } catch (error) {
    console.error('Get invitations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Cancel invitation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check permissions - only the inviter, admins, or owners can cancel
    if (invitation.organizationId !== currentUser.organizationId ||
        (invitation.invitedById !== currentUser.id &&
         !['admin', 'owner'].includes(currentUser.role))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Delete invitation
    await prisma.invitation.delete({
      where: { id: invitationId }
    })

    // Log cancellation event
    await prisma.authEvent.create({
      data: {
        userId: currentUser.id,
        type: 'INVITATION_CANCELLED',
        metadata: {
          invitationId,
          invitedEmail: invitation.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}