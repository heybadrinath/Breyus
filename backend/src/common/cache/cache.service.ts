/**
 * Cache Service
 *
 * Provides Redis-based caching with graceful fallback to no-op when Redis is unavailable.
 * Used primarily for analytics data caching to reduce database load.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../mail/redis.provider';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {
    if (this.redis) {
      this.logger.log('CacheService initialized with Redis');
    } else {
      this.logger.warn(
        'CacheService initialized without Redis - caching disabled',
      );
    }
  }

  /**
   * Check if caching is available
   */
  isAvailable(): boolean {
    return this.redis !== null;
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Parsed value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const data = await this.redis.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key "${key}": ${error}`);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttlSeconds Time to live in seconds (default: 900 = 15 minutes)
   */
  async set(key: string, value: any, ttlSeconds: number = 900): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serialized);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key "${key}": ${error}`);
    }
  }

  /**
   * Delete a specific key from cache
   * @param key Cache key to delete
   */
  async delete(key: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key "${key}": ${error}`);
    }
  }

  /**
   * Invalidate all keys matching a pattern
   * @param pattern Pattern to match (e.g., "analytics:company123:*")
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.redis.del(...keys);
      this.logger.log(
        `Cache invalidated ${keys.length} keys matching pattern: ${pattern}`,
      );
      return keys.length;
    } catch (error) {
      this.logger.error(
        `Cache invalidate pattern error for "${pattern}": ${error}`,
      );
      return 0;
    }
  }

  /**
   * Generate a cache key for analytics endpoints
   * @param companyId Company ID
   * @param endpoint Endpoint name (e.g., 'metrics', 'bar-data')
   * @param range Time range (e.g., '7d', '30d')
   * @param extraParams Additional parameters to include in key
   */
  generateAnalyticsKey(
    companyId: string,
    endpoint: string,
    range: string,
    extraParams?: Record<string, string>,
  ): string {
    let key = `analytics:${companyId}:${endpoint}:${range}`;

    if (extraParams) {
      const sortedParams = Object.keys(extraParams)
        .sort()
        .map((k) => `${k}=${extraParams[k]}`)
        .join(':');
      if (sortedParams) {
        key += `:${sortedParams}`;
      }
    }

    return key;
  }

  /**
   * Invalidate all analytics cache for a company
   * @param companyId Company ID
   */
  async invalidateCompanyAnalytics(companyId: string): Promise<number> {
    return this.invalidatePattern(`analytics:${companyId}:*`);
  }

  /**
   * Get or set pattern - retrieves from cache or computes and caches
   * @param key Cache key
   * @param factory Function to compute value if not in cache
   * @param ttlSeconds TTL in seconds
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 900,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    // Cache miss - compute value
    this.logger.debug(`Cache miss: ${key}`);
    const value = await factory();

    // Store in cache
    await this.set(key, value, ttlSeconds);

    return value;
  }
}
