'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRing,
  Check,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  FileText,
  DollarSign,
  Users,
  MessageCircle,
  Settings,
  Filter,
  Archive,
  Trash2,
  Star,
  Eye,
  EyeOff,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useWebSocket } from '@/hooks/use-websocket'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'reminder' | 'deadline' | 'message' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  isArchived: boolean
  isPinned: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: 'client' | 'deadline' | 'financial' | 'system' | 'team' | 'document'
  actionUrl?: string
  actionText?: string
  clientId?: string
  clientName?: string
  relatedId?: string
  metadata?: Record<string, any>
  expiresAt?: string
  soundEnabled?: boolean
}

interface NotificationPreferences {
  categories: {
    client: boolean
    deadline: boolean
    financial: boolean
    system: boolean
    team: boolean
    document: boolean
  }
  types: {
    info: boolean
    warning: boolean
    error: boolean
    success: boolean
    reminder: boolean
    deadline: boolean
    message: boolean
    system: boolean
  }
  sound: boolean
  desktop: boolean
  email: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  priorities: {
    low: boolean
    normal: boolean
    high: boolean
    urgent: boolean
  }
}

interface NotificationCenterProps {
  currentUserId: string
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'deadline',
    title: 'Tax Filing Deadline Approaching',
    message: 'Johnson Corp Q2 tax filing is due in 3 days',
    timestamp: '2024-06-15T14:30:00Z',
    isRead: false,
    isArchived: false,
    isPinned: true,
    priority: 'high',
    category: 'deadline',
    actionUrl: '/clients/johnson-corp/taxes',
    actionText: 'Review Filing',
    clientId: 'client1',
    clientName: 'Johnson Corp',
    relatedId: 'tax_filing_123',
    soundEnabled: true
  },
  {
    id: '2',
    type: 'message',
    title: 'New Client Message',
    message: 'Sarah from ABC Manufacturing sent you a message about financial statements',
    timestamp: '2024-06-15T13:45:00Z',
    isRead: false,
    isArchived: false,
    isPinned: false,
    priority: 'normal',
    category: 'client',
    actionUrl: '/messages/thread/abc-manufacturing',
    actionText: 'View Message',
    clientId: 'client2',
    clientName: 'ABC Manufacturing',
    soundEnabled: true
  },
  {
    id: '3',
    type: 'success',
    title: 'Document Processing Complete',
    message: 'Successfully processed 15 documents for TechStart LLC',
    timestamp: '2024-06-15T12:00:00Z',
    isRead: true,
    isArchived: false,
    isPinned: false,
    priority: 'low',
    category: 'document',
    actionUrl: '/documents/techstart-llc',
    actionText: 'View Documents',
    clientId: 'client3',
    clientName: 'TechStart LLC'
  },
  {
    id: '4',
    type: 'warning',
    title: 'Payment Overdue',
    message: 'Invoice #INV-2024-156 from Global Services is 15 days overdue ($8,500)',
    timestamp: '2024-06-15T10:30:00Z',
    isRead: false,
    isArchived: false,
    isPinned: false,
    priority: 'high',
    category: 'financial',
    actionUrl: '/invoices/INV-2024-156',
    actionText: 'Review Invoice',
    clientId: 'client4',
    clientName: 'Global Services',
    relatedId: 'invoice_156'
  },
  {
    id: '5',
    type: 'system',
    title: 'System Maintenance Scheduled',
    message: 'Platform maintenance scheduled for tonight 11 PM - 2 AM EST',
    timestamp: '2024-06-14T16:00:00Z',
    isRead: true,
    isArchived: false,
    isPinned: false,
    priority: 'normal',
    category: 'system',
    expiresAt: '2024-06-16T02:00:00Z'
  }
]

const defaultPreferences: NotificationPreferences = {
  categories: {
    client: true,
    deadline: true,
    financial: true,
    system: true,
    team: true,
    document: true
  },
  types: {
    info: true,
    warning: true,
    error: true,
    success: true,
    reminder: true,
    deadline: true,
    message: true,
    system: true
  },
  sound: true,
  desktop: true,
  email: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  priorities: {
    low: true,
    normal: true,
    high: true,
    urgent: true
  }
}

