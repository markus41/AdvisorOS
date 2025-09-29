"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Check,
  X,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Zap,
  Award,
  Phone,
  ArrowRight,
  Calculator,
  AlertCircle,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useABTest } from "@/lib/conversion-optimization/ab-testing"
import { useConversionTracking } from "@/lib/conversion-optimization/conversion-tracking"

interface PricingTier {
  id: string
  name: string
  description: string
  originalPrice?: {
    monthly: number
    annual: number
  }
  price: {
    monthly: number
    annual: number
  }
  savings?: {
    monthly: string
    annual: string
  }
  features: {
    name: string
    included: boolean
    description?: string
  }[]
  cta: {
    text: string
    href: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  popular?: boolean
  badge?: string
  valueProps: string[]
  testimonial?: {
    quote: string
    author: string
    company: string
    savings: string
  }
  limitedTime?: {
    offer: string
    expires: string
  }
}

const enhancedPricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for solo practitioners and small firms getting started',
    price: {
      monthly: 89,
      annual: 890
    },
    valueProps: [
      'Save 20+ hours per month on admin tasks',
      'Reduce client onboarding time by 60%',
      'Improve client satisfaction scores'
    ],
    features: [
      { name: 'Up to 25 clients', included: true },
      { name: 'Basic QuickBooks sync', included: true, description: 'Daily synchronization' },
      { name: 'Document storage (5GB)', included: true },
      { name: 'Client portal', included: true },
      { name: 'Email support', included: true },
      { name: 'Basic reporting', included: true },
      { name: 'Advanced workflows', included: false },
      { name: 'AI insights', included: false },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false },
      { name: 'Phone support', included: false },
      { name: 'Dedicated account manager', included: false }
    ],
    cta: {
      text: 'Start Free Trial',
      href: '/trial?plan=starter'
    },
    testimonial: {
      quote: 'As a solo practitioner, the Starter plan has everything I need to stay organized and professional.',
      author: 'David Kim',
      company: 'Kim Tax Services',
      savings: 'Saves 15 hours/month'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Most popular choice for growing CPA firms',
    originalPrice: {
      monthly: 249,
      annual: 2490
    },
    price: {
      monthly: 189,
      annual: 1890
    },
    savings: {
      monthly: 'Save $60/month',
      annual: 'Save $600/year'
    },
    valueProps: [
      'Increase capacity by 40% without new hires',
      'Reduce errors by 90% with automation',
      'Boost client satisfaction by 85%'
    ],
    features: [
      { name: 'Up to 100 clients', included: true },
      { name: 'Advanced QuickBooks sync', included: true, description: 'Real-time synchronization' },
      { name: 'Document storage (25GB)', included: true },
      { name: 'Client portal', included: true },
      { name: 'Email & chat support', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'Advanced workflows', included: true },
      { name: 'AI insights', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: false },
      { name: 'Phone support', included: true },
      { name: 'Dedicated account manager', included: false }
    ],
    cta: {
      text: 'Start Free Trial',
      href: '/trial?plan=professional'
    },
    popular: true,
    badge: 'Most Popular',
    testimonial: {
      quote: 'The Professional plan helped us grow from 5 to 8 staff without increasing overhead.',
      author: 'Sarah Chen',
      company: 'Chen & Associates',
      savings: 'Saves $45K annually'
    },
    limitedTime: {
      offer: 'First 3 months at $149/month',
      expires: '2024-02-29'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for established firms requiring premium features',
    price: {
      monthly: 389,
      annual: 3890
    },
    valueProps: [
      'Handle unlimited clients with ease',
      'Custom integrations and workflows',
      'White-glove support and training'
    ],
    features: [
      { name: 'Unlimited clients', included: true },
      { name: 'Enterprise QuickBooks sync', included: true, description: 'Multi-entity support' },
      { name: 'Document storage (100GB)', included: true },
      { name: 'Client portal', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom reporting', included: true },
      { name: 'Advanced workflows', included: true },
      { name: 'AI insights', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
      { name: 'Phone support', included: true },
      { name: 'Dedicated account manager', included: true }
    ],
    cta: {
      text: 'Contact Sales',
      href: '/contact?plan=enterprise',
      variant: 'secondary'
    },
    badge: 'Best Value',
    testimonial: {
      quote: 'Enterprise features and support helped us scale to 50+ staff and 300+ clients seamlessly.',
      author: 'Robert Martinez',
      company: 'Martinez & Partners',
      savings: 'ROI: 340%'
    }
  },
  {
    id: 'premium',
    name: 'Premium Plus',
    description: 'Ultimate solution with exclusive features and concierge service',
    originalPrice: {
      monthly: 699,
      annual: 6990
    },
    price: {
      monthly: 599,
      annual: 5990
    },
    savings: {
      monthly: 'Save $100/month',
      annual: 'Save $1000/year'
    },
    valueProps: [
      'Exclusive beta features and early access',
      'Custom development and integrations',
      'Concierge migration and setup service'
    ],
    features: [
      { name: 'Everything in Enterprise', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated server resources', included: true },
      { name: 'Concierge migration service', included: true },
      { name: 'Custom feature development', included: true },
      { name: 'Executive business reviews', included: true },
      { name: 'Priority feature requests', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'On-site training available', included: true },
      { name: 'Custom SLA agreements', included: true },
      { name: 'White-label options', included: true },
      { name: 'Advanced security features', included: true }
    ],
    cta: {
      text: 'Schedule Consultation',
      href: '/contact?plan=premium'
    },
    badge: 'Exclusive',
    testimonial: {
      quote: 'Premium Plus gives us competitive advantages with custom features our competitors do not have.',
      author: 'Jennifer Walsh',
      company: 'Walsh Financial Group',
      savings: 'ROI: 450%'
    }
  }
]

interface EnhancedPricingProps {
  showPremium?: boolean
  enableABTesting?: boolean
}

export function EnhancedPricing({ showPremium = false, enableABTesting = true }: EnhancedPricingProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [showAllPlans, setShowAllPlans] = useState(showPremium)
  const { variant, trackConversion } = useABTest('pricing-psychology-001')
  const { track, trackCTAClick } = useConversionTracking()

  // Show Premium plan as anchor for psychological pricing
  const displayTiers = showAllPlans ? enhancedPricingTiers : enhancedPricingTiers.slice(0, 3)

  useEffect(() => {
    track('pricing_page_view', {
      showPremium: showAllPlans,
      billingCycle: billing
    })
  }, [showAllPlans, billing, track])

  const handlePlanSelection = (planId: string, planName: string) => {
    track('plan_selection', {
      planId,
      planName,
      billingCycle: billing
    })

    if (enableABTesting) {
      trackConversion('plan_selection')
    }
  }

  const handleCTAClick = (planId: string, ctaText: string, href: string) => {
    trackCTAClick(ctaText, `pricing-${planId}`, href)
    handlePlanSelection(planId, planId)
  }

  const getAnnualSavings = (monthly: number) => {
    const annualPrice = monthly * 12 * 0.75 // 25% annual discount
    const savings = (monthly * 12) - annualPrice
    return Math.round(savings)
  }

  return (
    <div className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
            Limited Time: Save up to $1000 on annual plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Transparent pricing designed to grow with your firm. All plans include a 14-day free trial,
            no setup fees, and can be upgraded or downgraded at any time.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billing === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={billing === 'annual'}
              onCheckedChange={(checked) => setBilling(checked ? 'annual' : 'monthly')}
              className="data-[state=checked]:bg-green-600"
            />
            <span className={`text-sm ${billing === 'annual' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Annual
            </span>
            <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
              Save 25%
            </Badge>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>500+ CPA firms</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>SOC 2 certified</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-8 ${showAllPlans ? 'lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} mb-16`}>
          {displayTiers.map((tier, index) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden h-full ${
                tier.popular
                  ? 'ring-2 ring-blue-500 shadow-xl scale-105 z-10'
                  : 'hover:shadow-lg transition-shadow duration-200'
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  {tier.badge}
                </div>
              )}

              {/* Limited Time Offer */}
              {tier.limitedTime && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                  Limited Time
                </div>
              )}

              <div className={`p-6 ${tier.popular ? 'pt-14' : ''} h-full flex flex-col`}>
                {/* Header */}
                <div className="text-center mb-6">
                  {tier.badge && !tier.popular && (
                    <Badge className="mb-2 bg-purple-100 text-purple-800 border-purple-200">
                      {tier.badge}
                    </Badge>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {tier.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  {tier.originalPrice && (
                    <div className="text-gray-500 line-through text-lg mb-1">
                      ${billing === 'annual' ? tier.originalPrice.annual : tier.originalPrice.monthly}
                      {billing === 'annual' ? '/year' : '/month'}
                    </div>
                  )}
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${billing === 'annual' ? tier.price.annual : tier.price.monthly}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {billing === 'annual' ? '/year' : '/month'}
                  </div>

                  {tier.savings && (
                    <Badge className="mt-2 bg-green-100 text-green-800 border-green-200">
                      {billing === 'annual' ? tier.savings.annual : tier.savings.monthly}
                    </Badge>
                  )}

                  {billing === 'annual' && !tier.savings && (
                    <div className="text-green-600 text-sm mt-2 font-semibold">
                      Save ${getAnnualSavings(tier.price.monthly)} annually
                    </div>
                  )}
                </div>

                {/* Limited Time Offer Details */}
                {tier.limitedTime && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                    <div className="text-red-800 dark:text-red-200 text-sm font-semibold">
                      🔥 {tier.limitedTime.offer}
                    </div>
                    <div className="text-red-600 dark:text-red-400 text-xs">
                      Expires {tier.limitedTime.expires}
                    </div>
                  </div>
                )}

                {/* Value Props */}
                <div className="space-y-2 mb-6">
                  {tier.valueProps.map((prop, index) => (
                    <div key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{prop}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mb-6">
                  <Button
                    asChild
                    className={`w-full ${
                      tier.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    variant={tier.cta.variant}
                    onClick={() => handleCTAClick(tier.id, tier.cta.text, tier.cta.href)}
                  >
                    <Link href={tier.cta.href}>
                      {tier.cta.text}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                {/* Features List */}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                    What's included:
                  </h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <div className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                          <span>{feature.name}</span>
                          {feature.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {feature.description}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Testimonial */}
                {tier.testimonial && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 italic mb-2">
                      "{tier.testimonial.quote}"
                    </div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">
                      {tier.testimonial.author}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tier.testimonial.company}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {tier.testimonial.savings}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Show Premium Plan Toggle */}
        {!showAllPlans && (
          <div className="text-center mb-16">
            <Button
              variant="outline"
              onClick={() => setShowAllPlans(true)}
              className="px-8"
            >
              View Premium Options
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Why CPA Firms Choose AdvisorOS
            </h3>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: <Shield className="w-8 h-8 text-green-600" />,
                title: '14-Day Free Trial',
                description: 'No credit card required. Full access to all features.'
              },
              {
                icon: <Clock className="w-8 h-8 text-blue-600" />,
                title: 'Quick Setup',
                description: 'Get started in 15 minutes with guided onboarding.'
              },
              {
                icon: <Award className="w-8 h-8 text-purple-600" />,
                title: 'Money-Back Guarantee',
                description: '60-day guarantee if you are not completely satisfied.'
              },
              {
                icon: <Phone className="w-8 h-8 text-orange-600" />,
                title: 'Expert Support',
                description: '24/7 support from CPA practice management experts.'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">{item.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Calculator CTA */}
        <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Calculate Your ROI
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            See exactly how much time and money AdvisorOS can save your firm with our interactive ROI calculator.
          </p>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Link href="/roi-calculator">
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Your Savings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}