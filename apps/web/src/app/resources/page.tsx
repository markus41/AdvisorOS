import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  BookOpen,
  Video,
  Lightbulb,
  Search,
  Calendar,
  Users,
  ArrowRight,
  ExternalLink,
  Play
} from "lucide-react"
import Link from "next/link"

const resourceCategories = [
  {
    id: "guides",
    title: "Implementation Guides",
    description: "Step-by-step guides to help you get the most out of AdvisorOS",
    icon: <BookOpen className="w-8 h-8" />,
    color: "blue"
  },
  {
    id: "whitepapers",
    title: "White Papers",
    description: "In-depth analysis of industry trends and best practices",
    icon: <FileText className="w-8 h-8" />,
    color: "green"
  },
  {
    id: "webinars",
    title: "Webinars",
    description: "Live and recorded sessions with industry experts",
    icon: <Video className="w-8 h-8" />,
    color: "purple"
  },
  {
    id: "templates",
    title: "Templates & Tools",
    description: "Ready-to-use templates and calculators for your practice",
    icon: <Lightbulb className="w-8 h-8" />,
    color: "orange"
  }
]

const featuredResources = [
  {
    id: 1,
    title: "Complete Guide to CPA Firm Automation",
    description: "A comprehensive 50-page guide covering everything from workflow automation to client communication strategies.",
    category: "Implementation Guide",
    type: "PDF Guide",
    pages: 50,
    downloadCount: "2.5K",
    featured: true,
    downloadUrl: "/resources/automation-guide.pdf"
  },
  {
    id: 2,
    title: "The Future of Accounting: AI & Machine Learning",
    description: "Industry analysis of how artificial intelligence is transforming the accounting profession and what it means for your firm.",
    category: "White Paper",
    type: "Research Report",
    pages: 24,
    downloadCount: "1.8K",
    downloadUrl: "/resources/ai-future-accounting.pdf"
  },
  {
    id: 3,
    title: "Tax Season Efficiency Webinar Series",
    description: "Three-part webinar series covering preparation, execution, and post-season analysis for maximum efficiency.",
    category: "Webinar",
    type: "Video Series",
    duration: "3 hours",
    watchCount: "3.2K",
    upcoming: true,
    registrationUrl: "/webinars/tax-season-efficiency"
  }
]

const guides = [
  {
    title: "QuickBooks Integration Setup",
    description: "Complete setup guide for connecting your QuickBooks data with AdvisorOS",
    pages: 15,
    downloadCount: "1.2K",
    downloadUrl: "/resources/quickbooks-setup.pdf"
  },
  {
    title: "Client Portal Best Practices",
    description: "How to maximize client adoption and engagement with your portal",
    pages: 22,
    downloadCount: "950",
    downloadUrl: "/resources/client-portal-best-practices.pdf"
  },
  {
    title: "Workflow Automation Playbook",
    description: "Pre-built workflows and automation strategies for common CPA tasks",
    pages: 35,
    downloadCount: "1.5K",
    downloadUrl: "/resources/workflow-automation.pdf"
  },
  {
    title: "Security & Compliance Checklist",
    description: "Essential security measures and compliance requirements for CPA firms",
    pages: 12,
    downloadCount: "800",
    downloadUrl: "/resources/security-checklist.pdf"
  }
]

const whitepapers = [
  {
    title: "The ROI of Practice Management Software",
    description: "Quantitative analysis of efficiency gains and cost savings from modern practice management tools",
    pages: 28,
    downloadCount: "1.1K",
    downloadUrl: "/resources/roi-practice-management.pdf"
  },
  {
    title: "Client Experience in the Digital Age",
    description: "How CPA firms can meet evolving client expectations through technology",
    pages: 20,
    downloadCount: "890",
    downloadUrl: "/resources/digital-client-experience.pdf"
  },
  {
    title: "Remote Work Best Practices for CPA Firms",
    description: "Strategies and tools for managing distributed accounting teams effectively",
    pages: 18,
    downloadCount: "1.3K",
    downloadUrl: "/resources/remote-work-best-practices.pdf"
  }
]

