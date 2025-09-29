'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Eye,
  MousePointer,
  Download,
  Upload,
  MessageCircle,
  CreditCard,
  Star,
  Trophy,
  Filter,
  Calendar,
  RefreshCw,
  Share,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Gauge,
  Percent,
  DollarSign,
  FileText,
  UserCheck,
  Timer,
  Layers,
  Split,
  FlowChart,
  Lightbulb,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ConversionEvent {
  id: string
  userId: string
  sessionId: string
  eventType: 'page_view' | 'button_click' | 'form_submit' | 'download' | 'upload' | 'task_complete' | 'message_sent' | 'payment_made'
  eventName: string
  path: string
  timestamp: string
  properties: Record<string, any>
  value?: number
  currency?: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  userAgent: string
  referrer?: string
  duration?: number
}

interface ConversionFunnel {
  id: string
  name: string
  description: string
  steps: FunnelStep[]
  goalEvent: string
  conversionRate: number
  totalUsers: number
  completedUsers: number
  averageTime: number
  dropOffPoints: string[]
}

interface FunnelStep {
  id: string
  name: string
  eventType: string
  description: string
  users: number
  conversionRate: number
  dropOffRate: number
  averageTime: number
  commonExitPaths: string[]
}

interface UserJourney {
  userId: string
  sessionId: string
  startTime: string
  endTime: string
  events: ConversionEvent[]
  totalDuration: number
  pagesViewed: number
  tasksCompleted: number
  conversionValue: number
  deviceType: 'mobile' | 'tablet' | 'desktop'
  userType: 'new' | 'returning'
  completed: boolean
}

interface ConversionMetrics {
  overview: {
    totalSessions: number
    uniqueUsers: number
    conversionRate: number
    averageSessionDuration: number
    bounceRate: number
    pageViews: number
  }
  funnels: ConversionFunnel[]
  topPages: Array<{
    path: string
    views: number
    uniqueViews: number
    averageTime: number
    exitRate: number
  }>
  deviceBreakdown: Array<{
    type: 'mobile' | 'tablet' | 'desktop'
    sessions: number
    conversionRate: number
    averageTime: number
  }>
  goalCompletions: Array<{
    goal: string
    completions: number
    conversionRate: number
    value: number
  }>
}

interface ConversionTrackerProps {
  userId?: string
  dateRange?: { from: Date; to: Date }
  realTimeUpdates?: boolean
  className?: string
}

