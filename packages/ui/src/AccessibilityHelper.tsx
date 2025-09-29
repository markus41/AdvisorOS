import React, { useEffect, useState } from 'react'
import { cn } from './utils/cn'

// Skip Link component for keyboard navigation
interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={cn(
        'absolute left-0 top-0 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-br-md',
        'transform -translate-y-full transition-transform duration-300 focus:translate-y-0',
        'sr-only focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </a>
  )
}

// Focus trap component
interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  onEscape?: () => void
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  enabled = true,
  onEscape
}) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape()
      }

      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onEscape])

  return <>{children}</>
}

// Screen reader only content
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  className
}) => {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  )
}

// Accessible landmark component
interface LandmarkProps {
  as?: 'main' | 'nav' | 'section' | 'article' | 'aside' | 'header' | 'footer'
  label?: string
  labelledBy?: string
  children: React.ReactNode
  className?: string
}

export const Landmark: React.FC<LandmarkProps> = ({
  as: Component = 'div',
  label,
  labelledBy,
  children,
  className,
}) => {
  const props = {
    'aria-label': label,
    'aria-labelledby': labelledBy,
    className,
  }

  return React.createElement(Component, props, children)
}

// High contrast mode detection hook
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isHighContrast
}

// Reduced motion detection hook
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Accessible form field with proper labeling and error handling
interface AccessibleFieldProps {
  id: string
  label: string
  children: React.ReactNode
  error?: string
  helperText?: string
  required?: boolean
  className?: string
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id,
  label,
  children,
  error,
  helperText,
  required = false,
  className,
}) => {
  const hasError = !!error
  const errorId = hasError ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': describedBy,
          'aria-invalid': hasError,
          'aria-required': required,
        })}
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {helperText && !error && (
        <div
          id={helperId}
          className="text-sm text-muted-foreground"
        >
          {helperText}
        </div>
      )}
    </div>
  )
}

// Accessible loading indicator
interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  label = 'Loading...',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        className={cn(
          'animate-spin text-muted-foreground',
          sizeClasses[size]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <ScreenReaderOnly>{label}</ScreenReaderOnly>
    </div>
  )
}

// Color contrast checker utility
export const checkColorContrast = (foreground: string, background: string): number => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Calculate relative luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const getRgbValue = (value: number) => {
      value = value / 255
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
    }

    const r = getRgbValue(rgb.r)
    const g = getRgbValue(rgb.g)
    const b = getRgbValue(rgb.b)

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  if (!fg || !bg) return 0

  const fgLuminance = getLuminance(fg)
  const bgLuminance = getLuminance(bg)

  const lightest = Math.max(fgLuminance, bgLuminance)
  const darkest = Math.min(fgLuminance, bgLuminance)

  return (lightest + 0.05) / (darkest + 0.05)
}

// Accessible tooltip component
interface AccessibleTooltipProps {
  content: string
  children: React.ReactElement
  delay?: number
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        'aria-describedby': isVisible ? tooltipId : undefined,
      })}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg z-50 whitespace-nowrap"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}