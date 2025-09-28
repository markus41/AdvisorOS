import { Redis } from 'ioredis';
import { z } from 'zod';

// Cache configuration schema
const CacheConfigSchema = z.object({
  ttl: z.object({
    short: z.number().default(300), // 5 minutes
    medium: z.number().default(900), // 15 minutes
    long: z.number().default(3600), // 1 hour
    session: z.number().default(1800), // 30 minutes
    dashboard: z.number().default(120), // 2 minutes
    reports: z.number().default(7200), // 2 hours
    userProfile: z.number().default(600), // 10 minutes
    clientData: z.number().default(1800), // 30 minutes
    quickbooks: z.number().default(300), // 5 minutes
  }),
  keyPrefixes: z.object({
    session: z.string().default('session'),
    user: z.string().default('user'),
    client: z.string().default('client'),
    document: z.string().default('document'),
    task: z.string().default('task'),
    invoice: z.string().default('invoice'),
    report: z.string().default('report'),
    dashboard: z.string().default('dashboard'),
    quickbooks: z.string().default('qb'),
    organization: z.string().default('org'),
  }),
});

type CacheConfig = z.infer<typeof CacheConfigSchema>;

interface CacheEntry<T = any> {
  data: T;
  createdAt: number;
  ttl: number;
  version?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  totalOperations: number;
}

interface CacheInvalidationRule {
  pattern: string;
  triggers: string[];
  organizationScoped?: boolean;
}

