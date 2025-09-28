import { z } from 'zod'

// Enums for client-related fields
export const ClientStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PROSPECT: 'prospect',
} as const

export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export const BusinessType = {
  LLC: 'LLC',
  CORPORATION: 'Corporation',
  PARTNERSHIP: 'Partnership',
  SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
  S_CORP: 'S-Corp',
  C_CORP: 'C-Corp',
  NONPROFIT: 'Nonprofit',
} as const

export const ServiceType = {
  TAX_PREPARATION: 'tax_preparation',
  BOOKKEEPING: 'bookkeeping',
  PAYROLL: 'payroll',
  ADVISORY: 'advisory',
  CFO_SERVICES: 'cfo_services',
  AUDIT: 'audit',
  REVIEW: 'review',
  COMPILATION: 'compilation',
} as const

// Base client type from Prisma
export interface Client {
  id: string
  businessName: string
  legalName?: string | null
  taxId?: string | null
  quickbooksId?: string | null
  organizationId: string
  primaryContactEmail: string
  primaryContactName: string
  primaryContactPhone?: string | null
  businessAddress?: string | null
  mailingAddress?: string | null
  businessType?: string | null
  industry?: string | null
  website?: string | null
  status: string
  riskLevel: string
  annualRevenue?: number | null
  financialData?: any
  customFields?: any
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  updatedBy?: string | null
}

// Extended client with relationships
export interface ClientWithRelations extends Client {
  documents?: any[]
  notes?: any[]
  engagements?: any[]
  invoices?: any[]
  _count?: {
    documents: number
    engagements: number
    invoices: number
    notes: number
  }
}

// Contact information for clients
export interface ClientContact {
  id?: string
  name: string
  email: string
  phone?: string
  title?: string
  isPrimary: boolean
  notes?: string
}

// Service selection for clients
export interface ClientService {
  serviceType: string
  isActive: boolean
  rate?: number
  notes?: string
  frequency?: string // monthly, quarterly, annually
}

// QuickBooks integration data
export interface QuickBooksConnection {
  isConnected: boolean
  customerId?: string
  companyName?: string
  lastSyncAt?: Date
  syncEnabled: boolean
}

// Document requirements for clients
export interface DocumentRequirement {
  category: string
  required: boolean
  dueDate?: Date
  notes?: string
  frequency?: string
}

// Billing setup for clients
export interface BillingSetup {
  billingMethod: 'hourly' | 'fixed' | 'retainer'
  defaultRate?: number
  paymentTerms: 'net_15' | 'net_30' | 'due_on_receipt'
  currency: string
  taxRate?: number
  billingAddress?: string
  invoiceEmail?: string
}

// Zod validation schemas
export const createClientSchema = z.object({
  // Step 1: Basic Information
  businessName: z.string().min(1, 'Business name is required').max(255),
  legalName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  businessType: z.string().optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),

  // Step 2: Contact Details
  primaryContactName: z.string().min(1, 'Primary contact name is required').max(255),
  primaryContactEmail: z.string().email('Invalid email address'),
  primaryContactPhone: z.string().max(50).optional(),
  businessAddress: z.string().max(500).optional(),
  mailingAddress: z.string().max(500).optional(),
  additionalContacts: z.array(z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    title: z.string().max(100).optional(),
    isPrimary: z.boolean().default(false),
    notes: z.string().max(500).optional(),
  })).optional(),

  // Step 3: Services
  services: z.array(z.object({
    serviceType: z.string(),
    isActive: z.boolean(),
    rate: z.number().min(0).optional(),
    notes: z.string().max(500).optional(),
    frequency: z.string().optional(),
  })).optional(),

  // Step 4: QuickBooks
  quickbooksConnection: z.object({
    isConnected: z.boolean().default(false),
    customerId: z.string().optional(),
    companyName: z.string().optional(),
    syncEnabled: z.boolean().default(false),
  }).optional(),

  // Step 5: Document Requirements
  documentRequirements: z.array(z.object({
    category: z.string(),
    required: z.boolean(),
    dueDate: z.date().optional(),
    notes: z.string().max(500).optional(),
    frequency: z.string().optional(),
  })).optional(),

  // Step 6: Billing Setup
  billingSetup: z.object({
    billingMethod: z.enum(['hourly', 'fixed', 'retainer']),
    defaultRate: z.number().min(0).optional(),
    paymentTerms: z.enum(['net_15', 'net_30', 'due_on_receipt']),
    currency: z.string().default('USD'),
    taxRate: z.number().min(0).max(100).optional(),
    billingAddress: z.string().max(500).optional(),
    invoiceEmail: z.string().email().optional(),
  }).optional(),

  // Additional fields
  status: z.enum(['active', 'inactive', 'prospect']).default('prospect'),
  riskLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  annualRevenue: z.number().min(0).optional(),
  customFields: z.record(z.any()).optional(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().cuid(),
})

