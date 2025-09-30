# Security Scan Command

Performs comprehensive security vulnerability assessment on code, configurations, or the entire codebase, with special focus on multi-tenant isolation and CPA compliance requirements.

## Usage

```bash
/security-scan [target]
```

## What This Command Does

1. **Multi-Tenant Security**: Verifies organizationId filtering on all database queries
2. **Authentication & Authorization**: Reviews RBAC implementation and permission checks
3. **Input Validation**: Ensures all user inputs are properly validated with Zod
4. **SQL Injection**: Checks for raw SQL queries and proper parameterization
5. **XSS Prevention**: Validates output encoding and CSP headers
6. **Sensitive Data Exposure**: Identifies hardcoded secrets, API keys, passwords
7. **Audit Trail Compliance**: Ensures proper logging for SOX/GAAP requirements
8. **OWASP Top 10**: Comprehensive check against current vulnerability list

## Security Checks Performed

### Critical Security Patterns
- ✅ **Multi-Tenant Isolation**: Every query includes organizationId
- ✅ **Permission Validation**: RBAC checks on all sensitive operations
- ✅ **Input Sanitization**: Zod schemas for all API inputs
- ✅ **Audit Logging**: Financial operations create audit trails
- ✅ **Secure Sessions**: Proper session management with NextAuth
- ✅ **File Upload Security**: Organization-scoped file storage

### Common Vulnerabilities
- ❌ Cross-tenant data leakage
- ❌ Missing permission checks
- ❌ Hardcoded credentials
- ❌ SQL injection vectors
- ❌ XSS vulnerabilities
- ❌ Insecure file uploads
- ❌ Missing rate limiting

## Arguments

- `$ARGUMENTS`: Optional target path or flags
  - Empty: Quick scan of recent changes
  - File/directory path: Scan specific target
  - `--full`: Complete codebase scan
  - `--critical`: Critical files only
  - `--compliance`: Focus on SOX/GAAP compliance

## Related Commands

- `/analyze-performance` - Performance analysis
- `/compliance-validation` - Full compliance audit
- `/refactor-suggest` - Security-focused refactoring

---

**Powered by security-auditor agent**: Uses the security-auditor agent to perform OWASP Top 10 analysis, multi-tenant security verification, and SOX/GAAP compliance checking for $ARGUMENTS specific to AdvisorOS CPA platform requirements.