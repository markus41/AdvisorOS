'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Send,
  Camera,
  FolderOpen,
  Mic,
  MapPin,
  Paperclip,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: DetectedIntent;
  entities?: ExtractedEntity[];
  attachments?: MessageAttachment[];
  actions?: ActionButton[];
  isTyping?: boolean;
}

export interface DetectedIntent {
  intent: 'upload_document' | 'check_status' | 'ask_question' | 'schedule_meeting' | 'view_invoice' | 'pay_bill';
  confidence: number;
  parameters: Record<string, any>;
}

export interface ExtractedEntity {
  type: 'document_type' | 'tax_year' | 'amount' | 'date';
  value: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ClientOverview {
  taxReturnStatus: {
    year: number;
    status: 'filed' | 'in_progress' | 'pending';
    filedDate?: Date;
    refundAmount?: number;
    refundStatus?: 'pending' | 'paid';
  };
  documentsNeeded: Array<{
    name: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  balanceDue: number;
  upcomingDeadline?: Date;
}

export interface ConversationalClientPortalProps {
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  overview: ClientOverview;
}

export function ConversationalClientPortal({
  clientId,
  clientName,
  clientAvatar,
  overview,
}: ConversationalClientPortalProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    const greeting: ConversationMessage = {
      id: 'greeting',
      role: 'assistant',
      content: `👋 Hi ${clientName.split(' ')[0]}!\n\nHow can I help you today?`,
      timestamp: new Date(),
      actions: [
        {
          id: 'upload',
          label: 'Upload my W-2',
          action: () => handleQuickAction('upload_document', 'W-2'),
        },
        {
          id: 'status',
          label: "When is my tax due?",
          action: () => handleQuickAction('check_status', 'deadline'),
        },
        {
          id: 'invoices',
          label: 'Show me my invoices',
          action: () => handleQuickAction('view_invoice'),
        },
      ],
    };
    setMessages([greeting]);
  }, [clientName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() && !showFileUpload) return;

    // Add user message
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Show typing indicator
    const typingMessage: ConversationMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Remove typing indicator
    setMessages((prev) => prev.filter((m) => m.id !== 'typing'));

    // Generate AI response based on intent detection
    const response = await generateAIResponse(message);
    setMessages((prev) => [...prev, response]);
    setIsProcessing(false);
  };

