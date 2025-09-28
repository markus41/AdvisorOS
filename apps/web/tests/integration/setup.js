const { execSync } = require('child_process')
const { PrismaClient } = require('@cpa-platform/database')

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/cpa_platform_test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Initialize Prisma client for tests
global.prisma = new PrismaClient()

// Mock external services
jest.mock('stripe', () => ({
  Stripe: jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    invoices: {
      create: jest.fn(),
      retrieve: jest.fn(),
      pay: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  })),
}))

jest.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: jest.fn().mockImplementation(() => ({
    beginAnalyzeDocument: jest.fn(),
  })),
  AzureKeyCredential: jest.fn(),
}))

jest.mock('@azure/openai', () => ({
  OpenAIClient: jest.fn().mockImplementation(() => ({
    getChatCompletions: jest.fn(),
  })),
  AzureKeyCredential: jest.fn(),
}))

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}))

// Database setup and teardown
beforeAll(async () => {
  // Reset database schema
  try {
    execSync('npx prisma migrate reset --force --skip-seed', {
      cwd: process.cwd(),
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn('Could not reset database:', error.message)
  }

  // Run migrations
  try {
    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn('Could not run migrations:', error.message)
  }

  // Connect to database
  await global.prisma.$connect()
})

beforeEach(async () => {
  // Clean up database before each test
  const tablenames = await global.prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await global.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
      } catch (error) {
        console.log({ error })
      }
    }
  }
})

afterAll(async () => {
  await global.prisma.$disconnect()
})

// Mock fetch for external API calls
global.fetch = jest.fn()

// Helper function to create test organizations
global.createTestOrganization = async (overrides = {}) => {
  return await global.prisma.organization.create({
    data: {
      name: 'Test CPA Firm',
      subdomain: 'test-firm',
      subscriptionTier: 'trial',
      ...overrides,
    },
  })
}

// Helper function to create test users
global.createTestUser = async (organizationId, overrides = {}) => {
  return await global.prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      organizationId,
      emailVerified: new Date(),
      ...overrides,
    },
  })
}

// Helper function to create test clients
global.createTestClient = async (organizationId, overrides = {}) => {
  return await global.prisma.client.create({
    data: {
      name: 'Test Client',
      email: 'client@example.com',
      organizationId,
      status: 'ACTIVE',
      ...overrides,
    },
  })
}