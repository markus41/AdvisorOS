'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period?: string
  }
  icon?: LucideIcon
  iconColor?: string
  className?: string
  isLoading?: boolean
  onClick?: () => void
}

const formatChange = (change: KPICardProps['change']) => {
  if (!change) return null

  const { value, type, period = 'vs last month' } = change
  const isPositive = type === 'increase'
  const isNegative = type === 'decrease'
  const isNeutral = type === 'neutral'

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className="flex items-center space-x-1">
      <TrendIcon
        className={cn(
          'w-3 h-3',
          isPositive && 'text-green-600 dark:text-green-400',
          isNegative && 'text-red-600 dark:text-red-400',
          isNeutral && 'text-gray-600 dark:text-gray-400'
        )}
      />
      <span
        className={cn(
          'text-xs font-medium',
          isPositive && 'text-green-600 dark:text-green-400',
          isNegative && 'text-red-600 dark:text-red-400',
          isNeutral && 'text-gray-600 dark:text-gray-400'
        )}
      >
        {Math.abs(value)}%
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{period}</span>
    </div>
  )
}

function KPICardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
    </div>
  )
}

export function KPICard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  className,
  isLoading = false,
  onClick,
}: KPICardProps) {
  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  }

  const content = (
    <motion.div
      className={cn(
        'relative p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        'hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      variants={cardVariants}
      initial="initial"
      whileHover={onClick ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
    >
      {isLoading ? (
        <KPICardSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">
              {title}
            </h3>
            {Icon && (
              <div className={cn('p-2 rounded-lg bg-gray-50 dark:bg-gray-700', iconColor)}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
          </div>

          {/* Change indicator */}
          {change && formatChange(change)}

          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <defs>
                <pattern id="dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="64" height="64" fill="url(#dots)" />
            </svg>
          </div>
        </>
      )}
    </motion.div>
  )

  return content
}