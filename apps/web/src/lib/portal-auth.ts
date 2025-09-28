'use client'

import React from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ClientSession {
  id: string
  clientId: string
  email: string
  name: string
  organizationId: string
  organizationName: string
  expiresAt: Date
  lastActivity: Date
}

interface PortalAuthState {
  session: ClientSession | null
  isLoading: boolean
  error: string | null
  setSession: (session: ClientSession | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  checkSession: () => Promise<boolean>
  refreshSession: () => Promise<void>
}

// 15 minutes session timeout
const SESSION_TIMEOUT = 15 * 60 * 1000

export const usePortalAuth = create<PortalAuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      error: null,

      setSession: (session) => {
        set({
          session,
          error: null,
          isLoading: false
        })
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      logout: async () => {
        const { session } = get()
        if (session) {
          try {
            await fetch('/api/portal/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
          } catch (error) {
            console.error('Logout error:', error)
          }
        }
        set({ session: null, error: null })
      },

      checkSession: async () => {
        const { session } = get()

        if (!session) {
          return false
        }

        // Check if session has expired
        const now = new Date()
        const expiresAt = new Date(session.expiresAt)
        const lastActivity = new Date(session.lastActivity)

        if (now > expiresAt || (now.getTime() - lastActivity.getTime()) > SESSION_TIMEOUT) {
          set({ session: null })
          return false
        }

        try {
          const response = await fetch('/api/portal/auth/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: session.id }),
          })

          if (!response.ok) {
            set({ session: null })
            return false
          }

          // Update last activity
          const updatedSession = {
            ...session,
            lastActivity: now
          }
          set({ session: updatedSession })
          return true
        } catch (error) {
          console.error('Session validation error:', error)
          set({ session: null })
          return false
        }
      },

      refreshSession: async () => {
        const { session } = get()
        if (!session) return

        try {
          const response = await fetch('/api/portal/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: session.id }),
          })

          if (response.ok) {
            const refreshedSession = await response.json()
            set({ session: refreshedSession })
          } else {
            set({ session: null })
          }
        } catch (error) {
          console.error('Session refresh error:', error)
          set({ session: null })
        }
      },
    }),
    {
      name: 'portal-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
)

export interface MagicLinkRequest {
  email: string
  organizationId?: string
}

export interface MagicLinkResponse {
  success: boolean
  message: string
  redirectUrl?: string
}

export class PortalAuthService {
  static async sendMagicLink(request: MagicLinkRequest): Promise<MagicLinkResponse> {
    try {
      const response = await fetch('/api/portal/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Magic link error:', error)
      return {
        success: false,
        message: 'An error occurred while sending the magic link. Please try again.',
      }
    }
  }

  static async verifyMagicLink(token: string): Promise<ClientSession | null> {
    try {
      const response = await fetch('/api/portal/auth/verify-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const session = await response.json()
        return session
      }
      return null
    } catch (error) {
      console.error('Magic link verification error:', error)
      return null
    }
  }

  static async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/portal/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        message: 'An error occurred while sending the password reset email.',
      }
    }
  }

  static async updatePassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/portal/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Password update error:', error)
      return {
        success: false,
        message: 'An error occurred while updating your password.',
      }
    }
  }
}

// Hook to check authentication status and redirect if needed
export function usePortalAuthGuard() {
  const { session, checkSession, isLoading } = usePortalAuth()

  React.useEffect(() => {
    const validateSession = async () => {
      if (!session) {
        window.location.href = '/portal/login'
        return
      }

      const isValid = await checkSession()
      if (!isValid) {
        window.location.href = '/portal/login'
      }
    }

    validateSession()

    // Set up periodic session validation
    const interval = setInterval(validateSession, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [session, checkSession])

  return { session, isLoading }
}

// Session activity tracker
export function usePortalSessionActivity() {
  const { session, refreshSession } = usePortalAuth()

  React.useEffect(() => {
    if (!session) return

    const handleActivity = () => {
      refreshSession()
    }

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [session, refreshSession])
}