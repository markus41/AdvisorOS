import { prisma } from '@/packages/database';
import { createQuickBooksOAuthService } from './oauth';
import { CompanySyncService } from './sync/company-sync';
import { AccountsSyncService } from './sync/accounts-sync';
import { CustomerSyncService } from './sync/customer-sync';
import { InvoiceSyncService } from './sync/invoice-sync';
import { ReportsSyncService } from './sync/reports-sync';
import { TransactionSyncService } from './sync/transaction-sync';

export interface SyncConfiguration {
  enabledEntities: string[];
  syncInterval: number; // in hours
  maxRetries: number;
  retryDelay: number; // in minutes
  fullSyncFrequency: number; // in days
  maxRecordsPerSync: number;
  enableWebhooks: boolean;
}

export interface SyncProgress {
  organizationId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentEntity?: string;
  totalEntities: number;
  completedEntities: number;
  startedAt?: Date;
  estimatedCompletion?: Date;
  lastError?: string;
}

export interface SyncSchedule {
  organizationId: string;
  nextSyncAt: Date;
  lastSyncAt?: Date;
  syncType: 'full' | 'incremental';
  configuration: SyncConfiguration;
}

export class QuickBooksSyncManager {
  private static instance: QuickBooksSyncManager;
  private syncInProgress = new Map<string, SyncProgress>();
  private syncSchedules = new Map<string, SyncSchedule>();
  private syncTimers = new Map<string, NodeJS.Timeout>();

  private readonly defaultConfig: SyncConfiguration = {
    enabledEntities: ['company', 'accounts', 'customers', 'invoices', 'reports', 'transactions'],
    syncInterval: 4, // 4 hours
    maxRetries: 3,
    retryDelay: 15, // 15 minutes
    fullSyncFrequency: 7, // 7 days
    maxRecordsPerSync: 1000,
    enableWebhooks: true
  };

  private constructor() {
    this.initializeScheduler();
  }

  static getInstance(): QuickBooksSyncManager {
    if (!QuickBooksSyncManager.instance) {
      QuickBooksSyncManager.instance = new QuickBooksSyncManager();
    }
    return QuickBooksSyncManager.instance;
  }

  /**
   * Schedule sync for an organization
   */
  async scheduleSyncForOrganization(
    organizationId: string,
    configuration?: Partial<SyncConfiguration>
  ): Promise<void> {
    const config = { ...this.defaultConfig, ...configuration };

    // Calculate next sync time
    const nextSyncAt = new Date();
    nextSyncAt.setHours(nextSyncAt.getHours() + config.syncInterval);

    const schedule: SyncSchedule = {
      organizationId,
      nextSyncAt,
      syncType: 'incremental',
      configuration: config
    };

    this.syncSchedules.set(organizationId, schedule);
    this.scheduleNextSync(organizationId);

    console.log(`Scheduled sync for organization ${organizationId} at ${nextSyncAt.toISOString()}`);
  }

  /**
   * Trigger manual sync for an organization
   */
  async triggerManualSync(
    organizationId: string,
    syncType: 'full' | 'incremental' = 'incremental',
    selectedEntities?: string[],
    triggeredBy?: string
  ): Promise<string> {
    console.log(`Manual sync triggered for organization ${organizationId} (type: ${syncType})`);

    // Check if sync is already in progress
    if (this.syncInProgress.has(organizationId)) {
      throw new Error('Sync already in progress for this organization');
    }

    // Verify QuickBooks connection
    const oauthService = createQuickBooksOAuthService();
    const hasConnection = await oauthService.hasValidConnection(organizationId);

    if (!hasConnection) {
      throw new Error('No valid QuickBooks connection found. Please reconnect your account.');
    }

    // Get configuration
    const schedule = this.syncSchedules.get(organizationId);
    const config = schedule?.configuration || this.defaultConfig;

    // Determine entities to sync
    const entitiesToSync = selectedEntities || config.enabledEntities;

    // Create sync record
    const syncRecord = await prisma.quickBooksSync.create({
      data: {
        organizationId,
        syncType: 'manual',
        entityType: 'all',
        status: 'pending',
        triggeredBy,
        metadata: {
          syncType,
          selectedEntities: entitiesToSync,
          fullSync: syncType === 'full'
        }
      }
    });

    // Start sync process
    this.performOrganizationSync(organizationId, syncType, entitiesToSync, syncRecord.id)
      .catch(error => {
        console.error(`Manual sync failed for organization ${organizationId}:`, error);
        this.updateSyncProgress(organizationId, {
          status: 'failed',
          lastError: error.message
        });
      });

    return syncRecord.id;
  }

