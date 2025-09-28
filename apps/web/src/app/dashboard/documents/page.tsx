'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  User,
  Eye,
  Share,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderOpen,
  Image,
  File,
  FileSpreadsheet,
  Archive,
  Trash2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { cn } from '@/lib/utils'

// Mock data - replace with actual API calls
const mockDocuments = [
  {
    id: '1',
    name: 'Annual Tax Return 2023.pdf',
    type: 'Tax Return',
    category: 'tax',
    size: '2.4 MB',
    clientName: 'ABC Corporation',
    clientId: '1',
    uploadedAt: '2024-01-10T09:15:00Z',
    uploadedBy: 'Sarah Johnson',
    status: 'processed',
    ocrStatus: 'completed',
    tags: ['annual', 'tax', '2023'],
    url: '/documents/1',
    thumbnail: null,
  },
  {
    id: '2',
    name: 'Financial Statements Q4.xlsx',
    type: 'Financial Statement',
    category: 'financial',
    size: '856 KB',
    clientName: 'Smith LLC',
    clientId: '2',
    uploadedAt: '2024-01-08T14:30:00Z',
    uploadedBy: 'Mike Wilson',
    status: 'processing',
    ocrStatus: 'pending',
    tags: ['q4', 'financial', 'statements'],
    url: '/documents/2',
    thumbnail: null,
  },
  {
    id: '3',
    name: 'Payroll Report December.pdf',
    type: 'Payroll',
    category: 'payroll',
    size: '1.2 MB',
    clientName: 'XYZ Ventures',
    clientId: '3',
    uploadedAt: '2024-01-05T11:45:00Z',
    uploadedBy: 'Emily Davis',
    status: 'processed',
    ocrStatus: 'completed',
    tags: ['december', 'payroll', 'monthly'],
    url: '/documents/3',
    thumbnail: null,
  },
  {
    id: '4',
    name: 'Invoice Template.docx',
    type: 'Template',
    category: 'template',
    size: '245 KB',
    clientName: 'Johnson & Associates',
    clientId: '4',
    uploadedAt: '2024-01-03T16:20:00Z',
    uploadedBy: 'Sarah Johnson',
    status: 'processed',
    ocrStatus: 'completed',
    tags: ['template', 'invoice'],
    url: '/documents/4',
    thumbnail: null,
  },
  {
    id: '5',
    name: 'Receipt Scan.jpg',
    type: 'Receipt',
    category: 'receipt',
    size: '1.8 MB',
    clientName: 'ABC Corporation',
    clientId: '1',
    uploadedAt: '2024-01-02T10:30:00Z',
    uploadedBy: 'Mike Wilson',
    status: 'processed',
    ocrStatus: 'failed',
    tags: ['receipt', 'expense'],
    url: '/documents/5',
    thumbnail: '/thumbnails/5.jpg',
  },
  {
    id: '6',
    name: 'Board Meeting Minutes.pdf',
    type: 'Minutes',
    category: 'legal',
    size: '542 KB',
    clientName: 'Smith LLC',
    clientId: '2',
    uploadedAt: '2023-12-28T13:15:00Z',
    uploadedBy: 'Emily Davis',
    status: 'processed',
    ocrStatus: 'completed',
    tags: ['board', 'meeting', 'minutes'],
    url: '/documents/6',
    thumbnail: null,
  },
]

const documentTypes = [
  'Tax Return',
  'Financial Statement',
  'Payroll',
  'Invoice',
  'Receipt',
  'Contract',
  'Template',
  'Minutes',
  'Other',
]

const statusColors = {
  processed: 'success',
  processing: 'warning',
  failed: 'error',
  pending: 'info',
}

const ocrStatusColors = {
  completed: 'success',
  processing: 'warning',
  failed: 'error',
  pending: 'info',
}

const getFileIcon = (type: string, category: string) => {
  if (category === 'receipt' || type.includes('image')) return Image
  if (type.includes('xlsx') || type.includes('csv')) return FileSpreadsheet
  if (type.includes('pdf') || type.includes('doc')) return FileText
  return File
}

interface DocumentCardProps {
  document: typeof mockDocuments[0]
  viewMode: 'grid' | 'list'
  onSelect: (id: string) => void
  isSelected: boolean
}

