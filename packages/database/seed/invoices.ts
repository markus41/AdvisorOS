import { addDays, subDays, addMonths, subMonths } from 'date-fns';

const now = new Date();

export const invoicesData = {
  'taxpro': [
    // TechFlow Solutions Invoices
    {
      clientName: 'TechFlow Solutions Inc',
      engagementName: '2023 Corporate Tax Return - TechFlow Solutions',
      invoices: [
        {
          invoiceNumber: 'TP-2024-0001',
          title: 'Corporate Tax Return Preparation - 2023',
          description: 'Professional services for preparation of 2023 Form 1120 corporate tax return including book-tax reconciliation, R&D credit analysis, and stock compensation review',
          status: 'sent',
          invoiceDate: subDays(now, 15),
          dueDate: addDays(now, 15), // Net 30
          subtotal: 4950.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 4950.00,
          paidAmount: 0.00,
          balanceAmount: 4950.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Senior CPA time - Tax return preparation and review',
                quantity: 12.5,
                rate: 275.00,
                amount: 3437.50
              },
              {
                id: '2',
                description: 'R&D Credit analysis and documentation',
                quantity: 4.0,
                rate: 275.00,
                amount: 1100.00
              },
              {
                id: '3',
                description: 'Stock compensation analysis',
                quantity: 1.5,
                rate: 275.00,
                amount: 412.50
              }
            ]
          },
          sentAt: subDays(now, 15),
          viewedAt: subDays(now, 12),
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 15),
                sentTo: 'sarah.cfo@techflow.com',
                subject: 'Invoice TP-2024-0001 - Corporate Tax Return Services'
              }
            ]
          },
          notes: 'Invoice for comprehensive corporate tax return preparation including specialized areas'
        }
      ]
    },
    // Golden Gate Medical Group Invoices
    {
      clientName: 'Golden Gate Medical Group',
      engagementName: 'Monthly CFO Services - Golden Gate Medical',
      invoices: [
        {
          invoiceNumber: 'TP-2024-0002',
          title: 'CFO Services - March 2024',
          description: 'Monthly CFO services including financial analysis, board package preparation, and strategic advisory',
          status: 'paid',
          invoiceDate: subDays(now, 32),
          dueDate: subDays(now, 2), // Net 30
          subtotal: 3500.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 3500.00,
          paidAmount: 3500.00,
          balanceAmount: 0.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Monthly CFO Services Retainer - March 2024',
                quantity: 1,
                rate: 3500.00,
                amount: 3500.00
              }
            ]
          },
          sentAt: subDays(now, 32),
          viewedAt: subDays(now, 30),
          paidAt: subDays(now, 5),
          paymentHistory: {
            payments: [
              {
                id: '1',
                amount: 3500.00,
                date: subDays(now, 5),
                method: 'ach_transfer',
                reference: 'ACH-GGMG-240315',
                checkNumber: null
              }
            ]
          },
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 32),
                sentTo: 'admin@goldengatemed.com',
                subject: 'Invoice TP-2024-0002 - Monthly CFO Services'
              }
            ]
          },
          notes: 'Recurring monthly retainer for CFO services'
        },
        {
          invoiceNumber: 'TP-2024-0015',
          title: 'CFO Services - April 2024',
          description: 'Monthly CFO services including financial analysis, board package preparation, and strategic advisory',
          status: 'sent',
          invoiceDate: subDays(now, 2),
          dueDate: addDays(now, 28), // Net 30
          subtotal: 3500.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 3500.00,
          paidAmount: 0.00,
          balanceAmount: 3500.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Monthly CFO Services Retainer - April 2024',
                quantity: 1,
                rate: 3500.00,
                amount: 3500.00
              }
            ]
          },
          sentAt: subDays(now, 2),
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 2),
                sentTo: 'admin@goldengatemed.com',
                subject: 'Invoice TP-2024-0015 - Monthly CFO Services'
              }
            ]
          },
          notes: 'Recurring monthly retainer for CFO services'
        }
      ]
    },
    // Bay Area Real Estate Holdings Invoices
    {
      clientName: 'Bay Area Real Estate Holdings LLC',
      engagementName: 'Year-End Audit Support - Bay Area Real Estate',
      invoices: [
        {
          invoiceNumber: 'TP-2024-0003',
          title: 'Year-End Audit Support Services',
          description: 'Audit support services for 2023 year-end financial statement audit including workpaper preparation and journal entries',
          status: 'paid',
          invoiceDate: subDays(now, 20),
          dueDate: addDays(now, 10), // Net 30
          subtotal: 10202.50,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 10202.50,
          paidAmount: 10202.50,
          balanceAmount: 0.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Senior CPA time - Audit support and coordination',
                quantity: 28.5,
                rate: 265.00,
                amount: 7552.50
              },
              {
                id: '2',
                description: 'Partner review time',
                quantity: 6.0,
                rate: 350.00,
                amount: 2100.00
              },
              {
                id: '3',
                description: 'Staff time - Workpaper preparation',
                quantity: 5.0,
                rate: 110.00,
                amount: 550.00
              }
            ]
          },
          sentAt: subDays(now, 20),
          viewedAt: subDays(now, 18),
          paidAt: subDays(now, 8),
          paymentHistory: {
            payments: [
              {
                id: '1',
                amount: 10202.50,
                date: subDays(now, 8),
                method: 'wire_transfer',
                reference: 'WIRE-BARE-240310',
                checkNumber: null
              }
            ]
          },
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 20),
                sentTo: 'finance@bareh.com',
                subject: 'Invoice TP-2024-0003 - Audit Support Services'
              }
            ]
          },
          notes: 'Comprehensive audit support for complex real estate portfolio'
        }
      ]
    }
  ],
  'qbadvisory': [
    // Austin Coffee Collective Invoices
    {
      clientName: 'Austin Coffee Collective',
      engagementName: 'QuickBooks Implementation - Austin Coffee Collective',
      invoices: [
        {
          invoiceNumber: 'QB-2024-0101',
          title: 'QuickBooks Implementation Project',
          description: 'Complete QuickBooks Online implementation including setup, training, and integration with Square POS',
          status: 'paid',
          invoiceDate: subDays(now, 45),
          dueDate: subDays(now, 15), // Net 30
          subtotal: 2500.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 2500.00,
          paidAmount: 2500.00,
          balanceAmount: 0.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'QuickBooks Implementation - Fixed Fee Project',
                quantity: 1,
                rate: 2500.00,
                amount: 2500.00
              }
            ]
          },
          sentAt: subDays(now, 45),
          viewedAt: subDays(now, 43),
          paidAt: subDays(now, 20),
          paymentHistory: {
            payments: [
              {
                id: '1',
                amount: 2500.00,
                date: subDays(now, 20),
                method: 'check',
                reference: 'CHECK-ACC-240301',
                checkNumber: '1024'
              }
            ]
          },
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 45),
                sentTo: 'owner@austincoffee.com',
                subject: 'Invoice QB-2024-0101 - QuickBooks Implementation'
              }
            ]
          },
          notes: 'Fixed fee project for complete QuickBooks setup'
        }
      ]
    },
    // Lone Star Consulting Invoices
    {
      clientName: 'Lone Star Consulting Group',
      engagementName: 'Monthly Bookkeeping - Lone Star Consulting',
      invoices: [
        {
          invoiceNumber: 'QB-2024-0102',
          title: 'Bookkeeping Services - February 2024',
          description: 'Monthly bookkeeping services including bank reconciliation, transaction categorization, and financial statement preparation',
          status: 'paid',
          invoiceDate: subDays(now, 35),
          dueDate: subDays(now, 5), // Net 30
          subtotal: 750.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 750.00,
          paidAmount: 750.00,
          balanceAmount: 0.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Monthly Bookkeeping Services - February 2024',
                quantity: 1,
                rate: 750.00,
                amount: 750.00
              }
            ]
          },
          sentAt: subDays(now, 35),
          viewedAt: subDays(now, 33),
          paidAt: subDays(now, 10),
          paymentHistory: {
            payments: [
              {
                id: '1',
                amount: 750.00,
                date: subDays(now, 10),
                method: 'ach_transfer',
                reference: 'ACH-LSC-240308',
                checkNumber: null
              }
            ]
          },
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 35),
                sentTo: 'admin@lonestarconsulting.com',
                subject: 'Invoice QB-2024-0102 - Monthly Bookkeeping Services'
              }
            ]
          },
          notes: 'Regular monthly bookkeeping services'
        },
        {
          invoiceNumber: 'QB-2024-0110',
          title: 'Bookkeeping Services - March 2024',
          description: 'Monthly bookkeeping services including bank reconciliation, transaction categorization, and financial statement preparation',
          status: 'sent',
          invoiceDate: subDays(now, 5),
          dueDate: addDays(now, 25), // Net 30
          subtotal: 750.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 750.00,
          paidAmount: 0.00,
          balanceAmount: 750.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Monthly Bookkeeping Services - March 2024',
                quantity: 1,
                rate: 750.00,
                amount: 750.00
              }
            ]
          },
          sentAt: subDays(now, 5),
          viewedAt: subDays(now, 3),
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 5),
                sentTo: 'admin@lonestarconsulting.com',
                subject: 'Invoice QB-2024-0110 - Monthly Bookkeeping Services'
              }
            ]
          },
          notes: 'Regular monthly bookkeeping services'
        }
      ]
    },
    // Hill Country Construction Invoice
    {
      clientName: 'Hill Country Construction',
      engagementName: '2023 Tax Return - Hill Country Construction',
      invoices: [
        {
          invoiceNumber: 'QB-2024-0108',
          title: '2023 Business Tax Return Preparation',
          description: 'Preparation of 2023 business tax return including job costing analysis and equipment depreciation schedules',
          status: 'partial',
          invoiceDate: subDays(now, 10),
          dueDate: addDays(now, 20), // Net 30
          subtotal: 2227.50,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 2227.50,
          paidAmount: 1500.00,
          balanceAmount: 727.50,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'CPA time - Tax return preparation',
                quantity: 10.5,
                rate: 165.00,
                amount: 1732.50
              },
              {
                id: '2',
                description: 'Job costing analysis',
                quantity: 3.0,
                rate: 165.00,
                amount: 495.00
              }
            ]
          },
          sentAt: subDays(now, 10),
          viewedAt: subDays(now, 8),
          paymentHistory: {
            payments: [
              {
                id: '1',
                amount: 1500.00,
                date: subDays(now, 3),
                method: 'check',
                reference: 'CHECK-HCC-240315',
                checkNumber: '2156'
              }
            ]
          },
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 10),
                sentTo: 'finance@hillcountryconstruction.com',
                subject: 'Invoice QB-2024-0108 - 2023 Tax Return Preparation'
              }
            ]
          },
          notes: 'Partial payment received, balance due'
        }
      ]
    }
  ],
  'smithjones': [
    // Portland Family Dentistry Invoice
    {
      clientName: 'Portland Family Dentistry',
      engagementName: '2023 Individual Tax Return - Dr. Lisa Chen',
      invoices: [
        {
          invoiceNumber: 'SJ-2024-001',
          title: '2023 Individual Tax Return Preparation',
          description: 'Preparation of 2023 individual tax return including Schedule E for rental property income',
          status: 'paid',
          invoiceDate: subDays(now, 25),
          dueDate: addDays(now, 5), // Net 30
          subtotal: 675.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 675.00,
          paidAmount: 675.00,
          balanceAmount: 0.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Individual tax return preparation (Form 1040)',
                quantity: 3.5,
                rate: 150.00,
                amount: 525.00
              },
              {
                id: '2',
                description: 'Schedule E preparation (rental property)',
                quantity: 1.0,
                rate: 150.00,
                amount: 150.00
              }
            ]
          },
          sentAt: subDays(now, 25),
          viewedAt: subDays(now, 23),
          paidAt: subDays(now, 15),
          paymentHistory: {
            payments: [
              {
                id: '1',
                amount: 675.00,
                date: subDays(now, 15),
                method: 'check',
                reference: 'CHECK-PFD-240301',
                checkNumber: '1847'
              }
            ]
          },
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 25),
                sentTo: 'office@portlandfamilydentistry.com',
                subject: 'Invoice SJ-2024-001 - 2023 Tax Return Preparation'
              }
            ]
          },
          notes: 'Individual return with rental property income'
        }
      ]
    },
    // Mountain View Landscaping Invoice
    {
      clientName: 'Mountain View Landscaping',
      engagementName: 'Quarterly Bookkeeping - Mountain View Landscaping',
      invoices: [
        {
          invoiceNumber: 'SJ-2024-002',
          title: 'Q1 2024 Quarterly Bookkeeping Services',
          description: 'Quarterly bookkeeping services including transaction review, depreciation entries, and sales tax preparation',
          status: 'sent',
          invoiceDate: subDays(now, 8),
          dueDate: addDays(now, 22), // Net 30
          subtotal: 450.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 450.00,
          paidAmount: 0.00,
          balanceAmount: 450.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Quarterly Bookkeeping Services - Q1 2024',
                quantity: 1,
                rate: 450.00,
                amount: 450.00
              }
            ]
          },
          sentAt: subDays(now, 8),
          viewedAt: subDays(now, 6),
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 8),
                sentTo: 'info@mountainviewlandscaping.com',
                subject: 'Invoice SJ-2024-002 - Q1 2024 Bookkeeping Services'
              }
            ]
          },
          notes: 'Quarterly bookkeeping with sales tax preparation'
        }
      ]
    },
    // Pacific Northwest Consulting Invoice
    {
      clientName: 'Pacific Northwest Consulting',
      engagementName: 'Business Setup - Pacific Northwest Consulting',
      invoices: [
        {
          invoiceNumber: 'SJ-2024-003',
          title: 'Business Entity Setup Services',
          description: 'New business entity formation and initial tax consultation services',
          status: 'paid',
          invoiceDate: subDays(now, 65),
          dueDate: subDays(now, 35), // Net 30
          subtotal: 750.00,
          taxAmount: 0.00,
          discountAmount: 0.00,
          totalAmount: 750.00,
          paidAmount: 750.00,
          balanceAmount: 0.00,
          currency: 'USD',
          paymentTerms: 'net_30',
          lineItems: {
            items: [
              {
                id: '1',
                description: 'Business Setup Services - Fixed Fee',
                quantity: 1,
                rate: 750.00,
                amount: 750.00
              }
            ]
          },
          sentAt: subDays(now, 65),
          viewedAt: subDays(now, 63),
          paidAt: subDays(now, 40),
          paymentHistory: {
            payments: [
              {
                id: '1',
                amount: 750.00,
                date: subDays(now, 40),
                method: 'ach_transfer',
                reference: 'ACH-PNW-240115',
                checkNumber: null
              }
            ]
          },
          emailHistory: {
            sends: [
              {
                id: '1',
                sentAt: subDays(now, 65),
                sentTo: 'patricia@pnwconsulting.com',
                subject: 'Invoice SJ-2024-003 - Business Setup Services'
              }
            ]
          },
          notes: 'One-time setup for new business entity'
        }
      ]
    }
  ]
};

export const invoiceStatuses = [
  'draft',      // Draft, not yet sent
  'sent',       // Sent to client
  'viewed',     // Client has viewed
  'partial',    // Partially paid
  'paid',       // Fully paid
  'overdue',    // Past due date
  'cancelled'   // Cancelled invoice
];

export const paymentMethods = [
  'check',
  'ach_transfer',
  'wire_transfer',
  'credit_card',
  'cash',
  'other'
];

export const paymentTerms = [
  'due_on_receipt',
  'net_15',
  'net_30',
  'net_45',
  'net_60'
];

export const invoiceTemplates = {
  'standard': {
    name: 'Standard Invoice Template',
    fields: ['invoice_number', 'date', 'due_date', 'client_info', 'line_items', 'totals', 'payment_terms', 'notes'],
    footer: 'Thank you for your business!'
  },
  'detailed': {
    name: 'Detailed Service Invoice',
    fields: ['invoice_number', 'date', 'due_date', 'client_info', 'engagement_info', 'detailed_line_items', 'time_breakdown', 'totals', 'payment_terms', 'notes'],
    footer: 'We appreciate the opportunity to serve you.'
  },
  'retainer': {
    name: 'Monthly Retainer Invoice',
    fields: ['invoice_number', 'date', 'due_date', 'client_info', 'retainer_period', 'retainer_amount', 'totals', 'payment_terms'],
    footer: 'Your monthly retainer invoice.'
  }
};