const upcomingWebinars = [
  {
    title: "Mastering Client Communication in 2024",
    date: "2024-02-15",
    time: "2:00 PM EST",
    presenter: "Jennifer Walsh, VP of Customer Success",
    registrationUrl: "/webinars/client-communication-2024"
  },
  {
    title: "Advanced QuickBooks Integration Techniques",
    date: "2024-02-22",
    time: "1:00 PM EST",
    presenter: "David Rodriguez, VP of Product",
    registrationUrl: "/webinars/advanced-quickbooks"
  },
  {
    title: "AI in Accounting: Practical Applications",
    date: "2024-03-01",
    time: "3:00 PM EST",
    presenter: "Sarah Chen, CTO",
    registrationUrl: "/webinars/ai-practical-applications"
  }
]

const templates = [
  {
    title: "Client Onboarding Checklist",
    description: "Comprehensive checklist to ensure smooth client onboarding",
    type: "Excel Template",
    downloadUrl: "/templates/onboarding-checklist.xlsx"
  },
  {
    title: "ROI Calculator",
    description: "Calculate the return on investment for practice management software",
    type: "Interactive Tool",
    downloadUrl: "/tools/roi-calculator"
  },
  {
    title: "Workflow Documentation Template",
    description: "Standardized template for documenting your firm's workflows",
    type: "Word Document",
    downloadUrl: "/templates/workflow-documentation.docx"
  },
  {
    title: "Client Communication Scripts",
    description: "Pre-written email templates for common client interactions",
    type: "Template Pack",
    downloadUrl: "/templates/communication-scripts.zip"
  }
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Resources for CPA Firms
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Everything you need to modernize your practice, improve efficiency,
              and deliver exceptional client service. All resources are free and
              designed specifically for accounting professionals.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search resources..."
                className="pl-10 pr-4 py-3 rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {resourceCategories.map((category) => (
              <Card key={category.id} className="text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto ${
                    category.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    category.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                    category.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  }`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Featured Resources
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Our most popular and comprehensive resources for CPA firms
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {featuredResources.map((resource) => (
              <Card key={resource.id} className={`${resource.featured ? 'border-2 border-blue-500 shadow-lg' : ''}`}>
                {resource.featured && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline">{resource.category}</Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {resource.type}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {resource.pages ? `${resource.pages} pages` : resource.duration}
                    </span>
                    <span>
                      {resource.downloadCount ? `${resource.downloadCount} downloads` : `${resource.watchCount} views`}
                    </span>
                  </div>

                  {resource.upcoming ? (
                    <Button asChild className="w-full">
                      <Link href={resource.registrationUrl!}>
                        Register Now
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href={resource.downloadUrl!}>
                        <Download className="mr-2 w-4 h-4" />
                        Download Free
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Guides */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Implementation Guides
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Step-by-step guides to help you implement and optimize AdvisorOS
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {guides.map((guide, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {guide.pages} pages
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {guide.downloadCount} downloads
                    </span>
                  </div>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={guide.downloadUrl}>
                      <Download className="mr-2 w-4 h-4" />
                      Download Guide
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* White Papers */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              White Papers & Research
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              In-depth analysis and insights on accounting industry trends
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {whitepapers.map((paper, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {paper.pages} pages
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {paper.downloadCount} downloads
                    </span>
                  </div>
                  <CardTitle className="text-lg">{paper.title}</CardTitle>
                  <CardDescription>{paper.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={paper.downloadUrl}>
                      <Download className="mr-2 w-4 h-4" />
                      Download Paper
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Upcoming Webinars
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join our live sessions with industry experts and product specialists
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {upcomingWebinars.map((webinar, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mr-3">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(webinar.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {webinar.time}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{webinar.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center mt-2">
                      <Users className="w-4 h-4 mr-1" />
                      {webinar.presenter}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={webinar.registrationUrl}>
                      Register Free
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <Link href="/webinars">
                View All Webinars
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Templates & Tools */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Templates & Tools
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Ready-to-use templates and calculators to streamline your practice
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 mx-auto mb-4">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <Badge variant="outline" className="text-xs">
                      {template.type}
                    </Badge>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={template.downloadUrl}>
                      <Download className="mr-2 w-4 h-4" />
                      Download
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Stay Informed with Industry Insights
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get new resources, industry updates, and best practices delivered to your inbox monthly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input
              placeholder="Your email address"
              className="flex-1 bg-white text-gray-900"
            />
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}