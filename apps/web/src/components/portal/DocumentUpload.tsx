'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Progress,
  Paperclip
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface UploadedFile extends File {
  id: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

interface DocumentUploadProps {
  onUpload?: (files: File[]) => void
  onRemove?: (fileId: string) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: Record<string, string[]>
  className?: string
}

const defaultAcceptedTypes = {
  'application/pdf': ['.pdf'],
  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc']
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return '📄'
  if (type.includes('image')) return '🖼️'
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
  if (type.includes('word') || type.includes('doc')) return '📝'
  return '📁'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DocumentUpload({
  onUpload,
  onRemove,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = defaultAcceptedTypes,
  className
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles)
    }

    // Process accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading' as const
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach((file) => {
      simulateUpload(file)
    })

    // Call onUpload callback
    if (onUpload) {
      onUpload(acceptedFiles)
    }
  }, [onUpload])

  const simulateUpload = (file: UploadedFile) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === file.id) {
          const newProgress = Math.min(f.progress + Math.random() * 30, 100)
          const isComplete = newProgress >= 100

          return {
            ...f,
            progress: newProgress,
            status: isComplete ? 'completed' : f.status
          }
        }
        return f
      }))
    }, 500)

    // Complete upload after a delay
    setTimeout(() => {
      clearInterval(interval)
      setFiles(prev => prev.map(f => {
        if (f.id === file.id) {
          return {
            ...f,
            progress: 100,
            status: 'completed'
          }
        }
        return f
      }))
    }, 3000)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (onRemove) {
      onRemove(fileId)
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles
  })

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
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

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="text-2xl">
                  {getFileIcon(file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          file.status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                          file.status === 'uploading' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                          file.status === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        )}
                      >
                        <span className="flex items-center space-x-1">
                          {file.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {file.status === 'uploading' && <Progress className="w-3 h-3" />}
                          {file.status === 'error' && <AlertCircle className="w-3 h-3" />}
                          <span className="capitalize">{file.status}</span>
                        </span>
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

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                    {file.status === 'uploading' && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(file.progress)}%
                      </span>
                    )}
                  </div>

                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {file.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {file.error}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {files.filter(f => f.status === 'completed').length} of {files.length} files uploaded
          </span>
          {files.some(f => f.status === 'completed') && (
            <span className="text-green-600 dark:text-green-400">
              ✓ Ready to submit
            </span>
          )}
        </div>
      )}
    </div>
  )
}