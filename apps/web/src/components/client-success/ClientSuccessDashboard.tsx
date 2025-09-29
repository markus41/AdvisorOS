'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Heart,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Gift,
  Award,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ArrowRight,
  Filter,
  Download,
  Settings,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts'

interface ClientSuccessMetrics {
  portfolioHealth: {
    totalClients: number;
    averageHealthScore: number;
    healthyClients: number;
    atRiskClients: number;
    criticalClients: number;
    improvingClients: number;
    decliningClients: number;
  };
  retentionMetrics: {
    retentionRate: number;
    churnRate: number;
    averageLifespan: number;
    lifetimeValue: number;
    renewalRate: number;
  };
  satisfactionMetrics: {
    averageNPS: number;
    averageSatisfaction: number;
    responseRate: number;
    detractorCount: number;
    promoterCount: number;
  };
  interventionMetrics: {
    activeInterventions: number;
    completedInterventions: number;
    successRate: number;
    averageResolutionTime: number;
  };
  campaignMetrics: {
    activeCampaigns: number;
    totalReach: number;
    averageConversionRate: number;
    totalROI: number;
  };
}

interface ClientAlert {
  id: string;
  clientName: string;
  type: 'health_decline' | 'payment_issue' | 'satisfaction_low' | 'renewal_risk' | 'no_engagement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  daysActive: number;
  assignedTo?: string;
  actions: string[];
}

interface UpcomingAction {
  id: string;
  type: 'call' | 'meeting' | 'email' | 'review' | 'follow_up';
  clientName: string;
  title: string;
  dueDate: Date;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface ClientSuccessDashboardProps {
  organizationId: string;
}

export function ClientSuccessDashboard({ organizationId }: ClientSuccessDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Mock data - in production, this would come from APIs
  const [metrics, setMetrics] = useState<ClientSuccessMetrics>({
    portfolioHealth: {
      totalClients: 127,
      averageHealthScore: 78.5,
      healthyClients: 89,
      atRiskClients: 28,
      criticalClients: 10,
      improvingClients: 45,
      decliningClients: 15,
    },
    retentionMetrics: {
      retentionRate: 92.3,
      churnRate: 7.7,
      averageLifespan: 1095, // days
      lifetimeValue: 45000,
      renewalRate: 87.5,
    },
    satisfactionMetrics: {
      averageNPS: 42,
      averageSatisfaction: 8.2,
      responseRate: 68.5,
      detractorCount: 8,
      promoterCount: 54,
    },
    interventionMetrics: {
      activeInterventions: 15,
      completedInterventions: 89,
      successRate: 73.2,
      averageResolutionTime: 5.8, // days
    },
    campaignMetrics: {
      activeCampaigns: 6,
      totalReach: 245,
      averageConversionRate: 18.5,
      totalROI: 320,
    },
  })

  const [alerts] = useState<ClientAlert[]>([
    {
      id: '1',
      clientName: 'TechFlow Solutions Inc',
      type: 'health_decline',
      severity: 'high',
      message: 'Health score dropped from 85 to 58 over the last 2 weeks',
      daysActive: 14,
      assignedTo: 'Sarah Chen',
      actions: ['Schedule immediate call', 'Review recent interactions', 'Escalate to manager'],
    },
    {
      id: '2',
      clientName: 'Bay Area Real Estate Holdings',
      type: 'payment_issue',
      severity: 'critical',
      message: 'Invoice overdue by 45 days, multiple payment attempts failed',
      daysActive: 45,
      assignedTo: 'Mike Rodriguez',
      actions: ['Collections call', 'Payment plan discussion', 'Legal review'],
    },
    {
      id: '3',
      clientName: 'Green Valley Organic Farms',
      type: 'satisfaction_low',
      severity: 'medium',
      message: 'Latest NPS score: 4/10, mentioned communication issues',
      daysActive: 7,
      assignedTo: 'Lisa Thompson',
      actions: ['Schedule satisfaction call', 'Review communication log', 'Process improvement'],
    },
  ])

  const [upcomingActions] = useState<UpcomingAction[]>([
    {
      id: '1',
      type: 'call',
      clientName: 'Austin Coffee Collective',
      title: 'Quarterly Business Review',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignedTo: 'David Kim',
      priority: 'high',
    },
    {
      id: '2',
      type: 'meeting',
      clientName: 'Hill Country Construction',
      title: 'Renewal Discussion Meeting',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assignedTo: 'Sarah Chen',
      priority: 'urgent',
    },
    {
      id: '3',
      type: 'follow_up',
      clientName: 'Music City Retail',
      title: 'Follow up on feedback survey',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assignedTo: 'Mike Rodriguez',
      priority: 'medium',
    },
  ])

  const healthTrendData = [
    { month: 'Jan', score: 76.2, atRisk: 32, healthy: 85 },
    { month: 'Feb', score: 77.8, atRisk: 28, healthy: 89 },
    { month: 'Mar', score: 78.1, atRisk: 30, healthy: 87 },
    { month: 'Apr', score: 78.5, atRisk: 28, healthy: 89 },
    { month: 'May', score: 77.9, atRisk: 31, healthy: 86 },
    { month: 'Jun', score: 78.5, atRisk: 28, healthy: 89 },
  ]

  const retentionTrendData = [
    { month: 'Jan', retention: 91.2, churn: 8.8, newClients: 12 },
    { month: 'Feb', retention: 92.1, churn: 7.9, newClients: 8 },
    { month: 'Mar', retention: 91.8, churn: 8.2, newClients: 15 },
    { month: 'Apr', retention: 92.3, churn: 7.7, newClients: 11 },
    { month: 'May', retention: 91.9, churn: 8.1, newClients: 9 },
    { month: 'Jun', retention: 92.3, churn: 7.7, newClients: 13 },
  ]

  const satisfactionTrendData = [
    { month: 'Jan', nps: 38, satisfaction: 7.9, responses: 124 },
    { month: 'Feb', nps: 41, satisfaction: 8.1, responses: 118 },
    { month: 'Mar', nps: 39, satisfaction: 8.0, responses: 132 },
    { month: 'Apr', nps: 42, satisfaction: 8.2, responses: 127 },
    { month: 'May', nps: 44, satisfaction: 8.3, responses: 115 },
    { month: 'Jun', nps: 42, satisfaction: 8.2, responses: 129 },
  ]

  const campaignPerformanceData = [
    { campaign: 'At-Risk Retention', sent: 45, opened: 32, clicked: 18, converted: 8, roi: 340 },
    { campaign: 'Win-Back', sent: 28, opened: 15, clicked: 9, converted: 3, roi: 280 },
    { campaign: 'Loyalty Program', sent: 89, opened: 73, clicked: 45, converted: 32, roi: 450 },
    { campaign: 'Referral Incentive', sent: 156, opened: 124, clicked: 67, converted: 23, roi: 520 },
  ]

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastRefresh(new Date())
    setIsLoading(false)
  }

