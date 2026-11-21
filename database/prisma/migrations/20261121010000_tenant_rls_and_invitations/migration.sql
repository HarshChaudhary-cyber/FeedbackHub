-- ==============================================================================
-- FeedbackHub Phase 5: Tenant Row-Level Security & Membership Lifecycle Migration
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

-- 2. Enable and Force Row-Level Security on tenant-owned tables
ALTER TABLE "CompanyMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyMembership" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CompanyInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyInvitation" FORCE ROW LEVEL SECURITY;

-- 3. Row-Level Security Policies for CompanyMembership
-- Restrict access so rows are only readable/writable when app.current_tenant_id matches companyId,
-- or when app.bypass_rls is 'on', or when a user queries their own memberships at the platform level.
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'CompanyMembership' AND policyname = 'tenant_membership_isolation'
    ) THEN
        CREATE POLICY tenant_membership_isolation ON "CompanyMembership"
            FOR ALL
            USING (
                current_setting('app.bypass_rls', true) = 'on'
                OR (
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
    END IF;
END $$;

-- 4. Row-Level Security Policies for CompanyInvitation
-- Restrict access so invitations are only accessible within their tenant context
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'CompanyInvitation' AND policyname = 'tenant_invitation_isolation'
    ) THEN
        CREATE POLICY tenant_invitation_isolation ON "CompanyInvitation"
            FOR ALL
            USING (
                current_setting('app.bypass_rls', true) = 'on'
                OR (
                    current_setting('app.current_tenant_id', true) IS NOT NULL
                    AND current_setting('app.current_tenant_id', true) <> ''
                    AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
                )
                OR (
                    (current_setting('app.current_tenant_id', true) IS NULL OR current_setting('app.current_tenant_id', true) = '')
                    AND current_setting('app.current_user_id', true) IS NOT NULL
                    AND current_setting('app.current_user_id', true) <> ''
                    AND "invitedByUserId" = current_setting('app.current_user_id', true)::uuid
                )
            );
    END IF;
END $$;
