'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Metric,
  AreaChart,
  DonutChart,
  BarChart,
  ProgressBar,
  BadgeDelta,
  Flex,
  Grid,
} from '@tremor/react'
import {
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Upload,
  Plus,
  AlertTriangle,
  Calendar,
  Target,
  RefreshCw,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KPICard } from '@/components/ui/kpi-card'
import { ActivityFeed, mockActivities } from '@/components/ui/activity-feed'
import { StatusBadge } from '@/components/ui/status-badge'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { cn } from '@/lib/utils'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'

// Helper functions for formatting data
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercentChange = (current: number, previous: number) => {
  if (previous === 0) return { value: 0, type: 'neutral' as const }
  const change = ((current - previous) / previous) * 100
  return {
    value: Math.abs(change),
    type: change > 0 ? 'increase' as const : change < 0 ? 'decrease' as const : 'neutral' as const
  }
}

const revenueData = [
  { month: 'Jan', Revenue: 45000, Target: 50000 },
  { month: 'Feb', Revenue: 52000, Target: 50000 },
  { month: 'Mar', Revenue: 48000, Target: 50000 },
  { month: 'Apr', Revenue: 61000, Target: 55000 },
  { month: 'May', Revenue: 55000, Target: 55000 },
  { month: 'Jun', Revenue: 47000, Target: 55000 },
]

const clientServiceData = [
  { name: 'Tax Preparation', value: 45, color: 'blue' },
  { name: 'Bookkeeping', value: 30, color: 'green' },
  { name: 'Financial Planning', value: 15, color: 'purple' },
  { name: 'Payroll', value: 10, color: 'orange' },
]

const taskCompletionData = [
  { name: 'Jan', 'Completion Rate': 95 },
  { name: 'Feb', 'Completion Rate': 92 },
  { name: 'Mar', 'Completion Rate': 98 },
  { name: 'Apr', 'Completion Rate': 94 },
  { name: 'May', 'Completion Rate': 97 },
  { name: 'Jun', 'Completion Rate': 96 },
]

const teamUtilization = [
  { name: 'Sarah Johnson', utilization: 95, role: 'Senior Accountant' },
  { name: 'Mike Wilson', utilization: 87, role: 'Tax Specialist' },
  { name: 'Emily Davis', utilization: 92, role: 'Bookkeeper' },
  { name: 'John Smith', utilization: 78, role: 'Junior Accountant' },
]

const clientPortfolio = [
  {
    id: '1',
    name: 'ABC Corporation',
    status: 'active' as const,
    lastActivity: '2 hours ago',
    missingDocs: 0,
    overdueTasks: 0,
    qbSync: true,
  },
  {
    id: '2',
    name: 'Smith LLC',
    status: 'warning' as const,
    lastActivity: '1 day ago',
    missingDocs: 2,
    overdueTasks: 1,
    qbSync: true,
  },
  {
    id: '3',
    name: 'XYZ Inc',
    status: 'error' as const,
    lastActivity: '5 days ago',
    missingDocs: 5,
    overdueTasks: 3,
    qbSync: false,
  },
  {
    id: '4',
    name: 'Johnson & Co',
    status: 'active' as const,
    lastActivity: '30 minutes ago',
    missingDocs: 0,
    overdueTasks: 0,
    qbSync: true,
  },
]

const quickActions = [
  {
    title: 'Add New Client',
    description: 'Register a new client in the system',
    icon: Users,
    color: 'bg-blue-500 hover:bg-blue-600',
    href: '/dashboard/clients/new',
  },
  {
    title: 'Upload Documents',
    description: 'Upload client documents and files',
    icon: Upload,
    color: 'bg-green-500 hover:bg-green-600',
    href: '/dashboard/documents/upload',
  },
  {
    title: 'Create Invoice',
    description: 'Generate a new invoice for services',
    icon: FileText,
    color: 'bg-purple-500 hover:bg-purple-600',
    href: '/dashboard/invoices/new',
  },
  {
    title: 'Generate Report',
    description: 'Create financial or client reports',
    icon: TrendingUp,
    color: 'bg-orange-500 hover:bg-orange-600',
    href: '/dashboard/reports/new',
  },
]

