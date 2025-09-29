import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import {
  DashboardLayout,
  defaultNavigationItems,
  KPICard,
  RevenueChart,
  Grid,
  TaskBoard,
  WorkflowDesigner,
  workflowTemplates,
  ChartContainer,
  Button,
  Badge,
} from './index'

const meta: Meta = {
  title: 'Demo/Complete Dashboard',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

// Sample data
const revenueData = [
  { month: 'Jan', revenue: 120000, expenses: 80000, profit: 40000 },
  { month: 'Feb', revenue: 135000, expenses: 85000, profit: 50000 },
  { month: 'Mar', revenue: 148000, expenses: 92000, profit: 56000 },
  { month: 'Apr', revenue: 162000, expenses: 98000, profit: 64000 },
  { month: 'May', revenue: 175000, expenses: 105000, profit: 70000 },
  { month: 'Jun', revenue: 188000, expenses: 112000, profit: 76000 },
]

const currentUser = {
  id: 'user-1',
  name: 'John Smith',
  avatar: '',
  isActive: true,
}

const onlineUsers = [
  { id: 'user-2', name: 'Sarah Johnson', color: '#3B82F6', isActive: true },
  { id: 'user-3', name: 'Mike Chen', color: '#10B981', isActive: true },
  { id: 'user-4', name: 'Emily Davis', color: '#F59E0B', isActive: true },
]

const notifications = [
  {
    id: '1',
    title: 'New client document uploaded',
    message: 'Tax return for ABC Corp has been uploaded for review',
    read: false,
    timestamp: new Date(),
  },
  {
    id: '2',
    title: 'Workflow completed',
    message: 'Client onboarding workflow for XYZ LLC has been completed',
    read: false,
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '3',
    title: 'Payment received',
    message: 'Invoice #1234 has been paid by DEF Corp',
    read: true,
    timestamp: new Date(Date.now() - 7200000),
  },
]

const taskColumns = [
  {
    id: 'todo',
    title: 'To Do',
    status: 'todo' as const,
    tasks: [
      {
        id: '1',
        title: 'Review Q4 financial statements',
        description: 'Complete review of quarterly financials for ABC Corp',
        status: 'todo' as const,
        priority: 'high' as const,
        dueDate: new Date('2024-01-15'),
        assignee: { id: '1', name: 'John Smith' },
        tags: ['review', 'financial-statements'],
        estimatedHours: 4,
      },
      {
        id: '2',
        title: 'Prepare tax documents',
        status: 'todo' as const,
        priority: 'medium' as const,
        dueDate: new Date('2024-01-20'),
        assignee: { id: '2', name: 'Sarah Johnson' },
        tags: ['tax-prep', 'documents'],
        estimatedHours: 6,
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    status: 'in-progress' as const,
    tasks: [
      {
        id: '3',
        title: 'Client consultation call',
        status: 'in-progress' as const,
        priority: 'urgent' as const,
        assignee: { id: '1', name: 'John Smith' },
        tags: ['consultation', 'client-meeting'],
        estimatedHours: 2,
      },
    ],
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'completed' as const,
    tasks: [
      {
        id: '4',
        title: 'Invoice generation',
        status: 'completed' as const,
        priority: 'low' as const,
        assignee: { id: '3', name: 'Mike Chen' },
        tags: ['invoicing', 'billing'],
        estimatedHours: 1,
        actualHours: 0.5,
      },
    ],
  },
]

export const CompleteDashboard: StoryObj = {
  render: () => (
    <DashboardLayout
      navigationItems={defaultNavigationItems}
      currentUser={currentUser}
      onlineUsers={onlineUsers}
      notifications={notifications}
      onNavigate={(href) => console.log('Navigate to:', href)}
      onLogout={() => console.log('Logout')}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {currentUser.name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">Export Report</Button>
            <Button>Add Client</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <Grid cols={{ default: 1, md: 2, lg: 4 }} gap={6}>
          <KPICard
            title="Monthly Revenue"
            value={188000}
            format="currency"
            trend={{ value: 12.5, isPositive: true, period: 'last month' }}
            size="md"
          />
          <KPICard
            title="Active Clients"
            value={87}
            trend={{ value: 8, isPositive: true, period: 'last month' }}
            size="md"
          />
          <KPICard
            title="Tasks Completed"
            value={142}
            trend={{ value: 15, isPositive: true, period: 'this week' }}
            size="md"
          />
          <KPICard
            title="Revenue Growth"
            value={12.5}
            format="percentage"
            trend={{ value: 3.2, isPositive: true, period: 'vs last quarter' }}
            size="md"
          />
        </Grid>

        {/* Charts */}
        <Grid cols={{ default: 1, lg: 2 }} gap={8}>
          <ChartContainer title="Revenue Overview">
            <RevenueChart data={revenueData} height={300} />
          </ChartContainer>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New client onboarded</p>
                  <p className="text-xs text-gray-500">ABC Corp - 5 min ago</p>
                </div>
                <Badge variant="success">Completed</Badge>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Document uploaded</p>
                  <p className="text-xs text-gray-500">Tax return - 12 min ago</p>
                </div>
                <Badge variant="info">Processing</Badge>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment received</p>
                  <p className="text-xs text-gray-500">Invoice #1234 - 1h ago</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            </div>
          </div>
        </Grid>

        {/* Task Board */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Task Management</h3>
            <Button variant="outline" size="sm">
              View All Tasks
            </Button>
          </div>
          <TaskBoard
            columns={taskColumns}
            onTaskMove={(taskId, fromColumn, toColumn, newIndex) =>
              console.log('Task moved:', { taskId, fromColumn, toColumn, newIndex })
            }
            onAddTask={(columnId) => console.log('Add task to:', columnId)}
          />
        </div>
      </div>
    </DashboardLayout>
  ),
}

export const WorkflowDesignerDemo: StoryObj = {
  render: () => (
    <div className="h-screen bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Workflow Designer
        </h1>
        <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
          <WorkflowDesigner
            initialNodes={workflowTemplates[0].nodes}
            initialEdges={workflowTemplates[0].edges}
            onSave={(nodes, edges) =>
              console.log('Saving workflow:', { nodes, edges })
            }
            onExecute={(nodes, edges) =>
              console.log('Executing workflow:', { nodes, edges })
            }
          />
        </div>
      </div>
    </div>
  ),
}