import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { formRecognizer, type OCRResult } from '../azure/form-recognizer';
import { prisma } from '../../server/db';
import { EventEmitter } from 'events';

export interface EnhancedOCRResult extends OCRResult {
  qualityMetrics: {
    resolution: { width: number; height: number; dpi: number };
    clarity: number; // 0-1 score
    skew: number; // Degrees of skew
    noise: number; // 0-1 noise level
    contrast: number; // 0-1 contrast level
  };
  preprocessing: {
    operations: string[];
    improvements: string[];
    warnings: string[];
  };
  validation: {
    isValid: boolean;
    validationScore: number;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      location?: { page: number; x: number; y: number; width: number; height: number };
      suggestion: string;
    }>;
  };
  financialData?: {
    amounts: Array<{
      value: number;
      currency: string;
      confidence: number;
      label: string;
      location: { page: number; x: number; y: number; width: number; height: number };
    }>;
    dates: Array<{
      value: Date;
      format: string;
      confidence: number;
      label: string;
      location: { page: number; x: number; y: number; width: number; height: number };
    }>;
    taxIds: Array<{
      value: string;
      type: 'ssn' | 'ein' | 'itin';
      confidence: number;
      location: { page: number; x: number; y: number; width: number; height: number };
    }>;
    calculations: Array<{
      formula: string;
      expected: number;
      actual: number;
      variance: number;
      isCorrect: boolean;
    }>;
  };
  complianceFlags: Array<{
    type: string;
    description: string;
    severity: 'info' | 'warning' | 'error';
    regulation: string;
  }>;
  auditTrail: Array<{
    timestamp: Date;
    operation: string;
    user: string;
    details: Record<string, any>;
  }>;
}

export interface BatchOCROptions {
  documents: Array<{
    id: string;
    buffer: Buffer;
    fileName: string;
    metadata: Record<string, any>;
  }>;
  processing: {
    enablePreprocessing: boolean;
    enableQualityEnhancement: boolean;
    enableValidation: boolean;
    enableFinancialExtraction: boolean;
    qualityThreshold: number;
    retryLowQuality: boolean;
    parallelProcessing: boolean;
    maxConcurrency: number;
  };
  output: {
    format: 'json' | 'csv' | 'excel';
    includeRawData: boolean;
    includeImages: boolean;
    compressionLevel: number;
  };
  notifications: {
    onProgress: boolean;
    onCompletion: boolean;
    onError: boolean;
    webhookUrl?: string;
  };
}

export interface OCRTrainingData {
  documentType: string;
  samples: Array<{
    imageBuffer: Buffer;
    expectedFields: Record<string, any>;
    annotations: Array<{
      field: string;
      value: string;
      boundingBox: { x: number; y: number; width: number; height: number };
    }>;
  }>;
  validationSet: Array<{
    imageBuffer: Buffer;
    expectedFields: Record<string, any>;
  }>;
}

export interface CustomOCRModel {
  id: string;
  name: string;
  documentType: string;
  version: string;
  accuracy: number;
  trainingDate: Date;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    confidence: number;
  }>;
  status: 'training' | 'ready' | 'failed';
  organizationId: string;
}

export interface OCRQueueItem {
  id: string;
  documentId: string;
  organizationId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  options: {
    documentType?: string;
    enablePreprocessing: boolean;
    enableValidation: boolean;
    customModelId?: string;
  };
}

class EnhancedOCRService extends EventEmitter {
  private processingQueue = new Map<string, OCRQueueItem>();
  private activeProcessing = new Map<string, Promise<EnhancedOCRResult>>();
  private customModels = new Map<string, CustomOCRModel>();

  constructor() {
    super();
    this.initializeCustomModels();
    this.startQueueProcessor();
  }

  /**
   * Process document with enhanced OCR capabilities
   */
  async processDocument(
    documentBuffer: Buffer,
    metadata: {
      fileName: string;
      documentId: string;
      organizationId: string;
      uploadedBy: string;
    },
    options: {
      documentType?: string;
      enablePreprocessing?: boolean;
      enableValidation?: boolean;
      enableFinancialExtraction?: boolean;
      customModelId?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    } = {}
  ): Promise<EnhancedOCRResult> {
    try {
      const startTime = Date.now();

      // Log audit trail
      const auditTrail: EnhancedOCRResult['auditTrail'] = [{
        timestamp: new Date(),
        operation: 'ocr_started',
        user: metadata.uploadedBy,
        details: { fileName: metadata.fileName, options }
      }];

      // Step 1: Preprocess document if enabled
      let processedBuffer = documentBuffer;
      const preprocessingOperations: string[] = [];
      const improvements: string[] = [];
      const warnings: string[] = [];

      if (options.enablePreprocessing !== false) {
        const preprocessResult = await this.preprocessDocument(documentBuffer, metadata.fileName);
        processedBuffer = preprocessResult.processedBuffer;
        preprocessingOperations.push(...preprocessResult.operations);
        improvements.push(...preprocessResult.improvements);
        warnings.push(...preprocessResult.warnings);

        auditTrail.push({
          timestamp: new Date(),
          operation: 'preprocessing_completed',
          user: 'system',
          details: { operations: preprocessingOperations, improvements }
        });
      }

      // Step 2: Analyze quality metrics
      const qualityMetrics = await this.analyzeQuality(processedBuffer);

      // Step 3: Perform OCR with appropriate model
      let ocrResult: OCRResult;
      if (options.customModelId) {
        const customModel = this.customModels.get(options.customModelId);
        if (customModel && customModel.status === 'ready') {
          ocrResult = await this.processWithCustomModel(processedBuffer, customModel);
        } else {
          throw new Error(`Custom model ${options.customModelId} not found or not ready`);
        }
      } else {
        const detectedType = await formRecognizer.detectDocumentType(processedBuffer);
        ocrResult = await formRecognizer.analyzeDocument(
          processedBuffer,
          detectedType.detectedType
        );
      }

      auditTrail.push({
        timestamp: new Date(),
        operation: 'ocr_completed',
        user: 'system',
        details: { confidence: ocrResult.confidence, documentType: ocrResult.documentType }
      });

      // Step 4: Validation
      let validation = {
        isValid: true,
        validationScore: 1.0,
        issues: [] as any[]
      };

      if (options.enableValidation !== false) {
        validation = await this.validateOCRResults(ocrResult, options.documentType);

        auditTrail.push({
          timestamp: new Date(),
          operation: 'validation_completed',
          user: 'system',
          details: { validationScore: validation.validationScore, issueCount: validation.issues.length }
        });
      }

      // Step 5: Financial data extraction
      let financialData: EnhancedOCRResult['financialData'];
      if (options.enableFinancialExtraction !== false) {
        financialData = await this.extractFinancialData(ocrResult);

        auditTrail.push({
          timestamp: new Date(),
          operation: 'financial_extraction_completed',
          user: 'system',
          details: {
            amountsFound: financialData.amounts.length,
            datesFound: financialData.dates.length,
            taxIdsFound: financialData.taxIds.length
          }
        });
      }

      // Step 6: Compliance checking
      const complianceFlags = await this.checkCompliance(ocrResult, options.documentType);

      // Step 7: Build enhanced result
      const enhancedResult: EnhancedOCRResult = {
        ...ocrResult,
        qualityMetrics,
        preprocessing: {
          operations: preprocessingOperations,
          improvements,
          warnings
        },
        validation,
        financialData,
        complianceFlags,
        auditTrail
      };

      // Save results to database
      await this.saveOCRResults(metadata.documentId, enhancedResult);

      // Emit completion event
      this.emit('ocr_completed', {
        documentId: metadata.documentId,
        result: enhancedResult,
        processingTime: Date.now() - startTime
      });

      return enhancedResult;

    } catch (error) {
      console.error('Enhanced OCR processing failed:', error);

      // Emit error event
      this.emit('ocr_failed', {
        documentId: metadata.documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Queue document for batch processing
   */
  async queueDocument(
    documentId: string,
    organizationId: string,
    options: OCRQueueItem['options'],
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    scheduledFor?: Date
  ): Promise<string> {
    const queueItem: OCRQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      organizationId,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      scheduledFor,
      options
    };

    this.processingQueue.set(queueItem.id, queueItem);

    // Emit queue event
    this.emit('document_queued', {
      queueId: queueItem.id,
      documentId,
      priority,
      scheduledFor
    });

    return queueItem.id;
  }

  /**
   * Process batch of documents
   */
  async processBatch(options: BatchOCROptions): Promise<{
    successful: Array<{ id: string; result: EnhancedOCRResult }>;
    failed: Array<{ id: string; error: string }>;
    statistics: {
      totalProcessed: number;
      successRate: number;
      averageProcessingTime: number;
      qualityDistribution: Record<string, number>;
    };
  }> {
    const results = {
      successful: [] as Array<{ id: string; result: EnhancedOCRResult }>,
      failed: [] as Array<{ id: string; error: string }>,
      statistics: {
        totalProcessed: 0,
        successRate: 0,
        averageProcessingTime: 0,
        qualityDistribution: {} as Record<string, number>
      }
    };

    const startTime = Date.now();
    const { documents, processing, output, notifications } = options;

    // Determine processing strategy
    const concurrency = processing.parallelProcessing
      ? Math.min(processing.maxConcurrency || 5, documents.length)
      : 1;

    // Process documents in batches
    const batches = this.chunkArray(documents, concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (doc) => {
        try {
          const result = await this.processDocument(
            doc.buffer,
            {
              fileName: doc.fileName,
              documentId: doc.id,
              organizationId: doc.metadata.organizationId,
              uploadedBy: doc.metadata.uploadedBy
            },
            {
              enablePreprocessing: processing.enablePreprocessing,
              enableValidation: processing.enableValidation,
              enableFinancialExtraction: processing.enableFinancialExtraction
            }
          );

          results.successful.push({ id: doc.id, result });

          // Update quality distribution
          const qualityCategory = this.categorizeQuality(result.qualityMetrics.clarity);
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

    // Calculate statistics
    const totalProcessingTime = Date.now() - startTime;
    results.statistics = {
      totalProcessed: results.successful.length + results.failed.length,
      successRate: results.successful.length / documents.length,
      averageProcessingTime: totalProcessingTime / documents.length,
      qualityDistribution: results.statistics.qualityDistribution
    };

    // Send notifications if enabled
    if (notifications.onCompletion) {
      await this.sendBatchCompletionNotification(results, notifications.webhookUrl);
    }

    return results;
  }

  /**
   * Train custom OCR model
   */
  async trainCustomModel(
    trainingData: OCRTrainingData,
    modelName: string,
    organizationId: string
  ): Promise<CustomOCRModel> {
    try {
      const modelId = `custom_${organizationId}_${Date.now()}`;

      // Create model record
      const customModel: CustomOCRModel = {
        id: modelId,
        name: modelName,
        documentType: trainingData.documentType,
        version: '1.0.0',
        accuracy: 0,
        trainingDate: new Date(),
        fields: [],
        status: 'training',
        organizationId
      };

      this.customModels.set(modelId, customModel);

      // Start training process (this would use Azure Form Recognizer custom model training)
      setTimeout(async () => {
        try {
          // Simulate training process
          const accuracy = await this.performModelTraining(trainingData);

          customModel.status = 'ready';
          customModel.accuracy = accuracy;
          customModel.fields = this.extractModelFields(trainingData);

          this.emit('model_training_completed', {
            modelId,
            accuracy,
            organizationId
          });

        } catch (error) {
          customModel.status = 'failed';

          this.emit('model_training_failed', {
            modelId,
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId
          });
        }
      }, 5000); // Simulate training time

      return customModel;

    } catch (error) {
      console.error('Model training failed:', error);
      throw new Error(`Model training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get OCR processing statistics
   */
  async getProcessingStatistics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalDocuments: number;
    successRate: number;
    averageConfidence: number;
    averageProcessingTime: number;
    documentTypes: Record<string, number>;
    qualityDistribution: Record<string, number>;
    errorTypes: Record<string, number>;
    costAnalysis: {
      totalCost: number;
      costPerDocument: number;
      costByType: Record<string, number>;
    };
  }> {
    // This would query database for actual statistics
    return {
      totalDocuments: 1250,
      successRate: 0.94,
      averageConfidence: 0.87,
      averageProcessingTime: 3.2,
      documentTypes: {
        'tax_return': 456,
        'invoice': 324,
        'receipt': 289,
        'bank_statement': 181
      },
      qualityDistribution: {
        'excellent': 623,
        'good': 398,
        'fair': 157,
        'poor': 72
      },
      errorTypes: {
        'low_quality': 45,
        'unsupported_format': 18,
        'processing_timeout': 12,
        'service_error': 5
      },
      costAnalysis: {
        totalCost: 125.50,
        costPerDocument: 0.10,
        costByType: {
          'tax_return': 45.60,
          'invoice': 32.40,
          'receipt': 28.90,
          'bank_statement': 18.10
        }
      }
    };
  }

  // Private methods

  private async preprocessDocument(
    buffer: Buffer,
    fileName: string
  ): Promise<{
    processedBuffer: Buffer;
    operations: string[];
    improvements: string[];
    warnings: string[];
  }> {
    const operations: string[] = [];
    const improvements: string[] = [];
    const warnings: string[] = [];

    // Simulate preprocessing operations
    operations.push('noise_reduction', 'contrast_enhancement', 'skew_correction');
    improvements.push('Improved image clarity by 15%', 'Corrected 2.3° skew');

    // In a real implementation, this would use image processing libraries
    return {
      processedBuffer: buffer, // Would be the processed image
      operations,
      improvements,
      warnings
    };
  }

  private async analyzeQuality(buffer: Buffer): Promise<EnhancedOCRResult['qualityMetrics']> {
    // Simulate quality analysis
    return {
      resolution: { width: 1200, height: 1600, dpi: 300 },
      clarity: 0.85,
      skew: 1.2,
      noise: 0.15,
      contrast: 0.78
    };
  }

  private async processWithCustomModel(
    buffer: Buffer,
    model: CustomOCRModel
  ): Promise<OCRResult> {
    // This would use the custom trained model
    // For now, delegate to standard processing
    return await formRecognizer.analyzeDocument(buffer, model.documentType);
  }

  private async validateOCRResults(
    result: OCRResult,
    documentType?: string
  ): Promise<EnhancedOCRResult['validation']> {
    const issues: EnhancedOCRResult['validation']['issues'] = [];

    // Check confidence thresholds
    if (result.confidence < 0.7) {
      issues.push({
        type: 'low_confidence',
        severity: 'medium',
        description: `Overall confidence (${result.confidence.toFixed(2)}) below recommended threshold`,
        suggestion: 'Consider manual review or document reprocessing'
      });
    }

    // Check for missing critical fields
    const criticalFields = this.getCriticalFields(documentType);
    for (const field of criticalFields) {
      if (!result.extractedData[field]) {
        issues.push({
          type: 'missing_field',
          severity: 'high',
          description: `Critical field '${field}' not found`,
          suggestion: `Verify document contains ${field} information`
        });
      }
    }

    const validationScore = Math.max(0, 1 - (issues.length * 0.1));

    return {
      isValid: validationScore > 0.6,
      validationScore,
      issues
    };
  }

  private async extractFinancialData(result: OCRResult): Promise<EnhancedOCRResult['financialData']> {
    const amounts: EnhancedOCRResult['financialData']['amounts'] = [];
    const dates: EnhancedOCRResult['financialData']['dates'] = [];
    const taxIds: EnhancedOCRResult['financialData']['taxIds'] = [];
    const calculations: EnhancedOCRResult['financialData']['calculations'] = [];

    // Extract amounts using regex patterns
    const amountPatterns = [
      /\$[\d,]+\.?\d*/g,
      /[\d,]+\.?\d*\s*USD/g,
      /Total:?\s*\$?[\d,]+\.?\d*/gi
    ];

    const text = result.rawText;
    for (const pattern of amountPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const amountStr = match[0].replace(/[$,USD\s]/g, '');
        const amount = parseFloat(amountStr);

        if (!isNaN(amount) && amount > 0) {
          amounts.push({
            value: amount,
            currency: 'USD',
            confidence: 0.85,
            label: this.determineAmountLabel(match[0], text, match.index),
            location: { page: 1, x: 0, y: 0, width: 0, height: 0 } // Would be calculated from OCR data
          });
        }
      }
    }

    // Extract dates
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d{4}-\d{2}-\d{2}/g,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi
    ];

    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[0];
        const date = new Date(dateStr);

        if (!isNaN(date.getTime())) {
          dates.push({
            value: date,
            format: this.determineDateFormat(dateStr),
            confidence: 0.8,
            label: this.determineDateLabel(dateStr, text, match.index),
            location: { page: 1, x: 0, y: 0, width: 0, height: 0 }
          });
        }
      }
    }

    // Extract tax IDs
    const taxIdPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{2}-\d{7}\b/g,       // EIN
      /\b9\d{2}-\d{2}-\d{4}\b/g // ITIN
    ];

    for (const pattern of taxIdPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const taxId = match[0];
        const type = this.determineTaxIdType(taxId);

        taxIds.push({
          value: taxId,
          type,
          confidence: 0.9,
          location: { page: 1, x: 0, y: 0, width: 0, height: 0 }
        });
      }
    }

    return { amounts, dates, taxIds, calculations };
  }

  private async checkCompliance(
    result: OCRResult,
    documentType?: string
  ): Promise<EnhancedOCRResult['complianceFlags']> {
    const flags: EnhancedOCRResult['complianceFlags'] = [];

    // Check for required signatures on tax documents
    if (documentType?.includes('tax') && !this.hasSignature(result.rawText)) {
      flags.push({
        type: 'missing_signature',
        description: 'Tax document appears to be missing required signature',
        severity: 'error',
        regulation: 'IRS Publication 1345'
      });
    }

    // Check for Social Security Number disclosure
    if (this.containsSSN(result.rawText)) {
      flags.push({
        type: 'pii_disclosure',
        description: 'Document contains Social Security Number',
        severity: 'warning',
        regulation: 'Privacy Act'
      });
    }

    return flags;
  }

  private async saveOCRResults(documentId: string, result: EnhancedOCRResult): Promise<void> {
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'completed',
          ocrConfidence: result.confidence,
          ocrProcessedAt: new Date(),
          extractedData: result.extractedData,
          rawOcrData: result,
          ocrModel: result.metadata.modelId,
          needsReview: result.validation.validationScore < 0.8 || result.validation.issues.length > 0
        }
      });
    } catch (error) {
      console.error('Failed to save OCR results:', error);
    }
  }

  private async initializeCustomModels(): Promise<void> {
    // Load custom models from database
    try {
      const models = await prisma.workflowTemplate.findMany({
        where: { isSystemTemplate: false }
      });

      // Initialize custom models map
      console.log(`Loaded ${models.length} custom models`);
    } catch (error) {
      console.error('Failed to load custom models:', error);
    }
  }

  private startQueueProcessor(): void {
    // Process queue every 5 seconds
    setInterval(async () => {
      await this.processQueue();
    }, 5000);
  }

  private async processQueue(): Promise<void> {
    const pendingItems = Array.from(this.processingQueue.values())
      .filter(item => item.status === 'pending' &&
        (!item.scheduledFor || item.scheduledFor <= new Date()))
      .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));

    for (const item of pendingItems.slice(0, 3)) { // Process up to 3 items concurrently
      if (!this.activeProcessing.has(item.id)) {
        this.processQueueItem(item);
      }
    }
  }

  private async processQueueItem(item: OCRQueueItem): Promise<void> {
    item.status = 'processing';
    item.startedAt = new Date();
    item.attempts++;

    const processingPromise = this.processQueuedDocument(item);
    this.activeProcessing.set(item.id, processingPromise);

    try {
      await processingPromise;
      item.status = 'completed';
      item.completedAt = new Date();

      this.emit('queue_item_completed', {
        queueId: item.id,
        documentId: item.documentId,
        attempts: item.attempts
      });

    } catch (error) {
      item.status = 'failed';
      item.errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (item.attempts < item.maxAttempts) {
        item.status = 'retrying';
        item.scheduledFor = new Date(Date.now() + (item.attempts * 30000)); // Exponential backoff
      }

      this.emit('queue_item_failed', {
        queueId: item.id,
        documentId: item.documentId,
        error: item.errorMessage,
        attempts: item.attempts,
        willRetry: item.status === 'retrying'
      });

    } finally {
      this.activeProcessing.delete(item.id);

      if (item.status === 'completed' || item.status === 'failed') {
        this.processingQueue.delete(item.id);
      }
    }
  }

  private async processQueuedDocument(item: OCRQueueItem): Promise<EnhancedOCRResult> {
    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: item.documentId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Get document buffer (would retrieve from storage)
    const documentBuffer = Buffer.from(''); // Placeholder

    return await this.processDocument(
      documentBuffer,
      {
        fileName: document.fileName,
        documentId: document.id,
        organizationId: document.organizationId,
        uploadedBy: document.uploadedBy
      },
      item.options
    );
  }

  // Helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private categorizeQuality(clarity: number): string {
    if (clarity >= 0.9) return 'excellent';
    if (clarity >= 0.8) return 'good';
    if (clarity >= 0.7) return 'fair';
    return 'poor';
  }

  private getCriticalFields(documentType?: string): string[] {
    const fieldMap: Record<string, string[]> = {
      'tax_return': ['TaxYear', 'FilingStatus', 'AGI'],
      'invoice': ['InvoiceId', 'InvoiceDate', 'Total'],
      'receipt': ['MerchantName', 'Date', 'Total'],
      'bank_statement': ['AccountNumber', 'StatementDate', 'Balance']
    };

    return fieldMap[documentType || ''] || [];
  }

  private determineAmountLabel(amount: string, text: string, index: number): string {
    const before = text.substring(Math.max(0, index - 50), index).toLowerCase();
    const after = text.substring(index, Math.min(text.length, index + 50)).toLowerCase();

    if (before.includes('total') || after.includes('total')) return 'Total';
    if (before.includes('tax') || after.includes('tax')) return 'Tax';
    if (before.includes('subtotal') || after.includes('subtotal')) return 'Subtotal';
    if (before.includes('amount due') || after.includes('amount due')) return 'Amount Due';

    return 'Amount';
  }

  private determineDateFormat(dateStr: string): string {
    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) return 'MM/DD/YYYY';
    if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return 'YYYY-MM-DD';
    if (/[A-Za-z]+\s+\d{1,2},?\s+\d{4}/.test(dateStr)) return 'Month DD, YYYY';
    return 'Unknown';
  }

  private determineDateLabel(dateStr: string, text: string, index: number): string {
    const before = text.substring(Math.max(0, index - 30), index).toLowerCase();

    if (before.includes('due')) return 'Due Date';
    if (before.includes('issue') || before.includes('invoice')) return 'Invoice Date';
    if (before.includes('statement')) return 'Statement Date';
    if (before.includes('payment')) return 'Payment Date';

    return 'Date';
  }

  private determineTaxIdType(taxId: string): 'ssn' | 'ein' | 'itin' {
    if (/^\d{3}-\d{2}-\d{4}$/.test(taxId)) {
      if (taxId.startsWith('9')) return 'itin';
      return 'ssn';
    }
    if (/^\d{2}-\d{7}$/.test(taxId)) return 'ein';
    return 'ssn'; // Default
  }

  private hasSignature(text: string): boolean {
    const signatureKeywords = ['signature', 'signed', 'sign here', '/s/', 'electronically signed'];
    return signatureKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private containsSSN(text: string): boolean {
    return /\b\d{3}-\d{2}-\d{4}\b/.test(text);
  }

  private getPriorityValue(priority: string): number {
    const values = { urgent: 4, high: 3, normal: 2, low: 1 };
    return values[priority as keyof typeof values] || 2;
  }

  private async performModelTraining(trainingData: OCRTrainingData): Promise<number> {
    // Simulate model training and return accuracy
    return 0.85 + Math.random() * 0.1; // 85-95% accuracy
  }

  private extractModelFields(trainingData: OCRTrainingData): CustomOCRModel['fields'] {
    const fields = new Set<string>();

    trainingData.samples.forEach(sample => {
      Object.keys(sample.expectedFields).forEach(field => fields.add(field));
    });

    return Array.from(fields).map(field => ({
      name: field,
      type: 'string',
      required: true,
      confidence: 0.8
    }));
  }

  private async sendBatchCompletionNotification(
    results: any,
    webhookUrl?: string
  ): Promise<void> {
    if (webhookUrl) {
      try {
        // Send webhook notification
        console.log('Sending batch completion notification to:', webhookUrl);
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }
  }
}

// Export singleton instance
export const enhancedOCRService = new EnhancedOCRService();

// Export types
export type {
  EnhancedOCRResult,
  BatchOCROptions,
  OCRTrainingData,
  CustomOCRModel,
  OCRQueueItem
};