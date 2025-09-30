# PostgreSQL Read Replica Implementation Guide

## Overview

This document describes the Azure PostgreSQL read replica implementation for AdvisorOS, including architecture, deployment, monitoring, and operational procedures.

## Architecture

### Components

1. **Primary Database Server**
   - Purpose: Write operations and primary data storage
   - Configuration: `prod-advisoros-postgres`
   - Location: Same as resource group (default: East US)
   - SKU: GP_Standard_D4s_v3 (4 vCores, 16 GB RAM)
   - Storage: 256 GB with auto-grow

2. **Read Replica 1 (Performance)**
   - Purpose: Analytics, reporting, and read-heavy queries
   - Configuration: `prod-advisoros-postgres-replica-1`
   - Location: Same region as primary (low latency)
   - Replication: Asynchronous with physical streaming
   - Target Lag: < 5 seconds

3. **Read Replica DR (Optional)**
   - Purpose: Disaster recovery and cross-region redundancy
   - Configuration: `prod-advisoros-postgres-replica-dr`
   - Location: Cross-region (West US 2 if primary is East US)
   - Replication: Asynchronous
   - Target Lag: < 60 seconds

### Network Architecture

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  (App Service / Container Instances)        │
└────────────┬────────────────────┬───────────┘
             │                    │
             │ Write              │ Read
             │ Operations         │ Operations
             │                    │
┌────────────▼────────┐  ┌───────▼──────────┐
│  Primary Database   │  │  Read Replica 1  │
│  (Write + Read)     │──▶  (Read Only)     │
│  East US            │  │  East US         │
└─────────────────────┘  └──────────────────┘
             │
             │ Replication
             │
