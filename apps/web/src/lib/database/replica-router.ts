/**
 * Database Replica Router
 *
 * Intelligent query routing for read replicas to distribute load and improve performance.
 *
 * Architecture:
 * - Primary: All writes, transactional reads, real-time data
 * - Analytics Replica: Heavy reporting queries, dashboards, analytics
 * - Background Replica: Job processing, scheduled tasks, batch operations
 *
 * Usage:
 * ```typescript
 * import { dbRouter } from '@/lib/database/replica-router'
 *
 * // Write operations (always primary)
 * const client = await dbRouter.getClient('write').client.create({ ... })
 *
 * // Analytics queries (replica)
 * const reports = await dbRouter.getClient('analytics').report.findMany({ ... })
 *
 * // Background jobs (replica)
 * const jobs = await dbRouter.getClient('background').jobExecution.findMany({ ... })
 * ```
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

export type DatabaseOperationType = 'write' | 'analytics' | 'background' | 'read' | 'transactional'

interface ConnectionConfig {
  url: string
  maxConnections: number
  connectionTimeout: number
  enableQueryLogging: boolean
}

interface HealthCheckResult {
  isHealthy: boolean
  latencyMs: number
  replicationLag?: number
  error?: string
}

interface RouterMetrics {
  queriesRouted: Record<DatabaseOperationType, number>
  failovers: number
  averageLatency: Record<string, number>
  lastHealthCheck: Date
}

class DatabaseRouter {
  private primary: PrismaClient
  private analyticsReplica?: PrismaClient
  private backgroundReplica?: PrismaClient
  private drReplica?: PrismaClient

  private healthStatus: Map<string, HealthCheckResult> = new Map()
  private metrics: RouterMetrics = {
    queriesRouted: {
      write: 0,
      analytics: 0,
      background: 0,
      read: 0,
      transactional: 0
    },
    failovers: 0,
    averageLatency: {},
    lastHealthCheck: new Date()
  }

  private healthCheckInterval?: NodeJS.Timeout
  private readonly HEALTH_CHECK_INTERVAL_MS = 30000 // 30 seconds
  private readonly MAX_REPLICATION_LAG_MS = 5000 // 5 seconds
  private readonly CONNECTION_TIMEOUT_MS = 5000 // 5 seconds

  constructor() {
    // Primary database (always required)
    this.primary = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error']
    })

    // Analytics replica (optional - for reporting and analytics)
    if (process.env.DATABASE_READ_REPLICA_1_URL) {
      this.analyticsReplica = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_READ_REPLICA_1_URL
          }
        },
        log: ['error']
      })
    }

    // Background replica (optional - for job processing)
    if (process.env.DATABASE_READ_REPLICA_2_URL) {
      this.backgroundReplica = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_READ_REPLICA_2_URL
          }
        },
        log: ['error']
      })
    }

    // Disaster recovery replica (optional - cross-region)
    if (process.env.DATABASE_READ_REPLICA_DR_URL) {
      this.drReplica = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_READ_REPLICA_DR_URL
          }
        },
        log: ['error']
      })
    }

    // Start health checks
    if (process.env.NODE_ENV !== 'test') {
      this.startHealthChecks()
    }
  }

  /**
   * Get appropriate database client based on operation type
   */
  getClient(operationType: DatabaseOperationType): PrismaClient {
    const startTime = performance.now()

    // Increment routing counter
    this.metrics.queriesRouted[operationType]++

    let client: PrismaClient

    switch (operationType) {
      case 'write':
      case 'transactional':
        // All writes and transactional operations MUST go to primary
        client = this.primary
        break

      case 'analytics':
        // Heavy reporting queries - prefer analytics replica with fallback
        client = this.getHealthyReplica('analytics') || this.primary
        if (!this.analyticsReplica || !this.isReplicaHealthy('analytics')) {
          this.metrics.failovers++
        }
        break

      case 'background':
        // Job processing, scheduled tasks - prefer background replica
        client = this.getHealthyReplica('background') || this.primary
        if (!this.backgroundReplica || !this.isReplicaHealthy('background')) {
          this.metrics.failovers++
        }
        break

      case 'read':
        // General read operations - load balance across replicas
        client = this.getLoadBalancedReplica() || this.primary
        break

      default:
        // Default to primary for safety
        client = this.primary
    }

    // Track latency
    const latency = performance.now() - startTime
    const replicaType = this.getReplicaType(client)
    this.updateLatencyMetrics(replicaType, latency)

    return client
  }

  /**
   * Get a specific healthy replica or return primary as fallback
   */
  private getHealthyReplica(type: 'analytics' | 'background'): PrismaClient | null {
    if (type === 'analytics' && this.analyticsReplica && this.isReplicaHealthy('analytics')) {
      return this.analyticsReplica
    }

    if (type === 'background' && this.backgroundReplica && this.isReplicaHealthy('background')) {
      return this.backgroundReplica
    }

    return null
  }

  /**
   * Load balance read operations across available healthy replicas
   */
  private getLoadBalancedReplica(): PrismaClient | null {
    const availableReplicas: PrismaClient[] = []

    if (this.analyticsReplica && this.isReplicaHealthy('analytics')) {
      availableReplicas.push(this.analyticsReplica)
    }

    if (this.backgroundReplica && this.isReplicaHealthy('background')) {
      availableReplicas.push(this.backgroundReplica)
    }

    if (availableReplicas.length === 0) {
      return null
    }

    // Simple round-robin selection
    const index = Math.floor(Math.random() * availableReplicas.length)
    return availableReplicas[index]
  }

  /**
   * Check if a replica is healthy and has acceptable replication lag
   */
  private isReplicaHealthy(replicaType: string): boolean {
    const health = this.healthStatus.get(replicaType)
    if (!health) return false

    return (
      health.isHealthy &&
      (health.replicationLag === undefined || health.replicationLag < this.MAX_REPLICATION_LAG_MS)
    )
  }

  /**
   * Start periodic health checks for all replicas
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks()
    }, this.HEALTH_CHECK_INTERVAL_MS)

    // Initial health check
    this.performHealthChecks().catch(console.error)
  }

  /**
   * Perform health checks on all replicas
   */
  private async performHealthChecks(): Promise<void> {
    const checks: Promise<void>[] = []

    // Check primary
    checks.push(this.checkDatabaseHealth('primary', this.primary))

    // Check analytics replica
    if (this.analyticsReplica) {
      checks.push(this.checkDatabaseHealth('analytics', this.analyticsReplica))
    }

    // Check background replica
    if (this.backgroundReplica) {
      checks.push(this.checkDatabaseHealth('background', this.backgroundReplica))
    }

    // Check DR replica
    if (this.drReplica) {
      checks.push(this.checkDatabaseHealth('dr', this.drReplica))
    }

    await Promise.allSettled(checks)
    this.metrics.lastHealthCheck = new Date()
  }

  /**
   * Check health of a specific database connection
   */
  private async checkDatabaseHealth(
    name: string,
    client: PrismaClient
  ): Promise<void> {
    const startTime = performance.now()

    try {
      // Simple query to check connectivity
      await client.$queryRaw`SELECT 1 as health_check`

      // Check replication lag (PostgreSQL specific)
      let replicationLag: number | undefined
      if (name !== 'primary') {
        try {
          const lagResult = await client.$queryRaw<Array<{ lag_seconds: number }>>`
            SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int as lag_seconds
          `
          if (lagResult.length > 0 && lagResult[0].lag_seconds !== null) {
            replicationLag = lagResult[0].lag_seconds * 1000 // Convert to milliseconds
          }
        } catch (error) {
          // Replication lag query might fail on primary or non-replica
          console.warn(`Could not check replication lag for ${name}:`, error)
        }
      }

      const latencyMs = performance.now() - startTime

      this.healthStatus.set(name, {
        isHealthy: true,
        latencyMs,
        replicationLag
      })

      // Log warning if replication lag is too high
      if (replicationLag && replicationLag > this.MAX_REPLICATION_LAG_MS) {
        console.warn(
          `High replication lag detected on ${name}: ${replicationLag}ms (threshold: ${this.MAX_REPLICATION_LAG_MS}ms)`
        )
      }
    } catch (error) {
      const latencyMs = performance.now() - startTime

      this.healthStatus.set(name, {
        isHealthy: false,
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      console.error(`Health check failed for ${name}:`, error)
    }
  }

  /**
   * Get replica type identifier from PrismaClient instance
   */
  private getReplicaType(client: PrismaClient): string {
    if (client === this.primary) return 'primary'
    if (client === this.analyticsReplica) return 'analytics'
    if (client === this.backgroundReplica) return 'background'
    if (client === this.drReplica) return 'dr'
    return 'unknown'
  }

  /**
   * Update latency metrics for monitoring
   */
  private updateLatencyMetrics(replicaType: string, latency: number): void {
    const key = replicaType
    const current = this.metrics.averageLatency[key] || 0
    // Simple moving average (can be improved with exponential moving average)
    this.metrics.averageLatency[key] = (current * 0.9) + (latency * 0.1)
  }

  /**
   * Get current routing metrics for monitoring/debugging
   */
  getMetrics(): RouterMetrics {
    return {
      ...this.metrics,
      queriesRouted: { ...this.metrics.queriesRouted }
    }
  }

  /**
   * Get health status of all connections
   */
  getHealthStatus(): Map<string, HealthCheckResult> {
    return new Map(this.healthStatus)
  }

  /**
   * Force a failover to primary (emergency use)
   */
  async forceFailoverToPrimary(): Promise<void> {
    console.warn('Forcing failover to primary database')
    this.metrics.failovers++

    // Mark all replicas as unhealthy
    for (const [name, health] of this.healthStatus.entries()) {
      if (name !== 'primary') {
        this.healthStatus.set(name, {
          ...health,
          isHealthy: false
        })
      }
    }

    // Re-run health checks after a delay
    setTimeout(() => {
      this.performHealthChecks().catch(console.error)
    }, 5000)
  }

  /**
   * Gracefully disconnect all database connections
   */
  async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    const disconnections: Promise<void>[] = [
      this.primary.$disconnect()
    ]

    if (this.analyticsReplica) {
      disconnections.push(this.analyticsReplica.$disconnect())
    }

    if (this.backgroundReplica) {
      disconnections.push(this.backgroundReplica.$disconnect())
    }

    if (this.drReplica) {
      disconnections.push(this.drReplica.$disconnect())
    }

    await Promise.allSettled(disconnections)
    console.log('All database connections closed')
  }
}

// Singleton instance
let dbRouterInstance: DatabaseRouter | null = null

export function getDbRouter(): DatabaseRouter {
  if (!dbRouterInstance) {
    dbRouterInstance = new DatabaseRouter()
  }
  return dbRouterInstance
}

// Export singleton instance
export const dbRouter = getDbRouter()

// Helper function for transactional operations (always use primary)
export async function withTransaction<T>(
  fn: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<T>
): Promise<T> {
  const client = dbRouter.getClient('transactional')
  return client.$transaction(fn)
}

// Export for cleanup in tests
export async function disconnectDbRouter(): Promise<void> {
  if (dbRouterInstance) {
    await dbRouterInstance.disconnect()
    dbRouterInstance = null
  }
}