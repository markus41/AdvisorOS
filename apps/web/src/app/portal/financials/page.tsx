'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MetricCardProps {
  title: string
  value: string
  change: {
    value: number
    isPositive: boolean
    period: string
  }
  icon: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

function MetricCard({ title, value, change, icon: Icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
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
            </div>
          </div>
          <div className={`flex items-center space-x-1 text-sm ${
            change.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {change.isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change.value)}%</span>
            <span className="text-gray-500 dark:text-gray-400">vs {change.period}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ReportCardProps {
  title: string
  description: string
  date: string
  type: 'financial' | 'tax' | 'budget'
  downloadUrl: string
}

function ReportCard({ title, description, date, type, downloadUrl }: ReportCardProps) {
  const typeConfig = {
    financial: { icon: BarChart3, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    tax: { icon: PieChart, color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    budget: { icon: TrendingUp, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`p-3 rounded-lg ${config.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {description}
              </p>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FinancialOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState('ytd')

  // Mock data
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$487,500',
      change: { value: 12.5, isPositive: true, period: 'last year' },
      icon: DollarSign,
      color: 'green' as const
    },
    {
      title: 'Total Expenses',
      value: '$298,750',
      change: { value: 8.2, isPositive: false, period: 'last year' },
      icon: TrendingDown,
      color: 'red' as const
    },
    {
      title: 'Net Profit',
      value: '$188,750',
      change: { value: 18.7, isPositive: true, period: 'last year' },
      icon: TrendingUp,
      color: 'green' as const
    },
    {
      title: 'Cash Flow',
      value: '$45,200',
      change: { value: 5.3, isPositive: true, period: 'last month' },
      icon: DollarSign,
      color: 'blue' as const
    }
  ]

  const revenueData = [
    { month: 'Jan', revenue: 35000, expenses: 28000 },
    { month: 'Feb', revenue: 42000, expenses: 31000 },
    { month: 'Mar', revenue: 38000, expenses: 25000 },
    { month: 'Apr', revenue: 52000, expenses: 35000 },
    { month: 'May', revenue: 48000, expenses: 32000 },
    { month: 'Jun', revenue: 55000, expenses: 38000 },
    { month: 'Jul', revenue: 62000, expenses: 42000 },
    { month: 'Aug', revenue: 58000, expenses: 39000 },
    { month: 'Sep', revenue: 65000, expenses: 45000 },
    { month: 'Oct', revenue: 70000, expenses: 48000 }
  ]

  const expenseData = [
    { name: 'Payroll', value: 125000, color: '#3B82F6' },
    { name: 'Rent', value: 48000, color: '#10B981' },
    { name: 'Utilities', value: 18000, color: '#F59E0B' },
    { name: 'Marketing', value: 32000, color: '#EF4444' },
    { name: 'Insurance', value: 24000, color: '#8B5CF6' },
    { name: 'Other', value: 51750, color: '#6B7280' }
  ]

  const yearOverYearData = [
    { period: '2022', revenue: 420000, expenses: 315000 },
    { period: '2023', revenue: 465000, expenses: 348000 },
    { period: '2024 YTD', revenue: 487500, expenses: 298750 }
  ]

  const reports = [
    {
      title: 'Monthly Financial Statement',
      description: 'October 2024 profit & loss statement',
      date: 'Nov 1, 2024',
      type: 'financial' as const,
      downloadUrl: '/reports/october-2024-pnl.pdf'
    },
    {
      title: 'Q3 2024 Tax Summary',
      description: 'Quarterly tax liability and estimated payments',
      date: 'Oct 15, 2024',
      type: 'tax' as const,
      downloadUrl: '/reports/q3-2024-tax-summary.pdf'
    },
    {
      title: '2024 Budget vs Actual',
      description: 'Year-to-date budget performance analysis',
      date: 'Oct 31, 2024',
      type: 'budget' as const,
      downloadUrl: '/reports/2024-budget-vs-actual.pdf'
    }
  ]

  return (
    
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your business performance and financial metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ytd">Year to Date</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Key Metrics</h2>
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

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
            <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
            <TabsTrigger value="comparison">Year Comparison</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Revenue Trends Tab */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses Trend</CardTitle>
                <CardDescription>
                  Monthly revenue and expense trends for 2024
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        stroke="#6B7280"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={12}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `$${value.toLocaleString()}`,
                          name === 'revenue' ? 'Revenue' : 'Expenses'
                        ]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
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
          </TabsContent>

          {/* Expense Breakdown Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of expenses by category (YTD)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                  <CardDescription>
                    Detailed breakdown with amounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenseData.map((expense, index) => (
                      <div key={expense.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: expense.color }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${expense.value.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {((expense.value / expenseData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Year Comparison Tab */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Comparison</CardTitle>
                <CardDescription>
                  Revenue and expense comparison across years
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearOverYearData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis dataKey="period" stroke="#6B7280" fontSize={12} />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={12}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `$${value.toLocaleString()}`,
                          name === 'revenue' ? 'Revenue' : 'Expenses'
                        ]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="revenue" fill="#10B981" name="revenue" />
                      <Bar dataKey="expenses" fill="#EF4444" name="expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Financial Reports
              </h2>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter Reports
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reports.map((report, index) => (
                <motion.div
                  key={report.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ReportCard {...report} />
                </motion.div>
              ))}
            </div>

            {/* Request Custom Report */}
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Need a Custom Report?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Request a custom financial report from your CPA team
                </p>
                <Button>
                  Request Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  )
}