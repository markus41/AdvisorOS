'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

interface ThemeToggleProps {
  className?: string
  variant?: 'icon' | 'button' | 'dropdown'
  size?: 'sm' | 'md' | 'lg'
}

export function ThemeToggle({ className, variant = 'icon', size = 'md' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Hydration fix
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme || 'system'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')

    setResolvedTheme(isDark ? 'dark' : 'light')
    localStorage.setItem('theme', newTheme)
  }

  const setAndApplyTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setAndApplyTheme(nextTheme)
  }

  const getThemeIcon = (themeType: Theme, isActive = false) => {
    const iconClass = cn(
      'w-4 h-4 transition-colors',
      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
    )

    switch (themeType) {
      case 'light':
        return <Sun className={iconClass} />
      case 'dark':
        return <Moon className={iconClass} />
      case 'system':
        return <Monitor className={iconClass} />
    }
  }

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
    }
  }

  const getCurrentIcon = () => {
    if (!mounted) return <Monitor className="w-4 h-4" />

    if (theme === 'system') {
      return resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />
    }

    return getThemeIcon(theme)
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(sizeClasses[size], 'rounded-lg', className)}
        disabled
      >
        <Monitor className="w-4 h-4" />
        <span className="sr-only">Theme toggle</span>
      </Button>
    )
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleTheme}
        className={cn(sizeClasses[size], 'rounded-lg', className)}
        title={`Current theme: ${getThemeLabel(theme)}. Click to cycle.`}
      >
        <motion.div
          key={theme}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {getCurrentIcon()}
        </motion.div>
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        onClick={cycleTheme}
        className={cn('flex items-center space-x-2', className)}
      >
        {getCurrentIcon()}
        <span className="text-sm">{getThemeLabel(theme)}</span>
      </Button>
    )
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(sizeClasses[size], 'rounded-lg', className)}
          >
            <motion.div
              key={theme}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {getCurrentIcon()}
            </motion.div>
            <span className="sr-only">Open theme menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
            <DropdownMenuItem
              key={themeOption}
              onClick={() => setAndApplyTheme(themeOption)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                {getThemeIcon(themeOption, theme === themeOption)}
                <span className="text-sm">{getThemeLabel(themeOption)}</span>
              </div>
              {theme === themeOption && (
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return null
}

// Extended theme provider component
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  enableColorScheme?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableColorScheme = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme || defaultTheme
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [defaultTheme])

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')

    if (enableColorScheme) {
      root.style.colorScheme = isDark ? 'dark' : 'light'
    }

    localStorage.setItem('theme', newTheme)
  }

  const setAndApplyTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <div className={theme}>
      {children}
    </div>
  )
}

// Hook for using theme in components
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme || 'system'
    setTheme(savedTheme)

    const updateResolvedTheme = () => {
      const isDark = savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setResolvedTheme(isDark ? 'dark' : 'light')
    }

    updateResolvedTheme()

    if (savedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateResolvedTheme)
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')
    root.style.colorScheme = isDark ? 'dark' : 'light'

    setResolvedTheme(isDark ? 'dark' : 'light')
    localStorage.setItem('theme', newTheme)
  }

  const setAndApplyTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return {
    theme,
    resolvedTheme,
    setTheme: setAndApplyTheme,
    mounted,
  }
}

// Color scheme variants for custom styling
export const colorSchemes = {
  light: {
    primary: 'rgb(59 130 246)', // blue-500
    secondary: 'rgb(156 163 175)', // gray-400
    accent: 'rgb(147 51 234)', // purple-600
    background: 'rgb(255 255 255)', // white
    surface: 'rgb(249 250 251)', // gray-50
    text: 'rgb(17 24 39)', // gray-900
    textSecondary: 'rgb(75 85 99)', // gray-600
    border: 'rgb(229 231 235)', // gray-200
  },
  dark: {
    primary: 'rgb(96 165 250)', // blue-400
    secondary: 'rgb(107 114 128)', // gray-500
    accent: 'rgb(168 85 247)', // purple-500
    background: 'rgb(17 24 39)', // gray-900
    surface: 'rgb(31 41 55)', // gray-800
    text: 'rgb(243 244 246)', // gray-100
    textSecondary: 'rgb(156 163 175)', // gray-400
    border: 'rgb(55 65 81)', // gray-700
  },
}