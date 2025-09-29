import { WorkflowTemplate, WorkflowStep, WorkflowConnection, WorkflowVariable, WorkflowTrigger } from './workflow-engine';

// Common CPA workflow metrics and KPIs
export interface WorkflowMetrics {
  avgCompletionTime: number; // in hours
  avgResourceUtilization: number; // percentage
  clientSatisfactionScore: number; // 1-10
  errorRate: number; // percentage
  reworkRate: number; // percentage
  deadlineCompliance: number; // percentage
  costPerTask: number; // in dollars
  qualityScore: number; // 1-10
}

// Enhanced CPA workflow configuration
export interface CPAWorkflowConfig {
  clientTier: 'basic' | 'premium' | 'enterprise';
  complexityLevel: 'simple' | 'moderate' | 'complex';
  complianceRequirements: string[];
  autoAssignmentRules: {
    taskType: string;
    requiredSkills: string[];
    workloadBalancing: boolean;
    seniorityLevel: 'junior' | 'senior' | 'manager' | 'partner';
  }[];
  qualityGates: {
    stepId: string;
    reviewRequired: boolean;
    approvalRequired: boolean;
    qualityChecks: string[];
  }[];
  deadlineManagement: {
    bufferDays: number;
    escalationRules: {
      daysBeforeDue: number;
      action: 'notify' | 'reassign' | 'escalate';
      recipients: string[];
    }[];
  };
  documentationRequirements: string[];
}

