import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!config.redis.enabled) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis connection failed, cache disabled');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('Redis connected', { host: config.redis.host, port: config.redis.port });
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });
  }

  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      await client.connect();
    } catch (error) {
      // Connection will be retried automatically
      logger.warn('Initial Redis connection failed, will retry');
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis disconnected');
  }
}

/**
 * Cache service with TTL and graceful degradation
 */
export class CacheService {
  private defaultTTL: number;

  constructor(ttlSeconds: number = config.redis.ttlSeconds) {
    this.defaultTTL = ttlSeconds;
  }

  /**
   * Get value from cache
   * Returns null if not found or cache unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;

    try {
      const value = await client.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.debug('Cache get failed', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
      const ttl = ttlSeconds ?? this.defaultTTL;
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.debug('Cache set failed', { key, error });
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
      await client.del(key);
    } catch (error) {
      logger.debug('Cache delete failed', { key, error });
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      logger.debug('Cache deletePattern failed', { pattern, error });
    }
  }

  /**
   * Check if cache is available
   */
  async isAvailable(): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

// Cache key generators
export const CacheKeys = {
  flag: (key: string, environment: string) => `flag:${environment}:${key}`,
  flagById: (id: string) => `flag:id:${id}`,
  allFlags: (environment?: string) => environment ? `flags:${environment}` : 'flags:all',
  experiment: (flagId: string) => `experiment:flag:${flagId}`,
};

// Export singleton instance
export const cacheService = new CacheService();
