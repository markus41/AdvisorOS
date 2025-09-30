/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    // Reduce bundle size by removing unused exports
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', '@tremor/react'],
    // Optimize client-side routing
    optimisticClientCache: true,
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ['@prisma/client', 'ioredis', 'bull', '@tensorflow/tfjs-node'],

  // Image optimization
  images: {
    domains: ['localhost', 'cdn.advisoros.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year for optimized images
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // Enable SWC optimizations
    styledComponents: false, // We're using Tailwind
  },

  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Reduce bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }

    // Optimize chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
          // Separate chunks for large libraries
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
            enforce: true,
          },
          tremor: {
            test: /[\\/]node_modules[\\/]@tremor[\\/]/,
            name: 'tremor',
            chunks: 'all',
            enforce: true,
          },
          prisma: {
            test: /[\\/]node_modules[\\/]@prisma[\\/]/,
            name: 'prisma',
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }

    // Analyze bundle size in development (optional dependency)
    if (dev && !isServer && process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        )
      } catch (error) {
        console.warn('webpack-bundle-analyzer not installed, skipping bundle analysis')
      }
    }

    // Compression
    if (!dev) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: 50,
        })
      )
    }

    return config
  },

  // Output optimization
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  distDir: '.next',
  generateEtags: true,
  poweredByHeader: false,

  // Environment variables
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache API responses with shorter TTL
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
    ]
  },

  // Redirects for performance
  async redirects() {
    return [
      // Add trailing slash for consistent caching
      {
        source: '/dashboard',
        destination: '/dashboard/',
        permanent: true,
      },
    ]
  },

  // Compression
  compress: true,

  // Performance monitoring
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },

  // TypeScript configuration for performance
  typescript: {
    // Skip type checking during build for faster builds
    // (handled by CI/CD pipeline)
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration for performance
  eslint: {
    // Skip ESLint during build for faster builds
    // (handled by CI/CD pipeline)
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig