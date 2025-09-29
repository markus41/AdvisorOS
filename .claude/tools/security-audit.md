# Security Audit Tool Set

Collection of specialized tools for comprehensive security auditing of the AdvisorOS multi-tenant CPA platform.

## Tool Categories

### 1. Cross-Tenant Isolation Validators
- **Database Query Analyzer**: Scans code for missing organizationId filters
- **API Endpoint Auditor**: Validates organization context in all endpoints  
- **File Storage Inspector**: Ensures organization-scoped file access
- **Cache Key Validator**: Checks for organization isolation in caching

### 2. Permission System Validators
- **RBAC Hierarchy Checker**: Validates role-based access control implementation
- **Permission Matrix Auditor**: Ensures consistent permission enforcement
- **Escalation Prevention Detector**: Identifies potential privilege escalation paths
- **Resource Access Validator**: Confirms proper resource ownership checking

### 3. Audit Trail Compliance Tools
- **Financial Operation Tracer**: Ensures all financial operations create audit logs
- **User Action Monitor**: Validates comprehensive user activity logging
- **Data Change Tracker**: Confirms audit trails for sensitive data modifications
- **Compliance Report Generator**: Creates SOX/GAAP compliance reports

### 4. Input Validation Security Tools  
- **SQL Injection Detector**: Scans for potential SQL injection vulnerabilities
- **XSS Prevention Checker**: Validates output encoding and CSP implementation
- **Input Sanitization Auditor**: Ensures proper input validation patterns
- **File Upload Security Scanner**: Validates secure file handling practices

## Quick Security Audit Commands

```bash
# Run comprehensive security audit
npm run security:audit:full

# Check specific security area
npm run security:audit:isolation    # Cross-tenant isolation
npm run security:audit:permissions  # RBAC and permissions  
npm run security:audit:trails       # Audit trail compliance
npm run security:audit:input        # Input validation security

# Generate security reports
npm run security:report:vulnerabilities
npm run security:report:compliance
npm run security:report:recommendations
```

## Usage Examples

### Database Query Security Scan
```typescript
// tools/security/query-analyzer.ts
export async function auditDatabaseQueries(filePath: string): Promise<SecurityAuditResult> {
  const sourceCode = await readFile(filePath)
  const issues: SecurityIssue[] = []
  
  // Check for queries without organizationId
  const queryPattern = /prisma\.\w+\.find\w*\(\s*{[^}]*where:\s*{[^}]*}/g
  const queries = sourceCode.match(queryPattern) || []
  
  for (const query of queries) {
    if (!query.includes('organizationId')) {
      issues.push({
        type: 'MISSING_ORGANIZATION_FILTER',
        severity: 'CRITICAL',
        location: getLineNumber(sourceCode, query),
        message: 'Database query missing organizationId filter - potential cross-tenant access',
        suggestion: 'Add organizationId to where clause'
      })
    }
  }
  
  return {
    filePath,
    issuesFound: issues.length,
    criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length,
    issues
  }
}
```

### Permission Validation Checker
```typescript
// tools/security/permission-validator.ts
export async function validatePermissions(endpoint: string): Promise<PermissionAuditResult> {
  const endpointCode = await getEndpointCode(endpoint)
  const issues: PermissionIssue[] = []
  
  // Check for permission validation
  const hasPermissionCheck = endpointCode.includes('checkUserPermission') ||
                            endpointCode.includes('PermissionService')
  
  if (!hasPermissionCheck) {
    issues.push({
      type: 'MISSING_PERMISSION_CHECK',
      severity: 'HIGH',
      endpoint,
      message: 'Endpoint missing permission validation',
      requiredPermissions: inferRequiredPermissions(endpoint)
    })
  }
  
  // Check for proper error handling
  const hasSecureErrorHandling = endpointCode.includes('TRPCError') &&
                                !endpointCode.includes('error.message')
  
  if (!hasSecureErrorHandling) {
    issues.push({
      type: 'INSECURE_ERROR_HANDLING',
      severity: 'MEDIUM',
      endpoint,
      message: 'Error handling may leak sensitive information'
    })
  }
  
  return {
    endpoint,
    permissionCompliant: issues.length === 0,
    issues
  }
}
```

### Audit Trail Compliance Scanner
```typescript
// tools/security/audit-trail-scanner.ts
export async function scanAuditTrailCompliance(
  serviceFile: string
): Promise<AuditComplianceResult> {
  const serviceCode = await readFile(serviceFile)
  const issues: AuditIssue[] = []
  
  // Financial operations that require audit trails
  const financialOperations = [
    'taxCalculation',
    'financialReport',
    'clientPayment',
    'billableHours',
    'expenseEntry'
  ]
  
  for (const operation of financialOperations) {
    const operationExists = serviceCode.includes(operation)
    const hasAuditLog = serviceCode.includes(`auditLogger.log`) &&
                       serviceCode.includes(operation)
    
    if (operationExists && !hasAuditLog) {
      issues.push({
        type: 'MISSING_AUDIT_TRAIL',
        severity: 'CRITICAL',
        operation,
        complianceRequirement: 'SOX_SECTION_404',
        message: `Financial operation ${operation} missing audit trail`
      })
    }
  }
  
  return {
    serviceFile,
    compliant: issues.length === 0,
    missingAuditTrails: issues.length,
    issues
  }
}
```

