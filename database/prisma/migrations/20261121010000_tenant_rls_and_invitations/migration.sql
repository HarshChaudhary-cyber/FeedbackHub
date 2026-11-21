-- ==============================================================================
-- FeedbackHub Phase 5: Tenant Row-Level Security & Membership Lifecycle Migration
-- Hardened RLS isolation without unrestricted bypass GUCs
-- ==============================================================================

-- 1. Create CompanyInvitation table if not exists
CREATE TABLE IF NOT EXISTS "CompanyInvitation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "invitedByUserId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'MANAGER',
    "tokenHash" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CompanyInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique index on tokenHash and indices on companyId and email
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyInvitation_tokenHash_key" ON "CompanyInvitation"("tokenHash");
CREATE INDEX IF NOT EXISTS "CompanyInvitation_companyId_idx" ON "CompanyInvitation"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyInvitation_email_idx" ON "CompanyInvitation"("email");
CREATE INDEX IF NOT EXISTS "CompanyInvitation_tokenHash_idx" ON "CompanyInvitation"("tokenHash");

-- Partial unique index preventing concurrent duplicate pending invitations to the same email in a company
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyInvitation_unique_pending_email"
    ON "CompanyInvitation" ("companyId", "email")
    WHERE "status" = 'PENDING';

-- 2. Enable and Force Row-Level Security on tenant-owned tables
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CompanyMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyMembership" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CompanyInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyInvitation" FORCE ROW LEVEL SECURITY;

-- 3. Row-Level Security Policies for Company
DROP POLICY IF EXISTS company_select_policy ON "Company";
CREATE POLICY company_select_policy ON "Company"
    FOR SELECT
    USING (
        (
            current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND "id" = current_setting('app.current_tenant_id', true)::uuid
        )
        OR (
            "isActive" = true AND "status" = 'ACTIVE'
        )
    );

DROP POLICY IF EXISTS company_insert_policy ON "Company";
CREATE POLICY company_insert_policy ON "Company"
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS company_update_policy ON "Company";
CREATE POLICY company_update_policy ON "Company"
    FOR UPDATE
    USING (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "id" = current_setting('app.current_tenant_id', true)::uuid
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "id" = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS company_delete_policy ON "Company";
CREATE POLICY company_delete_policy ON "Company"
    FOR DELETE
    USING (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "id" = current_setting('app.current_tenant_id', true)::uuid
    );

-- 4. Row-Level Security Policies for CompanyMembership
-- Restrict access so rows are only readable/writable when app.current_tenant_id matches companyId,
-- or when a user queries their own memberships at the platform level (app.current_user_id = userId).
DROP POLICY IF EXISTS tenant_membership_isolation ON "CompanyMembership";
CREATE POLICY tenant_membership_isolation ON "CompanyMembership"
    FOR ALL
    USING (
        (
            current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
        OR (
            (current_setting('app.current_tenant_id', true) IS NULL OR current_setting('app.current_tenant_id', true) = '')
            AND current_setting('app.current_user_id', true) IS NOT NULL
            AND current_setting('app.current_user_id', true) <> ''
            AND "userId" = current_setting('app.current_user_id', true)::uuid
        )
    )
    WITH CHECK (
        (
            current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
        OR (
            (current_setting('app.current_tenant_id', true) IS NULL OR current_setting('app.current_tenant_id', true) = '')
            AND current_setting('app.current_user_id', true) IS NOT NULL
            AND current_setting('app.current_user_id', true) <> ''
            AND "userId" = current_setting('app.current_user_id', true)::uuid
        )
    );

-- 5. Row-Level Security Policies for CompanyInvitation
-- Restrict access so invitations are only accessible within their tenant context,
-- or by exact token hash lookup during the pre-membership acceptance workflow.
DROP POLICY IF EXISTS tenant_invitation_isolation ON "CompanyInvitation";
CREATE POLICY tenant_invitation_isolation ON "CompanyInvitation"
    FOR ALL
    USING (
        (
            current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
        OR (
            current_setting('app.invitation_token_hash', true) IS NOT NULL
            AND current_setting('app.invitation_token_hash', true) <> ''
            AND "tokenHash" = current_setting('app.invitation_token_hash', true)
        )
    )
    WITH CHECK (
        (
            current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
        OR (
            current_setting('app.invitation_token_hash', true) IS NOT NULL
            AND current_setting('app.invitation_token_hash', true) <> ''
            AND "tokenHash" = current_setting('app.invitation_token_hash', true)
        )
    );
