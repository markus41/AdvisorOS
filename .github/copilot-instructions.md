# AdvisorOS - CPA Advisory Platform - Copilot Instructions

This workspace contains a comprehensive multi-tenant SaaS platform built for Certified Public Accountants (CPAs) to manage their practice, clients, and advisory services.

## Project Overview

### Platform Type
- **Target Users**: CPA firms (small to medium-sized)
- **Platform Type**: Multi-tenant SaaS platform with client portals
- **Primary Functions**: Client management, document management, financial advisory, QuickBooks integration
- **Business Model**: Subscription-based with organization-level billing

### Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Tremor UI
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js with Azure AD B2C integration
- **File Storage**: Azure Blob Storage with OCR processing
- **Infrastructure**: Azure Static Web Apps, Azure Functions, Terraform IaC
- **Integrations**: QuickBooks API, SendGrid, Azure Form Recognizer

## Architecture & Project Structure

### Monorepo Structure (Turborepo)
```
advisoros/
├── apps/
│   └── web/                     # Main Next.js 14 application
│       ├── src/
│       │   ├── app/            # App Router pages and API routes
│       │   ├── components/     # React components organized by domain
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/           # Utilities, clients, and configurations
│       │   ├── server/        # Server-side utilities and services
│       │   ├── types/         # TypeScript type definitions
│       │   └── middleware.ts  # Next.js middleware for auth/routing
│       ├── prisma/           # Database schema and migrations
│       ├── __tests__/        # Unit tests
│       ├── tests/           # Integration and E2E tests
│       └── package.json
├── packages/                   # Shared packages (future extension)
├── infrastructure/
│   └── terraform/             # Azure infrastructure as code
├── .ai/                       # AI agent configurations and conventions
├── docs/                      # Comprehensive documentation
└── scripts/                   # Development and deployment scripts
```

### Multi-Tenancy Architecture
- **Isolation Model**: Organization-based data isolation
- **Access Pattern**: All database queries filtered by `organizationId`
- **Routing**: Subdomain-based tenant identification (future)
- **Authentication**: Organization membership required for access
- **Client Portal**: Separate authentication flow for CPA clients

## Database Schema & Core Entities

### Primary Models
1. **Organization**: Root tenant entity with settings and branding
2. **User**: Team members with role-based access (owner, admin, cpa, staff)
3. **Client**: CPA clients with portal access and financial data
4. **Document**: Secure file management with categorization and OCR
5. **Note**: Client communications and interaction tracking
6. **QuickBooksToken**: OAuth tokens for QuickBooks integration
7. **AuditLog**: Comprehensive audit trail for compliance

### Database Conventions
- All entities must include `organizationId` for multi-tenant isolation
- Use UUIDs for primary keys for security and scalability
- Implement soft deletes with `deletedAt` timestamps
- Include audit fields: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- Use Prisma enums for status fields and standardized values

## Development Guidelines

### TypeScript Conventions
- **Strict Mode**: Always use TypeScript strict mode
- **Type Safety**: Avoid `any` type, use `unknown` for truly unknown types
- **Interfaces**: Use for object shapes and API contracts
- **Types**: Use for unions, primitives, and computed types
- **Naming**: PascalCase for interfaces/types, camelCase for variables/functions

### React/Next.js Patterns

#### Component Organization
```typescript
// Component structure pattern
import { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ComponentProps {
  organizationId: string;
  // other props
}

export const ComponentName: FC<ComponentProps> = ({ 
  organizationId,
  ...props 
}) => {
  // Hooks at the top
  const router = useRouter();
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // effect logic
  }, []);
  
  // Event handlers
  const handleAction = () => {
    // handler logic
  };
  
  // Render logic
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
};
```

#### File Organization
- **Components**: `/src/components/[domain]/ComponentName.tsx`
- **Pages**: `/src/app/[route]/page.tsx` (App Router)
- **API Routes**: `/src/app/api/[resource]/route.ts`
- **Hooks**: `/src/hooks/use[HookName].ts`
- **Utils**: `/src/lib/[category]/utility.ts`
- **Types**: `/src/types/[domain].ts`

### API Development Patterns

