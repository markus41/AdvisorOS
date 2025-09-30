'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Zap,
  Search,
  Shield,
  Download,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface ProcessingStage {
  id: string;
  stage: 'classification' | 'extraction' | 'validation' | 'compliance' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'needs_review' | 'failed';
  title: string;
  confidence: number; // 0-1
  duration: number; // milliseconds
  details: string;
  startTime?: Date;
  endTime?: Date;
}

export interface ExtractedField {
  name: string;
  value: any;
  confidence: number;
  boundingBox?: [number, number, number, number];
  needsReview: boolean;
  alternatives?: Array<{ value: any; confidence: number }>;
  historicalContext?: {
    previousValue?: any;
    typicalRange?: [number, number];
    anomalyScore?: number;
  };
}

export interface DocumentProcessingPipelineProps {
  documentId: string;
  documentUrl: string;
  documentType?: string;
  onComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function DocumentProcessingPipeline({
  documentId,
  documentUrl,
  documentType,
  onComplete,
  onError,
}: DocumentProcessingPipelineProps) {
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [currentStage, setCurrentStage] = useState<ProcessingStage | null>(null);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedField, setSelectedField] = useState<ExtractedField | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    startProcessing();
  }, [documentId]);

  const startProcessing = async () => {
    setIsProcessing(true);

    const initialStages: ProcessingStage[] = [
      {
        id: 'classification',
        stage: 'classification',
        status: 'pending',
        title: 'Document Classification',
        confidence: 0,
        duration: 0,
        details: 'Analyzing document structure...',
      },
      {
        id: 'extraction',
        stage: 'extraction',
        status: 'pending',
        title: 'OCR Text Extraction',
        confidence: 0,
        duration: 0,
        details: 'Extracting text and data...',
      },
      {
        id: 'validation',
        stage: 'validation',
        status: 'pending',
        title: 'Data Validation',
        confidence: 0,
        duration: 0,
        details: 'Validating extracted data...',
      },
      {
        id: 'compliance',
        stage: 'compliance',
        status: 'pending',
        title: 'Compliance Check',
        confidence: 0,
        duration: 0,
        details: 'Checking regulatory requirements...',
      },
      {
        id: 'export',
        stage: 'export',
        status: 'pending',
        title: 'Data Export',
        confidence: 0,
        duration: 0,
        details: 'Preparing for export...',
      },
    ];

    setStages(initialStages);

    try {
      // Stage 1: Classification
      await processStage('classification', 300, 0.97, 'Detected: W-2 Wage and Tax Statement');

      // Stage 2: Extraction
      await processStage('extraction', 1200, 0.94, 'Extracted 24 fields successfully');

      // Simulate extracted fields
      const mockFields: ExtractedField[] = [
        {
          name: 'Employer Name',
          value: 'Acme Corporation',
          confidence: 0.97,
          needsReview: false,
        },
        {
          name: 'Employer EIN',
          value: '12-3456789',
          confidence: 0.82,
          needsReview: true,
        },
        {
          name: 'Employee Name',
          value: 'John A. Smith',
          confidence: 0.99,
          needsReview: false,
        },
        {
          name: 'Employee SSN',
          value: '***-**-1234',
          confidence: 0.95,
          needsReview: false,
        },
        {
          name: 'Box 1 (Wages)',
          value: '$75,000.00',
          confidence: 0.67,
          needsReview: true,
          historicalContext: {
            previousValue: '$71,000',
            anomalyScore: 0.3,
          },
        },
        {
          name: 'Box 2 (Federal Tax)',
          value: '$12,500.00',
          confidence: 0.93,
          needsReview: false,
        },
      ];

      setExtractedFields(mockFields);

      // Stage 3: Validation
      const fieldsNeedingReview = mockFields.filter((f) => f.needsReview).length;
      await processStage(
        'validation',
        500,
        0.67,
        `${fieldsNeedingReview} fields flagged for review`,
        'needs_review'
      );

      // Calculate overall confidence
      const avgConfidence =
        mockFields.reduce((sum, field) => sum + field.confidence, 0) / mockFields.length;
      setOverallConfidence(avgConfidence);

      // Stage 4: Compliance (pending validation)
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === 'compliance'
            ? { ...stage, status: 'pending', details: 'Awaiting validation approval' }
            : stage
        )
      );

      // Stage 5: Export (pending validation)
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === 'export'
            ? { ...stage, status: 'pending', details: 'Ready when validation complete' }
            : stage
        )
      );
    } catch (error) {
      console.error('Processing error:', error);
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processStage = async (
    stageId: string,
    duration: number,
    confidence: number,
    details: string,
    finalStatus: ProcessingStage['status'] = 'completed'
  ) => {
    // Set to processing
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              status: 'processing',
              startTime: new Date(),
            }
          : stage
      )
    );

    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      setCurrentStage(stage);
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Set to completed
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              status: finalStatus,
              confidence,
              duration,
              details,
              endTime: new Date(),
            }
          : stage
      )
    );
  };

  const getStageIcon = (stage: ProcessingStage) => {
    switch (stage.stage) {
      case 'classification':
        return FileText;
      case 'extraction':
        return Search;
      case 'validation':
        return AlertCircle;
      case 'compliance':
        return Shield;
      case 'export':
        return Download;
      default:
        return FileText;
    }
  };

  const getStatusIcon = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'needs_review':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Document Processing</h1>
            <p className="text-sm text-muted-foreground">Document ID: {documentId}</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Main Layout - Mobile First */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[8.5/11] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center p-6">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-muted-foreground">Document Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">W-2 Form - John Smith.pdf</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Zoom In
                  </Button>
                  <Button variant="outline" size="sm">
                    Rotate
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">Page 1 of 1</span>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Processing Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                AI Processing Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stages.map((stage, index) => {
                  const StageIcon = getStageIcon(stage);
                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">{getStatusIcon(stage.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{stage.title}</span>
                            {stage.status === 'completed' && (
                              <span className="text-xs text-muted-foreground">
                                {(stage.duration / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>

                          {stage.status !== 'pending' && (
                            <>
                              <Progress
                                value={stage.confidence * 100}
                                className="h-1.5 mb-2"
                              />
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">{stage.details}</p>
                                {stage.confidence > 0 && (
                                  <Badge
                                    variant={
                                      stage.confidence >= 0.8
                                        ? 'default'
                                        : stage.confidence >= 0.6
                                        ? 'secondary'
                                        : 'destructive'
                                    }
                                    className="text-xs"
                                  >
                                    {Math.round(stage.confidence * 100)}%
                                  </Badge>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {index < stages.length - 1 && <Separator className="my-4" />}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extracted Data - Full Width on Mobile */}
        {extractedFields.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-base">Extracted Data</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Overall Confidence: {Math.round(overallConfidence * 100)}%
                  </Badge>
                  <Button size="sm">Approve All</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile: Stack fields vertically */}
              <div className="space-y-4 md:hidden">
                {extractedFields.map((field) => (
                  <div
                    key={field.name}
                    className={cn(
                      'p-4 rounded-lg border',
                      field.needsReview
                        ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20'
                        : 'border-gray-200 dark:border-gray-800'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium">{field.name}</span>
                      <Badge
                        variant={field.confidence >= 0.8 ? 'default' : field.confidence >= 0.6 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {Math.round(field.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{field.value}</p>
                    {field.needsReview && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedField(field)}
                      >
                        Review
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-sm font-medium p-3">Field Name</th>
                      <th className="text-left text-sm font-medium p-3">Extracted Value</th>
                      <th className="text-center text-sm font-medium p-3">Confidence</th>
                      <th className="text-center text-sm font-medium p-3">Status</th>
                      <th className="text-right text-sm font-medium p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedFields.map((field) => (
                      <tr key={field.name} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3 text-sm">{field.name}</td>
                        <td className="p-3 text-sm font-medium">{field.value}</td>
                        <td className="p-3 text-center">
                          <Progress value={field.confidence * 100} className="w-20 mx-auto h-2" />
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={field.needsReview ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {field.needsReview ? 'Review' : 'Verified'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {field.needsReview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedField(field)}
                            >
                              Review
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Field Detail Modal */}
        <AnimatePresence>
          {selectedField && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setSelectedField(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Field Review: {selectedField.name}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedField(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Extracted Value</label>
                      <p className="text-lg font-semibold mt-1">{selectedField.value}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Confidence Score</label>
                      <div className="flex items-center gap-3 mt-2">
                        <Progress value={selectedField.confidence * 100} className="flex-1" />
                        <span className={cn('text-sm font-medium', getConfidenceColor(selectedField.confidence))}>
                          {Math.round(selectedField.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {selectedField.historicalContext && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Historical Context
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Previous value: {selectedField.historicalContext.previousValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Review Notes</label>
                      <Textarea
                        placeholder="Add any notes about this field..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Correct Value
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}