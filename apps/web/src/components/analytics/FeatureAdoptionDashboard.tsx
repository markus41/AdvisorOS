'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  MousePointer,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  Settings,
  Lightbulb,
  ArrowRight,
  ArrowDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'

interface FeatureAdoptionData {
  featureId: string
  featureName: string
  category: string
  adoptionRate: number
  activeUsers: number
  totalUsers: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  timeToFirstValue: number
  retentionRate: number
  satisfactionScore: number
  lastUpdated: string
}

interface AdoptionFunnelData {
  stage: string
  users: number
  percentage: number
  dropOff: number
  color: string
}

interface UserJourneyData {
  stage: string
  users: number
  averageTime: number
  successRate: number
  commonActions: string[]
  barriers: string[]
}

interface FeatureRecommendation {
  featureId: string
  featureName: string
  reason: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  priority: number
}

const mockFeatureData: FeatureAdoptionData[] = [
  {
    featureId: 'client-management',
    featureName: 'Client Management',
    category: 'Core',
    adoptionRate: 89,
    activeUsers: 445,
    totalUsers: 500,
    trend: 'up',
    trendPercentage: 12,
    timeToFirstValue: 15,
    retentionRate: 92,
    satisfactionScore: 4.6,
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    featureId: 'document-processing',
    featureName: 'Document Processing',
    category: 'Core',
    adoptionRate: 76,
    activeUsers: 380,
    totalUsers: 500,
    trend: 'up',
    trendPercentage: 8,
    timeToFirstValue: 25,
    retentionRate: 84,
    satisfactionScore: 4.3,
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    featureId: 'ai-insights',
    featureName: 'AI Insights',
    category: 'Advanced',
    adoptionRate: 34,
    activeUsers: 170,
    totalUsers: 500,
    trend: 'up',
    trendPercentage: 22,
    timeToFirstValue: 45,
    retentionRate: 68,
    satisfactionScore: 4.1,
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    featureId: 'workflow-automation',
    featureName: 'Workflow Automation',
    category: 'Advanced',
    adoptionRate: 28,
    activeUsers: 140,
    totalUsers: 500,
    trend: 'stable',
    trendPercentage: 2,
    timeToFirstValue: 120,
    retentionRate: 45,
    satisfactionScore: 3.8,
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    featureId: 'quickbooks-sync',
    featureName: 'QuickBooks Sync',
    category: 'Integration',
    adoptionRate: 52,
    activeUsers: 260,
    totalUsers: 500,
    trend: 'up',
    trendPercentage: 15,
    timeToFirstValue: 60,
    retentionRate: 78,
    satisfactionScore: 4.2,
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    featureId: 'advanced-reporting',
    featureName: 'Advanced Reporting',
    category: 'Analytics',
    adoptionRate: 19,
    activeUsers: 95,
    totalUsers: 500,
    trend: 'down',
    trendPercentage: -5,
    timeToFirstValue: 180,
    retentionRate: 35,
    satisfactionScore: 3.4,
    lastUpdated: '2024-01-15T10:30:00Z'
  }
]

const mockFunnelData: AdoptionFunnelData[] = [
  { stage: 'Discovery', users: 500, percentage: 100, dropOff: 0, color: '#8884d8' },
  { stage: 'First View', users: 425, percentage: 85, dropOff: 15, color: '#82ca9d' },
  { stage: 'Trial Usage', users: 320, percentage: 64, dropOff: 21, color: '#ffc658' },
  { stage: 'Regular Use', users: 240, percentage: 48, dropOff: 16, color: '#ff7300' },
  { stage: 'Mastery', users: 180, percentage: 36, dropOff: 12, color: '#00ff00' }
]

const mockJourneyData: UserJourneyData[] = [
  {
    stage: 'Onboarding',
    users: 500,
    averageTime: 45,
    successRate: 85,
    commonActions: ['Account setup', 'Profile completion', 'First login'],
    barriers: ['Complex setup process', 'Too many required fields']
  },
  {
    stage: 'Feature Discovery',
    users: 425,
    averageTime: 180,
    successRate: 75,
    commonActions: ['Dashboard exploration', 'Menu navigation', 'Feature tooltips'],
    barriers: ['Feature overload', 'Unclear navigation', 'Missing guidance']
  },
  {
    stage: 'First Value',
    users: 320,
    averageTime: 360,
    successRate: 65,
    commonActions: ['First task completion', 'Data import', 'Report generation'],
    barriers: ['Steep learning curve', 'Integration issues', 'Performance problems']
  },
  {
    stage: 'Habit Formation',
    users: 240,
    averageTime: 2160,
    successRate: 55,
    commonActions: ['Daily usage', 'Workflow creation', 'Team collaboration'],
    barriers: ['Workflow complexity', 'Change resistance', 'Training needs']
  }
]

const mockRecommendations: FeatureRecommendation[] = [
  {
    featureId: 'advanced-reporting',
    featureName: 'Advanced Reporting',
    reason: 'Low adoption rate with high potential impact',
    confidence: 0.85,
    impact: 'high',
    effort: 'medium',
    priority: 1
  },
  {
    featureId: 'workflow-automation',
    featureName: 'Workflow Automation',
    reason: 'Poor retention suggests usability issues',
    confidence: 0.78,
    impact: 'high',
    effort: 'high',
    priority: 2
  },
  {
    featureId: 'ai-insights',
    featureName: 'AI Insights',
    reason: 'Growing adoption but needs better onboarding',
    confidence: 0.72,
    impact: 'medium',
    effort: 'low',
    priority: 3
  }
]

