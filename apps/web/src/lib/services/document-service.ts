import { prisma } from '@cpa-platform/database';
import { azureStorage, type UploadOptions } from '../azure/storage';
import { formRecognizer } from '../azure/form-recognizer';
import { randomBytes } from 'crypto';
import sharp from 'sharp';

export interface DocumentUploadData {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  clientId: string;
  organizationId: string;
  uploadedBy: string;
  category?: string;
  subcategory?: string;
  year?: number;
  quarter?: number;
  tags?: string[];
  description?: string;
  isConfidential?: boolean;
  autoCategorizationEnabled?: boolean;
  autoOCREnabled?: boolean;
}

export interface DocumentSearchOptions {
  organizationId: string;
  clientId?: string;
  category?: string;
  subcategory?: string;
  year?: number;
  quarter?: number;
  tags?: string[];
  searchText?: string;
  fileType?: string;
  isConfidential?: boolean;
  ocrStatus?: string;
  needsReview?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'fileName' | 'fileSize' | 'ocrConfidence';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentUpdateData {
  fileName?: string;
  category?: string;
  subcategory?: string;
  year?: number;
  quarter?: number;
  tags?: string[];
  description?: string;
  isConfidential?: boolean;
  needsReview?: boolean;
}

export interface BulkUploadOptions {
  files: Array<{
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
  }>;
  clientId: string;
  organizationId: string;
  uploadedBy: string;
  defaultCategory?: string;
  autoCategorizationEnabled?: boolean;
  autoOCREnabled?: boolean;
}

export interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  currentFile?: string;
  errors: Array<{
    fileName: string;
    error: string;
  }>;
}

