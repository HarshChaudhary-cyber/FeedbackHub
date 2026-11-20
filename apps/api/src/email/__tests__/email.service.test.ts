import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmailService } from '../email.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('EmailService Security & Production Hardening', () => {
  let emailService: EmailService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('Production Safety Guardrails', () => {
    it('strictly forbids mock mode in production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.EMAIL_MOCK_MODE = 'true';
      delete process.env.RESEND_API_KEY;

      emailService = new EmailService();

      await expect(
        emailService.sendVerificationEmail('test@example.com', 'sample-token')
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException in production when RESEND_API_KEY is missing or placeholder', async () => {
      process.env.NODE_ENV = 'production';
      process.env.EMAIL_MOCK_MODE = 'false';
      process.env.RESEND_API_KEY = 're_mock_api_key_placeholder';

      emailService = new EmailService();

      await expect(
        emailService.sendPasswordResetEmail('user@example.com', 'sample-token')
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('does NOT retain raw emails or tokens in memory in production runtime', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_prod_live_key_1234567890';
      process.env.EMAIL_MOCK_MODE = 'false';

      // Mock fetch response for Resend API
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'resend_email_123' }),
      });
      global.fetch = mockFetch;

      emailService = new EmailService();
      await emailService.sendVerificationEmail('alice@feedbackhub.com', 'super-secret-token');

      // In production, getSentEmails returns empty array to prevent memory leaks and token retention
      expect(emailService.getSentEmails()).toHaveLength(0);
      expect(emailService.getLastEmailFor('alice@feedbackhub.com')).toBeUndefined();
    });

    it('throws sanitized InternalServerErrorException when Resend API returns non-200 error', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_prod_live_key_1234567890';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ message: 'Domain not verified' }),
      });
      global.fetch = mockFetch;

      emailService = new EmailService();

      await expect(
        emailService.sendVerificationEmail('target@example.com', 'token')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('Test Environment Operation', () => {
    it('safely retains test emails for inspection in test environment', async () => {
      process.env.NODE_ENV = 'test';
      emailService = new EmailService();

      await emailService.sendVerificationEmail('dev@example.com', 'test-token-123');

      const sent = emailService.getSentEmails();
      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe('dev@example.com');
      expect(sent[0].token).toBe('test-token-123');

      emailService.clearSentEmails();
      expect(emailService.getSentEmails()).toHaveLength(0);
    });
  });
});