interface ClientCardProps {
  client: typeof clientPortfolio[0]
}

function ClientCard({ client }: ClientCardProps) {
  return (
    <motion.div
      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {client.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {client.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last activity: {client.lastActivity}
            </p>
          </div>
        </div>
        <StatusBadge status={client.status} variant="dot" size="sm" />
      </div>

      <div className="space-y-2">
        {client.missingDocs > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-red-600 dark:text-red-400">
              {client.missingDocs} missing documents
            </span>
          </div>
        )}
        {client.overdueTasks > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <Clock className="w-3 h-3 text-orange-500" />
            <span className="text-orange-600 dark:text-orange-400">
              {client.overdueTasks} overdue tasks
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            QuickBooks
          </span>
          <StatusBadge
            status={client.qbSync ? 'success' : 'error'}
            label={client.qbSync ? 'Synced' : 'Not Synced'}
            size="sm"
            variant="soft"
          />
        </div>
      </div>
    </motion.div>
  )
}

interface QuickActionCardProps {
  action: typeof quickActions[0]
}

function QuickActionCard({ action }: QuickActionCardProps) {
  const Icon = action.icon

  return (
    <motion.button
      className={cn(
        'p-6 rounded-lg text-white text-left w-full transition-colors',
        action.color
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
          <p className="text-sm opacity-90">{action.description}</p>
        </div>
      </div>
    </motion.button>
  )
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // tRPC queries for dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = api.enhanced.getDashboard.useQuery(
    { timeRange },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  )

  const {
    data: clientStats,
    isLoading: isClientStatsLoading,
    error: clientStatsError
  } = api.client.stats.useQuery()

  const {
    data: recentActivity,
    isLoading: isActivityLoading
  } = api.client.recentActivity.useQuery(
    { limit: 5, days: 7 },
    { refetchInterval: 60000 }
  )

  const {
    data: realTimeMetrics,
    isLoading: isRealTimeLoading
  } = api.enhanced.getRealTimeMetrics.useQuery(
    undefined,
    { refetchInterval: 5000 }
  )

  const isLoading = isDashboardLoading || isClientStatsLoading
  const hasError = dashboardError || clientStatsError

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchDashboard(),
      ])
      toast.success('Dashboard refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh dashboard')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Generate KPI data from real data
  const kpiData = React.useMemo(() => {
    if (!dashboardData || !clientStats) return []

    return [
      {
        title: 'Active Clients',
        value: clientStats.totalClients.toString(),
        change: {
          value: formatPercentChange(
            clientStats.totalClients,
            clientStats.previousPeriodClients || clientStats.totalClients
          ).value,
          type: formatPercentChange(
            clientStats.totalClients,
            clientStats.previousPeriodClients || clientStats.totalClients
          ).type,
          period: 'vs last month'
        },
        icon: Users,
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
      {
        title: 'Revenue This Month',
        value: formatCurrency(dashboardData.overview.totalRevenue || 0),
        change: {
          value: dashboardData.overview.revenueGrowth || 0,
          type: (dashboardData.overview.revenueGrowth || 0) >= 0 ? 'increase' as const : 'decrease' as const,
          period: 'vs last month'
        },
        icon: DollarSign,
        iconColor: 'text-green-600 dark:text-green-400',
      },
      {
        title: 'Outstanding Tasks',
        value: (dashboardData.overview.outstandingTasks || 0).toString(),
        change: {
          value: Math.abs(dashboardData.overview.taskCompletionRate || 0),
          type: (dashboardData.overview.taskCompletionRate || 0) >= 0 ? 'decrease' as const : 'increase' as const,
          period: 'vs last week'
        },
        icon: CheckCircle2,
        iconColor: 'text-purple-600 dark:text-purple-400',
      },
      {
        title: 'Upcoming Deadlines',
        value: (dashboardData.overview.upcomingDeadlines || 0).toString(),
        change: {
          value: 2,
          type: 'increase' as const,
          period: 'next 7 days'
        },
        icon: Clock,
        iconColor: 'text-orange-600 dark:text-orange-400',
      },
    ]
  }, [dashboardData, clientStats])

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (hasError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to load dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was an error loading your dashboard data.
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-ring flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's what's happening with your CPA practice.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>

              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-ring flex items-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>

              <motion.button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-ring flex items-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                <span>Quick Add</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <KPICard {...kpi} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Financial Overview Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Title>Revenue Trends</Title>
              <Text>Revenue performance over time</Text>
              {dashboardData?.timeSeriesData && dashboardData.timeSeriesData.length > 0 ? (
                <AreaChart
                  className="h-72 mt-4"
                  data={dashboardData.timeSeriesData}
                  index="period"
                  categories={["revenue", "target"]}
                  colors={["blue", "gray"]}
                  valueFormatter={(value) => formatCurrency(value)}
                  showLegend={true}
                  showGridLines={true}
                />
              ) : (
                <div className="h-72 mt-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No revenue data available</p>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <Title>Client Distribution</Title>
              <Text>Breakdown by business type and status</Text>
              {clientStats?.clientsByBusinessType && clientStats.clientsByBusinessType.length > 0 ? (
                <DonutChart
                  className="h-72 mt-4"
                  data={clientStats.clientsByBusinessType.map((item: any) => ({
                    name: item.businessType || 'Other',
                    value: item.count,
                  }))}
                  category="value"
                  index="name"
                  valueFormatter={(value) => `${value} clients`}
                  colors={["blue", "green", "purple", "orange", "red", "yellow"]}
                  showTooltip={true}
                  showLegend={true}
                />
              ) : (
                <div className="h-72 mt-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No client data available</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </motion.div>

        {/* Performance Metrics and Real-time Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Title>Performance Overview</Title>
              <Text>System performance and response times</Text>
              {realTimeMetrics?.metrics ? (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <Text className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</Text>
                      <Metric className="text-lg font-semibold">
                        {realTimeMetrics.metrics.averageResponseTime || 0}ms
                      </Metric>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <Text className="text-sm text-gray-600 dark:text-gray-400">Success Rate</Text>
                      <Metric className="text-lg font-semibold text-green-600">
                        {((1 - (realTimeMetrics.metrics.errorRate || 0)) * 100).toFixed(1)}%
                      </Metric>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Requests</Text>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <Text className="font-medium">{realTimeMetrics.metrics.activeRequests || 0} requests/min</Text>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 mt-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Performance metrics loading...</p>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <Title>System Alerts</Title>
              <Text>Recent system alerts and notifications</Text>
              {realTimeMetrics?.alerts && realTimeMetrics.alerts.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {realTimeMetrics.alerts.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {alert.message || 'System Alert'}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 mt-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>All systems operational</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </motion.div>

        {/* Client Portfolio Health and Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Title>Client Status Overview</Title>
                    <Text>Quick view of client health and status</Text>
                  </div>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View All Clients
                  </button>
                </div>
                {clientStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-green-800 dark:text-green-200">Active Clients</p>
                          <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                            {clientStats.activeClients || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">Needs Attention</p>
                          <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                            {clientStats.clientsNeedingAttention || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">Total Revenue</p>
                          <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            {formatCurrency(clientStats.totalRevenue || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Loading client data...</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <Title>Recent Activity</Title>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View All
                  </button>
                </div>
                {!isActivityLoading && recentActivity ? (
                  <div className="space-y-3">
                    {[...recentActivity.recentClients, ...recentActivity.recentUpdates]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 5)
                      .map((activity, index) => (
                        <div key={`${activity.id}-${activity.type}`} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                            activity.type === 'created' ? 'bg-green-500' : 'bg-blue-500'
                          )}>
                            {activity.businessName?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {activity.businessName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.type === 'created' ? 'New client added' : 'Client updated'} •
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge
                            status={activity.status as any}
                            size="sm"
                            variant="dot"
                          />
                        </div>
                      ))
                    }
                    {recentActivity.recentClients.length === 0 && recentActivity.recentUpdates.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ActivityFeed activities={mockActivities} maxItems={5} compact />
                )}
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <Title className="mb-6">Quick Actions</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} action={action} />
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}