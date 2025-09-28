'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'
import { Sidebar, MobileSidebar } from './sidebar'
import { Header } from './header'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

interface BreadcrumbItem {
  name: string
  href?: string
}

// Map paths to breadcrumb labels
const pathToBreadcrumb: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/clients': 'Clients',
  '/dashboard/documents': 'Documents',
  '/dashboard/reports': 'Reports',
  '/dashboard/workflows': 'Workflows',
  '/dashboard/team': 'Team',
  '/dashboard/settings': 'Settings',
  '/dashboard/clients/new': 'Add Client',
  '/dashboard/documents/upload': 'Upload Documents',
  '/dashboard/invoices/new': 'Create Invoice',
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', href: '/dashboard' }]

  let currentPath = ''
  for (let i = 1; i < segments.length; i++) {
    currentPath += `/${segments[i]}`
    const fullPath = currentPath
    const label = pathToBreadcrumb[fullPath] || segments[i].charAt(0).toUpperCase() + segments[i].slice(1)

    breadcrumbs.push({
      name: label,
      href: i === segments.length - 1 ? undefined : fullPath, // Last item has no href
    })
  }

  return breadcrumbs
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Home className="w-4 h-4" />
      {items.map((item, index) => (
        <React.Fragment key={item.name}>
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              {item.name}
            </a>
          ) : (
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {item.name}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

interface LoadingSkeletonProps {
  className?: string
}

function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />
      }

      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-ring"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const breadcrumbs = generateBreadcrumbs(pathname)

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <div className="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            <div className="h-16 border-b border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="flex-1">
            <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"></div>
            <div className="p-6">
              <LoadingSkeleton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header onMobileMenuToggle={handleMobileMenuToggle} />

          {/* Breadcrumbs */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Content Area */}
          <main className="flex-1 px-6 py-8">
            <ErrorBoundary>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full"
              >
                {children}
              </motion.div>
            </ErrorBoundary>
          </main>

          {/* Footer */}
          <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                © 2024 CPA Platform. All rights reserved.
              </div>
              <div className="flex items-center space-x-4">
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Support
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}