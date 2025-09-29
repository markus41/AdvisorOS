/**
 * Enhanced SEO Configuration for CPA Practice Management
 *
 * This module provides comprehensive SEO optimization targeting
 * high-value keywords in the CPA and accounting practice management space.
 */

import { Metadata } from 'next'

// Primary keyword research results for CPA practice management
export const primaryKeywords = {
  // High-volume, high-intent keywords
  primary: [
    'cpa practice management software',
    'accounting practice management',
    'cpa firm software',
    'accounting firm management software',
    'practice management for accountants'
  ],
  // Long-tail, high-converting keywords
  longTail: [
    'best cpa practice management software 2024',
    'accounting practice management software with quickbooks integration',
    'cpa firm client portal software',
    'automated accounting workflow software',
    'cloud based cpa practice management',
    'accounting practice management software reviews',
    'cpa software for small firms',
    'accounting firm automation software'
  ],
  // Local SEO keywords
  local: [
    'cpa practice management software usa',
    'accounting software for cpa firms',
    'tax preparation software for cpas',
    'bookkeeping software for accounting firms'
  ],
  // Commercial intent keywords
  commercial: [
    'cpa software pricing',
    'accounting practice management cost',
    'cpa software comparison',
    'best accounting practice software',
    'cpa firm software demo',
    'accounting software trial'
  ]
}

// Semantic keywords for topical authority
export const semanticKeywords = [
  // Core business functions
  'client management', 'document management', 'workflow automation',
  'time tracking', 'billing software', 'tax software integration',
  'financial reporting', 'audit management', 'compliance tracking',

  // Technology terms
  'cloud accounting', 'api integration', 'data synchronization',
  'document scanning', 'electronic signatures', 'bank feeds',
  'real-time collaboration', 'mobile access',

  // Business benefits
  'practice efficiency', 'client communication', 'revenue growth',
  'cost reduction', 'scalability', 'productivity improvement',
  'client retention', 'competitive advantage',

  // Industry terms
  'gaap compliance', 'sox compliance', 'ifrs', 'tax season',
  'audit trail', 'financial statements', 'general ledger',
  'accounts receivable', 'accounts payable', 'cash flow'
]

// Content clusters for topical SEO
export const contentClusters = {
  'practice-management': {
    pillarPage: '/features',
    keywords: ['cpa practice management', 'accounting practice management', 'firm management'],
    supportingPages: [
      '/features/client-management',
      '/features/document-management',
      '/features/workflow-automation',
      '/features/reporting-analytics'
    ]
  },
  'quickbooks-integration': {
    pillarPage: '/features/quickbooks',
    keywords: ['quickbooks integration', 'quickbooks sync', 'accounting software integration'],
    supportingPages: [
      '/integrations/quickbooks-online',
      '/integrations/quickbooks-desktop',
      '/blog/quickbooks-integration-guide',
      '/case-studies/quickbooks-automation'
    ]
  },
  'client-portal': {
    pillarPage: '/features/client-portal',
    keywords: ['cpa client portal', 'accounting client portal', 'secure document sharing'],
    supportingPages: [
      '/features/document-sharing',
      '/features/client-collaboration',
      '/blog/client-portal-benefits',
      '/case-studies/client-portal-success'
    ]
  },
  'automation': {
    pillarPage: '/features/automation',
    keywords: ['accounting automation', 'workflow automation', 'practice automation'],
    supportingPages: [
      '/features/automated-workflows',
      '/features/task-automation',
      '/blog/accounting-automation-guide',
      '/roi-calculator'
    ]
  }
}

// Enhanced metadata generation
interface EnhancedSEOProps {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  noindex?: boolean
  ogImage?: string
  schemaData?: object[]
  contentType?: 'website' | 'article' | 'product' | 'service'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
}