┌────────────▼────────────────┐
│  DR Replica (Optional)      │
│  (Read Only)                │
│  West US 2                  │
└─────────────────────────────┘
```

## Connection Strings

### Primary Database (Write Operations)
```
DATABASE_URL=postgresql://admin:password@prod-advisoros-postgres.postgres.database.azure.com:5432/advisoros?sslmode=require
```

### Read Replica 1 (Analytics & Reporting)
```
DATABASE_READ_REPLICA_1_URL=postgresql://admin:password@prod-advisoros-postgres-replica-1.postgres.database.azure.com:5432/advisoros?sslmode=require&application_name=analytics
```

### Read-Only Connection (Defaults to Replica 1)
```
DATABASE_READONLY_URL=postgresql://admin:password@prod-advisoros-postgres-replica-1.postgres.database.azure.com:5432/advisoros?sslmode=require
```

### DR Replica (Disaster Recovery)
```
DATABASE_READ_REPLICA_DR_URL=postgresql://admin:password@prod-advisoros-postgres-replica-dr.postgres.database.azure.com:5432/advisoros?sslmode=require&application_name=disaster_recovery
```

All connection strings are stored in Azure Key Vault:
- `database-url` - Primary connection
- `database-read-replica-1-url` - Replica 1 connection
- `database-readonly-url` - Default read-only connection
- `database-read-replica-dr-url` - DR replica connection (if enabled)

## Deployment

### Prerequisites

1. Azure CLI installed and authenticated
2. Terraform >= 1.5.0
3. Appropriate Azure permissions (Contributor or Owner)
4. Resource group already created

### Deployment Steps

1. **Initialize Terraform**
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

2. **Configure Variables**

   Edit `environments/prod.tfvars`:
   ```hcl
   environment = "prod"
   location    = "eastus"
   enable_monitoring = true
   enable_dr_replica = false  # Set to true for DR replica
   ```

3. **Deploy Read Replicas**
   ```bash
   # Using deployment script (recommended)
   bash scripts/deploy-read-replicas.sh \
     --subscription <subscription-id> \
     --resource-group <resource-group-name> \
     --enable-dr-replica  # Optional

   # Or using Terraform directly
   terraform plan -var-file=environments/prod.tfvars -out=replica.tfplan
   terraform apply replica.tfplan
   ```

4. **Validate Deployment**
   ```bash
   bash scripts/validate-replicas.sh \
     --subscription <subscription-id> \
     --resource-group <resource-group-name>
   ```

### Deployment Timeline

- **Replica Provisioning**: 15-30 minutes
- **Initial Data Sync**: Varies by database size (typically 1-2 hours for 100GB)
- **Monitoring Setup**: 5-10 minutes
- **Total Deployment**: 1-3 hours

## Monitoring & Alerting

### Key Metrics

1. **Replication Lag**
   - Metric: `physical_replication_delay_in_seconds`
   - Threshold: 10 seconds (warning), 30 seconds (critical)
   - Alert: Triggers email/webhook notification

2. **CPU Usage**
   - Metric: `cpu_percent`
   - Threshold: 80% (warning), 90% (critical)
   - Action: Review query performance, consider scaling

3. **Memory Usage**
   - Metric: `memory_percent`
   - Threshold: 85% (warning), 95% (critical)
   - Action: Optimize queries, adjust work_mem

4. **Active Connections**
   - Metric: `active_connections`
   - Threshold: 150 (warning), 180 (critical)
   - Action: Review connection pooling, close idle connections

5. **Storage Usage**
   - Metric: `storage_percent`
   - Threshold: 85% (warning), 95% (critical)
   - Action: Clean up old data, increase storage

### Dashboards

Two comprehensive dashboards are automatically created:

1. **Main Infrastructure Dashboard**
   - Application health and availability
   - Database performance (primary and replicas)
   - Application response times
   - Error rates and logs

2. **Database Performance Dashboard**
   - Detailed replica metrics
   - Replication lag trends
   - Resource utilization comparison
   - Slow query analysis

Access dashboards:
```
https://portal.azure.com/#resource/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Portal/dashboards
```

### Log Analytics Queries

Pre-configured queries for common analysis:

1. **Replication Lag Analysis**
   ```kusto
   AzureMetrics
   | where TimeGenerated > ago(1h)
   | where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
   | where MetricName == "physical_replication_delay_in_seconds"
   | extend ReplicaName = tostring(split(ResourceId, "/")[-1])
   | summarize AvgLag = avg(Average), MaxLag = max(Maximum), P95Lag = percentile(Average, 95)
     by ReplicaName, bin(TimeGenerated, 5m)
   | order by TimeGenerated desc
   ```

2. **Replica Performance Comparison**
   ```kusto
   AzureMetrics
   | where TimeGenerated > ago(1h)
   | where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
   | where MetricName in ("cpu_percent", "memory_percent", "active_connections")
   | extend ReplicaName = tostring(split(ResourceId, "/")[-1])
   | summarize AvgValue = avg(Average), MaxValue = max(Maximum)
     by ReplicaName, MetricName, bin(TimeGenerated, 5m)
   | order by TimeGenerated desc
   ```

3. **Slow Queries**
   ```kusto
   AzureDiagnostics
   | where TimeGenerated > ago(1h)
   | where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
   | where Category == "PostgreSQLLogs"
   | where Message contains "duration"
   | extend QueryDuration = extract("duration: ([0-9.]+) ms", 1, Message)
   | where todouble(QueryDuration) > 1000
   | project TimeGenerated, ResourceId, QueryDuration, Message
   | order by todouble(QueryDuration) desc
   | take 50
   ```

## Operational Procedures

### Monitoring Replication Health

```bash
# Check replication status
az postgres flexible-server replica list \
  --resource-group <resource-group> \
  --server-name prod-advisoros-postgres

# Check current replication lag
az monitor metrics list \
  --resource <replica-resource-id> \
  --metric physical_replication_delay_in_seconds \
  --aggregation Average \
  --interval PT1M
