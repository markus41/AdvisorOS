# CPA Platform Azure Infrastructure

This directory contains the Terraform configuration for deploying the complete CPA Platform infrastructure on Azure.

## Architecture Overview

The infrastructure includes:

### Core Services
- **App Service**: Hosts the Next.js application with auto-scaling
- **PostgreSQL Database**: Managed database service with automated backups
- **Storage Account**: Blob storage for documents and backups
- **Application Insights**: Application monitoring and analytics

### Security & Identity
- **Azure Key Vault**: Centralized secret management
- **Azure AD B2C**: Multi-tenant authentication
- **Network Security Groups**: Network-level security controls
- **Managed Identities**: Secure service-to-service authentication

### AI & Cognitive Services
- **Form Recognizer**: OCR and document processing
- **Computer Vision**: Image analysis capabilities
- **OpenAI Service**: AI-powered features

### Serverless & Processing
- **Azure Functions**: Background job processing
- **Storage Queues**: Asynchronous job queuing

### Monitoring & Operations
- **Log Analytics**: Centralized logging
- **Azure Monitor**: Metrics and alerting
- **Recovery Services Vault**: Backup and disaster recovery
- **Auto-scaling**: Automatic resource scaling based on demand

### Cost Management
- **Budget Alerts**: Cost monitoring and notifications
- **Consumption-based Services**: Pay-as-you-use for Functions and Cognitive Services

## Quick Start

### Prerequisites

1. **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Terraform**: [Install Terraform](https://www.terraform.io/downloads.html) (>= 1.0)
3. **Azure Subscription**: Active Azure subscription with appropriate permissions

### Setup

1. **Login to Azure**:
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Clone and Configure**:
   ```bash
   cd infrastructure/azure
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Initialize Terraform**:
   ```bash
   terraform init
   ```

4. **Plan Deployment**:
   ```bash
   terraform plan
   ```

5. **Deploy Infrastructure**:
   ```bash
   terraform apply
   ```

## Configuration

### Required Variables

Edit `terraform.tfvars` and set these required values:

```hcl
# Basic Configuration
admin_email = "your-admin@company.com"

# Secrets (or set via environment variables)
db_admin_password         = "your-secure-db-password"
nextauth_secret          = "your-nextauth-secret"
quickbooks_client_id     = "your-quickbooks-client-id"
quickbooks_client_secret = "your-quickbooks-client-secret"
stripe_api_key          = "your-stripe-api-key"
stripe_webhook_secret   = "your-stripe-webhook-secret"
```

### Environment Variables (Recommended for Secrets)

Instead of storing secrets in `terraform.tfvars`, use environment variables:

```bash
export TF_VAR_db_admin_password="your-secure-db-password"
export TF_VAR_nextauth_secret="your-nextauth-secret"
export TF_VAR_quickbooks_client_id="your-quickbooks-client-id"
export TF_VAR_quickbooks_client_secret="your-quickbooks-client-secret"
export TF_VAR_stripe_api_key="your-stripe-api-key"
export TF_VAR_stripe_webhook_secret="your-stripe-webhook-secret"
export TF_VAR_admin_email="your-admin@company.com"
```

## Environment-Specific Deployments

### Development Environment
```bash
terraform apply \
  -var="environment=dev" \
  -var="app_name=cpa-platform-dev" \
  -var="resource_group_name=cpa-platform-dev-rg" \
  -var="app_service_sku=F1" \
  -var="postgres_sku=B_Gen5_1"
```

### Staging Environment
```bash
terraform apply \
  -var="environment=staging" \
  -var="app_name=cpa-platform-staging" \
  -var="resource_group_name=cpa-platform-staging-rg" \
  -var="app_service_sku=S1" \
  -var="postgres_sku=GP_Gen5_1"
```

### Production Environment
```bash
terraform apply \
  -var="environment=prod" \
  -var="app_name=cpa-platform" \
  -var="resource_group_name=cpa-platform-rg" \
  -var="app_service_sku=P1V2" \
  -var="postgres_sku=GP_Gen5_2" \
  -var="min_instances=2" \
  -var="max_instances=20"
```

## CI/CD Integration

The infrastructure is designed to work with the included GitHub Actions workflows:

### Workflows Available
- **deploy.yml**: Full application deployment pipeline
- **infrastructure.yml**: Infrastructure-only management
- **maintenance.yml**: Monitoring and maintenance tasks

### Required GitHub Secrets

Set these secrets in your GitHub repository:

```bash
AZURE_CLIENT_ID          # Service Principal Client ID
AZURE_TENANT_ID          # Azure Tenant ID
AZURE_SUBSCRIPTION_ID    # Azure Subscription ID
ADMIN_EMAIL              # Administrator email for alerts
DB_ADMIN_PASSWORD        # Database admin password
NEXTAUTH_SECRET          # NextAuth.js secret
QUICKBOOKS_CLIENT_ID     # QuickBooks API Client ID
QUICKBOOKS_CLIENT_SECRET # QuickBooks API Client Secret
STRIPE_API_KEY           # Stripe API Key
STRIPE_WEBHOOK_SECRET    # Stripe Webhook Secret
```

### Service Principal Setup

Create a service principal for CI/CD:

```bash
# Create service principal
az ad sp create-for-rbac --name "cpa-platform-cicd" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth

# Note the output for GitHub secrets:
# AZURE_CLIENT_ID = clientId
# AZURE_CLIENT_SECRET = clientSecret (if using secret-based auth)
# AZURE_TENANT_ID = tenantId
# AZURE_SUBSCRIPTION_ID = subscriptionId
```

For enhanced security with OIDC (recommended):

```bash
# Create service principal for OIDC
az ad sp create-for-rbac --name "cpa-platform-cicd" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID

# Configure OIDC federation
az ad app federated-credential create \
  --id YOUR_APP_ID \
  --parameters @oidc-config.json
```

## Security Considerations

### Key Vault Integration
All secrets are stored in Azure Key Vault and referenced by applications using managed identities.

### Network Security
- Network Security Groups restrict traffic to necessary ports
- Database allows connections only from Azure services
- HTTPS is enforced on all web applications

### Access Control
- Managed identities eliminate need for stored credentials
- Custom RBAC roles limit CI/CD permissions
- Key Vault access policies restrict secret access

### Monitoring
- All services are monitored with Application Insights
- Security events are logged to Log Analytics
- Alerts are configured for security incidents

## Cost Optimization

### Auto-scaling
- App Service scales based on CPU and memory usage
- Functions use consumption-based pricing
- Cognitive Services scale with usage

### Cost Monitoring
- Budget alerts at 80% and 100% of monthly limit
- Cost analysis available in Azure portal
- Recommendations for reserved instances

### Right-sizing Recommendations

**Development**: F1/B-tier services, minimal scaling
**Staging**: S1/GP-tier services, moderate scaling
**Production**: P1V2+/GP-tier services, aggressive scaling

## Backup and Disaster Recovery

### Automated Backups
- PostgreSQL: 7-day retention with geo-redundancy option
- Storage: Cross-region replication available
- Application: Deployment slots for blue-green deployments

### Recovery Procedures
- Database point-in-time restore available
- Application can be restored from backup slots
- Infrastructure can be recreated from Terraform state

## Monitoring and Alerting

### Available Metrics
- Application performance (response time, errors)
- Infrastructure health (CPU, memory, disk)
- Database performance (connections, queries)
- Cost and billing alerts

### Alert Configuration
- High response time (>5 seconds)
- Error rate (>5%)
- High resource utilization (>80%)
- Budget threshold breaches

## Troubleshooting

### Common Issues

1. **Terraform Plan Fails**
   - Check Azure CLI authentication: `az account show`
   - Verify subscription access: `az account list`
   - Ensure required providers are available

2. **Deployment Timeouts**
   - Some resources (B2C tenant) can take 10+ minutes
   - Use `terraform apply -timeout=30m` for longer timeouts

3. **Key Vault Access Issues**
   - Verify managed identity is properly configured
   - Check Key Vault access policies
   - Ensure secrets are properly formatted

4. **Application Not Starting**
   - Check Application Insights for errors
   - Verify Key Vault references in app settings
   - Review deployment logs in Azure portal

### Getting Help

- Check Azure service health: https://status.azure.com/
- Review Terraform Azure provider docs: https://registry.terraform.io/providers/hashicorp/azurerm/latest
- Monitor GitHub Actions workflow logs for deployment issues

## Cleanup

To destroy the infrastructure:

```bash
# Destroy non-production environments
terraform destroy \
  -var="environment=dev" \
  -var="app_name=cpa-platform-dev" \
  -var="resource_group_name=cpa-platform-dev-rg"

# Production requires manual confirmation
```

⚠️ **Warning**: Destroying infrastructure will permanently delete all data. Ensure backups are available before proceeding.

## Contributing

When modifying the infrastructure:

1. Test changes in development environment first
2. Use `terraform plan` to review changes
3. Update this documentation for significant changes
4. Follow the established naming conventions
5. Add appropriate tags to new resources