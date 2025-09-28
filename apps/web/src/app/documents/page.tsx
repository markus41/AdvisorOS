'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Upload,
  SortAsc,
  SortDesc,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  RefreshCw
} from 'lucide-react';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  searchText: string;
  clientId: string;
  category: string;
  subcategory: string;
  year: string;
  quarter: string;
  tags: string[];
  fileType: string;
  isConfidential?: boolean;
  ocrStatus: string;
  needsReview?: boolean;
  dateRange?: DateRange;
}

interface SortOptions {
  sortBy: 'createdAt' | 'fileName' | 'fileSize' | 'ocrConfidence';
  sortOrder: 'asc' | 'desc';
}

interface DocumentListData {
  documents: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const DOCUMENT_CATEGORIES = [
  { value: 'tax_return', label: 'Tax Return' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'w2', label: 'W-2 Form' },
  { value: '1099', label: '1099 Form' },
  { value: 'general', label: 'General Document' }
];

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'tiff', label: 'TIFF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'csv', label: 'CSV' }
];

const OCR_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'manual_review', label: 'Needs Review' },
  { value: 'failed', label: 'Failed' }
];

const QUARTERS = [
  { value: '1', label: 'Q1 (Jan-Mar)' },
  { value: '2', label: 'Q2 (Apr-Jun)' },
  { value: '3', label: 'Q3 (Jul-Sep)' },
  { value: '4', label: 'Q4 (Oct-Dec)' }
];

