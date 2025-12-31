import { ReadStream } from 'fs';

/**
 * Storage Service Interface
 * Abstract interface for file storage operations.
 * Implementations can be local filesystem, AWS S3, Cloudinary, etc.
 */
export interface IStorageService {
  /**
   * Upload a file to storage
   * @param file - File buffer to upload
   * @param filename - Original filename
   * @param folder - Destination folder/prefix
   * @returns Path or URL of the uploaded file
   */
  upload(file: Buffer, filename: string, folder: string): Promise<string>;

  /**
   * Get the public URL for a stored file
   * @param path - Storage path of the file
   * @returns Public URL or relative path
   */
  getUrl(path: string): string;

  /**
   * Delete a file from storage
   * @param path - Storage path of the file
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   * @param path - Storage path to check
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get a readable stream for a file
   * @param path - Storage path of the file
   * @returns ReadStream for the file
   */
  getFileStream(path: string): Promise<ReadStream>;
}

/**
 * Storage provider types
 */
export type StorageProvider = 'local' | 's3' | 'cloudinary';

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: StorageProvider;
  basePath?: string; // For local storage
  bucket?: string; // For S3
  cloudName?: string; // For Cloudinary
}
