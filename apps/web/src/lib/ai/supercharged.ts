/**
 * Supercharged AI Copilot System - Main Export
 * Combines modes, agents, prompts, MCP tools, and workflows into a unified system
 */

// Core AI Systems
export * from './modes';
export * from './agents/orchestrator';
export * from './prompts/chain-of-thought';
export * from './mcp/client';
export * from './workflows/engine';

// Enhanced Components
export * from '../../components/ai/SuperchargedAIAssistant';

// Legacy Exports (maintain compatibility)
export * from './advisory-copilot';
export * from './tax-assistant';
export * from './communication-assistant';
export * from './financial-insights';
export * from './document-intelligence';
export * from './openai-client';

import { createAIModeManager } from './modes';
import { createAgentOrchestrator } from './agents/orchestrator';
import { createMCPClient } from './mcp/client';
import { createWorkflowEngine } from './workflows/engine';

/**
 * SuperchargedAI - Main orchestration class
 * Provides a unified interface to all AI capabilities
 */
export class SuperchargedAI {
  public modeManager: ReturnType<typeof createAIModeManager>;
  public agentOrchestrator: ReturnType<typeof createAgentOrchestrator>;
  public mcpClient: ReturnType<typeof createMCPClient>;
  public workflowEngine: ReturnType<typeof createWorkflowEngine>;

  constructor(context: {
    userId: string;
    organizationId: string;
    currentClient?: string;
    temporalContext?: {
      season: 'tax' | 'audit' | 'normal' | 'yearend';
      urgency: 'high' | 'medium' | 'low';
    };
    preferences?: Record<string, any>;
  }) {
    // Initialize all AI systems
    this.modeManager = createAIModeManager(context);
    this.agentOrchestrator = createAgentOrchestrator();
    this.mcpClient = createMCPClient();
    this.workflowEngine = createWorkflowEngine(
      this.modeManager,
      this.agentOrchestrator,
      this.mcpClient
    );

    // Auto-detect initial mode
    this.modeManager.autoDetectMode();
  }

