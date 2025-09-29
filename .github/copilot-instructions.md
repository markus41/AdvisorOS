# AdvisorOS - Supercharged AI CPA Platform - Copilot Instructions

This workspace contains a comprehensive CPA Advisory Platform with advanced AI capabilities, built with Next.js 14, TypeScript, and Azure services.

## Project Overview
- **Type**: Multi-tenant SaaS platform for CPAs with supercharged AI copilot
- **Architecture**: Turborepo monorepo with AI-first design
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: API routes, Prisma ORM, PostgreSQL with AI orchestration
- **AI System**: Multi-agent orchestration with advanced reasoning capabilities
- **Authentication**: NextAuth.js with multi-tenant support
- **Integrations**: QuickBooks API, Azure services, MCP protocol
- **Charts**: Tremor UI library

## Supercharged AI Architecture
```
/apps/web/src/lib/ai/
├── /modes               # Context-aware AI operating modes
├── /agents              # Specialized AI agent orchestration
├── /prompts             # Chain-of-thought reasoning prompts
├── /mcp                 # Model Context Protocol integration
├── /workflows           # Automated multi-step AI workflows
└── /supercharged.ts     # Unified AI orchestration system
```

## AI Capabilities

### 🧠 AI Modes (Context-Aware Operation)
- **CPA Professional Mode**: General advisory and client management
- **Tax Season Mode**: Tax prep, compliance, deadline management
- **Audit Mode**: Audit preparation and risk assessment
- **Client Portal Mode**: Client-facing self-service
- **Year-End Mode**: Year-end closing and planning

### 🤖 AI Agents (Specialized Expertise)
- **Senior CPA Advisor**: Primary business advisory agent
- **Tax Specialist**: Expert in tax matters and optimization
- **Client Relationship Manager**: Communication and relationship building
- **Document Analyzer**: Document processing and data extraction
- **Financial Analyst**: Financial data analysis and modeling

### 🧩 Chain-of-Thought Prompts (Advanced Reasoning)
- **Financial Health Analysis**: Comprehensive financial assessment
- **Tax Optimization Strategy**: Strategic tax planning with compliance
- **Business Advisory Consultation**: Strategic business consulting
- **Client Communication**: Professional communication with emotional intelligence

### 🔧 MCP Tools (External Integrations)
- **QuickBooks Integration**: Access financial data and reports
- **Financial Calculator**: Advanced financial calculations and ratios
- **Tax Research**: Current tax laws and compliance requirements
- **Industry Benchmarks**: Comparative industry data
- **Document OCR**: Automated document processing
- **Email Communication**: Professional email automation

### 🔄 AI Workflows (Automated Processes)
- **Client Financial Health Review**: Complete financial assessment
- **Tax Optimization Analysis**: Comprehensive tax planning
- **Document Processing Pipeline**: Automated document analysis
- **Client Onboarding**: Streamlined client setup

## Project Structure
```
/AdvisorOS
├── /apps
│   └── /web
│       ├── /src
│       │   ├── /lib/ai                 # 🚀 Supercharged AI System
│       │   │   ├── /modes              # AI operating modes
│       │   │   ├── /agents             # Agent orchestration
│       │   │   ├── /prompts            # Advanced prompts
│       │   │   ├── /mcp                # Tool integration
│       │   │   ├── /workflows          # Automated workflows
│       │   │   └── supercharged.ts     # Main AI orchestrator
│       │   └── /components/ai          # AI-powered UI components
│       └── Next.js 14 frontend
├── /packages
│   ├── /database (Prisma + PostgreSQL)
│   ├── /ui (Shared components)
│   └── /types (TypeScript types)
├── /.ai                                # AI agent configurations
├── /.claude                            # Claude-specific agents
└── /prompts                            # Additional prompt libraries
```

## Key Features

### Core Platform
- Multi-tenant architecture with organization-based access
- Client management with QuickBooks synchronization
- Document management with OCR capabilities
- Financial advisory tools and dashboards
- Role-based access control (owner, admin, cpa, staff)
- Azure deployment ready

