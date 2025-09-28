'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface VerifyEmailContentProps {
  token: string
}

function VerifyEmailContent({ token }: VerifyEmailContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get('subdomain')

  const [isLoading, setIsLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link')
        setVerificationStatus('error')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, subdomain }),
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to verify email')
          setVerificationStatus('error')
          toast.error(result.error || 'Email verification failed')
        } else {
          setVerificationStatus('success')
          setUserEmail(result.email || '')
          toast.success('Email verified successfully!')
        }
      } catch (error) {
        console.error('Email verification error:', error)
        setError('An unexpected error occurred')
        setVerificationStatus('error')
        toast.error('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [token, subdomain])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Verifying your email...
          </p>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Verification Failed
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {error || 'We couldn\'t verify your email address'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  What went wrong?
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>• The verification link may have expired (valid for 24 hours)</p>
                  <p>• The link may have already been used</p>
                  <p>• The link may be invalid or corrupted</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/resend-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subdomain }),
                      })

                      const result = await response.json()

                      if (response.ok) {
                        toast.success('New verification email sent!')
                      } else {
                        toast.error(result.error || 'Failed to resend verification email')
                      }
                    } catch (error) {
                      toast.error('Failed to resend verification email')
                    }
                  }}
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Resend verification email
                </button>

                <Link
                  href="/auth/register"
                  className="block w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Create new account
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Verified!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {userEmail && (
              <>
                <span className="font-medium text-gray-900 dark:text-white">
                  {userEmail}
                </span>
                {' '}has been successfully verified
              </>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                You're all set!
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Email address verified</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Account activation complete</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Ready to access your account</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <Link
                href={`/auth/signin${subdomain ? `?subdomain=${subdomain}&message=Email verified successfully! You can now sign in.` : '?message=Email verified successfully! You can now sign in.'}`}
                className="inline-flex items-center w-full justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Your account is secure
            </h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <p>✓ Email verification completed</p>
              <p>✓ Strong password encryption</p>
              <p>✓ Optional two-factor authentication</p>
              <p>✓ Secure session management</p>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Need help?{' '}
            <a
              href="mailto:support@cpaplatform.com"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Contact support
            </a>
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

export default function VerifyEmailPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent token={params.token} />
    </Suspense>
  )
}