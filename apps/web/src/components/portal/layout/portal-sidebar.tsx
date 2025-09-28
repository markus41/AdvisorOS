'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  FileText,
  TrendingUp,
  MessageCircle,
  Receipt,
  Settings,
  Upload,
  CreditCard,
  Bell,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

const navigation: NavigationSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/portal', icon: Home },
      { name: 'Documents', href: '/portal/documents', icon: FileText, badge: 3 },
      { name: 'Financials', href: '/portal/financials', icon: TrendingUp },
      { name: 'Messages', href: '/portal/messages', icon: MessageCircle, badge: 2 },
      { name: 'Invoices', href: '/portal/invoices', icon: Receipt },
    ]
  },
  {
    title: 'Quick Actions',
    items: [
      { name: 'Upload Files', href: '/portal/documents/upload', icon: Upload },
      { name: 'Make Payment', href: '/portal/invoices/pay', icon: CreditCard },
    ]
  },
  {
    title: 'Account',
    items: [
      { name: 'Settings', href: '/portal/settings', icon: Settings },
    ]
  }
]

interface SidebarProps {
  className?: string
}

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItemProps {
  item: NavigationItem
  isActive: boolean
  onClick?: () => void
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
  const Icon = item.icon

  return (
    <a
      href={item.href}
      onClick={onClick}
      className={cn(
        'group relative flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      )}
    >
      <div className="flex items-center space-x-3">
        <Icon className={cn(
          'w-5 h-5 transition-colors',
          isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
        )} />
        <span>{item.name}</span>
      </div>
      {item.badge && (
        <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </a>
  )
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center space-x-3 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">CP</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Client Portal
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        {navigation.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))}
                  onClick={onItemClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 CPA Platform
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Need help? <a href="/portal/help" className="text-blue-600 dark:text-blue-400 hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export function PortalSidebar({ className }: SidebarProps) {
  return (
    <div className={cn(
      'hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col',
      className
    )}>
      <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <SidebarContent />
      </div>
    </div>
  )
}

export function MobilePortalSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 lg:hidden"
      >
        <div className="flex h-full flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CP</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Client Portal
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {navigation.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={window.location.pathname === item.href}
                      onClick={onClose}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2024 CPA Platform
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Need help? <a href="/portal/help" className="text-blue-600 dark:text-blue-400 hover:underline">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}