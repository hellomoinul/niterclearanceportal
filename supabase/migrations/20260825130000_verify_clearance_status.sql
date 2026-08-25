-- Public RPC to verify a student's clearance status.
-- Called by the public /verify page — no auth required.
-- SECURITY DEFINER so it can read all tables regardless of RLS.

CREATE OR REPLACE FUNCTION public.verify_clearance_status(p_user_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app record;
  v_total int;
  v_approved int;
  v_student_name text;
  v_program text;
  v_batch text;
  v_cleared_at timestamptz;
BEGIN
  -- Find the student's latest clearance application
  SELECT ca.id, ca.cleared_at, p.full_name, p.program, p.batch
  INTO v_app.id, v_cleared_at, v_student_name, v_program, v_batch
  FROM clearance_applications ca
  JOIN profiles p ON p.id = ca.student_id
  WHERE p.user_code = p_user_code
  ORDER BY ca.submitted_at DESC
  LIMIT 1;

  IF v_app.id IS NULL THEN
    RETURN jsonb_build_object(
      'verified', false,
      'reason', 'no_application'
    );
  END IF;

  -- Count total and approved reviews (approved includes N/A)
  SELECT
    count(*) FILTER (WHERE dr.status = 'approved' OR dr.is_na),
    count(*)
  INTO v_approved, v_total
  FROM department_reviews dr
  WHERE dr.application_id = v_app.id;

  IF v_total = 0 THEN
    RETURN jsonb_build_object(
      'verified', false,
      'reason', 'no_reviews'
    );
  END IF;

  RETURN jsonb_build_object(
    'verified', v_approved = v_total,
    'total', v_total,
    'approved', v_approved,
    'student_name', v_student_name,
    'program', v_program,
    'batch', v_batch,
    'cleared_at', v_cleared_at,
    'user_code', p_user_code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_clearance_status(text) TO anon;
