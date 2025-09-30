# CPA Platform API Specifications

## API Overview
RESTful API built with Next.js API Routes, TypeScript, and Prisma ORM.

## Base URL
- Development: `http://localhost:3000/api`
- Staging: `https://staging.cpaplatform.com/api`
- Production: `https://api.cpaplatform.com`

## Authentication
All API requests require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Common Headers
```
Content-Type: application/json
Accept: application/json
X-Organization-ID: <organization-id>
```

## Response Format
### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new organization and admin user
```json
// Request
{
  "organization": {
    "name": "Smith & Associates CPA",
    "subdomain": "smith-cpa"
  },
  "user": {
    "email": "admin@smithcpa.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Smith"
  }
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "admin@smithcpa.com",
      "role": "owner"
    },
    "organization": {
      "id": "org_123",
      "name": "Smith & Associates CPA"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and get access token
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "role": "admin",
      "organizationId": "org_123"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

#### POST /api/auth/refresh
Refresh access token
```json
// Request
{
  "refreshToken": "refresh_token_here"
}

// Response
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

### Users

#### GET /api/users
List all users in organization
```json
// Query Parameters
?page=1&limit=20&role=admin&search=john

// Response
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "usr_123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "admin",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### GET /api/users/{id}
Get single user by ID
```json
// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "organizationId": "org_123",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### POST /api/users/invite
Invite new team member
```json
// Request
{
  "email": "newuser@example.com",
  "role": "cpa",
  "firstName": "Jane",
  "lastName": "Smith"
}

// Response
{
  "success": true,
  "data": {
    "invitation": {
      "id": "inv_123",
      "email": "newuser@example.com",
      "role": "cpa",
      "expiresAt": "2024-01-08T00:00:00Z"
    }
  }
}
```

### Clients

#### GET /api/clients
List all clients
```json
// Query Parameters
?page=1&limit=20&status=active&search=acme

// Response
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "cli_123",
        "name": "Acme Corporation",
        "email": "contact@acme.com",
        "phone": "+1-555-0100",
        "status": "active",
        "quickbooksId": "qb_123",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    }
  }
}
```

#### GET /api/clients/{id}
Get single client
```json
// Response
{
  "success": true,
  "data": {
    "client": {
      "id": "cli_123",
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "phone": "+1-555-0100",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip": "10001"
      },
      "status": "active",
      "quickbooksId": "qb_123",
      "taxInfo": {
        "ein": "12-3456789",
        "fiscalYearEnd": "12-31"
      },
      "notes": [],
      "documents": [],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### POST /api/clients
Create new client
```json
// Request
{
  "name": "New Client Inc",
  "email": "contact@newclient.com",
  "phone": "+1-555-0200",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001"
  },
  "taxInfo": {
    "ein": "98-7654321",
    "fiscalYearEnd": "06-30"
  }
}

// Response
{
  "success": true,
  "data": {
    "client": {
      "id": "cli_456",
      // ... full client object
    }
  }
}
```

#### PATCH /api/clients/{id}
Update client
```json
// Request
{
  "name": "Updated Client Name",
  "status": "inactive"
}

// Response
{
  "success": true,
  "data": {
    "client": {
      // ... updated client object
    }
  }
}
```

### Documents

#### GET /api/documents
List documents
```json
// Query Parameters
?clientId=cli_123&category=tax_return&year=2023

// Response
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_123",
        "name": "2023_Tax_Return.pdf",
        "category": "tax_return",
        "clientId": "cli_123",
        "size": 2048576,
        "mimeType": "application/pdf",
        "uploadedBy": "usr_123",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST /api/documents/upload
Upload document
```
// Multipart form data
file: <binary>
clientId: cli_123
category: tax_return
year: 2023

// Response
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_456",
      "name": "2023_Tax_Return.pdf",
      "url": "https://storage.azure.com/documents/doc_456.pdf",
      "category": "tax_return",
      "ocrStatus": "processing"
    }
  }
}
```

#### GET /api/documents/{id}/download
Download document
```
// Response: Binary file stream
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
```

### QuickBooks Integration

#### GET /api/quickbooks/auth
Get QuickBooks OAuth URL
```json
// Response
{
  "success": true,
  "data": {
    "authUrl": "https://appcenter.intuit.com/connect/oauth2/..."
  }
}
```

#### POST /api/quickbooks/callback
Handle OAuth callback
```json
// Request
{
  "code": "oauth_code",
  "realmId": "company_id"
}

// Response
{
  "success": true,
  "data": {
    "connected": true,
    "companyName": "Sample Company"
  }
}
```

#### POST /api/quickbooks/sync
Sync QuickBooks data
```json
// Request
{
  "entities": ["customers", "invoices", "payments"],
  "startDate": "2023-01-01",
  "endDate": "2023-12-31"
}

// Response
{
  "success": true,
  "data": {
    "synced": {
      "customers": 45,
      "invoices": 230,
      "payments": 180
    },
    "errors": []
  }
}
```

### Reports & Analytics

#### GET /api/reports/dashboard
Get dashboard metrics
```json
// Response
{
  "success": true,
  "data": {
    "metrics": {
      "totalClients": 156,
      "activeClients": 142,
      "documentsProcessed": 1234,
      "pendingTasks": 23
    },
    "revenue": {
      "current": 245000,
      "previous": 220000,
      "change": 11.36
    },
    "recentActivity": [
      {
        "type": "client_added",
        "description": "New client: Acme Corp",
        "timestamp": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

#### GET /api/reports/clients/{id}/summary
Get client financial summary
```json
// Response
{
  "success": true,
  "data": {
    "client": {
      "id": "cli_123",
      "name": "Acme Corporation"
    },
    "financials": {
      "revenue": {
        "ytd": 1500000,
        "lastYear": 1200000
      },
      "expenses": {
        "ytd": 900000,
        "lastYear": 800000
      },
      "netIncome": {
        "ytd": 600000,
        "lastYear": 400000
      }
    },
    "documents": {
      "total": 45,
      "byCategory": {
        "tax_return": 3,
        "financial_statement": 12,
        "receipt": 30
      }
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token missing or invalid |
| `PERMISSION_DENIED` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `VALIDATION_ERROR` | Input validation failed |
| `DUPLICATE_ENTRY` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTEGRATION_ERROR` | External service error |
| `SERVER_ERROR` | Internal server error |

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per organization
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Pagination
All list endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (e.g., `createdAt`)
- `order`: Sort order (`asc` or `desc`)

## Filtering
List endpoints support filtering via query parameters:
- Text search: `search=keyword`
- Date range: `startDate=2023-01-01&endDate=2023-12-31`
- Status: `status=active`
- Multiple values: `status[]=active&status[]=pending`

## Webhooks
Configure webhooks for real-time events:
- `client.created`
- `client.updated`
- `document.uploaded`
- `quickbooks.synced`
- `user.invited`

## API Versioning
API version specified in URL or header:
- URL: `/api/v1/resource`
- Header: `API-Version: 1.0`