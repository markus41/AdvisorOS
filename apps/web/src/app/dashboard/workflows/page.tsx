'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Badge,
  Flex,
  ProgressBar,
  TabGroup,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  BarChart,
  DonutChart,
} from '@tremor/react'
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Square,
  Edit,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  GitBranch,
  ArrowRight,
  FileText,
  Mail,
  Phone,
  Calculator,
  Database,
  Zap,
  Settings,
  Eye,
  Download,
  Share,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Mock data for workflows
const workflowTemplates = [
  {
    id: '1',
    name: 'Tax Return Preparation',
    description: 'Complete workflow for preparing individual tax returns',
    category: 'Tax Services',
    steps: 12,
    estimatedTime: '4-6 hours',
    difficulty: 'Medium',
    usage: 145,
    icon: Calculator,
    tags: ['Tax', 'Individual', 'Annual'],
  },
  {
    id: '2',
    name: 'Client Onboarding',
    description: 'Streamlined process for new client registration and setup',
    category: 'Client Management',
    steps: 8,
    estimatedTime: '2-3 hours',
    difficulty: 'Easy',
    usage: 89,
    icon: Users,
    tags: ['Onboarding', 'Setup', 'Documentation'],
  },
  {
    id: '3',
    name: 'Monthly Bookkeeping',
    description: 'Monthly reconciliation and financial statement preparation',
    category: 'Bookkeeping',
    steps: 15,
    estimatedTime: '6-8 hours',
    difficulty: 'Medium',
    usage: 234,
    icon: Database,
    tags: ['Monthly', 'Reconciliation', 'Statements'],
  },
  {
    id: '4',
    name: 'Audit Preparation',
    description: 'Comprehensive audit preparation and documentation workflow',
    category: 'Audit Services',
    steps: 25,
    estimatedTime: '20-30 hours',
    difficulty: 'Hard',
    usage: 23,
    icon: FileText,
    tags: ['Audit', 'Documentation', 'Compliance'],
  },
  {
    id: '5',
    name: 'Invoice Processing',
    description: 'Automated invoice generation and payment tracking',
    category: 'Billing',
    steps: 6,
    estimatedTime: '1-2 hours',
    difficulty: 'Easy',
    usage: 178,
    icon: FileText,
    tags: ['Billing', 'Automation', 'Payment'],
  },
  {
    id: '6',
    name: 'Year-End Closing',
    description: 'Complete year-end closing process for business clients',
    category: 'Accounting',
    steps: 18,
    estimatedTime: '12-15 hours',
    difficulty: 'Hard',
    usage: 67,
    icon: Calendar,
    tags: ['Year-End', 'Closing', 'Business'],
  },
]

const activeWorkflows = [
  {
    id: 'wf-001',
    name: 'Tax Return - John Smith',
    template: 'Tax Return Preparation',
    status: 'in_progress',
    progress: 75,
    assignee: {
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
    },
    client: 'John Smith',
    dueDate: '2024-02-15',
    startDate: '2024-01-10',
    currentStep: 'Review and Finalize',
    priority: 'high',
  },
  {
    id: 'wf-002',
    name: 'Onboarding - ABC Corp',
    template: 'Client Onboarding',
    status: 'pending',
    progress: 0,
    assignee: {
      name: 'Mike Wilson',
      avatar: '/avatars/mike.jpg',
    },
    client: 'ABC Corporation',
    dueDate: '2024-01-20',
    startDate: '2024-01-18',
    currentStep: 'Initial Contact',
    priority: 'medium',
  },
  {
    id: 'wf-003',
    name: 'Monthly Books - TechStart Inc',
    template: 'Monthly Bookkeeping',
    status: 'in_progress',
    progress: 45,
    assignee: {
      name: 'Emily Davis',
      avatar: '/avatars/emily.jpg',
    },
    client: 'TechStart Inc.',
    dueDate: '2024-01-25',
    startDate: '2024-01-15',
    currentStep: 'Bank Reconciliation',
    priority: 'medium',
  },
  {
    id: 'wf-004',
    name: 'Audit Prep - Global Industries',
    template: 'Audit Preparation',
    status: 'completed',
    progress: 100,
    assignee: {
      name: 'John Smith',
      avatar: '/avatars/john.jpg',
    },
    client: 'Global Industries',
    dueDate: '2024-01-10',
    startDate: '2023-12-01',
    currentStep: 'Completed',
    priority: 'high',
  },
  {
    id: 'wf-005',
    name: 'Invoice Processing - Q4 2023',
    template: 'Invoice Processing',
    status: 'in_progress',
    progress: 90,
    assignee: {
      name: 'Lisa Brown',
      avatar: '/avatars/lisa.jpg',
    },
    client: 'Multiple Clients',
    dueDate: '2024-01-18',
    startDate: '2024-01-15',
    currentStep: 'Payment Tracking',
    priority: 'low',
  },
]

const workflowSteps = [
  { id: 1, name: 'Gather Client Information', type: 'data_collection', duration: 30, completed: true },
  { id: 2, name: 'Review Previous Returns', type: 'review', duration: 45, completed: true },
  { id: 3, name: 'Collect Supporting Documents', type: 'data_collection', duration: 60, completed: true },
  { id: 4, name: 'Enter Data into System', type: 'data_entry', duration: 120, completed: true },
  { id: 5, name: 'Calculate Tax Liability', type: 'calculation', duration: 90, completed: true },
  { id: 6, name: 'Review Calculations', type: 'review', duration: 45, completed: true },
  { id: 7, name: 'Prepare State Returns', type: 'preparation', duration: 60, completed: true },
  { id: 8, name: 'Quality Review', type: 'review', duration: 30, completed: true },
  { id: 9, name: 'Client Review', type: 'client_interaction', duration: 45, completed: true },
  { id: 10, name: 'Final Review and Approval', type: 'approval', duration: 30, completed: false },
  { id: 11, name: 'E-filing', type: 'filing', duration: 15, completed: false },
  { id: 12, name: 'Send Confirmation to Client', type: 'communication', duration: 10, completed: false },
]

const workflowStats = [
  { category: 'Completed', count: 45, color: 'green' },
  { category: 'In Progress', count: 23, color: 'blue' },
  { category: 'Pending', count: 12, color: 'yellow' },
  { category: 'Overdue', count: 3, color: 'red' },
]

const performanceData = [
  { month: 'Sep', 'Completed': 42, 'In Progress': 28, 'Overdue': 5 },
  { month: 'Oct', 'Completed': 38, 'In Progress': 32, 'Overdue': 3 },
  { month: 'Nov', 'Completed': 45, 'In Progress': 29, 'Overdue': 4 },
  { month: 'Dec', 'Completed': 52, 'In Progress': 25, 'Overdue': 2 },
  { month: 'Jan', 'Completed': 48, 'In Progress': 27, 'Overdue': 3 },
]

interface WorkflowTemplateCardProps {
  template: typeof workflowTemplates[0]
  onUse: (template: typeof workflowTemplates[0]) => void
  onEdit: (template: typeof workflowTemplates[0]) => void
  onDelete: (id: string) => void
}

function WorkflowTemplateCard({ template, onUse, onEdit, onDelete }: WorkflowTemplateCardProps) {
  const Icon = template.icon

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'green'
      case 'Medium':
        return 'yellow'
      case 'Hard':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {template.description}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {template.category}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Template
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(template.id)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Steps</span>
          <span className="font-medium">{template.steps}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Time</span>
          <span className="font-medium">{template.estimatedTime}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Difficulty</span>
          <Badge color={getDifficultyColor(template.difficulty)} size="sm">
            {template.difficulty}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Usage</span>
          <span className="font-medium">{template.usage} times</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} color="blue" size="sm" variant="light">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge color="gray" size="sm" variant="light">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => onUse(template)}
          className="w-full"
          size="sm"
        >
          Use Template
        </Button>
      </div>
    </motion.div>
  )
}

interface ActiveWorkflowCardProps {
  workflow: typeof activeWorkflows[0]
  onView: (workflow: typeof activeWorkflows[0]) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
}

