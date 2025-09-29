"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  Star,
  Clock,
  Users,
  Shield,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import Link from "next/link"
import { useConversionTracking } from "@/lib/conversion-optimization/conversion-tracking"

// Mobile-optimized hero section
export function MobileHeroSection() {
  const { trackCTAClick } = useConversionTracking()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      <div className="text-center max-w-lg mx-auto">
        {/* Trust Badge */}
        <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
          ⭐ #1 Rated CPA Software
        </Badge>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
          Grow Your CPA Practice 40% Faster
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Automate workflows, manage clients, and integrate with QuickBooks.
          Trusted by 500+ firms.
        </p>

        {/* Key Benefits - Mobile Optimized */}
        <div className="space-y-2 mb-8">
          {[
            '✅ Save 20+ hours per week',
            '✅ Reduce errors by 90%',
            '✅ Boost client satisfaction'
          ].map((benefit, index) => (
            <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
              {benefit}
            </div>
          ))}
        </div>

        {/* Mobile-First CTAs */}
        <div className="space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold shadow-lg"
            onClick={() => trackCTAClick('Start Free Trial', 'mobile-hero-primary', '/trial')}
          >
            <Link href="/trial">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full py-4 text-lg border-2"
            onClick={() => trackCTAClick('Watch Demo', 'mobile-hero-secondary', '/demo')}
          >
            <Link href="/demo">
              Watch 2-Min Demo
            </Link>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          🔒 14-day free trial • No credit card required • Setup in 15 minutes
        </div>

        {/* Social Proof */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span>4.9/5</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>500+ firms</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-green-500" />
            <span>SOC 2</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// Mobile-optimized navigation
export function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-sm z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">AdvisorOS</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-600 dark:text-gray-400"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700">
            <div className="py-4">
              {[
                { name: 'Features', href: '/features' },
                { name: 'Pricing', href: '/pricing' },
                { name: 'Demo', href: '/demo' },
                { name: 'Resources', href: '/resources' }
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 px-4 space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/trial">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Mobile-optimized feature cards
export function MobileFeatureCards() {
  const features = [
    {
      icon: '👥',
      title: 'Client Management',
      description: 'Centralized client database with 360-degree view',
      benefits: ['Automated workflows', 'Communication tracking', 'Custom portals']
    },
    {
      icon: '🔄',
      title: 'QuickBooks Sync',
      description: 'Real-time two-way synchronization',
      benefits: ['Live data sync', 'Multi-company support', 'Error detection']
    },
    {
      icon: '📄',
      title: 'Document AI',
      description: 'AI-powered document processing and OCR',
      benefits: ['Auto data extraction', 'Smart filing', 'Secure sharing']
    }
  ]

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything Your Firm Needs
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Powerful features designed specifically for CPA practices
          </p>
        </div>

        <div className="space-y-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {feature.description}
                  </p>
                  <div className="space-y-1">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg" className="w-full">
            <Link href="/features">
              View All Features
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// Mobile-optimized pricing cards
export function MobilePricingCards() {
  const [selectedPlan, setSelectedPlan] = useState('professional')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 89,
      description: 'For solo practitioners',
      features: ['25 clients', 'QuickBooks sync', 'Client portal', 'Email support']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 189,
      description: 'Most popular',
      badge: 'Popular',
      features: ['100 clients', 'Advanced sync', 'Workflows', 'Phone support']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 389,
      description: 'For large firms',
      features: ['Unlimited clients', 'Custom features', 'Dedicated manager', 'Priority support']
    }
  ]

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Choose the plan that fits your firm
          </p>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-3 gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedPlan === plan.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>

        {/* Selected Plan Details */}
        {plans.map((plan) => (
          selectedPlan === plan.id && (
            <Card key={plan.id} className="p-6 text-center">
              {plan.badge && (
                <Badge className="mb-4 bg-blue-100 text-blue-800">
                  {plan.badge}
                </Badge>
              )}

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>

              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                ${plan.price}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                per month
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {plan.description}
              </p>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-center text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button asChild size="lg" className="w-full mb-4">
                <Link href={`/trial?plan=${plan.id}`}>
                  Start Free Trial
                </Link>
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                14-day free trial • No credit card required
              </p>
            </Card>
          )
        ))}
      </div>
    </section>
  )
}

// Mobile-optimized FAQ section
export function MobileFAQ() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const faqs = [
    {
      question: 'How quickly can I get started?',
      answer: 'Most firms are up and running within 15 minutes. Our guided setup walks you through connecting QuickBooks, importing clients, and configuring your first workflows.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. We use bank-level 256-bit encryption, are SOC 2 Type II certified, and store all data in secure US-based data centers with 99.9% uptime guarantee.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. There are no long-term contracts. You can upgrade, downgrade, or cancel your subscription at any time. We also offer a 60-day money-back guarantee.'
    },
    {
      question: 'Do you integrate with QuickBooks?',
      answer: 'Yes, we have deep two-way integration with both QuickBooks Online and Desktop. Data syncs in real-time, and we support multi-company setups.'
    },
    {
      question: 'What support do you provide?',
      answer: 'All plans include email support. Professional and Enterprise plans get phone support. Enterprise customers get a dedicated account manager and priority support.'
    }
  ]

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Get answers to common questions about AdvisorOS
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                {openFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {openFAQ === index && (
                <div className="px-4 pb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/contact">
                <Mail className="w-4 h-4 mr-2" />
                Email Us
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="tel:+1-800-CPA-HELP">
                <Phone className="w-4 h-4 mr-2" />
                Call Us
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Mobile-optimized testimonials
export function MobileTestimonials() {
  const testimonials = [
    {
      quote: "AdvisorOS helped us reduce client onboarding time by 75% and grow our practice by 40% without adding staff.",
      author: "Sarah Chen",
      title: "Managing Partner",
      company: "Chen & Associates CPA",
      rating: 5,
      metric: "40% growth"
    },
    {
      quote: "The QuickBooks integration is seamless. What used to take hours now happens automatically.",
      author: "Michael Rodriguez",
      title: "CPA",
      company: "Rodriguez Tax Solutions",
      rating: 5,
      metric: "20+ hours saved/week"
    },
    {
      quote: "Our clients love the portal. We've seen a 90% reduction in back-and-forth emails.",
      author: "Jennifer Walsh",
      title: "Senior Partner",
      company: "Walsh Financial Group",
      rating: 5,
      metric: "90% fewer emails"
    }
  ]

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What CPA Firms Are Saying
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Real results from firms like yours
          </p>
        </div>

        <div className="space-y-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              <blockquote className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "{testimonial.quote}"
              </blockquote>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {testimonial.metric}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// Mobile-optimized CTA section
export function MobileCTA() {
  const { trackCTAClick } = useConversionTracking()

  return (
    <section className="py-16 px-4 bg-blue-600 text-white">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to Transform Your Practice?
        </h2>
        <p className="text-blue-100 mb-8">
          Join 500+ CPA firms using AdvisorOS to streamline operations and grow their business.
        </p>

        <div className="space-y-3 mb-6">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="w-full bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => trackCTAClick('Start Free Trial', 'mobile-cta-primary', '/trial')}
          >
            <Link href="/trial">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white text-white hover:bg-white hover:text-blue-600"
            onClick={() => trackCTAClick('Schedule Demo', 'mobile-cta-secondary', '/demo')}
          >
            <Link href="/demo">
              Schedule Demo
            </Link>
          </Button>
        </div>

        <div className="text-sm text-blue-200">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="w-4 h-4" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Shield className="w-4 h-4" />
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  )
}