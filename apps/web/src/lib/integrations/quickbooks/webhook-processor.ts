import { prisma } from '@/packages/database';
import { syncManager } from './sync-manager';
import { CustomerSyncService } from './sync/customer-sync';
import { InvoiceSyncService } from './sync/invoice-sync';
import { createQuickBooksOAuthService } from './oauth';

interface EventNotification {
  realmId: string;
  dataChangeEvent: {
    entities: Array<{
      name: string;
      id: string;
      operation: 'Create' | 'Update' | 'Delete' | 'Void';
      lastUpdated: string;
    }>;
  };
}

interface WebhookEventRecord {
  id: string;
  organizationId: string;
  eventId: string;
  eventType: string;
  entityName: string;
  entityId: string;
  realmId: string;
  eventTime: Date;
  status: string;
  payload: any;
}

export class QuickBooksWebhookProcessor {
  /**
   * Process a single event notification from QuickBooks
   */
  async processEventNotification(eventNotification: EventNotification): Promise<any> {
    const { realmId, dataChangeEvent } = eventNotification;

    console.log(`Processing webhook for realm ${realmId} with ${dataChangeEvent.entities.length} entities`);

    // Find the organization for this realm
    const organization = await this.findOrganizationByRealmId(realmId);
    if (!organization) {
      console.warn(`No organization found for realm ${realmId}`);
      return { realmId, error: 'Organization not found' };
    }

    const results = [];

    // Process each entity change
    for (const entity of dataChangeEvent.entities) {
      try {
        const result = await this.processEntityChange(organization.id, realmId, entity);
        results.push(result);
      } catch (error) {
        console.error(`Error processing entity ${entity.name}:${entity.id}:`, error);
        results.push({
          entity: `${entity.name}:${entity.id}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      realmId,
      organizationId: organization.id,
      processed: results.length,
      results
    };
  }

  /**
   * Process a single entity change
   */
  private async processEntityChange(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string }
  ): Promise<any> {
    // Create webhook event record
    const webhookEvent = await this.createWebhookEventRecord(
      organizationId,
      realmId,
      entity
    );

    try {
      // Process the entity based on its type and operation
      await this.handleEntityOperation(organizationId, realmId, entity);

      // Mark event as processed
      await this.markEventProcessed(webhookEvent.id);

      return {
        eventId: webhookEvent.id,
        entity: `${entity.name}:${entity.id}`,
        operation: entity.operation,
        status: 'processed'
      };

    } catch (error) {
      // Mark event as failed and schedule retry
      await this.markEventFailed(webhookEvent.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Handle the actual entity operation
   */
  private async handleEntityOperation(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string }
  ): Promise<void> {
    const sandbox = process.env.QUICKBOOKS_SANDBOX === 'true';

    switch (entity.name) {
      case 'Customer':
        await this.handleCustomerChange(organizationId, realmId, entity, sandbox);
        break;

      case 'Invoice':
        await this.handleInvoiceChange(organizationId, realmId, entity, sandbox);
        break;

      case 'Item':
        // Handle item changes if needed
        console.log(`Item ${entity.operation} operation for ${entity.id} - logging only`);
        break;

      case 'Account':
        // Handle account changes if needed
        console.log(`Account ${entity.operation} operation for ${entity.id} - logging only`);
        break;

      case 'Vendor':
        // Handle vendor changes if needed
        console.log(`Vendor ${entity.operation} operation for ${entity.id} - logging only`);
        break;

      case 'Payment':
        // Handle payment changes if needed
        console.log(`Payment ${entity.operation} operation for ${entity.id} - logging only`);
        break;

      default:
        console.log(`Unhandled entity type: ${entity.name} - operation: ${entity.operation}`);
        break;
    }
  }

  /**
   * Handle customer-related webhook events
   */
  private async handleCustomerChange(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    sandbox: boolean
  ): Promise<void> {
    const customerSync = new CustomerSyncService(organizationId, realmId, sandbox);

    switch (entity.operation) {
      case 'Create':
      case 'Update':
        // Sync the specific customer
        await customerSync.syncSpecificCustomer(entity.id);
        console.log(`Synced customer ${entity.id} due to ${entity.operation} operation`);
        break;

      case 'Delete':
        // Mark customer as inactive or handle deletion
        await this.handleCustomerDeletion(organizationId, entity.id);
        console.log(`Handled customer deletion for ${entity.id}`);
        break;

      case 'Void':
        // Handle voided customer (rare case)
        console.log(`Customer void operation for ${entity.id} - logging only`);
        break;
    }
  }

  /**
   * Handle invoice-related webhook events
   */
  private async handleInvoiceChange(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    sandbox: boolean
  ): Promise<void> {
    const invoiceSync = new InvoiceSyncService(organizationId, realmId, sandbox);

    switch (entity.operation) {
      case 'Create':
      case 'Update':
        // Trigger invoice sync - this will be implemented based on your invoice sync service
        console.log(`Invoice ${entity.operation} operation for ${entity.id} - triggering sync`);

        // For now, trigger a broader invoice sync
        // In production, you might want to implement syncSpecificInvoice method
        await syncManager.triggerManualSync(organizationId, 'incremental', ['invoices'], 'webhook');
        break;

      case 'Delete':
      case 'Void':
        // Handle invoice deletion/voiding
        await this.handleInvoiceDeletion(organizationId, entity.id, entity.operation);
        console.log(`Handled invoice ${entity.operation} for ${entity.id}`);
        break;
    }
  }

  /**
   * Handle customer deletion
   */
  private async handleCustomerDeletion(organizationId: string, quickbooksId: string): Promise<void> {
    // Find and deactivate the customer
    const client = await prisma.client.findFirst({
      where: {
        quickbooksId,
        organizationId
      }
    });

    if (client) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          status: 'inactive',
          updatedAt: new Date()
        }
      });

      // Log the deletion
      await prisma.auditLog.create({
        data: {
          action: 'delete',
          entityType: 'client',
          entityId: client.id,
          metadata: {
            source: 'quickbooks_webhook',
            quickbooksId,
            reason: 'Customer deleted in QuickBooks'
          },
          organizationId
        }
      });
    }
  }

  /**
   * Handle invoice deletion/voiding
   */
  private async handleInvoiceDeletion(
    organizationId: string,
    quickbooksId: string,
    operation: string
  ): Promise<void> {
    // Find the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        organizationId,
        customFields: {
          path: ['quickbooksData', 'quickbooksId'],
          equals: quickbooksId
        }
      }
    });

    if (invoice) {
      const newStatus = operation === 'Void' ? 'cancelled' : 'cancelled';

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });

      // Log the operation
      await prisma.auditLog.create({
        data: {
          action: operation.toLowerCase(),
          entityType: 'invoice',
          entityId: invoice.id,
          metadata: {
            source: 'quickbooks_webhook',
            quickbooksId,
            operation,
            reason: `Invoice ${operation.toLowerCase()} in QuickBooks`
          },
          organizationId
        }
      });
    }
  }

  /**
   * Create webhook event record for tracking
   */
  private async createWebhookEventRecord(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string }
  ): Promise<WebhookEventRecord> {
    const eventId = `${realmId}-${entity.name}-${entity.id}-${entity.operation}-${Date.now()}`;

    const record = await prisma.quickBooksWebhookEvent.create({
      data: {
        organizationId,
        eventId,
        eventType: entity.operation,
        entityName: entity.name,
        entityId: entity.id,
        realmId,
        eventTime: new Date(entity.lastUpdated),
        status: 'pending',
        payload: entity
      }
    });

    return record as WebhookEventRecord;
  }

  /**
   * Mark webhook event as processed
   */
  private async markEventProcessed(eventId: string): Promise<void> {
    await prisma.quickBooksWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'processed',
        processedAt: new Date()
      }
    });
  }

  /**
   * Mark webhook event as failed and schedule retry
   */
  private async markEventFailed(eventId: string, errorMessage: string): Promise<void> {
    const event = await prisma.quickBooksWebhookEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) return;

    const retryCount = event.retryCount + 1;
    const maxRetries = event.maxRetries;

    // Calculate next retry time with exponential backoff
    const baseDelay = 5 * 60 * 1000; // 5 minutes
    const delay = baseDelay * Math.pow(2, retryCount - 1);
    const nextRetryAt = retryCount <= maxRetries
      ? new Date(Date.now() + delay)
      : null;

    await prisma.quickBooksWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: retryCount <= maxRetries ? 'failed' : 'ignored',
        errorMessage,
        retryCount,
        nextRetryAt
      }
    });
  }

  /**
   * Find organization by QuickBooks realm ID
   */
  private async findOrganizationByRealmId(realmId: string): Promise<{ id: string } | null> {
    const token = await prisma.quickBooksToken.findFirst({
      where: {
        realmId,
        isActive: true,
        deletedAt: null
      },
      include: {
        organization: {
          select: { id: true }
        }
      }
    });

    return token?.organization || null;
  }

  /**
   * Process failed webhook events (for retry mechanism)
   */
  async processFailedEvents(): Promise<void> {
    const failedEvents = await prisma.quickBooksWebhookEvent.findMany({
      where: {
        status: 'failed',
        nextRetryAt: {
          lte: new Date()
        },
        retryCount: {
          lt: 3 // maxRetries
        }
      },
      take: 50 // Process in batches
    });

    console.log(`Processing ${failedEvents.length} failed webhook events`);

    for (const event of failedEvents) {
      try {
        await this.handleEntityOperation(
          event.organizationId,
          event.realmId,
          {
            name: event.entityName,
            id: event.entityId,
            operation: event.eventType,
            lastUpdated: event.eventTime.toISOString()
          }
        );

        await this.markEventProcessed(event.id);
        console.log(`Successfully processed failed event ${event.id}`);

      } catch (error) {
        await this.markEventFailed(event.id, error instanceof Error ? error.message : 'Unknown error');
        console.error(`Failed to process event ${event.id}:`, error);
      }
    }
  }
}

// Export function to be called by a scheduled job
export async function processFailedWebhookEvents(): Promise<void> {
  const processor = new QuickBooksWebhookProcessor();
  await processor.processFailedEvents();
}