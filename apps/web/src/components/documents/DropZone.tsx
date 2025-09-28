'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedFileTypes?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
  'image/bmp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];

const FILE_TYPE_LABELS = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'image/tiff': 'TIFF',
  'image/bmp': 'BMP',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/csv': 'CSV'
};

export function DocumentDropZone({
  onDrop,
  maxFiles = 20,
  maxSize = 25 * 1024 * 1024, // 25MB
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  className
}: DropZoneProps) {
  const [rejectedFiles, setRejectedFiles] = useState<Array<{ file: File; error: string }>>([]);

  const handleDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    // Clear previous rejected files
    setRejectedFiles([]);

    // Handle rejected files
    if (fileRejections.length > 0) {
      const rejected = fileRejections.map(rejection => ({
        file: rejection.file,
        error: rejection.errors[0]?.message || 'File rejected'
      }));
      setRejectedFiles(rejected);
    }

    // Process accepted files
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles);
    }
  }, [onDrop]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop: handleDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize,
    disabled,
    multiple: true
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedTypesDisplay = (): string => {
    const labels = acceptedFileTypes.map(type =>
      FILE_TYPE_LABELS[type as keyof typeof FILE_TYPE_LABELS] || type.split('/')[1]?.toUpperCase()
    );
    return labels.join(', ');
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          {
            'border-blue-300 bg-blue-50 text-blue-600': isDragActive && isDragAccept,
            'border-red-300 bg-red-50 text-red-600': isDragActive && isDragReject,
            'border-gray-300 hover:border-gray-400': !isDragActive && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400': disabled
          }
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {isDragActive ? (
            isDragAccept ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-lg font-medium">Drop files here to upload</p>
              </>
            ) : (
              <>
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-medium">Some files are not supported</p>
              </>
            )
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {disabled ? 'Upload disabled' : 'Drag & drop files here, or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports: {getAcceptedTypesDisplay()}
                </p>
                <p className="text-xs text-gray-400">
                  Maximum {maxFiles} files, {formatFileSize(maxSize)} per file
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Type Examples */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center space-y-2 p-3 border rounded-lg bg-gray-50">
          <FileText className="h-8 w-8 text-red-500" />
          <span className="text-sm font-medium">PDF Documents</span>
          <span className="text-xs text-gray-500">Tax forms, contracts</span>
        </div>
        <div className="flex flex-col items-center space-y-2 p-3 border rounded-lg bg-gray-50">
          <Image className="h-8 w-8 text-blue-500" />
          <span className="text-sm font-medium">Images</span>
          <span className="text-xs text-gray-500">Receipts, photos</span>
        </div>
        <div className="flex flex-col items-center space-y-2 p-3 border rounded-lg bg-gray-50">
          <FileText className="h-8 w-8 text-green-500" />
          <span className="text-sm font-medium">Spreadsheets</span>
          <span className="text-xs text-gray-500">Financial data</span>
        </div>
      </div>

      {/* Rejected Files */}
      {rejectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-600">Rejected Files:</h4>
          {rejectedFiles.map((rejected, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 flex-1 truncate">
                {rejected.file.name}
              </span>
              <span className="text-xs text-red-600">
                {rejected.error}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}