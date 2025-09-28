import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from "../../../../../server/db"
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate secret for 2FA
    const secret = speakeasy.generateSecret({
      name: `CPA Platform (${session.user.email})`,
      issuer: 'CPA Platform',
      length: 32,
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Store temporary secret (not yet activated)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret.base32, // Store but don't activate yet
        twoFactorEnabled: false, // Keep disabled until verified
      },
    })

    // Log the setup attempt
    await prisma.authEvent.create({
      data: {
        userId: session.user.id,
        type: '2FA_SETUP_INITIATED',
        metadata: {
          ip: request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
    })

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: secret.base32,
      backupCodes: [], // Will be generated after verification
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
        twoFactorBackupCodes: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      backupCodesCount: user.twoFactorBackupCodes?.length || 0,
    })
  } catch (error) {
    console.error('2FA status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Verify password
    const bcrypt = require('bcryptjs')
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    // If 2FA is enabled, verify the code
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { error: '2FA code required' },
          { status: 400 }
        )
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
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
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    })

    // Log the disable event
    await prisma.authEvent.create({
      data: {
        userId: session.user.id,
        type: '2FA_DISABLED',
        metadata: {
          ip: request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA has been disabled',
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}