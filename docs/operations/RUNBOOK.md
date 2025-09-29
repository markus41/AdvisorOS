---
layout: default
title: Operations Runbook
parent: Operations Command Center
nav_order: 2
---

# AdvisorOS Operations Runbook

## Quick Reference

### Emergency Contacts
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **DevOps Lead**: devops-lead@advisoros.com
- **Platform Engineering**: platform@advisoros.com

### Key URLs
- **Production**: https://advisoros.com
- **Staging**: https://staging.advisoros.com
- **Health Check**: https://advisoros.com/api/health
- **Azure Portal**: https://portal.azure.com
- **Application Insights**: [Direct Link]
- **GitHub Actions**: [Direct Link]

## Incident Response Procedures

### Severity Levels

#### P0 - Critical (Complete Service Outage)
- **Response Time**: 15 minutes
- **Resolution Time**: 1 hour
- **Examples**: Site down, data loss, security breach

#### P1 - High (Major Feature Broken)
- **Response Time**: 30 minutes
- **Resolution Time**: 4 hours
- **Examples**: Login failures, payment processing down

#### P2 - Medium (Minor Feature Issues)
- **Response Time**: 2 hours
- **Resolution Time**: 24 hours
- **Examples**: Slow performance, non-critical feature bugs

#### P3 - Low (Cosmetic Issues)
- **Response Time**: 1 business day
- **Resolution Time**: 1 week
- **Examples**: UI glitches, minor performance issues

### Initial Response Steps

1. **Acknowledge the incident**
   - Update incident tracking system
   - Notify stakeholders via Slack

2. **Assess severity**
   - Check health endpoints
   - Review monitoring dashboards
   - Determine impact scope

3. **Form incident team**
   - Incident Commander
   - Technical Lead
   - Communications Lead

4. **Begin investigation**
   - Check recent deployments
   - Review error logs
   - Analyze monitoring data

## Common Incident Scenarios

### 1. Application Not Responding

#### Symptoms
- Health check endpoint returns 5xx errors
- Users report "site is down"
- High error rates in Application Insights

#### Investigation Steps
```bash
# Check App Service status
az webapp show \
  --name prod-advisoros-app \
  --resource-group prod-advisoros-rg \
  --query "state"

# Check recent deployments
az webapp deployment list \
  --name prod-advisoros-app \
  --resource-group prod-advisoros-rg \
  --output table

# Review application logs
az webapp log tail \
  --name prod-advisoros-app \
  --resource-group prod-advisoros-rg
```

#### Resolution Steps
1. **Immediate**: Restart the application
   ```bash
   az webapp restart \
     --name prod-advisoros-app \
     --resource-group prod-advisoros-rg
   ```

2. **If restart fails**: Deploy last known good version
   ```bash
   # Swap to previous slot if using staging slots
   az webapp deployment slot swap \
     --name prod-advisoros-app \
     --resource-group prod-advisoros-rg \
     --slot staging \
     --target-slot production
   ```

3. **If still failing**: Scale out to handle load
   ```bash
   az appservice plan update \
     --name prod-advisoros-app-plan \
     --resource-group prod-advisoros-rg \
     --number-of-workers 10
   ```

### 2. Database Connection Issues

#### Symptoms
- Database errors in logs
- Timeout errors
- Health check shows database failure

#### Investigation Steps
```bash
# Check PostgreSQL server status
az postgres flexible-server show \
  --name prod-advisoros-postgres \
  --resource-group prod-advisoros-rg \
  --query "state"

# Check connection metrics
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/prod-advisoros-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/prod-advisoros-postgres \
  --metric "active_connections"
```

#### Resolution Steps
1. **Check connection limits**
   ```bash
   # View current connections
   az postgres flexible-server parameter show \
     --server-name prod-advisoros-postgres \
     --resource-group prod-advisoros-rg \
     --name max_connections
   ```

2. **Restart database if necessary**
   ```bash
   az postgres flexible-server restart \
     --name prod-advisoros-postgres \
     --resource-group prod-advisoros-rg
   ```

3. **Failover to read replica** (if available)
   ```bash
   # Promote read replica
   az postgres flexible-server replica promote \
     --name prod-advisoros-postgres-replica \
     --resource-group prod-advisoros-rg
   ```

### 3. High CPU/Memory Usage

#### Symptoms
- Slow response times
- High resource utilization alerts
- Application timeouts

#### Investigation Steps
```bash
# Check App Service metrics
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/prod-advisoros-rg/providers/Microsoft.Web/sites/prod-advisoros-app \
  --metric "CpuPercentage,MemoryPercentage"

# Check current scaling
az appservice plan show \
  --name prod-advisoros-app-plan \
  --resource-group prod-advisoros-rg \
  --query "{sku: sku, capacity: sku.capacity}"
```

#### Resolution Steps
1. **Scale up** (increase instance size)
   ```bash
   az appservice plan update \
     --name prod-advisoros-app-plan \
     --resource-group prod-advisoros-rg \
     --sku P3V3
   ```

2. **Scale out** (increase instance count)
   ```bash
   az appservice plan update \
     --name prod-advisoros-app-plan \
     --resource-group prod-advisoros-rg \
     --number-of-workers 5
   ```

3. **Check for memory leaks**
   - Review Application Insights performance data
   - Analyze heap dumps if available
   - Consider restarting application

### 4. SSL Certificate Issues

#### Symptoms
- Certificate expiration warnings
- HTTPS errors
- Browser security warnings

#### Investigation Steps
```bash
# Check certificate status
az keyvault certificate show \
  --vault-name prod-advisoros-kv \
  --name advisoros-ssl-cert \
  --query "attributes.expires"

# Check Application Gateway SSL status
az network application-gateway ssl-cert show \
  --gateway-name prod-advisoros-appgw \
  --resource-group prod-advisoros-rg \
  --name advisoros-ssl-cert
```

#### Resolution Steps
1. **Renew certificate**
   ```bash
   # If using Key Vault auto-renewal
   az keyvault certificate create \
     --vault-name prod-advisoros-kv \
     --name advisoros-ssl-cert \
     --policy @cert-policy.json
   ```

2. **Update Application Gateway**
   ```bash
   az network application-gateway ssl-cert update \
     --gateway-name prod-advisoros-appgw \
     --resource-group prod-advisoros-rg \
     --name advisoros-ssl-cert \
     --key-vault-secret-id https://prod-advisoros-kv.vault.azure.net/secrets/advisoros-ssl-cert
   ```

### 5. Redis Cache Issues

#### Symptoms
- Slow application performance
- Session issues
- Cache miss rate high

#### Investigation Steps
```bash
# Check Redis status
az redis show \
  --name prod-advisoros-redis \
  --resource-group prod-advisoros-rg \
  --query "redisState"

# Check metrics
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/prod-advisoros-rg/providers/Microsoft.Cache/redis/prod-advisoros-redis \
  --metric "percentProcessorTime,usedmemorypercentage"
```

#### Resolution Steps
1. **Restart Redis**
   ```bash
   az redis force-reboot \
     --name prod-advisoros-redis \
     --resource-group prod-advisoros-rg \
     --reboot-type PrimaryNode
   ```

2. **Clear cache if needed**
   ```bash
   # Connect to Redis and flush
   redis-cli -h prod-advisoros-redis.redis.cache.windows.net -p 6380 -a {access-key} --tls
   FLUSHALL
   ```

3. **Scale Redis if performance issues persist**
   ```bash
   az redis update \
     --name prod-advisoros-redis \
     --resource-group prod-advisoros-rg \
     --sku Premium \
     --vm-size P2
   ```

## Monitoring and Alerting

### Key Dashboards

1. **Application Performance Dashboard**
   - Response times
   - Error rates
   - Throughput
   - User activity

2. **Infrastructure Dashboard**
   - CPU/Memory usage
   - Database performance
   - Cache hit rates
   - Network metrics

3. **Business Metrics Dashboard**
   - Active users
   - Document processing
   - Revenue metrics
   - Feature usage

### Critical Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| Application Down | Health check fails > 2 minutes | P0 - Immediate response |
| High Error Rate | >5% errors for 5 minutes | P1 - Investigate quickly |
| Database CPU | >90% for 10 minutes | P1 - Scale or optimize |
| Memory Usage | >95% for 5 minutes | P1 - Scale up/restart |
| Certificate Expiry | <30 days | P2 - Renew certificate |
| Disk Space | >90% used | P2 - Clean up or scale |

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- [ ] Check health dashboards
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Verify backup completion

#### Weekly
- [ ] Review performance trends
- [ ] Check security alerts
- [ ] Update monitoring thresholds
- [ ] Review capacity planning

#### Monthly
- [ ] Security patching
- [ ] Performance optimization
- [ ] Cost optimization review
- [ ] Disaster recovery testing

### Maintenance Windows

**Standard Maintenance Window**: Sundays 2:00-6:00 AM UTC

#### Pre-maintenance
1. Announce maintenance window
2. Create database backup
3. Prepare rollback plan
4. Update monitoring

#### During maintenance
1. Apply updates
2. Monitor system health
3. Test critical functions
4. Document changes

#### Post-maintenance
1. Verify all services
2. Run smoke tests
3. Monitor for issues
4. Update documentation

## Performance Optimization

### Database Optimization

```sql
-- Find slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'your_table';

-- Update statistics
ANALYZE;
```

### Application Optimization

1. **Check memory usage patterns**
2. **Optimize database queries**
3. **Review caching strategies**
4. **Monitor API response times**

### Infrastructure Optimization

1. **Right-size resources**
2. **Optimize auto-scaling rules**
3. **Review network performance**
4. **Check storage performance**

## Backup and Recovery

### Backup Verification

```bash
# List available backups
az postgres flexible-server backup list \
  --resource-group prod-advisoros-rg \
  --server-name prod-advisoros-postgres

# Test backup integrity
az postgres flexible-server restore \
  --resource-group test-rg \
  --name test-restore \
  --source-server prod-advisoros-postgres \
  --restore-point-in-time "2024-01-01T10:00:00Z"
```

### Recovery Procedures

1. **Database Recovery**
   - Restore from point-in-time backup
   - Verify data integrity
   - Update connection strings
   - Test application connectivity

2. **Application Recovery**
   - Deploy from last known good version
   - Restore configuration
   - Verify functionality
   - Monitor for issues

## Security Incident Response

### Potential Security Issues

1. **Suspicious Login Activity**
   - Check Azure AD logs
   - Review Application Insights
   - Block suspicious IPs

2. **Data Breach Suspicion**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team
   - Follow legal requirements

3. **DDoS Attack**
   - Enable DDoS protection
   - Block malicious traffic
   - Scale resources if needed
   - Monitor attack patterns

### Contact Information

- **Security Team**: security@advisoros.com
- **Legal Team**: legal@advisoros.com
- **Azure Support**: [Azure Support Portal]

## Escalation Procedures

### Internal Escalation

1. **Level 1**: On-call engineer
2. **Level 2**: Team lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO

### External Escalation

1. **Azure Support**: For infrastructure issues
2. **Third-party Vendors**: For integration issues
3. **Legal/Compliance**: For security incidents

## Documentation Updates

This runbook should be updated:
- After major incidents
- When procedures change
- During architecture updates
- At least quarterly
