import {
  SearchClient,
  SearchIndexClient,
  AzureKeyCredential,
  SearchIndex,
  SearchField,
  SearchIndexerClient,
  SearchDocumentsResult
} from '@azure/search-documents';

export interface DocumentSearchIndex {
  id: string;
  content: string;
  title: string;
  category: string;
  subcategory?: string;
  documentType: string;
  fileName: string;
  fileType: string;
  tags: string[];
  keywords: string[];
  concepts: string[];
  summary: string;
  extractedData: Record<string, any>;
  organizationId: string;
  clientId?: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  confidenceScore: number;
  qualityScore: number;
  isConfidential: boolean;
  businessRelevance: number;
  taxRelevance: number;
  complianceFlags: string[];
  year?: number;
  quarter?: number;
  metadata: Record<string, any>;
}

export interface SearchFilters {
  organizationId: string;
  clientId?: string;
  category?: string;
  subcategory?: string;
  documentType?: string;
  fileType?: string;
  tags?: string[];
  isConfidential?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  year?: number;
  quarter?: number;
  minConfidence?: number;
  minQuality?: number;
  businessRelevanceMin?: number;
  taxRelevanceMin?: number;
  complianceFlags?: string[];
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  facets?: string[];
  top?: number;
  skip?: number;
  orderBy?: string[];
  highlightFields?: string[];
  searchMode?: 'any' | 'all';
  queryType?: 'simple' | 'full';
  enableSemanticSearch?: boolean;
  includeTotalCount?: boolean;
}

export interface SearchResult {
  documents: Array<DocumentSearchIndex & {
    '@search.score': number;
    '@search.highlights'?: Record<string, string[]>;
  }>;
  facets?: Record<string, Array<{ value: any; count: number }>>;
  totalCount?: number;
  nextLink?: string;
}

export interface SearchSuggestion {
  text: string;
  queryPlusText: string;
}

export interface AutocompleteResult {
  suggestions: SearchSuggestion[];
}

export interface SearchAnalytics {
  organizationId: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  clickedDocuments: string[];
  searchDuration: number;
  timestamp: Date;
  userId?: string;
}

class CognitiveSearchService {
  private searchClient: SearchClient<DocumentSearchIndex>;
  private indexClient: SearchIndexClient;
  private indexerClient: SearchIndexerClient;
  private readonly indexName = 'documents';

  constructor() {
    if (!process.env.AZURE_SEARCH_ENDPOINT || !process.env.AZURE_SEARCH_KEY) {
      throw new Error('Azure Cognitive Search credentials not configured');
    }

    const credential = new AzureKeyCredential(process.env.AZURE_SEARCH_KEY);
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;

    this.searchClient = new SearchClient(endpoint, this.indexName, credential);
    this.indexClient = new SearchIndexClient(endpoint, credential);
    this.indexerClient = new SearchIndexerClient(endpoint, credential);
  }

