import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

interface DataLoaderOptions {
  cache?: boolean;
  maxBatchSize?: number;
  batchScheduleFn?: (callback: () => void) => void;
  cacheKeyFn?: (key: any) => any;
  name?: string;
}

interface BatchLoadContext {
  organizationId?: string;
  userId?: string;
  requestId?: string;
}

export class DataLoaderService {
  private loaders: Map<string, DataLoader<any, any>> = new Map();
  private context: BatchLoadContext = {};

  constructor(
    private prisma: PrismaClient,
    private redis?: Redis
  ) {}

  // Set context for current request
  setContext(context: BatchLoadContext): void {
    this.context = context;
  }

  // Clear all loaders (typically called at end of request)
  clearAll(): void {
    this.loaders.clear();
  }

  // ORGANIZATION LOADERS
  getOrganizationLoader(): DataLoader<string, any> {
    const key = 'organization';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (ids: readonly string[]) => {
          const organizations = await this.prisma.organization.findMany({
            where: { id: { in: [...ids] } },
            select: {
              id: true,
              name: true,
              subdomain: true,
              subscriptionTier: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          // Return in same order as requested
          return ids.map(id =>
            organizations.find(org => org.id === id) || null
          );
        },
        {
          cache: true,
          maxBatchSize: 100,
          name: 'OrganizationLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // USER LOADERS
  getUserLoader(): DataLoader<string, any> {
    const key = 'user';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (ids: readonly string[]) => {
          const users = await this.prisma.user.findMany({
            where: {
              id: { in: [...ids] },
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              organizationId: true,
              lastLoginAt: true,
              createdAt: true,
            },
          });

          return ids.map(id =>
            users.find(user => user.id === id) || null
          );
        },
        {
          cache: true,
          maxBatchSize: 50,
          name: 'UserLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  getUsersByOrganizationLoader(): DataLoader<string, any[]> {
    const key = 'usersByOrganization';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (organizationIds: readonly string[]) => {
          const users = await this.prisma.user.findMany({
            where: {
              organizationId: { in: [...organizationIds] },
              deletedAt: null,
              isActive: true,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              organizationId: true,
            },
            orderBy: { name: 'asc' },
          });

          // Group by organization
          const usersByOrg = organizationIds.map(orgId =>
            users.filter(user => user.organizationId === orgId)
          );

          return usersByOrg;
        },
        {
          cache: true,
          maxBatchSize: 20,
          name: 'UsersByOrganizationLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // CLIENT LOADERS
  getClientLoader(): DataLoader<string, any> {
    const key = 'client';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (ids: readonly string[]) => {
          const clients = await this.prisma.client.findMany({
            where: {
              id: { in: [...ids] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              businessName: true,
              legalName: true,
              primaryContactEmail: true,
              primaryContactName: true,
              primaryContactPhone: true,
              businessType: true,
              industry: true,
              status: true,
              riskLevel: true,
              organizationId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return ids.map(id =>
            clients.find(client => client.id === id) || null
          );
        },
        {
          cache: true,
          maxBatchSize: 100,
          name: 'ClientLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  getClientsByOrganizationLoader(): DataLoader<string, any[]> {
    const key = 'clientsByOrganization';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (organizationIds: readonly string[]) => {
          const clients = await this.prisma.client.findMany({
            where: {
              organizationId: { in: [...organizationIds] },
              deletedAt: null,
            },
            select: {
              id: true,
              businessName: true,
              primaryContactEmail: true,
              primaryContactName: true,
              status: true,
              riskLevel: true,
              organizationId: true,
              createdAt: true,
            },
            orderBy: { businessName: 'asc' },
          });

          return organizationIds.map(orgId =>
            clients.filter(client => client.organizationId === orgId)
          );
        },
        {
          cache: true,
          maxBatchSize: 20,
          name: 'ClientsByOrganizationLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // DOCUMENT LOADERS
  getDocumentLoader(): DataLoader<string, any> {
    const key = 'document';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (ids: readonly string[]) => {
          const documents = await this.prisma.document.findMany({
            where: {
              id: { in: [...ids] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              fileType: true,
              mimeType: true,
              fileSize: true,
              category: true,
              subcategory: true,
              year: true,
              quarter: true,
              ocrStatus: true,
              needsReview: true,
              clientId: true,
              organizationId: true,
              uploadedBy: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return ids.map(id =>
            documents.find(doc => doc.id === id) || null
          );
        },
        {
          cache: true,
          maxBatchSize: 100,
          name: 'DocumentLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  getDocumentsByClientLoader(): DataLoader<string, any[]> {
    const key = 'documentsByClient';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (clientIds: readonly string[]) => {
          const documents = await this.prisma.document.findMany({
            where: {
              clientId: { in: [...clientIds] },
              deletedAt: null,
              isLatestVersion: true,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              fileName: true,
              fileType: true,
              category: true,
              year: true,
              ocrStatus: true,
              needsReview: true,
              clientId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to avoid loading too many documents
          });

          return clientIds.map(clientId =>
            documents.filter(doc => doc.clientId === clientId)
          );
        },
        {
          cache: true,
          maxBatchSize: 20,
          name: 'DocumentsByClientLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // ENGAGEMENT LOADERS
  getEngagementLoader(): DataLoader<string, any> {
    const key = 'engagement';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (ids: readonly string[]) => {
          const engagements = await this.prisma.engagement.findMany({
            where: {
              id: { in: [...ids] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              name: true,
              description: true,
              type: true,
              status: true,
              priority: true,
              startDate: true,
              dueDate: true,
              completedDate: true,
              estimatedHours: true,
              actualHours: true,
              clientId: true,
              organizationId: true,
              assignedToId: true,
              createdById: true,
              year: true,
              quarter: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return ids.map(id =>
            engagements.find(eng => eng.id === id) || null
          );
        },
        {
          cache: true,
          maxBatchSize: 100,
          name: 'EngagementLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  getEngagementsByClientLoader(): DataLoader<string, any[]> {
    const key = 'engagementsByClient';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (clientIds: readonly string[]) => {
          const engagements = await this.prisma.engagement.findMany({
            where: {
              clientId: { in: [...clientIds] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              priority: true,
              dueDate: true,
              clientId: true,
              assignedToId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          return clientIds.map(clientId =>
            engagements.filter(eng => eng.clientId === clientId)
          );
        },
        {
          cache: true,
          maxBatchSize: 20,
          name: 'EngagementsByClientLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // TASK LOADERS
  getTaskLoader(): DataLoader<string, any> {
    const key = 'task';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (ids: readonly string[]) => {
          const tasks = await this.prisma.task.findMany({
            where: {
              id: { in: [...ids] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              taskType: true,
              estimatedHours: true,
              actualHours: true,
              startDate: true,
              dueDate: true,
              completedDate: true,
              assignedToId: true,
              createdById: true,
              engagementId: true,
              organizationId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return ids.map(id =>
            tasks.find(task => task.id === id) || null
          );
        },
        {
          cache: true,
          maxBatchSize: 100,
          name: 'TaskLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  getTasksByAssigneeLoader(): DataLoader<string, any[]> {
    const key = 'tasksByAssignee';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (userIds: readonly string[]) => {
          const tasks = await this.prisma.task.findMany({
            where: {
              assignedToId: { in: [...userIds] },
              deletedAt: null,
              status: { not: 'completed' },
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              assignedToId: true,
              engagementId: true,
              createdAt: true,
            },
            orderBy: [
              { priority: 'desc' },
              { dueDate: 'asc' },
            ],
          });

          return userIds.map(userId =>
            tasks.filter(task => task.assignedToId === userId)
          );
        },
        {
          cache: true,
          maxBatchSize: 20,
          name: 'TasksByAssigneeLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  getTasksByEngagementLoader(): DataLoader<string, any[]> {
    const key = 'tasksByEngagement';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (engagementIds: readonly string[]) => {
          const tasks = await this.prisma.task.findMany({
            where: {
              engagementId: { in: [...engagementIds] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              assignedToId: true,
              engagementId: true,
              estimatedHours: true,
              actualHours: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          });

          return engagementIds.map(engagementId =>
            tasks.filter(task => task.engagementId === engagementId)
          );
        },
        {
          cache: true,
          maxBatchSize: 20,
          name: 'TasksByEngagementLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // INVOICE LOADERS
  getInvoiceLoader(): DataLoader<string, any> {
    const key = 'invoice';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (ids: readonly string[]) => {
          const invoices = await this.prisma.invoice.findMany({
            where: {
              id: { in: [...ids] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              invoiceNumber: true,
              title: true,
              status: true,
              invoiceDate: true,
              dueDate: true,
              subtotal: true,
              taxAmount: true,
              totalAmount: true,
              paidAmount: true,
              balanceAmount: true,
              clientId: true,
              engagementId: true,
              organizationId: true,
              createdById: true,
              sentAt: true,
              paidAt: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return ids.map(id =>
            invoices.find(invoice => invoice.id === id) || null
          );
        },
        {
          cache: true,
          maxBatchSize: 100,
          name: 'InvoiceLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  getInvoicesByClientLoader(): DataLoader<string, any[]> {
    const key = 'invoicesByClient';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (clientIds: readonly string[]) => {
          const invoices = await this.prisma.invoice.findMany({
            where: {
              clientId: { in: [...clientIds] },
              deletedAt: null,
              ...(this.context.organizationId && { organizationId: this.context.organizationId }),
            },
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              totalAmount: true,
              paidAmount: true,
              dueDate: true,
              clientId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          return clientIds.map(clientId =>
            invoices.filter(invoice => invoice.clientId === clientId)
          );
        },
        {
          cache: true,
          maxBatchSize: 20,
          name: 'InvoicesByClientLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // COUNT LOADERS (for efficient counts without loading all data)
  getClientCountsLoader(): DataLoader<string, any> {
    const key = 'clientCounts';

    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (clientIds: readonly string[]) => {
          // Get counts for documents, engagements, invoices for each client
          const [documentCounts, engagementCounts, invoiceCounts] = await Promise.all([
            this.prisma.document.groupBy({
              by: ['clientId'],
              where: {
                clientId: { in: [...clientIds] },
                deletedAt: null,
                isLatestVersion: true,
              },
              _count: { id: true },
            }),
            this.prisma.engagement.groupBy({
              by: ['clientId'],
              where: {
                clientId: { in: [...clientIds] },
                deletedAt: null,
              },
              _count: { id: true },
            }),
            this.prisma.invoice.groupBy({
              by: ['clientId'],
              where: {
                clientId: { in: [...clientIds] },
                deletedAt: null,
              },
              _count: { id: true },
            }),
          ]);

          return clientIds.map(clientId => ({
            clientId,
            documents: documentCounts.find(c => c.clientId === clientId)?._count.id || 0,
            engagements: engagementCounts.find(c => c.clientId === clientId)?._count.id || 0,
            invoices: invoiceCounts.find(c => c.clientId === clientId)?._count.id || 0,
          }));
        },
        {
          cache: true,
          maxBatchSize: 50,
          name: 'ClientCountsLoader',
        }
      );

      this.loaders.set(key, loader);
    }

    return this.loaders.get(key)!;
  }

  // UTILITY METHODS
  async preloadClientData(clientIds: string[]): Promise<void> {
    // Preload common data for clients to warm up the cache
    await Promise.all([
      this.getClientLoader().loadMany(clientIds),
      this.getDocumentsByClientLoader().loadMany(clientIds),
      this.getEngagementsByClientLoader().loadMany(clientIds),
      this.getInvoicesByClientLoader().loadMany(clientIds),
      this.getClientCountsLoader().loadMany(clientIds),
    ]);
  }

  async preloadUserData(userIds: string[]): Promise<void> {
    // Preload common data for users
    await Promise.all([
      this.getUserLoader().loadMany(userIds),
      this.getTasksByAssigneeLoader().loadMany(userIds),
    ]);
  }

  // CACHE INTEGRATION
  async primeCache(key: string, id: string, data: any): Promise<void> {
    const loader = this.loaders.get(key);
    if (loader) {
      loader.prime(id, data);
    }
  }

  async clearCache(key?: string): Promise<void> {
    if (key) {
      const loader = this.loaders.get(key);
      if (loader) {
        loader.clearAll();
      }
    } else {
      this.loaders.forEach(loader => loader.clearAll());
    }
  }

  // DEBUGGING AND MONITORING
  getLoaderStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.loaders.forEach((loader, key) => {
      // DataLoader doesn't expose cache size directly, but we can track it
      stats[key] = {
        name: key,
        cacheSize: (loader as any)._cacheMap?.size || 0,
      };
    });

    return stats;
  }

  logLoaderUsage(): void {
    const stats = this.getLoaderStats();
    console.log('DataLoader Usage Stats:', stats);
  }
}

// Factory function to create DataLoader service for each request
export function createDataLoaderService(
  prisma: PrismaClient,
  redis?: Redis,
  context?: BatchLoadContext
): DataLoaderService {
  const service = new DataLoaderService(prisma, redis);

  if (context) {
    service.setContext(context);
  }

  return service;
}

export type { BatchLoadContext, DataLoaderOptions };