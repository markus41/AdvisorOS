import { Redis } from 'ioredis'
import { prisma } from '../db'
import { z } from 'zod'
import { addDays, subDays, startOfDay, endOfDay, format } from 'date-fns'

// Tax season capacity planning schemas
const TaxSeasonConfigSchema = z.object({
  taxSeasonStart: z.date(),
  taxSeasonEnd: z.date(),
  extensionDeadline: z.date(),
  peakPeriods: z.array(z.object({
    start: z.date(),
    end: z.date(),
    expectedMultiplier: z.number(),
    description: z.string()
  })),
  baselineMetrics: z.object({
    avgDailyRequests: z.number(),
    avgDailyUsers: z.number(),
    avgResponseTime: z.number(),
    peakHourMultiplier: z.number()
  })
})

interface CapacityPlan {
  periodType: 'pre_season' | 'early_season' | 'peak_season' | 'final_rush' | 'post_season'
  dateRange: {
    start: Date
    end: Date
  }
  expectedLoad: {
    dailyRequestsMultiplier: number
    concurrentUsersMultiplier: number
    documentProcessingMultiplier: number
    storageGrowthMultiplier: number
  }
  resourceRequirements: {
    webServers: {
      minimum: number
      maximum: number
      autoScaleThreshold: number
    }
    databaseConnections: {
      readReplicas: number
      writeCapacity: number
      connectionPoolSize: number
    }
    cacheNodes: {
      redisInstances: number
      memoryPerNode: string
      replicationFactor: number
    }
    storage: {
      documentStorage: string
      databaseStorage: string
      backupStorage: string
    }
    networking: {
      bandwidthGbps: number
      cdnRegions: string[]
      loadBalancerCapacity: number
    }
  }
  autoScalingPolicies: {
    scaleUpThresholds: {
      cpuPercent: number
      memoryPercent: number
      requestsPerSecond: number
      responseTimeMs: number
    }
    scaleDownThresholds: {
      cpuPercent: number
      memoryPercent: number
      requestsPerSecond: number
      responseTimeMs: number
    }
    cooldownPeriods: {
      scaleUpSeconds: number
      scaleDownSeconds: number
    }
  }
}

interface TrafficPrediction {
  date: Date
  predictedRequests: number
  confidenceLevel: number
  peakHours: Array<{
    hour: number
    requestMultiplier: number
  }>
  riskFactors: string[]
  recommendedActions: string[]
}

interface ResourceUtilization {
  timestamp: Date
  webServers: {
    active: number
    cpu: number
    memory: number
    requestsPerSecond: number
  }
  database: {
    connections: number
    cpu: number
    memory: number
    iops: number
  }
  cache: {
    hitRate: number
    memory: number
    operations: number
  }
  storage: {
    used: number
    growth: number
    iops: number
  }
}

export class TaxSeasonCapacityPlanningService {
  private readonly TAX_SEASON_PERIODS = {
    PRE_SEASON: { start: '01-01', end: '01-31' }, // January
    EARLY_SEASON: { start: '02-01', end: '03-15' }, // February to mid-March
    PEAK_SEASON: { start: '03-16', end: '04-10' }, // Mid-March to early April
    FINAL_RUSH: { start: '04-11', end: '04-15' }, // Final days before deadline
    EXTENSION_PERIOD: { start: '04-16', end: '10-15' }, // Extension deadline
    POST_SEASON: { start: '10-16', end: '12-31' } // After extensions
  }

  private readonly CAPACITY_MULTIPLIERS = {
    PRE_SEASON: 1.5,
    EARLY_SEASON: 3.0,
    PEAK_SEASON: 8.0,
    FINAL_RUSH: 15.0,
    EXTENSION_PERIOD: 2.0,
    POST_SEASON: 1.0
  }

  constructor(private redis: Redis) {
    this.initializeCapacityMonitoring()
  }

  // CAPACITY PLANNING

  async generateTaxSeasonCapacityPlan(year: number): Promise<CapacityPlan[]> {
    const historicalData = await this.getHistoricalUsageData(year - 1)
    const growthProjections = await this.calculateGrowthProjections(historicalData)
    const taxSeasonPeriods = this.getTaxSeasonPeriods(year)

    const capacityPlans: CapacityPlan[] = []

    for (const period of taxSeasonPeriods) {
      const plan = await this.createPeriodCapacityPlan(period, growthProjections, historicalData)
      capacityPlans.push(plan)
    }

    // Store the capacity plan
    await this.storeCapacityPlan(year, capacityPlans)

    return capacityPlans
  }

