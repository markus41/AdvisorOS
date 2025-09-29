import { openaiService } from './openai-service';
import { documentIntelligenceService } from './document-intelligence-enhanced';
import { enhancedOCRService } from '../ocr/enhanced-ocr-service';
import { communicationAIService } from './communication-ai';
import { taxComplianceAIService } from './tax-compliance-ai';
import { aiMonitoringSafetyService } from './ai-monitoring-safety';
import { prisma } from '../../server/db';
import { EventEmitter } from 'events';

export interface AIServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  capabilities: string[];
  limitations: string[];
  version: string;
}

export interface AIWorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'document_processing' | 'financial_analysis' | 'communication' | 'compliance' | 'custom';
  organizationId: string;
  isActive: boolean;
  steps: Array<{
    id: string;
    name: string;
    service: 'openai' | 'azure_cognitive' | 'form_recognizer' | 'custom';
    operation: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
      value: any;
    }>;
    onSuccess?: string; // Next step ID
    onFailure?: string; // Next step ID or action
    timeout?: number;
    retries?: number;
  }>;
  errorHandling: {
    strategy: 'stop' | 'continue' | 'retry' | 'fallback';
    fallbackSteps?: string[];
    notificationSettings: {
      onError: boolean;
      onComplete: boolean;
      recipients: string[];
    };
  };
  monitoring: {
    trackUsage: boolean;
    trackQuality: boolean;
    trackCosts: boolean;
    alertThresholds: Record<string, number>;
  };
  createdAt: Date;
  lastUpdated: Date;
  createdBy: string;
}

export interface AIWorkflowExecution {
  id: string;
  workflowId: string;
  organizationId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  stepResults: Record<string, {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime: Date;
    endTime?: Date;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    error?: string;
    metrics: {
      duration: number;
      tokensUsed: number;
      cost: number;
      quality?: number;
    };
  }>;
  totalMetrics: {
    duration: number;
    tokensUsed: number;
    cost: number;
    stepsCompleted: number;
    stepsTotal: number;
  };
  error?: string;
  context: Record<string, any>;
}

export interface AICapabilityMatrix {
  documentProcessing: {
    ocr: boolean;
    classification: boolean;
    dataExtraction: boolean;
    qualityAssessment: boolean;
    batchProcessing: boolean;
  };
  financialAnalysis: {
    insightsGeneration: boolean;
    anomalyDetection: boolean;
    riskAssessment: boolean;
    forecasting: boolean;
    optimization: boolean;
  };
  communication: {
    emailGeneration: boolean;
    sentimentAnalysis: boolean;
    languageTranslation: boolean;
    summarization: boolean;
    personalization: boolean;
  };
  taxCompliance: {
    documentAnalysis: boolean;
    complianceChecking: boolean;
    deadlineTracking: boolean;
    optimizationSuggestions: boolean;
    riskScoring: boolean;
  };
  monitoring: {
    usageTracking: boolean;
    qualityAssessment: boolean;
    costMonitoring: boolean;
    safetyChecking: boolean;
    auditLogging: boolean;
  };
}

export interface AIServiceQuota {
  organizationId: string;
  service: string;
  quotaType: 'requests' | 'tokens' | 'cost' | 'storage';
  allocated: number;
  used: number;
  remaining: number;
  resetDate: Date;
  overagePolicy: 'block' | 'allow' | 'charge';
}

export interface SmartRoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  targetService: string;
  targetOperation: string;
  configuration: Record<string, any>;
  isActive: boolean;
}

class AIOrchestrator extends EventEmitter {
  private serviceHealth = new Map<string, AIServiceHealth>();
  private workflowDefinitions = new Map<string, AIWorkflowDefinition>();
  private activeExecutions = new Map<string, AIWorkflowExecution>();
  private routingRules = new Map<string, SmartRoutingRule>();
  private capabilities: AICapabilityMatrix;
  private isInitialized = false;

  constructor() {
    super();
    this.capabilities = this.initializeCapabilities();
    this.initialize();
  }

