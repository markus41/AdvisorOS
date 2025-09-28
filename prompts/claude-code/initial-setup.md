# Claude Code Initial Setup Prompt

## Azure Infrastructure Setup

### Prompt for Complete Azure Setup
```
Create a complete Azure infrastructure using Terraform with the following specifications:

**Infrastructure Requirements:**
1. Azure Static Web Apps for Next.js 14 hosting
   - Production and staging environments
   - Custom domain support
   - Automatic SSL certificates

2. Azure Functions for API backend
   - Node.js 18 with TypeScript
   - HTTP triggers for REST API
   - Durable Functions for long-running tasks
   - Application Insights integration

3. Azure Database for PostgreSQL
   - Flexible Server
   - High availability with zone redundancy
   - Automated backups (7-day retention)
   - Connection pooling enabled

4. Azure AD B2C for authentication
   - User flows for sign-up/sign-in
   - Password reset flow
   - Custom attributes for organization
   - Multi-factor authentication

5. Azure Key Vault for secrets
   - Store database connection strings
   - API keys for third-party services
   - SSL certificates
   - Managed identities for access

6. Azure Blob Storage for documents
   - Separate containers for each organization
   - Lifecycle management policies
   - Soft delete enabled
   - CDN integration for static assets

7. Azure Application Insights
   - Full telemetry for frontend and backend
   - Custom metrics and alerts
   - Log aggregation
   - Performance monitoring

**Environment Configuration:**
- Three environments: dev, staging, production
- Environment-specific variables
- Resource naming convention: {env}-cpa-{resource}
- Tags for cost tracking and management

**Security Requirements:**
- Network security groups
- Private endpoints for database
- Managed identities where possible
- RBAC permissions
- SSL/TLS everywhere

**Output Requirements:**
1. Main terraform configuration (main.tf)
2. Variables file (variables.tf)
3. Environment-specific tfvars files
4. Outputs file (outputs.tf)
5. Provider configuration
6. README with deployment instructions

Generate complete, production-ready Terraform configurations.
```

## Database Schema Setup

### Prompt for Prisma Schema
```
Create a complete Prisma schema for a multi-tenant CPA platform with the following requirements:

**Core Models:**
1. Organization (tenant root)
   - ID, name, subdomain
   - Subscription plan and status
   - Settings JSON field
   - Created/updated timestamps

2. User (team members)
   - Basic info (email, name, password hash)
   - Role enum (owner, admin, cpa, staff)
   - Organization relationship
   - Avatar URL
   - Email verified flag
   - Last login timestamp

3. Client (CPA clients)
   - Company/individual info
   - Contact details
   - Tax information (EIN, fiscal year)
   - QuickBooks integration ID
   - Status (active, inactive, prospective)
   - Assigned team members

4. Document
   - File metadata (name, size, mime type)
   - Storage URL
   - Category (tax_return, financial_statement, receipt, etc.)
   - OCR extracted text
   - Client relationship
   - Upload user tracking

5. Note
   - Client relationship
   - Content (rich text)
   - Author tracking
   - Attachments support

6. QuickBooksToken
   - OAuth tokens storage
   - Refresh token
   - Realm ID
   - Expiry tracking

**Relationships:**
- All models linked to organizationId
- Soft deletes with deletedAt
- Audit fields (createdBy, updatedBy)
- Proper indexes for performance

**Features:**
- UUID primary keys
- Timestamp defaults
- Unique constraints
- Compound indexes for queries
- Full-text search support

Generate complete schema.prisma file with all relationships and indexes.
```

## Authentication System

### Prompt for NextAuth Configuration
```
Build a complete authentication system for Next.js 14 using:

**Technologies:**
- NextAuth.js v5
- Azure AD B2C provider
- Prisma adapter
- JWT strategy with refresh tokens

**Features Required:**
1. Registration flow
   - Organization creation
   - Admin user setup
   - Email verification
   - Welcome email

2. Multi-tenant login
   - Organization context
   - Subdomain routing
   - Role-based access

3. Team management
   - Invite by email
   - Role assignment
   - Pending invitations
   - Team directory

4. Client portal
   - Separate auth flow
   - Limited permissions
   - Document access only
   - No admin features

5. Security features
   - Password requirements
   - MFA support
   - Session management
   - Audit logging
   - Rate limiting

**File Structure:**
- /app/api/auth/[...nextauth]/route.ts
- /lib/auth/config.ts
- /lib/auth/providers.ts
- /middleware.ts for protection
- /components/auth/* for UI

**Implementation Requirements:**
- TypeScript strict mode
- Error handling
- Loading states
- Responsive design
- WCAG compliance

Generate complete authentication implementation with all files.
```

## Frontend Components

### Prompt for Component Library
```
Create a comprehensive React component library for the CPA platform using:

**Tech Stack:**
- React 18 with TypeScript
- Tailwind CSS
- Tremor for charts
- React Hook Form
- Zod validation

**Core Components Needed:**

1. Layout Components
   - AppShell with sidebar
   - PageHeader with breadcrumbs
   - Footer

2. Form Components
   - Input with validation
   - Select/Multiselect
   - DatePicker
   - FileUpload
   - Rich text editor

3. Data Display
   - DataTable with sorting/filtering
   - Card components
   - Stat cards
   - Charts (line, bar, pie)
   - Timeline

4. Navigation
   - Sidebar navigation
   - Tabs
   - Breadcrumbs
   - Pagination

5. Feedback
   - Alert/Toast
   - Modal/Dialog
   - Loading states
   - Empty states
   - Error boundaries

**Requirements:**
- Full TypeScript types
- Accessibility (ARIA)
- Responsive design
- Dark mode support
- Storybook stories
- Unit tests

Generate complete component implementations with proper organization.
```

## API Development

### Prompt for API Routes
```
Implement comprehensive Next.js 14 API routes with:

**Architecture:**
- RESTful design
- TypeScript
- Prisma ORM
- Zod validation
- Error handling

**Core APIs Needed:**

1. Authentication
   - Register organization
   - Login/logout
   - Refresh token
   - Password reset
   - Email verification

2. User Management
   - CRUD operations
   - Role updates
   - Invitations
   - Profile updates

3. Client Management
   - CRUD operations
   - Search/filter
   - Bulk operations
   - Import/export

4. Document Management
   - Upload with progress
   - Download
   - OCR processing
   - Categorization
   - Search

5. QuickBooks Integration
   - OAuth flow
   - Sync operations
   - Webhook handlers
   - Error recovery

**Features:**
- Request validation
- Response formatting
- Error handling
- Rate limiting
- Audit logging
- Multi-tenancy checks

Generate complete API implementation with middleware and utilities.
```

## Testing Strategy

### Prompt for Test Suite
```
Create comprehensive test suites for the CPA platform:

**Testing Levels:**
1. Unit Tests (Jest)
   - Components
   - Utilities
   - API handlers
   - Database queries

2. Integration Tests
   - API endpoints
   - Database operations
   - Authentication flows
   - Third-party integrations

3. E2E Tests (Playwright)
   - User registration
   - Client management
   - Document upload
   - QuickBooks sync
   - Multi-tenant scenarios

**Test Coverage:**
- Minimum 80% code coverage
- Critical path 100% coverage
- Edge cases and error states
- Performance benchmarks

**Test Data:**
- Factories for models
- Seeders for database
- Mock data generators
- Fixture files

Generate complete test setup with examples for each category.
```