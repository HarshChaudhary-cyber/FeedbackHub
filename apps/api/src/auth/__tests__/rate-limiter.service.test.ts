import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiterService } from '../rate-limiter.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import type Redis from 'ioredis';

describe('RateLimiterService (Shared & Fail-Closed Strategy)', () => {
  let service: RateLimiterService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    service = new RateLimiterService();
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await service.onModuleDestroy();
    vi.restoreAllMocks();
  });

  describe('Key Normalization & PII Privacy', () => {
    it('does not expose raw email identifiers in normalized/generated Redis keys', () => {
      const email = 'sensitive.user@example.com';
      const key = service.normalizeKey(`login_email:${email}`);

      expect(key).not.toContain(email);
      expect(key).not.toContain('sensitive.user');
      expect(key).not.toContain('example.com');
      expect(key).toMatch(/^fh:rl:login_email:[0-9a-f]{64}$/);
    });

    it('does not expose raw IP identifiers (IPv4 and IPv6) in generated keys', () => {
      const ipv4 = '198.51.100.42';
      const key4 = service.normalizeKey(`login_ip:${ipv4}`);
      expect(key4).not.toContain(ipv4);
      expect(key4).toMatch(/^fh:rl:login_ip:[0-9a-f]{64}$/);

      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const key6 = service.normalizeKey(`login_ip:${ipv6}`);
      expect(key6).not.toContain(ipv6);
      expect(key6).not.toContain('2001');
      expect(key6).toMatch(/^fh:rl:login_ip:[0-9a-f]{64}$/);
    });

    it('produces identical keys for equivalent email addresses despite casing and whitespace', async () => {
      const key1 = 'login_email:user@example.com';
      const key2 = 'LOGIN_EMAIL:  User@Example.com  ';
      const key3 = 'login_email:USER@EXAMPLE.COM';

      const norm1 = service.normalizeKey(key1);
      const norm2 = service.normalizeKey(key2);
      const norm3 = service.normalizeKey(key3);

      expect(norm1).toBe(norm2);
      expect(norm2).toBe(norm3);
      expect(norm1).toMatch(/^fh:rl:login_email:[0-9a-f]{64}$/);

      // Testing actual enforcement across casing
      await service.assert(key1, 2, 60000);
      await service.assert(key2, 2, 60000);

      // 3rd attempt should be rejected even with different casing
      await expect(service.assert(key3, 2, 60000)).rejects.toThrow();
    });

    it('generates deterministic keys across multiple service instances with the same configuration', () => {
      const instance1 = new RateLimiterService();
      const instance2 = new RateLimiterService();

      const key = 'login_email:cluster.node@example.com';
      const norm1 = instance1.normalizeKey(key);
      const norm2 = instance2.normalizeKey(key);

      expect(norm1).toBe(norm2);

      // Custom secret configured consistently across instances
      process.env.RATE_LIMIT_SECRET = 'cluster-wide-custom-secret-key-64-bytes-long-padding-example';
      const customInst1 = new RateLimiterService();
      const customInst2 = new RateLimiterService();

      const customNorm1 = customInst1.normalizeKey(key);
      const customNorm2 = customInst2.normalizeKey(key);

      expect(customNorm1).toBe(customNorm2);
      expect(customNorm1).not.toBe(norm1); // Different from default fallback
    });

    it('produces different keys for different identifiers under the same action', () => {
      const keyA = service.normalizeKey('login_email:alice@example.com');
      const keyB = service.normalizeKey('login_email:bob@example.com');

      expect(keyA).not.toBe(keyB);
      expect(keyA.startsWith('fh:rl:login_email:')).toBe(true);
      expect(keyB.startsWith('fh:rl:login_email:')).toBe(true);
    });

    it('is idempotent when normalizing already-normalized keys', () => {
      const original = 'login_email:test@example.com';
      const normalized = service.normalizeKey(original);
      const doubleNormalized = service.normalizeKey(normalized);

      expect(doubleNormalized).toBe(normalized);
    });
  });

  describe('In-Memory Driver (Dev/Test Fallback)', () => {
    it('allows requests within limit and throttles excess attempts', async () => {
      const key = 'test_ip:127.0.0.1';
      const res1 = await service.check(key, 2, 1000);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(1);

      const res2 = await service.check(key, 2, 1000);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(0);

      const res3 = await service.check(key, 2, 1000);
      expect(res3.allowed).toBe(false);
      expect(res3.remaining).toBe(0);
    });

    it('resets counters after manual reset call', async () => {
      const key = 'test_reset:127.0.0.1';
      await service.check(key, 1, 60000);
      expect((await service.check(key, 1, 60000)).allowed).toBe(false);

      await service.reset(key);
      expect((await service.check(key, 1, 60000)).allowed).toBe(true);
    });
  });

  describe('Production Fail-Closed Guardrails', () => {
    it('fails closed in production if RATE_LIMIT_SECRET is missing or invalid', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.RATE_LIMIT_SECRET;

      const prodService = new RateLimiterService();
      try {
        await prodService.assert('login_ip:1.2.3.4', 5, 60000);
        expect.unreachable('Should have thrown in production without RATE_LIMIT_SECRET');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }
    });

    it('fails closed in production if shared Redis is not configured or connected', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RATE_LIMIT_SECRET = 'valid-production-rate-limit-secret-key-min-64-characters-example';
      delete process.env.REDIS_URL;

      const prodService = new RateLimiterService();
      await prodService.onModuleInit();

      try {
        await prodService.assert('login_ip:1.2.3.4', 5, 60000);
        expect.unreachable('Should have thrown in production without shared store');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }
    });

    it('fails closed in production when Redis operation throws an error', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RATE_LIMIT_SECRET = 'valid-production-rate-limit-secret-key-min-64-characters-example';
      const prodService = new RateLimiterService();

      const mockRedis = {
        eval: vi.fn().mockRejectedValue(new Error('Redis connection timeout')),
      } as unknown as Redis;

      prodService.setMockRedisClient(mockRedis, true);

      try {
        await prodService.check('login_ip:1.2.3.4', 5, 60000);
        expect.unreachable('Should have failed closed');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }
    });
  });

  describe('Shared Redis Store Driver (Mock Integration)', () => {
    it('sends the expected HMAC-hashed key to Redis and preserves Lua script arguments', async () => {
      const mockEval = vi.fn().mockResolvedValue([1, 59900]);
      const mockRedis = {
        eval: mockEval,
      } as unknown as Redis;

      service.setMockRedisClient(mockRedis, true);
      const rawIdentifier = 'confidential.investor@example.com';
      const result = await service.check(`login_email:${rawIdentifier}`, 5, 60000);

      expect(mockEval).toHaveBeenCalledTimes(1);
      const calledKey = mockEval.mock.calls[0][2];
      expect(calledKey).toMatch(/^fh:rl:login_email:[0-9a-f]{64}$/);
      expect(calledKey).not.toContain(rawIdentifier);
      expect(calledKey).toBe(service.normalizeKey(`login_email:${rawIdentifier}`));
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('executes atomic Lua script and parses counter and TTL', async () => {
      const mockEval = vi.fn().mockResolvedValue([1, 59900]);
      const mockRedis = {
        eval: mockEval,
      } as unknown as Redis;

      service.setMockRedisClient(mockRedis, true);
      const result = await service.check('reg_ip:198.51.100.1', 5, 60000);

      expect(mockEval).toHaveBeenCalledTimes(1);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('denies access when Redis atomic counter exceeds limit', async () => {
      const mockEval = vi.fn().mockResolvedValue([6, 45000]); // 6th attempt on limit 5
      const mockRedis = {
        eval: mockEval,
      } as unknown as Redis;

      service.setMockRedisClient(mockRedis, true);
      const result = await service.check('reg_ip:198.51.100.1', 5, 60000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});
