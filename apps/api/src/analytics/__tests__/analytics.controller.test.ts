import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';
import { TenantRoleGuard } from '../../tenant/guards/tenant-role.guard';
import { TENANT_ROLES_KEY } from '../../tenant/decorators/roles.decorator';
import type {
  AnalyticsOverviewResponse,
  AnalyticsTrendsResponse,
  AnalyticsRatingsResponse,
  AnalyticsQuestionsResponse,
  AnalyticsFormsResponse,
} from '@feedbackhub/types';
import type { ExecutionContext } from '@nestjs/common';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const companyId = 'comp-1111-2222-3333-444455556666';
  const formId = 'a0000001-1111-2222-3333-444455556666';

  beforeEach(() => {
    service = {
      getOverview: vi.fn().mockResolvedValue({
        totalResponses: 10,
        filteredResponses: 5,
        publishedFormsCount: 2,
        averageRating: 4.5,
        ratingResponsesCount: 4,
        previousPeriod: {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-15T00:00:00.000Z',
          responseCount: 3,
          averageRating: 4.0,
          responseChangePercentage: 66.67,
          ratingChange: 0.5,
        },
      } as AnalyticsOverviewResponse),
      getTrends: vi.fn().mockResolvedValue({
        interval: 'day',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-05T00:00:00.000Z',
        formId: null,
        buckets: [{ date: '2026-01-01', count: 2, averageRating: 4.5 }],
        totalResponses: 2,
      } as AnalyticsTrendsResponse),
      getRatings: vi.fn().mockResolvedValue({
        overallAverage: 4.5,
        totalRatings: 10,
        scales: [],
        byQuestion: [],
        distribution: [],
      } as AnalyticsRatingsResponse),
      getQuestionAnalytics: vi.fn().mockResolvedValue({
        formId,
        formTitle: 'CSAT Survey',
        totalResponses: 5,
        startDate: null,
        endDate: null,
        questions: [],
      } as AnalyticsQuestionsResponse),
      getFormsAnalytics: vi.fn().mockResolvedValue({
        forms: [],
        pagination: {
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
        },
      } as AnalyticsFormsResponse),
    } as unknown as AnalyticsService;

    controller = new AnalyticsController(service);
  });

  describe('Endpoint delegation', () => {
    it('delegates getOverview to service with companyId and query', async () => {
      const query = { startDate: '2026-01-01', endDate: '2026-01-15' };
      const res = await controller.getOverview(companyId, query);
      expect(service.getOverview).toHaveBeenCalledWith(companyId, query);
      expect(res.totalResponses).toBe(10);
      expect(res.averageRating).toBe(4.5);
    });

    it('delegates getTrends to service with companyId and query', async () => {
      const query = { interval: 'day' as const, startDate: '2026-01-01' };
      const res = await controller.getTrends(companyId, query);
      expect(service.getTrends).toHaveBeenCalledWith(companyId, query);
      expect(res.interval).toBe('day');
      expect(res.buckets).toHaveLength(1);
    });

    it('delegates getRatings to service with companyId and query', async () => {
      const query = { formId };
      const res = await controller.getRatings(companyId, query);
      expect(service.getRatings).toHaveBeenCalledWith(companyId, query);
      expect(res.overallAverage).toBe(4.5);
    });

    it('delegates getQuestionAnalytics to service with companyId, formId, and query', async () => {
      const query = { formId, startDate: '2026-01-01' };
      const res = await controller.getQuestionAnalytics(companyId, query);
      expect(service.getQuestionAnalytics).toHaveBeenCalledWith(companyId, formId, query);
      expect(res.formTitle).toBe('CSAT Survey');
    });

    it('delegates getForms to service with companyId and query', async () => {
      const query = { page: 1, limit: 10, sortBy: 'responseCount' as const };
      const res = await controller.getForms(companyId, query);
      expect(service.getFormsAnalytics).toHaveBeenCalledWith(companyId, query);
      expect(res.pagination.currentPage).toBe(1);
    });
  });

  describe('Security & Guard Metadata', () => {
    it('declares controller-level RBAC role requirements for OWNER, ADMIN, and MANAGER', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>(TENANT_ROLES_KEY, AnalyticsController);
      expect(roles).toEqual(['OWNER', 'ADMIN', 'MANAGER']);
    });

    it('validates role enforcement with TenantRoleGuard', () => {
      const reflector = new Reflector();
      const guard = new TenantRoleGuard(reflector);

      const makeContext = (role: string): ExecutionContext =>
        ({
          switchToHttp: () => ({
            getRequest: () => ({ tenant: { membershipRole: role } }),
          }),
          getHandler: () => ({}),
          getClass: () => AnalyticsController,
        }) as unknown as ExecutionContext;

      expect(guard.canActivate(makeContext('OWNER'))).toBe(true);
      expect(guard.canActivate(makeContext('ADMIN'))).toBe(true);
      expect(guard.canActivate(makeContext('MANAGER'))).toBe(true);
      expect(() => guard.canActivate(makeContext('VIEWER'))).toThrow();
    });

    it('binds dual paths for default and tenant analytics conventions', () => {
      const pathMetadata = Reflect.getMetadata('path', AnalyticsController);
      expect(pathMetadata).toEqual(['analytics', 'tenant/analytics']);
    });
  });
});
