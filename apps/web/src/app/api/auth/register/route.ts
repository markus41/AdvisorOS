import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "../../../../server/db"
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authService } from '@/lib/auth-service'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be at most 20 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  role: z.enum(['owner', 'admin', 'cpa', 'staff', 'client']).optional().default('owner'),
  invitationToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.ip || 'unknown'

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Rate limiting check for registration
    const rateLimitKey = `register:${clientIP}`
    const rateLimited = await authService.checkRateLimit(rateLimitKey, 5, 3600) // 5 attempts per hour

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Handle invitation-based registration
    if (validatedData.invitationToken) {
      return await handleInvitationRegistration(validatedData, clientIP)
    }

    // Handle new organization registration
    return await handleNewOrganizationRegistration(validatedData, clientIP)

  } catch (error) {
    console.error('Registration error:', error)

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

async function handleInvitationRegistration(
  data: z.infer<typeof registerSchema>,
  clientIP: string
) {
  // Validate invitation token
  const invitation = await prisma.invitation.findUnique({
    where: {
      token: data.invitationToken,
      expiresAt: { gt: new Date() },
      usedAt: null
    },
    include: {
      organization: true
    }
  })

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid or expired invitation token' },
      { status: 400 }
    )
  }

  if (invitation.email !== data.email) {
    return NextResponse.json(
      { error: 'Email does not match invitation' },
      { status: 400 }
    )
  }

  // Check if user already exists in this organization
  const existingUser = await prisma.user.findFirst({
    where: {
      email: data.email,
      organizationId: invitation.organizationId
    }
  })

  if (existingUser) {
    return NextResponse.json(
      { error: 'User already exists in this organization' },
      { status: 409 }
    )
  }

  // Validate password strength
  const passwordValidation = authService.validatePasswordStrength(data.password)
  if (!passwordValidation.isValid) {
    return NextResponse.json(
      { error: 'Password does not meet requirements', details: passwordValidation.errors },
      { status: 400 }
    )
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12)

  // Create user and mark invitation as used
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        hashedPassword,
        role: invitation.role,
        organizationId: invitation.organizationId,
        emailVerified: new Date(), // Auto-verify for invited users
      },
      include: {
        organization: true
      }
    })

    // Mark invitation as used
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() }
    })

    // Log registration event
    await tx.authEvent.create({
      data: {
        userId: newUser.id,
        type: 'REGISTRATION',
        metadata: {
          method: 'invitation',
          invitationId: invitation.id,
          ip: clientIP
        }
      }
    })

    return newUser
  })

  return NextResponse.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId
    }
  })
}

async function handleNewOrganizationRegistration(
  data: z.infer<typeof registerSchema>,
  clientIP: string
) {
  // Check if subdomain is available
  const existingOrg = await prisma.organization.findUnique({
    where: { subdomain: data.subdomain }
  })

  if (existingOrg) {
    return NextResponse.json(
      { error: 'Subdomain is already taken' },
      { status: 409 }
    )
  }

  // Check if user already exists with this email
  const existingUser = await prisma.user.findFirst({
    where: { email: data.email }
  })

  if (existingUser) {
    return NextResponse.json(
      { error: 'User with this email already exists' },
      { status: 409 }
    )
  }

  // Validate password strength
  const passwordValidation = authService.validatePasswordStrength(data.password)
  if (!passwordValidation.isValid) {
    return NextResponse.json(
      { error: 'Password does not meet requirements', details: passwordValidation.errors },
      { status: 400 }
    )
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12)

  // Generate email verification token
  const emailVerificationToken = authService.generateToken()

  // Create organization and owner user
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: data.organizationName,
        subdomain: data.subdomain,
        settings: {
          requireEmailVerification: true,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: true
          }
        }
      }
    })

    // Create owner user
    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        hashedPassword,
        role: 'owner',
        organizationId: organization.id,
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      include: {
        organization: true
      }
    })

    // Log registration event
    await tx.authEvent.create({
      data: {
        userId: user.id,
        type: 'REGISTRATION',
        metadata: {
          method: 'new_organization',
          organizationId: organization.id,
          ip: clientIP
        }
      }
    })

    return { user, organization }
  })

  // Send verification email
  try {
    await authService.sendVerificationEmail(
      result.user.email,
      result.user.name,
      emailVerificationToken,
      data.subdomain
    )
  } catch (error) {
    console.error('Failed to send verification email:', error)
    // Don't fail registration if email fails
  }

  return NextResponse.json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      organizationId: result.user.organizationId,
      emailVerified: result.user.emailVerified
    },
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      subdomain: result.organization.subdomain
    }
  })
}