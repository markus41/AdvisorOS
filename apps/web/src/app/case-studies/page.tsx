import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  ArrowRight,
  Building,
  CheckCircle,
  BarChart3
} from "lucide-react"
import Link from "next/link"

const caseStudies = [
  {
    id: 1,
    client: "Chen & Associates CPA",
    industry: "Multi-Practice Firm",
    size: "25 Staff, 200+ Clients",
    challenge: "Manual processes consuming 60% of staff time, leading to capacity constraints and delayed client deliverables.",
    solution: "Implemented complete AdvisorOS platform with QuickBooks integration, automated workflows, and client portals.",
    results: {
      timeReduction: "75%",
      clientIncrease: "40%",
      revenueGrowth: "$320K",
      paybackPeriod: "3 months"
    },
    testimonial: "AdvisorOS transformed our practice. We've tripled our efficiency and can now focus on high-value advisory services instead of data entry.",
    author: "Sarah Chen, Managing Partner",
    tags: ["QuickBooks Integration", "Workflow Automation", "Client Portal"],
    featured: true
  },
  {
    id: 2,
    client: "Rodriguez Tax Solutions",
    industry: "Tax Preparation Firm",
    size: "8 Staff, 500+ Clients",
    challenge: "Tax season bottlenecks due to manual document collection and processing, leading to overtime costs and client frustration.",
    solution: "Deployed automated document collection, OCR processing, and client self-service portals.",
    results: {
      timeReduction: "65%",
      clientIncrease: "35%",
      revenueGrowth: "$180K",
      paybackPeriod: "4 months"
    },
    testimonial: "The document automation alone has saved us hundreds of hours during tax season. Our clients love the convenience of the portal.",
    author: "Michael Rodriguez, CPA",
    tags: ["Document Automation", "Tax Season", "OCR Processing"]
  },
  {
    id: 3,
    client: "Walsh Financial Group",
    industry: "Advisory Services",
    size: "15 Staff, 150+ Clients",
    challenge: "Disconnected systems making it difficult to provide comprehensive advisory services and maintain client relationships.",
    solution: "Integrated platform connecting all client data, automated reporting, and advisory workflow management.",
    results: {
      timeReduction: "70%",
      clientIncrease: "45%",
      revenueGrowth: "$250K",
      paybackPeriod: "2.5 months"
    },
    testimonial: "Having all client information in one place has revolutionized how we deliver advisory services. We're more proactive and our clients notice the difference.",
    author: "Jennifer Walsh, Senior Partner",
    tags: ["Advisory Services", "Client Management", "Integrated Platform"]
  },
  {
    id: 4,
    client: "Summit CPA Partners",
    industry: "Regional CPA Firm",
    size: "35 Staff, 400+ Clients",
    challenge: "Scaling challenges with inconsistent processes across multiple office locations and service lines.",
    solution: "Standardized workflows, centralized client management, and performance analytics across all locations.",
    results: {
      timeReduction: "60%",
      clientIncrease: "30%",
      revenueGrowth: "$450K",
      paybackPeriod: "5 months"
    },
    testimonial: "AdvisorOS helped us standardize our operations across all offices. We now have consistency and visibility that we never had before.",
    author: "Robert Martinez, Managing Partner",
    tags: ["Multi-Location", "Standardization", "Performance Analytics"]
  },
  {
    id: 5,
    client: "Green Valley Accounting",
    industry: "Small Business Focus",
    size: "5 Staff, 100+ Clients",
    challenge: "Solo practitioner growth limited by administrative burden and inability to scale operations efficiently.",
    solution: "Automated client onboarding, QuickBooks sync, and basic workflow automation to enable growth without additional staff.",
    results: {
      timeReduction: "80%",
      clientIncrease: "60%",
      revenueGrowth: "$120K",
      paybackPeriod: "3 months"
    },
    testimonial: "As a solo practitioner, AdvisorOS allowed me to serve 60% more clients without hiring additional staff. It's been a game-changer for my practice.",
    author: "David Kim, CPA",
    tags: ["Solo Practice", "Small Business", "Client Onboarding"]
  },
  {
    id: 6,
    client: "Metro Tax & Advisory",
    industry: "Urban CPA Firm",
    size: "20 Staff, 300+ Clients",
    challenge: "High client expectations for digital services and real-time access to financial information.",
    solution: "Modern client portals, real-time QuickBooks sync, and mobile-friendly interfaces for on-the-go access.",
    results: {
      timeReduction: "55%",
      clientIncrease: "25%",
      revenueGrowth: "$200K",
      paybackPeriod: "4 months"
    },
    testimonial: "Our clients expect modern, digital experiences. AdvisorOS helps us meet those expectations while improving our internal efficiency.",
    author: "Amanda Foster, Partner",
    tags: ["Digital Transformation", "Client Experience", "Mobile Access"]
  }
]

