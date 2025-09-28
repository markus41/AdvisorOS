import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield, AlertTriangle, Scale, Users, Globe } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            These terms govern your use of AdvisorOS and the services we provide.
            Please read them carefully.
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      {/* Terms Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                  <Scale className="w-6 h-6" />
                </div>
                <CardTitle>Fair Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Our terms are designed to be fair and transparent,
                  protecting both your interests and ours.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Clear explanation of your rights as a user and our
                  responsibilities as a service provider.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle>Mutual Respect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  These terms establish a framework for a respectful
                  and productive business relationship.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-0 pb-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Agreement Overview
              </h2>
              <p className="text-blue-800 dark:text-blue-200">
                By accessing or using AdvisorOS, you agree to be bound by these Terms of Service
                and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                These terms apply to all users, including CPA firms, accounting professionals, and their clients.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you
                and AdvisorOS, Inc. ("AdvisorOS," "we," "our," or "us") regarding your use of the
                AdvisorOS platform and related services.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                By creating an account, accessing our platform, or using any of our services,
                you acknowledge that you have read, understood, and agree to be bound by these Terms
                and our Privacy Policy, which is incorporated herein by reference.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We may modify these Terms at any time, and such modifications will be effective
                immediately upon posting. Your continued use of our services after any such changes
                constitutes your acceptance of the new Terms.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                2. Description of Service
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                AdvisorOS is a cloud-based practice management platform designed specifically for
                CPA firms and accounting professionals. Our services include:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Client relationship management and communication tools</li>
                <li>QuickBooks integration and financial data synchronization</li>
                <li>Document management and processing with OCR capabilities</li>
                <li>Workflow automation and task management</li>
                <li>Client portals for secure document sharing and communication</li>
                <li>Reporting and analytics features</li>
                <li>AI-powered insights and automation tools</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of our services
                at any time, with or without notice, though we will make reasonable efforts to
                provide advance notice of significant changes.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                3. User Accounts and Registration
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Account Creation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    To use AdvisorOS, you must create an account and provide accurate, complete,
                    and current information. You are responsible for maintaining the confidentiality
                    of your account credentials and for all activities that occur under your account.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Eligibility
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    You must be at least 18 years old and have the legal capacity to enter into
                    this agreement. AdvisorOS is intended for use by licensed accounting professionals
                    and their authorized staff members.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Account Security
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    You must immediately notify us of any unauthorized access to your account
                    or any other breach of security. We are not liable for any loss or damage
                    arising from your failure to protect your account information.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                4. Acceptable Use Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                You agree to use AdvisorOS only for lawful purposes and in accordance with these Terms.
                You may not use our services:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>To violate any applicable local, state, national, or international law</li>
                <li>To transmit or store any unlawful, harmful, threatening, or abusive content</li>
                <li>To impersonate any person or entity or misrepresent your affiliation</li>
                <li>To interfere with or disrupt the service or servers connected to the service</li>
                <li>To attempt to gain unauthorized access to other accounts or systems</li>
                <li>To use automated scripts or bots without our express written permission</li>
                <li>To reverse engineer, decompile, or disassemble any part of the service</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We reserve the right to investigate and take appropriate action against users
                who violate this policy, including suspension or termination of accounts.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                5. Data and Privacy
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Your Data Ownership
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    You retain all rights, title, and interest in and to your data, including
                    client information, financial records, and documents uploaded to our platform.
                    We do not claim ownership of your data.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Our Use of Your Data
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We use your data solely to provide our services to you, as described in our
                    Privacy Policy. We implement appropriate technical and organizational measures
                    to protect your data against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Data Portability
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    You may export your data from AdvisorOS at any time using our export tools.
                    Upon termination of your account, we will provide you with the opportunity
                    to export your data for a period of 30 days.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                6. Payment Terms and Billing
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Subscription Plans
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    AdvisorOS offers various subscription plans with different features and pricing.
                    By subscribing, you agree to pay the applicable fees for your chosen plan.
                    All fees are non-refundable except as expressly stated in these Terms.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Billing and Payment
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Subscription fees are billed in advance on a monthly or annual basis.
                    You authorize us to charge your designated payment method for all applicable fees.
                    If payment fails, we may suspend your access to the service until payment is received.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Price Changes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We may change our pricing at any time. For existing subscribers, price changes
                    will take effect at the next billing cycle after we provide at least 30 days' notice.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                7. Service Level Agreement
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Uptime Commitment
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We strive to maintain 99.9% uptime for our services, excluding scheduled maintenance
                    and circumstances beyond our reasonable control. We will provide advance notice
                    of scheduled maintenance whenever possible.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Support Services
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We provide customer support through various channels, including email, chat,
                    and phone support for higher-tier plans. Support availability and response times
                    may vary based on your subscription plan.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                8. Intellectual Property
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Our Intellectual Property
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    AdvisorOS and all related technology, software, and content are the intellectual
                    property of AdvisorOS, Inc. and our licensors. You may not copy, modify, distribute,
                    or create derivative works based on our platform without explicit written permission.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    License to Use
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Subject to these Terms, we grant you a limited, non-exclusive, non-transferable
                    license to access and use AdvisorOS for your internal business purposes during
                    the term of your subscription.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                9. Termination
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Either party may terminate this agreement at any time. You may cancel your subscription
                through your account settings or by contacting customer support. We may terminate
                your access for violation of these Terms or for any other reason with appropriate notice.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Upon termination, your right to access and use AdvisorOS will cease immediately.
                We will provide you with the opportunity to export your data for 30 days after termination,
                after which your data may be permanently deleted.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                10. Limitation of Liability
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Important Legal Notice
                    </h3>
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      This section contains important limitations on our liability.
                      Please read carefully.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADVISOROS SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our total liability for any claims arising from or related to these Terms or
                your use of AdvisorOS shall not exceed the amount you paid us in the twelve months
                preceding the claim.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                11. Governing Law and Disputes
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                These Terms are governed by the laws of the state in which AdvisorOS, Inc. is incorporated,
                without regard to conflict of law principles. Any disputes arising from these Terms
                or your use of our services will be resolved through binding arbitration.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Before initiating arbitration, we encourage you to contact us directly to resolve
                any issues. We are committed to working with you to address any concerns.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                12. Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white font-medium">AdvisorOS, Inc.</span>
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
                    <span className="text-gray-600 dark:text-gray-300">Email: legal@advisoros.com</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Phone: 1-800-CPA-HELP</span>
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