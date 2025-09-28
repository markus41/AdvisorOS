import { createTRPCContext } from '@/server/api/trpc'
import { appRouter } from '@/server/api/root'
import { createCallerFactory } from '@trpc/server'
import { NextApiRequest, NextApiResponse } from 'next'
import { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'

// Mock Next.js API request/response
const createMockRequest = (overrides: Partial<NextApiRequest> = {}): NextApiRequest => ({
  query: {},
  body: {},
  headers: {},
  method: 'POST',
  url: '/api/trpc',
  ...overrides,
} as NextApiRequest)

const createMockResponse = (): NextApiResponse => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
  setHeader: jest.fn().mockReturnThis(),
} as any)

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock Prisma
jest.mock('../../src/server/db', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    engagement: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { prisma } from '../../src/server/db'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('tRPC Integration Tests', () => {
  const createCaller = createCallerFactory(appRouter)

  const mockSession: Session = {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'USER',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  const mockAdminSession: Session = {
    user: {
      id: 'admin-123',
      name: 'Admin User',
      email: 'admin@example.com',
      organizationId: 'org-123',
      role: 'ADMIN',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests to protected procedures', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await expect(
        caller.client.getAll({ page: 1, limit: 10 })
      ).rejects.toThrow('UNAUTHORIZED')
    })

    it('should allow authenticated users to access user procedures', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const result = await caller.client.getAll({
        page: 1,
        limit: 10,
      })

      expect(result).toBeDefined()
      expect(mockPrisma.client.findMany).toHaveBeenCalled()
    })

    it('should enforce organization scoping', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await caller.client.getAll({ page: 1, limit: 10 })

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      )
    })

    it('should reject admin-only procedures for regular users', async () => {
      mockGetServerSession.mockResolvedValue(mockSession) // Regular user

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      // Assuming there's an admin-only procedure
      await expect(
        caller.admin?.getSystemStats?.()
      ).rejects.toThrow('FORBIDDEN')
    })

    it('should allow admin procedures for admin users', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession)
      mockPrisma.user.findMany = jest.fn().mockResolvedValue([])

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      // This would be an admin-only procedure
      if (caller.admin?.getSystemStats) {
        await expect(caller.admin.getSystemStats()).resolves.toBeDefined()
      }
    })
  })

  describe('Client Procedures', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
    })

    it('should get paginated client list', async () => {
      const mockClients = [
        {
          id: 'client-1',
          businessName: 'Client One',
          status: 'ACTIVE',
          organizationId: 'org-123',
          _count: { documents: 5, engagements: 2, invoices: 3, notes: 1 },
        },
        {
          id: 'client-2',
          businessName: 'Client Two',
          status: 'PROSPECT',
          organizationId: 'org-123',
          _count: { documents: 3, engagements: 1, invoices: 2, notes: 0 },
        },
      ]

      mockPrisma.client.findMany.mockResolvedValue(mockClients as any)
      mockPrisma.client.count.mockResolvedValue(25)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const result = await caller.client.getAll({
        page: 1,
        limit: 10,
        filters: { status: ['ACTIVE'] },
        sort: { field: 'businessName', direction: 'asc' },
      })

      expect(result).toEqual({
        clients: mockClients,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
        },
        filters: { status: ['ACTIVE'] },
        sort: { field: 'businessName', direction: 'asc' },
      })
    })

    it('should get client by ID', async () => {
      const mockClient = {
        id: 'client-123',
        businessName: 'Test Client',
        organizationId: 'org-123',
        documents: [],
        engagements: [],
        invoices: [],
        notes: [],
        _count: { documents: 0, engagements: 0, invoices: 0, notes: 0 },
      }

      mockPrisma.client.findFirst.mockResolvedValue(mockClient as any)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const result = await caller.client.getById({ id: 'client-123' })

      expect(result).toEqual(mockClient)
      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client-123',
          organizationId: 'org-123',
          deletedAt: null,
        },
        include: expect.any(Object),
      })
    })

    it('should create new client', async () => {
      const clientData = {
        businessName: 'New Client Corp',
        legalName: 'New Client Corporation',
        primaryContactName: 'John Doe',
        primaryContactEmail: 'john@newclient.com',
        status: 'PROSPECT' as const,
        riskLevel: 'MEDIUM' as const,
      }

      const createdClient = {
        id: 'new-client-123',
        ...clientData,
        organizationId: 'org-123',
        createdBy: 'user-123',
        _count: { documents: 0, engagements: 0, invoices: 0, notes: 0 },
      }

      mockPrisma.client.findFirst.mockResolvedValue(null) // No existing client
      mockPrisma.client.create.mockResolvedValue(createdClient as any)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const result = await caller.client.create(clientData)

      expect(result).toEqual(createdClient)
      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          ...clientData,
          organizationId: 'org-123',
          createdBy: 'user-123',
          customFields: {},
        },
        include: expect.any(Object),
      })
    })

    it('should update existing client', async () => {
      const updateData = {
        id: 'client-123',
        businessName: 'Updated Client Name',
        status: 'ACTIVE' as const,
      }

      const currentClient = {
        id: 'client-123',
        businessName: 'Old Name',
        status: 'PROSPECT',
        organizationId: 'org-123',
        customFields: {},
      }

      const updatedClient = {
        ...currentClient,
        ...updateData,
        updatedBy: 'user-123',
      }

      mockPrisma.client.findFirst
        .mockResolvedValueOnce(currentClient as any) // getClientById call
        .mockResolvedValueOnce(null) // Business name uniqueness check

      mockPrisma.client.update.mockResolvedValue(updatedClient as any)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const result = await caller.client.update(updateData)

      expect(result).toEqual(updatedClient)
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-123' },
        data: {
          businessName: 'Updated Client Name',
          status: 'ACTIVE',
          updatedBy: 'user-123',
          customFields: {},
        },
        include: expect.any(Object),
      })
    })

    it('should soft delete client', async () => {
      const clientToDelete = {
        id: 'client-123',
        businessName: 'Client to Delete',
        organizationId: 'org-123',
      }

      mockPrisma.client.findFirst.mockResolvedValue(clientToDelete as any)
      mockPrisma.engagement.count.mockResolvedValue(0) // No active engagements
      mockPrisma.invoice.count.mockResolvedValue(0) // No unpaid invoices
      mockPrisma.client.update.mockResolvedValue({} as any)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await caller.client.delete({ id: 'client-123' })

      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-123' },
        data: {
          deletedAt: expect.any(Date),
          updatedBy: 'user-123',
        },
      })
    })
  })

  describe('Document Procedures', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
    })

    it('should get client documents', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          name: 'w2-form.pdf',
          type: 'W2',
          status: 'PROCESSED',
          clientId: 'client-123',
          organizationId: 'org-123',
          uploader: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
        },
      ]

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments as any)
      mockPrisma.document.count.mockResolvedValue(1)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const result = await caller.document.getByClient({
        clientId: 'client-123',
        page: 1,
        limit: 10,
      })

      expect(result).toEqual({
        documents: mockDocuments,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      })
    })

    it('should upload and process document', async () => {
      const uploadData = {
        name: 'tax-document.pdf',
        type: 'W2',
        category: 'TAX_DOCUMENT',
        clientId: 'client-123',
        size: 1024 * 50,
        mimeType: 'application/pdf',
      }

      const createdDocument = {
        id: 'doc-new-123',
        ...uploadData,
        status: 'PENDING',
        organizationId: 'org-123',
        uploadedById: 'user-123',
        storageKey: 'documents/org-123/doc-new-123.pdf',
      }

      mockPrisma.document.create.mockResolvedValue(createdDocument as any)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const result = await caller.document.upload(uploadData)

      expect(result).toEqual(createdDocument)
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: {
          ...uploadData,
          status: 'PENDING',
          organizationId: 'org-123',
          uploadedById: 'user-123',
          storageKey: expect.any(String),
        },
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.client.findMany.mockRejectedValue(new Error('Database connection failed'))

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await expect(
        caller.client.getAll({ page: 1, limit: 10 })
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle validation errors', async () => {
      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      // Test invalid input
      await expect(
        caller.client.create({
          businessName: '', // Empty business name should fail validation
          primaryContactName: 'Test',
          primaryContactEmail: 'invalid-email', // Invalid email
          status: 'ACTIVE',
          riskLevel: 'MEDIUM',
        })
      ).rejects.toThrow()
    })

    it('should handle not found errors', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await expect(
        caller.client.getById({ id: 'non-existent-client' })
      ).rejects.toThrow('NOT_FOUND')
    })

    it('should handle business logic errors', async () => {
      const clientWithDependencies = {
        id: 'client-123',
        businessName: 'Client with Dependencies',
        organizationId: 'org-123',
      }

      mockPrisma.client.findFirst.mockResolvedValue(clientWithDependencies as any)
      mockPrisma.engagement.count.mockResolvedValue(2) // Has active engagements
      mockPrisma.invoice.count.mockResolvedValue(1) // Has unpaid invoices

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await expect(
        caller.client.delete({ id: 'client-123' })
      ).rejects.toThrow('Cannot delete client with 2 active engagement(s)')
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
    })

    it('should validate pagination parameters', async () => {
      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      // Test invalid pagination
      await expect(
        caller.client.getAll({
          page: 0, // Invalid page number
          limit: 10,
        })
      ).rejects.toThrow()

      await expect(
        caller.client.getAll({
          page: 1,
          limit: 1001, // Exceeds maximum limit
        })
      ).rejects.toThrow()
    })

    it('should validate email formats', async () => {
      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await expect(
        caller.client.create({
          businessName: 'Test Client',
          primaryContactName: 'Test User',
          primaryContactEmail: 'not-an-email',
          status: 'ACTIVE',
          riskLevel: 'MEDIUM',
        })
      ).rejects.toThrow()
    })

    it('should validate enum values', async () => {
      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await expect(
        caller.client.create({
          businessName: 'Test Client',
          primaryContactName: 'Test User',
          primaryContactEmail: 'test@example.com',
          status: 'INVALID_STATUS' as any,
          riskLevel: 'MEDIUM',
        })
      ).rejects.toThrow()
    })
  })

  describe('Performance and Caching', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
    })

    it('should handle large result sets efficiently', async () => {
      const largeClientList = Array.from({ length: 1000 }, (_, i) => ({
        id: `client-${i}`,
        businessName: `Client ${i}`,
        organizationId: 'org-123',
        _count: { documents: 0, engagements: 0, invoices: 0, notes: 0 },
      }))

      mockPrisma.client.findMany.mockResolvedValue(largeClientList as any)
      mockPrisma.client.count.mockResolvedValue(10000)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      const startTime = Date.now()
      const result = await caller.client.getAll({
        page: 1,
        limit: 1000,
      })
      const endTime = Date.now()

      expect(result.clients).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
    })

    it('should properly limit query results', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const ctx = await createTRPCContext({
        req: createMockRequest(),
        res: createMockResponse(),
      })

      const caller = createCaller(ctx)

      await caller.client.getAll({
        page: 1,
        limit: 50,
      })

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      )
    })
  })
})