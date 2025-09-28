'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  subdomain: z.string().min(1, 'Organization is required'),
  rememberMe: z.boolean().optional(),
  twoFactorCode: z.string().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  className?: string
  onNeedTwoFactor?: (needsTwoFactor: boolean) => void
}

export function LoginForm({ className, onNeedTwoFactor }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  })

  const email = watch('email')
  const subdomain = watch('subdomain')

  React.useEffect(() => {
    if (error) {
      switch (error) {
        case 'CredentialsSignin':
          toast.error('Invalid email or password')
          break
        case 'SessionExpired':
          toast.error('Your session has expired. Please sign in again.')
          break
        case 'UserNotInOrganization':
          toast.error('You are not a member of this organization')
          break
        default:
          toast.error('An error occurred during sign in')
      }
    }
  }, [error])

  const onSubmit = async (data: LoginFormData) => {
    if (needsTwoFactor && !data.twoFactorCode) {
      setError('twoFactorCode', { message: '2FA code is required' })
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        subdomain: data.subdomain,
        rememberMe: data.rememberMe ? 'true' : 'false',
        twoFactorCode: data.twoFactorCode,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === '2FA code required') {
          setNeedsTwoFactor(true)
          onNeedTwoFactor?.(true)
          toast.error('Please enter your 2FA code')
        } else if (result.error === 'Invalid 2FA code') {
          setError('twoFactorCode', { message: 'Invalid 2FA code' })
          toast.error('Invalid 2FA code')
        } else {
          toast.error(result.error)
        }
      } else if (result?.ok) {
        toast.success('Signed in successfully!')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      {/* Organization/Subdomain Field */}
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
              'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
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
              'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
              errors.email ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            placeholder="••••••••"
            className={cn(
              'w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
              errors.password ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Two-Factor Code Field */}
      {needsTwoFactor && (
        <div>
          <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Two-Factor Authentication Code
          </label>
          <input
            {...register('twoFactorCode')}
            type="text"
            id="twoFactorCode"
            placeholder="123456"
            maxLength={6}
            className={cn(
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
              errors.twoFactorCode ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isLoading}
          />
          {errors.twoFactorCode && (
            <p className="mt-1 text-sm text-red-600">{errors.twoFactorCode.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
      )}

      {/* Remember Me */}
      <div className="flex items-center">
        <input
          {...register('rememberMe')}
          type="checkbox"
          id="rememberMe"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
          disabled={isLoading}
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Keep me signed in
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white',
          'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'dark:focus:ring-offset-gray-800'
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Signing in...
          </div>
        ) : needsTwoFactor ? (
          'Verify & Sign In'
        ) : (
          'Sign In'
        )}
      </button>

      {/* Reset Two-Factor */}
      {needsTwoFactor && (
        <button
          type="button"
          onClick={() => {
            setNeedsTwoFactor(false)
            setValue('twoFactorCode', '')
            onNeedTwoFactor?.(false)
          }}
          className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          disabled={isLoading}
        >
          Back to password
        </button>
      )}
    </form>
  )
}