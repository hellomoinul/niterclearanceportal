-- ============================================================================
-- M-v3.1 — Soft-delete for users (expert review item)
--
-- Gives the Admin -> Users page a way to disable an account without deleting
-- the row (auth.users + profiles + roles must stay for historical integrity).
--
-- Changes:
--   1) profiles.is_active  boolean NOT NULL DEFAULT true
--   2) admin_set_user_active(p_user_id, p_active) — SECURITY DEFINER RPC that
--      only an admin can call, refuses to deactivate the caller, and writes a
--      user_deactivated / user_activated audit_log row.
--   3) Login guard: login_email_for_user_code (the portal-ID -> email lookup
--      the login page uses) only resolves accounts with is_active = true, so a
--      deactivated user can no longer sign in even though their row remains.
--   4) RPC is the ONLY sanctioned write path (admins already have UPDATE on
--      profiles via RLS; the RPC centralises the context, the audit entry and
--      the self-deactivation guard).
--
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste -> Run
-- Safe to re-run (idempotent).
-- ============================================================================

-- 1) Column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2) Admin-only toggle RPC
CREATE OR REPLACE FUNCTION public.admin_set_user_active(
  p_user_id uuid,
  p_active  boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_exists   boolean;
  v_name     text;
  v_target   text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can change account status';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot deactivate your own account';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE public.profiles
     SET is_active = p_active
   WHERE id = p_user_id;

  -- Audit trail
  SELECT full_name INTO v_name   FROM public.profiles WHERE id = auth.uid();
  SELECT full_name INTO v_target FROM public.profiles WHERE id = p_user_id;

  INSERT INTO public.audit_log (actor_id, actor_name, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    coalesce(v_name, 'system'),
    CASE WHEN p_active THEN 'user_activated' ELSE 'user_deactivated' END,
    'profile',
    p_user_id,
    v_target
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) TO authenticated;

-- 3) Login guard — a deactivated account cannot resolve its email from its ID.
CREATE OR REPLACE FUNCTION public.login_email_for_user_code(p_user_code text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(u.email)
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(regexp_replace(p.user_code, '[^a-zA-Z0-9]', '', 'g'))
      = lower(regexp_replace(btrim(p_user_code), '[^a-zA-Z0-9]', '', 'g'))
    AND p.is_active = true
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.login_email_for_user_code(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.login_email_for_user_code(text) TO anon, authenticated;