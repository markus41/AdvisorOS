/**
 * AdvisorOS AI Services - Comprehensive AI Integration Layer
 *
 * This module provides a unified interface to all AI-powered features
 * including OCR, document intelligence, financial insights, communication AI,
 * tax compliance, and comprehensive monitoring and safety systems.
 */

// Core AI Services
export { openaiService } from './openai-service';
export { documentIntelligenceService } from './document-intelligence-enhanced';
export { enhancedOCRService } from '../ocr/enhanced-ocr-service';
export { communicationAIService } from './communication-ai';
export { taxComplianceAIService } from './tax-compliance-ai';
export { aiMonitoringSafetyService } from './ai-monitoring-safety';
export { aiOrchestrator } from './ai-orchestrator';

// Types - OpenAI Service
export type {
  AIUsageTracking,
  FinancialInsight,
  EmailDraftOptions,
  EmailDraft,
  TaxOptimizationSuggestion,
  ComplianceAlert
} from './openai-service';

// Types - Document Intelligence
export type {
  EnhancedDocumentAnalysis,
  DocumentClassificationRule,
  BatchProcessingOptions
} from './document-intelligence-enhanced';

// Types - Enhanced OCR
export type {
  EnhancedOCRResult,
  BatchOCROptions,
  OCRTrainingData,
  CustomOCRModel,
  OCRQueueItem
} from '../ocr/enhanced-ocr-service';

// Types - Communication AI
export type {
  SmartEmailTemplate,
  CommunicationContext,
  SmartSuggestion,
  CommunicationAnalytics,
  FollowUpRecommendation,
  ComplianceValidation
} from './communication-ai';

// Types - Tax Compliance AI
export type {
  TaxComplianceRule,
  TaxOptimizationStrategy,
  ComplianceDeadline,
  RiskAssessment,
  TaxDocumentAnalysis,
  ComplianceCalendar
} from './tax-compliance-ai';

// Types - AI Monitoring & Safety
export type {
  AIUsageMetrics,
  SafetyPolicy,
  ContentModerationResult,
  UsageQuota,
  AuditLog,
  QualityAssessment,
  RealTimeAlert
} from './ai-monitoring-safety';

// Types - AI Orchestrator
export type {
  AIServiceHealth,
  AIWorkflowDefinition,
  AIWorkflowExecution,
  AICapabilityMatrix,
  AIServiceQuota,
  SmartRoutingRule
} from './ai-orchestrator';

/**
 * AI Service Status and Capabilities
 */
export interface AdvisorOSAICapabilities {
  // Document Processing
  documentOCR: boolean;
  documentClassification: boolean;
  intelligentDataExtraction: boolean;
  documentQualityAssessment: boolean;
  batchDocumentProcessing: boolean;

  // Financial Intelligence
  financialInsightsGeneration: boolean;
  anomalyDetection: boolean;
  riskAssessment: boolean;
  costAnalysis: boolean;
  performanceBenchmarking: boolean;

  // Communication AI
  smartEmailGeneration: boolean;
  sentimentAnalysis: boolean;
  communicationPersonalization: boolean;
  followUpRecommendations: boolean;
  clientCommunicationAnalytics: boolean;

  // Tax and Compliance
  taxDocumentAnalysis: boolean;
  complianceRuleChecking: boolean;
  deadlineMonitoring: boolean;
  taxOptimizationSuggestions: boolean;
  complianceRiskScoring: boolean;

  // Safety and Monitoring
  contentModeration: boolean;
  usageMonitoring: boolean;
  qualityAssurance: boolean;
  costTracking: boolean;
  auditTrail: boolean;

  // Advanced Features
  workflowOrchestration: boolean;
  smartRouting: boolean;
  realTimeAlerts: boolean;
  customModelTraining: boolean;
  batchProcessing: boolean;
}

/**
 * Main AI Service Interface
 */
export interface AdvisorOSAIService {
  // Service Management
  isReady(): boolean;
  getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: any[];
    capabilities: AdvisorOSAICapabilities;
    usage: any;
  }>;

  // Document Processing
  processDocument(
    organizationId: string,
    userId: string,
    documentBuffer: Buffer,
    metadata: any,
    options?: any
  ): Promise<any>;

  // Financial Analysis
  generateFinancialAnalysis(
    organizationId: string,
    userId: string,
    financialData: any,
    options?: any
  ): Promise<any>;

  // Communication
  generateSmartEmail(
    organizationId: string,
    userId: string,
    emailRequest: any
  ): Promise<any>;

  // Tax and Compliance
  analyzeTaxCompliance(
    organizationId: string,
    clientId: string,
    options?: any
  ): Promise<any>;

  // Monitoring
  getUsageAnalytics(
    organizationId: string,
    period: any
  ): Promise<any>;
}

