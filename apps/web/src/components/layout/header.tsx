'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Plus,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  FileText,
  Users,
  Receipt,
  Command,
  X,
} from 'lucide-react'
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
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const searchRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const quickActionsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
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
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setNotificationsOpen(false)
        setQuickActionsOpen(false)
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
  }

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

        {/* Search */}
        <div ref={searchRef} className="relative">
          <div
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer',
              'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
              'hover:bg-gray-100 dark:hover:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500',
              searchOpen ? 'w-80' : 'w-64'
            )}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search clients, documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {searchQuery ? `Search results for "${searchQuery}"` : 'Recent searches'}
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        John Doe
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Client • Last active 2 days ago
                      </div>
                    </div>
                    <div className="p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        Tax Documents 2024
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Document • Uploaded yesterday
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
                          !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-2',
                            notification.type === 'info' && 'bg-blue-500',
                            notification.type === 'warning' && 'bg-yellow-500',
                            notification.type === 'success' && 'bg-green-500',
                            notification.type === 'error' && 'bg-red-500'
                          )} />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {notification.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">No notifications</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

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
    </header>
  )
}