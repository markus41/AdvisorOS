import { Metadata } from 'next'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  noindex?: boolean
  keywords?: string[]
  ogImage?: string
  schemaData?: object
}

export function generateSEO({
  title,
  description,
  canonical,
  noindex = false,
  keywords = [],
  ogImage = '/og-image.jpg',
  schemaData
}: SEOProps): Metadata {
  const url = canonical ? `https://advisoros.com${canonical}` : undefined

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: canonical ? {
      canonical
    } : undefined,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
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
    },
  }

  return metadata
}

// Schema.org markup generators
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AdvisorOS",
  "alternateName": "AdvisorOS, Inc.",
  "url": "https://advisoros.com",
  "logo": "https://advisoros.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-800-CPA-HELP",
    "contactType": "customer service",
    "email": "support@advisoros.com",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Business Avenue, Suite 100",
    "addressLocality": "Business City",
    "addressRegion": "BC",
    "postalCode": "12345",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://twitter.com/advisoros",
    "https://linkedin.com/company/advisoros"
  ],
  "foundingDate": "2020",
  "numberOfEmployees": "25-50",
  "industry": "Software",
  "description": "Complete practice management platform for CPA firms, offering client management, QuickBooks integration, and workflow automation."
}

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AdvisorOS",
  "description": "Complete practice management platform for CPA firms with QuickBooks integration, client portals, and workflow automation.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "89",
    "priceCurrency": "USD",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "url": "https://advisoros.com/pricing"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  },
  "provider": {
    "@type": "Organization",
    "name": "AdvisorOS, Inc.",
    "url": "https://advisoros.com"
  },
  "downloadUrl": "https://advisoros.com/trial",
  "screenshot": "https://advisoros.com/screenshots/dashboard.png",
  "featureList": [
    "Client Management",
    "QuickBooks Integration",
    "Document Management",
    "Workflow Automation",
    "Client Portals",
    "AI-Powered Insights"
  ]
}

export const faqPageSchema = (faqs: Array<{ question: string; answer: string }>) => ({
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

export const articleSchema = (article: {
  title: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  url: string
  image?: string
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.description,
  "author": {
    "@type": "Person",
    "name": article.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "AdvisorOS",
    "logo": {
      "@type": "ImageObject",
      "url": "https://advisoros.com/logo.png"
    }
  },
  "datePublished": article.datePublished,
  "dateModified": article.dateModified || article.datePublished,
  "url": article.url,
  "image": article.image || "https://advisoros.com/og-image.jpg"
})

export const breadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.name,
    "item": crumb.url
  }))
})

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "AdvisorOS",
  "description": "Complete practice management platform for CPA firms",
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
  "priceRange": "$89-$389"
}

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "CPA Practice Management Software",
  "description": "Complete practice management platform for CPA firms with client management, QuickBooks integration, and workflow automation.",
  "provider": {
    "@type": "Organization",
    "name": "AdvisorOS"
  },
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "AdvisorOS Plans",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Starter Plan"
        },
        "price": "89",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Professional Plan"
        },
        "price": "189",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Enterprise Plan"
        },
        "price": "389",
        "priceCurrency": "USD"
      }
    ]
  }
}