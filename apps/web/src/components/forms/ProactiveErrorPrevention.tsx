'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Undo,
  Redo,
  Clock,
  DollarSign,
  FileText,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'calculation' | 'consistency' | 'anomaly';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  autoFix?: () => void;
}

export interface FieldValidation {
  fieldName: string;
  value: any;
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  suggestions: ValidationRule[];
  confidence: number; // AI confidence 0-1
  historicalContext?: {
    lastYearValue?: any;
    typicalRange?: [number, number];
    industryBenchmark?: number;
    anomalyScore?: number;
  };
}

export interface FormState {
  values: Record<string, any>;
  validations: Record<string, FieldValidation>;
  isDirty: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface ChangeHistoryEntry {
  timestamp: Date;
  field: string;
  oldValue: any;
  newValue: any;
  user: string;
}

export interface ProactiveErrorPreventionProps {
  formId: string;
  formType: 'tax_return' | 'invoice' | 'expense_report' | 'financial_statement';
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onSave: (values: Record<string, any>) => Promise<void>;
}

export function ProactiveErrorPrevention({
  formId,
  formType,
  initialValues,
  onSubmit,
  onSave,
}: ProactiveErrorPreventionProps) {
  const [formState, setFormState] = useState<FormState>({
    values: initialValues,
    validations: {},
    isDirty: false,
    hasErrors: false,
    hasWarnings: false,
  });

  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isValidating, setIsValidating] = useState(false);
  const [showPreSubmitChecklist, setShowPreSubmitChecklist] = useState(false);

