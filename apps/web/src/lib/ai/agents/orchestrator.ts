/**
 * Advanced AI Agent Orchestration System
 * Manages multiple specialized AI agents with coordination, handoffs, and collaboration
 */

import { openaiClient } from '../openai-client';
import type { AIModeConfig } from '../modes';

export interface Agent {
  id: string;
  name: string;
  role: string;
  specialty: string[];
  capabilities: string[];
  model: string;
  systemPrompt: string;
  tools: string[];
  confidenceThreshold: number;
  maxTokens: number;
  temperature: number;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: 'analysis' | 'generation' | 'review' | 'consultation' | 'processing';
  priority: 'high' | 'medium' | 'low';
  input: Record<string, any>;
  context: Record<string, any>;
  requiredCapabilities: string[];
  deadline?: Date;
  dependencies?: string[];
}

export interface AgentResponse {
  agentId: string;
  taskId: string;
  success: boolean;
  confidence: number;
  result: any;
  reasoning?: string;
  suggestions?: string[];
  nextSteps?: string[];
  handoffRecommendation?: {
    toAgent: string;
    reason: string;
    context: Record<string, any>;
  };
  metadata: {
    tokensUsed: number;
    processingTime: number;
    model: string;
  };
}

export interface OrchestrationResult {
  success: boolean;
  primaryResult: any;
  agentResponses: AgentResponse[];
  finalConfidence: number;
  executionTime: number;
  costEstimate: number;
}

/**
 * Senior CPA Advisor Agent - Primary business advisory agent
 */
export const SENIOR_CPA_ADVISOR: Agent = {
  id: 'senior-cpa-advisor',
  name: 'Senior CPA Advisor',
  role: 'primary-advisor',
  specialty: ['business-advisory', 'financial-analysis', 'strategic-planning'],
  capabilities: [
    'financial-analysis',
    'business-consulting',
    'strategic-planning',
    'client-communication',
    'risk-assessment',
    'performance-analysis'
  ],
  model: 'gpt-4',
  systemPrompt: `You are a Senior CPA and business advisor with 20+ years of experience. You provide strategic business advice, financial analysis, and help clients make informed financial decisions. You:

- Analyze complex financial situations with deep expertise
- Provide actionable business recommendations
- Communicate complex concepts clearly to clients
- Identify risks and opportunities
- Coordinate with specialized team members when needed
- Always maintain the highest professional standards

When you encounter questions outside your expertise, recommend appropriate specialists.`,
  tools: ['financial-calculator', 'ratio-analysis', 'benchmark-data', 'industry-insights'],
  confidenceThreshold: 0.8,
  maxTokens: 2000,
  temperature: 0.3
};

/**
 * Tax Specialist Agent - Expert in tax matters
 */
export const TAX_SPECIALIST: Agent = {
  id: 'tax-specialist',
  name: 'Tax Specialist',
  role: 'specialist',
  specialty: ['tax-planning', 'compliance', 'deductions', 'tax-law'],
  capabilities: [
    'tax-calculation',
    'deduction-identification',
    'compliance-checking',
    'tax-planning',
    'audit-support',
    'tax-law-research'
  ],
  model: 'gpt-4',
  systemPrompt: `You are a specialized Tax CPA with deep expertise in federal and state tax laws. You focus exclusively on tax-related matters including:

- Tax optimization and planning strategies
- Deduction and credit identification
- Compliance requirements and deadlines
- Tax law research and interpretation
- Audit defense strategies
- Multi-state tax considerations

You stay current with tax law changes and provide accurate, compliant advice.`,
  tools: ['tax-calculator', 'tax-law-database', 'deduction-finder', 'compliance-checker'],
  confidenceThreshold: 0.85,
  maxTokens: 1800,
  temperature: 0.2
};

/**
 * Client Relationship Manager Agent - Focuses on communication and relationship building
 */
export const CLIENT_RELATIONSHIP_MANAGER: Agent = {
  id: 'client-relationship-manager',
  name: 'Client Relationship Manager',
  role: 'specialist',
  specialty: ['communication', 'relationship-building', 'client-service'],
  capabilities: [
    'client-communication',
    'email-drafting',
    'meeting-preparation',
    'conflict-resolution',
    'expectation-management',
    'service-coordination'
  ],
  model: 'gpt-3.5-turbo',
  systemPrompt: `You are a Client Relationship Manager specializing in professional communication and client service. You excel at:

- Crafting professional, empathetic communications
- Managing client expectations and relationships
- Coordinating services across team members
- Resolving concerns diplomatically
- Preparing for client meetings and calls
- Building long-term client loyalty

Your communications are always professional, clear, and client-focused.`,
  tools: ['email-templates', 'communication-tracker', 'client-history', 'scheduling-system'],
  confidenceThreshold: 0.75,
  maxTokens: 1500,
  temperature: 0.4
};

/**
 * Senior Developer Agent - Full-stack development expertise
 */
export const SENIOR_DEVELOPER: Agent = {
  id: 'senior-developer',
  name: 'Senior Developer',
  role: 'primary-developer',
  specialty: ['full-stack-development', 'architecture-design', 'code-generation', 'debugging'],
  capabilities: [
    'code-generation',
    'architecture-design',
    'debugging',
    'performance-optimization',
    'code-refactoring',
    'api-design',
    'database-design',
    'testing-strategies'
  ],
  model: 'gpt-4',
  systemPrompt: `You are a Senior Full-Stack Developer with 10+ years of experience in modern web development. You excel at:

- Writing clean, maintainable, and efficient code
- Designing scalable application architectures
- Debugging complex issues with systematic approaches
- Optimizing application performance
- Following best practices and coding standards
- Mentoring junior developers

You work with TypeScript, React, Next.js, Node.js, and modern development tools. Always consider security, performance, accessibility, and maintainability in your solutions.`,
  tools: ['code-analyzer', 'typescript-checker', 'bundler-analyzer', 'git-integration'],
  confidenceThreshold: 0.85,
  maxTokens: 3000,
  temperature: 0.2
};

/**
 * Code Reviewer Agent - Code quality and security specialist
 */
export const CODE_REVIEWER: Agent = {
  id: 'code-reviewer',
  name: 'Code Reviewer',
  role: 'specialist',
  specialty: ['code-quality', 'security-analysis', 'best-practices', 'standards-compliance'],
  capabilities: [
    'code-quality-analysis',
    'security-vulnerability-detection',
    'performance-review',
    'accessibility-audit',
    'type-safety-validation',
    'test-coverage-analysis'
  ],
  model: 'gpt-4',
  systemPrompt: `You are a meticulous Code Reviewer specializing in code quality, security, and best practices. You focus on:

- Identifying security vulnerabilities and potential exploits
- Ensuring code follows established patterns and conventions
- Checking for performance issues and optimization opportunities
- Validating accessibility compliance
- Reviewing test coverage and quality
- Suggesting improvements for maintainability

You have deep knowledge of OWASP security guidelines, performance optimization techniques, and accessibility standards.`,
  tools: ['security-scanner', 'performance-profiler', 'accessibility-checker', 'linter'],
  confidenceThreshold: 0.9,
  maxTokens: 2500,
  temperature: 0.1
};

/**
 * Testing Specialist Agent - Test automation and quality assurance
 */
