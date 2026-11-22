/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Optional,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiterService } from '../auth/rate-limiter.service';
import {
  createFeedbackFormSchema,
  updateFeedbackFormSchema,
  publicFeedbackSubmissionSchema,
  MAX_QUESTIONS_PER_FORM,
  MAX_TEXT_ANSWER_LENGTH,
} from '@feedbackhub/validation';
import type {
  FeedbackForm,
  FeedbackFormSummary,
  FormStatus,
  PublicFeedbackForm,
  PublicSubmissionResult,
  QuestionType,
} from '@feedbackhub/types';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);
  private readonly prisma: PrismaService;
  private readonly rateLimiter: RateLimiterService;

  constructor(
    @Optional() prisma?: PrismaService,
    @Optional() rateLimiter?: RateLimiterService
  ) {
    this.prisma = prisma || new PrismaService();
    this.rateLimiter = rateLimiter || new RateLimiterService();
  }

  /**
   * Generates a URL-safe, unique slug from a form title.
   */
  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    const safeBase = baseSlug || 'feedback-form';
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `${safeBase}-${randomSuffix}`;
  }

  /**
   * Lists all feedback forms for the authenticated tenant with metadata & counts.
   */
  async listForms(
    companyId: string,
    options?: { search?: string; status?: FormStatus }
  ): Promise<FeedbackFormSummary[]> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const where: Record<string, unknown> = { companyId };

      if (options?.status) {
        where.status = options.status;
      }

      if (options?.search && options.search.trim()) {
        const search = options.search.trim();
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { internalName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const forms = await tx.feedbackForm.findMany({
        where,
        include: {
          questions: true,
          responses: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return forms.map((f: {
        id: string;
        companyId: string;
        internalName?: string | null;
        title: string;
        slug: string;
        description?: string | null;
        audienceType: string;
        anonymityMode: string;
        status: string;
        publishedAt?: Date | string | null;
        updatedAt: Date | string;
        questions?: unknown[];
        responses?: unknown[];
        _count?: { questions?: number; responses?: number };
      }) => ({
        id: f.id,
        companyId: f.companyId,
        internalName: f.internalName || null,
        title: f.title,
        slug: f.slug,
        description: f.description || null,
        audienceType: f.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: f.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: f.status as FormStatus,
        publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
        updatedAt: new Date(f.updatedAt).toISOString(),
        questionCount: f.questions?.length ?? f._count?.questions ?? 0,
        responseCount: f.responses?.length ?? f._count?.responses ?? 0,
      }));
    });
  }

  /**
   * Retrieves a single form by ID for the tenant, including questions and options.
   */
  async getForm(companyId: string, formId: string): Promise<FeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          questions: {
            include: { options: true },
          },
          responses: true,
        },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      return {
        id: form.id,
        companyId: form.companyId,
        internalName: form.internalName || null,
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        welcomeMessage: form.welcomeMessage || null,
        thankYouMessage: form.thankYouMessage || null,
        audienceType: form.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: form.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: form.status as FormStatus,
        allowMultipleSubmissions: form.allowMultipleSubmissions,
        themeSettings: form.themeSettings as Record<string, unknown> | null,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
        closedAt: form.closedAt ? new Date(form.closedAt).toISOString() : null,
        createdAt: new Date(form.createdAt).toISOString(),
        updatedAt: new Date(form.updatedAt).toISOString(),
        questions: (form.questions || []).map((q: any) => ({
          id: q.id,
          formId: q.formId,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
        responseCount: form.responses?.length || 0,
      };
    });
  }

  /**
   * Creates a new feedback form for the tenant.
   */
  async createForm(companyId: string, _userId: string, body: unknown): Promise<FeedbackForm> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required.');
    }

    const parseResult = createFeedbackFormSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new BadRequestException(issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid form input.');
    }

    const data = parseResult.data;
    const slug = data.slug || this.generateSlug(data.title);

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      // Ensure unique slug
      const existing = await tx.feedbackForm.findUnique({
        where: { slug },
      });
      if (existing) {
        throw new ConflictException(`Form slug "${slug}" is already taken. Please choose another.`);
      }

      const questionsToCreate = (data.questions || []).map((q, idx) => ({
        id: q.id || crypto.randomUUID(),
        questionType: q.questionType,
        title: q.title,
        helpText: q.helpText || null,
        placeholder: q.placeholder || null,
        isRequired: q.isRequired ?? true,
        orderIndex: q.orderIndex ?? idx,
        validationRules: q.validationRules || null,
        options: {
          create: (q.options || []).map((opt, optIdx) => ({
            id: opt.id || crypto.randomUUID(),
            label: opt.label,
            value: opt.value,
            orderIndex: opt.orderIndex ?? optIdx,
          })),
        },
      }));

      const created: any = await tx.feedbackForm.create({
        data: {
          companyId,
          internalName: data.internalName || null,
          title: data.title,
          slug,
          description: data.description || null,
          welcomeMessage: data.welcomeMessage || null,
          thankYouMessage: data.thankYouMessage || null,
          audienceType: data.audienceType || 'CUSTOMER',
          anonymityMode: data.anonymityMode || 'ANONYMOUS_ONLY',
          status: 'DRAFT',
          allowMultipleSubmissions: data.allowMultipleSubmissions || false,
          themeSettings: (data.themeSettings as any) || undefined,
          questions: {
            create: questionsToCreate as any,
          },
        } as any,
        include: {
          questions: {
            include: { options: true },
          },
        },
      });

      return {
        id: created.id,
        companyId: created.companyId,
        internalName: created.internalName || null,
        title: created.title,
        slug: created.slug,
        description: created.description || null,
        welcomeMessage: created.welcomeMessage || null,
        thankYouMessage: created.thankYouMessage || null,
        audienceType: created.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: created.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: created.status as FormStatus,
        allowMultipleSubmissions: created.allowMultipleSubmissions,
        themeSettings: created.themeSettings as Record<string, unknown> | null,
        publishedAt: null,
        closedAt: null,
        createdAt: new Date(created.createdAt).toISOString(),
        updatedAt: new Date(created.updatedAt).toISOString(),
        questions: (created.questions || []).map((q: any) => ({
          id: q.id,
          formId: q.formId,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
        responseCount: 0,
      };
    });
  }

  /**
   * Updates an existing feedback form and synchronizes questions.
   */
  async updateForm(companyId: string, formId: string, body: unknown): Promise<FeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    const parseResult = updateFeedbackFormSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new BadRequestException(issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid form input.');
    }

    const data = parseResult.data;

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      // If slug is changing, verify uniqueness
      if (data.slug && data.slug !== form.slug) {
        const existing = await tx.feedbackForm.findUnique({
          where: { slug: data.slug },
        });
        if (existing && existing.id !== formId) {
          throw new ConflictException(`Form slug "${data.slug}" is already taken.`);
        }
      }

      // If questions are provided, synchronize them safely
      if (data.questions !== undefined) {
        if (data.questions.length > MAX_QUESTIONS_PER_FORM) {
          throw new BadRequestException(`A form cannot have more than ${MAX_QUESTIONS_PER_FORM} questions.`);
        }

        // Delete existing questions & options for this form
        await tx.formQuestion.deleteMany({
          where: { formId },
        });

        // Create new questions with options
        for (let idx = 0; idx < data.questions.length; idx++) {
          const q = data.questions[idx];
          const qId = q.id || crypto.randomUUID();
          await tx.formQuestion.create({
            data: {
              id: qId,
              formId,
              questionType: q.questionType,
              title: q.title,
              helpText: q.helpText || null,
              placeholder: q.placeholder || null,
              isRequired: q.isRequired ?? true,
              orderIndex: q.orderIndex ?? idx,
              validationRules: (q.validationRules as any) || undefined,
              options: {
                create: (q.options || []).map((opt, optIdx) => ({
                  id: opt.id || crypto.randomUUID(),
                  label: opt.label,
                  value: opt.value,
                  orderIndex: opt.orderIndex ?? optIdx,
                })),
              },
            } as any,
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (data.internalName !== undefined) updateData.internalName = data.internalName || null;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.welcomeMessage !== undefined) updateData.welcomeMessage = data.welcomeMessage || null;
      if (data.thankYouMessage !== undefined) updateData.thankYouMessage = data.thankYouMessage || null;
      if (data.audienceType !== undefined) updateData.audienceType = data.audienceType;
      if (data.anonymityMode !== undefined) updateData.anonymityMode = data.anonymityMode;
      if (data.allowMultipleSubmissions !== undefined) updateData.allowMultipleSubmissions = data.allowMultipleSubmissions;
      if (data.themeSettings !== undefined) updateData.themeSettings = data.themeSettings || null;

      const updated = await tx.feedbackForm.update({
        where: { id: formId },
        data: updateData,
        include: {
          questions: {
            include: { options: true },
          },
          responses: true,
        },
      });

      return {
        id: updated.id,
        companyId: updated.companyId,
        internalName: updated.internalName || null,
        title: updated.title,
        slug: updated.slug,
        description: updated.description || null,
        welcomeMessage: updated.welcomeMessage || null,
        thankYouMessage: updated.thankYouMessage || null,
        audienceType: updated.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: updated.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: updated.status as FormStatus,
        allowMultipleSubmissions: updated.allowMultipleSubmissions,
        themeSettings: updated.themeSettings as Record<string, unknown> | null,
        publishedAt: updated.publishedAt ? new Date(updated.publishedAt).toISOString() : null,
        closedAt: updated.closedAt ? new Date(updated.closedAt).toISOString() : null,
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
        questions: (updated.questions || []).map((q: any) => ({
          id: q.id,
          formId: q.formId,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
        responseCount: updated.responses?.length || 0,
      };
    });
  }

  /**
   * Duplicates an existing form, cloning all its questions and options with fresh IDs in DRAFT status.
   */
  async duplicateForm(companyId: string, formId: string): Promise<FeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const source = await tx.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          questions: {
            include: { options: true },
          },
        },
      });

      if (!source || source.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      const duplicateTitle = `${source.title} (Copy)`.slice(0, 200);
      const duplicateSlug = this.generateSlug(duplicateTitle);

      const questionsToCreate = (source.questions || []).map((q: any, idx: number) => ({
        id: crypto.randomUUID(),
        questionType: q.questionType,
        title: q.title,
        helpText: q.helpText || null,
        placeholder: q.placeholder || null,
        isRequired: q.isRequired,
        orderIndex: q.orderIndex ?? idx,
        validationRules: q.validationRules || null,
        options: {
          create: (q.options || []).map((opt: any, optIdx: number) => ({
            id: crypto.randomUUID(),
            label: opt.label,
            value: opt.value,
            orderIndex: opt.orderIndex ?? optIdx,
          })),
        },
      }));

      const cloned: any = await tx.feedbackForm.create({
        data: {
          companyId,
          internalName: source.internalName ? `${source.internalName} (Copy)`.slice(0, 200) : null,
          title: duplicateTitle,
          slug: duplicateSlug,
          description: source.description || null,
          welcomeMessage: source.welcomeMessage || null,
          thankYouMessage: source.thankYouMessage || null,
          audienceType: source.audienceType,
          anonymityMode: source.anonymityMode,
          status: 'DRAFT',
          allowMultipleSubmissions: source.allowMultipleSubmissions,
          themeSettings: (source.themeSettings as any) || undefined,
          questions: {
            create: questionsToCreate as any,
          },
        } as any,
        include: {
          questions: {
            include: { options: true },
          },
        },
      });

      return {
        id: cloned.id,
        companyId: cloned.companyId,
        internalName: cloned.internalName || null,
        title: cloned.title,
        slug: cloned.slug,
        description: cloned.description || null,
        welcomeMessage: cloned.welcomeMessage || null,
        thankYouMessage: cloned.thankYouMessage || null,
        audienceType: cloned.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: cloned.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: cloned.status as FormStatus,
        allowMultipleSubmissions: cloned.allowMultipleSubmissions,
        themeSettings: cloned.themeSettings as Record<string, unknown> | null,
        publishedAt: null,
        closedAt: null,
        createdAt: new Date(cloned.createdAt).toISOString(),
        updatedAt: new Date(cloned.updatedAt).toISOString(),
        questions: (cloned.questions || []).map((q: any) => ({
          id: q.id,
          formId: q.formId,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
        responseCount: 0,
      };
    });
  }

  /**
   * Publishes a draft form. Validates that the form has at least one question.
   */
  async publishForm(companyId: string, formId: string): Promise<FeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
        include: { questions: true },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      if (!form.questions || form.questions.length === 0) {
        throw new BadRequestException('Cannot publish a form without at least one question.');
      }

      const updated = await tx.feedbackForm.update({
        where: { id: formId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          closedAt: null,
        },
        include: {
          questions: {
            include: { options: true },
          },
          responses: true,
        },
      });

      return {
        id: updated.id,
        companyId: updated.companyId,
        internalName: updated.internalName || null,
        title: updated.title,
        slug: updated.slug,
        description: updated.description || null,
        welcomeMessage: updated.welcomeMessage || null,
        thankYouMessage: updated.thankYouMessage || null,
        audienceType: updated.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: updated.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: updated.status as FormStatus,
        allowMultipleSubmissions: updated.allowMultipleSubmissions,
        themeSettings: updated.themeSettings as Record<string, unknown> | null,
        publishedAt: new Date(updated.publishedAt!).toISOString(),
        closedAt: null,
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
        questions: (updated.questions || []).map((q: any) => ({
          id: q.id,
          formId: q.formId,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
        responseCount: updated.responses?.length || 0,
      };
    });
  }

  /**
   * Unpublishes a published form, moving it back to DRAFT.
   */
  async unpublishForm(companyId: string, formId: string): Promise<FeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
        include: { questions: { include: { options: true } }, responses: true },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      const updated = await tx.feedbackForm.update({
        where: { id: formId },
        data: {
          status: 'DRAFT',
        },
        include: {
          questions: {
            include: { options: true },
          },
          responses: true,
        },
      });

      return {
        id: updated.id,
        companyId: updated.companyId,
        internalName: updated.internalName || null,
        title: updated.title,
        slug: updated.slug,
        description: updated.description || null,
        welcomeMessage: updated.welcomeMessage || null,
        thankYouMessage: updated.thankYouMessage || null,
        audienceType: updated.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: updated.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: updated.status as FormStatus,
        allowMultipleSubmissions: updated.allowMultipleSubmissions,
        themeSettings: updated.themeSettings as Record<string, unknown> | null,
        publishedAt: updated.publishedAt ? new Date(updated.publishedAt).toISOString() : null,
        closedAt: null,
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
        questions: (updated.questions || []).map((q: any) => ({
          id: q.id,
          formId: q.formId,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
        responseCount: updated.responses?.length || 0,
      };
    });
  }

  /**
   * Archives a form. Archived forms permanently stop accepting new public submissions.
   */
  async archiveForm(companyId: string, formId: string): Promise<FeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
        include: { questions: { include: { options: true } }, responses: true },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      const updated = await tx.feedbackForm.update({
        where: { id: formId },
        data: {
          status: 'ARCHIVED',
          closedAt: new Date(),
        },
        include: {
          questions: {
            include: { options: true },
          },
          responses: true,
        },
      });

      return {
        id: updated.id,
        companyId: updated.companyId,
        internalName: updated.internalName || null,
        title: updated.title,
        slug: updated.slug,
        description: updated.description || null,
        welcomeMessage: updated.welcomeMessage || null,
        thankYouMessage: updated.thankYouMessage || null,
        audienceType: updated.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: updated.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        status: updated.status as FormStatus,
        allowMultipleSubmissions: updated.allowMultipleSubmissions,
        themeSettings: updated.themeSettings as Record<string, unknown> | null,
        publishedAt: updated.publishedAt ? new Date(updated.publishedAt).toISOString() : null,
        closedAt: new Date(updated.closedAt!).toISOString(),
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
        questions: (updated.questions || []).map((q: any) => ({
          id: q.id,
          formId: q.formId,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
        responseCount: updated.responses?.length || 0,
      };
    });
  }

  /**
   * Deletes a form and all child questions, options, and responses.
   */
  async deleteForm(companyId: string, formId: string): Promise<{ success: boolean; message: string }> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      await tx.feedbackForm.delete({
        where: { id: formId },
      });

      return {
        success: true,
        message: 'Feedback form and associated data successfully deleted.',
      };
    });
  }

  /**
   * Returns a preview representation of any form for authenticated managers.
   */
  async getPreview(companyId: string, formId: string): Promise<PublicFeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          company: true,
          questions: {
            include: { options: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      const company = form.company || (await tx.company.findUnique({ where: { id: companyId } }));

      return {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description || null,
        welcomeMessage: form.welcomeMessage || null,
        thankYouMessage: form.thankYouMessage || null,
        audienceType: form.audienceType as import('@feedbackhub/types').FeedbackAudience,
        anonymityMode: form.anonymityMode as import('@feedbackhub/types').AnonymityMode,
        companyName: company?.name || 'Company',
        companyLogoUrl: company?.logoUrl || null,
        brandColorHex: company?.brandColorHex || '#8B5CF6',
        accentColorHex: company?.accentColorHex || '#EC4899',
        questions: (form.questions || []).map((q: any) => ({
          id: q.id,
          questionType: q.questionType as QuestionType,
          title: q.title,
          helpText: q.helpText || null,
          placeholder: q.placeholder || null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          validationRules: q.validationRules,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
          })),
        })),
      };
    });
  }

  /**
   * Unauthenticated endpoint: Retrieves published form details for public respondent page.
   * Strips all internal company and administrative identifiers.
   */
  async getPublicFormBySlug(slug: string): Promise<PublicFeedbackForm> {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      throw new NotFoundException('Feedback form not found.');
    }

    const cleanSlug = slug.trim().toLowerCase();

    const form = await this.prisma.feedbackForm.findFirst({
      where: {
        slug: cleanSlug,
        status: 'PUBLISHED',
      },
      include: {
        company: true,
        questions: {
          include: { options: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Feedback form not found or is no longer accepting responses.');
    }

    // Verify parent company is ACTIVE
    const company = form.company || (await this.prisma.company.findUnique({ where: { id: form.companyId } }));
    if (!company || !company.isActive || company.status !== 'ACTIVE') {
      throw new NotFoundException('This company is currently inactive and cannot accept feedback.');
    }

    return {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description || null,
      welcomeMessage: form.welcomeMessage || null,
      thankYouMessage: form.thankYouMessage || null,
      audienceType: form.audienceType as import('@feedbackhub/types').FeedbackAudience,
      anonymityMode: form.anonymityMode as import('@feedbackhub/types').AnonymityMode,
      companyName: company.name,
      companyLogoUrl: company.logoUrl || null,
      brandColorHex: company.brandColorHex || '#8B5CF6',
      accentColorHex: company.accentColorHex || '#EC4899',
      questions: (form.questions || []).map((q: any) => ({
        id: q.id,
        questionType: q.questionType as QuestionType,
        title: q.title,
        helpText: q.helpText || null,
        placeholder: q.placeholder || null,
        isRequired: q.isRequired,
        orderIndex: q.orderIndex,
        validationRules: q.validationRules,
        options: (q.options || []).map((o: any) => ({
          id: o.id,
          label: o.label,
          value: o.value,
          orderIndex: o.orderIndex,
        })),
      })),
    };
  }

  /**
   * Unauthenticated endpoint: Submits a feedback response to a published form.
   * Performs rate limiting, comprehensive answer validation, and decoupled persistence.
   */
  async submitPublicFeedback(
    slug: string,
    body: unknown,
    clientIp?: string
  ): Promise<PublicSubmissionResult> {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      throw new NotFoundException('Feedback form not found.');
    }

    const cleanSlug = slug.trim().toLowerCase();

    // 1. Rate Limiting — 20 submissions per 5 minutes per IP
    const rateLimitIdentifier = clientIp || 'anonymous_submitter';
    const rateLimitResult = await this.rateLimiter.check(
      `form_submission:${cleanSlug}_${rateLimitIdentifier}`,
      20,
      300 * 1000
    );
    if (!rateLimitResult.allowed) {
      throw new BadRequestException('Too many feedback submissions. Please wait a few moments before trying again.');
    }

    // 2. Validate submission payload
    const parseResult = publicFeedbackSubmissionSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new BadRequestException(issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid feedback submission.');
    }

    const data = parseResult.data;

    // 3. Resolve form and verify active published status
    const form = await this.prisma.feedbackForm.findFirst({
      where: {
        slug: cleanSlug,
        status: 'PUBLISHED',
      },
      include: {
        company: true,
        questions: {
          include: { options: true },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Feedback form not found or is no longer accepting responses.');
    }

    const company = form.company || (await this.prisma.company.findUnique({ where: { id: form.companyId } }));
    if (!company || !company.isActive || company.status !== 'ACTIVE') {
      throw new NotFoundException('This company is currently inactive and cannot accept feedback.');
    }

    // 4. Validate submitted answers against form question definitions
    const questionMap = new Map<string, any>();
    for (const q of form.questions || []) {
      questionMap.set(q.id, q);
    }

    const answeredQuestionIds = new Set<string>();

    for (const answer of data.answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(`Question ID "${answer.questionId}" does not belong to this form.`);
      }

      answeredQuestionIds.add(answer.questionId);

      // Validate by question type
      const qType = question.questionType;
      const rules = question.validationRules || {};

      switch (qType) {
        case 'SHORT_TEXT':
        case 'LONG_TEXT': {
          if (answer.textValue !== undefined && answer.textValue !== null) {
            const maxLen = rules.maxLength || MAX_TEXT_ANSWER_LENGTH;
            if (answer.textValue.length > maxLen) {
              throw new BadRequestException(
                `Answer for "${question.title}" exceeds maximum length of ${maxLen} characters.`
              );
            }
          }
          break;
        }

        case 'RATING': {
          if (answer.numberValue !== undefined && answer.numberValue !== null) {
            const minRating = rules.minRating !== undefined ? rules.minRating : 1;
            const maxRating = rules.maxRating !== undefined ? rules.maxRating : 5;
            if (answer.numberValue < minRating || answer.numberValue > maxRating) {
              throw new BadRequestException(
                `Rating for "${question.title}" must be between ${minRating} and ${maxRating}.`
              );
            }
          }
          break;
        }

        case 'SINGLE_CHOICE': {
          if (answer.textValue) {
            const validOptions = (question.options || []).map((o: any) => o.value);
            if (!validOptions.includes(answer.textValue)) {
              throw new BadRequestException(
                `Invalid choice "${answer.textValue}" selected for "${question.title}".`
              );
            }
          }
          break;
        }

        case 'MULTIPLE_CHOICE': {
          if (answer.jsonValue) {
            if (!Array.isArray(answer.jsonValue)) {
              throw new BadRequestException(`Multiple choice answer for "${question.title}" must be an array.`);
            }
            const validOptions = (question.options || []).map((o: any) => o.value);
            for (const val of answer.jsonValue) {
              if (typeof val !== 'string' || !validOptions.includes(val)) {
                throw new BadRequestException(`Invalid option "${val}" selected for "${question.title}".`);
              }
            }
            if (rules.maxSelect && answer.jsonValue.length > rules.maxSelect) {
              throw new BadRequestException(
                `You may select at most ${rules.maxSelect} options for "${question.title}".`
              );
            }
          }
          break;
        }

        case 'YES_NO': {
          if (answer.booleanValue === undefined && answer.textValue) {
            const val = answer.textValue.toLowerCase();
            if (val !== 'yes' && val !== 'no' && val !== 'true' && val !== 'false') {
              throw new BadRequestException(`Answer for "${question.title}" must be Yes or No.`);
            }
          }
          break;
        }
      }
    }

    // Check required questions
    for (const q of form.questions || []) {
      if (q.isRequired && !answeredQuestionIds.has(q.id)) {
        throw new BadRequestException(`Question "${q.title}" is required.`);
      }
    }

    // 5. Persist submission transactionally
    const submissionToken = `sub_${crypto.randomBytes(24).toString('hex')}`;
    const submittedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const response = await tx.feedbackResponse.create({
        data: {
          companyId: form.companyId,
          formId: form.id,
          submissionToken,
          isAnonymous: data.isAnonymous ?? true,
          respondentName: data.isAnonymous ? null : (data.respondentName || null),
          respondentEmail: data.isAnonymous ? null : (data.respondentEmail || null),
          status: 'NEW',
          submittedAt,
        },
      });

      for (const answer of data.answers) {
        await tx.feedbackAnswer.create({
          data: {
            responseId: response.id,
            questionId: answer.questionId,
            textValue: answer.textValue || null,
            numberValue: answer.numberValue ?? null,
            booleanValue: answer.booleanValue ?? null,
            jsonValue: answer.jsonValue || null,
          },
        });
      }
    });

    return {
      success: true,
      submissionToken,
      submittedAt: submittedAt.toISOString(),
      message: form.thankYouMessage || 'Thank you! Your feedback has been received.',
    };
  }
}
