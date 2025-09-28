'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  Search,
  Filter,
  MessageCircle,
  User,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  Plus,
  X,
  Download,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePortalAuth } from '@/lib/portal-auth'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'client' | 'cpa'
  content: string
  timestamp: string
  isRead: boolean
  attachments?: Attachment[]
  threadId: string
}

interface MessageThread {
  id: string
  subject: string
  participants: Participant[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'resolved' | 'pending'
  messages: Message[]
}

interface Participant {
  id: string
  name: string
  email: string
  role: 'client' | 'cpa'
  avatar?: string
}

interface Attachment {
  id: string
  name: string
  size: string
  type: string
  url: string
}

const sampleParticipants: Participant[] = [
  {
    id: 'cpa-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@cpaplatform.com',
    role: 'cpa',
    avatar: '/avatars/sarah.jpg'
  },
  {
    id: 'client-1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'client'
  }
]

const sampleThreads: MessageThread[] = [
  {
    id: '1',
    subject: 'Q4 Tax Planning Discussion',
    participants: sampleParticipants,
    lastMessage: 'I\'ve reviewed your Q3 financials and have some recommendations for Q4 tax planning...',
    lastMessageTime: '2024-11-01T14:30:00Z',
    unreadCount: 2,
    priority: 'high',
    status: 'active',
    messages: [
      {
        id: 'm1',
        senderId: 'cpa-1',
        senderName: 'Sarah Johnson',
        senderRole: 'cpa',
        content: 'Hi John, I hope you\'re doing well. I\'ve had a chance to review your Q3 financial statements and I\'d like to discuss some tax planning strategies for Q4.',
        timestamp: '2024-11-01T10:00:00Z',
        isRead: true,
        threadId: '1'
      },
      {
        id: 'm2',
        senderId: 'client-1',
        senderName: 'John Smith',
        senderRole: 'client',
        content: 'Hi Sarah, thank you for reaching out. I\'d love to hear your recommendations. What are you thinking?',
        timestamp: '2024-11-01T12:15:00Z',
        isRead: true,
        threadId: '1'
      },
      {
        id: 'm3',
        senderId: 'cpa-1',
        senderName: 'Sarah Johnson',
        senderRole: 'cpa',
        content: 'I\'ve reviewed your Q3 financials and have some recommendations for Q4 tax planning. Given your strong revenue growth, we should consider accelerating some deductible expenses into Q4 and potentially making additional retirement plan contributions.',
        timestamp: '2024-11-01T14:30:00Z',
        isRead: false,
        threadId: '1',
        attachments: [
          {
            id: 'att1',
            name: 'Q4_Tax_Planning_Recommendations.pdf',
            size: '2.1 MB',
            type: 'pdf',
            url: '/documents/q4-tax-planning.pdf'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    subject: 'Document Request - Bank Statements',
    participants: sampleParticipants,
    lastMessage: 'Perfect! I\'ll get those statements uploaded by Friday.',
    lastMessageTime: '2024-10-30T09:45:00Z',
    unreadCount: 0,
    priority: 'medium',
    status: 'pending',
    messages: [
      {
        id: 'm4',
        senderId: 'cpa-1',
        senderName: 'Sarah Johnson',
        senderRole: 'cpa',
        content: 'Hi John, I need your October bank statements for the monthly reconciliation. Could you upload them to the portal when you get a chance?',
        timestamp: '2024-10-30T08:00:00Z',
        isRead: true,
        threadId: '2'
      },
      {
        id: 'm5',
        senderId: 'client-1',
        senderName: 'John Smith',
        senderRole: 'client',
        content: 'Perfect! I\'ll get those statements uploaded by Friday.',
        timestamp: '2024-10-30T09:45:00Z',
        isRead: true,
        threadId: '2'
      }
    ]
  },
  {
    id: '3',
    subject: 'Monthly Financial Review Complete',
    participants: sampleParticipants,
    lastMessage: 'Your September financial review is complete and available in the portal.',
    lastMessageTime: '2024-10-28T16:20:00Z',
    unreadCount: 0,
    priority: 'low',
    status: 'resolved',
    messages: [
      {
        id: 'm6',
        senderId: 'cpa-1',
        senderName: 'Sarah Johnson',
        senderRole: 'cpa',
        content: 'Hi John, your September financial review is complete and available in the portal. Overall, you had a strong month with revenue up 8% compared to August. I\'ve highlighted a few areas for attention in the report.',
        timestamp: '2024-10-28T16:20:00Z',
        isRead: true,
        threadId: '3'
      }
    ]
  }
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)} hours ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

function getStatusColor(status: MessageThread['status']) {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
}

function getPriorityColor(priority: MessageThread['priority']) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
}

interface ThreadListItemProps {
  thread: MessageThread
  isSelected: boolean
  onClick: () => void
}

function ThreadListItem({ thread, isSelected, onClick }: ThreadListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-r-blue-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={thread.participants.find(p => p.role === 'cpa')?.avatar} />
          <AvatarFallback>
            {thread.participants.find(p => p.role === 'cpa')?.name?.split(' ').map(n => n[0]).join('') || 'CPA'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {thread.subject}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatDate(thread.lastMessageTime)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {thread.lastMessage}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={getStatusColor(thread.status)}>
                {thread.status}
              </Badge>
              <Badge variant="secondary" className={getPriorityColor(thread.priority)}>
                {thread.priority}
              </Badge>
            </div>
            {thread.unreadCount > 0 && (
              <Badge className="bg-blue-500 text-white">
                {thread.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`p-3 rounded-lg ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center space-x-2 p-2 rounded border ${
                    isOwn
                      ? 'bg-blue-400 border-blue-300'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs opacity-75">{attachment.size}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="ghost" className="p-1 h-auto">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="p-1 h-auto">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatDate(message.timestamp)}</span>
          {isOwn && (
            <div className="flex items-center">
              {message.isRead ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </div>
          )}
        </div>
      </div>
      {!isOwn && (
        <Avatar className="w-8 h-8 order-1 mr-2">
          <AvatarFallback className="text-xs">
            {message.senderName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  )
}

interface ComposeMessageProps {
  onSend: (content: string, attachments?: File[]) => void
  placeholder?: string
}

function ComposeMessage({ onSend, placeholder = "Type your message..." }: ComposeMessageProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim()) {
      onSend(message, attachments)
      setMessage('')
      setAttachments([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeAttachment(index)}
                className="p-1 h-auto"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[80px] resize-none"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
      />
    </div>
  )
}

export default function MessagesPage() {
  const { session } = usePortalAuth()
  const [threads] = useState<MessageThread[]>(sampleThreads)
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(threads[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)

  const filteredThreads = threads.filter(thread =>
    thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = (content: string, attachments?: File[]) => {
    console.log('Sending message:', { content, attachments })
    // Handle message sending logic here
  }

  const handleNewMessage = () => {
    setShowNewMessage(true)
    setSelectedThread(null)
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row">
      {/* Thread List */}
      <div className="w-full lg:w-1/3 xl:w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <Button size="sm" onClick={handleNewMessage}>
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((thread) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              isSelected={selectedThread?.id === thread.id}
              onClick={() => {
                setSelectedThread(thread)
                setShowNewMessage(false)
              }}
            />
          ))}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedThread && !showNewMessage ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedThread.subject}
                  </h2>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      with {selectedThread.participants.filter(p => p.role === 'cpa').map(p => p.name).join(', ')}
                    </span>
                    <Badge variant="secondary" className={getStatusColor(selectedThread.status)}>
                      {selectedThread.status}
                    </Badge>
                    <Badge variant="secondary" className={getPriorityColor(selectedThread.priority)}>
                      {selectedThread.priority} priority
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence>
                {selectedThread.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderRole === 'client'}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Compose */}
            <ComposeMessage onSend={handleSendMessage} />
          </>
        ) : showNewMessage ? (
          <>
            {/* New Message Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  New Message
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewMessage(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* New Message Form */}
            <div className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To
                  </label>
                  <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="">Select recipient</option>
                    {sampleParticipants.filter(p => p.role === 'cpa').map(participant => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name} ({participant.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <Input placeholder="Enter message subject" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compose */}
            <ComposeMessage
              onSend={handleSendMessage}
              placeholder="Write your message..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a message thread to view the conversation or start a new message.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}