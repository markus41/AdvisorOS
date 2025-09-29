import { prisma } from '../../server/db';
import { EventEmitter } from 'events';

export interface WorkflowStep {
  id: string;
  type: 'start' | 'task' | 'decision' | 'parallel' | 'merge' | 'end' | 'delay' | 'notification' | 'automation';
  name: string;
  description?: string;
  position: { x: number; y: number };
  configuration: Record<string, any>;
  inputs: WorkflowConnection[];
  outputs: WorkflowConnection[];
  conditions?: WorkflowCondition[];
  assignee?: {
    type: 'user' | 'role' | 'auto';
    value: string;
  };
  timeouts?: {
    duration: number;
    unit: 'minutes' | 'hours' | 'days';
    action: 'escalate' | 'skip' | 'fail';
  };
  dependencies?: string[]; // Step IDs that must complete before this step
}

export interface WorkflowConnection {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  condition?: string;
  label?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  value: any;
  scope: 'global' | 'step' | 'branch';
  isRequired: boolean;
  defaultValue?: any;
  description?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  version: string;
  isSystemTemplate: boolean;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
  settings: WorkflowSettings;
  estimatedDuration?: number;
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
  metadata: Record<string, any>;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'document_upload' | 'client_onboard' | 'deadline' | 'condition';
  name: string;
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface WorkflowSettings {
  allowParallelExecution: boolean;
  maxConcurrentInstances: number;
  autoAssignment: boolean;
  notificationSettings: {
    onStart: boolean;
    onComplete: boolean;
    onError: boolean;
    onOverdue: boolean;
  };
  retrySettings: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
  };
  escalationSettings: {
    enabled: boolean;
    escalationLevels: Array<{
      level: number;
      delay: number;
      assignTo: string;
      action: 'reassign' | 'notify' | 'auto_approve';
    }>;
  };
}

export interface WorkflowExecution {
  id: string;
  templateId?: string;
  workflowId?: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  currentStepId?: string;
  progress: number;
  variables: Record<string, any>;
  context: WorkflowContext;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  assignedTo?: string;
  organizationId: string;
  clientId?: string;
  engagementId?: string;
  createdBy: string;
  metadata: Record<string, any>;
}

export interface WorkflowContext {
  organizationId: string;
  clientId?: string;
  engagementId?: string;
  documents: string[];
  notes: string[];
  relatedWorkflows: string[];
  customData: Record<string, any>;
}

export interface StepExecution {
  id: string;
  workflowExecutionId: string;
  stepId: string;
  status: 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  duration?: number;
}

export interface WorkflowEvent {
  type: 'workflow_started' | 'workflow_completed' | 'workflow_failed' | 'step_started' | 'step_completed' | 'step_failed' | 'step_assigned' | 'workflow_paused' | 'workflow_resumed';
  workflowExecutionId: string;
  stepExecutionId?: string;
  timestamp: Date;
  data: Record<string, any>;
}

class WorkflowEngine extends EventEmitter {
  private activeExecutions = new Map<string, WorkflowExecution>();
  private stepExecutors = new Map<string, (step: WorkflowStep, execution: WorkflowExecution) => Promise<any>>();

  constructor() {
    super();
    this.initializeStepExecutors();
  }

