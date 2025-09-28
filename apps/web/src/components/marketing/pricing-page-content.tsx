"use client"

import React, { useState } from 'react'
import { PricingCard } from "@/components/marketing/pricing-card"
import { TestimonialCard } from "@/components/marketing/testimonial-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BillingToggle } from "@/components/marketing/billing-toggle"
import { ROICalculator } from "@/components/marketing/roi-calculator"
import { Check, X } from "lucide-react"

const pricingPlans = [
  {
    name: "Starter",
    description: "Perfect for solo practitioners and small firms",
    price: {
      monthly: 89,
      annual: 890
    },
    features: [
      { name: "Up to 25 clients", included: true },
      { name: "Basic QuickBooks sync", included: true },
      { name: "Document storage (5GB)", included: true },
      { name: "Client portal", included: true },
      { name: "Email support", included: true },
      { name: "Basic reporting", included: true },
      { name: "Advanced workflows", included: false },
      { name: "AI insights", included: false },
      { name: "Custom branding", included: false },
      { name: "API access", included: false },
      { name: "Phone support", included: false },
      { name: "Dedicated account manager", included: false }
    ],
    cta: {
      text: "Start Free Trial",
      href: "/trial?plan=starter"
    }
  },
  {
    name: "Professional",
    description: "Ideal for growing CPA firms with multiple staff",
    price: {
      monthly: 189,
      annual: 1890
    },
    features: [
      { name: "Up to 100 clients", included: true },
      { name: "Advanced QuickBooks sync", included: true },
      { name: "Document storage (25GB)", included: true },
      { name: "Client portal", included: true },
      { name: "Email & chat support", included: true },
      { name: "Advanced reporting", included: true },
      { name: "Advanced workflows", included: true },
      { name: "AI insights", included: true },
      { name: "Custom branding", included: true },
      { name: "API access", included: false },
      { name: "Phone support", included: true },
      { name: "Dedicated account manager", included: false }
    ],
    cta: {
      text: "Start Free Trial",
      href: "/trial?plan=professional"
    },
    popular: true
  },
  {
    name: "Enterprise",
    description: "For large firms requiring advanced features and support",
    price: {
      monthly: 389,
      annual: 3890
    },
    features: [
      { name: "Unlimited clients", included: true },
      { name: "Enterprise QuickBooks sync", included: true },
      { name: "Document storage (100GB)", included: true },
      { name: "Client portal", included: true },
      { name: "Priority support", included: true },
      { name: "Custom reporting", included: true },
      { name: "Advanced workflows", included: true },
      { name: "AI insights", included: true },
      { name: "Custom branding", included: true },
      { name: "API access", included: true },
      { name: "Phone support", included: true },
      { name: "Dedicated account manager", included: true }
    ],
    cta: {
      text: "Contact Sales",
      href: "/contact?plan=enterprise"
    },
    badge: "Best Value"
  }
]

const testimonialsByPlan = {
  starter: {
    testimonial: "As a solo practitioner, AdvisorOS Starter has been perfect for organizing my clients and automating basic tasks. The QuickBooks sync alone saves me hours every week.",
    author: {
      name: "David Kim",
      role: "CPA",
      company: "Kim Tax Services"
    },
    rating: 5
  },
  professional: {
    testimonial: "The Professional plan transformed our 5-person firm. The advanced workflows and AI insights help us serve 3x more clients with the same team.",
    author: {
      name: "Sarah Chen",
      role: "Managing Partner",
      company: "Chen & Associates CPA"
    },
    rating: 5
  },
  enterprise: {
    testimonial: "With 50+ staff and hundreds of clients, we needed enterprise-level features. The dedicated support and unlimited client capacity make this plan essential for our operation.",
    author: {
      name: "Robert Martinez",
      role: "Senior Partner",
      company: "Martinez, Johnson & Partners"
    },
    rating: 5
  }
}

export function PricingPageContent() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <>
      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Choose the plan that's right for your firm. All plans include a 14-day free trial,
            no setup fees, and can be upgraded or downgraded at any time.
          </p>

          {/* Billing Toggle */}
          <BillingToggle onBillingChange={setBilling} className="mb-12" />
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingCard
                key={index}
                {...plan}
                billing={billing}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Compare All Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See exactly what's included in each plan
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Features
                    </th>
                    {pricingPlans.map((plan) => (
                      <th key={plan.name} className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                        <div className="flex flex-col items-center">
                          <span>{plan.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ${billing === 'annual' ? plan.price.annual : plan.price.monthly}
                            /{billing === 'annual' ? 'year' : 'month'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pricingPlans[0].features.map((feature, featureIndex) => (
                    <tr key={featureIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {feature.name}
                      </td>
                      {pricingPlans.map((plan, planIndex) => (
                        <td key={planIndex} className="px-6 py-4 text-center">
                          {plan.features[featureIndex].included ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ROICalculator />
        </div>
      </section>

      {/* Testimonials by Plan */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Success stories from firms using each plan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(testimonialsByPlan).map(([planName, testimonial], index) => (
              <div key={planName}>
                <div className="text-center mb-4">
                  <Badge variant="outline" className="mb-2">
                    {planName.charAt(0).toUpperCase() + planName.slice(1)} Plan
                  </Badge>
                </div>
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}