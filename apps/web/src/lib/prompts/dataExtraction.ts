/**
 * Data Extraction Prompt Templates
 * Specialized prompts for extracting and structuring data from various financial documents
 */

export interface ExtractionContext {
  documentType: 'w2' | '1099' | 'invoice' | 'bank-statement' | 'tax-return' | 'receipt' | 'contract' | 'financial-statement';
  ocrText: string;
  expectedFields?: string[];
  validationRules?: Record<string, any>;
  confidence?: number;
  metadata?: Record<string, any>;
}

export const DATA_EXTRACTION_PROMPTS = {
  // W-2 Form Data Extraction
  W2_EXTRACTION: (context: ExtractionContext) => `
Extract structured data from this W-2 tax form OCR text with high accuracy and validation.

**OCR Text Input:**
${context.ocrText}

**W-2 Form Requirements:**
Extract all standard W-2 fields with validation and error checking. Pay special attention to:
- Employer identification and employee information
- Wage and tax amounts (boxes 1-20)
- State and local tax information
- Retirement plan and benefit indicators

**Extraction Rules:**
1. **Monetary Values**: All dollar amounts must be validated as numbers
2. **Tax IDs**: Verify EIN and SSN format compliance
3. **Codes**: Validate retirement plan codes and benefit codes
4. **Cross-validation**: Ensure wage amounts are logical and consistent

**Extract W-2 Data:**
{
  "documentType": "w2",
  "confidence": number, // Overall extraction confidence (0-1)
  "employerInfo": {
    "employerName": string,
    "employerAddress": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string
    },
    "ein": string, // Employer Identification Number
    "stateEmployerId": string
  },
  "employeeInfo": {
    "firstName": string,
    "lastName": string,
    "ssn": string, // Format: XXX-XX-XXXX
    "address": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string
    }
  },
  "wageAndTaxInfo": {
    "wagesAndTips": number, // Box 1
    "federalIncomeTaxWithheld": number, // Box 2
    "socialSecurityWages": number, // Box 3
    "socialSecurityTaxWithheld": number, // Box 4
    "medicareWages": number, // Box 5
    "medicareTaxWithheld": number, // Box 6
    "socialSecurityTips": number, // Box 7
    "allocatedTips": number, // Box 8
    "dependentCareBenefits": number, // Box 10
    "nonqualifiedPlans": number, // Box 11
    "box12": [ // Box 12 codes and amounts
      {
        "code": string,
        "amount": number
      }
    ],
    "retirementPlan": boolean, // Box 13 checkbox
    "thirdPartySickPay": boolean, // Box 13 checkbox
    "other": string // Box 14
  },
  "stateAndLocalInfo": [
    {
      "state": string,
      "stateWages": number, // Box 16
      "stateIncomeTax": number, // Box 17
      "localWages": number, // Box 18
      "localIncomeTax": number, // Box 19
      "locality": string // Box 20
    }
  ],
  "validationResults": {
    "errors": string[],
    "warnings": string[],
    "fieldConfidence": Record<string, number>
  },
  "extractedText": {
    "rawOcr": string,
    "processedSections": Record<string, string>
  }
}

**Validation Requirements:**
- Verify all monetary amounts are positive numbers
- Ensure SSN and EIN follow proper format
- Check that Social Security and Medicare wages/taxes are consistent
- Validate state abbreviations and zip codes
- Flag any suspicious or inconsistent values

Return detailed extraction with confidence scores for each field.
`,

  // 1099 Form Data Extraction
  FORM1099_EXTRACTION: (context: ExtractionContext) => `
Extract data from 1099 form OCR text. Identify the specific 1099 form type and extract relevant fields.

**OCR Text:**
${context.ocrText}

**1099 Form Types to Detect:**
- 1099-NEC (Non-employee compensation)
- 1099-MISC (Miscellaneous income)
- 1099-INT (Interest income)
- 1099-DIV (Dividend income)
- 1099-R (Retirement distributions)
- 1099-B (Broker transactions)

**Extract 1099 Data:**
{
  "documentType": "1099",
  "formType": "1099-NEC" | "1099-MISC" | "1099-INT" | "1099-DIV" | "1099-R" | "1099-B",
  "confidence": number,
  "payerInfo": {
    "name": string,
    "address": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string
    },
    "tin": string, // Taxpayer Identification Number
    "phoneNumber": string
  },
  "recipientInfo": {
    "name": string,
    "address": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string
    },
    "tin": string,
    "accountNumber": string
  },
  "incomeData": {
    // Fields vary by form type - extract relevant boxes
    "box1": number, // Primary income amount
    "box2": number,
    "box3": number,
    "box4": number, // Federal income tax withheld
    "box5": number,
    "box6": number,
    "box7": number,
    "box8": number,
    "box9": number,
    "box10": number,
    "additionalBoxes": Record<string, number>
  },
  "stateInfo": [
    {
      "state": string,
      "stateNumber": string,
      "stateIncome": number,
      "stateTaxWithheld": number
    }
  ],
  "corrections": boolean, // CORRECTED checkbox
  "void": boolean, // VOID checkbox
  "taxYear": number,
  "validationResults": {
    "errors": string[],
    "warnings": string[],
    "fieldConfidence": Record<string, number>
  }
}

Focus on accurate monetary value extraction and proper form type identification.
`,

  // Invoice Data Extraction
  INVOICE_EXTRACTION: (context: ExtractionContext) => `
Extract comprehensive invoice data from OCR text, including line items, totals, and payment terms.

**OCR Text:**
${context.ocrText}

**Invoice Extraction Requirements:**
- Vendor and customer information
- Invoice details (number, date, terms)
- Complete line item breakdown
- Tax calculations and totals
- Payment information

**Extract Invoice Data:**
{
  "documentType": "invoice",
  "confidence": number,
  "invoiceDetails": {
    "invoiceNumber": string,
    "invoiceDate": string, // ISO date format
    "dueDate": string,
    "poNumber": string, // Purchase order number
    "currency": string
  },
  "vendor": {
    "name": string,
    "address": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string,
      "country": string
    },
    "taxId": string,
    "phoneNumber": string,
    "email": string,
    "website": string
  },
  "customer": {
    "name": string,
    "address": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string,
      "country": string
    },
    "customerNumber": string,
    "contactPerson": string
  },
  "lineItems": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "unitOfMeasure": string,
      "discount": number,
      "lineTotal": number,
      "taxable": boolean,
      "productCode": string
    }
  ],
  "calculations": {
    "subtotal": number,
    "totalDiscounts": number,
    "taxableAmount": number,
    "taxRate": number,
    "taxAmount": number,
    "shippingCost": number,
    "otherCharges": number,
    "totalAmount": number
  },
  "paymentTerms": {
    "terms": string, // e.g., "Net 30", "2/10 Net 30"
    "discountPercentage": number,
    "discountDays": number,
    "netDays": number
  },
  "additionalInfo": {
    "notes": string,
    "specialInstructions": string,
    "references": string[]
  },
  "validationResults": {
    "mathematicalAccuracy": boolean,
    "errors": string[],
    "warnings": string[],
    "fieldConfidence": Record<string, number>
  }
}

Ensure mathematical accuracy by validating that line totals, subtotals, and final amounts calculate correctly.
`,

  // Bank Statement Data Extraction
  BANK_STATEMENT_EXTRACTION: (context: ExtractionContext) => `
Extract bank statement data including account information, transactions, and summary details.

**OCR Text:**
${context.ocrText}

**Bank Statement Requirements:**
- Account holder and bank information
- Statement period and summary
- Individual transaction details
- Beginning and ending balances

**Extract Bank Statement Data:**
{
  "documentType": "bankStatement",
  "confidence": number,
  "bankInfo": {
    "bankName": string,
    "bankAddress": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string
    },
    "routingNumber": string,
    "customerServicePhone": string
  },
  "accountInfo": {
    "accountHolderName": string,
    "accountNumber": string, // Partially masked
    "accountType": "checking" | "savings" | "business" | "other",
    "address": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string
    }
  },
  "statementPeriod": {
    "startDate": string, // ISO date
    "endDate": string,
    "statementDate": string,
    "pageNumber": string
  },
  "balanceSummary": {
    "beginningBalance": number,
    "endingBalance": number,
    "totalDeposits": number,
    "totalWithdrawals": number,
    "totalFees": number,
    "numberOfDeposits": number,
    "numberOfWithdrawals": number
  },
  "transactions": [
    {
      "date": string, // ISO date
      "description": string,
      "amount": number, // Positive for deposits, negative for withdrawals
      "balance": number,
      "type": "deposit" | "withdrawal" | "fee" | "interest" | "transfer" | "check" | "debit" | "credit",
      "checkNumber": string,
      "reference": string
    }
  ],
  "fees": [
    {
      "description": string,
      "amount": number,
      "date": string
    }
  ],
  "validationResults": {
    "balanceReconciliation": boolean,
    "transactionCount": number,
    "errors": string[],
    "warnings": string[],
    "fieldConfidence": Record<string, number>
  }
}

Validate that beginning balance + deposits - withdrawals - fees = ending balance.
`,

  // Receipt Data Extraction
  RECEIPT_EXTRACTION: (context: ExtractionContext) => `
Extract expense receipt data for tax and accounting purposes.

**OCR Text:**
${context.ocrText}

**Receipt Extraction Focus:**
- Merchant information
- Transaction details
- Item breakdown if available
- Tax amounts
- Payment method

**Extract Receipt Data:**
{
  "documentType": "receipt",
  "confidence": number,
  "merchantInfo": {
    "name": string,
    "address": {
      "street": string,
      "city": string,
      "state": string,
      "zip": string
    },
    "phoneNumber": string,
    "taxId": string,
    "category": string // e.g., "restaurant", "office supplies", "fuel"
  },
  "transactionInfo": {
    "receiptNumber": string,
    "transactionId": string,
    "date": string, // ISO date
    "time": string,
    "cashierNumber": string,
    "registerNumber": string
  },
  "items": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "category": string,
      "taxable": boolean
    }
  ],
  "totals": {
    "subtotal": number,
    "taxAmount": number,
    "taxRate": number,
    "discountAmount": number,
    "tipAmount": number,
    "totalAmount": number
  },
  "paymentInfo": {
    "method": "cash" | "credit" | "debit" | "check" | "other",
    "cardType": string, // e.g., "Visa", "MasterCard"
    "lastFourDigits": string,
    "amountPaid": number,
    "changeGiven": number
  },
  "taxInfo": {
    "businessExpenseCategory": string,
    "deductible": boolean,
    "businessPurpose": string // If determinable from context
  },
  "validationResults": {
    "mathematicalAccuracy": boolean,
    "errors": string[],
    "warnings": string[],
    "fieldConfidence": Record<string, number>
  }
}

Focus on extracting tax-relevant information for expense categorization and deduction purposes.
`,

  // Financial Statement Data Extraction
  FINANCIAL_STATEMENT_EXTRACTION: (context: ExtractionContext) => `
Extract data from financial statements (Balance Sheet, Income Statement, Cash Flow Statement).

**OCR Text:**
${context.ocrText}

**Financial Statement Types:**
- Balance Sheet
- Income Statement (P&L)
- Cash Flow Statement
- Statement of Owner's Equity

**Extract Financial Statement Data:**
{
  "documentType": "financialStatement",
  "statementType": "balanceSheet" | "incomeStatement" | "cashFlow" | "ownersEquity",
  "confidence": number,
  "companyInfo": {
    "name": string,
    "address": string,
    "fiscalYearEnd": string,
    "reportingCurrency": string
  },
  "periodInfo": {
    "periodEnding": string, // ISO date
    "periodType": "monthly" | "quarterly" | "annual",
    "comparativePeriod": string,
    "auditStatus": "audited" | "reviewed" | "compiled" | "unaudited"
  },
  "financialData": {
    // Balance Sheet
    "assets": {
      "currentAssets": {
        "cash": number,
        "accountsReceivable": number,
        "inventory": number,
        "prepaidExpenses": number,
        "otherCurrentAssets": number,
        "totalCurrentAssets": number
      },
      "fixedAssets": {
        "propertyPlantEquipment": number,
        "accumulatedDepreciation": number,
        "netPPE": number,
        "intangibleAssets": number,
        "otherAssets": number,
        "totalFixedAssets": number
      },
      "totalAssets": number
    },
    "liabilities": {
      "currentLiabilities": {
        "accountsPayable": number,
        "accruedExpenses": number,
        "shortTermDebt": number,
        "currentPortionLongTermDebt": number,
        "otherCurrentLiabilities": number,
        "totalCurrentLiabilities": number
      },
      "longTermLiabilities": {
        "longTermDebt": number,
        "deferredTaxLiabilities": number,
        "otherLongTermLiabilities": number,
        "totalLongTermLiabilities": number
      },
      "totalLiabilities": number
    },
    "equity": {
      "ownerEquity": number,
      "retainedEarnings": number,
      "totalEquity": number
    },
    // Income Statement
    "revenues": {
      "salesRevenue": number,
      "serviceRevenue": number,
      "otherRevenue": number,
      "totalRevenue": number
    },
    "expenses": {
      "costOfGoodsSold": number,
      "grossProfit": number,
      "operatingExpenses": {
        "salariesWages": number,
        "rent": number,
        "utilities": number,
        "depreciation": number,
        "otherOperatingExpenses": number,
        "totalOperatingExpenses": number
      },
      "operatingIncome": number,
      "interestExpense": number,
      "otherExpenses": number,
      "netIncome": number
    }
  },
  "ratios": {
    "currentRatio": number,
    "debtToEquityRatio": number,
    "grossProfitMargin": number,
    "netProfitMargin": number
  },
  "validationResults": {
    "balanceSheetBalances": boolean, // Assets = Liabilities + Equity
    "mathematicalAccuracy": boolean,
    "errors": string[],
    "warnings": string[],
    "fieldConfidence": Record<string, number>
  }
}

Ensure mathematical consistency and validate that financial statement equations balance properly.
`
};

export const EXTRACTION_SYSTEM_PROMPTS = {
  DATA_SPECIALIST: `You are a financial data extraction specialist with expertise in:
- Document structure recognition and field identification
- OCR text interpretation and error correction
- Financial document validation and cross-checking
- Tax form compliance and field requirements
- Accounting standards and formatting

Your approach:
- Prioritize accuracy over completeness
- Flag uncertain extractions with low confidence scores
- Apply appropriate validation rules for each document type
- Maintain data integrity and format consistency
- Provide detailed error reporting for quality control

Always ensure:
- Numerical accuracy and proper formatting
- Compliance with document-specific requirements
- Comprehensive validation and error checking
- Clear confidence scoring for each extracted field`,

  OCR_SPECIALIST: `You specialize in interpreting OCR text from financial documents with:
- Advanced pattern recognition for financial data
- Error correction for common OCR mistakes
- Context-aware field identification
- Multi-format document handling
- Quality assessment and validation

Focus on:
- Correcting common OCR errors (O/0, I/1, S/5, etc.)
- Using context clues to validate extracted data
- Identifying document structure and layout
- Handling partial or unclear text
- Providing confidence metrics for reliability assessment`
};

// Data validation utilities
export const VALIDATION_RULES = {
  SSN: (ssn: string): boolean => /^\d{3}-\d{2}-\d{4}$/.test(ssn),
  EIN: (ein: string): boolean => /^\d{2}-\d{7}$/.test(ein),
  CURRENCY: (amount: string): boolean => /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(amount),
  DATE: (date: string): boolean => !isNaN(Date.parse(date)),
  PHONE: (phone: string): boolean => /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(phone),
  ZIP: (zip: string): boolean => /^\d{5}(-\d{4})?$/.test(zip),
  STATE: (state: string): boolean => /^[A-Z]{2}$/.test(state.toUpperCase())
};

// Confidence scoring utilities
export function calculateFieldConfidence(extractedValue: any, validationResult: boolean, ocrQuality: number): number {
  let confidence = ocrQuality;

  if (!extractedValue || extractedValue === '') {
    confidence = 0;
  } else if (!validationResult) {
    confidence *= 0.5; // Reduce confidence for failed validation
  }

  return Math.max(0, Math.min(1, confidence));
}

// Token optimization for extraction prompts
export function optimizeExtractionPrompt(prompt: string, maxTokens = 3500): string {
  const sections = prompt.split('\n\n');
  const estimatedTokens = prompt.length / 4;

  if (estimatedTokens <= maxTokens) {
    return prompt;
  }

  // Prioritize extraction structure and requirements
  const prioritySections = [
    'Extract',
    'Requirements:',
    'Validation',
    'OCR Text'
  ];

  let optimizedSections: string[] = [];
  let currentTokens = 0;
  const targetTokens = maxTokens * 0.9 * 4;

  for (const section of sections) {
    const isPriority = prioritySections.some(priority => section.includes(priority));

    if (currentTokens + section.length > targetTokens && !isPriority) {
      continue;
    }

    optimizedSections.push(section);
    currentTokens += section.length;

    if (currentTokens > targetTokens && !isPriority) {
      break;
    }
  }

  return optimizedSections.join('\n\n');
}