export function NotificationCenter({ currentUserId, isMinimized = false, onToggleMinimize }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [selectedTab, setSelectedTab] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // WebSocket for real-time notifications
  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/notifications',
    onMessage: (message) => {
      if (message.type === 'new_notification') {
        const notification = message.data as Notification
        setNotifications(prev => [notification, ...prev])

        // Play sound if enabled
        if (preferences.sound && notification.soundEnabled && soundEnabled) {
          playNotificationSound(notification.priority)
        }

        // Show desktop notification if enabled
        if (preferences.desktop && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          })
        }
      } else if (message.type === 'notification_updated') {
        setNotifications(prev => prev.map(n =>
          n.id === message.data.id ? { ...n, ...message.data } : n
        ))
      }
    }
  })

  const playNotificationSound = (priority: string) => {
    try {
      const audio = new Audio()
      switch (priority) {
        case 'urgent':
          audio.src = '/sounds/notification-urgent.mp3'
          break
        case 'high':
          audio.src = '/sounds/notification-high.mp3'
          break
        default:
          audio.src = '/sounds/notification-default.mp3'
      }
      audio.play()
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ))

    if (isConnected) {
      sendMessage({
        type: 'mark_read',
        data: { notificationId, userId: currentUserId }
      })
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

    if (isConnected) {
      sendMessage({
        type: 'mark_all_read',
        data: { userId: currentUserId }
      })
    }
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))

    if (isConnected) {
      sendMessage({
        type: 'delete_notification',
        data: { notificationId, userId: currentUserId }
      })
    }
  }

  const archiveNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isArchived: true } : n
    ))
  }

  const pinNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isPinned: !n.isPinned } : n
    ))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'reminder': return <Clock className="w-5 h-5 text-purple-600" />
      case 'deadline': return <Calendar className="w-5 h-5 text-orange-600" />
      case 'message': return <MessageCircle className="w-5 h-5 text-blue-600" />
      case 'system': return <Settings className="w-5 h-5 text-gray-600" />
      default: return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'normal': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
      case 'low': return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = selectedTab === 'all' ||
      (selectedTab === 'unread' && !notification.isRead) ||
      (selectedTab === 'pinned' && notification.isPinned) ||
      (selectedTab === 'archived' && notification.isArchived)

    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority

    return matchesTab && matchesCategory && matchesPriority && !notification.isArchived
  })

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length

  useEffect(() => {
    // Request desktop notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-8 w-8 p-0"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Notification Settings</DialogTitle>
                      <DialogDescription>
                        Customize your notification preferences
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* General Settings */}
                      <div className="space-y-3">
                        <h4 className="font-medium">General</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sound">Sound notifications</Label>
                            <Switch
                              id="sound"
                              checked={preferences.sound}
                              onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, sound: checked }))
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="desktop">Desktop notifications</Label>
                            <Switch
                              id="desktop"
                              checked={preferences.desktop}
                              onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, desktop: checked }))
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email">Email notifications</Label>
                            <Switch
                              id="email"
                              checked={preferences.email}
                              onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, email: checked }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Categories</h4>
                        <div className="space-y-2">
                          {Object.entries(preferences.categories).map(([category, enabled]) => (
                            <div key={category} className="flex items-center justify-between">
                              <Label htmlFor={category} className="capitalize">
                                {category} notifications
                              </Label>
                              <Switch
                                id={category}
                                checked={enabled}
                                onCheckedChange={(checked) =>
                                  setPreferences(prev => ({
                                    ...prev,
                                    categories: { ...prev.categories, [category]: checked }
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quiet Hours */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Quiet Hours</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="quietHours">Enable quiet hours</Label>
                            <Switch
                              id="quietHours"
                              checked={preferences.quietHours.enabled}
                              onCheckedChange={(checked) =>
                                setPreferences(prev => ({
                                  ...prev,
                                  quietHours: { ...prev.quietHours, enabled: checked }
                                }))
                              }
                            />
                          </div>
                          {preferences.quietHours.enabled && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Start time</Label>
                                <Select
                                  value={preferences.quietHours.start}
                                  onValueChange={(value) =>
                                    setPreferences(prev => ({
                                      ...prev,
                                      quietHours: { ...prev.quietHours, start: value }
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const hour = i.toString().padStart(2, '0')
                                      return (
                                        <SelectItem key={hour} value={`${hour}:00`}>
                                          {hour}:00
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">End time</Label>
                                <Select
                                  value={preferences.quietHours.end}
                                  onValueChange={(value) =>
                                    setPreferences(prev => ({
                                      ...prev,
                                      quietHours: { ...prev.quietHours, end: value }
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const hour = i.toString().padStart(2, '0')
                                      return (
                                        <SelectItem key={hour} value={`${hour}:00`}>
                                          {hour}:00
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {/* Filters */}
            <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-10">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs h-4">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pinned" className="text-xs">Pinned</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-96">
                  {filteredNotifications.length > 0 ? (
                    <div className="space-y-1 p-2">
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-3 rounded border-l-2 cursor-pointer transition-colors ${
                            !notification.isRead
                              ? getPriorityColor(notification.priority)
                              : 'border-l-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-sm font-medium ${
                                  !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  {notification.isPinned && (
                                    <Star className="w-3 h-3 text-yellow-500" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {getTimeAgo(notification.timestamp)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              {notification.clientName && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.clientName}
                                </Badge>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                {notification.actionText && (
                                  <Button variant="outline" size="sm" className="h-6 text-xs">
                                    {notification.actionText}
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <Settings className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                      <Check className="w-4 h-4 mr-2" />
                                      Mark as read
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => pinNotification(notification.id)}>
                                      <Star className="w-4 h-4 mr-2" />
                                      {notification.isPinned ? 'Unpin' : 'Pin'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                                      <Archive className="w-4 h-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteNotification(notification.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-center">
                      <div>
                        <Bell className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No notifications found
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                <ScrollArea className="h-96">
                  {filteredNotifications.filter(n => !n.isRead).length > 0 ? (
                    <div className="space-y-1 p-2">
                      {filteredNotifications.filter(n => !n.isRead).map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 rounded border-l-2 cursor-pointer transition-colors ${getPriorityColor(notification.priority)}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              {notification.clientName && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.clientName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-center">
                      <div>
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          All caught up!
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pinned" className="mt-0">
                <ScrollArea className="h-96">
                  {filteredNotifications.filter(n => n.isPinned).length > 0 ? (
                    <div className="space-y-1 p-2">
                      {filteredNotifications.filter(n => n.isPinned).map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded border-l-2 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span className="text-xs text-gray-500">
                                    {getTimeAgo(notification.timestamp)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-center">
                      <div>
                        <Star className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No pinned notifications
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="archived" className="mt-0">
                <ScrollArea className="h-96">
                  {filteredNotifications.filter(n => n.isArchived).length > 0 ? (
                    <div className="space-y-1 p-2">
                      {filteredNotifications.filter(n => n.isArchived).map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded border-l-2 border-l-gray-300 bg-gray-50 dark:bg-gray-800/50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-center">
                      <div>
                        <Archive className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No archived notifications
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}