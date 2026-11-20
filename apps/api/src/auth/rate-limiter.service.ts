import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimiterService {
  private buckets: Map<string, RateLimitBucket> = new Map();

  check(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
    }

    if (bucket.count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }

    bucket.count += 1;
    return { allowed: true, remaining: maxAttempts - bucket.count, resetAt: bucket.resetAt };
  }

  assert(
    key: string,
    maxAttempts: number,
    windowMs: number,
    message = 'Too many attempts. Please try again later.'
  ): void {
    const result = this.check(key, maxAttempts, windowMs);
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

  reset(key: string): void {
    this.buckets.delete(key);
  }

  clearAll(): void {
    this.buckets.clear();
  }
}
