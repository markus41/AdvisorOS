'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Users,
  Calendar,
  Flag,
  MessageSquare,
  FileText,
  Link,
  Plus,
  Edit,
  Trash2,
  Archive,
  Filter,
  Search,
  MoreVertical,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Target,
  Zap,
  Timer,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  Star,
  BookOpen,
  Activity,
  BarChart3,
  TrendingUp,
  Workflow
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { useWebSocket } from '@/hooks/use-websocket'

interface WorkflowTask {
  id: string
  title: string
  description: string
  type: 'document_review' | 'data_entry' | 'client_meeting' | 'preparation' | 'review' | 'approval' | 'custom'
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assigneeId?: string
  assigneeName?: string
  assigneeAvatar?: string
  createdById: string
  createdByName: string
  clientId?: string
  clientName?: string
  dueDate?: string
  startDate?: string
  estimatedHours?: number
  actualHours?: number
  completedDate?: string
  dependencies: string[]
  subTasks: SubTask[]
  attachments: TaskAttachment[]
  comments: TaskComment[]
  tags: string[]
  position: { x: number; y: number }
  workflowId: string
  stepIndex: number
  approvals: TaskApproval[]
  checklist: ChecklistItem[]
  visibility: 'public' | 'team' | 'private'
  isTemplate: boolean
  templateData?: Record<string, any>
}

interface SubTask {
  id: string
  title: string
  isCompleted: boolean
  assigneeId?: string
  dueDate?: string
}

interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

interface TaskComment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: string
  isResolved: boolean
  mentions: string[]
}

interface TaskApproval {
  id: string
  approverId: string
  approverName: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  timestamp?: string
}

interface ChecklistItem {
  id: string
  title: string
  isCompleted: boolean
  completedBy?: string
  completedAt?: string
}

interface Workflow {
  id: string
  name: string
  description: string
  type: 'tax_preparation' | 'audit' | 'bookkeeping' | 'custom'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  clientId?: string
  clientName?: string
  createdById: string
  createdByName: string
  assignedToId?: string
  assignedToName?: string
  startDate?: string
  dueDate?: string
  completedDate?: string
  estimatedHours?: number
  actualHours?: number
  progress: number
  tasks: WorkflowTask[]
  isTemplate: boolean
  templateCategory?: string
  tags: string[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  visibility: 'public' | 'team' | 'private'
  automationRules: AutomationRule[]
  notifications: WorkflowNotification[]
}

interface AutomationRule {
  id: string
  trigger: 'task_completed' | 'task_overdue' | 'approval_needed' | 'client_response'
  conditions: Record<string, any>
  actions: string[]
  isActive: boolean
}

interface WorkflowNotification {
  id: string
  type: 'reminder' | 'update' | 'approval_request' | 'completion'
  recipients: string[]
  message: string
  scheduledFor?: string
  sent: boolean
}

interface TaskWorkflowManagerProps {
  currentUserId: string
  organizationId: string
  isClientView?: boolean
}

// Mock data
const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: '2024 Q3 Tax Preparation - Johnson Corp',
    description: 'Quarterly tax preparation workflow for Johnson Corp',
    type: 'tax_preparation',
    status: 'active',
    clientId: 'client1',
    clientName: 'Johnson Corp',
    createdById: 'user1',
    createdByName: 'John Smith',
    assignedToId: 'user1',
    assignedToName: 'John Smith',
    startDate: '2024-06-01T00:00:00Z',
    dueDate: '2024-07-15T00:00:00Z',
    estimatedHours: 40,
    actualHours: 25,
    progress: 65,
    tasks: [],
    isTemplate: false,
    tags: ['quarterly', 'tax', 'high-priority'],
    priority: 'high',
    visibility: 'team',
    automationRules: [],
    notifications: []
  },
  {
    id: '2',
    name: 'ABC Manufacturing Annual Audit',
    description: 'Annual financial audit for ABC Manufacturing',
    type: 'audit',
    status: 'active',
    clientId: 'client2',
    clientName: 'ABC Manufacturing',
    createdById: 'user2',
    createdByName: 'Sarah Miller',
    assignedToId: 'user2',
    assignedToName: 'Sarah Miller',
    startDate: '2024-08-01T00:00:00Z',
    dueDate: '2024-10-31T00:00:00Z',
    estimatedHours: 120,
    actualHours: 45,
    progress: 38,
    tasks: [],
    isTemplate: false,
    tags: ['annual', 'audit', 'manufacturing'],
    priority: 'normal',
    visibility: 'team',
    automationRules: [],
    notifications: []
  }
]

