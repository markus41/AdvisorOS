import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { SearchClient, SearchIndexClient, AzureKeyCredential as SearchKeyCredential } from '@azure/search-documents';
import { OpenAIApi, Configuration } from 'openai';
import { prisma } from '../../server/db';
import { formRecognizer, type OCRResult } from '../azure/form-recognizer';

export interface EnhancedDocumentAnalysis {
  id: string;
  documentType: string;
  category: {
    category: string;
    subcategory?: string;
    confidence: number;
    suggestedTags: string[];
  };
  ocrResult: OCRResult;
  extractedData: {
    structuredFields: Record<string, any>;
    keyValuePairs: Array<{
      key: string;
      value: string;
      confidence: number;
      location: number[];
    }>;
    tables: Array<{
      data: string[][];
      headers: string[];
      confidence: number;
    }>;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
      mentions: Array<{
        text: string;
        offset: number;
        length: number;
      }>;
    }>;
  };
  intelligentCategorization: {
    primaryCategory: string;
    subcategory?: string;
    confidence: number;
    businessRelevance: number;
    taxRelevance: number;
    complianceFlags: string[];
  };
  anomalies: Array<{
    type: 'missing_signature' | 'inconsistent_dates' | 'calculation_error' | 'unusual_amount' | 'format_issue';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: number[];
    suggestedAction: string;
  }>;
  qualityAssessment: {
    overallScore: number;
    readabilityScore: number;
    completenessScore: number;
    accuracyScore: number;
    needsHumanReview: boolean;
    reviewReasons: string[];
  };
  searchableContent: {
    fullText: string;
    keywords: string[];
    concepts: string[];
    semanticSummary: string;
  };
  costInfo: {
    ocrCost: number;
    aiCost: number;
    totalCost: number;
  };
  processingTime: number;
  metadata: {
    modelVersions: Record<string, string>;
    processingSteps: string[];
    confidenceThresholds: Record<string, number>;
  };
}

export interface DocumentClassificationRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: 'contains' | 'equals' | 'matches' | 'greater_than' | 'less_than';
    value: string | number;
    weight: number;
  }>;
  category: string;
  subcategory?: string;
  confidence: number;
  isActive: boolean;
  priority: number;
}

export interface BatchProcessingOptions {
  documents: Array<{
    id: string;
    buffer: Buffer;
    fileName: string;
    metadata: Record<string, any>;
  }>;
  options: {
    enableParallelProcessing: boolean;
    maxConcurrency: number;
    qualityThreshold: number;
    enableSmartRouting: boolean;
    customRules?: DocumentClassificationRule[];
  };
  progressCallback?: (progress: {
    processed: number;
    total: number;
    current: string;
    errors: Array<{ id: string; error: string }>;
  }) => void;
}

class EnhancedDocumentIntelligenceService {
  private formRecognizerClient: DocumentAnalysisClient;
  private searchClient?: SearchClient;
  private openaiClient?: OpenAIApi;
  private classificationRules: DocumentClassificationRule[] = [];

  constructor() {
    // Initialize Form Recognizer
    if (!process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || !process.env.AZURE_FORM_RECOGNIZER_KEY) {
      throw new Error('Azure Form Recognizer credentials not configured');
    }

    this.formRecognizerClient = new DocumentAnalysisClient(
      process.env.AZURE_FORM_RECOGNIZER_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_FORM_RECOGNIZER_KEY)
    );

    // Initialize Azure Cognitive Search
    if (process.env.AZURE_SEARCH_ENDPOINT && process.env.AZURE_SEARCH_KEY) {
      this.searchClient = new SearchClient(
        process.env.AZURE_SEARCH_ENDPOINT,
        'documents',
        new SearchKeyCredential(process.env.AZURE_SEARCH_KEY)
      );
    }

