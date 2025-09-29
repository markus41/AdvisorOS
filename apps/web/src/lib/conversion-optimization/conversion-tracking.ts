/**
 * Comprehensive Conversion Tracking System
 *
 * This system tracks user interactions, conversion events, and provides
 * detailed analytics for optimizing the marketing funnel.
 */

export interface ConversionEvent {
  id: string
  name: string
  category: 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral'
  value?: number
  properties?: Record<string, any>
  timestamp: string
  userId?: string
  sessionId: string
  page: string
  source?: string
  medium?: string
  campaign?: string
  abTestVariant?: string
}

export interface ConversionFunnel {
  id: string
  name: string
  steps: ConversionStep[]
  conversionGoal: string
}

export interface ConversionStep {
  id: string
  name: string
  event: string
  isRequired: boolean
  timeLimit?: number // in minutes
}

export interface UserSession {
  id: string
  userId?: string
  startTime: string
  endTime?: string
  pageViews: PageView[]
  events: ConversionEvent[]
  source?: string
  medium?: string
  campaign?: string
  device: 'desktop' | 'mobile' | 'tablet'
  location?: {
    country: string
    region: string
    city: string
  }
}

export interface PageView {
  id: string
  url: string
  title: string
  timestamp: string
  timeOnPage?: number
  scrollDepth?: number
  exitPage?: boolean
}

// Define conversion funnels
export const conversionFunnels: ConversionFunnel[] = [
  {
    id: 'trial-signup-funnel',
    name: 'Free Trial Signup Funnel',
    conversionGoal: 'trial_signup_complete',
    steps: [
      {
        id: 'landing-page-view',
        name: 'Landing Page View',
        event: 'page_view',
        isRequired: true
      },
      {
        id: 'cta-click',
        name: 'CTA Button Click',
        event: 'cta_click',
        isRequired: true,
        timeLimit: 30
      },
      {
        id: 'trial-form-start',
        name: 'Trial Form Started',
        event: 'form_start',
        isRequired: true,
        timeLimit: 10
      },
      {
        id: 'trial-form-complete',
        name: 'Trial Form Completed',
        event: 'trial_signup_complete',
        isRequired: true,
        timeLimit: 15
      }
    ]
  },
  {
    id: 'demo-request-funnel',
    name: 'Demo Request Funnel',
    conversionGoal: 'demo_request_complete',
    steps: [
      {
        id: 'demo-cta-click',
        name: 'Demo CTA Click',
        event: 'demo_cta_click',
        isRequired: true
      },
      {
        id: 'demo-form-start',
        name: 'Demo Form Started',
        event: 'demo_form_start',
        isRequired: true,
        timeLimit: 5
      },
      {
        id: 'demo-form-complete',
        name: 'Demo Form Completed',
        event: 'demo_request_complete',
        isRequired: true,
        timeLimit: 10
      }
    ]
  },
  {
    id: 'content-engagement-funnel',
    name: 'Content Engagement to Lead',
    conversionGoal: 'lead_magnet_download',
    steps: [
      {
        id: 'blog-view',
        name: 'Blog Post View',
        event: 'blog_post_view',
        isRequired: true
      },
      {
        id: 'content-engagement',
        name: 'Content Engagement',
        event: 'content_scroll_75',
        isRequired: true,
        timeLimit: 30
      },
      {
        id: 'lead-magnet-click',
        name: 'Lead Magnet CTA Click',
        event: 'lead_magnet_cta_click',
        isRequired: true,
        timeLimit: 60
      },
      {
        id: 'lead-form-complete',
        name: 'Lead Form Completed',
        event: 'lead_magnet_download',
        isRequired: true,
        timeLimit: 10
      }
    ]
  }
]

