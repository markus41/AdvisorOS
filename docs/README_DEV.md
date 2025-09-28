# Developer Setup Guide

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Database Management](#database-management)
8. [Environment Configuration](#environment-configuration)
9. [Debugging](#debugging)
10. [Performance Optimization](#performance-optimization)
11. [Deployment](#deployment)
12. [Contributing](#contributing)

---

## Development Environment Setup

### System Requirements
- **Node.js**: 18.17.0 or higher (LTS recommended)
- **npm**: 10.0.0 or higher (included with Node.js)
- **PostgreSQL**: 14+ (local development)
- **Docker**: Optional for containerized development
- **Git**: Latest version for version control

### Recommended Tools
- **IDE**: Visual Studio Code with recommended extensions
- **Database Client**: pgAdmin, TablePlus, or Prisma Studio
- **API Testing**: Postman or Thunder Client
- **Git Client**: GitHub Desktop or command line
- **Terminal**: Windows Terminal, iTerm2, or built-in terminal

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "Prisma.prisma",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-todo-highlight"
  ]
}
```

---

## Prerequisites

### Required Software Installation

#### Node.js and npm
```bash
# Check if Node.js is installed
node --version  # Should be 18.17.0+
npm --version   # Should be 10.0.0+

# Install Node.js from https://nodejs.org/
# Or use a version manager like nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18.17.0
nvm use 18.17.0
```

#### PostgreSQL
```bash
# Option 1: Local PostgreSQL installation
# Download from https://www.postgresql.org/download/

# Option 2: Docker PostgreSQL
docker run --name cpa-postgres \
  -e POSTGRES_USER=cpa_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=cpa_platform \
  -p 5432:5432 \
  -d postgres:14

# Option 3: Cloud Database (Azure, AWS RDS, etc.)
# Use connection string provided by cloud provider
```

#### Git Configuration
```bash
# Configure Git with your information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up SSH key for GitHub
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add the public key to your GitHub account
```

---

## Installation

### Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-org/cpa-platform.git
cd cpa-platform

# Install dependencies (this may take a few minutes)
npm install

# Verify installation
npm run lint
```

### Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local  # or your preferred editor
```

#### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cpa_platform"

# Authentication
NEXTAUTH_SECRET="your-32-character-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Azure Storage (for file uploads)
AZURE_STORAGE_CONNECTION_STRING="your-azure-storage-connection"

# QuickBooks (for development, use Intuit sandbox)
QUICKBOOKS_CLIENT_ID="your-qb-sandbox-client-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-sandbox-client-secret"
QUICKBOOKS_SANDBOX_BASE_URL="https://sandbox-quickbooks.api.intuit.com"

# Stripe (use test keys for development)
STRIPE_SECRET_KEY="sk_test_your_stripe_test_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_test_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# Email (for development, use Mailtrap or similar)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-mailtrap-user"
SMTP_PASS="your-mailtrap-password"

# Optional: AI Services
AZURE_OPENAI_ENDPOINT="your-azure-openai-endpoint"
AZURE_OPENAI_API_KEY="your-azure-openai-key"
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed the database with initial data
npm run db:seed

# Open Prisma Studio to view data (optional)
npx prisma studio
```

### Verify Installation

```bash
# Start development server
npm run dev

# In another terminal, run tests
npm run test

# Check if everything is working
curl http://localhost:3000/api/health
```

---

## Project Structure

### Monorepo Architecture
```
cpa-platform/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # React components
│       │   ├── lib/          # Utility functions
│       │   └── server/       # Server-side code
│       ├── public/           # Static assets
│       └── package.json
├── packages/
│   ├── database/             # Prisma schema and client
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   ├── types/               # TypeScript type definitions
│   ├── ui/                  # Shared UI components
│   └── shared/              # Shared utilities
├── infrastructure/
│   └── azure/               # Terraform infrastructure
├── docs/                    # Documentation
├── .github/                 # GitHub workflows
└── package.json            # Root package.json
```

### Key Directories Explained

#### `/apps/web/src/app/`
```
app/
├── (auth)/                  # Authentication routes
├── api/                     # API routes
│   ├── auth/               # NextAuth endpoints
│   ├── clients/            # Client management
│   ├── documents/          # Document handling
│   └── quickbooks/         # QuickBooks integration
├── dashboard/              # Main dashboard
├── clients/                # Client management pages
├── documents/              # Document management
├── reports/                # Reporting interface
└── settings/               # Settings pages
```

#### `/apps/web/src/components/`
```
components/
├── ui/                     # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
├── forms/                  # Form components
├── charts/                 # Chart components (Tremor)
├── layout/                 # Layout components
└── features/               # Feature-specific components
    ├── clients/
    ├── documents/
    └── reports/
```

#### `/apps/web/src/lib/`
```
lib/
├── auth.ts                 # Authentication configuration
├── db.ts                   # Database connection
├── utils.ts                # Utility functions
├── validations/            # Zod schemas
├── hooks/                  # Custom React hooks
└── services/               # Business logic services
    ├── client.service.ts
    ├── document.service.ts
    └── quickbooks.service.ts
```

---

## Development Workflow

### Starting Development

```bash
# Start all services
npm run dev

# Or start specific services
npm run dev:web          # Next.js app only
npm run dev:db           # Database with Prisma Studio
npm run dev:docs         # Documentation server
```

### Making Changes

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
```bash
# Edit files using your preferred editor
# Follow the coding standards (see STYLE_GUIDE.md)
```

3. **Test Changes**
```bash
npm run lint              # Check code style
npm run type-check        # TypeScript type checking
npm run test              # Run tests
npm run test:e2e          # Run end-to-end tests
```

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add new client management feature"
```

5. **Push and Create PR**
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Code Generation

#### Generate New API Route
```bash
# Create new API route
mkdir -p apps/web/src/app/api/your-endpoint
touch apps/web/src/app/api/your-endpoint/route.ts
```

#### Generate New Page
```bash
# Create new page
mkdir -p apps/web/src/app/your-page
touch apps/web/src/app/your-page/page.tsx
```

#### Generate New Component
```bash
# Create new component
mkdir -p apps/web/src/components/your-component
touch apps/web/src/components/your-component/index.tsx
```

---

## Testing

### Test Setup

```bash
# Install test dependencies (already included)
npm install

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Types

#### Unit Tests
```bash
# Run unit tests only
npm run test:unit

# Test specific file
npm run test -- client.service.test.ts

# Test with coverage
npm run test:coverage
```

#### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

#### End-to-End Tests
```bash
# Run E2E tests (requires running application)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test
npx playwright test auth.spec.ts
```

### Writing Tests

#### Unit Test Example
```typescript
// apps/web/src/lib/services/__tests__/client.service.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ClientService } from '../client.service';
import { prisma } from '../../db';

describe('ClientService', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.client.deleteMany();
  });

  it('should create a new client', async () => {
    const clientData = {
      businessName: 'Test Business',
      primaryContactEmail: 'test@example.com',
      organizationId: 'test-org-id'
    };

    const client = await ClientService.createClient(clientData);

    expect(client).toBeDefined();
    expect(client.businessName).toBe('Test Business');
  });
});
```

#### Integration Test Example
```typescript
// apps/web/src/app/api/__tests__/clients.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../clients/route';

describe('/api/clients', () => {
  it('should return clients for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data)).toBe(true);
  });
});
```

#### E2E Test Example
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=login-button]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid=user-menu]')).toBeVisible();
});
```

---

## Database Management

### Prisma Workflow

#### Schema Changes
```bash
# 1. Edit schema.prisma file
nano packages/database/prisma/schema.prisma

