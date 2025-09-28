'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    symbol: boolean
  }
}

function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  const score = Object.values(requirements).filter(Boolean).length

  let label = ''
  let color = ''

  switch (score) {
    case 0:
    case 1:
      label = 'Very Weak'
      color = 'bg-red-500'
      break
    case 2:
      label = 'Weak'
      color = 'bg-orange-500'
      break
    case 3:
      label = 'Fair'
      color = 'bg-yellow-500'
      break
    case 4:
      label = 'Good'
      color = 'bg-blue-500'
      break
    case 5:
      label = 'Strong'
      color = 'bg-green-500'
      break
    default:
      label = 'Very Weak'
      color = 'bg-red-500'
  }

  return {
    score,
    label,
    color,
    requirements,
  }
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const strength = calculatePasswordStrength(password)
  const percentage = (strength.score / 5) * 100

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-300', strength.color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn('text-xs font-medium', {
          'text-red-600': strength.score <= 1,
          'text-orange-600': strength.score === 2,
          'text-yellow-600': strength.score === 3,
          'text-blue-600': strength.score === 4,
          'text-green-600': strength.score === 5,
        })}>
          {strength.label}
        </span>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
        <div className={cn('flex items-center space-x-1', {
          'text-green-600': strength.requirements.length,
          'text-gray-400': !strength.requirements.length,
        })}>
          <span>{strength.requirements.length ? '✓' : '○'}</span>
          <span>At least 8 characters</span>
        </div>
        <div className={cn('flex items-center space-x-1', {
          'text-green-600': strength.requirements.uppercase,
          'text-gray-400': !strength.requirements.uppercase,
        })}>
          <span>{strength.requirements.uppercase ? '✓' : '○'}</span>
          <span>Uppercase letter</span>
        </div>
        <div className={cn('flex items-center space-x-1', {
          'text-green-600': strength.requirements.lowercase,
          'text-gray-400': !strength.requirements.lowercase,
        })}>
          <span>{strength.requirements.lowercase ? '✓' : '○'}</span>
          <span>Lowercase letter</span>
        </div>
        <div className={cn('flex items-center space-x-1', {
          'text-green-600': strength.requirements.number,
          'text-gray-400': !strength.requirements.number,
        })}>
          <span>{strength.requirements.number ? '✓' : '○'}</span>
          <span>Number</span>
        </div>
        <div className={cn('flex items-center space-x-1 sm:col-span-2', {
          'text-green-600': strength.requirements.symbol,
          'text-gray-400': !strength.requirements.symbol,
        })}>
          <span>{strength.requirements.symbol ? '✓' : '○'}</span>
          <span>Special character (!@#$%^&*)</span>
        </div>
      </div>
    </div>
  )
}