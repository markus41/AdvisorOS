'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Menu,
  Home,
  FileText,
  MessageCircle,
  CreditCard,
  Settings,
  User,
  Bell,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Camera,
  Mic,
  Send,
  MoreVertical,
  Download,
  Share,
  Bookmark,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Trophy,
  Star,
  Target,
  ArrowUp,
  ArrowDown,
  Filter,
  SortAsc,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: React.ReactNode
  currentUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    level?: number
    points?: number
  }
  notifications?: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    timestamp: string
    isRead: boolean
  }>
  onNotificationRead?: (id: string) => void
  className?: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  color: string
  badge?: string
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  action: () => void
  threshold: number
}

// Device detection hook
function useDeviceDetection() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isOnline, setIsOnline] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }

      setOrientation(width > height ? 'landscape' : 'portrait')
    }

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const updateBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          setBatteryLevel(Math.round(battery.level * 100))
        } catch {
          setBatteryLevel(null)
        }
      }
    }

    updateDeviceInfo()
    updateOnlineStatus()
    updateBattery()

    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return { deviceType, orientation, isOnline, batteryLevel }
}

// Pull to refresh hook
function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const threshold = 80

  const handleTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
  }

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, isRefreshing])

  return { isRefreshing, pullDistance, threshold }
}

// Swipe gestures hook
function useSwipeGestures(gestures: SwipeGesture[]) {
  const handlePanEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info
    const absOffsetX = Math.abs(offset.x)
    const absOffsetY = Math.abs(offset.y)

    gestures.forEach(gesture => {
      let triggered = false

      switch (gesture.direction) {
        case 'left':
          triggered = offset.x < -gesture.threshold && absOffsetX > absOffsetY
          break
        case 'right':
          triggered = offset.x > gesture.threshold && absOffsetX > absOffsetY
          break
        case 'up':
          triggered = offset.y < -gesture.threshold && absOffsetY > absOffsetX
          break
        case 'down':
          triggered = offset.y > gesture.threshold && absOffsetY > absOffsetX
          break
      }

      if (triggered) {
        gesture.action()
      }
    })
  }

  return { handlePanEnd }
}

