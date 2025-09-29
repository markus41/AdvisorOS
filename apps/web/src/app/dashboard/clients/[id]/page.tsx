'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  Users,
  Clock,
  Edit,
  MoreHorizontal,
  Download,
  Share,
  Bell,
} from 'lucide-react'
import {
  Card,
  Title,
  Text,
  Metric,
  AreaChart,
  DonutChart,
  ProgressBar,
  Flex,
} from '@tremor/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { KPICard } from '@/components/ui/kpi-card'
import { ActivityFeed } from '@/components/ui/activity-feed'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import Link from 'next/link'

// Mock data - replace with actual API calls
const mockClient = {
  id: '1',
  businessName: 'ABC Corporation',
  legalName: 'ABC Corp Inc.',
  primaryContactName: 'John Smith',
  primaryContactEmail: 'john@abccorp.com',
  primaryContactPhone: '(555) 123-4567',
  website: 'https://abccorp.com',
  status: 'active',
  businessType: 'Corporation',
  riskLevel: 'low',
  annualRevenue: 1250000,
  employeeCount: 25,
  taxId: '12-3456789',
  incorporationDate: '2019-05-15',
  address: {
    street: '123 Business Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  },
  quickbooksId: 'qb-123',
  quickbooksLastSync: '2024-01-15T10:30:00Z',
  createdAt: '2023-01-15T08:00:00Z',
  updatedAt: '2024-01-15T14:20:00Z',
}

const mockKPIs = [
  {
    title: 'Annual Revenue',
    value: '$1.25M',
    change: { value: 12.5, type: 'increase' as const, period: 'vs last year' },
    icon: DollarSign,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Active Engagements',
    value: '12',
    change: { value: 2, type: 'increase' as const, period: 'vs last month' },
    icon: FileText,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Team Members',
    value: '25',
    change: { value: 8, type: 'increase' as const, period: 'vs last year' },
    icon: Users,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Outstanding Tasks',
    value: '3',
    change: { value: 5, type: 'decrease' as const, period: 'vs last week' },
    icon: Clock,
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
]

const mockFinancialData = [
  { month: 'Jul', Revenue: 95000, Expenses: 72000 },
  { month: 'Aug', Revenue: 108000, Expenses: 78000 },
  { month: 'Sep', Revenue: 112000, Expenses: 82000 },
  { month: 'Oct', Revenue: 98000, Expenses: 75000 },
  { month: 'Nov', Revenue: 118000, Expenses: 88000 },
  { month: 'Dec', Revenue: 125000, Expenses: 92000 },
]

const mockDocuments = [
  {
    id: '1',
    name: 'Annual Tax Return 2023.pdf',
    type: 'Tax Return',
    size: '2.4 MB',
    uploadedAt: '2024-01-10T09:15:00Z',
    uploadedBy: 'Sarah Johnson',
    status: 'processed',
  },
  {
    id: '2',
    name: 'Financial Statements Q4.xlsx',
    type: 'Financial Statement',
    size: '856 KB',
    uploadedAt: '2024-01-08T14:30:00Z',
    uploadedBy: 'Mike Wilson',
    status: 'processing',
  },
  {
    id: '3',
    name: 'Payroll Report December.pdf',
    type: 'Payroll',
    size: '1.2 MB',
    uploadedAt: '2024-01-05T11:45:00Z',
    uploadedBy: 'Emily Davis',
    status: 'processed',
  },
]

const mockTasks = [
  {
    id: '1',
    title: 'Review Q4 Financial Statements',
    description: 'Complete review of quarterly financial statements',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-01-20',
    assignedTo: 'Sarah Johnson',
    estimatedHours: 8,
    actualHours: 4,
  },
  {
    id: '2',
    title: 'Prepare Tax Documents',
    description: 'Gather and organize documents for annual tax filing',
    status: 'pending',
    priority: 'medium',
    dueDate: '2024-01-25',
    assignedTo: 'Mike Wilson',
    estimatedHours: 12,
    actualHours: 0,
  },
  {
    id: '3',
    title: 'Update QuickBooks Integration',
    description: 'Sync latest transactions and resolve data conflicts',
    status: 'completed',
    priority: 'low',
    dueDate: '2024-01-15',
    assignedTo: 'Emily Davis',
    estimatedHours: 4,
    actualHours: 3,
  },
]

const mockActivities = [
  {
    id: '1',
    type: 'document_uploaded',
    title: 'Document uploaded',
    description: 'Annual Tax Return 2023.pdf uploaded by Sarah Johnson',
    timestamp: '2024-01-10T09:15:00Z',
    user: 'Sarah Johnson',
    metadata: { documentName: 'Annual Tax Return 2023.pdf' },
  },
  {
    id: '2',
    type: 'task_completed',
    title: 'Task completed',
    description: 'QuickBooks integration update completed',
    timestamp: '2024-01-08T16:20:00Z',
    user: 'Emily Davis',
    metadata: { taskName: 'Update QuickBooks Integration' },
  },
]

export default function ClientDetailPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

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
        {/* Breadcrumb and Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/dashboard/clients" className="hover:text-gray-700 dark:hover:text-gray-300">
              Clients
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{mockClient.businessName}</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Client Info */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                  {mockClient.businessName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mockClient.businessName}
                    </h1>
                    <StatusBadge status={mockClient.status} />
                    <Badge variant="outline" className="capitalize">
                      {mockClient.businessType}
                    </Badge>
                  </div>
                  {mockClient.legalName !== mockClient.businessName && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Legal Name: {mockClient.legalName}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${mockClient.primaryContactEmail}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {mockClient.primaryContactEmail}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${mockClient.primaryContactPhone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {mockClient.primaryContactPhone}
                      </a>
                    </div>
                    {mockClient.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a
                          href={mockClient.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Client
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>View Audit Log</DropdownMenuItem>
                    <DropdownMenuItem>Generate Report</DropdownMenuItem>
                    <DropdownMenuItem>Archive Client</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockKPIs.map((kpi, index) => (
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

              {/* Financial Overview and Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <Title>Financial Performance</Title>
                    <Text>Revenue vs Expenses (Last 6 months)</Text>
                    <AreaChart
                      className="h-80 mt-4"
                      data={mockFinancialData}
                      index="month"
                      categories={["Revenue", "Expenses"]}
                      colors={["blue", "red"]}
                      valueFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      showLegend={true}
                      showGridLines={true}
                    />
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Alerts */}
                  <Card>
                    <Title>Alerts & Notifications</Title>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Tax Deadline Approaching
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-300">
                            Due in 5 days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            QuickBooks Sync Needed
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-300">
                            Last synced 3 days ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            All Documents Up to Date
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300">
                            No missing documents
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <Title>Client Information</Title>
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tax ID:</span>
                        <span className="font-medium">{mockClient.taxId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Incorporation:</span>
                        <span className="font-medium">{new Date(mockClient.incorporationDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                        <Badge variant="outline" className="capitalize">
                          {mockClient.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Employee Count:</span>
                        <span className="font-medium">{mockClient.employeeCount}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <Title>Document Library</Title>
                  <Button size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
                <div className="space-y-4">
                  {mockDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {doc.name}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>Uploaded by {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <StatusBadge status={doc.status} size="sm" />
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <Title>QuickBooks Integration</Title>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                      <StatusBadge status="success" label="Connected" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Sync:</span>
                      <span className="text-sm font-medium">
                        {new Date(mockClient.quickbooksLastSync).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Company ID:</span>
                      <span className="text-sm font-medium">{mockClient.quickbooksId}</span>
                    </div>
                    <Button size="sm" className="w-full">
                      Sync Now
                    </Button>
                  </div>
                </Card>

                <Card>
                  <Title>Financial Summary</Title>
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Annual Revenue:</span>
                      <span className="text-sm font-medium">
                        ${mockClient.annualRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Profit Margin:</span>
                      <span className="text-sm font-medium">18.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current Ratio:</span>
                      <span className="text-sm font-medium">2.1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Debt-to-Equity:</span>
                      <span className="text-sm font-medium">0.3</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <Title>Active Tasks</Title>
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    New Task
                  </Button>
                </div>
                <div className="space-y-4">
                  {mockTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {task.description}
                          </p>
                        </div>
                        <StatusBadge status={task.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <span className="text-gray-500">
                            Assigned to: {task.assignedTo}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={
                            task.priority === 'high' ? 'border-red-300 text-red-700' :
                            task.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-green-300 text-green-700'
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      {task.status === 'in_progress' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((task.actualHours / task.estimatedHours) * 100)}%</span>
                          </div>
                          <ProgressBar
                            value={(task.actualHours / task.estimatedHours) * 100}
                            color="blue"
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Communications Tab */}
            <TabsContent value="communications" className="space-y-6">
              <Card>
                <Title>Recent Activity</Title>
                <ActivityFeed activities={mockActivities} className="mt-4" />
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <Title>Client Preferences</Title>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive updates about this client</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Sync</p>
                      <p className="text-sm text-gray-500">Automatically sync QuickBooks data</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Retention</p>
                      <p className="text-sm text-gray-500">How long to keep client data</p>
                    </div>
                    <Button variant="outline" size="sm">
                      7 years
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}