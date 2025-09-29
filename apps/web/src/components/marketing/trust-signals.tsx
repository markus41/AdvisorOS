"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Shield,
  Award,
  Users,
  Star,
  Building,
  CheckCircle,
  Lock,
  TrendingUp,
  Globe,
  Phone,
  Clock,
  BookOpen
} from "lucide-react"
import Image from "next/image"
import { useConversionTracking } from "@/lib/conversion-optimization/conversion-tracking"

interface TrustSignalsProps {
  variant?: 'compact' | 'detailed' | 'hero'
  className?: string
  showLogos?: boolean
}

export function TrustSignals({
  variant = 'compact',
  className = "",
  showLogos = true
}: TrustSignalsProps) {
  const { track } = useConversionTracking()

  const handleCertificationClick = (certification: string) => {
    track('certification_click', { certification })
  }

  if (variant === 'hero') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Quick Trust Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            <Shield className="w-3 h-3 mr-1" />
            SOC 2 Type II
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
            <Award className="w-3 h-3 mr-1" />
            CPA Practice Advisor Winner
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
            <Star className="w-3 h-3 mr-1" />
            4.9/5 Rating
          </Badge>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">500+</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">CPA Firms</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">$2M+</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Saved Annually</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">24/7</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Support</div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Shield className="w-4 h-4 text-green-500" />
          <span>SOC 2 Certified</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>4.9/5 Rating</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4 text-blue-500" />
          <span>500+ Firms</span>
        </div>
      </div>
    )
  }

  return (
    <section className={`py-16 bg-white dark:bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Leading CPA Firms Nationwide
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Join hundreds of successful firms who trust AdvisorOS with their practice management
          </p>
        </div>

        {/* Trust Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Security & Compliance */}
          <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-200">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enterprise Security</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              SOC 2 Type II certified with bank-level encryption
            </p>
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-green-50"
                onClick={() => handleCertificationClick('SOC 2 Type II')}
              >
                SOC 2 Type II
              </Badge>
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-blue-50"
                onClick={() => handleCertificationClick('ISO 27001')}
              >
                ISO 27001
              </Badge>
            </div>
          </Card>

          {/* Industry Recognition */}
          <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Industry Leader</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Recognized by top accounting publications
            </p>
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">
                CPA Practice Advisor Winner
              </Badge>
              <Badge variant="outline" className="text-xs">
                Accounting Today Top 100
              </Badge>
            </div>
          </Card>

          {/* Customer Satisfaction */}
          <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-200">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customer Loved</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Highest rated CPA practice management software
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm font-semibold ml-1">4.9/5</span>
              </div>
              <p className="text-xs text-gray-500">Based on 127+ reviews</p>
            </div>
          </Card>

          {/* Scale & Reliability */}
          <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Proven Scale</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Trusted by 500+ firms processing millions of transactions
            </p>
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">
                99.9% Uptime SLA
              </Badge>
              <Badge variant="outline" className="text-xs">
                24/7 Support
              </Badge>
            </div>
          </Card>
        </div>

        {/* Customer Logos */}
        {showLogos && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-12">
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
              Trusted by leading CPA firms across the country
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
              {[
                "Chen & Associates CPA",
                "Rodriguez Tax Solutions",
                "Walsh Financial Group",
                "Summit CPA Partners",
                "Johnson & Williams LLC",
                "Metropolitan Tax Group"
              ].map((company, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors duration-200">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs px-2">
                      {company}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {/* Security Details */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Bank-Level Security
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your data is protected with 256-bit encryption, multi-factor authentication, and regular security audits.
            </p>
          </div>

          {/* Reliability */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              99.9% Uptime Guarantee
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Our redundant infrastructure ensures your practice management tools are always available when you need them.
            </p>
          </div>

          {/* Support */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Expert Support Team
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get help from our team of CPA practice management experts, available 24/7 via phone, chat, and email.
            </p>
          </div>
        </div>

        {/* Testimonial Highlights */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 mt-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "AdvisorOS has been a game-changer for our 15-person firm. The security and reliability give us complete peace of mind.",
                author: "Sarah Chen, Managing Partner",
                company: "Chen & Associates CPA",
                metric: "15-person firm"
              },
              {
                quote: "The support team is incredible. They understand CPA practices and always provide solutions that work.",
                author: "Michael Rodriguez, CPA",
                company: "Rodriguez Tax Solutions",
                metric: "Solo practitioner"
              },
              {
                quote: "We've processed over $50M in client transactions without a single security issue. Trust is everything in our business.",
                author: "Jennifer Walsh, Senior Partner",
                company: "Walsh Financial Group",
                metric: "50+ staff members"
              }
            ].map((testimonial, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 text-sm mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {testimonial.company}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {testimonial.metric}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Specialized components for different use cases
export function SecurityBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <Shield className="w-3 h-3 mr-1 text-green-600" />
        SOC 2 Type II
      </Badge>
      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Lock className="w-3 h-3 mr-1 text-blue-600" />
        256-bit Encryption
      </Badge>
      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <CheckCircle className="w-3 h-3 mr-1 text-purple-600" />
        ISO 27001
      </Badge>
    </div>
  )
}

export function CustomerStats({ layout = 'horizontal' }: { layout?: 'horizontal' | 'vertical' }) {
  const stats = [
    { value: "500+", label: "CPA Firms", icon: Building },
    { value: "99.9%", label: "Uptime", icon: Clock },
    { value: "4.9/5", label: "Rating", icon: Star },
    { value: "$2M+", label: "Saved Annually", icon: TrendingUp }
  ]

  if (layout === 'vertical') {
    return (
      <div className="space-y-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}