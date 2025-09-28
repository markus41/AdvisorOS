import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create permissions first
  console.log('Creating permissions...')
  const permissions = await Promise.all([
    // User Management
    prisma.permission.create({
      data: {
        name: 'users:create',
        description: 'Create new users',
        category: 'user_management',
        action: 'create',
        resource: 'users',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'users:read',
        description: 'View user information',
        category: 'user_management',
        action: 'read',
        resource: 'users',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'users:update',
        description: 'Update user information',
        category: 'user_management',
        action: 'update',
        resource: 'users',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'users:delete',
        description: 'Delete users',
        category: 'user_management',
        action: 'delete',
        resource: 'users',
      },
    }),
    // Client Management
    prisma.permission.create({
      data: {
        name: 'clients:create',
        description: 'Create new clients',
        category: 'client_management',
        action: 'create',
        resource: 'clients',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'clients:read',
        description: 'View client information',
        category: 'client_management',
        action: 'read',
        resource: 'clients',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'clients:update',
        description: 'Update client information',
        category: 'client_management',
        action: 'update',
        resource: 'clients',
      },
    }),
    // Document Management
    prisma.permission.create({
      data: {
        name: 'documents:create',
        description: 'Upload documents',
        category: 'document_management',
        action: 'create',
        resource: 'documents',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'documents:read',
        description: 'View documents',
        category: 'document_management',
        action: 'read',
        resource: 'documents',
      },
    }),
    // Billing
    prisma.permission.create({
      data: {
        name: 'invoices:create',
        description: 'Create invoices',
        category: 'billing',
        action: 'create',
        resource: 'invoices',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'invoices:read',
        description: 'View invoices',
        category: 'billing',
        action: 'read',
        resource: 'invoices',
      },
    }),
    // Reporting
    prisma.permission.create({
      data: {
        name: 'reports:create',
        description: 'Generate reports',
        category: 'reporting',
        action: 'create',
        resource: 'reports',
      },
    }),
  ])

  // Create organizations with different subscription tiers
  console.log('Creating organizations...')

  const demoOrg = await prisma.organization.create({
    data: {
      name: 'Demo CPA Firm',
      subdomain: 'demo',
      subscriptionTier: 'trial',
      stripeCustomerId: 'cus_demo123',
    },
  })

  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Accounting Services',
      subdomain: 'acme',
      subscriptionTier: 'professional',
      stripeCustomerId: 'cus_acme456',
    },
  })

  const eliteOrg = await prisma.organization.create({
    data: {
      name: 'Elite Financial Group',
      subdomain: 'elite',
      subscriptionTier: 'enterprise',
      stripeCustomerId: 'cus_elite789',
    },
  })

  // Create subscriptions
  console.log('Creating subscriptions...')
  const now = new Date()
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  await prisma.subscription.create({
    data: {
      organizationId: demoOrg.id,
      planName: 'trial',
      planType: 'monthly',
      status: 'trialing',
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthFromNow,
      trialStart: now,
      trialEnd: oneMonthFromNow,
      stripeSubscriptionId: 'sub_demo123',
      stripePriceId: 'price_trial',
      stripeCustomerId: 'cus_demo123',
      unitAmount: 0,
      features: {
        users: 3,
        clients: 10,
        storage: '1GB',
        features: ['basic_reporting', 'document_management']
      },
      limits: {
        maxUsers: 3,
        maxClients: 10,
        maxStorageGB: 1
      },
      usage: {
        users: 0,
        clients: 0,
        storageUsedGB: 0
      }
    },
  })

  await prisma.subscription.create({
    data: {
      organizationId: acmeOrg.id,
      planName: 'professional',
      planType: 'yearly',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: oneYearFromNow,
      stripeSubscriptionId: 'sub_acme456',
      stripePriceId: 'price_professional_yearly',
      stripeCustomerId: 'cus_acme456',
      unitAmount: 5940, // $59.40/month billed yearly
      features: {
        users: 10,
        clients: 100,
        storage: '50GB',
        features: ['advanced_reporting', 'document_management', 'workflow_automation', 'client_portal']
      },
      limits: {
        maxUsers: 10,
        maxClients: 100,
        maxStorageGB: 50
      },
      usage: {
        users: 0,
        clients: 0,
        storageUsedGB: 0
      }
    },
  })

  await prisma.subscription.create({
    data: {
      organizationId: eliteOrg.id,
      planName: 'enterprise',
      planType: 'yearly',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: oneYearFromNow,
      stripeSubscriptionId: 'sub_elite789',
      stripePriceId: 'price_enterprise_yearly',
      stripeCustomerId: 'cus_elite789',
      unitAmount: 19940, // $199.40/month billed yearly
      features: {
        users: -1, // unlimited
        clients: -1, // unlimited
        storage: '500GB',
        features: ['all_features', 'white_label', 'api_access', 'priority_support']
      },
      limits: {
        maxUsers: -1,
        maxClients: -1,
        maxStorageGB: 500
      },
      usage: {
        users: 0,
        clients: 0,
        storageUsedGB: 0
      }
    },
  })

  // Create users for each organization
  console.log('Creating users...')
  const hashedPassword = await hash('password123', 12)

  // Demo org users
  const demoOwner = await prisma.user.create({
    data: {
      email: 'john.doe@demo.com',
      name: 'John Doe',
      password: hashedPassword,
      role: 'owner',
      organizationId: demoOrg.id,
      isActive: true,
      createdBy: 'system',
    },
  })

  const demoStaff = await prisma.user.create({
    data: {
      email: 'sarah.smith@demo.com',
      name: 'Sarah Smith',
      password: hashedPassword,
      role: 'staff',
      organizationId: demoOrg.id,
      isActive: true,
      createdBy: demoOwner.id,
    },
  })

  // Acme org users
  const acmeOwner = await prisma.user.create({
    data: {
      email: 'michael.johnson@acme.com',
      name: 'Michael Johnson',
      password: hashedPassword,
      role: 'owner',
      organizationId: acmeOrg.id,
      isActive: true,
      createdBy: 'system',
    },
  })

  const acmeCPA = await prisma.user.create({
    data: {
      email: 'lisa.wilson@acme.com',
      name: 'Lisa Wilson',
      password: hashedPassword,
      role: 'cpa',
      organizationId: acmeOrg.id,
      isActive: true,
      createdBy: acmeOwner.id,
    },
  })

  const acmeAdmin = await prisma.user.create({
    data: {
      email: 'robert.brown@acme.com',
      name: 'Robert Brown',
      password: hashedPassword,
      role: 'admin',
      organizationId: acmeOrg.id,
      isActive: true,
      createdBy: acmeOwner.id,
    },
  })

  // Elite org users
  const eliteOwner = await prisma.user.create({
    data: {
      email: 'jennifer.davis@elite.com',
      name: 'Jennifer Davis',
      password: hashedPassword,
      role: 'owner',
      organizationId: eliteOrg.id,
      isActive: true,
      createdBy: 'system',
    },
  })

  // Create team members
  console.log('Creating team members...')
  const demoOwnerTeamMember = await prisma.teamMember.create({
    data: {
      userId: demoOwner.id,
      organizationId: demoOrg.id,
      role: 'owner',
      department: 'admin',
      title: 'Managing Partner',
      specializations: ['Tax', 'Business Advisory'],
      hourlyRate: 150.00,
      hireDate: new Date('2023-01-01'),
      createdBy: 'system',
    },
  })

  const demoStaffTeamMember = await prisma.teamMember.create({
    data: {
      userId: demoStaff.id,
      organizationId: demoOrg.id,
      role: 'staff',
      department: 'tax',
      title: 'Tax Preparer',
      specializations: ['Individual Tax Returns', 'Small Business Tax'],
      hourlyRate: 45.00,
      hireDate: new Date('2023-06-01'),
      createdBy: demoOwner.id,
    },
  })

  const acmeOwnerTeamMember = await prisma.teamMember.create({
    data: {
      userId: acmeOwner.id,
      organizationId: acmeOrg.id,
      role: 'owner',
      department: 'admin',
      title: 'CEO & Managing Partner',
      specializations: ['Strategic Planning', 'Business Development'],
      hourlyRate: 200.00,
      hireDate: new Date('2020-01-01'),
      createdBy: 'system',
    },
  })

  const acmeCPATeamMember = await prisma.teamMember.create({
    data: {
      userId: acmeCPA.id,
      organizationId: acmeOrg.id,
      role: 'senior_cpa',
      department: 'audit',
      title: 'Senior CPA',
      specializations: ['Financial Audits', 'Compliance', 'Financial Reporting'],
      hourlyRate: 125.00,
      hireDate: new Date('2021-03-15'),
      createdBy: acmeOwner.id,
    },
  })

  // Create sample clients
  console.log('Creating sample clients...')

  // Demo org clients
  const demoClient1 = await prisma.client.create({
    data: {
      businessName: 'ABC Manufacturing LLC',
      legalName: 'ABC Manufacturing, LLC',
      taxId: '12-3456789',
      primaryContactEmail: 'finance@abc-manufacturing.com',
      primaryContactName: 'Jane Smith',
      primaryContactPhone: '(555) 123-4567',
      businessAddress: '123 Industrial Blvd, Manufacturing City, ST 12345',
      mailingAddress: '123 Industrial Blvd, Manufacturing City, ST 12345',
      businessType: 'LLC',
      industry: 'Manufacturing',
      website: 'https://abc-manufacturing.com',
      status: 'active',
      riskLevel: 'medium',
      annualRevenue: 2500000.00,
      organizationId: demoOrg.id,
      createdBy: demoOwner.id,
    },
  })

  const demoClient2 = await prisma.client.create({
    data: {
      businessName: 'Tech Startup Inc',
      legalName: 'Tech Startup, Inc.',
      taxId: '98-7654321',
      primaryContactEmail: 'ceo@techstartup.com',
      primaryContactName: 'Alex Johnson',
      primaryContactPhone: '(555) 987-6543',
      businessAddress: '456 Innovation Dr, Tech City, ST 54321',
      businessType: 'Corporation',
      industry: 'Technology',
      website: 'https://techstartup.com',
      status: 'active',
      riskLevel: 'high',
      annualRevenue: 750000.00,
      organizationId: demoOrg.id,
      createdBy: demoOwner.id,
    },
  })

  // Acme org clients
  const acmeClient1 = await prisma.client.create({
    data: {
      businessName: 'Global Retail Corp',
      legalName: 'Global Retail Corporation',
      taxId: '11-2233445',
      primaryContactEmail: 'cfo@globalretail.com',
      primaryContactName: 'Maria Rodriguez',
      primaryContactPhone: '(555) 111-2233',
      businessAddress: '789 Commerce St, Retail City, ST 67890',
      businessType: 'Corporation',
      industry: 'Retail',
      website: 'https://globalretail.com',
      status: 'active',
      riskLevel: 'low',
      annualRevenue: 15000000.00,
      organizationId: acmeOrg.id,
      createdBy: acmeOwner.id,
    },
  })

  const acmeClient2 = await prisma.client.create({
    data: {
      businessName: 'Local Restaurant Group',
      legalName: 'Local Restaurant Group, LLC',
      taxId: '55-6677889',
      primaryContactEmail: 'owner@localrestaurants.com',
      primaryContactName: 'Tony Benedetto',
      primaryContactPhone: '(555) 555-6677',
      businessAddress: '321 Main St, Food City, ST 13579',
      businessType: 'LLC',
      industry: 'Food Service',
      status: 'active',
      riskLevel: 'medium',
      annualRevenue: 1200000.00,
      organizationId: acmeOrg.id,
      createdBy: acmeOwner.id,
    },
  })

  // Create sample workflows
  console.log('Creating workflows...')
  const taxWorkflow = await prisma.workflow.create({
    data: {
      name: 'Individual Tax Return Preparation',
      description: 'Standard workflow for preparing individual tax returns',
      type: 'tax_preparation',
      isTemplate: true,
      isActive: true,
      organizationId: demoOrg.id,
      steps: {
        steps: [
          { id: '1', name: 'Client Interview', estimatedHours: 1, dependencies: [] },
          { id: '2', name: 'Document Collection', estimatedHours: 0.5, dependencies: ['1'] },
          { id: '3', name: 'Data Entry', estimatedHours: 2, dependencies: ['2'] },
          { id: '4', name: 'Tax Preparation', estimatedHours: 3, dependencies: ['3'] },
          { id: '5', name: 'Review', estimatedHours: 1, dependencies: ['4'] },
          { id: '6', name: 'Client Review & Signature', estimatedHours: 0.5, dependencies: ['5'] },
          { id: '7', name: 'E-Filing', estimatedHours: 0.25, dependencies: ['6'] }
        ]
      },
      settings: {
        autoAssign: true,
        notificationSettings: {
          emailReminders: true,
          slackNotifications: false
        }
      },
      createdBy: demoOwner.id,
    },
  })

  const bookkeepingWorkflow = await prisma.workflow.create({
    data: {
      name: 'Monthly Bookkeeping',
      description: 'Monthly bookkeeping and financial statement preparation',
      type: 'bookkeeping',
      isTemplate: true,
      isActive: true,
      organizationId: acmeOrg.id,
      steps: {
        steps: [
          { id: '1', name: 'Bank Reconciliation', estimatedHours: 2, dependencies: [] },
          { id: '2', name: 'Transaction Categorization', estimatedHours: 3, dependencies: ['1'] },
          { id: '3', name: 'Journal Entries', estimatedHours: 1, dependencies: ['2'] },
          { id: '4', name: 'Financial Statement Preparation', estimatedHours: 2, dependencies: ['3'] },
          { id: '5', name: 'Review & Finalization', estimatedHours: 1, dependencies: ['4'] },
          { id: '6', name: 'Client Delivery', estimatedHours: 0.5, dependencies: ['5'] }
        ]
      },
      settings: {
        autoAssign: true,
        recurringSchedule: 'monthly'
      },
      createdBy: acmeOwner.id,
    },
  })

  // Create sample engagements
  console.log('Creating engagements...')
  const engagement1 = await prisma.engagement.create({
    data: {
      name: '2023 Tax Return - ABC Manufacturing',
      description: 'Preparation of 2023 corporate tax return for ABC Manufacturing LLC',
      type: 'tax_preparation',
      status: 'in_progress',
      priority: 'high',
      startDate: new Date('2024-02-01'),
      dueDate: new Date('2024-03-15'),
      estimatedHours: 15,
      actualHours: 8.5,
      hourlyRate: 125.00,
      clientId: demoClient1.id,
      organizationId: demoOrg.id,
      assignedToId: demoOwner.id,
      createdById: demoOwner.id,
      workflowId: taxWorkflow.id,
      year: 2023,
    },
  })

  const engagement2 = await prisma.engagement.create({
    data: {
      name: 'Monthly Bookkeeping - February 2024',
      description: 'Monthly bookkeeping services for Tech Startup Inc',
      type: 'bookkeeping',
      status: 'completed',
      priority: 'normal',
      startDate: new Date('2024-03-01'),
      dueDate: new Date('2024-03-10'),
      completedDate: new Date('2024-03-08'),
      estimatedHours: 8,
      actualHours: 7.5,
      hourlyRate: 85.00,
      clientId: demoClient2.id,
      organizationId: demoOrg.id,
      assignedToId: demoStaff.id,
      createdById: demoOwner.id,
      workflowId: bookkeepingWorkflow.id,
    },
  })

  // Create sample tasks
  console.log('Creating tasks...')
  await prisma.task.create({
    data: {
      title: 'Review 2023 Financial Statements',
      description: 'Review and analyze the 2023 financial statements for accuracy and completeness',
      status: 'in_progress',
      priority: 'high',
      taskType: 'document_review',
      estimatedHours: 3,
      actualHours: 2,
      startDate: new Date('2024-02-01'),
      dueDate: new Date('2024-02-05'),
      assignedToId: demoOwner.id,
      createdById: demoOwner.id,
      engagementId: engagement1.id,
      organizationId: demoOrg.id,
      checklist: {
        items: [
          { id: '1', text: 'Verify bank reconciliations', completed: true },
          { id: '2', text: 'Review journal entries', completed: true },
          { id: '3', text: 'Check account classifications', completed: false },
          { id: '4', text: 'Verify supporting documentation', completed: false }
        ]
      },
      updatedBy: demoOwner.id,
    },
  })

  await prisma.task.create({
    data: {
      title: 'Prepare Schedule M-1',
      description: 'Prepare Schedule M-1 reconciliation for corporate tax return',
      status: 'pending',
      priority: 'normal',
      taskType: 'preparation',
      estimatedHours: 2,
      startDate: new Date('2024-02-10'),
      dueDate: new Date('2024-02-15'),
      assignedToId: demoStaff.id,
      createdById: demoOwner.id,
      engagementId: engagement1.id,
      organizationId: demoOrg.id,
      updatedBy: demoOwner.id,
    },
  })

  // Create sample invoices
  console.log('Creating invoices...')
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-001',
      title: 'Tax Preparation Services - ABC Manufacturing',
      description: 'Professional services for 2023 corporate tax return preparation',
      status: 'sent',
      invoiceDate: new Date('2024-02-15'),
      dueDate: new Date('2024-03-15'),
      subtotal: 1875.00,
      taxAmount: 0.00,
      discountAmount: 0.00,
      totalAmount: 1875.00,
      paidAmount: 0.00,
      balanceAmount: 1875.00,
      currency: 'USD',
      paymentTerms: 'net_30',
      clientId: demoClient1.id,
      engagementId: engagement1.id,
      organizationId: demoOrg.id,
      createdById: demoOwner.id,
      lineItems: {
        items: [
          {
            id: '1',
            description: 'Tax preparation services',
            quantity: 15,
            rate: 125.00,
            amount: 1875.00
          }
        ]
      },
      sentAt: new Date('2024-02-15'),
      updatedBy: demoOwner.id,
    },
  })

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-002',
      title: 'Bookkeeping Services - February 2024',
      description: 'Monthly bookkeeping services for February 2024',
      status: 'paid',
      invoiceDate: new Date('2024-03-01'),
      dueDate: new Date('2024-03-15'),
      subtotal: 637.50,
      taxAmount: 0.00,
      discountAmount: 0.00,
      totalAmount: 637.50,
      paidAmount: 637.50,
      balanceAmount: 0.00,
      currency: 'USD',
      paymentTerms: 'net_15',
      clientId: demoClient2.id,
      engagementId: engagement2.id,
      organizationId: demoOrg.id,
      createdById: demoOwner.id,
      lineItems: {
        items: [
          {
            id: '1',
            description: 'Monthly bookkeeping services',
            quantity: 7.5,
            rate: 85.00,
            amount: 637.50
          }
        ]
      },
      sentAt: new Date('2024-03-01'),
      viewedAt: new Date('2024-03-02'),
      paidAt: new Date('2024-03-10'),
      paymentHistory: {
        payments: [
          {
            id: '1',
            amount: 637.50,
            date: '2024-03-10',
            method: 'bank_transfer',
            reference: 'TXN-ABC123'
          }
        ]
      },
      updatedBy: demoOwner.id,
    },
  })

  // Create sample notes
  console.log('Creating notes...')
  await prisma.note.create({
    data: {
      title: 'Client Meeting Notes',
      content: 'Discussed 2023 tax situation. Client mentioned new equipment purchases that may qualify for Section 179 deduction. Need to obtain purchase invoices and verify eligibility.',
      noteType: 'meeting',
      priority: 'normal',
      isPrivate: false,
      tags: ['tax', 'section179', 'equipment'],
      clientId: demoClient1.id,
      engagementId: engagement1.id,
      authorId: demoOwner.id,
      reminderDate: new Date('2024-02-20'),
      createdBy: demoOwner.id,
      updatedBy: demoOwner.id,
    },
  })

  await prisma.note.create({
    data: {
      title: 'QuickBooks Integration',
      content: 'Successfully connected client QuickBooks account. All transactions from January 2024 have been imported. Need to review categorizations before finalizing February books.',
      noteType: 'general',
      priority: 'low',
      isPrivate: false,
      tags: ['quickbooks', 'integration', 'bookkeeping'],
      clientId: demoClient2.id,
      engagementId: engagement2.id,
      authorId: demoStaff.id,
      createdBy: demoStaff.id,
      updatedBy: demoStaff.id,
    },
  })

  // Create sample documents
  console.log('Creating sample documents...')
  await prisma.document.create({
    data: {
      fileName: '2023_W2_ABC_Manufacturing.pdf',
      fileUrl: '/uploads/documents/2023_W2_ABC_Manufacturing.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 245760, // ~240KB
      category: 'tax_document',
      subcategory: 'w2',
      year: 2023,
      version: 1,
      isLatestVersion: true,
      tags: ['w2', 'payroll', '2023'],
      description: 'W-2 forms for ABC Manufacturing employees',
      clientId: demoClient1.id,
      organizationId: demoOrg.id,
      uploadedBy: demoOwner.id,
      extractedData: {
        totalWages: 1250000.00,
        totalTaxWithheld: 187500.00,
        employeeCount: 25
      },
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalFileName: '2023_W2_ABC_Manufacturing.pdf'
      },
      checksum: 'abc123def456',
      isConfidential: true,
      retentionDate: new Date('2031-12-31'), // 7 years from tax year
      createdBy: demoOwner.id,
      updatedBy: demoOwner.id,
    },
  })

  await prisma.document.create({
    data: {
      fileName: 'Feb_2024_Bank_Statement.pdf',
      fileUrl: '/uploads/documents/Feb_2024_Bank_Statement.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 156432, // ~153KB
      category: 'financial_statement',
      subcategory: 'bank_statement',
      year: 2024,
      quarter: 1,
      version: 1,
      isLatestVersion: true,
      tags: ['bank_statement', 'february', '2024'],
      description: 'February 2024 bank statement for primary operating account',
      clientId: demoClient2.id,
      organizationId: demoOrg.id,
      uploadedBy: demoStaff.id,
      extractedData: {
        openingBalance: 25430.50,
        closingBalance: 31250.75,
        totalDeposits: 45820.25,
        totalWithdrawals: 40000.00
      },
      metadata: {
        accountNumber: '****1234',
        bankName: 'First National Bank'
      },
      checksum: 'def789ghi012',
      isConfidential: true,
      retentionDate: new Date('2031-12-31'),
      createdBy: demoStaff.id,
      updatedBy: demoStaff.id,
    },
  })

  // Create sample reports
  console.log('Creating sample reports...')
  await prisma.report.create({
    data: {
      name: 'Monthly Client Summary - February 2024',
      description: 'Summary of client activities and engagement progress for February 2024',
      reportType: 'engagement_summary',
      format: 'pdf',
      status: 'completed',
      fileUrl: '/reports/monthly_client_summary_feb_2024.pdf',
      fileSize: 2048576, // 2MB
      parameters: {
        period: 'february_2024',
        includeFinancials: true,
        includeTaskSummary: true
      },
      data: {
        totalClients: 2,
        activeEngagements: 2,
        completedTasks: 5,
        totalRevenue: 2512.50,
        avgEngagementValue: 1256.25
      },
      metadata: {
        generatedBy: 'system',
        templateVersion: '1.0'
      },
      organizationId: demoOrg.id,
      createdById: demoOwner.id,
      generatedAt: new Date(),
      downloadCount: 3,
      updatedBy: demoOwner.id,
    },
  })

  // Create audit logs
  console.log('Creating audit logs...')
  await prisma.auditLog.create({
    data: {
      action: 'create',
      entityType: 'client',
      entityId: demoClient1.id,
      newValues: {
        businessName: 'ABC Manufacturing LLC',
        primaryContactEmail: 'finance@abc-manufacturing.com',
        status: 'active'
      },
      metadata: {
        source: 'web_app',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      ipAddress: '192.168.1.100',
      sessionId: 'sess_abc123',
      organizationId: demoOrg.id,
      userId: demoOwner.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'update',
      entityType: 'engagement',
      entityId: engagement1.id,
      oldValues: {
        status: 'planning',
        actualHours: 0
      },
      newValues: {
        status: 'in_progress',
        actualHours: 8.5
      },
      metadata: {
        source: 'web_app',
        changedFields: ['status', 'actualHours']
      },
      ipAddress: '192.168.1.100',
      sessionId: 'sess_abc123',
      organizationId: demoOrg.id,
      userId: demoOwner.id,
    },
  })

  // Create auth events
  console.log('Creating auth events...')
  await prisma.authEvent.create({
    data: {
      eventType: 'login',
      success: true,
      description: 'Successful login',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      organizationId: demoOrg.id,
      userId: demoOwner.id,
      sessionId: 'sess_abc123',
      metadata: {
        loginMethod: 'email_password',
        mfaUsed: false
      },
    },
  })

  await prisma.authAttempt.create({
    data: {
      email: 'john.doe@demo.com',
      success: true,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      organizationId: demoOrg.id,
      userId: demoOwner.id,
      sessionId: 'sess_abc123',
      metadata: {
        loginMethod: 'email_password'
      },
    },
  })

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Organizations: 3`)
  console.log(`- Users: 6`)
  console.log(`- Team Members: 4`)
  console.log(`- Permissions: 12`)
  console.log(`- Subscriptions: 3`)
  console.log(`- Clients: 4`)
  console.log(`- Workflows: 2`)
  console.log(`- Engagements: 2`)
  console.log(`- Tasks: 2`)
  console.log(`- Invoices: 2`)
  console.log(`- Notes: 2`)
  console.log(`- Documents: 2`)
  console.log(`- Reports: 1`)
  console.log(`- Audit Logs: 2`)
  console.log(`- Auth Events: 1`)
  console.log(`- Auth Attempts: 1`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })