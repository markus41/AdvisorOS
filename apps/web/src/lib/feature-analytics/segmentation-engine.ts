/**
 * User Segmentation Engine
 * Advanced user segmentation and personalization for feature recommendations
 */

import { prisma } from '@/server/db'
import { Redis } from 'ioredis'
import {
  UserSegment,
  SegmentCriteria,
  FeatureEvent,
  FeatureDefinition,
  FeatureRecommendation,
  DateRange
} from './types'

interface UserProfile {
  userId: string
  organizationId: string
  firmSize: 'small' | 'medium' | 'large'
  userRole: 'admin' | 'manager' | 'staff' | 'client'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  subscriptionTier: 'basic' | 'professional' | 'enterprise'
  industry: string[]
  geolocation: string
  accountAge: number
  usageFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional'
  featureUsage: Record<string, number>
  preferences: Record<string, any>
  goals: string[]
  painPoints: string[]
}

interface SegmentInsight {
  segmentId: string
  segmentName: string
  userCount: number
  averageAdoptionRate: number
  topFeatures: string[]
  commonJourneys: string[]
  successPatterns: string[]
  barriers: string[]
  recommendations: FeatureRecommendation[]
}

interface PersonalizationRule {
  id: string
  name: string
  condition: string
  action: {
    type: 'recommend_feature' | 'show_tooltip' | 'start_tour' | 'hide_feature' | 'customize_ui'
    parameters: Record<string, any>
  }
  priority: number
  isActive: boolean
}

interface BehavioralPattern {
  pattern: string
  frequency: number
  userSegments: string[]
  features: string[]
  outcomes: string[]
  confidence: number
}

export class SegmentationEngine {
  private predefinedSegments: UserSegment[] = []
  private dynamicSegments: Map<string, UserSegment> = new Map()
  private personalizationRules: PersonalizationRule[] = []

  constructor(private redis: Redis) {
    this.initializePredefinedSegments()
    this.initializePersonalizationRules()
  }

  /**
   * Classify a user into appropriate segments
   */
  async classifyUser(userId: string, organizationId: string): Promise<string[]> {
    const userProfile = await this.buildUserProfile(userId, organizationId)
    const segments: string[] = []

    // Check predefined segments
    for (const segment of this.predefinedSegments) {
      if (this.matchesSegmentCriteria(userProfile, segment.criteria)) {
        segments.push(segment.id)
      }
    }

    // Check dynamic segments
    for (const [segmentId, segment] of this.dynamicSegments) {
      if (this.matchesSegmentCriteria(userProfile, segment.criteria)) {
        segments.push(segmentId)
      }
    }

    // Store segment assignments
    await this.storeSegmentAssignments(userId, segments)

    return segments
  }

