'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Download,
  Eye,
  X,
  Reply,
  Forward,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Attachment {
  id: string
  name: string
  size: string
  type: string
  url: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'client' | 'cpa'
  content: string
  timestamp: string
  isRead: boolean
  attachments?: Attachment[]
  isEdited?: boolean
  replyTo?: string
}

interface MessageThreadProps {
  messages: Message[]
  currentUserId: string
  currentUserRole: 'client' | 'cpa'
  onSendMessage: (content: string, attachments?: File[], replyTo?: string) => void
  onDeleteMessage?: (messageId: string) => void
  onEditMessage?: (messageId: string, content: string) => void
  className?: string
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onReply?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string) => void
}

function MessageBubble({ message, isOwn, onReply, onDelete, onEdit }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleDownloadAttachment = (attachment: Attachment) => {
    window.open(attachment.url, '_blank')
  }

  const handleViewAttachment = (attachment: Attachment) => {
    window.open(attachment.url, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`relative p-3 rounded-lg ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          }`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Message Actions */}
          <AnimatePresence>
            {showActions && (onReply || onDelete || onEdit) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute top-0 ${
                  isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                } flex items-center space-x-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1`}
              >
                {onReply && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onReply(message.id)}
                    className="p-1 h-auto"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>
                )}
                {isOwn && onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(message.id)}
                    className="p-1 h-auto"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                )}
                {isOwn && onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(message.id)}
                    className="p-1 h-auto text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {message.isEdited && (
            <p className="text-xs opacity-75 mt-1 italic">edited</p>
          )}

          {/* Attachments */}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewAttachment(attachment)}
                      className="p-1 h-auto"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadAttachment(attachment)}
                      className="p-1 h-auto"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Info */}
        <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
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

      {/* Avatar for non-own messages */}
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
  onSend: (content: string, attachments?: File[], replyTo?: string) => void
  replyTo?: Message
  onCancelReply?: () => void
  placeholder?: string
  disabled?: boolean
}

function ComposeMessage({ onSend, replyTo, onCancelReply, placeholder = "Type your message...", disabled = false }: ComposeMessageProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message, attachments, replyTo?.id)
      setMessage('')
      setAttachments([])
      if (onCancelReply) onCancelReply()
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

  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyTo])

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Replying to {replyTo.senderName}
            </span>
            {onCancelReply && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelReply}
                className="p-1 h-auto"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {replyTo.content}
          </p>
        </div>
      )}

      {/* Attachments Preview */}
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

      {/* Compose Area */}
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[80px] resize-none"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
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

export function MessageThread({
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  className
}: MessageThreadProps) {
  const [replyTo, setReplyTo] = useState<Message | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    setReplyTo(message)
  }

  const handleCancelReply = () => {
    setReplyTo(undefined)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              onReply={handleReply}
              onDelete={onDeleteMessage}
              onEdit={onEditMessage}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Compose Message */}
      <ComposeMessage
        onSend={onSendMessage}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  )
}