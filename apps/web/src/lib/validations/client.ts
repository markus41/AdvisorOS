import { z } from 'zod'

// Phone validation regex (supports various formats)
const phoneRegex = /^(\+?1[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}$/

// TIN/EIN validation regex (XX-XXXXXXX or XXXXXXXXX)
const tinRegex = /^(\d{2}-?\d{7})|(\d{9})$/

// Business email validation (stricter than regular email)
const businessEmailSchema = z.string().email().refine(
  (email) => {
    // Reject common personal email domains for business contacts
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'me.com', 'live.com'
    ]
    const domain = email.split('@')[1]?.toLowerCase()
    return !personalDomains.includes(domain)
  },
  {
    message: 'Please use a business email address'
  }
)

// Custom validation for business name
const businessNameSchema = z.string()
  .min(2, 'Business name must be at least 2 characters')
  .max(255, 'Business name must be less than 255 characters')
  .refine(
    (name) => {
      // Reject names that are too generic or suspicious
      const invalidNames = ['test', 'example', 'sample', 'demo', 'abc', 'xyz']
      return !invalidNames.includes(name.toLowerCase())
    },
    {
      message: 'Please enter a valid business name'
    }
  )

// Risk factors enum for risk assessment
export const RiskFactors = {
  HIGH_REVENUE: 'high_revenue',
  COMPLEX_STRUCTURE: 'complex_structure',
  MULTIPLE_JURISDICTIONS: 'multiple_jurisdictions',
  CASH_INTENSIVE: 'cash_intensive',
  REGULATORY_SCRUTINY: 'regulatory_scrutiny',
  PREVIOUS_ISSUES: 'previous_issues',
  NEW_CLIENT: 'new_client',
  RELATED_PARTIES: 'related_parties',
  INTERNATIONAL_OPERATIONS: 'international_operations',
  SIGNIFICANT_ESTIMATES: 'significant_estimates'
} as const

// Document categories enum
export const DocumentCategories = {
  TAX_RETURN: 'tax_return',
  FINANCIAL_STATEMENT: 'financial_statement',
  BANK_STATEMENT: 'bank_statement',
  RECEIPT: 'receipt',
  INVOICE: 'invoice',
  W2: 'w2',
  W9: 'w9',
  FORM_1099: '1099',
  PAYROLL: 'payroll',
  TRIAL_BALANCE: 'trial_balance',
  GENERAL_LEDGER: 'general_ledger',
  DEPRECIATION_SCHEDULE: 'depreciation_schedule',
  LOAN_DOCUMENTS: 'loan_documents',
  CONTRACTS: 'contracts',
  LICENSES: 'licenses',
  OTHER: 'other'
} as const

// Enhanced client validation schema with business rules
export const clientValidationSchema = z.object({
  // Basic Information
  businessName: businessNameSchema,
  legalName: z.string().max(255).optional(),
  taxId: z.string()
    .regex(tinRegex, 'Invalid Tax ID format. Use XX-XXXXXXX or XXXXXXXXX')
    .optional(),
  businessType: z.enum([
    'LLC', 'Corporation', 'Partnership', 'Sole Proprietorship',
    'S-Corp', 'C-Corp', 'Nonprofit', 'Trust', 'Estate'
  ]).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),

  // Contact Information
  primaryContactName: z.string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(255, 'Contact name must be less than 255 characters'),
  primaryContactEmail: z.string().email('Invalid email address'),
  primaryContactPhone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional(),

  // Addresses
  businessAddress: z.string().max(500).optional(),
  mailingAddress: z.string().max(500).optional(),

  // Financial Information
  annualRevenue: z.number()
    .min(0, 'Annual revenue cannot be negative')
    .max(1000000000, 'Annual revenue seems unusually high')
    .optional(),

  // Status and Risk
  status: z.enum(['active', 'inactive', 'prospect']),
  riskLevel: z.enum(['low', 'medium', 'high']),

  // Custom fields for additional data
  customFields: z.record(z.any()).optional(),
})

