-- ============================================================================
-- M-v3.2 — Escalation aggregation (expert review item)
--
-- Backend for the admin dashboard "Needs Attention" panel and the new
-- /admin/escalations page. Exposes every open escalation in one shape while
-- respecting the existing RLS on department_reviews / profiles:
--
--   * built WITH (security_invoker = true), so the underlying RLS policies
--     are evaluated as the CALLING user rather than the view owner — without
--     that, the view would bypass RLS and leak every escalation to anyone:
--       - admins  see all open escalations
--       - office  staff see only escalations for their own office
--       - students see only escalations on their own application
--   * "age in days" is computed from department_reviews.created_at (the
--     escalation flag is set by handle_review_rejection after >= 3 attempts).
--
-- Grant: SELECT on the view to authenticated (Supabase resolves underlying
-- RLS per row). The view is intentionally NOT granted to anon.
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste -> Run
-- ============================================================================

CREATE OR REPLACE VIEW public.open_escalations
WITH (security_invoker = true) AS
SELECT
  r.id                  AS review_id,
  r.application_id,
  a.student_id,
  r.department_id       AS office_id,
  d.name                AS office_name,
  d.code                AS office_code,
  p.user_code           AS student_code,
  p.full_name           AS student_name,
  p.batch               AS student_batch,
  r.attempts            AS rejection_count,
  r.status              AS review_status,
  r.created_at          AS escalated_at,
  greatest(0, floor(extract(epoch FROM (now() - r.created_at)) / 86400))::integer
                        AS age_days
FROM public.department_reviews r
JOIN public.departments d            ON d.id = r.department_id
JOIN public.clearance_applications a ON a.id = r.application_id
JOIN public.profiles p               ON p.id = a.student_id
WHERE r.escalated = true;

REVOKE ALL ON public.open_escalations FROM PUBLIC;
GRANT  SELECT ON public.open_escalations TO authenticated;