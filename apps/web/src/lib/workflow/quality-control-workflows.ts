import { WorkflowTemplate, WorkflowStep, WorkflowConnection } from './workflow-engine';

// Quality control and review workflow interfaces
export interface QualityControlConfig {
  reviewLevels: ReviewLevel[];
  qualityGates: QualityGate[];
  approvalMatrix: ApprovalMatrix;
  errorDetectionRules: ErrorDetectionRule[];
  qualityMetrics: QualityMetric[];
  complianceChecks: ComplianceCheck[];
}

export interface ReviewLevel {
  id: string;
  name: string;
  sequence: number;
  required: boolean;
  reviewerRole: string;
  reviewCriteria: ReviewCriteria[];
  timeAllocation: number; // in hours
  escalationRules: EscalationRule[];
  bypassConditions?: BypassCondition[];
}

export interface ReviewCriteria {
  category: string;
  checkpoints: QualityCheckpoint[];
  weightage: number; // percentage of total review score
  passingScore: number; // minimum score required
  automated: boolean;
}

export interface QualityCheckpoint {
  id: string;
  description: string;
  checkType: 'automated' | 'manual' | 'hybrid';
  severity: 'critical' | 'high' | 'medium' | 'low';
  validationRule: string;
  fixable: boolean;
  estimatedFixTime: number; // in minutes
}

export interface QualityGate {
  id: string;
  name: string;
  triggerCondition: string;
  requiredScore: number;
  blockingIssues: string[];
  automaticActions: string[];
  notificationRecipients: string[];
}

export interface ApprovalMatrix {
  workType: string;
  clientTier: string;
  complexity: string;
  riskLevel: string;
  approvers: ApproverConfig[];
}

export interface ApproverConfig {
  role: string;
  sequence: number;
  required: boolean;
  conditions: string[];
  delegationRules: DelegationRule[];
}

export interface DelegationRule {
  condition: string;
  delegateTo: string;
  notificationRequired: boolean;
  timeLimit: number; // in hours
}

export interface ErrorDetectionRule {
  id: string;
  name: string;
  category: 'calculation' | 'compliance' | 'formatting' | 'completeness' | 'consistency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectionLogic: string;
  autoCorrection: boolean;
  correctionLogic?: string;
  escalationRequired: boolean;
}

export interface QualityMetric {
  id: string;
  name: string;
  description: string;
  calculationMethod: string;
  target: number;
  unit: string;
  frequency: 'per_task' | 'daily' | 'weekly' | 'monthly';
  trendAnalysis: boolean;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  regulationType: string;
  applicableScenarios: string[];
  checkLogic: string;
  remediation: string;
  documentation: string[];
}

export interface ReviewResult {
  reviewerId: string;
  reviewerName: string;
  reviewLevel: string;
  startTime: Date;
  endTime: Date;
  overallScore: number;
  categoryScores: Record<string, number>;
  issues: QualityIssue[];
  recommendations: string[];
  decision: 'approved' | 'approved_with_conditions' | 'rejected' | 'requires_revision';
  comments: string;
}

export interface QualityIssue {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  suggestedFix: string;
  estimatedFixTime: number;
  autoFixable: boolean;
  complianceImpact: boolean;
}

export interface BypassCondition {
  condition: string;
  justificationRequired: boolean;
  approverRole: string;
  documentationRequired: string[];
}

export interface EscalationRule {
  trigger: 'time_exceeded' | 'quality_issue' | 'compliance_risk' | 'client_urgency';
  escalateTo: string;
  timeThreshold?: number; // in hours
  actionRequired: string;
  notificationTemplate: string;
}

