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

  describe('Anti-Bypass & Hash Integrity', () => {
    it('does not trust an arbitrary string matching the former normalized-key regex', () => {
      const forged64Hex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const arbitraryString = `fh:rl:login_email:${forged64Hex}`;

      const derivedKey = service.normalizeKey(arbitraryString);

      // Must NOT return the arbitrary input string as if it were a pre-normalized key
      expect(derivedKey).not.toBe(arbitraryString);
      // The forged 64-hex component must NOT appear directly in the output
      expect(derivedKey).not.toBe(`fh:rl:login_email:${forged64Hex}`);
      // The identifier must be cryptographically hashed using HMAC-SHA256
      const expectedHmac = service.hashIdentifier(forged64Hex);
      expect(derivedKey).toBe(`fh:rl:login_email:${expectedHmac}`);
    });

    it('correctly protects a raw identifier containing 64 hexadecimal characters', () => {
      const hex64 = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const key = service.normalizeKey(`reset_token:${hex64}`);

      expect(key).not.toContain(hex64);
      expect(key).toBe(`fh:rl:reset_token:${service.hashIdentifier(hex64)}`);
      expect(key).toMatch(/^fh:rl:reset_token:[0-9a-f]{64}$/);
    });

    it('ensures no raw identifier can bypass HMAC hashing by prefixing it with fh:rl:', () => {
      const rawEmail = 'infiltrator@example.com';
      const prefixedKey = `fh:rl:login_email:${rawEmail}`;
      const standardKey = `login_email:${rawEmail}`;

      const derivedPrefixed = service.normalizeKey(prefixedKey);
      const derivedStandard = service.normalizeKey(standardKey);

      // Both produce the same secure key with hashed identifier
      expect(derivedPrefixed).toBe(derivedStandard);
      expect(derivedPrefixed).not.toContain(rawEmail);
      expect(derivedPrefixed).toBe(`fh:rl:login_email:${service.hashIdentifier(rawEmail)}`);
    });

    it('guarantees the resulting Redis key does not contain the original sensitive value', () => {
      const sensitiveValues = [
        'ceo.executive@feedbackhub.com',
        '192.168.100.254',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        'raw-reset-token-secret-64-character-string-1234567890abcdef1234567890',
      ];

      for (const val of sensitiveValues) {
        const key = service.normalizeKey(`auth_action:${val}`);
        expect(key).not.toContain(val);
        expect(key).toMatch(/^fh:rl:auth_action:[0-9a-f]{64}$/);
      }
    });
  });

  describe('Malformed Input Privacy & Anti-Spoofing Hardening (Phase 4.2.3)', () => {
    it('safely hashes a raw email provided without a colon into the generic namespace', () => {
      const rawEmail = 'victim@example.com';
      const key = service.normalizeKey(rawEmail);

      // Must NEVER embed raw email in Redis key
      expect(key).not.toContain(rawEmail);
      expect(key).not.toContain('victim');
      expect(key).not.toContain('example.com');
      // Must be safely routed to generic HMAC pathway
      expect(key).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(key).toBe(`fh:rl:generic:${service.hashIdentifier(rawEmail)}`);
    });

    it('safely hashes a raw token provided without a colon into the generic namespace', () => {
      const rawToken = 'super-secret-password-reset-token-12345';
      const key = service.normalizeKey(rawToken);

      expect(key).not.toContain(rawToken);
      expect(key).not.toContain('token');
      expect(key).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(key).toBe(`fh:rl:generic:${service.hashIdentifier(rawToken)}`);
    });

    it('prevents email addresses from being embedded as action names (user@example.com:login)', () => {
      const malformedInput = 'user@example.com:login';
      const key = service.normalizeKey(malformedInput);

      expect(key).not.toContain('user@example.com');
      expect(key).not.toContain('user');
      expect(key).not.toContain('example.com');
      expect(key).not.toContain('login');
      // Action is invalid -> routed to generic HMAC pathway
      expect(key).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(key.startsWith('fh:rl:user@example.com')).toBe(false);
    });

    it('prevents spoofing of legitimate action namespaces with invalid action names', () => {
      const input1 = 'login:user@example.com'; // 'login' is not a supported namespace
      const key1 = service.normalizeKey(input1);

      expect(key1).not.toContain('user@example.com');
      expect(key1).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(key1.startsWith('fh:rl:login_email:')).toBe(false);

      const input2 = 'reset:raw-token-value'; // 'reset' is not supported (reset_token is)
      const key2 = service.normalizeKey(input2);

      expect(key2).not.toContain('raw-token-value');
      expect(key2).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(key2.startsWith('fh:rl:reset_token:')).toBe(false);
    });

    it('handles empty strings and whitespace without creating unhashed keys', () => {
      const emptyKeys = ['', '   ', 'fh:rl:', 'fh:rl:   '];

      for (const raw of emptyKeys) {
        const key = service.normalizeKey(raw);
        expect(key).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
        expect(key).toBe(`fh:rl:generic:${service.hashIdentifier('')}`);
      }
    });

    it('routes inputs with missing identifiers to the generic namespace', () => {
      const key = service.normalizeKey('login_email:');

      // Cannot pollute or collide with valid accounts under login_email
      expect(key).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(key.startsWith('fh:rl:login_email:')).toBe(false);
    });

    it('hashes arbitrary data following fh:rl: prefixes without leaking data', () => {
      const raw = 'fh:rl:login:arbitrary-sensitive-data-value';
      const key = service.normalizeKey(raw);

      expect(key).not.toContain('arbitrary-sensitive-data-value');
      expect(key).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
    });

    it('handles extremely long inputs safely without memory or length explosion', () => {
      const hugeEmail = 'a'.repeat(10000) + '@example.com';
      const keyValid = service.normalizeKey(`login_email:${hugeEmail}`);

      expect(keyValid.length).toBeLessThan(100);
      expect(keyValid).toMatch(/^fh:rl:login_email:[0-9a-f]{64}$/);
      expect(keyValid).not.toContain('aaaaa');

      const hugeRaw = 'z'.repeat(15000);
      const keyRaw = service.normalizeKey(hugeRaw);

      expect(keyRaw.length).toBeLessThan(100);
      expect(keyRaw).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(keyRaw).not.toContain('zzzzz');
    });

    it('handles inputs with multiple delimiters correctly and securely', () => {
      const keyWithColons = service.normalizeKey('login_email:user:with:internal:colons@example.com');
      expect(keyWithColons).toMatch(/^fh:rl:login_email:[0-9a-f]{64}$/);
      expect(keyWithColons).not.toContain('user:with:internal:colons@example.com');

      const keyLeadingColons = service.normalizeKey(':::malformed-input-data');
      expect(keyLeadingColons).toMatch(/^fh:rl:generic:[0-9a-f]{64}$/);
      expect(keyLeadingColons).not.toContain('malformed-input-data');
    });

    it('enforces rate limits and resets consistently on malformed inputs in memory driver', async () => {
      const malformed = 'unstructured-client-identifier';

      // 1st attempt: allowed
      const res1 = await service.check(malformed, 2, 60000);
      expect(res1.allowed).toBe(true);

      // 2nd attempt: allowed
      const res2 = await service.check(malformed, 2, 60000);
      expect(res2.allowed).toBe(true);

      // 3rd attempt: blocked
      const res3 = await service.check(malformed, 2, 60000);
      expect(res3.allowed).toBe(false);

      // Reset works on malformed key
      await service.reset(malformed);
      const resAfterReset = await service.check(malformed, 2, 60000);
      expect(resAfterReset.allowed).toBe(true);
    });
  });

  describe('Internal Consistency & Single-Normalization Execution', () => {
    it('ensures check() and assert() use identical keys for the same raw input', async () => {
      const mockEval = vi.fn().mockResolvedValue([1, 60000]);
      const mockRedis = { eval: mockEval } as unknown as Redis;
      service.setMockRedisClient(mockRedis, true);

      const rawKey = 'login_email:consistent.test@example.com';
      const expectedKey = service.normalizeKey(rawKey);

      await service.check(rawKey, 5, 60000);
      expect(mockEval).toHaveBeenLastCalledWith(expect.anything(), 1, expectedKey, '5', '60000');

      await service.assert(rawKey, 5, 60000);
      expect(mockEval).toHaveBeenLastCalledWith(expect.anything(), 1, expectedKey, '5', '60000');
    });

    it('ensures reset() deletes the exact generated Redis key that check/assert incremented', async () => {
      const mockDel = vi.fn().mockResolvedValue(1);
      const mockRedis = { del: mockDel } as unknown as Redis;
      service.setMockRedisClient(mockRedis, true);

      const rawKey = 'login_email:reset.test@example.com';
      const expectedKey = service.normalizeKey(rawKey);

      await service.reset(rawKey);
      expect(mockDel).toHaveBeenCalledWith(expectedKey);
    });

    it('ensures repeated normalization does not cause accidental double-hashing in internal operations', async () => {
      // In-memory driver verification:
      // When assert() and reset() run, they must operate on the exact same bucket.
      // If internal operations double-hashed, reset would delete hash(hash(k)) while
      // assert used hash(k) (or vice versa), leading to state desynchronization.
      const rawKey = 'login_email:single.hash.test@example.com';

      // 1st assert: count = 1
      await service.assert(rawKey, 2, 60000);
      // 2nd assert: count = 2
      await service.assert(rawKey, 2, 60000);
      // 3rd assert: rejected (exceeds limit 2)
      await expect(service.assert(rawKey, 2, 60000)).rejects.toThrow();

      // Reset bucket
      await service.reset(rawKey);

      // Immediately after reset, assert must succeed again (counter was reset in the matching bucket)
      await expect(service.assert(rawKey, 2, 60000)).resolves.not.toThrow();
    });

    it('generates the same key across distinct instances sharing configuration', () => {
      const instance1 = new RateLimiterService();
      const instance2 = new RateLimiterService();

      const rawKey = 'login_email:shared.cluster@example.com';
      expect(instance1.normalizeKey(rawKey)).toBe(instance2.normalizeKey(rawKey));
    });
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