// Mock data for demonstration
const mockFunnels: ConversionFunnel[] = [
  {
    id: 'onboarding',
    name: 'Client Onboarding',
    description: 'From portal invitation to first task completion',
    steps: [
      {
        id: 'invite_received',
        name: 'Invitation Received',
        eventType: 'page_view',
        description: 'User receives and opens invitation email',
        users: 150,
        conversionRate: 100,
        dropOffRate: 0,
        averageTime: 0,
        commonExitPaths: []
      },
      {
        id: 'portal_signup',
        name: 'Portal Signup',
        eventType: 'form_submit',
        description: 'User completes registration form',
        users: 127,
        conversionRate: 84.7,
        dropOffRate: 15.3,
        averageTime: 180,
        commonExitPaths: ['/auth/register', '/auth/signin']
      },
      {
        id: 'onboarding_started',
        name: 'Onboarding Started',
        eventType: 'page_view',
        description: 'User begins onboarding wizard',
        users: 118,
        conversionRate: 92.9,
        dropOffRate: 7.1,
        averageTime: 45,
        commonExitPaths: ['/portal/dashboard']
      },
      {
        id: 'profile_completed',
        name: 'Profile Completed',
        eventType: 'form_submit',
        description: 'User completes profile setup',
        users: 103,
        conversionRate: 87.3,
        dropOffRate: 12.7,
        averageTime: 300,
        commonExitPaths: ['/portal/onboarding/step-2']
      },
      {
        id: 'first_task_completed',
        name: 'First Task Completed',
        eventType: 'task_complete',
        description: 'User completes their first task',
        users: 89,
        conversionRate: 86.4,
        dropOffRate: 13.6,
        averageTime: 420,
        commonExitPaths: ['/portal/tasks', '/portal/documents']
      }
    ],
    goalEvent: 'first_task_completed',
    conversionRate: 59.3,
    totalUsers: 150,
    completedUsers: 89,
    averageTime: 945,
    dropOffPoints: ['portal_signup', 'profile_completed']
  },
  {
    id: 'document_upload',
    name: 'Document Upload Flow',
    description: 'From upload initiation to successful submission',
    steps: [
      {
        id: 'upload_initiated',
        name: 'Upload Started',
        eventType: 'button_click',
        description: 'User clicks upload document button',
        users: 234,
        conversionRate: 100,
        dropOffRate: 0,
        averageTime: 0,
        commonExitPaths: []
      },
      {
        id: 'file_selected',
        name: 'File Selected',
        eventType: 'form_submit',
        description: 'User selects file to upload',
        users: 198,
        conversionRate: 84.6,
        dropOffRate: 15.4,
        averageTime: 60,
        commonExitPaths: ['/portal/documents/upload']
      },
      {
        id: 'metadata_added',
        name: 'Metadata Added',
        eventType: 'form_submit',
        description: 'User adds document category and tags',
        users: 176,
        conversionRate: 88.9,
        dropOffRate: 11.1,
        averageTime: 120,
        commonExitPaths: ['/portal/documents/upload']
      },
      {
        id: 'upload_completed',
        name: 'Upload Completed',
        eventType: 'upload',
        description: 'Document successfully uploaded',
        users: 164,
        conversionRate: 93.2,
        dropOffRate: 6.8,
        averageTime: 90,
        commonExitPaths: []
      }
    ],
    goalEvent: 'upload_completed',
    conversionRate: 70.1,
    totalUsers: 234,
    completedUsers: 164,
    averageTime: 270,
    dropOffPoints: ['file_selected']
  },
  {
    id: 'payment_flow',
    name: 'Payment Completion',
    description: 'From invoice view to payment confirmation',
    steps: [
      {
        id: 'invoice_viewed',
        name: 'Invoice Viewed',
        eventType: 'page_view',
        description: 'User views invoice details',
        users: 89,
        conversionRate: 100,
        dropOffRate: 0,
        averageTime: 0,
        commonExitPaths: []
      },
      {
        id: 'payment_initiated',
        name: 'Payment Started',
        eventType: 'button_click',
        description: 'User clicks pay now button',
        users: 76,
        conversionRate: 85.4,
        dropOffRate: 14.6,
        averageTime: 45,
        commonExitPaths: ['/portal/invoices']
      },
      {
        id: 'payment_details_entered',
        name: 'Payment Details',
        eventType: 'form_submit',
        description: 'User enters payment information',
        users: 68,
        conversionRate: 89.5,
        dropOffRate: 10.5,
        averageTime: 180,
        commonExitPaths: ['/portal/pay/form']
      },
      {
        id: 'payment_completed',
        name: 'Payment Completed',
        eventType: 'payment_made',
        description: 'Payment successfully processed',
        users: 64,
        conversionRate: 94.1,
        dropOffRate: 5.9,
        averageTime: 30,
        commonExitPaths: []
      }
    ],
    goalEvent: 'payment_completed',
    conversionRate: 71.9,
    totalUsers: 89,
    completedUsers: 64,
    averageTime: 255,
    dropOffPoints: ['payment_initiated']
  }
]

const mockMetrics: ConversionMetrics = {
  overview: {
    totalSessions: 1247,
    uniqueUsers: 892,
    conversionRate: 67.8,
    averageSessionDuration: 420,
    bounceRate: 23.4,
    pageViews: 5634
  },
  funnels: mockFunnels,
  topPages: [
    { path: '/portal/dashboard', views: 1247, uniqueViews: 892, averageTime: 180, exitRate: 15.2 },
    { path: '/portal/documents', views: 876, uniqueViews: 654, averageTime: 240, exitRate: 18.7 },
    { path: '/portal/tasks', views: 743, uniqueViews: 567, averageTime: 300, exitRate: 12.3 },
    { path: '/portal/messages', views: 567, uniqueViews: 423, averageTime: 150, exitRate: 22.1 },
    { path: '/portal/onboarding', views: 234, uniqueViews: 234, averageTime: 480, exitRate: 28.5 }
  ],
  deviceBreakdown: [
    { type: 'desktop', sessions: 687, conversionRate: 72.1, averageTime: 480 },
    { type: 'mobile', sessions: 423, conversionRate: 61.5, averageTime: 320 },
    { type: 'tablet', sessions: 137, conversionRate: 68.9, averageTime: 390 }
  ],
  goalCompletions: [
    { goal: 'Task Completion', completions: 456, conversionRate: 51.2, value: 1250 },
    { goal: 'Document Upload', completions: 234, conversionRate: 26.2, value: 890 },
    { goal: 'Payment Made', completions: 89, conversionRate: 10.0, value: 15600 },
    { goal: 'Message Sent', completions: 345, conversionRate: 38.7, value: 720 }
  ]
}

function MetricCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  description,
  onClick
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description?: string
  onClick?: () => void
}) {
  return (
    <Card className={cn("transition-all hover:shadow-md", onClick && "cursor-pointer")} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {change && (
              <div className={cn(
                "flex items-center mt-1 text-sm",
                changeType === 'positive' && "text-green-600 dark:text-green-400",
                changeType === 'negative' && "text-red-600 dark:text-red-400",
                changeType === 'neutral' && "text-gray-600 dark:text-gray-400"
              )}>
                {changeType === 'positive' && <ArrowUpRight className="w-4 h-4 mr-1" />}
                {changeType === 'negative' && <ArrowDownRight className="w-4 h-4 mr-1" />}
                <span>{change}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FunnelVisualization({ funnel }: { funnel: ConversionFunnel }) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlowChart className="w-5 h-5" />
              {funnel.name}
            </CardTitle>
            <CardDescription>{funnel.description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-lg">
            {funnel.conversionRate}% conversion
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel.steps.map((step, index) => {
            const isLast = index === funnel.steps.length - 1
            const isSelected = selectedStep === step.id
            const stepWidth = (step.users / funnel.totalUsers) * 100

            return (
              <div key={step.id} className="space-y-2">
                <div
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                  onClick={() => setSelectedStep(isSelected ? null : step.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{step.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{step.users}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">users</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${stepWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <span>{step.conversionRate}% conversion</span>
                      <span>{step.dropOffRate}% drop-off</span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Time</p>
                            <p className="text-lg text-gray-900 dark:text-white">
                              {Math.floor(step.averageTime / 60)}m {step.averageTime % 60}s
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop-off Rate</p>
                            <p className="text-lg text-red-600 dark:text-red-400">{step.dropOffRate}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Type</p>
                            <Badge variant="secondary">{step.eventType}</Badge>
                          </div>
                        </div>

                        {step.commonExitPaths.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Common Exit Paths
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {step.commonExitPaths.map((path, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {path}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Connection line */}
                {!isLast && (
                  <div className="flex justify-center">
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Funnel summary */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{funnel.totalUsers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{funnel.completedUsers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{funnel.conversionRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Time</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {Math.floor(funnel.averageTime / 60)}m {funnel.averageTime % 60}s
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DeviceBreakdown({ devices }: { devices: ConversionMetrics['deviceBreakdown'] }) {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      case 'desktop': return Monitor
      default: return Monitor
    }
  }

  const totalSessions = devices.reduce((sum, device) => sum + device.sessions, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Device Breakdown
        </CardTitle>
        <CardDescription>Conversion rates by device type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devices.map(device => {
            const Icon = getDeviceIcon(device.type)
            const percentage = (device.sessions / totalSessions) * 100

            return (
              <div key={device.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {device.type}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {device.sessions} sessions ({percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {device.conversionRate}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.floor(device.averageTime / 60)}m avg
                    </p>
                  </div>
                </div>
                <Progress value={device.conversionRate} className="h-2" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function TopPagesTable({ pages }: { pages: ConversionMetrics['topPages'] }) {
  const [sortBy, setSortBy] = useState<'views' | 'uniqueViews' | 'averageTime' | 'exitRate'>('views')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedPages = [...pages].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Top Pages
        </CardTitle>
        <CardDescription>Most visited pages and their performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Page</th>
                <th
                  className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                  onClick={() => handleSort('views')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Views</span>
                    {sortBy === 'views' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                  onClick={() => handleSort('uniqueViews')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Unique</span>
                    {sortBy === 'uniqueViews' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                  onClick={() => handleSort('averageTime')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Avg Time</span>
                    {sortBy === 'averageTime' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                  onClick={() => handleSort('exitRate')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Exit Rate</span>
                    {sortBy === 'exitRate' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPages.map((page, index) => (
                <tr key={page.path} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                        {page.path}
                      </span>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-2 text-right font-medium">{page.views.toLocaleString()}</td>
                  <td className="p-2 text-right text-gray-600 dark:text-gray-400">
                    {page.uniqueViews.toLocaleString()}
                  </td>
                  <td className="p-2 text-right text-gray-600 dark:text-gray-400">
                    {Math.floor(page.averageTime / 60)}m {page.averageTime % 60}s
                  </td>
                  <td className="p-2 text-right">
                    <Badge variant={page.exitRate > 25 ? 'destructive' : page.exitRate > 15 ? 'secondary' : 'default'}>
                      {page.exitRate}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function GoalCompletions({ goals }: { goals: ConversionMetrics['goalCompletions'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Goal Completions
        </CardTitle>
        <CardDescription>Key conversion goals and their performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map(goal => (
            <div key={goal.goal} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{goal.goal}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {goal.completions} completions • ${goal.value.toLocaleString()} value
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {goal.conversionRate}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">conversion</p>
                </div>
              </div>
              <Progress value={goal.conversionRate} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function InsightsPanel({ metrics }: { metrics: ConversionMetrics }) {
  const insights = [
    {
      type: 'opportunity',
      title: 'Mobile Conversion Gap',
      description: 'Mobile users have 10.6% lower conversion rate than desktop. Consider mobile-specific optimizations.',
      impact: 'High',
      action: 'Optimize mobile UX',
      icon: Smartphone
    },
    {
      type: 'success',
      title: 'Payment Flow Performing Well',
      description: 'Payment completion rate (71.9%) exceeds industry average by 15%.',
      impact: 'Positive',
      action: 'Apply learnings to other funnels',
      icon: CreditCard
    },
    {
      type: 'warning',
      title: 'Onboarding Drop-off',
      description: 'Profile completion step shows 12.7% drop-off. Review form complexity.',
      impact: 'Medium',
      action: 'Simplify profile form',
      icon: UserCheck
    },
    {
      type: 'info',
      title: 'Document Upload Trend',
      description: 'Upload completion rates improving 8% month-over-month.',
      impact: 'Positive',
      action: 'Continue current approach',
      icon: Upload
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          AI Insights & Recommendations
        </CardTitle>
        <CardDescription>Automated analysis of your conversion data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    insight.type === 'opportunity' && "bg-blue-100 dark:bg-blue-900/20",
                    insight.type === 'success' && "bg-green-100 dark:bg-green-900/20",
                    insight.type === 'warning' && "bg-yellow-100 dark:bg-yellow-900/20",
                    insight.type === 'info' && "bg-purple-100 dark:bg-purple-900/20"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      insight.type === 'opportunity' && "text-blue-600 dark:text-blue-400",
                      insight.type === 'success' && "text-green-600 dark:text-green-400",
                      insight.type === 'warning' && "text-yellow-600 dark:text-yellow-400",
                      insight.type === 'info' && "text-purple-600 dark:text-purple-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{insight.title}</h4>
                      <Badge variant={
                        insight.impact === 'High' ? 'destructive' :
                        insight.impact === 'Medium' ? 'secondary' :
                        insight.impact === 'Positive' ? 'default' : 'outline'
                      }>
                        {insight.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {insight.description}
                    </p>
                    <Button variant="outline" size="sm">
                      {insight.action}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ConversionTracker({
  userId,
  dateRange,
  realTimeUpdates = false,
  className
}: ConversionTrackerProps) {
  const [metrics, setMetrics] = useState<ConversionMetrics>(mockMetrics)
  const [selectedFunnel, setSelectedFunnel] = useState<string>(mockFunnels[0].id)
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(realTimeUpdates)
  const refreshInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        // Simulate data updates
        setMetrics(prev => ({
          ...prev,
          overview: {
            ...prev.overview,
            totalSessions: prev.overview.totalSessions + Math.floor(Math.random() * 5),
            uniqueUsers: prev.overview.uniqueUsers + Math.floor(Math.random() * 3)
          }
        }))
      }, 30000) // Update every 30 seconds

      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current)
        }
      }
    }
  }, [autoRefresh])

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const selectedFunnelData = metrics.funnels.find(f => f.id === selectedFunnel) || metrics.funnels[0]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track user journeys and optimize conversion funnels
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="auto-refresh" className="text-sm">Real-time</Label>
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Enable real-time updates every 30 seconds
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sessions"
          value={metrics.overview.totalSessions.toLocaleString()}
          change="+12.5%"
          changeType="positive"
          icon={Users}
          description="vs last month"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.overview.conversionRate}%`}
          change="+2.1%"
          changeType="positive"
          icon={Target}
          description="Overall conversion"
        />
        <MetricCard
          title="Avg Session Duration"
          value={`${Math.floor(metrics.overview.averageSessionDuration / 60)}m ${metrics.overview.averageSessionDuration % 60}s`}
          change="+8.3%"
          changeType="positive"
          icon={Clock}
          description="Time on platform"
        />
        <MetricCard
          title="Bounce Rate"
          value={`${metrics.overview.bounceRate}%`}
          change="-3.2%"
          changeType="positive"
          icon={TrendingDown}
          description="Single page visits"
        />
      </div>

      <Tabs defaultValue="funnels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="funnels">Conversion Funnels</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="devices">Device Analytics</TabsTrigger>
          <TabsTrigger value="goals">Goal Tracking</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="funnels" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Conversion Funnels</h2>
            <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.funnels.map(funnel => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name} ({funnel.conversionRate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FunnelVisualization funnel={selectedFunnelData} />

          {/* Funnel comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Funnel Performance Comparison</CardTitle>
              <CardDescription>Compare conversion rates across all funnels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.funnels.map(funnel => (
                  <div key={funnel.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{funnel.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {funnel.completedUsers} / {funnel.totalUsers} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {funnel.conversionRate}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.floor(funnel.averageTime / 60)}m avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <TopPagesTable pages={metrics.topPages} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeviceBreakdown devices={metrics.deviceBreakdown} />

            <Card>
              <CardHeader>
                <CardTitle>Device Performance Insights</CardTitle>
                <CardDescription>Key findings by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Desktop Performance</h4>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Desktop users show the highest conversion rate (72.1%) and spend the most time on platform.
                      They're most likely to complete complex tasks like payments and document uploads.
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">Mobile Opportunity</h4>
                    </div>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Mobile conversion rate (61.5%) has room for improvement. Consider implementing
                      mobile-specific optimizations like simplified forms and touch-friendly interfaces.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tablet className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h4 className="font-medium text-green-900 dark:text-green-100">Tablet Sweet Spot</h4>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Tablet users achieve good conversion rates (68.9%) with moderate session times.
                      They represent a balanced middle ground between mobile and desktop behaviors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <GoalCompletions goals={metrics.goalCompletions} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsPanel metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}