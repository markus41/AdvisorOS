'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  Download,
  Eye,
  Calendar,
  Tag,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DocumentRequest {
  id: string
  title: string
  description: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  category: string
  isCompleted: boolean
  completedDate?: string
}

interface Document {
  id: string
  name: string
  type: string
  size: string
  uploadDate: string
  category: string
  year: number
  downloadUrl: string
  previewUrl?: string
}

interface DocumentRequestCardProps {
  request: DocumentRequest
  onUpload: (requestId: string) => void
}

function DocumentRequestCard({ request, onUpload }: DocumentRequestCardProps) {
  const priorityColors = {
    high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    low: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
  }

  const priorityTextColors = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-green-600 dark:text-green-400'
  }

  return (
    <Card className={`transition-all hover:shadow-md ${request.isCompleted ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`p-2 rounded-lg ${
              request.isCompleted
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              {request.isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className={`w-5 h-5 ${priorityTextColors[request.priority]}`} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {request.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {request.description}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {request.dueDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span>{request.category}</span>
                </div>
              </div>
              {request.isCompleted && request.completedDate && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Completed on {request.completedDate}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={priorityColors[request.priority]}>
              {request.priority.toUpperCase()}
            </Badge>
            {!request.isCompleted && (
              <Button onClick={() => onUpload(request.id)} size="sm">
                Upload
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DocumentCardProps {
  document: Document
  onPreview: (document: Document) => void
  onDownload: (document: Document) => void
}

function DocumentCard({ document, onPreview, onDownload }: DocumentCardProps) {
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
    if (type.includes('word') || type.includes('doc')) return '📝'
    return '📁'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="text-2xl">
              {getFileIcon(document.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {document.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {document.type} • {document.size}
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{document.uploadDate}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {document.category}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {document.previewUrl && (
              <Button
                onClick={() => onPreview(document)}
                size="sm"
                variant="ghost"
                className="p-1"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={() => onDownload(document)}
              size="sm"
              variant="ghost"
              className="p-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UploadZoneProps {
  onFileUpload: (files: File[]) => void
  isUploading: boolean
}

function UploadZone({ onFileUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    onFileUpload(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    onFileUpload(files)
  }

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8">
        <div
          className={`text-center transition-colors ${
            isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <div className="space-y-2">
            <Button asChild disabled={isUploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: PDF, DOC, XLS, JPG, PNG (Max 10MB each)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DocumentCenter() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [isUploading, setIsUploading] = useState(false)

  // Mock data
  const documentRequests: DocumentRequest[] = [
    {
      id: '1',
      title: 'Q3 2024 Bank Statements',
      description: 'All business bank account statements for July, August, and September 2024',
      dueDate: 'Nov 15, 2024',
      priority: 'high',
      category: 'Bank Statements',
      isCompleted: false
    },
    {
      id: '2',
      title: '2024 Business Insurance Declarations',
      description: 'Current declarations pages for all business insurance policies',
      dueDate: 'Nov 30, 2024',
      priority: 'medium',
      category: 'Insurance',
      isCompleted: false
    },
    {
      id: '3',
      title: 'Equipment Purchase Receipts',
      description: 'Receipts for all equipment purchases over $500 in 2024',
      dueDate: 'Dec 1, 2024',
      priority: 'low',
      category: 'Receipts',
      isCompleted: true,
      completedDate: 'Oct 25, 2024'
    }
  ]

  const documents: Document[] = [
    {
      id: '1',
      name: '2023_Tax_Return_Final.pdf',
      type: 'PDF Document',
      size: '2.4 MB',
      uploadDate: 'Mar 15, 2024',
      category: 'Tax Returns',
      year: 2023,
      downloadUrl: '/documents/2023_tax_return.pdf',
      previewUrl: '/documents/2023_tax_return.pdf'
    },
    {
      id: '2',
      name: 'Q2_2024_Financial_Statement.pdf',
      type: 'PDF Document',
      size: '1.8 MB',
      uploadDate: 'Jul 20, 2024',
      category: 'Financial Statements',
      year: 2024,
      downloadUrl: '/documents/q2_2024_financial.pdf',
      previewUrl: '/documents/q2_2024_financial.pdf'
    },
    {
      id: '3',
      name: 'Business_License_2024.jpg',
      type: 'Image',
      size: '856 KB',
      uploadDate: 'Jan 10, 2024',
      category: 'Licenses',
      year: 2024,
      downloadUrl: '/documents/business_license.jpg',
      previewUrl: '/documents/business_license.jpg'
    }
  ]

  const categories = ['all', 'Tax Returns', 'Financial Statements', 'Bank Statements', 'Receipts', 'Insurance', 'Licenses']
  const years = ['all', '2024', '2023', '2022']

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesYear = selectedYear === 'all' || doc.year.toString() === selectedYear

    return matchesSearch && matchesCategory && matchesYear
  })

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true)
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsUploading(false)
    // Here you would typically upload to your backend
    console.log('Uploading files:', files)
  }

  const handleUploadForRequest = (requestId: string) => {
    // Navigate to upload with pre-selected request
    console.log('Upload for request:', requestId)
  }

  const handlePreview = (document: Document) => {
    if (document.previewUrl) {
      window.open(document.previewUrl, '_blank')
    }
  }

  const handleDownload = (document: Document) => {
    // Create download link
    const link = window.document.createElement('a')
    link.href = document.downloadUrl
    link.download = document.name
    link.click()
  }

  return (
    
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your documents, view requests, and upload files securely
          </p>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Document Requests</TabsTrigger>
            <TabsTrigger value="library">Document Library</TabsTrigger>
            <TabsTrigger value="upload">Upload Center</TabsTrigger>
          </TabsList>

          {/* Document Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Requested Documents
              </h2>
              <Badge variant="secondary">
                {documentRequests.filter(r => !r.isCompleted).length} pending
              </Badge>
            </div>

            <div className="space-y-4">
              {documentRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <DocumentRequestCard
                    request={request}
                    onUpload={handleUploadForRequest}
                  />
                </motion.div>
              ))}
            </div>

            {documentRequests.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    All caught up!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You have no pending document requests at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Document Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <DocumentCard
                    document={document}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                  />
                </motion.div>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No documents found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search criteria or upload new documents.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upload Center Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Upload Documents
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Upload new documents to share with your CPA team
              </p>
            </div>

            <UploadZone onFileUpload={handleFileUpload} isUploading={isUploading} />

            {/* Upload Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
                <CardDescription>
                  Please follow these guidelines for best results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Supported File Types
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• PDF documents (.pdf)</li>
                      <li>• Word documents (.doc, .docx)</li>
                      <li>• Excel spreadsheets (.xls, .xlsx)</li>
                      <li>• Images (.jpg, .jpeg, .png, .gif)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Best Practices
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Use descriptive file names</li>
                      <li>• Ensure documents are legible</li>
                      <li>• Maximum file size: 10MB</li>
                      <li>• Include dates in file names when relevant</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  )
}