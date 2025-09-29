# AdvisorOS Developer Documentation

## Overview

Welcome to the AdvisorOS developer documentation. This comprehensive guide covers everything you need to know to contribute to, extend, and maintain the AdvisorOS platform. Whether you're a new team member or an experienced developer, this documentation will help you understand the architecture, setup your development environment, and follow our development practices.

## Table of Contents

### Getting Started
- [Development Environment Setup](./setup/development-environment.md)
- [Project Structure](./architecture/project-structure.md)
- [Local Development Guide](./setup/local-development.md)
- [Docker Development](./setup/docker-development.md)

### Architecture & Design
- [System Architecture](./architecture/system-architecture.md)
- [Database Design](./architecture/database-design.md)
- [API Design Patterns](./architecture/api-patterns.md)
- [Frontend Architecture](./architecture/frontend-architecture.md)
- [Security Architecture](./architecture/security-architecture.md)

### Development Guidelines
- [Coding Standards](./guidelines/coding-standards.md)
- [Git Workflow](./guidelines/git-workflow.md)
- [Code Review Process](./guidelines/code-review.md)
- [Testing Standards](./guidelines/testing-standards.md)
- [Documentation Standards](./guidelines/documentation-standards.md)

### API Development
- [tRPC API Development](./api/trpc-development.md)
- [Database Operations](./api/database-operations.md)
- [Authentication & Authorization](./api/auth-development.md)
- [File Upload & Storage](./api/file-handling.md)
- [Integration Development](./api/integrations.md)

### Frontend Development
- [Next.js App Router](./frontend/nextjs-development.md)
- [React Components](./frontend/react-components.md)
- [State Management](./frontend/state-management.md)
- [UI Component Library](./frontend/ui-components.md)
- [Form Handling](./frontend/form-handling.md)

### Testing
- [Unit Testing](./testing/unit-testing.md)
- [Integration Testing](./testing/integration-testing.md)
- [End-to-End Testing](./testing/e2e-testing.md)
- [Performance Testing](./testing/performance-testing.md)
- [Security Testing](./testing/security-testing.md)

### Deployment & DevOps
- [CI/CD Pipeline](./devops/ci-cd-pipeline.md)
- [Azure Deployment](./devops/azure-deployment.md)
- [Environment Management](./devops/environment-management.md)
- [Monitoring & Logging](./devops/monitoring-logging.md)

### Contributing
- [Contributing Guidelines](./contributing/guidelines.md)
- [Pull Request Process](./contributing/pull-requests.md)
- [Issue Templates](./contributing/issue-templates.md)
- [Release Process](./contributing/release-process.md)

## Quick Start for Developers

### Prerequisites

Before starting development, ensure you have:

- **Node.js**: Version 18 LTS or later
- **npm**: Version 9 or later (or pnpm 8+)
- **Git**: Latest version
- **VS Code**: Recommended IDE with our extension pack
- **Docker**: For containerized development (optional)
- **Azure CLI**: For cloud resource management
- **PostgreSQL**: Local instance or Docker container

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/advisoros.git
cd advisoros

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 2. Development Environment

```bash
# Start the development server
npm run dev

# The application will be available at:
# Frontend: http://localhost:3000
# API: http://localhost:3000/api
# Database Studio: npm run db:studio (http://localhost:5555)
```

### 3. Development Workflow

```bash
# Create a feature branch
git checkout -b feature/client-management-enhancement

# Make your changes and test
npm run test
npm run lint
npm run type-check

# Commit your changes
git add .
git commit -m "feat(client): enhance client management with new filtering options"

# Push and create pull request
git push origin feature/client-management-enhancement
```

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AdvisorOS Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Next.js App   │    │   tRPC API      │    │ PostgreSQL  │  │
│  │   Frontend      │────│   Backend       │────│ Database    │  │
│  │                 │    │                 │    │             │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                       │     │
│           │                       │                       │     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  React Components│    │  External APIs  │    │   Azure     │  │
│  │  UI Library     │    │  - QuickBooks   │    │   Services  │  │
│  │  Tailwind CSS   │    │  - Azure AD B2C │    │   - Blob    │  │
│  └─────────────────┘    └─────────────────┘    │   - AI      │  │
│                                                 └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components + Radix UI primitives
- **Charts**: Tremor UI + Recharts
- **Forms**: React Hook Form + Zod validation
- **State**: React hooks + Context API

#### Backend
- **API**: tRPC with type-safe procedures
- **Runtime**: Node.js 18+ (Azure Functions)
- **ORM**: Prisma with PostgreSQL
- **Authentication**: NextAuth.js with Azure AD B2C
- **File Storage**: Azure Blob Storage
- **Background Jobs**: Azure Functions

#### Database
- **Primary**: PostgreSQL 14+ on Azure
- **ORM**: Prisma for type-safe database operations
- **Migrations**: Prisma Migrate
- **Seeding**: Custom seed scripts

#### Infrastructure
- **Hosting**: Azure Static Web Apps + Azure Functions
- **Database**: Azure Database for PostgreSQL
- **Storage**: Azure Blob Storage
- **CDN**: Azure CDN with Front Door
- **Monitoring**: Application Insights

## Core Concepts

### 1. Multi-Tenancy

AdvisorOS is built as a multi-tenant application where each CPA firm is an organization:

```typescript
// Every database entity includes organizationId
interface BaseEntity {
  id: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

// All API procedures are organization-scoped
export const clientRouter = createTRPCRouter({
  list: organizationProcedure  // Automatically filters by organizationId
    .input(clientListSchema)
    .query(async ({ ctx, input }) => {
      // ctx.organizationId is automatically available
      return await getClients(ctx.organizationId, input)
    })
})
```

### 2. Type Safety

End-to-end type safety from database to UI:

```typescript
// Database schema (Prisma)
model Client {
  id              String   @id @default(cuid())
  organizationId  String
  businessName    String
  primaryContactEmail String
  status          ClientStatus
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// API types (Zod schemas)
export const createClientSchema = z.object({
  businessName: z.string().min(1),
  primaryContactEmail: z.string().email(),
  status: z.enum(['prospect', 'active', 'inactive'])
})

// Frontend usage (fully typed)
const createClient = api.client.create.useMutation()
const handleSubmit = (data: CreateClientInput) => {
  createClient.mutate(data)  // TypeScript knows the exact shape
}
```

### 3. Security Model

Role-based access control (RBAC) with organization isolation:

```typescript
// User roles within organizations
enum Role {
  OWNER = 'owner',        // Full access including billing
  ADMIN = 'admin',        // Administrative access
  CPA = 'cpa',           // Client and document management
  STAFF = 'staff'        // Limited access to assigned clients
}

// Procedure-level authorization
export const adminProcedure = organizationProcedure
  .use(({ ctx, next }) => {
    if (!['owner', 'admin'].includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
    return next()
  })
```

## Development Patterns

### 1. API Development Pattern

```typescript
// 1. Define Zod schema for validation
export const createClientSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  primaryContactEmail: z.string().email('Valid email required'),
  businessType: z.enum(['individual', 'corporation', 'llc', 'partnership'])
})

// 2. Create service layer
export class ClientService {
  static async createClient(
    data: CreateClientInput,
    organizationId: string,
    userId: string
  ): Promise<Client> {
    // Business logic here
    return await prisma.client.create({
      data: { ...data, organizationId, createdBy: userId }
    })
  }
}

// 3. Create tRPC procedure
export const clientRouter = createTRPCRouter({
  create: organizationProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientService.createClient(
        input,
        ctx.organizationId,
        ctx.userId
      )
    })
})

// 4. Use in frontend
const createClient = api.client.create.useMutation({
  onSuccess: () => {
    toast.success('Client created successfully')
    utils.client.list.invalidate()
  }
})
```

### 2. Component Development Pattern

```typescript
// 1. Define component props with TypeScript
interface ClientFormProps {
  client?: Client
  onSubmit: (data: CreateClientInput) => void
  isLoading?: boolean
}

// 2. Create reusable component
export function ClientForm({ client, onSubmit, isLoading }: ClientFormProps) {
  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: client
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Client'}
        </Button>
      </form>
    </Form>
  )
}

// 3. Use in page component
export default function CreateClientPage() {
  const createClient = api.client.create.useMutation()

  return (
    <ClientForm
      onSubmit={(data) => createClient.mutate(data)}
      isLoading={createClient.isLoading}
    />
  )
}
```

### 3. Error Handling Pattern

```typescript
// Server-side error handling
export const clientRouter = createTRPCRouter({
  create: organizationProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ClientService.createClient(input, ctx.organizationId, ctx.userId)
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Client with this email already exists'
            })
          }
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create client'
        })
      }
    })
})

// Client-side error handling
const createClient = api.client.create.useMutation({
  onError: (error) => {
    if (error.data?.code === 'CONFLICT') {
      toast.error('A client with this email already exists')
    } else {
      toast.error('Failed to create client. Please try again.')
    }
  }
})
```

## Development Tools

### 1. VS Code Extensions

Our recommended VS Code extension pack includes:

- **TypeScript Hero**: Auto-import and organize imports
- **Prisma**: Database schema syntax highlighting
- **Tailwind CSS IntelliSense**: CSS class suggestions
- **ES7+ React/Redux/React-Native snippets**: React snippets
- **GitLens**: Enhanced Git integration
- **Thunder Client**: API testing within VS Code

### 2. Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### 3. Code Quality Tools

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error'
  }
}
```

#### Prettier Configuration
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
// Test API procedures
import { createTRPCMsw } from '@trpc/msw'
import { appRouter } from '@/server/api/root'

describe('Client API', () => {
  it('should create client with valid data', async () => {
    const caller = appRouter.createCaller({
      organizationId: 'org-123',
      userId: 'user-123',
      prisma: mockPrisma
    })

    const result = await caller.client.create({
      businessName: 'Test Corp',
      primaryContactEmail: 'test@example.com',
      businessType: 'corporation'
    })

    expect(result.businessName).toBe('Test Corp')
  })
})
```

### 2. Integration Tests

```typescript
// Test database operations
import { PrismaClient } from '@prisma/client'
import { ClientService } from '@/lib/services/client-service'

describe('ClientService Integration', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
    await prisma.$connect()
  })

  it('should create and retrieve client', async () => {
    const client = await ClientService.createClient({
      businessName: 'Integration Test Corp',
      primaryContactEmail: 'integration@test.com',
      businessType: 'corporation'
    }, 'org-123', 'user-123')

    expect(client.id).toBeDefined()

    const retrieved = await ClientService.getClientById(
      client.id,
      'org-123'
    )

    expect(retrieved?.businessName).toBe('Integration Test Corp')
  })
})
```

### 3. E2E Tests

```typescript
// Test complete user journeys
import { test, expect } from '@playwright/test'

test('client management workflow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[data-testid=email]', 'test@example.com')
  await page.fill('[data-testid=password]', 'password')
  await page.click('[data-testid=login-button]')

  // Navigate to clients
  await page.click('[data-testid=clients-nav]')
  await expect(page).toHaveURL('/clients')

  // Create new client
  await page.click('[data-testid=add-client-button]')
  await page.fill('[data-testid=business-name]', 'E2E Test Corp')
  await page.fill('[data-testid=email]', 'e2e@test.com')
  await page.click('[data-testid=save-button]')

  // Verify client was created
  await expect(page.locator('text=E2E Test Corp')).toBeVisible()
})
```

## Performance Considerations

### 1. Database Optimization

```typescript
// Use appropriate indexes
// In Prisma schema:
model Client {
  id              String   @id @default(cuid())
  organizationId  String
  businessName    String
  primaryContactEmail String @unique
  status          ClientStatus

  @@index([organizationId, status])
  @@index([organizationId, businessName])
}

// Optimize queries with proper includes
const clients = await prisma.client.findMany({
  where: { organizationId },
  include: {
    documents: {
      select: { id: true, name: true }  // Only select needed fields
    }
  },
  take: 20  // Pagination
})
```

### 2. Frontend Optimization

```typescript
// Use React.memo for expensive components
export const ClientCard = React.memo(({ client }: { client: Client }) => {
  return (
    <div className="p-4 border rounded">
      <h3>{client.businessName}</h3>
      <p>{client.primaryContactEmail}</p>
    </div>
  )
})

// Lazy load heavy components
const DocumentViewer = lazy(() => import('@/components/DocumentViewer'))

// Use useMemo for expensive computations
const expensiveCalculation = useMemo(() => {
  return clients.reduce((acc, client) => acc + client.annualRevenue, 0)
}, [clients])
```

### 3. API Optimization

```typescript
// Implement proper caching
export const clientRouter = createTRPCRouter({
  list: organizationProcedure
    .input(clientListSchema)
    .query(async ({ ctx, input }) => {
      // Cache key based on organization and filters
      const cacheKey = `clients:${ctx.organizationId}:${JSON.stringify(input)}`

      return await redis.cache(cacheKey, async () => {
        return await ClientService.getClients(ctx.organizationId, input)
      }, { ttl: 300 })  // 5 minute cache
    })
})
```

## Security Best Practices

### 1. Input Validation

```typescript
// Always validate inputs with Zod
export const createClientSchema = z.object({
  businessName: z.string()
    .min(1, 'Business name required')
    .max(255, 'Business name too long')
    .regex(/^[a-zA-Z0-9\s\-&.,']+$/, 'Invalid characters'),
  primaryContactEmail: z.string().email('Valid email required'),
  taxId: z.string()
    .optional()
    .refine(val => !val || /^\d{2}-\d{7}$/.test(val), 'Invalid tax ID format')
})
```

### 2. Authorization Checks

```typescript
// Check permissions at every level
export const deleteClientProcedure = organizationProcedure
  .input(z.object({ id: z.string().cuid() }))
  .mutation(async ({ ctx, input }) => {
    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: input.id,
        organizationId: ctx.organizationId
      }
    })

    if (!client) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    // Check user has permission to delete
    if (ctx.user.role === 'staff') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return await ClientService.deleteClient(input.id, ctx.organizationId, ctx.userId)
  })
```

