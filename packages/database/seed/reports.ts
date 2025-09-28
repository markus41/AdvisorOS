import { subDays, subMonths, addDays } from 'date-fns';

const now = new Date();

export const reportsData = {
  'taxpro': [
    {
      name: 'TaxPro Associates - Monthly Client Revenue Report',
      description: 'Comprehensive monthly revenue analysis by client and service type for March 2024',
      reportType: 'financial_summary',
      format: 'pdf',
      status: 'completed',
      fileUrl: '/reports/taxpro/monthly_revenue_march_2024.pdf',
      fileSize: 2457600, // 2.4MB
      parameters: {
        reportPeriod: 'march_2024',
        includeProjections: true,
        groupBy: 'client',
        currency: 'USD'
      },
      data: {
        summary: {
          totalRevenue: 18452.50,
          totalHours: 89.5,
          averageHourlyRate: 206.15,
          clientCount: 5,
          engagementCount: 5
        },
        clientBreakdown: [
          {
            clientName: 'TechFlow Solutions Inc',
            revenue: 4950.00,
            hours: 18.0,
            avgRate: 275.00,
            services: ['Corporate Tax Return', 'R&D Credit Analysis']
          },
          {
            clientName: 'Golden Gate Medical Group',
            revenue: 7000.00,
            hours: 20.0,
            avgRate: 350.00,
            services: ['CFO Services']
          },
          {
            clientName: 'Bay Area Real Estate Holdings',
            revenue: 5127.50,
            hours: 19.5,
            avgRate: 263.00,
            services: ['Audit Support']
          },
          {
            clientName: 'Pacific Import Export Co',
            revenue: 1125.00,
            hours: 2.5,
            avgRate: 450.00,
            services: ['International Tax Planning']
          },
          {
            clientName: 'Green Valley Organic Farms',
            revenue: 250.00,
            hours: 0.5,
            avgRate: 395.00,
            services: ['Estate Planning Consultation']
          }
        ],
        serviceTypeBreakdown: [
          { service: 'Tax Preparation', revenue: 6075.00, percentage: 32.9 },
          { service: 'CFO Services', revenue: 7000.00, percentage: 37.9 },
          { service: 'Audit Support', revenue: 5127.50, percentage: 27.8 },
          { service: 'Advisory Services', revenue: 250.00, percentage: 1.4 }
        ]
      },
      metadata: {
        generatedBy: 'automated_system',
        templateVersion: '2.1',
        dataSource: 'engagement_tracking'
      },
      generatedAt: subDays(now, 5),
      expiresAt: addDays(now, 90),
      downloadCount: 8,
      authorRole: 'admin'
    },
    {
      name: 'Tax Season Performance Dashboard - Q1 2024',
      description: 'Comprehensive tax season performance metrics including return counts, revenue, and efficiency metrics',
      reportType: 'performance_metrics',
      format: 'excel',
      status: 'completed',
      fileUrl: '/reports/taxpro/tax_season_q1_2024.xlsx',
      fileSize: 1234567,
      parameters: {
        reportPeriod: 'q1_2024',
        includeComparisons: true,
        previousYear: '2023',
        metricsType: 'tax_season'
      },
      data: {
        summary: {
          totalReturns: 125,
          corporateReturns: 35,
          individualReturns: 90,
          totalRevenue: 187500.00,
          averageReturnValue: 1500.00,
          efficiencyRatio: 92.5
        },
        teamPerformance: [
          {
            teamMember: 'Michael Chen',
            returnsCompleted: 45,
            revenue: 78750.00,
            avgHours: 5.2,
            clientSatisfaction: 4.8
          },
          {
            teamMember: 'David Johnson',
            returnsCompleted: 38,
            revenue: 65550.00,
            avgHours: 4.8,
            clientSatisfaction: 4.7
          },
          {
            teamMember: 'Jennifer Kim',
            returnsCompleted: 25,
            revenue: 28125.00,
            avgHours: 3.5,
            clientSatisfaction: 4.9
          }
        ],
        monthlyTrend: [
          { month: 'January', returns: 25, revenue: 37500.00 },
          { month: 'February', returns: 45, revenue: 67500.00 },
          { month: 'March', returns: 55, revenue: 82500.00 }
        ]
      },
      metadata: {
        generatedBy: 'michael_chen',
        includeGraphs: true,
        confidentialityLevel: 'internal'
      },
      generatedAt: subDays(now, 10),
      expiresAt: addDays(now, 365),
      downloadCount: 12,
      authorRole: 'owner'
    },
    {
      name: 'Client Profitability Analysis - 2023',
      description: 'Annual client profitability analysis with recommendations for service pricing and client portfolio optimization',
      reportType: 'profitability_analysis',
      format: 'pdf',
      status: 'completed',
      fileUrl: '/reports/taxpro/client_profitability_2023.pdf',
      fileSize: 3456789,
      parameters: {
        reportPeriod: '2023',
        includeRecommendations: true,
        analysisType: 'client_profitability',
        confidential: true
      },
      data: {
        summary: {
          totalClients: 85,
          profitableClients: 72,
          marginThreshold: 35.0,
          avgClientValue: 8750.00,
          topClientContribution: 45.2
        },
        clientSegments: [
          {
            segment: 'High Value (>$15k)',
            clientCount: 12,
            avgRevenue: 28500.00,
            avgMargin: 48.5,
            revenueContribution: 42.3
          },
          {
            segment: 'Medium Value ($5k-$15k)',
            clientCount: 35,
            avgRevenue: 9250.00,
            avgMargin: 38.2,
            revenueContribution: 39.8
          },
          {
            segment: 'Low Value (<$5k)',
            clientCount: 38,
            avgRevenue: 2850.00,
            avgMargin: 25.1,
            revenueContribution: 17.9
          }
        ],
        recommendations: [
          'Increase focus on high-value client retention',
          'Review pricing for low-margin services',
          'Consider minimum engagement fees',
          'Develop premium service packages'
        ]
      },
      metadata: {
        analysisMethod: 'abc_analysis',
        benchmarkData: 'industry_standards',
        confidentialityLevel: 'partner_only'
      },
      generatedAt: subDays(now, 45),
      expiresAt: addDays(now, 720),
      downloadCount: 6,
      authorRole: 'owner'
    }
  ],
  'qbadvisory': [
    {
      name: 'QuickBooks Advisory - Monthly Operations Report',
      description: 'Monthly operational metrics including client satisfaction, project completion rates, and team utilization',
      reportType: 'operational_metrics',
      format: 'pdf',
      status: 'completed',
      fileUrl: '/reports/qbadvisory/monthly_operations_march_2024.pdf',
      fileSize: 1876543,
      parameters: {
        reportPeriod: 'march_2024',
        includeTeamMetrics: true,
        includeClientFeedback: true
      },
      data: {
        summary: {
          activeClients: 24,
          projectsCompleted: 8,
          avgProjectValue: 1875.00,
          teamUtilization: 87.5,
          clientSatisfaction: 4.6
        },
        serviceMetrics: [
          {
            service: 'QuickBooks Implementation',
            projectsCompleted: 3,
            avgDuration: 15.5,
            clientSatisfaction: 4.8,
            revenue: 7500.00
          },
          {
            service: 'Monthly Bookkeeping',
            clientsServed: 18,
            avgMonthlyFee: 675.00,
            onTimeDelivery: 94.4,
            revenue: 12150.00
          },
          {
            service: 'Advisory Services',
            hoursDelivered: 45.5,
            avgHourlyRate: 185.00,
            clientRetention: 96.7,
            revenue: 8417.50
          }
        ],
        clientFeedback: {
          averageRating: 4.6,
          responseRate: 78.3,
          primaryStrengths: ['Technical expertise', 'Responsiveness', 'Problem solving'],
          improvementAreas: ['Communication frequency', 'Project timelines']
        }
      },
      metadata: {
        surveyPeriod: 'march_2024',
        responseCount: 19,
        benchmarkComparison: true
      },
      generatedAt: subDays(now, 3),
      expiresAt: addDays(now, 60),
      downloadCount: 5,
      authorRole: 'owner'
    },
    {
      name: 'Technology Integration Success Report',
      description: 'Analysis of technology integration projects and their impact on client efficiency and satisfaction',
      reportType: 'technology_analysis',
      format: 'excel',
      status: 'completed',
      fileUrl: '/reports/qbadvisory/tech_integration_analysis.xlsx',
      fileSize: 987654,
      parameters: {
        analysisType: 'integration_success',
        timeframe: 'last_12_months',
        includeROI: true
      },
      data: {
        summary: {
          integrationsCompleted: 45,
          successRate: 91.1,
          avgImplementationTime: 12.5,
          clientEfficiencyGain: 34.2,
          avgROI: 285.7
        },
        integrationTypes: [
          {
            type: 'QuickBooks + Square POS',
            count: 15,
            successRate: 93.3,
            avgTimeReduction: 8.5,
            clientSatisfaction: 4.7
          },
          {
            type: 'QuickBooks + Bill.com',
            count: 12,
            successRate: 91.7,
            avgTimeReduction: 12.3,
            clientSatisfaction: 4.5
          },
          {
            type: 'QuickBooks + PayPal',
            count: 18,
            successRate: 88.9,
            avgTimeReduction: 5.2,
            clientSatisfaction: 4.4
          }
        ],
        clientOutcomes: {
          timesSavingsHours: 1245.8,
          errorReductionPercent: 67.3,
          processEfficiencyGain: 41.2,
          clientRetentionRate: 96.8
        }
      },
      metadata: {
        dataSource: 'project_tracking',
        surveyData: 'client_outcomes',
        benchmarkSource: 'industry_reports'
      },
      generatedAt: subDays(now, 15),
      expiresAt: addDays(now, 180),
      downloadCount: 8,
      authorRole: 'admin'
    }
  ],
  'smithjones': [
    {
      name: 'Smith & Jones - Quarterly Practice Review',
      description: 'Q1 2024 practice performance review including client metrics, financial performance, and growth opportunities',
      reportType: 'practice_review',
      format: 'pdf',
      status: 'completed',
      fileUrl: '/reports/smithjones/q1_2024_practice_review.pdf',
      fileSize: 1567890,
      parameters: {
        reportPeriod: 'q1_2024',
        includeGrowthAnalysis: true,
        benchmarkComparison: true
      },
      data: {
        summary: {
          totalClients: 42,
          activeClients: 38,
          newClients: 3,
          clientRetention: 94.7,
          quarterlyRevenue: 28500.00,
          profitMargin: 42.8
        },
        serviceBreakdown: [
          {
            service: 'Individual Tax Returns',
            clientCount: 28,
            revenue: 18200.00,
            avgFee: 650.00,
            margin: 48.5
          },
          {
            service: 'Small Business Tax',
            clientCount: 8,
            revenue: 6400.00,
            avgFee: 800.00,
            margin: 52.3
          },
          {
            service: 'Bookkeeping Services',
            clientCount: 6,
            revenue: 2700.00,
            avgFee: 450.00,
            margin: 28.9
          },
          {
            service: 'Business Advisory',
            clientCount: 2,
            revenue: 1200.00,
            avgFee: 600.00,
            margin: 38.7
          }
        ],
        growthMetrics: {
          revenueGrowthYoY: 8.3,
          clientGrowthYoY: 5.7,
          avgClientValueGrowth: 12.1,
          marketShareLocal: 3.2
        },
        recommendations: [
          'Expand bookkeeping services marketing',
          'Increase individual tax return fees by 8%',
          'Develop estate planning service offering',
          'Consider part-time staff addition for tax season'
        ]
      },
      metadata: {
        benchmarkSource: 'aicpa_practice_management',
        localMarketData: 'oregon_cpa_society',
        confidentialityLevel: 'internal'
      },
      generatedAt: subDays(now, 8),
      expiresAt: addDays(now, 365),
      downloadCount: 4,
      authorRole: 'owner'
    },
    {
      name: 'Tax Season Efficiency Report - 2024',
      description: 'Analysis of 2024 tax season efficiency, workflow optimization, and capacity planning for future seasons',
      reportType: 'efficiency_analysis',
      format: 'excel',
      status: 'completed',
      fileUrl: '/reports/smithjones/tax_season_efficiency_2024.xlsx',
      fileSize: 654321,
      parameters: {
        analysisType: 'workflow_efficiency',
        season: '2024',
        includeCapacityPlanning: true
      },
      data: {
        summary: {
          totalReturns: 68,
          avgPreparationTime: 3.2,
          peakWeekReturns: 12,
          utilizationRate: 82.5,
          qualityScore: 96.8
        },
        workflowAnalysis: {
          intake: { avgTime: 0.8, efficiency: 'good' },
          preparation: { avgTime: 2.1, efficiency: 'excellent' },
          review: { avgTime: 0.3, efficiency: 'good' },
          clientMeeting: { avgTime: 0.5, efficiency: 'fair' },
          filing: { avgTime: 0.2, efficiency: 'excellent' }
        },
        capacityAnalysis: {
          currentCapacity: 75,
          actualVolume: 68,
          utilizationRate: 90.7,
          bottlenecks: ['Client meeting scheduling', 'Document collection'],
          recommendedCapacity: 85
        },
        improvements: [
          'Implement electronic document portal',
          'Standardize client meeting templates',
          'Consider seasonal staff for peak weeks',
          'Upgrade tax software for efficiency gains'
        ]
      },
      metadata: {
        analysisMethod: 'time_motion_study',
        dataPeriod: 'january_april_2024',
        includeStaffFeedback: true
      },
      generatedAt: subDays(now, 20),
      expiresAt: addDays(now, 365),
      downloadCount: 3,
      authorRole: 'owner'
    }
  ]
};