const mockTasks: WorkflowTask[] = [
  {
    id: '1',
    title: 'Collect Q3 Financial Documents',
    description: 'Gather all financial documents for Q3 2024 including bank statements, receipts, and invoices',
    type: 'document_review',
    status: 'completed',
    priority: 'high',
    assigneeId: 'client1',
    assigneeName: 'Sarah Johnson',
    assigneeAvatar: '/avatars/sarah.jpg',
    createdById: 'user1',
    createdByName: 'John Smith',
    clientId: 'client1',
    clientName: 'Johnson Corp',
    dueDate: '2024-06-15T00:00:00Z',
    startDate: '2024-06-01T00:00:00Z',
    estimatedHours: 8,
    actualHours: 6,
    completedDate: '2024-06-14T16:30:00Z',
    dependencies: [],
    subTasks: [
      { id: 'st1', title: 'Bank statements', isCompleted: true, assigneeId: 'client1' },
      { id: 'st2', title: 'Expense receipts', isCompleted: true, assigneeId: 'client1' },
      { id: 'st3', title: 'Invoice records', isCompleted: true, assigneeId: 'client1' }
    ],
    attachments: [],
    comments: [],
    tags: ['documents', 'client-task'],
    position: { x: 100, y: 100 },
    workflowId: '1',
    stepIndex: 1,
    approvals: [],
    checklist: [],
    visibility: 'public',
    isTemplate: false
  },
  {
    id: '2',
    title: 'Review and Categorize Documents',
    description: 'Review submitted documents and categorize them for tax preparation',
    type: 'review',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'user1',
    assigneeName: 'John Smith',
    assigneeAvatar: '/avatars/john.jpg',
    createdById: 'user1',
    createdByName: 'John Smith',
    clientId: 'client1',
    clientName: 'Johnson Corp',
    dueDate: '2024-06-20T00:00:00Z',
    startDate: '2024-06-15T00:00:00Z',
    estimatedHours: 12,
    actualHours: 8,
    dependencies: ['1'],
    subTasks: [],
    attachments: [],
    comments: [
      {
        id: 'c1',
        userId: 'user1',
        userName: 'John Smith',
        content: 'All documents have been received and are being reviewed',
        timestamp: '2024-06-16T10:00:00Z',
        isResolved: false,
        mentions: []
      }
    ],
    tags: ['review', 'categorization'],
    position: { x: 300, y: 100 },
    workflowId: '1',
    stepIndex: 2,
    approvals: [],
    checklist: [
      { id: 'cl1', title: 'Verify all bank statements', isCompleted: true, completedBy: 'user1', completedAt: '2024-06-16T09:00:00Z' },
      { id: 'cl2', title: 'Categorize expenses', isCompleted: false },
      { id: 'cl3', title: 'Check for missing documents', isCompleted: false }
    ],
    visibility: 'team',
    isTemplate: false
  }
]

export function TaskWorkflowManager({ currentUserId, organizationId, isClientView = false }: TaskWorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows)
  const [tasks, setTasks] = useState<WorkflowTask[]>(mockTasks)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0])
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline' | 'chart'>('kanban')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false)
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null)

  // WebSocket for real-time updates
  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/workflows',
    onMessage: (message) => {
      if (message.type === 'task_updated') {
        setTasks(prev => prev.map(task =>
          task.id === message.data.id ? { ...task, ...message.data } : task
        ))
      } else if (message.type === 'workflow_updated') {
        setWorkflows(prev => prev.map(workflow =>
          workflow.id === message.data.id ? { ...workflow, ...message.data } : workflow
        ))
      } else if (message.type === 'task_assigned') {
        // Handle task assignment notification
        console.log('Task assigned:', message.data)
      }
    }
  })

  const updateTaskStatus = (taskId: string, status: WorkflowTask['status']) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          status,
          completedDate: status === 'completed' ? new Date().toISOString() : undefined
        }

        // Send update via WebSocket
        if (isConnected) {
          sendMessage({
            type: 'update_task',
            data: updatedTask
          })
        }

        return updatedTask
      }
      return task
    }))

    // Update workflow progress
    updateWorkflowProgress(selectedWorkflow?.id || '')
  }

  const updateWorkflowProgress = (workflowId: string) => {
    const workflowTasks = tasks.filter(t => t.workflowId === workflowId)
    const completedTasks = workflowTasks.filter(t => t.status === 'completed')
    const progress = workflowTasks.length > 0 ? (completedTasks.length / workflowTasks.length) * 100 : 0

    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId ? { ...workflow, progress } : workflow
    ))
  }

  const assignTask = (taskId: string, assigneeId: string, assigneeName: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, assigneeId, assigneeName } : task
    ))

    // Send assignment notification
    if (isConnected) {
      sendMessage({
        type: 'assign_task',
        data: { taskId, assigneeId, assigneeName, assignedBy: currentUserId }
      })
    }
  }

  const addComment = (taskId: string, content: string) => {
    const newComment: TaskComment = {
      id: `comment_${Date.now()}`,
      userId: currentUserId,
      userName: isClientView ? 'You' : 'CPA Team',
      content,
      timestamp: new Date().toISOString(),
      isResolved: false,
      mentions: extractMentions(content)
    }

    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, comments: [...task.comments, newComment] }
        : task
    ))
  }

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    return mentions
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'normal': return 'text-blue-600 dark:text-blue-400'
      case 'low': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <Flag className="w-4 h-4" />
      case 'normal': return <Info className="w-4 h-4" />
      case 'low': return <ArrowDown className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'document_review': return <FileText className="w-4 h-4" />
      case 'data_entry': return <Edit className="w-4 h-4" />
      case 'client_meeting': return <Users className="w-4 h-4" />
      case 'preparation': return <BookOpen className="w-4 h-4" />
      case 'review': return <CheckSquare className="w-4 h-4" />
      case 'approval': return <CheckCircle className="w-4 h-4" />
      default: return <Square className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Tomorrow'
    if (diffInDays === -1) return 'Yesterday'
    if (diffInDays > 0) return `In ${diffInDays} days`
    if (diffInDays < 0) return `${Math.abs(diffInDays)} days ago`

    return date.toLocaleDateString()
  }

  const filteredTasks = tasks.filter(task => {
    if (selectedWorkflow && task.workflowId !== selectedWorkflow.id) return false

    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesAssignee = filterAssignee === 'all' || task.assigneeId === filterAssignee
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority

    return matchesSearch && matchesStatus && matchesAssignee && matchesPriority
  })

  const kanbanColumns = [
    { id: 'pending', title: 'To Do', tasks: filteredTasks.filter(t => t.status === 'pending') },
    { id: 'in_progress', title: 'In Progress', tasks: filteredTasks.filter(t => t.status === 'in_progress') },
    { id: 'review', title: 'Review', tasks: filteredTasks.filter(t => t.status === 'review') },
    { id: 'completed', title: 'Completed', tasks: filteredTasks.filter(t => t.status === 'completed') }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task & Workflow Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Collaborate on tasks and track workflow progress
          </p>
          {isConnected && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600">Real-time updates active</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kanban">Kanban</SelectItem>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to the workflow
                </DialogDescription>
              </DialogHeader>
              {/* Task creation form would go here */}
            </DialogContent>
          </Dialog>

          {!isClientView && (
            <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Workflow className="w-4 h-4" />
                  New Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Workflow</DialogTitle>
                  <DialogDescription>
                    Set up a new workflow template
                  </DialogDescription>
                </DialogHeader>
                {/* Workflow creation form would go here */}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Workflows</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-2 p-4">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      onClick={() => setSelectedWorkflow(workflow)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {workflow.name}
                        </h4>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium">{Math.round(workflow.progress)}%</span>
                        </div>
                        <Progress value={workflow.progress} className="h-2" />
                      </div>

                      {workflow.clientName && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Client: {workflow.clientName}
                        </p>
                      )}

                      {workflow.dueDate && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Due: {formatDate(workflow.dueDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedWorkflow ? (
            <div className="space-y-6">
              {/* Workflow Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedWorkflow.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {selectedWorkflow.description}
                      </p>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Progress</Label>
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{Math.round(selectedWorkflow.progress)}%</span>
                              <span className="text-gray-500">
                                {tasks.filter(t => t.workflowId === selectedWorkflow.id && t.status === 'completed').length} / {tasks.filter(t => t.workflowId === selectedWorkflow.id).length} tasks
                              </span>
                            </div>
                            <Progress value={selectedWorkflow.progress} className="h-2" />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500">Assigned To</Label>
                          <p className="text-sm font-medium mt-1">
                            {selectedWorkflow.assignedToName || 'Unassigned'}
                          </p>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500">Due Date</Label>
                          <p className="text-sm font-medium mt-1">
                            {selectedWorkflow.dueDate ? formatDate(selectedWorkflow.dueDate) : 'No due date'}
                          </p>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500">Priority</Label>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={getPriorityColor(selectedWorkflow.priority)}>
                              {getPriorityIcon(selectedWorkflow.priority)}
                            </span>
                            <span className="text-sm font-medium capitalize">
                              {selectedWorkflow.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedWorkflow.status)}>
                        {selectedWorkflow.status}
                      </Badge>
                      {!isClientView && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Workflow
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="w-4 h-4 mr-2" />
                              Manage Team
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Zap className="w-4 h-4 mr-2" />
                              Automation Rules
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search tasks..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Assignees</SelectItem>
                          <SelectItem value="user1">John Smith</SelectItem>
                          <SelectItem value="user2">Sarah Miller</SelectItem>
                          <SelectItem value="client1">Sarah Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Task Views */}
              {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {kanbanColumns.map((column) => (
                    <Card key={column.id} className="h-fit">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {column.title}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {column.tasks.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <AnimatePresence>
                          {column.tasks.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                    {task.title}
                                  </h4>
                                  <div className={getPriorityColor(task.priority)}>
                                    {getPriorityIcon(task.priority)}
                                  </div>
                                </div>

                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {task.description}
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    {getTaskIcon(task.type)}
                                    <span className="text-xs text-gray-500">
                                      {task.type.replace('_', ' ')}
                                    </span>
                                  </div>

                                  {task.assigneeId && (
                                    <Avatar className="w-5 h-5">
                                      <AvatarImage src={task.assigneeAvatar} alt={task.assigneeName} />
                                      <AvatarFallback className="text-xs">
                                        {task.assigneeName?.split(' ').map(n => n[0]).join('') || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>

                                {task.dueDate && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(task.dueDate)}</span>
                                  </div>
                                )}

                                {task.checklist.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>
                                      {task.checklist.filter(item => item.isCompleted).length}/{task.checklist.length}
                                    </span>
                                  </div>
                                )}

                                {task.comments.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{task.comments.length}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {column.tasks.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Square className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No tasks</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {viewMode === 'list' && (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <Checkbox
                                checked={task.status === 'completed'}
                                onCheckedChange={(checked) => {
                                  updateTaskStatus(task.id, checked ? 'completed' : 'pending')
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />

                              <div className="flex items-center gap-2">
                                {getTaskIcon(task.type)}
                                <div>
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                    {task.title}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {task.description}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>

                              <div className={getPriorityColor(task.priority)}>
                                {getPriorityIcon(task.priority)}
                              </div>

                              {task.assigneeId && (
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={task.assigneeAvatar} alt={task.assigneeName} />
                                  <AvatarFallback className="text-xs">
                                    {task.assigneeName?.split(' ').map(n => n[0]).join('') || '?'}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              {task.dueDate && (
                                <div className="text-xs text-gray-500">
                                  {formatDate(task.dueDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredTasks.length === 0 && (
                      <div className="text-center py-12">
                        <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No tasks found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your filters or create a new task
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Workflow className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Workflow
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a workflow from the sidebar to view its tasks and progress
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask && getTaskIcon(selectedTask.type)}
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              {/* Task Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(value: any) => updateTaskStatus(selectedTask.id, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={getPriorityColor(selectedTask.priority)}>
                      {getPriorityIcon(selectedTask.priority)}
                    </span>
                    <span className="capitalize">{selectedTask.priority}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Assignee</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedTask.assigneeId && (
                      <>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={selectedTask.assigneeAvatar} alt={selectedTask.assigneeName} />
                          <AvatarFallback className="text-xs">
                            {selectedTask.assigneeName?.split(' ').map(n => n[0]).join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedTask.assigneeName}</span>
                      </>
                    )}
                    {!selectedTask.assigneeId && (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Due Date</Label>
                  <p className="mt-1">
                    {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'No due date'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm text-gray-500">Description</Label>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {selectedTask.description}
                </p>
              </div>

              {/* Checklist */}
              {selectedTask.checklist.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Checklist</Label>
                  <div className="space-y-2 mt-2">
                    {selectedTask.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={item.isCompleted}
                          onCheckedChange={(checked) => {
                            // Update checklist item
                          }}
                        />
                        <span className={`text-sm ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <Label className="text-sm text-gray-500">
                  Comments ({selectedTask.comments.length})
                </Label>
                <ScrollArea className="h-32 mt-2">
                  <div className="space-y-3">
                    {selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                          <AvatarFallback className="text-xs">
                            {comment.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs">{comment.userName}</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 mt-3">
                  <Textarea
                    placeholder="Add a comment..."
                    className="resize-none"
                    rows={2}
                  />
                  <Button size="sm">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}