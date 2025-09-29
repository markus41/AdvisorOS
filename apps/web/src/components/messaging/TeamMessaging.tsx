'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Search,
  Users,
  UserPlus,
  Settings,
  Bell,
  BellOff,
  Hash,
  Lock,
  Globe,
  Plus,
  MoreVertical,
  Star,
  Archive,
  Pin,
  Edit3,
  Trash2,
  MessageSquare,
  AtSign,
  Smile,
  Paperclip,
  Image,
  File,
  Calendar,
  Phone,
  Video,
  Share,
  Reply,
  Forward,
  Copy,
  Flag
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useWebSocket } from '@/hooks/use-websocket'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'cpa' | 'staff' | 'admin' | 'partner'
  department: string
  status: 'online' | 'away' | 'busy' | 'offline'
  statusMessage?: string
  timezone: string
  lastActive: string
}

interface Channel {
  id: string
  name: string
  description: string
  type: 'public' | 'private' | 'direct'
  members: string[]
  admins: string[]
  unreadCount: number
  lastMessage?: TeamMessage
  isPinned: boolean
  isMuted: boolean
  tags: string[]
  createdAt: string
  createdBy: string
}

interface TeamMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'text' | 'file' | 'image' | 'system' | 'announcement'
  timestamp: string
  isEdited: boolean
  editedAt?: string
  replyTo?: string
  mentions: string[]
  reactions: MessageReaction[]
  attachments?: TeamAttachment[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  isDeleted: boolean
  thread?: TeamMessage[]
}

interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}

interface TeamAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
}

interface TeamMessagingProps {
  currentUserId: string
  organizationId: string
}

// Mock data
const mockTeamMembers: TeamMember[] = [
  {
    id: 'user1',
    name: 'John Smith',
    email: 'john@cpafirm.com',
    avatar: '/avatars/john.jpg',
    role: 'cpa',
    department: 'Tax',
    status: 'online',
    statusMessage: 'Working on Q2 reviews',
    timezone: 'EST',
    lastActive: '2024-06-15T15:30:00Z'
  },
  {
    id: 'user2',
    name: 'Sarah Miller',
    email: 'sarah@cpafirm.com',
    role: 'staff',
    department: 'Audit',
    status: 'busy',
    statusMessage: 'In client meeting',
    timezone: 'EST',
    lastActive: '2024-06-15T15:25:00Z'
  },
  {
    id: 'user3',
    name: 'Mike Johnson',
    email: 'mike@cpafirm.com',
    role: 'partner',
    department: 'Management',
    status: 'away',
    timezone: 'EST',
    lastActive: '2024-06-15T14:45:00Z'
  }
]

const mockChannels: Channel[] = [
  {
    id: 'general',
    name: 'general',
    description: 'General team discussions',
    type: 'public',
    members: ['user1', 'user2', 'user3'],
    admins: ['user3'],
    unreadCount: 3,
    isPinned: true,
    isMuted: false,
    tags: ['general'],
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'user3',
    lastMessage: {
      id: 'msg1',
      channelId: 'general',
      senderId: 'user2',
      senderName: 'Sarah Miller',
      content: 'Don\'t forget about the team meeting at 3 PM today!',
      type: 'text',
      timestamp: '2024-06-15T14:30:00Z',
      isEdited: false,
      mentions: [],
      reactions: [
        { emoji: '👍', users: ['user1'], count: 1 }
      ],
      priority: 'normal',
      isDeleted: false
    }
  },
  {
    id: 'tax-team',
    name: 'tax-team',
    description: 'Tax department discussions',
    type: 'private',
    members: ['user1', 'user3'],
    admins: ['user1'],
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    tags: ['tax', 'department'],
    createdAt: '2024-02-01T00:00:00Z',
    createdBy: 'user1',
    lastMessage: {
      id: 'msg2',
      channelId: 'tax-team',
      senderId: 'user1',
      senderName: 'John Smith',
      content: 'New tax regulation updates are available in the shared folder',
      type: 'text',
      timestamp: '2024-06-15T13:15:00Z',
      isEdited: false,
      mentions: [],
      reactions: [],
      priority: 'high',
      isDeleted: false
    }
  }
]

