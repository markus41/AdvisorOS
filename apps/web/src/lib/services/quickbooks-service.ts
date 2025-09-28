import { prisma } from '@cpa-platform/database'

export interface QuickBooksConnectionStatus {
  isConnected: boolean
  tokenExpired: boolean
  realmId?: string
  companyName?: string
  lastSyncAt?: Date
  tokenExpiresAt?: Date
}

export interface ClientSyncOptions {
  syncType: 'full' | 'incremental'
  forceSync: boolean
}

export interface ClientSyncResult {
  success: boolean
  clientId: string
  quickbooksId?: string
  syncedAt: Date
  changes?: string[]
  errors?: string[]
  metadata?: any
}

/**
 * QuickBooks Service for handling QuickBooks integration
 */
export class QuickBooksService {
  /**
   * Get QuickBooks connection status for an organization
   */
  static async getConnectionStatus(organizationId: string): Promise<QuickBooksConnectionStatus> {
    try {
      const token = await prisma.quickBooksToken.findFirst({
        where: {
          organizationId,
          isActive: true,
          deletedAt: null
        }
      })

      if (!token) {
        return {
          isConnected: false,
          tokenExpired: true
        }
      }

      const isExpired = token.expiresAt <= new Date()

      return {
        isConnected: !isExpired,
        tokenExpired: isExpired,
        realmId: token.realmId,
        lastSyncAt: token.lastSyncAt,
        tokenExpiresAt: token.expiresAt
      }
    } catch (error) {
      console.error('Failed to get QuickBooks connection status:', error)
      return {
        isConnected: false,
        tokenExpired: true
      }
    }
  }

  /**
   * Sync a specific client with QuickBooks
   */
  static async syncClient(
    clientId: string,
    organizationId: string,
    userId: string,
    options: ClientSyncOptions
  ): Promise<ClientSyncResult> {
    try {
      // Get client data
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          organizationId,
          deletedAt: null
        }
      })

      if (!client) {
        throw new Error('Client not found')
      }

      // Check QuickBooks connection
      const connectionStatus = await this.getConnectionStatus(organizationId)
      if (!connectionStatus.isConnected) {
        throw new Error('QuickBooks not connected or token expired')
      }

      // Create sync record
      const syncRecord = await prisma.quickBooksSync.create({
        data: {
          organizationId,
          syncType: options.syncType,
          entityType: 'customers',
          status: 'in_progress',
          triggeredBy: userId,
          metadata: {
            clientId,
            forceSync: options.forceSync
          }
        }
      })

      try {
        // Simulate QuickBooks API integration
        // In a real implementation, you would:
        // 1. Get QuickBooks access token
        // 2. Make API calls to QuickBooks
        // 3. Handle response and update local data

        const result = await this.performClientSync(client, connectionStatus, options)

        // Update sync record with success
        await prisma.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            recordsTotal: 1,
            recordsProcessed: 1,
            recordsSuccess: 1,
            recordsFailed: 0,
            metadata: {
              ...syncRecord.metadata,
              result
            }
          }
        })

        // Update client with QuickBooks data
        if (result.quickbooksId) {
          await prisma.client.update({
            where: { id: clientId },
            data: {
              quickbooksId: result.quickbooksId,
              financialData: result.metadata,
              updatedBy: userId
            }
          })
        }

        return result
      } catch (error) {
        // Update sync record with failure
        await prisma.quickBooksSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            recordsTotal: 1,
            recordsProcessed: 1,
            recordsSuccess: 0,
            recordsFailed: 1,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })

        throw error
      }
    } catch (error) {
      console.error('Failed to sync client with QuickBooks:', error)
      return {
        success: false,
        clientId,
        syncedAt: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Perform the actual sync with QuickBooks API
   */
  private static async performClientSync(
    client: any,
    connectionStatus: QuickBooksConnectionStatus,
    options: ClientSyncOptions
  ): Promise<ClientSyncResult> {
    // This is a mock implementation
    // In a real implementation, you would use the QuickBooks SDK

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock QuickBooks customer data
      const quickbooksCustomer = {
        id: `qb_customer_${client.id.slice(-8)}`,
        name: client.businessName,
        companyName: client.legalName || client.businessName,
        email: client.primaryContactEmail,
        phone: client.primaryContactPhone,
        address: client.businessAddress,
        taxId: client.taxId,
        balance: Math.floor(Math.random() * 10000), // Mock balance
        creditLimit: Math.floor(Math.random() * 50000), // Mock credit limit
        lastUpdated: new Date().toISOString()
      }

      const changes = []
      if (!client.quickbooksId) {
        changes.push('Created new QuickBooks customer')
      } else {
        changes.push('Updated existing QuickBooks customer')
      }

      return {
        success: true,
        clientId: client.id,
        quickbooksId: quickbooksCustomer.id,
        syncedAt: new Date(),
        changes,
        metadata: {
          quickbooksData: quickbooksCustomer,
          syncType: options.syncType,
          lastSync: new Date().toISOString()
        }
      }
    } catch (error) {
      throw new Error(`QuickBooks API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get sync status for a specific client
   */
  static async getClientSyncStatus(
    clientId: string,
    organizationId: string
  ) {
    try {
      const [client, lastSync] = await Promise.all([
        prisma.client.findFirst({
          where: { id: clientId, organizationId, deletedAt: null },
          select: {
            id: true,
            businessName: true,
            quickbooksId: true,
            financialData: true,
            updatedAt: true
          }
        }),
        prisma.quickBooksSync.findFirst({
          where: {
            organizationId,
            entityType: 'customers',
            metadata: {
              path: ['clientId'],
              equals: clientId
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      ])

      if (!client) {
        throw new Error('Client not found')
      }

      const connectionStatus = await this.getConnectionStatus(organizationId)

      return {
        clientId: client.id,
        clientName: client.businessName,
        isConnected: !!client.quickbooksId,
        quickbooksId: client.quickbooksId,
        canSync: connectionStatus.isConnected,
        lastSyncAt: lastSync?.completedAt,
        lastSyncStatus: lastSync?.status,
        lastSyncError: lastSync?.errorMessage,
        financialData: client.financialData,
        needsSync: !lastSync || client.updatedAt > (lastSync?.completedAt || new Date(0))
      }
    } catch (error) {
      console.error('Failed to get client sync status:', error)
      throw error
    }
  }

  /**
   * Get sync status for all clients in an organization
   */
  static async getAllClientSyncStatuses(organizationId: string) {
    try {
      const [clients, connectionStatus, recentSyncs] = await Promise.all([
        prisma.client.findMany({
          where: { organizationId, deletedAt: null },
          select: {
            id: true,
            businessName: true,
            quickbooksId: true,
            updatedAt: true
          }
        }),
        this.getConnectionStatus(organizationId),
        prisma.quickBooksSync.findMany({
          where: {
            organizationId,
            entityType: 'customers',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      ])

      const syncStatusMap = new Map()
      recentSyncs.forEach(sync => {
        const clientId = sync.metadata?.clientId
        if (clientId && !syncStatusMap.has(clientId)) {
          syncStatusMap.set(clientId, sync)
        }
      })

      return {
        connectionStatus,
        clients: clients.map(client => {
          const lastSync = syncStatusMap.get(client.id)
          return {
            clientId: client.id,
            clientName: client.businessName,
            isConnected: !!client.quickbooksId,
            quickbooksId: client.quickbooksId,
            lastSyncAt: lastSync?.completedAt,
            lastSyncStatus: lastSync?.status,
            needsSync: !lastSync || client.updatedAt > (lastSync?.completedAt || new Date(0))
          }
        })
      }
    } catch (error) {
      console.error('Failed to get all client sync statuses:', error)
      throw error
    }
  }

  /**
   * Sync all clients with QuickBooks
   */
  static async syncAllClients(
    organizationId: string,
    userId: string,
    options: Partial<ClientSyncOptions> = {}
  ) {
    try {
      const connectionStatus = await this.getConnectionStatus(organizationId)
      if (!connectionStatus.isConnected) {
        throw new Error('QuickBooks not connected or token expired')
      }

      const clients = await prisma.client.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, businessName: true }
      })

      const results = []
      for (const client of clients) {
        try {
          const result = await this.syncClient(
            client.id,
            organizationId,
            userId,
            {
              syncType: options.syncType || 'incremental',
              forceSync: options.forceSync || false
            }
          )
          results.push(result)
        } catch (error) {
          results.push({
            success: false,
            clientId: client.id,
            syncedAt: new Date(),
            errors: [error instanceof Error ? error.message : 'Unknown error']
          })
        }
      }

      return {
        success: results.every(r => r.success),
        totalClients: clients.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        results
      }
    } catch (error) {
      console.error('Failed to sync all clients:', error)
      throw error
    }
  }

  /**
   * Handle QuickBooks webhook events
   */
  static async handleWebhookEvent(
    organizationId: string,
    eventData: any
  ) {
    try {
      // Store webhook event
      const webhookEvent = await prisma.quickBooksWebhookEvent.create({
        data: {
          organizationId,
          eventId: eventData.eventId,
          eventType: eventData.eventType,
          entityName: eventData.entityName,
          entityId: eventData.entityId,
          realmId: eventData.realmId,
          eventTime: new Date(eventData.eventTime),
          payload: eventData
        }
      })

      // Process the event
      if (eventData.entityName === 'Customer' && eventData.entityType === 'UPDATE') {
        // Find the client by QuickBooks ID
        const client = await prisma.client.findFirst({
          where: {
            organizationId,
            quickbooksId: eventData.entityId,
            deletedAt: null
          }
        })

        if (client) {
          // Trigger a sync for this client
          await this.syncClient(
            client.id,
            organizationId,
            'system', // System user for webhook-triggered syncs
            {
              syncType: 'incremental',
              forceSync: false
            }
          )
        }
      }

      // Mark webhook as processed
      await prisma.quickBooksWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'processed',
          processedAt: new Date()
        }
      })

      return { success: true, eventId: webhookEvent.id }
    } catch (error) {
      console.error('Failed to handle QuickBooks webhook event:', error)
      throw error
    }
  }
}

// Helper function for backward compatibility
export async function syncWithQuickBooks(
  organizationId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  if (entityType === 'client') {
    await QuickBooksService.syncClient(
      entityId,
      organizationId,
      'system',
      { syncType: 'incremental', forceSync: false }
    )
  }
}