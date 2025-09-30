# Maintenance Workflow Documentation

## Overview

The maintenance workflow (`maintenance.yml`) provides automated monitoring and health checking for the AdvisorOS platform across all environments (dev, staging, prod).

## Features

### 1. **Health Checks** 🏥
Monitors the health of application services:
- App Service status and availability
- Database connectivity and status
- Function App status
- Health endpoint responsiveness
- Main application page accessibility

### 2. **Backup Verification** 🗄️
Ensures backup systems are functioning:
- Database backup verification
- Storage backup validation
- Backup integrity checks

### 3. **Security Scanning** 🔒
Performs security audits:
- HTTPS enforcement verification
- TLS version compliance
- Key Vault configuration checks
- Infrastructure security scanning with Trivy

### 4. **Performance Analysis** 📊
Monitors resource utilization:
- CPU usage metrics (24-hour average)
- Memory utilization tracking
- Application Insights integration (when configured)

### 5. **Cost Analysis** 💰
Tracks Azure spending:
- Current month cost analysis
- Budget alert monitoring
- Resource group cost breakdown

## Scheduling

The workflow runs on two schedules:
- **Daily**: 2 AM UTC for routine maintenance tasks
- **Weekly**: Sundays at 3 AM UTC for comprehensive checks

## Manual Execution

You can manually trigger the workflow with specific options:

```bash
# Via GitHub UI
Actions → Maintenance and Monitoring → Run workflow

# Options:
- task: health-check | backup-verification | security-scan | performance-analysis | cost-analysis | all
- environment: dev | staging | prod | all
```

## Configuration Requirements

### Required Secrets

For full functionality, configure these repository secrets:

```yaml
AZURE_CLIENT_ID: Azure service principal client ID
AZURE_TENANT_ID: Azure Active Directory tenant ID
AZURE_SUBSCRIPTION_ID: Azure subscription ID
```

### Graceful Degradation

**Important**: The workflow is designed to work in development environments without Azure deployment.

When Azure credentials are not configured:
- Jobs check for credentials before attempting Azure operations
- Azure-specific checks are skipped gracefully
- Clear messages explain why checks were skipped
- No false-positive failure issues are created

Example output without Azure credentials:
```
⚠️ Azure credentials not configured - skipping Azure resource checks
⚠️ Backup verification skipped - Azure credentials not configured
This is expected in development environments without Azure deployment
```

## Maintenance Reports

### Automatic Issue Creation

The workflow automatically creates GitHub issues with maintenance reports:

1. **Scheduled Runs**: Always creates a report issue
2. **Manual Runs**: Creates issues only when real failures occur
3. **Skipped Checks**: Does not create issues for expected configuration gaps

### Report Format

```markdown
# 🔧 Maintenance Report - YYYY-MM-DD

## Summary
This report contains the results of scheduled maintenance tasks.

## Task Results

### 🏥 Health Checks
Status: ✅ success | ❌ failure | ⚠️ warning

### 🗄️ Backup Verification
Status: ✅ success | ❌ failure | ⚠️ warning

### 🔒 Security Scan
Status: ✅ success | ❌ failure | ⚠️ warning

### 📊 Performance Analysis
Status: ✅ success | ❌ failure | ⚠️ warning

### 💰 Cost Analysis
Status: ✅ success | ❌ failure | ⚠️ warning

## ⚠️ Configuration Notice
(Shown when Azure credentials are not configured)

## Workflow Details
- Run ID: [workflow run link]
- Triggered by: schedule | workflow_dispatch
- Environments: dev, staging, prod
```

## Environment-Specific Behavior

### Development Environment
- Azure checks may be skipped (if not deployed)
- Local database health can be monitored separately
- Infrastructure scans still run

### Staging Environment
- Full Azure monitoring (when deployed)
- Pre-production validation
- Performance baseline tracking

### Production Environment
- Critical alert thresholds
- Automatic issue creation on failures
- Real-time monitoring integration

## Troubleshooting

### All Checks Failing

**Symptom**: All maintenance jobs show failure status

**Cause**: Missing Azure credentials or resources

**Solution**:
1. Verify Azure credentials are configured in repository secrets
2. Ensure Azure resources are deployed
3. Check network connectivity to Azure
4. For development: This is expected if not using Azure

### Health Check Failures

**Symptom**: Health endpoint not responding

**Solution**:
1. Check application deployment status
2. Verify App Service is running
3. Check application logs for errors
4. Test endpoint manually: `curl https://your-app.azurewebsites.net/api/health`

### Backup Verification Failures

**Symptom**: No backups found

**Solution**:
1. Verify backup automation is configured
2. Check Azure PostgreSQL backup settings
3. Verify storage account access
4. Review backup script execution logs

### Security Scan Failures

**Symptom**: Trivy or security checks fail

**Solution**:
1. Review Trivy scan results in Security tab
2. Check for known vulnerabilities in dependencies
3. Update Terraform/infrastructure code as needed
4. Review Key Vault access policies

### Performance Issues

**Symptom**: High CPU or memory usage

**Solution**:
1. Review Application Insights metrics
2. Check for database query performance
3. Analyze request patterns
4. Consider scaling resources

## Integration with Development Workflow

### Local Development

When developing locally without Azure deployment:
1. The workflow will skip Azure checks
2. You can still run local health checks manually
3. Use the provided scripts for local monitoring:
   ```bash
   npm run dev:test        # Test local database
   npm run dev:setup-db    # Setup local database
   ```

### CI/CD Integration

The maintenance workflow complements the deployment workflow:
1. **Pre-deployment**: Health checks validate environment
2. **Post-deployment**: Automated verification of deployment success
3. **Continuous Monitoring**: Scheduled checks catch issues early

## Best Practices

1. **Review Reports**: Check maintenance reports daily
2. **Address Issues**: Prioritize critical alerts immediately
3. **Monitor Trends**: Track performance metrics over time
4. **Update Thresholds**: Adjust alert thresholds as needed
5. **Document Changes**: Note infrastructure changes that affect monitoring

## Future Enhancements

Potential improvements to consider:
- [ ] Integration with Slack/Teams for real-time alerts
- [ ] Custom alerting thresholds per environment
- [ ] Historical trend analysis and reporting
- [ ] Automated remediation for common issues
- [ ] Enhanced cost optimization recommendations
- [ ] Application-specific health checks

## Related Documentation

- [Azure Deployment Guide](./azure-deployment.md)
- [Monitoring and Observability](./monitoring.md)
- [Incident Response Procedures](./incident-response.md)
- [Backup and Recovery Guide](./backup-recovery.md)

## Support

For issues with the maintenance workflow:
1. Check workflow run logs for detailed error messages
2. Review this documentation for common solutions
3. Open an issue with the `maintenance` label
4. Contact the DevOps team for Azure-specific issues
