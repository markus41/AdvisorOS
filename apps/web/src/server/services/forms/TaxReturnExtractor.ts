import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { DocumentMetadata, ValidationError } from '../ocr.service';

export interface TaxReturnData {
  // Form Information
  form_type: '1040' | '1040EZ' | '1040A' | '1120' | '1120S' | '1065' | '990' | 'OTHER';
  tax_year: number;
  amended_return: boolean;
  final_return: boolean;

  // Taxpayer Information (Individual)
  primary_taxpayer?: {
    name: string;
    ssn: string;
    date_of_birth?: Date;
    occupation?: string;
  };

  spouse_taxpayer?: {
    name: string;
    ssn: string;
    date_of_birth?: Date;
    occupation?: string;
  };

  // Business Information (Business Returns)
  business_info?: {
    business_name: string;
    ein: string;
    business_address: string;
    business_type: string;
    principal_activity: string;
    accounting_method: 'cash' | 'accrual' | 'other';
  };

  // Filing Information
  filing_status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_widow';
  address: string;
  phone_number?: string;
  email?: string;

  // Dependents
  dependents: Array<{
    name: string;
    ssn: string;
    relationship: string;
    months_lived_in_home: number;
  }>;

  // Income Information
  income: {
    wages_salaries: number; // W-2 income
    taxable_interest: number;
    tax_exempt_interest: number;
    ordinary_dividends: number;
    qualified_dividends: number;
    taxable_refunds: number;
    alimony_received: number;
    business_income: number; // Schedule C
    capital_gain_loss: number; // Schedule D
    other_gains_losses: number;
    ira_distributions: number;
    pensions_annuities: number;
    rental_real_estate: number; // Schedule E
    farm_income: number; // Schedule F
    unemployment_compensation: number;
    social_security_benefits: number;
    other_income: number;
    total_income: number;
    adjusted_gross_income: number;
  };

  // Deductions
  deductions: {
    standard_deduction: number;
    itemized_deductions: number;
    medical_dental: number;
    state_local_taxes: number;
    real_estate_taxes: number;
    personal_property_taxes: number;
    mortgage_interest: number;
    investment_interest: number;
    charitable_contributions: number;
    casualty_theft_losses: number;
    unreimbursed_employee_expenses: number;
    tax_preparation_fees: number;
    other_itemized: number;
    total_deductions: number;
  };

  // Tax Calculation
  tax_computation: {
    taxable_income: number;
    tax_before_credits: number;
    child_tax_credit: number;
    education_credits: number;
    retirement_savings_credit: number;
    earned_income_credit: number;
    additional_child_tax_credit: number;
    other_credits: number;
    total_credits: number;
    tax_after_credits: number;
    self_employment_tax: number;
    alternative_minimum_tax: number;
    total_tax: number;
  };

  // Payments and Withholdings
  payments: {
    federal_tax_withheld: number;
    estimated_tax_payments: number;
    earned_income_credit: number;
    additional_child_tax_credit: number;
    american_opportunity_credit: number;
    first_time_homebuyer_credit: number;
    other_payments: number;
    total_payments: number;
  };

  // Refund or Amount Owed
  refund_or_owe: {
    overpaid_amount: number; // Refund
    amount_owed: number;
    applied_to_next_year: number;
    refund_amount: number;
  };

  // Business-Specific Information (for business returns)
  business_financials?: {
    gross_receipts: number;
    total_income: number;
    total_deductions: number;
    taxable_income: number;
    total_tax: number;
    payments_credits: number;
    balance_due_refund: number;
  };

  // Schedule Information
  schedules_included: string[]; // e.g., ['A', 'B', 'C', 'D', 'E', 'F']

  // Professional Information
  preparer_info?: {
    preparer_name: string;
    preparer_ptin: string;
    firm_name: string;
    firm_ein: string;
    firm_address: string;
    preparer_phone: string;
    self_employed: boolean;
  };

  // Electronic Filing
  electronic_filing: {
    pin: string;
    signature_date?: Date;
    spouse_pin?: string;
    spouse_signature_date?: Date;
  };
}