# 2. Generate migration
npx prisma migrate dev --name add-new-field

# 3. Generate client
npx prisma generate

# 4. Apply to production (when ready)
npx prisma migrate deploy
```

#### Database Operations
```bash
# Reset database (development only)
npx prisma migrate reset

# Seed database
npx prisma db seed

# View database
npx prisma studio

# Format schema file
npx prisma format
```

### Database Seeding

```typescript
// packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Test CPA Firm',
      subdomain: 'test-firm',
      subscriptionTier: 'professional'
    }
  });

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@test-firm.com',
      name: 'Test Admin',
      password: hashedPassword,
      role: 'owner',
      organizationId: organization.id
    }
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Environment Configuration

### Development Environments

#### Local Development
```bash
# .env.local for local development
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/cpa_platform_dev
NEXTAUTH_URL=http://localhost:3000
```

#### Testing Environment
```bash
# .env.test for testing
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/cpa_platform_test
NEXTAUTH_URL=http://localhost:3000
```

#### Staging Environment
```bash
# .env.staging for staging
NODE_ENV=production
DATABASE_URL=postgresql://staging-db:5432/cpa_platform
NEXTAUTH_URL=https://staging.cpaplatform.com
```

### Environment Variable Management

```typescript
// apps/web/src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  AZURE_STORAGE_CONNECTION_STRING: z.string(),
  QUICKBOOKS_CLIENT_ID: z.string(),
  QUICKBOOKS_CLIENT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
```

