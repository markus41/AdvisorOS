# API Reference Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs and Versioning](#base-urls-and-versioning)
4. [Request/Response Format](#requestresponse-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Client Management API](#client-management-api)
8. [Document Management API](#document-management-api)
9. [QuickBooks Integration API](#quickbooks-integration-api)
10. [Stripe Billing API](#stripe-billing-api)
11. [AI Services API](#ai-services-api)
12. [Workflow Management API](#workflow-management-api)
13. [Reporting API](#reporting-api)
14. [Authentication API](#authentication-api)
15. [WebSocket Events](#websocket-events)

---

## Overview

The CPA Platform provides a comprehensive REST API for managing clients, documents, financial data, and integrations. All API endpoints follow RESTful conventions and return JSON responses.

### API Features
- **RESTful Design**: Consistent resource-based URLs
- **JSON Format**: All requests and responses use JSON
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Configurable rate limits per endpoint
- **Pagination**: Cursor-based pagination for large datasets
- **Filtering**: Advanced filtering and search capabilities
- **Webhooks**: Real-time event notifications

### Getting Started
1. Obtain API credentials from your organization admin
2. Authenticate using JWT tokens
3. Make requests to the appropriate endpoints
4. Handle responses and errors appropriately

---

## Authentication

### JWT Token Authentication

All API requests require authentication using JWT tokens passed in the Authorization header.

```http
Authorization: Bearer <your-jwt-token>
```

### Getting an Access Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password",
  "organizationId": "org-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "cpa"
    }
  }
}
```

### Refreshing Tokens

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Two-Factor Authentication

```http
POST /api/auth/2fa/verify
Content-Type: application/json
Authorization: Bearer <temp-token>

{
  "code": "123456"
}
```

---

## Base URLs and Versioning

### Production Environment
```
https://api.cpaplatform.com/api/v1
```

### Staging Environment
```
https://staging-api.cpaplatform.com/api/v1
```

### Development Environment
```
http://localhost:3000/api
```

### API Versioning
- Current version: `v1`
- Version specified in URL path: `/api/v1/...`
- Backward compatibility maintained for at least 12 months
- Deprecation notices provided 6 months in advance

---

## Request/Response Format

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
X-Organization-ID: <organization-id>
X-Request-ID: <unique-request-id>
```

### Response Format
All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req-123456",
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 100,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req-123456"
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | Valid authentication token required |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request data validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `RESOURCE_CONFLICT` | Resource already exists or conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests in time window |
| `INTEGRATION_ERROR` | External service integration error |
| `PROCESSING_ERROR` | Document or data processing error |

---

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limits by Plan

| Plan | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Trial | 100 | 20 |
| Starter | 1,000 | 50 |
| Professional | 10,000 | 200 |
| Enterprise | 100,000 | 1,000 |

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "retryAfter": 3600
  }
}
```

---

## Client Management API

### List Clients

```http
GET /api/clients
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 25, max: 100)
- `status` (string): Filter by status (`active`, `inactive`, `prospect`)
- `businessType` (string): Filter by business type
- `search` (string): Search in business name or email
- `sortBy` (string): Sort field (`businessName`, `createdAt`, `lastActivity`)
- `sortOrder` (string): Sort order (`asc`, `desc`)

**Example Request:**
```bash
curl -X GET "https://api.cpaplatform.com/api/clients?status=active&limit=10" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "client-123",
      "businessName": "Acme Corporation",
      "legalName": "Acme Corp LLC",
      "taxId": "12-3456789",
      "primaryContactEmail": "john@acme.com",
      "primaryContactName": "John Smith",
      "businessType": "LLC",
      "industry": "Technology",
      "status": "active",
      "riskLevel": "low",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Get Client by ID

```http
GET /api/clients/{clientId}
```

**Path Parameters:**
- `clientId` (string, required): Client ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "client-123",
    "businessName": "Acme Corporation",
    "legalName": "Acme Corp LLC",
    "taxId": "12-3456789",
    "quickbooksId": "qb-12345",
    "primaryContactEmail": "john@acme.com",
    "primaryContactName": "John Smith",
    "primaryContactPhone": "+1-555-0123",
    "businessAddress": "123 Main St, City, State 12345",
    "mailingAddress": "PO Box 123, City, State 12345",
    "businessType": "LLC",
    "industry": "Technology",
    "website": "https://acme.com",
    "status": "active",
    "riskLevel": "low",
    "annualRevenue": "1000000.00",
    "financialData": {
      "lastSyncAt": "2024-01-15T10:30:00Z",
      "accounts": [...],
      "balances": {...}
    },
    "customFields": {
      "accountingMethod": "accrual",
      "fiscalYearEnd": "12-31"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Create Client

```http
POST /api/clients
Content-Type: application/json

{
  "businessName": "New Business LLC",
  "legalName": "New Business Limited Liability Company",
  "taxId": "98-7654321",
  "primaryContactEmail": "contact@newbusiness.com",
  "primaryContactName": "Jane Doe",
  "primaryContactPhone": "+1-555-0987",
  "businessAddress": "456 Business Ave, City, State 54321",
  "businessType": "LLC",
  "industry": "Consulting",
  "website": "https://newbusiness.com",
  "status": "prospect",
  "customFields": {
    "referralSource": "Google Search",
    "estimatedRevenue": "500000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "client-456",
    "businessName": "New Business LLC",
    // ... full client object
    "createdAt": "2024-01-16T09:00:00Z",
    "updatedAt": "2024-01-16T09:00:00Z"
  }
}
```

### Update Client

```http
PUT /api/clients/{clientId}
Content-Type: application/json

{
  "primaryContactPhone": "+1-555-1111",
  "status": "active",
  "customFields": {
    "accountingMethod": "cash"
  }
}
```

### Delete Client

```http
DELETE /api/clients/{clientId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Client deleted successfully"
  }
}
```

---

## Document Management API

### Upload Document

```http
POST /api/documents/upload
Content-Type: multipart/form-data

# Form data:
# file: (binary file)
# clientId: client-123
# category: tax_return
# subcategory: form_1040
# year: 2023
# description: 2023 Individual Tax Return
# tags: ["tax", "2023", "individual"]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-789",
    "fileName": "2023_tax_return.pdf",
    "fileUrl": "https://storage.cpaplatform.com/documents/doc-789.pdf",
    "thumbnailUrl": "https://storage.cpaplatform.com/thumbnails/doc-789.jpg",
    "fileType": "pdf",
    "mimeType": "application/pdf",
    "fileSize": 2048576,
    "category": "tax_return",
    "subcategory": "form_1040",
    "year": 2023,
    "tags": ["tax", "2023", "individual"],
    "ocrStatus": "pending",
    "clientId": "client-123",
    "uploadedBy": "user-123",
    "createdAt": "2024-01-16T10:00:00Z"
  }
}
```

### List Documents

```http
GET /api/documents
```

**Query Parameters:**
- `clientId` (string): Filter by client ID
- `category` (string): Filter by document category
- `year` (integer): Filter by year
- `tags` (array): Filter by tags
- `ocrStatus` (string): Filter by OCR status
- `search` (string): Search in filename or description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-789",
      "fileName": "2023_tax_return.pdf",
      "fileUrl": "https://storage.cpaplatform.com/documents/doc-789.pdf",
      "category": "tax_return",
      "subcategory": "form_1040",
      "year": 2023,
      "ocrStatus": "completed",
      "ocrConfidence": 0.95,
      "extractedData": {
        "taxpayerName": "John Smith",
        "ssn": "***-**-1234",
        "filingStatus": "Married Filing Jointly",
        "wages": "75000.00"
      },
      "clientId": "client-123",
      "createdAt": "2024-01-16T10:00:00Z"
    }
  ]
}
```

### Get Document

```http
GET /api/documents/{documentId}
```

### Process Document with OCR

```http
POST /api/documents/{documentId}/ocr
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-789",
    "ocrStatus": "processing",
    "ocrJobId": "ocr-job-456",
    "estimatedCompletion": "2024-01-16T10:05:00Z"
  }
}
```

### Get OCR Results

```http
GET /api/documents/{documentId}/ocr-results
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ocrStatus": "completed",
    "ocrConfidence": 0.92,
    "extractedData": {
      "form_type": "1040",
      "tax_year": "2023",
      "taxpayer_name": "John Smith",
      "spouse_name": "Jane Smith",
      "ssn": "***-**-1234",
      "spouse_ssn": "***-**-5678",
      "filing_status": "Married Filing Jointly",
      "wages": "75000.00",
      "interest": "250.00",
      "total_income": "75250.00"
    },
    "rawOcrData": {
      "pages": [...],
      "confidence_scores": {...}
    },
    "needsReview": false,
    "processedAt": "2024-01-16T10:03:00Z"
  }
}
```

---

## QuickBooks Integration API

### Connect QuickBooks

```http
POST /api/quickbooks/connect
Content-Type: application/json

{
  "authCode": "qb-auth-code-from-oauth",
  "realmId": "123456789"
}
```

### Get Connection Status

```http
GET /api/quickbooks/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "realmId": "123456789",
    "companyName": "Acme Corporation",
    "lastSyncAt": "2024-01-16T08:00:00Z",
    "nextSyncAt": "2024-01-16T09:00:00Z",
    "syncStatus": "active",
    "tokenExpiresAt": "2024-07-16T08:00:00Z"
  }
}
```

### Trigger Manual Sync

```http
POST /api/quickbooks/sync
Content-Type: application/json

{
  "syncType": "incremental",
  "entities": ["customers", "accounts", "transactions"],
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-16"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncId": "sync-789",
    "status": "in_progress",
    "estimatedCompletion": "2024-01-16T11:05:00Z",
    "entities": ["customers", "accounts", "transactions"]
  }
}
```

### Get Sync Status

```http
GET /api/quickbooks/sync/{syncId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sync-789",
    "status": "completed",
    "startedAt": "2024-01-16T11:00:00Z",
    "completedAt": "2024-01-16T11:04:30Z",
    "recordsProcessed": 1250,
    "recordsSuccess": 1248,
    "recordsFailed": 2,
    "errors": [
      {
        "entityType": "customer",
        "entityId": "qb-cust-456",
        "error": "Duplicate customer name"
      }
    ]
  }
}
```

### Get QuickBooks Data

```http
GET /api/quickbooks/customers
GET /api/quickbooks/accounts
GET /api/quickbooks/transactions
```

---

## Stripe Billing API

### Create Subscription

```http
POST /api/billing/subscriptions
Content-Type: application/json

{
  "priceId": "price_professional_monthly",
  "paymentMethodId": "pm_1234567890",
  "quantity": 1,
  "metadata": {
    "organizationId": "org-123"
  }
}
```

### Get Subscription Status

```http
GET /api/billing/subscriptions/current
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sub_1234567890",
    "status": "active",
    "planName": "Professional",
    "planType": "monthly",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "quantity": 1,
    "unitAmount": 9900,
    "currency": "usd",
    "features": {
      "maxUsers": 50,
      "maxStorage": "100GB",
      "apiAccess": true,
      "advancedReporting": true
    },
    "usage": {
      "currentUsers": 12,
      "currentStorage": "45GB",
      "apiCalls": 2450
    }
  }
}
```

### Update Subscription

```http
PUT /api/billing/subscriptions/current
Content-Type: application/json

{
  "priceId": "price_enterprise_monthly",
  "quantity": 2
}
```

### Get Invoices

```http
GET /api/billing/invoices
```

### Create Customer Portal Session

```http
POST /api/billing/portal-session
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/abc123"
  }
}
```

---

## AI Services API

### Analyze Document

```http
POST /api/ai/analyze-document
Content-Type: application/json

{
  "documentId": "doc-789",
  "analysisType": "tax_form",
  "options": {
    "extractTables": true,
    "validateData": true,
    "generateSummary": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-456",
    "status": "completed",
    "documentType": "Form 1040",
    "confidence": 0.95,
    "extractedData": {
      "taxpayer": {
        "name": "John Smith",
        "ssn": "***-**-1234",
        "address": "123 Main St, City, State 12345"
      },
      "income": {
        "wages": "75000.00",
        "interest": "250.00",
        "dividends": "500.00",
        "total": "75750.00"
      },
      "deductions": {
        "standard": "25900.00",
        "itemized": null
      }
    },
    "summary": "Individual tax return for John Smith with total income of $75,750",
    "recommendations": [
      "Consider itemizing deductions for potential savings",
      "Review quarterly estimated payments for next year"
    ]
  }
}
```

### Generate Advisory Report

```http
POST /api/ai/advisory-report
Content-Type: application/json

{
  "clientId": "client-123",
  "reportType": "financial_health",
  "dateRange": {
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  },
  "includeRecommendations": true
}
```

### Get AI Usage

```http
GET /api/ai/usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentMonth": {
      "documentsProcessed": 245,
      "analysisMinutes": 1250,
      "reportsGenerated": 15
    },
    "limits": {
      "monthlyDocuments": 1000,
      "monthlyMinutes": 5000,
      "monthlyReports": 50
    },
    "usage": {
      "documentsPercentage": 24.5,
      "minutesPercentage": 25.0,
      "reportsPercentage": 30.0
    }
  }
}
```

---

## Workflow Management API

### Create Workflow Execution

```http
POST /api/workflows/executions
Content-Type: application/json

{
  "templateId": "template-tax-prep",
  "clientId": "client-123",
  "name": "2023 Tax Preparation - Acme Corp",
  "scheduledFor": "2024-02-01T09:00:00Z",
  "priority": "high",
  "configuration": {
    "taxYear": 2023,
    "entityType": "corporation",
    "dueDate": "2024-03-15"
  }
}
```

### List Workflow Executions

```http
GET /api/workflows/executions
```

**Query Parameters:**
- `status` (string): Filter by status
- `clientId` (string): Filter by client
- `assignedTo` (string): Filter by assigned user
- `priority` (string): Filter by priority

### Get Workflow Execution

```http
GET /api/workflows/executions/{executionId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "exec-789",
    "name": "2023 Tax Preparation - Acme Corp",
    "status": "running",
    "progress": 65.5,
    "currentStepIndex": 3,
    "totalSteps": 8,
    "startedAt": "2024-02-01T09:00:00Z",
    "estimatedCompletion": "2024-02-05T17:00:00Z",
    "steps": [
      {
        "index": 0,
        "name": "Gather Documents",
        "status": "completed",
        "completedAt": "2024-02-01T12:00:00Z"
      },
      {
        "index": 1,
        "name": "Review Financial Data",
        "status": "completed",
        "completedAt": "2024-02-02T10:00:00Z"
      },
      {
        "index": 2,
        "name": "Prepare Tax Return",
        "status": "completed",
        "completedAt": "2024-02-03T15:00:00Z"
      },
      {
        "index": 3,
        "name": "Internal Review",
        "status": "running",
        "assignedTo": "user-456",
        "startedAt": "2024-02-03T15:30:00Z"
      }
    ]
  }
}
```

### Update Workflow Step

```http
PUT /api/workflows/executions/{executionId}/steps/{stepIndex}
Content-Type: application/json

{
  "status": "completed",
  "notes": "Review completed successfully",
  "outputs": {
    "reviewedBy": "user-456",
    "issues": []
  }
}
```

---

## Reporting API

### Generate Report

```http
POST /api/reports/generate
Content-Type: application/json

{
  "templateId": "template-financial-summary",
  "name": "Q4 2023 Financial Summary",
  "format": "pdf",
  "parameters": {
    "clientIds": ["client-123", "client-456"],
    "dateRange": {
      "startDate": "2023-10-01",
      "endDate": "2023-12-31"
    },
    "includeCharts": true,
    "currency": "USD"
  },
  "delivery": {
    "email": ["manager@firm.com"],
    "portal": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report-789",
    "status": "generating",
    "estimatedCompletion": "2024-01-16T11:10:00Z",
    "downloadUrl": null
  }
}
```

### Get Report Status

```http
GET /api/reports/{reportId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-789",
    "name": "Q4 2023 Financial Summary",
    "status": "completed",
    "format": "pdf",
    "fileSize": 2048576,
    "downloadUrl": "https://storage.cpaplatform.com/reports/report-789.pdf",
    "generatedAt": "2024-01-16T11:08:00Z",
    "expiresAt": "2024-02-15T11:08:00Z"
  }
}
```

### List Reports

```http
GET /api/reports
```

### Download Report

```http
GET /api/reports/{reportId}/download
```

Returns the report file with appropriate content headers.

---

## WebSocket Events

### Connection

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('wss://api.cpaplatform.com/ws');

ws.onopen = function() {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  handleEvent(data);
};
```

### Event Types

#### Document Processing Updates
```json
{
  "type": "document.ocr.completed",
  "data": {
    "documentId": "doc-789",
    "status": "completed",
    "confidence": 0.95
  }
}
```

#### QuickBooks Sync Updates
```json
{
  "type": "quickbooks.sync.progress",
  "data": {
    "syncId": "sync-456",
    "progress": 75,
    "recordsProcessed": 750,
    "recordsTotal": 1000
  }
}
```

#### Workflow Updates
```json
{
  "type": "workflow.step.completed",
  "data": {
    "executionId": "exec-789",
    "stepIndex": 2,
    "status": "completed",
    "nextStep": "Internal Review"
  }
}
```

#### Task Notifications
```json
{
  "type": "task.assigned",
  "data": {
    "taskId": "task-123",
    "title": "Review client documents",
    "assignedTo": "user-456",
    "dueDate": "2024-01-20T17:00:00Z"
  }
}
```

---

## SDK and Code Examples

### JavaScript/TypeScript SDK

```typescript
import { CPAPlatformAPI } from '@cpa-platform/sdk';

const api = new CPAPlatformAPI({
  baseURL: 'https://api.cpaplatform.com',
  apiKey: 'your-api-key'
});

// List clients
const clients = await api.clients.list({
  status: 'active',
  limit: 10
});

// Upload document
const document = await api.documents.upload({
  file: fileBuffer,
  clientId: 'client-123',
  category: 'tax_return'
});

// Generate report
const report = await api.reports.generate({
  templateId: 'financial-summary',
  clientIds: ['client-123'],
  format: 'pdf'
});
```

### Python SDK

```python
from cpa_platform import CPAPlatformAPI

api = CPAPlatformAPI(
    base_url='https://api.cpaplatform.com',
    api_key='your-api-key'
)

# List clients
clients = api.clients.list(status='active', limit=10)

# Upload document
with open('document.pdf', 'rb') as f:
    document = api.documents.upload(
        file=f,
        client_id='client-123',
        category='tax_return'
    )
```

---

## Postman Collection

Import our Postman collection for easy API testing:

```json
{
  "info": {
    "name": "CPA Platform API",
    "description": "Complete API collection for CPA Platform",
    "version": "1.0.0"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://api.cpaplatform.com"
    },
    {
      "key": "access_token",
      "value": "your-token-here"
    }
  ]
}
```

---

## Support and Resources

### API Support
- **Documentation**: https://docs.cpaplatform.com
- **Support Email**: api-support@cpaplatform.com
- **Status Page**: https://status.cpaplatform.com
- **Community Forum**: https://community.cpaplatform.com

### Rate Limits and Quotas
- Contact support for enterprise rate limits
- Monitor usage through dashboard
- Implement exponential backoff for retries
- Cache responses when appropriate

### Best Practices
- Always handle errors gracefully
- Implement proper authentication token management
- Use webhooks for real-time updates instead of polling
- Validate all input data before sending requests
- Monitor API usage and performance

*For additional API endpoints and detailed examples, please refer to the interactive API documentation at https://api.cpaplatform.com/docs*