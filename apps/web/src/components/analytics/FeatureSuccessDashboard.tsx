'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Settings,
  Lightbulb,
  Flag,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  Download,
  Play,
  Pause,
  Eye,
  MessageSquare,
  Star,
  X,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface FeatureHealthMetric {
  featureId: string
  featureName: string
  category: string
  healthScore: number
  status: 'healthy' | 'warning' | 'critical' | 'failing'
  metrics: {
    adoptionRate: number
    retentionRate: number
    satisfactionScore: number
    timeToValue: number
    errorRate: number
    supportTickets: number
  }
  trends: {
    adoptionTrend: number
    retentionTrend: number
    satisfactionTrend: number
  }
  lastUpdated: string
}

interface OptimizationOpportunity {
  id: string
  featureId: string
  type: 'adoption' | 'retention' | 'satisfaction' | 'performance' | 'discovery'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  effort: 'low' | 'medium' | 'high'
  priority: number
  estimatedImpact: string
  actionItems: string[]
  status: 'identified' | 'planned' | 'in_progress' | 'testing' | 'completed'
  assignee?: string
  dueDate?: string
  confidence: number
}

interface ABTestStatus {
  testId: string
  featureId: string
  testName: string
  status: 'running' | 'completed' | 'paused'
  participants: number
  conversionRate: number
  significance: number
  winner?: string
  startDate: string
  endDate?: string
  variants: Array<{
    name: string
    participants: number
    conversionRate: number
    isWinner: boolean
  }>
}

interface FeatureFlag {
  id: string
  name: string
  featureId: string
  description: string
  isEnabled: boolean
  rolloutPercentage: number
  targetSegments: string[]
  conditions: Record<string, any>
  createdAt: string
  expiresAt?: string
}

interface SuccessGoal {
  id: string
  featureId: string
  metric: string
  target: number
  current: number
  progress: number
  deadline: string
  priority: 'low' | 'medium' | 'high'
  status: 'on_track' | 'at_risk' | 'behind'
}

const mockHealthMetrics: FeatureHealthMetric[] = [
  {
    featureId: 'client-management',
    featureName: 'Client Management',
    category: 'Core',
    healthScore: 92,
    status: 'healthy',
    metrics: {
      adoptionRate: 89,
      retentionRate: 94,
      satisfactionScore: 4.6,
      timeToValue: 15,
      errorRate: 0.8,
      supportTickets: 2
    },
    trends: {
      adoptionTrend: 5,
      retentionTrend: 2,
      satisfactionTrend: 8
    },
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    featureId: 'ai-insights',
    featureName: 'AI Insights',
    category: 'Advanced',
    healthScore: 67,
    status: 'warning',
    metrics: {
      adoptionRate: 34,
      retentionRate: 68,
      satisfactionScore: 4.1,
      timeToValue: 45,
      errorRate: 2.1,
      supportTickets: 12
    },
    trends: {
      adoptionTrend: 22,
      retentionTrend: -5,
      satisfactionTrend: 15
    },
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    featureId: 'advanced-reporting',
    featureName: 'Advanced Reporting',
    category: 'Analytics',
    healthScore: 45,
    status: 'critical',
    metrics: {
      adoptionRate: 19,
      retentionRate: 35,
      satisfactionScore: 3.4,
      timeToValue: 180,
      errorRate: 4.2,
      supportTickets: 28
    },
    trends: {
      adoptionTrend: -5,
      retentionTrend: -12,
      satisfactionTrend: -8
    },
    lastUpdated: '2024-01-15T10:30:00Z'
  }
]

