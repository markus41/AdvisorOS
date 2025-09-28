import { Organization, User, Client, Document } from '@prisma/client'

export const mockOrganization: Partial<Organization> = {
  name: 'Test CPA Firm',
  subdomain: 'test-firm',
  subscriptionTier: 'professional',
}

export const mockAdminUser: Partial<User> = {
  email: 'admin@test-firm.com',
  name: 'Admin User',
  role: 'ADMIN',
  emailVerified: new Date(),
}

export const mockUser: Partial<User> = {
  email: 'user@test-firm.com',
  name: 'Regular User',
  role: 'USER',
  emailVerified: new Date(),
}

export const mockClient: Partial<Client> = {
  name: 'Acme Corporation',
  email: 'contact@acme.com',
  status: 'ACTIVE',
  phone: '555-0123',
  address: '123 Business St, City, ST 12345',
  taxId: '12-3456789',
}

export const mockDocument: Partial<Document> = {
  name: 'test-w2.pdf',
  type: 'W2',
  status: 'PROCESSED',
  size: 1024 * 50, // 50KB
  mimeType: 'application/pdf',
}

export const mockStripeCustomer = {
  id: 'cus_test123',
  email: 'admin@test-firm.com',
  name: 'Test CPA Firm',
  created: Date.now() / 1000,
  currency: 'usd',
}

export const mockStripeSubscription = {
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  current_period_start: Date.now() / 1000,
  current_period_end: (Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  items: {
    data: [{
      price: {
        id: 'price_professional',
        unit_amount: 9900, // $99.00
        currency: 'usd',
        recurring: { interval: 'month' },
      },
    }],
  },
}

export const mockQuickBooksToken = {
  access_token: 'test_access_token',
  refresh_token: 'test_refresh_token',
  token_type: 'Bearer',
  expires_in: 3600,
  x_refresh_token_expires_in: 8726400,
  realmId: 'test_realm_id',
}

export const mockW2Data = {
  employeeName: 'John Doe',
  employerName: 'Acme Corporation',
  employerEIN: '12-3456789',
  employeeSSN: '***-**-1234',
  wages: 75000,
  federalWithholding: 12000,
  socialSecurityWages: 75000,
  socialSecurityWithholding: 4650,
  medicareWages: 75000,
  medicareWithholding: 1087.50,
  stateWages: 75000,
  stateWithholding: 3000,
  state: 'CA',
}

export const mockBankStatementData = {
  accountNumber: '****1234',
  routingNumber: '123456789',
  accountType: 'CHECKING',
  bankName: 'Test Bank',
  statementPeriod: {
    start: '2024-01-01',
    end: '2024-01-31',
  },
  beginningBalance: 5000.00,
  endingBalance: 5500.00,
  transactions: [
    {
      date: '2024-01-15',
      description: 'DIRECT DEPOSIT PAYROLL',
      amount: 2500.00,
      type: 'CREDIT',
    },
    {
      date: '2024-01-16',
      description: 'OFFICE SUPPLIES',
      amount: -150.00,
      type: 'DEBIT',
    },
    {
      date: '2024-01-20',
      description: 'CLIENT PAYMENT',
      amount: 1200.00,
      type: 'CREDIT',
    },
  ],
}

export const mockFinancialReport = {
  reportType: 'PROFIT_LOSS',
  period: {
    start: '2024-01-01',
    end: '2024-03-31',
  },
  revenue: {
    serviceRevenue: 150000,
    otherIncome: 5000,
    total: 155000,
  },
  expenses: {
    salaries: 80000,
    rent: 12000,
    utilities: 3000,
    officeSupplies: 2000,
    marketing: 5000,
    total: 102000,
  },
  netIncome: 53000,
}

export const mockOCRResult = {
  status: 'succeeded',
  confidence: 0.95,
  extractedData: mockW2Data,
  rawText: 'W-2 Wage and Tax Statement...',
  boundingBoxes: [
    {
      field: 'employeeName',
      confidence: 0.98,
      coordinates: [100, 200, 300, 220],
      text: 'John Doe',
    },
  ],
}

export const mockAIInsight = {
  type: 'TAX_OPTIMIZATION',
  title: 'Potential Tax Savings Opportunity',
  description: 'Based on your financial data, you may be eligible for additional deductions.',
  confidence: 0.87,
  recommendations: [
    'Consider maximizing retirement contributions',
    'Review business expense categorization',
    'Evaluate equipment depreciation schedules',
  ],
  potentialSavings: 5000,
}

export const mockWorkflow = {
  name: 'Client Onboarding',
  description: 'Automated workflow for new client setup',
  trigger: 'CLIENT_CREATED',
  steps: [
    {
      type: 'SEND_EMAIL',
      config: {
        template: 'welcome',
        recipient: 'client',
      },
    },
    {
      type: 'CREATE_FOLDER',
      config: {
        name: 'Client Documents',
      },
    },
    {
      type: 'SCHEDULE_MEETING',
      config: {
        type: 'initial_consultation',
        duration: 60,
      },
    },
  ],
}

// Test file data
export const testPDFBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF')

export const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

export const testCSVContent = `Name,Email,Phone,Address
Acme Corp,contact@acme.com,555-0123,"123 Business St, City, ST 12345"
XYZ Inc,info@xyz.com,555-0456,"456 Commerce Ave, Town, ST 67890"`

// Helper functions for creating test data
export function createMockFile(name: string, content: string | Buffer, type: string) {
  const buffer = typeof content === 'string' ? Buffer.from(content) : content
  return new File([buffer], name, { type })
}

export function createMockW2File() {
  return createMockFile('w2-form.pdf', testPDFBuffer, 'application/pdf')
}

export function createMockBankStatementFile() {
  return createMockFile('bank-statement.pdf', testPDFBuffer, 'application/pdf')
}

export function createMockReceiptFile() {
  return createMockFile('receipt.jpg', testImageBuffer, 'image/jpeg')
}

export function createMockCSVFile() {
  return createMockFile('clients.csv', testCSVContent, 'text/csv')
}

// Test environment variables
export const testEnvVars = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/cpa_platform_test',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  AZURE_FORM_RECOGNIZER_ENDPOINT: 'https://test.cognitiveservices.azure.com/',
  AZURE_FORM_RECOGNIZER_KEY: 'test-key',
  AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com/',
  AZURE_OPENAI_KEY: 'test-key',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
  QB_CLIENT_ID: 'test-qb-client-id',
  QB_CLIENT_SECRET: 'test-qb-client-secret',
}