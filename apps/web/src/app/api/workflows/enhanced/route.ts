import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowEngine } from '@/lib/workflow/workflow-engine';
import { documentWorkflowAutomationService } from '@/lib/automation/document-workflow-automation';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Type is required'),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['start', 'task', 'decision', 'parallel', 'merge', 'end', 'delay', 'notification', 'automation']),
    name: z.string(),
    description: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    configuration: z.record(z.any()),
    assignee: z.object({
      type: z.enum(['user', 'role', 'auto']),
      value: z.string()
    }).optional(),
    timeouts: z.object({
      duration: z.number(),
      unit: z.enum(['minutes', 'hours', 'days']),
      action: z.enum(['escalate', 'skip', 'fail'])
    }).optional(),
    dependencies: z.array(z.string()).optional()
  })),
  connections: z.array(z.object({
    id: z.string(),
    sourceStepId: z.string(),
    targetStepId: z.string(),
    condition: z.string().optional(),
    label: z.string().optional()
  })),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
    value: z.any().optional(),
    scope: z.enum(['global', 'step', 'branch']),
    isRequired: z.boolean(),
    defaultValue: z.any().optional(),
    description: z.string().optional()
  })).optional(),
  triggers: z.array(z.object({
    id: z.string(),
    type: z.enum(['manual', 'scheduled', 'event', 'document_upload', 'client_onboard', 'deadline', 'condition']),
    name: z.string(),
    configuration: z.record(z.any()),
    isActive: z.boolean()
  })).optional(),
  settings: z.object({
    allowParallelExecution: z.boolean().default(false),
    maxConcurrentInstances: z.number().int().min(1).default(1),
    autoAssignment: z.boolean().default(true),
    notificationSettings: z.object({
      onStart: z.boolean().default(true),
      onComplete: z.boolean().default(true),
      onError: z.boolean().default(true),
      onOverdue: z.boolean().default(true)
    }),
    retrySettings: z.object({
      enabled: z.boolean().default(true),
      maxRetries: z.number().int().min(0).max(10).default(3),
      retryDelay: z.number().min(0).default(300)
    }),
    escalationSettings: z.object({
      enabled: z.boolean().default(false),
      escalationLevels: z.array(z.object({
        level: z.number().int(),
        delay: z.number(),
        assignTo: z.string(),
        action: z.enum(['reassign', 'notify', 'auto_approve'])
      })).optional()
    })
  }),
  estimatedDuration: z.number().optional(),
  complexity: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).optional(),
  isSystemTemplate: z.boolean().default(false)
});

const executeWorkflowSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  context: z.object({
    clientId: z.string().optional(),
    engagementId: z.string().optional(),
    documents: z.array(z.string()).optional(),
    notes: z.array(z.string()).optional(),
    customData: z.record(z.any()).optional()
  }),
  variables: z.record(z.any()).optional(),
  options: z.object({
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    dueDate: z.string().optional(),
    assignedTo: z.string().optional(),
    customName: z.string().optional()
  }).optional()
});

const automationRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(5),
  trigger: z.object({
    type: z.enum(['document_upload', 'document_update', 'ocr_completed', 'deadline_approaching', 'schedule', 'manual', 'workflow_step']),
    configuration: z.object({
      documentTypes: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      clientIds: z.array(z.string()).optional(),
      scheduleExpression: z.string().optional(),
      deadlineDays: z.number().optional(),
      workflowStepIds: z.array(z.string()).optional(),
      customFields: z.record(z.any()).optional()
    })
  }),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'regex']),
    value: z.any(),
    logicalOperator: z.enum(['and', 'or']).optional()
  })),
  actions: z.array(z.object({
    type: z.enum(['categorize_document', 'route_document', 'create_task', 'send_notification', 'generate_report', 'archive_document', 'apply_retention', 'start_workflow', 'update_metadata', 'extract_data', 'validate_compliance']),
    configuration: z.record(z.any()),
    errorHandling: z.object({
      retryCount: z.number().int().min(0).max(5).default(3),
      retryDelay: z.number().min(0).default(300),
      onFailure: z.enum(['skip', 'stop', 'notify', 'escalate']).default('skip'),
      escalateTo: z.array(z.string()).optional()
    })
  }))
});

const workflowSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(['pending', 'running', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  clientId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

/**
 * Create workflow template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'create_template':
        return await handleCreateTemplate(body, session);
      case 'execute_workflow':
        return await handleExecuteWorkflow(body, session);
      case 'create_automation_rule':
        return await handleCreateAutomationRule(body, session);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Workflow API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Request failed'
    }, { status: 500 });
  }
}

/**
 * Get workflows and templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'templates':
        return await handleGetTemplates(searchParams, session);
      case 'executions':
        return await handleGetExecutions(searchParams, session);
      case 'automation_rules':
        return await handleGetAutomationRules(searchParams, session);
      case 'statistics':
        return await handleGetStatistics(searchParams, session);
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Workflow GET API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Request failed'
    }, { status: 500 });
  }
}

/**
 * Update workflow or automation rule
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;
    const id = body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'pause_workflow':
        await workflowEngine.pauseWorkflow(id, body.reason);
        return NextResponse.json({ success: true, message: 'Workflow paused' });

      case 'resume_workflow':
        await workflowEngine.resumeWorkflow(id);
        return NextResponse.json({ success: true, message: 'Workflow resumed' });

      case 'cancel_workflow':
        await workflowEngine.cancelWorkflow(id, body.reason);
        return NextResponse.json({ success: true, message: 'Workflow cancelled' });

      case 'update_automation_rule':
        // Update automation rule logic would go here
        return NextResponse.json({ success: true, message: 'Automation rule updated' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Workflow PATCH API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Update failed'
    }, { status: 500 });
  }
}

// Helper functions

async function handleCreateTemplate(body: any, session: any) {
  const validatedData = createWorkflowSchema.parse(body.template);

  const template = await workflowEngine.createWorkflowTemplate({
    ...validatedData,
    metadata: {
      organizationId: session.user.organizationId,
      createdBy: session.user.id,
      version: '1.0.0'
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      template,
      message: 'Workflow template created successfully'
    }
  });
}

async function handleExecuteWorkflow(body: any, session: any) {
  const validatedData = executeWorkflowSchema.parse(body);

  const executionId = await workflowEngine.executeWorkflow(
    validatedData.templateId,
    {
      organizationId: session.user.organizationId,
      clientId: validatedData.context.clientId,
      engagementId: validatedData.context.engagementId,
      documents: validatedData.context.documents || [],
      notes: validatedData.context.notes || [],
      relatedWorkflows: [],
      customData: {
        ...validatedData.context.customData,
        createdBy: session.user.id
      }
    },
    validatedData.variables || {},
    {
      priority: validatedData.options?.priority || 'normal',
      dueDate: validatedData.options?.dueDate ? new Date(validatedData.options.dueDate) : undefined,
      assignedTo: validatedData.options?.assignedTo,
      customName: validatedData.options?.customName
    }
  );

  return NextResponse.json({
    success: true,
    data: {
      executionId,
      message: 'Workflow execution started'
    }
  });
}

async function handleCreateAutomationRule(body: any, session: any) {
  const validatedData = automationRuleSchema.parse(body.rule);

  const rule = await documentWorkflowAutomationService.createAutomationRule(
    {
      ...validatedData,
      organizationId: session.user.organizationId,
      createdBy: session.user.id
    },
    session.user.id
  );

  return NextResponse.json({
    success: true,
    data: {
      rule,
      message: 'Automation rule created successfully'
    }
  });
}

async function handleGetTemplates(searchParams: URLSearchParams, session: any) {
  const category = searchParams.get('category');
  const type = searchParams.get('templateType');
  const isSystemTemplate = searchParams.get('isSystemTemplate') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Mock implementation - would query actual database
  const templates = [
    {
      id: 'template_001',
      name: 'Tax Return Preparation Workflow',
      description: 'Complete workflow for individual tax return preparation',
      category: 'tax_preparation',
      type: 'tax_return_1040',
      version: '2.1.0',
      isSystemTemplate: true,
      isActive: true,
      estimatedDuration: 480, // 8 hours
      complexity: 'medium',
      stepCount: 12,
      executionCount: 145,
      successRate: 0.94,
      lastExecuted: new Date('2024-03-15'),
      createdAt: new Date('2024-01-01'),
      tags: ['tax', 'individual', '1040']
    },
    {
      id: 'template_002',
      name: 'New Client Onboarding',
      description: 'Standard onboarding process for new clients',
      category: 'onboarding',
      type: 'new_client_onboarding',
      version: '1.5.0',
      isSystemTemplate: true,
      isActive: true,
      estimatedDuration: 240, // 4 hours
      complexity: 'low',
      stepCount: 8,
      executionCount: 89,
      successRate: 0.97,
      lastExecuted: new Date('2024-03-18'),
      createdAt: new Date('2024-01-01'),
      tags: ['onboarding', 'client', 'setup']
    },
    {
      id: 'template_003',
      name: 'Monthly Bookkeeping Review',
      description: 'Monthly financial review and reconciliation',
      category: 'bookkeeping',
      type: 'monthly_review',
      version: '1.3.0',
      isSystemTemplate: false,
      isActive: true,
      estimatedDuration: 180, // 3 hours
      complexity: 'medium',
      stepCount: 10,
      executionCount: 234,
      successRate: 0.91,
      lastExecuted: new Date('2024-03-20'),
      createdAt: new Date('2024-02-15'),
      tags: ['bookkeeping', 'monthly', 'review']
    }
  ];

  // Apply filters
  let filteredTemplates = templates.filter(t =>
    (!category || t.category === category) &&
    (!type || t.type === type) &&
    (isSystemTemplate === undefined || t.isSystemTemplate === isSystemTemplate)
  );

  const total = filteredTemplates.length;
  filteredTemplates = filteredTemplates.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: {
      templates: filteredTemplates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + filteredTemplates.length < total
      }
    }
  });
}

async function handleGetExecutions(searchParams: URLSearchParams, session: any) {
  const searchData = {
    query: searchParams.get('query') || undefined,
    category: searchParams.get('category') || undefined,
    type: searchParams.get('type') || undefined,
    status: searchParams.get('status') as any || undefined,
    assignedTo: searchParams.get('assignedTo') || undefined,
    priority: searchParams.get('priority') as any || undefined,
    clientId: searchParams.get('clientId') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    limit: parseInt(searchParams.get('limit') || '20'),
    offset: parseInt(searchParams.get('offset') || '0')
  };

  const validatedSearch = workflowSearchSchema.parse(searchData);

  // Mock implementation - would query actual database
  const executions = [
    {
      id: 'exec_001',
      templateId: 'template_001',
      templateName: 'Tax Return Preparation Workflow',
      name: 'Tax Return - John Smith',
      status: 'running',
      priority: 'normal',
      progress: 65,
      currentStep: 'Review Supporting Documents',
      currentStepIndex: 7,
      totalSteps: 12,
      assignedTo: 'user_123',
      assigneeName: 'Jane Doe',
      clientId: 'client_456',
      clientName: 'John Smith',
      startedAt: new Date('2024-03-18T09:00:00Z'),
      dueDate: new Date('2024-03-25T17:00:00Z'),
      estimatedCompletion: new Date('2024-03-24T15:30:00Z'),
      createdBy: session.user.id,
      metadata: {
        taxYear: 2023,
        returnType: '1040',
        complexity: 'standard'
      }
    },
    {
      id: 'exec_002',
      templateId: 'template_002',
      templateName: 'New Client Onboarding',
      name: 'Onboarding - ABC Corp',
      status: 'completed',
      priority: 'high',
      progress: 100,
      currentStep: 'Completed',
      currentStepIndex: 8,
      totalSteps: 8,
      assignedTo: 'user_456',
      assigneeName: 'Bob Wilson',
      clientId: 'client_789',
      clientName: 'ABC Corp',
      startedAt: new Date('2024-03-15T10:00:00Z'),
      completedAt: new Date('2024-03-17T16:45:00Z'),
      dueDate: new Date('2024-03-20T17:00:00Z'),
      createdBy: session.user.id,
      metadata: {
        businessType: 'Corporation',
        industry: 'Technology'
      }
    }
  ];

  // Apply filters
  let filteredExecutions = executions.filter(e =>
    (!validatedSearch.status || e.status === validatedSearch.status) &&
    (!validatedSearch.priority || e.priority === validatedSearch.priority) &&
    (!validatedSearch.assignedTo || e.assignedTo === validatedSearch.assignedTo) &&
    (!validatedSearch.clientId || e.clientId === validatedSearch.clientId)
  );

  if (validatedSearch.query) {
    filteredExecutions = filteredExecutions.filter(e =>
      e.name.toLowerCase().includes(validatedSearch.query!.toLowerCase()) ||
      e.templateName.toLowerCase().includes(validatedSearch.query!.toLowerCase()) ||
      e.clientName.toLowerCase().includes(validatedSearch.query!.toLowerCase())
    );
  }

  const total = filteredExecutions.length;
  filteredExecutions = filteredExecutions.slice(validatedSearch.offset, validatedSearch.offset + validatedSearch.limit);

  return NextResponse.json({
    success: true,
    data: {
      executions: filteredExecutions,
      pagination: {
        total,
        limit: validatedSearch.limit,
        offset: validatedSearch.offset,
        hasMore: validatedSearch.offset + filteredExecutions.length < total
      }
    }
  });
}

async function handleGetAutomationRules(searchParams: URLSearchParams, session: any) {
  const isActive = searchParams.get('isActive');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Mock implementation
  const rules = [
    {
      id: 'rule_001',
      name: 'Auto-categorize Tax Documents',
      description: 'Automatically categorize uploaded tax documents',
      isActive: true,
      priority: 8,
      trigger: {
        type: 'document_upload',
        configuration: {
          documentTypes: ['pdf'],
          categories: ['tax_return', 'w2', '1099']
        }
      },
      executionCount: 156,
      successRate: 0.94,
      lastExecuted: new Date('2024-03-20T14:30:00Z'),
      createdAt: new Date('2024-01-15'),
      createdBy: session.user.id
    },
    {
      id: 'rule_002',
      name: 'Route Client Documents',
      description: 'Route uploaded documents to appropriate team members',
      isActive: true,
      priority: 6,
      trigger: {
        type: 'ocr_completed',
        configuration: {
          confidenceThreshold: 0.8
        }
      },
      executionCount: 89,
      successRate: 0.97,
      lastExecuted: new Date('2024-03-20T16:45:00Z'),
      createdAt: new Date('2024-02-01'),
      createdBy: session.user.id
    }
  ];

  // Apply filters
  let filteredRules = rules.filter(r =>
    (isActive === null || r.isActive === (isActive === 'true'))
  );

  const total = filteredRules.length;
  filteredRules = filteredRules.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: {
      rules: filteredRules,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + filteredRules.length < total
      }
    }
  });
}

async function handleGetStatistics(searchParams: URLSearchParams, session: any) {
  const period = searchParams.get('period') || '30d';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  // Mock statistics
  const statistics = {
    workflows: {
      totalExecutions: 234,
      completedExecutions: 198,
      failedExecutions: 12,
      cancelledExecutions: 24,
      successRate: 0.846,
      averageCompletionTime: 6.7, // hours
      topTemplates: [
        { templateId: 'template_001', name: 'Tax Return Preparation', executions: 89 },
        { templateId: 'template_002', name: 'New Client Onboarding', executions: 67 },
        { templateId: 'template_003', name: 'Monthly Bookkeeping', executions: 45 }
      ]
    },
    automation: {
      totalRules: 12,
      activeRules: 10,
      totalExecutions: 1456,
      successfulExecutions: 1378,
      successRate: 0.946,
      topRules: [
        { ruleId: 'rule_001', name: 'Auto-categorize Tax Documents', executions: 456 },
        { ruleId: 'rule_002', name: 'Route Client Documents', executions: 234 },
        { ruleId: 'rule_003', name: 'Compliance Check', executions: 189 }
      ]
    },
    efficiency: {
      timesSaved: 145.5, // hours
      manualTasksAutomated: 89,
      processingSpeedImprovement: 2.3, // multiplier
      costSavings: 4567.89 // dollars
    }
  };

  return NextResponse.json({
    success: true,
    data: {
      period,
      dateRange: {
        from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: dateTo || new Date().toISOString()
      },
      statistics
    }
  });
}