const mockOptimizations: OptimizationOpportunity[] = [
  {
    id: 'opt-1',
    featureId: 'advanced-reporting',
    type: 'adoption',
    title: 'Improve Advanced Reporting Discovery',
    description: 'Low adoption rate suggests users are not discovering or understanding the value of advanced reporting features.',
    impact: 'high',
    effort: 'medium',
    priority: 1,
    estimatedImpact: '+15% adoption rate increase',
    actionItems: [
      'Add contextual tooltips to report builder',
      'Create guided tour for report creation',
      'Implement smart report templates',
      'Add value demonstration popup'
    ],
    status: 'planned',
    assignee: 'Product Team',
    dueDate: '2024-02-15',
    confidence: 0.82
  },
  {
    id: 'opt-2',
    featureId: 'ai-insights',
    type: 'retention',
    title: 'Enhance AI Insights Onboarding',
    description: 'Good initial adoption but poor retention suggests onboarding issues.',
    impact: 'medium',
    effort: 'low',
    priority: 2,
    estimatedImpact: '+12% retention improvement',
    actionItems: [
      'Simplify insights interpretation',
      'Add explanation tooltips',
      'Create actionable recommendations',
      'Implement progress tracking'
    ],
    status: 'in_progress',
    assignee: 'UX Team',
    dueDate: '2024-01-30',
    confidence: 0.75
  }
]

const mockABTests: ABTestStatus[] = [
  {
    testId: 'test-1',
    featureId: 'advanced-reporting',
    testName: 'Report Builder Onboarding',
    status: 'running',
    participants: 2400,
    conversionRate: 23.5,
    significance: 0.89,
    startDate: '2024-01-01',
    variants: [
      { name: 'Control', participants: 1200, conversionRate: 19.2, isWinner: false },
      { name: 'Guided Tour', participants: 1200, conversionRate: 27.8, isWinner: true }
    ]
  },
  {
    testId: 'test-2',
    featureId: 'ai-insights',
    testName: 'Smart Recommendations UI',
    status: 'completed',
    participants: 1800,
    conversionRate: 41.2,
    significance: 0.95,
    winner: 'Variant B',
    startDate: '2023-12-15',
    endDate: '2024-01-10',
    variants: [
      { name: 'Control', participants: 600, conversionRate: 34.1, isWinner: false },
      { name: 'Variant A', participants: 600, conversionRate: 38.7, isWinner: false },
      { name: 'Variant B', participants: 600, conversionRate: 50.8, isWinner: true }
    ]
  }
]

const mockFeatureFlags: FeatureFlag[] = [
  {
    id: 'flag-1',
    name: 'Enhanced Document Processing',
    featureId: 'document-processing',
    description: 'New ML-powered document extraction capabilities',
    isEnabled: true,
    rolloutPercentage: 25,
    targetSegments: ['power_users', 'enterprise_users'],
    conditions: {},
    createdAt: '2024-01-10T00:00:00Z',
    expiresAt: '2024-02-10T00:00:00Z'
  },
  {
    id: 'flag-2',
    name: 'Simplified Workflow Builder',
    featureId: 'workflow-automation',
    description: 'Streamlined workflow creation interface',
    isEnabled: true,
    rolloutPercentage: 50,
    targetSegments: ['new_users', 'small_firms'],
    conditions: {},
    createdAt: '2024-01-05T00:00:00Z'
  }
]

const mockSuccessGoals: SuccessGoal[] = [
  {
    id: 'goal-1',
    featureId: 'advanced-reporting',
    metric: 'Adoption Rate',
    target: 35,
    current: 19,
    progress: 54,
    deadline: '2024-03-31',
    priority: 'high',
    status: 'behind'
  },
  {
    id: 'goal-2',
    featureId: 'ai-insights',
    metric: 'User Satisfaction',
    target: 4.5,
    current: 4.1,
    progress: 91,
    deadline: '2024-02-28',
    priority: 'medium',
    status: 'on_track'
  }
]

const healthScoreData = [
  { month: 'Jan', clientMgmt: 90, aiInsights: 45, reporting: 38, workflows: 52 },
  { month: 'Feb', clientMgmt: 91, aiInsights: 52, reporting: 42, workflows: 48 },
  { month: 'Mar', clientMgmt: 92, aiInsights: 58, reporting: 44, workflows: 51 },
  { month: 'Apr', clientMgmt: 92, aiInsights: 63, reporting: 43, workflows: 55 },
  { month: 'May', clientMgmt: 92, aiInsights: 65, reporting: 46, workflows: 58 },
  { month: 'Jun', clientMgmt: 92, aiInsights: 67, reporting: 45, workflows: 62 }
]

