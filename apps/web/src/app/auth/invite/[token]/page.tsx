'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, CheckCircle, XCircle, Building, Mail, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { RegisterForm } from '@/components/auth/register-form'

interface InvitationData {
  id: string
  email: string
  role: string
  organization: {
    name: string
    subdomain: string
  }
  inviter: {
    name: string
    email: string
  }
  expiresAt: string
  message?: string
}

interface InviteContentProps {
  token: string
}

function InviteContent({ token }: InviteContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [acceptanceStep, setAcceptanceStep] = useState<'validate' | 'register' | 'success'>('validate')

  // Validate invitation token on component mount
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/validate-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Invalid or expired invitation')
        } else {
          setInvitation(result.invitation)
          setAcceptanceStep('register')
        }
      } catch (error) {
        console.error('Invitation validation error:', error)
        setError('Failed to validate invitation')
      } finally {
        setIsLoading(false)
      }
    }

    validateInvitation()
  }, [token])

  const handleRegistrationComplete = () => {
    setAcceptanceStep('success')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Validating invitation...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This invitation link may have expired or been used already. Team invitations are valid for 7 days.
              </p>
              <div className="space-y-2">
                <Link
                  href="/auth/register"
                  className="block w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create new organization
                </Link>
                <Link
                  href="/auth/signin"
                  className="block w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Sign in to existing account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (acceptanceStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Welcome to the team!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              You've successfully joined{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {invitation?.organization.name}
              </span>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  You're all set!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can now sign in to access your organization's CPA platform.
                </p>
              </div>

              <Link
                href={`/auth/signin?subdomain=${invitation?.organization.subdomain}&message=Account created successfully! You can now sign in.`}
                className="block w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  const isExpired = new Date() > new Date(invitation.expiresAt)

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Invitation Expired
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              This invitation has expired. Please request a new invitation from your team administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            You're invited!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Join your team on the CPA platform
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-white dark:bg-gray-800 py-6 px-6 shadow rounded-lg">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Invitation Details
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invitation.organization.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {invitation.organization.subdomain}.cpa.com
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Invited by{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {invitation.inviter.name}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {invitation.inviter.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Role:{' '}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {invitation.role}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Invited to: {invitation.email}
                  </p>
                </div>
              </div>
            </div>

            {invitation.message && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Personal message:</span>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  "{invitation.message}"
                </p>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This invitation expires on{' '}
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
              Create your account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
              Fill in your details to join the team
            </p>
          </div>

          <RegisterForm
            mode="invitation"
            invitationToken={token}
          />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href={`/auth/signin?subdomain=${invitation.organization.subdomain}`}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

interface PageProps {
  params: {
    token: string
  }
}

export default function InvitePage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <InviteContent token={params.token} />
    </Suspense>
  )
}