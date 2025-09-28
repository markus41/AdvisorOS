import { FinancialPackageTemplate } from "./FinancialPackage";
import { TaxSummaryTemplate } from "./TaxSummary";
import { ClientPortfolioReportTemplate } from "./ClientPortfolioReport";

// Additional report templates
export const BusinessHealthReportTemplate = {
  id: "business_health",
  name: "Business Health Report",
  description: "Comprehensive analysis of business performance and key health indicators",
  category: "advisory",
  type: "business_scorecard",
  version: "1.0.0",
  isSystem: true,
  // Template configuration would go here...
};

export const ComplianceReportTemplate = {
  id: "compliance_report",
  name: "Compliance Report",
  description: "Track compliance requirements, deadlines, and filing status",
  category: "compliance",
  type: "compliance_tracking",
  version: "1.0.0",
  isSystem: true,
  // Template configuration would go here...
};

export const EngagementSummaryTemplate = {
  id: "engagement_summary",
  name: "Engagement Summary Report",
  description: "Detailed summary of engagement progress, tasks, and team performance",
  category: "project_management",
  type: "engagement_summary",
  version: "1.0.0",
  isSystem: true,
  layout: {
    orientation: "portrait",
    margins: { top: 50, bottom: 50, left: 40, right: 40 }
  },
  sections: [
    {
      id: "project_overview",
      name: "Project Overview",
      type: "summary",
      order: 1,
      configuration: {
        includeTimeline: true,
        includeKeyMetrics: true,
        includeStatusSummary: true
      }
    },
    {
      id: "task_analysis",
      name: "Task Analysis",
      type: "task_breakdown",
      order: 2,
      configuration: {
        groupBy: ["status", "assignee", "priority"],
        includeTimeTracking: true,
        includeVarianceAnalysis: true
      }
    },
    {
      id: "team_performance",
      name: "Team Performance",
      type: "performance_metrics",
      order: 3,
      configuration: {
        metrics: ["productivity", "quality", "utilization"],
        includeComparisons: true
      }
    },
    {
      id: "financial_summary",
      name: "Financial Summary",
      type: "financial_analysis",
      order: 4,
      configuration: {
        includeRevenue: true,
        includeCosts: true,
        includeProfitability: true,
        includeRealization: true
      }
    }
  ],
  dataRequirements: {
    required: ["engagement_data", "task_data", "time_tracking", "team_assignments"],
    optional: ["budget_data", "client_feedback", "quality_metrics"]
  }
};

export const TimeTrackingReportTemplate = {
  id: "time_tracking",
  name: "Time Tracking Report",
  description: "Detailed analysis of time utilization and productivity metrics",
  category: "operations",
  type: "time_analysis",
  version: "1.0.0",
  isSystem: true,
  layout: {
    orientation: "landscape",
    margins: { top: 40, bottom: 40, left: 30, right: 30 }
  },
  sections: [
    {
      id: "utilization_summary",
      name: "Utilization Summary",
      type: "summary",
      order: 1,
      configuration: {
        metrics: ["total_hours", "billable_hours", "utilization_rate"],
        timeframes: ["daily", "weekly", "monthly"],
        includeTargets: true
      }
    },
    {
      id: "by_team_member",
      name: "By Team Member",
      type: "breakdown",
      order: 2,
      configuration: {
        includeDetails: true,
        includeComparisons: true,
        sortBy: "total_hours"
      }
    },
    {
      id: "by_client",
      name: "By Client",
      type: "breakdown",
      order: 3,
      configuration: {
        includeProjectBreakdown: true,
        includeRevenueAnalysis: true
      }
    },
    {
      id: "productivity_analysis",
      name: "Productivity Analysis",
      type: "analysis",
      order: 4,
      configuration: {
        includeEfficiencyMetrics: true,
        includeTrends: true,
        includeRecommendations: true
      }
    }
  ],
  dataRequirements: {
    required: ["time_entries", "project_data", "team_data"],
    optional: ["hourly_rates", "budget_data", "client_data"]
  }
};

// System templates registry
export const SystemReportTemplates = [
  FinancialPackageTemplate,
  TaxSummaryTemplate,
  ClientPortfolioReportTemplate,
  BusinessHealthReportTemplate,
  ComplianceReportTemplate,
  EngagementSummaryTemplate,
  TimeTrackingReportTemplate
];

// Template categories
export const ReportCategories = {
  FINANCIAL: "monthly_financial",
  TAX: "tax_preparation",
  ADVISORY: "advisory",
  COMPLIANCE: "compliance",
  OPERATIONS: "operations",
  PROJECT: "project_management",
  CUSTOM: "custom"
};

// Template types
export const ReportTypes = {
  FINANCIAL_PACKAGE: "financial_package",
  TAX_ORGANIZER: "tax_organizer",
  BUSINESS_SCORECARD: "business_scorecard",
  COMPLIANCE_TRACKING: "compliance_tracking",
  ENGAGEMENT_SUMMARY: "engagement_summary",
  TIME_ANALYSIS: "time_analysis",
  CUSTOM: "custom"
};

// Helper functions
export function getTemplateById(templateId: string) {
  return SystemReportTemplates.find(template => template.id === templateId);
}

export function getTemplatesByCategory(category: string) {
  return SystemReportTemplates.filter(template => template.category === category);
}

export function getTemplatesByType(type: string) {
  return SystemReportTemplates.filter(template => template.type === type);
}

export function validateTemplateConfiguration(template: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields validation
  if (!template.id) errors.push("Template ID is required");
  if (!template.name) errors.push("Template name is required");
  if (!template.category) errors.push("Template category is required");
  if (!template.type) errors.push("Template type is required");
  if (!template.sections || !Array.isArray(template.sections)) {
    errors.push("Template must have sections array");
  }

  // Sections validation
  if (template.sections) {
    template.sections.forEach((section: any, index: number) => {
      if (!section.id) errors.push(`Section ${index + 1} missing ID`);
      if (!section.name) errors.push(`Section ${index + 1} missing name`);
      if (!section.type) errors.push(`Section ${index + 1} missing type`);
      if (typeof section.order !== 'number') {
        errors.push(`Section ${index + 1} missing or invalid order`);
      }
    });
  }

  // Data requirements validation
  if (template.dataRequirements) {
    if (!template.dataRequirements.required || !Array.isArray(template.dataRequirements.required)) {
      errors.push("Template must specify required data sources");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getDefaultTemplateConfiguration() {
  return {
    layout: {
      orientation: "portrait",
      margins: { top: 50, bottom: 50, left: 40, right: 40 },
      headers: { enabled: true },
      footers: { enabled: true }
    },
    brandingOptions: {
      logo: { enabled: true, position: "header_left" },
      colors: {
        primary: "#2c3e50",
        secondary: "#34495e",
        accent: "#3498db",
        text: "#2c3e50",
        background: "#ffffff"
      },
      fonts: {
        header: "Arial Bold",
        body: "Arial",
        numbers: "Arial"
      }
    },
    outputFormats: ["pdf", "excel"],
    defaultFormat: "pdf"
  };
}