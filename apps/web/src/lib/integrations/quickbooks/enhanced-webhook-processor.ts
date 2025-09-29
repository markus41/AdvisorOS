import { prisma, redis } from '@/server/db';
import { createHmac, timingSafeEqual } from 'crypto';
import { syncManager } from './sync-manager';
import { CustomerSyncService } from './sync/customer-sync';
import { InvoiceSyncService } from './sync/invoice-sync';
import { createEnhancedQuickBooksOAuthService } from './enhanced-oauth';

export interface WebhookEvent {
  eventNotifications: EventNotification[];
}

export interface EventNotification {
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

export interface WebhookEventRecord {
  id: string;
  organizationId: string;
  eventId: string;
  eventType: string;
  entityName: string;
  entityId: string;
  realmId: string;
  eventTime: Date;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'ignored' | 'duplicate';
  payload: any;
  signature?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  processedAt?: Date;
  errorMessage?: string;
  processingDuration?: number;
}

export interface WebhookProcessingMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  duplicateEvents: number;
  averageProcessingTime: number;
  entityBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
  hourlyStats: Array<{
    hour: string;
    events: number;
    processed: number;
    failed: number;
  }>;
}

export interface WebhookConfig {
  verificationToken?: string;
  enableSignatureVerification: boolean;
  enableDeduplication: boolean;
  deduplicationWindowMs: number;
  maxRetries: number;
  retryDelayMs: number;
  processingTimeoutMs: number;
  batchSize: number;
  enabledEntities: string[];
}

export class EnhancedQuickBooksWebhookProcessor {
  private config: WebhookConfig;
  private processingQueue: Map<string, Promise<any>> = new Map();

  constructor(config?: Partial<WebhookConfig>) {
    this.config = {
      enableSignatureVerification: true,
      enableDeduplication: true,
      deduplicationWindowMs: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      retryDelayMs: 5 * 60 * 1000, // 5 minutes
      processingTimeoutMs: 30 * 1000, // 30 seconds
      batchSize: 50,
      enabledEntities: ['Customer', 'Invoice', 'Item', 'Account', 'Vendor', 'Payment'],
      verificationToken: process.env.QUICKBOOKS_WEBHOOK_TOKEN,
      ...config
    };
  }

