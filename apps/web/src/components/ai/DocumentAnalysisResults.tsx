'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Copy,
  FileImage,
  Table,
  Key,
  Search,
  Archive,
  Flag,
  Zap
} from 'lucide-react';

interface OCRResult {
  text: string;
  confidence: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
    tables?: Array<{
      rows: string[][];
      confidence: number;
    }>;
    keyValuePairs?: Array<{
      key: string;
      value: string;
      confidence: number;
    }>;
  }>;
  tables: Array<{
    pageNumber: number;
    rows: string[][];
    confidence: number;
  }>;
  keyValuePairs: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
}

interface DocumentCategory {
  category: string;
  confidence: number;
  subcategory?: string;
  description: string;
  extractedData: Record<string, any>;
}

interface DocumentAnomaly {
  type: 'format' | 'data' | 'calculation' | 'compliance' | 'fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
  confidence: number;
}

interface DocumentAnalysisResult {
  id: string;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    organizationId: string;
    uploadedBy: string;
  };
  ocrResult: OCRResult;
  category: DocumentCategory;
  extractedData: Record<string, any>;
  anomalies: DocumentAnomaly[];
  duplicates: Array<{
    documentId: string;
    similarity: number;
    confidence: number;
  }>;
  filingsSuggestions: Array<{
    category: string;
    subcategory?: string;
    confidence: number;
    reasoning: string;
  }>;
  processingTime: number;
  costInfo: {
    ocrCost: number;
    aiCost: number;
    totalCost: number;
  };
}

interface DocumentAnalysisResultsProps {
  result: DocumentAnalysisResult;
  onExport?: (format: 'json' | 'pdf' | 'csv') => void;
  onFileDocument?: (category: string, subcategory?: string) => void;
  onViewOriginal?: () => void;
  className?: string;
}

