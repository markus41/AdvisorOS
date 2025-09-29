/**
 * Test Data Manager
 *
 * Centralized test data management system for AdvisorOS testing framework.
 * Handles creation, cleanup, and management of test data across all test types.
 */

import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

export interface TestDataConfig {
  organizations: number
  usersPerOrg: number
  clientsPerOrg: number
  documentsPerClient: number
  tasksPerClient: number
  cleanup: boolean
  persistData: boolean
}

export interface TestOrganization {
  id: string
  name: string
  subdomain: string
  users: TestUser[]
  clients: TestClient[]
}

export interface TestUser {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
}

export interface TestClient {
  id: string
  businessName: string
  email: string
  organizationId: string
  documents: TestDocument[]
  tasks: TestTask[]
}

export interface TestDocument {
  id: string
  fileName: string
  category: string
  clientId: string
  organizationId: string
}

export interface TestTask {
  id: string
  title: string
  status: string
  clientId: string
  organizationId: string
}

export class TestDataManager {
  private prisma: PrismaClient
  private createdData: Map<string, any[]> = new Map()
  private config: TestDataConfig

  constructor(prisma: PrismaClient, config: Partial<TestDataConfig> = {}) {
    this.prisma = prisma
    this.config = {
      organizations: 2,
      usersPerOrg: 3,
      clientsPerOrg: 5,
      documentsPerClient: 3,
      tasksPerClient: 2,
      cleanup: true,
      persistData: false,
      ...config,
    }
  }

  /**
   * Create comprehensive test data for all test scenarios
   */
  async createTestDataset(scenarioName: string): Promise<{
    organizations: TestOrganization[]
    totalUsers: number
    totalClients: number
    totalDocuments: number
    totalTasks: number
  }> {
    console.log(`Creating test dataset: ${scenarioName}`)

    const organizations: TestOrganization[] = []
    let totalUsers = 0
    let totalClients = 0
    let totalDocuments = 0
    let totalTasks = 0

    try {
      // Create organizations
      for (let orgIndex = 0; orgIndex < this.config.organizations; orgIndex++) {
        const org = await this.createOrganization(scenarioName, orgIndex)
        organizations.push(org)

        // Create users for organization
        const users = await this.createUsersForOrganization(org.id, this.config.usersPerOrg)
        org.users = users
        totalUsers += users.length

        // Create clients for organization
        const clients = await this.createClientsForOrganization(org.id, this.config.clientsPerOrg)
        org.clients = clients
        totalClients += clients.length

        // Create documents and tasks for each client
        for (const client of clients) {
          const documents = await this.createDocumentsForClient(client.id, org.id, this.config.documentsPerClient)
          client.documents = documents
          totalDocuments += documents.length

          const tasks = await this.createTasksForClient(client.id, org.id, users[0].id, this.config.tasksPerClient)
          client.tasks = tasks
          totalTasks += tasks.length
        }
      }

      // Persist data metadata if requested
      if (this.config.persistData) {
        await this.persistDataMetadata(scenarioName, organizations)
      }

      console.log(`Test dataset created: ${scenarioName}`, {
        organizations: organizations.length,
        totalUsers,
        totalClients,
        totalDocuments,
        totalTasks,
      })

      return {
        organizations,
        totalUsers,
        totalClients,
        totalDocuments,
        totalTasks,
      }
    } catch (error) {
      console.error(`Failed to create test dataset: ${scenarioName}`, error)
      await this.cleanup()
      throw error
    }
  }

