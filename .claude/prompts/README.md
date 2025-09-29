# AdvisorOS AI Development Toolkit

This directory contains a comprehensive AI development toolkit specifically designed for the AdvisorOS multi-tenant CPA platform. Each tool and prompt is crafted to maintain security, compliance, and performance standards while enabling efficient development.

## 🎯 Specialized Prompts

### Core Development Prompts
- **`cpa-developer.md`**: Multi-tenant CPA platform development specialist
- **`development-assistant.md`**: General AdvisorOS development guidance
- **`security-auditor.md`**: Multi-tenant security and compliance expert
- **`performance-optimizer.md`**: Database and API performance optimization
- **`azure-ai-specialist.md`**: Azure AI services integration expert
- **`testing-qa-specialist.md`**: Comprehensive testing strategy expert

## 🔧 Tool Categories

### 1. Security & Compliance Tools
```bash
# Multi-tenant security audit
claude --prompt security-auditor "Review this database query for cross-tenant vulnerabilities"

# RBAC validation
claude --prompt security-auditor "Validate the permission system in this endpoint"

# Audit trail compliance
claude --prompt security-auditor "Ensure this financial operation creates proper audit logs"
```

### 2. Performance Optimization Tools
```bash
# Database query optimization
claude --prompt performance-optimizer "Optimize this multi-tenant query for better performance"

# Caching strategy
claude --prompt performance-optimizer "Design a caching strategy for this client data endpoint"

# Load testing guidance
claude --prompt performance-optimizer "Create load tests for this multi-tenant API"
```

### 3. Azure AI Integration Tools
```bash
# Document processing implementation
claude --prompt azure-ai-specialist "Implement Form Recognizer for processing tax documents"

# AI cost optimization
claude --prompt azure-ai-specialist "Optimize token usage for this CPA advisory feature"

# Cognitive Search setup
claude --prompt azure-ai-specialist "Configure search for the CPA knowledge base"
```

### 4. Testing & QA Tools
```bash
# Multi-tenant test creation
claude --prompt testing-qa-specialist "Create comprehensive tests for this client management feature"

# Security test suite
claude --prompt testing-qa-specialist "Generate cross-tenant isolation tests"

# E2E workflow testing
claude --prompt testing-qa-specialist "Create end-to-end tests for the tax calculation workflow"
```

### 5. CPA Workflow Development
```bash
# Tax calculation features
claude --prompt cpa-developer "Implement individual tax calculation with multi-tenant security"

# Client onboarding workflow
claude --prompt cpa-developer "Create a secure client onboarding process"

# Financial analytics
claude --prompt cpa-developer "Build financial analytics with proper data isolation"
```

## 🚀 Quick Start Examples

### Secure Feature Development
```bash
# Create a new CPA feature with all security considerations
claude --prompt cpa-developer "
Create a tax planning feature that:
1. Allows CPAs to create tax planning scenarios for clients
2. Integrates with Azure AI for tax optimization suggestions
3. Maintains strict organization data isolation
4. Creates comprehensive audit trails
5. Includes proper RBAC validation
"
```

### Performance Investigation
```bash
# Diagnose and fix performance issues
claude --prompt performance-optimizer "
Analyze and optimize this client dashboard that:
- Loads slowly with >1000 clients per organization
- Has N+1 query problems in the financial summaries
- Needs better caching for frequently accessed data
- Requires pagination for large datasets
"
```

### Security Review
```bash
# Comprehensive security audit
claude --prompt security-auditor "
Perform a security audit of this client document upload feature:
- Verify organization isolation in file storage
- Check for proper permission validation
- Ensure audit trails for document access
- Validate input sanitization and file type restrictions
"
```

## 🔄 Development Workflow Integration

### 1. Feature Development Process
```bash
# Step 1: Plan with development assistant
claude --prompt development-assistant "Plan the architecture for a client portal feature"

# Step 2: Implement with CPA developer
claude --prompt cpa-developer "Implement the client portal with secure multi-tenant patterns"

# Step 3: Optimize performance
claude --prompt performance-optimizer "Optimize the client portal for scalability"

# Step 4: Security review
claude --prompt security-auditor "Audit the client portal for security vulnerabilities"

# Step 5: Create comprehensive tests
claude --prompt testing-qa-specialist "Create full test suite for the client portal"
```

