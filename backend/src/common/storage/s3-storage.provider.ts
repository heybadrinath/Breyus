import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { IStorageService } from './storage.interface';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * S3 Storage Provider Configuration
 *
 * Works with any S3-compatible storage:
 * - DigitalOcean Spaces
 * - AWS S3
 * - Vultr Object Storage
 * - MinIO
 * - Cloudflare R2
 *
 * Environment Variables:
 *
 * STORAGE_PROVIDER=s3
 * S3_ENDPOINT=https://sgp1.digitaloceanspaces.com   (DigitalOcean/Vultr/etc) or omit for AWS
 * S3_REGION=sgp1                               (or us-east-1 for AWS)
 * S3_ACCESS_KEY=your-access-key
 * S3_SECRET_KEY=your-secret-key
 * S3_BUCKET=breyus-uploads
 */
interface S3Config {
  endpoint?: string; // Custom endpoint for S3-compatible storage (DigitalOcean, Vultr, etc.)
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle: boolean; // Required for most S3-compatible services
}

@Injectable()
export class S3StorageProvider implements IStorageService {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly config: S3Config;
  private readonly s3Client: S3Client;

  constructor() {
    // Load configuration from environment
    this.config = {
      endpoint: process.env.S3_ENDPOINT, // undefined for AWS, set for DigitalOcean/Vultr/etc
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
      bucket: process.env.S3_BUCKET || process.env.S3_BUCKET_UPLOADS || '',
      forcePathStyle:
        process.env.S3_FORCE_PATH_STYLE === 'true' || !!process.env.S3_ENDPOINT,
    };

    // Validate configuration
    if (
      !this.config.accessKeyId ||
      !this.config.secretAccessKey ||
      !this.config.bucket
    ) {
      this.logger.error(
        'S3 configuration incomplete. Required: S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET (or S3_BUCKET_UPLOADS)',
      );
      throw new Error(
        'S3 storage provider not configured. Check environment variables.',
      );
    }

    // Initialize S3 client
    const clientConfig: any = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: this.config.forcePathStyle,
    };

    // Add custom endpoint for S3-compatible services (Vultr, DigitalOcean, etc.)
    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
    }

    this.s3Client = new S3Client(clientConfig);

    const providerName = this.config.endpoint ? 'S3-compatible' : 'AWS S3';
    this.logger.log(
      `${providerName} storage provider initialized for bucket: ${this.config.bucket}` +
        (this.config.endpoint ? ` at ${this.config.endpoint}` : ''),
    );
  }

  /**
   * Upload a file to S3
   * @param file - Buffer containing file data
   * @param filename - Original filename (will be sanitized)
   * @param folder - Folder/prefix in the bucket
   * @returns Full URL to the uploaded file
   */
  async upload(
    file: Buffer,
    filename: string,
    folder: string,
  ): Promise<string> {
    const uniqueFilename = `${Date.now()}-${this.sanitizeFilename(filename)}`;
    const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file,
        ContentType: this.getMimeType(filename),
      });

      await this.s3Client.send(command);

      // Return the full URL
      const url = this.buildUrl(key);
      this.logger.debug(`File uploaded: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to upload file ${filename}: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get the public URL for an S3 object
   */
  getUrl(path: string): string {
    // If already a full URL, return as-is
    if (path.startsWith('https://') || path.startsWith('http://')) {
      return path;
    }
    return this.buildUrl(path);
  }

  /**
   * Delete a file from S3
   */
  async delete(path: string): Promise<void> {
    const key = this.extractKeyFromPath(path);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.debug(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${path}: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in S3
   */
  async exists(path: string): Promise<boolean> {
    const key = this.extractKeyFromPath(path);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      this.logger.error(
        `Failed to check file existence ${path}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get a readable stream for an S3 object
   * Note: Returns a Readable stream (Node.js stream), not fs.ReadStream
   */
  async getFileStream(path: string): Promise<any> {
    const key = this.extractKeyFromPath(path);

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // S3 SDK v3 returns a Readable stream or web ReadableStream
      if (response.Body) {
        // Convert to Node.js Readable if needed
        if (response.Body instanceof Readable) {
          return response.Body;
        }
        // For web streams, convert to Node.js stream
        return Readable.from(response.Body as any);
      }

      throw new Error(`File not found: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to get file stream ${path}: ${error.message}`);
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  /**
   * Build the public URL for an S3 object
   */
  private buildUrl(key: string): string {
    // Remove leading slash if present
    const cleanKey = key.replace(/^\//, '');

    if (this.config.endpoint) {
      // For S3-compatible services (Vultr, DigitalOcean, etc.)
      // URL format: https://endpoint/bucket/key
      return `${this.config.endpoint}/${this.config.bucket}/${cleanKey}`;
    }

    // For AWS S3
    // URL format: https://bucket.s3.region.amazonaws.com/key
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${cleanKey}`;
  }

  /**
   * Extract S3 key from full URL or path
   */
  private extractKeyFromPath(path: string): string {
    if (path.startsWith('https://') || path.startsWith('http://')) {
      try {
        const url = new URL(path);
        let pathname = url.pathname;

        // For path-style URLs (endpoint/bucket/key), remove bucket prefix
        if (
          this.config.endpoint &&
          pathname.startsWith(`/${this.config.bucket}/`)
        ) {
          pathname = pathname.slice(this.config.bucket.length + 2);
        }

        return pathname.replace(/^\//, ''); // Remove leading slash
      } catch {
        // If URL parsing fails, treat as key
        return path.replace(/^\//, '');
      }
    }

    // Assume it's already a key
    return path.replace(/^\//, '');
  }

  /**
   * Sanitize filename to prevent directory traversal and invalid characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/\.{2,}/g, '.') // Prevent multiple dots (path traversal)
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .substring(0, 200); // Limit length
  }

  /**
   * Get MIME type from filename extension
   */
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      txt: 'text/plain',
      // Archives
      zip: 'application/zip',
      // JSON
      json: 'application/json',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
