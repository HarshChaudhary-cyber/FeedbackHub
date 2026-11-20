import { Injectable, Logger } from '@nestjs/common';

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
  private sentEmails: SentEmail[] = [];

  private getAppUrl(): string {
    return process.env.APP_URL || 'http://localhost:3000';
  }

  private isMockMode(): boolean {
    return process.env.EMAIL_MOCK_MODE !== 'false' || !process.env.RESEND_API_KEY;
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

    const record: SentEmail = {
      to,
      subject,
      html,
      token,
      type: 'verification',
      sentAt: new Date(),
    };
    this.sentEmails.push(record);

    if (this.isMockMode()) {
      this.logger.log(`[MOCK EMAIL] Verification link for ${to}: ${verificationUrl}`);
      return;
    }

    try {
      await this.sendViaResend(to, subject, html);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send verification email via Resend to ${to}: ${msg}`);
    }
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

    const record: SentEmail = {
      to,
      subject,
      html,
      token,
      type: 'reset-password',
      sentAt: new Date(),
    };
    this.sentEmails.push(record);

    if (this.isMockMode()) {
      this.logger.log(`[MOCK EMAIL] Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    try {
      await this.sendViaResend(to, subject, html);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send password reset email via Resend to ${to}: ${msg}`);
    }
  }

  private async sendViaResend(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || 'FeedbackHub <noreply@feedbackhub.com>';

    const res = await fetch('https://api.resend.com/emails', {
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

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend API error (${res.status}): ${errBody}`);
    }
  }

  getSentEmails(): SentEmail[] {
    return [...this.sentEmails];
  }

  getLastEmailFor(email: string): SentEmail | undefined {
    return this.sentEmails.slice().reverse().find((e) => e.to.toLowerCase() === email.toLowerCase());
  }

  clearSentEmails(): void {
    this.sentEmails = [];
  }
}
