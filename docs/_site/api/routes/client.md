# Client Management API

## Overview

The Client Management API provides comprehensive functionality for managing CPA firm clients, including CRUD operations, search, filtering, and integration with QuickBooks. All endpoints are organization-scoped and require proper authentication.

## Base Router: `client`

All client endpoints are accessed via the `client` router in the tRPC API.

## Endpoints

### 1. List Clients

Get a paginated list of clients with filtering and sorting options.

**Endpoint:** `client.list`
**Method:** Query
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  filters?: {
    search?: string                    // Search across business name, legal name, email, contact name, tax ID
    status?: string[]                  // Filter by client status: ['prospect', 'active', 'inactive', 'archived']
    businessType?: string[]            // Filter by business type: ['individual', 'partnership', 'corporation', 'llc', 'trust']
    riskLevel?: string[]              // Filter by risk level: ['low', 'medium', 'high']
    hasQuickBooks?: boolean           // Filter clients with/without QuickBooks integration
    annualRevenueMin?: number         // Minimum annual revenue filter
    annualRevenueMax?: number         // Maximum annual revenue filter
    createdAfter?: Date               // Filter clients created after date
    createdBefore?: Date              // Filter clients created before date
    industry?: string[]               // Filter by industry
  },
  sort?: {
    field: string                     // Sort field: 'businessName', 'createdAt', 'updatedAt', 'annualRevenue'
    direction: 'asc' | 'desc'         // Sort direction
  },
  pagination?: {
    page?: number                     // Page number (1-based, default: 1)
    limit?: number                    // Items per page (default: 20, max: 100)
    offset?: number                   // Alternative to page-based pagination
  }
}
```

#### Response Schema

```typescript
{
  data: Client[]                      // Array of client objects
  pagination: {
    total: number                     // Total number of clients
    pages: number                     // Total number of pages
    page: number                      // Current page
    limit: number                     // Items per page
    hasNext: boolean                  // Whether there are more pages
    hasPrev: boolean                  // Whether there are previous pages
  }
}
```

#### Example Usage

```typescript
// Get active clients sorted by business name
const clients = await client.client.list.query({
  filters: {
    status: ['active'],
    businessType: ['corporation', 'llc']
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

// Search for clients with QuickBooks integration
const qbClients = await client.client.list.query({
  filters: {
    search: 'tech',
    hasQuickBooks: true,
    annualRevenueMin: 100000
  }
})
```

---

### 2. Get Client by ID

Retrieve a specific client by their unique identifier.

**Endpoint:** `client.byId`
**Method:** Query
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  id: string                          // Client CUID
  includeRelations?: boolean          // Include related data (default: true)
}
```

#### Response Schema

```typescript
Client & {
  documents?: Document[]              // Client documents (if includeRelations: true)
  notes?: Note[]                     // Client notes (if includeRelations: true)
  tasks?: Task[]                     // Client tasks (if includeRelations: true)
  quickbooksIntegration?: QBIntegration // QuickBooks integration details
}
```

#### Example Usage

```typescript
// Get client with all related data
const client = await client.client.byId.query({
  id: 'client-id-here',
  includeRelations: true
})

// Get client basic information only
const clientBasic = await client.client.byId.query({
  id: 'client-id-here',
  includeRelations: false
})
```

#### Error Responses

- `NOT_FOUND`: Client does not exist or user doesn't have access
- `UNAUTHORIZED`: Invalid authentication or insufficient permissions

---

### 3. Create Client

Create a new client in the organization.

**Endpoint:** `client.create`
**Method:** Mutation
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  // Required fields
  businessName: string               // Business or individual name
  businessType: 'individual' | 'partnership' | 'corporation' | 'llc' | 'trust'
  primaryContactEmail: string        // Primary contact email
  primaryContactName: string         // Primary contact person name

  // Optional fields
  legalName?: string                // Legal business name (if different)
  primaryContactPhone?: string       // Primary contact phone
  address?: {
    street: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country?: string
  }
  taxId?: string                    // Federal Tax ID/EIN
  quickbooksId?: string             // QuickBooks customer ID
  annualRevenue?: number            // Annual revenue
  industry?: string                 // Industry classification
  riskLevel?: 'low' | 'medium' | 'high' // Risk assessment (default: 'low')
  status?: 'prospect' | 'active' | 'inactive' // Client status (default: 'prospect')
  notes?: string                    // Initial notes
  customFields?: Record<string, any> // Custom field values
}
```

#### Response Schema

```typescript
Client                              // Created client object
```

#### Example Usage

```typescript
// Create a new corporate client
const newClient = await client.client.create.mutate({
  businessName: 'Acme Corporation',
  businessType: 'corporation',
  primaryContactName: 'John Smith',
  primaryContactEmail: 'john@acme.com',
  primaryContactPhone: '+1-555-0123',
  address: {
    street: '123 Business Ave',
    city: 'Business City',
    state: 'CA',
    zipCode: '90210'
  },
  taxId: '12-3456789',
  annualRevenue: 1000000,
  industry: 'manufacturing',
  riskLevel: 'low'
})

// Create an individual client
const individual = await client.client.create.mutate({
  businessName: 'Jane Doe',
  businessType: 'individual',
  primaryContactName: 'Jane Doe',
  primaryContactEmail: 'jane@email.com',
  status: 'active'
})
```

#### Error Responses

- `CONFLICT`: Client with same business name or tax ID already exists
- `BAD_REQUEST`: Invalid input data or missing required fields
- `INTERNAL_SERVER_ERROR`: Server error during creation

---

### 4. Update Client

Update an existing client's information.

**Endpoint:** `client.update`
**Method:** Mutation
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  id: string                        // Client CUID (required)

  // All other fields are optional and will only update if provided
  businessName?: string
  legalName?: string
  businessType?: 'individual' | 'partnership' | 'corporation' | 'llc' | 'trust'
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  address?: {
    street: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country?: string
  }
  taxId?: string
  quickbooksId?: string
  annualRevenue?: number
  industry?: string
  riskLevel?: 'low' | 'medium' | 'high'
  status?: 'prospect' | 'active' | 'inactive' | 'archived'
  customFields?: Record<string, any>
}
```

#### Response Schema

```typescript
Client                              // Updated client object
```

#### Example Usage

```typescript
// Update client contact information
const updatedClient = await client.client.update.mutate({
  id: 'client-id-here',
  primaryContactEmail: 'newemail@acme.com',
  primaryContactPhone: '+1-555-9999',
  annualRevenue: 1200000
})

// Update client status and risk level
const statusUpdate = await client.client.update.mutate({
  id: 'client-id-here',
  status: 'active',
  riskLevel: 'medium'
})
```

#### Error Responses

- `NOT_FOUND`: Client does not exist
- `CONFLICT`: Updated data conflicts with existing client
- `BAD_REQUEST`: Invalid input data

---

### 5. Delete Client

Soft delete a client (marks as deleted but preserves data for audit purposes).

**Endpoint:** `client.delete`
**Method:** Mutation
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  id: string                        // Client CUID
}
```

#### Response Schema

```typescript
{
  success: boolean                  // Deletion success status
}
```

#### Example Usage

```typescript
// Delete a client
const result = await client.client.delete.mutate({
  id: 'client-id-here'
})

if (result.success) {
  console.log('Client deleted successfully')
}
```

#### Error Responses

- `NOT_FOUND`: Client does not exist
- `CONFLICT`: Client cannot be deleted (has active engagements, documents, etc.)
- `INTERNAL_SERVER_ERROR`: Server error during deletion

---

### 6. Get Client Statistics

Get aggregate statistics about clients in the organization.

**Endpoint:** `client.stats`
**Method:** Query
**Authentication:** Required (Organization scope)

#### Input Schema

None (uses organization context from authentication)

#### Response Schema

```typescript
{
  total: number                     // Total number of clients
  active: number                    // Number of active clients
  prospects: number                 // Number of prospect clients
  inactive: number                  // Number of inactive clients
  archived: number                  // Number of archived clients
  withQuickBooks: number           // Clients with QuickBooks integration
  totalRevenue: number             // Sum of all client annual revenues
  averageRevenue: number           // Average client annual revenue
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
  businessTypeDistribution: {
    individual: number
    partnership: number
    corporation: number
    llc: number
    trust: number
  }
  recentGrowth: {
    lastMonth: number               // Clients added in last 30 days
    lastQuarter: number             // Clients added in last 90 days
    lastYear: number                // Clients added in last 365 days
  }
}
```

#### Example Usage

```typescript
// Get organization client statistics
const stats = await client.client.stats.query()

console.log(`Total clients: ${stats.total}`)
console.log(`Active clients: ${stats.active}`)
console.log(`Total revenue: $${stats.totalRevenue.toLocaleString()}`)
```

---

### 7. Search Clients

Perform full-text search across client data.

**Endpoint:** `client.search`
**Method:** Query
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  query: string                     // Search term (minimum 1 character)
  limit?: number                    // Maximum results (default: 10, max: 50)
}
```

#### Response Schema

```typescript
{
  query: string                     // Original search query
  results: Client[]                 // Matching clients
  count: number                     // Number of results returned
}
```

#### Example Usage

```typescript
// Search for clients by name or email
const searchResults = await client.client.search.query({
  query: 'acme',
  limit: 20
})

searchResults.results.forEach(client => {
  console.log(`Found: ${client.businessName}`)
})
```

---

### 8. Bulk Operations

Perform operations on multiple clients simultaneously.

**Endpoint:** `client.bulkOperation`
**Method:** Mutation
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  action: 'update' | 'delete' | 'archive' | 'activate'
  clientIds: string[]               // Array of client CUIDs
  data?: Record<string, any>        // Update data (for update action)
  reason?: string                   // Reason for bulk action
}
```

#### Response Schema

```typescript
{
  success: boolean                  // Overall operation success
  processed: number                 // Number of clients processed
  failed: number                    // Number of failed operations
  errors: Array<{
    clientId: string
    error: string
  }>                               // Individual errors
}
```

#### Example Usage

```typescript
// Bulk update client risk levels
const bulkUpdate = await client.client.bulkOperation.mutate({
  action: 'update',
  clientIds: ['client-1', 'client-2', 'client-3'],
  data: {
    riskLevel: 'medium'
  }
})

