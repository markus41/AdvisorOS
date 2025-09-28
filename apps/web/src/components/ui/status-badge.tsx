'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type StatusType = 'active' | 'inactive' | 'pending' | 'warning' | 'error' | 'success' | 'neutral'

export interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'soft' | 'outline' | 'dot'
  className?: string
  animated?: boolean
}

const statusConfig = {
  active: {
    color: 'green',
    label: 'Active',
    icon: '●',
  },
  inactive: {
    color: 'gray',
    label: 'Inactive',
    icon: '●',
  },
  pending: {
    color: 'yellow',
    label: 'Pending',
    icon: '●',
  },
  warning: {
    color: 'orange',
    label: 'Warning',
    icon: '⚠',
  },
  error: {
    color: 'red',
    label: 'Error',
    icon: '✕',
  },
  success: {
    color: 'green',
    label: 'Success',
    icon: '✓',
  },
  neutral: {
    color: 'gray',
    label: 'Neutral',
    icon: '●',
  },
}

const getStatusClasses = (status: StatusType, variant: StatusBadgeProps['variant']) => {
  const config = statusConfig[status]
  const baseClasses = 'inline-flex items-center transition-all duration-200'

  switch (variant) {
    case 'solid':
      return {
        green: `${baseClasses} bg-green-600 text-white`,
        gray: `${baseClasses} bg-gray-600 text-white`,
        yellow: `${baseClasses} bg-yellow-600 text-white`,
        orange: `${baseClasses} bg-orange-600 text-white`,
        red: `${baseClasses} bg-red-600 text-white`,
      }[config.color]

    case 'soft':
      return {
        green: `${baseClasses} bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200`,
        gray: `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200`,
        yellow: `${baseClasses} bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200`,
        orange: `${baseClasses} bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200`,
        red: `${baseClasses} bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200`,
      }[config.color]

    case 'outline':
      return {
        green: `${baseClasses} border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300`,
        gray: `${baseClasses} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300`,
        yellow: `${baseClasses} border border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300`,
        orange: `${baseClasses} border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300`,
        red: `${baseClasses} border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300`,
      }[config.color]

    case 'dot':
    default:
      return `${baseClasses} text-gray-700 dark:text-gray-300`
  }
}

const getSizeClasses = (size: StatusBadgeProps['size'], variant: StatusBadgeProps['variant']) => {
  if (variant === 'dot') {
    return {
      sm: 'text-xs space-x-1',
      md: 'text-sm space-x-1.5',
      lg: 'text-base space-x-2',
    }[size || 'md']
  }

  return {
    sm: 'px-2 py-0.5 text-xs font-medium rounded-full',
    md: 'px-2.5 py-1 text-sm font-medium rounded-full',
    lg: 'px-3 py-1.5 text-base font-medium rounded-full',
  }[size || 'md']
}

const getDotClasses = (status: StatusType, size: StatusBadgeProps['size']) => {
  const config = statusConfig[status]
  const sizeClass = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size || 'md']

  return {
    green: `${sizeClass} bg-green-500 rounded-full`,
    gray: `${sizeClass} bg-gray-400 dark:bg-gray-500 rounded-full`,
    yellow: `${sizeClass} bg-yellow-500 rounded-full`,
    orange: `${sizeClass} bg-orange-500 rounded-full`,
    red: `${sizeClass} bg-red-500 rounded-full`,
  }[config.color]
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  variant = 'soft',
  className,
  animated = false,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const displayLabel = label || config.label
  const statusClasses = getStatusClasses(status, variant)
  const sizeClasses = getSizeClasses(size, variant)

  if (variant === 'dot') {
    return (
      <motion.span
        className={cn(sizeClasses, className)}
        initial={animated ? { scale: 0 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={animated ? { duration: 0.2 } : undefined}
      >
        <motion.span
          className={getDotClasses(status, size)}
          animate={
            animated && status === 'active'
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }
              : undefined
          }
          transition={
            animated && status === 'active'
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : undefined
          }
        />
        <span>{displayLabel}</span>
      </motion.span>
    )
  }

  return (
    <motion.span
      className={cn(statusClasses, sizeClasses, className)}
      initial={animated ? { scale: 0, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={animated ? { duration: 0.2 } : undefined}
    >
      {variant !== 'outline' && (
        <motion.span
          className="mr-1"
          animate={
            animated && status === 'pending'
              ? {
                  rotate: [0, 360],
                }
              : undefined
          }
          transition={
            animated && status === 'pending'
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }
              : undefined
          }
        >
          {config.icon}
        </motion.span>
      )}
      {displayLabel}
    </motion.span>
  )
}

// Predefined status badge components for common use cases
export function ActiveBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge {...props} status="active" />
}

export function InactiveBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge {...props} status="inactive" />
}

export function PendingBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge {...props} status="pending" animated />
}

export function WarningBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge {...props} status="warning" />
}

export function ErrorBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge {...props} status="error" />
}

export function SuccessBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge {...props} status="success" />
}