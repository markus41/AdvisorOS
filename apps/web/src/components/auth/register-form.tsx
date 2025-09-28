'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, User, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { PasswordStrengthIndicator } from './password-strength-indicator'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be at most 20 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  invitationToken: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  className?: string
  invitationToken?: string
  mode?: 'organization' | 'invitation'
}

export function RegisterForm({ className, invitationToken, mode = 'organization' }: RegisterFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      invitationToken: invitationToken || '',
    },
  })

  const password = watch('password')
  const subdomain = watch('subdomain')

  React.useEffect(() => {
    if (invitationToken) {
      setValue('invitationToken', invitationToken)
    }
  }, [invitationToken, setValue])

  // Check subdomain availability
  React.useEffect(() => {
    if (mode === 'organization' && subdomain && subdomain.length >= 3) {
      const checkSubdomain = async () => {
        setCheckingSubdomain(true)
        try {
          const response = await fetch('/api/auth/check-subdomain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subdomain }),
          })
          const data = await response.json()
          setSubdomainAvailable(data.available)
        } catch (error) {
          console.error('Error checking subdomain:', error)
          setSubdomainAvailable(null)
        } finally {
          setCheckingSubdomain(false)
        }
      }

      const timeoutId = setTimeout(checkSubdomain, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [subdomain, mode])

  const onSubmit = async (data: RegisterFormData) => {
    if (mode === 'organization' && subdomainAvailable === false) {
      setError('subdomain', { message: 'Subdomain is not available' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
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
          toast.error(result.error || 'Registration failed')
        }
        return
      }

      toast.success(result.message || 'Registration successful!')

      if (mode === 'organization') {
        router.push(`/auth/signin?message=Please check your email to verify your account&subdomain=${data.subdomain}`)
      } else {
        router.push('/auth/signin?message=Registration successful! You can now sign in.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            {...register('name')}
            type="text"
            id="name"
            placeholder="John Doe"
            className={cn(
              'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
              errors.name ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isLoading}
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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

      {/* Organization Name Field - Only show for new organization registration */}
      {mode === 'organization' && (
        <div>
          <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization Name
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              {...register('organizationName')}
              type="text"
              id="organizationName"
              placeholder="Acme CPA Firm"
              className={cn(
                'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
                errors.organizationName ? 'border-red-500' : 'border-gray-300'
              )}
              disabled={isLoading}
            />
          </div>
          {errors.organizationName && (
            <p className="mt-1 text-sm text-red-600">{errors.organizationName.message}</p>
          )}
        </div>
      )}

      {/* Subdomain Field - Only show for new organization registration */}
      {mode === 'organization' && (
        <div>
          <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization URL
          </label>
          <div className="flex items-center">
            <input
              {...register('subdomain')}
              type="text"
              id="subdomain"
              placeholder="acme-cpa"
              className={cn(
                'flex-1 px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
                errors.subdomain ? 'border-red-500' : 'border-gray-300'
              )}
              disabled={isLoading}
            />
            <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-sm text-gray-500 dark:text-gray-400">
              .cpa.com
            </span>
          </div>
          <div className="mt-1 flex items-center space-x-2">
            {checkingSubdomain && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                Checking availability...
              </div>
            )}
            {subdomainAvailable === true && (
              <p className="text-sm text-green-600">✓ Available</p>
            )}
            {subdomainAvailable === false && (
              <p className="text-sm text-red-600">✗ Not available</p>
            )}
          </div>
          {errors.subdomain && (
            <p className="mt-1 text-sm text-red-600">{errors.subdomain.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This will be your organization's URL: {subdomain || 'your-org'}.cpa.com
          </p>
        </div>
      )}

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
        {password && <PasswordStrengthIndicator password={password} />}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            placeholder="••••••••"
            className={cn(
              'w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || (mode === 'organization' && subdomainAvailable === false)}
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
            Creating account...
          </div>
        ) : mode === 'organization' ? (
          'Create Organization'
        ) : (
          'Join Organization'
        )}
      </button>

      {/* Terms and Privacy */}
      <p className="text-xs text-gray-500 text-center">
        By creating an account, you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:text-blue-500">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-blue-600 hover:text-blue-500">
          Privacy Policy
        </a>
      </p>
    </form>
  )
}