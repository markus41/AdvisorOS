import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, Users, FileText, Globe } from "lucide-react"

const privacySections = [
  {
    id: "information-collection",
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create an AdvisorOS account, we collect your name, email address, company information, and billing details. This information is necessary to provide you with our services and communicate with you about your account."
      },
      {
        subtitle: "Usage Data",
        text: "We automatically collect information about how you use our platform, including features accessed, time spent, and performance metrics. This data helps us improve our services and provide better support."
      },
      {
        subtitle: "Client Data",
        text: "As a practice management platform, AdvisorOS processes client data that you upload or sync from other systems. This may include financial records, documents, and communication logs. We treat all client data with the highest level of security and confidentiality."
      },
      {
        subtitle: "Technical Information",
        text: "We collect technical data such as IP addresses, browser type, device information, and cookies to ensure platform security and optimal performance."
      }
    ]
  },
  {
    id: "data-usage",
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Service Provision",
        text: "We use your information to provide, maintain, and improve our platform services, including account management, customer support, and feature development."
      },
      {
        subtitle: "Communication",
        text: "We may use your contact information to send you important updates about our services, security notifications, and promotional content (which you can opt out of at any time)."
      },
      {
        subtitle: "Analytics and Improvement",
        text: "We analyze usage patterns to understand how our platform is used and to identify areas for improvement, always in an aggregated and anonymized manner."
      },
      {
        subtitle: "Legal Compliance",
        text: "We may use your information to comply with applicable laws, regulations, and legal processes."
      }
    ]
  },
  {
    id: "data-sharing",
    title: "Information Sharing and Disclosure",
    content: [
      {
        subtitle: "No Sale of Personal Data",
        text: "We do not sell, rent, or trade your personal information to third parties for marketing purposes."
      },
      {
        subtitle: "Service Providers",
        text: "We may share information with trusted third-party service providers who assist us in operating our platform, such as cloud hosting providers and payment processors. These providers are bound by strict confidentiality agreements."
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information if required by law, regulation, or legal process, or if we believe disclosure is necessary to protect our rights or the safety of our users."
      },
      {
        subtitle: "Business Transfers",
        text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction, subject to the same privacy protections."
      }
    ]
  },
  {
    id: "data-security",
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. We use industry-standard security protocols to protect your information."
      },
      {
        subtitle: "Access Controls",
        text: "We implement strict access controls, including multi-factor authentication, role-based permissions, and regular access reviews to ensure only authorized personnel can access your data."
      },
      {
        subtitle: "Infrastructure Security",
        text: "Our platform is hosted on secure, SOC 2 Type II certified infrastructure with 24/7 monitoring, intrusion detection, and automated backup systems."
      },
      {
        subtitle: "Regular Audits",
        text: "We conduct regular security audits and penetration testing to identify and address potential vulnerabilities."
      }
    ]
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: [
      {
        subtitle: "Account Data",
        text: "We retain your account information for as long as your account is active or as needed to provide you services. You may request deletion of your account at any time."
      },
      {
        subtitle: "Client Data",
        text: "Client data is retained according to your preferences and legal requirements. You have full control over your client data and can delete it at any time through the platform."
      },
      {
        subtitle: "Legal Requirements",
        text: "Some data may be retained longer if required by law or regulation, such as financial records or audit trails."
      },
      {
        subtitle: "Backup Systems",
        text: "Data in backup systems is automatically purged according to our retention schedule, typically within 90 days after deletion from the primary system."
      }
    ]
  },
  {
    id: "user-rights",
    title: "Your Rights and Choices",
    content: [
      {
        subtitle: "Access and Portability",
        text: "You have the right to access your personal information and export your data in a portable format at any time through your account settings."
      },
      {
        subtitle: "Correction and Updates",
        text: "You can update your account information and preferences directly through the platform or by contacting our support team."
      },
      {
        subtitle: "Deletion",
        text: "You may request deletion of your account and associated data. Some information may be retained for legal or security purposes as permitted by law."
      },
      {
        subtitle: "Opt-out",
        text: "You can opt out of promotional communications at any time using the unsubscribe link in emails or through your account preferences."
      }
    ]
  }
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Your privacy is important to us. This policy explains how we collect,
            use, and protect your information when you use AdvisorOS.
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      {/* Privacy Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <CardTitle>Data Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Bank-level encryption and security measures protect all your data,
                  both in transit and at rest.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                  <Eye className="w-6 h-6" />
                </div>
                <CardTitle>Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  We clearly explain what data we collect, how we use it,
                  and who we share it with.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle>Your Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  You have full control over your data with easy access,
                  correction, and deletion options.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-0 pb-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Important Notice
              </h2>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                AdvisorOS is designed specifically for CPA firms and accounting professionals.
                We understand the sensitive nature of financial data and have built our platform
                with privacy and security as foundational principles.
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                This policy applies to all users of AdvisorOS and explains our practices
                regarding the collection, use, and protection of your information.
              </p>
            </div>

            {privacySections.map((section, index) => (
              <div key={section.id} className="mb-12">
                <h2 id={section.id} className="text-2xl font-bold text-gray-900 dark:text-white mb-6 scroll-mt-24">
                  {index + 1}. {section.title}
                </h2>

                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {item.subtitle}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Additional Sections */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                7. Cookies and Tracking
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Essential Cookies
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We use essential cookies to provide basic functionality such as user authentication,
                    session management, and security features. These cookies are necessary for the platform to function.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Analytics Cookies
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    With your consent, we use analytics cookies to understand how you use our platform
                    and improve user experience. You can disable these cookies in your browser settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                8. International Data Transfers
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                AdvisorOS primarily operates in North America. If you are located outside of North America,
                your information may be transferred to and processed in the United States where our servers
                are located.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We ensure that any international transfers comply with applicable data protection laws
                and implement appropriate safeguards to protect your information.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                9. Children's Privacy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                AdvisorOS is not intended for use by individuals under the age of 18.
                We do not knowingly collect personal information from children under 18.
                If we become aware that we have collected such information, we will delete it promptly.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                10. Changes to This Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                We may update this privacy policy from time to time to reflect changes in our practices
                or applicable laws. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Posting the updated policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Displaying a notification in the platform</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your continued use of AdvisorOS after the effective date of any changes
                constitutes your acceptance of the updated policy.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                11. Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions about this privacy policy or our data practices,
                please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white font-medium">Privacy Officer</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">AdvisorOS, Inc.</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">123 Business Avenue, Suite 100</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Business City, BC 12345</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Email: privacy@advisoros.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}