export class TaxReturnExtractor {
  /**
   * Extract tax return data
   */
  public async extract(
    fileBuffer: Buffer,
    metadata: DocumentMetadata,
    formRecognizerClient: DocumentAnalysisClient
  ): Promise<TaxReturnData> {
    if (!formRecognizerClient) {
      throw new Error('Form Recognizer client not provided');
    }

    try {
      // Try prebuilt tax models
      try {
        const poller = await formRecognizerClient.beginAnalyzeDocument(
          'prebuilt-tax.us.1040',
          fileBuffer
        );
        const result = await poller.pollUntilDone();
        return this.parse1040Result(result);
      } catch (error) {
        console.warn('1040 model failed, using general extraction:', error);
      }

      // Fallback to general document analysis
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return this.parseGeneralTaxResult(result);

    } catch (error) {
      throw new Error(`Tax return extraction failed: ${error}`);
    }
  }

  /**
   * Parse 1040 specific results
   */
  private parse1040Result(result: any): TaxReturnData {
    const document = result.documents?.[0];
    if (!document) {
      throw new Error('No tax return document detected');
    }

    const fields = document.fields || {};

    // Extract dependents
    const dependents = this.extractDependents(fields.Dependents);

    // Build income object
    const income = {
      wages_salaries: this.parseAmount(fields.WagesAmount?.content),
      taxable_interest: this.parseAmount(fields.TaxableInterestAmount?.content),
      tax_exempt_interest: this.parseAmount(fields.TaxExemptInterestAmount?.content),
      ordinary_dividends: this.parseAmount(fields.OrdinaryDividendsAmount?.content),
      qualified_dividends: this.parseAmount(fields.QualifiedDividendsAmount?.content),
      taxable_refunds: this.parseAmount(fields.TaxableRefundsAmount?.content),
      alimony_received: this.parseAmount(fields.AlimonyReceivedAmount?.content),
      business_income: this.parseAmount(fields.BusinessIncomeAmount?.content),
      capital_gain_loss: this.parseAmount(fields.CapitalGainLossAmount?.content),
      other_gains_losses: this.parseAmount(fields.OtherGainsLossesAmount?.content),
      ira_distributions: this.parseAmount(fields.IRADistributionsAmount?.content),
      pensions_annuities: this.parseAmount(fields.PensionsAnnuitiesAmount?.content),
      rental_real_estate: this.parseAmount(fields.RentalRealEstateAmount?.content),
      farm_income: this.parseAmount(fields.FarmIncomeAmount?.content),
      unemployment_compensation: this.parseAmount(fields.UnemploymentCompensationAmount?.content),
      social_security_benefits: this.parseAmount(fields.SocialSecurityBenefitsAmount?.content),
      other_income: this.parseAmount(fields.OtherIncomeAmount?.content),
      total_income: this.parseAmount(fields.TotalIncomeAmount?.content),
      adjusted_gross_income: this.parseAmount(fields.AdjustedGrossIncomeAmount?.content),
    };

    return {
      form_type: '1040',
      tax_year: this.extractTaxYear(fields.TaxYear?.content),
      amended_return: fields.IsAmendedReturn?.content === true,
      final_return: fields.IsFinalReturn?.content === true,

      primary_taxpayer: {
        name: fields.Taxpayer?.Name?.content || '',
        ssn: fields.Taxpayer?.SSN?.content || '',
        date_of_birth: this.parseDate(fields.Taxpayer?.DateOfBirth?.content),
        occupation: fields.Taxpayer?.Occupation?.content,
      },

      spouse_taxpayer: fields.Spouse ? {
        name: fields.Spouse?.Name?.content || '',
        ssn: fields.Spouse?.SSN?.content || '',
        date_of_birth: this.parseDate(fields.Spouse?.DateOfBirth?.content),
        occupation: fields.Spouse?.Occupation?.content,
      } : undefined,

      filing_status: this.mapFilingStatus(fields.FilingStatus?.content),
      address: this.buildAddress(fields.TaxpayerAddress),
      phone_number: fields.PhoneNumber?.content,

      dependents,
      income,

      deductions: {
        standard_deduction: this.parseAmount(fields.StandardDeductionAmount?.content),
        itemized_deductions: this.parseAmount(fields.ItemizedDeductionsAmount?.content),
        total_deductions: this.parseAmount(fields.TotalDeductionsAmount?.content),
        // Other deduction fields would be extracted similarly
        medical_dental: 0,
        state_local_taxes: 0,
        real_estate_taxes: 0,
        personal_property_taxes: 0,
        mortgage_interest: 0,
        investment_interest: 0,
        charitable_contributions: 0,
        casualty_theft_losses: 0,
        unreimbursed_employee_expenses: 0,
        tax_preparation_fees: 0,
        other_itemized: 0,
      },

      tax_computation: {
        taxable_income: this.parseAmount(fields.TaxableIncomeAmount?.content),
        tax_before_credits: this.parseAmount(fields.TaxBeforeCreditsAmount?.content),
        child_tax_credit: this.parseAmount(fields.ChildTaxCreditAmount?.content),
        education_credits: this.parseAmount(fields.EducationCreditsAmount?.content),
        retirement_savings_credit: this.parseAmount(fields.RetirementSavingsCreditAmount?.content),
        earned_income_credit: this.parseAmount(fields.EarnedIncomeCreditAmount?.content),
        additional_child_tax_credit: this.parseAmount(fields.AdditionalChildTaxCreditAmount?.content),
        other_credits: this.parseAmount(fields.OtherCreditsAmount?.content),
        total_credits: this.parseAmount(fields.TotalCreditsAmount?.content),
        tax_after_credits: this.parseAmount(fields.TaxAfterCreditsAmount?.content),
        self_employment_tax: this.parseAmount(fields.SelfEmploymentTaxAmount?.content),
        alternative_minimum_tax: this.parseAmount(fields.AlternativeMinimumTaxAmount?.content),
        total_tax: this.parseAmount(fields.TotalTaxAmount?.content),
      },

      payments: {
        federal_tax_withheld: this.parseAmount(fields.FederalTaxWithheldAmount?.content),
        estimated_tax_payments: this.parseAmount(fields.EstimatedTaxPaymentsAmount?.content),
        earned_income_credit: this.parseAmount(fields.EarnedIncomeCreditAmount?.content),
        additional_child_tax_credit: this.parseAmount(fields.AdditionalChildTaxCreditAmount?.content),
        american_opportunity_credit: this.parseAmount(fields.AmericanOpportunityCreditAmount?.content),
        first_time_homebuyer_credit: this.parseAmount(fields.FirstTimeHomebuyerCreditAmount?.content),
        other_payments: this.parseAmount(fields.OtherPaymentsAmount?.content),
        total_payments: this.parseAmount(fields.TotalPaymentsAmount?.content),
      },

      refund_or_owe: {
        overpaid_amount: this.parseAmount(fields.OverpaidAmount?.content),
        amount_owed: this.parseAmount(fields.AmountOwedAmount?.content),
        applied_to_next_year: this.parseAmount(fields.AppliedToNextYearAmount?.content),
        refund_amount: this.parseAmount(fields.RefundAmount?.content),
      },

      schedules_included: this.extractSchedules(fields.SchedulesIncluded),

      preparer_info: this.extractPreparerInfo(fields.PreparerInfo),

      electronic_filing: {
        pin: fields.TaxpayerPIN?.content || '',
        signature_date: this.parseDate(fields.TaxpayerSignatureDate?.content),
        spouse_pin: fields.SpousePIN?.content,
        spouse_signature_date: this.parseDate(fields.SpouseSignatureDate?.content),
      },
    };
  }

  /**
   * Parse general document results (fallback)
   */
  private parseGeneralTaxResult(result: any): TaxReturnData {
    const keyValuePairs = result.keyValuePairs || [];
    const extractedData: Record<string, string> = {};

    // Build key-value map
    keyValuePairs.forEach((pair: any) => {
      if (pair.key && pair.value) {
        const key = this.normalizeKey(pair.key.content);
        extractedData[key] = pair.value.content;
      }
    });

    // Determine form type
    const formType = this.determineFormType(result.content || '', extractedData);

    // Extract basic information
    const income = {
      wages_salaries: this.parseAmount(extractedData.wages || extractedData.line_1),
      taxable_interest: this.parseAmount(extractedData.taxable_interest || extractedData.line_2a),
      tax_exempt_interest: this.parseAmount(extractedData.tax_exempt_interest || extractedData.line_2b),
      ordinary_dividends: this.parseAmount(extractedData.ordinary_dividends || extractedData.line_3a),
      qualified_dividends: this.parseAmount(extractedData.qualified_dividends || extractedData.line_3b),
      taxable_refunds: this.parseAmount(extractedData.taxable_refunds || extractedData.line_4),
      alimony_received: this.parseAmount(extractedData.alimony || extractedData.line_5),
      business_income: this.parseAmount(extractedData.business_income || extractedData.line_6),
      capital_gain_loss: this.parseAmount(extractedData.capital_gains || extractedData.line_7),
      other_gains_losses: this.parseAmount(extractedData.other_gains || extractedData.line_8),
      ira_distributions: this.parseAmount(extractedData.ira_distributions || extractedData.line_9),
      pensions_annuities: this.parseAmount(extractedData.pensions || extractedData.line_10),
      rental_real_estate: this.parseAmount(extractedData.rental_income || extractedData.line_11),
      farm_income: this.parseAmount(extractedData.farm_income || extractedData.line_12),
      unemployment_compensation: this.parseAmount(extractedData.unemployment || extractedData.line_13),
      social_security_benefits: this.parseAmount(extractedData.social_security || extractedData.line_14),
      other_income: this.parseAmount(extractedData.other_income || extractedData.line_15),
      total_income: this.parseAmount(extractedData.total_income || extractedData.agi),
      adjusted_gross_income: this.parseAmount(extractedData.adjusted_gross_income || extractedData.agi),
    };

    return {
      form_type: formType,
      tax_year: this.extractTaxYear(extractedData.tax_year || ''),
      amended_return: extractedData.amended?.toLowerCase() === 'true',
      final_return: extractedData.final?.toLowerCase() === 'true',

      primary_taxpayer: {
        name: extractedData.taxpayer_name || extractedData.name || '',
        ssn: extractedData.taxpayer_ssn || extractedData.ssn || '',
        occupation: extractedData.occupation,
      },

      filing_status: this.mapFilingStatus(extractedData.filing_status),
      address: extractedData.address || '',

      dependents: [],
      income,

      deductions: {
        standard_deduction: this.parseAmount(extractedData.standard_deduction),
        itemized_deductions: this.parseAmount(extractedData.itemized_deductions),
        total_deductions: this.parseAmount(extractedData.total_deductions),
        medical_dental: 0,
        state_local_taxes: 0,
        real_estate_taxes: 0,
        personal_property_taxes: 0,
        mortgage_interest: 0,
        investment_interest: 0,
        charitable_contributions: 0,
        casualty_theft_losses: 0,
        unreimbursed_employee_expenses: 0,
        tax_preparation_fees: 0,
        other_itemized: 0,
      },

      tax_computation: {
        taxable_income: this.parseAmount(extractedData.taxable_income),
        tax_before_credits: this.parseAmount(extractedData.tax_before_credits),
        child_tax_credit: this.parseAmount(extractedData.child_tax_credit),
        education_credits: this.parseAmount(extractedData.education_credits),
        retirement_savings_credit: 0,
        earned_income_credit: this.parseAmount(extractedData.earned_income_credit),
        additional_child_tax_credit: 0,
        other_credits: 0,
        total_credits: this.parseAmount(extractedData.total_credits),
        tax_after_credits: this.parseAmount(extractedData.tax_after_credits),
        self_employment_tax: this.parseAmount(extractedData.self_employment_tax),
        alternative_minimum_tax: this.parseAmount(extractedData.amt),
        total_tax: this.parseAmount(extractedData.total_tax),
      },

      payments: {
        federal_tax_withheld: this.parseAmount(extractedData.federal_tax_withheld),
        estimated_tax_payments: this.parseAmount(extractedData.estimated_tax_payments),
        earned_income_credit: this.parseAmount(extractedData.earned_income_credit),
        additional_child_tax_credit: 0,
        american_opportunity_credit: 0,
        first_time_homebuyer_credit: 0,
        other_payments: 0,
        total_payments: this.parseAmount(extractedData.total_payments),
      },

      refund_or_owe: {
        overpaid_amount: this.parseAmount(extractedData.overpaid),
        amount_owed: this.parseAmount(extractedData.amount_owed),
        applied_to_next_year: this.parseAmount(extractedData.applied_to_next_year),
        refund_amount: this.parseAmount(extractedData.refund),
      },

      schedules_included: [],

      electronic_filing: {
        pin: extractedData.pin || '',
      },
    };
  }

  /**
   * Determine tax form type
   */
  private determineFormType(content: string, extractedData: Record<string, string>): TaxReturnData['form_type'] {
    const combined = (content + ' ' + Object.values(extractedData).join(' ')).toLowerCase();

    if (combined.includes('form 1040ez')) return '1040EZ';
    if (combined.includes('form 1040a')) return '1040A';
    if (combined.includes('form 1040')) return '1040';
    if (combined.includes('form 1120s')) return '1120S';
    if (combined.includes('form 1120')) return '1120';
    if (combined.includes('form 1065')) return '1065';
    if (combined.includes('form 990')) return '990';

    return 'OTHER';
  }

  /**
   * Map filing status
   */
  private mapFilingStatus(status: string | undefined): TaxReturnData['filing_status'] {
    if (!status) return 'single';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('single')) return 'single';
    if (statusLower.includes('married filing jointly') || statusLower.includes('mfj')) return 'married_filing_jointly';
    if (statusLower.includes('married filing separately') || statusLower.includes('mfs')) return 'married_filing_separately';
    if (statusLower.includes('head of household') || statusLower.includes('hoh')) return 'head_of_household';
    if (statusLower.includes('qualifying widow') || statusLower.includes('qw')) return 'qualifying_widow';

    return 'single';
  }

  /**
   * Extract dependents
   */
  private extractDependents(dependentsField: any): TaxReturnData['dependents'] {
    if (!dependentsField || !Array.isArray(dependentsField)) {
      return [];
    }

    return dependentsField.map((dependent: any) => ({
      name: dependent.Name?.content || '',
      ssn: dependent.SSN?.content || '',
      relationship: dependent.Relationship?.content || '',
      months_lived_in_home: this.parseAmount(dependent.MonthsLivedInHome?.content) || 12,
    }));
  }

  /**
   * Extract schedules included
   */
  private extractSchedules(schedulesField: any): string[] {
    if (!schedulesField) return [];

    if (Array.isArray(schedulesField)) {
      return schedulesField.map((schedule: any) => schedule.content || schedule).filter(Boolean);
    }

    if (typeof schedulesField === 'string') {
      return schedulesField.split(',').map(s => s.trim()).filter(Boolean);
    }

    return [];
  }

  /**
   * Extract preparer information
   */
  private extractPreparerInfo(preparerField: any): TaxReturnData['preparer_info'] | undefined {
    if (!preparerField) return undefined;

    return {
      preparer_name: preparerField.Name?.content || '',
      preparer_ptin: preparerField.PTIN?.content || '',
      firm_name: preparerField.FirmName?.content || '',
      firm_ein: preparerField.FirmEIN?.content || '',
      firm_address: this.buildAddress(preparerField.FirmAddress),
      preparer_phone: preparerField.Phone?.content || '',
      self_employed: preparerField.SelfEmployed?.content === true,
    };
  }

  /**
   * Validate extracted tax return data
   */
  public async validate(data: TaxReturnData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required field validations
    if (!data.primary_taxpayer?.name) {
      errors.push({
        field: 'primary_taxpayer.name',
        message: 'Primary taxpayer name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.primary_taxpayer?.ssn || !/^\d{3}-\d{2}-\d{4}$/.test(data.primary_taxpayer.ssn)) {
      errors.push({
        field: 'primary_taxpayer.ssn',
        message: 'Valid primary taxpayer SSN is required (format: XXX-XX-XXXX)',
        severity: 'error',
        confidence: 0.8,
      });
    }

    // Tax year validation
    const currentYear = new Date().getFullYear();
    if (!data.tax_year || data.tax_year < 2000 || data.tax_year > currentYear) {
      errors.push({
        field: 'tax_year',
        message: `Invalid tax year. Should be between 2000 and ${currentYear}`,
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Filing status validation for married filing jointly
    if (data.filing_status === 'married_filing_jointly' && !data.spouse_taxpayer?.name) {
      errors.push({
        field: 'spouse_taxpayer',
        message: 'Spouse information required for married filing jointly',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Income validation
    if (data.income.adjusted_gross_income < 0 && data.form_type !== '1120') {
      errors.push({
        field: 'income.adjusted_gross_income',
        message: 'Adjusted gross income is negative, which is unusual for individual returns',
        severity: 'warning',
        confidence: 0.7,
      });
    }

    // Math validation - basic checks
    const calculatedTotalIncome = Object.values(data.income)
      .filter((value, index, array) => index < array.length - 2) // Exclude total_income and AGI
      .reduce((sum: number, value: number) => sum + (value || 0), 0);

    if (data.income.total_income > 0 && Math.abs(calculatedTotalIncome - data.income.total_income) > 100) {
      errors.push({
        field: 'income.total_income',
        message: 'Total income does not match sum of individual income items',
        severity: 'warning',
        confidence: 0.6,
      });
    }

    // Tax computation validation
    if (data.tax_computation.total_tax < 0) {
      errors.push({
        field: 'tax_computation.total_tax',
        message: 'Total tax cannot be negative',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Refund/owe validation
    if (data.refund_or_owe.refund_amount > 0 && data.refund_or_owe.amount_owed > 0) {
      errors.push({
        field: 'refund_or_owe',
        message: 'Cannot have both refund and amount owed',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Dependent validation
    data.dependents.forEach((dependent, index) => {
      if (!dependent.name) {
        errors.push({
          field: `dependents[${index}].name`,
          message: `Dependent ${index + 1} name is required`,
          severity: 'error',
          confidence: 0.8,
        });
      }

      if (!dependent.ssn || !/^\d{3}-\d{2}-\d{4}$/.test(dependent.ssn)) {
        errors.push({
          field: `dependents[${index}].ssn`,
          message: `Valid SSN required for dependent ${index + 1}`,
          severity: 'error',
          confidence: 0.8,
        });
      }

      if (dependent.months_lived_in_home < 0 || dependent.months_lived_in_home > 12) {
        errors.push({
          field: `dependents[${index}].months_lived_in_home`,
          message: `Months lived in home for dependent ${index + 1} should be between 0 and 12`,
          severity: 'error',
          confidence: 0.9,
        });
      }
    });

    return errors;
  }

  /**
   * Helper methods
   */
  private parseAmount(value: string | undefined): number {
    if (!value) return 0;

    // Handle parentheses for negative amounts
    let isNegative = value.includes('(') && value.includes(')');

    const numStr = value.replace(/[,$\s()]/g, '');
    const num = parseFloat(numStr);

    if (isNaN(num)) return 0;

    return isNegative ? -Math.abs(num) : num;
  }

  private parseDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private extractTaxYear(yearStr: string): number {
    if (!yearStr) return new Date().getFullYear() - 1;

    const match = yearStr.match(/20\d{2}/);
    if (match) {
      return parseInt(match[0]);
    }

    return new Date().getFullYear() - 1;
  }

  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  private buildAddress(addressField: any): string {
    if (!addressField) return '';

    if (typeof addressField === 'string') {
      return addressField;
    }

    const parts: string[] = [];
    if (addressField.StreetAddress) parts.push(addressField.StreetAddress.content);
    if (addressField.City) parts.push(addressField.City.content);
    if (addressField.State) parts.push(addressField.State.content);
    if (addressField.PostalCode) parts.push(addressField.PostalCode.content);

    return parts.filter(Boolean).join(', ');
  }
}

export default TaxReturnExtractor;