import { PrismaClient } from "@database/client";
import { WorkflowStep, WorkflowTemplate } from "./workflow.service";

export class WorkflowTemplatesService {
  constructor(private prisma: PrismaClient) {}

  async initializeSystemTemplates() {
    const templates = [
      this.createMonthlyBookkeepingTemplate(),
      this.createTaxReturn1040Template(),
      this.createTaxReturn1120Template(),
      this.createTaxReturn1065Template(),
      this.createNewClientOnboardingTemplate(),
      this.createYearEndClosingTemplate(),
      this.createQuarterlyTaxEstimatesTemplate(),
      this.createFinancialStatementPreparationTemplate()
    ];

    for (const template of templates) {
      await this.createOrUpdateTemplate(template);
    }

    console.log("System workflow templates initialized successfully");
  }

  private createMonthlyBookkeepingTemplate(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "collect_documents",
        name: "Collect Monthly Documents",
        description: "Gather bank statements, receipts, and other financial documents",
        type: "task",
        taskType: "document_review",
        estimatedHours: 1,
        dueOffsetDays: 25,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "bank_reconciliation",
        name: "Bank Reconciliation",
        description: "Reconcile all bank accounts for the month",
        type: "task",
        taskType: "data_entry",
        dependencies: ["0"],
        estimatedHours: 2,
        dueOffsetDays: 20,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "categorize_transactions",
        name: "Categorize Transactions",
        description: "Review and categorize all transactions",
        type: "task",
        taskType: "data_entry",
        dependencies: ["1"],
        estimatedHours: 2,
        dueOffsetDays: 18,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "review_entries",
        name: "Review Journal Entries",
        description: "Review all journal entries for accuracy",
        type: "task",
        taskType: "review",
        dependencies: ["2"],
        estimatedHours: 1,
        dueOffsetDays: 15,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "generate_reports",
        name: "Generate Financial Reports",
        description: "Generate P&L, Balance Sheet, and Cash Flow statements",
        type: "task",
        taskType: "preparation",
        dependencies: ["3"],
        estimatedHours: 1,
        dueOffsetDays: 10,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "client_review",
        name: "Client Review Meeting",
        description: "Review monthly financials with client",
        type: "task",
        taskType: "client_meeting",
        dependencies: ["4"],
        estimatedHours: 1,
        dueOffsetDays: 5,
        configuration: { assigneeRole: "cpa" }
      }
    ];

    return {
      name: "Monthly Bookkeeping Process",
      description: "Complete monthly bookkeeping workflow for small business clients",
      category: "bookkeeping",
      type: "monthly_bookkeeping",
      isSystemTemplate: true,
      estimatedDuration: 8,
      complexity: "medium",
      steps,
      taskTemplates: this.createTaskTemplates(steps),
      requirements: {
        documents: ["Bank statements", "Receipts", "Invoices"],
        access: ["QuickBooks", "Bank portal"]
      },
      settings: {
        autoAssign: true,
        notifications: true,
        recurringSchedule: "monthly"
      }
    };
  }

  private createTaxReturn1040Template(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "organizer_send",
        name: "Send Tax Organizer",
        description: "Send tax organizer to client for completion",
        type: "task",
        taskType: "preparation",
        estimatedHours: 0.5,
        dueOffsetDays: 90,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "documents_received",
        name: "Receive Tax Documents",
        description: "Collect all tax documents from client",
        type: "task",
        taskType: "document_review",
        dependencies: ["0"],
        estimatedHours: 1,
        dueOffsetDays: 60,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "data_entry",
        name: "Tax Return Data Entry",
        description: "Enter client information and tax data",
        type: "task",
        taskType: "data_entry",
        dependencies: ["1"],
        estimatedHours: 3,
        dueOffsetDays: 45,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "calculations",
        name: "Tax Calculations",
        description: "Calculate tax liability and refund amounts",
        type: "task",
        taskType: "preparation",
        dependencies: ["2"],
        estimatedHours: 2,
        dueOffsetDays: 30,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "review",
        name: "Tax Return Review",
        description: "Senior review of completed tax return",
        type: "task",
        taskType: "review",
        dependencies: ["3"],
        estimatedHours: 1,
        dueOffsetDays: 20,
        configuration: { assigneeRole: "senior_cpa" }
      },
      {
        id: "client_approval",
        name: "Client Approval",
        description: "Present return to client and obtain approval",
        type: "task",
        taskType: "client_meeting",
        dependencies: ["4"],
        estimatedHours: 1,
        dueOffsetDays: 15,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "filing",
        name: "File Tax Return",
        description: "Electronically file the tax return",
        type: "task",
        taskType: "preparation",
        dependencies: ["5"],
        estimatedHours: 0.5,
        dueOffsetDays: 5,
        configuration: { assigneeRole: "cpa" }
      }
    ];

    return {
      name: "Individual Tax Return (1040)",
      description: "Complete workflow for preparing and filing Form 1040 individual tax returns",
      category: "tax_preparation",
      type: "tax_return_1040",
      isSystemTemplate: true,
      estimatedDuration: 9,
      complexity: "medium",
      steps,
      taskTemplates: this.createTaskTemplates(steps),
      requirements: {
        documents: ["W-2s", "1099s", "Tax organizer", "Prior year return"],
        software: ["Tax preparation software"]
      }
    };
  }

  private createTaxReturn1120Template(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "planning_meeting",
        name: "Tax Planning Meeting",
        description: "Initial planning meeting with client",
        type: "task",
        taskType: "client_meeting",
        estimatedHours: 2,
        dueOffsetDays: 120,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "financial_statements",
        name: "Prepare Financial Statements",
        description: "Prepare year-end financial statements",
        type: "task",
        taskType: "preparation",
        dependencies: ["0"],
        estimatedHours: 8,
        dueOffsetDays: 90,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "book_tax_differences",
        name: "Analyze Book-Tax Differences",
        description: "Identify and analyze book-tax differences",
        type: "task",
        taskType: "preparation",
        dependencies: ["1"],
        estimatedHours: 4,
        dueOffsetDays: 70,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "depreciation_schedule",
        name: "Prepare Depreciation Schedule",
        description: "Update and prepare depreciation schedules",
        type: "task",
        taskType: "preparation",
        dependencies: ["2"],
        estimatedHours: 3,
        dueOffsetDays: 60,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "tax_return_prep",
        name: "Prepare Form 1120",
        description: "Prepare corporate tax return",
        type: "task",
        taskType: "preparation",
        dependencies: ["3"],
        estimatedHours: 6,
        dueOffsetDays: 45,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "senior_review",
        name: "Senior Review",
        description: "Comprehensive review by senior CPA",
        type: "task",
        taskType: "review",
        dependencies: ["4"],
        estimatedHours: 3,
        dueOffsetDays: 30,
        configuration: { assigneeRole: "senior_cpa" }
      },
      {
        id: "client_presentation",
        name: "Client Presentation",
        description: "Present return and discuss tax strategies",
        type: "task",
        taskType: "client_meeting",
        dependencies: ["5"],
        estimatedHours: 2,
        dueOffsetDays: 20,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "filing",
        name: "File Corporate Return",
        description: "File Form 1120 and supporting documents",
        type: "task",
        taskType: "preparation",
        dependencies: ["6"],
        estimatedHours: 1,
        dueOffsetDays: 5,
        configuration: { assigneeRole: "cpa" }
      }
    ];

    return {
      name: "Corporate Tax Return (1120)",
      description: "Complete workflow for preparing and filing Form 1120 corporate tax returns",
      category: "tax_preparation",
      type: "tax_return_1120",
      isSystemTemplate: true,
      estimatedDuration: 29,
      complexity: "high",
      steps,
      taskTemplates: this.createTaskTemplates(steps)
    };
  }

  private createTaxReturn1065Template(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "partnership_agreement",
        name: "Review Partnership Agreement",
        description: "Review partnership agreement for allocation methods",
        type: "task",
        taskType: "document_review",
        estimatedHours: 2,
        dueOffsetDays: 100,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "k1_preparation",
        name: "Prepare Schedule K-1s",
        description: "Prepare individual partner Schedule K-1s",
        type: "task",
        taskType: "preparation",
        dependencies: ["0"],
        estimatedHours: 4,
        dueOffsetDays: 60,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "partnership_return",
        name: "Prepare Form 1065",
        description: "Prepare partnership tax return",
        type: "task",
        taskType: "preparation",
        dependencies: ["1"],
        estimatedHours: 5,
        dueOffsetDays: 45,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "review",
        name: "Review and Finalize",
        description: "Review return and K-1s for accuracy",
        type: "task",
        taskType: "review",
        dependencies: ["2"],
        estimatedHours: 2,
        dueOffsetDays: 30,
        configuration: { assigneeRole: "senior_cpa" }
      },
      {
        id: "distribute_k1s",
        name: "Distribute K-1s",
        description: "Send K-1s to all partners",
        type: "task",
        taskType: "preparation",
        dependencies: ["3"],
        estimatedHours: 1,
        dueOffsetDays: 15,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "filing",
        name: "File Partnership Return",
        description: "File Form 1065 with IRS",
        type: "task",
        taskType: "preparation",
        dependencies: ["4"],
        estimatedHours: 0.5,
        dueOffsetDays: 5,
        configuration: { assigneeRole: "cpa" }
      }
    ];

    return {
      name: "Partnership Tax Return (1065)",
      description: "Complete workflow for preparing Form 1065 partnership returns and K-1s",
      category: "tax_preparation",
      type: "tax_return_1065",
      isSystemTemplate: true,
      estimatedDuration: 14.5,
      complexity: "high",
      steps,
      taskTemplates: this.createTaskTemplates(steps)
    };
  }

  private createNewClientOnboardingTemplate(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "initial_consultation",
        name: "Initial Consultation",
        description: "Meet with prospective client to discuss needs",
        type: "task",
        taskType: "client_meeting",
        estimatedHours: 1.5,
        dueOffsetDays: 0,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "engagement_letter",
        name: "Prepare Engagement Letter",
        description: "Draft and send engagement letter to client",
        type: "task",
        taskType: "preparation",
        dependencies: ["0"],
        estimatedHours: 1,
        dueOffsetDays: 2,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "client_portal_setup",
        name: "Set Up Client Portal",
        description: "Create client account and portal access",
        type: "task",
        taskType: "preparation",
        dependencies: ["1"],
        estimatedHours: 0.5,
        dueOffsetDays: 3,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "document_collection",
        name: "Collect Client Documents",
        description: "Gather all necessary client documents and information",
        type: "task",
        taskType: "document_review",
        dependencies: ["2"],
        estimatedHours: 2,
        dueOffsetDays: 7,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "accounting_setup",
        name: "Set Up Accounting System",
        description: "Configure QuickBooks or other accounting software",
        type: "task",
        taskType: "preparation",
        dependencies: ["3"],
        estimatedHours: 3,
        dueOffsetDays: 10,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "training_session",
        name: "Client Training Session",
        description: "Train client on portal and processes",
        type: "task",
        taskType: "client_meeting",
        dependencies: ["4"],
        estimatedHours: 1.5,
        dueOffsetDays: 14,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "first_deliverable",
        name: "Complete First Deliverable",
        description: "Complete initial project or monthly work",
        type: "task",
        taskType: "preparation",
        dependencies: ["5"],
        estimatedHours: 4,
        dueOffsetDays: 30,
        configuration: { assigneeRole: "cpa" }
      }
    ];

    return {
      name: "New Client Onboarding",
      description: "Complete onboarding process for new clients",
      category: "onboarding",
      type: "new_client_onboarding",
      isSystemTemplate: true,
      estimatedDuration: 13.5,
      complexity: "medium",
      steps,
      taskTemplates: this.createTaskTemplates(steps)
    };
  }

  private createYearEndClosingTemplate(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "preliminary_review",
        name: "Preliminary Year-End Review",
        description: "Initial review of accounts and transactions",
        type: "task",
        taskType: "review",
        estimatedHours: 3,
        dueOffsetDays: 45,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "adjusting_entries",
        name: "Prepare Adjusting Entries",
        description: "Prepare year-end adjusting journal entries",
        type: "task",
        taskType: "preparation",
        dependencies: ["0"],
        estimatedHours: 4,
        dueOffsetDays: 35,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "depreciation",
        name: "Calculate Depreciation",
        description: "Calculate and record annual depreciation",
        type: "task",
        taskType: "preparation",
        dependencies: ["1"],
        estimatedHours: 2,
        dueOffsetDays: 30,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "accruals",
        name: "Record Accruals",
        description: "Record year-end accruals and deferrals",
        type: "task",
        taskType: "preparation",
        dependencies: ["2"],
        estimatedHours: 2,
        dueOffsetDays: 25,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "trial_balance",
        name: "Prepare Trial Balance",
        description: "Generate and review year-end trial balance",
        type: "task",
        taskType: "preparation",
        dependencies: ["3"],
        estimatedHours: 1,
        dueOffsetDays: 20,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "financial_statements",
        name: "Prepare Financial Statements",
        description: "Generate year-end financial statements",
        type: "task",
        taskType: "preparation",
        dependencies: ["4"],
        estimatedHours: 3,
        dueOffsetDays: 15,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "closing_entries",
        name: "Post Closing Entries",
        description: "Post closing entries and close the year",
        type: "task",
        taskType: "preparation",
        dependencies: ["5"],
        estimatedHours: 1,
        dueOffsetDays: 10,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "client_presentation",
        name: "Present Year-End Results",
        description: "Present financial results to client",
        type: "task",
        taskType: "client_meeting",
        dependencies: ["6"],
        estimatedHours: 2,
        dueOffsetDays: 5,
        configuration: { assigneeRole: "cpa" }
      }
    ];

    return {
      name: "Year-End Closing Process",
      description: "Complete year-end closing and financial statement preparation",
      category: "year_end",
      type: "year_end_closing",
      isSystemTemplate: true,
      estimatedDuration: 18,
      complexity: "high",
      steps,
      taskTemplates: this.createTaskTemplates(steps)
    };
  }

  private createQuarterlyTaxEstimatesTemplate(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "gather_financial_data",
        name: "Gather Quarterly Financial Data",
        description: "Collect P&L and other financial information",
        type: "task",
        taskType: "document_review",
        estimatedHours: 1,
        dueOffsetDays: 10,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "calculate_estimates",
        name: "Calculate Tax Estimates",
        description: "Calculate quarterly estimated tax payments",
        type: "task",
        taskType: "preparation",
        dependencies: ["0"],
        estimatedHours: 2,
        dueOffsetDays: 8,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "prepare_vouchers",
        name: "Prepare Payment Vouchers",
        description: "Prepare Form 1040ES payment vouchers",
        type: "task",
        taskType: "preparation",
        dependencies: ["1"],
        estimatedHours: 0.5,
        dueOffsetDays: 5,
        configuration: { assigneeRole: "staff" }
      },
      {
        id: "client_notification",
        name: "Notify Client",
        description: "Send payment information to client",
        type: "task",
        taskType: "preparation",
        dependencies: ["2"],
        estimatedHours: 0.5,
        dueOffsetDays: 3,
        configuration: { assigneeRole: "staff" }
      }
    ];

    return {
      name: "Quarterly Tax Estimates",
      description: "Calculate and prepare quarterly estimated tax payments",
      category: "tax_preparation",
      type: "quarterly_tax_estimates",
      isSystemTemplate: true,
      estimatedDuration: 4,
      complexity: "low",
      steps,
      taskTemplates: this.createTaskTemplates(steps)
    };
  }

  private createFinancialStatementPreparationTemplate(): Partial<WorkflowTemplate> {
    const steps: WorkflowStep[] = [
      {
        id: "account_analysis",
        name: "Analyze Chart of Accounts",
        description: "Review and analyze all general ledger accounts",
        type: "task",
        taskType: "review",
        estimatedHours: 2,
        dueOffsetDays: 20,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "balance_sheet_prep",
        name: "Prepare Balance Sheet",
        description: "Generate and review balance sheet",
        type: "task",
        taskType: "preparation",
        dependencies: ["0"],
        estimatedHours: 2,
        dueOffsetDays: 15,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "income_statement_prep",
        name: "Prepare Income Statement",
        description: "Generate and review profit & loss statement",
        type: "task",
        taskType: "preparation",
        dependencies: ["0"],
        estimatedHours: 2,
        dueOffsetDays: 15,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "cash_flow_prep",
        name: "Prepare Cash Flow Statement",
        description: "Generate cash flow statement",
        type: "task",
        taskType: "preparation",
        dependencies: ["1", "2"],
        estimatedHours: 3,
        dueOffsetDays: 10,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "notes_preparation",
        name: "Prepare Notes to Financial Statements",
        description: "Draft notes and disclosures",
        type: "task",
        taskType: "preparation",
        dependencies: ["3"],
        estimatedHours: 2,
        dueOffsetDays: 8,
        configuration: { assigneeRole: "cpa" }
      },
      {
        id: "final_review",
        name: "Final Review and Formatting",
        description: "Final review and professional formatting",
        type: "task",
        taskType: "review",
        dependencies: ["4"],
        estimatedHours: 1,
        dueOffsetDays: 5,
        configuration: { assigneeRole: "senior_cpa" }
      }
    ];

    return {
      name: "Financial Statement Preparation",
      description: "Complete preparation of financial statements package",
      category: "compliance",
      type: "financial_statement_preparation",
      isSystemTemplate: true,
      estimatedDuration: 12,
      complexity: "medium",
      steps,
      taskTemplates: this.createTaskTemplates(steps)
    };
  }

  private createTaskTemplates(steps: WorkflowStep[]): Record<string, any> {
    const templates: Record<string, any> = {};

    steps.forEach((step, index) => {
      templates[step.id] = {
        title: step.name,
        description: step.description,
        taskType: step.taskType,
        estimatedHours: step.estimatedHours,
        stepIndex: index,
        configuration: step.configuration || {}
      };
    });

    return templates;
  }

  private async createOrUpdateTemplate(template: Partial<WorkflowTemplate>) {
    try {
      const existing = await this.prisma.workflowTemplate.findFirst({
        where: {
          type: template.type!,
          isSystemTemplate: true
        }
      });

      if (existing) {
        await this.prisma.workflowTemplate.update({
          where: { id: existing.id },
          data: {
            name: template.name!,
            description: template.description,
            category: template.category!,
            estimatedDuration: template.estimatedDuration,
            complexity: template.complexity,
            steps: template.steps,
            taskTemplates: template.taskTemplates,
            requirements: template.requirements,
            settings: template.settings,
            isActive: true
          }
        });
      } else {
        await this.prisma.workflowTemplate.create({
          data: {
            name: template.name!,
            description: template.description,
            category: template.category!,
            type: template.type!,
            isSystemTemplate: true,
            isActive: true,
            estimatedDuration: template.estimatedDuration,
            complexity: template.complexity || "medium",
            steps: template.steps!,
            taskTemplates: template.taskTemplates!,
            requirements: template.requirements,
            settings: template.settings
          }
        });
      }
    } catch (error) {
      console.error(`Error creating/updating template ${template.name}:`, error);
    }
  }

  async getAvailableTemplates(organizationId: string) {
    return await this.prisma.workflowTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { isSystemTemplate: true },
          { organizationId }
        ]
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ]
    });
  }

  async getTemplateById(templateId: string, organizationId: string) {
    return await this.prisma.workflowTemplate.findFirst({
      where: {
        id: templateId,
        isActive: true,
        OR: [
          { isSystemTemplate: true },
          { organizationId }
        ]
      }
    });
  }

  async createCustomTemplate(
    template: Omit<WorkflowTemplate, "id">,
    organizationId: string,
    createdBy: string
  ) {
    return await this.prisma.workflowTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        category: template.category,
        type: template.type,
        isSystemTemplate: false,
        isActive: true,
        estimatedDuration: template.estimatedDuration,
        complexity: template.complexity || "medium",
        steps: template.steps,
        taskTemplates: template.taskTemplates,
        requirements: template.requirements,
        settings: template.settings,
        organizationId,
        createdBy
      }
    });
  }
}