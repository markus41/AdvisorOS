# Third-Party Job Board Integration Strategy

## Integration Overview

```
┌─────────────────────────────────────────────────────────────────┐
│          Job Distribution & Application Ingestion Flow           │
└─────────────────────────────────────────────────────────────────┘

                        AdvisorOS ATS
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    LinkedIn Jobs      Indeed Job API    ZipRecruiter API
    │                  │                  │
    ├─ Post Job        ├─ Post Job        ├─ Post Job
    ├─ Update Job      ├─ Update Job      ├─ Update Job
    ├─ Close Job       ├─ Close Job       ├─ Close Job
    │                  │                  │
    └─ Ingest Apps ────┴─ Ingest Apps ────┴─ Ingest Apps
                             │
                             ▼
                 Unified Application Queue
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
         Parse Resume   Screen AI   Assign Stage
```

---

## 1. LinkedIn Jobs Integration

### Authentication: OAuth 2.0

```typescript
// File: apps/web/src/server/services/integrations/linkedin.service.ts

import { TRPCError } from '@trpc/server';
import { db } from '@/server/db';

interface LinkedInJobPost {
  companyId: string;
  title: string;
  description: string;
  location: {
    city?: string;
    state?: string;
    country: string;
  };
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP';
  experienceLevel: 'ENTRY_LEVEL' | 'ASSOCIATE' | 'MID_SENIOR' | 'DIRECTOR' | 'EXECUTIVE';
  industryCode: string;
  jobFunctions: string[];
  remoteAllowed: boolean;
  applyUrl?: string;
}

export class LinkedInJobsService {
  private accessToken: string | null = null;
  private baseUrl = 'https://api.linkedin.com/v2';

  /**
   * Initialize LinkedIn OAuth connection
   */
  async initialize(organizationId: string): Promise<void> {
    const integration = await db.integration.findFirst({
      where: {
        organizationId,
        provider: 'linkedin',
        isActive: true,
      },
    });

    if (!integration) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'LinkedIn integration not configured',
      });
    }

    this.accessToken = integration.accessToken;
  }

  /**
   * Post job to LinkedIn
   */
  async postJob(
    jobPostingId: string,
    organizationId: string
  ): Promise<{ linkedinJobId: string }> {
    const jobPosting = await db.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Map AdvisorOS job to LinkedIn format
    const linkedInJob: LinkedInJobPost = {
      companyId: await this.getLinkedInCompanyId(organizationId),
      title: jobPosting.title,
      description: jobPosting.description,
      location: {
        city: this.extractCity(jobPosting.location),
        state: this.extractState(jobPosting.location),
        country: 'US',
      },
      employmentType: this.mapEmploymentType(jobPosting.employmentType),
      experienceLevel: this.mapExperienceLevel(jobPosting.experienceLevel),
      industryCode: jobPosting.department || 'ACCOUNTING',
      jobFunctions: ['ACCOUNTING', 'FINANCE'],
      remoteAllowed: jobPosting.allowsRemoteWork,
      applyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/careers/${jobPosting.slug}`,
    };

    // Post to LinkedIn API
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(linkedInJob),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `LinkedIn API error: ${error.message}`,
      });
    }

    const result = await response.json();
    const linkedinJobId = result.id;

    // Update job posting with LinkedIn ID
    await db.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        linkedinJobId,
        distributedTo: {
          push: 'linkedin',
        },
        distributedAt: new Date(),
      },
    });

    // Log activity
    await this.logJobDistribution(jobPostingId, organizationId, 'linkedin', linkedinJobId);

    return { linkedinJobId };
  }

  /**
   * Update LinkedIn job posting
   */
  async updateJob(
    jobPostingId: string,
    organizationId: string
  ): Promise<void> {
    const jobPosting = await db.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting || !jobPosting.linkedinJobId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'LinkedIn job posting not found',
      });
    }

    const linkedInJob: Partial<LinkedInJobPost> = {
      title: jobPosting.title,
      description: jobPosting.description,
      // ... other fields
    };

    await fetch(`${this.baseUrl}/jobs/${jobPosting.linkedinJobId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(linkedInJob),
    });
  }

  /**
   * Close LinkedIn job posting
   */
  async closeJob(
    jobPostingId: string,
    organizationId: string
  ): Promise<void> {
    const jobPosting = await db.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting || !jobPosting.linkedinJobId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'LinkedIn job posting not found',
      });
    }

    await fetch(`${this.baseUrl}/jobs/${jobPosting.linkedinJobId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    // Remove from distributed list
    await db.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        linkedinJobId: null,
        distributedTo: {
          set: (jobPosting.distributedTo || []).filter(d => d !== 'linkedin'),
        },
      },
    });
  }

  /**
   * Sync applications from LinkedIn
   */
  async syncApplications(
    organizationId: string
  ): Promise<{ imported: number; errors: number }> {
    let imported = 0;
    let errors = 0;

    // Get all active LinkedIn job postings
    const jobPostings = await db.jobPosting.findMany({
      where: {
        organizationId,
        linkedinJobId: { not: null },
        status: 'active',
      },
    });

    for (const jobPosting of jobPostings) {
      try {
        const applications = await this.fetchLinkedInApplications(
          jobPosting.linkedinJobId!
        );

        for (const linkedInApp of applications) {
          await this.importLinkedInApplication(
            linkedInApp,
            jobPosting.id,
            organizationId
          );
          imported++;
        }
      } catch (error) {
        console.error(
          `Failed to sync applications for job ${jobPosting.id}:`,
          error
        );
        errors++;
      }
    }

    return { imported, errors };
  }

  /**
   * Fetch applications from LinkedIn API
   */
  private async fetchLinkedInApplications(linkedinJobId: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/jobs/${linkedinJobId}/applications`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn applications');
    }

    const data = await response.json();
    return data.elements || [];
  }

  /**
   * Import LinkedIn application into ATS
   */
  private async importLinkedInApplication(
    linkedInApp: any,
    jobPostingId: string,
    organizationId: string
  ): Promise<void> {
    // Check if application already imported
    const existing = await db.application.findFirst({
      where: {
        organizationId,
        metadata: {
          path: ['linkedinApplicationId'],
          equals: linkedInApp.id,
        },
      },
    });

    if (existing) {
      return; // Already imported
    }

    // Create or find candidate
    const candidate = await this.getOrCreateCandidate(
      {
        firstName: linkedInApp.candidate.firstName,
        lastName: linkedInApp.candidate.lastName,
        email: linkedInApp.candidate.email,
        phone: linkedInApp.candidate.phone,
        linkedinUrl: linkedInApp.candidate.profileUrl,
        source: 'linkedin',
      },
      organizationId
    );

    // Download resume from LinkedIn
    const resumeUrl = await this.downloadLinkedInResume(
      linkedInApp.resumeUrl,
      candidate.id,
      organizationId
    );

    // Create application
    await db.application.create({
      data: {
        organizationId,
        candidateId: candidate.id,
        jobPostingId,
        resumeUrl,
        appliedVia: 'linkedin',
        status: 'new',
        metadata: {
          linkedinApplicationId: linkedInApp.id,
          linkedinProfileUrl: linkedInApp.candidate.profileUrl,
        },
      },
    });
  }

  // Helper methods
  private mapEmploymentType(type: string): LinkedInJobPost['employmentType'] {
    const map: Record<string, LinkedInJobPost['employmentType']> = {
      full_time: 'FULL_TIME',
      part_time: 'PART_TIME',
      contract: 'CONTRACT',
      temporary: 'TEMPORARY',
      internship: 'INTERNSHIP',
    };
    return map[type] || 'FULL_TIME';
  }

  private mapExperienceLevel(level: string): LinkedInJobPost['experienceLevel'] {
    const map: Record<string, LinkedInJobPost['experienceLevel']> = {
      entry: 'ENTRY_LEVEL',
      mid: 'ASSOCIATE',
      senior: 'MID_SENIOR',
      lead: 'DIRECTOR',
      director: 'DIRECTOR',
      executive: 'EXECUTIVE',
    };
    return map[level] || 'MID_SENIOR';
  }

  private extractCity(location?: string): string | undefined {
    if (!location) return undefined;
    return location.split(',')[0]?.trim();
  }

  private extractState(location?: string): string | undefined {
    if (!location) return undefined;
    const parts = location.split(',');
    return parts[1]?.trim().split(' ')[0];
  }

  private async getLinkedInCompanyId(organizationId: string): Promise<string> {
    const integration = await db.integration.findFirst({
      where: { organizationId, provider: 'linkedin' },
    });
    return integration?.metadata?.companyId || '';
  }

  private async logJobDistribution(
    jobPostingId: string,
    organizationId: string,
    platform: string,
    externalId: string
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        organizationId,
        action: 'job_distributed',
        entityType: 'job_posting',
        entityId: jobPostingId,
        metadata: {
          platform,
          externalId,
        },
      },
    });
  }

  private async getOrCreateCandidate(data: any, organizationId: string) {
    const emailHash = this.hashEmail(data.email);

    let candidate = await db.candidate.findFirst({
      where: { organizationId, emailHash },
    });

    if (!candidate) {
      candidate = await db.candidate.create({
        data: {
          organizationId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          linkedinUrl: data.linkedinUrl,
          source: data.source,
          emailHash,
          phoneHash: data.phone ? this.hashEmail(data.phone) : undefined,
        },
      });
    }

    return candidate;
  }

  private hashEmail(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  private async downloadLinkedInResume(
    resumeUrl: string,
    candidateId: string,
    organizationId: string
  ): Promise<string> {
    // Download resume from LinkedIn
    const response = await fetch(resumeUrl, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    const buffer = await response.arrayBuffer();

    // Upload to Azure Blob Storage
    const blobName = `${organizationId}/${candidateId}/resume-${Date.now()}.pdf`;
    // ... upload to blob storage logic ...

    return `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/ats-resumes/${blobName}`;
  }
}

export const linkedInJobsService = new LinkedInJobsService();
```

---

## 2. Indeed Job API Integration

```typescript
// File: apps/web/src/server/services/integrations/indeed.service.ts

export class IndeedJobsService {
  private apiKey: string;
  private publisherId: string;
  private baseUrl = 'https://apis.indeed.com/publishers/v2';

  async initialize(organizationId: string): Promise<void> {
    const integration = await db.integration.findFirst({
      where: { organizationId, provider: 'indeed' },
    });

    if (!integration) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Indeed integration not configured',
      });
    }

    this.apiKey = integration.apiKey;
    this.publisherId = integration.metadata?.publisherId;
  }

  /**
   * Post job to Indeed via XML feed
   */
  async postJob(jobPostingId: string, organizationId: string): Promise<{ indeedJobId: string }> {
    const jobPosting = await db.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    // Generate Indeed XML feed
    const xmlFeed = this.generateIndeedXML(jobPosting);

    // Post to Indeed API
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: xmlFeed,
    });

    if (!response.ok) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post job to Indeed',
      });
    }

    const result = await response.json();
    const indeedJobId = result.jobkey;

    await db.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        indeedJobId,
        distributedTo: { push: 'indeed' },
        distributedAt: new Date(),
      },
    });

    return { indeedJobId };
  }

  /**
   * Generate Indeed XML feed format
   */
  private generateIndeedXML(jobPosting: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>${this.publisherId}</publisher>
  <publisherurl>${process.env.NEXT_PUBLIC_APP_URL}</publisherurl>
  <job>
    <referencenumber>${jobPosting.id}</referencenumber>
    <title>${this.escapeXML(jobPosting.title)}</title>
    <description><![CDATA[${jobPosting.description}]]></description>
    <city>${this.escapeXML(this.extractCity(jobPosting.location))}</city>
    <state>${this.escapeXML(this.extractState(jobPosting.location))}</state>
    <country>US</country>
    <postalcode></postalcode>
    <company>${this.escapeXML(jobPosting.organization.name)}</company>
    <category>${this.mapJobCategory(jobPosting.department)}</category>
    <jobtype>${this.mapEmploymentType(jobPosting.employmentType)}</jobtype>
    <experience>${this.mapExperienceLevel(jobPosting.experienceLevel)}</experience>
    ${jobPosting.salaryMin ? `<salary>${jobPosting.salaryMin}</salary>` : ''}
    <url>${process.env.NEXT_PUBLIC_APP_URL}/careers/${jobPosting.slug}</url>
    <date>${new Date().toISOString().split('T')[0]}</date>
  </job>
</source>`;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private mapJobCategory(department?: string): string {
    const map: Record<string, string> = {
      'Accounting': 'Accounting',
      'Tax': 'Accounting',
      'Audit': 'Accounting',
      'Advisory': 'Consulting',
      'Operations': 'Management',
    };
    return map[department || ''] || 'Accounting';
  }

  private mapEmploymentType(type: string): string {
    const map: Record<string, string> = {
      full_time: 'fulltime',
      part_time: 'parttime',
      contract: 'contract',
      temporary: 'temporary',
      internship: 'internship',
    };
    return map[type] || 'fulltime';
  }

  private mapExperienceLevel(level: string): string {
    const map: Record<string, string> = {
      entry: 'Entry Level',
      mid: 'Mid Level',
      senior: 'Senior Level',
      lead: 'Management',
      director: 'Executive',
      executive: 'Executive',
    };
    return map[level] || 'Mid Level';
  }

  /**
   * Sync applications from Indeed
   * Note: Indeed uses email forwarding or apply tracking URL
   */
  async syncApplications(organizationId: string): Promise<{ imported: number }> {
    // Indeed applications come via email forwarding or webhook
    // This method processes queued Indeed applications

    const queuedApps = await db.inboundApplication.findMany({
      where: {
        organizationId,
        source: 'indeed',
        processed: false,
      },
      take: 50,
    });

    let imported = 0;

    for (const inboundApp of queuedApps) {
      try {
        await this.processIndeedApplication(inboundApp, organizationId);
        imported++;

        await db.inboundApplication.update({
          where: { id: inboundApp.id },
          data: { processed: true },
        });
      } catch (error) {
        console.error('Failed to process Indeed application:', error);
      }
    }

    return { imported };
  }

  private async processIndeedApplication(inboundApp: any, organizationId: string): Promise<void> {
    // Parse Indeed application data
    const candidateData = this.parseIndeedApplication(inboundApp.data);

    // Create candidate and application
    const candidate = await this.getOrCreateCandidate(candidateData, organizationId);

    await db.application.create({
      data: {
        organizationId,
        candidateId: candidate.id,
        jobPostingId: inboundApp.jobPostingId,
        resumeUrl: inboundApp.resumeUrl,
        appliedVia: 'indeed',
        status: 'new',
        metadata: {
          indeedApplicationId: inboundApp.externalId,
        },
      },
    });
  }

  private parseIndeedApplication(data: any): any {
    // Parse Indeed's email forwarding format or API response
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      resumeUrl: data.resumeUrl,
    };
  }

  private async getOrCreateCandidate(data: any, organizationId: string) {
    // Similar to LinkedIn implementation
    const emailHash = this.hashEmail(data.email);

    let candidate = await db.candidate.findFirst({
      where: { organizationId, emailHash },
    });

    if (!candidate) {
      candidate = await db.candidate.create({
        data: {
          organizationId,
          ...data,
          source: 'indeed',
          emailHash,
        },
      });
    }

    return candidate;
  }

  private hashEmail(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  private extractCity(location?: string): string {
    return location?.split(',')[0]?.trim() || '';
  }

  private extractState(location?: string): string {
    const parts = location?.split(',') || [];
    return parts[1]?.trim().split(' ')[0] || '';
  }
}

export const indeedJobsService = new IndeedJobsService();
```

---

## 3. ZipRecruiter Integration

```typescript
// File: apps/web/src/server/services/integrations/ziprecruiter.service.ts

export class ZipRecruiterService {
  private apiKey: string;
  private baseUrl = 'https://api.ziprecruiter.com/v1';

  async initialize(organizationId: string): Promise<void> {
    const integration = await db.integration.findFirst({
      where: { organizationId, provider: 'ziprecruiter' },
    });

    if (!integration) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'ZipRecruiter integration not configured',
      });
    }

    this.apiKey = integration.apiKey;
  }

  /**
   * Post job to ZipRecruiter
   */
  async postJob(
    jobPostingId: string,
    organizationId: string
  ): Promise<{ zipRecruiterJobId: string }> {
    const jobPosting = await db.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId },
    });

    if (!jobPosting) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job posting not found',
      });
    }

    const zipRecruiterJob = {
      job_title: jobPosting.title,
      job_description: jobPosting.description,
      job_location: jobPosting.location,
      job_type: this.mapEmploymentType(jobPosting.employmentType),
      job_category: this.mapJobCategory(jobPosting.department),
      job_experience: this.mapExperienceLevel(jobPosting.experienceLevel),
      job_min_salary: jobPosting.salaryMin,
      job_max_salary: jobPosting.salaryMax,
      job_url: `${process.env.NEXT_PUBLIC_APP_URL}/careers/${jobPosting.slug}`,
      job_reference_id: jobPosting.id,
    };

    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      body: JSON.stringify(zipRecruiterJob),
    });

    if (!response.ok) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post job to ZipRecruiter',
      });
    }

    const result = await response.json();
    const zipRecruiterJobId = result.job_id;

    await db.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        zipRecruiterJobId,
        distributedTo: { push: 'ziprecruiter' },
        distributedAt: new Date(),
      },
    });

    return { zipRecruiterJobId };
  }

  /**
   * Sync applications from ZipRecruiter
   */
  async syncApplications(organizationId: string): Promise<{ imported: number }> {
    // Get all active ZipRecruiter job postings
    const jobPostings = await db.jobPosting.findMany({
      where: {
        organizationId,
        zipRecruiterJobId: { not: null },
        status: 'active',
      },
    });

    let imported = 0;

    for (const jobPosting of jobPostings) {
      const applications = await this.fetchZipRecruiterApplications(
        jobPosting.zipRecruiterJobId!
      );

      for (const zipApp of applications) {
        await this.importZipRecruiterApplication(
          zipApp,
          jobPosting.id,
          organizationId
        );
        imported++;
      }
    }

    return { imported };
  }

  private async fetchZipRecruiterApplications(zipRecruiterJobId: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/jobs/${zipRecruiterJobId}/applications`,
      {
        headers: {
          'X-Api-Key': this.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch ZipRecruiter applications');
    }

    const data = await response.json();
    return data.applications || [];
  }

  private async importZipRecruiterApplication(
    zipApp: any,
    jobPostingId: string,
    organizationId: string
  ): Promise<void> {
    // Similar to LinkedIn/Indeed implementation
    const candidate = await this.getOrCreateCandidate(
      {
        firstName: zipApp.first_name,
        lastName: zipApp.last_name,
        email: zipApp.email,
        phone: zipApp.phone,
        source: 'ziprecruiter',
      },
      organizationId
    );

    await db.application.create({
      data: {
        organizationId,
        candidateId: candidate.id,
        jobPostingId,
        resumeUrl: zipApp.resume_url,
        appliedVia: 'ziprecruiter',
        status: 'new',
        metadata: {
          zipRecruiterApplicationId: zipApp.id,
        },
      },
    });
  }

  // Helper methods (similar to LinkedIn service)
  private mapEmploymentType(type: string): string {
    const map: Record<string, string> = {
      full_time: 'Full-Time',
      part_time: 'Part-Time',
      contract: 'Contract',
      temporary: 'Temporary',
      internship: 'Internship',
    };
    return map[type] || 'Full-Time';
  }

  private mapJobCategory(department?: string): string {
    return department || 'Accounting';
  }

  private mapExperienceLevel(level: string): string {
    const map: Record<string, string> = {
      entry: 'Entry Level',
      mid: 'Mid Level',
      senior: 'Senior Level',
      lead: 'Manager',
      director: 'Executive',
      executive: 'Executive',
    };
    return map[level] || 'Mid Level';
  }

  private async getOrCreateCandidate(data: any, organizationId: string) {
    const emailHash = this.hashEmail(data.email);

    let candidate = await db.candidate.findFirst({
      where: { organizationId, emailHash },
    });

    if (!candidate) {
      candidate = await db.candidate.create({
        data: {
          organizationId,
          ...data,
          emailHash,
        },
      });
    }

    return candidate;
  }

  private hashEmail(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }
}

export const zipRecruiterService = new ZipRecruiterService();
```

---

## 4. Unified Job Distribution Service

```typescript
// File: apps/web/src/server/services/jobDistribution.service.ts

import { linkedInJobsService } from './integrations/linkedin.service';
import { indeedJobsService } from './integrations/indeed.service';
import { zipRecruiterService } from './integrations/ziprecruiter.service';

export class JobDistributionService {
  /**
   * Distribute job to multiple platforms
   */
  async distributeJob(
    jobPostingId: string,
    organizationId: string,
    platforms: Array<'linkedin' | 'indeed' | 'ziprecruiter' | 'career_site'>
  ): Promise<{
    success: string[];
    failed: Array<{ platform: string; error: string }>;
  }> {
    const success: string[] = [];
    const failed: Array<{ platform: string; error: string }> = [];

    for (const platform of platforms) {
      try {
        switch (platform) {
          case 'linkedin':
            await linkedInJobsService.initialize(organizationId);
            await linkedInJobsService.postJob(jobPostingId, organizationId);
            success.push('linkedin');
            break;

          case 'indeed':
            await indeedJobsService.initialize(organizationId);
            await indeedJobsService.postJob(jobPostingId, organizationId);
            success.push('indeed');
            break;

          case 'ziprecruiter':
            await zipRecruiterService.initialize(organizationId);
            await zipRecruiterService.postJob(jobPostingId, organizationId);
            success.push('ziprecruiter');
            break;

          case 'career_site':
            // Just publish on career site (no external API call)
            await db.jobPosting.update({
              where: { id: jobPostingId },
              data: {
                isPublished: true,
                publishedAt: new Date(),
              },
            });
            success.push('career_site');
            break;
        }
      } catch (error) {
        console.error(`Failed to distribute to ${platform}:`, error);
        failed.push({
          platform,
          error: error.message,
        });
      }
    }

    return { success, failed };
  }

  /**
   * Sync applications from all platforms
   */
  async syncAllApplications(organizationId: string): Promise<{
    linkedin: number;
    indeed: number;
    ziprecruiter: number;
  }> {
    const results = {
      linkedin: 0,
      indeed: 0,
      ziprecruiter: 0,
    };

    try {
      await linkedInJobsService.initialize(organizationId);
      const linkedInResult = await linkedInJobsService.syncApplications(organizationId);
      results.linkedin = linkedInResult.imported;
    } catch (error) {
      console.error('LinkedIn sync failed:', error);
    }

    try {
      await indeedJobsService.initialize(organizationId);
      const indeedResult = await indeedJobsService.syncApplications(organizationId);
      results.indeed = indeedResult.imported;
    } catch (error) {
      console.error('Indeed sync failed:', error);
    }

    try {
      await zipRecruiterService.initialize(organizationId);
      const zipResult = await zipRecruiterService.syncApplications(organizationId);
      results.ziprecruiter = zipResult.imported;
    } catch (error) {
      console.error('ZipRecruiter sync failed:', error);
    }

    return results;
  }
}

export const jobDistributionService = new JobDistributionService();
```

---

## Integration Setup Instructions

### 1. LinkedIn Jobs API
1. Create LinkedIn Company Page
2. Apply for LinkedIn Jobs API access
3. Create OAuth 2.0 application
4. Get Company ID and configure redirect URLs
5. Store credentials in database:

```typescript
await db.integration.create({
  data: {
    organizationId: 'org_123',
    provider: 'linkedin',
    isActive: true,
    accessToken: 'encrypted_access_token',
    refreshToken: 'encrypted_refresh_token',
    expiresAt: new Date(Date.now() + 3600000),
    metadata: {
      companyId: 'linkedin_company_id',
    },
  },
});
```

### 2. Indeed Job API
1. Apply for Indeed Publisher account
2. Get API key and Publisher ID
3. Set up XML feed endpoint (webhook)
4. Store credentials:

```typescript
await db.integration.create({
  data: {
    organizationId: 'org_123',
    provider: 'indeed',
    isActive: true,
    apiKey: 'encrypted_api_key',
    metadata: {
      publisherId: 'indeed_publisher_id',
      feedUrl: 'https://yourapp.com/api/indeed/feed',
    },
  },
});
```

### 3. ZipRecruiter API
1. Sign up for ZipRecruiter API access
2. Get API key
3. Configure webhook for application notifications
4. Store credentials:

```typescript
await db.integration.create({
  data: {
    organizationId: 'org_123',
    provider: 'ziprecruiter',
    isActive: true,
    apiKey: 'encrypted_api_key',
    metadata: {
      webhookUrl: 'https://yourapp.com/api/ziprecruiter/webhook',
    },
  },
});
```

---

## Application Sync Schedule

### Cron Job Configuration

```typescript
// apps/web/src/workers/ats-sync.worker.ts

import cron from 'node-cron';
import { jobDistributionService } from '@/server/services/jobDistribution.service';

// Sync applications every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Starting ATS application sync...');

  const organizations = await db.organization.findMany({
    where: {
      isActive: true,
      subscriptionTier: { not: 'trial' },
    },
  });

  for (const org of organizations) {
    try {
      const results = await jobDistributionService.syncAllApplications(org.id);
      console.log(`Synced ${org.name}:`, results);
    } catch (error) {
      console.error(`Failed to sync ${org.name}:`, error);
    }
  }
});
```

---

## Cost Estimation

### API Call Costs (Per Month)

| Platform | API Calls | Cost per Call | Monthly Cost |
|----------|-----------|---------------|--------------|
| LinkedIn | 1,000 posts + 10,000 syncs | $0.05 | $550 |
| Indeed | 500 posts + 5,000 syncs | $0.02 | $110 |
| ZipRecruiter | 500 posts + 5,000 syncs | $0.03 | $165 |

**Total Estimated Cost**: $825/month for 1,000 job postings and 20,000 application syncs

### Cost Optimization
- Cache job board data for 1 hour
- Batch sync operations (every 15 minutes vs real-time)
- Only sync active job postings
- Implement rate limiting to avoid over-usage