function DocumentCard({ document, viewMode, onSelect, isSelected }: DocumentCardProps) {
  const FileIcon = getFileIcon(document.name, document.category)

  if (viewMode === 'list') {
    return (
      <motion.div
        className={cn(
          'flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors',
          isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
        )}
        whileHover={{ scale: 1.01 }}
        onClick={() => onSelect(document.id)}
      >
        <div className="flex-shrink-0">
          <FileIcon className="w-8 h-8 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {document.name}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {document.type}
                </Badge>
                <span className="text-xs text-gray-500">{document.size}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{document.clientName}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <StatusBadge
                status={statusColors[document.status as keyof typeof statusColors]}
                size="sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>{document.uploadedBy}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              {document.ocrStatus === 'completed' && (
                <CheckCircle className="w-4 h-4 text-green-500" title="OCR Completed" />
              )}
              {document.ocrStatus === 'processing' && (
                <Clock className="w-4 h-4 text-yellow-500" title="OCR Processing" />
              )}
              {document.ocrStatus === 'failed' && (
                <AlertTriangle className="w-4 h-4 text-red-500" title="OCR Failed" />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(document.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {document.thumbnail ? (
            <img
              src={document.thumbnail}
              alt={document.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileIcon className="w-6 h-6 text-blue-500" />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {document.name}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {document.type}
              </Badge>
              <span className="text-xs text-gray-500">{document.size}</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Client:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {document.clientName}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Uploaded by:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {document.uploadedBy}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Date:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {new Date(document.uploadedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <StatusBadge
          status={statusColors[document.status as keyof typeof statusColors]}
          size="sm"
        />
        <div className="flex items-center space-x-1">
          {document.ocrStatus === 'completed' && (
            <CheckCircle className="w-4 h-4 text-green-500" title="OCR Completed" />
          )}
          {document.ocrStatus === 'processing' && (
            <Clock className="w-4 h-4 text-yellow-500" title="OCR Processing" />
          )}
          {document.ocrStatus === 'failed' && (
            <AlertTriangle className="w-4 h-4 text-red-500" title="OCR Failed" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function DocumentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleDocumentSelect = (id: string) => {
    setSelectedDocuments(prev =>
      prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    )
  }

  const handleBulkDownload = () => {
    console.log('Downloading documents:', selectedDocuments)
    // Implement bulk download logic
  }

  const handleBulkDelete = () => {
    console.log('Deleting documents:', selectedDocuments)
    // Implement bulk delete logic with confirmation
  }

  const clearFilters = () => {
    setTypeFilter('')
    setStatusFilter('')
    setClientFilter('')
    setSearchQuery('')
  }

  const filteredDocuments = mockDocuments.filter(doc => {
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doc.clientName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (typeFilter && doc.type !== typeFilter) return false
    if (statusFilter && doc.status !== statusFilter) return false
    if (clientFilter && doc.clientName !== clientFilter) return false
    return true
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-64" />
          <LoadingSkeleton className="h-96" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Documents
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and organize all client documents and files
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse
              </Button>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search documents by name, client, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABC Corporation">ABC Corporation</SelectItem>
                  <SelectItem value="Smith LLC">Smith LLC</SelectItem>
                  <SelectItem value="XYZ Ventures">XYZ Ventures</SelectItem>
                  <SelectItem value="Johnson & Associates">Johnson & Associates</SelectItem>
                </SelectContent>
              </Select>

              {(typeFilter || statusFilter || clientFilter || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Drag and drop files here
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Or click to browse and select files from your computer
          </p>
          <Button variant="outline">
            Choose Files
          </Button>
        </motion.div>

        {/* Bulk Actions */}
        {selectedDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedDocuments.length} document(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Selected
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Documents Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredDocuments.length > 0 ? (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            )}>
              {filteredDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                >
                  <DocumentCard
                    document={document}
                    viewMode={viewMode}
                    onSelect={handleDocumentSelect}
                    isSelected={selectedDocuments.includes(document.id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery || typeFilter || statusFilter || clientFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Upload your first document to get started.'}
              </p>
              {!searchQuery && !typeFilter && !statusFilter && !clientFilter && (
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Document
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Document Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockDocuments.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Processed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockDocuments.filter(d => d.status === 'processed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Processing
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockDocuments.filter(d => d.status === 'processing').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  OCR Complete
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockDocuments.filter(d => d.ocrStatus === 'completed').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}