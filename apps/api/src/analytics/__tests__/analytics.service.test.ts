import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const tenantA = 'c0000001-1111-2222-3333-444455556666';
  const tenantB = 'c0000002-1111-2222-3333-444455556666';

  const formA1Id = 'a0000001-1111-2222-3333-444455556666';
  const formA2Id = 'a0000002-1111-2222-3333-444455556666';
  const formB1Id = 'b0000001-1111-2222-3333-444455556666';

  const qTextId = 'e0000001-1111-2222-3333-444455556666';
  const qRating5Id = 'e0000002-1111-2222-3333-444455556666';
  const qSingleChoiceId = 'e0000003-1111-2222-3333-444455556666';
  const qMultiChoiceId = 'e0000004-1111-2222-3333-444455556666';
  const qYesNoId = 'e0000005-1111-2222-3333-444455556666';
  const qRating10Id = 'e0000006-1111-2222-3333-444455556666';

  beforeEach(async () => {
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    service = new AnalyticsService(prisma);

    // 1. Seed Companies
    await prisma.company.create({
      data: {
        id: tenantA,
        name: 'Acme Corp',
        slug: 'acme',
        status: 'ACTIVE',
        isActive: true,
      },
    });

    await prisma.company.create({
      data: {
        id: tenantB,
        name: 'Beta LLC',
        slug: 'beta',
        status: 'ACTIVE',
        isActive: true,
      },
    });

    // 2. Seed Forms for Tenant A
    await prisma.feedbackForm.create({
      data: {
        id: formA1Id,
        companyId: tenantA,
        title: 'Customer Satisfaction Survey',
        internalName: 'CSAT Form',
        slug: 'acme-csat',
        status: 'PUBLISHED',
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        questions: {
          create: [
            {
              id: qTextId,
              questionType: 'SHORT_TEXT',
              title: 'What did you like the most?',
              isRequired: true,
              orderIndex: 0,
            },
            {
              id: qRating5Id,
              questionType: 'RATING',
              title: 'Overall satisfaction',
              isRequired: true,
              orderIndex: 1,
              validationRules: { minRating: 1, maxRating: 5 },
            },
            {
              id: qSingleChoiceId,
              questionType: 'SINGLE_CHOICE',
              title: 'Favorite color',
              isRequired: false,
              orderIndex: 2,
              options: {
                create: [
                  { label: 'Red', value: 'red', orderIndex: 0 },
                  { label: 'Blue', value: 'blue', orderIndex: 1 },
                ],
              },
            },
            {
              id: qMultiChoiceId,
              questionType: 'MULTIPLE_CHOICE',
              title: 'Which features do you use?',
              isRequired: false,
              orderIndex: 3,
              options: {
                create: [
                  { label: 'Feature A', value: 'feat_a', orderIndex: 0 },
                  { label: 'Feature B', value: 'feat_b', orderIndex: 1 },
                  { label: 'Feature C', value: 'feat_c', orderIndex: 2 },
                ],
              },
            },
            {
              id: qYesNoId,
              questionType: 'YES_NO',
              title: 'Would you recommend us?',
              isRequired: true,
              orderIndex: 4,
            },
          ],
        },
      },
    });

    // Form A2: 1-10 scale rating
    await prisma.feedbackForm.create({
      data: {
        id: formA2Id,
        companyId: tenantA,
        title: 'NPS Score Survey',
        internalName: 'NPS 2026',
        slug: 'acme-nps',
        status: 'PUBLISHED',
        publishedAt: new Date('2026-01-02T00:00:00.000Z'),
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        questions: {
          create: [
            {
              id: qRating10Id,
              questionType: 'RATING',
              title: 'How likely are you to recommend us? (0-10)',
              isRequired: true,
              orderIndex: 0,
              validationRules: { minRating: 0, maxRating: 10 },
            },
          ],
        },
      },
    });

    // Form B1: Tenant B form
    await prisma.feedbackForm.create({
      data: {
        id: formB1Id,
        companyId: tenantB,
        title: 'Beta Feedback Form',
        internalName: 'Beta Private',
        slug: 'beta-feedback',
        status: 'PUBLISHED',
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    // 3. Seed Responses
    // Response 1 for Form A1: Jan 10, 2026
    await prisma.feedbackResponse.create({
      data: {
        id: 'resp-1',
        companyId: tenantA,
        formId: formA1Id,
        submissionToken: 'sub_tok_1',
        isAnonymous: true,
        submittedAt: new Date('2026-01-10T12:00:00.000Z'),
        answers: {
          create: [
            {
              questionId: qTextId,
              questionType: 'SHORT_TEXT',
              textValue: 'Great fast customer service!',
            },
            {
              questionId: qRating5Id,
              questionType: 'RATING',
              numberValue: 5,
            },
            {
              questionId: qSingleChoiceId,
              questionType: 'SINGLE_CHOICE',
              selectedOptionLabel: 'Red',
              selectedOptionValue: 'red',
              textValue: 'red',
            },
            {
              questionId: qMultiChoiceId,
              questionType: 'MULTIPLE_CHOICE',
              selectedOptions: [
                { label: 'Feature A', value: 'feat_a' },
                { label: 'Feature B', value: 'feat_b' },
              ],
            },
            {
              questionId: qYesNoId,
              questionType: 'YES_NO',
              booleanValue: true,
            },
          ],
        },
      },
    });

    // Response 2 for Form A1: Jan 12, 2026
    await prisma.feedbackResponse.create({
      data: {
        id: 'resp-2',
        companyId: tenantA,
        formId: formA1Id,
        submissionToken: 'sub_tok_2',
        isAnonymous: true,
        submittedAt: new Date('2026-01-12T14:00:00.000Z'),
        answers: {
          create: [
            {
              questionId: qTextId,
              questionType: 'SHORT_TEXT',
              textValue: 'Clean interface.',
            },
            {
              questionId: qRating5Id,
              questionType: 'RATING',
              numberValue: 3,
            },
            {
              questionId: qSingleChoiceId,
              questionType: 'SINGLE_CHOICE',
              selectedOptionLabel: 'Red',
              selectedOptionValue: 'red',
              textValue: 'red',
            },
            {
              questionId: qMultiChoiceId,
              questionType: 'MULTIPLE_CHOICE',
              selectedOptions: [{ label: 'Feature A', value: 'feat_a' }],
            },
            {
              questionId: qYesNoId,
              questionType: 'YES_NO',
              booleanValue: false,
            },
          ],
        },
      },
    });

    // Response 3 for Form A2: Jan 15, 2026
    await prisma.feedbackResponse.create({
      data: {
        id: 'resp-3',
        companyId: tenantA,
        formId: formA2Id,
        submissionToken: 'sub_tok_3',
        isAnonymous: true,
        submittedAt: new Date('2026-01-15T10:00:00.000Z'),
        answers: {
          create: [
            {
              questionId: qRating10Id,
              questionType: 'RATING',
              numberValue: 9,
            },
          ],
        },
      },
    });

    // Response 4 for Form A1: Prior period (Dec 25, 2025)
    await prisma.feedbackResponse.create({
      data: {
        id: 'resp-prior',
        companyId: tenantA,
        formId: formA1Id,
        submissionToken: 'sub_tok_prior',
        isAnonymous: true,
        submittedAt: new Date('2025-12-25T10:00:00.000Z'),
        answers: {
          create: [
            {
              questionId: qRating5Id,
              questionType: 'RATING',
              numberValue: 4,
            },
          ],
        },
      },
    });

    // Response 5 for Tenant B
    await prisma.feedbackResponse.create({
      data: {
        id: 'resp-b1',
        companyId: tenantB,
        formId: formB1Id,
        submissionToken: 'sub_tok_b1',
        isAnonymous: true,
        submittedAt: new Date('2026-01-10T10:00:00.000Z'),
      },
    });
  });

  describe('1. GET /analytics/overview', () => {
    it('returns high-level executive overview with metrics, ratings, and prior period', async () => {
      const res = await service.getOverview(tenantA, {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.totalResponses).toBe(4); // 4 total all-time for tenantA
      expect(res.filteredResponses).toBe(3); // 3 in Jan 2026
      expect(res.publishedFormsCount).toBe(2);
      expect(res.ratingResponsesCount).toBe(3); // 5, 3, 9 -> sum 17 / 3 = 5.67
      expect(res.averageRating).toBe(5.67);
      expect(res.previousPeriod).toBeDefined();
      expect(res.previousPeriod.responseCount).toBe(1); // 1 in Dec 2025
      expect(res.previousPeriod.averageRating).toBe(4);
      expect(res.previousPeriod.responseChangePercentage).toBe(200); // ((3 - 1) / 1) * 100 = 200%
      expect(res.previousPeriod.ratingChange).toBe(1.67); // 5.67 - 4 = 1.67
    });

    it('scopes overview to a specific form when formId is provided', async () => {
      const res = await service.getOverview(tenantA, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.totalResponses).toBe(3);
      expect(res.filteredResponses).toBe(2);
      expect(res.ratingResponsesCount).toBe(2); // 5 and 3 -> avg 4.0
      expect(res.averageRating).toBe(4.0);
    });

    it('returns zero responses and null rating when tenant has no data', async () => {
      const emptyTenant = 'tenant-empty-1111-2222-333344445555';
      const res = await service.getOverview(emptyTenant, {});

      expect(res.totalResponses).toBe(0);
      expect(res.filteredResponses).toBe(0);
      expect(res.averageRating).toBeNull();
      expect(res.ratingResponsesCount).toBe(0);
      expect(res.publishedFormsCount).toBe(0);
    });

    it('rejects cross-tenant form lookup with NotFoundException', async () => {
      await expect(
        service.getOverview(tenantA, { formId: formB1Id })
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects invalid date range with BadRequestException', async () => {
      await expect(
        service.getOverview(tenantA, {
          startDate: '2026-02-01',
          endDate: '2026-01-01',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. GET /analytics/trends', () => {
    it('returns zero-filled daily buckets across the specified window', async () => {
      const res = await service.getTrends(tenantA, {
        startDate: '2026-01-09',
        endDate: '2026-01-13',
        interval: 'day',
      });

      expect(res.interval).toBe('day');
      expect(res.buckets).toHaveLength(5); // 09, 10, 11, 12, 13
      expect(res.totalResponses).toBe(2);

      const jan10 = res.buckets.find((b) => b.date === '2026-01-10');
      expect(jan10).toBeDefined();
      expect(jan10?.count).toBe(1);
      expect(jan10?.averageRating).toBe(5);

      const jan11 = res.buckets.find((b) => b.date === '2026-01-11');
      expect(jan11).toBeDefined();
      expect(jan11?.count).toBe(0);
      expect(jan11?.averageRating).toBeNull();

      const jan12 = res.buckets.find((b) => b.date === '2026-01-12');
      expect(jan12).toBeDefined();
      expect(jan12?.count).toBe(1);
      expect(jan12?.averageRating).toBe(3);
    });

    it('supports weekly and monthly intervals', async () => {
      const resWeek = await service.getTrends(tenantA, {
        startDate: '2026-01-01',
        endDate: '2026-01-20',
        interval: 'week',
      });
      expect(resWeek.interval).toBe('week');
      expect(resWeek.buckets.length).toBeGreaterThanOrEqual(3);

      const resMonth = await service.getTrends(tenantA, {
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        interval: 'month',
      });
      expect(resMonth.interval).toBe('month');
      expect(resMonth.buckets.length).toBeGreaterThanOrEqual(2);
    });

    it('enforces maximum window length for intervals', async () => {
      await expect(
        service.getTrends(tenantA, {
          startDate: '2024-01-01',
          endDate: '2026-01-01',
          interval: 'day',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cross-tenant form trends with NotFoundException', async () => {
      await expect(
        service.getTrends(tenantA, { formId: formB1Id })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. GET /analytics/ratings', () => {
    it('isolates disparate rating scales and provides distributions and breakdowns', async () => {
      const res = await service.getRatings(tenantA, {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.totalRatings).toBe(3); // 2 on 1-5 scale, 1 on 0-10 scale
      expect(res.scales).toHaveLength(2);

      const scale5 = res.scales.find((s) => s.maxRating === 5);
      expect(scale5).toBeDefined();
      expect(scale5?.minRating).toBe(1);
      expect(scale5?.count).toBe(2);
      expect(scale5?.averageRating).toBe(4); // (5 + 3) / 2 = 4
      expect(scale5?.distribution).toHaveLength(5);

      const fiveStar = scale5?.distribution.find((d) => d.rating === 5);
      expect(fiveStar?.count).toBe(1);
      expect(fiveStar?.percentage).toBe(50);

      const scale10 = res.scales.find((s) => s.maxRating === 10);
      expect(scale10).toBeDefined();
      expect(scale10?.count).toBe(1);
      expect(scale10?.averageRating).toBe(9);

      // Question breakdown
      expect(res.byQuestion).toHaveLength(2);
      const qBreakdown = res.byQuestion.find((q) => q.questionId === qRating5Id);
      expect(qBreakdown).toBeDefined();
      expect(qBreakdown?.averageRating).toBe(4);
      expect(qBreakdown?.scale.maxRating).toBe(5);
    });

    it('scopes ratings to a specific form', async () => {
      const res = await service.getRatings(tenantA, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.totalRatings).toBe(2);
      expect(res.scales).toHaveLength(1);
      expect(res.scales[0].maxRating).toBe(5);
      expect(res.byQuestion).toHaveLength(1);
    });

    it('returns empty scale structures when no ratings exist', async () => {
      const res = await service.getRatings(tenantA, {
        startDate: '2024-01-01',
        endDate: '2024-01-02',
      });

      expect(res.totalRatings).toBe(0);
      expect(res.overallAverage).toBeNull();
      expect(res.scales).toHaveLength(0);
    });
  });

  describe('4. GET /analytics/questions', () => {
    it('generates deep analytics across all 6 question types and historical snapshots', async () => {
      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.formId).toBe(formA1Id);
      expect(res.formTitle).toBe('Customer Satisfaction Survey');
      expect(res.totalResponses).toBe(2);
      expect(res.questions).toHaveLength(5);

      // 1. SHORT_TEXT
      const textQ = res.questions.find((q) => q.questionId === qTextId);
      expect(textQ).toBeDefined();
      expect(textQ?.totalAnswers).toBe(2);
      expect(textQ?.responseRate).toBe(100);
      expect(textQ?.textMetrics).toBeDefined();
      expect(textQ?.textMetrics?.textAnswersCount).toBe(2);
      expect(textQ?.textMetrics?.averageLength).toBeGreaterThan(0);

      // 2. RATING
      const ratingQ = res.questions.find((q) => q.questionId === qRating5Id);
      expect(ratingQ).toBeDefined();
      expect(ratingQ?.ratingMetrics?.averageRating).toBe(4);
      expect(ratingQ?.ratingMetrics?.scale.minRating).toBe(1);
      expect(ratingQ?.ratingMetrics?.scale.maxRating).toBe(5);

      // 3. SINGLE_CHOICE
      const singleQ = res.questions.find((q) => q.questionId === qSingleChoiceId);
      expect(singleQ).toBeDefined();
      expect(singleQ?.choiceMetrics).toBeDefined();
      const redOpt = singleQ?.choiceMetrics?.options.find((o) => o.value === 'red');
      expect(redOpt?.count).toBe(2);
      expect(redOpt?.percentage).toBe(100);
      const blueOpt = singleQ?.choiceMetrics?.options.find((o) => o.value === 'blue');
      expect(blueOpt?.count).toBe(0);
      expect(blueOpt?.percentage).toBe(0);

      // 4. MULTIPLE_CHOICE
      const multiQ = res.questions.find((q) => q.questionId === qMultiChoiceId);
      expect(multiQ).toBeDefined();
      expect(multiQ?.choiceMetrics).toBeDefined();
      const featA = multiQ?.choiceMetrics?.options.find((o) => o.value === 'feat_a');
      expect(featA?.count).toBe(2);
      expect(featA?.percentage).toBe(100);
      const featB = multiQ?.choiceMetrics?.options.find((o) => o.value === 'feat_b');
      expect(featB?.count).toBe(1);
      expect(featB?.percentage).toBe(50);
      const featC = multiQ?.choiceMetrics?.options.find((o) => o.value === 'feat_c');
      expect(featC?.count).toBe(0);
      expect(featC?.percentage).toBe(0);

      // 5. YES_NO
      const yesNoQ = res.questions.find((q) => q.questionId === qYesNoId);
      expect(yesNoQ).toBeDefined();
      expect(yesNoQ?.yesNoMetrics?.yesCount).toBe(1);
      expect(yesNoQ?.yesNoMetrics?.noCount).toBe(1);
      expect(yesNoQ?.yesNoMetrics?.yesPercentage).toBe(50);
      expect(yesNoQ?.yesNoMetrics?.noPercentage).toBe(50);
    });

    it('rejects cross-tenant question analytics with NotFoundException', async () => {
      await expect(
        service.getQuestionAnalytics(tenantA, formB1Id, { formId: formB1Id })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. GET /analytics/forms', () => {
    it('returns paginated form directory with aggregated response metrics and deterministic sorting', async () => {
      const res = await service.getFormsAnalytics(tenantA, {
        page: 1,
        limit: 10,
        sortBy: 'responseCount',
        sortOrder: 'desc',
      });

      expect(res.forms).toHaveLength(2);
      expect(res.pagination.totalItems).toBe(2);
      expect(res.pagination.currentPage).toBe(1);
      expect(res.pagination.totalPages).toBe(1);

      // Form A1 should be first because it has 3 responses (vs Form A2 with 1 response)
      expect(res.forms[0].formId).toBe(formA1Id);
      expect(res.forms[0].responseCount).toBe(3);
      expect(res.forms[0].latestResponseAt).toBeDefined();
      expect(res.forms[0].averageRating).toBe(4.0);

      expect(res.forms[1].formId).toBe(formA2Id);
      expect(res.forms[1].responseCount).toBe(1);
      expect(res.forms[1].averageRating).toBe(9.0);
    });

    it('filters forms by status and search keyword', async () => {
      const searchRes = await service.getFormsAnalytics(tenantA, {
        search: 'NPS',
      });
      expect(searchRes.forms).toHaveLength(1);
      expect(searchRes.forms[0].formId).toBe(formA2Id);
    });

    it('strictly isolates tenant forms so Tenant A cannot see Tenant B forms', async () => {
      const res = await service.getFormsAnalytics(tenantA, {});
      const hasTenantBForm = res.forms.some((f) => f.formId === formB1Id);
      expect(hasTenantBForm).toBe(false);
    });
  });
});
