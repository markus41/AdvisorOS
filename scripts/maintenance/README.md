# AdvisorOS Maintenance System

## Overview

The AdvisorOS Maintenance System is a comprehensive, standalone monitoring and maintenance solution designed to ensure the health, security, performance, and cost-effectiveness of the AdvisorOS CPA platform. It operates independently without requiring Azure credentials or external dependencies.

## Features

### 🏥 Health Check Service
- **File System Health**: Validates critical directories and files
- **Package Dependencies**: Checks npm packages and security vulnerabilities
- **Application Health**: Validates TypeScript configuration and environment setup
- **System Resources**: Monitors memory usage, CPU load, and disk space

### 🗄️ Backup Verification Service
- **Backup Directory Verification**: Checks for backup directories and files
- **Git Repository Backup**: Validates version control and remote repositories
- **Critical File Backup**: Ensures important files are backed up
- **Backup Integrity**: Verifies backup file integrity and validity

### 🔒 Security Scanning Service
- **Package Vulnerability Scan**: Identifies security vulnerabilities in dependencies
- **Code Security Analysis**: Scans for security issues in source code
- **Configuration Security**: Validates security configurations
- **Authentication Security**: Checks authentication implementation and security

### 📊 Performance Analysis Service
- **System Performance**: Monitors memory, CPU, and resource usage
- **Build Performance**: Analyzes build configuration and estimated build times
- **Code Quality Metrics**: Analyzes codebase complexity and maintainability
- **Dependency Performance**: Evaluates dependency impact on performance

### 💰 Cost Analysis Service
- **Infrastructure Cost Estimation**: Projects infrastructure costs at different scales
- **Development Cost Analysis**: Evaluates development and operational costs
- **Scaling Cost Projections**: Models costs at various user scales
- **Cost Optimization**: Identifies opportunities for cost savings

## Installation and Setup

### Prerequisites
- Node.js 18.17.0 or later
- npm 10.0.0 or later

### Setup
```bash
# Make maintenance scripts executable
npm run maintenance:setup
```

## Usage

### Individual Services

Run individual maintenance services:

```bash
# Health Check
npm run maintenance:health

# Backup Verification
npm run maintenance:backup

# Security Scan
npm run maintenance:security

# Performance Analysis
npm run maintenance:performance

# Cost Analysis
npm run maintenance:cost
```

### Complete Maintenance Suite

Run all maintenance services with comprehensive reporting:

```bash
npm run maintenance:all
```

### Command Line Usage

You can also run services directly:

```bash
# Individual services
node scripts/maintenance/health-check.js
node scripts/maintenance/backup-verification.js
node scripts/maintenance/security-scan.js
node scripts/maintenance/performance-analysis.js
node scripts/maintenance/cost-analysis.js

# Complete suite
node scripts/maintenance/maintenance-orchestrator.js

# Run specific services only
node scripts/maintenance/maintenance-orchestrator.js health-check security-scan
```

## Output and Reports

### Result Files

Each service generates detailed JSON result files:
- `health-check-results.json`
- `backup-verification-results.json`
- `security-scan-results.json`
- `performance-analysis-results.json`
- `cost-analysis-results.json`

### Comprehensive Reports

The maintenance orchestrator generates:
- `maintenance-results.json` - Complete results from all services
- `maintenance-report.md` - Human-readable markdown report

### Exit Codes

Services use standard exit codes:
- `0` - Healthy/Success
- `1` - Degraded/Warnings
- `2` - Unhealthy/Failed

## GitHub Workflow Integration

The maintenance system is integrated with GitHub Actions and runs automatically:

### Scheduled Runs
- **Daily at 2 AM UTC**: Basic maintenance tasks
- **Weekly on Sundays at 3 AM UTC**: Comprehensive maintenance

### Manual Runs
Use GitHub Actions workflow dispatch to run specific maintenance tasks:
1. Go to Actions → Maintenance and Monitoring
2. Click "Run workflow"
3. Select the task and environment
4. Click "Run workflow"

### Automatic Issue Creation

The system automatically creates GitHub issues for:
- Failed health checks
- Critical security vulnerabilities
- Maintenance reports with recommendations

## Configuration

### Environment Variables

The maintenance system respects these environment variables:
- `NODE_ENV` - Environment (development/staging/production)
- `GITHUB_RUN_ID` - GitHub workflow run ID (for reporting)
- `GITHUB_EVENT_NAME` - GitHub event name (for reporting)

### Thresholds and Limits

Key thresholds can be adjusted in the service files:

#### Health Check (`health-check.js`)
- Memory usage limits
- Disk space warnings
- Package count thresholds

#### Security Scan (`security-scan.js`)
- Vulnerability severity mappings
- Security pattern definitions
- File exclusion patterns

#### Performance Analysis (`performance-analysis.js`)
- Memory usage thresholds
- Build time limits
- Code complexity limits

#### Cost Analysis (`cost-analysis.js`)
- Cost models and pricing
- Scaling scenarios
- Optimization thresholds

## Architecture

### Service Structure

Each maintenance service follows a consistent pattern:

```javascript
class MaintenanceService {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {},
      summary: {},
      recommendations: []
    };
  }

  async runAllChecks() {
    // Run individual checks
    // Calculate overall status
    // Generate recommendations
    // Return results
  }

  async saveResults(outputPath) {
    // Save JSON results to file
  }
}
```

### Master Orchestrator

The maintenance orchestrator:
1. Runs services in priority order (Critical → Normal → Analysis)
2. Collects and aggregates results
3. Generates comprehensive summaries
4. Creates actionable recommendations
5. Produces markdown reports

### Priority Levels

Services are categorized by priority:
- **Priority 1 (Critical)**: Health Check, Security Scan
- **Priority 2 (Normal)**: Backup Verification, Performance Analysis
- **Priority 3 (Analysis)**: Cost Analysis

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Make scripts executable
chmod +x scripts/maintenance/*.js
# Or use the setup command
npm run maintenance:setup
```

#### Module Not Found
```bash
# Install dependencies
npm install
```

#### TypeScript Errors
```bash
# Install TypeScript if needed
npm install -g typescript
# Or run without TypeScript validation
```

### Debugging

Enable verbose logging by setting:
```bash
export DEBUG=maintenance:*
```

### Service-Specific Issues

#### Health Check
- Ensure all critical paths exist
- Check npm package installation
- Verify TypeScript configuration

#### Security Scan
- Review false positives in security patterns
- Check file permissions on sensitive files
- Validate authentication configuration

#### Performance Analysis
- Monitor memory usage during analysis
- Check for large codebases that may timeout
- Verify disk space for analysis operations

#### Cost Analysis
- Validate package.json structure
- Check dependency counting logic
- Review cost model assumptions

## Extending the System

### Adding New Checks

To add a new check to an existing service:

1. Add the check method to the service class
2. Update the `runAllChecks()` method to include the new check
3. Add appropriate error handling and logging
4. Update the results schema to include new check data

### Creating New Services

To create a new maintenance service:

1. Create a new service file following the existing pattern
2. Implement the required methods (`runAllChecks`, `saveResults`)
3. Add the service to the orchestrator's service list
4. Update the GitHub workflow to include the new service
5. Add npm scripts for the new service

### Custom Reporting

The results are structured JSON that can be processed by external tools:

```javascript
const results = JSON.parse(fs.readFileSync('maintenance-results.json', 'utf8'));

// Extract specific metrics
const securityVulns = results.overallMetrics.security.totalVulnerabilities;
const monthlyCost = results.overallMetrics.costs.monthlyEstimate;
const criticalIssues = results.criticalIssues;

// Generate custom reports
generateCustomReport(results);
```

## Best Practices

### Running Maintenance

1. **Regular Scheduling**: Run health checks daily, comprehensive scans weekly
2. **Issue Response**: Address critical issues immediately
3. **Trend Monitoring**: Track metrics over time to identify patterns
4. **Cost Optimization**: Review cost analysis monthly and implement optimizations

### Development Integration

1. **Pre-commit**: Run health checks before major commits
2. **CI/CD Integration**: Include maintenance checks in deployment pipelines
3. **Performance Monitoring**: Use performance metrics to guide optimization
4. **Security**: Run security scans before releases

### Monitoring and Alerting

1. **GitHub Issues**: Monitor maintenance issues for critical problems
2. **Workflow Notifications**: Set up notifications for failed maintenance runs
3. **Trend Analysis**: Track maintenance metrics over time
4. **Escalation**: Define escalation procedures for critical failures

## Support

For questions or issues with the maintenance system:

1. Check the troubleshooting section above
2. Review the generated maintenance reports for specific guidance
3. Examine the individual service result files for detailed information
4. Check GitHub workflow logs for execution details

## Security Considerations

The maintenance system:
- Operates entirely locally without external API calls
- Does not transmit sensitive data outside the repository
- Scans for security issues but does not automatically fix them
- Generates reports that should be reviewed before sharing
- May detect false positives that require manual validation

Always review security scan results and recommendations before implementing changes.