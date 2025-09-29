import { lazy, Suspense, ComponentType, ReactElement } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

interface LazyLoadOptions {
  fallback?: ReactElement
  errorFallback?: ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  retryDelay?: number
  maxRetries?: number
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
}

interface LazyComponentMap {
  [key: string]: () => Promise<{ default: ComponentType<any> }>
}

class LazyLoadManager {
  private static instance: LazyLoadManager
  private loadedComponents = new Set<string>()
  private preloadQueue = new Map<string, Promise<any>>()
  private errorCounts = new Map<string, number>()

  static getInstance(): LazyLoadManager {
    if (!LazyLoadManager.instance) {
      LazyLoadManager.instance = new LazyLoadManager()
    }
    return LazyLoadManager.instance
  }

  // Create a lazy-loaded component with retry logic and error handling
  createLazyComponent<T = {}>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    options: LazyLoadOptions = {}
  ): ComponentType<T> {
    const {
      fallback = <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />,
      errorFallback: ErrorFallback,
      retryDelay = 1000,
      maxRetries = 3,
      priority = 'medium'
    } = options

    const componentKey = importFn.toString()

    const LazyComponent = lazy(async () => {
      try {
        const result = await this.loadWithRetry(importFn, componentKey, maxRetries, retryDelay)
        this.loadedComponents.add(componentKey)
        return result
      } catch (error) {
        console.error('Failed to load component after retries:', error)
        throw error
      }
    })

    return (props: T) => (
      <ErrorBoundary
        FallbackComponent={ErrorFallback || DefaultErrorFallback}
        onError={(error) => {
          console.error('Component error:', error)
          this.errorCounts.set(componentKey, (this.errorCounts.get(componentKey) || 0) + 1)
        }}
        onReset={() => {
          this.errorCounts.delete(componentKey)
          this.loadedComponents.delete(componentKey)
        }}
      >
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  private async loadWithRetry<T>(
    importFn: () => Promise<T>,
    componentKey: string,
    maxRetries: number,
    retryDelay: number
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await importFn()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) break

        // Exponential backoff with jitter
        const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  // Preload components for better user experience
  preloadComponent(importFn: () => Promise<any>, componentKey?: string): Promise<any> {
    const key = componentKey || importFn.toString()

    if (this.loadedComponents.has(key)) {
      return Promise.resolve()
    }

    if (this.preloadQueue.has(key)) {
      return this.preloadQueue.get(key)!
    }

    const preloadPromise = importFn().then(module => {
      this.loadedComponents.add(key)
      this.preloadQueue.delete(key)
      return module
    }).catch(error => {
      this.preloadQueue.delete(key)
      console.warn('Failed to preload component:', error)
      throw error
    })

    this.preloadQueue.set(key, preloadPromise)
    return preloadPromise
  }

  // Preload components based on user interaction patterns
  preloadOnInteraction(
    element: Element,
    importFn: () => Promise<any>,
    interaction: 'hover' | 'focus' | 'intersection' = 'hover'
  ): void {
    let triggered = false

    const preload = () => {
      if (!triggered) {
        triggered = true
        this.preloadComponent(importFn)
      }
    }

    switch (interaction) {
      case 'hover':
        element.addEventListener('mouseenter', preload, { once: true })
        element.addEventListener('touchstart', preload, { once: true })
        break

      case 'focus':
        element.addEventListener('focus', preload, { once: true })
        break

      case 'intersection':
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                preload()
                observer.unobserve(entry.target)
              }
            })
          },
          { rootMargin: '50px' }
        )
        observer.observe(element)
        break
    }
  }

  // Get loading statistics
  getLoadingStats(): {
    loadedComponents: number
    pendingPreloads: number
    errorCounts: Record<string, number>
    totalErrors: number
  } {
    const errorCounts = Object.fromEntries(this.errorCounts)

    return {
      loadedComponents: this.loadedComponents.size,
      pendingPreloads: this.preloadQueue.size,
      errorCounts,
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0)
    }
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
      <p className="text-red-600 mb-4">Failed to load component. Please try again.</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}

// Pre-configured lazy components for AdvisorOS
const lazyManager = LazyLoadManager.getInstance()

// Dashboard components
export const LazyDashboard = lazyManager.createLazyComponent(
  () => import('@/components/dashboard/Dashboard'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-96 w-full rounded" />,
    priority: 'high'
  }
)

export const LazyAnalytics = lazyManager.createLazyComponent(
  () => import('@/components/analytics/AnalyticsDashboard'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-64 w-full rounded" />,
    priority: 'medium'
  }
)

// Client management components
export const LazyClientList = lazyManager.createLazyComponent(
  () => import('@/components/clients/ClientList'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-48 w-full rounded" />,
    priority: 'high'
  }
)

export const LazyClientDetail = lazyManager.createLazyComponent(
  () => import('@/components/clients/ClientDetail'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-64 w-full rounded" />,
    priority: 'medium'
  }
)

// Document components
export const LazyDocumentViewer = lazyManager.createLazyComponent(
  () => import('@/components/documents/DocumentViewer'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-96 w-full rounded" />,
    priority: 'medium'
  }
)

