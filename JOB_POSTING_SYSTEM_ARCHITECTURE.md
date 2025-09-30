# Job Posting Management System - Complete Architecture Design

## Executive Summary

This document provides a comprehensive, production-ready architecture for AdvisorOS's Job Posting Management System with multi-channel distribution, AI-powered resume parsing, and applicant tracking capabilities.

**Key Features:**
- Multi-channel job distribution (LinkedIn, Indeed, ZipRecruiter)
- AI-powered resume parsing using Azure Form Recognizer
- Drag-and-drop applicant pipeline management
- Multi-tenant architecture with organization isolation
- Comprehensive security and compliance (SOX, GDPR)
- Real-time analytics and reporting

**Technology Stack:**
- Database: PostgreSQL with Prisma ORM
- API: tRPC with Next.js
- AI Services: Azure Form Recognizer, Azure OpenAI
- Background Jobs: Bull queue system
- Frontend: Next.js 15, React 18, TypeScript

---

## 1. Database Schema Design

### 1.1 Core Models Review

The existing schema already includes the foundation models:

**JobPosting** - Core job posting entity
**Candidate** - Applicant profiles
**Application** - Job applications with AI parsing
**ApplicationStage** - Configurable pipeline stages
**Interview** - Interview scheduling and management
**CandidateCommunication** - Communication tracking
**CandidateActivity** - Candidate engagement tracking
**ApplicationActivity** - Application history and audit trail

### 1.2 Additional Required Models

#### IntegrationSyncLog Model

```prisma
model IntegrationSyncLog {
  id String @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Integration Details
  integrationType String // "linkedin", "indeed", "ziprecruiter"
  jobPostingId    String?
  jobPosting      JobPosting? @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)

  // Sync Operation
  operation    String // "create", "update", "delete", "sync_applications"
  status       String @default("pending") // "pending", "processing", "completed", "failed", "partial"
  direction    String // "outbound" (post to platform), "inbound" (fetch applications)

  // External Reference
  externalJobId      String? // Job ID on external platform
  externalPlatformId String? // Platform-specific organization/company ID

  // Sync Results
  recordsProcessed Int      @default(0)
  recordsSucceeded Int      @default(0)
  recordsFailed    Int      @default(0)
  errorMessage     String?  @db.Text
  errorDetails     Json?    // Detailed error information

  // Request/Response Data
  requestPayload  Json? // Data sent to integration
  responsePayload Json? // Response from integration

  // Timing
  startedAt   DateTime?
  completedAt DateTime?
  duration    Int? // Milliseconds

  // Retry Logic
  retryCount    Int       @default(0)
  maxRetries    Int       @default(3)
  nextRetryAt   DateTime?
  lastError     String?   @db.Text

  // Rate Limiting
  rateLimitRemaining Int?
  rateLimitReset     DateTime?

  // Metadata
  metadata   Json?
  createdBy  String?
  deletedAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([organizationId])
  @@index([integrationType])
  @@index([jobPostingId])
  @@index([status])
  @@index([operation])
  @@index([startedAt])
  @@index([nextRetryAt])
  @@map("integration_sync_logs")
}
```

#### IntegrationCredential Model

```prisma
model IntegrationCredential {
  id String @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Integration Details
  integrationType String // "linkedin", "indeed", "ziprecruiter"
  isActive        Boolean @default(true)
  isVerified      Boolean @default(false)
  verifiedAt      DateTime?

  // Authentication
  authType      String // "oauth2", "api_key", "basic_auth"
  accessToken   String? @db.Text // Encrypted
  refreshToken  String? @db.Text // Encrypted
  apiKey        String? @db.Text // Encrypted
  apiSecret     String? @db.Text // Encrypted
  expiresAt     DateTime?

  // Platform-Specific IDs
  companyId     String? // Platform company/organization ID
  accountId     String? // Platform account ID
  clientId      String? // OAuth client ID

  // Configuration
  settings Json? // Platform-specific settings

  // Rate Limiting
  rateLimit      Int? // Requests per window
  rateLimitWindow Int? // Window in seconds

  // Health Check
  lastSyncAt     DateTime?
  lastHealthCheck DateTime?
  healthStatus    String @default("unknown") // "healthy", "degraded", "failed", "unknown"

  // Metadata
  metadata   Json?
  createdBy  String
  updatedBy  String?
  deletedAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([organizationId, integrationType])
  @@index([organizationId])
  @@index([integrationType])
  @@index([isActive])
  @@index([expiresAt])
  @@map("integration_credentials")
}
```

#### ResumeParseResult Model

```prisma
model ResumeParseResult {
  id String @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Core Relationships
  applicationId String    @unique
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  candidateId   String
  candidate     Candidate   @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  // Parsing Status
  status     String    @default("pending") // "pending", "processing", "completed", "failed", "manual_review"
  parseType  String    @default("automatic") // "automatic", "manual", "hybrid"
  parsedAt   DateTime?
  reviewedAt DateTime?
  reviewedBy String?

  // Azure Form Recognizer Data
  modelId      String? // Form Recognizer model ID used
  confidence   Float?  // Overall confidence score 0-1
  rawData      Json?   @db.JsonB // Raw Azure response

  // Extracted Personal Information
  fullName       String?
  email          String?
  phone          String?
  address        Json? // Structured address data
  linkedinUrl    String?
  portfolioUrl   String?
  githubUrl      String?
  personalWebsite String?

  // Professional Summary
  summary      String? @db.Text
  objective    String? @db.Text
  yearsExp     Int?
  currentTitle String?

  // Work Experience (Structured)
  workExperience Json? @db.JsonB
  /* Structure:
  [
    {
      company: string,
      title: string,
      location: string,
      startDate: date,
      endDate: date | null,
      isCurrent: boolean,
      description: string,
      achievements: string[],
      confidence: float
    }
  ]
  */

  // Education (Structured)
  education Json? @db.JsonB
  /* Structure:
  [
    {
      institution: string,
      degree: string,
      field: string,
      graduationDate: date,
      gpa: float,
      honors: string[],
      confidence: float
    }
  ]
  */

  // Skills Extraction
  technicalSkills String[] // Programming languages, tools, technologies
  softSkills      String[] // Communication, leadership, etc.
  certifications  Json? @db.JsonB
  /* Structure:
  [
    {
      name: string,
      issuer: string,
      issueDate: date,
      expiryDate: date | null,
      credentialId: string,
      confidence: float
    }
  ]
  */

  // Languages
  languages Json? @db.JsonB
  /* Structure:
  [
    {
      language: string,
      proficiency: string, // "native", "fluent", "professional", "basic"
      confidence: float
    }
  ]
  */

  // Achievements & Awards
  achievements String[]
  publications String[]
  patents      String[]

  // AI-Enhanced Analysis
  aiSummary          String? @db.Text // AI-generated professional summary
  aiSkillsAnalysis   Json? // AI skill categorization and gaps
  aiCareerTrajectory String? @db.Text // AI analysis of career progression
  aiStrengths        String[]
  aiWeaknesses       String[]
  aiRecommendations  String[] // Recommendations for role fit

  // Keyword Matching
  jobKeywordMatches Int      @default(0) // Number of job keywords found
  matchedKeywords   String[] // Specific keywords matched
  missingKeywords   String[] // Important keywords not found

  // Quality Metrics
  completeness     Float? // 0-1 score for resume completeness
  formatQuality    Float? // 0-1 score for formatting quality
  contentQuality   Float? // 0-1 score for content quality
  overallScore     Float? // 0-100 aggregate score

  // Parsing Metadata
  fileName         String?
  fileSize         Int?
  pageCount        Int?
  parsingDuration  Int? // Milliseconds
  errorMessage     String? @db.Text
  warningMessages  String[]

  // Manual Corrections
  manualCorrections Json? // Track manual edits made to parsed data
  correctionCount   Int   @default(0)

  // Metadata
  metadata  Json?
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([applicationId])
  @@index([candidateId])
  @@index([status])
  @@index([parsedAt])
  @@index([confidence])
  @@index([overallScore])
  @@map("resume_parse_results")
}
```