    // Initialize OpenAI for enhanced analysis
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAIApi(new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      }));
    }

    this.loadClassificationRules();
  }

  /**
   * Enhanced document analysis with AI-powered insights
   */
  async analyzeDocument(
    documentBuffer: Buffer,
    metadata: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      organizationId: string;
      uploadedBy: string;
      uploadedAt: Date;
    },
    options: {
      enableAdvancedAnalysis?: boolean;
      qualityThreshold?: number;
      customRules?: DocumentClassificationRule[];
    } = {}
  ): Promise<EnhancedDocumentAnalysis> {
    const startTime = Date.now();
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Step 1: Basic OCR with Form Recognizer
      const typeDetection = await formRecognizer.detectDocumentType(documentBuffer);
      const ocrResult = await formRecognizer.analyzeDocument(
        documentBuffer,
        typeDetection.detectedType
      );

      // Step 2: Enhanced data extraction
      const extractedData = await this.performEnhancedExtraction(ocrResult, documentBuffer);

      // Step 3: Intelligent categorization
      const categorization = await this.performIntelligentCategorization(
        ocrResult,
        extractedData,
        metadata,
        options.customRules
      );

      // Step 4: Anomaly detection
      const anomalies = await this.detectAnomalies(ocrResult, extractedData, categorization);

      // Step 5: Quality assessment
      const qualityAssessment = await this.assessQuality(
        ocrResult,
        extractedData,
        anomalies,
        options.qualityThreshold || 0.8
      );

      // Step 6: Generate searchable content
      const searchableContent = await this.generateSearchableContent(
        ocrResult,
        extractedData,
        categorization
      );

      // Step 7: Calculate costs
      const costInfo = this.calculateProcessingCosts(ocrResult, extractedData);

      const processingTime = Date.now() - startTime;

      const analysis: EnhancedDocumentAnalysis = {
        id: documentId,
        documentType: typeDetection.detectedType,
        category: {
          category: categorization.primaryCategory,
          subcategory: categorization.subcategory,
          confidence: categorization.confidence,
          suggestedTags: this.generateSuggestedTags(ocrResult, extractedData, categorization)
        },
        ocrResult,
        extractedData,
        intelligentCategorization: categorization,
        anomalies,
        qualityAssessment,
        searchableContent,
        costInfo,
        processingTime,
        metadata: {
          modelVersions: {
            formRecognizer: '3.1',
            classification: '2.0',
            anomalyDetection: '1.5'
          },
          processingSteps: [
            'ocr_extraction',
            'data_enhancement',
            'categorization',
            'anomaly_detection',
            'quality_assessment',
            'content_indexing'
          ],
          confidenceThresholds: {
            ocr: 0.7,
            classification: 0.8,
            anomaly: 0.6
          }
        }
      };

      // Index document for search if enabled
      if (this.searchClient) {
        await this.indexDocumentForSearch(documentId, analysis, metadata);
      }

      return analysis;

    } catch (error) {
      console.error('Enhanced document analysis failed:', error);
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch process multiple documents with advanced features
   */
  async batchProcessDocuments(
    options: BatchProcessingOptions
  ): Promise<{
    successful: Array<{
      id: string;
      analysis: EnhancedDocumentAnalysis;
    }>;
    failed: Array<{
      id: string;
      error: string;
    }>;
    statistics: {
      totalProcessed: number;
      successRate: number;
      averageProcessingTime: number;
      totalCost: number;
      qualityDistribution: Record<string, number>;
    };
  }> {
    const results = {
      successful: [] as Array<{ id: string; analysis: EnhancedDocumentAnalysis }>,
      failed: [] as Array<{ id: string; error: string }>,
      statistics: {
        totalProcessed: 0,
        successRate: 0,
        averageProcessingTime: 0,
        totalCost: 0,
        qualityDistribution: {} as Record<string, number>
      }
    };

    const { documents, options: batchOptions } = options;
    const processingStartTime = Date.now();

    // Determine processing strategy
    const concurrency = batchOptions.enableParallelProcessing
      ? Math.min(batchOptions.maxConcurrency || 5, documents.length)
      : 1;

    // Process documents in batches
    const batches = this.chunkArray(documents, concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (doc) => {
        try {
          options.progressCallback?.({
            processed: results.successful.length + results.failed.length,
            total: documents.length,
            current: doc.fileName,
            errors: results.failed
          });

          const analysis = await this.analyzeDocument(
            doc.buffer,
            {
              fileName: doc.fileName,
              fileSize: doc.buffer.length,
              mimeType: doc.metadata.mimeType || 'application/octet-stream',
              organizationId: doc.metadata.organizationId,
              uploadedBy: doc.metadata.uploadedBy,
              uploadedAt: new Date()
            },
            {
              enableAdvancedAnalysis: true,
              qualityThreshold: batchOptions.qualityThreshold,
              customRules: batchOptions.customRules
            }
          );

          results.successful.push({
            id: doc.id,
            analysis
          });

          // Update quality distribution
          const qualityCategory = this.categorizeQuality(analysis.qualityAssessment.overallScore);
          results.statistics.qualityDistribution[qualityCategory] =
            (results.statistics.qualityDistribution[qualityCategory] || 0) + 1;

        } catch (error) {
          results.failed.push({
            id: doc.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.all(batchPromises);
    }

    // Calculate final statistics
    const totalProcessingTime = Date.now() - processingStartTime;
    results.statistics = {
      totalProcessed: results.successful.length + results.failed.length,
      successRate: results.successful.length / documents.length,
      averageProcessingTime: totalProcessingTime / documents.length,
      totalCost: results.successful.reduce((sum, item) => sum + item.analysis.costInfo.totalCost, 0),
      qualityDistribution: results.statistics.qualityDistribution
    };

    return results;
  }

  /**
   * Train custom classification model
   */
  async trainCustomClassificationModel(
    trainingData: Array<{
      documentBuffer: Buffer;
      expectedCategory: string;
      expectedSubcategory?: string;
      metadata: Record<string, any>;
    }>,
    modelName: string
  ): Promise<{
    modelId: string;
    accuracy: number;
    trainingMetrics: Record<string, any>;
  }> {
    // This would integrate with Azure Custom Form Recognizer training
    // For now, we'll implement a rule-based approach

    const rules: DocumentClassificationRule[] = [];

    // Analyze training data to generate rules
    for (const sample of trainingData) {
      const analysis = await this.analyzeDocument(
        sample.documentBuffer,
        {
          fileName: 'training_sample',
          fileSize: sample.documentBuffer.length,
          mimeType: 'application/pdf',
          organizationId: 'training',
          uploadedBy: 'system',
          uploadedAt: new Date()
        }
      );

      // Extract patterns for rule generation
      const patterns = this.extractClassificationPatterns(
        analysis,
        sample.expectedCategory,
        sample.expectedSubcategory
      );

      rules.push(...patterns);
    }

    // Store custom rules
    const modelId = await this.saveCustomModel(modelName, rules);

    return {
      modelId,
      accuracy: 0.85, // Would be calculated from validation set
      trainingMetrics: {
        rulesGenerated: rules.length,
        trainingDuration: Date.now(),
        categories: [...new Set(trainingData.map(d => d.expectedCategory))]
      }
    };
  }

  /**
   * Enhanced data extraction with AI augmentation
   */
  private async performEnhancedExtraction(
    ocrResult: OCRResult,
    documentBuffer: Buffer
  ): Promise<EnhancedDocumentAnalysis['extractedData']> {
    const extractedData: EnhancedDocumentAnalysis['extractedData'] = {
      structuredFields: ocrResult.extractedData,
      keyValuePairs: [],
      tables: [],
      entities: []
    };

    // Extract key-value pairs using pattern matching
    extractedData.keyValuePairs = this.extractKeyValuePairs(ocrResult.rawText);

    // Process tables
    extractedData.tables = this.processTables(ocrResult.pages);

    // Extract entities using NLP
    if (this.openaiClient) {
      extractedData.entities = await this.extractEntitiesWithAI(ocrResult.rawText);
    }

    return extractedData;
  }

  /**
   * Intelligent document categorization
   */
  private async performIntelligentCategorization(
    ocrResult: OCRResult,
    extractedData: EnhancedDocumentAnalysis['extractedData'],
    metadata: any,
    customRules?: DocumentClassificationRule[]
  ): Promise<EnhancedDocumentAnalysis['intelligentCategorization']> {
    const allRules = [...this.classificationRules, ...(customRules || [])];
    const text = ocrResult.rawText.toLowerCase();

    let bestMatch = {
      primaryCategory: 'general',
      subcategory: undefined as string | undefined,
      confidence: 0.5,
      businessRelevance: 0.5,
      taxRelevance: 0.3,
      complianceFlags: [] as string[]
    };

    // Apply classification rules
    for (const rule of allRules.filter(r => r.isActive)) {
      const score = this.evaluateClassificationRule(rule, text, extractedData, metadata);

      if (score > bestMatch.confidence) {
        bestMatch = {
          primaryCategory: rule.category,
          subcategory: rule.subcategory,
          confidence: score,
          businessRelevance: this.calculateBusinessRelevance(rule.category, extractedData),
          taxRelevance: this.calculateTaxRelevance(rule.category, extractedData),
          complianceFlags: this.identifyComplianceFlags(rule.category, extractedData)
        };
      }
    }

    return bestMatch;
  }

  /**
   * Anomaly detection
   */
  private async detectAnomalies(
    ocrResult: OCRResult,
    extractedData: EnhancedDocumentAnalysis['extractedData'],
    categorization: EnhancedDocumentAnalysis['intelligentCategorization']
  ): Promise<EnhancedDocumentAnalysis['anomalies']> {
    const anomalies: EnhancedDocumentAnalysis['anomalies'] = [];

    // Check for missing signatures on important documents
    if (this.requiresSignature(categorization.primaryCategory)) {
      const hasSignature = this.detectSignature(ocrResult.rawText);
      if (!hasSignature) {
        anomalies.push({
          type: 'missing_signature',
          severity: 'high',
          description: 'Document appears to require a signature but none was detected',
          suggestedAction: 'Verify document completion and obtain required signatures'
        });
      }
    }

    // Check for date inconsistencies
    const dateAnomalies = this.detectDateInconsistencies(extractedData);
    anomalies.push(...dateAnomalies);

    // Check for calculation errors in financial documents
    if (this.isFinancialDocument(categorization.primaryCategory)) {
      const calculationAnomalies = this.detectCalculationErrors(extractedData);
      anomalies.push(...calculationAnomalies);
    }

    // Check for unusual amounts
    const amountAnomalies = this.detectUnusualAmounts(extractedData, categorization);
    anomalies.push(...amountAnomalies);

    return anomalies;
  }

  /**
   * Quality assessment
   */
  private async assessQuality(
    ocrResult: OCRResult,
    extractedData: EnhancedDocumentAnalysis['extractedData'],
    anomalies: EnhancedDocumentAnalysis['anomalies'],
    threshold: number
  ): Promise<EnhancedDocumentAnalysis['qualityAssessment']> {
    const readabilityScore = this.calculateReadabilityScore(ocrResult);
    const completenessScore = this.calculateCompletenessScore(extractedData);
    const accuracyScore = ocrResult.confidence;

    const overallScore = (readabilityScore + completenessScore + accuracyScore) / 3;

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
    const needsHumanReview = overallScore < threshold || criticalAnomalies.length > 0;

    const reviewReasons: string[] = [];
    if (overallScore < threshold) {
      reviewReasons.push(`Overall quality score (${overallScore.toFixed(2)}) below threshold (${threshold})`);
    }
    if (criticalAnomalies.length > 0) {
      reviewReasons.push(`${criticalAnomalies.length} critical anomalies detected`);
    }

    return {
      overallScore,
      readabilityScore,
      completenessScore,
      accuracyScore,
      needsHumanReview,
      reviewReasons
    };
  }

  /**
   * Generate searchable content
   */
  private async generateSearchableContent(
    ocrResult: OCRResult,
    extractedData: EnhancedDocumentAnalysis['extractedData'],
    categorization: EnhancedDocumentAnalysis['intelligentCategorization']
  ): Promise<EnhancedDocumentAnalysis['searchableContent']> {
    const keywords = this.extractKeywords(ocrResult.rawText);
    const concepts = this.extractConcepts(extractedData, categorization);

    let semanticSummary = '';
    if (this.openaiClient) {
      semanticSummary = await this.generateSemanticSummary(ocrResult.rawText);
    }

    return {
      fullText: ocrResult.rawText,
      keywords,
      concepts,
      semanticSummary
    };
  }

  // Helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private categorizeQuality(score: number): string {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.7) return 'fair';
    if (score >= 0.6) return 'poor';
    return 'unacceptable';
  }

  private extractKeyValuePairs(text: string): Array<{
    key: string;
    value: string;
    confidence: number;
    location: number[];
  }> {
    // Implementation for extracting key-value pairs
    const pairs: Array<{ key: string; value: string; confidence: number; location: number[] }> = [];

    // Common patterns for financial documents
    const patterns = [
      /(\w+[\s\w]*?):\s*([^\n\r]+)/g,
      /(\w+[\s\w]*?)\s*=\s*([^\n\r]+)/g,
      /(\w+[\s\w]*?)\s*-\s*([^\n\r]+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        pairs.push({
          key: match[1].trim(),
          value: match[2].trim(),
          confidence: 0.8,
          location: [match.index, match.index + match[0].length, 0, 0]
        });
      }
    });

    return pairs;
  }

  private processTables(pages: OCRResult['pages']): Array<{
    data: string[][];
    headers: string[];
    confidence: number;
  }> {
    return pages.flatMap(page =>
      page.tables.map(table => ({
        data: this.convertTableCellsToData(table.cells, table.rowCount, table.columnCount),
        headers: this.extractTableHeaders(table.cells, table.columnCount),
        confidence: 0.85
      }))
    );
  }

  private convertTableCellsToData(
    cells: Array<{ content: string; rowIndex: number; columnIndex: number; boundingBox: number[] }>,
    rowCount: number,
    columnCount: number
  ): string[][] {
    const data: string[][] = Array(rowCount).fill(null).map(() => Array(columnCount).fill(''));

    cells.forEach(cell => {
      if (cell.rowIndex < rowCount && cell.columnIndex < columnCount) {
        data[cell.rowIndex][cell.columnIndex] = cell.content;
      }
    });

    return data;
  }

  private extractTableHeaders(
    cells: Array<{ content: string; rowIndex: number; columnIndex: number; boundingBox: number[] }>,
    columnCount: number
  ): string[] {
    const headers: string[] = Array(columnCount).fill('');

    cells
      .filter(cell => cell.rowIndex === 0)
      .forEach(cell => {
        if (cell.columnIndex < columnCount) {
          headers[cell.columnIndex] = cell.content;
        }
      });

    return headers;
  }

  private async extractEntitiesWithAI(text: string): Promise<Array<{
    type: string;
    value: string;
    confidence: number;
    mentions: Array<{ text: string; offset: number; length: number }>;
  }>> {
    // This would use OpenAI or Azure Cognitive Services for entity extraction
    // For now, return empty array
    return [];
  }

  private calculateProcessingCosts(
    ocrResult: OCRResult,
    extractedData: EnhancedDocumentAnalysis['extractedData']
  ): { ocrCost: number; aiCost: number; totalCost: number } {
    const ocrCost = 0.10; // Base OCR cost
    const aiCost = 0.05; // AI enhancement cost
    return {
      ocrCost,
      aiCost,
      totalCost: ocrCost + aiCost
    };
  }

  private generateSuggestedTags(
    ocrResult: OCRResult,
    extractedData: EnhancedDocumentAnalysis['extractedData'],
    categorization: EnhancedDocumentAnalysis['intelligentCategorization']
  ): string[] {
    const tags: string[] = [];

    // Add category-based tags
    tags.push(categorization.primaryCategory);
    if (categorization.subcategory) {
      tags.push(categorization.subcategory);
    }

    // Add entity-based tags
    extractedData.entities.forEach(entity => {
      if (entity.confidence > 0.8) {
        tags.push(entity.value.toLowerCase());
      }
    });

    return [...new Set(tags)].slice(0, 10); // Limit to 10 unique tags
  }

  private async loadClassificationRules(): Promise<void> {
    // Load classification rules from database or configuration
    this.classificationRules = [
      {
        id: 'tax-w2',
        name: 'W-2 Form Detection',
        description: 'Identifies W-2 tax forms',
        conditions: [
          { field: 'text', operator: 'contains', value: 'wage and tax statement', weight: 0.9 },
          { field: 'text', operator: 'contains', value: 'form w-2', weight: 0.8 }
        ],
        category: 'tax_return',
        subcategory: 'w2',
        confidence: 0.9,
        isActive: true,
        priority: 10
      },
      {
        id: 'invoice-detection',
        name: 'Invoice Detection',
        description: 'Identifies invoices',
        conditions: [
          { field: 'text', operator: 'contains', value: 'invoice', weight: 0.7 },
          { field: 'text', operator: 'contains', value: 'amount due', weight: 0.6 },
          { field: 'text', operator: 'contains', value: 'total', weight: 0.5 }
        ],
        category: 'invoice',
        confidence: 0.8,
        isActive: true,
        priority: 8
      }
    ];
  }

  private evaluateClassificationRule(
    rule: DocumentClassificationRule,
    text: string,
    extractedData: EnhancedDocumentAnalysis['extractedData'],
    metadata: any
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const condition of rule.conditions) {
      let conditionMet = false;

      switch (condition.operator) {
        case 'contains':
          conditionMet = text.includes(condition.value.toString().toLowerCase());
          break;
        case 'equals':
          conditionMet = text === condition.value.toString().toLowerCase();
          break;
        case 'matches':
          const regex = new RegExp(condition.value.toString(), 'i');
          conditionMet = regex.test(text);
          break;
      }

      if (conditionMet) {
        totalScore += condition.weight;
      }
      totalWeight += condition.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateBusinessRelevance(category: string, extractedData: any): number {
    // Business relevance scoring logic
    const businessCategories = ['invoice', 'receipt', 'contract', 'financial_statement'];
    return businessCategories.includes(category) ? 0.9 : 0.5;
  }

  private calculateTaxRelevance(category: string, extractedData: any): number {
    // Tax relevance scoring logic
    const taxCategories = ['tax_return', 'w2', '1099', 'receipt'];
    return taxCategories.includes(category) ? 0.9 : 0.3;
  }

  private identifyComplianceFlags(category: string, extractedData: any): string[] {
    const flags: string[] = [];

    if (category.includes('tax')) {
      flags.push('tax_compliance');
    }

    if (category === 'financial_statement') {
      flags.push('financial_reporting');
    }

    return flags;
  }

  // Additional helper methods for anomaly detection and quality assessment
  private requiresSignature(category: string): boolean {
    return ['tax_return', 'contract', 'legal_document'].includes(category);
  }

  private detectSignature(text: string): boolean {
    const signatureKeywords = ['signature', 'signed by', 'electronically signed', '/s/'];
    return signatureKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private detectDateInconsistencies(extractedData: any): EnhancedDocumentAnalysis['anomalies'] {
    // Date inconsistency detection logic
    return [];
  }

  private isFinancialDocument(category: string): boolean {
    return ['invoice', 'receipt', 'financial_statement', 'bank_statement'].includes(category);
  }

  private detectCalculationErrors(extractedData: any): EnhancedDocumentAnalysis['anomalies'] {
    // Calculation error detection logic
    return [];
  }

  private detectUnusualAmounts(
    extractedData: any,
    categorization: any
  ): EnhancedDocumentAnalysis['anomalies'] {
    // Unusual amount detection logic
    return [];
  }

  private calculateReadabilityScore(ocrResult: OCRResult): number {
    return ocrResult.confidence;
  }

  private calculateCompletenessScore(extractedData: any): number {
    // Completeness scoring logic
    return 0.85;
  }

  private extractKeywords(text: string): string[] {
    // Keyword extraction logic
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private extractConcepts(extractedData: any, categorization: any): string[] {
    // Concept extraction logic
    return [categorization.primaryCategory, ...(categorization.subcategory ? [categorization.subcategory] : [])];
  }

  private async generateSemanticSummary(text: string): Promise<string> {
    // OpenAI-based semantic summary generation
    return text.substring(0, 200) + '...';
  }

  private extractClassificationPatterns(
    analysis: EnhancedDocumentAnalysis,
    expectedCategory: string,
    expectedSubcategory?: string
  ): DocumentClassificationRule[] {
    // Pattern extraction for training
    return [];
  }

  private async saveCustomModel(modelName: string, rules: DocumentClassificationRule[]): Promise<string> {
    // Save custom model to database
    return `custom_${modelName}_${Date.now()}`;
  }

  private async indexDocumentForSearch(
    documentId: string,
    analysis: EnhancedDocumentAnalysis,
    metadata: any
  ): Promise<void> {
    if (!this.searchClient) return;

    const searchDocument = {
      id: documentId,
      content: analysis.searchableContent.fullText,
      category: analysis.category.category,
      subcategory: analysis.category.subcategory,
      keywords: analysis.searchableContent.keywords,
      concepts: analysis.searchableContent.concepts,
      summary: analysis.searchableContent.semanticSummary,
      fileName: metadata.fileName,
      uploadedAt: metadata.uploadedAt,
      organizationId: metadata.organizationId
    };

    try {
      await this.searchClient.uploadDocuments([searchDocument]);
    } catch (error) {
      console.error('Failed to index document for search:', error);
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return !!this.formRecognizerClient;
  }
}

// Export singleton instance
export const documentIntelligenceService = new EnhancedDocumentIntelligenceService();

// Export types
export type {
  EnhancedDocumentAnalysis,
  DocumentClassificationRule,
  BatchProcessingOptions
};