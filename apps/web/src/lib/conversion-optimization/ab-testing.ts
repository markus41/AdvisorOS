/**
 * A/B Testing Framework for Conversion Optimization
 *
 * This framework enables systematic testing of different page elements
 * to optimize conversion rates across the marketing funnel.
 */

export interface ABTestVariant {
  id: string
  name: string
  weight: number // 0-100, percentage of traffic
  content: {
    headline?: string
    subheadline?: string
    ctaPrimary?: string
    ctaSecondary?: string
    heroImage?: string
    valueProps?: string[]
    socialProof?: string
    urgencyText?: string
    riskReversal?: string
  }
  metadata?: {
    hypothesis: string
    expectedLift: number
    startDate: string
    endDate?: string
    status: 'draft' | 'active' | 'paused' | 'completed'
  }
}

export interface ABTest {
  id: string
  name: string
  description: string
  page: string
  variants: ABTestVariant[]
  conversionGoals: {
    primary: string // e.g., 'trial_signup', 'demo_request'
    secondary?: string[]
  }
  trafficAllocation: number // 0-100, percentage of total traffic
  status: 'draft' | 'active' | 'paused' | 'completed'
  startDate: string
  endDate?: string
  results?: {
    variantId: string
    conversions: number
    visitors: number
    conversionRate: number
    confidenceLevel: number
    isWinner: boolean
  }[]
}

// Homepage Hero Section Tests
export const heroSectionTests: ABTest[] = [
  {
    id: 'hero-headline-test-001',
    name: 'Homepage Hero Headline Optimization',
    description: 'Testing benefit-focused vs feature-focused headlines',
    page: '/',
    trafficAllocation: 100,
    status: 'active',
    startDate: '2024-01-15',
    conversionGoals: {
      primary: 'trial_signup',
      secondary: ['demo_request', 'pricing_page_view']
    },
    variants: [
      {
        id: 'control',
        name: 'Current Headline (Control)',
        weight: 34,
        content: {
          headline: 'The Complete Advisory Platform for Modern CPA Firms',
          subheadline: 'Trusted by 500+ CPA Firms',
          ctaPrimary: 'Start Free Trial',
          ctaSecondary: 'Request Demo'
        },
        metadata: {
          hypothesis: 'Current headline focuses on completeness',
          expectedLift: 0,
          startDate: '2024-01-15',
          status: 'active'
        }
      },
      {
        id: 'benefit-focused',
        name: 'Benefit-Focused Headline',
        weight: 33,
        content: {
          headline: 'Reduce Administrative Work by 75% and Grow Your CPA Practice',
          subheadline: 'Join 500+ firms saving 20+ hours per week',
          ctaPrimary: 'Start Saving Time Today',
          ctaSecondary: 'See How It Works',
          urgencyText: '14-day free trial • No credit card required • Setup in 15 minutes'
        },
        metadata: {
          hypothesis: 'Benefit-focused headline will increase conversion by highlighting time savings',
          expectedLift: 15,
          startDate: '2024-01-15',
          status: 'active'
        }
      },
      {
        id: 'problem-solution',
        name: 'Problem-Solution Headline',
        weight: 33,
        content: {
          headline: 'Stop Drowning in Paperwork. Start Growing Your CPA Practice.',
          subheadline: 'The practice management platform that eliminates busywork',
          ctaPrimary: 'Eliminate Busywork Now',
          ctaSecondary: 'Watch Demo',
          socialProof: 'Used by 500+ CPA firms to automate their practice',
          riskReversal: '14-day free trial • Cancel anytime • No setup fees'
        },
        metadata: {
          hypothesis: 'Problem-agitation-solution approach will resonate with pain points',
          expectedLift: 22,
          startDate: '2024-01-15',
          status: 'active'
        }
      }
    ]
  }
]

// CTA Button Tests
export const ctaButtonTests: ABTest[] = [
  {
    id: 'cta-optimization-001',
    name: 'Primary CTA Button Optimization',
    description: 'Testing different CTA button texts and urgency levels',
    page: '/',
    trafficAllocation: 50,
    status: 'active',
    startDate: '2024-01-15',
    conversionGoals: {
      primary: 'trial_signup'
    },
    variants: [
      {
        id: 'control-cta',
        name: 'Generic CTA (Control)',
        weight: 25,
        content: {
          ctaPrimary: 'Start Free Trial'
        }
      },
      {
        id: 'value-cta',
        name: 'Value-Based CTA',
        weight: 25,
        content: {
          ctaPrimary: 'Save 20 Hours Per Week'
        }
      },
      {
        id: 'urgency-cta',
        name: 'Urgency-Based CTA',
        weight: 25,
        content: {
          ctaPrimary: 'Start Saving Time Today'
        }
      },
      {
        id: 'risk-free-cta',
        name: 'Risk-Free CTA',
        weight: 25,
        content: {
          ctaPrimary: 'Try Risk-Free for 14 Days'
        }
      }
    ]
  }
]

// Pricing Page Tests
export const pricingPageTests: ABTest[] = [
  {
    id: 'pricing-psychology-001',
    name: 'Pricing Psychology Optimization',
    description: 'Testing different pricing presentation strategies',
    page: '/pricing',
    trafficAllocation: 100,
    status: 'active',
    startDate: '2024-01-15',
    conversionGoals: {
      primary: 'plan_selection',
      secondary: ['trial_signup', 'contact_sales']
    },
    variants: [
      {
        id: 'current-pricing',
        name: 'Current Pricing Layout',
        weight: 50,
        content: {}
      },
      {
        id: 'anchored-pricing',
        name: 'Anchored Pricing with Decoy',
        weight: 50,
        content: {
          // This would modify pricing display to use anchoring effect
          // with a higher-priced "Premium" plan to make Professional look better
        }
      }
    ]
  }
]

// A/B Test Manager Class
export class ABTestManager {
  private tests: Map<string, ABTest> = new Map()
  private userAssignments: Map<string, Map<string, string>> = new Map()

  constructor() {
    // Initialize with predefined tests
    [...heroSectionTests, ...ctaButtonTests, ...pricingPageTests].forEach(test => {
      this.tests.set(test.id, test)
    })
  }

  /**
   * Get the variant for a user on a specific test
   */
  getVariant(testId: string, userId: string): ABTestVariant | null {
    const test = this.tests.get(testId)
    if (!test || test.status !== 'active') {
      return null
    }

    // Check if user already assigned
    const userTests = this.userAssignments.get(userId)
    if (userTests?.has(testId)) {
      const variantId = userTests.get(testId)!
      return test.variants.find(v => v.id === variantId) || null
    }

    // Assign user to variant based on weights
    const variant = this.assignUserToVariant(test, userId)

    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map())
    }
    this.userAssignments.get(userId)!.set(testId, variant.id)

    return variant
  }

  /**
   * Track a conversion event
   */
  trackConversion(testId: string, userId: string, goal: string): void {
    const test = this.tests.get(testId)
    const userTests = this.userAssignments.get(userId)

    if (!test || !userTests?.has(testId)) {
      return
    }

    const variantId = userTests.get(testId)!

    // In a real implementation, this would send data to analytics
    console.log(`Conversion tracked: ${testId} - ${variantId} - ${goal}`)

    // Send to analytics service
    this.sendToAnalytics({
      event: 'ab_test_conversion',
      testId,
      variantId,
      userId,
      goal,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get active tests for a page
   */
  getActiveTestsForPage(page: string): ABTest[] {
    return Array.from(this.tests.values()).filter(
      test => test.page === page && test.status === 'active'
    )
  }

  private assignUserToVariant(test: ABTest, userId: string): ABTestVariant {
    // Simple hash-based assignment for consistent user experience
    const hash = this.hashString(userId + test.id)
    const random = (hash % 100) + 1

    let cumulative = 0
    for (const variant of test.variants) {
      cumulative += variant.weight
      if (random <= cumulative) {
        return variant
      }
    }

    // Fallback to first variant
    return test.variants[0]
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private sendToAnalytics(data: any): void {
    // In production, send to your analytics service
    // This could be Google Analytics, Mixpanel, Segment, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ab_test_conversion', {
        custom_parameter_1: data.testId,
        custom_parameter_2: data.variantId,
        custom_parameter_3: data.goal
      })
    }
  }
}

// Singleton instance
export const abTestManager = new ABTestManager()

// React hook for using A/B tests
export function useABTest(testId: string) {
  // This would typically use React state and effects
  // For now, providing the interface structure

  const getUserId = () => {
    // Get user ID from session, cookie, or generate anonymous ID
    if (typeof window !== 'undefined') {
      let userId = localStorage.getItem('ab_test_user_id')
      if (!userId) {
        userId = 'anon_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('ab_test_user_id', userId)
      }
      return userId
    }
    return 'server_render'
  }

  const userId = getUserId()
  const variant = abTestManager.getVariant(testId, userId)

  const trackConversion = (goal: string) => {
    abTestManager.trackConversion(testId, userId, goal)
  }

  return {
    variant,
    trackConversion,
    isInTest: variant !== null
  }
}

// Utility functions for common A/B test scenarios
export const ABTestUtils = {
  // Create urgency text variations
  urgencyVariations: [
    "Limited time: Save 30% on annual plans",
    "Join 500+ firms who switched this month",
    "Only 3 days left in our Q1 promotion",
    "Start your free trial before prices increase",
    "Last chance: Free setup (normally $299)"
  ],

  // Social proof variations
  socialProofVariations: [
    "Trusted by 500+ CPA firms nationwide",
    "Used by firms like Chen & Associates and Walsh Financial",
    "Join the 500+ firms saving 20+ hours per week",
    "Rated #1 CPA software by Accounting Today",
    "Featured in CPA Practice Advisor as 'Top Innovation'"
  ],

  // Risk reversal variations
  riskReversalVariations: [
    "14-day free trial • No credit card required",
    "60-day money-back guarantee • Cancel anytime",
    "Free migration from your current software",
    "No setup fees • No long-term contracts",
    "Risk-free trial • Get your money back if not satisfied"
  ],

  // Value proposition variations
  valuePropositionVariations: [
    "Reduce admin work by 75% and focus on advisory services",
    "Automate your practice and increase capacity by 40%",
    "Transform client relationships with modern workflows",
    "Scale your firm without adding overhead",
    "Deliver exceptional client experiences at scale"
  ]
}