  /**
   * Build comprehensive user profile
   */
  async buildUserProfile(userId: string, organizationId: string): Promise<UserProfile> {
    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        _count: {
          select: {
            clients: true,
            documents: true
          }
        }
      }
    })

    if (!user) {
      throw new Error(`User ${userId} not found`)
    }

    // Calculate usage patterns
    const featureUsage = await this.calculateFeatureUsage(userId, organizationId)
    const usageFrequency = await this.calculateUsageFrequency(userId)
    const experienceLevel = this.determineExperienceLevel(user, featureUsage)

    // Determine firm size based on organization metrics
    const firmSize = this.determineFirmSize(user.organization)

    // Get user preferences and goals
    const preferences = await this.getUserPreferences(userId)
    const goals = await this.inferUserGoals(userId, featureUsage)
    const painPoints = await this.identifyPainPoints(userId)

    return {
      userId,
      organizationId,
      firmSize,
      userRole: user.role as any,
      experienceLevel,
      subscriptionTier: user.organization?.subscriptionTier as any || 'basic',
      industry: user.organization?.industry ? [user.organization.industry] : [],
      geolocation: user.organization?.country || 'US',
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      usageFrequency,
      featureUsage,
      preferences,
      goals,
      painPoints
    }
  }

  /**
   * Generate personalized feature recommendations
   */
  async generatePersonalizedRecommendations(
    userId: string,
    organizationId: string,
    limit: number = 5
  ): Promise<FeatureRecommendation[]> {
    const userProfile = await this.buildUserProfile(userId, organizationId)
    const userSegments = await this.classifyUser(userId, organizationId)

    const recommendations: FeatureRecommendation[] = []

    // Segment-based recommendations
    for (const segmentId of userSegments) {
      const segment = this.predefinedSegments.find(s => s.id === segmentId) ||
                     this.dynamicSegments.get(segmentId)

      if (segment) {
        const segmentRecs = await this.getSegmentRecommendations(segment, userProfile)
        recommendations.push(...segmentRecs)
      }
    }

    // Behavioral pattern recommendations
    const behavioralRecs = await this.getBehavioralRecommendations(userProfile)
    recommendations.push(...behavioralRecs)

    // Collaborative filtering recommendations
    const collaborativeRecs = await this.getCollaborativeRecommendations(userProfile)
    recommendations.push(...collaborativeRecs)

    // Score and rank recommendations
    const scoredRecommendations = await this.scoreRecommendations(recommendations, userProfile)

    // Remove duplicates and limit results
    const uniqueRecommendations = this.deduplicateRecommendations(scoredRecommendations)

    return uniqueRecommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
  }

  /**
   * Discover dynamic segments based on behavior patterns
   */
  async discoverDynamicSegments(minSegmentSize: number = 10): Promise<UserSegment[]> {
    const behaviorPatterns = await this.findBehavioralPatterns()
    const newSegments: UserSegment[] = []

    for (const pattern of behaviorPatterns) {
      if (pattern.confidence > 0.7) {
        const segmentId = `dynamic_${pattern.pattern.replace(/\s+/g, '_').toLowerCase()}`

        const segment: UserSegment = {
          id: segmentId,
          name: `${pattern.pattern} Users`,
          description: `Users who exhibit ${pattern.pattern} behavior`,
          criteria: this.convertPatternToCriteria(pattern),
          targetFeatures: pattern.features,
          adoptionGoals: this.calculateAdoptionGoals(pattern)
        }

        // Validate segment size
        const segmentSize = await this.estimateSegmentSize(segment.criteria)
        if (segmentSize >= minSegmentSize) {
          this.dynamicSegments.set(segmentId, segment)
          newSegments.push(segment)
        }
      }
    }

    return newSegments
  }

  /**
   * Analyze segment performance and insights
   */
  async analyzeSegmentInsights(segmentId: string, period: DateRange): Promise<SegmentInsight> {
    const segment = this.predefinedSegments.find(s => s.id === segmentId) ||
                   this.dynamicSegments.get(segmentId)

    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`)
    }

    const segmentUsers = await this.getSegmentUsers(segmentId)
    const adoptionRates = await this.calculateSegmentAdoptionRates(segmentUsers, period)
    const topFeatures = await this.getSegmentTopFeatures(segmentUsers, period)
    const commonJourneys = await this.getSegmentJourneys(segmentUsers, period)
    const successPatterns = await this.getSegmentSuccessPatterns(segmentUsers, period)
    const barriers = await this.getSegmentBarriers(segmentUsers, period)
    const recommendations = await this.generateSegmentRecommendations(segment, segmentUsers)

    return {
      segmentId,
      segmentName: segment.name,
      userCount: segmentUsers.length,
      averageAdoptionRate: adoptionRates.reduce((sum, rate) => sum + rate, 0) / adoptionRates.length,
      topFeatures,
      commonJourneys,
      successPatterns,
      barriers,
      recommendations
    }
  }

  /**
   * Apply personalization rules
   */
  async applyPersonalization(
    userId: string,
    organizationId: string,
    context: Record<string, any>
  ): Promise<any[]> {
    const userProfile = await this.buildUserProfile(userId, organizationId)
    const actions: any[] = []

    for (const rule of this.personalizationRules) {
      if (rule.isActive && this.evaluatePersonalizationCondition(rule.condition, userProfile, context)) {
        actions.push({
          type: rule.action.type,
          parameters: rule.action.parameters,
          priority: rule.priority,
          ruleId: rule.id
        })
      }
    }

    return actions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Update user segment based on new behavior
   */
  async updateUserSegmentation(userId: string, organizationId: string, events: FeatureEvent[]): Promise<void> {
    // Update feature usage counts
    for (const event of events) {
      await this.redis.hincrby(
        `user_feature_usage:${userId}`,
        event.featureId,
        1
      )
    }

    // Recalculate segments periodically
    const lastSegmentUpdate = await this.redis.get(`last_segment_update:${userId}`)
    const now = Date.now()

    if (!lastSegmentUpdate || now - parseInt(lastSegmentUpdate) > 24 * 60 * 60 * 1000) {
      await this.classifyUser(userId, organizationId)
      await this.redis.set(`last_segment_update:${userId}`, now.toString())
    }
  }

  /**
   * Track segment conversion metrics
   */
  async trackSegmentConversion(
    segmentId: string,
    featureId: string,
    conversionType: 'discovery' | 'trial' | 'adoption' | 'mastery'
  ): Promise<void> {
    const key = `segment_conversion:${segmentId}:${featureId}:${conversionType}`
    await this.redis.hincrby('segment_conversions', key, 1)
  }

  // Private helper methods

  private initializePredefinedSegments(): void {
    this.predefinedSegments = [
      {
        id: 'new_users',
        name: 'New Users',
        description: 'Users who joined recently and are still learning the system',
        criteria: {
          accountAge: 7, // Less than 7 days
          experienceLevel: 'beginner'
        },
        targetFeatures: ['client-management', 'document-upload', 'basic-reporting'],
        adoptionGoals: {
          'client-management': 80,
          'document-upload': 60,
          'basic-reporting': 40
        }
      },
      {
        id: 'power_users',
        name: 'Power Users',
        description: 'Advanced users who use multiple features regularly',
        criteria: {
          experienceLevel: 'advanced',
          usageFrequency: 'daily'
        },
        targetFeatures: ['workflow-automation', 'advanced-reporting', 'api-integration'],
        adoptionGoals: {
          'workflow-automation': 70,
          'advanced-reporting': 60,
          'api-integration': 40
        }
      },
      {
        id: 'small_firms',
        name: 'Small Firms',
        description: 'Small accounting firms with limited resources',
        criteria: {
          firmSize: 'small'
        },
        targetFeatures: ['quickbooks-sync', 'client-portal', 'basic-automation'],
        adoptionGoals: {
          'quickbooks-sync': 80,
          'client-portal': 60,
          'basic-automation': 50
        }
      },
      {
        id: 'enterprise_users',
        name: 'Enterprise Users',
        description: 'Large firms with complex needs',
        criteria: {
          firmSize: 'large',
          subscriptionTier: 'enterprise'
        },
        targetFeatures: ['advanced-workflow', 'custom-reporting', 'api-access', 'team-management'],
        adoptionGoals: {
          'advanced-workflow': 90,
          'custom-reporting': 80,
          'api-access': 60,
          'team-management': 70
        }
      },
      {
        id: 'struggling_users',
        name: 'Struggling Users',
        description: 'Users who are having difficulty with adoption',
        criteria: {
          usageFrequency: 'occasional',
          accountAge: 30 // More than 30 days but low usage
        },
        targetFeatures: ['onboarding-tour', 'help-center', 'basic-features'],
        adoptionGoals: {
          'onboarding-tour': 100,
          'help-center': 80,
          'basic-features': 60
        }
      }
    ]
  }

  private initializePersonalizationRules(): void {
    this.personalizationRules = [
      {
        id: 'new_user_onboarding',
        name: 'New User Onboarding',
        condition: 'user.accountAge < 7 && user.experienceLevel === "beginner"',
        action: {
          type: 'start_tour',
          parameters: { tourId: 'new-user-welcome' }
        },
        priority: 10,
        isActive: true
      },
      {
        id: 'power_user_advanced_features',
        name: 'Power User Advanced Features',
        condition: 'user.experienceLevel === "advanced" && user.usageFrequency === "daily"',
        action: {
          type: 'recommend_feature',
          parameters: { features: ['workflow-automation', 'api-integration'] }
        },
        priority: 8,
        isActive: true
      },
      {
        id: 'small_firm_integrations',
        name: 'Small Firm Integrations',
        condition: 'user.firmSize === "small" && !user.featureUsage["quickbooks-sync"]',
        action: {
          type: 'show_tooltip',
          parameters: {
            featureId: 'quickbooks-sync',
            message: 'Save time with automatic financial data sync'
          }
        },
        priority: 7,
        isActive: true
      },
      {
        id: 'hide_advanced_for_beginners',
        name: 'Hide Advanced Features for Beginners',
        condition: 'user.experienceLevel === "beginner"',
        action: {
          type: 'hide_feature',
          parameters: { features: ['api-access', 'custom-reporting'] }
        },
        priority: 5,
        isActive: true
      }
    ]
  }

  private matchesSegmentCriteria(profile: UserProfile, criteria: SegmentCriteria): boolean {
    if (criteria.firmSize && profile.firmSize !== criteria.firmSize) return false
    if (criteria.userRole && profile.userRole !== criteria.userRole) return false
    if (criteria.experienceLevel && profile.experienceLevel !== criteria.experienceLevel) return false
    if (criteria.subscriptionTier && profile.subscriptionTier !== criteria.subscriptionTier) return false
    if (criteria.usageFrequency && profile.usageFrequency !== criteria.usageFrequency) return false
    if (criteria.accountAge && profile.accountAge > criteria.accountAge) return false

    if (criteria.industry && criteria.industry.length > 0) {
      const hasMatchingIndustry = criteria.industry.some(industry =>
        profile.industry.includes(industry)
      )
      if (!hasMatchingIndustry) return false
    }

    if (criteria.geolocation && criteria.geolocation.length > 0) {
      if (!criteria.geolocation.includes(profile.geolocation)) return false
    }

    if (criteria.featureUsage) {
      for (const [featureId, minUsage] of Object.entries(criteria.featureUsage)) {
        if ((profile.featureUsage[featureId] || 0) < minUsage) return false
      }
    }

    return true
  }

  private async storeSegmentAssignments(userId: string, segments: string[]): Promise<void> {
    await this.redis.del(`user_segments:${userId}`)
    if (segments.length > 0) {
      await this.redis.sadd(`user_segments:${userId}`, ...segments)
    }
    await this.redis.expire(`user_segments:${userId}`, 7 * 24 * 60 * 60) // 7 days
  }

  private async calculateFeatureUsage(userId: string, organizationId: string): Promise<Record<string, number>> {
    const cached = await this.redis.hgetall(`user_feature_usage:${userId}`)
    if (Object.keys(cached).length > 0) {
      return Object.fromEntries(
        Object.entries(cached).map(([key, value]) => [key, parseInt(value)])
      )
    }

    // Calculate from database if not cached
    const events = await prisma.featureEvent.findMany({
      where: { userId, organizationId },
      select: { featureId: true }
    })

    const usage: Record<string, number> = {}
    events.forEach(event => {
      usage[event.featureId] = (usage[event.featureId] || 0) + 1
    })

    // Cache for future use
    if (Object.keys(usage).length > 0) {
      await this.redis.hmset(`user_feature_usage:${userId}`, usage)
      await this.redis.expire(`user_feature_usage:${userId}`, 24 * 60 * 60) // 24 hours
    }

    return usage
  }

  private async calculateUsageFrequency(userId: string): Promise<'daily' | 'weekly' | 'monthly' | 'occasional'> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const recentLogins = await prisma.auditLog.count({
      where: {
        userId,
        action: 'user_login',
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    if (recentLogins >= 25) return 'daily'
    if (recentLogins >= 8) return 'weekly'
    if (recentLogins >= 2) return 'monthly'
    return 'occasional'
  }

  private determineExperienceLevel(user: any, featureUsage: Record<string, number>): 'beginner' | 'intermediate' | 'advanced' {
    const totalUsage = Object.values(featureUsage).reduce((sum, count) => sum + count, 0)
    const featuresUsed = Object.keys(featureUsage).length
    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))

    if (totalUsage < 10 || featuresUsed < 3 || accountAge < 7) return 'beginner'
    if (totalUsage < 100 || featuresUsed < 6 || accountAge < 30) return 'intermediate'
    return 'advanced'
  }

  private determineFirmSize(organization: any): 'small' | 'medium' | 'large' {
    if (!organization) return 'small'

    // This would be based on organization metrics like employee count, client count, etc.
    // For now, using simple heuristics
    const employeeCount = organization.employeeCount || 1

    if (employeeCount <= 10) return 'small'
    if (employeeCount <= 50) return 'medium'
    return 'large'
  }

  // Additional helper methods would be implemented here...
  private async getUserPreferences(userId: string): Promise<Record<string, any>> { return {} }
  private async inferUserGoals(userId: string, featureUsage: Record<string, number>): Promise<string[]> { return [] }
  private async identifyPainPoints(userId: string): Promise<string[]> { return [] }
  private async getSegmentRecommendations(segment: UserSegment, userProfile: UserProfile): Promise<FeatureRecommendation[]> { return [] }
  private async getBehavioralRecommendations(userProfile: UserProfile): Promise<FeatureRecommendation[]> { return [] }
  private async getCollaborativeRecommendations(userProfile: UserProfile): Promise<FeatureRecommendation[]> { return [] }
  private async scoreRecommendations(recommendations: FeatureRecommendation[], userProfile: UserProfile): Promise<FeatureRecommendation[]> { return recommendations }
  private deduplicateRecommendations(recommendations: FeatureRecommendation[]): FeatureRecommendation[] { return recommendations }
  private async findBehavioralPatterns(): Promise<BehavioralPattern[]> { return [] }
  private convertPatternToCriteria(pattern: BehavioralPattern): SegmentCriteria { return {} }
  private calculateAdoptionGoals(pattern: BehavioralPattern): Record<string, number> { return {} }
  private async estimateSegmentSize(criteria: SegmentCriteria): Promise<number> { return 0 }
  private async getSegmentUsers(segmentId: string): Promise<string[]> { return [] }
  private async calculateSegmentAdoptionRates(users: string[], period: DateRange): Promise<number[]> { return [] }
  private async getSegmentTopFeatures(users: string[], period: DateRange): Promise<string[]> { return [] }
  private async getSegmentJourneys(users: string[], period: DateRange): Promise<string[]> { return [] }
  private async getSegmentSuccessPatterns(users: string[], period: DateRange): Promise<string[]> { return [] }
  private async getSegmentBarriers(users: string[], period: DateRange): Promise<string[]> { return [] }
  private async generateSegmentRecommendations(segment: UserSegment, users: string[]): Promise<FeatureRecommendation[]> { return [] }
  private evaluatePersonalizationCondition(condition: string, userProfile: UserProfile, context: Record<string, any>): boolean { return false }
}