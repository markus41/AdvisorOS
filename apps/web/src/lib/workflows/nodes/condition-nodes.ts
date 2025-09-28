import { z } from 'zod';
import {
  NodeType,
  NodeData,
  NodeConfig,
  ExecutionContext,
  ConditionConfig,
  ApprovalConfig
} from '../types';
import { BaseWorkflowNode } from './base-node';

// If/Else Condition Node
export class IfConditionNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.IF_CONDITION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const conditionConfig = config as ConditionConfig;

    if (!conditionConfig.expression) {
      errors.push('Condition expression is required');
    }

    if (!conditionConfig.variable) {
      errors.push('Variable to test is required');
    }

    if (!conditionConfig.operator) {
      errors.push('Comparison operator is required');
    }

    if (conditionConfig.value === undefined || conditionConfig.value === null) {
      errors.push('Comparison value is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as ConditionConfig;

    // Evaluate the condition
    const result = this.evaluateCondition(config, context, input);

    this.log('info', `Condition evaluated: ${result}`, {
      expression: config.expression,
      variable: config.variable,
      operator: config.operator,
      value: config.value,
      result
    });

    return {
      condition: config.expression,
      result,
      evaluatedAt: new Date(),
      path: result ? 'true' : 'false',
      variable: config.variable,
      actualValue: this.getVariableValue(config.variable, context, input),
      expectedValue: config.value
    };
  }

  private evaluateCondition(config: ConditionConfig, context: ExecutionContext, input?: any): boolean {
    const actualValue = this.getVariableValue(config.variable, context, input);

    switch (config.operator) {
      case 'equals':
        return actualValue === config.value;
      case 'not_equals':
        return actualValue !== config.value;
      case 'greater_than':
        return Number(actualValue) > Number(config.value);
      case 'less_than':
        return Number(actualValue) < Number(config.value);
      case 'contains':
        return String(actualValue).includes(String(config.value));
      case 'custom':
        return this.evaluateCustomExpression(config.expression, context, input);
      default:
        throw new Error(`Unknown operator: ${config.operator}`);
    }
  }

  private getVariableValue(variable: string, context: ExecutionContext, input?: any): any {
    // Check context variables first
    if (context.variables[variable] !== undefined) {
      return context.variables[variable];
    }

    // Check input variables
    if (input && typeof input === 'object') {
      const keys = variable.split('.');
      let value = input;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return undefined;
        }
      }
      return value;
    }

    return undefined;
  }

  private evaluateCustomExpression(expression: string, context: ExecutionContext, input?: any): boolean {
    // This is a simplified expression evaluator
    // In a production system, you'd use a proper expression parser/evaluator
    try {
      // Replace variables in the expression
      let evaluableExpression = expression;

      // Replace context variables
      Object.entries(context.variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(value));
      });

      // Replace input variables
      if (input && typeof input === 'object') {
        Object.entries(input).forEach(([key, value]) => {
          const regex = new RegExp(`\\binput\\.${key}\\b`, 'g');
          evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(value));
        });
      }

      // Use Function constructor for safe evaluation (limited scope)
      // Note: In production, consider using a proper expression evaluator library
      const func = new Function(`"use strict"; return (${evaluableExpression});`);
      return Boolean(func());
    } catch (error) {
      this.log('error', `Expression evaluation failed: ${expression}`, error);
      return false;
    }
  }

  public getConfigSchema() {
    return z.object({
      expression: z.string().min(1, 'Expression is required'),
      variable: z.string().min(1, 'Variable is required'),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'custom']),
      value: z.any()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      condition: z.string(),
      result: z.boolean(),
      evaluatedAt: z.date(),
      path: z.enum(['true', 'false']),
      variable: z.string(),
      actualValue: z.any(),
      expectedValue: z.any()
    });
  }

  public getMetadata() {
    return {
      icon: 'GitBranch',
      category: 'Conditions',
      description: 'Conditional branching with if/else logic',
      inputs: 1,
      outputs: 2
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new IfConditionNode(id, data);
  }

  public getEstimatedDuration(): number {
    return 500; // 0.5 seconds
  }
}

