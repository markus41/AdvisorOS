import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://advisoros.com'
  const lastModified = new Date()

  // Static pages
  const staticPages = [
    '',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/demo',
    '/trial',
    '/roi-calculator',
    '/resources',
    '/blog',
    '/case-studies',
    '/privacy',
    '/terms',
    '/security',
  ]

  // Generate sitemap entries for static pages
  const staticEntries = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === '' ? 'daily' as const : 'weekly' as const,
    priority: path === '' ? 1 : path === '/pricing' || path === '/features' ? 0.9 : 0.8,
  }))

  // Blog posts (example - would be dynamic in real implementation)
  const blogPosts = [
    '/blog/1',
    '/blog/2',
    '/blog/3',
    '/blog/4',
    '/blog/5',
    '/blog/6'
  ]

  const blogEntries = blogPosts.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Case studies
  const caseStudies = [
    '/case-studies/1',
    '/case-studies/2',
    '/case-studies/3',
    '/case-studies/4',
    '/case-studies/5',
    '/case-studies/6'
  ]

  const caseStudyEntries = caseStudies.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...blogEntries, ...caseStudyEntries]
}