  /**
   * Process webhook payload with enhanced security and reliability
   */
  async processWebhookPayload(
    payload: WebhookEvent,
    signature?: string,
    timestamp?: string
  ): Promise<{
    success: boolean;
    processed: number;
    skipped: number;
    failed: number;
    results: any[];
    processingId: string;
  }> {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();

    try {
      // Verify webhook signature if enabled
      if (this.config.enableSignatureVerification && signature) {
        const isValid = await this.verifyWebhookSignature(payload, signature, timestamp);
        if (!isValid) {
          await this.logWebhookEvent('security_violation', {
            processingId,
            reason: 'Invalid signature',
            signature: signature.substring(0, 20) + '...'
          });
          throw new Error('Invalid webhook signature');
        }
      }

      // Log webhook reception
      await this.logWebhookEvent('webhook_received', {
        processingId,
        eventCount: payload.eventNotifications?.length || 0,
        timestamp: new Date()
      });

      const results = [];
      let processed = 0;
      let skipped = 0;
      let failed = 0;

      // Process each event notification
      for (const eventNotification of payload.eventNotifications || []) {
        try {
          const result = await this.processEventNotification(
            eventNotification,
            processingId,
            signature
          );

          results.push(result);

          if (result.skipped > 0) skipped += result.skipped;
          if (result.processed > 0) processed += result.processed;
          if (result.failed > 0) failed += result.failed;

        } catch (error) {
          console.error('Error processing event notification:', error);
          failed++;
          results.push({
            realmId: eventNotification.realmId,
            error: error instanceof Error ? error.message : 'Unknown error',
            processed: 0,
            skipped: 0,
            failed: 1
          });
        }
      }

      // Update processing metrics
      const duration = Date.now() - startTime;
      await this.updateProcessingMetrics(processingId, {
        totalEvents: payload.eventNotifications?.length || 0,
        processed,
        skipped,
        failed,
        duration
      });

      // Log completion
      await this.logWebhookEvent('webhook_completed', {
        processingId,
        processed,
        skipped,
        failed,
        duration
      });

      return {
        success: failed === 0,
        processed,
        skipped,
        failed,
        results,
        processingId
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logWebhookEvent('webhook_failed', {
        processingId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      throw error;
    }
  }

  /**
   * Process a single event notification with enhanced error handling
   */
  async processEventNotification(
    eventNotification: EventNotification,
    processingId: string,
    signature?: string
  ): Promise<{
    realmId: string;
    organizationId: string | null;
    processed: number;
    skipped: number;
    failed: number;
    results: any[];
  }> {
    const { realmId, dataChangeEvent } = eventNotification;

    // Find the organization for this realm
    const organization = await this.findOrganizationByRealmId(realmId);
    if (!organization) {
      console.warn(`No organization found for realm ${realmId}`);
      return {
        realmId,
        organizationId: null,
        processed: 0,
        skipped: 1,
        failed: 0,
        results: [{ error: 'Organization not found' }]
      };
    }

    const results = [];
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    // Process each entity change
    for (const entity of dataChangeEvent.entities) {
      try {
        // Check if entity type is enabled
        if (!this.config.enabledEntities.includes(entity.name)) {
          console.log(`Entity type ${entity.name} is disabled, skipping`);
          skipped++;
          continue;
        }

        // Check for duplicates
        if (this.config.enableDeduplication) {
          const isDuplicate = await this.isDuplicateEvent(
            organization.id,
            realmId,
            entity,
            this.config.deduplicationWindowMs
          );

          if (isDuplicate) {
            console.log(`Duplicate event detected for ${entity.name}:${entity.id}, skipping`);
            skipped++;
            results.push({
              entity: `${entity.name}:${entity.id}`,
              status: 'duplicate'
            });
            continue;
          }
        }

        const result = await this.processEntityChange(
          organization.id,
          realmId,
          entity,
          processingId,
          signature
        );

        results.push(result);
        processed++;

      } catch (error) {
        console.error(`Error processing entity ${entity.name}:${entity.id}:`, error);
        failed++;
        results.push({
          entity: `${entity.name}:${entity.id}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        });
      }
    }

    return {
      realmId,
      organizationId: organization.id,
      processed,
      skipped,
      failed,
      results
    };
  }

  /**
   * Process a single entity change with comprehensive tracking
   */
  private async processEntityChange(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    processingId: string,
    signature?: string
  ): Promise<any> {
    const startTime = Date.now();

    // Create webhook event record for tracking
    const webhookEvent = await this.createWebhookEventRecord(
      organizationId,
      realmId,
      entity,
      processingId,
      signature
    );

    try {
      // Update status to processing
      await this.updateWebhookEventStatus(webhookEvent.id, 'processing');

      // Add to processing queue to prevent concurrent processing
      const queueKey = `${organizationId}:${entity.name}:${entity.id}`;

      if (this.processingQueue.has(queueKey)) {
        console.log(`Entity ${queueKey} already being processed, waiting...`);
        await this.processingQueue.get(queueKey);
      }

      const processingPromise = this.handleEntityOperation(
        organizationId,
        realmId,
        entity,
        processingId
      );

      this.processingQueue.set(queueKey, processingPromise);

      try {
        // Process with timeout
        const result = await Promise.race([
          processingPromise,
          this.createTimeoutPromise(this.config.processingTimeoutMs)
        ]);

        // Mark event as processed
        const duration = Date.now() - startTime;
        await this.markEventProcessed(webhookEvent.id, duration);

        return {
          eventId: webhookEvent.id,
          entity: `${entity.name}:${entity.id}`,
          operation: entity.operation,
          status: 'processed',
          duration,
          result
        };

      } finally {
        this.processingQueue.delete(queueKey);
      }

    } catch (error) {
      const duration = Date.now() - startTime;

      // Mark event as failed and schedule retry
      await this.markEventFailed(
        webhookEvent.id,
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );

      throw error;
    }
  }

  /**
   * Handle the actual entity operation with enhanced sync strategies
   */
  private async handleEntityOperation(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    processingId: string
  ): Promise<any> {
    const sandbox = process.env.QUICKBOOKS_SANDBOX === 'true';

    switch (entity.name) {
      case 'Customer':
        return await this.handleCustomerChange(organizationId, realmId, entity, sandbox);

      case 'Invoice':
        return await this.handleInvoiceChange(organizationId, realmId, entity, sandbox);

      case 'Item':
        return await this.handleItemChange(organizationId, realmId, entity, sandbox);

      case 'Account':
        return await this.handleAccountChange(organizationId, realmId, entity, sandbox);

      case 'Vendor':
        return await this.handleVendorChange(organizationId, realmId, entity, sandbox);

      case 'Payment':
        return await this.handlePaymentChange(organizationId, realmId, entity, sandbox);

      default:
        console.log(`Unhandled entity type: ${entity.name} - operation: ${entity.operation}`);
        return { status: 'unhandled', entity: entity.name };
    }
  }

  /**
   * Enhanced customer change handling
   */
  private async handleCustomerChange(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    sandbox: boolean
  ): Promise<any> {
    const customerSync = new CustomerSyncService(organizationId, realmId, sandbox);

    switch (entity.operation) {
      case 'Create':
      case 'Update':
        // Sync the specific customer with enhanced error handling
        try {
          await customerSync.syncSpecificCustomer(entity.id);
          console.log(`Synced customer ${entity.id} due to ${entity.operation} operation`);
          return { action: 'synced', customerId: entity.id };
        } catch (error) {
          // If specific sync fails, trigger incremental sync
          console.warn(`Direct customer sync failed, triggering incremental sync:`, error);
          await syncManager.triggerManualSync(organizationId, 'incremental', ['customers'], 'webhook_fallback');
          return { action: 'fallback_sync_triggered', customerId: entity.id };
        }

      case 'Delete':
        await this.handleCustomerDeletion(organizationId, entity.id);
        console.log(`Handled customer deletion for ${entity.id}`);
        return { action: 'deleted', customerId: entity.id };

      case 'Void':
        console.log(`Customer void operation for ${entity.id} - logging only`);
        return { action: 'voided', customerId: entity.id };

      default:
        return { action: 'unknown_operation', operation: entity.operation };
    }
  }

  /**
   * Enhanced invoice change handling
   */
  private async handleInvoiceChange(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    sandbox: boolean
  ): Promise<any> {
    const invoiceSync = new InvoiceSyncService(organizationId, realmId, sandbox);

    switch (entity.operation) {
      case 'Create':
      case 'Update':
        try {
          // Try specific invoice sync if method exists
          if (typeof invoiceSync.syncSpecificInvoice === 'function') {
            await invoiceSync.syncSpecificInvoice(entity.id);
            console.log(`Synced invoice ${entity.id} due to ${entity.operation} operation`);
            return { action: 'synced', invoiceId: entity.id };
          } else {
            // Fallback to incremental sync
            await syncManager.triggerManualSync(organizationId, 'incremental', ['invoices'], 'webhook');
            return { action: 'incremental_sync_triggered', invoiceId: entity.id };
          }
        } catch (error) {
          console.warn(`Invoice sync failed, triggering fallback:`, error);
          await syncManager.triggerManualSync(organizationId, 'incremental', ['invoices'], 'webhook_fallback');
          return { action: 'fallback_sync_triggered', invoiceId: entity.id };
        }

      case 'Delete':
      case 'Void':
        await this.handleInvoiceDeletion(organizationId, entity.id, entity.operation);
        console.log(`Handled invoice ${entity.operation} for ${entity.id}`);
        return { action: entity.operation.toLowerCase(), invoiceId: entity.id };

      default:
        return { action: 'unknown_operation', operation: entity.operation };
    }
  }

  /**
   * Handle other entity types with generic sync triggering
   */
  private async handleItemChange(organizationId: string, realmId: string, entity: any, sandbox: boolean): Promise<any> {
    console.log(`Item ${entity.operation} operation for ${entity.id} - triggering items sync`);
    await syncManager.triggerManualSync(organizationId, 'incremental', ['items'], 'webhook');
    return { action: 'sync_triggered', entityType: 'item', entityId: entity.id };
  }

  private async handleAccountChange(organizationId: string, realmId: string, entity: any, sandbox: boolean): Promise<any> {
    console.log(`Account ${entity.operation} operation for ${entity.id} - triggering accounts sync`);
    await syncManager.triggerManualSync(organizationId, 'incremental', ['accounts'], 'webhook');
    return { action: 'sync_triggered', entityType: 'account', entityId: entity.id };
  }

  private async handleVendorChange(organizationId: string, realmId: string, entity: any, sandbox: boolean): Promise<any> {
    console.log(`Vendor ${entity.operation} operation for ${entity.id} - triggering vendors sync`);
    await syncManager.triggerManualSync(organizationId, 'incremental', ['vendors'], 'webhook');
    return { action: 'sync_triggered', entityType: 'vendor', entityId: entity.id };
  }

  private async handlePaymentChange(organizationId: string, realmId: string, entity: any, sandbox: boolean): Promise<any> {
    console.log(`Payment ${entity.operation} operation for ${entity.id} - triggering payments sync`);
    await syncManager.triggerManualSync(organizationId, 'incremental', ['payments'], 'webhook');
    return { action: 'sync_triggered', entityType: 'payment', entityId: entity.id };
  }

  /**
   * Enhanced customer deletion handling with audit trail
   */
  private async handleCustomerDeletion(organizationId: string, quickbooksId: string): Promise<void> {
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

      // Enhanced audit logging
      await prisma.auditLog.create({
        data: {
          action: 'delete',
          entityType: 'client',
          entityId: client.id,
          metadata: {
            source: 'quickbooks_webhook',
            quickbooksId,
            reason: 'Customer deleted in QuickBooks',
            timestamp: new Date(),
            previousStatus: client.status
          },
          organizationId
        }
      });
    }
  }

  /**
   * Enhanced invoice deletion handling
   */
  private async handleInvoiceDeletion(
    organizationId: string,
    quickbooksId: string,
    operation: string
  ): Promise<void> {
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

      // Enhanced audit logging
      await prisma.auditLog.create({
        data: {
          action: operation.toLowerCase(),
          entityType: 'invoice',
          entityId: invoice.id,
          metadata: {
            source: 'quickbooks_webhook',
            quickbooksId,
            operation,
            reason: `Invoice ${operation.toLowerCase()} in QuickBooks`,
            timestamp: new Date(),
            previousStatus: invoice.status
          },
          organizationId
        }
      });
    }
  }

  /**
   * Verify webhook signature for security
   */
  private async verifyWebhookSignature(
    payload: any,
    signature: string,
    timestamp?: string
  ): Promise<boolean> {
    if (!this.config.verificationToken) {
      console.warn('Webhook verification token not configured');
      return false;
    }

    try {
      // Create signature
      const payloadString = JSON.stringify(payload);
      const expectedSignature = createHmac('sha256', this.config.verificationToken)
        .update(payloadString)
        .digest('hex');

      // Compare signatures using timing-safe comparison
      const providedSignature = signature.replace('sha256=', '');

      return timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Check for duplicate events within the deduplication window
   */
  private async isDuplicateEvent(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    windowMs: number
  ): Promise<boolean> {
    const eventSignature = this.generateEventSignature(realmId, entity);
    const cutoffTime = new Date(Date.now() - windowMs);

    try {
      // Check in Redis first for faster lookup
      if (redis) {
        const key = `qb_webhook_dedup:${eventSignature}`;
        const exists = await redis.exists(key);

        if (exists) {
          // Mark as duplicate in database for metrics
          await this.markEventDuplicate(organizationId, realmId, entity);
          return true;
        }

        // Store for deduplication
        await redis.setex(key, Math.ceil(windowMs / 1000), '1');
      }

      // Fallback to database check
      const existing = await prisma.quickBooksWebhookEvent.findFirst({
        where: {
          organizationId,
          entityName: entity.name,
          entityId: entity.id,
          eventType: entity.operation,
          realmId,
          createdAt: { gte: cutoffTime },
          status: { notIn: ['failed', 'ignored'] }
        }
      });

      if (existing) {
        await this.markEventDuplicate(organizationId, realmId, entity);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for duplicate event:', error);
      return false; // On error, process the event
    }
  }

  /**
   * Create webhook event record for comprehensive tracking
   */
  private async createWebhookEventRecord(
    organizationId: string,
    realmId: string,
    entity: { name: string; id: string; operation: string; lastUpdated: string },
    processingId: string,
    signature?: string
  ): Promise<WebhookEventRecord> {
    const eventId = this.generateEventId(realmId, entity);

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
        payload: entity,
        signature: signature?.substring(0, 100), // Store truncated signature for auditing
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        metadata: {
          processingId,
          receivedAt: new Date(),
          version: '2.0'
        }
      }
    });

    return record as WebhookEventRecord;
  }

  /**
   * Process failed webhook events with enhanced retry logic
   */
  async processFailedEvents(): Promise<{
    processed: number;
    stillFailed: number;
    ignored: number;
  }> {
    const failedEvents = await prisma.quickBooksWebhookEvent.findMany({
      where: {
        status: 'failed',
        nextRetryAt: {
          lte: new Date()
        },
        retryCount: {
          lt: this.config.maxRetries
        }
      },
      take: this.config.batchSize,
      orderBy: { nextRetryAt: 'asc' }
    });

    console.log(`Processing ${failedEvents.length} failed webhook events`);

    let processed = 0;
    let stillFailed = 0;
    let ignored = 0;

    for (const event of failedEvents) {
      try {
        await this.updateWebhookEventStatus(event.id, 'processing');

        const result = await this.handleEntityOperation(
          event.organizationId,
          event.realmId,
          {
            name: event.entityName,
            id: event.entityId,
            operation: event.eventType,
            lastUpdated: event.eventTime.toISOString()
          },
          event.metadata?.processingId || 'retry'
        );

        await this.markEventProcessed(event.id);
        processed++;
        console.log(`Successfully processed failed event ${event.id}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (event.retryCount >= this.config.maxRetries - 1) {
          // Max retries reached, ignore the event
          await this.markEventIgnored(event.id, 'Max retries exceeded');
          ignored++;
          console.warn(`Ignoring event ${event.id} after max retries: ${errorMessage}`);
        } else {
          // Schedule next retry
          await this.markEventFailed(event.id, errorMessage);
          stillFailed++;
          console.error(`Failed to process event ${event.id} (attempt ${event.retryCount + 1}): ${errorMessage}`);
        }
      }
    }

    return { processed, stillFailed, ignored };
  }

  /**
   * Get webhook processing metrics
   */
  async getProcessingMetrics(
    organizationId?: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<WebhookProcessingMetrics> {
    const timeRangeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - timeRangeMs[timeRange]);

    try {
      const whereClause = {
        createdAt: { gte: since },
        ...(organizationId && { organizationId })
      };

      const [
        totalEvents,
        processedEvents,
        failedEvents,
        duplicateEvents,
        entityStats,
        errorStats,
        avgProcessingTime
      ] = await Promise.all([
        prisma.quickBooksWebhookEvent.count({ where: whereClause }),
        prisma.quickBooksWebhookEvent.count({
          where: { ...whereClause, status: 'processed' }
        }),
        prisma.quickBooksWebhookEvent.count({
          where: { ...whereClause, status: 'failed' }
        }),
        prisma.quickBooksWebhookEvent.count({
          where: { ...whereClause, status: 'duplicate' }
        }),
        prisma.quickBooksWebhookEvent.groupBy({
          by: ['entityName'],
          where: whereClause,
          _count: true
        }),
        prisma.quickBooksWebhookEvent.groupBy({
          by: ['errorMessage'],
          where: { ...whereClause, status: 'failed' },
          _count: true
        }),
        prisma.quickBooksWebhookEvent.aggregate({
          where: {
            ...whereClause,
            status: 'processed',
            processingDuration: { not: null }
          },
          _avg: { processingDuration: true }
        })
      ]);

      const entityBreakdown = entityStats.reduce((acc, stat) => {
        acc[stat.entityName] = stat._count;
        return acc;
      }, {} as Record<string, number>);

      const errorBreakdown = errorStats.reduce((acc, stat) => {
        if (stat.errorMessage) {
          acc[stat.errorMessage] = stat._count;
        }
        return acc;
      }, {} as Record<string, number>);

      // Generate hourly stats for the timeframe
      const hourlyStats = await this.generateHourlyStats(since, organizationId);

      return {
        totalEvents,
        processedEvents,
        failedEvents,
        duplicateEvents,
        averageProcessingTime: avgProcessingTime._avg.processingDuration || 0,
        entityBreakdown,
        errorBreakdown,
        hourlyStats
      };
    } catch (error) {
      console.error('Error getting webhook processing metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateProcessingId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(realmId: string, entity: any): string {
    return `${realmId}-${entity.name}-${entity.id}-${entity.operation}-${Date.now()}`;
  }

  private generateEventSignature(realmId: string, entity: any): string {
    return `${realmId}:${entity.name}:${entity.id}:${entity.operation}:${entity.lastUpdated}`;
  }

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

  private async updateWebhookEventStatus(eventId: string, status: string): Promise<void> {
    await prisma.quickBooksWebhookEvent.update({
      where: { id: eventId },
      data: { status, updatedAt: new Date() }
    });
  }

  private async markEventProcessed(eventId: string, duration?: number): Promise<void> {
    await prisma.quickBooksWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'processed',
        processedAt: new Date(),
        processingDuration: duration,
        updatedAt: new Date()
      }
    });
  }

  private async markEventFailed(eventId: string, errorMessage: string, duration?: number): Promise<void> {
    const event = await prisma.quickBooksWebhookEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) return;

    const retryCount = event.retryCount + 1;
    const delay = this.config.retryDelayMs * Math.pow(2, retryCount - 1); // Exponential backoff
    const nextRetryAt = retryCount <= this.config.maxRetries
      ? new Date(Date.now() + delay)
      : null;

    await prisma.quickBooksWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: retryCount <= this.config.maxRetries ? 'failed' : 'ignored',
        errorMessage,
        retryCount,
        nextRetryAt,
        processingDuration: duration,
        updatedAt: new Date()
      }
    });
  }