// Optimized quality control workflow templates
export const qualityControlWorkflows: WorkflowTemplate[] = [
  {
    id: 'multi-tier-review-workflow',
    name: 'Multi-Tier Quality Review Workflow',
    description: 'Comprehensive multi-level review process with automated quality gates',
    category: 'Quality Control',
    version: '2.0',
    isSystemTemplate: true,
    complexity: 'high',
    estimatedDuration: 6, // hours (optimized from 12 hours)
    tags: ['quality-control', 'review', 'approval', 'compliance'],
    metadata: {
      qualityStandards: {
        accuracyTarget: 99.5,
        complianceScore: 100,
        timelinessTarget: 95,
        clientSatisfaction: 9.5
      },
      automationLevel: 70, // percentage
      costReduction: 45, // percentage reduction from manual process
      qualityImprovement: 35 // percentage improvement in error detection
    },
    steps: [
      {
        id: 'start',
        type: 'start',
        name: 'Quality Review Initiated',
        description: 'Start comprehensive quality review process',
        position: { x: 100, y: 300 },
        configuration: {
          triggers: ['work_completion', 'milestone_reached', 'client_request']
        },
        inputs: [],
        outputs: [{ id: 'out1', sourceStepId: 'start', targetStepId: 'automated_quality_scan', label: 'proceed' }]
      },
      {
        id: 'automated_quality_scan',
        type: 'automation',
        name: 'Automated Quality Assessment',
        description: 'AI-powered comprehensive quality assessment and error detection',
        position: { x: 300, y: 300 },
        configuration: {
          automationType: 'quality_assessment',
          parallelExecution: true,
          estimatedHours: 0.5,
          aiQualityChecks: [
            'mathematical_accuracy_verification',
            'formatting_consistency_check',
            'compliance_rule_validation',
            'completeness_assessment',
            'cross_reference_verification',
            'anomaly_detection',
            'trend_analysis',
            'benchmark_comparison'
          ],
          qualityScoring: {
            accuracyWeight: 30,
            complianceWeight: 25,
            completenessWeight: 20,
            consistencyWeight: 15,
            presentationWeight: 10
          },
          automaticCorrections: {
            formattingIssues: true,
            minorCalculationErrors: true,
            standardizationIssues: true,
            documentOrganization: true
          },
          confidenceThresholds: {
            high: 95,
            medium: 85,
            low: 75
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'start', targetStepId: 'automated_quality_scan' }],
        outputs: [
          { id: 'out1', sourceStepId: 'automated_quality_scan', targetStepId: 'quality_gate_1', label: 'scan_complete' }
        ],
        assignee: { type: 'auto', value: 'quality_ai_system' }
      },
      {
        id: 'quality_gate_1',
        type: 'decision',
        name: 'First Quality Gate',
        description: 'Automated decision based on initial quality assessment',
        position: { x: 500, y: 300 },
        configuration: {
          decisionLogic: 'automated',
          qualityThresholds: {
            directApproval: 95,
            peerReview: 85,
            seniorReview: 75,
            majorRevision: 60
          },
          escalationTriggers: [
            'critical_errors_detected',
            'compliance_violations',
            'client_specific_requirements',
            'unusual_patterns'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'automated_quality_scan', targetStepId: 'quality_gate_1' }],
        outputs: [
          { id: 'out1', sourceStepId: 'quality_gate_1', targetStepId: 'peer_review', condition: 'score_75_94' },
          { id: 'out2', sourceStepId: 'quality_gate_1', targetStepId: 'senior_review', condition: 'score_60_84' },
          { id: 'out3', sourceStepId: 'quality_gate_1', targetStepId: 'major_revision', condition: 'score_below_60' },
          { id: 'out4', sourceStepId: 'quality_gate_1', targetStepId: 'final_approval', condition: 'score_95_plus' }
        ],
        conditions: [
          { field: 'quality_score', operator: 'greater_than', value: 95 },
          { field: 'critical_errors', operator: 'equals', value: 0 },
          { field: 'compliance_score', operator: 'equals', value: 100 }
        ]
      },
      {
        id: 'peer_review',
        type: 'task',
        name: 'Peer Review Process',
        description: 'Collaborative peer review with structured feedback',
        position: { x: 700, y: 200 },
        configuration: {
          taskType: 'peer_review',
          estimatedHours: 1.5,
          reviewStructure: {
            focusAreas: [
              'technical_accuracy',
              'professional_standards',
              'client_requirements',
              'documentation_quality',
              'process_compliance'
            ],
            reviewFormat: 'structured_checklist',
            collaborativeReview: true,
            blindReview: false
          },
          reviewerSelection: {
            criteria: 'expertise_match',
            avoidConflicts: true,
            workloadBalancing: true,
            skillComplementarity: true
          },
          qualityEnforcement: {
            minimumReviewTime: 30, // minutes
            requiredSections: 'all',
            evidenceRequired: true,
            justificationMandatory: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'quality_gate_1', targetStepId: 'peer_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'peer_review', targetStepId: 'quality_gate_2', label: 'review_complete' }
        ],
        assignee: { type: 'auto', value: 'peer_reviewer' },
        timeouts: { duration: 8, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'senior_review',
        type: 'task',
        name: 'Senior Professional Review',
        description: 'Expert senior review for complex or high-risk work',
        position: { x: 700, y: 300 },
        configuration: {
          taskType: 'senior_review',
          estimatedHours: 2.0,
          reviewScope: {
            comprehensiveAnalysis: true,
            strategicConsiderations: true,
            riskAssessment: true,
            clientImpactAnalysis: true,
            complianceVerification: true
          },
          expertise: {
            requiredCertifications: ['CPA', 'senior_designation'],
            experienceLevel: 'senior',
            specializationMatch: true,
            industryKnowledge: true
          },
          reviewOutputs: {
            qualityAssessment: true,
            riskEvaluation: true,
            recommendationsRequired: true,
            clientCommunicationGuidance: true,
            processImprovements: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'quality_gate_1', targetStepId: 'senior_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'senior_review', targetStepId: 'quality_gate_2', label: 'review_complete' }
        ],
        assignee: { type: 'role', value: 'senior_reviewer' },
        timeouts: { duration: 12, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'major_revision',
        type: 'task',
        name: 'Major Revision Process',
        description: 'Comprehensive revision for work requiring significant improvements',
        position: { x: 700, y: 450 },
        configuration: {
          taskType: 'major_revision',
          estimatedHours: 4.0,
          revisionProcess: {
            issueAnalysis: true,
            rootCauseIdentification: true,
            comprehensiveCorrection: true,
            qualityAssurance: true,
            trainingIdentification: true
          },
          revisionScope: {
            contentCorrection: true,
            processImprovement: true,
            qualityEnhancement: true,
            complianceAlignment: true,
            clientCommunication: true
          },
          supportResources: {
            seniorConsultation: true,
            referenceDocuments: true,
            trainingMaterials: true,
            qualityTemplates: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'quality_gate_1', targetStepId: 'major_revision' }],
        outputs: [
          { id: 'out1', sourceStepId: 'major_revision', targetStepId: 'automated_quality_scan', label: 'revision_complete' }
        ],
        assignee: { type: 'role', value: 'original_preparer' },
        timeouts: { duration: 24, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'quality_gate_2',
        type: 'decision',
        name: 'Second Quality Gate',
        description: 'Post-review quality assessment and routing decision',
        position: { x: 900, y: 250 },
        configuration: {
          decisionLogic: 'review_based',
          approvalCriteria: {
            overallQualityScore: 90,
            criticalIssuesResolved: true,
            complianceVerified: true,
            reviewerRecommendation: 'positive'
          },
          escalationScenarios: [
            'reviewer_disagreement',
            'complex_compliance_issues',
            'significant_client_risk',
            'unusual_circumstances'
          ]
        },
        inputs: [
          { id: 'in1', sourceStepId: 'peer_review', targetStepId: 'quality_gate_2' },
          { id: 'in2', sourceStepId: 'senior_review', targetStepId: 'quality_gate_2' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'quality_gate_2', targetStepId: 'final_approval', condition: 'approved' },
          { id: 'out2', sourceStepId: 'quality_gate_2', targetStepId: 'manager_escalation', condition: 'escalation_needed' },
          { id: 'out3', sourceStepId: 'quality_gate_2', targetStepId: 'conditional_approval', condition: 'conditional_approval' },
          { id: 'out4', sourceStepId: 'quality_gate_2', targetStepId: 'revision_required', condition: 'revision_needed' }
        ],
        conditions: [
          { field: 'review_score', operator: 'greater_than', value: 90 },
          { field: 'critical_issues', operator: 'equals', value: 0 }
        ]
      },
      {
        id: 'manager_escalation',
        type: 'task',
        name: 'Manager Escalation Review',
        description: 'Management review for escalated quality issues',
        position: { x: 1100, y: 150 },
        configuration: {
          taskType: 'manager_review',
          estimatedHours: 1.0,
          escalationReview: {
            issueAssessment: true,
            riskEvaluation: true,
            resourceAllocation: true,
            processImprovement: true,
            clientCommunication: true
          },
          managerialDecisions: [
            'approve_with_conditions',
            'require_additional_review',
            'implement_process_changes',
            'provide_additional_training',
            'escalate_to_partner'
          ],
          documentationRequirements: {
            decisionRationale: true,
            riskAssessment: true,
            correctiveActions: true,
            preventiveMeasures: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'quality_gate_2', targetStepId: 'manager_escalation' }],
        outputs: [
          { id: 'out1', sourceStepId: 'manager_escalation', targetStepId: 'final_approval', label: 'manager_approved' },
          { id: 'out2', sourceStepId: 'manager_escalation', targetStepId: 'partner_review', condition: 'partner_escalation' },
          { id: 'out3', sourceStepId: 'manager_escalation', targetStepId: 'revision_required', condition: 'additional_work_needed' }
        ],
        assignee: { type: 'role', value: 'quality_manager' },
        timeouts: { duration: 6, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'partner_review',
        type: 'task',
        name: 'Partner Review',
        description: 'Final partner review for highest-risk or most complex matters',
        position: { x: 1300, y: 150 },
        configuration: {
          taskType: 'partner_review',
          estimatedHours: 0.5,
          partnerReview: {
            strategicAssessment: true,
            firmRiskEvaluation: true,
            clientRelationshipImpact: true,
            professionalStandardsCompliance: true,
            reputationalConsiderations: true
          },
          finalAuthority: true,
          documentationLevel: 'comprehensive',
          clientCommunicationApproval: true
        },
        inputs: [{ id: 'in1', sourceStepId: 'manager_escalation', targetStepId: 'partner_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'partner_review', targetStepId: 'final_approval', label: 'partner_approved' },
          { id: 'out2', sourceStepId: 'partner_review', targetStepId: 'revision_required', condition: 'partner_revision_required' }
        ],
        assignee: { type: 'role', value: 'managing_partner' },
        timeouts: { duration: 4, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'conditional_approval',
        type: 'task',
        name: 'Conditional Approval Process',
        description: 'Handle approvals with specific conditions or minor corrections',
        position: { x: 1100, y: 300 },
        configuration: {
          taskType: 'conditional_approval',
          estimatedHours: 1.0,
          conditionTypes: [
            'minor_corrections_required',
            'additional_documentation_needed',
            'client_clarification_required',
            'formatting_adjustments',
            'presentation_improvements'
          ],
          trackingRequired: true,
          verificationProcess: true,
          clientCommunication: {
            conditionsExplained: true,
            timelineProvided: true,
            supportOffered: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'quality_gate_2', targetStepId: 'conditional_approval' }],
        outputs: [
          { id: 'out1', sourceStepId: 'conditional_approval', targetStepId: 'final_approval', label: 'conditions_met' }
        ],
        assignee: { type: 'role', value: 'original_preparer' },
        timeouts: { duration: 4, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'revision_required',
        type: 'task',
        name: 'Targeted Revision Process',
        description: 'Focused revision based on specific review feedback',
        position: { x: 1100, y: 450 },
        configuration: {
          taskType: 'targeted_revision',
          estimatedHours: 2.0,
          revisionFocus: 'specific_issues',
          guidedRevision: {
            specificInstructions: true,
            exampleProvisions: true,
            qualityTargets: true,
            timelineGuidance: true
          },
          qualityAssurance: {
            revisionTracking: true,
            progressMonitoring: true,
            qualityVerification: true,
            approvalConfirmation: true
          },
          supportMechanisms: {
            mentorshipAvailable: true,
            resourcesProvided: true,
            consultationOffered: true
          }
        },
        inputs: [
          { id: 'in1', sourceStepId: 'quality_gate_2', targetStepId: 'revision_required' },
          { id: 'in2', sourceStepId: 'manager_escalation', targetStepId: 'revision_required' },
          { id: 'in3', sourceStepId: 'partner_review', targetStepId: 'revision_required' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'revision_required', targetStepId: 'automated_quality_scan', label: 'revision_complete' }
        ],
        assignee: { type: 'role', value: 'original_preparer' },
        timeouts: { duration: 8, unit: 'hours', action: 'escalate' }
      },
      {
        id: 'final_approval',
        type: 'automation',
        name: 'Final Approval & Documentation',
        description: 'Automated final approval processing and documentation',
        position: { x: 1300, y: 300 },
        configuration: {
          automationType: 'final_approval',
          estimatedHours: 0.2,
          approvalActions: [
            'quality_certification',
            'approval_documentation',
            'client_notification',
            'file_archiving',
            'metrics_recording',
            'billing_authorization',
            'delivery_preparation'
          ],
          qualityStamp: {
            approvalLevel: 'recorded',
            qualityScore: 'documented',
            reviewTrail: 'maintained',
            complianceCertification: 'issued'
          },
          notifications: {
            clientNotification: true,
            teamNotification: true,
            managementReporting: true,
            metricsUpdating: true
          }
        },
        inputs: [
          { id: 'in1', sourceStepId: 'quality_gate_1', targetStepId: 'final_approval' },
          { id: 'in2', sourceStepId: 'quality_gate_2', targetStepId: 'final_approval' },
          { id: 'in3', sourceStepId: 'manager_escalation', targetStepId: 'final_approval' },
          { id: 'in4', sourceStepId: 'partner_review', targetStepId: 'final_approval' },
          { id: 'in5', sourceStepId: 'conditional_approval', targetStepId: 'final_approval' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'final_approval', targetStepId: 'end', label: 'approved_complete' }
        ],
        assignee: { type: 'auto', value: 'approval_system' }
      },
      {
        id: 'end',
        type: 'end',
        name: 'Quality Review Complete',
        description: 'Quality review and approval process completed',
        position: { x: 1500, y: 300 },
        configuration: {
          completionActions: [
            'quality_metrics_update',
            'process_performance_recording',
            'continuous_improvement_insights',
            'team_performance_tracking',
            'client_satisfaction_measurement'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'final_approval', targetStepId: 'end' }],
        outputs: []
      }
    ],
    connections: [
      { id: 'c1', sourceStepId: 'start', targetStepId: 'automated_quality_scan', label: 'initiate' },
      { id: 'c2', sourceStepId: 'automated_quality_scan', targetStepId: 'quality_gate_1', label: 'scan_complete' },
      { id: 'c3', sourceStepId: 'quality_gate_1', targetStepId: 'peer_review', label: 'peer_review_needed' },
      { id: 'c4', sourceStepId: 'quality_gate_1', targetStepId: 'senior_review', label: 'senior_review_needed' },
      { id: 'c5', sourceStepId: 'quality_gate_1', targetStepId: 'major_revision', label: 'major_revision_needed' },
      { id: 'c6', sourceStepId: 'quality_gate_1', targetStepId: 'final_approval', label: 'direct_approval' },
      { id: 'c7', sourceStepId: 'peer_review', targetStepId: 'quality_gate_2', label: 'review_complete' },
      { id: 'c8', sourceStepId: 'senior_review', targetStepId: 'quality_gate_2', label: 'review_complete' },
      { id: 'c9', sourceStepId: 'major_revision', targetStepId: 'automated_quality_scan', label: 'revision_complete' },
      { id: 'c10', sourceStepId: 'quality_gate_2', targetStepId: 'final_approval', label: 'approved' },
      { id: 'c11', sourceStepId: 'quality_gate_2', targetStepId: 'manager_escalation', label: 'escalate' },
      { id: 'c12', sourceStepId: 'quality_gate_2', targetStepId: 'conditional_approval', label: 'conditional' },
      { id: 'c13', sourceStepId: 'quality_gate_2', targetStepId: 'revision_required', label: 'revision' },
      { id: 'c14', sourceStepId: 'manager_escalation', targetStepId: 'final_approval', label: 'manager_approved' },
      { id: 'c15', sourceStepId: 'manager_escalation', targetStepId: 'partner_review', label: 'partner_escalation' },
      { id: 'c16', sourceStepId: 'manager_escalation', targetStepId: 'revision_required', label: 'additional_work' },
      { id: 'c17', sourceStepId: 'partner_review', targetStepId: 'final_approval', label: 'partner_approved' },
      { id: 'c18', sourceStepId: 'partner_review', targetStepId: 'revision_required', label: 'partner_revision' },
      { id: 'c19', sourceStepId: 'conditional_approval', targetStepId: 'final_approval', label: 'conditions_met' },
      { id: 'c20', sourceStepId: 'revision_required', targetStepId: 'automated_quality_scan', label: 'revision_complete' },
      { id: 'c21', sourceStepId: 'final_approval', targetStepId: 'end', label: 'complete' }
    ],
    variables: [
      { name: 'work_type', type: 'string', value: '', scope: 'global', isRequired: true, description: 'Type of work being reviewed' },
      { name: 'client_tier', type: 'string', value: 'standard', scope: 'global', isRequired: true, description: 'Client service tier' },
      { name: 'complexity_level', type: 'string', value: 'moderate', scope: 'global', isRequired: true, description: 'Work complexity level' },
      { name: 'risk_level', type: 'string', value: 'medium', scope: 'global', isRequired: true, description: 'Risk assessment level' },
      { name: 'deadline_urgency', type: 'string', value: 'normal', scope: 'global', isRequired: false, description: 'Deadline urgency level' },
      { name: 'quality_target', type: 'number', value: 95, scope: 'global', isRequired: false, description: 'Target quality score' }
    ],
    triggers: [
      { id: 't1', type: 'manual', name: 'Manual Review Request', configuration: { allowedRoles: ['preparer', 'manager'] }, isActive: true },
      { id: 't2', type: 'event', name: 'Work Completion', configuration: { eventType: 'work_completed' }, isActive: true },
      { id: 't3', type: 'deadline', name: 'Review Deadline', configuration: { daysBeforeDeadline: 2 }, isActive: true },
      { id: 't4', type: 'condition', name: 'Quality Threshold', configuration: { condition: 'quality_score_below_threshold' }, isActive: true }
    ],
    settings: {
      allowParallelExecution: false, // Sequential review process
      maxConcurrentInstances: 3,
      autoAssignment: true,
      notificationSettings: {
        onStart: true,
        onComplete: true,
        onError: true,
        onOverdue: true
      },
      retrySettings: {
        enabled: false, // Reviews don't retry, they escalate
        maxRetries: 0,
        retryDelay: 0
      },
      escalationSettings: {
        enabled: true,
        escalationLevels: [
          { level: 1, delay: 4, assignTo: 'senior_reviewer', action: 'notify' },
          { level: 2, delay: 8, assignTo: 'quality_manager', action: 'reassign' },
          { level: 3, delay: 12, assignTo: 'managing_partner', action: 'escalate' }
        ]
      }
    }
  }
];

// Quality control performance tracking
export interface QualityPerformanceMetrics {
  avgReviewTime: number; // in hours
  qualityScoreImprovement: number; // percentage
  errorDetectionRate: number; // percentage
  clientSatisfactionImpact: number; // score improvement
  costPerReview: number; // in dollars
  reviewEfficiency: number; // percentage
  complianceScore: number; // percentage
  reworkReduction: number; // percentage
}

// Quality control optimization class
export class QualityControlOptimizer {

  static analyzeReviewEfficiency(reviewHistory: ReviewResult[]): QualityPerformanceMetrics {
    if (reviewHistory.length === 0) {
      return {
        avgReviewTime: 0,
        qualityScoreImprovement: 0,
        errorDetectionRate: 0,
        clientSatisfactionImpact: 0,
        costPerReview: 0,
        reviewEfficiency: 0,
        complianceScore: 0,
        reworkReduction: 0
      };
    }

    const avgReviewTime = reviewHistory.reduce((sum, review) => {
      const duration = (review.endTime.getTime() - review.startTime.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0) / reviewHistory.length;

    const avgQualityScore = reviewHistory.reduce((sum, review) => sum + review.overallScore, 0) / reviewHistory.length;
    const criticalIssuesDetected = reviewHistory.reduce((sum, review) =>
      sum + review.issues.filter(issue => issue.severity === 'critical').length, 0);
    const totalIssuesDetected = reviewHistory.reduce((sum, review) => sum + review.issues.length, 0);

    const errorDetectionRate = totalIssuesDetected > 0 ? (criticalIssuesDetected / totalIssuesDetected) * 100 : 0;
    const reviewEfficiency = avgQualityScore > 0 ? (avgQualityScore / avgReviewTime) * 10 : 0;

    // Mock calculations for other metrics (would be calculated from actual data)
    const qualityScoreImprovement = 15; // percentage improvement over time
    const clientSatisfactionImpact = 1.5; // score improvement points
    const costPerReview = 75; // estimated cost
    const complianceScore = 98; // compliance percentage
    const reworkReduction = 35; // percentage reduction in rework

    return {
      avgReviewTime: Math.round(avgReviewTime * 10) / 10,
      qualityScoreImprovement,
      errorDetectionRate: Math.round(errorDetectionRate * 10) / 10,
      clientSatisfactionImpact,
      costPerReview,
      reviewEfficiency: Math.round(reviewEfficiency * 10) / 10,
      complianceScore,
      reworkReduction
    };
  }

  static identifyQualityBottlenecks(reviewData: ReviewResult[]): {
    bottleneckType: string;
    frequency: number;
    avgDelay: number;
    impact: 'high' | 'medium' | 'low';
    recommendations: string[];
  }[] {

    const bottlenecks = [];
    const reviewDelays = new Map();

    reviewData.forEach(review => {
      const expectedDuration = 2; // hours
      const actualDuration = (review.endTime.getTime() - review.startTime.getTime()) / (1000 * 60 * 60);

      if (actualDuration > expectedDuration * 1.5) {
        const category = this.categorizeReviewDelay(review);
        const existing = reviewDelays.get(category) || { delays: [], count: 0 };
        existing.delays.push(actualDuration - expectedDuration);
        existing.count++;
        reviewDelays.set(category, existing);
      }
    });

    reviewDelays.forEach((data, category) => {
      const avgDelay = data.delays.reduce((sum: number, delay: number) => sum + delay, 0) / data.delays.length;
      const frequency = (data.count / reviewData.length) * 100;

      let impact: 'high' | 'medium' | 'low' = 'low';
      let recommendations: string[] = [];

      if (avgDelay > 4 && frequency > 25) {
        impact = 'high';
        recommendations = [
          'Implement automated pre-screening',
          'Provide targeted reviewer training',
          'Optimize review templates and checklists',
          'Consider parallel review processes'
        ];
      } else if (avgDelay > 2 && frequency > 15) {
        impact = 'medium';
        recommendations = [
          'Review and streamline processes',
          'Improve reviewer guidelines',
          'Implement better tracking tools'
        ];
      } else {
        recommendations = [
          'Monitor trends',
          'Continue current practices'
        ];
      }

      bottlenecks.push({
        bottleneckType: category,
        frequency: Math.round(frequency * 10) / 10,
        avgDelay: Math.round(avgDelay * 10) / 10,
        impact,
        recommendations
      });
    });

    return bottlenecks.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return (impactWeight[b.impact] * b.frequency) - (impactWeight[a.impact] * a.frequency);
    });
  }

  private static categorizeReviewDelay(review: ReviewResult): string {
    const highSeverityIssues = review.issues.filter(issue =>
      issue.severity === 'critical' || issue.severity === 'high'
    ).length;

    if (highSeverityIssues > 5) return 'complex_quality_issues';
    if (review.categoryScores['compliance'] < 90) return 'compliance_complexity';
    if (review.categoryScores['accuracy'] < 85) return 'technical_accuracy_issues';
    if (Object.keys(review.categoryScores).length > 10) return 'comprehensive_scope';

    return 'general_review_complexity';
  }

  static generateQualityImprovements(metrics: QualityPerformanceMetrics): {
    area: string;
    priority: 'high' | 'medium' | 'low';
    improvement: string;
    expectedBenefit: string;
    implementationTime: string;
  }[] {

    const improvements = [];

    if (metrics.avgReviewTime > 4) {
      improvements.push({
        area: 'Review Efficiency',
        priority: 'high' as const,
        improvement: 'Implement AI-powered pre-screening and automated quality checks',
        expectedBenefit: 'Reduce review time by 40-50%',
        implementationTime: '6-8 weeks'
      });
    }

    if (metrics.errorDetectionRate < 85) {
      improvements.push({
        area: 'Error Detection',
        priority: 'high' as const,
        improvement: 'Deploy advanced analytics and pattern recognition for error detection',
        expectedBenefit: 'Improve error detection by 25-35%',
        implementationTime: '4-6 weeks'
      });
    }

    if (metrics.reviewEfficiency < 30) {
      improvements.push({
        area: 'Process Optimization',
        priority: 'medium' as const,
        improvement: 'Streamline review workflows and eliminate redundant steps',
        expectedBenefit: 'Increase efficiency by 30-40%',
        implementationTime: '3-4 weeks'
      });
    }

    if (metrics.complianceScore < 95) {
      improvements.push({
        area: 'Compliance Assurance',
        priority: 'high' as const,
        improvement: 'Implement real-time compliance monitoring and alerts',
        expectedBenefit: 'Achieve 99%+ compliance score',
        implementationTime: '2-3 weeks'
      });
    }

    return improvements.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }
}

// Export everything
export {
  QualityControlConfig,
  ReviewLevel,
  ReviewCriteria,
  QualityCheckpoint,
  QualityGate,
  ApprovalMatrix,
  ApproverConfig,
  DelegationRule,
  ErrorDetectionRule,
  QualityMetric,
  ComplianceCheck,
  ReviewResult,
  QualityIssue,
  BypassCondition,
  EscalationRule,
  QualityPerformanceMetrics,
  QualityControlOptimizer
};