import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RateLimiterService } from './rate-limiter.service';
import {
  ARGON2_OPTIONS,
  SESSION_EXPIRY_MS,
  EMAIL_VERIFICATION_EXPIRY_MS,
  PASSWORD_RESET_EXPIRY_MS,
} from './auth.constants';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '@feedbackhub/validation';
import type { SessionUser } from '@feedbackhub/types';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash: string = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly rateLimiter: RateLimiterService
  ) {}

  async onModuleInit() {
    // Generate pre-computed dummy hash for constant-time comparison on user-not-found
    try {
      this.dummyHash = (await argon2.hash(
        'DummyTimingMitigationPasswordConstantTime123!@#',
        ARGON2_OPTIONS
      )) as string;
    } catch {
      this.dummyHash =
        '$argon2id$v=19$m=65536,t=3,p=4$dummySalt12345678901234$dummyHashSignature123456789012345678901234567890';
    }
  }

  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async hashPassword(password: string): Promise<string> {
    return (await argon2.hash(password, ARGON2_OPTIONS)) as string;
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  private async verifyDummy(plain: string): Promise<void> {
    try {
      await argon2.verify(this.dummyHash, plain);
    } catch {
      // Ignore
    }
  }

  sanitizeUser(user: {
    id: string;
    email: string;
    fullName: string;
    isEmailVerified: boolean;
    isSuperAdmin?: boolean;
    createdAt: Date | string;
    status?: string;
  }): SessionUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      status: user.status,
    };
  }

  async register(input: RegisterInput, ip?: string): Promise<{ user: SessionUser; message: string }> {
    const validated = registerSchema.parse(input);
    const normalizedEmail = validated.email.trim().toLowerCase();

    // Rate limiting: 10 registrations per hour per IP
    if (ip) {
      this.rateLimiter.assert(`reg_ip:${ip}`, 10, 60 * 60 * 1000, 'Too many registration attempts.');
    }

    const existingUser = await this.prisma.platformUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(validated.password);

    const user = await this.prisma.platformUser.create({
      data: {
        email: normalizedEmail,
        fullName: validated.fullName.trim(),
        passwordHash,
        isEmailVerified: false,
        status: 'ACTIVE',
      },
    });

    // Generate email verification token
    const rawToken = this.generateSecureToken();
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, rawToken);

    return {
      user: this.sanitizeUser(user),
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(
    input: LoginInput,
    ip?: string,
    userAgent?: string
  ): Promise<{ rawToken: string; user: SessionUser }> {
    const validated = loginSchema.parse(input);
    const normalizedEmail = validated.email.trim().toLowerCase();

    // Rate limiting
    if (ip) {
      this.rateLimiter.assert(`login_ip:${ip}`, 15, 15 * 60 * 1000, 'Too many login attempts from this network.');
    }
    this.rateLimiter.assert(
      `login_email:${normalizedEmail}`,
      5,
      15 * 60 * 1000,
      'Too many failed attempts for this account.'
    );

    const user = await this.prisma.platformUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await this.verifyDummy(validated.password);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account has been suspended. Please contact support.');
    }

    const isMatch = await this.verifyPassword(user.passwordHash, validated.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset email rate limit on successful credentials
    this.rateLimiter.reset(`login_email:${normalizedEmail}`);

    // Create session
    const rawToken = this.generateSecureToken();
    const sessionTokenHash = this.hashToken(rawToken);

    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        sessionTokenHash,
        ipAddress: ip || null,
        userAgent: userAgent || null,
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
      },
    });

    return {
      rawToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;
    const sessionTokenHash = this.hashToken(rawToken);
    await this.prisma.authSession.deleteMany({
      where: { sessionTokenHash },
    });
  }

  async validateSession(
    rawToken?: string
  ): Promise<{ user: SessionUser; session: { id: string; userId: string; expiresAt: Date } } | null> {
    if (!rawToken) return null;

    const sessionTokenHash = this.hashToken(rawToken);
    const session = await this.prisma.authSession.findFirst({
      where: { sessionTokenHash },
    });

    if (!session) return null;

    const expiresAt = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      await this.prisma.authSession.delete({ where: { id: session.id } });
      return null;
    }

    const user = await this.prisma.platformUser.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      user: this.sanitizeUser(user),
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt,
      },
    };
  }

  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    const validated = verifyEmailSchema.parse({ token: rawToken });
    const tokenHash = this.hashToken(validated.token);

    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    const expiresAt = record.expiresAt instanceof Date ? record.expiresAt : new Date(record.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      await this.prisma.emailVerificationToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    await this.prisma.platformUser.update({
      where: { id: record.userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    await this.prisma.emailVerificationToken.delete({ where: { id: record.id } });

    return { message: 'Email address verified successfully. You can now use all platform features.' };
  }

  async resendVerification(email?: string, userId?: string, _ip?: string): Promise<{ message: string }> {
    let targetUser: {
      id: string;
      email: string;
      isEmailVerified: boolean;
    } | null = null;

    if (userId) {
      targetUser = await this.prisma.platformUser.findUnique({ where: { id: userId } });
    } else if (email) {
      targetUser = await this.prisma.platformUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    }

    if (!targetUser) {
      return { message: 'If your email is registered and unverified, a new verification link has been sent.' };
    }

    if (targetUser.isEmailVerified) {
      return { message: 'This email address is already verified.' };
    }

    // Rate limit resend attempts
    this.rateLimiter.assert(
      `resend_verif:${targetUser.id}`,
      3,
      15 * 60 * 1000,
      'Too many verification email requests. Please wait a few minutes.'
    );

    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: targetUser.id },
    });

    const rawToken = this.generateSecureToken();
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: targetUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
      },
    });

    await this.emailService.sendVerificationEmail(targetUser.email, rawToken);

    return { message: 'A fresh verification link has been sent to your email.' };
  }

  async forgotPassword(input: ForgotPasswordInput, ip?: string): Promise<{ message: string }> {
    const validated = forgotPasswordSchema.parse(input);
    const normalizedEmail = validated.email.trim().toLowerCase();

    // Rate limit forgot password
    if (ip) {
      this.rateLimiter.assert(`forgot_ip:${ip}`, 10, 15 * 60 * 1000);
    }
    this.rateLimiter.assert(`forgot_email:${normalizedEmail}`, 3, 15 * 60 * 1000);

    const user = await this.prisma.platformUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.status === 'ACTIVE') {
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const rawToken = this.generateSecureToken();
      const tokenHash = this.hashToken(rawToken);

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
        },
      });

      await this.emailService.sendPasswordResetEmail(user.email, rawToken);
    } else {
      await this.verifyDummy('DummyDelayPasswordForTimingAttackMitigation123!');
    }

    return {
      message: 'If an account exists with this email address, a password reset link has been sent.',
    };
  }

  async resetPassword(input: ResetPasswordInput, ip?: string): Promise<{ message: string }> {
    const validated = resetPasswordSchema.parse(input);

    if (ip) {
      this.rateLimiter.assert(`reset_ip:${ip}`, 10, 15 * 60 * 1000);
    }

    const tokenHash = this.hashToken(validated.token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const expiresAt = record.expiresAt instanceof Date ? record.expiresAt : new Date(record.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Password reset link has expired. Please request a new one.');
    }

    const newHash = await this.hashPassword(validated.password);

    await this.prisma.platformUser.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all active sessions for security
    await this.prisma.authSession.deleteMany({
      where: { userId: record.userId },
    });

    // Invalidate token
    await this.prisma.passwordResetToken.delete({ where: { id: record.id } });

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<{ user: SessionUser; message: string }> {
    const validated = updateProfileSchema.parse(input);

    const user = await this.prisma.platformUser.update({
      where: { id: userId },
      data: { fullName: validated.fullName.trim() },
    });

    return {
      user: this.sanitizeUser(user),
      message: 'Profile updated successfully.',
    };
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    input: ChangePasswordInput
  ): Promise<{ message: string }> {
    const validated = changePasswordSchema.parse(input);

    const user = await this.prisma.platformUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const isMatch = await this.verifyPassword(user.passwordHash, validated.currentPassword);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const newHash = await this.hashPassword(validated.newPassword);

    await this.prisma.platformUser.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all other active sessions for this user except current session
    await this.prisma.authSession.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });

    return { message: 'Password changed successfully.' };
  }
}
