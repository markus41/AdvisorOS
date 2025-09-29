import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "../server/db"
import * as bcrypt from "bcryptjs"
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
        failureReason: 'User not found'
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
          failureReason: 'Account locked'
        }
      })
      throw new Error("Account locked due to too many failed attempts. Please try again later.")
    }
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(credentials.password, user.password || '')

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
        failureReason: 'Invalid password'
      }
    })
    throw new Error("Invalid credentials")
  }

  // Email verification check - simplified for current schema
  // TODO: Add emailVerified field to User model when email verification is implemented

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
    organization: user.organization
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
          // Get IP address from request headers for security logging
          const getClientIP = (req: any): string => {
            const forwarded = req.headers?.['x-forwarded-for'];
            const realIP = req.headers?.['x-real-ip'];

            if (typeof forwarded === 'string') {
              return forwarded.split(',')[0].trim();
            }
            if (Array.isArray(forwarded)) {
              return forwarded[0];
            }
            if (typeof realIP === 'string') {
              return realIP;
            }
            if (Array.isArray(realIP)) {
              return realIP[0];
            }
            return 'unknown';
          };

          const ipAddress = getClientIP(req);
          const userAgent = req.headers?.['user-agent'] || 'unknown';

          // Add IP and user agent to credentials for logging
          const enhancedCredentials = {
            ...credentials,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent
          };

          // Use the secure validateCredentials function
          return await validateCredentials(enhancedCredentials);
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
      // Validate that user belongs to an organization
      if (user.organizationId && user.organization) {
        return true;
      }

      // For OAuth providers, check if user exists in database
      if (account && account.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { organization: true }
        });

        if (!existingUser) {
          console.error('OAuth user not found in database:', user.email);
          return false;
        }

        // Update user info from OAuth provider
        user.id = existingUser.id;
        user.organizationId = existingUser.organizationId;
        user.organization = existingUser.organization;
        user.role = existingUser.role;

        return true;
      }

      return true;
    },
    async jwt({ token, user, account }): Promise<JWT> {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organization = user.organization

        // Set role-based expiration
        const roleTimeout = SESSION_TIMEOUTS[user.role as keyof typeof SESSION_TIMEOUTS] || SESSION_TIMEOUTS.client
        token.exp = Math.floor(Date.now() / 1000) + roleTimeout
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organization = token.organization
        session.expires = new Date(token.exp! * 1000).toISOString()
      }
      return session
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in event
      try {
        await prisma.authEvent.create({
          data: {
            userId: user.id,
            eventType: 'SIGN_IN',
            success: true,
            description: `User signed in via ${account?.provider || 'credentials'}`,
            metadata: {
              isNewUser,
              provider: account?.provider,
              ipAddress: 'unknown' // This would be set by middleware
            }
          }
        })
      } catch (error) {
        console.error('Failed to log sign-in event:', error);
      }
    },
    async signOut({ token }) {
      // Log sign-out event
      if (token?.sub) {
        try {
          await prisma.authEvent.create({
            data: {
              userId: token.sub,
              type: 'SIGN_OUT',
              metadata: {
                reason: 'user_initiated'
              }
            }
          })
        } catch (error) {
          console.error('Failed to log sign-out event:', error);
        }
      }
    },
    async session({ session, token }) {
      // Update last activity
      if (token?.sub) {
        try {
          await prisma.user.update({
            where: { id: token.sub },
            data: { lastActiveAt: new Date() }
          })
        } catch (error) {
          console.error('Failed to update last activity:', error);
        }
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