import { z } from 'zod';

export const MAX_QUESTIONS_PER_FORM = 50;
export const MAX_OPTIONS_PER_QUESTION = 50;
export const MAX_TEXT_ANSWER_LENGTH = 2000;
export const MAX_FORM_TITLE_LENGTH = 200;
export const MAX_FORM_INTERNAL_NAME_LENGTH = 200;
export const MAX_FORM_DESCRIPTION_LENGTH = 5000;
export const MAX_FORM_MESSAGE_LENGTH = 2000;
export const MAX_QUESTION_TITLE_LENGTH = 500;
export const MAX_QUESTION_HELP_LENGTH = 500;

export const questionTypeSchema = z.enum([
  'SHORT_TEXT',
  'LONG_TEXT',
  'RATING',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'YES_NO',
  'NPS',
  'CSAT',
  'LIKERT_SCALE',
]);

export const questionOptionSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, 'Option label is required').max(255),
  value: z.string().trim().min(1, 'Option value is required').max(255),
  orderIndex: z.number().int().min(0).default(0),
});

export const questionValidationRulesSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).max(MAX_TEXT_ANSWER_LENGTH).optional(),
  minRating: z.number().int().min(0).default(1).optional(),
  maxRating: z.number().int().min(1).max(10).default(5).optional(),
  maxSelect: z.number().int().min(1).optional(),
});

export const createQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  questionType: questionTypeSchema,
  title: z.string().trim().min(1, 'Question title is required').max(MAX_QUESTION_TITLE_LENGTH),
  helpText: z.string().trim().max(MAX_QUESTION_HELP_LENGTH).nullish(),
  placeholder: z.string().trim().max(255).nullish(),
  isRequired: z.boolean().default(true),
  orderIndex: z.number().int().min(0).default(0),
  validationRules: questionValidationRulesSchema.nullish(),
  options: z.array(questionOptionSchema).max(MAX_OPTIONS_PER_QUESTION).optional(),
});

export const createFeedbackFormSchema = z.object({
  internalName: z.string().trim().max(MAX_FORM_INTERNAL_NAME_LENGTH).optional(),
  title: z.string().trim().min(1, 'Form title is required').max(MAX_FORM_TITLE_LENGTH),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  description: z.string().trim().max(MAX_FORM_DESCRIPTION_LENGTH).nullish(),
  welcomeMessage: z.string().trim().max(MAX_FORM_MESSAGE_LENGTH).nullish(),
  thankYouMessage: z.string().trim().max(MAX_FORM_MESSAGE_LENGTH).nullish(),
  audienceType: z.enum(['CUSTOMER', 'EMPLOYEE']).default('CUSTOMER'),
  anonymityMode: z.enum(['ANONYMOUS_ONLY', 'IDENTIFIED_ONLY', 'RESPONDENT_CHOICE']).default('ANONYMOUS_ONLY'),
  allowMultipleSubmissions: z.boolean().default(false),
  themeSettings: z.record(z.unknown()).nullish(),
  questions: z.array(createQuestionSchema).max(MAX_QUESTIONS_PER_FORM).optional(),
});

export const updateFeedbackFormSchema = z.object({
  internalName: z.string().trim().max(MAX_FORM_INTERNAL_NAME_LENGTH).optional(),
  title: z.string().trim().min(1, 'Form title is required').max(MAX_FORM_TITLE_LENGTH).optional(),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  description: z.string().trim().max(MAX_FORM_DESCRIPTION_LENGTH).nullish(),
  welcomeMessage: z.string().trim().max(MAX_FORM_MESSAGE_LENGTH).nullish(),
  thankYouMessage: z.string().trim().max(MAX_FORM_MESSAGE_LENGTH).nullish(),
  audienceType: z.enum(['CUSTOMER', 'EMPLOYEE']).optional(),
  anonymityMode: z.enum(['ANONYMOUS_ONLY', 'IDENTIFIED_ONLY', 'RESPONDENT_CHOICE']).optional(),
  allowMultipleSubmissions: z.boolean().optional(),
  themeSettings: z.record(z.unknown()).nullish(),
  questions: z.array(createQuestionSchema).max(MAX_QUESTIONS_PER_FORM).optional(),
});

export const publicAnswerSubmissionSchema = z.object({
  questionId: z.string().uuid('Invalid question identifier'),
  textValue: z.string().max(MAX_TEXT_ANSWER_LENGTH, `Text exceeds limit of ${MAX_TEXT_ANSWER_LENGTH} characters`).nullish(),
  numberValue: z.number().nullish(),
  booleanValue: z.boolean().nullish(),
  jsonValue: z.any().nullish(),
});

export const publicFeedbackSubmissionSchema = z.object({
  isAnonymous: z.boolean().default(true),
  respondentName: z.string().trim().max(150).nullish(),
  respondentEmail: z.string().trim().email('Invalid email address').nullish(),
  answers: z.array(publicAnswerSubmissionSchema).min(1, 'At least one question must be answered'),
});

// Legacy backward-compatible export
export const feedbackSubmissionSchema = z.object({
  formId: z.string().uuid('Invalid form identifier'),
  isAnonymous: z.boolean().default(true),
  respondentName: z.string().trim().max(100).optional(),
  respondentEmail: z.string().trim().email('Invalid email address').optional(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question identifier'),
      textValue: z.string().max(MAX_TEXT_ANSWER_LENGTH).optional(),
      numberValue: z.number().optional(),
      booleanValue: z.boolean().optional(),
      jsonValue: z.any().optional(),
    })
  ).min(1, 'At least one question must be answered'),
});

export type CreateFeedbackFormInput = z.infer<typeof createFeedbackFormSchema>;
export type UpdateFeedbackFormInput = z.infer<typeof updateFeedbackFormSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type PublicFeedbackSubmissionInput = z.infer<typeof publicFeedbackSubmissionSchema>;
export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
