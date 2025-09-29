import { Redis } from 'ioredis'

interface ScalingConfig {
  minInstances: number
  maxInstances: number
  targetCPU: number
  targetMemory: number
  targetResponseTime: number
  scaleUpCooldown: number
  scaleDownCooldown: number
  scaleUpThreshold: number
  scaleDownThreshold: number
}

interface InstanceMetrics {
  instanceId: string
  cpuUsage: number
  memoryUsage: number
  responseTime: number
  requestsPerSecond: number
  activeConnections: number
  timestamp: Date
  health: 'healthy' | 'unhealthy' | 'unknown'
}

interface ScalingEvent {
  id: string
  type: 'scale_up' | 'scale_down'
  reason: string
  fromInstances: number
  toInstances: number
  timestamp: Date
  metrics: {
    avgCPU: number
    avgMemory: number
    avgResponseTime: number
    totalRPS: number
  }
  success: boolean
  duration?: number
}

interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash' | 'weighted_round_robin'
  healthCheckPath: string
  healthCheckInterval: number
  healthCheckTimeout: number
  maxFailures: number
  sessionAffinity: boolean
}

class HorizontalScalingManager {
  private redis: Redis
  private config: ScalingConfig
  private instances: Map<string, InstanceMetrics> = new Map()
  private scalingHistory: ScalingEvent[] = []
  private lastScaleAction: Date | null = null
  private isScaling = false

