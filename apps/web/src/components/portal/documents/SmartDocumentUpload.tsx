'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Progress,
  Paperclip,
  Camera,
  Smartphone,
  FolderOpen,
  Tag,
  Zap,
  Clock,
  Eye,
  Download,
  RotateCcw,
  Crop,
  Scan,
  FileImage,
  FileText,
  Calculator,
  Receipt,
  CreditCard,
  Building,
  User,
  Calendar,
  TrendingUp,
  Shield,
  Lightbulb,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  SortAsc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SmartUploadedFile extends File {
  id: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  aiSuggestions?: {
    category: string
    confidence: number
    tags: string[]
    extractedData: Record<string, any>
    relatedDocuments?: string[]
  }
  thumbnail?: string
  ocrText?: string
  metadata?: {
    dateDetected?: string
    amountDetected?: string
    vendorDetected?: string
  }
}

interface DocumentCategory {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  commonTags: string[]
  autoDetectionKeywords: string[]
  color: string
}

interface SmartDocumentUploadProps {
  onUpload?: (files: SmartUploadedFile[]) => void
  onRemove?: (fileId: string) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: Record<string, string[]>
  enableAI?: boolean
  enableMobileCapture?: boolean
  enableBulkMode?: boolean
  className?: string
}

const documentCategories: DocumentCategory[] = [
  {
    id: 'receipts',
    name: 'Receipts & Expenses',
    icon: Receipt,
    description: 'Business receipts, expense records, and purchase documentation',
    commonTags: ['expense', 'receipt', 'business', 'deductible', 'travel'],
    autoDetectionKeywords: ['receipt', 'total', 'tax', 'purchase', 'payment'],
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  },
  {
    id: 'invoices',
    name: 'Invoices',
    icon: FileText,
    description: 'Client invoices, billing statements, and payment records',
    commonTags: ['invoice', 'billing', 'payment', 'client', 'revenue'],
    autoDetectionKeywords: ['invoice', 'bill', 'amount due', 'payment terms'],
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  },
  {
    id: 'bank-statements',
    name: 'Bank Statements',
    icon: CreditCard,
    description: 'Bank statements, transaction records, and account summaries',
    commonTags: ['banking', 'transactions', 'statement', 'account', 'balance'],
    autoDetectionKeywords: ['statement', 'balance', 'transaction', 'account number'],
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  },
  {
    id: 'tax-documents',
    name: 'Tax Documents',
    icon: Calculator,
    description: 'Tax forms, W-2s, 1099s, and tax-related correspondence',
    commonTags: ['tax', 'form', 'w2', '1099', 'deduction', 'refund'],
    autoDetectionKeywords: ['form', 'tax', 'w-2', '1099', 'irs', 'deduction'],
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  },
  {
    id: 'contracts',
    name: 'Contracts & Legal',
    icon: Building,
    description: 'Contracts, agreements, legal documents, and compliance records',
    commonTags: ['contract', 'agreement', 'legal', 'compliance', 'signature'],
    autoDetectionKeywords: ['agreement', 'contract', 'terms', 'signature', 'party'],
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  },
  {
    id: 'other',
    name: 'Other Documents',
    icon: File,
    description: 'Miscellaneous business documents and records',
    commonTags: ['general', 'misc', 'document', 'record'],
    autoDetectionKeywords: [],
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
]

const defaultAcceptedTypes = {
  'application/pdf': ['.pdf'],
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc']
}

function getFileIcon(type: string): React.ComponentType<{ className?: string }> {
  if (type.includes('pdf')) return FileText
  if (type.includes('image')) return FileImage
  if (type.includes('spreadsheet') || type.includes('excel')) return Calculator
  if (type.includes('word') || type.includes('doc')) return FileText
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Simulate AI processing for document categorization
function simulateAIProcessing(file: File): Promise<SmartUploadedFile['aiSuggestions']> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fileName = file.name.toLowerCase()
      const fileType = file.type.toLowerCase()

      // Simple keyword-based categorization simulation
      let category = 'other'
      let confidence = 0.5
      const tags: string[] = []
      const extractedData: Record<string, any> = {}

      // Simulate different AI confidence levels based on file characteristics
      if (fileName.includes('receipt') || fileName.includes('expense')) {
        category = 'receipts'
        confidence = 0.95
        tags.push('expense', 'receipt', 'business')
        extractedData.amount = `$${(Math.random() * 500 + 10).toFixed(2)}`
        extractedData.vendor = 'Sample Vendor Inc.'
        extractedData.date = new Date().toISOString().split('T')[0]
      } else if (fileName.includes('invoice') || fileName.includes('bill')) {
        category = 'invoices'
        confidence = 0.92
        tags.push('invoice', 'billing', 'payment')
        extractedData.invoiceNumber = `INV-${Math.floor(Math.random() * 10000)}`
        extractedData.amount = `$${(Math.random() * 2000 + 100).toFixed(2)}`
      } else if (fileName.includes('bank') || fileName.includes('statement')) {
        category = 'bank-statements'
        confidence = 0.88
        tags.push('banking', 'statement', 'transactions')
        extractedData.accountNumber = `****${Math.floor(Math.random() * 9999)}`
        extractedData.period = 'March 2024'
      } else if (fileName.includes('tax') || fileName.includes('w2') || fileName.includes('1099')) {
        category = 'tax-documents'
        confidence = 0.96
        tags.push('tax', 'form', 'irs')
        extractedData.taxYear = '2024'
        extractedData.formType = fileName.includes('w2') ? 'W-2' : '1099'
      } else if (fileType.includes('image')) {
        // For images, assume receipt/expense unless filename suggests otherwise
        category = 'receipts'
        confidence = 0.75
        tags.push('image', 'receipt', 'mobile-capture')
        extractedData.capturedWith = 'Mobile Device'
      }

      resolve({
        category,
        confidence,
        tags,
        extractedData,
        relatedDocuments: confidence > 0.8 ? [`Related Doc ${Math.floor(Math.random() * 100)}`] : undefined
      })
    }, 1500 + Math.random() * 1000) // Simulate processing time
  })
}

export function SmartDocumentUpload({
  onUpload,
  onRemove,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = defaultAcceptedTypes,
  enableAI = true,
  enableMobileCapture = true,
  enableBulkMode = false,
  className
}: SmartDocumentUploadProps) {
  const [files, setFiles] = useState<SmartUploadedFile[]>([])
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [bulkTags, setBulkTags] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'confidence'>('date')
  const [filterBy, setFilterBy] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles)
    }

    // Process accepted files
    const newFiles: SmartUploadedFile[] = acceptedFiles.map((file) => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading' as const
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Simulate upload and processing for each file
    for (const file of newFiles) {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id && f.status === 'uploading') {
            const newProgress = Math.min(f.progress + Math.random() * 20, 100)
            const isUploadComplete = newProgress >= 100

            return {
              ...f,
              progress: newProgress,
              status: isUploadComplete ? 'processing' : f.status
            }
          }
          return f
        }))
      }, 300)

      // Complete upload and start AI processing
      setTimeout(async () => {
        clearInterval(uploadInterval)

        setFiles(prev => prev.map(f => {
          if (f.id === file.id) {
            return {
              ...f,
              progress: 100,
              status: 'processing'
            }
          }
          return f
        }))

        // AI Processing (if enabled)
        if (enableAI) {
          try {
            const aiSuggestions = await simulateAIProcessing(file)

            setFiles(prev => prev.map(f => {
              if (f.id === file.id) {
                return {
                  ...f,
                  status: 'completed',
                  aiSuggestions,
                  metadata: {
                    dateDetected: aiSuggestions.extractedData.date,
                    amountDetected: aiSuggestions.extractedData.amount,
                    vendorDetected: aiSuggestions.extractedData.vendor
                  }
                }
              }
              return f
            }))
          } catch (error) {
            setFiles(prev => prev.map(f => {
              if (f.id === file.id) {
                return {
                  ...f,
                  status: 'error',
                  error: 'AI processing failed'
                }
              }
              return f
            }))
          }
        } else {
          setFiles(prev => prev.map(f => {
            if (f.id === file.id) {
              return {
                ...f,
                status: 'completed'
              }
            }
            return f
          }))
        }
      }, 1500 + Math.random() * 1000)
    }

    // Call onUpload callback
    if (onUpload) {
      onUpload(newFiles)
    }
  }, [onUpload, enableAI])

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (onRemove) {
      onRemove(fileId)
    }
  }

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleCameraFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onDrop(Array.from(files), [])
    }
  }

  const updateFileCategory = (fileId: string, category: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const categoryData = documentCategories.find(c => c.id === category)
        return {
          ...f,
          aiSuggestions: {
            ...f.aiSuggestions!,
            category,
            tags: categoryData ? [...f.aiSuggestions!.tags, ...categoryData.commonTags] : f.aiSuggestions!.tags
          }
        }
      }
      return f
    }))
  }

  const addTagToFile = (fileId: string, tag: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId && f.aiSuggestions) {
        return {
          ...f,
          aiSuggestions: {
            ...f.aiSuggestions,
            tags: [...new Set([...f.aiSuggestions.tags, tag])]
          }
        }
      }
      return f
    }))
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles
  })

  const completedFiles = files.filter(f => f.status === 'completed')
  const processingFiles = files.filter(f => f.status === 'processing' || f.status === 'uploading')
  const errorFiles = files.filter(f => f.status === 'error')

  const sortedFiles = [...files].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'confidence':
        return (b.aiSuggestions?.confidence || 0) - (a.aiSuggestions?.confidence || 0)
      case 'date':
      default:
        return b.lastModified - a.lastModified
    }
  })

  const filteredFiles = filterBy
    ? sortedFiles.filter(f =>
        f.aiSuggestions?.category === filterBy ||
        f.aiSuggestions?.tags.some(tag => tag.toLowerCase().includes(filterBy.toLowerCase())) ||
        f.name.toLowerCase().includes(filterBy.toLowerCase())
      )
    : sortedFiles

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="files" className="relative">
            Files
            {files.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {files.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {/* Smart Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Smart Document Upload
                {enableAI && (
                  <Badge variant="secondary" className="text-xs">
                    AI Powered
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Upload documents with automatic categorization and data extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                  isDragActive && !isDragReject && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                  isDragReject && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                  !isDragActive && 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                {isDragActive ? (
                  isDragReject ? (
                    <div>
                      <p className="text-red-600 dark:text-red-400 font-medium">
                        Some files are not supported
                      </p>
                      <p className="text-sm text-red-500 dark:text-red-500 mt-1">
                        Please check file types and sizes
                      </p>
                    </div>
                  ) : (
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      Drop the files here...
                    </p>
                  )
                ) : (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                      {files.length >= maxFiles ? 'Maximum files reached' : 'Drag & drop files here, or click to select'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      PDF, Images, Word docs, Spreadsheets up to {formatFileSize(maxSize)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Maximum {maxFiles} files ({files.length}/{maxFiles} used)
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>

                {enableMobileCapture && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCameraCapture}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={Object.keys(acceptedTypes).join(',')}
                onChange={(e) => e.target.files && onDrop(Array.from(e.target.files), [])}
                className="hidden"
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraFiles}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Quick Category Selection */}
          {enableAI && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Categories</CardTitle>
                <CardDescription>
                  Pre-select category for faster processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {documentCategories.slice(0, -1).map((category) => {
                    const Icon = category.icon
                    const isSelected = selectedCategory === category.id

                    return (
                      <div
                        key={category.id}
                        onClick={() => setSelectedCategory(isSelected ? '' : category.id)}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all",
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className={cn(
                            "h-5 w-5",
                            isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                          )} />
                          <div>
                            <p className={cn(
                              "text-sm font-medium",
                              isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"
                            )}>
                              {category.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          {/* File Management Controls */}
          {files.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search files..."
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="w-40"
                      />
                    </div>

                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Sort by Date</SelectItem>
                        <SelectItem value="name">Sort by Name</SelectItem>
                        <SelectItem value="confidence">Sort by AI Confidence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Advanced
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Bulk Category Assignment</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category for all" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentCategories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Bulk Tags</Label>
                        <Input
                          placeholder="Add tags (comma separated)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const tags = e.currentTarget.value.split(',').map(t => t.trim())
                              setBulkTags(tags)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* File List */}
          <AnimatePresence>
            {filteredFiles.length > 0 ? (
              <div className="space-y-3">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.type)
                  const category = documentCategories.find(c => c.id === file.aiSuggestions?.category)

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <Icon className="h-8 w-8 text-gray-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  file.status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                                  file.status === 'uploading' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                                  file.status === 'processing' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                                  file.status === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                )}
                              >
                                {file.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {file.status === 'uploading' && <Upload className="w-3 h-3 mr-1" />}
                                {file.status === 'processing' && <Zap className="w-3 h-3 mr-1" />}
                                {file.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(file.id)}
                                className="p-1 h-auto"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                            {file.status === 'uploading' && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {Math.round(file.progress)}%
                              </span>
                            )}
                          </div>

                          {(file.status === 'uploading' || file.status === 'processing') && (
                            <div className="mb-3">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={cn(
                                    "h-2 rounded-full transition-all duration-300",
                                    file.status === 'uploading' ? "bg-blue-500" : "bg-yellow-500"
                                  )}
                                  style={{ width: `${file.status === 'processing' ? 75 : file.progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {file.status === 'uploading' ? 'Uploading...' : 'Processing with AI...'}
                              </p>
                            </div>
                          )}

                          {/* AI Suggestions */}
                          {file.aiSuggestions && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge className={category?.color}>
                                    {category?.name || 'Other'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(file.aiSuggestions.confidence * 100)}% confidence
                                  </Badge>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                              </div>

                              {/* Extracted Data */}
                              {Object.keys(file.aiSuggestions.extractedData).length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Extracted Information
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(file.aiSuggestions.extractedData).map(([key, value]) => (
                                      <div key={key}>
                                        <span className="text-gray-500 dark:text-gray-400 capitalize">
                                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                                        </span>
                                        <span className="text-gray-900 dark:text-white ml-1">
                                          {value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1">
                                {file.aiSuggestions.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              {/* Category Selection */}
                              <div className="flex items-center space-x-2">
                                <Label className="text-xs">Category:</Label>
                                <Select
                                  value={file.aiSuggestions.category}
                                  onValueChange={(value) => updateFileCategory(file.id, value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {documentCategories.map(category => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {file.error && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              {file.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : files.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No files uploaded yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Switch to the Upload tab to add your first document
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No files match your filter
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filter criteria
                  </p>
                </CardContent>
              </Card>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {completedFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Files</span>
                      <span className="font-medium">{files.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                      <span className="font-medium text-green-600">{completedFiles.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Processing</span>
                      <span className="font-medium text-yellow-600">{processingFiles.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Errors</span>
                      <span className="font-medium text-red-600">{errorFiles.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {documentCategories.map(category => {
                      const count = completedFiles.filter(f => f.aiSuggestions?.category === category.id).length

                      if (count === 0) return null

                      return (
                        <div key={category.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <category.icon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{category.name}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(completedFiles.reduce((acc, f) => acc + (f.aiSuggestions?.confidence || 0), 0) / completedFiles.length * 100) || 0}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average AI Confidence</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {completedFiles.filter(f => (f.aiSuggestions?.confidence || 0) > 0.8).length}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">High Confidence Matches</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Set(completedFiles.flatMap(f => f.aiSuggestions?.tags || [])).size}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Unique Tags Detected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upload insights will appear here
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload and process some documents to see AI-powered insights and analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Summary */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-400">
                  {completedFiles.length} of {files.length} files processed
                </span>
                {enableAI && completedFiles.length > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    <Zap className="w-4 h-4 inline mr-1" />
                    AI categorization active
                  </span>
                )}
              </div>
              {completedFiles.length > 0 && (
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Summary
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}