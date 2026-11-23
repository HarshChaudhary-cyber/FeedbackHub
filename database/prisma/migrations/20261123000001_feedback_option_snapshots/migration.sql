-- ==============================================================================
-- FeedbackHub Phase 6 Final Hardening Migration:
-- Choice Option Interpretation Preservation Snapshots
-- ==============================================================================

-- FeedbackAnswer: Add option snapshots to preserve historical choice labels and values
ALTER TABLE "FeedbackAnswer" ADD COLUMN IF NOT EXISTS "selectedOptionLabel" VARCHAR(500);
ALTER TABLE "FeedbackAnswer" ADD COLUMN IF NOT EXISTS "selectedOptionValue" VARCHAR(255);
ALTER TABLE "FeedbackAnswer" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB;
