# AdvisorOS SuperClaude Framework v2.0 with Zen MCP Integration
## Professional AI-Powered Development for Multi-Tenant CPA Platform

This directory contains a comprehensive SuperClaude Framework integration enhanced with **Zen MCP Server** - providing professional AI development tools specifically tailored for AdvisorOS, a multi-tenant CPA platform.

## 🎯 What's New in v2.0

### Zen MCP Server Integration
- **Professional Development Tools**: Code review, security auditing, debugging, and testing with AI assistance
- **CPA-Specific Workflows**: Tax calculation review, financial compliance auditing, multi-tenant security validation
- **Multi-Model AI Support**: Azure OpenAI, Google Gemini, Anthropic Claude, and local model integration
- **Advanced Context Management**: Large document processing and conversation continuity beyond token limits

### Enhanced CPA Platform Focus
- **Multi-tenant security validation** with automated tenant isolation testing
- **Financial compliance tools** for SOX, GAAP, and regulatory adherence
- **Tax calculation expertise** with IRS regulation compliance validation
- **Azure AI optimization** for Form Recognizer, Text Analytics, OpenAI, and Cognitive Search

## 🏗️ Architecture Overview

SuperClaude v2.0 has been enhanced for AdvisorOS with:
- **Zen MCP Server Integration** - Professional AI development tools with CPA specialization
- **Custom CPA Tools** - tax-calculation-review, financial-compliance-audit, multi-tenant-security-check  
- **Multi-tenant security focus** - Every configuration emphasizes organizationId isolation
- **CPA domain expertise** - Specialized agents for accounting workflows and compliance
- **Azure AI optimization** - Service-specific optimization for CPA platform needs
- **Professional workflows** - Advanced multi-step AI workflows for complex development tasks

## 📁 Enhanced Directory Structure

```
.superclaude/
├── config.json                        # Enhanced SuperClaude configuration with Zen integration
├── ZEN_MCP_INTEGRATION_PLAN.md        # Comprehensive integration plan and roadmap
├── agents/                             # Specialized AI agents (enhanced with Zen tools)
│   ├── cpa-expert.yaml                 # CPA specialist with tax-calculation-review, financial-compliance-audit
│   ├── security-auditor.yaml           # Multi-tenant security with multi-tenant-security-check, secaudit
│   └── azure-architect.yaml            # Azure AI services with analyze, refactor, testgen tools
├── mcp-servers/                        # Custom MCP servers (Zen-integrated)
│   ├── advisoros-context.js            # AdvisorOS context with Zen workflow integration
│   └── tenant-validator.js             # Multi-tenant validation with Zen security tools
└── workflows/                          # PowerShell automation scripts (Zen-enabled)
    ├── install-zen-mcp.ps1             # Zen MCP Server installation and configuration
    ├── superclaude-workflow.ps1        # Main workflow automation with Zen tools
    └── quick-commands.ps1               # Quick diagnostic commands

zen-mcp-server/                         # Zen MCP Server installation
├── server.py                           # Main Zen MCP server
├── tools/                              # Professional AI development tools  
└── .env                                # Azure AI configuration for AdvisorOS

advisoros-zen-tools/                    # Custom CPA-specific Zen tools
├── tax_calculation_review.py           # Multi-step tax calculation validation
├── financial_compliance_audit.py       # SOX compliance and financial regulation validation
└── multi_tenant_security_check.py      # Multi-tenant security audit and isolation testing
```

## 🚀 Quick Start

### Prerequisites
- **Windows 10/11** with PowerShell 5.1+
- **Python 3.10+** (for Zen MCP Server)
- **Node.js 18+** (for MCP servers)
- **Git** for repository management
- **Claude Desktop** or compatible MCP client

### One-Command Setup
```powershell
# Complete SuperClaude + Zen MCP Server integration
.\.superclaude\workflows\install-zen-mcp.ps1

# Or install components individually:
.\.superclaude\workflows\install-zen-mcp.ps1 -InstallZen        # Install Zen MCP Server
.\.superclaude\workflows\install-zen-mcp.ps1 -SetupCPATools    # Setup CPA-specific tools
.\.superclaude\workflows\install-zen-mcp.ps1 -ConfigureAzureAI # Configure Azure AI integration
.\.superclaude\workflows\install-zen-mcp.ps1 -TestIntegration  # Test complete integration

# Legacy SuperClaude workflows (still functional)
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow setup
.\.superclaude\workflows\quick-commands.ps1 -Command "test"
```

