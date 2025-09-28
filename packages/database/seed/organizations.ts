export const organizations = [
  {
    name: 'TaxPro Associates',
    subdomain: 'taxpro',
    subscriptionTier: 'enterprise',
    stripeCustomerId: 'cus_demo_taxpro_enterprise',
    teamSize: 15,
    description: 'Full-service CPA firm specializing in tax preparation, business advisory, and CFO services for growing companies.',
    founded: '2008',
    location: 'San Francisco, CA'
  },
  {
    name: 'QuickBooks Advisory Group',
    subdomain: 'qbadvisory',
    subscriptionTier: 'professional',
    stripeCustomerId: 'cus_demo_qbag_professional',
    teamSize: 8,
    description: 'Modern accounting firm focused on QuickBooks implementations, monthly bookkeeping, and financial planning.',
    founded: '2015',
    location: 'Austin, TX'
  },
  {
    name: 'Smith & Jones CPAs',
    subdomain: 'smithjones',
    subscriptionTier: 'starter',
    stripeCustomerId: 'cus_demo_sj_starter',
    teamSize: 3,
    description: 'Boutique CPA practice serving small businesses and individuals with personalized tax and accounting services.',
    founded: '1995',
    location: 'Portland, OR'
  }
];

export const organizationFeatures = {
  'enterprise': [
    'unlimited_clients',
    'advanced_workflows',
    'custom_reports',
    'api_access',
    'white_label',
    'priority_support',
    'audit_tools',
    'multi_location'
  ],
  'professional': [
    'up_to_100_clients',
    'standard_workflows',
    'basic_reports',
    'quickbooks_sync',
    'team_collaboration',
    'email_support'
  ],
  'starter': [
    'up_to_25_clients',
    'basic_workflows',
    'simple_reports',
    'document_storage',
    'email_support'
  ]
};