import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { TRPCError } from '@trpc/server'
import { clientRouter } from '@/server/api/routers/client'
import { ClientService } from '@/lib/services/client-service'
import { createMockContext } from '@/tests/helpers/trpc-helpers'

// Mock the ClientService
jest.mock('@/lib/services/client-service')

const mockClientService = ClientService as jest.Mocked<typeof ClientService>

describe('Client Router', () => {
  let mockContext: ReturnType<typeof createMockContext>

  beforeEach(() => {
    mockContext = createMockContext()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('list procedure', () => {
    it('should return paginated clients with default parameters', async () => {
      const mockClients = {
        clients: [
          {
            id: 'client_1',
            businessName: 'Test Business 1',
            status: 'ACTIVE',
            createdAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      }

      mockClientService.getClients.mockResolvedValue(mockClients)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.list({})

      expect(ClientService.getClients).toHaveBeenCalledWith(
        mockContext.organizationId,
        {},
        undefined,
        undefined
      )
      expect(result).toEqual(mockClients)
    })

    it('should apply filters and sorting', async () => {
      const filters = { status: ['ACTIVE'], search: 'test' }
      const sort = { field: 'businessName', direction: 'asc' as const }
      const pagination = { page: 1, limit: 20 }

      const mockClients = {
        clients: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      }

      mockClientService.getClients.mockResolvedValue(mockClients)

      const caller = clientRouter.createCaller(mockContext)
      await caller.list({ filters, sort, pagination })

      expect(ClientService.getClients).toHaveBeenCalledWith(
        mockContext.organizationId,
        filters,
        sort,
        pagination
      )
    })
  })

  describe('byId procedure', () => {
    it('should return client by ID with relations', async () => {
      const mockClient = {
        id: 'client_1',
        businessName: 'Test Business',
        status: 'ACTIVE',
        organizationId: mockContext.organizationId,
      }

      mockClientService.getClientById.mockResolvedValue(mockClient)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.byId({ id: 'client_1' })

      expect(ClientService.getClientById).toHaveBeenCalledWith(
        'client_1',
        mockContext.organizationId,
        true
      )
      expect(result).toEqual(mockClient)
    })

    it('should return client by ID without relations when specified', async () => {
      const mockClient = {
        id: 'client_1',
        businessName: 'Test Business',
        status: 'ACTIVE',
        organizationId: mockContext.organizationId,
      }

      mockClientService.getClientById.mockResolvedValue(mockClient)

      const caller = clientRouter.createCaller(mockContext)
      await caller.byId({ id: 'client_1', includeRelations: false })

      expect(ClientService.getClientById).toHaveBeenCalledWith(
        'client_1',
        mockContext.organizationId,
        false
      )
    })

    it('should throw NOT_FOUND error when client does not exist', async () => {
      mockClientService.getClientById.mockResolvedValue(null)

      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.byId({ id: 'nonexistent' })).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        })
      )
    })

    it('should validate CUID format for client ID', async () => {
      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.byId({ id: 'invalid-id' })).rejects.toThrow()
    })
  })

  describe('create procedure', () => {
    it('should create a new client successfully', async () => {
      const clientData = {
        businessName: 'New Business',
        legalName: 'New Business LLC',
        primaryContactEmail: 'contact@newbusiness.com',
        primaryContactName: 'John Doe',
        businessType: 'LLC' as const,
        status: 'ACTIVE' as const,
      }

      const mockCreatedClient = {
        id: 'client_1',
        ...clientData,
        organizationId: mockContext.organizationId,
        createdAt: new Date(),
      }

      mockClientService.createClient.mockResolvedValue(mockCreatedClient)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.create(clientData)

      expect(ClientService.createClient).toHaveBeenCalledWith(
        clientData,
        mockContext.organizationId,
        mockContext.userId
      )
      expect(result).toEqual(mockCreatedClient)
    })

    it('should throw CONFLICT error when client already exists', async () => {
      const clientData = {
        businessName: 'Existing Business',
        legalName: 'Existing Business LLC',
        primaryContactEmail: 'contact@existing.com',
        primaryContactName: 'Jane Doe',
        businessType: 'LLC' as const,
        status: 'ACTIVE' as const,
      }

      mockClientService.createClient.mockRejectedValue(
        new Error('Client with this business name already exists')
      )

      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.create(clientData)).rejects.toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'Client with this business name already exists',
        })
      )
    })

    it('should throw INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      const clientData = {
        businessName: 'Test Business',
        legalName: 'Test Business LLC',
        primaryContactEmail: 'test@business.com',
        primaryContactName: 'Test User',
        businessType: 'LLC' as const,
        status: 'ACTIVE' as const,
      }

      mockClientService.createClient.mockRejectedValue(
        new Error('Database connection failed')
      )

      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.create(clientData)).rejects.toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create client',
        })
      )
    })
  })

  describe('update procedure', () => {
    it('should update client successfully', async () => {
      const updateData = {
        id: 'client_1',
        businessName: 'Updated Business Name',
        primaryContactEmail: 'updated@business.com',
      }

      const mockUpdatedClient = {
        id: 'client_1',
        businessName: 'Updated Business Name',
        primaryContactEmail: 'updated@business.com',
        organizationId: mockContext.organizationId,
        updatedAt: new Date(),
      }

      mockClientService.updateClient.mockResolvedValue(mockUpdatedClient)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.update(updateData)

      expect(ClientService.updateClient).toHaveBeenCalledWith(
        updateData.id,
        updateData,
        mockContext.organizationId,
        mockContext.userId
      )
      expect(result).toEqual(mockUpdatedClient)
    })

    it('should throw NOT_FOUND error when client does not exist', async () => {
      const updateData = {
        id: 'nonexistent',
        businessName: 'Updated Name',
      }

      mockClientService.updateClient.mockRejectedValue(
        new Error('Client not found')
      )

      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.update(updateData)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        })
      )
    })

    it('should throw CONFLICT error for duplicate business name', async () => {
      const updateData = {
        id: 'client_1',
        businessName: 'Existing Business Name',
      }

      mockClientService.updateClient.mockRejectedValue(
        new Error('Business name already exists')
      )

      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.update(updateData)).rejects.toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'Business name already exists',
        })
      )
    })
  })

  describe('delete procedure', () => {
    it('should delete client successfully', async () => {
      mockClientService.deleteClient.mockResolvedValue()

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.delete({ id: 'client_1' })

      expect(ClientService.deleteClient).toHaveBeenCalledWith(
        'client_1',
        mockContext.organizationId,
        mockContext.userId
      )
      expect(result).toEqual({ success: true })
    })

    it('should throw NOT_FOUND error when client does not exist', async () => {
      mockClientService.deleteClient.mockRejectedValue(
        new Error('Client not found')
      )

      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.delete({ id: 'nonexistent' })).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        })
      )
    })

    it('should throw CONFLICT error when client cannot be deleted', async () => {
      mockClientService.deleteClient.mockRejectedValue(
        new Error('Cannot delete client with active engagements')
      )

      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.delete({ id: 'client_1' })).rejects.toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete client with active engagements',
        })
      )
    })
  })

  describe('stats procedure', () => {
    it('should return client statistics', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        inactive: 2,
        byStatus: {
          ACTIVE: 8,
          INACTIVE: 2,
        },
        byBusinessType: {
          LLC: 5,
          CORPORATION: 3,
          PARTNERSHIP: 2,
        },
      }

      mockClientService.getClientStats.mockResolvedValue(mockStats)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.stats()

      expect(ClientService.getClientStats).toHaveBeenCalledWith(
        mockContext.organizationId
      )
      expect(result).toEqual(mockStats)
    })
  })

  describe('search procedure', () => {
    it('should search clients with default limit', async () => {
      const mockClients = [
        {
          id: 'client_1',
          businessName: 'Test Business',
          primaryContactEmail: 'test@business.com',
        },
      ]

      mockClientService.searchClients.mockResolvedValue(mockClients)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.search({ query: 'test' })

      expect(ClientService.searchClients).toHaveBeenCalledWith(
        mockContext.organizationId,
        'test',
        10
      )
      expect(result).toEqual({
        query: 'test',
        results: mockClients,
        count: 1,
      })
    })

    it('should search clients with custom limit', async () => {
      const mockClients = []

      mockClientService.searchClients.mockResolvedValue(mockClients)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.search({ query: 'nonexistent', limit: 25 })

      expect(ClientService.searchClients).toHaveBeenCalledWith(
        mockContext.organizationId,
        'nonexistent',
        25
      )
      expect(result.count).toBe(0)
    })

    it('should validate search query is not empty', async () => {
      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.search({ query: '' })).rejects.toThrow()
    })

    it('should enforce maximum limit of 50', async () => {
      const caller = clientRouter.createCaller(mockContext)

      await expect(caller.search({ query: 'test', limit: 100 })).rejects.toThrow()
    })
  })

  describe('bulkOperation procedure', () => {
    it('should perform bulk operations successfully', async () => {
      const bulkData = {
        action: 'delete' as const,
        clientIds: ['client_1', 'client_2'],
        reason: 'Bulk cleanup',
      }

      const mockResult = {
        success: true,
        processed: 2,
        failed: 0,
        results: [
          { id: 'client_1', success: true },
          { id: 'client_2', success: true },
        ],
      }

      mockClientService.bulkOperation.mockResolvedValue(mockResult)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.bulkOperation(bulkData)

      expect(ClientService.bulkOperation).toHaveBeenCalledWith(
        bulkData,
        mockContext.organizationId,
        mockContext.userId
      )
      expect(result).toEqual(mockResult)
    })
  })

  describe('export procedure', () => {
    it('should export clients to CSV', async () => {
      const exportData = {
        filters: { status: ['ACTIVE'] },
        fields: ['businessName', 'primaryContactEmail', 'status'],
      }

      const mockCsvData = 'Business Name,Email,Status\nTest Business,test@business.com,ACTIVE'

      mockClientService.exportToCSV.mockResolvedValue(mockCsvData)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.export(exportData)

      expect(ClientService.exportToCSV).toHaveBeenCalledWith(
        mockContext.organizationId,
        exportData.filters,
        exportData.fields
      )
      expect(result.data).toBe(mockCsvData)
      expect(result.contentType).toBe('text/csv')
      expect(result.fileName).toMatch(/clients-export-\d{4}-\d{2}-\d{2}\.csv/)
    })

    it('should export with default filters when none provided', async () => {
      const exportData = {
        fields: ['businessName', 'primaryContactEmail'],
      }

      mockClientService.exportToCSV.mockResolvedValue('csv,data')

      const caller = clientRouter.createCaller(mockContext)
      await caller.export(exportData)

      expect(ClientService.exportToCSV).toHaveBeenCalledWith(
        mockContext.organizationId,
        {},
        exportData.fields
      )
    })
  })

  describe('validateBusinessName procedure', () => {
    it('should return availability when business name is unique', async () => {
      mockContext.prisma.client.findFirst.mockResolvedValue(null)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.validateBusinessName({
        businessName: 'Unique Business Name',
      })

      expect(result).toEqual({
        isAvailable: true,
        exists: false,
      })
    })

    it('should return unavailability when business name exists', async () => {
      mockContext.prisma.client.findFirst.mockResolvedValue({ id: 'existing_client' })

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.validateBusinessName({
        businessName: 'Existing Business Name',
      })

      expect(result).toEqual({
        isAvailable: false,
        exists: true,
      })
    })

    it('should exclude specified client ID from validation', async () => {
      mockContext.prisma.client.findFirst.mockResolvedValue(null)

      const caller = clientRouter.createCaller(mockContext)
      await caller.validateBusinessName({
        businessName: 'Business Name',
        excludeId: 'client_1',
      })

      expect(mockContext.prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: mockContext.organizationId,
          businessName: 'Business Name',
          deletedAt: null,
          id: { not: 'client_1' },
        },
        select: { id: true },
      })
    })
  })

  describe('validateTaxId procedure', () => {
    it('should return availability when tax ID is unique', async () => {
      mockContext.prisma.client.findFirst.mockResolvedValue(null)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.validateTaxId({
        taxId: '12-3456789',
      })

      expect(result).toEqual({
        isAvailable: true,
        exists: false,
      })
    })

    it('should return unavailability when tax ID exists', async () => {
      mockContext.prisma.client.findFirst.mockResolvedValue({ id: 'existing_client' })

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.validateTaxId({
        taxId: '12-3456789',
      })

      expect(result).toEqual({
        isAvailable: false,
        exists: true,
      })
    })
  })

  describe('importFromCSV procedure', () => {
    it('should import clients from CSV successfully', async () => {
      const csvData = 'Business Name,Email\nTest Business,test@business.com'
      const options = {
        skipDuplicates: true,
        updateExisting: false,
      }

      const mockResult = {
        success: true,
        imported: 1,
        skipped: 0,
        errors: [],
      }

      mockClientService.importFromCSVData.mockResolvedValue(mockResult)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.importFromCSV({ csvData, options })

      expect(ClientService.importFromCSVData).toHaveBeenCalledWith(
        csvData,
        mockContext.organizationId,
        mockContext.userId,
        options
      )
      expect(result).toEqual(mockResult)
    })

    it('should throw INTERNAL_SERVER_ERROR when import fails', async () => {
      const csvData = 'invalid,csv,data'

      mockClientService.importFromCSVData.mockRejectedValue(
        new Error('Invalid CSV format')
      )

      const caller = clientRouter.createCaller(mockContext)

      await expect(
        caller.importFromCSV({ csvData })
      ).rejects.toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to import clients from CSV',
        })
      )
    })
  })

  describe('addNote procedure', () => {
    it('should add note to client successfully', async () => {
      const noteData = {
        clientId: 'client_1',
        content: 'This is a test note',
        noteType: 'general' as const,
        priority: 'normal' as const,
      }

      const mockClient = { id: 'client_1' }
      const mockNote = {
        id: 'note_1',
        ...noteData,
        createdAt: new Date(),
      }

      mockClientService.getClientById.mockResolvedValue(mockClient)
      mockClientService.addClientNote.mockResolvedValue(mockNote)

      const caller = clientRouter.createCaller(mockContext)
      const result = await caller.addNote(noteData)

      expect(ClientService.getClientById).toHaveBeenCalledWith(
        'client_1',
        mockContext.organizationId,
        false
      )
      expect(ClientService.addClientNote).toHaveBeenCalledWith(
        noteData,
        mockContext.organizationId,
        mockContext.userId
      )
      expect(result).toEqual(mockNote)
    })

    it('should throw NOT_FOUND when client does not exist', async () => {
      mockClientService.getClientById.mockResolvedValue(null)

      const caller = clientRouter.createCaller(mockContext)

      await expect(
        caller.addNote({
          clientId: 'nonexistent',
          content: 'Test note',
        })
      ).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        })
      )
    })
  })
})