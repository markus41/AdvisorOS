# Revenue Recognition - ASC 606

**Topic**: Revenue from Contracts with Customers
**Codification**: ASC 606
**Effective Date**: December 15, 2017 (public companies)
**Last Updated**: 2025-01-15
**Source**: Financial Accounting Standards Board (FASB)

## Overview

ASC 606 provides a comprehensive framework for recognizing revenue from contracts with customers. The core principle is that an entity recognizes revenue to depict the transfer of promised goods or services to customers in an amount that reflects the consideration to which the entity expects to be entitled.

## The Five-Step Model

### Step 1: Identify the Contract with a Customer

**Contract Criteria** (all must be met):
1. Parties have approved the contract and are committed to perform
2. Each party's rights regarding goods/services can be identified
3. Payment terms can be identified
4. Contract has commercial substance
5. Collection of consideration is probable

**Example - CPA Services**:
```
✅ Valid Contract:
- Signed engagement letter with client
- Defined scope: Monthly bookkeeping + quarterly tax planning
- Clear pricing: $2,500/month
- Client has ability and intent to pay

❌ Invalid Contract:
- Verbal agreement only, no written terms
- Scope undefined ("help with finances")
- Uncertain payment terms
```

### Step 2: Identify Performance Obligations

**Performance Obligation**: Promise to transfer a distinct good or service (or bundle of goods/services)

**Distinct Good or Service** if BOTH:
1. Customer can benefit from it on its own or with other readily available resources
2. Promise is separately identifiable from other promises in the contract

**Example - CPA Service Contract**:
```typescript
// Separate performance obligations
interface CPAContract {
  performanceObligations: [
    {
      service: "Monthly bookkeeping",
      distinct: true, // Can be purchased standalone
      transferType: "over time"
    },
    {
      service: "Quarterly tax planning",
      distinct: true, // Separate deliverable
      transferType: "point in time"
    },
    {
      service: "Annual tax return preparation",
      distinct: true, // Standalone service
      transferType: "point in time"
    }
  ]
}
```

### Step 3: Determine the Transaction Price

**Transaction Price**: Amount of consideration an entity expects to be entitled to in exchange for transferring promised goods or services.

**Considerations**:
- Variable consideration (bonuses, penalties, discounts)
- Significant financing component
- Noncash consideration
- Consideration payable to customer

**Variable Consideration Methods**:
1. **Expected Value**: Probability-weighted amount
2. **Most Likely Amount**: Single most likely amount in range

**Example - CPA Services with Variable Pricing**:
```typescript
// Fixed-fee engagement
const fixedFeeContract = {
  monthlyBookkeeping: 1500,
  quarterlyTaxPlanning: 2000,
  annualTaxReturn: 3500,
  totalTransactionPrice: 1500 * 12 + 2000 * 4 + 3500 // $29,500
};

// Performance-based pricing
const variableContract = {
  baseMonthlyFee: 1200,
  bonusForRefund: "5% of client tax refund",
  // Estimate transaction price using constraint
  estimatedBonus: 500, // Conservative estimate
  totalTransactionPrice: 1200 * 12 + 500 // $14,900
};

// Must apply constraint - only include variable consideration
// to extent it's highly probable that a significant reversal
// will NOT occur
```

### Step 4: Allocate Transaction Price to Performance Obligations

**Allocation Method**: Based on standalone selling prices (SSP)

**Approaches to Determine SSP**:
1. **Adjusted Market Assessment**: What customers would pay in the market
2. **Expected Cost Plus Margin**: Expected costs + appropriate margin
3. **Residual Approach**: Total price minus observable SSPs (limited use)

**Example - CPA Services Bundle**:
```typescript
interface ServiceAllocation {
  service: string;
  standalonePrice: number;
  bundleDiscount: number;
  allocatedPrice: number;
}

// Standalone prices
const services = {
  bookkeeping: { ssp: 2000, actual: 12 * 2000 }, // $24,000
  taxPlanning: { ssp: 2500, actual: 4 * 2500 }, // $10,000
  taxReturn: { ssp: 4000, actual: 4000 } // $4,000
};

const totalSSP = 24000 + 10000 + 4000; // $38,000
const bundlePrice = 30000; // $30,000 (21% discount)

// Allocate proportionally
const allocation: ServiceAllocation[] = [
  {
    service: "Bookkeeping",
    standalonePrice: 24000,
    bundleDiscount: 0.21,
    allocatedPrice: 24000 * (30000 / 38000) // $18,947
  },
  {
    service: "Tax Planning",
    standalonePrice: 10000,
    bundleDiscount: 0.21,
    allocatedPrice: 10000 * (30000 / 38000) // $7,895
  },
  {
    service: "Tax Return",
    standalonePrice: 4000,
    bundleDiscount: 0.21,
    allocatedPrice: 4000 * (30000 / 38000) // $3,158
  }
];
```

