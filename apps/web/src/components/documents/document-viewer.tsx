'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Share2,
  MessageSquare,
  Highlighter,
  PenTool,
  Type,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Annotation {
  id: string
  type: 'highlight' | 'note' | 'drawing' | 'text'
  x: number
  y: number
  width?: number
  height?: number
  content: string
  author: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  resolved?: boolean
  color?: string
  page?: number
}

interface DocumentViewerProps {
  documentId: string
  documentUrl: string
  documentName: string
  documentType: 'pdf' | 'image' | 'text'
  annotations?: Annotation[]
  onAnnotationCreate?: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void
  onAnnotationUpdate?: (annotationId: string, updates: Partial<Annotation>) => void
  onAnnotationDelete?: (annotationId: string) => void
  canAnnotate?: boolean
  canView?: boolean
  collaborators?: Array<{
    id: string
    name: string
    avatar?: string
    online: boolean
  }>
  className?: string
}

export function DocumentViewer({
  documentId,
  documentUrl,
  documentName,
  documentType,
  annotations = [],
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  canAnnotate = true,
  canView = true,
  collaborators = [],
  className
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<'select' | 'highlight' | 'note' | 'drawing' | 'text'>('select')
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState<{
    x: number
    y: number
    width?: number
    height?: number
    type: Annotation['type']
  } | null>(null)
  const [annotationContent, setAnnotationContent] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const viewerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mock user for demo purposes
  const currentUser = {
    id: 'current-user',
    name: 'John Doe',
    avatar: ''
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = documentUrl
    link.download = documentName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Document downloaded')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Document link copied to clipboard')
  }

  const handleViewerClick = (event: React.MouseEvent) => {
    if (!canAnnotate || activeAnnotationTool === 'select') return

    const rect = viewerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    if (activeAnnotationTool === 'note' || activeAnnotationTool === 'text') {
      setNewAnnotation({
        x,
        y,
        type: activeAnnotationTool
      })
      setIsCreatingAnnotation(true)
    } else if (activeAnnotationTool === 'highlight') {
      // For highlight, we'd implement drag selection
      setNewAnnotation({
        x,
        y,
        width: 10,
        height: 2,
        type: 'highlight'
      })
      setIsCreatingAnnotation(true)
    }
  }

  const saveAnnotation = () => {
    if (!newAnnotation || !annotationContent.trim()) return

    const annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
      type: newAnnotation.type,
      x: newAnnotation.x,
      y: newAnnotation.y,
      width: newAnnotation.width,
      height: newAnnotation.height,
      content: annotationContent,
      author: currentUser.name,
      authorId: currentUser.id,
      page: currentPage,
      color: newAnnotation.type === 'highlight' ? '#ffff00' : '#3b82f6'
    }

    onAnnotationCreate?.(annotation)
    setNewAnnotation(null)
    setIsCreatingAnnotation(false)
    setAnnotationContent('')
    setActiveAnnotationTool('select')
    toast.success('Annotation added')
  }

  const cancelAnnotation = () => {
    setNewAnnotation(null)
    setIsCreatingAnnotation(false)
    setAnnotationContent('')
    setActiveAnnotationTool('select')
  }

  const deleteAnnotation = (annotationId: string) => {
    onAnnotationDelete?.(annotationId)
    setSelectedAnnotation(null)
    toast.success('Annotation deleted')
  }

  const toggleAnnotationResolved = (annotationId: string) => {
    const annotation = annotations.find(a => a.id === annotationId)
    if (!annotation) return

    onAnnotationUpdate?.(annotationId, { resolved: !annotation.resolved })
    toast.success(annotation.resolved ? 'Annotation reopened' : 'Annotation resolved')
  }

  const getAnnotationColor = (annotation: Annotation) => {
    if (annotation.type === 'highlight') return annotation.color || '#ffff00'
    if (annotation.resolved) return '#10b981'
    return annotation.color || '#3b82f6'
  }

  const visibleAnnotations = annotations.filter(a => a.page === currentPage)

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view this document.
          </p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700", className)}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {documentName}
            </h3>
            <Badge variant="outline">{documentType.toUpperCase()}</Badge>
            {annotations.length > 0 && (
              <Badge variant="secondary">
                {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="flex items-center space-x-1 mr-3">
                {collaborators.slice(0, 3).map((collaborator) => (
                  <Tooltip key={collaborator.id}>
                    <TooltipTrigger>
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                          {collaborator.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {collaborator.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{collaborator.name} {collaborator.online ? '(Online)' : '(Offline)'}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 300}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>

            {/* Annotation Tools */}
            {canAnnotate && (
              <>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

                <Button
                  variant={activeAnnotationTool === 'select' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveAnnotationTool('select')}
                >
                  <Eye className="w-4 h-4" />
                </Button>

                <Button
                  variant={activeAnnotationTool === 'highlight' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveAnnotationTool('highlight')}
                >
                  <Highlighter className="w-4 h-4" />
                </Button>

                <Button
                  variant={activeAnnotationTool === 'note' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveAnnotationTool('note')}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>

                <Button
                  variant={activeAnnotationTool === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveAnnotationTool('text')}
                >
                  <Type className="w-4 h-4" />
                </Button>

                <Button
                  variant={showAnnotations ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                >
                  {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>

          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={viewerRef}
            className="h-full w-full overflow-auto bg-gray-100 dark:bg-gray-800 p-4 cursor-crosshair"
            onClick={handleViewerClick}
            style={{ cursor: activeAnnotationTool === 'select' ? 'default' : 'crosshair' }}
          >
            <div
              className="mx-auto bg-white dark:bg-gray-900 shadow-lg relative"
              style={{
                width: `${zoom}%`,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              {/* Document Content */}
              {documentType === 'image' ? (
                <img
                  src={documentUrl}
                  alt={documentName}
                  className="w-full h-auto block"
                  onLoad={() => setTotalPages(1)}
                />
              ) : documentType === 'pdf' ? (
                <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">PDF viewer would be rendered here</p>
                </div>
              ) : (
                <div className="p-8 text-sm leading-relaxed">
                  <p className="text-gray-900 dark:text-white">
                    Text document content would be rendered here...
                  </p>
                </div>
              )}

              {/* Annotations */}
              {showAnnotations && visibleAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    width: annotation.width ? `${annotation.width}%` : 'auto',
                    height: annotation.height ? `${annotation.height}%` : 'auto',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedAnnotation(annotation.id)
                  }}
                >
                  {annotation.type === 'highlight' ? (
                    <div
                      className="w-full h-full opacity-50 border-2 border-transparent hover:border-yellow-400"
                      style={{ backgroundColor: getAnnotationColor(annotation) }}
                    />
                  ) : (
                    <div className="relative">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: getAnnotationColor(annotation) }}
                      >
                        {annotation.type === 'note' ? (
                          <MessageSquare className="w-3 h-3" />
                        ) : annotation.type === 'text' ? (
                          <Type className="w-3 h-3" />
                        ) : annotation.resolved ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                      </div>

                      {/* Annotation Popup */}
                      {selectedAnnotation === annotation.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-8 left-0 z-10 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                {annotation.author.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  {annotation.author}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {annotation.createdAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAnnotation(null)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>

                          <p className="text-sm text-gray-900 dark:text-white mb-3">
                            {annotation.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {annotation.type === 'note' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleAnnotationResolved(annotation.id)}
                                  className="h-6 px-2 text-xs"
                                >
                                  {annotation.resolved ? (
                                    <>
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Reopen
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Resolve
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>

                            {annotation.authorId === currentUser.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAnnotation(annotation.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* New Annotation Preview */}
              {newAnnotation && (
                <div
                  className="absolute border-2 border-blue-500 border-dashed"
                  style={{
                    left: `${newAnnotation.x}%`,
                    top: `${newAnnotation.y}%`,
                    width: newAnnotation.width ? `${newAnnotation.width}%` : '20px',
                    height: newAnnotation.height ? `${newAnnotation.height}%` : '20px',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Annotation Creation Modal */}
        <AnimatePresence>
          {isCreatingAnnotation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Add {newAnnotation?.type === 'highlight' ? 'Highlight' : 'Annotation'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {newAnnotation?.type === 'highlight' ? 'Note (optional)' : 'Content'}
                    </label>
                    <Textarea
                      value={annotationContent}
                      onChange={(e) => setAnnotationContent(e.target.value)}
                      placeholder={
                        newAnnotation?.type === 'highlight'
                          ? 'Add a note about this highlight...'
                          : 'Enter your annotation content...'
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <Button variant="outline" onClick={cancelAnnotation}>
                      Cancel
                    </Button>
                    <Button
                      onClick={saveAnnotation}
                      disabled={newAnnotation?.type !== 'highlight' && !annotationContent.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

export default DocumentViewer