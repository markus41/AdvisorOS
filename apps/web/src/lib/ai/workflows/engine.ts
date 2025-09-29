/**
 * AI Workflow Engine - Orchestrates complex multi-step AI workflows
 * Combines modes, agents, prompts, and MCP tools into intelligent workflows
 */

import { AIModeManager, AIModeConfig } from '../modes';
import { AgentOrchestrator, AgentTask } from '../agents/orchestrator';
import { AdvancedPromptFormatter } from '../prompts/chain-of-thought';
import { MCPClient, MCPToolCall } from '../mcp/client';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent-task' | 'mcp-tool' | 'prompt-generation' | 'conditional' | 'parallel' | 'delay';
  description: string;
  config: Record<string, any>;
  dependencies?: string[];
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  steps: WorkflowStep[];
  triggers: Array<{
    type: 'manual' | 'scheduled' | 'event' | 'api';
    config: Record<string, any>;
  }>;
  requiredContext: string[];
  expectedOutputs: string[];
  estimatedDuration: number;
  costEstimate: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  context: Record<string, any>;
  results: Record<string, any>;
  stepResults: Map<string, any>;
  errors: Array<{
    stepId: string;
    error: string;
    timestamp: Date;
  }>;
  metrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    totalCost: number;
    tokensUsed: number;
    executionTime: number;
  };
}

/**
 * Client Financial Health Review Workflow
 */
export const CLIENT_FINANCIAL_HEALTH_WORKFLOW: WorkflowDefinition = {
  id: 'client-financial-health-review',
  name: 'Comprehensive Client Financial Health Review',
  description: 'Complete financial health assessment including analysis, benchmarking, and recommendations',
  category: 'financial-analysis',
  version: '1.0.0',
  steps: [
    {
      id: 'gather-quickbooks-data',
      name: 'Gather QuickBooks Financial Data',
      type: 'mcp-tool',
      description: 'Retrieve current financial data from QuickBooks',
      config: {
        toolId: 'quickbooks-integration',
        parameters: {
          action: 'get_financial_summary',
          companyId: '{clientId}',
          filters: {
            period: 'current-year',
            includeComparatives: true
          }
        }
      }
    },
    {
      id: 'get-industry-benchmarks',
      name: 'Retrieve Industry Benchmarks',
      type: 'mcp-tool',
      description: 'Get industry benchmark data for comparison',
      config: {
        toolId: 'industry-benchmarks',
        parameters: {
          industry: '{clientIndustry}',
          companySize: '{companySize}',
          metrics: ['gross_margin', 'net_margin', 'current_ratio', 'debt_to_equity']
        }
      },
      dependencies: ['gather-quickbooks-data']
    },
    {
      id: 'comprehensive-analysis',
      name: 'Comprehensive Financial Analysis',
      type: 'agent-task',
      description: 'Perform comprehensive financial health analysis',
      config: {
        agentId: 'senior-cpa-advisor',
        taskType: 'analysis',
        prompt: 'financial-health-cot',
        context: {
          financialData: '{financialData}',
          benchmarks: '{industryBenchmarks}',
          clientProfile: '{clientProfile}'
        }
      },
      dependencies: ['get-industry-benchmarks']
    }
  ],
  triggers: [
    {
      type: 'manual',
      config: {
        requiredRole: ['owner', 'admin', 'cpa']
      }
    }
  ],
  requiredContext: ['clientId', 'clientProfile', 'clientIndustry', 'companySize'],
  expectedOutputs: ['comprehensiveAnalysis'],
  estimatedDuration: 300000, // 5 minutes
  costEstimate: 2.50 // USD
};

/**
 * Code Review Workflow
 */
export const CODE_REVIEW_WORKFLOW: WorkflowDefinition = {
  id: 'code-review-workflow',
  name: 'Comprehensive Code Review',
  description: 'Multi-agent code review with security, performance, and quality analysis',
  category: 'development',
  version: '1.0.0',
  steps: [
    {
      id: 'analyze-code-quality',
      name: 'Analyze Code Quality',
      type: 'mcp-tool',
      description: 'Perform comprehensive code quality analysis',
      config: {
        toolId: 'code-analyzer',
        parameters: {
          analysisType: 'complexity_analysis',
          codeContent: '{codeContent}',
          language: '{language}',
          framework: '{framework}'
        }
      }
    },
    {
      id: 'security-scan',
      name: 'Security Vulnerability Scan',
      type: 'mcp-tool',
      description: 'Scan for security vulnerabilities and risks',
      config: {
        toolId: 'code-analyzer',
        parameters: {
          analysisType: 'security_scan',
          codeContent: '{codeContent}',
          language: '{language}',
          framework: '{framework}'
        }
      }
    },
    {
      id: 'performance-audit',
      name: 'Performance Analysis',
      type: 'mcp-tool',
      description: 'Analyze performance implications',
      config: {
        toolId: 'code-analyzer',
        parameters: {
          analysisType: 'performance_audit',
          codeContent: '{codeContent}',
          language: '{language}',
          framework: '{framework}'
        }
      }
    },
    {
      id: 'typescript-validation',
      name: 'TypeScript Type Checking',
      type: 'mcp-tool',
      description: 'Validate TypeScript types and suggest improvements',
      config: {
        toolId: 'typescript-checker',
        parameters: {
          sourceCode: '{codeContent}',
          strictMode: true,
          checkType: 'all'
        }
      },
      dependencies: ['analyze-code-quality']
    },
    {
      id: 'comprehensive-review',
      name: 'AI Code Review Analysis',
      type: 'agent-task',
      description: 'Generate comprehensive code review with recommendations',
      config: {
        agentId: 'code-reviewer',
        taskType: 'review',
        prompt: 'code-review-cot',
        context: {
          codeContent: '{codeContent}',
          qualityAnalysis: '{codeQualityResults}',
          securityFindings: '{securityScanResults}',
          performanceIssues: '{performanceAuditResults}',
          typeIssues: '{typescriptValidationResults}'
        }
      },
      dependencies: ['security-scan', 'performance-audit', 'typescript-validation']
    }
  ],
  triggers: [
    {
      type: 'manual',
      config: {
        requiredRole: ['developer', 'senior-developer', 'tech-lead']
      }
    },
    {
      type: 'event',
      config: {
        eventType: 'pull-request-created',
        autoTrigger: false
      }
    }
  ],
  requiredContext: ['codeContent', 'language'],
  expectedOutputs: ['codeQualityResults', 'securityFindings', 'performanceIssues', 'comprehensiveReview'],
  estimatedDuration: 180000, // 3 minutes
  costEstimate: 1.75
};

/**
 * Feature Development Workflow
 */
export const FEATURE_DEVELOPMENT_WORKFLOW: WorkflowDefinition = {
  id: 'feature-development',
  name: 'Feature Development Assistant',
  description: 'End-to-end feature development with code generation, testing, and documentation',
  category: 'development',
  version: '1.0.0',
  steps: [
    {
      id: 'analyze-requirements',
      name: 'Analyze Feature Requirements',
      type: 'agent-task',
      description: 'Break down requirements and plan implementation',
      config: {
        agentId: 'senior-developer',
        taskType: 'analysis',
        context: {
          requirements: '{requirements}',
          existingArchitecture: '{architecture}',
          constraints: '{constraints}'
        }
      }
    },
    {
      id: 'generate-code',
      name: 'Generate Feature Code',
      type: 'agent-task',
      description: 'Generate clean, maintainable code following best practices',
      config: {
        agentId: 'senior-developer',
        taskType: 'generation',
        prompt: 'code-generation-cot',
        context: {
          requirements: '{requirements}',
          framework: '{framework}',
          language: '{language}',
          architecture: '{architecture}',
          analysisResults: '{requirementsAnalysis}'
        }
      },
      dependencies: ['analyze-requirements']
    },
    {
      id: 'generate-tests',
      name: 'Generate Unit Tests',
      type: 'agent-task',
      description: 'Create comprehensive test suite for the feature',
      config: {
        agentId: 'testing-specialist',
        taskType: 'generation',
        context: {
          codeGenerated: '{generatedCode}',
          testingFramework: '{testingFramework}',
          requirements: '{requirements}'
        }
      },
      dependencies: ['generate-code']
    },
    {
      id: 'code-review',
      name: 'Automated Code Review',
      type: 'agent-task',
      description: 'Review generated code for quality and best practices',
      config: {
        agentId: 'code-reviewer',
        taskType: 'review',
        prompt: 'code-review-cot',
        context: {
          codeContent: '{generatedCode}',
          requirements: '{requirements}',
          framework: '{framework}'
        }
      },
      dependencies: ['generate-code']
    },
    {
      id: 'run-tests',
      name: 'Execute Test Suite',
      type: 'mcp-tool',
      description: 'Run tests and generate coverage report',
      config: {
        toolId: 'test-runner',
        parameters: {
          testType: 'unit',
          coverage: true,
          environment: 'testing'
        }
      },
      dependencies: ['generate-tests']
    }
  ],
  triggers: [
    {
      type: 'manual',
      config: {
        requiredRole: ['developer', 'senior-developer']
      }
    }
  ],
  requiredContext: ['requirements', 'framework', 'language', 'architecture'],
  expectedOutputs: ['requirementsAnalysis', 'generatedCode', 'testSuite', 'codeReviewResults'],
  estimatedDuration: 420000, // 7 minutes
  costEstimate: 3.50
};

