import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import MicrosoftProvider from "next-auth/providers/microsoft"
import AzureADProvider from "next-auth/providers/azure-ad"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "../server/db"
import bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"

// Role-based session timeout configuration (in seconds)
const SESSION_TIMEOUTS = {
  client: 15 * 60, // 15 minutes for client portal
  staff: 60 * 60, // 1 hour for staff
  cpa: 4 * 60 * 60, // 4 hours for CPAs
  admin: 8 * 60 * 60, // 8 hours for admins
  owner: 24 * 60 * 60, // 24 hours for owners
} as const

async function validateCredentials(credentials: Record<string, string>) {
  if (!credentials?.email || !credentials?.password || !credentials?.subdomain) {
    throw new Error("Missing required credentials")
  }

  // Find organization by subdomain
  const organization = await prisma.organization.findUnique({
    where: { subdomain: credentials.subdomain }
  })

  if (!organization) {
    throw new Error("Organization not found")
  }

  // Find user by email and organization
  const user = await prisma.user.findFirst({
    where: {
      email: credentials.email,
      organizationId: organization.id,
      deletedAt: null, // Ensure user is not soft deleted
    },
    include: {
      organization: true,
      authAttempts: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!user) {
    // Log failed attempt for non-existent user
    await prisma.authAttempt.create({
      data: {
        email: credentials.email,
        organizationId: organization.id,
        success: false,
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        reason: 'User not found'
      }
    })
    throw new Error("Invalid credentials")
  }

  // Check if account is locked
  const failedAttempts = user.authAttempts.filter(attempt => !attempt.success)
  if (failedAttempts.length >= 5) {
    const lastAttempt = failedAttempts[0]
    const lockoutTime = new Date(lastAttempt.createdAt.getTime() + 30 * 60 * 1000) // 30 minutes lockout

    if (new Date() < lockoutTime) {
      await prisma.authAttempt.create({
        data: {
          userId: user.id,
          email: credentials.email,
          organizationId: organization.id,
          success: false,
          ipAddress: credentials.ipAddress || 'unknown',
          userAgent: credentials.userAgent || 'unknown',
          reason: 'Account locked'
        }
      })
      throw new Error("Account locked due to too many failed attempts. Please try again later.")
    }
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(credentials.password, user.hashedPassword || '')

  if (!isPasswordValid) {
    // Log failed attempt
    await prisma.authAttempt.create({
      data: {
        userId: user.id,
        email: credentials.email,
        organizationId: organization.id,
        success: false,
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        reason: 'Invalid password'
      }
    })
    throw new Error("Invalid credentials")
  }

  // Check if email is verified
  if (!user.emailVerified && organization.requireEmailVerification) {
    throw new Error("Please verify your email before signing in")
  }

  // Log successful attempt and clear failed attempts
  await Promise.all([
    prisma.authAttempt.create({
      data: {
        userId: user.id,
        email: credentials.email,
        organizationId: organization.id,
        success: true,
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown'
      }
    }),
    // Clear old failed attempts on successful login
    prisma.authAttempt.deleteMany({
      where: {
        userId: user.id,
        success: false
      }
    })
  ])

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organization: user.organization,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        subdomain: { label: "Organization", type: "text" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
        twoFactorCode: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials, req) {
        try {
          const user = await validateCredentials({
            ...credentials!,
            ipAddress: req.headers?.['x-forwarded-for'] as string || req.ip,
            userAgent: req.headers?.['user-agent'] as string
          })

          // Handle 2FA if enabled
          if (user.twoFactorEnabled && credentials?.twoFactorCode) {
            const userWithSecret = await prisma.user.findUnique({
              where: { id: user.id },
              select: { twoFactorSecret: true }
            })

            if (!userWithSecret?.twoFactorSecret) {
              throw new Error("2FA configuration error")
            }

            const speakeasy = require('speakeasy')
            const verified = speakeasy.totp.verify({
              secret: userWithSecret.twoFactorSecret,
              encoding: 'base32',
              token: credentials.twoFactorCode,
              window: 2
            })

            if (!verified) {
              throw new Error("Invalid 2FA code")
            }
          } else if (user.twoFactorEnabled) {
            throw new Error("2FA code required")
          }

          return user
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours default, overridden by role-based timeout
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours default
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Handle OAuth provider sign-ins
      if (account?.provider !== "credentials" && account?.provider !== "email") {
        // For OAuth providers, we need to associate with an organization
        // This would typically be handled by a custom sign-in page that captures subdomain
        const subdomain = credentials?.subdomain || profile?.subdomain

        if (!subdomain) {
          return '/auth/select-organization'
        }

        const organization = await prisma.organization.findUnique({
          where: { subdomain }
        })

        if (!organization) {
          return false
        }

        // Check if user exists in this organization
        const existingUser = await prisma.user.findFirst({
          where: {
            email: user.email!,
            organizationId: organization.id
          }
        })

        if (!existingUser) {
          return '/auth/error?error=UserNotInOrganization'
        }

        // Update user with OAuth account info if needed
        user.organizationId = organization.id
        user.organization = organization
      }

      return true
    },
    async jwt({ token, user, account }): Promise<JWT> {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organization = user.organization
        token.emailVerified = user.emailVerified
        token.twoFactorEnabled = user.twoFactorEnabled

        // Set role-based expiration
        const roleTimeout = SESSION_TIMEOUTS[user.role as keyof typeof SESSION_TIMEOUTS] || SESSION_TIMEOUTS.client
        token.exp = Math.floor(Date.now() / 1000) + roleTimeout
      }

      // Refresh session if close to expiry (within 10 minutes)
      if (token.exp && token.exp < Math.floor(Date.now() / 1000) + 600) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { organization: true }
        })

        if (user) {
          const roleTimeout = SESSION_TIMEOUTS[user.role as keyof typeof SESSION_TIMEOUTS] || SESSION_TIMEOUTS.client
          token.exp = Math.floor(Date.now() / 1000) + roleTimeout
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organization = token.organization
        session.user.emailVerified = token.emailVerified as Date
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.expires = new Date(token.exp! * 1000).toISOString()
      }
      return session
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in event
      await prisma.authEvent.create({
        data: {
          userId: user.id,
          type: 'SIGN_IN',
          provider: account?.provider || 'unknown',
          metadata: {
            isNewUser,
            provider: account?.provider,
            ip: 'unknown' // This would be set by middleware
          }
        }
      })
    },
    async signOut({ token }) {
      // Log sign-out event
      if (token?.sub) {
        await prisma.authEvent.create({
          data: {
            userId: token.sub,
            type: 'SIGN_OUT',
            metadata: {
              reason: 'user_initiated'
            }
          }
        })
      }
    },
    async session({ session, token }) {
      // Update last activity
      if (token?.sub) {
        await prisma.user.update({
          where: { id: token.sub },
          data: { lastActiveAt: new Date() }
        })
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/register'
  },
  debug: process.env.NODE_ENV === 'development',
}