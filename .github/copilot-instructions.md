# CPA Advisory Platform MVP - Copilot Instructions

This workspace contains a comprehensive CPA Advisory Platform built with Next.js 14, TypeScript, and Azure services.

## Project Overview
- **Type**: Multi-tenant SaaS platform for CPAs
- **Architecture**: Turborepo monorepo with separate apps and packages
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: API routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js with multi-tenant support
- **Integrations**: QuickBooks API, Azure services
- **Charts**: Tremor UI library

## Project Structure
```
/cpa-platform
├── /apps
│   ├── /web (Next.js 14 frontend)
│   └── /api (API routes)
├── /packages
│   ├── /database (Prisma + PostgreSQL)
│   ├── /ui (Shared components)
│   └── /types (TypeScript types)
├── /infrastructure
│   └── /azure (Terraform files)
└── turbo.json (Turborepo config)
```

## Key Features
- Multi-tenant architecture with organization-based access
- Client management with QuickBooks synchronization
- Document management with OCR capabilities
- Financial advisory tools and dashboards
- Role-based access control (owner, admin, cpa, staff)
- Azure deployment ready

## Development Guidelines
- Use TypeScript strict mode throughout the project
- Follow Next.js 14 App Router conventions
- Implement proper error handling and loading states
- Use Prisma for all database operations
- Follow multi-tenant patterns for data isolation
- Implement proper authentication checks on all routes

## Database Models
- Organization: Multi-tenant root entity
- User: Team members with role-based access
- Client: CPA clients with QuickBooks integration
- Document: File management with categorization
- QuickBooksToken: OAuth token storage
- Note: Client communication tracking