const mockMessages: TeamMessage[] = [
  {
    id: 'msg1',
    channelId: 'general',
    senderId: 'user2',
    senderName: 'Sarah Miller',
    senderAvatar: '/avatars/sarah.jpg',
    content: 'Don\'t forget about the team meeting at 3 PM today!',
    type: 'text',
    timestamp: '2024-06-15T14:30:00Z',
    isEdited: false,
    mentions: [],
    reactions: [
      { emoji: '👍', users: ['user1'], count: 1 }
    ],
    priority: 'normal',
    isDeleted: false
  },
  {
    id: 'msg2',
    channelId: 'general',
    senderId: 'user1',
    senderName: 'John Smith',
    senderAvatar: '/avatars/john.jpg',
    content: 'Thanks for the reminder! I\'ll be there.',
    type: 'text',
    timestamp: '2024-06-15T14:32:00Z',
    isEdited: false,
    mentions: ['user2'],
    reactions: [],
    priority: 'normal',
    isDeleted: false
  }
]

export function TeamMessaging({ currentUserId, organizationId }: TeamMessagingProps) {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(mockChannels[0])
  const [messages, setMessages] = useState<TeamMessage[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('channels')
  const [showMemberList, setShowMemberList] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<TeamMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<TeamMessage | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  // WebSocket for real-time messaging
  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/team',
    onMessage: (message) => {
      if (message.type === 'new_message') {
        setMessages(prev => [...prev, message.data])
        scrollToBottom()
      } else if (message.type === 'message_edited') {
        setMessages(prev => prev.map(m =>
          m.id === message.data.id ? { ...m, ...message.data } : m
        ))
      } else if (message.type === 'reaction_added') {
        setMessages(prev => prev.map(m =>
          m.id === message.data.messageId
            ? { ...m, reactions: message.data.reactions }
            : m
        ))
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
    if (!newMessage.trim() || !selectedChannel) return

    const message: TeamMessage = {
      id: `msg_${Date.now()}`,
      channelId: selectedChannel.id,
      senderId: currentUserId,
      senderName: 'You',
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      isEdited: false,
      mentions: extractMentions(newMessage),
      reactions: [],
      priority: 'normal',
      isDeleted: false,
      replyTo: replyingTo?.id
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setReplyingTo(null)

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
        data: { channelId: selectedChannel.id, userId: currentUserId }
      })
    }
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

  const handleAddReaction = (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    const existingReaction = message.reactions.find(r => r.emoji === emoji)
    let updatedReactions

    if (existingReaction) {
      if (existingReaction.users.includes(currentUserId)) {
        // Remove reaction
        updatedReactions = message.reactions.map(r =>
          r.emoji === emoji
            ? { ...r, users: r.users.filter(u => u !== currentUserId), count: r.count - 1 }
            : r
        ).filter(r => r.count > 0)
      } else {
        // Add reaction
        updatedReactions = message.reactions.map(r =>
          r.emoji === emoji
            ? { ...r, users: [...r.users, currentUserId], count: r.count + 1 }
            : r
        )
      }
    } else {
      // New reaction
      updatedReactions = [...message.reactions, {
        emoji,
        users: [currentUserId],
        count: 1
      }]
    }

    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, reactions: updatedReactions } : m
    ))

    if (isConnected) {
      sendMessage({
        type: 'add_reaction',
        data: { messageId, emoji, userId: currentUserId, reactions: updatedReactions }
      })
    }
  }

  const handleEditMessage = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, content: newContent, isEdited: true, editedAt: new Date().toISOString() }
        : m
    ))

    if (isConnected) {
      sendMessage({
        type: 'edit_message',
        data: { messageId, content: newContent, editedAt: new Date().toISOString() }
      })
    }

    setEditingMessage(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingMessage) {
        handleEditMessage(editingMessage.id, newMessage)
      } else {
        handleSendMessage()
      }
    }
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const formatMentions = (content: string) => {
    return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>')
  }

  const filteredChannels = mockChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const channelMessages = messages.filter(m => m.channelId === selectedChannel?.id && !m.isDeleted)

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Organization Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">
            CPA Team Chat
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mockTeamMembers.filter(m => m.status === 'online').length} members online
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="members">
              Members
              <Badge variant="secondary" className="ml-2">
                {mockTeamMembers.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {/* Create Channel Button */}
                <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                  <Plus className="w-4 h-4" />
                  Create Channel
                </Button>

                <Separator className="my-2" />

                {/* Channels List */}
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      selectedChannel?.id === channel.id
                        ? 'bg-blue-100 dark:bg-blue-900/20'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {channel.type === 'private' ? (
                        <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <Hash className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{channel.name}</span>
                      {channel.isPinned && <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {channel.isMuted && <BellOff className="w-3 h-3 text-gray-400" />}
                      {channel.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {channel.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="members" className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {mockTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{member.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {member.statusMessage || member.department}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedChannel.type === 'private' ? (
                    <Lock className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Hash className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {selectedChannel.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedChannel.description} • {selectedChannel.members.length} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMemberList(!showMemberList)}
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Bell className="w-4 h-4 mr-2" />
                        Notification Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pin className="w-4 h-4 mr-2" />
                        Pin Channel
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star className="w-4 h-4 mr-2" />
                        Add to Favorites
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Channel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="flex flex-1">
              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                {/* Reply Banner */}
                {replyingTo && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Reply className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          Replying to {replyingTo.senderName}
                        </span>
                        <span className="text-sm text-blue-600 truncate max-w-xs">
                          {replyingTo.content}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {channelMessages.map((message, index) => {
                      const prevMessage = channelMessages[index - 1]
                      const showAvatar = !prevMessage ||
                        prevMessage.senderId !== message.senderId ||
                        new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group"
                        >
                          {message.replyTo && (
                            <div className="ml-12 mb-1 text-xs text-gray-500">
                              <Reply className="w-3 h-3 inline mr-1" />
                              Replying to {messages.find(m => m.id === message.replyTo)?.senderName}
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            {showAvatar ? (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                                <AvatarFallback>
                                  {message.senderName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center">
                                <span className="text-xs text-gray-400">
                                  {getMessageTime(message.timestamp)}
                                </span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              {showAvatar && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    {message.senderName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {getMessageTime(message.timestamp)}
                                  </span>
                                  {message.isEdited && (
                                    <span className="text-xs text-gray-400">(edited)</span>
                                  )}
                                </div>
                              )}

                              <div
                                className="text-sm text-gray-900 dark:text-white"
                                dangerouslySetInnerHTML={{ __html: formatMentions(message.content) }}
                              />

                              {/* Reactions */}
                              {message.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {message.reactions.map((reaction) => (
                                    <button
                                      key={reaction.emoji}
                                      onClick={() => handleAddReaction(message.id, reaction.emoji)}
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                        reaction.users.includes(currentUserId)
                                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                                      }`}
                                    >
                                      <span>{reaction.emoji}</span>
                                      <span>{reaction.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Message Actions */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                                    <Reply className="w-4 h-4 mr-2" />
                                    Reply
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAddReaction(message.id, '👍')}>
                                    <Smile className="w-4 h-4 mr-2" />
                                    Add Reaction
                                  </DropdownMenuItem>
                                  {message.senderId === currentUserId && (
                                    <>
                                      <DropdownMenuItem onClick={() => {
                                        setEditingMessage(message)
                                        setNewMessage(message.content)
                                        messageInputRef.current?.focus()
                                      }}>
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Text
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Forward className="w-4 h-4 mr-2" />
                                    Forward
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Flag className="w-4 h-4 mr-2" />
                                    Report
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8" />
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span>
                            {typingUsers.length === 1 ? 'Someone is' : `${typingUsers.length} people are`} typing...
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {editingMessage && (
                    <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-800 dark:text-yellow-200">
                          Editing message
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMessage(null)
                            setNewMessage('')
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message #${selectedChannel.name}`}
                        className="resize-none"
                        rows={1}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Smile className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid grid-cols-8 gap-2 p-2">
                            {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '👏', '🙌', '👐', '🤲', '🤜', '🤛', '✊', '👊', '🙏'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  setNewMessage(prev => prev + emoji)
                                  setShowEmojiPicker(false)
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <AtSign className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => editingMessage ? handleEditMessage(editingMessage.id, newMessage) : handleSendMessage()}
                        disabled={!newMessage.trim()}
                        size="sm"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member List Sidebar */}
              {showMemberList && (
                <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Members ({selectedChannel.members.length})
                    </h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {mockTeamMembers
                        .filter(member => selectedChannel.members.includes(member.id))
                        .map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="relative">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{member.name}</span>
                                {selectedChannel.admins.includes(member.id) && (
                                  <Badge variant="outline" className="text-xs">Admin</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {member.status === 'online' ? 'Active' : `Last seen ${getMessageTime(member.lastActive)}`}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select a channel
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a channel from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}