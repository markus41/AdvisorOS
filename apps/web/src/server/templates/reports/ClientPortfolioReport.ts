export const ClientPortfolioReportTemplate = {
  id: "client_portfolio",
  name: "Client Portfolio Report",
  description: "Comprehensive analysis of client portfolio including financial health, engagement status, and growth opportunities",
  category: "advisory",
  type: "business_scorecard",
  version: "1.0.0",
  isSystem: true,
  layout: {
    orientation: "portrait",
    margins: {
      top: 50,
      bottom: 50,
      left: 40,
      right: 40
    },
    headers: {
      enabled: true,
      includeCompanyName: true,
      includeReportTitle: true,
      includeDate: true
    },
    footers: {
      enabled: true,
      includePageNumbers: true,
      includeConfidentialityNotice: true
    }
  },
  sections: [
    {
      id: "portfolio_overview",
      name: "Portfolio Overview",
      type: "dashboard",
      order: 1,
      configuration: {
        keyMetrics: [
          "total_clients",
          "total_portfolio_value",
          "average_client_value",
          "client_retention_rate",
          "new_clients_ytd",
          "lost_clients_ytd"
        ],
        includeComparisons: {
          priorPeriod: true,
          industryBenchmarks: false,
          targets: true
        },
        visualizations: ["charts", "gauges", "trends"]
      }
    },
    {
      id: "client_segmentation",
      name: "Client Segmentation",
      type: "segmentation_analysis",
      order: 2,
      configuration: {
        segmentationCriteria: [
          {
            name: "Revenue Size",
            segments: [
              { name: "Enterprise", min: 50000, color: "#059669" },
              { name: "Mid-Market", min: 10000, max: 49999, color: "#3b82f6" },
              { name: "Small Business", min: 2500, max: 9999, color: "#f59e0b" },
              { name: "Micro", max: 2499, color: "#ef4444" }
            ]
          },
          {
            name: "Industry",
            segments: [
              { name: "Professional Services", color: "#8b5cf6" },
              { name: "Retail", color: "#06b6d4" },
              { name: "Manufacturing", color: "#84cc16" },
              { name: "Healthcare", color: "#f97316" },
              { name: "Technology", color: "#ec4899" },
              { name: "Other", color: "#6b7280" }
            ]
          },
          {
            name: "Service Type",
            segments: [
              { name: "Full Service", color: "#059669" },
              { name: "Tax Only", color: "#3b82f6" },
              { name: "Bookkeeping Only", color: "#f59e0b" },
              { name: "Advisory Only", color: "#ef4444" }
            ]
          }
        ],
        includeMetrics: true,
        includeGrowthAnalysis: true
      }
    },
    {
      id: "client_financial_health",
      name: "Client Financial Health",
      type: "health_scorecard",
      order: 3,
      configuration: {
        healthIndicators: [
          {
            name: "Revenue Growth",
            weight: 25,
            thresholds: { excellent: 15, good: 5, fair: 0, poor: -5 }
          },
          {
            name: "Profit Margin",
            weight: 25,
            thresholds: { excellent: 20, good: 10, fair: 5, poor: 0 }
          },
          {
            name: "Cash Flow",
            weight: 20,
            thresholds: { excellent: 90, good: 60, fair: 30, poor: 0 }
          },
          {
            name: "Debt-to-Equity",
            weight: 15,
            thresholds: { excellent: 0.3, good: 0.5, fair: 0.8, poor: 1.0 }
          },
          {
            name: "Current Ratio",
            weight: 15,
            thresholds: { excellent: 2.0, good: 1.5, fair: 1.2, poor: 1.0 }
          }
        ],
        scoreRanges: {
          excellent: { min: 90, color: "#059669", label: "Excellent" },
          good: { min: 75, color: "#3b82f6", label: "Good" },
          fair: { min: 60, color: "#f59e0b", label: "Fair" },
          poor: { min: 0, color: "#ef4444", label: "At Risk" }
        },
        includeIndividualScores: true,
        includePortfolioScore: true,
        includeTrends: true
      }
    },
    {
      id: "engagement_analysis",
      name: "Engagement Analysis",
      type: "engagement_metrics",
      order: 4,
      configuration: {
        metrics: [
          "active_engagements",
          "completed_engagements",
          "average_engagement_value",
          "engagement_profitability",
          "client_satisfaction_scores",
          "referral_generation"
        ],
        timeframes: ["current_month", "quarter_to_date", "year_to_date"],
        includeComparisons: true,
        engagementTypes: [
          "tax_preparation",
          "monthly_bookkeeping",
          "cfo_services",
          "advisory_consulting",
          "audit_review",
          "special_projects"
        ]
      }
    },
    {
      id: "revenue_analysis",
      name: "Revenue Analysis",
      type: "financial_analysis",
      order: 5,
      configuration: {
        revenueStreams: [
          "recurring_monthly",
          "annual_tax_prep",
          "project_based",
          "advisory_services",
          "compliance_services"
        ],
        metrics: [
          "total_revenue",
          "recurring_revenue_percentage",
          "average_revenue_per_client",
          "revenue_concentration_risk",
          "price_realization",
          "billing_efficiency"
        ],
        trends: {
          monthly: true,
          quarterly: true,
          yearOverYear: true
        },
        forecasting: {
          enabled: true,
          periods: 12,
          confidence_intervals: true
        }
      }
    },
    {
      id: "growth_opportunities",
      name: "Growth Opportunities",
      type: "opportunity_analysis",
      order: 6,
      configuration: {
        opportunityTypes: [
          {
            name: "Service Expansion",
            description: "Existing clients who could benefit from additional services",
            criteria: {
              currentServices: "limited",
              clientSize: "medium_large",
              relationship_strength: "strong"
            }
          },
          {
            name: "Pricing Optimization",
            description: "Clients with below-market pricing",
            criteria: {
              pricingVsMarket: "below_average",
              serviceQuality: "high",
              clientSatisfaction: "high"
            }
          },
          {
            name: "Advisory Upsell",
            description: "Clients who could benefit from strategic advisory services",
            criteria: {
              businessComplexity: "medium_high",
              currentGrowthPhase: "expansion",
              advisoryServices: "none_minimal"
            }
          },
          {
            name: "Technology Integration",
            description: "Clients who could benefit from automation and technology solutions",
            criteria: {
              technologyAdoption: "low",
              processEfficiency: "low",
              growthPotential: "high"
            }
          }
        ],
        prioritization: {
          revenueImpact: 40,
          implementationEase: 25,
          clientReadiness: 20,
          strategicFit: 15
        },
        includeActionPlans: true
      }
    },
    {
      id: "risk_assessment",
      name: "Risk Assessment",
      type: "risk_analysis",
      order: 7,
      configuration: {
        riskCategories: [
          {
            name: "Client Concentration",
            description: "Risk from over-dependence on large clients",
            thresholds: { high: 30, medium: 20, low: 10 }
          },
          {
            name: "Industry Concentration",
            description: "Risk from concentration in specific industries",
            thresholds: { high: 50, medium: 35, low: 25 }
          },
          {
            name: "Service Concentration",
            description: "Risk from limited service diversification",
            thresholds: { high: 70, medium: 50, low: 35 }
          },
          {
            name: "Payment Risk",
            description: "Risk from client payment issues",
            metrics: ["days_sales_outstanding", "bad_debt_percentage"]
          },
          {
            name: "Client Satisfaction",
            description: "Risk from declining client satisfaction",
            metrics: ["satisfaction_scores", "complaint_frequency", "retention_rate"]
          }
        ],
        mitigation_strategies: true,
        monitoring_recommendations: true
      }
    },
    {
      id: "action_recommendations",
      name: "Action Recommendations",
      type: "recommendations",
      order: 8,
      configuration: {
        recommendationTypes: [
          "immediate_actions",
          "short_term_initiatives",
          "long_term_strategies"
        ],
        prioritization: ["high", "medium", "low"],
        includeTimelines: true,
        includeResourceRequirements: true,
        includeExpectedOutcomes: true
      }
    }
  ],
  dataRequirements: {
    required: [
      "client_master_data",
      "engagement_data",
      "revenue_data",
      "invoice_data",
      "financial_statements"
    ],
    optional: [
      "satisfaction_surveys",
      "industry_benchmarks",
      "market_data",
      "competitive_analysis"
    ],
    dataSources: [
      "crm_system",
      "billing_system",
      "quickbooks_integration",
      "engagement_management",
      "client_portal"
    ]
  },
  chartConfigs: {
    enabled: true,
    charts: [
      {
        id: "portfolio_value_trend",
        type: "line",
        title: "Portfolio Value Trend",
        data: "monthly_portfolio_value",
        position: "portfolio_overview"
      },
      {
        id: "client_segmentation_pie",
        type: "pie",
        title: "Clients by Revenue Size",
        data: "revenue_segments",
        position: "client_segmentation"
      },
      {
        id: "health_score_distribution",
        type: "histogram",
        title: "Client Health Score Distribution",
        data: "health_scores",
        position: "client_financial_health"
      },
      {
        id: "revenue_by_service",
        type: "stacked_bar",
        title: "Revenue by Service Type",
        data: "service_revenue",
        position: "revenue_analysis"
      },
      {
        id: "opportunity_matrix",
        type: "bubble",
        title: "Growth Opportunity Matrix",
        data: "opportunities",
        position: "growth_opportunities"
      }
    ]
  },
  brandingOptions: {
    logo: {
      enabled: true,
      position: "header_left",
      maxWidth: 200,
      maxHeight: 100
    },
    colors: {
      primary: "#1e40af",
      secondary: "#374151",
      accent: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
      success: "#059669",
      text: "#1f2937",
      background: "#ffffff"
    },
    fonts: {
      header: "Arial Bold",
      subheader: "Arial Semibold",
      body: "Arial",
      numbers: "Arial"
    }
  },
  filters: {
    clientSegment: {
      enabled: true,
      multiSelect: true,
      options: ["enterprise", "mid_market", "small_business", "micro"]
    },
    industry: {
      enabled: true,
      multiSelect: true,
      searchable: true
    },
    serviceType: {
      enabled: true,
      multiSelect: true,
      options: ["full_service", "tax_only", "bookkeeping_only", "advisory_only"]
    },
    healthScore: {
      enabled: true,
      type: "range",
      min: 0,
      max: 100
    },
    dateRange: {
      enabled: true,
      default: "last_12_months",
      options: ["last_3_months", "last_6_months", "last_12_months", "custom"]
    }
  },
  outputFormats: ["pdf", "excel"],
  defaultFormat: "pdf",
  scheduling: {
    enabled: true,
    frequencies: ["monthly", "quarterly"],
    defaultFrequency: "quarterly",
    autoDistribution: {
      enabled: true,
      recipients: ["partners", "managers", "business_development"]
    }
  },
  metadata: {
    created: "2024-01-01",
    lastModified: "2024-01-01",
    version: "1.0.0",
    author: "System",
    tags: ["client", "portfolio", "analysis", "growth", "advisory"],
    confidentialityLevel: "high"
  }
};