  const getAlertIcon = (type: ClientAlert['type']) => {
    switch (type) {
      case 'health_decline': return <TrendingDown className="w-4 h-4" />
      case 'payment_issue': return <AlertTriangle className="w-4 h-4" />
      case 'satisfaction_low': return <MessageSquare className="w-4 h-4" />
      case 'renewal_risk': return <Clock className="w-4 h-4" />
      case 'no_engagement': return <Activity className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getAlertColor = (severity: ClientAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getActionIcon = (type: UpcomingAction['type']) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />
      case 'meeting': return <Calendar className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'review': return <CheckCircle className="w-4 h-4" />
      case 'follow_up': return <ArrowRight className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: UpcomingAction['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDaysUntil = (date: Date) => {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days < 0) return `${Math.abs(days)} days overdue`
    return `${days} days`
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Client Success Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor client health, satisfaction, and retention metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="smb">Small Business</SelectItem>
                <SelectItem value="high_value">High Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {lastRefresh.toLocaleString()}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio Health</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.portfolioHealth.averageHealthScore}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+2.3% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.retentionMetrics.retentionRate}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+0.8% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average NPS</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.satisfactionMetrics.averageNPS}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+4 from last month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Campaign ROI</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.campaignMetrics.totalROI}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+15% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Monitoring</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Health Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Portfolio Health Trend
                </CardTitle>
                <CardDescription>
                  Average health score and client distribution over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Retention Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Retention & Churn Trends
                </CardTitle>
                <CardDescription>
                  Client retention and churn rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={retentionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="retention"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="churn"
                        stackId="2"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.portfolioHealth.healthyClients}
                </div>
                <div className="text-sm text-gray-600">Healthy Clients</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics.portfolioHealth.atRiskClients}
                </div>
                <div className="text-sm text-gray-600">At Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.portfolioHealth.criticalClients}
                </div>
                <div className="text-sm text-gray-600">Critical</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.interventionMetrics.activeInterventions}
                </div>
                <div className="text-sm text-gray-600">Active Interventions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.campaignMetrics.activeCampaigns}
                </div>
                <div className="text-sm text-gray-600">Active Campaigns</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.satisfactionMetrics.promoterCount}
                </div>
                <div className="text-sm text-gray-600">Promoters</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Monitoring Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Client Health Distribution</CardTitle>
                  <CardDescription>
                    Health score distribution across your client portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Excellent (90-100)</span>
                          <span className="text-sm font-medium">25 clients</span>
                        </div>
                        <Progress value={19.7} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Good (80-89)</span>
                          <span className="text-sm font-medium">45 clients</span>
                        </div>
                        <Progress value={35.4} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Average (70-79)</span>
                          <span className="text-sm font-medium">35 clients</span>
                        </div>
                        <Progress value={27.6} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Poor (60-69)</span>
                          <span className="text-sm font-medium">17 clients</span>
                        </div>
                        <Progress value={13.4} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Health Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Improving</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {metrics.portfolioHealth.improvingClients}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Declining</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {metrics.portfolioHealth.decliningClients}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Stable</span>
                    </div>
                    <span className="font-semibold text-gray-600">
                      {metrics.portfolioHealth.totalClients - metrics.portfolioHealth.improvingClients - metrics.portfolioHealth.decliningClients}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Trends</CardTitle>
                <CardDescription>
                  NPS and satisfaction scores over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={satisfactionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="nps"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        name="NPS Score"
                      />
                      <Line
                        type="monotone"
                        dataKey="satisfaction"
                        stroke="#06B6D4"
                        strokeWidth={2}
                        name="Satisfaction (scaled)"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NPS Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {metrics.satisfactionMetrics.averageNPS}
                    </div>
                    <div className="text-sm text-gray-600">Net Promoter Score</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Promoters (9-10)</span>
                      </div>
                      <span className="font-semibold">{metrics.satisfactionMetrics.promoterCount}</span>
                    </div>
                    <Progress value={42.5} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Passives (7-8)</span>
                      </div>
                      <span className="font-semibold">65</span>
                    </div>
                    <Progress value={51.2} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Detractors (0-6)</span>
                      </div>
                      <span className="font-semibold">{metrics.satisfactionMetrics.detractorCount}</span>
                    </div>
                    <Progress value={6.3} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Intervention Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.interventionMetrics.activeInterventions}
                    </div>
                    <div className="text-sm text-gray-600">Active Interventions</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.interventionMetrics.successRate}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.interventionMetrics.averageResolutionTime}
                    </div>
                    <div className="text-sm text-gray-600">Avg Resolution (days)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Intervention Types & Effectiveness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Health Score Intervention</div>
                        <div className="text-sm text-gray-600">For clients with declining health scores</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">78% Success</div>
                        <div className="text-sm text-gray-500">12 active</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Payment Recovery</div>
                        <div className="text-sm text-gray-600">For overdue payment issues</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">65% Success</div>
                        <div className="text-sm text-gray-500">5 active</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Satisfaction Recovery</div>
                        <div className="text-sm text-gray-600">For low satisfaction scores</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">82% Success</div>
                        <div className="text-sm text-gray-500">8 active</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Performance metrics for active retention campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Campaign</th>
                      <th className="text-right py-3 px-4">Sent</th>
                      <th className="text-right py-3 px-4">Opened</th>
                      <th className="text-right py-3 px-4">Clicked</th>
                      <th className="text-right py-3 px-4">Converted</th>
                      <th className="text-right py-3 px-4">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPerformanceData.map((campaign, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4 font-medium">{campaign.campaign}</td>
                        <td className="text-right py-3 px-4">{campaign.sent}</td>
                        <td className="text-right py-3 px-4">
                          {campaign.opened} ({Math.round((campaign.opened / campaign.sent) * 100)}%)
                        </td>
                        <td className="text-right py-3 px-4">
                          {campaign.clicked} ({Math.round((campaign.clicked / campaign.opened) * 100)}%)
                        </td>
                        <td className="text-right py-3 px-4">
                          {campaign.converted} ({Math.round((campaign.converted / campaign.sent) * 100)}%)
                        </td>
                        <td className="text-right py-3 px-4 text-green-600 font-semibold">
                          {campaign.roi}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts & Actions Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Critical Alerts
                </CardTitle>
                <CardDescription>
                  Clients requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border rounded-lg ${getAlertColor(alert.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{alert.clientName}</h4>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mb-3">{alert.message}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span>Active for {alert.daysActive} days</span>
                            {alert.assignedTo && (
                              <span>Assigned to {alert.assignedTo}</span>
                            )}
                          </div>
                          <div className="mt-3 space-y-1">
                            {alert.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="mr-2 mb-1"
                              >
                                {action}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Actions
                </CardTitle>
                <CardDescription>
                  Scheduled client success activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(action.priority)}`}>
                          {getActionIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{action.title}</h4>
                            <Badge variant="outline">
                              {formatDaysUntil(action.dueDate)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{action.clientName}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Assigned to {action.assignedTo}</span>
                            <span className={`px-2 py-1 rounded ${getPriorityColor(action.priority)}`}>
                              {action.priority} priority
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClientSuccessDashboard