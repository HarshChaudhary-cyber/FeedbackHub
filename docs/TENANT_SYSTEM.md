# FeedbackHub — Multi-Tenant System Architecture & Implementation Guide

**Document Version:** 1.1.0  
**Phase:** Phase 5 — Multi-Tenant Foundation (Hardened)  
**Status:** Implemented & Verified  

---

## 1. Overview & Tenancy Strategy

FeedbackHub operates as a **centralized multi-tenant SaaS application** with strict multi-layer tenant isolation. A single shared application runtime and database infrastructure serves all companies (tenants) while guaranteeing that:
1. Every tenant's data, members, invitations, settings, and future feedback forms/responses are completely partitioned.
2. Tenant identification and membership are verified cryptographically and authorization-checked on every request.
3. No user can access or mutate tenant data merely by supplying a tenant ID or company slug in a client payload.
4. Database-level protections (PostgreSQL Row-Level Security) act as an immutable fail-safe backstop behind application-level controls without unrestricted bypass GUCs.

---

## 2. Hostname Resolution & Classification

FeedbackHub classifies every incoming HTTP request by hostname before it reaches controllers.

### 2.1 Domain Classification Matrix

| Hostname Pattern | Type | Target Resource | Tenant Scoped? |
| :--- | :--- | :--- | :--- |
| `feedbackhub.com`, `www.feedbackhub.com` | `MARKETING` | Public landing page, pricing, blogs | No |
| `localhost:3000`, `127.0.0.1`, `[::1]` | `MARKETING` | Local marketing site / base API | No |
| `app.feedbackhub.com` | `APP` | Central SaaS application / account hub | No |
| `app.localhost:3000` | `APP` | Local central SaaS application | No |
| `admin.feedbackhub.com`, `ops.feedbackhub.com` | `PLATFORM` | System administration portal | No |
| `{slug}.feedbackhub.com` | `TENANT` | Company-specific branded workspace | **Yes** |
| `{slug}.localhost:3000` | `TENANT` | Local development tenant workspace | **Yes** |
| `feedback.acmecorp.com` (Custom Domain) | `TENANT` | CNAME-mapped branded workspace | **Yes** |

### 2.2 Localhost Development Workflow (`.localhost`)

Per **RFC 6761 Section 6.3**, all `.localhost` domains loop back to `127.0.0.1` by standard DNS resolvers without requiring `/etc/hosts` or Windows `hosts` file modification:
- `http://acme.localhost:3000` resolves to the `acme` tenant in local development.
- `http://app.localhost:3000` resolves to the central application console.
- `http://localhost:3000` resolves to the marketing website.

### 2.3 Robust Authority Extraction & Proxy Security (`TRUSTED_PROXY`)

In production environments behind reverse proxies (Nginx, Cloudflare, AWS ALB), clients may attempt to spoof hostnames via `X-Forwarded-Host` or `Host` headers.

