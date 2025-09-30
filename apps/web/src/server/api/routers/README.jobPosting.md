# Job Posting tRPC Router Documentation

## Overview

The Job Posting router provides a complete, production-ready API for managing job postings in AdvisorOS. It supports the full lifecycle of job postings from creation through publication and distribution to external job boards.

**File Location**: `apps/web/src/server/api/routers/jobPosting.router.ts`

## Features

✅ **Multi-Tenant Security** - All operations automatically scoped to user's organization
✅ **8 Complete Procedures** - Create, list, get, update, delete, publish, track views, public access
✅ **Type-Safe Validation** - Zod schemas ensure data integrity
✅ **Comprehensive Error Handling** - Proper HTTP status codes and meaningful messages
✅ **Cursor-Based Pagination** - Efficient handling of large datasets
✅ **Slug Generation** - SEO-friendly URLs for public career pages
✅ **Pipeline Stages** - Default hiring pipeline with 5 stages
✅ **Soft Delete** - Preserve data for audit trail
✅ **Public Procedures** - Support for career page integration
✅ **View Tracking** - Analytics for job posting performance

## API Procedures

### 1. `create` - Create New Job Posting

**Type**: Mutation (requires authentication)

**Input**:
```typescript
{
  title: string;
  department?: string;
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  preferredSkills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  compensationType?: 'hourly' | 'salary' | 'commission';
  benefits?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  openings?: number;
  hiringManagerId?: string;
  recruiterId?: string;
  keywords?: string[];
  tags?: string[];
  expiresAt?: Date;
}
```

**Returns**: Complete job posting object with generated ID, slug, and default pipeline stages

**Features**:
- Auto-generates unique slug from title
- Validates salary range (min ≤ max)
- Verifies hiring manager/recruiter belong to organization
- Sets status to 'draft' automatically
- Initializes default pipeline stages
- Sets organizationId and createdBy from context

**Security**:
- Requires authentication
- Auto-scopes to user's organization
- Validates team member associations

---

### 2. `list` - List Job Postings with Pagination

**Type**: Query (requires authentication)

**Input**:
```typescript
{
  status?: 'draft' | 'active' | 'paused' | 'closed' | 'cancelled';
  limit?: number; // default 20, max 100
  cursor?: string; // for pagination
}
```

**Returns**:
```typescript
{
  jobs: JobPosting[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

**Features**:
- Cursor-based pagination for efficiency
- Optional status filtering
- Includes hiring manager and recruiter details
- Includes application count via `_count`
- Sorted by creation date (newest first)
- Excludes soft-deleted jobs

**Security**:
- Automatically filters by organizationId
- Only shows jobs from user's organization

---

### 3. `getById` - Get Single Job Posting

**Type**: Query (requires authentication)

**Input**:
```typescript
{
  id: string; // CUID
}
```

**Returns**: Complete job posting with relations

**Features**:
- Full job details
- Hiring manager and recruiter info
- Application count
- All pipeline stages

**Security**:
- Validates organizationId matches
- Throws FORBIDDEN if cross-tenant access attempted
- Throws NOT_FOUND if job doesn't exist

---

### 4. `update` - Update Job Posting

**Type**: Mutation (requires authentication)

**Input**:
```typescript
{
  id: string;
  // All other fields optional (partial update)
  title?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'closed' | 'cancelled';
  // ... etc
}
```

**Returns**: Updated job posting with relations

**Features**:
- Partial updates supported
- Validates salary range if both provided
- Verifies hiring manager/recruiter if updated
- Returns updated job with relations

**Security**:
- Validates job belongs to organization
- Only allows updates within same org

---

### 5. `delete` - Soft Delete Job Posting

**Type**: Mutation (requires authentication)

**Input**:
```typescript
{
  id: string;
}
```

**Returns**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Features**:
- Soft delete (sets deletedAt timestamp)
- Also sets status to 'cancelled'
- Preserves data for audit trail
- Can be restored by clearing deletedAt

**Security**:
- Validates organizationId matches
- Prevents deletion of other org's jobs

---

### 6. `publish` - Publish Job Posting

**Type**: Mutation (requires authentication)

**Input**:
```typescript
{
  id: string;
  distributeTo?: ('linkedin' | 'indeed' | 'ziprecruiter')[];
}
```

**Returns**:
```typescript
{
  success: boolean;
  message: string;
  job: JobPosting;
}
```

**Features**:
- Sets isPublished = true
- Records publishedAt timestamp
- Updates distributedTo array
- Changes status to 'active'
- Validates job is publishable (has title, description, not deleted)

**Security**:
- Validates organizationId matches
- Only allows publishing own org's jobs

---

### 7. `incrementViews` - Track Job Views

**Type**: Mutation (**PUBLIC** - no auth required)

**Input**:
```typescript
{
  id?: string;
  slug?: string;
  // Must provide either id or slug
}
```

**Returns**:
```typescript
{
  success: boolean;
  viewCount: number;
}
```

**Features**:
- Accepts ID or slug for flexibility
- Only increments for published jobs
- Atomic increment operation
- Useful for analytics and tracking

**Security**:
- Public procedure (no authentication)
- Only works on published jobs
- Read-only except for view counter

---

### 8. `getBySlug` - Get Job by Slug (Public Career Pages)

**Type**: Query (**PUBLIC** - no auth required)

**Input**:
```typescript
{
  slug: string;
}
```

**Returns**: Job posting with organization info

**Features**:
- SEO-friendly URL access
- Includes organization details (name, logo, website)
- Includes hiring manager (limited info)
- Application count
- Only returns published jobs
- Checks expiration date

**Security**:
- Public procedure
- Only returns published jobs
- Returns NOT_FOUND for unpublished jobs
- Returns BAD_REQUEST for expired jobs

---

## Default Pipeline Stages

Every new job posting is initialized with these 5 default pipeline stages:

```typescript
[
  { id: 'applied', name: 'Applied', order: 0, type: 'screening' },
  { id: 'screening', name: 'Screening', order: 1, type: 'screening' },
  { id: 'interview', name: 'Interview', order: 2, type: 'interview' },
  { id: 'offer', name: 'Offer', order: 3, type: 'offer' },
  { id: 'hired', name: 'Hired', order: 4, type: 'hired' }
]
```

These stages can be customized after creation through the update procedure.

---

## Slug Generation

Job posting slugs are automatically generated using this algorithm:

```typescript
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
    + '-' + Math.random().toString(36).substr(2, 6) // Add random suffix
  );
}
```

**Example**: "Senior CPA - Tax Specialist" → "senior-cpa-tax-specialist-a8k3m2"

---

## Error Handling

All procedures implement comprehensive error handling:

### Common Error Codes

| Code | When | Example |
|------|------|---------|
| `UNAUTHORIZED` | User not authenticated | Missing or invalid session |
| `FORBIDDEN` | Cross-tenant access attempt | Accessing job from different org |
| `NOT_FOUND` | Resource doesn't exist | Job ID not found |
| `BAD_REQUEST` | Invalid input data | Salary min > max, missing required fields |

### Example Error Responses

```typescript
// NOT_FOUND
{
  code: 'NOT_FOUND',
  message: 'Job posting not found'
}

// FORBIDDEN
{
  code: 'FORBIDDEN',
  message: 'Not authorized to access this job posting'
}

// BAD_REQUEST
{
  code: 'BAD_REQUEST',
  message: 'Minimum salary cannot be greater than maximum salary'
}
```

---

## Multi-Tenant Security

All authenticated procedures automatically enforce multi-tenant isolation:

1. **organizationId Filtering**: All queries automatically filter by `ctx.organizationId`
2. **Creation**: New jobs automatically set `organizationId` from context
3. **Updates**: Validates existing job belongs to user's organization
4. **Cross-Tenant Protection**: FORBIDDEN error thrown on cross-tenant access
5. **Team Member Validation**: Hiring managers/recruiters must belong to organization

---

## Usage Examples

See `jobPosting.router.example.ts` for 9 comprehensive usage examples including:

1. Creating job postings
2. Listing with infinite scroll pagination
3. Getting job details
4. Updating jobs
5. Publishing to job boards
6. Soft deleting
7. Public career page integration
8. View tracking
9. Complete workflow (create → update → publish)

---

## Database Schema Reference

The JobPosting model includes these key fields:

```prisma
model JobPosting {
  id              String    @id @default(cuid())
  organizationId  String    // Multi-tenant key

  // Job Details
  title           String
  department      String?
  location        String?
  employmentType  String
  experienceLevel String
  description     String    @db.Text
  responsibilities String[]
  requirements    String[]
  preferredSkills String[]

  // Compensation
  salaryMin       Decimal?  @db.Decimal(10, 2)
  salaryMax       Decimal?  @db.Decimal(10, 2)
  compensationType String?
  benefits        String[]

  // Status
  status          String    @default("draft")
  priority        String    @default("normal")
  openings        Int       @default(1)
  filledCount     Int       @default(0)

  // Team
  hiringManagerId String?
  hiringManager   User?
  recruiterId     String?
  recruiter       User?

  // Pipeline
  pipelineStages  Json

  // Publishing
  isPublished     Boolean   @default(false)
  publishedAt     DateTime?
  expiresAt       DateTime?
  slug            String    @unique

  // Distribution
  distributedTo   String[]
  linkedinJobId   String?
  indeedJobId     String?
  zipRecruiterJobId String?

  // Analytics
  viewCount       Int       @default(0)
  applicationCount Int      @default(0)

  // Audit
  createdBy       String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
}
```

---

## Frontend Integration

The router is accessible via tRPC client:

```typescript
import { api } from '@/utils/api';

// React Query hooks auto-generated
const { data, isLoading } = api.jobPosting.list.useQuery({ status: 'active' });
const createMutation = api.jobPosting.create.useMutation();
```

TypeScript types are automatically inferred from the router:

```typescript
import type { RouterOutputs } from '@/utils/api';

type JobPosting = RouterOutputs['jobPosting']['getById'];
type JobList = RouterOutputs['jobPosting']['list'];
```

---

## Testing Recommendations

### Unit Tests
- Test slug generation uniqueness
- Validate Zod schema edge cases
- Test salary range validation

### Integration Tests
- Multi-tenant isolation
- CRUD operations
- Error handling
- Authorization checks

### E2E Tests
- Complete job posting workflow
- Career page public access
- View tracking
- Job board distribution

---

## Performance Considerations

1. **Pagination**: Uses cursor-based pagination for efficient large dataset handling
2. **Soft Delete**: Maintains data integrity and audit trail
3. **Indexed Fields**: Status, slug, organizationId should be indexed
4. **Select Fields**: Consider using Prisma `select` for large lists
5. **Caching**: Public procedures (getBySlug) are good candidates for caching

---

## Future Enhancements

Potential features for future development:

- [ ] Search and filtering (by keywords, tags, location)
- [ ] Bulk operations (bulk publish, bulk status update)
- [ ] Job posting templates
- [ ] Approval workflow for publishing
- [ ] Integration with actual job board APIs (LinkedIn, Indeed)
- [ ] AI-powered job description generation
- [ ] Candidate matching algorithms
- [ ] Email notifications on status changes
- [ ] Job posting analytics dashboard
- [ ] Duplicate job posting detection

---

## Related Files

- **Router**: `apps/web/src/server/api/routers/jobPosting.router.ts`
- **Root Router**: `apps/web/src/server/api/root.ts` (registered as `jobPosting`)
- **Examples**: `apps/web/src/server/api/routers/jobPosting.router.example.ts`
- **Schema**: `apps/web/prisma/schema.prisma` (JobPosting model)
- **tRPC Setup**: `apps/web/src/server/api/trpc.ts`

---

## Support

For questions or issues with the Job Posting router:

1. Check the examples in `jobPosting.router.example.ts`
2. Review the error messages (they're designed to be helpful)
3. Verify multi-tenant isolation is working correctly
4. Check Prisma schema matches expected fields
5. Ensure proper authentication and organization context

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
**Status**: Production Ready ✅