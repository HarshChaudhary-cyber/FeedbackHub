import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import type {
  TrendInterval,
  AnalyticsFormsSortBy,
  SortOrder,
  FormStatus,
} from '@feedbackhub/types';

export class AnalyticsOverviewQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format (e.g. 2026-01-01)',
    example: '2026-01-01',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format (e.g. 2026-01-31)',
    example: '2026-01-31',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter analytics to a specific form ID',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  formId?: string;
}

export class AnalyticsTrendsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format',
    example: '2026-01-01',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format',
    example: '2026-01-31',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Grouping interval: day, week, or month',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  interval?: TrendInterval;

  @ApiPropertyOptional({
    description: 'Filter trends to a specific form ID',
  })
  formId?: string;
}

export class AnalyticsRatingsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format',
    example: '2026-01-01',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format',
    example: '2026-01-31',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter rating analytics to a specific form ID',
  })
  formId?: string;
}

export class AnalyticsQuestionsQueryDto {
  @ApiProperty({
    description: 'Target form ID (UUID)',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  formId!: string;

  @ApiPropertyOptional({
    description: 'Start date in ISO format',
    example: '2026-01-01',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format',
    example: '2026-01-31',
  })
  endDate?: string;
}

export class AnalyticsFormsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    default: 10,
  })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Field to sort forms by',
    enum: ['title', 'responseCount', 'latestResponseAt', 'createdAt', 'publishedAt'],
    default: 'createdAt',
  })
  sortBy?: AnalyticsFormsSortBy;

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Filter by form status',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  })
  status?: FormStatus;

  @ApiPropertyOptional({
    description: 'Search string matching form title or internal name',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Start date for response metric aggregation in ISO format',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for response metric aggregation in ISO format',
  })
  endDate?: string;
}