---

## Debugging

### VS Code Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/web"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "ready - started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### Common Debugging Techniques

#### Server-Side Debugging
```typescript
// Add console.log for basic debugging
console.log('Debug info:', { variable, data });

// Use debugger statement
debugger;

// Use VS Code breakpoints
// Click in the gutter next to line numbers
```

#### Client-Side Debugging
```typescript
// Browser console debugging
console.log('Client data:', data);

// React Developer Tools
// Install browser extension for component inspection

// Network tab
// Monitor API calls and responses
```

#### Database Debugging
```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Use Prisma Studio for data inspection
// npx prisma studio
```

---

## Performance Optimization

### Development Performance

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for large dependencies
npx bundlesize

# Profile build performance
npm run build -- --profile
```

#### Development Server Optimization
```bash
# Enable SWC for faster compilation
# (already configured in next.config.js)

# Use incremental compilation
npm run dev -- --turbo

# Monitor memory usage
node --max-old-space-size=4096 node_modules/.bin/next dev
```

### Code Optimization

#### Lazy Loading
```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(
  () => import('../components/HeavyComponent'),
  { loading: () => <p>Loading...</p> }
);
```

#### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // for above-the-fold images
/>
```

#### Database Optimization
```typescript
// Use database indexes (already configured in schema.prisma)
// Implement database query optimization
const optimizedQuery = await prisma.client.findMany({
  select: {
    id: true,
    businessName: true,
    // Only select needed fields
  },
  where: {
    status: 'active',
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10, // Limit results
});
```

---

## Deployment

### Build Process

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Build specific package
npm run build --workspace=@cpa-platform/web
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://prod-db:5432/cpa_platform
NEXTAUTH_URL=https://your-domain.com
AZURE_STORAGE_CONNECTION_STRING=production-connection-string
```

### Database Migration

```bash
# Apply migrations to production
npx prisma migrate deploy

# Generate production client
npx prisma generate
```

### Health Checks

```typescript
// apps/web/src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

---

## Contributing

### Code Style

Follow the guidelines in `STYLE_GUIDE.md`:
- Use TypeScript for all new code
- Follow Prettier formatting
- Use ESLint for code quality
- Write tests for new features
- Update documentation

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request
6. Address review feedback

### Git Workflow

```bash
# Keep main branch clean
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/new-feature

# Make commits with conventional format
git commit -m "feat: add new client search functionality"

# Push and create PR
git push origin feature/new-feature
```

---

## Common Issues

### Port Already in Use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset database connection
npx prisma migrate reset
npx prisma generate
```

### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tremor Documentation](https://www.tremor.so/docs)

*For questions or issues not covered in this guide, please check the existing GitHub issues or create a new one.*