  constructor(redis: Redis, config: Partial<ScalingConfig> = {}) {
    this.redis = redis
    this.config = {
      minInstances: 2,
      maxInstances: 20, // For tax season peaks
      targetCPU: 70, // 70% CPU utilization
      targetMemory: 80, // 80% memory utilization
      targetResponseTime: 2000, // 2 seconds
      scaleUpCooldown: 300000, // 5 minutes
      scaleDownCooldown: 600000, // 10 minutes
      scaleUpThreshold: 0.8, // Scale up if 80% of instances exceed targets
      scaleDownThreshold: 0.3, // Scale down if only 30% of instances exceed targets
      ...config
    }

    this.startMetricsCollection()
    this.startAutoScaling()
  }

  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      await this.collectInstanceMetrics()
    }, 30000)
  }

  private startAutoScaling(): void {
    // Evaluate scaling decisions every 2 minutes
    setInterval(async () => {
      if (!this.isScaling) {
        await this.evaluateScaling()
      }
    }, 120000)
  }

  private async collectInstanceMetrics(): Promise<void> {
    try {
      // In a real implementation, this would query your orchestration platform
      // (Kubernetes, ECS, etc.) for actual instance metrics
      const instanceIds = await this.getActiveInstanceIds()

      for (const instanceId of instanceIds) {
        const metrics = await this.getInstanceMetrics(instanceId)
        this.instances.set(instanceId, metrics)

        // Store metrics in Redis for monitoring
        await this.redis.setex(
          `instance_metrics:${instanceId}`,
          300, // 5 minutes
          JSON.stringify(metrics)
        )
      }

      // Clean up metrics for removed instances
      const currentInstances = new Set(instanceIds)
      for (const [instanceId] of this.instances) {
        if (!currentInstances.has(instanceId)) {
          this.instances.delete(instanceId)
        }
      }

    } catch (error) {
      console.error('Failed to collect instance metrics:', error)
    }
  }

  private async getActiveInstanceIds(): Promise<string[]> {
    // Mock implementation - in reality, this would query your container orchestrator
    const instanceCount = Math.max(this.config.minInstances,
      parseInt(await this.redis.get('current_instance_count') || '2'))

    return Array.from({ length: instanceCount }, (_, i) => `instance-${i + 1}`)
  }

  private async getInstanceMetrics(instanceId: string): Promise<InstanceMetrics> {
    // Mock implementation - in reality, this would query actual instance metrics
    const baseMetrics = {
      instanceId,
      timestamp: new Date(),
      health: 'healthy' as const
    }

    // Simulate varying load patterns
    const timeOfDay = new Date().getHours()
    const isBusinessHours = timeOfDay >= 8 && timeOfDay <= 18
    const isTaxSeason = this.isTaxSeason()

    let loadMultiplier = 1
    if (isBusinessHours) loadMultiplier *= 1.5
    if (isTaxSeason) loadMultiplier *= 3

    return {
      ...baseMetrics,
      cpuUsage: Math.min(95, Math.random() * 60 * loadMultiplier),
      memoryUsage: Math.min(95, Math.random() * 50 * loadMultiplier),
      responseTime: Math.max(100, Math.random() * 1000 * loadMultiplier),
      requestsPerSecond: Math.random() * 100 * loadMultiplier,
      activeConnections: Math.floor(Math.random() * 500 * loadMultiplier)
    }
  }

  private isTaxSeason(): boolean {
    const now = new Date()
    const taxSeasonStart = new Date(now.getFullYear(), 0, 15) // Jan 15
    const taxSeasonEnd = new Date(now.getFullYear(), 3, 15) // Apr 15

    return now >= taxSeasonStart && now <= taxSeasonEnd
  }

  private async evaluateScaling(): Promise<void> {
    const instances = Array.from(this.instances.values())
    if (instances.length === 0) return

    const metrics = this.calculateAggregateMetrics(instances)
    const decision = this.makeScalingDecision(instances, metrics)

    if (decision) {
      await this.executeScalingDecision(decision, metrics)
    }
  }

  private calculateAggregateMetrics(instances: InstanceMetrics[]): {
    avgCPU: number
    avgMemory: number
    avgResponseTime: number
    totalRPS: number
    healthyInstances: number
  } {
    const healthyInstances = instances.filter(i => i.health === 'healthy')

    if (healthyInstances.length === 0) {
      return {
        avgCPU: 0,
        avgMemory: 0,
        avgResponseTime: 0,
        totalRPS: 0,
        healthyInstances: 0
      }
    }

    return {
      avgCPU: healthyInstances.reduce((sum, i) => sum + i.cpuUsage, 0) / healthyInstances.length,
      avgMemory: healthyInstances.reduce((sum, i) => sum + i.memoryUsage, 0) / healthyInstances.length,
      avgResponseTime: healthyInstances.reduce((sum, i) => sum + i.responseTime, 0) / healthyInstances.length,
      totalRPS: healthyInstances.reduce((sum, i) => sum + i.requestsPerSecond, 0),
      healthyInstances: healthyInstances.length
    }
  }

  private makeScalingDecision(
    instances: InstanceMetrics[],
    metrics: any
  ): { type: 'scale_up' | 'scale_down'; reason: string } | null {
    const healthyInstances = instances.filter(i => i.health === 'healthy')
    const currentCount = healthyInstances.length

    // Check cooldown periods
    if (this.lastScaleAction) {
      const timeSinceLastAction = Date.now() - this.lastScaleAction.getTime()
      if (timeSinceLastAction < this.config.scaleUpCooldown) {
        return null
      }
    }

    // Count instances exceeding thresholds
    const instancesExceedingCPU = healthyInstances.filter(i => i.cpuUsage > this.config.targetCPU).length
    const instancesExceedingMemory = healthyInstances.filter(i => i.memoryUsage > this.config.targetMemory).length
    const instancesExceedingResponseTime = healthyInstances.filter(i => i.responseTime > this.config.targetResponseTime).length

    const exceedingThresholds = Math.max(instancesExceedingCPU, instancesExceedingMemory, instancesExceedingResponseTime)
    const percentageExceeding = exceedingThresholds / currentCount

    // Scale up conditions
    if (percentageExceeding >= this.config.scaleUpThreshold && currentCount < this.config.maxInstances) {
      const reasons = []
      if (instancesExceedingCPU / currentCount >= this.config.scaleUpThreshold) reasons.push('high CPU')
      if (instancesExceedingMemory / currentCount >= this.config.scaleUpThreshold) reasons.push('high memory')
      if (instancesExceedingResponseTime / currentCount >= this.config.scaleUpThreshold) reasons.push('slow response time')

      return {
        type: 'scale_up',
        reason: `Threshold exceeded: ${reasons.join(', ')}`
      }
    }

    // Scale down conditions (with longer cooldown)
    if (this.lastScaleAction) {
      const timeSinceLastAction = Date.now() - this.lastScaleAction.getTime()
      if (timeSinceLastAction < this.config.scaleDownCooldown) {
        return null
      }
    }

    if (percentageExceeding <= this.config.scaleDownThreshold && currentCount > this.config.minInstances) {
      return {
        type: 'scale_down',
        reason: 'Low resource utilization across instances'
      }
    }

    return null
  }

  private async executeScalingDecision(
    decision: { type: 'scale_up' | 'scale_down'; reason: string },
    metrics: any
  ): Promise<void> {
    this.isScaling = true
    const currentCount = Array.from(this.instances.values()).filter(i => i.health === 'healthy').length

    let targetCount: number
    if (decision.type === 'scale_up') {
      // Scale up by 25% or at least 1 instance
      targetCount = Math.min(
        this.config.maxInstances,
        Math.max(currentCount + 1, Math.ceil(currentCount * 1.25))
      )
    } else {
      // Scale down by 1 instance at a time for safety
      targetCount = Math.max(this.config.minInstances, currentCount - 1)
    }

    const scalingEvent: ScalingEvent = {
      id: this.generateEventId(),
      type: decision.type,
      reason: decision.reason,
      fromInstances: currentCount,
      toInstances: targetCount,
      timestamp: new Date(),
      metrics,
      success: false
    }

    try {
      const startTime = Date.now()

      // Execute the scaling action
      await this.performScaling(decision.type, currentCount, targetCount)

      scalingEvent.success = true
      scalingEvent.duration = Date.now() - startTime

      console.log(`Scaling ${decision.type} completed: ${currentCount} -> ${targetCount} instances`)

      // Update Redis with new instance count
      await this.redis.set('current_instance_count', targetCount.toString())

      this.lastScaleAction = new Date()

    } catch (error) {
      console.error(`Scaling ${decision.type} failed:`, error)
      scalingEvent.success = false
    } finally {
      this.scalingHistory.push(scalingEvent)
      this.isScaling = false

      // Store scaling event
      await this.redis.lpush('scaling_events', JSON.stringify(scalingEvent))
      await this.redis.ltrim('scaling_events', 0, 99) // Keep last 100 events
    }
  }

  private async performScaling(type: 'scale_up' | 'scale_down', from: number, to: number): Promise<void> {
    // Mock implementation - in reality, this would integrate with your orchestration platform
    await new Promise(resolve => setTimeout(resolve, 5000)) // Simulate scaling time

    if (type === 'scale_up') {
      console.log(`Scaling up from ${from} to ${to} instances`)
      // Here you would call your container orchestrator API to add instances
    } else {
      console.log(`Scaling down from ${from} to ${to} instances`)
      // Here you would call your container orchestrator API to remove instances
    }
  }

  private generateEventId(): string {
    return `scale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Manual scaling methods
  async scaleToCount(targetCount: number, reason: string = 'Manual scaling'): Promise<void> {
    const currentCount = Array.from(this.instances.values()).filter(i => i.health === 'healthy').length

    if (targetCount === currentCount) {
      console.log('Target count matches current count, no scaling needed')
      return
    }

    if (targetCount < this.config.minInstances || targetCount > this.config.maxInstances) {
      throw new Error(`Target count ${targetCount} is outside allowed range [${this.config.minInstances}, ${this.config.maxInstances}]`)
    }

    const decision = {
      type: targetCount > currentCount ? 'scale_up' : 'scale_down' as const,
      reason
    }

    const metrics = this.calculateAggregateMetrics(Array.from(this.instances.values()))
    await this.executeScalingDecision(decision, metrics)
  }

  // Tax season preparation
  async prepareTaxSeasonScaling(): Promise<void> {
    console.log('Preparing horizontal scaling for tax season...')

    // Increase capacity proactively
    const taxSeasonConfig: Partial<ScalingConfig> = {
      minInstances: 8, // Higher baseline
      maxInstances: 50, // Much higher peak capacity
      targetCPU: 60, // Lower thresholds for better performance
      targetMemory: 70,
      targetResponseTime: 1500, // Faster response time targets
      scaleUpCooldown: 180000, // Faster scale-up (3 minutes)
      scaleDownCooldown: 900000, // Slower scale-down (15 minutes)
      scaleUpThreshold: 0.6, // Scale up earlier
      scaleDownThreshold: 0.2 // Scale down more conservatively
    }

    Object.assign(this.config, taxSeasonConfig)

    // Pre-scale to higher baseline
    await this.scaleToCount(this.config.minInstances, 'Tax season preparation')

    console.log('Tax season scaling preparation completed')
  }

  // Load balancing integration
  async updateLoadBalancer(instances: string[]): Promise<void> {
    try {
      // Mock implementation - integrate with your load balancer
      const loadBalancerConfig = {
        targets: instances.map(id => ({
          id,
          weight: 100,
          health: 'healthy'
        }))
      }

      await this.redis.set('load_balancer_config', JSON.stringify(loadBalancerConfig))
      console.log(`Updated load balancer with ${instances.length} instances`)

    } catch (error) {
      console.error('Failed to update load balancer:', error)
    }
  }

  // Monitoring and analytics
  getScalingStats(): {
    currentInstances: number
    healthyInstances: number
    avgMetrics: any
    scalingEvents: number
    lastScaleAction: Date | null
    config: ScalingConfig
  } {
    const instances = Array.from(this.instances.values())
    const healthyInstances = instances.filter(i => i.health === 'healthy')

    return {
      currentInstances: instances.length,
      healthyInstances: healthyInstances.length,
      avgMetrics: this.calculateAggregateMetrics(instances),
      scalingEvents: this.scalingHistory.length,
      lastScaleAction: this.lastScaleAction,
      config: this.config
    }
  }

  getRecentScalingEvents(limit: number = 10): ScalingEvent[] {
    return this.scalingHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  async getInstanceHealth(): Promise<Array<{
    instanceId: string
    status: 'healthy' | 'unhealthy' | 'unknown'
    uptime: number
    lastCheck: Date
  }>> {
    const healthChecks = Array.from(this.instances.values()).map(instance => ({
      instanceId: instance.instanceId,
      status: instance.health,
      uptime: Date.now() - instance.timestamp.getTime(),
      lastCheck: instance.timestamp
    }))

    return healthChecks
  }

  // Predictive scaling based on historical patterns
  async predictiveScale(): Promise<void> {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    // Business hours predictive scaling
    if (hour === 7 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Scale up before business hours
      const currentCount = Array.from(this.instances.values()).filter(i => i.health === 'healthy').length
      const targetCount = Math.min(this.config.maxInstances, Math.ceil(currentCount * 1.5))

      if (targetCount > currentCount) {
        await this.scaleToCount(targetCount, 'Predictive scaling for business hours')
      }
    }

    // Tax season predictive scaling
    if (this.isTaxSeason()) {
      const now = new Date()
      const daysUntilDeadline = Math.ceil((new Date(now.getFullYear(), 3, 15).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
        // Scale up aggressively as deadline approaches
        const scaleFactor = 1 + (30 - daysUntilDeadline) / 30 * 2 // Up to 3x scaling
        const currentCount = Array.from(this.instances.values()).filter(i => i.health === 'healthy').length
        const targetCount = Math.min(this.config.maxInstances, Math.ceil(currentCount * scaleFactor))

        if (targetCount > currentCount) {
          await this.scaleToCount(targetCount, `Tax deadline predictive scaling (${daysUntilDeadline} days remaining)`)
        }
      }
    }
  }
}

// Load balancer configuration for optimal distribution
class LoadBalancerManager {
  private redis: Redis
  private config: LoadBalancerConfig

  constructor(redis: Redis, config: Partial<LoadBalancerConfig> = {}) {
    this.redis = redis
    this.config = {
      algorithm: 'least_connections',
      healthCheckPath: '/api/health',
      healthCheckInterval: 30000, // 30 seconds
      healthCheckTimeout: 5000, // 5 seconds
      maxFailures: 3,
      sessionAffinity: false, // For AdvisorOS, we use stateless design
      ...config
    }
  }

  async distributeRequest(organizationId: string): Promise<string> {
    const healthyInstances = await this.getHealthyInstances()

    if (healthyInstances.length === 0) {
      throw new Error('No healthy instances available')
    }

    switch (this.config.algorithm) {
      case 'round_robin':
        return this.roundRobin(healthyInstances)

      case 'least_connections':
        return this.leastConnections(healthyInstances)

      case 'ip_hash':
        return this.ipHash(organizationId, healthyInstances)

      default:
        return healthyInstances[0]
    }
  }

  private async getHealthyInstances(): Promise<string[]> {
    const config = await this.redis.get('load_balancer_config')
    if (!config) return []

    const parsed = JSON.parse(config)
    return parsed.targets
      .filter((target: any) => target.health === 'healthy')
      .map((target: any) => target.id)
  }

  private roundRobin(instances: string[]): string {
    // Simple round-robin implementation
    const index = Date.now() % instances.length
    return instances[index]
  }

  private async leastConnections(instances: string[]): Promise<string> {
    // Find instance with least active connections
    let minConnections = Infinity
    let selectedInstance = instances[0]

    for (const instanceId of instances) {
      const metrics = await this.redis.get(`instance_metrics:${instanceId}`)
      if (metrics) {
        const parsed = JSON.parse(metrics)
        if (parsed.activeConnections < minConnections) {
          minConnections = parsed.activeConnections
          selectedInstance = instanceId
        }
      }
    }

    return selectedInstance
  }

  private ipHash(clientId: string, instances: string[]): string {
    // Consistent hashing based on client/organization ID
    const hash = this.simpleHash(clientId)
    return instances[hash % instances.length]
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

export { HorizontalScalingManager, LoadBalancerManager }
export type { ScalingConfig, InstanceMetrics, ScalingEvent, LoadBalancerConfig }