### 2. Bug Investigation Workflow
```bash
# Step 1: Diagnose with development assistant
claude --prompt development-assistant "Analyze this cross-tenant data access bug"

# Step 2: Fix with security auditor
claude --prompt security-auditor "Implement a fix that prevents cross-tenant access"

# Step 3: Performance check
claude --prompt performance-optimizer "Ensure the security fix doesn't impact performance"

# Step 4: Test the fix
claude --prompt testing-qa-specialist "Create tests to prevent regression of this security bug"
```

### 3. Azure AI Integration Workflow
```bash
# Step 1: Plan integration
claude --prompt azure-ai-specialist "Design document processing with Form Recognizer"

# Step 2: Implement with security
claude --prompt cpa-developer "Implement the document processing with organization isolation"

# Step 3: Optimize costs
claude --prompt azure-ai-specialist "Optimize AI service costs and token usage"

# Step 4: Test integration
claude --prompt testing-qa-specialist "Create integration tests for Azure AI services"
```

## 📋 Best Practices Checklist

### Before Starting Development
- [ ] Choose appropriate prompt for the task type
- [ ] Understand multi-tenant requirements
- [ ] Review security implications
- [ ] Consider performance impact
- [ ] Plan testing strategy

### During Development
- [ ] Follow organization-scoped patterns
- [ ] Implement proper error handling
- [ ] Create audit trails for financial operations
- [ ] Validate permissions for all operations
- [ ] Optimize database queries

### After Development
- [ ] Security audit with security-auditor prompt
- [ ] Performance review with performance-optimizer prompt
- [ ] Comprehensive testing with testing-qa-specialist prompt
- [ ] Code review with development-assistant prompt

## 🎯 Prompt Selection Guide

### Choose `cpa-developer.md` for:
- Building CPA-specific features (tax calculations, client management)
- Implementing multi-tenant business logic
- Creating financial analytics and reporting
- Developing client workflows

### Choose `security-auditor.md` for:
- Security vulnerability assessments
- Cross-tenant isolation validation
- RBAC implementation reviews
- Audit trail compliance checks

### Choose `performance-optimizer.md` for:
- Database query optimization
- API response time improvements
- Caching strategy implementation
- Load testing and scalability

### Choose `azure-ai-specialist.md` for:
- Document processing with Form Recognizer
- AI-powered CPA advisory features
- Cost optimization for AI services
- Cognitive Search implementation

### Choose `testing-qa-specialist.md` for:
- Test suite creation and strategy
- Multi-tenant testing patterns
- Integration and E2E testing
- Security test implementation

### Choose `development-assistant.md` for:
- General development guidance
- Architecture planning
- Code reviews and best practices
- Development workflow questions

## 🔧 Custom Tool Creation

### Creating New Specialized Prompts
```markdown
# New Specialist Template

You are a [SPECIALIST_TYPE] expert specializing in [SPECIFIC_DOMAIN] for the AdvisorOS CPA platform.

## Your Expertise
- Key area 1
- Key area 2
- Key area 3

## Critical Patterns
[Code examples and patterns specific to this domain]

## When to Use This Prompt
[Specific scenarios where this expert should be consulted]

## Security Considerations
[Domain-specific security requirements]
```

### Integration with MCP Servers
The prompts work seamlessly with the existing MCP server ecosystem:
- `mcp-cpa-tools/`: Custom tools for CPA workflows
- `mcp-database-utils/`: Database utilities with multi-tenant awareness
- `mcp-azure-ai/`: Azure AI service integrations
- `mcp-security-audit/`: Security auditing tools

## 📊 Usage Analytics

Track which prompts and patterns are most effective:
- Prompt usage frequency
- Development velocity improvements
- Security issue prevention
- Code quality metrics

## 🆘 Support and Escalation

### For Complex Issues
- Combine multiple prompts for comprehensive analysis
- Use development-assistant for coordination
- Escalate to human experts for regulatory compliance questions

### For Emergency Security Issues
1. Use security-auditor prompt immediately
2. Implement fixes with proper validation
3. Create regression tests with testing-qa-specialist
4. Document lessons learned for future prevention

---

This toolkit ensures consistent, secure, and efficient development of the AdvisorOS platform while maintaining the highest standards of professional CPA software.