'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Settings,
  LogOut,
  CreditCard,
  Shield,
  HelpCircle,
  Building2,
  UserCircle,
  Bell,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface UserProfile {
  name: string
  email: string
  role: string
  organization: string
  avatar?: string
  plan: string
}

interface UserMenuProps {
  user?: UserProfile
  onSignOut?: () => void
  className?: string
}

const defaultUser: UserProfile = {
  name: 'John Smith',
  email: 'john.smith@smithcpa.com',
  role: 'Senior Partner',
  organization: 'Smith & Associates CPA',
  plan: 'Professional Plan'
}

const menuItems = [
  {
    icon: UserCircle,
    label: 'Profile Settings',
    href: '/dashboard/settings/profile',
    description: 'Manage your account details'
  },
  {
    icon: Building2,
    label: 'Organization',
    href: '/dashboard/settings/organization',
    description: 'Firm settings and preferences'
  },
  {
    icon: CreditCard,
    label: 'Billing & Plans',
    href: '/dashboard/settings/billing',
    description: 'Subscription and payment details'
  },
  {
    icon: Bell,
    label: 'Notifications',
    href: '/dashboard/settings/notifications',
    description: 'Email and push preferences'
  },
  {
    icon: Shield,
    label: 'Security',
    href: '/dashboard/settings/security',
    description: '2FA and access management'
  },
  {
    icon: HelpCircle,
    label: 'Help & Support',
    href: '/dashboard/help',
    description: 'Documentation and contact'
  }
]

export function UserMenu({
  user = defaultUser,
  onSignOut,
  className
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const { theme, setTheme, themes } = useTheme()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsThemeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = () => {
    onSignOut?.()
    // You might want to handle sign out logic here
    console.log('Signing out...')
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-3 p-2 rounded-lg',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'transition-colors duration-200'
        )}
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full" />
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.role}
          </p>
        </div>

        <ChevronDown className={cn(
          'hidden md:block w-4 h-4 text-gray-500 transition-transform duration-200',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full mt-2 w-80 z-50',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'rounded-lg shadow-lg',
              'overflow-hidden'
            )}
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {user.plan}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm',
                      'hover:bg-gray-50 dark:hover:bg-gray-700',
                      'transition-colors duration-150',
                      'text-gray-700 dark:text-gray-300'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                  </a>
                )
              })}

              {/* Theme Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className={cn(
                    'w-full flex items-center px-4 py-3 text-sm',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    'transition-colors duration-150',
                    'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <Sun className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Theme</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Customize appearance
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-gray-500 transition-transform duration-200',
                    isThemeMenuOpen && 'transform rotate-180'
                  )} />
                </button>

                {/* Theme Options */}
                <AnimatePresence>
                  {isThemeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 dark:bg-gray-750"
                    >
                      {themeOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = theme === option.value

                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTheme(option.value)
                              setIsThemeMenuOpen(false)
                            }}
                            className={cn(
                              'w-full flex items-center px-8 py-2 text-sm',
                              'hover:bg-gray-100 dark:hover:bg-gray-700',
                              'transition-colors duration-150',
                              isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400'
                            )}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            <span className="flex-1 text-left">{option.label}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className={cn(
                'w-full flex items-center px-4 py-3 text-sm',
                'hover:bg-red-50 dark:hover:bg-red-900/20',
                'transition-colors duration-150',
                'text-red-600 dark:text-red-400'
              )}
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="font-medium">Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact version for smaller spaces
export function CompactUserMenu({ user = defaultUser, onSignOut, className }: UserMenuProps) {
  return (
    <UserMenu
      user={user}
      onSignOut={onSignOut}
      className={cn('', className)}
    />
  )
}