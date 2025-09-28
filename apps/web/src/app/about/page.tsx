import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { CTASection } from "@/components/marketing/cta-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Award,
  Shield,
  Target,
  Globe,
  Heart,
  BookOpen,
  TrendingUp,
  Linkedin,
  Twitter,
  Mail
} from "lucide-react"
import Link from "next/link"

const teamMembers = [
  {
    name: "Marcus Johnson",
    role: "CEO & Co-Founder",
    bio: "Former Big 4 partner with 15+ years in public accounting. Led digital transformation initiatives at major accounting firms before founding AdvisorOS.",
    education: "CPA, MBA from Wharton",
    expertise: ["Public Accounting", "Digital Transformation", "Firm Management"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "marcus@advisoros.com"
    }
  },
  {
    name: "Sarah Chen",
    role: "CTO & Co-Founder",
    bio: "Former Principal Engineer at leading fintech companies. Expert in building secure, scalable platforms for financial services and accounting automation.",
    education: "MS Computer Science, Stanford",
    expertise: ["Financial Technology", "Cloud Architecture", "AI/ML"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "sarah@advisoros.com"
    }
  },
  {
    name: "David Rodriguez",
    role: "VP of Product",
    bio: "Product leader with deep CPA industry knowledge. Previously led product teams at QuickBooks and other leading accounting software companies.",
    education: "CPA, BS Accounting",
    expertise: ["Product Strategy", "User Experience", "Accounting Workflows"],
    social: {
      linkedin: "#",
      email: "david@advisoros.com"
    }
  },
  {
    name: "Jennifer Walsh",
    role: "VP of Customer Success",
    bio: "Dedicated to ensuring CPA firms achieve maximum value from our platform. Former practice manager with extensive client relationship experience.",
    education: "CPA, MS Accounting",
    expertise: ["Client Success", "Training", "Change Management"],
    social: {
      linkedin: "#",
      email: "jennifer@advisoros.com"
    }
  },
  {
    name: "Michael Thompson",
    role: "VP of Engineering",
    bio: "Infrastructure and security expert with 12+ years in enterprise software. Ensures our platform meets the highest standards for reliability and security.",
    education: "MS Software Engineering",
    expertise: ["Platform Security", "Scalability", "DevOps"],
    social: {
      linkedin: "#",
      email: "michael@advisoros.com"
    }
  },
  {
    name: "Lisa Park",
    role: "VP of Marketing",
    bio: "Growth marketing specialist focused on helping CPA firms discover and adopt modern practice management solutions. Former marketing leader at accounting industry publications.",
    education: "MBA Marketing",
    expertise: ["Growth Marketing", "Content Strategy", "Industry Relations"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "lisa@advisoros.com"
    }
  }
]

const values = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Security First",
    description: "We treat your client data with the utmost care, implementing bank-level security and compliance standards in everything we build."
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "CPA-Centric Design",
    description: "Every feature is designed by and for accounting professionals. We understand your workflows because we've lived them."
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Continuous Innovation",
    description: "We're constantly evolving our platform based on industry trends and customer feedback to keep you ahead of the curve."
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Customer Success",
    description: "Your success is our success. We're committed to providing exceptional support and ensuring you achieve your goals."
  }
]

const milestones = [
  {
    year: "2020",
    title: "Company Founded",
    description: "AdvisorOS was born from the frustration of manual processes in accounting firms."
  },
  {
    year: "2021",
    title: "First 100 Customers",
    description: "Reached our first milestone with early adopters seeing immediate efficiency gains."
  },
  {
    year: "2022",
    title: "QuickBooks Partnership",
    description: "Became an official QuickBooks Solution Provider with deep integration capabilities."
  },
  {
    year: "2023",
    title: "AI Features Launch",
    description: "Introduced AI-powered document processing and predictive analytics."
  },
  {
    year: "2024",
    title: "500+ Firms",
    description: "Serving over 500 CPA firms across North America with continued growth."
  }
]

const stats = [
  { value: "500+", label: "CPA Firms Served" },
  { value: "10,000+", label: "Clients Managed" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "24/7", label: "Customer Support" }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Built by CPAs, for CPAs
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're on a mission to transform how CPA firms operate by eliminating manual processes,
              enhancing client relationships, and enabling firms to focus on high-value advisory services.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
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

      {/* Our Story */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Our Story
              </h2>
              <div className="space-y-6 text-gray-600 dark:text-gray-300">
                <p>
                  AdvisorOS was founded in 2020 by a team of former Big 4 partners and
                  technology leaders who experienced firsthand the inefficiencies plaguing
                  modern accounting practices.
                </p>
                <p>
                  After spending countless hours on manual data entry, chasing client documents,
                  and managing disconnected systems, we knew there had to be a better way.
                  We envisioned a platform that would automate routine tasks, streamline
                  client communication, and provide actionable insights.
                </p>
                <p>
                  Today, AdvisorOS serves over 500 CPA firms across North America, helping
                  them reduce administrative time by 75% and increase client capacity by 40%
                  without adding staff. We're proud to be the trusted technology partner
                  for forward-thinking accounting professionals.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Company Milestones
              </h3>
              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-16 text-right">
                      <Badge variant="outline" className="text-xs">
                        {milestone.year}
                      </Badge>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {milestone.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission & Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're driven by the belief that technology should enhance, not complicate,
              the practice of accounting. Our values guide everything we do.
            </p>
          </div>

          <div className="mb-16">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 mx-auto">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg text-blue-800 dark:text-blue-200">
                  To empower CPA firms with intelligent automation and seamless integrations
                  that eliminate manual work, enhance client relationships, and enable
                  accountants to focus on strategic advisory services that drive business growth.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center h-full">
                <CardHeader>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 mx-auto text-blue-600 dark:text-blue-400">
                    {value.icon}
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Leadership Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Meet the experienced professionals driving our vision forward
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="h-full">
                <CardHeader className="text-center">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-4 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400 font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {member.bio}
                  </p>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                      Education
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {member.education}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                      Expertise
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {member.expertise.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {member.social.linkedin && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={member.social.linkedin}>
                          <Linkedin className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    {member.social.twitter && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={member.social.twitter}>
                          <Twitter className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`mailto:${member.social.email}`}>
                        <Mail className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Recognition */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Industry Recognition
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Trusted by industry leaders and recognized for excellence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "QuickBooks Solution Provider",
                description: "Official partner with deep integration capabilities",
                icon: <Award className="w-8 h-8" />
              },
              {
                title: "SOC 2 Type II Certified",
                description: "Highest standards for security and compliance",
                icon: <Shield className="w-8 h-8" />
              },
              {
                title: "CPA Practice Advisor Top Pick",
                description: "Recognized as leading practice management solution",
                icon: <BookOpen className="w-8 h-8" />
              },
              {
                title: "AICPA Endorsed",
                description: "Meets professional standards for CPA firms",
                icon: <Users className="w-8 h-8" />
              }
            ].map((recognition, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 mx-auto text-blue-600 dark:text-blue-400">
                    {recognition.icon}
                  </div>
                  <CardTitle className="text-lg">{recognition.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {recognition.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Careers */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6 text-blue-600 dark:text-blue-400">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Join Our Team
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            We're always looking for talented individuals who share our passion for
            transforming the accounting industry. Join us in building the future of CPA practice management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/careers">
                View Open Positions
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title="Ready to Transform Your Practice?"
        description="Join hundreds of successful CPA firms using AdvisorOS to streamline operations and grow their business."
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