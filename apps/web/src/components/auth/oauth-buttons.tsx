'use client'

import React from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface OAuthButtonsProps {
  className?: string
  subdomain?: string
  disabled?: boolean
}

export function OAuthButtons({ className, subdomain, disabled = false }: OAuthButtonsProps) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleOAuthSignIn = async (provider: string) => {
    if (!subdomain) {
      toast.error('Please select an organization first')
      return
    }

    try {
      await signIn(provider, {
        callbackUrl,
        subdomain, // Pass subdomain as a custom parameter
      })
    } catch (error) {
      console.error(`${provider} sign-in error:`, error)
      toast.error(`Failed to sign in with ${provider}`)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Google */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('google')}
        disabled={disabled || !subdomain}
        className={cn(
          'w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg',
          'bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          'dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
        )}
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Continue with Google
        </span>
      </button>

      {/* Microsoft */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('microsoft')}
        disabled={disabled || !subdomain}
        className={cn(
          'w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg',
          'bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          'dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
        )}
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#f25022" d="M11.4 11.4H0V0h11.4v11.4z" />
          <path fill="#00a4ef" d="M24 11.4H12.6V0H24v11.4z" />
          <path fill="#7fba00" d="M11.4 24H0V12.6h11.4V24z" />
          <path fill="#ffb900" d="M24 24H12.6V12.6H24V24z" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Continue with Microsoft
        </span>
      </button>

      {/* Azure AD */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('azure-ad')}
        disabled={disabled || !subdomain}
        className={cn(
          'w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg',
          'bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          'dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
        )}
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#0078d4" d="M0 0h10.8v10.8H0V0z" />
          <path fill="#0078d4" d="M12 0h10.8v10.8H12V0z" />
          <path fill="#0078d4" d="M0 12h10.8v10.8H0V12z" />
          <path fill="#0078d4" d="M12 12h10.8v10.8H12V12z" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Continue with Azure AD
        </span>
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            or
          </span>
        </div>
      </div>
    </div>
  )
}