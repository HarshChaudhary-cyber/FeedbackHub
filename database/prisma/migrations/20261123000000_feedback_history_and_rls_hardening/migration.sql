-- ==============================================================================
-- FeedbackHub Phase 6 Hardening Migration:
-- Historical Question Retention, Decoupled Anti-Duplicate Fingerprinting,
-- and Transaction-Scoped Row-Level Security (RLS) Policy Hardening
-- ==============================================================================

-- 1. FormQuestion: Add soft-deletion active flag and question versioning
ALTER TABLE "FormQuestion" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "FormQuestion" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "FormQuestion_formId_isActive_idx" ON "FormQuestion"("formId", "isActive");

-- 2. FormQuestionOption: Add soft-deletion active flag
ALTER TABLE "FormQuestionOption" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "FormQuestionOption_questionId_isActive_idx" ON "FormQuestionOption"("questionId", "isActive");

-- 3. FeedbackResponse: Add privacy-preserving salted SHA-256 hash for abuse mitigation and duplicate prevention
ALTER TABLE "FeedbackResponse" ADD COLUMN IF NOT EXISTS "ipHash" VARCHAR(64);
CREATE INDEX IF NOT EXISTS "FeedbackResponse_formId_ipHash_idx" ON "FeedbackResponse"("formId", "ipHash");
CREATE INDEX IF NOT EXISTS "FeedbackResponse_formId_respondentEmail_idx" ON "FeedbackResponse"("formId", "respondentEmail");

-- 4. FeedbackAnswer: Add question title and question type snapshots to preserve historical interpretation
ALTER TABLE "FeedbackAnswer" ADD COLUMN IF NOT EXISTS "questionTitle" VARCHAR(500);
ALTER TABLE "FeedbackAnswer" ADD COLUMN IF NOT EXISTS "questionType" VARCHAR(30);

-- 5. Hardened Referential Integrity: Restrict deletion of FormQuestions that have collected answers
ALTER TABLE "FeedbackAnswer" DROP CONSTRAINT IF EXISTS "FeedbackAnswer_questionId_fkey";
ALTER TABLE "FeedbackAnswer" ADD CONSTRAINT "FeedbackAnswer_questionId_fkey" 
    FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Hardened Row-Level Security Policies for FeedbackResponse
-- Fails closed: Only internal tenant context OR validated transaction-scoped public context can INSERT
DROP POLICY IF EXISTS feedback_response_insert_policy ON "FeedbackResponse";
CREATE POLICY feedback_response_insert_policy ON "FeedbackResponse"
    FOR INSERT
    WITH CHECK (
        -- Internal authenticated tenant operation
        (
            current_setting('app.current_tenant_id', true) IS NOT NULL
            AND current_setting('app.current_tenant_id', true) <> ''
            AND "companyId" = current_setting('app.current_tenant_id', true)::uuid
        )
        OR
        -- Verified public submission within transaction-local context
        (
            current_setting('app.is_public_submission', true) = 'true'
            AND current_setting('app.public_submission_form_id', true) IS NOT NULL
            AND "formId" = current_setting('app.public_submission_form_id', true)::uuid
            AND current_setting('app.public_submission_company_id', true) IS NOT NULL
            AND "companyId" = current_setting('app.public_submission_company_id', true)::uuid
            AND EXISTS (
                SELECT 1 FROM "FeedbackForm" f
                JOIN "Company" c ON c."id" = f."companyId"
                WHERE f."id" = "FeedbackResponse"."formId"
                AND f."companyId" = "FeedbackResponse"."companyId"
                AND f."status" = 'PUBLISHED'
                AND c."isActive" = true
                AND c."status" = 'ACTIVE'
            )
        )
    );

-- 7. Hardened Row-Level Security Policies for FeedbackAnswer
-- Validates response relationship, question ownership, and active question status
DROP POLICY IF EXISTS feedback_answer_insert_policy ON "FeedbackAnswer";
CREATE POLICY feedback_answer_insert_policy ON "FeedbackAnswer"
    FOR INSERT
    WITH CHECK (
        -- Internal authenticated tenant operation
        (
            EXISTS (
                SELECT 1 FROM "FeedbackResponse" r
                WHERE r."id" = "FeedbackAnswer"."responseId"
                AND current_setting('app.current_tenant_id', true) IS NOT NULL
                AND current_setting('app.current_tenant_id', true) <> ''
                AND r."companyId" = current_setting('app.current_tenant_id', true)::uuid
            )
        )
        OR
        -- Verified public submission within transaction-local context
        (
            current_setting('app.is_public_submission', true) = 'true'
            AND current_setting('app.public_submission_form_id', true) IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM "FeedbackResponse" r
                JOIN "FormQuestion" q ON q."id" = "FeedbackAnswer"."questionId"
                WHERE r."id" = "FeedbackAnswer"."responseId"
                AND r."formId" = current_setting('app.public_submission_form_id', true)::uuid
                AND q."formId" = current_setting('app.public_submission_form_id', true)::uuid
                AND q."isActive" = true
            )
        )
    );
