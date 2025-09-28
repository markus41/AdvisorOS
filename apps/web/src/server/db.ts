import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// Database connection pool configuration
const DATABASE_CONFIG = {
  // Connection pool settings optimized for CPA platform workload
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // 10 seconds
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '5000'), // 5 seconds
  timeout: parseInt(process.env.DB_TIMEOUT || '30000'), // 30 seconds

  // Prisma-specific optimizations
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error'] as const
    : ['warn', 'error'] as const,

  // Transaction settings
  transactionOptions: {
    maxWait: 5000, // 5 seconds
    timeout: 30000, // 30 seconds
    isolationLevel: 'ReadCommitted' as const,
  },
};

// Redis configuration for caching
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Connection settings
  connectTimeout: 10000, // 10 seconds
  commandTimeout: 5000, // 5 seconds
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,

  // Connection pool
  lazyConnect: true,
  keepAlive: 30000, // 30 seconds

  // Cluster settings (if using Redis Cluster)
  enableOfflineQueue: false,
  readOnly: false,

  // Memory and performance
  family: 4, // Use IPv4
  keyPrefix: `cpa_platform:${process.env.NODE_ENV}:`,
};

// Connection management for Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  redis: Redis | undefined;
};

// Create Prisma client with optimized configuration
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse and optimize connection string
  const url = new URL(connectionString);

  // Add connection pool parameters to URL
  url.searchParams.set('connection_limit', DATABASE_CONFIG.connectionLimit.toString());
  url.searchParams.set('pool_timeout', (DATABASE_CONFIG.acquireTimeout / 1000).toString());
  url.searchParams.set('connect_timeout', (DATABASE_CONFIG.connectTimeout / 1000).toString());

  // PostgreSQL-specific optimizations
  url.searchParams.set('application_name', 'cpa_platform');
  url.searchParams.set('statement_timeout', (DATABASE_CONFIG.timeout).toString());
  url.searchParams.set('idle_in_transaction_session_timeout', '300000'); // 5 minutes

  // Performance settings
  url.searchParams.set('sslmode', process.env.NODE_ENV === 'production' ? 'require' : 'prefer');

  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    log: DATABASE_CONFIG.log,
    transactionOptions: DATABASE_CONFIG.transactionOptions,

    // Error handling
    errorFormat: 'pretty',

    // Query engine configuration
    engineType: 'binary',
  });
}

// Create Redis client with optimized configuration
function createRedisClient(): Redis | undefined {
  if (!process.env.REDIS_HOST && process.env.NODE_ENV === 'production') {
    console.warn('Redis not configured in production environment');
    return undefined;
  }

  try {
    const redis = new Redis(REDIS_CONFIG);

    // Connection event handlers
    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('close', () => {
      console.log('Redis connection closed');
    });

    redis.on('reconnecting', (delay) => {
      console.log(`Redis reconnecting in ${delay}ms`);
    });

    return redis;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return undefined;
  }
}

// Initialize Prisma client
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Initialize Redis client
export const redis = globalForPrisma.redis ?? createRedisClient();

// Store in global for development hot-reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.redis = redis;
}

// Connection monitoring and health checks
export class DatabaseHealthMonitor {
  private static instance: DatabaseHealthMonitor;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  private constructor() {}

  static getInstance(): DatabaseHealthMonitor {
    if (!DatabaseHealthMonitor.instance) {
      DatabaseHealthMonitor.instance = new DatabaseHealthMonitor();
    }
    return DatabaseHealthMonitor.instance;
  }

  startMonitoring(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    // Metrics collection every 5 minutes
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, 300000);
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Test Prisma connection
      await prisma.$queryRaw`SELECT 1`;

      // Test Redis connection if available
      if (redis) {
        await redis.ping();
      }

      console.log('Database health check passed');
    } catch (error) {
      console.error('Database health check failed:', error);

      // Log to audit trail for monitoring
      try {
        await prisma.auditLog.create({
          data: {
            action: 'health_check_failed',
            entityType: 'database',
            organizationId: 'system',
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            },
          },
        });
      } catch (logError) {
        console.error('Failed to log health check failure:', logError);
      }
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect database metrics
      const metrics = await this.getDatabaseMetrics();

      // Store metrics in Redis for monitoring dashboard
      if (redis) {
        await redis.setex('db_metrics', 300, JSON.stringify(metrics)); // 5 minute TTL
      }

      console.log('Database metrics collected:', metrics);
    } catch (error) {
      console.error('Failed to collect database metrics:', error);
    }
  }

  private async getDatabaseMetrics(): Promise<any> {
    const [
      dbSize,
      connectionCount,
      slowQueries,
      tableStats,
    ] = await Promise.all([
      // Database size
      prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as bytes
      `,

      // Active connections
      prisma.$queryRaw`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE state = 'active'
      `,

      // Slow queries from pg_stat_statements (if available)
      prisma.$queryRaw`
        SELECT count(*) as slow_query_count
        FROM pg_stat_statements
        WHERE mean_time > 1000
      `.catch(() => ({ slow_query_count: 0 })),

      // Table statistics
      prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `,
    ]);

    return {
      database: dbSize,
      connections: connectionCount,
      slowQueries,
      tables: tableStats,
      collectedAt: new Date(),
    };
  }

  async getConnectionInfo(): Promise<any> {
    try {
      const result = await prisma.$queryRaw`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      return result;
    } catch (error) {
      console.error('Failed to get connection info:', error);
      return null;
    }
  }

  async analyzeDatabasePerformance(): Promise<any> {
    try {
      const [
        indexUsage,
        tableScans,
        cacheHitRatio,
      ] = await Promise.all([
        // Index usage statistics
        prisma.$queryRaw`
          SELECT
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
          FROM pg_stat_user_indexes
          ORDER BY idx_scan DESC
          LIMIT 20
        `,

        // Table scan statistics
        prisma.$queryRaw`
          SELECT
            schemaname,
            tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            n_live_tup
          FROM pg_stat_user_tables
          WHERE seq_scan > 0
          ORDER BY seq_scan DESC
          LIMIT 10
        `,

        // Cache hit ratio
        prisma.$queryRaw`
          SELECT
            sum(heap_blks_read) as heap_read,
            sum(heap_blks_hit) as heap_hit,
            sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
          FROM pg_statio_user_tables
        `,
      ]);

      return {
        indexUsage,
        tableScans,
        cacheHitRatio,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to analyze database performance:', error);
      return null;
    }
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');

  DatabaseHealthMonitor.getInstance().stopMonitoring();

  await Promise.all([
    prisma.$disconnect(),
    redis?.disconnect(),
  ]);

  console.log('Database connections closed successfully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');

  DatabaseHealthMonitor.getInstance().stopMonitoring();

  await Promise.all([
    prisma.$disconnect(),
    redis?.disconnect(),
  ]);

  console.log('Database connections closed successfully');
  process.exit(0);
});

// Export singleton monitor instance
export const dbHealthMonitor = DatabaseHealthMonitor.getInstance();

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
  dbHealthMonitor.startMonitoring();
}

export { DATABASE_CONFIG, REDIS_CONFIG };