  private async markEventIgnored(eventId: string, reason: string): Promise<void> {
    await prisma.quickBooksWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'ignored',
        errorMessage: reason,
        updatedAt: new Date()
      }
    });
  }

  private async markEventDuplicate(organizationId: string, realmId: string, entity: any): Promise<void> {
    // Create a duplicate record for metrics
    await prisma.quickBooksWebhookEvent.create({
      data: {
        organizationId,
        eventId: this.generateEventId(realmId, entity),
        eventType: entity.operation,
        entityName: entity.name,
        entityId: entity.id,
        realmId,
        eventTime: new Date(entity.lastUpdated),
        status: 'duplicate',
        payload: entity,
        retryCount: 0,
        maxRetries: 0
      }
    });
  }

  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  private async updateProcessingMetrics(processingId: string, metrics: any): Promise<void> {
    try {
      if (redis) {
        const key = `qb_webhook_metrics:${processingId}`;
        await redis.setex(key, 3600, JSON.stringify({
          ...metrics,
          timestamp: new Date()
        }));
      }
    } catch (error) {
      console.warn('Failed to update processing metrics:', error);
    }
  }

  private async logWebhookEvent(eventType: string, metadata: any): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          organizationId: metadata.organizationId || 'system',
          eventType: `quickbooks_webhook_${eventType}`,
          severity: eventType.includes('violation') ? 'high' : 'medium',
          metadata: {
            integration: 'quickbooks',
            component: 'webhook_processor',
            ...metadata
          }
        }
      });
    } catch (error) {
      console.warn('Failed to log webhook event:', error);
    }
  }

  private async generateHourlyStats(since: Date, organizationId?: string): Promise<any[]> {
    // This would generate hourly statistics for the dashboard
    // Implementation depends on your specific requirements
    return [];
  }
}

// Export function for scheduled job processing
export async function processFailedWebhookEvents(): Promise<void> {
  const processor = new EnhancedQuickBooksWebhookProcessor();
  await processor.processFailedEvents();
}

// Factory function
export function createEnhancedWebhookProcessor(config?: Partial<WebhookConfig>): EnhancedQuickBooksWebhookProcessor {
  return new EnhancedQuickBooksWebhookProcessor(config);
}

// Export types
export type {
  WebhookEvent,
  EventNotification,
  WebhookEventRecord,
  WebhookProcessingMetrics,
  WebhookConfig
};