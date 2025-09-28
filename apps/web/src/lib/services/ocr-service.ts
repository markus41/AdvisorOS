import { prisma } from '@cpa-platform/database';
import { formRecognizer, type OCRResult, DOCUMENT_MODELS } from '../azure/form-recognizer';
import { azureStorage } from '../azure/storage';

export interface OCRProcessingRequest {
  documentId: string;
  forceReprocess?: boolean;
  documentType?: string;
  options?: {
    pages?: string;
    locale?: string;
  };
}

export interface OCRReviewData {
  documentId: string;
  reviewedBy: string;
  extractedData: Record<string, any>;
  confidence: number;
  needsReview: boolean;
  comments?: string;
}

export interface OCRQueueItem {
  id: string;
  documentId: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

export interface TaxFormData {
  formType: string;
  taxYear: number;
  employee?: {
    name: string;
    ssn: string;
    address: string;
  };
  employer?: {
    name: string;
    ein: string;
    address: string;
  };
  wages?: {
    federalWages: number;
    federalWithholding: number;
    socialSecurityWages: number;
    socialSecurityWithholding: number;
    medicareWages: number;
    medicareWithholding: number;
  };
  stateInfo?: {
    state: string;
    stateWages: number;
    stateWithholding: number;
  };
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  vendor: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  customer: {
    name: string;
    address?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    amountDue: number;
  };
}

export interface ReceiptData {
  merchantName: string;
  transactionDate: Date;
  transactionTime?: string;
  items: Array<{
    description: string;
    quantity?: number;
    price: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    tip?: number;
    total: number;
  };
  paymentMethod?: string;
}

export interface BankStatementData {
  accountNumber: string;
  statementPeriod: {
    from: Date;
    to: Date;
  };
  beginningBalance: number;
  endingBalance: number;
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    balance?: number;
  }>;
  summary: {
    totalDebits: number;
    totalCredits: number;
    numberOfTransactions: number;
  };
}

export class OCRService {
  private processingQueue: Map<string, OCRQueueItem> = new Map();

