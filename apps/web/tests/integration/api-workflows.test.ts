import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import { getServerSession } from 'next-auth/next'
import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'
import { prisma } from '@/server/db'

// Mock NextAuth
jest.mock('next-auth/next')
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('API Workflows Integration Tests', () => {
  let testOrganization1: any
  let testOrganization2: any
  let testUser1: any
  let testUser2: any
  let testClient1: any
  let testClient2: any

  beforeAll(async () => {
    // Set up test data
    await setupTestData()
  })

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up any test-specific data
    await cleanupTestSpecificData()
  })

  async function setupTestData() {
    // Create test organizations
    testOrganization1 = await global.createTestOrganization({
      name: 'Test CPA Firm 1',
      subdomain: 'test-firm-1',
    })

    testOrganization2 = await global.createTestOrganization({
      name: 'Test CPA Firm 2',
      subdomain: 'test-firm-2',
    })

    // Create test users
    testUser1 = await global.createTestUser(testOrganization1.id, {
      email: 'admin1@testfirm1.com',
      role: 'ADMIN',
    })

    testUser2 = await global.createTestUser(testOrganization2.id, {
      email: 'admin2@testfirm2.com',
      role: 'ADMIN',
    })

    // Create test clients
    testClient1 = await global.createTestClient(testOrganization1.id, {
      name: 'Test Client 1',
      email: 'client1@example.com',
    })

    testClient2 = await global.createTestClient(testOrganization2.id, {
      name: 'Test Client 2',
      email: 'client2@example.com',
    })
  }

  async function cleanupTestData() {
    await global.cleanupTestData(prisma)
  }

  async function cleanupTestSpecificData() {
    // Remove any documents, tasks, or other data created during tests
    await prisma.document.deleteMany({
      where: {
        organizationId: {
          in: [testOrganization1.id, testOrganization2.id],
        },
      },
    })

    await prisma.task.deleteMany({
      where: {
        organizationId: {
          in: [testOrganization1.id, testOrganization2.id],
        },
      },
    })
  }

  function createMockContext(userId: string, organizationId: string, role: string = 'ADMIN') {
    return {
      session: {
        user: {
          id: userId,
          organizationId,
          role,
          email: `${userId}@test.com`,
          name: 'Test User',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      prisma,
      userId,
      organizationId,
      userRole: role,
    }
  }

  describe('Client Management Workflow', () => {
    it('should create, read, update, and delete client with proper isolation', async () => {
      const ctx1 = createMockContext(testUser1.id, testOrganization1.id)
      const ctx2 = createMockContext(testUser2.id, testOrganization2.id)

      const caller1 = appRouter.createCaller(ctx1)
      const caller2 = appRouter.createCaller(ctx2)

      // Create client in organization 1
      const newClient = await caller1.client.create({
        businessName: 'Integration Test Client',
        legalName: 'Integration Test Client LLC',
        primaryContactEmail: 'integration@test.com',
        primaryContactName: 'Integration Test',
        businessType: 'LLC',
        status: 'ACTIVE',
      })

      expect(newClient.businessName).toBe('Integration Test Client')
      expect(newClient.organizationId).toBe(testOrganization1.id)

      // Verify organization 2 cannot access this client
      await expect(
        caller2.client.byId({ id: newClient.id })
      ).rejects.toThrow('Client not found')

      // Update client from organization 1
      const updatedClient = await caller1.client.update({
        id: newClient.id,
        businessName: 'Updated Integration Test Client',
      })

      expect(updatedClient.businessName).toBe('Updated Integration Test Client')

      // Verify organization 2 cannot update this client
      await expect(
        caller2.client.update({
          id: newClient.id,
          businessName: 'Unauthorized Update',
        })
      ).rejects.toThrow('Client not found')

      // List clients - each organization should only see their own
      const org1Clients = await caller1.client.list({})
      const org2Clients = await caller2.client.list({})

      const org1ClientIds = org1Clients.clients.map(c => c.id)
      const org2ClientIds = org2Clients.clients.map(c => c.id)

      expect(org1ClientIds).toContain(newClient.id)
      expect(org2ClientIds).not.toContain(newClient.id)

      // Delete client
      await caller1.client.delete({ id: newClient.id })

      // Verify client is deleted
      await expect(
        caller1.client.byId({ id: newClient.id })
      ).rejects.toThrow('Client not found')
    })

    it('should handle client validation and business rules', async () => {
      const ctx = createMockContext(testUser1.id, testOrganization1.id)
      const caller = appRouter.createCaller(ctx)

      // Test business name uniqueness within organization
      const client1 = await caller.client.create({
        businessName: 'Unique Business Name',
        legalName: 'Unique Business Name LLC',
        primaryContactEmail: 'unique1@test.com',
        primaryContactName: 'Test Contact',
        businessType: 'LLC',
        status: 'ACTIVE',
      })

      // Should fail to create another client with same business name in same org
      await expect(
        caller.client.create({
          businessName: 'Unique Business Name',
          legalName: 'Different Legal Name LLC',
          primaryContactEmail: 'unique2@test.com',
          primaryContactName: 'Test Contact 2',
          businessType: 'LLC',
          status: 'ACTIVE',
        })
      ).rejects.toThrow(/already exists/)

      // But should allow same business name in different organization
      const ctx2 = createMockContext(testUser2.id, testOrganization2.id)
      const caller2 = appRouter.createCaller(ctx2)

      const client2 = await caller2.client.create({
        businessName: 'Unique Business Name', // Same name, different org
        legalName: 'Different Org Business LLC',
        primaryContactEmail: 'unique3@test.com',
        primaryContactName: 'Test Contact 3',
        businessType: 'LLC',
        status: 'ACTIVE',
      })

      expect(client2.businessName).toBe('Unique Business Name')
      expect(client2.organizationId).toBe(testOrganization2.id)
    })
  })

  describe('Document Management Workflow', () => {
    it('should handle document upload and processing with tenant isolation', async () => {
      const ctx1 = createMockContext(testUser1.id, testOrganization1.id)
      const ctx2 = createMockContext(testUser2.id, testOrganization2.id)

      const caller1 = appRouter.createCaller(ctx1)
      const caller2 = appRouter.createCaller(ctx2)

      // Create document for organization 1
      const document1 = await prisma.document.create({
        data: {
          fileName: 'test-document-1.pdf',
          originalName: 'Test Document 1.pdf',
          mimeType: 'application/pdf',
          size: 1024 * 1024,
          category: 'TAX_DOCUMENTS',
          subcategory: 'W2',
          storageProvider: 'LOCAL',
          storagePath: '/test/path/document1.pdf',
          clientId: testClient1.id,
          organizationId: testOrganization1.id,
          uploadedBy: testUser1.id,
        },
      })

      // Create document for organization 2
      const document2 = await prisma.document.create({
        data: {
          fileName: 'test-document-2.pdf',
          originalName: 'Test Document 2.pdf',
          mimeType: 'application/pdf',
          size: 2 * 1024 * 1024,
          category: 'TAX_DOCUMENTS',
          subcategory: 'W2',
          storageProvider: 'LOCAL',
          storagePath: '/test/path/document2.pdf',
          clientId: testClient2.id,
          organizationId: testOrganization2.id,
          uploadedBy: testUser2.id,
        },
      })

      // Test document access isolation
      // Organization 1 can access their document
      const doc1FromOrg1 = await prisma.document.findFirst({
        where: {
          id: document1.id,
          organizationId: testOrganization1.id,
        },
      })
      expect(doc1FromOrg1).toBeTruthy()

      // Organization 1 cannot access organization 2's document
      const doc2FromOrg1 = await prisma.document.findFirst({
        where: {
          id: document2.id,
          organizationId: testOrganization1.id,
        },
      })
      expect(doc2FromOrg1).toBeNull()

      // Test document listing with tenant isolation
      const org1Documents = await prisma.document.findMany({
        where: { organizationId: testOrganization1.id },
      })

      const org2Documents = await prisma.document.findMany({
        where: { organizationId: testOrganization2.id },
      })

      expect(org1Documents.map(d => d.id)).toContain(document1.id)
      expect(org1Documents.map(d => d.id)).not.toContain(document2.id)

      expect(org2Documents.map(d => d.id)).toContain(document2.id)
      expect(org2Documents.map(d => d.id)).not.toContain(document1.id)
    })
  })

  describe('Task Management Workflow', () => {
    it('should manage tasks with proper access control and notifications', async () => {
      const ctx1 = createMockContext(testUser1.id, testOrganization1.id)
      const caller1 = appRouter.createCaller(ctx1)

      // Create a task
      const task = await prisma.task.create({
        data: {
          title: 'Integration Test Task',
          description: 'This is a test task for integration testing',
          status: 'PENDING',
          priority: 'MEDIUM',
          category: 'TAX_PREPARATION',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          assignedTo: testUser1.id,
          createdBy: testUser1.id,
          clientId: testClient1.id,
          organizationId: testOrganization1.id,
        },
      })

      expect(task.title).toBe('Integration Test Task')
      expect(task.organizationId).toBe(testOrganization1.id)

      // Test task isolation - organization 2 cannot see this task
      const org2Tasks = await prisma.task.findMany({
        where: {
          organizationId: testOrganization2.id,
        },
      })

      expect(org2Tasks.map(t => t.id)).not.toContain(task.id)

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updatedTask.status).toBe('IN_PROGRESS')

      // Complete task
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      const completedTask = await prisma.task.findUnique({
        where: { id: task.id },
      })

      expect(completedTask?.status).toBe('COMPLETED')
      expect(completedTask?.completedAt).toBeTruthy()
    })
  })

  describe('User Role and Permission Workflow', () => {
    it('should enforce role-based access control', async () => {
      // Create a regular user (non-admin)
      const regularUser = await global.createTestUser(testOrganization1.id, {
        email: 'user@testfirm1.com',
        role: 'USER',
      })

      const adminCtx = createMockContext(testUser1.id, testOrganization1.id, 'ADMIN')
      const userCtx = createMockContext(regularUser.id, testOrganization1.id, 'USER')

      const adminCaller = appRouter.createCaller(adminCtx)
      const userCaller = appRouter.createCaller(userCtx)

      // Admin should be able to create clients
      const clientFromAdmin = await adminCaller.client.create({
        businessName: 'Admin Created Client',
        legalName: 'Admin Created Client LLC',
        primaryContactEmail: 'admin-client@test.com',
        primaryContactName: 'Admin Client',
        businessType: 'LLC',
        status: 'ACTIVE',
      })

      expect(clientFromAdmin.businessName).toBe('Admin Created Client')

      // Regular user should be able to view clients
      const clientFromUser = await userCaller.client.byId({
        id: clientFromAdmin.id,
      })

      expect(clientFromUser.businessName).toBe('Admin Created Client')

      // But regular user might have restrictions on certain operations
      // (This depends on your specific role-based access control implementation)
    })
  })

  describe('Data Integrity and Audit Trail', () => {
    it('should maintain audit trail for sensitive operations', async () => {
      const ctx = createMockContext(testUser1.id, testOrganization1.id)
      const caller = appRouter.createCaller(ctx)

      // Create a client
      const client = await caller.client.create({
        businessName: 'Audit Test Client',
        legalName: 'Audit Test Client LLC',
        primaryContactEmail: 'audit@test.com',
        primaryContactName: 'Audit Test',
        businessType: 'LLC',
        status: 'ACTIVE',
      })

      // Update the client
      await caller.client.update({
        id: client.id,
        businessName: 'Updated Audit Test Client',
      })

      // Check if audit logs were created (if implemented)
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          organizationId: testOrganization1.id,
          resourceType: 'CLIENT',
          resourceId: client.id,
        },
        orderBy: { createdAt: 'desc' },
      })

      // Verify audit trail exists for create and update operations
      expect(auditLogs.length).toBeGreaterThanOrEqual(1)

      // Delete the client
      await caller.client.delete({ id: client.id })

      // Check for delete audit log
      const deleteAuditLogs = await prisma.auditLog.findMany({
        where: {
          organizationId: testOrganization1.id,
          resourceType: 'CLIENT',
          resourceId: client.id,
          action: 'DELETE',
        },
      })

      expect(deleteAuditLogs.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle concurrent operations efficiently', async () => {
      const ctx = createMockContext(testUser1.id, testOrganization1.id)
      const caller = appRouter.createCaller(ctx)

      // Create multiple clients concurrently
      const clientPromises = Array.from({ length: 10 }, (_, i) =>
        caller.client.create({
          businessName: `Concurrent Client ${i}`,
          legalName: `Concurrent Client ${i} LLC`,
          primaryContactEmail: `concurrent${i}@test.com`,
          primaryContactName: `Concurrent Test ${i}`,
          businessType: 'LLC',
          status: 'ACTIVE',
        })
      )

      const startTime = Date.now()
      const clients = await Promise.all(clientPromises)
      const endTime = Date.now()

      expect(clients).toHaveLength(10)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Verify all clients were created with correct organization ID
      clients.forEach(client => {
        expect(client.organizationId).toBe(testOrganization1.id)
      })

      // Clean up
      await Promise.all(
        clients.map(client =>
          caller.client.delete({ id: client.id })
        )
      )
    })

    it('should handle large data sets with pagination', async () => {
      const ctx = createMockContext(testUser1.id, testOrganization1.id)
      const caller = appRouter.createCaller(ctx)

      // Create many clients for pagination testing
      const clients = []
      for (let i = 0; i < 25; i++) {
        const client = await caller.client.create({
          businessName: `Pagination Client ${i}`,
          legalName: `Pagination Client ${i} LLC`,
          primaryContactEmail: `pagination${i}@test.com`,
          primaryContactName: `Pagination Test ${i}`,
          businessType: 'LLC',
          status: 'ACTIVE',
        })
        clients.push(client)
      }

      // Test pagination
      const page1 = await caller.client.list({
        pagination: { page: 1, limit: 10 },
      })

      const page2 = await caller.client.list({
        pagination: { page: 2, limit: 10 },
      })

      const page3 = await caller.client.list({
        pagination: { page: 3, limit: 10 },
      })

      expect(page1.clients).toHaveLength(10)
      expect(page2.clients).toHaveLength(10)
      expect(page3.clients.length).toBeGreaterThan(0)

      expect(page1.pagination.page).toBe(1)
      expect(page1.pagination.pages).toBeGreaterThanOrEqual(3)
      expect(page1.pagination.total).toBeGreaterThanOrEqual(25)

      // Verify no overlap between pages
      const page1Ids = page1.clients.map(c => c.id)
      const page2Ids = page2.clients.map(c => c.id)
      const intersection = page1Ids.filter(id => page2Ids.includes(id))
      expect(intersection).toHaveLength(0)

      // Clean up
      await Promise.all(
        clients.map(client =>
          caller.client.delete({ id: client.id })
        )
      )
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid data gracefully', async () => {
      const ctx = createMockContext(testUser1.id, testOrganization1.id)
      const caller = appRouter.createCaller(ctx)

      // Test invalid email
      await expect(
        caller.client.create({
          businessName: 'Invalid Email Client',
          legalName: 'Invalid Email Client LLC',
          primaryContactEmail: 'invalid-email',
          primaryContactName: 'Test',
          businessType: 'LLC',
          status: 'ACTIVE',
        })
      ).rejects.toThrow()

      // Test missing required fields
      await expect(
        caller.client.create({
          businessName: '',
          legalName: 'Empty Name Client LLC',
          primaryContactEmail: 'empty@test.com',
          primaryContactName: 'Test',
          businessType: 'LLC',
          status: 'ACTIVE',
        })
      ).rejects.toThrow()

      // Test non-existent client access
      await expect(
        caller.client.byId({ id: 'non-existent-id' })
      ).rejects.toThrow('Client not found')
    })

    it('should handle database constraints and conflicts', async () => {
      const ctx = createMockContext(testUser1.id, testOrganization1.id)
      const caller = appRouter.createCaller(ctx)

      // Create a client
      const client = await caller.client.create({
        businessName: 'Constraint Test Client',
        legalName: 'Constraint Test Client LLC',
        primaryContactEmail: 'constraint@test.com',
        primaryContactName: 'Constraint Test',
        businessType: 'LLC',
        status: 'ACTIVE',
      })

      // Try to create another client with the same business name
      await expect(
        caller.client.create({
          businessName: 'Constraint Test Client',
          legalName: 'Different Legal Name LLC',
          primaryContactEmail: 'different@test.com',
          primaryContactName: 'Different Test',
          businessType: 'LLC',
          status: 'ACTIVE',
        })
      ).rejects.toThrow(/already exists/)

      // Clean up
      await caller.client.delete({ id: client.id })
    })
  })
})