'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

interface ExtendedThemeContextType {
  // Theme from next-themes
  theme?: string
  setTheme: (theme: string) => void
  resolvedTheme?: string
  themes: string[]

  // Extended features
  systemTheme?: string
  isDarkMode: boolean
  isLightMode: boolean
  isSystemMode: boolean
  toggleTheme: () => void

  // Preferences
  preferences: ThemePreferences
  updatePreferences: (prefs: Partial<ThemePreferences>) => void
}

interface ThemePreferences {
  autoSwitchTimes: {
    lightModeStart: string // "07:00"
    darkModeStart: string  // "19:00"
  }
  autoSwitch: boolean
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
}

const defaultPreferences: ThemePreferences = {
  autoSwitchTimes: {
    lightModeStart: '07:00',
    darkModeStart: '19:00'
  },
  autoSwitch: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'base'
}

const ExtendedThemeContext = createContext<ExtendedThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ExtendedThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ExtendedThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children, ...props }: ExtendedThemeProviderProps) {
  const [preferences, setPreferences] = useState<ThemePreferences>(defaultPreferences)
  const [mounted, setMounted] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedPreferences = localStorage.getItem('theme-preferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.warn('Failed to parse theme preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage when they change
  const updatePreferences = (newPrefs: Partial<ThemePreferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs }
    setPreferences(updatedPrefs)
    localStorage.setItem('theme-preferences', JSON.stringify(updatedPrefs))
  }

  // Apply preferences to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Apply font size
    root.style.setProperty('--base-font-size', {
      'sm': '14px',
      'base': '16px',
      'lg': '18px',
      'xl': '20px'
    }[preferences.fontSize])

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.style.setProperty('--motion-duration', '0s')
      root.classList.add('reduce-motion')
    } else {
      root.style.removeProperty('--motion-duration')
      root.classList.remove('reduce-motion')
    }

    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }, [preferences, mounted])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={preferences.reducedMotion}
      {...props}
    >
      <ThemeContextProvider
        preferences={preferences}
        updatePreferences={updatePreferences}
      >
        {children}
      </ThemeContextProvider>
    </NextThemesProvider>
  )
}

interface ThemeContextProviderProps {
  children: React.ReactNode
  preferences: ThemePreferences
  updatePreferences: (prefs: Partial<ThemePreferences>) => void
}

function ThemeContextProvider({
  children,
  preferences,
  updatePreferences
}: ThemeContextProviderProps) {
  const {
    theme,
    setTheme,
    resolvedTheme,
    themes,
    systemTheme
  } = require('next-themes').useTheme()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-switch based on time if enabled
  useEffect(() => {
    if (!preferences.autoSwitch || !mounted) return

    const checkTimeAndSwitch = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      const { lightModeStart, darkModeStart } = preferences.autoSwitchTimes

      const isLightTime = currentTime >= lightModeStart && currentTime < darkModeStart
      const targetTheme = isLightTime ? 'light' : 'dark'

      if (theme !== targetTheme) {
        setTheme(targetTheme)
      }
    }

    // Check immediately
    checkTimeAndSwitch()

    // Check every minute
    const interval = setInterval(checkTimeAndSwitch, 60000)
    return () => clearInterval(interval)
  }, [preferences.autoSwitch, preferences.autoSwitchTimes, theme, setTheme, mounted])

  const isDarkMode = resolvedTheme === 'dark'
  const isLightMode = resolvedTheme === 'light'
  const isSystemMode = theme === 'system'

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const value: ExtendedThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    themes,
    systemTheme,
    isDarkMode,
    isLightMode,
    isSystemMode,
    toggleTheme,
    preferences,
    updatePreferences
  }

  return (
    <ExtendedThemeContext.Provider value={value}>
      {children}
    </ExtendedThemeContext.Provider>
  )
}

// Theme toggle button component
export function ThemeToggle({
  className,
  size = 'md'
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const { theme, toggleTheme, isDarkMode, isSystemMode } = useTheme()

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  }

  const getIcon = () => {
    if (isSystemMode) {
      return (
        <svg
          className={sizeClasses[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )
    }

    if (isDarkMode) {
      return (
        <svg
          className={sizeClasses[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )
    }

    return (
      <svg
        className={sizeClasses[size]}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    )
  }

  const getTitle = () => {
    if (isSystemMode) return 'System theme'
    return isDarkMode ? 'Light mode' : 'Dark mode'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${buttonSizeClasses[size]}
        rounded-lg
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-300
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      title={getTitle()}
      aria-label={getTitle()}
    >
      {getIcon()}
    </button>
  )
}

// Accessibility preferences component
export function AccessibilitySettings() {
  const { preferences, updatePreferences } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Accessibility Preferences
        </h3>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reduced Motion
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Minimize animations and transitions
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                High Contrast
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Increase contrast for better visibility
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          {/* Font Size */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Font Size
            </label>
            <select
              value={preferences.fontSize}
              onChange={(e) => updatePreferences({ fontSize: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="sm">Small</option>
              <option value="base">Normal</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}