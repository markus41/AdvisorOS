# ATS Prisma Schema Additions

Add these models to `apps/web/prisma/schema.prisma`:

```prisma
// ============================================================================
// JOB POSTING & APPLICANT TRACKING SYSTEM (ATS)
// ============================================================================

model JobPosting {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Job Details
  title          String
  department     String? // "Accounting", "Tax", "Audit", "Advisory", "Operations"
  location       String? // "Remote", "Hybrid", "New York, NY"
  employmentType String // "full_time", "part_time", "contract", "temporary", "internship"
  experienceLevel String // "entry", "mid", "senior", "lead", "director", "executive"

  // Job Description
  description    String       @db.Text // Full job description
  responsibilities String[]    // Array of key responsibilities
  requirements   String[]     // Required qualifications
  preferredSkills String[]    // Nice-to-have skills

  // Compensation
  salaryMin      Decimal?     @db.Decimal(10, 2)
  salaryMax      Decimal?     @db.Decimal(10, 2)
  salaryCurrency String       @default("USD")
  compensationType String?    // "salary", "hourly", "commission", "equity"
  benefits       String[]     // List of benefits

  // Status & Workflow
  status         String       @default("draft") // "draft", "active", "paused", "closed", "filled", "cancelled"
  priority       String       @default("normal") // "low", "normal", "high", "urgent"
  openings       Int          @default(1) // Number of positions
  filledCount    Int          @default(0)

  // Hiring Team
  hiringManagerId String?
  hiringManager   User?        @relation("JobHiringManager", fields: [hiringManagerId], references: [id])
  recruiterId     String?
  recruiter       User?        @relation("JobRecruiter", fields: [recruiterId], references: [id])

  // Application Pipeline
  pipelineStages Json // Array of pipeline stages with order

  // Publishing & Distribution
  isPublished    Boolean      @default(false)
  publishedAt    DateTime?
  expiresAt      DateTime?
  isInternal     Boolean      @default(false) // Internal vs external posting

  // Third-Party Job Boards
  linkedinJobId  String?      @unique // LinkedIn job posting ID
  indeedJobId    String?      @unique // Indeed job posting ID
  zipRecruiterJobId String?   @unique // ZipRecruiter job posting ID
  distributedTo  String[]     // Array of job boards where posted
  distributedAt  DateTime?

  // SEO & Searchability
  slug           String       @unique // URL-friendly slug
  keywords       String[]     // Keywords for search
  tags           String[]     // Categorization tags

  // Application Settings
  applicationDeadline DateTime?
  customQuestions    Json? // Custom screening questions
  requiredDocuments  String[] // "resume", "cover_letter", "portfolio", "references"
  allowsRemoteWork   Boolean  @default(false)
  visaSponsorshipAvailable Boolean @default(false)

  // Analytics
  viewCount          Int      @default(0)
  applicationCount   Int      @default(0)
  avgTimeToFill      Int? // Days to fill position
  costPerHire        Decimal? @db.Decimal(10, 2)

  // Metadata
  metadata       Json? // Additional custom fields
  createdBy      String
  creator        User         @relation("JobPostingCreator", fields: [createdBy], references: [id])
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  applications   Application[]
  interviews     Interview[]

  @@index([organizationId])
  @@index([status])
  @@index([employmentType])
  @@index([experienceLevel])
  @@index([hiringManagerId])
  @@index([recruiterId])
  @@index([isPublished])
  @@index([publishedAt])
  @@index([slug])
  @@index([keywords])
  @@index([tags])
  @@index([createdAt])
  @@map("job_postings")
}

model Candidate {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Personal Information
  firstName      String
  lastName       String
  email          String
  phone          String?
  location       String? // City, State
  linkedinUrl    String?
  portfolioUrl   String?
  websiteUrl     String?

  // Professional Information
  currentTitle   String?
  currentCompany String?
  yearsExperience Int?

  // Resume & Documents
  resumeFileUrl  String? // Primary resume
  resumeFileId   String? // Document ID if stored in Document model
  resumeParsedData Json? // Structured data from resume parsing

  coverLetterUrl String?
  portfolioFileUrl String?
  additionalDocuments Json? // Array of additional document URLs

  // Skills & Qualifications
  skills         String[] // Extracted or manually added skills
  certifications String[]
  education      Json? // Array of education entries
  workHistory    Json? // Array of work experience entries

  // Source & Attribution
  source         String // "linkedin", "indeed", "ziprecruiter", "referral", "career_site", "agency", "direct"
  sourceDetails  String? // Referring URL, referrer name, etc.
  referredBy     String? // User ID if referred by team member

  // Status & Tags
  status         String       @default("new") // "new", "screening", "active", "passive", "hired", "rejected", "withdrawn"
  tags           String[] // Custom tags for categorization
  rating         Int? // 1-5 star rating

  // Privacy & Compliance
  consentToContact Boolean    @default(true)
  consentDate    DateTime?
  gdprConsent    Boolean      @default(false)
  eeocData       Json? // Equal Employment Opportunity data (anonymized)

  // Communication
  lastContactedAt DateTime?
  lastContactedBy String?
  emailOptIn     Boolean      @default(true)
  smsOptIn       Boolean      @default(false)

  // Analytics
  profileViews   Int          @default(0)
  lastViewedAt   DateTime?

  // Deduplication
  emailHash      String // Hash of email for duplicate detection
  phoneHash      String? // Hash of phone for duplicate detection

  // Metadata
  notes          String?      @db.Text
  metadata       Json? // Custom fields
  createdBy      String?
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  applications   Application[]
  interviews     Interview[]
  communications CandidateCommunication[]
  activities     CandidateActivity[]

  @@unique([organizationId, emailHash]) // Prevent duplicate candidates per org
  @@index([organizationId])
  @@index([email])
  @@index([status])
  @@index([source])
  @@index([tags])
  @@index([rating])
  @@index([createdAt])
  @@index([emailHash])
  @@map("candidates")
}

model Application {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Core Relationships
  candidateId    String
  candidate      Candidate    @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  jobPostingId   String
  jobPosting     JobPosting   @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)

  // Application Details
  applicationDate DateTime    @default(now())
  status         String       @default("new") // "new", "screening", "interviewing", "offer", "hired", "rejected", "withdrawn"
  currentStageId String? // Current pipeline stage ID
  currentStage   ApplicationStage? @relation(fields: [currentStageId], references: [id])

  // Submission Data
  coverLetter    String?      @db.Text
  customAnswers  Json? // Answers to custom application questions
  appliedVia     String // "career_site", "linkedin", "indeed", "referral", "direct"

  // Documents
  resumeUrl      String
  coverLetterUrl String?
  additionalDocs Json? // Additional submitted documents

  // Resume Parsing Results
  parsedResumeData Json? // Structured data from Azure Form Recognizer
  parsingStatus  String       @default("pending") // "pending", "processing", "completed", "failed"
  parsingConfidence Float? // 0-1 confidence score
  parsedAt       DateTime?

  // AI Screening
  aiScreeningScore Float? // 0-100 AI-calculated fit score
  aiScreeningNotes Json? // AI-generated insights
  keywordMatches   String[] // Matched keywords from job description
  skillMatches     Json? // Matched skills with confidence scores

  // Timeline & Progress
  stageHistory   Json // Array of stage transitions with timestamps
  daysInCurrentStage Int @default(0)
  daysInPipeline Int @default(0)

  // Rating & Evaluation
  overallRating  Int? // 1-5 stars
  technicalRating Int? // 1-5 stars
  culturalFitRating Int? // 1-5 stars
  evaluationNotes String? @db.Text

  // Rejection Management
  rejectedAt     DateTime?
  rejectedBy     String?
  rejectionReason String? @db.Text
  rejectionCategory String? // "qualifications", "experience", "location", "salary", "culture_fit", "other"
  rejectionEmailSent Boolean @default(false)

  // Offer Management
  offerExtended  Boolean      @default(false)
  offerDate      DateTime?
  offerAmount    Decimal?     @db.Decimal(10, 2)
  offerAccepted  Boolean?
  offerAcceptedDate DateTime?
  offerDeclinedReason String? @db.Text

  // Assignment & Ownership
  assignedToId   String?
  assignedTo     User?        @relation("ApplicationAssignee", fields: [assignedToId], references: [id])
  assignedAt     DateTime?

  // Communication
  lastContactedAt DateTime?
  nextFollowUpDate DateTime?

  // Flags & Alerts
  isFlagged      Boolean      @default(false)
  flagReason     String?      @db.Text
  isArchived     Boolean      @default(false)
  archivedAt     DateTime?

  // Metadata
  metadata       Json? // Custom fields
  notes          String?      @db.Text
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  interviews     Interview[]
  activities     ApplicationActivity[]

  @@unique([candidateId, jobPostingId]) // One application per candidate per job
  @@index([organizationId])
  @@index([candidateId])
  @@index([jobPostingId])
  @@index([status])
  @@index([currentStageId])
  @@index([assignedToId])
  @@index([applicationDate])
  @@index([aiScreeningScore])
  @@index([parsingStatus])
  @@map("applications")
}

model ApplicationStage {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Stage Details
  name           String // "Applied", "Screening", "Phone Interview", "Technical Interview", "Offer", etc.
  description    String?      @db.Text
  type           String // "screening", "interview", "assessment", "offer", "hired", "rejected"
  order          Int // Order in pipeline (0-based)

  // Stage Configuration
  isActive       Boolean      @default(true)
  isDefault      Boolean      @default(false) // Is this the default initial stage?
  allowManualMove Boolean     @default(true) // Can applications be manually moved to this stage?

  // Automation Rules
  autoAdvanceConditions Json? // Conditions for automatic advancement
  autoRejectConditions Json? // Conditions for automatic rejection
  requiredActions  String[] // Actions required before advancing

  // Notifications
  notifyHiringManager Boolean  @default(false)
  notifyRecruiter    Boolean   @default(false)
  candidateEmailTemplate String? // Email template to send to candidate

  // SLA & Timing
  targetDays     Int? // Target days in this stage
  maxDays        Int? // Maximum days before alert

  // Analytics
  applicationCount Int        @default(0)
  avgTimeInStage Int? // Average days applications spend in this stage
  conversionRate Float? // Percentage that advance to next stage

  // Metadata
  metadata       Json?
  createdBy      String?
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  applications   Application[]

  @@unique([organizationId, name]) // Unique stage names per org
  @@index([organizationId])
  @@index([type])
  @@index([order])
  @@index([isActive])
  @@map("application_stages")
}

model Interview {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Core Relationships
  applicationId  String
  application    Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  candidateId    String
  candidate      Candidate    @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  jobPostingId   String
  jobPosting     JobPosting   @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)

  // Interview Details
  title          String // "Phone Screen", "Technical Interview", "Final Round"
  type           String // "phone", "video", "in_person", "technical", "panel", "behavioral"
  round          Int          @default(1)

  // Scheduling
  scheduledAt    DateTime?
  startTime      DateTime?
  endTime        DateTime?
  duration       Int? // Duration in minutes
  timezone       String?

  // Status
  status         String       @default("scheduled") // "scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"

  // Location / Platform
  location       String? // Office address or "Remote"
  meetingLink    String? // Zoom, Teams, Google Meet link
  meetingId      String? // Meeting ID/code
  meetingPassword String? // Meeting password
  dialInNumber   String?

  // Participants
  interviewers   Json // Array of interviewer user IDs and names
  organizerId    String?
  organizer      User?        @relation("InterviewOrganizer", fields: [organizerId], references: [id])

  // Interview Content
  interviewGuide Json? // Structured interview questions and topics
  focusAreas     String[] // "technical_skills", "leadership", "culture_fit", "problem_solving"

  // Evaluation
  feedback       Json? // Structured feedback from each interviewer
  overallRating  Int? // 1-5 stars
  technicalRating Int?
  communicationRating Int?
  cultureFitRating Int?
  recommendation String? // "strong_hire", "hire", "neutral", "no_hire", "strong_no_hire"

  // Evaluation Notes
  strengths      String?      @db.Text
  weaknesses     String?      @db.Text
  additionalNotes String?     @db.Text

  // Recording & Artifacts
  recordingUrl   String? // Interview recording
  transcriptUrl  String? // Transcript if available
  notesDocumentUrl String? // Shared notes document

  // Reminders & Notifications
  candidateNotified Boolean   @default(false)
  candidateConfirmed Boolean  @default(false)
  reminderSentAt DateTime?

  // Rescheduling
  isRescheduled  Boolean      @default(false)
  rescheduleCount Int         @default(0)
  rescheduleReason String?    @db.Text
  originalStartTime DateTime?

  // Cancellation
  cancelledAt    DateTime?
  cancelledBy    String?
  cancellationReason String?  @db.Text

  // Metadata
  metadata       Json?
  createdBy      String?
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([organizationId])
  @@index([applicationId])
  @@index([candidateId])
  @@index([jobPostingId])
  @@index([status])
  @@index([scheduledAt])
  @@index([type])
  @@map("interviews")
}

model CandidateCommunication {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Core Relationship
  candidateId    String
  candidate      Candidate    @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  // Communication Details
  type           String // "email", "sms", "phone_call", "video_call", "in_person"
  direction      String // "inbound", "outbound"

  // Content
  subject        String?
  body           String?      @db.Text
  htmlBody       String?      @db.Text

  // Sender/Recipient
  from           String // Email or phone
  to             String // Email or phone
  cc             String[]     @default([])
  bcc            String[]     @default([])

  // Status
  status         String       @default("sent") // "draft", "scheduled", "sent", "delivered", "opened", "clicked", "bounced", "failed"
  sentAt         DateTime?
  deliveredAt    DateTime?
  openedAt       DateTime?
  clickedAt      DateTime?

  // Tracking
  openCount      Int          @default(0)
  clickCount     Int          @default(0)

  // Attachments
  attachments    Json? // Array of attachment URLs

  // Template & Automation
  templateId     String?
  isAutomated    Boolean      @default(false)
  triggeredBy    String? // Event that triggered automated message

  // Provider Details
  provider       String? // "sendgrid", "twilio", "manual"
  externalId     String? // Provider's message ID
  errorMessage   String?      @db.Text

  // Metadata
  metadata       Json?
  createdBy      String?
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([organizationId])
  @@index([candidateId])
  @@index([type])
  @@index([status])
  @@index([sentAt])
  @@map("candidate_communications")
}

model CandidateActivity {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Core Relationship
  candidateId    String
  candidate      Candidate    @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  // Activity Details
  activityType   String // "profile_viewed", "email_sent", "interview_scheduled", "note_added", "status_changed", "rating_updated"
  description    String       @db.Text

  // Activity Data
  changes        Json? // Before/after values for updates
  metadata       Json? // Additional activity-specific data

  // Actor
  performedBy    String?
  performedByUser User?       @relation("ActivityPerformer", fields: [performedBy], references: [id])

  // Timestamps
  performedAt    DateTime     @default(now())
  createdAt      DateTime     @default(now())

  @@index([organizationId])
  @@index([candidateId])
  @@index([activityType])
  @@index([performedAt])
  @@map("candidate_activities")
}

model ApplicationActivity {
  id             String       @id @default(cuid())

  // Multi-tenant Security
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Core Relationship
  applicationId  String
  application    Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  // Activity Details
  activityType   String // "stage_changed", "interview_scheduled", "feedback_added", "assigned", "rejected", "offer_extended"
  description    String       @db.Text

  // Activity Data
  changes        Json? // Before/after values
  metadata       Json?

  // Actor
  performedBy    String?
  performedByUser User?       @relation("ApplicationActivityPerformer", fields: [performedBy], references: [id])

  // Timestamps
  performedAt    DateTime     @default(now())
  createdAt      DateTime     @default(now())

  @@index([organizationId])
  @@index([applicationId])
  @@index([activityType])
  @@index([performedAt])
  @@map("application_activities")
}

// Update Organization model to add new relations
model Organization {
  // ... existing fields ...

  // New ATS Relations
  jobPostings            JobPosting[]
  candidates             Candidate[]
  applications           Application[]
  applicationStages      ApplicationStage[]
  interviews             Interview[]
  candidateCommunications CandidateCommunication[]
  candidateActivities    CandidateActivity[]
  applicationActivities  ApplicationActivity[]
}

// Update User model to add new relations
model User {
  // ... existing fields ...

  // New ATS Relations
  managedJobs            JobPosting[]             @relation("JobHiringManager")
  recruitedJobs          JobPosting[]             @relation("JobRecruiter")
  createdJobs            JobPosting[]             @relation("JobPostingCreator")
  assignedApplications   Application[]            @relation("ApplicationAssignee")
  organizedInterviews    Interview[]              @relation("InterviewOrganizer")
  candidateActivities    CandidateActivity[]      @relation("ActivityPerformer")
  applicationActivities  ApplicationActivity[]    @relation("ApplicationActivityPerformer")
}
```

## Key Design Decisions

### 1. Multi-Tenant Security
- All models include `organizationId` with cascade delete
- Unique constraints scoped to organization (e.g., candidate email uniqueness per org)
- All queries automatically filtered by organization context

### 2. Resume Parsing Integration
- `parsedResumeData` field stores Azure Form Recognizer results
- `parsingStatus` tracks processing pipeline
- `parsingConfidence` for quality assessment

### 3. Pipeline Management
- Flexible `ApplicationStage` model for customizable pipelines
- Stage history tracking in `stageHistory` JSON field
- Automatic stage transition rules support

### 4. Third-Party Job Board Integration
- Foreign keys for LinkedIn, Indeed, ZipRecruiter
- `distributedTo` array tracks all posting locations
- Separate IDs for each platform's job posting

### 5. AI-Powered Screening
- `aiScreeningScore` for candidate-job matching
- `skillMatches` with confidence scores
- `keywordMatches` for quick filtering

### 6. Interview Management
- Flexible interview types (phone, video, in-person, panel)
- Built-in video conferencing link storage
- Structured feedback collection

### 7. Communication Tracking
- Complete email/SMS history with delivery status
- Open and click tracking
- Template support for automated communications

### 8. Activity Audit Trail
- Separate activity tables for candidates and applications
- Complete change tracking
- Attribution to users who performed actions

### 9. Performance Optimization
- Strategic indexes on frequently queried fields
- Composite indexes for common filter combinations
- JSON fields for flexible, evolving data structures

### 10. Compliance & Privacy
- GDPR consent tracking
- EEOC data storage (anonymized)
- Email/phone hashing for deduplication