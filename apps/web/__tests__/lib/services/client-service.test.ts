import { ClientService } from '@/lib/services/client-service'
import { prisma } from '../../../src/server/db'
import { AuditService } from '@/lib/services/audit-service'
import { NotificationService } from '@/lib/services/notification-service'
import { QuickBooksService } from '@/lib/services/quickbooks-service'
import {
  mockOrganization,
  mockAdminUser,
  mockClient,
  testCSVContent,
} from '../../fixtures/test-data'

// Mock dependencies
jest.mock('@/lib/services/audit-service')
jest.mock('@/lib/services/notification-service')
jest.mock('@/lib/services/quickbooks-service')
jest.mock('@cpa-platform/database', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    engagement: {
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    note: {
      create: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAuditService = AuditService as jest.Mocked<typeof AuditService>
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>
const mockQuickBooksService = QuickBooksService as jest.Mocked<typeof QuickBooksService>

describe('ClientService', () => {
  const testOrgId = 'org-123'
  const testUserId = 'user-123'
  const testClientId = 'client-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getClients', () => {
    it('should return paginated list of clients', async () => {
      const mockClients = [
        { id: 'client-1', businessName: 'Client One', _count: { documents: 5, engagements: 2, invoices: 3, notes: 1 } },
        { id: 'client-2', businessName: 'Client Two', _count: { documents: 3, engagements: 1, invoices: 2, notes: 0 } },
      ]

      mockPrisma.client.findMany.mockResolvedValue(mockClients as any)
      mockPrisma.client.count.mockResolvedValue(25)

      const result = await ClientService.getClients(testOrgId)

      expect(result).toEqual({
        clients: mockClients,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
        },
        filters: {},
        sort: { field: 'businessName', direction: 'asc' },
      })

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: testOrgId,
          deletedAt: null,
        },
        orderBy: {
          businessName: 'asc',
        },
        skip: 0,
        take: 10,
        include: {
          _count: {
            select: {
              documents: true,
              engagements: true,
              invoices: true,
              notes: true,
            },
          },
        },
      })
    })

    it('should apply search filters correctly', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await ClientService.getClients(
        testOrgId,
        { search: 'acme' },
        { field: 'businessName', direction: 'asc' },
        { page: 1, limit: 10 }
      )

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: testOrgId,
            deletedAt: null,
            OR: [
              { businessName: { contains: 'acme', mode: 'insensitive' } },
              { legalName: { contains: 'acme', mode: 'insensitive' } },
              { primaryContactEmail: { contains: 'acme', mode: 'insensitive' } },
              { primaryContactName: { contains: 'acme', mode: 'insensitive' } },
              { taxId: { contains: 'acme', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })

    it('should apply status filters correctly', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await ClientService.getClients(
        testOrgId,
        { status: ['active', 'prospect'] }
      )

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['active', 'prospect'] },
          }),
        })
      )
    })

    it('should apply revenue range filters correctly', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await ClientService.getClients(
        testOrgId,
        { annualRevenueMin: 100000, annualRevenueMax: 500000 }
      )

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            annualRevenue: {
              gte: 100000,
              lte: 500000,
            },
          }),
        })
      )
    })

    it('should handle QuickBooks filter correctly', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await ClientService.getClients(testOrgId, { hasQuickBooks: true })

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quickbooksId: { not: null },
          }),
        })
      )
    })
  })

  describe('getClientById', () => {
    it('should return client with relations', async () => {
      const mockClient = {
        id: testClientId,
        businessName: 'Test Client',
        documents: [],
        notes: [],
        engagements: [],
        invoices: [],
        _count: { documents: 0, engagements: 0, invoices: 0, notes: 0 },
      }

      mockPrisma.client.findFirst.mockResolvedValue(mockClient as any)

      const result = await ClientService.getClientById(testClientId, testOrgId)

      expect(result).toEqual(mockClient)
      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: testClientId,
          organizationId: testOrgId,
          deletedAt: null,
        },
        include: expect.objectContaining({
          documents: expect.any(Object),
          notes: expect.any(Object),
          engagements: expect.any(Object),
          invoices: expect.any(Object),
          _count: expect.any(Object),
        }),
      })
    })

    it('should return client without relations when requested', async () => {
      const mockClient = { id: testClientId, businessName: 'Test Client' }

      mockPrisma.client.findFirst.mockResolvedValue(mockClient as any)

      const result = await ClientService.getClientById(testClientId, testOrgId, false)

      expect(result).toEqual(mockClient)
      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: testClientId,
          organizationId: testOrgId,
          deletedAt: null,
        },
        include: undefined,
      })
    })

    it('should return null when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null)

      const result = await ClientService.getClientById('nonexistent', testOrgId)

      expect(result).toBeNull()
    })
  })

  describe('createClient', () => {
    const clientData = {
      businessName: 'New Test Client',
      legalName: 'New Test Client Inc.',
      primaryContactName: 'John Doe',
      primaryContactEmail: 'john@newtestclient.com',
      status: 'prospect' as const,
      riskLevel: 'medium' as const,
    }

    it('should create a new client successfully', async () => {
      const createdClient = {
        id: 'new-client-123',
        ...clientData,
        organizationId: testOrgId,
        createdBy: testUserId,
        _count: { documents: 0, engagements: 0, invoices: 0, notes: 0 },
      }

      mockPrisma.client.findFirst.mockResolvedValue(null) // No existing client
      mockPrisma.client.create.mockResolvedValue(createdClient as any)
      mockAuditService.logAction.mockResolvedValue(undefined)
      mockNotificationService.notifyClientCreated.mockResolvedValue(undefined)

      const result = await ClientService.createClient(clientData, testOrgId, testUserId)

      expect(result).toEqual(createdClient)
      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          ...clientData,
          organizationId: testOrgId,
          createdBy: testUserId,
          customFields: {},
        },
        include: {
          _count: {
            select: {
              documents: true,
              engagements: true,
              invoices: true,
              notes: true,
            },
          },
        },
      })

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        action: 'create',
        entityType: 'client',
        entityId: createdClient.id,
        userId: testUserId,
        organizationId: testOrgId,
        newValues: createdClient,
        metadata: { clientName: createdClient.businessName },
      })

      expect(mockNotificationService.notifyClientCreated).toHaveBeenCalledWith(
        createdClient.id,
        createdClient.businessName,
        testOrgId,
        testUserId
      )
    })

    it('should throw error if business name already exists', async () => {
      const existingClient = { id: 'existing-123', businessName: clientData.businessName }
      mockPrisma.client.findFirst.mockResolvedValue(existingClient as any)

      await expect(
        ClientService.createClient(clientData, testOrgId, testUserId)
      ).rejects.toThrow('A client with this business name already exists')
    })

    it('should throw error if tax ID already exists', async () => {
      const clientDataWithTaxId = { ...clientData, taxId: '12-3456789' }

      mockPrisma.client.findFirst
        .mockResolvedValueOnce(null) // No existing business name
        .mockResolvedValueOnce({ id: 'existing-123', taxId: '12-3456789' } as any) // Existing tax ID

      await expect(
        ClientService.createClient(clientDataWithTaxId, testOrgId, testUserId)
      ).rejects.toThrow('A client with this Tax ID already exists')
    })
  })

  describe('updateClient', () => {
    const updateData = {
      businessName: 'Updated Client Name',
      status: 'active' as const,
    }

    it('should update client successfully', async () => {
      const currentClient = {
        id: testClientId,
        businessName: 'Old Name',
        status: 'prospect',
        customFields: {},
      }

      const updatedClient = {
        ...currentClient,
        ...updateData,
        updatedBy: testUserId,
      }

      mockPrisma.client.findFirst
        .mockResolvedValueOnce(currentClient as any) // getClientById call
        .mockResolvedValueOnce(null) // Business name uniqueness check

      mockPrisma.client.update.mockResolvedValue(updatedClient as any)
      mockAuditService.logAction.mockResolvedValue(undefined)
      mockNotificationService.notifyClientUpdated.mockResolvedValue(undefined)

      const result = await ClientService.updateClient(testClientId, updateData, testOrgId, testUserId)

      expect(result).toEqual(updatedClient)
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: testClientId },
        data: {
          ...updateData,
          updatedBy: testUserId,
          customFields: currentClient.customFields,
        },
        include: {
          _count: {
            select: {
              documents: true,
              engagements: true,
              invoices: true,
              notes: true,
            },
          },
        },
      })

      expect(mockAuditService.logAction).toHaveBeenCalled()
      expect(mockNotificationService.notifyClientUpdated).toHaveBeenCalled()
    })

    it('should throw error if client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null)

      await expect(
        ClientService.updateClient(testClientId, updateData, testOrgId, testUserId)
      ).rejects.toThrow('Client not found')
    })

    it('should merge custom fields correctly', async () => {
      const currentClient = {
        id: testClientId,
        customFields: { existingField: 'value' },
      }

      const updateDataWithCustomFields = {
        customFields: { newField: 'newValue' },
      }

      mockPrisma.client.findFirst.mockResolvedValue(currentClient as any)
      mockPrisma.client.update.mockResolvedValue({} as any)

      await ClientService.updateClient(testClientId, updateDataWithCustomFields, testOrgId, testUserId)

      expect(mockPrisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customFields: {
              existingField: 'value',
              newField: 'newValue',
            },
          }),
        })
      )
    })
  })

  describe('deleteClient', () => {
    it('should soft delete client successfully', async () => {
      const client = {
        id: testClientId,
        businessName: 'Test Client',
      }

      mockPrisma.client.findFirst.mockResolvedValue(client as any)
      mockPrisma.engagement.count.mockResolvedValue(0) // No active engagements
      mockPrisma.invoice.count.mockResolvedValue(0) // No unpaid invoices
      mockPrisma.client.update.mockResolvedValue({} as any)
      mockAuditService.logAction.mockResolvedValue(undefined)

      await ClientService.deleteClient(testClientId, testOrgId, testUserId)

      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: testClientId },
        data: {
          deletedAt: expect.any(Date),
          updatedBy: testUserId,
        },
      })

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        action: 'delete',
        entityType: 'client',
        entityId: testClientId,
        userId: testUserId,
        organizationId: testOrgId,
        oldValues: client,
        metadata: { clientName: client.businessName },
      })
    })

    it('should throw error if client has active engagements', async () => {
      const client = { id: testClientId, businessName: 'Test Client' }

      mockPrisma.client.findFirst.mockResolvedValue(client as any)
      mockPrisma.engagement.count.mockResolvedValue(2) // Active engagements
      mockPrisma.invoice.count.mockResolvedValue(0)

      await expect(
        ClientService.deleteClient(testClientId, testOrgId, testUserId)
      ).rejects.toThrow('Cannot delete client with 2 active engagement(s)')
    })

    it('should throw error if client has unpaid invoices', async () => {
      const client = { id: testClientId, businessName: 'Test Client' }

      mockPrisma.client.findFirst.mockResolvedValue(client as any)
      mockPrisma.engagement.count.mockResolvedValue(0)
      mockPrisma.invoice.count.mockResolvedValue(3) // Unpaid invoices

      await expect(
        ClientService.deleteClient(testClientId, testOrgId, testUserId)
      ).rejects.toThrow('Cannot delete client with 3 unpaid invoice(s)')
    })
  })

  describe('getClientStats', () => {
    it('should return comprehensive client statistics', async () => {
      const mockStatusCounts = [
        { status: 'active', _count: 10 },
        { status: 'prospect', _count: 5 },
        { status: 'inactive', _count: 2 },
      ]

      const mockBusinessTypeCounts = [
        { businessType: 'LLC', _count: 8 },
        { businessType: 'Corporation', _count: 7 },
      ]

      const mockRiskLevelCounts = [
        { riskLevel: 'low', _count: 5 },
        { riskLevel: 'medium', _count: 10 },
        { riskLevel: 'high', _count: 2 },
      ]

      const mockRevenueStats = {
        _sum: { annualRevenue: 5000000 },
        _avg: { annualRevenue: 294117.65 },
        _count: { annualRevenue: 17 },
      }

      mockPrisma.client.count
        .mockResolvedValueOnce(17) // totalClients
        .mockResolvedValueOnce(10) // quickBooksConnected
        .mockResolvedValueOnce(3) // recentlyAdded

      mockPrisma.client.groupBy
        .mockResolvedValueOnce(mockStatusCounts as any)
        .mockResolvedValueOnce(mockBusinessTypeCounts as any)
        .mockResolvedValueOnce(mockRiskLevelCounts as any)

      mockPrisma.client.aggregate.mockResolvedValue(mockRevenueStats as any)

      const result = await ClientService.getClientStats(testOrgId)

      expect(result).toEqual({
        totalClients: 17,
        activeClients: 10,
        prospectClients: 5,
        inactiveClients: 2,
        totalRevenue: 5000000,
        averageRevenue: 294117.65,
        quickBooksConnected: 10,
        recentlyAdded: 3,
        byBusinessType: {
          LLC: 8,
          Corporation: 7,
        },
        byRiskLevel: {
          low: 5,
          medium: 10,
          high: 2,
        },
        byStatus: {
          active: 10,
          prospect: 5,
          inactive: 2,
        },
      })
    })
  })

  describe('bulkOperation', () => {
    it('should perform bulk delete operation', async () => {
      const clientIds = ['client-1', 'client-2']
      const mockClient1 = { id: 'client-1', businessName: 'Client 1' }
      const mockClient2 = { id: 'client-2', businessName: 'Client 2' }

      mockPrisma.client.findFirst
        .mockResolvedValueOnce(mockClient1 as any)
        .mockResolvedValueOnce(mockClient2 as any)

      mockPrisma.engagement.count.mockResolvedValue(0)
      mockPrisma.invoice.count.mockResolvedValue(0)
      mockPrisma.client.update.mockResolvedValue({} as any)
      mockAuditService.logAction.mockResolvedValue(undefined)

      const result = await ClientService.bulkOperation(
        { action: 'delete', clientIds },
        testOrgId,
        testUserId
      )

      expect(result).toEqual({
        success: true,
        processed: 2,
        errors: [],
        summary: 'Processed 2/2 clients. 0 errors.',
      })

      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bulk_operation',
          entityType: 'client',
          metadata: expect.objectContaining({
            action: 'delete',
            clientIds,
            processed: 2,
            errors: 0,
          }),
        })
      )
    })

    it('should handle errors in bulk operations', async () => {
      const clientIds = ['client-1', 'client-2']

      mockPrisma.client.findFirst
        .mockResolvedValueOnce({ id: 'client-1' } as any)
        .mockRejectedValueOnce(new Error('Client not found'))

      mockPrisma.engagement.count.mockResolvedValue(0)
      mockPrisma.invoice.count.mockResolvedValue(0)
      mockPrisma.client.update.mockResolvedValue({} as any)

      const result = await ClientService.bulkOperation(
        { action: 'delete', clientIds },
        testOrgId,
        testUserId
      )

      expect(result.success).toBe(false)
      expect(result.processed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        clientId: 'client-2',
        error: 'Client not found',
      })
    })
  })

  describe('searchClients', () => {
    it('should search clients with query', async () => {
      const mockClients = [
        { id: 'client-1', businessName: 'Acme Corp', _count: {} },
        { id: 'client-2', businessName: 'Acme Industries', _count: {} },
      ]

      mockPrisma.client.findMany.mockResolvedValue(mockClients as any)

      const result = await ClientService.searchClients(testOrgId, 'acme', 10)

      expect(result).toEqual(mockClients)
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: testOrgId,
          deletedAt: null,
          OR: [
            { businessName: { contains: 'acme', mode: 'insensitive' } },
            { legalName: { contains: 'acme', mode: 'insensitive' } },
            { primaryContactEmail: { contains: 'acme', mode: 'insensitive' } },
            { primaryContactName: { contains: 'acme', mode: 'insensitive' } },
            { taxId: { contains: 'acme', mode: 'insensitive' } },
            { industry: { contains: 'acme', mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: {
              documents: true,
              engagements: true,
              invoices: true,
              notes: true,
            },
          },
        },
        orderBy: {
          businessName: 'asc',
        },
        take: 10,
      })
    })
  })

  describe('exportToCSV', () => {
    it('should export clients to CSV format', async () => {
      const mockClients = [
        {
          businessName: 'Acme Corp',
          legalName: 'Acme Corporation',
          taxId: '12-3456789',
          primaryContactName: 'John Doe',
          primaryContactEmail: 'john@acme.com',
          primaryContactPhone: '555-0123',
          businessAddress: '123 Main St',
          businessType: 'LLC',
          industry: 'Technology',
          status: 'active',
          riskLevel: 'medium',
          annualRevenue: 1000000,
          createdAt: new Date('2024-01-01'),
        },
      ]

      mockPrisma.client.findMany.mockResolvedValue(mockClients as any)
      mockPrisma.client.count.mockResolvedValue(1)

      const result = await ClientService.exportToCSV(testOrgId)

      expect(result).toContain('businessName,legalName,taxId')
      expect(result).toContain('Acme Corp,Acme Corporation,12-3456789')
    })
  })

  describe('getClientMetrics', () => {
    it('should return client financial metrics', async () => {
      const mockInvoiceStats = {
        _count: 10,
        _sum: { totalAmount: 100000, paidAmount: 75000 },
      }

      const mockEngagementStats = [
        { status: 'completed', _count: 5 },
        { status: 'in_progress', _count: 2 },
      ]

      const mockDocumentStats = [
        { category: 'tax', _count: 15 },
        { category: 'financial', _count: 8 },
      ]

      mockPrisma.client.count.mockResolvedValue(25)
      mockPrisma.client.aggregate
        .mockResolvedValueOnce({ _sum: { annualRevenue: 5000000 } } as any)
        .mockResolvedValueOnce({ _avg: { annualRevenue: 200000 } } as any)

      mockPrisma.invoice.aggregate.mockResolvedValue(mockInvoiceStats as any)
      mockPrisma.engagement.groupBy.mockResolvedValue(mockEngagementStats as any)
      mockPrisma.document.groupBy.mockResolvedValue(mockDocumentStats as any)

      const result = await ClientService.getClientMetrics(testOrgId)

      expect(result).toEqual({
        clients: {
          total: 25,
          totalRevenue: 5000000,
          averageRevenue: 200000,
        },
        invoices: {
          total: 10,
          totalAmount: 100000,
          paidAmount: 75000,
          outstandingAmount: 25000,
        },
        engagements: {
          completed: 5,
          in_progress: 2,
        },
        documents: {
          tax: 15,
          financial: 8,
        },
      })
    })
  })

  describe('addClientNote', () => {
    it('should add note to client', async () => {
      const noteData = {
        clientId: testClientId,
        title: 'Meeting Notes',
        content: 'Discussed Q1 financial review',
        noteType: 'meeting',
        priority: 'medium',
        isPrivate: false,
        tags: ['financial', 'review'],
      }

      const createdNote = {
        id: 'note-123',
        ...noteData,
        authorId: testUserId,
        author: { id: testUserId, name: 'Test User', email: 'test@example.com' },
      }

      mockPrisma.note.create.mockResolvedValue(createdNote as any)
      mockAuditService.logAction.mockResolvedValue(undefined)

      const result = await ClientService.addClientNote(noteData, testOrgId, testUserId)

      expect(result).toEqual(createdNote)
      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: {
          ...noteData,
          authorId: testUserId,
          tags: noteData.tags,
          createdBy: testUserId,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      expect(mockAuditService.logAction).toHaveBeenCalled()
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockPrisma.client.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        ClientService.getClients(testOrgId)
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle invalid pagination parameters', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      // Test with negative page number
      const result = await ClientService.getClients(
        testOrgId,
        {},
        { field: 'businessName', direction: 'asc' },
        { page: -1, limit: 10 }
      )

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: -10, // This would be handled by the database
        })
      )
    })

    it('should handle very large limit values', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await ClientService.getClients(
        testOrgId,
        {},
        { field: 'businessName', direction: 'asc' },
        { page: 1, limit: 999999 }
      )

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 999999,
        })
      )
    })

    it('should handle empty search queries', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await ClientService.getClients(testOrgId, { search: '' })

      // Should not add OR clause for empty search
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: testOrgId,
            deletedAt: null,
          },
        })
      )
    })
  })

  describe('Performance considerations', () => {
    it('should handle large result sets efficiently', async () => {
      const largeClientList = Array.from({ length: 1000 }, (_, i) => ({
        id: `client-${i}`,
        businessName: `Client ${i}`,
        _count: { documents: 0, engagements: 0, invoices: 0, notes: 0 },
      }))

      mockPrisma.client.findMany.mockResolvedValue(largeClientList as any)
      mockPrisma.client.count.mockResolvedValue(10000)

      const startTime = Date.now()
      const result = await ClientService.getClients(
        testOrgId,
        {},
        { field: 'businessName', direction: 'asc' },
        { page: 1, limit: 1000 }
      )
      const endTime = Date.now()

      expect(result.clients).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(100) // Should complete quickly in tests
    })

    it('should handle concurrent client operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        mockPrisma.client.findFirst.mockResolvedValue(null)
        mockPrisma.client.create.mockResolvedValue({
          id: `client-${i}`,
          businessName: `Client ${i}`,
          _count: { documents: 0, engagements: 0, invoices: 0, notes: 0 },
        } as any)

        return ClientService.createClient(
          {
            businessName: `Client ${i}`,
            primaryContactName: `Contact ${i}`,
            primaryContactEmail: `contact${i}@example.com`,
            status: 'prospect',
            riskLevel: 'medium',
          },
          testOrgId,
          testUserId
        )
      })

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
    })
  })
})