import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

interface ReadReplicaConfig {
  readReplicaUrls: string[]
  writeUrl: string
  readPreference: 'primary' | 'secondary' | 'secondaryPreferred'
  maxRetries: number
  retryDelay: number
  healthCheckInterval: number
}

interface ReplicaHealth {
  url: string
  isHealthy: boolean
  lastCheck: Date
  latency: number
  errorCount: number
}

class ReadReplicaManager {
  private writeClient: PrismaClient
  private readClients: PrismaClient[] = []
  private config: ReadReplicaConfig
  private replicaHealth: Map<string, ReplicaHealth> = new Map()
  private currentReadIndex = 0
  private redis: Redis

  constructor(redis: Redis, config: Partial<ReadReplicaConfig> = {}) {
    this.redis = redis
    this.config = {
      readReplicaUrls: process.env.DATABASE_READ_REPLICAS?.split(',') || [],
      writeUrl: process.env.DATABASE_URL!,
      readPreference: 'secondaryPreferred',
      maxRetries: 3,
      retryDelay: 1000,
      healthCheckInterval: 30000, // 30 seconds
      ...config
    }

    this.initializeClients()
    this.startHealthChecking()
  }

  private initializeClients(): void {
    // Initialize write client
    this.writeClient = new PrismaClient({
      datasources: {
        db: { url: this.config.writeUrl }
      },
      log: ['error', 'warn']
    })

    // Initialize read replica clients
    this.config.readReplicaUrls.forEach((url, index) => {
      const client = new PrismaClient({
        datasources: {
          db: { url }
        },
        log: ['error']
      })
      this.readClients.push(client)

      // Initialize health status
      this.replicaHealth.set(url, {
        url,
        isHealthy: true,
        lastCheck: new Date(),
        latency: 0,
        errorCount: 0
      })
    })

    console.log(`Initialized ${this.readClients.length} read replicas`)
  }

  private startHealthChecking(): void {
    setInterval(async () => {
      await this.checkReplicaHealth()
    }, this.config.healthCheckInterval)

    // Initial health check
    setTimeout(() => this.checkReplicaHealth(), 5000)
  }

  private async checkReplicaHealth(): Promise<void> {
    const healthChecks = this.config.readReplicaUrls.map(async (url, index) => {
      const client = this.readClients[index]
      const health = this.replicaHealth.get(url)!
      const start = Date.now()

      try {
        // Simple health check query
        await client.$queryRaw`SELECT 1`

        const latency = Date.now() - start
        health.isHealthy = true
        health.latency = latency
        health.lastCheck = new Date()
        health.errorCount = Math.max(0, health.errorCount - 1) // Gradually reduce error count

        // Store health metrics in Redis
        await this.redis.setex(
          `replica_health:${url}`,
          60,
          JSON.stringify({
            healthy: true,
            latency,
            timestamp: Date.now()
          })
        )

      } catch (error) {
        health.isHealthy = false
        health.errorCount++
        health.lastCheck = new Date()

        console.warn(`Read replica health check failed for ${url}:`, error)

        await this.redis.setex(
          `replica_health:${url}`,
          60,
          JSON.stringify({
            healthy: false,
            error: (error as Error).message,
            timestamp: Date.now()
          })
        )
      }
    })

    await Promise.allSettled(healthChecks)
  }

  private getHealthyReadClient(): PrismaClient {
    const healthyReplicas = Array.from(this.replicaHealth.entries())
      .filter(([_, health]) => health.isHealthy)
      .sort(([_, a], [__, b]) => a.latency - b.latency) // Sort by latency

    if (healthyReplicas.length === 0) {
      console.warn('No healthy read replicas available, falling back to write client')
      return this.writeClient
    }

    // Round-robin among healthy replicas
    const replicaUrl = healthyReplicas[this.currentReadIndex % healthyReplicas.length][0]
    this.currentReadIndex++

    const replicaIndex = this.config.readReplicaUrls.indexOf(replicaUrl)
    return this.readClients[replicaIndex]
  }

  async executeRead<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const prefersPrimary = this.config.readPreference === 'primary'
    const prefersSecondary = this.config.readPreference === 'secondary'

    if (prefersPrimary || this.readClients.length === 0) {
      return await this.executeWithRetry(() => operation(this.writeClient))
    }

    if (prefersSecondary) {
      const readClient = this.getHealthyReadClient()
      if (readClient !== this.writeClient) {
        try {
          return await this.executeWithRetry(() => operation(readClient))
        } catch (error) {
          console.warn('Read replica failed, falling back to primary:', error)
        }
      }
    }

    // Secondary preferred or fallback
    try {
      const readClient = this.getHealthyReadClient()
      return await this.executeWithRetry(() => operation(readClient))
    } catch (error) {
      console.warn('All read replicas failed, using primary:', error)
      return await this.executeWithRetry(() => operation(this.writeClient))
    }
  }

  async executeWrite<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    return await this.executeWithRetry(() => operation(this.writeClient))
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        await new Promise(resolve =>
          setTimeout(resolve, this.config.retryDelay * Math.pow(2, retryCount))
        )
        return this.executeWithRetry(operation, retryCount + 1)
      }
      throw error
    }
  }

  // Analytics and reporting queries - always use read replicas
  async executeAnalyticsQuery<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const readClient = this.getHealthyReadClient()
    return await this.executeWithRetry(() => operation(readClient))
  }

  // Heavy reporting queries that can tolerate slight staleness
  async executeReportingQuery<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    // Use the read replica with lowest latency for reporting
    const healthyReplicas = Array.from(this.replicaHealth.entries())
      .filter(([_, health]) => health.isHealthy)
      .sort(([_, a], [__, b]) => a.latency - b.latency)

    if (healthyReplicas.length === 0) {
      return await this.executeWithRetry(() => operation(this.writeClient))
    }

    const fastestReplicaUrl = healthyReplicas[0][0]
    const replicaIndex = this.config.readReplicaUrls.indexOf(fastestReplicaUrl)
    const fastestClient = this.readClients[replicaIndex]

    return await this.executeWithRetry(() => operation(fastestClient))
  }

  getHealthStatus(): Array<ReplicaHealth & { type: 'primary' | 'replica' }> {
    const status = [
      {
        url: this.config.writeUrl,
        type: 'primary' as const,
        isHealthy: true, // Assume primary is healthy
        lastCheck: new Date(),
        latency: 0,
        errorCount: 0
      }
    ]

    this.replicaHealth.forEach(health => {
      status.push({
        ...health,
        type: 'replica' as const
      })
    })

    return status
  }

  async getReplicationLag(): Promise<Array<{ url: string; lagMs: number }>> {
    const lagChecks = this.config.readReplicaUrls.map(async (url, index) => {
      try {
        const client = this.readClients[index]

        // Query for replication lag (PostgreSQL specific)
        const result = await client.$queryRaw<Array<{ lag: bigint }>>`
          SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 as lag
        `

        return {
          url,
          lagMs: Number(result[0]?.lag || 0)
        }
      } catch (error) {
        return {
          url,
          lagMs: -1 // Indicates error
        }
      }
    })

    return await Promise.all(lagChecks)
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.writeClient.$disconnect(),
      ...this.readClients.map(client => client.$disconnect())
    ])
  }
}

// Helper function to create a read replica aware Prisma instance
export function createReplicaAwarePrisma(redis: Redis, config?: Partial<ReadReplicaConfig>) {
  const replicaManager = new ReadReplicaManager(redis, config)

  return {
    // Read operations
    findUnique: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeRead(operation),

    findFirst: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeRead(operation),

    findMany: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeRead(operation),

    count: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeRead(operation),

    aggregate: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeRead(operation),

    // Write operations
    create: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeWrite(operation),

    update: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeWrite(operation),

    upsert: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeWrite(operation),

    delete: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeWrite(operation),

    // Analytics queries
    analytics: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeAnalyticsQuery(operation),

    reporting: <T>(operation: (client: PrismaClient) => Promise<T>) =>
      replicaManager.executeReportingQuery(operation),

    // Utility methods
    getHealth: () => replicaManager.getHealthStatus(),
    getReplicationLag: () => replicaManager.getReplicationLag(),
    disconnect: () => replicaManager.disconnect(),

    // Raw access to manager
    manager: replicaManager
  }
}

export { ReadReplicaManager }
export type { ReadReplicaConfig, ReplicaHealth }