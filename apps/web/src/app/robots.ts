import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/portal/',
          '/admin/',
          '/_next/',
          '/private/',
          '/temp/',
          '/*.json$',
          '/*.xml$',
          '/search?',
          '/internal/'
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://advisoros.com/sitemap.xml',
    host: 'https://advisoros.com',
  }
}