export function generateEnhancedSEO({
  title,
  description,
  keywords = [],
  canonical,
  noindex = false,
  ogImage = '/og-image-default.jpg',
  schemaData = [],
  contentType = 'website',
  publishedTime,
  modifiedTime,
  author,
  section
}: EnhancedSEOProps): Metadata {
  const url = canonical ? `https://advisoros.com${canonical}` : 'https://advisoros.com'

  // Enhance keywords with semantic terms
  const enhancedKeywords = [
    ...keywords,
    ...primaryKeywords.primary.slice(0, 3),
    ...semanticKeywords.slice(0, 5)
  ]

  const metadata: Metadata = {
    title: {
      default: title,
      template: `%s | AdvisorOS - CPA Practice Management Software`
    },
    description,
    keywords: enhancedKeywords,
    alternates: canonical ? {
      canonical
    } : undefined,
    openGraph: {
      title,
      description,
      url,
      type: contentType === 'article' ? 'article' : 'website',
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      }],
      siteName: 'AdvisorOS',
      locale: 'en_US',
      ...(contentType === 'article' && publishedTime ? {
        publishedTime,
        modifiedTime: modifiedTime || publishedTime,
        authors: author ? [author] : undefined,
        section
      } : {})
    },
    twitter: {
      card: 'summary_large_image',
      site: '@advisoros',
      creator: '@advisoros',
      title,
      description,
      images: [ogImage],
    },
    robots: noindex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'your-google-site-verification-code',
      yandex: 'your-yandex-verification-code',
      yahoo: 'your-yahoo-verification-code',
    },
    category: 'Software',
    classification: 'Business Software',
    referrer: 'origin-when-cross-origin',
    creator: 'AdvisorOS',
    publisher: 'AdvisorOS',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  }

  return metadata
}

// Page-specific SEO configurations
export const pagesSEO = {
  homepage: generateEnhancedSEO({
    title: 'CPA Practice Management Software | AdvisorOS',
    description: 'Transform your CPA practice with AdvisorOS. Streamline client management, automate workflows, and integrate seamlessly with QuickBooks. Join 500+ firms saving 75% on administrative tasks.',
    keywords: [
      'cpa practice management software',
      'accounting practice management',
      'cpa firm software',
      'quickbooks integration',
      'accounting automation',
      'cpa client portal'
    ],
    canonical: '/',
    ogImage: '/og-image-home.jpg',
    contentType: 'website'
  }),

  features: generateEnhancedSEO({
    title: 'CPA Practice Management Features | Client Management & QuickBooks Integration',
    description: 'Discover powerful features that streamline your CPA practice. Client management, QuickBooks sync, document automation, and workflow management in one platform.',
    keywords: [
      'cpa software features',
      'accounting practice management features',
      'quickbooks integration features',
      'client management software',
      'document automation',
      'workflow management'
    ],
    canonical: '/features',
    ogImage: '/og-image-features.jpg'
  }),

  pricing: generateEnhancedSEO({
    title: 'CPA Software Pricing | AdvisorOS Practice Management Plans',
    description: 'Transparent pricing for CPA practice management software. Starting at $89/month with 14-day free trial. Compare plans and find the perfect fit for your firm.',
    keywords: [
      'cpa software pricing',
      'accounting software cost',
      'practice management pricing',
      'cpa software plans',
      'accounting software pricing',
      'firm management cost'
    ],
    canonical: '/pricing',
    ogImage: '/og-image-pricing.jpg'
  }),

  demo: generateEnhancedSEO({
    title: 'Request Demo | See AdvisorOS CPA Practice Management in Action',
    description: 'See how AdvisorOS transforms CPA practices. Schedule a personalized demo to discover how our platform can streamline your operations and grow your firm.',
    keywords: [
      'cpa software demo',
      'accounting software demo',
      'practice management demo',
      'cpa software trial',
      'accounting software walkthrough'
    ],
    canonical: '/demo',
    ogImage: '/og-image-demo.jpg'
  }),

  trial: generateEnhancedSEO({
    title: '14-Day Free Trial | Try AdvisorOS CPA Practice Management Software',
    description: 'Start your free 14-day trial of AdvisorOS. No credit card required. Experience complete CPA practice management with QuickBooks integration.',
    keywords: [
      'cpa software free trial',
      'accounting software trial',
      'practice management trial',
      'free cpa software',
      'accounting software free'
    ],
    canonical: '/trial',
    ogImage: '/og-image-trial.jpg'
  }),

  about: generateEnhancedSEO({
    title: 'About AdvisorOS | Leading CPA Practice Management Software',
    description: 'Learn about AdvisorOS, the leading practice management platform for CPA firms. Our mission is to help accounting professionals focus on what matters most.',
    keywords: [
      'advisoros about',
      'cpa software company',
      'accounting software provider',
      'practice management company'
    ],
    canonical: '/about',
    ogImage: '/og-image-about.jpg'
  }),

  contact: generateEnhancedSEO({
    title: 'Contact AdvisorOS | CPA Practice Management Support',
    description: 'Get in touch with our CPA practice management experts. Sales inquiries, support questions, or partnership opportunities - we are here to help.',
    keywords: [
      'cpa software support',
      'accounting software contact',
      'practice management help',
      'advisoros contact'
    ],
    canonical: '/contact',
    ogImage: '/og-image-contact.jpg'
  })
}

