import { prisma } from '@/server/db';
import { z } from 'zod';

export interface TransformationRule {
  id: string;
  name: string;
  description: string;
  entityType: string;
  sourceField: string;
  targetField: string;
  transformationType: TransformationType;
  transformationConfig: TransformationConfig;
  conditions: TransformationCondition[];
  priority: number;
  isActive: boolean;
  metadata: any;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  entityType: string;
  fieldPath: string;
  validationType: ValidationType;
  validationConfig: ValidationConfig;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  isActive: boolean;
  metadata: any;
}

export interface TransformationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface TransformationConfig {
  // For mapping transformations
  mappings?: Record<string, any>;

  // For formatting transformations
  format?: {
    type: 'date' | 'currency' | 'phone' | 'email' | 'custom';
    pattern?: string;
    locale?: string;
    options?: any;
  };

  // For calculation transformations
  calculation?: {
    formula: string;
    variables: Record<string, string>;
    dataType: 'number' | 'date' | 'string' | 'boolean';
  };

  // For merge transformations
  merge?: {
    strategy: 'concat' | 'first_non_null' | 'last_non_null' | 'custom';
    separator?: string;
    customFunction?: string;
  };

  // For split transformations
  split?: {
    delimiter: string;
    maxParts: number;
    keepDelimiter: boolean;
  };

  // For custom transformations
  custom?: {
    functionName: string;
    parameters: Record<string, any>;
  };
}

export interface ValidationConfig {
  // For required validations
  required?: boolean;

  // For type validations
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url';

  // For string validations
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedValues?: any[];

  // For number validations
  min?: number;
  max?: number;
  precision?: number;

  // For date validations
  minDate?: string;
  maxDate?: string;

  // For custom validations
  custom?: {
    functionName: string;
    parameters: Record<string, any>;
  };
}

export type TransformationType =
  | 'map'
  | 'format'
  | 'calculate'
  | 'merge'
  | 'split'
  | 'custom'
  | 'conditional'
  | 'lookup'
  | 'aggregate';

export type ValidationType =
  | 'required'
  | 'type'
  | 'length'
  | 'range'
  | 'pattern'
  | 'custom'
  | 'cross_field'
  | 'business_rule';

export interface TransformationResult {
  success: boolean;
  transformedData: any;
  errors: TransformationError[];
  warnings: TransformationWarning[];
  metadata: {
    rulesApplied: string[];
    processingTime: number;
    originalData: any;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    rulesChecked: string[];
    processingTime: number;
  };
}

export interface TransformationError {
  ruleId: string;
  ruleName: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  originalValue: any;
  expectedType?: string;
}

export interface TransformationWarning {
  ruleId: string;
  ruleName: string;
  field: string;
  message: string;
  originalValue: any;
  transformedValue: any;
}

export interface ValidationError {
  ruleId: string;
  ruleName: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  actualValue: any;
  expectedConstraint?: any;
}

export interface ValidationWarning {
  ruleId: string;
  ruleName: string;
  field: string;
  message: string;
  actualValue: any;
}

export interface PipelineConfig {
  enableTransformation: boolean;
  enableValidation: boolean;
  stopOnFirstError: boolean;
  enableWarnings: boolean;
  enableAuditLogging: boolean;
  maxProcessingTime: number;
  transformationTimeout: number;
  validationTimeout: number;
}

// Zod schemas for QuickBooks entities
const QuickBooksCustomerSchema = z.object({
  Id: z.string(),
  Name: z.string().min(1, 'Customer name is required'),
  Active: z.boolean().default(true),
  CompanyName: z.string().optional(),
  GivenName: z.string().optional(),
  FamilyName: z.string().optional(),
  FullyQualifiedName: z.string().optional(),
  DisplayName: z.string(),
  PrintOnCheckName: z.string().optional(),
  BillAddr: z.object({
    Line1: z.string().optional(),
    Line2: z.string().optional(),
    City: z.string().optional(),
    Country: z.string().optional(),
    CountrySubDivisionCode: z.string().optional(),
    PostalCode: z.string().optional()
  }).optional(),
  ShipAddr: z.object({
    Line1: z.string().optional(),
    Line2: z.string().optional(),
    City: z.string().optional(),
    Country: z.string().optional(),
    CountrySubDivisionCode: z.string().optional(),
    PostalCode: z.string().optional()
  }).optional(),
  PrimaryPhone: z.object({
    FreeFormNumber: z.string().optional()
  }).optional(),
  PrimaryEmailAddr: z.object({
    Address: z.string().email().optional()
  }).optional(),
  Balance: z.number().default(0),
  BalanceWithJobs: z.number().default(0),
  CurrencyRef: z.object({
    value: z.string(),
    name: z.string()
  }).optional(),
  PreferredDeliveryMethod: z.string().optional(),
  ResaleNum: z.string().optional(),
  Taxable: z.boolean().default(true)
});

