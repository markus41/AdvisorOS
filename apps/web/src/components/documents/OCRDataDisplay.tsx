'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Copy,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OCRDataDisplayProps {
  documentId: string;
  ocrResult: {
    documentType: string;
    confidence: number;
    extractedData: Record<string, any>;
    rawText: string;
    fields: Array<{
      name: string;
      value: any;
      confidence: number;
      boundingBox?: number[];
    }>;
    metadata: {
      modelId: string;
      apiVersion: string;
      processedAt: string;
      processingTime: number;
    };
  };
  needsReview: boolean;
  onUpdate?: (updatedData: any) => void;
  isEditable?: boolean;
}

interface EditableField {
  name: string;
  value: any;
  confidence: number;
  isEditing: boolean;
  originalValue: any;
}

export function OCRDataDisplay({
  documentId,
  ocrResult,
  needsReview,
  onUpdate,
  isEditable = true
}: OCRDataDisplayProps) {
  const [editableFields, setEditableFields] = useState<EditableField[]>(
    ocrResult.fields.map(field => ({
      ...field,
      isEditing: false,
      originalValue: field.value
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [overallConfidence, setOverallConfidence] = useState(ocrResult.confidence);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();

  const startEditing = (index: number) => {
    setEditableFields(prev => prev.map((field, i) =>
      i === index ? { ...field, isEditing: true } : field
    ));
  };

  const cancelEditing = (index: number) => {
    setEditableFields(prev => prev.map((field, i) =>
      i === index ? { ...field, isEditing: false, value: field.originalValue } : field
    ));
  };

  const saveField = (index: number) => {
    setEditableFields(prev => prev.map((field, i) =>
      i === index ? { ...field, isEditing: false, originalValue: field.value } : field
    ));
  };

  const updateFieldValue = (index: number, newValue: any) => {
    setEditableFields(prev => prev.map((field, i) =>
      i === index ? { ...field, value: newValue } : field
    ));
  };

  const updateFieldConfidence = (index: number, newConfidence: number) => {
    setEditableFields(prev => prev.map((field, i) =>
      i === index ? { ...field, confidence: newConfidence } : field
    ));
  };

  const submitReview = async () => {
    setIsSubmitting(true);

    try {
      // Prepare updated extracted data
      const updatedExtractedData = editableFields.reduce((acc, field) => {
        acc[field.name] = {
          value: field.value,
          confidence: field.confidence,
          type: typeof field.value
        };
        return acc;
      }, {} as Record<string, any>);

      // Calculate new overall confidence
      const avgConfidence = editableFields.reduce((sum, field) => sum + field.confidence, 0) / editableFields.length;

      const reviewData = {
        extractedData: {
          ...ocrResult,
          extractedData: updatedExtractedData,
          confidence: overallConfidence
        },
        confidence: overallConfidence,
        needsReview: overallConfidence < 0.8 || editableFields.some(f => f.confidence < 0.7),
        comments: reviewNotes
      };

      const response = await fetch(`/api/documents/${documentId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast({
        title: 'Review Submitted',
        description: 'OCR data has been reviewed and updated successfully.'
      });

      if (onUpdate) {
        onUpdate(reviewData);
      }

    } catch (error) {
      toast({
        title: 'Review Failed',
        description: error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied',
        description: 'Text copied to clipboard'
      });
    });
  };

  const exportData = () => {
    const exportObject = {
      documentId,
      documentType: ocrResult.documentType,
      confidence: overallConfidence,
      extractedFields: editableFields.map(field => ({
        name: field.name,
        value: field.value,
        confidence: field.confidence
      })),
      metadata: ocrResult.metadata,
      reviewNotes,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-data-${documentId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                OCR Results
                {needsReview ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Document Type: {ocrResult.documentType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {isEditable && (
                <Button
                  onClick={submitReview}
                  disabled={isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Submit Review
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Confidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Overall Confidence</Label>
                <Badge variant={getConfidenceBadgeVariant(overallConfidence)}>
                  {Math.round(overallConfidence * 100)}%
                </Badge>
              </div>
              <Progress value={overallConfidence * 100} className="h-2" />
              {isEditable && (
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={overallConfidence}
                  onChange={(e) => setOverallConfidence(parseFloat(e.target.value))}
                  className="mt-2"
                />
              )}
            </div>

            {/* Processing Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Model:</span> {ocrResult.metadata.modelId}
              </div>
              <div>
                <span className="font-medium">Processing Time:</span> {ocrResult.metadata.processingTime}ms
              </div>
              <div>
                <span className="font-medium">API Version:</span> {ocrResult.metadata.apiVersion}
              </div>
              <div>
                <span className="font-medium">Processed:</span>{' '}
                {new Date(ocrResult.metadata.processedAt).toLocaleString()}
              </div>
            </div>

            {needsReview && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-orange-800">Manual Review Required</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Some extracted data has low confidence. Please review and correct the fields below.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extracted Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editableFields.map((field, index) => (
              <div key={field.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">{field.name}</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={getConfidenceBadgeVariant(field.confidence)}>
                      {Math.round(field.confidence * 100)}%
                    </Badge>
                    {isEditable && !field.isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {field.isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Value</Label>
                      <Textarea
                        value={field.value}
                        onChange={(e) => updateFieldValue(index, e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Confidence</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={field.confidence}
                          onChange={(e) => updateFieldConfidence(index, parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm w-12">
                          {Math.round(field.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveField(index)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelEditing(index)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-50 rounded border min-h-[3rem] flex items-center justify-between">
                      <span className="text-sm">{field.value || 'No value extracted'}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(field.value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Progress value={field.confidence * 100} className="h-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw Text */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Raw Extracted Text</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
            >
              {showRawText ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showRawText ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showRawText && (
          <CardContent>
            <div className="relative">
              <Textarea
                value={ocrResult.rawText}
                readOnly
                rows={10}
                className="font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(ocrResult.rawText)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Review Notes */}
      {isEditable && (
        <Card>
          <CardHeader>
            <CardTitle>Review Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add notes about the review process, corrections made, or issues encountered..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}