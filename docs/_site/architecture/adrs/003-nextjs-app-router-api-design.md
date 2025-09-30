# ADR-003: Next.js App Router Structure and API Design

## Status
Accepted

## Context
AdvisorOS requires a modern, scalable frontend architecture that supports both public marketing pages and complex tenant-specific dashboard applications. The application must handle role-based access control, real-time features, and seamless integration with external services.

## Decision
We have implemented Next.js 14 with App Router using a hybrid monorepo structure that combines public marketing pages and tenant dashboard within a single application:

### Application Architecture:
```
apps/web/src/app/
├── (public)/          # Public marketing pages
│   ├── page.tsx       # Landing page
│   ├── pricing/       # Pricing page
│   ├── about/         # About page
│   └── contact/       # Contact forms
├── auth/              # Authentication flows
│   ├── signin/        # Multi-tenant signin
│   ├── register/      # Organization signup
│   └── invite/        # User invitation flow
├── dashboard/         # Tenant dashboard (authenticated)
│   ├── clients/       # Client management
│   ├── documents/     # Document management
│   ├── workflows/     # Process automation
│   └── reports/       # Financial reporting
├── portal/            # Client portal (separate subdomain)
│   ├── documents/     # Client document access
│   └── tax-returns/   # Tax return status
└── api/               # API routes
    ├── auth/          # Authentication endpoints
    ├── clients/       # Client CRUD operations
    ├── documents/     # Document processing
    ├── workflows/     # Workflow automation
    ├── reports/       # Report generation
    ├── quickbooks/    # QuickBooks integration
    ├── stripe/        # Billing integration
    └── trpc/          # Type-safe API layer
```

### Key Architectural Decisions:

1. **Route Organization Strategy**
   - **Route Groups**: `(public)` for marketing, `(auth)` for authentication flows
   - **Dynamic Routes**: `[organizationId]` for tenant-specific pages
   - **Parallel Routes**: Dashboard layouts with multiple data streams
   - **Intercepting Routes**: Modal overlays for document preview

2. **API Layer Architecture**
   - **tRPC Integration**: Type-safe client-server communication
   - **REST API Routes**: Next.js API routes for external integrations
   - **Webhook Handlers**: Dedicated routes for third-party webhooks
   - **File Upload**: Specialized routes for document processing

3. **State Management Pattern**
   - **React Query (TanStack)**: Server state management and caching
   - **React Context**: Tenant and user session state
   - **Zustand**: Client-side UI state management
   - **Local Storage**: Preferences and offline data

4. **Authentication & Authorization**
   - **NextAuth.js**: Multi-provider authentication
   - **JWT Tokens**: Stateless session management
   - **Middleware**: Route-level authorization
   - **Role-Based Access**: Granular permission system

### API Design Patterns:

```typescript
// tRPC Router Structure
export const appRouter = createTRPCRouter({
  auth: authRouter,        // Authentication procedures
  client: clientRouter,    // Client management
  document: documentRouter, // Document processing
  workflow: workflowRouter, // Process automation
  report: reportRouter,    // Financial reporting
  integration: integrationRouter, // External services
})

// Multi-tenant API pattern
export async function GET(request: NextRequest) {
  const organizationId = request.headers.get('x-organization-id')
  const userRole = request.headers.get('x-user-role')

  // Validate organization context
  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organization context' }, { status: 400 })
  }

  // Apply tenant filtering
  const clients = await prisma.client.findMany({
    where: { organizationId },
    // Additional filtering based on user role
  })

  return NextResponse.json(clients)
}
```

## Alternatives Considered

1. **Separate Applications**: Would increase deployment complexity and reduce code sharing
2. **Pages Router**: Less flexible routing and SSR capabilities than App Router
3. **Pure SPA**: Would lose SEO benefits and increase client-side complexity
4. **GraphQL**: More complex than needed for current requirements
5. **Micro-frontends**: Overkill for current scale, considered for future

## Consequences

### Positive:
- **Performance**: App Router provides advanced caching and SSR capabilities
- **Developer Experience**: File-based routing with TypeScript integration
- **Type Safety**: End-to-end type safety with tRPC and Prisma
- **SEO Optimization**: Server-side rendering for marketing pages
- **Code Sharing**: Shared components between public and dashboard areas
- **Bundle Optimization**: Tree-shaking and code splitting out of the box

### Negative:
- **Complexity**: App Router learning curve for team members
- **Bundle Size**: Large application bundle for complex dashboard
- **Cold Start**: Server-side rendering can increase initial load time
- **State Synchronization**: Complex state management between client/server

### Implementation Guidelines:

1. **Component Architecture**
   ```typescript
   // Server Components by default
   export default async function ClientsPage() {
     const clients = await getClients() // Direct database query
     return <ClientList clients={clients} />
   }

   // Client Components for interactivity
   'use client'
   export function ClientForm() {
     const [isSubmitting, setIsSubmitting] = useState(false)
     // Client-side logic
   }
   ```

2. **Error Handling Strategy**
   - **Error Boundaries**: Catch client-side errors
   - **Error Pages**: Custom error pages for different scenarios
   - **Global Error Handler**: Centralized error logging and reporting

3. **Performance Optimizations**
   - **Streaming**: Progressive page loading with Suspense
   - **Caching**: Aggressive caching for static and dynamic content
   - **Image Optimization**: Next.js Image component for responsive images
   - **Bundle Analysis**: Regular bundle size monitoring and optimization

## Scaling Considerations

### Current Optimizations:
- **Route Handlers**: Efficient API routes with middleware
- **Component Lazy Loading**: Dynamic imports for heavy components
- **Asset Optimization**: Image optimization and compression
- **CDN Integration**: Static asset delivery via CDN

### Future Enhancements:
1. **Edge Runtime**: Move API routes to edge for global performance
2. **Incremental Static Regeneration**: Cache dynamic content with revalidation
3. **Micro-frontend Architecture**: Federated modules for large teams
4. **Progressive Web App**: Offline capabilities and native-like experience

## Development Workflow

### Local Development:
```bash
# Turborepo orchestration
npm run dev          # Start all applications
npm run build        # Build for production
npm run test         # Run test suites
npm run lint         # Code quality checks
```

### API Testing Strategy:
- **Unit Tests**: Individual API route testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load testing for critical endpoints
- **Security Tests**: Authentication and authorization validation

## Monitoring and Analytics
- Page load performance and Core Web Vitals
- API response times and error rates
- User interaction tracking and conversion funnels
- Bundle size monitoring and optimization alerts
- Security audit for authentication flows