'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Settings,
  User,
  BarChart3,
  Users,
  FileText,
  Workflow,
  CreditCard,
  Home,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
  currentPath?: string
}

const navigationItems = [
  {
    name: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    badge: null,
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    badge: null,
  },
  {
    name: 'Clients',
    icon: Users,
    href: '/dashboard/clients',
    badge: { count: 124, variant: 'secondary' as const },
  },
  {
    name: 'Documents',
    icon: FileText,
    href: '/dashboard/documents',
    badge: { count: 23, variant: 'destructive' as const },
  },
  {
    name: 'Workflows',
    icon: Workflow,
    href: '/dashboard/workflows',
    badge: { count: 5, variant: 'secondary' as const },
  },
  {
    name: 'Team',
    icon: Users,
    href: '/dashboard/team',
    badge: null,
  },
  {
    name: 'Reports',
    icon: FileText,
    href: '/dashboard/reports',
    badge: null,
  },
  {
    name: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    badge: null,
  },
]

const quickActions = [
  { name: 'Add Client', icon: Plus, action: 'add-client' },
  { name: 'Upload Document', icon: Plus, action: 'upload-document' },
  { name: 'Create Invoice', icon: Plus, action: 'create-invoice' },
  { name: 'New Report', icon: Plus, action: 'new-report' },
]

export function MobileNavigation({ isOpen, onClose, currentPath }: MobileNavigationProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNavigation = (href: string) => {
    window.location.href = href
    onClose()
  }

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action)
    // In real implementation, this would trigger the appropriate action
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Mobile Navigation Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-gray-900 z-50 lg:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">CP</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">CPA Platform</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/avatars/user.jpg" />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Sarah Johnson</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Senior Partner</p>
                </div>
                <Bell className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clients, documents..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center justify-between w-full p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Quick Actions</span>
                </div>
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform',
                  showQuickActions && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1"
                  >
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.action}
                          onClick={() => handleQuickAction(action.action)}
                          className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{action.name}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Items */}
            <div className="p-4">
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.href

                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <Badge variant={item.badge.variant} size="sm">
                            {item.badge.count}
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                © 2024 CPA Platform
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Mobile-responsive table component
interface MobileTableProps {
  headers: string[]
  data: Array<Record<string, any>>
  renderRow: (item: any, index: number) => React.ReactNode
  renderMobileCard: (item: any, index: number) => React.ReactNode
  className?: string
}

export function ResponsiveTable({
  headers,
  data,
  renderRow,
  renderMobileCard,
  className,
}: MobileTableProps) {
  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map((header) => (
                <th key={header} className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 text-sm">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => renderMobileCard(item, index))}
      </div>
    </div>
  )
}

// Mobile-responsive chart container
interface ResponsiveChartContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ResponsiveChartContainer({
  title,
  description,
  children,
  actions,
  className,
}: ResponsiveChartContainerProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6',
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>

      {/* Chart container with responsive height */}
      <div className="h-64 sm:h-72 md:h-80">
        {children}
      </div>
    </div>
  )
}

// Mobile-responsive grid layout
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 6,
  className,
}: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid',
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  )

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

// Hook for responsive breakpoint detection
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('sm')
      else if (width < 768) setBreakpoint('md')
      else if (width < 1024) setBreakpoint('lg')
      else if (width < 1280) setBreakpoint('xl')
      else setBreakpoint('2xl')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
  }
}

// Mobile-optimized search component
interface MobileSearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
}

export function MobileSearch({ placeholder = 'Search...', onSearch, className }: MobileSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    onSearch(searchTerm)
    setIsExpanded(false)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Mobile: Expandable Search */}
      <div className="md:hidden">
        {!isExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="p-2"
          >
            <Search className="w-5 h-5" />
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-0 right-0 left-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={placeholder}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button size="sm" onClick={handleSearch}>
                Search
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Desktop: Regular Search */}
      <div className="hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  )
}