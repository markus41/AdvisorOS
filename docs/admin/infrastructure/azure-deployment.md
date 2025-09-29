# Azure Deployment Guide for AdvisorOS

## Overview

This guide provides step-by-step instructions for deploying AdvisorOS to Microsoft Azure. The deployment follows best practices for security, scalability, and compliance with CPA industry requirements.

## Prerequisites

### Azure Subscription Requirements
- **Subscription Type**: Standard or Premium Azure subscription
- **Permissions**: Contributor or Owner role on the subscription
- **Resource Limits**: Ensure sufficient quotas for required resources
- **Compliance**: Subscription must support compliance requirements (SOC 2, GDPR)

### Tools Required
- **Azure CLI**: Version 2.50.0 or later
- **Azure PowerShell**: Version 8.0 or later (optional)
- **Git**: For code deployment
- **Node.js**: Version 18 LTS or later
- **Docker**: For containerized deployments (optional)

### Required Knowledge
- Azure resource management
- Basic networking concepts
- PostgreSQL database administration
- SSL/TLS certificate management

## Architecture Overview

### Core Azure Services Used

```
Production Environment Architecture:

┌─────────────────────────────────────────────────────────────────┐
│                        Azure Subscription                       │
├─────────────────────────────────────────────────────────────────┤
│  Resource Group: rg-advisoros-prod                             │
│                                                                 │
│  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Azure Front   │  │ Azure Static    │  │ Azure           │   │
│  │ Door Premium  │──│ Web Apps        │  │ Functions       │   │
│  │               │  │ (Frontend)      │  │ (Backend API)   │   │
│  └───────────────┘  └─────────────────┘  └─────────────────┘   │
│          │                   │                   │             │
│          │                   │                   │             │
│  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Azure CDN     │  │ Azure Database  │  │ Azure Blob      │   │
│  │               │  │ for PostgreSQL  │  │ Storage         │   │
│  │               │  │                 │  │                 │   │
│  └───────────────┘  └─────────────────┘  └─────────────────┘   │
│                             │                                   │
│          ┌─────────────────────────────────────┐               │
│          │           Security Services          │               │
│          │  ┌─────────────┐  ┌─────────────┐   │               │
│          │  │ Azure Key   │  │ Azure AD    │   │               │
│          │  │ Vault       │  │ B2C         │   │               │
│          │  └─────────────┘  └─────────────┘   │               │
│          └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### Phase 1: Infrastructure Setup

#### 1.1 Create Resource Group

```bash
# Set deployment variables
SUBSCRIPTION_ID="your-subscription-id"
LOCATION="East US 2"
ENVIRONMENT="prod"  # or "staging", "dev"
RESOURCE_GROUP="rg-advisoros-${ENVIRONMENT}"

# Login to Azure
az login

# Set subscription
az account set --subscription $SUBSCRIPTION_ID

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location "$LOCATION" \
  --tags environment=$ENVIRONMENT project=advisoros
```

#### 1.2 Create Virtual Network (Optional but Recommended)

```bash
# Create virtual network for secure communication
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name "vnet-advisoros-${ENVIRONMENT}" \
  --address-prefix 10.0.0.0/16 \
  --subnet-name "subnet-app" \
  --subnet-prefix 10.0.1.0/24

# Create subnet for database
az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name "vnet-advisoros-${ENVIRONMENT}" \
  --name "subnet-db" \
  --address-prefix 10.0.2.0/24 \
  --service-endpoints Microsoft.Storage Microsoft.Sql
```

#### 1.3 Create Azure Key Vault

```bash
# Create Key Vault for secrets management
az keyvault create \
  --name "kv-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Premium \
  --enable-soft-delete true \
  --retention-days 90

# Set access policy (replace with your user principal ID)
az keyvault set-policy \
  --name "kv-advisoros-${ENVIRONMENT}" \
  --object-id $(az ad signed-in-user show --query objectId -o tsv) \
  --secret-permissions get list set delete
```

### Phase 2: Database Deployment

#### 2.1 Create PostgreSQL Server

```bash
# Generate random password
DB_PASSWORD=$(openssl rand -base64 32)

# Create PostgreSQL flexible server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name "psql-advisoros-${ENVIRONMENT}" \
  --location "$LOCATION" \
  --admin-user advisoros_admin \
  --admin-password $DB_PASSWORD \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --storage-size 128 \
  --version 14 \
  --high-availability Enabled \
  --zone 1 \
  --standby-zone 2

# Store password in Key Vault
az keyvault secret set \
  --vault-name "kv-advisoros-${ENVIRONMENT}" \
  --name "database-password" \
  --value $DB_PASSWORD
```

#### 2.2 Configure Database Security

```bash
# Configure firewall rules (restrict to your services)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name "psql-advisoros-${ENVIRONMENT}" \
  --rule-name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Enable SSL enforcement
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name "psql-advisoros-${ENVIRONMENT}" \
  --name require_secure_transport \
  --value on
```

#### 2.3 Create Database and User

```bash
# Connect to database and create application database
DB_HOST="psql-advisoros-${ENVIRONMENT}.postgres.database.azure.com"

# Create application database
psql "host=${DB_HOST} port=5432 dbname=postgres user=advisoros_admin sslmode=require" <<EOF
CREATE DATABASE advisoros;
CREATE USER advisoros_app WITH PASSWORD '$(az keyvault secret show --vault-name "kv-advisoros-${ENVIRONMENT}" --name "database-password" --query value -o tsv)';
GRANT ALL PRIVILEGES ON DATABASE advisoros TO advisoros_app;
\q
EOF
```

### Phase 3: Storage Setup

#### 3.1 Create Storage Account

```bash
# Create storage account
az storage account create \
  --name "stadvisoros${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Standard_GRS \
  --kind StorageV2 \
  --access-tier Hot \
  --https-only true \
  --min-tls-version TLS1_2

# Get storage connection string
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name "stadvisoros${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name "kv-advisoros-${ENVIRONMENT}" \
  --name "storage-connection-string" \
  --value "$STORAGE_CONNECTION_STRING"
```

#### 3.2 Create Blob Containers

```bash
# Create containers for different types of content
az storage container create \
  --name "documents" \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --public-access off

az storage container create \
  --name "images" \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --public-access off

az storage container create \
  --name "backups" \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --public-access off
```

### Phase 4: Authentication Setup

#### 4.1 Create Azure AD B2C Tenant

```bash
# Note: Azure AD B2C tenant creation requires Azure portal
# Follow these steps in the portal:

# 1. Navigate to Azure Portal
# 2. Search for "Azure AD B2C"
# 3. Click "Create"
# 4. Select "Create a new Azure AD B2C Tenant"
# 5. Provide organization name and domain name
# 6. Select country/region
# 7. Complete creation

# After creation, note the tenant domain (e.g., advisorosb2c.onmicrosoft.com)
B2C_TENANT="advisorosb2c.onmicrosoft.com"
```

#### 4.2 Configure B2C Application

```bash
# Create application registration in B2C
# This must be done through Azure Portal:

# 1. Navigate to your B2C tenant
# 2. Go to "App registrations"
# 3. Click "New registration"
# 4. Provide name: "AdvisorOS Web App"
# 5. Set redirect URI: https://your-domain.com/api/auth/callback/azure-ad-b2c
# 6. Note the Application (client) ID
```

### Phase 5: Backend Deployment

#### 5.1 Create Azure Functions App

```bash
# Create Function App for backend API
az functionapp create \
  --name "func-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --storage-account "stadvisoros${ENVIRONMENT}" \
  --consumption-plan-location "$LOCATION" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --https-only true
```

#### 5.2 Configure Function App Settings

```bash
# Set application settings
az functionapp config appsettings set \
  --name "func-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="postgresql://advisoros_app:$(az keyvault secret show --vault-name "kv-advisoros-${ENVIRONMENT}" --name "database-password" --query value -o tsv)@psql-advisoros-${ENVIRONMENT}.postgres.database.azure.com:5432/advisoros?sslmode=require" \
    AZURE_STORAGE_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=https://kv-advisoros-${ENVIRONMENT}.vault.azure.net/secrets/storage-connection-string/)" \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    NEXTAUTH_URL="https://your-domain.com"
```

#### 5.3 Deploy Backend Code

```bash
# Clone the repository
git clone https://github.com/your-org/advisoros.git
cd advisoros

# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Function App
az functionapp deployment source config \
  --name "func-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --repo-url https://github.com/your-org/advisoros.git \
  --branch main \
  --manual-integration
```

### Phase 6: Frontend Deployment

#### 6.1 Create Static Web App

```bash
# Create Static Web App for frontend
az staticwebapp create \
  --name "swa-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --source https://github.com/your-org/advisoros \
  --branch main \
  --app-location "/apps/web" \
  --api-location "/api" \
  --output-location "out"
```

#### 6.2 Configure Custom Domain (Production Only)

```bash
# Add custom domain (requires domain verification)
az staticwebapp hostname set \
  --name "swa-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --hostname "app.yourdomain.com"
```

### Phase 7: CDN and Front Door Setup

#### 7.1 Create Azure Front Door

```bash
# Create Front Door Premium for enhanced security and performance
az afd profile create \
  --profile-name "afd-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --sku Premium_AzureFrontDoor

# Create endpoint
az afd endpoint create \
  --resource-group $RESOURCE_GROUP \
  --profile-name "afd-advisoros-${ENVIRONMENT}" \
  --endpoint-name "advisoros-${ENVIRONMENT}" \
  --enabled-state Enabled
```

#### 7.2 Configure WAF Policy

```bash
# Create WAF policy
az network front-door waf-policy create \
  --resource-group $RESOURCE_GROUP \
  --name "wafAdvisorOS${ENVIRONMENT}" \
  --sku Premium_AzureFrontDoor \
  --mode Prevention

# Enable managed rulesets
az network front-door waf-policy managed-rules add \
  --policy-name "wafAdvisorOS${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --type Microsoft_DefaultRuleSet \
  --version 2.1
```

### Phase 8: Monitoring and Logging

#### 8.1 Create Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app "ai-advisoros-${ENVIRONMENT}" \
  --location "$LOCATION" \
  --resource-group $RESOURCE_GROUP \
  --kind web \
  --retention-time 90

# Get instrumentation key
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app "ai-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name "kv-advisoros-${ENVIRONMENT}" \
  --name "appinsights-instrumentation-key" \
  --value "$APPINSIGHTS_KEY"
```

#### 8.2 Configure Log Analytics

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "law-advisoros-${ENVIRONMENT}" \
  --location "$LOCATION" \
  --retention-time 90

# Link Application Insights to Log Analytics
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "law-advisoros-${ENVIRONMENT}" \
  --query customerId -o tsv)

az monitor app-insights component linked-storage link \
  --app "ai-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --storage-account "stadvisoros${ENVIRONMENT}"
```

### Phase 9: Security Configuration

#### 9.1 Configure Network Security Groups

```bash
# Create NSG for application subnet
az network nsg create \
  --resource-group $RESOURCE_GROUP \
  --name "nsg-app-${ENVIRONMENT}"

# Allow HTTPS traffic
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name "nsg-app-${ENVIRONMENT}" \
  --name "AllowHTTPS" \
  --priority 1000 \
  --access Allow \
  --protocol Tcp \
  --direction Inbound \
  --destination-port-ranges 443

# Associate NSG with subnet
az network vnet subnet update \
  --resource-group $RESOURCE_GROUP \
  --vnet-name "vnet-advisoros-${ENVIRONMENT}" \
  --name "subnet-app" \
  --network-security-group "nsg-app-${ENVIRONMENT}"
```

#### 9.2 Enable Azure Security Center

```bash
# Enable Security Center standard tier
az security pricing create \
  --name VirtualMachines \
  --tier Standard

az security pricing create \
  --name StorageAccounts \
  --tier Standard

az security pricing create \
  --name SqlServers \
  --tier Standard
```

### Phase 10: Backup Configuration

#### 10.1 Configure Database Backups

```bash
# Enable automated backups for PostgreSQL
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name "psql-advisoros-${ENVIRONMENT}" \
  --name backup_retention_days \
  --value 35

# Configure geo-redundant backup
az postgres flexible-server backup retention set \
  --resource-group $RESOURCE_GROUP \
  --server-name "psql-advisoros-${ENVIRONMENT}" \
  --backup-retention 35 \
  --geo-redundant-backup Enabled
```

#### 10.2 Configure Storage Backups

```bash
# Enable soft delete for blob storage
az storage account blob-service-properties update \
  --account-name "stadvisoros${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --enable-delete-retention true \
  --delete-retention-days 30

# Enable versioning
az storage account blob-service-properties update \
  --account-name "stadvisoros${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --enable-versioning true
```

## Post-Deployment Configuration

### 1. SSL Certificate Setup

#### Managed Certificates (Recommended)
```bash
# For Static Web Apps, SSL is automatically managed
# For custom domains, certificates are automatically provisioned

# Verify SSL configuration
curl -I https://your-domain.com
```

#### Custom Certificates
```bash
# If using custom certificates, upload to Key Vault
az keyvault certificate import \
  --vault-name "kv-advisoros-${ENVIRONMENT}" \
  --name "ssl-certificate" \
  --file path/to/certificate.pfx \
  --password certificate-password
```

### 2. DNS Configuration

```bash
# Configure DNS records for your domain
# CNAME record: app.yourdomain.com -> your-static-web-app.azurestaticapps.net
# A record: yourdomain.com -> Front Door IP

# Verify DNS propagation
nslookup app.yourdomain.com
```

### 3. Environment Variables

```bash
# Update application settings with production values
az functionapp config appsettings set \
  --name "func-advisoros-${ENVIRONMENT}" \
  --resource-group $RESOURCE_GROUP \
  --settings \
    ENVIRONMENT=$ENVIRONMENT \
    API_BASE_URL="https://your-domain.com/api" \
    FRONTEND_URL="https://your-domain.com" \
    AZURE_AD_B2C_TENANT_NAME="$B2C_TENANT" \
    AZURE_AD_B2C_CLIENT_ID="your-b2c-client-id" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=https://kv-advisoros-${ENVIRONMENT}.vault.azure.net/secrets/appinsights-instrumentation-key/)"
```

### 4. Database Migration

```bash
# Run database migrations
npx prisma migrate deploy

# Seed initial data (if required)
npx prisma db seed
```

## Validation and Testing

### 1. Health Checks

```bash
# Test frontend availability
curl -f https://your-domain.com

# Test API endpoints
curl -f https://your-domain.com/api/health

# Test database connectivity
curl -f https://your-domain.com/api/health/database
```

### 2. Performance Testing

```bash
# Use Azure Load Testing or external tools
# Test key user journeys:
# - User login/logout
# - Client data access
# - Document upload/download
# - Report generation
```

### 3. Security Testing

```bash
# Run security scans
# - OWASP ZAP scan
# - Azure Security Center recommendations
# - Network penetration testing
# - SSL Labs SSL test
```

## Monitoring Setup

### 1. Configure Alerts

```bash
# Create alert for high error rate
az monitor metrics alert create \
  --name "HighErrorRate" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/func-advisoros-${ENVIRONMENT}" \
  --condition "count 'requests/failed' > 10" \
  --window-size 5m \
  --evaluation-frequency 1m

# Create alert for high response time
az monitor metrics alert create \
  --name "HighResponseTime" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/func-advisoros-${ENVIRONMENT}" \
  --condition "average 'requests/duration' > 2000" \
  --window-size 5m \
  --evaluation-frequency 1m
```

### 2. Configure Action Groups

```bash
# Create action group for notifications
az monitor action-group create \
  --name "AdvisorOSAlerts" \
  --resource-group $RESOURCE_GROUP \
  --short-name "AOSAlerts" \
  --email admin admin@yourdomain.com \
  --sms 1 555-123-4567
```

## Disaster Recovery Setup

### 1. Multi-Region Deployment

```bash
# Create secondary region resources for disaster recovery
SECONDARY_LOCATION="West US 2"
SECONDARY_RESOURCE_GROUP="rg-advisoros-${ENVIRONMENT}-dr"

# Replicate key resources to secondary region
az group create \
  --name $SECONDARY_RESOURCE_GROUP \
  --location "$SECONDARY_LOCATION"

# Configure geo-replication for storage
az storage account create \
  --name "stadvisoros${ENVIRONMENT}dr" \
  --resource-group $SECONDARY_RESOURCE_GROUP \
  --location "$SECONDARY_LOCATION" \
  --sku Standard_GRS