  private async createPeriodCapacityPlan(
    period: { type: string; start: Date; end: Date },
    growthProjections: any,
    historicalData: any
  ): Promise<CapacityPlan> {
    const multiplier = this.CAPACITY_MULTIPLIERS[period.type as keyof typeof this.CAPACITY_MULTIPLIERS]
    const baselineLoad = historicalData.baseline

    // Calculate expected load
    const expectedLoad = {
      dailyRequestsMultiplier: multiplier * growthProjections.requestGrowth,
      concurrentUsersMultiplier: multiplier * growthProjections.userGrowth,
      documentProcessingMultiplier: multiplier * 1.5, // Documents increase more during tax season
      storageGrowthMultiplier: multiplier * 2.0 // Storage needs grow significantly
    }

    // Calculate resource requirements based on load
    const resourceRequirements = this.calculateResourceRequirements(expectedLoad, baselineLoad)

    // Define auto-scaling policies
    const autoScalingPolicies = this.createAutoScalingPolicies(period.type, expectedLoad)

    return {
      periodType: period.type as any,
      dateRange: {
        start: period.start,
        end: period.end
      },
      expectedLoad,
      resourceRequirements,
      autoScalingPolicies
    }
  }

  private calculateResourceRequirements(expectedLoad: any, baselineLoad: any): any {
    const requestMultiplier = expectedLoad.dailyRequestsMultiplier
    const userMultiplier = expectedLoad.concurrentUsersMultiplier

    return {
      webServers: {
        minimum: Math.ceil(baselineLoad.webServers * userMultiplier * 0.5),
        maximum: Math.ceil(baselineLoad.webServers * userMultiplier * 2),
        autoScaleThreshold: 0.7
      },
      databaseConnections: {
        readReplicas: Math.ceil(requestMultiplier / 2),
        writeCapacity: Math.ceil(requestMultiplier * 0.3),
        connectionPoolSize: Math.ceil(baselineLoad.dbConnections * requestMultiplier)
      },
      cacheNodes: {
        redisInstances: Math.ceil(requestMultiplier / 3),
        memoryPerNode: `${Math.ceil(8 * requestMultiplier)}GB`,
        replicationFactor: 2
      },
      storage: {
        documentStorage: `${Math.ceil(1000 * expectedLoad.storageGrowthMultiplier)}GB`,
        databaseStorage: `${Math.ceil(500 * requestMultiplier)}GB`,
        backupStorage: `${Math.ceil(2000 * expectedLoad.storageGrowthMultiplier)}GB`
      },
      networking: {
        bandwidthGbps: Math.ceil(10 * requestMultiplier),
        cdnRegions: ['us-east-1', 'us-west-2', 'us-central-1'],
        loadBalancerCapacity: Math.ceil(50000 * requestMultiplier)
      }
    }
  }

  private createAutoScalingPolicies(periodType: string, expectedLoad: any): any {
    const isHighLoad = ['PEAK_SEASON', 'FINAL_RUSH'].includes(periodType)

    return {
      scaleUpThresholds: {
        cpuPercent: isHighLoad ? 60 : 70,
        memoryPercent: isHighLoad ? 70 : 80,
        requestsPerSecond: Math.ceil(1000 * expectedLoad.dailyRequestsMultiplier * 0.8),
        responseTimeMs: isHighLoad ? 2000 : 3000
      },
      scaleDownThresholds: {
        cpuPercent: isHighLoad ? 30 : 40,
        memoryPercent: isHighLoad ? 40 : 50,
        requestsPerSecond: Math.ceil(1000 * expectedLoad.dailyRequestsMultiplier * 0.3),
        responseTimeMs: isHighLoad ? 1000 : 1500
      },
      cooldownPeriods: {
        scaleUpSeconds: isHighLoad ? 180 : 300, // Faster scaling during peak
        scaleDownSeconds: isHighLoad ? 600 : 900 // Conservative scale-down
      }
    }
  }

  // TRAFFIC PREDICTION

