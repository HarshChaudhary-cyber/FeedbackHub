# FeedbackHub REST API Documentation

This document describes the tenant-aware REST APIs powering the FeedbackHub platform.

---

## 1. General Principles

### Base URL & Versioning
All backend API routes are prefixed under:
```
/api/v1
```

### Authentication & Tenant Resolution
- **Authentication**: Stateful session cookie `feedhub_session` validated against `AuthSession` in PostgreSQL.
- **Tenant Context**: Resolved via `TenantResolutionGuard` and verified via `TenantMembershipGuard`. The caller's tenant (`companyId`) is resolved strictly server-side from subdomain, `x-company-slug` header, or the authenticated user's active company membership.
- **Role Enforcement**: Protected administrative and analytics endpoints enforce RBAC via `TenantRoleGuard` and `@RequireRoles('OWNER', 'ADMIN', 'MANAGER')`.
- **Transaction-Scoped PostgreSQL RLS**: Every tenant-protected database query executes inside `withTenantContext(companyId, undefined, async (tx) => { ... })`. This atomically sets PostgreSQL session configuration `app.current_tenant_id` for the duration of the transaction, ensuring full compliance with PostgreSQL Row-Level Security policies. Client-supplied query parameters are never trusted to override tenant ownership.

---

## 2. Analytics & Data Aggregation Endpoints (Phase 7.1)

Analytics endpoints are registered under both `/api/v1/analytics/*` and `/api/v1/tenant/analytics/*` for backwards-compatible routing conventions.

