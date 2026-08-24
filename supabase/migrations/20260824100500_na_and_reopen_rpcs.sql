-- N/A self-declaration + student review reopen RPCs.
-- RLS on department_reviews only permits registrar/admin updates, so students need
-- SECURITY DEFINER RPCs with strict ownership checks for two flows:

-- 1) declare_departments_na: called right after application submit. Marks chosen
--    departments as approved with is_na = true. Guards:
--      - caller owns the application
--      - accounts/head can never be declared N/A
--      - only untouched pending reviews with zero documents qualify

CREATE OR REPLACE FUNCTION public.declare_departments_na(
  p_application_id uuid,
  p_department_codes text[]
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_updated int := 0;
BEGIN
  SELECT student_id INTO v_owner FROM clearance_applications WHERE id = p_application_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not your application';
  END IF;

  UPDATE department_reviews dr
  SET status = 'approved',
      is_na = true,
      remarks = 'N/A — student declared',
      reviewed_at = now()
  FROM departments d
  WHERE dr.department_id = d.id
    AND dr.application_id = p_application_id
    AND d.code = ANY(p_department_codes)
    AND d.code NOT IN ('accounts', 'head')
    AND dr.status = 'pending'
    AND NOT EXISTS (SELECT 1 FROM documents doc WHERE doc.review_id = dr.id);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- 2) reopen_rejected_review: student flips a rejected section back to pending after
--    re-uploading documents. Previously done via a direct client UPDATE which RLS
--    blocks (only registrar/admin can update reviews). Guards:
--      - review exists and belongs to caller's application
--      - current status must be 'rejected'

CREATE OR REPLACE FUNCTION public.reopen_rejected_review(p_review_id uuid)
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
  SELECT application_id, status INTO v_app, v_status FROM department_reviews WHERE id = p_review_id;
  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  SELECT student_id INTO v_student FROM clearance_applications WHERE id = v_app;
  IF v_student IS NULL OR v_student <> auth.uid() THEN
    RAISE EXCEPTION 'Not your application';
  END IF;
  IF v_status <> 'rejected' THEN
    RAISE EXCEPTION 'Only rejected sections can be reopened';
  END IF;
  UPDATE department_reviews SET status = 'pending' WHERE id = p_review_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.declare_departments_na(uuid, text[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reopen_rejected_review(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.declare_departments_na(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_rejected_review(uuid) TO authenticated;