function MobileNavigationBar({
  currentUser,
  notifications,
  onNotificationRead,
  deviceType,
  isOnline,
  batteryLevel
}: {
  currentUser?: MobileLayoutProps['currentUser']
  notifications?: MobileLayoutProps['notifications']
  onNotificationRead?: MobileLayoutProps['onNotificationRead']
  deviceType: 'mobile' | 'tablet' | 'desktop'
  isOnline: boolean
  batteryLevel: number | null
}) {
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0

  const navigationItems = [
    { id: 'home', icon: Home, label: 'Home', href: '/portal' },
    { id: 'documents', icon: FileText, label: 'Documents', href: '/portal/documents' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', href: '/portal/messages', badge: unreadCount > 0 ? unreadCount.toString() : undefined },
    { id: 'payments', icon: CreditCard, label: 'Payments', href: '/portal/payments' },
    { id: 'profile', icon: User, label: 'Profile', href: '/portal/profile' }
  ]

  return (
    <>
      {/* Status Bar (Mobile Only) */}
      {deviceType === 'mobile' && (
        <div className="bg-black text-white text-xs flex items-center justify-between px-4 py-1">
          <div className="flex items-center space-x-2">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {!isOnline && <WifiOff className="w-3 h-3" />}
          </div>
          <div className="flex items-center space-x-1">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            {batteryLevel !== null && (
              <div className="flex items-center space-x-1">
                {batteryLevel < 20 ? <BatteryLow className="w-3 h-3" /> : <Battery className="w-3 h-3" />}
                <span>{batteryLevel}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="py-6">
                  <h2 className="text-lg font-semibold mb-4">Menu</h2>
                  <div className="space-y-1">
                    {navigationItems.map(item => (
                      <a
                        key={item.id}
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">AdvisorOS</h1>
              {!isOnline && (
                <p className="text-xs text-orange-600 dark:text-orange-400">Offline mode</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="w-5 h-5" />
            </Button>

            <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="py-6">
                  <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-3">
                      {notifications?.map(notification => (
                        <Card
                          key={notification.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            !notification.isRead && "ring-2 ring-blue-200 dark:ring-blue-800"
                          )}
                          onClick={() => onNotificationRead?.(notification.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-2",
                                notification.type === 'error' && "bg-red-500",
                                notification.type === 'warning' && "bg-yellow-500",
                                notification.type === 'success' && "bg-green-500",
                                notification.type === 'info' && "bg-blue-500"
                              )} />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(notification.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )) || (
                        <div className="text-center py-8">
                          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">No notifications</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            {currentUser && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function MobileBottomNavigation({ currentTab, onTabChange }: {
  currentTab: string
  onTabChange: (tab: string) => void
}) {
  const navigationItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'messages', icon: MessageCircle, label: 'Messages' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
    { id: 'more', icon: MoreVertical, label: 'More' }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map(item => {
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuickActionsFAB({ actions }: { actions: QuickAction[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="space-y-3 mb-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={() => {
                    action.action()
                    setIsOpen(false)
                  }}
                  className={cn(
                    "rounded-full w-14 h-14 shadow-lg",
                    action.color
                  )}
                >
                  <action.icon className="w-6 h-6" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "rounded-full w-16 h-16 shadow-lg transition-transform",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="w-8 h-8" />
      </Button>
    </div>
  )
}

function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className
}: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}) {
  const swipeGestures: SwipeGesture[] = [
    ...(onSwipeLeft ? [{ direction: 'left' as const, action: onSwipeLeft, threshold: 100 }] : []),
    ...(onSwipeRight ? [{ direction: 'right' as const, action: onSwipeRight, threshold: 100 }] : [])
  ]

  const { handlePanEnd } = useSwipeGestures(swipeGestures)

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onPanEnd={handlePanEnd}
      className={cn("touch-pan-x", className)}
    >
      {children}
    </motion.div>
  )
}

function PullToRefreshIndicator({ isRefreshing, pullDistance, threshold }: {
  isRefreshing: boolean
  pullDistance: number
  threshold: number
}) {
  const progress = Math.min((pullDistance / threshold) * 100, 100)

  return (
    <div className="fixed top-16 left-0 right-0 z-30 pointer-events-none">
      <div className="flex justify-center pt-4">
        <div className={cn(
          "bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg transition-transform",
          pullDistance > 0 ? "scale-100" : "scale-0"
        )}>
          {isRefreshing ? (
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          ) : (
            <ArrowDown className={cn(
              "w-6 h-6 transition-transform",
              progress >= 100 ? "text-blue-600 rotate-180" : "text-gray-400"
            )} />
          )}
        </div>
      </div>
    </div>
  )
}

export function MobileOptimizedLayout({
  children,
  currentUser,
  notifications,
  onNotificationRead,
  className
}: MobileLayoutProps) {
  const [currentTab, setCurrentTab] = useState('home')
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)
  const { deviceType, orientation, isOnline, batteryLevel } = useDeviceDetection()

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh(async () => {
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500))
    window.location.reload()
  })

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineNotice(true)
      const timer = setTimeout(() => setShowOfflineNotice(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  const quickActions: QuickAction[] = [
    {
      id: 'upload',
      title: 'Upload Document',
      description: 'Take photo or select file',
      icon: Upload,
      action: () => console.log('Upload action'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'camera',
      title: 'Scan Receipt',
      description: 'Use camera to scan',
      icon: Camera,
      action: () => console.log('Camera action'),
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'message',
      title: 'Quick Message',
      description: 'Send to your CPA',
      icon: MessageCircle,
      action: () => console.log('Message action'),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'voice',
      title: 'Voice Note',
      description: 'Record voice message',
      icon: Mic,
      action: () => console.log('Voice action'),
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", className)}>
      <MobileNavigationBar
        currentUser={currentUser}
        notifications={notifications}
        onNotificationRead={onNotificationRead}
        deviceType={deviceType}
        isOnline={isOnline}
        batteryLevel={batteryLevel}
      />

      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />

      {/* Offline notice */}
      <AnimatePresence>
        {showOfflineNotice && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-4 right-4 z-30"
          >
            <Card className="bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    You're offline. Some features may be limited.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOfflineNotice(false)}
                    className="p-1 h-auto ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={cn(
        "pb-20", // Space for bottom navigation
        deviceType === 'mobile' ? "px-4 py-4" : "px-6 py-6"
      )}>
        <div className={cn(
          "mx-auto",
          deviceType === 'mobile' ? "max-w-md" : deviceType === 'tablet' ? "max-w-2xl" : "max-w-4xl"
        )}>
          {children}
        </div>
      </main>

      {/* Bottom navigation (mobile only) */}
      {deviceType === 'mobile' && (
        <MobileBottomNavigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />
      )}

      {/* Floating action button */}
      {deviceType === 'mobile' && (
        <QuickActionsFAB actions={quickActions} />
      )}

      {/* Device info panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 left-4 z-50 bg-black/80 text-white text-xs p-2 rounded">
          <div>Device: {deviceType}</div>
          <div>Orientation: {orientation}</div>
          <div>Online: {isOnline ? 'Yes' : 'No'}</div>
          {batteryLevel !== null && <div>Battery: {batteryLevel}%</div>}
        </div>
      )}
    </div>
  )
}

// Mobile-specific components
export function MobileTaskCard({
  task,
  onComplete,
  onSwipeLeft,
  onSwipeRight
}: {
  task: any
  onComplete: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}) {
  return (
    <SwipeableCard
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      className="mb-3"
    >
      <Card className="touch-manipulation">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
            <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
              {task.priority}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {task.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{task.estimatedTime}m</span>
              <Trophy className="w-4 h-4" />
              <span>{task.points} pts</span>
            </div>
            <Button size="sm" onClick={onComplete}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  )
}

export function MobileDocumentCard({
  document,
  onView,
  onShare,
  onDownload
}: {
  document: any
  onView: () => void
  onShare: () => void
  onDownload: () => void
}) {
  return (
    <SwipeableCard
      onSwipeLeft={onShare}
      onSwipeRight={onDownload}
      className="mb-3"
    >
      <Card className="touch-manipulation">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{document.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {document.size} • {document.uploadDate}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <Button size="sm" variant="outline" onClick={onView}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" onClick={onShare}>
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="outline" onClick={onDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  )
}

export function MobileMessageBubble({
  message,
  isOwn,
  onReact,
  onReply
}: {
  message: any
  isOwn: boolean
  onReact: () => void
  onReply: () => void
}) {
  return (
    <div className={cn(
      "flex mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
        isOwn
          ? "bg-blue-600 text-white"
          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
      )}>
        <p>{message.content}</p>
        <div className="flex items-center justify-between mt-1">
          <span className={cn(
            "text-xs",
            isOwn ? "text-blue-100" : "text-gray-500"
          )}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <div className="flex items-center space-x-2">
            <button onClick={onReact} className="p-1">
              <Heart className="w-3 h-3" />
            </button>
            <button onClick={onReply} className="p-1">
              <Reply className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export mobile-optimized hooks for use in other components
export { useDeviceDetection, usePullToRefresh, useSwipeGestures }