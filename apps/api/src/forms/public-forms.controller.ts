import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiterService } from '../auth/rate-limiter.service';
import type { PublicFeedbackForm, PublicSubmissionResult } from '@feedbackhub/types';

@ApiTags('Public Forms')
@Controller('public/forms')
export class PublicFormsController {
  private readonly formsService: FormsService;

  constructor(
    @Optional() formsService?: FormsService,
    @Optional() prismaService?: PrismaService,
    @Optional() rateLimiter?: RateLimiterService
  ) {
    this.formsService =
      formsService ||
      new FormsService(
        prismaService || new PrismaService(),
        rateLimiter || new RateLimiterService()
      );
  }

  /**
   * Helper to safely extract client IP without spoofing.
   */
  private extractClientIp(req: Request): string {
    const isTrustedProxy = process.env.TRUSTED_PROXY === 'true' || process.env.TRUSTED_PROXY === '1';
    if (isTrustedProxy) {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string' && forwarded.trim() !== '') {
        const firstHop = forwarded.split(',')[0].trim();
        if (firstHop) return firstHop;
      }
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Retrieve a published feedback form for public respondents' })
  @ApiResponse({ status: 200, description: 'Public form returned' })
  @ApiResponse({ status: 404, description: 'Form not found or unavailable' })
  async getPublicForm(@Param('slug') slug: string): Promise<PublicFeedbackForm> {
    return this.formsService.getPublicFormBySlug(slug);
  }

  @Post(':slug/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit feedback responses to a published form' })
  @ApiResponse({ status: 200, description: 'Feedback successfully submitted' })
  @ApiResponse({ status: 400, description: 'Validation failed or rate limit exceeded' })
  @ApiResponse({ status: 404, description: 'Form not found or closed' })
  async submitFeedback(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Req() req: Request
  ): Promise<PublicSubmissionResult> {
    const clientIp = this.extractClientIp(req);
    return this.formsService.submitPublicFeedback(slug, body, clientIp);
  }
}
