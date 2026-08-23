-- Migration: M5 — Status-forgery patch
-- BEFORE UPDATE trigger rejects status/cleared_at changes by non-admins.
-- Prevents students from using the Supabase client to mark themselves as cleared.

BEGIN;

CREATE OR REPLACE FUNCTION public.guard_clearance_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if actor is admin
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Allow if status and cleared_at are unchanged
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.cleared_at IS NOT DISTINCT FROM OLD.cleared_at THEN
    RETURN NEW;
  END IF;

  -- Block: non-admin tried to change status or cleared_at
  RAISE EXCEPTION 'Only administrators can change clearance status';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_clearance_status ON public.clearance_applications;
CREATE TRIGGER trg_guard_clearance_status
BEFORE UPDATE OF status, cleared_at ON public.clearance_applications
FOR EACH ROW
EXECUTE FUNCTION public.guard_clearance_status();

REVOKE EXECUTE ON FUNCTION public.guard_clearance_status() FROM anon, authenticated, PUBLIC;

COMMIT;
