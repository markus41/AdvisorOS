/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cpa-platform/ui", "@cpa-platform/types"],
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig