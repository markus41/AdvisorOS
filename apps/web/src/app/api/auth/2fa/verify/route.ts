import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@cpa-platform/database'
import speakeasy from 'speakeasy'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character codes with uppercase letters and numbers
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

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
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Get user with secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'No 2FA setup found. Please start setup first.' },
        { status: 400 }
      )
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps (30 seconds) before and after
    })

    if (!verified) {
      // Log failed verification attempt
      await prisma.authEvent.create({
        data: {
          userId: session.user.id,
          type: '2FA_VERIFICATION_FAILED',
          metadata: {
            ip: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            providedCode: code,
          },
        },
      })

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes()

    // Enable 2FA and store backup codes
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes,
      },
    })

    // Log successful setup
    await prisma.authEvent.create({
      data: {
        userId: session.user.id,
        type: '2FA_ENABLED',
        metadata: {
          ip: request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          backupCodesGenerated: backupCodes.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA has been successfully enabled',
      backupCodes,
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Verify backup code
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { backupCode } = body

    if (!backupCode) {
      return NextResponse.json(
        { error: 'Backup code is required' },
        { status: 400 }
      )
    }

    // Get user with backup codes
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorBackupCodes: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      )
    }

    const backupCodes = user.twoFactorBackupCodes || []
    const codeIndex = backupCodes.findIndex(
      (code) => code.toUpperCase() === backupCode.toUpperCase()
    )

    if (codeIndex === -1) {
      // Log failed backup code attempt
      await prisma.authEvent.create({
        data: {
          userId: session.user.id,
          type: '2FA_BACKUP_CODE_FAILED',
          metadata: {
            ip: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            providedCode: backupCode,
          },
        },
      })

      return NextResponse.json(
        { error: 'Invalid backup code' },
        { status: 400 }
      )
    }

    // Remove used backup code
    const updatedBackupCodes = backupCodes.filter((_, index) => index !== codeIndex)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorBackupCodes: updatedBackupCodes,
      },
    })

    // Log successful backup code use
    await prisma.authEvent.create({
      data: {
        userId: session.user.id,
        type: '2FA_BACKUP_CODE_USED',
        metadata: {
          ip: request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          remainingCodes: updatedBackupCodes.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Backup code verified successfully',
      remainingCodes: updatedBackupCodes.length,
    })
  } catch (error) {
    console.error('Backup code verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Regenerate backup codes
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { password, twoFactorCode } = body

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        hashedPassword: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      )
    }

    // Verify password
    const bcrypt = require('bcryptjs')
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    // Verify 2FA code
    if (!twoFactorCode) {
      return NextResponse.json(
        { error: '2FA code required' },
        { status: 400 }
      )
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2,
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 400 }
      )
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorBackupCodes: newBackupCodes,
      },
    })

    // Log backup codes regeneration
    await prisma.authEvent.create({
      data: {
        userId: session.user.id,
        type: '2FA_BACKUP_CODES_REGENERATED',
        metadata: {
          ip: request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          newCodesCount: newBackupCodes.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      backupCodes: newBackupCodes,
    })
  } catch (error) {
    console.error('Backup codes regeneration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}