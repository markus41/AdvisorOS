import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from "../../../../server/db"
import { z } from 'zod'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

const setupTwoFactorSchema = z.object({
  enable: z.boolean(),
  token: z.string().optional(),
})

const verifyTwoFactorSchema = z.object({
  token: z.string().min(6, '2FA token must be 6 digits').max(6, '2FA token must be 6 digits'),
})

// Setup or disable 2FA
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
    const { enable, token } = setupTwoFactorSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (enable) {
      // Enable 2FA
      if (user.twoFactorEnabled) {
        return NextResponse.json(
          { error: '2FA is already enabled' },
          { status: 400 }
        )
      }

      if (!token) {
        // Generate new secret and return setup info
        const secret = speakeasy.generateSecret({
          name: `${user.organization.name} (${user.email})`,
          issuer: 'CPA Platform',
          length: 20
        })

        // Store temporary secret (not activated until verified)
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorSecret: secret.base32 }
        })

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

        return NextResponse.json({
          secret: secret.base32,
          qrCode: qrCodeUrl,
          backupCodes: [], // Will be generated after verification
          message: 'Scan the QR code with your authenticator app and verify with a token to complete setup'
        })
      } else {
        // Verify token and activate 2FA
        if (!user.twoFactorSecret) {
          return NextResponse.json(
            { error: '2FA setup not initiated. Please start setup first.' },
            { status: 400 }
          )
        }

        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token,
          window: 2
        })

        if (!verified) {
          return NextResponse.json(
            { error: 'Invalid 2FA token' },
            { status: 400 }
          )
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () =>
          Math.random().toString(36).substring(2, 10).toUpperCase()
        )

        // Activate 2FA
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: {
              twoFactorEnabled: true,
              twoFactorBackupCodes: backupCodes
            }
          })

          // Log 2FA activation
          await tx.authEvent.create({
            data: {
              userId: user.id,
              type: 'TWO_FACTOR_ENABLED',
              metadata: {
                method: 'totp'
              }
            }
          })
        })

        return NextResponse.json({
          success: true,
          message: '2FA has been enabled successfully',
          backupCodes,
          warning: 'Please save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.'
        })
      }
    } else {
      // Disable 2FA
      if (!user.twoFactorEnabled) {
        return NextResponse.json(
          { error: '2FA is not enabled' },
          { status: 400 }
        )
      }

      if (!token) {
        return NextResponse.json(
          { error: 'Current 2FA token required to disable 2FA' },
          { status: 400 }
        )
      }

      // Verify current token before disabling
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token,
        window: 2
      })

      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid 2FA token' },
          { status: 400 }
        )
      }

      // Disable 2FA
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: []
          }
        })

        // Log 2FA deactivation
        await tx.authEvent.create({
          data: {
            userId: user.id,
            type: 'TWO_FACTOR_DISABLED',
            metadata: {
              method: 'user_request'
            }
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: '2FA has been disabled successfully'
      })
    }

  } catch (error) {
    console.error('2FA setup error:', error)

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

// Verify 2FA token during login
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyTwoFactorSchema.parse(body)

    // This endpoint would be called during the login flow
    // The actual verification is handled in the auth.ts file
    // This is mainly for backup code verification

    return NextResponse.json({
      message: 'This endpoint is for backup code verification only'
    })

  } catch (error) {
    console.error('2FA verification error:', error)

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

// Get 2FA status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: user.twoFactorBackupCodes?.length || 0
    })

  } catch (error) {
    console.error('2FA status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}