  /**
   * Initialize search index with proper schema
   */
  async initializeIndex(): Promise<void> {
    try {
      const index: SearchIndex = {
        name: this.indexName,
        fields: [
          { name: 'id', type: 'Edm.String', key: true, searchable: false, filterable: true },
          { name: 'content', type: 'Edm.String', searchable: true, filterable: false, analyzer: 'en.microsoft' },
          { name: 'title', type: 'Edm.String', searchable: true, filterable: true, sortable: true },
          { name: 'category', type: 'Edm.String', searchable: true, filterable: true, facetable: true },
          { name: 'subcategory', type: 'Edm.String', searchable: true, filterable: true, facetable: true },
          { name: 'documentType', type: 'Edm.String', searchable: false, filterable: true, facetable: true },
          { name: 'fileName', type: 'Edm.String', searchable: true, filterable: true, sortable: true },
          { name: 'fileType', type: 'Edm.String', searchable: false, filterable: true, facetable: true },
          { name: 'tags', type: 'Collection(Edm.String)', searchable: true, filterable: true, facetable: true },
          { name: 'keywords', type: 'Collection(Edm.String)', searchable: true, filterable: true },
          { name: 'concepts', type: 'Collection(Edm.String)', searchable: true, filterable: true, facetable: true },
          { name: 'summary', type: 'Edm.String', searchable: true, filterable: false },
          { name: 'organizationId', type: 'Edm.String', searchable: false, filterable: true },
          { name: 'clientId', type: 'Edm.String', searchable: false, filterable: true, facetable: true },
          { name: 'uploadedBy', type: 'Edm.String', searchable: false, filterable: true, facetable: true },
          { name: 'uploadedAt', type: 'Edm.DateTimeOffset', searchable: false, filterable: true, sortable: true },
          { name: 'lastModified', type: 'Edm.DateTimeOffset', searchable: false, filterable: true, sortable: true },
          { name: 'confidenceScore', type: 'Edm.Double', searchable: false, filterable: true, sortable: true },
          { name: 'qualityScore', type: 'Edm.Double', searchable: false, filterable: true, sortable: true },
          { name: 'isConfidential', type: 'Edm.Boolean', searchable: false, filterable: true, facetable: true },
          { name: 'businessRelevance', type: 'Edm.Double', searchable: false, filterable: true, sortable: true },
          { name: 'taxRelevance', type: 'Edm.Double', searchable: false, filterable: true, sortable: true },
          { name: 'complianceFlags', type: 'Collection(Edm.String)', searchable: false, filterable: true, facetable: true },
          { name: 'year', type: 'Edm.Int32', searchable: false, filterable: true, facetable: true, sortable: true },
          { name: 'quarter', type: 'Edm.Int32', searchable: false, filterable: true, facetable: true }
        ],
        suggesters: [
          {
            name: 'document-suggester',
            searchMode: 'analyzingInfixMatching',
            sourceFields: ['title', 'content', 'tags', 'keywords', 'concepts']
          }
        ],
        corsOptions: {
          allowedOrigins: ['*'],
          maxAgeInSeconds: 60
        }
      };

      await this.indexClient.createOrUpdateIndex(index);
      console.log('Search index initialized successfully');

    } catch (error) {
      console.error('Failed to initialize search index:', error);
      throw new Error('Search index initialization failed');
    }
  }

