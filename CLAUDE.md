# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AdvisorOS - AI-Powered CPA Platform

### Project Overview
AdvisorOS is a comprehensive CPA platform that streamlines accounting workflows through intelligent automation, client management, and financial analytics. Built as a modern monorepo with Next.js, tRPC, Prisma, and Azure AI services.

### Architecture
- **Monorepo**: Turbo-powered workspace with apps/web and packages structure
- **Frontend**: Next.js 15 with TypeScript, Tailwind, Radix UI, Tremor charts
- **Backend**: tRPC API with Prisma ORM, PostgreSQL database
- **AI Services**: Azure OpenAI, Form Recognizer, Text Analytics, Cognitive Search
- **Payments**: Stripe integration for billing and subscriptions
- **Deployment**: Azure infrastructure with Terraform

### Core Business Domains
1. **Client Management** - Onboarding, profiles, communication, portal access
2. **Document Processing** - OCR, AI analysis, workflow automation, compliance
3. **Tax & Compliance** - Calculations, filing, deadline management, audit trails
4. **Financial Analytics** - Reporting, forecasting, KPI tracking, insights
5. **Workflow Automation** - Process optimization, task management, quality control

### Development Standards
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Jest (unit), Playwright (e2e), supertest (integration)
- **Security**: Input validation, encryption, audit logging, SOC 2 compliance
- **Performance**: Caching strategies, database optimization, monitoring

### Current Sprint Focus
- Production readiness and launch preparation
- Advanced AI feature integration (document intelligence, financial prediction)
- Client success optimization and feature adoption tracking
- Tax season preparation and capacity planning

## Database Schema

### Core Models
- **Organization**: Multi-tenant root entity with subscription management
- **User**: Team members with role-based access (owner, admin, cpa, staff)
- **Client**: CPA clients with QuickBooks integration support
- **Document**: File management with OCR and AI processing
- **Engagement**: Client service engagements and project tracking
- **Workflow**: Automated business process definitions
- **Task**: Individual work items within workflows
- **Invoice**: Billing and payment tracking
- **Report**: Financial reports and analytics

### Multi-Tenancy Pattern
All entities include `organizationId` for data isolation. API procedures automatically filter by organization context.

## Security Architecture

### Authentication & Authorization
- **NextAuth.js**: Session management with Azure AD B2C integration
- **Role-Based Access Control**: Owner > Admin > CPA > Staff hierarchy
- **Organization Isolation**: All data operations scoped to user's organization
- **API Security**: All tRPC procedures require authentication and organization membership

### Data Security
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Audit Logging**: Comprehensive tracking of all data modifications
- **Encryption**: Sensitive data encrypted at rest and in transit

### Team Communication Style
- Concise, direct responses focused on implementation
- Proactive identification of technical debt and optimization opportunities
- Security-first approach with defensive coding practices
- Quality gates before production deployment

### Key File Patterns
- **API Routes**: `apps/web/src/app/api/` and `apps/web/src/server/api/routers/`
- **Components**: `apps/web/src/components/` and `packages/ui/src/`
- **Services**: `apps/web/src/server/services/` and `apps/web/src/lib/`
- **Types**: Shared in `packages/types/`
- **Database**: Prisma schema and migrations

### Critical Dependencies
- Next.js 15, React 18, TypeScript 5
- tRPC v10, Prisma v5, NextAuth v4
- Azure AI services (@azure/openai, @azure/ai-form-recognizer)
- Stripe for payments, Bull for job queues
- Tremor for analytics UI, Radix UI for components

## Multi-Agent Architecture

This project leverages specialized agents for different domains. Always check the agent registry and use appropriate sub-agents for:
- **backend-api-developer**: API endpoints, tRPC procedures, database operations
- **frontend-builder**: React components, UI/UX, Next.js pages
- **database-optimizer**: Query optimization, schema design, performance
- **security-auditor**: Security reviews, vulnerability assessments
- **test-suite-developer**: Unit, integration, and E2E tests
- **ai-features-orchestrator**: Azure AI integrations, OCR, document processing
- **integration-specialist**: QuickBooks, Stripe, external API integrations
- **performance-optimization-specialist**: Application performance, scaling
- **devops-azure-specialist**: CI/CD, Azure deployment, infrastructure

## Testing Architecture

### Test Structure
- **Unit Tests**: `apps/web/__tests__/` - Components, utilities, pure functions
- **Integration Tests**: `apps/web/tests/integration/` - API endpoints, database operations
- **E2E Tests**: `apps/web/tests/e2e/` - Complete user workflows
- **Performance Tests**: `apps/web/tests/performance/` - Load testing, benchmarks
- **Security Tests**: `apps/web/tests/security/` - Security vulnerability testing

### Test Configuration
- **Jest**: Multi-project setup with different environments (jsdom for components, node for API)
- **Playwright**: E2E testing with UI mode available
- **Coverage Thresholds**: 80% global, 90%+ for API routes and utilities

### Environment Requirements
- Node.js >=18.17.0
- PostgreSQL database
- Azure services (OpenAI, Form Recognizer, Cognitive Search)
- Redis for caching and job queues
- Docker for development environment

## Essential Development Commands

### Project Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### Development
```bash
# Start development server (all workspaces)
npm run dev

# Start development server (web app only)
cd apps/web && npm run dev

# Database studio (Prisma)
npm run db:studio
```

### Building and Testing
```bash
# Build all packages
npm run build

# Lint all code
npm run lint

# Format code
npm run format

# Run all tests
cd apps/web && npm run test:all

# Run specific test types
cd apps/web && npm run test:unit
cd apps/web && npm run test:integration
cd apps/web && npm run test:e2e
cd apps/web && npm run test:performance
cd apps/web && npm run test:security

# Run single test file
cd apps/web && npm run test -- path/to/test.ts

# Watch mode for unit tests
cd apps/web && npm run test:watch
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Create and run migration
npm run db:migrate

# Reset database (dangerous!)
cd apps/web && npx prisma migrate reset

# Database backup/restore
npm run dev:backup
npm run dev:restore

# Connect to database CLI
npm run dev:connect
```

### Development Environment
```bash
# Start complete dev environment
npm run dev:start

# Stop dev environment
npm run dev:stop

# Reset dev environment
npm run dev:reset

# Test database connection
npm run dev:test
```

### Security and Auditing
```bash
# Run security audit
npm run security:audit

# Fix security vulnerabilities
npm run security:fix

# Update dependencies
npm run security:update
```

## API Development Patterns

### tRPC Procedure Structure
1. **Input Validation**: Use Zod schemas for type-safe validation
2. **Authorization**: Apply appropriate middleware (organizationProcedure, adminProcedure)
3. **Business Logic**: Implement in service layer classes
4. **Error Handling**: Use TRPCError with appropriate codes
5. **Response**: Return type-safe data with proper serialization

### Example Pattern
```typescript
// 1. Define schema
export const createClientSchema = z.object({
  businessName: z.string().min(1),
  primaryContactEmail: z.string().email()
})

// 2. Service layer
export class ClientService {
  static async createClient(data: CreateClientInput, organizationId: string) {
    return await prisma.client.create({
      data: { ...data, organizationId }
    })
  }
}

// 3. tRPC procedure
export const clientRouter = createTRPCRouter({
  create: organizationProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientService.createClient(input, ctx.organizationId)
    })
})
```

## Component Development Patterns

### File Organization
- **Pages**: `apps/web/src/app/` (Next.js App Router)
- **Components**: `apps/web/src/components/[domain]/` (grouped by feature)
- **UI Components**: `packages/ui/src/` (shared across apps)
- **Hooks**: `apps/web/src/hooks/` (custom React hooks)
- **Utils**: `apps/web/src/lib/utils/` (utility functions)

### Styling Approach
- **Tailwind CSS**: Utility-first styling with custom design system
- **Component Variants**: Use `class-variance-authority` for component variants
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Dark Mode**: Support via `next-themes` with system preference detection

## Important Development Notes

### Type Safety
- **Strict TypeScript**: All code must pass strict type checking
- **End-to-End Types**: Database → API → Frontend type propagation
- **Zod Validation**: Runtime validation matches TypeScript types
- **No Any Types**: Avoid `any` - use proper typing or `unknown`

### Performance Considerations
- **Database Queries**: Use Prisma includes/selects to minimize data transfer
- **API Caching**: Implement Redis caching for expensive operations
- **Frontend Optimization**: Use React.memo, useMemo, and lazy loading
- **Bundle Size**: Monitor and optimize bundle size with Next.js analysis

### Quality Assurance
- **Run tests before committing**: Always run `npm run test` before pushing
- **Lint and format**: Code must pass ESLint and Prettier checks
- **Type checking**: Run `npm run type-check` to catch TypeScript errors
- **Security**: Never commit secrets, use environment variables