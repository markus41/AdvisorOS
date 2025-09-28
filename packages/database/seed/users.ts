import bcrypt from 'bcryptjs';

// Demo password (hashed): "demo123!"
const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo123!', 10);

export const usersData = {
  'taxpro': [
    {
      email: 'michael.chen@taxpro.com',
      name: 'Michael Chen',
      password: DEMO_PASSWORD_HASH,
      role: 'owner',
      title: 'Managing Partner',
      department: 'management',
      specializations: ['tax_planning', 'business_advisory', 'estate_planning'],
      hourlyRate: 450.00,
      hireDate: '2008-01-15'
    },
    {
      email: 'sarah.rodriguez@taxpro.com',
      name: 'Sarah Rodriguez',
      password: DEMO_PASSWORD_HASH,
      role: 'admin',
      title: 'Operations Manager',
      department: 'admin',
      specializations: ['operations', 'client_relations', 'technology'],
      hourlyRate: 125.00,
      hireDate: '2010-03-22'
    },
    {
      email: 'david.johnson@taxpro.com',
      name: 'David Johnson',
      password: DEMO_PASSWORD_HASH,
      role: 'senior_cpa',
      title: 'Senior Tax Manager',
      department: 'tax',
      specializations: ['corporate_tax', 'international_tax', 'tax_controversy'],
      hourlyRate: 275.00,
      hireDate: '2012-08-01'
    },
    {
      email: 'jennifer.kim@taxpro.com',
      name: 'Jennifer Kim',
      password: DEMO_PASSWORD_HASH,
      role: 'senior_cpa',
      title: 'Senior Audit Manager',
      department: 'audit',
      specializations: ['financial_audits', 'sox_compliance', 'internal_controls'],
      hourlyRate: 265.00,
      hireDate: '2013-05-15'
    },
    {
      email: 'robert.williams@taxpro.com',
      name: 'Robert Williams',
      password: DEMO_PASSWORD_HASH,
      role: 'cpa',
      title: 'Tax Senior',
      department: 'tax',
      specializations: ['individual_tax', 'partnership_tax', 'estate_tax'],
      hourlyRate: 185.00,
      hireDate: '2018-01-10'
    },
    {
      email: 'amanda.garcia@taxpro.com',
      name: 'Amanda Garcia',
      password: DEMO_PASSWORD_HASH,
      role: 'cpa',
      title: 'Advisory Senior',
      department: 'advisory',
      specializations: ['financial_planning', 'cash_flow_analysis', 'business_valuation'],
      hourlyRate: 195.00,
      hireDate: '2019-06-01'
    },
    {
      email: 'james.brown@taxpro.com',
      name: 'James Brown',
      password: DEMO_PASSWORD_HASH,
      role: 'staff',
      title: 'Staff Accountant',
      department: 'tax',
      specializations: ['tax_preparation', 'bookkeeping', 'payroll'],
      hourlyRate: 85.00,
      hireDate: '2021-09-15'
    },
    {
      email: 'lisa.davis@taxpro.com',
      name: 'Lisa Davis',
      password: DEMO_PASSWORD_HASH,
      role: 'staff',
      title: 'Audit Staff',
      department: 'audit',
      specializations: ['audit_procedures', 'testing', 'documentation'],
      hourlyRate: 75.00,
      hireDate: '2022-02-01'
    }
  ],
  'qbadvisory': [
    {
      email: 'mark.thompson@qbadvisory.com',
      name: 'Mark Thompson',
      password: DEMO_PASSWORD_HASH,
      role: 'owner',
      title: 'Founder & CEO',
      department: 'management',
      specializations: ['quickbooks', 'business_advisory', 'technology_consulting'],
      hourlyRate: 350.00,
      hireDate: '2015-03-01'
    },
    {
      email: 'jessica.martinez@qbadvisory.com',
      name: 'Jessica Martinez',
      password: DEMO_PASSWORD_HASH,
      role: 'admin',
      title: 'Client Success Manager',
      department: 'admin',
      specializations: ['client_relations', 'project_management', 'training'],
      hourlyRate: 95.00,
      hireDate: '2016-07-15'
    },
    {
      email: 'brian.lee@qbadvisory.com',
      name: 'Brian Lee',
      password: DEMO_PASSWORD_HASH,
      role: 'senior_cpa',
      title: 'Senior Bookkeeping Manager',
      department: 'bookkeeping',
      specializations: ['monthly_bookkeeping', 'financial_reporting', 'quickbooks_setup'],
      hourlyRate: 225.00,
      hireDate: '2017-01-20'
    },
    {
      email: 'stephanie.wilson@qbadvisory.com',
      name: 'Stephanie Wilson',
      password: DEMO_PASSWORD_HASH,
      role: 'cpa',
      title: 'Tax Manager',
      department: 'tax',
      specializations: ['small_business_tax', 'quickbooks_integration', 'tax_planning'],
      hourlyRate: 165.00,
      hireDate: '2018-04-10'
    },
    {
      email: 'carlos.gonzalez@qbadvisory.com',
      name: 'Carlos Gonzalez',
      password: DEMO_PASSWORD_HASH,
      role: 'staff',
      title: 'Bookkeeping Specialist',
      department: 'bookkeeping',
      specializations: ['data_entry', 'reconciliation', 'payroll_processing'],
      hourlyRate: 65.00,
      hireDate: '2020-08-01'
    },
    {
      email: 'emily.anderson@qbadvisory.com',
      name: 'Emily Anderson',
      password: DEMO_PASSWORD_HASH,
      role: 'staff',
      title: 'Junior Accountant',
      department: 'bookkeeping',
      specializations: ['accounts_payable', 'accounts_receivable', 'bank_reconciliation'],
      hourlyRate: 55.00,
      hireDate: '2021-11-01'
    }
  ],
  'smithjones': [
    {
      email: 'william.smith@smithjones.com',
      name: 'William Smith',
      password: DEMO_PASSWORD_HASH,
      role: 'owner',
      title: 'Senior Partner',
      department: 'management',
      specializations: ['individual_tax', 'small_business', 'estate_planning'],
      hourlyRate: 285.00,
      hireDate: '1995-01-01'
    },
    {
      email: 'patricia.jones@smithjones.com',
      name: 'Patricia Jones',
      password: DEMO_PASSWORD_HASH,
      role: 'senior_cpa',
      title: 'Partner',
      department: 'tax',
      specializations: ['business_tax', 'payroll_tax', 'tax_resolution'],
      hourlyRate: 225.00,
      hireDate: '2001-06-15'
    },
    {
      email: 'thomas.miller@smithjones.com',
      name: 'Thomas Miller',
      password: DEMO_PASSWORD_HASH,
      role: 'staff',
      title: 'Staff Accountant',
      department: 'tax',
      specializations: ['tax_preparation', 'bookkeeping', 'payroll'],
      hourlyRate: 75.00,
      hireDate: '2020-01-15'
    }
  ]
};

export const rolePermissions = {
  'owner': [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'clients.create', 'clients.read', 'clients.update', 'clients.delete',
    'documents.create', 'documents.read', 'documents.update', 'documents.delete',
    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
    'reports.create', 'reports.read', 'reports.update', 'reports.delete',
    'engagements.create', 'engagements.read', 'engagements.update', 'engagements.delete',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
    'workflows.create', 'workflows.read', 'workflows.update', 'workflows.delete',
    'organization.update', 'billing.read', 'billing.update'
  ],
  'admin': [
    'users.create', 'users.read', 'users.update',
    'clients.create', 'clients.read', 'clients.update', 'clients.delete',
    'documents.create', 'documents.read', 'documents.update', 'documents.delete',
    'invoices.create', 'invoices.read', 'invoices.update',
    'reports.create', 'reports.read', 'reports.update',
    'engagements.create', 'engagements.read', 'engagements.update',
    'tasks.create', 'tasks.read', 'tasks.update',
    'workflows.read', 'workflows.update'
  ],
  'senior_cpa': [
    'users.read',
    'clients.create', 'clients.read', 'clients.update',
    'documents.create', 'documents.read', 'documents.update', 'documents.delete',
    'invoices.create', 'invoices.read', 'invoices.update',
    'reports.create', 'reports.read', 'reports.update',
    'engagements.create', 'engagements.read', 'engagements.update',
    'tasks.create', 'tasks.read', 'tasks.update',
    'workflows.read'
  ],
  'cpa': [
    'users.read',
    'clients.read', 'clients.update',
    'documents.create', 'documents.read', 'documents.update',
    'invoices.read', 'invoices.update',
    'reports.create', 'reports.read',
    'engagements.read', 'engagements.update',
    'tasks.create', 'tasks.read', 'tasks.update',
    'workflows.read'
  ],
  'staff': [
    'clients.read',
    'documents.create', 'documents.read', 'documents.update',
    'reports.read',
    'engagements.read',
    'tasks.read', 'tasks.update',
    'workflows.read'
  ]
};