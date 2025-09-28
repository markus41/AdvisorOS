export const workflowTemplates = [
  {
    name: 'Monthly Bookkeeping Workflow',
    description: 'Standard monthly bookkeeping process for recurring clients',
    type: 'bookkeeping',
    isTemplate: true,
    isActive: true,
    version: 1,
    steps: [
      {
        id: 'step_1',
        name: 'Download Bank Statements',
        description: 'Download and organize bank statements from all client accounts',
        order: 1,
        estimatedHours: 0.5,
        taskType: 'document_review',
        dependencies: [],
        dueInDays: 5,
        assignedRole: 'staff'
      },
      {
        id: 'step_2',
        name: 'Download Credit Card Statements',
        description: 'Download and organize credit card statements from all accounts',
        order: 2,
        estimatedHours: 0.25,
        taskType: 'document_review',
        dependencies: [],
        dueInDays: 5,
        assignedRole: 'staff'
      },
      {
        id: 'step_3',
        name: 'Bank Reconciliation',
        description: 'Perform bank reconciliation for all accounts',
        order: 3,
        estimatedHours: 2.0,
        taskType: 'data_entry',
        dependencies: ['step_1'],
        dueInDays: 10,
        assignedRole: 'staff'
      },
      {
        id: 'step_4',
        name: 'Credit Card Reconciliation',
        description: 'Perform credit card reconciliation for all accounts',
        order: 4,
        estimatedHours: 1.5,
        taskType: 'data_entry',
        dependencies: ['step_2'],
        dueInDays: 10,
        assignedRole: 'staff'
      },
      {
        id: 'step_5',
        name: 'Expense Categorization',
        description: 'Review and categorize all transactions',
        order: 5,
        estimatedHours: 3.0,
        taskType: 'data_entry',
        dependencies: ['step_3', 'step_4'],
        dueInDays: 15,
        assignedRole: 'cpa'
      },
      {
        id: 'step_6',
        name: 'Generate Financial Statements',
        description: 'Generate P&L, Balance Sheet, and Cash Flow statements',
        order: 6,
        estimatedHours: 1.0,
        taskType: 'preparation',
        dependencies: ['step_5'],
        dueInDays: 20,
        assignedRole: 'cpa'
      },
      {
        id: 'step_7',
        name: 'Review and Quality Check',
        description: 'Senior review of all work and financial statements',
        order: 7,
        estimatedHours: 1.5,
        taskType: 'review',
        dependencies: ['step_6'],
        dueInDays: 25,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_8',
        name: 'Client Communication',
        description: 'Send financial statements and schedule client meeting if needed',
        order: 8,
        estimatedHours: 0.5,
        taskType: 'client_meeting',
        dependencies: ['step_7'],
        dueInDays: 30,
        assignedRole: 'cpa'
      }
    ],
    settings: {
      autoAssignTasks: true,
      sendNotifications: true,
      clientVisibility: true,
      billingEnabled: true
    }
  },
  {
    name: 'Individual Tax Return Preparation',
    description: 'Standard workflow for preparing individual tax returns (Form 1040)',
    type: 'tax_preparation',
    isTemplate: true,
    isActive: true,
    version: 1,
    steps: [
      {
        id: 'step_1',
        name: 'Client Intake & Document Collection',
        description: 'Collect all necessary tax documents from client',
        order: 1,
        estimatedHours: 0.5,
        taskType: 'client_meeting',
        dependencies: [],
        dueInDays: 7,
        assignedRole: 'staff'
      },
      {
        id: 'step_2',
        name: 'Document Organization & Review',
        description: 'Organize and review all tax documents for completeness',
        order: 2,
        estimatedHours: 1.0,
        taskType: 'document_review',
        dependencies: ['step_1'],
        dueInDays: 10,
        assignedRole: 'staff'
      },
      {
        id: 'step_3',
        name: 'Data Entry & Initial Preparation',
        description: 'Enter data into tax software and prepare initial return',
        order: 3,
        estimatedHours: 3.0,
        taskType: 'preparation',
        dependencies: ['step_2'],
        dueInDays: 20,
        assignedRole: 'cpa'
      },
      {
        id: 'step_4',
        name: 'Tax Planning Analysis',
        description: 'Review for tax planning opportunities and strategies',
        order: 4,
        estimatedHours: 1.5,
        taskType: 'review',
        dependencies: ['step_3'],
        dueInDays: 25,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_5',
        name: 'Senior Review',
        description: 'Comprehensive review of completed tax return',
        order: 5,
        estimatedHours: 1.0,
        taskType: 'review',
        dependencies: ['step_4'],
        dueInDays: 30,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_6',
        name: 'Client Review Meeting',
        description: 'Meet with client to review return and discuss findings',
        order: 6,
        estimatedHours: 1.0,
        taskType: 'client_meeting',
        dependencies: ['step_5'],
        dueInDays: 35,
        assignedRole: 'cpa'
      },
      {
        id: 'step_7',
        name: 'Filing & Documentation',
        description: 'File return and organize documentation',
        order: 7,
        estimatedHours: 0.5,
        taskType: 'preparation',
        dependencies: ['step_6'],
        dueInDays: 40,
        assignedRole: 'staff'
      }
    ],
    settings: {
      autoAssignTasks: true,
      sendNotifications: true,
      clientVisibility: true,
      billingEnabled: true
    }
  },
  {
    name: 'Corporate Tax Return (Form 1120)',
    description: 'Comprehensive workflow for corporate tax return preparation',
    type: 'tax_preparation',
    isTemplate: true,
    isActive: true,
    version: 1,
    steps: [
      {
        id: 'step_1',
        name: 'Gather Financial Statements',
        description: 'Obtain audited or reviewed financial statements',
        order: 1,
        estimatedHours: 0.5,
        taskType: 'document_review',
        dependencies: [],
        dueInDays: 14,
        assignedRole: 'staff'
      },
      {
        id: 'step_2',
        name: 'Review General Ledger',
        description: 'Review detailed general ledger and supporting schedules',
        order: 2,
        estimatedHours: 2.0,
        taskType: 'document_review',
        dependencies: ['step_1'],
        dueInDays: 21,
        assignedRole: 'cpa'
      },
      {
        id: 'step_3',
        name: 'Book-Tax Difference Analysis',
        description: 'Identify and analyze book-tax differences',
        order: 3,
        estimatedHours: 4.0,
        taskType: 'preparation',
        dependencies: ['step_2'],
        dueInDays: 35,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_4',
        name: 'Depreciation Schedule Review',
        description: 'Review and update depreciation schedules',
        order: 4,
        estimatedHours: 2.5,
        taskType: 'preparation',
        dependencies: ['step_2'],
        dueInDays: 28,
        assignedRole: 'cpa'
      },
      {
        id: 'step_5',
        name: 'Tax Return Preparation',
        description: 'Prepare Form 1120 and all supporting schedules',
        order: 5,
        estimatedHours: 6.0,
        taskType: 'preparation',
        dependencies: ['step_3', 'step_4'],
        dueInDays: 50,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_6',
        name: 'Tax Provision Review',
        description: 'Review tax provision calculations for financial statements',
        order: 6,
        estimatedHours: 2.0,
        taskType: 'review',
        dependencies: ['step_5'],
        dueInDays: 55,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_7',
        name: 'Partner Review',
        description: 'Final partner review before client presentation',
        order: 7,
        estimatedHours: 2.0,
        taskType: 'review',
        dependencies: ['step_6'],
        dueInDays: 60,
        assignedRole: 'owner'
      },
      {
        id: 'step_8',
        name: 'Client Presentation',
        description: 'Present return to client and discuss tax strategies',
        order: 8,
        estimatedHours: 1.5,
        taskType: 'client_meeting',
        dependencies: ['step_7'],
        dueInDays: 65,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_9',
        name: 'Filing & Extension Management',
        description: 'File return or extension as appropriate',
        order: 9,
        estimatedHours: 0.5,
        taskType: 'preparation',
        dependencies: ['step_8'],
        dueInDays: 70,
        assignedRole: 'staff'
      }
    ],
    settings: {
      autoAssignTasks: true,
      sendNotifications: true,
      clientVisibility: false,
      billingEnabled: true
    }
  },
  {
    name: 'New Client Onboarding',
    description: 'Complete onboarding process for new clients',
    type: 'onboarding',
    isTemplate: true,
    isActive: true,
    version: 1,
    steps: [
      {
        id: 'step_1',
        name: 'Initial Client Meeting',
        description: 'Meet with prospect to understand needs and explain services',
        order: 1,
        estimatedHours: 1.5,
        taskType: 'client_meeting',
        dependencies: [],
        dueInDays: 3,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_2',
        name: 'Proposal Preparation',
        description: 'Prepare engagement letter and service proposal',
        order: 2,
        estimatedHours: 1.0,
        taskType: 'preparation',
        dependencies: ['step_1'],
        dueInDays: 7,
        assignedRole: 'admin'
      },
      {
        id: 'step_3',
        name: 'Contract Execution',
        description: 'Execute engagement letter and collect retainer',
        order: 3,
        estimatedHours: 0.5,
        taskType: 'preparation',
        dependencies: ['step_2'],
        dueInDays: 14,
        assignedRole: 'admin'
      },
      {
        id: 'step_4',
        name: 'Client Setup in Systems',
        description: 'Set up client in practice management and billing systems',
        order: 4,
        estimatedHours: 0.75,
        taskType: 'data_entry',
        dependencies: ['step_3'],
        dueInDays: 16,
        assignedRole: 'staff'
      },
      {
        id: 'step_5',
        name: 'Document Collection',
        description: 'Collect historical documents and access to systems',
        order: 5,
        estimatedHours: 1.0,
        taskType: 'document_review',
        dependencies: ['step_4'],
        dueInDays: 21,
        assignedRole: 'staff'
      },
      {
        id: 'step_6',
        name: 'QuickBooks Setup/Review',
        description: 'Set up or review QuickBooks configuration',
        order: 6,
        estimatedHours: 2.0,
        taskType: 'preparation',
        dependencies: ['step_5'],
        dueInDays: 28,
        assignedRole: 'cpa'
      },
      {
        id: 'step_7',
        name: 'Initial Financial Review',
        description: 'Review current financial position and identify issues',
        order: 7,
        estimatedHours: 3.0,
        taskType: 'review',
        dependencies: ['step_6'],
        dueInDays: 35,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_8',
        name: 'Kickoff Meeting',
        description: 'Meet with client to present findings and establish workflow',
        order: 8,
        estimatedHours: 1.5,
        taskType: 'client_meeting',
        dependencies: ['step_7'],
        dueInDays: 42,
        assignedRole: 'senior_cpa'
      }
    ],
    settings: {
      autoAssignTasks: true,
      sendNotifications: true,
      clientVisibility: true,
      billingEnabled: true
    }
  },
  {
    name: 'Year-End Closing Process',
    description: 'Comprehensive year-end closing and financial statement preparation',
    type: 'year_end',
    isTemplate: true,
    isActive: true,
    version: 1,
    steps: [
      {
        id: 'step_1',
        name: 'Pre-Closing Meeting',
        description: 'Meet with client to discuss year-end planning and deadlines',
        order: 1,
        estimatedHours: 1.0,
        taskType: 'client_meeting',
        dependencies: [],
        dueInDays: 7,
        assignedRole: 'cpa'
      },
      {
        id: 'step_2',
        name: 'Year-End Document Collection',
        description: 'Collect all year-end documents and supporting schedules',
        order: 2,
        estimatedHours: 1.5,
        taskType: 'document_review',
        dependencies: ['step_1'],
        dueInDays: 14,
        assignedRole: 'staff'
      },
      {
        id: 'step_3',
        name: 'Account Reconciliation',
        description: 'Reconcile all balance sheet accounts',
        order: 3,
        estimatedHours: 4.0,
        taskType: 'preparation',
        dependencies: ['step_2'],
        dueInDays: 21,
        assignedRole: 'cpa'
      },
      {
        id: 'step_4',
        name: 'Inventory Valuation',
        description: 'Review and adjust inventory valuation',
        order: 4,
        estimatedHours: 2.0,
        taskType: 'preparation',
        dependencies: ['step_2'],
        dueInDays: 18,
        assignedRole: 'cpa'
      },
      {
        id: 'step_5',
        name: 'Depreciation Calculation',
        description: 'Calculate and record annual depreciation',
        order: 5,
        estimatedHours: 2.5,
        taskType: 'preparation',
        dependencies: ['step_3'],
        dueInDays: 25,
        assignedRole: 'cpa'
      },
      {
        id: 'step_6',
        name: 'Accrual Adjustments',
        description: 'Record accrual adjustments for proper matching',
        order: 6,
        estimatedHours: 3.0,
        taskType: 'preparation',
        dependencies: ['step_3', 'step_4'],
        dueInDays: 28,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_7',
        name: 'Financial Statement Preparation',
        description: 'Prepare annual financial statements',
        order: 7,
        estimatedHours: 4.0,
        taskType: 'preparation',
        dependencies: ['step_5', 'step_6'],
        dueInDays: 35,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_8',
        name: 'Management Letter',
        description: 'Prepare management letter with recommendations',
        order: 8,
        estimatedHours: 2.0,
        taskType: 'preparation',
        dependencies: ['step_7'],
        dueInDays: 42,
        assignedRole: 'senior_cpa'
      },
      {
        id: 'step_9',
        name: 'Year-End Review Meeting',
        description: 'Present financial statements and discuss results with client',
        order: 9,
        estimatedHours: 1.5,
        taskType: 'client_meeting',
        dependencies: ['step_8'],
        dueInDays: 49,
        assignedRole: 'senior_cpa'
      }
    ],
    settings: {
      autoAssignTasks: true,
      sendNotifications: true,
      clientVisibility: true,
      billingEnabled: true
    }
  }
];