import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Storage Module
 *
 * Global module that provides storage services throughout the application.
 * Import this module once in AppModule to make StorageService available everywhere.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
