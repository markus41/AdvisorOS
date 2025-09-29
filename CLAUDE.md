# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AdvisorOS - AI-Powered CPA Platform

### Project Overview
AdvisorOS is a comprehensive, multi-tenant CPA platform that streamlines accounting workflows through intelligent automation, client management, and financial analytics. Built as a modern monorepo with Next.js, tRPC, Prisma, and Azure AI services, featuring 31 specialized AI agents and comprehensive MCP ecosystem integration for professional development.

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

## Advanced Multi-Agent Architecture

AdvisorOS features 31 specialized AI agents organized into domain-specific categories. **Always check the agent registry (.claude/agents/) and use appropriate sub-agents for optimal results.**

### Core Development Agents
- **backend-api-developer**: API endpoints, tRPC procedures, database operations, multi-tenant security
- **frontend-builder**: React components, UI/UX, Next.js pages, responsive design
- **database-optimizer**: Query optimization, schema design, performance, multi-tenant indexing
- **architecture-designer**: System design, database schemas, Azure infrastructure, scalability
- **devops-azure-specialist**: CI/CD, Azure deployment, infrastructure as code

### CPA-Specific Agents
- **cpa-tax-compliance**: Tax calculations, GAAP compliance, financial analysis, audit trails
- **audit-trail-perfectionist**: SOX compliance, forensic accounting, regulatory audit trails
- **financial-prediction-modeler**: Cash flow forecasting, anomaly detection, seasonal modeling
- **document-intelligence-optimizer**: OCR processing, tax document classification, AI workflows
- **compliance-planner**: Regulatory change monitoring, audit preparation, training programs

### Quality & Security Agents
- **security-auditor**: Multi-tenant security, vulnerability assessments, penetration testing
- **test-suite-developer**: Unit, integration, E2E tests, CPA workflow testing
- **technical-debt-planner**: Code quality assessment, refactoring prioritization
- **performance-optimization-specialist**: Application scaling, database optimization, caching

### Business Intelligence Agents
- **revenue-intelligence-analyst**: Feature monetization, pricing strategies, upselling analysis
- **client-success-optimizer**: Engagement analysis, retention strategies, onboarding optimization
- **feature-adoption-tracker**: Usage analytics, feature discovery, adoption improvement
- **workflow-efficiency-analyzer**: Process optimization, bottleneck identification
- **user-journey-optimizer**: UX workflows, conversion optimization, friction reduction

### Integration & AI Agents
- **integration-specialist**: QuickBooks, Stripe, Azure AI services, webhook management
- **ai-features-orchestrator**: OpenAI integration, document processing, insights generation
- **smart-automation-designer**: Workflow automation, intelligent process optimization
- **market-intelligence-analyst**: Competitive analysis, industry trends, market positioning

### Specialized Utility Agents
- **docs-writer**: Technical documentation, API docs, user guides, JSDoc generation
- **demo-data-generator**: Realistic CPA test data, client profiles, financial scenarios
- **excel-interface-perfectionist**: Spreadsheet interfaces, Excel-like functionality
- **micro-animation-coordinator**: UI animations, transitions, interactive feedback
- **marketing-site-optimizer**: Landing pages, SEO optimization, conversion tracking
- **tax-season-optimizer**: Peak season planning, capacity management, performance monitoring

### Documentation & Knowledge Agents
- **documentation-evolution-manager**: Documentation strategy, automation, knowledge management
- **client-portal-designer**: Self-service interfaces, collaboration workflows, portal optimization

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

## Enhanced MCP Ecosystem Integration

### Advanced Development Environment
AdvisorOS integrates with a comprehensive MCP (Model Context Protocol) ecosystem providing professional AI development tools, database integration, and CPA-specific workflows.

### Available MCP Servers
- **Zen MCP Server**: Professional AI development tools for code review, debugging, and testing
- **PostgreSQL MCP**: Direct database access with multi-tenant query validation
- **Azure AI MCP**: Form Recognizer, Text Analytics, OpenAI integration
- **GitHub MCP**: Repository management and CI/CD workflows
- **Stripe MCP**: Payment processing and subscription management
- **QuickBooks MCP**: Accounting data synchronization and validation
- **Browser MCP**: Puppeteer automation for E2E testing and QA
- **Memory Bank MCP**: Persistent context storage for complex projects
- **Gateway MCP**: API gateway management for multi-tenant routing

### MCP-Enhanced Workflows
```bash
# Start Claude CLI with complete MCP ecosystem
cd C:\\Users\\MarkusAhling\\AdvisorOS
claude chat --config .claude\\claude_desktop_config.json

# Tax calculation review with AI validation
claude chat "Review tax calculation logic ensuring multi-tenant isolation and IRS compliance"

# Multi-tenant security audit
claude chat "Perform comprehensive security audit focusing on organization isolation and RBAC"

# Financial compliance validation
claude chat "Validate SOX and GAAP compliance across all CPA modules with audit trails"
```

### Agentic Command System
```bash
# Tax season preparation workflow
/tax-season-prep Q1-2024

# Complete client onboarding automation
/client-onboarding "Acme Corp, john@acme.com"

# Feature deployment with testing and security
/feature-rollout "Document AI Enhancement v2.1"

# Production deployment with validation
/production-deploy "Release v1.2.0"

# CPA workflow automation chain
/cpa-workflow-chain "Monthly Financial Package - Client XYZ"

# MCP server setup
/mcp-setup postgresql
```

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
# Start complete dev environment with all services
npm run dev:start

