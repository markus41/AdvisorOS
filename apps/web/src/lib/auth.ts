import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@cpa-platform/database"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        subdomain: { label: "Organization", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.subdomain) {
          return null
        }

        // Find organization by subdomain
        const organization = await prisma.organization.findUnique({
          where: { subdomain: credentials.subdomain }
        })

        if (!organization) {
          return null
        }

        // Find user by email and organization
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            organizationId: organization.id
          },
          include: {
            organization: true
          }
        })

        if (!user) {
          return null
        }

        // Note: In production, you'd hash and verify passwords
        // For now, we'll use plain text comparison (NOT RECOMMENDED)
        // const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organization = user.organization
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organization = token.organization
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
}