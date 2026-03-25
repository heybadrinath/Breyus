import { Injectable, Logger } from '@nestjs/common';
import { ReadStream } from 'fs';
import { IStorageService, StorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

/**
 * Storage Service
 *
 * Facade for file storage operations.
 * Supports multiple storage providers (local, S3, Cloudinary)
 * configured via environment variable STORAGE_PROVIDER.
 *
 * Usage:
 *   STORAGE_PROVIDER=local (default) - Uses local filesystem
 *   STORAGE_PROVIDER=s3 - Uses S3-compatible storage (AWS, Vultr, DigitalOcean, etc.)
 *   STORAGE_PROVIDER=cloudinary - Uses Cloudinary (requires API key)
 *
 * For S3/DigitalOcean Spaces, set these environment variables:
 *   S3_ENDPOINT=https://sgp1.digitaloceanspaces.com  (omit for AWS S3)
 *   S3_REGION=sgp1
 *   S3_ACCESS_KEY=your-access-key
 *   S3_SECRET_KEY=your-secret-key
 *   S3_BUCKET=breyus-uploads
 */
@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: IStorageService;
  private readonly providerType: StorageProvider;

  constructor() {
    // Determine storage provider from environment
    this.providerType =
      (process.env.STORAGE_PROVIDER as StorageProvider) || 'local';

    // Initialize the appropriate provider
    switch (this.providerType) {
      case 's3':
        try {
          this.provider = new S3StorageProvider();
          this.logger.log(
            'Using S3-compatible storage provider (DigitalOcean/AWS/Vultr)',
          );
        } catch (error) {
          this.logger.error(
            `Failed to initialize S3 provider: ${error.message}`,
          );
          this.logger.warn('Falling back to local storage provider');
          this.provider = new LocalStorageProvider();
        }
        break;

      case 'cloudinary':
        // TODO: Implement Cloudinary provider when needed
        this.logger.warn(
          'Cloudinary storage provider not yet implemented, falling back to local',
        );
        this.provider = new LocalStorageProvider();
        break;

      case 'local':
      default:
        this.provider = new LocalStorageProvider();
        this.logger.log('Using local storage provider');
        break;
    }
  }

  /**
   * SECURITY FIX: Sanitize filename to prevent path traversal attacks (Audit Bug - Path Traversal)
   * Removes dangerous characters that could allow directory escape or file system manipulation
   */
  private sanitizeFilename(filename: string): string {
    if (!filename) {
      return `unnamed-${Date.now()}`;
    }

    // Remove path traversal sequences
    let sanitized = filename
      .replace(/\.\./g, '') // Remove .. sequences
      .replace(/[\/\\]/g, '_') // Replace path separators with underscore
      // Remove dangerous characters (Windows forbidden + null bytes + control chars)
      .replace(/[<>:"|?*\x00-\x1f]/g, '_')
      // Remove leading/trailing dots and spaces (Windows issues)
      .replace(/^[\s.]+|[\s.]+$/g, '')
      // Collapse multiple underscores/dashes
      .replace(/[_-]{2,}/g, '_');

    // Limit filename length to prevent filesystem issues
    if (sanitized.length > 200) {
      // Preserve extension if present
      const lastDot = sanitized.lastIndexOf('.');
      if (lastDot > 0 && lastDot > sanitized.length - 10) {
        const extension = sanitized.substring(lastDot);
        sanitized = sanitized.substring(0, 200 - extension.length) + extension;
      } else {
        sanitized = sanitized.substring(0, 200);
      }
    }

    // Fallback if filename is empty after sanitization
    if (!sanitized || sanitized.length === 0) {
      return `unnamed-${Date.now()}`;
    }

    return sanitized;
  }

  /**
   * Upload a file
   * SECURITY FIX: Filename is now sanitized to prevent path traversal (Audit Bug - Path Traversal)
   */
  async upload(
    file: Buffer,
    filename: string,
    folder: string,
  ): Promise<string> {
    // SECURITY: Sanitize filename before upload
    const sanitizedFilename = this.sanitizeFilename(filename);
    this.logger.debug(
      `Uploading file: ${sanitizedFilename} (original: ${filename}) to folder: ${folder}`,
    );
    return this.provider.upload(file, sanitizedFilename, folder);
  }

  /**
   * Get file URL
   */
  getUrl(path: string): string {
    return this.provider.getUrl(path);
  }

  /**
   * Delete a file
   */
  async delete(path: string): Promise<void> {
    this.logger.debug(`Deleting file: ${path}`);
    return this.provider.delete(path);
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    return this.provider.exists(path);
  }

  /**
   * Get a readable stream for a file
   */
  async getFileStream(path: string): Promise<ReadStream> {
    this.logger.debug(`Getting file stream for: ${path}`);
    return this.provider.getFileStream(path);
  }

  /**
   * Get current provider type
   */
  getProviderType(): StorageProvider {
    return this.providerType;
  }
}
