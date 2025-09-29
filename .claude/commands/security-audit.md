---
description: Comprehensive multi-tenant security audit with cross-tenant isolation testing and vulnerability assessment
allowed-tools: [Bash, Read, Write, Edit, Task, Grep, Glob]
---

# Multi-Tenant Security Audit Workflow

Execute comprehensive security audit focusing on multi-tenant isolation and CPA data protection:

## Phase 1: Cross-Tenant Isolation Analysis
Use the security-auditor agent to analyze database queries, API endpoints, and data access patterns for proper organizationId filtering.

## Phase 2: Authentication & Authorization Testing
Use the security-auditor agent to validate JWT implementation, session management, and role-based access controls (Owner > Admin > CPA > Staff).

## Phase 3: Data Encryption Verification
Use the audit-trail-perfectionist agent to verify encryption at rest and in transit for sensitive financial data.

## Phase 4: API Security Assessment
Use the backend-api-developer agent to analyze tRPC procedures for input validation, rate limiting, and security middleware.

## Phase 5: Compliance Verification
Use the compliance-planner agent to verify SOX, GAAP, and regulatory compliance requirements.

## Execution Plan:
```
Initiating security audit for: $ARGUMENTS

1. Analyzing cross-tenant data isolation
2. Testing authentication and authorization systems
3. Verifying data encryption and security controls
4. Assessing API security and input validation
5. Checking compliance and audit trail integrity
6. Generating security report with recommendations
```

## Security Test Areas:
- **Database Security**: organizationId filtering, query isolation, data leakage prevention
- **API Security**: Input validation, rate limiting, authentication enforcement
- **Session Security**: JWT validation, token expiration, session management
- **Data Encryption**: PII encryption, financial data protection, transmission security
- **Audit Logging**: Comprehensive audit trails, SOX compliance, forensic capabilities

Let me start by using the security-auditor agent to analyze the multi-tenant security architecture.