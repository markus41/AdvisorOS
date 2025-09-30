# Intelligent Agent Routing System

**Version**: 1.0.0
**Last Updated**: 2025-09-30
**Purpose**: Automatically route development requests to the most appropriate specialized AI agent

## 🎯 Overview

AdvisorOS has **32 specialized AI agents**. This routing system ensures every request goes to the optimal agent(s) based on task characteristics, keywords, and context.

## 🧠 How Routing Works

### 1. Pattern Matching
Keywords and phrases are analyzed to determine task type:
- **Security keywords** → `security-auditor`
- **Performance keywords** → `performance-optimization-specialist`
- **Tax keywords** → `cpa-tax-compliance`
- **Database keywords** → `database-optimizer`

### 2. Multi-Agent Workflows
Complex tasks may route to multiple agents in sequence:
- **Feature Development** → `backend-api-developer` → `frontend-builder` → `test-suite-developer` → `security-auditor`
- **Security Audit** → `security-auditor` → `audit-trail-perfectionist` → `compliance-planner`

### 3. Context-Aware Routing
Current work context influences routing:
- Working in `.prisma` file → `database-optimizer`
- Working in `components/` → `frontend-builder`
- Working in `server/api/` → `backend-api-developer`

## 📋 Agent Routing Table

### Backend Development

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "API endpoint", "tRPC procedure", "route" | `backend-api-developer` | `security-auditor`, `database-optimizer` |
| "service class", "business logic" | `backend-api-developer` | `test-suite-developer` |
| "authentication", "NextAuth", "session" | `backend-api-developer` | `security-auditor` |
| "Prisma query", "database operation" | `database-optimizer` | `backend-api-developer` |

**Example**:
```
User: "Create API endpoint for client management"
→ Routes to: backend-api-developer
→ Follow-up: security-auditor (for security review)
```

### Frontend Development

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "React component", "UI", "interface" | `frontend-builder` | `user-journey-optimizer` |
| "form", "validation", "input" | `frontend-builder` | `user-journey-optimizer` |
| "animation", "transition", "motion" | `micro-animation-coordinator` | `frontend-builder` |
| "dashboard", "chart", "visualization" | `frontend-builder` | `excel-interface-perfectionist` |
| "responsive", "mobile", "layout" | `frontend-builder` | `user-journey-optimizer` |

**Example**:
```
User: "Build client dashboard with financial charts"
→ Routes to: frontend-builder
→ Supporting: excel-interface-perfectionist (for data grid)
```

### Database & Performance

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "slow query", "optimize database", "index" | `database-optimizer` | `performance-optimization-specialist` |
| "migration", "schema change", "Prisma" | `database-optimizer` | `architecture-designer` |
| "performance issue", "slow loading" | `performance-optimization-specialist` | `database-optimizer`, `frontend-builder` |
| "caching", "Redis", "optimization" | `performance-optimization-specialist` | `database-optimizer` |
| "scalability", "load testing", "capacity" | `performance-optimization-specialist` | `tax-season-optimizer` |

**Example**:
```
User: "This query is slow with 10,000+ clients"
→ Routes to: database-optimizer
→ Follow-up: performance-optimization-specialist (for overall optimization)
```

### Security & Compliance

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "security audit", "vulnerability", "OWASP" | `security-auditor` | `audit-trail-perfectionist` |
| "cross-tenant", "data leak", "organizationId" | `security-auditor` | `database-optimizer` |
| "audit trail", "SOX", "compliance" | `audit-trail-perfectionist` | `security-auditor` |
| "RBAC", "permission", "authorization" | `security-auditor` | `backend-api-developer` |
| "encryption", "secrets", "credentials" | `security-auditor` | `devops-azure-specialist` |

**Example**:
```
User: "Verify multi-tenant isolation in client queries"
→ Routes to: security-auditor
→ Supporting: database-optimizer (for query analysis)
```

### CPA & Tax Domain

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "tax calculation", "IRS", "deduction" | `cpa-tax-compliance` | `audit-trail-perfectionist` |
| "GAAP", "revenue recognition", "ASC 606" | `cpa-tax-compliance` | `audit-trail-perfectionist` |
| "financial statement", "accounting" | `cpa-tax-compliance` | `financial-prediction-modeler` |
| "tax season", "peak load", "capacity" | `tax-season-optimizer` | `performance-optimization-specialist` |
| "client onboarding", "engagement" | `client-success-optimizer` | `backend-api-developer` |

**Example**:
```
User: "Implement quarterly estimated tax calculation"
→ Routes to: cpa-tax-compliance
→ Supporting: audit-trail-perfectionist (for compliance)
```

### Testing & QA

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "test", "unit test", "integration test" | `test-suite-developer` | Relevant domain agent |
| "E2E", "end-to-end", "Playwright" | `test-suite-developer` | `user-journey-optimizer` |
| "coverage", "test strategy" | `test-suite-developer` | `technical-debt-planner` |
| "mock", "stub", "fixture" | `test-suite-developer` | `demo-data-generator` |

**Example**:
```
User: "Generate tests for tax calculation service"
→ Routes to: test-suite-developer
→ Context: cpa-tax-compliance (for domain knowledge)
```

### AI & Document Processing

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "OCR", "Form Recognizer", "document processing" | `document-intelligence-optimizer` | `ai-features-orchestrator` |
| "GPT-4", "OpenAI", "AI insights" | `ai-features-orchestrator` | Domain-specific agent |
| "Azure AI", "Cognitive Services" | `ai-features-orchestrator` | `devops-azure-specialist` |
| "document classification", "extraction" | `document-intelligence-optimizer` | `cpa-tax-compliance` |

**Example**:
```
User: "Process tax documents with Form Recognizer"
→ Routes to: document-intelligence-optimizer
→ Supporting: cpa-tax-compliance (for tax form validation)
```

### DevOps & Infrastructure

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "deployment", "CI/CD", "pipeline" | `devops-azure-specialist` | `security-auditor` |
| "Azure", "infrastructure", "Terraform" | `devops-azure-specialist` | `architecture-designer` |
| "Docker", "container", "Kubernetes" | `devops-azure-specialist` | `performance-optimization-specialist` |
| "monitoring", "Application Insights" | `devops-azure-specialist` | `performance-optimization-specialist` |

**Example**:
```
User: "Set up CI/CD pipeline for production"
→ Routes to: devops-azure-specialist
→ Supporting: security-auditor (for deployment security)
```

### Architecture & Design

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "architecture", "system design", "diagram" | `architecture-designer` | Domain-specific agents |
| "API design", "schema design" | `architecture-designer` | `backend-api-developer` |
| "infrastructure", "scalability" | `architecture-designer` | `performance-optimization-specialist` |
| "technical debt", "refactor" | `technical-debt-planner` | `architecture-designer` |

**Example**:
```
User: "Design architecture for new reporting module"
→ Routes to: architecture-designer
→ Supporting: database-optimizer, frontend-builder
```

### Client & Business Features

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "client portal", "self-service" | `client-portal-designer` | `frontend-builder`, `security-auditor` |
| "client success", "retention", "engagement" | `client-success-optimizer` | `feature-adoption-tracker` |
| "feature adoption", "analytics", "tracking" | `feature-adoption-tracker` | `user-journey-optimizer` |
| "user journey", "UX", "conversion" | `user-journey-optimizer` | `frontend-builder` |
| "workflow", "automation", "efficiency" | `workflow-efficiency-analyzer` | `smart-automation-designer` |

**Example**:
```
User: "Improve client onboarding workflow"
→ Routes to: client-success-optimizer
→ Supporting: user-journey-optimizer, workflow-efficiency-analyzer
```

### Integration & External Services

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "QuickBooks", "Stripe", "integration" | `integration-specialist` | `backend-api-developer` |
| "webhook", "OAuth", "API connection" | `integration-specialist` | `security-auditor` |
| "third-party", "external API" | `integration-specialist` | `backend-api-developer` |

**Example**:
```
User: "Integrate QuickBooks for invoice sync"
→ Routes to: integration-specialist
→ Supporting: backend-api-developer (for API implementation)
```

### Documentation & Knowledge

| Keywords/Patterns | Primary Agent | Supporting Agents |
|-------------------|---------------|-------------------|
| "documentation", "README", "API docs" | `docs-writer` | Domain-specific agent |
| "JSDoc", "comment", "document code" | `docs-writer` | Domain-specific agent |
| "knowledge base", "wiki", "guide" | `documentation-evolution-manager` | `docs-writer` |

**Example**:
```
User: "Document the tax calculation API"
→ Routes to: docs-writer
→ Context: cpa-tax-compliance (for domain accuracy)
```

## 🔄 Multi-Agent Workflows

### Feature Development Pipeline
```
User: "Build client tax document upload feature"

Routing Flow:
1. architecture-designer
   → Design feature architecture and data flow

2. database-optimizer
   → Design database schema with organizationId

3. backend-api-developer
   → Implement API endpoints with validation

4. frontend-builder
   → Create upload UI component

5. document-intelligence-optimizer
   → Add OCR and document classification

6. security-auditor
   → Verify multi-tenant isolation and file security

7. test-suite-developer
   → Generate comprehensive test suite

8. docs-writer
   → Create API and user documentation
```

### Security Audit Workflow
```
User: "Audit the client management module for security"

Routing Flow:
1. security-auditor
   → Comprehensive vulnerability assessment

2. database-optimizer
   → Verify organizationId filtering on all queries

3. audit-trail-perfectionist
   → Ensure compliance with SOX requirements

4. test-suite-developer
   → Generate security test cases
```

### Performance Optimization Workflow
```
User: "Dashboard is loading slowly"

Routing Flow:
1. performance-optimization-specialist
   → Analyze overall performance bottlenecks

2. database-optimizer
   → Optimize database queries and indexes

3. frontend-builder
   → Implement React optimization (memo, lazy loading)

4. test-suite-developer
   → Create performance benchmark tests
```

## 🎯 Context-Based Routing

### By File Type

| File Pattern | Primary Agent |
|--------------|---------------|
| `*.prisma` | `database-optimizer` |
| `*.tsx`, `*.jsx` | `frontend-builder` |
| `*/api/routers/*.ts` | `backend-api-developer` |
| `*/services/*.ts` | `backend-api-developer` |
| `__tests__/**/*.ts` | `test-suite-developer` |
| `*.test.ts`, `*.spec.ts` | `test-suite-developer` |
| `README.md`, `*.md` | `docs-writer` |
| `infrastructure/**/*` | `devops-azure-specialist` |

### By Directory

| Directory | Primary Agent |
|-----------|---------------|
| `apps/web/src/components/` | `frontend-builder` |
| `apps/web/src/server/api/` | `backend-api-developer` |
| `apps/web/src/server/services/` | `backend-api-developer` |
| `packages/database/` | `database-optimizer` |
| `infrastructure/` | `devops-azure-specialist` |
| `apps/web/__tests__/` | `test-suite-developer` |

## 🛠️ How to Use the Routing System

### Automatic Routing (Recommended)

Simply describe what you need, and the system routes automatically:

```bash
# These automatically route to the right agent:

"Add API endpoint for client invoices"
→ backend-api-developer

"Optimize this slow database query"
→ database-optimizer

"Build a dashboard component"
→ frontend-builder

"Audit security of client module"
→ security-auditor

"Calculate quarterly estimated taxes"
→ cpa-tax-compliance
```

### Manual Agent Selection

For specific needs, explicitly request an agent:

```bash
# Use agent name in request
"Use the security-auditor agent to review this code"

# Or use slash command with agent context
/security-scan apps/web/src/server/api/routers/client.ts
```

### Multi-Agent Orchestration

For complex tasks, request orchestrated workflow:

```bash
"Build complete feature for client document upload
with security, testing, and documentation"

→ Automatically orchestrates:
   - architecture-designer
   - backend-api-developer
   - frontend-builder
   - security-auditor
   - test-suite-developer
   - docs-writer
```

## 📊 Routing Decision Matrix

When unsure which agent to use, apply this decision tree:

```
1. Is it about security or vulnerabilities?
   YES → security-auditor
   NO → Continue

2. Is it about performance or optimization?
   YES → performance-optimization-specialist or database-optimizer
   NO → Continue

3. Is it about tax calculations or CPA compliance?
   YES → cpa-tax-compliance
   NO → Continue

4. Is it about database or queries?
   YES → database-optimizer
   NO → Continue

5. Is it about UI or frontend?
   YES → frontend-builder
   NO → Continue

6. Is it about API or backend?
   YES → backend-api-developer
   NO → Continue

7. Is it about testing?
   YES → test-suite-developer
   NO → Continue

8. Is it about documentation?
   YES → docs-writer
   NO → architecture-designer (general design)
```

## 🎓 Routing Best Practices

### 1. Be Specific
```
❌ "I need help with code"
✅ "Optimize this database query for multi-tenant performance"
```

### 2. Include Context
```
❌ "Fix this"
✅ "Fix this cross-tenant data leak in the client API endpoint"
```

### 3. Specify File Type
```
❌ "Review this"
✅ "Review apps/web/src/server/api/routers/client.ts for security"
```

### 4. Request Multi-Agent for Complex Tasks
```
❌ "Build a feature" (vague, might miss steps)
✅ "Build complete feature with backend, frontend, tests, security, and docs"
```

## 🔍 Agent Capability Quick Reference

### Core Development
- **backend-api-developer**: tRPC, API endpoints, services, business logic
- **frontend-builder**: React, UI components, Tailwind, responsive design
- **database-optimizer**: Prisma, queries, indexes, migrations, performance

### Quality & Security
- **security-auditor**: Vulnerabilities, OWASP, multi-tenant security
- **test-suite-developer**: Unit, integration, E2E, security tests
- **audit-trail-perfectionist**: SOX, GAAP, compliance, audit logging

### CPA Domain
- **cpa-tax-compliance**: Tax calculations, IRS regulations, deductions
- **financial-prediction-modeler**: Forecasting, anomaly detection
- **document-intelligence-optimizer**: OCR, document classification

### Infrastructure
- **devops-azure-specialist**: CI/CD, Azure, Docker, Kubernetes
- **architecture-designer**: System design, database schema, API design
- **performance-optimization-specialist**: Caching, scaling, monitoring

### Business Features
- **client-success-optimizer**: Retention, engagement, onboarding
- **feature-adoption-tracker**: Analytics, usage tracking
- **user-journey-optimizer**: UX, conversion optimization

### Specialized
- **integration-specialist**: QuickBooks, Stripe, third-party APIs
- **docs-writer**: Documentation, API docs, JSDoc
- **demo-data-generator**: Test data, fixtures, realistic scenarios

## 📈 Routing Metrics

Track agent routing effectiveness:
- Most routed agents
- Average task completion time by agent
- Multi-agent workflow success rate
- Agent switching frequency (indicates unclear routing)

## 🆘 Troubleshooting

### Wrong Agent Routed?
- Be more specific in your request
- Include relevant keywords from routing table
- Mention file path or directory for context

### Need Multiple Agents?
- Request "complete feature development"
- Specify all aspects (backend, frontend, tests, security, docs)
- Use workflow templates (/feature-development-pipeline)

### Agent Not Available?
- Check agent list: `ls .claude/agents/`
- Verify agent name spelling
- Use general-purpose agent as fallback

---

**Remember**: The routing system learns from your usage patterns. The more specific you are, the better the routing becomes.