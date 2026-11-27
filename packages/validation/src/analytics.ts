import { z } from 'zod';

/**
 * Validates that an ISO string represents a strictly valid calendar date.
 * Rejects nonexistent dates like 2023-02-29, 2026-04-31, 2026-13-01, etc.,
 * which JavaScript Date.parse() otherwise silently normalizes.
 */
export function isValidIsoCalendarDate(val: string): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:?(?:\d{2})?))?$/
  );
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (day > daysInMonths[month - 1]) return false;

  if (match[4] !== undefined) {
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = parseInt(match[6], 10);
    if (hours < 0 || hours > 23) return false;
    if (minutes < 0 || minutes > 59) return false;
    if (seconds < 0 || seconds > 59) return false;

    const tz = match[8];
    if (tz && tz !== 'Z') {
      const tzMatch = tz.match(/^([+-])(\d{2}):?(\d{2})?$/);
      if (!tzMatch) return false;
      const tzHours = parseInt(tzMatch[2], 10);
      const tzMinutes = parseInt(tzMatch[3] || '0', 10);
      if (tzHours < 0 || tzHours > 23) return false;
      if (tzMinutes < 0 || tzMinutes > 59) return false;
    }
  }

  const parsedTime = Date.parse(trimmed);
  return !isNaN(parsedTime);
}

export const dateStringSchema = z
  .string()
  .trim()
  .refine(isValidIsoCalendarDate, {
    message:
      'Invalid date format or impossible calendar date. Expected valid ISO-8601 string (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
  });

export const dateRangeSchema = z
  .object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  );

export const analyticsOverviewQuerySchema = z
  .object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    formId: z.string().uuid('Invalid form UUID').optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  );

export const trendIntervalSchema = z.enum(['day', 'week', 'month']);

export const analyticsTrendsQuerySchema = z
  .object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    interval: trendIntervalSchema.default('day'),
    formId: z.string().uuid('Invalid form UUID').optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const diffMs = new Date(data.endDate).getTime() - new Date(data.startDate).getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (data.interval === 'day' && diffDays > 366) {
          return false;
        }
        if (data.interval === 'week' && diffDays > 735) {
          return false;
        }
        if (data.interval === 'month' && diffDays > 1835) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Requested date range exceeds the maximum allowed window for the selected interval',
      path: ['endDate'],
    }
  );

export const analyticsRatingsQuerySchema = z
  .object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    formId: z.string().uuid('Invalid form UUID').optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  );

export const analyticsQuestionsQuerySchema = z
  .object({
    formId: z.string().uuid('formId must be a valid UUID'),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  );

export const analyticsFormsSortBySchema = z.enum([
  'title',
  'responseCount',
  'latestResponseAt',
  'createdAt',
  'publishedAt',
]);

export const sortOrderSchema = z.enum(['asc', 'desc']);

export const analyticsFormsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: analyticsFormsSortBySchema.default('createdAt'),
    sortOrder: sortOrderSchema.default('desc'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    search: z.string().trim().max(100).optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  );