```

### Handling High Replication Lag

If replication lag exceeds threshold:

1. **Investigate Primary Load**
   - Check CPU and memory usage on primary
   - Identify long-running queries
   - Review transaction log generation rate

2. **Check Network Connectivity**
   - Verify network latency between regions (for DR replica)
   - Check for network throttling or issues

3. **Optimize Primary Performance**
   - Kill long-running transactions
   - Optimize slow queries
   - Consider scaling up primary server

4. **Temporary Mitigation**
   - Route read traffic to primary temporarily
   - Reduce application read load on replica
   - Consider adding more replicas for load distribution

### Failover Procedures

#### Planned Failover (Maintenance)

1. **Prepare Application**
   ```bash
   # Update application config to use primary for reads
   az webapp config appsettings set \
     --name <app-name> \
     --resource-group <resource-group> \
     --settings DATABASE_READONLY_URL="$DATABASE_URL"
   ```

2. **Perform Maintenance**
   - Apply updates to replica
   - Verify replica health
   - Allow replication to catch up

3. **Restore Normal Operation**
   ```bash
   # Restore read replica connection
   az webapp config appsettings set \
     --name <app-name> \
     --resource-group <resource-group> \
     --settings DATABASE_READONLY_URL="$DATABASE_READ_REPLICA_1_URL"
   ```

#### Emergency Failover (Primary Failure)

1. **Assess Situation**
   - Verify primary is unresponsive
   - Check replication lag on replicas
   - Determine data loss risk

2. **Promote Replica to Primary**
   ```bash
   # Stop replication and promote replica
   az postgres flexible-server replica promote \
     --resource-group <resource-group> \
     --name prod-advisoros-postgres-replica-1
   ```

3. **Update Application Configuration**
   ```bash
   # Point application to new primary
   az webapp config appsettings set \
     --name <app-name> \
     --resource-group <resource-group> \
     --settings DATABASE_URL="<new-primary-connection-string>"
   ```

4. **Verify Application Health**
   - Test write operations
   - Monitor error rates
   - Verify data consistency

5. **Rebuild Replication**
   - Recover or rebuild original primary
   - Configure as replica of new primary
   - Restore normal topology when ready

### Scaling Replicas

#### Vertical Scaling (CPU/Memory)

```bash
# Scale up replica
az postgres flexible-server update \
  --resource-group <resource-group> \
  --name prod-advisoros-postgres-replica-1 \
  --sku-name GP_Standard_D8s_v3  # 8 vCores, 32 GB RAM

# Scale up storage
az postgres flexible-server update \
  --resource-group <resource-group> \
  --name prod-advisoros-postgres-replica-1 \
  --storage-size 512
```

#### Horizontal Scaling (Add Replicas)

1. **Update Terraform Configuration**
   ```hcl
   # Add new replica resource in database.tf
   resource "azurerm_postgresql_flexible_server" "read_replica_2" {
     count              = var.environment == "prod" ? 1 : 0
     name               = "${var.environment}-advisoros-postgres-replica-2"
     # ... configuration similar to replica-1
   }
   ```

2. **Deploy New Replica**
   ```bash
   terraform plan -var-file=environments/prod.tfvars -out=scale.tfplan
   terraform apply scale.tfplan
   ```

3. **Update Application Load Balancing**
   - Add new connection string to Key Vault
   - Update application connection pool configuration
   - Implement round-robin or weighted routing

## Performance Optimization

### Replica-Specific Tuning

Read replicas are configured with optimized settings for analytics:

```sql
-- Configuration applied to replicas
max_connections = 200
work_mem = 32MB  -- Higher than primary for complex analytics
effective_cache_size = 1GB
```

### Query Routing Strategies

1. **Write Operations → Primary**
   - INSERT, UPDATE, DELETE
   - DDL operations (CREATE, ALTER, DROP)
   - Transaction control (BEGIN, COMMIT, ROLLBACK)

2. **Read Operations → Replica**
   - SELECT queries
   - Reporting and analytics
   - Data exports
   - Read-only API endpoints

3. **Latency-Sensitive Reads → Primary**
   - Real-time dashboards
   - Immediately after writes (read-your-own-writes)
   - Critical business operations

### Connection Pooling

Use PgBouncer (enabled on primary) for efficient connection management:

```
# Primary connection with pooling
DATABASE_URL=postgresql://admin:password@primary:6432/advisoros?sslmode=require&pgbouncer=true

