'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  X,
  Check,
  AlertTriangle,
  Loader2,
  FolderOpen,
  Camera,
  Paperclip,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  category?: string
  description?: string
  ocrStatus?: 'pending' | 'processing' | 'completed' | 'error'
  ocrResults?: any
  error?: string
}

interface DocumentUploadProps {
  clientId?: string
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadProgress?: (file: UploadedFile) => void
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  maxFiles?: number
  autoProcess?: boolean
  className?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.txt',
  '.csv'
]

const DOCUMENT_CATEGORIES = [
  { value: 'tax-documents', label: 'Tax Documents' },
  { value: 'financial-statements', label: 'Financial Statements' },
  { value: 'receipts', label: 'Receipts' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'bank-statements', label: 'Bank Statements' },
  { value: 'payroll', label: 'Payroll Documents' },
  { value: 'other', label: 'Other' },
]

export function DocumentUpload({
  clientId,
  onUploadComplete,
  onUploadProgress,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = 10, // 10MB default
  maxFiles = 10,
  autoProcess = true,
  className
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-500" />
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-8 h-8 text-green-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <Image className="w-8 h-8 text-purple-500" />
      default:
        return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(extension)) {
      return `File type ${extension} is not supported`
    }

    return null
  }

  const processFile = async (file: File): Promise<UploadedFile> => {
    const fileId = Math.random().toString(36).substr(2, 9)

    const uploadedFile: UploadedFile = {
      id: fileId,
      file,
      progress: 0,
      status: 'uploading',
      category: 'other',
      description: ''
    }

    // Simulate file upload progress
    const uploadPromise = new Promise<void>((resolve, reject) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // Simulate upload completion
          setTimeout(() => {
            uploadedFile.status = autoProcess ? 'processing' : 'completed'
            setUploadedFiles(prev =>
              prev.map(f => f.id === fileId ? { ...uploadedFile, progress: 100 } : f)
            )

            if (autoProcess) {
              // Simulate OCR processing for image/PDF files
              const needsOCR = ['pdf', 'png', 'jpg', 'jpeg'].includes(
                file.name.split('.').pop()?.toLowerCase() || ''
              )

              if (needsOCR) {
                uploadedFile.ocrStatus = 'processing'

                setTimeout(() => {
                  uploadedFile.ocrStatus = 'completed'
                  uploadedFile.ocrResults = {
                    text: 'Sample OCR text extracted from document...',
                    confidence: 0.95,
                    entities: [
                      { type: 'date', value: '2024-01-15', confidence: 0.98 },
                      { type: 'amount', value: '$1,234.56', confidence: 0.92 },
                      { type: 'vendor', value: 'ABC Company', confidence: 0.88 }
                    ]
                  }
                  uploadedFile.status = 'completed'
                  setUploadedFiles(prev =>
                    prev.map(f => f.id === fileId ? { ...uploadedFile } : f)
                  )
                  onUploadProgress?.(uploadedFile)
                }, 2000)
              } else {
                uploadedFile.status = 'completed'
                setUploadedFiles(prev =>
                  prev.map(f => f.id === fileId ? { ...uploadedFile } : f)
                )
              }
            }

            resolve()
          }, 500)
        } else {
          uploadedFile.progress = progress
          setUploadedFiles(prev =>
            prev.map(f => f.id === fileId ? { ...uploadedFile } : f)
          )
          onUploadProgress?.(uploadedFile)
        }
      }, 100)
    })

    return uploadPromise.then(() => uploadedFile)
  }

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Validate number of files
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate each file
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (validFiles.length === 0) return

    setIsUploading(true)

    // Add files to state immediately
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const,
      category: 'other',
      description: ''
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    try {
      // Process files concurrently
      const processedFiles = await Promise.all(
        validFiles.map(file => processFile(file))
      )

      toast.success(`Successfully uploaded ${processedFiles.length} file(s)`)
      onUploadComplete?.(processedFiles)
    } catch (error) {
      toast.error('Failed to upload some files')
    } finally {
      setIsUploading(false)
    }
  }, [uploadedFiles.length, maxFiles, autoProcess, onUploadComplete, onUploadProgress])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [handleFileSelect])

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileMetadata = (fileId: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, ...updates } : f)
    )
  }

  const retryUpload = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId)
    if (!file) return

    updateFileMetadata(fileId, { status: 'uploading', progress: 0, error: undefined })

    try {
      await processFile(file.file)
    } catch (error) {
      updateFileMetadata(fileId, {
        status: 'error',
        error: 'Upload failed. Please try again.'
      })
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            {isDragging ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center"
              >
                <Upload className="w-8 h-8 text-blue-600" />
              </motion.div>
            ) : (
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isDragging ? 'Drop files here' : 'Upload documents'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Drag and drop files here, or click to browse
            </p>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Supported formats: {acceptedTypes.join(', ')}</p>
            <p>Maximum file size: {maxFileSize}MB • Maximum files: {maxFiles}</p>
          </div>

          <Button type="button" variant="outline" className="mt-4">
            <Paperclip className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Uploaded Files ({uploadedFiles.length})
              </h4>
              {uploadedFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadedFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <motion.div
                  key={uploadedFile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(uploadedFile.file)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {uploadedFile.file.name}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center space-x-2">
                          {uploadedFile.status === 'uploading' && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                          {uploadedFile.status === 'processing' && (
                            <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                          )}
                          {uploadedFile.status === 'completed' && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                          {uploadedFile.status === 'error' && (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadedFile.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(uploadedFile.status === 'uploading' || uploadedFile.status === 'processing') && (
                        <div className="mb-3">
                          <Progress value={uploadedFile.progress} className="h-2" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {uploadedFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                            {uploadedFile.progress}%
                          </p>
                        </div>
                      )}

                      {/* Error Message */}
                      {uploadedFile.status === 'error' && uploadedFile.error && (
                        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                          {uploadedFile.error}
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => retryUpload(uploadedFile.id)}
                            className="ml-2 h-auto p-0 text-xs"
                          >
                            Retry
                          </Button>
                        </div>
                      )}

                      {/* OCR Results */}
                      {uploadedFile.ocrResults && (
                        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                          <div className="flex items-center space-x-2 mb-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                              OCR Completed
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(uploadedFile.ocrResults.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                            Extracted {uploadedFile.ocrResults.entities?.length || 0} entities
                          </p>
                          {uploadedFile.ocrResults.entities && (
                            <div className="flex flex-wrap gap-1">
                              {uploadedFile.ocrResults.entities.map((entity: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {entity.type}: {entity.value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* File Metadata */}
                      {uploadedFile.status === 'completed' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Category
                            </label>
                            <Select
                              value={uploadedFile.category}
                              onValueChange={(value) => updateFileMetadata(uploadedFile.id, { category: value })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_CATEGORIES.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description (Optional)
                            </label>
                            <Input
                              placeholder="Add description..."
                              value={uploadedFile.description}
                              onChange={(e) => updateFileMetadata(uploadedFile.id, { description: e.target.value })}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DocumentUpload