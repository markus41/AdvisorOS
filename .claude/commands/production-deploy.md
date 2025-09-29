---
description: Production deployment workflow with pre-flight checks, deployment execution, and post-deployment validation
allowed-tools: [Bash, Read, Write, Edit, Task]
---

# Production Deployment Pipeline

Safe, reliable production deployment with comprehensive validation:

## Deployment Target
Deploying to production: $ARGUMENTS

## Pre-Flight Verification:

### 1. Code Quality Gates
Use the technical-debt-planner agent to:
- Analyze technical debt impact
- Verify code quality metrics
- Check dependency security

### 2. Security Audit
Use the security-auditor agent to:
- Run comprehensive security scan
- Validate encryption and secrets management
- Verify compliance requirements

### 3. Performance Validation
Use the performance-optimization-specialist agent to:
- Execute load testing scenarios
- Validate database performance
- Check CDN and caching strategies

### 4. Infrastructure Readiness
Use the devops-azure-specialist agent to:
- Verify Azure resource configuration
- Check monitoring and alerting setup
- Validate backup and disaster recovery

## Deployment Execution:

### 5. Database Migration
Use the database-optimizer agent to:
- Execute schema migrations safely
- Verify data integrity
- Create rollback procedures

### 6. Application Deployment
Use the backend-api-developer agent to:
- Deploy API services with zero downtime
- Verify health checks and endpoints
- Monitor deployment metrics

### 7. Frontend Deployment
Use the frontend-builder agent to:
- Build and optimize frontend assets
- Deploy to CDN with cache invalidation
- Verify UI functionality

## Post-Deployment Validation:

### 8. System Health Check
Use the performance-optimization-specialist agent to:
- Verify all services are operational
- Monitor error rates and response times
- Check external integrations

### 9. User Acceptance Testing
Use the client-success-optimizer agent to:
- Execute critical user journey tests
- Verify client portal functionality
- Monitor user experience metrics

Let me start with the technical-debt-planner agent to assess deployment readiness.