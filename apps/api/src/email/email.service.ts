import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';

export interface SentEmail {
  to: string;
  subject: string;
  html: string;
  token?: string;
  type: 'verification' | 'reset-password';
  sentAt: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  // Test-only in-memory storage for test assertions
  private testSentEmails: SentEmail[] = [];

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  private isMockMode(): boolean {
    // In production, mock mode is strictly prohibited
    if (this.isProduction()) {
      return false;
    }
    // In test or development, mock mode can be active
    return process.env.EMAIL_MOCK_MODE === 'true' || this.isTest() || !process.env.RESEND_API_KEY;
  }

  private getAppUrl(): string {
    return process.env.APP_URL || 'http://localhost:3000';
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl = this.getAppUrl();
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;
    const subject = 'Verify your email address - FeedbackHub';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4338ca;">Welcome to FeedbackHub!</h2>
        <p>Thank you for creating an account. Please click the button below to verify your email address and activate your account:</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background-color: #4338ca; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 24 hours.</p>
      </div>
    `;

    // Only record in memory if in test environment (never in production)
    if (this.isTest()) {
      this.testSentEmails.push({
        to,
        subject,
        html,
        token,
        type: 'verification',
        sentAt: new Date(),
      });
    }

    if (this.isMockMode()) {
      if (!this.isTest()) {
        this.logger.log(`[DEV MOCK EMAIL] Verification link generated for ${to}: ${verificationUrl}`);
      }
      return;
    }

    // Production sending via Resend
    await this.sendViaResend(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const appUrl = this.getAppUrl();
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const subject = 'Reset your password - FeedbackHub';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4338ca;">Password Reset Request</h2>
        <p>We received a request to reset your FeedbackHub password. Click the button below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #4338ca; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    // Only record in memory if in test environment (never in production)
    if (this.isTest()) {
      this.testSentEmails.push({
        to,
        subject,
        html,
        token,
        type: 'reset-password',
        sentAt: new Date(),
      });
    }

    if (this.isMockMode()) {
      if (!this.isTest()) {
        this.logger.log(`[DEV MOCK EMAIL] Password reset link generated for ${to}: ${resetUrl}`);
      }
      return;
    }

    // Production sending via Resend
    await this.sendViaResend(to, subject, html);
  }

  private async sendViaResend(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 're_mock_api_key_placeholder' || apiKey.trim() === '') {
      this.logger.error('Email delivery aborted: RESEND_API_KEY is not configured.');
      throw new InternalServerErrorException('Email service is not configured for production delivery.');
    }

    const from = process.env.EMAIL_FROM || 'FeedbackHub <noreply@feedbackhub.com>';

    let res: globalThis.Response;
    try {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      this.logger.error(`Resend API network failure: ${msg}`);
      throw new InternalServerErrorException('Failed to deliver email. Please try again later.');
    }

    if (!res.ok) {
      this.logger.error(`Resend API returned error status ${res.status}`);
      throw new InternalServerErrorException('Failed to deliver email. Please try again later.');
    }
  }

  // Test inspection methods (only return records captured in test environment)
  getSentEmails(): SentEmail[] {
    if (!this.isTest()) {
      return [];
    }
    return [...this.testSentEmails];
  }

  getLastEmailFor(email: string): SentEmail | undefined {
    if (!this.isTest()) {
      return undefined;
    }
    return this.testSentEmails
      .slice()
      .reverse()
      .find((e) => e.to.toLowerCase() === email.toLowerCase());
  }

  clearSentEmails(): void {
    this.testSentEmails = [];
  }
}
