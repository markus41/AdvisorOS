# CPA Platform - Project Context for AI Agents

## Project Overview
You are working on a multi-tenant SaaS platform for Certified Public Accountants (CPAs) to manage their practice, clients, and advisory services.

## Business Domain
- **Target Users**: CPA firms (small to medium-sized)
- **Primary Functions**: Client management, document management, financial advisory, QuickBooks integration
- **Key Value Proposition**: Streamline CPA operations with automated workflows and client portal

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components + Tremor UI for charts
- **State Management**: React hooks + Context API

### Backend
- **API**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Azure AD B2C
- **File Storage**: Azure Blob Storage
- **Background Jobs**: Azure Functions

### Infrastructure
- **Hosting**: Azure Static Web Apps (frontend) + Azure Functions (backend)
- **Database**: Azure Database for PostgreSQL
- **Authentication**: Azure AD B2C
- **Secrets**: Azure Key Vault
- **Monitoring**: Application Insights

## Multi-Tenancy Model
- **Isolation**: Organization-based (each CPA firm is an organization)
- **Data Model**: All entities linked to organizationId
- **Access Control**: Role-based (owner, admin, cpa, staff)
- **Client Portal**: Separate authentication for clients

## Key Entities
1. **Organization**: Root tenant entity
2. **User**: Team members with roles
3. **Client**: CPA clients with portal access
4. **Document**: Files with categorization and OCR
5. **Note**: Client communications
6. **QuickBooksToken**: OAuth tokens for QB sync

## Integration Points
- **QuickBooks**: Full sync of clients, invoices, payments
- **Azure AD/Entra ID**: Enterprise SSO
- **Email**: SendGrid for notifications
- **Document Processing**: Azure Form Recognizer for OCR

## Security Requirements
- SOC 2 compliance
- End-to-end encryption for sensitive data
- Audit logging for all actions
- Regular security scanning
- PII data protection

## Performance Targets
- Page load: < 3s
- API response: < 500ms
- Dashboard refresh: < 2s
- Document upload: < 10s for 10MB

## Development Workflow
1. Feature branch from main
2. AI agents assist with implementation
3. Automated testing (unit + E2E)
4. Code review by AI + human
5. Deploy to staging
6. Production deployment

## Current Phase
MVP Development - Core features implementation

## Priority Features
1. User authentication and organization setup
2. Client management with QuickBooks sync
3. Document upload and management
4. Basic financial dashboards
5. Client portal with limited access