# FeedbackHub — Architectural Decision Records (ADRs) & Technical Tradeoffs

**Document Version:** 1.0.0  
**Status:** Approved Foundation  

---

## ADR 1: Hostname-Based Tenant Resolution vs Path-Based Routing

### Context
In multi-tenant SaaS, tenant context can be resolved via:
1. URL path prefix (`feedbackhub.com/acme/forms/1`)
2. Subdomain (`acme.feedbackhub.com/forms/1`)
3. HTTP custom header (`X-Tenant-ID: acme`)

### Decision
Adopt **Hostname-Based Subdomain Resolution** (`{slug}.feedbackhub.com` and `app.feedbackhub.com`).

### Justification & Tradeoffs
- **Pros**: Clear brand isolation for companies; seamless transition to custom domains (e.g., `feedback.acme.com`); distinct cookie domain isolation; natural alignment with company identity; higher conversion for respondents who see their company or vendor's name in the URL.
- **Cons**: Requires wildcard DNS (`*.feedbackhub.com`) and wildcard SSL certificates; local development requires local DNS/hosts mapping or test domain aliases (e.g., `*.localhost` or `lvh.me`).
- **Security Rule**: The frontend never sends client-claimed tenant IDs as an authoritative source. The backend extracts and validates the tenant strictly from the `Host` header via `TenantResolutionMiddleware`.

---

## ADR 2: Custom Subdomain Provisioning & Slug Rules

### Context
Tenants need unique subdomains upon self-service sign-up.

### Decision
1. Subdomains are restricted to alphanumeric lowercase characters and single hyphens (`^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$`).
2. Length constrained between 3 and 63 characters.
3. Strict blacklist of reserved subdomains: `app`, `api`, `admin`, `www`, `docs`, `auth`, `status`, `billing`, `mail`, `webhook`, `static`, `assets`, `cdn`, `support`, `help`, `root`, `internal`.
4. Unique constraint enforced at database level with immediate availability validation via API.

---

## ADR 3: Secure Authentication — Server-Side Sessions with HttpOnly Cookies vs JWT in LocalStorage

### Context
SaaS authentication tokens are commonly stored in client `localStorage` (as JWTs) or in browser cookies.

### Decision
Adopt **Server-Side Session IDs stored in Secure, HttpOnly, SameSite=Lax Cookies**.

### Justification & Tradeoffs
- **Pros**: Complete immunity to XSS-based token theft (JavaScript cannot read `HttpOnly` cookies); instantaneous server-side session revocation (critical for compromised accounts or employee terminations); no token expiry desynchronization issues.
- **Cons**: Requires server-side session store (PostgreSQL / Redis); requires deliberate cookie domain scoping (`.feedbackhub.com`) to allow authenticated session sharing between `app.feedbackhub.com` and tenant subdomains when applicable.

---

## ADR 4: Database Tenant Isolation — Shared Database with Discriminator & RLS

### Context
Multi-tenant database architectures range from separate physical databases to shared tables.

### Decision
Adopt **Shared Database with Discriminator Column (`companyId`)** backed by **PostgreSQL Row-Level Security (RLS)** as a defense-in-depth safeguard.

### Justification & Tradeoffs
- **Pros**: Manageable connection pooling; instant onboarding of new tenants with zero DDL migrations; cost-effective scaling across thousands of SMB tenants; unified schema migrations via Prisma.
- **Cons**: Requires strict discipline in query authoring. Mitigated by:
  1. Centralized Prisma extensions/middleware that inject `companyId`.
  2. PostgreSQL RLS policies that reject queries where `companyId != current_setting('app.current_tenant_id')`.

---

## ADR 5: Anonymous Feedback Architecture & Cryptographic Decoupling

### Context
Employee trust and customer privacy require that anonymous submissions cannot be reverse-engineered to identify the submitter.

### Decision
1. **Physical Nullification**: `respondentUserId`, `respondentEmail`, and `respondentName` are strictly `NULL` in the database for anonymous submissions.
2. **Network Decoupling**: Ingestion endpoints do not log or store client IP addresses or raw User-Agent fingerprints on response records.
3. **Receipting**: An unguessable, high-entropy cryptographic submission receipt token is issued to the client for one-way status tracking.
4. **$k$-Anonymity Floor**: Aggregated reports for teams or departments suppress granular charts if fewer than 5 respondents participated.

---

## ADR 6: Subscription Limits & Quota Enforcement

### Context
SaaS tiers require feature gating and resource limits (monthly responses, team members, active forms).

### Decision
Enforce soft warnings at 80% quota and hard blocks at 100% quota via a centralized `SubscriptionQuotaService`.
- Exceeding monthly response quota gracefully stores incoming responses in a temporary queue / pending state with email notification to the Company Owner rather than rejecting public submissions abruptly.
- Tier gates are enforced at the NestJS Guard level (`@RequiresPlan('PRO')`).

---

## ADR 7: Future Custom Domain Architecture

### Context
Enterprise customers will require fully branded domains (e.g., `feedback.customer.com`) rather than subdomains.

### Decision
- Store optional `customDomain` in `Company` record.
- Edge proxy (Caddy, Cloudflare for SaaS, or AWS CloudFront) performs on-demand SSL issuance and passes original host header to FeedbackHub API.
- The `TenantResolutionMiddleware` queries `Company` by `slug` first, and if not matched, falls back to `customDomain`.