### 🚀 Supercharged AI Features
- **Intelligent Mode Switching**: Automatic context detection and mode switching
- **Multi-Agent Orchestration**: Coordinated agents with handoffs and collaboration
- **Chain-of-Thought Reasoning**: Advanced reasoning with step-by-step analysis
- **Workflow Automation**: Complex multi-step processes with AI decision making
- **Tool Integration**: External API and service integration via MCP protocol
- **Real-time Streaming**: Live AI responses with progress indicators
- **Cost & Performance Tracking**: Token usage, execution time, and cost monitoring

### AI-Powered Components
- **SuperchargedAIAssistant**: Advanced chat interface with mode switching
- **WorkflowExecutor**: Visual workflow execution with progress tracking
- **AgentOrchestrator**: Multi-agent coordination interface
- **PromptStudio**: Chain-of-thought prompt development tools

## Development Guidelines

### General Development
- Use TypeScript strict mode throughout the project
- Follow Next.js 14 App Router conventions
- Implement proper error handling and loading states
- Use Prisma for all database operations
- Follow multi-tenant patterns for data isolation
- Implement proper authentication checks on all routes

### AI Development Guidelines
- **Mode-First Design**: Always consider which AI mode is appropriate
- **Agent Specialization**: Use specific agents for specialized tasks
- **Chain-of-Thought**: Implement structured reasoning for complex analysis
- **Tool Integration**: Leverage MCP tools for external data and computations
- **Workflow Orchestration**: Break complex processes into automated workflows
- **Error Handling**: Implement retry logic and graceful fallbacks
- **Cost Optimization**: Monitor token usage and optimize prompt efficiency
- **Performance**: Use caching and streaming for better user experience

### AI Code Examples

#### Using the Supercharged AI System
```typescript
import { createSuperchargedAI } from '@/lib/ai/supercharged';

const ai = createSuperchargedAI({
  userId: 'user123',
  organizationId: 'org456',
  temporalContext: { season: 'tax', urgency: 'high' }
});

// Process natural language requests
const result = await ai.processRequest(
  "Analyze client financial health and provide recommendations"
);

// Execute specific workflows
const workflowResult = await ai.executeWorkflow(
  'client-financial-health-review',
  { clientId: 'client789', industry: 'manufacturing' }
);
```

#### Using AI Modes
```typescript
import { createAIModeManager, AI_MODES } from '@/lib/ai/modes';

const modeManager = createAIModeManager(context);
modeManager.autoDetectMode(); // Intelligent mode detection
modeManager.switchToMode('tax-season'); // Explicit mode switch
```

#### Using AI Agents
```typescript
import { createAgentOrchestrator } from '@/lib/ai/agents/orchestrator';

const orchestrator = createAgentOrchestrator();
const result = await orchestrator.executeTask(task, currentMode);
```

## Database Models
- Organization: Multi-tenant root entity
- User: Team members with role-based access
- Client: CPA clients with QuickBooks integration
- Document: File management with categorization
- QuickBooksToken: OAuth token storage
- Note: Client communication tracking
- WorkflowExecution: AI workflow tracking and results
- AgentInteraction: Agent conversation and decision history

## AI Configuration Files
- `.ai/agents.json`: AI agent configurations
- `.claude/agents/`: Claude-specific agent definitions
- `apps/web/src/lib/ai/modes/`: AI operating mode definitions
- `apps/web/src/lib/ai/prompts/`: Advanced prompt templates
- `apps/web/src/lib/ai/workflows/`: Workflow definitions

## Usage Patterns

When working on AI features:
1. **Identify the appropriate AI mode** for the context
2. **Select specialized agents** based on task requirements
3. **Use chain-of-thought prompts** for complex reasoning
4. **Integrate MCP tools** for external data and computations
5. **Create workflows** for multi-step automated processes
6. **Monitor performance** and optimize for cost and speed

The AI system is designed to be intelligent, context-aware, and highly capable while maintaining professional standards and cost efficiency.