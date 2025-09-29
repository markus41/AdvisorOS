import { type Session } from 'next-auth'
import { type PrismaClient } from '@prisma/client'

/**
 * Mock context factory for TRPC testing
 */
export function createMockContext() {
  const mockPrisma = {
    // Organization operations
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // User operations
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // Client operations
    client: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      fields: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
    // Document operations
    document: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // Task operations
    task: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // Note operations
    note: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // Audit log operations
    auditLog: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // Transaction operations
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as unknown as jest.Mocked<PrismaClient>

  const mockSession: Session = {
    user: {
      id: 'user_test_123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
      organizationId: 'org_test_123',
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours from now
  }

  return {
    session: mockSession,
    prisma: mockPrisma,
    userId: 'user_test_123',
    organizationId: 'org_test_123',
    userRole: 'ADMIN' as const,
  }
}

/**
 * Mock context for unauthenticated requests
 */
export function createUnauthenticatedContext() {
  const mockPrisma = {
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as unknown as jest.Mocked<PrismaClient>

  return {
    session: null,
    prisma: mockPrisma,
    userId: null,
    organizationId: null,
    userRole: null,
  }
}

/**
 * Mock context for organization admin
 */
export function createOrgAdminContext() {
  const context = createMockContext()
  context.userRole = 'ORG_ADMIN'
  context.session.user.role = 'ORG_ADMIN'
  return context
}

/**
 * Mock context for regular user
 */
export function createUserContext() {
  const context = createMockContext()
  context.userRole = 'USER'
  context.session.user.role = 'USER'
  return context
}

/**
 * Mock context for manager
 */
export function createManagerContext() {
  const context = createMockContext()
  context.userRole = 'MANAGER'
  context.session.user.role = 'MANAGER'
  return context
}

/**
 * Helper to create mock client data
 */
export function createMockClient(overrides: Partial<any> = {}) {
  return {
    id: 'client_test_123',
    businessName: 'Test Business LLC',
    legalName: 'Test Business Legal Name LLC',
    primaryContactName: 'John Doe',
    primaryContactEmail: 'john@testbusiness.com',
    primaryContactPhone: '+1-555-123-4567',
    businessType: 'LLC',
    taxId: '12-3456789',
    businessAddress: '123 Business St',
    businessCity: 'Business City',
    businessState: 'BC',
    businessZip: '12345',
    businessCountry: 'US',
    mailingAddress: '123 Business St',
    mailingCity: 'Business City',
    mailingState: 'BC',
    mailingZip: '12345',
    mailingCountry: 'US',
    website: 'https://testbusiness.com',
    industry: 'Technology',
    incorporationDate: new Date('2020-01-01'),
    fiscalYearEnd: '12-31',
    businessDescription: 'A test business for unit testing',
    numberOfEmployees: 10,
    annualRevenue: 1000000,
    bankName: 'Test Bank',
    bankAccountNumber: '****1234',
    bankRoutingNumber: '123456789',
    status: 'ACTIVE',
    riskLevel: 'LOW',
    onboardingStatus: 'COMPLETED',
    portalAccess: true,
    quickbooksId: null,
    quickbooksCompanyId: null,
    lastQuickbooksSync: null,
    organizationId: 'org_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

/**
 * Helper to create mock user data
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user_test_123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    organizationId: 'org_test_123',
    emailVerified: new Date(),
    image: null,
    phone: null,
    jobTitle: 'Test Role',
    department: 'Testing',
    isActive: true,
    lastLoginAt: new Date(),
    preferences: {},
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock organization data
 */
export function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: 'org_test_123',
    name: 'Test CPA Firm',
    subdomain: 'test-firm',
    website: 'https://testfirm.com',
    phone: '+1-555-987-6543',
    email: 'info@testfirm.com',
    address: '456 CPA Plaza',
    city: 'Accounting City',
    state: 'AC',
    zip: '54321',
    country: 'US',
    logo: null,
    timezone: 'America/New_York',
    subscriptionTier: 'PROFESSIONAL',
    subscriptionStatus: 'ACTIVE',
    subscriptionEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
    stripeCustomerId: 'cus_test123',
    stripeSubscriptionId: 'sub_test123',
    settings: {
      allowClientPortal: true,
      requireTwoFactor: false,
      sessionTimeout: 3600,
    },
    features: ['CLIENT_PORTAL', 'DOCUMENT_MANAGEMENT', 'TASK_MANAGEMENT'],
    limits: {
      maxUsers: 50,
      maxClients: 1000,
      maxStorage: 100, // GB
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock document data
 */
export function createMockDocument(overrides: Partial<any> = {}) {
  return {
    id: 'doc_test_123',
    fileName: 'test-document.pdf',
    originalName: 'Test Document.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 1024, // 1MB
    category: 'TAX_DOCUMENTS',
    subcategory: 'W2',
    year: 2023,
    description: 'Test tax document',
    tags: ['tax', 'w2', '2023'],
    storageProvider: 'AZURE_BLOB',
    storagePath: 'documents/org_test_123/doc_test_123.pdf',
    storageUrl: 'https://storage.azure.com/documents/org_test_123/doc_test_123.pdf',
    publicUrl: null,
    metadata: {
      pageCount: 2,
      hasText: true,
      isEncrypted: false,
    },
    ocrStatus: 'COMPLETED',
    ocrText: 'Sample OCR extracted text',
    ocrConfidence: 0.95,
    aiAnalysis: {
      documentType: 'W2',
      extractedData: {
        employer: 'Test Company',
        employee: 'John Doe',
        year: 2023,
        wages: 50000,
      },
      confidence: 0.92,
    },
    isProcessed: true,
    processingStatus: 'COMPLETED',
    processingError: null,
    clientId: 'client_test_123',
    organizationId: 'org_test_123',
    uploadedBy: 'user_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock task data
 */
export function createMockTask(overrides: Partial<any> = {}) {
  return {
    id: 'task_test_123',
    title: 'Test Task',
    description: 'This is a test task for unit testing',
    status: 'PENDING',
    priority: 'MEDIUM',
    category: 'TAX_PREPARATION',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
    estimatedHours: 2,
    actualHours: null,
    assignedTo: 'user_test_123',
    createdBy: 'user_test_123',
    clientId: 'client_test_123',
    organizationId: 'org_test_123',
    dependencies: [],
    attachments: [],
    comments: [],
    tags: ['test', 'unit-testing'],
    metadata: {},
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock note data
 */
export function createMockNote(overrides: Partial<any> = {}) {
  return {
    id: 'note_test_123',
    title: 'Test Note',
    content: 'This is a test note for unit testing',
    noteType: 'GENERAL',
    priority: 'NORMAL',
    isPrivate: false,
    tags: ['test'],
    reminderDate: null,
    clientId: 'client_test_123',
    organizationId: 'org_test_123',
    createdBy: 'user_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to reset all mocks in a context
 */
export function resetMockContext(context: ReturnType<typeof createMockContext>) {
  Object.values(context.prisma).forEach(table => {
    if (typeof table === 'object' && table !== null) {
      Object.values(table).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockReset()
        }
      })
    }
  })
}

/**
 * Helper to create realistic pagination results
 */
export function createMockPaginationResult<T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
  total?: number
) {
  const actualTotal = total ?? items.length
  const totalPages = Math.ceil(actualTotal / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedItems = items.slice(startIndex, endIndex)

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: actualTotal,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Helper to create mock error responses
 */
export function createMockError(code: string, message: string, cause?: any) {
  const error = new Error(message)
  error.name = code
  if (cause) {
    error.cause = cause
  }
  return error
}