const QuickBooksInvoiceSchema = z.object({
  Id: z.string(),
  DocNumber: z.string().optional(),
  TxnDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }),
  DueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid due date format'
  }).optional(),
  CustomerRef: z.object({
    value: z.string(),
    name: z.string().optional()
  }),
  Line: z.array(z.object({
    Id: z.string().optional(),
    LineNum: z.number().optional(),
    Amount: z.number(),
    DetailType: z.string(),
    SalesItemLineDetail: z.object({
      ItemRef: z.object({
        value: z.string(),
        name: z.string().optional()
      }),
      UnitPrice: z.number().optional(),
      Qty: z.number().optional(),
      TaxCodeRef: z.object({
        value: z.string()
      }).optional()
    }).optional()
  })),
  TotalAmt: z.number(),
  Balance: z.number().default(0),
  EmailStatus: z.string().optional(),
  BillEmail: z.object({
    Address: z.string().email().optional()
  }).optional(),
  DeliveryInfo: z.object({
    DeliveryType: z.string().optional(),
    DeliveryTime: z.string().optional()
  }).optional()
});

export class QuickBooksDataTransformationPipeline {
  private transformationRules: Map<string, TransformationRule[]> = new Map();
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private customTransformations: Map<string, Function> = new Map();
  private customValidations: Map<string, Function> = new Map();
  private entitySchemas: Map<string, z.ZodSchema> = new Map();

  private readonly defaultConfig: PipelineConfig = {
    enableTransformation: true,
    enableValidation: true,
    stopOnFirstError: false,
    enableWarnings: true,
    enableAuditLogging: true,
    maxProcessingTime: 30000, // 30 seconds
    transformationTimeout: 10000, // 10 seconds
    validationTimeout: 5000 // 5 seconds
  };

  constructor() {
    this.initializeDefaultSchemas();
    this.initializeCustomFunctions();
  }

