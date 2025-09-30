# Agent Routing Examples

**Version**: 1.0.0
**Last Updated**: 2025-09-30

## 🎯 Real-World Routing Examples

This document shows how the intelligent routing system directs real development requests to the appropriate agents.

## Backend Development

### Example 1: API Endpoint Creation
```
Request: "Create API endpoint for client invoice management"

Routing:
→ Primary Agent: backend-api-developer
→ Supporting: security-auditor, database-optimizer
→ Confidence: 85%
→ Reason: Keywords matched - "api endpoint", "client"

Why This Route:
- API endpoint creation is backend-api-developer's primary specialty
- Security review needed for client data
- Database queries will need optimization
```

### Example 2: Service Layer Refactoring
```
Request: "Refactor tax calculation service class for better maintainability"

Routing:
→ Primary Agent: technical-debt-planner
→ Supporting: cpa-tax-compliance, test-suite-developer
→ Confidence: 75%
→ Reason: Keywords matched - "refactor", "service class"

Why This Route:
- Refactoring is technical-debt-planner's specialty
- Tax domain knowledge from cpa-tax-compliance needed
- Tests must be updated after refactoring
```

## Frontend Development

### Example 3: Dashboard Component
```
Request: "Build financial dashboard with charts and KPI cards"

Routing:
→ Primary Agent: frontend-builder
→ Supporting: excel-interface-perfectionist, user-journey-optimizer
→ Confidence: 90%
→ Reason: Keywords matched - "dashboard", "charts"

Why This Route:
- UI component development is frontend-builder's focus
- Excel-like data grids may be needed
- UX optimization ensures good user experience
```

### Example 4: Form with Validation
```
Request: "Create client onboarding form with multi-step validation"

Routing:
→ Primary Agent: frontend-builder
→ Supporting: user-journey-optimizer, backend-api-developer
→ Confidence: 85%
→ Reason: Keywords matched - "form", "validation"

Why This Route:
- Form creation is frontend work
- Multi-step flows need UX optimization
- Backend validation will be needed
```

## Security & Compliance

### Example 5: Cross-Tenant Security Issue
```
Request: "Fix cross-tenant data leak in client query - organizationId missing"

Routing:
→ Primary Agent: security-auditor
→ Supporting: database-optimizer, audit-trail-perfectionist
→ Confidence: 95%
→ Reason: Keywords matched - "cross-tenant", "data leak", "organizationId"

Why This Route:
- Security vulnerability requires security-auditor
- Database query fix needs database-optimizer
- Compliance logging may be needed
```

### Example 6: Audit Trail Implementation
```
Request: "Add audit trail logging for tax calculation modifications"

Routing:
→ Primary Agent: audit-trail-perfectionist
→ Supporting: cpa-tax-compliance, backend-api-developer
→ Confidence: 90%
→ Reason: Keywords matched - "audit trail", "tax calculation"

Why This Route:
- Audit trails are audit-trail-perfectionist's specialty
- Tax compliance knowledge needed
- Implementation requires backend work
```

## Database & Performance

### Example 7: Slow Query Optimization
```
Request: "This client list query is slow with 10,000+ records"

Routing:
→ Primary Agent: database-optimizer
→ Supporting: performance-optimization-specialist
→ Confidence: 85%
→ Reason: Keywords matched - "slow", "query", file context: service file

Why This Route:
- Database query optimization is core specialty
- Overall performance review may be needed
- Load testing will verify improvements
```

### Example 8: Schema Migration
```
Request: "Add industry field to Client model with migration"

Routing:
→ Primary Agent: database-optimizer
→ Supporting: backend-api-developer, test-suite-developer
→ Confidence: 80%
→ Reason: Keywords matched - "field", "model", "migration", file: schema.prisma

Why This Route:
- Prisma schema changes are database-optimizer's domain
- API updates needed for new field
- Tests must cover new field
```

## CPA & Tax Domain

### Example 9: Tax Calculation Feature
```
Request: "Implement quarterly estimated tax calculator for sole proprietors"

Routing:
→ Primary Agent: cpa-tax-compliance
→ Supporting: audit-trail-perfectionist, backend-api-developer
→ Confidence: 90%
→ Reason: Keywords matched - "tax calculator", "quarterly estimated tax"

Why This Route:
- Tax calculations require CPA expertise
- Audit trails mandatory for financial calculations
- Implementation needs backend development
```

### Example 10: GAAP Compliance
```
Request: "Ensure revenue recognition follows ASC 606 standards"

Routing:
→ Primary Agent: cpa-tax-compliance
→ Supporting: audit-trail-perfectionist, database-optimizer
→ Confidence: 85%
→ Reason: Keywords matched - "gaap", "revenue recognition", "asc 606"

Why This Route:
- GAAP standards require CPA knowledge
- Compliance logging essential
- Database schema may need updates
```

## AI & Document Processing

### Example 11: Document OCR
```
Request: "Process tax documents with Form Recognizer OCR"

Routing:
→ Primary Agent: document-intelligence-optimizer
→ Supporting: ai-features-orchestrator, cpa-tax-compliance
→ Confidence: 90%
→ Reason: Keywords matched - "process", "documents", "form recognizer", "ocr"

Why This Route:
- Document processing is specialized domain
- Azure AI integration needed
- Tax document knowledge required
```

### Example 12: AI Insights
```
Request: "Generate AI-powered financial insights from client data"

Routing:
→ Primary Agent: ai-features-orchestrator
→ Supporting: financial-prediction-modeler, cpa-tax-compliance
→ Confidence: 85%
→ Reason: Keywords matched - "ai-powered", "insights", "financial"

Why This Route:
- AI feature development is core specialty
- Financial modeling for predictions
- CPA knowledge for accurate insights
```

## Multi-Agent Workflows

### Example 13: Complete Feature Development
```
Request: "Build complete client portal with document upload, OCR processing, and dashboard"

Routing:
→ Type: Multi-Agent Workflow
→ Workflow: feature-development
→ Agents:
   1. architecture-designer (overall design)
   2. database-optimizer (schema design)
   3. backend-api-developer (API implementation)
   4. frontend-builder (portal UI)
   5. document-intelligence-optimizer (OCR processing)
   6. security-auditor (security review)
   7. test-suite-developer (comprehensive tests)
   8. docs-writer (documentation)
→ Confidence: 95%

Why This Route:
- "Complete feature" triggers multi-agent workflow
- Requires coordination across multiple domains
- Each agent handles their specialty in sequence
```

### Example 14: Security Audit Workflow
```
Request: "Perform comprehensive security audit of authentication system"

Routing:
→ Type: Multi-Agent Workflow
→ Workflow: security-audit
→ Agents:
   1. security-auditor (vulnerability assessment)
   2. database-optimizer (query security verification)
   3. audit-trail-perfectionist (compliance check)
   4. test-suite-developer (security test generation)
→ Confidence: 95%

Why This Route:
- "Comprehensive security audit" triggers workflow
- Multiple security aspects need coordination
- Systematic approach ensures nothing missed
```

## Testing & QA

### Example 15: Test Generation
```
Request: "Generate comprehensive tests for client management API"

Routing:
→ Primary Agent: test-suite-developer
→ Supporting: backend-api-developer, security-auditor
→ Confidence: 90%
→ Reason: Keywords matched - "generate", "tests", "api"

Why This Route:
- Test generation is test-suite-developer's specialty
- API knowledge needed for accurate tests
- Security tests should be included
```

### Example 16: E2E Testing
```
Request: "Create end-to-end test for client onboarding workflow"

Routing:
→ Primary Agent: test-suite-developer
→ Supporting: user-journey-optimizer, client-success-optimizer
→ Confidence: 85%
→ Reason: Keywords matched - "end-to-end", "test", "workflow"

Why This Route:
- E2E tests are specialty area
- User journey knowledge helps
- Client onboarding expertise valuable
```

## DevOps & Infrastructure

### Example 17: CI/CD Pipeline
```
Request: "Set up GitHub Actions pipeline for production deployment"

Routing:
→ Primary Agent: devops-azure-specialist
→ Supporting: security-auditor, performance-optimization-specialist
→ Confidence: 90%
→ Reason: Keywords matched - "pipeline", "deployment", "github actions"

Why This Route:
- CI/CD is DevOps specialty
- Security checks in pipeline needed
- Performance validation pre-deployment
```

### Example 18: Azure Infrastructure
```
Request: "Configure Azure App Service with auto-scaling for tax season"

Routing:
→ Primary Agent: devops-azure-specialist
→ Supporting: tax-season-optimizer, performance-optimization-specialist
→ Confidence: 85%
→ Reason: Keywords matched - "azure", "auto-scaling", "tax season"

Why This Route:
- Azure infrastructure is DevOps domain
- Tax season capacity planning needed
- Performance optimization ensures scaling works
```

## Context-Based Routing

### Example 19: File Context - Prisma Schema
```
Request: "Review this code for issues"
File: packages/database/prisma/schema.prisma

Routing:
→ Primary Agent: database-optimizer
→ Confidence: 80%
→ Reason: File context - .prisma extension

Why This Route:
- File extension indicates database schema
- Even vague request routes correctly with context
- database-optimizer is expert in Prisma
```

### Example 20: File Context - React Component
```
Request: "Optimize this"
File: apps/web/src/components/Dashboard.tsx

Routing:
→ Primary Agent: frontend-builder
→ Supporting: performance-optimization-specialist
→ Confidence: 75%
→ Reason: File context - component directory + .tsx

Why This Route:
- Component directory indicates frontend
- Frontend optimization is specialty
- Performance specialist supports
```

## Edge Cases & Ambiguous Requests

### Example 21: Vague Request with No Context
```
Request: "Help me with this"

Routing:
→ Primary Agent: architecture-designer (fallback)
→ Confidence: 30%
→ Reason: No keywords matched - using fallback

Suggestion:
Be more specific:
- "Help me optimize this database query"
- "Help me build this React component"
- "Help me fix this security issue"
```

### Example 22: Multiple Domain Request
```
Request: "Performance and security issues in client dashboard"

Routing:
→ Primary Agent: performance-optimization-specialist
→ Supporting: security-auditor, frontend-builder
→ Confidence: 70%
→ Reason: Multiple keywords matched - priority to performance

Why This Route:
- Both performance and security keywords present
- Performance has higher priority in this context
- Security auditor included as support
- Frontend builder for dashboard specifics
```

## Command-Line Usage

### Check Routing for Request
```bash
cd .claude/lib
node agent-selector.js select "Create API endpoint for clients"
```

### Get Agent Capabilities
```bash
node agent-selector.js capabilities backend-api-developer
```

### List All Agents
```bash
node agent-selector.js list
```

### Run Routing Tests
```bash
node agent-selector.js test
```

## Tips for Better Routing

### ✅ Good Requests (Specific)
- "Optimize slow database query in client service"
- "Build React form with validation"
- "Fix cross-tenant data leak in API"
- "Generate tests for tax calculation"
- "Set up CI/CD pipeline with security checks"

### ❌ Poor Requests (Vague)
- "Fix this"
- "Help"
- "Review code"
- "Optimize"
- "Make it better"

### 💡 Include Context
- Mention file paths when relevant
- Specify technology (React, Prisma, tRPC)
- Include domain (tax, security, performance)
- Describe desired outcome

### 🎯 Request Multi-Agent for Complex Tasks
- "Build complete feature with..."
- "Comprehensive audit of..."
- "End-to-end development for..."
- "Full security review with..."

## Routing Accuracy

**Test Results**: 6/7 (86% accuracy)

**Most Accurate Routes**:
- Security (95% confidence)
- Tax/CPA (90% confidence)
- Testing (90% confidence)
- DevOps (90% confidence)

**Improving Accuracy**:
- Add relevant keywords from routing table
- Include file paths for context
- Be specific about desired outcome
- Mention technology stack elements

---

**The routing system continuously improves based on usage patterns. More specific requests lead to better routing accuracy.**