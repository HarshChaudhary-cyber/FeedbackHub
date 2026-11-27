/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  analyticsOverviewQuerySchema,
  analyticsTrendsQuerySchema,
  analyticsRatingsQuerySchema,
  analyticsQuestionsQuerySchema,
  analyticsFormsQuerySchema,
  isValidIsoCalendarDate,
} from '@feedbackhub/validation';
import type {
  AnalyticsOverviewResponse,
  AnalyticsTrendsResponse,
  AnalyticsRatingsResponse,
  AnalyticsQuestionsResponse,
  AnalyticsFormsResponse,
  TrendBucket,
  RatingScoreDistribution,
  RatingScaleBreakdown,
  RatingQuestionBreakdown,
  QuestionAnalyticsItem,
  FormAnalyticsSummary,
  ChoiceOptionAnalytics,
} from '@feedbackhub/types';
import type {
  AnalyticsOverviewQueryDto,
  AnalyticsTrendsQueryDto,
  AnalyticsRatingsQueryDto,
  AnalyticsQuestionsQueryDto,
  AnalyticsFormsQueryDto,
} from './dto/analytics.dto';

interface EffectiveDateRange {
  effectiveStart: Date;
  effectiveEnd: Date;
  isCustomStart: boolean;
  isCustomEnd: boolean;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly prisma: PrismaService;

  constructor(@Optional() prisma?: PrismaService) {
    this.prisma = prisma || new PrismaService();
  }

  /**
   * Resolves consistent, strictly validated UTC date boundaries.
   * If both dates are supplied, uses both.
   * If only start date is supplied, uses startDate through now.
   * If only end date is supplied, uses a documented 30-day window ending on endDate.
   * If neither date is supplied, uses a documented default 30-day window ending now.
   * End dates without explicit time (YYYY-MM-DD) are inclusive (23:59:59.999Z).
   */
  private resolveEffectiveDateRange(rawStart?: string, rawEnd?: string): EffectiveDateRange {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    const isCustomStart = Boolean(rawStart && rawStart.trim() !== '');
    const isCustomEnd = Boolean(rawEnd && rawEnd.trim() !== '');

    if (isCustomStart) {
      if (!isValidIsoCalendarDate(rawStart!)) {
        throw new BadRequestException('Invalid startDate calendar date');
      }
      startDate = new Date(rawStart!.trim());
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate format');
      }
    }