/**
 * Unified AI Service Implementation
 */
class AdvisorOSAIServiceImpl implements AdvisorOSAIService {
  async isReady(): boolean {
    return aiOrchestrator.isReady();
  }

  async getServiceStatus() {
    return await aiOrchestrator.getServiceStatus();
  }

  async processDocument(
    organizationId: string,
    userId: string,
    documentBuffer: Buffer,
    metadata: any,
    options: any = {}
  ) {
    return await aiOrchestrator.processDocument(
      organizationId,
      userId,
      documentBuffer,
      metadata,
      options
    );
  }

  async generateFinancialAnalysis(
    organizationId: string,
    userId: string,
    financialData: any,
    options: any = {}
  ) {
    return await aiOrchestrator.generateComprehensiveFinancialAnalysis(
      organizationId,
      userId,
      financialData,
      options
    );
  }

  async generateSmartEmail(
    organizationId: string,
    userId: string,
    emailRequest: any
  ) {
    return await aiOrchestrator.generateSmartEmail(
      organizationId,
      userId,
      emailRequest
    );
  }

  async analyzeTaxCompliance(
    organizationId: string,
    clientId: string,
    options: any = {}
  ) {
    return await taxComplianceAIService.assessClientComplianceRisk(
      organizationId,
      clientId,
      options
    );
  }

  async getUsageAnalytics(
    organizationId: string,
    period: any
  ) {
    return await aiMonitoringSafetyService.generateUsageAnalytics(
      organizationId,
      period
    );
  }
}

// Export unified service instance
export const advisorOSAI = new AdvisorOSAIServiceImpl();

/**
 * Quick access functions for common AI operations
 */

/**
 * Process a document with full AI pipeline
 */
export async function processDocumentWithAI(
  organizationId: string,
  userId: string,
  documentBuffer: Buffer,
  fileName: string,
  options: {
    enableOCR?: boolean;
    enableClassification?: boolean;
    enableAnalysis?: boolean;
    enableCompliance?: boolean;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  } = {}
) {
  return await advisorOSAI.processDocument(
    organizationId,
    userId,
    documentBuffer,
    {
      fileName,
      mimeType: 'application/pdf' // Default, would be detected
    },
    {
      enableOCR: true,
      enableClassification: true,
      enableAnalysis: true,
      enableCompliance: true,
      priority: 'normal',
      ...options
    }
  );
}

/**
 * Generate financial insights from data
 */
export async function generateFinancialInsights(
  organizationId: string,
  userId: string,
  financialData: {
    transactions: any[];
    balanceSheet?: any;
    profitLoss?: any;
    cashFlow?: any;
    period: string;
  },
  focusAreas: string[] = []
) {
  return await advisorOSAI.generateFinancialAnalysis(
    organizationId,
    userId,
    financialData,
    {
      includeRiskAssessment: true,
      includeTaxOptimization: true,
      includeComplianceCheck: true,
      focusAreas
    }
  );
}

/**
 * Generate smart client email
 */
export async function generateClientEmail(
  organizationId: string,
  userId: string,
  clientId: string,
  purpose: 'followup' | 'reminder' | 'report' | 'alert' | 'consultation',
  context: Record<string, any> = {},
  options: {
    urgency?: 'low' | 'normal' | 'high';
    tone?: 'professional' | 'friendly' | 'formal';
    includeAttachments?: boolean;
  } = {}
) {
  return await advisorOSAI.generateSmartEmail(
    organizationId,
    userId,
    {
      purpose,
      clientId,
      context,
      urgency: options.urgency || 'normal',
      tone: options.tone || 'professional',
      includeAttachments: options.includeAttachments || false
    }
  );
}

/**
 * Assess client compliance risk
 */
export async function assessClientRisk(
  organizationId: string,
  clientId: string,
  options: {
    includeHistoricalData?: boolean;
    focusAreas?: string[];
    assessmentDepth?: 'basic' | 'comprehensive' | 'detailed';
  } = {}
) {
  return await advisorOSAI.analyzeTaxCompliance(
    organizationId,
    clientId,
    {
      includeHistoricalData: true,
      assessmentDepth: 'comprehensive',
      ...options
    }
  );
}

