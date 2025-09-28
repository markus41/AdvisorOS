import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@cpa-platform/database'
import { z } from 'zod'

const checkSubdomainSchema = z.object({
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be at most 20 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = checkSubdomainSchema.parse(body)

    // Check if subdomain exists
    const existingOrg = await prisma.organization.findUnique({
      where: { subdomain: validatedData.subdomain }
    })

    // Reserved subdomains that shouldn't be used
    const reservedSubdomains = [
      'www', 'api', 'app', 'admin', 'support', 'help', 'docs', 'blog',
      'mail', 'email', 'ftp', 'sftp', 'ssh', 'ssl', 'tls', 'vpn',
      'cdn', 'static', 'assets', 'media', 'images', 'files', 'uploads',
      'staging', 'dev', 'test', 'demo', 'sandbox', 'preview',
      'secure', 'portal', 'dashboard', 'panel', 'console', 'management',
      'billing', 'payment', 'pay', 'invoice', 'account', 'accounts',
      'login', 'signin', 'signup', 'register', 'auth', 'oauth',
      'status', 'health', 'monitor', 'metrics', 'analytics',
      'legal', 'privacy', 'terms', 'about', 'contact', 'careers',
      'cpa', 'tax', 'accounting', 'finance', 'financial'
    ]

    const isReserved = reservedSubdomains.includes(validatedData.subdomain.toLowerCase())

    return NextResponse.json({
      available: !existingOrg && !isReserved,
      exists: !!existingOrg,
      reserved: isReserved,
      subdomain: validatedData.subdomain,
    })

  } catch (error) {
    console.error('Subdomain check error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid subdomain format',
          details: error.errors,
          available: false
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to check subdomain availability',
        available: false
      },
      { status: 500 }
    )
  }
}

// GET method for checking subdomain via query parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain parameter is required' },
        { status: 400 }
      )
    }

    // Use the same logic as POST
    const validatedData = checkSubdomainSchema.parse({ subdomain })

    const existingOrg = await prisma.organization.findUnique({
      where: { subdomain: validatedData.subdomain }
    })

    const reservedSubdomains = [
      'www', 'api', 'app', 'admin', 'support', 'help', 'docs', 'blog',
      'mail', 'email', 'ftp', 'sftp', 'ssh', 'ssl', 'tls', 'vpn',
      'cdn', 'static', 'assets', 'media', 'images', 'files', 'uploads',
      'staging', 'dev', 'test', 'demo', 'sandbox', 'preview',
      'secure', 'portal', 'dashboard', 'panel', 'console', 'management',
      'billing', 'payment', 'pay', 'invoice', 'account', 'accounts',
      'login', 'signin', 'signup', 'register', 'auth', 'oauth',
      'status', 'health', 'monitor', 'metrics', 'analytics',
      'legal', 'privacy', 'terms', 'about', 'contact', 'careers',
      'cpa', 'tax', 'accounting', 'finance', 'financial'
    ]

    const isReserved = reservedSubdomains.includes(validatedData.subdomain.toLowerCase())

    return NextResponse.json({
      available: !existingOrg && !isReserved,
      exists: !!existingOrg,
      reserved: isReserved,
      subdomain: validatedData.subdomain,
    })

  } catch (error) {
    console.error('Subdomain check error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid subdomain format',
          details: error.errors,
          available: false
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to check subdomain availability',
        available: false
      },
      { status: 500 }
    )
  }
}