import { z } from 'zod';

// Pricing tier definitions
export enum PricingTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

// Add-on modules
export enum AddonModule {
  ADVANCED_ANALYTICS = 'advanced_analytics',
  DOCUMENT_AUTOMATION = 'document_automation',
  CLIENT_PORTAL_PLUS = 'client_portal_plus',
  COMPLIANCE_SUITE = 'compliance_suite',
  INTEGRATION_HUB = 'integration_hub',
  WHITE_LABEL = 'white_label',
}

// Usage metrics
export enum UsageMetric {
  DOCUMENTS_PROCESSED = 'documents_processed',
  STORAGE_GB = 'storage_gb',
  API_CALLS = 'api_calls',
  USERS = 'users',
  CLIENTS = 'clients',
}

// Pricing configuration schema
export const PricingConfigSchema = z.object({
  tier: z.nativeEnum(PricingTier),
  basePriceMonthly: z.number().positive(),
  basePriceYearly: z.number().positive(),
  perUserPrice: z.number().min(0),
  features: z.array(z.string()),
  limits: z.record(z.nativeEnum(UsageMetric), z.number().positive()),
  stripeProductId: z.string(),
  stripePriceMonthlyId: z.string(),
  stripePriceYearlyId: z.string(),
  popular: z.boolean().optional(),
  description: z.string(),
});

export type PricingConfig = z.infer<typeof PricingConfigSchema>;

// Addon configuration schema
export const AddonConfigSchema = z.object({
  module: z.nativeEnum(AddonModule),
  name: z.string(),
  description: z.string(),
  priceMonthly: z.number().positive(),
  priceYearly: z.number().positive(),
  stripeProductId: z.string(),
  stripePriceMonthlyId: z.string(),
  stripePriceYearlyId: z.string(),
  availableForTiers: z.array(z.nativeEnum(PricingTier)),
  features: z.array(z.string()),
});

export type AddonConfig = z.infer<typeof AddonConfigSchema>;

// Usage-based pricing schema
export const UsagePricingSchema = z.object({
  metric: z.nativeEnum(UsageMetric),
  name: z.string(),
  freeLimit: z.record(z.nativeEnum(PricingTier), z.number().min(0)),
  overagePrice: z.number().positive(),
  stripeProductId: z.string(),
  stripePriceId: z.string(),
  unit: z.string(),
});

export type UsagePricing = z.infer<typeof UsagePricingSchema>;

// Main pricing tiers configuration
export const PRICING_TIERS: Record<PricingTier, PricingConfig> = {
  [PricingTier.STARTER]: {
    tier: PricingTier.STARTER,
    basePriceMonthly: 29,
    basePriceYearly: 290, // 2 months free
    perUserPrice: 15,
    description: 'Perfect for solo practitioners and small firms',
    features: [
      'Up to 3 users',
      'Basic client management',
      'Document storage (50GB)',
      'Email support',
      'Basic reporting',
      'Mobile app access',
      'Standard integrations',
      'Document templates',
    ],
    limits: {
      [UsageMetric.USERS]: 3,
      [UsageMetric.CLIENTS]: 50,
      [UsageMetric.DOCUMENTS_PROCESSED]: 500,
      [UsageMetric.STORAGE_GB]: 50,
      [UsageMetric.API_CALLS]: 10000,
    },
    stripeProductId: 'prod_starter',
    stripePriceMonthlyId: 'price_starter_monthly',
    stripePriceYearlyId: 'price_starter_yearly',
  },

  [PricingTier.PROFESSIONAL]: {
    tier: PricingTier.PROFESSIONAL,
    basePriceMonthly: 79,
    basePriceYearly: 790, // 2 months free
    perUserPrice: 25,
    description: 'Ideal for growing practices with advanced needs',
    popular: true,
    features: [
      'Up to 15 users',
      'Advanced client management',
      'Document storage (250GB)',
      'Priority email & phone support',
      'Advanced reporting & analytics',
      'Mobile app access',
      'Premium integrations',
      'Custom document templates',
      'Workflow automation',
      'Client portal',
      'Time tracking',
      'Project management',
    ],
    limits: {
      [UsageMetric.USERS]: 15,
      [UsageMetric.CLIENTS]: 250,
      [UsageMetric.DOCUMENTS_PROCESSED]: 2500,
      [UsageMetric.STORAGE_GB]: 250,
      [UsageMetric.API_CALLS]: 50000,
    },
    stripeProductId: 'prod_professional',
    stripePriceMonthlyId: 'price_professional_monthly',
    stripePriceYearlyId: 'price_professional_yearly',
  },

  [PricingTier.ENTERPRISE]: {
    tier: PricingTier.ENTERPRISE,
    basePriceMonthly: 199,
    basePriceYearly: 1990, // 2 months free
    perUserPrice: 35,
    description: 'For large firms requiring enterprise-grade features',
    features: [
      'Unlimited users',
      'Enterprise client management',
      'Unlimited document storage',
      'Dedicated account manager',
      'Custom reporting & analytics',
      'Mobile app access',
      'Enterprise integrations',
      'Custom branding',
      'Advanced workflow automation',
      'Enhanced client portal',
      'Advanced time tracking',
      'Project management suite',
      'API access',
      'Single sign-on (SSO)',
      'Advanced security features',
      'Custom training & onboarding',
    ],
    limits: {
      [UsageMetric.USERS]: 999999,
      [UsageMetric.CLIENTS]: 999999,
      [UsageMetric.DOCUMENTS_PROCESSED]: 999999,
      [UsageMetric.STORAGE_GB]: 999999,
      [UsageMetric.API_CALLS]: 999999,
    },
    stripeProductId: 'prod_enterprise',
    stripePriceMonthlyId: 'price_enterprise_monthly',
    stripePriceYearlyId: 'price_enterprise_yearly',
  },
};

// Add-on modules configuration
export const ADDON_MODULES: Record<AddonModule, AddonConfig> = {
  [AddonModule.ADVANCED_ANALYTICS]: {
    module: AddonModule.ADVANCED_ANALYTICS,
    name: 'Advanced Analytics',
    description: 'Deep insights with custom dashboards and reporting',
    priceMonthly: 39,
    priceYearly: 390,
    stripeProductId: 'prod_addon_analytics',
    stripePriceMonthlyId: 'price_addon_analytics_monthly',
    stripePriceYearlyId: 'price_addon_analytics_yearly',
    availableForTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
    features: [
      'Custom dashboard builder',
      'Advanced KPI tracking',
      'Predictive analytics',
      'Export to Excel/PDF',
      'Automated reports',
    ],
  },

  [AddonModule.DOCUMENT_AUTOMATION]: {
    module: AddonModule.DOCUMENT_AUTOMATION,
    name: 'Document Automation',
    description: 'AI-powered document processing and generation',
    priceMonthly: 59,
    priceYearly: 590,
    stripeProductId: 'prod_addon_doc_automation',
    stripePriceMonthlyId: 'price_addon_doc_automation_monthly',
    stripePriceYearlyId: 'price_addon_doc_automation_yearly',
    availableForTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
    features: [
      'AI document extraction',
      'Automated form filling',
      'Smart template generation',
      'OCR processing',
      'Document validation',
    ],
  },

  [AddonModule.CLIENT_PORTAL_PLUS]: {
    module: AddonModule.CLIENT_PORTAL_PLUS,
    name: 'Client Portal Plus',
    description: 'Enhanced client collaboration features',
    priceMonthly: 29,
    priceYearly: 290,
    stripeProductId: 'prod_addon_portal_plus',
    stripePriceMonthlyId: 'price_addon_portal_plus_monthly',
    stripePriceYearlyId: 'price_addon_portal_plus_yearly',
    availableForTiers: [PricingTier.STARTER, PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
    features: [
      'Custom client branding',
      'Advanced file sharing',
      'Client messaging system',
      'Document approval workflows',
      'Mobile client app',
    ],
  },

  [AddonModule.COMPLIANCE_SUITE]: {
    module: AddonModule.COMPLIANCE_SUITE,
    name: 'Compliance Suite',
    description: 'Advanced compliance and audit tools',
    priceMonthly: 79,
    priceYearly: 790,
    stripeProductId: 'prod_addon_compliance',
    stripePriceMonthlyId: 'price_addon_compliance_monthly',
    stripePriceYearlyId: 'price_addon_compliance_yearly',
    availableForTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
    features: [
      'Automated compliance checks',
      'Audit trail management',
      'Regulatory reporting',
      'Risk assessment tools',
      'Compliance calendar',
    ],
  },

  [AddonModule.INTEGRATION_HUB]: {
    module: AddonModule.INTEGRATION_HUB,
    name: 'Integration Hub',
    description: 'Connect with 100+ third-party applications',
    priceMonthly: 49,
    priceYearly: 490,
    stripeProductId: 'prod_addon_integrations',
    stripePriceMonthlyId: 'price_addon_integrations_monthly',
    stripePriceYearlyId: 'price_addon_integrations_yearly',
    availableForTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
    features: [
      'QuickBooks integration',
      'Xero integration',
      'Tax software connections',
      'CRM integrations',
      'Custom API connections',
    ],
  },

  [AddonModule.WHITE_LABEL]: {
    module: AddonModule.WHITE_LABEL,
    name: 'White Label',
    description: 'Brand the platform as your own',
    priceMonthly: 199,
    priceYearly: 1990,
    stripeProductId: 'prod_addon_white_label',
    stripePriceMonthlyId: 'price_addon_white_label_monthly',
    stripePriceYearlyId: 'price_addon_white_label_yearly',
    availableForTiers: [PricingTier.ENTERPRISE],
    features: [
      'Custom domain',
      'Full brand customization',
      'Custom email templates',
      'White-label mobile app',
      'Custom login page',
    ],
  },
};

// Usage-based pricing configuration
export const USAGE_PRICING: Record<UsageMetric, UsagePricing> = {
  [UsageMetric.DOCUMENTS_PROCESSED]: {
    metric: UsageMetric.DOCUMENTS_PROCESSED,
    name: 'Additional Documents',
    freeLimit: {
      [PricingTier.STARTER]: 500,
      [PricingTier.PROFESSIONAL]: 2500,
      [PricingTier.ENTERPRISE]: 999999,
    },
    overagePrice: 0.10, // $0.10 per document
    stripeProductId: 'prod_usage_documents',
    stripePriceId: 'price_usage_documents',
    unit: 'document',
  },

  [UsageMetric.STORAGE_GB]: {
    metric: UsageMetric.STORAGE_GB,
    name: 'Additional Storage',
    freeLimit: {
      [PricingTier.STARTER]: 50,
      [PricingTier.PROFESSIONAL]: 250,
      [PricingTier.ENTERPRISE]: 999999,
    },
    overagePrice: 2.00, // $2.00 per GB
    stripeProductId: 'prod_usage_storage',
    stripePriceId: 'price_usage_storage',
    unit: 'GB',
  },

  [UsageMetric.API_CALLS]: {
    metric: UsageMetric.API_CALLS,
    name: 'Additional API Calls',
    freeLimit: {
      [PricingTier.STARTER]: 10000,
      [PricingTier.PROFESSIONAL]: 50000,
      [PricingTier.ENTERPRISE]: 999999,
    },
    overagePrice: 0.01, // $0.01 per 100 API calls
    stripeProductId: 'prod_usage_api',
    stripePriceId: 'price_usage_api',
    unit: '100 calls',
  },

  [UsageMetric.USERS]: {
    metric: UsageMetric.USERS,
    name: 'Additional Users',
    freeLimit: {
      [PricingTier.STARTER]: 3,
      [PricingTier.PROFESSIONAL]: 15,
      [PricingTier.ENTERPRISE]: 999999,
    },
    overagePrice: 0, // Handled by per-user pricing
    stripeProductId: 'prod_usage_users',
    stripePriceId: 'price_usage_users',
    unit: 'user',
  },

  [UsageMetric.CLIENTS]: {
    metric: UsageMetric.CLIENTS,
    name: 'Additional Clients',
    freeLimit: {
      [PricingTier.STARTER]: 50,
      [PricingTier.PROFESSIONAL]: 250,
      [PricingTier.ENTERPRISE]: 999999,
    },
    overagePrice: 1.00, // $1.00 per client
    stripeProductId: 'prod_usage_clients',
    stripePriceId: 'price_usage_clients',
    unit: 'client',
  },
};

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 14,
  allowedTiers: [PricingTier.STARTER, PricingTier.PROFESSIONAL],
  gracePeriodDays: 3,
  features: {
    [PricingTier.STARTER]: PRICING_TIERS[PricingTier.STARTER].features,
    [PricingTier.PROFESSIONAL]: PRICING_TIERS[PricingTier.PROFESSIONAL].features,
  },
  limits: {
    [PricingTier.STARTER]: {
      ...PRICING_TIERS[PricingTier.STARTER].limits,
      [UsageMetric.USERS]: 2, // Reduced for trial
      [UsageMetric.CLIENTS]: 10, // Reduced for trial
    },
    [PricingTier.PROFESSIONAL]: {
      ...PRICING_TIERS[PricingTier.PROFESSIONAL].limits,
      [UsageMetric.USERS]: 5, // Reduced for trial
      [UsageMetric.CLIENTS]: 25, // Reduced for trial
    },
  },
};

