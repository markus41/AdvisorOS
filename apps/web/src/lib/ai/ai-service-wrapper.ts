/**
 * AI Service Wrapper with Token Management
 * Unified interface for all AI services with automatic cost tracking
 */

import { TokenManagementService, type TokenUsage } from '@/server/services/token-management.service';
import { OCRService } from '@/server/services/ocr.service';
import { AIInsightsService } from '@/server/services/ai-insights.service';
import { AICommunicationService } from '@/server/services/ai-communication.service';
import {
  FINANCIAL_ANALYSIS_PROMPTS,
  REPORT_GENERATION_PROMPTS,
  EMAIL_TEMPLATES,
  DATA_EXTRACTION_PROMPTS,
  PromptManager,
  type FinancialContext,
  type ReportContext,
  type EmailContext,
  type ExtractionContext
} from '@/lib/prompts';

export interface AIServiceOptions {
  userId: string;
  clientId?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  budgetLimit?: number;
}

export interface AIResponse<T = any> {
  data: T;
  usage: TokenUsage;
  cost: number;
  model: string;
  cached?: boolean;
}

export class AIServiceWrapper {
  private static instance: AIServiceWrapper;
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): AIServiceWrapper {
    if (!AIServiceWrapper.instance) {
      AIServiceWrapper.instance = new AIServiceWrapper();
    }
    return AIServiceWrapper.instance;
  }

  /**
   * Document OCR with automatic token tracking
   */
  async processDocument(
    file: File,
    documentType: string,
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const feature = 'document-processing';

    try {
      // Check usage limits before processing
      await this.checkUsageLimits(options.userId, options.budgetLimit);

      const startTime = Date.now();
      const result = await OCRService.processDocument(file, documentType);
      const processingTime = Date.now() - startTime;

      // Record usage (estimated for OCR services)
      const estimatedTokens: TokenUsage = {
        promptTokens: 500, // Estimated OCR prompt overhead
        completionTokens: Math.ceil(JSON.stringify(result.extractedData).length / 4),
        totalTokens: 500 + Math.ceil(JSON.stringify(result.extractedData).length / 4)
      };

      const usageRecord = await TokenManagementService.recordUsage(
        options.userId,
        feature,
        'form-recognizer', // Azure service
        estimatedTokens,
        {
          documentType,
          fileName: file.name,
          processingTime,
          confidence: result.confidence
        },
        options.clientId
      );

      return {
        data: result,
        usage: estimatedTokens,
        cost: usageRecord.cost.totalCost,
        model: 'form-recognizer'
      };
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  /**
   * Financial analysis with prompt optimization
   */
  async generateFinancialAnalysis(
    context: FinancialContext,
    analysisType: keyof typeof FINANCIAL_ANALYSIS_PROMPTS,
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const feature = 'financial-analysis';

    try {
      await this.checkUsageLimits(options.userId, options.budgetLimit);

      // Get optimized model recommendation
      const modelRec = TokenManagementService.getOptimizedModel('complex', options.budgetLimit);
      const model = options.model || modelRec.model;

      // Generate and optimize prompt
      const promptTemplate = FINANCIAL_ANALYSIS_PROMPTS[analysisType];
      const prompt = promptTemplate(context);
      const optimizedPrompt = PromptManager.optimizeForTokens(prompt, options.maxTokens || 4000);

      // Check cache
      const cacheKey = this.generateCacheKey(feature, optimizedPrompt, model);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      const result = await AIInsightsService.generateFinancialNarrative(
        context.documents,
        context.businessType,
        { model, temperature: options.temperature || 0.1 }
      );

      // Record actual usage
      const usageRecord = await TokenManagementService.recordUsage(
        options.userId,
        feature,
        model,
        result.usage,
        {
          analysisType,
          clientName: context.clientName,
          documentCount: context.documents.length,
          businessType: context.businessType
        },
        options.clientId
      );

      const response: AIResponse = {
        data: result.insights,
        usage: result.usage,
        cost: usageRecord.cost.totalCost,
        model
      };

      // Cache the response
      this.setCachedResponse(cacheKey, response, 3600000); // 1 hour TTL

      return response;
    } catch (error) {
      console.error('Financial analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate reports with cost optimization
   */
  async generateReport(
    context: ReportContext,
    reportType: keyof typeof REPORT_GENERATION_PROMPTS,
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const feature = 'report-generation';

    try {
      await this.checkUsageLimits(options.userId, options.budgetLimit);

      const modelRec = TokenManagementService.getOptimizedModel('moderate', options.budgetLimit);
      const model = options.model || modelRec.model;

      const promptTemplate = REPORT_GENERATION_PROMPTS[reportType];
      const prompt = promptTemplate(context);
      const optimizedPrompt = PromptManager.optimizeForTokens(prompt, options.maxTokens || 3500);

      const cacheKey = this.generateCacheKey(feature, optimizedPrompt, model);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      const result = await AIInsightsService.generateClientReport(
        context.data,
        context.reportType,
        { model, temperature: options.temperature || 0.2 }
      );

      const usageRecord = await TokenManagementService.recordUsage(
        options.userId,
        feature,
        model,
        result.usage,
        {
          reportType,
          clientName: context.clientName,
          period: `${context.period.start.toISOString()} - ${context.period.end.toISOString()}`,
          audience: context.audience
        },
        options.clientId
      );

      const response: AIResponse = {
        data: result.report,
        usage: result.usage,
        cost: usageRecord.cost.totalCost,
        model
      };

      this.setCachedResponse(cacheKey, response, 1800000); // 30 minutes TTL

      return response;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }

  /**
   * Email composition with template optimization
   */
  async composeEmail(
    context: EmailContext,
    emailType: keyof typeof EMAIL_TEMPLATES,
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const feature = 'email-composition';

    try {
      await this.checkUsageLimits(options.userId, options.budgetLimit);

      const modelRec = TokenManagementService.getOptimizedModel('simple', options.budgetLimit);
      const model = options.model || modelRec.model;

      const promptTemplate = EMAIL_TEMPLATES[emailType];
      const prompt = promptTemplate(context);
      const optimizedPrompt = PromptManager.optimizeForTokens(prompt, options.maxTokens || 2000);

      const cacheKey = this.generateCacheKey(feature, optimizedPrompt, model);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      const result = await AICommunicationService.draftClientEmail(
        context.clientName,
        context.purpose,
        context.data || {},
        { model, temperature: options.temperature || 0.3 }
      );

      const usageRecord = await TokenManagementService.recordUsage(
        options.userId,
        feature,
        model,
        result.usage,
        {
          emailType,
          clientName: context.clientName,
          purpose: context.purpose,
          urgency: context.urgency,
          tone: context.tone
        },
        options.clientId
      );

      const response: AIResponse = {
        data: result.email,
        usage: result.usage,
        cost: usageRecord.cost.totalCost,
        model
      };

      this.setCachedResponse(cacheKey, response, 900000); // 15 minutes TTL

      return response;
    } catch (error) {
      console.error('Email composition failed:', error);
      throw error;
    }
  }

  /**
   * Smart search with semantic analysis
   */
  async performSmartSearch(
    query: string,
    filters: any,
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const feature = 'smart-search';

    try {
      await this.checkUsageLimits(options.userId, options.budgetLimit);

      const modelRec = TokenManagementService.getOptimizedModel('moderate', options.budgetLimit);
      const model = options.model || modelRec.model;

      const cacheKey = this.generateCacheKey(feature, query + JSON.stringify(filters), model);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      // Estimate token usage for search
      const estimatedTokens: TokenUsage = {
        promptTokens: Math.ceil(query.length / 4) + 200, // Query + system prompt
        completionTokens: 300, // Estimated response size
        totalTokens: Math.ceil(query.length / 4) + 500
      };

      // Simulate smart search results (would integrate with actual search service)
      const searchResults = {
        results: [],
        suggestions: [],
        totalFound: 0
      };

      const usageRecord = await TokenManagementService.recordUsage(
        options.userId,
        feature,
        model,
        estimatedTokens,
        {
          query,
          filters,
          resultCount: searchResults.totalFound
        },
        options.clientId
      );

      const response: AIResponse = {
        data: searchResults,
        usage: estimatedTokens,
        cost: usageRecord.cost.totalCost,
        model
      };

      this.setCachedResponse(cacheKey, response, 600000); // 10 minutes TTL

      return response;
    } catch (error) {
      console.error('Smart search failed:', error);
      throw error;
    }
  }

  /**
   * Data extraction with validation
   */
  async extractDocumentData(
    context: ExtractionContext,
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const feature = 'data-extraction';

    try {
      await this.checkUsageLimits(options.userId, options.budgetLimit);

      const modelRec = TokenManagementService.getOptimizedModel('moderate', options.budgetLimit);
      const model = options.model || modelRec.model;

      const promptTemplate = DATA_EXTRACTION_PROMPTS[
        `${context.documentType.toUpperCase()}_EXTRACTION` as keyof typeof DATA_EXTRACTION_PROMPTS
      ];

      if (!promptTemplate) {
        throw new Error(`No extraction template found for document type: ${context.documentType}`);
      }

      const prompt = promptTemplate(context);
      const optimizedPrompt = PromptManager.optimizeForTokens(prompt, options.maxTokens || 3000);

      const cacheKey = this.generateCacheKey(feature, optimizedPrompt, model);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      // This would integrate with the OCR service for actual extraction
      const result = await OCRService.extractFormData(context.ocrText, context.documentType);

      const estimatedTokens: TokenUsage = {
        promptTokens: Math.ceil(optimizedPrompt.length / 4),
        completionTokens: Math.ceil(JSON.stringify(result).length / 4),
        totalTokens: Math.ceil(optimizedPrompt.length / 4) + Math.ceil(JSON.stringify(result).length / 4)
      };

      const usageRecord = await TokenManagementService.recordUsage(
        options.userId,
        feature,
        model,
        estimatedTokens,
        {
          documentType: context.documentType,
          ocrTextLength: context.ocrText.length,
          extractedFields: Object.keys(result).length,
          confidence: context.confidence
        },
        options.clientId
      );

      const response: AIResponse = {
        data: result,
        usage: estimatedTokens,
        cost: usageRecord.cost.totalCost,
        model
      };

      this.setCachedResponse(cacheKey, response, 7200000); // 2 hours TTL

      return response;
    } catch (error) {
      console.error('Data extraction failed:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string, days = 30) {
    return await TokenManagementService.getUsageStats(userId, days);
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(userId: string, startDate: Date, endDate: Date) {
    return await TokenManagementService.generateUsageReport(userId, startDate, endDate);
  }

  // Private helper methods

  private async checkUsageLimits(userId: string, budgetLimit?: number) {
    const limits = {
      dailyTokenLimit: 100000,
      monthlyTokenLimit: 1000000,
      dailyCostLimit: budgetLimit || 50,
      monthlyCostLimit: budgetLimit ? budgetLimit * 30 : 200,
      perRequestLimit: 8000
    };

    const limitCheck = await TokenManagementService.checkUsageLimits(userId, limits);

    if (!limitCheck.withinLimits) {
      throw new Error(`Usage limit exceeded: ${limitCheck.warnings.join(', ')}`);
    }

    return limitCheck;
  }

  private generateCacheKey(feature: string, content: string, model: string): string {
    const hash = this.simpleHash(content);
    return `${feature}:${model}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getCachedResponse(key: string): AIResponse | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.requestCache.delete(key);
    }
    return null;
  }

  private setCachedResponse(key: string, response: AIResponse, ttl: number) {
    this.requestCache.set(key, {
      data: response,
      timestamp: Date.now(),
      ttl
    });

    // Clean up old cache entries periodically
    if (this.requestCache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.requestCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const aiService = AIServiceWrapper.getInstance();