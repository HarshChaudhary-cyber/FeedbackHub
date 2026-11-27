import type { FormStatus, FeedbackAudience, AnonymityMode, QuestionType } from './feedback';

export type TrendInterval = 'day' | 'week' | 'month';

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsOverviewQuery extends DateRangeFilter {
  formId?: string;
}

export interface PreviousPeriodSummary {
  startDate: string;
  endDate: string;
  responseCount: number;
  averageRating: number | null;
  responseChangePercentage: number | null;
  ratingChange: number | null;
}

export interface AnalyticsOverviewResponse {
  totalResponses: number;
  filteredResponses: number;
  publishedFormsCount: number;
  averageRating: number | null;
  ratingResponsesCount: number;
  previousPeriod: PreviousPeriodSummary;
}

export interface AnalyticsTrendsQuery extends DateRangeFilter {
  interval?: TrendInterval;
  formId?: string;
}

export interface TrendBucket {
  date: string;
  count: number;
  averageRating: number | null;
}

export interface AnalyticsTrendsResponse {
  interval: TrendInterval;
  startDate: string;
  endDate: string;
  formId: string | null;
  buckets: TrendBucket[];
  totalResponses: number;
}

export interface AnalyticsRatingsQuery extends DateRangeFilter {
  formId?: string;
}

export interface RatingScoreDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface RatingScaleBreakdown {
  minRating: number;
  maxRating: number;
  averageRating: number;
  count: number;
  distribution: RatingScoreDistribution[];
}

export interface RatingQuestionBreakdown {
  questionId: string;
  questionTitle: string;
  formId: string;
  formTitle: string;
  scale: {
    minRating: number;
    maxRating: number;
  };
  averageRating: number;
  count: number;
  distribution: RatingScoreDistribution[];
}

export interface AnalyticsRatingsResponse {
  overallAverage: number | null;
  totalRatings: number;
  scales: RatingScaleBreakdown[];
  byQuestion: RatingQuestionBreakdown[];
  distribution: RatingScoreDistribution[];
}

export interface AnalyticsQuestionsQuery extends DateRangeFilter {
  formId: string;
}

export interface ChoiceOptionAnalytics {
  label: string;
  value: string;
  count: number;
  percentage: number;
}

export interface TextQuestionMetrics {
  textAnswersCount: number;
  averageLength: number;
}

export interface RatingQuestionMetrics {
  averageRating: number;
  scale: {
    minRating: number;
    maxRating: number;
  };
  distribution: RatingScoreDistribution[];
}

export interface ChoiceQuestionMetrics {
  options: ChoiceOptionAnalytics[];
}

export interface YesNoQuestionMetrics {
  yesCount: number;
  noCount: number;
  yesPercentage: number;
  noPercentage: number;
}

export interface QuestionAnalyticsItem {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  isRequired: boolean;
  orderIndex: number;
  totalAnswers: number;
  responseRate: number;
  textMetrics?: TextQuestionMetrics;
  ratingMetrics?: RatingQuestionMetrics;
  choiceMetrics?: ChoiceQuestionMetrics;
  yesNoMetrics?: YesNoQuestionMetrics;
}

export interface AnalyticsQuestionsResponse {
  formId: string;
  formTitle: string;
  totalResponses: number;
  startDate: string | null;
  endDate: string | null;
  questions: QuestionAnalyticsItem[];
}

export type AnalyticsFormsSortBy =
  | 'title'
  | 'responseCount'
  | 'latestResponseAt'
  | 'createdAt'
  | 'publishedAt';

export type SortOrder = 'asc' | 'desc';

export interface AnalyticsFormsQuery extends DateRangeFilter {
  page?: number;
  limit?: number;
  sortBy?: AnalyticsFormsSortBy;
  sortOrder?: SortOrder;
  status?: FormStatus;
  search?: string;
}

export interface FormAnalyticsSummary {
  formId: string;
  title: string;
  slug: string;
  status: FormStatus;
  audienceType: FeedbackAudience;
  anonymityMode: AnonymityMode;
  publishedAt: string | null;
  createdAt: string;
  responseCount: number;
  latestResponseAt: string | null;
  averageRating: number | null;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface AnalyticsFormsResponse {
  forms: FormAnalyticsSummary[];
  pagination: PaginationMeta;
}
