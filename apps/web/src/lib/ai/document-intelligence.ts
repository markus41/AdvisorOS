import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { openaiClient, AIResponse } from './openai-client';
import { documentAnalysisPrompts, formatPrompt } from './prompts';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  organizationId: string;
  uploadedBy: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
    tables?: Array<{
      rows: string[][];
      confidence: number;
    }>;
    keyValuePairs?: Array<{
      key: string;
      value: string;
      confidence: number;
    }>;
  }>;
  tables: Array<{
    pageNumber: number;
    rows: string[][];
    confidence: number;
  }>;
  keyValuePairs: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
}

export interface DocumentCategory {
  category: string;
  confidence: number;
  subcategory?: string;
  description: string;
  extractedData: Record<string, any>;
}

export interface DocumentAnomaly {
  type: 'format' | 'data' | 'calculation' | 'compliance' | 'fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
  confidence: number;
}

export interface DocumentAnalysisResult {
  id: string;
  metadata: DocumentMetadata;
  ocrResult: OCRResult;
  category: DocumentCategory;
  extractedData: Record<string, any>;
  anomalies: DocumentAnomaly[];
  duplicates: Array<{
    documentId: string;
    similarity: number;
    confidence: number;
  }>;
  filingsSuggestions: Array<{
    category: string;
    subcategory?: string;
    confidence: number;
    reasoning: string;
  }>;
  processingTime: number;
  costInfo: {
    ocrCost: number;
    aiCost: number;
    totalCost: number;
  };
}

class DocumentIntelligenceService {
  private formRecognizerClient: DocumentAnalysisClient | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
    const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY;

    if (endpoint && apiKey) {
      try {
        this.formRecognizerClient = new DocumentAnalysisClient(
          endpoint,
          new AzureKeyCredential(apiKey)
        );
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize Form Recognizer client:', error);
      }
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.formRecognizerClient !== null && openaiClient.isReady();
  }

  /**
   * Analyze document with OCR and AI intelligence
   */
  public async analyzeDocument(
    fileBuffer: Buffer,
    metadata: DocumentMetadata
  ): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    if (!this.isReady()) {
      throw new Error('Document Intelligence service is not ready');
    }

    const analysisId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Step 1: Perform OCR
      const ocrResult = await this.performOCR(fileBuffer, metadata.mimeType);
      const ocrCost = this.estimateOCRCost(fileBuffer.length, metadata.mimeType);

      // Step 2: Categorize document
      const category = await this.categorizeDocument(ocrResult, metadata);

      // Step 3: Extract structured data
      const extractedData = await this.extractStructuredData(ocrResult, category, metadata);

      // Step 4: Detect anomalies
      const anomalies = await this.detectAnomalies(ocrResult, extractedData, category);

      // Step 5: Check for duplicates
      const duplicates = await this.findDuplicates(ocrResult, metadata.organizationId);

      // Step 6: Generate filing suggestions
      const filingsSuggestions = await this.generateFilingSuggestions(category, extractedData);

      const processingTime = Date.now() - startTime;
      const aiCost = category.confidence > 0 ? 0.02 : 0; // Estimated AI cost

      return {
        id: analysisId,
        metadata,
        ocrResult,
        category,
        extractedData,
        anomalies,
        duplicates,
        filingsSuggestions,
        processingTime,
        costInfo: {
          ocrCost,
          aiCost,
          totalCost: ocrCost + aiCost,
        },
      };
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error(`Document analysis failed: ${error}`);
    }
  }

  /**
   * Perform OCR using Azure Form Recognizer
   */
  private async performOCR(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    if (!this.formRecognizerClient) {
      throw new Error('Form Recognizer client not initialized');
    }

    try {
      // Handle different file types
      let processedBuffer = fileBuffer;
      let contentType = mimeType;

      if (mimeType === 'application/pdf') {
        // Extract text from PDF
        const pdfData = await pdfParse(fileBuffer);
        const pdfText = pdfData.text;

        // If PDF has text, create a hybrid approach
        if (pdfText.trim().length > 0) {
          // Use both PDF text extraction and OCR for comprehensive analysis
          const ocrData = await this.formRecognizerClient.beginAnalyzeDocument(
            'prebuilt-document',
            fileBuffer,
            { contentType: 'application/pdf' }
          );

          const result = await ocrData.pollUntilDone();
          return this.processFormRecognizerResult(result, pdfText);
        }
      } else if (mimeType.startsWith('image/')) {
        // Optimize image for better OCR results
        processedBuffer = await this.optimizeImageForOCR(fileBuffer);
        contentType = 'image/png';
      }

      // Perform OCR with Form Recognizer
      const poller = await this.formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document',
        processedBuffer,
        { contentType }
      );

      const result = await poller.pollUntilDone();
      return this.processFormRecognizerResult(result);
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  /**
   * Process Form Recognizer results into our format
   */
  private processFormRecognizerResult(result: any, additionalText?: string): OCRResult {
    const pages: OCRResult['pages'] = [];
    const tables: OCRResult['tables'] = [];
    const keyValuePairs: OCRResult['keyValuePairs'] = [];
    let fullText = additionalText || '';

    // Process pages
    if (result.pages) {
      result.pages.forEach((page: any, index: number) => {
        const pageText = page.lines?.map((line: any) => line.content).join('\n') || '';
        fullText += (fullText ? '\n' : '') + pageText;

        pages.push({
          pageNumber: index + 1,
          text: pageText,
          confidence: page.lines?.reduce((avg: number, line: any) => avg + (line.confidence || 0), 0) / (page.lines?.length || 1) || 0,
        });
      });
    }

    // Process tables
    if (result.tables) {
      result.tables.forEach((table: any) => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentRowIndex = -1;

        table.cells.forEach((cell: any) => {
          if (cell.rowIndex !== currentRowIndex) {
            if (currentRow.length > 0) {
              rows.push(currentRow);
            }
            currentRow = [];
            currentRowIndex = cell.rowIndex;
          }
          currentRow[cell.columnIndex] = cell.content || '';
        });

        if (currentRow.length > 0) {
          rows.push(currentRow);
        }

        tables.push({
          pageNumber: table.boundingRegions?.[0]?.pageNumber || 1,
          rows,
          confidence: table.cells.reduce((avg: number, cell: any) => avg + (cell.confidence || 0), 0) / table.cells.length || 0,
        });
      });
    }

    // Process key-value pairs
    if (result.keyValuePairs) {
      result.keyValuePairs.forEach((pair: any) => {
        if (pair.key && pair.value) {
          keyValuePairs.push({
            key: pair.key.content || '',
            value: pair.value.content || '',
            confidence: Math.min(pair.key.confidence || 0, pair.value.confidence || 0),
          });
        }
      });
    }

    return {
      text: fullText,
      confidence: result.pages?.reduce((avg: number, page: any) =>
        avg + (page.lines?.reduce((lineAvg: number, line: any) => lineAvg + (line.confidence || 0), 0) / (page.lines?.length || 1) || 0), 0
      ) / (result.pages?.length || 1) || 0,
      pages,
      tables,
      keyValuePairs,
    };
  }

  /**
   * Optimize image for better OCR results
   */
  private async optimizeImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .normalize()
        .sharpen({ sigma: 1, flat: 1, jagged: 2 })
        .greyscale()
        .png({ compressionLevel: 6 })
        .toBuffer();
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return imageBuffer;
    }
  }

  /**
   * Categorize document using AI
   */
  private async categorizeDocument(
    ocrResult: OCRResult,
    metadata: DocumentMetadata
  ): Promise<DocumentCategory> {
    const prompt = formatPrompt(documentAnalysisPrompts.categorization, {
      documentType: metadata.mimeType,
      textContent: ocrResult.text.slice(0, 4000), // Limit text length
      fileName: metadata.fileName,
    });

    try {
      const response = await openaiClient.createStructuredCompletion<DocumentCategory>(
        prompt.user,
        {
          category: 'string',
          confidence: 'number',
          subcategory: 'string (optional)',
          description: 'string',
          extractedData: 'object'
        },
        {
          systemMessage: prompt.system,
          organizationId: metadata.organizationId,
          temperature: 0.1,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Document categorization failed:', error);
      // Fallback to basic categorization
      return {
        category: 'other',
        confidence: 0.1,
        description: 'Could not determine document category',
        extractedData: {},
      };
    }
  }

  /**
   * Extract structured data from document
   */
  private async extractStructuredData(
    ocrResult: OCRResult,
    category: DocumentCategory,
    metadata: DocumentMetadata
  ): Promise<Record<string, any>> {
    const prompt = formatPrompt(documentAnalysisPrompts.dataExtraction, {
      documentType: category.category,
      textContent: ocrResult.text.slice(0, 4000),
      ocrData: JSON.stringify({
        keyValuePairs: ocrResult.keyValuePairs.slice(0, 20),
        tables: ocrResult.tables.slice(0, 3),
      }),
    });

    try {
      const response = await openaiClient.createStructuredCompletion(
        prompt.user,
        {},
        {
          systemMessage: prompt.system,
          organizationId: metadata.organizationId,
          temperature: 0.1,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Data extraction failed:', error);
      // Return basic extracted data from OCR
      return {
        keyValuePairs: ocrResult.keyValuePairs,
        tables: ocrResult.tables,
      };
    }
  }

  /**
   * Detect anomalies in document
   */
  private async detectAnomalies(
    ocrResult: OCRResult,
    extractedData: Record<string, any>,
    category: DocumentCategory
  ): Promise<DocumentAnomaly[]> {
    // Get historical data for comparison (placeholder)
    const historicalData = {}; // This would come from database

    const prompt = formatPrompt(documentAnalysisPrompts.anomalyDetection, {
      documentType: category.category,
      extractedData: JSON.stringify(extractedData),
      historicalData: JSON.stringify(historicalData),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<DocumentAnomaly[]>(
        prompt.user,
        {
          type: 'array',
          items: {
            type: 'string',
            severity: 'string',
            description: 'string',
            location: 'string (optional)',
            suggestion: 'string (optional)',
            confidence: 'number'
          }
        },
        {
          systemMessage: prompt.system,
          temperature: 0.1,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return [];
    }
  }

  /**
   * Find duplicate documents
   */
  private async findDuplicates(
    ocrResult: OCRResult,
    organizationId: string
  ): Promise<Array<{ documentId: string; similarity: number; confidence: number }>> {
    try {
      // Generate embedding for current document
      const embedding = await openaiClient.createEmbedding(
        ocrResult.text.slice(0, 8000), // Limit text for embedding
        { organizationId }
      );

      // Compare with existing documents (placeholder)
      // This would involve vector similarity search in a vector database
      return [];
    } catch (error) {
      console.error('Duplicate detection failed:', error);
      return [];
    }
  }

  /**
   * Generate filing suggestions
   */
  private async generateFilingSuggestions(
    category: DocumentCategory,
    extractedData: Record<string, any>
  ): Promise<Array<{
    category: string;
    subcategory?: string;
    confidence: number;
    reasoning: string;
  }>> {
    // Rule-based filing suggestions based on document category and content
    const suggestions: Array<{
      category: string;
      subcategory?: string;
      confidence: number;
      reasoning: string;
    }> = [];

    switch (category.category) {
      case 'tax_return':
        suggestions.push({
          category: 'Tax Returns',
          subcategory: category.subcategory || 'Annual Returns',
          confidence: 0.9,
          reasoning: 'Tax document identified - should be filed under Tax Returns',
        });
        break;

      case 'invoice':
        suggestions.push({
          category: 'Accounts Receivable',
          subcategory: 'Client Invoices',
          confidence: 0.85,
          reasoning: 'Invoice document - file under Accounts Receivable for tracking',
        });
        break;

      case 'receipt':
        suggestions.push({
          category: 'Expenses',
          subcategory: 'Business Receipts',
          confidence: 0.8,
          reasoning: 'Receipt identified - categorize under business expenses',
        });
        break;

      case 'financial_statement':
        suggestions.push({
          category: 'Financial Reports',
          subcategory: 'Monthly Statements',
          confidence: 0.9,
          reasoning: 'Financial statement - organize under periodic financial reports',
        });
        break;

      default:
        suggestions.push({
          category: 'General Documents',
          confidence: 0.6,
          reasoning: 'General business document - review for proper categorization',
        });
    }

    return suggestions;
  }

  /**
   * Estimate OCR processing cost
   */
  private estimateOCRCost(fileSize: number, mimeType: string): number {
    // Azure Form Recognizer pricing (example rates)
    const baseCostPerPage = 0.001; // $0.001 per page
    const estimatedPages = Math.max(1, Math.ceil(fileSize / (mimeType === 'application/pdf' ? 100000 : 500000)));

    return baseCostPerPage * estimatedPages;
  }

  /**
   * Batch process multiple documents
   */
  public async batchAnalyzeDocuments(
    documents: Array<{ buffer: Buffer; metadata: DocumentMetadata }>
  ): Promise<DocumentAnalysisResult[]> {
    const results: DocumentAnalysisResult[] = [];
    const batchSize = 5; // Process 5 documents at a time

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchPromises = batch.map(doc =>
        this.analyzeDocument(doc.buffer, doc.metadata)
          .catch(error => {
            console.error(`Failed to process document ${doc.metadata.fileName}:`, error);
            return null;
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as DocumentAnalysisResult[]);
    }

    return results;
  }

  /**
   * Get processing statistics
   */
  public async getProcessingStats(organizationId: string): Promise<{
    totalDocuments: number;
    totalCost: number;
    avgProcessingTime: number;
    categoryBreakdown: Record<string, number>;
    anomaliesFound: number;
    duplicatesFound: number;
  }> {
    // This would query the database for processing statistics
    return {
      totalDocuments: 0,
      totalCost: 0,
      avgProcessingTime: 0,
      categoryBreakdown: {},
      anomaliesFound: 0,
      duplicatesFound: 0,
    };
  }
}

export const documentIntelligenceService = new DocumentIntelligenceService();
export default documentIntelligenceService;