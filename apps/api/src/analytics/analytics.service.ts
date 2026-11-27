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

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly prisma: PrismaService;

  constructor(@Optional() prisma?: PrismaService) {
    this.prisma = prisma || new PrismaService();
  }

  /**
   * Parse and normalize date boundaries.
   * If endDate is given as YYYY-MM-DD, normalize to 23:59:59.999Z of that date.
   */
  private parseDateRange(
    rawStart?: string,
    rawEnd?: string
  ): { startDate?: Date; endDate?: Date } {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (rawStart) {
      const s = new Date(rawStart);
      if (isNaN(s.getTime())) {
        throw new BadRequestException('Invalid startDate format');
      }
      startDate = s;
    }

    if (rawEnd) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawEnd.trim())) {
        endDate = new Date(`${rawEnd.trim()}T23:59:59.999Z`);
      } else {
        const e = new Date(rawEnd);
        if (isNaN(e.getTime())) {
          throw new BadRequestException('Invalid endDate format');
        }
        endDate = e;
      }
    }

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    return { startDate, endDate };
  }

  /**
   * Asserts that a form exists and belongs to the given tenant.
   */
  private async assertFormOwnership(companyId: string, formId: string): Promise<any> {
    const form = await this.prisma.feedbackForm.findFirst({
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
   * 1. GET /analytics/overview
   * High-level executive overview with metrics, ratings, and prior period comparisons.
   */
  async getOverview(
    companyId: string,
    query: AnalyticsOverviewQueryDto
  ): Promise<AnalyticsOverviewResponse> {
    const parsed = analyticsOverviewQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid overview query');
    }

    if (query.formId) {
      await this.assertFormOwnership(companyId, query.formId);
    }

    const { startDate, endDate } = this.parseDateRange(query.startDate, query.endDate);

    // Filter condition for current window
    const baseWhere: any = { companyId };
    if (query.formId) {
      baseWhere.formId = query.formId;
    }

    // Total all-time responses for the tenant (or specified form)
    const totalResponses = await this.prisma.feedbackResponse.count({
      where: baseWhere,
    });

    // Published forms count
    const publishedFormsCount = await this.prisma.feedbackForm.count({
      where: {
        companyId,
        status: 'PUBLISHED',
      },
    });

    // Current window responses
    const windowWhere: any = { ...baseWhere };
    if (startDate || endDate) {
      windowWhere.submittedAt = {};
      if (startDate) windowWhere.submittedAt.gte = startDate;
      if (endDate) windowWhere.submittedAt.lte = endDate;
    }

    const currentResponses = await this.prisma.feedbackResponse.findMany({
      where: windowWhere,
      include: { answers: true },
    });

    const filteredResponses = currentResponses.length;

    // Collect rating answers
    let ratingSum = 0;
    let ratingResponsesCount = 0;

    for (const resp of currentResponses) {
      if (resp.answers && Array.isArray(resp.answers)) {
        for (const ans of resp.answers) {
          if (
            (ans.questionType === 'RATING' || ans.questionType === 'CSAT' || ans.questionType === 'NPS') &&
            ans.numberValue !== null &&
            ans.numberValue !== undefined &&
            !isNaN(ans.numberValue)
          ) {
            ratingSum += ans.numberValue;
            ratingResponsesCount++;
          }
        }
      }
    }

    const averageRating =
      ratingResponsesCount > 0
        ? Math.round((ratingSum / ratingResponsesCount) * 100) / 100
        : null;

    // Calculate previous period
    // If no date range specified, default window duration to 30 days
    const now = new Date();
    const effectiveEnd = endDate || now;
    const effectiveStart = startDate || new Date(effectiveEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    const durationMs = effectiveEnd.getTime() - effectiveStart.getTime();

    const prevEnd = new Date(effectiveStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const prevResponses = await this.prisma.feedbackResponse.findMany({
      where: {
        ...baseWhere,
        submittedAt: {
          gte: prevStart,
          lte: prevEnd,
        },
      },
      include: { answers: true },
    });

    const prevCount = prevResponses.length;
    let prevRatingSum = 0;
    let prevRatingCount = 0;

    for (const resp of prevResponses) {
      if (resp.answers && Array.isArray(resp.answers)) {
        for (const ans of resp.answers) {
          if (
            (ans.questionType === 'RATING' || ans.questionType === 'CSAT' || ans.questionType === 'NPS') &&
            ans.numberValue !== null &&
            ans.numberValue !== undefined &&
            !isNaN(ans.numberValue)
          ) {
            prevRatingSum += ans.numberValue;
            prevRatingCount++;
          }
        }
      }
    }

    const prevAverageRating =
      prevRatingCount > 0
        ? Math.round((prevRatingSum / prevRatingCount) * 100) / 100
        : null;

    let responseChangePercentage: number | null = null;
    if (prevCount === 0) {
      responseChangePercentage = filteredResponses > 0 ? 100 : 0;
    } else {
      responseChangePercentage =
        Math.round(((filteredResponses - prevCount) / prevCount) * 10000) / 100;
    }

    let ratingChange: number | null = null;
    if (averageRating !== null && prevAverageRating !== null) {
      ratingChange = Math.round((averageRating - prevAverageRating) * 100) / 100;
    }

    return {
      totalResponses,
      filteredResponses,
      publishedFormsCount,
      averageRating,
      ratingResponsesCount,
      previousPeriod: {
        startDate: prevStart.toISOString(),
        endDate: prevEnd.toISOString(),
        responseCount: prevCount,
        averageRating: prevAverageRating,
        responseChangePercentage,
        ratingChange,
      },
    };
  }

  /**
   * 2. GET /analytics/trends
   * Time-series feedback submission buckets (day, week, month), fully zero-filled.
   */
  async getTrends(
    companyId: string,
    query: AnalyticsTrendsQueryDto
  ): Promise<AnalyticsTrendsResponse> {
    const parsed = analyticsTrendsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid trends query');
    }

    if (query.formId) {
      await this.assertFormOwnership(companyId, query.formId);
    }

    const interval = query.interval || 'day';

    // Default window: last 30 days if not provided
    const now = new Date();
    const effectiveEnd = query.endDate
      ? /^\d{4}-\d{2}-\d{2}$/.test(query.endDate.trim())
        ? new Date(`${query.endDate.trim()}T23:59:59.999Z`)
        : new Date(query.endDate)
      : now;

    const effectiveStart = query.startDate
      ? new Date(query.startDate)
      : new Date(effectiveEnd.getTime() - 29 * 24 * 60 * 60 * 1000);

    if (effectiveStart.getTime() > effectiveEnd.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

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

    // Query responses
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

    const responses = await this.prisma.feedbackResponse.findMany({
      where,
      include: { answers: true },
    });

    // Helper to generate ISO bucket date string
    const formatBucketKey = (d: Date): string => {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');

      if (interval === 'month') {
        return `${year}-${month}-01`;
      }
      if (interval === 'week') {
        // Find Monday of the week
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

    // Build zero-filled buckets map
    const bucketsMap = new Map<string, { count: number; ratingSum: number; ratingCount: number }>();

    const cursor = new Date(effectiveStart.getTime());
    // Normalize cursor to start of day UTC
    cursor.setUTCHours(0, 0, 0, 0);

    const endBoundary = new Date(effectiveEnd.getTime());

    while (cursor.getTime() <= endBoundary.getTime()) {
      const key = formatBucketKey(cursor);
      if (!bucketsMap.has(key)) {
        bucketsMap.set(key, { count: 0, ratingSum: 0, ratingCount: 0 });
      }

      if (interval === 'month') {
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        cursor.setUTCDate(1);
      } else if (interval === 'week') {
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      } else {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    // Also ensure the exact formatBucketKey of effectiveEnd is present
    const endKey = formatBucketKey(endBoundary);
    if (!bucketsMap.has(endKey)) {
      bucketsMap.set(endKey, { count: 0, ratingSum: 0, ratingCount: 0 });
    }

    // Populate responses into buckets
    for (const resp of responses) {
      const subDate = resp.submittedAt instanceof Date ? resp.submittedAt : new Date(resp.submittedAt);
      const key = formatBucketKey(subDate);
      const bucket = bucketsMap.get(key);
      if (bucket) {
        bucket.count++;
        if (resp.answers && Array.isArray(resp.answers)) {
          for (const ans of resp.answers) {
            if (
              (ans.questionType === 'RATING' || ans.questionType === 'CSAT' || ans.questionType === 'NPS') &&
              ans.numberValue !== null &&
              ans.numberValue !== undefined &&
              !isNaN(ans.numberValue)
            ) {
              bucket.ratingSum += ans.numberValue;
              bucket.ratingCount++;
            }
          }
        }
      }
    }

    // Format sorted output
    const sortedKeys = Array.from(bucketsMap.keys()).sort();
    const buckets: TrendBucket[] = sortedKeys.map((k) => {
      const data = bucketsMap.get(k)!;
      return {
        date: k,
        count: data.count,
        averageRating:
          data.ratingCount > 0
            ? Math.round((data.ratingSum / data.ratingCount) * 100) / 100
            : null,
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
  }

  /**
   * 3. GET /analytics/ratings
   * Scale-aware rating analysis: isolates disparate scales, builds distributions and question breakdowns.
   */
  async getRatings(
    companyId: string,
    query: AnalyticsRatingsQueryDto
  ): Promise<AnalyticsRatingsResponse> {
    const parsed = analyticsRatingsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid ratings query');
    }

    if (query.formId) {
      await this.assertFormOwnership(companyId, query.formId);
    }

    const { startDate, endDate } = this.parseDateRange(query.startDate, query.endDate);

    // 1. Get all forms for company
    const formWhere: any = { companyId };
    if (query.formId) {
      formWhere.id = query.formId;
    }

    const forms = await this.prisma.feedbackForm.findMany({
      where: formWhere,
      include: {
        questions: {
          where: {
            questionType: { in: ['RATING', 'CSAT', 'NPS', 'LIKERT_SCALE'] },
          },
        },
      },
    });

    const formMap = new Map<string, any>();
    const ratingQuestionMap = new Map<string, { question: any; form: any }>();

    for (const f of forms) {
      formMap.set(f.id, f);
      if (f.questions && Array.isArray(f.questions)) {
        for (const q of f.questions) {
          ratingQuestionMap.set(q.id, { question: q, form: f });
        }
      }
    }

    // 2. Fetch responses in window
    const responseWhere: any = { companyId };
    if (query.formId) {
      responseWhere.formId = query.formId;
    }
    if (startDate || endDate) {
      responseWhere.submittedAt = {};
      if (startDate) responseWhere.submittedAt.gte = startDate;
      if (endDate) responseWhere.submittedAt.lte = endDate;
    }

    const responses = await this.prisma.feedbackResponse.findMany({
      where: responseWhere,
      include: { answers: true },
    });

    // 3. Aggregate rating answers
    // Key scales by "minRating-maxRating"
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
        if (ans.numberValue === null || ans.numberValue === undefined || isNaN(ans.numberValue)) {
          continue;
        }

        const qInfo = ratingQuestionMap.get(ans.questionId);
        const rules = qInfo?.question?.validationRules as any;
        const minRating = typeof rules?.minRating === 'number' ? rules.minRating : 1;
        const maxRating = typeof rules?.maxRating === 'number' ? rules.maxRating : 5;
        const score = Math.round(ans.numberValue);

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
        scaleData.sum += ans.numberValue;
        scaleData.distributionMap.set(score, (scaleData.distributionMap.get(score) || 0) + 1);

        // Question-level tracking
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
        qData.sum += ans.numberValue;
        qData.distributionMap.set(score, (qData.distributionMap.get(score) || 0) + 1);

        totalRatingsCount++;
      }
    }

    // Build scales response
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

    // Build question breakdown
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

    // Primary distribution (from largest scale, or default 1-5 scale)
    let primaryDistribution: RatingScoreDistribution[] = [];
    let overallAverage: number | null = null;

    if (scales.length > 0) {
      // Sort scales by count descending
      const primaryScale = [...scales].sort((a, b) => b.count - a.count)[0];
      primaryDistribution = primaryScale.distribution;
      overallAverage = primaryScale.averageRating;
    } else {
      // Default 1-5 distribution if no ratings exist
      for (let r = 1; r <= 5; r++) {
        primaryDistribution.push({ rating: r, count: 0, percentage: 0 });
      }
    }

    return {
      overallAverage,
      totalRatings: totalRatingsCount,
      scales,
      byQuestion,
      distribution: primaryDistribution,
    };
  }

  /**
   * 4. GET /analytics/questions
   * Deep question-level analysis covering all 6 question types with historical option interpretation.
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

    const form = await this.assertFormOwnership(companyId, targetFormId);

    const { startDate, endDate } = this.parseDateRange(query.startDate, query.endDate);

    // Fetch questions with current options
    const questions = await this.prisma.formQuestion.findMany({
      where: { formId },
      include: { options: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Fetch responses for this form in window
    const responseWhere: any = { companyId, formId };
    if (startDate || endDate) {
      responseWhere.submittedAt = {};
      if (startDate) responseWhere.submittedAt.gte = startDate;
      if (endDate) responseWhere.submittedAt.lte = endDate;
    }

    const responses = await this.prisma.feedbackResponse.findMany({
      where: responseWhere,
      include: { answers: true },
    });

    const totalResponses = responses.length;

    // Index answers by questionId
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
      const totalAnswers = answers.length;
      const responseRate =
        totalResponses > 0 ? Math.round((totalAnswers / totalResponses) * 10000) / 100 : 0;

      const item: QuestionAnalyticsItem = {
        questionId: q.id,
        questionTitle: q.title,
        questionType: q.questionType as any,
        isRequired: q.isRequired,
        orderIndex: q.orderIndex,
        totalAnswers,
        responseRate,
      };

      switch (q.questionType) {
        case 'SHORT_TEXT':
        case 'LONG_TEXT': {
          let textCount = 0;
          let totalLength = 0;
          for (const ans of answers) {
            const txt = ans.textValue?.trim();
            if (txt) {
              textCount++;
              totalLength += txt.length;
            }
          }
          item.textMetrics = {
            textAnswersCount: textCount,
            averageLength:
              textCount > 0 ? Math.round((totalLength / textCount) * 10) / 10 : 0,
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

          for (const ans of answers) {
            if (ans.numberValue !== null && ans.numberValue !== undefined && !isNaN(ans.numberValue)) {
              sum += ans.numberValue;
              validCount++;
              const score = Math.round(ans.numberValue);
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
          // Initialize defined options with 0 counts
          const optionsMap = new Map<string, { label: string; value: string; count: number }>();
          if (q.options && Array.isArray(q.options)) {
            for (const opt of q.options) {
              optionsMap.set(opt.value, { label: opt.label, value: opt.value, count: 0 });
            }
          }

          // Count answers using historical snapshot where available
          for (const ans of answers) {
            const optVal = ans.selectedOptionValue || ans.textValue;
            const optLabel = ans.selectedOptionLabel || optVal;
            if (optVal) {
              if (!optionsMap.has(optVal)) {
                optionsMap.set(optVal, { label: optLabel || optVal, value: optVal, count: 0 });
              }
              optionsMap.get(optVal)!.count++;
            }
          }

          const options: ChoiceOptionAnalytics[] = Array.from(optionsMap.values()).map((opt) => ({
            label: opt.label,
            value: opt.value,
            count: opt.count,
            percentage:
              totalAnswers > 0 ? Math.round((opt.count / totalAnswers) * 10000) / 100 : 0,
          }));

          item.choiceMetrics = { options };
          break;
        }

        case 'MULTIPLE_CHOICE': {
          const optionsMap = new Map<string, { label: string; value: string; count: number }>();
          if (q.options && Array.isArray(q.options)) {
            for (const opt of q.options) {
              optionsMap.set(opt.value, { label: opt.label, value: opt.value, count: 0 });
            }
          }

          for (const ans of answers) {
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

            for (const sel of selections) {
              if (sel && sel.value) {
                if (!optionsMap.has(sel.value)) {
                  optionsMap.set(sel.value, {
                    label: sel.label || sel.value,
                    value: sel.value,
                    count: 0,
                  });
                }
                optionsMap.get(sel.value)!.count++;
              }
            }
          }

          const options: ChoiceOptionAnalytics[] = Array.from(optionsMap.values()).map((opt) => ({
            label: opt.label,
            value: opt.value,
            count: opt.count,
            percentage:
              totalAnswers > 0 ? Math.round((opt.count / totalAnswers) * 10000) / 100 : 0,
          }));

          item.choiceMetrics = { options };
          break;
        }

        case 'YES_NO': {
          let yesCount = 0;
          let noCount = 0;

          for (const ans of answers) {
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

          const answered = yesCount + noCount;
          item.yesNoMetrics = {
            yesCount,
            noCount,
            yesPercentage:
              answered > 0 ? Math.round((yesCount / answered) * 10000) / 100 : 0,
            noPercentage:
              answered > 0 ? Math.round((noCount / answered) * 10000) / 100 : 0,
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
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      questions: questionAnalyticsList,
    };
  }

  /**
   * 5. GET /analytics/forms
   * Form performance directory with deterministic pagination, sorting, search, and metrics.
   */
  async getFormsAnalytics(
    companyId: string,
    query: AnalyticsFormsQueryDto
  ): Promise<AnalyticsFormsResponse> {
    const parsed = analyticsFormsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid forms query');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const { startDate, endDate } = this.parseDateRange(query.startDate, query.endDate);

    // Build form query filter
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

    const allMatchingForms = await this.prisma.feedbackForm.findMany({
      where: formWhere,
    });

    const totalItems = allMatchingForms.length;

    // Fetch responses for metric aggregation
    const responseWhere: any = { companyId };
    if (startDate || endDate) {
      responseWhere.submittedAt = {};
      if (startDate) responseWhere.submittedAt.gte = startDate;
      if (endDate) responseWhere.submittedAt.lte = endDate;
    }

    const responses = await this.prisma.feedbackResponse.findMany({
      where: responseWhere,
      include: { answers: true },
      orderBy: { submittedAt: 'desc' },
    });

    // Form response metrics map
    const formMetricsMap = new Map<
      string,
      { count: number; latestResponseAt: Date | null; ratingSum: number; ratingCount: number }
    >();

    for (const f of allMatchingForms) {
      formMetricsMap.set(f.id, {
        count: 0,
        latestResponseAt: null,
        ratingSum: 0,
        ratingCount: 0,
      });
    }

    for (const resp of responses) {
      const metric = formMetricsMap.get(resp.formId);
      if (metric) {
        metric.count++;
        const subDate = resp.submittedAt instanceof Date ? resp.submittedAt : new Date(resp.submittedAt);
        if (!metric.latestResponseAt || subDate.getTime() > metric.latestResponseAt.getTime()) {
          metric.latestResponseAt = subDate;
        }

        if (resp.answers && Array.isArray(resp.answers)) {
          for (const ans of resp.answers) {
            if (
              (ans.questionType === 'RATING' || ans.questionType === 'CSAT' || ans.questionType === 'NPS') &&
              ans.numberValue !== null &&
              ans.numberValue !== undefined &&
              !isNaN(ans.numberValue)
            ) {
              metric.ratingSum += ans.numberValue;
              metric.ratingCount++;
            }
          }
        }
      }
    }

    // Assemble form summaries
    const summaries: FormAnalyticsSummary[] = allMatchingForms.map((f) => {
      const metric = formMetricsMap.get(f.id)!;
      const averageRating =
        metric.ratingCount > 0
          ? Math.round((metric.ratingSum / metric.ratingCount) * 100) / 100
          : null;

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
      };
    });

    // Deterministic sorting
    summaries.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'responseCount':
          comparison = a.responseCount - b.responseCount;
          break;
        case 'latestResponseAt': {
          const timeA = a.latestResponseAt ? new Date(a.latestResponseAt).getTime() : 0;
          const timeB = b.latestResponseAt ? new Date(b.latestResponseAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
        case 'publishedAt': {
          const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
        case 'createdAt':
        default: {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          comparison = timeA - timeB;
          break;
        }
      }

      if (comparison === 0) {
        // Secondary deterministic sort by formId
        comparison = a.formId.localeCompare(b.formId);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedForms = summaries.slice(skip, skip + limit);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      forms: paginatedForms,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }
}
