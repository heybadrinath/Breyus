import { Injectable, Logger } from '@nestjs/common';
import { ReadStream } from 'fs';
import { IStorageService } from './storage.interface';

/**
 * S3 Storage Provider Configuration
 * Set these environment variables to use S3 storage:
 *
 * STORAGE_PROVIDER=s3
 * AWS_ACCESS_KEY_ID=your-access-key
 * AWS_SECRET_ACCESS_KEY=your-secret-key
 * AWS_REGION=us-east-1
 * AWS_S3_BUCKET=your-bucket-name
 */
interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

/**
 * AWS S3 Storage Provider (Skeleton)
 *
 * This is a skeleton implementation for AWS S3 storage.
 * To use S3 storage:
 *
 * 1. Install the AWS SDK: npm install @aws-sdk/client-s3
 * 2. Set the required environment variables
 * 3. Implement the methods below
 *
 * Example implementation with @aws-sdk/client-s3:
 *
 * import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
 */
@Injectable()
export class S3StorageProvider implements IStorageService {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly config: S3Config;
  // private readonly s3Client: S3Client;

  constructor() {
    // Load configuration from environment
    this.config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || '',
    };

    // Validate configuration
    if (!this.config.accessKeyId || !this.config.secretAccessKey || !this.config.bucket) {
      this.logger.error('S3 configuration incomplete. Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET');
      throw new Error('S3 storage provider not configured. Check environment variables.');
    }

    // Initialize S3 client (uncomment when implementing)
    // this.s3Client = new S3Client({
    //   region: this.config.region,
    //   credentials: {
    //     accessKeyId: this.config.accessKeyId,
    //     secretAccessKey: this.config.secretAccessKey,
    //   },
    // });

    this.logger.log(`S3 storage provider initialized for bucket: ${this.config.bucket}`);
  }

  /**
   * Upload a file to S3
   *
   * Implementation example:
   * const command = new PutObjectCommand({
   *   Bucket: this.config.bucket,
   *   Key: `${folder}/${uniqueFilename}`,
   *   Body: file,
   *   ContentType: getMimeType(filename),
   * });
   * await this.s3Client.send(command);
   * return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${folder}/${uniqueFilename}`;
   */
  async upload(file: Buffer, filename: string, folder: string): Promise<string> {
    // TODO: Implement S3 upload
    throw new Error('S3 upload not yet implemented. Please use local storage or implement this method.');

    // Uncomment and implement:
    // const uniqueFilename = `${Date.now()}-${this.sanitizeFilename(filename)}`;
    // const key = `${folder}/${uniqueFilename}`;
    //
    // const command = new PutObjectCommand({
    //   Bucket: this.config.bucket,
    //   Key: key,
    //   Body: file,
    // });
    //
    // await this.s3Client.send(command);
    //
    // return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Get the public URL for an S3 object
   */
  getUrl(path: string): string {
    // For S3, the path IS the URL if we stored it as a full URL
    // Or construct it from the key
    if (path.startsWith('https://')) {
      return path;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com${path}`;
  }

  /**
   * Delete a file from S3
   *
   * Implementation example:
   * const command = new DeleteObjectCommand({
   *   Bucket: this.config.bucket,
   *   Key: this.extractKeyFromPath(path),
   * });
   * await this.s3Client.send(command);
   */
  async delete(path: string): Promise<void> {
    // TODO: Implement S3 delete
    throw new Error('S3 delete not yet implemented');

    // Uncomment and implement:
    // const key = this.extractKeyFromPath(path);
    // const command = new DeleteObjectCommand({
    //   Bucket: this.config.bucket,
    //   Key: key,
    // });
    // await this.s3Client.send(command);
  }

  /**
   * Check if a file exists in S3
   *
   * Implementation example:
   * try {
   *   const command = new HeadObjectCommand({
   *     Bucket: this.config.bucket,
   *     Key: this.extractKeyFromPath(path),
   *   });
   *   await this.s3Client.send(command);
   *   return true;
   * } catch (error) {
   *   if (error.name === 'NotFound') return false;
   *   throw error;
   * }
   */
  async exists(path: string): Promise<boolean> {
    // TODO: Implement S3 exists check
    throw new Error('S3 exists check not yet implemented');

    // Uncomment and implement:
    // try {
    //   const key = this.extractKeyFromPath(path);
    //   const command = new HeadObjectCommand({
    //     Bucket: this.config.bucket,
    //     Key: key,
    //   });
    //   await this.s3Client.send(command);
    //   return true;
    // } catch (error) {
    //   if (error.name === 'NotFound') return false;
    //   throw error;
    // }
  }

  /**
   * Get a readable stream for an S3 object
   *
   * Implementation example:
   * const command = new GetObjectCommand({
   *   Bucket: this.config.bucket,
   *   Key: this.extractKeyFromPath(path),
   * });
   * const response = await this.s3Client.send(command);
   * return response.Body as ReadStream;
   */
  async getFileStream(path: string): Promise<ReadStream> {
    // TODO: Implement S3 stream retrieval
    throw new Error('S3 file stream not yet implemented');

    // Uncomment and implement:
    // const key = this.extractKeyFromPath(path);
    // const command = new GetObjectCommand({
    //   Bucket: this.config.bucket,
    //   Key: key,
    // });
    // const response = await this.s3Client.send(command);
    // return response.Body as ReadStream;
  }

  /**
   * Extract S3 key from full URL or path
   */
  private extractKeyFromPath(path: string): string {
    if (path.startsWith('https://')) {
      // Extract key from full S3 URL
      const url = new URL(path);
      return url.pathname.slice(1); // Remove leading /
    }
    // Assume it's already a key (remove leading /)
    return path.replace(/^\//, '');
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 200);
  }
}
