import {
  NodeType,
  NodeData,
  NodeConfig,
  NodeExecution,
  NodeExecutionStatus,
  ExecutionContext
} from '../types';

export abstract class BaseWorkflowNode {
  public readonly id: string;
  public readonly type: NodeType;
  public readonly data: NodeData;

  constructor(id: string, type: NodeType, data: NodeData) {
    this.id = id;
    this.type = type;
    this.data = data;
  }

  /**
   * Validate the node configuration
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!this.data.label) {
      errors.push('Node label is required');
    }

    // Validate configuration
    const configValidation = this.validateConfig(this.data.config);
    if (!configValidation.isValid) {
      errors.push(...configValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Abstract method to validate node-specific configuration
   */
  protected abstract validateConfig(config: NodeConfig): { isValid: boolean; errors: string[] };

  /**
   * Execute the node logic
   */
  public async execute(context: ExecutionContext, input?: any): Promise<NodeExecution> {
    const execution: NodeExecution = {
      id: `${this.id}-${Date.now()}`,
      nodeId: this.id,
      status: NodeExecutionStatus.RUNNING,
      startedAt: new Date(),
      input,
      retryCount: 0
    };

    try {
      // Pre-execution hook
      await this.beforeExecute(context, input);

      // Main execution logic
      const output = await this.executeNode(context, input);

      // Post-execution hook
      await this.afterExecute(context, input, output);

      execution.status = NodeExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.output = output;
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      return execution;
    } catch (error) {
      execution.status = NodeExecutionStatus.FAILED;
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      // Error hook
      await this.onError(context, input, error);

      return execution;
    }
  }

  /**
   * Abstract method for node-specific execution logic
   */
  protected abstract executeNode(context: ExecutionContext, input?: any): Promise<any>;

  /**
   * Hook called before node execution
   */
  protected async beforeExecute(context: ExecutionContext, input?: any): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Hook called after successful node execution
   */
  protected async afterExecute(context: ExecutionContext, input?: any, output?: any): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Hook called when node execution fails
   */
  protected async onError(context: ExecutionContext, input?: any, error?: any): Promise<void> {
    // Override in subclasses if needed
    console.error(`Node ${this.id} (${this.type}) execution failed:`, error);
  }

  /**
   * Get the node's configuration schema for validation
   */
  public abstract getConfigSchema(): any;

  /**
   * Get the node's input schema
   */
  public abstract getInputSchema(): any;

  /**
   * Get the node's output schema
   */
  public abstract getOutputSchema(): any;

  /**
   * Check if the node can be retried on failure
   */
  public canRetry(): boolean {
    return true;
  }

  /**
   * Get the maximum number of retry attempts
   */
  public getMaxRetries(): number {
    return 3;
  }

  /**
   * Get the retry delay in milliseconds
   */
  public getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }

  /**
   * Check if the node should be skipped based on context
   */
  public shouldSkip(context: ExecutionContext): boolean {
    return false;
  }

  /**
   * Get estimated execution duration in milliseconds
   */
  public getEstimatedDuration(): number {
    return 1000; // Default 1 second
  }

  /**
   * Get node dependencies (other nodes that must complete first)
   */
  public getDependencies(): string[] {
    return [];
  }

  /**
   * Transform input data before execution
   */
  protected transformInput(input: any, context: ExecutionContext): any {
    return input;
  }

  /**
   * Transform output data after execution
   */
  protected transformOutput(output: any, context: ExecutionContext): any {
    return output;
  }

  /**
   * Log node execution information
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      nodeId: this.id,
      nodeType: this.type,
      level,
      message,
      data
    };

    console.log(`[${level.toUpperCase()}] Node ${this.id}:`, message, data || '');
  }

  /**
   * Get node metadata for display
   */
  public getMetadata(): {
    icon: string;
    category: string;
    description: string;
    inputs: number;
    outputs: number;
  } {
    return {
      icon: 'Circle',
      category: 'Unknown',
      description: this.data.description || '',
      inputs: 1,
      outputs: 1
    };
  }

  /**
   * Serialize the node for storage
   */
  public serialize(): any {
    return {
      id: this.id,
      type: this.type,
      data: this.data
    };
  }

  /**
   * Create a deep copy of the node
   */
  public clone(newId?: string): BaseWorkflowNode {
    const clonedData = JSON.parse(JSON.stringify(this.data));
    return this.createInstance(newId || `${this.id}-copy`, this.type, clonedData);
  }

  /**
   * Factory method to create node instances (override in subclasses)
   */
  protected abstract createInstance(id: string, type: NodeType, data: NodeData): BaseWorkflowNode;
}

// Node factory interface
export interface NodeFactory {
  createNode(type: NodeType, id: string, data: NodeData): BaseWorkflowNode;
  getSupportedTypes(): NodeType[];
}

// Base node factory implementation
export class BaseNodeFactory implements NodeFactory {
  private nodeClasses: Map<NodeType, new (id: string, type: NodeType, data: NodeData) => BaseWorkflowNode> = new Map();

  public registerNodeClass(type: NodeType, nodeClass: new (id: string, type: NodeType, data: NodeData) => BaseWorkflowNode): void {
    this.nodeClasses.set(type, nodeClass);
  }

  public createNode(type: NodeType, id: string, data: NodeData): BaseWorkflowNode {
    const NodeClass = this.nodeClasses.get(type);
    if (!NodeClass) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return new NodeClass(id, type, data);
  }

  public getSupportedTypes(): NodeType[] {
    return Array.from(this.nodeClasses.keys());
  }
}

// Export the factory instance
export const nodeFactory = new BaseNodeFactory();