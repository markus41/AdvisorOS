---
layout: default
title: Deployment Blueprint
nav_order: 35
---

# Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Infrastructure Deployment](#infrastructure-deployment)
5. [Application Deployment](#application-deployment)
6. [Database Setup](#database-setup)
7. [Configuration Management](#configuration-management)
8. [Monitoring Setup](#monitoring-setup)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Production Deployment](#production-deployment)
11. [Rollback Procedures](#rollback-procedures)
12. [Maintenance and Updates](#maintenance-and-updates)

---

## Overview

This guide provides comprehensive instructions for deploying the CPA Platform to Azure cloud infrastructure. The deployment process is automated using Infrastructure as Code (Terraform) and CI/CD pipelines (GitHub Actions).

### Deployment Architecture

```mermaid
graph TB
    subgraph "Source Control"
        GITHUB[GitHub Repository]
        ACTIONS[GitHub Actions]
    end

    subgraph "Build & Test"
        BUILD[Build Process]
        TEST[Test Suite]
        SECURITY[Security Scan]
        PACKAGE[Package Application]
    end

    subgraph "Infrastructure"
        TERRAFORM[Terraform]
        AZURE[Azure Resources]
    end

    subgraph "Deployment Targets"
        DEV[Development]
        STAGING[Staging]
        PROD[Production]
    end

    GITHUB --> ACTIONS
    ACTIONS --> BUILD
    BUILD --> TEST
    TEST --> SECURITY
    SECURITY --> PACKAGE
    PACKAGE --> TERRAFORM
    TERRAFORM --> AZURE
    AZURE --> DEV
    AZURE --> STAGING
    AZURE --> PROD
```

### Deployment Environments

| Environment | Purpose | Infrastructure | Deployment Method |
|-------------|---------|----------------|-------------------|
| Development | Local development | Local/Docker | Manual/npm scripts |
| Testing | CI/CD testing | Azure Basic tier | Automated on PR |
| Staging | Pre-production testing | Azure Standard tier | Automated on merge |
| Production | Live environment | Azure Premium tier | Manual approval |

---

## Prerequisites

### Required Tools

```bash
# Install required CLI tools
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker (optional for local development)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Azure Prerequisites

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Create service principal for Terraform
az ad sp create-for-rbac --name "terraform-sp" --role="Contributor" --scopes="/subscriptions/your-subscription-id"

# Note the output values for later configuration:
# {
#   "appId": "your-app-id",
#   "password": "your-password",
#   "tenant": "your-tenant-id"
# }
```

### Environment Variables

```bash
# Create .env file for local development
cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cpa_platform"

# Authentication
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Azure
AZURE_CLIENT_ID="your-azure-client-id"
AZURE_CLIENT_SECRET="your-azure-client-secret"
AZURE_TENANT_ID="your-azure-tenant-id"
AZURE_SUBSCRIPTION_ID="your-azure-subscription-id"

# Storage
AZURE_STORAGE_CONNECTION_STRING="your-storage-connection-string"

# External APIs
QUICKBOOKS_CLIENT_ID="your-qb-client-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-client-secret"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
EOF
```

---

## Environment Setup

### Local Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/cpa-platform.git
cd cpa-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
docker run --name postgres-local \
  -e POSTGRES_USER=cpa_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=cpa_platform \
  -p 5432:5432 \
  -d postgres:14

# Run database migrations
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

### Docker Development Environment

```dockerfile
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/cpa_platform
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: cpa_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
```

---

## Infrastructure Deployment

### Terraform Configuration

```hcl
# infrastructure/azure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "terraformstate12345"
    container_name      = "tfstate"
    key                = "cpa-platform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "cpa-platform"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-${var.environment}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  os_type            = "Linux"
  sku_name           = var.environment == "production" ? "P2v2" : "S1"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Web App
resource "azurerm_linux_web_app" "main" {
  name                = "${var.project_name}-${var.environment}-app"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_service_plan.main.location
  service_plan_id    = azurerm_service_plan.main.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }

    health_check_path = "/api/health"

    app_command_line = "npm start"
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "ENVIRONMENT"                        = var.environment
    "DATABASE_URL"                       = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=DATABASE-URL)"
    "NEXTAUTH_SECRET"                    = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=NEXTAUTH-SECRET)"
    "AZURE_STORAGE_CONNECTION_STRING"    = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=STORAGE-CONNECTION-STRING)"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# PostgreSQL Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.project_name}-${var.environment}-db"
  resource_group_name    = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  version               = "14"
  delegated_subnet_id   = azurerm_subnet.database.id
  private_dns_zone_id   = azurerm_private_dns_zone.database.id
  administrator_login    = "cpa_admin"
  administrator_password = random_password.database_password.result
  zone                  = "1"

  storage_mb = var.environment == "production" ? 32768 : 4096
  sku_name   = var.environment == "production" ? "GP_Standard_D2s_v3" : "B_Standard_B1ms"

  backup_retention_days        = var.environment == "production" ? 35 : 7
  geo_redundant_backup_enabled = var.environment == "production" ? true : false

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [azurerm_private_dns_zone_virtual_network_link.database]
}

# Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "cpa_platform"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "${replace(var.project_name, "-", "")}${var.environment}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = var.environment == "production" ? "GRS" : "LRS"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "POST", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Storage Containers
resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "thumbnails" {
  name                  = "thumbnails"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-${var.environment}-redis"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity           = var.environment == "production" ? 1 : 0
  family             = var.environment == "production" ? "C" : "C"
  sku_name           = var.environment == "production" ? "Standard" : "Basic"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    enable_authentication = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                        = "${var.project_name}-${var.environment}-kv"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  enabled_for_disk_encryption = true
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled   = var.environment == "production" ? true : false
  sku_name                   = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get",
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]

    storage_permissions = [
      "Get",
    ]
  }

  access_policy {
    tenant_id = azurerm_linux_web_app.main.identity[0].tenant_id
    object_id = azurerm_linux_web_app.main.identity[0].principal_id

    secret_permissions = [
      "Get", "List"
    ]
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Secrets
resource "azurerm_key_vault_secret" "database_url" {
  name         = "DATABASE-URL"
  value        = "postgresql://${azurerm_postgresql_flexible_server.main.administrator_login}:${random_password.database_password.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "STORAGE-CONNECTION-STRING"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "random_password" "database_password" {
  length  = 32
  special = true
}

resource "azurerm_key_vault_secret" "nextauth_secret" {
  name         = "NEXTAUTH-SECRET"
  value        = random_password.nextauth_secret.result
  key_vault_id = azurerm_key_vault.main.id
}

resource "random_password" "nextauth_secret" {
  length  = 32
  special = false
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-insights"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type   = "Node.JS"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Outputs
output "app_service_url" {
  value = "https://${azurerm_linux_web_app.main.default_hostname}"
}

output "database_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}
```

### Infrastructure Deployment Commands

```bash
# Initialize Terraform
cd infrastructure/azure
terraform init

# Create workspace for environment
terraform workspace new production
terraform workspace select production

# Plan deployment
terraform plan -var="environment=production" -out=tfplan

# Apply infrastructure
terraform apply tfplan

# View outputs
terraform output
```

### Terraform Variables Files

```hcl
# infrastructure/azure/environments/production.tfvars
environment = "production"
location   = "East US"

# Database configuration
database_sku = "GP_Standard_D2s_v3"
database_storage_mb = 32768
backup_retention_days = 35
geo_redundant_backup_enabled = true

# App Service configuration
app_service_sku = "P2v2"
app_service_instances = 2

# Storage configuration
storage_replication_type = "GRS"

# Redis configuration
redis_sku = "Standard"
redis_capacity = 1
```

```hcl
# infrastructure/azure/environments/staging.tfvars
environment = "staging"
location   = "East US"

# Database configuration
database_sku = "B_Standard_B1ms"
database_storage_mb = 4096
backup_retention_days = 7
geo_redundant_backup_enabled = false

# App Service configuration
app_service_sku = "S1"
app_service_instances = 1

# Storage configuration
storage_replication_type = "LRS"

# Redis configuration
redis_sku = "Basic"
redis_capacity = 0
```

---

## Application Deployment

### Production Docker Configuration

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Azure App Service Configuration

```yaml
# .azure/app-service.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  startup_command: "npm start"
  health_check_path: "/api/health"
  always_on: "true"

  # Application settings
  app_settings: |
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
    WEBSITES_PORT=3000
    NODE_ENV=production

    # Database
    DATABASE_URL=@Microsoft.KeyVault(VaultName=cpa-platform-prod-kv;SecretName=DATABASE-URL)

    # Authentication
    NEXTAUTH_SECRET=@Microsoft.KeyVault(VaultName=cpa-platform-prod-kv;SecretName=NEXTAUTH-SECRET)
    NEXTAUTH_URL=https://cpa-platform-production-app.azurewebsites.net

    # Azure Services
    AZURE_STORAGE_CONNECTION_STRING=@Microsoft.KeyVault(VaultName=cpa-platform-prod-kv;SecretName=STORAGE-CONNECTION-STRING)
    APPLICATIONINSIGHTS_CONNECTION_STRING=@Microsoft.KeyVault(VaultName=cpa-platform-prod-kv;SecretName=INSIGHTS-CONNECTION-STRING)

    # External APIs
    QUICKBOOKS_CLIENT_ID=@Microsoft.KeyVault(VaultName=cpa-platform-prod-kv;SecretName=QUICKBOOKS-CLIENT-ID)
    QUICKBOOKS_CLIENT_SECRET=@Microsoft.KeyVault(VaultName=cpa-platform-prod-kv;SecretName=QUICKBOOKS-CLIENT-SECRET)
    STRIPE_SECRET_KEY=@Microsoft.KeyVault(VaultName=cpa-platform-prod-kv;SecretName=STRIPE-SECRET-KEY)
```

### Manual Deployment Steps

```bash
# Build and deploy to Azure App Service
npm run build

# Create deployment package
zip -r deployment.zip .next public package.json package-lock.json

# Deploy using Azure CLI
az webapp deployment source config-zip \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-app \
  --src deployment.zip

# Restart the application
az webapp restart \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-app

# Check deployment status
az webapp show \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-app \
  --query "state"
```

---

## Database Setup

### Database Deployment Script

```bash
#!/bin/bash
# scripts/deploy-database.sh

set -e

ENVIRONMENT=${1:-staging}
RESOURCE_GROUP="cpa-platform-${ENVIRONMENT}-rg"
SERVER_NAME="cpa-platform-${ENVIRONMENT}-db"

echo "Deploying database for environment: $ENVIRONMENT"

# Get database connection details
DB_HOST=$(az postgres flexible-server show \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --query "fullyQualifiedDomainName" \
  --output tsv)

DB_PASSWORD=$(az keyvault secret show \
  --vault-name "cpa-platform-${ENVIRONMENT}-kv" \
  --name "DATABASE-PASSWORD" \
  --query "value" \
  --output tsv)

export DATABASE_URL="postgresql://cpa_admin:${DB_PASSWORD}@${DB_HOST}:5432/cpa_platform"

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
if [ "$ENVIRONMENT" != "production" ]; then
  npx prisma db seed
fi

echo "Database deployment completed successfully!"
```

### Migration Strategy

```typescript
// prisma/migrations/deploy-migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deployMigration() {
  try {
    console.log('Starting database migration...');

    // Check current migration status
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 5
    `;

    console.log('Recent migrations:', migrations);

    // Deploy pending migrations
    console.log('Deploying migrations...');
    // This is handled by `prisma migrate deploy`

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployMigration();
```

### Backup and Restore Procedures

```bash
#!/bin/bash
# scripts/backup-database.sh

ENVIRONMENT=${1:-production}
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
RESOURCE_GROUP="cpa-platform-${ENVIRONMENT}-rg"
SERVER_NAME="cpa-platform-${ENVIRONMENT}-db"

echo "Creating database backup: $BACKUP_NAME"

# Create backup using Azure CLI
az postgres flexible-server backup create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --backup-name $BACKUP_NAME

echo "Backup created successfully: $BACKUP_NAME"
```

```bash
#!/bin/bash
# scripts/restore-database.sh

ENVIRONMENT=${1:-staging}
BACKUP_NAME=${2}
SOURCE_SERVER=${3:-"cpa-platform-production-db"}
TARGET_SERVER="cpa-platform-${ENVIRONMENT}-db"

if [ -z "$BACKUP_NAME" ]; then
  echo "Usage: $0 <environment> <backup_name> [source_server]"
  exit 1
fi

echo "Restoring database from backup: $BACKUP_NAME"

# Restore from backup
az postgres flexible-server restore \
  --resource-group "cpa-platform-${ENVIRONMENT}-rg" \
  --name $TARGET_SERVER \
  --source-server $SOURCE_SERVER \
  --restore-point-in-time $BACKUP_NAME

echo "Database restored successfully!"
```

---

## Configuration Management

### Environment-Specific Configuration

```typescript
// lib/config.ts
interface EnvironmentConfig {
  environment: string;
  database: {
    url: string;
    poolSize: number;
    connectionTimeout: number;
  };
  cache: {
    url: string;
    ttl: number;
  };
  storage: {
    connectionString: string;
    containerName: string;
  };
  features: {
    enableNewUI: boolean;
    enableAdvancedReporting: boolean;
    enableBetaFeatures: boolean;
  };
  monitoring: {
    logLevel: string;
    enableTracing: boolean;
    sampleRate: number;
  };
}

const configs: Record<string, EnvironmentConfig> = {
  development: {
    environment: 'development',
    database: {
      url: process.env.DATABASE_URL!,
      poolSize: 5,
      connectionTimeout: 30000
    },
    cache: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: 300
    },
    storage: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
      containerName: 'documents-dev'
    },
    features: {
      enableNewUI: true,
      enableAdvancedReporting: false,
      enableBetaFeatures: true
    },
    monitoring: {
      logLevel: 'debug',
      enableTracing: true,
      sampleRate: 1.0
    }
  },

  production: {
    environment: 'production',
    database: {
      url: process.env.DATABASE_URL!,
      poolSize: 20,
      connectionTimeout: 60000
    },
    cache: {
      url: process.env.REDIS_URL!,
      ttl: 3600
    },
    storage: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
      containerName: 'documents'
    },
    features: {
      enableNewUI: true,
      enableAdvancedReporting: true,
      enableBetaFeatures: false
    },
    monitoring: {
      logLevel: 'info',
      enableTracing: true,
      sampleRate: 0.1
    }
  }
};

export const config = configs[process.env.NODE_ENV || 'development'];
```

### Feature Flags

```typescript
// lib/feature-flags.ts
import { config } from './config';

interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: {
    organizationIds?: string[];
    userRoles?: string[];
  };
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.initializeFlags();
  }

  private initializeFlags() {
    const flags: FeatureFlag[] = [
      {
        name: 'new-ui',
        enabled: config.features.enableNewUI,
        rolloutPercentage: 100
      },
      {
        name: 'advanced-reporting',
        enabled: config.features.enableAdvancedReporting,
        rolloutPercentage: 100
      },
      {
        name: 'beta-features',
        enabled: config.features.enableBetaFeatures,
        rolloutPercentage: 50,
        conditions: {
          userRoles: ['owner', 'admin']
        }
      }
    ];

    flags.forEach(flag => this.flags.set(flag.name, flag));
  }

  isEnabled(flagName: string, context?: {
    organizationId?: string;
    userId?: string;
    userRole?: string;
  }): boolean {
    const flag = this.flags.get(flagName);
    if (!flag || !flag.enabled) return false;

    // Check conditions
    if (flag.conditions) {
      if (flag.conditions.userRoles && context?.userRole) {
        if (!flag.conditions.userRoles.includes(context.userRole)) {
          return false;
        }
      }

      if (flag.conditions.organizationIds && context?.organizationId) {
        if (!flag.conditions.organizationIds.includes(context.organizationId)) {
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
      const hash = this.hash(context?.userId || '');
      return (hash % 100) < flag.rolloutPercentage;
    }

    return true;
  }

  private hash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlagService();
```

---

## Monitoring Setup

### Application Insights Configuration

```typescript
// lib/monitoring.ts
import { ApplicationInsights } from '@azure/monitor-opentelemetry-exporter';
import { NodeSDK } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize Application Insights
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'cpa-platform',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  }),
  traceExporter: new ApplicationInsights({
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  }),
  instrumentations: []
});

if (process.env.NODE_ENV === 'production') {
  sdk.start();
}

// Custom telemetry
class TelemetryService {
  private appInsights: any;

  constructor() {
    if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      this.appInsights = require('applicationinsights');
      this.appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, true)
        .setUseDiskRetryCaching(true)
        .start();
    }
  }

  trackEvent(name: string, properties?: any, metrics?: any) {
    if (this.appInsights) {
      this.appInsights.defaultClient.trackEvent({
        name,
        properties,
        measurements: metrics
      });
    }
  }

  trackException(exception: Error, properties?: any) {
    if (this.appInsights) {
      this.appInsights.defaultClient.trackException({
        exception,
        properties
      });
    }
  }

  trackDependency(name: string, data: string, duration: number, success: boolean) {
    if (this.appInsights) {
      this.appInsights.defaultClient.trackDependency({
        name,
        data,
        duration,
        success
      });
    }
  }
}

export const telemetry = new TelemetryService();
```

### Health Check Endpoints

```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: CheckResult;
    cache: CheckResult;
    storage: CheckResult;
    externalAPIs: CheckResult;
  };
}

interface CheckResult {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  message?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parallel health checks
    const [dbCheck, cacheCheck, storageCheck, apiCheck] = await Promise.allSettled([
      checkDatabase(),
      checkCache(),
      checkStorage(),
      checkExternalAPIs()
    ]);

