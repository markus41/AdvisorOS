import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { DocumentMetadata, ValidationError } from '../ocr.service';

export interface W2Data {
  // Employee Information
  employee_name: string;
  employee_address: string;
  employee_ssn: string;

  // Employer Information
  employer_name: string;
  employer_address: string;
  employer_ein: string;
  control_number?: string;

  // Wage and Tax Information
  wages: number; // Box 1
  federal_tax_withheld: number; // Box 2
  social_security_wages: number; // Box 3
  social_security_tax_withheld: number; // Box 4
  medicare_wages: number; // Box 5
  medicare_tax_withheld: number; // Box 6
  social_security_tips: number; // Box 7
  allocated_tips: number; // Box 8

  // Box 9 - Verification code (blank)
  dependent_care_benefits: number; // Box 10
  nonqualified_plans: number; // Box 11

  // Box 12 - Codes and amounts
  box_12_codes: Array<{
    code: string;
    amount: number;
  }>;

  // Box 13 - Checkboxes
  statutory_employee: boolean;
  retirement_plan: boolean;
  third_party_sick_pay: boolean;

  // Box 14 - Other (employer use)
  other_deductions: Array<{
    description: string;
    amount: number;
  }>;

  // State and Local Information
  state_wages: Array<{
    state: string;
    wages: number;
    tax_withheld: number;
  }>;

  local_wages: Array<{
    locality: string;
    wages: number;
    tax_withheld: number;
  }>;

  // Additional extracted information
  tax_year: number;
  copy_designation?: string; // Copy A, B, C, etc.
}

export class W2Extractor {
  /**
   * Extract W-2 form data
   */
  public async extract(
    fileBuffer: Buffer,
    metadata: DocumentMetadata,
    formRecognizerClient: DocumentAnalysisClient
  ): Promise<W2Data> {
    if (!formRecognizerClient) {
      throw new Error('Form Recognizer client not provided');
    }

    try {
      // Use prebuilt W-2 model if available, otherwise use general document model
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-tax.us.w2', // Azure's prebuilt W-2 model
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return this.parseW2Result(result);

    } catch (error) {
      console.warn('Prebuilt W-2 model failed, using general extraction:', error);

      // Fallback to general document analysis
      const poller = await formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document',
        fileBuffer
      );

      const result = await poller.pollUntilDone();
      return this.parseGeneralW2Result(result);
    }
  }

  /**
   * Parse results from prebuilt W-2 model
   */
  private parseW2Result(result: any): W2Data {
    const document = result.documents?.[0];
    if (!document) {
      throw new Error('No W-2 document detected');
    }

    const fields = document.fields || {};

    // Extract Box 12 codes
    const box12Codes: Array<{ code: string; amount: number }> = [];
    if (fields.AdditionalInfo) {
      fields.AdditionalInfo.forEach((info: any) => {
        if (info.Code && info.Amount) {
          box12Codes.push({
            code: info.Code.content || '',
            amount: this.parseAmount(info.Amount.content),
          });
        }
      });
    }

    // Extract state information
    const stateWages: Array<{ state: string; wages: number; tax_withheld: number }> = [];
    if (fields.StateTaxInfos) {
      fields.StateTaxInfos.forEach((stateInfo: any) => {
        stateWages.push({
          state: stateInfo.State?.content || '',
          wages: this.parseAmount(stateInfo.StateWages?.content),
          tax_withheld: this.parseAmount(stateInfo.StateTaxWithheld?.content),
        });
      });
    }

    // Extract local information
    const localWages: Array<{ locality: string; wages: number; tax_withheld: number }> = [];
    if (fields.LocalTaxInfos) {
      fields.LocalTaxInfos.forEach((localInfo: any) => {
        localWages.push({
          locality: localInfo.LocalityName?.content || '',
          wages: this.parseAmount(localInfo.LocalWages?.content),
          tax_withheld: this.parseAmount(localInfo.LocalTaxWithheld?.content),
        });
      });
    }

    return {
      // Employee Information
      employee_name: fields.Employee?.Name?.content || '',
      employee_address: this.buildAddress(fields.Employee?.Address),
      employee_ssn: fields.Employee?.SocialSecurityNumber?.content || '',

      // Employer Information
      employer_name: fields.Employer?.Name?.content || '',
      employer_address: this.buildAddress(fields.Employer?.Address),
      employer_ein: fields.Employer?.IdNumber?.content || '',
      control_number: fields.ControlNumber?.content,

      // Wage and Tax Information
      wages: this.parseAmount(fields.WagesTipsOtherComp?.content),
      federal_tax_withheld: this.parseAmount(fields.FederalIncomeTaxWithheld?.content),
      social_security_wages: this.parseAmount(fields.SocialSecurityWages?.content),
      social_security_tax_withheld: this.parseAmount(fields.SocialSecurityTaxWithheld?.content),
      medicare_wages: this.parseAmount(fields.MedicareWagesAndTips?.content),
      medicare_tax_withheld: this.parseAmount(fields.MedicareTaxWithheld?.content),
      social_security_tips: this.parseAmount(fields.SocialSecurityTips?.content),
      allocated_tips: this.parseAmount(fields.AllocatedTips?.content),

      dependent_care_benefits: this.parseAmount(fields.DependentCareBenefits?.content),
      nonqualified_plans: this.parseAmount(fields.NonqualifiedPlans?.content),

      box_12_codes: box12Codes,

      // Checkboxes
      statutory_employee: fields.IsStatutoryEmployee?.content === true,
      retirement_plan: fields.IsRetirementPlan?.content === true,
      third_party_sick_pay: fields.IsThirdPartySickPay?.content === true,

      other_deductions: [], // Would need to parse from Box 14
      state_wages: stateWages,
      local_wages: localWages,

      tax_year: this.extractTaxYear(fields.TaxYear?.content || ''),
    };
  }

  /**
   * Parse results from general document model (fallback)
   */
  private parseGeneralW2Result(result: any): W2Data {
    const keyValuePairs = result.keyValuePairs || [];
    const extractedData: Record<string, string> = {};

    // Build key-value map
    keyValuePairs.forEach((pair: any) => {
      if (pair.key && pair.value) {
        const key = this.normalizeKey(pair.key.content);
        extractedData[key] = pair.value.content;
      }
    });

    // Map W-2 specific fields
    return {
      employee_name: extractedData.employee_name || extractedData.employee || '',
      employee_address: extractedData.employee_address || '',
      employee_ssn: extractedData.employee_ssn || extractedData.ssn || '',

      employer_name: extractedData.employer_name || extractedData.employer || '',
      employer_address: extractedData.employer_address || '',
      employer_ein: extractedData.employer_ein || extractedData.ein || '',
      control_number: extractedData.control_number,

      wages: this.parseAmount(extractedData.wages || extractedData.box_1),
      federal_tax_withheld: this.parseAmount(extractedData.federal_tax_withheld || extractedData.box_2),
      social_security_wages: this.parseAmount(extractedData.social_security_wages || extractedData.box_3),
      social_security_tax_withheld: this.parseAmount(extractedData.social_security_tax_withheld || extractedData.box_4),
      medicare_wages: this.parseAmount(extractedData.medicare_wages || extractedData.box_5),
      medicare_tax_withheld: this.parseAmount(extractedData.medicare_tax_withheld || extractedData.box_6),
      social_security_tips: this.parseAmount(extractedData.social_security_tips || extractedData.box_7),
      allocated_tips: this.parseAmount(extractedData.allocated_tips || extractedData.box_8),

      dependent_care_benefits: this.parseAmount(extractedData.dependent_care_benefits || extractedData.box_10),
      nonqualified_plans: this.parseAmount(extractedData.nonqualified_plans || extractedData.box_11),

      box_12_codes: [],

      statutory_employee: false,
      retirement_plan: false,
      third_party_sick_pay: false,

      other_deductions: [],
      state_wages: [],
      local_wages: [],

      tax_year: this.extractTaxYear(extractedData.tax_year || ''),
    };
  }

  /**
   * Validate extracted W-2 data
   */
  public async validate(data: W2Data): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required field validations
    if (!data.employee_name) {
      errors.push({
        field: 'employee_name',
        message: 'Employee name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.employer_name) {
      errors.push({
        field: 'employer_name',
        message: 'Employer name is required',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (!data.employer_ein || !/^\d{2}-\d{7}$/.test(data.employer_ein)) {
      errors.push({
        field: 'employer_ein',
        message: 'Valid Employer EIN is required (format: XX-XXXXXXX)',
        severity: 'error',
        confidence: 0.8,
      });
    }

    if (!data.employee_ssn || !/^\d{3}-\d{2}-\d{4}$/.test(data.employee_ssn)) {
      errors.push({
        field: 'employee_ssn',
        message: 'Valid Employee SSN is required (format: XXX-XX-XXXX)',
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

    // Amount validations
    if (data.wages < 0) {
      errors.push({
        field: 'wages',
        message: 'Wages cannot be negative',
        severity: 'error',
        confidence: 0.9,
      });
    }

    if (data.federal_tax_withheld < 0) {
      errors.push({
        field: 'federal_tax_withheld',
        message: 'Federal tax withheld cannot be negative',
        severity: 'error',
        confidence: 0.9,
      });
    }

    // Logical validations
    if (data.social_security_wages > data.wages + 1000) { // Allow small variance
      errors.push({
        field: 'social_security_wages',
        message: 'Social Security wages cannot significantly exceed total wages',
        severity: 'warning',
        confidence: 0.7,
      });
    }

    if (data.medicare_wages > data.wages + 1000) { // Allow small variance
      errors.push({
        field: 'medicare_wages',
        message: 'Medicare wages cannot significantly exceed total wages',
        severity: 'warning',
        confidence: 0.7,
      });
    }

    // Tax rate validations (approximate)
    const expectedSSTax = data.social_security_wages * 0.062;
    if (Math.abs(data.social_security_tax_withheld - expectedSSTax) > expectedSSTax * 0.1) {
      errors.push({
        field: 'social_security_tax_withheld',
        message: 'Social Security tax appears inconsistent with wages (expected ~6.2%)',
        severity: 'warning',
        confidence: 0.6,
      });
    }

    const expectedMedicareTax = data.medicare_wages * 0.0145;
    if (Math.abs(data.medicare_tax_withheld - expectedMedicareTax) > expectedMedicareTax * 0.1) {
      errors.push({
        field: 'medicare_tax_withheld',
        message: 'Medicare tax appears inconsistent with wages (expected ~1.45%)',
        severity: 'warning',
        confidence: 0.6,
      });
    }

    return errors;
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

    // Build address from components
    const parts: string[] = [];
    if (addressField.StreetAddress) parts.push(addressField.StreetAddress.content);
    if (addressField.City) parts.push(addressField.City.content);
    if (addressField.State) parts.push(addressField.State.content);
    if (addressField.PostalCode) parts.push(addressField.PostalCode.content);

    return parts.filter(Boolean).join(', ');
  }

  private extractTaxYear(yearStr: string): number {
    if (!yearStr) return new Date().getFullYear() - 1; // Default to previous year

    const match = yearStr.match(/20\d{2}/);
    if (match) {
      return parseInt(match[0]);
    }

    return new Date().getFullYear() - 1;
  }
}

export default W2Extractor;