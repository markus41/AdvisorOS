/**
 * Enhanced AI Assistant Chat with Advanced Modes, Agents, and Workflows
 * Integrates all supercharged AI features into a unified interface
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  Send, 
  Mic, 
  Settings, 
  Workflow, 
  Brain, 
  Zap,
  ChevronDown,
  Play,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

// Import our new AI systems
import { AI_MODES, createAIModeManager, AIModeConfig } from '@/lib/ai/modes';
import { AGENTS, createAgentOrchestrator } from '@/lib/ai/agents/orchestrator';
import { getAllCOTPrompts } from '@/lib/ai/prompts/chain-of-thought';
import { getAllMCPTools } from '@/lib/ai/mcp/client';
import { getAllWorkflows, createWorkflowEngine } from '@/lib/ai/workflows/engine';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  mode?: string;
  agent?: string;
  workflow?: string;
  confidence?: number;
  cost?: number;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    toolsUsed?: string[];
  };
}

interface SuperchargedAIAssistantProps {
  context?: string;
  initialMessages?: Message[];
  onMessageSent?: (message: Message) => void;
  onWorkflowExecuted?: (workflowId: string, result: any) => void;
  className?: string;
  userId: string;
  organizationId: string;
  clientId?: string;
}

export function SuperchargedAIAssistant({
  context = 'general',
  initialMessages = [],
  onMessageSent,
  onWorkflowExecuted,
  className,
  userId,
  organizationId,
  clientId
}: SuperchargedAIAssistantProps) {
  // State management
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<string>('cpa-professional');
  const [selectedAgent, setSelectedAgent] = useState<string>('senior-cpa-advisor');
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI System instances (in real app, these would be initialized elsewhere)
  const modeManager = createAIModeManager({
    userId,
    organizationId,
    currentClient: clientId,
    temporalContext: {
      season: 'normal',
      urgency: 'medium'
    }
  });

  const agentOrchestrator = createAgentOrchestrator();
  // const mcpClient = createMCPClient();
  // const workflowEngine = createWorkflowEngine(modeManager, agentOrchestrator, mcpClient);

  // Available options
  const availableModes = Object.values(AI_MODES);
  const availableAgents = Object.values(AGENTS);
  const availableWorkflows = getAllWorkflows();
  const availablePrompts = getAllCOTPrompts();
  const availableTools = getAllMCPTools();

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  useEffect(() => {
    // Auto-detect and switch mode based on context
    modeManager.switchToMode(currentMode);
  }, [currentMode, context]);

  // Quick action buttons for current mode
  const getQuickActions = () => {
    const mode = AI_MODES[currentMode];
    return mode?.quickActions || [];
  };

  // Handle message sending
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      mode: currentMode
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response with mode-aware processing
      const response = await processAIMessage(userMessage);
      setMessages(prev => [...prev, response]);
      
      onMessageSent?.(response);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        mode: currentMode
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Process AI message with mode-aware logic
  const processAIMessage = async (userMessage: Message): Promise<Message> => {
    const mode = AI_MODES[currentMode];
    
    // Simulate processing with streaming
    setStreamingMessage('Analyzing your request...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setStreamingMessage('Selecting appropriate expert...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setStreamingMessage('Generating response...');
    await new Promise(resolve => setTimeout(resolve, 700));
    
    setStreamingMessage('');

    // Mock response based on current mode and agent
    const agent = AGENTS[selectedAgent];
    const responseContent = generateModeAwareResponse(userMessage.content, mode, agent);

    return {
      id: `response_${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      mode: currentMode,
      agent: selectedAgent,
      confidence: 0.85,
      cost: 0.03,
      metadata: {
        tokensUsed: 245,
        processingTime: 1500,
        toolsUsed: ['financial-calculator', 'industry-benchmarks']
      }
    };
  };

  // Generate response based on mode and agent
  const generateModeAwareResponse = (userInput: string, mode: AIModeConfig, agent: any): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (mode.id === 'tax-season' && lowerInput.includes('deduction')) {
      return `As your ${agent.name}, I've analyzed potential tax deductions for your situation. Based on current tax laws and your business profile, I've identified several opportunities:

**Immediate Opportunities:**
• Business equipment purchases (Section 179 deduction)
• Professional development and training expenses
• Home office deductions if applicable

**Strategic Considerations:**
• Timing of income and expenses for optimal tax position
• Retirement plan contribution opportunities
• Health insurance deduction optimization

Would you like me to run a comprehensive tax optimization analysis or dive deeper into any specific deduction category?`;
    }

    if (mode.id === 'cpa-professional' && lowerInput.includes('financial')) {
      return `I'll provide a comprehensive financial analysis using our advanced assessment framework:

**Current Financial Health:**
• Liquidity ratios indicate strong short-term position
• Profitability margins are above industry benchmarks
• Cash flow trends show seasonal patterns typical for your industry

**Key Insights:**
• Working capital management could be optimized
• Growth opportunities exist in market expansion
• Risk factors are well-managed overall

**Recommendations:**
1. Consider establishing a line of credit for seasonal fluctuations
2. Evaluate opportunities for operational efficiency improvements
3. Explore strategic investments in technology or market expansion

I can execute a complete financial health workflow to provide detailed analysis and benchmarking. Would you like me to proceed?`;
    }

    // Default professional response
    return `Thank you for your question. As your ${agent.name} operating in ${mode.name} mode, I'm analyzing your request using our advanced reasoning framework.

I have access to specialized tools including financial calculators, industry benchmarks, tax research databases, and comprehensive workflow automation. 

How can I best assist you today? I can:
• Perform detailed financial analysis
• Provide tax optimization strategies
• Draft professional communications
• Execute automated workflows
• Access real-time industry data

Please let me know what specific area you'd like to explore, and I'll provide comprehensive, actionable insights.`;
  };

  // Handle workflow execution
  const executeWorkflow = async (workflowId: string) => {
    setActiveWorkflow(workflowId);
    setIsLoading(true);

    try {
      // Mock workflow execution
      const workflow = availableWorkflows.find(w => w.id === workflowId);
      if (!workflow) return;

      const workflowMessage: Message = {
        id: `workflow_${Date.now()}`,
        role: 'system',
        content: `🔄 Executing workflow: ${workflow.name}

**Steps to complete:**
${workflow.steps.map((step, i) => `${i + 1}. ${step.name}`).join('\n')}

**Estimated duration:** ${Math.round(workflow.estimatedDuration / 1000)} seconds
**Estimated cost:** $${workflow.costEstimate}`,
        timestamp: new Date(),
        workflow: workflowId
      };

      setMessages(prev => [...prev, workflowMessage]);

      // Simulate workflow execution
      await new Promise(resolve => setTimeout(resolve, 3000));

      const resultMessage: Message = {
        id: `workflow_result_${Date.now()}`,
        role: 'assistant',
        content: `✅ Workflow completed successfully!

**${workflow.name}** has been executed with the following results:
• Comprehensive analysis generated
• Industry benchmarks retrieved and compared
• Strategic recommendations formulated
• Client communication drafted

All deliverables are ready for your review. The complete analysis shows strong financial health with identified opportunities for optimization.`,
        timestamp: new Date(),
        workflow: workflowId,
        confidence: 0.92
      };

      setMessages(prev => [...prev, resultMessage]);
      onWorkflowExecuted?.(workflowId, { success: true });
    } catch (error) {
      console.error('Workflow execution error:', error);
    } finally {
      setIsLoading(false);
      setActiveWorkflow(null);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    const quickActionPrompts: Record<string, string> = {
      'analyze-client-financial-health': 'Please analyze the current client financial health and provide comprehensive insights',
      'draft-professional-email': 'Help me draft a professional email to update the client on our recent analysis',
      'generate-client-meeting-agenda': 'Create an agenda for our upcoming client consultation meeting',
      'find-tax-deductions': 'Identify potential tax deductions and optimization opportunities',
      'check-compliance-requirements': 'Review current compliance requirements and deadlines'
    };

    const prompt = quickActionPrompts[action] || action;
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <Card className={`flex flex-col h-[700px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-5 w-5" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-400" />
            </div>
            <span>AI Copilot</span>
            <Badge variant="outline" className="ml-2">
              {AI_MODES[currentMode]?.name}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-xs"
            >
              <Settings className="h-4 w-4 mr-1" />
              <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Advanced Options Panel */}
        {showAdvancedOptions && (
          <div className="mt-3 p-3 bg-muted/30 rounded-md space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">AI Mode</label>
                <Select value={currentMode} onValueChange={setCurrentMode}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModes.map(mode => (
                      <SelectItem key={mode.id} value={mode.id}>
                        <div className="flex items-center gap-2">
                          <span>{mode.icon}</span>
                          <span>{mode.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Primary Agent</label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Available Tools */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Available Tools</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {AI_MODES[currentMode]?.toolsEnabled.map(tool => (
                  <Badge key={tool} variant="secondary" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {getQuickActions().slice(0, 3).map(action => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="text-xs h-7"
              disabled={isLoading}
            >
              {action.replace(/-/g, ' ')}
            </Button>
          ))}
        </div>

        {/* Workflow Actions */}
        {availableWorkflows.length > 0 && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeWorkflow('client-financial-health-review')}
              disabled={isLoading || activeWorkflow !== null}
              className="text-xs h-7"
            >
              <Workflow className="h-3 w-3 mr-1" />
              Financial Health Review
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role !== 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
              )}

              <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system'
                      ? 'bg-muted border'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </div>

                {/* Message metadata */}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.mode && (
                    <Badge variant="outline" className="text-xs h-4">
                      {AI_MODES[message.mode]?.icon} {AI_MODES[message.mode]?.name}
                    </Badge>
                  )}
                  {message.agent && (
                    <Badge variant="secondary" className="text-xs h-4">
                      <Brain className="h-3 w-3 mr-1" />
                      {AGENTS[message.agent]?.name}
                    </Badge>
                  )}
                  {message.confidence && (
                    <Badge variant="outline" className="text-xs h-4">
                      {Math.round(message.confidence * 100)}%
                    </Badge>
                  )}
                  {message.cost && (
                    <Badge variant="outline" className="text-xs h-4">
                      ${message.cost.toFixed(3)}
                    </Badge>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {streamingMessage && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {streamingMessage}
                </div>
              </div>
            </div>
          )}

          {/* Active workflow indicator */}
          {activeWorkflow && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Workflow className="h-4 w-4 text-blue-600 animate-spin" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 max-w-[80%]">
                <div className="text-sm text-blue-700 flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Executing workflow...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask your ${AGENTS[selectedAgent]?.name.toLowerCase()} anything...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>All systems operational</span>
              </div>
              {availableTools.length > 0 && (
                <Badge variant="outline" className="text-xs h-4">
                  {availableTools.length} tools available
                </Badge>
              )}
            </div>
            <div className="text-xs">
              Mode: {AI_MODES[currentMode]?.name} | Agent: {AGENTS[selectedAgent]?.name}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}