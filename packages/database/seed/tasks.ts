import { addDays, subDays, addHours } from 'date-fns';

const now = new Date();

export const tasksData = {
  // TaxPro Associates Tasks
  'taxpro': [
    // TechFlow Solutions Corporate Tax Return Tasks
    {
      engagementName: '2023 Corporate Tax Return - TechFlow Solutions',
      tasks: [
        {
          title: 'Review 2023 Financial Statements',
          description: 'Review audited financial statements and identify book-tax differences for Form 1120 preparation',
          status: 'completed',
          priority: 'high',
          taskType: 'document_review',
          estimatedHours: 3.0,
          actualHours: 3.5,
          startDate: subDays(now, 40),
          dueDate: subDays(now, 35),
          completedDate: subDays(now, 34),
          assignedRole: 'senior_cpa',
          dependencies: null,
          checklist: {
            items: [
              { id: '1', text: 'Review income statement for unusual items', completed: true },
              { id: '2', text: 'Analyze balance sheet for tax implications', completed: true },
              { id: '3', text: 'Identify book-tax differences', completed: true },
              { id: '4', text: 'Document findings for tax return preparation', completed: true }
            ]
          },
          attachments: {
            files: [
              { id: '1', name: 'TechFlow_2023_Audited_FS.pdf', size: 2048576 },
              { id: '2', name: 'Book_Tax_Differences_Analysis.xlsx', size: 512000 }
            ]
          }
        },
        {
          title: 'Prepare Schedule M-1 Reconciliation',
          description: 'Prepare book-to-tax reconciliation showing differences between book income and taxable income',
          status: 'completed',
          priority: 'high',
          taskType: 'preparation',
          estimatedHours: 2.5,
          actualHours: 3.0,
          startDate: subDays(now, 32),
          dueDate: subDays(now, 28),
          completedDate: subDays(now, 27),
          assignedRole: 'senior_cpa',
          dependencies: ['Review 2023 Financial Statements'],
          checklist: {
            items: [
              { id: '1', text: 'Calculate permanent differences', completed: true },
              { id: '2', text: 'Calculate temporary differences', completed: true },
              { id: '3', text: 'Prepare Schedule M-1', completed: true },
              { id: '4', text: 'Review with manager', completed: true }
            ]
          }
        },
        {
          title: 'Calculate R&D Tax Credits',
          description: 'Calculate federal and state research and development tax credits for software development activities',
          status: 'in_progress',
          priority: 'high',
          taskType: 'preparation',
          estimatedHours: 4.0,
          actualHours: 2.5,
          startDate: subDays(now, 25),
          dueDate: addDays(now, 5),
          assignedRole: 'senior_cpa',
          dependencies: null,
          checklist: {
            items: [
              { id: '1', text: 'Gather qualified research expenditure documentation', completed: true },
              { id: '2', text: 'Calculate federal R&D credit', completed: true },
              { id: '3', text: 'Calculate California R&D credit', completed: false },
              { id: '4', text: 'Prepare Form 6765', completed: false },
              { id: '5', text: 'Document credit calculations', completed: false }
            ]
          }
        },
        {
          title: 'Stock Compensation Analysis',
          description: 'Analyze stock-based compensation for tax implications and proper reporting',
          status: 'pending',
          priority: 'normal',
          taskType: 'preparation',
          estimatedHours: 3.0,
          actualHours: 0.0,
          startDate: addDays(now, 2),
          dueDate: addDays(now, 10),
          assignedRole: 'senior_cpa',
          dependencies: ['Calculate R&D Tax Credits'],
          checklist: {
            items: [
              { id: '1', text: 'Review stock option grant documents', completed: false },
              { id: '2', text: 'Calculate book vs. tax timing differences', completed: false },
              { id: '3', text: 'Determine excess tax benefit treatment', completed: false },
              { id: '4', text: 'Update deferred tax calculations', completed: false }
            ]
          }
        }
      ]
    },
    // Golden Gate Medical CFO Services Tasks
    {
      engagementName: 'Monthly CFO Services - Golden Gate Medical',
      tasks: [
        {
          title: 'March 2024 Board Package Preparation',
          description: 'Prepare comprehensive board package with financial statements and key metrics',
          status: 'in_progress',
          priority: 'high',
          taskType: 'preparation',
          estimatedHours: 4.0,
          actualHours: 2.5,
          startDate: subDays(now, 5),
          dueDate: addDays(now, 3),
          assignedRole: 'senior_cpa',
          dependencies: null,
          checklist: {
            items: [
              { id: '1', text: 'Prepare monthly financial statements', completed: true },
              { id: '2', text: 'Update key performance indicators', completed: true },
              { id: '3', text: 'Prepare cash flow forecast', completed: false },
              { id: '4', text: 'Create executive summary', completed: false },
              { id: '5', text: 'Review with medical group administrator', completed: false }
            ]
          }
        },
        {
          title: 'Cash Flow Analysis & Forecasting',
          description: 'Weekly cash flow analysis and 13-week rolling forecast update',
          status: 'pending',
          priority: 'high',
          taskType: 'review',
          estimatedHours: 2.0,
          actualHours: 0.0,
          startDate: addDays(now, 1),
          dueDate: addDays(now, 4),
          assignedRole: 'senior_cpa',
          dependencies: null,
          checklist: {
            items: [
              { id: '1', text: 'Update accounts receivable aging', completed: false },
              { id: '2', text: 'Review upcoming payables', completed: false },
              { id: '3', text: 'Update 13-week cash forecast', completed: false },
              { id: '4', text: 'Identify potential cash flow issues', completed: false }
            ]
          }
        }
      ]
    }
  ],
  // QuickBooks Advisory Group Tasks
  'qbadvisory': [
    // Austin Coffee Collective Tasks
    {
      engagementName: 'QuickBooks Implementation - Austin Coffee Collective',
      tasks: [
        {
          title: 'Chart of Accounts Setup',
          description: 'Design and implement chart of accounts optimized for coffee shop operations',
          status: 'completed',
          priority: 'high',
          taskType: 'preparation',
          estimatedHours: 3.0,
          actualHours: 3.5,
          startDate: subDays(now, 55),
          dueDate: subDays(now, 50),
          completedDate: subDays(now, 48),
          assignedRole: 'cpa',
          dependencies: null,
          checklist: {
            items: [
              { id: '1', text: 'Research industry best practices', completed: true },
              { id: '2', text: 'Design account structure', completed: true },
              { id: '3', text: 'Set up accounts in QuickBooks', completed: true },
              { id: '4', text: 'Configure account mappings', completed: true }
            ]
          }
        },
        {
          title: 'Square POS Integration',
          description: 'Configure and test Square POS integration with QuickBooks Online',
          status: 'completed',
          priority: 'normal',
          taskType: 'preparation',
          estimatedHours: 2.0,
          actualHours: 2.5,
          startDate: subDays(now, 45),
          dueDate: subDays(now, 40),
          completedDate: subDays(now, 38),
          assignedRole: 'staff',
          dependencies: ['Chart of Accounts Setup'],
          checklist: {
            items: [
              { id: '1', text: 'Install Square connector app', completed: true },
              { id: '2', text: 'Configure sync settings', completed: true },
              { id: '3', text: 'Test transaction import', completed: true },
              { id: '4', text: 'Verify account mappings', completed: true }
            ]
          }
        },
        {
          title: 'Staff Training Session',
          description: 'Conduct QuickBooks training for coffee shop staff on daily transaction entry',
          status: 'completed',
          priority: 'normal',
          taskType: 'client_meeting',
          estimatedHours: 2.0,
          actualHours: 2.0,
          startDate: subDays(now, 32),
          dueDate: subDays(now, 30),
          completedDate: subDays(now, 30),
          assignedRole: 'cpa',
          dependencies: ['Square POS Integration']
        }
      ]
    },
    // Lone Star Consulting Monthly Bookkeeping
    {
      engagementName: 'Monthly Bookkeeping - Lone Star Consulting',
      tasks: [
        {
          title: 'March 2024 Bank Reconciliation',
          description: 'Reconcile all bank accounts for March 2024',
          status: 'completed',
          priority: 'normal',
          taskType: 'data_entry',
          estimatedHours: 1.5,
          actualHours: 1.25,
          startDate: subDays(now, 8),
          dueDate: subDays(now, 5),
          completedDate: subDays(now, 6),
          assignedRole: 'staff',
          dependencies: null,
          checklist: {
            items: [
              { id: '1', text: 'Download bank statements', completed: true },
              { id: '2', text: 'Match transactions in QuickBooks', completed: true },
              { id: '3', text: 'Identify and resolve discrepancies', completed: true },
              { id: '4', text: 'Update beginning balances', completed: true }
            ]
          }
        },
        {
          title: 'Expense Categorization Review',
          description: 'Review and properly categorize all March expenses',
          status: 'in_progress',
          priority: 'normal',
          taskType: 'data_entry',
          estimatedHours: 2.0,
          actualHours: 1.0,
          startDate: subDays(now, 3),
          dueDate: addDays(now, 2),
          assignedRole: 'staff',
          dependencies: ['March 2024 Bank Reconciliation'],
          checklist: {
            items: [
              { id: '1', text: 'Review uncategorized transactions', completed: true },
              { id: '2', text: 'Assign proper expense categories', completed: false },
              { id: '3', text: 'Split transactions as needed', completed: false },
              { id: '4', text: 'Add missing vendor information', completed: false }
            ]
          }
        },
        {
          title: 'Generate March Financial Statements',
          description: 'Prepare P&L, Balance Sheet, and Cash Flow for March 2024',
          status: 'pending',
          priority: 'normal',
          taskType: 'preparation',
          estimatedHours: 1.0,
          actualHours: 0.0,
          startDate: addDays(now, 3),
          dueDate: addDays(now, 5),
          assignedRole: 'cpa',
          dependencies: ['Expense Categorization Review']
        }
      ]
    }
  ],
  // Smith & Jones CPA Tasks
  'smithjones': [
    // Mountain View Landscaping Quarterly Bookkeeping
    {
      engagementName: 'Quarterly Bookkeeping - Mountain View Landscaping',
      tasks: [
        {
          title: 'Q1 2024 Transaction Review',
          description: 'Review and categorize all Q1 2024 transactions in QuickBooks Desktop',
          status: 'in_progress',
          priority: 'normal',
          taskType: 'data_entry',
          estimatedHours: 3.0,
          actualHours: 2.0,
          startDate: subDays(now, 15),
          dueDate: addDays(now, 5),
          assignedRole: 'staff',
          dependencies: null,
          checklist: {
            items: [
              { id: '1', text: 'Import January transactions', completed: true },
              { id: '2', text: 'Import February transactions', completed: true },
              { id: '3', text: 'Import March transactions', completed: false },
              { id: '4', text: 'Categorize all uncategorized items', completed: false },
              { id: '5', text: 'Review job costing allocations', completed: false }
            ]
          }
        },
        {
          title: 'Equipment Depreciation Entry',
          description: 'Calculate and record Q1 depreciation for landscaping equipment',
          status: 'pending',
          priority: 'normal',
          taskType: 'preparation',
          estimatedHours: 1.5,
          actualHours: 0.0,
          startDate: addDays(now, 3),
          dueDate: addDays(now, 8),
          assignedRole: 'senior_cpa',
          dependencies: ['Q1 2024 Transaction Review'],
          checklist: {
            items: [
              { id: '1', text: 'Review fixed asset register', completed: false },
              { id: '2', text: 'Calculate quarterly depreciation', completed: false },
              { id: '3', text: 'Record depreciation journal entry', completed: false },
              { id: '4', text: 'Update asset register', completed: false }
            ]
          }
        },
        {
          title: 'Oregon Sales Tax Preparation',
          description: 'Prepare quarterly Oregon sales tax return for Q1 2024',
          status: 'pending',
          priority: 'high',
          taskType: 'preparation',
          estimatedHours: 1.0,
          actualHours: 0.0,
          startDate: addDays(now, 6),
          dueDate: addDays(now, 12),
          assignedRole: 'senior_cpa',
          dependencies: ['Q1 2024 Transaction Review'],
          checklist: {
            items: [
              { id: '1', text: 'Generate sales tax liability report', completed: false },
              { id: '2', text: 'Review taxable vs non-taxable sales', completed: false },
              { id: '3', text: 'Complete Oregon sales tax return', completed: false },
              { id: '4', text: 'Submit return online', completed: false }
            ]
          }
        }
      ]
    }
  ]
};

export const taskStatuses = [
  'pending',      // Not yet started
  'in_progress',  // Currently being worked on
  'review',       // Completed, awaiting review
  'completed',    // Finished and approved
  'cancelled',    // Cancelled or no longer needed
  'on_hold'       // Temporarily paused
];

export const taskPriorities = [
  'low',      // Can be delayed
  'normal',   // Standard priority
  'high',     // Important, higher priority
  'urgent'    // Critical, immediate attention
];

export const taskTypes = [
  'document_review',    // Reviewing documents
  'data_entry',        // Data entry tasks
  'preparation',       // Preparing documents/returns
  'review',           // Review and quality control
  'client_meeting',   // Client meetings/calls
  'research',         // Research tasks
  'filing',           // Filing returns/documents
  'follow_up',        // Follow-up activities
  'training',         // Training sessions
  'custom'            // Custom task types
];

export const recurringTaskTemplates = [
  {
    name: 'Monthly Bank Reconciliation',
    description: 'Reconcile all client bank accounts for the month',
    taskType: 'data_entry',
    estimatedHours: 1.5,
    frequency: 'monthly',
    dueOffset: 10 // Days after month end
  },
  {
    name: 'Quarterly Sales Tax Return',
    description: 'Prepare and file quarterly sales tax return',
    taskType: 'preparation',
    estimatedHours: 1.0,
    frequency: 'quarterly',
    dueOffset: 20 // Days after quarter end
  },
  {
    name: 'Annual Tax Return Preparation',
    description: 'Prepare annual tax return',
    taskType: 'preparation',
    estimatedHours: 8.0,
    frequency: 'annually',
    dueOffset: 75 // Days after year end
  }
];