# Start development server (Turbo monorepo)
npm run dev

# Stop dev environment
npm run dev:stop

# Reset dev environment
npm run dev:reset

# Test database connection
npm run dev:test

# Test local database specifically
npm run dev:test-local

# Complete database setup
npm run dev:setup-db

# Open Prisma Studio (cross-platform)
npm run dev:studio
```

### Advanced Development Tools
```bash
# AI-powered security auditing
npm run security:audit:full              # Complete security assessment
npm run security:audit:isolation         # Cross-tenant isolation check
npm run security:audit:permissions       # RBAC validation

# Performance analysis with AI insights
npm run perf:analyze:database            # Database optimization insights
npm run perf:analyze:api                 # API performance analysis
npm run perf:analyze:frontend            # Frontend optimization analysis

# Intelligent debugging tools
npm run debug:security:cross-tenant <userId> <resourceId>
npm run debug:perf:slow-queries
npm run debug:azure-ai <organizationId> <service>
npm run debug:workflow:tax-calculation <calculationId>
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

### AI-Enhanced Quality Assurance
- **Multi-Agent Testing**: Use test-suite-developer agent for comprehensive test strategies
- **Security-First Development**: security-auditor agent validates multi-tenant isolation
- **Performance Optimization**: performance-optimization-specialist monitors and optimizes
- **Compliance Validation**: cpa-tax-compliance agent ensures regulatory compliance
- **Code Quality**: AI-powered linting, formatting, and TypeScript validation
- **Automated Security**: Never commit secrets, comprehensive audit trail logging
- **Cross-Tenant Security**: organizationId validation on all data operations
- **Professional Standards**: CPA workflow validation and audit trail generation

### Development Quality Gates
1. **Pre-Commit**: Security scan, cross-tenant validation, code quality check
2. **Testing**: Multi-tenant test isolation, CPA workflow validation, security testing
3. **Deployment**: Performance validation, compliance check, security audit
4. **Production**: Real-time monitoring, automated scaling, audit trail verification

### AI Development Acceleration Metrics
- **50% Faster Development**: Pre-built templates with security and compliance patterns
- **90% Fewer Security Issues**: Built-in multi-tenant security with AI validation
- **75% Better Performance**: Optimized database patterns and intelligent caching
- **95% Compliance Accuracy**: Automated audit trails and regulatory validation

## Production Deployment & Monitoring

### Azure Infrastructure
- **Multi-Tenant Architecture**: Organization-isolated data with performance optimization
- **Auto-Scaling**: Tax season capacity management with predictive scaling
- **Security Monitoring**: Real-time threat detection and automated response
- **Compliance Tracking**: SOX/GAAP audit trail generation and validation
- **Performance Monitoring**: AI-powered performance analysis and optimization

### Production Commands
```bash
# Production deployment with validation
/production-deploy "Release v1.2.0"

# Tax season capacity planning
/tax-season-prep Q1-2024

# Real-time security monitoring
npm run security:monitor:real-time

# Performance analysis under load
npm run perf:monitor:production

# Compliance audit execution
npm run compliance:audit:sox
```

### Emergency Response
```bash
# Security incident response
npm run security:incident:response

# Performance degradation analysis
npm run debug:perf:production

# Cross-tenant isolation validation
npm run security:isolation:validate

# Audit trail integrity check
npm run audit:integrity:verify
```

## Professional CPA Development Standards

### Multi-Tenant Security Requirements
- **Organization Isolation**: All queries must include organizationId filtering
- **Role-Based Access Control**: Hierarchical permissions (Owner > Admin > CPA > Staff)
- **Audit Trail Compliance**: Comprehensive logging for SOX and GAAP requirements
- **Data Encryption**: End-to-end encryption for sensitive financial information
- **Session Security**: JWT validation with organization claims verification

### CPA Business Logic Patterns
- **Tax Calculation Engine**: IRS-compliant calculations with audit trail generation
- **Financial Reporting**: GAAP-compliant reports with professional formatting
- **Client Workflow Management**: Professional service delivery with quality controls
- **Document Processing**: AI-powered OCR with compliance validation
- **Engagement Tracking**: Project management with billing and time tracking

### Performance & Scalability Standards
- **Tax Season Readiness**: 10x capacity scaling for peak periods
- **Multi-Tenant Optimization**: Efficient queries across thousands of organizations
- **Real-Time Processing**: Sub-second response times for critical workflows
- **Batch Processing**: Overnight processing for large-scale tax calculations
- **Cache Strategy**: Intelligent caching with tenant isolation

## Important Development Reminders
- **Agent-First Development**: Always check .claude/agents/ for specialized assistance
- **Multi-Tenant Security**: Every database operation must include organizationId validation
- **CPA Compliance**: Use cpa-tax-compliance agent for financial accuracy
- **Production Quality**: Leverage AI agents for quality gates and security validation
- **MCP Integration**: Utilize comprehensive MCP ecosystem for enhanced capabilities