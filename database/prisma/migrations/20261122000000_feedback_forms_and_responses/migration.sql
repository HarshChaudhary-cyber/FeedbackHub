-- ==============================================================================
-- FeedbackHub Phase 6: Feedback Form Builder & Collection Engine Migration
-- Enums, Tables, Indices, and Row-Level Security (RLS) Policies
-- ==============================================================================

-- 1. Create Enums if not exist
DO $$ BEGIN
    CREATE TYPE "FeedbackAudience" AS ENUM ('CUSTOMER', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AnonymityMode" AS ENUM ('ANONYMOUS_ONLY', 'IDENTIFIED_ONLY', 'RESPONDENT_CHOICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create FeedbackForm table
CREATE TABLE IF NOT EXISTS "FeedbackForm" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "internalName" VARCHAR(200),
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "welcomeMessage" TEXT,
    "thankYouMessage" TEXT,
    "audienceType" "FeedbackAudience" NOT NULL DEFAULT 'CUSTOMER',
    "anonymityMode" "AnonymityMode" NOT NULL DEFAULT 'ANONYMOUS_ONLY',
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "allowMultipleSubmissions" BOOLEAN NOT NULL DEFAULT false,
    "themeSettings" JSONB,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackForm_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FeedbackForm_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeedbackForm_slug_key" ON "FeedbackForm"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "FeedbackForm_companyId_slug_key" ON "FeedbackForm"("companyId", "slug");
CREATE INDEX IF NOT EXISTS "FeedbackForm_companyId_status_idx" ON "FeedbackForm"("companyId", "status");
CREATE INDEX IF NOT EXISTS "FeedbackForm_slug_idx" ON "FeedbackForm"("slug");

-- 3. Create FormQuestion table
CREATE TABLE IF NOT EXISTS "FormQuestion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formId" UUID NOT NULL,
    "questionType" VARCHAR(30) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "helpText" VARCHAR(500),
    "placeholder" VARCHAR(255),
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "validationRules" JSONB,
    "branchingLogic" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormQuestion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FormQuestion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "FeedbackForm"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FormQuestion_formId_orderIndex_idx" ON "FormQuestion"("formId", "orderIndex");

-- 4. Create FormQuestionOption table
CREATE TABLE IF NOT EXISTS "FormQuestionOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "questionId" UUID NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FormQuestionOption_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FormQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FormQuestionOption_questionId_orderIndex_idx" ON "FormQuestionOption"("questionId", "orderIndex");

-- 5. Create FeedbackResponse table
CREATE TABLE IF NOT EXISTS "FeedbackResponse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "formId" UUID NOT NULL,
    "submissionToken" VARCHAR(64) NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "respondentUserId" UUID,
    "respondentEmail" VARCHAR(255),
    "respondentName" VARCHAR(150),
    "status" VARCHAR(30) NOT NULL DEFAULT 'NEW',
    "sentimentScore" DOUBLE PRECISION,
    "tags" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FeedbackResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "FeedbackForm"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackResponse_respondentUserId_fkey" FOREIGN KEY ("respondentUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeedbackResponse_submissionToken_key" ON "FeedbackResponse"("submissionToken");
CREATE INDEX IF NOT EXISTS "FeedbackResponse_companyId_formId_idx" ON "FeedbackResponse"("companyId", "formId");
CREATE INDEX IF NOT EXISTS "FeedbackResponse_companyId_submittedAt_idx" ON "FeedbackResponse"("companyId", "submittedAt" DESC);
CREATE INDEX IF NOT EXISTS "FeedbackResponse_companyId_status_idx" ON "FeedbackResponse"("companyId", "status");

-- 6. Create FeedbackAnswer table
CREATE TABLE IF NOT EXISTS "FeedbackAnswer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "responseId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "textValue" TEXT,
    "numberValue" DOUBLE PRECISION,
    "booleanValue" BOOLEAN,
    "jsonValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackAnswer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FeedbackAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "FeedbackResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FeedbackAnswer_responseId_idx" ON "FeedbackAnswer"("responseId");
CREATE INDEX IF NOT EXISTS "FeedbackAnswer_questionId_idx" ON "FeedbackAnswer"("questionId");

-- 7. Enable and Force Row-Level Security on all form & response tables
ALTER TABLE "FeedbackForm" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedbackForm" FORCE ROW LEVEL SECURITY;

ALTER TABLE "FormQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormQuestion" FORCE ROW LEVEL SECURITY;

ALTER TABLE "FormQuestionOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormQuestionOption" FORCE ROW LEVEL SECURITY;

ALTER TABLE "FeedbackResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedbackResponse" FORCE ROW LEVEL SECURITY;

ALTER TABLE "FeedbackAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedbackAnswer" FORCE ROW LEVEL SECURITY;

-- 8. Row-Level Security Policies for FeedbackForm
DROP POLICY IF EXISTS feedback_form_select_policy ON "FeedbackForm";
CREATE POLICY feedback_form_select_policy ON "FeedbackForm"
    FOR SELECT
    USING (
        (
            current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
        OR (
            "status" = 'PUBLISHED'
        )
    );

DROP POLICY IF EXISTS feedback_form_insert_policy ON "FeedbackForm";
CREATE POLICY feedback_form_insert_policy ON "FeedbackForm"
    FOR INSERT
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS feedback_form_update_policy ON "FeedbackForm";
CREATE POLICY feedback_form_update_policy ON "FeedbackForm"
    FOR UPDATE
    USING (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS feedback_form_delete_policy ON "FeedbackForm";
CREATE POLICY feedback_form_delete_policy ON "FeedbackForm"
    FOR DELETE
    USING (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    );

-- 9. Row-Level Security Policies for FormQuestion & FormQuestionOption
DROP POLICY IF EXISTS form_question_select_policy ON "FormQuestion";
CREATE POLICY form_question_select_policy ON "FormQuestion"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "FeedbackForm" f
            WHERE f."id" = "FormQuestion"."formId"
            AND (
                (
                    current_setting('app.current_tenant_id', true) IS NOT NULL
                    AND current_setting('app.current_tenant_id', true) <> ''
                    AND f."companyId" = current_setting('app.current_tenant_id', true)::uuid
                )
                OR f."status" = 'PUBLISHED'
            )
        )
    );

DROP POLICY IF EXISTS form_question_write_policy ON "FormQuestion";
CREATE POLICY form_question_write_policy ON "FormQuestion"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "FeedbackForm" f
            WHERE f."id" = "FormQuestion"."formId"
            AND current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND f."companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "FeedbackForm" f
            WHERE f."id" = "FormQuestion"."formId"
            AND current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND f."companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

DROP POLICY IF EXISTS form_question_option_select_policy ON "FormQuestionOption";
CREATE POLICY form_question_option_select_policy ON "FormQuestionOption"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "FormQuestion" q
            JOIN "FeedbackForm" f ON f."id" = q."formId"
            WHERE q."id" = "FormQuestionOption"."questionId"
            AND (
                (
                    current_setting('app.current_tenant_id', true) IS NOT NULL
                    AND current_setting('app.current_tenant_id', true) <> ''
                    AND f."companyId" = current_setting('app.current_tenant_id', true)::uuid
                )
                OR f."status" = 'PUBLISHED'
            )
        )
    );