// Optimized CPA workflow templates with bottleneck identification and resolution
export const cpaWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'tax-preparation-optimized',
    name: 'Optimized Tax Preparation Workflow',
    description: 'Streamlined tax preparation process with automated bottleneck detection and resolution',
    category: 'Tax Services',
    version: '2.0',
    isSystemTemplate: true,
    complexity: 'medium',
    estimatedDuration: 25, // hours (reduced from 40 through optimization)
    tags: ['tax', 'preparation', 'optimization', 'automation'],
    metadata: {
      expectedMetrics: {
        avgCompletionTime: 25,
        avgResourceUtilization: 85,
        clientSatisfactionScore: 9.2,
        errorRate: 0.5,
        reworkRate: 2.0,
        deadlineCompliance: 98,
        costPerTask: 450,
        qualityScore: 9.5
      } as WorkflowMetrics,
      bottleneckPrevention: [
        'Parallel document collection and initial review',
        'Automated data validation and error detection',
        'Smart task assignment based on expertise and workload',
        'Real-time progress monitoring with early warning system'
      ]
    },
    steps: [
      {
        id: 'start',
        type: 'start',
        name: 'Tax Preparation Initiated',
        description: 'Tax preparation workflow started for client',
        position: { x: 100, y: 200 },
        configuration: {
          automationType: 'client_notification',
          notificationTemplate: 'tax_prep_started',
          triggers: ['client_onboard', 'tax_season_start']
        },
        inputs: [],
        outputs: [{ id: 'out1', sourceStepId: 'start', targetStepId: 'client_setup', label: 'proceed' }]
      },
      {
        id: 'client_setup',
        type: 'automation',
        name: 'Client Information Setup',
        description: 'Automated client profile setup and previous year data retrieval',
        position: { x: 300, y: 200 },
        configuration: {
          automationType: 'data_setup',
          parallelExecution: true,
          subtasks: [
            'Retrieve prior year returns',
            'Update client contact information',
            'Generate document checklist',
            'Setup secure client portal access'
          ],
          estimatedHours: 1.5,
          qualityChecks: ['data_completeness', 'contact_verification']
        },
        inputs: [{ id: 'in1', sourceStepId: 'start', targetStepId: 'client_setup' }],
        outputs: [
          { id: 'out1', sourceStepId: 'client_setup', targetStepId: 'document_collection', label: 'setup_complete' },
          { id: 'out2', sourceStepId: 'client_setup', targetStepId: 'engagement_review', label: 'parallel' }
        ],
        assignee: { type: 'auto', value: 'data_specialist' },
        timeouts: { duration: 4, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'engagement_review',
        type: 'task',
        name: 'Engagement Letter Review',
        description: 'Review and update engagement letter for current year',
        position: { x: 300, y: 100 },
        configuration: {
          taskType: 'review',
          parallelExecution: true,
          estimatedHours: 0.5,
          qualityChecks: ['engagement_scope', 'fee_structure', 'deadline_agreement'],
          autoApprovalRules: {
            noChangesFromPriorYear: true,
            clientTierBasic: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'client_setup', targetStepId: 'engagement_review' }],
        outputs: [{ id: 'out1', sourceStepId: 'engagement_review', targetStepId: 'document_collection', label: 'approved' }],
        assignee: { type: 'role', value: 'senior_tax_preparer' },
        conditions: [
          { field: 'client.tier', operator: 'not_equals', value: 'basic' }
        ]
      },
      {
        id: 'document_collection',
        type: 'automation',
        name: 'Intelligent Document Collection',
        description: 'Smart document collection with automated reminders and validation',
        position: { x: 500, y: 200 },
        configuration: {
          automationType: 'document_collection',
          smartReminders: true,
          ocrProcessing: true,
          documentValidation: true,
          clientPortalIntegration: true,
          expectedDocuments: [
            'W-2 forms',
            '1099 forms',
            'Bank statements',
            'Investment statements',
            'Business records',
            'Receipts and deductions'
          ],
          autoValidationRules: [
            'SSN_matching',
            'date_ranges',
            'document_completeness',
            'signature_verification'
          ],
          estimatedHours: 2.0
        },
        inputs: [
          { id: 'in1', sourceStepId: 'client_setup', targetStepId: 'document_collection' },
          { id: 'in2', sourceStepId: 'engagement_review', targetStepId: 'document_collection' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'document_collection', targetStepId: 'document_validation', label: 'documents_received' },
          { id: 'out2', sourceStepId: 'document_collection', targetStepId: 'follow_up_client', condition: 'documents_incomplete' }
        ],
        assignee: { type: 'auto', value: 'document_specialist' },
        timeouts: { duration: 5, unit: 'days', action: 'escalate' }
      },
      {
        id: 'follow_up_client',
        type: 'automation',
        name: 'Client Follow-up for Missing Documents',
        description: 'Automated follow-up with client for missing or incomplete documents',
        position: { x: 500, y: 350 },
        configuration: {
          automationType: 'client_follow_up',
          escalationLevels: [
            { days: 2, method: 'email', template: 'gentle_reminder' },
            { days: 5, method: 'phone_call', assignTo: 'client_coordinator' },
            { days: 7, method: 'certified_mail', escalateTo: 'manager' }
          ],
          maxFollowUpDays: 10
        },
        inputs: [{ id: 'in1', sourceStepId: 'document_collection', targetStepId: 'follow_up_client' }],
        outputs: [
          { id: 'out1', sourceStepId: 'follow_up_client', targetStepId: 'document_validation', label: 'documents_complete' },
          { id: 'out2', sourceStepId: 'follow_up_client', targetStepId: 'workflow_pause', label: 'client_unresponsive' }
        ]
      },
      {
        id: 'document_validation',
        type: 'task',
        name: 'Document Validation & Categorization',
        description: 'AI-assisted document validation and categorization with quality control',
        position: { x: 700, y: 200 },
        configuration: {
          taskType: 'validation',
          aiAssisted: true,
          qualityGates: true,
          estimatedHours: 3.0,
          validationChecks: [
            'document_authenticity',
            'mathematical_accuracy',
            'date_consistency',
            'client_information_match',
            'prior_year_comparison'
          ],
          categorizationRules: [
            'income_sources',
            'deduction_categories',
            'investment_activities',
            'business_expenses'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'document_collection', targetStepId: 'document_validation' },
          { id: 'in2', sourceStepId: 'follow_up_client', targetStepId: 'document_validation' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'document_validation', targetStepId: 'data_entry', label: 'validated' },
          { id: 'out2', sourceStepId: 'document_validation', targetStepId: 'discrepancy_resolution', condition: 'issues_found' }
        ],
        assignee: { type: 'auto', value: 'tax_specialist' },
        dependencies: ['document_collection']
      },
      {
        id: 'discrepancy_resolution',
        type: 'task',
        name: 'Discrepancy Resolution',
        description: 'Resolve document discrepancies and data inconsistencies',
        position: { x: 700, y: 350 },
        configuration: {
          taskType: 'resolution',
          estimatedHours: 2.0,
          escalationRequired: true,
          resolutionMethods: [
            'client_clarification',
            'third_party_verification',
            'prior_year_analysis',
            'professional_judgment'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'document_validation', targetStepId: 'discrepancy_resolution' }],
        outputs: [
          { id: 'out1', sourceStepId: 'discrepancy_resolution', targetStepId: 'data_entry', label: 'resolved' },
          { id: 'out2', sourceStepId: 'discrepancy_resolution', targetStepId: 'manager_review', label: 'escalate' }
        ],
        assignee: { type: 'role', value: 'senior_tax_preparer' }
      },
      {
        id: 'data_entry',
        type: 'automation',
        name: 'Intelligent Data Entry',
        description: 'AI-powered data entry with real-time validation and error detection',
        position: { x: 900, y: 200 },
        configuration: {
          automationType: 'data_entry',
          aiPowered: true,
          realTimeValidation: true,
          estimatedHours: 4.0,
          automationLevel: 85, // percentage of automatic data entry
          validationRules: [
            'tax_law_compliance',
            'mathematical_accuracy',
            'prior_year_consistency',
            'irs_validation_rules'
          ],
          qualityChecks: [
            'data_completeness',
            'calculation_accuracy',
            'form_selection',
            'deduction_optimization'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'document_validation', targetStepId: 'data_entry' },
          { id: 'in2', sourceStepId: 'discrepancy_resolution', targetStepId: 'data_entry' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'data_entry', targetStepId: 'calculation_review', label: 'entry_complete' }
        ],
        assignee: { type: 'auto', value: 'tax_preparer' }
      },
      {
        id: 'calculation_review',
        type: 'task',
        name: 'Calculation & Optimization Review',
        description: 'Review calculations and identify tax optimization opportunities',
        position: { x: 1100, y: 200 },
        configuration: {
          taskType: 'review',
          estimatedHours: 2.5,
          optimizationFocus: true,
          reviewAreas: [
            'calculation_accuracy',
            'deduction_maximization',
            'credit_optimization',
            'tax_planning_opportunities',
            'estimated_payment_calculations'
          ],
          qualityGates: [
            'peer_review',
            'automated_diagnostics',
            'prior_year_comparison'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'data_entry', targetStepId: 'calculation_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'calculation_review', targetStepId: 'senior_review', label: 'review_complete' },
          { id: 'out2', sourceStepId: 'calculation_review', targetStepId: 'data_entry', condition: 'corrections_needed' }
        ],
        assignee: { type: 'role', value: 'senior_tax_preparer' }
      },
      {
        id: 'senior_review',
        type: 'task',
        name: 'Senior Review & Sign-off',
        description: 'Final senior review and professional sign-off',
        position: { x: 1300, y: 200 },
        configuration: {
          taskType: 'approval',
          estimatedHours: 1.5,
          approvalRequired: true,
          reviewFocus: [
            'professional_standards',
            'risk_assessment',
            'client_communication',
            'tax_planning_recommendations'
          ],
          signOffRequirements: [
            'calculation_verification',
            'compliance_check',
            'documentation_review',
            'quality_assurance'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'calculation_review', targetStepId: 'senior_review' },
          { id: 'in2', sourceStepId: 'manager_review', targetStepId: 'senior_review' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'senior_review', targetStepId: 'client_review', label: 'approved' },
          { id: 'out2', sourceStepId: 'senior_review', targetStepId: 'calculation_review', condition: 'revisions_needed' }
        ],
        assignee: { type: 'role', value: 'tax_manager' }
      },
      {
        id: 'manager_review',
        type: 'task',
        name: 'Manager Review for Complex Cases',
        description: 'Manager review for complex or high-risk returns',
        position: { x: 1100, y: 350 },
        configuration: {
          taskType: 'approval',
          estimatedHours: 1.0,
          triggerConditions: [
            'high_complexity',
            'significant_changes',
            'large_refund_amount',
            'audit_risk_factors'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'discrepancy_resolution', targetStepId: 'manager_review' }],
        outputs: [{ id: 'out1', sourceStepId: 'manager_review', targetStepId: 'senior_review', label: 'approved' }],
        assignee: { type: 'role', value: 'tax_manager' },
        conditions: [
          { field: 'return.complexity', operator: 'equals', value: 'high' },
          { field: 'return.refund_amount', operator: 'greater_than', value: 10000 }
        ]
      },
      {
        id: 'client_review',
        type: 'automation',
        name: 'Client Review & Approval',
        description: 'Secure client portal for return review and approval',
        position: { x: 1500, y: 200 },
        configuration: {
          automationType: 'client_portal',
          estimatedHours: 0.5,
          portalFeatures: [
            'secure_return_viewing',
            'electronic_signature',
            'document_download',
            'payment_calculation',
            'tax_planning_summary'
          ],
          reminderSchedule: [
            { days: 2, method: 'email' },
            { days: 5, method: 'phone_call' },
            { days: 7, method: 'registered_mail' }
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'senior_review', targetStepId: 'client_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'client_review', targetStepId: 'e_filing', label: 'approved' },
          { id: 'out2', sourceStepId: 'client_review', targetStepId: 'client_questions', condition: 'questions_raised' }
        ]
      },
      {
        id: 'client_questions',
        type: 'task',
        name: 'Address Client Questions',
        description: 'Address client questions and concerns about the return',
        position: { x: 1500, y: 350 },
        configuration: {
          taskType: 'client_communication',
          estimatedHours: 1.0,
          communicationMethods: ['phone', 'email', 'video_call', 'in_person'],
          documentationRequired: true
        },
        inputs: [{ id: 'in1', sourceStepId: 'client_review', targetStepId: 'client_questions' }],
        outputs: [
          { id: 'out1', sourceStepId: 'client_questions', targetStepId: 'e_filing', label: 'resolved' },
          { id: 'out2', sourceStepId: 'client_questions', targetStepId: 'calculation_review', condition: 'changes_needed' }
        ],
        assignee: { type: 'role', value: 'client_coordinator' }
      },
      {
        id: 'e_filing',
        type: 'automation',
        name: 'Electronic Filing & Confirmation',
        description: 'Automated e-filing with confirmation and tracking',
        position: { x: 1700, y: 200 },
        configuration: {
          automationType: 'e_filing',
          estimatedHours: 0.5,
          filingOptions: ['federal', 'state', 'local'],
          confirmationTracking: true,
          paymentProcessing: true,
          documentArchiving: true
        },
        inputs: [
          { id: 'in1', sourceStepId: 'client_review', targetStepId: 'e_filing' },
          { id: 'in2', sourceStepId: 'client_questions', targetStepId: 'e_filing' }
        ],
        outputs: [{ id: 'out1', sourceStepId: 'e_filing', targetStepId: 'post_filing', label: 'filed' }]
      },
      {
        id: 'post_filing',
        type: 'automation',
        name: 'Post-Filing Activities',
        description: 'Automated post-filing client communication and file management',
        position: { x: 1900, y: 200 },
        configuration: {
          automationType: 'post_filing',
          estimatedHours: 0.5,
          activities: [
            'filing_confirmation_email',
            'payment_instructions',
            'document_archiving',
            'client_satisfaction_survey',
            'next_year_planning_setup',
            'quarterly_estimated_reminders'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'e_filing', targetStepId: 'post_filing' }],
        outputs: [{ id: 'out1', sourceStepId: 'post_filing', targetStepId: 'end', label: 'complete' }]
      },
      {
        id: 'workflow_pause',
        type: 'delay',
        name: 'Workflow Pause - Client Unresponsive',
        description: 'Pause workflow when client is unresponsive',
        position: { x: 500, y: 500 },
        configuration: {
          delay: 30,
          unit: 'days',
          escalationActions: [
            'manager_notification',
            'client_termination_process',
            'fee_protection_measures'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'follow_up_client', targetStepId: 'workflow_pause' }],
        outputs: [{ id: 'out1', sourceStepId: 'workflow_pause', targetStepId: 'end', label: 'terminated' }]
      },
      {
        id: 'end',
        type: 'end',
        name: 'Tax Preparation Complete',
        description: 'Tax preparation workflow completed successfully',
        position: { x: 2100, y: 200 },
        configuration: {
          completionActions: [
            'update_client_record',
            'time_tracking_finalization',
            'billing_preparation',
            'file_archiving',
            'metrics_recording'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'post_filing', targetStepId: 'end' },
          { id: 'in2', sourceStepId: 'workflow_pause', targetStepId: 'end' }
        ],
        outputs: []
      }
    ],
    connections: [
      { id: 'c1', sourceStepId: 'start', targetStepId: 'client_setup', label: 'initiate' },
      { id: 'c2', sourceStepId: 'client_setup', targetStepId: 'document_collection', label: 'setup_complete' },
      { id: 'c3', sourceStepId: 'client_setup', targetStepId: 'engagement_review', label: 'parallel' },
      { id: 'c4', sourceStepId: 'engagement_review', targetStepId: 'document_collection', label: 'approved' },
      { id: 'c5', sourceStepId: 'document_collection', targetStepId: 'document_validation', label: 'complete' },
      { id: 'c6', sourceStepId: 'document_collection', targetStepId: 'follow_up_client', label: 'incomplete' },
      { id: 'c7', sourceStepId: 'follow_up_client', targetStepId: 'document_validation', label: 'complete' },
      { id: 'c8', sourceStepId: 'follow_up_client', targetStepId: 'workflow_pause', label: 'unresponsive' },
      { id: 'c9', sourceStepId: 'document_validation', targetStepId: 'data_entry', label: 'validated' },
      { id: 'c10', sourceStepId: 'document_validation', targetStepId: 'discrepancy_resolution', label: 'issues' },
      { id: 'c11', sourceStepId: 'discrepancy_resolution', targetStepId: 'data_entry', label: 'resolved' },
      { id: 'c12', sourceStepId: 'discrepancy_resolution', targetStepId: 'manager_review', label: 'escalate' },
      { id: 'c13', sourceStepId: 'data_entry', targetStepId: 'calculation_review', label: 'complete' },
      { id: 'c14', sourceStepId: 'calculation_review', targetStepId: 'senior_review', label: 'approved' },
      { id: 'c15', sourceStepId: 'calculation_review', targetStepId: 'data_entry', label: 'corrections' },
      { id: 'c16', sourceStepId: 'manager_review', targetStepId: 'senior_review', label: 'approved' },
      { id: 'c17', sourceStepId: 'senior_review', targetStepId: 'client_review', label: 'approved' },
      { id: 'c18', sourceStepId: 'senior_review', targetStepId: 'calculation_review', label: 'revisions' },
      { id: 'c19', sourceStepId: 'client_review', targetStepId: 'e_filing', label: 'approved' },
      { id: 'c20', sourceStepId: 'client_review', targetStepId: 'client_questions', label: 'questions' },
      { id: 'c21', sourceStepId: 'client_questions', targetStepId: 'e_filing', label: 'resolved' },
      { id: 'c22', sourceStepId: 'client_questions', targetStepId: 'calculation_review', label: 'changes' },
      { id: 'c23', sourceStepId: 'e_filing', targetStepId: 'post_filing', label: 'filed' },
      { id: 'c24', sourceStepId: 'post_filing', targetStepId: 'end', label: 'complete' },
      { id: 'c25', sourceStepId: 'workflow_pause', targetStepId: 'end', label: 'terminated' }
    ],
    variables: [
      { name: 'client_id', type: 'string', value: '', scope: 'global', isRequired: true, description: 'Client identifier' },
      { name: 'tax_year', type: 'number', value: 2024, scope: 'global', isRequired: true, description: 'Tax year being prepared' },
      { name: 'complexity_level', type: 'string', value: 'moderate', scope: 'global', isRequired: true, description: 'Return complexity level' },
      { name: 'client_tier', type: 'string', value: 'basic', scope: 'global', isRequired: true, description: 'Client service tier' },
      { name: 'prior_year_available', type: 'boolean', value: true, scope: 'global', isRequired: false, description: 'Prior year return available' },
      { name: 'estimated_refund', type: 'number', value: 0, scope: 'global', isRequired: false, description: 'Estimated refund amount' },
      { name: 'filing_deadline', type: 'date', value: '2024-04-15', scope: 'global', isRequired: true, description: 'Filing deadline' }
    ],
    triggers: [
      { id: 't1', type: 'manual', name: 'Manual Start', configuration: { allowedRoles: ['tax_manager', 'senior_preparer'] }, isActive: true },
      { id: 't2', type: 'scheduled', name: 'Tax Season Start', configuration: { cronExpression: '0 0 1 1 *' }, isActive: true },
      { id: 't3', type: 'event', name: 'Client Onboard', configuration: { eventType: 'client_onboarded' }, isActive: true },
      { id: 't4', type: 'deadline', name: 'Filing Deadline Approach', configuration: { daysBeforeDeadline: 30 }, isActive: true }
    ],
    settings: {
      allowParallelExecution: true,
      maxConcurrentInstances: 5,
      autoAssignment: true,
      notificationSettings: {
        onStart: true,
        onComplete: true,
        onError: true,
        onOverdue: true
      },
      retrySettings: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 3600 // 1 hour
      },
      escalationSettings: {
        enabled: true,
        escalationLevels: [
          { level: 1, delay: 24, assignTo: 'senior_preparer', action: 'notify' },
          { level: 2, delay: 48, assignTo: 'tax_manager', action: 'reassign' },
          { level: 3, delay: 72, assignTo: 'partner', action: 'escalate' }
        ]
      }
    }
  },

  {
    id: 'client-onboarding-streamlined',
    name: 'Streamlined Client Onboarding',
    description: 'Optimized client onboarding process with automated document collection and setup',
    category: 'Client Management',
    version: '2.0',
    isSystemTemplate: true,
    complexity: 'low',
    estimatedDuration: 8, // hours (reduced from 16 through automation)
    tags: ['onboarding', 'automation', 'client-setup', 'efficiency'],
    metadata: {
      expectedMetrics: {
        avgCompletionTime: 8,
        avgResourceUtilization: 90,
        clientSatisfactionScore: 9.5,
        errorRate: 0.2,
        reworkRate: 1.0,
        deadlineCompliance: 99,
        costPerTask: 200,
        qualityScore: 9.8
      } as WorkflowMetrics,
      automationFeatures: [
        'Automated engagement letter generation',
        'Digital document collection portal',
        'Real-time compliance checking',
        'Intelligent task assignment',
        'Automated welcome sequence'
      ]
    },
    steps: [
      {
        id: 'start',
        type: 'start',
        name: 'Client Onboarding Initiated',
        description: 'New client onboarding process started',
        position: { x: 100, y: 200 },
        configuration: {},
        inputs: [],
        outputs: [{ id: 'out1', sourceStepId: 'start', targetStepId: 'lead_qualification', label: 'proceed' }]
      },
      {
        id: 'lead_qualification',
        type: 'automation',
        name: 'Lead Qualification & Risk Assessment',
        description: 'Automated lead qualification and risk assessment',
        position: { x: 300, y: 200 },
        configuration: {
          automationType: 'lead_qualification',
          parallelExecution: true,
          estimatedHours: 1.0,
          qualificationCriteria: [
            'business_complexity',
            'revenue_size',
            'industry_type',
            'geographic_location',
            'service_requirements',
            'compliance_risk'
          ],
          riskFactors: [
            'industry_risk',
            'regulatory_complexity',
            'audit_history',
            'financial_stability'
          ],
          autoDecisionRules: {
            lowRisk: 'auto_approve',
            mediumRisk: 'manager_review',
            highRisk: 'partner_approval'
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'start', targetStepId: 'lead_qualification' }],
        outputs: [
          { id: 'out1', sourceStepId: 'lead_qualification', targetStepId: 'engagement_setup', label: 'qualified' },
          { id: 'out2', sourceStepId: 'lead_qualification', targetStepId: 'manager_review', condition: 'medium_risk' },
          { id: 'out3', sourceStepId: 'lead_qualification', targetStepId: 'decline_engagement', condition: 'high_risk' }
        ],
        assignee: { type: 'auto', value: 'business_development' }
      },
      {
        id: 'manager_review',
        type: 'task',
        name: 'Manager Risk Review',
        description: 'Manager review for medium/high risk clients',
        position: { x: 300, y: 350 },
        configuration: {
          taskType: 'approval',
          estimatedHours: 0.5,
          reviewCriteria: [
            'risk_tolerance',
            'firm_capacity',
            'expertise_match',
            'fee_potential'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'lead_qualification', targetStepId: 'manager_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'manager_review', targetStepId: 'engagement_setup', label: 'approved' },
          { id: 'out2', sourceStepId: 'manager_review', targetStepId: 'decline_engagement', label: 'declined' }
        ],
        assignee: { type: 'role', value: 'client_services_manager' }
      },
      {
        id: 'engagement_setup',
        type: 'automation',
        name: 'Automated Engagement Setup',
        description: 'Automated engagement letter generation and client setup',
        position: { x: 500, y: 200 },
        configuration: {
          automationType: 'engagement_setup',
          parallelExecution: true,
          estimatedHours: 1.5,
          automatedTasks: [
            'engagement_letter_generation',
            'fee_structure_calculation',
            'service_scope_definition',
            'client_portal_creation',
            'team_assignment',
            'project_setup'
          ],
          templateSelection: {
            basicServices: 'template_basic',
            fullService: 'template_comprehensive',
            customServices: 'template_custom'
          }
        },
        inputs: [
          { id: 'in1', sourceStepId: 'lead_qualification', targetStepId: 'engagement_setup' },
          { id: 'in2', sourceStepId: 'manager_review', targetStepId: 'engagement_setup' }
        ],
        outputs: [{ id: 'out1', sourceStepId: 'engagement_setup', targetStepId: 'document_collection_setup', label: 'setup_complete' }],
        assignee: { type: 'auto', value: 'client_coordinator' }
      },
      {
        id: 'document_collection_setup',
        type: 'automation',
        name: 'Document Collection Portal Setup',
        description: 'Setup secure document collection portal for client',
        position: { x: 700, y: 200 },
        configuration: {
          automationType: 'document_portal_setup',
          estimatedHours: 0.5,
          portalFeatures: [
            'secure_file_upload',
            'document_checklist',
            'progress_tracking',
            'automated_reminders',
            'mobile_accessibility',
            'e_signature_capability'
          ],
          documentCategories: [
            'financial_statements',
            'tax_records',
            'business_licenses',
            'bank_statements',
            'insurance_documents',
            'contracts_agreements'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'engagement_setup', targetStepId: 'document_collection_setup' }],
        outputs: [{ id: 'out1', sourceStepId: 'document_collection_setup', targetStepId: 'client_communication', label: 'portal_ready' }]
      },
      {
        id: 'client_communication',
        type: 'automation',
        name: 'Welcome Communication Sequence',
        description: 'Automated welcome communication and onboarding instructions',
        position: { x: 900, y: 200 },
        configuration: {
          automationType: 'communication_sequence',
          estimatedHours: 0.5,
          communicationSequence: [
            { day: 0, type: 'welcome_email', template: 'welcome_package' },
            { day: 1, type: 'portal_instructions', template: 'portal_guide' },
            { day: 3, type: 'document_reminder', template: 'document_checklist' },
            { day: 7, type: 'check_in_call', assignTo: 'client_coordinator' },
            { day: 14, type: 'progress_update', template: 'onboarding_status' }
          ],
          personalization: true,
          trackingEnabled: true
        },
        inputs: [{ id: 'in1', sourceStepId: 'document_collection_setup', targetStepId: 'client_communication' }],
        outputs: [{ id: 'out1', sourceStepId: 'client_communication', targetStepId: 'document_collection', label: 'communications_sent' }]
      },
      {
        id: 'document_collection',
        type: 'automation',
        name: 'Client Document Collection',
        description: 'Monitor and manage client document collection process',
        position: { x: 1100, y: 200 },
        configuration: {
          automationType: 'document_monitoring',
          estimatedHours: 2.0,
          monitoringFeatures: [
            'real_time_progress_tracking',
            'automated_reminders',
            'document_validation',
            'completion_notifications',
            'escalation_alerts'
          ],
          reminderSchedule: [
            { days: 3, method: 'email', template: 'gentle_reminder' },
            { days: 7, method: 'phone_call', assignTo: 'client_coordinator' },
            { days: 10, method: 'priority_follow_up', escalateTo: 'manager' }
          ],
          completionThreshold: 90 // percentage
        },
        inputs: [{ id: 'in1', sourceStepId: 'client_communication', targetStepId: 'document_collection' }],
        outputs: [
          { id: 'out1', sourceStepId: 'document_collection', targetStepId: 'document_review', label: 'documents_received' },
          { id: 'out2', sourceStepId: 'document_collection', targetStepId: 'follow_up_coordination', condition: 'incomplete_documents' }
        ]
      },
      {
        id: 'follow_up_coordination',
        type: 'task',
        name: 'Document Follow-up Coordination',
        description: 'Coordinate with client for missing or incomplete documents',
        position: { x: 1100, y: 350 },
        configuration: {
          taskType: 'client_communication',
          estimatedHours: 1.0,
          followUpMethods: [
            'personalized_email',
            'phone_call',
            'video_meeting',
            'document_assistance'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'document_collection', targetStepId: 'follow_up_coordination' }],
        outputs: [
          { id: 'out1', sourceStepId: 'follow_up_coordination', targetStepId: 'document_review', label: 'documents_complete' },
          { id: 'out2', sourceStepId: 'follow_up_coordination', targetStepId: 'escalation_review', condition: 'persistent_delays' }
        ],
        assignee: { type: 'role', value: 'client_coordinator' }
      },
      {
        id: 'document_review',
        type: 'task',
        name: 'Document Review & Validation',
        description: 'Professional review and validation of client documents',
        position: { x: 1300, y: 200 },
        configuration: {
          taskType: 'review',
          estimatedHours: 2.0,
          reviewChecklist: [
            'document_completeness',
            'financial_accuracy',
            'compliance_requirements',
            'data_quality',
            'missing_information'
          ],
          validationTools: [
            'automated_checks',
            'cross_reference_validation',
            'industry_benchmarking',
            'prior_period_comparison'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'document_collection', targetStepId: 'document_review' },
          { id: 'in2', sourceStepId: 'follow_up_coordination', targetStepId: 'document_review' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'document_review', targetStepId: 'system_setup', label: 'review_complete' },
          { id: 'out2', sourceStepId: 'document_review', targetStepId: 'client_clarification', condition: 'clarification_needed' }
        ],
        assignee: { type: 'role', value: 'senior_accountant' }
      },
      {
        id: 'client_clarification',
        type: 'task',
        name: 'Client Clarification & Updates',
        description: 'Obtain clarifications and updates from client',
        position: { x: 1300, y: 350 },
        configuration: {
          taskType: 'client_communication',
          estimatedHours: 1.0,
          clarificationAreas: [
            'financial_transactions',
            'business_operations',
            'accounting_policies',
            'missing_documents',
            'data_discrepancies'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'document_review', targetStepId: 'client_clarification' }],
        outputs: [{ id: 'out1', sourceStepId: 'client_clarification', targetStepId: 'system_setup', label: 'clarified' }],
        assignee: { type: 'role', value: 'senior_accountant' }
      },
      {
        id: 'system_setup',
        type: 'automation',
        name: 'Client System Setup',
        description: 'Setup client in all firm systems and software',
        position: { x: 1500, y: 200 },
        configuration: {
          automationType: 'system_integration',
          parallelExecution: true,
          estimatedHours: 1.0,
          systemSetup: [
            'accounting_software_setup',
            'tax_software_configuration',
            'client_database_entry',
            'billing_system_setup',
            'document_management_setup',
            'communication_preferences',
            'team_notifications'
          ],
          integrations: [
            'quickbooks_integration',
            'tax_software_sync',
            'crm_integration',
            'billing_automation',
            'calendar_scheduling'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'document_review', targetStepId: 'system_setup' },
          { id: 'in2', sourceStepId: 'client_clarification', targetStepId: 'system_setup' }
        ],
        outputs: [{ id: 'out1', sourceStepId: 'system_setup', targetStepId: 'onboarding_completion', label: 'systems_ready' }]
      },
      {
        id: 'escalation_review',
        type: 'task',
        name: 'Escalation Review',
        description: 'Manager review for problematic onboarding cases',
        position: { x: 1100, y: 500 },
        configuration: {
          taskType: 'escalation',
          estimatedHours: 0.5,
          escalationTriggers: [
            'document_delays',
            'client_unresponsiveness',
            'complex_requirements',
            'resource_constraints'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'follow_up_coordination', targetStepId: 'escalation_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'escalation_review', targetStepId: 'system_setup', label: 'resolved' },
          { id: 'out2', sourceStepId: 'escalation_review', targetStepId: 'decline_engagement', label: 'terminate' }
        ],
        assignee: { type: 'role', value: 'client_services_manager' }
      },
      {
        id: 'onboarding_completion',
        type: 'automation',
        name: 'Onboarding Completion & Handoff',
        description: 'Complete onboarding process and handoff to service team',
        position: { x: 1700, y: 200 },
        configuration: {
          automationType: 'completion_handoff',
          estimatedHours: 0.5,
          completionTasks: [
            'onboarding_summary_report',
            'service_team_handoff',
            'client_satisfaction_survey',
            'success_metrics_recording',
            'next_steps_scheduling',
            'welcome_gift_processing'
          ],
          handoffDocuments: [
            'client_profile_summary',
            'service_requirements',
            'key_contacts',
            'important_dates',
            'special_considerations'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'system_setup', targetStepId: 'onboarding_completion' },
          { id: 'in2', sourceStepId: 'escalation_review', targetStepId: 'onboarding_completion' }
        ],
        outputs: [{ id: 'out1', sourceStepId: 'onboarding_completion', targetStepId: 'end', label: 'complete' }]
      },
      {
        id: 'decline_engagement',
        type: 'automation',
        name: 'Decline Engagement Process',
        description: 'Professionally decline engagement and maintain relationship',
        position: { x: 300, y: 500 },
        configuration: {
          automationType: 'engagement_decline',
          estimatedHours: 0.5,
          declineProcess: [
            'professional_decline_letter',
            'referral_recommendations',
            'relationship_maintenance',
            'future_opportunity_tracking'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'lead_qualification', targetStepId: 'decline_engagement' },
          { id: 'in2', sourceStepId: 'manager_review', targetStepId: 'decline_engagement' },
          { id: 'in3', sourceStepId: 'escalation_review', targetStepId: 'decline_engagement' }
        ],
        outputs: [{ id: 'out1', sourceStepId: 'decline_engagement', targetStepId: 'end', label: 'declined' }]
      },
      {
        id: 'end',
        type: 'end',
        name: 'Onboarding Process Complete',
        description: 'Client onboarding process completed',
        position: { x: 1900, y: 200 },
        configuration: {
          completionActions: [
            'metrics_recording',
            'process_improvement_feedback',
            'team_notifications',
            'client_success_handoff'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'onboarding_completion', targetStepId: 'end' },
          { id: 'in2', sourceStepId: 'decline_engagement', targetStepId: 'end' }
        ],
        outputs: []
      }
    ],
    connections: [
      { id: 'c1', sourceStepId: 'start', targetStepId: 'lead_qualification', label: 'initiate' },
      { id: 'c2', sourceStepId: 'lead_qualification', targetStepId: 'engagement_setup', label: 'qualified' },
      { id: 'c3', sourceStepId: 'lead_qualification', targetStepId: 'manager_review', label: 'review_needed' },
      { id: 'c4', sourceStepId: 'lead_qualification', targetStepId: 'decline_engagement', label: 'declined' },
      { id: 'c5', sourceStepId: 'manager_review', targetStepId: 'engagement_setup', label: 'approved' },
      { id: 'c6', sourceStepId: 'manager_review', targetStepId: 'decline_engagement', label: 'declined' },
      { id: 'c7', sourceStepId: 'engagement_setup', targetStepId: 'document_collection_setup', label: 'setup_complete' },
      { id: 'c8', sourceStepId: 'document_collection_setup', targetStepId: 'client_communication', label: 'portal_ready' },
      { id: 'c9', sourceStepId: 'client_communication', targetStepId: 'document_collection', label: 'communications_sent' },
      { id: 'c10', sourceStepId: 'document_collection', targetStepId: 'document_review', label: 'documents_received' },
      { id: 'c11', sourceStepId: 'document_collection', targetStepId: 'follow_up_coordination', label: 'incomplete' },
      { id: 'c12', sourceStepId: 'follow_up_coordination', targetStepId: 'document_review', label: 'complete' },
      { id: 'c13', sourceStepId: 'follow_up_coordination', targetStepId: 'escalation_review', label: 'escalate' },
      { id: 'c14', sourceStepId: 'document_review', targetStepId: 'system_setup', label: 'approved' },
      { id: 'c15', sourceStepId: 'document_review', targetStepId: 'client_clarification', label: 'clarification' },
      { id: 'c16', sourceStepId: 'client_clarification', targetStepId: 'system_setup', label: 'clarified' },
      { id: 'c17', sourceStepId: 'system_setup', targetStepId: 'onboarding_completion', label: 'systems_ready' },
      { id: 'c18', sourceStepId: 'escalation_review', targetStepId: 'system_setup', label: 'resolved' },
      { id: 'c19', sourceStepId: 'escalation_review', targetStepId: 'decline_engagement', label: 'terminate' },
      { id: 'c20', sourceStepId: 'onboarding_completion', targetStepId: 'end', label: 'complete' },
      { id: 'c21', sourceStepId: 'decline_engagement', targetStepId: 'end', label: 'declined' }
    ],
    variables: [
      { name: 'prospect_id', type: 'string', value: '', scope: 'global', isRequired: true, description: 'Prospect identifier' },
      { name: 'business_type', type: 'string', value: '', scope: 'global', isRequired: true, description: 'Type of business' },
      { name: 'revenue_size', type: 'string', value: '', scope: 'global', isRequired: true, description: 'Annual revenue size' },
      { name: 'service_tier', type: 'string', value: 'basic', scope: 'global', isRequired: true, description: 'Service tier selected' },
      { name: 'risk_level', type: 'string', value: 'low', scope: 'global', isRequired: false, description: 'Assessed risk level' },
      { name: 'start_date', type: 'date', value: '', scope: 'global', isRequired: true, description: 'Service start date' }
    ],
    triggers: [
      { id: 't1', type: 'manual', name: 'Manual Start', configuration: { allowedRoles: ['business_development', 'manager'] }, isActive: true },
      { id: 't2', type: 'event', name: 'Lead Captured', configuration: { eventType: 'lead_captured' }, isActive: true },
      { id: 't3', type: 'event', name: 'Proposal Accepted', configuration: { eventType: 'proposal_accepted' }, isActive: true }
    ],
    settings: {
      allowParallelExecution: true,
      maxConcurrentInstances: 10,
      autoAssignment: true,
      notificationSettings: {
        onStart: true,
        onComplete: true,
        onError: true,
        onOverdue: true
      },
      retrySettings: {
        enabled: true,
        maxRetries: 2,
        retryDelay: 1800 // 30 minutes
      },
      escalationSettings: {
        enabled: true,
        escalationLevels: [
          { level: 1, delay: 12, assignTo: 'senior_coordinator', action: 'notify' },
          { level: 2, delay: 24, assignTo: 'client_services_manager', action: 'reassign' }
        ]
      }
    }
  }
];

// Workflow performance analytics
export interface WorkflowAnalytics {
  workflowId: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  actualDuration: number; // in hours
  estimatedDuration: number; // in hours
  efficiency: number; // percentage
  bottlenecks: {
    stepId: string;
    stepName: string;
    expectedDuration: number;
    actualDuration: number;
    delayReason: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  resourceUtilization: {
    assigneeId: string;
    assigneeName: string;
    hoursWorked: number;
    utilizationRate: number;
  }[];
  qualityMetrics: {
    errorCount: number;
    reworkSteps: string[];
    clientSatisfaction: number;
    complianceScore: number;
  };
  costAnalysis: {
    laborCost: number;
    technologyCost: number;
    overheadCost: number;
    totalCost: number;
    budgetVariance: number;
  };
}

// Workload balancing algorithm
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  currentWorkload: number; // hours
  maxCapacity: number; // hours per week
  efficiency: number; // 0-1 scale
  hourlyRate: number;
  specializations: string[];
  certifications: string[];
}

export class WorkloadBalancer {
  static assignOptimalResource(
    taskRequirements: {
      skillsRequired: string[];
      estimatedHours: number;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      deadline: Date;
      complexity: 'low' | 'medium' | 'high';
    },
    availableTeam: TeamMember[]
  ): TeamMember | null {

    // Filter team members by required skills
    const qualifiedMembers = availableTeam.filter(member =>
      taskRequirements.skillsRequired.every(skill =>
        member.skills.includes(skill) || member.specializations.includes(skill)
      )
    );

    if (qualifiedMembers.length === 0) {
      return null;
    }

    // Score each qualified member
    const scoredMembers = qualifiedMembers.map(member => {
      const capacityUtilization = member.currentWorkload / member.maxCapacity;
      const skillMatch = this.calculateSkillMatch(member, taskRequirements.skillsRequired);
      const efficiencyScore = member.efficiency;
      const costEfficiency = 1 / (member.hourlyRate / 100); // Normalize hourly rate

      // Calculate composite score
      const score = (
        (1 - capacityUtilization) * 0.3 + // 30% weight for availability
        skillMatch * 0.3 + // 30% weight for skill match
        efficiencyScore * 0.25 + // 25% weight for efficiency
        costEfficiency * 0.15 // 15% weight for cost efficiency
      );

      return { member, score };
    });

    // Sort by score and return the best match
    scoredMembers.sort((a, b) => b.score - a.score);
    return scoredMembers[0].member;
  }

  private static calculateSkillMatch(member: TeamMember, requiredSkills: string[]): number {
    const matchedSkills = requiredSkills.filter(skill =>
      member.skills.includes(skill) || member.specializations.includes(skill)
    );
    return matchedSkills.length / requiredSkills.length;
  }

  static predictWorkflowDuration(
    workflowTemplate: WorkflowTemplate,
    assignedTeam: TeamMember[],
    clientComplexity: 'simple' | 'moderate' | 'complex'
  ): { estimatedHours: number; confidenceLevel: number } {

    const complexityMultiplier = {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.4
    };

    const baseEstimate = workflowTemplate.estimatedDuration || 0;
    const adjustedEstimate = baseEstimate * complexityMultiplier[clientComplexity];

    // Factor in team efficiency
    const avgTeamEfficiency = assignedTeam.reduce((acc, member) => acc + member.efficiency, 0) / assignedTeam.length;
    const finalEstimate = adjustedEstimate / avgTeamEfficiency;

    // Calculate confidence level based on team experience and workflow complexity
    const confidenceLevel = Math.min(0.95, avgTeamEfficiency * 0.9 + 0.1);

    return {
      estimatedHours: Math.round(finalEstimate * 10) / 10,
      confidenceLevel: Math.round(confidenceLevel * 100) / 100
    };
  }
}

// Export everything
export {
  CPAWorkflowConfig,
  WorkflowAnalytics,
  TeamMember,
  WorkloadBalancer
};