    if (isCustomEnd) {
      if (!isValidIsoCalendarDate(rawEnd!)) {
        throw new BadRequestException('Invalid endDate calendar date');
      }
      const trimmedEnd = rawEnd!.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedEnd)) {
        const [y, m, d] = trimmedEnd.split('-').map(Number);
        endDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      } else {
        endDate = new Date(trimmedEnd);
      }
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid endDate format');
      }
    }

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    let effectiveEnd: Date;
    let effectiveStart: Date;

    if (startDate && endDate) {
      effectiveStart = startDate;
      effectiveEnd = endDate;
    } else if (startDate && !endDate) {
      effectiveStart = startDate;
      effectiveEnd = now;
    } else if (!startDate && endDate) {
      effectiveEnd = endDate;
      effectiveStart = new Date(effectiveEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      effectiveEnd = now;
      effectiveStart = new Date(effectiveEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (effectiveStart.getTime() > effectiveEnd.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    return {
      effectiveStart,
      effectiveEnd,
      isCustomStart,
      isCustomEnd,
    };
  }

  /**
   * Asserts that a form exists and belongs to the given tenant using the transaction client.
   */
  private async assertFormOwnership(
    tx: PrismaService,
    companyId: string,
    formId: string
  ): Promise<any> {
    const form = await tx.feedbackForm.findFirst({
      where: {
        id: formId,
        companyId,
      },
    });

    if (!form) {
      throw new NotFoundException('Feedback form not found.');
    }

    return form;
  }

  /**
   * Validates if a rating answer satisfies configured min/max scale and finite integer semantics.
   */
  private isValidRatingValue(val: unknown, minRating: number, maxRating: number): boolean {
    if (val === null || val === undefined || typeof val !== 'number' || !Number.isFinite(val)) {
      return false;
    }
    if (val < minRating || val > maxRating) {
      return false;
    }
    // Check if integer (or within floating-point tolerance of an integer score)
    return Math.abs(val - Math.round(val)) < 0.001;
  }

  /**
   * 1. GET /analytics/overview
   * High-level executive overview with metrics, scale-isolated ratings, and prior period comparisons.
   */
  async getOverview(
    companyId: string,
    query: AnalyticsOverviewQueryDto
  ): Promise<AnalyticsOverviewResponse> {
    const parsed = analyticsOverviewQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid overview query');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      if (query.formId) {
        await this.assertFormOwnership(tx, companyId, query.formId);
      }

      const { effectiveStart, effectiveEnd } = this.resolveEffectiveDateRange(
        query.startDate,
        query.endDate
      );

      // Base filter for current tenant and optional form
      const baseWhere: any = { companyId };
      if (query.formId) {
        baseWhere.formId = query.formId;
      }

      // Total all-time responses for tenant (or scoped form)
      const totalResponses = await tx.feedbackResponse.count({
        where: baseWhere,
      });

      // Published forms count
      let publishedFormsCount = 0;
      if (query.formId) {
        const form = await tx.feedbackForm.findFirst({
          where: { id: query.formId, companyId, status: 'PUBLISHED' },
        });
        publishedFormsCount = form ? 1 : 0;
      } else {
        publishedFormsCount = await tx.feedbackForm.count({
          where: {
            companyId,
            status: 'PUBLISHED',
          },
        });
      }

      // Current window responses
      const windowWhere: any = {
        ...baseWhere,
        submittedAt: {
          gte: effectiveStart,
          lte: effectiveEnd,
        },
      };

      const currentResponses = await tx.feedbackResponse.findMany({
        where: windowWhere,
        select: {
          id: true,
          submittedAt: true,
          answers: {
            where: {
              questionType: { in: ['RATING', 'CSAT', 'NPS', 'LIKERT_SCALE'] },
            },
            select: {
              questionId: true,
              numberValue: true,
              questionType: true,
              question: {
                select: {
                  validationRules: true,
                },
              },
            },
          },
        },
      });

      const filteredResponses = currentResponses.length;

      // Group rating answers by scale: "min-max"
      const scaleMap = new Map<
        string,
        {
          minRating: number;
          maxRating: number;
          count: number;
          sum: number;
          distMap: Map<number, number>;
        }
      >();

      let totalValidRatingCount = 0;

      for (const resp of currentResponses) {
        if (!resp.answers || !Array.isArray(resp.answers)) continue;
        for (const ans of resp.answers) {
          const rules = ans.question?.validationRules as any;
          const minRating = typeof rules?.minRating === 'number' ? rules.minRating : 1;
          const maxRating = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;

          if (!this.isValidRatingValue(ans.numberValue, minRating, maxRating)) {
            continue;
          }

          const scaleKey = `${minRating}-${maxRating}`;
          if (!scaleMap.has(scaleKey)) {
            const dist = new Map<number, number>();
            for (let r = minRating; r <= maxRating; r++) dist.set(r, 0);
            scaleMap.set(scaleKey, {
              minRating,
              maxRating,
              count: 0,
              sum: 0,
              distMap: dist,
            });
          }

          const scaleEntry = scaleMap.get(scaleKey)!;
          const score = Math.round(ans.numberValue!);
          scaleEntry.count++;
          scaleEntry.sum += ans.numberValue!;
          scaleEntry.distMap.set(score, (scaleEntry.distMap.get(score) || 0) + 1);
          totalValidRatingCount++;
        }
      }

      // Format scale breakdowns
      const ratingScales: RatingScaleBreakdown[] = Array.from(scaleMap.values()).map((s) => {
        const avg = s.count > 0 ? Math.round((s.sum / s.count) * 100) / 100 : 0;
        const distribution: RatingScoreDistribution[] = [];
        for (let r = s.minRating; r <= s.maxRating; r++) {
          const cnt = s.distMap.get(r) || 0;
          const pct = s.count > 0 ? Math.round((cnt / s.count) * 10000) / 100 : 0;
          distribution.push({ rating: r, count: cnt, percentage: pct });
        }
        return {
          minRating: s.minRating,
          maxRating: s.maxRating,
          averageRating: avg,
          count: s.count,
          distribution,
        };
      });

      // Rating scale correctness:
      // If exactly 1 scale is present, return averageRating and ratingScale.
      // If multiple disparate scales exist, return averageRating = null (do NOT combine incompatible scales).
      let averageRating: number | null = null;
      let ratingScale: { minRating: number; maxRating: number } | null = null;

      if (ratingScales.length === 1) {
        averageRating = ratingScales[0].averageRating;
        ratingScale = {
          minRating: ratingScales[0].minRating,
          maxRating: ratingScales[0].maxRating,
        };
      }

      // Prior period calculation: exactly equal duration immediately preceding effectiveStart
      const durationMs = effectiveEnd.getTime() - effectiveStart.getTime();
      const prevEnd = new Date(effectiveStart.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);

      const prevResponses = await tx.feedbackResponse.findMany({
        where: {
          ...baseWhere,
          submittedAt: {
            gte: prevStart,
            lte: prevEnd,
          },
        },
        select: {
          id: true,
          answers: {
            where: {
              questionType: { in: ['RATING', 'CSAT', 'NPS', 'LIKERT_SCALE'] },
            },
            select: {
              numberValue: true,
              question: {
                select: {
                  validationRules: true,
                },
              },
            },
          },
        },
      });

      const prevCount = prevResponses.length;
      const prevScaleMap = new Map<string, { count: number; sum: number }>();
      for (const resp of prevResponses) {
        if (!resp.answers || !Array.isArray(resp.answers)) continue;
        for (const ans of resp.answers) {
          const rules = ans.question?.validationRules as any;
          const minRating = typeof rules?.minRating === 'number' ? rules.minRating : 1;
          const maxRating = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;

          if (!this.isValidRatingValue(ans.numberValue, minRating, maxRating)) {
            continue;
          }

          const scaleKey = `${minRating}-${maxRating}`;
          if (!prevScaleMap.has(scaleKey)) {
            prevScaleMap.set(scaleKey, { count: 0, sum: 0 });
          }
          const entry = prevScaleMap.get(scaleKey)!;
          entry.count++;
          entry.sum += ans.numberValue!;
        }
      }

      let prevAverageRating: number | null = null;
      if (prevScaleMap.size === 1) {
        const single = Array.from(prevScaleMap.values())[0];
        prevAverageRating = single.count > 0 ? Math.round((single.sum / single.count) * 100) / 100 : null;
      }

      let responseChangePercentage: number | null = null;
      if (prevCount === 0) {
        responseChangePercentage = filteredResponses > 0 ? 100 : 0;
      } else {
        responseChangePercentage =
          Math.round(((filteredResponses - prevCount) / prevCount) * 10000) / 100;
      }

      // Rating change only valid when both periods have a single, identical scale
      let ratingChange: number | null = null;
      if (
        averageRating !== null &&
        prevAverageRating !== null &&
        ratingScales.length === 1 &&
        prevScaleMap.size === 1 &&
        ratingScales[0].minRating + '-' + ratingScales[0].maxRating ===
          Array.from(prevScaleMap.keys())[0]
      ) {
        ratingChange = Math.round((averageRating - prevAverageRating) * 100) / 100;
      }

      return {
        totalResponses,
        filteredResponses,
        publishedFormsCount,
        averageRating,
        ratingResponsesCount: totalValidRatingCount,
        ratingScale,
        ratingScales: ratingScales.length > 0 ? ratingScales : undefined,
        previousPeriod: {
          startDate: prevStart.toISOString(),
          endDate: prevEnd.toISOString(),
          responseCount: prevCount,
          averageRating: prevAverageRating,
          responseChangePercentage,
          ratingChange,
        },
      };
    });
  }

  /**
   * 2. GET /analytics/trends
   * Continuous zero-filled time-series submission buckets with safe monthly cursor logic and scale awareness.
   */
  async getTrends(
    companyId: string,
    query: AnalyticsTrendsQueryDto
  ): Promise<AnalyticsTrendsResponse> {
    const parsed = analyticsTrendsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid trends query');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      if (query.formId) {
        await this.assertFormOwnership(tx, companyId, query.formId);
      }

      const interval = query.interval || 'day';
      const { effectiveStart, effectiveEnd } = this.resolveEffectiveDateRange(
        query.startDate,
        query.endDate
      );

      // Verify interval limits
      const diffDays =
        (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24);
      if (interval === 'day' && diffDays > 366) {
        throw new BadRequestException('Daily trends cannot exceed 365 days');
      }
      if (interval === 'week' && diffDays > 735) {
        throw new BadRequestException('Weekly trends cannot exceed 104 weeks');
      }
      if (interval === 'month' && diffDays > 1835) {
        throw new BadRequestException('Monthly trends cannot exceed 60 months');
      }

      // Query responses inside window
      const where: any = {
        companyId,
        submittedAt: {
          gte: effectiveStart,
          lte: effectiveEnd,
        },
      };
      if (query.formId) {
        where.formId = query.formId;
      }

      const responses = await tx.feedbackResponse.findMany({
        where,
        select: {
          id: true,
          submittedAt: true,
          answers: {
            where: {
              questionType: { in: ['RATING', 'CSAT', 'NPS', 'LIKERT_SCALE'] },
            },
            select: {
              numberValue: true,
              question: {
                select: {
                  validationRules: true,
                },
              },
            },
          },
        },
      });

      // Helper to generate ISO bucket date keys using UTC
      const formatBucketKey = (d: Date): string => {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');

        if (interval === 'month') {
          return `${year}-${month}-01`;
        }
        if (interval === 'week') {
          // Monday-aligned UTC week
          const cur = new Date(Date.UTC(year, d.getUTCMonth(), d.getUTCDate()));
          const dayOfWeek = cur.getUTCDay(); // 0 is Sun, 1 is Mon
          const diffToMon = (dayOfWeek + 6) % 7;
          cur.setUTCDate(cur.getUTCDate() - diffToMon);
          const wy = cur.getUTCFullYear();
          const wm = String(cur.getUTCMonth() + 1).padStart(2, '0');
          const wd = String(cur.getUTCDate()).padStart(2, '0');
          return `${wy}-${wm}-${wd}`;
        }
        return `${year}-${month}-${day}`;
      };

      // Generate zero-filled buckets using safe cursor incrementation
      const bucketsMap = new Map<
        string,
        {
          count: number;
          scaleMap: Map<string, { count: number; sum: number }>;
        }
      >();

      if (interval === 'month') {
        // Safe monthly cursor: initialize to day 1 UTC of start month
        const cursor = new Date(
          Date.UTC(effectiveStart.getUTCFullYear(), effectiveStart.getUTCMonth(), 1)
        );
        const endMonthBoundary = new Date(
          Date.UTC(effectiveEnd.getUTCFullYear(), effectiveEnd.getUTCMonth(), 1)
        );

        while (cursor.getTime() <= endMonthBoundary.getTime()) {
          const key = formatBucketKey(cursor);
          if (!bucketsMap.has(key)) {
            bucketsMap.set(key, { count: 0, scaleMap: new Map() });
          }
          // Increment month while day is anchored to 1 (avoids Jan 31 -> March rollover)
          cursor.setUTCMonth(cursor.getUTCMonth() + 1);
          cursor.setUTCDate(1);
        }
      } else if (interval === 'week') {
        const cursor = new Date(
          Date.UTC(
            effectiveStart.getUTCFullYear(),
            effectiveStart.getUTCMonth(),
            effectiveStart.getUTCDate()
          )
        );
        // Align to Monday of start week
        const dow = cursor.getUTCDay();
        const diff = (dow + 6) % 7;
        cursor.setUTCDate(cursor.getUTCDate() - diff);

        const endBoundary = new Date(
          Date.UTC(
            effectiveEnd.getUTCFullYear(),
            effectiveEnd.getUTCMonth(),
            effectiveEnd.getUTCDate()
          )
        );

        while (cursor.getTime() <= endBoundary.getTime()) {
          const key = formatBucketKey(cursor);
          if (!bucketsMap.has(key)) {
            bucketsMap.set(key, { count: 0, scaleMap: new Map() });
          }
          cursor.setUTCDate(cursor.getUTCDate() + 7);
        }
      } else {
        // Daily cursor
        const cursor = new Date(
          Date.UTC(
            effectiveStart.getUTCFullYear(),
            effectiveStart.getUTCMonth(),
            effectiveStart.getUTCDate()
          )
        );
        const endBoundary = new Date(
          Date.UTC(
            effectiveEnd.getUTCFullYear(),
            effectiveEnd.getUTCMonth(),
            effectiveEnd.getUTCDate()
          )
        );

        while (cursor.getTime() <= endBoundary.getTime()) {
          const key = formatBucketKey(cursor);
          if (!bucketsMap.has(key)) {
            bucketsMap.set(key, { count: 0, scaleMap: new Map() });
          }
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
      }

      // Populate buckets
      for (const resp of responses) {
        const subDate = resp.submittedAt instanceof Date ? resp.submittedAt : new Date(resp.submittedAt);
        const key = formatBucketKey(subDate);
        const bucket = bucketsMap.get(key);
        if (bucket) {
          bucket.count++;
          if (resp.answers && Array.isArray(resp.answers)) {
            for (const ans of resp.answers) {
              const rules = ans.question?.validationRules as any;
              const minRating = typeof rules?.minRating === 'number' ? rules.minRating : 1;
              const maxRating = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;

              if (!this.isValidRatingValue(ans.numberValue, minRating, maxRating)) {
                continue;
              }

              const scaleKey = `${minRating}-${maxRating}`;
              if (!bucket.scaleMap.has(scaleKey)) {
                bucket.scaleMap.set(scaleKey, { count: 0, sum: 0 });
              }
              const s = bucket.scaleMap.get(scaleKey)!;
              s.count++;
              s.sum += ans.numberValue!;
            }
          }
        }
      }

      // Format sorted output
      const sortedKeys = Array.from(bucketsMap.keys()).sort();
      const buckets: TrendBucket[] = sortedKeys.map((k) => {
        const data = bucketsMap.get(k)!;
        let averageRating: number | null = null;
        // Only return average rating if bucket contains answers on exactly 1 scale
        if (data.scaleMap.size === 1) {
          const single = Array.from(data.scaleMap.values())[0];
          averageRating =
            single.count > 0 ? Math.round((single.sum / single.count) * 100) / 100 : null;
        }
        return {
          date: k,
          count: data.count,
          averageRating,
        };
      });

      return {
        interval,
        startDate: effectiveStart.toISOString(),
        endDate: effectiveEnd.toISOString(),
        formId: query.formId ?? null,
        buckets,
        totalResponses: responses.length,
      };
    });
  }

  /**
   * 3. GET /analytics/ratings
   * Scale-aware rating aggregations, distributions, and question breakdowns without conflating scales.
   */
  async getRatings(
    companyId: string,
    query: AnalyticsRatingsQueryDto
  ): Promise<AnalyticsRatingsResponse> {
    const parsed = analyticsRatingsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid ratings query');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      if (query.formId) {
        await this.assertFormOwnership(tx, companyId, query.formId);
      }

      const { effectiveStart, effectiveEnd } = this.resolveEffectiveDateRange(
        query.startDate,
        query.endDate
      );

      // 1. Fetch form questions to map scale definitions
      const formWhere: any = { companyId };
      if (query.formId) {
        formWhere.id = query.formId;
      }

      const forms = await tx.feedbackForm.findMany({
        where: formWhere,
        select: {
          id: true,
          title: true,
          questions: {
            where: {
              questionType: { in: ['RATING', 'CSAT', 'NPS', 'LIKERT_SCALE'] },
            },
            select: {
              id: true,
              title: true,
              validationRules: true,
            },
          },
        },
      });

      const questionMap = new Map<string, { question: any; form: any }>();
      for (const f of forms) {
        if (f.questions && Array.isArray(f.questions)) {
          for (const q of f.questions) {
            questionMap.set(q.id, { question: q, form: f });
          }
        }
      }

      // 2. Fetch rating answers in window
      const responseWhere: any = {
        companyId,
        submittedAt: {
          gte: effectiveStart,
          lte: effectiveEnd,
        },
      };
      if (query.formId) {
        responseWhere.formId = query.formId;
      }

      const responses = await tx.feedbackResponse.findMany({
        where: responseWhere,
        select: {
          id: true,
          formId: true,
          answers: {
            where: {
              questionType: { in: ['RATING', 'CSAT', 'NPS', 'LIKERT_SCALE'] },
            },
            select: {
              questionId: true,
              questionTitle: true,
              numberValue: true,
            },
          },
        },
      });

      // 3. Aggregate rating answers by scale and by question
      const scaleAgg = new Map<
        string,
        {
          minRating: number;
          maxRating: number;
          count: number;
          sum: number;
          distributionMap: Map<number, number>;
        }
      >();

      const questionAgg = new Map<
        string,
        {
          questionId: string;
          questionTitle: string;
          formId: string;
          formTitle: string;
          minRating: number;
          maxRating: number;
          count: number;
          sum: number;
          distributionMap: Map<number, number>;
        }
      >();

      let totalRatingsCount = 0;

      for (const resp of responses) {
        if (!resp.answers || !Array.isArray(resp.answers)) continue;

        for (const ans of resp.answers) {
          const qInfo = questionMap.get(ans.questionId);
          const rules = qInfo?.question?.validationRules as any;
          const minRating = typeof rules?.minRating === 'number' ? rules.minRating : 1;
          const maxRating = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;

          if (!this.isValidRatingValue(ans.numberValue, minRating, maxRating)) {
            continue;
          }

          const score = Math.round(ans.numberValue!);
          const scaleKey = `${minRating}-${maxRating}`;

          if (!scaleAgg.has(scaleKey)) {
            const dist = new Map<number, number>();
            for (let r = minRating; r <= maxRating; r++) dist.set(r, 0);
            scaleAgg.set(scaleKey, {
              minRating,
              maxRating,
              count: 0,
              sum: 0,
              distributionMap: dist,
            });
          }

          const scaleData = scaleAgg.get(scaleKey)!;
          scaleData.count++;
          scaleData.sum += ans.numberValue!;
          scaleData.distributionMap.set(score, (scaleData.distributionMap.get(score) || 0) + 1);

          // By question tracking
          const qId = ans.questionId;
          if (!questionAgg.has(qId)) {
            const dist = new Map<number, number>();
            for (let r = minRating; r <= maxRating; r++) dist.set(r, 0);
            questionAgg.set(qId, {
              questionId: qId,
              questionTitle: ans.questionTitle || qInfo?.question?.title || 'Rating Question',
              formId: resp.formId,
              formTitle: qInfo?.form?.title || 'Feedback Form',
              minRating,
              maxRating,
              count: 0,
              sum: 0,
              distributionMap: dist,
            });
          }

          const qData = questionAgg.get(qId)!;
          qData.count++;
          qData.sum += ans.numberValue!;
          qData.distributionMap.set(score, (qData.distributionMap.get(score) || 0) + 1);

          totalRatingsCount++;
        }
      }

      // Build scales array
      const scales: RatingScaleBreakdown[] = Array.from(scaleAgg.values()).map((s) => {
        const avg = s.count > 0 ? Math.round((s.sum / s.count) * 100) / 100 : 0;
        const distribution: RatingScoreDistribution[] = [];
        for (let r = s.minRating; r <= s.maxRating; r++) {
          const cnt = s.distributionMap.get(r) || 0;
          const pct = s.count > 0 ? Math.round((cnt / s.count) * 10000) / 100 : 0;
          distribution.push({ rating: r, count: cnt, percentage: pct });
        }
        return {
          minRating: s.minRating,
          maxRating: s.maxRating,
          averageRating: avg,
          count: s.count,
          distribution,
        };
      });

      // Build byQuestion array
      const byQuestion: RatingQuestionBreakdown[] = Array.from(questionAgg.values()).map((q) => {
        const avg = q.count > 0 ? Math.round((q.sum / q.count) * 100) / 100 : 0;
        const distribution: RatingScoreDistribution[] = [];
        for (let r = q.minRating; r <= q.maxRating; r++) {
          const cnt = q.distributionMap.get(r) || 0;
          const pct = q.count > 0 ? Math.round((cnt / q.count) * 10000) / 100 : 0;
          distribution.push({ rating: r, count: cnt, percentage: pct });
        }
        return {
          questionId: q.questionId,
          questionTitle: q.questionTitle,
          formId: q.formId,
          formTitle: q.formTitle,
          scale: {
            minRating: q.minRating,
            maxRating: q.maxRating,
          },
          averageRating: avg,
          count: q.count,
          distribution,
        };
      });

      // Rating correctness:
      // If exactly 1 scale exists, return its average and distribution.
      // If multiple scales exist, return null for overallAverage and [] for distribution.
      // If no ratings exist, return null for overallAverage and [] for distribution.
      let overallAverage: number | null = null;
      let distribution: RatingScoreDistribution[] = [];

      if (scales.length === 1) {
        overallAverage = scales[0].averageRating;
        distribution = scales[0].distribution;
      }

      return {
        overallAverage,
        totalRatings: totalRatingsCount,
        scales,
        byQuestion,
        distribution,
      };
    });
  }

  /**
   * 4. GET /analytics/questions
   * Deep question-level analysis with respondent-based percentages and historical snapshot preservation.
   */
  async getQuestionAnalytics(
    companyId: string,
    formId: string,
    query: AnalyticsQuestionsQueryDto
  ): Promise<AnalyticsQuestionsResponse> {
    const targetFormId = formId || query.formId;
    const parsed = analyticsQuestionsQuerySchema.safeParse({
      ...query,
      formId: targetFormId,
    });
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid questions query');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await this.assertFormOwnership(tx, companyId, targetFormId);

      const { effectiveStart, effectiveEnd } = this.resolveEffectiveDateRange(
        query.startDate,
        query.endDate
      );

      // Fetch questions with active and historical options
      const questions = await tx.formQuestion.findMany({
        where: { formId: targetFormId },
        include: {
          options: {
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });

      // Count total distinct form responses in window
      const responseWhere: any = {
        companyId,
        formId: targetFormId,
        submittedAt: {
          gte: effectiveStart,
          lte: effectiveEnd,
        },
      };

      const responses = await tx.feedbackResponse.findMany({
        where: responseWhere,
        select: {
          id: true,
          answers: {
            select: {
              id: true,
              responseId: true,
              questionId: true,
              questionTitle: true,
              questionType: true,
              selectedOptionLabel: true,
              selectedOptionValue: true,
              selectedOptions: true,
              textValue: true,
              numberValue: true,
              booleanValue: true,
              jsonValue: true,
            },
          },
        },
      });

      const totalResponses = responses.length;

      // Group answers by questionId
      const answersByQuestion = new Map<string, any[]>();
      for (const resp of responses) {
        if (resp.answers && Array.isArray(resp.answers)) {
          for (const ans of resp.answers) {
            if (!answersByQuestion.has(ans.questionId)) {
              answersByQuestion.set(ans.questionId, []);
            }
            answersByQuestion.get(ans.questionId)!.push(ans);
          }
        }
      }

      const questionAnalyticsList: QuestionAnalyticsItem[] = [];

      for (const q of questions) {
        const answers = answersByQuestion.get(q.id) || [];

        // Deduplicate duplicate answer rows for the same responseId
        const seenResponseIds = new Set<string>();
        const dedupedAnswers: any[] = [];
        for (const ans of answers) {
          if (!seenResponseIds.has(ans.responseId)) {
            seenResponseIds.add(ans.responseId);
            dedupedAnswers.push(ans);
          }
        }

        // Collect distinct historical titles
        const historicalTitlesSet = new Set<string>();
        for (const ans of dedupedAnswers) {
          if (ans.questionTitle && ans.questionTitle.trim() !== '') {
            historicalTitlesSet.add(ans.questionTitle.trim());
          }
        }
        const historicalTitles = Array.from(historicalTitlesSet).filter((t) => t !== q.title);

        // Determine distinct answered respondents based on valid response content
        const distinctAnsweredRespondents = new Set<string>();
        for (const ans of dedupedAnswers) {
          let hasAnswer = false;
          if (q.questionType === 'SHORT_TEXT' || q.questionType === 'LONG_TEXT') {
            hasAnswer = Boolean(ans.textValue && ans.textValue.trim() !== '');
          } else if (
            q.questionType === 'RATING' ||
            q.questionType === 'CSAT' ||
            q.questionType === 'NPS' ||
            q.questionType === 'LIKERT_SCALE'
          ) {
            const rules = q.validationRules as any;
            const min = typeof rules?.minRating === 'number' ? rules.minRating : 1;
            const max = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;
            hasAnswer = this.isValidRatingValue(ans.numberValue, min, max);
          } else if (q.questionType === 'SINGLE_CHOICE') {
            hasAnswer = Boolean(ans.selectedOptionValue || ans.textValue);
          } else if (q.questionType === 'MULTIPLE_CHOICE') {
            const sels = ans.selectedOptions || ans.jsonValue;
            hasAnswer = Boolean(
              (Array.isArray(sels) && sels.length > 0) ||
                (ans.textValue && ans.textValue.trim() !== '')
            );
          } else if (q.questionType === 'YES_NO') {
            hasAnswer =
              ans.booleanValue !== null && ans.booleanValue !== undefined
                ? true
                : typeof ans.textValue === 'string' &&
                  ['yes', 'no', 'true', 'false'].includes(ans.textValue.trim().toLowerCase());
          }
          if (hasAnswer) {
            distinctAnsweredRespondents.add(ans.responseId);
          }
        }

        const totalAnswers = distinctAnsweredRespondents.size;
        const responseRate =
          totalResponses > 0 ? Math.round((totalAnswers / totalResponses) * 10000) / 100 : 0;

        const item: QuestionAnalyticsItem = {
          questionId: q.id,
          questionTitle: q.title,
          historicalTitles: historicalTitles.length > 0 ? historicalTitles : undefined,
          questionType: q.questionType as any,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          totalAnswers,
          responseRate,
        };

        switch (q.questionType) {
          case 'SHORT_TEXT':
          case 'LONG_TEXT': {
            let totalLength = 0;
            let validTextCount = 0;
            for (const ans of dedupedAnswers) {
              if (distinctAnsweredRespondents.has(ans.responseId)) {
                const txt = ans.textValue?.trim() || '';
                totalLength += txt.length;
                validTextCount++;
              }
            }
            item.textMetrics = {
              textAnswersCount: validTextCount,
              averageLength:
                validTextCount > 0 ? Math.round((totalLength / validTextCount) * 10) / 10 : 0,
            };
            break;
          }

          case 'RATING':
          case 'CSAT':
          case 'NPS':
          case 'LIKERT_SCALE': {
            const rules = q.validationRules as any;
            const minRating = typeof rules?.minRating === 'number' ? rules.minRating : 1;
            const maxRating = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;

            const distMap = new Map<number, number>();
            for (let r = minRating; r <= maxRating; r++) distMap.set(r, 0);

            let sum = 0;
            let validCount = 0;

            for (const ans of dedupedAnswers) {
              if (
                distinctAnsweredRespondents.has(ans.responseId) &&
                this.isValidRatingValue(ans.numberValue, minRating, maxRating)
              ) {
                const score = Math.round(ans.numberValue!);
                sum += ans.numberValue!;
                validCount++;
                distMap.set(score, (distMap.get(score) || 0) + 1);
              }
            }

            const distribution: RatingScoreDistribution[] = [];
            for (let r = minRating; r <= maxRating; r++) {
              const cnt = distMap.get(r) || 0;
              const pct =
                validCount > 0 ? Math.round((cnt / validCount) * 10000) / 100 : 0;
              distribution.push({ rating: r, count: cnt, percentage: pct });
            }

            item.ratingMetrics = {
              averageRating:
                validCount > 0 ? Math.round((sum / validCount) * 100) / 100 : 0,
              scale: { minRating, maxRating },
              distribution,
            };
            break;
          }

          case 'SINGLE_CHOICE': {
            // Option map storing option value -> { label, count, historicalLabels: Set }
            const optionsMap = new Map<
              string,
              {
                label: string;
                value: string;
                count: number;
                historicalLabels: Set<string>;
              }
            >();

            if (q.options && Array.isArray(q.options)) {
              for (const opt of q.options) {
                optionsMap.set(opt.value, {
                  label: opt.label,
                  value: opt.value,
                  count: 0,
                  historicalLabels: new Set(),
                });
              }
            }

            // Count distinct respondents per option
            for (const ans of dedupedAnswers) {
              if (!distinctAnsweredRespondents.has(ans.responseId)) continue;
              const optVal = ans.selectedOptionValue || ans.textValue;
              const optLabel = ans.selectedOptionLabel || optVal;

              if (optVal) {
                if (!optionsMap.has(optVal)) {
                  optionsMap.set(optVal, {
                    label: optLabel || optVal,
                    value: optVal,
                    count: 0,
                    historicalLabels: new Set(),
                  });
                }
                const entry = optionsMap.get(optVal)!;
                entry.count++;
                if (ans.selectedOptionLabel && ans.selectedOptionLabel !== entry.label) {
                  entry.historicalLabels.add(ans.selectedOptionLabel);
                }
              }
            }

            const options: ChoiceOptionAnalytics[] = Array.from(optionsMap.values()).map((opt) => ({
              label: opt.label,
              value: opt.value,
              count: opt.count,
              percentage:
                totalAnswers > 0 ? Math.round((opt.count / totalAnswers) * 10000) / 100 : 0,
              historicalLabels:
                opt.historicalLabels.size > 0 ? Array.from(opt.historicalLabels) : undefined,
            }));

            item.choiceMetrics = { options };
            break;
          }

          case 'MULTIPLE_CHOICE': {
            const optionsMap = new Map<
              string,
              {
                label: string;
                value: string;
                count: number;
                historicalLabels: Set<string>;
              }
            >();

            if (q.options && Array.isArray(q.options)) {
              for (const opt of q.options) {
                optionsMap.set(opt.value, {
                  label: opt.label,
                  value: opt.value,
                  count: 0,
                  historicalLabels: new Set(),
                });
              }
            }

            // For each distinct respondent, tally each chosen option once
            for (const ans of dedupedAnswers) {
              if (!distinctAnsweredRespondents.has(ans.responseId)) continue;

              let selections: Array<{ label?: string; value: string }> = [];
              if (ans.selectedOptions && Array.isArray(ans.selectedOptions)) {
                selections = ans.selectedOptions;
              } else if (ans.jsonValue && Array.isArray(ans.jsonValue)) {
                selections = ans.jsonValue.map((item: any) =>
                  typeof item === 'string' ? { label: item, value: item } : item
                );
              } else if (ans.textValue) {
                selections = ans.textValue.split(',').map((s: string) => ({
                  label: s.trim(),
                  value: s.trim(),
                }));
              }

              const selectedValuesInThisResponse = new Set<string>();

              for (const sel of selections) {
                if (sel && sel.value && !selectedValuesInThisResponse.has(sel.value)) {
                  selectedValuesInThisResponse.add(sel.value);

                  if (!optionsMap.has(sel.value)) {
                    optionsMap.set(sel.value, {
                      label: sel.label || sel.value,
                      value: sel.value,
                      count: 0,
                      historicalLabels: new Set(),
                    });
                  }
                  const entry = optionsMap.get(sel.value)!;
                  entry.count++;
                  if (sel.label && sel.label !== entry.label) {
                    entry.historicalLabels.add(sel.label);
                  }
                }
              }
            }

            // Percentage is calculated against distinct answered respondents (can sum to > 100%)
            const options: ChoiceOptionAnalytics[] = Array.from(optionsMap.values()).map((opt) => ({
              label: opt.label,
              value: opt.value,
              count: opt.count,
              percentage:
                totalAnswers > 0 ? Math.round((opt.count / totalAnswers) * 10000) / 100 : 0,
              historicalLabels:
                opt.historicalLabels.size > 0 ? Array.from(opt.historicalLabels) : undefined,
            }));

            item.choiceMetrics = { options };
            break;
          }

          case 'YES_NO': {
            let yesCount = 0;
            let noCount = 0;

            for (const ans of dedupedAnswers) {
              if (!distinctAnsweredRespondents.has(ans.responseId)) continue;

              if (ans.booleanValue === true) {
                yesCount++;
              } else if (ans.booleanValue === false) {
                noCount++;
              } else if (ans.textValue) {
                const val = ans.textValue.trim().toLowerCase();
                if (val === 'yes' || val === 'true') {
                  yesCount++;
                } else if (val === 'no' || val === 'false') {
                  noCount++;
                }
              }
            }

            const answeredYesNo = yesCount + noCount;
            item.yesNoMetrics = {
              yesCount,
              noCount,
              yesPercentage:
                answeredYesNo > 0 ? Math.round((yesCount / answeredYesNo) * 10000) / 100 : 0,
              noPercentage:
                answeredYesNo > 0 ? Math.round((noCount / answeredYesNo) * 10000) / 100 : 0,
            };
            break;
          }
        }

        questionAnalyticsList.push(item);
      }

      return {
        formId: form.id,
        formTitle: form.title,
        totalResponses,
        startDate: query.startDate ? effectiveStart.toISOString() : null,
        endDate: query.endDate ? effectiveEnd.toISOString() : null,
        questions: questionAnalyticsList,
      };
    });
  }

  /**
   * 5. GET /analytics/forms
   * Paginated company forms directory with database-side filtering, aggregation, and scale awareness.
   */
  async getFormsAnalytics(
    companyId: string,
    query: AnalyticsFormsQueryDto
  ): Promise<AnalyticsFormsResponse> {
    const parsed = analyticsFormsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid forms query');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';

      const { effectiveStart, effectiveEnd } = this.resolveEffectiveDateRange(
        query.startDate,
        query.endDate
      );

      // Database-level filtering for forms
      const formWhere: any = { companyId };
      if (query.status) {
        formWhere.status = query.status;
      }
      if (query.search?.trim()) {
        const term = query.search.trim();
        formWhere.OR = [
          { title: { contains: term } },
          { internalName: { contains: term } },
        ];
      }

      const totalItems = await tx.feedbackForm.count({
        where: formWhere,
      });

      if (totalItems === 0) {
        return {
          forms: [],
          pagination: {
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
            limit,
          },
        };
      }

      // Check if sorting by a native database column
      const isNativeSort = ['createdAt', 'publishedAt', 'title'].includes(sortBy);

      let targetForms: any[] = [];

      if (isNativeSort) {
        // Database-level pagination
        const skip = (page - 1) * limit;
        targetForms = await tx.feedbackForm.findMany({
          where: formWhere,
          orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            audienceType: true,
            anonymityMode: true,
            publishedAt: true,
            createdAt: true,
          },
        });
      } else {
        // Candidate stubs when sorting by computed metrics
        targetForms = await tx.feedbackForm.findMany({
          where: formWhere,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            audienceType: true,
            anonymityMode: true,
            publishedAt: true,
            createdAt: true,
          },
        });
      }

      // Aggregate responses and ratings for candidate forms
      const formIds = targetForms.map((f) => f.id);
      const responseWhere: any = {
        companyId,
        formId: { in: formIds },
        submittedAt: {
          gte: effectiveStart,
          lte: effectiveEnd,
        },
      };

      const responses = await tx.feedbackResponse.findMany({
        where: responseWhere,
        select: {
          formId: true,
          submittedAt: true,
          answers: {
            where: {
              questionType: { in: ['RATING', 'CSAT', 'NPS', 'LIKERT_SCALE'] },
            },
            select: {
              numberValue: true,
              question: {
                select: {
                  validationRules: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      // Index metrics per form
      const formMetricsMap = new Map<
        string,
        {
          count: number;
          latestResponseAt: Date | null;
          scaleMap: Map<string, { count: number; sum: number; min: number; max: number }>;
        }
      >();

      for (const f of targetForms) {
        formMetricsMap.set(f.id, {
          count: 0,
          latestResponseAt: null,
          scaleMap: new Map(),
        });
      }

      for (const resp of responses) {
        const metric = formMetricsMap.get(resp.formId);
        if (metric) {
          metric.count++;
          const subDate =
            resp.submittedAt instanceof Date ? resp.submittedAt : new Date(resp.submittedAt);
          if (!metric.latestResponseAt || subDate.getTime() > metric.latestResponseAt.getTime()) {
            metric.latestResponseAt = subDate;
          }

          if (resp.answers && Array.isArray(resp.answers)) {
            for (const ans of resp.answers) {
              const rules = ans.question?.validationRules as any;
              const minRating = typeof rules?.minRating === 'number' ? rules.minRating : 1;
              const maxRating = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;

              if (!this.isValidRatingValue(ans.numberValue, minRating, maxRating)) {
                continue;
              }

              const scaleKey = `${minRating}-${maxRating}`;
              if (!metric.scaleMap.has(scaleKey)) {
                metric.scaleMap.set(scaleKey, {
                  count: 0,
                  sum: 0,
                  min: minRating,
                  max: maxRating,
                });
              }
              const s = metric.scaleMap.get(scaleKey)!;
              s.count++;
              s.sum += ans.numberValue!;
            }
          }
        }
      }

      // Assemble summaries
      let summaries: FormAnalyticsSummary[] = targetForms.map((f) => {
        const metric = formMetricsMap.get(f.id)!;
        let averageRating: number | null = null;
        let ratingScale: { minRating: number; maxRating: number } | null = null;

        // Scale-aware: only if exactly 1 scale exists across ratings on this form
        if (metric.scaleMap.size === 1) {
          const single = Array.from(metric.scaleMap.values())[0];
          averageRating =
            single.count > 0 ? Math.round((single.sum / single.count) * 100) / 100 : null;
          ratingScale = { minRating: single.min, maxRating: single.max };
        }

        return {
          formId: f.id,
          title: f.title,
          slug: f.slug,
          status: f.status,
          audienceType: f.audienceType,
          anonymityMode: f.anonymityMode,
          publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
          createdAt: new Date(f.createdAt).toISOString(),
          responseCount: metric.count,
          latestResponseAt: metric.latestResponseAt ? metric.latestResponseAt.toISOString() : null,
          averageRating,
          ratingScale,
        };
      });

      // If sorting by non-native computed metrics, sort in application and paginate
      if (!isNativeSort) {
        summaries.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'responseCount':
              comparison = a.responseCount - b.responseCount;
              break;
            case 'latestResponseAt': {
              const timeA = a.latestResponseAt ? new Date(a.latestResponseAt).getTime() : 0;
              const timeB = b.latestResponseAt ? new Date(b.latestResponseAt).getTime() : 0;
              comparison = timeA - timeB;
              break;
            }
          }
          if (comparison === 0) {
            comparison = a.formId.localeCompare(b.formId);
          }
          return sortOrder === 'desc' ? -comparison : comparison;
        });

        const skip = (page - 1) * limit;
        summaries = summaries.slice(skip, skip + limit);
      }

      const totalPages = Math.max(1, Math.ceil(totalItems / limit));

      return {
        forms: summaries,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    });
  }
}
