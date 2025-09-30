# AdvisorOS Development Orchestration Plan

**Total Tasks**: 99 granular tasks across 11 dependency layers
**Estimated Effort**: 234 hours serial / 60-80 hours with parallelization
**Status**: Layer 0 (Security) - IN PROGRESS

---

## Layer 0: Critical Security Fixes (4h) - IN PROGRESS

### L0.1.1: Audit Security Vulnerabilities (1h) ✅ COMPLETED
- **Agent**: security-auditor
- **Status**: COMPLETED
- **Findings**: 6 vulnerabilities (2 CRITICAL, 3 MODERATE, 1 LOW)
  - CVE-2025-7783 (CVSS 9.4) - form-data boundary injection
  - CVE-2023-28155 (CVSS 6.1) - SSRF in request package
  - CVE-2024-7774 - langchain path traversal
  - CVE-2024-7042 - langchain SQL injection
  - CVE-2023-26136 - tough-cookie prototype pollution
- **Output**: Security audit report generated

### L0.1.2: Fix High-Severity Vulnerabilities (2h) 🔄 IN PROGRESS
- **Agent**: security-auditor
- **Files**:
  - `packages/ai-agents/package.json` (upgrade langchain)
  - `packages/integrations/src/quickbooks/security-wrapper.ts` (create)
  - `apps/web/src/server/security/prototype-freeze.ts` (create)
- **Actions**:
  - Upgrade langchain from 0.1.37 to 0.3.35
  - Create SSRF protection wrapper for QuickBooks API
  - Implement prototype freeze
  - Flag node-quickbooks for replacement (no fix available)
- **Dependencies**: L0.1.1

### L0.1.3: Implement organizationId Validation (1h) ⏳ PENDING
- **Agent**: security-auditor
- **Files**:
  - `apps/web/src/server/api/middleware/organization.middleware.ts` (create)
  - All tRPC routers (update)
- **Actions**:
  - Create automated organizationId validation middleware
  - Add to all database queries
  - Create test suite for cross-tenant isolation
- **Dependencies**: L0.1.2

### L0.1.4: Add RBAC Checks (1h) ⏳ PENDING
- **Agent**: security-auditor
- **Files**: `apps/web/src/server/api/middleware/rbac.middleware.ts` (create)
- **Actions**:
  - Implement requireOwner, requireAdmin, requireCPA helpers
  - Add role-based guards to sensitive operations
- **Dependencies**: L0.1.3

### L0.1.5: Implement Audit Logging (1h) ⏳ PENDING
- **Agent**: audit-trail-perfectionist
- **Files**: `apps/web/src/server/services/audit-log.service.ts` (create)
- **Actions**:
  - Create audit log service with SOX compliance
  - Hook into all data modification operations
- **Dependencies**: L0.1.4

---

## Layer 1: Database Foundation (10h) ⏳ PENDING

### L1.1: Create Missing Models (4h)
- **Agent**: database-optimizer
- **Files**: `packages/database/schema.prisma`
- **Actions**:
  - Add TaxReturn, TaxCalculation, TaxForm models
  - Add ClientUser model for portal authentication
  - Add ChartOfAccounts, AccountTransaction models
  - Add AuditLog model for compliance
- **Dependencies**: Layer 0 complete

### L1.2: Add Multi-Tenant Indexes (2h)
- **Agent**: database-optimizer
- **Files**: `packages/database/schema.prisma`
- **Actions**:
  - Create composite indexes on organizationId + frequently queried fields
  - Add covering indexes for common queries
- **Dependencies**: L1.1

### L1.3: Create Database Migrations (1h)
- **Agent**: database-optimizer
- **Actions**: Generate and test Prisma migrations
- **Dependencies**: L1.2

### L1.4: Seed Test Data (1h)
- **Agent**: demo-data-generator
- **Files**: `packages/database/seed/`
- **Actions**: Create realistic CPA test data
- **Dependencies**: L1.3

### L1.5: Database Performance Testing (2h)
- **Agent**: performance-optimization-specialist
- **Actions**: Benchmark queries, validate indexes
- **Dependencies**: L1.4

---

## Layer 2: Service Layer (14h) ⏳ PENDING

### L2.1.1: Create Base Service Class (2h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/services/base.service.ts` (create)
- **Actions**:
  - Implement BaseService<T> abstract class
  - Add organizationId validation
  - Add audit logging hooks
- **Class**: `BaseService<T>`
- **Functions**: `findById()`, `findMany()`, `create()`, `update()`, `delete()`
- **Dependencies**: Layer 1 complete

### L2.1.2: Create Client Service (2h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/services/client.service.ts` (create)
- **Actions**:
  - Extend BaseService<Client>
  - Implement createClient(), updateClient(), getClient(), listClients()
  - Add QuickBooks sync integration
- **Class**: `ClientService`
- **Dependencies**: L2.1.1

### L2.1.3: Create Engagement Service (2h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/services/engagement.service.ts` (create)
- **Actions**: Engagement lifecycle management
- **Class**: `EngagementService`
- **Dependencies**: L2.1.1

### L2.1.4: Create Task Service (2h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/services/task.service.ts` (create)
- **Actions**: Task assignment, status tracking
- **Class**: `TaskService`
- **Dependencies**: L2.1.1

### L2.1.5: Refactor Workflow Service (3h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/services/workflow.service.ts` (update)
- **Actions**:
  - Extend BaseService
  - Implement state machine pattern
  - Add conditional branching logic
- **Dependencies**: L2.1.1

### L2.1.6: Create Tax Calculation Service (3h)
- **Agent**: cpa-tax-compliance
- **Files**: `apps/web/src/server/services/tax-calculation.service.ts` (create)
- **Actions**:
  - Implement IRS tax brackets
  - Add state tax calculations
  - Generate audit trails
- **Class**: `TaxCalculationService`
- **Dependencies**: L2.1.1

---

## Layer 3: API Endpoints (14h) ⏳ PENDING

### L3.1: Create Engagement Router (2h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/api/routers/engagement.router.ts` (create)
- **Actions**: tRPC procedures for engagement management
- **Dependencies**: Layer 2 complete

### L3.2: Create Task Router (2h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/api/routers/task.router.ts` (create)
- **Dependencies**: L2.1.4

### L3.3: Create Tax Router (3h)
- **Agent**: cpa-tax-compliance
- **Files**: `apps/web/src/server/api/routers/tax.router.ts` (create)
- **Dependencies**: L2.1.6

### L3.4: Update Workflow Router (2h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/api/routers/workflow.router.ts` (update)
- **Dependencies**: L2.1.5

### L3.5: Create Client Portal Router (3h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/api/routers/client-portal.router.ts` (create)
- **Actions**: Authentication, document access for clients
- **Dependencies**: Layer 2 complete

### L3.6: Add DataLoader for N+1 Prevention (2h)
- **Agent**: performance-optimization-specialist
- **Files**: `apps/web/src/server/api/utils/dataloader.ts` (create)
- **Dependencies**: Layer 3 routers created

---

## Layer 4: Business Logic (30h) ⏳ PENDING

### L4.1: Tax Calculation Engine (8h)
- **Agent**: cpa-tax-compliance
- **Files**: `apps/web/src/lib/tax/` (create directory)
- **Modules**:
  - `tax-brackets.ts` - IRS/state tax tables
  - `deductions.ts` - Standard/itemized deductions
  - `credits.ts` - Tax credit calculations
  - `estimated-tax.ts` - Quarterly estimates
- **Dependencies**: Layer 3 complete

### L4.2: Financial Statement Generator (6h)
- **Agent**: cpa-tax-compliance
- **Files**: `apps/web/src/lib/financial/` (create)
- **Actions**: Replace Math.random() placeholders with real GAAP logic
- **Dependencies**: Layer 3

### L4.3: Workflow Execution Engine (6h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/lib/workflow/state-machine.ts` (create)
- **Actions**: Implement state machine with conditional branching
- **Dependencies**: Layer 3

### L4.4: Document Classification (4h)
- **Agent**: ai-features-orchestrator
- **Files**: `apps/web/src/lib/ai/document-classifier.ts` (create)
- **Actions**: Azure Form Recognizer integration
- **Dependencies**: Layer 3

### L4.5: OCR Processing Pipeline (4h)
- **Agent**: document-intelligence-optimizer
- **Files**: `apps/web/src/lib/ai/ocr-pipeline.ts` (create)
- **Dependencies**: L4.4

### L4.6: Financial Forecasting (4h)
- **Agent**: financial-prediction-modeler
- **Files**: `apps/web/src/server/services/financial-forecasting.service.ts` (update)
- **Actions**: Replace Math.random() with real statistical models
- **Dependencies**: Layer 3

---

## Layer 5: Frontend Components (44h) ⏳ PENDING

### L5.1: Client Management UI (8h)
- **Agent**: frontend-builder
- **Files**: `apps/web/src/components/clients/` (create)
- **Components**: ClientList, ClientDetails, ClientForm
- **Dependencies**: Layer 3 complete

### L5.2: Engagement Management UI (6h)
- **Agent**: frontend-builder
- **Files**: `apps/web/src/components/engagements/`
- **Components**: EngagementList, EngagementDetails, EngagementForm
- **Dependencies**: L3.1

### L5.3: Task Management UI (6h)
- **Agent**: frontend-builder
- **Files**: `apps/web/src/components/tasks/`
- **Components**: TaskList, TaskBoard (Kanban), TaskDetails
- **Dependencies**: L3.2

### L5.4: Tax Calculation UI (6h)
- **Agent**: frontend-builder
- **Files**: `apps/web/src/components/tax/`
- **Components**: TaxCalculator, TaxReturnForm, TaxSummary
- **Dependencies**: L3.3

### L5.5: Document Upload/Management UI (6h)
- **Agent**: frontend-builder
- **Files**: `apps/web/src/components/documents/`
- **Components**: DocumentUpload, DocumentList, DocumentViewer
- **Dependencies**: Layer 4

### L5.6: Financial Reports Dashboard (6h)
- **Agent**: frontend-builder
- **Files**: `apps/web/src/components/reports/`
- **Components**: FinancialDashboard, ReportBuilder, ChartComponents
- **Dependencies**: Layer 4

### L5.7: Client Portal UI (6h)
- **Agent**: client-portal-designer
- **Files**: `apps/web/src/app/portal/`
- **Pages**: Portal dashboard, document sharing, approvals
- **Dependencies**: L3.5

---

## Layer 6: Integration Layer (22h) ⏳ PENDING

### L6.1: Replace node-quickbooks (8h)
- **Agent**: integration-specialist
- **Files**: `packages/integrations/src/quickbooks/` (refactor)
- **Actions**:
  - Replace request package with axios
  - Implement OAuth2 flow with intuit-oauth
  - Create data mapping layer
- **Dependencies**: Layer 0 complete (security requirement)

### L6.2: QuickBooks Data Persistence (4h)
- **Agent**: integration-specialist
- **Files**: `packages/integrations/src/quickbooks/sync.service.ts` (create)
- **Actions**: Save fetched data to local database
- **Dependencies**: L6.1

### L6.3: Stripe Webhook Handlers (3h)
- **Agent**: integration-specialist
- **Files**: `apps/web/src/app/api/webhooks/stripe.ts` (update)
- **Dependencies**: Layer 2

### L6.4: Email Service Integration (3h)
- **Agent**: integration-specialist
- **Files**: `packages/integrations/src/email/` (complete)
- **Actions**: SendGrid/Azure Communication Services
- **Dependencies**: Layer 2

### L6.5: Azure AI Services Integration (4h)
- **Agent**: ai-features-orchestrator
- **Files**: `packages/integrations/src/azure-ai/` (complete)
- **Actions**: Form Recognizer, Text Analytics, Cognitive Search
- **Dependencies**: Layer 4

---

## Layer 7: Testing (48h) ⏳ PENDING

### L7.1: Unit Tests - Services (10h)
- **Agent**: test-suite-developer
- **Files**: `apps/web/__tests__/services/`
- **Dependencies**: Layer 2 complete

### L7.2: Unit Tests - Business Logic (8h)
- **Agent**: test-suite-developer
- **Files**: `apps/web/__tests__/lib/`
- **Dependencies**: Layer 4

### L7.3: Integration Tests - API (12h)
- **Agent**: test-suite-developer
- **Files**: `apps/web/tests/integration/`
- **Dependencies**: Layer 3

### L7.4: Integration Tests - QuickBooks (4h)
- **Agent**: test-suite-developer
- **Files**: `packages/integrations/__tests__/`
- **Dependencies**: L6.1

### L7.5: E2E Tests - Core Workflows (10h)
- **Agent**: test-suite-developer
- **Files**: `apps/web/tests/e2e/`
- **Dependencies**: Layer 5

### L7.6: Security Tests (4h)
- **Agent**: security-auditor
- **Files**: `apps/web/tests/security/`
- **Actions**: Cross-tenant isolation, RBAC, auth tests
- **Dependencies**: Layer 0

---

## Layer 8: Performance Optimization (20h) ⏳ PENDING

### L8.1: Implement Redis Caching (4h)
- **Agent**: performance-optimization-specialist
- **Files**: `apps/web/src/lib/cache/` (create)
- **Dependencies**: Layer 3 complete

### L8.2: Database Query Optimization (6h)
- **Agent**: database-optimizer
- **Actions**: Analyze slow queries, add indexes, optimize N+1
- **Dependencies**: Layer 7 (need test data)

### L8.3: Frontend Code Splitting (4h)
- **Agent**: frontend-builder
- **Files**: `apps/web/next.config.js` (update)
- **Dependencies**: Layer 5

### L8.4: Migrate to Bull/Redis Queue (4h)
- **Agent**: backend-api-developer
- **Files**: `apps/web/src/server/queue/` (refactor)
- **Actions**: Replace custom queue with Bull
- **Dependencies**: Layer 4

### L8.5: Performance Testing (2h)
- **Agent**: performance-optimization-specialist
- **Files**: `apps/web/tests/performance/`
- **Dependencies**: Layer 7

---

## Layer 9: Audit & Compliance (10h) ⏳ PENDING

### L9.1: SOX Compliance Validation (3h)
- **Agent**: audit-trail-perfectionist
- **Actions**: Verify audit trails meet SOX requirements
- **Dependencies**: Layer 7 complete

### L9.2: GAAP Compliance Review (3h)
- **Agent**: cpa-tax-compliance
- **Actions**: Validate financial reporting standards
- **Dependencies**: L4.2

### L9.3: Multi-Tenant Security Audit (2h)
- **Agent**: security-auditor
- **Actions**: Penetration testing for cross-tenant isolation
- **Dependencies**: L7.6

### L9.4: Data Privacy Compliance (2h)
- **Agent**: compliance-planner
- **Actions**: GDPR/CCPA compliance verification
- **Dependencies**: Layer 7

---

## Layer 10: Monitoring & Observability (10h) ⏳ PENDING

### L10.1: Azure Application Insights (3h)
- **Agent**: devops-azure-specialist
- **Files**: `apps/web/src/lib/monitoring/` (create)
- **Dependencies**: Layer 8 complete

### L10.2: Error Tracking (2h)
- **Agent**: devops-azure-specialist
- **Actions**: Sentry or similar integration
- **Dependencies**: L10.1

### L10.3: Performance Monitoring (2h)
- **Agent**: performance-optimization-specialist
- **Actions**: APM setup, metrics dashboards
- **Dependencies**: L10.1

### L10.4: Security Monitoring (2h)
- **Agent**: security-auditor
- **Actions**: SIEM integration, threat detection
- **Dependencies**: L10.1

### L10.5: Audit Log Monitoring (1h)
- **Agent**: audit-trail-perfectionist
- **Actions**: Compliance dashboard, anomaly detection
- **Dependencies**: L10.1

---

## Layer 11: Documentation (8h) ⏳ PENDING

### L11.1: API Documentation (3h)
- **Agent**: docs-writer
- **Files**: `apps/web/docs/api/` (create)
- **Dependencies**: Layer 3 complete

### L11.2: Architecture Documentation (2h)
- **Agent**: architecture-designer
- **Files**: `docs/architecture/` (create)
- **Dependencies**: Layer 8

### L11.3: User Guides (2h)
- **Agent**: docs-writer
- **Files**: `docs/user-guides/` (create)
- **Dependencies**: Layer 5

### L11.4: Deployment Guide (1h)
- **Agent**: devops-azure-specialist
- **Files**: `docs/deployment.md` (create)
- **Dependencies**: Layer 10

---

## Execution Strategy

**Parallel Execution Opportunities**:
- Layer 2: All service classes can be built in parallel (6 tasks)
- Layer 3: All routers can be built in parallel (6 tasks)
- Layer 5: All UI components can be built in parallel (7 tasks)
- Layer 7: Test suites can be written in parallel (6 tasks)

**Critical Path**:
Layer 0 → Layer 1 → Layer 2 → Layer 3 → Layer 4 → Layer 5 → Production

**Estimated Timeline**:
- Serial execution: 234 hours (29 days @ 8h/day)
- With parallelization: 60-80 hours (8-10 days @ 8h/day with 3-4 developers)

---

## Next Action

**Current Status**: Layer 0, Task L0.1.2 (Fix High-Severity Vulnerabilities) - IN PROGRESS

**Waiting for**: security-auditor agent to complete vulnerability fixes

**After L0.1.2 completes**: Move to L0.1.3 (organizationId Validation)

---

*Last Updated: 2025-09-30*
*Generated by: Claude Orchestrator*