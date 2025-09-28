import { Node, Edge } from 'reactflow';

// Core workflow types
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  isActive: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: WorkflowMetadata;
}

export interface WorkflowMetadata {
  category: WorkflowCategory;
  estimatedDuration: number; // in minutes
  complexity: 'low' | 'medium' | 'high';
  requiredRoles: string[];
  integrations: string[];
}

export enum WorkflowCategory {
  BOOKKEEPING = 'bookkeeping',
  TAX_PREPARATION = 'tax_preparation',
  CLIENT_ONBOARDING = 'client_onboarding',
  DOCUMENT_PROCESSING = 'document_processing',
  REPORTING = 'reporting',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom'
}

// Node types
export interface WorkflowNode extends Node {
  id: string;
  type: NodeType;
  data: NodeData;
  position: { x: number; y: number };
}

export interface WorkflowEdge extends Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: EdgeType;
  data?: EdgeData;
}

export enum NodeType {
  // Triggers
  TIME_TRIGGER = 'time_trigger',
  EVENT_TRIGGER = 'event_trigger',
  MANUAL_TRIGGER = 'manual_trigger',
  WEBHOOK_TRIGGER = 'webhook_trigger',

  // Actions
  TASK_ACTION = 'task_action',
  EMAIL_ACTION = 'email_action',
  DOCUMENT_ACTION = 'document_action',
  UPDATE_RECORD_ACTION = 'update_record_action',

  // Conditions
  IF_CONDITION = 'if_condition',
  SWITCH_CONDITION = 'switch_condition',

  // Approvals
  APPROVAL_NODE = 'approval_node',

  // Integrations
  QUICKBOOKS_INTEGRATION = 'quickbooks_integration',
  DOCUMENT_PROCESSING_INTEGRATION = 'document_processing_integration',

  // Utilities
  DELAY_NODE = 'delay_node',
  PARALLEL_NODE = 'parallel_node',
  JOIN_NODE = 'join_node'
}

export enum EdgeType {
  DEFAULT = 'default',
  CONDITIONAL = 'conditional',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Node data interfaces
export interface NodeData {
  label: string;
  description?: string;
  config: NodeConfig;
  validation?: NodeValidation;
}

export interface EdgeData {
  condition?: string;
  label?: string;
}

export interface NodeConfig {
  [key: string]: any;
}

export interface NodeValidation {
  required: string[];
  optional?: string[];
  errors?: string[];
}

// Specific node configurations
export interface TimeTriggerConfig extends NodeConfig {
  schedule: string; // cron expression
  timezone: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EventTriggerConfig extends NodeConfig {
  eventType: string;
  filters?: Record<string, any>;
}

export interface TaskActionConfig extends NodeConfig {
  title: string;
  description: string;
  assignee?: string;
  dueDate?: string; // relative or absolute
  priority: 'low' | 'medium' | 'high';
  checklist?: string[];
}

export interface EmailActionConfig extends NodeConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  template: string;
  attachments?: string[];
  variables?: Record<string, any>;
}

export interface DocumentActionConfig extends NodeConfig {
  action: 'generate' | 'process' | 'analyze';
  template?: string;
  outputFormat: 'pdf' | 'docx' | 'xlsx';
  variables?: Record<string, any>;
}

export interface ConditionConfig extends NodeConfig {
  expression: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'custom';
  value: any;
  variable: string;
}

export interface ApprovalConfig extends NodeConfig {
  approvers: string[];
  requireAll: boolean;
  timeout?: number; // hours
  escalation?: {
    after: number; // hours
    to: string[];
  };
}

export interface IntegrationConfig extends NodeConfig {
  service: string;
  action: string;
  parameters: Record<string, any>;
  credentials?: string;
}

// Execution types
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
  context: ExecutionContext;
  nodeExecutions: NodeExecution[];
  error?: string;
  metadata: ExecutionMetadata;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionContext {
  userId: string;
  clientId?: string;
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ExecutionMetadata {
  totalDuration?: number;
  nodeCount: number;
  successCount: number;
  failureCount: number;
  retryCount: number;
}

export interface NodeExecution {
  id: string;
  nodeId: string;
  status: NodeExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: string;
  retryCount: number;
  duration?: number;
}

export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  WAITING_APPROVAL = 'waiting_approval'
}

// Template types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  preview: string; // base64 image or URL
  workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
  variables: TemplateVariable[];
  popularity: number;
  tags: string[];
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multi-select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  description?: string;
}

// Queue types
export interface WorkflowJob {
  id: string;
  workflowId: string;
  executionId: string;
  priority: number;
  delay?: number;
  attempts: number;
  backoff?: 'fixed' | 'exponential';
  data: any;
}

export interface QueueMetrics {
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  type: 'missing_connection' | 'invalid_config' | 'circular_dependency' | 'unreachable_node';
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  nodeId?: string;
  type: 'performance' | 'best_practice' | 'deprecated';
  message: string;
}

// Analytics types
export interface WorkflowAnalytics {
  workflowId: string;
  period: {
    start: Date;
    end: Date;
  };
  executions: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  };
  nodeStats: NodeStats[];
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
}

export interface NodeStats {
  nodeId: string;
  nodeType: NodeType;
  executions: number;
  avgDuration: number;
  successRate: number;
  failureReasons: string[];
}

export interface Bottleneck {
  nodeId: string;
  issue: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface Recommendation {
  type: 'performance' | 'reliability' | 'cost';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

// Event types for workflow engine
export interface WorkflowEvent {
  type: WorkflowEventType;
  workflowId: string;
  executionId?: string;
  nodeId?: string;
  timestamp: Date;
  data?: any;
}

export enum WorkflowEventType {
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  WORKFLOW_PAUSED = 'workflow_paused',
  WORKFLOW_RESUMED = 'workflow_resumed',
  NODE_STARTED = 'node_started',
  NODE_COMPLETED = 'node_completed',
  NODE_FAILED = 'node_failed',
  APPROVAL_REQUESTED = 'approval_requested',
  APPROVAL_GRANTED = 'approval_granted',
  APPROVAL_DENIED = 'approval_denied'
}

// Export all types
export type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowTemplate,
  WorkflowJob,
  WorkflowAnalytics,
  WorkflowEvent
};