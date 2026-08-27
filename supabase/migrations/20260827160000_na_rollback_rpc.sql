-- M15: N/A rollback RPC — revert an N/A-auto-approved review back to pending.
--
-- N/A declarations are trusted at face value at submit time (declare_departments_na
-- auto-approves with is_na = true). Until now there was NO way to revert a caught
-- false declaration except a manual DB fix: reopen_rejected_review only works on
-- 'rejected' reviews, and an N/A review sits at 'approved'.
--
-- This RPC flips an N/A-approved review back to 'pending' (is_na = false, remarks
-- cleared) so the owning office can actually review it. Guards:
--   - caller is the student who owns the application, OR
--   - caller is a registrar assigned to that department, OR
--   - caller is an admin
--   - the review must currently be N/A-approved with no documents (so we never
--     un-approve a genuine approval, and never clobber uploaded evidence)
--
-- SECURITY DEFINER mirrors declare_departments_na / reopen_rejected_review.

CREATE OR REPLACE FUNCTION public.reopen_na_review(p_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_app uuid;
  v_dept uuid;
  v_owner uuid;
  v_na boolean;
  v_status text;
BEGIN
  SELECT application_id, department_id, is_na, status
    INTO v_app, v_dept, v_na, v_status
  FROM public.department_reviews
  WHERE id = p_review_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF NOT (v_na AND v_status = 'approved') THEN
    RAISE EXCEPTION 'Only an N/A-approved review can be reverted';
  END IF;

  IF NOT (public.has_role(auth.uid(), 'admin')
          OR public.registrar_in_department(auth.uid(), v_dept)
          OR public.owns_application(auth.uid(), v_app)) THEN
    RAISE EXCEPTION 'Not permitted to revert this review';
  END IF;

  IF EXISTS (SELECT 1 FROM public.documents doc WHERE doc.review_id = p_review_id) THEN
    RAISE EXCEPTION 'Cannot revert an N/A review that already has documents';
  END IF;

  UPDATE public.department_reviews
  SET is_na = false,
      status = 'pending',
      remarks = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL
  WHERE id = p_review_id;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.reopen_na_review(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reopen_na_review(uuid) TO authenticated;
