import { addDays, subDays, addHours } from 'date-fns';

const now = new Date();

export const notesData = {
  'taxpro': [
    // TechFlow Solutions Notes
    {
      clientName: 'TechFlow Solutions Inc',
      engagementName: '2023 Corporate Tax Return - TechFlow Solutions',
      notes: [
        {
          title: 'R&D Credit Documentation Review',
          content: 'Reviewed R&D activities with Sarah Chang (CFO). Confirmed that the following activities qualify for federal R&D credit:\n\n1. Development of new AI-powered analytics platform\n2. Enhancement of existing data processing algorithms\n3. Integration of machine learning capabilities\n\nTotal qualified expenses: $450,000\nFederal credit (20%): $90,000\nCalifornia credit (15%): $67,500\n\nNeed to obtain detailed timesheets and contractor invoices to support the credit claim.',
          noteType: 'meeting',
          priority: 'high',
          isPrivate: false,
          tags: ['rd_credit', 'meeting_notes', 'tax_planning', 'documentation'],
          authorRole: 'senior_cpa',
          reminderDate: addDays(now, 3),
          createdAt: subDays(now, 18)
        },
        {
          title: 'Stock Compensation Timing Differences',
          content: 'Analysis of stock compensation differences between book and tax:\n\n- Book expense (ASC 718): $235,000\n- Tax deduction (actual exercises): $310,000\n- Excess tax benefit: $75,000\n\nThe excess benefit will be recorded as a reduction to income tax expense. Need to verify that all exercises were properly reported on Forms W-2.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['stock_compensation', 'book_tax_differences', 'asc718'],
          authorRole: 'senior_cpa',
          createdAt: subDays(now, 12)
        },
        {
          title: 'Multi-State Tax Considerations',
          content: 'TechFlow has nexus in the following states due to remote employees:\n- California (headquarters)\n- Texas (2 employees)\n- New York (1 employee)\n- Florida (1 employee)\n\nNeed to review state apportionment and ensure proper state returns are filed. May need to consider voluntary disclosure agreements for states where we haven\'t been filing.',
          noteType: 'follow_up',
          priority: 'high',
          isPrivate: false,
          tags: ['multi_state', 'nexus', 'apportionment', 'compliance'],
          authorRole: 'senior_cpa',
          reminderDate: addDays(now, 7),
          createdAt: subDays(now, 10)
        }
      ]
    },
    // Golden Gate Medical Group Notes
    {
      clientName: 'Golden Gate Medical Group',
      engagementName: 'Monthly CFO Services - Golden Gate Medical',
      notes: [
        {
          title: 'March Board Meeting Preparation',
          content: 'Prepared comprehensive board package for March 2024 meeting:\n\n- Financial statements show revenue growth of 8% over prior month\n- Cash flow remains strong with $245k ending balance\n- New patient acquisition up 15% year-over-year\n- Staff utilization at 87%, within target range\n\nKey discussion items for board:\n1. Expansion of services to include telehealth\n2. Equipment replacement schedule for 2024\n3. Potential acquisition of solo practice',
          noteType: 'meeting',
          priority: 'normal',
          isPrivate: false,
          tags: ['board_meeting', 'financial_reporting', 'kpi', 'strategic_planning'],
          authorRole: 'senior_cpa',
          createdAt: subDays(now, 8)
        },
        {
          title: 'Cash Flow Forecast Update',
          content: 'Updated 13-week rolling cash flow forecast:\n\n- Projected strong cash position through Q2\n- Insurance reimbursement timing remains consistent\n- Recommend maintaining $200k minimum cash balance\n- Consider investing excess cash in short-term CDs\n\nIdentified potential cash flow risk: Delayed Medicare reimbursements in July due to system updates. Monitoring closely.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['cash_flow', 'forecast', 'medicare', 'risk_management'],
          authorRole: 'senior_cpa',
          reminderDate: addDays(now, 14),
          createdAt: subDays(now, 3)
        },
        {
          title: 'PPP Loan Forgiveness Status',
          content: 'PPP loan forgiveness has been approved in full:\n- Original loan amount: $125,000\n- Forgiveness amount: $125,000\n- Forgiveness date: March 15, 2024\n\nNo tax implications as forgiveness is not taxable income. Documentation has been filed appropriately.',
          noteType: 'general',
          priority: 'low',
          isPrivate: false,
          tags: ['ppp_loan', 'forgiveness', 'covid_relief'],
          authorRole: 'cpa',
          createdAt: subDays(now, 20)
        }
      ]
    },
    // Pacific Import Export Notes
    {
      clientName: 'Pacific Import Export Co',
      engagementName: 'International Tax Compliance - Pacific Import Export',
      notes: [
        {
          title: 'Transfer Pricing Study Planning',
          content: 'Initial meeting with David Kim to discuss transfer pricing requirements:\n\n- Company has related party transactions with subsidiaries in China, Japan, and South Korea\n- Annual intercompany revenue: $8.5M\n- Need to document arm\'s length pricing for:\n  1. Management fees\n  2. Licensing agreements\n  3. Cost sharing arrangements\n\nRecommend engaging transfer pricing specialist for detailed study. Estimated cost: $45,000-$65,000.',
          noteType: 'meeting',
          priority: 'high',
          isPrivate: false,
          tags: ['transfer_pricing', 'international', 'related_parties', 'documentation'],
          authorRole: 'owner',
          reminderDate: addDays(now, 5),
          createdAt: subDays(now, 15)
        }
      ]
    }
  ],
  'qbadvisory': [
    // Austin Coffee Collective Notes
    {
      clientName: 'Austin Coffee Collective',
      engagementName: 'QuickBooks Implementation - Austin Coffee Collective',
      notes: [
        {
          title: 'QuickBooks Training Session Completed',
          content: 'Conducted 2-hour training session with Jake Martinez and his team:\n\n- Covered daily transaction entry procedures\n- Showed how to reconcile Square POS imports\n- Demonstrated basic reporting functions\n- Set up user permissions for staff\n\nTeam seems comfortable with the system. Provided quick reference guide and scheduled follow-up call in 2 weeks.',
          noteType: 'meeting',
          priority: 'normal',
          isPrivate: false,
          tags: ['training', 'quickbooks', 'implementation', 'user_adoption'],
          authorRole: 'cpa',
          reminderDate: addDays(now, 14),
          createdAt: subDays(now, 30)
        },
        {
          title: 'Square Integration Issues Resolved',
          content: 'Resolved sync issues between Square POS and QuickBooks:\n\n- Problem: Duplicate transactions appearing\n- Root cause: Multiple sync connections active\n- Solution: Disabled old connector, reconfigured new one\n- Testing: Verified 48/50 test transactions synced correctly\n\nRecommended client wait 24 hours before entering new transactions to ensure clean sync.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['square_pos', 'integration', 'troubleshooting', 'sync_issues'],
          authorRole: 'staff',
          createdAt: subDays(now, 35)
        }
      ]
    },
    // Lone Star Consulting Notes
    {
      clientName: 'Lone Star Consulting Group',
      engagementName: 'Monthly Bookkeeping - Lone Star Consulting',
      notes: [
        {
          title: 'March Bookkeeping Completed',
          content: 'Completed March 2024 bookkeeping:\n\n- Bank reconciliation: Clean, no discrepancies\n- Expense categorization: All transactions properly coded\n- Accounts receivable: $45,000 outstanding, aging looks good\n- Accounts payable: $12,000, all current\n\nFinancial statements prepared and sent to Rebecca. Revenue up 12% compared to March 2023.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['bookkeeping', 'march_2024', 'financial_statements', 'completed'],
          authorRole: 'cpa',
          createdAt: subDays(now, 2)
        },
        {
          title: 'Client Feedback on KPI Dashboard',
          content: 'Rebecca provided positive feedback on new KPI dashboard:\n\n- Loves the project profitability analysis\n- Wants to add client acquisition cost metric\n- Requests monthly trend charts for key metrics\n- Interested in automated alerts for unusual variances\n\nWill implement requested changes for April reporting.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['kpi_dashboard', 'client_feedback', 'enhancements', 'reporting'],
          authorRole: 'cpa',
          reminderDate: addDays(now, 10),
          createdAt: subDays(now, 5)
        }
      ]
    },
    // Hill Country Construction Notes
    {
      clientName: 'Hill Country Construction',
      engagementName: '2023 Tax Return - Hill Country Construction',
      notes: [
        {
          title: 'Job Costing Review Findings',
          content: 'Reviewed job costing methodology with Robert Davis:\n\n- Current system tracks direct costs well\n- Overhead allocation needs improvement\n- Recommend implementing percentage of completion accounting\n- Several projects show higher margins than expected\n\nWill prepare detailed job profitability analysis for tax planning purposes.',
          noteType: 'meeting',
          priority: 'normal',
          isPrivate: false,
          tags: ['job_costing', 'construction', 'methodology', 'profitability'],
          authorRole: 'cpa',
          createdAt: subDays(now, 20)
        },
        {
          title: 'Equipment Depreciation Planning',
          content: 'Reviewed equipment purchases for 2023:\n\n- New excavator: $125,000 (eligible for Section 179)\n- Truck fleet additions: $85,000\n- Tools and small equipment: $15,000\n\nRecommend taking full Section 179 deduction on excavator to maximize current year benefit. Total depreciation/Section 179: $225,000.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['equipment', 'depreciation', 'section_179', 'tax_planning'],
          authorRole: 'cpa',
          createdAt: subDays(now, 18)
        }
      ]
    }
  ],
  'smithjones': [
    // Portland Family Dentistry Notes
    {
      clientName: 'Portland Family Dentistry',
      engagementName: '2023 Individual Tax Return - Dr. Lisa Chen',
      notes: [
        {
          title: 'Rental Property Income Review',
          content: 'Reviewed rental property documentation with Dr. Chen:\n\n- Duplex property at 123 Rental St, Portland\n- Gross rental income: $48,000\n- Major repairs: $12,000 (new roof)\n- Regular expenses: $16,500\n- Depreciation: $8,500\n\nNet rental income: $19,500. Confirmed all expenses are properly documented.',
          noteType: 'meeting',
          priority: 'normal',
          isPrivate: false,
          tags: ['rental_property', 'schedule_e', 'documentation', 'individual_return'],
          authorRole: 'senior_cpa',
          createdAt: subDays(now, 35)
        },
        {
          title: 'Medical Practice Income Verification',
          content: 'Verified W-2 and 1099 income from medical practice:\n\n- W-2 wages: $185,000\n- 1099 income from locum work: $28,000\n- Business expenses for locum work: $3,200\n\nAll documentation matches tax forms. Return shows AGI of $285,000.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['medical_practice', 'w2', '1099', 'income_verification'],
          authorRole: 'senior_cpa',
          createdAt: subDays(now, 38)
        }
      ]
    },
    // Mountain View Landscaping Notes
    {
      clientName: 'Mountain View Landscaping',
      engagementName: 'Quarterly Bookkeeping - Mountain View Landscaping',
      notes: [
        {
          title: 'Q1 2024 Sales Tax Preparation',
          content: 'Prepared Oregon quarterly sales tax return:\n\n- Taxable sales: $95,000\n- Tax collected: $0 (services not subject to sales tax)\n- Zero return filed\n\nVerified that landscaping services are not subject to Oregon sales tax. Documented for future reference.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['sales_tax', 'oregon', 'quarterly', 'landscaping'],
          authorRole: 'senior_cpa',
          createdAt: subDays(now, 5)
        },
        {
          title: 'Equipment Depreciation Review',
          content: 'Updated equipment depreciation schedule:\n\n- Added new trailer: $8,500 (purchased February 2024)\n- Disposed of old mower: $2,500 original cost\n- Q1 depreciation expense: $4,625\n\nRecommended client maintain better records of equipment purchases and disposals.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['equipment', 'depreciation', 'asset_management', 'record_keeping'],
          authorRole: 'senior_cpa',
          reminderDate: addDays(now, 30),
          createdAt: subDays(now, 8)
        }
      ]
    },
    // Pacific Northwest Consulting Notes
    {
      clientName: 'Pacific Northwest Consulting',
      engagementName: 'Business Setup - Pacific Northwest Consulting',
      notes: [
        {
          title: 'LLC Formation Completed',
          content: 'Successfully completed LLC formation for Patricia Johnson:\n\n- Entity name: Pacific Northwest Consulting LLC\n- State: Oregon\n- EIN obtained: 91-1472583\n- Operating agreement drafted and signed\n- Business bank account opened\n\nProvided initial tax consultation covering quarterly estimates and business expense deductions.',
          noteType: 'general',
          priority: 'normal',
          isPrivate: false,
          tags: ['llc_formation', 'oregon', 'ein', 'business_setup', 'completed'],
          authorRole: 'senior_cpa',
          createdAt: subDays(now, 55)
        },
        {
          title: 'Initial Tax Planning Session',
          content: 'Conducted initial tax planning meeting:\n\n- Discussed quarterly estimated tax payments\n- Reviewed business expense categories\n- Set up basic recordkeeping system\n- Recommended business credit card for expense tracking\n\nScheduled follow-up meeting for first quarter review.',
          noteType: 'meeting',
          priority: 'normal',
          isPrivate: false,
          tags: ['tax_planning', 'quarterly_estimates', 'recordkeeping', 'consultation'],
          authorRole: 'senior_cpa',
          reminderDate: addDays(now, 60),
          createdAt: subDays(now, 50)
        }
      ]
    }
  ]
};