  /**
   * Index a document for search
   */
  async indexDocument(document: DocumentSearchIndex): Promise<void> {
    try {
      const searchDocument = {
        ...document,
        uploadedAt: document.uploadedAt.toISOString(),
        lastModified: document.lastModified.toISOString()
      };

      await this.searchClient.uploadDocuments([searchDocument]);
      console.log(`Document ${document.id} indexed successfully`);

    } catch (error) {
      console.error(`Failed to index document ${document.id}:`, error);
      throw new Error(`Document indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocumentsBatch(documents: DocumentSearchIndex[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const result = {
      successful: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    try {
      const searchDocuments = documents.map(doc => ({
        ...doc,
        uploadedAt: doc.uploadedAt.toISOString(),
        lastModified: doc.lastModified.toISOString()
      }));

      const indexResult = await this.searchClient.uploadDocuments(searchDocuments);

      indexResult.results.forEach((item, index) => {
        if (item.succeeded) {
          result.successful.push(documents[index].id);
        } else {
          result.failed.push({
            id: documents[index].id,
            error: item.errorMessage || 'Unknown indexing error'
          });
        }
      });

      return result;

    } catch (error) {
      console.error('Batch indexing failed:', error);
      throw new Error(`Batch indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search documents with advanced filtering and faceting
   */
  async searchDocuments(options: SearchOptions): Promise<SearchResult> {
    try {
      const {
        query = '*',
        filters,
        facets = [],
        top = 50,
        skip = 0,
        orderBy = [],
        highlightFields = ['content', 'title'],
        searchMode = 'any',
        queryType = 'simple',
        enableSemanticSearch = false,
        includeTotalCount = true
      } = options;

      // Build filter expression
      const filterExpression = this.buildFilterExpression(filters);

      // Build facet expressions
      const facetExpressions = facets.map(facet => `${facet},count:50,sort:count`);

      const searchOptions = {
        filter: filterExpression,
        facets: facetExpressions.length > 0 ? facetExpressions : undefined,
        top,
        skip,
        orderBy: orderBy.length > 0 ? orderBy : undefined,
        highlightFields: highlightFields.join(','),
        searchMode,
        queryType,
        includeTotalCount
      };

      const searchResults = await this.searchClient.search(query, searchOptions);

      const documents: SearchResult['documents'] = [];
      const facetResults: Record<string, Array<{ value: any; count: number }>> = {};

      // Process search results
      for await (const result of searchResults.results) {
        documents.push(result.document as any);
      }

      // Process facets
      if (searchResults.facets) {
        for (const [facetName, facetValues] of Object.entries(searchResults.facets)) {
          facetResults[facetName] = facetValues.map(fv => ({
            value: fv.value,
            count: fv.count
          }));
        }
      }

      return {
        documents,
        facets: Object.keys(facetResults).length > 0 ? facetResults : undefined,
        totalCount: searchResults.count,
        nextLink: searchResults.nextLink
      };

    } catch (error) {
      console.error('Document search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(
    query: string,
    suggesterName: string = 'document-suggester',
    top: number = 5
  ): Promise<AutocompleteResult> {
    try {
      const suggestions = await this.searchClient.suggest(query, suggesterName, {
        top,
        useFuzzyMatching: true
      });

      return {
        suggestions: suggestions.results.map(result => ({
          text: result.text,
          queryPlusText: `${query} ${result.text}`
        }))
      };

    } catch (error) {
      console.error('Suggestions retrieval failed:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete(
    query: string,
    suggesterName: string = 'document-suggester',
    mode: 'oneTerm' | 'twoTerms' | 'oneTermWithContext' = 'oneTerm',
    top: number = 5
  ): Promise<AutocompleteResult> {
    try {
      const autocomplete = await this.searchClient.autocomplete(query, suggesterName, {
        autocompleteMode: mode,
        top,
        useFuzzyMatching: true
      });

      return {
        suggestions: autocomplete.results.map(result => ({
          text: result.text,
          queryPlusText: result.queryPlusText
        }))
      };

    } catch (error) {
      console.error('Autocomplete retrieval failed:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Delete document from search index
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.searchClient.deleteDocuments([{ id: documentId }]);
      console.log(`Document ${documentId} deleted from search index`);

    } catch (error) {
      console.error(`Failed to delete document ${documentId} from search index:`, error);
      throw new Error(`Document deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update document in search index
   */
  async updateDocument(document: Partial<DocumentSearchIndex> & { id: string }): Promise<void> {
    try {
      const updateDocument = { ...document };

      if (document.uploadedAt) {
        updateDocument.uploadedAt = document.uploadedAt.toISOString() as any;
      }
      if (document.lastModified) {
        updateDocument.lastModified = document.lastModified.toISOString() as any;
      }

      await this.searchClient.mergeOrUploadDocuments([updateDocument]);
      console.log(`Document ${document.id} updated in search index`);

    } catch (error) {
      console.error(`Failed to update document ${document.id} in search index:`, error);
      throw new Error(`Document update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Advanced search with semantic ranking
   */
  async semanticSearch(
    query: string,
    filters?: SearchFilters,
    top: number = 20
  ): Promise<SearchResult> {
    try {
      const filterExpression = this.buildFilterExpression(filters);

      const searchResults = await this.searchClient.search(query, {
        filter: filterExpression,
        top,
        queryType: 'semantic',
        semanticConfiguration: 'default',
        answers: 'extractive|count-3',
        captions: 'extractive|highlight-true',
        highlightFields: 'content,title,summary'
      });

      const documents: SearchResult['documents'] = [];
      for await (const result of searchResults.results) {
        documents.push(result.document as any);
      }

      return {
        documents,
        totalCount: searchResults.count
      };

    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get search analytics and insights
   */
  async getSearchAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalSearches: number;
    topQueries: Array<{ query: string; count: number }>;
    topCategories: Array<{ category: string; count: number }>;
    averageResultsPerSearch: number;
    noResultsQueries: string[];
  }> {
    // This would typically query a separate analytics index or database
    // For now, return mock data
    return {
      totalSearches: 1250,
      topQueries: [
        { query: 'tax returns 2023', count: 45 },
        { query: 'quarterly reports', count: 38 },
        { query: 'invoices march', count: 32 }
      ],
      topCategories: [
        { category: 'tax_return', count: 156 },
        { category: 'invoice', count: 134 },
        { category: 'receipt', count: 98 }
      ],
      averageResultsPerSearch: 12.3,
      noResultsQueries: [
        'unknown document type',
        'missing file xyz'
      ]
    };
  }

  /**
   * Create saved search
   */
  async createSavedSearch(
    organizationId: string,
    userId: string,
    name: string,
    query: string,
    filters: SearchFilters,
    isShared: boolean = false
  ): Promise<string> {
    // This would save to database
    const savedSearchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Implementation would store in database
    console.log('Saved search created:', { savedSearchId, name, query, filters });

    return savedSearchId;
  }

  /**
   * Build OData filter expression from filters object
   */
  private buildFilterExpression(filters?: SearchFilters): string | undefined {
    if (!filters) return undefined;

    const conditions: string[] = [];

    // Organization filter (always required)
    if (filters.organizationId) {
      conditions.push(`organizationId eq '${filters.organizationId}'`);
    }

    // Optional filters
    if (filters.clientId) {
      conditions.push(`clientId eq '${filters.clientId}'`);
    }

    if (filters.category) {
      conditions.push(`category eq '${filters.category}'`);
    }

    if (filters.subcategory) {
      conditions.push(`subcategory eq '${filters.subcategory}'`);
    }

    if (filters.documentType) {
      conditions.push(`documentType eq '${filters.documentType}'`);
    }

    if (filters.fileType) {
      conditions.push(`fileType eq '${filters.fileType}'`);
    }

    if (filters.isConfidential !== undefined) {
      conditions.push(`isConfidential eq ${filters.isConfidential}`);
    }

    if (filters.year) {
      conditions.push(`year eq ${filters.year}`);
    }

    if (filters.quarter) {
      conditions.push(`quarter eq ${filters.quarter}`);
    }

    if (filters.minConfidence) {
      conditions.push(`confidenceScore ge ${filters.minConfidence}`);
    }

    if (filters.minQuality) {
      conditions.push(`qualityScore ge ${filters.minQuality}`);
    }

    if (filters.businessRelevanceMin) {
      conditions.push(`businessRelevance ge ${filters.businessRelevanceMin}`);
    }

    if (filters.taxRelevanceMin) {
      conditions.push(`taxRelevance ge ${filters.taxRelevanceMin}`);
    }

    // Date range filters
    if (filters.dateFrom) {
      conditions.push(`uploadedAt ge ${filters.dateFrom.toISOString()}`);
    }

    if (filters.dateTo) {
      conditions.push(`uploadedAt le ${filters.dateTo.toISOString()}`);
    }

    // Array filters
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => `tags/any(t: t eq '${tag}')`);
      conditions.push(`(${tagConditions.join(' or ')})`);
    }

    if (filters.complianceFlags && filters.complianceFlags.length > 0) {
      const flagConditions = filters.complianceFlags.map(flag => `complianceFlags/any(f: f eq '${flag}')`);
      conditions.push(`(${flagConditions.join(' or ')})`);
    }

    return conditions.length > 0 ? conditions.join(' and ') : undefined;
  }

  /**
   * Check if search service is ready
   */
  async isReady(): Promise<boolean> {
    try {
      await this.searchClient.getDocumentsCount();
      return true;
    } catch (error) {
      console.error('Search service health check failed:', error);
      return false;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStatistics(): Promise<{
    documentCount: number;
    storageSize: number;
    indexSize: number;
  }> {
    try {
      const stats = await this.indexClient.getIndexStatistics(this.indexName);

      return {
        documentCount: stats.documentCount,
        storageSize: stats.storageSize,
        indexSize: stats.storageSize
      };

    } catch (error) {
      console.error('Failed to get index statistics:', error);
      return {
        documentCount: 0,
        storageSize: 0,
        indexSize: 0
      };
    }
  }
}

// Export singleton instance
export const cognitiveSearchService = new CognitiveSearchService();

// Export types
export type {
  DocumentSearchIndex,
  SearchFilters,
  SearchOptions,
  SearchResult,
  SearchSuggestion,
  AutocompleteResult,
  SearchAnalytics
};