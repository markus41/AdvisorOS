'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Shield,
  Zap,
  Brain,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts'

// Mock data interfaces
interface FinancialMetric {
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  target?: number
  benchmark?: number
}

interface ForecastData {
  period: string
  actual?: number
  forecast: number
  confidence: number
  scenario: 'optimistic' | 'realistic' | 'pessimistic'
}

interface AnomalyAlert {
  id: string
  type: 'transaction' | 'revenue' | 'expense' | 'behavior'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedAt: Date
  status: 'new' | 'investigating' | 'resolved'
  recommendedAction: string
}

interface RiskIndicator {
  category: string
  score: number
  level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
}

interface FinancialAnalyticsDashboardProps {
  clientId?: string
  view?: 'client' | 'portfolio'
  initialTab?: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']

// Mock data
const mockFinancialMetrics: FinancialMetric[] = [
  { name: 'Monthly Revenue', value: 485000, change: 15.8, trend: 'up', target: 500000, benchmark: 450000 },
  { name: 'Cash Flow', value: 125000, change: 8.2, trend: 'up', target: 130000, benchmark: 115000 },
  { name: 'Client Retention', value: 94.2, change: 2.1, trend: 'up', target: 95, benchmark: 92 },
  { name: 'Profit Margin', value: 32.4, change: -1.2, trend: 'down', target: 35, benchmark: 30 },
]

const mockForecastData: ForecastData[] = [
  { period: 'Oct 2024', actual: 485000, forecast: 495000, confidence: 0.92, scenario: 'realistic' },
  { period: 'Nov 2024', forecast: 510000, confidence: 0.88, scenario: 'realistic' },
  { period: 'Dec 2024', forecast: 535000, confidence: 0.85, scenario: 'realistic' },
  { period: 'Jan 2025', forecast: 425000, confidence: 0.90, scenario: 'realistic' },
  { period: 'Feb 2025', forecast: 445000, confidence: 0.87, scenario: 'realistic' },
  { period: 'Mar 2025', forecast: 580000, confidence: 0.82, scenario: 'realistic' },
]

const mockAnomalies: AnomalyAlert[] = [
  {
    id: '1',
    type: 'transaction',
    severity: 'high',
    description: 'Unusual large transaction detected: $45,000 expense',
    detectedAt: new Date('2024-09-27T14:30:00Z'),
    status: 'new',
    recommendedAction: 'Verify transaction accuracy and purpose'
  },
  {
    id: '2',
    type: 'revenue',
    severity: 'medium',
    description: 'Revenue variance of 18% from forecast detected',
    detectedAt: new Date('2024-09-26T09:15:00Z'),
    status: 'investigating',
    recommendedAction: 'Review revenue recognition and timing'
  },
  {
    id: '3',
    type: 'behavior',
    severity: 'critical',
    description: 'Client payment pattern change detected for ABC Corp',
    detectedAt: new Date('2024-09-25T16:45:00Z'),
    status: 'new',
    recommendedAction: 'Contact client immediately'
  }
]

const mockRiskIndicators: RiskIndicator[] = [
  {
    category: 'Financial Risk',
    score: 0.35,
    level: 'medium',
    factors: [
      { factor: 'Liquidity Risk', impact: 0.4, description: 'Current ratio below target' },
      { factor: 'Profitability Risk', impact: 0.3, description: 'Margin compression trend' }
    ]
  },
  {
    category: 'Operational Risk',
    score: 0.25,
    level: 'low',
    factors: [
      { factor: 'Process Risk', impact: 0.2, description: 'Manual processes present' },
      { factor: 'Technology Risk', impact: 0.3, description: 'Legacy systems in use' }
    ]
  },
  {
    category: 'Compliance Risk',
    score: 0.15,
    level: 'low',
    factors: [
      { factor: 'Regulatory Risk', impact: 0.1, description: 'Good compliance record' },
      { factor: 'Tax Risk', impact: 0.2, description: 'Complex tax situations' }
    ]
  }
]

export function FinancialAnalyticsDashboard({
  clientId,
  view = 'portfolio',
  initialTab = 'overview'
}: FinancialAnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState(initialTab)
  const [dateRange, setDateRange] = useState('12months')
  const [refreshInterval, setRefreshInterval] = useState(300000) // 5 minutes
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showAnomalies, setShowAnomalies] = useState(true)
  const [showForecasts, setShowForecasts] = useState(true)
  const [alertThreshold, setAlertThreshold] = useState('medium')

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'text-red-700'
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      case 'very_low': return 'text-green-700'
      default: return 'text-gray-600'
    }
  }

  useEffect(() => {
    const interval = setInterval(refreshData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Advanced predictive analytics and insights for {view === 'client' ? 'client' : 'portfolio'} financial data
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="12months">12 Months</SelectItem>
              <SelectItem value="24months">24 Months</SelectItem>
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

          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockFinancialMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.name.includes('Revenue') || metric.name.includes('Cash')
                        ? `$${metric.value.toLocaleString()}`
                        : `${metric.value}${metric.name.includes('Margin') || metric.name.includes('Retention') ? '%' : ''}`
                      }
                    </p>
                    <div className="flex items-center space-x-2">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                      <span className="text-sm text-gray-500">vs last period</span>
                    </div>
                    {metric.target && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Target: {metric.target.toLocaleString()}</span>
                          <span>{((metric.value / metric.target) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(metric.value / metric.target) * 100} className="h-1" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Real-time Alerts */}
      {mockAnomalies.length > 0 && showAnomalies && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <CardTitle>Real-time Anomaly Alerts</CardTitle>
                <Badge variant="destructive">{mockAnomalies.filter(a => a.status === 'new').length} New</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-anomalies" className="text-sm">Show Alerts</Label>
                <Switch id="show-anomalies" checked={showAnomalies} onCheckedChange={setShowAnomalies} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAnomalies.slice(0, 3).map((anomaly, index) => (
                <motion.div
                  key={anomaly.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium capitalize">{anomaly.type}</span>
                        <span className="text-xs text-gray-500">
                          {anomaly.detectedAt.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{anomaly.description}</p>
                      <p className="text-xs text-gray-600">
                        Recommended: {anomaly.recommendedAction}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Investigate</Button>
                      <Button size="sm">Resolve</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-2">
            <Eye className="w-4 h-4" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <Shield className="w-4 h-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="gap-2">
            <Target className="w-4 h-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Revenue Trend & Forecast
                </CardTitle>
                <CardDescription>
                  Historical performance with AI-powered predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockForecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value, name) => [
                          `$${Number(value).toLocaleString()}`,
                          name === 'actual' ? 'Actual' : 'Forecast'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="actual" fill="#3B82F6" name="actual" />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#10B981"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        name="forecast"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Risk Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Risk Overview
                </CardTitle>
                <CardDescription>
                  Multi-dimensional risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRiskIndicators.map((risk, index) => (
                    <div key={risk.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{risk.category}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getRiskLevelColor(risk.level)}`}>
                            {risk.level.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {(risk.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={risk.score * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Ratios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Key Performance Ratios
              </CardTitle>
              <CardDescription>
                Financial ratios with industry benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Current Ratio', value: 2.1, benchmark: 1.8, target: 2.0 },
                  { name: 'Debt-to-Equity', value: 0.35, benchmark: 0.45, target: 0.30 },
                  { name: 'ROE', value: 18.5, benchmark: 15.2, target: 20.0 },
                ].map((ratio, index) => (
                  <div key={ratio.name} className="text-center space-y-2">
                    <h4 className="font-medium">{ratio.name}</h4>
                    <div className="text-2xl font-bold">{ratio.value}%</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Benchmark: {ratio.benchmark}%</span>
                        <span>Target: {ratio.target}%</span>
                      </div>
                      <Progress value={(ratio.value / ratio.target) * 100} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Advanced Forecasting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Advanced Financial Forecasting
                </CardTitle>
                <CardDescription>
                  AI-powered predictions with confidence intervals and scenario analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="show-forecasts">Show Forecasts</Label>
                    <Switch id="show-forecasts" checked={showForecasts} onCheckedChange={setShowForecasts} />
                    <Select defaultValue="ensemble">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Forecasting Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arima">ARIMA Model</SelectItem>
                        <SelectItem value="prophet">Prophet Model</SelectItem>
                        <SelectItem value="ensemble">Ensemble Model</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mockForecastData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="actual" fill="#3B82F6" name="Actual Revenue" />
                        <Line type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={3} name="Forecast" />
                        <Area dataKey="confidence" fill="#10B981" fillOpacity={0.1} name="Confidence Band" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seasonal Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Patterns</CardTitle>
                  <CardDescription>Tax season and holiday impact analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { month: 'Jan', factor: 2.5 },
                        { month: 'Feb', factor: 2.8 },
                        { month: 'Mar', factor: 3.2 },
                        { month: 'Apr', factor: 2.9 },
                        { month: 'May', factor: 1.0 },
                        { month: 'Jun', factor: 0.8 },
                        { month: 'Jul', factor: 0.7 },
                        { month: 'Aug', factor: 0.9 },
                        { month: 'Sep', factor: 1.1 },
                        { month: 'Oct', factor: 1.2 },
                        { month: 'Nov', factor: 1.3 },
                        { month: 'Dec', factor: 1.1 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="month" />
                        <PolarRadiusAxis domain={[0, 4]} />
                        <Radar
                          name="Seasonal Factor"
                          dataKey="factor"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Capacity Planning</CardTitle>
                  <CardDescription>Staff and resource requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { period: 'Q1 2025', staff: 15, utilization: 95, demand: 'Peak Tax Season' },
                      { period: 'Q2 2025', staff: 10, utilization: 75, demand: 'Normal Operations' },
                      { period: 'Q3 2025', staff: 8, utilization: 60, demand: 'Summer Slow' },
                      { period: 'Q4 2025', staff: 12, utilization: 85, demand: 'Year-end Planning' },
                    ].map((item, index) => (
                      <div key={item.period} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">{item.period}</div>
                          <div className="text-sm text-gray-600">{item.demand}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.staff} Staff</div>
                          <div className="text-sm text-gray-600">{item.utilization}% Utilization</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Anomaly Detection Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Anomaly Detection Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Detection Sensitivity</Label>
                    <Select value={alertThreshold} onValueChange={setAlertThreshold}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Sensitivity</SelectItem>
                        <SelectItem value="medium">Medium Sensitivity</SelectItem>
                        <SelectItem value="high">High Sensitivity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Anomaly Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Transaction', 'Revenue', 'Expense', 'Behavior'].map(type => (
                        <Badge key={type} variant="outline">{type}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Real-time Monitoring</Label>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Enabled</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anomaly Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Detection Timeline</CardTitle>
                <CardDescription>Real-time detection and investigation status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnomalies.map((anomaly, index) => (
                    <motion.div
                      key={anomaly.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {anomaly.severity}
                          </Badge>
                          <Badge variant="outline">{anomaly.type}</Badge>
                          <span className="text-sm text-gray-500">
                            {anomaly.detectedAt.toLocaleString()}
                          </span>
                        </div>
                        <Badge variant={anomaly.status === 'new' ? 'destructive' : 'secondary'}>
                          {anomaly.status}
                        </Badge>
                      </div>
                      <p className="font-medium">{anomaly.description}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Recommended Action:</strong> {anomaly.recommendedAction}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" variant="outline">Mark as Resolved</Button>
                        <Button size="sm">Investigate</Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Scoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Risk Scoring Matrix
                </CardTitle>
                <CardDescription>
                  Comprehensive risk assessment across multiple dimensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRiskIndicators.map((risk, index) => (
                    <div key={risk.category} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{risk.category}</span>
                        <Badge variant={risk.level === 'high' ? 'destructive' : 'secondary'}>
                          {risk.level.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Progress value={risk.score * 100} className="h-3" />
                      <div className="text-sm text-gray-600">
                        Score: {(risk.score * 100).toFixed(1)}% |
                        Top factors: {risk.factors.slice(0, 2).map(f => f.factor).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Risk Concentration */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Risk Concentration</CardTitle>
                <CardDescription>
                  Diversification analysis and concentration risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Manufacturing', value: 35, risk: 'medium' },
                          { name: 'Technology', value: 25, risk: 'low' },
                          { name: 'Healthcare', value: 20, risk: 'low' },
                          { name: 'Retail', value: 15, risk: 'high' },
                          { name: 'Other', value: 5, risk: 'medium' },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Early Warning Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Early Warning Indicators
              </CardTitle>
              <CardDescription>
                Key metrics that signal potential issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { indicator: 'Current Ratio', value: 2.1, threshold: 1.5, status: 'normal' },
                  { indicator: 'DSO (Days)', value: 45, threshold: 60, status: 'normal' },
                  { indicator: 'Debt Coverage', value: 1.8, threshold: 1.25, status: 'warning' },
                  { indicator: 'Client Concentration', value: 35, threshold: 30, status: 'warning' },
                  { indicator: 'Cash Burn Rate', value: 15000, threshold: 20000, status: 'normal' },
                  { indicator: 'Employee Turnover', value: 12, threshold: 15, status: 'normal' },
                ].map((item, index) => (
                  <div key={item.indicator} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{item.indicator}</span>
                      <Badge variant={item.status === 'warning' ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold">{item.value.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      Threshold: {item.threshold.toLocaleString()}
                    </div>
                    <Progress
                      value={Math.min(100, (item.value / item.threshold) * 100)}
                      className="h-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Benchmark Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Industry Benchmark Comparison
                </CardTitle>
                <CardDescription>
                  Performance vs industry standards and peer groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockFinancialMetrics.map((metric, index) => (
                    <div key={metric.name} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{metric.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {metric.name.includes('Revenue') || metric.name.includes('Cash')
                              ? `$${metric.value.toLocaleString()}`
                              : `${metric.value}%`
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            vs Industry: {metric.benchmark ?
                              ((metric.value / metric.benchmark - 1) * 100).toFixed(1) : 'N/A'
                            }%
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Industry Avg: {metric.benchmark?.toLocaleString()}</span>
                          <span>Target: {metric.target?.toLocaleString()}</span>
                        </div>
                        <div className="relative h-2 bg-gray-200 rounded">
                          <div
                            className="absolute h-2 bg-blue-500 rounded"
                            style={{ width: `${Math.min(100, (metric.value / (metric.target || metric.value)) * 100)}%` }}
                          />
                          {metric.benchmark && (
                            <div
                              className="absolute h-2 w-1 bg-gray-600"
                              style={{ left: `${Math.min(100, (metric.benchmark / (metric.target || metric.value)) * 100)}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Powered Insights & Recommendations
              </CardTitle>
              <CardDescription>
                Machine learning insights for strategic decision making
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Key Insights</h4>
                  {[
                    {
                      type: 'opportunity',
                      title: 'Revenue Growth Opportunity',
                      description: 'Client ABC Corp shows 45% revenue growth potential based on seasonal patterns and industry trends.',
                      confidence: 87,
                      impact: 'high'
                    },
                    {
                      type: 'risk',
                      title: 'Cash Flow Risk Alert',
                      description: 'Projected cash flow shortfall in Q1 2025 due to seasonal payment delays.',
                      confidence: 92,
                      impact: 'medium'
                    },
                    {
                      type: 'efficiency',
                      title: 'Process Optimization',
                      description: 'Automating invoice processing could reduce costs by 15% and improve accuracy.',
                      confidence: 78,
                      impact: 'medium'
                    }
                  ].map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={insight.type === 'risk' ? 'destructive' : 'secondary'}>
                          {insight.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                      <h5 className="font-medium">{insight.title}</h5>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Learn More</Button>
                        <Button size="sm">Take Action</Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Predictive Models</h4>
                  <div className="space-y-3">
                    {[
                      { model: 'Churn Prediction', accuracy: 92, lastUpdate: '2 hours ago' },
                      { model: 'Revenue Forecasting', accuracy: 87, lastUpdate: '1 day ago' },
                      { model: 'Anomaly Detection', accuracy: 94, lastUpdate: '30 minutes ago' },
                      { model: 'Risk Scoring', accuracy: 89, lastUpdate: '6 hours ago' },
                    ].map((model, index) => (
                      <div key={model.model} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{model.model}</span>
                          <span className="text-sm text-green-600">{model.accuracy}% accurate</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Last updated: {model.lastUpdate}
                        </div>
                        <Progress value={model.accuracy} className="h-1 mt-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>Last updated: {lastUpdated.toLocaleString()}</p>
        <p>Powered by advanced machine learning and statistical models</p>
      </div>
    </div>
  )
}