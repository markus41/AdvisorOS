import { prisma } from '@/server/db';
import { createQuickBooksApiClient } from '../client';

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors: string[];
  lastCursor?: string;
}

export interface SyncOptions {
  fullSync?: boolean;
  maxRecords?: number;
  lastSyncCursor?: string;
  dryRun?: boolean;
}

export abstract class BaseSyncService {
  protected organizationId: string;
  protected realmId: string;
  protected apiClient: ReturnType<typeof createQuickBooksApiClient>;

  constructor(organizationId: string, realmId: string, sandbox = false) {
    this.organizationId = organizationId;
    this.realmId = realmId;
    this.apiClient = createQuickBooksApiClient(organizationId, sandbox);
  }

  abstract getEntityType(): string;
  abstract syncData(options?: SyncOptions): Promise<SyncResult>;

  /**
   * Start a sync operation and track it in the database
   */
  async startSync(syncType: string, triggeredBy?: string, options?: SyncOptions): Promise<string> {
    const syncRecord = await prisma.quickBooksSync.create({
      data: {
        organizationId: this.organizationId,
        syncType,
        entityType: this.getEntityType(),
        status: 'pending',
        lastSyncCursor: options?.lastSyncCursor,
        triggeredBy,
        metadata: {
          options,
          startTime: new Date().toISOString()
        }
      }
    });

    // Start the sync process
    this.performSync(syncRecord.id, options).catch(error => {
      console.error(`Sync ${syncRecord.id} failed:`, error);
      this.updateSyncStatus(syncRecord.id, 'failed', error.message);
    });

    return syncRecord.id;
  }

  /**
   * Perform the actual sync operation
   */
  protected async performSync(syncId: string, options?: SyncOptions): Promise<void> {
    try {
      // Update status to in progress
      await this.updateSyncStatus(syncId, 'in_progress');

      // Perform the sync
      const result = await this.syncData(options);

      // Update with final results
      await prisma.quickBooksSync.update({
        where: { id: syncId },
        data: {
          status: result.success ? 'completed' : 'failed',
          completedAt: new Date(),
          recordsProcessed: result.recordsProcessed,
          recordsSuccess: result.recordsSuccess,
          recordsFailed: result.recordsFailed,
          errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
          errorDetails: result.errors.length > 0 ? { errors: result.errors } : null,
          lastSyncCursor: result.lastCursor,
          metadata: {
            ...((await this.getSyncMetadata(syncId))?.metadata || {}),
            completedAt: new Date().toISOString(),
            result
          }
        }
      });

      // Update last sync time on the token
      if (result.success) {
        await prisma.quickBooksToken.update({
          where: { organizationId: this.organizationId },
          data: { lastSyncAt: new Date() }
        });
      }

    } catch (error) {
      console.error(`Sync ${syncId} error:`, error);
      await this.updateSyncStatus(syncId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Update sync status
   */
  protected async updateSyncStatus(syncId: string, status: string, errorMessage?: string): Promise<void> {
    await prisma.quickBooksSync.update({
      where: { id: syncId },
      data: {
        status,
        errorMessage,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get sync metadata
   */
  protected async getSyncMetadata(syncId: string): Promise<any> {
    return prisma.quickBooksSync.findUnique({
      where: { id: syncId },
      select: { metadata: true }
    });
  }

  /**
   * Paginate through QuickBooks API results
   */
  protected async paginateResults<T>(
    fetchFunction: (maxResults: number, startPosition: number) => Promise<any>,
    maxRecords = 1000,
    pageSize = 100
  ): Promise<T[]> {
    const results: T[] = [];
    let startPosition = 1;
    let hasMore = true;

    while (hasMore && results.length < maxRecords) {
      const remainingRecords = maxRecords - results.length;
      const currentPageSize = Math.min(pageSize, remainingRecords);

      try {
        const response = await fetchFunction(currentPageSize, startPosition);

        if (response?.QueryResponse) {
          const entityType = Object.keys(response.QueryResponse).find(key =>
            Array.isArray(response.QueryResponse[key])
          );

          if (entityType) {
            const items = response.QueryResponse[entityType] || [];
            results.push(...items);

            // Check if we have more results
            const maxResults = response.QueryResponse.maxResults || 0;
            hasMore = items.length === currentPageSize && maxResults >= startPosition + currentPageSize - 1;
            startPosition += currentPageSize;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Pagination error:', error);
        hasMore = false;
      }

      // Add small delay to respect rate limits
      await this.delay(100);
    }

    return results;
  }

  /**
   * Map QuickBooks entity to local entity
   */
  protected abstract mapToLocalEntity(qbEntity: any): any;

  /**
   * Check if entity should be synced based on modification date
   */
  protected shouldSyncEntity(entity: any, lastSyncDate?: Date): boolean {
    if (!lastSyncDate) return true;

    const lastUpdated = entity.MetaData?.LastUpdatedTime;
    if (!lastUpdated) return true;

    return new Date(lastUpdated) > lastSyncDate;
  }

  /**
   * Get last sync date for this entity type
   */
  protected async getLastSyncDate(): Promise<Date | null> {
    const lastSync = await prisma.quickBooksSync.findFirst({
      where: {
        organizationId: this.organizationId,
        entityType: this.getEntityType(),
        status: 'completed'
      },
      orderBy: { completedAt: 'desc' }
    });

    return lastSync?.completedAt || null;
  }

  /**
   * Utility delay function
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log sync progress
   */
  protected async logProgress(syncId: string, message: string, details?: any): Promise<void> {
    console.log(`[Sync ${syncId}] ${message}`, details || '');

    // Optionally update metadata with progress logs
    try {
      const current = await this.getSyncMetadata(syncId);
      const logs = current?.metadata?.logs || [];
      logs.push({
        timestamp: new Date().toISOString(),
        message,
        details
      });

      await prisma.quickBooksSync.update({
        where: { id: syncId },
        data: {
          metadata: {
            ...current?.metadata,
            logs: logs.slice(-100) // Keep last 100 log entries
          }
        }
      });
    } catch (error) {
      console.warn('Failed to log progress:', error);
    }
  }

  /**
   * Handle sync conflicts and data validation
   */
  protected validateEntity(entity: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!entity) {
      errors.push('Entity is null or undefined');
      return { isValid: false, errors };
    }

    if (!entity.Id) {
      errors.push('Entity missing required ID field');
    }

    // Entity-specific validation should be implemented in derived classes
    const customValidation = this.customValidateEntity(entity);
    errors.push(...customValidation);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Override this method for entity-specific validation
   */
  protected customValidateEntity(entity: any): string[] {
    return [];
  }
}