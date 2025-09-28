'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
  actionable?: boolean
  href?: string
}

interface NotificationBellProps {
  notifications?: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onNotificationClick?: (notification: Notification) => void
  className?: string
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Document Upload Complete',
    message: 'John Smith uploaded Q4 2024 tax documents',
    time: '2 minutes ago',
    read: false,
    type: 'success',
    actionable: true,
    href: '/dashboard/documents/john-smith-q4'
  },
  {
    id: '2',
    title: 'Payment Overdue Alert',
    message: 'Invoice #2024-003 is 15 days overdue',
    time: '1 hour ago',
    read: false,
    type: 'warning',
    actionable: true,
    href: '/dashboard/billing/invoice-2024-003'
  },
  {
    id: '3',
    title: 'Client Meeting Reminder',
    message: 'Meeting with Sarah Johnson at 3:00 PM today',
    time: '2 hours ago',
    read: false,
    type: 'info',
    actionable: true,
    href: '/dashboard/calendar/meeting-sarah-johnson'
  },
  {
    id: '4',
    title: 'Workflow Complete',
    message: 'Tax preparation workflow completed for ABC Corp',
    time: '5 hours ago',
    read: true,
    type: 'success',
    href: '/dashboard/workflows/abc-corp-tax'
  },
  {
    id: '5',
    title: 'System Maintenance',
    message: 'Scheduled maintenance tonight from 2-4 AM EST',
    time: '1 day ago',
    read: true,
    type: 'info'
  }
]

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

const typeColors = {
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  warning: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
}

export function NotificationBell({
  notifications = mockNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  className
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = localNotifications.filter(n => !n.read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    onMarkAsRead?.(id)
  }

  const handleMarkAllAsRead = () => {
    setLocalNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
    onMarkAllAsRead?.()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    onNotificationClick?.(notification)
    if (notification.href) {
      window.location.href = notification.href
    }
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        )}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -top-1 -right-1 w-5 h-5',
              'bg-red-500 text-white text-xs font-medium',
              'rounded-full flex items-center justify-center',
              'ring-2 ring-white dark:ring-gray-900'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full mt-2 w-96 z-50',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'rounded-lg shadow-lg',
              'max-h-96 overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-80">
              {localNotifications.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {localNotifications.map((notification, index) => {
                    const Icon = typeIcons[notification.type]

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'relative p-4 cursor-pointer group',
                          'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                          'transition-colors duration-150',
                          !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className={cn(
                            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                            typeColors[notification.type]
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={cn(
                                'text-sm font-medium',
                                notification.read
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-900 dark:text-white'
                              )}>
                                {notification.title}
                              </p>
                              <button
                                onClick={(e) => handleDismiss(notification.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
                              >
                                <X className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {notification.time}
                              </span>

                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification.id)
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No notifications yet
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {localNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                <button className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center space-x-1">
                  <Settings className="w-4 h-4" />
                  <span>Notification Settings</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}