  async generateTrafficPredictions(startDate: Date, endDate: Date): Promise<TrafficPrediction[]> {
    const predictions: TrafficPrediction[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const prediction = await this.predictDayTraffic(new Date(currentDate))
      predictions.push(prediction)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return predictions
  }

  private async predictDayTraffic(date: Date): Promise<TrafficPrediction> {
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const taxSeasonPeriod = this.getTaxSeasonPeriod(date)
    const historicalAverage = await this.getHistoricalAverageForDate(date)

    // Base prediction on historical data and tax season multiplier
    const baselineRequests = historicalAverage || 10000
    const seasonMultiplier = this.CAPACITY_MULTIPLIERS[taxSeasonPeriod]
    const weekendFactor = isWeekend ? 0.4 : 1.0

    // Special day considerations
    let specialDayFactor = 1.0
    const riskFactors: string[] = []
    const recommendedActions: string[] = []

    // Check if it's close to tax deadline
    const daysToDeadline = this.getDaysToTaxDeadline(date)
    if (daysToDeadline <= 3 && daysToDeadline >= 0) {
      specialDayFactor = 2.0
      riskFactors.push('Final 3 days before tax deadline')
      recommendedActions.push('Enable emergency scaling protocols')
      recommendedActions.push('Increase monitoring frequency to every 5 minutes')
    }

    // Check for extension deadline
    const daysToExtension = this.getDaysToExtensionDeadline(date)
    if (daysToExtension <= 3 && daysToExtension >= 0) {
      specialDayFactor = 1.5
      riskFactors.push('Final 3 days before extension deadline')
      recommendedActions.push('Monitor extension filing volumes')
    }

    const predictedRequests = Math.ceil(
      baselineRequests * seasonMultiplier * weekendFactor * specialDayFactor
    )

    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(date, historicalAverage)

    // Predict peak hours
    const peakHours = this.predictPeakHours(date, taxSeasonPeriod)

    // Add general recommendations
    if (predictedRequests > baselineRequests * 5) {
      recommendedActions.push('Pre-scale infrastructure before peak hours')
      recommendedActions.push('Notify support team of expected high volume')
    }

    return {
      date,
      predictedRequests,
      confidenceLevel,
      peakHours,
      riskFactors,
      recommendedActions
    }
  }

  private getTaxSeasonPeriod(date: Date): string {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dateStr = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

    if (dateStr >= this.TAX_SEASON_PERIODS.PRE_SEASON.start &&
        dateStr <= this.TAX_SEASON_PERIODS.PRE_SEASON.end) {
      return 'PRE_SEASON'
    }
    if (dateStr >= this.TAX_SEASON_PERIODS.EARLY_SEASON.start &&
        dateStr <= this.TAX_SEASON_PERIODS.EARLY_SEASON.end) {
      return 'EARLY_SEASON'
    }
    if (dateStr >= this.TAX_SEASON_PERIODS.PEAK_SEASON.start &&
        dateStr <= this.TAX_SEASON_PERIODS.PEAK_SEASON.end) {
      return 'PEAK_SEASON'
    }
    if (dateStr >= this.TAX_SEASON_PERIODS.FINAL_RUSH.start &&
        dateStr <= this.TAX_SEASON_PERIODS.FINAL_RUSH.end) {
      return 'FINAL_RUSH'
    }
    if (dateStr >= this.TAX_SEASON_PERIODS.EXTENSION_PERIOD.start &&
        dateStr <= this.TAX_SEASON_PERIODS.EXTENSION_PERIOD.end) {
      return 'EXTENSION_PERIOD'
    }
    return 'POST_SEASON'
  }

  private predictPeakHours(date: Date, period: string): Array<{ hour: number; requestMultiplier: number }> {
    const baseHours = [
      { hour: 9, requestMultiplier: 1.3 }, // Morning start
      { hour: 11, requestMultiplier: 1.5 }, // Late morning
      { hour: 14, requestMultiplier: 1.4 }, // After lunch
      { hour: 19, requestMultiplier: 1.8 }, // Evening peak
      { hour: 21, requestMultiplier: 1.6 }  // Night work
    ]

    // Adjust multipliers based on tax season period
    const periodMultiplier = period === 'FINAL_RUSH' ? 2.0 :
                           period === 'PEAK_SEASON' ? 1.5 : 1.0

    return baseHours.map(hour => ({
      ...hour,
      requestMultiplier: hour.requestMultiplier * periodMultiplier
    }))
  }

  // RESOURCE MONITORING

  async getCurrentResourceUtilization(): Promise<ResourceUtilization> {
    const timestamp = new Date()

    const [webServerMetrics, dbMetrics, cacheMetrics, storageMetrics] = await Promise.all([
      this.getWebServerMetrics(),
      this.getDatabaseMetrics(),
      this.getCacheMetrics(),
      this.getStorageMetrics()
    ])

    return {
      timestamp,
      webServers: webServerMetrics,
      database: dbMetrics,
      cache: cacheMetrics,
      storage: storageMetrics
    }
  }

  async getCapacityRecommendations(): Promise<{
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }> {
    const currentUtilization = await this.getCurrentResourceUtilization()
    const upcomingPredictions = await this.generateTrafficPredictions(
      new Date(),
      addDays(new Date(), 7)
    )

    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    }

    // Immediate recommendations (next 24 hours)
    if (currentUtilization.webServers.cpu > 80) {
      recommendations.immediate.push('Scale up web servers immediately - CPU usage above 80%')
    }
    if (currentUtilization.database.connections > 80) {
      recommendations.immediate.push('Increase database connection pool - utilization above 80%')
    }
    if (currentUtilization.cache.hitRate < 0.85) {
      recommendations.immediate.push('Optimize cache configuration - hit rate below 85%')
    }

    // Short-term recommendations (next 7 days)
    const nextWeekPeak = Math.max(...upcomingPredictions.map(p => p.predictedRequests))
    const currentCapacity = await this.getCurrentCapacity()

    if (nextWeekPeak > currentCapacity * 0.8) {
      recommendations.shortTerm.push('Increase infrastructure capacity for upcoming peak traffic')
    }

    // Long-term recommendations (tax season preparation)
    const taxSeasonStart = this.getNextTaxSeasonStart()
    const daysToTaxSeason = Math.ceil((taxSeasonStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysToTaxSeason <= 60 && daysToTaxSeason > 0) {
      recommendations.longTerm.push('Begin tax season infrastructure preparation')
      recommendations.longTerm.push('Schedule capacity testing and load testing')
      recommendations.longTerm.push('Review and update auto-scaling policies')
    }

    return recommendations
  }

  // AUTO-SCALING IMPLEMENTATION

  async implementAutoScaling(capacityPlan: CapacityPlan): Promise<void> {
    const scalingConfig = {
      minInstances: capacityPlan.resourceRequirements.webServers.minimum,
      maxInstances: capacityPlan.resourceRequirements.webServers.maximum,
      targetCPU: capacityPlan.autoScalingPolicies.scaleUpThresholds.cpuPercent,
      targetMemory: capacityPlan.autoScalingPolicies.scaleUpThresholds.memoryPercent,
      scaleUpCooldown: capacityPlan.autoScalingPolicies.cooldownPeriods.scaleUpSeconds,
      scaleDownCooldown: capacityPlan.autoScalingPolicies.cooldownPeriods.scaleDownSeconds
    }

    // Store scaling configuration in Redis for the scaling service to use
    await this.redis.setex(
      'auto_scaling_config',
      86400, // 24 hours
      JSON.stringify(scalingConfig)
    )

    console.log('Auto-scaling configuration updated:', scalingConfig)
  }

  async triggerEmergencyScaling(reason: string): Promise<void> {
    const emergencyConfig = {
      emergencyMode: true,
      reason,
      timestamp: new Date(),
      minInstances: 10, // Immediate minimum
      targetCPU: 50, // Lower threshold for emergency
      scaleUpCooldown: 60, // Faster scaling
      scaleDownCooldown: 1800 // Conservative scale-down
    }

    await this.redis.setex(
      'emergency_scaling_config',
      3600, // 1 hour
      JSON.stringify(emergencyConfig)
    )

    console.log('Emergency scaling triggered:', emergencyConfig)
  }

  // CAPACITY TESTING

  async scheduleCapacityTest(date: Date, testConfig: {
    targetRPS: number
    durationMinutes: number
    rampUpMinutes: number
    testScenarios: string[]
  }): Promise<string> {
    const testId = `capacity_test_${Date.now()}`

    const testPlan = {
      id: testId,
      scheduledDate: date,
      config: testConfig,
      status: 'scheduled',
      createdAt: new Date()
    }

    await this.redis.setex(
      `capacity_test:${testId}`,
      86400 * 7, // 7 days
      JSON.stringify(testPlan)
    )

    return testId
  }

  // UTILITY METHODS

  private async initializeCapacityMonitoring(): void {
    // Start background monitoring
    setInterval(async () => {
      await this.collectCapacityMetrics()
    }, 60000) // Every minute

    // Daily capacity analysis
    setInterval(async () => {
      await this.performDailyCapacityAnalysis()
    }, 86400000) // Every 24 hours
  }

  private async collectCapacityMetrics(): Promise<void> {
    const utilization = await this.getCurrentResourceUtilization()
    const timestamp = Math.floor(Date.now() / 60000) * 60000 // Round to minute

    await this.redis.setex(
      `capacity_metrics:${timestamp}`,
      3600, // 1 hour retention
      JSON.stringify(utilization)
    )
  }

  private async performDailyCapacityAnalysis(): Promise<void> {
    const today = new Date()
    const predictions = await this.generateTrafficPredictions(today, addDays(today, 1))
    const currentUtilization = await this.getCurrentResourceUtilization()

    // Check if we need to adjust capacity
    const todayPrediction = predictions[0]
    if (todayPrediction && todayPrediction.riskFactors.length > 0) {
      console.log('High-risk day detected:', todayPrediction.riskFactors)

      // Implement recommended actions
      for (const action of todayPrediction.recommendedActions) {
        console.log('Recommended action:', action)
      }
    }
  }

  private getTaxSeasonPeriods(year: number): Array<{ type: string; start: Date; end: Date }> {
    return [
      {
        type: 'PRE_SEASON',
        start: new Date(year, 0, 1), // January 1
        end: new Date(year, 0, 31) // January 31
      },
      {
        type: 'EARLY_SEASON',
        start: new Date(year, 1, 1), // February 1
        end: new Date(year, 2, 15) // March 15
      },
      {
        type: 'PEAK_SEASON',
        start: new Date(year, 2, 16), // March 16
        end: new Date(year, 3, 10) // April 10
      },
      {
        type: 'FINAL_RUSH',
        start: new Date(year, 3, 11), // April 11
        end: new Date(year, 3, 15) // April 15
      },
      {
        type: 'EXTENSION_PERIOD',
        start: new Date(year, 3, 16), // April 16
        end: new Date(year, 9, 15) // October 15
      },
      {
        type: 'POST_SEASON',
        start: new Date(year, 9, 16), // October 16
        end: new Date(year, 11, 31) // December 31
      }
    ]
  }

  private getDaysToTaxDeadline(date: Date): number {
    const year = date.getFullYear()
    const taxDeadline = new Date(year, 3, 15) // April 15
    return Math.ceil((taxDeadline.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  private getDaysToExtensionDeadline(date: Date): number {
    const year = date.getFullYear()
    const extensionDeadline = new Date(year, 9, 15) // October 15
    return Math.ceil((extensionDeadline.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculateConfidenceLevel(date: Date, historicalAverage: number | null): number {
    // Higher confidence if we have historical data
    if (historicalAverage) {
      return 0.85
    }

    // Lower confidence for predictions without historical data
    return 0.65
  }

  private getNextTaxSeasonStart(): Date {
    const now = new Date()
    const currentYear = now.getFullYear()
    const nextTaxSeason = new Date(currentYear + 1, 0, 1) // January 1 of next year

    // If we're before January, use current year
    if (now.getMonth() < 0) {
      return new Date(currentYear, 0, 1)
    }

    return nextTaxSeason
  }

  // Mock methods - these would integrate with actual infrastructure APIs
  private async getHistoricalUsageData(year: number): Promise<any> {
    return {
      baseline: {
        webServers: 3,
        dbConnections: 100,
        dailyRequests: 50000
      }
    }
  }

  private async calculateGrowthProjections(historicalData: any): Promise<any> {
    return {
      requestGrowth: 1.2, // 20% year-over-year growth
      userGrowth: 1.15 // 15% user growth
    }
  }

  private async storeCapacityPlan(year: number, plans: CapacityPlan[]): Promise<void> {
    await this.redis.setex(
      `capacity_plan:${year}`,
      86400 * 365, // Store for 1 year
      JSON.stringify(plans)
    )
  }

  private async getHistoricalAverageForDate(date: Date): Promise<number | null> {
    // This would query historical request data for the same date in previous years
    return 10000 // Mock baseline
  }

  private async getCurrentCapacity(): Promise<number> {
    // This would query current infrastructure capacity
    return 100000 // Mock current capacity
  }

  private async getWebServerMetrics(): Promise<any> {
    return {
      active: 5,
      cpu: 65,
      memory: 70,
      requestsPerSecond: 150
    }
  }

  private async getDatabaseMetrics(): Promise<any> {
    return {
      connections: 75,
      cpu: 60,
      memory: 80,
      iops: 1200
    }
  }

  private async getCacheMetrics(): Promise<any> {
    return {
      hitRate: 0.88,
      memory: 65,
      operations: 500
    }
  }

  private async getStorageMetrics(): Promise<any> {
    return {
      used: 2048, // GB
      growth: 50, // GB per day
      iops: 800
    }
  }
}

export type { CapacityPlan, TrafficPrediction, ResourceUtilization }