export class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    totalOperations: 0,
  };

  private invalidationRules: CacheInvalidationRule[] = [
    {
      pattern: 'dashboard:*',
      triggers: ['client.create', 'client.update', 'task.create', 'task.update', 'invoice.create', 'invoice.update'],
      organizationScoped: true,
    },
    {
      pattern: 'client:*',
      triggers: ['client.update', 'client.delete', 'engagement.create', 'engagement.update', 'document.create'],
      organizationScoped: true,
    },
    {
      pattern: 'document:*',
      triggers: ['document.update', 'document.delete', 'document.process'],
      organizationScoped: true,
    },
    {
      pattern: 'task:*',
      triggers: ['task.update', 'task.delete', 'task.complete'],
      organizationScoped: true,
    },
    {
      pattern: 'invoice:*',
      triggers: ['invoice.update', 'invoice.pay', 'invoice.send'],
      organizationScoped: true,
    },
    {
      pattern: 'user:*',
      triggers: ['user.update', 'user.permissions.update'],
      organizationScoped: false,
    },
  ];

  constructor(
    private redis: Redis,
    private config: CacheConfig = CacheConfigSchema.parse({})
  ) {}

  // CORE CACHE OPERATIONS

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);

      if (cached) {
        this.stats.hits++;
        this.updateStats();

        try {
          const entry: CacheEntry<T> = JSON.parse(cached);

          // Check if entry has expired (additional check beyond Redis TTL)
          if (entry.createdAt + entry.ttl * 1000 < Date.now()) {
            await this.delete(key);
            this.stats.misses++;
            return null;
          }

          return entry.data;
        } catch (parseError) {
          console.warn('Failed to parse cached data:', parseError);
          await this.delete(key);
          this.stats.misses++;
          return null;
        }
      }

      this.stats.misses++;
      this.updateStats();
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      this.updateStats();
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number, version?: string): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        createdAt: Date.now(),
        ttl: ttl || this.config.ttl.medium,
        version,
      };

      await this.redis.setex(key, entry.ttl, JSON.stringify(entry));
      this.stats.sets++;
      this.updateStats();
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.stats.deletes++;
      this.updateStats();
    } catch (error) {
      console.error('Cache delete error:', error);
      throw error;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.redis.del(...keys);
        this.stats.deletes += deleted;
        this.updateStats();
        return deleted;
      }
      return 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // HIGH-LEVEL CACHE METHODS

  // SESSION CACHING
  async getSession(sessionId: string): Promise<any | null> {
    const key = this.buildKey('session', sessionId);
    return this.get(key);
  }

  async setSession(sessionId: string, sessionData: any): Promise<void> {
    const key = this.buildKey('session', sessionId);
    await this.set(key, sessionData, this.config.ttl.session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = this.buildKey('session', sessionId);
    await this.delete(key);
  }

  // USER CACHING
  async getUser(userId: string): Promise<any | null> {
    const key = this.buildKey('user', userId);
    return this.get(key);
  }

  async setUser(userId: string, userData: any): Promise<void> {
    const key = this.buildKey('user', userId);
    await this.set(key, userData, this.config.ttl.userProfile);
  }

  async getUserProfile(userId: string, organizationId: string): Promise<any | null> {
    const key = this.buildKey('user', userId, 'profile', organizationId);
    return this.get(key);
  }

  async setUserProfile(userId: string, organizationId: string, profile: any): Promise<void> {
    const key = this.buildKey('user', userId, 'profile', organizationId);
    await this.set(key, profile, this.config.ttl.userProfile);
  }

  // CLIENT CACHING
  async getClientList(organizationId: string, filters: string): Promise<any | null> {
    const key = this.buildKey('client', organizationId, 'list', filters);
    return this.get(key);
  }

  async setClientList(organizationId: string, filters: string, clients: any): Promise<void> {
    const key = this.buildKey('client', organizationId, 'list', filters);
    await this.set(key, clients, this.config.ttl.clientData);
  }

  async getClient(clientId: string): Promise<any | null> {
    const key = this.buildKey('client', clientId);
    return this.get(key);
  }

  async setClient(clientId: string, clientData: any): Promise<void> {
    const key = this.buildKey('client', clientId);
    await this.set(key, clientData, this.config.ttl.clientData);
  }

  // DOCUMENT CACHING
  async getDocumentList(organizationId: string, clientId: string, filters: string): Promise<any | null> {
    const key = this.buildKey('document', organizationId, clientId, 'list', filters);
    return this.get(key);
  }

  async setDocumentList(organizationId: string, clientId: string, filters: string, documents: any): Promise<void> {
    const key = this.buildKey('document', organizationId, clientId, 'list', filters);
    await this.set(key, documents, this.config.ttl.medium);
  }

  async getDocumentMetadata(documentId: string): Promise<any | null> {
    const key = this.buildKey('document', documentId, 'metadata');
    return this.get(key);
  }

  async setDocumentMetadata(documentId: string, metadata: any): Promise<void> {
    const key = this.buildKey('document', documentId, 'metadata');
    await this.set(key, metadata, this.config.ttl.long);
  }

  // TASK CACHING
  async getTaskList(organizationId: string, assignedToId: string, filters: string): Promise<any | null> {
    const key = this.buildKey('task', organizationId, assignedToId, 'list', filters);
    return this.get(key);
  }

  async setTaskList(organizationId: string, assignedToId: string, filters: string, tasks: any): Promise<void> {
    const key = this.buildKey('task', organizationId, assignedToId, 'list', filters);
    await this.set(key, tasks, this.config.ttl.short);
  }

  // INVOICE CACHING
  async getInvoiceList(organizationId: string, filters: string): Promise<any | null> {
    const key = this.buildKey('invoice', organizationId, 'list', filters);
    return this.get(key);
  }

  async setInvoiceList(organizationId: string, filters: string, invoices: any): Promise<void> {
    const key = this.buildKey('invoice', organizationId, 'list', filters);
    await this.set(key, invoices, this.config.ttl.medium);
  }

  // DASHBOARD CACHING
  async getDashboardMetrics(organizationId: string): Promise<any | null> {
    const key = this.buildKey('dashboard', organizationId, 'metrics');
    return this.get(key);
  }

  async setDashboardMetrics(organizationId: string, metrics: any): Promise<void> {
    const key = this.buildKey('dashboard', organizationId, 'metrics');
    await this.set(key, metrics, this.config.ttl.dashboard);
  }

  async getDashboardCharts(organizationId: string, chartType: string): Promise<any | null> {
    const key = this.buildKey('dashboard', organizationId, 'chart', chartType);
    return this.get(key);
  }

  async setDashboardCharts(organizationId: string, chartType: string, chartData: any): Promise<void> {
    const key = this.buildKey('dashboard', organizationId, 'chart', chartType);
    await this.set(key, chartData, this.config.ttl.dashboard);
  }

  // REPORT CACHING
  async getReportData(reportId: string): Promise<any | null> {
    const key = this.buildKey('report', reportId, 'data');
    return this.get(key);
  }

  async setReportData(reportId: string, reportData: any): Promise<void> {
    const key = this.buildKey('report', reportId, 'data');
    await this.set(key, reportData, this.config.ttl.reports);
  }

  async getReportList(organizationId: string, filters: string): Promise<any | null> {
    const key = this.buildKey('report', organizationId, 'list', filters);
    return this.get(key);
  }

  async setReportList(organizationId: string, filters: string, reports: any): Promise<void> {
    const key = this.buildKey('report', organizationId, 'list', filters);
    await this.set(key, reports, this.config.ttl.medium);
  }

  // QUICKBOOKS CACHING
  async getQuickBooksData(organizationId: string, dataType: string): Promise<any | null> {
    const key = this.buildKey('qb', organizationId, dataType);
    return this.get(key);
  }

  async setQuickBooksData(organizationId: string, dataType: string, data: any): Promise<void> {
    const key = this.buildKey('qb', organizationId, dataType);
    await this.set(key, data, this.config.ttl.quickbooks);
  }

  async getQuickBooksSyncStatus(organizationId: string): Promise<any | null> {
    const key = this.buildKey('qb', organizationId, 'sync_status');
    return this.get(key);
  }

  async setQuickBooksSyncStatus(organizationId: string, status: any): Promise<void> {
    const key = this.buildKey('qb', organizationId, 'sync_status');
    await this.set(key, status, this.config.ttl.short);
  }

  // BULK OPERATIONS
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];

      const values = await this.redis.mget(...keys);
      return values.map((value, index) => {
        if (value) {
          this.stats.hits++;
          try {
            const entry: CacheEntry<T> = JSON.parse(value);
            return entry.data;
          } catch (parseError) {
            console.warn(`Failed to parse cached data for key ${keys[index]}:`, parseError);
            this.delete(keys[index]); // Clean up invalid data
            this.stats.misses++;
            return null;
          }
        } else {
          this.stats.misses++;
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      this.stats.misses += keys.length;
      return keys.map(() => null);
    } finally {
      this.updateStats();
    }
  }

  async mset(entries: Array<{ key: string; data: any; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      entries.forEach(({ key, data, ttl }) => {
        const entry: CacheEntry = {
          data,
          createdAt: Date.now(),
          ttl: ttl || this.config.ttl.medium,
        };
        pipeline.setex(key, entry.ttl, JSON.stringify(entry));
      });

      await pipeline.exec();
      this.stats.sets += entries.length;
      this.updateStats();
    } catch (error) {
      console.error('Cache mset error:', error);
      throw error;
    }
  }

  // CACHE INVALIDATION
  async invalidate(trigger: string, organizationId?: string): Promise<void> {
    console.log(`Cache invalidation triggered: ${trigger}`, { organizationId });

    const matchingRules = this.invalidationRules.filter(rule =>
      rule.triggers.includes(trigger)
    );

    for (const rule of matchingRules) {
      let pattern = rule.pattern;

      if (rule.organizationScoped && organizationId) {
        // Replace wildcards with organization-specific patterns
        pattern = pattern.replace('*', `${organizationId}:*`);
      }

      try {
        const deleted = await this.deletePattern(pattern);
        console.log(`Invalidated ${deleted} cache entries for pattern: ${pattern}`);
      } catch (error) {
        console.error(`Failed to invalidate cache pattern ${pattern}:`, error);
      }
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    const patterns = [
      this.buildKey('user', userId, '*'),
      this.buildKey('session', '*', userId),
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  async invalidateClient(clientId: string, organizationId: string): Promise<void> {
    const patterns = [
      this.buildKey('client', clientId),
      this.buildKey('client', organizationId, '*'),
      this.buildKey('document', organizationId, clientId, '*'),
      this.buildKey('dashboard', organizationId, '*'),
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  async invalidateOrganization(organizationId: string): Promise<void> {
    const pattern = `*:${organizationId}:*`;
    await this.deletePattern(pattern);
  }

  // UTILITY METHODS
  private buildKey(...parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }

  private updateStats(): void {
    this.stats.totalOperations = this.stats.hits + this.stats.misses;
    this.stats.hitRate = this.stats.totalOperations > 0
      ? this.stats.hits / this.stats.totalOperations
      : 0;
  }

  // CACHE MONITORING AND MANAGEMENT
  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      totalOperations: 0,
    };
  }

  async getCacheInfo(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      const stats = this.getStats();

      return {
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        applicationStats: stats,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return null;
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }

    return result;
  }

  async warmUpCache(organizationId: string): Promise<void> {
    console.log(`Warming up cache for organization: ${organizationId}`);
    // This would typically pre-load frequently accessed data
    // Implementation depends on your specific use case
  }

  async clearCache(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.resetStats();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  // CACHE WRAPPER UTILITY
  async remember<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  // CACHE TAGGING (for complex invalidation)
  async setWithTags<T>(
    key: string,
    data: T,
    ttl: number,
    tags: string[]
  ): Promise<void> {
    // Set the main data
    await this.set(key, data, ttl);

    // Set tag mappings for invalidation
    const pipeline = this.redis.pipeline();
    tags.forEach(tag => {
      const tagKey = `tag:${tag}`;
      pipeline.sadd(tagKey, key);
      pipeline.expire(tagKey, ttl);
    });
    await pipeline.exec();
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const keys = await this.redis.smembers(tagKey);

    if (keys.length > 0) {
      await this.redis.del(...keys);
      await this.redis.del(tagKey);
      this.stats.deletes += keys.length;
      this.updateStats();
    }
  }
}

export type { CacheConfig, CacheEntry, CacheStats, CacheInvalidationRule };