`TenantResolutionService` enforces secure, standards-compliant host extraction:
- **Proxy Trust Enforcement**: `X-Forwarded-Host` is read **only** when `TRUSTED_PROXY=true` or `TRUSTED_PROXY=1`. When disabled (default), forwarded headers are strictly ignored and `req.headers.host` is used exclusively.
- **Multi-Hop Parsing**: In trusted proxy mode, multi-valued `X-Forwarded-Host` headers (comma-delimited) are parsed strictly by extracting the leftmost (client-supplied) hop.
- **Authority Delimiter Sanitization**: Rejects any Host header containing authority delimiters (`/`, `\`, `?`, `#`, `@`, or whitespace) with `400 Bad Request` to prevent path/query/userinfo injection.
- **IPv6 Authority Parsing**: Robustly supports bracketed IPv6 hosts (e.g. `[::1]:3000` or `[::1]`) and validates brackets and port syntax.
- **Port Boundary Validation**: Validates that port numbers fall within the valid TCP port range (1-65535), rejecting out-of-range ports with `400 Bad Request`.
- **RFC 1034 Trailing Dot Normalization**: Strips single trailing dots from FQDN host headers (`acme.feedbackhub.com.` $\to$ `acme.feedbackhub.com`).
- **RFC 1035 Label Validation**: Enforces maximum host length of 253 characters and label lengths of 1-63 characters matching alphanumeric patterns, rejecting consecutive dots (`..`).
- **Inactive Tenant Rejection**: Resolving a company that is `isActive: false` or `status !== 'ACTIVE'` immediately returns `null` and yields a `404 Not Found`.

---

## 3. Request-Scoped Context Lifecycle (`AsyncLocalStorage`)

Tenant context is managed through Node.js native `AsyncLocalStorage` via `TenantContextManager`.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Proxy as Reverse Proxy (Cloudflare / Nginx)
    participant Middleware as TenantMiddleware
    participant Resolution as TenantResolutionService
    participant ALS as TenantContextManager (AsyncLocalStorage)
    participant Guards as Tenant Guards
    participant Controller as Controller Handler
    participant DB as PrismaService + PostgreSQL

    Client->>Proxy: GET https://acme.feedbackhub.com/api/v1/tenant/members
    Proxy->>Middleware: Forward Host: acme.feedbackhub.com
    Middleware->>Resolution: resolveTenantFromHost("acme.feedbackhub.com")
    Resolution->>DB: findUnique({ slug: "acme", isActive: true, status: "ACTIVE" })
    DB-->>Resolution: Company { id: "c1", slug: "acme", ... }
    Resolution-->>Middleware: TenantContext { companyId, slug, name, status, ... }
    Middleware->>ALS: run(context, next)
    Note over ALS,Controller: Context is immutable (Object.freeze) & concurrency-safe
    Middleware->>Guards: TenantResolutionGuard -> TenantMembershipGuard -> TenantRoleGuard
    Note over Guards: Enriches context atomically via TenantContextManager.enrich()
    Guards-->>Controller: Authorized
    Controller->>DB: withTenantContext(companyId, userId, tx => ...)
    DB->>DB: set_config('app.current_tenant_id', companyId, true)
    DB->>DB: set_config('app.current_user_id', userId, true)
    DB-->>Controller: Isolated Query Results
    Controller-->>Client: 200 OK (Tenant-Scoped Data)
```

### 3.1 Context Immutability, Synchronization & Concurrency Safety
- Context objects are frozen via `Object.freeze()` before being bound to `AsyncLocalStorage`.
- **Zero Drift Context Enrichment**: When `TenantMembershipGuard` verifies active membership, it calls `TenantContextManager.enrich(...)` to atomically update the active async execution store alongside `request.tenant`. Both access points always return identical, frozen metadata.
- Nested asynchronous microtasks, promise chains, and concurrent HTTP requests preserve discrete isolated contexts with zero cross-request contamination.
- The `@CurrentTenant()` decorator accesses `TenantContextManager.getOrThrow()` or `req.tenant` cleanly.

---

## 4. Authorization & Role Hierarchy

Tenant routes are protected by a four-tiered defense-in-depth guard pipeline:

```
[ SessionAuthGuard ] -> [ TenantResolutionGuard ] -> [ TenantMembershipGuard ] -> [ TenantRoleGuard ]
```

### 4.1 Guard Responsibilities
1. **`SessionAuthGuard`**: Authenticates user identity via secure server-side session cookie. Rejects unauthenticated requests with `401 Unauthorized`.
2. **`TenantResolutionGuard`**: Validates that the request has successfully resolved to an active tenant. Fails closed with `404 Not Found` if accessed on a non-tenant domain.
3. **`TenantMembershipGuard`**: Queries the user's membership for the resolved `companyId` inside transaction-local tenant context (`withTenantContext`). Requires `status === 'ACTIVE'`. Rejects inactive, suspended, or non-members with `403 Forbidden`. Enriches context via `TenantContextManager.enrich()`.
4. **`TenantRoleGuard`**: Reads `@RequireRoles(...)` metadata and verifies the user's role against the required hierarchy.

### 4.2 Role Hierarchy & Fail-Closed Guard Enforcement

FeedbackHub enforces a strict three-tier role hierarchy:

$$\text{OWNER (Weight 3)} > \text{ADMIN (Weight 2)} > \text{MANAGER (Weight 1)}$$

- **OWNER**: Highest authority. Full configuration, billing, member management, invitation issuance, and company deletion. Cannot be demoted or removed; ownership can only be transferred atomically. Exactly one OWNER per company.
- **ADMIN**: Operations, template management, team invites, manager role modifications. Cannot modify, demote, or suspend the OWNER or other ADMINs.
- **MANAGER**: Read and operational interaction with assigned feedback workflows. Cannot modify members, change company settings, or invite users.

#### Fail-Closed Guard Rules:
- If endpoint role metadata contains any unrecognized or invalid role string, `TenantRoleGuard` throws `403 Forbidden` (`"Invalid or unknown role requirement"`).
- If required role metadata is an empty array (`@RequireRoles()`), `TenantRoleGuard` fails closed with `403 Forbidden`.
- If caller membership role is missing or unrecognized, `TenantRoleGuard` fails closed with `403 Forbidden`.

---

## 5. Membership Lifecycle & Concurrency Hardening

All membership operations are encapsulated within `TenantMembershipService` and executed inside transaction-local RLS contexts.

### 5.1 Owner Protection Rules
- **No Self-Demotion**: An OWNER cannot demote their own role to ADMIN or MANAGER.
- **No Self-Suspension**: An OWNER cannot suspend their own status.
- **No Removal**: An OWNER cannot be removed from the company. A company cannot be rendered ownerless.
- **Admin Privilege Isolation**: ADMINs cannot promote users to OWNER, nor can they alter or remove other ADMINs or the OWNER.

### 5.2 Atomic Ownership Transfer with Concurrency Safety
Ownership transfer swaps roles between the current OWNER and an active member inside an atomic database transaction:
1. Validates that the company exists and is active (`status === 'ACTIVE'` and `isActive === true`).
2. Validates that the caller is the current active OWNER.
3. Validates that the target user exists and has `status === 'ACTIVE'`.
4. Validates that the target user is currently an `ACTIVE` member of the company.
5. Executes atomic conditional updates (`updateMany`):
   - Demotes current owner only if still active OWNER (`count === 1`).
   - Promotes target user only if still active member (`count === 1`).
   If either update fails, transaction aborts with `409 Conflict`, mathematically preventing split-brain ownership or ownerless companies under concurrent requests.
6. Rate limited via Redis sliding window (`tenant_transfer_ownership:companyId`, 5 per hour).

---

## 6. Pre-Membership Invitation Workflow & Security

### 6.1 Invitation Issuance
1. Caller (`OWNER` or `ADMIN`) submits `{ email, role }`.
2. Validated against `createInvitationSchema`:
   - Role must be `'ADMIN'` or `'MANAGER'`.
   - Rejects `'OWNER'` role with `400 Bad Request`.
3. Normalized email (`lowercase`, trimmed) is checked against existing memberships:
   - If an active membership exists: `409 Conflict`.
   - If a pending invitation already exists: `409 Conflict`.
4. A **32-byte cryptographically secure random token** is generated using `crypto.randomBytes(32).toString('hex')`.
5. The token is hashed with **SHA-256**:
   $$\text{tokenHash} = \text{SHA-256}(\text{rawToken})$$
6. Stored in `CompanyInvitation` with partial unique index `("companyId", "email") WHERE status = 'PENDING'`.
7. **Zero Raw Token Persistence**: Plaintext `rawToken` is returned only once to caller; never stored in DB or written to logs.
8. Rate limited via Redis sliding window (`tenant_invite_create:companyId`, 50 per hour).

### 6.2 Pre-Membership Invitation Acceptance Workflow Under RLS
Acceptance is a pre-membership operation where the invitee is not yet a company member:
1. Invitee submits `{ token }` while authenticated.
2. Accepts only when invitee account is strictly `status === 'ACTIVE'`.
3. Token is hashed: `tokenHash = SHA-256(token)`.
4. Runs inside dedicated transactional token context:
   ```sql
   SELECT set_config('app.invitation_token_hash', ${tokenHash}, true);
   SELECT set_config('app.current_user_id', ${userId}, true);
   ```
5. Looks up the invitation by `tokenHash`:
   - If not found or expired: `400 Bad Request`.
   - If status $\ne$ `'PENDING'`: `400 Bad Request`.
6. Enforces **email identity match**: authenticated user's email must match `invitation.email` (`403 Forbidden` on mismatch).
7. Verifies target company exists and is active (`status === 'ACTIVE'` and `isActive === true`).
8. Transitions transaction into tenant context:
   ```sql
   SELECT set_config('app.current_tenant_id', ${invitation.companyId}, true);
   ```
9. Concurrency-safe conditional update:
   ```typescript
   const updateRes = await tx.companyInvitation.updateMany({
     where: { id: invitation.id, status: 'PENDING', expiresAt: { gt: new Date() } },
     data: { status: 'ACCEPTED' },
   });
   if (updateRes.count !== 1) throw new BadRequestException('Already accepted or no longer pending.');
   ```
10. Upserts / reactivates membership record with invited role and `status: 'ACTIVE'`.
11. Rate limited via Redis sliding window (`tenant_invite_accept:userId`, 10 per minute).

---

## 7. Database Layer & PostgreSQL Row-Level Security (RLS)

FeedbackHub enforces multi-layered tenant isolation without any permissive bypass flags (`app.bypass_rls` eliminated):

### 7.1 PostgreSQL Configuration & Force RLS
```sql
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CompanyMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyMembership" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CompanyInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyInvitation" FORCE ROW LEVEL SECURITY;
```
`FORCE ROW LEVEL SECURITY` prevents database table owners and connection roles from bypassing RLS.

### 7.2 Hardened PostgreSQL Policies
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

### 7.3 Transaction-Local Settings for Connection Poolers
FeedbackHub sets context with transaction scope:
```sql
SELECT set_config('app.current_tenant_id', '<company-uuid>', true);
```
Passing `true` as the third parameter (`is_local`) guarantees the setting is cleared on `COMMIT` or `ROLLBACK`, eliminating state contamination across PgBouncer / pooled connection checkouts.

### 7.4 Application Query Path Classification

| Service / Guard | Query Operation | Transaction Mechanism | Context GUCs Set | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `TenantResolutionService` | `company.findUnique` | Standalone Query | None | Public discovery by slug / domain before tenant context exists |
| `CompaniesService.getUserCompanies` | `companyMembership.findMany` | `withUserContext` | `app.current_user_id` | Platform-level listing of user's own companies across tenants |
| `CompaniesService.createCompany` | `company.create` + `membership.create` | `$transaction` + `setTransactionTenantContext` | `app.current_tenant_id` | Atomic company establishment and owner assignment |
| `TenantMembershipGuard` | `companyMembership.findUnique` | `withTenantContext` | `app.current_tenant_id`, `app.current_user_id` | Route authorization verifying membership in resolved tenant |
| `TenantMembershipService.*` (all member & invite methods) | Member & invitation queries / mutations | `withTenantContext` | `app.current_tenant_id`, `app.current_user_id` | Strict tenant-scoped operations |
| `TenantMembershipService.acceptInvitation` | `invitation.findUnique` $\to$ `membership.create` | `withInvitationTokenContext` $\to$ `setTransactionTenantContext` | `app.invitation_token_hash` $\to$ `app.current_tenant_id` | Secure pre-membership acceptance transition |

---

## 8. Reproducible PostgreSQL Integration Test Setup

To run the integration tests against real PostgreSQL:

1. **Start an isolated test database container**:
   ```bash
   docker run -d --name feedbackhub-test-pg \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=feedbackhub_test \
     -p 5433:5432 \
     postgres:16-alpine
   ```
2. **Apply migrations**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/feedbackhub_test?schema=public" pnpm --filter @feedbackhub/database db:deploy
   ```
3. **Execute RLS integration tests**:
   ```bash
   DATABASE_URL_REAL="postgresql://postgres:postgres@localhost:5433/feedbackhub_test?schema=public" pnpm test apps/api/src/tenant/__tests__/postgres-rls.integration.test.ts
   ```