    const healthCheck: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'unhealthy', responseTime: 0, message: dbCheck.reason?.message },
        cache: cacheCheck.status === 'fulfilled' ? cacheCheck.value : { status: 'unhealthy', responseTime: 0, message: cacheCheck.reason?.message },
        storage: storageCheck.status === 'fulfilled' ? storageCheck.value : { status: 'unhealthy', responseTime: 0, message: storageCheck.reason?.message },
        externalAPIs: apiCheck.status === 'fulfilled' ? apiCheck.value : { status: 'unhealthy', responseTime: 0, message: apiCheck.reason?.message }
      }
    };

    // Determine overall health
    const hasUnhealthyCheck = Object.values(healthCheck.checks).some(check => check.status === 'unhealthy');
    if (hasUnhealthyCheck) {
      healthCheck.status = 'unhealthy';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database check failed'
    };
  }
}

async function checkCache(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Cache check failed'
    };
  }
}

async function checkStorage(): Promise<CheckResult> {
  const start = Date.now();
  try {
    // Simple storage connectivity check
    // Implementation depends on your storage service
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Storage check failed'
    };
  }
}

async function checkExternalAPIs(): Promise<CheckResult> {
  const start = Date.now();
  try {
    // Check external API connectivity
    // This is a simplified check - implement based on your needs
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'External API check failed'
    };
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy CPA Platform

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AZURE_WEBAPP_NAME: cpa-platform-production-app
  AZURE_WEBAPP_PACKAGE_PATH: '.'
  NODE_VERSION: '18.x'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cpa_platform_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Set up test database
      run: |
        npm run db:push
        npm run db:seed
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cpa_platform_test

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cpa_platform_test
        REDIS_URL: redis://localhost:6379

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cpa_platform_test
        REDIS_URL: redis://localhost:6379

    - name: Build application
      run: npm run build
      env:
        SKIP_ENV_VALIDATION: true

  security:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v3

    - name: Run security audit
      run: npm audit --audit-level high

    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/develop'

    environment:
      name: staging
      url: https://cpa-platform-staging-app.azurewebsites.net

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build
      env:
        SKIP_ENV_VALIDATION: true

    - name: Deploy to Azure Web App (Staging)
      uses: azure/webapps-deploy@v2
      with:
        app-name: cpa-platform-staging-app
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
        package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}

    - name: Run smoke tests
      run: npm run test:smoke
      env:
        BASE_URL: https://cpa-platform-staging-app.azurewebsites.net

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'

    environment:
      name: production
      url: https://cpa-platform-production-app.azurewebsites.net

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}

    - name: Build application
      run: npm run build
      env:
        SKIP_ENV_VALIDATION: true

    - name: Deploy to Azure Web App (Production)
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION }}
        package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}

    - name: Warm up application
      run: |
        sleep 30
        curl -f https://cpa-platform-production-app.azurewebsites.net/api/health

    - name: Run post-deployment tests
      run: npm run test:e2e:production
      env:
        BASE_URL: https://cpa-platform-production-app.azurewebsites.net
```

### Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
FORCE_DEPLOY=${2:-false}

echo "Starting deployment to $ENVIRONMENT environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
  echo "Error: Invalid environment. Use 'staging' or 'production'"
  exit 1
fi

# Check if production deployment requires confirmation
if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE_DEPLOY" != "true" ]; then
  echo "Production deployment requires confirmation."
  read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Build and test
echo "Building application..."
npm run build

echo "Running tests..."
npm run test

echo "Running security checks..."
npm audit --audit-level high

# Deploy infrastructure
echo "Deploying infrastructure..."
cd infrastructure/azure
terraform workspace select $ENVIRONMENT
terraform plan -var="environment=$ENVIRONMENT" -out=tfplan
terraform apply tfplan
cd ../..

# Deploy application
echo "Deploying application..."
az webapp deployment source config-zip \
  --resource-group "cpa-platform-$ENVIRONMENT-rg" \
  --name "cpa-platform-$ENVIRONMENT-app" \
  --src deployment.zip

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Health check
echo "Performing health check..."
sleep 30
HEALTH_URL="https://cpa-platform-$ENVIRONMENT-app.azurewebsites.net/api/health"
curl -f $HEALTH_URL || {
  echo "Health check failed! Rolling back..."
  # Implement rollback logic here
  exit 1
}

echo "Deployment to $ENVIRONMENT completed successfully!"
```

---

## Production Deployment

### Pre-Deployment Checklist

```markdown
# Production Deployment Checklist

## Pre-Deployment
- [ ] Code review completed and approved
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed with no high-severity issues
- [ ] Performance testing completed
- [ ] Database migrations tested in staging
- [ ] Backup procedures verified
- [ ] Rollback plan prepared
- [ ] Team notifications sent
- [ ] Maintenance window scheduled (if required)

## Infrastructure
- [ ] Terraform plan reviewed and approved
- [ ] Azure resources provisioned correctly
- [ ] SSL certificates valid and renewed
- [ ] DNS configuration updated
- [ ] CDN configuration verified
- [ ] Monitoring and alerting configured

## Security
- [ ] Environment variables secured in Key Vault
- [ ] Access policies configured correctly
- [ ] Network security groups updated
- [ ] WAF rules configured
- [ ] Audit logging enabled

## Application
- [ ] Application builds successfully
- [ ] Environment-specific configuration verified
- [ ] Feature flags configured appropriately
- [ ] Third-party integrations tested
- [ ] Performance metrics baseline established

## Post-Deployment
- [ ] Health checks passing
- [ ] Application functionality verified
- [ ] Monitoring dashboards checked
- [ ] Error rates within acceptable limits
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Team notified of successful deployment
```

### Production Deployment Process

```bash
#!/bin/bash
# scripts/production-deploy.sh

set -e

echo "=== CPA Platform Production Deployment ==="
echo "Timestamp: $(date)"

# Pre-deployment checks
echo "Step 1: Pre-deployment verification"
npm run build
npm run test
npm run test:e2e
npm audit --audit-level high

# Create deployment backup
echo "Step 2: Creating pre-deployment backup"
BACKUP_NAME="pre-deploy-$(date +%Y%m%d-%H%M%S)"
az postgres flexible-server backup create \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-db \
  --backup-name $BACKUP_NAME

# Deploy infrastructure changes
echo "Step 3: Deploying infrastructure updates"
cd infrastructure/azure
terraform workspace select production
terraform plan -var="environment=production" -out=tfplan
terraform apply tfplan
cd ../..

# Deploy application using blue-green strategy
echo "Step 4: Deploying application (blue-green)"

# Deploy to staging slot
az webapp deployment slot create \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-app \
  --slot staging

az webapp deployment source config-zip \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-app \
  --slot staging \
  --src deployment.zip

# Run database migrations on staging slot
echo "Step 5: Running database migrations"
export DATABASE_URL=$(az keyvault secret show \
  --vault-name cpa-platform-production-kv \
  --name DATABASE-URL \
  --query value -o tsv)

npx prisma migrate deploy

# Warm up staging slot
echo "Step 6: Warming up staging environment"
sleep 60
curl -f https://cpa-platform-production-app-staging.azurewebsites.net/api/health

# Run smoke tests
echo "Step 7: Running smoke tests"
npm run test:smoke -- --base-url https://cpa-platform-production-app-staging.azurewebsites.net

# Swap slots (blue-green deployment)
echo "Step 8: Swapping deployment slots"
az webapp deployment slot swap \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-app \
  --slot staging \
  --target-slot production

# Post-deployment verification
echo "Step 9: Post-deployment verification"
sleep 30
curl -f https://cpa-platform-production-app.azurewebsites.net/api/health

# Run full health check
HEALTH_RESPONSE=$(curl -s https://cpa-platform-production-app.azurewebsites.net/api/health)
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status')

if [ "$HEALTH_STATUS" != "healthy" ]; then
  echo "Health check failed! Rolling back..."
  az webapp deployment slot swap \
    --resource-group cpa-platform-production-rg \
    --name cpa-platform-production-app \
    --slot production \
    --target-slot staging
  exit 1
fi

echo "Step 10: Cleaning up staging slot"
az webapp deployment slot delete \
  --resource-group cpa-platform-production-rg \
  --name cpa-platform-production-app \
  --slot staging

echo "=== Production Deployment Completed Successfully ==="
echo "Deployment time: $(date)"
echo "Backup created: $BACKUP_NAME"
echo "Application URL: https://cpa-platform-production-app.azurewebsites.net"
```

---

## Rollback Procedures

### Automatic Rollback Triggers

```typescript
// scripts/monitor-deployment.ts
import { ApplicationInsights } from '@azure/monitor-opentelemetry-exporter';

interface DeploymentMetrics {
  errorRate: number;
  responseTime: number;
  throughput: number;
  healthCheckStatus: boolean;
}

class DeploymentMonitor {
  private readonly thresholds = {
    maxErrorRate: 5, // 5%
    maxResponseTime: 2000, // 2 seconds
    minThroughput: 100, // requests per minute
    healthCheckRetries: 3
  };

  async monitorDeployment(deploymentId: string, durationMinutes: number = 30): Promise<boolean> {
    console.log(`Monitoring deployment ${deploymentId} for ${durationMinutes} minutes...`);

    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    let consecutiveFailures = 0;

    while (Date.now() < endTime) {
      try {
        const metrics = await this.getDeploymentMetrics();
        const isHealthy = this.evaluateMetrics(metrics);

        if (!isHealthy) {
          consecutiveFailures++;
          console.warn(`Health check failed (${consecutiveFailures}/${this.thresholds.healthCheckRetries})`);

          if (consecutiveFailures >= this.thresholds.healthCheckRetries) {
            console.error('Deployment failed health checks. Triggering rollback...');
            await this.triggerRollback(deploymentId);
            return false;
          }
        } else {
          consecutiveFailures = 0;
          console.log('Health checks passing...');
        }

        // Wait 1 minute before next check
        await new Promise(resolve => setTimeout(resolve, 60000));

      } catch (error) {
        console.error('Error monitoring deployment:', error);
        consecutiveFailures++;

        if (consecutiveFailures >= this.thresholds.healthCheckRetries) {
          await this.triggerRollback(deploymentId);
          return false;
        }
      }
    }

    console.log('Deployment monitoring completed successfully');
    return true;
  }

  private async getDeploymentMetrics(): Promise<DeploymentMetrics> {
    // Fetch metrics from Application Insights
    const healthResponse = await fetch('https://cpa-platform-production-app.azurewebsites.net/api/health');
    const healthData = await healthResponse.json();

    return {
      errorRate: await this.getErrorRate(),
      responseTime: await this.getAverageResponseTime(),
      throughput: await this.getThroughput(),
      healthCheckStatus: healthData.status === 'healthy'
    };
  }

  private evaluateMetrics(metrics: DeploymentMetrics): boolean {
    if (!metrics.healthCheckStatus) return false;
    if (metrics.errorRate > this.thresholds.maxErrorRate) return false;
    if (metrics.responseTime > this.thresholds.maxResponseTime) return false;
    if (metrics.throughput < this.thresholds.minThroughput) return false;

    return true;
  }

  private async triggerRollback(deploymentId: string): Promise<void> {
    console.log(`Triggering rollback for deployment ${deploymentId}`);

    // Execute rollback script
    const { exec } = require('child_process');
    exec('./scripts/rollback.sh', (error, stdout, stderr) => {
      if (error) {
        console.error('Rollback failed:', error);
        return;
      }
      console.log('Rollback completed:', stdout);
    });
  }

  private async getErrorRate(): Promise<number> {
    // Implementation to fetch error rate from monitoring
    return 0;
  }

  private async getAverageResponseTime(): Promise<number> {
    // Implementation to fetch response time from monitoring
    return 500;
  }

  private async getThroughput(): Promise<number> {
    // Implementation to fetch throughput from monitoring
    return 200;
  }
}

const monitor = new DeploymentMonitor();
monitor.monitorDeployment(process.argv[2]);
```