```

### 2. Backup and Recovery Procedures

```bash
# Create backup script
cat > backup-script.sh << 'EOF'
#!/bin/bash
# Daily backup script for AdvisorOS

# Database backup
pg_dump "postgresql://advisoros_app:password@psql-advisoros-prod.postgres.database.azure.com:5432/advisoros" | \
  az storage blob upload \
    --account-name stadvisorosprod \
    --container-name backups \
    --name "database-backup-$(date +%Y%m%d).sql" \
    --data @-

# Configuration backup
az keyvault secret backup --vault-name kv-advisoros-prod --name database-password --file db-password-backup.json
EOF

chmod +x backup-script.sh
```

## Troubleshooting Common Issues

### 1. Deployment Failures

```bash
# Check deployment status
az deployment group list \
  --resource-group $RESOURCE_GROUP \
  --query "[?properties.provisioningState=='Failed']"

# View deployment logs
az deployment operation group list \
  --resource-group $RESOURCE_GROUP \
  --name deployment-name
```

### 2. Connectivity Issues

```bash
# Test network connectivity
az network watcher connectivity-test \
  --resource-group $RESOURCE_GROUP \
  --source-resource func-advisoros-prod \
  --dest-resource psql-advisoros-prod \
  --dest-port 5432

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --name psql-advisoros-prod
```

### 3. Performance Issues

```bash
# Check resource utilization
az monitor metrics list \
  --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/func-advisoros-${ENVIRONMENT}" \
  --metric CpuPercentage,MemoryPercentage \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ)
```

## Cost Optimization

### 1. Resource Right-Sizing

```bash
# Monitor resource usage and adjust sizes
# Use Azure Advisor recommendations
az advisor recommendation list \
  --resource-group $RESOURCE_GROUP \
  --category Cost

# Implement auto-scaling for Function Apps
az functionapp plan update \
  --name ASP-advisoros-prod \
  --resource-group $RESOURCE_GROUP \
  --sku P1v2 \
  --number-of-workers 1
```

### 2. Cost Monitoring

```bash
# Set up budget alerts
az consumption budget create \
  --budget-name "AdvisorOS-Monthly-Budget" \
  --amount 1000 \
  --resource-group $RESOURCE_GROUP \
  --time-grain Monthly \
  --time-period start-date=2024-01-01 end-date=2024-12-31
```

## Security Hardening

### 1. Network Security

```bash
# Restrict database access to application subnet only
az postgres flexible-server firewall-rule delete \
  --resource-group $RESOURCE_GROUP \
  --name psql-advisoros-prod \
  --rule-name AllowAll_2023-01-01_0-0-0-0

# Add specific IP ranges
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name psql-advisoros-prod \
  --rule-name "AllowApplicationSubnet" \
  --start-ip-address 10.0.1.0 \
  --end-ip-address 10.0.1.255
```

### 2. Identity and Access Management

```bash
# Enable managed identity for Function App
az functionapp identity assign \
  --name func-advisoros-prod \
  --resource-group $RESOURCE_GROUP

# Grant Key Vault access to managed identity
FUNCTION_PRINCIPAL_ID=$(az functionapp identity show \
  --name func-advisoros-prod \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

az keyvault set-policy \
  --name kv-advisoros-prod \
  --object-id $FUNCTION_PRINCIPAL_ID \
  --secret-permissions get list
```

## Maintenance Procedures

### 1. Regular Updates

```bash
# Update Function App runtime
az functionapp config set \
  --name func-advisoros-prod \
  --resource-group $RESOURCE_GROUP \
  --node-version 18

# Update database version (requires maintenance window)
az postgres flexible-server update \
  --resource-group $RESOURCE_GROUP \
  --name psql-advisoros-prod \
  --version 15
```

### 2. Performance Tuning

```bash
# Optimize database performance
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name psql-advisoros-prod \
  --name shared_preload_libraries \
  --value pg_stat_statements

# Configure connection pooling
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name psql-advisoros-prod \
  --name max_connections \
  --value 200
```

This deployment guide provides a comprehensive foundation for deploying AdvisorOS to Azure. Regular updates and maintenance will ensure optimal performance and security.