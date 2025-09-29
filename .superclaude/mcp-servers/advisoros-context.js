const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const fs = require("fs").promises;
const path = require("path");

/**
 * AdvisorOS Context MCP Server
 * Provides context-aware assistance for AdvisorOS multi-tenant CPA platform
 */
class AdvisorOSContextServer {
  constructor() {
    this.server = new Server(
      {
        name: "advisoros-context",
        version: "1.0.0",
        description: "AdvisorOS multi-tenant patterns and CPA workflow context provider"
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // Multi-tenant pattern validation and lookup
    this.server.setRequestHandler("tools/call", async (request) => {
      switch (request.params.name) {
        case "validate_tenant_query":
          return this.validateTenantQuery(request.params.arguments?.code);
        case "lookup_rbac_pattern":
          return this.lookupRBACPattern(request.params.arguments?.role);
        case "cpa_workflow_guide":
          return this.cpaWorkflowGuide(request.params.arguments?.workflow);
        case "azure_ai_optimization":
          return this.azureAIOptimization(request.params.arguments?.service);
        case "prisma_schema_validate":
          return this.prismaSchemaValidate(request.params.arguments?.model);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });

    // List available tools
    this.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [
          {
            name: "validate_tenant_query",
            description: "Validate database query for proper tenant isolation",
            inputSchema: {
              type: "object",
              properties: {
                code: { type: "string", description: "Code snippet to validate for organizationId filtering" }
              },
              required: ["code"]
            }
          },
          {
            name: "lookup_rbac_pattern", 
            description: "Look up RBAC patterns for AdvisorOS role hierarchy",
            inputSchema: {
              type: "object",
              properties: {
                role: { type: "string", description: "Role level (owner, admin, cpa, staff, client)" }
              },
              required: ["role"]
            }
          },
          {
            name: "cpa_workflow_guide",
            description: "Provide CPA workflow guidance and automation opportunities",
            inputSchema: {
              type: "object",
              properties: {
                workflow: { type: "string", description: "CPA workflow type (tax-prep, financial-reporting, etc.)" }
              },
              required: ["workflow"]
            }
          },
          {
            name: "azure_ai_optimization",
            description: "Azure AI service optimization recommendations for CPA workflows",
            inputSchema: {
              type: "object",
              properties: {
                service: { type: "string", description: "Azure service (form-recognizer, text-analytics, etc.)" }
              },
              required: ["service"]
            }
          },
          {
            name: "prisma_schema_validate",
            description: "Validate Prisma model for multi-tenant compliance",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Prisma model definition to validate" }
              },
              required: ["model"]
            }
          }
        ]
      };
    });
  }

  async validateTenantQuery(code) {
    const validation = {
      valid: false,
      issues: [],
      suggestions: [],
      patterns: {}
    };

    // Check for organizationId in queries
    const hasOrganizationId = code.includes('organizationId');
    const hasOrganizationProcedure = code.includes('organizationProcedure');
    const hasWhereClause = code.includes('where');
    const hasCtxOrganizationId = code.includes('ctx.organizationId');

    // Validation logic
    if (hasOrganizationProcedure) {
      validation.valid = true;
      validation.patterns.procedure = "Uses organizationProcedure - good!";
    } else if (hasOrganizationId && hasWhereClause && hasCtxOrganizationId) {
      validation.valid = true;
      validation.patterns.filtering = "Includes organizationId in where clause - good!";
    } else {
      validation.valid = false;
    }

    // Identify issues
    if (!hasOrganizationId) {
      validation.issues.push("Missing organizationId - potential cross-tenant access");
      validation.suggestions.push("Add organizationId to where clause or use organizationProcedure");
    }

    if (code.includes('findMany({})') || code.includes('findFirst({})')) {
      validation.issues.push("Empty where clause allows cross-tenant data access");
      validation.suggestions.push("Add: where: { organizationId: ctx.organizationId }");
    }

    if (code.includes('publicProcedure') && !code.includes('organizationProcedure')) {
      validation.issues.push("Using publicProcedure for potentially sensitive data");
      validation.suggestions.push("Consider organizationProcedure for tenant-scoped data");
    }

    // Provide examples
    const examples = {
      good: [
        "ctx.prisma.client.findMany({ where: { organizationId: ctx.organizationId } })",
        "organizationProcedure.query(({ ctx }) => { ... })",
        "ctx.prisma.invoice.create({ data: { ...data, organizationId: ctx.organizationId } })"
      ],
      bad: [
        "ctx.prisma.client.findMany({})",
        "ctx.prisma.user.findFirst({ where: { email } })",
        "publicProcedure.query(() => { sensitive_data })"
      ]
    };

    validation.examples = examples;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(validation, null, 2)
        }
      ]
    };
  }

  async lookupRBACPattern(role) {
    const rbacHierarchy = {
      owner: {
        level: 5,
        permissions: ["full-admin", "organization-settings", "user-management", "billing", "all-client-data"],
        description: "Full administrative access to organization",
        can_access: ["admin", "cpa", "staff", "client"],
        implementation: "await PermissionService.checkUserPermission(userId, organizationId, 'admin:full')"
      },
      admin: {
        level: 4, 
        permissions: ["user-management", "system-settings", "all-client-data", "reporting"],
        description: "Administrative access with user management",
        can_access: ["cpa", "staff", "client"],
        implementation: "await PermissionService.checkUserPermission(userId, organizationId, 'admin:manage')"
      },
      cpa: {
        level: 3,
        permissions: ["client-management", "tax-preparation", "financial-reporting", "document-access"],
        description: "Professional CPA with client access",
        can_access: ["staff", "client"],
        implementation: "await PermissionService.checkUserPermission(userId, organizationId, 'cpa:practice')"
      },
      staff: {
        level: 2,
        permissions: ["assigned-clients", "data-entry", "document-upload", "basic-reporting"],
        description: "Staff member with limited client access",
        can_access: ["client"],
        implementation: "await PermissionService.checkUserPermission(userId, organizationId, 'staff:work')"
      },
      client: {
        level: 1,
        permissions: ["own-data", "document-upload", "communication", "portal-access"],
        description: "Client with access to their own data only",
        can_access: [],
        implementation: "await PermissionService.checkUserPermission(userId, organizationId, 'client:self')"
      }
    };

    const roleData = rbacHierarchy[role] || rbacHierarchy;
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            hierarchy: "owner > admin > cpa > staff > client",
            service_file: "apps/web/src/server/services/permission.service.ts",
            role_details: roleData,
            usage_pattern: "Always check permissions before sensitive operations",
            multi_tenant: "All permission checks include organizationId validation"
          }, null, 2)
        }
      ]
    };
  }

  async cpaWorkflowGuide(workflow) {
    const workflows = {
      "tax-preparation": {
        description: "Individual and business tax return preparation",
        phases: [
          "Client data gathering and intake",
          "Document collection and organization", 
          "Tax calculation and optimization",
          "Review and quality control",
          "Client review and approval",
          "E-filing and documentation"
        ],
        automation_opportunities: {
          "document_processing": "Azure Form Recognizer for tax forms (1040, 1120, W2, 1099)",
          "data_extraction": "Automated extraction of financial data from statements",
          "tax_calculations": "OpenAI assistance for complex tax scenarios",
          "compliance_checks": "Automated validation against current tax codes"
        },
        multi_tenant_considerations: [
          "Client data isolated by organizationId",
          "CPA firm-specific tax strategies and preferences",
          "State-specific requirements per organization location",
          "Custom workflows per CPA firm business model"
        ]
      },
      "financial-reporting": {
        description: "Financial statement preparation and analysis",
        phases: [
          "Trial balance import and validation",
          "Adjusting entries and corrections",
          "Financial statement generation",
          "Ratio analysis and benchmarking",
          "Management reporting and insights",
          "Audit trail and documentation"
        ],
        automation_opportunities: {
          "data_import": "Automated QuickBooks sync and reconciliation",
          "ratio_analysis": "AI-powered financial ratio interpretation",
          "report_generation": "Automated report formatting and distribution",
          "anomaly_detection": "AI identification of unusual transactions"
        },
        compliance_standards: ["GAAP", "IFRS", "Industry-specific regulations"]
      },
      "client-onboarding": {
        description: "New client engagement and setup process",
        phases: [
          "Initial consultation and needs assessment",
          "Engagement letter and service agreement",
          "Client data collection and verification",
          "System setup and access provisioning",
          "Process documentation and training",
          "First engagement deliverable"
        ],
        automation_opportunities: {
          "document_processing": "Automated intake form processing",
          "compliance_checks": "Background checks and verification",
          "system_setup": "Automated user provisioning and access",
          "communication": "Automated welcome sequences and training"
        }
      }
    };

    const workflowData = workflows[workflow] || {
      available_workflows: Object.keys(workflows),
      description: "Select a specific workflow for detailed guidance"
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            workflow: workflow,
            details: workflowData,
            azure_integration: "All workflows leverage Azure AI for automation",
            tenant_isolation: "All client data operations include organizationId filtering"
          }, null, 2)
        }
      ]
    };
  }

  async azureAIOptimization(service) {
    const optimizations = {
      "form-recognizer": {
        service: "@azure/ai-form-recognizer",
        cpa_use_cases: [
          "Tax form processing (1040, 1120, 1065, W2, 1099)",
          "Financial statement data extraction",
          "Bank statement reconciliation",
          "Invoice and receipt processing"
        ],
        optimization_strategies: [
          "Batch processing during off-peak hours",
          "Custom models for CPA firm specific forms", 
          "Document preprocessing to reduce API calls",
          "Caching results for similar documents"
        ],
        multi_tenant: [
          "Document storage per organizationId",
          "Processing quotas per subscription tier",
          "Cost allocation across organizations",
          "Custom models per organization needs"
        ]
      },
      "text-analytics": {
        service: "@azure/ai-text-analytics", 
        cpa_use_cases: [
          "Client email sentiment analysis",
          "Urgency detection in communications",
          "Financial document summarization",
          "Risk indicator identification"
        ],
        optimization_strategies: [
          "Batch processing for cost efficiency",
          "Language detection for international clients",
          "Custom entity extraction models",
          "Real-time processing for urgent communications"
        ]
      },
      "cognitive-search": {
        service: "@azure/search-documents",
        cpa_use_cases: [
          "Tax code and regulation lookup",
          "Accounting standard research",
          "Client document search",
          "Precedent case analysis"
        ],
        optimization_strategies: [
          "Index per organization for data isolation",
          "Semantic search for complex tax queries",
          "Vector search for similar scenarios",
          "Custom ranking per organization"
        ]
      },
      "openai": {
        service: "@azure/openai",
        cpa_use_cases: [
          "Financial analysis and insights",
          "Tax advice generation",
          "Client communication drafts",
          "Report summarization"
        ],
        optimization_strategies: [
          "Prompt engineering for accuracy",
          "Response caching for common queries",
          "Model selection based on use case",
          "Compliance review workflows"
        ]
      }
    };

    const serviceData = optimizations[service] || {
      available_services: Object.keys(optimizations),
      description: "Select a specific Azure service for optimization guidance"
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            service: service,
            optimization: serviceData,
            cost_considerations: "Multi-tenant cost allocation and usage tracking",
            performance: "Scaling strategies for tax season peaks",
            compliance: "Data security and client confidentiality requirements"
          }, null, 2)
        }
      ]
    };
  }

  async prismaSchemaValidate(model) {
    const validation = {
      required_patterns: {
        organizationId: "All models must include organizationId foreign key",
        relationship: "Organization relationship with CASCADE delete",
        indexes: "Composite indexes starting with organizationId",
        timestamps: "createdAt and updatedAt fields recommended"
      },
      example_model: `
model Client {
  id             String       @id @default(cuid())
  organizationId String       
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name           String
  email          String
  // ... other fields
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  @@index([organizationId, email])
  @@index([organizationId, createdAt])
}
      `,
      validation_checks: [
        "✅ organizationId field present",
        "✅ Organization relationship defined",
        "✅ onDelete: Cascade for data cleanup",
        "✅ Composite indexes include organizationId",
        "✅ No queries possible without organization filter"
      ]
    };

    if (model) {
      const hasOrganizationId = model.includes('organizationId');
      const hasRelationship = model.includes('Organization') && model.includes('@relation');
      const hasCascade = model.includes('onDelete: Cascade');
      const hasIndex = model.includes('@@index') && model.includes('organizationId');

      validation.model_analysis = {
        organizationId_field: hasOrganizationId ? "✅ Present" : "❌ Missing",
        organization_relationship: hasRelationship ? "✅ Present" : "❌ Missing", 
        cascade_delete: hasCascade ? "✅ Present" : "❌ Missing",
        composite_indexes: hasIndex ? "✅ Present" : "❌ Missing"
      };

      if (!hasOrganizationId) {
        validation.issues = validation.issues || [];
        validation.issues.push("Missing organizationId field - model is not tenant-isolated");
      }

      if (!hasRelationship) {
        validation.issues = validation.issues || [];
        validation.issues.push("Missing Organization relationship - foreign key constraint needed");
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(validation, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("AdvisorOS Context MCP Server running on stdio");
  }
}

if (require.main === module) {
  const server = new AdvisorOSContextServer();
  server.run().catch(console.error);
}

module.exports = { AdvisorOSContextServer };