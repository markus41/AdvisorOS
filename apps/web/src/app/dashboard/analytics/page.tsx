'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Metric,
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
  ScatterChart,
  Flex,
  Grid,
  DateRangePicker,
  Select,
  SelectItem,
  Badge,
  ProgressBar,
  TabGroup,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
} from '@tremor/react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Target,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KPICard } from '@/components/ui/kpi-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Mock data for analytics
const kpiData = [
  {
    title: 'Total Revenue',
    value: '$2,847,392',
    change: { value: 12.5, type: 'increase' as const, period: 'vs last quarter' },
    icon: DollarSign,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Active Clients',
    value: '347',
    change: { value: 8.2, type: 'increase' as const, period: 'vs last quarter' },
    icon: Users,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Avg. Revenue per Client',
    value: '$8,210',
    change: { value: 3.1, type: 'increase' as const, period: 'vs last quarter' },
    icon: Target,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Project Completion Rate',
    value: '94.8%',
    change: { value: 2.3, type: 'increase' as const, period: 'vs last quarter' },
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
]

const revenueByMonthData = [
  { month: 'Jan', Revenue: 185000, Target: 200000, 'Last Year': 165000 },
  { month: 'Feb', Revenue: 198000, Target: 200000, 'Last Year': 172000 },
  { month: 'Mar', Revenue: 215000, Target: 220000, 'Last Year': 189000 },
  { month: 'Apr', Revenue: 234000, Target: 220000, 'Last Year': 201000 },
  { month: 'May', Revenue: 247000, Target: 240000, 'Last Year': 218000 },
  { month: 'Jun', Revenue: 268000, Target: 240000, 'Last Year': 235000 },
  { month: 'Jul', Revenue: 285000, Target: 260000, 'Last Year': 251000 },
  { month: 'Aug', Revenue: 292000, Target: 260000, 'Last Year': 267000 },
  { month: 'Sep', Revenue: 310000, Target: 280000, 'Last Year': 278000 },
  { month: 'Oct', Revenue: 325000, Target: 280000, 'Last Year': 295000 },
  { month: 'Nov', Revenue: 342000, Target: 300000, 'Last Year': 312000 },
  { month: 'Dec', Revenue: 358000, Target: 300000, 'Last Year': 328000 },
]

const revenueByServiceData = [
  { service: 'Tax Preparation', Q1: 450000, Q2: 520000, Q3: 480000, Q4: 750000 },
  { service: 'Bookkeeping', Q1: 320000, Q2: 345000, Q3: 365000, Q4: 380000 },
  { service: 'Financial Planning', Q1: 180000, Q2: 195000, Q3: 210000, Q4: 225000 },
  { service: 'Payroll Services', Q1: 150000, Q2: 165000, Q3: 175000, Q4: 185000 },
  { service: 'Audit Services', Q1: 280000, Q2: 260000, Q3: 245000, Q4: 290000 },
]

const clientAcquisitionData = [
  { month: 'Jan', 'New Clients': 12, 'Lost Clients': 3, 'Net Growth': 9 },
  { month: 'Feb', 'New Clients': 15, 'Lost Clients': 2, 'Net Growth': 13 },
  { month: 'Mar', 'New Clients': 18, 'Lost Clients': 4, 'Net Growth': 14 },
  { month: 'Apr', 'New Clients': 22, 'Lost Clients': 1, 'Net Growth': 21 },
  { month: 'May', 'New Clients': 19, 'Lost Clients': 3, 'Net Growth': 16 },
  { month: 'Jun', 'New Clients': 25, 'Lost Clients': 2, 'Net Growth': 23 },
]

const clientDistributionData = [
  { name: 'Small Business', value: 45, revenue: 850000 },
  { name: 'Individual', value: 35, revenue: 650000 },
  { name: 'Corporate', value: 15, revenue: 950000 },
  { name: 'Non-Profit', value: 5, revenue: 150000 },
]

const teamPerformanceData = [
  { name: 'Sarah Johnson', 'Billable Hours': 165, 'Revenue Generated': 52500, 'Client Satisfaction': 4.8 },
  { name: 'Mike Wilson', 'Billable Hours': 158, 'Revenue Generated': 47400, 'Client Satisfaction': 4.6 },
  { name: 'Emily Davis', 'Billable Hours': 172, 'Revenue Generated': 48300, 'Client Satisfaction': 4.9 },
  { name: 'John Smith', 'Billable Hours': 145, 'Revenue Generated': 36250, 'Client Satisfaction': 4.4 },
  { name: 'Lisa Brown', 'Billable Hours': 168, 'Revenue Generated': 50400, 'Client Satisfaction': 4.7 },
]

const taskCompletionTrendsData = [
  { week: 'Week 1', 'On Time': 85, 'Late': 15, 'Completion Rate': 92 },
  { week: 'Week 2', 'On Time': 92, 'Late': 8, 'Completion Rate': 96 },
  { week: 'Week 3', 'On Time': 88, 'Late': 12, 'Completion Rate': 94 },
  { week: 'Week 4', 'On Time': 95, 'Late': 5, 'Completion Rate': 98 },
]

const predictiveAnalyticsData = [
  { month: 'Jul', 'Actual': 285000, 'Predicted': 290000, 'Confidence Lower': 275000, 'Confidence Upper': 305000 },
  { month: 'Aug', 'Actual': 292000, 'Predicted': 295000, 'Confidence Lower': 280000, 'Confidence Upper': 310000 },
  { month: 'Sep', 'Actual': 310000, 'Predicted': 308000, 'Confidence Lower': 295000, 'Confidence Upper': 325000 },
  { month: 'Oct', 'Actual': null, 'Predicted': 325000, 'Confidence Lower': 310000, 'Confidence Upper': 340000 },
  { month: 'Nov', 'Actual': null, 'Predicted': 340000, 'Confidence Lower': 325000, 'Confidence Upper': 355000 },
  { month: 'Dec', 'Actual': null, 'Predicted': 365000, 'Confidence Lower': 350000, 'Confidence Upper': 380000 },
]

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period?: string
  }
  icon: React.ComponentType<any>
  className?: string
}

function StatCard({ title, value, change, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </Text>
          <Metric className="text-2xl font-bold mt-2">{value}</Metric>
          {change && (
            <div className="flex items-center mt-2 space-x-2">
              {change.type === 'increase' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <Text className={cn(
                'text-sm font-medium',
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              )}>
                {change.value}%
              </Text>
              {change.period && (
                <Text className="text-sm text-gray-500">{change.period}</Text>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </Card>
  )
}

interface ExportButtonProps {
  onExport: () => void
  isLoading?: boolean
}

function ExportButton({ onExport, isLoading }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onExport}
      disabled={isLoading}
      className="flex items-center space-x-2"
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>Export</span>
    </Button>
  )
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('quarterly')
  const [selectedComparison, setSelectedComparison] = useState('previous-period')
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const handleExport = async () => {
    setIsExporting(true)
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsExporting(false)
    // In real implementation, this would trigger file download
    console.log('Export completed')
  }

  const tabContent = [
    {
      name: 'Overview',
      icon: BarChart3,
    },
    {
      name: 'Revenue',
      icon: DollarSign,
    },
    {
      name: 'Clients',
      icon: Users,
    },
    {
      name: 'Performance',
      icon: Award,
    },
    {
      name: 'Predictions',
      icon: TrendingUp,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive insights into your firm's performance and growth
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </Select>
                <Select value={selectedComparison} onValueChange={setSelectedComparison}>
                  <SelectItem value="previous-period">vs Previous Period</SelectItem>
                  <SelectItem value="previous-year">vs Previous Year</SelectItem>
                  <SelectItem value="target">vs Target</SelectItem>
                </Select>
              </div>
              <ExportButton onExport={handleExport} isLoading={isExporting} />
            </div>
          </div>
        </motion.div>

        {/* KPI Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <KPICard {...kpi} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabbed Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <TabGroup index={activeTab} onIndexChange={setActiveTab}>
              <TabList className="mb-6">
                {tabContent.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Tab key={tab.name} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </Tab>
                  )
                })}
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <Title>Monthly Revenue Trend</Title>
                      <Text>Revenue performance vs targets and previous year</Text>
                      <AreaChart
                        className="h-72 mt-4"
                        data={revenueByMonthData}
                        index="month"
                        categories={["Revenue", "Target", "Last Year"]}
                        colors={["blue", "gray", "green"]}
                        valueFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                        showLegend={true}
                        showGridLines={true}
                      />
                    </Card>

                    <Card>
                      <Title>Client Distribution</Title>
                      <Text>Revenue breakdown by client type</Text>
                      <DonutChart
                        className="h-72 mt-4"
                        data={clientDistributionData}
                        category="value"
                        index="name"
                        valueFormatter={(value) => `${value}%`}
                        colors={["blue", "green", "purple", "orange"]}
                        showTooltip={true}
                        showLegend={true}
                      />
                    </Card>
                  </div>
                </TabPanel>

                {/* Revenue Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <Card>
                      <Title>Revenue by Service Line</Title>
                      <Text>Quarterly revenue breakdown by service offerings</Text>
                      <BarChart
                        className="h-80 mt-4"
                        data={revenueByServiceData}
                        index="service"
                        categories={["Q1", "Q2", "Q3", "Q4"]}
                        colors={["blue", "green", "purple", "orange"]}
                        valueFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                        showLegend={true}
                        showGridLines={true}
                        layout="vertical"
                      />
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <StatCard
                        title="Average Deal Size"
                        value="$23,750"
                        change={{ value: 15.2, type: 'increase', period: 'vs last quarter' }}
                        icon={Target}
                      />
                      <StatCard
                        title="Revenue per Employee"
                        value="$185K"
                        change={{ value: 8.7, type: 'increase', period: 'vs last quarter' }}
                        icon={Users}
                      />
                      <StatCard
                        title="Gross Margin"
                        value="67.8%"
                        change={{ value: 2.1, type: 'increase', period: 'vs last quarter' }}
                        icon={TrendingUp}
                      />
                    </div>
                  </div>
                </TabPanel>

                {/* Clients Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <Card>
                      <Title>Client Acquisition Trends</Title>
                      <Text>New client acquisition vs churn over time</Text>
                      <LineChart
                        className="h-72 mt-4"
                        data={clientAcquisitionData}
                        index="month"
                        categories={["New Clients", "Lost Clients", "Net Growth"]}
                        colors={["green", "red", "blue"]}
                        showLegend={true}
                        showGridLines={true}
                      />
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <Title>Top Clients by Revenue</Title>
                        <Text>Highest revenue generating clients this quarter</Text>
                        <div className="mt-6 space-y-4">
                          {[
                            { name: 'Acme Corporation', revenue: 125000, growth: 12 },
                            { name: 'TechStart Inc.', revenue: 98000, growth: 8 },
                            { name: 'Global Industries', revenue: 87000, growth: -3 },
                            { name: 'Local Retail Co.', revenue: 76000, growth: 15 },
                          ].map((client, index) => (
                            <div key={client.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <Text className="font-medium">{client.name}</Text>
                                  <Text className="text-sm text-gray-500">${client.revenue.toLocaleString()}</Text>
                                </div>
                              </div>
                              <Badge
                                color={client.growth >= 0 ? 'green' : 'red'}
                                size="sm"
                              >
                                {client.growth >= 0 ? '+' : ''}{client.growth}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card>
                        <Title>Client Satisfaction Metrics</Title>
                        <Text>Average satisfaction scores by service type</Text>
                        <div className="mt-6 space-y-4">
                          {[
                            { service: 'Tax Preparation', score: 4.8, responses: 127 },
                            { service: 'Bookkeeping', score: 4.6, responses: 89 },
                            { service: 'Financial Planning', score: 4.9, responses: 56 },
                            { service: 'Audit Services', score: 4.7, responses: 34 },
                          ].map((item) => (
                            <div key={item.service}>
                              <Flex className="mb-2">
                                <Text className="font-medium">{item.service}</Text>
                                <Text>{item.score}/5.0 ({item.responses} responses)</Text>
                              </Flex>
                              <ProgressBar
                                value={(item.score / 5) * 100}
                                color="green"
                                className="mb-1"
                              />
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                </TabPanel>

                {/* Performance Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <Card>
                      <Title>Team Performance Overview</Title>
                      <Text>Individual team member performance metrics</Text>
                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Name</th>
                              <th className="text-right py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Billable Hours</th>
                              <th className="text-right py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Revenue</th>
                              <th className="text-right py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Satisfaction</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamPerformanceData.map((member) => (
                              <tr key={member.name} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-3 px-2">
                                  <Text className="font-medium">{member.name}</Text>
                                </td>
                                <td className="text-right py-3 px-2">
                                  <Text>{member['Billable Hours']}h</Text>
                                </td>
                                <td className="text-right py-3 px-2">
                                  <Text>${member['Revenue Generated'].toLocaleString()}</Text>
                                </td>
                                <td className="text-right py-3 px-2">
                                  <Badge color="green" size="sm">
                                    {member['Client Satisfaction']}/5.0
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <Card>
                      <Title>Task Completion Trends</Title>
                      <Text>Weekly task completion rates and timeliness</Text>
                      <BarChart
                        className="h-72 mt-4"
                        data={taskCompletionTrendsData}
                        index="week"
                        categories={["On Time", "Late"]}
                        colors={["green", "red"]}
                        showLegend={true}
                        showGridLines={true}
                        stack={true}
                      />
                    </Card>
                  </div>
                </TabPanel>

                {/* Predictions Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <Card>
                      <Title>Revenue Predictions</Title>
                      <Text>AI-powered revenue forecasting with confidence intervals</Text>
                      <AreaChart
                        className="h-80 mt-4"
                        data={predictiveAnalyticsData}
                        index="month"
                        categories={["Actual", "Predicted", "Confidence Lower", "Confidence Upper"]}
                        colors={["blue", "green", "gray", "gray"]}
                        valueFormatter={(value) => value ? `$${(value / 1000).toFixed(0)}K` : 'N/A'}
                        showLegend={true}
                        showGridLines={true}
                      />
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <StatCard
                        title="Predicted Q4 Revenue"
                        value="$1.03M"
                        change={{ value: 18.5, type: 'increase', period: 'vs Q4 last year' }}
                        icon={TrendingUp}
                      />
                      <StatCard
                        title="Confidence Level"
                        value="87%"
                        icon={Target}
                      />
                      <StatCard
                        title="Forecast Accuracy"
                        value="94.2%"
                        change={{ value: 1.8, type: 'increase', period: 'vs last quarter' }}
                        icon={Award}
                      />
                    </div>

                    <Card>
                      <Title>Key Insights & Recommendations</Title>
                      <div className="mt-6 space-y-4">
                        {[
                          {
                            type: 'opportunity',
                            title: 'Tax Season Preparation',
                            description: 'Revenue is projected to increase 45% in Q1. Consider hiring temporary staff.',
                            impact: 'High',
                          },
                          {
                            type: 'warning',
                            title: 'Client Concentration Risk',
                            description: 'Top 5 clients represent 68% of revenue. Diversification recommended.',
                            impact: 'Medium',
                          },
                          {
                            type: 'info',
                            title: 'Service Expansion',
                            description: 'Financial planning services show highest growth potential (32% YoY).',
                            impact: 'Medium',
                          },
                        ].map((insight, index) => (
                          <div
                            key={index}
                            className={cn(
                              'p-4 rounded-lg border-l-4',
                              insight.type === 'opportunity' && 'bg-green-50 dark:bg-green-900/20 border-green-500',
                              insight.type === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
                              insight.type === 'info' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <Text className="font-medium">{insight.title}</Text>
                                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {insight.description}
                                </Text>
                              </div>
                              <Badge
                                color={
                                  insight.impact === 'High' ? 'red' :
                                  insight.impact === 'Medium' ? 'yellow' : 'green'
                                }
                                size="sm"
                              >
                                {insight.impact} Impact
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}