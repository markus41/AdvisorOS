import { HeroSection } from "@/components/marketing/hero-section"
import { FeatureCard } from "@/components/marketing/feature-card"
import { TestimonialCard } from "@/components/marketing/testimonial-card"
import { StatsSection } from "@/components/marketing/stats-section"
import { CTASection } from "@/components/marketing/cta-section"
import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { StructuredData } from "@/components/seo/structured-data"
import {
  organizationSchema,
  softwareApplicationSchema,
  serviceSchema,
  localBusinessSchema
} from "@/lib/seo"
import {
  Users,
  FileText,
  BarChart3,
  Zap,
  Shield,
  Building,
  Clock,
  DollarSign,
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "CPA Practice Management Software | AdvisorOS",
  description: "Transform your CPA practice with AdvisorOS. Streamline client management, automate workflows, and integrate seamlessly with QuickBooks. Join 500+ firms saving 75% on administrative tasks.",
  keywords: [
    "CPA practice management software",
    "accounting practice management",
    "QuickBooks integration",
    "CPA client portal",
    "accounting workflow automation",
    "CPA firm software",
    "practice management platform",
    "accounting automation software"
  ],
  openGraph: {
    title: "CPA Practice Management Software | AdvisorOS",
    description: "Transform your CPA practice with AdvisorOS. Streamline client management, automate workflows, and integrate seamlessly with QuickBooks.",
    url: "https://advisoros.com",
    type: "website",
    images: [{
      url: "/og-image-home.jpg",
      width: 1200,
      height: 630,
      alt: "AdvisorOS - CPA Practice Management Platform Dashboard"
    }]
  }
}

const features = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Client Management",
    description: "Centralized client database with comprehensive profiles, communication history, and automated workflows.",
    features: [
      "360-degree client view with full history",
      "Automated task scheduling and reminders",
      "Integrated communication tracking",
      "Custom client portals"
    ],
    cta: {
      text: "Learn More",
      href: "/features#client-management"
    }
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "QuickBooks Integration",
    description: "Seamless two-way sync with QuickBooks Online and Desktop for real-time financial data access.",
    features: [
      "Real-time data synchronization",
      "Automated transaction categorization",
      "Multi-company management",
      "Error detection and resolution"
    ],
    cta: {
      text: "View Integration",
      href: "/features#quickbooks"
    },
    variant: "featured" as const
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Document Management",
    description: "AI-powered document processing with OCR, automated data extraction, and secure cloud storage.",
    features: [
      "OCR and data extraction",
      "Automated filing and organization",
      "Secure document sharing",
      "Version control and audit trails"
    ],
    cta: {
      text: "Explore Features",
      href: "/features#documents"
    }
  }
]

const testimonials = [
  {
    testimonial: "AdvisorOS has transformed our practice. We've reduced client onboarding time by 75% and increased our capacity by 40% without adding staff.",
    author: {
      name: "Sarah Chen",
      role: "Managing Partner",
      company: "Chen & Associates CPA"
    },
    rating: 5
  },
  {
    testimonial: "The QuickBooks integration is seamless. What used to take hours of manual data entry now happens automatically. Our team can focus on advisory services instead of data entry.",
    author: {
      name: "Michael Rodriguez",
      role: "CPA",
      company: "Rodriguez Tax Solutions"
    },
    rating: 5,
    variant: "featured" as const
  },
  {
    testimonial: "The client portal has been a game-changer. Our clients love the transparency and ease of uploading documents. We've seen a 90% reduction in back-and-forth emails.",
    author: {
      name: "Jennifer Walsh",
      role: "Senior Partner",
      company: "Walsh Financial Group"
    },
    rating: 5
  }
]

const stats = [
  {
    value: "500+",
    label: "CPA Firms",
    description: "Trust our platform"
  },
  {
    value: "75%",
    label: "Time Saved",
    description: "On administrative tasks"
  },
  {
    value: "40%",
    label: "Revenue Growth",
    description: "Average client increase"
  },
  {
    value: "99.9%",
    label: "Uptime",
    description: "Guaranteed reliability"
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <StructuredData data={[
        organizationSchema,
        softwareApplicationSchema,
        serviceSchema,
        localBusinessSchema
      ]} />
      <Navigation />

      {/* Hero Section */}
      <HeroSection
        title="The Complete Advisory Platform for Modern CPA Firms"
        subtitle="Trusted by 500+ CPA Firms"
        description="Streamline operations, enhance client relationships, and scale your practice with our integrated platform. From client management to QuickBooks sync, everything you need in one place."
        primaryCta={{
          text: "Start Free Trial",
          href: "/trial"
        }}
        secondaryCta={{
          text: "Request Demo",
          href: "/demo"
        }}
        features={[
          "Complete QuickBooks integration with real-time sync",
          "AI-powered document processing and OCR",
          "Automated workflow management and client portals"
        ]}
        stats={[
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
            icon: <DollarSign className="w-6 h-6 text-purple-600" />,
            value: "40%",
            label: "Revenue Growth"
          }
        ]}
      />

      {/* Trust Indicators */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Trusted by Leading CPA Firms
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Join hundreds of successful firms already using AdvisorOS
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            {["Chen & Associates", "Rodriguez Tax", "Walsh Financial", "Summit CPA"].map((company, index) => (
              <div key={index} className="text-center">
                <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg mb-2 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                    {company}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Everything Your CPA Firm Needs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From client onboarding to financial reporting, our integrated platform
              handles every aspect of your practice management needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="px-8">
              <Link href="/features">
                View All Features
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-blue-50 dark:bg-blue-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Transform Your Practice Operations
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Stop spending hours on administrative tasks. Our platform automates
                routine processes so you can focus on high-value advisory services.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Reduce client onboarding time by 75%",
                  "Automate document collection and processing",
                  "Eliminate manual data entry with QuickBooks sync",
                  "Provide 24/7 client access through secure portals"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button asChild size="lg">
                <Link href="/demo">
                  See It In Action
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Practice Dashboard
                    </h3>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">127</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active Clients</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">89%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Automation Rate</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Tax Season Prep</span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        On Track
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">QB Sync Status</span>
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        Synced
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection
        title="Proven Results for CPA Firms"
        subtitle="Our platform delivers measurable improvements in efficiency and client satisfaction"
        stats={stats}
        className="bg-white dark:bg-gray-900"
      />

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              What CPA Firms Are Saying
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Don't just take our word for it. See how we're helping firms grow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        title="Ready to Transform Your CPA Practice?"
        description="Join hundreds of successful firms using AdvisorOS to streamline operations and grow their business."
        primaryCta={{
          text: "Start Free Trial",
          href: "/trial"
        }}
        secondaryCta={{
          text: "Schedule Demo",
          href: "/demo"
        }}
        variant="gradient"
      />

      <Footer />
    </div>
  )
}