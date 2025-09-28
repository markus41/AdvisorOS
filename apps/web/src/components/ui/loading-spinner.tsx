'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: 'primary' | 'white' | 'gray'
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const colorClasses = {
  primary: 'text-blue-600 dark:text-blue-400',
  white: 'text-white',
  gray: 'text-gray-400 dark:text-gray-500'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
}

export function LoadingSpinner({
  size = 'md',
  className,
  color = 'primary',
  text
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <Loader2 className={cn(sizeClasses[size], colorClasses[color])} />
        </motion.div>
        {text && (
          <span className={cn(textSizeClasses[size], colorClasses[color])}>
            {text}
          </span>
        )}
      </div>
    </div>
  )
}

// Alternative spinner styles
export function PulseSpinner({
  size = 'md',
  className,
  color = 'primary'
}: Omit<LoadingSpinnerProps, 'text'>) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'rounded-full',
              size === 'sm' && 'w-1.5 h-1.5',
              size === 'md' && 'w-2 h-2',
              size === 'lg' && 'w-3 h-3',
              size === 'xl' && 'w-4 h-4',
              color === 'primary' && 'bg-blue-600 dark:bg-blue-400',
              color === 'white' && 'bg-white',
              color === 'gray' && 'bg-gray-400 dark:bg-gray-500'
            )}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function BarSpinner({
  size = 'md',
  className,
  color = 'primary'
}: Omit<LoadingSpinnerProps, 'text'>) {
  const barCount = size === 'sm' ? 3 : size === 'md' ? 5 : 7

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex items-end space-x-1">
        {Array.from({ length: barCount }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'rounded-sm',
              size === 'sm' && 'w-1 h-4',
              size === 'md' && 'w-1.5 h-6',
              size === 'lg' && 'w-2 h-8',
              size === 'xl' && 'w-3 h-12',
              color === 'primary' && 'bg-blue-600 dark:bg-blue-400',
              color === 'white' && 'bg-white',
              color === 'gray' && 'bg-gray-400 dark:bg-gray-500'
            )}
            animate={{
              scaleY: [1, 0.5, 1]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Full page loading component
export function PageLoadingSpinner({
  text = 'Loading...',
  className
}: {
  text?: string
  className?: string
}) {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900',
      className
    )}>
      <div className="text-center">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  )
}

// Component loading skeleton
export function ComponentLoadingSpinner({
  height = 'h-64',
  text,
  className
}: {
  height?: string
  text?: string
  className?: string
}) {
  return (
    <div className={cn(
      'flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
      height,
      className
    )}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}