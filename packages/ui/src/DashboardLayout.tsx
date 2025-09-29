import React, { useState } from 'react'
import {
  Menu,
  X,
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { cn } from './utils/cn'
import { Button } from './Button'
import { Input } from './Input'
import { Badge } from './Badge'
import { PresenceIndicator, type User } from './PresenceIndicator'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning'
  }
  children?: NavItem[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
  navigationItems: NavItem[]
  currentUser: User
  onlineUsers?: User[]
  notifications?: Array<{
    id: string
    title: string
    message: string
    read: boolean
    timestamp: Date
  }>
  onNavigate?: (href: string) => void
  onLogout?: () => void
  className?: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navigationItems,
  currentUser,
  onlineUsers = [],
  notifications = [],
  onNavigate,
  onLogout,
  className,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const unreadNotifications = notifications.filter((n) => !n.read).length

  const handleNavClick = (href: string) => {
    onNavigate?.(href)
    setSidebarOpen(false)
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">AdvisorOS</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleNavClick(item.href)}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group"
              >
                <span className="mr-3 text-gray-400 group-hover:text-gray-500">
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant={item.badge.variant} className="ml-auto">
                    {item.badge.text}
                  </Badge>
                )}
              </button>

              {/* Sub-navigation */}
              {item.children && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleNavClick(child.href)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                    >
                      {child.label}
                      {child.badge && (
                        <Badge variant={child.badge.variant} className="ml-auto">
                          {child.badge.text}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User presence */}
        <div className="p-4 border-t border-gray-200">
          <PresenceIndicator
            users={onlineUsers}
            maxVisible={3}
            showNames
            className="mb-3"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Search */}
              <div className="hidden md:block">
                <Input
                  type="search"
                  placeholder="Search..."
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-64"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>

                {/* Notifications dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              'p-4 border-b border-gray-100 hover:bg-gray-50',
                              !notification.read && 'bg-blue-50'
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full mt-2',
                                  notification.read ? 'bg-gray-300' : 'bg-blue-500'
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 5 && (
                      <div className="p-3 border-t border-gray-200">
                        <Button variant="ghost" size="sm" className="w-full">
                          View all notifications
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      currentUser.name[0].toUpperCase()
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-gray-500">{currentUser.id}</p>
                    </div>
                    <div className="py-2">
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      <button
                        onClick={onLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Click outside handlers */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  )
}

// Default navigation items for CPA platform
export const defaultNavigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    href: '/dashboard',
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <Users className="w-5 h-5" />,
    href: '/clients',
    badge: { text: '12', variant: 'secondary' },
    children: [
      { id: 'all-clients', label: 'All Clients', icon: null, href: '/clients' },
      { id: 'new-client', label: 'Add Client', icon: null, href: '/clients/new' },
      { id: 'import-clients', label: 'Import', icon: null, href: '/clients/import' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <FileText className="w-5 h-5" />,
    href: '/documents',
    badge: { text: '5', variant: 'warning' },
    children: [
      { id: 'all-documents', label: 'All Documents', icon: null, href: '/documents' },
      { id: 'upload', label: 'Upload', icon: null, href: '/documents/upload' },
      { id: 'review-queue', label: 'Review Queue', icon: null, href: '/documents/review' },
    ],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/workflows',
    children: [
      { id: 'active-workflows', label: 'Active', icon: null, href: '/workflows/active' },
      { id: 'templates', label: 'Templates', icon: null, href: '/workflows/templates' },
      { id: 'designer', label: 'Designer', icon: null, href: '/workflows/designer' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/reports',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings',
    children: [
      { id: 'profile', label: 'Profile', icon: null, href: '/settings/profile' },
      { id: 'organization', label: 'Organization', icon: null, href: '/settings/organization' },
      { id: 'integrations', label: 'Integrations', icon: null, href: '/settings/integrations' },
      { id: 'billing', label: 'Billing', icon: null, href: '/settings/billing' },
    ],
  },
]