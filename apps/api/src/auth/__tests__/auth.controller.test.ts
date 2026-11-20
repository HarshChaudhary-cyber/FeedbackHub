import { describe, it, expect, beforeEach } from 'vitest';
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
    const { rawToken } = await authService.register({
      fullName: 'Session User',
      email: 'sess@example.com',
      password: 'StrongP@ssword123!',
      confirmPassword: 'StrongP@ssword123!',
    }).then(() =>
      authService.login({
        email: 'sess@example.com',
        password: 'StrongP@ssword123!',
      })
    );

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
});
