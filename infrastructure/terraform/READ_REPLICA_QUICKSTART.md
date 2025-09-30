# Read Replica Quick Start Guide

## TL;DR - Quick Commands

### Deploy Read Replicas

```bash
# Navigate to terraform directory
cd infrastructure/terraform

# Deploy with same-region replica only (recommended for production start)
bash scripts/deploy-read-replicas.sh \
  --subscription YOUR_SUBSCRIPTION_ID \
  --resource-group prod-cpa-rg

# Deploy with both same-region and cross-region DR replica
bash scripts/deploy-read-replicas.sh \
  --subscription YOUR_SUBSCRIPTION_ID \
  --resource-group prod-cpa-rg \
  --enable-dr-replica
```

### Validate Deployment

```bash
bash scripts/validate-replicas.sh \
  --subscription YOUR_SUBSCRIPTION_ID \
  --resource-group prod-cpa-rg
```

### Get Connection Strings

```bash
# Get Key Vault name
terraform output -raw key_vault_name

# Retrieve connection strings
az keyvault secret show \
  --vault-name YOUR_KEY_VAULT_NAME \
  --name database-read-replica-1-url \
  --query value -o tsv
```

## What Gets Deployed

### Infrastructure Components

1. **Read Replica 1 (Same Region)**
   - Name: `prod-advisoros-postgres-replica-1`
   - Purpose: Analytics and reporting
   - Location: Same as primary (East US)
   - Target Lag: < 5 seconds

2. **DR Replica (Optional, Cross Region)**
   - Name: `prod-advisoros-postgres-replica-dr`
   - Purpose: Disaster recovery
   - Location: West US 2
   - Target Lag: < 60 seconds

3. **Monitoring & Alerting**
   - Replication lag alerts (< 10s threshold)
   - CPU/Memory/Connection alerts
   - Azure Dashboards (2 dashboards)
   - Log Analytics queries (4 saved searches)
   - Diagnostic settings enabled

4. **Key Vault Secrets**
   - `database-read-replica-1-url`
   - `database-readonly-url`
   - `database-read-replica-dr-url` (if DR enabled)

## Configuration Files Modified

### Terraform Files
- `infrastructure/terraform/database.tf` - Replica resources
- `infrastructure/terraform/monitoring.tf` - Alerts and diagnostics
- `infrastructure/terraform/dashboard.tf` - Azure dashboards
- `infrastructure/terraform/variables.tf` - New variables
- `infrastructure/terraform/outputs.tf` - Replica outputs

### Environment Files
- `.env.example` - Added replica connection string examples
- `infrastructure/terraform/environments/prod.tfvars` - DR replica toggle

### Scripts
- `infrastructure/terraform/scripts/deploy-read-replicas.sh` - Deployment automation
- `infrastructure/terraform/scripts/validate-replicas.sh` - Health validation

### Documentation
- `docs/infrastructure/read-replica-implementation.md` - Complete guide

## Connection String Usage

### Environment Variables

```bash
# Primary database (writes)
DATABASE_URL="postgresql://user:pass@primary-host:5432/advisoros?sslmode=require"

# Read replica 1 (analytics)
DATABASE_READ_REPLICA_1_URL="postgresql://user:pass@replica-1-host:5432/advisoros?sslmode=require"

# Default read-only (points to replica 1)
DATABASE_READONLY_URL="postgresql://user:pass@replica-1-host:5432/advisoros?sslmode=require"

# DR replica (optional)
DATABASE_READ_REPLICA_DR_URL="postgresql://user:pass@replica-dr-host:5432/advisoros?sslmode=require"
```

### Application Code Example

```typescript
// Use primary for writes
const writeClient = new Client({ connectionString: process.env.DATABASE_URL });

// Use replica for reads
const readClient = new Client({ connectionString: process.env.DATABASE_READONLY_URL });

// Write operation
await writeClient.query('INSERT INTO clients (name) VALUES ($1)', ['Acme Corp']);

// Read operation (from replica)
const result = await readClient.query('SELECT * FROM clients WHERE id = $1', [123]);
```

## Monitoring Access

### Azure Portal Dashboards

1. **Main Dashboard**
   ```
   https://portal.azure.com/#resource/subscriptions/{subscription-id}/resourceGroups/prod-cpa-rg/providers/Microsoft.Portal/dashboards/prod-advisoros-dashboard
   ```

