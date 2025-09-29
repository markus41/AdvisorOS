import { createTRPCRouter } from '@/server/api/trpc'
import { clientRouter } from '@/server/api/routers/client'
import { enhancedApiRouter } from '@/server/api/routers/enhanced-api.router'
import { financialAnalyticsRouter } from '@/server/api/routers/financial-analytics.router'
import { taxSeasonRouter } from '@/server/api/routers/tax-season.router'

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
})

// export type definition of API
export type AppRouter = typeof appRouter