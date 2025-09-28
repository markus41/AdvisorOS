'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Share2,
  MessageSquare,
  Highlighter,
  Square,
  ArrowUpRight,
  StickyNote,
  Palette,
  Eye,
  EyeOff,
  Users,
  Clock,
  AtSign,
  Save,
  X,
  Plus
} from 'lucide-react';
import { OCRDataDisplay } from './OCRDataDisplay';
import { CollaborationPresence } from './CollaborationPresence';
import { useToast } from '@/hooks/use-toast';
import { useCollaboration } from '@/lib/websocket/collaboration-socket';
import { formatDistanceToNow } from 'date-fns';

interface Annotation {
  id: string;
  type: 'highlight' | 'note' | 'rectangle' | 'arrow' | 'text';
  page: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  color: string;
  style?: any;
  isPrivate: boolean;
  createdBy: string;
  creator: {
    name: string;
    email: string;
  };
  createdAt: string;
  replies?: Annotation[];
}

interface Comment {
  id: string;
  content: string;
  isPrivate: boolean;
  mentions: string[];
  status: 'open' | 'resolved' | 'archived';
  createdBy: string;
  creator: {
    name: string;
    email: string;
  };
  createdAt: string;
  replies?: Comment[];
}

interface DocumentViewerProps {
  documentId: string;
  document: any;
  onUpdate?: () => void;
}

const ANNOTATION_COLORS = [
  '#ffff00', // Yellow
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#96ceb4', // Green
  '#feca57', // Orange
  '#ff9ff3', // Pink
  '#a8e6cf', // Light Green
];

const ANNOTATION_TYPES = [
  { value: 'highlight', label: 'Highlight', icon: Highlighter },
  { value: 'note', label: 'Note', icon: StickyNote },
  { value: 'rectangle', label: 'Rectangle', icon: Square },
  { value: 'arrow', label: 'Arrow', icon: ArrowUpRight },
  { value: 'text', label: 'Text', icon: MessageSquare },
];

