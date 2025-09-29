import { createTRPCRouter } from '@/server/api/trpc'
import { clientRouter } from '@/server/api/routers/client'
import { enhancedApiRouter } from '@/server/api/routers/enhanced-api.router'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  client: clientRouter,
  enhanced: enhancedApiRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter