'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Image,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Lock,
  User,
  Calendar,
  FileType,
  Hash,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DocumentPreviewProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (documentId: string) => void;
}

interface DocumentData {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  category: string;
  subcategory?: string;
  year?: number;
  quarter?: number;
  tags: string[];
  description?: string;
  thumbnailUrl?: string;
  isConfidential: boolean;
  ocrStatus: string;
  ocrConfidence?: number;
  needsReview: boolean;
  extractedData?: any;
  createdAt: string;
  updatedAt: string;
  client: {
    businessName: string;
    primaryContactName: string;
  };
  uploader: {
    name: string;
    email: string;
  };
}

const getFileIcon = (mimeType: string, className?: string) => {
  if (mimeType.startsWith('image/')) {
    return <Image className={className} />;
  }
  return <FileText className={className} />;
};

const getOCRStatusIcon = (status: string, needsReview: boolean) => {
  if (status === 'completed' && !needsReview) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (status === 'manual_review' || needsReview) {
    return <AlertCircle className="h-4 w-4 text-orange-500" />;
  }
  if (status === 'processing') {
    return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
  }
  if (status === 'failed') {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  return <Clock className="h-4 w-4 text-gray-400" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function DocumentPreview({
  documentId,
  isOpen,
  onClose,
  onDownload
}: DocumentPreviewProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument();
    }
  }, [isOpen, documentId]);

  const fetchDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      setDocument(data.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (onDownload && document) {
      onDownload(document.id);
    }
  };

  const renderOCRData = () => {
    if (!document?.extractedData || document.ocrStatus !== 'completed') {
      return null;
    }

    const data = document.extractedData;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Extracted Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.documentType && (
            <div>
              <span className="text-xs font-medium text-gray-500">Document Type:</span>
              <p className="text-sm">{data.documentType}</p>
            </div>
          )}

          {data.extractedData && Object.keys(data.extractedData).length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-500">Key Fields:</span>
              <div className="mt-1 space-y-1">
                {Object.entries(data.extractedData).slice(0, 5).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">
                      {typeof value === 'object' ? value?.value || 'N/A' : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.confidence && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Confidence:</span>
              <Progress value={data.confidence * 100} className="flex-1 h-2" />
              <span className="text-xs">{Math.round(data.confidence * 100)}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {document && getFileIcon(document.mimeType, 'h-5 w-5')}
            Document Preview
            {document?.isConfidential && (
              <Lock className="h-4 w-4 text-red-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            View document details and extracted information.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            Loading document...
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        )}

        {document && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Document Info */}
            <div className="space-y-4">
              {/* File Preview */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed">
                    {document.thumbnailUrl ? (
                      <img
                        src={document.thumbnailUrl}
                        alt={document.fileName}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        {getFileIcon(document.mimeType, 'h-16 w-16 text-gray-400')}
                        <p className="mt-2 text-sm text-gray-500">
                          {document.fileType.toUpperCase()} Document
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full
                </Button>
              </div>

              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      File Name:
                    </span>
                    <p className="text-sm break-all">{document.fileName}</p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <FileType className="h-3 w-3" />
                      Type & Size:
                    </span>
                    <p className="text-sm">
                      {document.fileType.toUpperCase()} • {formatFileSize(document.fileSize)}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Client:
                    </span>
                    <p className="text-sm">{document.client.businessName}</p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Uploaded:
                    </span>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                      {' by ' + document.uploader.name}
                    </p>
                  </div>

                  {document.description && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Description:</span>
                      <p className="text-sm">{document.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Metadata & OCR */}
            <div className="space-y-4">
              {/* Category & Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Classification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Category:</span>
                    <div className="mt-1">
                      <Badge>
                        {document.category}
                        {document.subcategory && ` - ${document.subcategory}`}
                      </Badge>
                    </div>
                  </div>

                  {(document.year || document.quarter) && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Period:</span>
                      <p className="text-sm">
                        {document.year}
                        {document.quarter && ` Q${document.quarter}`}
                      </p>
                    </div>
                  )}

                  {document.tags.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Tags:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {document.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* OCR Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">OCR Processing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getOCRStatusIcon(document.ocrStatus, document.needsReview)}
                      <span className="text-sm">
                        {document.ocrStatus === 'completed' && !document.needsReview && 'Completed'}
                        {document.ocrStatus === 'manual_review' || document.needsReview ? 'Needs Review' : ''}
                        {document.ocrStatus === 'processing' && 'Processing'}
                        {document.ocrStatus === 'failed' && 'Failed'}
                        {document.ocrStatus === 'pending' && 'Pending'}
                      </span>
                    </div>

                    {document.ocrConfidence !== undefined && (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={document.ocrConfidence * 100}
                          className="w-20 h-2"
                        />
                        <span className="text-xs">
                          {Math.round(document.ocrConfidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {document.needsReview && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-800">
                          Manual Review Required
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Low confidence in extracted data. Please review and correct if needed.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Extracted Data */}
              {renderOCRData()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}