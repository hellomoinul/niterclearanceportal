-- ============================================================================
-- M-v2.7 — Resubmit comment + escalation resolution (review items 4c, 4d)
--
-- Closes the two remaining open review items:
--   4c  "Re-submit for final approval" has no comment field
--   4d  Escalation has no defined resolution step
--
-- Changes:
--   1) department_reviews.resubmit_comment  — student's note on re-submit,
--      shown to the office that reviews it next. Cleared whenever an office
--      takes a decision so it does not leak stale explanation into later steps.
--   2) reopen_rejected_review(p_review_id, p_comment text DEFAULT NULL)
--      — the student-owned RPC now records the resubmit comment and clears
--      the escalated flag, since their re-submission means handling continues.
--   3) resolve_escalation(p_review_id, p_decision text, p_note text)
--      — Administration / admin action that closes an escalated case:
--        * 'approved'  -> status = approved, escalated = false
--        * 'rejected'  -> status = rejected, escalated = false
--      A note is mandatory. Requires the caller to belong to the final
--      sign-off office (Administration) or be an admin.
--      Writes a distinct `escalation_resolved` audit_log row (decision + note)
--      in addition to the generic review_<status> row from the
--      log_review_status_change trigger, so overrides are distinguishable
--      from normal office decisions in the log.
--
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste -> Run
-- ============================================================================

-- 1) Store the student's re-submit note.
ALTER TABLE public.department_reviews
  ADD COLUMN IF NOT EXISTS resubmit_comment text;

-- 2) Student-owned re-submit now records a comment and clears escalation.
CREATE OR REPLACE FUNCTION public.reopen_rejected_review(
  p_review_id uuid,
  p_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app uuid;
  v_status text;
  v_student uuid;
BEGIN
  SELECT application_id, status INTO v_app, v_status
    FROM public.department_reviews
   WHERE id = p_review_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  SELECT student_id INTO v_student
    FROM public.clearance_applications
   WHERE id = v_app;

  IF v_student IS NULL OR v_student <> auth.uid() THEN
    RAISE EXCEPTION 'Not your application';
  END IF;

  IF v_status <> 'rejected' THEN
    RAISE EXCEPTION 'Only rejected sections can be reopened';
  END IF;

  UPDATE public.department_reviews
     SET status = 'pending',
         escalated = false,
         resubmit_comment = coalesce(NULLIF(trim(p_comment), ''), NULL)
   WHERE id = p_review_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reopen_rejected_review(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reopen_rejected_review(uuid, text) TO authenticated;

-- 3) Administration / admin action to close an escalated case.
CREATE OR REPLACE FUNCTION public.resolve_escalation(
  p_review_id uuid,
  p_decision text,
  p_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app uuid;
  v_status text;
  v_is_final_resolver boolean;
  v_is_admin boolean;
  v_note text := NULLIF(trim(p_note), '');
  v_dept text;
  v_student_code text;
  v_actor_name text;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  IF v_note IS NULL THEN
    RAISE EXCEPTION 'A note is required to resolve an escalation';
  END IF;

  SELECT application_id, status INTO v_app, v_status
    FROM public.department_reviews
   WHERE id = p_review_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  -- Escalations are resolved by the final sign-off office (Administration)
  -- or by admins — the same people the escalation is notified to — regardless
  -- of which office the student got stuck at.
  SELECT EXISTS (
    SELECT 1
      FROM public.office_departments od
      JOIN public.departments d ON d.id = od.department_id
     WHERE od.user_id = auth.uid() AND d.is_final_signoff
  ) INTO v_is_final_resolver;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) INTO v_is_admin;

  IF NOT (coalesce(v_is_final_resolver, false) OR v_is_admin) THEN
    RAISE EXCEPTION 'Only Administration staff or admins can resolve an escalation';
  END IF;

  -- Note: the caller approves their own office's review here, which matches the
  -- existing model (Administration approves the final sign-off in their queue).
  IF p_decision = 'approved' THEN
    UPDATE public.department_reviews
       SET status = 'approved',
           escalated = false,
           remarks = coalesce(remarks, v_note),
           reviewed_by = auth.uid(),
           reviewed_at = now()
     WHERE id = p_review_id;
  ELSE
    UPDATE public.department_reviews
       SET status = 'rejected',
           escalated = false,
           remarks = v_note,
           reviewed_by = auth.uid(),
           reviewed_at = now()
     WHERE id = p_review_id;
  END IF;

  -- Distinct audit entry so an escalation override does not read the same as a
  -- normal office decision in the log. The generic log_review_status_change
  -- trigger still records its own review_<status> row; this one marks the
  -- override explicitly with the resolver's note.
  SELECT d.name INTO v_dept
    FROM public.departments d
    JOIN public.department_reviews r ON r.department_id = d.id
   WHERE r.id = p_review_id;

  SELECT p.user_code INTO v_student_code
    FROM public.department_reviews r
    JOIN public.clearance_applications a ON a.id = r.application_id
    JOIN public.profiles p ON p.id = a.student_id
   WHERE r.id = p_review_id;

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_log (actor_id, actor_name, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    coalesce(v_actor_name, 'system'),
    'escalation_resolved',
    'department_review',
    p_review_id,
    concat_ws(' · ', v_dept, v_student_code, 'decision: ' || p_decision, 'note: ' || v_note)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_escalation(uuid, text, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_escalation(uuid, text, text) TO authenticated;