export const noteTypes = [
  'general',      // General notes
  'meeting',      // Meeting notes
  'reminder',     // Reminder notes
  'follow_up',    // Follow-up items
  'phone_call',   // Phone call notes
  'email',        // Email correspondence
  'research',     // Research notes
  'planning',     // Planning notes
  'review'        // Review notes
];

export const notePriorities = [
  'low',      // Low priority
  'normal',   // Normal priority
  'high',     // High priority
  'urgent'    // Urgent priority
];

export const commonTags = [
  // Tax-related
  'tax_planning', 'tax_return', 'tax_compliance', 'irs', 'state_tax',
  'depreciation', 'section_179', 'r&d_credit', 'stock_compensation',
  'international_tax', 'transfer_pricing', 'multi_state',

  // Financial
  'financial_statements', 'bookkeeping', 'cash_flow', 'budget',
  'audit', 'review', 'compilation', 'management_reporting',

  // Business advisory
  'business_planning', 'strategic_planning', 'kpi', 'performance',
  'valuation', 'succession_planning', 'risk_management',

  // Technology
  'quickbooks', 'integration', 'software', 'automation',
  'data_migration', 'system_setup', 'training',

  // Compliance
  'compliance', 'documentation', 'record_keeping', 'filing',
  'deadline', 'regulation', 'policy',

  // Client management
  'client_meeting', 'follow_up', 'communication', 'feedback',
  'training', 'consultation', 'onboarding'
];

export const noteTemplates = {
  'client_meeting': {
    title: 'Client Meeting - [Client Name]',
    content: `Date: [Date]
Attendees: [Names]
Purpose: [Meeting purpose]

Discussion Points:
1. [Point 1]
2. [Point 2]
3. [Point 3]

Action Items:
- [ ] [Action item 1]
- [ ] [Action item 2]

Next Steps:
[Next steps]

Follow-up: [Date]`
  },
  'tax_planning': {
    title: 'Tax Planning Notes - [Client Name]',
    content: `Tax Year: [Year]
Planning Strategies Discussed:
1. [Strategy 1]
2. [Strategy 2]

Estimated Tax Savings:
- Strategy 1: $[Amount]
- Strategy 2: $[Amount]

Implementation Timeline:
[Timeline details]

Required Documentation:
- [Document 1]
- [Document 2]`
  },
  'project_status': {
    title: 'Project Status Update - [Project Name]',
    content: `Project: [Project name]
Status: [In Progress/Completed/On Hold]
Completion: [X]%

Completed Tasks:
- [Task 1]
- [Task 2]

Pending Tasks:
- [Task 1] - Due: [Date]
- [Task 2] - Due: [Date]

Issues/Concerns:
[Any issues or concerns]

Next Milestone: [Date]`
  }
};