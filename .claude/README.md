# AdvisorOS Claude CLI Integration Guide

## Complete MCP Ecosystem for Professional CPA Development

This configuration enables seamless Claude CLI integration with the complete AdvisorOS MCP ecosystem, providing professional AI-powered development tools specifically designed for multi-tenant CPA platforms.

## Quick Start

```bash
# Navigate to AdvisorOS project
cd C:\Users\MarkusAhling\AdvisorOS

# Start Claude CLI with all MCP servers
claude chat --config .claude\claude_desktop_config.json

# Or use the simplified command (if Claude CLI supports it)
claude chat --mcp all-servers
```

## Available MCP Servers

### Core AdvisorOS Services
- **advisoros-context**: Multi-tenant patterns and CPA workflow context provider
- **tenant-validator**: Multi-tenant query validation and security checks
- **postgresql-mcp**: Multi-tenant PostgreSQL operations with organization isolation

### Professional AI Development
- **zen-mcp-server**: Professional AI development tools for CPA platform development
- **azure-mcp**: Azure AI services integration (Form Recognizer, Text Analytics, OpenAI)
- **memory-bank-mcp**: Persistent context storage for complex CPA projects
- **amem-mcp**: Advanced memory management for CPA workflows

### Development Workflow
- **github-mcp**: GitHub repository management for AdvisorOS development
- **browser-mcp**: Web automation and testing for CPA applications
- **notion-mcp**: CPA knowledge base and documentation management
- **gateway-mcp**: API gateway management for multi-tenant platform
- **ref-mcp**: Technical documentation and tax code reference lookup

## CPA Workflow Examples

### Comprehensive Tax Review Workflow
```bash
claude chat "Review the tax calculation logic in apps/web/src/server/services/tax-calculation.service.ts ensuring multi-tenant isolation and compliance with current tax codes"
```
*Uses: postgresql-mcp, zen-mcp-server, azure-mcp, memory-bank-mcp, ref-mcp*

### Multi-Tenant Security Audit
```bash
claude chat "Perform a comprehensive security audit of the multi-tenant architecture, focusing on organization isolation and RBAC implementation"
```
*Uses: postgresql-mcp, zen-mcp-server, github-mcp, gateway-mcp, browser-mcp*

### Financial Compliance Validation
```bash
claude chat "Validate financial compliance across all CPA modules, ensuring SOX and GAAP adherence with proper audit trails"
```
*Uses: postgresql-mcp, zen-mcp-server, azure-mcp, notion-mcp, amem-mcp*

### CPA Feature Development
```bash
claude chat "Implement a new client onboarding workflow with document OCR processing and automated compliance checks"
```
*Uses: zen-mcp-server, github-mcp, postgresql-mcp, browser-mcp, memory-bank-mcp*

## Environment Configuration

### Required Environment Variables
```bash
# PostgreSQL (AdvisorOS Development Database)
POSTGRES_CONNECTION_STRING=postgresql://user:pass@localhost:5432/advisoros_dev?schema=public

# GitHub (Repository Access)
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here

# Azure AI Services (CPA Workflows)
AZURE_FORM_RECOGNIZER_KEY=your_form_recognizer_key
AZURE_TEXT_ANALYTICS_KEY=your_text_analytics_key
AZURE_OPENAI_KEY=your_openai_key

# Notion (Documentation Management)
NOTION_API_KEY=your_notion_api_key
```

### Python Dependencies
Ensure Python dependencies are installed for custom MCP servers:
```bash
pip install azure-ai-formrecognizer azure-ai-textanalytics azure-openai mcp-python
```

## Advanced Usage

### Context-Aware Development
The MCP ecosystem maintains context across sessions, enabling:
- **Persistent Memory**: Previous conversations and decisions are remembered
- **Tenant-Aware Operations**: All database operations respect organization boundaries
- **CPA-Specific Knowledge**: Tax codes, compliance requirements, and industry patterns

### Workflow Orchestration
Use the built-in workflow orchestration for complex tasks:
```bash
claude chat "Execute the complete CPA onboarding workflow for a new client with document processing and compliance validation"
```

### Security-First Development
All MCP servers enforce AdvisorOS security patterns:
- Multi-tenant data isolation
- Role-based access control (RBAC)
- Organization-scoped operations
- Audit trail generation

## Troubleshooting

### Common Issues
1. **MCP Server Not Found**: Ensure all dependencies are installed and paths are correct
2. **Database Connection**: Verify PostgreSQL is running and connection string is valid
3. **Azure Services**: Check Azure AI service keys and regional availability

### Debug Mode
Enable debug logging for MCP servers:
```bash
export MCP_DEBUG=1
claude chat --debug
```

### Health Check
Test all MCP servers:
```bash
# Run the comprehensive health check
powershell .superclaude/scripts/install-complete-mcp.ps1 -TestOnly
```

## Professional Features

### Custom CPA Tools (via Zen MCP Server)
- **Tax Calculation Review**: Automated tax logic validation
- **Financial Compliance Audit**: SOX/GAAP compliance checking
- **Multi-Tenant Security Check**: Organization isolation validation

### Azure AI Integration
- **Document OCR**: Financial document processing with Form Recognizer
- **Text Analytics**: Client communication sentiment analysis
- **OpenAI Services**: CPA-specific AI assistance and report generation

### Advanced Memory Management
- **A-MEM**: Advanced memory patterns for complex CPA workflows
- **Memory Bank**: Persistent storage of project context and decisions
- **Context Preservation**: Maintains multi-tenant awareness across sessions

## Production Considerations

### Performance Optimization
- MCP servers use connection pooling for database operations
- Azure AI services implement intelligent caching
- Memory management prevents context overflow

### Security Compliance
- All operations logged for audit compliance
- Encryption at rest and in transit
- Role-based access control enforced
- Multi-tenant isolation verified

### Scalability
- Horizontal scaling support for MCP servers
- Load balancing for high-traffic scenarios
- Resource monitoring and alerting

---

**Powered by the Complete AdvisorOS MCP Ecosystem v3.0**  
*Professional AI Development Tools for CPA Platforms*