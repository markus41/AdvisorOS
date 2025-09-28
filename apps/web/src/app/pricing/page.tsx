"use client"

import { useState } from "react"
import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { PricingCard } from "@/components/marketing/pricing-card"
import { TestimonialCard } from "@/components/marketing/testimonial-card"
import { CTASection } from "@/components/marketing/cta-section"
import { FAQSection } from "@/components/marketing/faq-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { StructuredData } from "@/components/seo/structured-data"
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "CPA Software Pricing | Affordable Plans for Accounting Firms",
  description: "Transparent pricing for AdvisorOS CPA practice management software. Starting at $89/month with QuickBooks integration, client portals, and workflow automation. 14-day free trial.",
  keywords: [
    "CPA software pricing",
    "accounting software cost",
    "practice management pricing",
    "QuickBooks integration pricing",
    "CPA firm software plans",
    "accounting practice management cost"
  ],
  openGraph: {
    title: "CPA Software Pricing | Affordable Plans for Accounting Firms",
    description: "Transparent pricing for AdvisorOS CPA practice management software. Starting at $89/month with 14-day free trial.",
    url: "https://advisoros.com/pricing",
    type: "website"
  }
}
import {
  Check,
  X,
  Calculator,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Star
} from "lucide-react"

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

const faqs = [
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
  },
  {
    question: "What's included in the free trial?",
    answer: "Your 14-day free trial includes full access to all features in your selected plan. No credit card required to start, and you can cancel anytime during the trial period."
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes! Annual billing saves you approximately 16% compared to monthly billing. Plus, you'll get priority support and additional storage bonuses."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees ever. We also provide free onboarding assistance and data migration support for all plans."
  },
  {
    question: "What happens if I exceed my client limit?",
    answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional client slots at $5 per client per month."
  },
  {
    question: "Can I integrate with other software besides QuickBooks?",
    answer: "Yes! We integrate with 30+ popular business applications including Xero, Excel, Gmail, DocuSign, and more. Enterprise plans include API access for custom integrations."
  },
  {
    question: "What kind of support do you provide?",
    answer: "All plans include email support. Professional and Enterprise plans get chat and phone support. Enterprise customers also receive a dedicated account manager."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level security with 256-bit SSL encryption, SOC 2 Type II certification, and maintain 99.9% uptime with automated backups."
  }
]

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [clients, setClients] = useState(50)
  const [hourlyRate, setHourlyRate] = useState(150)
  const [hoursPerClient, setHoursPerClient] = useState(10)

  const breadcrumbs = [
    { name: "Home", url: "https://advisoros.com" },
    { name: "Pricing", url: "https://advisoros.com/pricing" }
  ]

  const faqData = faqs.map(faq => ({
    question: faq.question,
    answer: faq.answer
  }))

  // ROI Calculator
  const currentMonthlyCost = clients * hoursPerClient * hourlyRate
  const timeSaved = 0.75 // 75% time savings
  const monthlySavings = currentMonthlyCost * timeSaved
  const professionalPlanCost = billing === 'annual' ? 1890 / 12 : 189
  const roiMontlhy = monthlySavings - professionalPlanCost
  const roiAnnual = roiMontlhy * 12
  const roiPercentage = Math.round((roiMontlhy / professionalPlanCost) * 100)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <StructuredData data={[
        breadcrumbSchema(breadcrumbs),
        faqPageSchema(faqData)
      ]} />
      <Navigation />

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
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm ${billing === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={billing === 'annual'}
              onCheckedChange={(checked) => setBilling(checked ? 'annual' : 'monthly')}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className={`text-sm ${billing === 'annual' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Annual
            </span>
            {billing === 'annual' && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Save 16%
              </Badge>
            )}
          </div>
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
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Calculate Your ROI
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                See how much time and money AdvisorOS can save your firm.
                Our customers typically see 75% reduction in administrative tasks.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="w-6 h-6 mr-2 text-blue-600" />
                    Firm Details
                  </CardTitle>
                  <CardDescription>
                    Enter your current practice metrics to calculate potential savings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="clients">Number of Clients</Label>
                    <Input
                      id="clients"
                      type="number"
                      value={clients}
                      onChange={(e) => setClients(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hourlyRate">Average Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hoursPerClient">Administrative Hours per Client/Month</Label>
                    <Input
                      id="hoursPerClient"
                      type="number"
                      value={hoursPerClient}
                      onChange={(e) => setHoursPerClient(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    Your Potential Savings
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Based on 75% reduction in administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${monthlySavings.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Monthly Time Savings
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${professionalPlanCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Professional Plan Cost
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg">
                    <div className="text-3xl font-bold mb-2">
                      ${roiMontlhy.toLocaleString()}/month
                    </div>
                    <div className="text-sm opacity-90 mb-4">
                      Net Monthly Savings
                    </div>
                    <div className="text-lg font-semibold">
                      {roiPercentage}% ROI
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Annual Savings:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${roiAnnual.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Hours Saved/Month:</span>
                      <span className="font-semibold">
                        {Math.round(clients * hoursPerClient * timeSaved)} hours
                      </span>
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <a href="/trial?plan=professional">
                      Start Saving Today
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
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

      {/* FAQ Section */}
      <FAQSection
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about our pricing and plans"
        faqs={faqs}
        className="bg-white dark:bg-gray-900"
      />

      {/* Final CTA */}
      <CTASection
        title="Ready to Start Your Free Trial?"
        description="No credit card required. Full access to all features for 14 days. Cancel anytime."
        primaryCta={{
          text: "Start Free Trial",
          href: "/trial"
        }}
        secondaryCta={{
          text: "Contact Sales",
          href: "/contact"
        }}
        variant="gradient"
      />

      <Footer />
    </div>
  )
}