  /**
   * Create a single test organization
   */
  private async createOrganization(scenarioName: string, index: number): Promise<TestOrganization> {
    const orgData = {
      name: `${scenarioName} Test Firm ${index + 1}`,
      subdomain: `${scenarioName.toLowerCase()}-firm-${index + 1}`,
      website: faker.internet.url(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip: faker.location.zipCode(),
      country: 'US',
      timezone: 'America/New_York',
      subscriptionTier: faker.helpers.arrayElement(['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
      subscriptionStatus: 'ACTIVE',
      subscriptionEndsAt: faker.date.future(),
      settings: {
        allowClientPortal: faker.datatype.boolean(),
        requireTwoFactor: faker.datatype.boolean(),
        sessionTimeout: faker.number.int({ min: 1800, max: 7200 }),
      },
      features: faker.helpers.arrayElements([
        'CLIENT_PORTAL',
        'DOCUMENT_MANAGEMENT',
        'TASK_MANAGEMENT',
        'QUICKBOOKS_INTEGRATION',
        'AI_ANALYSIS',
        'ADVANCED_REPORTING',
      ]),
      limits: {
        maxUsers: faker.number.int({ min: 10, max: 100 }),
        maxClients: faker.number.int({ min: 100, max: 1000 }),
        maxStorage: faker.number.int({ min: 50, max: 500 }),
      },
      isActive: true,
    }

    const organization = await this.prisma.organization.create({
      data: orgData,
    })

    this.trackCreatedData('organizations', organization)

    return {
      id: organization.id,
      name: organization.name,
      subdomain: organization.subdomain,
      users: [],
      clients: [],
    }
  }

  /**
   * Create test users for an organization
   */
  private async createUsersForOrganization(organizationId: string, count: number): Promise<TestUser[]> {
    const users: TestUser[] = []

    const roles = ['ADMIN', 'MANAGER', 'USER']

    for (let i = 0; i < count; i++) {
      const userData = {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: i === 0 ? 'ADMIN' : faker.helpers.arrayElement(roles),
        organizationId,
        emailVerified: faker.date.past(),
        phone: faker.phone.number(),
        jobTitle: faker.person.jobTitle(),
        department: faker.helpers.arrayElement(['Accounting', 'Tax', 'Audit', 'Advisory']),
        isActive: true,
        lastLoginAt: faker.date.recent(),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
          language: 'en',
          notifications: {
            email: faker.datatype.boolean(),
            push: faker.datatype.boolean(),
            sms: faker.datatype.boolean(),
          },
        },
        permissions: faker.helpers.arrayElements([
          'READ_CLIENTS',
          'WRITE_CLIENTS',
          'READ_DOCUMENTS',
          'WRITE_DOCUMENTS',
          'READ_TASKS',
          'WRITE_TASKS',
          'READ_REPORTS',
          'ADMIN_SETTINGS',
        ]),
      }

      const user = await this.prisma.user.create({
        data: userData,
      })

      this.trackCreatedData('users', user)

      users.push({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      })
    }

    return users
  }

  /**
   * Create test clients for an organization
   */
  private async createClientsForOrganization(organizationId: string, count: number): Promise<TestClient[]> {
    const clients: TestClient[] = []

    const businessTypes = ['LLC', 'CORPORATION', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP']
    const industries = ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Real Estate']
    const statuses = ['ACTIVE', 'INACTIVE', 'PROSPECT']

    for (let i = 0; i < count; i++) {
      const businessName = faker.company.name()
      const clientData = {
        businessName,
        legalName: `${businessName} ${faker.helpers.arrayElement(['LLC', 'Inc.', 'Corp.'])}`,
        primaryContactName: faker.person.fullName(),
        primaryContactEmail: faker.internet.email(),
        primaryContactPhone: faker.phone.number(),
        businessType: faker.helpers.arrayElement(businessTypes),
        taxId: `${faker.string.numeric(2)}-${faker.string.numeric(7)}`,
        businessAddress: faker.location.streetAddress(),
        businessCity: faker.location.city(),
        businessState: faker.location.state({ abbreviated: true }),
        businessZip: faker.location.zipCode(),
        businessCountry: 'US',
        mailingAddress: faker.location.streetAddress(),
        mailingCity: faker.location.city(),
        mailingState: faker.location.state({ abbreviated: true }),
        mailingZip: faker.location.zipCode(),
        mailingCountry: 'US',
        website: faker.internet.url(),
        industry: faker.helpers.arrayElement(industries),
        incorporationDate: faker.date.past({ years: 10 }),
        fiscalYearEnd: faker.helpers.arrayElement(['12-31', '06-30', '09-30', '03-31']),
        businessDescription: faker.company.catchPhrase(),
        numberOfEmployees: faker.number.int({ min: 1, max: 500 }),
        annualRevenue: faker.number.int({ min: 50000, max: 10000000 }),
        bankName: faker.company.name() + ' Bank',
        bankAccountNumber: `****${faker.string.numeric(4)}`,
        bankRoutingNumber: faker.string.numeric(9),
        status: faker.helpers.arrayElement(statuses),
        riskLevel: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
        onboardingStatus: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
        portalAccess: faker.datatype.boolean(),
        organizationId,
      }

      const client = await this.prisma.client.create({
        data: clientData,
      })

      this.trackCreatedData('clients', client)

      clients.push({
        id: client.id,
        businessName: client.businessName,
        email: client.primaryContactEmail,
        organizationId: client.organizationId,
        documents: [],
        tasks: [],
      })
    }

    return clients
  }

  /**
   * Create test documents for a client
   */
  private async createDocumentsForClient(
    clientId: string,
    organizationId: string,
    count: number
  ): Promise<TestDocument[]> {
    const documents: TestDocument[] = []

    const categories = ['TAX_DOCUMENTS', 'FINANCIAL_STATEMENTS', 'BANK_STATEMENTS', 'RECEIPTS', 'INVOICES']
    const subcategories = ['W2', '1099', 'K1', 'BALANCE_SHEET', 'INCOME_STATEMENT', 'BANK_STATEMENT']
    const fileTypes = ['pdf', 'xlsx', 'docx', 'png', 'jpg']

    for (let i = 0; i < count; i++) {
      const fileType = faker.helpers.arrayElement(fileTypes)
      const documentData = {
        fileName: `test-document-${i + 1}.${fileType}`,
        originalName: `Test Document ${i + 1}.${fileType}`,
        mimeType: getMimeType(fileType),
        size: faker.number.int({ min: 50000, max: 5000000 }),
        category: faker.helpers.arrayElement(categories),
        subcategory: faker.helpers.arrayElement(subcategories),
        year: faker.date.recent().getFullYear(),
        description: faker.lorem.sentence(),
        tags: faker.helpers.arrayElements(['important', 'reviewed', 'tax-related', 'financial']),
        storageProvider: 'AZURE_BLOB',
        storagePath: `documents/${organizationId}/${clientId}/test-document-${i + 1}.${fileType}`,
        storageUrl: faker.internet.url(),
        ocrStatus: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
        ocrText: faker.lorem.paragraphs(3),
        ocrConfidence: faker.number.float({ min: 0.7, max: 0.99 }),
        aiAnalysis: {
          documentType: faker.helpers.arrayElement(subcategories),
          extractedData: {
            amount: faker.number.float({ min: 100, max: 10000 }),
            date: faker.date.recent(),
            vendor: faker.company.name(),
          },
          confidence: faker.number.float({ min: 0.8, max: 0.99 }),
        },
        isProcessed: faker.datatype.boolean(),
        processingStatus: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
        clientId,
        organizationId,
        uploadedBy: faker.string.uuid(), // Would be a real user ID in practice
      }

      const document = await this.prisma.document.create({
        data: documentData,
      })

      this.trackCreatedData('documents', document)

      documents.push({
        id: document.id,
        fileName: document.fileName,
        category: document.category,
        clientId: document.clientId,
        organizationId: document.organizationId,
      })
    }

    return documents
  }

  /**
   * Create test tasks for a client
   */
  private async createTasksForClient(
    clientId: string,
    organizationId: string,
    assignedTo: string,
    count: number
  ): Promise<TestTask[]> {
    const tasks: TestTask[] = []

    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const categories = ['TAX_PREPARATION', 'AUDIT', 'BOOKKEEPING', 'ADVISORY', 'COMPLIANCE']

    for (let i = 0; i < count; i++) {
      const taskData = {
        title: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(statuses),
        priority: faker.helpers.arrayElement(priorities),
        category: faker.helpers.arrayElement(categories),
        dueDate: faker.date.future(),
        estimatedHours: faker.number.int({ min: 1, max: 40 }),
        actualHours: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 50 }) : null,
        assignedTo,
        createdBy: assignedTo,
        clientId,
        organizationId,
        dependencies: [],
        attachments: [],
        comments: [],
        tags: faker.helpers.arrayElements(['urgent', 'tax-season', 'review-required']),
        metadata: {
          source: 'test',
          automationId: faker.string.uuid(),
        },
        completedAt: faker.datatype.boolean() ? faker.date.recent() : null,
      }

      const task = await this.prisma.task.create({
        data: taskData,
      })

      this.trackCreatedData('tasks', task)

      tasks.push({
        id: task.id,
        title: task.title,
        status: task.status,
        clientId: task.clientId,
        organizationId: task.organizationId,
      })
    }

    return tasks
  }

  /**
   * Create minimal test data for specific tests
   */
  async createMinimalTestData(): Promise<{
    organization: TestOrganization
    user: TestUser
    client: TestClient
  }> {
    const organization = await this.createOrganization('minimal', 0)
    const users = await this.createUsersForOrganization(organization.id, 1)
    const clients = await this.createClientsForOrganization(organization.id, 1)

    organization.users = users
    organization.clients = clients

    return {
      organization,
      user: users[0],
      client: clients[0],
    }
  }

  /**
   * Create performance test data with realistic scale
   */
  async createPerformanceTestData(): Promise<void> {
    const config: TestDataConfig = {
      organizations: 10,
      usersPerOrg: 20,
      clientsPerOrg: 100,
      documentsPerClient: 10,
      tasksPerClient: 5,
      cleanup: false,
      persistData: true,
    }

    const oldConfig = this.config
    this.config = config

    try {
      await this.createTestDataset('performance')
      console.log('Performance test data created successfully')
    } finally {
      this.config = oldConfig
    }
  }

  /**
   * Create E2E test data with realistic user journeys
   */
  async createE2ETestData(): Promise<TestOrganization[]> {
    const config: TestDataConfig = {
      organizations: 3,
      usersPerOrg: 5,
      clientsPerOrg: 15,
      documentsPerClient: 5,
      tasksPerClient: 3,
      cleanup: false,
      persistData: true,
    }

    const oldConfig = this.config
    this.config = config

    try {
      const result = await this.createTestDataset('e2e')
      return result.organizations
    } finally {
      this.config = oldConfig
    }
  }

  /**
   * Track created data for cleanup purposes
   */
  private trackCreatedData(type: string, data: any): void {
    if (!this.createdData.has(type)) {
      this.createdData.set(type, [])
    }
    this.createdData.get(type)!.push(data)
  }

  /**
   * Persist test data metadata for debugging and analysis
   */
  private async persistDataMetadata(scenarioName: string, organizations: TestOrganization[]): Promise<void> {
    const metadata = {
      scenarioName,
      createdAt: new Date().toISOString(),
      config: this.config,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        userCount: org.users.length,
        clientCount: org.clients.length,
        documentCount: org.clients.reduce((sum, client) => sum + client.documents.length, 0),
        taskCount: org.clients.reduce((sum, client) => sum + client.tasks.length, 0),
      })),
    }

    const metadataPath = path.join(process.cwd(), 'test-data', `${scenarioName}-metadata.json`)
    await fs.mkdir(path.dirname(metadataPath), { recursive: true })
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Clean up all created test data
   */
  async cleanup(): Promise<void> {
    if (!this.config.cleanup) {
      console.log('Cleanup skipped due to configuration')
      return
    }

    console.log('Starting test data cleanup...')

    try {
      // Clean up in reverse order of creation to respect foreign key constraints
      const cleanupOrder = ['tasks', 'documents', 'clients', 'users', 'organizations']

      for (const type of cleanupOrder) {
        const items = this.createdData.get(type) || []
        if (items.length > 0) {
          console.log(`Cleaning up ${items.length} ${type}...`)

          const ids = items.map(item => item.id)

          switch (type) {
            case 'tasks':
              await this.prisma.task.deleteMany({ where: { id: { in: ids } } })
              break
            case 'documents':
              await this.prisma.document.deleteMany({ where: { id: { in: ids } } })
              break
            case 'clients':
              await this.prisma.client.deleteMany({ where: { id: { in: ids } } })
              break
            case 'users':
              await this.prisma.user.deleteMany({ where: { id: { in: ids } } })
              break
            case 'organizations':
              await this.prisma.organization.deleteMany({ where: { id: { in: ids } } })
              break
          }
        }
      }

      this.createdData.clear()
      console.log('Test data cleanup completed successfully')
    } catch (error) {
      console.error('Test data cleanup failed:', error)
      throw error
    }
  }

  /**
   * Clean up test data by scenario name
   */
  async cleanupByScenario(scenarioName: string): Promise<void> {
    console.log(`Cleaning up test data for scenario: ${scenarioName}`)

    try {
      // Load metadata to find data to clean up
      const metadataPath = path.join(process.cwd(), 'test-data', `${scenarioName}-metadata.json`)

      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8')
        const metadata = JSON.parse(metadataContent)

        // Clean up data based on metadata
        for (const org of metadata.organizations) {
          await this.prisma.task.deleteMany({
            where: { organizationId: org.id }
          })
          await this.prisma.document.deleteMany({
            where: { organizationId: org.id }
          })
          await this.prisma.client.deleteMany({
            where: { organizationId: org.id }
          })
          await this.prisma.user.deleteMany({
            where: { organizationId: org.id }
          })
          await this.prisma.organization.delete({
            where: { id: org.id }
          })
        }

        // Remove metadata file
        await fs.unlink(metadataPath)
        console.log(`Cleanup completed for scenario: ${scenarioName}`)
      } catch (error) {
        console.warn(`No metadata found for scenario: ${scenarioName}`)
      }
    } catch (error) {
      console.error(`Cleanup failed for scenario: ${scenarioName}`, error)
      throw error
    }
  }

  /**
   * Get summary of created test data
   */
  getDataSummary(): Record<string, number> {
    const summary: Record<string, number> = {}

    for (const [type, items] of this.createdData.entries()) {
      summary[type] = items.length
    }

    return summary
  }
}

/**
 * Helper function to get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    csv: 'text/csv',
    txt: 'text/plain',
  }

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

/**
 * Factory function to create test data manager
 */
export function createTestDataManager(
  prisma: PrismaClient,
  config?: Partial<TestDataConfig>
): TestDataManager {
  return new TestDataManager(prisma, config)
}

// Export commonly used configurations
export const TEST_DATA_CONFIGS = {
  MINIMAL: {
    organizations: 1,
    usersPerOrg: 1,
    clientsPerOrg: 1,
    documentsPerClient: 1,
    tasksPerClient: 1,
    cleanup: true,
    persistData: false,
  },
  STANDARD: {
    organizations: 2,
    usersPerOrg: 3,
    clientsPerOrg: 5,
    documentsPerClient: 3,
    tasksPerClient: 2,
    cleanup: true,
    persistData: false,
  },
  PERFORMANCE: {
    organizations: 10,
    usersPerOrg: 20,
    clientsPerOrg: 100,
    documentsPerClient: 10,
    tasksPerClient: 5,
    cleanup: false,
    persistData: true,
  },
  E2E: {
    organizations: 3,
    usersPerOrg: 5,
    clientsPerOrg: 15,
    documentsPerClient: 5,
    tasksPerClient: 3,
    cleanup: false,
    persistData: true,
  },
} as const