export const LazyDocumentUpload = lazyManager.createLazyComponent(
  () => import('@/components/documents/DocumentUpload'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />,
    priority: 'low'
  }
)

// Task management components
export const LazyTaskBoard = lazyManager.createLazyComponent(
  () => import('@/components/tasks/TaskBoard'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-80 w-full rounded" />,
    priority: 'high'
  }
)

export const LazyTaskDetail = lazyManager.createLazyComponent(
  () => import('@/components/tasks/TaskDetail'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-48 w-full rounded" />,
    priority: 'medium'
  }
)

// Workflow components
export const LazyWorkflowDesigner = lazyManager.createLazyComponent(
  () => import('@/components/workflows/WorkflowDesigner'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-96 w-full rounded" />,
    priority: 'low'
  }
)

export const LazyWorkflowExecution = lazyManager.createLazyComponent(
  () => import('@/components/workflows/WorkflowExecution'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-64 w-full rounded" />,
    priority: 'medium'
  }
)

// QuickBooks integration components
export const LazyQuickBooksSetup = lazyManager.createLazyComponent(
  () => import('@/components/integrations/QuickBooksSetup'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-48 w-full rounded" />,
    priority: 'low'
  }
)

export const LazyQuickBooksSync = lazyManager.createLazyComponent(
  () => import('@/components/integrations/QuickBooksSync'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />,
    priority: 'medium'
  }
)

// Report components
export const LazyReportBuilder = lazyManager.createLazyComponent(
  () => import('@/components/reports/ReportBuilder'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-80 w-full rounded" />,
    priority: 'low'
  }
)

export const LazyReportViewer = lazyManager.createLazyComponent(
  () => import('@/components/reports/ReportViewer'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-96 w-full rounded" />,
    priority: 'medium'
  }
)

// Settings components
export const LazyOrganizationSettings = lazyManager.createLazyComponent(
  () => import('@/components/settings/OrganizationSettings'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-64 w-full rounded" />,
    priority: 'low'
  }
)

export const LazyUserManagement = lazyManager.createLazyComponent(
  () => import('@/components/settings/UserManagement'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-48 w-full rounded" />,
    priority: 'low'
  }
)

// Tax season specific components
export const LazyTaxDashboard = lazyManager.createLazyComponent(
  () => import('@/components/tax/TaxDashboard'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-96 w-full rounded" />,
    priority: 'high'
  }
)

export const LazyTaxFormProcessor = lazyManager.createLazyComponent(
  () => import('@/components/tax/TaxFormProcessor'),
  {
    fallback: <div className="animate-pulse bg-gray-200 h-64 w-full rounded" />,
    priority: 'high'
  }
)

// Preload critical components for better UX
export function preloadCriticalComponents(): Promise<void[]> {
  const criticalComponents = [
    () => import('@/components/dashboard/Dashboard'),
    () => import('@/components/clients/ClientList'),
    () => import('@/components/tasks/TaskBoard'),
  ]

  return Promise.all(
    criticalComponents.map(importFn =>
      lazyManager.preloadComponent(importFn).catch(error => {
        console.warn('Failed to preload critical component:', error)
      })
    )
  )
}

// Preload tax season components when approaching tax season
export function preloadTaxSeasonComponents(): Promise<void[]> {
  const taxComponents = [
    () => import('@/components/tax/TaxDashboard'),
    () => import('@/components/tax/TaxFormProcessor'),
    () => import('@/components/documents/DocumentViewer'),
    () => import('@/components/reports/ReportBuilder'),
  ]

  return Promise.all(
    taxComponents.map(importFn =>
      lazyManager.preloadComponent(importFn).catch(error => {
        console.warn('Failed to preload tax component:', error)
      })
    )
  )
}

// Route-based preloading
export function preloadForRoute(route: string): Promise<void[]> {
  const routeComponents: Record<string, (() => Promise<any>)[]> = {
    '/dashboard': [
      () => import('@/components/dashboard/Dashboard'),
      () => import('@/components/analytics/AnalyticsDashboard'),
    ],
    '/clients': [
      () => import('@/components/clients/ClientList'),
      () => import('@/components/clients/ClientDetail'),
    ],
    '/documents': [
      () => import('@/components/documents/DocumentViewer'),
      () => import('@/components/documents/DocumentUpload'),
    ],
    '/tasks': [
      () => import('@/components/tasks/TaskBoard'),
      () => import('@/components/tasks/TaskDetail'),
    ],
    '/workflows': [
      () => import('@/components/workflows/WorkflowDesigner'),
      () => import('@/components/workflows/WorkflowExecution'),
    ],
    '/reports': [
      () => import('@/components/reports/ReportBuilder'),
      () => import('@/components/reports/ReportViewer'),
    ],
    '/settings': [
      () => import('@/components/settings/OrganizationSettings'),
      () => import('@/components/settings/UserManagement'),
    ],
  }

  const components = routeComponents[route] || []

  return Promise.all(
    components.map(importFn =>
      lazyManager.preloadComponent(importFn).catch(error => {
        console.warn(`Failed to preload component for route ${route}:`, error)
      })
    )
  )
}

export { LazyLoadManager }
export default lazyManager