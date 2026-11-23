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
          questions: {
            where: { isActive: true },
          },
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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
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
          isActive: q.isActive ?? true,
          version: q.version ?? 1,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
            isActive: o.isActive ?? true,
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

      // If questions are provided, synchronize them safely (non-destructive)
      if (data.questions !== undefined) {
        if (data.questions.length > MAX_QUESTIONS_PER_FORM) {
          throw new BadRequestException(`A form cannot have more than ${MAX_QUESTIONS_PER_FORM} questions.`);
        }

        // Fetch existing questions with their options and answers
        const existingQuestions = await tx.formQuestion.findMany({
          where: { formId },
          include: { options: true, answers: true },
        });
        const existingMap = new Map<string, any>(existingQuestions.map((q: any) => [q.id, q]));
        const incomingQuestionIds = new Set<string>();

        // Process incoming questions
        for (let idx = 0; idx < data.questions.length; idx++) {
          const q = data.questions[idx];
          if (q.id && existingMap.has(q.id)) {
            // Existing question: update in-place, preserving historical FeedbackAnswer integrity
            incomingQuestionIds.add(q.id);
            const existing = existingMap.get(q.id)!;
            const updatedVersion = (existing.version || 1) + 1;

            await tx.formQuestion.update({
              where: { id: q.id },
              data: {
                questionType: q.questionType,
                title: q.title,
                helpText: q.helpText || null,
                placeholder: q.placeholder || null,
                isRequired: q.isRequired ?? true,
                orderIndex: q.orderIndex ?? idx,
                validationRules: (q.validationRules as any) || undefined,
                isActive: true,
                version: updatedVersion,
              } as any,
            });

            // Synchronize options for this question
            if (q.options !== undefined) {
              const existingOptions = existing.options || [];
              const existingOptMap = new Map<string, any>(existingOptions.map((o: any) => [o.id, o]));
              const incomingOptIds = new Set<string>();

              for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
                const opt = q.options[optIdx];
                if (opt.id && existingOptMap.has(opt.id)) {
                  incomingOptIds.add(opt.id);
                  await tx.formQuestionOption.update({
                    where: { id: opt.id },
                    data: {
                      label: opt.label,
                      value: opt.value,
                      orderIndex: opt.orderIndex ?? optIdx,
                      isActive: true,
                    } as any,
                  });
                } else {
                  const newOptId = opt.id || crypto.randomUUID();
                  incomingOptIds.add(newOptId);
                  await tx.formQuestionOption.create({
                    data: {
                      id: newOptId,
                      questionId: q.id,
                      label: opt.label,
                      value: opt.value,
                      orderIndex: opt.orderIndex ?? optIdx,
                      isActive: true,
                    } as any,
                  });
                }
              }

              // Soft-delete removed options to preserve referential consistency
              for (const opt of existingOptions) {
                if (!incomingOptIds.has(opt.id)) {
                  await tx.formQuestionOption.update({
                    where: { id: opt.id },
                    data: { isActive: false } as any,
                  });
                }
              }
            }
          } else {
            // New question: create with active status and version 1
            const qId = q.id || crypto.randomUUID();
            incomingQuestionIds.add(qId);
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
                isActive: true,
                version: 1,
                options: {
                  create: (q.options || []).map((opt, optIdx) => ({
                    id: opt.id || crypto.randomUUID(),
                    label: opt.label,
                    value: opt.value,
                    orderIndex: opt.orderIndex ?? optIdx,
                    isActive: true,
                  })),
                },
              } as any,
            });
          }
        }

        // Soft-delete questions that were removed in this update.
        // NEVER DELETE previously answered questions — this preserves historical FeedbackAnswer records!
        for (const existing of existingQuestions) {
          if (!incomingQuestionIds.has(existing.id)) {
            await tx.formQuestion.update({
              where: { id: existing.id },
              data: { isActive: false } as any,
            });
            await tx.formQuestionOption.updateMany({
              where: { questionId: existing.id },
              data: { isActive: false } as any,
            });
          }
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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
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
          isActive: q.isActive ?? true,
          version: q.version ?? 1,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
            isActive: o.isActive ?? true,
          })),
        })),
        responseCount: updated.responses?.length || 0,
      };
    });
  }

  /**
   * Duplicates an existing form, cloning all its active questions and options with fresh IDs in DRAFT status.
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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
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
        isActive: true,
        version: 1,
        options: {
          create: (q.options || []).map((opt: any, optIdx: number) => ({
            id: crypto.randomUUID(),
            label: opt.label,
            value: opt.value,
            orderIndex: opt.orderIndex ?? optIdx,
            isActive: true,
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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
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
          isActive: q.isActive ?? true,
          version: q.version ?? 1,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
            isActive: o.isActive ?? true,
          })),
        })),
        responseCount: 0,
      };
    });
  }

  /**
   * Publishes a draft form. Validates that the form has at least one active question.
   */
  async publishForm(companyId: string, formId: string): Promise<FeedbackForm> {
    if (!companyId || !formId) {
      throw new BadRequestException('Company ID and Form ID are required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const form = await tx.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          questions: {
            where: { isActive: true },
          },
        },
      });

      if (!form || form.companyId !== companyId) {
        throw new NotFoundException('Feedback form not found.');
      }

      if (!form.questions || form.questions.length === 0) {
        throw new BadRequestException('Cannot publish a form without at least one active question.');
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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
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
          isActive: q.isActive ?? true,
          version: q.version ?? 1,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
            isActive: o.isActive ?? true,
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
        include: {
          questions: {
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
          responses: true,
        },
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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
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
          isActive: q.isActive ?? true,
          version: q.version ?? 1,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
            isActive: o.isActive ?? true,
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
        include: {
          questions: {
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
          responses: true,
        },
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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
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
          isActive: q.isActive ?? true,
          version: q.version ?? 1,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            questionId: o.questionId,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
            isActive: o.isActive ?? true,
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

      // Explicitly delete responses to satisfy ON DELETE RESTRICT on FeedbackAnswer -> question
      await tx.feedbackResponse.deleteMany({
        where: { formId },
      });

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
            where: { isActive: true },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
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
        allowMultipleSubmissions: form.allowMultipleSubmissions,
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
          isActive: q.isActive ?? true,
          version: q.version ?? 1,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex,
            isActive: o.isActive ?? true,
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
          where: { isActive: true },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
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
      allowMultipleSubmissions: form.allowMultipleSubmissions,
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
        isActive: q.isActive ?? true,
        version: q.version ?? 1,
        options: (q.options || []).map((o: any) => ({
          id: o.id,
          label: o.label,
          value: o.value,
          orderIndex: o.orderIndex,
          isActive: o.isActive ?? true,
        })),
      })),
    };
  }

  /**
   * Unauthenticated endpoint: Submits a feedback response to a published form.
   * Performs rate limiting, server-side anonymity policy enforcement, duplicate prevention,
   * comprehensive answer validation, and decoupled persistence within dedicated public submission context.
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

    // 2. Validate submission payload structure
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
          where: { isActive: true },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
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

    // 4. Server-Side Anonymity Policy Enforcement (Server is the security boundary)
    let resolvedIsAnonymous = true;
    let resolvedRespondentName: string | null = null;
    let resolvedRespondentEmail: string | null = null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    switch (form.anonymityMode) {
      case 'ANONYMOUS_ONLY': {
        if (data.isAnonymous === false) {
          throw new BadRequestException(
            'This form is configured as anonymous-only. Identified submissions are not accepted.'
          );
        }
        if (
          (data.respondentName && data.respondentName.trim().length > 0) ||
          (data.respondentEmail && data.respondentEmail.trim().length > 0)
        ) {
          throw new BadRequestException(
            'This form is configured as anonymous-only. Personal identity fields must not be provided.'
          );
        }
        resolvedIsAnonymous = true;
        resolvedRespondentName = null;
        resolvedRespondentEmail = null;
        break;
      }

      case 'IDENTIFIED_ONLY': {
        if (data.isAnonymous === true) {
          throw new BadRequestException(
            'This form requires respondent identification. Anonymous submissions are not accepted.'
          );
        }
        if (!data.respondentEmail || !data.respondentEmail.trim() || !data.respondentName || !data.respondentName.trim()) {
          throw new BadRequestException(
            'Respondent name and a valid email address are required for this form.'
          );
        }
        const trimmedEmail = data.respondentEmail.trim().toLowerCase();
        if (!emailRegex.test(trimmedEmail)) {
          throw new BadRequestException('A valid email address is required.');
        }
        resolvedIsAnonymous = false;
        resolvedRespondentName = data.respondentName.trim();
        resolvedRespondentEmail = trimmedEmail;
        break;
      }

      case 'RESPONDENT_CHOICE': {
        if (data.isAnonymous) {
          resolvedIsAnonymous = true;
          resolvedRespondentName = null;
          resolvedRespondentEmail = null;
        } else {
          if (!data.respondentEmail || !data.respondentEmail.trim() || !data.respondentName || !data.respondentName.trim()) {
            throw new BadRequestException(
              'Respondent name and a valid email address are required when submitting as an identified respondent.'
            );
          }
          const trimmedEmail = data.respondentEmail.trim().toLowerCase();
          if (!emailRegex.test(trimmedEmail)) {
            throw new BadRequestException('A valid email address is required.');
          }
          resolvedIsAnonymous = false;
          resolvedRespondentName = data.respondentName.trim();
          resolvedRespondentEmail = trimmedEmail;
        }
        break;
      }
    }

    // 5. Anti-duplicate and Rate-Limiting Hash (Salted SHA-256)
    const salt = process.env.APP_SECRET || 'feedbackhub_privacy_salt_2026';
    const ipHash = crypto
      .createHash('sha256')
      .update(`${form.id}:${rateLimitIdentifier}:${salt}`)
      .digest('hex');

    // Concurrency lock key for atomic duplicate serialization if multiple submissions are disabled
    let lockKey: string | null = null;
    if (!form.allowMultipleSubmissions) {
      if (!resolvedIsAnonymous && resolvedRespondentEmail) {
        lockKey = `email:${resolvedRespondentEmail.toLowerCase()}`;
      } else if (resolvedIsAnonymous && ipHash) {
        lockKey = `ip:${ipHash}`;
      }
    }

    // 6. Validate submitted answers against active form question definitions
    const questionMap = new Map<string, any>();
    for (const q of form.questions || []) {
      if (q.isActive !== false) {
        questionMap.set(q.id, q);
      }
    }

    const answeredQuestionIds = new Set<string>();
    const sanitizedAnswers: Array<{
      questionId: string;
      questionTitle: string;
      questionType: string;
      selectedOptionLabel: string | null;
      selectedOptionValue: string | null;
      selectedOptions: Array<{ label: string; value: string }> | null;
      textValue: string | null;
      numberValue: number | null;
      booleanValue: boolean | null;
      jsonValue: any | null;
    }> = [];

    for (const answer of data.answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(`Question ID "${answer.questionId}" does not belong to this form or is inactive.`);
      }

      const qType = question.questionType;
      const rules = question.validationRules || {};
      let isAnswerEmpty = false;

      let textValue: string | null = null;
      let numberValue: number | null = null;
      let booleanValue: boolean | null = null;
      let jsonValue: any | null = null;
      let selectedOptionLabel: string | null = null;
      let selectedOptionValue: string | null = null;
      let selectedOptions: Array<{ label: string; value: string }> | null = null;

      switch (qType) {
        case 'SHORT_TEXT':
        case 'LONG_TEXT': {
          if (answer.textValue !== undefined && answer.textValue !== null) {
            const trimmed = typeof answer.textValue === 'string' ? answer.textValue.trim() : String(answer.textValue);
            if (trimmed.length === 0) {
              isAnswerEmpty = true;
            } else {
              const maxLen = rules.maxLength || MAX_TEXT_ANSWER_LENGTH;
              if (trimmed.length > maxLen) {
                throw new BadRequestException(
                  `Answer for "${question.title}" exceeds maximum length of ${maxLen} characters.`
                );
              }
              textValue = trimmed;
            }
          } else {
            isAnswerEmpty = true;
          }
          break;
        }

        case 'RATING': {
          if (answer.numberValue !== undefined && answer.numberValue !== null) {
            if (typeof answer.numberValue !== 'number' || !Number.isInteger(answer.numberValue)) {
              throw new BadRequestException(`Rating for "${question.title}" must be an integer score.`);
            }
            const minRating = rules.minRating !== undefined ? rules.minRating : 1;
            const maxRating = rules.maxRating !== undefined ? rules.maxRating : 5;
            if (answer.numberValue < minRating || answer.numberValue > maxRating) {
              throw new BadRequestException(
                `Rating for "${question.title}" must be between ${minRating} and ${maxRating}.`
              );
            }
            numberValue = answer.numberValue;
          } else {
            isAnswerEmpty = true;
          }
          break;
        }

        case 'SINGLE_CHOICE': {
          if (answer.textValue && typeof answer.textValue === 'string' && answer.textValue.trim() !== '') {
            const trimmed = answer.textValue.trim();
            const matchedOption = (question.options || []).find(
              (o: any) => o.isActive !== false && o.value === trimmed
            );
            if (!matchedOption) {
              throw new BadRequestException(
                `Invalid choice "${trimmed}" selected for "${question.title}".`
              );
            }
            textValue = trimmed;
            selectedOptionLabel = matchedOption.label;
            selectedOptionValue = matchedOption.value;
            selectedOptions = [{ label: matchedOption.label, value: matchedOption.value }];
            jsonValue = {
              selectedOption: { label: matchedOption.label, value: matchedOption.value },
              selectedOptions: [{ label: matchedOption.label, value: matchedOption.value }],
            };
          } else {
            isAnswerEmpty = true;
          }
          break;
        }

        case 'MULTIPLE_CHOICE': {
          if (answer.jsonValue !== undefined && answer.jsonValue !== null) {
            if (!Array.isArray(answer.jsonValue)) {
              throw new BadRequestException(`Multiple choice answer for "${question.title}" must be an array of selected options.`);
            }
            if (answer.jsonValue.length === 0) {
              isAnswerEmpty = true;
            } else {
              // Check duplicate selections within array
              if (new Set(answer.jsonValue).size !== answer.jsonValue.length) {
                throw new BadRequestException(`Duplicate options are not permitted in answer for "${question.title}".`);
              }
              const validOptionMap = new Map<string, any>();
              for (const o of question.options || []) {
                if (o.isActive !== false) {
                  validOptionMap.set(o.value, o);
                }
              }

              const snapshots: Array<{ label: string; value: string }> = [];
              for (const val of answer.jsonValue) {
                if (typeof val !== 'string' || !validOptionMap.has(val)) {
                  throw new BadRequestException(`Invalid option "${val}" selected for "${question.title}".`);
                }
                const opt = validOptionMap.get(val);
                snapshots.push({ label: opt.label, value: opt.value });
              }
              if (rules.maxSelect && answer.jsonValue.length > rules.maxSelect) {
                throw new BadRequestException(
                  `You may select at most ${rules.maxSelect} options for "${question.title}".`
                );
              }
              selectedOptions = snapshots;
              jsonValue = answer.jsonValue;
            }
          } else {
            isAnswerEmpty = true;
          }
          break;
        }

        case 'YES_NO': {
          if (answer.booleanValue !== undefined && answer.booleanValue !== null) {
            booleanValue = Boolean(answer.booleanValue);
            textValue = booleanValue ? 'yes' : 'no';
          } else if (answer.textValue && typeof answer.textValue === 'string') {
            const val = answer.textValue.toLowerCase().trim();
            if (val === 'yes' || val === 'true') {
              booleanValue = true;
              textValue = 'yes';
            } else if (val === 'no' || val === 'false') {
              booleanValue = false;
              textValue = 'no';
            } else {
              throw new BadRequestException(`Answer for "${question.title}" must be Yes or No.`);
            }
          } else {
            isAnswerEmpty = true;
          }
          break;
        }

        default: {
          textValue = answer.textValue ? String(answer.textValue) : null;
          numberValue = answer.numberValue ?? null;
          booleanValue = answer.booleanValue ?? null;
          jsonValue = answer.jsonValue ?? null;
          if (!textValue && numberValue === null && booleanValue === null && !jsonValue) {
            isAnswerEmpty = true;
          }
        }
      }

      if (!isAnswerEmpty) {
        answeredQuestionIds.add(answer.questionId);
        sanitizedAnswers.push({
          questionId: answer.questionId,
          questionTitle: question.title,
          questionType: qType,
          selectedOptionLabel,
          selectedOptionValue,
          selectedOptions,
          textValue,
          numberValue,
          booleanValue,
          jsonValue,
        });
      }
    }

    // Check that all required active questions were answered
    for (const q of form.questions || []) {
      if (q.isActive !== false && q.isRequired && !answeredQuestionIds.has(q.id)) {
        throw new BadRequestException(`Question "${q.title}" is required.`);
      }
    }

    // 7. Persist submission transactionally inside dedicated public submission context with concurrency lock
    const submissionToken = `sub_${crypto.randomBytes(24).toString('hex')}`;
    const submittedAt = new Date();

    await this.prisma.withPublicSubmissionContext(form.companyId, form.id, lockKey, async (tx) => {
      // Re-verify form status inside transaction to prevent publish/archive race conditions
      const currentForm = await tx.feedbackForm.findUnique({
        where: { id: form.id },
      });
      if (!currentForm || currentForm.status !== 'PUBLISHED') {
        throw new BadRequestException('Feedback form is no longer accepting submissions.');
      }

      // Atomic duplicate check inside the transaction under the advisory lock
      if (!form.allowMultipleSubmissions) {
        if (!resolvedIsAnonymous && resolvedRespondentEmail) {
          const existingIdentified = await tx.feedbackResponse.findFirst({
            where: {
              formId: form.id,
              respondentEmail: resolvedRespondentEmail,
            },
          });
          if (existingIdentified) {
            throw new ConflictException('You have already submitted feedback for this form.');
          }
        } else if (resolvedIsAnonymous && ipHash) {
          const cooldownStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const existingAnonymous = await tx.feedbackResponse.findFirst({
            where: {
              formId: form.id,
              ipHash,
              submittedAt: { gte: cooldownStart },
            },
          });
          if (existingAnonymous) {
            throw new ConflictException(
              'A response has already been submitted for this form from your network recently. Multiple submissions are disabled.'
            );
          }
        }
      }

      const response = await tx.feedbackResponse.create({
        data: {
          companyId: form.companyId,
          formId: form.id,
          submissionToken,
          isAnonymous: resolvedIsAnonymous,
          respondentName: resolvedRespondentName,
          respondentEmail: resolvedRespondentEmail,
          ipHash,
          status: 'NEW',
          submittedAt,
        },
      });

      for (const answer of sanitizedAnswers) {
        await tx.feedbackAnswer.create({
          data: {
            responseId: response.id,
            questionId: answer.questionId,
            questionTitle: answer.questionTitle,
            questionType: answer.questionType,
            selectedOptionLabel: answer.selectedOptionLabel,
            selectedOptionValue: answer.selectedOptionValue,
            selectedOptions: (answer.selectedOptions as any) ?? undefined,
            textValue: answer.textValue,
            numberValue: answer.numberValue,
            booleanValue: answer.booleanValue,
            jsonValue: (answer.jsonValue as any) ?? undefined,
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