// Bulk archive clients
const bulkArchive = await client.client.bulkOperation.mutate({
  action: 'archive',
  clientIds: ['client-1', 'client-2'],
  reason: 'End of engagement'
})
```

---

### 9. Export Clients

Export client data to CSV format.

**Endpoint:** `client.export`
**Method:** Mutation
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  filters?: ClientFilters           // Same filters as list endpoint
  fields?: string[]                 // Specific fields to export (optional)
}
```

#### Response Schema

```typescript
{
  data: string                      // CSV data as string
  fileName: string                  // Suggested filename
  contentType: string               // MIME type (text/csv)
}
```

#### Example Usage

```typescript
// Export all active clients
const exportData = await client.client.export.mutate({
  filters: {
    status: ['active']
  },
  fields: ['businessName', 'primaryContactEmail', 'annualRevenue']
})

// Create downloadable file
const blob = new Blob([exportData.data], { type: exportData.contentType })
const url = URL.createObjectURL(blob)
```

---

### 10. Get Client Aggregations

Get aggregated data grouped by specified fields for reporting and analytics.

**Endpoint:** `client.aggregations`
**Method:** Query
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  groupBy: 'status' | 'businessType' | 'riskLevel' | 'industry'
  filters?: ClientFilters           // Same filters as list endpoint
}
```

#### Response Schema

```typescript
Array<{
  [groupBy]: string                 // The grouping field value
  count: number                     // Number of clients in this group
  totalRevenue: number              // Sum of annual revenue for this group
  averageRevenue: number            // Average annual revenue for this group
}>
```

#### Example Usage

```typescript
// Get clients grouped by business type
const businessTypeStats = await client.client.aggregations.query({
  groupBy: 'businessType',
  filters: {
    status: ['active']
  }
})

businessTypeStats.forEach(group => {
  console.log(`${group.businessType}: ${group.count} clients, $${group.totalRevenue} revenue`)
})
```

---

### 11. Get Recent Activity

Get recent client-related activity for dashboard display.

**Endpoint:** `client.recentActivity`
**Method:** Query
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  limit?: number                    // Maximum results (default: 10, max: 50)
  days?: number                     // Number of days to look back (default: 7, max: 90)
}
```

#### Response Schema

```typescript
{
  recentClients: Array<{
    id: string
    businessName: string
    status: string
    type: 'created'
    timestamp: Date
  }>
  recentUpdates: Array<{
    id: string
    businessName: string
    status: string
    type: 'updated'
    timestamp: Date
  }>
}
```

#### Example Usage

```typescript
// Get recent client activity for dashboard
const activity = await client.client.recentActivity.query({
  limit: 15,
  days: 14
})

console.log(`${activity.recentClients.length} new clients in last 14 days`)
console.log(`${activity.recentUpdates.length} client updates in last 14 days`)
```

---

### 12. Validation Endpoints

#### Validate Business Name
**Endpoint:** `client.validateBusinessName`

```typescript
// Input
{
  businessName: string
  excludeId?: string                // Exclude specific client ID from check
}

// Response
{
  isAvailable: boolean
  exists: boolean
}
```

#### Validate Tax ID
**Endpoint:** `client.validateTaxId`

```typescript
// Input
{
  taxId: string
  excludeId?: string
}

// Response
{
  isAvailable: boolean
  exists: boolean
}
```

---

### 13. Import from CSV

Import clients from CSV data.

**Endpoint:** `client.importFromCSV`
**Method:** Mutation
**Authentication:** Required (Organization scope)

#### Input Schema

```typescript
{
  csvData: string                   // CSV data as string
  options?: {
    skipDuplicates?: boolean        // Skip existing clients (default: true)
    updateExisting?: boolean        // Update existing clients (default: false)
    mapping?: Record<string, string> // Custom field mapping
  }
}
```

#### Response Schema

```typescript
{
  success: boolean
  imported: number                  // Number of clients imported
  updated: number                   // Number of clients updated
  skipped: number                   // Number of clients skipped
  errors: Array<{
    row: number
    error: string
  }>
}
```

---

### 14. Additional Client Operations

#### Get Client Metrics
**Endpoint:** `client.getMetrics`

Get financial and engagement metrics for a specific client or organization.

#### Get Client Documents
**Endpoint:** `client.getDocuments`

Get paginated list of documents for a specific client.

#### Get Client Tasks
**Endpoint:** `client.getTasks`

Get tasks associated with a specific client.

#### Add Client Note
**Endpoint:** `client.addNote`

Add a note or communication record to a client.

#### Update Risk Level
**Endpoint:** `client.updateRiskLevel`

Update client risk assessment with detailed reasoning.

#### Get Engagement Summary
**Endpoint:** `client.getEngagementSummary`

Get summary of services and engagements for a client.

#### Get QuickBooks Status
**Endpoint:** `client.getQuickBooksStatus`

Check QuickBooks integration status for a client.

#### Get Audit Trail
**Endpoint:** `client.getAuditTrail`

Get audit log of all actions performed on a client.

---

## Error Handling

### Common Error Codes

- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions for the requested operation
- `NOT_FOUND`: Client not found or not accessible
- `CONFLICT`: Operation conflicts with existing data (duplicates, constraints)
- `BAD_REQUEST`: Invalid input data or parameters
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Unexpected server error

### Error Response Format

```typescript
{
  error: {
    message: string
    code: string
    data: {
      code: string
      httpStatus: number
      path: string
      zodError?: ZodError  // For validation errors
    }
  }
}
```

## Best Practices

### 1. Pagination
Always use pagination for list endpoints to avoid performance issues:

```typescript
// Good
const clients = await client.client.list.query({
  pagination: { page: 1, limit: 25 }
})

// Avoid - could return thousands of records
const allClients = await client.client.list.query()
```

### 2. Filtering
Use specific filters to reduce data transfer and improve performance:

```typescript
// Good - specific filters
const activeCorps = await client.client.list.query({
  filters: {
    status: ['active'],
    businessType: ['corporation']
  }
})

// Less efficient - broad search
const searched = await client.client.search.query({
  query: 'corp'
})
```

### 3. Error Handling
Always handle specific error types:

```typescript
try {
  const client = await client.client.byId.query({ id: clientId })
} catch (error) {
  if (error.data?.code === 'NOT_FOUND') {
    // Handle missing client
  } else if (error.data?.code === 'UNAUTHORIZED') {
    // Handle auth error
  } else {
    // Handle unexpected errors
  }
}
```

### 4. Bulk Operations
Use bulk operations for multiple similar actions:

```typescript
// Good - single bulk operation
await client.client.bulkOperation.mutate({
  action: 'update',
  clientIds: clientIds,
  data: { riskLevel: 'medium' }
})

// Inefficient - multiple individual operations
for (const clientId of clientIds) {
  await client.client.update.mutate({
    id: clientId,
    riskLevel: 'medium'
  })
}
```

### 5. Data Validation
Use the validation endpoints before creating/updating:

```typescript
// Validate before creating
const nameCheck = await client.client.validateBusinessName.query({
  businessName: 'New Company Inc'
})

if (!nameCheck.isAvailable) {
  throw new Error('Business name already exists')
}

const newClient = await client.client.create.mutate({
  businessName: 'New Company Inc',
  // ... other fields
})
```