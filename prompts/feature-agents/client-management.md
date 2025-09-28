# Feature Agent Prompts - Client Management

## Client CRUD Operations

### Create Client Feature
```
Implement a complete client management system with the following features:

**User Story:**
As a CPA, I want to manage my client information so that I can track all client details, documents, and communications in one place.

**Technical Requirements:**

1. Client List Page (/clients)
   - Searchable DataTable component
   - Filters: status, assigned user, date range
   - Bulk actions: export, delete, status change
   - Quick actions: view, edit, add note
   - Pagination with 20/50/100 options
   - Column sorting and visibility toggle

2. Add Client Page (/clients/new)
   - Multi-step form wizard
   - Step 1: Basic Information
     - Company/Individual toggle
     - Name, email, phone
     - Address with autocomplete
   - Step 2: Tax Information
     - EIN/SSN (masked input)
     - Fiscal year end
     - Entity type selection
   - Step 3: Contact Persons
     - Multiple contacts support
     - Primary contact designation
   - Step 4: Initial Notes
     - Rich text editor
     - Tag system
   - Form validation with Zod
   - Save as draft capability

3. Client Detail Page (/clients/[id])
   - Header with status badge
   - Tab navigation:
     - Overview: key metrics, recent activity
     - Details: all client information
     - Documents: file manager
     - Notes: communication log
     - Financials: QuickBooks data
     - Team: assigned members
   - Quick actions toolbar
   - Activity timeline

4. Edit Client Modal
   - Inline editing for all fields
   - Change history tracking
   - Confirmation for critical changes
   - Auto-save with debouncing

**Database Operations:**
- Optimistic UI updates
- Soft delete with recovery
- Audit trail for all changes
- Full-text search indexing

**Permissions:**
- Owner: full access
- Admin: full access
- CPA: view/edit assigned clients
- Staff: view only

Generate complete implementation with components, API routes, and database queries.
```

## QuickBooks Integration

### Sync Feature
```
Implement QuickBooks Online integration for client data synchronization:

**Features:**

1. OAuth Connection Flow
   - Connect QuickBooks button
   - OAuth popup handling
   - Token storage in database
   - Auto-refresh mechanism
   - Connection status display

2. Initial Sync Wizard
   - Entity selection (customers, vendors, etc.)
   - Field mapping interface
   - Conflict resolution options
   - Preview before import
   - Progress tracking

3. Continuous Sync
   - Webhook receivers
   - Real-time updates
   - Bi-directional sync options
   - Sync history log
   - Error recovery

4. Sync Management Dashboard
   - Last sync timestamp
   - Sync statistics
   - Error notifications
   - Manual sync trigger
   - Sync settings

**API Implementation:**
- /api/quickbooks/connect
- /api/quickbooks/callback
- /api/quickbooks/sync
- /api/quickbooks/webhooks
- /api/quickbooks/disconnect

**Data Mapping:**
QuickBooks Customer -> CPA Client
- DisplayName -> name
- PrimaryEmailAddr -> email
- PrimaryPhone -> phone
- BillAddr -> address
- CompanyName -> companyName
- Notes -> notes

**Error Handling:**
- Rate limit management
- Retry with exponential backoff
- User notifications
- Detailed error logging

Generate complete integration with UI components and API handlers.
```

## Client Portal

### Client Access System
```
Build a separate client portal with restricted access:

**Portal Features:**

1. Client Registration
   - Invitation-only system
   - Email verification
   - Password setup
   - Terms acceptance

2. Client Dashboard (/portal)
   - Welcome message
   - Quick stats
   - Recent documents
   - Upcoming deadlines
   - Messages from CPA

3. Document Center
   - View/download documents
   - Upload requested documents
   - Document status tracking
   - Secure sharing links
   - E-signature integration

4. Communication
   - Secure messaging with CPA
   - Notification preferences
   - Read receipts
   - File attachments

5. Tax Information
   - Current year summary
   - Historical returns
   - Payment history
   - Estimated taxes

**Security:**
- Separate auth context
- Limited API access
- Encrypted file transfer
- Session timeout
- IP restriction options

**UI Differences:**
- Simplified navigation
- Client-friendly language
- Help tooltips
- Mobile-first design

Generate portal implementation with routing and access control.
```

## Bulk Operations

### Import/Export Feature
```
Implement bulk client import/export functionality:

**Import Features:**

1. CSV/Excel Import
   - Template download
   - Drag-drop upload
   - Column mapping UI
   - Data validation
   - Preview with errors
   - Duplicate detection
   - Merge strategies

2. Import Sources:
   - CSV/Excel files
   - QuickBooks export
   - Other CPA software
   - Google Contacts
   - Outlook contacts

3. Validation Rules:
   - Required fields check
   - Email format validation
   - Phone number formatting
   - Address verification
   - EIN/SSN validation

**Export Features:**

1. Export Formats:
   - CSV
   - Excel with formatting
   - PDF reports
   - JSON for backup

2. Export Options:
   - Selected clients only
   - Filter-based export
   - Field selection
   - Include related data
   - Schedule recurring exports

**UI Components:**
- Import wizard modal
- Progress indicator
- Error summary panel
- Success notifications
- Export configuration dialog

Generate complete bulk operations system with progress tracking.
```

## Client Communication

### Notes & Activity System
```
Create a comprehensive client communication tracking system:

**Features:**

1. Note Types:
   - Meeting notes
   - Phone calls
   - Emails
   - Tasks
   - Internal notes

2. Rich Note Editor:
   - Markdown support
   - @mentions for team
   - #tags for categorization
   - File attachments
   - Templates library

3. Activity Timeline:
   - Chronological view
   - Filter by type
   - Search within notes
   - User attribution
   - Edit history

4. Email Integration:
   - Email-to-note conversion
   - Send note as email
   - Email threading
   - CC team members

5. Task Management:
   - Create tasks from notes
   - Due date setting
   - Assignment to team
   - Status tracking
   - Reminders

**Database Schema:**
- Note model with polymorphic type
- Attachment relationship
- Full-text search
- Soft delete support

Generate complete communication system with real-time updates.
```

## Advanced Search

### Smart Search Feature
```
Implement intelligent client search with advanced filters:

**Search Capabilities:**

1. Full-Text Search:
   - Client name
   - Email
   - Phone
   - Address
   - Notes content
   - Document content (OCR)

2. Advanced Filters:
   - Date ranges
   - Status
   - Assigned user
   - Tags
   - Has documents
   - QuickBooks sync status
   - Custom fields

3. Saved Searches:
   - Save filter combinations
   - Name searches
   - Share with team
   - Set as default
   - Quick access menu

4. Search UI:
   - Command palette (Cmd+K)
   - Inline search bar
   - Filter sidebar
   - Search history
   - Suggested searches

5. Results Display:
   - Highlighted matches
   - Grouped results
   - Preview cards
   - Bulk selection
   - Export results

**Performance:**
- Elasticsearch integration
- Query optimization
- Result caching
- Pagination
- Lazy loading

Generate complete search implementation with performance optimizations.
```