/**
 * Get AI usage analytics
 */
export async function getAIUsageAnalytics(
  organizationId: string,
  dateFrom: Date,
  dateTo: Date,
  options: {
    includeUserBreakdown?: boolean;
    includeQualityMetrics?: boolean;
    detectAnomalies?: boolean;
  } = {}
) {
  return await advisorOSAI.getUsageAnalytics(
    organizationId,
    {
      startDate: dateFrom,
      endDate: dateTo
    }
  );
}

/**
 * Get AI service capabilities
 */
export function getAICapabilities(): AdvisorOSAICapabilities {
  const orchestratorCapabilities = aiOrchestrator.getCapabilities();

  return {
    // Document Processing
    documentOCR: orchestratorCapabilities.documentProcessing.ocr,
    documentClassification: orchestratorCapabilities.documentProcessing.classification,
    intelligentDataExtraction: orchestratorCapabilities.documentProcessing.dataExtraction,
    documentQualityAssessment: orchestratorCapabilities.documentProcessing.qualityAssessment,
    batchDocumentProcessing: orchestratorCapabilities.documentProcessing.batchProcessing,

    // Financial Intelligence
    financialInsightsGeneration: orchestratorCapabilities.financialAnalysis.insightsGeneration,
    anomalyDetection: orchestratorCapabilities.financialAnalysis.anomalyDetection,
    riskAssessment: orchestratorCapabilities.financialAnalysis.riskAssessment,
    costAnalysis: true,
    performanceBenchmarking: true,

    // Communication AI
    smartEmailGeneration: orchestratorCapabilities.communication.emailGeneration,
    sentimentAnalysis: orchestratorCapabilities.communication.sentimentAnalysis,
    communicationPersonalization: orchestratorCapabilities.communication.personalization,
    followUpRecommendations: true,
    clientCommunicationAnalytics: true,

    // Tax and Compliance
    taxDocumentAnalysis: orchestratorCapabilities.taxCompliance.documentAnalysis,
    complianceRuleChecking: orchestratorCapabilities.taxCompliance.complianceChecking,
    deadlineMonitoring: orchestratorCapabilities.taxCompliance.deadlineTracking,
    taxOptimizationSuggestions: orchestratorCapabilities.taxCompliance.optimizationSuggestions,
    complianceRiskScoring: orchestratorCapabilities.taxCompliance.riskScoring,

    // Safety and Monitoring
    contentModeration: orchestratorCapabilities.monitoring.safetyChecking,
    usageMonitoring: orchestratorCapabilities.monitoring.usageTracking,
    qualityAssurance: orchestratorCapabilities.monitoring.qualityAssessment,
    costTracking: orchestratorCapabilities.monitoring.costMonitoring,
    auditTrail: orchestratorCapabilities.monitoring.auditLogging,

    // Advanced Features
    workflowOrchestration: true,
    smartRouting: true,
    realTimeAlerts: true,
    customModelTraining: false, // Future feature
    batchProcessing: true
  };
}

/**
 * Initialize AI services
 */
export async function initializeAIServices(): Promise<void> {
  try {
    await aiOrchestrator.initialize();
    console.log('AdvisorOS AI Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI services:', error);
    throw error;
  }
}

/**
 * Health check for all AI services
 */
export async function performAIHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: any[];
  summary: string;
}> {
  try {
    const status = await aiOrchestrator.getServiceStatus();
    const healthyServices = status.services.filter(s => s.status === 'healthy').length;
    const totalServices = status.services.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      overallStatus = 'healthy';
    } else if (healthyServices > totalServices / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      services: status.services,
      summary: `${healthyServices}/${totalServices} services healthy`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      services: [],
      summary: 'Health check failed'
    };
  }
}

// Default export
export default {
  // Main service
  advisorOSAI,

  // Individual services
  openaiService,
  documentIntelligenceService,
  enhancedOCRService,
  communicationAIService,
  taxComplianceAIService,
  aiMonitoringSafetyService,
  aiOrchestrator,

  // Quick access functions
  processDocumentWithAI,
  generateFinancialInsights,
  generateClientEmail,
  assessClientRisk,
  getAIUsageAnalytics,
  getAICapabilities,
  initializeAIServices,
  performAIHealthCheck
};