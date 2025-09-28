import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { HeroSection } from "@/components/marketing/hero-section"
import { FeatureCard } from "@/components/marketing/feature-card"
import { CTASection } from "@/components/marketing/cta-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StructuredData } from "@/components/seo/structured-data"
import { breadcrumbSchema } from "@/lib/seo"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "CPA Software Features | Client Management & QuickBooks Integration",
  description: "Explore AdvisorOS features: comprehensive client management, seamless QuickBooks integration, AI-powered document processing, workflow automation, and secure client portals for CPA firms.",
  keywords: [
    "CPA software features",
    "QuickBooks integration",
    "client management system",
    "document automation",
    "workflow automation",
    "client portal software",
    "AI document processing",
    "CPA practice management features"
  ],
  openGraph: {
    title: "CPA Software Features | Client Management & QuickBooks Integration",
    description: "Explore AdvisorOS features: comprehensive client management, seamless QuickBooks integration, AI-powered document processing, and workflow automation.",
    url: "https://advisoros.com/features",
    type: "website"
  }
}
import {
  Users,
  FileText,
  BarChart3,
  Zap,
  Shield,
  Brain,
  Globe,
  CheckCircle,
  ArrowRight,
  Clock,
  DollarSign,
  Target,
  MessageSquare,
  Upload,
  Search,
  Calendar,
  Bell,
  Lock,
  Workflow,
  Database,
  Settings
} from "lucide-react"
import Link from "next/link"