## 🔧 Professional Development Tools

### Core Zen MCP Tools (Available in Claude Desktop)
- **`chat`** - AI-powered development collaboration and brainstorming
- **`thinkdeep`** - Extended reasoning for complex CPA problems and architecture decisions  
- **`codereview`** - Professional code review with multi-tenant and CPA context
- **`debug`** - Advanced debugging workflows for tax calculations and financial logic
- **`analyze`** - Intelligent code analysis and architectural assessment
- **`secaudit`** - Comprehensive security audit workflows
- **`testgen`** - Advanced test generation for financial reporting features
- **`refactor`** - Intelligent code refactoring with tenant isolation preservation
- **`docgen`** - Professional documentation generation
- **`tracer`** - Code tracing and dependency mapping
- **`precommit`** - Pre-commit validation workflows

### AdvisorOS CPA-Specific Tools 
- **`tax-calculation-review`** - Multi-step tax calculation validation and IRS compliance checking
- **`financial-compliance-audit`** - SOX compliance validation and financial regulation adherence  
- **`multi-tenant-security-check`** - Comprehensive multi-tenant security audit and isolation testing

## 💼 CPA Development Workflows

### Tax Calculation Development
```bash
# Comprehensive tax calculation review and validation
"Use zen tax-calculation-review to validate this tax bracket implementation for 2024 federal returns"

# Multi-step workflow includes:
# 1. Tax logic analysis and IRS regulation compliance
# 2. Edge case identification and boundary testing
# 3. Performance optimization for multi-tenant scenarios  
# 4. Comprehensive test case generation
```

### Financial Compliance Auditing
```bash
# SOX compliance validation for financial controls
"Run zen financial-compliance-audit on our financial reporting module for SOX compliance"

# Multi-step workflow covers:
# 1. Audit trail completeness and integrity validation
# 2. Internal financial controls testing
# 3. GAAP/IFRS adherence verification
# 4. Multi-tenant compliance isolation checking
```

### Multi-Tenant Security Validation  
```bash
# Comprehensive security audit for organization isolation
"Use zen multi-tenant-security-check to audit our client data access controls"

# Multi-step workflow includes:
# 1. Organization ID filtering validation across all queries
# 2. RBAC hierarchy testing (owner > admin > cpa > staff > client)
# 3. Cross-tenant access prevention testing
# 4. Session security and JWT validation
```

## 🌟 Complete MCP Ecosystem Integration v3.0

### Comprehensive MCP Server Stack
Our enhanced SuperClaude Framework now includes a complete ecosystem of MCP servers:

#### 🔧 Core Development Tools
- **Zen MCP Server** - Professional AI development tools (code review, debug, analyze, testgen)
- **GitHub MCP** - Repository management, CI/CD workflows, and compliance tracking
- **Browser/Puppeteer MCP** - Web automation, testing, and tax portal validation

#### 🛡️ Data & Security Layer  
- **PostgreSQL MCP** - Multi-tenant database operations with organization isolation
- **Gateway MCP** - API gateway management, rate limiting, and tenant routing
- **Azure MCP Bridge** - Form Recognizer, Text Analytics, OpenAI, and Cognitive Search

#### 📚 Knowledge & Memory Management
- **Notion/Confluence MCP** - CPA knowledge base, tax regulations, and documentation
- **Memory Bank MCP** - Persistent context storage for complex CPA projects
- **A-MEM MCP** - Advanced memory management with organization-scoped retention
- **Ref MCP** - Technical documentation and tax code reference lookup

### 🎯 CPA-Specific Workflow Integration

#### Comprehensive Tax Review Workflow
```bash
# Claude CLI command with integrated MCP ecosystem
claude chat --mcp postgresql-mcp,zen-mcp-server,azure-mcp,memory-bank-mcp,ref-mcp

# Multi-step workflow:
# 1. Extract tax logic from PostgreSQL with organization isolation
# 2. Analyze calculation accuracy using Zen tax-calculation-review
# 3. Validate against IRS regulations using Ref MCP
# 4. Store analysis context using Memory Bank MCP
# 5. Generate compliance documentation using Azure Text Analytics
```

#### Multi-Tenant Security Audit Workflow  
```bash
# Complete security validation across all systems
claude chat --mcp postgresql-mcp,zen-mcp-server,github-mcp,gateway-mcp,browser-mcp

# Comprehensive security validation:
# 1. Database query analysis for organizationId filtering
# 2. Repository security validation using GitHub MCP
# 3. API gateway security testing using Gateway MCP
# 4. Multi-tenant security check using Zen tools
# 5. End-to-end security testing using Browser automation
```

#### Financial Compliance Validation Workflow
```bash
# SOX compliance and financial regulation validation
claude chat --mcp postgresql-mcp,zen-mcp-server,azure-mcp,notion-mcp,amem-mcp

# Compliance workflow includes:
# 1. Financial data handling review with audit trail validation
# 2. Compliance analysis using Zen financial-compliance-audit
# 3. Document extraction using Azure Form Recognizer
# 4. Documentation updates using Notion MCP
# 5. Long-term compliance tracking using A-MEM
```

### 1. Install SuperClaude Framework
```powershell
# Install SuperClaude Python package
pip install SuperClaude

# Or using pipx (recommended)
pipx install SuperClaude
```

### 2. Initialize SuperClaude for AdvisorOS
```powershell
# Initialize SuperClaude in AdvisorOS project
SuperClaude install

# Test configuration
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow test
```

### 3. Run Security Audit
```powershell
# Comprehensive multi-tenant security audit
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow security

# Quick security check
.\.superclaude\workflows\quick-commands.ps1
Invoke-QuickSecurityAudit
```

## 🛡️ Critical Multi-Tenant Commands

### Security Validation
```bash
# Tenant isolation audit
superclaude agent security-auditor "/audit:tenant-isolation apps/web/src/server/api/routers/"

# RBAC validation  
superclaude agent security-auditor "/audit:rbac-validation client-management"

# Cross-tenant risk scan
superclaude agent security-auditor "/audit:cross-tenant-prevention"
```

### Code Validation
```bash
# Validate Prisma queries for tenant isolation
superclaude "/sc:prisma-validate packages/database/schema.prisma"

# Check tRPC procedures
superclaude "/sc:tenant-audit apps/web/src/server/api/trpc.ts"
```

## 💼 CPA Domain Commands

### Workflow Analysis
```bash
# Tax preparation workflow optimization
superclaude agent cpa-expert "/cpa:workflow-optimize tax-preparation"

# Compliance audit
superclaude agent cpa-expert "/cpa:compliance-audit client-data-retention SOC2"

# Financial reporting automation
superclaude agent cpa-expert "/cpa:document-analyze financial-statements"
```

### Research and Analysis
```bash  
# Tax regulation research
superclaude agent cpa-expert "/cpa:tax-research Section-199A-deduction 2024"

# Client insights generation
superclaude agent cpa-expert "/cpa:client-insights quarterly-financials Q3-2024"
```

## ⚡ Azure AI Optimization

### Service Optimization
```bash
# Form Recognizer optimization for tax documents
superclaude agent azure-architect "/azure:form-recognizer-optimize tax-forms high-volume"

# Text Analytics for client communications
superclaude agent azure-architect "/azure:text-analytics-insights client-emails sentiment"

# Cognitive Search for tax regulations
superclaude agent azure-architect "/azure:cognitive-search-setup tax-regulations semantic"

# OpenAI workflow optimization  
superclaude agent azure-architect "/azure:openai-workflow cash-flow-forecast high"
```

### Cost Analysis
```bash
# Azure services cost analysis
superclaude agent azure-architect "/azure:cost-analysis all-services monthly"

# Multi-tenant configuration
superclaude agent azure-architect "/azure:multi-tenant-config form-recognizer high"
```

## 🔧 Development Workflows

### Complete Workflows
```powershell
# Full security and performance audit
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow full

# CPA feature development workflow
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow cpa -Path "apps/web/src/server/api/routers/client.ts"

# Azure optimization workflow
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow azure -Verbose
```

### Custom Workflows
```bash
# Security audit workflow
superclaude run workflow security-audit

# CPA feature development
superclaude run workflow cpa-feature-dev

# Performance optimization
superclaude run workflow performance-optimize
```