// Feature flags per tier
export const FEATURE_FLAGS: Record<PricingTier, Record<string, boolean>> = {
  [PricingTier.STARTER]: {
    advanced_analytics: false,
    document_automation: false,
    client_portal: true,
    api_access: false,
    sso: false,
    custom_branding: false,
    priority_support: false,
    workflow_automation: false,
    time_tracking: false,
    project_management: false,
  },

  [PricingTier.PROFESSIONAL]: {
    advanced_analytics: true,
    document_automation: true,
    client_portal: true,
    api_access: true,
    sso: false,
    custom_branding: false,
    priority_support: true,
    workflow_automation: true,
    time_tracking: true,
    project_management: true,
  },

  [PricingTier.ENTERPRISE]: {
    advanced_analytics: true,
    document_automation: true,
    client_portal: true,
    api_access: true,
    sso: true,
    custom_branding: true,
    priority_support: true,
    workflow_automation: true,
    time_tracking: true,
    project_management: true,
  },
};

// Helper functions
export const getPricingTier = (tier: string): PricingConfig | null => {
  const pricingTier = tier as PricingTier;
  return PRICING_TIERS[pricingTier] || null;
};

export const getAddonModule = (module: string): AddonConfig | null => {
  const addonModule = module as AddonModule;
  return ADDON_MODULES[addonModule] || null;
};

export const calculateTotalPrice = (
  tier: PricingTier,
  users: number,
  addons: AddonModule[] = [],
  yearly: boolean = false
): number => {
  const tierConfig = PRICING_TIERS[tier];
  const basePrice = yearly ? tierConfig.basePriceYearly : tierConfig.basePriceMonthly;

  // Calculate user-based pricing
  const extraUsers = Math.max(0, users - tierConfig.limits[UsageMetric.USERS]);
  const userPrice = extraUsers * tierConfig.perUserPrice * (yearly ? 12 : 1);

  // Calculate addon pricing
  const addonPrice = addons.reduce((total, addonKey) => {
    const addon = ADDON_MODULES[addonKey];
    if (addon && addon.availableForTiers.includes(tier)) {
      return total + (yearly ? addon.priceYearly : addon.priceMonthly);
    }
    return total;
  }, 0);

  return basePrice + userPrice + addonPrice;
};

export const calculateUsageOverage = (
  tier: PricingTier,
  metric: UsageMetric,
  usage: number
): number => {
  const usageConfig = USAGE_PRICING[metric];
  const freeLimit = usageConfig.freeLimit[tier];

  if (usage <= freeLimit) {
    return 0;
  }

  const overage = usage - freeLimit;
  return overage * usageConfig.overagePrice;
};

export const isFeatureEnabled = (tier: PricingTier, feature: string): boolean => {
  return FEATURE_FLAGS[tier][feature] || false;
};

export const getAvailableAddons = (tier: PricingTier): AddonConfig[] => {
  return Object.values(ADDON_MODULES).filter(addon =>
    addon.availableForTiers.includes(tier)
  );
};