'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  Image,
  File,
  Download,
  Eye,
  Trash2,
  Share,
  Star,
  Archive,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Tag,
  Folder,
  FolderOpen,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Grid,
  List,
  MoreVertical,
  Edit,
  Copy,
  Move,
  History,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDropzone } from 'react-dropzone'

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  updatedAt: string
  uploadedBy: string
  uploaderName: string
  uploaderAvatar?: string
  status: 'processing' | 'ready' | 'error' | 'archived'
  category: string
  tags: string[]
  isStarred: boolean
  isShared: boolean
  sharedWith: string[]
  thumbnailUrl?: string
  downloadUrl: string
  previewUrl?: string
  description?: string
  version: number
  versionHistory: DocumentVersion[]
  comments: DocumentComment[]
  permissions: DocumentPermissions
  metadata: Record<string, any>
}

interface DocumentVersion {
  id: string
  version: number
  uploadedAt: string
  uploadedBy: string
  uploaderName: string
  changes: string
  size: number
  downloadUrl: string
}

interface DocumentComment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: string
  isResolved: boolean
}

interface DocumentPermissions {
  canView: boolean
  canDownload: boolean
  canComment: boolean
  canShare: boolean
  canDelete: boolean
}

interface DocumentFolder {
  id: string
  name: string
  parentId?: string
  isOpen: boolean
  documentCount: number
  createdAt: string
  permissions: DocumentPermissions
}

interface DocumentManagerProps {
  clientId?: string
  isClientView?: boolean
  currentUserId: string
}

const CATEGORIES = [
  { id: 'tax', name: 'Tax Documents', color: 'bg-blue-100 text-blue-800' },
  { id: 'financial', name: 'Financial Statements', color: 'bg-green-100 text-green-800' },
  { id: 'legal', name: 'Legal Documents', color: 'bg-purple-100 text-purple-800' },
  { id: 'contracts', name: 'Contracts', color: 'bg-orange-100 text-orange-800' },
  { id: 'invoices', name: 'Invoices & Receipts', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'reports', name: 'Reports', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'other', name: 'Other', color: 'bg-gray-100 text-gray-800' }
]

// Mock data
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Q2 2024 Tax Return.pdf',
    type: 'application/pdf',
    size: 2457600, // 2.4 MB
    uploadedAt: '2024-06-15T10:30:00Z',
    updatedAt: '2024-06-15T10:30:00Z',
    uploadedBy: 'user1',
    uploaderName: 'John Smith',
    uploaderAvatar: '/avatars/john.jpg',
    status: 'ready',
    category: 'tax',
    tags: ['q2', '2024', 'tax-return'],
    isStarred: true,
    isShared: false,
    sharedWith: [],
    thumbnailUrl: '/thumbnails/tax-return.jpg',
    downloadUrl: '/documents/q2-2024-tax-return.pdf',
    previewUrl: '/preview/q2-2024-tax-return',
    description: 'Quarterly tax return for Q2 2024',
    version: 2,
    versionHistory: [
      {
        id: 'v1',
        version: 1,
        uploadedAt: '2024-06-14T15:00:00Z',
        uploadedBy: 'user1',
        uploaderName: 'John Smith',
        changes: 'Initial upload',
        size: 2400000,
        downloadUrl: '/documents/q2-2024-tax-return-v1.pdf'
      }
    ],
    comments: [
      {
        id: 'c1',
        userId: 'client1',
        userName: 'Sarah Johnson',
        userAvatar: '/avatars/sarah.jpg',
        content: 'Please review section 3 for accuracy',
        timestamp: '2024-06-15T11:00:00Z',
        isResolved: false
      }
    ],
    permissions: {
      canView: true,
      canDownload: true,
      canComment: true,
      canShare: false,
      canDelete: false
    },
    metadata: {
      taxYear: '2024',
      quarter: 'Q2',
      entityType: 'Corporation'
    }
  },
  {
    id: '2',
    name: 'Financial Statements May 2024.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1834500,
    uploadedAt: '2024-06-14T14:20:00Z',
    updatedAt: '2024-06-14T14:20:00Z',
    uploadedBy: 'client1',
    uploaderName: 'Sarah Johnson',
    uploaderAvatar: '/avatars/sarah.jpg',
    status: 'ready',
    category: 'financial',
    tags: ['may-2024', 'financial-statements'],
    isStarred: false,
    isShared: true,
    sharedWith: ['user1', 'user2'],
    thumbnailUrl: '/thumbnails/spreadsheet.jpg',
    downloadUrl: '/documents/financial-statements-may-2024.xlsx',
    description: 'Monthly financial statements for May 2024',
    version: 1,
    versionHistory: [],
    comments: [],
    permissions: {
      canView: true,
      canDownload: true,
      canComment: true,
      canShare: true,
      canDelete: true
    },
    metadata: {
      month: 'May',
      year: '2024',
      currency: 'USD'
    }
  }
]

