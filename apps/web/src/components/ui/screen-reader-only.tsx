'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

/**
 * A component that renders content only visible to screen readers.
 * Useful for providing additional context or instructions for accessibility.
 */
export function ScreenReaderOnly({
  children,
  className,
  as: Component = 'span'
}: ScreenReaderOnlyProps) {
  return (
    <Component
      className={cn(
        // Visually hidden but accessible to screen readers
        'sr-only',
        // Alternative for older browsers that don't support sr-only
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        className
      )}
    >
      {children}
    </Component>
  )
}

/**
 * Hook for announcing dynamic content changes to screen readers
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = React.useState('')

  const announce = React.useCallback((message: string) => {
    setAnnouncement('')
    // Use a timeout to ensure the change is detected
    setTimeout(() => setAnnouncement(message), 100)
  }, [])

  const announcerElement = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )

  return { announce, announcerElement }
}

/**
 * Component for creating accessible landmarks
 */
export function Landmark({
  children,
  role,
  ariaLabel,
  ariaLabelledBy,
  className
}: {
  children: React.ReactNode
  role: 'banner' | 'main' | 'navigation' | 'complementary' | 'contentinfo' | 'search' | 'form' | 'region'
  ariaLabel?: string
  ariaLabelledBy?: string
  className?: string
}) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={className}
    >
      {children}
    </div>
  )
}

export default ScreenReaderOnly