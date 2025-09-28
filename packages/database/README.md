# CPA Platform Database

This package contains the Prisma schema and database configuration for the CPA Platform application.

## Overview

The database schema is designed for a comprehensive CPA (Certified Public Accountant) platform that supports:

- **Multi-tenancy**: Organizations with their own isolated data
- **User Management**: Role-based access control with granular permissions
- **Client Management**: Comprehensive client profiles and data
- **Document Management**: Secure document storage with version control
- **Workflow Automation**: Customizable workflows for various CPA services
- **Task Management**: Hierarchical task system with dependencies
- **Billing & Invoicing**: Complete invoicing system with payment tracking
- **Reporting**: Automated report generation and storage
- **QuickBooks Integration**: Sync and webhook support
- **Audit Trail**: Complete audit logging for compliance
- **Authentication**: Secure authentication with attempt tracking

## Schema Models

### Core Models

- **Organization**: Multi-tenant organization structure
- **User**: User accounts with role-based access
- **TeamMember**: Extended team member profiles with permissions
- **Client**: Client management with comprehensive business data
- **Subscription**: Billing tier management with Stripe integration

### Document & Content Management

- **Document**: Secure document storage with versioning
- **Note**: Client communications and internal notes

### Workflow & Task Management

- **Workflow**: Automation templates for CPA services
- **Task**: Hierarchical task system with dependencies
- **Engagement**: Service engagements (tax, audit, advisory)

### Financial Management

- **Invoice**: Complete invoicing with line items and payments
- **Report**: Generated reports with metadata

### Security & Compliance

- **Permission**: Granular permission system
- **TeamMemberPermission**: Permission assignments
- **AuditLog**: Complete audit trail
- **AuthAttempt**: Login attempt tracking
- **AuthEvent**: Authentication event logging

### Integrations

- **QuickBooksToken**: OAuth token management
- **QuickBooksSync**: Sync operation tracking
- **QuickBooksWebhookEvent**: Webhook event processing

## Features

### Multi-Tenancy
All data is isolated by `organizationId` ensuring complete data separation between CPA firms.

### Soft Deletes
All models include `deletedAt` fields for soft deletion, allowing data recovery and compliance with retention policies.

### Audit Fields
All models include:
- `createdAt` / `updatedAt`: Automatic timestamps
- `createdBy` / `updatedBy`: User tracking for audit purposes

### Performance Optimization
Comprehensive indexing strategy including:
- Foreign key indexes for relationships
- Business logic indexes (status, type, dates)
- Search optimization indexes (email, business name)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

3. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

4. Run migrations:
   ```bash
   npm run db:migrate
   ```

5. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

### Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

For production, ensure your database URL includes SSL and proper security settings.

## Seeding

The seed script creates comprehensive sample data including:

- 3 Organizations (trial, professional, enterprise tiers)
- 6 Users with various roles
- 4 Team members with permissions
- 12 Granular permissions
- 3 Subscriptions with different billing tiers
- 4 Sample clients with different business types
- 2 Workflow templates (tax preparation, bookkeeping)
- 2 Active engagements
- Sample tasks, invoices, documents, and reports
- Audit logs and authentication events

## Security Considerations

1. **Password Security**: Passwords are hashed using bcryptjs
2. **Data Isolation**: Strict organization-level data separation
3. **Audit Trail**: All actions are logged for compliance
4. **Soft Deletes**: Data is preserved for audit purposes
5. **Permission System**: Granular role-based access control

## Database Design Principles

1. **Normalization**: Proper relational design with minimal redundancy
2. **Scalability**: Optimized for growth with proper indexing
3. **Flexibility**: JSON fields for extensible data structures
4. **Compliance**: Built-in audit trails and data retention
5. **Performance**: Strategic indexing for common query patterns

## Migration Strategy

When making schema changes:

1. Create a new migration:
   ```bash
   npx prisma migrate dev --name "your_migration_name"
   ```

2. Review the generated SQL
3. Test in development environment
4. Deploy to staging for validation
5. Apply to production during maintenance window

## Backup Strategy

Recommended backup approach:
- Daily automated backups
- Point-in-time recovery capability
- Regular backup restoration testing
- Off-site backup storage

## Monitoring

Key metrics to monitor:
- Database connection pool usage
- Query performance (slow query log)
- Index usage efficiency
- Storage growth patterns
- Backup completion status

## Support

For database-related issues:
1. Check the Prisma documentation
2. Review the schema for relationship requirements
3. Examine the seed data for usage examples
4. Check audit logs for debugging information