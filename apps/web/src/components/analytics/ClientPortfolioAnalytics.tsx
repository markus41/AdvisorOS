'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'

interface ClientMetrics {
  totalClients: number
  activeClients: number
  newClientsThisMonth: number
  clientGrowthRate: number
  avgClientValue: number
  highRiskClients: number
  clientRetentionRate: number
  monthlyRevenue: number
  revenueGrowthRate: number
  profitMargin: number
}

interface ClientSegment {
  segment: string
  count: number
  revenue: number
  growthRate: number
  color: string
}

interface PredictiveInsight {
  type: 'opportunity' | 'risk' | 'trend'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  actionable: boolean
  recommendedAction?: string
}

interface ClientPortfolioAnalyticsProps {
  dateRange?: string
  clientSegment?: string
  refreshInterval?: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

// Mock data - replace with actual API calls
const mockClientMetrics: ClientMetrics = {
  totalClients: 127,
  activeClients: 115,
  newClientsThisMonth: 8,
  clientGrowthRate: 12.5,
  avgClientValue: 24500,
  highRiskClients: 5,
  clientRetentionRate: 94.2,
  monthlyRevenue: 485000,
  revenueGrowthRate: 15.8,
  profitMargin: 32.4
}

const mockClientSegments: ClientSegment[] = [
  { segment: 'Enterprise', count: 25, revenue: 285000, growthRate: 18.5, color: '#3B82F6' },
  { segment: 'Mid-Market', count: 45, revenue: 145000, growthRate: 12.3, color: '#10B981' },
  { segment: 'Small Business', count: 57, revenue: 55000, growthRate: 8.7, color: '#F59E0B' },
]

const mockPredictiveInsights: PredictiveInsight[] = [
  {
    type: 'opportunity',
    title: 'Expansion Opportunity',
    description: 'Johnson Corp shows 45% revenue growth. Consider offering advisory services.',
    impact: 'high',
    confidence: 87,
    actionable: true,
    recommendedAction: 'Schedule advisory consultation'
  },
  {
    type: 'risk',
    title: 'Client Retention Risk',
    description: 'ABC Manufacturing has reduced service usage by 60% over 3 months.',
    impact: 'high',
    confidence: 92,
    actionable: true,
    recommendedAction: 'Immediate client check-in call'
  },
  {
    type: 'trend',
    title: 'Seasonal Pattern',
    description: 'Tax preparation demand typically increases 300% in Q1.',
    impact: 'medium',
    confidence: 95,
    actionable: true,
    recommendedAction: 'Prepare capacity planning'
  }
]

const mockRevenueData = [
  { month: 'Jan', revenue: 425000, forecast: 450000, previousYear: 385000 },
  { month: 'Feb', revenue: 445000, forecast: 465000, previousYear: 405000 },
  { month: 'Mar', revenue: 465000, forecast: 480000, previousYear: 425000 },
  { month: 'Apr', revenue: 485000, forecast: 495000, previousYear: 445000 },
  { month: 'May', revenue: null, forecast: 510000, previousYear: 465000 },
  { month: 'Jun', revenue: null, forecast: 525000, previousYear: 485000 },
]

const mockClientGrowthData = [
  { month: 'Jan', new: 5, churned: 2, net: 3, total: 119 },
  { month: 'Feb', new: 7, churned: 1, net: 6, total: 125 },
  { month: 'Mar', new: 6, churned: 3, net: 3, total: 128 },
  { month: 'Apr', new: 8, churned: 1, net: 7, total: 135 },
]

export function ClientPortfolioAnalytics({
  dateRange = '12months',
  clientSegment = 'all',
  refreshInterval = 300000 // 5 minutes
}: ClientPortfolioAnalyticsProps) {
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange)
  const [selectedSegment, setSelectedSegment] = useState(clientSegment)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'trend': return <Activity className="w-5 h-5 text-blue-600" />
      default: return <Target className="w-5 h-5 text-gray-600" />
    }
  }

  useEffect(() => {
    const interval = setInterval(refreshData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Client Portfolio Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights and predictive analytics for your client portfolio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
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

          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="midmarket">Mid-Market</SelectItem>
              <SelectItem value="small">Small Business</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Clients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockClientMetrics.totalClients}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      +{mockClientMetrics.clientGrowthRate}%
                    </span>
                    <span className="text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Monthly Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${mockClientMetrics.monthlyRevenue.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      +{mockClientMetrics.revenueGrowthRate}%
                    </span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Client Value
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${mockClientMetrics.avgClientValue.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {mockClientMetrics.clientRetentionRate}%
                    </span>
                    <span className="text-gray-500 ml-1">retention rate</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    High-Risk Clients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockClientMetrics.highRiskClients}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-600 font-medium">
                      {((mockClientMetrics.highRiskClients / mockClientMetrics.totalClients) * 100).toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-1">of portfolio</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="growth">Client Growth</TabsTrigger>
          <TabsTrigger value="segments">Segment Analysis</TabsTrigger>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenue Trends & Forecasting
              </CardTitle>
              <CardDescription>
                Historical revenue data with AI-powered forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        name === 'revenue' ? 'Actual Revenue' :
                        name === 'forecast' ? 'Forecast' : 'Previous Year'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="revenue" />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="#10B981"
                      strokeDasharray="5 5"
                      name="forecast"
                    />
                    <Line
                      type="monotone"
                      dataKey="previousYear"
                      stroke="#6B7280"
                      strokeDasharray="2 2"
                      name="previousYear"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Client Growth Analysis
              </CardTitle>
              <CardDescription>
                Track new client acquisition and retention patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockClientGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="new" fill="#10B981" name="New Clients" />
                    <Bar dataKey="churned" fill="#EF4444" name="Churned" />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Total Clients"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Client Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={mockClientSegments}
                        dataKey="count"
                        nameKey="segment"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {mockClientSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockClientSegments.map((segment, index) => (
                  <div key={segment.segment} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium">{segment.segment}</span>
                      </div>
                      <Badge variant={segment.growthRate > 15 ? 'default' : 'secondary'}>
                        +{segment.growthRate}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Revenue: ${segment.revenue.toLocaleString()}</span>
                        <span>{segment.count} clients</span>
                      </div>
                      <Progress value={(segment.revenue / 485000) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                AI-Powered Predictive Insights
              </CardTitle>
              <CardDescription>
                Machine learning insights to help optimize your client portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPredictiveInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {insight.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getImpactColor(insight.impact)}
                            >
                              {insight.impact} impact
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {insight.confidence}% confidence
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          {insight.description}
                        </p>
                        {insight.actionable && insight.recommendedAction && (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Recommended Action: {insight.recommendedAction}
                            </span>
                            <Button size="sm" variant="outline">
                              Take Action
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  )
}