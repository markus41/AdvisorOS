'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Check,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  User,
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  Settings,
  Filter,
  MoreVertical,
  Archive,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'message' | 'deadline' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  priority: 'low' | 'medium' | 'high'
  category?: string
  avatar?: string
  metadata?: Record<string, any>
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'deadline',
    title: 'Tax Return Due Soon',
    message: 'John Smith\'s tax return is due in 2 days',
    timestamp: '2024-01-16T10:30:00Z',
    read: false,
    priority: 'high',
    category: 'Tax Services',
    actionUrl: '/dashboard/clients/john-smith',
    actionLabel: 'Review Return',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message from ABC Corp',
    message: 'We need clarification on the Q4 expenses report',
    timestamp: '2024-01-16T09:15:00Z',
    read: false,
    priority: 'medium',
    category: 'Client Communication',
    avatar: '/avatars/abc-corp.jpg',
    actionUrl: '/dashboard/messages/abc-corp',
    actionLabel: 'Reply',
  },
  {
    id: '3',
    type: 'task',
    title: 'Document Review Required',
    message: 'Sarah Johnson assigned you to review financial statements',
    timestamp: '2024-01-16T08:45:00Z',
    read: true,
    priority: 'medium',
    category: 'Task Assignment',
    actionUrl: '/dashboard/documents/review',
    actionLabel: 'Review Documents',
  },
  {
    id: '4',
    type: 'success',
    title: 'Payment Received',
    message: 'TechStart Inc. has paid invoice #INV-2024-001 ($4,500)',
    timestamp: '2024-01-15T16:20:00Z',
    read: true,
    priority: 'low',
    category: 'Billing',
    actionUrl: '/dashboard/invoices/inv-2024-001',
    actionLabel: 'View Invoice',
  },
  {
    id: '5',
    type: 'warning',
    title: 'Missing Documents',
    message: 'Global Industries has not uploaded required W-2 forms',
    timestamp: '2024-01-15T14:10:00Z',
    read: false,
    priority: 'medium',
    category: 'Document Management',
    actionUrl: '/dashboard/clients/global-industries',
    actionLabel: 'Request Documents',
  },
  {
    id: '6',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Sunday, Jan 21 from 2-4 AM EST',
    timestamp: '2024-01-15T12:00:00Z',
    read: true,
    priority: 'low',
    category: 'System Updates',
  },
  {
    id: '7',
    type: 'info',
    title: 'QuickBooks Sync Complete',
    message: 'Successfully synced 156 transactions from QuickBooks',
    timestamp: '2024-01-15T11:30:00Z',
    read: true,
    priority: 'low',
    category: 'Integrations',
    actionUrl: '/dashboard/integrations/quickbooks',
    actionLabel: 'View Details',
  },
  {
    id: '8',
    type: 'deadline',
    title: 'Client Meeting Tomorrow',
    message: 'Scheduled meeting with Johnson & Associates at 2:00 PM',
    timestamp: '2024-01-15T10:00:00Z',
    read: false,
    priority: 'high',
    category: 'Calendar',
    actionUrl: '/dashboard/calendar',
    actionLabel: 'View Calendar',
  },
]

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all')

  const unreadCount = notifications.filter(n => !n.read).length
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return Info
      case 'success':
        return CheckCircle2
      case 'warning':
        return AlertTriangle
      case 'error':
        return AlertTriangle
      case 'task':
        return FileText
      case 'message':
        return MessageSquare
      case 'deadline':
        return Clock
      case 'system':
        return Settings
      default:
        return Bell
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'task':
        return 'text-purple-600 dark:text-purple-400'
      case 'message':
        return 'text-blue-600 dark:text-blue-400'
      case 'deadline':
        return 'text-orange-600 dark:text-orange-400'
      case 'system':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filterNotifications = (notifications: Notification[]) => {
    let filtered = notifications

    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(n => n.type === activeTab)
    }

    // Apply additional filters
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read)
        break
      case 'priority':
        filtered = filtered.filter(n => n.priority === 'high')
        break
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const filteredNotifications = filterNotifications(notifications)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('relative', className)}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    All Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('unread')}>
                    Unread Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('priority')}>
                    High Priority
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{unreadCount} unread</span>
            {highPriorityCount > 0 && (
              <Badge variant="destructive" size="sm">
                {highPriorityCount} urgent
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 p-1 m-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="task" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="message" className="text-xs">Messages</TabsTrigger>
            <TabsTrigger value="deadline" className="text-xs">Deadlines</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getIcon={getNotificationIcon}
                      getColor={getNotificationColor}
                      getPriorityColor={getPriorityColor}
                      formatTimestamp={formatTimestamp}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" size="sm" className="w-full">
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: Notification['type']) => React.ComponentType<any>
  getColor: (type: Notification['type']) => string
  getPriorityColor: (priority: Notification['priority']) => string
  formatTimestamp: (timestamp: string) => string
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getIcon,
  getColor,
  getPriorityColor,
  formatTimestamp,
}: NotificationItemProps) {
  const Icon = getIcon(notification.type)

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-l-2',
        notification.read
          ? 'border-transparent'
          : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {notification.avatar ? (
            <Avatar className="w-8 h-8">
              <AvatarImage src={notification.avatar} />
              <AvatarFallback>
                <Icon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', getColor(notification.type))}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
              )}>
                {notification.title}
              </p>
              <p className={cn(
                'text-sm mt-1',
                notification.read ? 'text-gray-500' : 'text-gray-600 dark:text-gray-400'
              )}>
                {notification.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(notification.timestamp)}
                </span>
                {notification.category && (
                  <Badge variant="outline" size="sm" className="text-xs">
                    {notification.category}
                  </Badge>
                )}
                {notification.priority === 'high' && (
                  <Badge variant="destructive" size="sm" className="text-xs">
                    Urgent
                  </Badge>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {!notification.read && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Read
                  </DropdownMenuItem>
                )}
                {notification.actionUrl && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    window.open(notification.actionUrl, '_blank')
                  }}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onDelete(notification.id)
                }}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {notification.actionLabel && notification.actionUrl && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = notification.actionUrl!
                }}
              >
                {notification.actionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}