DROP POLICY IF EXISTS form_question_option_write_policy ON "FormQuestionOption";
CREATE POLICY form_question_option_write_policy ON "FormQuestionOption"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "FormQuestion" q
            JOIN "FeedbackForm" f ON f."id" = q."formId"
            WHERE q."id" = "FormQuestionOption"."questionId"
            AND current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND f."companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "FormQuestion" q
            JOIN "FeedbackForm" f ON f."id" = q."formId"
            WHERE q."id" = "FormQuestionOption"."questionId"
            AND current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND f."companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

-- 10. Row-Level Security Policies for FeedbackResponse & FeedbackAnswer
DROP POLICY IF EXISTS feedback_response_select_policy ON "FeedbackResponse";
CREATE POLICY feedback_response_select_policy ON "FeedbackResponse"
    FOR SELECT
    USING (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS feedback_response_insert_policy ON "FeedbackResponse";
CREATE POLICY feedback_response_insert_policy ON "FeedbackResponse"
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS feedback_response_update_policy ON "FeedbackResponse";
CREATE POLICY feedback_response_update_policy ON "FeedbackResponse"
    FOR UPDATE
    USING (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS feedback_response_delete_policy ON "FeedbackResponse";
CREATE POLICY feedback_response_delete_policy ON "FeedbackResponse"
    FOR DELETE
    USING (
        current_setting('app.current_tenant_id', true) IS NOT NULL
        AND current_setting('app.current_tenant_id', true) <> ''
        AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS feedback_answer_select_policy ON "FeedbackAnswer";
CREATE POLICY feedback_answer_select_policy ON "FeedbackAnswer"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "FeedbackResponse" r
            WHERE r."id" = "FeedbackAnswer"."responseId"
            AND current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND r."companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

DROP POLICY IF EXISTS feedback_answer_insert_policy ON "FeedbackAnswer";
CREATE POLICY feedback_answer_insert_policy ON "FeedbackAnswer"
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS feedback_answer_update_delete_policy ON "FeedbackAnswer";
CREATE POLICY feedback_answer_update_delete_policy ON "FeedbackAnswer"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "FeedbackResponse" r
            WHERE r."id" = "FeedbackAnswer"."responseId"
            AND current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND r."companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "FeedbackResponse" r
            WHERE r."id" = "FeedbackAnswer"."responseId"
            AND current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND r."companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );
