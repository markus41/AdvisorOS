// Remove 'use client' to allow metadata export
import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { CTASection } from "@/components/marketing/cta-section"
import { FAQSection } from "@/components/marketing/faq-section"
import { PricingPageContent } from "@/components/marketing/pricing-page-content"
import { StructuredData } from "@/components/seo/structured-data"
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "CPA Software Pricing | Affordable Plans for Accounting Firms",
  description: "Transparent pricing for AdvisorOS CPA practice management software. Starting at $89/month with QuickBooks integration, client portals, and workflow automation. 14-day free trial.",
  keywords: [
    "CPA software pricing",
    "accounting software cost",
    "practice management pricing",
    "QuickBooks integration pricing",
    "CPA firm software plans",
    "accounting practice management cost"
  ],
  openGraph: {
    title: "CPA Software Pricing | Affordable Plans for Accounting Firms",
    description: "Transparent pricing for AdvisorOS CPA practice management software. Starting at $89/month with 14-day free trial.",
    url: "https://advisoros.com/pricing",
    type: "website"
  }
}

const faqs = [
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
  },
  {
    question: "What's included in the free trial?",
    answer: "Your 14-day free trial includes full access to all features in your selected plan. No credit card required to start, and you can cancel anytime during the trial period."
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes! Annual billing saves you approximately 16% compared to monthly billing. Plus, you'll get priority support and additional storage bonuses."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees ever. We also provide free onboarding assistance and data migration support for all plans."
  },
  {
    question: "What happens if I exceed my client limit?",
    answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional client slots at $5 per client per month."
  },
  {
    question: "Can I integrate with other software besides QuickBooks?",
    answer: "Yes! We integrate with 30+ popular business applications including Xero, Excel, Gmail, DocuSign, and more. Enterprise plans include API access for custom integrations."
  },
  {
    question: "What kind of support do you provide?",
    answer: "All plans include email support. Professional and Enterprise plans get chat and phone support. Enterprise customers also receive a dedicated account manager."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level security with 256-bit SSL encryption, SOC 2 Type II certification, and maintain 99.9% uptime with automated backups."
  }
]

export default function PricingPage() {

  const breadcrumbs = [
    { name: "Home", url: "https://advisoros.com" },
    { name: "Pricing", url: "https://advisoros.com/pricing" }
  ]

  const faqData = faqs.map(faq => ({
    question: faq.question,
    answer: faq.answer
  }))


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <StructuredData data={[
        breadcrumbSchema(breadcrumbs),
        faqPageSchema(faqData)
      ]} />
      <Navigation />

      <PricingPageContent />

      {/* FAQ Section */}
      <FAQSection
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about our pricing and plans"
        faqs={faqs}
        className="bg-white dark:bg-gray-900"
      />

      {/* Final CTA */}
      <CTASection
        title="Ready to Start Your Free Trial?"
        description="No credit card required. Full access to all features for 14 days. Cancel anytime."
        primaryCta={{
          text: "Start Free Trial",
          href: "/trial"
        }}
        secondaryCta={{
          text: "Contact Sales",
          href: "/contact"
        }}
        variant="gradient"
      />

      <Footer />
    </div>
  )
}