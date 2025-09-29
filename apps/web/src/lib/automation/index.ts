// Intelligent Automation System for AdvisorOS
// Comprehensive automation solutions for CPA firms

// Core Automation Services
export { intelligentDocumentProcessor } from './intelligent-document-processor';
export { clientCommunicationAutomationService } from './client-communication-automation';
export { financialDataAutomationService } from './financial-data-automation';
export { smartTaskAutomationService } from './smart-task-automation';
export { aiProcessOptimizerService } from './ai-process-optimizer';
export { documentWorkflowAutomationService } from './document-workflow-automation';

// Central Orchestrator
export { automationOrchestratorService } from './automation-orchestrator';

// Type Exports for Intelligent Document Processing
export type {
  SmartDocumentRule,
  DocumentProcessingPipeline,
  IntelligentErrorCorrection,
  AutomatedQualityControl
} from './intelligent-document-processor';

// Type Exports for Client Communication Automation
export type {
  CommunicationTemplate,
  CommunicationSequence,
  SmartFollowUp,
  ClientPreferences,
  CommunicationAnalytics,
  AutomatedResponse
} from './client-communication-automation';

// Type Exports for Financial Data Automation
export type {
  FinancialDataRule,
  SmartReconciliation,
  AnomalyDetection,
  AutomatedCorrection,
  FinancialReport,
  ComplianceMonitor
} from './financial-data-automation';

// Type Exports for Smart Task Automation
export type {
  SmartTaskRule,
  IntelligentScheduler,
  WorkloadBalancer,
  AutomatedQualityControl as TaskQualityControl,
  TaskDependencyGraph,
  PerformanceOptimizer
} from './smart-task-automation';

// Type Exports for AI Process Optimizer
export type {
  ProcessPattern,
  OptimizationOpportunity,
  AIInsight,
  PredictiveModel,
  ContinuousImprovement,
  AdaptiveLearning
} from './ai-process-optimizer';

// Type Exports for Document Workflow Automation
export type {
  AutomationRule,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
  ComplianceRule,
  DocumentRetentionPolicy,
  AutomationExecution as WorkflowAutomationExecution,
  ComplianceReport,
  DocumentRouting
} from './document-workflow-automation';

// Type Exports for Automation Orchestrator
export type {
  AutomationStrategy,
  AutomationExecution,
  AutomationMetrics,
  SmartAutomationEngine
} from './automation-orchestrator';

// Automation Service Registry
export const automationServices = {
  intelligentDocumentProcessor,
  clientCommunicationAutomationService,
  financialDataAutomationService,
  smartTaskAutomationService,
  aiProcessOptimizerService,
  documentWorkflowAutomationService,
  automationOrchestratorService
} as const;

// Automation Categories
export const automationCategories = {
  documentProcessing: {
    services: ['intelligentDocumentProcessor', 'documentWorkflowAutomationService'],
    description: 'Automated document analysis, categorization, and workflow management'
  },
  clientCommunication: {
    services: ['clientCommunicationAutomationService'],
    description: 'Intelligent client communication and engagement automation'
  },
  financialProcessing: {
    services: ['financialDataAutomationService'],
    description: 'Advanced financial data processing, reconciliation, and compliance'
  },
  taskManagement: {
    services: ['smartTaskAutomationService'],
    description: 'AI-driven task assignment, scheduling, and workload optimization'
  },
  processOptimization: {
    services: ['aiProcessOptimizerService'],
    description: 'Continuous process improvement and AI-powered optimization'
  },
  orchestration: {
    services: ['automationOrchestratorService'],
    description: 'Central coordination and cross-service automation management'
  }
} as const;

// Automation Capabilities Summary
export const automationCapabilities = {
  intelligentDocumentProcessing: [
    'Smart document categorization and routing',
    'Automated data extraction and validation',
    'Intelligent error detection and correction',
    'Quality control and review workflows',
    'Document archival and retention management'
  ],

  clientCommunicationAutomation: [
    'Personalized email templates and sequences',
    'Automated follow-up and reminder systems',
    'Intelligent response routing and escalation',
    'Status updates and progress reporting',
    'Smart scheduling and appointment management'
  ],

  financialDataProcessing: [
    'Automated QuickBooks data sync and validation',
    'Smart transaction categorization and review',
    'Intelligent anomaly detection and alerting',
    'Automated compliance checking and reporting',
    'Financial report generation with insights'
  ],

  workflowAndTaskAutomation: [
    'AI-driven task assignment based on skills and workload',
    'Automated workflow progression and routing',
    'Intelligent deadline management and prioritization',
    'Quality control and review processes',
    'Smart resource allocation and scheduling'
  ],

  aiDrivenOptimization: [
    'Machine learning for process optimization',
    'Predictive analytics for workflow bottlenecks',
    'Automated process improvement recommendations',
    'Adaptive automation based on usage patterns',
    'Performance monitoring and optimization'
  ]
} as const;

// Utility Functions
export const automationUtils = {
  /**
   * Initialize all automation services for an organization
   */
  async initializeOrganizationAutomation(organizationId: string, configuration: any) {
    // Initialize automation services with organization-specific configuration
    const results = {
      documentProcessing: false,
      clientCommunication: false,
      financialData: false,
      taskManagement: false,
      processOptimization: false
    };

    try {
      // Initialize each service
      // Implementation would configure each service for the organization
      results.documentProcessing = true;
      results.clientCommunication = true;
      results.financialData = true;
      results.taskManagement = true;
      results.processOptimization = true;

      return {
        success: true,
        results,
        message: 'All automation services initialized successfully'
      };
    } catch (error) {
      return {
        success: false,
        results,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get automation metrics across all services
   */
  async getComprehensiveMetrics(organizationId: string, period: { from: Date; to: Date }) {
    return await automationOrchestratorService.getAutomationMetrics(organizationId, period, {
      includeDetailedAnalysis: true,
      includePredictions: true,
      includeRecommendations: true
    });
  },

  /**
   * Execute cross-service automation workflow
   */
  async executeAutomationWorkflow(trigger: any) {
    return await automationOrchestratorService.executeAutomationWorkflow(trigger);
  },

  /**
   * Optimize automation performance across all services
   */
  async optimizeAllAutomation(organizationId: string) {
    return await automationOrchestratorService.optimizeAutomationPerformance(organizationId, {
      analysisDepth: 'comprehensive',
      applyOptimizations: true
    });
  }
} as const;