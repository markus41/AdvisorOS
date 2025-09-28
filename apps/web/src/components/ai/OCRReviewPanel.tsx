'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit3,
  Save,
  RefreshCw,
  FileText,
  Table,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  confidence: number;
}

interface ExtractedTable {
  id: string;
  pageNumber: number;
  headers: string[];
  rows: string[][];
  confidence: number;
  description?: string;
}

interface DocumentProcessingResult {
  documentType: string;
  confidence: number;
  extractedData: Record<string, any>;
  validationErrors: ValidationError[];
  tables: ExtractedTable[];
  fullText: string;
  insights: string[];
  suggestedActions: string[];
  processingTime: number;
  cost: number;
}

interface OCRReviewPanelProps {
  jobId: string;
  result: DocumentProcessingResult;
  onApprove: (corrections: Record<string, any>, notes: string) => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
}

export const OCRReviewPanel: React.FC<OCRReviewPanelProps> = ({
  jobId,
  result,
  onApprove,
  onReject,
  isLoading = false
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>(result.extractedData);
  const [corrections, setCorrections] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');
  const [validationOverrides, setValidationOverrides] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('extracted-data');

  useEffect(() => {
    setEditedData(result.extractedData);
  }, [result.extractedData]);

  const handleFieldEdit = (field: string, value: any) => {
    const newEditedData = { ...editedData, [field]: value };
    setEditedData(newEditedData);

    // Track corrections
    if (value !== result.extractedData[field]) {
      setCorrections(prev => ({ ...prev, [field]: value }));
    } else {
      const newCorrections = { ...corrections };
      delete newCorrections[field];
      setCorrections(newCorrections);
    }
  };

  const handleValidationOverride = (field: string, override: boolean) => {
    if (override) {
      setValidationOverrides(prev => [...prev.filter(f => f !== field), field]);
    } else {
      setValidationOverrides(prev => prev.filter(f => f !== field));
    }
  };

  const handleApprove = () => {
    onApprove(corrections, notes);
  };

  const handleReject = () => {
    const reason = notes || 'Document processing needs revision';
    onReject(reason);
  };

  const getSeverityColor = (severity: ValidationError['severity']) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getSeverityIcon = (severity: ValidationError['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const renderFieldEditor = (field: string, value: any, label?: string) => {
    const displayLabel = label || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const isModified = corrections[field] !== undefined;

    if (typeof value === 'boolean') {
      return (
        <div key={field} className="space-y-2">
          <Label className={isModified ? 'text-blue-600 font-medium' : ''}>
            {displayLabel}
            {isModified && <span className="ml-1 text-xs">(Modified)</span>}
          </Label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={field}
                checked={editedData[field] === true}
                onChange={() => handleFieldEdit(field, true)}
                disabled={!editMode}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={field}
                checked={editedData[field] === false}
                onChange={() => handleFieldEdit(field, false)}
                disabled={!editMode}
              />
              <span>No</span>
            </label>
          </div>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={field} className="space-y-2">
          <Label className={isModified ? 'text-blue-600 font-medium' : ''}>
            {displayLabel}
            {isModified && <span className="ml-1 text-xs">(Modified)</span>}
          </Label>
          <Input
            type="number"
            value={editedData[field] || ''}
            onChange={(e) => handleFieldEdit(field, parseFloat(e.target.value) || 0)}
            disabled={!editMode}
            className={isModified ? 'border-blue-300 bg-blue-50' : ''}
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={field} className="space-y-2">
          <Label className={isModified ? 'text-blue-600 font-medium' : ''}>
            {displayLabel}
            {isModified && <span className="ml-1 text-xs">(Modified)</span>}
          </Label>
          <Textarea
            value={Array.isArray(editedData[field]) ? editedData[field].join('\n') : ''}
            onChange={(e) => handleFieldEdit(field, e.target.value.split('\n').filter(Boolean))}
            disabled={!editMode}
            className={isModified ? 'border-blue-300 bg-blue-50' : ''}
            rows={3}
          />
        </div>
      );
    }

    // Default to text input
    return (
      <div key={field} className="space-y-2">
        <Label className={isModified ? 'text-blue-600 font-medium' : ''}>
          {displayLabel}
          {isModified && <span className="ml-1 text-xs">(Modified)</span>}
        </Label>
        <Input
          value={editedData[field] || ''}
          onChange={(e) => handleFieldEdit(field, e.target.value)}
          disabled={!editMode}
          className={isModified ? 'border-blue-300 bg-blue-50' : ''}
        />
      </div>
    );
  };

  const groupedData = Object.entries(editedData).reduce((groups, [field, value]) => {
    // Group fields by category for better organization
    let category = 'General';

    if (field.includes('employee') || field.includes('taxpayer') || field.includes('name') || field.includes('ssn')) {
      category = 'Personal Information';
    } else if (field.includes('employer') || field.includes('payer') || field.includes('company')) {
      category = 'Entity Information';
    } else if (field.includes('wage') || field.includes('income') || field.includes('amount') || field.includes('tax')) {
      category = 'Financial Information';
    } else if (field.includes('address') || field.includes('phone') || field.includes('email')) {
      category = 'Contact Information';
    } else if (field.includes('date') || field.includes('year')) {
      category = 'Dates & Periods';
    }

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push([field, value]);
    return groups;
  }, {} as Record<string, Array<[string, any]>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Review: {result.documentType.toUpperCase()}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                <span>Processing Time: {result.processingTime}ms</span>
                <span>Cost: ${result.cost.toFixed(4)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={editMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {editMode ? 'View Mode' : 'Edit Mode'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {result.validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Validation Issues ({result.validationErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.validationErrors.map((error, index) => (
                <Alert key={index} className="border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(error.severity)}
                      <div>
                        <AlertDescription>
                          <span className="font-medium">{error.field}:</span> {error.message}
                        </AlertDescription>
                        <div className="text-xs text-gray-500 mt-1">
                          Confidence: {(error.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(error.severity) as any}>
                        {error.severity}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleValidationOverride(
                          error.field,
                          !validationOverrides.includes(error.field)
                        )}
                        className={validationOverrides.includes(error.field) ? 'bg-green-50' : ''}
                      >
                        {validationOverrides.includes(error.field) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="extracted-data">Extracted Data</TabsTrigger>
          <TabsTrigger value="tables">Tables ({result.tables.length})</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="full-text">Full Text</TabsTrigger>
        </TabsList>

        <TabsContent value="extracted-data" className="space-y-4">
          {Object.entries(groupedData).map(([category, fields]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(([field, value]) => renderFieldEditor(field, value))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          {result.tables.map((table, index) => (
            <Card key={table.id || index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Table {index + 1} - Page {table.pageNumber}
                  {table.description && <span className="text-sm font-normal text-gray-600">({table.description})</span>}
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Confidence: {(table.confidence * 100).toFixed(1)}%
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {table.headers.map((header, headerIndex) => (
                          <th key={headerIndex} className="border border-gray-300 px-2 py-1 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Suggested Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="full-text">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Text</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <pre className="whitespace-pre-wrap text-sm">{result.fullText}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Review Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about your review, corrections made, or concerns..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600">
          {Object.keys(corrections).length > 0 && (
            <span>{Object.keys(corrections).length} field(s) modified</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject & Request Revision
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Approve & Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OCRReviewPanel;