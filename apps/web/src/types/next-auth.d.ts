import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      organizationId: string
      organization: {
        id: string
        name: string
        subdomain: string
        subscriptionTier: string
      }
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role: string
    organizationId: string
    organization: {
      id: string
      name: string
      subdomain: string
      subscriptionTier: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string
    organizationId?: string
    organization?: {
      id: string
      name: string
      subdomain: string
      subscriptionTier: string
    }
  }
}