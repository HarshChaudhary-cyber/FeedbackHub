import { z } from 'zod';

export const feedbackSubmissionSchema = z.object({
  formId: z.string().uuid('Invalid form identifier'),
  isAnonymous: z.boolean().default(true),
  respondentName: z.string().trim().max(100).optional(),
  respondentEmail: z.string().trim().email('Invalid email address').optional(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question identifier'),
      textValue: z.string().max(5000).optional(),
      numberValue: z.number().optional(),
      booleanValue: z.boolean().optional(),
      jsonValue: z.any().optional(),
    })
  ).min(1, 'At least one question must be answered'),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
