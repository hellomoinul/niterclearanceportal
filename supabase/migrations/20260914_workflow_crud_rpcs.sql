-- ============================================================================
-- M-v3.5 — Workflow add/remove office RPCs (expert review item)
--
-- Lets the Admin -> Workflow UI add and remove offices through RPCs instead of
-- direct table writes, with the cascade handled safely in one transaction.
--
--   admin_add_office(name, code, requirement, sort_order) -> uuid
--       - admin only
--       - code normalised to upper-case, must be unique
--       - sort_order auto-computed (max + 10) when omitted
--       - is_final_signoff defaults false; the final sign-off office is
--         Administration and is never created through the UI
--       - writes an office_added audit_log row
--
--   admin_remove_office(dept_id)
--       - admin only
--       - refuses to remove the final sign-off office (Administration)
--       - refuses to remove an office any department_review references, so
--         existing applications and their clearance history are never broken
--       - otherwise deletes office_departments bindings, then the office row
--       - re-sequences sort_order so the workflow list stays contiguous
--       - writes an office_removed audit_log row
--
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste -> Run
-- ============================================================================

-- 1) Add office --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_add_office(
  p_name        text,
  p_code        text,
  p_requirement text DEFAULT NULL,
  p_sort_order  int  DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_code  text := upper(btrim(p_code));
  v_name  text := btrim(p_name);
  v_order int  := p_sort_order;
  v_id    uuid;
  v_actor text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can modify the workflow';
  END IF;

  IF v_name = '' OR v_code = '' THEN
    RAISE EXCEPTION 'Office name and code are required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.departments WHERE code = v_code) THEN
    RAISE EXCEPTION 'An office with code "%" already exists', v_code;
  END IF;

  IF v_order IS NULL THEN
    SELECT coalesce(max(sort_order), 0) + 10 INTO v_order FROM public.departments;
  END IF;

  INSERT INTO public.departments (name, code, requirement, sort_order, is_final_signoff)
  VALUES (v_name, v_code, NULLIF(btrim(coalesce(p_requirement, '')), ''), v_order, false)
  RETURNING id INTO v_id;

  SELECT full_name INTO v_actor FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_log (actor_id, actor_name, action, entity, entity_id, details)
  VALUES (auth.uid(), coalesce(v_actor, 'system'), 'office_added', 'department', v_id,
          v_name || ' (' || v_code || ')');

  RETURN v_id;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_add_office(text, text, text, int) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_add_office(text, text, text, int) TO authenticated;

-- 2) Remove office -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_remove_office(p_dept_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_name     text;
  v_code     text;
  v_final    boolean;
  v_reviews  bigint;
  v_actor    text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can modify the workflow';
  END IF;

  SELECT name, code, is_final_signoff
    INTO v_name, v_code, v_final
    FROM public.departments
   WHERE id = p_dept_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Office not found';
  END IF;

  IF v_final THEN
    RAISE EXCEPTION 'The final sign-off office (%) cannot be removed', v_name;
  END IF;

  SELECT count(*) INTO v_reviews
    FROM public.department_reviews
   WHERE department_id = p_dept_id;

  IF v_reviews > 0 THEN
    RAISE EXCEPTION 'Office "%" has % clearance review(s); it cannot be removed without breaking history',
                    v_name, v_reviews;
  END IF;

  -- Unlink staff bindings first, then the office row. (department_reviews is
  -- guaranteed empty at this point, so the department FK cannot block.)
  DELETE FROM public.office_departments WHERE department_id = p_dept_id;
  DELETE FROM public.departments WHERE id = p_dept_id;

  -- Re-sequence sort_order to stay contiguous after the removal.
  WITH renumbered AS (
    SELECT id, row_number() OVER (ORDER BY sort_order, name) * 10 AS new_order
    FROM public.departments
  )
  UPDATE public.departments d
     SET sort_order = r.new_order
    FROM renumbered r
   WHERE d.id = r.id
     AND d.sort_order <> r.new_order;

  SELECT full_name INTO v_actor FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_log (actor_id, actor_name, action, entity, entity_id, details)
  VALUES (auth.uid(), coalesce(v_actor, 'system'), 'office_removed', 'department', p_dept_id,
          v_name || ' (' || v_code || ')');
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_remove_office(uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_remove_office(uuid) TO authenticated;