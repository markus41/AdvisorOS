import { addDays, subDays, addMonths, subMonths } from 'date-fns';

const now = new Date();

export const engagementsData = {
  'taxpro': [
    {
      name: '2023 Corporate Tax Return - TechFlow Solutions',
      description: 'Preparation of Form 1120 corporate tax return for TechFlow Solutions Inc including book-tax adjustments and tax planning strategies',
      type: 'tax_preparation',
      status: 'in_progress',
      priority: 'high',
      startDate: subDays(now, 45),
      dueDate: addDays(now, 15), // Due soon
      estimatedHours: 18.0,
      actualHours: 12.5,
      hourlyRate: 275.00,
      fixedFee: null,
      year: 2023,
      quarter: null,
      customFields: {
        taxYear: 2023,
        entityType: 'C-Corporation',
        complexityLevel: 'high',
        specialConsiderations: ['R&D credits', 'Stock compensation', 'Multi-state taxation']
      }
    },
    {
      name: 'Monthly CFO Services - Golden Gate Medical',
      description: 'Comprehensive CFO services including financial analysis, cash flow management, and board reporting',
      type: 'cfo_services',
      status: 'in_progress',
      priority: 'high',
      startDate: subMonths(now, 6),
      dueDate: addMonths(now, 6), // Ongoing engagement
      estimatedHours: 20.0,
      actualHours: 120.5, // Accumulated over months
      hourlyRate: 350.00,
      fixedFee: 3500.00, // Monthly retainer
      year: 2024,
      quarter: null,
      customFields: {
        serviceType: 'monthly_retainer',
        meetingFrequency: 'weekly',
        reportingRequirements: ['monthly_financials', 'board_package', 'cash_flow_forecast']
      }
    },
    {
      name: 'Year-End Audit Support - Bay Area Real Estate',
      description: 'Audit support services for year-end financial statement audit including journal entry preparation and workpaper support',
      type: 'audit',
      status: 'completed',
      priority: 'normal',
      startDate: subDays(now, 90),
      dueDate: subDays(now, 30),
      completedDate: subDays(now, 25),
      estimatedHours: 35.0,
      actualHours: 38.5,
      hourlyRate: 265.00,
      fixedFee: null,
      year: 2023,
      quarter: 4,
      customFields: {
        auditFirm: 'External Audit Partners LLP',
        auditType: 'financial_statement_audit',
        materialityLevel: 'high'
      }
    },
    {
      name: 'International Tax Compliance - Pacific Import Export',
      description: 'International tax compliance including transfer pricing documentation and foreign tax credit analysis',
      type: 'tax_preparation',
      status: 'planning',
      priority: 'high',
      startDate: addDays(now, 10),
      dueDate: addDays(now, 75),
      estimatedHours: 45.0,
      actualHours: 0.0,
      hourlyRate: 450.00,
      fixedFee: null,
      year: 2023,
      quarter: null,
      customFields: {
        scope: ['transfer_pricing', 'foreign_tax_credits', 'subpart_f'],
        countries: ['China', 'Japan', 'South Korea'],
        complexityLevel: 'very_high'
      }
    },
    {
      name: 'Estate Tax Planning - Green Valley Organic Farms',
      description: 'Comprehensive estate and succession planning for family-owned agricultural business',
      type: 'advisory',
      status: 'in_progress',
      priority: 'normal',
      startDate: subDays(now, 30),
      dueDate: addDays(now, 60),
      estimatedHours: 25.0,
      actualHours: 8.0,
      hourlyRate: 395.00,
      fixedFee: null,
      year: 2024,
      quarter: null,
      customFields: {
        planningAreas: ['succession_planning', 'estate_tax_minimization', 'gift_strategies'],
        familyMembers: 4,
        estimatedEstateTax: 2500000
      }
    }
  ],
  'qbadvisory': [
    {
      name: 'QuickBooks Implementation - Austin Coffee Collective',
      description: 'Complete QuickBooks Online setup with chart of accounts design and staff training',
      type: 'advisory',
      status: 'completed',
      priority: 'normal',
      startDate: subDays(now, 60),
      dueDate: subDays(now, 30),
      completedDate: subDays(now, 28),
      estimatedHours: 12.0,
      actualHours: 14.5,
      hourlyRate: 175.00,
      fixedFee: 2500.00,
      year: 2024,
      quarter: 1,
      customFields: {
        qbVersion: 'QuickBooks Online Plus',
        integrations: ['Square POS', 'PayPal', 'Bill.com'],
        trainingHours: 4
      }
    },
    {
      name: 'Monthly Bookkeeping - Lone Star Consulting',
      description: 'Monthly bookkeeping and financial statement preparation with management reporting',
      type: 'bookkeeping',
      status: 'in_progress',
      priority: 'normal',
      startDate: subMonths(now, 8),
      dueDate: addMonths(now, 4), // Ongoing monthly
      estimatedHours: 8.0,
      actualHours: 64.0, // 8 months accumulated
      hourlyRate: 125.00,
      fixedFee: 750.00, // Monthly fee
      year: 2024,
      quarter: null,
      customFields: {
        frequency: 'monthly',
        deliverables: ['P&L', 'Balance Sheet', 'Cash Flow', 'Management Dashboard'],
        clientMeetings: 'quarterly'
      }
    },
    {
      name: '2023 Tax Return - Hill Country Construction',
      description: 'Business tax return preparation for construction company with job costing analysis',
      type: 'tax_preparation',
      status: 'review',
      priority: 'high',
      startDate: subDays(now, 25),
      dueDate: addDays(now, 20),
      estimatedHours: 15.0,
      actualHours: 13.5,
      hourlyRate: 165.00,
      fixedFee: null,
      year: 2023,
      quarter: null,
      customFields: {
        businessType: 'Construction',
        specialAreas: ['job_costing', 'equipment_depreciation', 'contract_accounting'],
        formTypes: ['1120S', 'K-1s']
      }
    },
    {
      name: 'Financial Analysis - Music City Retail',
      description: 'Comprehensive financial analysis to support business expansion planning and loan application',
      type: 'advisory',
      status: 'in_progress',
      priority: 'high',
      startDate: subDays(now, 15),
      dueDate: addDays(now, 30),
      estimatedHours: 20.0,
      actualHours: 6.5,
      hourlyRate: 195.00,
      fixedFee: null,
      year: 2024,
      quarter: 1,
      customFields: {
        purpose: 'expansion_financing',
        loanAmount: 500000,
        deliverables: ['cash_flow_projections', 'financial_ratios', 'business_plan_support']
      }
    }
  ],
  'smithjones': [
    {
      name: '2023 Individual Tax Return - Dr. Lisa Chen',
      description: 'Individual tax return preparation for medical professional with rental property income',
      type: 'tax_preparation',
      status: 'completed',
      priority: 'normal',
      startDate: subDays(now, 45),
      dueDate: subDays(now, 15),
      completedDate: subDays(now, 10),
      estimatedHours: 4.0,
      actualHours: 4.5,
      hourlyRate: 150.00,
      fixedFee: null,
      year: 2023,
      quarter: null,
      customFields: {
        formTypes: ['1040', 'Schedule E'],
        complexityFactors: ['rental_income', 'medical_expenses', 'retirement_contributions'],
        stateReturn: 'Oregon'
      }
    },
    {
      name: 'Quarterly Bookkeeping - Mountain View Landscaping',
      description: 'Quarterly bookkeeping cleanup and sales tax preparation for landscaping business',
      type: 'bookkeeping',
      status: 'in_progress',
      priority: 'normal',
      startDate: subDays(now, 20),
      dueDate: addDays(now, 10),
      estimatedHours: 6.0,
      actualHours: 3.5,
      hourlyRate: 85.00,
      fixedFee: 450.00,
      year: 2024,
      quarter: 1,
      customFields: {
        frequency: 'quarterly',
        services: ['transaction_categorization', 'bank_reconciliation', 'sales_tax_prep'],
        software: 'QuickBooks Desktop'
      }
    },
    {
      name: 'Business Setup - Pacific Northwest Consulting',
      description: 'New business entity setup and initial tax planning consultation',
      type: 'advisory',
      status: 'completed',
      priority: 'low',
      startDate: subDays(now, 90),
      dueDate: subDays(now, 60),
      completedDate: subDays(now, 55),
      estimatedHours: 3.0,
      actualHours: 3.5,
      hourlyRate: 175.00,
      fixedFee: 750.00,
      year: 2024,
      quarter: 1,
      customFields: {
        entityType: 'LLC',
        state: 'Oregon',
        services: ['entity_formation', 'ein_application', 'initial_tax_consultation']
      }
    }
  ]
};

export const engagementStatuses = [
  'planning',     // Initial planning phase
  'in_progress',  // Work is actively being performed
  'review',       // Work completed, under review
  'completed',    // Successfully completed
  'on_hold',      // Temporarily paused
  'cancelled'     // Cancelled by client or firm
];

export const engagementPriorities = [
  'low',      // Can be delayed if needed
  'normal',   // Standard priority
  'high',     // Important, should be prioritized
  'urgent'    // Critical, immediate attention required
];

export const engagementTypes = [
  'tax_preparation',    // Tax return preparation
  'bookkeeping',       // Monthly/quarterly bookkeeping
  'advisory',          // Business advisory services
  'cfo_services',      // Outsourced CFO services
  'audit',             // Audit and assurance services
  'review',            // Review engagements
  'compilation',       // Compilation services
  'payroll',           // Payroll services
  'consulting',        // General consulting
  'year_end'           // Year-end closing services
];