export default function DocumentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<DocumentListData>({
    documents: [],
    pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
  });
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    clientId: '',
    category: '',
    subcategory: '',
    year: '',
    quarter: '',
    tags: [],
    fileType: '',
    ocrStatus: '',
    dateRange: undefined
  });

  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Load URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const newFilters = { ...filters };

    if (params.get('search')) newFilters.searchText = params.get('search')!;
    if (params.get('client')) newFilters.clientId = params.get('client')!;
    if (params.get('category')) newFilters.category = params.get('category')!;
    if (params.get('year')) newFilters.year = params.get('year')!;
    if (params.get('status')) newFilters.ocrStatus = params.get('status')!;

    setFilters(newFilters);
    fetchDocuments(newFilters, sortOptions, 0);
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchDocuments = useCallback(async (
    searchFilters: SearchFilters,
    sort: SortOptions,
    offset: number = 0,
    append: boolean = false
  ) => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();

      if (searchFilters.searchText) params.set('searchText', searchFilters.searchText);
      if (searchFilters.clientId) params.set('clientId', searchFilters.clientId);
      if (searchFilters.category) params.set('category', searchFilters.category);
      if (searchFilters.subcategory) params.set('subcategory', searchFilters.subcategory);
      if (searchFilters.year) params.set('year', searchFilters.year);
      if (searchFilters.quarter) params.set('quarter', searchFilters.quarter);
      if (searchFilters.fileType) params.set('fileType', searchFilters.fileType);
      if (searchFilters.ocrStatus) params.set('ocrStatus', searchFilters.ocrStatus);
      if (searchFilters.isConfidential !== undefined) params.set('isConfidential', searchFilters.isConfidential.toString());
      if (searchFilters.needsReview !== undefined) params.set('needsReview', searchFilters.needsReview.toString());
      if (searchFilters.dateRange?.from) params.set('dateFrom', searchFilters.dateRange.from.toISOString());
      if (searchFilters.dateRange?.to) params.set('dateTo', searchFilters.dateRange.to.toISOString());
      if (searchFilters.tags.length > 0) params.set('tags', searchFilters.tags.join(','));

      params.set('sortBy', sort.sortBy);
      params.set('sortOrder', sort.sortOrder);
      params.set('limit', '50');
      params.set('offset', offset.toString());

      const response = await fetch(`/api/documents/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();

      if (append) {
        setDocuments(prev => ({
          documents: [...prev.documents, ...data.documents],
          pagination: data.pagination
        }));
      } else {
        setDocuments({
          documents: data.documents,
          pagination: data.pagination
        });
      }

    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to load documents. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSearch = () => {
    fetchDocuments(filters, sortOptions, 0, false);
    updateURL();
  };

  const handleLoadMore = () => {
    if (documents.pagination.hasMore) {
      fetchDocuments(filters, sortOptions, documents.pagination.offset + documents.pagination.limit, true);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (newSort: Partial<SortOptions>) => {
    const updatedSort = { ...sortOptions, ...newSort };
    setSortOptions(updatedSort);
    fetchDocuments(filters, updatedSort, 0, false);
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (filters.searchText) params.set('search', filters.searchText);
    if (filters.clientId) params.set('client', filters.clientId);
    if (filters.category) params.set('category', filters.category);
    if (filters.year) params.set('year', filters.year);
    if (filters.ocrStatus) params.set('status', filters.ocrStatus);

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/documents${newUrl}`, { scroll: false });
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = {
      searchText: '',
      clientId: '',
      category: '',
      subcategory: '',
      year: '',
      quarter: '',
      tags: [],
      fileType: '',
      ocrStatus: '',
      dateRange: undefined
    };
    setFilters(emptyFilters);
    fetchDocuments(emptyFilters, sortOptions, 0, false);
    router.replace('/documents', { scroll: false });
  };

  const handleDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (response.ok) {
        const data = await response.json();
        window.open(data.downloadUrl, '_blank');
      } else {
        throw new Error('Failed to generate download URL');
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;

    try {
      await Promise.all(
        selectedDocuments.map(id =>
          fetch(`/api/documents/${id}`, { method: 'DELETE' })
        )
      );

      setSelectedDocuments([]);
      fetchDocuments(filters, sortOptions, 0, false);

      toast({
        title: 'Documents Deleted',
        description: `${selectedDocuments.length} document(s) deleted successfully.`
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete documents. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.length === documents.documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.documents.map(doc => doc.id));
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== '' && value !== undefined;
    }).length;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Manage and search your client documents with AI-powered organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/documents/review-queue')}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Review Queue
          </Button>
          <Button asChild>
            <Link href="/documents/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange('searchText', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortOptions.sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortDesc className="h-4 w-4 mr-2" />
                    )}
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleSortChange({ sortBy: 'createdAt' })}>
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange({ sortBy: 'fileName' })}>
                    File Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange({ sortBy: 'fileSize' })}>
                    File Size
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange({ sortBy: 'ocrConfidence' })}>
                    OCR Confidence
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSortChange({ sortOrder: sortOptions.sortOrder === 'asc' ? 'desc' : 'asc' })}>
                    {sortOptions.sortOrder === 'asc' ? 'Descending' : 'Ascending'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center border rounded">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Advanced Filters */}
        {showFilters && (
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Client Filter */}
                <div>
                  <Label>Client</Label>
                  <Select value={filters.clientId} onValueChange={(value) => handleFilterChange('clientId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {DOCUMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Filter */}
                <div>
                  <Label>Year</Label>
                  <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All years</SelectItem>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* OCR Status Filter */}
                <div>
                  <Label>OCR Status</Label>
                  <Select value={filters.ocrStatus} onValueChange={(value) => handleFilterChange('ocrStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {OCR_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* File Type Filter */}
                <div>
                  <Label>File Type</Label>
                  <Select value={filters.fileType} onValueChange={(value) => handleFilterChange('fileType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {FILE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quarter Filter */}
                <div>
                  <Label>Quarter</Label>
                  <Select value={filters.quarter} onValueChange={(value) => handleFilterChange('quarter', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All quarters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All quarters</SelectItem>
                      {QUARTERS.map((quarter) => (
                        <SelectItem key={quarter.value} value={quarter.value}>
                          {quarter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <Label>Date Range</Label>
                  <DatePickerWithRange
                    date={filters.dateRange}
                    onDateChange={(dateRange) => handleFilterChange('dateRange', dateRange)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confidential"
                    checked={filters.isConfidential === true}
                    onCheckedChange={(checked) => handleFilterChange('isConfidential', checked ? true : undefined)}
                  />
                  <Label htmlFor="confidential">Confidential only</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="needs-review"
                    checked={filters.needsReview === true}
                    onCheckedChange={(checked) => handleFilterChange('needsReview', checked ? true : undefined)}
                  />
                  <Label htmlFor="needs-review">Needs review</Label>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button onClick={handleSearch}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDocuments.length === documents.documents.length}
                  onCheckedChange={selectAllDocuments}
                />
                <span className="text-sm">
                  {selectedDocuments.length} of {documents.documents.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {documents.pagination.total > 0
            ? `Showing ${documents.documents.length} of ${documents.pagination.total} documents`
            : 'No documents found'
          }
        </p>
        {documents.pagination.hasMore && (
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
            Load More
          </Button>
        )}
      </div>

      {/* Document Grid/List */}
      {isLoading && documents.documents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading documents...
            </div>
          </CardContent>
        </Card>
      ) : documents.documents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No documents found matching your criteria.</p>
              <Button asChild>
                <Link href="/documents/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {documents.documents.map((document) => (
            <div key={document.id} className="relative">
              {viewMode === 'grid' && (
                <Checkbox
                  className="absolute top-2 left-2 z-10"
                  checked={selectedDocuments.includes(document.id)}
                  onCheckedChange={() => toggleDocumentSelection(document.id)}
                />
              )}
              <DocumentCard
                document={document}
                viewMode={viewMode}
                onDownload={handleDownload}
                onDelete={(id) => {
                  setSelectedDocuments([id]);
                  handleBulkDelete();
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreview
        documentId={previewDocumentId || ''}
        isOpen={!!previewDocumentId}
        onClose={() => setPreviewDocumentId(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}