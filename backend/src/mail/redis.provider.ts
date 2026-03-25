import { Provider, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: async (): Promise<Redis | null> => {
    const logger = new Logger('RedisProvider');
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn(
        'REDIS_URL not configured. Using in-memory OTP storage (development mode).',
      );
      return null;
    }

    try {
      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        enableReadyCheck: true,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      });

      redis.on('connect', () => {
        logger.log('Redis connected successfully');
      });

      redis.on('error', (err) => {
        logger.error(`Redis connection error: ${err.message}`);
      });

      redis.on('close', () => {
        logger.warn('Redis connection closed');
      });

      // Test connection with ping
      await redis.ping();
      logger.log('Redis PING successful - connection verified');

      return redis;
    } catch (error) {
      logger.error(`Failed to connect to Redis: ${error}`);
      logger.warn('Falling back to in-memory OTP storage');
      return null;
    }
  },
};