  /**
   * Create a new workflow template
   */
  async createWorkflowTemplate(template: Omit<WorkflowTemplate, 'id'>): Promise<WorkflowTemplate> {
    try {
      // Validate template
      this.validateWorkflowTemplate(template);

      const workflowTemplate = await prisma.workflowTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          category: template.category,
          type: template.category,
          version: template.version,
          isSystemTemplate: template.isSystemTemplate,
          isActive: true,
          estimatedDuration: template.estimatedDuration,
          complexity: template.complexity,
          steps: {
            steps: template.steps,
            connections: template.connections,
            variables: template.variables,
            triggers: template.triggers
          },
          taskTemplates: this.generateTaskTemplates(template.steps),
          settings: template.settings,
          metadata: template.metadata,
          organizationId: template.isSystemTemplate ? null : template.metadata.organizationId
        }
      });

      return {
        id: workflowTemplate.id,
        ...template
      };

    } catch (error) {
      console.error('Failed to create workflow template:', error);
      throw new Error(`Template creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a workflow from template
   */
  async executeWorkflow(
    templateId: string,
    context: WorkflowContext,
    variables: Record<string, any> = {},
    options: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      dueDate?: Date;
      assignedTo?: string;
      customName?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get template
      const template = await this.getWorkflowTemplate(templateId);
      if (!template) {
        throw new Error('Workflow template not found');
      }

      // Create execution
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        name: options.customName || template.name,
        status: 'pending',
        priority: options.priority || 'normal',
        progress: 0,
        variables: { ...this.getDefaultVariables(template.variables), ...variables },
        context,
        dueDate: options.dueDate,
        assignedTo: options.assignedTo,
        organizationId: context.organizationId,
        clientId: context.clientId,
        engagementId: context.engagementId,
        createdBy: context.customData.createdBy || 'system',
        metadata: {
          templateName: template.name,
          templateVersion: template.version,
          startedBy: context.customData.createdBy || 'system'
        }
      };

      // Save to database
      await this.saveWorkflowExecution(execution, template);

      // Start execution
      await this.startWorkflowExecution(execution, template);

      return execution.id;

    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw new Error(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start workflow execution
   */
  private async startWorkflowExecution(execution: WorkflowExecution, template: WorkflowTemplate): Promise<void> {
    try {
      this.activeExecutions.set(execution.id, execution);

      // Update status
      execution.status = 'running';
      execution.startedAt = new Date();

      // Find start step
      const startStep = template.steps.find(step => step.type === 'start');
      if (!startStep) {
        throw new Error('No start step found in workflow template');
      }

      // Emit workflow started event
      this.emitEvent({
        type: 'workflow_started',
        workflowExecutionId: execution.id,
        timestamp: new Date(),
        data: { templateId: template.id, context: execution.context }
      });

      // Execute start step
      await this.executeStep(startStep, execution, template);

    } catch (error) {
      execution.status = 'failed';
      await this.updateWorkflowExecution(execution);

      this.emitEvent({
        type: 'workflow_failed',
        workflowExecutionId: execution.id,
        timestamp: new Date(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      throw error;
    }
  }

  /**
   * Execute a workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    template: WorkflowTemplate
  ): Promise<void> {
    try {
      // Create step execution
      const stepExecution: StepExecution = {
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowExecutionId: execution.id,
        stepId: step.id,
        status: 'running',
        startedAt: new Date(),
        assignedTo: step.assignee ? this.resolveAssignee(step.assignee, execution) : undefined,
        inputs: this.resolveStepInputs(step, execution),
        outputs: {},
        retryCount: 0
      };

      execution.currentStepId = step.id;

      // Save step execution
      await this.saveStepExecution(stepExecution);

      // Emit step started event
      this.emitEvent({
        type: 'step_started',
        workflowExecutionId: execution.id,
        stepExecutionId: stepExecution.id,
        timestamp: new Date(),
        data: { stepType: step.type, stepName: step.name }
      });

      // Execute step based on type
      const executor = this.stepExecutors.get(step.type);
      if (!executor) {
        throw new Error(`No executor found for step type: ${step.type}`);
      }

      const result = await executor(step, execution);

      // Update step execution
      stepExecution.status = 'completed';
      stepExecution.completedAt = new Date();
      stepExecution.outputs = result || {};
      stepExecution.duration = stepExecution.completedAt.getTime() - stepExecution.startedAt!.getTime();

      await this.updateStepExecution(stepExecution);

      // Emit step completed event
      this.emitEvent({
        type: 'step_completed',
        workflowExecutionId: execution.id,
        stepExecutionId: stepExecution.id,
        timestamp: new Date(),
        data: { stepType: step.type, stepName: step.name, outputs: stepExecution.outputs }
      });

      // Update workflow progress
      this.updateWorkflowProgress(execution, template);

      // Move to next step(s)
      await this.processNextSteps(step, execution, template);

    } catch (error) {
      console.error(`Step execution failed for step ${step.id}:`, error);

      // Handle step failure
      await this.handleStepFailure(step, execution, template, error);
    }
  }

  /**
   * Process next steps in workflow
   */
  private async processNextSteps(
    currentStep: WorkflowStep,
    execution: WorkflowExecution,
    template: WorkflowTemplate
  ): Promise<void> {
    // Find outgoing connections
    const connections = template.connections.filter(conn => conn.sourceStepId === currentStep.id);

    if (connections.length === 0) {
      // No more steps, complete workflow
      await this.completeWorkflow(execution);
      return;
    }

    // Process each connection
    for (const connection of connections) {
      const nextStep = template.steps.find(step => step.id === connection.targetStepId);
      if (!nextStep) {
        console.error(`Next step not found: ${connection.targetStepId}`);
        continue;
      }

      // Check connection condition
      if (connection.condition && !this.evaluateCondition(connection.condition, execution)) {
        continue; // Skip this path
      }

      // Check step dependencies
      if (await this.areStepDependenciesMet(nextStep, execution)) {
        // Execute next step
        await this.executeStep(nextStep, execution, template);
      }
    }
  }

  /**
   * Complete workflow execution
   */
  private async completeWorkflow(execution: WorkflowExecution): Promise<void> {
    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.progress = 100;

    await this.updateWorkflowExecution(execution);

    this.emitEvent({
      type: 'workflow_completed',
      workflowExecutionId: execution.id,
      timestamp: new Date(),
      data: { duration: execution.completedAt.getTime() - execution.startedAt!.getTime() }
    });

    this.activeExecutions.delete(execution.id);
  }

  /**
   * Pause workflow execution
   */
  async pauseWorkflow(executionId: string, reason?: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    execution.status = 'paused';
    execution.metadata.pauseReason = reason;
    execution.metadata.pausedAt = new Date();

    await this.updateWorkflowExecution(execution);

    this.emitEvent({
      type: 'workflow_paused',
      workflowExecutionId: executionId,
      timestamp: new Date(),
      data: { reason }
    });
  }

  /**
   * Resume workflow execution
   */
  async resumeWorkflow(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    if (execution.status !== 'paused') {
      throw new Error('Workflow is not paused');
    }

    execution.status = 'running';
    execution.metadata.resumedAt = new Date();

    await this.updateWorkflowExecution(execution);

    this.emitEvent({
      type: 'workflow_resumed',
      workflowExecutionId: executionId,
      timestamp: new Date(),
      data: {}
    });

    // Continue from current step
    const template = await this.getWorkflowTemplate(execution.templateId!);
    if (template && execution.currentStepId) {
      const currentStep = template.steps.find(step => step.id === execution.currentStepId);
      if (currentStep) {
        await this.executeStep(currentStep, execution, template);
      }
    }
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflow(executionId: string, reason?: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    execution.status = 'cancelled';
    execution.metadata.cancelReason = reason;
    execution.metadata.cancelledAt = new Date();

    await this.updateWorkflowExecution(execution);

    this.activeExecutions.delete(executionId);
  }

  /**
   * Initialize step executors
   */
  private initializeStepExecutors(): void {
    // Start step executor
    this.stepExecutors.set('start', async (step, execution) => {
      // Start step just initiates the workflow
      return { started: true, timestamp: new Date() };
    });

    // Task step executor
    this.stepExecutors.set('task', async (step, execution) => {
      // Create task in database
      const task = await prisma.taskExecution.create({
        data: {
          title: step.name,
          description: step.description || '',
          status: 'pending',
          priority: execution.priority,
          taskType: step.configuration.taskType || 'custom',
          stepIndex: parseInt(step.id.split('_')[1]) || 0,
          estimatedHours: step.configuration.estimatedHours ? parseFloat(step.configuration.estimatedHours) : null,
          assignedToId: step.assignee ? this.resolveAssignee(step.assignee, execution) : null,
          workflowExecutionId: execution.id,
          organizationId: execution.organizationId,
          createdBy: execution.createdBy,
          dueDate: step.configuration.dueDate ? new Date(step.configuration.dueDate) : null
        }
      });

      return { taskId: task.id, status: 'assigned' };
    });

    // Decision step executor
    this.stepExecutors.set('decision', async (step, execution) => {
      // Evaluate decision conditions
      const conditions = step.conditions || [];
      const results: Record<string, boolean> = {};

      for (const condition of conditions) {
        results[condition.field] = this.evaluateCondition(JSON.stringify(condition), execution);
      }

      return { decision: results, selectedPath: this.selectDecisionPath(results, step) };
    });

    // Automation step executor
    this.stepExecutors.set('automation', async (step, execution) => {
      // Execute automation based on configuration
      const automationType = step.configuration.automationType;

      switch (automationType) {
        case 'email_notification':
          return await this.sendEmailNotification(step, execution);
        case 'document_generation':
          return await this.generateDocument(step, execution);
        case 'data_sync':
          return await this.syncData(step, execution);
        default:
          throw new Error(`Unknown automation type: ${automationType}`);
      }
    });

    // Delay step executor
    this.stepExecutors.set('delay', async (step, execution) => {
      const delay = step.configuration.delay || 0;
      const unit = step.configuration.unit || 'minutes';

      const delayMs = this.convertToMilliseconds(delay, unit);

      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ delayed: true, duration: delayMs });
        }, delayMs);
      });
    });

    // End step executor
    this.stepExecutors.set('end', async (step, execution) => {
      // End step completes the workflow
      return { ended: true, timestamp: new Date() };
    });
  }

  // Helper methods
  private validateWorkflowTemplate(template: Omit<WorkflowTemplate, 'id'>): void {
    if (!template.name || template.name.trim().length === 0) {
      throw new Error('Workflow template name is required');
    }

    if (!template.steps || template.steps.length === 0) {
      throw new Error('Workflow template must have at least one step');
    }

    const startSteps = template.steps.filter(step => step.type === 'start');
    if (startSteps.length !== 1) {
      throw new Error('Workflow template must have exactly one start step');
    }

    const endSteps = template.steps.filter(step => step.type === 'end');
    if (endSteps.length === 0) {
      throw new Error('Workflow template must have at least one end step');
    }

    // Validate connections
    for (const connection of template.connections) {
      const sourceStep = template.steps.find(step => step.id === connection.sourceStepId);
      const targetStep = template.steps.find(step => step.id === connection.targetStepId);

      if (!sourceStep) {
        throw new Error(`Invalid connection: source step ${connection.sourceStepId} not found`);
      }

      if (!targetStep) {
        throw new Error(`Invalid connection: target step ${connection.targetStepId} not found`);
      }
    }
  }

  private generateTaskTemplates(steps: WorkflowStep[]): Record<string, any> {
    return steps
      .filter(step => step.type === 'task')
      .reduce((templates, step) => {
        templates[step.id] = {
          title: step.name,
          description: step.description,
          taskType: step.configuration.taskType || 'custom',
          estimatedHours: step.configuration.estimatedHours,
          assignee: step.assignee
        };
        return templates;
      }, {} as Record<string, any>);
  }

  private getDefaultVariables(variables: WorkflowVariable[]): Record<string, any> {
    return variables.reduce((defaults, variable) => {
      defaults[variable.name] = variable.defaultValue;
      return defaults;
    }, {} as Record<string, any>);
  }

  private resolveAssignee(assignee: WorkflowStep['assignee'], execution: WorkflowExecution): string | undefined {
    if (!assignee) return undefined;

    switch (assignee.type) {
      case 'user':
        return assignee.value;
      case 'role':
        // Would resolve to actual user based on role
        return execution.assignedTo || execution.createdBy;
      case 'auto':
        // Auto-assignment logic
        return this.autoAssignStep(execution);
      default:
        return undefined;
    }
  }

  private autoAssignStep(execution: WorkflowExecution): string {
    // Auto-assignment logic based on workload, expertise, etc.
    return execution.assignedTo || execution.createdBy;
  }

  private resolveStepInputs(step: WorkflowStep, execution: WorkflowExecution): Record<string, any> {
    const inputs: Record<string, any> = {};

    // Copy workflow variables to step inputs
    Object.assign(inputs, execution.variables);

    // Add context data
    inputs.context = execution.context;

    // Add step-specific configuration
    Object.assign(inputs, step.configuration);

    return inputs;
  }

  private updateWorkflowProgress(execution: WorkflowExecution, template: WorkflowTemplate): void {
    // Calculate progress based on completed steps
    const totalSteps = template.steps.length;
    const currentStepIndex = template.steps.findIndex(step => step.id === execution.currentStepId);

    execution.progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  }

  private evaluateCondition(condition: string, execution: WorkflowExecution): boolean {
    try {
      const conditionObj = JSON.parse(condition) as WorkflowCondition;

      const fieldValue = this.getFieldValue(conditionObj.field, execution);

      switch (conditionObj.operator) {
        case 'equals':
          return fieldValue === conditionObj.value;
        case 'not_equals':
          return fieldValue !== conditionObj.value;
        case 'greater_than':
          return fieldValue > conditionObj.value;
        case 'less_than':
          return fieldValue < conditionObj.value;
        case 'contains':
          return String(fieldValue).includes(String(conditionObj.value));
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'in':
          return Array.isArray(conditionObj.value) && conditionObj.value.includes(fieldValue);
        case 'not_in':
          return !Array.isArray(conditionObj.value) || !conditionObj.value.includes(fieldValue);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private getFieldValue(field: string, execution: WorkflowExecution): any {
    if (field.startsWith('variables.')) {
      const variableName = field.substring(10);
      return execution.variables[variableName];
    }

    if (field.startsWith('context.')) {
      const contextField = field.substring(8);
      return (execution.context as any)[contextField];
    }

    return (execution as any)[field];
  }

  private async areStepDependenciesMet(step: WorkflowStep, execution: WorkflowExecution): Promise<boolean> {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    // Check if all dependency steps are completed
    for (const dependencyId of step.dependencies) {
      const stepExecution = await prisma.taskExecution.findFirst({
        where: {
          workflowExecutionId: execution.id,
          // Would need to map step ID to task execution
        }
      });

      if (!stepExecution || stepExecution.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  private selectDecisionPath(results: Record<string, boolean>, step: WorkflowStep): string {
    // Decision path selection logic
    const trueConditions = Object.entries(results).filter(([, value]) => value);

    if (trueConditions.length > 0) {
      return trueConditions[0][0]; // Return first true condition
    }

    return 'default'; // Default path
  }

  private async handleStepFailure(
    step: WorkflowStep,
    execution: WorkflowExecution,
    template: WorkflowTemplate,
    error: any
  ): Promise<void> {
    console.error(`Step ${step.id} failed:`, error);

    // Update step execution with error
    await prisma.taskExecution.updateMany({
      where: {
        workflowExecutionId: execution.id,
        stepIndex: parseInt(step.id.split('_')[1]) || 0
      },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    // Emit step failed event
    this.emitEvent({
      type: 'step_failed',
      workflowExecutionId: execution.id,
      timestamp: new Date(),
      data: { stepId: step.id, error: error instanceof Error ? error.message : 'Unknown error' }
    });

    // Check retry settings
    const retrySettings = template.settings.retrySettings;
    if (retrySettings.enabled) {
      // Implement retry logic
      console.log('Retrying step execution...');
      // Would retry the step
    } else {
      // Fail the entire workflow
      execution.status = 'failed';
      await this.updateWorkflowExecution(execution);

      this.emitEvent({
        type: 'workflow_failed',
        workflowExecutionId: execution.id,
        timestamp: new Date(),
        data: { failedStep: step.id, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private convertToMilliseconds(value: number, unit: string): number {
    switch (unit) {
      case 'minutes':
        return value * 60 * 1000;
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }

  // Database operations
  private async getWorkflowTemplate(templateId: string): Promise<WorkflowTemplate | null> {
    try {
      const template = await prisma.workflowTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) return null;

      return {
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        category: template.category,
        version: template.version,
        isSystemTemplate: template.isSystemTemplate,
        steps: template.steps.steps || [],
        connections: template.steps.connections || [],
        variables: template.steps.variables || [],
        triggers: template.steps.triggers || [],
        settings: template.settings as WorkflowSettings,
        estimatedDuration: template.estimatedDuration || undefined,
        complexity: template.complexity as 'low' | 'medium' | 'high',
        tags: [],
        metadata: template.metadata as Record<string, any>
      };

    } catch (error) {
      console.error('Failed to get workflow template:', error);
      return null;
    }
  }

  private async saveWorkflowExecution(execution: WorkflowExecution, template: WorkflowTemplate): Promise<void> {
    await prisma.workflowExecution.create({
      data: {
        id: execution.id,
        name: execution.name,
        status: execution.status,
        priority: execution.priority,
        progress: execution.progress,
        templateId: execution.templateId!,
        engagementId: execution.engagementId || null,
        clientId: execution.clientId || null,
        organizationId: execution.organizationId,
        assignedToId: execution.assignedTo || null,
        dueDate: execution.dueDate || null,
        configuration: execution.variables,
        context: execution.context,
        createdBy: execution.createdBy
      }
    });
  }

  private async updateWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: execution.status,
        progress: execution.progress,
        currentStepIndex: execution.currentStepId ? parseInt(execution.currentStepId.split('_')[1]) || 0 : 0,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        context: execution.context,
        configuration: execution.variables
      }
    });
  }

  private async saveStepExecution(stepExecution: StepExecution): Promise<void> {
    await prisma.taskExecution.create({
      data: {
        id: stepExecution.id,
        title: `Step ${stepExecution.stepId}`,
        status: stepExecution.status,
        stepIndex: parseInt(stepExecution.stepId.split('_')[1]) || 0,
        assignedToId: stepExecution.assignedTo || null,
        workflowExecutionId: stepExecution.workflowExecutionId,
        organizationId: 'temp', // Would be resolved from execution
        createdBy: 'system',
        startedAt: stepExecution.startedAt,
        inputs: stepExecution.inputs,
        outputs: stepExecution.outputs
      }
    });
  }

  private async updateStepExecution(stepExecution: StepExecution): Promise<void> {
    await prisma.taskExecution.update({
      where: { id: stepExecution.id },
      data: {
        status: stepExecution.status,
        completedAt: stepExecution.completedAt,
        outputs: stepExecution.outputs,
        errorMessage: stepExecution.errorMessage,
        actualHours: stepExecution.duration ? stepExecution.duration / (1000 * 60 * 60) : null
      }
    });
  }

  // Automation step implementations
  private async sendEmailNotification(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Email notification implementation
    console.log('Sending email notification:', step.configuration);
    return { sent: true, recipients: step.configuration.recipients || [] };
  }

  private async generateDocument(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Document generation implementation
    console.log('Generating document:', step.configuration);
    return { documentId: `doc_${Date.now()}`, template: step.configuration.template };
  }

  private async syncData(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Data synchronization implementation
    console.log('Syncing data:', step.configuration);
    return { synced: true, records: step.configuration.recordCount || 0 };
  }

  private emitEvent(event: WorkflowEvent): void {
    this.emit('workflow_event', event);
    console.log('Workflow event:', event);
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();

// Export types
export type {
  WorkflowStep,
  WorkflowConnection,
  WorkflowCondition,
  WorkflowVariable,
  WorkflowTemplate,
  WorkflowTrigger,
  WorkflowSettings,
  WorkflowExecution,
  WorkflowContext,
  StepExecution,
  WorkflowEvent
};