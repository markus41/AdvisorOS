'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  Upload,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PortalLayout } from '@/components/portal/layout/portal-layout'
import { usePortalAuth } from '@/lib/portal-auth'

interface MetricCardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

function MetricCard({ title, value, description, icon: Icon, trend, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color?: 'blue' | 'green' | 'purple'
}

function QuickAction({ title, description, icon: Icon, href, color = 'blue' }: QuickActionProps) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg text-white ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <a href={href}>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
  type: 'document' | 'payment' | 'message' | 'deadline'
}

function ActivityItem({ title, description, time, type }: ActivityItemProps) {
  const typeConfig = {
    document: { icon: FileText, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    payment: { icon: CreditCard, color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    message: { icon: MessageCircle, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
    deadline: { icon: Clock, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
}

interface DocumentRequestProps {
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  isCompleted?: boolean
}

function DocumentRequest({ title, dueDate, priority, isCompleted = false }: DocumentRequestProps) {
  const priorityColors = {
    high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    low: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Due: {dueDate}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant="secondary" className={priorityColors[priority]}>
          {priority.toUpperCase()}
        </Badge>
        {!isCompleted && (
          <Button size="sm" variant="outline">
            Upload
          </Button>
        )}
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  const { session } = usePortalAuth()

  const metrics = [
    {
      title: 'YTD Revenue',
      value: '$487,500',
      description: 'Year to date revenue',
      icon: DollarSign,
      trend: { value: 12.5, isPositive: true },
      color: 'green' as const
    },
    {
      title: 'YTD Expenses',
      value: '$298,750',
      description: 'Year to date expenses',
      icon: TrendingUp,
      trend: { value: 8.2, isPositive: false },
      color: 'red' as const
    },
    {
      title: 'Tax Liability',
      value: '$47,200',
      description: 'Estimated Q4 2024',
      icon: FileText,
      color: 'yellow' as const
    },
    {
      title: 'Outstanding',
      value: '$12,500',
      description: '3 pending invoices',
      icon: Clock,
      color: 'blue' as const
    }
  ]

  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Share files with your CPA team',
      icon: Upload,
      href: '/portal/documents/upload',
      color: 'blue' as const
    },
    {
      title: 'Make Payment',
      description: 'Pay outstanding invoices',
      icon: CreditCard,
      href: '/portal/invoices/pay',
      color: 'green' as const
    },
    {
      title: 'Send Message',
      description: 'Contact your CPA directly',
      icon: MessageCircle,
      href: '/portal/messages',
      color: 'purple' as const
    }
  ]

  const recentActivity = [
    {
      title: 'Document Uploaded',
      description: 'Bank statements for October 2024',
      time: '2 hours ago',
      type: 'document' as const
    },
    {
      title: 'Payment Received',
      description: 'Invoice #INV-2024-045 paid ($2,500.00)',
      time: '1 day ago',
      type: 'payment' as const
    },
    {
      title: 'New Message',
      description: 'Response to your tax planning question',
      time: '2 days ago',
      type: 'message' as const
    },
    {
      title: 'Deadline Reminder',
      description: 'Q4 estimated tax payment due Dec 15',
      time: '3 days ago',
      type: 'deadline' as const
    }
  ]

  const documentRequests = [
    {
      title: 'Q3 2024 Bank Statements',
      dueDate: 'Nov 15, 2024',
      priority: 'high' as const
    },
    {
      title: '2024 Business Insurance Declarations',
      dueDate: 'Nov 30, 2024',
      priority: 'medium' as const
    },
    {
      title: 'Equipment Purchase Receipts',
      dueDate: 'Dec 1, 2024',
      priority: 'low' as const,
      isCompleted: true
    }
  ]

  return (
    <PortalLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg p-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {session?.name?.split(' ')[0] || 'Client'}!
            </h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening with your account
            </p>
          </motion.div>
        </div>

        {/* Financial Metrics */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <MetricCard {...metric} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <QuickAction {...action} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Requests */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Document Requests</span>
                </CardTitle>
                <CardDescription>
                  Documents requested by your CPA
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3 p-6">
                  {documentRequests.map((request, index) => (
                    <DocumentRequest key={index} {...request} />
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <Button asChild variant="outline" className="w-full">
                    <a href="/portal/documents">
                      View All Documents
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest updates and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentActivity.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <Button asChild variant="outline" className="w-full">
                    <a href="/portal/messages">
                      View All Activity
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Next Deadline Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upcoming Deadline
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Q4 2024 estimated tax payment due on <strong>December 15, 2024</strong>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Estimated amount: $12,500
                  </p>
                </div>
                <Button variant="outline">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PortalLayout>
  )
}