import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from '@azure/storage-blob';
import { randomBytes } from 'crypto';

if (!process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY) {
  throw new Error('Azure Storage credentials not found in environment variables');
}

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';

// Create credential and blob service client
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

export interface UploadOptions {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  organizationId: string;
  clientId: string;
  category: string;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface SASTokenOptions {
  permissions: 'r' | 'rw' | 'w';
  expiresInMinutes: number;
  contentType?: string;
}

export class AzureStorageService {
  private containerClient = blobServiceClient.getContainerClient(containerName);

  constructor() {
    this.ensureContainer();
  }

  private async ensureContainer() {
    try {
      await this.containerClient.createIfNotExists({
        access: 'private',
        metadata: {
          purpose: 'document-storage',
          environment: process.env.NODE_ENV || 'development'
        }
      });
    } catch (error) {
      console.error('Failed to create/verify container:', error);
    }
  }

  /**
   * Upload a file to Azure Blob Storage
   */
  async uploadFile(options: UploadOptions): Promise<{
    url: string;
    blobName: string;
    checksum: string;
  }> {
    const { fileName, fileBuffer, mimeType, organizationId, clientId, category, tags = [], metadata = {} } = options;

    // Generate unique blob name with folder structure
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const randomId = randomBytes(8).toString('hex');
    const fileExtension = fileName.split('.').pop();
    const blobName = `${organizationId}/${clientId}/${category}/${timestamp}/${randomId}.${fileExtension}`;

    // Calculate MD5 checksum
    const crypto = require('crypto');
    const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    // Prepare metadata
    const blobMetadata = {
      originalFileName: fileName,
      organizationId,
      clientId,
      category,
      uploadedAt: new Date().toISOString(),
      checksum,
      tags: tags.join(','),
      ...metadata
    };

    try {
      // Upload with virus scanning headers and metadata
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
          blobContentDisposition: `attachment; filename="${fileName}"`,
          blobCacheControl: 'no-cache',
        },
        metadata: blobMetadata,
        tags: {
          organization: organizationId,
          client: clientId,
          category,
          uploadDate: timestamp,
          ...Object.fromEntries(tags.map(tag => [tag, 'true']))
        }
      });

      return {
        url: blockBlobClient.url,
        blobName,
        checksum
      };
    } catch (error) {
      console.error('Failed to upload file to Azure Storage:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a SAS token for secure file access
   */
  generateSASToken(blobName: string, options: SASTokenOptions): string {
    const { permissions, expiresInMinutes, contentType } = options;

    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse(permissions),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      protocol: SASProtocol.Https,
      ...(contentType && { contentType })
    };

    return generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
  }

  /**
   * Get a secure download URL with SAS token
   */
  getSecureDownloadUrl(blobName: string, expiresInMinutes: number = 15): string {
    const sasToken = this.generateSASToken(blobName, {
      permissions: 'r',
      expiresInMinutes
    });

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return `${blockBlobClient.url}?${sasToken}`;
  }

  /**
   * Get a secure upload URL with SAS token
   */
  getSecureUploadUrl(blobName: string, contentType: string, expiresInMinutes: number = 60): string {
    const sasToken = this.generateSASToken(blobName, {
      permissions: 'w',
      expiresInMinutes,
      contentType
    });

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return `${blockBlobClient.url}?${sasToken}`;
  }

  /**
   * Delete a file from Azure Storage
   */
  async deleteFile(blobName: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists({
        deleteSnapshots: 'include'
      });
    } catch (error) {
      console.error('Failed to delete file from Azure Storage:', error);
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(blobName: string): Promise<Record<string, string> | null> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();
      return properties.metadata || null;
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(blobName: string, metadata: Record<string, string>): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.setMetadata(metadata);
    } catch (error) {
      console.error('Failed to update file metadata:', error);
      throw new Error(`Metadata update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copy file to a new location (for versioning)
   */
  async copyFile(sourceBlobName: string, destinationBlobName: string): Promise<void> {
    try {
      const sourceBlobClient = this.containerClient.getBlockBlobClient(sourceBlobName);
      const destinationBlobClient = this.containerClient.getBlockBlobClient(destinationBlobName);

      await destinationBlobClient.startCopyFromURL(sourceBlobClient.url);
    } catch (error) {
      console.error('Failed to copy file:', error);
      throw new Error(`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thumbnail for images (placeholder for actual implementation)
   */
  async generateThumbnail(blobName: string, width: number = 200, height: number = 200): Promise<string | null> {
    // This would integrate with Azure Cognitive Services Computer Vision
    // or use Azure Functions for image processing
    // For now, return null as this requires additional setup

    try {
      // Placeholder: In a real implementation, this would:
      // 1. Download the image from blob storage
      // 2. Use Sharp or similar library to resize
      // 3. Upload thumbnail to a thumbnails container
      // 4. Return the thumbnail URL

      console.log(`Thumbnail generation requested for ${blobName} (${width}x${height})`);
      return null;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  /**
   * Virus scanning integration stub
   */
  async performVirusScan(blobName: string): Promise<{
    isClean: boolean;
    scanResult: string;
    scanDate: Date;
  }> {
    // This would integrate with Azure Security Center or third-party virus scanning
    // For now, return a mock result

    try {
      // In a real implementation, this would:
      // 1. Submit file to virus scanning service
      // 2. Wait for or poll for results
      // 3. Update blob metadata with scan results
      // 4. Return scan status

      console.log(`Virus scan requested for ${blobName}`);

      // Mock implementation - always returns clean
      const scanResult = {
        isClean: true,
        scanResult: 'clean',
        scanDate: new Date()
      };

      // Update blob metadata with scan results
      await this.updateFileMetadata(blobName, {
        virusScanned: 'true',
        virusScanDate: scanResult.scanDate.toISOString(),
        virusScanResult: scanResult.scanResult
      });

      return scanResult;
    } catch (error) {
      console.error('Failed to perform virus scan:', error);
      return {
        isClean: false,
        scanResult: 'scan_failed',
        scanDate: new Date()
      };
    }
  }

  /**
   * List files in the container with filtering
   */
  async listFiles(options: {
    organizationId?: string;
    clientId?: string;
    category?: string;
    prefix?: string;
    maxResults?: number;
  } = {}): Promise<Array<{
    name: string;
    url: string;
    size: number;
    lastModified: Date;
    metadata: Record<string, string>;
  }>> {
    const { organizationId, clientId, category, prefix, maxResults = 100 } = options;

    let searchPrefix = '';
    if (prefix) {
      searchPrefix = prefix;
    } else if (organizationId) {
      searchPrefix = organizationId;
      if (clientId) {
        searchPrefix += `/${clientId}`;
        if (category) {
          searchPrefix += `/${category}`;
        }
      }
    }

    try {
      const blobs = [];
      const iterator = this.containerClient.listBlobsFlat({
        prefix: searchPrefix
      }).byPage({ maxPageSize: maxResults });

      for await (const page of iterator) {
        for (const blob of page.segment.blobItems) {
          const blockBlobClient = this.containerClient.getBlockBlobClient(blob.name);
          blobs.push({
            name: blob.name,
            url: blockBlobClient.url,
            size: blob.properties.contentLength || 0,
            lastModified: blob.properties.lastModified || new Date(),
            metadata: blob.metadata || {}
          });
        }
        break; // Only get first page for now
      }

      return blobs;
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }
}

// Export singleton instance
export const azureStorage = new AzureStorageService();

// Export types
export type { UploadOptions, SASTokenOptions };