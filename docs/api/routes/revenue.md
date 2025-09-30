---
layout: default
title: Revenue Management API
parent: API Routes
nav_order: 1
---

# Revenue Management API

Complete API reference for revenue sharing, commission calculation, and advisor compensation management in AdvisorOS.

## Overview

The Revenue Management API provides comprehensive tools for:
- **Revenue Sharing**: Define and manage commission splits between organization and advisors
- **Commission Calculation**: Real-time calculation of advisor payouts and platform fees
- **Payment Processing**: Track and process advisor compensation
- **Tax Reporting**: Generate IRS Form 1099-NEC data for advisor tax reporting
- **Revenue Analytics**: Detailed reports and forecasting

## Authentication & Authorization

All endpoints require authentication. Most endpoints require **Admin role** for access.

```typescript
// Authentication header
Authorization: Bearer <your-api-token>

// Organization context automatically determined from token
```

## Base URL

```
https://api.advisoros.com/api/trpc/revenue
```

---

## Endpoints

### Create Revenue Share

Create a new revenue share record for an engagement.

**Endpoint**: `POST /revenue.createRevenueShare`

**Required Role**: Admin

#### Request Body

```typescript
{
  engagementId: string        // Engagement ID (required)
  advisorId: string          // Advisor ID (required)
  clientId: string           // Client ID (required)
  commissionPercentage: number // 0-100 (required)
  platformFeePercentage?: number // 0-100 (optional)
  periodStartDate: Date       // Period start (required)
  periodEndDate: Date         // Period end (required)
  tax1099Reportable?: boolean // Default: true
  taxYear?: number           // Default: current year
}
```

#### Example Request

```typescript
const revenueShare = await client.revenue.createRevenueShare.mutate({
  engagementId: "clh8k9x4t0000r8g4wz5h9f8w",
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x",
  clientId: "clh8k9x4t0000r8g4wz5h9f8y",
  commissionPercentage: 25.5,
  platformFeePercentage: 10,
  periodStartDate: new Date("2024-01-01"),
  periodEndDate: new Date("2024-12-31"),
  tax1099Reportable: true,
  taxYear: 2024
})
```

#### Response

```typescript
{
  id: "clh8k9x4t0000r8g4wz5h9f8z"
  engagementId: "clh8k9x4t0000r8g4wz5h9f8w"
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x"
  clientId: "clh8k9x4t0000r8g4wz5h9f8y"
  commissionPercentage: 25.5
  platformFeePercentage: 10
  status: "pending"
  tax1099Reportable: true
  taxYear: 2024
  createdAt: "2024-01-15T10:30:00Z"
  updatedAt: "2024-01-15T10:30:00Z"
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Admin role required |
| 422 | `VALIDATION_ERROR` | Invalid input parameters |

---

### Update Revenue Share

Update an existing revenue share record.

**Endpoint**: `POST /revenue.updateRevenueShare`

**Required Role**: Admin

#### Request Body

```typescript
{
  id: string                  // Revenue share ID (required)
  commissionPercentage?: number // 0-100
  platformFeePercentage?: number // 0-100
  status?: 'pending' | 'client_paid' | 'advisor_paid' | 'completed' | 'cancelled'
  periodEndDate?: Date
}
```

#### Example Request

```typescript
const updated = await client.revenue.updateRevenueShare.mutate({
  id: "clh8k9x4t0000r8g4wz5h9f8z",
  status: "client_paid",
  commissionPercentage: 27.5
})
```

---

### Calculate Commission

Calculate commission for an engagement based on revenue share configuration.

**Endpoint**: `GET /revenue.calculateCommission`

**Required Role**: Organization member

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `engagementId` | string | Yes | Engagement ID |
| `totalRevenue` | number | Yes | Total revenue amount |

#### Example Request

```typescript
const calculation = await client.revenue.calculateCommission.query({
  engagementId: "clh8k9x4t0000r8g4wz5h9f8w",
  totalRevenue: 10000
})
```

#### Response

```typescript
{
  engagementId: "clh8k9x4t0000r8g4wz5h9f8w"
  totalRevenue: 10000.00
  advisorPayout: 2550.00      // 25.5% commission
  platformFee: 1000.00        // 10% platform fee
  organizationRevenue: 6450.00 // Remaining revenue
  commissionPercentage: 25.5
  platformFeePercentage: 10
}
```

**Calculation Formula**:
```
advisorPayout = totalRevenue * (commissionPercentage / 100)
platformFee = totalRevenue * (platformFeePercentage / 100)
organizationRevenue = totalRevenue - advisorPayout - platformFee
```

---

### Bulk Calculate Commissions

Calculate commissions for multiple engagements in a time period.

**Endpoint**: `POST /revenue.bulkCalculateCommissions`

**Required Role**: Admin

#### Request Body

```typescript
{
  startDate: Date     // Period start
  endDate: Date       // Period end
  advisorId?: string  // Filter by specific advisor (optional)
}
```

#### Example Request

```typescript
const bulkCalc = await client.revenue.bulkCalculateCommissions.mutate({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-03-31"),
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x"
})
```

#### Response

```typescript
{
  period: {
    startDate: "2024-01-01"
    endDate: "2024-03-31"
  }
  calculations: [
    {
      engagementId: "..."
      totalRevenue: 10000
      advisorPayout: 2550
      // ... other fields
    }
  ]
  summary: {
    totalEngagements: 15
    totalRevenue: 150000
    totalAdvisorPayouts: 38250
    totalPlatformFees: 15000
    organizationRevenue: 96750
  }
}
```

---

### Process Advisor Payment

Mark advisor payout as processed and record payment details.

**Endpoint**: `POST /revenue.processAdvisorPayment`

**Required Role**: Admin

#### Request Body

```typescript
{
  revenueShareId: string     // Revenue share record ID
  paymentMethod: string      // Payment method (e.g., "ACH", "wire")
  paymentReference?: string  // External payment reference
  paidAt?: Date             // Payment date (default: now)
}
```

#### Example Request

```typescript
const payment = await client.revenue.processAdvisorPayment.mutate({
  revenueShareId: "clh8k9x4t0000r8g4wz5h9f8z",
  paymentMethod: "ACH",
  paymentReference: "ACH-2024-001234",
  paidAt: new Date()
})
```

---

### Get Revenue Report

Generate comprehensive revenue report for the organization.

**Endpoint**: `GET /revenue.getRevenueReport`

**Required Role**: Admin

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | Date | Yes | Report start date |
| `endDate` | Date | Yes | Report end date |
| `groupBy` | string | No | Group by: `advisor`, `client`, `service`, `month` |
| `advisorId` | string | No | Filter by specific advisor |

#### Example Request

```typescript
const report = await client.revenue.getRevenueReport.query({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  groupBy: "advisor"
})
```

#### Response

```typescript
{
  period: {
    startDate: "2024-01-01"
    endDate: "2024-12-31"
  }
  summary: {
    totalRevenue: 1500000
    totalAdvisorPayouts: 382500
    totalPlatformFees: 150000
    netOrganizationRevenue: 967500
  }
  breakdown: [
    {
      advisorId: "..."
      advisorName: "Sarah Johnson"
      totalRevenue: 450000
      totalPayout: 114750
      engagementCount: 25
      averageEngagementValue: 18000
    }
    // ... more advisors
  ]
}
```

---

### Get Advisor Earnings

Get earnings summary for a specific advisor.

**Endpoint**: `GET /revenue.getAdvisorEarnings`

**Required Role**: Organization member (can view own earnings)

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `advisorId` | string | No | Advisor ID (defaults to current user) |
| `startDate` | Date | No | Period start date |
| `endDate` | Date | No | Period end date |
| `status` | string | No | Filter by status |

#### Example Request

```typescript
const earnings = await client.revenue.getAdvisorEarnings.query({
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31")
})
```

#### Response

```typescript
{
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x"
  period: {
    startDate: "2024-01-01"
    endDate: "2024-12-31"
  }
  summary: {
    totalEarnings: 114750
    totalPaid: 95000
    totalPending: 19750
    numberOfEngagements: 25
  }
  earnings: [
    {
      engagementId: "..."
      clientName: "Acme Corp"
      amount: 2550
      status: "paid"
      periodEndDate: "2024-03-31"
      paidAt: "2024-04-15"
    }
    // ... more earnings
  ]
}
```

---

### Generate 1099 Data

Generate IRS Form 1099-NEC data for an advisor.

**Endpoint**: `GET /revenue.generate1099`

**Required Role**: Admin

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `advisorId` | string | Yes | Advisor ID |
| `taxYear` | number | Yes | Tax year (e.g., 2024) |

#### Example Request

```typescript
const form1099 = await client.revenue.generate1099.query({
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x",
  taxYear: 2024
})
```

#### Response

```typescript
{
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x"
  taxYear: 2024
  totalCompensation: 114750.00  // Box 1: Nonemployee compensation
  numberOfPayments: 25
  payments: [
    {
      date: "2024-01-15"
      amount: 2550.00
      engagementId: "..."
      clientName: "Acme Corp"
    }
    // ... all payments for the year
  ]
  advisorInfo: {
    name: "Sarah Johnson"
    ein: "12-3456789"  // Or SSN (encrypted)
    address: {
      street: "123 Main St"
      city: "San Francisco"
      state: "CA"
      zip: "94102"
    }
  }
}
```

**IRS Requirements**:
- Minimum reporting threshold: $600
- Deadline: January 31 following tax year
- Form: 1099-NEC (Nonemployee Compensation)

---

### Get Bulk 1099 Data

Get 1099 data for all advisors in a tax year.

**Endpoint**: `GET /revenue.getBulk1099Data`

**Required Role**: Admin

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taxYear` | number | Yes | Tax year |
| `minimumAmount` | number | No | Minimum threshold (default: 600) |

#### Example Request

```typescript
const bulk1099 = await client.revenue.getBulk1099Data.query({
  taxYear: 2024,
  minimumAmount: 600
})
```

#### Response

```typescript
{
  taxYear: 2024
  totalAdvisors: 12  // Number of advisors above threshold
  advisors: [
    {
      advisorId: "..."
      advisorName: "Sarah Johnson"
      advisorEmail: "sarah@example.com"
      totalPayments: 114750.00
      numberOfPayments: 25
      payments: [...]
    }
    // ... more advisors
  ]
}
```

---

### Get Revenue Share by ID

Get detailed information about a specific revenue share record.

**Endpoint**: `GET /revenue.getRevenueShareById`

**Required Role**: Organization member

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Revenue share ID |

#### Example Request

```typescript
const revenueShare = await client.revenue.getRevenueShareById.query({
  id: "clh8k9x4t0000r8g4wz5h9f8z"
})
```

---

### List Revenue Shares by Engagement

Get all revenue share records for an engagement.

**Endpoint**: `GET /revenue.listByEngagement`

**Required Role**: Organization member

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `engagementId` | string | Yes | Engagement ID |

#### Example Request

```typescript
const shares = await client.revenue.listByEngagement.query({
  engagementId: "clh8k9x4t0000r8g4wz5h9f8w"
})
```

---

### Get Pending Payouts

Get pending payouts for an advisor.

**Endpoint**: `GET /revenue.getPendingPayouts`

**Required Role**: Organization member (can view own payouts)

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `advisorId` | string | No | Advisor ID (defaults to current user) |

#### Example Request

```typescript
const pending = await client.revenue.getPendingPayouts.query({
  advisorId: "clh8k9x4t0000r8g4wz5h9f8x"
})
```

#### Response

```typescript
{
  payouts: [
    {
      id: "..."
      engagementId: "..."
      clientName: "Acme Corp"
      amount: 2550.00
      periodEndDate: "2024-03-31"
      status: "client_paid"
    }
  ]
  totalPending: 19750.00
  count: 8
}
```

---

## Data Models

### RevenueShare

```typescript
interface RevenueShare {
  id: string
  engagementId: string
  advisorId: string
  clientId: string
  commissionPercentage: number
  platformFeePercentage: number
  advisorPayout: number
  organizationRevenue: number
  platformFee: number
  status: 'pending' | 'client_paid' | 'advisor_paid' | 'completed' | 'cancelled'
  periodStartDate: Date
  periodEndDate: Date
  tax1099Reportable: boolean
  taxYear: number
  createdAt: Date
  updatedAt: Date
}
```

### Commission Calculation

```typescript
interface CommissionCalculation {
  engagementId: string
  totalRevenue: number
  advisorPayout: number
  platformFee: number
  organizationRevenue: number
  commissionPercentage: number
  platformFeePercentage: number
}
```

---

## Business Rules

### Commission Calculation

1. **Commission Percentage**: Applied to total revenue before platform fees
2. **Platform Fee**: Applied to total revenue independently
3. **Organization Revenue**: Remainder after advisor payout and platform fee

### Tax Reporting

1. **1099 Threshold**: $600 minimum for IRS reporting
2. **Reportable Income**: Only transactions marked as `tax1099Reportable: true`
3. **Tax Year**: Determined by `periodEndDate` of revenue share

### Payment Status Flow

```
pending → client_paid → advisor_paid → completed
                    ↓
                cancelled
```

### Multi-Tenant Security

- All queries automatically filtered by `organizationId`
- Advisors can only view their own earnings unless Admin role
- Cross-organization data access prevented at database level

---

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `UNAUTHORIZED` | Missing or invalid authentication | Provide valid Bearer token |
| `FORBIDDEN` | Insufficient permissions | Request Admin role access |
| `NOT_FOUND` | Revenue share not found | Verify revenue share ID exists |
| `VALIDATION_ERROR` | Invalid input parameters | Check request body against schema |
| `CONFLICT` | Revenue share already exists | Update existing record instead |

### Example Error Response

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Commission percentage must be between 0 and 100",
    details: {
      field: "commissionPercentage",
      value: 150,
      constraint: "max"
    },
    path: "revenue.createRevenueShare"
  }
}
```

---

## Best Practices

### Performance Optimization

1. **Bulk Operations**: Use `bulkCalculateCommissions` for multiple calculations
2. **Caching**: Revenue reports cached for 5 minutes
3. **Pagination**: Large result sets automatically paginated

### Security Considerations

1. **Sensitive Data**: Tax IDs and SSNs encrypted at rest
2. **Audit Trail**: All payment processing logged
3. **Access Control**: Strict role-based permissions

### Integration Patterns

```typescript
// Pattern: Calculate before creating
const calculation = await client.revenue.calculateCommission.query({
  engagementId,
  totalRevenue: 10000
})

// Review calculation with client
if (clientApproves(calculation)) {
  const revenueShare = await client.revenue.createRevenueShare.mutate({
    engagementId,
    advisorId,
    clientId,
    commissionPercentage: calculation.commissionPercentage
    // ...
  })
}

// Pattern: Process payment workflow
const pending = await client.revenue.getPendingPayouts.query({
  advisorId
})

for (const payout of pending.payouts) {
  // Process external payment
  const paymentResult = await processACHPayment(payout)

  // Record in AdvisorOS
  await client.revenue.processAdvisorPayment.mutate({
    revenueShareId: payout.id,
    paymentMethod: "ACH",
    paymentReference: paymentResult.reference
  })
}
```

---

## Support

For API support and technical questions:
- **Email**: api-support@advisoros.com
- **Documentation**: [docs.advisoros.com/api](https://docs.advisoros.com/api)
- **Status**: [status.advisoros.com](https://status.advisoros.com)

---

*Last Updated: January 2025*