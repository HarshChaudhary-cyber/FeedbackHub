import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser, CurrentSession } from './current-user.decorator';
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getClearCookieOptions,
} from './auth.constants';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '@feedbackhub/validation';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiterService } from './rate-limiter.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService =
      authService ||
      new AuthService(new PrismaService(), new EmailService(), new RateLimiterService());
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private extractIp(req: Request): string {
    const isTrustedProxy = process.env.TRUSTED_PROXY === 'true';
    if (isTrustedProxy) {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
    }
    return req.socket?.remoteAddress || req.ip || 'unknown';
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new platform user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() body: RegisterInput, @Req() req: Request) {
    const ip = this.extractIp(req);
    return this.authService.register(body, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful, sets session cookie' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] as string | undefined;

    const { rawToken, user } = await this.authService.login(body, ip, userAgent);

    res.cookie(
      SESSION_COOKIE_NAME,
      rawToken,
      getSessionCookieOptions(this.isProduction())
    );

    return {
      user,
      message: 'Sign in successful.',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate active session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    await this.authService.logout(token);

    res.clearCookie(
      SESSION_COOKIE_NAME,
      getClearCookieOptions(this.isProduction())
    );

    return { message: 'Logged out successfully.' };
  }

  @Get('session')
  @ApiOperation({ summary: 'Verify session and return current user' })
  async getSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('No active session found.');
    }

    const sessionData = await this.authService.validateSession(token);
    if (!sessionData) {
      res.clearCookie(
        SESSION_COOKIE_NAME,
        getClearCookieOptions(this.isProduction())
      );
      throw new UnauthorizedException('Session expired or invalid.');
    }

    return {
      authenticated: true,
      user: sessionData.user,
    };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address with token' })
  async verifyEmailGet(@Query('token') token: string, @Req() req: Request) {
    const ip = this.extractIp(req);
    return this.authService.verifyEmail(token, ip);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address via POST with token in body' })
  async verifyEmailPost(@Body('token') token: string, @Req() req: Request) {
    const ip = this.extractIp(req);
    return this.authService.verifyEmail(token, ip);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  async resendVerification(@Body('email') email: string, @Req() req: Request) {
    const ip = this.extractIp(req);
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    let userId: string | undefined;

    if (token) {
      const sessionData = await this.authService.validateSession(token);
      if (sessionData) {
        userId = sessionData.user.id;
      }
    }

    return this.authService.resendVerification(email, userId, ip);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link' })
  async forgotPassword(@Body() body: ForgotPasswordInput, @Req() req: Request) {
    const ip = this.extractIp(req);
    return this.authService.forgotPassword(body, ip);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: ResetPasswordInput, @Req() req: Request) {
    const ip = this.extractIp(req);
    return this.authService.resetPassword(body, ip);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update profile information' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateProfileInput
  ) {
    return this.authService.updateProfile(userId, body);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @CurrentSession() session: { id: string },
    @Body() body: ChangePasswordInput
  ) {
    return this.authService.changePassword(userId, session.id, body);
  }
}
