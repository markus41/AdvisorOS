'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Image,
  FileSpreadsheet,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Lock,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DocumentCardProps {
  document: {
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
    createdAt: string;
    client: {
      businessName: string;
      primaryContactName: string;
    };
    uploader: {
      name: string;
      email: string;
    };
  };
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onShare?: (documentId: string) => void;
  viewMode?: 'grid' | 'list';
  showActions?: boolean;
}

const getFileIcon = (mimeType: string, className?: string) => {
  if (mimeType.startsWith('image/')) {
    return <Image className={cn('h-6 w-6', className)} />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className={cn('h-6 w-6 text-red-500', className)} />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
    return <FileSpreadsheet className={cn('h-6 w-6 text-green-500', className)} />;
  }
  return <FileText className={cn('h-6 w-6 text-blue-500', className)} />;
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

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'tax_return': 'bg-purple-100 text-purple-800',
    'financial_statement': 'bg-blue-100 text-blue-800',
    'invoice': 'bg-green-100 text-green-800',
    'receipt': 'bg-yellow-100 text-yellow-800',
    'bank_statement': 'bg-indigo-100 text-indigo-800',
    'w2': 'bg-red-100 text-red-800',
    '1099': 'bg-pink-100 text-pink-800',
    'general': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatCategoryDisplay = (category: string, subcategory?: string): string => {
  const categoryLabels: Record<string, string> = {
    'tax_return': 'Tax Return',
    'financial_statement': 'Financial Statement',
    'invoice': 'Invoice',
    'receipt': 'Receipt',
    'bank_statement': 'Bank Statement',
    'w2': 'W-2 Form',
    '1099': '1099 Form',
    'general': 'General'
  };

  const label = categoryLabels[category] || category;
  return subcategory ? `${label} - ${subcategory}` : label;
};

export function DocumentCard({
  document,
  onDownload,
  onDelete,
  onShare,
  viewMode = 'grid',
  showActions = true
}: DocumentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!onDownload) return;
    setIsLoading(true);
    try {
      await onDownload(document.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(document.id);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(document.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* File Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {document.thumbnailUrl ? (
                <img
                  src={document.thumbnailUrl}
                  alt={document.fileName}
                  className="w-10 h-10 object-cover rounded border"
                />
              ) : (
                getFileIcon(document.mimeType, 'h-10 w-10')
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/documents/${document.id}`}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {document.fileName}
                  </Link>
                  {document.isConfidential && (
                    <Lock className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{document.client.businessName}</span>
                  <span>•</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="flex-shrink-0">
              <Badge className={getCategoryColor(document.category)}>
                {formatCategoryDisplay(document.category, document.subcategory)}
              </Badge>
            </div>

            {/* OCR Status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {getOCRStatusIcon(document.ocrStatus, document.needsReview)}
              {document.ocrConfidence !== undefined && (
                <span className="text-xs text-gray-500">
                  {Math.round(document.ocrConfidence * 100)}%
                </span>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/documents/${document.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload} disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/documents/${document.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {document.thumbnailUrl ? (
              <img
                src={document.thumbnailUrl}
                alt={document.fileName}
                className="w-8 h-8 object-cover rounded border"
              />
            ) : (
              getFileIcon(document.mimeType)
            )}
            {document.isConfidential && (
              <Lock className="h-4 w-4 text-red-500" />
            )}
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/documents/${document.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload} disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/documents/${document.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* File Name */}
        <div>
          <Link
            href={`/documents/${document.id}`}
            className="text-sm font-medium hover:underline line-clamp-2"
          >
            {document.fileName}
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {document.client.businessName}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <Badge className={getCategoryColor(document.category)}>
            {formatCategoryDisplay(document.category, document.subcategory)}
          </Badge>

          {document.year && (
            <div className="text-xs text-gray-500">
              {document.year}{document.quarter && ` Q${document.quarter}`}
            </div>
          )}

          <div className="text-xs text-gray-500">
            {formatFileSize(document.fileSize)} • {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
          </div>
        </div>

        {/* OCR Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getOCRStatusIcon(document.ocrStatus, document.needsReview)}
            <span className="text-xs text-gray-500">
              {document.ocrStatus === 'completed' && !document.needsReview && 'Processed'}
              {document.ocrStatus === 'manual_review' || document.needsReview ? 'Needs Review' : ''}
              {document.ocrStatus === 'processing' && 'Processing'}
              {document.ocrStatus === 'failed' && 'Failed'}
              {document.ocrStatus === 'pending' && 'Pending'}
            </span>
          </div>

          {document.ocrConfidence !== undefined && (
            <div className="flex items-center gap-1">
              <Progress
                value={document.ocrConfidence * 100}
                className="w-16 h-1"
              />
              <span className="text-xs text-gray-500">
                {Math.round(document.ocrConfidence * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {document.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {document.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}