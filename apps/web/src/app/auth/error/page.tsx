'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, RefreshCw, ArrowLeft, Shield, HelpCircle } from 'lucide-react'

interface ErrorInfo {
  title: string
  description: string
  suggestion: string
  icon: React.ReactNode
  actionLabel?: string
  actionHref?: string
  showRetry?: boolean
}

const errorMap: Record<string, ErrorInfo> = {
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the authentication configuration.',
    suggestion: 'This appears to be a technical issue. Please contact support for assistance.',
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    actionLabel: 'Contact Support',
    actionHref: 'mailto:support@cpaplatform.com',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in.',
    suggestion: 'Your account may not have access to this organization, or your account may be disabled.',
    icon: <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />,
    actionLabel: 'Request Access',
    actionHref: 'mailto:support@cpaplatform.com?subject=Access%20Request',
  },
  Verification: {
    title: 'Verification Required',
    description: 'Your email address needs to be verified before you can sign in.',
    suggestion: 'Check your email for a verification link, or request a new one.',
    icon: <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
    actionLabel: 'Resend Verification',
    actionHref: '/auth/resend-verification',
  },
  OAuthSignin: {
    title: 'OAuth Sign-in Error',
    description: 'There was an error signing in with your OAuth provider.',
    suggestion: 'Try signing in again, or use a different sign-in method.',
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    showRetry: true,
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was an error processing the OAuth response.',
    suggestion: 'This may be a temporary issue. Please try signing in again.',
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    showRetry: true,
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Unable to create your account using OAuth.',
    suggestion: 'Your OAuth account may already be linked to another account, or there may be missing required information.',
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    actionLabel: 'Try Manual Registration',
    actionHref: '/auth/register',
  },
  EmailCreateAccount: {
    title: 'Email Account Creation Error',
    description: 'Unable to create your account using email.',
    suggestion: 'This email address may already be registered, or there was a validation error.',
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    actionLabel: 'Try Signing In',
    actionHref: '/auth/signin',
  },
  Callback: {
    title: 'Callback Error',
    description: 'There was an error during the authentication callback.',
    suggestion: 'This is usually a temporary issue. Please try signing in again.',
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    showRetry: true,
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'This OAuth account is not linked to any user account.',
    suggestion: 'You may need to sign in with the same method you used to create your account, or link your accounts.',
    icon: <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
    actionLabel: 'Sign In Differently',
    actionHref: '/auth/signin',
  },
  EmailSignin: {
    title: 'Email Sign-in Issue',
    description: 'There was a problem with email sign-in.',
    suggestion: 'Check your email for the sign-in link, or try requesting a new one.',
    icon: <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
    actionLabel: 'Request New Link',
    actionHref: '/auth/signin',
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The email or password you entered is incorrect.',
    suggestion: 'Double-check your email and password, or reset your password if you\'ve forgotten it.',
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    actionLabel: 'Reset Password',
    actionHref: '/auth/forgot-password',
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You need to be signed in to access this page.',
    suggestion: 'Please sign in to continue.',
    icon: <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
    actionLabel: 'Sign In',
    actionHref: '/auth/signin',
  },
  UserNotInOrganization: {
    title: 'Not a Member',
    description: 'You are not a member of this organization.',
    suggestion: 'Contact your organization administrator to request access, or verify you\'re using the correct organization.',
    icon: <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
    actionLabel: 'Select Different Organization',
    actionHref: '/auth/select-organization',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
    suggestion: 'This may be a temporary issue. Please try again in a few moments.',
    icon: <HelpCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />,
    showRetry: true,
  },
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  const errorInfo = errorMap[error] || errorMap.Default

  const handleRetry = () => {
    // Navigate back to the previous page or sign-in page
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/auth/signin'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            {errorInfo.icon}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {errorInfo.description}
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                What can you do?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {errorInfo.suggestion}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {errorInfo.showRetry && (
                <button
                  onClick={handleRetry}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              )}

              {errorInfo.actionHref && (
                <Link
                  href={errorInfo.actionHref}
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {errorInfo.actionLabel}
                </Link>
              )}

              <Link
                href="/auth/signin"
                className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Troubleshooting Tips
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Make sure you're using the correct organization subdomain</li>
            <li>• Check that your email address is spelled correctly</li>
            <li>• Try clearing your browser cookies and cache</li>
            <li>• Disable browser extensions that might interfere</li>
            <li>• Try using an incognito/private browsing window</li>
          </ul>
        </div>

        {/* Error Code */}
        {error !== 'Default' && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Error Code: <span className="font-mono">{error}</span>
            </p>
          </div>
        )}

        {/* Support */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Still having trouble?{' '}
            <a
              href="mailto:support@cpaplatform.com?subject=Authentication%20Error&body=Error%20Code:%20{error}"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}