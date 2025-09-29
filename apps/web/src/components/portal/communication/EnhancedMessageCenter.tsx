'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  Search,
  Filter,
  MessageCircle,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Video,
  Settings,
  Archive,
  Star,
  MoreVertical,
  Image,
  File,
  Calendar,
  Plus,
  X,
  Minimize2,
  Maximize2,
  Bot,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Forward,
  Bookmark,
  Hash,
  AtSign,
  Smile,
  Mic,
  Camera,
  MapPin,
  Share,
  Edit,
  Copy,
  Flag,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Thread
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EnhancedMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  receiverId?: string
  threadId: string
  content: string
  type: 'text' | 'file' | 'image' | 'system' | 'ai_suggestion' | 'smart_reply'
  timestamp: string
  isRead: boolean
  attachments?: MessageAttachment[]
  replyTo?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  reactions?: MessageReaction[]
  mentions?: string[]
  hashtags?: string[]
  isBookmarked?: boolean
  isForwarded?: boolean
  editedAt?: string
  aiContext?: {
    confidence: number
    suggestedReplies: string[]
    extractedEntities: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
  }
}

interface MessageReaction {
  emoji: string
  userId: string
  userName: string
  timestamp: string
}

interface MessageAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  previewable?: boolean
}

interface MessageThread {
  id: string
  name: string
  type: 'direct' | 'group' | 'client' | 'ai_assistant'
  participants: Participant[]
  lastMessage?: EnhancedMessage
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  isMuted: boolean
  tags: string[]
  clientId?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'active' | 'inactive' | 'resolved' | 'escalated'
  metadata?: {
    category: string
    customFields: Record<string, any>
    lastActivity: string
    responseTime: number
  }
}

interface Participant {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'client' | 'cpa' | 'staff' | 'admin' | 'ai'
  isOnline: boolean
  lastSeen?: string
  permissions?: string[]
  isTyping?: boolean
}

interface SmartSuggestion {
  id: string
  type: 'quick_reply' | 'action' | 'template' | 'follow_up'
  content: string
  confidence: number
  context: string
  icon?: React.ComponentType<{ className?: string }>
}

interface EnhancedMessageCenterProps {
  currentUserId: string
  isMinimized?: boolean
  onToggleMinimize?: () => void
  onClose?: () => void
  enableAI?: boolean
  enableSmartReplies?: boolean
  enableThreading?: boolean
  className?: string
}

