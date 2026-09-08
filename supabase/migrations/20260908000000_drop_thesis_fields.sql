-- ============================================================================
-- M-v2.6 — Drop the thesis/graduation fields (Snapshot decision 4)
--
-- Removes the legacy academic-closing fields that were carried over from the
-- earlier model but are no longer needed on the clearance application:
--   * thesis_title
--   * supervisor_name
--   * expected_graduation
--
-- Clearance is now a pure office-sequenced procedure (documents + sign-off),
-- so these free-text fields add no clearance value. Exam Section handles
-- exam/transcript verification instead; Dept. Head does the program-specific
-- sign-off on credits, not on the thesis topic.
--
-- Also updates the Dept. Head office copy so it no longer asks about the
-- thesis/project ("credits complete, thesis/project submitted" ->
-- "credits complete, no pending academic departments").
--
-- Safe to run: the clearance_applications table currently has zero rows
-- (all test data was purged in M-v2.2) and nothing references these columns.
--
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste -> Run
-- ============================================================================

-- 1) Drop the legacy free-text columns.
ALTER TABLE public.clearance_applications
  DROP COLUMN IF EXISTS thesis_title,
  DROP COLUMN IF EXISTS supervisor_name,
  DROP COLUMN IF EXISTS expected_graduation;

-- 2) Tidy the Dept. Head office copy (no longer references the thesis).
UPDATE public.departments
   SET requirement = 'Program-specific sign-off; all credits complete',
       document_hint = 'Final marksheet / result slip'
 WHERE code = 'head';
