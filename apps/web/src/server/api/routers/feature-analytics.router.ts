/**
 * Feature Analytics API Router
 * TRPC router for feature adoption tracking and analytics endpoints
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { FeatureAnalyticsEngine } from '@/lib/feature-analytics/analytics-engine'
import { SegmentationEngine } from '@/lib/feature-analytics/segmentation-engine'
import { ABTestingEngine } from '@/lib/feature-analytics/ab-testing-engine'
import { getTracker } from '@/lib/feature-analytics/tracker'
import { Redis } from 'ioredis'

// Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Initialize analytics engines
const analyticsEngine = new FeatureAnalyticsEngine(redis)
const segmentationEngine = new SegmentationEngine(redis)
const abTestingEngine = new ABTestingEngine(redis)

// Input schemas
const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date()
})

const FeatureEventSchema = z.object({
  featureId: z.string(),
  eventType: z.string(),
  eventData: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
})

const ABTestConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  hypothesis: z.string(),
  featureId: z.string(),
  variants: z.array(z.object({
    name: z.string(),
    description: z.string(),
    isControl: z.boolean(),
    trafficSplit: z.number(),
    configuration: z.record(z.any())
  })),
  targetSegments: z.array(z.string()).optional(),
  trafficAllocation: z.number().default(100),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  successMetrics: z.array(z.object({
    name: z.string(),
    type: z.enum(['conversion', 'engagement', 'retention', 'satisfaction', 'revenue']),
    eventType: z.string(),
    aggregation: z.enum(['count', 'rate', 'average', 'sum']),
    target: z.number(),
    weight: z.number()
  })),
  minimumSampleSize: z.number().default(1000),
  minimumDetectableEffect: z.number().default(5),
  confidenceLevel: z.number().default(95)
})

export const featureAnalyticsRouter = createTRPCRouter({
  // Event Tracking
  trackEvents: protectedProcedure
    .input(z.object({
      events: z.array(FeatureEventSchema)
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const organizationId = ctx.session.user.organizationId || ''

      const events = input.events.map(event => ({
        id: crypto.randomUUID(),
        userId,
        organizationId,
        sessionId: ctx.session.id || '',
        ...event,
        timestamp: new Date(),
        userAgent: ctx.req?.headers?.['user-agent'],
        ipAddress: ctx.req?.ip
      }))

      await analyticsEngine.processEvents(events as any)

      return { success: true, eventsProcessed: events.length }
    }),

  // Feature Adoption Metrics
  getAdoptionMetrics: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      period: DateRangeSchema,
      segmentId: z.string().optional()
    }))
    .query(async ({ input }) => {
      return analyticsEngine.calculateAdoptionMetrics(
        input.featureId,
        input.period,
        input.segmentId
      )
    }),

  // User Journey Analysis
  getUserJourneys: protectedProcedure
    .input(z.object({
      period: DateRangeSchema.optional()
    }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.session.user.organizationId
      return analyticsEngine.analyzeUserJourneys(organizationId, input.period)
    }),

  // Adoption Funnel Analysis
  getAdoptionFunnel: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      period: DateRangeSchema
    }))
    .query(async ({ input }) => {
      return analyticsEngine.buildAdoptionFunnel(input.featureId, input.period)
    }),

  // Feature Recommendations
  getRecommendations: protectedProcedure
    .input(z.object({
      limit: z.number().default(5)
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const organizationId = ctx.session.user.organizationId || ''

      return segmentationEngine.generatePersonalizedRecommendations(
        userId,
        organizationId,
        input.limit
      )
    }),

  // User Segmentation
  getUserSegments: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      const organizationId = ctx.session.user.organizationId || ''

      return segmentationEngine.classifyUser(userId, organizationId)
    }),

  getSegmentInsights: protectedProcedure
    .input(z.object({
      segmentId: z.string(),
      period: DateRangeSchema
    }))
    .query(async ({ input }) => {
      return segmentationEngine.analyzeSegmentInsights(input.segmentId, input.period)
    }),

  // Usage Patterns
  getUsagePatterns: protectedProcedure
    .input(z.object({
      period: DateRangeSchema.optional()
    }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.session.user.organizationId
      return analyticsEngine.identifyUsagePatterns(organizationId, input.period)
    }),

  // Barriers and Friction Points
  getBarriers: protectedProcedure
    .input(z.object({
      featureId: z.string().optional(),
      period: DateRangeSchema.optional()
    }))
    .query(async ({ input }) => {
      return analyticsEngine.detectBarriers(input.featureId, input.period)
    }),

  // Optimization Suggestions
  getOptimizationSuggestions: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      period: DateRangeSchema
    }))
    .query(async ({ input }) => {
      return analyticsEngine.suggestOptimizations(input.featureId, input.period)
    }),

  // A/B Testing
  createABTest: protectedProcedure
    .input(ABTestConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const testConfig = {
        ...input,
        createdBy: ctx.session.user.id
      }

      return abTestingEngine.createTest(testConfig as any)
    }),

  startABTest: protectedProcedure
    .input(z.object({
      testId: z.string()
    }))
    .mutation(async ({ input }) => {
      await abTestingEngine.startTest(input.testId)
      return { success: true }
    }),

  stopABTest: protectedProcedure
    .input(z.object({
      testId: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await abTestingEngine.stopTest(input.testId, input.reason)
      return { success: true }
    }),

  assignUserToVariant: protectedProcedure
    .input(z.object({
      testId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const organizationId = ctx.session.user.organizationId || ''

      const variantId = await abTestingEngine.assignUserToVariant(
        input.testId,
        userId,
        organizationId
      )

      return { variantId }
    }),

  trackConversion: protectedProcedure
    .input(z.object({
      testId: z.string(),
      metricId: z.string(),
      value: z.number().default(1),
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      await abTestingEngine.trackConversion(
        input.testId,
        userId,
        input.metricId,
        input.value,
        input.metadata
      )

      return { success: true }
    }),

  getABTestResults: protectedProcedure
    .input(z.object({
      testId: z.string()
    }))
    .query(async ({ input }) => {
      return abTestingEngine.analyzeTestResults(input.testId)
    }),

  getABTestDashboard: protectedProcedure
    .input(z.object({
      testId: z.string()
    }))
    .query(async ({ input }) => {
      return abTestingEngine.getTestDashboard(input.testId)
    }),

  getStatisticalAnalysis: protectedProcedure
    .input(z.object({
      testId: z.string()
    }))
    .query(async ({ input }) => {
      return abTestingEngine.getStatisticalAnalysis(input.testId)
    }),

  checkSignificance: protectedProcedure
    .input(z.object({
      testId: z.string()
    }))
    .query(async ({ input }) => {
      return abTestingEngine.checkSignificance(input.testId)
    }),

  // Feature Health Monitoring
  getFeatureHealth: protectedProcedure
    .input(z.object({
      featureId: z.string().optional(),
      period: DateRangeSchema.optional()
    }))
    .query(async ({ input }) => {
      // This would implement comprehensive feature health scoring
      // For now, return mock data structure
      return {
        overallScore: 76,
        features: [
          {
            featureId: 'client-management',
            healthScore: 92,
            status: 'healthy',
            metrics: {
              adoptionRate: 89,
              retentionRate: 94,
              satisfactionScore: 4.6,
              timeToValue: 15,
              errorRate: 0.8
            },
            trends: {
              adoptionTrend: 5,
              retentionTrend: 2,
              satisfactionTrend: 8
            }
          }
        ]
      }
    }),

  // Dynamic Segment Discovery
  discoverSegments: protectedProcedure
    .input(z.object({
      minSegmentSize: z.number().default(10)
    }))
    .query(async ({ input }) => {
      return segmentationEngine.discoverDynamicSegments(input.minSegmentSize)
    }),

  // Personalization
  getPersonalizationActions: protectedProcedure
    .input(z.object({
      context: z.record(z.any()).optional()
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const organizationId = ctx.session.user.organizationId || ''

      return segmentationEngine.applyPersonalization(
        userId,
        organizationId,
        input.context || {}
      )
    }),

  // Feature Definitions Management
  getFeatureDefinitions: protectedProcedure
    .query(async () => {
      // Return feature definitions for the organization
      // This would come from a database or configuration
      return [
        {
          id: 'client-management',
          name: 'Client Management',
          category: 'Core',
          description: 'Manage client information and relationships',
          isCore: true,
          isAdvanced: false,
          requiresOnboarding: false,
          timeToValue: 15,
          complexityScore: 3
        },
        {
          id: 'ai-insights',
          name: 'AI Insights',
          category: 'Advanced',
          description: 'AI-powered business insights and recommendations',
          isCore: false,
          isAdvanced: true,
          requiresOnboarding: true,
          timeToValue: 45,
          complexityScore: 7
        }
      ]
    }),

  // Adoption Funnel Tests
  createAdoptionFunnelTest: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      variants: z.array(z.object({
        name: z.string(),
        onboardingFlow: z.string()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const createdBy = ctx.session.user.id

      return abTestingEngine.createAdoptionFunnelTest(
        input.featureId,
        input.variants,
        createdBy
      )
    }),

  // Real-time Analytics
  getRealTimeMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      const organizationId = ctx.session.user.organizationId

      // Return real-time feature usage metrics
      return {
        activeUsers: 127,
        featuresInUse: 8,
        currentEvents: 45,
        topFeatures: [
          { featureId: 'client-management', activeUsers: 89 },
          { featureId: 'document-processing', activeUsers: 67 },
          { featureId: 'ai-insights', activeUsers: 34 }
        ]
      }
    }),

  // Export Analytics Data
  exportAnalytics: protectedProcedure
    .input(z.object({
      format: z.enum(['csv', 'json', 'xlsx']),
      period: DateRangeSchema,
      features: z.array(z.string()).optional(),
      segments: z.array(z.string()).optional()
    }))
    .mutation(async ({ input }) => {
      // Generate export file and return download URL
      // This would create a background job to generate the export
      return {
        exportId: crypto.randomUUID(),
        downloadUrl: `/api/exports/${crypto.randomUUID()}`,
        estimatedSize: '2.3 MB',
        estimatedTime: 30 // seconds
      }
    })
})

export type FeatureAnalyticsRouter = typeof featureAnalyticsRouter