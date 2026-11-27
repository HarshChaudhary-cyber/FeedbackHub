import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const tenantA = 'c0000001-1111-2222-3333-444455556666';
  const tenantB = 'c0000002-1111-2222-3333-444455556666';

  const formA1Id = 'a0000001-1111-2222-3333-444455556666';
  const formA2Id = 'a0000002-1111-2222-3333-444455556666';
  const formMixedScaleId = 'a0000003-1111-2222-3333-444455556666';
  const formB1Id = 'b0000001-1111-2222-3333-444455556666';

  const qTextId = 'e0000001-1111-2222-3333-444455556666';
  const qRating5Id = 'e0000002-1111-2222-3333-444455556666';
  const qSingleChoiceId = 'e0000003-1111-2222-3333-444455556666';
  const qMultiChoiceId = 'e0000004-1111-2222-3333-444455556666';
  const qYesNoId = 'e0000005-1111-2222-3333-444455556666';
  const qRating10Id = 'e0000006-1111-2222-3333-444455556666';
  const qMixed5Id = 'e0000007-1111-2222-3333-444455556666';
  const qMixed10Id = 'e0000008-1111-2222-3333-444455556666';

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
    // Form A1: Standard CSAT (Scale 1-5 rating, text, choice, yes/no)
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

    // Form A2: 0-10 scale rating
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

    // Form A3: Form containing multiple incompatible scales on the same form
    await prisma.feedbackForm.create({
      data: {
        id: formMixedScaleId,
        companyId: tenantA,
        title: 'Mixed Scales Evaluation',
        internalName: 'Mixed Form',
        slug: 'acme-mixed',
        status: 'DRAFT',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
        questions: {
          create: [
            {
              id: qMixed5Id,
              questionType: 'RATING',
              title: 'Rating 1-5',
              orderIndex: 0,
              validationRules: { minRating: 1, maxRating: 5 },
            },
            {
              id: qMixed10Id,
              questionType: 'RATING',
              title: 'Rating 0-10',
              orderIndex: 1,
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
              questionTitle: 'What did you like the most?',
              questionType: 'SHORT_TEXT',
              textValue: 'Great customer service!',
            },
            {
              questionId: qRating5Id,
              questionTitle: 'Legacy Question Title V1',
              questionType: 'RATING',
              numberValue: 5,
            },
            {
              questionId: qSingleChoiceId,
              questionType: 'SINGLE_CHOICE',
              selectedOptionLabel: 'Legacy Red Label',
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

    // Response 2 for Form A1: Jan 12, 2026 (includes a historical removed option and duplicate answer row)
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
              questionTitle: 'What did you like the most?',
              questionType: 'SHORT_TEXT',
              textValue: 'Clean interface.',
            },
            {
              questionId: qRating5Id,
              questionTitle: 'Overall satisfaction',
              questionType: 'RATING',
              numberValue: 3,
            },
            {
              questionId: qSingleChoiceId,
              questionType: 'SINGLE_CHOICE',
              selectedOptionLabel: 'Historical Sunset Red',
              selectedOptionValue: 'red',
              textValue: 'red',
            },
            {
              questionId: qMultiChoiceId,
              questionType: 'MULTIPLE_CHOICE',
              selectedOptions: [
                { label: 'Feature A', value: 'feat_a' },
                { label: 'Removed Feature X', value: 'feat_x' },
              ],
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

    // Response 3 for Form A2: Jan 15, 2026 (0-10 scale)
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

    // Response 4: Prior period response for Form A1 (Dec 25, 2025)
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

  describe('1. Tenant RLS Transaction Context Enforcement', () => {
    it('executes getOverview inside withTenantContext with the validated companyId', async () => {
      const orig = prisma.withTenantContext.bind(prisma);
      const spy = vi.spyOn(prisma, 'withTenantContext').mockImplementation((...args) => orig(...args));
      const res = await service.getOverview(tenantA, {});
      expect(spy).toHaveBeenCalledWith(tenantA, undefined, expect.any(Function));
      expect(res.totalResponses).toBe(4);
    });

    it('executes getTrends inside withTenantContext with the validated companyId', async () => {
      const orig = prisma.withTenantContext.bind(prisma);
      const spy = vi.spyOn(prisma, 'withTenantContext').mockImplementation((...args) => orig(...args));
      await service.getTrends(tenantA, {});
      expect(spy).toHaveBeenCalledWith(tenantA, undefined, expect.any(Function));
    });

    it('executes getRatings inside withTenantContext with the validated companyId', async () => {
      const orig = prisma.withTenantContext.bind(prisma);
      const spy = vi.spyOn(prisma, 'withTenantContext').mockImplementation((...args) => orig(...args));
      await service.getRatings(tenantA, {});
      expect(spy).toHaveBeenCalledWith(tenantA, undefined, expect.any(Function));
    });

    it('executes getQuestionAnalytics inside withTenantContext with the validated companyId', async () => {
      const orig = prisma.withTenantContext.bind(prisma);
      const spy = vi.spyOn(prisma, 'withTenantContext').mockImplementation((...args) => orig(...args));
      await service.getQuestionAnalytics(tenantA, formA1Id, { formId: formA1Id });
      expect(spy).toHaveBeenCalledWith(tenantA, undefined, expect.any(Function));
    });

    it('executes getFormsAnalytics inside withTenantContext with the validated companyId', async () => {
      const orig = prisma.withTenantContext.bind(prisma);
      const spy = vi.spyOn(prisma, 'withTenantContext').mockImplementation((...args) => orig(...args));
      await service.getFormsAnalytics(tenantA, {});
      expect(spy).toHaveBeenCalledWith(tenantA, undefined, expect.any(Function));
    });
  });

  describe('2. Rating Scale Correctness & Isolation', () => {
    it('does NOT combine incompatible scales (1-5 and 0-10) in overview; returns null averageRating and scale breakdowns', async () => {
      const res = await service.getOverview(tenantA, {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.filteredResponses).toBe(3);
      // Form A1 has 1-5 ratings (scores 5 and 3) and Form A2 has 0-10 rating (score 9)
      // Incompatible scales must NEVER be averaged into 5.67!
      expect(res.averageRating).toBeNull();
      expect(res.ratingScale).toBeNull();
      expect(res.ratingScales).toBeDefined();
      expect(res.ratingScales).toHaveLength(2);

      const scale5 = res.ratingScales?.find((s) => s.maxRating === 5);
      expect(scale5?.averageRating).toBe(4.0);
      expect(scale5?.count).toBe(2);

      const scale10 = res.ratingScales?.find((s) => s.maxRating === 10);
      expect(scale10?.averageRating).toBe(9.0);
      expect(scale10?.count).toBe(1);

      expect(res.ratingResponsesCount).toBe(3);
    });

    it('returns an unambiguous averageRating and ratingScale when exactly one rating scale is present', async () => {
      const res = await service.getOverview(tenantA, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.averageRating).toBe(4.0);
      expect(res.ratingScale).toEqual({ minRating: 1, maxRating: 5 });
      expect(res.ratingResponsesCount).toBe(2);
    });

    it('returns null overallAverage and empty distribution in ratings endpoint when multiple scales exist', async () => {
      const res = await service.getRatings(tenantA, {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(res.totalRatings).toBe(3);
      expect(res.overallAverage).toBeNull();
      expect(res.distribution).toEqual([]);
      expect(res.scales).toHaveLength(2);
    });

    it('returns null averageRating on forms containing multiple rating questions on different scales', async () => {
      // Seed a response to the mixed-scale form
      await prisma.feedbackResponse.create({
        data: {
          id: 'resp-mixed',
          companyId: tenantA,
          formId: formMixedScaleId,
          submissionToken: 'sub_tok_mixed',
          isAnonymous: true,
          submittedAt: new Date('2026-01-10T12:00:00.000Z'),
          answers: {
            create: [
              {
                questionId: qMixed5Id,
                questionType: 'RATING',
                numberValue: 4,
              },
              {
                questionId: qMixed10Id,
                questionType: 'RATING',
                numberValue: 8,
              },
            ],
          },
        },
      });

      const res = await service.getFormsAnalytics(tenantA, {
        search: 'Mixed',
      });

      expect(res.forms).toHaveLength(1);
      expect(res.forms[0].formId).toBe(formMixedScaleId);
      // Because this form has ratings on both 1-5 and 0-10 scales, averageRating must be null!
      expect(res.forms[0].averageRating).toBeNull();
      expect(res.forms[0].ratingScale).toBeNull();
    });

    it('discards invalid, non-finite, and out-of-range rating numbers without rounding them into buckets', async () => {
      await prisma.feedbackResponse.create({
        data: {
          id: 'resp-invalid',
          companyId: tenantA,
          formId: formA1Id,
          submissionToken: 'sub_tok_invalid',
          isAnonymous: true,
          submittedAt: new Date('2026-01-11T12:00:00.000Z'),
          answers: {
            create: [
              {
                questionId: qRating5Id,
                questionType: 'RATING',
                numberValue: 99, // Outside 1-5 scale
              },
              {
                questionId: qRating5Id,
                questionType: 'RATING',
                numberValue: -2, // Below minRating
              },
              {
                questionId: qRating5Id,
                questionType: 'RATING',
                numberValue: NaN, // Not finite
              },
            ],
          },
        },
      });

      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-11',
        endDate: '2026-01-11',
      });

      const ratingQ = res.questions.find((q) => q.questionId === qRating5Id);
      expect(ratingQ?.ratingMetrics?.averageRating).toBe(0);
      expect(ratingQ?.totalAnswers).toBe(0); // Invalid answers do not count as valid answered respondents
    });
  });

  describe('3. Historical Question and Option Snapshots', () => {
    it('preserves historical question titles when title was changed', async () => {
      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      const ratingQ = res.questions.find((q) => q.questionId === qRating5Id);
      expect(ratingQ).toBeDefined();
      expect(ratingQ?.questionTitle).toBe('Overall satisfaction');
      // Response 1 recorded historical question title 'Legacy Question Title V1'
      expect(ratingQ?.historicalTitles).toContain('Legacy Question Title V1');
    });

    it('preserves historical option labels and tracks historicalLabels for renamed options', async () => {
      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      const singleQ = res.questions.find((q) => q.questionId === qSingleChoiceId);
      expect(singleQ).toBeDefined();
      const redOpt = singleQ?.choiceMetrics?.options.find((o) => o.value === 'red');
      expect(redOpt).toBeDefined();
      expect(redOpt?.count).toBe(2);
      expect(redOpt?.historicalLabels).toContain('Legacy Red Label');
      expect(redOpt?.historicalLabels).toContain('Historical Sunset Red');
    });

    it('preserves and exposes historical options that were removed from question definition', async () => {
      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      const multiQ = res.questions.find((q) => q.questionId === qMultiChoiceId);
      expect(multiQ).toBeDefined();
      // 'feat_x' was selected in Response 2 but is not in Form A1's current question definition
      const removedOpt = multiQ?.choiceMetrics?.options.find((o) => o.value === 'feat_x');
      expect(removedOpt).toBeDefined();
      expect(removedOpt?.label).toBe('Removed Feature X');
      expect(removedOpt?.count).toBe(1);
    });
  });

  describe('4. Respondent-Based Question Percentages', () => {
    it('uses distinct answered respondents as denominator; allows multiple-choice percentages to sum > 100%', async () => {
      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      const multiQ = res.questions.find((q) => q.questionId === qMultiChoiceId);
      expect(multiQ).toBeDefined();
      expect(multiQ?.totalAnswers).toBe(2); // 2 distinct respondents answered this question

      const featA = multiQ?.choiceMetrics?.options.find((o) => o.value === 'feat_a');
      expect(featA?.count).toBe(2);
      expect(featA?.percentage).toBe(100); // 2 / 2 respondents = 100%

      const featB = multiQ?.choiceMetrics?.options.find((o) => o.value === 'feat_b');
      expect(featB?.count).toBe(1);
      expect(featB?.percentage).toBe(50); // 1 / 2 respondents = 50%

      const featX = multiQ?.choiceMetrics?.options.find((o) => o.value === 'feat_x');
      expect(featX?.count).toBe(1);
      expect(featX?.percentage).toBe(50); // 1 / 2 respondents = 50%

      // Total sum of percentages is 100 + 50 + 50 = 200%
      const totalPct = (featA?.percentage || 0) + (featB?.percentage || 0) + (featX?.percentage || 0);
      expect(totalPct).toBeGreaterThan(100);
    });

    it('does not let duplicate answer rows for the same response inflate counts', async () => {
      // Seed response with duplicate answer rows for the same question
      await prisma.feedbackResponse.create({
        data: {
          id: 'resp-dup',
          companyId: tenantA,
          formId: formA1Id,
          submissionToken: 'sub_tok_dup',
          isAnonymous: true,
          submittedAt: new Date('2026-01-14T10:00:00.000Z'),
          answers: {
            create: [
              {
                questionId: qSingleChoiceId,
                selectedOptionValue: 'blue',
                textValue: 'blue',
              },
              {
                questionId: qSingleChoiceId, // Duplicate answer row
                selectedOptionValue: 'blue',
                textValue: 'blue',
              },
            ],
          },
        },
      });

      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-14',
        endDate: '2026-01-14',
      });

      const singleQ = res.questions.find((q) => q.questionId === qSingleChoiceId);
      expect(singleQ?.totalAnswers).toBe(1); // Exactly 1 distinct respondent
      const blueOpt = singleQ?.choiceMetrics?.options.find((o) => o.value === 'blue');
      expect(blueOpt?.count).toBe(1); // Counted once, not twice
    });

    it('calculates yes/no percentages using valid yes/no respondents', async () => {
      const res = await service.getQuestionAnalytics(tenantA, formA1Id, {
        formId: formA1Id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      const yesNoQ = res.questions.find((q) => q.questionId === qYesNoId);
      expect(yesNoQ?.yesNoMetrics?.yesCount).toBe(1);
      expect(yesNoQ?.yesNoMetrics?.noCount).toBe(1);
      expect(yesNoQ?.yesNoMetrics?.yesPercentage).toBe(50);
      expect(yesNoQ?.yesNoMetrics?.noPercentage).toBe(50);
    });
  });

  describe('5. Strict Calendar Date Validation and Window Semantics', () => {
    it('accepts valid calendar dates and leap days', async () => {
      const res = await service.getOverview(tenantA, {
        startDate: '2024-02-29',
        endDate: '2024-03-01',
      });
      expect(res).toBeDefined();
    });

    it('rejects invalid leap year dates like 2023-02-29', async () => {
      await expect(
        service.getOverview(tenantA, { startDate: '2023-02-29' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects impossible calendar dates like 2026-04-31 and 2026-13-01', async () => {
      await expect(
        service.getOverview(tenantA, { startDate: '2026-04-31' })
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getOverview(tenantA, { startDate: '2026-13-01' })
      ).rejects.toThrow(BadRequestException);
    });

    it('preserves inclusive end-date behavior for YYYY-MM-DD format up to 23:59:59.999Z', async () => {
      // Seed response late on Jan 12 (23:30 UTC)
      await prisma.feedbackResponse.create({
        data: {
          id: 'resp-late',
          companyId: tenantA,
          formId: formA1Id,
          submissionToken: 'sub_tok_late',
          isAnonymous: true,
          submittedAt: new Date('2026-01-12T23:30:00.000Z'),
        },
      });

      const res = await service.getOverview(tenantA, {
        startDate: '2026-01-12',
        endDate: '2026-01-12',
      });

      expect(res.filteredResponses).toBe(2); // 14:00 UTC and 23:30 UTC are both included
    });

    it('computes previous period with the exact same effective duration', async () => {
      const res = await service.getOverview(tenantA, {
        startDate: '2026-01-10T00:00:00.000Z',
        endDate: '2026-01-20T00:00:00.000Z',
      });

      const currentDuration =
        new Date('2026-01-20T00:00:00.000Z').getTime() -
        new Date('2026-01-10T00:00:00.000Z').getTime();

      const prevStart = new Date(res.previousPeriod.startDate).getTime();
      const prevEnd = new Date(res.previousPeriod.endDate).getTime();
      const prevDuration = prevEnd - prevStart;

      expect(prevDuration).toBe(currentDuration);
    });
  });

  describe('6. Monthly Trend Bucket Generation & Regressions', () => {
    it('does not skip February when range starts on January 31', async () => {
      const res = await service.getTrends(tenantA, {
        startDate: '2026-01-31',
        endDate: '2026-03-15',
        interval: 'month',
      });

      expect(res.interval).toBe('month');
      const bucketDates = res.buckets.map((b) => b.date);
      expect(bucketDates).toContain('2026-01-01');
      expect(bucketDates).toContain('2026-02-01'); // Must NOT be skipped due to Jan 31 rollover
      expect(bucketDates).toContain('2026-03-01');
    });

    it('correctly handles monthly trend ranges starting on March 30 and crossing year boundaries', async () => {
      const res = await service.getTrends(tenantA, {
        startDate: '2025-11-30',
        endDate: '2026-02-15',
        interval: 'month',
      });

      const bucketDates = res.buckets.map((b) => b.date);
      expect(bucketDates).toEqual(['2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01']);
    });
  });

  describe('7. Forms Analytics Database Pagination & Multi-tenancy', () => {
    it('paginates forms with deterministic ordering and secondary tie-breaker', async () => {
      const resPage1 = await service.getFormsAnalytics(tenantA, {
        page: 1,
        limit: 2,
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(resPage1.forms).toHaveLength(2);
      expect(resPage1.pagination.totalItems).toBe(3);
      expect(resPage1.pagination.totalPages).toBe(2);

      const resPage2 = await service.getFormsAnalytics(tenantA, {
        page: 2,
        limit: 2,
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(resPage2.forms).toHaveLength(1);
      // Verify no overlap between page 1 and page 2
      const page1Ids = resPage1.forms.map((f) => f.formId);
      expect(page1Ids).not.toContain(resPage2.forms[0].formId);
    });

    it('strictly isolates tenant forms so Tenant A cannot see Tenant B forms', async () => {
      const res = await service.getFormsAnalytics(tenantA, {});
      const hasTenantBForm = res.forms.some((f) => f.formId === formB1Id);
      expect(hasTenantBForm).toBe(false);
    });
  });
});
