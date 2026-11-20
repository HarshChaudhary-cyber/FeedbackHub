import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Request, Response, CookieOptions } from 'express';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RateLimiterService } from '../rate-limiter.service';
import { SESSION_COOKIE_NAME } from '../auth.constants';

describe('AuthController', () => {
  let controller: AuthController;
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
    rateLimiter = new RateLimiterService();

    authService = new AuthService(prisma, emailService, rateLimiter);
    await authService.onModuleInit();
    controller = new AuthController(authService);
  });

  it('sets secure HttpOnly session cookie on successful login', async () => {
    await authService.register({
      fullName: 'Controller User',
      email: 'ctrl@example.com',
      password: 'StrongP@ssword123!',
      confirmPassword: 'StrongP@ssword123!',
    });

    // Mark email as verified for login to succeed
    await prisma.platformUser.update({
      where: { email: 'ctrl@example.com' },
      data: { isEmailVerified: true },
    });

    const mockCookies: Record<string, { val: string; options: CookieOptions }> = {};
    const mockRes = {
      cookie: (name: string, val: string, options: CookieOptions) => {
        mockCookies[name] = { val, options };
      },
    } as unknown as Response;

    const mockReq = {
      headers: {},
      ip: '127.0.0.1',
      socket: {},
    } as unknown as Request;

    const result = await controller.login(
      { email: 'ctrl@example.com', password: 'StrongP@ssword123!' },
      mockReq,
      mockRes
    );

    expect(result.user.email).toBe('ctrl@example.com');
    expect(mockCookies[SESSION_COOKIE_NAME]).toBeDefined();
    expect(mockCookies[SESSION_COOKIE_NAME].options.httpOnly).toBe(true);
    expect(mockCookies[SESSION_COOKIE_NAME].options.path).toBe('/');
  });

  it('rejects login for unverified user and does not set session cookie', async () => {
    await authService.register({
      fullName: 'Unverified Controller User',
      email: 'unverified-ctrl@example.com',
      password: 'StrongP@ssword123!',
      confirmPassword: 'StrongP@ssword123!',
    });

    const mockCookies: Record<string, { val: string; options: CookieOptions }> = {};
    const mockRes = {
      cookie: (name: string, val: string, options: CookieOptions) => {
        mockCookies[name] = { val, options };
      },
    } as unknown as Response;

    const mockReq = {
      headers: {},
      ip: '127.0.0.1',
      socket: {},
    } as unknown as Request;

    await expect(
      controller.login(
        { email: 'unverified-ctrl@example.com', password: 'StrongP@ssword123!' },
        mockReq,
        mockRes
      )
    ).rejects.toThrow();

    expect(mockCookies[SESSION_COOKIE_NAME]).toBeUndefined();
  });

  it('clears session cookie on logout', async () => {
    let clearedName = '';
    let clearOptions: CookieOptions | undefined;

    const mockRes = {
      clearCookie: (name: string, options: CookieOptions) => {
        clearedName = name;
        clearOptions = options;
      },
    } as unknown as Response;

    const mockReq = {
      cookies: { [SESSION_COOKIE_NAME]: 'some-token' },
    } as unknown as Request;

    const result = await controller.logout(mockReq, mockRes);
    expect(result.message).toMatch(/Logged out successfully/i);
    expect(clearedName).toBe(SESSION_COOKIE_NAME);
    expect(clearOptions?.maxAge).toBe(0);
  });

  it('verifies active session via getSession endpoint', async () => {
    await authService.register({
      fullName: 'Session User',
      email: 'sess@example.com',
      password: 'StrongP@ssword123!',
      confirmPassword: 'StrongP@ssword123!',
    });

    await prisma.platformUser.update({
      where: { email: 'sess@example.com' },
      data: { isEmailVerified: true },
    });

    const { rawToken } = await authService.login({
      email: 'sess@example.com',
      password: 'StrongP@ssword123!',
    });

    const mockReq = {
      cookies: { [SESSION_COOKIE_NAME]: rawToken },
    } as unknown as Request;

    const mockRes = {
      clearCookie: () => {},
    } as unknown as Response;

    const result = await controller.getSession(mockReq, mockRes);
    expect(result.authenticated).toBe(true);
    expect(result.user.email).toBe('sess@example.com');
  });

  describe('IP Extraction & Proxy Spoofing Protection', () => {
    const originalEnv = process.env.TRUSTED_PROXY;

    afterEach(() => {
      process.env.TRUSTED_PROXY = originalEnv;
    });

    it('ignores x-forwarded-for header when TRUSTED_PROXY is false or unset', async () => {
      delete process.env.TRUSTED_PROXY;

      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18',
        },
        ip: '198.51.100.2',
        socket: { remoteAddress: '198.51.100.2' },
      } as unknown as Request;

      const ip = (controller as unknown as { extractIp: (req: Request) => string }).extractIp(mockReq);
      expect(ip).toBe('198.51.100.2');
    });

    it('trusts and parses first x-forwarded-for IP when TRUSTED_PROXY is true', async () => {
      process.env.TRUSTED_PROXY = 'true';

      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18',
        },
        ip: '198.51.100.2',
        socket: { remoteAddress: '198.51.100.2' },
      } as unknown as Request;

      const ip = (controller as unknown as { extractIp: (req: Request) => string }).extractIp(mockReq);
      expect(ip).toBe('203.0.113.195');
    });
  });
});
