/**
 * Feature Analytics Types
 * Comprehensive types for feature usage tracking and adoption analytics
 */

export interface FeatureEvent {
  id: string
  userId: string
  organizationId: string
  sessionId: string
  featureId: string
  featureName: string
  featureCategory: string
  eventType: FeatureEventType
  eventData?: Record<string, any>
  timestamp: Date
  userAgent?: string
  ipAddress?: string
  referrer?: string
  metadata?: Record<string, any>
}

export enum FeatureEventType {
  // Discovery events
  FEATURE_VIEWED = 'feature_viewed',
  FEATURE_DISCOVERED = 'feature_discovered',
  TOOLTIP_SHOWN = 'tooltip_shown',
  HELP_ACCESSED = 'help_accessed',

  // Usage events
  FEATURE_CLICKED = 'feature_clicked',
  FEATURE_STARTED = 'feature_started',
  FEATURE_COMPLETED = 'feature_completed',
  FEATURE_ABANDONED = 'feature_abandoned',

  // Engagement events
  FEATURE_USED_FIRST_TIME = 'feature_used_first_time',
  FEATURE_USED_REPEATEDLY = 'feature_used_repeatedly',
  FEATURE_MASTERED = 'feature_mastered',

  // Journey events
  ONBOARDING_STARTED = 'onboarding_started',
  ONBOARDING_COMPLETED = 'onboarding_completed',
  TUTORIAL_STARTED = 'tutorial_started',
  TUTORIAL_COMPLETED = 'tutorial_completed',

  // Success events
  VALUE_REALIZED = 'value_realized',
  GOAL_ACHIEVED = 'goal_achieved',
  WORKFLOW_COMPLETED = 'workflow_completed',

  // Friction events
  ERROR_ENCOUNTERED = 'error_encountered',
  FEATURE_SKIPPED = 'feature_skipped',
  SUPPORT_CONTACTED = 'support_contacted',
  FEEDBACK_PROVIDED = 'feedback_provided'
}

export interface FeatureDefinition {
  id: string
  name: string
  category: string
  subcategory?: string
  description: string
  userFacingName: string
  isCore: boolean
  isAdvanced: boolean
  requiresOnboarding: boolean
  timeToValue: number // estimated minutes to first value
  complexityScore: number // 1-10
  dependencies: string[] // other feature IDs
  successMetrics: string[]
  segments: UserSegment[]
  tags: string[]
  releaseDate: Date
  isDeprecated: boolean
  replacedBy?: string
}

export interface UserSegment {
  id: string
  name: string
  criteria: SegmentCriteria
  description: string
  targetFeatures: string[]
  adoptionGoals: Record<string, number>
}

export interface SegmentCriteria {
  firmSize?: 'small' | 'medium' | 'large'
  userRole?: 'admin' | 'manager' | 'staff' | 'client'
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  subscriptionTier?: 'basic' | 'professional' | 'enterprise'
  industry?: string[]
  geolocation?: string[]
  accountAge?: number // days
  usageFrequency?: 'daily' | 'weekly' | 'monthly' | 'occasional'
  featureUsage?: Record<string, number> // feature usage counts
}

export interface AdoptionFunnel {
  featureId: string
  stages: AdoptionStage[]
  conversions: Record<string, number>
  dropOffPoints: DropOffPoint[]
  timeToComplete: Record<string, number> // median time per stage
  successRate: number
}

export interface AdoptionStage {
  id: string
  name: string
  description: string
  order: number
  isRequired: boolean
  successCriteria: string[]
  helpResources: string[]
  estimatedDuration: number
}

export interface DropOffPoint {
  stageId: string
  dropOffRate: number
  commonReasons: string[]
  recommendations: string[]
  affectedSegments: string[]
}

export interface FeatureAdoptionMetrics {
  featureId: string
  period: DateRange
  adoption: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    returningUsers: number
    adoptionRate: number
    penetrationRate: number
    retentionRate: Record<string, number> // day 1, 7, 30, etc.
  }
  usage: {
    totalSessions: number
    averageSessionDuration: number
    averageActionsPerSession: number
    powerUsers: number // top 10% by usage
    casualUsers: number
    churnedUsers: number
  }
  engagement: {
    depthOfUse: number // average features used per session
    featureStickyness: number // DAU/MAU ratio
    timeToFirstValue: number
    timeToMastery: number
    satisfactionScore: number
  }
  conversion: {
    discoveryToTrial: number
    trialToUsage: number
    usageToMastery: number
    masteryToAdvocacy: number
  }
  segmentBreakdown: Record<string, FeatureAdoptionMetrics>
}

export interface UserJourney {
  userId: string
  organizationId: string
  startDate: Date
  currentStage: string
  stages: JourneyStage[]
  touchpoints: TouchPoint[]
  outcomes: Outcome[]
  barriers: Barrier[]
  satisfactionScore?: number
  npsScore?: number
}

export interface JourneyStage {
  id: string
  name: string
  enteredAt: Date
  exitedAt?: Date
  duration?: number
  actions: FeatureEvent[]
  goals: string[]
  completed: boolean
  abandoned: boolean
  abandonmentReason?: string
}

export interface TouchPoint {
  id: string
  type: 'feature' | 'help' | 'support' | 'notification' | 'tutorial'
  name: string
  timestamp: Date
  duration?: number
  outcome: 'success' | 'failure' | 'abandoned'
  sentiment?: 'positive' | 'neutral' | 'negative'
  feedback?: string
}

export interface Outcome {
  id: string
  type: 'goal_achieved' | 'value_realized' | 'task_completed' | 'problem_solved'
  description: string
  timestamp: Date
  featureIds: string[]
  impactScore: number
  businessValue?: number
}

export interface Barrier {
  id: string
  type: 'usability' | 'discoverability' | 'complexity' | 'performance' | 'integration'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedFeatures: string[]
  firstEncountered: Date
  frequency: number
  userSegments: string[]
  resolutionSuggestions: string[]
}

export interface FeatureRecommendation {
  id: string
  userId: string
  featureId: string
  type: 'discovery' | 'usage' | 'optimization' | 'workflow'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reason: string
  confidence: number
  context: string
  expectedBenefit: string
  effortRequired: 'minimal' | 'low' | 'medium' | 'high'
  dismissible: boolean
  expiresAt?: Date
  presented: boolean
  interacted: boolean
  converted: boolean
}

export interface FeatureOptimization {
  featureId: string
  type: 'discoverability' | 'usability' | 'adoption' | 'retention'
  problem: string
  solution: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  priority: number
  status: 'planned' | 'in_progress' | 'testing' | 'completed' | 'cancelled'
  metrics: {
    baseline: Record<string, number>
    target: Record<string, number>
    current: Record<string, number>
  }
  testResults?: ABTestResult[]
}

export interface ABTestResult {
  testId: string
  featureId: string
  variant: string
  users: number
  conversions: number
  conversionRate: number
  significance: number
  winner: boolean
  startDate: Date
  endDate?: Date
}

export interface DateRange {
  start: Date
  end: Date
}

export interface FeatureFlag {
  id: string
  name: string
  description: string
  isEnabled: boolean
  rolloutPercentage: number
  targetSegments: string[]
  conditions: Record<string, any>
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

export interface OnboardingFlow {
  id: string
  name: string
  description: string
  targetSegments: string[]
  steps: OnboardingStep[]
  completionRate: number
  averageDuration: number
  dropOffPoints: string[]
  isActive: boolean
}

export interface OnboardingStep {
  id: string
  name: string
  description: string
  type: 'tutorial' | 'tooltip' | 'modal' | 'highlight' | 'checklist'
  targetFeature: string
  order: number
  isRequired: boolean
  completionCriteria: string[]
  helpText: string
  skipAllowed: boolean
}

export interface FeatureFeedback {
  id: string
  userId: string
  featureId: string
  rating: number // 1-5
  comment?: string
  type: 'bug' | 'improvement' | 'praise' | 'confusion'
  sentiment: 'positive' | 'neutral' | 'negative'
  tags: string[]
  status: 'new' | 'reviewed' | 'planned' | 'implemented' | 'dismissed'
  createdAt: Date
  upvotes: number
}

export interface FeatureUsagePattern {
  pattern: string
  description: string
  frequency: number
  userSegments: string[]
  features: string[]
  outcomes: string[]
  optimizationOpportunities: string[]
}

export interface CapabilityMapping {
  capability: string
  features: string[]
  userGoals: string[]
  businessMetrics: string[]
  adoptionPath: string[]
  alternativeApproaches: string[]
}