export const reportTypes = [
  'financial_summary',      // Financial summary reports
  'engagement_summary',     // Engagement and project summaries
  'time_tracking',         // Time tracking and utilization reports
  'profitability_analysis', // Client and service profitability
  'performance_metrics',   // Team and individual performance
  'operational_metrics',   // Operational efficiency metrics
  'technology_analysis',   // Technology and system analysis
  'practice_review',       // Overall practice performance
  'efficiency_analysis',   // Workflow and process efficiency
  'client_analytics',      // Client behavior and trends
  'compliance_summary',    // Compliance and regulatory reports
  'custom'                 // Custom report types
];

export const reportFormats = [
  'pdf',      // PDF format
  'excel',    // Excel spreadsheet
  'csv',      // CSV data export
  'html',     // HTML report
  'json',     // JSON data format
  'dashboard' // Interactive dashboard
];

export const reportStatuses = [
  'generating',  // Report is being generated
  'completed',   // Report completed successfully
  'failed',      // Report generation failed
  'queued',      // Report queued for generation
  'cancelled',   // Report generation cancelled
  'archived'     // Report archived
];

export const reportTemplates = {
  'monthly_financial': {
    name: 'Monthly Financial Summary',
    description: 'Standard monthly financial performance summary',
    sections: ['executive_summary', 'revenue_analysis', 'expense_breakdown', 'profitability', 'trends'],
    defaultParameters: {
      includeComparisons: true,
      includeGraphs: true,
      detailLevel: 'summary'
    }
  },
  'client_profitability': {
    name: 'Client Profitability Analysis',
    description: 'Detailed analysis of client profitability and value',
    sections: ['client_ranking', 'service_analysis', 'margin_analysis', 'recommendations'],
    defaultParameters: {
      rankingMethod: 'revenue',
      includeMargins: true,
      confidential: true
    }
  },
  'performance_dashboard': {
    name: 'Team Performance Dashboard',
    description: 'Interactive dashboard showing team performance metrics',
    sections: ['kpi_overview', 'individual_metrics', 'team_comparisons', 'trends'],
    defaultParameters: {
      updateFrequency: 'daily',
      includeGoals: true,
      showTrends: true
    }
  },
  'tax_season_summary': {
    name: 'Tax Season Summary',
    description: 'Comprehensive tax season performance and efficiency report',
    sections: ['volume_summary', 'efficiency_metrics', 'quality_scores', 'capacity_analysis'],
    defaultParameters: {
      includeComparisons: true,
      detailLevel: 'detailed',
      includerecommendations: true
    }
  }
};

export const reportSchedules = [
  'daily',      // Daily reports
  'weekly',     // Weekly reports
  'monthly',    // Monthly reports
  'quarterly',  // Quarterly reports
  'annually',   // Annual reports
  'on_demand'   // On-demand generation
];