/**
 * Performance Optimization Workflow
 */
export const PERFORMANCE_OPTIMIZATION_WORKFLOW: WorkflowDefinition = {
  id: 'performance-optimization',
  name: 'Performance Optimization Analysis',
  description: 'Comprehensive performance analysis and optimization recommendations',
  category: 'performance',
  version: '1.0.0',
  steps: [
    {
      id: 'bundle-analysis',
      name: 'Analyze Bundle Size',
      type: 'mcp-tool',
      description: 'Analyze bundle size and identify optimization opportunities',
      config: {
        toolId: 'bundle-analyzer',
        parameters: {
          bundlePath: '{bundlePath}',
          analysisType: 'size_analysis',
          threshold: 100
        }
      }
    },
    {
      id: 'performance-profiling',
      name: 'Profile Application Performance',
      type: 'mcp-tool',
      description: 'Generate performance profile and Core Web Vitals',
      config: {
        toolId: 'performance-profiler',
        parameters: {
          profileType: 'core_web_vitals',
          targetUrl: '{targetUrl}',
          device: '{device}'
        }
      }
    },
    {
      id: 'code-performance-audit',
      name: 'Code Performance Audit',
      type: 'mcp-tool',
      description: 'Analyze code for performance issues',
      config: {
        toolId: 'code-analyzer',
        parameters: {
          analysisType: 'performance_audit',
          codeContent: '{codeContent}',
          language: '{language}',
          framework: '{framework}'
        }
      }
    },
    {
      id: 'optimization-strategy',
      name: 'Generate Optimization Strategy',
      type: 'agent-task',
      description: 'Create comprehensive performance optimization plan',
      config: {
        agentId: 'senior-developer',
        taskType: 'consultation',
        prompt: 'performance-optimization-cot',
        context: {
          bundleAnalysis: '{bundleAnalysisResults}',
          performanceProfile: '{performanceProfilingResults}',
          codeAudit: '{codePerformanceAuditResults}',
          targetMetrics: '{targetMetrics}'
        }
      },
      dependencies: ['bundle-analysis', 'performance-profiling', 'code-performance-audit']
    }
  ],
  triggers: [
    {
      type: 'manual',
      config: {
        requiredRole: ['developer', 'senior-developer', 'performance-engineer']
      }
    },
    {
      type: 'event',
      config: {
        eventType: 'performance-threshold-exceeded',
        autoTrigger: true
      }
    }
  ],
  requiredContext: ['bundlePath', 'targetUrl', 'codeContent', 'language', 'framework'],
  expectedOutputs: ['bundleAnalysisResults', 'performanceProfile', 'optimizationStrategy'],
  estimatedDuration: 240000, // 4 minutes
  costEstimate: 2.25
};

/**
 * All Available Workflows
 */
export const WORKFLOW_DEFINITIONS: Record<string, WorkflowDefinition> = {
  'client-financial-health-review': CLIENT_FINANCIAL_HEALTH_WORKFLOW,
  'code-review-workflow': CODE_REVIEW_WORKFLOW,
  'feature-development': FEATURE_DEVELOPMENT_WORKFLOW,
  'performance-optimization': PERFORMANCE_OPTIMIZATION_WORKFLOW
};

/**
 * Workflow Engine - Manages workflow execution and orchestration
 */