### Summary of Endpoints
| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/analytics/overview` | `OWNER`, `ADMIN`, `MANAGER` | High-level summary metrics, scale-isolated ratings, and prior period comparison |
| `GET` | `/analytics/trends` | `OWNER`, `ADMIN`, `MANAGER` | Time-series feedback submission volume and scale-aware rating trends |
| `GET` | `/analytics/ratings` | `OWNER`, `ADMIN`, `MANAGER` | Scale-aware rating aggregations, distributions, and question breakdowns |
| `GET` | `/analytics/questions` | `OWNER`, `ADMIN`, `MANAGER` | Deep question-level analytics for a specific form with historical snapshots |
| `GET` | `/analytics/forms` | `OWNER`, `ADMIN`, `MANAGER` | Paginated forms directory with database-level pagination and performance metrics |

---

### 2.1 GET /analytics/overview

Retrieves high-level performance metrics for the authenticated company, including total submission volume, date-filtered submission volume, published forms count, scale-aware average rating, and a comparative prior-period analysis.

#### Date Range & Window Semantics
- When both `startDate` and `endDate` are supplied, the exact window `[startDate, endDate]` is used.
- When only `startDate` is supplied, the window spans from `startDate` through the current time.
- When only `endDate` is supplied, a default 30-day window ending on `endDate` is used.
- When neither date is supplied, a default 30-day window ending now is used.
- Calendar dates are strictly validated: nonexistent calendar dates (e.g. `2023-02-29`, `2026-04-31`, `2026-13-01`) are rejected with `400 Bad Request`.
- End dates in `YYYY-MM-DD` format are inclusive through `23:59:59.999Z` in UTC.
- The `previousPeriod` is calculated with the **exact same effective duration** as the current period immediately preceding `startDate`.

#### Rating Scale Isolation Rules
- Ratings with incompatible scales (e.g. 1–5 stars and 0–10 NPS) are **never averaged together**.
- If exactly one rating scale is present among answers in the window, `averageRating` and `ratingScale` (`{ minRating, maxRating }`) are returned.
- If multiple incompatible scales exist, `averageRating` is `null` and `ratingScales` returns an array of per-scale breakdowns.
- `ratingResponsesCount` counts all valid ratings answered. Out-of-range, non-finite, or non-step numbers are discarded.

#### Query Parameters
- `startDate` *(optional, string)*: ISO-8601 start date (e.g. `2026-01-01`).
- `endDate` *(optional, string)*: ISO-8601 end date (e.g. `2026-01-31`).
- `formId` *(optional, UUID)*: Filter overview metrics strictly to a single form owned by the tenant.

#### Example Response (Single Scale)
```json
{
  "totalResponses": 1420,
  "filteredResponses": 250,
  "publishedFormsCount": 4,
  "averageRating": 4.65,
  "ratingResponsesCount": 210,
  "ratingScale": { "minRating": 1, "maxRating": 5 },
  "previousPeriod": {
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z",
    "responseCount": 200,
    "averageRating": 4.40,
    "responseChangePercentage": 25.0,
    "ratingChange": 0.25
  }
}
```

#### Example Response (Multiple Incompatible Scales)
```json
{
  "totalResponses": 1420,
  "filteredResponses": 250,
  "publishedFormsCount": 4,
  "averageRating": null,
  "ratingResponsesCount": 210,
  "ratingScale": null,
  "ratingScales": [
    {
      "minRating": 1,
      "maxRating": 5,
      "averageRating": 4.65,
      "count": 160,
      "distribution": [...]
    },
    {
      "minRating": 0,
      "maxRating": 10,
      "averageRating": 8.5,
      "count": 50,
      "distribution": [...]
    }
  ],
  "previousPeriod": {
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z",
    "responseCount": 200,
    "averageRating": null,
    "responseChangePercentage": 25.0,
    "ratingChange": null
  }
}
```

---

### 2.2 GET /analytics/trends

Returns continuous time-series buckets of feedback submission volume and average rating over the requested date range. Buckets are **guaranteed to be zero-filled**, ensuring graphs render continuous lines without gaps.

#### Monthly Bucket Rollover Safety
- Monthly intervals anchor cursors to day 1 UTC of each month before incrementing, preventing month skips when date ranges begin near month ends (e.g. January 31, March 30, leap years).
- Buckets with ratings on multiple scales return `averageRating: null` for that bucket to prevent conflating scales.

#### Query Parameters
- `startDate` *(optional, string)*: ISO-8601 start date.
- `endDate` *(optional, string)*: ISO-8601 end date.
- `interval` *(optional, enum)*: `'day'` (default, max 366 days), `'week'` (max 104 weeks), or `'month'` (max 60 months).
- `formId` *(optional, UUID)*: Filter trend metrics to a specific form.

#### Example Response
```json
{
  "interval": "day",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-05T23:59:59.999Z",
  "formId": null,
  "totalResponses": 15,
  "buckets": [
    { "date": "2026-01-01", "count": 4, "averageRating": 4.5 },
    { "date": "2026-01-02", "count": 0, "averageRating": null },
    { "date": "2026-01-03", "count": 6, "averageRating": 4.8 },
    { "date": "2026-01-04", "count": 2, "averageRating": 3.5 },
    { "date": "2026-01-05", "count": 3, "averageRating": 5.0 }
  ]
}
```

---

### 2.3 GET /analytics/ratings

Provides scale-aware rating aggregations. Because surveys may contain questions configured with different scales (e.g., 1–5 stars vs. 0–10 NPS), **ratings with incompatible scales are never averaged together**. The API groups ratings into isolated scale definitions and provides individual score distributions.

#### Multi-Scale Rules
- `overallAverage` is `null` if multiple scales exist across the dataset or if no ratings exist.
- `distribution` is empty `[]` if multiple scales exist or if no ratings exist. A default 1–5 distribution is never fabricated.
- Individual distributions are always available in the `scales` array.

#### Query Parameters
- `startDate` *(optional, string)*: ISO-8601 start date.
- `endDate` *(optional, string)*: ISO-8601 end date.
- `formId` *(optional, UUID)*: Filter ratings to a specific form.

#### Example Response
```json
{
  "overallAverage": null,
  "totalRatings": 350,
  "scales": [
    {
      "minRating": 1,
      "maxRating": 5,
      "averageRating": 4.65,
      "count": 300,
      "distribution": [
        { "rating": 1, "count": 5, "percentage": 1.67 },
        { "rating": 2, "count": 10, "percentage": 3.33 },
        { "rating": 3, "count": 25, "percentage": 8.33 },
        { "rating": 4, "count": 60, "percentage": 20.0 },
        { "rating": 5, "count": 200, "percentage": 66.67 }
      ]
    },
    {
      "minRating": 0,
      "maxRating": 10,
      "averageRating": 8.8,
      "count": 50,
      "distribution": [
        { "rating": 0, "count": 0, "percentage": 0.0 },
        { "rating": 10, "count": 25, "percentage": 50.0 }
      ]
    }
  ],
  "byQuestion": [
    {
      "questionId": "e0000002-1111-2222-3333-444455556666",
      "questionTitle": "Overall product satisfaction",
      "formId": "a0000001-1111-2222-3333-444455556666",
      "formTitle": "Customer Satisfaction Survey",
      "scale": { "minRating": 1, "maxRating": 5 },
      "averageRating": 4.65,
      "count": 300,
      "distribution": [
        { "rating": 5, "count": 200, "percentage": 66.67 }
      ]
    }
  ],
  "distribution": []
}
```

---

### 2.4 GET /analytics/questions

Provides deep, type-specific analytical metrics across all 6 question types supported by FeedbackHub.

#### Historical Snapshots & Respondent-Based Percentages
1. **Respondent Denominator**: Percentages are calculated based on **distinct respondents who actually answered the question**, not raw answer records. Duplicate answer rows for the same response are deduplicated.
2. **Multiple-Choice Percentages**: Calculated as `distinctRespondentsWhoSelectedOption / answeredRespondents * 100`. The sum can legitimately exceed 100%.
3. **Historical Option Preservation**: Uses `selectedOptionLabel`, `selectedOptionValue`, and `selectedOptions` JSON snapshots. If options or question titles were renamed or removed after submission, historical labels are preserved in `historicalLabels` and historical titles in `historicalTitles`. Removed options remain present in analytics with their historical selection counts.
4. **Privacy Protection**: Open-ended text metrics provide `textAnswersCount` and `averageLength` without leaking raw respondent text or PII.

#### Query Parameters
- `formId` *(REQUIRED, UUID)*: The unique identifier of the form. Returns `404 Not Found` if form does not belong to tenant.
- `startDate` *(optional, string)*: ISO-8601 start date.
- `endDate` *(optional, string)*: ISO-8601 end date.

#### Example Response
```json
{
  "formId": "a0000001-1111-2222-3333-444455556666",
  "formTitle": "Customer Satisfaction Survey",
  "totalResponses": 100,
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T23:59:59.999Z",
  "questions": [
    {
      "questionId": "e0000001-1111-2222-3333-444455556666",
      "questionTitle": "What did you like most?",
      "questionType": "SHORT_TEXT",
      "isRequired": true,
      "orderIndex": 0,
      "totalAnswers": 92,
      "responseRate": 92.0,
      "textMetrics": {
        "textAnswersCount": 92,
        "averageLength": 45.8
      }
    },
    {
      "questionId": "e0000002-1111-2222-3333-444455556666",
      "questionTitle": "Overall satisfaction",
      "historicalTitles": ["Legacy Question Title V1"],
      "questionType": "RATING",
      "isRequired": true,
      "orderIndex": 1,
      "totalAnswers": 98,
      "responseRate": 98.0,
      "ratingMetrics": {
        "averageRating": 4.7,
        "scale": { "minRating": 1, "maxRating": 5 },
        "distribution": [
          { "rating": 5, "count": 75, "percentage": 76.53 }
        ]
      }
    },
    {
      "questionId": "e0000003-1111-2222-3333-444455556666",
      "questionTitle": "Favorite theme color",
      "questionType": "SINGLE_CHOICE",
      "isRequired": false,
      "orderIndex": 2,
      "totalAnswers": 80,
      "responseRate": 80.0,
      "choiceMetrics": {
        "options": [
          {
            "label": "Purple",
            "value": "purple",
            "count": 50,
            "percentage": 62.5,
            "historicalLabels": ["Deep Purple"]
          },
          { "label": "Blue", "value": "blue", "count": 30, "percentage": 37.5 },
          { "label": "Green", "value": "green", "count": 0, "percentage": 0.0 }
        ]
      }
    },
    {
      "questionId": "e0000004-1111-2222-3333-444455556666",
      "questionTitle": "Which features do you use?",
      "questionType": "MULTIPLE_CHOICE",
      "isRequired": false,
      "orderIndex": 3,
      "totalAnswers": 80,
      "responseRate": 80.0,
      "choiceMetrics": {
        "options": [
          { "label": "Feature A", "value": "feat_a", "count": 60, "percentage": 75.0 },
          { "label": "Feature B", "value": "feat_b", "count": 40, "percentage": 50.0 },
          { "label": "Removed Feature X", "value": "feat_x", "count": 20, "percentage": 25.0 }
        ]
      }
    },
    {
      "questionId": "e0000005-1111-2222-3333-444455556666",
      "questionTitle": "Would you recommend us to a friend?",
      "questionType": "YES_NO",
      "isRequired": true,
      "orderIndex": 4,
      "totalAnswers": 95,
      "responseRate": 95.0,
      "yesNoMetrics": {
        "yesCount": 90,
        "noCount": 5,
        "yesPercentage": 94.74,
        "noPercentage": 5.26
      }
    }
  ]
}
```

---

### 2.5 GET /analytics/forms

Lists company forms accompanied by response counts, latest response timestamp, and average ratings with database-level pagination and deterministic sorting.

#### Database-Level Pagination & Scale Rules
- When sorting by native database fields (`createdAt`, `publishedAt`, `title`), pagination (`skip`, `take`, `orderBy`) is applied directly at the database level, and response metrics are computed only for the forms on the active page.
- A secondary sort tie-breaker (`id: asc`) guarantees deterministic order across pages.
- Forms with questions on multiple different scales return `averageRating: null` and `ratingScale: null` to prevent scale conflation.

#### Query Parameters
- `page` *(optional, integer)*: 1-based page number (default: `1`).
- `limit` *(optional, integer)*: Items per page (default: `10`, max: `100`).
- `sortBy` *(optional, enum)*: `'title'`, `'responseCount'`, `'latestResponseAt'`, `'createdAt'`, `'publishedAt'` (default: `'createdAt'`).
- `sortOrder` *(optional, enum)*: `'asc'` or `'desc'` (default: `'desc'`).
- `status` *(optional, enum)*: Filter by `'DRAFT'`, `'PUBLISHED'`, or `'ARCHIVED'`.
- `search` *(optional, string)*: Search keyword matching form title or internal name.
- `startDate` *(optional, string)*: ISO-8601 start date for metric aggregation.
- `endDate` *(optional, string)*: ISO-8601 end date for metric aggregation.

#### Example Response
```json
{
  "forms": [
    {
      "formId": "a0000001-1111-2222-3333-444455556666",
      "title": "Customer Satisfaction Survey",
      "slug": "acme-csat",
      "status": "PUBLISHED",
      "audienceType": "CUSTOMER",
      "anonymityMode": "ANONYMOUS_ONLY",
      "publishedAt": "2026-01-01T00:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "responseCount": 125,
      "latestResponseAt": "2026-01-20T14:32:10.000Z",
      "averageRating": 4.65,
      "ratingScale": { "minRating": 1, "maxRating": 5 }
    }
  ],
  "pagination": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 10
  }
}
```

---

## 3. Security & Multi-Tenancy Architecture

All analytics endpoints implement strict tenant containment:
1. **PostgreSQL RLS Transaction Scope**: Every query runs inside `withTenantContext`, setting `app.current_tenant_id` for PostgreSQL connection pooling safety.
2. **Zero Tenant Leakage**: Attempting to query `formId` belonging to another tenant immediately throws `404 Not Found` with identical messaging to non-existent forms, preventing tenant enumeration attacks.
3. **Deterministic Aggregation**: All sorting and aggregation algorithms apply secondary deterministic sort criteria (e.g. `formId` tie-breakers) to ensure stable paginated results.
4. **No Raw PII in Summaries**: Question text analytics compute aggregate counts and character lengths without returning respondent email addresses, names, or raw open-ended text.
