'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  subdomain: z.string().min(1, 'Organization is required'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          // Validation errors
          result.details.forEach((detail: any) => {
            if (detail.path) {
              setError(detail.path[0], { message: detail.message })
            }
          })
        } else {
          toast.error(result.error || 'Failed to send reset email')
        }
        return
      }

      setEmailAddress(data.email)
      setEmailSent(true)
      toast.success('Password reset email sent!')
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              We've sent a password reset link to{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {emailAddress}
              </span>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  What's next?
                </h3>
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <p>Check your email inbox (and spam folder)</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">2</span>
                    </div>
                    <p>Click the reset link in the email</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">3</span>
                    </div>
                    <p>Create a new secure password</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the email?
                  </p>
                  <button
                    onClick={() => {
                      setEmailSent(false)
                      setEmailAddress('')
                    }}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
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
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            No worries! Enter your email and organization below and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Organization Field */}
            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('subdomain')}
                  type="text"
                  id="subdomain"
                  placeholder="your-organization"
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                    errors.subdomain ? 'border-red-500' : 'border-gray-300'
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.subdomain && (
                <p className="mt-1 text-sm text-red-600">{errors.subdomain.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder="your.email@example.com"
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending reset email...
                </div>
              ) : (
                'Send reset email'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <Link
            href="/auth/signin"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create one here
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For security reasons, the reset link will expire in 1 hour. If you don't receive an email within a few minutes, check your spam folder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}