// Conversion tracking class
export class ConversionTracker {
  private events: ConversionEvent[] = []
  private sessions: Map<string, UserSession> = new Map()
  private currentSessionId: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSession()
      this.setupPageTracking()
      this.setupScrollTracking()
      this.setupFormTracking()
    }
  }

  /**
   * Track a conversion event
   */
  track(eventName: string, properties?: Record<string, any>, value?: number): void {
    const event: ConversionEvent = {
      id: this.generateId(),
      name: eventName,
      category: this.getEventCategory(eventName),
      value,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId || '',
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userId: this.getUserId(),
      source: this.getSource(),
      medium: this.getMedium(),
      campaign: this.getCampaign()
    }

    this.events.push(event)

    // Add to current session
    const session = this.getCurrentSession()
    if (session) {
      session.events.push(event)
    }

    // Send to analytics services
    this.sendToAnalytics(event)

    // Check funnel progression
    this.checkFunnelProgression(event)

    // Store in localStorage for persistence
    this.persistEvent(event)
  }

  /**
   * Track page view
   */
  trackPageView(url?: string, title?: string): void {
    const pageView: PageView = {
      id: this.generateId(),
      url: url || (typeof window !== 'undefined' ? window.location.href : ''),
      title: title || (typeof window !== 'undefined' ? document.title : ''),
      timestamp: new Date().toISOString()
    }

    const session = this.getCurrentSession()
    if (session) {
      session.pageViews.push(pageView)
    }

    this.track('page_view', {
      url: pageView.url,
      title: pageView.title
    })
  }

  /**
   * Track form interactions
   */
  trackFormStart(formId: string, formType: string): void {
    this.track('form_start', {
      formId,
      formType,
      url: typeof window !== 'undefined' ? window.location.href : ''
    })
  }

  trackFormSubmit(formId: string, formType: string, success: boolean): void {
    this.track(success ? 'form_submit_success' : 'form_submit_error', {
      formId,
      formType,
      success
    })
  }

  /**
   * Track CTA clicks
   */
  trackCTAClick(ctaText: string, ctaLocation: string, destination: string): void {
    this.track('cta_click', {
      ctaText,
      ctaLocation,
      destination
    })
  }

  /**
   * Track trial signup completion
   */
  trackTrialSignup(planId: string, planName: string, billingCycle: string): void {
    this.track('trial_signup_complete', {
      planId,
      planName,
      billingCycle
    }, this.getPlanValue(planId, billingCycle))
  }

  /**
   * Track demo request
   */
  trackDemoRequest(formData: Record<string, any>): void {
    this.track('demo_request_complete', {
      ...formData,
      leadScore: this.calculateLeadScore(formData)
    })
  }

  /**
   * Get conversion funnel analysis
   */
  getFunnelAnalysis(funnelId: string): any {
    const funnel = conversionFunnels.find(f => f.id === funnelId)
    if (!funnel) return null

    const sessions = Array.from(this.sessions.values())
    const funnelSessions = sessions.filter(session =>
      session.events.some(event =>
        funnel.steps.some(step => step.event === event.name)
      )
    )

    const stepAnalysis = funnel.steps.map(step => {
      const sessionsReachingStep = funnelSessions.filter(session =>
        session.events.some(event => event.name === step.event)
      ).length

      return {
        stepId: step.id,
        stepName: step.name,
        sessions: sessionsReachingStep,
        conversionRate: funnelSessions.length > 0 ?
          (sessionsReachingStep / funnelSessions.length) * 100 : 0
      }
    })

    return {
      funnelId,
      totalSessions: funnelSessions.length,
      steps: stepAnalysis,
      overallConversionRate: funnelSessions.length > 0 ?
        (stepAnalysis[stepAnalysis.length - 1]?.sessions || 0) / funnelSessions.length * 100 : 0
    }
  }

  private initializeSession(): void {
    const sessionId = this.generateSessionId()
    this.currentSessionId = sessionId

    const session: UserSession = {
      id: sessionId,
      userId: this.getUserId(),
      startTime: new Date().toISOString(),
      pageViews: [],
      events: [],
      source: this.getSource(),
      medium: this.getMedium(),
      campaign: this.getCampaign(),
      device: this.getDeviceType()
    }

    this.sessions.set(sessionId, session)
  }

  private setupPageTracking(): void {
    // Track page unload to calculate time on page
    window.addEventListener('beforeunload', () => {
      this.track('page_unload')
    })

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden')
      } else {
        this.track('page_visible')
      }
    })
  }

  private setupScrollTracking(): void {
    let maxScrollDepth = 0
    const milestones = [25, 50, 75, 90]
    const trackedMilestones = new Set<number>()

    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)

      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent

        milestones.forEach(milestone => {
          if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
            trackedMilestones.add(milestone)
            this.track(`scroll_${milestone}`, { scrollDepth: milestone })
          }
        })
      }
    }

    let ticking = false
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          trackScroll()
          ticking = false
        })
        ticking = true
      }
    })
  }

  private setupFormTracking(): void {
    // Auto-track form starts and submissions
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      if (target.closest('form')) {
        const form = target.closest('form')!
        const formId = form.id || 'unnamed-form'
        const formType = form.dataset.formType || 'unknown'

        if (!form.dataset.tracked) {
          form.dataset.tracked = 'true'
          this.trackFormStart(formId, formType)
        }
      }
    })

    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      const formId = form.id || 'unnamed-form'
      const formType = form.dataset.formType || 'unknown'

      this.trackFormSubmit(formId, formType, true)
    })
  }

  private sendToAnalytics(event: ConversionEvent): void {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, {
        event_category: event.category,
        event_label: event.properties?.label,
        value: event.value,
        custom_parameter_session_id: event.sessionId,
        custom_parameter_user_id: event.userId
      })
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', this.mapToFacebookEvent(event.name), {
        value: event.value,
        currency: 'USD'
      })
    }

    // LinkedIn Insight Tag
    if (typeof window !== 'undefined' && (window as any).lintrk) {
      (window as any).lintrk('track', { conversion_id: this.getLinkedInConversionId(event.name) })
    }

    // Send to your own analytics API
    this.sendToCustomAnalytics(event)
  }

  private sendToCustomAnalytics(event: ConversionEvent): void {
    // Send to your backend analytics service
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }).catch(error => {
        console.warn('Failed to send analytics event:', error)
      })
    }
  }

  private getEventCategory(eventName: string): ConversionEvent['category'] {
    if (eventName.includes('page_view') || eventName.includes('visit')) return 'acquisition'
    if (eventName.includes('signup') || eventName.includes('trial')) return 'activation'
    if (eventName.includes('login') || eventName.includes('return')) return 'retention'
    if (eventName.includes('purchase') || eventName.includes('upgrade')) return 'revenue'
    if (eventName.includes('share') || eventName.includes('refer')) return 'referral'
    return 'activation'
  }

  private checkFunnelProgression(event: ConversionEvent): void {
    conversionFunnels.forEach(funnel => {
      const currentStep = funnel.steps.find(step => step.event === event.name)
      if (currentStep) {
        // Track funnel step completion
        this.track('funnel_step_complete', {
          funnelId: funnel.id,
          stepId: currentStep.id,
          stepName: currentStep.name
        })
      }
    })
  }

  private calculateLeadScore(formData: Record<string, any>): number {
    let score = 0

    // Company size scoring
    const employees = formData.employees || formData.company_size
    if (employees >= 50) score += 30
    else if (employees >= 10) score += 20
    else if (employees >= 5) score += 10

    // Industry scoring
    if (formData.industry === 'accounting' || formData.industry === 'cpa') score += 25

    // Job title scoring
    const title = (formData.job_title || formData.title || '').toLowerCase()
    if (title.includes('partner') || title.includes('owner')) score += 25
    else if (title.includes('manager') || title.includes('director')) score += 15
    else if (title.includes('cpa') || title.includes('accountant')) score += 10

    // Urgency scoring
    if (formData.timeline === 'immediate' || formData.timeline === '1-3-months') score += 20
    else if (formData.timeline === '3-6-months') score += 10

    return Math.min(score, 100)
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private generateSessionId(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined

    return localStorage.getItem('user_id') ||
           sessionStorage.getItem('user_id') ||
           undefined
  }

  private getCurrentSession(): UserSession | undefined {
    return this.currentSessionId ? this.sessions.get(this.currentSessionId) : undefined
  }

  private getSource(): string | undefined {
    if (typeof window === 'undefined') return undefined

    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('utm_source') ||
           urlParams.get('source') ||
           document.referrer ? new URL(document.referrer).hostname : undefined
  }

  private getMedium(): string | undefined {
    if (typeof window === 'undefined') return undefined

    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('utm_medium') || urlParams.get('medium') || undefined
  }

  private getCampaign(): string | undefined {
    if (typeof window === 'undefined') return undefined

    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('utm_campaign') || urlParams.get('campaign') || undefined
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop'

    const width = window.innerWidth
    if (width <= 768) return 'mobile'
    if (width <= 1024) return 'tablet'
    return 'desktop'
  }

  private getPlanValue(planId: string, billingCycle: string): number {
    const planValues: Record<string, { monthly: number; annual: number }> = {
      starter: { monthly: 89, annual: 890 },
      professional: { monthly: 189, annual: 1890 },
      enterprise: { monthly: 389, annual: 3890 }
    }

    return planValues[planId]?.[billingCycle as 'monthly' | 'annual'] || 0
  }

  private mapToFacebookEvent(eventName: string): string {
    const mapping: Record<string, string> = {
      trial_signup_complete: 'StartTrial',
      demo_request_complete: 'SubmitApplication',
      form_submit_success: 'Contact',
      cta_click: 'InitiateCheckout'
    }
    return mapping[eventName] || 'CustomEvent'
  }

  private getLinkedInConversionId(eventName: string): number {
    const mapping: Record<string, number> = {
      trial_signup_complete: 12345,
      demo_request_complete: 12346,
      form_submit_success: 12347
    }
    return mapping[eventName] || 12348
  }

  private persistEvent(event: ConversionEvent): void {
    if (typeof window === 'undefined') return

    try {
      const storedEvents = JSON.parse(localStorage.getItem('conversion_events') || '[]')
      storedEvents.push(event)

      // Keep only last 100 events to prevent localStorage bloat
      if (storedEvents.length > 100) {
        storedEvents.splice(0, storedEvents.length - 100)
      }

      localStorage.setItem('conversion_events', JSON.stringify(storedEvents))
    } catch (error) {
      console.warn('Failed to persist conversion event:', error)
    }
  }
}

// Singleton instance
export const conversionTracker = new ConversionTracker()

// React hook for conversion tracking
export function useConversionTracking() {
  const track = (eventName: string, properties?: Record<string, any>, value?: number) => {
    conversionTracker.track(eventName, properties, value)
  }

  const trackPageView = (url?: string, title?: string) => {
    conversionTracker.trackPageView(url, title)
  }

  const trackCTAClick = (ctaText: string, ctaLocation: string, destination: string) => {
    conversionTracker.trackCTAClick(ctaText, ctaLocation, destination)
  }

  const trackFormStart = (formId: string, formType: string) => {
    conversionTracker.trackFormStart(formId, formType)
  }

  const trackFormSubmit = (formId: string, formType: string, success: boolean) => {
    conversionTracker.trackFormSubmit(formId, formType, success)
  }

  return {
    track,
    trackPageView,
    trackCTAClick,
    trackFormStart,
    trackFormSubmit
  }
}