#### JobBoardTemplate Model

```prisma
model JobBoardTemplate {
  id String @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Template Details
  name             String
  description      String? @db.Text
  boardType        String // "linkedin", "indeed", "ziprecruiter", "custom"
  isSystemTemplate Boolean @default(false)
  isActive         Boolean @default(true)

  // Template Content
  titleTemplate        String? @db.Text
  descriptionTemplate  String? @db.Text
  requirementsTemplate String? @db.Text
  benefitsTemplate     String? @db.Text

  // Field Mappings
  fieldMappings Json // Maps AdvisorOS fields to board-specific fields

  // Board-Specific Settings
  categoryMapping   Json? // Job category mappings
  experienceMapping Json? // Experience level mappings
  locationMapping   Json? // Location format mappings

  // Posting Rules
  autoPublish        Boolean @default(false)
  requiresApproval   Boolean @default(true)
  expirationDays     Int?    @default(30)
  autoRenew          Boolean @default(false)
  maxApplications    Int?

  // Budget & Cost
  costPerPosting Decimal? @db.Decimal(8, 2)
  currency       String   @default("USD")
  budgetAlert    Decimal? @db.Decimal(10, 2)

  // Usage Statistics
  timesUsed        Int      @default(0)
  totalCost        Decimal? @db.Decimal(10, 2)
  avgApplications  Float?
  avgTimeToFill    Int? // Days

  // Metadata
  metadata   Json?
  createdBy  String
  updatedBy  String?
  deletedAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
  @@index([boardType])
  @@index([isActive])
  @@index([isSystemTemplate])
  @@map("job_board_templates")
}
```

### 1.3 Schema Enhancements to Existing Models

#### JobPosting Enhancements

Add to existing JobPosting model:

```prisma
// Add these fields to JobPosting model

// Distribution Status
distributionStatus     String @default("not_distributed") // "not_distributed", "pending", "distributing", "distributed", "failed"
lastDistributionAttempt DateTime?
distributionErrors     Json? // Errors from each platform

// Sync Configuration
autoSync          Boolean @default(true) // Automatically sync applications
syncFrequency     Int     @default(60) // Minutes between syncs
lastSyncAt        DateTime?
nextSyncAt        DateTime?

// Application Sources
applicationSources Json?
/* Structure:
{
  linkedin: { count: 10, lastSyncAt: datetime },
  indeed: { count: 25, lastSyncAt: datetime },
  ziprecruiter: { count: 8, lastSyncAt: datetime },
  direct: { count: 15, lastSyncAt: datetime }
}
*/

// AI Configuration
aiScreeningEnabled   Boolean @default(false)
aiScreeningCriteria  Json? // Criteria for AI screening
minAiScore           Float?  @default(60) // Minimum AI score to pass
autoRejectBelowScore Boolean @default(false)

// Relations
syncLogs    IntegrationSyncLog[]
```

#### Application Enhancements

Add to existing Application model:

```prisma
// Add these fields to Application model

// Source Tracking
externalApplicationId String? // ID from external platform
externalPlatformUrl   String? // Direct link to application on platform
platformMetadata      Json? // Platform-specific data

// AI Screening Details
aiScreeningVersion String? // Version of AI model used
aiProcessedAt      DateTime?
aiReviewNeeded     Boolean @default(false)

// Relations
parseResult ResumeParseResult?
```

### 1.4 Database Indexes Strategy

#### Performance-Critical Indexes

```sql
-- JobPosting indexes for distribution
CREATE INDEX CONCURRENTLY idx_job_postings_distribution_status
  ON job_postings(organization_id, distribution_status, updated_at);

CREATE INDEX CONCURRENTLY idx_job_postings_sync_schedule
  ON job_postings(organization_id, next_sync_at)
  WHERE auto_sync = true AND status = 'active';

-- IntegrationSyncLog indexes for monitoring
CREATE INDEX CONCURRENTLY idx_integration_sync_retry
  ON integration_sync_logs(organization_id, status, next_retry_at)
  WHERE status = 'failed' AND retry_count < max_retries;

CREATE INDEX CONCURRENTLY idx_integration_sync_recent
  ON integration_sync_logs(organization_id, integration_type, started_at DESC);

-- Application indexes for pipeline optimization
CREATE INDEX CONCURRENTLY idx_applications_pipeline_performance
  ON applications(organization_id, status, current_stage_id, days_in_current_stage);

CREATE INDEX CONCURRENTLY idx_applications_ai_screening
  ON applications(organization_id, ai_screening_score DESC, parsing_status)
  WHERE status = 'new' OR status = 'screening';

-- ResumeParseResult indexes for search
CREATE INDEX CONCURRENTLY idx_resume_parse_skills
  ON resume_parse_results USING GIN (technical_skills);

CREATE INDEX CONCURRENTLY idx_resume_parse_quality
  ON resume_parse_results(organization_id, overall_score DESC, confidence DESC)
  WHERE status = 'completed';

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_job_postings_search
  ON job_postings USING GIN (to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY idx_candidates_search
  ON candidates USING GIN (
    to_tsvector('english',
      COALESCE(first_name, '') || ' ' ||
      COALESCE(last_name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(summary, '')
    )
  );
```

#### Composite Indexes for Multi-Tenant Queries

```sql
-- Multi-tenant isolation with filtering
CREATE INDEX CONCURRENTLY idx_applications_org_status_stage
  ON applications(organization_id, status, current_stage_id, application_date DESC);

CREATE INDEX CONCURRENTLY idx_interviews_org_status_scheduled
  ON interviews(organization_id, status, scheduled_at)
  WHERE status IN ('scheduled', 'confirmed');

-- Pipeline analytics
CREATE INDEX CONCURRENTLY idx_application_stages_analytics
  ON application_stages(organization_id, type, order, is_active)
  WHERE is_active = true;

-- Integration health monitoring
CREATE INDEX CONCURRENTLY idx_integration_credentials_health
  ON integration_credentials(organization_id, integration_type, health_status, last_health_check);
```

### 1.5 Database Constraints and Triggers

#### Data Integrity Constraints

```sql
-- Ensure salary ranges are valid
ALTER TABLE job_postings
  ADD CONSTRAINT chk_salary_range
  CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min);

-- Ensure interview times are valid
ALTER TABLE interviews
  ADD CONSTRAINT chk_interview_time
  CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time);

-- Ensure confidence scores are valid (0-1)
ALTER TABLE resume_parse_results
  ADD CONSTRAINT chk_confidence_range
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));

-- Ensure AI screening scores are valid (0-100)
ALTER TABLE applications
  ADD CONSTRAINT chk_ai_score_range
  CHECK (ai_screening_score IS NULL OR (ai_screening_score >= 0 AND ai_screening_score <= 100));

-- Ensure retry counts don't exceed max
ALTER TABLE integration_sync_logs
  ADD CONSTRAINT chk_retry_count
  CHECK (retry_count <= max_retries);
```

#### Audit Triggers

```sql
-- Update application days in pipeline
CREATE OR REPLACE FUNCTION update_application_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days_in_pipeline = EXTRACT(DAY FROM NOW() - NEW.application_date)::INT;

  IF NEW.current_stage_id IS NOT NULL AND
     (OLD.current_stage_id IS NULL OR NEW.current_stage_id != OLD.current_stage_id) THEN
    NEW.days_in_current_stage = 0;
  ELSIF NEW.current_stage_id IS NOT NULL THEN
    NEW.days_in_current_stage = EXTRACT(DAY FROM NOW() -
      (NEW.stage_history->-1->>'timestamp')::TIMESTAMP)::INT;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_application_days
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_days();

-- Track stage history
CREATE OR REPLACE FUNCTION track_application_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stage_id IS DISTINCT FROM OLD.current_stage_id THEN
    -- Append to stage history
    NEW.stage_history = jsonb_insert(
      COALESCE(NEW.stage_history, '[]'::jsonb),
      '{-1}',
      jsonb_build_object(
        'stage_id', NEW.current_stage_id,
        'stage_name', (SELECT name FROM application_stages WHERE id = NEW.current_stage_id),
        'timestamp', NOW(),
        'changed_by', current_setting('app.user_id', true)
      )
    );

    -- Create activity record
    INSERT INTO application_activities (
      id,
      organization_id,
      application_id,
      activity_type,
      description,
      changes,
      performed_by,
      performed_at,
      created_at
    ) VALUES (
      gen_random_uuid(),
      NEW.organization_id,
      NEW.id,
      'stage_changed',
      'Application stage changed',
      jsonb_build_object(
        'from_stage_id', OLD.current_stage_id,
        'to_stage_id', NEW.current_stage_id
      ),
      current_setting('app.user_id', true),
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_track_stage_change
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION track_application_stage_change();

-- Update job posting application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE job_postings
    SET application_count = application_count + 1,
        updated_at = NOW()
    WHERE id = NEW.job_posting_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE job_postings
    SET application_count = GREATEST(0, application_count - 1),
        updated_at = NOW()
    WHERE id = OLD.job_posting_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_job_app_count
  AFTER INSERT OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_count();

-- Encrypt sensitive credential data
CREATE OR REPLACE FUNCTION encrypt_credentials()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pgcrypto extension for encryption
  IF NEW.access_token IS NOT NULL AND NEW.access_token != OLD.access_token THEN
    NEW.access_token = encode(encrypt(NEW.access_token::bytea,
      current_setting('app.encryption_key'), 'aes'), 'base64');
  END IF;

  IF NEW.refresh_token IS NOT NULL AND NEW.refresh_token != OLD.refresh_token THEN
    NEW.refresh_token = encode(encrypt(NEW.refresh_token::bytea,
      current_setting('app.encryption_key'), 'aes'), 'base64');
  END IF;

  IF NEW.api_key IS NOT NULL AND NEW.api_key != OLD.api_key THEN
    NEW.api_key = encode(encrypt(NEW.api_key::bytea,
      current_setting('app.encryption_key'), 'aes'), 'base64');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_encrypt_credentials
  BEFORE INSERT OR UPDATE ON integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_credentials();
```

### 1.6 Partitioning Strategy for Scale

For large deployments with millions of applications:

```sql
-- Partition IntegrationSyncLog by month
CREATE TABLE integration_sync_logs (
  -- ... columns ...
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE integration_sync_logs_2025_01
  PARTITION OF integration_sync_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Automate partition creation with pg_partman extension

-- Partition Application by organization for multi-tenant isolation
-- (Consider this for very large installations)
CREATE TABLE applications (
  -- ... columns ...
) PARTITION BY LIST (organization_id);

-- Create per-organization partitions for largest tenants
-- Keep smaller tenants in a default partition
```

---

## 2. API Architecture

### 2.1 tRPC Router Structure

#### File: `apps/web/src/server/api/routers/jobPosting.router.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, adminProcedure, createRoleProcedure } from '@/server/api/trpc';
import { JobPostingService } from '@/server/services/jobPosting.service';
import {
  createJobPostingSchema,
  updateJobPostingSchema,
  publishJobPostingSchema,
  distributeJobPostingSchema,
  searchJobPostingsSchema,
  jobPostingFiltersSchema,
} from '@/lib/validations/jobPosting';

// Role-based procedures
const recruiterProcedure = createRoleProcedure(['owner', 'admin', 'recruiter', 'hiring_manager']);
const hiringManagerProcedure = createRoleProcedure(['owner', 'admin', 'hiring_manager']);

export const jobPostingRouter = createTRPCRouter({
  /**
   * Create new job posting (Draft)
   */
  create: recruiterProcedure
    .input(createJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.createJobPosting(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Update job posting
   */
  update: recruiterProcedure
    .input(updateJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.updateJobPosting(
        ctx.organizationId,
        input.id,
        input.data,
        ctx.userId
      );
    }),

  /**
   * Delete job posting (soft delete)
   */
  delete: hiringManagerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.deleteJobPosting(
        ctx.organizationId,
        input.id,
        ctx.userId
      );
    }),

  /**
   * Get job posting by ID
   */
  getById: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await JobPostingService.getJobPostingById(
        ctx.organizationId,
        input.id
      );
    }),

  /**
   * Get job posting by slug (public)
   */
  getBySlug: organizationProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return await JobPostingService.getJobPostingBySlug(
        ctx.organizationId,
        input.slug
      );
    }),

  /**
   * List job postings with pagination and filtering
   */
  list: organizationProcedure
    .input(jobPostingFiltersSchema)
    .query(async ({ ctx, input }) => {
      return await JobPostingService.listJobPostings(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Search job postings (full-text search)
   */
  search: organizationProcedure
    .input(searchJobPostingsSchema)
    .query(async ({ ctx, input }) => {
      return await JobPostingService.searchJobPostings(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Publish job posting
   */
  publish: recruiterProcedure
    .input(publishJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.publishJobPosting(
        ctx.organizationId,
        input.id,
        ctx.userId
      );
    }),

  /**
   * Unpublish job posting
   */
  unpublish: recruiterProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.unpublishJobPosting(
        ctx.organizationId,
        input.id,
        ctx.userId
      );
    }),

  /**
   * Close job posting
   */
  close: hiringManagerProcedure
    .input(z.object({
      id: z.string().cuid(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.closeJobPosting(
        ctx.organizationId,
        input.id,
        ctx.userId,
        input.reason
      );
    }),

  /**
   * Distribute job posting to external platforms
   */
  distribute: recruiterProcedure
    .input(distributeJobPostingSchema)
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.distributeJobPosting(
        ctx.organizationId,
        input.jobPostingId,
        input.platforms,
        ctx.userId
      );
    }),

  /**
   * Remove job from external platforms
   */
  removeFromPlatforms: recruiterProcedure
    .input(z.object({
      id: z.string().cuid(),
      platforms: z.array(z.enum(['linkedin', 'indeed', 'ziprecruiter'])),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.removeFromPlatforms(
        ctx.organizationId,
        input.id,
        input.platforms,
        ctx.userId
      );
    }),

  /**
   * Sync applications from external platforms
   */
  syncApplications: recruiterProcedure
    .input(z.object({
      id: z.string().cuid(),
      platforms: z.array(z.enum(['linkedin', 'indeed', 'ziprecruiter'])).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.syncApplications(
        ctx.organizationId,
        input.id,
        input.platforms,
        ctx.userId
      );
    }),

  /**
   * Get distribution status
   */
  getDistributionStatus: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await JobPostingService.getDistributionStatus(
        ctx.organizationId,
        input.id
      );
    }),

  /**
   * Get analytics for job posting
   */
  getAnalytics: organizationProcedure
    .input(z.object({
      id: z.string().cuid(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await JobPostingService.getJobAnalytics(
        ctx.organizationId,
        input.id,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Get job posting statistics
   */
  getStats: organizationProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await JobPostingService.getOrganizationStats(
        ctx.organizationId,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Duplicate job posting
   */
  duplicate: recruiterProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.duplicateJobPosting(
        ctx.organizationId,
        input.id,
        ctx.userId
      );
    }),

  /**
   * Update pipeline stages for job
   */
  updatePipelineStages: hiringManagerProcedure
    .input(z.object({
      id: z.string().cuid(),
      stages: z.array(z.object({
        name: z.string(),
        order: z.number(),
        type: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      return await JobPostingService.updatePipelineStages(
        ctx.organizationId,
        input.id,
        input.stages,
        ctx.userId
      );
    }),
});
```

#### File: `apps/web/src/server/api/routers/application.router.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, publicProcedure, createRoleProcedure } from '@/server/api/trpc';
import { ApplicationService } from '@/server/services/application.service';
import {
  createApplicationSchema,
  updateApplicationSchema,
  moveApplicationStageSchema,
  bulkMoveApplicationsSchema,
  rateApplicationSchema,
  rejectApplicationSchema,
  searchApplicationsSchema,
  applicationFiltersSchema,
} from '@/lib/validations/application';

const recruiterProcedure = createRoleProcedure(['owner', 'admin', 'recruiter', 'hiring_manager']);

export const applicationRouter = createTRPCRouter({
  /**
   * Submit application (Public endpoint for applicants)
   */
  submit: publicProcedure
    .input(createApplicationSchema)
    .mutation(async ({ input }) => {
      return await ApplicationService.submitApplication(input);
    }),

  /**
   * Get application by ID
   */
  getById: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getApplicationById(
        ctx.organizationId,
        input.id
      );
    }),

  /**
   * List applications with filtering and pagination
   */
  list: organizationProcedure
    .input(applicationFiltersSchema)
    .query(async ({ ctx, input }) => {
      return await ApplicationService.listApplications(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Search applications (full-text search)
   */
  search: organizationProcedure
    .input(searchApplicationsSchema)
    .query(async ({ ctx, input }) => {
      return await ApplicationService.searchApplications(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Get applications by job posting
   */
  getByJobPosting: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().cuid(),
      status: z.string().optional(),
      stageId: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getApplicationsByJobPosting(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Move application to different pipeline stage (drag-and-drop)
   */
  moveStage: recruiterProcedure
    .input(moveApplicationStageSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.moveApplicationStage(
        ctx.organizationId,
        input.applicationId,
        input.targetStageId,
        ctx.userId,
        input.notes
      );
    }),

  /**
   * Bulk move applications (select multiple and move)
   */
  bulkMove: recruiterProcedure
    .input(bulkMoveApplicationsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.bulkMoveApplications(
        ctx.organizationId,
        input.applicationIds,
        input.targetStageId,
        ctx.userId,
        input.notes
      );
    }),

  /**
   * Assign application to recruiter/hiring manager
   */
  assign: recruiterProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      assigneeId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.assignApplication(
        ctx.organizationId,
        input.applicationId,
        input.assigneeId,
        ctx.userId
      );
    }),

  /**
   * Rate/evaluate application
   */
  rate: recruiterProcedure
    .input(rateApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.rateApplication(
        ctx.organizationId,
        input.applicationId,
        input.ratings,
        input.notes,
        ctx.userId
      );
    }),

  /**
   * Reject application
   */
  reject: recruiterProcedure
    .input(rejectApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.rejectApplication(
        ctx.organizationId,
        input.applicationId,
        input.reason,
        input.category,
        input.sendEmail,
        ctx.userId
      );
    }),

  /**
   * Withdraw application (by candidate)
   */
  withdraw: publicProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await ApplicationService.withdrawApplication(
        input.applicationId,
        input.reason
      );
    }),

  /**
   * Flag application for review
   */
  flag: recruiterProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.flagApplication(
        ctx.organizationId,
        input.applicationId,
        input.reason,
        ctx.userId
      );
    }),

  /**
   * Get application activity history
   */
  getHistory: organizationProcedure
    .input(z.object({ applicationId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getApplicationHistory(
        ctx.organizationId,
        input.applicationId
      );
    }),

  /**
   * Get resume parse results
   */
  getParseResults: organizationProcedure
    .input(z.object({ applicationId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getResumeParseResults(
        ctx.organizationId,
        input.applicationId
      );
    }),

  /**
   * Manually trigger resume parsing
   */
  parseResume: recruiterProcedure
    .input(z.object({ applicationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.parseResume(
        ctx.organizationId,
        input.applicationId,
        ctx.userId
      );
    }),

  /**
   * Run AI screening on application
   */
  runAiScreening: recruiterProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.runAiScreening(
        ctx.organizationId,
        input.applicationId,
        ctx.userId,
        input.force
      );
    }),

  /**
   * Get pipeline view (kanban board data)
   */
  getPipelineView: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().cuid(),
      filters: z.object({
        search: z.string().optional(),
        assigneeId: z.string().optional(),
        dateRange: z.object({
          start: z.date(),
          end: z.date(),
        }).optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getPipelineView(
        ctx.organizationId,
        input.jobPostingId,
        input.filters
      );
    }),

  /**
   * Get application analytics
   */
  getAnalytics: organizationProcedure
    .input(z.object({
      jobPostingId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ApplicationService.getApplicationAnalytics(
        ctx.organizationId,
        input.jobPostingId,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Export applications to CSV
   */
  export: recruiterProcedure
    .input(z.object({
      jobPostingId: z.string().optional(),
      filters: applicationFiltersSchema.optional(),
      fields: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ApplicationService.exportApplications(
        ctx.organizationId,
        input.jobPostingId,
        input.filters,
        input.fields
      );
    }),
});
```

#### File: `apps/web/src/server/api/routers/integration.router.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, adminProcedure } from '@/server/api/trpc';
import { IntegrationService } from '@/server/services/integration.service';
import {
  createIntegrationCredentialSchema,
  updateIntegrationCredentialSchema,
  testIntegrationSchema,
} from '@/lib/validations/integration';

export const integrationRouter = createTRPCRouter({
  /**
   * Get all integration credentials for organization
   */
  list: organizationProcedure
    .query(async ({ ctx }) => {
      return await IntegrationService.listIntegrations(ctx.organizationId);
    }),

  /**
   * Get specific integration credential
   */
  getById: organizationProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await IntegrationService.getIntegration(
        ctx.organizationId,
        input.id
      );
    }),

  /**
   * Create/connect new integration
   */
  create: adminProcedure
    .input(createIntegrationCredentialSchema)
    .mutation(async ({ ctx, input }) => {
      return await IntegrationService.createIntegration(
        ctx.organizationId,
        input,
        ctx.userId
      );
    }),

  /**
   * Update integration credentials
   */
  update: adminProcedure
    .input(updateIntegrationCredentialSchema)
    .mutation(async ({ ctx, input }) => {
      return await IntegrationService.updateIntegration(
        ctx.organizationId,
        input.id,
        input.data,
        ctx.userId
      );
    }),

  /**
   * Delete integration
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return await IntegrationService.deleteIntegration(
        ctx.organizationId,
        input.id,
        ctx.userId
      );
    }),

  /**
   * Test integration connection
   */
  test: adminProcedure
    .input(testIntegrationSchema)
    .mutation(async ({ ctx, input }) => {
      return await IntegrationService.testIntegration(
        ctx.organizationId,
        input.integrationType,
        input.credentials
      );
    }),

  /**
   * Refresh OAuth token
   */
  refreshToken: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return await IntegrationService.refreshToken(
        ctx.organizationId,
        input.id
      );
    }),

  /**
   * Get integration sync logs
   */
  getSyncLogs: organizationProcedure
    .input(z.object({
      integrationType: z.enum(['linkedin', 'indeed', 'ziprecruiter']).optional(),
      jobPostingId: z.string().optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed', 'partial']).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await IntegrationService.getSyncLogs(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Retry failed sync
   */
  retrySync: organizationProcedure
    .input(z.object({ syncLogId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return await IntegrationService.retrySync(
        ctx.organizationId,
        input.syncLogId,
        ctx.userId
      );
    }),

  /**
   * Get integration health status
   */
  getHealthStatus: organizationProcedure
    .query(async ({ ctx }) => {
      return await IntegrationService.getHealthStatus(ctx.organizationId);
    }),

  /**
   * LinkedIn OAuth callback handler
   */
  linkedinCallback: publicProcedure
    .input(z.object({
      code: z.string(),
      state: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await IntegrationService.handleLinkedInCallback(
        input.code,
        input.state
      );
    }),
});
```

### 2.2 Input Validation Schemas

#### File: `apps/web/src/lib/validations/jobPosting.ts`

```typescript
import { z } from 'zod';

export const createJobPostingSchema = z.object({
  title: z.string().min(3).max(200),
  department: z.string().optional(),
  location: z.string().min(1),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'director', 'executive']),
  description: z.string().min(50),
  responsibilities: z.array(z.string().min(1)).min(1),
  requirements: z.array(z.string().min(1)).min(1),
  preferredSkills: z.array(z.string().min(1)).default([]),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().length(3).default('USD'),
  compensationType: z.enum(['salary', 'hourly', 'commission', 'equity']).optional(),
  benefits: z.array(z.string()).default([]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  openings: z.number().int().positive().default(1),
  hiringManagerId: z.string().cuid().optional(),
  recruiterId: z.string().cuid().optional(),
  pipelineStages: z.array(z.object({
    name: z.string(),
    order: z.number().int(),
    type: z.string(),
  })).optional(),
  isInternal: z.boolean().default(false),
  expiresAt: z.date().optional(),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  applicationDeadline: z.date().optional(),
  customQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'multiselect', 'boolean']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
  requiredDocuments: z.array(z.enum(['resume', 'cover_letter', 'portfolio', 'references'])).default(['resume']),
  allowsRemoteWork: z.boolean().default(false),
  visaSponsorshipAvailable: z.boolean().default(false),
  aiScreeningEnabled: z.boolean().default(false),
  aiScreeningCriteria: z.object({
    minYearsExperience: z.number().int().optional(),
    requiredSkills: z.array(z.string()).optional(),
    preferredSkills: z.array(z.string()).optional(),
    educationLevel: z.enum(['high_school', 'associates', 'bachelors', 'masters', 'phd']).optional(),
    certifications: z.array(z.string()).optional(),
  }).optional(),
  minAiScore: z.number().min(0).max(100).default(60),
}).refine(data => {
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMax >= data.salaryMin;
  }
  return true;
}, {
  message: 'Salary maximum must be greater than or equal to minimum',
  path: ['salaryMax'],
});

export const updateJobPostingSchema = z.object({
  id: z.string().cuid(),
  data: createJobPostingSchema.partial(),
});

export const publishJobPostingSchema = z.object({
  id: z.string().cuid(),
});

export const distributeJobPostingSchema = z.object({
  jobPostingId: z.string().cuid(),
  platforms: z.array(z.enum(['linkedin', 'indeed', 'ziprecruiter'])).min(1),
  customSettings: z.record(z.any()).optional(),
});

export const jobPostingFiltersSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'closed', 'filled', 'cancelled']).optional(),
  employmentType: z.array(z.string()).optional(),
  experienceLevel: z.array(z.string()).optional(),
  department: z.string().optional(),
  hiringManagerId: z.string().cuid().optional(),
  recruiterId: z.string().cuid().optional(),
  isPublished: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sortBy: z.enum(['createdAt', 'publishedAt', 'applicationCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchJobPostingsSchema = z.object({
  query: z.string().min(1),
  filters: jobPostingFiltersSchema.omit({ search: true }).optional(),
});

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
export type PublishJobPostingInput = z.infer<typeof publishJobPostingSchema>;
export type DistributeJobPostingInput = z.infer<typeof distributeJobPostingSchema>;
export type JobPostingFilters = z.infer<typeof jobPostingFiltersSchema>;
export type SearchJobPostingsInput = z.infer<typeof searchJobPostingsSchema>;
```

#### File: `apps/web/src/lib/validations/application.ts`

```typescript
import { z } from 'zod';

export const createApplicationSchema = z.object({
  jobPostingId: z.string().cuid(),
  candidate: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedinUrl: z.string().url().optional(),
    portfolioUrl: z.string().url().optional(),
    summary: z.string().optional(),
  }),
  resumeUrl: z.string().url(),
  coverLetter: z.string().optional(),
  coverLetterUrl: z.string().url().optional(),
  customAnswers: z.record(z.string(), z.any()).optional(),
  appliedVia: z.enum(['career_site', 'linkedin', 'indeed', 'ziprecruiter', 'referral', 'direct']).default('career_site'),
  referralSource: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  id: z.string().cuid(),
  data: z.object({
    status: z.enum(['new', 'screening', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn']).optional(),
    currentStageId: z.string().cuid().optional(),
    assignedToId: z.string().cuid().optional(),
    notes: z.string().optional(),
    nextFollowUpDate: z.date().optional(),
    isFlagged: z.boolean().optional(),
    flagReason: z.string().optional(),
  }),
});

export const moveApplicationStageSchema = z.object({
  applicationId: z.string().cuid(),
  targetStageId: z.string().cuid(),
  notes: z.string().optional(),
});

export const bulkMoveApplicationsSchema = z.object({
  applicationIds: z.array(z.string().cuid()).min(1),
  targetStageId: z.string().cuid(),
  notes: z.string().optional(),
});

export const rateApplicationSchema = z.object({
  applicationId: z.string().cuid(),
  ratings: z.object({
    overall: z.number().int().min(1).max(5).optional(),
    technical: z.number().int().min(1).max(5).optional(),
    culturalFit: z.number().int().min(1).max(5).optional(),
  }),
  notes: z.string().optional(),
});

export const rejectApplicationSchema = z.object({
  applicationId: z.string().cuid(),
  reason: z.string().min(1),
  category: z.enum(['qualifications', 'experience', 'location', 'salary', 'culture_fit', 'other']),
  sendEmail: z.boolean().default(true),
  emailTemplate: z.string().optional(),
});

export const applicationFiltersSchema = z.object({
  jobPostingId: z.string().cuid().optional(),
  status: z.array(z.string()).optional(),
  stageId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  appliedVia: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  aiScoreRange: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }).optional(),
  isFlagged: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sortBy: z.enum(['applicationDate', 'aiScreeningScore', 'daysInPipeline', 'daysInCurrentStage']).default('applicationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchApplicationsSchema = z.object({
  query: z.string().min(1),
  filters: applicationFiltersSchema.omit({ search: true }).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type MoveApplicationStageInput = z.infer<typeof moveApplicationStageSchema>;
export type BulkMoveApplicationsInput = z.infer<typeof bulkMoveApplicationsSchema>;
export type RateApplicationInput = z.infer<typeof rateApplicationSchema>;
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;
export type ApplicationFilters = z.infer<typeof applicationFiltersSchema>;
export type SearchApplicationsInput = z.infer<typeof searchApplicationsSchema>;
```

---

## 3. Service Layer Architecture

### 3.1 JobPostingService

#### File: `apps/web/src/server/services/jobPosting.service.ts`

```typescript
import { PrismaClient, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import slugify from 'slugify';
import type {
  CreateJobPostingInput,
  JobPostingFilters,
  SearchJobPostingsInput,
} from '@/lib/validations/jobPosting';
import { IntegrationService } from './integration.service';
import { AuditService } from './audit.service';
import { TaskQueueService } from './task-queue.service';

const prisma = new PrismaClient();

export class JobPostingService {
  /**
   * Create new job posting
   */
  static async createJobPosting(
    organizationId: string,
    userId: string,
    data: CreateJobPostingInput
  ) {
    // Generate unique slug
    const slug = await this.generateUniqueSlug(organizationId, data.title);

    // Create default pipeline stages if not provided
    const pipelineStages = data.pipelineStages || this.getDefaultPipelineStages();

    const jobPosting = await prisma.jobPosting.create({
      data: {
        organizationId,
        title: data.title,
        slug,
        department: data.department,
        location: data.location,
        employmentType: data.employmentType,
        experienceLevel: data.experienceLevel,
        description: data.description,
        responsibilities: data.responsibilities,
        requirements: data.requirements,
        preferredSkills: data.preferredSkills,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        compensationType: data.compensationType,
        benefits: data.benefits,
        status: 'draft',
        priority: data.priority,
        openings: data.openings,
        hiringManagerId: data.hiringManagerId,
        recruiterId: data.recruiterId,
        pipelineStages: pipelineStages as any,
        isInternal: data.isInternal,
        expiresAt: data.expiresAt,
        keywords: data.keywords,
        tags: data.tags,
        applicationDeadline: data.applicationDeadline,
        customQuestions: data.customQuestions as any,
        requiredDocuments: data.requiredDocuments,
        allowsRemoteWork: data.allowsRemoteWork,
        visaSponsorshipAvailable: data.visaSponsorshipAvailable,
        aiScreeningEnabled: data.aiScreeningEnabled,
        aiScreeningCriteria: data.aiScreeningCriteria as any,
        minAiScore: data.minAiScore,
        createdBy: userId,
      },
      include: {
        hiringManager: {
          select: { id: true, name: true, email: true },
        },
        recruiter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create application stages for this job
    await this.createApplicationStages(organizationId, pipelineStages);

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.created',
      resourceType: 'job_posting',
      resourceId: jobPosting.id,
      details: { title: data.title },
    });

    return jobPosting;
  }

  /**
   * Update job posting
   */
  static async updateJobPosting(
    organizationId: string,
    jobPostingId: string,
    data: Partial<CreateJobPostingInput>,
    userId: string
  ) {
    // Verify ownership
    const existing = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Update slug if title changed
    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = await this.generateUniqueSlug(organizationId, data.title, jobPostingId);
    }

    const updated = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        ...data,
        slug,
        updatedAt: new Date(),
      },
      include: {
        hiringManager: {
          select: { id: true, name: true, email: true },
        },
        recruiter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.updated',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
      details: { changes: data },
    });

    return updated;
  }

  /**
   * Delete job posting (soft delete)
   */
  static async deleteJobPosting(
    organizationId: string,
    jobPostingId: string,
    userId: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Check if there are active applications
    const activeApplications = await prisma.application.count({
      where: {
        jobPostingId,
        status: { in: ['new', 'screening', 'interviewing', 'offer'] },
      },
    });

    if (activeApplications > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot delete job posting with ${activeApplications} active applications. Please close or reject them first.`,
      });
    }

    // Remove from external platforms if distributed
    if (jobPosting.distributedTo.length > 0) {
      await this.removeFromPlatforms(
        organizationId,
        jobPostingId,
        jobPosting.distributedTo as any,
        userId
      );
    }

    // Soft delete
    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        deletedAt: new Date(),
        status: 'cancelled',
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.deleted',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
    });

    return { success: true };
  }

  /**
   * Get job posting by ID
   */
  static async getJobPostingById(organizationId: string, jobPostingId: string) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: jobPostingId,
        organizationId,
        deletedAt: null,
      },
      include: {
        hiringManager: {
          select: { id: true, name: true, email: true },
        },
        recruiter: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
          },
        },
      },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Increment view count
    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: { viewCount: { increment: 1 } },
    });

    return jobPosting;
  }

  /**
   * Get job posting by slug
   */
  static async getJobPostingBySlug(organizationId: string, slug: string) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        slug,
        organizationId,
        deletedAt: null,
        isPublished: true,
        status: 'active',
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Increment view count
    await prisma.jobPosting.update({
      where: { id: jobPosting.id },
      data: { viewCount: { increment: 1 } },
    });

    return jobPosting;
  }

  /**
   * List job postings with pagination and filtering
   */
  static async listJobPostings(
    organizationId: string,
    filters: JobPostingFilters
  ) {
    const where: Prisma.JobPostingWhereInput = {
      organizationId,
      deletedAt: null,
    };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.employmentType && filters.employmentType.length > 0) {
      where.employmentType = { in: filters.employmentType };
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      where.experienceLevel = { in: filters.experienceLevel };
    }

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.hiringManagerId) {
      where.hiringManagerId = filters.hiringManagerId;
    }

    if (filters.recruiterId) {
      where.recruiterId = filters.recruiterId;
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { has: filters.search } },
      ];
    }

    // Pagination
    const cursorOptions = filters.cursor
      ? { cursor: { id: filters.cursor }, skip: 1 }
      : {};

    const [jobPostings, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        take: filters.limit + 1,
        ...cursorOptions,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        include: {
          hiringManager: {
            select: { id: true, name: true },
          },
          recruiter: {
            select: { id: true, name: true },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    const hasMore = jobPostings.length > filters.limit;
    const results = hasMore ? jobPostings.slice(0, filters.limit) : jobPostings;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return {
      jobPostings: results,
      nextCursor,
      hasMore,
      total,
    };
  }

  /**
   * Search job postings (full-text search)
   */
  static async searchJobPostings(
    organizationId: string,
    input: SearchJobPostingsInput
  ) {
    // Use PostgreSQL full-text search
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        jp.*,
        ts_rank(
          to_tsvector('english', title || ' ' || description),
          plainto_tsquery('english', ${input.query})
        ) as rank
      FROM job_postings jp
      WHERE
        jp.organization_id = ${organizationId}
        AND jp.deleted_at IS NULL
        AND to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ${input.query})
      ORDER BY rank DESC, created_at DESC
      LIMIT ${input.filters?.limit || 50}
    `;

    return { jobPostings: results };
  }

  /**
   * Publish job posting
   */
  static async publishJobPosting(
    organizationId: string,
    jobPostingId: string,
    userId: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    if (jobPosting.status !== 'draft' && jobPosting.status !== 'paused') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Job posting must be in draft or paused status to publish',
      });
    }

    const updated = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        status: 'active',
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.published',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
    });

    return updated;
  }

  /**
   * Unpublish job posting
   */
  static async unpublishJobPosting(
    organizationId: string,
    jobPostingId: string,
    userId: string
  ) {
    const updated = await prisma.jobPosting.update({
      where: {
        id: jobPostingId,
        organizationId,
      },
      data: {
        status: 'paused',
        isPublished: false,
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.unpublished',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
    });

    return updated;
  }

  /**
   * Close job posting
   */
  static async closeJobPosting(
    organizationId: string,
    jobPostingId: string,
    userId: string,
    reason?: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Remove from external platforms if distributed
    if (jobPosting.distributedTo.length > 0) {
      await this.removeFromPlatforms(
        organizationId,
        jobPostingId,
        jobPosting.distributedTo as any,
        userId
      );
    }

    const status = jobPosting.filledCount >= jobPosting.openings ? 'filled' : 'closed';

    const updated = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        status,
        isPublished: false,
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.closed',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
      details: { reason, status },
    });

    return updated;
  }

  /**
   * Distribute job posting to external platforms
   */
  static async distributeJobPosting(
    organizationId: string,
    jobPostingId: string,
    platforms: Array<'linkedin' | 'indeed' | 'ziprecruiter'>,
    userId: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    if (!jobPosting.isPublished) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Job posting must be published before distribution',
      });
    }

    // Update status
    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        distributionStatus: 'distributing',
        lastDistributionAttempt: new Date(),
      },
    });

    // Queue distribution jobs for each platform
    const results: any = {};
    for (const platform of platforms) {
      try {
        const result = await IntegrationService.distributeJobPosting(
          organizationId,
          jobPostingId,
          platform
        );
        results[platform] = result;
      } catch (error: any) {
        results[platform] = { success: false, error: error.message };
      }
    }

    // Update job posting with distribution results
    const successfulPlatforms = Object.keys(results).filter(
      p => results[p].success
    );
    const allSuccessful = successfulPlatforms.length === platforms.length;

    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        distributionStatus: allSuccessful ? 'distributed' : 'failed',
        distributedTo: successfulPlatforms,
        distributedAt: allSuccessful ? new Date() : null,
        distributionErrors: allSuccessful ? null : (results as any),
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.distributed',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
      details: { platforms, results },
    });

    return { success: allSuccessful, results };
  }

  /**
   * Remove job from external platforms
   */
  static async removeFromPlatforms(
    organizationId: string,
    jobPostingId: string,
    platforms: Array<'linkedin' | 'indeed' | 'ziprecruiter'>,
    userId: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Remove from each platform
    const results: any = {};
    for (const platform of platforms) {
      try {
        const result = await IntegrationService.removeJobPosting(
          organizationId,
          jobPostingId,
          platform
        );
        results[platform] = result;
      } catch (error: any) {
        results[platform] = { success: false, error: error.message };
      }
    }

    // Update distributed platforms list
    const remainingPlatforms = jobPosting.distributedTo.filter(
      p => !platforms.includes(p as any)
    );

    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        distributedTo: remainingPlatforms,
        distributionStatus: remainingPlatforms.length > 0 ? 'distributed' : 'not_distributed',
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.removed_from_platforms',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
      details: { platforms, results },
    });

    return { success: true, results };
  }

  /**
   * Sync applications from external platforms
   */
  static async syncApplications(
    organizationId: string,
    jobPostingId: string,
    platforms: Array<'linkedin' | 'indeed' | 'ziprecruiter'> | undefined,
    userId: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Sync from specified platforms or all distributed platforms
    const platformsToSync = platforms || (jobPosting.distributedTo as any[]);

    if (platformsToSync.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Job posting is not distributed to any platforms',
      });
    }

    // Queue sync jobs
    const syncJobIds: string[] = [];
    for (const platform of platformsToSync) {
      const jobId = await TaskQueueService.enqueue({
        queueName: 'integration_sync',
        itemType: 'application_sync',
        entityId: jobPostingId,
        entityType: 'job_posting',
        priority: 50,
        payload: {
          organizationId,
          jobPostingId,
          platform,
        },
      });
      syncJobIds.push(jobId);
    }

    // Update last sync time
    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        lastSyncAt: new Date(),
        nextSyncAt: jobPosting.autoSync
          ? new Date(Date.now() + jobPosting.syncFrequency * 60 * 1000)
          : null,
      },
    });

    return { success: true, syncJobIds };
  }

  /**
   * Get distribution status
   */
  static async getDistributionStatus(
    organizationId: string,
    jobPostingId: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
      select: {
        id: true,
        distributionStatus: true,
        distributedTo: true,
        distributedAt: true,
        lastDistributionAttempt: true,
        distributionErrors: true,
        linkedinJobId: true,
        indeedJobId: true,
        zipRecruiterJobId: true,
      },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Get recent sync logs
    const syncLogs = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM integration_sync_logs
      WHERE organization_id = ${organizationId}
        AND job_posting_id = ${jobPostingId}
      ORDER BY started_at DESC
      LIMIT 10
    `;

    return {
      jobPosting,
      syncLogs,
    };
  }

  /**
   * Get job analytics
   */
  static async getJobAnalytics(
    organizationId: string,
    jobPostingId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    const dateFilter = startDate && endDate
      ? { gte: startDate, lte: endDate }
      : {};

    // Application metrics
    const [
      totalApplications,
      applicationsBySource,
      applicationsByStatus,
      applicationsByStage,
      avgAiScore,
    ] = await Promise.all([
      prisma.application.count({
        where: { jobPostingId, applicationDate: dateFilter },
      }),
      prisma.application.groupBy({
        by: ['appliedVia'],
        where: { jobPostingId, applicationDate: dateFilter },
        _count: true,
      }),
      prisma.application.groupBy({
        by: ['status'],
        where: { jobPostingId, applicationDate: dateFilter },
        _count: true,
      }),
      prisma.application.groupBy({
        by: ['currentStageId'],
        where: { jobPostingId, applicationDate: dateFilter },
        _count: true,
      }),
      prisma.application.aggregate({
        where: { jobPostingId, aiScreeningScore: { not: null } },
        _avg: { aiScreeningScore: true },
      }),
    ]);

    // Time metrics
    const timeMetrics = await prisma.application.aggregate({
      where: { jobPostingId },
      _avg: {
        daysInPipeline: true,
        daysInCurrentStage: true,
      },
    });

    // Conversion rates
    const conversionRates = await this.calculateConversionRates(jobPostingId);

    return {
      jobPosting,
      metrics: {
        totalApplications,
        applicationsBySource,
        applicationsByStatus,
        applicationsByStage,
        avgAiScore: avgAiScore._avg.aiScreeningScore,
        avgDaysInPipeline: timeMetrics._avg.daysInPipeline,
        avgDaysInCurrentStage: timeMetrics._avg.daysInCurrentStage,
        conversionRates,
      },
    };
  }

  /**
   * Get organization-wide statistics
   */
  static async getOrganizationStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const dateFilter = startDate && endDate
      ? { gte: startDate, lte: endDate }
      : {};

    const [
      totalJobs,
      activeJobs,
      totalApplications,
      avgTimeToFill,
      topPerformingJobs,
    ] = await Promise.all([
      prisma.jobPosting.count({
        where: { organizationId, createdAt: dateFilter },
      }),
      prisma.jobPosting.count({
        where: { organizationId, status: 'active' },
      }),
      prisma.application.count({
        where: {
          organizationId,
          applicationDate: dateFilter,
        },
      }),
      prisma.jobPosting.aggregate({
        where: {
          organizationId,
          avgTimeToFill: { not: null },
        },
        _avg: { avgTimeToFill: true },
      }),
      prisma.jobPosting.findMany({
        where: { organizationId },
        orderBy: { applicationCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          applicationCount: true,
          viewCount: true,
          status: true,
        },
      }),
    ]);

    return {
      totalJobs,
      activeJobs,
      totalApplications,
      avgTimeToFill: avgTimeToFill._avg.avgTimeToFill,
      topPerformingJobs,
    };
  }

  /**
   * Duplicate job posting
   */
  static async duplicateJobPosting(
    organizationId: string,
    jobPostingId: string,
    userId: string
  ) {
    const original = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!original) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Generate new slug
    const slug = await this.generateUniqueSlug(
      organizationId,
      `${original.title} (Copy)`
    );

    // Create duplicate
    const duplicate = await prisma.jobPosting.create({
      data: {
        organizationId,
        title: `${original.title} (Copy)`,
        slug,
        department: original.department,
        location: original.location,
        employmentType: original.employmentType,
        experienceLevel: original.experienceLevel,
        description: original.description,
        responsibilities: original.responsibilities,
        requirements: original.requirements,
        preferredSkills: original.preferredSkills,
        salaryMin: original.salaryMin,
        salaryMax: original.salaryMax,
        salaryCurrency: original.salaryCurrency,
        compensationType: original.compensationType,
        benefits: original.benefits,
        status: 'draft',
        priority: original.priority,
        openings: original.openings,
        pipelineStages: original.pipelineStages,
        keywords: original.keywords,
        tags: original.tags,
        customQuestions: original.customQuestions,
        requiredDocuments: original.requiredDocuments,
        allowsRemoteWork: original.allowsRemoteWork,
        visaSponsorshipAvailable: original.visaSponsorshipAvailable,
        aiScreeningEnabled: original.aiScreeningEnabled,
        aiScreeningCriteria: original.aiScreeningCriteria,
        minAiScore: original.minAiScore,
        createdBy: userId,
      },
    });

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.duplicated',
      resourceType: 'job_posting',
      resourceId: duplicate.id,
      details: { originalId: jobPostingId },
    });

    return duplicate;
  }

  /**
   * Update pipeline stages for job
   */
  static async updatePipelineStages(
    organizationId: string,
    jobPostingId: string,
    stages: Array<{ name: string; order: number; type: string }>,
    userId: string
  ) {
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Update pipeline stages
    const updated = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        pipelineStages: stages as any,
      },
    });

    // Sync application stages
    await this.createApplicationStages(organizationId, stages);

    // Audit log
    await AuditService.log({
      organizationId,
      userId,
      action: 'job_posting.pipeline_updated',
      resourceType: 'job_posting',
      resourceId: jobPostingId,
      details: { stages },
    });

    return updated;
  }

  // ===========================
  // Private Helper Methods
  // ===========================

  private static async generateUniqueSlug(
    organizationId: string,
    title: string,
    excludeId?: string
  ): Promise<string> {
    let slug = slugify(title, { lower: true, strict: true });
    let counter = 1;

    while (true) {
      const existing = await prisma.jobPosting.findFirst({
        where: {
          organizationId,
          slug,
          id: excludeId ? { not: excludeId } : undefined,
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${slugify(title, { lower: true, strict: true })}-${counter}`;
      counter++;
    }
  }

  private static getDefaultPipelineStages() {
    return [
      { name: 'Applied', order: 0, type: 'screening' },
      { name: 'Phone Screen', order: 1, type: 'interview' },
      { name: 'Technical Interview', order: 2, type: 'interview' },
      { name: 'Final Interview', order: 3, type: 'interview' },
      { name: 'Offer', order: 4, type: 'offer' },
      { name: 'Hired', order: 5, type: 'hired' },
    ];
  }

  private static async createApplicationStages(
    organizationId: string,
    stages: Array<{ name: string; order: number; type: string }>
  ) {
    // Create or update application stages
    for (const stage of stages) {
      await prisma.applicationStage.upsert({
        where: {
          organizationId_name: {
            organizationId,
            name: stage.name,
          },
        },
        create: {
          organizationId,
          name: stage.name,
          type: stage.type,
          order: stage.order,
          isActive: true,
        },
        update: {
          type: stage.type,
          order: stage.order,
          isActive: true,
        },
      });
    }
  }

  private static async calculateConversionRates(jobPostingId: string) {
    // Calculate stage-to-stage conversion rates
    const applications = await prisma.application.findMany({
      where: { jobPostingId },
      select: {
        status: true,
        stageHistory: true,
      },
    });

    // Calculate conversion metrics
    const statusCounts: Record<string, number> = {};
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    const total = applications.length;
    const conversionRates: Record<string, number> = {};

    for (const [status, count] of Object.entries(statusCounts)) {
      conversionRates[status] = total > 0 ? (count / total) * 100 : 0;
    }

    return conversionRates;
  }
}
```

This is Part 1 of the architecture document. The document contains:

1. Complete database schema with 4 new models and enhancements
2. Database indexes, constraints, triggers for performance and data integrity
3. Comprehensive tRPC router structure with all endpoints
4. Input validation schemas using Zod
5. Beginning of service layer implementation

Due to length, I'll need to continue with:
- Part 2: Application and Integration services
- Part 3: Azure Form Recognizer integration
- Part 4: Job board integrations (LinkedIn, Indeed, ZipRecruiter)
- Part 5: Security architecture
- Part 6: Implementation roadmap

Would you like me to continue with the remaining parts?