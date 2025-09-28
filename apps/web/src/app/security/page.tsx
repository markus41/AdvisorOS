import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Lock,
  Eye,
  Server,
  FileCheck,
  Users,
  Globe,
  CheckCircle,
  AlertTriangle,
  Download,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

const securityFeatures = [
  {
    icon: <Lock className="w-8 h-8" />,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit with TLS 1.3 and at rest with AES-256 encryption",
    details: [
      "256-bit AES encryption for data at rest",
      "TLS 1.3 for data in transit",
      "Perfect Forward Secrecy",
      "Hardware Security Modules (HSMs)"
    ]
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Access Controls",
    description: "Comprehensive access management with multi-factor authentication and role-based permissions",
    details: [
      "Multi-factor authentication (MFA)",
      "Single Sign-On (SSO) integration",
      "Role-based access control (RBAC)",
      "Just-in-time access provisioning"
    ]
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: "Audit & Monitoring",
    description: "Complete audit trails and real-time monitoring for all platform activities",
    details: [
      "Comprehensive audit logging",
      "Real-time security monitoring",
      "Automated threat detection",
      "Security incident response"
    ]
  },
  {
    icon: <Server className="w-8 h-8" />,
    title: "Infrastructure Security",
    description: "Enterprise-grade infrastructure with 24/7 monitoring and automated backups",
    details: [
      "SOC 2 Type II certified data centers",
      "24/7 security operations center",
      "Automated backup and recovery",
      "Network segmentation and firewalls"
    ]
  }
]

const certifications = [
  {
    title: "SOC 2 Type II",
    description: "Security, availability, and confidentiality controls",
    status: "Certified",
    date: "Annual audit",
    color: "green"
  },
  {
    title: "ISO 27001",
    description: "Information security management system",
    status: "In Progress",
    date: "Expected 2024",
    color: "blue"
  },
  {
    title: "AICPA Standards",
    description: "Compliance with CPA professional standards",
    status: "Compliant",
    date: "Ongoing",
    color: "green"
  },
  {
    title: "GDPR",
    description: "European data protection regulation",
    status: "Compliant",
    date: "Verified 2024",
    color: "green"
  }
]

const securityPolicies = [
  {
    title: "Data Retention Policy",
    description: "Clear guidelines on how long we retain different types of data",
    downloadUrl: "/security/data-retention-policy.pdf"
  },
  {
    title: "Incident Response Plan",
    description: "Our process for handling security incidents and breaches",
    downloadUrl: "/security/incident-response-plan.pdf"
  },
  {
    title: "Vulnerability Management",
    description: "How we identify, assess, and remediate security vulnerabilities",
    downloadUrl: "/security/vulnerability-management.pdf"
  },
  {
    title: "Business Continuity Plan",
    description: "Procedures to ensure service continuity during disruptions",
    downloadUrl: "/security/business-continuity-plan.pdf"
  }
]

const penetrationTesting = [
  {
    date: "Q4 2023",
    firm: "CyberSecurity Associates",
    scope: "Web application and API security",
    findings: "0 Critical, 1 Medium (resolved)",
    status: "Passed"
  },
  {
    date: "Q2 2023",
    firm: "SecureTest Inc.",
    scope: "Infrastructure and network security",
    findings: "0 Critical, 0 High, 2 Medium (resolved)",
    status: "Passed"
  },
  {
    date: "Q4 2022",
    firm: "PenTest Pro",
    scope: "Full application security assessment",
    findings: "0 Critical, 0 High, 1 Medium (resolved)",
    status: "Passed"
  }
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Security & Compliance
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your data security is our top priority. Learn about the comprehensive measures
            we take to protect your sensitive financial information and maintain compliance
            with industry standards.
          </p>
        </div>
      </section>

      {/* Security Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We implement multiple layers of security to protect your data and ensure
              compliance with the strictest industry standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Certifications & Compliance
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              We maintain the highest standards of security and compliance certification
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <Badge
                      className={`${
                        cert.color === 'green'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {cert.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{cert.title}</CardTitle>
                  <CardDescription>{cert.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cert.date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Security Architecture
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Our security architecture is designed with defense in depth principles,
                ensuring multiple layers of protection for your sensitive data.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4 mt-1">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Network Security
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      WAF protection, DDoS mitigation, and network segmentation
                      to prevent unauthorized access and attacks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mr-4 mt-1">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Application Security
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Secure coding practices, regular security testing, and
                      vulnerability assessments for all application layers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4 mt-1">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Data Protection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      End-to-end encryption, secure key management, and data
                      classification to protect sensitive information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Security Metrics
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    99.9%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Uptime SLA
                  </div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Monitoring
                  </div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    &lt;15min
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Incident Response
                  </div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    Zero
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Data Breaches
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Penetration Testing */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Third-Party Security Testing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Regular independent security assessments by leading cybersecurity firms
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileCheck className="w-6 h-6 mr-2" />
                Penetration Testing Results
              </CardTitle>
              <CardDescription>
                We conduct quarterly penetration testing with independent security firms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Testing Firm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Scope
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Findings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {penetrationTesting.map((test, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {test.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {test.firm}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {test.scope}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {test.findings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {test.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security Policies */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Security Policies & Documentation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Comprehensive security policies and procedures are available for review
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {securityPolicies.map((policy, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{policy.title}</CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={policy.downloadUrl}>
                      <Download className="mr-2 w-4 h-4" />
                      Download Policy
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader>
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400 mr-4" />
                <div>
                  <CardTitle className="text-orange-900 dark:text-orange-100">
                    Security Incident Reporting
                  </CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    If you suspect a security incident, please contact us immediately
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Emergency Contact
                  </h3>
                  <p className="text-orange-800 dark:text-orange-200 text-sm mb-2">
                    For immediate security concerns:
                  </p>
                  <p className="text-orange-900 dark:text-orange-100 font-medium">
                    security@advisoros.com
                  </p>
                  <p className="text-orange-900 dark:text-orange-100 font-medium">
                    1-800-SECURITY (24/7)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Response Time
                  </h3>
                  <p className="text-orange-800 dark:text-orange-200 text-sm">
                    We commit to acknowledging security reports within 1 hour
                    and providing initial assessment within 4 hours.
                  </p>
                </div>
              </div>
              <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
                <Link href="/security/report-incident">
                  Report Security Incident
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Need More Information?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Our security team is available to answer questions and provide additional
            documentation for your security reviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">
                Contact Security Team
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/compliance">
                View Compliance Details
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}