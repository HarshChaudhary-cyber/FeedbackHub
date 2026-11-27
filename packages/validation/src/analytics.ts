import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export const dateStringSchema = z
  .string()
  .trim()
  .refine((val) => isoDateRegex.test(val) && !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Expected ISO-8601 string (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
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