#### Route Handlers (App Router)
```typescript
// /src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const clients = await prisma.client.findMany({
      where: {
        organizationId: session.user.organizationId,
        deletedAt: null
      },
      include: {
        documents: true,
        notes: true
      }
    });
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

#### Error Handling
- Always wrap async operations in try-catch blocks
- Use appropriate HTTP status codes
- Log errors for debugging but don't expose sensitive information
- Implement proper error boundaries in React components
- Use Zod for input validation and return descriptive validation errors

### Security Requirements

#### Authentication & Authorization
- **Session Management**: Always verify session in API routes
- **Organization Access**: Check organization membership for all operations
- **Role-Based Access**: Implement role checks for sensitive operations
- **Client Portal**: Separate authentication flow with limited access

#### Data Protection
- **Input Validation**: Use Zod schemas for all API inputs
- **SQL Injection**: Use Prisma queries exclusively (no raw SQL)
- **File Upload**: Validate file types, sizes, and scan for malware
- **Sensitive Data**: Encrypt PII and financial data at rest

### Testing Strategy

#### Test Categories
1. **Unit Tests** (Jest + Testing Library)
   - Component behavior and rendering
   - Utility function logic
   - Custom hooks functionality

2. **Integration Tests** (Jest + Supertest)
   - API endpoint functionality
   - Database operations
   - Authentication flows

3. **End-to-End Tests** (Playwright)
   - Critical user journeys
   - Multi-tenant scenarios
   - QuickBooks integration flows

#### Test Scripts
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:all          # Complete test suite
```

## Development Workflow

### Available Scripts
```bash
# Development
npm run dev               # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### Git Workflow
- **Branch Naming**: `feature/description`, `fix/description`, `hotfix/description`
- **Commit Messages**: Follow conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Code Quality**: All commits must pass linting and tests
- **Review Process**: Pull requests required for all changes

### Environment Configuration

#### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/advisoros"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Azure Services
AZURE_STORAGE_CONNECTION_STRING="your-azure-storage-connection"
AZURE_FORM_RECOGNIZER_ENDPOINT="your-form-recognizer-endpoint"
AZURE_FORM_RECOGNIZER_KEY="your-form-recognizer-key"

# QuickBooks Integration
QUICKBOOKS_CLIENT_ID="your-qb-client-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-client-secret"
QUICKBOOKS_SANDBOX_URL="https://sandbox-quickbooks.api.intuit.com"

# OpenAI/AI Services
OPENAI_API_KEY="your-openai-api-key"

# Email
SENDGRID_API_KEY="your-sendgrid-api-key"
```

## AI/ML Integration

### OpenAI Services
- **Document Processing**: Extract and categorize financial documents
- **Advisory Insights**: Generate business insights and recommendations
- **Client Communications**: Draft professional communications
- **Data Analysis**: Analyze financial trends and patterns

### Azure AI Services
- **Form Recognizer**: OCR for document processing
- **Text Analytics**: Sentiment analysis for client communications
- **Cognitive Search**: Advanced document search capabilities

## Performance & Monitoring

### Performance Targets
- **Page Load**: < 3 seconds initial load
- **API Response**: < 500ms for standard operations
- **Database Queries**: < 100ms for simple queries
- **File Upload**: < 10 seconds for 10MB files

### Monitoring Tools
- **Application Insights**: Performance and error tracking
- **Prisma Insights**: Database query performance
- **Lighthouse CI**: Performance regression testing
- **Error Tracking**: Comprehensive error logging and alerting

## Deployment & Infrastructure

### Azure Architecture
- **Frontend**: Azure Static Web Apps
- **Backend**: Azure Functions (API routes)
- **Database**: Azure Database for PostgreSQL
- **Storage**: Azure Blob Storage
- **Authentication**: Azure AD B2C
- **Monitoring**: Application Insights

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and deployment
- **Staging Environment**: Full feature testing
- **Production Deployment**: Blue-green deployment strategy
- **Health Checks**: Automated health monitoring

## Best Practices for AI Development

### Code Generation
- Always include proper TypeScript types
- Implement comprehensive error handling
- Follow established patterns in the codebase
- Include appropriate comments for complex logic
- Ensure multi-tenant data isolation

### Documentation
- Update README files when adding new features
- Document API endpoints with examples
- Include setup instructions for new integrations
- Maintain architecture decision records (ADRs)

### Quality Assurance
- Write tests for new functionality
- Ensure accessibility compliance (WCAG 2.1 AA)
- Validate responsive design across devices
- Test performance impact of changes

---

This platform serves CPA firms with mission-critical financial data. Prioritize security, reliability, and compliance in all development decisions.