const featureCategories = [
  {
    id: "client-management",
    title: "Client Management",
    description: "Comprehensive client relationship management designed for CPA firms",
    icon: <Users className="w-8 h-8" />,
    features: [
      {
        icon: <Users className="w-6 h-6" />,
        title: "360° Client Profiles",
        description: "Complete client view with contact information, service history, documents, and communication logs",
        benefits: [
          "Centralized client database with full history",
          "Custom fields for industry-specific data",
          "Relationship mapping for multi-entity clients",
          "Integration with QuickBooks client lists"
        ]
      },
      {
        icon: <Calendar className="w-6 h-6" />,
        title: "Automated Task Management",
        description: "Intelligent task scheduling with deadline tracking and automated reminders",
        benefits: [
          "Recurring task templates for tax seasons",
          "Automated deadline calculations",
          "Team workload balancing",
          "Client notification automation"
        ]
      },
      {
        icon: <MessageSquare className="w-6 h-6" />,
        title: "Communication Hub",
        description: "Centralized communication tracking with email integration and client messaging",
        benefits: [
          "Email thread consolidation",
          "Client portal messaging",
          "Communication templates",
          "Response time tracking"
        ]
      }
    ]
  },
  {
    id: "quickbooks",
    title: "QuickBooks Integration",
    description: "Seamless two-way synchronization with QuickBooks Online and Desktop",
    icon: <BarChart3 className="w-8 h-8" />,
    features: [
      {
        icon: <Database className="w-6 h-6" />,
        title: "Real-Time Data Sync",
        description: "Automatic synchronization of financial data between QuickBooks and AdvisorOS",
        benefits: [
          "Real-time transaction import",
          "Two-way data synchronization",
          "Multi-company management",
          "Conflict resolution automation"
        ]
      },
      {
        icon: <Brain className="w-6 h-6" />,
        title: "Smart Categorization",
        description: "AI-powered transaction categorization with learning algorithms",
        benefits: [
          "Automatic transaction categorization",
          "Custom rule creation",
          "Machine learning improvements",
          "Exception handling workflows"
        ]
      },
      {
        icon: <Shield className="w-6 h-6" />,
        title: "Error Detection",
        description: "Automated detection and resolution of data inconsistencies and errors",
        benefits: [
          "Duplicate transaction detection",
          "Balance reconciliation checks",
          "Data validation rules",
          "Automated correction suggestions"
        ]
      }
    ]
  },
  {
    id: "documents",
    title: "Document Management",
    description: "AI-powered document processing with OCR and automated organization",
    icon: <FileText className="w-8 h-8" />,
    features: [
      {
        icon: <Upload className="w-6 h-6" />,
        title: "OCR & Data Extraction",
        description: "Advanced optical character recognition with intelligent data extraction",
        benefits: [
          "Extract data from invoices, receipts, and forms",
          "Support for multiple document formats",
          "Handwriting recognition",
          "Confidence scoring and validation"
        ]
      },
      {
        icon: <Search className="w-6 h-6" />,
        title: "Smart Organization",
        description: "Automatic document filing and organization with AI-powered categorization",
        benefits: [
          "Automatic folder organization",
          "Intelligent file naming",
          "Tag-based classification",
          "Full-text search capabilities"
        ]
      },
      {
        icon: <Lock className="w-6 h-6" />,
        title: "Secure Sharing",
        description: "Bank-grade security for document storage and client access",
        benefits: [
          "Encrypted document storage",
          "Granular access permissions",
          "Audit trail tracking",
          "Client portal integration"
        ]
      }
    ]
  },
  {
    id: "workflows",
    title: "Workflow Automation",
    description: "Streamline repetitive processes with intelligent automation",
    icon: <Workflow className="w-8 h-8" />,
    features: [
      {
        icon: <Zap className="w-6 h-6" />,
        title: "Process Automation",
        description: "Automate routine tasks and workflows to increase efficiency",
        benefits: [
          "Custom workflow builders",
          "Trigger-based automation",
          "Multi-step process chains",
          "Exception handling rules"
        ]
      },
      {
        icon: <Bell className="w-6 h-6" />,
        title: "Smart Notifications",
        description: "Intelligent notification system with priority-based alerts",
        benefits: [
          "Deadline reminders",
          "Task assignment notifications",
          "Client communication alerts",
          "Exception notifications"
        ]
      },
      {
        icon: <Target className="w-6 h-6" />,
        title: "Performance Tracking",
        description: "Monitor workflow efficiency with detailed analytics and reporting",
        benefits: [
          "Process completion times",
          "Bottleneck identification",
          "Team productivity metrics",
          "Client satisfaction scores"
        ]
      }
    ]
  },
  {
    id: "ai",
    title: "AI-Powered Insights",
    description: "Advanced analytics and machine learning for strategic decision making",
    icon: <Brain className="w-8 h-8" />,
    features: [
      {
        icon: <BarChart3 className="w-6 h-6" />,
        title: "Predictive Analytics",
        description: "AI-driven insights for business forecasting and trend analysis",
        benefits: [
          "Cash flow forecasting",
          "Seasonal trend analysis",
          "Risk assessment scoring",
          "Growth opportunity identification"
        ]
      },
      {
        icon: <Brain className="w-6 h-6" />,
        title: "Anomaly Detection",
        description: "Automatic detection of unusual patterns and potential issues",
        benefits: [
          "Fraud detection algorithms",
          "Expense anomaly alerts",
          "Revenue pattern analysis",
          "Compliance risk scoring"
        ]
      },
      {
        icon: <Target className="w-6 h-6" />,
        title: "Business Intelligence",
        description: "Comprehensive reporting and analytics for strategic planning",
        benefits: [
          "Interactive dashboards",
          "Custom report builders",
          "Benchmarking analysis",
          "KPI tracking and alerts"
        ]
      }
    ]
  },
  {
    id: "portal",
    title: "Client Portal",
    description: "Secure, branded client portals for document sharing and communication",
    icon: <Globe className="w-8 h-8" />,
    features: [
      {
        icon: <Upload className="w-6 h-6" />,
        title: "Document Exchange",
        description: "Secure document upload and download with version control",
        benefits: [
          "Drag-and-drop file uploads",
          "Document request workflows",
          "Version history tracking",
          "Download confirmation receipts"
        ]
      },
      {
        icon: <MessageSquare className="w-6 h-6" />,
        title: "Client Communication",
        description: "Direct messaging and collaboration tools for client interaction",
        benefits: [
          "Secure messaging system",
          "Video call integration",
          "Shared workspace areas",
          "Communication history logs"
        ]
      },
      {
        icon: <Settings className="w-6 h-6" />,
        title: "Custom Branding",
        description: "White-label portal with your firm's branding and custom domain",
        benefits: [
          "Custom logo and colors",
          "Branded domain names",
          "Personalized welcome messages",
          "Custom navigation menus"
        ]
      }
    ]
  }
]

