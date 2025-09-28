'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, X, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DocumentDropZone } from '@/components/documents/DropZone';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const uploadSchema = z.object({
  clientId: z.string().min(1, 'Client selection is required'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  year: z.number().int().min(1900).max(2050).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  description: z.string().optional(),
  isConfidential: z.boolean().optional(),
  autoCategorizationEnabled: z.boolean().optional(),
  autoOCREnabled: z.boolean().optional()
});

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  documentId?: string;
}

interface Client {
  id: string;
  businessName: string;
  primaryContactName: string;
}

const DOCUMENT_CATEGORIES = [
  { value: 'tax_return', label: 'Tax Return' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'w2', label: 'W-2 Form' },
  { value: '1099', label: '1099 Form' },
  { value: 'general', label: 'General Document' }
];

const QUARTERS = [
  { value: 1, label: 'Q1 (Jan-Mar)' },
  { value: 2, label: 'Q2 (Apr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dec)' }
];

export default function DocumentUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    category: '',
    subcategory: '',
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
    description: '',
    tags: [] as string[],
    isConfidential: false,
    autoCategorizationEnabled: true,
    autoOCREnabled: true
  });
  const [tagInput, setTagInput] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');

  // Load clients on component mount
  useState(() => {
    if (session?.user) {
      fetchClients();
    }
  });

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // If more than one file, switch to bulk mode
    if (acceptedFiles.length > 1 || files.length > 0) {
      setUploadMode('bulk');
    }
  }, [files.length]);

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const file = newFiles[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const uploadSingleFile = async (uploadedFile: UploadedFile, index: number): Promise<void> => {
    const formDataToSend = new FormData();
    formDataToSend.append('file', uploadedFile.file);
    formDataToSend.append('clientId', formData.clientId);

    if (formData.category) formDataToSend.append('category', formData.category);
    if (formData.subcategory) formDataToSend.append('subcategory', formData.subcategory);
    if (formData.year) formDataToSend.append('year', formData.year.toString());
    if (formData.quarter) formDataToSend.append('quarter', formData.quarter.toString());
    if (formData.description) formDataToSend.append('description', formData.description);
    if (formData.tags.length > 0) formDataToSend.append('tags', JSON.stringify(formData.tags));

    formDataToSend.append('isConfidential', formData.isConfidential.toString());
    formDataToSend.append('autoCategorizationEnabled', formData.autoCategorizationEnabled.toString());
    formDataToSend.append('autoOCREnabled', formData.autoOCREnabled.toString());

    try {
      // Update status to uploading
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], status: 'uploading' };
        return newFiles;
      });

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (response.ok) {
        // Update status to completed
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[index] = {
            ...newFiles[index],
            status: 'completed',
            progress: 100,
            documentId: result.document.id
          };
          return newFiles;
        });

        toast({
          title: 'Upload Successful',
          description: `${uploadedFile.file.name} has been uploaded successfully.`
        });
      } else {
        // Update status to error
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[index] = {
            ...newFiles[index],
            status: 'error',
            error: result.error || 'Upload failed'
          };
          return newFiles;
        });

        toast({
          title: 'Upload Failed',
          description: result.error || 'Failed to upload file',
          variant: 'destructive'
        });
      }
    } catch (error) {
      // Update status to error
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = {
          ...newFiles[index],
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        };
        return newFiles;
      });

      toast({
        title: 'Upload Failed',
        description: 'Network error occurred during upload',
        variant: 'destructive'
      });
    }
  };

  const uploadBulkFiles = async (): Promise<void> => {
    const formDataToSend = new FormData();

    // Add files
    files.forEach((uploadedFile, index) => {
      formDataToSend.append(`files[${index}]`, uploadedFile.file);
    });

    // Add metadata
    formDataToSend.append('clientId', formData.clientId);
    if (formData.category) formDataToSend.append('defaultCategory', formData.category);
    formDataToSend.append('autoCategorizationEnabled', formData.autoCategorizationEnabled.toString());
    formDataToSend.append('autoOCREnabled', formData.autoOCREnabled.toString());

    try {
      // Update all files to uploading status
      setFiles(prev => prev.map(file => ({ ...file, status: 'uploading' as const })));

      const response = await fetch('/api/documents/bulk-upload', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (response.ok) {
        // Update file statuses based on results
        setFiles(prev => prev.map((file, index) => {
          const successDoc = result.documents.find((doc: any) => doc.fileName === file.file.name);
          const errorDoc = result.errors.find((err: any) => err.fileName === file.file.name);

          if (successDoc) {
            return {
              ...file,
              status: 'completed' as const,
              progress: 100,
              documentId: successDoc.id
            };
          } else if (errorDoc) {
            return {
              ...file,
              status: 'error' as const,
              error: errorDoc.error
            };
          } else {
            return { ...file, status: 'completed' as const, progress: 100 };
          }
        }));

        toast({
          title: 'Bulk Upload Completed',
          description: `${result.summary.successful} of ${result.summary.total} files uploaded successfully.`
        });
      } else {
        // Update all files to error status
        setFiles(prev => prev.map(file => ({
          ...file,
          status: 'error' as const,
          error: result.error || 'Bulk upload failed'
        })));

        toast({
          title: 'Bulk Upload Failed',
          description: result.error || 'Failed to upload files',
          variant: 'destructive'
        });
      }
    } catch (error) {
      // Update all files to error status
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed'
      })));

      toast({
        title: 'Bulk Upload Failed',
        description: 'Network error occurred during upload',
        variant: 'destructive'
      });
    }
  };

  const handleUpload = async () => {
    try {
      // Validate form data
      uploadSchema.parse(formData);

      if (files.length === 0) {
        toast({
          title: 'No Files Selected',
          description: 'Please select files to upload.',
          variant: 'destructive'
        });
        return;
      }

      setIsUploading(true);

      if (uploadMode === 'bulk') {
        await uploadBulkFiles();
      } else {
        // Upload files sequentially
        for (let i = 0; i < files.length; i++) {
          await uploadSingleFile(files[i], i);
        }
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Upload Error',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive'
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Upload className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload Documents</h1>
          <p className="text-muted-foreground">
            Upload and organize your client documents with automatic categorization and OCR processing.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/documents')}>
          View All Documents
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Files</CardTitle>
              <CardDescription>
                Drag and drop files or click to browse. Supports PDF, images, and office documents up to 25MB each.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentDropZone onDrop={onDrop} />

              {files.length > 1 && (
                <div className="mt-4 flex items-center gap-2">
                  <Label>Upload Mode:</Label>
                  <Select value={uploadMode} onValueChange={(value: 'single' | 'bulk') => setUploadMode(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Individual</SelectItem>
                      <SelectItem value="bulk">Bulk Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((uploadedFile, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        {getFileIcon(uploadedFile.file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {uploadedFile.status === 'uploading' && (
                          <Progress value={uploadedFile.progress} className="w-20" />
                        )}
                        {getStatusIcon(uploadedFile.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploadedFile.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Metadata Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>
                Provide metadata for the uploaded documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect or select category" />
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

              {/* Year and Quarter */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    min="1900"
                    max="2050"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <Select value={formData.quarter.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, quarter: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUARTERS.map((quarter) => (
                        <SelectItem key={quarter.value} value={quarter.value.toString()}>
                          {quarter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confidential"
                    checked={formData.isConfidential}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isConfidential: !!checked }))}
                  />
                  <Label htmlFor="confidential" className="text-sm">
                    Mark as confidential
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-categorization"
                    checked={formData.autoCategorizationEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoCategorizationEnabled: !!checked }))}
                  />
                  <Label htmlFor="auto-categorization" className="text-sm">
                    Enable auto-categorization
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-ocr"
                    checked={formData.autoOCREnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoOCREnabled: !!checked }))}
                  />
                  <Label htmlFor="auto-ocr" className="text-sm">
                    Enable OCR processing
                  </Label>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || !formData.clientId || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
              </Button>
            </CardContent>
          </Card>

          {/* Upload Status */}
          {files.some(f => f.status === 'completed') && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Files uploaded successfully! OCR processing will begin automatically.
              </AlertDescription>
            </Alert>
          )}

          {files.some(f => f.status === 'error') && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some files failed to upload. Please check the errors and try again.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}