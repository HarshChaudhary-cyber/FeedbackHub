# FeedbackHub — Database Architecture & Schema Design

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**Engine:** PostgreSQL 16+  
**ORM:** Prisma ORM with versioned SQL migrations  

---

## 1. Database Multi-Tenancy Strategy

FeedbackHub implements a **Shared Database with Discriminator Column (`companyId`)** approach, reinforced by **PostgreSQL Row-Level Security (RLS)**.

### 1.1 Strategy Evaluation & Decision
| Approach | Isolation Level | Operational Overhead | Resource Efficiency | Selected? |
| :--- | :--- | :--- | :--- | :--- |
| **Database-per-Tenant** | Highest | Extremely High (1000s of DB connections & migrations) | Very Poor | No |
| **Schema-per-Tenant** | High | High (DDL migrations across thousands of schemas) | Moderate | No |
| **Shared DB + Discriminator (`companyId`) + RLS** | High (Virtual Isolation) | Low (Single migration pipeline, pooled connections) | Optimal | **YES** |

### 1.2 Tenant-Owned Entities vs Global Entities
- **Global Entities** (No `companyId`):
  - `PlatformUser`: Central identity account (one user can belong to multiple companies or be a system super admin).
  - `Permission`: Global master catalog of granular system permissions.
  - `AuditLog` (system-level events): Platform audit trail entries.
- **Tenant-Owned Entities** (Strictly scoped with non-nullable `companyId` foreign key):
  - `Company` (The tenant anchor itself)
  - `CompanyMembership`
  - `Role` (Custom or tenant-cloned roles)
  - `FeedbackForm`
  - `FormQuestion`
  - `FeedbackResponse`
  - `FeedbackAnswer`
  - `Subscription`
  - `AuditLog` (tenant-scoped operations)

---

## 2. Entity-Relationship Model (ERD)

```mermaid
erDiagram
    PlatformUser ||--o{ CompanyMembership : "holds"
    PlatformUser ||--o{ CompanyInvitation : "invites"
    PlatformUser ||--o{ AuditLog : "initiates"
    PlatformUser ||--o{ FeedbackResponse : "submits (identified only)"

    Company ||--o{ CompanyMembership : "employs"
    Company ||--o{ CompanyInvitation : "issues"
    Company ||--o| Subscription : "subscribes"
    Company ||--o{ Role : "defines"
    Company ||--o{ FeedbackForm : "owns"
    Company ||--o{ FeedbackResponse : "receives"
    Company ||--o{ AuditLog : "records"

    Role ||--o{ CompanyMembership : "assigned to"
    Role ||--o{ RolePermission : "contains"
    Permission ||--o{ RolePermission : "granted to"

    FeedbackForm ||--o{ FormQuestion : "contains"
    FeedbackForm ||--o{ FeedbackResponse : "collects"

    FormQuestion ||--o{ FormQuestionOption : "has choices"
    FormQuestion ||--o{ FeedbackAnswer : "answered by"

    FeedbackResponse ||--o{ FeedbackAnswer : "contains"

    PlatformUser {
        uuid id PK
        string email UK
        string passwordHash
        string fullName
        string avatarUrl
        boolean isSuperAdmin
        boolean isEmailVerified
        timestamp createdAt
        timestamp updatedAt
    }

    Company {
        uuid id PK
        string name
        string slug UK
        string customDomain UK
        string logoUrl
        string brandColorHex
        string accentColorHex
        jsonb settings
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }

    CompanyMembership {
        uuid id PK
        uuid companyId FK
        uuid userId FK
        uuid roleId FK
        string jobTitle
        string department
        string status
        timestamp joinedAt
        timestamp createdAt
        timestamp updatedAt
    }

    CompanyInvitation {
        uuid id PK
        uuid companyId FK
        uuid invitedByUserId FK
        string email
        string role "OWNER | ADMIN | MANAGER"
        string tokenHash UK
        string status "PENDING | ACCEPTED | REVOKED | EXPIRED"
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }

    Role {
        uuid id PK
        uuid companyId FK "Nullable for system default roles"
        string name
        string description
        boolean isSystemDefault
        timestamp createdAt
        timestamp updatedAt
    }

    Permission {
        uuid id PK
        string code UK "e.g. form:create, response:read"
        string module
        string description
    }

    RolePermission {
        uuid roleId FK
        uuid permissionId FK
    }

    FeedbackForm {
        uuid id PK
        uuid companyId FK
        string title
        string slug
        string description
        string audienceType "CUSTOMER | EMPLOYEE"
        string anonymityMode "ANONYMOUS_ONLY | IDENTIFIED_ONLY | RESPONDENT_CHOICE"
        string status "DRAFT | PUBLISHED | ARCHIVED"
        boolean allowMultipleSubmissions
        jsonb themeSettings
        timestamp publishedAt
        timestamp closedAt
        timestamp createdAt
        timestamp updatedAt
    }

    FormQuestion {
        uuid id PK
        uuid formId FK
        string questionType "NPS | CSAT | TEXT | CHOICE | SCALE"
        string title
        string helpText
        boolean isRequired
        integer orderIndex
        jsonb validationRules
        jsonb branchingLogic
        timestamp createdAt
        timestamp updatedAt
    }

    FormQuestionOption {
        uuid id PK
        uuid questionId FK
        string label
        string value
        integer orderIndex
    }

    FeedbackResponse {
        uuid id PK
        uuid companyId FK
        uuid formId FK
        uuid respondentUserId FK "NULL if anonymous submission"
        string submissionToken UK "Cryptographic submission identifier"
        boolean isAnonymous
        string respondentEmail "NULL if anonymous"
        string respondentName "NULL if anonymous"
        string status "NEW | IN_REVIEW | IN_PROGRESS | RESOLVED | ARCHIVED"
        float sentimentScore
        jsonb tags
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
    }

    FeedbackAnswer {
        uuid id PK
        uuid responseId FK
        uuid questionId FK
        text textValue
        float numberValue
        boolean booleanValue
        jsonb jsonValue
        timestamp createdAt
    }

    Subscription {
        uuid id PK
        uuid companyId FK UK
        string planTier "FREE | PRO | ENTERPRISE"
        string status "ACTIVE | TRIALING | PAST_DUE | CANCELED"
        string razorpayCustomerId
        string razorpaySubscriptionId
        integer monthlyResponseQuota
        integer seatQuota
        timestamp currentPeriodStart
        timestamp currentPeriodEnd
        timestamp canceledAt
        timestamp createdAt
        timestamp updatedAt
    }

    AuditLog {
        uuid id PK
        uuid companyId FK "NULL for platform-level actions"
        uuid actorUserId FK "NULL for system actions"
        string action "e.g. form.publish, user.invite, response.delete"
        string resourceType
        string resourceId
        jsonb previousState
        jsonb newState
        string ipAddress
        string userAgent
        timestamp createdAt
    }
```

---

## 3. Anonymous Feedback Architecture & Privacy Safeguards

The platform guarantees authentic privacy for anonymous submissions through **structural separation** and **cryptographic decoupling**.

### 3.1 Strict Data Decoupling
When a response is submitted to an anonymous form:
1. `respondentUserId` is set to `NULL`.
2. `respondentEmail` and `respondentName` are set to `NULL`.
3. **Zero IP & Zero User-Agent Retention**: Neither IP addresses nor raw browser User-Agent strings are stored on the `FeedbackResponse` or `FeedbackAnswer` records.
4. **Submission Token**: An opaque, cryptographically random token (`nanoid` or UUIDv4) is returned to the submitter as a receipt for status checks without linking to an identity.
5. **Independent Audit Log Exclusion**: Security audit logs record that a form submission occurred, but explicitly do **not** record cross-referencing timestamps down to the millisecond that could be correlated with web server access logs.

### 3.2 Employee Feedback K-Anonymity Threshold
To prevent employee identification through small-group demographic segmentation:
- When viewing analytics grouped by `department`, `jobTitle`, or other cohorts, the backend enforces a **minimum threshold rule ($k \ge 5$)**.
- If a cohort has fewer than 5 respondents, responses and sentiment are suppressed from segmented reports and only rolled into company-wide aggregates.

