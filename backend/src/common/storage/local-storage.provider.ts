import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageService } from './storage.interface';

/**
 * Local File System Storage Provider
 * Stores files in the local uploads directory
 */
@Injectable()
export class LocalStorageProvider implements IStorageService {
  private readonly basePath: string;

  constructor() {
    // Base path for local storage (relative to backend root)
    this.basePath = path.join(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.basePath);
  }

  /**
   * Upload a file to local storage
   */
  async upload(
    file: Buffer,
    filename: string,
    folder: string,
  ): Promise<string> {
    // Create unique filename with timestamp
    const uniqueFilename = `${Date.now()}-${this.sanitizeFilename(filename)}`;

    // Full folder path
    const folderPath = path.join(this.basePath, folder);
    this.ensureDirectoryExists(folderPath);

    // Full file path
    const filePath = path.join(folderPath, uniqueFilename);

    // Write file
    await fs.promises.writeFile(filePath, file);

    // Return relative path (for database storage)
    return `/uploads/${folder}/${uniqueFilename}`;
  }

  /**
   * Get the URL for a file (for local storage, returns the path as-is)
   */
  getUrl(storagePath: string): string {
    // For local storage, the path is already relative to the server root
    // The frontend should prepend the backend URL
    return storagePath;
  }

  /**
   * Delete a file from storage
   */
  async delete(storagePath: string): Promise<void> {
    // Convert relative path to absolute
    const absolutePath = path.join(
      process.cwd(),
      storagePath.replace(/^\//, ''),
    );

    if (await this.exists(storagePath)) {
      await fs.promises.unlink(absolutePath);
    }
  }

  /**
   * Check if a file exists
   */
  async exists(storagePath: string): Promise<boolean> {
    const absolutePath = path.join(
      process.cwd(),
      storagePath.replace(/^\//, ''),
    );
    try {
      await fs.promises.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a readable stream for a file
   */
  async getFileStream(storagePath: string): Promise<fs.ReadStream> {
    const absolutePath = path.join(
      process.cwd(),
      storagePath.replace(/^\//, ''),
    );

    // Check if file exists
    if (!(await this.exists(storagePath))) {
      throw new Error(`File not found: ${storagePath}`);
    }

    return fs.createReadStream(absolutePath);
  }

  /**
   * Ensure a directory exists, create if it doesn't
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Sanitize filename to prevent directory traversal and invalid characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/\.{2,}/g, '.') // Prevent multiple dots
      .substring(0, 200); // Limit length
  }
}
