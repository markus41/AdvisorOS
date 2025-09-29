'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Zap,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientPortfolioAnalytics } from '@/components/analytics/ClientPortfolioAnalytics'
import { ClientHealthScoring } from '@/components/analytics/ClientHealthScoring'
import { useDashboardWebSocket } from '@/hooks/use-websocket'

interface DashboardMetric {
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

interface RecentAlert {
  id: string
  type: 'opportunity' | 'risk' | 'notification'
  title: string
  description: string
  timestamp: string
  clientName: string
  priority: 'high' | 'medium' | 'low'
  actionRequired: boolean
}

const dashboardMetrics: DashboardMetric[] = [
  {
    title: 'Portfolio Health Score',
    value: 78.5,
    change: 3.2,
    trend: 'up',
    icon: Target,
    color: 'text-blue-600 dark:text-blue-400',
    description: 'Average health score across all clients'
  },
  {
    title: 'Active Clients',
    value: 127,
    change: 8,
    trend: 'up',
    icon: Users,
    color: 'text-green-600 dark:text-green-400',
    description: 'Currently active client relationships'
  },
  {
    title: 'Monthly Revenue',
    value: '$485k',
    change: 15.8,
    trend: 'up',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400',
    description: 'Total revenue for current month'
  },
  {
    title: 'High-Risk Clients',
    value: 5,
    change: -2,
    trend: 'down',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    description: 'Clients requiring immediate attention'
  },
  {
    title: 'Revenue Growth',
    value: '+12.3%',
    change: 2.1,
    trend: 'up',
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    description: 'Year-over-year revenue growth'
  },
  {
    title: 'Client Retention',
    value: '94.2%',
    change: 1.5,
    trend: 'up',
    icon: Activity,
    color: 'text-indigo-600 dark:text-indigo-400',
    description: 'Client retention rate this year'
  }
]

const recentAlerts: RecentAlert[] = [
  {
    id: '1',
    type: 'risk',
    title: 'Payment Overdue',
    description: 'ABC Manufacturing has an overdue invoice of $12,500',
    timestamp: '2 hours ago',
    clientName: 'ABC Manufacturing',
    priority: 'high',
    actionRequired: true
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Expansion Opportunity',
    description: 'Johnson Corp shows strong growth, consider advisory services',
    timestamp: '4 hours ago',
    clientName: 'Johnson Corp',
    priority: 'medium',
    actionRequired: true
  },
  {
    id: '3',
    type: 'notification',
    title: 'Tax Season Reminder',
    description: 'Q1 tax preparation deadlines approaching',
    timestamp: '1 day ago',
    clientName: 'All Clients',
    priority: 'medium',
    actionRequired: false
  }
]

export default function AdvancedAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('12months')
  const [selectedView, setSelectedView] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const { isConnected, kpiUpdates, activityUpdates } = useDashboardWebSocket()

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedCards(newExpanded)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'notification': return <Activity className="w-5 h-5 text-blue-600" />
      default: return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High</Badge>
      case 'medium': return <Badge variant="default">Medium</Badge>
      case 'low': return <Badge variant="secondary">Low</Badge>
      default: return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />
    if (trend === 'down') return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
    return <Activity className="w-4 h-4 text-gray-600" />
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Advanced Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights and predictive analytics for your CPA practice
          </p>
          {isConnected && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600">Live data updates active</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="12months">12 Months</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {metric.title}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {metric.value}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {getTrendIcon(metric.trend, metric.change)}
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Recent Alerts & Opportunities
          </CardTitle>
          <CardDescription>
            Important notifications requiring your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      {getPriorityBadge(alert.priority)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{alert.clientName}</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
                {alert.actionRequired && (
                  <Button size="sm" variant="outline">
                    Take Action
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="health">Health Scoring</TabsTrigger>
          <TabsTrigger value="analytics">Predictive Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <ClientPortfolioAnalytics
            dateRange={dateRange}
            refreshInterval={300000}
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-6 mt-6">
          <ClientHealthScoring showOverview={true} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Forecasting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Forecasting
                </CardTitle>
                <CardDescription>
                  AI-powered revenue predictions for the next 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Predicted Q3 Revenue
                      </p>
                      <p className="text-xl font-bold text-blue-600">$1.52M</p>
                      <p className="text-sm text-green-600">+18% vs Q2</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence Level
                      </p>
                      <p className="text-xl font-bold text-green-600">87%</p>
                      <p className="text-sm text-gray-500">High accuracy</p>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Key Factors: Tax season preparation services, new client acquisitions,
                      and expanded advisory offerings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Analysis
                </CardTitle>
                <CardDescription>
                  Potential risks and mitigation strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                      High Risk: Client Concentration
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Top 3 clients represent 45% of revenue. Consider diversification.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Medium Risk: Seasonal Dependency
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      60% of revenue from tax season. Expand year-round services.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Low Risk: Technology Infrastructure
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Strong tech foundation with good security practices.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8">
        Dashboard last updated: {new Date().toLocaleString()}
        {isConnected && <span className="ml-2">• Live updates enabled</span>}
      </div>
    </div>
  )
}