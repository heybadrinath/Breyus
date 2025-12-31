import { Injectable, Logger } from '@nestjs/common';
import { ReadStream } from 'fs';
import { IStorageService, StorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local-storage.provider';

/**
 * Storage Service
 *
 * Facade for file storage operations.
 * Supports multiple storage providers (local, S3, Cloudinary)
 * configured via environment variable STORAGE_PROVIDER.
 *
 * Usage:
 *   STORAGE_PROVIDER=local (default) - Uses local filesystem
 *   STORAGE_PROVIDER=s3 - Uses AWS S3 (requires AWS credentials)
 *   STORAGE_PROVIDER=cloudinary - Uses Cloudinary (requires API key)
 */
@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: IStorageService;
  private readonly providerType: StorageProvider;

  constructor() {
    // Determine storage provider from environment
    this.providerType = (process.env.STORAGE_PROVIDER as StorageProvider) || 'local';

    // Initialize the appropriate provider
    switch (this.providerType) {
      case 's3':
        // TODO: Implement S3 provider when needed
        // this.provider = new S3StorageProvider();
        this.logger.warn('S3 storage provider not yet implemented, falling back to local');
        this.provider = new LocalStorageProvider();
        break;

      case 'cloudinary':
        // TODO: Implement Cloudinary provider when needed
        // this.provider = new CloudinaryStorageProvider();
        this.logger.warn('Cloudinary storage provider not yet implemented, falling back to local');
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
   * Upload a file
   */
  async upload(file: Buffer, filename: string, folder: string): Promise<string> {
    this.logger.debug(`Uploading file: ${filename} to folder: ${folder}`);
    return this.provider.upload(file, filename, folder);
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
