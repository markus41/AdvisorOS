# Federal Tax Rates 2025

**Last Updated**: 2025-01-15
**Source**: IRS Revenue Procedure 2024-XX
**Effective**: Tax Year 2025 (filed in 2026)

## Individual Income Tax Brackets (2025)

### Single Filers

| Tax Rate | Income Range |
|----------|--------------|
| 10% | $0 - $11,600 |
| 12% | $11,601 - $47,150 |
| 22% | $47,151 - $100,525 |
| 24% | $100,526 - $191,950 |
| 32% | $191,951 - $243,725 |
| 35% | $243,726 - $609,350 |
| 37% | Over $609,350 |

### Married Filing Jointly

| Tax Rate | Income Range |
|----------|--------------|
| 10% | $0 - $23,200 |
| 12% | $23,201 - $94,300 |
| 22% | $94,301 - $201,050 |
| 24% | $201,051 - $383,900 |
| 32% | $383,901 - $487,450 |
| 35% | $487,451 - $731,200 |
| 37% | Over $731,200 |

### Married Filing Separately

| Tax Rate | Income Range |
|----------|--------------|
| 10% | $0 - $11,600 |
| 12% | $11,601 - $47,150 |
| 22% | $47,151 - $100,525 |
| 24% | $100,526 - $191,950 |
| 32% | $191,951 - $243,725 |
| 35% | $243,726 - $365,600 |
| 37% | Over $365,600 |

### Head of Household

| Tax Rate | Income Range |
|----------|--------------|
| 10% | $0 - $16,550 |
| 12% | $16,551 - $63,100 |
| 22% | $63,101 - $100,500 |
| 24% | $100,501 - $191,950 |
| 32% | $191,951 - $243,700 |
| 35% | $243,701 - $609,350 |
| 37% | Over $609,350 |

## Standard Deductions (2025)

| Filing Status | Standard Deduction |
|---------------|-------------------|
| Single | $14,600 |
| Married Filing Jointly | $29,200 |
| Married Filing Separately | $14,600 |
| Head of Household | $21,900 |

### Additional Standard Deduction (Age 65+)
- **Single or Head of Household**: Additional $1,950
- **Married**: Additional $1,550 per spouse

## Corporate Tax Rate

| Entity Type | Tax Rate |
|-------------|----------|
| C Corporation | Flat 21% |
| Personal Service Corporation | Flat 21% |

## Alternative Minimum Tax (AMT)

### AMT Exemption Amounts (2025)

| Filing Status | Exemption Amount | Phase-out Begins |
|---------------|------------------|------------------|
| Single | $85,700 | $609,350 |
| Married Filing Jointly | $133,300 | $1,218,700 |
| Married Filing Separately | $66,650 | $609,350 |

### AMT Tax Rates
- **26%** on AMT income up to $220,700 (MFJ) or $110,350 (others)
- **28%** on AMT income above those thresholds

## Capital Gains Tax Rates (2025)

### Long-Term Capital Gains (held > 1 year)

**Single Filers**:
| Tax Rate | Income Range |
|----------|--------------|
| 0% | $0 - $47,025 |
| 15% | $47,026 - $518,900 |
| 20% | Over $518,900 |

**Married Filing Jointly**:
| Tax Rate | Income Range |
|----------|--------------|
| 0% | $0 - $94,050 |
| 15% | $94,051 - $583,750 |
| 20% | Over $583,750 |

### Short-Term Capital Gains (held ≤ 1 year)
Taxed as ordinary income at regular tax rates.

### Net Investment Income Tax (NIIT)
Additional **3.8%** tax on investment income for:
- Single filers with MAGI > $200,000
- Married filing jointly with MAGI > $250,000

## Self-Employment Tax (2025)

### Social Security
- **Rate**: 12.4% (employer + employee portions)
- **Wage Base**: $168,600 (maximum taxable earnings)
- **Maximum Tax**: $20,906.40

### Medicare
- **Rate**: 2.9% on all self-employment income
- **Additional Medicare Tax**: 0.9% on income over:
  - $250,000 (Married Filing Jointly)
  - $200,000 (Single, Head of Household)
  - $125,000 (Married Filing Separately)

### Total Self-Employment Tax Rate
- **15.3%** on income up to Social Security wage base
- **2.9%** on income above wage base
- Plus **0.9%** additional Medicare tax on high earners

## Quarterly Estimated Tax Requirements

### Who Must Pay
Individuals who expect to owe **$1,000 or more** in taxes after subtracting:
- Federal income tax withholding
- Refundable credits

### Safe Harbor Rules
Avoid underpayment penalty if you pay the lesser of:
1. **90%** of current year's tax liability, OR
2. **100%** of prior year's tax liability (110% if AGI > $150,000)

### Payment Schedule (2025)
- **Q1 (Jan-Mar)**: Due April 15, 2025
- **Q2 (Apr-May)**: Due June 16, 2025
- **Q3 (Jun-Aug)**: Due September 15, 2025
- **Q4 (Sep-Dec)**: Due January 15, 2026

## Retirement Contribution Limits (2025)

### 401(k), 403(b), 457 Plans
- **Employee Contribution Limit**: $23,500
- **Catch-up (Age 50+)**: Additional $7,500
- **Total Contribution Limit**: $70,000

### Traditional & Roth IRA
- **Contribution Limit**: $7,000
- **Catch-up (Age 50+)**: Additional $1,000

### SEP IRA
- **Contribution Limit**: Lesser of $70,000 or 25% of compensation

### SIMPLE IRA
- **Contribution Limit**: $16,500
- **Catch-up (Age 50+)**: Additional $3,500

## Common Deductions & Credits

### Above-the-Line Deductions
- Student loan interest: Up to $2,500
- HSA contributions: $4,150 (self) / $8,300 (family)
- Self-employed health insurance premiums
- Self-employment tax deduction (50%)

### Child Tax Credit
- **Amount**: $2,000 per qualifying child under 17
- **Refundable Portion**: Up to $1,700
- **Phase-out**: Begins at $200,000 (single) / $400,000 (MFJ)

### Earned Income Tax Credit (EITC)
Maximum credit amounts vary by number of children:
- **0 children**: $632
- **1 child**: $4,213
- **2 children**: $6,960
- **3+ children**: $7,830

### Dependent Care Credit
- **Maximum Expenses**: $3,000 (one dependent) / $6,000 (two or more)
- **Credit Rate**: 20-35% depending on AGI

## Implementation Notes for AdvisorOS

### Tax Calculation Service
```typescript
// apps/web/src/server/services/tax-calculation.service.ts

export const TAX_YEAR_2025_RATES = {
  single: [
    { rate: 0.10, min: 0, max: 11600 },
    { rate: 0.12, min: 11601, max: 47150 },
    { rate: 0.22, min: 47151, max: 100525 },
    { rate: 0.24, min: 100526, max: 191950 },
    { rate: 0.32, min: 191951, max: 243725 },
    { rate: 0.35, min: 243726, max: 609350 },
    { rate: 0.37, min: 609351, max: Infinity },
  ],
  // ... other filing statuses
};

export function calculateFederalTax(
  income: number,
  filingStatus: FilingStatus,
  deductions: number = 0
): TaxCalculation {
  const taxableIncome = Math.max(0, income - deductions);
  const brackets = TAX_YEAR_2025_RATES[filingStatus];

  let tax = 0;
  let previousMax = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;

    const taxableInBracket = Math.min(
      taxableIncome - bracket.min,
      bracket.max - bracket.min + 1
    );

    tax += taxableInBracket * bracket.rate;
    previousMax = bracket.max;

    if (taxableIncome <= bracket.max) break;
  }

  return {
    grossIncome: income,
    deductions,
    taxableIncome,
    taxOwed: Math.round(tax * 100) / 100,
    effectiveRate: (tax / income) * 100,
  };
}
```

### Audit Trail Requirements
All tax calculations must create audit logs:
```typescript
await createAuditLog({
  action: 'TAX_CALCULATION_PERFORMED',
  entityType: 'TAX_CALCULATION',
  entityId: calculation.id,
  organizationId: ctx.organizationId,
  userId: ctx.session.user.id,
  details: {
    taxYear: 2025,
    filingStatus: 'single',
    grossIncome: 100000,
    deductions: 14600,
    taxOwed: 15763.50,
  },
});
```

## References

- [IRS Publication 17: Your Federal Income Tax](https://www.irs.gov/publications/p17)
- [IRS Publication 505: Tax Withholding and Estimated Tax](https://www.irs.gov/publications/p505)
- [IRS Form 1040: U.S. Individual Income Tax Return](https://www.irs.gov/forms-pubs/about-form-1040)
- [Tax Reform Acts and Legislative History](https://www.irs.gov/tax-reform)

## Important Notes

⚠️ **Disclaimer**: This information is for educational purposes. Always consult IRS publications and a licensed tax professional for specific tax advice.

⚠️ **Inflation Adjustments**: Tax brackets and limits are adjusted annually for inflation. Verify with current IRS guidance.

⚠️ **State Taxes**: This guide covers federal taxes only. State tax rates and rules vary significantly.

---

**For AdvisorOS Development**: When implementing tax calculations, always reference the most current IRS publications and include comprehensive unit tests with various income scenarios.