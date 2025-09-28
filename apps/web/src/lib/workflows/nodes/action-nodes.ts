import { z } from 'zod';
import {
  NodeType,
  NodeData,
  NodeConfig,
  ExecutionContext,
  TaskActionConfig,
  EmailActionConfig,
  DocumentActionConfig
} from '../types';
import { BaseWorkflowNode } from './base-node';

// Task Action Node
export class TaskActionNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.TASK_ACTION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const taskConfig = config as TaskActionConfig;

    if (!taskConfig.title) {
      errors.push('Task title is required');
    }

    if (!taskConfig.description) {
      errors.push('Task description is required');
    }

    if (taskConfig.priority && !['low', 'medium', 'high'].includes(taskConfig.priority)) {
      errors.push('Invalid priority level');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as TaskActionConfig;

    // Create task in the system
    const task = await this.createTask(config, context, input);

    this.log('info', `Task created: ${task.id}`, {
      title: config.title,
      assignee: config.assignee,
      priority: config.priority
    });

    return {
      taskId: task.id,
      title: config.title,
      description: config.description,
      assignee: config.assignee,
      priority: config.priority || 'medium',
      status: 'pending',
      createdAt: new Date(),
      dueDate: this.calculateDueDate(config.dueDate)
    };
  }

  private async createTask(config: TaskActionConfig, context: ExecutionContext, input?: any) {
    // This would integrate with your task management system
    // For now, return a mock task
    return {
      id: `task_${Date.now()}`,
      title: config.title,
      description: this.interpolateTemplate(config.description, context, input),
      assignee: config.assignee || context.userId,
      priority: config.priority || 'medium',
      status: 'pending',
      createdAt: new Date(),
      dueDate: this.calculateDueDate(config.dueDate),
      checklist: config.checklist || [],
      workflowId: context.metadata.workflowId,
      executionId: context.metadata.executionId
    };
  }

  private calculateDueDate(dueDate?: string): Date | undefined {
    if (!dueDate) return undefined;

    const now = new Date();

    // Parse relative dates like "+1d", "+2h", "+30m"
    const relativeMatch = dueDate.match(/^\+(\d+)([dhm])$/);
    if (relativeMatch) {
      const [, amount, unit] = relativeMatch;
      const num = parseInt(amount);

      switch (unit) {
        case 'd':
          return new Date(now.getTime() + num * 24 * 60 * 60 * 1000);
        case 'h':
          return new Date(now.getTime() + num * 60 * 60 * 1000);
        case 'm':
          return new Date(now.getTime() + num * 60 * 1000);
      }
    }

    // Try parsing as absolute date
    try {
      return new Date(dueDate);
    } catch {
      return undefined;
    }
  }

  private interpolateTemplate(template: string, context: ExecutionContext, input?: any): string {
    let result = template;

    // Replace context variables
    Object.entries(context.variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Replace input variables
    if (input && typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{input.${key}}}`, 'g'), String(value));
      });
    }

    return result;
  }

  public getConfigSchema() {
    return z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required'),
      assignee: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      checklist: z.array(z.string()).optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      taskId: z.string(),
      title: z.string(),
      description: z.string(),
      assignee: z.string().optional(),
      priority: z.string(),
      status: z.string(),
      createdAt: z.date(),
      dueDate: z.date().optional()
    });
  }

  public getMetadata() {
    return {
      icon: 'CheckSquare',
      category: 'Actions',
      description: 'Creates a new task in the system',
      inputs: 1,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new TaskActionNode(id, data);
  }

  public getEstimatedDuration(): number {
    return 2000; // 2 seconds
  }
}

// Email Action Node
export class EmailActionNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.EMAIL_ACTION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const emailConfig = config as EmailActionConfig;

    if (!emailConfig.to || emailConfig.to.length === 0) {
      errors.push('At least one recipient is required');
    }

    if (!emailConfig.subject) {
      errors.push('Email subject is required');
    }

    if (!emailConfig.template) {
      errors.push('Email template is required');
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailConfig.to?.forEach(email => {
      if (!emailRegex.test(email)) {
        errors.push(`Invalid email address: ${email}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as EmailActionConfig;

    // Send email
    const emailResult = await this.sendEmail(config, context, input);

    this.log('info', `Email sent to ${config.to.length} recipients`, {
      subject: config.subject,
      recipients: config.to.length
    });

    return {
      messageId: emailResult.messageId,
      to: config.to,
      cc: config.cc || [],
      bcc: config.bcc || [],
      subject: this.interpolateTemplate(config.subject, context, input),
      sentAt: new Date(),
      status: 'sent'
    };
  }

  private async sendEmail(config: EmailActionConfig, context: ExecutionContext, input?: any) {
    // This would integrate with your email service (e.g., SendGrid, SES, etc.)
    // For now, return a mock result

    const interpolatedSubject = this.interpolateTemplate(config.subject, context, input);
    const interpolatedBody = this.interpolateTemplate(config.template, context, input);

    // Mock email sending
    return {
      messageId: `email_${Date.now()}`,
      to: config.to,
      subject: interpolatedSubject,
      body: interpolatedBody,
      sentAt: new Date()
    };
  }

  private interpolateTemplate(template: string, context: ExecutionContext, input?: any): string {
    let result = template;

    // Replace context variables
    Object.entries(context.variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Replace input variables
    if (input && typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{input.${key}}}`, 'g'), String(value));
      });
    }

    return result;
  }

  public getConfigSchema() {
    return z.object({
      to: z.array(z.string().email()).min(1, 'At least one recipient required'),
      cc: z.array(z.string().email()).optional(),
      bcc: z.array(z.string().email()).optional(),
      subject: z.string().min(1, 'Subject is required'),
      template: z.string().min(1, 'Template is required'),
      attachments: z.array(z.string()).optional(),
      variables: z.record(z.any()).optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      messageId: z.string(),
      to: z.array(z.string()),
      cc: z.array(z.string()).optional(),
      bcc: z.array(z.string()).optional(),
      subject: z.string(),
      sentAt: z.date(),
      status: z.string()
    });
  }

  public getMetadata() {
    return {
      icon: 'Mail',
      category: 'Actions',
      description: 'Sends an email using templates',
      inputs: 1,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new EmailActionNode(id, data);
  }

  public getEstimatedDuration(): number {
    return 3000; // 3 seconds
  }
}

// Document Action Node
export class DocumentActionNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.DOCUMENT_ACTION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const docConfig = config as DocumentActionConfig;

    if (!docConfig.action) {
      errors.push('Document action is required');
    }

    if (!['generate', 'process', 'analyze'].includes(docConfig.action)) {
      errors.push('Invalid document action');
    }

    if (!docConfig.outputFormat) {
      errors.push('Output format is required');
    }

    if (!['pdf', 'docx', 'xlsx'].includes(docConfig.outputFormat)) {
      errors.push('Invalid output format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as DocumentActionConfig;

    let result;
    switch (config.action) {
      case 'generate':
        result = await this.generateDocument(config, context, input);
        break;
      case 'process':
        result = await this.processDocument(config, context, input);
        break;
      case 'analyze':
        result = await this.analyzeDocument(config, context, input);
        break;
      default:
        throw new Error(`Unknown document action: ${config.action}`);
    }

    this.log('info', `Document ${config.action} completed`, {
      action: config.action,
      format: config.outputFormat,
      documentId: result.documentId
    });

    return result;
  }

  private async generateDocument(config: DocumentActionConfig, context: ExecutionContext, input?: any) {
    // This would integrate with document generation services
    const documentId = `doc_${Date.now()}`;

    return {
      documentId,
      action: 'generate',
      format: config.outputFormat,
      template: config.template,
      url: `/api/documents/${documentId}`,
      createdAt: new Date(),
      size: Math.floor(Math.random() * 1000000) + 100000 // Mock size
    };
  }

  private async processDocument(config: DocumentActionConfig, context: ExecutionContext, input?: any) {
    // This would integrate with document processing services (OCR, parsing, etc.)
    const documentId = `proc_${Date.now()}`;

    return {
      documentId,
      action: 'process',
      format: config.outputFormat,
      extractedData: {
        text: 'Sample extracted text',
        tables: [],
        metadata: {
          pages: 1,
          language: 'en'
        }
      },
      processedAt: new Date()
    };
  }

  private async analyzeDocument(config: DocumentActionConfig, context: ExecutionContext, input?: any) {
    // This would integrate with AI document analysis services
    const documentId = `analysis_${Date.now()}`;

    return {
      documentId,
      action: 'analyze',
      analysis: {
        sentiment: 'neutral',
        entities: [],
        keyPhrases: [],
        classification: 'business_document',
        confidence: 0.95
      },
      analyzedAt: new Date()
    };
  }

  public getConfigSchema() {
    return z.object({
      action: z.enum(['generate', 'process', 'analyze']),
      template: z.string().optional(),
      outputFormat: z.enum(['pdf', 'docx', 'xlsx']),
      variables: z.record(z.any()).optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      documentId: z.string(),
      action: z.string(),
      format: z.string().optional(),
      url: z.string().optional(),
      extractedData: z.any().optional(),
      analysis: z.any().optional(),
      createdAt: z.date().optional(),
      processedAt: z.date().optional(),
      analyzedAt: z.date().optional()
    });
  }

  public getMetadata() {
    return {
      icon: 'FileText',
      category: 'Actions',
      description: 'Generates, processes, or analyzes documents',
      inputs: 1,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new DocumentActionNode(id, data);
  }

  public getEstimatedDuration(): number {
    const config = this.data.config as DocumentActionConfig;
    // Different actions have different durations
    switch (config.action) {
      case 'generate':
        return 5000; // 5 seconds
      case 'process':
        return 10000; // 10 seconds
      case 'analyze':
        return 15000; // 15 seconds
      default:
        return 5000;
    }
  }
}

// Update Record Action Node
export class UpdateRecordActionNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.UPDATE_RECORD_ACTION, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.table) {
      errors.push('Table name is required');
    }

    if (!config.recordId && !config.filters) {
      errors.push('Either record ID or filters are required');
    }

    if (!config.updates || Object.keys(config.updates).length === 0) {
      errors.push('Updates are required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config;

    // Update records in the database
    const updateResult = await this.updateRecords(config, context, input);

    this.log('info', `Records updated in ${config.table}`, {
      table: config.table,
      recordsUpdated: updateResult.count
    });

    return {
      table: config.table,
      recordsUpdated: updateResult.count,
      updatedAt: new Date(),
      updates: config.updates
    };
  }

  private async updateRecords(config: any, context: ExecutionContext, input?: any) {
    // This would integrate with your database
    // For now, return a mock result
    return {
      count: 1,
      records: [
        {
          id: config.recordId || 'mock_id',
          ...config.updates,
          updatedAt: new Date()
        }
      ]
    };
  }

  public getConfigSchema() {
    return z.object({
      table: z.string().min(1, 'Table name is required'),
      recordId: z.string().optional(),
      filters: z.record(z.any()).optional(),
      updates: z.record(z.any()).min(1, 'At least one update field required')
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      table: z.string(),
      recordsUpdated: z.number(),
      updatedAt: z.date(),
      updates: z.record(z.any())
    });
  }

  public getMetadata() {
    return {
      icon: 'Database',
      category: 'Actions',
      description: 'Updates records in the database',
      inputs: 1,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new UpdateRecordActionNode(id, data);
  }

  public getEstimatedDuration(): number {
    return 1500; // 1.5 seconds
  }
}