export function DocumentAnalysisResults({
  result,
  onExport,
  onFileDocument,
  onViewOriginal,
  className
}: DocumentAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedPage, setSelectedPage] = useState(1);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'fraud': return <Flag className="h-4 w-4" />;
      case 'compliance': return <AlertTriangle className="h-4 w-4" />;
      case 'calculation': return <DollarSign className="h-4 w-4" />;
      case 'data': return <Search className="h-4 w-4" />;
      case 'format': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tax_return': return 'bg-purple-100 text-purple-800';
      case 'financial_statement': return 'bg-green-100 text-green-800';
      case 'invoice': return 'bg-blue-100 text-blue-800';
      case 'receipt': return 'bg-orange-100 text-orange-800';
      case 'contract': return 'bg-red-100 text-red-800';
      case 'bank_statement': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Analysis Results</h2>
          <p className="text-gray-600">{result.metadata.fileName}</p>
        </div>

        <div className="flex items-center gap-2">
          {onViewOriginal && (
            <Button variant="outline" size="sm" onClick={onViewOriginal} className="gap-2">
              <Eye className="h-4 w-4" />
              View Original
            </Button>
          )}

          {onExport && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => onExport('json')} className="gap-2">
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('pdf')} className="gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-lg font-semibold">{result.category.category.replace('_', ' ')}</p>
              </div>
              <Badge className={getCategoryColor(result.category.category)}>
                {Math.round(result.category.confidence * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">OCR Quality</p>
                <p className="text-lg font-semibold">{Math.round(result.ocrResult.confidence * 100)}%</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing Time</p>
                <p className="text-lg font-semibold">{(result.processingTime / 1000).toFixed(1)}s</p>
              </div>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-lg font-semibold">${result.costInfo.totalCost.toFixed(4)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="data">Extracted Data</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="filing">Filing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">File Name</p>
                  <p className="font-medium">{result.metadata.fileName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">File Size</p>
                  <p className="font-medium">{formatFileSize(result.metadata.fileSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">File Type</p>
                  <p className="font-medium">{result.metadata.mimeType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Uploaded</p>
                  <p className="font-medium">{result.metadata.uploadedAt.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Document Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge className={getCategoryColor(result.category.category)}>
                  {result.category.category.replace('_', ' ')}
                </Badge>
                {result.category.subcategory && (
                  <Badge variant="outline">{result.category.subcategory}</Badge>
                )}
                <span className="text-sm text-gray-600">
                  {Math.round(result.category.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-gray-700">{result.category.description}</p>
            </CardContent>
          </Card>

          {/* Anomalies */}
          {result.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Anomalies Detected ({result.anomalies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.anomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="mt-1">
                        {getAnomalyIcon(anomaly.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{anomaly.type.replace('_', ' ')}</span>
                          <Badge variant={getAnomalySeverityColor(anomaly.severity) as any}>
                            {anomaly.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{anomaly.description}</p>
                        {anomaly.suggestion && (
                          <p className="text-sm text-blue-600">{anomaly.suggestion}</p>
                        )}
                        {anomaly.location && (
                          <p className="text-xs text-gray-500">Location: {anomaly.location}</p>
                        )}
                        <div className="mt-1">
                          <Progress value={anomaly.confidence * 100} className="w-24 h-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duplicates */}
          {result.duplicates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Potential Duplicates ({result.duplicates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.duplicates.map((duplicate, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Document ID: {duplicate.documentId}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {Math.round(duplicate.similarity * 100)}% similarity
                        </span>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* Page Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Document Content</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Page:</span>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {result.ocrResult.pages.map((_, index) => (
                  <option key={index} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">of {result.ocrResult.pages.length}</span>
            </div>
          </div>

          {/* Full Text */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Extracted Text
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.ocrResult.text)}
                  className="ml-auto"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full rounded border p-4">
                <pre className="text-sm whitespace-pre-wrap">
                  {selectedPage <= result.ocrResult.pages.length
                    ? result.ocrResult.pages[selectedPage - 1].text
                    : result.ocrResult.text}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Tables */}
          {result.ocrResult.tables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Detected Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.ocrResult.tables.map((table, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Table {index + 1} (Page {table.pageNumber})
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(table.confidence * 100)}% confidence
                        </span>
                      </div>
                      <div className="overflow-auto border rounded">
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="divide-y divide-gray-200">
                            {table.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 text-sm border-r">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key-Value Pairs */}
          {result.ocrResult.keyValuePairs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Key-Value Pairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.ocrResult.keyValuePairs.map((pair, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{pair.key}</span>
                        <span className="text-xs text-gray-500">
                          {Math.round(pair.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{pair.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Extracted Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structured Data</CardTitle>
              <CardDescription>
                AI-extracted structured information from the document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(result.extractedData).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(result.extractedData).map(([key, value]) => (
                    <div key={key} className="border rounded p-4">
                      <h4 className="font-medium text-sm mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h4>
                      <div className="text-sm text-gray-700">
                        {typeof value === 'object' ? (
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No structured data extracted</h3>
                  <p>The AI couldn't identify specific data fields in this document.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {result.category.extractedData && Object.keys(result.category.extractedData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(result.category.extractedData).map(([key, value]) => (
                    <div key={key} className="p-3 border rounded">
                      <h4 className="font-medium text-sm mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-gray-700">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">OCR Cost</p>
                  <p className="font-medium">${result.costInfo.ocrCost.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">AI Analysis Cost</p>
                  <p className="font-medium">${result.costInfo.aiCost.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processing Time</p>
                  <p className="font-medium">{(result.processingTime / 1000).toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pages Processed</p>
                  <p className="font-medium">{result.ocrResult.pages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filing Tab */}
        <TabsContent value="filing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Filing Suggestions
              </CardTitle>
              <CardDescription>
                AI recommendations for organizing this document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.filingsSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {result.filingsSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{suggestion.category}</h4>
                          {suggestion.subcategory && (
                            <Badge variant="outline">{suggestion.subcategory}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </span>
                          {onFileDocument && (
                            <Button
                              size="sm"
                              onClick={() => onFileDocument(suggestion.category, suggestion.subcategory)}
                            >
                              File Here
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Archive className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No filing suggestions</h3>
                  <p>The AI couldn't determine appropriate filing categories for this document.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}