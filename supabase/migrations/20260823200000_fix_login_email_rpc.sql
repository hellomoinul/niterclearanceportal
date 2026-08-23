-- Hotfix: login_email_for_user_code must return the TRUE auth email from auth.users,
-- not the potentially-stale personal_email on profiles (used for notifications).
-- Legacy accounts have synthetic @niter.portal auth emails but real emails in personal_email.

CREATE OR REPLACE FUNCTION public.login_email_for_user_code(p_user_code text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(u.email)
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(trim(p.user_code)) = lower(trim(p_user_code))
$$;