# Replica connection (direct)
DATABASE_READ_REPLICA_1_URL=postgresql://admin:password@replica-1:5432/advisoros?sslmode=require
```

## Cost Optimization

### Replica Sizing Guidelines

| Workload Type | Primary SKU | Replica 1 SKU | Notes |
|--------------|-------------|---------------|-------|
| Small (<10 GB) | B_Standard_B2s | B_Standard_B1ms | Dev/test only |
| Medium (10-100 GB) | GP_Standard_D2s_v3 | GP_Standard_D2s_v3 | Same tier recommended |
| Large (100+ GB) | GP_Standard_D4s_v3 | GP_Standard_D4s_v3 | Production standard |
| Very Large | GP_Standard_D8s_v3 | GP_Standard_D8s_v3 | High-traffic systems |

### Cost Considerations

- Replicas cost the same as the primary server (compute + storage)
- Network egress for cross-region DR replicas
- Storage is replicated (additional cost)
- Backup costs apply to primary only

**Estimated Monthly Costs (Production):**
- Primary: $400-600/month (GP_Standard_D4s_v3 + 256GB)
- Replica 1 (same-region): $400-600/month
- DR Replica (optional, cross-region): $400-600/month + ~$50 egress
- **Total**: $800-1800/month depending on configuration

## Troubleshooting

### Common Issues

1. **High Replication Lag**
   - **Symptoms**: Lag > 30 seconds consistently
   - **Causes**: High primary load, network issues, replica undersized
   - **Solutions**: Scale primary/replica, optimize queries, check network

2. **Connection Failures**
   - **Symptoms**: Unable to connect to replica
   - **Causes**: Network config, firewall rules, DNS issues
   - **Solutions**: Verify VNet peering, check NSG rules, test DNS resolution

3. **Performance Degradation**
   - **Symptoms**: Slow queries on replica
   - **Causes**: Resource exhaustion, missing indexes, lock contention
   - **Solutions**: Monitor resource usage, optimize queries, rebuild indexes

4. **Replication Stopped**
   - **Symptoms**: Replication lag infinite or status "broken"
   - **Causes**: Disk full, configuration error, corruption
   - **Solutions**: Check logs, verify disk space, contact Azure support

### Diagnostic Commands

```bash
# Check replica status
az postgres flexible-server show \
  --resource-group <rg> \
  --name <replica-name> \
  --query "{State:state,ReplicationRole:replicationRole,SourceServer:sourceServerResourceId}"

# View recent alerts
az monitor metrics alert show \
  --resource-group <rg> \
  --name prod-replica-1-replication-lag-alert

# Export metrics for analysis
az monitor metrics list \
  --resource <replica-resource-id> \
  --metric cpu_percent \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --interval PT5M \
  --output json > replica-metrics.json
```

## Security Considerations

1. **Network Isolation**
   - Replicas are in private VNet subnets
   - No public endpoint exposure
   - Private DNS resolution

2. **Authentication**
   - Same authentication as primary
   - Azure AD integration (optional)
   - Strong password policies

3. **Encryption**
   - TLS 1.2+ for connections
   - Data encrypted at rest
   - SSL mode required

4. **Access Control**
   - Firewall rules applied
   - RBAC for Azure management
   - Database-level permissions

## Compliance & Audit

### Audit Logging

All database operations are logged to Azure Log Analytics:

```kusto
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
| where Category == "PostgreSQLLogs"
| where Message contains "AUDIT"
| project TimeGenerated, ResourceId, Message
```

### Data Retention

- **Metrics**: 90 days (Log Analytics workspace)
- **Logs**: 90 days (Log Analytics workspace)
- **Backups**: 35 days (automated backups on primary)

### SOC 2 / HIPAA Compliance

- Azure PostgreSQL is SOC 2 Type II certified
- HIPAA BAA available (requires configuration)
- Data residency maintained within configured regions

## References

### Azure Documentation

- [Azure Database for PostgreSQL Flexible Server](https://docs.microsoft.com/azure/postgresql/flexible-server/)
- [Read Replicas](https://docs.microsoft.com/azure/postgresql/flexible-server/concepts-read-replicas)
- [Monitoring](https://docs.microsoft.com/azure/postgresql/flexible-server/concepts-monitoring)

### Internal Documentation

- [Database Schema](../database/schema.md)
- [Application Configuration](../admin/configuration.md)
- [Disaster Recovery Plan](../admin/disaster-recovery.md)

### Support Contacts

- **DevOps Team**: devops@advisoros.com
- **On-Call**: pagerduty.com/advisoros
- **Azure Support**: portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade

---

**Document Version**: 1.0
**Last Updated**: 2024-01-15
**Author**: DevOps Team
**Review Cycle**: Quarterly