'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  Calendar,
  Clock,
  Download,
  Share,
  Settings,
  Play,
  Pause,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Users,
  DollarSign,
  Target,
  AlertCircle,
} from 'lucide-react'
import {
  Card,
  Title,
  Text,
  Metric,
  ProgressBar,
  Badge as TremorBadge,
} from '@tremor/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { cn } from '@/lib/utils'

// Mock data - replace with actual API calls
const reportTemplates = [
  {
    id: '1',
    name: 'Financial Performance Dashboard',
    description: 'Comprehensive financial metrics and KPIs for client analysis',
    category: 'Financial',
    type: 'Dashboard',
    icon: TrendingUp,
    color: 'bg-blue-500',
    estimatedTime: '5 minutes',
    popularity: 95,
    lastUsed: '2024-01-15T10:30:00Z',
    usageCount: 234,
    features: ['Revenue Analysis', 'Profit Margins', 'Cash Flow', 'Trend Charts'],
  },
  {
    id: '2',
    name: 'Client Portfolio Summary',
    description: 'Overview of all clients with risk assessment and status',
    category: 'Client Management',
    type: 'Report',
    icon: Users,
    color: 'bg-green-500',
    estimatedTime: '3 minutes',
    popularity: 87,
    lastUsed: '2024-01-12T14:20:00Z',
    usageCount: 156,
    features: ['Client Status', 'Risk Assessment', 'Revenue by Client', 'Activity Log'],
  },
  {
    id: '3',
    name: 'Tax Compliance Report',
    description: 'Tax filing status and compliance tracking for all clients',
    category: 'Tax',
    type: 'Compliance',
    icon: FileText,
    color: 'bg-purple-500',
    estimatedTime: '8 minutes',
    popularity: 78,
    lastUsed: '2024-01-10T09:15:00Z',
    usageCount: 89,
    features: ['Filing Status', 'Deadlines', 'Missing Documents', 'Compliance Score'],
  },
  {
    id: '4',
    name: 'Monthly Revenue Analysis',
    description: 'Monthly breakdown of revenue, expenses, and profitability',
    category: 'Financial',
    type: 'Analysis',
    icon: BarChart3,
    color: 'bg-orange-500',
    estimatedTime: '4 minutes',
    popularity: 82,
    lastUsed: '2024-01-08T16:45:00Z',
    usageCount: 201,
    features: ['Monthly Trends', 'Year-over-Year', 'Expense Breakdown', 'Profit Analysis'],
  },
  {
    id: '5',
    name: 'Team Utilization Report',
    description: 'Staff productivity and utilization metrics',
    category: 'Operations',
    type: 'Performance',
    icon: Target,
    color: 'bg-indigo-500',
    estimatedTime: '6 minutes',
    popularity: 71,
    lastUsed: '2024-01-05T11:30:00Z',
    usageCount: 67,
    features: ['Utilization Rates', 'Billable Hours', 'Client Assignments', 'Performance Metrics'],
  },
  {
    id: '6',
    name: 'QuickBooks Integration Status',
    description: 'Sync status and data integrity check for all QB connections',
    category: 'Integration',
    type: 'System',
    icon: Settings,
    color: 'bg-teal-500',
    estimatedTime: '2 minutes',
    popularity: 64,
    lastUsed: '2024-01-03T13:20:00Z',
    usageCount: 134,
    features: ['Sync Status', 'Data Integrity', 'Error Logs', 'Last Sync Times'],
  },
]

const recentReports = [
  {
    id: '1',
    name: 'Q4 2023 Financial Performance',
    template: 'Financial Performance Dashboard',
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'Sarah Johnson',
    status: 'completed',
    downloadUrl: '/reports/q4-2023-financial.pdf',
    size: '2.4 MB',
    recipients: ['john@abccorp.com', 'sarah@firm.com'],
  },
  {
    id: '2',
    name: 'Client Status January 2024',
    template: 'Client Portfolio Summary',
    createdAt: '2024-01-12T14:20:00Z',
    createdBy: 'Mike Wilson',
    status: 'generating',
    downloadUrl: null,
    size: null,
    recipients: ['team@firm.com'],
  },
  {
    id: '3',
    name: 'Tax Season Preparation',
    template: 'Tax Compliance Report',
    createdAt: '2024-01-10T09:15:00Z',
    createdBy: 'Emily Davis',
    status: 'completed',
    downloadUrl: '/reports/tax-preparation-2024.pdf',
    size: '1.8 MB',
    recipients: ['partners@firm.com'],
  },
  {
    id: '4',
    name: 'December Revenue Analysis',
    template: 'Monthly Revenue Analysis',
    createdAt: '2024-01-08T16:45:00Z',
    createdBy: 'Sarah Johnson',
    status: 'completed',
    downloadUrl: '/reports/december-revenue.pdf',
    size: '1.2 MB',
    recipients: ['finance@firm.com'],
  },
]

const scheduledReports = [
  {
    id: '1',
    name: 'Weekly Client Summary',
    template: 'Client Portfolio Summary',
    schedule: 'Every Monday at 9:00 AM',
    nextRun: '2024-01-22T09:00:00Z',
    status: 'active',
    recipients: ['team@firm.com'],
    createdBy: 'Sarah Johnson',
  },
  {
    id: '2',
    name: 'Monthly Financial Dashboard',
    template: 'Financial Performance Dashboard',
    schedule: 'First day of each month at 8:00 AM',
    nextRun: '2024-02-01T08:00:00Z',
    status: 'active',
    recipients: ['partners@firm.com', 'finance@firm.com'],
    createdBy: 'Mike Wilson',
  },
  {
    id: '3',
    name: 'Quarterly Tax Review',
    template: 'Tax Compliance Report',
    schedule: 'First day of each quarter at 10:00 AM',
    nextRun: '2024-04-01T10:00:00Z',
    status: 'paused',
    recipients: ['tax-team@firm.com'],
    createdBy: 'Emily Davis',
  },
]

const categories = ['All', 'Financial', 'Client Management', 'Tax', 'Operations', 'Integration']

interface ReportTemplateCardProps {
  template: typeof reportTemplates[0]
  onGenerate: (templateId: string) => void
}

function ReportTemplateCard({ template, onGenerate }: ReportTemplateCardProps) {
  const Icon = template.icon

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white', template.color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {template.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {template.category} • {template.type}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onGenerate(template.id)}>
              <Play className="mr-2 h-4 w-4" />
              Generate Report
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Preview Template
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Template
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Template
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {template.description}
      </p>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Estimated Time:</span>
          <span className="font-medium">{template.estimatedTime}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Usage Count:</span>
          <span className="font-medium">{template.usageCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Popularity:</span>
          <div className="flex items-center space-x-2">
            <ProgressBar value={template.popularity} color="blue" className="w-16 h-2" />
            <span className="font-medium">{template.popularity}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {template.features.slice(0, 3).map((feature) => (
          <Badge key={feature} variant="outline" className="text-xs">
            {feature}
          </Badge>
        ))}
        {template.features.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{template.features.length - 3} more
          </Badge>
        )}
      </div>

      <Button className="w-full" onClick={() => onGenerate(template.id)}>
        <Play className="w-4 h-4 mr-2" />
        Generate Report
      </Button>
    </motion.div>
  )
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('templates')

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleGenerateReport = (templateId: string) => {
    console.log('Generating report from template:', templateId)
    // Implement report generation logic
  }

  const handleToggleSchedule = (scheduleId: string) => {
    console.log('Toggling schedule:', scheduleId)
    // Implement schedule toggle logic
  }

  const filteredTemplates = reportTemplates.filter(template => {
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'All' && template.category !== categoryFilter) return false
    return true
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Generate insights and analytics for your CPA practice
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Manage Templates
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Custom Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Text>Reports Generated</Text>
                <Metric>1,247</Metric>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Text>Active Schedules</Text>
                <Metric>12</Metric>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Text>This Month</Text>
                <Metric>89</Metric>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Text>Avg. Generation</Text>
                <Metric>4.2m</Metric>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('templates')}
                className={cn(
                  'py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                Report Templates
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={cn(
                  'py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'recent'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                Recent Reports
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={cn(
                  'py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'scheduled'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                Scheduled Reports
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search report templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                >
                  <ReportTemplateCard
                    template={template}
                    onGenerate={handleGenerateReport}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Reports Tab */}
        {activeTab === 'recent' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <FileText className="w-10 h-10 text-blue-500 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {report.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.template}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Created by {report.createdBy}</span>
                        <span>•</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        {report.size && (
                          <>
                            <span>•</span>
                            <span>{report.size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={report.status === 'completed' ? 'success' : 'warning'} />
                    {report.status === 'completed' && report.downloadUrl && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-400">
                Manage your automated report schedules
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Schedule
              </Button>
            </div>

            {scheduledReports.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <Calendar className="w-10 h-10 text-green-500 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {schedule.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {schedule.template}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{schedule.schedule}</span>
                        <span>•</span>
                        <span>Next run: {new Date(schedule.nextRun).toLocaleString()}</span>
                        <span>•</span>
                        <span>{schedule.recipients.length} recipient(s)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge
                      status={schedule.status === 'active' ? 'success' : 'warning'}
                      label={schedule.status}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule.id)}
                    >
                      {schedule.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}