## Automated Security Scanning

### Pre-commit Hook Integration
```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run security audit on staged files
npm run security:audit:staged

# Check for security violations
if [ $? -ne 0 ]; then
  echo "❌ Security audit failed. Please fix issues before committing."
  exit 1
fi

echo "✅ Security audit passed"
```

### CI/CD Pipeline Integration
```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on: [push, pull_request]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Cross-Tenant Isolation Audit
        run: npm run security:audit:isolation
      
      - name: Run Permission System Audit  
        run: npm run security:audit:permissions
      
      - name: Run Audit Trail Compliance Check
        run: npm run security:audit:trails
      
      - name: Generate Security Report
        run: npm run security:report:comprehensive
      
      - name: Upload Security Report
        uses: actions/upload-artifact@v3
        with:
          name: security-audit-report
          path: security-reports/
```

## Security Metrics Dashboard

### Key Security Indicators
- **Cross-Tenant Isolation Score**: Percentage of queries with proper organization filtering
- **Permission Coverage**: Percentage of endpoints with permission validation
- **Audit Trail Compliance**: Percentage of financial operations with audit logs
- **Vulnerability Density**: Security issues per lines of code

### Reporting Templates
```typescript
// tools/security/report-generator.ts
export interface SecurityReport {
  organizationIsolation: {
    score: number
    criticalIssues: number
    recommendations: string[]
  }
  permissionSystem: {
    coverage: number
    missingChecks: EndpointIssue[]
    roleCompliance: boolean
  }
  auditTrailCompliance: {
    compliancePercentage: number
    missingTrails: AuditIssue[]
    regulatoryRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  inputValidation: {
    vulnerabilityCount: number
    securityRating: 'A' | 'B' | 'C' | 'D' | 'F'
    criticalVulnerabilities: Vulnerability[]
  }
}
```

## Emergency Response Tools

### Security Incident Response
```typescript
// tools/security/incident-response.ts
export async function initiateSecurityLockdown(
  organizationId: string,
  incidentType: SecurityIncidentType
): Promise<LockdownResult> {
  // Immediate actions
  await disableOrganizationAccess(organizationId)
  await freezeDataOperations(organizationId)
  await alertSecurityTeam(incidentType, organizationId)
  
  // Audit trail analysis
  const auditAnalysis = await analyzeAuditTrails(organizationId, {
    timeRange: '24h',
    suspiciousActivities: true
  })
  
  // Generate incident report
  return await generateIncidentReport({
    organizationId,
    incidentType,
    timelineAnalysis: auditAnalysis,
    immediateActions: ['access_disabled', 'data_frozen', 'team_alerted'],
    nextSteps: await generateResponsePlan(incidentType)
  })
}
```

### Data Breach Assessment
```typescript
// tools/security/breach-assessment.ts
export async function assessDataBreach(
  suspectedBreach: BreachIndicators
): Promise<BreachAssessment> {
  const affectedOrganizations = await identifyAffectedOrganizations(suspectedBreach)
  const dataExposureAnalysis = await analyzeDataExposure(affectedOrganizations)
  const complianceImplications = await assessComplianceRisk(dataExposureAnalysis)
  
  return {
    severity: calculateBreachSeverity(dataExposureAnalysis),
    affectedOrganizations: affectedOrganizations.length,
    dataTypesExposed: dataExposureAnalysis.exposedDataTypes,
    complianceRisk: complianceImplications,
    recommendedActions: generateBreachResponsePlan(dataExposureAnalysis),
    notificationRequirements: determineNotificationRequirements(complianceImplications)
  }
}
```

## Usage Guidelines

### Daily Security Checks
```bash
# Morning security health check
npm run security:health-check

# Check recent changes for security issues  
npm run security:audit:recent-changes

# Validate configuration security
npm run security:config:validate
```

### Pre-deployment Security Validation
```bash
# Comprehensive pre-deployment audit
npm run security:pre-deployment

# Validate new feature security
npm run security:feature:validate <feature-name>

# Check for security regressions
npm run security:regression:check
```

### Security Training Integration
```bash
# Generate security training materials
npm run security:training:generate

# Create security awareness quiz
npm run security:quiz:create

# Security best practices reference
npm run security:reference:update
```

## Integration with AI Development Tools

These security tools integrate seamlessly with the AI development prompts:

- **security-auditor.md** prompt uses these tools for analysis
- **cpa-developer.md** prompt references security patterns
- **testing-qa-specialist.md** prompt creates security tests
- **development-assistant.md** prompt enforces security guidelines

The tools provide automated analysis while the AI prompts provide expert guidance and implementation assistance.