// Risk assessment schema
export const riskAssessmentSchema = z.object({
  clientId: z.string().cuid(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  assessmentDate: z.date().default(() => new Date()),
  assessmentNotes: z.string().max(1000).optional(),
  factors: z.array(z.nativeEnum(RiskFactors)).optional(),
  assessedBy: z.string().cuid(),

  // Specific risk criteria
  criteria: z.object({
    revenueRisk: z.enum(['low', 'medium', 'high']).optional(),
    complexityRisk: z.enum(['low', 'medium', 'high']).optional(),
    complianceRisk: z.enum(['low', 'medium', 'high']).optional(),
    industryRisk: z.enum(['low', 'medium', 'high']).optional(),
    managementRisk: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),

  // Overall assessment
  overallAssessment: z.string().max(2000).optional(),
  recommendedActions: z.array(z.string()).optional(),
  nextReviewDate: z.date().optional(),
})

// Document requirement schema
export const documentRequirementSchema = z.object({
  clientId: z.string().cuid(),
  category: z.nativeEnum(DocumentCategories),
  required: z.boolean(),
  frequency: z.enum(['monthly', 'quarterly', 'annually', 'as_needed']).optional(),
  dueDate: z.date().optional(),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),

  // Compliance requirements
  isRegulatory: z.boolean().default(false),
  regulatoryBody: z.string().max(100).optional(),
  penaltyForNonCompliance: z.string().max(500).optional(),
})

// Note creation schema
export const clientNoteSchema = z.object({
  clientId: z.string().cuid(),
  title: z.string().max(255).optional(),
  content: z.string()
    .min(1, 'Note content is required')
    .max(5000, 'Note content is too long'),
  noteType: z.enum(['general', 'meeting', 'reminder', 'follow_up', 'warning', 'compliance']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  isPrivate: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  reminderDate: z.date().optional(),

  // Meeting-specific fields
  meetingDate: z.date().optional(),
  attendees: z.array(z.string()).optional(),
  meetingType: z.enum(['phone', 'video', 'in_person', 'email']).optional(),

  // Follow-up fields
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  assignedTo: z.string().cuid().optional(),
})

// Bulk operation validation
export const bulkClientOperationSchema = z.object({
  action: z.enum([
    'delete', 'archive', 'activate', 'updateStatus',
    'updateRiskLevel', 'assignTo', 'addTag', 'removeTag'
  ]),
  clientIds: z.array(z.string().cuid())
    .min(1, 'At least one client must be selected')
    .max(100, 'Cannot process more than 100 clients at once'),
  data: z.record(z.any()).optional(),
  reason: z.string().max(500).optional(),
  notifyClients: z.boolean().default(false),
})

// CSV import validation
export const csvImportSchema = z.object({
  file: z.any(), // File object
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateEmails: z.boolean().default(true),
    requireBusinessEmail: z.boolean().default(false),
    mapping: z.record(z.string()).optional(),

    // Data cleaning options
    trimWhitespace: z.boolean().default(true),
    normalizePhoneNumbers: z.boolean().default(true),
    validateTaxIds: z.boolean().default(true),
  })
})

// Client filter schema with enhanced filtering
export const clientFilterSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  businessType: z.array(z.string()).optional(),
  riskLevel: z.array(z.string()).optional(),
  industry: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  assignedTo: z.string().cuid().optional(),

  // QuickBooks integration
  hasQuickBooks: z.boolean().optional(),
  qbSyncStatus: z.enum(['synced', 'pending', 'error', 'never']).optional(),

  // Financial filters
  annualRevenueMin: z.number().min(0).optional(),
  annualRevenueMax: z.number().min(0).optional(),

  // Date filters
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  lastContactAfter: z.date().optional(),
  lastContactBefore: z.date().optional(),

  // Document filters
  missingDocuments: z.boolean().optional(),
  overdueDocuments: z.boolean().optional(),

  // Engagement filters
  hasActiveEngagements: z.boolean().optional(),
  engagementType: z.array(z.string()).optional(),

  // Invoice filters
  hasUnpaidInvoices: z.boolean().optional(),
  overdueInvoices: z.boolean().optional(),

  // Geographic filters
  state: z.string().max(2).optional(),
  city: z.string().max(100).optional(),
  zipCode: z.string().max(10).optional(),
})

// Business rules validation
export const validateBusinessRules = {
  // Check if client can be deleted
  canDeleteClient: z.object({
    clientId: z.string().cuid(),
    checkActiveEngagements: z.boolean().default(true),
    checkUnpaidInvoices: z.boolean().default(true),
    checkDocuments: z.boolean().default(false),
  }),

  // Check if client can be archived
  canArchiveClient: z.object({
    clientId: z.string().cuid(),
    reason: z.string().max(500).optional(),
  }),

  // Validate TIN/EIN uniqueness
  validateTaxIdUniqueness: z.object({
    taxId: z.string().regex(tinRegex),
    excludeClientId: z.string().cuid().optional(),
    organizationId: z.string().cuid(),
  }),

  // Validate business name uniqueness
  validateBusinessNameUniqueness: z.object({
    businessName: z.string().min(2),
    excludeClientId: z.string().cuid().optional(),
    organizationId: z.string().cuid(),
  }),
}

// Export validation functions
export const clientValidation = {
  // Validate client data before creation
  validateClientCreation: (data: any) => clientValidationSchema.parse(data),

  // Validate risk assessment
  validateRiskAssessment: (data: any) => riskAssessmentSchema.parse(data),

  // Validate document requirements
  validateDocumentRequirement: (data: any) => documentRequirementSchema.parse(data),

  // Validate note creation
  validateClientNote: (data: any) => clientNoteSchema.parse(data),

  // Validate bulk operations
  validateBulkOperation: (data: any) => bulkClientOperationSchema.parse(data),

  // Validate CSV import
  validateCsvImport: (data: any) => csvImportSchema.parse(data),

  // Custom validation functions
  isValidTaxId: (taxId: string) => tinRegex.test(taxId),
  isValidPhoneNumber: (phone: string) => phoneRegex.test(phone),
  isBusinessEmail: (email: string) => {
    try {
      businessEmailSchema.parse(email)
      return true
    } catch {
      return false
    }
  },

  // Business rule validations
  validateBusinessRules: validateBusinessRules,
}

// Type exports
export type ClientValidationData = z.infer<typeof clientValidationSchema>
export type RiskAssessmentData = z.infer<typeof riskAssessmentSchema>
export type DocumentRequirementData = z.infer<typeof documentRequirementSchema>
export type ClientNoteData = z.infer<typeof clientNoteSchema>
export type BulkClientOperationData = z.infer<typeof bulkClientOperationSchema>
export type CsvImportData = z.infer<typeof csvImportSchema>
export type ClientFilterData = z.infer<typeof clientFilterSchema>