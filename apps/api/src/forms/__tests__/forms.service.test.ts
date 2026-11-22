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
});
