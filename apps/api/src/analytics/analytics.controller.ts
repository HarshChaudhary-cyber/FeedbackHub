import {
  Controller,
  Get,
  Query,
  UseGuards,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { TenantResolutionGuard } from '../tenant/guards/tenant-resolution.guard';
import { TenantMembershipGuard } from '../tenant/guards/tenant-membership.guard';
import { TenantRoleGuard } from '../tenant/guards/tenant-role.guard';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';
import { RequireRoles } from '../tenant/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsOverviewQueryDto,
  AnalyticsTrendsQueryDto,
  AnalyticsRatingsQueryDto,
  AnalyticsQuestionsQueryDto,
  AnalyticsFormsQueryDto,
} from './dto/analytics.dto';
import type {
  AnalyticsOverviewResponse,
  AnalyticsTrendsResponse,
  AnalyticsRatingsResponse,
  AnalyticsQuestionsResponse,
  AnalyticsFormsResponse,
} from '@feedbackhub/types';

@ApiTags('Analytics')
@ApiCookieAuth()
@UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
@RequireRoles('OWNER', 'ADMIN', 'MANAGER')
@Controller(['analytics', 'tenant/analytics'])
export class AnalyticsController {
  private readonly analyticsService: AnalyticsService;

  constructor(
    @Optional() analyticsService?: AnalyticsService,
    @Optional() prismaService?: PrismaService
  ) {
    this.analyticsService =
      analyticsService || new AnalyticsService(prismaService || new PrismaService());
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Executive overview metrics and comparison with prior period',
  })
  @ApiResponse({ status: 200, description: 'Overview metrics returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role permissions' })
  async getOverview(
    @CurrentTenant('companyId') companyId: string,
    @Query() query: AnalyticsOverviewQueryDto
  ): Promise<AnalyticsOverviewResponse> {
    return this.analyticsService.getOverview(companyId, query);
  }

  @Get('trends')
  @ApiOperation({
    summary: 'Time-series submission trends with zero-filled buckets',
  })
  @ApiQuery({ name: 'interval', enum: ['day', 'week', 'month'], required: false })
  @ApiResponse({ status: 200, description: 'Trends series returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters or date range' })
  async getTrends(
    @CurrentTenant('companyId') companyId: string,
    @Query() query: AnalyticsTrendsQueryDto
  ): Promise<AnalyticsTrendsResponse> {
    return this.analyticsService.getTrends(companyId, query);
  }

  @Get('ratings')
  @ApiOperation({
    summary: 'Scale-aware rating aggregations, distributions, and question breakdowns',
  })
  @ApiResponse({ status: 200, description: 'Ratings analysis returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getRatings(
    @CurrentTenant('companyId') companyId: string,
    @Query() query: AnalyticsRatingsQueryDto
  ): Promise<AnalyticsRatingsResponse> {
    return this.analyticsService.getRatings(companyId, query);
  }

  @Get('questions')
  @ApiOperation({
    summary: 'Deep question-level analytics for a specific feedback form',
  })
  @ApiQuery({ name: 'formId', required: true, description: 'UUID of the feedback form' })
  @ApiResponse({ status: 200, description: 'Question analytics returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or missing formId / parameters' })
  @ApiResponse({ status: 404, description: 'Feedback form not found' })
  async getQuestionAnalytics(
    @CurrentTenant('companyId') companyId: string,
    @Query() query: AnalyticsQuestionsQueryDto
  ): Promise<AnalyticsQuestionsResponse> {
    return this.analyticsService.getQuestionAnalytics(companyId, query.formId, query);
  }

  @Get('forms')
  @ApiOperation({
    summary: 'Form directory with performance metrics, sorting, and pagination',
  })
  @ApiResponse({ status: 200, description: 'Forms analytics directory returned' })
  @ApiResponse({ status: 400, description: 'Invalid pagination or sorting parameters' })
  async getForms(
    @CurrentTenant('companyId') companyId: string,
    @Query() query: AnalyticsFormsQueryDto
  ): Promise<AnalyticsFormsResponse> {
    return this.analyticsService.getFormsAnalytics(companyId, query);
  }
}
