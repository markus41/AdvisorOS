'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Building, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RegisterForm } from '@/components/auth/register-form'

function RegisterContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const subdomain = searchParams.get('subdomain')
  const mode = token ? 'invitation' : 'organization'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className={cn(
            "mx-auto h-12 w-12 flex items-center justify-center rounded-full",
            mode === 'invitation'
              ? "bg-green-100 dark:bg-green-900"
              : "bg-blue-100 dark:bg-blue-900"
          )}>
            {mode === 'invitation' ? (
              <Users className={cn(
                "h-6 w-6",
                "text-green-600 dark:text-green-400"
              )} />
            ) : (
              <Building className={cn(
                "h-6 w-6",
                "text-blue-600 dark:text-blue-400"
              )} />
            )}
          </div>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {mode === 'invitation' ? 'Join your organization' : 'Create your organization'}
          </h2>

          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {mode === 'invitation' ? (
              <>
                You've been invited to join an organization.{' '}
                <Link
                  href="/auth/signin"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Already have an account?
                </Link>
              </>
            ) : (
              <>
                Already have an organization?{' '}
                <Link
                  href="/auth/signin"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign in here
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
          {mode === 'invitation' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Team Invitation
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>
                      You're creating an account to join an existing organization.
                      Your account will be linked to this organization automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'organization' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Building className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    New Organization
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      You're creating a new organization and will become the owner.
                      You'll be able to invite team members after setup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <RegisterForm
            mode={mode}
            invitationToken={token || undefined}
          />
        </div>

        {/* Feature Highlights */}
        <div className="bg-white dark:bg-gray-800 py-6 px-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            What you'll get:
          </h3>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-5 w-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Complete client relationship management</span>
            </li>
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-5 w-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Automated tax return processing</span>
            </li>
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-5 w-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure document management</span>
            </li>
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-5 w-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Real-time collaboration tools</span>
            </li>
            <li className="flex items-start">
              <svg className="flex-shrink-0 h-5 w-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Advanced analytics and reporting</span>
            </li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your data is protected with enterprise-grade security.{' '}
            <a
              href="/security"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Learn more about our security
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}