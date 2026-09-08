-- ============================================================================
-- M-v2.8b — Drop legacy decorative workflow_steps (S7)
--
-- The v2 flow is driven entirely by departments.sort_order (managed through the
-- Office Editor, S-v2.1, at /admin/workflow). workflow_steps was a leftover
-- S7 list that nothing in the clearance flow read; it only backed a now-replaced
-- admin page. Drop the table and its RLS policy together.
--
-- Applied after admin/workflow.tsx was replaced with the Office Editor.
-- ============================================================================

DROP POLICY IF EXISTS "admins manage workflow_steps" ON public.workflow_steps;

DROP TABLE IF EXISTS public.workflow_steps;