// Blog post SEO template
export function generateBlogSEO({
  title,
  description,
  slug,
  author = 'AdvisorOS Team',
  publishedTime,
  modifiedTime,
  tags = [],
  category = 'CPA Practice Management'
}: {
  title: string
  description: string
  slug: string
  author?: string
  publishedTime: string
  modifiedTime?: string
  tags?: string[]
  category?: string
}) {
  return generateEnhancedSEO({
    title: `${title} | AdvisorOS Blog`,
    description,
    canonical: `/blog/${slug}`,
    keywords: [
      ...tags,
      'cpa practice management',
      'accounting tips',
      'practice efficiency',
      'cpa software'
    ],
    ogImage: `/og-image-blog-${slug}.jpg`,
    contentType: 'article',
    publishedTime,
    modifiedTime,
    author,
    section: category
  })
}

// Local SEO schema for accounting firms
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://advisoros.com/#localbusiness",
  "name": "AdvisorOS",
  "image": "https://advisoros.com/logo.png",
  "description": "Complete practice management platform for CPA firms with client management, QuickBooks integration, and workflow automation.",
  "url": "https://advisoros.com",
  "telephone": "+1-800-CPA-HELP",
  "email": "hello@advisoros.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Business Avenue, Suite 100",
    "addressLocality": "Business City",
    "addressRegion": "BC",
    "postalCode": "12345",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "40.7128",
    "longitude": "-74.0060"
  },
  "openingHours": [
    "Mo-Fr 09:00-18:00"
  ],
  "priceRange": "$89-$389",
  "currenciesAccepted": "USD",
  "paymentAccepted": "Credit Card, Bank Transfer",
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "serviceArea": {
    "@type": "Country",
    "name": "United States"
  },
  "category": "Software Company",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "CPA Practice Management Software Plans",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Starter Plan",
          "description": "Perfect for solo practitioners and small firms"
        },
        "price": "89",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Professional Plan",
          "description": "Ideal for growing CPA firms with multiple staff"
        },
        "price": "189",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Enterprise Plan",
          "description": "For large firms requiring advanced features and support"
        },
        "price": "389",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Sarah Chen"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "reviewBody": "AdvisorOS has transformed our practice. We've reduced client onboarding time by 75% and increased our capacity by 40% without adding staff."
    }
  ]
}

// FAQ schema for better SERP features
export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
})

// HowTo schema for instructional content
export const howToSchema = (title: string, steps: Array<{ name: string; text: string; image?: string }>) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": title,
  "description": `Learn ${title.toLowerCase()} with our step-by-step guide`,
  "image": "https://advisoros.com/og-image-howto.jpg",
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "AdvisorOS Account"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "AdvisorOS Platform"
    }
  ],
  "step": steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text,
    "image": step.image
  }))
})

// Technical SEO utilities
export const technicalSEO = {
  // Robots.txt content
  robotsTxt: `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /portal/

Sitemap: https://advisoros.com/sitemap.xml
Sitemap: https://advisoros.com/blog/sitemap.xml`,

  // Security headers for SEO
  securityHeaders: {
    'X-Robots-Tag': 'index, follow',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },

  // Canonical URL helpers
  getCanonicalUrl: (path: string) => `https://advisoros.com${path}`,

  // Hreflang for international SEO (if needed)
  hreflang: {
    'en-US': 'https://advisoros.com',
    'en-CA': 'https://advisoros.com/ca',
    'x-default': 'https://advisoros.com'
  }
}

// Performance optimization for Core Web Vitals
export const coreWebVitalsOptimization = {
  // Critical CSS for above-the-fold content
  criticalCSS: `
    .hero-section { display: flex; align-items: center; min-height: 100vh; }
    .hero-title { font-size: 3rem; font-weight: bold; line-height: 1.1; }
    .hero-cta { background: #2563eb; color: white; padding: 1rem 2rem; border-radius: 0.5rem; }
  `,

  // Resource hints
  resourceHints: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
    { rel: 'dns-prefetch', href: 'https://connect.facebook.net' }
  ],

  // Image optimization settings
  imageOptimization: {
    formats: ['webp', 'avif'],
    sizes: {
      hero: '(max-width: 768px) 100vw, 50vw',
      feature: '(max-width: 768px) 100vw, 33vw',
      testimonial: '(max-width: 768px) 50vw, 25vw'
    }
  }
}