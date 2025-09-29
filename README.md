# CPA Advisory Platform MVP

AdvisorOS is a production-ready, multi-tenant SaaS platform that unifies client management, workflow automation, and revenue intelligence for modern CPA firms.

## Executive Summary

- **Mission:** Give CPA teams a single operating system that merges QuickBooks data, automated compliance workflows, and advisory insights so they can scale beyond traditional bookkeeping.
- **Core Outcomes:** Streamlined client onboarding, proactive revenue analytics, secure document collaboration, and audit-ready controls baked into every release.
- **How to Explore:** Start with the live documentation portal, branch into the curated wiki for process snapshots, then dive into the repo for implementation detail.

## Documentation & Knowledge Base

- **Live Docs (GitHub Pages):** [https://markusahling.github.io/AdvisorOS/](https://markusahling.github.io/AdvisorOS/) – Built with the Just-the-Docs theme and continuously validated in CI to guarantee a clean deploy.
- **Knowledge Wiki:** [AdvisorOS Overview](https://github.com/MarkusAhling/AdvisorOS/wiki/Overview) – Mirrors the executive summary and links back to the docs portal so stakeholders never have to browse raw markdown files.
- **Source Repository:** [GitHub](https://github.com/MarkusAhling/AdvisorOS) – Use structured PRs and the docs build workflow to keep the public site green.

## 🏗️ Architecture

This project uses a **Turborepo** monorepo structure with:

- **Next.js 14** with App Router and TypeScript
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for multi-tenant authentication
- **Tailwind CSS** with Tremor for charts
- **Azure services** for cloud deployment
- **QuickBooks API** integration

## 📁 Project Structure

```
cpa-platform/
├── apps/
│   └── web/                    # Next.js 14 frontend application
├── packages/
│   ├── database/               # Prisma schema and database client
│   ├── ui/                     # Shared UI components
│   └── types/                  # TypeScript type definitions
├── infrastructure/
│   └── azure/                  # Terraform configuration for Azure
└── turbo.json                  # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd cpa-platform
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cd apps/web
   cp .env.local.example .env.local
   ```
   Update the `.env.local` file with your database URL and other credentials.

3. **Set up the database:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 📊 Key Features

### Multi-Tenant Architecture
- Organization-based data isolation
- Subdomain-based tenant routing
- Role-based access control (Owner, Admin, CPA, Staff)

### Client Management
- Comprehensive client profiles
- QuickBooks synchronization
- Financial data storage and analysis

### Document Management
- Secure file upload and storage
- OCR text extraction
- Categorized document organization

### Financial Advisory Tools
- Interactive dashboards with Tremor charts
- Financial data visualization
- Client reporting capabilities

## 🛠️ Development

### Available Scripts

```bash
# Start all applications in development
npm run dev

# Build all applications
npm run build

# Lint all packages
npm run lint

# Database operations
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio

# Format code
npm run format
```

### Database Schema

The platform uses these core models:
- **Organization**: Multi-tenant root entity
- **User**: Team members with role-based access
- **Client**: CPA clients with QuickBooks integration
- **Document**: File management with categorization
- **QuickBooksToken**: OAuth token storage
- **Note**: Client communication tracking

## 🌊 Deployment

### Azure Deployment

The infrastructure is defined using Terraform in `infrastructure/azure/`:

1. **Configure Terraform variables:**
   ```bash
   cd infrastructure/azure
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Deploy to Azure:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

The deployment includes:
- Azure App Service for hosting
- PostgreSQL database
- Storage account for documents
- Application Insights for monitoring

### Environment Variables

Required environment variables:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
AZURE_STORAGE_CONNECTION_STRING="..."
QUICKBOOKS_CLIENT_ID="your-qb-client-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-client-secret"
```

## 📚 API Documentation

### Authentication
- Multi-tenant authentication with NextAuth.js
- Organization-based user isolation
- JWT session management

### Database Access
- Prisma ORM for type-safe queries
- Automatic client-side generation
- Connection pooling and optimization

### File Storage
- Azure Blob Storage integration
- Secure file upload endpoints
- OCR processing pipeline

## 🔒 Security Features

- Multi-tenant data isolation
- Role-based access control
- Secure file upload validation
- Environment-specific configurations
- SQL injection protection via Prisma

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Create an issue in the repository
- Contact the development team

---

Built with ❤️ for CPA professionals
