'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Filter,
  Search,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Report {
  id: string
  name: string
  description: string
  type: 'financial' | 'tax' | 'operational' | 'custom'
  period: string
  generatedDate: string
  size: string
  status: 'ready' | 'generating' | 'error'
  downloadUrl: string
  previewUrl?: string
  isStarred: boolean
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'financial' | 'tax' | 'operational' | 'custom'
  icon: React.ComponentType<{ className?: string }>
  isPopular: boolean
  estimatedTime: string
}

interface ReportRequest {
  id: string
  title: string
  description: string
  requestedDate: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  estimatedCompletion?: string
}

const sampleReports: Report[] = [
  {
    id: '1',
    name: 'Profit & Loss Statement - Q3 2024',
    description: 'Quarterly profit and loss statement with detailed breakdown',
    type: 'financial',
    period: 'Q3 2024',
    generatedDate: '2024-10-31',
    size: '2.4 MB',
    status: 'ready',
    downloadUrl: '/reports/pl-q3-2024.pdf',
    previewUrl: '/reports/pl-q3-2024.pdf',
    isStarred: true
  },
  {
    id: '2',
    name: 'Balance Sheet - September 2024',
    description: 'Monthly balance sheet with assets, liabilities, and equity',
    type: 'financial',
    period: 'September 2024',
    generatedDate: '2024-10-15',
    size: '1.8 MB',
    status: 'ready',
    downloadUrl: '/reports/balance-sheet-sep-2024.pdf',
    previewUrl: '/reports/balance-sheet-sep-2024.pdf',
    isStarred: false
  },
  {
    id: '3',
    name: 'Tax Summary - 2023',
    description: 'Annual tax summary with deductions and liability breakdown',
    type: 'tax',
    period: '2023',
    generatedDate: '2024-03-15',
    size: '3.2 MB',
    status: 'ready',
    downloadUrl: '/reports/tax-summary-2023.pdf',
    isStarred: true
  },
  {
    id: '4',
    name: 'Cash Flow Analysis - YTD',
    description: 'Year-to-date cash flow analysis with projections',
    type: 'financial',
    period: 'YTD 2024',
    generatedDate: '2024-11-01',
    size: '1.5 MB',
    status: 'generating',
    downloadUrl: '',
    isStarred: false
  }
]

const reportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Financial Statement Package',
    description: 'Complete set of financial statements including P&L, Balance Sheet, and Cash Flow',
    type: 'financial',
    icon: BarChart3,
    isPopular: true,
    estimatedTime: '24 hours'
  },
  {
    id: '2',
    name: 'Tax Preparation Summary',
    description: 'Comprehensive tax preparation with all schedules and supporting documents',
    type: 'tax',
    icon: FileText,
    isPopular: true,
    estimatedTime: '48 hours'
  },
  {
    id: '3',
    name: 'Budget vs Actual Analysis',
    description: 'Detailed variance analysis comparing budget to actual performance',
    type: 'operational',
    icon: TrendingUp,
    isPopular: false,
    estimatedTime: '12 hours'
  },
  {
    id: '4',
    name: 'Custom Financial Analysis',
    description: 'Tailored analysis based on your specific business needs and requirements',
    type: 'custom',
    icon: PieChart,
    isPopular: false,
    estimatedTime: '72 hours'
  }
]

const reportRequests: ReportRequest[] = [
  {
    id: '1',
    title: 'Annual Financial Review',
    description: 'Comprehensive annual financial review for 2024 with recommendations',
    requestedDate: '2024-11-01',
    priority: 'high',
    status: 'in_progress',
    estimatedCompletion: '2024-11-15'
  },
  {
    id: '2',
    title: 'Industry Benchmark Analysis',
    description: 'Compare business performance against industry benchmarks',
    requestedDate: '2024-10-28',
    priority: 'medium',
    status: 'pending',
    estimatedCompletion: '2024-11-10'
  }
]

function getReportTypeIcon(type: Report['type']) {
  switch (type) {
    case 'financial':
      return BarChart3
    case 'tax':
      return FileText
    case 'operational':
      return TrendingUp
    case 'custom':
      return PieChart
  }
}

function getReportTypeColor(type: Report['type']) {
  switch (type) {
    case 'financial':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case 'tax':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'operational':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    case 'custom':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  }
}

function getStatusColor(status: Report['status']) {
  switch (status) {
    case 'ready':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'generating':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
}

function getStatusIcon(status: Report['status']) {
  switch (status) {
    case 'ready':
      return <CheckCircle className="w-4 h-4" />
    case 'generating':
      return <Clock className="w-4 h-4" />
    case 'error':
      return <AlertCircle className="w-4 h-4" />
  }
}

function getPriorityColor(priority: ReportRequest['priority']) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
}

function getRequestStatusColor(status: ReportRequest['status']) {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface ReportCardProps {
  report: Report
  onView: (report: Report) => void
  onDownload: (report: Report) => void
  onToggleStar: (report: Report) => void
}

function ReportCard({ report, onView, onDownload, onToggleStar }: ReportCardProps) {
  const TypeIcon = getReportTypeIcon(report.type)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${getReportTypeColor(report.type)}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {report.name}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleStar(report)}
                  className="p-1 h-auto"
                >
                  <Star className={`w-4 h-4 ${
                    report.isStarred
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-400'
                  }`} />
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {report.description}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Period</span>
            <span className="text-gray-900 dark:text-white">{report.period}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Generated</span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(report.generatedDate)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Size</span>
            <span className="text-gray-900 dark:text-white">{report.size}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={getReportTypeColor(report.type)}>
              {report.type}
            </Badge>
            <Badge variant="secondary" className={getStatusColor(report.status)}>
              <span className="flex items-center space-x-1">
                {getStatusIcon(report.status)}
                <span className="capitalize">{report.status}</span>
              </span>
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {report.status === 'ready' && (
            <>
              {report.previewUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(report)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onDownload(report)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </>
          )}
          {report.status === 'generating' && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Report is being generated...
            </div>
          )}
          {report.status === 'error' && (
            <div className="text-sm text-red-600 dark:text-red-400">
              Error generating report. Please contact support.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ReportTemplateCardProps {
  template: ReportTemplate
  onRequest: (template: ReportTemplate) => void
}

function ReportTemplateCard({ template, onRequest }: ReportTemplateCardProps) {
  const Icon = template.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3 mb-4">
          <div className={`p-3 rounded-lg ${getReportTypeColor(template.type)}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {template.name}
              </h3>
              {template.isPopular && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  Popular
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {template.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{template.estimatedTime}</span>
            </div>
            <Badge variant="secondary" className={getReportTypeColor(template.type)}>
              {template.type}
            </Badge>
          </div>
        </div>

        <Button
          onClick={() => onRequest(template)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Report
        </Button>
      </CardContent>
    </Card>
  )
}

interface ReportRequestCardProps {
  request: ReportRequest
  onView: (request: ReportRequest) => void
}

function ReportRequestCard({ request, onView }: ReportRequestCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {request.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {request.description}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={getPriorityColor(request.priority)}>
              {request.priority}
            </Badge>
            <Badge variant="secondary" className={getRequestStatusColor(request.status)}>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Requested</span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(request.requestedDate)}
            </span>
          </div>
          {request.estimatedCompletion && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Est. Completion</span>
              <span className="text-gray-900 dark:text-white">
                {formatDate(request.estimatedCompletion)}
              </span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(request)}
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [reports] = useState<Report[]>(sampleReports)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || report.type === filterType
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleViewReport = (report: Report) => {
    if (report.previewUrl) {
      window.open(report.previewUrl, '_blank')
    }
  }

  const handleDownloadReport = (report: Report) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank')
    }
  }

  const handleToggleStar = (report: Report) => {
    console.log('Toggle star for report:', report.id)
    // Handle star toggle logic
  }

  const handleRequestReport = (template: ReportTemplate) => {
    console.log('Request report:', template)
    // Handle report request logic
  }

  const handleViewRequest = (request: ReportRequest) => {
    console.log('View request:', request)
    // Handle view request logic
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Access your financial reports, request new analyses, and download documents
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">My Reports</TabsTrigger>
          <TabsTrigger value="templates">Request New Report</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
        </TabsList>

        {/* My Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="tax">Tax</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <motion.div
                key={report.id}
                variants={itemVariants}
              >
                <ReportCard
                  report={report}
                  onView={handleViewReport}
                  onDownload={handleDownloadReport}
                  onToggleStar={handleToggleStar}
                />
              </motion.div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No reports found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No reports match your current search criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Report Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Available Report Types
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose from our standard report templates or request a custom analysis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportTemplates.map((template) => (
              <motion.div
                key={template.id}
                variants={itemVariants}
              >
                <ReportTemplateCard
                  template={template}
                  onRequest={handleRequestReport}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pending Requests
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track the status of your custom report requests
              </p>
            </div>
            <Badge variant="secondary">
              {reportRequests.filter(r => r.status !== 'completed').length} pending
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportRequests.map((request) => (
              <motion.div
                key={request.id}
                variants={itemVariants}
              >
                <ReportRequestCard
                  request={request}
                  onView={handleViewRequest}
                />
              </motion.div>
            ))}
          </div>

          {reportRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No pending requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You don't have any pending report requests at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}