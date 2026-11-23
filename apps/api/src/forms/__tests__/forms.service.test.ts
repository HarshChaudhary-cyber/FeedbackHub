/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { FormsService } from '../forms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RateLimiterService } from '../../auth/rate-limiter.service';

describe('FormsService', () => {
  let service: FormsService;
  let prisma: PrismaService;
  let rateLimiter: RateLimiterService;

  const tenantA = 'tenant-aaa-1111-2222-333344445555';
  const tenantB = 'tenant-bbb-1111-2222-333344445555';
  const userA = 'user-aaa-1111-2222-333344445555';

  beforeEach(async () => {
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    rateLimiter = new RateLimiterService();
    service = new FormsService(prisma, rateLimiter);

    // Seed test companies
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
  });

  describe('Form Creation & Listing', () => {
    it('creates a new feedback form in DRAFT status', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Customer Satisfaction Survey',
        internalName: 'CSAT Q4',
        description: 'Tell us how your experience was.',
        welcomeMessage: 'Welcome to our feedback portal.',
        thankYouMessage: 'Thank you for your valuable feedback!',
        questions: [
          {
            questionType: 'SHORT_TEXT',
            title: 'What is your primary feedback?',
            placeholder: 'Type your feedback here...',
            isRequired: true,
            orderIndex: 0,
          },
          {
            questionType: 'RATING',
            title: 'How satisfied are you with our product?',
            isRequired: true,
            orderIndex: 1,
            validationRules: { minRating: 1, maxRating: 5 },
          },
        ],
      });

      expect(form.id).toBeDefined();
      expect(form.companyId).toBe(tenantA);
      expect(form.title).toBe('Customer Satisfaction Survey');
      expect(form.status).toBe('DRAFT');
      expect(form.slug).toBeDefined();
      expect(form.questions).toHaveLength(2);
      expect(form.questions![0].title).toBe('What is your primary feedback?');
      expect(form.questions![1].questionType).toBe('RATING');
    });

    it('rejects form creation with invalid title', async () => {
      await expect(
        service.createForm(tenantA, userA, {
          title: '', // empty title
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate slug within forms', async () => {
      await service.createForm(tenantA, userA, {
        title: 'Survey One',
        slug: 'custom-slug',
      });

      await expect(
        service.createForm(tenantA, userA, {
          title: 'Survey Two',
          slug: 'custom-slug',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('lists forms for tenant with search and status filter', async () => {
      await service.createForm(tenantA, userA, {
        title: 'Customer NPS',
        internalName: 'NPS 2026',
      });
      const published = await service.createForm(tenantA, userA, {
        title: 'Product Beta Survey',
        internalName: 'Beta v1',
        questions: [
          { questionType: 'SHORT_TEXT', title: 'Any thoughts?', isRequired: false },
        ],
      });
      await service.publishForm(tenantA, published.id);

      // List all
      const allForms = await service.listForms(tenantA);
      expect(allForms).toHaveLength(2);

      // Filter by status PUBLISHED
      const publishedForms = await service.listForms(tenantA, { status: 'PUBLISHED' });
      expect(publishedForms).toHaveLength(1);
      expect(publishedForms[0].title).toBe('Product Beta Survey');

      // Search query
      const searchResults = await service.listForms(tenantA, { search: 'NPS' });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('Customer NPS');
    });
  });

  describe('Form Lifecycle: Edit, Duplicate, Publish, Unpublish, Archive, Delete', () => {
    it('updates form metadata and synchronizes questions', async () => {
      const created = await service.createForm(tenantA, userA, {
        title: 'Initial Title',
        questions: [
          { questionType: 'SHORT_TEXT', title: 'Question 1', isRequired: true },
        ],
      });

      const updated = await service.updateForm(tenantA, created.id, {
        title: 'Updated Title',
        description: 'New Description',
        questions: [
          {
            questionType: 'SINGLE_CHOICE',
            title: 'Which tier are you on?',
            isRequired: true,
            options: [
              { label: 'Free', value: 'free' },
              { label: 'Pro', value: 'pro' },
            ],
          },
        ],
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New Description');
      expect(updated.questions).toHaveLength(1);
      expect(updated.questions![0].questionType).toBe('SINGLE_CHOICE');
      expect(updated.questions![0].options).toHaveLength(2);
    });

    it('duplicates a form with all its questions and options in DRAFT mode', async () => {
      const original = await service.createForm(tenantA, userA, {
        title: 'Quarterly Employee Survey',
        questions: [
          {
            questionType: 'YES_NO',
            title: 'Are you satisfied with team communication?',
            isRequired: true,
          },
        ],
      });

      const duplicate = await service.duplicateForm(tenantA, original.id);

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.title).toContain('(Copy)');
      expect(duplicate.status).toBe('DRAFT');
      expect(duplicate.questions).toHaveLength(1);
      expect(duplicate.questions![0].id).not.toBe(original.questions![0].id);
      expect(duplicate.questions![0].title).toBe(original.questions![0].title);
    });

    it('rejects publishing a form with 0 questions', async () => {
      const emptyForm = await service.createForm(tenantA, userA, {
        title: 'Empty Form',
        questions: [],
      });

      await expect(service.publishForm(tenantA, emptyForm.id)).rejects.toThrow(
        BadRequestException
      );
    });

    it('publishes and unpublishes a form', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Ready Form',
        questions: [
          { questionType: 'RATING', title: 'Rate our service', isRequired: true },
        ],
      });

      const published = await service.publishForm(tenantA, form.id);
      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedAt).toBeDefined();

      const unpublished = await service.unpublishForm(tenantA, form.id);
      expect(unpublished.status).toBe('DRAFT');
    });

    it('archives and deletes a form', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'To Archive',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Feedback', isRequired: false }],
      });

      const archived = await service.archiveForm(tenantA, form.id);
      expect(archived.status).toBe('ARCHIVED');
      expect(archived.closedAt).toBeDefined();

      const deleteResult = await service.deleteForm(tenantA, form.id);
      expect(deleteResult.success).toBe(true);

      await expect(service.getForm(tenantA, form.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Tenant Isolation (Cross-Tenant Security)', () => {
    it('prevents Tenant B from viewing Tenant A forms', async () => {
      const formA = await service.createForm(tenantA, userA, {
        title: 'Confidential Tenant A Survey',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Secret Question' }],
      });

      await expect(service.getForm(tenantB, formA.id)).rejects.toThrow(NotFoundException);
    });

    it('prevents Tenant B from modifying Tenant A forms', async () => {
      const formA = await service.createForm(tenantA, userA, {
        title: 'Tenant A Survey',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Question' }],
      });

      await expect(
        service.updateForm(tenantB, formA.id, {
          title: 'Hacked by Tenant B',
        })
      ).rejects.toThrow(NotFoundException);

      const unchanged = await service.getForm(tenantA, formA.id);
      expect(unchanged.title).toBe('Tenant A Survey');
    });

    it('prevents Tenant B from publishing, archiving, or deleting Tenant A forms', async () => {
      const formA = await service.createForm(tenantA, userA, {
        title: 'Tenant A Survey',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Question' }],
      });

      await expect(service.publishForm(tenantB, formA.id)).rejects.toThrow(NotFoundException);
      await expect(service.archiveForm(tenantB, formA.id)).rejects.toThrow(NotFoundException);
      await expect(service.deleteForm(tenantB, formA.id)).rejects.toThrow(NotFoundException);
    });

    it('strictly isolates form listing between tenants', async () => {
      await service.createForm(tenantA, userA, { title: 'Tenant A Form 1' });
      await service.createForm(tenantA, userA, { title: 'Tenant A Form 2' });
      await service.createForm(tenantB, userA, { title: 'Tenant B Form 1' });

      const formsA = await service.listForms(tenantA);
      expect(formsA).toHaveLength(2);
      expect(formsA.every((f) => f.companyId === tenantA)).toBe(true);

      const formsB = await service.listForms(tenantB);
      expect(formsB).toHaveLength(1);
      expect(formsB[0].companyId).toBe(tenantB);
    });
  });

  describe('Public Respondent Form Retrieval & Feedback Submission', () => {
    it('retrieves published form by slug without sensitive tenant metadata', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Public Community Feedback',
        welcomeMessage: 'Welcome to Acme feedback!',
        questions: [
          {
            questionType: 'SHORT_TEXT',
            title: 'Your name or handle',
            isRequired: false,
          },
        ],
      });
      await service.publishForm(tenantA, form.id);

      const publicForm = await service.getPublicFormBySlug(form.slug);

      expect(publicForm.title).toBe('Public Community Feedback');
      expect(publicForm.companyName).toBe('Acme Corp');
      expect(publicForm.welcomeMessage).toBe('Welcome to Acme feedback!');
      expect(publicForm.questions).toHaveLength(1);
      // Ensure internal company ID and createdBy are NOT exposed
      expect((publicForm as any).companyId).toBeUndefined();
      expect((publicForm as any).createdByUserId).toBeUndefined();
    });

    it('rejects public retrieval if form is DRAFT or ARCHIVED', async () => {
      const draft = await service.createForm(tenantA, userA, {
        title: 'Draft Form',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q' }],
      });
      await expect(service.getPublicFormBySlug(draft.slug)).rejects.toThrow(NotFoundException);

      await service.publishForm(tenantA, draft.id);
      await service.archiveForm(tenantA, draft.id);
      await expect(service.getPublicFormBySlug(draft.slug)).rejects.toThrow(NotFoundException);
    });

    it('submits response to published form and persists answers', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Feedback Survey',
        thankYouMessage: 'Thanks for participating!',
        questions: [
          {
            questionType: 'SHORT_TEXT',
            title: 'What feature do you want?',
            isRequired: true,
          },
          {
            questionType: 'RATING',
            title: 'Rate your happiness',
            isRequired: true,
            validationRules: { minRating: 1, maxRating: 5 },
          },
          {
            questionType: 'SINGLE_CHOICE',
            title: 'Primary use case',
            isRequired: true,
            options: [
              { label: 'Work', value: 'work' },
              { label: 'Personal', value: 'personal' },
            ],
          },
        ],
      });
      await service.publishForm(tenantA, form.id);

      const qText = form.questions![0].id;
      const qRating = form.questions![1].id;
      const qChoice = form.questions![2].id;

      const result = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [
            { questionId: qText, textValue: 'Dark mode please!' },
            { questionId: qRating, numberValue: 5 },
            { questionId: qChoice, textValue: 'work' },
          ],
        },
        '192.168.1.100'
      );

      expect(result.success).toBe(true);
      expect(result.submissionToken).toMatch(/^sub_[0-9a-f]{48}$/);
      expect(result.message).toBe('Thanks for participating!');

      // Verify response persisted in company's tenant context
      const updatedForm = await service.getForm(tenantA, form.id);
      expect(updatedForm.responseCount).toBe(1);
    });

    it('rejects submission with missing required question', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Required Field Test',
        questions: [
          { questionType: 'SHORT_TEXT', title: 'Mandatory Question', isRequired: true },
          { questionType: 'SHORT_TEXT', title: 'Optional Question', isRequired: false },
        ],
      });
      await service.publishForm(tenantA, form.id);

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [
              { questionId: form.questions![1].id, textValue: 'Only answered optional' },
            ],
          },
          '192.168.1.101'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects submission with rating out of bounds', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Rating Bounds Test',
        questions: [
          {
            questionType: 'RATING',
            title: 'Rating 1-5',
            isRequired: true,
            validationRules: { minRating: 1, maxRating: 5 },
          },
        ],
      });
      await service.publishForm(tenantA, form.id);

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: form.questions![0].id, numberValue: 10 }], // out of bounds
          },
          '192.168.1.102'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects submission with invalid single choice option', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Choice Test',
        questions: [
          {
            questionType: 'SINGLE_CHOICE',
            title: 'Choose A or B',
            isRequired: true,
            options: [
              { label: 'Option A', value: 'opt_a' },
              { label: 'Option B', value: 'opt_b' },
            ],
          },
        ],
      });
      await service.publishForm(tenantA, form.id);

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: form.questions![0].id, textValue: 'opt_c_invalid' }],
          },
          '192.168.1.103'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects submission if question ID belongs to another form', async () => {
      const form1 = await service.createForm(tenantA, userA, {
        title: 'Form 1',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q1', isRequired: true }],
      });
      const form2 = await service.createForm(tenantA, userA, {
        title: 'Form 2',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q2', isRequired: true }],
      });
      await service.publishForm(tenantA, form1.id);
      await service.publishForm(tenantA, form2.id);

      await expect(
        service.submitPublicFeedback(
          form1.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: form2.questions![0].id, textValue: 'Wrong question' }],
          },
          '192.168.1.104'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects public submission when company is inactive or suspended', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Company Suspended Form',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      // Deactivate company
      await prisma.company.update({
        where: { id: tenantA },
        data: { isActive: false, status: 'SUSPENDED' },
      });

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: form.questions![0].id, textValue: 'Hello' }],
          },
          '192.168.1.105'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Historical Data & Response Preservation (Non-Destructive Question Sync)', () => {
    it('preserves historical feedback answers and question snapshots when questions are updated in-place', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Survey Before Edits',
        questions: [
          {
            questionType: 'SHORT_TEXT',
            title: 'Initial Question Title',
            isRequired: true,
          },
        ],
      });
      await service.publishForm(tenantA, form.id);
      const q1Id = form.questions![0].id;

      // Collect a public response to initial question
      await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [{ questionId: q1Id, textValue: 'Historical response text' }],
        },
        '10.0.0.1'
      );

      // Verify answer exists in database
      const initialAnswers = await prisma.feedbackAnswer.findMany({ where: { questionId: q1Id } });
      expect(initialAnswers).toHaveLength(1);
      expect(initialAnswers[0].textValue).toBe('Historical response text');
      expect(initialAnswers[0].questionTitle).toBe('Initial Question Title');

      // Admin updates question title to "Renamed Question Title"
      await service.updateForm(tenantA, form.id, {
        title: 'Survey After Edits',
        questions: [
          {
            id: q1Id, // Preserving existing question ID
            questionType: 'SHORT_TEXT',
            title: 'Renamed Question Title',
            isRequired: true,
          },
        ],
      });

      // Historical answers MUST still exist and remain associated with question ID and snapshot title
      const preservedAnswers = await prisma.feedbackAnswer.findMany({ where: { questionId: q1Id } });
      expect(preservedAnswers).toHaveLength(1);
      expect(preservedAnswers[0].textValue).toBe('Historical response text');
      expect(preservedAnswers[0].questionTitle).toBe('Initial Question Title');

      // The question itself was updated in-place
      const updatedForm = await service.getForm(tenantA, form.id);
      expect(updatedForm.questions![0].id).toBe(q1Id);
      expect(updatedForm.questions![0].title).toBe('Renamed Question Title');
      expect(updatedForm.questions![0].version).toBe(2);
    });

    it('preserves historical answers when a question is removed from the form (soft-deleted)', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Multi-Question Survey',
        questions: [
          { questionType: 'SHORT_TEXT', title: 'Question To Keep', isRequired: true },
          { questionType: 'RATING', title: 'Question To Remove Later', isRequired: true },
        ],
      });
      await service.publishForm(tenantA, form.id);
      const keepQId = form.questions![0].id;
      const removeQId = form.questions![1].id;

      // Submit feedback answering BOTH questions
      await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [
            { questionId: keepQId, textValue: 'Keep this answer' },
            { questionId: removeQId, numberValue: 4 },
          ],
        },
        '10.0.0.2'
      );

      // Verify answers are stored
      const preAnswersKeep = await prisma.feedbackAnswer.findMany({ where: { questionId: keepQId } });
      const preAnswersRemove = await prisma.feedbackAnswer.findMany({ where: { questionId: removeQId } });
      expect(preAnswersKeep).toHaveLength(1);
      expect(preAnswersRemove).toHaveLength(1);
      expect(preAnswersRemove[0].numberValue).toBe(4);

      // Admin updates the form, omitting the second question
      await service.updateForm(tenantA, form.id, {
        title: 'Multi-Question Survey (Updated)',
        questions: [
          {
            id: keepQId,
            questionType: 'SHORT_TEXT',
            title: 'Question To Keep',
            isRequired: true,
          },
        ],
      });

      // The active questions on the form now only list the remaining question
      const updatedForm = await service.getForm(tenantA, form.id);
      expect(updatedForm.questions).toHaveLength(1);
      expect(updatedForm.questions![0].id).toBe(keepQId);

      // CRITICAL: The removed question's historical answers MUST NOT BE DESTROYED!
      const postAnswersRemove = await prisma.feedbackAnswer.findMany({ where: { questionId: removeQId } });
      expect(postAnswersRemove).toHaveLength(1);
      expect(postAnswersRemove[0].numberValue).toBe(4);
      expect(postAnswersRemove[0].questionTitle).toBe('Question To Remove Later');

      // The removed question record still exists in the database as inactive
      const softDeletedQ = await prisma.formQuestion.findUnique({ where: { id: removeQId } });
      expect(softDeletedQ).toBeDefined();
      expect(softDeletedQ?.isActive).toBe(false);
    });

    it('preserves existing responses and answers when questions are reordered', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Reorder Survey',
        questions: [
          { questionType: 'SHORT_TEXT', title: 'First Q', isRequired: true, orderIndex: 0 },
          { questionType: 'SHORT_TEXT', title: 'Second Q', isRequired: true, orderIndex: 1 },
        ],
      });
      await service.publishForm(tenantA, form.id);
      const qFirst = form.questions![0].id;
      const qSecond = form.questions![1].id;

      await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [
            { questionId: qFirst, textValue: 'Answer to First' },
            { questionId: qSecond, textValue: 'Answer to Second' },
          ],
        },
        '10.0.0.3'
      );

      // Reorder questions
      await service.updateForm(tenantA, form.id, {
        questions: [
          { id: qSecond, questionType: 'SHORT_TEXT', title: 'Second Q', orderIndex: 0 },
          { id: qFirst, questionType: 'SHORT_TEXT', title: 'First Q', orderIndex: 1 },
        ],
      });

      const reorderedForm = await service.getForm(tenantA, form.id);
      expect(reorderedForm.questions![0].id).toBe(qSecond);
      expect(reorderedForm.questions![1].id).toBe(qFirst);

      // Answers remain associated with their original questions
      const ansFirst = await prisma.feedbackAnswer.findMany({ where: { questionId: qFirst } });
      const ansSecond = await prisma.feedbackAnswer.findMany({ where: { questionId: qSecond } });
      expect(ansFirst[0].textValue).toBe('Answer to First');
      expect(ansSecond[0].textValue).toBe('Answer to Second');
    });
  });

  describe('Anonymity Policy Server-Side Enforcement', () => {
    it('ANONYMOUS_ONLY rejects identified submission when client passes isAnonymous: false', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Strict Anonymous Form',
        anonymityMode: 'ANONYMOUS_ONLY',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: false,
            respondentName: 'John Doe',
            respondentEmail: 'john@example.com',
            answers: [{ questionId: form.questions![0].id, textValue: 'Test' }],
          },
          '10.1.1.1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('ANONYMOUS_ONLY rejects submission if personal identity fields are provided', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Strict Anonymous Form 2',
        anonymityMode: 'ANONYMOUS_ONLY',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            respondentEmail: 'leaked@example.com',
            answers: [{ questionId: form.questions![0].id, textValue: 'Test' }],
          },
          '10.1.1.2'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('ANONYMOUS_ONLY persists isAnonymous: true and NULL identity fields', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Strict Anonymous Form 3',
        anonymityMode: 'ANONYMOUS_ONLY',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      const result = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [{ questionId: form.questions![0].id, textValue: 'Completely anonymous' }],
        },
        '10.1.1.3'
      );

      expect(result.success).toBe(true);

      const persisted = await prisma.feedbackResponse.findUnique({
        where: { submissionToken: result.submissionToken },
      });
      expect(persisted).toBeDefined();
      expect(persisted?.isAnonymous).toBe(true);
      expect(persisted?.respondentName).toBeNull();
      expect(persisted?.respondentEmail).toBeNull();
      expect(persisted?.respondentUserId).toBeNull();
      expect(persisted?.ipHash).toBeDefined();
    });

    it('IDENTIFIED_ONLY rejects anonymous submission (isAnonymous: true)', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Mandatory Identified Form',
        anonymityMode: 'IDENTIFIED_ONLY',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: form.questions![0].id, textValue: 'Trying to be anonymous' }],
          },
          '10.1.2.1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('IDENTIFIED_ONLY rejects submission with missing name or invalid email', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Mandatory Identified Form 2',
        anonymityMode: 'IDENTIFIED_ONLY',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      // Missing name
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: false,
            respondentEmail: 'valid@example.com',
            answers: [{ questionId: form.questions![0].id, textValue: 'Test' }],
          },
          '10.1.2.2'
        )
      ).rejects.toThrow(BadRequestException);

      // Malformed email
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: false,
            respondentName: 'Jane Doe',
            respondentEmail: 'not-an-email',
            answers: [{ questionId: form.questions![0].id, textValue: 'Test' }],
          },
          '10.1.2.3'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('IDENTIFIED_ONLY persists isAnonymous: false and validated identity', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Mandatory Identified Form 3',
        anonymityMode: 'IDENTIFIED_ONLY',
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      const result = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: false,
          respondentName: 'Jane Doe',
          respondentEmail: 'Jane@Example.COM',
          answers: [{ questionId: form.questions![0].id, textValue: 'Identified answer' }],
        },
        '10.1.2.4'
      );

      expect(result.success).toBe(true);

      const persisted = await prisma.feedbackResponse.findUnique({
        where: { submissionToken: result.submissionToken },
      });
      expect(persisted).toBeDefined();
      expect(persisted?.isAnonymous).toBe(false);
      expect(persisted?.respondentName).toBe('Jane Doe');
      expect(persisted?.respondentEmail).toBe('jane@example.com'); // Lowercase normalized
    });

    it('RESPONDENT_CHOICE accepts both anonymous and identified submissions correctly', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Choice Form',
        anonymityMode: 'RESPONDENT_CHOICE',
        allowMultipleSubmissions: true,
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      // 1. Submit anonymously
      const anonResult = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [{ questionId: form.questions![0].id, textValue: 'Anonymous choice' }],
        },
        '10.1.3.1'
      );
      const anonPersisted = await prisma.feedbackResponse.findUnique({
        where: { submissionToken: anonResult.submissionToken },
      });
      expect(anonPersisted?.isAnonymous).toBe(true);
      expect(anonPersisted?.respondentEmail).toBeNull();

      // 2. Submit identified
      const identResult = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: false,
          respondentName: 'Alice Smith',
          respondentEmail: 'alice@example.com',
          answers: [{ questionId: form.questions![0].id, textValue: 'Identified choice' }],
        },
        '10.1.3.2'
      );
      const identPersisted = await prisma.feedbackResponse.findUnique({
        where: { submissionToken: identResult.submissionToken },
      });
      expect(identPersisted?.isAnonymous).toBe(false);
      expect(identPersisted?.respondentName).toBe('Alice Smith');
      expect(identPersisted?.respondentEmail).toBe('alice@example.com');
    });
  });

  describe('Multiple Submission Policy & Duplicate Prevention', () => {
    it('rejects repeat identified submission when allowMultipleSubmissions is false', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'No Multi Submit Form (Identified)',
        anonymityMode: 'IDENTIFIED_ONLY',
        allowMultipleSubmissions: false,
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      // First submission succeeds
      const first = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: false,
          respondentName: 'User One',
          respondentEmail: 'one@example.com',
          answers: [{ questionId: form.questions![0].id, textValue: 'First' }],
        },
        '10.2.0.1'
      );
      expect(first.success).toBe(true);

      // Second submission with SAME email is rejected
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: false,
            respondentName: 'User One',
            respondentEmail: 'one@example.com',
            answers: [{ questionId: form.questions![0].id, textValue: 'Second attempt' }],
          },
          '10.2.0.99' // Different IP, but same email
        )
      ).rejects.toThrow(ConflictException);
    });

    it('rejects repeat anonymous submission from same IP within cooldown when allowMultipleSubmissions is false', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'No Multi Submit Form (Anonymous)',
        anonymityMode: 'ANONYMOUS_ONLY',
        allowMultipleSubmissions: false,
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      // First submission succeeds
      const first = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [{ questionId: form.questions![0].id, textValue: 'First anon' }],
        },
        '10.2.1.50'
      );
      expect(first.success).toBe(true);

      // Second submission from SAME IP is rejected by anti-duplicate check
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: form.questions![0].id, textValue: 'Second anon' }],
          },
          '10.2.1.50'
        )
      ).rejects.toThrow(ConflictException);
    });

    it('permits multiple submissions when allowMultipleSubmissions is true', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Allow Multi Submit Form',
        anonymityMode: 'IDENTIFIED_ONLY',
        allowMultipleSubmissions: true,
        questions: [{ questionType: 'SHORT_TEXT', title: 'Q', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);

      // First submission
      const first = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: false,
          respondentName: 'Repeat User',
          respondentEmail: 'repeat@example.com',
          answers: [{ questionId: form.questions![0].id, textValue: 'First' }],
        },
        '10.2.2.1'
      );
      expect(first.success).toBe(true);

      // Second submission allowed
      const second = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: false,
          respondentName: 'Repeat User',
          respondentEmail: 'repeat@example.com',
          answers: [{ questionId: form.questions![0].id, textValue: 'Second' }],
        },
        '10.2.2.1'
      );
      expect(second.success).toBe(true);

      const check = await service.getForm(tenantA, form.id);
      expect(check.responseCount).toBe(2);
    });
  });

  describe('Comprehensive Question Type Validation', () => {
    it('MULTIPLE_CHOICE rejects non-array, duplicates, and invalid choices', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Multi Choice Test',
        questions: [
          {
            questionType: 'MULTIPLE_CHOICE',
            title: 'Select up to 2 skills',
            isRequired: true,
            validationRules: { maxSelect: 2 },
            options: [
              { label: 'React', value: 'react' },
              { label: 'Node', value: 'node' },
              { label: 'Python', value: 'python' },
            ],
          },
        ],
      });
      await service.publishForm(tenantA, form.id);
      const qId = form.questions![0].id;

      // 1. Non-array payload rejected
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: qId, jsonValue: 'not-an-array' }],
          },
          '10.3.1.1'
        )
      ).rejects.toThrow(BadRequestException);

      // 2. Duplicate option selection rejected
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: qId, jsonValue: ['react', 'react'] }],
          },
          '10.3.1.2'
        )
      ).rejects.toThrow(BadRequestException);

      // 3. Invalid option not in question options rejected
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: qId, jsonValue: ['react', 'cobol_invalid'] }],
          },
          '10.3.1.3'
        )
      ).rejects.toThrow(BadRequestException);

      // 4. Exceeding maxSelect (3 > 2) rejected
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: qId, jsonValue: ['react', 'node', 'python'] }],
          },
          '10.3.1.4'
        )
      ).rejects.toThrow(BadRequestException);

      // 5. Valid selection succeeds
      const valid = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [{ questionId: qId, jsonValue: ['react', 'python'] }],
        },
        '10.3.1.5'
      );
      expect(valid.success).toBe(true);
    });

    it('RATING rejects non-integer floats', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Rating Float Test',
        questions: [
          { questionType: 'RATING', title: 'Score', isRequired: true, validationRules: { minRating: 1, maxRating: 5 } },
        ],
      });
      await service.publishForm(tenantA, form.id);

      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: form.questions![0].id, numberValue: 3.5 }],
          },
          '10.3.2.1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('YES_NO accepts valid representations and rejects invalid values', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Yes No Test',
        allowMultipleSubmissions: true,
        questions: [{ questionType: 'YES_NO', title: 'Agree?', isRequired: true }],
      });
      await service.publishForm(tenantA, form.id);
      const qId = form.questions![0].id;

      // Valid boolean
      const resBool = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [{ questionId: qId, booleanValue: true }],
        },
        '10.3.3.1'
      );
      expect(resBool.success).toBe(true);

      // Valid string 'no'
      const resStr = await service.submitPublicFeedback(
        form.slug,
        {
          isAnonymous: true,
          answers: [{ questionId: qId, textValue: 'no' }],
        },
        '10.3.3.2'
      );
      expect(resStr.success).toBe(true);

      // Invalid string rejected
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [{ questionId: qId, textValue: 'maybe' }],
          },
          '10.3.3.3'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects answers submitted to inactive/soft-deleted questions', async () => {
      const form = await service.createForm(tenantA, userA, {
        title: 'Inactive Q Test',
        questions: [
          { questionType: 'SHORT_TEXT', title: 'Q Active', isRequired: true },
          { questionType: 'SHORT_TEXT', title: 'Q To Deactivate', isRequired: false },
        ],
      });
      await service.publishForm(tenantA, form.id);
      const activeQId = form.questions![0].id;
      const deactivatedQId = form.questions![1].id;

      // Update form, omitting deactivated question
      await service.updateForm(tenantA, form.id, {
        questions: [{ id: activeQId, questionType: 'SHORT_TEXT', title: 'Q Active', isRequired: true }],
      });

      // Attempt to answer the deactivated question
      await expect(
        service.submitPublicFeedback(
          form.slug,
          {
            isAnonymous: true,
            answers: [
              { questionId: activeQId, textValue: 'Valid answer' },
              { questionId: deactivatedQId, textValue: 'Zombie answer' },
            ],
          },
          '10.3.4.1'
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
