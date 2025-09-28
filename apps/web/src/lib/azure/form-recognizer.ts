import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';

if (!process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || !process.env.AZURE_FORM_RECOGNIZER_KEY) {
  throw new Error('Azure Form Recognizer credentials not found in environment variables');
}

const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY;

const formRecognizerClient = new DocumentAnalysisClient(
  endpoint,
  new AzureKeyCredential(apiKey)
);

export interface OCRResult {
  documentType: string;
  confidence: number;
  extractedData: Record<string, any>;
  rawText: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    lines: Array<{
      content: string;
      boundingBox: number[];
      confidence: number;
    }>;
    tables: Array<{
      rowCount: number;
      columnCount: number;
      cells: Array<{
        content: string;
        rowIndex: number;
        columnIndex: number;
        boundingBox: number[];
      }>;
    }>;
  }>;
  fields: Array<{
    name: string;
    value: any;
    confidence: number;
    boundingBox?: number[];
  }>;
  metadata: {
    modelId: string;
    apiVersion: string;
    processedAt: Date;
    processingTime: number;
  };
}

export interface DocumentTypeMapping {
  modelId: string;
  documentType: string;
  extractionFields: string[];
}

// Predefined document type models
export const DOCUMENT_MODELS: Record<string, DocumentTypeMapping> = {
  'w2': {
    modelId: 'prebuilt-tax.us.w2',
    documentType: 'W-2 Form',
    extractionFields: ['Employee', 'Employer', 'WagesAndTips', 'FederalIncomeTaxWithheld', 'SocialSecurityWages']
  },
  '1099-misc': {
    modelId: 'prebuilt-tax.us.1099misc',
    documentType: '1099-MISC Form',
    extractionFields: ['Payer', 'Recipient', 'Rents', 'Royalties', 'OtherIncome', 'FederalIncomeTaxWithheld']
  },
  '1099-nec': {
    modelId: 'prebuilt-tax.us.1099nec',
    documentType: '1099-NEC Form',
    extractionFields: ['Payer', 'Recipient', 'NonemployeeCompensation', 'FederalIncomeTaxWithheld']
  },
  'invoice': {
    modelId: 'prebuilt-invoice',
    documentType: 'Invoice',
    extractionFields: ['InvoiceId', 'InvoiceDate', 'DueDate', 'VendorName', 'CustomerName', 'InvoiceTotal', 'AmountDue']
  },
  'receipt': {
    modelId: 'prebuilt-receipt',
    documentType: 'Receipt',
    extractionFields: ['MerchantName', 'TransactionDate', 'TransactionTime', 'Total', 'Tax', 'Tip']
  },
  'bank-statement': {
    modelId: 'prebuilt-document', // Generic model for bank statements
    documentType: 'Bank Statement',
    extractionFields: ['AccountNumber', 'StatementDate', 'BeginningBalance', 'EndingBalance', 'Transactions']
  },
  'tax-return': {
    modelId: 'prebuilt-document', // Generic model for tax returns
    documentType: 'Tax Return',
    extractionFields: ['TaxYear', 'FilingStatus', 'AGI', 'TotalTax', 'RefundAmount']
  }
};

export class FormRecognizerService {
  /**
   * Analyze document with appropriate model based on document type detection
   */
  async analyzeDocument(
    documentBuffer: Buffer,
    documentType?: string,
    options: {
      pages?: string;
      locale?: string;
    } = {}
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      // Determine which model to use
      let modelId: string;
      let expectedDocumentType: string;

      if (documentType && DOCUMENT_MODELS[documentType]) {
        modelId = DOCUMENT_MODELS[documentType].modelId;
        expectedDocumentType = DOCUMENT_MODELS[documentType].documentType;
      } else {
        // Use general document model for unknown types
        modelId = 'prebuilt-document';
        expectedDocumentType = 'General Document';
      }

      console.log(`Starting OCR analysis with model: ${modelId}`);

      // Start analysis
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        modelId,
        documentBuffer,
        {
          pages: options.pages,
          locale: options.locale || 'en-US'
        }
      );

      // Wait for completion
      const result = await poller.pollUntilDone();

      if (!result) {
        throw new Error('No result received from Form Recognizer');
      }

      const processingTime = Date.now() - startTime;

      // Process the results
      const ocrResult: OCRResult = {
        documentType: expectedDocumentType,
        confidence: this.calculateOverallConfidence(result),
        extractedData: this.extractStructuredData(result, documentType),
        rawText: this.extractRawText(result),
        pages: this.processPages(result),
        fields: this.processFields(result),
        metadata: {
          modelId,
          apiVersion: '2023-07-31',
          processedAt: new Date(),
          processingTime
        }
      };

      console.log(`OCR analysis completed in ${processingTime}ms with confidence: ${ocrResult.confidence}`);
      return ocrResult;

    } catch (error) {
      console.error('Form Recognizer analysis failed:', error);
      throw new Error(`OCR analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect document type automatically based on content
   */
  async detectDocumentType(documentBuffer: Buffer): Promise<{
    detectedType: string;
    confidence: number;
    suggestedModel: string;
  }> {
    try {
      // Use layout model to get basic structure
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-layout',
        documentBuffer
      );

      const result = await poller.pollUntilDone();

      if (!result) {
        throw new Error('No result received from document type detection');
      }

      // Simple heuristic-based document type detection
      const text = this.extractRawText(result).toLowerCase();

      // Check for tax forms
      if (text.includes('form w-2') || text.includes('wage and tax statement')) {
        return {
          detectedType: 'w2',
          confidence: 0.9,
          suggestedModel: DOCUMENT_MODELS.w2.modelId
        };
      }

      if (text.includes('form 1099') && text.includes('misc')) {
        return {
          detectedType: '1099-misc',
          confidence: 0.9,
          suggestedModel: DOCUMENT_MODELS['1099-misc'].modelId
        };
      }

      if (text.includes('form 1099') && text.includes('nec')) {
        return {
          detectedType: '1099-nec',
          confidence: 0.9,
          suggestedModel: DOCUMENT_MODELS['1099-nec'].modelId
        };
      }

      // Check for invoices
      if (text.includes('invoice') && (text.includes('total') || text.includes('amount due'))) {
        return {
          detectedType: 'invoice',
          confidence: 0.8,
          suggestedModel: DOCUMENT_MODELS.invoice.modelId
        };
      }

      // Check for receipts
      if (text.includes('receipt') || (text.includes('total') && text.includes('date'))) {
        return {
          detectedType: 'receipt',
          confidence: 0.7,
          suggestedModel: DOCUMENT_MODELS.receipt.modelId
        };
      }

      // Check for bank statements
      if (text.includes('statement') && (text.includes('balance') || text.includes('account'))) {
        return {
          detectedType: 'bank-statement',
          confidence: 0.7,
          suggestedModel: DOCUMENT_MODELS['bank-statement'].modelId
        };
      }

      // Default to general document
      return {
        detectedType: 'general',
        confidence: 0.5,
        suggestedModel: 'prebuilt-document'
      };

    } catch (error) {
      console.error('Document type detection failed:', error);
      return {
        detectedType: 'unknown',
        confidence: 0.0,
        suggestedModel: 'prebuilt-document'
      };
    }
  }

  /**
   * Extract structured data based on document type
   */
  private extractStructuredData(result: any, documentType?: string): Record<string, any> {
    const structuredData: Record<string, any> = {};

    if (!result.documents || result.documents.length === 0) {
      return structuredData;
    }

    const document = result.documents[0];

    // Extract fields based on document type
    if (documentType && DOCUMENT_MODELS[documentType]) {
      const expectedFields = DOCUMENT_MODELS[documentType].extractionFields;

      expectedFields.forEach(fieldName => {
        if (document.fields && document.fields[fieldName]) {
          const field = document.fields[fieldName];
          structuredData[fieldName] = {
            value: field.value || field.content,
            confidence: field.confidence || 0,
            type: field.type || 'string'
          };
        }
      });
    } else {
      // Extract all available fields for general documents
      if (document.fields) {
        Object.keys(document.fields).forEach(key => {
          const field = document.fields[key];
          structuredData[key] = {
            value: field.value || field.content,
            confidence: field.confidence || 0,
            type: field.type || 'string'
          };
        });
      }
    }

    return structuredData;
  }

  /**
   * Extract raw text from all pages
   */
  private extractRawText(result: any): string {
    if (!result.content) {
      return '';
    }
    return result.content;
  }

  /**
   * Process pages information
   */
  private processPages(result: any): OCRResult['pages'] {
    if (!result.pages) {
      return [];
    }

    return result.pages.map((page: any, index: number) => ({
      pageNumber: index + 1,
      text: page.words?.map((word: any) => word.content).join(' ') || '',
      lines: page.lines?.map((line: any) => ({
        content: line.content,
        boundingBox: line.polygon || [],
        confidence: line.confidence || 0
      })) || [],
      tables: page.tables?.map((table: any) => ({
        rowCount: table.rowCount || 0,
        columnCount: table.columnCount || 0,
        cells: table.cells?.map((cell: any) => ({
          content: cell.content,
          rowIndex: cell.rowIndex,
          columnIndex: cell.columnIndex,
          boundingBox: cell.polygon || []
        })) || []
      })) || []
    }));
  }

  /**
   * Process extracted fields
   */
  private processFields(result: any): OCRResult['fields'] {
    const fields: OCRResult['fields'] = [];

    if (!result.documents || result.documents.length === 0) {
      return fields;
    }

    const document = result.documents[0];

    if (document.fields) {
      Object.keys(document.fields).forEach(key => {
        const field = document.fields[key];
        fields.push({
          name: key,
          value: field.value || field.content,
          confidence: field.confidence || 0,
          boundingBox: field.polygon || undefined
        });
      });
    }

    return fields;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(result: any): number {
    if (!result.documents || result.documents.length === 0) {
      return 0;
    }

    const document = result.documents[0];

    if (document.confidence !== undefined) {
      return document.confidence;
    }

    // Calculate average confidence from fields
    if (document.fields) {
      const fieldConfidences = Object.values(document.fields)
        .map((field: any) => field.confidence || 0)
        .filter(conf => conf > 0);

      if (fieldConfidences.length > 0) {
        return fieldConfidences.reduce((sum, conf) => sum + conf, 0) / fieldConfidences.length;
      }
    }

    // Calculate average confidence from pages
    if (result.pages) {
      const lineConfidences = result.pages
        .flatMap((page: any) => page.lines || [])
        .map((line: any) => line.confidence || 0)
        .filter((conf: number) => conf > 0);

      if (lineConfidences.length > 0) {
        return lineConfidences.reduce((sum: number, conf: number) => sum + conf, 0) / lineConfidences.length;
      }
    }

    return 0.5; // Default moderate confidence
  }

  /**
   * Validate extraction results based on document type
   */
  validateExtraction(result: OCRResult, documentType: string): {
    isValid: boolean;
    missingFields: string[];
    lowConfidenceFields: string[];
    validationScore: number;
  } {
    const validation = {
      isValid: true,
      missingFields: [] as string[],
      lowConfidenceFields: [] as string[],
      validationScore: 1.0
    };

    if (!DOCUMENT_MODELS[documentType]) {
      return validation;
    }

    const requiredFields = DOCUMENT_MODELS[documentType].extractionFields;
    const minConfidence = 0.7;

    // Check for missing required fields
    requiredFields.forEach(fieldName => {
      if (!result.extractedData[fieldName]) {
        validation.missingFields.push(fieldName);
        validation.isValid = false;
      } else if (result.extractedData[fieldName].confidence < minConfidence) {
        validation.lowConfidenceFields.push(fieldName);
      }
    });

    // Calculate validation score
    const totalFields = requiredFields.length;
    const missingCount = validation.missingFields.length;
    const lowConfidenceCount = validation.lowConfidenceFields.length;

    validation.validationScore = Math.max(0,
      (totalFields - missingCount - (lowConfidenceCount * 0.5)) / totalFields
    );

    if (validation.validationScore < 0.5) {
      validation.isValid = false;
    }

    return validation;
  }
}

// Export singleton instance
export const formRecognizer = new FormRecognizerService();

// Export types and constants
export type { OCRResult, DocumentTypeMapping };
export { DOCUMENT_MODELS };