export const TaxSummaryTemplate = {
  id: "tax_summary",
  name: "Tax Return Summary Report",
  description: "Comprehensive summary of tax preparation activities and client returns",
  category: "tax_preparation",
  type: "tax_organizer",
  version: "1.0.0",
  isSystem: true,
  layout: {
    orientation: "landscape",
    margins: {
      top: 40,
      bottom: 40,
      left: 40,
      right: 40
    },
    headers: {
      enabled: true,
      includeCompanyName: true,
      includeReportTitle: true,
      includePeriod: true
    },
    footers: {
      enabled: true,
      includePageNumbers: true,
      includeConfidentialityNotice: true
    }
  },
  sections: [
    {
      id: "executive_summary",
      name: "Executive Summary",
      type: "summary",
      order: 1,
      configuration: {
        includeKeyMetrics: true,
        includeChartsGraphs: true,
        metrics: [
          "total_returns_prepared",
          "total_revenue_generated",
          "average_return_fee",
          "completion_rate",
          "client_satisfaction_score"
        ]
      }
    },
    {
      id: "returns_by_type",
      name: "Returns by Type",
      type: "breakdown",
      order: 2,
      configuration: {
        returnTypes: [
          {
            code: "1040",
            name: "Individual Income Tax",
            includeSchedules: true
          },
          {
            code: "1120",
            name: "Corporate Income Tax",
            includeSchedules: true
          },
          {
            code: "1065",
            name: "Partnership Return",
            includeSchedules: true
          },
          {
            code: "1041",
            name: "Estate/Trust Return",
            includeSchedules: false
          },
          {
            code: "990",
            name: "Exempt Organization",
            includeSchedules: false
          }
        ],
        includeStatistics: true,
        includeRevenueBreakdown: true
      }
    },
    {
      id: "client_summary",
      name: "Client Summary",
      type: "client_listing",
      order: 3,
      configuration: {
        sortBy: "alphabetical", // or "revenue", "return_type", "status"
        includeColumns: [
          "client_name",
          "return_type",
          "status",
          "preparer",
          "due_date",
          "completion_date",
          "fee",
          "refund_amount"
        ],
        includeFilters: {
          status: ["completed", "in_progress", "not_started"],
          returnType: ["1040", "1120", "1065"],
          preparer: "all"
        },
        includeSubtotals: true
      }
    },
    {
      id: "preparer_performance",
      name: "Preparer Performance",
      type: "performance_analysis",
      order: 4,
      configuration: {
        metrics: [
          "returns_completed",
          "average_completion_time",
          "revenue_generated",
          "client_satisfaction",
          "error_rate",
          "review_rate"
        ],
        includeComparisons: true,
        includeTargets: true,
        timeframe: "year_to_date"
      }
    },
    {
      id: "revenue_analysis",
      name: "Revenue Analysis",
      type: "financial_analysis",
      order: 5,
      configuration: {
        includeMonthlyBreakdown: true,
        includeYearOverYear: true,
        includeProjections: true,
        revenueCategories: [
          "individual_returns",
          "business_returns",
          "amended_returns",
          "extensions",
          "consulting_fees"
        ],
        includeMetrics: [
          "total_revenue",
          "average_fee_per_return",
          "realization_rate",
          "collection_rate"
        ]
      }
    },
    {
      id: "deadlines_compliance",
      name: "Deadlines & Compliance",
      type: "compliance_tracking",
      order: 6,
      configuration: {
        includeUpcomingDeadlines: true,
        includeMissedDeadlines: true,
        includeExtensionTracking: true,
        deadlineTypes: [
          "individual_due_dates",
          "corporate_due_dates",
          "partnership_due_dates",
          "extension_due_dates",
          "estimated_payment_dates"
        ],
        alertThresholds: {
          critical: 3, // days
          warning: 7,   // days
          normal: 30    // days
        }
      }
    },
    {
      id: "quality_metrics",
      name: "Quality Metrics",
      type: "quality_analysis",
      order: 7,
      configuration: {
        includeReviewStats: true,
        includeErrorAnalysis: true,
        includeClientFeedback: true,
        qualityMetrics: [
          "first_time_accuracy",
          "review_cycle_time",
          "client_questions_per_return",
          "amendment_rate",
          "irs_correspondence_rate"
        ]
      }
    }
  ],
  dataRequirements: {
    required: [
      "tax_engagements",
      "client_data",
      "preparer_assignments",
      "completion_dates",
      "fee_information"
    ],
    optional: [
      "prior_year_data",
      "client_feedback",
      "time_tracking",
      "review_notes"
    ],
    dataSources: [
      "engagement_management",
      "tax_software",
      "time_tracking_system",
      "client_portal"
    ]
  },
  chartConfigs: {
    enabled: true,
    charts: [
      {
        id: "returns_by_month",
        type: "bar",
        title: "Returns Completed by Month",
        data: "monthly_completions",
        position: "executive_summary"
      },
      {
        id: "return_type_distribution",
        type: "pie",
        title: "Return Type Distribution",
        data: "return_types",
        position: "returns_by_type"
      },
      {
        id: "revenue_trend",
        type: "line",
        title: "Monthly Revenue Trend",
        data: "monthly_revenue",
        position: "revenue_analysis"
      },
      {
        id: "preparer_productivity",
        type: "horizontal_bar",
        title: "Preparer Productivity",
        data: "preparer_stats",
        position: "preparer_performance"
      },
      {
        id: "deadline_status",
        type: "stacked_bar",
        title: "Deadline Status",
        data: "deadline_compliance",
        position: "deadlines_compliance"
      }
    ]
  },
  brandingOptions: {
    logo: {
      enabled: true,
      position: "header_left",
      maxWidth: 150,
      maxHeight: 75
    },
    colors: {
      primary: "#1e3a8a", // Professional blue
      secondary: "#1f2937", // Dark gray
      accent: "#059669",   // Success green
      warning: "#d97706",  // Warning orange
      danger: "#dc2626",   // Error red
      text: "#111827",
      background: "#ffffff"
    },
    fonts: {
      header: "Arial Bold",
      subheader: "Arial Semibold",
      body: "Arial",
      numbers: "Arial"
    },
    watermark: {
      enabled: true,
      text: "CONFIDENTIAL",
      opacity: 0.1
    }
  },
  filters: {
    dateRange: {
      enabled: true,
      default: "current_tax_year",
      options: [
        "current_tax_year",
        "prior_tax_year",
        "custom_range"
      ]
    },
    returnTypes: {
      enabled: true,
      multiSelect: true,
      options: ["1040", "1120", "1065", "1041", "990"]
    },
    preparers: {
      enabled: true,
      multiSelect: true,
      includeAll: true
    },
    clients: {
      enabled: true,
      multiSelect: true,
      searchable: true
    },
    status: {
      enabled: true,
      multiSelect: true,
      options: ["completed", "in_progress", "not_started", "on_hold"]
    }
  },
  outputFormats: ["pdf", "excel"],
  defaultFormat: "pdf",
  scheduling: {
    enabled: true,
    frequencies: ["daily", "weekly", "monthly", "quarterly"],
    defaultFrequency: "monthly",
    autoDistribution: {
      enabled: true,
      recipients: ["partners", "managers", "preparers"]
    }
  },
  metadata: {
    created: "2024-01-01",
    lastModified: "2024-01-01",
    version: "1.0.0",
    author: "System",
    tags: ["tax", "summary", "performance", "compliance", "revenue"],
    compliance: {
      dataRetention: "7_years",
      confidentialityLevel: "high",
      accessControl: "tax_team_only"
    }
  }
};