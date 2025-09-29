/**
 * A/B Testing Engine for Feature Optimization
 * Comprehensive A/B testing framework for feature adoption experiments
 */

import { prisma } from '@/server/db'
import { Redis } from 'ioredis'
import { nanoid } from 'nanoid'
import {
  ABTestResult,
  FeatureEvent,
  UserSegment,
  DateRange
} from './types'

interface ABTest {
  id: string
  name: string
  description: string
  hypothesis: string
  featureId: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  variants: ABTestVariant[]
  targetSegments: string[]
  trafficAllocation: number // 0-100 percentage
  startDate: Date
  endDate?: Date
  successMetrics: SuccessMetric[]
  minimumSampleSize: number
  minimumDetectableEffect: number
  confidenceLevel: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface ABTestVariant {
  id: string
  name: string
  description: string
  isControl: boolean
  trafficSplit: number // percentage of test traffic
  configuration: Record<string, any>
  users: number
  conversions: number
  conversionRate: number
}

interface SuccessMetric {
  id: string
  name: string
  type: 'conversion' | 'engagement' | 'retention' | 'satisfaction' | 'revenue'
  eventType: string
  aggregation: 'count' | 'rate' | 'average' | 'sum'
  target: number
  weight: number
}

interface ExperimentResult {
  testId: string
  variant: ABTestVariant
  metric: SuccessMetric
  value: number
  confidence: number
  significance: number
  improvement: number
  isWinner: boolean
  sampleSize: number
}

interface StatisticalAnalysis {
  variant: string
  sampleSize: number
  conversions: number
  conversionRate: number
  confidence: number
  pValue: number
  zScore: number
  marginOfError: number
  isSignificant: boolean
}

export class ABTestingEngine {
  constructor(private redis: Redis) {}

