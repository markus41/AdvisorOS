---
layout: default
title: Production Deployment Guide
parent: Operations Command Center
nav_order: 3
---

# AdvisorOS Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying and managing AdvisorOS in production environments using Azure infrastructure.

## Prerequisites

### Required Tools
- Azure CLI 2.50+
- Terraform 1.5+
- Node.js 18+
- Git
- GitHub CLI (optional)

### Required Permissions
- Azure Subscription Contributor access
- GitHub repository admin access
- Ability to create Azure AD applications

## Infrastructure Setup

### 1. Initial Azure Setup

```bash
# Login to Azure
az login

# Set default subscription
az account set --subscription "your-subscription-id"

# Create resource group for Terraform state
az group create --name advisoros-terraform-rg --location eastus

# Create storage account for Terraform state
az storage account create \
  --name advisorostfstate \
  --resource-group advisoros-terraform-rg \
  --location eastus \
  --sku Standard_LRS

# Create storage container
az storage container create \
  --name terraform-state \
  --account-name advisorostfstate
```

### 2. Service Principal Setup

```bash
# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "advisoros-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth

# Save the output JSON for GitHub secrets
```

### 3. GitHub Secrets Configuration

Required secrets in GitHub repository:

```
AZURE_CREDENTIALS - Service principal JSON from step 2
ARM_CLIENT_ID - From service principal
ARM_CLIENT_SECRET - From service principal
ARM_SUBSCRIPTION_ID - Your Azure subscription ID
ARM_TENANT_ID - Your Azure tenant ID
SNYK_TOKEN - Snyk security scanning token
INFRACOST_API_KEY - Infrastructure cost estimation
SLACK_WEBHOOK_URL - For deployment notifications
```

## Environment Configuration

### Staging Environment

1. **Update Configuration**
   ```bash
   # Edit staging configuration
   vi infrastructure/terraform/environments/staging.tfvars
   ```

2. **Deploy Infrastructure**
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform workspace new staging
   terraform plan -var-file="environments/staging.tfvars"
   terraform apply -var-file="environments/staging.tfvars"
   ```

### Production Environment

1. **Pre-deployment Checklist**
   - [ ] All staging tests passing
   - [ ] Security scans completed
   - [ ] Database backups verified
   - [ ] Monitoring alerts configured
   - [ ] SSL certificates ready
   - [ ] DNS configured

2. **Production Deployment**
   ```bash
   # Switch to production workspace
   terraform workspace new production

   # Plan deployment
   terraform plan -var-file="environments/production.tfvars"

   # Apply with approval
   terraform apply -var-file="environments/production.tfvars"
   ```

## Application Deployment

### Automated Deployment (Recommended)

The GitHub Actions workflow handles automatic deployment:

1. **Staging Deployment**
   - Triggered on push to `main` branch
   - Runs full test suite
   - Deploys to staging environment
   - Runs smoke tests

2. **Production Deployment**
   - Manual trigger via GitHub Actions
   - Requires staging deployment success
   - Blue-green deployment strategy
   - Automatic rollback on failure

### Manual Deployment

For emergency deployments or troubleshooting:

```bash
# Build application
npm ci
npm run build

# Deploy to Azure App Service
az webapp deployment source config-zip \
  --resource-group prod-advisoros-rg \
  --name prod-advisoros-app \
  --src ./build.zip
```

## Database Management

### Migrations

```bash
# Run migrations in staging
npm run db:migrate
DATABASE_URL=$STAGING_DATABASE_URL

# Run migrations in production (with backup)
az postgres flexible-server backup create \
  --resource-group prod-advisoros-rg \
  --server-name prod-advisoros-postgres \
  --backup-name "pre-migration-$(date +%Y%m%d-%H%M%S)"

npm run db:migrate
DATABASE_URL=$PRODUCTION_DATABASE_URL
```

### Backup and Restore

```bash
# Create manual backup
az postgres flexible-server backup create \
  --resource-group prod-advisoros-rg \
  --server-name prod-advisoros-postgres \
  --backup-name "manual-backup-$(date +%Y%m%d-%H%M%S)"

# List backups
az postgres flexible-server backup list \
  --resource-group prod-advisoros-rg \
  --server-name prod-advisoros-postgres

# Restore from backup
az postgres flexible-server restore \
  --resource-group prod-advisoros-rg \
  --name prod-advisoros-postgres-restored \
  --restore-point-in-time "2024-01-01T10:00:00Z"
```

## Monitoring and Alerting

### Health Checks

- **Application Health**: `https://advisoros.com/api/health`
- **Database Health**: Monitored via Application Insights
- **Redis Health**: Included in health endpoint

### Key Metrics to Monitor

1. **Application Performance**
   - Response time < 3 seconds
   - Error rate < 1%
   - Availability > 99.9%

2. **Infrastructure Health**
   - CPU usage < 80%
   - Memory usage < 85%
   - Database connections < 80% of max

3. **Business Metrics**
   - Active user sessions
   - Document processing rate
   - API usage patterns

### Alert Escalation

1. **Level 1**: Email notifications
2. **Level 2**: Slack/Teams notifications
3. **Level 3**: PagerDuty escalation

## Security Operations

### Certificate Management

```bash
# Check certificate expiration
az keyvault certificate show \
  --vault-name prod-advisoros-kv \
  --name advisoros-ssl-cert

# Renew certificate (automatic via Key Vault)
# Manual renewal if needed:
az keyvault certificate create \
  --vault-name prod-advisoros-kv \
  --name advisoros-ssl-cert \
  --policy @cert-policy.json
```

### Key Rotation

```bash
# Rotate database password
az postgres flexible-server update \
  --resource-group prod-advisoros-rg \
  --name prod-advisoros-postgres \
  --admin-password "new-secure-password"

# Update Key Vault secret
az keyvault secret set \
  --vault-name prod-advisoros-kv \
  --name database-url \
  --value "new-connection-string"
```

## Disaster Recovery

### Recovery Time Objectives (RTO)
- **Critical Systems**: 30 minutes
- **Non-critical Systems**: 2 hours
- **Full Service**: 4 hours

### Recovery Point Objectives (RPO)
- **Database**: 5 minutes
- **File Storage**: 15 minutes
- **Configuration**: 1 hour

### Disaster Recovery Procedures

1. **Database Failover**
   ```bash
   # Promote read replica to primary
   az postgres flexible-server replica promote \
     --resource-group prod-advisoros-rg \
     --name prod-advisoros-postgres-replica
   ```

2. **Application Failover**
   ```bash
   # Deploy to secondary region
   terraform apply \
     -var-file="environments/production-dr.tfvars" \
     -target=azurerm_linux_web_app.app_dr
   ```

3. **DNS Failover**
   ```bash
   # Update DNS to point to DR environment
   az network dns record-set cname set-record \
     --resource-group advisoros-dns-rg \
     --zone-name advisoros.com \
     --record-set-name www \
     --cname dr.advisoros.com
   ```

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   - Check environment variables
   - Verify database connectivity
   - Review Application Insights logs

2. **High Response Times**
   - Check database performance
   - Review Redis cache hit rates
   - Analyze Application Insights performance data

3. **Authentication Issues**
   - Verify Azure AD B2C configuration
   - Check Key Vault permissions
   - Review certificate validity

### Log Analysis

```bash
# Query Application Insights logs
az monitor app-insights query \
  --app advisoros-prod-insights \
  --analytics-query "requests | where timestamp > ago(1h) | where resultCode >= 500"

# Check App Service logs
az webapp log tail \
  --name prod-advisoros-app \
  --resource-group prod-advisoros-rg
```

## Maintenance Windows

### Scheduled Maintenance

- **Database**: Sundays 2:00-4:00 AM UTC
- **Application**: Sundays 4:00-5:00 AM UTC
- **Infrastructure**: Monthly, second Sunday

### Pre-maintenance Checklist

- [ ] Notify users 48 hours in advance
- [ ] Create database backup
- [ ] Verify rollback procedures
- [ ] Prepare maintenance notifications
- [ ] Coordinate with team

### Post-maintenance Checklist

- [ ] Verify all services operational
- [ ] Run health checks
- [ ] Monitor error rates
- [ ] Update maintenance log
- [ ] Notify users of completion

## Support Contacts

- **DevOps Team**: devops@advisoros.com
- **Development Team**: dev@advisoros.com
- **Business Team**: business@advisoros.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

## Appendix

### Useful Commands

```bash
# Check deployment status
az webapp show \
  --name prod-advisoros-app \
  --resource-group prod-advisoros-rg \
  --query "{state: state, hostNames: defaultHostName}"

# Scale application
az appservice plan update \
  --name prod-advisoros-app-plan \
  --resource-group prod-advisoros-rg \
  --sku P2V3 \
  --number-of-workers 5

# View recent deployments
az webapp deployment list \
  --name prod-advisoros-app \
  --resource-group prod-advisoros-rg
```

### Configuration Templates

See `/docs/operations/templates/` for:
- Environment variable templates
- Monitoring dashboard configurations
- Alert rule templates
- Backup scripts
