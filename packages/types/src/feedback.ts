/**
 * Feedback forms, questions, responses, and metrics domain models
 */

export type FeedbackAudience = 'CUSTOMER' | 'EMPLOYEE';

export type AnonymityMode = 'ANONYMOUS_ONLY' | 'IDENTIFIED_ONLY' | 'RESPONDENT_CHOICE';

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type QuestionType =
  | 'NPS'
  | 'CSAT'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'LIKERT_SCALE';

export type ResponseStatus = 'NEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';

export interface FormQuestionOption {
  id: string;
  label: string;
  value: string;
  orderIndex: number;
}

export interface FormQuestion {
  id: string;
  formId: string;
  questionType: QuestionType;
  title: string;
  helpText?: string | null;
  isRequired: boolean;
  orderIndex: number;
  options?: FormQuestionOption[];
}

export interface FeedbackFormSummary {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  description?: string | null;
  audienceType: FeedbackAudience;
  anonymityMode: AnonymityMode;
  status: FormStatus;
  publishedAt?: string | null;
  responseCount: number;
}