const timeSeriesData = [
  { month: 'Jan', clientMgmt: 82, docProcessing: 68, aiInsights: 12, workflowAuto: 8 },
  { month: 'Feb', clientMgmt: 84, docProcessing: 71, aiInsights: 16, workflowAuto: 12 },
  { month: 'Mar', clientMgmt: 86, docProcessing: 73, aiInsights: 20, workflowAuto: 15 },
  { month: 'Apr', clientMgmt: 87, docProcessing: 74, aiInsights: 25, workflowAuto: 18 },
  { month: 'May', clientMgmt: 88, docProcessing: 75, aiInsights: 30, workflowAuto: 22 },
  { month: 'Jun', clientMgmt: 89, docProcessing: 76, aiInsights: 34, workflowAuto: 28 }
]

export function FeatureAdoptionDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <RefreshCw className="w-4 h-4 text-gray-600" />
    }
  }

  const getAdoptionColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600'
    if (rate >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getEffortBadgeColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'default'
    }
  }

  const filteredFeatures = mockFeatureData.filter(feature =>
    selectedCategory === 'all' || feature.category.toLowerCase() === selectedCategory
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Feature Adoption Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track feature usage, user journeys, and optimization opportunities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="core">Core</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnels">Adoption Funnels</TabsTrigger>
          <TabsTrigger value="journeys">User Journeys</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Adoption Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">56%</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+8% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Features</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">of 18 total features</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time to Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">74m</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">-15m improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">4.2</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">out of 5.0</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Adoption Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Feature Adoption Trends
              </CardTitle>
              <CardDescription>
                Adoption rates over time for key features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="clientMgmt"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Client Management"
                    />
                    <Line
                      type="monotone"
                      dataKey="docProcessing"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="Document Processing"
                    />
                    <Line
                      type="monotone"
                      dataKey="aiInsights"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      name="AI Insights"
                    />
                    <Line
                      type="monotone"
                      dataKey="workflowAuto"
                      stroke="#EF4444"
                      strokeWidth={3}
                      name="Workflow Automation"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Feature Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Feature Performance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.featureId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => setSelectedFeature(feature.featureId)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {feature.featureName}
                        </h4>
                        <Badge variant="outline">{feature.category}</Badge>
                        {getTrendIcon(feature.trend)}
                      </div>
                      <div className="flex items-center gap-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{feature.activeUsers} / {feature.totalUsers} users</span>
                        <span>TTv: {feature.timeToFirstValue}m</span>
                        <span>Retention: {feature.retentionRate}%</span>
                        <span>Rating: {feature.satisfactionScore}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getAdoptionColor(feature.adoptionRate)}`}>
                          {feature.adoptionRate}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.trend === 'up' ? '+' : feature.trend === 'down' ? '-' : ''}
                          {feature.trendPercentage}%
                        </p>
                      </div>
                      <Progress value={feature.adoptionRate} className="w-24" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adoption Funnels Tab */}
        <TabsContent value="funnels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Feature Adoption Funnel
              </CardTitle>
              <CardDescription>
                User progression through adoption stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {mockFunnelData.map((stage, index) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stage.stage}</span>
                          {index > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              -{stage.dropOff}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{stage.users} users</span>
                          <span className="text-sm text-gray-600 ml-2">({stage.percentage}%)</span>
                        </div>
                      </div>
                      <Progress value={stage.percentage} className="h-4" />
                    </div>
                  ))}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel
                        data={mockFunnelData}
                        dataKey="users"
                        fill="#8884d8"
                      >
                        <LabelList position="center" fill="#fff" stroke="none" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Journeys Tab */}
        <TabsContent value="journeys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Journey Analysis
              </CardTitle>
              <CardDescription>
                Understanding user progression and barriers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockJourneyData.map((stage, index) => (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="font-bold text-blue-600">{index + 1}</span>
                        </div>
                        {index < mockJourneyData.length - 1 && (
                          <ArrowDown className="w-6 h-6 text-gray-400 mt-4" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {stage.stage}
                            </h3>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {stage.users} users
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {Math.floor(stage.averageTime / 60)}h {stage.averageTime % 60}m avg
                              </span>
                              <Badge variant={stage.successRate >= 70 ? 'default' : 'destructive'}>
                                {stage.successRate}% success
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                Common Actions
                              </h4>
                              <ul className="space-y-1">
                                {stage.commonActions.map((action, actionIndex) => (
                                  <li
                                    key={actionIndex}
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                Key Barriers
                              </h4>
                              <ul className="space-y-1">
                                {stage.barriers.map((barrier, barrierIndex) => (
                                  <li
                                    key={barrierIndex}
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                  >
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    {barrier}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered suggestions to improve feature adoption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecommendations.map((rec, index) => (
                  <motion.div
                    key={rec.featureId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {rec.featureName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {rec.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getImpactBadgeColor(rec.impact)}>
                          {rec.impact} impact
                        </Badge>
                        <Badge variant={getEffortBadgeColor(rec.effort)}>
                          {rec.effort} effort
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                          <span className="font-medium ml-1">
                            {Math.round(rec.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                          <span className="font-medium ml-1">#{rec.priority}</span>
                        </div>
                      </div>
                      <Button size="sm">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  A/B Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Onboarding Flow Optimization</h4>
                      <Badge variant="default">Winner</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Control</p>
                        <p className="font-semibold">45% completion</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Variant A</p>
                        <p className="font-semibold text-green-600">62% completion</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">+38% improvement, 95% confidence</p>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Feature Discovery Tour</h4>
                      <Badge variant="secondary">Running</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Control</p>
                        <p className="font-semibold">28% feature usage</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Variant B</p>
                        <p className="font-semibold">34% feature usage</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">+21% improvement, 78% confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Optimization Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Review Feature Visibility
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MousePointer className="w-4 h-4 mr-2" />
                    Optimize User Flows
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Onboarding
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Segment Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}