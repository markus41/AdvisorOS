import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { documentIntelligenceService } from '@/lib/ai/document-intelligence-enhanced';
import { enhancedOCRService } from '@/lib/ocr/enhanced-ocr-service';
import { cognitiveSearchService } from '@/lib/azure/cognitive-search';
import { documentCollaborationService } from '@/lib/collaboration/document-collaboration';
import { documentWorkflowAutomationService } from '@/lib/automation/document-workflow-automation';
import { z } from 'zod';

const enhancedUploadSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  isConfidential: z.boolean().optional(),
  processingOptions: z.object({
    enableAIAnalysis: z.boolean().default(true),
    enableEnhancedOCR: z.boolean().default(true),
    enableAutoCategorizaton: z.boolean().default(true),
    enableComplianceCheck: z.boolean().default(true),
    enableWorkflowTrigger: z.boolean().default(true),
    qualityThreshold: z.number().min(0).max(1).default(0.8),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
  }).optional(),
  collaborationSettings: z.object({
    enableCollaboration: z.boolean().default(false),
    allowAnnotations: z.boolean().default(true),
    allowComments: z.boolean().default(true),
    autoShare: z.array(z.string()).optional()
  }).optional()
});

const batchProcessingSchema = z.object({
  files: z.array(z.object({
    fileName: z.string(),
    fileData: z.string(), // Base64 encoded
    metadata: z.record(z.any())
  })),
  clientId: z.string().min(1, 'Client ID is required'),
  processingOptions: z.object({
    enableParallelProcessing: z.boolean().default(true),
    maxConcurrency: z.number().int().min(1).max(10).default(5),
    enableAIAnalysis: z.boolean().default(true),
    enableEnhancedOCR: z.boolean().default(true),
    qualityThreshold: z.number().min(0).max(1).default(0.8),
    enableAutoRouting: z.boolean().default(true)
  })
});

const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    category: z.string().optional(),
    subcategory: z.string().optional(),
    documentType: z.string().optional(),
    clientId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    isConfidential: z.boolean().optional(),
    minConfidence: z.number().min(0).max(1).optional(),
    minQuality: z.number().min(0).max(1).optional()
  }).optional(),
  facets: z.array(z.string()).optional(),
  top: z.number().int().min(1).max(100).default(20),
  skip: z.number().int().min(0).default(0),
  enableSemanticSearch: z.boolean().default(false)
});

/**
 * Enhanced document upload with AI processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (50MB limit for enhanced processing)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 413 });
    }

    // Parse and validate metadata
    const metadataStr = formData.get('metadata') as string;
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};
    const validatedMetadata = enhancedUploadSchema.parse(metadata);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Step 1: Enhanced AI Document Analysis
    let aiAnalysis = null;
    if (validatedMetadata.processingOptions?.enableAIAnalysis !== false) {
      aiAnalysis = await documentIntelligenceService.analyzeDocument(
        fileBuffer,
        {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          organizationId: session.user.organizationId,
          uploadedBy: session.user.id,
          uploadedAt: new Date()
        },
        {
          enableAdvancedAnalysis: true,
          qualityThreshold: validatedMetadata.processingOptions?.qualityThreshold || 0.8
        }
      );
    }

    // Step 2: Enhanced OCR Processing
    let ocrResult = null;
    if (validatedMetadata.processingOptions?.enableEnhancedOCR !== false) {
      ocrResult = await enhancedOCRService.processDocument(
        fileBuffer,
        {
          fileName: file.name,
          documentId: 'temp', // Will be updated after document creation
          organizationId: session.user.organizationId,
          uploadedBy: session.user.id
        },
        {
          enablePreprocessing: true,
          enableValidation: true,
          enableFinancialExtraction: true,
          priority: validatedMetadata.processingOptions?.priority || 'normal'
        }
      );
    }

    // Step 3: Auto-categorization
    let finalCategory = validatedMetadata.category;
    let finalSubcategory = validatedMetadata.subcategory;
    let suggestedTags = validatedMetadata.tags || [];

    if (validatedMetadata.processingOptions?.enableAutoCategorizaton !== false && aiAnalysis) {
      finalCategory = finalCategory || aiAnalysis.category.category;
      finalSubcategory = finalSubcategory || aiAnalysis.category.subcategory;
      suggestedTags = [...suggestedTags, ...aiAnalysis.category.suggestedTags];
    }

    // Step 4: Upload to storage and create document record
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create document in database (simplified - would use actual document service)
    const document = {
      id: documentId,
      fileName: file.name,
      fileUrl: `https://storage.example.com/${documentId}`,
      fileType: file.name.split('.').pop()?.toLowerCase() || '',
      mimeType: file.type,
      fileSize: file.size,
      category: finalCategory || 'general',
      subcategory: finalSubcategory,
      year: validatedMetadata.year,
      quarter: validatedMetadata.quarter,
      tags: [...new Set(suggestedTags)],
      description: validatedMetadata.description,
      clientId: validatedMetadata.clientId,
      organizationId: session.user.organizationId,
      uploadedBy: session.user.id,
      isConfidential: validatedMetadata.isConfidential || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Step 5: Index for search
    await cognitiveSearchService.indexDocument({
      id: documentId,
      content: aiAnalysis?.searchableContent.fullText || ocrResult?.rawText || '',
      title: file.name,
      category: document.category,
      subcategory: document.subcategory,
      documentType: aiAnalysis?.documentType || 'unknown',
      fileName: file.name,
      fileType: document.fileType,
      tags: document.tags,
      keywords: aiAnalysis?.searchableContent.keywords || [],
      concepts: aiAnalysis?.searchableContent.concepts || [],
      summary: aiAnalysis?.searchableContent.semanticSummary || '',
      extractedData: aiAnalysis?.extractedData || {},
      organizationId: session.user.organizationId,
      clientId: document.clientId,
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
      lastModified: new Date(),
      confidenceScore: aiAnalysis?.ocrResult.confidence || ocrResult?.confidence || 0,
      qualityScore: aiAnalysis?.qualityAssessment.overallScore || ocrResult?.qualityMetrics.clarity || 0,
      isConfidential: document.isConfidential,
      businessRelevance: aiAnalysis?.intelligentCategorization.businessRelevance || 0.5,
      taxRelevance: aiAnalysis?.intelligentCategorization.taxRelevance || 0.3,
      complianceFlags: aiAnalysis?.complianceFlags.map(f => f.type) || [],
      year: document.year,
      quarter: document.quarter,
      metadata: {
        aiAnalysis: !!aiAnalysis,
        enhancedOCR: !!ocrResult,
        processingTime: (aiAnalysis?.processingTime || 0) + (ocrResult?.processingTime || 0)
      }
    });

    // Step 6: Compliance check
    let complianceResult = null;
    if (validatedMetadata.processingOptions?.enableComplianceCheck !== false) {
      complianceResult = await documentWorkflowAutomationService.checkDocumentCompliance(
        documentId,
        session.user.organizationId
      );
    }

    // Step 7: Auto-categorize with automation service
    let categorizationResult = null;
    if (validatedMetadata.processingOptions?.enableAutoCategorizaton !== false) {
      categorizationResult = await documentWorkflowAutomationService.autoCategorizeDocument(
        documentId,
        session.user.organizationId
      );
    }

    // Step 8: Setup collaboration if enabled
    let collaborationSession = null;
    if (validatedMetadata.collaborationSettings?.enableCollaboration) {
      collaborationSession = await documentCollaborationService.startCollaborationSession(
        documentId,
        session.user.id,
        {
          allowConcurrentEditing: false,
          autoSave: true,
          autoSaveInterval: 30,
          showCursors: true,
          showSelections: true,
          conflictResolution: 'manual'
        }
      );

      // Auto-share if specified
      if (validatedMetadata.collaborationSettings.autoShare) {
        for (const userId of validatedMetadata.collaborationSettings.autoShare) {
          await documentCollaborationService.shareDocument(
            documentId,
            {
              shareType: 'user',
              sharedWith: userId,
              accessLevel: 'comment',
              permissions: {
                canDownload: true,
                canPrint: false,
                canCopy: false,
                canShare: false,
                canAnnotate: validatedMetadata.collaborationSettings.allowAnnotations,
                canComment: validatedMetadata.collaborationSettings.allowComments
              },
              restrictions: {
                passwordProtected: false
              },
              isActive: true
            },
            session.user.id,
            session.user.organizationId
          );
        }
      }
    }

    // Return comprehensive result
    return NextResponse.json({
      success: true,
      document,
      processing: {
        aiAnalysis: aiAnalysis ? {
          documentType: aiAnalysis.documentType,
          category: aiAnalysis.category,
          confidence: aiAnalysis.ocrResult.confidence,
          qualityScore: aiAnalysis.qualityAssessment.overallScore,
          anomalies: aiAnalysis.anomalies,
          complianceFlags: aiAnalysis.complianceFlags,
          processingTime: aiAnalysis.processingTime
        } : null,
        ocrResult: ocrResult ? {
          confidence: ocrResult.confidence,
          qualityMetrics: ocrResult.qualityMetrics,
          validation: ocrResult.validation,
          financialData: ocrResult.financialData,
          processingTime: ocrResult.processingTime
        } : null,
        categorization: categorizationResult,
        compliance: complianceResult,
        collaboration: collaborationSession ? {
          sessionId: collaborationSession.id,
          participantCount: collaborationSession.participants.length
        } : null
      },
      recommendations: [
        ...(aiAnalysis?.qualityAssessment.reviewReasons || []),
        ...(complianceResult?.recommendations || [])
      ]
    });

  } catch (error) {
    console.error('Enhanced document upload failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}

/**
 * Enhanced document search with semantic capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchData = {
      query: searchParams.get('query') || undefined,
      filters: {
        category: searchParams.get('category') || undefined,
        subcategory: searchParams.get('subcategory') || undefined,
        documentType: searchParams.get('documentType') || undefined,
        clientId: searchParams.get('clientId') || undefined,
        tags: searchParams.get('tags')?.split(',') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        isConfidential: searchParams.get('isConfidential') ?
          searchParams.get('isConfidential') === 'true' : undefined,
        minConfidence: searchParams.get('minConfidence') ?
          parseFloat(searchParams.get('minConfidence')!) : undefined,
        minQuality: searchParams.get('minQuality') ?
          parseFloat(searchParams.get('minQuality')!) : undefined
      },
      facets: searchParams.get('facets')?.split(',') || undefined,
      top: searchParams.get('top') ? parseInt(searchParams.get('top')!) : 20,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
      enableSemanticSearch: searchParams.get('enableSemanticSearch') === 'true'
    };

    const validatedSearch = searchSchema.parse(searchData);

    // Build search filters
    const searchFilters = {
      organizationId: session.user.organizationId,
      ...validatedSearch.filters,
      dateFrom: validatedSearch.filters?.dateFrom ? new Date(validatedSearch.filters.dateFrom) : undefined,
      dateTo: validatedSearch.filters?.dateTo ? new Date(validatedSearch.filters.dateTo) : undefined
    };

    // Perform search
    let searchResult;
    if (validatedSearch.enableSemanticSearch && validatedSearch.query) {
      searchResult = await cognitiveSearchService.semanticSearch(
        validatedSearch.query,
        searchFilters,
        validatedSearch.top
      );
    } else {
      searchResult = await cognitiveSearchService.searchDocuments({
        query: validatedSearch.query,
        filters: searchFilters,
        facets: validatedSearch.facets || ['category', 'documentType', 'fileType'],
        top: validatedSearch.top,
        skip: validatedSearch.skip,
        enableSemanticSearch: validatedSearch.enableSemanticSearch,
        includeTotalCount: true
      });
    }

    // Get suggestions if query provided
    let suggestions = null;
    if (validatedSearch.query) {
      const autocompleteResult = await cognitiveSearchService.getAutocomplete(
        validatedSearch.query,
        'document-suggester',
        'oneTerm',
        5
      );
      suggestions = autocompleteResult.suggestions;
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: searchResult.documents,
        facets: searchResult.facets,
        totalCount: searchResult.totalCount,
        hasMore: searchResult.nextLink ? true : false,
        suggestions,
        searchType: validatedSearch.enableSemanticSearch ? 'semantic' : 'standard'
      }
    });

  } catch (error) {
    console.error('Enhanced document search failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 });
  }
}

/**
 * Batch document processing
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = batchProcessingSchema.parse(body);

    // Convert files to processing format
    const documents = validatedData.files.map((file, index) => ({
      id: `batch_${Date.now()}_${index}`,
      buffer: Buffer.from(file.fileData, 'base64'),
      fileName: file.fileName,
      metadata: {
        ...file.metadata,
        organizationId: session.user.organizationId,
        uploadedBy: session.user.id
      }
    }));

    // Process batch with enhanced OCR service
    const batchResult = await enhancedOCRService.processBatch({
      documents,
      processing: {
        enableParallelProcessing: validatedData.processingOptions.enableParallelProcessing,
        enableQualityEnhancement: true,
        enableValidation: true,
        enableFinancialExtraction: true,
        qualityThreshold: validatedData.processingOptions.qualityThreshold,
        retryLowQuality: true,
        parallelProcessing: validatedData.processingOptions.enableParallelProcessing,
        maxConcurrency: validatedData.processingOptions.maxConcurrency
      },
      output: {
        format: 'json',
        includeRawData: false,
        includeImages: false,
        compressionLevel: 5
      },
      notifications: {
        onProgress: false,
        onCompletion: true,
        onError: true
      }
    });

    // Process successful documents for additional AI analysis
    const enhancedResults = [];
    for (const result of batchResult.successful) {
      try {
        // Auto-categorize
        const categorization = await documentWorkflowAutomationService.autoCategorizeDocument(
          result.id,
          session.user.organizationId
        );

        // Check compliance
        const compliance = await documentWorkflowAutomationService.checkDocumentCompliance(
          result.id,
          session.user.organizationId
        );

        // Index for search
        await cognitiveSearchService.indexDocument({
          id: result.id,
          content: result.result.rawText,
          title: documents.find(d => d.id === result.id)?.fileName || 'Unknown',
          category: categorization.category,
          subcategory: categorization.subcategory,
          documentType: result.result.documentType,
          fileName: documents.find(d => d.id === result.id)?.fileName || 'Unknown',
          fileType: documents.find(d => d.id === result.id)?.fileName.split('.').pop() || 'unknown',
          tags: categorization.tags,
          keywords: [],
          concepts: [],
          summary: '',
          extractedData: result.result.extractedData,
          organizationId: session.user.organizationId,
          clientId: validatedData.clientId,
          uploadedBy: session.user.id,
          uploadedAt: new Date(),
          lastModified: new Date(),
          confidenceScore: result.result.confidence,
          qualityScore: result.result.qualityMetrics.clarity,
          isConfidential: false,
          businessRelevance: 0.5,
          taxRelevance: 0.3,
          complianceFlags: [],
          metadata: {}
        });

        enhancedResults.push({
          id: result.id,
          processing: {
            ocr: result.result,
            categorization,
            compliance
          }
        });

      } catch (error) {
        console.error(`Failed to enhance result for document ${result.id}:`, error);
        enhancedResults.push({
          id: result.id,
          processing: {
            ocr: result.result,
            error: error instanceof Error ? error.message : 'Enhancement failed'
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: batchResult.successful.length,
        failed: batchResult.failed.length,
        statistics: batchResult.statistics,
        results: enhancedResults,
        failures: batchResult.failed
      }
    });

  } catch (error) {
    console.error('Batch processing failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Batch processing failed'
    }, { status: 500 });
  }
}