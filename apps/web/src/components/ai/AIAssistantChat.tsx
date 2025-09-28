'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Send,
  Paperclip,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  MessageSquare,
  User,
  FileText,
  Calculator,
  TrendingUp,
  Mail,
  AlertTriangle,
  Lightbulb,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: 'document' | 'financial' | 'tax' | 'advisory' | 'communication' | 'general';
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  suggestions?: Array<{
    id: string;
    text: string;
    action?: string;
  }>;
  confidence?: number;
  sources?: string[];
}

interface ChatContext {
  type: 'document' | 'financial' | 'tax' | 'advisory' | 'communication' | 'general';
  clientId?: string;
  documentId?: string;
  data?: any;
}

interface AIAssistantChatProps {
  context?: ChatContext;
  initialMessages?: Message[];
  onMessageSent?: (message: string, context?: ChatContext) => void;
  onSuggestionClicked?: (suggestion: string, action?: string) => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  className?: string;
  compact?: boolean;
}

const QUICK_ACTIONS = [
  {
    id: 'analyze-document',
    label: 'Analyze Document',
    icon: FileText,
    context: 'document',
    prompt: 'Please analyze the uploaded document and provide insights.'
  },
  {
    id: 'financial-summary',
    label: 'Financial Summary',
    icon: Calculator,
    context: 'financial',
    prompt: 'Provide a summary of the financial performance and key metrics.'
  },
  {
    id: 'tax-optimization',
    label: 'Tax Optimization',
    icon: TrendingUp,
    context: 'tax',
    prompt: 'What tax optimization opportunities are available?'
  },
  {
    id: 'draft-email',
    label: 'Draft Email',
    icon: Mail,
    context: 'communication',
    prompt: 'Help me draft a professional email to the client.'
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    icon: AlertTriangle,
    context: 'advisory',
    prompt: 'Analyze potential risks and provide mitigation strategies.'
  }
];

export function AIAssistantChat({
  context,
  initialMessages = [],
  onMessageSent,
  onSuggestionClicked,
  onFeedback,
  className,
  compact = false
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string>(context?.type || 'general');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      context: selectedContext as any,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      // Call the appropriate AI service based on context
      onMessageSent?.(inputValue.trim(), {
        type: selectedContext as any,
        ...context,
      });

      // Simulate AI response (in real implementation, this would come from the API)
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I understand you're asking about ${inputValue.trim()}. Based on the ${selectedContext} context, here's my analysis and recommendations...`,
          timestamp: new Date(),
          context: selectedContext as any,
          confidence: 0.85,
          suggestions: [
            { id: '1', text: 'View detailed analysis', action: 'view_details' },
            { id: '2', text: 'Generate report', action: 'generate_report' },
            { id: '3', text: 'Schedule follow-up', action: 'schedule_followup' }
          ],
          sources: ['Financial data', 'Industry benchmarks', 'Historical trends']
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setSelectedContext(action.context);
    setInputValue(action.prompt);
    setShowQuickActions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    onFeedback?.(messageId, feedback);
  };

  const getContextIcon = (contextType: string) => {
    switch (contextType) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'financial': return <Calculator className="h-4 w-4" />;
      case 'tax': return <TrendingUp className="h-4 w-4" />;
      case 'advisory': return <Lightbulb className="h-4 w-4" />;
      case 'communication': return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getContextColor = (contextType: string) => {
    switch (contextType) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'tax': return 'bg-purple-100 text-purple-800';
      case 'advisory': return 'bg-orange-100 text-orange-800';
      case 'communication': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (compact) {
    return (
      <Card className={`${className} max-w-sm`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-48" ref={scrollAreaRef}>
            <div className="space-y-2">
              {messages.slice(-3).map((message) => (
                <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="animate-pulse">●</div>
                      <div className="animate-pulse animation-delay-200">●</div>
                      <div className="animate-pulse animation-delay-400">●</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>

          <div className="flex items-center gap-2">
            <Select value={selectedContext} onValueChange={setSelectedContext}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="document">Document Analysis</SelectItem>
                <SelectItem value="financial">Financial Insights</SelectItem>
                <SelectItem value="tax">Tax Advisory</SelectItem>
                <SelectItem value="advisory">Business Advisory</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {context && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getContextColor(context.type)}>
              {getContextIcon(context.type)}
              <span className="ml-1 capitalize">{context.type}</span>
            </Badge>
            {context.clientId && (
              <Badge variant="outline">Client Context</Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Actions */}
        {showQuickActions && messages.length === 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="justify-start gap-2"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="h-96" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && !showQuickActions && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">How can I help you today?</h3>
                <p className="text-sm">
                  Ask me about financial analysis, tax optimization, document insights, or any business advisory needs.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/ai-avatar.png" />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] space-y-2 ${message.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 border'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Paperclip className="h-3 w-3" />
                            <span>{attachment.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.role === 'assistant' && (
                    <div className="space-y-2">
                      {/* Context and Confidence */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          {message.context && (
                            <Badge variant="outline" className="text-xs">
                              {getContextIcon(message.context)}
                              <span className="ml-1 capitalize">{message.context}</span>
                            </Badge>
                          )}
                          {message.confidence && (
                            <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                          )}
                        </div>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                      </div>

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700">Quick Actions:</div>
                          <div className="flex flex-wrap gap-1">
                            {message.suggestions.map((suggestion) => (
                              <Button
                                key={suggestion.id}
                                variant="outline"
                                size="sm"
                                onClick={() => onSuggestionClicked?.(suggestion.text, suggestion.action)}
                                className="text-xs h-7"
                              >
                                {suggestion.text}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Sources: </span>
                          {message.sources.join(', ')}
                        </div>
                      )}

                      {/* Message Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className="h-7 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'positive')}
                          className="h-7 px-2"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'negative')}
                          className="h-7 px-2"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 order-1">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-50 border p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${selectedContext}...`}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>

        {/* Powered by indicator */}
        <div className="text-xs text-gray-500 text-center">
          Powered by Azure OpenAI • Responses may contain errors
        </div>
      </CardContent>
    </Card>
  );
}