// Enhanced mock data with AI features
const mockThreads: MessageThread[] = [
  {
    id: '1',
    name: 'Johnson Corp - Tax Review',
    type: 'client',
    participants: [
      {
        id: 'client1',
        name: 'Sarah Johnson',
        email: 'sarah@johnsoncorp.com',
        avatar: '/avatars/sarah.jpg',
        role: 'client',
        isOnline: true
      },
      {
        id: 'ai1',
        name: 'AI Assistant',
        email: 'ai@advisoros.com',
        role: 'ai',
        isOnline: true
      }
    ],
    lastMessage: {
      id: 'msg1',
      senderId: 'client1',
      senderName: 'Sarah Johnson',
      threadId: '1',
      content: 'Hi! I have a question about the Q2 tax documents you requested. Can you clarify which specific forms you need?',
      type: 'text',
      timestamp: '2024-06-15T14:30:00Z',
      isRead: false,
      priority: 'normal',
      status: 'sent',
      aiContext: {
        confidence: 0.89,
        suggestedReplies: [
          'I need your Q2 profit & loss statement and balance sheet.',
          'Let me send you a detailed list of required documents.',
          'Would you like to schedule a call to discuss this?'
        ],
        extractedEntities: ['Q2 tax documents', 'forms'],
        sentiment: 'neutral'
      }
    },
    unreadCount: 3,
    isPinned: true,
    isArchived: false,
    isMuted: false,
    tags: ['tax', 'urgent', 'q2'],
    clientId: 'client1',
    priority: 'high',
    status: 'active',
    metadata: {
      category: 'Tax Services',
      customFields: { fiscalYear: '2024', quarter: 'Q2' },
      lastActivity: '2024-06-15T14:30:00Z',
      responseTime: 120 // minutes
    }
  },
  {
    id: '2',
    name: 'ABC Manufacturing',
    type: 'client',
    participants: [
      {
        id: 'client2',
        name: 'Mike Chen',
        email: 'mike@abcmfg.com',
        role: 'client',
        isOnline: false,
        lastSeen: '2024-06-15T12:00:00Z'
      }
    ],
    lastMessage: {
      id: 'msg2',
      senderId: 'cpa1',
      senderName: 'You',
      threadId: '2',
      content: 'Thanks for sending the financial statements. I\'ll review them by EOD and get back to you with any questions.',
      type: 'text',
      timestamp: '2024-06-14T16:45:00Z',
      isRead: true,
      priority: 'normal',
      status: 'read'
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    tags: ['financials', 'review'],
    clientId: 'client2',
    priority: 'normal',
    status: 'active',
    metadata: {
      category: 'Financial Review',
      customFields: { reportType: 'monthly' },
      lastActivity: '2024-06-14T16:45:00Z',
      responseTime: 45
    }
  },
  {
    id: 'ai_assistant',
    name: 'AI Assistant',
    type: 'ai_assistant',
    participants: [
      {
        id: 'ai1',
        name: 'AI Assistant',
        email: 'ai@advisoros.com',
        role: 'ai',
        isOnline: true
      }
    ],
    lastMessage: {
      id: 'ai_msg1',
      senderId: 'ai1',
      senderName: 'AI Assistant',
      threadId: 'ai_assistant',
      content: 'I\'ve analyzed your recent client conversations and identified 3 follow-up opportunities. Would you like me to draft response templates?',
      type: 'ai_suggestion',
      timestamp: '2024-06-15T15:00:00Z',
      isRead: false,
      priority: 'normal',
      status: 'sent'
    },
    unreadCount: 1,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    tags: ['ai', 'insights', 'suggestions'],
    priority: 'normal',
    status: 'active',
    metadata: {
      category: 'AI Insights',
      customFields: {},
      lastActivity: '2024-06-15T15:00:00Z',
      responseTime: 0
    }
  }
]

const mockMessages: EnhancedMessage[] = [
  {
    id: 'msg1',
    senderId: 'client1',
    senderName: 'Sarah Johnson',
    threadId: '1',
    content: 'Hi! I have a question about the Q2 tax documents you requested. Can you clarify which specific forms you need?',
    type: 'text',
    timestamp: '2024-06-15T14:30:00Z',
    isRead: false,
    priority: 'normal',
    status: 'sent',
    mentions: ['@you'],
    hashtags: ['#q2tax'],
    aiContext: {
      confidence: 0.89,
      suggestedReplies: [
        'I need your Q2 profit & loss statement and balance sheet.',
        'Let me send you a detailed list of required documents.',
        'Would you like to schedule a call to discuss this?'
      ],
      extractedEntities: ['Q2 tax documents', 'forms'],
      sentiment: 'neutral'
    }
  },
  {
    id: 'msg2',
    senderId: 'client1',
    senderName: 'Sarah Johnson',
    threadId: '1',
    content: 'I want to make sure I provide everything you need for the review.',
    type: 'text',
    timestamp: '2024-06-15T14:32:00Z',
    isRead: false,
    priority: 'normal',
    status: 'sent',
    reactions: [
      { emoji: '👍', userId: 'cpa1', userName: 'You', timestamp: '2024-06-15T14:35:00Z' }
    ]
  },
  {
    id: 'ai_suggestion_1',
    senderId: 'ai1',
    senderName: 'AI Assistant',
    threadId: '1',
    content: 'I can help draft a response with the specific document requirements. Based on Sarah\'s business type, she\'ll need: Form 1120S, supporting schedules, and Q2 bank statements.',
    type: 'ai_suggestion',
    timestamp: '2024-06-15T14:33:00Z',
    isRead: false,
    priority: 'normal',
    status: 'sent',
    aiContext: {
      confidence: 0.95,
      suggestedReplies: ['Use this suggestion', 'Modify and send', 'Create custom response'],
      extractedEntities: ['Form 1120S', 'schedules', 'bank statements'],
      sentiment: 'helpful'
    }
  }
]

const smartSuggestions: SmartSuggestion[] = [
  {
    id: 'quick1',
    type: 'quick_reply',
    content: 'Thanks for reaching out! I\'ll get back to you within 24 hours.',
    confidence: 0.9,
    context: 'Standard acknowledgment',
    icon: Clock
  },
  {
    id: 'quick2',
    type: 'quick_reply',
    content: 'Let me review this and schedule a call to discuss.',
    confidence: 0.85,
    context: 'Complex inquiry response',
    icon: Calendar
  },
  {
    id: 'action1',
    type: 'action',
    content: 'Schedule follow-up meeting',
    confidence: 0.8,
    context: 'Based on conversation context',
    icon: Calendar
  },
  {
    id: 'template1',
    type: 'template',
    content: 'Use tax document checklist template',
    confidence: 0.92,
    context: 'Document request detected',
    icon: File
  }
]

const emojiReactions = ['👍', '👎', '❤️', '😊', '😮', '😢', '😡', '🔥', '🎉', '✅']

export function EnhancedMessageCenter({
  currentUserId,
  isMinimized = false,
  onToggleMinimize,
  onClose,
  enableAI = true,
  enableSmartReplies = true,
  enableThreading = true,
  className
}: EnhancedMessageCenterProps) {
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(mockThreads[0])
  const [messages, setMessages] = useState<EnhancedMessage[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null)
  const [showAISidebar, setShowAISidebar] = useState(enableAI)
  const [threads, setThreads] = useState<MessageThread[]>(mockThreads)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedThread) return

    const message: EnhancedMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      threadId: selectedThread.id,
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: true,
      priority: 'normal',
      status: 'sending',
      replyTo: replyToMessage || undefined
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setReplyToMessage(null)

    // Update thread's last message
    setThreads(prev => prev.map(thread =>
      thread.id === selectedThread.id
        ? { ...thread, lastMessage: message }
        : thread
    ))

    // Simulate AI analysis if enabled
    if (enableAI && selectedThread.type !== 'ai_assistant') {
      setTimeout(() => {
        const aiSuggestion: EnhancedMessage = {
          id: `ai_${Date.now()}`,
          senderId: 'ai1',
          senderName: 'AI Assistant',
          threadId: selectedThread.id,
          content: `I noticed you mentioned "${newMessage.split(' ').slice(0, 3).join(' ')}...". Would you like me to suggest a follow-up action or draft a template for similar inquiries?`,
          type: 'ai_suggestion',
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'low',
          status: 'sent',
          aiContext: {
            confidence: 0.75,
            suggestedReplies: ['Yes, create template', 'Suggest follow-up', 'No thanks'],
            extractedEntities: [],
            sentiment: 'helpful'
          }
        }

        if (Math.random() > 0.3) { // 70% chance to show AI suggestion
          setMessages(prev => [...prev, aiSuggestion])
        }
      }, 2000)
    }

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === message.id ? { ...m, status: 'sent' } : m
      ))
    }, 500)

    setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === message.id ? { ...m, status: 'delivered' } : m
      ))
    }, 1000)
  }, [newMessage, selectedThread, currentUserId, replyToMessage, enableAI])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow new line
    } else {
      // Simulate typing indicator
      if (!isTyping && selectedThread) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }
    }
  }

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(message => {
      if (message.id === messageId) {
        const existingReaction = message.reactions?.find(r => r.emoji === emoji && r.userId === currentUserId)
        if (existingReaction) {
          // Remove reaction
          return {
            ...message,
            reactions: message.reactions?.filter(r => !(r.emoji === emoji && r.userId === currentUserId))
          }
        } else {
          // Add reaction
          const newReaction: MessageReaction = {
            emoji,
            userId: currentUserId,
            userName: 'You',
            timestamp: new Date().toISOString()
          }
          return {
            ...message,
            reactions: [...(message.reactions || []), newReaction]
          }
        }
      }
      return message
    }))
    setShowReactionPicker(null)
  }

  const toggleBookmark = (messageId: string) => {
    setMessages(prev => prev.map(message =>
      message.id === messageId
        ? { ...message, isBookmarked: !message.isBookmarked }
        : message
    ))
  }

  const useSmartReply = (suggestion: string) => {
    setNewMessage(suggestion)
    messageInputRef.current?.focus()
  }

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'unread' && thread.unreadCount > 0) ||
      (activeTab === 'pinned' && thread.isPinned) ||
      (activeTab === 'archived' && thread.isArchived) ||
      (activeTab === 'ai' && thread.type === 'ai_assistant')
    const matchesStatus = filterStatus === 'all' || thread.status === filterStatus

    return matchesSearch && matchesTab && matchesStatus
  })

  const getMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: EnhancedMessage['status']) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-gray-400" />
      case 'sent': return <CheckCircle2 className="w-3 h-3 text-gray-400" />
      case 'delivered': return <CheckCircle2 className="w-3 h-3 text-blue-500" />
      case 'read': return <CheckCircle2 className="w-3 h-3 text-green-500" />
      case 'failed': return <AlertCircle className="w-3 h-3 text-red-500" />
      default: return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'normal': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
      case 'low': return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  const currentMessages = selectedThread
    ? messages.filter(m => m.threadId === selectedThread.id)
    : []

  const threadMessages = enableThreading
    ? currentMessages.reduce((acc, message) => {
        if (message.replyTo) {
          const parentIndex = acc.findIndex(m => m.id === message.replyTo)
          if (parentIndex !== -1) {
            if (!acc[parentIndex].replies) acc[parentIndex].replies = []
            acc[parentIndex].replies!.push(message)
            return acc
          }
        }
        return [...acc, message]
      }, [] as (EnhancedMessage & { replies?: EnhancedMessage[] })[])
    : currentMessages

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Messages</span>
                {threads.reduce((sum, thread) => sum + thread.unreadCount, 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {threads.reduce((sum, thread) => sum + thread.unreadCount, 0)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleMinimize}
                        className="h-6 w-6 p-0"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Expand</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Card className="w-[800px] h-[700px] shadow-xl flex">
        {/* Main Message Area */}
        <div className="flex-1 flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Enhanced Message Center</span>
                {enableAI && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                    <Bot className="w-3 h-3 mr-1" />
                    AI Powered
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {enableAI && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAISidebar(!showAISidebar)}
                          className="h-6 w-6 p-0"
                        >
                          <Zap className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle AI Assistant</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleMinimize}
                        className="h-6 w-6 p-0"
                      >
                        <Minimize2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Minimize</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>

          <div className="flex h-[calc(700px-80px)]">
            {/* Thread List */}
            <div className="w-72 border-r flex flex-col bg-gray-50 dark:bg-gray-900/50">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid w-full grid-cols-4 h-9 m-2 text-xs">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">
                    Unread
                    {threads.filter(t => t.unreadCount > 0).length > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs h-4 w-4 p-0 text-[10px]">
                        {threads.filter(t => t.unreadCount > 0).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pinned" className="text-xs">Pinned</TabsTrigger>
                  {enableAI && (
                    <TabsTrigger value="ai" className="text-xs">
                      <Bot className="w-3 h-3" />
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value={activeTab} className="flex-1 mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-1 p-2">
                      {filteredThreads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => setSelectedThread(thread)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer text-sm transition-all border-l-2",
                            selectedThread?.id === thread.id
                              ? "bg-white dark:bg-gray-800 shadow-sm border-l-blue-500"
                              : "hover:bg-white/50 dark:hover:bg-gray-800/50 border-l-transparent",
                            thread.priority === 'urgent' && "border-l-red-500",
                            thread.priority === 'high' && "border-l-orange-500",
                            thread.isPinned && "bg-yellow-50 dark:bg-yellow-900/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {thread.type === 'ai_assistant' && (
                                <Bot className="w-4 h-4 text-purple-500" />
                              )}
                              <span className="font-medium truncate flex-1 text-gray-900 dark:text-white">
                                {thread.name}
                              </span>
                              {thread.isPinned && (
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {thread.isMuted && (
                                <VolumeX className="w-3 h-3 text-gray-400" />
                              )}
                              {thread.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs h-4 min-w-[16px] p-0 text-[10px]">
                                  {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 mb-1">
                            {thread.participants
                              .filter(p => p.role !== 'ai')
                              .slice(0, 3)
                              .map(participant => (
                                <div key={participant.id} className="flex items-center space-x-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    participant.isOnline ? "bg-green-500" : "bg-gray-400"
                                  )} />
                                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {participant.name.split(' ')[0]}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {thread.lastMessage && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {thread.lastMessage.type === 'ai_suggestion' && (
                                  <Zap className="w-3 h-3 inline mr-1 text-purple-500" />
                                )}
                                {thread.lastMessage.content}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {getMessageTime(thread.lastMessage.timestamp)}
                                </span>
                                {thread.lastMessage.aiContext && (
                                  <Badge variant="outline" className="text-xs h-4">
                                    AI: {Math.round(thread.lastMessage.aiContext.confidence * 100)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {thread.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {thread.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs h-4">
                                  {tag}
                                </Badge>
                              ))}
                              {thread.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs h-4">
                                  +{thread.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Message Area */}
            <div className="flex-1 flex flex-col">
              {selectedThread ? (
                <>
                  {/* Thread Header */}
                  <div className="p-4 border-b bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {selectedThread.type === 'ai_assistant' ? (
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        ) : (
                          <div className="flex -space-x-2">
                            {selectedThread.participants.slice(0, 2).map(participant => (
                              <Avatar key={participant.id} className="w-8 h-8 border-2 border-white dark:border-gray-800">
                                <AvatarImage src={participant.avatar} />
                                <AvatarFallback className="text-xs">
                                  {participant.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                            {selectedThread.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Badge variant="outline" className={getPriorityColor(selectedThread.priority)}>
                              {selectedThread.priority}
                            </Badge>
                            <span>•</span>
                            <span>{selectedThread.participants.length} participants</span>
                            {selectedThread.metadata?.responseTime && (
                              <>
                                <span>•</span>
                                <span>Avg response: {selectedThread.metadata.responseTime}m</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Phone className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Start call</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Video className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Start video call</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Star className="w-4 h-4 mr-2" />
                              {selectedThread.isPinned ? 'Unpin' : 'Pin'} conversation
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {selectedThread.isMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                              {selectedThread.isMuted ? 'Unmute' : 'Mute'} notifications
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive conversation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Flag className="w-4 h-4 mr-2" />
                              Mark as priority
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {threadMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <MessageCard
                              message={message}
                              currentUserId={currentUserId}
                              onReact={addReaction}
                              onReply={setReplyToMessage}
                              onBookmark={toggleBookmark}
                              showReactionPicker={showReactionPicker}
                              setShowReactionPicker={setShowReactionPicker}
                              enableAI={enableAI}
                              enableThreading={enableThreading}
                            />

                            {/* Threaded replies */}
                            {enableThreading && message.replies && message.replies.length > 0 && (
                              <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                {message.replies.map(reply => (
                                  <MessageCard
                                    key={reply.id}
                                    message={reply}
                                    currentUserId={currentUserId}
                                    onReact={addReaction}
                                    onReply={setReplyToMessage}
                                    onBookmark={toggleBookmark}
                                    showReactionPicker={showReactionPicker}
                                    setShowReactionPicker={setShowReactionPicker}
                                    enableAI={enableAI}
                                    enableThreading={false} // Prevent nested threading
                                    isReply={true}
                                  />
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Typing Indicator */}
                      {typingUsers.length > 0 && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-xs">
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                              <span className="text-sm text-gray-500">
                                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Smart Suggestions */}
                  {enableSmartReplies && showSmartSuggestions && selectedThread.type !== 'ai_assistant' && (
                    <div className="px-4 py-2 border-t bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Smart Suggestions
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSmartSuggestions(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {smartSuggestions.slice(0, 3).map(suggestion => {
                          const Icon = suggestion.icon
                          return (
                            <Button
                              key={suggestion.id}
                              variant="outline"
                              size="sm"
                              onClick={() => useSmartReply(suggestion.content)}
                              className="text-xs h-7"
                            >
                              {Icon && <Icon className="w-3 h-3 mr-1" />}
                              {suggestion.content}
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reply Context */}
                  {replyToMessage && (
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Reply className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            Replying to message
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyToMessage(null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-4 border-t bg-white dark:bg-gray-800">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Textarea
                          ref={messageInputRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="resize-none text-sm min-h-[40px] max-h-[120px]"
                          rows={1}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-8 w-8 p-0"
                              >
                                <Paperclip className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Attach file</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Smile className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add emoji</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          size="sm"
                          className="h-8"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      // Handle file upload
                      console.log('Files selected:', e.target.files)
                    }}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a conversation from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        {enableAI && showAISidebar && (
          <div className="w-64 border-l bg-purple-50 dark:bg-purple-900/10 p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
              </div>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Conversation Insights</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {selectedThread?.lastMessage?.aiContext && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span>Sentiment:</span>
                        <Badge variant="outline" className={cn(
                          selectedThread.lastMessage.aiContext.sentiment === 'positive' && 'text-green-600',
                          selectedThread.lastMessage.aiContext.sentiment === 'negative' && 'text-red-600',
                          selectedThread.lastMessage.aiContext.sentiment === 'neutral' && 'text-gray-600'
                        )}>
                          {selectedThread.lastMessage.aiContext.sentiment}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Confidence:</span>
                        <span>{Math.round(selectedThread.lastMessage.aiContext.confidence * 100)}%</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Suggested Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {smartSuggestions.filter(s => s.type === 'action').map(action => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                    >
                      {action.icon && <action.icon className="w-3 h-3 mr-2" />}
                      {action.content}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Quick Templates</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {smartSuggestions.filter(s => s.type === 'template').map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => useSmartReply(template.content)}
                    >
                      {template.icon && <template.icon className="w-3 h-3 mr-2" />}
                      {template.content}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

// Helper component for individual messages
function MessageCard({
  message,
  currentUserId,
  onReact,
  onReply,
  onBookmark,
  showReactionPicker,
  setShowReactionPicker,
  enableAI,
  enableThreading,
  isReply = false
}: {
  message: EnhancedMessage & { replies?: EnhancedMessage[] }
  currentUserId: string
  onReact: (messageId: string, emoji: string) => void
  onReply: (messageId: string) => void
  onBookmark: (messageId: string) => void
  showReactionPicker: string | null
  setShowReactionPicker: (id: string | null) => void
  enableAI: boolean
  enableThreading: boolean
  isReply?: boolean
}) {
  const isOwnMessage = message.senderId === currentUserId
  const isAIMessage = message.type === 'ai_suggestion'

  return (
    <div className={cn(
      "group relative",
      isOwnMessage ? "flex justify-end" : "flex justify-start",
      isReply && "text-sm"
    )}>
      <div className={cn(
        "max-w-[70%] space-y-1",
        isOwnMessage && "order-2"
      )}>
        {/* Message bubble */}
        <div className={cn(
          "relative rounded-lg px-4 py-3 text-sm",
          isOwnMessage && !isAIMessage
            ? "bg-blue-600 text-white"
            : isAIMessage
            ? "bg-purple-100 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
          message.isBookmarked && "ring-2 ring-yellow-200 dark:ring-yellow-800"
        )}>
          {/* Message header for non-own messages */}
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {message.senderName}
              </span>
              {isAIMessage && (
                <Badge variant="secondary" className="text-xs h-4">
                  <Bot className="w-3 h-3 mr-1" />
                  AI
                </Badge>
              )}
              {message.priority !== 'normal' && (
                <Badge variant="outline" className="text-xs h-4">
                  {message.priority}
                </Badge>
              )}
            </div>
          )}

          {/* Reply context */}
          {message.replyTo && (
            <div className="text-xs opacity-75 mb-2 p-2 bg-black/10 dark:bg-white/10 rounded">
              <Reply className="w-3 h-3 inline mr-1" />
              Replying to message
            </div>
          )}

          {/* Message content */}
          <div>{message.content}</div>

          {/* Mentions and hashtags */}
          {(message.mentions || message.hashtags) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.mentions?.map((mention, index) => (
                <Badge key={index} variant="secondary" className="text-xs h-4">
                  <AtSign className="w-3 h-3 mr-1" />
                  {mention}
                </Badge>
              ))}
              {message.hashtags?.map((hashtag, index) => (
                <Badge key={index} variant="secondary" className="text-xs h-4">
                  <Hash className="w-3 h-3 mr-1" />
                  {hashtag}
                </Badge>
              ))}
            </div>
          )}

          {/* AI context for AI messages */}
          {isAIMessage && message.aiContext && (
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
              <div className="flex flex-wrap gap-1">
                {message.aiContext.suggestedReplies.slice(0, 2).map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 text-purple-700 dark:text-purple-300"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Message actions */}
          <div className={cn(
            "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isOwnMessage ? "-left-20" : "-right-20"
          )}>
            <Popover
              open={showReactionPicker === message.id}
              onOpenChange={(open) => setShowReactionPicker(open ? message.id : null)}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white dark:bg-gray-800 shadow-sm">
                  <Smile className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="center">
                <div className="flex gap-1">
                  {emojiReactions.map(emoji => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => onReact(message.id, emoji)}
                      className="h-8 w-8 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {enableThreading && !isReply && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReply(message.id)}
                      className="h-6 w-6 p-0 bg-white dark:bg-gray-800 shadow-sm"
                    >
                      <Reply className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reply</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBookmark(message.id)}
                    className="h-6 w-6 p-0 bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <Bookmark className={cn(
                      "w-3 h-3",
                      message.isBookmarked && "fill-current text-yellow-500"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bookmark</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-2">
            {message.reactions.reduce((acc, reaction) => {
              const existing = acc.find(r => r.emoji === reaction.emoji)
              if (existing) {
                existing.count++
                existing.users.push(reaction.userName)
              } else {
                acc.push({
                  emoji: reaction.emoji,
                  count: 1,
                  users: [reaction.userName]
                })
              }
              return acc
            }, [] as { emoji: string; count: number; users: string[] }[]).map(({ emoji, count, users }) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => onReact(message.id, emoji)}
              >
                {emoji} {count}
              </Button>
            ))}
          </div>
        )}

        {/* Message metadata */}
        <div className={cn(
          "flex items-center gap-2 text-xs px-2",
          isOwnMessage ? "justify-end text-gray-500" : "justify-start text-gray-500"
        )}>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.editedAt && (
            <span className="text-gray-400">(edited)</span>
          )}
          {isOwnMessage && (
            <div className="flex items-center gap-1">
              {message.status === 'sending' && <Clock className="w-3 h-3" />}
              {message.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
              {message.status === 'delivered' && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
              {message.status === 'read' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
              {message.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}