// Switch Condition Node
export class SwitchConditionNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.SWITCH_CONDITION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.variable) {
      errors.push('Variable to switch on is required');
    }

    if (!config.cases || !Array.isArray(config.cases) || config.cases.length === 0) {
      errors.push('At least one case is required');
    }

    // Validate each case
    config.cases?.forEach((caseItem: any, index: number) => {
      if (caseItem.value === undefined || caseItem.value === null) {
        errors.push(`Case ${index + 1}: Value is required`);
      }
      if (!caseItem.label) {
        errors.push(`Case ${index + 1}: Label is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config;
    const actualValue = this.getVariableValue(config.variable, context, input);

    // Find matching case
    const matchingCase = config.cases?.find((caseItem: any) =>
      this.compareValues(actualValue, caseItem.value)
    );

    const selectedPath = matchingCase ? matchingCase.label : 'default';

    this.log('info', `Switch condition evaluated`, {
      variable: config.variable,
      actualValue,
      selectedPath,
      availableCases: config.cases?.map((c: any) => c.label)
    });

    return {
      variable: config.variable,
      actualValue,
      selectedPath,
      matchingCase: matchingCase || null,
      evaluatedAt: new Date(),
      availablePaths: config.cases?.map((c: any) => c.label).concat(['default'])
    };
  }

  private getVariableValue(variable: string, context: ExecutionContext, input?: any): any {
    // Check context variables first
    if (context.variables[variable] !== undefined) {
      return context.variables[variable];
    }

    // Check input variables
    if (input && typeof input === 'object') {
      const keys = variable.split('.');
      let value = input;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return undefined;
        }
      }
      return value;
    }

    return undefined;
  }

  private compareValues(actual: any, expected: any): boolean {
    // Handle different types of comparison
    if (typeof actual === 'string' && typeof expected === 'string') {
      return actual.toLowerCase() === expected.toLowerCase();
    }

    return actual === expected;
  }

  public getConfigSchema() {
    return z.object({
      variable: z.string().min(1, 'Variable is required'),
      cases: z.array(z.object({
        value: z.any(),
        label: z.string().min(1, 'Label is required'),
        description: z.string().optional()
      })).min(1, 'At least one case is required'),
      hasDefault: z.boolean().optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      variable: z.string(),
      actualValue: z.any(),
      selectedPath: z.string(),
      matchingCase: z.any().nullable(),
      evaluatedAt: z.date(),
      availablePaths: z.array(z.string())
    });
  }

  public getMetadata() {
    return {
      icon: 'Filter',
      category: 'Conditions',
      description: 'Multiple condition branching (switch statement)',
      inputs: 1,
      outputs: -1 // Variable number of outputs
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new SwitchConditionNode(id, data);
  }

  public getEstimatedDuration(): number {
    return 500; // 0.5 seconds
  }
}

// Approval Node
export class ApprovalNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.APPROVAL_NODE, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const approvalConfig = config as ApprovalConfig;

    if (!approvalConfig.approvers || approvalConfig.approvers.length === 0) {
      errors.push('At least one approver is required');
    }

    if (approvalConfig.timeout && approvalConfig.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    if (approvalConfig.escalation) {
      if (!approvalConfig.escalation.after || approvalConfig.escalation.after <= 0) {
        errors.push('Escalation time must be positive');
      }
      if (!approvalConfig.escalation.to || approvalConfig.escalation.to.length === 0) {
        errors.push('Escalation recipients are required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as ApprovalConfig;

    // Create approval request
    const approvalRequest = await this.createApprovalRequest(config, context, input);

    this.log('info', `Approval request created: ${approvalRequest.id}`, {
      approvers: config.approvers,
      requireAll: config.requireAll,
      timeout: config.timeout
    });

    // Return approval request details
    // The actual approval would be handled asynchronously
    return {
      approvalId: approvalRequest.id,
      approvers: config.approvers,
      requireAll: config.requireAll || false,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: config.timeout ? new Date(Date.now() + config.timeout * 60 * 60 * 1000) : undefined,
      approvals: [],
      escalation: config.escalation
    };
  }

  private async createApprovalRequest(config: ApprovalConfig, context: ExecutionContext, input?: any) {
    // This would integrate with your approval system
    // For now, return a mock approval request
    return {
      id: `approval_${Date.now()}`,
      workflowId: context.metadata.workflowId,
      executionId: context.metadata.executionId,
      nodeId: this.id,
      approvers: config.approvers,
      requireAll: config.requireAll || false,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: config.timeout ? new Date(Date.now() + config.timeout * 60 * 60 * 1000) : undefined,
      requestData: {
        title: this.data.label,
        description: this.data.description,
        context: context.variables,
        input
      }
    };
  }

  public async handleApproval(approvalId: string, approverId: string, decision: 'approve' | 'reject', comments?: string) {
    // This method would be called when an approval decision is made
    const approval = {
      id: `${approvalId}_${approverId}`,
      approvalId,
      approverId,
      decision,
      comments,
      decidedAt: new Date()
    };

    this.log('info', `Approval decision received`, {
      approvalId,
      approverId,
      decision,
      comments
    });

    return approval;
  }

  public getConfigSchema() {
    return z.object({
      approvers: z.array(z.string()).min(1, 'At least one approver required'),
      requireAll: z.boolean().optional(),
      timeout: z.number().positive().optional(),
      escalation: z.object({
        after: z.number().positive(),
        to: z.array(z.string()).min(1)
      }).optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      approvalId: z.string(),
      approvers: z.array(z.string()),
      requireAll: z.boolean(),
      status: z.enum(['pending', 'approved', 'rejected', 'expired']),
      createdAt: z.date(),
      expiresAt: z.date().optional(),
      approvals: z.array(z.any()),
      escalation: z.any().optional()
    });
  }

  public getMetadata() {
    return {
      icon: 'UserCheck',
      category: 'Approvals',
      description: 'Requires approval before workflow continues',
      inputs: 1,
      outputs: 2 // approve/reject paths
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new ApprovalNode(id, data);
  }

  public getEstimatedDuration(): number {
    const config = this.data.config as ApprovalConfig;
    // For approval nodes, duration depends on timeout or default to 24 hours
    return (config.timeout || 24) * 60 * 60 * 1000; // Convert hours to milliseconds
  }

  public canRetry(): boolean {
    return false; // Approval nodes don't retry
  }
}