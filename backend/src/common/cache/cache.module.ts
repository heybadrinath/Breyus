/**
 * Cache Module
 *
 * Provides a shared Redis-based caching service that can be imported by other modules.
 * Reuses the existing Redis provider from the mail module.
 */

import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisProvider } from '../../mail/redis.provider';

@Global()
@Module({
  providers: [RedisProvider, CacheService],
  exports: [CacheService],
})
export class CacheModule {}