export function FeatureSuccessDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false)
  const [optimizationFilters, setOptimizationFilters] = useState({
    status: 'all',
    impact: 'all',
    type: 'all'
  })

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-orange-600'
      case 'failing': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'critical': return 'destructive'
      case 'failing': return 'destructive'
      default: return 'outline'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-600'
      case 'at_risk': return 'text-yellow-600'
      case 'behind': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (trend < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return <RefreshCw className="w-4 h-4 text-gray-600" />
  }

  const filteredOptimizations = mockOptimizations.filter(opt => {
    if (optimizationFilters.status !== 'all' && opt.status !== optimizationFilters.status) return false
    if (optimizationFilters.impact !== 'all' && opt.impact !== optimizationFilters.impact) return false
    if (optimizationFilters.type !== 'all' && opt.type !== optimizationFilters.type) return false
    return true
  })

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Feature Success Optimization
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor feature health, track optimization efforts, and drive adoption success
            </p>
          </div>
          <div className="flex items-center gap-4">
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
            <Button onClick={() => setShowOptimizationDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Optimization
            </Button>
          </div>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="health">Health Monitor</TabsTrigger>
            <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
            <TabsTrigger value="experiments">A/B Tests</TabsTrigger>
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="goals">Success Goals</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          {/* Health Monitor Tab */}
          <TabsContent value="health" className="space-y-6">
            {/* Overall Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overall Health Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">76</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600">+3 from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Healthy Features</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-600">of 12 total features</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-red-600">Require immediate attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Optimizations</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <Settings className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-600">In progress</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Health Score Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Feature Health Trends
                </CardTitle>
                <CardDescription>
                  Track health score changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={healthScoreData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="clientMgmt"
                        stroke="#10B981"
                        strokeWidth={3}
                        name="Client Management"
                      />
                      <Line
                        type="monotone"
                        dataKey="aiInsights"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="AI Insights"
                      />
                      <Line
                        type="monotone"
                        dataKey="reporting"
                        stroke="#EF4444"
                        strokeWidth={3}
                        name="Advanced Reporting"
                      />
                      <Line
                        type="monotone"
                        dataKey="workflows"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        name="Workflows"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Feature Health Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Feature Health Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockHealthMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.featureId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {metric.featureName}
                          </h3>
                          <Badge variant="outline">{metric.category}</Badge>
                          <Badge variant={getHealthStatusBadge(metric.status)}>
                            {metric.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${getHealthStatusColor(metric.status)}`}>
                            {metric.healthScore}
                          </span>
                          <span className="text-gray-500">/100</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Adoption</p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-semibold">{metric.metrics.adoptionRate}%</span>
                            {getTrendIcon(metric.trends.adoptionTrend)}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Retention</p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-semibold">{metric.metrics.retentionRate}%</span>
                            {getTrendIcon(metric.trends.retentionTrend)}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Satisfaction</p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-semibold">{metric.metrics.satisfactionScore}</span>
                            {getTrendIcon(metric.trends.satisfactionTrend)}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Time to Value</p>
                          <span className="font-semibold">{metric.metrics.timeToValue}m</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Error Rate</p>
                          <span className="font-semibold">{metric.metrics.errorRate}%</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Support Tickets</p>
                          <span className="font-semibold">{metric.metrics.supportTickets}</span>
                        </div>
                      </div>

                      <Progress value={metric.healthScore} className="h-2" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimizations Tab */}
          <TabsContent value="optimizations" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Optimization Opportunities
              </h2>
              <div className="flex items-center gap-4">
                <Select
                  value={optimizationFilters.status}
                  onValueChange={(value) => setOptimizationFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={optimizationFilters.impact}
                  onValueChange={(value) => setOptimizationFilters(prev => ({ ...prev, impact: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Impact</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredOptimizations.map((optimization, index) => (
                <motion.div
                  key={optimization.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {optimization.title}
                        </h3>
                        <Badge variant="outline">{optimization.type}</Badge>
                        <Badge variant={optimization.impact === 'high' ? 'destructive' : 'secondary'}>
                          {optimization.impact} impact
                        </Badge>
                        <Badge variant="outline">{optimization.effort} effort</Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {optimization.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Priority: #{optimization.priority}</span>
                        <span>Confidence: {Math.round(optimization.confidence * 100)}%</span>
                        <span>Estimated Impact: {optimization.estimatedImpact}</span>
                        {optimization.assignee && <span>Assignee: {optimization.assignee}</span>}
                        {optimization.dueDate && <span>Due: {optimization.dueDate}</span>}
                      </div>
                    </div>
                    <Badge variant={optimization.status === 'completed' ? 'default' : 'secondary'}>
                      {optimization.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">Action Items:</h4>
                    <ul className="space-y-1">
                      {optimization.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* A/B Tests Tab */}
          <TabsContent value="experiments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                A/B Test Results
              </h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Test
              </Button>
            </div>

            <div className="space-y-4">
              {mockABTests.map((test, index) => (
                <motion.div
                  key={test.testId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {test.testName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Feature: {test.featureId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                        {test.status}
                      </Badge>
                      {test.significance >= 0.95 && (
                        <Badge variant="default">
                          <Star className="w-3 h-3 mr-1" />
                          Significant
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Participants</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {test.participants.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {test.conversionRate}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Significance</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {Math.round(test.significance * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {test.variants.map((variant, variantIndex) => (
                      <div
                        key={variantIndex}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          variant.isWinner ? 'bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{variant.name}</span>
                          {variant.isWinner && (
                            <Badge variant="default">
                              <Star className="w-3 h-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{variant.participants} participants</span>
                          <span className="font-semibold">{variant.conversionRate}% conversion</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="flags" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Feature Flags
              </h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Flag
              </Button>
            </div>

            <div className="space-y-4">
              {mockFeatureFlags.map((flag, index) => (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {flag.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {flag.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={flag.isEnabled} />
                      <Badge variant={flag.isEnabled ? 'default' : 'secondary'}>
                        {flag.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rollout</p>
                      <div className="flex items-center gap-2">
                        <Progress value={flag.rolloutPercentage} className="flex-1" />
                        <span className="text-sm font-medium">{flag.rolloutPercentage}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target Segments</p>
                      <div className="flex flex-wrap gap-1">
                        {flag.targetSegments.map((segment, segIndex) => (
                          <Badge key={segIndex} variant="outline" className="text-xs">
                            {segment.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created</p>
                      <p className="text-sm">{new Date(flag.createdAt).toLocaleDateString()}</p>
                      {flag.expiresAt && (
                        <p className="text-xs text-red-600">
                          Expires: {new Date(flag.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Success Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Success Goals
              </h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockSuccessGoals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{goal.metric}</CardTitle>
                        <Badge variant={goal.status === 'on_track' ? 'default' : 'destructive'}>
                          {goal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription>
                        Feature: {goal.featureId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-semibold">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-3" />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Current</p>
                            <p className="font-semibold text-lg">{goal.current}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Target</p>
                            <p className="font-semibold text-lg">{goal.target}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Deadline: {goal.deadline}
                          </span>
                          <Badge variant="outline">{goal.priority} priority</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Intelligent recommendations based on feature performance analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Advanced Reporting Opportunity
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          Users who create basic reports have a 73% likelihood of adopting advanced reporting
                          within 30 days if properly onboarded. Consider triggering guided tours after 3+ basic reports.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">
                          Segment-Specific Pattern
                        </h4>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                          Small firms show 40% higher AI Insights adoption when introduced through workflow automation.
                          Consider bundling these features in onboarding flows.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                          Timing Optimization
                        </h4>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                          Feature discovery rates are 2.3x higher on Tuesdays and Wednesdays between 10-11 AM.
                          Schedule spotlight campaigns and new feature announcements during this window.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Optimization Creation Dialog */}
        <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Optimization</DialogTitle>
              <DialogDescription>
                Define a new optimization opportunity for feature improvement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feature">Feature</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select feature" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advanced-reporting">Advanced Reporting</SelectItem>
                      <SelectItem value="ai-insights">AI Insights</SelectItem>
                      <SelectItem value="workflow-automation">Workflow Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Optimization Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adoption">Adoption</SelectItem>
                      <SelectItem value="retention">Retention</SelectItem>
                      <SelectItem value="satisfaction">Satisfaction</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input placeholder="Optimization title" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea placeholder="Describe the optimization opportunity..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="impact">Impact</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="effort">Effort</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select effort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOptimizationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowOptimizationDialog(false)}>
                  Create Optimization
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}