'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Calendar,
  Users,
  Activity,
  Target,
  Zap,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  Radar
} from 'recharts'

interface HealthFactor {
  factor: string
  score: number
  weight: number
  trend: 'up' | 'down' | 'stable'
  description: string
  recommendations: string[]
}

interface ClientHealthData {
  clientId: string
  clientName: string
  overallScore: number
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: HealthFactor[]
  historicalScores: Array<{ month: string; score: number }>
  lastUpdated: string
  nextReview: string
}

interface HealthDistribution {
  grade: string
  count: number
  percentage: number
  color: string
}

interface ClientHealthScoringProps {
  selectedClient?: string
  showOverview?: boolean
}

// Mock health scoring data
const mockClientHealthData: ClientHealthData[] = [
  {
    clientId: '1',
    clientName: 'Johnson Corp',
    overallScore: 87,
    healthGrade: 'A',
    riskLevel: 'low',
    factors: [
      {
        factor: 'Payment History',
        score: 95,
        weight: 25,
        trend: 'stable',
        description: 'Consistently pays invoices on time',
        recommendations: ['Maintain current payment terms']
      },
      {
        factor: 'Revenue Growth',
        score: 85,
        weight: 20,
        trend: 'up',
        description: '18% revenue growth over 12 months',
        recommendations: ['Consider offering additional services', 'Discuss expansion opportunities']
      },
      {
        factor: 'Engagement Level',
        score: 92,
        weight: 15,
        trend: 'up',
        description: 'High interaction with portal and services',
        recommendations: ['Continue current engagement strategy']
      },
      {
        factor: 'Financial Stability',
        score: 78,
        weight: 20,
        trend: 'stable',
        description: 'Stable cash flow with minor fluctuations',
        recommendations: ['Monitor cash flow trends', 'Suggest financial planning review']
      },
      {
        factor: 'Compliance Status',
        score: 88,
        weight: 20,
        trend: 'stable',
        description: 'Good compliance track record',
        recommendations: ['Maintain current compliance procedures']
      }
    ],
    historicalScores: [
      { month: 'Jan', score: 82 },
      { month: 'Feb', score: 84 },
      { month: 'Mar', score: 85 },
      { month: 'Apr', score: 87 },
      { month: 'May', score: 87 },
      { month: 'Jun', score: 87 }
    ],
    lastUpdated: '2024-06-15T10:30:00Z',
    nextReview: '2024-07-15T10:30:00Z'
  },
  {
    clientId: '2',
    clientName: 'ABC Manufacturing',
    overallScore: 45,
    healthGrade: 'D',
    riskLevel: 'critical',
    factors: [
      {
        factor: 'Payment History',
        score: 35,
        weight: 25,
        trend: 'down',
        description: 'Multiple late payments in last 3 months',
        recommendations: ['Immediate payment plan discussion', 'Consider credit terms adjustment']
      },
      {
        factor: 'Revenue Growth',
        score: 25,
        weight: 20,
        trend: 'down',
        description: '15% revenue decline over 6 months',
        recommendations: ['Business restructuring consultation', 'Cash flow analysis']
      },
      {
        factor: 'Engagement Level',
        score: 55,
        weight: 15,
        trend: 'down',
        description: 'Reduced interaction with services',
        recommendations: ['Schedule immediate check-in call', 'Review service utilization']
      },
      {
        factor: 'Financial Stability',
        score: 40,
        weight: 20,
        trend: 'down',
        description: 'Cash flow concerns and debt increase',
        recommendations: ['Financial restructuring review', 'Emergency planning session']
      },
      {
        factor: 'Compliance Status',
        score: 70,
        weight: 20,
        trend: 'stable',
        description: 'Compliance maintained despite other issues',
        recommendations: ['Continue compliance monitoring']
      }
    ],
    historicalScores: [
      { month: 'Jan', score: 72 },
      { month: 'Feb', score: 68 },
      { month: 'Mar', score: 62 },
      { month: 'Apr', score: 55 },
      { month: 'May', score: 48 },
      { month: 'Jun', score: 45 }
    ],
    lastUpdated: '2024-06-15T10:30:00Z',
    nextReview: '2024-06-22T10:30:00Z'
  }
]

