import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { BlobServiceClient } from '@azure/storage-blob';
import { openaiClient } from '@/lib/ai/openai-client';
import { db } from '@cpa-platform/database';
import { W2Extractor } from './forms/W2Extractor';
import { Form1099Extractor } from './forms/Form1099Extractor';
import { InvoiceExtractor } from './forms/InvoiceExtractor';
import { BankStatementExtractor } from './forms/BankStatementExtractor';
import { TaxReturnExtractor } from './forms/TaxReturnExtractor';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  organizationId: string;
  uploadedBy: string;
  clientId?: string;
}

export interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documentId: string;
  organizationId: string;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: DocumentProcessingResult;
}

export interface DocumentProcessingResult {
  documentType: string;
  confidence: number;
  extractedData: Record<string, any>;
  validationErrors: ValidationError[];
  tables: ExtractedTable[];
  keyValuePairs: KeyValuePair[];
  fullText: string;
  insights: string[];
  suggestedActions: string[];
  processingTime: number;
  cost: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  confidence: number;
}

export interface ExtractedTable {
  id: string;
  pageNumber: number;
  headers: string[];
  rows: string[][];
  confidence: number;
  description?: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
  confidence: number;
  pageNumber?: number;
  boundingBox?: number[];
}

class OCRService {
  private formRecognizerClient: DocumentAnalysisClient | null = null;
  private blobServiceClient: BlobServiceClient | null = null;
  private extractors = new Map();
  private processingJobs = new Map<string, ProcessingJob>();

  constructor() {
    this.initialize();
    this.initializeExtractors();
  }

  private initialize(): void {
    const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT;
    const apiKey = process.env.FORM_RECOGNIZER_KEY;
    const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (endpoint && apiKey) {
      this.formRecognizerClient = new DocumentAnalysisClient(
        endpoint,
        new AzureKeyCredential(apiKey)
      );
    }

    if (storageConnectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    }
  }

  private initializeExtractors(): void {
    this.extractors.set('w2', new W2Extractor());
    this.extractors.set('1099', new Form1099Extractor());
    this.extractors.set('invoice', new InvoiceExtractor());
    this.extractors.set('bank_statement', new BankStatementExtractor());
    this.extractors.set('tax_return', new TaxReturnExtractor());
  }

  public isReady(): boolean {
    return this.formRecognizerClient !== null && openaiClient.isReady();
  }

  /**
   * Main document processing pipeline
   */
  public async processDocument(
    fileBuffer: Buffer,
    metadata: DocumentMetadata
  ): Promise<ProcessingJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ProcessingJob = {
      id: jobId,
      status: 'pending',
      documentId: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: metadata.organizationId,
      progress: 0,
      startedAt: new Date(),
    };

    this.processingJobs.set(jobId, job);

    // Start processing asynchronously
    this.processDocumentAsync(jobId, fileBuffer, metadata).catch(error => {
      console.error(`Processing job ${jobId} failed:`, error);
      this.updateJobStatus(jobId, 'failed', undefined, error.message);
    });