export const clientFilterSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  businessType: z.array(z.string()).optional(),
  riskLevel: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  hasQuickBooks: z.boolean().optional(),
  annualRevenueMin: z.number().min(0).optional(),
  annualRevenueMax: z.number().min(0).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
})

export const clientSortSchema = z.object({
  field: z.enum([
    'businessName',
    'status',
    'riskLevel',
    'annualRevenue',
    'createdAt',
    'updatedAt',
  ]).default('businessName'),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

export const clientPaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

export const bulkClientActionSchema = z.object({
  action: z.enum(['delete', 'archive', 'activate', 'updateStatus', 'assignTo']),
  clientIds: z.array(z.string().cuid()).min(1),
  data: z.record(z.any()).optional(),
})

export const importClientSchema = z.object({
  file: z.any(), // File will be handled separately
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  mapping: z.record(z.string()).optional(), // CSV field mapping
})

export const exportClientSchema = z.object({
  format: z.enum(['csv', 'excel']).default('csv'),
  fields: z.array(z.string()).optional(),
  filters: clientFilterSchema.optional(),
  includeArchived: z.boolean().default(false),
})

// API Response types
export interface ClientListResponse {
  clients: ClientWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: Record<string, any>
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export interface ClientStatsResponse {
  totalClients: number
  activeClients: number
  prospectClients: number
  inactiveClients: number
  totalRevenue: number
  averageRevenue: number
  quickBooksConnected: number
  recentlyAdded: number
  byBusinessType: Record<string, number>
  byRiskLevel: Record<string, number>
  byStatus: Record<string, number>
}

export interface BulkOperationResponse {
  success: boolean
  processed: number
  errors: Array<{
    clientId: string
    error: string
  }>
  summary: string
}

export interface ImportResult {
  success: boolean
  totalRows: number
  imported: number
  updated: number
  skipped: number
  errors: Array<{
    row: number
    field: string
    error: string
  }>
}

// Form step types for multi-step client form
export type ClientFormStep =
  | 'basic'
  | 'contacts'
  | 'services'
  | 'quickbooks'
  | 'documents'
  | 'billing'

export interface ClientFormData {
  // Basic Information
  businessName: string
  legalName?: string
  taxId?: string
  businessType?: string
  industry?: string
  website?: string

  // Contact Details
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone?: string
  businessAddress?: string
  mailingAddress?: string
  additionalContacts?: ClientContact[]

  // Services
  services?: ClientService[]

  // QuickBooks
  quickbooksConnection?: QuickBooksConnection

  // Document Requirements
  documentRequirements?: DocumentRequirement[]

  // Billing Setup
  billingSetup?: BillingSetup

  // Additional
  status: string
  riskLevel: string
  annualRevenue?: number
  customFields?: Record<string, any>
}

// Navigation helpers
export const CLIENT_ROUTES = {
  LIST: '/clients',
  CREATE: '/clients/new',
  DETAIL: (id: string) => `/clients/${id}`,
  EDIT: (id: string) => `/clients/${id}/edit`,
  IMPORT: '/clients/import',
  EXPORT: '/clients/export',
} as const

// Default values
export const DEFAULT_CLIENT_FORM: Partial<ClientFormData> = {
  status: ClientStatus.PROSPECT,
  riskLevel: RiskLevel.MEDIUM,
  services: [],
  additionalContacts: [],
  documentRequirements: [],
  customFields: {},
}

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ClientFilterInput = z.infer<typeof clientFilterSchema>
export type ClientSortInput = z.infer<typeof clientSortSchema>
export type ClientPaginationInput = z.infer<typeof clientPaginationSchema>
export type BulkClientActionInput = z.infer<typeof bulkClientActionSchema>
export type ImportClientInput = z.infer<typeof importClientSchema>
export type ExportClientInput = z.infer<typeof exportClientSchema>