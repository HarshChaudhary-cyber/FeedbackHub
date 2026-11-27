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
- **Tenant Isolation**: All database queries enforce strict tenant partitioning (`WHERE companyId = :tenantCompanyId`). Client-supplied query parameters are never trusted to override tenant ownership.

---

## 2. Analytics & Data Aggregation Endpoints (Phase 7.1)

Analytics endpoints are registered under both `/api/v1/analytics/*` and `/api/v1/tenant/analytics/*` for backwards-compatible routing conventions.

### Summary of Endpoints
| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/analytics/overview` | `OWNER`, `ADMIN`, `MANAGER` | High-level summary metrics, ratings, and prior period comparison |
| `GET` | `/analytics/trends` | `OWNER`, `ADMIN`, `MANAGER` | Time-series feedback submission volume and rating trends |
| `GET` | `/analytics/ratings` | `OWNER`, `ADMIN`, `MANAGER` | Scale-aware rating aggregations, distributions, and question breakdowns |
| `GET` | `/analytics/questions` | `OWNER`, `ADMIN`, `MANAGER` | Deep question-level analytics for a specific form |
| `GET` | `/analytics/forms` | `OWNER`, `ADMIN`, `MANAGER` | Paginated forms directory with aggregated performance metrics |

---

### 2.1 GET /analytics/overview

Retrieves high-level performance metrics for the authenticated company, including total submission volume, date-filtered submission volume, published forms count, average rating, and a comparative prior-period analysis.

#### Query Parameters
- `startDate` *(optional, string)*: ISO-8601 start date (e.g. `2026-01-01`).
- `endDate` *(optional, string)*: ISO-8601 end date (e.g. `2026-01-31`). Normalized to `23:59:59.999Z` if date-only format is provided.
- `formId` *(optional, UUID)*: Filter overview metrics strictly to a single form owned by the tenant.

#### Example Response
```json
{
  "totalResponses": 1420,
  "filteredResponses": 250,
  "publishedFormsCount": 4,
  "averageRating": 4.65,
  "ratingResponsesCount": 210,
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

---

### 2.2 GET /analytics/trends

Returns continuous time-series buckets of feedback submission volume and average rating over the requested date range. Buckets are **guaranteed to be zero-filled**, ensuring graphs render continuous lines without gaps.

#### Query Parameters
- `startDate` *(optional, string)*: ISO-8601 start date (defaults to 30 days prior to `endDate`).
- `endDate` *(optional, string)*: ISO-8601 end date (defaults to current timestamp).
- `interval` *(optional, enum)*: `'day'` (default), `'week'`, or `'month'`.
  - Max date window for `'day'`: 366 days.
  - Max date window for `'week'`: 104 weeks.
  - Max date window for `'month'`: 60 months.
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

#### Query Parameters
- `startDate` *(optional, string)*: ISO-8601 start date.
- `endDate` *(optional, string)*: ISO-8601 end date.
- `formId` *(optional, UUID)*: Filter ratings to a specific form.

#### Example Response
```json
{
  "overallAverage": 4.65,
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
  "distribution": [
    { "rating": 1, "count": 5, "percentage": 1.67 },
    { "rating": 5, "count": 200, "percentage": 66.67 }
  ]
}
```

---

### 2.4 GET /analytics/questions

Provides deep, type-specific analytical metrics across all 6 question types supported by FeedbackHub. Utilizes historical choice snapshots to preserve accuracy even when form options or question definitions are subsequently modified.

#### Query Parameters
- `formId` *(REQUIRED, UUID)*: The unique identifier of the form. Returns `404 Not Found` if form does not belong to tenant.
- `startDate` *(optional, string)*: ISO-8601 start date.
- `endDate` *(optional, string)*: ISO-8601 end date.

#### Supported Question Types & Metrics
1. **SHORT_TEXT / LONG_TEXT**:
   - `textAnswersCount`: Total responses with non-empty text.
   - `averageLength`: Average character length of answers.
   - *Privacy protection*: Raw text and respondent PII are omitted from aggregated analytics.
2. **RATING**:
   - `averageRating`: Mean rating for this question.
   - `scale`: Min and max scale bounds.
   - `distribution`: Count and percentage for each rating point.
3. **SINGLE_CHOICE**:
   - `options`: Array of option breakdowns (`label`, `value`, `count`, `percentage`).
   - Uses historical snapshots (`selectedOptionLabel`, `selectedOptionValue`).
   - Includes unselected options with `0` count.
4. **MULTIPLE_CHOICE**:
   - `options`: Array of option breakdowns (`label`, `value`, `count`, `percentage`).
   - Interprets `selectedOptions` JSON snapshots.
   - Percentage represents respondent share (`count / totalAnswers * 100`).
5. **YES_NO**:
   - `yesCount`, `noCount`, `yesPercentage`, `noPercentage`.
6. **CSAT / NPS / LIKERT_SCALE**:
   - Handled cleanly with scale-aware rating metrics.

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
          { "label": "Purple", "value": "purple", "count": 50, "percentage": 62.5 },
          { "label": "Blue", "value": "blue", "count": 30, "percentage": 37.5 },
          { "label": "Green", "value": "green", "count": 0, "percentage": 0.0 }
        ]
      }
    },
    {
      "questionId": "e0000005-1111-2222-3333-444455556666",
      "questionTitle": "Would you recommend us to a friend?",
      "questionType": "YES_NO",
      "isRequired": true,
      "orderIndex": 3,
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

Lists company forms accompanied by response counts, latest response timestamp, and average ratings with deterministic pagination and multi-field sorting.

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
      "averageRating": 4.65
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
1. **Zero Tenant Leakage**: Attempting to query `formId` belonging to another tenant immediately throws `404 Not Found` with identical messaging to non-existent forms, preventing tenant enumeration attacks.
2. **Deterministic Aggregation**: All sorting and aggregation algorithms apply secondary deterministic sort criteria (e.g. `formId` tie-breakers) to ensure stable paginated results.
3. **No Raw PII in Summaries**: Question text analytics compute aggregate counts and character lengths without returning respondent email addresses, names, or raw open-ended text.