  /**
   * Process a natural language request with full AI capabilities
   */
  public async processRequest(
    request: string,
    context?: Record<string, any>
  ): Promise<{
    response: any;
    mode: string;
    agentsUsed: string[];
    toolsUsed: string[];
    confidence: number;
    cost: number;
    executionTime: number;
  }> {
    const startTime = Date.now();
    let totalCost = 0;
    const agentsUsed: string[] = [];
    const toolsUsed: string[] = [];

    try {
      // 1. Analyze request and determine if workflow is needed
      const isWorkflowRequest = this.detectWorkflowRequest(request);
      
      if (isWorkflowRequest.workflow) {
        // Execute workflow
        const workflowResult = await this.workflowEngine.executeWorkflow(
          isWorkflowRequest.workflow,
          { ...context, originalRequest: request }
        );

        return {
          response: workflowResult.results,
          mode: this.modeManager.getCurrentMode().id,
          agentsUsed: workflowResult.agentResponses?.map(r => r.agentId) || [],
          toolsUsed: [], // Would be extracted from workflow
          confidence: workflowResult.finalConfidence || 0.85,
          cost: workflowResult.costEstimate || 0,
          executionTime: Date.now() - startTime
        };
      }

      // 2. Process as direct agent task
      const currentMode = this.modeManager.getCurrentMode();
      const task = {
        id: `task_${Date.now()}`,
        agentId: currentMode.primaryAgent,
        type: 'consultation' as const,
        priority: 'medium' as const,
        input: { request, context },
        context: { ...context, request },
        requiredCapabilities: this.extractRequiredCapabilities(request)
      };

      const orchestrationResult = await this.agentOrchestrator.executeTask(task, currentMode);
      
      return {
        response: orchestrationResult.primaryResult,
        mode: currentMode.id,
        agentsUsed: orchestrationResult.agentResponses.map(r => r.agentId),
        toolsUsed: [], // Would be extracted from agent responses
        confidence: orchestrationResult.finalConfidence,
        cost: orchestrationResult.costEstimate,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('SuperchargedAI processing error:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again or contact support.',
        mode: this.modeManager.getCurrentMode().id,
        agentsUsed: [],
        toolsUsed: [],
        confidence: 0,
        cost: 0,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Switch AI mode based on context or explicit request
   */
  public switchMode(modeId: string): void {
    this.modeManager.switchToMode(modeId);
  }

  /**
   * Get current system status and capabilities
   */
  public getSystemStatus(): {
    currentMode: string;
    availableAgents: number;
    availableTools: number;
    availableWorkflows: number;
    activeExecutions: number;
  } {
    return {
      currentMode: this.modeManager.getCurrentMode().id,
      availableAgents: this.agentOrchestrator.getAllAgents().length,
      availableTools: this.mcpClient.getAvailableTools().length,
      availableWorkflows: this.workflowEngine.getAllWorkflows().length,
      activeExecutions: this.workflowEngine.getActiveExecutions().length
    };
  }

  /**
   * Execute a specific workflow by ID
   */
  public async executeWorkflow(
    workflowId: string,
    context: Record<string, any>,
    options?: { dryRun?: boolean; priority?: 'low' | 'medium' | 'high' }
  ) {
    return this.workflowEngine.executeWorkflow(workflowId, context, options);
  }

  /**
   * Execute a specific MCP tool
   */
  public async executeTool(toolId: string, parameters: Record<string, any>) {
    return this.mcpClient.executeTool({
      toolId,
      parameters,
      context: {
        userId: this.modeManager['context'].userId,
        organizationId: this.modeManager['context'].organizationId,
        mode: this.modeManager.getCurrentMode().id
      }
    });
  }

  // Private helper methods
  private detectWorkflowRequest(request: string): { workflow?: string; confidence: number } {
    const lower = request.toLowerCase();
    
    if (lower.includes('financial health') && (lower.includes('review') || lower.includes('analysis'))) {
      return { workflow: 'client-financial-health-review', confidence: 0.9 };
    }
    
    if (lower.includes('tax') && (lower.includes('optimize') || lower.includes('planning'))) {
      return { workflow: 'tax-optimization-analysis', confidence: 0.85 };
    }

    return { confidence: 0 };
  }

  private extractRequiredCapabilities(request: string): string[] {
    const capabilities: string[] = [];
    const lower = request.toLowerCase();

    if (lower.includes('financial') || lower.includes('ratio') || lower.includes('analysis')) {
      capabilities.push('financial-analysis');
    }
    if (lower.includes('tax') || lower.includes('deduction')) {
      capabilities.push('tax-planning');
    }
    if (lower.includes('email') || lower.includes('communication')) {
      capabilities.push('client-communication');
    }
    if (lower.includes('document') || lower.includes('analyze')) {
      capabilities.push('document-analysis');
    }

    return capabilities.length > 0 ? capabilities : ['business-consulting'];
  }
}

/**
 * Create a SuperchargedAI instance
 */
export function createSuperchargedAI(context: {
  userId: string;
  organizationId: string;
  currentClient?: string;
  temporalContext?: {
    season: 'tax' | 'audit' | 'normal' | 'yearend';
    urgency: 'high' | 'medium' | 'low';
  };
  preferences?: Record<string, any>;
}): SuperchargedAI {
  return new SuperchargedAI(context);
}

/**
 * Quick access functions for common operations
 */
export const AICapabilities = {
  modes: Object.keys(await import('./modes').then(m => m.AI_MODES)),
  agents: Object.keys(await import('./agents/orchestrator').then(m => m.AGENTS)),
  workflows: (await import('./workflows/engine').then(m => m.getAllWorkflows())).map(w => w.id),
  tools: (await import('./mcp/client').then(m => m.getAllMCPTools())).map(t => t.id),
  prompts: (await import('./prompts/chain-of-thought').then(m => m.getAllCOTPrompts())).map(p => p.id)
};

export default SuperchargedAI;