export class DocumentService {
  /**
   * Upload a single document with automatic categorization and OCR
   */
  async uploadDocument(data: DocumentUploadData): Promise<{
    document: any;
    uploadUrl?: string;
    secureDownloadUrl?: string;
  }> {
    const {
      fileName,
      fileBuffer,
      mimeType,
      clientId,
      organizationId,
      uploadedBy,
      category,
      subcategory,
      year,
      quarter,
      tags = [],
      description,
      isConfidential = false,
      autoCategorizationEnabled = true,
      autoOCREnabled = true
    } = data;

    try {
      // Validate file
      this.validateFile(fileName, fileBuffer, mimeType);

      // Auto-categorize if enabled and no category provided
      let finalCategory = category;
      let finalSubcategory = subcategory;
      let finalYear = year;

      if (autoCategorizationEnabled && !category) {
        const categorization = await this.categorizeDocument(fileName, fileBuffer, mimeType);
        finalCategory = categorization.category;
        finalSubcategory = categorization.subcategory;
        finalYear = categorization.year || finalYear;
      }

      // Upload to Azure Storage
      const uploadOptions: UploadOptions = {
        fileName,
        fileBuffer,
        mimeType,
        organizationId,
        clientId,
        category: finalCategory || 'uncategorized',
        tags,
        metadata: {
          uploadedBy,
          originalFileName: fileName,
          isConfidential: isConfidential.toString(),
          autoOCR: autoOCREnabled.toString()
        }
      };

      const uploadResult = await azureStorage.uploadFile(uploadOptions);

      // Generate thumbnail for images
      let thumbnailUrl: string | null = null;
      if (this.isImageFile(mimeType)) {
        thumbnailUrl = await this.generateThumbnail(uploadResult.blobName, fileBuffer);
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          fileName,
          fileUrl: uploadResult.url,
          thumbnailUrl,
          fileType: this.getFileExtension(fileName),
          mimeType,
          fileSize: BigInt(fileBuffer.length),
          category: finalCategory || 'uncategorized',
          subcategory: finalSubcategory,
          year: finalYear,
          quarter,
          tags,
          description,
          clientId,
          organizationId,
          uploadedBy,
          checksum: uploadResult.checksum,
          isConfidential,
          ocrStatus: autoOCREnabled ? 'pending' : 'skipped',
          metadata: {
            blobName: uploadResult.blobName,
            originalFileName: fileName,
            uploadSource: 'web'
          }
        },
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
        }
      });

      // Trigger virus scan
      this.performVirusScanAsync(uploadResult.blobName, document.id);

      // Trigger OCR processing if enabled
      if (autoOCREnabled && this.isOCRSupported(mimeType)) {
        this.processOCRAsync(document.id, uploadResult.blobName, fileBuffer);
      }

      // Generate secure download URL
      const secureDownloadUrl = azureStorage.getSecureDownloadUrl(uploadResult.blobName, 15);

      return {
        document,
        secureDownloadUrl
      };

    } catch (error) {
      console.error('Document upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple documents with progress tracking
   */
  async bulkUploadDocuments(
    options: BulkUploadOptions,
    progressCallback?: (progress: UploadProgress) => void
  ): Promise<{
    successful: any[];
    failed: Array<{ fileName: string; error: string }>;
    progress: UploadProgress;
  }> {
    const { files, clientId, organizationId, uploadedBy, defaultCategory, autoCategorizationEnabled = true, autoOCREnabled = true } = options;

    const progress: UploadProgress = {
      total: files.length,
      completed: 0,
      failed: 0,
      errors: []
    };

    const successful: any[] = [];
    const failed: Array<{ fileName: string; error: string }> = [];

    for (const file of files) {
      try {
        progress.currentFile = file.fileName;
        progressCallback?.(progress);

        const uploadData: DocumentUploadData = {
          fileName: file.fileName,
          fileBuffer: file.fileBuffer,
          mimeType: file.mimeType,
          clientId,
          organizationId,
          uploadedBy,
          category: defaultCategory,
          autoCategorizationEnabled,
          autoOCREnabled
        };

        const result = await this.uploadDocument(uploadData);
        successful.push(result.document);
        progress.completed++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ fileName: file.fileName, error: errorMessage });
        progress.failed++;
        progress.errors.push({ fileName: file.fileName, error: errorMessage });
      }

      progressCallback?.(progress);
    }

    return { successful, failed, progress };
  }

  /**
   * Get document by ID with security checks
   */
  async getDocument(documentId: string, organizationId: string, userId: string): Promise<any | null> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId,
          deletedAt: null
        },
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
          },
          annotations: {
            where: { deletedAt: null },
            include: {
              creator: {
                select: { name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          comments: {
            where: { deletedAt: null },
            include: {
              creator: {
                select: { name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!document) {
        return null;
      }

      // Check access permissions (simplified - would integrate with proper RBAC)
      if (document.isConfidential) {
        // Add additional access checks for confidential documents
        const hasAccess = await this.checkDocumentAccess(documentId, userId);
        if (!hasAccess) {
          throw new Error('Access denied to confidential document');
        }
      }

      return document;

    } catch (error) {
      console.error('Failed to get document:', error);
      throw new Error(`Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search documents with advanced filtering
   */
  async searchDocuments(options: DocumentSearchOptions): Promise<{
    documents: any[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      organizationId,
      clientId,
      category,
      subcategory,
      year,
      quarter,
      tags,
      searchText,
      fileType,
      isConfidential,
      ocrStatus,
      needsReview,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    try {
      const where: any = {
        organizationId,
        deletedAt: null
      };

      // Apply filters
      if (clientId) where.clientId = clientId;
      if (category) where.category = category;
      if (subcategory) where.subcategory = subcategory;
      if (year) where.year = year;
      if (quarter) where.quarter = quarter;
      if (fileType) where.fileType = fileType;
      if (isConfidential !== undefined) where.isConfidential = isConfidential;
      if (ocrStatus) where.ocrStatus = ocrStatus;
      if (needsReview !== undefined) where.needsReview = needsReview;

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Tags filter
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags
        };
      }

      // Text search in filename, description, and OCR data
      if (searchText) {
        where.OR = [
          { fileName: { contains: searchText, mode: 'insensitive' } },
          { description: { contains: searchText, mode: 'insensitive' } },
          {
            extractedData: {
              path: '$.rawText',
              string_contains: searchText
            }
          }
        ];
      }

      // Get total count
      const total = await prisma.document.count({ where });

      // Get documents
      const documents = await prisma.document.findMany({
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
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit
      });

      return {
        documents,
        total,
        hasMore: offset + documents.length < total
      };

    } catch (error) {
      console.error('Document search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: string, organizationId: string, updates: DocumentUpdateData): Promise<any> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId,
          deletedAt: null
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          ...updates,
          updatedAt: new Date()
        },
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
        }
      });

      return updatedDocument;

    } catch (error) {
      console.error('Document update failed:', error);
      throw new Error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string, organizationId: string, userId: string): Promise<void> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId,
          deletedAt: null
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Soft delete
      await prisma.document.update({
        where: { id: documentId },
        data: {
          deletedAt: new Date(),
          updatedBy: userId
        }
      });

      // Note: We don't delete from Azure Storage immediately
      // This allows for recovery and complies with data retention policies
      // A background job should handle permanent deletion based on retention rules

    } catch (error) {
      console.error('Document deletion failed:', error);
      throw new Error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new document version
   */
  async createDocumentVersion(
    parentDocumentId: string,
    organizationId: string,
    uploadData: DocumentUploadData
  ): Promise<any> {
    try {
      const parentDocument = await prisma.document.findFirst({
        where: {
          id: parentDocumentId,
          organizationId,
          deletedAt: null
        }
      });

      if (!parentDocument) {
        throw new Error('Parent document not found');
      }

      // Mark current version as not latest
      await prisma.document.updateMany({
        where: {
          OR: [
            { id: parentDocumentId },
            { parentDocumentId: parentDocumentId }
          ],
          isLatestVersion: true
        },
        data: { isLatestVersion: false }
      });

      // Get next version number
      const maxVersion = await prisma.document.findFirst({
        where: {
          OR: [
            { id: parentDocumentId },
            { parentDocumentId: parentDocumentId }
          ]
        },
        orderBy: { version: 'desc' },
        select: { version: true }
      });

      const nextVersion = (maxVersion?.version || 0) + 1;

      // Upload new version
      const newVersionData = {
        ...uploadData,
        category: uploadData.category || parentDocument.category,
        year: uploadData.year || parentDocument.year,
        quarter: uploadData.quarter || parentDocument.quarter
      };

      const result = await this.uploadDocument(newVersionData);

      // Update new document with version info
      const versionedDocument = await prisma.document.update({
        where: { id: result.document.id },
        data: {
          parentDocumentId,
          version: nextVersion,
          isLatestVersion: true
        },
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
        }
      });

      return versionedDocument;

    } catch (error) {
      console.error('Document version creation failed:', error);
      throw new Error(`Version creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get secure download URL for document
   */
  async getSecureDownloadUrl(documentId: string, organizationId: string, userId: string): Promise<string> {
    try {
      const document = await this.getDocument(documentId, organizationId, userId);

      if (!document) {
        throw new Error('Document not found');
      }

      const blobName = document.metadata?.blobName;
      if (!blobName) {
        throw new Error('Document blob name not found');
      }

      return azureStorage.getSecureDownloadUrl(blobName, 30); // 30 minutes expiry

    } catch (error) {
      console.error('Failed to generate secure download URL:', error);
      throw new Error(`Download URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private validateFile(fileName: string, fileBuffer: Buffer, mimeType: string): void {
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (fileBuffer.length > maxFileSize) {
      throw new Error('File size exceeds 25MB limit');
    }

    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not supported`);
    }

    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name is required');
    }
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private isOCRSupported(mimeType: string): boolean {
    return [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp'
    ].includes(mimeType);
  }

  private async categorizeDocument(fileName: string, fileBuffer: Buffer, mimeType: string): Promise<{
    category: string;
    subcategory?: string;
    year?: number;
  }> {
    // Simple rule-based categorization
    const lowerFileName = fileName.toLowerCase();

    // Tax documents
    if (lowerFileName.includes('w2') || lowerFileName.includes('w-2')) {
      return { category: 'tax_return', subcategory: 'w2' };
    }
    if (lowerFileName.includes('1099')) {
      return { category: 'tax_return', subcategory: '1099' };
    }
    if (lowerFileName.includes('tax') && lowerFileName.includes('return')) {
      return { category: 'tax_return' };
    }

    // Financial documents
    if (lowerFileName.includes('bank') && lowerFileName.includes('statement')) {
      return { category: 'financial_statement', subcategory: 'bank_statement' };
    }
    if (lowerFileName.includes('invoice')) {
      return { category: 'invoice' };
    }
    if (lowerFileName.includes('receipt')) {
      return { category: 'receipt' };
    }

    // Extract year from filename
    const yearMatch = fileName.match(/20\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

    return { category: 'general', year };
  }

  private async generateThumbnail(blobName: string, imageBuffer: Buffer): Promise<string | null> {
    try {
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(200, 200, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailBlobName = blobName.replace(/\.[^.]+$/, '_thumb.jpg');

      const uploadResult = await azureStorage.uploadFile({
        fileName: `thumbnail_${Date.now()}.jpg`,
        fileBuffer: thumbnailBuffer,
        mimeType: 'image/jpeg',
        organizationId: 'thumbnails',
        clientId: 'thumbnails',
        category: 'thumbnail'
      });

      return uploadResult.url;

    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  private async performVirusScanAsync(blobName: string, documentId: string): Promise<void> {
    try {
      // Perform virus scan in background
      const scanResult = await azureStorage.performVirusScan(blobName);

      // Update document with scan results
      await prisma.document.update({
        where: { id: documentId },
        data: {
          virusScanned: true,
          virusScanDate: scanResult.scanDate,
          virusScanResult: scanResult.scanResult
        }
      });

      if (!scanResult.isClean) {
        console.error(`Virus detected in document ${documentId}`);
        // Implement quarantine logic here
      }

    } catch (error) {
      console.error('Virus scan failed:', error);
    }
  }

  private async processOCRAsync(documentId: string, blobName: string, fileBuffer: Buffer): Promise<void> {
    try {
      // Update status to processing
      await prisma.document.update({
        where: { id: documentId },
        data: { ocrStatus: 'processing' }
      });

      // Detect document type
      const typeDetection = await formRecognizer.detectDocumentType(fileBuffer);

      // Perform OCR
      const ocrResult = await formRecognizer.analyzeDocument(fileBuffer, typeDetection.detectedType);

      // Validate results
      const validation = formRecognizer.validateExtraction(ocrResult, typeDetection.detectedType);

      // Update document with OCR results
      await prisma.document.update({
        where: { id: documentId },
        data: {
          ocrStatus: validation.isValid ? 'completed' : 'manual_review',
          ocrConfidence: ocrResult.confidence,
          ocrProcessedAt: new Date(),
          extractedData: ocrResult,
          rawOcrData: ocrResult,
          ocrModel: ocrResult.metadata.modelId,
          needsReview: !validation.isValid || ocrResult.confidence < 0.8
        }
      });

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
    }
  }

  private async checkDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    // Simplified access check - would integrate with proper RBAC system
    try {
      const document = await prisma.document.findFirst({
        where: { id: documentId },
        include: {
          client: {
            include: {
              organization: {
                include: {
                  users: {
                    where: { id: userId }
                  }
                }
              }
            }
          }
        }
      });

      return !!(document?.client.organization.users.length);

    } catch (error) {
      console.error('Access check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();

// Export types
export type {
  DocumentUploadData,
  DocumentSearchOptions,
  DocumentUpdateData,
  BulkUploadOptions,
  UploadProgress
};