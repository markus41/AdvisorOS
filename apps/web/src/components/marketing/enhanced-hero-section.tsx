"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, Users, TrendingUp, Shield, Star, Clock, Award, Zap } from "lucide-react"
import Link from "next/link"
import { useABTest } from "@/lib/conversion-optimization/ab-testing"
import { useConversionTracking } from "@/lib/conversion-optimization/conversion-tracking"
import { useEffect, useState } from "react"

interface EnhancedHeroSectionProps {
  enableABTesting?: boolean
  className?: string
}

export function EnhancedHeroSection({
  enableABTesting = true,
  className = ""
}: EnhancedHeroSectionProps) {
  const { variant, trackConversion, isInTest } = useABTest('hero-headline-test-001')
  const { trackCTAClick, trackPageView } = useConversionTracking()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    trackPageView()
  }, [trackPageView])

  if (!mounted) {
    return <HeroSectionSkeleton />
  }

  // Use A/B test variant if available and enabled, otherwise use default
  const content = enableABTesting && isInTest && variant?.content ? variant.content : {
    headline: 'The Complete Advisory Platform for Modern CPA Firms',
    subheadline: 'Trusted by 500+ CPA Firms',
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Request Demo'
  }

  const handlePrimaryCTA = () => {
    trackCTAClick(content.ctaPrimary || 'Start Free Trial', 'hero-primary', '/trial')
    if (enableABTesting && isInTest) {
      trackConversion('trial_signup')
    }
  }

  const handleSecondaryCTA = () => {
    trackCTAClick(content.ctaSecondary || 'Request Demo', 'hero-secondary', '/demo')
    if (enableABTesting && isInTest) {
      trackConversion('demo_request')
    }
  }

  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}>
      {/* Enhanced Background with Animated Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900" />

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-normal opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-40 h-40 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-normal opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-normal opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                <Award className="w-3 h-3 mr-1" />
                #1 Rated CPA Software
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                <Shield className="w-3 h-3 mr-1" />
                SOC 2 Certified
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800">
                <Star className="w-3 h-3 mr-1" />
                4.9/5 Customer Rating
              </Badge>
            </div>

            {/* Subtitle Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-2" />
              {content.subheadline}
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              {content.headline}
            </h1>

            {/* Enhanced Description */}
            <div className="space-y-4">
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                Streamline operations, enhance client relationships, and scale your practice with our integrated platform.
                From client management to QuickBooks sync, everything you need in one place.
              </p>

              {/* Key Benefits */}
              <div className="grid md:grid-cols-2 gap-3 mt-6">
                {[
                  "Complete QuickBooks integration with real-time sync",
                  "AI-powered document processing and OCR",
                  "Automated workflow management and client portals",
                  "Advanced analytics and performance insights"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            {content.socialProof && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {content.socialProof}
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handlePrimaryCTA}
                >
                  <Link href="/trial">
                    {content.ctaPrimary}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={handleSecondaryCTA}
                >
                  <Link href="/demo">
                    {content.ctaSecondary}
                  </Link>
                </Button>
              </div>

              {/* Risk Reversal & Urgency */}
              <div className="space-y-2">
                {content.riskReversal && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-green-500" />
                    {content.riskReversal}
                  </p>
                )}
                {content.urgencyText && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center font-medium">
                    <Clock className="w-4 h-4 mr-2" />
                    {content.urgencyText}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
              {[
                {
                  icon: <Building className="w-6 h-6 text-blue-600" />,
                  value: "500+",
                  label: "CPA Firms"
                },
                {
                  icon: <Clock className="w-6 h-6 text-green-600" />,
                  value: "75%",
                  label: "Time Saved"
                },
                {
                  icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
                  value: "40%",
                  label: "Revenue Growth"
                }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Visual */}
          <div className="relative">
            {/* Main Dashboard Preview */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform duration-500">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AdvisorOS Dashboard</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Practice Overview</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">127</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Active Clients</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">↗ +12% this month</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">89%</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Automation Rate</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">↗ +5% this week</div>
                </div>
              </div>

              {/* Task Status */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Activity</h4>
                {[
                  { task: "Tax Season Prep", status: "On Track", color: "blue" },
                  { task: "QB Sync Status", status: "Synced", color: "green" },
                  { task: "Client Onboarding", status: "3 Pending", color: "amber" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.task}</span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      item.color === 'green'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : item.color === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Elements - Non-obstructive positioning */}
            <div className="absolute top-4 right-4 w-8 h-8 md:w-12 md:h-12 bg-blue-500 rounded-full opacity-15 animate-bounce pointer-events-none"></div>
            <div className="absolute bottom-8 left-4 w-12 h-12 md:w-16 md:h-16 bg-purple-500 rounded-full opacity-10 animate-pulse pointer-events-none"></div>

            {/* Security Badge */}
            <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Bank-Level Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* A/B Test Indicator (only visible in development) */}
      {process.env.NODE_ENV === 'development' && enableABTesting && isInTest && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg text-xs font-mono">
          A/B Test: {variant?.name || 'Unknown'}
        </div>
      )}
    </section>
  )
}

// Skeleton component for SSR/loading state
function HeroSectionSkeleton() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="flex gap-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        </div>
      </div>
    </section>
  )
}

// Building component for other imports
const Building = Users