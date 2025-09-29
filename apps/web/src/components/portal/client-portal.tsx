'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  MessageSquare,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Send,
  Paperclip,
  Bell,
  Settings,
  User,
  LogOut,
  Home,
  CreditCard,
  Receipt,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DocumentUpload } from '@/components/documents/document-upload'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ClientPortalProps {
  client: {
    id: string
    businessName: string
    primaryContactName: string
    primaryContactEmail: string
    avatar?: string
  }
  cpa: {
    id: string
    name: string
    email: string
    avatar?: string
    phone?: string
  }
  className?: string
}

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  dueDate: Date
  priority: 'low' | 'medium' | 'high'
  assignedBy: string
  documents?: string[]
}

interface Invoice {
  id: string
  number: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issueDate: Date
  dueDate: Date
  description: string
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
}

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderType: 'client' | 'cpa'
  timestamp: Date
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  read: boolean
}

export function ClientPortal({
  client,
  cpa,
  className
}: ClientPortalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'ve uploaded the Q4 financial statements for your review. Please let me know if you need any additional information.',
      senderId: cpa.id,
      senderName: cpa.name,
      senderType: 'cpa',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true
    },
    {
      id: '2',
      content: 'Thank you! I\'ll review them and get back to you with any questions.',
      senderId: client.id,
      senderName: client.primaryContactName,
      senderType: 'client',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      read: true
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Mock data
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Submit Q4 2024 Bank Statements',
      description: 'Please upload all bank statements for Q4 2024, including checking, savings, and credit card accounts.',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'high',
      assignedBy: cpa.name,
      documents: []
    },
    {
      id: '2',
      title: 'Review and Sign Tax Return',
      description: 'Your 2024 tax return is ready for review. Please review all sections and provide your digital signature.',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      priority: 'medium',
      assignedBy: cpa.name,
      documents: ['tax-return-2024.pdf']
    },
    {
      id: '3',
      title: 'Upload Receipts for Business Expenses',
      description: 'Please upload receipts for all business expenses from December 2024.',
      status: 'completed',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      priority: 'low',
      assignedBy: cpa.name,
      documents: ['receipts-december.zip']
    }
  ]

  const invoices: Invoice[] = [
    {
      id: '1',
      number: 'INV-2024-001',
      amount: 2500,
      status: 'paid',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      description: 'Tax Preparation Services - Q4 2023',
      items: [
        { description: 'Tax Return Preparation', quantity: 1, rate: 2000, amount: 2000 },
        { description: 'Tax Planning Consultation', quantity: 2, rate: 250, amount: 500 }
      ]
    },
    {
      id: '2',
      number: 'INV-2024-002',
      amount: 1800,
      status: 'sent',
      issueDate: new Date('2024-03-01'),
      dueDate: new Date('2024-04-01'),
      description: 'Bookkeeping Services - February 2024',
      items: [
        { description: 'Monthly Bookkeeping', quantity: 1, rate: 1500, amount: 1500 },
        { description: 'Financial Report Generation', quantity: 1, rate: 300, amount: 300 }
      ]
    }
  ]

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: client.id,
      senderName: client.primaryContactName,
      senderType: 'client',
      timestamp: new Date(),
      read: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    toast.success('Message sent')

    // Simulate CPA response after 2 seconds
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Thanks for your message! I\'ll review this and get back to you shortly.',
        senderId: cpa.id,
        senderName: cpa.name,
        senderType: 'cpa',
        timestamp: new Date(),
        read: false
      }
      setMessages(prev => [...prev, response])
    }, 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'overdue': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getInvoiceStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'success'
      case 'sent': return 'warning'
      case 'overdue': return 'error'
      default: return 'neutral'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    }
  }

  const unreadMessagesCount = messages.filter(m => !m.read && m.senderType === 'cpa').length
  const pendingTasksCount = tasks.filter(t => t.status === 'pending' || t.status === 'overdue').length
  const unpaidInvoicesCount = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", className)}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Client Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Client Portal
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {client.businessName}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {(unreadMessagesCount + pendingTasksCount + unpaidInvoicesCount) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadMessagesCount + pendingTasksCount + unpaidInvoicesCount}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback>
                        {client.primaryContactName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">
                      {client.primaryContactName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Tasks</span>
              {pendingTasksCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {pendingTasksCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>Invoices</span>
              {unpaidInvoicesCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {unpaidInvoicesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
              {unreadMessagesCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {unreadMessagesCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={cpa.avatar} />
                    <AvatarFallback>
                      {cpa.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">Welcome, {client.primaryContactName}!</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your CPA: {cpa.name} • {cpa.email}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {tasks.filter(t => t.status === 'completed').length}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Tasks Completed</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-8 h-8 text-yellow-600" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                          {pendingTasksCount}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending Tasks</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {formatCurrency(invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0))}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">Total Paid</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className={cn("w-2 h-2 rounded-full mt-2", getTaskStatusColor(task.status))} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Due: {formatDate(task.dueDate)}
                          </p>
                          <Badge className={cn("text-xs mt-2", getPriorityColor(task.priority))}>
                            {task.priority} priority
                          </Badge>
                        </div>
                        <StatusBadge status={task.status} size="sm" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages.slice(-3).map((message) => (
                      <div key={message.id} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {message.senderName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {message.senderName}
                            </p>
                            <Badge variant={message.senderType === 'cpa' ? 'default' : 'secondary'} className="text-xs">
                              {message.senderType === 'cpa' ? 'CPA' : 'You'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                            {message.content}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {task.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {task.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority} priority
                          </Badge>
                          <StatusBadge status={task.status} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span>Assigned by: {task.assignedBy}</span>
                          <span>Due: {formatDate(task.dueDate)}</span>
                        </div>

                        {task.status === 'pending' && (
                          <Button size="sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </div>

                      {task.documents && task.documents.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Related Documents
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {task.documents.map((doc, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUpload
                  clientId={client.id}
                  onUploadComplete={(files) => {
                    toast.success(`Successfully uploaded ${files.length} document(s)`)
                  }}
                  maxFiles={5}
                  maxFileSize={25}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {invoice.number}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {invoice.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(invoice.amount)}
                          </p>
                          <StatusBadge status={getInvoiceStatusColor(invoice.status)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Issue Date:</span>
                          <span className="ml-2 font-medium">{formatDate(invoice.issueDate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                          <span className="ml-2 font-medium">{formatDate(invoice.dueDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          {invoice.status === 'sent' && (
                            <Button size="sm">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card className="h-96">
              <CardHeader>
                <CardTitle>Messages with {cpa.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                {/* Messages List */}
                <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex",
                          message.senderType === 'client' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-xs lg:max-w-md px-4 py-3 rounded-lg",
                            message.senderType === 'client'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-2",
                              message.senderType === 'client'
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            )}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default ClientPortal