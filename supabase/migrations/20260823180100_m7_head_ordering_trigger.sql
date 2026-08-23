-- Migration: M7 — Head-ordering trigger
-- BEFORE UPDATE: blocks Head approval until all 7 other offices have approved.

BEGIN;

CREATE OR REPLACE FUNCTION public.guard_head_approval_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  head_dept boolean;
  missing_count int;
BEGIN
  -- Only fire when Head department approves
  SELECT d.is_final_signoff INTO head_dept
  FROM public.departments d
  WHERE d.id = NEW.department_id;

  IF NOT head_dept THEN
    RETURN NEW;
  END IF;

  -- Only block on approval (not rejection or other status changes)
  IF NEW.status <> 'approved' OR OLD.status IS NOT DISTINCT FROM 'approved' THEN
    RETURN NEW;
  END IF;

  -- Count how many non-head offices have NOT yet approved this application
  SELECT count(*) INTO missing_count
  FROM public.department_reviews dr
  JOIN public.departments d ON d.id = dr.department_id
  WHERE dr.application_id = NEW.application_id
    AND d.is_final_signoff = false
    AND dr.status <> 'approved';

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Head cannot approve until all % other department(s) have approved', missing_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_head_approval_order ON public.department_reviews;
CREATE TRIGGER trg_guard_head_approval_order
BEFORE UPDATE OF status ON public.department_reviews
FOR EACH ROW
EXECUTE FUNCTION public.guard_head_approval_order();

REVOKE EXECUTE ON FUNCTION public.guard_head_approval_order() FROM anon, authenticated, PUBLIC;

COMMIT;
