-- Rename N/A self-declaration remark text.
-- The old text "N/A - student declared" (and earlier em-dash variant "N/A — student declared")
-- rendered ambiguously. Replace with a clearer, encoding-safe phrasing.

-- 1. Fix any existing rows (both the em-dash and ASCII-dash variants).
UPDATE public.department_reviews
SET remarks = 'Student declared N/A'
WHERE remarks IN ('N/A - student declared', 'N/A — student declared')
  AND is_na = true;

-- 2. Ensure the declare_departments_na RPC writes the new phrasing going forward.
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
      remarks = 'Student declared N/A',
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

REVOKE EXECUTE ON FUNCTION public.declare_departments_na(uuid, text[]) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.declare_departments_na(uuid, text[]) TO authenticated;
