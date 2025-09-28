// Database Types
export interface Organization {
  id: string
  name: string
  subdomain: string
  subscriptionTier: 'trial' | 'basic' | 'professional' | 'enterprise'
  stripeCustomerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'cpa' | 'staff'
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  businessName: string
  taxId?: string
  quickbooksId?: string
  organizationId: string
  primaryContactEmail: string
  primaryContactName: string
  status: 'active' | 'inactive' | 'archived'
  financialData?: any
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  category: 'tax_return' | 'financial_statement' | 'receipt' | 'contract' | 'other'
  year?: number
  clientId: string
  organizationId: string
  uploadedBy: string
  extractedData?: any
  createdAt: Date
  updatedAt: Date
}

export interface QuickBooksToken {
  id: string
  organizationId: string
  accessToken: string
  refreshToken: string
  realmId: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  content: string
  clientId: string
  authorId: string
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form Types
export interface CreateOrganizationForm {
  name: string
  subdomain: string
}

export interface CreateUserForm {
  email: string
  name: string
  role: User['role']
}

export interface CreateClientForm {
  businessName: string
  taxId?: string
  primaryContactEmail: string
  primaryContactName: string
}

// QuickBooks Integration Types
export interface QuickBooksCompany {
  id: string
  name: string
  country: string
}

export interface QuickBooksCustomer {
  id: string
  name: string
  email?: string
  phone?: string
}

// Dashboard Types
export interface DashboardStats {
  totalClients: number
  activeClients: number
  totalDocuments: number
  recentDocuments: number
}