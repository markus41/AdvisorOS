---
description: Configure Model Context Protocol integrations for enhanced agent capabilities
allowed-tools: [Bash, Read, Write, Edit]
---

# MCP Integration Setup

Configure external service integrations to enhance agent capabilities:

## Target Integration
Setting up MCP for: $ARGUMENTS

## Setup Process:

### 1. PostgreSQL MCP Server
**Purpose**: Direct database access for complex queries and analytics
**Agents**: database-optimizer, architecture-designer, backend-api-developer

```bash
# Install PostgreSQL MCP server
npm install @mcp-postgresql/server

# Configure connection
DATABASE_URL="postgresql://cpa_user:password@localhost:5432/cpa_platform"
```

### 2. Stripe MCP Server
**Purpose**: Payment processing and subscription management
**Agents**: revenue-intelligence-analyst, financial-prediction-modeler

```bash
# Install Stripe MCP server
npm install @mcp-stripe/server

# Configure API keys
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Azure Cognitive Services MCP
**Purpose**: AI-powered document processing and analytics
**Agents**: ai-features-orchestrator, document-intelligence-optimizer

```bash
# Install Azure MCP server
npm install @mcp-azure/cognitive-services

# Configure Azure services
AZURE_COGNITIVE_KEY="..."
AZURE_COGNITIVE_ENDPOINT="https://..."
```

### 4. QuickBooks MCP Server
**Purpose**: Accounting data synchronization and validation
**Agents**: integration-specialist, audit-trail-perfectionist

```bash
# Install QuickBooks MCP server
npm install @mcp-quickbooks/server

# Configure OAuth
QUICKBOOKS_CLIENT_ID="..."
QUICKBOOKS_CLIENT_SECRET="..."
```

## Integration Benefits:

### Enhanced Agent Capabilities:
- **Real-time data access** for live analysis and validation
- **External service automation** for streamlined workflows
- **Cross-platform integration** for comprehensive solutions
- **API-driven intelligence** for data-informed decisions

### Workflow Improvements:
- **Reduced context switching** between services
- **Automated data validation** across systems
- **Real-time compliance checking** with live data
- **Enhanced debugging** with direct service access

## Security Configuration:
- All API keys stored in secure environment variables
- Least privilege access for each MCP server
- Audit logging for all external service interactions
- Rate limiting to prevent API abuse

Let me configure the high-priority MCP integrations for your AdvisorOS platform.