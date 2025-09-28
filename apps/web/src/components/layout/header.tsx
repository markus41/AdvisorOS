'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Plus,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  FileText,
  Users,
  Receipt,
  Command,
  X,
  Keyboard,
  HelpCircle,
} from 'lucide-react'
import { GlobalSearch } from '@/components/ui/global-search'
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts'
import { NotificationCenter } from '@/components/ui/notification-center'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMobileMenuToggle: () => void
  className?: string
}

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'warning' | 'success' | 'error'
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Document Uploaded',
    message: 'John Doe uploaded tax documents for Q4 2024',
    time: '2 minutes ago',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: 'Payment Overdue',
    message: 'ABC Corp invoice #1234 is 5 days overdue',
    time: '1 hour ago',
    read: false,
    type: 'warning',
  },
  {
    id: '3',
    title: 'Task Completed',
    message: 'Sarah completed tax preparation for Smith LLC',
    time: '3 hours ago',
    read: true,
    type: 'success',
  },
]

const quickActions = [
  { name: 'Add Client', icon: Users, href: '/dashboard/clients/new' },
  { name: 'Upload Document', icon: FileText, href: '/dashboard/documents/upload' },
  { name: 'Create Invoice', icon: Receipt, href: '/dashboard/invoices/new' },
]

export function Header({ onMobileMenuToggle, className }: HeaderProps) {
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const quickActionsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setQuickActionsOpen(false)
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [])

  return (
    <header className={cn(
      'sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800',
      className
    )}>
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden focus-ring"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Global Search Trigger */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 w-64"
        >
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="flex-1 text-left text-sm text-gray-500 dark:text-gray-400">
            Search clients, documents...
          </span>
          <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Quick Actions */}
        <div ref={quickActionsRef} className="relative">
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
            aria-label="Quick actions"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <AnimatePresence>
            {quickActionsOpen && (
              <motion.div
                className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white px-3 py-2">
                    Quick Actions
                  </div>
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.name}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                        onClick={() => setQuickActionsOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{action.name}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard Shortcuts */}
        <button
          onClick={() => setKeyboardShortcutsOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Notifications */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <ThemeToggle variant="dropdown" />

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                John Smith
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Managing Partner
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      John Smith
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      john.smith@smithcpa.com
                    </div>
                  </div>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors mt-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global Components */}
      <GlobalSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onOpen={() => setGlobalSearchOpen(true)}
      />

      <KeyboardShortcuts
        isOpen={keyboardShortcutsOpen}
        onClose={() => setKeyboardShortcutsOpen(false)}
        onOpen={() => setKeyboardShortcutsOpen(true)}
      />
    </header>
  )
}