  /**
   * Initialize the AI orchestrator
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AI Orchestrator...');

      // Check service health
      await this.checkAllServicesHealth();

      // Load workflow definitions
      await this.loadWorkflowDefinitions();

      // Load routing rules
      await this.loadRoutingRules();

      // Start monitoring
      this.startHealthMonitoring();
      this.startWorkflowCleanup();

      this.isInitialized = true;
      console.log('AI Orchestrator initialized successfully');

      this.emit('orchestrator_initialized', {
        capabilities: this.capabilities,
        servicesHealthy: Array.from(this.serviceHealth.values()).filter(s => s.status === 'healthy').length,
        workflowsLoaded: this.workflowDefinitions.size
      });

    } catch (error) {
      console.error('AI Orchestrator initialization failed:', error);
      throw new Error(`Orchestrator initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process document with intelligent routing and workflow
   */
  async processDocument(
    organizationId: string,
    userId: string,
    documentBuffer: Buffer,
    metadata: {
      fileName: string;
      mimeType: string;
      documentType?: string;
      workflowId?: string;
    },
    options: {
      enableOCR?: boolean;
      enableClassification?: boolean;
      enableAnalysis?: boolean;
      enableCompliance?: boolean;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    } = {}
  ): Promise<{
    executionId: string;
    results: {
      ocr?: any;
      classification?: any;
      analysis?: any;
      compliance?: any;
      insights?: any;
    };
    metrics: {
      totalDuration: number;
      totalCost: number;
      qualityScore: number;
      stepsCompleted: number;
    };
    recommendations?: string[];
  }> {
    try {
      // Check service availability and quotas
      await this.validateServiceAvailability(organizationId, 'document_processing');

      // Monitor the request
      const monitoringResult = await aiMonitoringSafetyService.monitorAIRequest(
        organizationId,
        userId,
        {
          service: 'document_processing',
          operation: 'process_document',
          content: metadata.fileName,
          metadata: { mimeType: metadata.mimeType, ...options }
        }
      );

      if (!monitoringResult.allowed) {
        throw new Error('Request blocked by AI safety systems');
      }

      // Create or use workflow
      const workflowId = metadata.workflowId || await this.selectOptimalWorkflow(
        organizationId,
        'document_processing',
        { documentType: metadata.documentType, ...options }
      );

      // Execute workflow
      const execution = await this.executeWorkflow(
        workflowId,
        organizationId,
        userId,
        {
          documentBuffer,
          metadata,
          options
        }
      );

      const results: any = {};
      const recommendations: string[] = [];

      // Step 1: OCR Processing (if enabled)
      if (options.enableOCR !== false) {
        try {
          const ocrResult = await enhancedOCRService.processDocument(
            documentBuffer,
            {
              fileName: metadata.fileName,
              documentId: `temp_${Date.now()}`,
              organizationId,
              uploadedBy: userId
            },
            {
              enablePreprocessing: true,
              enableValidation: true,
              enableFinancialExtraction: true,
              priority: options.priority
            }
          );

          results.ocr = ocrResult;
          execution.stepResults['ocr'] = {
            status: 'completed',
            startTime: new Date(),
            endTime: new Date(),
            inputs: { fileName: metadata.fileName },
            outputs: { confidence: ocrResult.confidence },
            metrics: {
              duration: ocrResult.processingTime || 0,
              tokensUsed: 0,
              cost: 0.10,
              quality: ocrResult.confidence
            }
          };

          if (ocrResult.validation.validationScore < 0.8) {
            recommendations.push('Document quality is below optimal - consider manual review');
          }

        } catch (error) {
          console.error('OCR processing failed:', error);
          execution.stepResults['ocr'] = {
            status: 'failed',
            startTime: new Date(),
            endTime: new Date(),
            inputs: { fileName: metadata.fileName },
            outputs: {},
            error: error instanceof Error ? error.message : 'OCR failed',
            metrics: { duration: 0, tokensUsed: 0, cost: 0 }
          };
        }
      }

      // Step 2: Document Intelligence (if enabled)
      if (options.enableClassification !== false && results.ocr) {
        try {
          const intelligenceResult = await documentIntelligenceService.analyzeDocument(
            documentBuffer,
            {
              fileName: metadata.fileName,
              fileSize: documentBuffer.length,
              mimeType: metadata.mimeType,
              organizationId,
              uploadedBy: userId,
              uploadedAt: new Date()
            },
            {
              enableAdvancedAnalysis: true,
              qualityThreshold: 0.8
            }
          );

          results.classification = intelligenceResult;
          execution.stepResults['classification'] = {
            status: 'completed',
            startTime: new Date(),
            endTime: new Date(),
            inputs: { documentType: metadata.documentType },
            outputs: {
              category: intelligenceResult.category.category,
              confidence: intelligenceResult.category.confidence
            },
            metrics: {
              duration: intelligenceResult.processingTime,
              tokensUsed: 0,
              cost: intelligenceResult.costInfo.totalCost,
              quality: intelligenceResult.category.confidence
            }
          };

          if (intelligenceResult.anomalies.length > 0) {
            recommendations.push(`${intelligenceResult.anomalies.length} anomalies detected - review recommended`);
          }

        } catch (error) {
          console.error('Document intelligence failed:', error);
          execution.stepResults['classification'] = {
            status: 'failed',
            startTime: new Date(),
            endTime: new Date(),
            inputs: { documentType: metadata.documentType },
            outputs: {},
            error: error instanceof Error ? error.message : 'Classification failed',
            metrics: { duration: 0, tokensUsed: 0, cost: 0 }
          };
        }
      }

      // Step 3: Financial Analysis (if enabled and applicable)
      if (options.enableAnalysis !== false && results.classification) {
        const isFinancialDocument = ['invoice', 'receipt', 'bank_statement', 'tax_return']
          .includes(results.classification.category.category);

        if (isFinancialDocument) {
          try {
            const insights = await openaiService.generateFinancialInsights(
              organizationId,
              {
                transactions: results.ocr?.financialData?.amounts || [],
                period: 'current'
              },
              {
                includeRecommendations: true,
                focusAreas: ['accuracy', 'compliance']
              }
            );

            results.insights = insights;
            execution.stepResults['analysis'] = {
              status: 'completed',
              startTime: new Date(),
              endTime: new Date(),
              inputs: { documentCategory: results.classification.category.category },
              outputs: { insightCount: insights.length },
              metrics: {
                duration: 5000, // Estimated
                tokensUsed: 1500,
                cost: 0.05,
                quality: insights[0]?.confidence || 0.8
              }
            };

            insights.forEach(insight => {
              if (insight.severity === 'high' || insight.severity === 'critical') {
                recommendations.push(insight.title);
              }
            });

          } catch (error) {
            console.error('Financial analysis failed:', error);
            execution.stepResults['analysis'] = {
              status: 'failed',
              startTime: new Date(),
              endTime: new Date(),
              inputs: { documentCategory: results.classification?.category.category },
              outputs: {},
              error: error instanceof Error ? error.message : 'Analysis failed',
              metrics: { duration: 0, tokensUsed: 0, cost: 0 }
            };
          }
        }
      }

      // Step 4: Tax Compliance Check (if enabled and applicable)
      if (options.enableCompliance !== false && results.classification) {
        const isTaxDocument = ['tax_return', 'w2', '1099'].includes(results.classification.category.category);

        if (isTaxDocument) {
          try {
            const complianceResult = await taxComplianceAIService.analyzeTaxDocument(
              organizationId,
              `temp_${Date.now()}`,
              documentBuffer,
              {
                documentType: results.classification.category.category,
                taxYear: new Date().getFullYear(),
                clientId: 'temp',
                entityType: 'individual',
                jurisdiction: 'federal'
              }
            );

            results.compliance = complianceResult;
            execution.stepResults['compliance'] = {
              status: 'completed',
              startTime: new Date(),
              endTime: new Date(),
              inputs: { documentType: results.classification.category.category },
              outputs: {
                complianceScore: complianceResult.analysisResults.compliance.score,
                violationCount: complianceResult.analysisResults.compliance.violations.length
              },
              metrics: {
                duration: complianceResult.processingTime,
                tokensUsed: 800,
                cost: 0.03,
                quality: complianceResult.aiInsights.confidence
              }
            };

            complianceResult.analysisResults.compliance.violations.forEach(violation => {
              if (violation.severity === 'error' || violation.severity === 'critical') {
                recommendations.push(`Compliance: ${violation.description}`);
              }
            });

          } catch (error) {
            console.error('Compliance check failed:', error);
            execution.stepResults['compliance'] = {
              status: 'failed',
              startTime: new Date(),
              endTime: new Date(),
              inputs: { documentType: results.classification?.category.category },
              outputs: {},
              error: error instanceof Error ? error.message : 'Compliance check failed',
              metrics: { duration: 0, tokensUsed: 0, cost: 0 }
            };
          }
        }
      }

      // Calculate final metrics
      const stepResults = Object.values(execution.stepResults);
      const totalDuration = stepResults.reduce((sum, step) => sum + step.metrics.duration, 0);
      const totalCost = stepResults.reduce((sum, step) => sum + step.metrics.cost, 0);
      const completedSteps = stepResults.filter(step => step.status === 'completed').length;
      const qualityScores = stepResults
        .filter(step => step.metrics.quality !== undefined)
        .map(step => step.metrics.quality!);
      const qualityScore = qualityScores.length > 0 ?
        qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;

      // Update execution
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.totalMetrics = {
        duration: totalDuration,
        tokensUsed: stepResults.reduce((sum, step) => sum + step.metrics.tokensUsed, 0),
        cost: totalCost,
        stepsCompleted: completedSteps,
        stepsTotal: stepResults.length
      };

      // Save execution results
      await this.saveWorkflowExecution(execution);

      return {
        executionId: execution.id,
        results,
        metrics: {
          totalDuration,
          totalCost,
          qualityScore,
          stepsCompleted: completedSteps
        },
        recommendations: recommendations.length > 0 ? recommendations : undefined
      };

    } catch (error) {
      console.error('Document processing failed:', error);
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI-powered financial insights with comprehensive analysis
   */
  async generateComprehensiveFinancialAnalysis(
    organizationId: string,
    userId: string,
    financialData: {
      transactions: any[];
      balanceSheet?: any;
      profitLoss?: any;
      cashFlow?: any;
      period: string;
    },
    options: {
      includeRiskAssessment?: boolean;
      includeTaxOptimization?: boolean;
      includeComplianceCheck?: boolean;
      focusAreas?: string[];
    } = {}
  ): Promise<{
    insights: any[];
    riskAssessment?: any;
    taxOptimization?: any[];
    complianceAlerts?: any[];
    recommendations: any[];
    executionMetrics: {
      duration: number;
      cost: number;
      confidence: number;
    };
  }> {
    try {
      const startTime = Date.now();
      let totalCost = 0;
      const confidenceScores: number[] = [];

      // Monitor the request
      const monitoringResult = await aiMonitoringSafetyService.monitorAIRequest(
        organizationId,
        userId,
        {
          service: 'financial_analysis',
          operation: 'comprehensive_analysis',
          content: JSON.stringify(financialData).substring(0, 1000),
          metadata: options
        }
      );

      if (!monitoringResult.allowed) {
        throw new Error('Request blocked by AI safety systems');
      }

      // Step 1: Generate basic financial insights
      const insights = await openaiService.generateFinancialInsights(
        organizationId,
        financialData,
        {
          includeRecommendations: true,
          focusAreas: options.focusAreas,
          riskAssessment: options.includeRiskAssessment
        }
      );

      totalCost += 0.15; // Estimated cost
      confidenceScores.push(...insights.map(i => i.confidence));

      let riskAssessment;
      if (options.includeRiskAssessment) {
        // Step 2: Risk assessment (mock client data for example)
        try {
          riskAssessment = await taxComplianceAIService.assessClientComplianceRisk(
            organizationId,
            'temp_client',
            {
              includeHistoricalData: true,
              focusAreas: ['financial_risk', 'compliance_risk'],
              assessmentDepth: 'comprehensive'
            }
          );
          totalCost += 0.10;
          confidenceScores.push(riskAssessment.confidence);
        } catch (error) {
          console.warn('Risk assessment failed:', error);
        }
      }

      let taxOptimization;
      if (options.includeTaxOptimization) {
        // Step 3: Tax optimization recommendations
        try {
          taxOptimization = await openaiService.generateTaxOptimizationSuggestions(
            organizationId,
            {
              entityType: 'individual',
              income: financialData.profitLoss?.netIncome || 100000,
              expenses: financialData.transactions.filter(t => t.amount < 0) || [],
              deductions: [],
              state: 'CA'
            },
            new Date().getFullYear()
          );
          totalCost += 0.08;
          confidenceScores.push(...taxOptimization.map(t => t.confidence));
        } catch (error) {
          console.warn('Tax optimization failed:', error);
        }
      }

      let complianceAlerts;
      if (options.includeComplianceCheck) {
        // Step 4: Compliance alerts
        try {
          complianceAlerts = await openaiService.generateComplianceAlerts(
            organizationId,
            [{
              id: 'temp_client',
              entityType: 'individual',
              state: 'CA',
              industry: 'professional_services'
            }],
            90 // 90 days ahead
          );
          totalCost += 0.05;
        } catch (error) {
          console.warn('Compliance check failed:', error);
        }
      }

      // Step 5: Generate comprehensive recommendations
      const recommendations = await this.synthesizeRecommendations(
        insights,
        riskAssessment,
        taxOptimization,
        complianceAlerts
      );

      const duration = Date.now() - startTime;
      const confidence = confidenceScores.length > 0 ?
        confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length : 0.8;

      return {
        insights,
        riskAssessment,
        taxOptimization,
        complianceAlerts,
        recommendations,
        executionMetrics: {
          duration,
          cost: totalCost,
          confidence
        }
      };

    } catch (error) {
      console.error('Comprehensive financial analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Smart email generation with context awareness
   */
  async generateSmartEmail(
    organizationId: string,
    userId: string,
    emailRequest: {
      purpose: string;
      clientId: string;
      context: Record<string, any>;
      urgency?: 'low' | 'normal' | 'high';
      tone?: 'professional' | 'friendly' | 'formal';
      includeAttachments?: boolean;
    }
  ): Promise<{
    draft: any;
    alternatives: any[];
    complianceCheck: any;
    suggestions: string[];
    metrics: {
      confidence: number;
      estimatedEngagement: number;
      processingTime: number;
    };
  }> {
    try {
      const startTime = Date.now();

      // Monitor the request
      const monitoringResult = await aiMonitoringSafetyService.monitorAIRequest(
        organizationId,
        userId,
        {
          service: 'communication',
          operation: 'email_generation',
          content: JSON.stringify(emailRequest.context).substring(0, 500),
          metadata: emailRequest
        }
      );

      if (!monitoringResult.allowed) {
        throw new Error('Request blocked by AI safety systems');
      }

      // Get communication context
      const context = await communicationAIService.getCommunicationContext?.(emailRequest.clientId) ||
        await this.buildCommunicationContext(emailRequest.clientId, organizationId);

      // Generate primary email draft
      const primaryDraft = await communicationAIService.generatePersonalizedEmail(
        organizationId,
        'default_template',
        context,
        {
          purpose: emailRequest.purpose,
          urgency: emailRequest.urgency,
          includeAttachments: emailRequest.includeAttachments
        }
      );

      // Generate alternative versions
      const alternatives = await this.generateEmailAlternatives(
        organizationId,
        emailRequest,
        context
      );

      // Real-time assistance for optimization
      const realtimeAssistance = await communicationAIService.getRealtimeCommunicationAssistance(
        organizationId,
        userId,
        {
          to: emailRequest.clientId,
          subject: primaryDraft.draft.subject,
          body: primaryDraft.draft.body,
          clientId: emailRequest.clientId
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        draft: primaryDraft.draft,
        alternatives,
        complianceCheck: primaryDraft.complianceCheck,
        suggestions: [
          ...realtimeAssistance.suggestions.body,
          ...realtimeAssistance.optimizations.map(opt => opt.suggestion)
        ],
        metrics: {
          confidence: primaryDraft.complianceCheck.isCompliant ? 0.9 : 0.7,
          estimatedEngagement: realtimeAssistance.predictedOutcome.engagementScore,
          processingTime
        }
      };

    } catch (error) {
      console.error('Smart email generation failed:', error);
      throw new Error(`Email generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AI service status and capabilities
   */
  async getServiceStatus(): Promise<{
    orchestrator: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      uptime: number;
      version: string;
    };
    services: AIServiceHealth[];
    capabilities: AICapabilityMatrix;
    usage: {
      totalRequests: number;
      totalCost: number;
      averageLatency: number;
      errorRate: number;
    };
    quotas: Record<string, number>;
  }> {
    try {
      const orchestratorUptime = Date.now() - (this.startTime || Date.now());
      const services = Array.from(this.serviceHealth.values());

      // Calculate usage statistics (last 24 hours)
      const usage = await this.calculateRecentUsage();

      // Get quota information
      const quotas = await this.getCurrentQuotas();

      const orchestratorStatus = services.every(s => s.status === 'healthy') ? 'healthy' :
        services.some(s => s.status === 'unhealthy') ? 'degraded' : 'healthy';

      return {
        orchestrator: {
          status: orchestratorStatus,
          uptime: orchestratorUptime,
          version: '1.0.0'
        },
        services,
        capabilities: this.capabilities,
        usage,
        quotas
      };

    } catch (error) {
      console.error('Failed to get service status:', error);
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private initializeCapabilities(): AICapabilityMatrix {
    return {
      documentProcessing: {
        ocr: true,
        classification: true,
        dataExtraction: true,
        qualityAssessment: true,
        batchProcessing: true
      },
      financialAnalysis: {
        insightsGeneration: true,
        anomalyDetection: true,
        riskAssessment: true,
        forecasting: false, // Not implemented yet
        optimization: true
      },
      communication: {
        emailGeneration: true,
        sentimentAnalysis: true,
        languageTranslation: false, // Not implemented yet
        summarization: true,
        personalization: true
      },
      taxCompliance: {
        documentAnalysis: true,
        complianceChecking: true,
        deadlineTracking: true,
        optimizationSuggestions: true,
        riskScoring: true
      },
      monitoring: {
        usageTracking: true,
        qualityAssessment: true,
        costMonitoring: true,
        safetyChecking: true,
        auditLogging: true
      }
    };
  }

  private async checkAllServicesHealth(): Promise<void> {
    const services = [
      { name: 'openai', service: openaiService },
      { name: 'document_intelligence', service: documentIntelligenceService },
      { name: 'ocr', service: enhancedOCRService },
      { name: 'communication', service: communicationAIService },
      { name: 'tax_compliance', service: taxComplianceAIService },
      { name: 'monitoring', service: aiMonitoringSafetyService }
    ];

    for (const { name, service } of services) {
      try {
        const health = await this.checkServiceHealth(name, service);
        this.serviceHealth.set(name, health);
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        this.serviceHealth.set(name, {
          service: name,
          status: 'unhealthy',
          responseTime: -1,
          errorRate: 1.0,
          lastCheck: new Date(),
          capabilities: [],
          limitations: ['Service unavailable'],
          version: 'unknown'
        });
      }
    }
  }

  private async checkServiceHealth(name: string, service: any): Promise<AIServiceHealth> {
    const startTime = Date.now();

    try {
      // Check if service has health check method
      if (typeof service.checkHealth === 'function') {
        const healthResult = await service.checkHealth();
        return {
          service: name,
          status: healthResult.isHealthy ? 'healthy' : 'unhealthy',
          responseTime: healthResult.responseTime,
          errorRate: 0,
          lastCheck: new Date(),
          capabilities: this.getServiceCapabilities(name),
          limitations: healthResult.error ? [healthResult.error] : [],
          version: '1.0.0'
        };
      } else if (typeof service.isReady === 'function') {
        const isReady = service.isReady();
        return {
          service: name,
          status: isReady ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          errorRate: 0,
          lastCheck: new Date(),
          capabilities: this.getServiceCapabilities(name),
          limitations: isReady ? [] : ['Service not ready'],
          version: '1.0.0'
        };
      } else {
        return {
          service: name,
          status: 'healthy',
          responseTime: Date.now() - startTime,
          errorRate: 0,
          lastCheck: new Date(),
          capabilities: this.getServiceCapabilities(name),
          limitations: [],
          version: '1.0.0'
        };
      }
    } catch (error) {
      return {
        service: name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        errorRate: 1.0,
        lastCheck: new Date(),
        capabilities: [],
        limitations: [error instanceof Error ? error.message : 'Unknown error'],
        version: 'unknown'
      };
    }
  }

  private getServiceCapabilities(serviceName: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      openai: ['text_generation', 'analysis', 'summarization', 'insights'],
      document_intelligence: ['classification', 'data_extraction', 'anomaly_detection'],
      ocr: ['text_recognition', 'document_processing', 'quality_assessment'],
      communication: ['email_generation', 'sentiment_analysis', 'personalization'],
      tax_compliance: ['compliance_checking', 'risk_assessment', 'optimization'],
      monitoring: ['usage_tracking', 'quality_monitoring', 'safety_checking']
    };

    return capabilityMap[serviceName] || [];
  }

  private async loadWorkflowDefinitions(): Promise<void> {
    try {
      const workflows = await prisma.aiWorkflow.findMany({
        where: { isActive: true }
      });

      workflows.forEach(workflow => {
        this.workflowDefinitions.set(workflow.id, workflow as any);
      });

      console.log(`Loaded ${workflows.length} workflow definitions`);
    } catch (error) {
      console.error('Failed to load workflow definitions:', error);
    }
  }

  private async loadRoutingRules(): Promise<void> {
    try {
      const rules = await prisma.smartRoutingRule.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' }
      });

      rules.forEach(rule => {
        this.routingRules.set(rule.id, rule as any);
      });

      console.log(`Loaded ${rules.length} routing rules`);
    } catch (error) {
      console.error('Failed to load routing rules:', error);
    }
  }

  private startHealthMonitoring(): void {
    // Check service health every 5 minutes
    setInterval(async () => {
      try {
        await this.checkAllServicesHealth();
        this.emit('health_check_completed', {
          services: Array.from(this.serviceHealth.values()),
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private startWorkflowCleanup(): void {
    // Clean up completed executions every hour
    setInterval(async () => {
      try {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        for (const [id, execution] of this.activeExecutions.entries()) {
          if (execution.status === 'completed' && execution.endTime && execution.endTime < cutoffTime) {
            this.activeExecutions.delete(id);
          }
        }

        console.log(`Cleaned up old workflow executions. Active: ${this.activeExecutions.size}`);
      } catch (error) {
        console.error('Workflow cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private async validateServiceAvailability(organizationId: string, serviceType: string): Promise<void> {
    // Check if required services are healthy
    const requiredServices = this.getRequiredServices(serviceType);

    for (const serviceName of requiredServices) {
      const health = this.serviceHealth.get(serviceName);
      if (!health || health.status === 'unhealthy') {
        throw new Error(`Required service ${serviceName} is not available`);
      }
    }

    // Check quotas
    const quotas = await this.checkServiceQuotas(organizationId, requiredServices);
    const exceededQuotas = quotas.filter(q => q.remaining <= 0);

    if (exceededQuotas.length > 0) {
      throw new Error(`Quota exceeded for services: ${exceededQuotas.map(q => q.service).join(', ')}`);
    }
  }

  private getRequiredServices(serviceType: string): string[] {
    const serviceMap: Record<string, string[]> = {
      document_processing: ['ocr', 'document_intelligence'],
      financial_analysis: ['openai'],
      communication: ['openai', 'communication'],
      tax_compliance: ['tax_compliance', 'openai'],
      monitoring: ['monitoring']
    };

    return serviceMap[serviceType] || [];
  }

  private async checkServiceQuotas(organizationId: string, services: string[]): Promise<AIServiceQuota[]> {
    const quotas: AIServiceQuota[] = [];

    for (const service of services) {
      try {
        const quota = await prisma.usageQuota.findFirst({
          where: {
            organizationId,
            service,
            isActive: true
          }
        });

        if (quota) {
          quotas.push({
            organizationId,
            service,
            quotaType: quota.quotaType as any,
            allocated: quota.limit,
            used: quota.currentUsage,
            remaining: quota.limit - quota.currentUsage,
            resetDate: quota.resetDate,
            overagePolicy: 'block'
          });
        }
      } catch (error) {
        console.error(`Failed to check quota for ${service}:`, error);
      }
    }

    return quotas;
  }

  private async selectOptimalWorkflow(
    organizationId: string,
    category: string,
    context: Record<string, any>
  ): Promise<string> {
    // Find best workflow based on context and routing rules
    const workflows = Array.from(this.workflowDefinitions.values())
      .filter(w => w.organizationId === organizationId && w.category === category);

    if (workflows.length === 0) {
      // Create default workflow
      return await this.createDefaultWorkflow(organizationId, category);
    }

    // Apply routing rules
    for (const rule of Array.from(this.routingRules.values())) {
      if (this.evaluateRoutingConditions(rule.conditions, context)) {
        const matchingWorkflow = workflows.find(w => w.name === rule.targetService);
        if (matchingWorkflow) {
          return matchingWorkflow.id;
        }
      }
    }

    // Return first available workflow
    return workflows[0].id;
  }

  private evaluateRoutingConditions(conditions: any[], context: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = context[condition.field];
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        default:
          return false;
      }
    });
  }

  private async createDefaultWorkflow(organizationId: string, category: string): Promise<string> {
    const workflowId = `default_${category}_${Date.now()}`;

    const workflow: AIWorkflowDefinition = {
      id: workflowId,
      name: `Default ${category} Workflow`,
      description: `Auto-generated workflow for ${category}`,
      category: category as any,
      organizationId,
      isActive: true,
      steps: this.getDefaultSteps(category),
      errorHandling: {
        strategy: 'continue',
        notificationSettings: {
          onError: false,
          onComplete: false,
          recipients: []
        }
      },
      monitoring: {
        trackUsage: true,
        trackQuality: true,
        trackCosts: true,
        alertThresholds: {}
      },
      createdAt: new Date(),
      lastUpdated: new Date(),
      createdBy: 'system'
    };

    this.workflowDefinitions.set(workflowId, workflow);

    return workflowId;
  }

  private getDefaultSteps(category: string): AIWorkflowDefinition['steps'] {
    const stepMap: Record<string, AIWorkflowDefinition['steps']> = {
      document_processing: [
        {
          id: 'ocr',
          name: 'OCR Processing',
          service: 'form_recognizer',
          operation: 'analyze_document',
          inputs: {},
          outputs: {},
          onSuccess: 'classification',
          timeout: 30000,
          retries: 2
        },
        {
          id: 'classification',
          name: 'Document Classification',
          service: 'azure_cognitive',
          operation: 'classify_document',
          inputs: {},
          outputs: {},
          timeout: 15000,
          retries: 1
        }
      ],
      financial_analysis: [
        {
          id: 'insights',
          name: 'Generate Insights',
          service: 'openai',
          operation: 'generate_insights',
          inputs: {},
          outputs: {},
          timeout: 45000,
          retries: 2
        }
      ]
    };

    return stepMap[category] || [];
  }

  private async executeWorkflow(
    workflowId: string,
    organizationId: string,
    userId: string,
    context: Record<string, any>
  ): Promise<AIWorkflowExecution> {
    const workflow = this.workflowDefinitions.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: AIWorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      organizationId,
      userId,
      status: 'running',
      startTime: new Date(),
      stepResults: {},
      totalMetrics: {
        duration: 0,
        tokensUsed: 0,
        cost: 0,
        stepsCompleted: 0,
        stepsTotal: workflow.steps.length
      },
      context
    };

    this.activeExecutions.set(execution.id, execution);

    return execution;
  }

  private async saveWorkflowExecution(execution: AIWorkflowExecution): Promise<void> {
    try {
      await prisma.aiWorkflowExecution.create({
        data: {
          id: execution.id,
          workflowId: execution.workflowId,
          organizationId: execution.organizationId,
          userId: execution.userId,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          stepResults: execution.stepResults,
          totalMetrics: execution.totalMetrics,
          error: execution.error,
          context: execution.context
        }
      });
    } catch (error) {
      console.error('Failed to save workflow execution:', error);
    }
  }

  private async synthesizeRecommendations(
    insights: any[],
    riskAssessment?: any,
    taxOptimization?: any[],
    complianceAlerts?: any[]
  ): Promise<any[]> {
    const recommendations: any[] = [];

    // High-priority insights
    insights
      .filter(insight => insight.severity === 'high' || insight.severity === 'critical')
      .forEach(insight => {
        recommendations.push({
          category: 'financial_insight',
          priority: insight.severity === 'critical' ? 'urgent' : 'high',
          title: insight.title,
          description: insight.description,
          actionItems: insight.recommendations?.map((r: any) => r.action) || [],
          estimatedImpact: insight.impact?.financial || 'Unknown'
        });
      });

    // Risk-based recommendations
    if (riskAssessment) {
      riskAssessment.recommendations
        .filter((rec: any) => rec.priority === 'high')
        .forEach((rec: any) => {
          recommendations.push({
            category: 'risk_mitigation',
            priority: rec.priority,
            title: rec.action,
            description: rec.reasoning,
            actionItems: [rec.action],
            estimatedImpact: rec.estimatedImpact
          });
        });
    }

    // Tax optimization recommendations
    if (taxOptimization) {
      taxOptimization
        .filter(opt => opt.potentialSavings > 1000)
        .slice(0, 3) // Top 3
        .forEach(opt => {
          recommendations.push({
            category: 'tax_optimization',
            priority: opt.potentialSavings > 10000 ? 'high' : 'medium',
            title: opt.title,
            description: opt.description,
            actionItems: opt.requirements,
            estimatedImpact: `$${opt.potentialSavings.toLocaleString()} potential savings`
          });
        });
    }

    // Compliance alerts
    if (complianceAlerts) {
      complianceAlerts
        .filter((alert: any) => alert.severity === 'critical' || alert.severity === 'warning')
        .forEach((alert: any) => {
          recommendations.push({
            category: 'compliance',
            priority: alert.severity === 'critical' ? 'urgent' : 'high',
            title: alert.title,
            description: alert.description,
            actionItems: alert.requiredActions,
            estimatedImpact: 'Compliance requirement'
          });
        });
    }

    // Sort by priority and return top 10
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return recommendations
      .sort((a, b) => (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0))
      .slice(0, 10);
  }

  private async buildCommunicationContext(clientId: string, organizationId: string): Promise<any> {
    // Build basic communication context
    return {
      clientId,
      clientType: 'individual',
      relationship: {
        duration: 12,
        serviceTypes: ['tax_preparation'],
        lastInteraction: new Date(),
        communicationPreferences: {
          frequency: 'medium',
          channels: ['email'],
          tone: 'professional',
          language: 'en'
        }
      },
      currentSituation: {
        taxSeason: new Date().getMonth() < 4,
        deadlines: [],
        openItems: [],
        recentTransactions: [],
        flaggedIssues: []
      },
      historicalData: {
        responseRates: {},
        preferredTopics: [],
        commonQuestions: [],
        satisfactionScores: []
      }
    };
  }

  private async generateEmailAlternatives(
    organizationId: string,
    emailRequest: any,
    context: any
  ): Promise<any[]> {
    // Generate 2 alternative email drafts with different tones
    const alternatives: any[] = [];

    try {
      // More formal alternative
      const formalDraft = await communicationAIService.generatePersonalizedEmail(
        organizationId,
        'default_template',
        context,
        {
          ...emailRequest,
          tone: 'formal'
        }
      );

      alternatives.push({
        variant: 'formal',
        ...formalDraft.draft
      });

      // More friendly alternative
      const friendlyDraft = await communicationAIService.generatePersonalizedEmail(
        organizationId,
        'default_template',
        context,
        {
          ...emailRequest,
          tone: 'friendly'
        }
      );

      alternatives.push({
        variant: 'friendly',
        ...friendlyDraft.draft
      });

    } catch (error) {
      console.warn('Failed to generate email alternatives:', error);
    }

    return alternatives;
  }

  private async calculateRecentUsage(): Promise<{
    totalRequests: number;
    totalCost: number;
    averageLatency: number;
    errorRate: number;
  }> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentLogs = await prisma.aiUsageLog.findMany({
        where: {
          timestamp: { gte: oneDayAgo }
        }
      });

      const totalRequests = recentLogs.length;
      const totalCost = recentLogs.reduce((sum, log) => sum + log.cost, 0);
      const totalLatency = recentLogs.reduce((sum, log) => sum + (log.latency || 0), 0);
      const errors = recentLogs.filter(log => !log.success).length;

      return {
        totalRequests,
        totalCost,
        averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
        errorRate: totalRequests > 0 ? errors / totalRequests : 0
      };

    } catch (error) {
      console.error('Failed to calculate recent usage:', error);
      return {
        totalRequests: 0,
        totalCost: 0,
        averageLatency: 0,
        errorRate: 0
      };
    }
  }

  private async getCurrentQuotas(): Promise<Record<string, number>> {
    try {
      const quotas = await prisma.usageQuota.findMany({
        where: { isActive: true }
      });

      const quotaMap: Record<string, number> = {};
      quotas.forEach(quota => {
        quotaMap[`${quota.service}_${quota.quotaType}`] = quota.currentUsage / quota.limit;
      });

      return quotaMap;

    } catch (error) {
      console.error('Failed to get current quotas:', error);
      return {};
    }
  }

  private startTime = Date.now();

  /**
   * Check if orchestrator is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get orchestrator capabilities
   */
  getCapabilities(): AICapabilityMatrix {
    return this.capabilities;
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();

// Export types
export type {
  AIServiceHealth,
  AIWorkflowDefinition,
  AIWorkflowExecution,
  AICapabilityMatrix,
  AIServiceQuota,
  SmartRoutingRule
};