---

## 4. Indexing, Performance & Constraint Strategy

### 4.1 Indexing Matrix
```sql
-- Fast subdomain tenant resolution
CREATE UNIQUE INDEX idx_company_slug ON "Company" (slug);
CREATE UNIQUE INDEX idx_company_custom_domain ON "Company" (customDomain) WHERE customDomain IS NOT NULL;

-- High-performance tenant queries
CREATE INDEX idx_company_membership_user ON "CompanyMembership" (userId);
CREATE INDEX idx_company_membership_company ON "CompanyMembership" (companyId);
CREATE UNIQUE INDEX idx_company_membership_unique ON "CompanyMembership" (companyId, userId);

-- Company invitation lookups and token validation
CREATE UNIQUE INDEX idx_company_invitation_token_hash ON "CompanyInvitation" (tokenHash);
CREATE INDEX idx_company_invitation_company ON "CompanyInvitation" (companyId);
CREATE INDEX idx_company_invitation_email ON "CompanyInvitation" (email);
CREATE INDEX idx_company_invitation_status ON "CompanyInvitation" (status);

-- Form lookups by company and slug
CREATE INDEX idx_feedback_form_company_slug ON "FeedbackForm" (companyId, slug);
CREATE INDEX idx_feedback_form_status ON "FeedbackForm" (companyId, status);

-- Response lookups and time-series aggregation
CREATE INDEX idx_feedback_response_company_form ON "FeedbackResponse" (companyId, formId);
CREATE INDEX idx_feedback_response_submitted_at ON "FeedbackResponse" (companyId, submittedAt DESC);
CREATE INDEX idx_feedback_response_status ON "FeedbackResponse" (companyId, status);

-- Answer lookups
CREATE INDEX idx_feedback_answer_response ON "FeedbackAnswer" (responseId);
CREATE INDEX idx_feedback_answer_question ON "FeedbackAnswer" (questionId);

-- Audit log filtering
CREATE INDEX idx_audit_log_company_created ON "AuditLog" (companyId, createdAt DESC);
```

### 4.2 Cascading Deletion & Soft Deletes
- **Hard Deletes with Cascade**: Deleting a `FeedbackForm` cascades to its `FormQuestion` and `FormQuestionOption` records.
- **Tombstoning / Soft Deletes**: Responses and critical company data leverage an archived/soft-delete flag (`status = 'ARCHIVED'` or `isArchived: true`) to safeguard audit trails and prevent accidental data loss.

---

## 5. PostgreSQL Row-Level Security (RLS) Reference

As a secondary layer of defense behind application-level scoping, PostgreSQL RLS is enabled on tenant tables:

### 5.1 Enforcing RLS with Table Owner Protection
By default, PostgreSQL bypasses RLS for the table owner role. To prevent accidental bypass by database administrators or service connections owning the schema:
```sql
-- Enable and FORCE Row-Level Security on all tenant-owned tables
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CompanyMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyMembership" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CompanyInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyInvitation" FORCE ROW LEVEL SECURITY;
```

### 5.2 Transaction-Local Setting for Connection Poolers
When using connection pooling (PgBouncer, AWS RDS Proxy), database sessions are reused across requests. Standard `SET` statements leak state to subsequent connection checkouts.

FeedbackHub sets session variables strictly with transaction scope:
```sql
SELECT set_config('app.current_tenant_id', '<company-uuid>', true);
SELECT set_config('app.current_user_id', '<user-uuid>', true);
SELECT set_config('app.invitation_token_hash', '<sha256-hash>', true);
```
Passing `true` as the third parameter (`is_local`) guarantees the setting is automatically cleared upon transaction `COMMIT` or `ROLLBACK`.

