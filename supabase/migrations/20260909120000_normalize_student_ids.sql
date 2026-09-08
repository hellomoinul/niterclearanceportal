-- ============================================================================
-- Normalize user_code so an ID is unique no matter how it is typed.
-- "CS 2203077", "cs2203077", "CS 2203077 " and "CS-2203077" are the SAME ID.
-- Canonical form: lower-case a-z + 0-9 only (spaces/separators removed).
-- Applies to the live DB via Supabase SQL editor / apply scripts.
-- Safe to re-run (idempotent).
-- ============================================================================

-- 1) Drop the old exact-match constraint (replaced by the normalized index below).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_code_key;

-- 2) Rewrite all codes to canonical form (keep letters, any case; strip the rest).
UPDATE public.profiles
SET user_code = lower(regexp_replace(user_code, '[^a-zA-Z0-9]', '', 'g'))
WHERE user_code IS NOT NULL;

-- 3) Legacy students registered with "CS 2203077" keep the department prefix,
--    so their canonical ID is '<prefix>xxxx'. Only restore it from the portal
--    email when that email was actually built from the ID (email local part
--    contains the current code). Students whose portal email is personal keep
--    the normalized ID from step 2.
UPDATE public.profiles p
SET user_code = split_part(u.email, '@', 1)
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = p.id
  AND ur.role = 'student'
  AND p.user_code IS NOT NULL
  AND lower(split_part(u.email, '@', 1)) LIKE '%' || lower(p.user_code) || '%';

-- 4) Uniqueness is enforced on the normalized form.
DROP INDEX IF EXISTS profiles_user_code_norm_key;
CREATE UNIQUE INDEX profiles_user_code_norm_key
  ON public.profiles (lower(regexp_replace(user_code, '[^a-zA-Z0-9]', '', 'g')));

-- 5) Sign-in ID lookup: treat typed variants as the same ID.
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
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.login_email_for_user_code(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.login_email_for_user_code(text) TO authenticated;

-- 6) admin_create_account: normalize the code and reject already-taken IDs.
CREATE OR REPLACE FUNCTION public.admin_create_account(
  p_full_name text,
  p_user_code  text,
  p_email      text,
  p_password   text,
  p_role       public.app_role,
  p_department_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $fn$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_email   text := lower(btrim(p_email));
  v_code    text := lower(regexp_replace(btrim(p_user_code), '[^a-zA-Z0-9]', '', 'g'));
  v_name    text := btrim(p_full_name);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can create accounts';
  END IF;

  IF v_name = '' OR v_code = '' OR v_email = '' THEN
    RAISE EXCEPTION 'Name, user code and email are required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles
             WHERE lower(regexp_replace(user_code, '[^a-zA-Z0-9]', '', 'g')) = v_code) THEN
    RAISE EXCEPTION 'That ID is already in use by another account';
  END IF;

  IF char_length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  IF p_role NOT IN ('office', 'admin') THEN
    RAISE EXCEPTION 'Only office and admin accounts can be created here; students self-register';
  END IF;

  IF p_role = 'office' AND p_department_id IS NULL THEN
    RAISE EXCEPTION 'Office accounts must be assigned to an office';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'A user with that portal ID already exists';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    false
  );

  INSERT INTO public.profiles (id, user_code, full_name)
  VALUES (v_user_id, v_code, v_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, p_role);

  IF p_role = 'office' AND p_department_id IS NOT NULL THEN
    INSERT INTO public.office_departments (user_id, department_id)
    VALUES (v_user_id, p_department_id);
  END IF;

  RETURN v_user_id;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_create_account(text, text, text, text, public.app_role, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_create_account(text, text, text, text, public.app_role, uuid) TO authenticated;