  // Real-time validation with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      validateForm();
    }, 500);

    return () => clearTimeout(timer);
  }, [formState.values]);

  const validateForm = async () => {
    setIsValidating(true);

    // Simulate AI-powered validation
    const validations: Record<string, FieldValidation> = {};

    // Example: Validate total income calculation
    if (formType === 'tax_return') {
      const line1a = parseFloat(formState.values.line1a || 0);
      const line1b = parseFloat(formState.values.line1b || 0);
      const line1c = parseFloat(formState.values.line1c || 0);
      const expectedTotal = line1a + line1b;

      if (Math.abs(line1c - expectedTotal) > 0.01) {
        validations.line1c = {
          fieldName: 'line1c',
          value: line1c,
          isValid: false,
          errors: [
            {
              id: 'calc-error',
              field: 'line1c',
              type: 'calculation',
              severity: 'error',
              message: `Total Income does not match sum of components (Expected: $${expectedTotal.toLocaleString()}, Entered: $${line1c.toLocaleString()})`,
              suggestion: `Auto-fix to $${expectedTotal.toLocaleString()}?`,
              autoFix: () => updateField('line1c', expectedTotal),
            },
          ],
          warnings: [],
          suggestions: [],
          confidence: 0.99,
        };
      }

      // Validate officer compensation ratio
      const officerComp = parseFloat(formState.values.officerComp || 0);
      const totalRevenue = parseFloat(formState.values.totalRevenue || 1);
      const ratio = (officerComp / totalRevenue) * 100;

      if (ratio > 60) {
        validations.officerComp = {
          fieldName: 'officerComp',
          value: officerComp,
          isValid: true,
          errors: [],
          warnings: [
            {
              id: 'high-comp-ratio',
              field: 'officerComp',
              type: 'anomaly',
              severity: 'warning',
              message: `Officer compensation is ${ratio.toFixed(1)}% of total revenue`,
              suggestion: 'Industry benchmark: 35-45%. IRS scrutiny likelihood: HIGH for ratios >60%',
            },
          ],
          suggestions: [
            {
              id: 'comp-review',
              field: 'officerComp',
              type: 'consistency',
              severity: 'info',
              message: 'Consider reviewing compensation structure',
              suggestion: '1. Verify amount is correct\n2. Review for reclassification opportunities\n3. Consult reasonable compensation analysis',
            },
          ],
          confidence: 0.87,
          historicalContext: {
            lastYearValue: 280000,
            typicalRange: [150000, 190000],
            industryBenchmark: 0.4,
            anomalyScore: 0.8,
          },
        };
      }
    }

    setFormState((prev) => ({
      ...prev,
      validations,
      hasErrors: Object.values(validations).some((v) => v.errors.length > 0),
      hasWarnings: Object.values(validations).some((v) => v.warnings.length > 0),
    }));

    setIsValidating(false);
  };

  const updateField = useCallback((field: string, value: any) => {
    setFormState((prev) => {
      // Add to history
      const historyEntry: ChangeHistoryEntry = {
        timestamp: new Date(),
        field,
        oldValue: prev.values[field],
        newValue: value,
        user: 'Current User',
      };

      setHistory((h) => [...h.slice(0, historyIndex + 1), historyEntry]);
      setHistoryIndex((i) => i + 1);

      return {
        ...prev,
        values: {
          ...prev.values,
          [field]: value,
        },
        isDirty: true,
      };
    });
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex >= 0) {
      const entry = history[historyIndex];
      setFormState((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          [entry.field]: entry.oldValue,
        },
      }));
      setHistoryIndex((i) => i - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const entry = history[historyIndex + 1];
      setFormState((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          [entry.field]: entry.newValue,
        },
      }));
      setHistoryIndex((i) => i + 1);
    }
  };

  const handleSubmit = async () => {
    if (formState.hasErrors) {
      setShowPreSubmitChecklist(true);
      return;
    }

    try {
      await onSubmit(formState.values);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const errorCount = Object.values(formState.validations).reduce(
    (sum, v) => sum + v.errors.length,
    0
  );
  const warningCount = Object.values(formState.validations).reduce(
    (sum, v) => sum + v.warnings.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Validation Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">New Tax Return: Johnson LLC (Form 1120-S)</h1>
            <p className="text-sm text-muted-foreground">
              {formState.isDirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex < 0}
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSave(formState.values)}>
              Save Draft
            </Button>
          </div>
        </div>

        {/* Smart Validation Status - Sticky on Mobile */}
        <Card className="sticky top-4 z-10 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Smart Validation Status</CardTitle>
              <Button variant="ghost" size="sm">
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Summary */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">47 fields validated</span>
                </div>
                {warningCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm">{warningCount} warnings</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">{errorCount} critical errors</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Form Completion</span>
                  <span className="text-xs font-medium">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>

              {/* AI Confidence */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-900 dark:text-blue-100">
                  AI Confidence: 94% - This return looks good! Address the items below.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alerts */}
        <AnimatePresence>
          {Object.entries(formState.validations).map(([field, validation]) => (
            <React.Fragment key={field}>
              {validation.errors.map((error) => (
                <ValidationAlert
                  key={error.id}
                  type="error"
                  rule={error}
                  field={field}
                  validation={validation}
                />
              ))}
              {validation.warnings.map((warning) => (
                <ValidationAlert
                  key={warning.id}
                  type="warning"
                  rule={warning}
                  field={field}
                  validation={validation}
                />
              ))}
            </React.Fragment>
          ))}
        </AnimatePresence>

        {/* Form Fields - Example */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Line 1a - Gross Receipts"
                name="line1a"
                value={formState.values.line1a || ''}
                onChange={(value) => updateField('line1a', value)}
                validation={formState.validations.line1a}
                icon={<DollarSign className="w-4 h-4" />}
              />
              <FormField
                label="Line 1b - Returns and Allowances"
                name="line1b"
                value={formState.values.line1b || ''}
                onChange={(value) => updateField('line1b', value)}
                validation={formState.validations.line1b}
                icon={<DollarSign className="w-4 h-4" />}
              />
              <FormField
                label="Line 1c - Total Income"
                name="line1c"
                value={formState.values.line1c || ''}
                onChange={(value) => updateField('line1c', value)}
                validation={formState.validations.line1c}
                icon={<Calculator className="w-4 h-4" />}
                error={formState.validations.line1c?.errors[0]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Deductions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deductions Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Line 7 - Compensation of Officers"
                name="officerComp"
                value={formState.values.officerComp || ''}
                onChange={(value) => updateField('officerComp', value)}
                validation={formState.validations.officerComp}
                icon={<DollarSign className="w-4 h-4" />}
                warning={formState.validations.officerComp?.warnings[0]}
              />
              <FormField
                label="Total Revenue (for reference)"
                name="totalRevenue"
                value={formState.values.totalRevenue || ''}
                onChange={(value) => updateField('totalRevenue', value)}
                validation={formState.validations.totalRevenue}
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Change History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Change History
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.slice(-5).reverse().map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.field}</span>
                    <span className="text-muted-foreground">
                      changed from {entry.oldValue} to {entry.newValue}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No changes yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pre-Filing Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pre-Filing Checklist (8/10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ChecklistItem label="All required fields completed" completed />
              <ChecklistItem label="Math validation passed" completed />
              <ChecklistItem label="EIN format verified" completed />
              <ChecklistItem label="Shareholder information complete" completed />
              <ChecklistItem label="Schedule K-1 allocations balance" completed />
              <ChecklistItem label="State return prepared" completed />
              <ChecklistItem label="Officer compensation documentation attached" completed={false} />
              <ChecklistItem label="Bank reconciliation reviewed" completed />
              <ChecklistItem label="Client signature obtained" completed={false} />
              <ChecklistItem label="Payment voucher generated" completed />
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Complete Remaining Items
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons - Fixed Bottom on Mobile */}
        <div className="sticky bottom-4 bg-white dark:bg-gray-900 p-4 rounded-lg border shadow-lg">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onSave(formState.values)}>
              Save Draft
            </Button>
            <Button
              variant={formState.hasErrors ? 'destructive' : 'default'}
              className="flex-1"
              onClick={handleSubmit}
              disabled={isValidating}
            >
              {formState.hasErrors ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Fix {errorCount} Error{errorCount !== 1 && 's'} First
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  e-File When Ready
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ValidationAlert({
  type,
  rule,
  field,
  validation,
}: {
  type: 'error' | 'warning';
  rule: ValidationRule;
  field: string;
  validation: FieldValidation;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card
        className={cn(
          'border-2',
          type === 'error'
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
            : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 space-y-3">
              <div>
                <p
                  className={cn(
                    'font-medium text-sm',
                    type === 'error'
                      ? 'text-red-900 dark:text-red-100'
                      : 'text-yellow-900 dark:text-yellow-100'
                  )}
                >
                  {type === 'error' ? 'CRITICAL - Must Fix Before Filing' : 'WARNING - Recommended Review'}
                </p>
                <p
                  className={cn(
                    'text-sm mt-1',
                    type === 'error'
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  )}
                >
                  {rule.message}
                </p>
              </div>

              {rule.suggestion && (
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    type === 'error'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-yellow-100 dark:bg-yellow-900/30'
                  )}
                >
                  <p className="text-xs font-medium mb-1">💡 AI Suggestion:</p>
                  <p className="text-xs whitespace-pre-wrap">{rule.suggestion}</p>
                </div>
              )}

              {validation.historicalContext && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs space-y-1">
                  <p className="font-medium">Historical Context:</p>
                  {validation.historicalContext.lastYearValue && (
                    <p>• Last year: ${validation.historicalContext.lastYearValue.toLocaleString()}</p>
                  )}
                  {validation.historicalContext.industryBenchmark && (
                    <p>
                      • Industry benchmark:{' '}
                      {(validation.historicalContext.industryBenchmark * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {rule.autoFix && (
                  <Button size="sm" onClick={rule.autoFix}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Auto-Fix
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Info className="w-3 h-3 mr-1" />
                  Explain
                </Button>
                {type === 'warning' && (
                  <Button size="sm" variant="ghost">
                    I Verified This
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  validation,
  icon,
  error,
  warning,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  validation?: FieldValidation;
  icon?: React.ReactNode;
  error?: ValidationRule;
  warning?: ValidationRule;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <div className="relative">
        <Input
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            error && 'border-red-500 focus:ring-red-500',
            warning && 'border-yellow-500 focus:ring-yellow-500'
          )}
        />
        {validation && validation.confidence > 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                validation.confidence >= 0.9
                  ? 'bg-green-50 dark:bg-green-950/30'
                  : validation.confidence >= 0.7
                  ? 'bg-yellow-50 dark:bg-yellow-950/30'
                  : 'bg-red-50 dark:bg-red-950/30'
              )}
            >
              {Math.round(validation.confidence * 100)}%
            </Badge>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error.message}</p>}
      {warning && <p className="text-xs text-yellow-600 dark:text-yellow-400">{warning.message}</p>}
    </div>
  );
}

function ChecklistItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
      {completed ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
      )}
      <span className={cn('text-sm', completed && 'text-muted-foreground')}>{label}</span>
    </div>
  );
}