const industryStats = [
  {
    label: "Average Time Reduction",
    value: "68%",
    icon: <Clock className="w-6 h-6" />
  },
  {
    label: "Average Client Increase",
    value: "39%",
    icon: <Users className="w-6 h-6" />
  },
  {
    label: "Average Revenue Growth",
    value: "$253K",
    icon: <DollarSign className="w-6 h-6" />
  },
  {
    label: "Average Payback Period",
    value: "3.6 months",
    icon: <TrendingUp className="w-6 h-6" />
  }
]

export default function CaseStudiesPage() {
  const featuredCase = caseStudies.find(study => study.featured)
  const otherCases = caseStudies.filter(study => !study.featured)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Success Stories
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            See how CPA firms across North America are transforming their practices
            with AdvisorOS and achieving remarkable results.
          </p>
        </div>
      </section>

      {/* Industry Stats */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Proven Results Across Our Customer Base
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Real metrics from CPA firms using AdvisorOS
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {industryStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      {featuredCase && (
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-blue-600 text-white mb-4">Featured Case Study</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {featuredCase.client}
              </h2>
            </div>

            <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-800">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {featuredCase.industry}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {featuredCase.size}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Challenge
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {featuredCase.challenge}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Solution
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {featuredCase.solution}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {featuredCase.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-8">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-6">
                    Results Achieved
                  </h4>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {featuredCase.results.timeReduction}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Time Reduction
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {featuredCase.results.clientIncrease}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Client Increase
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {featuredCase.results.revenueGrowth}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Revenue Growth
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {featuredCase.results.paybackPeriod}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Payback Period
                      </div>
                    </div>
                  </div>

                  <blockquote className="bg-white dark:bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
                    <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                      "{featuredCase.testimonial}"
                    </p>
                    <cite className="text-sm font-semibold text-gray-900 dark:text-white">
                      {featuredCase.author}
                    </cite>
                  </blockquote>

                  <Button asChild className="w-full mt-6">
                    <Link href={`/case-studies/${featuredCase.id}`}>
                      Read Full Case Study
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Other Case Studies */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              More Success Stories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover how firms of all sizes are achieving remarkable results
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherCases.map((caseStudy) => (
              <Card key={caseStudy.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{caseStudy.client}</CardTitle>
                      <CardDescription>{caseStudy.industry}</CardDescription>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {caseStudy.size}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {caseStudy.results.timeReduction}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Time Saved
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {caseStudy.results.clientIncrease}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        More Clients
                      </div>
                    </div>
                  </div>

                  <blockquote className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "{caseStudy.testimonial.substring(0, 120)}..."
                  </blockquote>

                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    {caseStudy.author}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {caseStudy.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button variant="outline" asChild className="w-full mt-4">
                    <Link href={`/case-studies/${caseStudy.id}`}>
                      Read Full Story
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of CPA firms already transforming their practices with AdvisorOS.
            See how we can help you achieve similar results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/demo">
                Schedule a Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/trial">
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}