    return job;
  }

  private async processDocumentAsync(
    jobId: string,
    fileBuffer: Buffer,
    metadata: DocumentMetadata
  ): Promise<void> {
    const startTime = Date.now();
    this.updateJobStatus(jobId, 'processing', 10);

    try {
      // Step 1: Store document in blob storage
      await this.storeDocument(fileBuffer, metadata);
      this.updateJobProgress(jobId, 20);

      // Step 2: Detect document type
      const documentType = await this.detectDocumentType(fileBuffer, metadata);
      this.updateJobProgress(jobId, 35);

      // Step 3: Extract form data using appropriate extractor
      const formData = await this.extractFormData(fileBuffer, documentType, metadata);
      this.updateJobProgress(jobId, 55);

      // Step 4: Extract full text
      const fullText = await this.extractText(fileBuffer, metadata.mimeType);
      this.updateJobProgress(jobId, 70);

      // Step 5: Extract tables
      const tables = await this.extractTables(fileBuffer, metadata.mimeType);
      this.updateJobProgress(jobId, 80);

      // Step 6: Validate extracted data
      const validationErrors = await this.validateExtractedData(documentType, formData);
      this.updateJobProgress(jobId, 90);

      // Step 7: Generate insights and suggestions
      const insights = await this.generateInsights(documentType, formData, fullText);
      const suggestedActions = await this.generateSuggestedActions(documentType, formData, validationErrors);

      const processingTime = Date.now() - startTime;
      const cost = this.calculateProcessingCost(fileBuffer.length, documentType);

      const result: DocumentProcessingResult = {
        documentType: documentType.type,
        confidence: documentType.confidence,
        extractedData: formData,
        validationErrors,
        tables,
        keyValuePairs: [], // Will be populated from Form Recognizer
        fullText,
        insights,
        suggestedActions,
        processingTime,
        cost,
      };

      // Store results in database
      await this.storeProcessingResults(jobId, result, metadata);

      this.updateJobStatus(jobId, 'completed', 100, undefined, result);

    } catch (error) {
      console.error(`Document processing failed for job ${jobId}:`, error);
      this.updateJobStatus(jobId, 'failed', undefined, error.message);
    }
  }

  /**
   * Detect document type using AI and pattern matching
   */
  public async detectDocumentType(
    fileBuffer: Buffer,
    metadata: DocumentMetadata
  ): Promise<{ type: string; confidence: number; subcategory?: string }> {
    try {
      // Quick pattern-based detection first
      const fileName = metadata.fileName.toLowerCase();

      if (fileName.includes('w-2') || fileName.includes('w2')) {
        return { type: 'w2', confidence: 0.9 };
      }
      if (fileName.includes('1099')) {
        return { type: '1099', confidence: 0.9 };
      }
      if (fileName.includes('invoice') || fileName.includes('bill')) {
        return { type: 'invoice', confidence: 0.8 };
      }
      if (fileName.includes('statement') || fileName.includes('bank')) {
        return { type: 'bank_statement', confidence: 0.8 };
      }
      if (fileName.includes('1040') || fileName.includes('tax')) {
        return { type: 'tax_return', confidence: 0.8 };
      }

      // Use OCR + AI for content-based detection
      const ocrText = await this.extractTextQuick(fileBuffer, metadata.mimeType);
      const textSample = ocrText.slice(0, 2000);

      const prompt = `
Analyze this document text and determine the document type.

Document text:
${textSample}

Return a JSON response with:
{
  "type": "w2|1099|invoice|bank_statement|tax_return|receipt|other",
  "confidence": number between 0 and 1,
  "subcategory": "optional specific subtype",
  "reasoning": "brief explanation"
}

Common document types:
- w2: Form W-2 Wage and Tax Statement
- 1099: Various 1099 forms (1099-MISC, 1099-NEC, etc.)
- invoice: Business invoices or bills
- bank_statement: Bank or credit card statements
- tax_return: Tax returns (1040, 1120, etc.)
- receipt: Receipts or expense documents
- other: Any other document type
`;

      const response = await openaiClient.createChatCompletion(
        [{ role: 'user', content: prompt }],
        {
          organizationId: metadata.organizationId,
          temperature: 0.1,
          maxTokens: 200,
        }
      );

      try {
        const result = JSON.parse(response.content);
        return {
          type: result.type || 'other',
          confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
          subcategory: result.subcategory,
        };
      } catch (parseError) {
        console.warn('Failed to parse AI response for document type detection');
        return { type: 'other', confidence: 0.3 };
      }

    } catch (error) {
      console.error('Document type detection failed:', error);
      return { type: 'other', confidence: 0.1 };
    }
  }

  /**
   * Extract structured data using form-specific extractors
   */
  public async extractFormData(
    fileBuffer: Buffer,
    documentType: { type: string; confidence: number },
    metadata: DocumentMetadata
  ): Promise<Record<string, any>> {
    const extractor = this.extractors.get(documentType.type);

    if (!extractor) {
      console.warn(`No extractor found for document type: ${documentType.type}`);
      return await this.extractGenericFormData(fileBuffer, metadata);
    }

    try {
      return await extractor.extract(fileBuffer, metadata, this.formRecognizerClient);
    } catch (error) {
      console.error(`Form extraction failed for type ${documentType.type}:`, error);
      return await this.extractGenericFormData(fileBuffer, metadata);
    }
  }

  /**
   * Generic form data extraction fallback
   */
  private async extractGenericFormData(
    fileBuffer: Buffer,
    metadata: DocumentMetadata
  ): Promise<Record<string, any>> {
    if (!this.formRecognizerClient) {
      throw new Error('Form Recognizer client not available');
    }

    const poller = await this.formRecognizerClient.beginAnalyzeDocument(
      'prebuilt-document',
      fileBuffer
    );

    const result = await poller.pollUntilDone();

    const extractedData: Record<string, any> = {};

    // Extract key-value pairs
    if (result.keyValuePairs) {
      result.keyValuePairs.forEach((pair: any) => {
        if (pair.key && pair.value) {
          const key = pair.key.content.replace(/[:\s]+$/, '').toLowerCase();
          extractedData[key] = pair.value.content;
        }
      });
    }

    return extractedData;
  }

  /**
   * Extract full text from document
   */
  public async extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.formRecognizerClient) {
      throw new Error('Form Recognizer client not available');
    }

    try {
      // Handle PDF text extraction
      if (mimeType === 'application/pdf') {
        try {
          const pdfData = await pdfParse(fileBuffer);
          if (pdfData.text.trim().length > 100) {
            return pdfData.text;
          }
        } catch (pdfError) {
          console.warn('PDF text extraction failed, falling back to OCR');
        }
      }

      // Use OCR for images or PDFs without text
      const poller = await this.formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-read',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return result.content || '';

    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error(`Text extraction failed: ${error}`);
    }
  }

  /**
   * Extract tables from document
   */
  public async extractTables(fileBuffer: Buffer, mimeType: string): Promise<ExtractedTable[]> {
    if (!this.formRecognizerClient) {
      throw new Error('Form Recognizer client not available');
    }

    try {
      const poller = await this.formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-layout',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      const tables: ExtractedTable[] = [];

      if (result.tables) {
        result.tables.forEach((table: any, index: number) => {
          const rows: string[][] = [];
          let headers: string[] = [];

          // Group cells by row
          const rowMap = new Map<number, Map<number, string>>();

          table.cells.forEach((cell: any) => {
            if (!rowMap.has(cell.rowIndex)) {
              rowMap.set(cell.rowIndex, new Map());
            }
            rowMap.get(cell.rowIndex)!.set(cell.columnIndex, cell.content || '');
          });

          // Convert to array format
          const sortedRows = Array.from(rowMap.keys()).sort((a, b) => a - b);

          sortedRows.forEach((rowIndex) => {
            const cellMap = rowMap.get(rowIndex)!;
            const maxCol = Math.max(...Array.from(cellMap.keys()));
            const row: string[] = [];

            for (let col = 0; col <= maxCol; col++) {
              row.push(cellMap.get(col) || '');
            }

            if (rowIndex === 0) {
              headers = row;
            } else {
              rows.push(row);
            }
          });

          tables.push({
            id: `table_${index + 1}`,
            pageNumber: table.boundingRegions?.[0]?.pageNumber || 1,
            headers,
            rows,
            confidence: table.cells.reduce((sum: number, cell: any) =>
              sum + (cell.confidence || 0), 0) / table.cells.length,
          });
        });
      }

      return tables;

    } catch (error) {
      console.error('Table extraction failed:', error);
      return [];
    }
  }

  /**
   * Validate extracted data
   */
  public async validateExtractedData(
    documentType: { type: string; confidence: number },
    extractedData: Record<string, any>
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Get validator for document type
    const extractor = this.extractors.get(documentType.type);
    if (extractor && extractor.validate) {
      const validationResult = await extractor.validate(extractedData);
      errors.push(...validationResult);
    }

    // Generic validations
    if (documentType.confidence < 0.7) {
      errors.push({
        field: 'document_type',
        message: 'Low confidence in document type detection. Please verify document category.',
        severity: 'warning',
        confidence: documentType.confidence,
      });
    }

    // Check for missing critical fields based on document type
    const criticalFields = this.getCriticalFields(documentType.type);
    criticalFields.forEach(field => {
      if (!extractedData[field] || extractedData[field] === '') {
        errors.push({
          field,
          message: `Missing required field: ${field}`,
          severity: 'error',
          confidence: 0.9,
        });
      }
    });

    return errors;
  }

  /**
   * Quick text extraction for document type detection
   */
  private async extractTextQuick(fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text.slice(0, 2000);
      } catch (error) {
        // Fall through to OCR
      }
    }

    if (!this.formRecognizerClient) {
      return '';
    }

    try {
      const poller = await this.formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-read',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return (result.content || '').slice(0, 2000);
    } catch (error) {
      console.warn('Quick text extraction failed:', error);
      return '';
    }
  }

  /**
   * Generate insights about the document
   */
  private async generateInsights(
    documentType: string,
    extractedData: Record<string, any>,
    fullText: string
  ): Promise<string[]> {
    try {
      const prompt = `
Analyze this ${documentType} document and provide 3-5 key insights for a CPA.

Extracted data: ${JSON.stringify(extractedData)}

Focus on:
- Tax implications
- Compliance requirements
- Potential deductions or credits
- Unusual amounts or patterns
- Required follow-up actions

Return insights as a JSON array of strings.
`;

      const response = await openaiClient.createChatCompletion(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.3,
          maxTokens: 300,
        }
      );

      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        return [response.content];
      }
    } catch (error) {
      console.error('Insight generation failed:', error);
      return [];
    }
  }

  /**
   * Generate suggested actions
   */
  private async generateSuggestedActions(
    documentType: string,
    extractedData: Record<string, any>,
    validationErrors: ValidationError[]
  ): Promise<string[]> {
    const actions: string[] = [];

    // Add actions based on validation errors
    validationErrors.forEach(error => {
      if (error.severity === 'error') {
        actions.push(`Resolve: ${error.message}`);
      }
    });

    // Add document-specific actions
    switch (documentType) {
      case 'w2':
        actions.push('Verify W-2 information matches payroll records');
        actions.push('Update client tax preparation worksheet');
        break;
      case '1099':
        actions.push('Check if backup withholding applies');
        actions.push('Verify 1099 against client records');
        break;
      case 'invoice':
        actions.push('Record in accounts receivable');
        actions.push('Check payment terms and due date');
        break;
    }

    return actions;
  }

  /**
   * Get critical fields for validation
   */
  private getCriticalFields(documentType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      w2: ['employer_name', 'employee_name', 'wages', 'federal_tax_withheld'],
      '1099': ['payer_name', 'recipient_name', 'income_amount'],
      invoice: ['vendor_name', 'amount', 'date'],
      bank_statement: ['account_number', 'statement_date', 'ending_balance'],
      tax_return: ['taxpayer_name', 'tax_year', 'filing_status'],
    };

    return fieldMap[documentType] || [];
  }

  /**
   * Store document in blob storage
   */
  private async storeDocument(fileBuffer: Buffer, metadata: DocumentMetadata): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('Blob service client not available');
    }

    const containerName = 'documents';
    const blobName = `${metadata.organizationId}/${Date.now()}_${metadata.fileName}`;

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: metadata.mimeType,
      },
      metadata: {
        originalName: metadata.fileName,
        uploadedBy: metadata.uploadedBy,
        uploadedAt: metadata.uploadedAt.toISOString(),
      },
    });

    return blobName;
  }

  /**
   * Store processing results in database
   */
  private async storeProcessingResults(
    jobId: string,
    result: DocumentProcessingResult,
    metadata: DocumentMetadata
  ): Promise<void> {
    try {
      await db.documentProcessing.create({
        data: {
          id: jobId,
          organizationId: metadata.organizationId,
          clientId: metadata.clientId,
          fileName: metadata.fileName,
          documentType: result.documentType,
          confidence: result.confidence,
          extractedData: result.extractedData,
          validationErrors: result.validationErrors,
          tables: result.tables,
          fullText: result.fullText,
          insights: result.insights,
          suggestedActions: result.suggestedActions,
          processingTime: result.processingTime,
          cost: result.cost,
          uploadedBy: metadata.uploadedBy,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store processing results:', error);
      // Don't throw - processing succeeded even if storage failed
    }
  }

  /**
   * Calculate processing cost
   */
  private calculateProcessingCost(fileSize: number, documentType: string): number {
    const baseCost = 0.001; // Base cost per document
    const sizeCost = (fileSize / 1024 / 1024) * 0.0005; // Cost per MB
    const typeCost = documentType === 'other' ? 0.0005 : 0.001; // Higher cost for specific extraction

    return baseCost + sizeCost + typeCost;
  }

  /**
   * Update job status and progress
   */
  private updateJobStatus(
    jobId: string,
    status: ProcessingJob['status'],
    progress?: number,
    error?: string,
    result?: DocumentProcessingResult
  ): void {
    const job = this.processingJobs.get(jobId);
    if (job) {
      job.status = status;
      if (progress !== undefined) job.progress = progress;
      if (error) job.error = error;
      if (result) job.result = result;
      if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date();
      }
    }
  }

  private updateJobProgress(jobId: string, progress: number): void {
    const job = this.processingJobs.get(jobId);
    if (job) {
      job.progress = progress;
    }
  }

  /**
   * Get job status
   */
  public getJobStatus(jobId: string): ProcessingJob | null {
    return this.processingJobs.get(jobId) || null;
  }

  /**
   * Get processing statistics
   */
  public async getProcessingStats(organizationId: string): Promise<{
    totalProcessed: number;
    totalCost: number;
    avgProcessingTime: number;
    documentTypeBreakdown: Record<string, number>;
    errorRate: number;
  }> {
    try {
      const stats = await db.documentProcessing.aggregate({
        where: { organizationId },
        _count: { id: true },
        _sum: { cost: true, processingTime: true },
        _avg: { processingTime: true },
      });

      const typeBreakdown = await db.documentProcessing.groupBy({
        by: ['documentType'],
        where: { organizationId },
        _count: { id: true },
      });

      const errorCount = await db.documentProcessing.count({
        where: {
          organizationId,
          validationErrors: { not: [] },
        },
      });

      const breakdown: Record<string, number> = {};
      typeBreakdown.forEach(group => {
        breakdown[group.documentType] = group._count.id;
      });

      return {
        totalProcessed: stats._count.id || 0,
        totalCost: stats._sum.cost || 0,
        avgProcessingTime: stats._avg.processingTime || 0,
        documentTypeBreakdown: breakdown,
        errorRate: stats._count.id ? (errorCount / stats._count.id) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return {
        totalProcessed: 0,
        totalCost: 0,
        avgProcessingTime: 0,
        documentTypeBreakdown: {},
        errorRate: 0,
      };
    }
  }

  /**
   * Cleanup old processing jobs from memory
   */
  public cleanupOldJobs(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [jobId, job] of this.processingJobs.entries()) {
      if (job.startedAt < cutoff && (job.status === 'completed' || job.status === 'failed')) {
        this.processingJobs.delete(jobId);
      }
    }
  }
}

export const ocrService = new OCRService();
export default ocrService;