### Manual Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=${1:-production}
ROLLBACK_TARGET=${2} # backup name, previous version, or specific slot

echo "=== EMERGENCY ROLLBACK PROCEDURE ==="
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date)"

# Verify rollback target
if [ -z "$ROLLBACK_TARGET" ]; then
  echo "Finding latest backup..."
  ROLLBACK_TARGET=$(az postgres flexible-server backup list \
    --resource-group "cpa-platform-$ENVIRONMENT-rg" \
    --name "cpa-platform-$ENVIRONMENT-db" \
    --query "[0].name" \
    --output tsv)
  echo "Using backup: $ROLLBACK_TARGET"
fi

# Confirm rollback in production
if [ "$ENVIRONMENT" = "production" ]; then
  echo "WARNING: This will rollback the production environment!"
  read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled."
    exit 1
  fi
fi

# Step 1: Stop application traffic (optional - depends on your setup)
echo "Step 1: Preparing for rollback..."

# Step 2: Rollback application code
echo "Step 2: Rolling back application code..."

# Check if there's a staging slot to swap back
STAGING_EXISTS=$(az webapp deployment slot list \
  --resource-group "cpa-platform-$ENVIRONMENT-rg" \
  --name "cpa-platform-$ENVIRONMENT-app" \
  --query "length([?name=='staging'])" \
  --output tsv)

if [ "$STAGING_EXISTS" -gt 0 ]; then
  echo "Swapping back to staging slot..."
  az webapp deployment slot swap \
    --resource-group "cpa-platform-$ENVIRONMENT-rg" \
    --name "cpa-platform-$ENVIRONMENT-app" \
    --slot staging \
    --target-slot production
else
  echo "No staging slot available. Deploying previous version..."
  # Here you would deploy the previous version
  # This depends on how you store previous deployments
fi

# Step 3: Rollback database (if needed)
echo "Step 3: Checking if database rollback is needed..."
read -p "Do you need to rollback the database? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Rolling back database to: $ROLLBACK_TARGET"

  # Create temporary server for restore
  TEMP_SERVER="cpa-platform-$ENVIRONMENT-temp-$(date +%s)"

  az postgres flexible-server restore \
    --resource-group "cpa-platform-$ENVIRONMENT-rg" \
    --name $TEMP_SERVER \
    --source-server "cpa-platform-$ENVIRONMENT-db" \
    --restore-point-in-time $ROLLBACK_TARGET

  echo "Database restored to temporary server: $TEMP_SERVER"
  echo "Please coordinate with DBA to complete database rollback"
fi

# Step 4: Verify rollback
echo "Step 4: Verifying rollback..."
sleep 30

HEALTH_URL="https://cpa-platform-$ENVIRONMENT-app.azurewebsites.net/api/health"
curl -f $HEALTH_URL || {
  echo "WARNING: Health check failed after rollback!"
  exit 1
}

# Step 5: Notify team
echo "Step 5: Sending notifications..."
# Add notification logic here (Slack, email, etc.)

echo "=== ROLLBACK COMPLETED ==="
echo "Application should be restored to previous working state"
echo "Please verify functionality and notify stakeholders"

# Log rollback event
echo "$(date): Rollback completed for environment $ENVIRONMENT" >> rollback.log
```

---

## Maintenance and Updates

### Scheduled Maintenance

```yaml
# .github/workflows/maintenance.yml
name: Scheduled Maintenance

