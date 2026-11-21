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

  describe('Key Normalization & Safety', () => {
    it('normalizes keys to prevent bypass via uppercase or whitespace', async () => {
      const key1 = 'login_email:user@example.com';
      const key2 = 'LOGIN_EMAIL:  User@Example.com  ';

      const norm1 = service.normalizeKey(key1);
      const norm2 = service.normalizeKey(key2);

      expect(norm1).toBe('fh:rl:login_email:user@example.com');
      expect(norm2).toBe('fh:rl:login_email:user@example.com');
      expect(norm1).toBe(norm2);

      // Testing actual enforcement across casing
      await service.assert(key1, 2, 60000);
      await service.assert(key2, 2, 60000);

      // 3rd attempt should be rejected even with different casing
      await expect(service.assert('login_email:USER@EXAMPLE.COM', 2, 60000)).rejects.toThrow();
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
    it('fails closed in production if shared Redis is not configured or connected', async () => {
      process.env.NODE_ENV = 'production';
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