  const generateAIResponse = async (
    userMessage: string
  ): Promise<ConversationMessage> => {
    const lowerMessage = userMessage.toLowerCase();

    // Intent: Upload Document
    if (
      lowerMessage.includes('upload') ||
      lowerMessage.includes('w-2') ||
      lowerMessage.includes('w2') ||
      lowerMessage.includes('document')
    ) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Great! I'll help you upload your W-2 for 2024 taxes.",
        timestamp: new Date(),
        actions: [
          {
            id: 'camera',
            label: '📷 Take Photo',
            action: () => handleFileUpload('camera'),
          },
          {
            id: 'file',
            label: '📁 Choose File',
            action: () => handleFileUpload('file'),
          },
          {
            id: 'manual',
            label: '📋 Manual Entry',
            action: () => handleFileUpload('manual'),
          },
        ],
      };
    }

    // Intent: Check Status
    if (
      lowerMessage.includes('status') ||
      lowerMessage.includes('due') ||
      lowerMessage.includes('deadline') ||
      lowerMessage.includes('when')
    ) {
      const deadline = overview.upcomingDeadline
        ? new Date(overview.upcomingDeadline).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'No upcoming deadlines';

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📅 Your 2023 tax return was filed on March 15, 2024.\n\n💰 Refund: $${overview.taxReturnStatus.refundAmount?.toLocaleString()} (${
          overview.taxReturnStatus.refundStatus === 'paid' ? 'Paid ✓' : 'Processing'
        })\n\n📄 Documents still needed:\n${overview.documentsNeeded.map((d) => `• ${d.name}`).join('\n')}`,
        timestamp: new Date(),
        actions: [
          {
            id: 'upload_docs',
            label: 'Upload Documents',
            action: () => handleQuickAction('upload_document'),
          },
        ],
      };
    }

    // Intent: View Invoices
    if (
      lowerMessage.includes('invoice') ||
      lowerMessage.includes('bill') ||
      lowerMessage.includes('payment') ||
      lowerMessage.includes('pay')
    ) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `💰 Balance Due: $${overview.balanceDue.toLocaleString()}\n\nAll invoices are paid! Nice work! 🎉`,
        timestamp: new Date(),
        actions: overview.balanceDue > 0
          ? [
              {
                id: 'pay_now',
                label: 'Pay Now',
                action: () => handleQuickAction('pay_bill'),
              },
              {
                id: 'view_details',
                label: 'View Details',
                action: () => handleQuickAction('view_invoice'),
              },
            ]
          : [],
      };
    }

    // Intent: Schedule Meeting
    if (
      lowerMessage.includes('meet') ||
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('appointment') ||
      lowerMessage.includes('call')
    ) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          "I'd be happy to help you schedule a meeting with your CPA.\n\nWhat day works best for you?",
        timestamp: new Date(),
        actions: [
          {
            id: 'schedule',
            label: '📅 View Available Times',
            action: () => handleQuickAction('schedule_meeting'),
          },
        ],
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content:
        "I'm here to help! You can ask me about:\n\n• Uploading documents\n• Tax return status\n• Invoices and payments\n• Scheduling meetings\n• General tax questions",
      timestamp: new Date(),
    };
  };

  const handleQuickAction = (action: string, params?: string) => {
    const actionMessages: Record<string, string> = {
      upload_document: params ? `I need to upload my ${params}` : 'I need to upload a document',
      check_status: 'What is my current status?',
      view_invoice: 'Show me my invoices',
      schedule_meeting: 'I want to schedule a meeting',
      pay_bill: 'I want to pay my bill',
    };

    const message = actionMessages[action] || action;
    handleSendMessage(message);
  };

  const handleFileUpload = (method: string) => {
    const uploadMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Photo attached: w2_photo.jpg',
      timestamp: new Date(),
      attachments: [
        {
          id: 'file1',
          name: 'w2_photo.jpg',
          type: 'image/jpeg',
          size: 2457600,
        },
      ],
    };
    setMessages((prev) => [...prev, uploadMessage]);

    // Simulate processing
    setTimeout(() => {
      const processingMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Perfect! I'm analyzing your W-2...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, processingMessage]);

      // Show progress
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.content !== "Perfect! I'm analyzing your W-2..."));

        const resultMessage: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✓ Done! I found:\n\nEmployer: Acme Corp\nWages: $75,000\nFed Tax: $12,500\n\nDoes this look correct?',
          timestamp: new Date(),
          actions: [
            {
              id: 'confirm',
              label: '✅ Yes, Correct',
              action: () => handleConfirmUpload(),
            },
            {
              id: 'edit',
              label: '✏️ Edit Details',
              action: () => handleEditUpload(),
            },
          ],
        };
        setMessages((prev) => [...prev, resultMessage]);
      }, 3000);
    }, 1000);
  };

  const handleConfirmUpload = () => {
    const confirmMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Yes correct',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);

    setTimeout(() => {
      const successMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Excellent! Your W-2 has been saved.\n\nYou still need:\n${overview.documentsNeeded
          .filter((d) => d.type !== 'W-2')
          .map((d) => `• ${d.name}`)
          .join('\n')}\n\nWould you like to upload more now?`,
        timestamp: new Date(),
        actions: [
          {
            id: 'upload_more',
            label: '📷 Upload More',
            action: () => handleQuickAction('upload_document'),
          },
          {
            id: 'done',
            label: '✓ Done for Now',
            action: () => {
              const doneMsg: ConversationMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Perfect! Let me know if you need anything else. 😊',
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, doneMsg]);
            },
          },
        ],
      };
      setMessages((prev) => [...prev, successMessage]);
    }, 500);
  };

  const handleEditUpload = () => {
    const editMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'No problem! What would you like to correct?',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, editMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="lg:hidden">
              ☰
            </Button>
            <h1 className="text-lg font-semibold">AdvisorOS Client Portal</h1>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="hidden sm:inline">Online</span>
          </Badge>
        </div>
      </header>

      {/* Quick Overview - Collapsible on Mobile */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <OverviewCard
            icon={<CheckCircle className="w-4 h-4 text-green-500" />}
            title="2023 Tax Return"
            value="Filed March 15"
            detail={`Refund: $${overview.taxReturnStatus.refundAmount?.toLocaleString()}`}
          />
          <OverviewCard
            icon={<FileText className="w-4 h-4 text-orange-500" />}
            title="Documents Needed"
            value={overview.documentsNeeded.length.toString()}
            detail={overview.documentsNeeded[0]?.name || 'All set!'}
          />
          <OverviewCard
            icon={<DollarSign className="w-4 h-4 text-blue-500" />}
            title="Balance Due"
            value={`$${overview.balanceDue}`}
            detail={overview.balanceDue === 0 ? 'All paid! 🎉' : 'Payment due'}
          />
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} clientName={clientName} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed Bottom */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <Camera className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <FolderOpen className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isProcessing}
              size="sm"
              className="flex-shrink-0"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
            <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">
              <Mic className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Voice</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Location</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-around">
          <NavButton icon={MessageSquare} label="Chat" active />
          <NavButton icon={FileText} label="Docs" />
          <NavButton icon={DollarSign} label="Billing" />
          <NavButton icon={Calendar} label="Settings" />
        </div>
      </nav>
    </div>
  );
}

// Helper Components
function OverviewCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  clientName,
}: {
  message: ConversationMessage;
  clientName: string;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (message.isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-start gap-3"
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-500 text-white">AI</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      <Avatar className="w-8 h-8 flex-shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-gray-500 text-white">
            {clientName.charAt(0)}
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Sparkles className="w-4 h-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className={cn('flex-1 space-y-2', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'inline-block px-4 py-3 rounded-lg max-w-[85%] sm:max-w-lg',
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-white/10 rounded"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="text-xs">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.action}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

function NavButton({
  icon: Icon,
  label,
  active = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
        active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs">{label}</span>
    </button>
  );
}