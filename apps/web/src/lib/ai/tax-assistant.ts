import { openaiClient, AIResponse } from './openai-client';
import { taxPrompts, formatPrompt } from './prompts';

export interface TaxEntityInfo {
  entityType: 'individual' | 'sole_proprietorship' | 'partnership' | 'llc' | 's_corp' | 'c_corp' | 'non_profit';
  filingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';
  state: string;
  employeeCount?: number;
  annualRevenue?: number;
  industryCode?: string;
  businessStartDate?: Date;
  fiscalYearEnd?: Date;
}

export interface TaxData {
  taxYear: number;
  entity: TaxEntityInfo;
  income: {
    w2Income?: number;
    businessIncome?: number;
    investmentIncome?: number;
    rentalIncome?: number;
    otherIncome?: number;
    totalIncome: number;
  };
  deductions: {
    standardDeduction?: number;
    itemizedDeductions?: Record<string, number>;
    businessDeductions?: Record<string, number>;
    totalDeductions: number;
  };
  credits: {
    availableCredits: Record<string, number>;
    totalCredits: number;
  };
  payments: {
    withheld?: number;
    estimated?: number;
    totalPayments: number;
  };
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    category: string;
    deductible?: boolean;
  }>;
}

export interface TaxOptimization {
  strategy: string;
  category: 'deduction' | 'credit' | 'timing' | 'structure' | 'planning';
  potentialSavings: number;
  confidence: number;
  description: string;
  requirements: string[];
  risks: string[];
  timeframe: 'current_year' | 'next_year' | 'multi_year';
  complexity: 'simple' | 'moderate' | 'complex';
  professionalAdviceRequired: boolean;
  irsCodeReferences?: string[];
}

export interface DeductionOpportunity {
  deductionType: string;
  estimatedAmount: number;
  confidence: number;
  description: string;
  requirements: string[];
  documentation: string[];
  limitations?: string;
  irsForm?: string;
  deadlines?: Array<{
    action: string;
    deadline: Date;
  }>;
}

export interface ComplianceCheck {
  requirementType: 'filing' | 'payment' | 'documentation' | 'election' | 'disclosure';
  description: string;
  status: 'compliant' | 'non_compliant' | 'attention_required' | 'unknown';
  dueDate?: Date;
  penalty?: number;
  correctionSteps?: string[];
  irsForm?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TaxDeadline {
  date: Date;
  description: string;
  entityTypes: string[];
  penalty?: string;
  extensions?: {
    availableUntil: Date;
    requirements: string[];
  };
  completed?: boolean;
}

export interface TaxAlert {
  id: string;
  type: 'law_change' | 'deadline' | 'opportunity' | 'compliance' | 'audit';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  effectiveDate?: Date;
  actionRequired?: string;
  deadline?: Date;
  relevantEntities: string[];
  source: string;
  url?: string;
}

export interface TaxReport {
  id: string;
  taxYear: number;
  entityInfo: TaxEntityInfo;
  generatedAt: Date;
  optimizations: TaxOptimization[];
  deductionOpportunities: DeductionOpportunity[];
  complianceChecks: ComplianceCheck[];
  estimatedTaxLiability: {
    federal: number;
    state: number;
    selfEmployment?: number;
    total: number;
  };
  potentialSavings: number;
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
    savings?: number;
    deadline?: Date;
  }>;
  alerts: TaxAlert[];
  confidence: number;
  disclaimer: string;
}

class TaxAssistantService {
  // Current tax year and key dates
  private readonly currentTaxYear = new Date().getFullYear();
  private readonly taxDeadlines: TaxDeadline[] = [
    {
      date: new Date(this.currentTaxYear + 1, 0, 31), // January 31
      description: '1099 and W-2 Forms Due to Recipients',
      entityTypes: ['all'],
      penalty: 'Up to $280 per form',
    },
    {
      date: new Date(this.currentTaxYear + 1, 2, 15), // March 15
      description: 'Partnership and S-Corp Returns Due',
      entityTypes: ['partnership', 's_corp'],
      penalty: '$210 per month per partner/shareholder',
      extensions: {
        availableUntil: new Date(this.currentTaxYear + 1, 8, 15), // September 15
        requirements: ['File Form 7004'],
      },
    },
    {
      date: new Date(this.currentTaxYear + 1, 3, 15), // April 15
      description: 'Individual and C-Corp Returns Due',
      entityTypes: ['individual', 'c_corp'],
      penalty: 'Varies by entity type',
      extensions: {
        availableUntil: new Date(this.currentTaxYear + 1, 9, 15), // October 15
        requirements: ['File extension form'],
      },
    },
  ];

  constructor() {}

  public isReady(): boolean {
    return openaiClient.isReady();
  }

  /**
   * Generate comprehensive tax optimization recommendations
   */
  public async optimizeTaxStrategy(
    taxData: TaxData,
    organizationId?: string
  ): Promise<TaxOptimization[]> {
    if (!this.isReady()) {
      throw new Error('Tax Assistant service is not ready');
    }

    const prompt = formatPrompt(taxPrompts.optimization, {
      entityType: taxData.entity.entityType,
      incomeData: JSON.stringify(taxData.income),
      expenseData: JSON.stringify(taxData.deductions),
      currentDeductions: JSON.stringify(taxData.deductions.businessDeductions || {}),
      taxYear: taxData.taxYear.toString(),
      clientGoals: 'minimize tax liability while maintaining compliance',
    });

    try {
      const response = await openaiClient.createStructuredCompletion<TaxOptimization[]>(
        prompt.user,
        {
          type: 'array',
          items: {
            strategy: 'string',
            category: 'string',
            potentialSavings: 'number',
            confidence: 'number',
            description: 'string',
            requirements: 'array of strings',
            risks: 'array of strings',
            timeframe: 'string',
            complexity: 'string',
            professionalAdviceRequired: 'boolean',
            irsCodeReferences: 'array of strings (optional)'
          }
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.1,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Tax optimization failed:', error);
      throw new Error(`Failed to generate tax optimization: ${error}`);
    }
  }

  /**
   * Find potential deductions based on business activities and expenses
   */
  public async findDeductions(
    taxData: TaxData,
    organizationId?: string
  ): Promise<DeductionOpportunity[]> {
    if (!this.isReady()) {
      throw new Error('Tax Assistant service is not ready');
    }

    const prompt = formatPrompt(taxPrompts.deductionFinder, {
      businessType: taxData.entity.entityType,
      expenseCategories: Object.keys(taxData.deductions.businessDeductions || {}).join(', '),
      businessActivities: taxData.entity.industryCode || 'professional services',
      businessAssets: 'office equipment, software, vehicles', // Would come from asset data
      employeeData: `${taxData.entity.employeeCount || 0} employees`,
      priorDeductions: JSON.stringify(taxData.deductions.businessDeductions || {}),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<DeductionOpportunity[]>(
        prompt.user,
        {
          type: 'array',
          items: {
            deductionType: 'string',
            estimatedAmount: 'number',
            confidence: 'number',
            description: 'string',
            requirements: 'array of strings',
            documentation: 'array of strings',
            limitations: 'string (optional)',
            irsForm: 'string (optional)',
            deadlines: 'array of objects with action, deadline (optional)'
          }
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.1,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Deduction finding failed:', error);
      return [];
    }
  }

  /**
   * Check tax compliance and identify issues
   */
  public async checkCompliance(
    taxData: TaxData,
    organizationId?: string
  ): Promise<ComplianceCheck[]> {
    if (!this.isReady()) {
      throw new Error('Tax Assistant service is not ready');
    }

    const upcomingDeadlines = this.getUpcomingDeadlines(taxData.entity.entityType);

    const prompt = formatPrompt(taxPrompts.complianceCheck, {
      returnType: `${taxData.entity.entityType} for tax year ${taxData.taxYear}`,
      taxYear: taxData.taxYear.toString(),
      entityDetails: JSON.stringify(taxData.entity),
      transactionData: JSON.stringify(taxData.transactions.slice(-50)), // Recent transactions
      currentFilings: JSON.stringify({}), // Would come from filing status
      upcomingDeadlines: JSON.stringify(upcomingDeadlines),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<ComplianceCheck[]>(
        prompt.user,
        {
          type: 'array',
          items: {
            requirementType: 'string',
            description: 'string',
            status: 'string',
            dueDate: 'string (optional)',
            penalty: 'number (optional)',
            correctionSteps: 'array of strings (optional)',
            irsForm: 'string (optional)',
            priority: 'string'
          }
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.1,
        }
      );

      return response.data.map(check => ({
        ...check,
        dueDate: check.dueDate ? new Date(check.dueDate) : undefined,
      })) || [];
    } catch (error) {
      console.error('Compliance check failed:', error);
      return [];
    }
  }

  /**
   * Calculate estimated tax liability
   */
  public async calculateEstimatedTax(
    taxData: TaxData,
    organizationId?: string
  ): Promise<{
    federal: number;
    state: number;
    selfEmployment?: number;
    total: number;
    breakdown: Record<string, number>;
  }> {
    // Basic tax calculation (would use more sophisticated tax engine in practice)
    const taxableIncome = taxData.income.totalIncome - taxData.deductions.totalDeductions;

    // Federal tax estimation (simplified)
    let federalTax = 0;
    if (taxData.entity.entityType === 'individual') {
      // 2024 tax brackets (simplified)
      if (taxableIncome > 609350) federalTax = taxableIncome * 0.37;
      else if (taxableIncome > 243725) federalTax = taxableIncome * 0.35;
      else if (taxableIncome > 191050) federalTax = taxableIncome * 0.32;
      else if (taxableIncome > 100525) federalTax = taxableIncome * 0.24;
      else if (taxableIncome > 47150) federalTax = taxableIncome * 0.22;
      else if (taxableIncome > 11000) federalTax = taxableIncome * 0.12;
      else federalTax = taxableIncome * 0.10;
    } else {
      // Corporate rates
      federalTax = taxableIncome * 0.21;
    }

    // State tax estimation (would vary by state)
    const stateTax = taxableIncome * 0.05; // Simplified state rate

    // Self-employment tax
    const selfEmploymentTax = taxData.income.businessIncome
      ? taxData.income.businessIncome * 0.1413
      : 0;

    // Apply credits
    federalTax = Math.max(0, federalTax - taxData.credits.totalCredits);

    const total = federalTax + stateTax + (selfEmploymentTax || 0);

    return {
      federal: federalTax,
      state: stateTax,
      selfEmployment: selfEmploymentTax || undefined,
      total,
      breakdown: {
        'Taxable Income': taxableIncome,
        'Federal Tax': federalTax,
        'State Tax': stateTax,
        ...(selfEmploymentTax ? { 'Self-Employment Tax': selfEmploymentTax } : {}),
        'Total Credits': -taxData.credits.totalCredits,
      },
    };
  }

  /**
   * Generate comprehensive tax report
   */
  public async generateTaxReport(
    taxData: TaxData,
    organizationId?: string
  ): Promise<TaxReport> {
    const reportId = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [optimizations, deductionOpportunities, complianceChecks, estimatedTaxLiability] =
      await Promise.all([
        this.optimizeTaxStrategy(taxData, organizationId),
        this.findDeductions(taxData, organizationId),
        this.checkCompliance(taxData, organizationId),
        this.calculateEstimatedTax(taxData, organizationId),
      ]);

    const potentialSavings = optimizations.reduce((total, opt) => total + opt.potentialSavings, 0) +
                            deductionOpportunities.reduce((total, ded) => total + ded.estimatedAmount * 0.25, 0); // Assume 25% tax rate

    const recommendations = this.generateRecommendations(
      optimizations,
      deductionOpportunities,
      complianceChecks
    );

    const alerts = await this.getTaxAlerts(taxData.entity);

    return {
      id: reportId,
      taxYear: taxData.taxYear,
      entityInfo: taxData.entity,
      generatedAt: new Date(),
      optimizations,
      deductionOpportunities,
      complianceChecks,
      estimatedTaxLiability,
      potentialSavings,
      recommendations,
      alerts,
      confidence: this.calculateReportConfidence(optimizations, deductionOpportunities, complianceChecks),
      disclaimer: 'This analysis is for informational purposes only and does not constitute professional tax advice. Consult with a qualified tax professional before making any tax-related decisions.',
    };
  }

  /**
   * Get upcoming tax deadlines for entity type
   */
  public getUpcomingDeadlines(entityType: string): TaxDeadline[] {
    const now = new Date();
    return this.taxDeadlines.filter(deadline =>
      deadline.date > now &&
      (deadline.entityTypes.includes(entityType) || deadline.entityTypes.includes('all'))
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get tax law changes and alerts
   */
  public async getTaxAlerts(entityInfo: TaxEntityInfo): Promise<TaxAlert[]> {
    // This would integrate with tax law databases and IRS updates
    const alerts: TaxAlert[] = [
      {
        id: 'alert_001',
        type: 'law_change',
        severity: 'info',
        title: 'Section 199A Deduction Updates',
        description: 'New guidance issued for Qualified Business Income deduction calculations',
        effectiveDate: new Date('2024-01-01'),
        relevantEntities: ['sole_proprietorship', 'partnership', 's_corp'],
        source: 'IRS Notice 2024-01',
      },
      {
        id: 'alert_002',
        type: 'deadline',
        severity: 'warning',
        title: 'Quarterly Estimated Tax Payment Due',
        description: 'Next quarterly estimated tax payment is due',
        deadline: new Date(this.currentTaxYear + 1, 0, 15), // January 15
        actionRequired: 'Calculate and submit estimated tax payment',
        relevantEntities: ['individual', 'sole_proprietorship'],
        source: 'IRS Form 1040ES',
      },
    ];

    return alerts.filter(alert =>
      alert.relevantEntities.includes(entityInfo.entityType)
    );
  }

  /**
   * Monitor tax law changes
   */
  public async monitorTaxLawChanges(
    entityTypes: string[],
    organizationId?: string
  ): Promise<TaxAlert[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      // This would use AI to monitor tax law changes from various sources
      const response = await openaiClient.createCompletion(
        `Monitor recent tax law changes affecting these entity types: ${entityTypes.join(', ')}. Focus on changes in the last 6 months.`,
        {
          systemMessage: 'You are a tax law expert monitoring recent changes in tax regulations, IRS guidance, and legislative updates. Identify significant changes that affect business entities.',
          organizationId,
          temperature: 0.1,
        }
      );

      // Parse and structure the response into alerts
      // This would be more sophisticated in practice
      return [];
    } catch (error) {
      console.error('Tax law monitoring failed:', error);
      return [];
    }
  }

  /**
   * Calculate quarterly estimated tax payments
   */
  public calculateQuarterlyPayments(
    annualTaxLiability: number,
    priorYearTax: number,
    quartersPaid: number = 0
  ): {
    quarterlyAmount: number;
    safeHarborAmount: number;
    recommendedAmount: number;
    nextDueDate: Date;
  } {
    // Calculate required annual payment (safe harbor rules)
    const currentYearRequired = annualTaxLiability * 0.9; // 90% of current year
    const priorYearRequired = priorYearTax; // 100% of prior year (or 110% if AGI > $150k)

    const safeHarborAmount = Math.min(currentYearRequired, priorYearRequired);
    const quarterlyAmount = annualTaxLiability / 4;
    const recommendedAmount = Math.max(quarterlyAmount, safeHarborAmount / 4);

    // Calculate next due date
    const now = new Date();
    const currentYear = now.getFullYear();
    const dueDates = [
      new Date(currentYear, 3, 15), // April 15
      new Date(currentYear, 5, 15), // June 15
      new Date(currentYear, 8, 15), // September 15
      new Date(currentYear + 1, 0, 15), // January 15
    ];

    const nextDueDate = dueDates.find(date => date > now) || dueDates[0];

    return {
      quarterlyAmount,
      safeHarborAmount: safeHarborAmount / 4,
      recommendedAmount,
      nextDueDate,
    };
  }

  /**
   * Helper methods
   */
  private generateRecommendations(
    optimizations: TaxOptimization[],
    deductions: DeductionOpportunity[],
    compliance: ComplianceCheck[]
  ): Array<{
    category: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
    savings?: number;
    deadline?: Date;
  }> {
    const recommendations = [];

    // High-impact optimizations
    optimizations
      .filter(opt => opt.potentialSavings > 1000)
      .forEach(opt => {
        recommendations.push({
          category: 'Tax Optimization',
          recommendation: opt.strategy,
          priority: opt.potentialSavings > 5000 ? 'high' : 'medium' as 'high' | 'medium',
          savings: opt.potentialSavings,
        });
      });

    // High-confidence deductions
    deductions
      .filter(ded => ded.confidence > 0.8)
      .forEach(ded => {
        recommendations.push({
          category: 'Deductions',
          recommendation: `Claim ${ded.deductionType}: ${ded.description}`,
          priority: ded.estimatedAmount > 2000 ? 'high' : 'medium' as 'high' | 'medium',
          savings: ded.estimatedAmount * 0.25, // Estimate tax savings
        });
      });

    // Critical compliance issues
    compliance
      .filter(comp => comp.priority === 'critical' || comp.priority === 'high')
      .forEach(comp => {
        recommendations.push({
          category: 'Compliance',
          recommendation: comp.description,
          priority: comp.priority as 'high',
          deadline: comp.dueDate,
        });
      });

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  private calculateReportConfidence(
    optimizations: TaxOptimization[],
    deductions: DeductionOpportunity[],
    compliance: ComplianceCheck[]
  ): number {
    const avgOptimizationConfidence = optimizations.length > 0
      ? optimizations.reduce((sum, opt) => sum + opt.confidence, 0) / optimizations.length
      : 0.7;

    const avgDeductionConfidence = deductions.length > 0
      ? deductions.reduce((sum, ded) => sum + ded.confidence, 0) / deductions.length
      : 0.7;

    const complianceCompleteness = compliance.length > 0 ? 0.8 : 0.6;

    return (avgOptimizationConfidence + avgDeductionConfidence + complianceCompleteness) / 3;
  }
}

export const taxAssistantService = new TaxAssistantService();
export default taxAssistantService;