export const TESTING_SPECIALIST: Agent = {
  id: 'testing-specialist',
  name: 'Testing Specialist',
  role: 'specialist',
  specialty: ['test-automation', 'quality-assurance', 'test-strategy', 'e2e-testing'],
  capabilities: [
    'test-case-generation',
    'test-automation',
    'performance-testing',
    'integration-testing',
    'e2e-testing',
    'test-data-management',
    'quality-metrics'
  ],
  model: 'gpt-4',
  systemPrompt: `You are a Testing Specialist with expertise in comprehensive quality assurance strategies. You excel at:

- Designing effective test strategies and test plans
- Writing comprehensive unit, integration, and E2E tests
- Implementing test automation frameworks
- Performance and load testing
- Test data management and mocking strategies
- Quality metrics and reporting

You work with Jest, Playwright, Cypress, and modern testing frameworks to ensure robust, reliable applications.`,
  tools: ['test-runner', 'coverage-analyzer', 'performance-tester', 'mock-generator'],
  confidenceThreshold: 0.8,
  maxTokens: 2000,
  temperature: 0.3
};

/**
 * DevOps Engineer Agent - Infrastructure and deployment specialist
 */
export const DEVOPS_ENGINEER: Agent = {
  id: 'devops-engineer',
  name: 'DevOps Engineer',
  role: 'specialist',
  specialty: ['infrastructure', 'ci-cd', 'deployment', 'monitoring', 'scalability'],
  capabilities: [
    'infrastructure-design',
    'ci-cd-pipeline-setup',
    'containerization',
    'orchestration',
    'monitoring-implementation',
    'cost-optimization',
    'security-hardening'
  ],
  model: 'gpt-4',
  systemPrompt: `You are a DevOps Engineer specializing in modern infrastructure and deployment practices. You focus on:

- Designing scalable and resilient infrastructure
- Implementing efficient CI/CD pipelines
- Container orchestration with Docker and Kubernetes
- Monitoring and observability solutions
- Cost optimization and resource management
- Security hardening and compliance
- Automation and infrastructure as code

You work with cloud platforms (AWS, Azure, GCP), Terraform, Docker, Kubernetes, and monitoring tools.`,
  tools: ['docker-tools', 'kubernetes-manager', 'terraform-integration', 'monitoring-tools'],
  confidenceThreshold: 0.8,
  maxTokens: 2500,
  temperature: 0.2
};

/**
 * UI/UX Designer Agent - User interface and experience specialist
 */
export const UI_DESIGNER: Agent = {
  id: 'ui-designer',
  name: 'UI/UX Designer',
  role: 'specialist',
  specialty: ['ui-design', 'ux-optimization', 'accessibility', 'design-systems'],
  capabilities: [
    'ui-component-design',
    'ux-optimization',
    'accessibility-compliance',
    'design-system-creation',
    'user-research',
    'prototyping',
    'responsive-design'
  ],
  model: 'gpt-4',
  systemPrompt: `You are a UI/UX Designer with expertise in creating intuitive, accessible, and beautiful user interfaces. You excel at:

- Designing user-centered interfaces and experiences
- Creating and maintaining design systems
- Ensuring accessibility compliance (WCAG)
- Optimizing user flows and interactions
- Responsive and mobile-first design
- Component-based design thinking
- User research and usability testing

You work with modern design tools and understand frontend technologies to create implementable designs.`,
  tools: ['design-system-analyzer', 'accessibility-checker', 'color-contrast-checker'],
  confidenceThreshold: 0.75,
  maxTokens: 2000,
  temperature: 0.4
};

/**
 * All available agents
 */
export const AGENTS: Record<string, Agent> = {
  'senior-cpa-advisor': SENIOR_CPA_ADVISOR,
  'tax-specialist': TAX_SPECIALIST,
  'client-relationship-manager': CLIENT_RELATIONSHIP_MANAGER,
  'senior-developer': SENIOR_DEVELOPER,
  'code-reviewer': CODE_REVIEWER,
  'testing-specialist': TESTING_SPECIALIST,
  'devops-engineer': DEVOPS_ENGINEER,
  'ui-designer': UI_DESIGNER
};

/**
 * Agent Orchestrator - Manages multiple agents and coordinates their work
 */
export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private activeTasks: Map<string, AgentTask> = new Map();
  private executionHistory: AgentResponse[] = [];

  constructor() {
    // Load all available agents
    Object.values(AGENTS).forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * Execute a task using the most appropriate agent(s)
   */
  public async executeTask(
    task: AgentTask,
    mode: AIModeConfig
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    
    try {
      // Select the best agent for this task
      const primaryAgent = this.selectBestAgent(task, mode);
      
      if (!primaryAgent) {
        throw new Error(`No suitable agent found for task: ${task.type}`);
      }

      // Execute primary task
      const primaryResponse = await this.executeAgentTask(primaryAgent, task);
      
      const responses: AgentResponse[] = [primaryResponse];
      let finalResult = primaryResponse.result;
      let finalConfidence = primaryResponse.confidence;

      // Check if we need collaboration or handoff
      if (primaryResponse.handoffRecommendation) {
        const handoffAgent = this.agents.get(primaryResponse.handoffRecommendation.toAgent);
        
        if (handoffAgent) {
          const handoffTask: AgentTask = {
            ...task,
            id: `${task.id}-handoff`,
            agentId: handoffAgent.id,
            context: {
              ...task.context,
              ...primaryResponse.handoffRecommendation.context,
              previousResult: primaryResponse.result
            }
          };

          const handoffResponse = await this.executeAgentTask(handoffAgent, handoffTask);
          responses.push(handoffResponse);
          
          // Combine results
          finalResult = this.combineResults([primaryResponse.result, handoffResponse.result]);
          finalConfidence = Math.min(primaryResponse.confidence, handoffResponse.confidence);
        }
      }

      const executionTime = Date.now() - startTime;
      const costEstimate = this.calculateCostEstimate(responses);

      return {
        success: true,
        primaryResult: finalResult,
        agentResponses: responses,
        finalConfidence,
        executionTime,
        costEstimate
      };

    } catch (error) {
      console.error('Task execution failed:', error);
      
      return {
        success: false,
        primaryResult: null,
        agentResponses: [],
        finalConfidence: 0,
        executionTime: Date.now() - startTime,
        costEstimate: 0
      };
    }
  }

  /**
   * Execute a specific task with a specific agent
   */
  private async executeAgentTask(agent: Agent, task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Prepare the prompt
      const systemMessage = agent.systemPrompt;
      const userMessage = this.formatTaskForAgent(task, agent);

      // Make the API call
      const response = await openaiClient.createCompletion({
        model: agent.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        max_tokens: agent.maxTokens,
        temperature: agent.temperature
      });

      // Extract result and confidence
      const result = response.choices[0].message.content;
      const confidence = this.calculateConfidence(result, agent);

      // Check for handoff recommendation
      const handoffRecommendation = this.analyzeForHandoff(result, agent);

      return {
        agentId: agent.id,
        taskId: task.id,
        success: true,
        confidence,
        result,
        handoffRecommendation,
        metadata: {
          tokensUsed: response.usage?.total_tokens || 0,
          processingTime: Date.now() - startTime,
          model: agent.model
        }
      };

    } catch (error) {
      console.error(`Agent ${agent.id} task execution failed:`, error);
      
      return {
        agentId: agent.id,
        taskId: task.id,
        success: false,
        confidence: 0,
        result: null,
        metadata: {
          tokensUsed: 0,
          processingTime: Date.now() - startTime,
          model: agent.model
        }
      };
    }
  }

  /**
   * Select the best agent for a given task
   */
  private selectBestAgent(task: AgentTask, mode: AIModeConfig): Agent | null {
    // First, try to get the primary agent for the current mode
    const primaryAgent = this.agents.get(mode.primaryAgent);
    
    if (primaryAgent && this.agentCanHandleTask(primaryAgent, task)) {
      return primaryAgent;
    }

    // Look for supporting agents
    for (const agentId of mode.supportingAgents) {
      const agent = this.agents.get(agentId);
      if (agent && this.agentCanHandleTask(agent, task)) {
        return agent;
      }
    }

    // Fallback: find any agent that can handle this task
    for (const agent of this.agents.values()) {
      if (this.agentCanHandleTask(agent, task)) {
        return agent;
      }
    }

    return null;
  }

  /**
   * Check if an agent can handle a specific task
   */
  private agentCanHandleTask(agent: Agent, task: AgentTask): boolean {
    // Check if agent has required capabilities
    return task.requiredCapabilities.every(capability => 
      agent.capabilities.includes(capability) || agent.specialty.includes(capability)
    );
  }

  /**
   * Format a task for a specific agent
   */
  private formatTaskForAgent(task: AgentTask, agent: Agent): string {
    const contextInfo = Object.entries(task.context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    const inputInfo = Object.entries(task.input)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return `
Task Type: ${task.type}
Priority: ${task.priority}

Context:
${contextInfo}

Input:
${inputInfo}

Required Capabilities: ${task.requiredCapabilities.join(', ')}

Please provide your analysis and recommendations based on your expertise in: ${agent.specialty.join(', ')}
    `.trim();
  }

  /**
   * Calculate confidence score based on agent response
   */
  private calculateConfidence(result: any, agent: Agent): number {
    // Simple confidence calculation
    if (!result || typeof result !== 'string') return 0;
    
    const length = result.length;
    const hasNumbers = /\d/.test(result);
    const hasSpecificTerms = agent.specialty.some(term => 
      result.toLowerCase().includes(term.replace('-', ' '))
    );
    
    let confidence = 0.5; // Base confidence
    
    if (length > 100) confidence += 0.1;
    if (length > 500) confidence += 0.1;
    if (hasNumbers) confidence += 0.1;
    if (hasSpecificTerms) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Analyze if a handoff to another agent is recommended
   */
  private analyzeForHandoff(result: any, agent: Agent): AgentResponse['handoffRecommendation'] {
    if (!result || typeof result !== 'string') return undefined;
    
    const resultLower = result.toLowerCase();
    
    // Look for indicators that suggest other expertise is needed
    if (agent.id !== 'tax-specialist' && (
      resultLower.includes('tax') || resultLower.includes('deduction') || resultLower.includes('irs')
    )) {
      return {
        toAgent: 'tax-specialist',
        reason: 'Tax expertise required for complete analysis',
        context: { originalAnalysis: result }
      };
    }
    
    if (agent.id !== 'client-relationship-manager' && (
      resultLower.includes('communicate') || resultLower.includes('client meeting') || resultLower.includes('email')
    )) {
      return {
        toAgent: 'client-relationship-manager',
        reason: 'Client communication expertise needed',
        context: { technicalAnalysis: result }
      };
    }
    
    return undefined;
  }

  /**
   * Combine results from multiple agents
   */
  private combineResults(results: any[]): any {
    return {
      primaryAnalysis: results[0],
      additionalInsights: results.slice(1),
      combinedRecommendations: results.flatMap(r => r.recommendations || [])
    };
  }

  /**
   * Calculate estimated cost for agent responses
   */
  private calculateCostEstimate(responses: AgentResponse[]): number {
    return responses.reduce((total, response) => {
      // Rough cost calculation: $0.03/1K tokens for GPT-4, $0.002/1K tokens for GPT-3.5
      const costPerToken = response.metadata.model.includes('gpt-4') ? 0.00003 : 0.000002;
      return total + (response.metadata.tokensUsed * costPerToken);
    }, 0);
  }
}

/**
 * Create orchestrator instance
 */
export function createAgentOrchestrator(): AgentOrchestrator {
  return new AgentOrchestrator();
}

/**
 * Get all available agents
 */
export function getAllAgents(): Agent[] {
  return Object.values(AGENTS);
}

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): Agent | undefined {
  return AGENTS[agentId];
}