  /**
   * Create a new A/B test
   */
  async createTest(testConfig: Partial<ABTest>): Promise<ABTest> {
    const test: ABTest = {
      id: nanoid(),
      name: testConfig.name || 'Untitled Test',
      description: testConfig.description || '',
      hypothesis: testConfig.hypothesis || '',
      featureId: testConfig.featureId!,
      status: 'draft',
      variants: testConfig.variants || [],
      targetSegments: testConfig.targetSegments || [],
      trafficAllocation: testConfig.trafficAllocation || 100,
      startDate: testConfig.startDate || new Date(),
      endDate: testConfig.endDate,
      successMetrics: testConfig.successMetrics || [],
      minimumSampleSize: testConfig.minimumSampleSize || 1000,
      minimumDetectableEffect: testConfig.minimumDetectableEffect || 5,
      confidenceLevel: testConfig.confidenceLevel || 95,
      createdBy: testConfig.createdBy!,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Validate test configuration
    this.validateTestConfiguration(test)

    // Store test in database
    await this.storeTest(test)

    // Cache test for quick access
    await this.cacheTest(test)

    return test
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    const test = await this.getTest(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    if (test.status !== 'draft') {
      throw new Error(`Cannot start test in ${test.status} status`)
    }

    // Initialize variant tracking
    for (const variant of test.variants) {
      await this.initializeVariantTracking(testId, variant.id)
    }

    // Update test status
    test.status = 'active'
    test.startDate = new Date()
    test.updatedAt = new Date()

    await this.updateTest(test)
    await this.logTestEvent(testId, 'test_started', { startDate: test.startDate })
  }

  /**
   * Assign a user to a test variant
   */
  async assignUserToVariant(testId: string, userId: string, organizationId: string): Promise<string | null> {
    const test = await this.getTest(testId)
    if (!test || test.status !== 'active') {
      return null
    }

    // Check if user is already assigned
    const existingAssignment = await this.getUserAssignment(testId, userId)
    if (existingAssignment) {
      return existingAssignment
    }

    // Check if user meets targeting criteria
    if (!await this.userMeetsTargetingCriteria(test, userId, organizationId)) {
      return null
    }

    // Check traffic allocation
    if (!this.shouldIncludeInTest(test.trafficAllocation)) {
      return null
    }

    // Assign to variant based on traffic split
    const variantId = this.selectVariant(test.variants, userId)

    // Store assignment
    await this.storeUserAssignment(testId, userId, variantId)

    // Track assignment event
    await this.trackTestEvent(testId, variantId, userId, 'user_assigned', {})

    return variantId
  }

  /**
   * Track a conversion event for a test
   */
  async trackConversion(
    testId: string,
    userId: string,
    metricId: string,
    value: number = 1,
    metadata?: Record<string, any>
  ): Promise<void> {
    const assignment = await this.getUserAssignment(testId, userId)
    if (!assignment) {
      return // User not in test
    }

    // Record conversion
    await this.recordConversion(testId, assignment, metricId, value, metadata)

    // Update variant metrics
    await this.updateVariantMetrics(testId, assignment, metricId, value)

    // Track event
    await this.trackTestEvent(testId, assignment, userId, 'conversion', {
      metricId,
      value,
      metadata
    })
  }

  /**
   * Analyze test results
   */
  async analyzeTestResults(testId: string): Promise<ExperimentResult[]> {
    const test = await this.getTest(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    const results: ExperimentResult[] = []

    for (const metric of test.successMetrics) {
      const variantResults = await this.analyzeVariantsForMetric(test, metric)
      results.push(...variantResults)
    }

    return results
  }

  /**
   * Get statistical analysis for test
   */
  async getStatisticalAnalysis(testId: string): Promise<StatisticalAnalysis[]> {
    const test = await this.getTest(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    const analyses: StatisticalAnalysis[] = []

    for (const variant of test.variants) {
      const analysis = await this.performStatisticalAnalysis(test, variant)
      analyses.push(analysis)
    }

    return analyses
  }

  /**
   * Check if test has reached statistical significance
   */
  async checkSignificance(testId: string): Promise<boolean> {
    const analyses = await this.getStatisticalAnalysis(testId)
    const nonControlAnalyses = analyses.filter(a => !this.isControlVariant(testId, a.variant))

    return nonControlAnalyses.some(analysis =>
      analysis.isSignificant &&
      analysis.sampleSize >= (await this.getTest(testId))!.minimumSampleSize
    )
  }

  /**
   * Stop a test
   */
  async stopTest(testId: string, reason: string = 'Manual stop'): Promise<void> {
    const test = await this.getTest(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    test.status = 'completed'
    test.endDate = new Date()
    test.updatedAt = new Date()

    await this.updateTest(test)
    await this.logTestEvent(testId, 'test_stopped', { reason, endDate: test.endDate })

    // Determine winning variant
    const winner = await this.determineWinner(testId)
    if (winner) {
      await this.logTestEvent(testId, 'winner_determined', { winnerVariant: winner.id })
    }
  }

  /**
   * Get test performance dashboard data
   */
  async getTestDashboard(testId: string): Promise<any> {
    const test = await this.getTest(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    const [
      results,
      statistics,
      timeline,
      segmentBreakdown
    ] = await Promise.all([
      this.analyzeTestResults(testId),
      this.getStatisticalAnalysis(testId),
      this.getTestTimeline(testId),
      this.getSegmentBreakdown(testId)
    ])

    return {
      test,
      results,
      statistics,
      timeline,
      segmentBreakdown,
      isSignificant: await this.checkSignificance(testId),
      recommendation: await this.getTestRecommendation(testId)
    }
  }

  /**
   * Create feature adoption funnel test
   */
  async createAdoptionFunnelTest(
    featureId: string,
    variants: Array<{ name: string; onboardingFlow: string }>,
    createdBy: string
  ): Promise<ABTest> {
    const testConfig: Partial<ABTest> = {
      name: `${featureId} Adoption Funnel Test`,
      description: `Test different onboarding approaches for ${featureId}`,
      hypothesis: 'Improved onboarding flow will increase feature adoption rates',
      featureId,
      variants: variants.map((variant, index) => ({
        id: nanoid(),
        name: variant.name,
        description: `Onboarding flow: ${variant.onboardingFlow}`,
        isControl: index === 0,
        trafficSplit: Math.floor(100 / variants.length),
        configuration: { onboardingFlow: variant.onboardingFlow },
        users: 0,
        conversions: 0,
        conversionRate: 0
      })),
      successMetrics: [
        {
          id: 'feature_discovery',
          name: 'Feature Discovery',
          type: 'conversion',
          eventType: 'FEATURE_DISCOVERED',
          aggregation: 'rate',
          target: 80,
          weight: 0.3
        },
        {
          id: 'first_use',
          name: 'First Use',
          type: 'conversion',
          eventType: 'FEATURE_USED_FIRST_TIME',
          aggregation: 'rate',
          target: 60,
          weight: 0.4
        },
        {
          id: 'continued_use',
          name: 'Continued Use',
          type: 'conversion',
          eventType: 'FEATURE_USED_REPEATEDLY',
          aggregation: 'rate',
          target: 40,
          weight: 0.3
        }
      ],
      minimumSampleSize: 500,
      minimumDetectableEffect: 10,
      confidenceLevel: 95,
      createdBy
    }

    return this.createTest(testConfig)
  }

  // Private helper methods

  private validateTestConfiguration(test: ABTest): void {
    if (!test.name || !test.featureId || !test.createdBy) {
      throw new Error('Missing required test configuration')
    }

    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants')
    }

    const totalTrafficSplit = test.variants.reduce((sum, v) => sum + v.trafficSplit, 0)
    if (Math.abs(totalTrafficSplit - 100) > 0.01) {
      throw new Error('Variant traffic splits must sum to 100%')
    }

    if (test.successMetrics.length === 0) {
      throw new Error('Test must have at least one success metric')
    }
  }

  private async storeTest(test: ABTest): Promise<void> {
    // Store in database (simplified - would use proper schema)
    await prisma.experiment.create({
      data: {
        id: test.id,
        name: test.name,
        description: test.description,
        featureId: test.featureId,
        status: test.status,
        configuration: test as any,
        createdBy: test.createdBy,
        createdAt: test.createdAt
      }
    })
  }

  private async cacheTest(test: ABTest): Promise<void> {
    await this.redis.setex(`ab_test:${test.id}`, 3600, JSON.stringify(test))
  }

  private async getTest(testId: string): Promise<ABTest | null> {
    // Try cache first
    const cached = await this.redis.get(`ab_test:${testId}`)
    if (cached) {
      return JSON.parse(cached)
    }

    // Fallback to database
    const experiment = await prisma.experiment.findUnique({
      where: { id: testId }
    })

    if (!experiment) {
      return null
    }

    const test = experiment.configuration as ABTest
    await this.cacheTest(test)

    return test
  }

  private async updateTest(test: ABTest): Promise<void> {
    test.updatedAt = new Date()
    await this.storeTest(test)
    await this.cacheTest(test)
  }

  private async initializeVariantTracking(testId: string, variantId: string): Promise<void> {
    await this.redis.hmset(`test_variant:${testId}:${variantId}`, {
      users: 0,
      conversions: 0,
      conversionRate: 0
    })
  }

  private async getUserAssignment(testId: string, userId: string): Promise<string | null> {
    return this.redis.get(`test_assignment:${testId}:${userId}`)
  }

  private async userMeetsTargetingCriteria(test: ABTest, userId: string, organizationId: string): Promise<boolean> {
    // Check if user is in target segments
    if (test.targetSegments.length > 0) {
      const userSegments = await this.redis.smembers(`user_segments:${userId}`)
      const hasTargetSegment = test.targetSegments.some(segment => userSegments.includes(segment))
      if (!hasTargetSegment) {
        return false
      }
    }

    return true
  }

  private shouldIncludeInTest(trafficAllocation: number): boolean {
    return Math.random() * 100 < trafficAllocation
  }

  private selectVariant(variants: ABTestVariant[], userId: string): string {
    // Use consistent hashing to ensure same user always gets same variant
    const hash = this.hashUserId(userId)
    let cumulativeWeight = 0

    for (const variant of variants) {
      cumulativeWeight += variant.trafficSplit
      if (hash <= cumulativeWeight) {
        return variant.id
      }
    }

    return variants[0].id // Fallback
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100
  }

  private async storeUserAssignment(testId: string, userId: string, variantId: string): Promise<void> {
    await this.redis.setex(`test_assignment:${testId}:${userId}`, 30 * 24 * 60 * 60, variantId)
    await this.redis.sadd(`test_users:${testId}:${variantId}`, userId)
  }

  private async trackTestEvent(
    testId: string,
    variantId: string,
    userId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    const event = {
      testId,
      variantId,
      userId,
      eventType,
      data,
      timestamp: new Date()
    }

    await this.redis.lpush(`test_events:${testId}`, JSON.stringify(event))
  }

  private async logTestEvent(testId: string, eventType: string, data: Record<string, any>): Promise<void> {
    const event = {
      testId,
      eventType,
      data,
      timestamp: new Date()
    }

    await this.redis.lpush(`test_log:${testId}`, JSON.stringify(event))
  }

  private async recordConversion(
    testId: string,
    variantId: string,
    metricId: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const conversion = {
      testId,
      variantId,
      metricId,
      value,
      metadata,
      timestamp: new Date()
    }

    await this.redis.lpush(`test_conversions:${testId}:${variantId}`, JSON.stringify(conversion))
  }

  private async updateVariantMetrics(testId: string, variantId: string, metricId: string, value: number): Promise<void> {
    await this.redis.hincrby(`test_variant:${testId}:${variantId}`, 'conversions', value)

    // Recalculate conversion rate
    const [users, conversions] = await this.redis.hmget(
      `test_variant:${testId}:${variantId}`,
      'users',
      'conversions'
    )

    const conversionRate = parseInt(users || '0') > 0 ?
      (parseInt(conversions || '0') / parseInt(users || '1')) * 100 : 0

    await this.redis.hset(`test_variant:${testId}:${variantId}`, 'conversionRate', conversionRate)
  }

  // Additional helper methods would be implemented here...
  private async analyzeVariantsForMetric(test: ABTest, metric: SuccessMetric): Promise<ExperimentResult[]> { return [] }
  private async performStatisticalAnalysis(test: ABTest, variant: ABTestVariant): Promise<StatisticalAnalysis> { return {} as any }
  private isControlVariant(testId: string, variantId: string): boolean { return false }
  private async determineWinner(testId: string): Promise<ABTestVariant | null> { return null }
  private async getTestTimeline(testId: string): Promise<any[]> { return [] }
  private async getSegmentBreakdown(testId: string): Promise<any> { return {} }
  private async getTestRecommendation(testId: string): Promise<string> { return '' }
}