  /**
   * Get sync status for an organization
   */
  getSyncStatus(organizationId: string): SyncProgress | null {
    return this.syncInProgress.get(organizationId) || null;
  }

  /**
   * Get sync history for an organization
   */
  async getSyncHistory(organizationId: string, limit = 20): Promise<any[]> {
    return prisma.quickBooksSync.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        syncType: true,
        entityType: true,
        status: true,
        startedAt: true,
        completedAt: true,
        recordsProcessed: true,
        recordsSuccess: true,
        recordsFailed: true,
        errorMessage: true,
        triggeredBy: true,
        metadata: true
      }
    });
  }

  /**
   * Pause sync for an organization
   */
  pauseSync(organizationId: string): void {
    const progress = this.syncInProgress.get(organizationId);
    if (progress && progress.status === 'running') {
      this.updateSyncProgress(organizationId, { status: 'paused' });
      console.log(`Sync paused for organization ${organizationId}`);
    }
  }

  /**
   * Resume sync for an organization
   */
  resumeSync(organizationId: string): void {
    const progress = this.syncInProgress.get(organizationId);
    if (progress && progress.status === 'paused') {
      this.updateSyncProgress(organizationId, { status: 'running' });
      console.log(`Sync resumed for organization ${organizationId}`);
    }
  }

  /**
   * Cancel sync for an organization
   */
  async cancelSync(organizationId: string): Promise<void> {
    const progress = this.syncInProgress.get(organizationId);
    if (progress) {
      this.syncInProgress.delete(organizationId);

      // Update any pending sync records
      await prisma.quickBooksSync.updateMany({
        where: {
          organizationId,
          status: { in: ['pending', 'in_progress'] }
        },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
          errorMessage: 'Sync cancelled by user'
        }
      });

      console.log(`Sync cancelled for organization ${organizationId}`);
    }
  }

  /**
   * Update sync configuration for an organization
   */
  async updateSyncConfiguration(
    organizationId: string,
    configuration: Partial<SyncConfiguration>
  ): Promise<void> {
    const schedule = this.syncSchedules.get(organizationId);
    if (schedule) {
      schedule.configuration = { ...schedule.configuration, ...configuration };

      // Reschedule if interval changed
      if (configuration.syncInterval) {
        this.clearScheduledSync(organizationId);
        this.scheduleNextSync(organizationId);
      }

      console.log(`Updated sync configuration for organization ${organizationId}`);
    }
  }

  // Private methods

  private initializeScheduler(): void {
    // Load existing schedules from database on startup
    this.loadExistingSchedules();

    // Set up periodic scheduler check
    setInterval(() => {
      this.checkScheduledSyncs();
    }, 60000); // Check every minute
  }

  private async loadExistingSchedules(): Promise<void> {
    try {
      // Load organizations with active QuickBooks tokens
      const organizations = await prisma.organization.findMany({
        where: {
          quickbooksToken: {
            isActive: true,
            deletedAt: null
          }
        },
        include: {
          quickbooksToken: true
        }
      });

      for (const org of organizations) {
        await this.scheduleSyncForOrganization(org.id);
      }

      console.log(`Loaded sync schedules for ${organizations.length} organizations`);
    } catch (error) {
      console.error('Failed to load existing schedules:', error);
    }
  }

  private checkScheduledSyncs(): void {
    const now = new Date();

    for (const [organizationId, schedule] of this.syncSchedules.entries()) {
      if (schedule.nextSyncAt <= now && !this.syncInProgress.has(organizationId)) {
        console.log(`Triggering scheduled sync for organization ${organizationId}`);

        // Determine sync type based on last full sync
        const syncType = this.shouldPerformFullSync(schedule) ? 'full' : 'incremental';

        this.triggerManualSync(organizationId, syncType, undefined, 'system')
          .catch(error => {
            console.error(`Scheduled sync failed for organization ${organizationId}:`, error);
          });
      }
    }
  }

  private shouldPerformFullSync(schedule: SyncSchedule): boolean {
    if (!schedule.lastSyncAt) return true;

    const daysSinceLastSync = (Date.now() - schedule.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastSync >= schedule.configuration.fullSyncFrequency;
  }

  private scheduleNextSync(organizationId: string): void {
    const schedule = this.syncSchedules.get(organizationId);
    if (!schedule) return;

    // Clear existing timer
    this.clearScheduledSync(organizationId);

    // Calculate delay until next sync
    const delay = schedule.nextSyncAt.getTime() - Date.now();

    if (delay > 0) {
      const timer = setTimeout(() => {
        this.checkScheduledSyncs();
      }, delay);

      this.syncTimers.set(organizationId, timer);
    }
  }

  private clearScheduledSync(organizationId: string): void {
    const timer = this.syncTimers.get(organizationId);
    if (timer) {
      clearTimeout(timer);
      this.syncTimers.delete(organizationId);
    }
  }

  private async performOrganizationSync(
    organizationId: string,
    syncType: 'full' | 'incremental',
    entitiesToSync: string[],
    mainSyncId: string
  ): Promise<void> {
    // Initialize progress tracking
    this.updateSyncProgress(organizationId, {
      status: 'running',
      totalEntities: entitiesToSync.length,
      completedEntities: 0,
      startedAt: new Date()
    });

    try {
      // Get realm ID
      const tokenInfo = await createQuickBooksOAuthService().getTokenInfo(organizationId);
      if (!tokenInfo) {
        throw new Error('No QuickBooks token found');
      }

      const realmId = tokenInfo.realmId;
      const sandbox = process.env.QUICKBOOKS_SANDBOX === 'true';

      // Update main sync record
      await prisma.quickBooksSync.update({
        where: { id: mainSyncId },
        data: { status: 'in_progress' }
      });

      // Sync each entity type
      for (let i = 0; i < entitiesToSync.length; i++) {
        const entityType = entitiesToSync[i];

        // Check if sync is paused or cancelled
        const progress = this.syncInProgress.get(organizationId);
        if (!progress || progress.status !== 'running') {
          break;
        }

        this.updateSyncProgress(organizationId, {
          currentEntity: entityType,
          completedEntities: i
        });

        try {
          await this.syncEntityType(organizationId, realmId, entityType, syncType, sandbox);
        } catch (error) {
          console.error(`Failed to sync ${entityType} for organization ${organizationId}:`, error);
          // Continue with other entities
        }
      }

      // Mark sync as completed
      this.updateSyncProgress(organizationId, {
        status: 'completed',
        completedEntities: entitiesToSync.length
      });

      // Update main sync record
      await prisma.quickBooksSync.update({
        where: { id: mainSyncId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Update schedule
      const schedule = this.syncSchedules.get(organizationId);
      if (schedule) {
        schedule.lastSyncAt = new Date();
        schedule.nextSyncAt = new Date(Date.now() + schedule.configuration.syncInterval * 60 * 60 * 1000);
        this.scheduleNextSync(organizationId);
      }

    } catch (error) {
      console.error(`Organization sync failed for ${organizationId}:`, error);

      this.updateSyncProgress(organizationId, {
        status: 'failed',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update main sync record
      await prisma.quickBooksSync.update({
        where: { id: mainSyncId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      // Remove from progress tracking after delay
      setTimeout(() => {
        this.syncInProgress.delete(organizationId);
      }, 30000); // Keep status visible for 30 seconds
    }
  }

  private async syncEntityType(
    organizationId: string,
    realmId: string,
    entityType: string,
    syncType: 'full' | 'incremental',
    sandbox: boolean
  ): Promise<void> {
    const config = this.syncSchedules.get(organizationId)?.configuration || this.defaultConfig;
    const options = {
      fullSync: syncType === 'full',
      maxRecords: config.maxRecordsPerSync
    };

    let syncService;

    switch (entityType) {
      case 'company':
        syncService = new CompanySyncService(organizationId, realmId, sandbox);
        break;
      case 'accounts':
        syncService = new AccountsSyncService(organizationId, realmId, sandbox);
        break;
      case 'customers':
        syncService = new CustomerSyncService(organizationId, realmId, sandbox);
        break;
      case 'invoices':
        syncService = new InvoiceSyncService(organizationId, realmId, sandbox);
        break;
      case 'reports':
        syncService = new ReportsSyncService(organizationId, realmId, sandbox);
        break;
      case 'transactions':
        syncService = new TransactionSyncService(organizationId, realmId, sandbox);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    await syncService.startSync('scheduled', 'system', options);
  }

  private updateSyncProgress(organizationId: string, updates: Partial<SyncProgress>): void {
    const current = this.syncInProgress.get(organizationId) || {
      organizationId,
      status: 'idle',
      totalEntities: 0,
      completedEntities: 0
    };

    const updated = { ...current, ...updates };

    // Calculate estimated completion
    if (updated.status === 'running' && updated.startedAt && updated.totalEntities > 0) {
      const elapsed = Date.now() - updated.startedAt.getTime();
      const avgTimePerEntity = elapsed / Math.max(updated.completedEntities, 1);
      const remainingEntities = updated.totalEntities - updated.completedEntities;
      updated.estimatedCompletion = new Date(Date.now() + (avgTimePerEntity * remainingEntities));
    }

    this.syncInProgress.set(organizationId, updated);
  }
}

// Export singleton instance
export const syncManager = QuickBooksSyncManager.getInstance();