import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from '@/lib/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://advisoros.com'),
  title: {
    default: 'AdvisorOS - Complete Practice Management Platform for CPA Firms',
    template: '%s | AdvisorOS'
  },
  description: 'Transform your CPA practice with AdvisorOS. Streamline client management, automate workflows, and integrate seamlessly with QuickBooks. Join 500+ firms saving 75% on administrative tasks.',
  keywords: [
    'CPA practice management',
    'accounting software',
    'QuickBooks integration',
    'client portal',
    'workflow automation',
    'document management',
    'CPA firms',
    'accounting automation',
    'practice management software',
    'advisory services platform'
  ],
  authors: [{ name: 'AdvisorOS Team' }],
  creator: 'AdvisorOS, Inc.',
  publisher: 'AdvisorOS, Inc.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://advisoros.com',
    title: 'AdvisorOS - Complete Practice Management Platform for CPA Firms',
    description: 'Transform your CPA practice with AdvisorOS. Streamline client management, automate workflows, and integrate seamlessly with QuickBooks. Join 500+ firms saving 75% on administrative tasks.',
    siteName: 'AdvisorOS',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AdvisorOS - CPA Practice Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdvisorOS - Complete Practice Management Platform for CPA Firms',
    description: 'Transform your CPA practice with AdvisorOS. Streamline client management, automate workflows, and integrate seamlessly with QuickBooks.',
    images: ['/twitter-image.jpg'],
    creator: '@advisoros',
  },
  robots: {
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
    google: 'google-site-verification-token',
    yandex: 'yandex-verification-token',
    yahoo: 'yahoo-site-verification-token',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}