on:
  schedule:
    # Run every Sunday at 2 AM UTC
    - cron: '0 2 * * 0'
  workflow_dispatch:

jobs:
  maintenance:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Security Updates
      run: |
        npm audit fix
        npm update

    - name: Database Maintenance
      run: |
        # Vacuum and analyze database
        ./scripts/database-maintenance.sh

    - name: Log Cleanup
      run: |
        # Clean up old logs and data
        ./scripts/cleanup.sh

    - name: Performance Check
      run: |
        # Run performance tests
        npm run test:performance

    - name: Backup Verification
      run: |
        # Verify backup integrity
        ./scripts/verify-backups.sh
```

### Update Procedures

```bash
#!/bin/bash
# scripts/update-production.sh

set -e

UPDATE_TYPE=${1:-patch} # patch, minor, major
SKIP_BACKUP=${2:-false}

echo "=== CPA Platform Update Procedure ==="
echo "Update Type: $UPDATE_TYPE"
echo "Timestamp: $(date)"

# Pre-update backup
if [ "$SKIP_BACKUP" != "true" ]; then
  echo "Step 1: Creating pre-update backup..."
  BACKUP_NAME="pre-update-$(date +%Y%m%d-%H%M%S)"
  az postgres flexible-server backup create \
    --resource-group cpa-platform-production-rg \
    --name cpa-platform-production-db \
    --backup-name $BACKUP_NAME
  echo "Backup created: $BACKUP_NAME"
fi

# Update dependencies
echo "Step 2: Updating dependencies..."
case $UPDATE_TYPE in
  "patch")
    npm update --save
    ;;
  "minor")
    npm update --save
    npx npm-check-updates -u -t minor
    npm install
    ;;
  "major")
    echo "Major updates require manual review"
    npx npm-check-updates -u
    echo "Please review package.json changes before continuing"
    read -p "Continue with installation? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      npm install
    else
      echo "Update cancelled"
      exit 1
    fi
    ;;
esac

# Run tests
echo "Step 3: Running test suite..."
npm run build
npm run test
npm run test:integration

# Security audit
echo "Step 4: Security audit..."
npm audit --audit-level moderate

# Deploy to staging first
echo "Step 5: Deploying to staging for verification..."
./scripts/deploy.sh staging true

# Staging verification
echo "Step 6: Verifying staging deployment..."
sleep 60
curl -f https://cpa-platform-staging-app.azurewebsites.net/api/health
npm run test:e2e -- --base-url https://cpa-platform-staging-app.azurewebsites.net

# Production deployment
echo "Step 7: Deploying to production..."
read -p "Staging verification passed. Deploy to production? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  ./scripts/deploy.sh production true
else
  echo "Production deployment cancelled"
  exit 1
fi

echo "=== Update Completed Successfully ==="
echo "Don't forget to:"
echo "1. Update documentation if needed"
echo "2. Notify team of changes"
echo "3. Monitor application performance"
```

### Monitoring and Alerting Setup

```bash
#!/bin/bash
# scripts/setup-monitoring.sh

ENVIRONMENT=${1:-production}
RESOURCE_GROUP="cpa-platform-$ENVIRONMENT-rg"
APP_NAME="cpa-platform-$ENVIRONMENT-app"

echo "Setting up monitoring and alerting for $ENVIRONMENT..."

# Create action group for notifications
az monitor action-group create \
  --resource-group $RESOURCE_GROUP \
  --name "cpa-platform-alerts" \
  --short-name "CPAAlerts" \
  --email "DevOps Team" devops@yourcompany.com \
  --webhook "Slack" https://hooks.slack.com/your-webhook-url

# High error rate alert
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "High Error Rate" \
  --description "Alert when error rate exceeds 5%" \
  --severity 2 \
  --condition "avg Http5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "cpa-platform-alerts" \
  --target-resource-id $(az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query id --output tsv)

# High response time alert
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "High Response Time" \
  --description "Alert when response time exceeds 2 seconds" \
  --severity 3 \
  --condition "avg AverageResponseTime > 2000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "cpa-platform-alerts" \
  --target-resource-id $(az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query id --output tsv)

# Database CPU alert
DB_RESOURCE_ID=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name "cpa-platform-$ENVIRONMENT-db" --query id --output tsv)

az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "Database High CPU" \
  --description "Alert when database CPU exceeds 80%" \
  --severity 2 \
  --condition "avg cpu_percent > 80" \
  --window-size 10m \
  --evaluation-frequency 5m \
  --action "cpa-platform-alerts" \
  --target-resource-id $DB_RESOURCE_ID

echo "Monitoring and alerting setup completed!"
```

---

*This deployment guide provides comprehensive instructions for deploying and maintaining the CPA Platform. Always test deployments in staging environments before deploying to production, and maintain proper backup and rollback procedures.*