const mockFolders: DocumentFolder[] = [
  {
    id: 'root',
    name: 'Root',
    isOpen: true,
    documentCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    permissions: {
      canView: true,
      canDownload: true,
      canComment: true,
      canShare: true,
      canDelete: false
    }
  },
  {
    id: 'tax',
    name: 'Tax Documents',
    parentId: 'root',
    isOpen: false,
    documentCount: 5,
    createdAt: '2024-02-01T00:00:00Z',
    permissions: {
      canView: true,
      canDownload: true,
      canComment: true,
      canShare: false,
      canDelete: false
    }
  },
  {
    id: 'financial',
    name: 'Financial Statements',
    parentId: 'root',
    isOpen: false,
    documentCount: 8,
    createdAt: '2024-02-01T00:00:00Z',
    permissions: {
      canView: true,
      canDownload: true,
      canComment: true,
      canShare: true,
      canDelete: false
    }
  }
]

export function DocumentManager({ clientId, isClientView = false, currentUserId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [folders, setFolders] = useState<DocumentFolder[]>(mockFolders)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('root')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploading(true)
    setUploadProgress(0)

    // Simulate upload process
    acceptedFiles.forEach((file, index) => {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10
          if (newProgress >= 100) {
            clearInterval(interval)

            // Add uploaded file to documents
            const newDocument: Document = {
              id: `doc_${Date.now()}_${index}`,
              name: file.name,
              type: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              uploadedBy: currentUserId,
              uploaderName: isClientView ? 'You' : 'Client',
              status: 'processing',
              category: 'other',
              tags: [],
              isStarred: false,
              isShared: false,
              sharedWith: [],
              downloadUrl: URL.createObjectURL(file),
              version: 1,
              versionHistory: [],
              comments: [],
              permissions: {
                canView: true,
                canDownload: true,
                canComment: true,
                canShare: !isClientView,
                canDelete: true
              },
              metadata: {}
            }

            setDocuments(prev => [newDocument, ...prev])

            // Simulate processing completion
            setTimeout(() => {
              setDocuments(prev => prev.map(doc =>
                doc.id === newDocument.id ? { ...doc, status: 'ready' } : doc
              ))
            }, 2000)

            setUploading(false)
            setUploadProgress(0)
            return 100
          }
          return newProgress
        })
      }, 100)
    })
  }, [currentUserId, isClientView])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    }
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-green-600" />
    if (type === 'application/pdf') return <FileText className="w-8 h-8 text-red-600" />
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileText className="w-8 h-8 text-green-600" />
    if (type.includes('document') || type.includes('word')) return <FileText className="w-8 h-8 text-blue-600" />
    return <File className="w-8 h-8 text-gray-600" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return null
    }
  }

  const getCategoryBadge = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId)
    if (!category) return null
    return <Badge className={category.color}>{category.name}</Badge>
  }

  const toggleDocumentSelection = (documentId: string) => {
    const newSelection = new Set(selectedDocuments)
    if (newSelection.has(documentId)) {
      newSelection.delete(documentId)
    } else {
      newSelection.add(documentId)
    }
    setSelectedDocuments(newSelection)
  }

  const selectAllDocuments = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)))
    }
  }

  const deleteSelectedDocuments = () => {
    setDocuments(prev => prev.filter(doc => !selectedDocuments.has(doc.id)))
    setSelectedDocuments(new Set())
  }

  const toggleDocumentStar = (documentId: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, isStarred: !doc.isStarred } : doc
    ))
  }

  const addComment = (documentId: string, content: string) => {
    const newComment: DocumentComment = {
      id: `comment_${Date.now()}`,
      userId: currentUserId,
      userName: isClientView ? 'You' : 'CPA',
      content,
      timestamp: new Date().toISOString(),
      isResolved: false
    }

    setDocuments(prev => prev.map(doc =>
      doc.id === documentId
        ? { ...doc, comments: [...doc.comments, newComment] }
        : doc
    ))
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'date':
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
      default:
        comparison = 0
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your documents with advanced organization and collaboration features
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  Grid
                </div>
              </SelectItem>
              <SelectItem value="list">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  List
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Documents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
                <DialogDescription>
                  Drag and drop files here or click to browse
                </DialogDescription>
              </DialogHeader>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Maximum file size: 50MB
                    </p>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'size' | 'type') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {selectedDocuments.size > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteSelectedDocuments}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardContent className="p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedDocuments.map((document) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedDocument(document)
                    setShowPreview(true)
                  }}
                >
                  {/* Selection Checkbox */}
                  <div
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDocumentSelection(document.id)
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => toggleDocumentSelection(document.id)}
                      className="rounded"
                    />
                  </div>

                  {/* Star */}
                  <div
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDocumentStar(document.id)
                    }}
                  >
                    <Star
                      className={`w-4 h-4 cursor-pointer transition-colors ${
                        document.isStarred
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    />
                  </div>

                  <div className="text-center mb-3">
                    {document.thumbnailUrl ? (
                      <img
                        src={document.thumbnailUrl}
                        alt={document.name}
                        className="w-16 h-16 mx-auto rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto flex items-center justify-center">
                        {getFileIcon(document.type)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {document.name}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(document.size)}</span>
                      <span>{formatDate(document.uploadedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(document.status)}
                      {getCategoryBadge(document.category)}
                    </div>

                    {document.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {document.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={document.uploaderAvatar} alt={document.uploaderName} />
                          <AvatarFallback className="text-xs">
                            {document.uploaderName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600">{document.uploaderName}</span>
                      </div>

                      {document.comments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{document.comments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      {document.permissions.canView && (
                        <Button size="sm" variant="secondary" className="h-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {document.permissions.canDownload && (
                        <Button size="sm" variant="secondary" className="h-8">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="secondary" className="h-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          {document.permissions.canShare && (
                            <DropdownMenuItem>
                              <Share className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Move className="w-4 h-4 mr-2" />
                            Move
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="w-4 h-4 mr-2" />
                            Version History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {document.permissions.canDelete && (
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* List Header */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="w-8">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={selectAllDocuments}
                    className="rounded"
                  />
                </div>
                <div className="flex-1">Name</div>
                <div className="w-24">Size</div>
                <div className="w-32">Modified</div>
                <div className="w-24">Status</div>
                <div className="w-8"></div>
              </div>

              {/* List Items */}
              {sortedDocuments.map((document) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDocument(document)
                    setShowPreview(true)
                  }}
                >
                  <div className="w-8">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => toggleDocumentSelection(document.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(document.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {document.name}
                        </h3>
                        {document.isStarred && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                        {document.isShared && (
                          <Share className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      {document.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(document.size)}
                  </div>

                  <div className="w-32 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(document.uploadedAt)}
                  </div>

                  <div className="w-24">
                    {getStatusBadge(document.status)}
                  </div>

                  <div className="w-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        {document.permissions.canShare && (
                          <DropdownMenuItem>
                            <Share className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {document.permissions.canDelete && (
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {sortedDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first document to get started'}
              </p>
              {(!searchQuery && filterCategory === 'all' && filterStatus === 'all') && (
                <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Documents
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && getFileIcon(selectedDocument.type)}
              {selectedDocument?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="flex-1 grid grid-cols-3 gap-6">
              {/* Preview Area */}
              <div className="col-span-2 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                {selectedDocument.previewUrl ? (
                  <iframe
                    src={selectedDocument.previewUrl}
                    className="w-full h-full rounded"
                    title={selectedDocument.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      {getFileIcon(selectedDocument.type)}
                      <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Preview not available for this file type
                      </p>
                      <Button variant="outline" className="mt-2 gap-2">
                        <Download className="w-4 h-4" />
                        Download to view
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Details Panel */}
              <div className="space-y-6">
                {/* Document Info */}
                <div className="space-y-3">
                  <h4 className="font-medium">Document Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span>{formatFileSize(selectedDocument.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uploaded:</span>
                      <span>{formatDate(selectedDocument.uploadedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span>v{selectedDocument.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uploader:</span>
                      <span>{selectedDocument.uploaderName}</span>
                    </div>
                  </div>
                  {selectedDocument.description && (
                    <div>
                      <span className="text-sm text-gray-600">Description:</span>
                      <p className="text-sm mt-1">{selectedDocument.description}</p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedDocument.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDocument.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-3">
                  <h4 className="font-medium">Comments ({selectedDocument.comments.length})</h4>
                  <ScrollArea className="h-40">
                    <div className="space-y-3">
                      {selectedDocument.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                            <AvatarFallback className="text-xs">
                              {comment.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">{comment.userName}</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {selectedDocument.permissions.canComment && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        className="resize-none"
                        rows={2}
                      />
                      <Button size="sm" className="w-full">
                        Add Comment
                      </Button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {selectedDocument.permissions.canDownload && (
                    <Button variant="outline" className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  )}
                  {selectedDocument.permissions.canShare && (
                    <Button variant="outline" className="w-full gap-2">
                      <Share className="w-4 h-4" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}