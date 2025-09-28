import { subDays, subMonths } from 'date-fns';

const now = new Date();

export const documentsData = {
  'taxpro': [
    // TechFlow Solutions Documents
    {
      clientName: 'TechFlow Solutions Inc',
      documents: [
        {
          fileName: 'TechFlow_2023_Audited_Financial_Statements.pdf',
          fileUrl: '/uploads/documents/techflow/TechFlow_2023_Audited_Financial_Statements.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 2458624, // ~2.4MB
          category: 'financial_statement',
          subcategory: 'audited_financials',
          year: 2023,
          quarter: null,
          version: 1,
          isLatestVersion: true,
          tags: ['audited', 'year_end', '2023', 'financial_statements'],
          description: 'Audited financial statements for year ended December 31, 2023',
          uploadedBy: 'senior_cpa',
          extractedData: {
            totalRevenue: 2450000.00,
            netIncome: 385000.00,
            totalAssets: 1250000.00,
            totalLiabilities: 485000.00,
            auditFirm: 'Independent Auditors LLP'
          },
          metadata: {
            originalFileName: 'TechFlow_2023_Audited_FS_Final.pdf',
            auditOpinion: 'unqualified',
            pageCount: 35
          },
          checksum: 'a1b2c3d4e5f6g7h8i9j0',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        },
        {
          fileName: 'TechFlow_2023_General_Ledger.xlsx',
          fileUrl: '/uploads/documents/techflow/TechFlow_2023_General_Ledger.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 8945123, // ~8.9MB
          category: 'financial_data',
          subcategory: 'general_ledger',
          year: 2023,
          quarter: null,
          version: 1,
          isLatestVersion: true,
          tags: ['general_ledger', '2023', 'trial_balance'],
          description: 'Complete general ledger detail for 2023',
          uploadedBy: 'cpa',
          extractedData: {
            accountCount: 156,
            transactionCount: 8947,
            periodStart: '2023-01-01',
            periodEnd: '2023-12-31'
          },
          metadata: {
            software: 'NetSuite',
            exportDate: '2024-01-15'
          },
          checksum: 'b2c3d4e5f6g7h8i9j0k1',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        },
        {
          fileName: 'RD_Credit_Documentation_2023.pdf',
          fileUrl: '/uploads/documents/techflow/RD_Credit_Documentation_2023.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 1567890,
          category: 'tax_document',
          subcategory: 'rd_credit',
          year: 2023,
          quarter: null,
          version: 2,
          isLatestVersion: true,
          tags: ['rd_credit', 'research_development', 'tax_credit', '2023'],
          description: 'Research and development credit documentation and calculations',
          uploadedBy: 'senior_cpa',
          extractedData: {
            qualifiedExpenses: 450000.00,
            federalCredit: 45000.00,
            californiaCredit: 27000.00
          },
          metadata: {
            preparedBy: 'David Johnson, CPA',
            reviewedBy: 'Michael Chen, CPA'
          },
          checksum: 'c3d4e5f6g7h8i9j0k1l2',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        },
        {
          fileName: 'Stock_Compensation_Analysis_2023.xlsx',
          fileUrl: '/uploads/documents/techflow/Stock_Compensation_Analysis_2023.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 734521,
          category: 'tax_document',
          subcategory: 'stock_compensation',
          year: 2023,
          quarter: null,
          version: 1,
          isLatestVersion: true,
          tags: ['stock_options', 'asc718', 'compensation', 'tax_analysis'],
          description: 'Analysis of stock-based compensation for tax purposes',
          uploadedBy: 'senior_cpa',
          extractedData: {
            optionsGranted: 25000,
            exercisesInYear: 8500,
            bookTaxDifference: 125000.00
          },
          metadata: {
            vestingSchedule: '4_year_cliff',
            planType: 'ISO_and_NQSO'
          },
          checksum: 'd4e5f6g7h8i9j0k1l2m3',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        }
      ]
    },
    // Golden Gate Medical Group Documents
    {
      clientName: 'Golden Gate Medical Group',
      documents: [
        {
          fileName: 'GGMG_March_2024_Board_Package.pdf',
          fileUrl: '/uploads/documents/ggmg/GGMG_March_2024_Board_Package.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 3456789,
          category: 'financial_statement',
          subcategory: 'board_package',
          year: 2024,
          quarter: 1,
          version: 1,
          isLatestVersion: true,
          tags: ['board_package', 'march_2024', 'financial_statements', 'kpi'],
          description: 'Board package for March 2024 including financials and KPIs',
          uploadedBy: 'senior_cpa',
          extractedData: {
            revenue: 187500.00,
            expenses: 142300.00,
            netIncome: 45200.00,
            patientCount: 1247,
            avgRevenuePerPatient: 150.40
          },
          metadata: {
            boardMeetingDate: '2024-04-10',
            preparedFor: 'Board of Directors'
          },
          checksum: 'e5f6g7h8i9j0k1l2m3n4',
          isConfidential: true,
          retentionDate: new Date('2031-12-31')
        },
        {
          fileName: 'Cash_Flow_Forecast_Q2_2024.xlsx',
          fileUrl: '/uploads/documents/ggmg/Cash_Flow_Forecast_Q2_2024.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 567890,
          category: 'financial_analysis',
          subcategory: 'cash_flow_forecast',
          year: 2024,
          quarter: 2,
          version: 3,
          isLatestVersion: true,
          tags: ['cash_flow', 'forecast', 'q2_2024', 'projection'],
          description: '13-week rolling cash flow forecast for Q2 2024',
          uploadedBy: 'senior_cpa',
          extractedData: {
            projectedInflow: 750000.00,
            projectedOutflow: 685000.00,
            netCashFlow: 65000.00,
            endingCashBalance: 245000.00
          },
          metadata: {
            forecastPeriod: '13_weeks',
            assumptions: 'Conservative growth scenario'
          },
          checksum: 'f6g7h8i9j0k1l2m3n4o5',
          isConfidential: true,
          retentionDate: new Date('2027-12-31')
        }
      ]
    },
    // Bay Area Real Estate Holdings Documents
    {
      clientName: 'Bay Area Real Estate Holdings LLC',
      documents: [
        {
          fileName: 'BARE_2023_Rental_Income_Schedule.xlsx',
          fileUrl: '/uploads/documents/bare/BARE_2023_Rental_Income_Schedule.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 1234567,
          category: 'tax_document',
          subcategory: 'rental_income',
          year: 2023,
          quarter: null,
          version: 1,
          isLatestVersion: true,
          tags: ['rental_income', 'schedule_e', 'real_estate', '2023'],
          description: 'Detailed rental income and expense schedule for all properties',
          uploadedBy: 'cpa',
          extractedData: {
            totalRentalIncome: 8750000.00,
            totalExpenses: 3250000.00,
            netRentalIncome: 5500000.00,
            propertyCount: 12
          },
          metadata: {
            propertyTypes: ['residential', 'commercial'],
            locations: ['San Francisco', 'Oakland', 'San Jose']
          },
          checksum: 'g7h8i9j0k1l2m3n4o5p6',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        },
        {
          fileName: 'Depreciation_Schedules_2023.pdf',
          fileUrl: '/uploads/documents/bare/Depreciation_Schedules_2023.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 2345678,
          category: 'tax_document',
          subcategory: 'depreciation',
          year: 2023,
          quarter: null,
          version: 1,
          isLatestVersion: true,
          tags: ['depreciation', 'real_estate', 'macrs', '2023'],
          description: 'MACRS depreciation schedules for all rental properties',
          uploadedBy: 'cpa',
          extractedData: {
            totalDepreciation: 1250000.00,
            newAdditions: 2500000.00,
            dispositions: 0.00
          },
          metadata: {
            depreciationMethod: 'MACRS',
            recaptureRisk: 'high'
          },
          checksum: 'h8i9j0k1l2m3n4o5p6q7',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        }
      ]
    }
  ],
  'qbadvisory': [
    // Austin Coffee Collective Documents
    {
      clientName: 'Austin Coffee Collective',
      documents: [
        {
          fileName: 'ACC_QuickBooks_Setup_Guide.pdf',
          fileUrl: '/uploads/documents/acc/ACC_QuickBooks_Setup_Guide.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 1876543,
          category: 'training_material',
          subcategory: 'quickbooks_setup',
          year: 2024,
          quarter: 1,
          version: 2,
          isLatestVersion: true,
          tags: ['quickbooks', 'setup_guide', 'training', 'coffee_shop'],
          description: 'Custom QuickBooks setup guide for coffee shop operations',
          uploadedBy: 'cpa',
          extractedData: {
            accountCount: 85,
            itemCount: 45,
            customerCount: 0,
            vendorCount: 25
          },
          metadata: {
            qbVersion: 'QuickBooks Online Plus',
            setupDate: '2024-01-15'
          },
          checksum: 'i9j0k1l2m3n4o5p6q7r8',
          isConfidential: false,
          retentionDate: new Date('2027-12-31')
        },
        {
          fileName: 'Square_POS_Integration_Test.xlsx',
          fileUrl: '/uploads/documents/acc/Square_POS_Integration_Test.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 456789,
          category: 'technical_documentation',
          subcategory: 'integration_testing',
          year: 2024,
          quarter: 1,
          version: 1,
          isLatestVersion: true,
          tags: ['square_pos', 'integration', 'testing', 'quickbooks'],
          description: 'Integration testing results for Square POS to QuickBooks sync',
          uploadedBy: 'staff',
          extractedData: {
            testTransactions: 50,
            successfulSyncs: 48,
            syncAccuracy: 96.0,
            errorCount: 2
          },
          metadata: {
            testDate: '2024-02-01',
            integrationApp: 'Square Connector'
          },
          checksum: 'j0k1l2m3n4o5p6q7r8s9',
          isConfidential: false,
          retentionDate: new Date('2027-12-31')
        }
      ]
    },
    // Lone Star Consulting Documents
    {
      clientName: 'Lone Star Consulting Group',
      documents: [
        {
          fileName: 'LSC_March_2024_Financial_Statements.pdf',
          fileUrl: '/uploads/documents/lsc/LSC_March_2024_Financial_Statements.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 1345678,
          category: 'financial_statement',
          subcategory: 'monthly_financials',
          year: 2024,
          quarter: 1,
          version: 1,
          isLatestVersion: true,
          tags: ['financial_statements', 'march_2024', 'consulting'],
          description: 'Monthly financial statements for March 2024',
          uploadedBy: 'cpa',
          extractedData: {
            revenue: 125000.00,
            expenses: 87500.00,
            netIncome: 37500.00,
            cashBalance: 145000.00
          },
          metadata: {
            preparationDate: '2024-04-08',
            reportingStandard: 'GAAP'
          },
          checksum: 'k1l2m3n4o5p6q7r8s9t0',
          isConfidential: true,
          retentionDate: new Date('2031-12-31')
        },
        {
          fileName: 'LSC_Management_Dashboard_Q1_2024.xlsx',
          fileUrl: '/uploads/documents/lsc/LSC_Management_Dashboard_Q1_2024.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 678901,
          category: 'management_report',
          subcategory: 'kpi_dashboard',
          year: 2024,
          quarter: 1,
          version: 1,
          isLatestVersion: true,
          tags: ['kpi', 'dashboard', 'q1_2024', 'management_report'],
          description: 'Q1 2024 management dashboard with key performance indicators',
          uploadedBy: 'cpa',
          extractedData: {
            utilization: 87.5,
            avgHourlyRate: 165.00,
            clientCount: 15,
            projectCount: 23
          },
          metadata: {
            reportPeriod: 'Q1 2024',
            currency: 'USD'
          },
          checksum: 'l2m3n4o5p6q7r8s9t0u1',
          isConfidential: true,
          retentionDate: new Date('2027-12-31')
        }
      ]
    }
  ],
  'smithjones': [
    // Portland Family Dentistry Documents
    {
      clientName: 'Portland Family Dentistry',
      documents: [
        {
          fileName: 'PFD_2023_Individual_Tax_Return.pdf',
          fileUrl: '/uploads/documents/pfd/PFD_2023_Individual_Tax_Return.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 1567890,
          category: 'tax_return',
          subcategory: 'form_1040',
          year: 2023,
          quarter: null,
          version: 1,
          isLatestVersion: true,
          tags: ['form_1040', '2023', 'individual_return', 'schedule_e'],
          description: 'Completed 2023 individual tax return for Dr. Lisa Chen',
          uploadedBy: 'senior_cpa',
          extractedData: {
            agi: 285000.00,
            taxableIncome: 245000.00,
            taxLiability: 52000.00,
            refundAmount: 3500.00
          },
          metadata: {
            filingStatus: 'married_filing_jointly',
            hasScheduleE: true,
            efileDate: '2024-03-15'
          },
          checksum: 'm3n4o5p6q7r8s9t0u1v2',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        },
        {
          fileName: 'Rental_Property_Schedule_E.xlsx',
          fileUrl: '/uploads/documents/pfd/Rental_Property_Schedule_E.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 345678,
          category: 'tax_document',
          subcategory: 'schedule_e',
          year: 2023,
          quarter: null,
          version: 1,
          isLatestVersion: true,
          tags: ['schedule_e', 'rental_income', '2023', 'portland'],
          description: 'Schedule E rental income and expenses for Portland rental property',
          uploadedBy: 'staff',
          extractedData: {
            rentalIncome: 48000.00,
            totalExpenses: 28500.00,
            netRentalIncome: 19500.00,
            depreciation: 8500.00
          },
          metadata: {
            propertyAddress: '123 Rental St, Portland, OR',
            propertyType: 'residential_duplex'
          },
          checksum: 'n4o5p6q7r8s9t0u1v2w3',
          isConfidential: true,
          retentionDate: new Date('2030-12-31')
        }
      ]
    },
    // Mountain View Landscaping Documents
    {
      clientName: 'Mountain View Landscaping',
      documents: [
        {
          fileName: 'MVL_Q1_2024_Bank_Statements.pdf',
          fileUrl: '/uploads/documents/mvl/MVL_Q1_2024_Bank_Statements.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 2345678,
          category: 'financial_data',
          subcategory: 'bank_statements',
          year: 2024,
          quarter: 1,
          version: 1,
          isLatestVersion: true,
          tags: ['bank_statements', 'q1_2024', 'quarterly'],
          description: 'Q1 2024 bank statements for all business accounts',
          uploadedBy: 'staff',
          extractedData: {
            jan_endBalance: 45000.00,
            feb_endBalance: 52000.00,
            mar_endBalance: 38000.00,
            totalDeposits: 95000.00
          },
          metadata: {
            bankName: 'Oregon Community Bank',
            accountCount: 2
          },
          checksum: 'o5p6q7r8s9t0u1v2w3x4',
          isConfidential: true,
          retentionDate: new Date('2031-12-31')
        },
        {
          fileName: 'Equipment_Depreciation_Schedule.xlsx',
          fileUrl: '/uploads/documents/mvl/Equipment_Depreciation_Schedule.xlsx',
          fileType: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 456789,
          category: 'tax_document',
          subcategory: 'depreciation_schedule',
          year: 2024,
          quarter: 1,
          version: 1,
          isLatestVersion: true,
          tags: ['depreciation', 'equipment', 'landscaping', 'macrs'],
          description: 'Depreciation schedule for landscaping equipment and vehicles',
          uploadedBy: 'senior_cpa',
          extractedData: {
            totalAssetValue: 125000.00,
            annualDepreciation: 18500.00,
            q1Depreciation: 4625.00,
            assetCount: 15
          },
          metadata: {
            depreciationMethod: 'MACRS',
            assetCategories: ['vehicles', 'equipment', 'tools']
          },
          checksum: 'p6q7r8s9t0u1v2w3x4y5',
          isConfidential: true,
          retentionDate: new Date('2031-12-31')
        }
      ]
    }
  ]
};

export const documentCategories = [
  'tax_return',           // Completed tax returns
  'tax_document',         // Tax-related documents
  'financial_statement',  // Financial statements
  'financial_data',       // Raw financial data
  'receipt',             // Receipts and invoices
  'contract',            // Contracts and agreements
  'legal_document',      // Legal documents
  'correspondence',      // Client correspondence
  'working_paper',       // Working papers
  'management_report',   // Management reports
  'audit_document',      // Audit-related documents
  'compliance_document', // Compliance documents
  'training_material',   // Training and reference materials
  'technical_documentation', // Technical documentation
  'financial_analysis'   // Financial analysis documents
];

export const documentSubcategories = {
  'tax_return': ['form_1040', 'form_1120', 'form_1065', 'form_1120s', 'form_990'],
  'tax_document': ['w2', 'w4', '1099', 'schedule_k1', 'schedule_e', 'depreciation_schedule', 'rd_credit', 'stock_compensation'],
  'financial_statement': ['balance_sheet', 'income_statement', 'cash_flow', 'audited_financials', 'reviewed_financials', 'compiled_financials', 'monthly_financials', 'board_package'],
  'financial_data': ['general_ledger', 'trial_balance', 'bank_statements', 'credit_card_statements'],
  'receipt': ['business_expense', 'equipment_purchase', 'software_subscription', 'office_expense'],
  'contract': ['service_agreement', 'lease_agreement', 'employment_contract', 'vendor_contract'],
  'management_report': ['kpi_dashboard', 'variance_analysis', 'budget_report', 'cash_flow_forecast'],
  'training_material': ['quickbooks_setup', 'procedure_manual', 'best_practices'],
  'technical_documentation': ['integration_testing', 'system_requirements', 'api_documentation']
};

export const documentRetentionPolicies = {
  'tax_return': 7,           // 7 years
  'tax_document': 7,         // 7 years
  'financial_statement': 7,  // 7 years
  'financial_data': 7,       // 7 years
  'receipt': 7,              // 7 years
  'contract': 7,             // 7 years or until expiration + 1 year
  'legal_document': 10,      // 10 years
  'correspondence': 3,       // 3 years
  'working_paper': 7,        // 7 years
  'management_report': 3,    // 3 years
  'audit_document': 7,       // 7 years
  'compliance_document': 7,  // 7 years
  'training_material': 3,    // 3 years
  'technical_documentation': 3 // 3 years
};