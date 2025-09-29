import { WorkflowTemplate, WorkflowStep, WorkflowConnection } from './workflow-engine';

// Enhanced document workflow interfaces
export interface DocumentRequest {
  id: string;
  clientId: string;
  workflowId: string;
  requestType: 'initial_collection' | 'follow_up' | 'clarification' | 'year_end' | 'audit_support';
  documentCategories: DocumentCategory[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate: Date;
  status: 'pending' | 'sent' | 'partial' | 'complete' | 'overdue';
  communicationHistory: CommunicationRecord[];
  automationSettings: DocumentAutomationSettings;
  deliveryMethods: DeliveryMethod[];
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  examples: string[];
  acceptedFormats: string[];
  maxFileSize: number; // in MB
  validationRules: ValidationRule[];
  estimatedClientTime: number; // in minutes
  alternativeOptions: string[];
}

export interface ValidationRule {
  type: 'file_format' | 'date_range' | 'amount_range' | 'completeness' | 'authenticity';
  criteria: Record<string, any>;
  errorMessage: string;
  autoCorrection?: boolean;
}

export interface CommunicationRecord {
  id: string;
  timestamp: Date;
  type: 'email' | 'phone' | 'sms' | 'portal_message' | 'video_call' | 'in_person';
  direction: 'outbound' | 'inbound';
  content: string;
  attachments: string[];
  response: boolean;
  effectiveness: number; // 1-10 scale
  nextAction?: string;
}

export interface DocumentAutomationSettings {
  smartReminders: {
    enabled: boolean;
    frequency: 'daily' | 'every_2_days' | 'weekly';
    escalationRules: EscalationRule[];
    personalizedContent: boolean;
  };
  intelligentParsing: {
    enabled: boolean;
    ocrProcessing: boolean;
    dataExtraction: boolean;
    validationChecks: boolean;
  };
  clientPreferences: {
    preferredCommunicationMethod: string;
    bestContactTimes: string[];
    languagePreference: string;
    technicalAssistanceLevel: 'minimal' | 'moderate' | 'high';
  };
}

export interface EscalationRule {
  daysOverdue: number;
  action: 'reminder' | 'phone_call' | 'manager_notification' | 'in_person_meeting';
  assignTo?: string;
  template: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface DeliveryMethod {
  type: 'email' | 'client_portal' | 'physical_mail' | 'secure_link' | 'mobile_app';
  enabled: boolean;
  primary: boolean;
  configuration: Record<string, any>;
}

// Document collection efficiency metrics
export interface DocumentCollectionMetrics {
  averageCollectionTime: number; // in days
  clientResponseRate: number; // percentage
  firstTimeCompleteness: number; // percentage
  documentQualityScore: number; // 1-10
  clientSatisfactionScore: number; // 1-10
  costPerDocumentSet: number; // in dollars
  staffTimePerRequest: number; // in hours
  automationEffectiveness: number; // percentage
}

// Optimized document collection workflow templates
export const documentWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'smart-document-collection',
    name: 'Smart Document Collection Workflow',
    description: 'AI-powered document collection with intelligent reminders and validation',
    category: 'Document Management',
    version: '2.0',
    isSystemTemplate: true,
    complexity: 'medium',
    estimatedDuration: 5, // hours (reduced from 15 through automation)
    tags: ['documents', 'automation', 'ai-powered', 'client-communication'],
    metadata: {
      automationLevel: 85, // percentage
      expectedMetrics: {
        averageCollectionTime: 4.5, // days
        clientResponseRate: 92,
        firstTimeCompleteness: 85,
        documentQualityScore: 9.2,
        clientSatisfactionScore: 9.4,
        costPerDocumentSet: 45,
        staffTimePerRequest: 1.2,
        automationEffectiveness: 88
      } as DocumentCollectionMetrics,
      clientBenefits: [
        'Reduced document preparation time by 60%',
        'Clear, personalized instructions',
        'Mobile-friendly upload portal',
        'Real-time progress tracking',
        'Intelligent document validation'
      ]
    },
    steps: [
      {
        id: 'start',
        type: 'start',
        name: 'Document Collection Initiated',
        description: 'Start document collection workflow',
        position: { x: 100, y: 200 },
        configuration: {
          triggers: ['workflow_start', 'deadline_approaching', 'client_request']
        },
        inputs: [],
        outputs: [{ id: 'out1', sourceStepId: 'start', targetStepId: 'client_analysis', label: 'proceed' }]
      },
      {
        id: 'client_analysis',
        type: 'automation',
        name: 'Client Profile Analysis',
        description: 'Analyze client profile and communication preferences',
        position: { x: 300, y: 200 },
        configuration: {
          automationType: 'client_analysis',
          parallelExecution: true,
          estimatedHours: 0.2,
          analysisFactors: [
            'prior_response_patterns',
            'communication_preferences',
            'technical_comfort_level',
            'business_complexity',
            'submission_history',
            'preferred_contact_times'
          ],
          aiPersonalization: true,
          clientSegmentation: {
            techSavvy: 'digital_first_approach',
            traditional: 'personal_touch_approach',
            busy: 'concise_efficient_approach',
            detailed: 'comprehensive_guidance_approach'
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'start', targetStepId: 'client_analysis' }],
        outputs: [{ id: 'out1', sourceStepId: 'client_analysis', targetStepId: 'request_customization', label: 'analysis_complete' }],
        assignee: { type: 'auto', value: 'ai_assistant' }
      },
      {
        id: 'request_customization',
        type: 'automation',
        name: 'Personalized Request Generation',
        description: 'Generate personalized document request based on client profile',
        position: { x: 500, y: 200 },
        configuration: {
          automationType: 'request_generation',
          estimatedHours: 0.3,
          customizationFeatures: [
            'personalized_instructions',
            'client_specific_examples',
            'preferred_format_suggestions',
            'timeline_optimization',
            'difficulty_appropriate_language',
            'visual_aids_inclusion'
          ],
          templateLibrary: {
            basicBusiness: 'simple_clear_instructions',
            complexBusiness: 'detailed_professional_guidance',
            individualClient: 'friendly_personal_approach',
            firstTimeClient: 'educational_supportive_tone'
          },
          multiLanguageSupport: true,
          accessibilityCompliance: true
        },
        inputs: [{ id: 'in1', sourceStepId: 'client_analysis', targetStepId: 'request_customization' }],
        outputs: [{ id: 'out1', sourceStepId: 'request_customization', targetStepId: 'portal_setup', label: 'request_ready' }],
        assignee: { type: 'auto', value: 'content_generator' }
      },
      {
        id: 'portal_setup',
        type: 'automation',
        name: 'Secure Client Portal Setup',
        description: 'Setup personalized secure portal for document submission',
        position: { x: 700, y: 200 },
        configuration: {
          automationType: 'portal_configuration',
          parallelExecution: true,
          estimatedHours: 0.2,
          portalFeatures: [
            'personalized_dashboard',
            'progress_tracking',
            'document_checklist',
            'drag_drop_upload',
            'mobile_optimization',
            'real_time_validation',
            'chat_support_integration',
            'video_help_tutorials'
          ],
          securityFeatures: [
            'multi_factor_authentication',
            'document_encryption',
            'audit_trail_logging',
            'access_time_limits',
            'ip_restriction_options'
          ],
          userExperienceOptimization: {
            loadTimeOptimization: true,
            intuitive_navigation: true,
            errorPrevention: true,
            contextualHelp: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'request_customization', targetStepId: 'portal_setup' }],
        outputs: [{ id: 'out1', sourceStepId: 'portal_setup', targetStepId: 'initial_communication', label: 'portal_ready' }],
        assignee: { type: 'auto', value: 'portal_administrator' }
      },
      {
        id: 'initial_communication',
        type: 'automation',
        name: 'Initial Client Communication',
        description: 'Send personalized document request to client',
        position: { x: 900, y: 200 },
        configuration: {
          automationType: 'client_communication',
          estimatedHours: 0.1,
          communicationChannels: [
            'personalized_email',
            'sms_notification',
            'portal_notification',
            'mobile_app_push'
          ],
          contentPersonalization: {
            clientNameUsage: true,
            businessContextMentions: true,
            priorYearReferences: true,
            deadlinePersonalization: true,
            preferredContactMethod: true
          },
          deliveryOptimization: {
            optimalSendTime: true,
            timeZoneAdjustment: true,
            deviceOptimization: true,
            followUpScheduling: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'portal_setup', targetStepId: 'initial_communication' }],
        outputs: [{ id: 'out1', sourceStepId: 'initial_communication', targetStepId: 'submission_monitoring', label: 'communication_sent' }],
        assignee: { type: 'auto', value: 'communication_engine' }
      },
      {
        id: 'submission_monitoring',
        type: 'automation',
        name: 'Real-time Submission Monitoring',
        description: 'Monitor client document submissions and provide real-time feedback',
        position: { x: 1100, y: 200 },
        configuration: {
          automationType: 'submission_monitoring',
          continuousMonitoring: true,
          estimatedHours: 2.0,
          monitoringFeatures: [
            'real_time_upload_tracking',
            'automatic_document_validation',
            'progress_percentage_calculation',
            'quality_score_assessment',
            'completeness_checking',
            'immediate_feedback_provision'
          ],
          validationEngine: {
            fileFormatValidation: true,
            documentContentAnalysis: true,
            dateRangeVerification: true,
            mathematicalAccuracyCheck: true,
            completenessAssessment: true,
            duplicateDetection: true
          },
          clientFeedbackSystem: {
            instantValidationResults: true,
            improvementSuggestions: true,
            helpResourceLinks: true,
            liveChatAvailability: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'initial_communication', targetStepId: 'submission_monitoring' }],
        outputs: [
          { id: 'out1', sourceStepId: 'submission_monitoring', targetStepId: 'completion_verification', label: 'documents_received' },
          { id: 'out2', sourceStepId: 'submission_monitoring', targetStepId: 'intelligent_follow_up', condition: 'partial_submission' },
          { id: 'out3', sourceStepId: 'submission_monitoring', targetStepId: 'quality_review', condition: 'validation_issues' }
        ],
        assignee: { type: 'auto', value: 'monitoring_system' }
      },
      {
        id: 'intelligent_follow_up',
        type: 'automation',
        name: 'Intelligent Follow-up System',
        description: 'AI-powered follow-up based on client behavior and submission patterns',
        position: { x: 1100, y: 350 },
        configuration: {
          automationType: 'intelligent_follow_up',
          estimatedHours: 0.5,
          aiDrivenFollowUp: true,
          behaviorAnalysis: [
            'submission_patterns',
            'response_timing',
            'preferred_communication_channels',
            'engagement_levels',
            'technical_challenges',
            'time_of_day_preferences'
          ],
          adaptiveMessaging: {
            toneAdjustment: true,
            urgencyCalibration: true,
            contentPersonalization: true,
            channelOptimization: true,
            timingOptimization: true
          },
          escalationIntelligence: {
            predictiveModeling: true,
            riskAssessment: true,
            resourceAllocation: true,
            interventionTiming: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'submission_monitoring', targetStepId: 'intelligent_follow_up' }],
        outputs: [
          { id: 'out1', sourceStepId: 'intelligent_follow_up', targetStepId: 'submission_monitoring', label: 'follow_up_sent' },
          { id: 'out2', sourceStepId: 'intelligent_follow_up', targetStepId: 'personal_assistance', condition: 'assistance_needed' }
        ],
        assignee: { type: 'auto', value: 'ai_follow_up_agent' }
      },
      {
        id: 'personal_assistance',
        type: 'task',
        name: 'Personal Client Assistance',
        description: 'Provide personal assistance to clients facing challenges',
        position: { x: 1300, y: 350 },
        configuration: {
          taskType: 'client_support',
          estimatedHours: 1.0,
          assistanceTypes: [
            'technical_support',
            'document_explanation',
            'collection_guidance',
            'process_clarification',
            'alternative_submission_methods'
          ],
          supportChannels: [
            'phone_consultation',
            'video_call_assistance',
            'screen_sharing_session',
            'in_person_meeting',
            'guided_portal_tour'
          ],
          outcomeTracking: true,
          satisfactionMeasurement: true
        },
        inputs: [{ id: 'in1', sourceStepId: 'intelligent_follow_up', targetStepId: 'personal_assistance' }],
        outputs: [
          { id: 'out1', sourceStepId: 'personal_assistance', targetStepId: 'submission_monitoring', label: 'assistance_provided' },
          { id: 'out2', sourceStepId: 'personal_assistance', targetStepId: 'escalation_manager', condition: 'complex_issue' }
        ],
        assignee: { type: 'role', value: 'client_coordinator' }
      },
      {
        id: 'quality_review',
        type: 'automation',
        name: 'Automated Quality Review',
        description: 'AI-powered quality review and issue resolution',
        position: { x: 1100, y: 100 },
        configuration: {
          automationType: 'quality_review',
          estimatedHours: 0.8,
          aiQualityAssessment: true,
          reviewCriteria: [
            'document_completeness',
            'data_accuracy',
            'format_compliance',
            'date_consistency',
            'mathematical_accuracy',
            'regulatory_compliance'
          ],
          automaticCorrections: {
            formatStandardization: true,
            dateNormalization: true,
            numericValidation: true,
            documentRotation: true,
            qualityEnhancement: true
          },
          issueClassification: {
            criticalIssues: 'immediate_client_contact',
            moderateIssues: 'automated_clarification_request',
            minorIssues: 'automatic_correction_attempt'
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'submission_monitoring', targetStepId: 'quality_review' }],
        outputs: [
          { id: 'out1', sourceStepId: 'quality_review', targetStepId: 'completion_verification', label: 'quality_approved' },
          { id: 'out2', sourceStepId: 'quality_review', targetStepId: 'client_clarification', condition: 'clarification_needed' }
        ],
        assignee: { type: 'auto', value: 'quality_ai_agent' }
      },
      {
        id: 'client_clarification',
        type: 'automation',
        name: 'Automated Clarification Request',
        description: 'Send targeted clarification requests to clients',
        position: { x: 1300, y: 100 },
        configuration: {
          automationType: 'clarification_request',
          estimatedHours: 0.3,
          targetedRequests: true,
          clarificationTypes: [
            'specific_document_issues',
            'data_discrepancies',
            'missing_information',
            'format_problems',
            'authenticity_verification'
          ],
          communicationOptimization: {
            issueVisualization: true,
            stepByStepGuidance: true,
            exampleProvision: true,
            videoInstructions: true,
            realTimeSupport: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'quality_review', targetStepId: 'client_clarification' }],
        outputs: [
          { id: 'out1', sourceStepId: 'client_clarification', targetStepId: 'submission_monitoring', label: 'clarification_sent' }
        ],
        assignee: { type: 'auto', value: 'clarification_bot' }
      },
      {
        id: 'escalation_manager',
        type: 'task',
        name: 'Manager Escalation Review',
        description: 'Manager review for complex document collection issues',
        position: { x: 1500, y: 350 },
        configuration: {
          taskType: 'escalation_review',
          estimatedHours: 0.5,
          escalationTriggers: [
            'repeated_client_difficulties',
            'complex_document_requirements',
            'compliance_concerns',
            'client_dissatisfaction',
            'deadline_risk'
          ],
          resolutionOptions: [
            'alternative_collection_methods',
            'deadline_extension',
            'simplified_requirements',
            'additional_resource_allocation',
            'third_party_assistance'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'personal_assistance', targetStepId: 'escalation_manager' }],
        outputs: [
          { id: 'out1', sourceStepId: 'escalation_manager', targetStepId: 'completion_verification', label: 'resolved' },
          { id: 'out2', sourceStepId: 'escalation_manager', targetStepId: 'alternative_collection', label: 'alternative_method' }
        ],
        assignee: { type: 'role', value: 'document_services_manager' }
      },
      {
        id: 'alternative_collection',
        type: 'task',
        name: 'Alternative Collection Method',
        description: 'Implement alternative document collection methods',
        position: { x: 1700, y: 350 },
        configuration: {
          taskType: 'alternative_collection',
          estimatedHours: 1.5,
          alternativeMethods: [
            'phone_based_collection',
            'in_person_meeting',
            'third_party_authorization',
            'direct_bank_access',
            'simplified_documentation',
            'partial_submission_acceptance'
          ],
          methodSelection: {
            clientPreferences: true,
            urgencyConsideration: true,
            costEffectiveness: true,
            qualityMaintenance: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'escalation_manager', targetStepId: 'alternative_collection' }],
        outputs: [{ id: 'out1', sourceStepId: 'alternative_collection', targetStepId: 'completion_verification', label: 'documents_collected' }],
        assignee: { type: 'role', value: 'senior_client_coordinator' }
      },
      {
        id: 'completion_verification',
        type: 'automation',
        name: 'Final Completion Verification',
        description: 'Comprehensive verification of document collection completeness',
        position: { x: 1300, y: 200 },
        configuration: {
          automationType: 'completion_verification',
          estimatedHours: 0.5,
          comprehensiveChecks: true,
          verificationLevels: [
            'document_completeness_check',
            'quality_assurance_review',
            'compliance_verification',
            'client_confirmation',
            'internal_approval',
            'archive_preparation'
          ],
          finalQualityGate: {
            minimumQualityScore: 8.5,
            completenessThreshold: 95,
            complianceCheck: true,
            clientApproval: true
          },
          automatedReporting: {
            collectionSummary: true,
            qualityMetrics: true,
            timeAnalytics: true,
            issueReport: true,
            improvementRecommendations: true
          }
        },
        inputs: [
          { id: 'in1', sourceStepId: 'submission_monitoring', targetStepId: 'completion_verification' },
          { id: 'in2', sourceStepId: 'quality_review', targetStepId: 'completion_verification' },
          { id: 'in3', sourceStepId: 'escalation_manager', targetStepId: 'completion_verification' },
          { id: 'in4', sourceStepId: 'alternative_collection', targetStepId: 'completion_verification' }
        ],
        outputs: [
          { id: 'out1', sourceStepId: 'completion_verification', targetStepId: 'client_confirmation', label: 'verification_complete' },
          { id: 'out2', sourceStepId: 'completion_verification', targetStepId: 'submission_monitoring', condition: 'additional_items_needed' }
        ],
        assignee: { type: 'auto', value: 'verification_system' }
      },
      {
        id: 'client_confirmation',
        type: 'automation',
        name: 'Client Confirmation & Handoff',
        description: 'Send confirmation to client and handoff to processing team',
        position: { x: 1500, y: 200 },
        configuration: {
          automationType: 'client_confirmation',
          estimatedHours: 0.2,
          confirmationPackage: [
            'completion_confirmation_email',
            'document_receipt_summary',
            'next_steps_outline',
            'timeline_expectations',
            'contact_information',
            'satisfaction_survey'
          ],
          handoffActions: [
            'processing_team_notification',
            'document_package_preparation',
            'priority_flag_setting',
            'workflow_transition',
            'metric_recording'
          ],
          clientExperienceOptimization: {
            personalizedThanks: true,
            processTransparency: true,
            expectationSetting: true,
            continuedSupport: true
          }
        },
        inputs: [{ id: 'in1', sourceStepId: 'completion_verification', targetStepId: 'client_confirmation' }],
        outputs: [{ id: 'out1', sourceStepId: 'client_confirmation', targetStepId: 'end', label: 'handoff_complete' }],
        assignee: { type: 'auto', value: 'confirmation_system' }
      },
      {
        id: 'end',
        type: 'end',
        name: 'Document Collection Complete',
        description: 'Document collection workflow completed successfully',
        position: { x: 1700, y: 200 },
        configuration: {
          completionActions: [
            'workflow_metrics_recording',
            'performance_analysis',
            'client_satisfaction_tracking',
            'process_improvement_insights',
            'cost_analysis_update',
            'success_celebration'
          ]
        },
        inputs: [{ id: 'in1', sourceStepId: 'client_confirmation', targetStepId: 'end' }],
        outputs: []
      }
    ],
    connections: [
      { id: 'c1', sourceStepId: 'start', targetStepId: 'client_analysis', label: 'initiate' },
      { id: 'c2', sourceStepId: 'client_analysis', targetStepId: 'request_customization', label: 'analysis_complete' },
      { id: 'c3', sourceStepId: 'request_customization', targetStepId: 'portal_setup', label: 'request_ready' },
      { id: 'c4', sourceStepId: 'portal_setup', targetStepId: 'initial_communication', label: 'portal_ready' },
      { id: 'c5', sourceStepId: 'initial_communication', targetStepId: 'submission_monitoring', label: 'sent' },
      { id: 'c6', sourceStepId: 'submission_monitoring', targetStepId: 'completion_verification', label: 'complete' },
      { id: 'c7', sourceStepId: 'submission_monitoring', targetStepId: 'intelligent_follow_up', label: 'partial' },
      { id: 'c8', sourceStepId: 'submission_monitoring', targetStepId: 'quality_review', label: 'issues' },
      { id: 'c9', sourceStepId: 'intelligent_follow_up', targetStepId: 'submission_monitoring', label: 'follow_up_sent' },
      { id: 'c10', sourceStepId: 'intelligent_follow_up', targetStepId: 'personal_assistance', label: 'assistance_needed' },
      { id: 'c11', sourceStepId: 'personal_assistance', targetStepId: 'submission_monitoring', label: 'assisted' },
      { id: 'c12', sourceStepId: 'personal_assistance', targetStepId: 'escalation_manager', label: 'escalate' },
      { id: 'c13', sourceStepId: 'quality_review', targetStepId: 'completion_verification', label: 'approved' },
      { id: 'c14', sourceStepId: 'quality_review', targetStepId: 'client_clarification', label: 'clarification' },
      { id: 'c15', sourceStepId: 'client_clarification', targetStepId: 'submission_monitoring', label: 'clarification_sent' },
      { id: 'c16', sourceStepId: 'escalation_manager', targetStepId: 'completion_verification', label: 'resolved' },
      { id: 'c17', sourceStepId: 'escalation_manager', targetStepId: 'alternative_collection', label: 'alternative' },
      { id: 'c18', sourceStepId: 'alternative_collection', targetStepId: 'completion_verification', label: 'collected' },
      { id: 'c19', sourceStepId: 'completion_verification', targetStepId: 'client_confirmation', label: 'verified' },
      { id: 'c20', sourceStepId: 'completion_verification', targetStepId: 'submission_monitoring', label: 'additional_needed' },
      { id: 'c21', sourceStepId: 'client_confirmation', targetStepId: 'end', label: 'complete' }
    ],
    variables: [
      { name: 'client_id', type: 'string', value: '', scope: 'global', isRequired: true, description: 'Client identifier' },
      { name: 'document_type', type: 'string', value: 'tax_documents', scope: 'global', isRequired: true, description: 'Type of documents to collect' },
      { name: 'deadline', type: 'date', value: '', scope: 'global', isRequired: true, description: 'Collection deadline' },
      { name: 'priority_level', type: 'string', value: 'normal', scope: 'global', isRequired: true, description: 'Priority level' },
      { name: 'client_tech_comfort', type: 'string', value: 'moderate', scope: 'global', isRequired: false, description: 'Client technical comfort level' },
      { name: 'preferred_communication', type: 'string', value: 'email', scope: 'global', isRequired: false, description: 'Client preferred communication method' }
    ],
    triggers: [
      { id: 't1', type: 'manual', name: 'Manual Start', configuration: { allowedRoles: ['client_coordinator', 'manager'] }, isActive: true },
      { id: 't2', type: 'event', name: 'Service Engagement', configuration: { eventType: 'service_engagement_started' }, isActive: true },
      { id: 't3', type: 'scheduled', name: 'Periodic Collection', configuration: { cronExpression: '0 9 1 * *' }, isActive: true },
      { id: 't4', type: 'deadline', name: 'Deadline Approach', configuration: { daysBeforeDeadline: 14 }, isActive: true }
    ],
    settings: {
      allowParallelExecution: true,
      maxConcurrentInstances: 20,
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
        retryDelay: 7200 // 2 hours
      },
      escalationSettings: {
        enabled: true,
        escalationLevels: [
          { level: 1, delay: 8, assignTo: 'senior_coordinator', action: 'notify' },
          { level: 2, delay: 24, assignTo: 'manager', action: 'reassign' },
          { level: 3, delay: 48, assignTo: 'director', action: 'escalate' }
        ]
      }
    }
  }
];