### 5.3 Tenant Isolation Policies (Without Bypass GUCs)
```sql
-- 1. Company Table: Public active lookup for resolution, tenant-scoped mutations
CREATE POLICY company_select_policy ON "Company"
    FOR SELECT USING (
        (current_setting('app.current_tenant_id', true) IS NOT NULL AND "id" = current_setting('app.current_tenant_id', true)::uuid)
        OR ("isActive" = true AND "status" = 'ACTIVE')
    );

CREATE POLICY company_update_policy ON "Company"
    FOR UPDATE USING ("id" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY company_delete_policy ON "Company"
    FOR DELETE USING ("id" = current_setting('app.current_tenant_id', true)::uuid);

-- 2. CompanyMembership Table: Tenant context or platform user listing
CREATE POLICY tenant_membership_isolation ON "CompanyMembership"
    FOR ALL USING (
        (current_setting('app.current_tenant_id', true) IS NOT NULL AND "companyId" = current_setting('app.current_tenant_id', true)::uuid)
        OR (current_setting('app.current_tenant_id', true) IS NULL AND "userId" = current_setting('app.current_user_id', true)::uuid)
    )
    WITH CHECK (
        (current_setting('app.current_tenant_id', true) IS NOT NULL AND "companyId" = current_setting('app.current_tenant_id', true)::uuid)
        OR (current_setting('app.current_tenant_id', true) IS NULL AND "userId" = current_setting('app.current_user_id', true)::uuid)
    );

-- 3. CompanyInvitation Table: Tenant context or token hash pre-membership lookup
CREATE POLICY tenant_invitation_isolation ON "CompanyInvitation"
    FOR ALL USING (
        (current_setting('app.current_tenant_id', true) IS NOT NULL AND "companyId" = current_setting('app.current_tenant_id', true)::uuid)
        OR (current_setting('app.invitation_token_hash', true) IS NOT NULL AND "tokenHash" = current_setting('app.invitation_token_hash', true))
    )
    WITH CHECK (
        (current_setting('app.current_tenant_id', true) IS NOT NULL AND "companyId" = current_setting('app.current_tenant_id', true)::uuid)
        OR (current_setting('app.invitation_token_hash', true) IS NOT NULL AND "tokenHash" = current_setting('app.invitation_token_hash', true))
    );
```

### 5.4 Application-Level Integration (`PrismaService`)
`PrismaService` provides dedicated transaction helpers to wrap operations inside isolated transactions:
- `withTenantContext(tenantId, userId, tx => ...)`: Used for all tenant routes and membership operations.
- `withInvitationTokenContext(tokenHash, userId, tx => ...)`: Used for secure pre-membership invitation acceptance.
- `withUserContext(userId, tx => ...)`: Used for platform-level user company listings.
- `setTransactionTenantContext(tx, tenantId, userId)`: Used to transition transactions into tenant context during company creation and invitation acceptance.
```typescript
await prisma.withTenantContext(companyId, userId, async (tx) => {
  return tx.companyMembership.findMany();
});
```
This guarantees that queries cannot cross tenant boundaries even in the unlikely event of an application logic bug.

---

## 6. Feedback Forms & Responses RLS Policies (Phase 6)

In Phase 6, PostgreSQL Row-Level Security is enabled and enforced across all form builder and response collection tables:

### 6.1 `FeedbackForm`
- **SELECT**: Accessible if `companyId = current_setting('app.current_tenant_id')::uuid` OR if `status = 'PUBLISHED'` (enabling public retrieval of active forms).
- **INSERT, UPDATE, DELETE**: Strictly scoped to the authenticated tenant context (`companyId = current_setting('app.current_tenant_id')::uuid`).

### 6.2 `FormQuestion` & `FormQuestionOption`
- **SELECT**: Accessible if parent form belongs to tenant context OR parent form is `PUBLISHED`.
- **INSERT, UPDATE, DELETE**: Strictly scoped to tenant context via parent form join.

### 6.3 `FeedbackResponse` & `FeedbackAnswer`
- **SELECT, UPDATE, DELETE**: Strictly scoped to tenant context (`companyId = current_setting('app.current_tenant_id')::uuid`). Unauthenticated visitors can never read historical responses.
- **INSERT**: Permitted with validation check for anonymous public submissions and authenticated member responses.