  /**
   * Process OCR for a document
   */
  async processDocument(request: OCRProcessingRequest): Promise<{
    success: boolean;
    ocrResult?: OCRResult;
    structuredData?: any;
    needsReview: boolean;
    errors?: string[];
  }> {
    const { documentId, forceReprocess = false, documentType, options = {} } = request;

    try {
      // Get document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          client: true,
          organization: true
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Check if already processed and not forcing reprocess
      if (!forceReprocess && document.ocrStatus === 'completed') {
        return {
          success: true,
          ocrResult: document.extractedData as OCRResult,
          structuredData: this.extractStructuredData(document.extractedData as OCRResult, documentType),
          needsReview: document.needsReview
        };
      }

      // Update status to processing
      await prisma.document.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'processing',
          ocrProcessedAt: new Date()
        }
      });

      // Get file from Azure Storage
      const blobName = document.metadata?.blobName as string;
      if (!blobName) {
        throw new Error('Document blob name not found');
      }

      const fileBuffer = await this.downloadFileFromStorage(blobName);

      // Auto-detect document type if not provided
      let finalDocumentType = documentType;
      if (!finalDocumentType) {
        const detection = await formRecognizer.detectDocumentType(fileBuffer);
        finalDocumentType = detection.detectedType;
      }

      // Process OCR
      const ocrResult = await formRecognizer.analyzeDocument(fileBuffer, finalDocumentType, options);

      // Validate extraction results
      const validation = formRecognizer.validateExtraction(ocrResult, finalDocumentType);

      // Extract structured data based on document type
      const structuredData = this.extractStructuredData(ocrResult, finalDocumentType);

      // Determine if manual review is needed
      const needsReview = !validation.isValid ||
                         ocrResult.confidence < 0.8 ||
                         validation.lowConfidenceFields.length > 0;

      // Update document with results
      await prisma.document.update({
        where: { id: documentId },
        data: {
          ocrStatus: needsReview ? 'manual_review' : 'completed',
          ocrConfidence: ocrResult.confidence,
          ocrProcessedAt: new Date(),
          extractedData: ocrResult,
          rawOcrData: ocrResult,
          ocrModel: ocrResult.metadata.modelId,
          needsReview,
          // Auto-update category if detected type is more specific
          category: this.mapDocumentTypeToCategory(finalDocumentType),
          // Extract year from document if found
          year: structuredData.taxYear || structuredData.invoiceDate?.getFullYear() || document.year
        }
      });

      // Log OCR processing for audit
      await this.logOCRProcessing(documentId, ocrResult, validation);

      return {
        success: true,
        ocrResult,
        structuredData,
        needsReview,
        errors: validation.missingFields.length > 0 ? [`Missing fields: ${validation.missingFields.join(', ')}`] : undefined
      };

    } catch (error) {
      console.error('OCR processing failed:', error);

      // Update document with error status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'failed',
          ocrProcessedAt: new Date()
        }
      });

      return {
        success: false,
        needsReview: true,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Process multiple documents in batch
   */
  async batchProcessDocuments(
    documentIds: string[],
    options: {
      maxConcurrent?: number;
      priority?: number;
    } = {}
  ): Promise<{
    processed: string[];
    failed: Array<{ documentId: string; error: string }>;
  }> {
    const { maxConcurrent = 3, priority = 1 } = options;
    const processed: string[] = [];
    const failed: Array<{ documentId: string; error: string }> = [];

    // Process in batches to avoid overwhelming the service
    const batches = this.chunkArray(documentIds, maxConcurrent);

    for (const batch of batches) {
      const promises = batch.map(async (documentId) => {
        try {
          const result = await this.processDocument({ documentId });
          if (result.success) {
            processed.push(documentId);
          } else {
            failed.push({
              documentId,
              error: result.errors?.join(', ') || 'Unknown error'
            });
          }
        } catch (error) {
          failed.push({
            documentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.all(promises);
    }

    return { processed, failed };
  }

  /**
   * Submit manual review for OCR results
   */
  async submitManualReview(reviewData: OCRReviewData): Promise<void> {
    const { documentId, reviewedBy, extractedData, confidence, needsReview, comments } = reviewData;

    try {
      // Update document with reviewed data
      await prisma.document.update({
        where: { id: documentId },
        data: {
          extractedData,
          ocrConfidence: confidence,
          needsReview,
          reviewedAt: new Date(),
          reviewedBy,
          ocrStatus: needsReview ? 'manual_review' : 'completed'
        }
      });

      // Create audit log for manual review
      await prisma.auditLog.create({
        data: {
          action: 'ocr_manual_review',
          entityType: 'document',
          entityId: documentId,
          newValues: {
            confidence,
            needsReview,
            comments
          },
          userId: reviewedBy,
          organizationId: (await prisma.document.findUnique({
            where: { id: documentId },
            select: { organizationId: true }
          }))?.organizationId || ''
        }
      });

    } catch (error) {
      console.error('Manual review submission failed:', error);
      throw new Error(`Manual review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get documents that need manual review
   */
  async getDocumentsNeedingReview(
    organizationId: string,
    options: {
      clientId?: string;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    documents: any[];
    total: number;
  }> {
    const { clientId, category, limit = 50, offset = 0 } = options;

    try {
      const where: any = {
        organizationId,
        needsReview: true,
        ocrStatus: 'manual_review',
        deletedAt: null
      };

      if (clientId) where.clientId = clientId;
      if (category) where.category = category;

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          include: {
            client: {
              select: {
                businessName: true,
                primaryContactName: true
              }
            },
            uploader: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: [
            { ocrConfidence: 'asc' }, // Lowest confidence first
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit
        }),
        prisma.document.count({ where })
      ]);

      return { documents, total };

    } catch (error) {
      console.error('Failed to get documents needing review:', error);
      throw new Error(`Failed to retrieve review queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get OCR statistics for organization
   */
  async getOCRStatistics(organizationId: string, dateRange?: { from: Date; to: Date }): Promise<{
    totalProcessed: number;
    averageConfidence: number;
    needingReview: number;
    byDocumentType: Record<string, {
      count: number;
      averageConfidence: number;
    }>;
    byStatus: Record<string, number>;
  }> {
    try {
      const where: any = {
        organizationId,
        deletedAt: null,
        ocrStatus: { not: 'pending' }
      };

      if (dateRange) {
        where.ocrProcessedAt = {
          gte: dateRange.from,
          lte: dateRange.to
        };
      }

      const documents = await prisma.document.findMany({
        where,
        select: {
          ocrStatus: true,
          ocrConfidence: true,
          category: true,
          needsReview: true
        }
      });

      const stats = {
        totalProcessed: documents.length,
        averageConfidence: documents.reduce((sum, doc) => sum + (doc.ocrConfidence || 0), 0) / documents.length || 0,
        needingReview: documents.filter(doc => doc.needsReview).length,
        byDocumentType: {} as Record<string, { count: number; averageConfidence: number }>,
        byStatus: {} as Record<string, number>
      };

      // Group by document type
      documents.forEach(doc => {
        const category = doc.category || 'unknown';
        if (!stats.byDocumentType[category]) {
          stats.byDocumentType[category] = { count: 0, averageConfidence: 0 };
        }
        stats.byDocumentType[category].count++;
        stats.byDocumentType[category].averageConfidence += doc.ocrConfidence || 0;
      });

      // Calculate averages for document types
      Object.keys(stats.byDocumentType).forEach(category => {
        stats.byDocumentType[category].averageConfidence /= stats.byDocumentType[category].count;
      });

      // Group by status
      documents.forEach(doc => {
        stats.byStatus[doc.ocrStatus] = (stats.byStatus[doc.ocrStatus] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('Failed to get OCR statistics:', error);
      throw new Error(`Statistics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async downloadFileFromStorage(blobName: string): Promise<Buffer> {
    // This would use the Azure Storage service to download the file
    // For now, return empty buffer - this should integrate with azureStorage.downloadFile()
    console.log(`Downloading file: ${blobName}`);
    return Buffer.alloc(0); // Placeholder
  }

  private extractStructuredData(ocrResult: OCRResult, documentType?: string): any {
    if (!documentType || !ocrResult.extractedData) {
      return {};
    }

    switch (documentType) {
      case 'w2':
        return this.extractW2Data(ocrResult);
      case '1099-misc':
      case '1099-nec':
        return this.extract1099Data(ocrResult);
      case 'invoice':
        return this.extractInvoiceData(ocrResult);
      case 'receipt':
        return this.extractReceiptData(ocrResult);
      case 'bank-statement':
        return this.extractBankStatementData(ocrResult);
      default:
        return ocrResult.extractedData;
    }
  }

  private extractW2Data(ocrResult: OCRResult): TaxFormData {
    const data = ocrResult.extractedData;

    return {
      formType: 'W-2',
      taxYear: this.extractYear(data.TaxYear) || new Date().getFullYear() - 1,
      employee: {
        name: data.Employee?.name || '',
        ssn: data.Employee?.ssn || '',
        address: data.Employee?.address || ''
      },
      employer: {
        name: data.Employer?.name || '',
        ein: data.Employer?.ein || '',
        address: data.Employer?.address || ''
      },
      wages: {
        federalWages: this.parseAmount(data.WagesAndTips),
        federalWithholding: this.parseAmount(data.FederalIncomeTaxWithheld),
        socialSecurityWages: this.parseAmount(data.SocialSecurityWages),
        socialSecurityWithholding: this.parseAmount(data.SocialSecurityTaxWithheld),
        medicareWages: this.parseAmount(data.MedicareWages),
        medicareWithholding: this.parseAmount(data.MedicareTaxWithheld)
      }
    };
  }

  private extract1099Data(ocrResult: OCRResult): TaxFormData {
    const data = ocrResult.extractedData;

    return {
      formType: '1099',
      taxYear: this.extractYear(data.TaxYear) || new Date().getFullYear() - 1,
      employer: {
        name: data.Payer?.name || '',
        ein: data.Payer?.ein || '',
        address: data.Payer?.address || ''
      },
      employee: {
        name: data.Recipient?.name || '',
        ssn: data.Recipient?.ssn || '',
        address: data.Recipient?.address || ''
      },
      wages: {
        federalWages: this.parseAmount(data.NonemployeeCompensation || data.OtherIncome),
        federalWithholding: this.parseAmount(data.FederalIncomeTaxWithheld),
        socialSecurityWages: 0,
        socialSecurityWithholding: 0,
        medicareWages: 0,
        medicareWithholding: 0
      }
    };
  }

  private extractInvoiceData(ocrResult: OCRResult): InvoiceData {
    const data = ocrResult.extractedData;

    return {
      invoiceNumber: data.InvoiceId || '',
      invoiceDate: this.parseDate(data.InvoiceDate) || new Date(),
      dueDate: this.parseDate(data.DueDate),
      vendor: {
        name: data.VendorName || '',
        address: data.VendorAddress || ''
      },
      customer: {
        name: data.CustomerName || '',
        address: data.CustomerAddress || ''
      },
      lineItems: data.LineItems || [],
      totals: {
        subtotal: this.parseAmount(data.SubTotal) || 0,
        tax: this.parseAmount(data.Tax) || 0,
        total: this.parseAmount(data.InvoiceTotal) || 0,
        amountDue: this.parseAmount(data.AmountDue) || 0
      }
    };
  }

  private extractReceiptData(ocrResult: OCRResult): ReceiptData {
    const data = ocrResult.extractedData;

    return {
      merchantName: data.MerchantName || '',
      transactionDate: this.parseDate(data.TransactionDate) || new Date(),
      transactionTime: data.TransactionTime,
      items: data.Items || [],
      totals: {
        subtotal: this.parseAmount(data.Subtotal) || 0,
        tax: this.parseAmount(data.Tax) || 0,
        tip: this.parseAmount(data.Tip),
        total: this.parseAmount(data.Total) || 0
      },
      paymentMethod: data.PaymentMethod
    };
  }

  private extractBankStatementData(ocrResult: OCRResult): BankStatementData {
    const data = ocrResult.extractedData;

    return {
      accountNumber: data.AccountNumber || '',
      statementPeriod: {
        from: this.parseDate(data.StatementStartDate) || new Date(),
        to: this.parseDate(data.StatementEndDate) || new Date()
      },
      beginningBalance: this.parseAmount(data.BeginningBalance) || 0,
      endingBalance: this.parseAmount(data.EndingBalance) || 0,
      transactions: data.Transactions || [],
      summary: {
        totalDebits: this.parseAmount(data.TotalDebits) || 0,
        totalCredits: this.parseAmount(data.TotalCredits) || 0,
        numberOfTransactions: data.NumberOfTransactions || 0
      }
    };
  }

  private parseAmount(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      return parseFloat(cleaned) || 0;
    }
    if (value?.value !== undefined) {
      return this.parseAmount(value.value);
    }
    return 0;
  }

  private parseDate(value: any): Date | undefined {
    if (!value) return undefined;

    let dateString = value;
    if (typeof value === 'object' && value.value) {
      dateString = value.value;
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }

  private extractYear(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const year = parseInt(value);
      return year >= 1900 && year <= new Date().getFullYear() + 1 ? year : undefined;
    }
    if (value?.value !== undefined) {
      return this.extractYear(value.value);
    }
    return undefined;
  }

  private mapDocumentTypeToCategory(documentType: string): string {
    const mapping: Record<string, string> = {
      'w2': 'tax_return',
      '1099-misc': 'tax_return',
      '1099-nec': 'tax_return',
      'invoice': 'invoice',
      'receipt': 'receipt',
      'bank-statement': 'financial_statement'
    };

    return mapping[documentType] || 'general';
  }

  private async logOCRProcessing(documentId: string, ocrResult: OCRResult, validation: any): Promise<void> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { organizationId: true }
      });

      if (document) {
        await prisma.auditLog.create({
          data: {
            action: 'ocr_processed',
            entityType: 'document',
            entityId: documentId,
            newValues: {
              confidence: ocrResult.confidence,
              modelId: ocrResult.metadata.modelId,
              processingTime: ocrResult.metadata.processingTime,
              validationScore: validation.validationScore,
              missingFields: validation.missingFields,
              lowConfidenceFields: validation.lowConfidenceFields
            },
            organizationId: document.organizationId
          }
        });
      }
    } catch (error) {
      console.error('Failed to log OCR processing:', error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const ocrService = new OCRService();

// Export types
export type {
  OCRProcessingRequest,
  OCRReviewData,
  OCRQueueItem,
  TaxFormData,
  InvoiceData,
  ReceiptData,
  BankStatementData
};