export function DocumentViewer({ documentId, document, onUpdate }: DocumentViewerProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'fit' | 'width' | 'custom'>('fit');

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('highlight');
  const [selectedColor, setSelectedColor] = useState(ANNOTATION_COLORS[0]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);

  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false);
  const [annotationStart, setAnnotationStart] = useState<{ x: number; y: number } | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);

  useEffect(() => {
    fetchAnnotations();
    fetchComments();
    initializePDF();
  }, [documentId]);

  const initializePDF = async () => {
    // Initialize PDF viewer here
    // This would integrate with a PDF.js or similar library
    if (document.mimeType === 'application/pdf') {
      // PDF-specific initialization
      setTotalPages(document.pages || 1);
    } else {
      // Image file
      setTotalPages(1);
    }
  };

  const fetchAnnotations = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/annotations`);
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
      }
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
    setViewMode('custom');
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
    setViewMode('custom');
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFitToPage = () => {
    setZoom(100);
    setViewMode('fit');
  };

  const handleFitToWidth = () => {
    setZoom(150);
    setViewMode('width');
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isAnnotating) return;

    const rect = viewerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setAnnotationStart({ x, y });
    setIsCreatingAnnotation(true);
  }, [isAnnotating]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isCreatingAnnotation || !annotationStart) return;

    const rect = viewerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const annotation: Partial<Annotation> = {
      type: selectedTool as any,
      page: currentPage,
      coordinates: {
        x: Math.min(annotationStart.x, x),
        y: Math.min(annotationStart.y, y),
        width: Math.abs(x - annotationStart.x),
        height: Math.abs(y - annotationStart.y),
      },
      color: selectedColor,
      isPrivate: false,
    };

    setCurrentAnnotation(annotation);
  }, [isCreatingAnnotation, annotationStart, selectedTool, selectedColor, currentPage]);

  const handleMouseUp = useCallback(() => {
    if (!isCreatingAnnotation || !currentAnnotation) return;

    // Only create annotation if it has meaningful dimensions
    if (currentAnnotation.coordinates &&
        (currentAnnotation.coordinates.width > 5 || currentAnnotation.coordinates.height > 5)) {
      createAnnotation(currentAnnotation);
    }

    setIsCreatingAnnotation(false);
    setAnnotationStart(null);
    setCurrentAnnotation(null);
  }, [isCreatingAnnotation, currentAnnotation]);

  const createAnnotation = async (annotationData: Partial<Annotation>) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...annotationData,
          createdBy: session?.user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnnotations(prev => [...prev, data.annotation]);
        toast({
          title: 'Annotation Created',
          description: 'Your annotation has been saved.',
        });
      }
    } catch (error) {
      console.error('Failed to create annotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create annotation.',
        variant: 'destructive',
      });
    }
  };

  const updateAnnotation = async (annotationId: string, updates: Partial<Annotation>) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/annotations/${annotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setAnnotations(prev =>
          prev.map(ann => ann.id === annotationId ? { ...ann, ...updates } : ann)
        );
      }
    } catch (error) {
      console.error('Failed to update annotation:', error);
    }
  };

  const deleteAnnotation = async (annotationId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/annotations/${annotationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
        toast({
          title: 'Annotation Deleted',
          description: 'The annotation has been removed.',
        });
      }
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          mentions: extractMentions(newComment),
          isPrivate: false,
          createdBy: session?.user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        setIsAddingComment(false);
        toast({
          title: 'Comment Added',
          description: 'Your comment has been posted.',
        });
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment.',
        variant: 'destructive',
      });
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const renderAnnotation = (annotation: Annotation) => {
    if (annotation.page !== currentPage || !showAnnotations) return null;

    const style = {
      position: 'absolute' as const,
      left: `${annotation.coordinates.x}px`,
      top: `${annotation.coordinates.y}px`,
      width: `${annotation.coordinates.width}px`,
      height: `${annotation.coordinates.height}px`,
      backgroundColor: annotation.type === 'highlight' ? annotation.color : 'transparent',
      border: annotation.type !== 'highlight' ? `2px solid ${annotation.color}` : 'none',
      opacity: annotation.type === 'highlight' ? 0.3 : 1,
      cursor: 'pointer',
      pointerEvents: 'all' as const,
    };

    return (
      <div
        key={annotation.id}
        style={style}
        className={`annotation ${selectedAnnotation === annotation.id ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedAnnotation(annotation.id)}
      >
        {annotation.type === 'note' && (
          <StickyNote className="h-4 w-4 text-orange-500" />
        )}
        {annotation.content && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="w-full h-full" />
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <div className="font-medium">Annotation</div>
                <p className="text-sm">{annotation.content}</p>
                <div className="text-xs text-muted-foreground">
                  by {annotation.creator.name} • {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteAnnotation(annotation.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  };

  const renderCurrentAnnotation = () => {
    if (!isCreatingAnnotation || !currentAnnotation?.coordinates) return null;

    const style = {
      position: 'absolute' as const,
      left: `${currentAnnotation.coordinates.x}px`,
      top: `${currentAnnotation.coordinates.y}px`,
      width: `${currentAnnotation.coordinates.width}px`,
      height: `${currentAnnotation.coordinates.height}px`,
      backgroundColor: currentAnnotation.type === 'highlight' ? currentAnnotation.color : 'transparent',
      border: currentAnnotation.type !== 'highlight' ? `2px dashed ${currentAnnotation.color}` : 'none',
      opacity: 0.5,
      pointerEvents: 'none' as const,
    };

    return <div style={style} className="creating-annotation" />;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold truncate">{document.fileName}</h2>
              <Badge variant="outline">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center border rounded">
                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium">{zoom}%</span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={handleFitToPage}>
                Fit Page
              </Button>
              <Button variant="outline" size="sm" onClick={handleFitToWidth}>
                Fit Width
              </Button>
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <CollaborationPresence documentId={documentId} />
            </div>
          </div>

          {/* Annotation Toolbar */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant={isAnnotating ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsAnnotating(!isAnnotating)}
              >
                {isAnnotating ? 'Stop Annotating' : 'Start Annotating'}
              </Button>

              {isAnnotating && (
                <>
                  <Select value={selectedTool} onValueChange={setSelectedTool}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOTATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <div
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <Palette className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="grid grid-cols-4 gap-2">
                        {ANNOTATION_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`w-12 h-12 rounded border-2 ${
                              selectedColor === color ? 'border-gray-900' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              {showAnnotations ? (
                <Eye className="h-4 w-4 mr-2" />
              ) : (
                <EyeOff className="h-4 w-4 mr-2" />
              )}
              {showAnnotations ? 'Hide' : 'Show'} Annotations
            </Button>

            <Badge variant="secondary">
              {annotations.filter(a => a.page === currentPage).length} annotations on page
            </Badge>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100" ref={containerRef}>
          <div className="flex justify-center p-8">
            <div
              ref={viewerRef}
              className="relative bg-white shadow-lg"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                cursor: isAnnotating ? 'crosshair' : 'default',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Document Content */}
              {document.mimeType === 'application/pdf' ? (
                <div className="w-[8.5in] h-[11in] border border-gray-300 bg-white relative">
                  {/* PDF content would be rendered here via PDF.js */}
                  <div className="p-8 text-gray-600">
                    PDF Document - Page {currentPage}
                    <br />
                    <small>PDF rendering would be implemented with PDF.js</small>
                  </div>
                </div>
              ) : (
                <img
                  src={document.fileUrl}
                  alt={document.fileName}
                  className="max-w-full h-auto"
                  draggable={false}
                />
              )}

              {/* Render Annotations */}
              {annotations.map(renderAnnotation)}
              {renderCurrentAnnotation()}
            </div>
          </div>
        </div>

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div className="bg-white border-t p-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="w-20 text-center"
                  min="1"
                  max={totalPages}
                />
                <span className="text-sm text-muted-foreground">of {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-96 bg-white border-l flex flex-col">
        <Tabs defaultValue="ocr" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ocr">OCR</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
          </TabsList>

          <TabsContent value="ocr" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {document.extractedData ? (
                <OCRDataDisplay
                  documentId={documentId}
                  ocrResult={document.extractedData}
                  needsReview={document.needsReview}
                  onUpdate={onUpdate}
                />
              ) : (
                <Card className="m-4">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      OCR processing in progress...
                    </p>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-hidden">
            <div className="p-4 space-y-4 h-full flex flex-col">
              {/* Add Comment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Comments</h3>
                  <Button size="sm" onClick={() => setIsAddingComment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {isAddingComment && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment... Use @username to mention someone"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addComment}>
                        <Save className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsAddingComment(false);
                          setNewComment('');
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments List */}
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm">
                                {comment.creator.name}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {comment.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          {comment.mentions.length > 0 && (
                            <div className="flex items-center gap-1">
                              <AtSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {comment.mentions.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        No comments yet. Be the first to comment!
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h3 className="font-medium mb-4">Document Versions</h3>
                <div className="space-y-2">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            Version {document.version} (Current)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                          </div>
                        </div>
                        <Badge>Latest</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="related" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h3 className="font-medium mb-4">Related Documents</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No related documents found.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}