export class WorkflowEngine {
  private modeManager: AIModeManager;
  private agentOrchestrator: AgentOrchestrator;
  private mcpClient: MCPClient;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor(
    modeManager: AIModeManager,
    agentOrchestrator: AgentOrchestrator,
    mcpClient: MCPClient
  ) {
    this.modeManager = modeManager;
    this.agentOrchestrator = agentOrchestrator;
    this.mcpClient = mcpClient;
  }

  /**
   * Execute a workflow with given context
   */
  public async executeWorkflow(
    workflowId: string,
    context: Record<string, any>,
    options?: {
      mode?: string;
      priority?: 'low' | 'medium' | 'high';
      dryRun?: boolean;
    }
  ): Promise<WorkflowExecution> {
    const workflow = WORKFLOW_DEFINITIONS[workflowId];
    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }

    // Validate required context
    this.validateContext(workflow, context);

    // Create execution instance
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: 'pending',
      startTime: new Date(),
      context,
      results: {},
      stepResults: new Map(),
      errors: [],
      metrics: {
        totalSteps: workflow.steps.length,
        completedSteps: 0,
        failedSteps: 0,
        totalCost: 0,
        tokensUsed: 0,
        executionTime: 0
      }
    };

    // Set appropriate AI mode
    if (options?.mode) {
      this.modeManager.switchToMode(options.mode);
    } else {
      this.modeManager.autoDetectMode();
    }

    this.activeExecutions.set(execution.id, execution);

    if (options?.dryRun) {
      return this.performDryRun(workflow, execution);
    }

    try {
      execution.status = 'running';
      await this.executeWorkflowSteps(workflow, execution);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.metrics.executionTime = execution.endTime.getTime() - execution.startTime.getTime();

    } catch (error) {
      console.error(`Workflow execution failed:`, error);
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors.push({
        stepId: 'workflow-engine',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }

    return execution;
  }

  /**
   * Execute workflow steps in order
   */
  private async executeWorkflowSteps(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    const stepQueue = [...workflow.steps];
    const completedSteps = new Set<string>();

    while (stepQueue.length > 0) {
      const readySteps = stepQueue.filter(step => 
        !step.dependencies || step.dependencies.every(dep => completedSteps.has(dep))
      );

      if (readySteps.length === 0) {
        throw new Error('Circular dependency detected in workflow steps');
      }

      const step = readySteps[0]; // Execute one step at a time for now
      
      try {
        // Check conditions
        if (step.conditions && !this.evaluateConditions(step.conditions, execution)) {
          console.log(`Step ${step.id} skipped due to conditions`);
          completedSteps.add(step.id);
          stepQueue.splice(stepQueue.indexOf(step), 1);
          continue;
        }

        const result = await this.executeStep(step, execution);
        execution.stepResults.set(step.id, result);
        execution.metrics.completedSteps++;
        completedSteps.add(step.id);

        // Remove completed step from queue
        stepQueue.splice(stepQueue.indexOf(step), 1);

      } catch (error) {
        console.error(`Step ${step.id} failed:`, error);
        execution.errors.push({
          stepId: step.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
        execution.metrics.failedSteps++;
        throw error;
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    console.log(`Executing step: ${step.name}`);

    switch (step.type) {
      case 'agent-task':
        return this.executeAgentTask(step, execution);
      
      case 'mcp-tool':
        return this.executeMCPTool(step, execution);
      
      case 'prompt-generation':
        return this.executePromptGeneration(step, execution);
      
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  /**
   * Execute agent task step
   */
  private async executeAgentTask(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const { agentId, taskType, context = {} } = step.config;

    // Resolve context variables
    const resolvedContext = this.resolveContextVariables(context, execution);

    const task: AgentTask = {
      id: `${step.id}_${Date.now()}`,
      agentId,
      type: taskType,
      priority: 'medium',
      input: resolvedContext,
      context: resolvedContext,
      requiredCapabilities: []
    };

    const result = await this.agentOrchestrator.executeTask(task, this.modeManager.getCurrentMode());
    
    execution.metrics.totalCost += result.costEstimate;
    execution.metrics.tokensUsed += result.agentResponses.reduce((sum, r) => sum + r.metadata.tokensUsed, 0);

    return result.primaryResult;
  }

  /**
   * Execute MCP tool step
   */
  private async executeMCPTool(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const { toolId, parameters } = step.config;

    // Resolve parameter variables
    const resolvedParameters = this.resolveContextVariables(parameters, execution);

    const toolCall: MCPToolCall = {
      toolId,
      parameters: resolvedParameters,
      context: {
        userId: execution.context.userId,
        organizationId: execution.context.organizationId,
        clientId: execution.context.clientId,
        mode: this.modeManager.getCurrentMode().id
      }
    };

    const result = await this.mcpClient.executeTool(toolCall);
    
    if (!result.success) {
      throw new Error(`MCP tool execution failed: ${result.error?.message}`);
    }

    execution.metrics.totalCost += result.metadata.cost || 0;

    return result.data;
  }

  /**
   * Execute prompt generation step
   */
  private async executePromptGeneration(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const { promptId, variables, context = {} } = step.config;

    const resolvedVariables = this.resolveContextVariables(variables, execution);

    const formattedPrompt = AdvancedPromptFormatter.formatCOTPrompt(
      promptId,
      resolvedVariables,
      {
        mode: this.modeManager.getCurrentMode().id,
        season: execution.context.temporalContext?.season || 'normal',
        urgency: execution.context.temporalContext?.urgency || 'medium'
      }
    );

    return formattedPrompt;
  }

  /**
   * Resolve context variables in configuration
   */
  private resolveContextVariables(config: any, execution: WorkflowExecution): any {
    if (typeof config === 'string') {
      return this.resolveVariableString(config, execution);
    }

    if (Array.isArray(config)) {
      return config.map(item => this.resolveContextVariables(item, execution));
    }

    if (typeof config === 'object' && config !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(config)) {
        resolved[key] = this.resolveContextVariables(value, execution);
      }
      return resolved;
    }

    return config;
  }

  /**
   * Resolve variable placeholders in strings
   */
  private resolveVariableString(str: string, execution: WorkflowExecution): any {
    return str.replace(/\{(\w+)\}/g, (match, varName) => {
      // Check execution context first
      if (execution.context.hasOwnProperty(varName)) {
        return execution.context[varName];
      }

      // Check step results
      if (execution.stepResults.has(varName)) {
        return execution.stepResults.get(varName);
      }

      console.warn(`Variable ${varName} not found in context or step results`);
      return match; // Return original placeholder if not found
    });
  }

  /**
   * Evaluate step conditions
   */
  private evaluateConditions(conditions: any[], execution: WorkflowExecution): boolean {
    return conditions.every(condition => {
      const { field, operator, value } = condition;
      const fieldValue = execution.context[field] || execution.stepResults.get(field);

      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'greater_than':
          return Number(fieldValue) > Number(value);
        case 'less_than':
          return Number(fieldValue) < Number(value);
        case 'contains':
          return String(fieldValue).includes(String(value));
        default:
          return false;
      }
    });
  }

  /**
   * Validate workflow context
   */
  private validateContext(workflow: WorkflowDefinition, context: Record<string, any>): void {
    const missingFields = workflow.requiredContext.filter(field => 
      context[field] === undefined || context[field] === null
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required context fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Perform dry run of workflow
   */
  private async performDryRun(workflow: WorkflowDefinition, execution: WorkflowExecution): Promise<WorkflowExecution> {
    execution.status = 'completed';
    execution.results = {
      dryRun: true,
      estimatedDuration: workflow.estimatedDuration,
      estimatedCost: workflow.costEstimate,
      stepsToExecute: workflow.steps.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type
      }))
    };
    return execution;
  }

  /**
   * Get workflow execution status
   */
  public getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Get all active executions
   */
  public getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values()).filter(e => e.status === 'running');
  }
}

/**
 * Create workflow engine instance
 */
export function createWorkflowEngine(
  modeManager: AIModeManager,
  agentOrchestrator: AgentOrchestrator,
  mcpClient: MCPClient
): WorkflowEngine {
  return new WorkflowEngine(modeManager, agentOrchestrator, mcpClient);
}

/**
 * Get all available workflows
 */
export function getAllWorkflows(): WorkflowDefinition[] {
  return Object.values(WORKFLOW_DEFINITIONS);
}

/**
 * Get workflow by ID
 */
export function getWorkflow(workflowId: string): WorkflowDefinition | undefined {
  return WORKFLOW_DEFINITIONS[workflowId];
}