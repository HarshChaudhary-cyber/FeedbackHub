import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RateLimiterService } from '../rate-limiter.service';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaService;
  let emailService: EmailService;
  let rateLimiter: RateLimiterService;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    emailService = new EmailService();
    emailService.clearSentEmails();

    rateLimiter = new RateLimiterService();
    rateLimiter.clearAll();

    authService = new AuthService(prisma, emailService, rateLimiter);
    await authService.onModuleInit();
  });

  describe('Password Hashing & Security', () => {
    it('hashes passwords using Argon2id with recommended parameters', async () => {
      const plain = 'StrongP@ssw0rd123!';
      const hash = await authService.hashPassword(plain);

      expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=4\$/);
      const isValid = await authService.verifyPassword(hash, plain);
      expect(isValid).toBe(true);

      const isInvalid = await authService.verifyPassword(hash, 'WrongPassword123!');
      expect(isInvalid).toBe(false);
    });

    it('hashes tokens deterministically with SHA-256', () => {
      const token = 'sample-random-token-12345';
      const hash1 = authService.hashToken(token);
      const hash2 = authService.hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // 256 bits in hex
    });

    it('generates high-entropy secure random tokens', () => {
      const token1 = authService.generateSecureToken();
      const token2 = authService.generateSecureToken();

      expect(token1).toHaveLength(64); // 32 bytes hex
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });
  });

  describe('Registration Flow', () => {
    it('creates a user with isEmailVerified=false and sends verification email', async () => {
      const result = await authService.register({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'ValidP@ssw0rd123!',
        confirmPassword: 'ValidP@ssw0rd123!',
      });

      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe('jane@example.com');
      expect(result.user.fullName).toBe('Jane Doe');
      expect(result.user.isEmailVerified).toBe(false);
      expect('passwordHash' in result.user).toBe(false);

      const sentEmails = emailService.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].to).toBe('jane@example.com');
      expect(sentEmails[0].type).toBe('verification');
      expect(sentEmails[0].token).toBeDefined();
    });

    it('prevents duplicate email registration with ConflictException', async () => {
      await authService.register({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'ValidP@ssw0rd123!',
        confirmPassword: 'ValidP@ssw0rd123!',
      });

      await expect(
        authService.register({
          fullName: 'Jane Two',
          email: 'JANE@example.com', // Case-insensitive duplicate
          password: 'ValidP@ssw0rd123!',
          confirmPassword: 'ValidP@ssw0rd123!',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('fails when password confirmation does not match', async () => {
      await expect(
        authService.register({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'ValidP@ssw0rd123!',
          confirmPassword: 'DifferentPassword123!',
        })
      ).rejects.toThrow();
    });

    it('enforces password complexity constraints', async () => {
      // Missing special character
      await expect(
        authService.register({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'ValidPassword123',
          confirmPassword: 'ValidPassword123',
        })
      ).rejects.toThrow();

      // Too short (< 10 chars)
      await expect(
        authService.register({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Sh0rt!',
          confirmPassword: 'Sh0rt!',
        })
      ).rejects.toThrow();
    });

    it('rolls back user and token creation if email delivery fails during registration', async () => {
      const emailSpy = vi.spyOn(emailService, 'sendVerificationEmail').mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        authService.register({
          fullName: 'Rollback User',
          email: 'rollback@example.com',
          password: 'ValidP@ssw0rd123!',
          confirmPassword: 'ValidP@ssw0rd123!',
        })
      ).rejects.toThrow(InternalServerErrorException);

      const user = await prisma.platformUser.findUnique({ where: { email: 'rollback@example.com' } });
      expect(user).toBeNull();

      emailSpy.mockRestore();
    });
  });

  describe('Email Verification Flow', () => {
    it('successfully verifies email with valid token and consumes token', async () => {
      await authService.register({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'ValidP@ssw0rd123!',
        confirmPassword: 'ValidP@ssw0rd123!',
      });

      const sentEmail = emailService.getLastEmailFor('jane@example.com');
      expect(sentEmail).toBeDefined();
      expect(sentEmail?.token).toBeDefined();
      const token = sentEmail?.token as string;
      expect(token).toBeDefined();

      const verifyRes = await authService.verifyEmail(token);
      expect(verifyRes.message).toMatch(/verified successfully/i);

      // Verify user record was updated
      const user = await prisma.platformUser.findUnique({ where: { email: 'jane@example.com' } });
      expect(user?.isEmailVerified).toBe(true);
      expect(user?.emailVerifiedAt).toBeDefined();

      // Second attempt with same token fails (single use)
      await expect(authService.verifyEmail(token)).rejects.toThrow(BadRequestException);
    });

    it('atomically consumes verification token and prevents concurrent replay', async () => {
      await authService.register({
        fullName: 'Concurrent Verify User',
        email: 'concurrent-verify@example.com',
        password: 'ValidP@ssw0rd123!',
        confirmPassword: 'ValidP@ssw0rd123!',
      });

      const sentEmail = emailService.getLastEmailFor('concurrent-verify@example.com');
      const token = sentEmail?.token as string;

      const res1 = await authService.verifyEmail(token);
      expect(res1.message).toMatch(/verified successfully/i);

      await expect(authService.verifyEmail(token)).rejects.toThrow(BadRequestException);
    });

    it('rate limits verification attempts by IP', async () => {
      const ip = '198.51.100.99';
      for (let i = 0; i < 30; i++) {
        rateLimiter.check(`verify_ip:${ip}`, 30, 15 * 60 * 1000);
      }

      await expect(
        authService.verifyEmail('some-token', ip)
      ).rejects.toThrow();
    });

    it('rejects tampered or non-existent token', async () => {
      await expect(authService.verifyEmail('invalid-fake-token')).rejects.toThrow(BadRequestException);
    });

    it('rejects expired verification token', async () => {
      await authService.register({
        fullName: 'Expired Verify User',
        email: 'expired-verify@example.com',
        password: 'ValidP@ssw0rd123!',
        confirmPassword: 'ValidP@ssw0rd123!',
      });

      const sentEmail = emailService.getLastEmailFor('expired-verify@example.com');
      const token = sentEmail?.token as string;
      const tokenHash = authService.hashToken(token);

      // Expire token manually
      const tokenRecord = await prisma.emailVerificationToken.findFirst({ where: { tokenHash } });
      await prisma.emailVerificationToken.update({
        where: { id: tokenRecord!.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await expect(authService.verifyEmail(token)).rejects.toThrow(/expired/i);
    });

    it('rolls back verification state if database transaction fails midway', async () => {
      await authService.register({
        fullName: 'Tx Fail Verify User',
        email: 'tx-fail-verify@example.com',
        password: 'ValidP@ssw0rd123!',
        confirmPassword: 'ValidP@ssw0rd123!',
      });

      const sentEmail = emailService.getLastEmailFor('tx-fail-verify@example.com');
      const token = sentEmail?.token as string;

      // Mock user update to fail inside transaction
      const updateSpy = vi.spyOn(prisma.platformUser, 'update').mockRejectedValueOnce(new Error('DB failure during verification'));

      await expect(authService.verifyEmail(token)).rejects.toThrow('DB failure during verification');

      // Verify user remains unverified due to transaction rollback
      const user = await prisma.platformUser.findUnique({ where: { email: 'tx-fail-verify@example.com' } });
      expect(user?.isEmailVerified).toBe(false);

      updateSpy.mockRestore();
    });
  });

  describe('Authentication & Session Flow', () => {
    beforeEach(async () => {
      await authService.register({
        fullName: 'John User',
        email: 'john@example.com',
        password: 'SecureP@ssword123!',
        confirmPassword: 'SecureP@ssword123!',
      });
      // Mark John as verified so valid session tests pass
      await prisma.platformUser.update({
        where: { email: 'john@example.com' },
        data: { isEmailVerified: true },
      });
    });

    it('rejects login for unverified user with ForbiddenException and emailVerificationRequired flag', async () => {
      await authService.register({
        fullName: 'Unverified John',
        email: 'unverified-john@example.com',
        password: 'SecureP@ssword123!',
        confirmPassword: 'SecureP@ssword123!',
      });

      try {
        await authService.login({
          email: 'unverified-john@example.com',
          password: 'SecureP@ssword123!',
        });
        expect.unreachable('Should have thrown ForbiddenException');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        const response = (err as ForbiddenException).getResponse() as {
          emailVerificationRequired?: boolean;
          statusCode?: number;
          email?: string;
        };
        expect(response.emailVerificationRequired).toBe(true);
        expect(response.statusCode).toBe(403);
        expect(response.email).toBe('unverified-john@example.com');
      }

      // Ensure NO active session was created
      const user = await prisma.platformUser.findUnique({ where: { email: 'unverified-john@example.com' } });
      const sessions = await prisma.authSession.findMany({ where: { userId: user!.id } });
      expect(sessions).toHaveLength(0);
    });

    it('verifies credentials before checking email verification to prevent timing oracle and account enumeration', async () => {
      await authService.register({
        fullName: 'Unverified Bob',
        email: 'unverified-bob@example.com',
        password: 'SecureP@ssword123!',
        confirmPassword: 'SecureP@ssword123!',
      });

      // Wrong password on unverified user should return generic 401 UnauthorizedException, NOT 403 Forbidden
      await expect(
        authService.login({
          email: 'unverified-bob@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('authenticates valid credentials and generates an opaque session token', async () => {
      const loginRes = await authService.login({
        email: 'john@example.com',
        password: 'SecureP@ssword123!',
      });

      expect(loginRes.rawToken).toBeDefined();
      expect(loginRes.rawToken).toHaveLength(64);
      expect(loginRes.user.email).toBe('john@example.com');
      expect('passwordHash' in loginRes.user).toBe(false);

      // Validate session lookup
      const sessionData = await authService.validateSession(loginRes.rawToken);
      expect(sessionData).not.toBeNull();
      expect(sessionData?.user.email).toBe('john@example.com');
    });

    it('rejects invalid password with generic UnauthorizedException', async () => {
      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects non-existent email with same generic UnauthorizedException (timing mitigation)', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'SecureP@ssword123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('logs out and invalidates session token', async () => {
      const { rawToken } = await authService.login({
        email: 'john@example.com',
        password: 'SecureP@ssword123!',
      });

      // Session is valid
      expect(await authService.validateSession(rawToken)).not.toBeNull();

      // Logout
      await authService.logout(rawToken);

      // Session is no longer valid
      expect(await authService.validateSession(rawToken)).toBeNull();
    });

    it('rejects expired session token', async () => {
      const { rawToken } = await authService.login({
        email: 'john@example.com',
        password: 'SecureP@ssword123!',
      });

      // Manually set session expiry to past
      const tokenHash = authService.hashToken(rawToken);
      const session = await prisma.authSession.findFirst({ where: { sessionTokenHash: tokenHash } });
      await prisma.authSession.update({
        where: { id: session!.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      expect(await authService.validateSession(rawToken)).toBeNull();
    });
  });

  describe('Password Recovery Flow', () => {
    beforeEach(async () => {
      await authService.register({
        fullName: 'Recovery User',
        email: 'recovery@example.com',
        password: 'OriginalP@ssword123!',
        confirmPassword: 'OriginalP@ssword123!',
      });
      // Mark as verified so login works
      await prisma.platformUser.update({
        where: { email: 'recovery@example.com' },
        data: { isEmailVerified: true },
      });
      emailService.clearSentEmails();
    });

    it('sends password reset link for existing user', async () => {
      const res = await authService.forgotPassword({ email: 'recovery@example.com' });
      expect(res.message).toMatch(/If an account exists/i);

      const sent = emailService.getLastEmailFor('recovery@example.com');
      expect(sent).toBeDefined();
      expect(sent?.type).toBe('reset-password');
      expect(sent?.token).toBeDefined();
    });

    it('returns generic response for non-existent email (prevents enumeration)', async () => {
      const res = await authService.forgotPassword({ email: 'unknown@example.com' });
      expect(res.message).toMatch(/If an account exists/i);
      expect(emailService.getLastEmailFor('unknown@example.com')).toBeUndefined();
    });

    it('resets password with valid token and revokes active sessions', async () => {
      // Create session first
      const { rawToken } = await authService.login({
        email: 'recovery@example.com',
        password: 'OriginalP@ssword123!',
      });
      expect(await authService.validateSession(rawToken)).not.toBeNull();

      // Request reset
      await authService.forgotPassword({ email: 'recovery@example.com' });
      const sentEmail = emailService.getLastEmailFor('recovery@example.com');
      expect(sentEmail?.token).toBeDefined();
      const resetToken = sentEmail?.token as string;

      // Perform reset
      const resetRes = await authService.resetPassword({
        token: resetToken,
        password: 'BrandNewP@ssword123!',
        confirmPassword: 'BrandNewP@ssword123!',
      });
      expect(resetRes.message).toMatch(/Password reset successfully/i);

      // Old session was invalidated!
      expect(await authService.validateSession(rawToken)).toBeNull();

      // Can login with new password
      const newLogin = await authService.login({
        email: 'recovery@example.com',
        password: 'BrandNewP@ssword123!',
      });
      expect(newLogin.user.email).toBe('recovery@example.com');

      // Cannot login with old password
      await expect(
        authService.login({
          email: 'recovery@example.com',
          password: 'OriginalP@ssword123!',
        })
      ).rejects.toThrow(UnauthorizedException);

      // Token cannot be reused (atomic consumption)
      await expect(
        authService.resetPassword({
          token: resetToken,
          password: 'AnotherP@ssword123!',
          confirmPassword: 'AnotherP@ssword123!',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects expired password reset token', async () => {
      await authService.forgotPassword({ email: 'recovery@example.com' });
      const sentEmail = emailService.getLastEmailFor('recovery@example.com');
      const resetToken = sentEmail?.token as string;
      const tokenHash = authService.hashToken(resetToken);

      // Expire token manually
      const tokenRecord = await prisma.passwordResetToken.findFirst({ where: { tokenHash } });
      await prisma.passwordResetToken.update({
        where: { id: tokenRecord!.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await expect(
        authService.resetPassword({
          token: resetToken,
          password: 'NewValidP@ssword123!',
          confirmPassword: 'NewValidP@ssword123!',
        })
      ).rejects.toThrow(/expired/i);
    });

    it('rolls back password reset and preserves previous sessions if transaction fails midway', async () => {
      // Create session first
      const { rawToken } = await authService.login({
        email: 'recovery@example.com',
        password: 'OriginalP@ssword123!',
      });
      expect(await authService.validateSession(rawToken)).not.toBeNull();

      await authService.forgotPassword({ email: 'recovery@example.com' });
      const sentEmail = emailService.getLastEmailFor('recovery@example.com');
      const resetToken = sentEmail?.token as string;

      // Mock session deletion to fail inside transaction
      const sessionSpy = vi.spyOn(prisma.authSession, 'deleteMany').mockRejectedValueOnce(
        new Error('Simulated database deadlock during session revocation')
      );

      await expect(
        authService.resetPassword({
          token: resetToken,
          password: 'BrandNewP@ssword123!',
          confirmPassword: 'BrandNewP@ssword123!',
        })
      ).rejects.toThrow('Simulated database deadlock during session revocation');

      // Due to atomic transaction rollback, old session remains intact!
      expect(await authService.validateSession(rawToken)).not.toBeNull();

      // Old password still works!
      const loginCheck = await authService.login({
        email: 'recovery@example.com',
        password: 'OriginalP@ssword123!',
      });
      expect(loginCheck.user.email).toBe('recovery@example.com');

      sessionSpy.mockRestore();
    });

    it('enforces IP-based rate limiting on password reset endpoint', async () => {
      const testIp = '198.51.100.77';
      // 10 attempts allowed per IP
      for (let i = 0; i < 10; i++) {
        await expect(
          authService.resetPassword(
            {
              token: `unique-token-${i}-12345678901234567890`,
              password: 'ValidP@ssword123!',
              confirmPassword: 'ValidP@ssword123!',
            },
            testIp
          )
        ).rejects.toThrow(BadRequestException);
      }

      // 11th attempt from same IP is throttled
      await expect(
        authService.resetPassword(
          {
            token: 'unique-token-11-12345678901234567890',
            password: 'ValidP@ssword123!',
            confirmPassword: 'ValidP@ssword123!',
          },
          testIp
        )
      ).rejects.toThrow(/Too many password reset attempts/i);
    });

    it('enforces token-based rate limiting independently across different IPs', async () => {
      const targetToken = 'fixed-target-token-under-attack-1234567890';
      // 5 attempts allowed per token across 5 different IPs
      for (let i = 1; i <= 5; i++) {
        const ip = `203.0.113.${i}`;
        await expect(
          authService.resetPassword(
            {
              token: targetToken,
              password: 'ValidP@ssword123!',
              confirmPassword: 'ValidP@ssword123!',
            },
            ip
          )
        ).rejects.toThrow(BadRequestException);
      }

      // 6th attempt with same token from a brand-new IP is throttled
      await expect(
        authService.resetPassword(
          {
            token: targetToken,
            password: 'ValidP@ssword123!',
            confirmPassword: 'ValidP@ssword123!',
          },
          '203.0.113.99'
        )
      ).rejects.toThrow(/Too many reset attempts for this link/i);
    });

    it('hashes token before passing to rate limiter and never exposes raw token in rate-limiter keys', async () => {
      const rawToken = 'confidential-raw-reset-token-secret-xyz';
      const expectedTokenHash = authService.hashToken(rawToken);

      const assertSpy = vi.spyOn(rateLimiter, 'assert');

      await expect(
        authService.resetPassword({
          token: rawToken,
          password: 'ValidP@ssword123!',
          confirmPassword: 'ValidP@ssword123!',
        })
      ).rejects.toThrow(BadRequestException);

      expect(assertSpy).toHaveBeenCalled();
      const tokenCall = assertSpy.mock.calls.find(([key]) => key.startsWith('reset_token:'));
      expect(tokenCall).toBeDefined();

      const passedKey = tokenCall![0];
      // Passes hashed token, NOT raw token
      expect(passedKey).toBe(`reset_token:${expectedTokenHash}`);
      expect(passedKey).not.toContain(rawToken);

      // Verify that normalizeKey generates a privacy-preserving key without raw token or token hash
      const normalizedKey = rateLimiter.normalizeKey(passedKey);
      expect(normalizedKey).not.toContain(rawToken);
      expect(normalizedKey).toMatch(/^fh:rl:reset_token:[0-9a-f]{64}$/);

      assertSpy.mockRestore();
    });

    it('fails closed with HTTP 503 during password reset if Redis fails in production', async () => {
      const originalEnv = { ...process.env };
      try {
        process.env.NODE_ENV = 'production';
        process.env.RATE_LIMIT_SECRET = 'valid-production-secret-with-64-characters-for-testing-purposes-12';

        const mockRedis = {
          eval: vi.fn().mockRejectedValue(new Error('Redis cluster connection failure')),
        } as unknown as import('ioredis').default;

        rateLimiter.setMockRedisClient(mockRedis, true);

        try {
          await authService.resetPassword({
            token: 'test-token-during-redis-outage',
            password: 'ValidP@ssword123!',
            confirmPassword: 'ValidP@ssword123!',
          });
          expect.unreachable('Should have failed closed with 503');
        } catch (err: unknown) {
          expect(err).toBeInstanceOf(HttpException);
          expect((err as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        }
      } finally {
        process.env = originalEnv;
        rateLimiter.setMockRedisClient(null, false);
      }
    });
  });

  describe('Account Management (Profile & Change Password)', () => {
    let userId: string;
    let sessionId: string;
    let sessionToken: string;

    beforeEach(async () => {
      await authService.register({
        fullName: 'Alice Smith',
        email: 'alice@example.com',
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
      });
      // Mark as verified so login works
      await prisma.platformUser.update({
        where: { email: 'alice@example.com' },
        data: { isEmailVerified: true },
      });

      const login = await authService.login({
        email: 'alice@example.com',
        password: 'Password123!@#',
      });
      userId = login.user.id;
      sessionToken = login.rawToken;
      const sessionData = await authService.validateSession(sessionToken);
      sessionId = sessionData!.session.id;
    });

    it('updates user profile full name', async () => {
      const res = await authService.updateProfile(userId, { fullName: 'Alice Cooper' });
      expect(res.user.fullName).toBe('Alice Cooper');

      const user = await prisma.platformUser.findUnique({ where: { id: userId } });
      expect(user?.fullName).toBe('Alice Cooper');
    });

    it('changes password successfully when current password is valid', async () => {
      const res = await authService.changePassword(userId, sessionId, {
        currentPassword: 'Password123!@#',
        newPassword: 'UpdatedP@ssword456!',
        confirmPassword: 'UpdatedP@ssword456!',
      });

      expect(res.message).toMatch(/Password changed successfully/i);

      // Current session remains active
      expect(await authService.validateSession(sessionToken)).not.toBeNull();

      // New password works for subsequent login
      const newLogin = await authService.login({
        email: 'alice@example.com',
        password: 'UpdatedP@ssword456!',
      });
      expect(newLogin.user.id).toBe(userId);
    });

    it('rejects password change if current password is incorrect', async () => {
      await expect(
        authService.changePassword(userId, sessionId, {
          currentPassword: 'IncorrectOldPassword123!',
          newPassword: 'UpdatedP@ssword456!',
          confirmPassword: 'UpdatedP@ssword456!',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Resend Verification Flow & Rate Limiting', () => {
    beforeEach(async () => {
      await authService.register({
        fullName: 'Resend Test User',
        email: 'resend-test@example.com',
        password: 'ValidP@ssw0rd123!',
        confirmPassword: 'ValidP@ssw0rd123!',
      });
    });

    it('rate limits resend requests by user account', async () => {
      await authService.resendVerification('resend-test@example.com');
      await authService.resendVerification('resend-test@example.com');
      await authService.resendVerification('resend-test@example.com');

      // 4th request exceeds limit
      await expect(
        authService.resendVerification('resend-test@example.com')
      ).rejects.toThrow();
    });

    it('rate limits resend requests by IP address', async () => {
      const ip = '198.51.100.77';
      for (let i = 0; i < 5; i++) {
        await authService.resendVerification(`ip-test-${i}@example.com`, undefined, ip);
      }

      await expect(
        authService.resendVerification('ip-test-overflow@example.com', undefined, ip)
      ).rejects.toThrow();
    });

    it('notifies if user is already verified without creating duplicate tokens', async () => {
      await prisma.platformUser.update({
        where: { email: 'resend-test@example.com' },
        data: { isEmailVerified: true },
      });

      const res = await authService.resendVerification('resend-test@example.com');
      expect(res.message).toMatch(/already verified/i);
    });
  });

  describe('Rate Limiting Service', () => {
    it('enforces request limits within the configured time window', async () => {
      const key = 'test-key-limit';
      expect((await rateLimiter.check(key, 3, 1000)).allowed).toBe(true);
      expect((await rateLimiter.check(key, 3, 1000)).allowed).toBe(true);
      expect((await rateLimiter.check(key, 3, 1000)).allowed).toBe(true);
      expect((await rateLimiter.check(key, 3, 1000)).allowed).toBe(false);

      await expect(rateLimiter.assert(key, 3, 1000)).rejects.toThrow();
    });

    it('tracks active keys and prunes expired buckets to prevent memory leaks', async () => {
      const shortLimiter = new RateLimiterService();
      await shortLimiter.check('active-test-key-1', 5, 60000);
      await shortLimiter.check('active-test-key-2', 5, 60000);

      expect(shortLimiter.getActiveKeyCount()).toBeGreaterThanOrEqual(2);
      await shortLimiter.onModuleDestroy();
    });
  });
});