const integrations = [
  { name: "QuickBooks Online", category: "Accounting" },
  { name: "QuickBooks Desktop", category: "Accounting" },
  { name: "Xero", category: "Accounting" },
  { name: "Excel", category: "Reporting" },
  { name: "Gmail", category: "Communication" },
  { name: "Outlook", category: "Communication" },
  { name: "Dropbox", category: "Storage" },
  { name: "Google Drive", category: "Storage" },
  { name: "DocuSign", category: "Signatures" },
  { name: "Zoom", category: "Video Calls" },
  { name: "Slack", category: "Team Chat" },
  { name: "Microsoft Teams", category: "Collaboration" }
]

export default function FeaturesPage() {
  const breadcrumbs = [
    { name: "Home", url: "https://advisoros.com" },
    { name: "Features", url: "https://advisoros.com/features" }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <StructuredData data={breadcrumbSchema(breadcrumbs)} />
      <Navigation />

      {/* Hero Section */}
      <HeroSection
        title="Powerful Features for Modern CPA Firms"
        subtitle="Complete Platform Suite"
        description="Everything you need to streamline operations, enhance client relationships, and scale your practice. From AI-powered automation to seamless integrations."
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
          "AI-powered document processing and insights",
          "Automated workflows and client portal access"
        ]}
      />

      {/* Feature Categories */}
      {featureCategories.map((category, categoryIndex) => (
        <section
          key={category.id}
          id={category.id}
          className={`py-20 ${categoryIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
                {category.icon}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {category.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {category.description}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.features.map((feature, featureIndex) => (
                <Card key={featureIndex} className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 text-blue-600 dark:text-blue-400">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Integrations Section */}
      <section className="py-20 bg-blue-50 dark:bg-blue-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Connect with the tools you already use. Our platform integrates with leading
              accounting software, communication tools, and business applications.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {integrations.map((integration, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs">
                      {integration.name.split(' ').map(word => word[0]).join('')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {integration.name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {integration.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Don't see your tool? We're constantly adding new integrations.
            </p>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Request Integration
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Enterprise-Grade Security
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your client data is protected with bank-level security and industry-leading
                compliance standards. Trust and security are at the core of everything we do.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    SOC 2 Type II
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Certified security controls and data protection
                  </p>
                </div>
                <div>
                  <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    256-bit SSL
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Military-grade encryption for all data transmission
                  </p>
                </div>
                <div>
                  <Database className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Data Backup
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automated daily backups with 99.9% uptime guarantee
                  </p>
                </div>
                <div>
                  <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Access Controls
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Granular permissions and two-factor authentication
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Compliance Standards
              </h3>
              <div className="space-y-4">
                {[
                  "AICPA Professional Standards",
                  "IRS Publication 4557 Guidelines",
                  "GDPR & Privacy Regulations",
                  "PIPEDA Compliance (Canada)",
                  "State Board Requirements"
                ].map((standard, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{standard}</span>
                  </div>
                ))}
              </div>

              <Button asChild className="w-full mt-6">
                <Link href="/security">
                  Learn More About Security
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Proven Performance
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Real results from CPA firms using AdvisorOS
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "75%", label: "Faster Client Onboarding", icon: <Clock className="w-6 h-6" /> },
              { value: "90%", label: "Reduction in Manual Tasks", icon: <Zap className="w-6 h-6" /> },
              { value: "40%", label: "Increase in Client Capacity", icon: <Users className="w-6 h-6" /> },
              { value: "99.9%", label: "System Uptime", icon: <Shield className="w-6 h-6" /> }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title="Ready to Experience These Features?"
        description="See how AdvisorOS can transform your CPA practice with a personalized demo or start your free trial today."
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