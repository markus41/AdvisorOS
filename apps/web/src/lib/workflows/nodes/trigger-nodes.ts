import { z } from 'zod';
import * as cron from 'node-cron';
import {
  NodeType,
  NodeData,
  NodeConfig,
  ExecutionContext,
  TimeTriggerConfig,
  EventTriggerConfig
} from '../types';
import { BaseWorkflowNode } from './base-node';

// Time Trigger Node
export class TimeTriggerNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.TIME_TRIGGER, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const timeTriggerConfig = config as TimeTriggerConfig;

    if (!timeTriggerConfig.schedule) {
      errors.push('Schedule is required');
    } else if (!cron.validate(timeTriggerConfig.schedule)) {
      errors.push('Invalid cron expression');
    }

    if (!timeTriggerConfig.timezone) {
      errors.push('Timezone is required');
    }

    if (timeTriggerConfig.startDate && timeTriggerConfig.endDate) {
      if (new Date(timeTriggerConfig.startDate) >= new Date(timeTriggerConfig.endDate)) {
        errors.push('Start date must be before end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as TimeTriggerConfig;

    this.log('info', `Time trigger executed`, {
      schedule: config.schedule,
      timezone: config.timezone,
      triggeredAt: new Date().toISOString()
    });

    return {
      triggeredAt: new Date(),
      schedule: config.schedule,
      timezone: config.timezone,
      nextRun: this.getNextRunTime(config.schedule)
    };
  }

  public getConfigSchema() {
    return z.object({
      schedule: z.string().min(1, 'Schedule is required'),
      timezone: z.string().min(1, 'Timezone is required'),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    });
  }

  public getInputSchema() {
    return z.object({});
  }

  public getOutputSchema() {
    return z.object({
      triggeredAt: z.date(),
      schedule: z.string(),
      timezone: z.string(),
      nextRun: z.date().optional()
    });
  }

  public getMetadata() {
    return {
      icon: 'Clock',
      category: 'Triggers',
      description: 'Triggers workflow execution on a schedule',
      inputs: 0,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new TimeTriggerNode(id, data);
  }

  private getNextRunTime(schedule: string): Date | undefined {
    try {
      // This is a simplified implementation
      // In a real implementation, you'd use a proper cron parser
      const now = new Date();
      return new Date(now.getTime() + 60000); // Next minute for demo
    } catch (error) {
      return undefined;
    }
  }

  public canRetry(): boolean {
    return false; // Triggers don't retry
  }
}

// Event Trigger Node
export class EventTriggerNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.EVENT_TRIGGER, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const eventTriggerConfig = config as EventTriggerConfig;

    if (!eventTriggerConfig.eventType) {
      errors.push('Event type is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config as EventTriggerConfig;

    this.log('info', `Event trigger executed`, {
      eventType: config.eventType,
      filters: config.filters,
      triggeredAt: new Date().toISOString()
    });

    return {
      triggeredAt: new Date(),
      eventType: config.eventType,
      eventData: input,
      filters: config.filters
    };
  }

  public getConfigSchema() {
    return z.object({
      eventType: z.string().min(1, 'Event type is required'),
      filters: z.record(z.any()).optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      triggeredAt: z.date(),
      eventType: z.string(),
      eventData: z.any(),
      filters: z.record(z.any()).optional()
    });
  }

  public getMetadata() {
    return {
      icon: 'Zap',
      category: 'Triggers',
      description: 'Triggers workflow execution on system events',
      inputs: 0,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new EventTriggerNode(id, data);
  }

  public canRetry(): boolean {
    return false; // Triggers don't retry
  }
}

// Manual Trigger Node
export class ManualTriggerNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.MANUAL_TRIGGER, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    this.log('info', `Manual trigger executed by ${context.userId}`, {
      triggeredAt: new Date().toISOString(),
      userId: context.userId
    });

    return {
      triggeredAt: new Date(),
      triggeredBy: context.userId,
      manualInput: input
    };
  }

  public getConfigSchema() {
    return z.object({
      description: z.string().optional()
    });
  }

  public getInputSchema() {
    return z.any();
  }

  public getOutputSchema() {
    return z.object({
      triggeredAt: z.date(),
      triggeredBy: z.string(),
      manualInput: z.any()
    });
  }

  public getMetadata() {
    return {
      icon: 'Play',
      category: 'Triggers',
      description: 'Manually trigger workflow execution',
      inputs: 0,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new ManualTriggerNode(id, data);
  }

  public canRetry(): boolean {
    return false; // Triggers don't retry
  }
}

// Webhook Trigger Node
export class WebhookTriggerNode extends BaseWorkflowNode {
  constructor(id: string, data: NodeData) {
    super(id, NodeType.WEBHOOK_TRIGGER, data);
  }

  protected validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
      errors.push('Invalid HTTP method');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async executeNode(context: ExecutionContext, input?: any): Promise<any> {
    const config = this.data.config;

    this.log('info', `Webhook trigger executed`, {
      method: config.method || 'POST',
      triggeredAt: new Date().toISOString(),
      payload: input
    });

    return {
      triggeredAt: new Date(),
      method: config.method || 'POST',
      headers: input?.headers || {},
      body: input?.body || {},
      query: input?.query || {},
      webhookUrl: this.generateWebhookUrl()
    };
  }

  public getConfigSchema() {
    return z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
      requireAuth: z.boolean().optional(),
      responseTemplate: z.string().optional()
    });
  }

  public getInputSchema() {
    return z.object({
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
      query: z.record(z.string()).optional()
    });
  }

  public getOutputSchema() {
    return z.object({
      triggeredAt: z.date(),
      method: z.string(),
      headers: z.record(z.string()),
      body: z.any(),
      query: z.record(z.string()),
      webhookUrl: z.string()
    });
  }

  public getMetadata() {
    return {
      icon: 'Globe',
      category: 'Triggers',
      description: 'HTTP webhook endpoint trigger',
      inputs: 0,
      outputs: 1
    };
  }

  protected createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode {
    return new WebhookTriggerNode(id, data);
  }

  private generateWebhookUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/webhooks/workflow/${this.id}`;
  }

  public canRetry(): boolean {
    return false; // Triggers don't retry
  }
}