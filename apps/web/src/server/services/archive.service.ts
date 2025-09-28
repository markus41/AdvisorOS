import { PrismaClient, Prisma } from '@prisma/client';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { z } from 'zod';

// Archive configuration schema
const ArchiveConfigSchema = z.object({
  documents: z.object({
    retentionYears: z.number().default(7), // 7 years for tax documents
    archiveAfterDays: z.number().default(365), // Archive after 1 year
    compressThresholdMB: z.number().default(10), // Compress files larger than 10MB
  }),
  tasks: z.object({
    archiveCompletedAfterDays: z.number().default(90), // Archive completed tasks after 90 days
    deleteArchivedAfterYears: z.number().default(3), // Delete archived tasks after 3 years
  }),
  invoices: z.object({
    archivePaidAfterDays: z.number().default(365), // Archive paid invoices after 1 year
    retentionYears: z.number().default(7), // Keep for 7 years
  }),
  auditLogs: z.object({
    archiveAfterDays: z.number().default(90), // Archive audit logs after 90 days
    retentionYears: z.number().default(7), // Keep for 7 years for compliance
  }),
});

type ArchiveConfig = z.infer<typeof ArchiveConfigSchema>;

interface ArchiveStats {
  documentsArchived: number;
  documentSpaceSaved: number;
  tasksArchived: number;
  invoicesArchived: number;
  auditLogsArchived: number;
  totalSpaceSaved: number;
  archiveDate: Date;
}

interface ArchiveJob {
  id: string;
  type: 'documents' | 'tasks' | 'invoices' | 'audit_logs';
  organizationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  stats?: ArchiveStats;
  errorMessage?: string;
}

export class ArchiveService {
  private s3Client?: S3Client;
  private archiveJobs: Map<string, ArchiveJob> = new Map();

  constructor(
    private prisma: PrismaClient,
    private config: ArchiveConfig = ArchiveConfigSchema.parse({})
  ) {
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } else {
      console.warn('AWS credentials not configured. File archiving will use local storage.');
    }
  }

  // DOCUMENT ARCHIVING
  async archiveDocuments(organizationId: string): Promise<ArchiveStats> {
    const jobId = `archive_docs_${organizationId}_${Date.now()}`;
    const job: ArchiveJob = {
      id: jobId,
      type: 'documents',
      organizationId,
      status: 'running',
      startedAt: new Date(),
    };

    this.archiveJobs.set(jobId, job);

    try {
      console.log(`Starting document archival for organization ${organizationId}`);

      // Find documents eligible for archiving
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.documents.archiveAfterDays);

      const documentsToArchive = await this.prisma.document.findMany({
        where: {
          organizationId,
          deletedAt: null,
          isArchived: false,
          createdAt: { lt: cutoffDate },
          // Don't archive documents that are actively being used
          NOT: {
            client: {
              engagements: {
                some: {
                  status: { in: ['planning', 'in_progress', 'review'] },
                },
              },
            },
          },
        },
        include: {
          client: { select: { businessName: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      console.log(`Found ${documentsToArchive.length} documents eligible for archiving`);

      let totalSpaceSaved = 0;
      let documentsArchived = 0;

      // Process documents in batches
      const batchSize = 10;
      for (let i = 0; i < documentsToArchive.length; i += batchSize) {
        const batch = documentsToArchive.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (document) => {
            try {
              const spaceSaved = await this.archiveDocument(document);
              totalSpaceSaved += spaceSaved;
              documentsArchived++;

              // Update progress
              if (documentsArchived % 100 === 0) {
                console.log(`Archived ${documentsArchived}/${documentsToArchive.length} documents`);
              }
            } catch (error) {
              console.error(`Failed to archive document ${document.id}:`, error);
            }
          })
        );
      }

      // Check for documents that exceed retention period
      await this.cleanupExpiredDocuments(organizationId);

      const stats: ArchiveStats = {
        documentsArchived,
        documentSpaceSaved: totalSpaceSaved,
        tasksArchived: 0,
        invoicesArchived: 0,
        auditLogsArchived: 0,
        totalSpaceSaved,
        archiveDate: new Date(),
      };

      job.status = 'completed';
      job.completedAt = new Date();
      job.stats = stats;

      console.log(`Document archival completed. Archived ${documentsArchived} documents, saved ${totalSpaceSaved} bytes`);

      return stats;
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Document archival failed:', error);
      throw error;
    }
  }

  private async archiveDocument(document: any): Promise<number> {
    const originalSize = Number(document.fileSize) || 0;

    try {
      // Move file to archive storage
      const archiveKey = this.generateArchiveKey(document.organizationId, document.id, document.fileName);

      if (this.s3Client) {
        // Archive to S3
        await this.archiveToS3(document.fileUrl, archiveKey, originalSize);
      } else {
        // Archive to local storage
        await this.archiveToLocal(document.fileUrl, archiveKey);
      }

      // Update document record
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          isArchived: true,
          archiveDate: new Date(),
          fileUrl: archiveKey, // Update to archive location
          metadata: {
            ...((document.metadata as any) || {}),
            originalFileUrl: document.fileUrl,
            archivedAt: new Date(),
            originalSize,
          },
        },
      });

      return originalSize;
    } catch (error) {
      console.error(`Failed to archive document ${document.id}:`, error);
      throw error;
    }
  }

  private async archiveToS3(sourceUrl: string, archiveKey: string, fileSize: number): Promise<void> {
    if (!this.s3Client) throw new Error('S3 client not initialized');

    const bucketName = process.env.AWS_ARCHIVE_BUCKET || process.env.AWS_S3_BUCKET;
    if (!bucketName) throw new Error('Archive bucket not configured');

    try {
      // Download file from source
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

      const fileBuffer = await response.arrayBuffer();

      // Compress if file is large
      let uploadBuffer = Buffer.from(fileBuffer);
      let shouldCompress = fileSize > this.config.documents.compressThresholdMB * 1024 * 1024;

      if (shouldCompress) {
        uploadBuffer = await this.compressBuffer(uploadBuffer);
        archiveKey += '.gz';
      }

      // Upload to S3 archive bucket
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `archives/${archiveKey}`,
          Body: uploadBuffer,
          StorageClass: 'GLACIER', // Use Glacier for long-term storage
          Metadata: {
            'original-size': fileSize.toString(),
            'compressed': shouldCompress.toString(),
            'archived-at': new Date().toISOString(),
          },
        })
      );

      console.log(`Document archived to S3: ${archiveKey}`);
    } catch (error) {
      console.error('S3 archive failed:', error);
      throw error;
    }
  }

  private async archiveToLocal(sourceUrl: string, archiveKey: string): Promise<void> {
    const archiveDir = process.env.LOCAL_ARCHIVE_PATH || './storage/archives';
    const archivePath = join(archiveDir, archiveKey);

    try {
      // Ensure archive directory exists
      await fs.mkdir(archiveDir, { recursive: true });

      // Download and compress file
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

      const sourceStream = response.body;
      if (!sourceStream) throw new Error('No response body');

      const writeStream = createWriteStream(archivePath + '.gz');
      const gzipStream = createGzip();

      await pipeline(
        sourceStream as any,
        gzipStream,
        writeStream
      );

      console.log(`Document archived locally: ${archivePath}.gz`);
    } catch (error) {
      console.error('Local archive failed:', error);
      throw error;
    }
  }

  private async compressBuffer(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gzip = createGzip();
      const chunks: Buffer[] = [];

      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);

      gzip.write(buffer);
      gzip.end();
    });
  }

  // TASK ARCHIVING
  async archiveTasks(organizationId: string): Promise<ArchiveStats> {
    console.log(`Starting task archival for organization ${organizationId}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.tasks.archiveCompletedAfterDays);

    // Find completed tasks eligible for archiving
    const tasksToArchive = await this.prisma.task.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ['completed', 'cancelled'] },
        completedDate: { lt: cutoffDate },
      },
      include: {
        notes: true,
        engagement: {
          select: { name: true, status: true },
        },
      },
    });

    console.log(`Found ${tasksToArchive.length} tasks eligible for archiving`);

    // Create archive table entries
    const archiveData = tasksToArchive.map((task) => ({
      originalId: task.id,
      organizationId: task.organizationId,
      taskData: task as any,
      archivedAt: new Date(),
      retentionUntil: new Date(Date.now() + this.config.tasks.deleteArchivedAfterYears * 365 * 24 * 60 * 60 * 1000),
    }));

    // Insert into archive table (you would need to create this table)
    // For now, we'll use JSON storage in a metadata field
    await this.prisma.auditLog.createMany({
      data: archiveData.map((data) => ({
        action: 'task_archived',
        entityType: 'task',
        entityId: data.originalId,
        organizationId: data.organizationId,
        metadata: data,
      })),
    });

    // Soft delete the original tasks
    await this.prisma.task.updateMany({
      where: {
        id: { in: tasksToArchive.map((t) => t.id) },
      },
      data: {
        deletedAt: new Date(),
        updatedBy: 'archive_service',
      },
    });

    const stats: ArchiveStats = {
      documentsArchived: 0,
      documentSpaceSaved: 0,
      tasksArchived: tasksToArchive.length,
      invoicesArchived: 0,
      auditLogsArchived: 0,
      totalSpaceSaved: 0,
      archiveDate: new Date(),
    };

    console.log(`Task archival completed. Archived ${tasksToArchive.length} tasks`);

    return stats;
  }

  // INVOICE ARCHIVING
  async archiveInvoices(organizationId: string): Promise<ArchiveStats> {
    console.log(`Starting invoice archival for organization ${organizationId}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.invoices.archivePaidAfterDays);

    const invoicesToArchive = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'paid',
        paidAt: { lt: cutoffDate },
      },
      include: {
        client: { select: { businessName: true } },
        engagement: { select: { name: true } },
      },
    });

    console.log(`Found ${invoicesToArchive.length} invoices eligible for archiving`);

    // Create archive entries
    await this.prisma.auditLog.createMany({
      data: invoicesToArchive.map((invoice) => ({
        action: 'invoice_archived',
        entityType: 'invoice',
        entityId: invoice.id,
        organizationId: invoice.organizationId,
        metadata: {
          originalId: invoice.id,
          invoiceData: invoice,
          archivedAt: new Date(),
          retentionUntil: new Date(Date.now() + this.config.invoices.retentionYears * 365 * 24 * 60 * 60 * 1000),
        },
      })),
    });

    // Update invoices to archived status instead of deleting
    await this.prisma.invoice.updateMany({
      where: {
        id: { in: invoicesToArchive.map((i) => i.id) },
      },
      data: {
        status: 'archived' as any, // You might need to add this to your enum
        updatedBy: 'archive_service',
      },
    });

    const stats: ArchiveStats = {
      documentsArchived: 0,
      documentSpaceSaved: 0,
      tasksArchived: 0,
      invoicesArchived: invoicesToArchive.length,
      auditLogsArchived: 0,
      totalSpaceSaved: 0,
      archiveDate: new Date(),
    };

    console.log(`Invoice archival completed. Archived ${invoicesToArchive.length} invoices`);

    return stats;
  }

  // AUDIT LOG ARCHIVING
  async archiveAuditLogs(organizationId: string): Promise<ArchiveStats> {
    console.log(`Starting audit log archival for organization ${organizationId}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.auditLogs.archiveAfterDays);

    // Archive old audit logs to external storage
    const logsToArchive = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: { lt: cutoffDate },
        action: { notIn: ['task_archived', 'invoice_archived', 'document_archived'] }, // Don't archive our own archive records
      },
      orderBy: { createdAt: 'asc' },
      take: 10000, // Process in batches
    });

    if (logsToArchive.length === 0) {
      console.log('No audit logs to archive');
      return {
        documentsArchived: 0,
        documentSpaceSaved: 0,
        tasksArchived: 0,
        invoicesArchived: 0,
        auditLogsArchived: 0,
        totalSpaceSaved: 0,
        archiveDate: new Date(),
      };
    }

    // Save to archive storage
    const archiveKey = `audit_logs_${organizationId}_${new Date().toISOString().split('T')[0]}.json.gz`;
    const archiveData = {
      organizationId,
      exportDate: new Date(),
      recordCount: logsToArchive.length,
      records: logsToArchive,
    };

    if (this.s3Client) {
      const compressedData = await this.compressBuffer(Buffer.from(JSON.stringify(archiveData)));
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_ARCHIVE_BUCKET || process.env.AWS_S3_BUCKET!,
          Key: `audit_archives/${archiveKey}`,
          Body: compressedData,
          StorageClass: 'GLACIER_IR', // Glacier Instant Retrieval for compliance
        })
      );
    }

    // Delete archived logs
    await this.prisma.auditLog.deleteMany({
      where: {
        id: { in: logsToArchive.map((log) => log.id) },
      },
    });

    const stats: ArchiveStats = {
      documentsArchived: 0,
      documentSpaceSaved: 0,
      tasksArchived: 0,
      invoicesArchived: 0,
      auditLogsArchived: logsToArchive.length,
      totalSpaceSaved: Buffer.from(JSON.stringify(archiveData)).length,
      archiveDate: new Date(),
    };

    console.log(`Audit log archival completed. Archived ${logsToArchive.length} log entries`);

    return stats;
  }

  // COMPREHENSIVE ARCHIVAL
  async performFullArchival(organizationId: string): Promise<ArchiveStats> {
    console.log(`Starting full archival for organization ${organizationId}`);

    const [documentStats, taskStats, invoiceStats, auditStats] = await Promise.all([
      this.archiveDocuments(organizationId),
      this.archiveTasks(organizationId),
      this.archiveInvoices(organizationId),
      this.archiveAuditLogs(organizationId),
    ]);

    const combinedStats: ArchiveStats = {
      documentsArchived: documentStats.documentsArchived,
      documentSpaceSaved: documentStats.documentSpaceSaved,
      tasksArchived: taskStats.tasksArchived,
      invoicesArchived: invoiceStats.invoicesArchived,
      auditLogsArchived: auditStats.auditLogsArchived,
      totalSpaceSaved: documentStats.totalSpaceSaved + auditStats.totalSpaceSaved,
      archiveDate: new Date(),
    };

    // Log archival completion
    await this.prisma.auditLog.create({
      data: {
        action: 'full_archival_completed',
        entityType: 'organization',
        entityId: organizationId,
        organizationId,
        metadata: combinedStats,
      },
    });

    console.log('Full archival completed:', combinedStats);

    return combinedStats;
  }

  // RETRIEVAL METHODS
  async retrieveArchivedDocument(documentId: string): Promise<Buffer | null> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || !document.isArchived) {
      throw new Error('Document not found or not archived');
    }

    const archiveKey = document.fileUrl;

    if (this.s3Client) {
      return this.retrieveFromS3(archiveKey);
    } else {
      return this.retrieveFromLocal(archiveKey);
    }
  }

  private async retrieveFromS3(archiveKey: string): Promise<Buffer> {
    if (!this.s3Client) throw new Error('S3 client not initialized');

    const bucketName = process.env.AWS_ARCHIVE_BUCKET || process.env.AWS_S3_BUCKET;
    if (!bucketName) throw new Error('Archive bucket not configured');

    try {
      const response = await fetch(
        `https://${bucketName}.s3.amazonaws.com/archives/${archiveKey}`
      );

      if (!response.ok) {
        throw new Error(`Failed to retrieve from S3: ${response.statusText}`);
      }

      const compressedData = await response.arrayBuffer();
      return this.decompressBuffer(Buffer.from(compressedData));
    } catch (error) {
      console.error('S3 retrieval failed:', error);
      throw error;
    }
  }

  private async retrieveFromLocal(archiveKey: string): Promise<Buffer> {
    const archiveDir = process.env.LOCAL_ARCHIVE_PATH || './storage/archives';
    const archivePath = join(archiveDir, archiveKey + '.gz');

    try {
      const compressedData = await fs.readFile(archivePath);
      return this.decompressBuffer(compressedData);
    } catch (error) {
      console.error('Local retrieval failed:', error);
      throw error;
    }
  }

  private async decompressBuffer(compressedBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks: Buffer[] = [];

      gunzip.on('data', (chunk) => chunks.push(chunk));
      gunzip.on('end', () => resolve(Buffer.concat(chunks)));
      gunzip.on('error', reject);

      gunzip.write(compressedBuffer);
      gunzip.end();
    });
  }

  // CLEANUP EXPIRED DOCUMENTS
  private async cleanupExpiredDocuments(organizationId: string): Promise<void> {
    const retentionCutoff = new Date();
    retentionCutoff.setFullYear(retentionCutoff.getFullYear() - this.config.documents.retentionYears);

    const expiredDocuments = await this.prisma.document.findMany({
      where: {
        organizationId,
        isArchived: true,
        archiveDate: { lt: retentionCutoff },
      },
    });

    console.log(`Found ${expiredDocuments.length} expired documents to delete`);

    for (const document of expiredDocuments) {
      try {
        // Delete from archive storage
        if (this.s3Client) {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_ARCHIVE_BUCKET || process.env.AWS_S3_BUCKET!,
              Key: `archives/${document.fileUrl}`,
            })
          );
        } else {
          const archiveDir = process.env.LOCAL_ARCHIVE_PATH || './storage/archives';
          const archivePath = join(archiveDir, document.fileUrl + '.gz');
          await fs.unlink(archivePath).catch(() => {}); // Ignore if file doesn't exist
        }

        // Soft delete from database
        await this.prisma.document.update({
          where: { id: document.id },
          data: { deletedAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to delete expired document ${document.id}:`, error);
      }
    }
  }

  // UTILITY METHODS
  private generateArchiveKey(organizationId: string, entityId: string, fileName: string): string {
    const date = new Date().toISOString().split('T')[0];
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${organizationId}/${date}/${entityId}_${sanitizedFileName}`;
  }

  getArchiveJob(jobId: string): ArchiveJob | undefined {
    return this.archiveJobs.get(jobId);
  }

  listArchiveJobs(organizationId?: string): ArchiveJob[] {
    const jobs = Array.from(this.archiveJobs.values());
    return organizationId
      ? jobs.filter((job) => job.organizationId === organizationId)
      : jobs;
  }

  // SCHEDULED ARCHIVAL
  async scheduleArchival(organizationId: string, type: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<void> {
    // Implementation would depend on your job queue system
    console.log(`Scheduled ${type} archival for organization ${organizationId}`);
  }
}

export { ArchiveConfig, ArchiveStats, ArchiveJob };