### 3. Data Sanitization

```typescript
// Sanitize data before storage
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeClientData(data: CreateClientInput): CreateClientInput {
  return {
    ...data,
    businessName: DOMPurify.sanitize(data.businessName.trim()),
    primaryContactEmail: data.primaryContactEmail.toLowerCase().trim(),
    notes: data.notes ? DOMPurify.sanitize(data.notes) : undefined
  }
}
```

## Deployment Process

### 1. CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - name: Deploy to Azure
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
```

### 2. Environment Management

```typescript
// config/environment.ts
export const env = {
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  DATABASE_URL: process.env.DATABASE_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING!,

  // Validate environment variables
  get isProduction() {
    return this.NODE_ENV === 'production'
  },

  validate() {
    const required = ['DATABASE_URL', 'NEXTAUTH_SECRET']
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`)
      }
    }
  }
}

// Validate on startup
env.validate()
```

## Monitoring and Debugging

### 1. Logging Strategy

```typescript
// lib/logger.ts
import { createLogger, format, transports } from 'winston'

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
})

// Usage in API procedures
export const clientRouter = createTRPCRouter({
  create: organizationProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info('Creating client', {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        businessName: input.businessName
      })

      try {
        const client = await ClientService.createClient(input, ctx.organizationId, ctx.userId)
        logger.info('Client created successfully', { clientId: client.id })
        return client
      } catch (error) {
        logger.error('Failed to create client', { error, input })
        throw error
      }
    })
})
```

### 2. Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
})

// Custom error boundary
export function withErrorBoundary<T extends React.ComponentType<any>>(
  Component: T
): T {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div className="p-4 text-center">
        <h2>Something went wrong</h2>
        <button onClick={resetError}>Try again</button>
      </div>
    )
  }) as T
}
```

## Performance Monitoring

### 1. Application Insights Integration

```typescript
// lib/telemetry.ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

export const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: process.env.NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATION_KEY,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true
  }
})

appInsights.loadAppInsights()

// Track custom events
export function trackEvent(name: string, properties?: Record<string, any>) {
  appInsights.trackEvent({ name, properties })
}

// Track API performance
export function trackApiCall(name: string, duration: number, success: boolean) {
  appInsights.trackDependency({
    name,
    duration,
    success,
    dependencyType: 'API'
  })
}
```

## Contributing Guidelines

### 1. Branch Naming Convention

```bash
# Feature branches
feature/client-management-enhancement
feature/quickbooks-integration-v2

# Bug fixes
fix/client-email-validation
fix/document-upload-error

# Hotfixes
hotfix/security-vulnerability-patch

# Releases
release/v2.1.0
```

### 2. Commit Message Format

```bash
# Format: type(scope): description
feat(client): add bulk client import functionality
fix(auth): resolve session timeout issue
docs(api): update client API documentation
test(integration): add QuickBooks sync tests
refactor(database): optimize client queries
```

### 3. Pull Request Process

1. **Create Feature Branch**: Branch from `develop` for new features
2. **Implement Changes**: Follow coding standards and write tests
3. **Self Review**: Check your code before submitting
4. **Create PR**: Use our PR template with proper description
5. **Code Review**: Address reviewer feedback
6. **Testing**: Ensure all tests pass in CI
7. **Merge**: Squash and merge to maintain clean history

## Troubleshooting Common Issues

### 1. Development Environment Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reset node modules
rm -rf node_modules package-lock.json
npm install

# Reset database
npx prisma migrate reset
npx prisma db seed

# Check environment variables
npm run type-check
```

### 2. Database Issues

```bash
# Check database connection
npm run db:studio

# View database logs
az postgres flexible-server logs download \
  --name your-db-server \
  --resource-group your-rg

# Reset database schema
npx prisma migrate reset --force
```

### 3. API Issues

```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/trpc/client.create \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test","primaryContactEmail":"test@example.com"}'

# Check API logs
npm run dev -- --inspect
```

## Getting Help

### Internal Resources
- **Slack**: #advisoros-dev channel
- **Documentation**: This developer documentation
- **Code Reviews**: Request reviews from senior developers
- **Team Meetings**: Weekly development sync meetings

### External Resources
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **tRPC Documentation**: [trpc.io/docs](https://trpc.io/docs)
- **Prisma Documentation**: [prisma.io/docs](https://prisma.io/docs)
- **Azure Documentation**: [docs.microsoft.com/azure](https://docs.microsoft.com/azure)

### Support Contacts
- **Technical Lead**: tech-lead@advisoros.com
- **DevOps Team**: devops@advisoros.com
- **Security Team**: security@advisoros.com