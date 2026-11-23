/**
 * Feedback forms, questions, responses, and metrics domain models
 */

export type FeedbackAudience = 'CUSTOMER' | 'EMPLOYEE';

export type AnonymityMode = 'ANONYMOUS_ONLY' | 'IDENTIFIED_ONLY' | 'RESPONDENT_CHOICE';

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type QuestionType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'RATING'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'YES_NO'
  | 'NPS'
  | 'CSAT'
  | 'LIKERT_SCALE';

export type ResponseStatus = 'NEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';

export interface FormQuestionOption {
  id: string;
  questionId?: string;
  label: string;
  value: string;
  orderIndex: number;
  isActive?: boolean;
}

export interface QuestionValidationRules {
  minLength?: number;
  maxLength?: number;
  minRating?: number;
  maxRating?: number;
  maxSelect?: number;
}

export interface FormQuestion {
  id: string;
  formId?: string;
  questionType: QuestionType;
  title: string;
  helpText?: string | null;
  placeholder?: string | null;
  isRequired: boolean;
  orderIndex: number;
  validationRules?: QuestionValidationRules | null;
  options?: FormQuestionOption[];
  isActive?: boolean;
  version?: number;
}

export interface FeedbackForm {
  id: string;
  companyId: string;
  internalName?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  welcomeMessage?: string | null;
  thankYouMessage?: string | null;
  audienceType: FeedbackAudience;
  anonymityMode: AnonymityMode;
  status: FormStatus;
  allowMultipleSubmissions: boolean;
  themeSettings?: Record<string, unknown> | null;
  publishedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  questions?: FormQuestion[];
  responseCount?: number;
}

export interface FeedbackFormSummary {
  id: string;
  companyId: string;
  internalName?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  audienceType: FeedbackAudience;
  anonymityMode: AnonymityMode;
  status: FormStatus;
  publishedAt?: string | null;
  updatedAt: string;
  questionCount: number;
  responseCount: number;
}

export interface CreateFormQuestionDto {
  id?: string;
  questionType: QuestionType;
  title: string;
  helpText?: string | null;
  placeholder?: string | null;
  isRequired?: boolean;
  orderIndex?: number;
  validationRules?: QuestionValidationRules | null;
  isActive?: boolean;
  options?: Array<{
    id?: string;
    label: string;
    value: string;
    orderIndex?: number;
    isActive?: boolean;
  }>;
}

export interface CreateFeedbackFormDto {
  internalName?: string;
  title: string;
  slug?: string;
  description?: string;
  welcomeMessage?: string;
  thankYouMessage?: string;
  audienceType?: FeedbackAudience;
  anonymityMode?: AnonymityMode;
  allowMultipleSubmissions?: boolean;
  themeSettings?: Record<string, unknown>;
  questions?: CreateFormQuestionDto[];
}

export interface UpdateFeedbackFormDto {
  internalName?: string;
  title?: string;
  slug?: string;
  description?: string;
  welcomeMessage?: string;
  thankYouMessage?: string;
  audienceType?: FeedbackAudience;
  anonymityMode?: AnonymityMode;
  allowMultipleSubmissions?: boolean;
  themeSettings?: Record<string, unknown>;
  questions?: CreateFormQuestionDto[];
}

export interface PublicFormQuestionOption {
  id: string;
  label: string;
  value: string;
  orderIndex: number;
  isActive?: boolean;
}

export interface PublicFormQuestion {
  id: string;
  questionType: QuestionType;
  title: string;
  helpText?: string | null;
  placeholder?: string | null;
  isRequired: boolean;
  orderIndex: number;
  validationRules?: QuestionValidationRules | null;
  options?: PublicFormQuestionOption[];
  isActive?: boolean;
  version?: number;
}

export interface PublicFeedbackForm {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  welcomeMessage?: string | null;
  thankYouMessage?: string | null;
  audienceType: FeedbackAudience;
  anonymityMode: AnonymityMode;
  allowMultipleSubmissions?: boolean;
  companyName: string;
  companyLogoUrl?: string | null;
  brandColorHex: string;
  accentColorHex: string;
  questions: PublicFormQuestion[];
}

export interface PublicAnswerSubmission {
  questionId: string;
  questionTitle?: string;
  questionType?: string;
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  jsonValue?: string[] | unknown;
}

export interface PublicSubmissionDto {
  isAnonymous?: boolean;
  respondentName?: string;
  respondentEmail?: string;
  answers: PublicAnswerSubmission[];
}

export interface PublicSubmissionResult {
  success: boolean;
  submissionToken: string;
  submittedAt: string;
  message: string;
}
