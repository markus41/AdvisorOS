/**
 * Feature Usage Tracker
 * Core tracking system for capturing feature usage events and user interactions
 */

import { nanoid } from 'nanoid'
import { FeatureEvent, FeatureEventType, FeatureDefinition } from './types'

interface TrackerConfig {
  apiEndpoint: string
  batchSize: number
  flushInterval: number
  enableDebug: boolean
  enableLocalStorage: boolean
  enableRealtime: boolean
}

export class FeatureUsageTracker {
  private config: TrackerConfig
  private eventQueue: FeatureEvent[] = []
  private sessionId: string
  private userId?: string
  private organizationId?: string
  private features: Map<string, FeatureDefinition> = new Map()
  private timers: Map<string, number> = new Map()
  private lastActivity: number = Date.now()
  private isInitialized = false

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/analytics/features',
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      enableDebug: false,
      enableLocalStorage: true,
      enableRealtime: true,
      ...config
    }

    this.sessionId = nanoid()
    this.setupEventListeners()
    this.startPeriodicFlush()
  }

  /**
   * Initialize the tracker with user context
   */
  async initialize(userId: string, organizationId: string): Promise<void> {
    this.userId = userId
    this.organizationId = organizationId
    this.isInitialized = true

    // Load feature definitions
    await this.loadFeatureDefinitions()

    // Track session start
    this.track('session_started', 'core', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    })

    if (this.config.enableDebug) {
      console.log('FeatureUsageTracker initialized', { userId, organizationId, sessionId: this.sessionId })
    }
  }

  /**
   * Track a feature event
   */
  track(
    featureId: string,
    eventType: FeatureEventType | string,
    eventData?: Record<string, any>
  ): void {
    if (!this.isInitialized && eventType !== 'session_started') {
      console.warn('FeatureUsageTracker not initialized')
      return
    }

    const feature = this.features.get(featureId)
    const event: FeatureEvent = {
      id: nanoid(),
      userId: this.userId!,
      organizationId: this.organizationId!,
      sessionId: this.sessionId,
      featureId,
      featureName: feature?.name || featureId,
      featureCategory: feature?.category || 'unknown',
      eventType: eventType as FeatureEventType,
      eventData,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    }

    this.eventQueue.push(event)
    this.lastActivity = Date.now()

    // Handle special event types
    this.handleSpecialEvents(event)

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush()
    }

    // Send realtime for critical events
    if (this.config.enableRealtime && this.isCriticalEvent(eventType)) {
      this.sendRealtime(event)
    }

    if (this.config.enableDebug) {
      console.log('Feature event tracked:', event)
    }
  }

  /**
   * Track feature discovery
   */
  trackDiscovery(featureId: string, discoveryMethod: string, context?: Record<string, any>): void {
    this.track(featureId, FeatureEventType.FEATURE_DISCOVERED, {
      discoveryMethod,
      context
    })
  }

  /**
   * Track feature first use
   */
  trackFirstUse(featureId: string, context?: Record<string, any>): void {
    const storageKey = `feature_first_use_${this.userId}_${featureId}`

    if (!localStorage.getItem(storageKey)) {
      this.track(featureId, FeatureEventType.FEATURE_USED_FIRST_TIME, context)
      localStorage.setItem(storageKey, Date.now().toString())
    }
  }

  /**
   * Track feature completion
   */
  trackCompletion(featureId: string, outcome: string, value?: number, context?: Record<string, any>): void {
    this.track(featureId, FeatureEventType.FEATURE_COMPLETED, {
      outcome,
      value,
      context
    })

    // Check if this qualifies as value realization
    const feature = this.features.get(featureId)
    if (feature?.isCore && value && value > 0) {
      this.track(featureId, FeatureEventType.VALUE_REALIZED, {
        value,
        outcome,
        context
      })
    }
  }

  /**
   * Track feature abandonment
   */
  trackAbandonment(featureId: string, reason?: string, stage?: string, context?: Record<string, any>): void {
    this.track(featureId, FeatureEventType.FEATURE_ABANDONED, {
      reason,
      stage,
      context
    })
  }

  /**
   * Track user journey milestone
   */
  trackJourneyMilestone(milestone: string, features: string[], context?: Record<string, any>): void {
    this.track('journey', FeatureEventType.GOAL_ACHIEVED, {
      milestone,
      features,
      context
    })
  }

  /**
   * Track onboarding progress
   */
  trackOnboarding(step: string, action: 'started' | 'completed' | 'skipped', context?: Record<string, any>): void {
    const eventType = action === 'started' ? FeatureEventType.ONBOARDING_STARTED :
                     action === 'completed' ? FeatureEventType.ONBOARDING_COMPLETED :
                     FeatureEventType.FEATURE_SKIPPED

    this.track('onboarding', eventType, {
      step,
      action,
      context
    })
  }

  /**
   * Track error encounters
   */
  trackError(featureId: string, error: Error | string, context?: Record<string, any>): void {
    this.track(featureId, FeatureEventType.ERROR_ENCOUNTERED, {
      error: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      context
    })
  }

  /**
   * Track feedback submission
   */
  trackFeedback(featureId: string, rating: number, comment?: string, type?: string): void {
    this.track(featureId, FeatureEventType.FEEDBACK_PROVIDED, {
      rating,
      comment,
      type
    })
  }

  /**
   * Start timing a feature interaction
   */
  startTiming(featureId: string): void {
    this.timers.set(featureId, Date.now())
  }

  /**
   * End timing and track duration
   */
  endTiming(featureId: string, eventType: FeatureEventType = FeatureEventType.FEATURE_COMPLETED): number {
    const startTime = this.timers.get(featureId)
    if (!startTime) return 0

    const duration = Date.now() - startTime
    this.timers.delete(featureId)

    this.track(featureId, eventType, { duration })
    return duration
  }

  /**
   * Track page/view changes
   */
  trackPageView(page: string, features: string[] = []): void {
    this.track('navigation', FeatureEventType.FEATURE_VIEWED, {
      page,
      features,
      referrer: document.referrer
    })

    // Track feature exposure
    features.forEach(featureId => {
      this.track(featureId, FeatureEventType.FEATURE_VIEWED, { page })
    })
  }

  /**
   * Track tooltip/help interactions
   */
  trackHelpInteraction(featureId: string, helpType: string, action: string): void {
    const eventType = helpType === 'tooltip' ? FeatureEventType.TOOLTIP_SHOWN : FeatureEventType.HELP_ACCESSED

    this.track(featureId, eventType, {
      helpType,
      action
    })
  }

  /**
   * Get current session info
   */
  getSessionInfo(): { sessionId: string; userId?: string; organizationId?: string; duration: number } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      organizationId: this.organizationId,
      duration: Date.now() - (this.lastActivity - 30000) // rough estimate
    }
  }

  /**
   * Manually flush events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (this.config.enableDebug) {
        console.log(`Flushed ${events.length} feature events`)
      }
    } catch (error) {
      console.error('Failed to flush feature events:', error)

      // Put events back in queue for retry
      this.eventQueue.unshift(...events)

      // Store in localStorage as backup
      if (this.config.enableLocalStorage) {
        this.storeEventsLocally(events)
      }
    }
  }

  /**
   * Set up automatic event listeners
   */
  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush()
      }
    })

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })

    // Track user inactivity
    let inactivityTimer: NodeJS.Timeout
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        this.track('session', 'user_inactive', { duration: 300000 }) // 5 minutes
      }, 300000)
    }

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true)
    })
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush()
      }
    }, this.config.flushInterval)
  }

  /**
   * Handle special event types
   */
  private handleSpecialEvents(event: FeatureEvent): void {
    // Track repeated usage
    if (event.eventType === FeatureEventType.FEATURE_COMPLETED) {
      const usageKey = `feature_usage_${this.userId}_${event.featureId}`
      const currentCount = parseInt(localStorage.getItem(usageKey) || '0') + 1
      localStorage.setItem(usageKey, currentCount.toString())

      // Track as repeated usage after 3rd use
      if (currentCount >= 3 && currentCount % 5 === 0) {
        this.track(event.featureId, FeatureEventType.FEATURE_USED_REPEATEDLY, {
          usageCount: currentCount
        })
      }

      // Track mastery after significant usage
      if (currentCount >= 20) {
        this.track(event.featureId, FeatureEventType.FEATURE_MASTERED, {
          usageCount: currentCount
        })
      }
    }
  }

  /**
   * Check if event should be sent in realtime
   */
  private isCriticalEvent(eventType: string): boolean {
    return [
      FeatureEventType.ERROR_ENCOUNTERED,
      FeatureEventType.FEATURE_ABANDONED,
      FeatureEventType.SUPPORT_CONTACTED,
      FeatureEventType.VALUE_REALIZED
    ].includes(eventType as FeatureEventType)
  }

  /**
   * Send event in realtime
   */
  private async sendRealtime(event: FeatureEvent): Promise<void> {
    try {
      await fetch(`${this.config.apiEndpoint}/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      })
    } catch (error) {
      console.error('Failed to send realtime event:', error)
    }
  }

  /**
   * Store events locally as backup
   */
  private storeEventsLocally(events: FeatureEvent[]): void {
    try {
      const stored = JSON.parse(localStorage.getItem('feature_events_backup') || '[]')
      stored.push(...events)

      // Keep only last 1000 events
      if (stored.length > 1000) {
        stored.splice(0, stored.length - 1000)
      }

      localStorage.setItem('feature_events_backup', JSON.stringify(stored))
    } catch (error) {
      console.error('Failed to store events locally:', error)
    }
  }

  /**
   * Load feature definitions
   */
  private async loadFeatureDefinitions(): Promise<void> {
    try {
      const response = await fetch('/api/analytics/features/definitions')
      const definitions: FeatureDefinition[] = await response.json()

      definitions.forEach(def => {
        this.features.set(def.id, def)
      })
    } catch (error) {
      console.error('Failed to load feature definitions:', error)
    }
  }
}

// Global tracker instance
let tracker: FeatureUsageTracker | null = null

/**
 * Get or create global tracker instance
 */
export function getTracker(): FeatureUsageTracker {
  if (!tracker) {
    tracker = new FeatureUsageTracker()
  }
  return tracker
}

/**
 * Initialize tracking with user context
 */
export async function initializeTracking(userId: string, organizationId: string): Promise<void> {
  const trackerInstance = getTracker()
  await trackerInstance.initialize(userId, organizationId)
}

/**
 * Convenience function to track events
 */
export function trackFeature(
  featureId: string,
  eventType: FeatureEventType | string,
  eventData?: Record<string, any>
): void {
  getTracker().track(featureId, eventType, eventData)
}

/**
 * React hook for feature tracking
 */
export function useFeatureTracking(featureId: string) {
  const trackerInstance = getTracker()

  return {
    trackView: (context?: Record<string, any>) =>
      trackerInstance.track(featureId, FeatureEventType.FEATURE_VIEWED, context),

    trackClick: (context?: Record<string, any>) =>
      trackerInstance.track(featureId, FeatureEventType.FEATURE_CLICKED, context),

    trackStart: (context?: Record<string, any>) => {
      trackerInstance.track(featureId, FeatureEventType.FEATURE_STARTED, context)
      trackerInstance.startTiming(featureId)
    },

    trackComplete: (outcome?: string, value?: number, context?: Record<string, any>) => {
      trackerInstance.endTiming(featureId)
      trackerInstance.trackCompletion(featureId, outcome || 'success', value, context)
    },

    trackAbandon: (reason?: string, stage?: string, context?: Record<string, any>) => {
      trackerInstance.endTiming(featureId, FeatureEventType.FEATURE_ABANDONED)
      trackerInstance.trackAbandonment(featureId, reason, stage, context)
    },

    trackError: (error: Error | string, context?: Record<string, any>) =>
      trackerInstance.trackError(featureId, error, context),

    trackFirstUse: (context?: Record<string, any>) =>
      trackerInstance.trackFirstUse(featureId, context)
  }
}