// Document workflow optimization tools
export class DocumentWorkflowOptimizer {

  static analyzeCollectionEfficiency(collectionHistory: DocumentRequest[]): DocumentCollectionMetrics {
    const totalRequests = collectionHistory.length;
    if (totalRequests === 0) {
      return {
        averageCollectionTime: 0,
        clientResponseRate: 0,
        firstTimeCompleteness: 0,
        documentQualityScore: 0,
        clientSatisfactionScore: 0,
        costPerDocumentSet: 0,
        staffTimePerRequest: 0,
        automationEffectiveness: 0
      };
    }

    const completedRequests = collectionHistory.filter(req => req.status === 'complete');
    const avgCollectionTime = completedRequests.reduce((sum, req) => {
      const startDate = new Date(req.dueDate);
      const endDate = new Date(); // Assume current date for completed requests
      return sum + (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    }, 0) / completedRequests.length;

    const clientResponseRate = (completedRequests.length / totalRequests) * 100;

    // Calculate first-time completeness (no follow-ups needed)
    const firstTimeComplete = collectionHistory.filter(req =>
      req.communicationHistory.filter(comm => comm.type === 'email' && comm.direction === 'outbound').length <= 1
    );
    const firstTimeCompleteness = (firstTimeComplete.length / totalRequests) * 100;

    // Mock quality and satisfaction scores (would be calculated from actual data)
    const documentQualityScore = 8.5;
    const clientSatisfactionScore = 8.8;
    const costPerDocumentSet = 45;
    const staffTimePerRequest = 1.2;
    const automationEffectiveness = 85;

    return {
      averageCollectionTime: Math.round(avgCollectionTime * 10) / 10,
      clientResponseRate: Math.round(clientResponseRate * 10) / 10,
      firstTimeCompleteness: Math.round(firstTimeCompleteness * 10) / 10,
      documentQualityScore,
      clientSatisfactionScore,
      costPerDocumentSet,
      staffTimePerRequest,
      automationEffectiveness
    };
  }

  static identifyBottlenecks(workflowExecutions: any[]): {
    stepId: string;
    stepName: string;
    avgDelay: number;
    frequency: number;
    impact: 'low' | 'medium' | 'high';
    recommendations: string[];
  }[] {

    const bottlenecks = [];

    // Analyze common delay points
    const stepDelays = new Map();

    workflowExecutions.forEach(execution => {
      execution.steps?.forEach((step: any) => {
        if (step.actualDuration > step.estimatedDuration * 1.5) {
          const existing = stepDelays.get(step.stepId) || { delays: [], count: 0 };
          existing.delays.push(step.actualDuration - step.estimatedDuration);
          existing.count++;
          existing.stepName = step.stepName;
          stepDelays.set(step.stepId, existing);
        }
      });
    });

    stepDelays.forEach((data, stepId) => {
      const avgDelay = data.delays.reduce((sum: number, delay: number) => sum + delay, 0) / data.delays.length;
      const frequency = (data.count / workflowExecutions.length) * 100;

      let impact: 'low' | 'medium' | 'high' = 'low';
      let recommendations: string[] = [];

      if (avgDelay > 24 && frequency > 30) {
        impact = 'high';
        recommendations = [
          'Implement automated processing for this step',
          'Add dedicated resources during peak periods',
          'Improve client communication templates',
          'Consider parallel processing options'
        ];
      } else if (avgDelay > 12 && frequency > 20) {
        impact = 'medium';
        recommendations = [
          'Review and optimize step procedures',
          'Provide additional training to staff',
          'Implement better tracking and alerts'
        ];
      } else {
        recommendations = [
          'Monitor for trends',
          'Consider minor process improvements'
        ];
      }

      bottlenecks.push({
        stepId,
        stepName: data.stepName,
        avgDelay: Math.round(avgDelay * 10) / 10,
        frequency: Math.round(frequency * 10) / 10,
        impact,
        recommendations
      });
    });

    return bottlenecks.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return (impactWeight[b.impact] * b.frequency) - (impactWeight[a.impact] * a.frequency);
    });
  }

  static generateOptimizationRecommendations(metrics: DocumentCollectionMetrics): {
    category: string;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    expectedImprovement: string;
    implementationEffort: 'low' | 'medium' | 'high';
  }[] {

    const recommendations = [];

    if (metrics.clientResponseRate < 80) {
      recommendations.push({
        category: 'Client Communication',
        priority: 'high' as const,
        recommendation: 'Implement personalized, multi-channel communication strategy with optimal timing',
        expectedImprovement: 'Increase response rate by 15-25%',
        implementationEffort: 'medium' as const
      });
    }

    if (metrics.averageCollectionTime > 7) {
      recommendations.push({
        category: 'Process Efficiency',
        priority: 'high' as const,
        recommendation: 'Deploy AI-powered document collection with real-time validation and smart reminders',
        expectedImprovement: 'Reduce collection time by 40-60%',
        implementationEffort: 'high' as const
      });
    }

    if (metrics.firstTimeCompleteness < 70) {
      recommendations.push({
        category: 'Client Experience',
        priority: 'medium' as const,
        recommendation: 'Enhance client portal with guided instructions, examples, and interactive help',
        expectedImprovement: 'Improve first-time completeness by 20-30%',
        implementationEffort: 'medium' as const
      });
    }

    if (metrics.staffTimePerRequest > 2.0) {
      recommendations.push({
        category: 'Automation',
        priority: 'high' as const,
        recommendation: 'Implement comprehensive automation for routine tasks and communications',
        expectedImprovement: 'Reduce staff time by 50-70%',
        implementationEffort: 'high' as const
      });
    }

    if (metrics.documentQualityScore < 8.0) {
      recommendations.push({
        category: 'Quality Control',
        priority: 'medium' as const,
        recommendation: 'Deploy automated document validation and quality assessment tools',
        expectedImprovement: 'Improve quality score by 1-2 points',
        implementationEffort: 'medium' as const
      });
    }

    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }
}

// Export everything
export {
  DocumentRequest,
  DocumentCategory,
  ValidationRule,
  CommunicationRecord,
  DocumentAutomationSettings,
  EscalationRule,
  DeliveryMethod,
  DocumentCollectionMetrics,
  DocumentWorkflowOptimizer
};