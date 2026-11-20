import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RateLimiterService } from '../rate-limiter.service';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';

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

    it('rejects tampered or non-existent token', async () => {
      await expect(authService.verifyEmail('invalid-fake-token')).rejects.toThrow(BadRequestException);
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

      // Token cannot be reused
      await expect(
        authService.resetPassword({
          token: resetToken,
          password: 'AnotherP@ssword123!',
          confirmPassword: 'AnotherP@ssword123!',
        })
      ).rejects.toThrow(BadRequestException);
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

  describe('Rate Limiting Service', () => {
    it('enforces request limits within the configured time window', () => {
      const key = 'test-key-limit';
      expect(rateLimiter.check(key, 3, 1000).allowed).toBe(true);
      expect(rateLimiter.check(key, 3, 1000).allowed).toBe(true);
      expect(rateLimiter.check(key, 3, 1000).allowed).toBe(true);
      expect(rateLimiter.check(key, 3, 1000).allowed).toBe(false);

      expect(() => rateLimiter.assert(key, 3, 1000)).toThrow();
    });
  });
});
