# AdvisorOS API Documentation

## Overview

AdvisorOS provides a comprehensive API built on tRPC (TypeScript RPC) that enables type-safe communication between the client and server. The API follows RESTful principles while providing the benefits of end-to-end type safety.

## Table of Contents

### API Architecture
- [tRPC Introduction](./trpc/introduction.md)
- [Authentication & Authorization](./authentication.md)
- [Error Handling](./error-handling.md)
- [Rate Limiting](./rate-limiting.md)
- [Pagination](./pagination.md)

### API Routes
- [Client Management API](./routes/client.md)
- [Enhanced API Routes](./routes/enhanced-api.md)
- [Financial Analytics API](./routes/financial-analytics.md)
- [Document Management API](./routes/documents.md)
- [User Management API](./routes/users.md)
- [Organization API](./routes/organization.md)

### Integration Guides
- [QuickBooks Integration](./integrations/quickbooks.md)
- [Azure Services](./integrations/azure.md)
- [Webhooks](./integrations/webhooks.md)

### SDK Documentation
- [TypeScript SDK](./sdks/typescript.md)
- [JavaScript SDK](./sdks/javascript.md)
- [REST API Reference](./rest/openapi.yaml)

### Development Tools
- [Postman Collection](./tools/postman.md)
- [API Testing](./testing/api-testing.md)
- [Monitoring & Analytics](./monitoring.md)

## Quick Start

### 1. Authentication

All API requests require authentication. AdvisorOS supports multiple authentication methods:

```typescript
// Using the TypeScript client
import { createTRPCMsw } from '@trpc/msw'
import type { AppRouter } from '@/server/api/root'

const client = createTRPCClient<AppRouter>({
  url: 'https://api.advisoros.com/api/trpc',
  headers: {
    authorization: `Bearer ${token}`,
  },
})
```

### 2. Making API Calls

#### Query Example (Read Operations)
```typescript
// Get list of clients
const clients = await client.client.list.query({
  filters: {
    status: ['active'],
    search: 'Acme Corp'
  },
  pagination: {
    page: 1,
    limit: 20
  }
})
```

#### Mutation Example (Write Operations)
```typescript
// Create a new client
const newClient = await client.client.create.mutate({
  businessName: 'Acme Corporation',
  businessType: 'corporation',
  primaryContactEmail: 'contact@acme.com',
  primaryContactName: 'John Doe',
  address: {
    street: '123 Business St',
    city: 'Business City',
    state: 'CA',
    zipCode: '90210'
  }
})
```

### 3. Error Handling

```typescript
try {
  const client = await client.client.byId.query({ id: 'invalid-id' })
} catch (error) {
  if (error.data?.code === 'NOT_FOUND') {
    console.log('Client not found')
  } else if (error.data?.code === 'UNAUTHORIZED') {
    console.log('Authentication required')
  } else {
    console.log('Unexpected error:', error.message)
  }
}
```

## API Base URLs

### Production
```
https://api.advisoros.com/api/trpc
```

### Staging
```
https://staging-api.advisoros.com/api/trpc
```

### Development
```
http://localhost:3000/api/trpc
```

## Authentication

### Bearer Token Authentication

Include your API token in the Authorization header:

```http
Authorization: Bearer your-api-token-here
```

### Session-Based Authentication

For web applications, authentication is handled via secure HTTP-only cookies:

```http
Cookie: __Secure-next-auth.session-token=your-session-token
```

### Organization Context

All API requests are scoped to your organization. The organization context is automatically determined from your authentication token.

## Response Format

### Success Response
```typescript
{
  result: {
    data: {
      // Your requested data
    }
  }
}
```

### Error Response
```typescript
{
  error: {
    message: "Error description",
    code: "ERROR_CODE",
    data: {
      code: "TRPC_ERROR_CODE",
      httpStatus: 400,
      path: "client.create",
      stack: "..." // Only in development
    }
  }
}
```

## Rate Limiting

API requests are subject to rate limiting:

- **Standard Plan**: 1,000 requests per hour
- **Professional Plan**: 5,000 requests per hour
- **Enterprise Plan**: 25,000 requests per hour

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

Most list endpoints support pagination:

```typescript
{
  pagination: {
    page: 1,        // Page number (1-based)
    limit: 20,      // Items per page (max 100)
    offset: 0       // Alternative to page-based pagination
  }
}
```

Response includes pagination metadata:

```typescript
{
  data: [...],
  pagination: {
    total: 150,
    pages: 8,
    page: 1,
    limit: 20,
    hasNext: true,
    hasPrev: false
  }
}
```

## Filtering and Sorting

### Filtering
```typescript
{
  filters: {
    search: "search term",
    status: ["active", "pending"],
    createdAfter: new Date("2024-01-01"),
    createdBefore: new Date("2024-12-31")
  }
}
```

### Sorting
```typescript
{
  sort: {
    field: "createdAt",
    direction: "desc"
  }
}
```

## Data Types and Schemas

### Common Types

#### Client
```typescript
interface Client {
  id: string
  businessName: string
  legalName?: string
  businessType: 'individual' | 'partnership' | 'corporation' | 'llc' | 'trust'
  status: 'prospect' | 'active' | 'inactive' | 'archived'
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone?: string
  address?: Address
  taxId?: string
  quickbooksId?: string
  annualRevenue?: number
  riskLevel: 'low' | 'medium' | 'high'
  industry?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Address
```typescript
interface Address {
  street: string
  street2?: string
  city: string
  state: string
  zipCode: string
  country?: string
}
```

#### Pagination
```typescript
interface PaginationInput {
  page?: number
  limit?: number
  offset?: number
}

interface PaginationOutput {
  total: number
  pages: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}
```

## Webhooks

AdvisorOS supports webhooks for real-time notifications:

### Supported Events
- `client.created`
- `client.updated`
- `client.deleted`
- `document.uploaded`
- `quickbooks.sync.completed`

### Webhook Configuration
```typescript
// Register a webhook endpoint
await client.webhooks.create.mutate({
  url: 'https://your-app.com/webhooks/advisoros',
  events: ['client.created', 'client.updated'],
  secret: 'your-webhook-secret'
})
```

## Security

### SSL/TLS
All API communications must use HTTPS. HTTP requests are automatically redirected to HTTPS.

### Data Encryption
- All data is encrypted at rest using AES-256
- All data in transit is encrypted using TLS 1.3
- PII and sensitive data use additional encryption layers

### Audit Logging
All API requests are logged for security and compliance purposes. Logs include:
- Request timestamp
- User/organization context
- Endpoint accessed
- Request parameters (sanitized)
- Response status

## SDK Installation

### TypeScript/JavaScript
```bash
npm install @advisoros/sdk
```

```typescript
import { AdvisorOSClient } from '@advisoros/sdk'

const client = new AdvisorOSClient({
  apiKey: 'your-api-key',
  environment: 'production' // or 'staging', 'development'
})
```

## Code Examples

### Client Management

#### List Clients with Filters
```typescript
const clients = await client.client.list.query({
  filters: {
    status: ['active'],
    businessType: ['corporation', 'llc'],
    hasQuickBooks: true,
    annualRevenueMin: 100000
  },
  sort: {
    field: 'businessName',
    direction: 'asc'
  },
  pagination: {
    page: 1,
    limit: 25
  }
})
```

#### Create Client
```typescript
const newClient = await client.client.create.mutate({
  businessName: 'Tech Startup Inc',
  businessType: 'corporation',
  primaryContactName: 'Jane Smith',
  primaryContactEmail: 'jane@techstartup.com',
  primaryContactPhone: '+1-555-0123',
  address: {
    street: '456 Innovation Blvd',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94107'
  },
  industry: 'technology',
  annualRevenue: 500000
})
```

#### Update Client
```typescript
const updatedClient = await client.client.update.mutate({
  id: 'client-id',
  businessName: 'Updated Business Name',
  annualRevenue: 750000,
  riskLevel: 'medium'
})
```

#### Search Clients
```typescript
const searchResults = await client.client.search.query({
  query: 'Acme',
  limit: 10
})
```

### Document Management

#### Upload Document
```typescript
const document = await client.documents.upload.mutate({
  clientId: 'client-id',
  file: fileBlob,
  category: 'tax_returns',
  metadata: {
    taxYear: 2024,
    documentType: 'form_1040'
  }
})
```

#### Get Client Documents
```typescript
const documents = await client.client.getDocuments.query({
  clientId: 'client-id',
  category: 'financial_statements',
  pagination: {
    page: 1,
    limit: 20
  }
})
```

## Support and Resources

### API Support
- **Documentation**: [docs.advisoros.com/api](https://docs.advisoros.com/api)
- **Status Page**: [status.advisoros.com](https://status.advisoros.com)
- **Support Email**: api-support@advisoros.com
- **Developer Forum**: [developers.advisoros.com](https://developers.advisoros.com)

### Rate Limit Increases
Contact support for rate limit increases beyond standard plans.

### Enterprise Features
Enterprise customers have access to:
- Dedicated API endpoints
- Custom rate limits
- Priority support
- Advanced analytics
- Custom integrations

For enterprise API access, contact enterprise@advisoros.com.