### Step 5: Recognize Revenue When (or As) Performance Obligation is Satisfied

**Recognition Timing**:
- **Over Time**: If one of three criteria met
  1. Customer simultaneously receives and consumes benefits
  2. Entity's performance creates/enhances an asset customer controls
  3. Entity's performance doesn't create asset with alternative use + entity has enforceable right to payment

- **Point in Time**: If not met above criteria

**Example - CPA Service Recognition**:
```typescript
// Over time recognition (monthly bookkeeping)
async function recognizeMonthlyRevenue(
  clientId: string,
  month: Date,
  allocatedMonthlyAmount: number
) {
  // Recognize proportionally as service is delivered
  const daysInMonth = getDaysInMonth(month);
  const daysElapsed = getCurrentDayOfMonth();

  const recognizedRevenue = (daysElapsed / daysInMonth) * allocatedMonthlyAmount;

  await prisma.revenueRecognition.create({
    data: {
      clientId,
      serviceType: 'MONTHLY_BOOKKEEPING',
      period: month,
      allocatedAmount: allocatedMonthlyAmount,
      recognizedAmount: recognizedRevenue,
      recognitionMethod: 'OVER_TIME',
      performanceProgress: (daysElapsed / daysInMonth) * 100,
      organizationId: ctx.organizationId,
    }
  });

  // Audit trail required
  await createAuditLog({
    action: 'REVENUE_RECOGNIZED',
    entityType: 'REVENUE_RECOGNITION',
    details: {
      method: 'ASC 606',
      amount: recognizedRevenue,
      percentage: (daysElapsed / daysInMonth) * 100
    }
  });
}

// Point in time recognition (tax return completion)
async function recognizeTaxReturnRevenue(
  clientId: string,
  taxReturnId: string,
  allocatedAmount: number
) {
  // Verify all criteria met
  const taxReturn = await prisma.taxReturn.findUnique({
    where: { id: taxReturnId },
    include: { filingStatus: true }
  });

  // Revenue recognized when:
  // 1. Client has accepted the work
  // 2. Payment is reasonably assured
  // 3. Control has transferred (client can file)
  if (
    taxReturn.status === 'APPROVED_BY_CLIENT' &&
    taxReturn.paymentStatus !== 'PAST_DUE' &&
    taxReturn.deliveredToClient
  ) {
    await prisma.revenueRecognition.create({
      data: {
        clientId,
        serviceType: 'TAX_RETURN_PREPARATION',
        taxReturnId,
        allocatedAmount,
        recognizedAmount: allocatedAmount, // 100% at point in time
        recognitionMethod: 'POINT_IN_TIME',
        recognitionDate: new Date(),
        organizationId: ctx.organizationId,
      }
    });
  }
}
```

## Special Considerations for CPA Practices

### Retainer Arrangements
```typescript
// Client pays $10,000 retainer for services to be provided
// Record as contract liability (deferred revenue)

await prisma.contractLiability.create({
  data: {
    clientId: client.id,
    amount: 10000,
    description: 'Annual services retainer',
    servicesPending: true,
    organizationId: ctx.organizationId,
  }
});

// Recognize revenue as services are delivered
// Following 5-step model for each service provided
```

### Contingent Fees
```typescript
// Success-based fee: 20% of tax refund obtained
// Constraint: Only recognize when highly probable

interface ContingentFeeEvaluation {
  baseService: number; // Fixed fee component
  contingentComponent: {
    basis: 'percentage_of_savings',
    rate: 0.20,
    estimatedAmount: number,
    constraintApplied: boolean,
    recognizableNow: number
  };
}

// Conservative approach - recognize only when outcome is certain
const evaluation: ContingentFeeEvaluation = {
  baseService: 2000,
  contingentComponent: {
    basis: 'percentage_of_savings',
    rate: 0.20,
    estimatedAmount: 5000, // Estimated 20% of $25,000 refund
    constraintApplied: true,
    recognizableNow: 0 // Don't recognize until refund received
  }
};
```

### Subscription-Based Services
```typescript
// Monthly recurring revenue for cloud-based accounting tools
// Recognize ratably over subscription period

interface SubscriptionRevenue {
  subscriptionType: 'MONTHLY' | 'ANNUAL';
  totalContractValue: number;
  recognitionPeriod: number; // months
  monthlyRecognition: number;
}

const subscription: SubscriptionRevenue = {
  subscriptionType: 'ANNUAL',
  totalContractValue: 12000,
  recognitionPeriod: 12,
  monthlyRecognition: 1000 // Straight-line over 12 months
};

// Recognition occurs as service is provided (over time)
```

## Required Disclosures

### Disaggregation of Revenue
```sql
-- Revenue by service line
SELECT
  service_type,
  SUM(recognized_amount) as total_revenue,
  COUNT(DISTINCT client_id) as client_count
FROM revenue_recognition
WHERE organization_id = $1
  AND recognition_date BETWEEN $2 AND $3
GROUP BY service_type;
```

### Contract Balances
- Contract assets (unbilled receivables)
- Contract liabilities (deferred revenue)
- Receivables

### Performance Obligations
- When typically satisfied
- Significant payment terms
- Obligations for returns, refunds, warranties

## Implementation in AdvisorOS

### Database Schema
```prisma
model RevenueRecognition {
  id                   String   @id @default(cuid())
  organizationId       String
  clientId             String
  contractId           String
  performanceObligation String

  // ASC 606 tracking
  allocatedAmount      Decimal
  recognizedAmount     Decimal
  recognitionMethod    RecognitionMethod // OVER_TIME or POINT_IN_TIME
  performanceProgress  Decimal? // For over-time recognition

  // Timing
  recognitionDate      DateTime?
  periodStart          DateTime
  periodEnd            DateTime

  // Audit
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  createdById          String

  @@index([organizationId, clientId])
  @@index([organizationId, recognitionDate])
}

enum RecognitionMethod {
  OVER_TIME
  POINT_IN_TIME
}
```

### Revenue Recognition Service
```typescript
// apps/web/src/server/services/revenue-recognition.service.ts

export class RevenueRecognitionService {
  // Implement 5-step model
  async recognizeRevenue(contract: Contract): Promise<RevenueRecognition[]> {
    // Step 1: Validate contract
    this.validateContract(contract);

    // Step 2: Identify performance obligations
    const obligations = this.identifyPerformanceObligations(contract);

    // Step 3: Determine transaction price
    const transactionPrice = this.determineTransactionPrice(contract);

    // Step 4: Allocate price to obligations
    const allocations = this.allocateTransactionPrice(
      transactionPrice,
      obligations
    );

    // Step 5: Recognize revenue
    return this.createRevenueRecognitions(allocations);
  }
}
```

## Common Pitfalls

❌ **Incorrect**: Recognizing all revenue upfront for annual contract
```typescript
// WRONG
await recordRevenue(annualContractValue, today);
```

✅ **Correct**: Recognize over service delivery period
```typescript
// RIGHT
await recognizeMonthlyRevenue(annualContractValue / 12, eachMonth);
```

❌ **Incorrect**: Not allocating discounts to performance obligations
```typescript
// WRONG - Applying entire discount to one service
```

✅ **Correct**: Proportional allocation based on SSP
```typescript
// RIGHT - Allocate discount proportionally
```

## References

- [ASC 606: Revenue from Contracts with Customers](https://fasb.org/asc/606)
- [AICPA Revenue Recognition Guide](https://www.aicpa.org/resources/download/revenue-recognition-guide)
- [FASB ASC 606 Implementation Q&A](https://fasb.org/606-implementation)

## Audit Trail Requirements

⚠️ **Critical**: All revenue recognition decisions must be documented with:
- Contract identification and validation
- Performance obligation analysis
- Transaction price determination
- Allocation methodology
- Recognition timing and method
- Management judgments and estimates

---

**For AdvisorOS Implementation**: Always create comprehensive audit logs for revenue recognition transactions. Include all 5-step model calculations in audit details for SOX compliance.