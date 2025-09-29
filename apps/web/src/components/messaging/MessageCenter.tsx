'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Maximize2
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useWebSocket } from '@/hooks/use-websocket'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  receiverId?: string
  threadId: string
  content: string
  type: 'text' | 'file' | 'image' | 'system'
  timestamp: string
  isRead: boolean
  attachments?: MessageAttachment[]
  replyTo?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

interface MessageAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
}

interface MessageThread {
  id: string
  name: string
  type: 'direct' | 'group' | 'client'
  participants: Participant[]
  lastMessage?: Message
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  tags: string[]
  clientId?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'active' | 'inactive' | 'resolved'
}

interface Participant {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'client' | 'cpa' | 'staff' | 'admin'
  isOnline: boolean
  lastSeen?: string
}

interface MessageCenterProps {
  currentUserId: string
  isMinimized?: boolean
  onToggleMinimize?: () => void
  onClose?: () => void
}

// Mock data
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
      }
    ],
    lastMessage: {
      id: 'msg1',
      senderId: 'client1',
      senderName: 'Sarah Johnson',
      threadId: '1',
      content: 'Hi! I have a question about the Q2 tax documents you requested.',
      type: 'text',
      timestamp: '2024-06-15T14:30:00Z',
      isRead: false,
      priority: 'normal',
      status: 'sent'
    },
    unreadCount: 2,
    isPinned: true,
    isArchived: false,
    tags: ['tax', 'urgent'],
    clientId: 'client1',
    priority: 'high',
    status: 'active'
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
      content: 'Thanks for sending the financial statements. I\'ll review them by EOD.',
      type: 'text',
      timestamp: '2024-06-14T16:45:00Z',
      isRead: true,
      priority: 'normal',
      status: 'read'
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    tags: ['financials'],
    clientId: 'client2',
    priority: 'normal',
    status: 'active'
  }
]

const mockMessages: Message[] = [
  {
    id: 'msg1',
    senderId: 'client1',
    senderName: 'Sarah Johnson',
    threadId: '1',
    content: 'Hi! I have a question about the Q2 tax documents you requested.',
    type: 'text',
    timestamp: '2024-06-15T14:30:00Z',
    isRead: false,
    priority: 'normal',
    status: 'sent'
  },
  {
    id: 'msg2',
    senderId: 'client1',
    senderName: 'Sarah Johnson',
    threadId: '1',
    content: 'I noticed you mentioned we need Form 1120S, but I thought we were an LLC?',
    type: 'text',
    timestamp: '2024-06-15T14:32:00Z',
    isRead: false,
    priority: 'normal',
    status: 'sent'
  }
]

export function MessageCenter({
  currentUserId,
  isMinimized = false,
  onToggleMinimize,
  onClose
}: MessageCenterProps) {
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  // WebSocket for real-time messaging
  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/messages',
    onMessage: (message) => {
      if (message.type === 'new_message') {
        setMessages(prev => [...prev, message.data])
        scrollToBottom()
      } else if (message.type === 'typing_start') {
        setTypingUsers(prev => [...prev.filter(u => u !== message.data.userId), message.data.userId])
      } else if (message.type === 'typing_stop') {
        setTypingUsers(prev => prev.filter(u => u !== message.data.userId))
      }
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      threadId: selectedThread.id,
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: true,
      priority: 'normal',
      status: 'sending'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Send via WebSocket
    if (isConnected) {
      sendMessage({
        type: 'send_message',
        data: message
      })
    }

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      sendMessage({
        type: 'typing_stop',
        data: { threadId: selectedThread.id, userId: currentUserId }
      })
    }
  }

  const handleTyping = () => {
    if (!isTyping && selectedThread) {
      setIsTyping(true)
      sendMessage({
        type: 'typing_start',
        data: { threadId: selectedThread.id, userId: currentUserId }
      })

      // Stop typing after 3 seconds of inactivity
      setTimeout(() => {
        setIsTyping(false)
        sendMessage({
          type: 'typing_stop',
          data: { threadId: selectedThread.id, userId: currentUserId }
        })
      }, 3000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else {
      handleTyping()
    }
  }

  const filteredThreads = mockThreads.filter(thread => {
    const matchesSearch = thread.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'unread' && thread.unreadCount > 0) ||
      (activeTab === 'pinned' && thread.isPinned) ||
      (activeTab === 'archived' && thread.isArchived)
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

  const getStatusIcon = (status: Message['status']) => {
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

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Messages</span>
                {mockThreads.reduce((sum, thread) => sum + thread.unreadCount, 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {mockThreads.reduce((sum, thread) => sum + thread.unreadCount, 0)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMinimize}
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 h-[600px] shadow-xl">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Message Center</span>
              {isConnected && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex h-[calc(600px-80px)]">
          {/* Thread List */}
          <div className="w-40 border-r flex flex-col">
            <div className="p-2 border-b">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-2 h-8 text-xs">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread
                  {mockThreads.filter(t => t.unreadCount > 0).length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {mockThreads.filter(t => t.unreadCount > 0).length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-1">
                    {filteredThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedThread(thread)}
                        className={`p-2 rounded cursor-pointer text-xs transition-colors ${
                          selectedThread?.id === thread.id
                            ? 'bg-blue-100 dark:bg-blue-900/20'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate flex-1">
                            {thread.name}
                          </span>
                          {thread.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs h-4">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {thread.lastMessage && (
                          <div className="text-gray-600 dark:text-gray-400 truncate">
                            {thread.lastMessage.content}
                          </div>
                        )}
                        <div className="text-gray-500 text-xs mt-1">
                          {thread.lastMessage && getMessageTime(thread.lastMessage.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="unread" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-1">
                    {filteredThreads.filter(t => t.unreadCount > 0).map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedThread(thread)}
                        className={`p-2 rounded cursor-pointer text-xs transition-colors ${getPriorityColor(thread.priority)} border-l-2`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate flex-1">
                            {thread.name}
                          </span>
                          <Badge variant="destructive" className="text-xs h-4">
                            {thread.unreadCount}
                          </Badge>
                        </div>
                        {thread.lastMessage && (
                          <div className="text-gray-600 dark:text-gray-400 truncate">
                            {thread.lastMessage.content}
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
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{selectedThread.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {selectedThread.participants.map(p => (
                          <div key={p.id} className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Video className="w-3 h-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Star className="w-4 h-4 mr-2" />
                            Pin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.filter(m => m.threadId === selectedThread.id).map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.senderId === currentUserId
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        } rounded-lg p-2 text-xs`}>
                          {message.senderId !== currentUserId && (
                            <div className="font-medium mb-1 text-xs text-gray-600 dark:text-gray-400">
                              {message.senderName}
                            </div>
                          )}
                          <div>{message.content}</div>
                          <div className={`flex items-center justify-between mt-1 text-xs ${
                            message.senderId === currentUserId
                              ? 'text-blue-200'
                              : 'text-gray-500'
                          }`}>
                            <span>{getMessageTime(message.timestamp)}</span>
                            {message.senderId === currentUserId && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-gray-500 ml-2">typing...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="resize-none text-xs"
                        rows={2}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Paperclip className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-4">
                <div>
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                    Select a conversation
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Choose a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}