-- ==============================================================================
-- FeedbackHub Phase 5.0: Tenant Database & Membership Foundation Migration
-- ==============================================================================

-- 1. Create CompanyRole enum type if not exists
DO $$ BEGIN
    CREATE TYPE "CompanyRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Company table if not exists
CREATE TABLE IF NOT EXISTS "Company" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(63) NOT NULL,
    "customDomain" VARCHAR(255),
    "logoUrl" VARCHAR(512),
    "brandColorHex" VARCHAR(7) NOT NULL DEFAULT '#8B5CF6',
    "accentColorHex" VARCHAR(7) NOT NULL DEFAULT '#EC4899',
    "settings" JSONB NOT NULL DEFAULT '{"allowPublicCustomerFeedback": true, "allowAnonymousEmployeeFeedback": true, "minimumEmployeePrivacyThreshold": 5}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Indexes for Company
CREATE UNIQUE INDEX IF NOT EXISTS "Company_slug_key" ON "Company"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Company_customDomain_key" ON "Company"("customDomain");
CREATE INDEX IF NOT EXISTS "Company_slug_idx" ON "Company"("slug");
CREATE INDEX IF NOT EXISTS "Company_customDomain_idx" ON "Company"("customDomain");

-- 3. Create CompanyMembership table if not exists
CREATE TABLE IF NOT EXISTS "CompanyMembership" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'OWNER',
    "roleId" UUID,
    "jobTitle" VARCHAR(100),
    "department" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Composite unique constraint on (companyId, userId)
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_companyId_userId_key" ON "CompanyMembership"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_companyId_idx" ON "CompanyMembership"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_userId_idx" ON "CompanyMembership"("userId");
