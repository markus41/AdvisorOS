import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Plus, X, Edit3, Check, Trash2 } from 'lucide-react'
import { cn } from './utils/cn'
import { Button } from './Button'
import { Textarea } from './Textarea'
import { Badge } from './Badge'

export interface Annotation {
  id: string
  x: number
  y: number
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: Date
  updatedAt?: Date
  resolved?: boolean
  replies?: AnnotationReply[]
}

export interface AnnotationReply {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: Date
}

interface DocumentAnnotationsProps {
  annotations: Annotation[]
  onAddAnnotation: (x: number, y: number, content: string) => void
  onUpdateAnnotation: (id: string, content: string) => void
  onDeleteAnnotation: (id: string) => void
  onResolveAnnotation: (id: string) => void
  onAddReply: (annotationId: string, content: string) => void
  currentUserId: string
  readonly?: boolean
  className?: string
}

export const DocumentAnnotations: React.FC<DocumentAnnotationsProps> = ({
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onResolveAnnotation,
  onAddReply,
  currentUserId,
  readonly = false,
  className,
}) => {
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null)
  const [newAnnotation, setNewAnnotation] = useState<{
    x: number
    y: number
    content: string
  } | null>(null)
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDocumentClick = (e: React.MouseEvent) => {
    if (readonly) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setNewAnnotation({ x, y, content: '' })
    setActiveAnnotation(null)
  }

  const handleSaveNewAnnotation = () => {
    if (newAnnotation && newAnnotation.content.trim()) {
      onAddAnnotation(newAnnotation.x, newAnnotation.y, newAnnotation.content)
      setNewAnnotation(null)
    }
  }

  const handleStartEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation.id)
    setEditContent(annotation.content)
  }

  const handleSaveEdit = () => {
    if (editingAnnotation && editContent.trim()) {
      onUpdateAnnotation(editingAnnotation, editContent)
      setEditingAnnotation(null)
      setEditContent('')
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full cursor-crosshair', className)}
      onClick={handleDocumentClick}
    >
      {/* Document content area */}
      <div className="w-full h-full">
        {/* Your document content goes here */}
      </div>

      {/* Annotations */}
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute z-10"
          style={{
            left: `${annotation.x}%`,
            top: `${annotation.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Annotation marker */}
          <button
            className={cn(
              'w-6 h-6 rounded-full border-2 bg-background shadow-md hover:shadow-lg transition-all cursor-pointer',
              annotation.resolved
                ? 'border-green-500 bg-green-50'
                : 'border-blue-500 bg-blue-50',
              activeAnnotation === annotation.id && 'ring-2 ring-blue-300'
            )}
            onClick={(e) => {
              e.stopPropagation()
              setActiveAnnotation(
                activeAnnotation === annotation.id ? null : annotation.id
              )
            }}
          >
            <MessageSquare className="w-3 h-3 mx-auto text-blue-600" />
          </button>

          {/* Annotation popup */}
          {activeAnnotation === annotation.id && (
            <div
              className="absolute top-8 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                      {annotation.author.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{annotation.author.name}</p>
                      <p className="text-xs text-gray-500">
                        {annotation.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {annotation.resolved && (
                      <Badge variant="success" className="text-xs">
                        Resolved
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveAnnotation(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Annotation content */}
                {editingAnnotation === annotation.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingAnnotation(null)
                          setEditContent('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 mb-3">
                      {annotation.content}
                    </p>

                    {/* Action buttons */}
                    {!readonly && annotation.author.id === currentUserId && (
                      <div className="flex space-x-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEdit(annotation)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteAnnotation(annotation.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                        {!annotation.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onResolveAnnotation(annotation.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Replies */}
                    {annotation.replies && annotation.replies.length > 0 && (
                      <div className="border-t pt-3 space-y-2">
                        {annotation.replies.map((reply) => (
                          <div key={reply.id} className="text-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{reply.author.name}</span>
                              <span className="text-gray-500 text-xs">
                                {reply.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 ml-4">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* New annotation form */}
      {newAnnotation && (
        <div
          className="absolute z-20"
          style={{
            left: `${newAnnotation.x}%`,
            top: `${newAnnotation.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <h3 className="text-sm font-medium mb-3">Add annotation</h3>
            <Textarea
              placeholder="Enter your comment..."
              value={newAnnotation.content}
              onChange={(e) =>
                setNewAnnotation({ ...newAnnotation, content: e.target.value })
              }
              className="mb-3 min-h-[80px]"
              autoFocus
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSaveNewAnnotation}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewAnnotation(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}