2. **Database Dashboard**
   ```
   https://portal.azure.com/#resource/subscriptions/{subscription-id}/resourceGroups/prod-cpa-rg/providers/Microsoft.Portal/dashboards/prod-advisoros-database-dashboard
   ```

### Key Metrics to Monitor

1. **Replication Lag**: Should be < 10 seconds
2. **CPU Usage**: Should be < 80%
3. **Memory Usage**: Should be < 85%
4. **Active Connections**: Should be < 150 (out of 200 max)

### Alert Notifications

Alerts are configured to send notifications via:
- Email (configured in `alert_email` variable)
- Azure Mobile App
- Webhook (Slack/Teams integration)

## Cost Breakdown

### Monthly Costs (Estimated)

| Component | SKU | Monthly Cost |
|-----------|-----|--------------|
| Primary Database | GP_Standard_D4s_v3 (4 vCore, 16GB) | $500 |
| Storage (256GB) | P30 | $100 |
| Read Replica 1 | GP_Standard_D4s_v3 (4 vCore, 16GB) | $500 |
| DR Replica (optional) | GP_Standard_D4s_v3 (4 vCore, 16GB) | $500 |
| Cross-region data transfer | ~10GB/day | $50 |
| Monitoring (Log Analytics) | 10GB/month | $30 |
| **Total (without DR)** | | **~$1,130** |
| **Total (with DR)** | | **~$1,680** |

## Troubleshooting Quick Checks

### Check Replica Status

```bash
az postgres flexible-server show \
  --resource-group prod-cpa-rg \
  --name prod-advisoros-postgres-replica-1 \
  --query "{State:state,Role:replicationRole}" -o table
```

### Check Replication Lag

```bash
az monitor metrics list \
  --resource /subscriptions/{sub}/resourceGroups/prod-cpa-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/prod-advisoros-postgres-replica-1 \
  --metric physical_replication_delay_in_seconds \
  --aggregation Average \
  --interval PT1M \
  | jq '.value[0].timeseries[0].data[-1].average'
```

### Test Connectivity

```bash
# Test DNS resolution
nslookup prod-advisoros-postgres-replica-1.postgres.database.azure.com

# Test TCP connectivity
nc -zv prod-advisoros-postgres-replica-1.postgres.database.azure.com 5432

# Test database connection (requires psql)
psql "$(az keyvault secret show --vault-name YOUR_KV --name database-read-replica-1-url --query value -o tsv)"
```

## Rollback Procedure

If you need to remove replicas:

```bash
# 1. Update application to use primary for all operations
az webapp config appsettings set \
  --name prod-advisoros-app \
  --resource-group prod-cpa-rg \
  --settings DATABASE_READONLY_URL="$DATABASE_URL"

# 2. Delete replica resources
terraform destroy \
  -target=azurerm_postgresql_flexible_server.read_replica_1 \
  -var-file=environments/prod.tfvars

# 3. Clean up monitoring resources
terraform destroy \
  -target=azurerm_monitor_metric_alert.replica_1_replication_lag \
  -var-file=environments/prod.tfvars
```

## Next Steps After Deployment

1. **Update Application Configuration**
   - Add replica connection strings to app settings
   - Implement read/write routing logic
   - Test failover scenarios

2. **Performance Testing**
   - Run load tests against replicas
   - Measure replication lag under load
   - Validate query performance

3. **Monitoring Setup**
   - Configure alert notification channels
   - Set up PagerDuty/Slack integration
   - Review dashboard customization

4. **Documentation**
   - Update runbooks with new procedures
   - Train team on replica management
   - Document query routing strategy

5. **Security Review**
   - Verify network isolation
   - Review access controls
   - Audit connection string storage

## Support Resources

- **Full Documentation**: `docs/infrastructure/read-replica-implementation.md`
- **Azure Support**: Create ticket in Azure Portal
- **Team Contact**: devops@advisoros.com
- **On-Call**: PagerDuty escalation

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| High lag | Primary overloaded | Scale up primary/replica |
| Connection timeout | Network config | Check VNet peering and NSG rules |
| Queries slow on replica | Resource constraints | Scale replica or optimize queries |
| Deployment fails | Permissions | Verify Contributor role on subscription |
| Metrics not showing | Delay in metrics | Wait 10-15 minutes for metrics to populate |

---

**Quick Start Version**: 1.0
**Last Updated**: 2024-01-15
**Deployment Time**: ~1-2 hours