  /**
   * Process data through the complete transformation and validation pipeline
   */
  async processData(
    data: any,
    entityType: string,
    operation: 'create' | 'update' | 'delete',
    config?: Partial<PipelineConfig>
  ): Promise<{
    transformationResult: TransformationResult;
    validationResult: ValidationResult;
    finalData: any;
  }> {
    const pipelineConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    try {
      // Load rules for entity type
      await this.loadRulesForEntity(entityType);

      let processedData = data;
      let transformationResult: TransformationResult;
      let validationResult: ValidationResult;

      // Apply transformations
      if (pipelineConfig.enableTransformation) {
        transformationResult = await this.applyTransformations(
          processedData,
          entityType,
          operation,
          pipelineConfig
        );

        if (!transformationResult.success && pipelineConfig.stopOnFirstError) {
          throw new Error(`Transformation failed: ${transformationResult.errors[0]?.message}`);
        }

        processedData = transformationResult.transformedData;
      } else {
        transformationResult = {
          success: true,
          transformedData: processedData,
          errors: [],
          warnings: [],
          metadata: {
            rulesApplied: [],
            processingTime: 0,
            originalData: data
          }
        };
      }

      // Apply validations
      if (pipelineConfig.enableValidation) {
        validationResult = await this.applyValidations(
          processedData,
          entityType,
          operation,
          pipelineConfig
        );

        if (!validationResult.isValid && pipelineConfig.stopOnFirstError) {
          throw new Error(`Validation failed: ${validationResult.errors[0]?.message}`);
        }
      } else {
        validationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          metadata: {
            rulesChecked: [],
            processingTime: 0
          }
        };
      }

      // Audit logging
      if (pipelineConfig.enableAuditLogging) {
        await this.auditPipelineExecution(
          entityType,
          operation,
          data,
          processedData,
          transformationResult,
          validationResult,
          Date.now() - startTime
        );
      }

      return {
        transformationResult,
        validationResult,
        finalData: processedData
      };

    } catch (error) {
      console.error('Pipeline processing error:', error);
      throw error;
    }
  }

  /**
   * Apply transformation rules to data
   */
  private async applyTransformations(
    data: any,
    entityType: string,
    operation: string,
    config: PipelineConfig
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    const rules = this.transformationRules.get(entityType) || [];
    const activeRules = rules.filter(rule => rule.isActive);

    let transformedData = JSON.parse(JSON.stringify(data)); // Deep clone
    const errors: TransformationError[] = [];
    const warnings: TransformationWarning[] = [];
    const rulesApplied: string[] = [];

    for (const rule of activeRules.sort((a, b) => a.priority - b.priority)) {
      try {
        // Check if rule conditions are met
        if (!this.evaluateConditions(rule.conditions, transformedData)) {
          continue;
        }

        // Apply transformation with timeout
        const transformPromise = this.applyTransformationRule(transformedData, rule);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transformation timeout')), config.transformationTimeout);
        });

        const result = await Promise.race([transformPromise, timeoutPromise]) as any;

        if (result.success) {
          transformedData = result.data;
          rulesApplied.push(rule.id);

          if (result.warnings) {
            warnings.push(...result.warnings);
          }
        } else {
          errors.push({
            ruleId: rule.id,
            ruleName: rule.name,
            field: rule.targetField,
            message: result.error || 'Transformation failed',
            severity: 'error',
            originalValue: this.getFieldValue(data, rule.sourceField)
          });
        }

      } catch (error) {
        errors.push({
          ruleId: rule.id,
          ruleName: rule.name,
          field: rule.targetField,
          message: error instanceof Error ? error.message : 'Unknown transformation error',
          severity: 'error',
          originalValue: this.getFieldValue(data, rule.sourceField)
        });
      }
    }

    return {
      success: errors.length === 0,
      transformedData,
      errors,
      warnings,
      metadata: {
        rulesApplied,
        processingTime: Date.now() - startTime,
        originalData: data
      }
    };
  }

  /**
   * Apply validation rules to data
   */
  private async applyValidations(
    data: any,
    entityType: string,
    operation: string,
    config: PipelineConfig
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const rules = this.validationRules.get(entityType) || [];
    const activeRules = rules.filter(rule => rule.isActive);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const rulesChecked: string[] = [];

    // Apply schema validation first
    const schemaValidation = await this.validateWithSchema(data, entityType);
    if (!schemaValidation.success) {
      errors.push(...schemaValidation.errors);
    }

    // Apply custom validation rules
    for (const rule of activeRules) {
      try {
        // Apply validation with timeout
        const validationPromise = this.applyValidationRule(data, rule);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Validation timeout')), config.validationTimeout);
        });

        const result = await Promise.race([validationPromise, timeoutPromise]) as any;

        rulesChecked.push(rule.id);

        if (!result.isValid) {
          const validationError: ValidationError = {
            ruleId: rule.id,
            ruleName: rule.name,
            field: rule.fieldPath,
            message: result.message || rule.errorMessage,
            severity: rule.severity,
            actualValue: this.getFieldValue(data, rule.fieldPath),
            expectedConstraint: rule.validationConfig
          };

          if (rule.severity === 'error') {
            errors.push(validationError);
          } else {
            warnings.push({
              ruleId: rule.id,
              ruleName: rule.name,
              field: rule.fieldPath,
              message: validationError.message,
              actualValue: validationError.actualValue
            });
          }
        }

      } catch (error) {
        errors.push({
          ruleId: rule.id,
          ruleName: rule.name,
          field: rule.fieldPath,
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'error',
          actualValue: this.getFieldValue(data, rule.fieldPath)
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        rulesChecked,
        processingTime: Date.now() - startTime
      }
    };
  }

  /**
   * Apply a single transformation rule
   */
  private async applyTransformationRule(data: any, rule: TransformationRule): Promise<any> {
    const sourceValue = this.getFieldValue(data, rule.sourceField);

    switch (rule.transformationType) {
      case 'map':
        return this.applyMappingTransformation(data, rule, sourceValue);

      case 'format':
        return this.applyFormattingTransformation(data, rule, sourceValue);

      case 'calculate':
        return this.applyCalculationTransformation(data, rule);

      case 'merge':
        return this.applyMergeTransformation(data, rule);

      case 'split':
        return this.applySplitTransformation(data, rule, sourceValue);

      case 'custom':
        return this.applyCustomTransformation(data, rule, sourceValue);

      case 'conditional':
        return this.applyConditionalTransformation(data, rule);

      case 'lookup':
        return this.applyLookupTransformation(data, rule, sourceValue);

      case 'aggregate':
        return this.applyAggregateTransformation(data, rule);

      default:
        throw new Error(`Unsupported transformation type: ${rule.transformationType}`);
    }
  }

  /**
   * Apply a single validation rule
   */
  private async applyValidationRule(data: any, rule: ValidationRule): Promise<any> {
    const fieldValue = this.getFieldValue(data, rule.fieldPath);

    switch (rule.validationType) {
      case 'required':
        return this.validateRequired(fieldValue, rule);

      case 'type':
        return this.validateType(fieldValue, rule);

      case 'length':
        return this.validateLength(fieldValue, rule);

      case 'range':
        return this.validateRange(fieldValue, rule);

      case 'pattern':
        return this.validatePattern(fieldValue, rule);

      case 'custom':
        return this.validateCustom(data, rule);

      case 'cross_field':
        return this.validateCrossField(data, rule);

      case 'business_rule':
        return this.validateBusinessRule(data, rule);

      default:
        throw new Error(`Unsupported validation type: ${rule.validationType}`);
    }
  }

  // Transformation implementations

  private applyMappingTransformation(data: any, rule: TransformationRule, sourceValue: any): any {
    const { mappings } = rule.transformationConfig;
    if (!mappings) {
      throw new Error('Mapping configuration is required');
    }

    const mappedValue = mappings[sourceValue] || sourceValue;
    return {
      success: true,
      data: this.setFieldValue(data, rule.targetField, mappedValue)
    };
  }

  private applyFormattingTransformation(data: any, rule: TransformationRule, sourceValue: any): any {
    const { format } = rule.transformationConfig;
    if (!format) {
      throw new Error('Format configuration is required');
    }

    let formattedValue: any;

    switch (format.type) {
      case 'date':
        formattedValue = this.formatDate(sourceValue, format.pattern, format.locale);
        break;

      case 'currency':
        formattedValue = this.formatCurrency(sourceValue, format.locale, format.options);
        break;

      case 'phone':
        formattedValue = this.formatPhone(sourceValue, format.pattern);
        break;

      case 'email':
        formattedValue = this.formatEmail(sourceValue);
        break;

      case 'custom':
        formattedValue = this.applyCustomFormat(sourceValue, format.pattern);
        break;

      default:
        throw new Error(`Unsupported format type: ${format.type}`);
    }

    return {
      success: true,
      data: this.setFieldValue(data, rule.targetField, formattedValue)
    };
  }

  private applyCalculationTransformation(data: any, rule: TransformationRule): any {
    const { calculation } = rule.transformationConfig;
    if (!calculation) {
      throw new Error('Calculation configuration is required');
    }

    // Replace variables in formula with actual values
    let formula = calculation.formula;
    for (const [variable, fieldPath] of Object.entries(calculation.variables)) {
      const value = this.getFieldValue(data, fieldPath);
      formula = formula.replace(new RegExp(`\\$${variable}`, 'g'), String(value));
    }

    // Evaluate the formula (in a real implementation, use a safe expression evaluator)
    const result = this.evaluateFormula(formula, calculation.dataType);

    return {
      success: true,
      data: this.setFieldValue(data, rule.targetField, result)
    };
  }

  private applyMergeTransformation(data: any, rule: TransformationRule): any {
    const { merge } = rule.transformationConfig;
    if (!merge) {
      throw new Error('Merge configuration is required');
    }

    // Get source fields (assuming sourceField contains comma-separated field paths)
    const sourceFields = rule.sourceField.split(',');
    const values = sourceFields.map(field => this.getFieldValue(data, field.trim()));

    let mergedValue: any;

    switch (merge.strategy) {
      case 'concat':
        mergedValue = values.join(merge.separator || '');
        break;

      case 'first_non_null':
        mergedValue = values.find(v => v !== null && v !== undefined);
        break;

      case 'last_non_null':
        mergedValue = values.reverse().find(v => v !== null && v !== undefined);
        break;

      case 'custom':
        mergedValue = this.applyCustomMerge(values, merge.customFunction);
        break;

      default:
        throw new Error(`Unsupported merge strategy: ${merge.strategy}`);
    }

    return {
      success: true,
      data: this.setFieldValue(data, rule.targetField, mergedValue)
    };
  }

  private applySplitTransformation(data: any, rule: TransformationRule, sourceValue: any): any {
    const { split } = rule.transformationConfig;
    if (!split) {
      throw new Error('Split configuration is required');
    }

    if (typeof sourceValue !== 'string') {
      throw new Error('Split transformation requires string input');
    }

    const parts = sourceValue.split(split.delimiter);
    const limitedParts = split.maxParts ? parts.slice(0, split.maxParts) : parts;

    // Assuming targetField is an array field or multiple fields
    return {
      success: true,
      data: this.setFieldValue(data, rule.targetField, limitedParts)
    };
  }

  private applyCustomTransformation(data: any, rule: TransformationRule, sourceValue: any): any {
    const { custom } = rule.transformationConfig;
    if (!custom) {
      throw new Error('Custom configuration is required');
    }

    const customFunction = this.customTransformations.get(custom.functionName);
    if (!customFunction) {
      throw new Error(`Custom transformation function not found: ${custom.functionName}`);
    }

    const result = customFunction(sourceValue, custom.parameters, data);

    return {
      success: true,
      data: this.setFieldValue(data, rule.targetField, result)
    };
  }

  private applyConditionalTransformation(data: any, rule: TransformationRule): any {
    // Implementation for conditional transformations
    return { success: true, data };
  }

  private applyLookupTransformation(data: any, rule: TransformationRule, sourceValue: any): any {
    // Implementation for lookup transformations
    return { success: true, data };
  }

  private applyAggregateTransformation(data: any, rule: TransformationRule): any {
    // Implementation for aggregate transformations
    return { success: true, data };
  }

  // Validation implementations

  private validateRequired(value: any, rule: ValidationRule): any {
    const isRequired = rule.validationConfig.required;
    const isEmpty = value === null || value === undefined || value === '';

    return {
      isValid: !isRequired || !isEmpty,
      message: isEmpty ? 'Field is required' : undefined
    };
  }

  private validateType(value: any, rule: ValidationRule): any {
    const { dataType } = rule.validationConfig;
    if (!dataType) {
      return { isValid: true };
    }

    let isValid = true;
    let message: string | undefined;

    switch (dataType) {
      case 'string':
        isValid = typeof value === 'string';
        message = 'Must be a string';
        break;

      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        message = 'Must be a valid number';
        break;

      case 'boolean':
        isValid = typeof value === 'boolean';
        message = 'Must be a boolean';
        break;

      case 'date':
        isValid = !isNaN(Date.parse(value));
        message = 'Must be a valid date';
        break;

      case 'email':
        isValid = this.isValidEmail(value);
        message = 'Must be a valid email address';
        break;

      case 'phone':
        isValid = this.isValidPhone(value);
        message = 'Must be a valid phone number';
        break;

      case 'url':
        isValid = this.isValidUrl(value);
        message = 'Must be a valid URL';
        break;
    }

    return {
      isValid,
      message: isValid ? undefined : message
    };
  }

  private validateLength(value: any, rule: ValidationRule): any {
    if (typeof value !== 'string') {
      return { isValid: true }; // Skip length validation for non-strings
    }

    const { minLength, maxLength } = rule.validationConfig;
    const length = value.length;

    if (minLength !== undefined && length < minLength) {
      return {
        isValid: false,
        message: `Must be at least ${minLength} characters long`
      };
    }

    if (maxLength !== undefined && length > maxLength) {
      return {
        isValid: false,
        message: `Must be no more than ${maxLength} characters long`
      };
    }

    return { isValid: true };
  }

  private validateRange(value: any, rule: ValidationRule): any {
    if (typeof value !== 'number') {
      return { isValid: true }; // Skip range validation for non-numbers
    }

    const { min, max } = rule.validationConfig;

    if (min !== undefined && value < min) {
      return {
        isValid: false,
        message: `Must be at least ${min}`
      };
    }

    if (max !== undefined && value > max) {
      return {
        isValid: false,
        message: `Must be no more than ${max}`
      };
    }

    return { isValid: true };
  }

  private validatePattern(value: any, rule: ValidationRule): any {
    if (typeof value !== 'string') {
      return { isValid: true }; // Skip pattern validation for non-strings
    }

    const { pattern } = rule.validationConfig;
    if (!pattern) {
      return { isValid: true };
    }

    const regex = new RegExp(pattern);
    const isValid = regex.test(value);

    return {
      isValid,
      message: isValid ? undefined : 'Does not match required pattern'
    };
  }

  private validateCustom(data: any, rule: ValidationRule): any {
    const { custom } = rule.validationConfig;
    if (!custom) {
      throw new Error('Custom configuration is required');
    }

    const customFunction = this.customValidations.get(custom.functionName);
    if (!customFunction) {
      throw new Error(`Custom validation function not found: ${custom.functionName}`);
    }

    return customFunction(data, custom.parameters);
  }

  private validateCrossField(data: any, rule: ValidationRule): any {
    // Implementation for cross-field validation
    return { isValid: true };
  }

  private validateBusinessRule(data: any, rule: ValidationRule): any {
    // Implementation for business rule validation
    return { isValid: true };
  }

  // Helper methods

  private async validateWithSchema(data: any, entityType: string): Promise<any> {
    const schema = this.entitySchemas.get(entityType);
    if (!schema) {
      return { success: true, errors: [] };
    }

    try {
      schema.parse(data);
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          ruleId: 'schema_validation',
          ruleName: 'Schema Validation',
          field: err.path.join('.'),
          message: err.message,
          severity: 'error' as const,
          actualValue: this.getFieldValue(data, err.path.join('.')),
          expectedConstraint: err.code
        }));

        return { success: false, errors };
      }

      throw error;
    }
  }

  private initializeDefaultSchemas(): void {
    this.entitySchemas.set('customer', QuickBooksCustomerSchema);
    this.entitySchemas.set('invoice', QuickBooksInvoiceSchema);
  }

  private initializeCustomFunctions(): void {
    // Initialize default custom transformation functions
    this.customTransformations.set('formatFullName', (value: any, params: any, data: any) => {
      const { firstNameField, lastNameField } = params;
      const firstName = this.getFieldValue(data, firstNameField) || '';
      const lastName = this.getFieldValue(data, lastNameField) || '';
      return `${firstName} ${lastName}`.trim();
    });

    this.customTransformations.set('calculateTax', (value: any, params: any, data: any) => {
      const { rate, amountField } = params;
      const amount = this.getFieldValue(data, amountField) || 0;
      return Number((amount * rate).toFixed(2));
    });

    // Initialize default custom validation functions
    this.customValidations.set('validateBusinessEmail', (data: any, params: any) => {
      const email = this.getFieldValue(data, params.emailField);
      const businessDomains = params.allowedDomains || [];

      if (!email) return { isValid: true };

      const domain = email.split('@')[1];
      const isValid = businessDomains.length === 0 || businessDomains.includes(domain);

      return {
        isValid,
        message: isValid ? undefined : 'Must use a business email address'
      };
    });
  }

  private async loadRulesForEntity(entityType: string): Promise<void> {
    try {
      // Load transformation rules
      const transformationRules = await prisma.dataTransformationRule.findMany({
        where: {
          entityType,
          isActive: true
        },
        orderBy: { priority: 'asc' }
      });

      this.transformationRules.set(entityType, transformationRules);

      // Load validation rules
      const validationRules = await prisma.dataValidationRule.findMany({
        where: {
          entityType,
          isActive: true
        }
      });

      this.validationRules.set(entityType, validationRules);

    } catch (error) {
      console.error(`Error loading rules for entity ${entityType}:`, error);
    }
  }

  private evaluateConditions(conditions: TransformationCondition[], data: any): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    let result = true;
    let currentLogicalOperator: 'and' | 'or' = 'and';

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(data, condition.field);
      const conditionResult = this.evaluateCondition(fieldValue, condition);

      if (currentLogicalOperator === 'and') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogicalOperator = condition.logicalOperator || 'and';
    }

    return result;
  }

  private evaluateCondition(fieldValue: any, condition: TransformationCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined;
      default:
        return false;
    }
  }

  private getFieldValue(data: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], data);
  }

  private setFieldValue(data: any, fieldPath: string, value: any): any {
    const keys = fieldPath.split('.');
    const result = JSON.parse(JSON.stringify(data));
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  }

  // Format utility methods
  private formatDate(value: any, pattern?: string, locale?: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    if (pattern) {
      // Simple pattern replacement - in production, use a proper date formatting library
      return pattern
        .replace('YYYY', date.getFullYear().toString())
        .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', date.getDate().toString().padStart(2, '0'));
    }

    return date.toLocaleDateString(locale);
  }

  private formatCurrency(value: any, locale?: string, options?: any): string {
    const number = Number(value);
    if (isNaN(number)) {
      throw new Error('Invalid number for currency formatting');
    }

    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: options?.currency || 'USD',
      ...options
    }).format(number);
  }

  private formatPhone(value: any, pattern?: string): string {
    const phone = String(value).replace(/\D/g, '');

    if (pattern) {
      // Apply custom pattern
      return pattern.replace(/X/g, () => phone.length > 0 ? phone.shift() : '');
    }

    // Default US phone format
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }

    return phone;
  }

  private formatEmail(value: any): string {
    return String(value).toLowerCase().trim();
  }

  private applyCustomFormat(value: any, pattern?: string): string {
    // Implementation for custom formatting
    return String(value);
  }

  private evaluateFormula(formula: string, dataType: string): any {
    // In a real implementation, use a safe expression evaluator
    // This is a simplified version for demonstration
    try {
      const result = eval(formula);

      switch (dataType) {
        case 'number':
          return Number(result);
        case 'string':
          return String(result);
        case 'boolean':
          return Boolean(result);
        case 'date':
          return new Date(result);
        default:
          return result;
      }
    } catch (error) {
      throw new Error(`Formula evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyCustomMerge(values: any[], customFunction?: string): any {
    if (!customFunction) {
      throw new Error('Custom merge function name is required');
    }

    const mergeFunction = this.customTransformations.get(customFunction);
    if (!mergeFunction) {
      throw new Error(`Custom merge function not found: ${customFunction}`);
    }

    return mergeFunction(values, {}, {});
  }

  // Validation utility methods
  private isValidEmail(value: any): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  }

  private isValidPhone(value: any): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return typeof value === 'string' && phoneRegex.test(value);
  }

  private isValidUrl(value: any): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private async auditPipelineExecution(
    entityType: string,
    operation: string,
    originalData: any,
    transformedData: any,
    transformationResult: TransformationResult,
    validationResult: ValidationResult,
    processingTime: number
  ): Promise<void> {
    try {
      await prisma.dataProcessingAudit.create({
        data: {
          entityType,
          operation,
          originalDataHash: this.generateDataHash(originalData),
          transformedDataHash: this.generateDataHash(transformedData),
          transformationRulesApplied: transformationResult.metadata.rulesApplied,
          validationRulesChecked: validationResult.metadata.rulesChecked,
          transformationErrors: transformationResult.errors.length,
          validationErrors: validationResult.errors.length,
          processingTime,
          metadata: {
            transformationWarnings: transformationResult.warnings.length,
            validationWarnings: validationResult.warnings.length
          }
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  private generateDataHash(data: any): string {
    // Simple hash generation - in production, use a proper hashing library
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 32);
  }
}

// Factory function
export function createDataTransformationPipeline(): QuickBooksDataTransformationPipeline {
  return new QuickBooksDataTransformationPipeline();
}

// Export types and schemas
export {
  QuickBooksCustomerSchema,
  QuickBooksInvoiceSchema
};

export type {
  TransformationRule,
  ValidationRule,
  TransformationCondition,
  TransformationConfig,
  ValidationConfig,
  TransformationType,
  ValidationType,
  TransformationResult,
  ValidationResult,
  TransformationError,
  TransformationWarning,
  ValidationError,
  ValidationWarning,
  PipelineConfig
};