const healthDistribution: HealthDistribution[] = [
  { grade: 'A (90-100)', count: 25, percentage: 19.7, color: '#10B981' },
  { grade: 'B (80-89)', count: 45, percentage: 35.4, color: '#3B82F6' },
  { grade: 'C (70-79)', count: 35, percentage: 27.6, color: '#F59E0B' },
  { grade: 'D (60-69)', count: 17, percentage: 13.4, color: '#F97316' },
  { grade: 'F (0-59)', count: 5, percentage: 3.9, color: '#EF4444' }
]

export function ClientHealthScoring({
  selectedClient,
  showOverview = true
}: ClientHealthScoringProps) {
  const [selectedClientData, setSelectedClientData] = useState<ClientHealthData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedClient) {
      const clientData = mockClientHealthData.find(c => c.clientId === selectedClient)
      setSelectedClientData(clientData || null)
    }
  }, [selectedClient])

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 60) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getHealthBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 dark:bg-green-900/20'
    if (score >= 80) return 'bg-blue-50 dark:bg-blue-900/20'
    if (score >= 70) return 'bg-yellow-50 dark:bg-yellow-900/20'
    if (score >= 60) return 'bg-orange-50 dark:bg-orange-900/20'
    return 'bg-red-50 dark:bg-red-900/20'
  }

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'default'
      case 'medium': return 'secondary'
      case 'high': return 'destructive'
      case 'critical': return 'destructive'
      default: return 'secondary'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable': return <Activity className="w-4 h-4 text-gray-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  if (showOverview) {
    return (
      <div className="space-y-6">
        {/* Portfolio Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Portfolio Health Overview
            </CardTitle>
            <CardDescription>
              Distribution of client health scores across your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Distribution Chart */}
              <div className="space-y-4">
                <h4 className="font-semibold">Health Grade Distribution</h4>
                <div className="space-y-3">
                  {healthDistribution.map((grade, index) => (
                    <div key={grade.grade} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{grade.grade}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{grade.count} clients</span>
                          <span className="text-sm font-medium">{grade.percentage}%</span>
                        </div>
                      </div>
                      <Progress
                        value={grade.percentage}
                        className="h-2"
                        style={{
                          // @ts-ignore
                          '--progress-background': grade.color
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="space-y-4">
                <h4 className="font-semibold">Key Health Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Healthy Clients</p>
                        <p className="text-xl font-bold text-green-600">70</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">At Risk</p>
                        <p className="text-xl font-bold text-red-600">22</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                        <p className="text-xl font-bold text-blue-600">78.5</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Reviews Due</p>
                        <p className="text-xl font-bold text-yellow-600">12</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Attention Needed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Clients Requiring Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockClientHealthData
                .filter(client => client.riskLevel === 'critical' || client.overallScore < 60)
                .map((client, index) => (
                  <motion.div
                    key={client.clientId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getHealthBgColor(client.overallScore)}`}>
                        <span className={getHealthColor(client.overallScore)}>
                          {client.overallScore}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {client.clientName}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRiskBadgeVariant(client.riskLevel)}>
                            {client.riskLevel} risk
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Grade {client.healthGrade}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last updated: {new Date(client.lastUpdated).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-red-600">
                        Review due: {new Date(client.nextReview).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedClientData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a Client
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a client to view their detailed health scoring analysis
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Client Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {selectedClientData.clientName} Health Score
            </div>
            <Badge variant={getRiskBadgeVariant(selectedClientData.riskLevel)}>
              {selectedClientData.riskLevel} risk
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Display */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold ${getHealthBgColor(selectedClientData.overallScore)}`}>
                <span className={getHealthColor(selectedClientData.overallScore)}>
                  {selectedClientData.overallScore}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  Grade {selectedClientData.healthGrade}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Overall Health Score
                </p>
              </div>
            </div>

            {/* Health Trend */}
            <div>
              <h4 className="font-semibold mb-4">Health Score Trend</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedClientData.historicalScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Factors Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Health Factors Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of factors contributing to the overall health score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {selectedClientData.factors.map((factor, index) => (
              <motion.div
                key={factor.factor}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{factor.factor}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{factor.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(factor.trend)}
                    <span className="font-semibold">{factor.score}/100</span>
                    <span className="text-sm text-gray-500">({factor.weight}% weight)</span>
                  </div>
                </div>

                <Progress value={factor.score} className="h-3" />

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {factor.description}
                </div>

                {factor.recommendations.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Recommendations:
                    </h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      {factor.recommendations.map((rec, recIndex) => (
                        <li key={recIndex} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Health Factors Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={selectedClientData.factors}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}