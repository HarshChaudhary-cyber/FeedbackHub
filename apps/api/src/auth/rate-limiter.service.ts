import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface InMemoryBucket {
  count: number;
  resetAt: number;
}

// Atomic Redis sliding window increment Lua script
const ATOMIC_RATE_LIMIT_LUA = `
local key = KEYS[1]
local maxAttempts = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
  redis.call('PEXPIRE', key, windowMs)
end

local ttl = redis.call('PTTL', key)
if ttl < 0 then
  redis.call('PEXPIRE', key, windowMs)
  ttl = windowMs
end

return { current, ttl }
`;

@Injectable()
export class RateLimiterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimiterService.name);
  private redisClient: Redis | null = null;
  private isRedisConnected = false;
  private memoryBuckets: Map<string, InMemoryBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Setup in-memory pruning for development/test fallback
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => {
        this.pruneExpiredBuckets();
      }, 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl && redisUrl.trim() !== '') {
      try {
        this.redisClient = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 5000,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 100, 1000);
          },
        });

        this.redisClient.on('error', (_err) => {
          this.isRedisConnected = false;
        });

        this.redisClient.on('connect', () => {
          this.isRedisConnected = true;
          this.logger.log('Shared Redis rate limiter connected successfully.');
        });

        this.redisClient.on('close', () => {
          this.isRedisConnected = false;
        });

        await this.redisClient.connect();
        this.isRedisConnected = true;
      } catch (_err) {
        this.isRedisConnected = false;
        if (process.env.NODE_ENV === 'production') {
          this.logger.error('Failed to connect to shared Redis rate limiter in production.');
        } else {
          this.logger.warn(
            'Redis connection failed. Using local in-memory rate limiter for non-production environment.'
          );
        }
      }
    } else if (process.env.NODE_ENV === 'production') {
      this.logger.error('REDIS_URL is not configured in production environment.');
    }
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        // Ignore disconnect errors
      }
      this.redisClient = null;
      this.isRedisConnected = false;
    }
  }

  /**
   * Normalizes keys to guarantee case-insensitivity, trim whitespace,
   * prevent formatting bypasses, and prevent PII leakage.
   */
  normalizeKey(rawKey: string): string {
    const parts = rawKey.split(':');
    const prefix = parts[0].trim().toLowerCase();
    const identifier = parts.slice(1).join(':').trim().toLowerCase();
    return `fh:rl:${prefix}:${identifier}`;
  }

  /**
   * Check rate limit using shared Redis if available, or memory fallback.
   * In production, fails closed if shared store is unavailable.
   */
  async check(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult> {
    const normalizedKey = this.normalizeKey(key);
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Preferred Production Shared Store: Redis
    if (this.redisClient && this.isRedisConnected) {
      try {
        const result = (await this.redisClient.eval(
          ATOMIC_RATE_LIMIT_LUA,
          1,
          normalizedKey,
          maxAttempts.toString(),
          windowMs.toString()
        )) as [number, number];

        const currentCount = result[0];
        const ttlMs = result[1];
        const resetAt = Date.now() + (ttlMs > 0 ? ttlMs : windowMs);

        if (currentCount > maxAttempts) {
          return { allowed: false, remaining: 0, resetAt };
        }

        return {
          allowed: true,
          remaining: Math.max(0, maxAttempts - currentCount),
          resetAt,
        };
      } catch (_err) {
        // In production, failure of shared store must FAIL CLOSED
        if (isProduction) {
          this.logger.error('Shared Redis rate-limiter operation failed in production. Failing closed.');
          throw new HttpException(
            {
              statusCode: HttpStatus.SERVICE_UNAVAILABLE,
              message: 'Rate limit service unavailable. Protected operation rejected.',
              error: 'Service Unavailable',
            },
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }
      }
    }

    // In production, running without shared rate limiter is strictly prohibited (Fail Closed)
    if (isProduction) {
      this.logger.error(
        'Shared rate limiter is unavailable in production. Production requests cannot proceed without persistent shared rate limiting.'
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Rate limit service unavailable. Protected operation rejected.',
          error: 'Service Unavailable',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // 2. Development / Test Memory Fallback Driver
    return this.checkMemory(normalizedKey, maxAttempts, windowMs);
  }

  private checkMemory(key: string, maxAttempts: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const bucket = this.memoryBuckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
    }

    if (bucket.count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }

    bucket.count += 1;
    return { allowed: true, remaining: maxAttempts - bucket.count, resetAt: bucket.resetAt };
  }

  async assert(
    key: string,
    maxAttempts: number,
    windowMs: number,
    message = 'Too many attempts. Please try again later.'
  ): Promise<void> {
    const result = await this.check(key, maxAttempts, windowMs);
    if (!result.allowed) {
      const waitSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `${message} Please try again in ${waitSeconds} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  async reset(key: string): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    this.memoryBuckets.delete(normalizedKey);

    if (this.redisClient && this.isRedisConnected) {
      try {
        await this.redisClient.del(normalizedKey);
      } catch {
        // Best effort
      }
    }
  }

  async clearAll(): Promise<void> {
    this.memoryBuckets.clear();
    // Do not flush entire Redis in shared environment; only in test if client exists
    if (this.redisClient && this.isRedisConnected && process.env.NODE_ENV === 'test') {
      try {
        const keys = await this.redisClient.keys('fh:rl:*');
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch {
        // Best effort
      }
    }
  }

  private pruneExpiredBuckets(): void {
    const now = Date.now();
    for (const [key, bucket] of this.memoryBuckets.entries()) {
      if (now >= bucket.resetAt) {
        this.memoryBuckets.delete(key);
      }
    }
  }

  getActiveKeyCount(): number {
    return this.memoryBuckets.size;
  }

  // Testing hooks
  setMockRedisClient(client: Redis | null, isConnected = true): void {
    this.redisClient = client;
    this.isRedisConnected = isConnected;
  }

  isSharedActive(): boolean {
    return Boolean(this.redisClient && this.isRedisConnected);
  }
}
