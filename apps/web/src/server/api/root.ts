import { createTRPCRouter } from '@/server/api/trpc'
import { clientRouter } from '@/server/api/routers/client'
import { enhancedApiRouter } from '@/server/api/routers/enhanced-api.router'
import { financialAnalyticsRouter } from '@/server/api/routers/financial-analytics.router'
import { taxSeasonRouter } from '@/server/api/routers/tax-season.router'
import { advisorRouter } from '@/server/api/routers/advisor.router'
import { marketplaceRouter } from '@/server/api/routers/marketplace.router'
import { clientPortalRouter } from '@/server/api/routers/clientPortal.router'
import { revenueRouter } from '@/server/api/routers/revenue.router'
import { jobPostingRouter } from '@/server/api/routers/jobPosting.router'
import { applicationRouter } from '@/server/api/routers/application.router'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  client: clientRouter,
  enhanced: enhancedApiRouter,
  financialAnalytics: financialAnalyticsRouter,
  taxSeason: taxSeasonRouter,

  // Fractional CFO Marketplace Routers
  advisor: advisorRouter,
  marketplace: marketplaceRouter,
  clientPortal: clientPortalRouter,
  revenue: revenueRouter,

  // Talent Acquisition Platform
  jobPosting: jobPostingRouter,
  application: applicationRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter