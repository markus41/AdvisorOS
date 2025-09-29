# AdvisorOS Agentic Capabilities Usage Guide

## Quick Start

Your AdvisorOS project now has advanced Claude Code agentic capabilities configured. Here's how to use them:

## 🚀 Essential Commands

### Tax Season Preparation
```bash
/tax-season-prep Q1-2024
```
Orchestrates capacity planning, system optimization, and compliance verification.

### Client Onboarding
```bash
/client-onboarding "Acme Corp, john@acme.com"
```
Automates complete client setup including database, integrations, and portal.

### Feature Deployment
```bash
/feature-rollout "Document AI Enhancement v2.1"
```
Manages testing, security audit, performance optimization, and rollout.

### Production Deployment
```bash
/production-deploy "Release v1.2.0"
```
Executes safe production deployment with comprehensive validation.

### CPA Workflow Chain
```bash
/cpa-workflow-chain "Monthly Financial Package - Client XYZ"
```
Processes documents through OCR → Validation → Tax Analysis → Audit Trail.

## 🤖 Specialized Agents

Your project includes 32 specialized agents. Key examples:

- **cpa-tax-compliance**: Tax calculations, GAAP compliance, financial analysis
- **workflow-efficiency-analyzer**: Process optimization, bottleneck identification
- **document-intelligence-optimizer**: OCR processing, document classification
- **financial-prediction-modeler**: Forecasting, anomaly detection, risk assessment
- **audit-trail-perfectionist**: Compliance verification, forensic accounting
- **client-success-optimizer**: Engagement analysis, retention strategies

## 🔗 Agent Chaining

### Workflow Templates Available:
- `cpa-document-processing`: Document → AI Analysis → Tax Compliance → Audit
- `client-onboarding-complete`: Setup → Integrations → Portal → Security → Welcome
- `tax-season-readiness`: Capacity → Performance → Workflows → Compliance → Testing
- `feature-deployment-pipeline`: Testing → Security → Performance → Adoption → Deploy
- `ai-workflow-optimization`: Automation → AI Integration → Redesign → UX → Tracking

### Initialize Workflow Chain:
```bash
node .claude/hooks/subagentStop.js init cpa-document-processing
```

## 🛡️ Quality Control Hooks

Automatic enforcement of:
- **Pre-execution**: Security guardrails, dangerous operation blocking
- **Post-execution**: Code quality (ESLint, Prettier, TypeScript), auto-fixes
- **Agent chaining**: Deterministic workflow progression with approval gates

## 🔧 MCP Integrations (Optional)

Enhance agents with real-time external data:

### High Priority:
- **PostgreSQL**: Direct database access for complex queries
- **Stripe**: Payment processing and subscription management
- **Azure Cognitive**: AI services for document processing

### Setup:
```bash
/mcp-setup postgresql
```

## 📊 Project Memory System

- **CLAUDE.md**: Persistent project context and architecture knowledge
- **Agent Registry**: 32 specialized agents with domain expertise
- **Workflow Templates**: Pre-defined multi-agent processes
- **Quality Hooks**: Automated code quality and security enforcement

## 🔄 Typical Usage Patterns

### Daily Development:
1. Use specialized agents for focused tasks
2. Quality hooks automatically enforce standards
3. Agents remember project context via CLAUDE.md

### Complex Workflows:
1. Use slash commands for orchestrated processes
2. Agent chains handle multi-step automation
3. Human approval gates maintain control

### Production Operations:
1. Use deployment pipeline commands
2. Security and performance validation
3. Automated monitoring and rollback capabilities

## 🎯 Best Practices

1. **Start Simple**: Use individual agents before complex chains
2. **Monitor Workflows**: Review agent suggestions before execution
3. **Maintain Context**: Update CLAUDE.md as project evolves
4. **Security First**: Hooks prevent dangerous operations automatically
5. **Quality Gates**: Let automation enforce coding standards

## 🚨 Safety Features

- **Dangerous pattern blocking**: Prevents destructive operations
- **Critical file protection**: Approval required for sensitive changes
- **Quality enforcement**: Code must pass standards before proceeding
- **Audit logging**: All tool executions tracked
- **Human-in-the-loop**: Agent suggestions require approval

Your AdvisorOS platform is now equipped with enterprise-grade agentic capabilities that will dramatically improve development velocity while maintaining quality and security standards.