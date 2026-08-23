-- Migration: login_email_for_user_code RPC
-- SECURITY DEFINER: given a NITER ID, returns the account's real auth email.
-- Used by the smart login field when input is not an email.

CREATE OR REPLACE FUNCTION public.login_email_for_user_code(p_user_code text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(trim(p.personal_email))
  FROM public.profiles p
  WHERE lower(trim(p.user_code)) = lower(trim(p_user_code))
    AND p.personal_email IS NOT NULL
    AND trim(p.personal_email) <> ''
$$;

REVOKE EXECUTE ON FUNCTION public.login_email_for_user_code(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.login_email_for_user_code(text) TO anon;
GRANT  EXECUTE ON FUNCTION public.login_email_for_user_code(text) TO authenticated;
