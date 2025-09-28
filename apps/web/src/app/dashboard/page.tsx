'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KPICard } from '@/components/ui/kpi-card'
import { ActivityFeed, mockActivities } from '@/components/ui/activity-feed'
import { StatusBadge } from '@/components/ui/status-badge'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { cn } from '@/lib/utils'

// Mock data for the dashboard
const kpiData = [
  {
    title: 'Active Clients',
    value: '124',
    change: { value: 12, type: 'increase' as const, period: 'vs last month' },
    icon: Users,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Revenue This Month',
    value: '$47,392',
    change: { value: 8.5, type: 'increase' as const, period: 'vs last month' },
    icon: DollarSign,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Outstanding Tasks',
    value: '23',
    change: { value: 15, type: 'decrease' as const, period: 'vs last week' },
    icon: CheckCircle2,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Upcoming Deadlines',
    value: '8',
    change: { value: 2, type: 'increase' as const, period: 'next 7 days' },
    icon: Clock,
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
]

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
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
              <Title>Monthly Recurring Revenue</Title>
              <Text>Revenue trend compared to targets</Text>
              <AreaChart
                className="h-72 mt-4"
                data={revenueData}
                index="month"
                categories={["Revenue", "Target"]}
                colors={["blue", "gray"]}
                valueFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                showLegend={true}
                showGridLines={true}
              />
            </Card>

            <Card>
              <Title>Client Distribution by Service</Title>
              <Text>Breakdown of clients by service type</Text>
              <DonutChart
                className="h-72 mt-4"
                data={clientServiceData}
                category="value"
                index="name"
                valueFormatter={(value) => `${value}%`}
                colors={["blue", "green", "purple", "orange"]}
                showTooltip={true}
                showLegend={true}
              />
            </Card>
          </div>
        </motion.div>

        {/* Task Completion and Team Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Title>Task Completion Rate</Title>
              <Text>Monthly task completion percentage</Text>
              <BarChart
                className="h-72 mt-4"
                data={taskCompletionData}
                index="name"
                categories={["Completion Rate"]}
                colors={["blue"]}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
                showGridLines={true}
              />
            </Card>

            <Card>
              <Title>Team Utilization</Title>
              <Text>Current team member utilization rates</Text>
              <div className="mt-6 space-y-4">
                {teamUtilization.map((member) => (
                  <div key={member.name}>
                    <Flex className="mb-2">
                      <Text className="font-medium">{member.name}</Text>
                      <Text>{member.utilization}%</Text>
                    </Flex>
                    <ProgressBar
                      value={member.utilization}
                      color={member.utilization >= 90 ? "red" : member.utilization >= 80 ? "yellow" : "green"}
                      className="mb-1"
                    />
                    <Text className="text-xs text-gray-500">{member.role}</Text>
                  </div>
                ))}
              </div>
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
                    <Title>Client Portfolio Health</Title>
                    <Text>Overview of client status and health indicators</Text>
                  </div>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View All Clients
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientPortfolio.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
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
                <ActivityFeed activities={mockActivities} maxItems={5} compact />
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