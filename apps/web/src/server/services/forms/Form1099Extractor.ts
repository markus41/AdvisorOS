import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { DocumentMetadata, ValidationError } from '../ocr.service';

export interface Form1099Data {
  // Form Information
  form_type: '1099-MISC' | '1099-NEC' | '1099-INT' | '1099-DIV' | '1099-R' | '1099-G' | '1099-K' | 'OTHER';
  tax_year: number;
  corrected: boolean;

  // Payer Information
  payer_name: string;
  payer_address: string;
  payer_tin: string; // Tax Identification Number
  payer_phone?: string;

  // Recipient Information
  recipient_name: string;
  recipient_address: string;
  recipient_tin: string; // SSN or EIN
  account_number?: string;

  // 1099-MISC Specific Fields
  rents?: number; // Box 1
  royalties?: number; // Box 2
  other_income?: number; // Box 3
  federal_tax_withheld?: number; // Box 4
  fishing_boat_proceeds?: number; // Box 5
  medical_payments?: number; // Box 6
  substitute_payments?: number; // Box 8
  crop_insurance?: number; // Box 9
  gross_proceeds_attorney?: number; // Box 10
  section_409a_deferrals?: number; // Box 12
  excess_golden_parachute?: number; // Box 13
  nonqualified_deferred_comp?: number; // Box 14
  state_tax_withheld?: number; // Box 16
  state_number?: string; // Box 15
  payer_state_number?: string; // Box 17

  // 1099-NEC Specific Fields
  nonemployee_compensation?: number; // Box 1
  direct_sales?: boolean; // Box 2

  // 1099-INT Specific Fields
  interest_income?: number; // Box 1
  early_withdrawal_penalty?: number; // Box 2
  interest_on_bonds?: number; // Box 3
  federal_tax_withheld_int?: number; // Box 4
  investment_expenses?: number; // Box 5
  foreign_tax_paid?: number; // Box 6
  foreign_country?: string; // Box 7
  tax_exempt_interest?: number; // Box 8
  specified_private_activity_bond_interest?: number; // Box 9
  market_discount?: number; // Box 10
  bond_premium?: number; // Box 11
  bond_premium_tax_year?: number; // Box 12
  tax_exempt_bond_premium?: number; // Box 13

  // 1099-DIV Specific Fields
  ordinary_dividends?: number; // Box 1a
  qualified_dividends?: number; // Box 1b
  total_capital_gain?: number; // Box 2a
  unrecaptured_1250_gain?: number; // Box 2b
  section_1202_gain?: number; // Box 2c
  collectibles_gain?: number; // Box 2d
  nondividend_distributions?: number; // Box 3
  federal_tax_withheld_div?: number; // Box 4
  section_199a_dividends?: number; // Box 5
  investment_expenses_div?: number; // Box 6
  foreign_tax_paid_div?: number; // Box 7
  cash_liquidation?: number; // Box 8
  noncash_liquidation?: number; // Box 9

  // Additional Fields
  void: boolean;
  fatca_filing_requirement: boolean;
  second_tin_notice: boolean;

  // State Information
  state_info: Array<{
    state: string;
    payer_state_number: string;
    state_tax_withheld: number;
    state_income: number;
  }>;
}

export class Form1099Extractor {
  /**
   * Extract 1099 form data
   */
  public async extract(
    fileBuffer: Buffer,
    metadata: DocumentMetadata,
    formRecognizerClient: DocumentAnalysisClient
  ): Promise<Form1099Data> {
    if (!formRecognizerClient) {
      throw new Error('Form Recognizer client not provided');
    }

    try {
      // Try prebuilt 1099 models first
      let result;
      try {
        const poller = await formRecognizerClient.beginAnalyzeDocument(
          'prebuilt-tax.us.1099misc',
          fileBuffer
        );
        result = await poller.pollUntilDone();
        return this.parse1099MiscResult(result);
      } catch (error) {
        console.warn('1099-MISC model failed, trying NEC model:', error);
      }

      try {
        const poller = await formRecognizerClient.beginAnalyzeDocument(
          'prebuilt-tax.us.1099nec',
          fileBuffer
        );
        result = await poller.pollUntilDone();
        return this.parse1099NecResult(result);
      } catch (error) {
        console.warn('1099-NEC model failed, using general extraction:', error);
      }

      // Fallback to general document analysis
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document',
        fileBuffer
      );
      result = await poller.pollUntilDone();
      return this.parseGeneral1099Result(result);

    } catch (error) {
      throw new Error(`1099 extraction failed: ${error}`);
    }
  }

  /**
   * Parse 1099-MISC specific results
   */
  private parse1099MiscResult(result: any): Form1099Data {
    const document = result.documents?.[0];
    if (!document) {
      throw new Error('No 1099-MISC document detected');
    }

    const fields = document.fields || {};

    return {
      form_type: '1099-MISC',
      tax_year: this.extractTaxYear(fields.TaxYear?.content),
      corrected: fields.IsCorrected?.content === true,

      // Payer Information
      payer_name: fields.Payer?.Name?.content || '',
      payer_address: this.buildAddress(fields.Payer?.Address),
      payer_tin: fields.Payer?.TIN?.content || '',

      // Recipient Information
      recipient_name: fields.Recipient?.Name?.content || '',
      recipient_address: this.buildAddress(fields.Recipient?.Address),
      recipient_tin: fields.Recipient?.TIN?.content || '',
      account_number: fields.AccountNumber?.content,

      // 1099-MISC Specific Fields
      rents: this.parseAmount(fields.Rents?.content),
      royalties: this.parseAmount(fields.Royalties?.content),
      other_income: this.parseAmount(fields.OtherIncome?.content),
      federal_tax_withheld: this.parseAmount(fields.FederalIncomeTaxWithheld?.content),
      fishing_boat_proceeds: this.parseAmount(fields.FishingBoatProceeds?.content),
      medical_payments: this.parseAmount(fields.MedicalAndHealthCarePayments?.content),
      substitute_payments: this.parseAmount(fields.SubstitutePayments?.content),
      crop_insurance: this.parseAmount(fields.CropInsuranceProceeds?.content),
      gross_proceeds_attorney: this.parseAmount(fields.GrossProceedsToAttorney?.content),
      section_409a_deferrals: this.parseAmount(fields.Section409ADeferrals?.content),
      excess_golden_parachute: this.parseAmount(fields.ExcessGoldenParachute?.content),
      nonqualified_deferred_comp: this.parseAmount(fields.NonqualifiedDeferredCompensation?.content),

      void: fields.IsVoid?.content === true,
      fatca_filing_requirement: fields.FATCAFilingRequirement?.content === true,
      second_tin_notice: fields.SecondTINNotice?.content === true,

      state_info: this.parseStateInfo(fields.StateTaxInfo),
    };
  }

  /**
   * Parse 1099-NEC specific results
   */
  private parse1099NecResult(result: any): Form1099Data {
    const document = result.documents?.[0];
    if (!document) {
      throw new Error('No 1099-NEC document detected');
    }

    const fields = document.fields || {};

    return {
      form_type: '1099-NEC',
      tax_year: this.extractTaxYear(fields.TaxYear?.content),
      corrected: fields.IsCorrected?.content === true,

      payer_name: fields.Payer?.Name?.content || '',
      payer_address: this.buildAddress(fields.Payer?.Address),
      payer_tin: fields.Payer?.TIN?.content || '',

      recipient_name: fields.Recipient?.Name?.content || '',
      recipient_address: this.buildAddress(fields.Recipient?.Address),
      recipient_tin: fields.Recipient?.TIN?.content || '',
      account_number: fields.AccountNumber?.content,

      // 1099-NEC Specific Fields
      nonemployee_compensation: this.parseAmount(fields.NonemployeeCompensation?.content),
      direct_sales: fields.DirectSalesIndicator?.content === true,
      federal_tax_withheld: this.parseAmount(fields.FederalIncomeTaxWithheld?.content),

      void: fields.IsVoid?.content === true,
      fatca_filing_requirement: fields.FATCAFilingRequirement?.content === true,
      second_tin_notice: fields.SecondTINNotice?.content === true,

      state_info: this.parseStateInfo(fields.StateTaxInfo),
    };
  }

  /**
   * Parse general document results (fallback)
   */
  private parseGeneral1099Result(result: any): Form1099Data {
    const keyValuePairs = result.keyValuePairs || [];
    const extractedData: Record<string, string> = {};

    // Build key-value map
    keyValuePairs.forEach((pair: any) => {
      if (pair.key && pair.value) {
        const key = this.normalizeKey(pair.key.content);
        extractedData[key] = pair.value.content;
      }
    });

    // Determine form type from content
    const formType = this.determineFormType(result.content || '', extractedData);

    return {
      form_type: formType,
      tax_year: this.extractTaxYear(extractedData.tax_year || ''),
      corrected: extractedData.corrected?.toLowerCase() === 'true',

      payer_name: extractedData.payer_name || extractedData.payer || '',
      payer_address: extractedData.payer_address || '',
      payer_tin: extractedData.payer_tin || extractedData.payer_id || '',

      recipient_name: extractedData.recipient_name || extractedData.recipient || '',
      recipient_address: extractedData.recipient_address || '',
      recipient_tin: extractedData.recipient_tin || extractedData.recipient_id || '',
      account_number: extractedData.account_number,

      // Extract relevant amounts based on form type
      ...this.extractAmountsByType(formType, extractedData),

      void: extractedData.void?.toLowerCase() === 'true',
      fatca_filing_requirement: false,
      second_tin_notice: false,

      state_info: [],
    };
  }

  /**
   * Determine 1099 form type from content
   */
  private determineFormType(content: string, extractedData: Record<string, string>): Form1099Data['form_type'] {
    const contentLower = content.toLowerCase();

    if (contentLower.includes('1099-misc') || extractedData.form_type?.includes('misc')) {
      return '1099-MISC';
    }
    if (contentLower.includes('1099-nec') || extractedData.form_type?.includes('nec')) {
      return '1099-NEC';
    }
    if (contentLower.includes('1099-int') || extractedData.form_type?.includes('int')) {
      return '1099-INT';
    }
    if (contentLower.includes('1099-div') || extractedData.form_type?.includes('div')) {
      return '1099-DIV';
    }
    if (contentLower.includes('1099-r') || extractedData.form_type?.includes('retirement')) {
      return '1099-R';
    }
    if (contentLower.includes('1099-g') || extractedData.form_type?.includes('government')) {
      return '1099-G';
    }
    if (contentLower.includes('1099-k') || extractedData.form_type?.includes('payment')) {
      return '1099-K';
    }

    return 'OTHER';
  }

  /**
   * Extract amounts based on form type
   */
  private extractAmountsByType(formType: Form1099Data['form_type'], data: Record<string, string>): Partial<Form1099Data> {
    switch (formType) {
      case '1099-MISC':
        return {
          rents: this.parseAmount(data.rents || data.box_1),
          royalties: this.parseAmount(data.royalties || data.box_2),
          other_income: this.parseAmount(data.other_income || data.box_3),
          federal_tax_withheld: this.parseAmount(data.federal_tax_withheld || data.box_4),
        };

      case '1099-NEC':
        return {
          nonemployee_compensation: this.parseAmount(data.nonemployee_compensation || data.box_1),
          federal_tax_withheld: this.parseAmount(data.federal_tax_withheld || data.box_4),
        };

      case '1099-INT':
        return {
          interest_income: this.parseAmount(data.interest_income || data.box_1),
          federal_tax_withheld_int: this.parseAmount(data.federal_tax_withheld || data.box_4),
        };

      case '1099-DIV':
        return {
          ordinary_dividends: this.parseAmount(data.ordinary_dividends || data.box_1a),
          qualified_dividends: this.parseAmount(data.qualified_dividends || data.box_1b),
          federal_tax_withheld_div: this.parseAmount(data.federal_tax_withheld || data.box_4),
        };

      default:
        return {};
    }
  }

  /**
   * Validate extracted 1099 data
   */
  public async validate(data: Form1099Data): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required field validations
    if (!data.payer_name) {
      errors.push({
        field: 'payer_name',
        message: 'Payer name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.recipient_name) {
      errors.push({
        field: 'recipient_name',
        message: 'Recipient name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.payer_tin || !/^\d{2}-\d{7}$/.test(data.payer_tin)) {
      errors.push({
        field: 'payer_tin',
        message: 'Valid Payer TIN is required (format: XX-XXXXXXX)',
        severity: 'error',
        confidence: 0.8,
      });
    }

    if (!data.recipient_tin || (!/^\d{3}-\d{2}-\d{4}$/.test(data.recipient_tin) && !/^\d{2}-\d{7}$/.test(data.recipient_tin))) {
      errors.push({
        field: 'recipient_tin',
        message: 'Valid Recipient TIN is required (SSN: XXX-XX-XXXX or EIN: XX-XXXXXXX)',
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

    // Form-specific validations
    this.validateFormSpecificFields(data, errors);

    return errors;
  }

  /**
   * Form-specific field validations
   */
  private validateFormSpecificFields(data: Form1099Data, errors: ValidationError[]): void {
    switch (data.form_type) {
      case '1099-MISC':
        this.validate1099MISC(data, errors);
        break;
      case '1099-NEC':
        this.validate1099NEC(data, errors);
        break;
      case '1099-INT':
        this.validate1099INT(data, errors);
        break;
      case '1099-DIV':
        this.validate1099DIV(data, errors);
        break;
    }
  }

  private validate1099MISC(data: Form1099Data, errors: ValidationError[]): void {
    const totalIncome = (data.rents || 0) + (data.royalties || 0) + (data.other_income || 0);

    if (totalIncome === 0) {
      errors.push({
        field: 'income',
        message: '1099-MISC should have income in at least one category',
        severity: 'warning',
        confidence: 0.7,
      });
    }

    if (totalIncome < 600 && data.tax_year && data.tax_year >= 2020) {
      errors.push({
        field: 'income',
        message: '1099-MISC typically required for payments of $600 or more',
        severity: 'info',
        confidence: 0.6,
      });
    }
  }

  private validate1099NEC(data: Form1099Data, errors: ValidationError[]): void {
    if (!data.nonemployee_compensation || data.nonemployee_compensation === 0) {
      errors.push({
        field: 'nonemployee_compensation',
        message: '1099-NEC should have nonemployee compensation',
        severity: 'warning',
        confidence: 0.8,
      });
    }

    if (data.nonemployee_compensation && data.nonemployee_compensation < 600 && data.tax_year && data.tax_year >= 2020) {
      errors.push({
        field: 'nonemployee_compensation',
        message: '1099-NEC typically required for payments of $600 or more',
        severity: 'info',
        confidence: 0.6,
      });
    }
  }

  private validate1099INT(data: Form1099Data, errors: ValidationError[]): void {
    if (!data.interest_income || data.interest_income === 0) {
      errors.push({
        field: 'interest_income',
        message: '1099-INT should have interest income',
        severity: 'warning',
        confidence: 0.8,
      });
    }
  }

  private validate1099DIV(data: Form1099Data, errors: ValidationError[]): void {
    const totalDividends = (data.ordinary_dividends || 0) + (data.qualified_dividends || 0);

    if (totalDividends === 0) {
      errors.push({
        field: 'dividends',
        message: '1099-DIV should have dividend income',
        severity: 'warning',
        confidence: 0.8,
      });
    }

    if (data.qualified_dividends && data.ordinary_dividends && data.qualified_dividends > data.ordinary_dividends) {
      errors.push({
        field: 'qualified_dividends',
        message: 'Qualified dividends cannot exceed ordinary dividends',
        severity: 'error',
        confidence: 0.9,
      });
    }
  }

  /**
   * Helper methods
   */
  private parseAmount(value: string | undefined): number {
    if (!value) return 0;
    const numStr = value.replace(/[,$\s]/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
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

  private extractTaxYear(yearStr: string): number {
    if (!yearStr) return new Date().getFullYear() - 1;

    const match = yearStr.match(/20\d{2}/);
    if (match) {
      return parseInt(match[0]);
    }

    return new Date().getFullYear() - 1;
  }

  private parseStateInfo(stateTaxInfo: any): Array<{
    state: string;
    payer_state_number: string;
    state_tax_withheld: number;
    state_income: number;
  }> {
    if (!stateTaxInfo || !Array.isArray(stateTaxInfo)) {
      return [];
    }

    return stateTaxInfo.map((info: any) => ({
      state: info.State?.content || '',
      payer_state_number: info.PayerStateNumber?.content || '',
      state_tax_withheld: this.parseAmount(info.StateTaxWithheld?.content),
      state_income: this.parseAmount(info.StateIncome?.content),
    }));
  }
}

export default Form1099Extractor;