function ActiveWorkflowCard({ workflow, onView, onPause, onResume, onCancel }: ActiveWorkflowCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="green" size="sm">Completed</Badge>
      case 'in_progress':
        return <Badge color="blue" size="sm">In Progress</Badge>
      case 'pending':
        return <Badge color="yellow" size="sm">Pending</Badge>
      case 'paused':
        return <Badge color="gray" size="sm">Paused</Badge>
      default:
        return <Badge color="gray" size="sm">Unknown</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const isOverdue = new Date(workflow.dueDate) < new Date() && workflow.status !== 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {workflow.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {workflow.template}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Client: {workflow.client}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(workflow.status)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onView(workflow)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {workflow.status === 'in_progress' && (
                <DropdownMenuItem onClick={() => onPause(workflow.id)}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              {workflow.status === 'paused' && (
                <DropdownMenuItem onClick={() => onResume(workflow.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onCancel(workflow.id)}
                className="text-red-600 dark:text-red-400"
              >
                <Square className="w-4 h-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium">{workflow.progress}%</span>
          </div>
          <ProgressBar
            value={workflow.progress}
            color={workflow.status === 'completed' ? 'green' : 'blue'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Assignee</span>
            <div className="flex items-center space-x-2 mt-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={workflow.assignee.avatar} alt={workflow.assignee.name} />
                <AvatarFallback>
                  {workflow.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{workflow.assignee.name}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Priority</span>
            <div className={cn('font-medium mt-1 capitalize', getPriorityColor(workflow.priority))}>
              {workflow.priority}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Due Date</span>
            <div className={cn('font-medium mt-1', isOverdue && 'text-red-600 dark:text-red-400')}>
              {new Date(workflow.dueDate).toLocaleDateString()}
              {isOverdue && (
                <AlertTriangle className="w-4 h-4 inline ml-1" />
              )}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Current Step</span>
            <div className="font-medium mt-1">{workflow.currentStep}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={() => onView(workflow)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          View Workflow
        </Button>
      </div>
    </motion.div>
  )
}

function WorkflowBuilder() {
  const [steps, setSteps] = useState(workflowSteps)

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'data_collection':
        return Database
      case 'review':
        return Eye
      case 'data_entry':
        return Edit
      case 'calculation':
        return Calculator
      case 'preparation':
        return FileText
      case 'client_interaction':
        return Users
      case 'approval':
        return CheckCircle2
      case 'filing':
        return Upload
      case 'communication':
        return Mail
      default:
        return FileText
    }
  }

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'data_collection':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
      case 'review':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
      case 'data_entry':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
      case 'calculation':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
      case 'preparation':
        return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
      case 'client_interaction':
        return 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400'
      case 'approval':
        return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
      case 'filing':
        return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
      case 'communication':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Workflow Builder
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visual workflow editor for Tax Return Preparation
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = getStepTypeIcon(step.type)
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    getStepTypeColor(step.type),
                    step.completed && 'ring-2 ring-green-500 ring-offset-2'
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={cn(
                      'w-0.5 h-8 mt-2',
                      step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )} />
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {step.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Estimated time: {step.duration} minutes
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge color="blue" size="sm" variant="light">
                          {step.type.replace('_', ' ')}
                        </Badge>
                        {step.completed && (
                          <Badge color="green" size="sm">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const handleUseTemplate = (template: typeof workflowTemplates[0]) => {
    console.log('Using template:', template.name)
    // In real implementation, this would open a workflow creation modal
  }

  const handleEditTemplate = (template: typeof workflowTemplates[0]) => {
    console.log('Editing template:', template.name)
    // In real implementation, this would open the workflow builder
  }

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      console.log('Deleting template:', id)
    }
  }

  const handleViewWorkflow = (workflow: typeof activeWorkflows[0]) => {
    console.log('Viewing workflow:', workflow.name)
    // In real implementation, this would open workflow details
  }

  const handlePauseWorkflow = (id: string) => {
    console.log('Pausing workflow:', id)
  }

  const handleResumeWorkflow = (id: string) => {
    console.log('Resuming workflow:', id)
  }

  const handleCancelWorkflow = (id: string) => {
    if (confirm('Are you sure you want to cancel this workflow?')) {
      console.log('Cancelling workflow:', id)
    }
  }

  const filteredTemplates = workflowTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const filteredWorkflows = activeWorkflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || workflow.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const tabs = [
    { name: 'Templates', icon: Workflow },
    { name: 'Active Workflows', icon: Play },
    { name: 'Workflow Builder', icon: GitBranch },
    { name: 'Analytics', icon: BarChart3 },
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
                Workflow Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create, manage, and track automated workflows for your CPA practice
              </p>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </Button>
          </div>
        </motion.div>

        {/* Workflow Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowStats.map((stat, index) => (
              <motion.div
                key={stat.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.category}
                      </Text>
                      <Text className="text-2xl font-bold mt-2">{stat.count}</Text>
                    </div>
                    <div className={cn(
                      'p-3 rounded-lg',
                      stat.color === 'green' && 'bg-green-50 dark:bg-green-900/20',
                      stat.color === 'blue' && 'bg-blue-50 dark:bg-blue-900/20',
                      stat.color === 'yellow' && 'bg-yellow-50 dark:bg-yellow-900/20',
                      stat.color === 'red' && 'bg-red-50 dark:bg-red-900/20'
                    )}>
                      <Workflow className={cn(
                        'w-6 h-6',
                        stat.color === 'green' && 'text-green-600 dark:text-green-400',
                        stat.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                        stat.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                        stat.color === 'red' && 'text-red-600 dark:text-red-400'
                      )} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Workflow Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <TabGroup index={activeTab} onIndexChange={setActiveTab}>
              <TabList className="mb-6">
                {tabs.map((tab) => {
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
                {/* Templates Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <Title>Workflow Templates ({filteredTemplates.length})</Title>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Tax Services">Tax Services</SelectItem>
                            <SelectItem value="Client Management">Client Management</SelectItem>
                            <SelectItem value="Bookkeeping">Bookkeeping</SelectItem>
                            <SelectItem value="Audit Services">Audit Services</SelectItem>
                            <SelectItem value="Billing">Billing</SelectItem>
                            <SelectItem value="Accounting">Accounting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredTemplates.map((template) => (
                        <WorkflowTemplateCard
                          key={template.id}
                          template={template}
                          onUse={handleUseTemplate}
                          onEdit={handleEditTemplate}
                          onDelete={handleDeleteTemplate}
                        />
                      ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                      <div className="text-center py-12">
                        <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <Text className="text-gray-500">No templates match your search criteria</Text>
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Active Workflows Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <Title>Active Workflows ({filteredWorkflows.length})</Title>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search workflows..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredWorkflows.map((workflow) => (
                        <ActiveWorkflowCard
                          key={workflow.id}
                          workflow={workflow}
                          onView={handleViewWorkflow}
                          onPause={handlePauseWorkflow}
                          onResume={handleResumeWorkflow}
                          onCancel={handleCancelWorkflow}
                        />
                      ))}
                    </div>

                    {filteredWorkflows.length === 0 && (
                      <div className="text-center py-12">
                        <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <Text className="text-gray-500">No workflows match your search criteria</Text>
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Workflow Builder Tab */}
                <TabPanel>
                  <WorkflowBuilder />
                </TabPanel>

                {/* Analytics Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <Title>Workflow Analytics</Title>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <Title>Workflow Performance</Title>
                        <Text>Monthly workflow completion trends</Text>
                        <BarChart
                          className="h-72 mt-4"
                          data={performanceData}
                          index="month"
                          categories={["Completed", "In Progress", "Overdue"]}
                          colors={["green", "blue", "red"]}
                          showLegend={true}
                          showGridLines={true}
                        />
                      </Card>

                      <Card>
                        <Title>Workflow Distribution</Title>
                        <Text>Current workflow status breakdown</Text>
                        <DonutChart
                          className="h-72 mt-4"
                          data={workflowStats}
                          category="count"
                          index="category"
                          colors={["green", "blue", "yellow", "red"]}
                          showTooltip={true}
                          showLegend={true}
                        />
                      </Card>
                    </div>

                    <Card>
                      <Title>Template Usage Statistics</Title>
                      <Text>Most frequently used workflow templates</Text>
                      <div className="mt-6 space-y-4">
                        {workflowTemplates
                          .sort((a, b) => b.usage - a.usage)
                          .slice(0, 5)
                          .map((template, index) => (
                          <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <Text className="font-medium">{template.name}</Text>
                                <Text className="text-sm text-gray-500">{template.category}</Text>
                              </div>
                            </div>
                            <div className="text-right">
                              <Text className="font-medium">{template.usage} uses</Text>
                              <Text className="text-sm text-gray-500">{template.estimatedTime}</Text>
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