## 🧪 Testing and Validation

### Configuration Testing
```powershell
# Test all SuperClaude configurations
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow test

# Validate MCP server syntax
node -c .\.superclaude\mcp-servers\advisoros-context.js
node -c .\.superclaude\mcp-servers\tenant-validator.js
```

### Multi-Tenant Testing
```bash
# Generate tenant isolation tests
superclaude agent security-auditor "/audit:generate-tenant-tests client-management"

# Cross-tenant access prevention validation
superclaude run workflow security-audit
```

## 📊 Key Features

### 🔒 Multi-Tenant Security Focus
- **Tenant Isolation Validation** - Every database query checked for organizationId
- **Cross-Tenant Prevention** - Automated testing for data isolation
- **RBAC Enforcement** - 5-tier role hierarchy validation (owner > admin > cpa > staff > client)
- **Permission Service Integration** - Automated permission checks validation

### 💼 CPA Domain Expertise  
- **Tax Preparation Workflows** - Automated tax form processing and optimization
- **Financial Reporting** - GAAP/IFRS compliance and automation
- **Client Management** - CPA firm workflow optimization
- **Regulatory Compliance** - Automated compliance checking and validation

### ⚡ Azure AI Integration
- **Form Recognizer** - Tax document and financial statement processing
- **Text Analytics** - Client communication sentiment and insights  
- **Cognitive Search** - Tax regulation and accounting standard lookup
- **OpenAI** - Financial analysis and report generation

### 🚀 Development Automation
- **PowerShell Workflows** - Windows-optimized development automation
- **Custom MCP Servers** - AdvisorOS-specific context and validation
- **Specialized Agents** - Domain-expert AI assistants
- **Automated Testing** - Multi-tenant security validation

## 🎯 Usage Examples

### Daily Development Workflow
```powershell
# Morning security check
Invoke-QuickSecurityAudit

# Feature development with CPA validation
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow cpa -Path "new-feature/"

# Pre-commit security validation
superclaude agent security-auditor "/audit:tenant-isolation new-feature/"
```

### Tax Season Preparation
```bash
# Optimize tax preparation workflows
superclaude agent cpa-expert "/cpa:workflow-optimize tax-preparation high-automation"

# Azure Form Recognizer optimization for tax documents  
superclaude agent azure-architect "/azure:form-recognizer-optimize tax-forms high-volume"

# Performance optimization for high-load scenarios
superclaude run workflow performance-optimize
```

### Security Audit Workflow
```powershell
# Complete security audit
.\.superclaude\workflows\superclaude-workflow.ps1 -Workflow security

# Generate security test cases
superclaude agent security-auditor "/audit:generate-tenant-tests all-components"

# Cross-tenant risk assessment
superclaude agent security-auditor "/audit:cross-tenant-prevention data-access"
```

## 🔗 Integration with AdvisorOS

This SuperClaude configuration is specifically designed to work with AdvisorOS's:

- **Multi-tenant architecture** with organizationId isolation
- **tRPC v10 API** with organizationProcedure patterns
- **Prisma v5 database** with tenant-scoped queries
- **Azure AI services** integration for CPA workflows
- **Next.js 15** frontend with role-based access control
- **TypeScript** strict mode development patterns

## 📈 Benefits

- **Enhanced Security** - Automated multi-tenant security validation
- **Domain Expertise** - CPA-specific workflow optimization
- **Cost Optimization** - Azure AI service cost and performance tuning
- **Development Speed** - Automated workflows and validation
- **Code Quality** - Consistent multi-tenant patterns enforcement
- **Compliance** - Automated regulatory and security compliance checking

## 🆘 Troubleshooting

### Common Issues

1. **SuperClaude not found**
   ```powershell
   pip install SuperClaude
   # Or
   pipx install SuperClaude
   ```

2. **PowerShell execution policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **MCP server connection issues**
   ```bash
   node -c .\.superclaude\mcp-servers\advisoros-context.js
   ```

4. **Agent configuration validation**
   ```powershell
   .\.superclaude\workflows\superclaude-workflow.ps1 -Workflow test
   ```

---

**🎉 SuperClaude Framework integration for AdvisorOS is now complete and ready to enhance your multi-tenant CPA platform development experience!**